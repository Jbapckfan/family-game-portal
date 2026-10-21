import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
const glyph=f=>f===0?'●':f>0?'▲':'▼';
const feedbackLabel=f=>f===0?'exact':f>0?'secret letter is later':'secret letter is earlier';
mountDailyGame({
 id:'claude-tumbler',name:'Tumbler',creator:'Claude',credit:'Developed by Claude',accent:'#385d85',
 intro:'Five dials. Six turns. Feel your way to the word.',hintLabel:'Lock one dial · assisted',
 instructions:[
  'Guess the hidden five-letter word in six tries. Each position gives its own alphabetical feedback.',
  '▲ means the secret letter is later in the alphabet than your letter. ▼ means earlier. ● means an exact match at that position.',
  'The five dials show the remaining letter range at each position. Feedback says nothing about the other positions.',
  'Type a complete five-letter word every time, including letters you already know. Your current guess is shown separately from the dial ranges.',
  'Only words in the supplied guess list count. Duplicate guesses and unlisted words do not use a turn. Letters impossible in every position fade on the keyboard but can still be typed.',
  'A hint locks one uncertain dial and records assistance. You still need to submit the whole word. Reveal solution ends the puzzle as revealed.'
 ],
 puzzles:PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=E.getStatus(p,s),finished=status!=='playing',r=E.ranges(p,s);
  const focused=document.activeElement,focusId=root.contains(focused)?focused.id:null,selection=focusId==='tumbler-input'?[focused.selectionStart,focused.selectionEnd]:null;
  root.tabIndex=-1;
  root.innerHTML=`<section class="panel tumbler-panel">
   <div class="tumbler-hud"><strong>${status==='won'?'Lock open':status==='revealed'?'Lock revealed':status==='lost'?'Still locked':`${6-s.guesses.length} turns left`}</strong><span>${r.locked.filter(Boolean).length} of 5 dials locked</span></div>
   <div class="tumbler-dials" aria-label="Remaining alphabetical ranges">${[0,1,2,3,4].map(i=>`<div class="tumbler-dial ${r.locked[i]?'locked':''}" aria-label="Position ${i+1}: ${r.locked[i]?`locked at ${p.answer[i].toUpperCase()}`:`${E.ALPHABET[r.lo[i]].toUpperCase()} through ${E.ALPHABET[r.hi[i]].toUpperCase()}, ${r.hi[i]-r.lo[i]+1} letters remain`}${s.hints.includes(i)?', hinted':''}"><small>Dial ${i+1}</small><strong>${r.locked[i]?p.answer[i].toUpperCase():`${E.ALPHABET[r.lo[i]].toUpperCase()}<i>–</i>${E.ALPHABET[r.hi[i]].toUpperCase()}`}</strong><span>${r.locked[i]?(s.hints.includes(i)?'★ hinted':'● locked'):`${r.hi[i]-r.lo[i]+1} letters`}</span></div>`).join('')}</div>
   <div class="tumbler-legend"><span>▲ Later</span><span>▼ Earlier</span><span>● Exact</span></div>
   <div class="tumbler-history" aria-label="Six guess rows">${[0,1,2,3,4,5].map(n=>{const word=s.guesses[n],feedback=word?E.feedback(word,p.answer):null,current=n===s.guesses.length&&!finished;return `<div class="tumbler-row ${current?'current':''}" aria-label="${word?`Guess ${n+1}: ${word.toUpperCase()}`:current?'Your current guess':`Unused guess ${n+1}`}">${[0,1,2,3,4].map(i=>`<span class="tumbler-cell ${word&&feedback[i]===0?'exact':''} ${!word?'empty':''}" ${word?`aria-label="Position ${i+1}, ${word[i].toUpperCase()}: ${feedbackLabel(feedback[i])}"`:''}>${word?`${word[i].toUpperCase()}<b>${glyph(feedback[i])}</b>`:current?esc((s.draft[i]||'').toUpperCase()):''}</span>`).join('')}</div>`;}).join('')}</div>
   ${!finished?`<form id="tumbler-form"><label class="tumbler-input-label" for="tumbler-input">Your next five-letter word</label><div class="tumbler-entry"><input id="tumbler-input" class="word-input" type="text" value="${esc(s.draft)}" maxlength="5" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="WORD"><button id="tumbler-submit" class="button primary" type="submit">Turn lock</button></div></form><div class="tumbler-keyboard" role="group" aria-label="Word keyboard">${['qwertyuiop','asdfghjkl','zxcvbnm'].map((row,n)=>`<div class="tumbler-key-row">${n===2?'<button id="tumbler-key-enter" type="button" class="tumbler-key wide" data-key="ENTER" aria-label="Submit word">Enter</button>':''}${[...row].map(c=>{const known=E.keyState(p,s,c);return `<button id="tumbler-key-${c}" type="button" class="tumbler-key ${known}" data-key="${c}" aria-label="Letter ${c.toUpperCase()}${known==='locked'?', confirmed in a position':known==='excluded'?', ruled out in every position':''}">${c.toUpperCase()}</button>`;}).join('')}${n===2?'<button id="tumbler-key-back" type="button" class="tumbler-key wide" data-key="BACK" aria-label="Delete last letter">⌫</button>':''}</div>`).join('')}</div>`:`<div class="tumbler-answer"><span>${status==='won'?'Unlocked word':'The hidden word'}</span><strong>${esc(p.answer.toUpperCase())}</strong></div>`}
   <p class="muted tumbler-footer">${s.hints.length} hints used · arrows apply to one position at a time</p>
  </section>`;
  function act(fn,...args){const result=fn(p,s,...args),next=result?.state||result;if(!next||next===s)announce(result?.message||'');else commit(next,result?.message);}
  if(!finished){
   root.querySelector('#tumbler-input').oninput=event=>commit(E.setDraft(p,s,event.target.value));
   root.querySelector('#tumbler-form').onsubmit=event=>{event.preventDefault();act(E.submit);};
   for(const b of root.querySelectorAll('[data-key]'))b.onclick=()=>b.dataset.key==='ENTER'?act(E.submit):b.dataset.key==='BACK'?act(E.backspace):act(E.typeKey,b.dataset.key);
  }
  root.onkeydown=event=>{
   if(finished||event.ctrlKey||event.altKey||event.metaKey||event.target.tagName==='INPUT')return;
   if(/^[a-zA-Z]$/.test(event.key)){event.preventDefault();act(E.typeKey,event.key.toLowerCase());}
   else if(event.key==='Backspace'){event.preventDefault();act(E.backspace);}
   else if(event.key==='Enter'&&(event.target===root||event.target.hasAttribute('data-key'))){event.preventDefault();act(E.submit);}
   else if(event.key==='Escape'){event.preventDefault();act(E.setDraft,'');}
  };
  const replacement=focusId&&root.querySelector(`#${focusId}`);if(replacement&&!replacement.disabled){replacement.focus({preventScroll:true});if(selection)replacement.setSelectionRange(...selection.map(n=>Math.min(n,s.draft.length)));}
 }
});
