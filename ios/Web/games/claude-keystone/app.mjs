import {assistanceCount} from './engine.mjs';
import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
const keyboard=()=>`<div class="keystone-keyboard" role="group" aria-label="Word keyboard">${['qwertyuiop','asdfghjkl','zxcvbnm'].map((row,i)=>`<div class="key-row">${i===2?'<button id="keystone-key-enter" type="button" class="word-key wide" data-key="ENTER" aria-label="Submit word">Enter</button>':''}${[...row].map(c=>`<button id="keystone-key-${c}" type="button" class="word-key" data-key="${c}" aria-label="Letter ${c.toUpperCase()}">${c.toUpperCase()}</button>`).join('')}${i===2?'<button id="keystone-key-back" type="button" class="word-key wide" data-key="BACK" aria-label="Delete last letter">⌫</button>':''}</div>`).join('')}</div>`;
mountDailyGame({
 assistanceCount,
 id:'claude-keystone',name:'Keystone',creator:'Claude',credit:'Developed by Claude',accent:'#306e92',
 intro:'One hidden word holds five others together.',hintLabel:'Hint · clues affect score',
 instructions:[
  'These are the rules for new rounds. A restored saved round keeps its earlier word rules; new Practice rounds use the expanded game dictionary.',
  'Find a hidden word that joins each of five clue words. It may go before or after a clue. A join can be a compound or pure spelling: CAR + PET makes CARPET.',
  'Every accepted solution must join all five clues, including the hidden ones. More than one word can work. A word fitting only the visible clues may still need another guess. Two clues appear first. Submit a word of three or more letters. A wrong accepted guess reveals the next clue and shows which visible clues your guess joins.',
  'Once all five clues are visible, you have two wrong guesses left for that arch. Repeated words, clue words, and words outside the supplied list do not cost a try.',
  'Your score for a solved arch is the number of clues visible: 2 is best, 5 is highest. A missed arch scores 6. Complete all three arches; a perfect day scores 6.',
  'Review each completed arch, then tap Next arch. The day counts as solved only when you solve all three arches.',
  'A hint reveals another clue, increasing a later solve’s score. After all clues show, hints reveal successive letters of the keystone. Hints do not submit answers. Reveal solution ends the whole puzzle as revealed.'
 ],
 puzzles:PUZZLES,createState:E.createExpandedState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=E.getStatus(p,s),finished=status!=='playing',i=E.currentIndex(p,s),round=p.rounds[i],r=E.roundView(round,s.rounds[i],s.vocabulary),active=!finished&&!s.awaitingNext;
  const focused=document.activeElement,focusId=root.contains(focused)?focused.id:null,selection=focusId==='keystone-input'?[focused.selectionStart,focused.selectionEnd]:null;
  root.tabIndex=-1;
  root.innerHTML=`<section class="panel keystone-panel">
   <ol class="keystone-rounds" aria-label="Three daily arches">${p.rounds.map((x,n)=>{const v=E.roundView(x,s.rounds[n],s.vocabulary);return `<li class="${n===i&&!finished?'current':''} ${v.status==='won'?'solved':v.status==='lost'?'missed':''}"><span>Arch ${n+1}</span><strong>${v.status==='won'?v.score:v.status==='lost'?'6':status==='revealed'?'Shown':n===i?`${v.clues} clues`:'—'}</strong></li>`;}).join('')}</ol>
   ${!finished?`<div class="keystone-prompt"><h2>${s.awaitingNext?(r.status==='won'?'This arch stands':'The missing keystone'):'Which word fits all five?'}</h2><span class="pill">${r.clues===5?`${2-r.strikes} ${r.strikes===1?'try':'tries'} left`:`${r.clues} of 5 clues`}</span></div>
   <div class="keystone-arch" aria-label="Clue stones">${round.clues.map((c,n)=>`<div class="keystone-stone ${n>=r.clues&&!s.awaitingNext?'concealed':''}"><small>${n+1}</small><span>${n<r.clues||s.awaitingNext?esc(c.w.toUpperCase()):'?'}</span>${n>=r.clues&&!s.awaitingNext?'<em>hidden</em>':''}</div>`).join('')}</div>
   ${s.awaitingNext?`<div class="keystone-key solved-key ${r.status==='lost'?'missed-key':''}">${esc((r.answer??round.k).toUpperCase())}<small>Score ${r.score}</small></div><ul class="keystone-joins">${round.clues.map(c=>`<li>${esc((s.vocabulary===2?E.joinWord(r.answer??round.k,c.w,2):E.fused(round.k,c)).toUpperCase())}</li>`).join('')}</ul><button id="keystone-next" type="button" class="button primary keystone-next" data-action="next">Next arch →</button>`:`<form id="keystone-form"><label class="keystone-input-label" for="keystone-input">Your keystone</label><input id="keystone-input" class="word-input keystone-key" type="text" value="${esc(s.draft)}" maxlength="9" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" aria-describedby="keystone-input-help" placeholder="TYPE A WORD"><button id="keystone-submit" type="submit" class="button primary keystone-submit">Place keystone</button></form><p class="muted" id="keystone-input-help">${s.vocabulary===2?'Fit all five clues, including hidden ones. More than one answer can work.':'This saved round keeps earlier word rules. New Practice rounds use the expanded game dictionary.'} 3–9 letters · fewer clues, better score</p>${r.prefix?`<p class="keystone-hint">One solution starts: ${esc(round.k.slice(0,r.prefix).toUpperCase())}${' _'.repeat(round.k.length-r.prefix)}</p>`:''}${keyboard()}`}
   ${r.guesses.length?`<div class="keystone-log" aria-label="Previous guess feedback">${[...r.guesses].reverse().map(g=>`<div><b>${esc(g.word.toUpperCase())}</b><span>${g.fits.map((fit,n)=>`<i class="${fit?'fits':''}">${fit?`✓ ${esc(E.joinWord(g.word,round.clues[n].w,s.vocabulary).toUpperCase())}`:`× ${esc(round.clues[n].w.toUpperCase())}`}</i>`).join('')}</span></div>`).join('')}</div>`:''}`:`<div class="keystone-finish"><h2>${status==='won'?'All three arches stand':status==='lost'?'Three arches, one daily challenge':'The keystones revealed'}</h2>${p.rounds.map((round,n)=>{const v=E.roundView(round,s.rounds[n],s.vocabulary);return `<section class="keystone-summary"><div><strong>${esc((v.answer??round.k).toUpperCase())}</strong><span>${status==='revealed'?'Revealed':`Score ${v.score}${v.status==='lost'?' · missed':''}`}</span></div><p>${round.clues.map(c=>esc(s.vocabulary===2?E.joinWord(v.answer??round.k,c.w,2):E.fused(round.k,c))).join(' · ')}</p></section>`;}).join('')}</div>`}
   <p class="muted keystone-footer">Score ${E.total(p,s)} · 6 is perfect · ${E.hintCount(p,s)} hints</p>
  </section>`;
  function act(fn,...args){const result=fn(p,s,...args),next=result?.state||result;if(!next||next===s)announce(result?.message||'');else commit(next,result?.message);}
  if(active){
   root.querySelector('#keystone-input').oninput=event=>{
    const source=event.target,raw=source.value,sanitize=value=>value.toLowerCase().replace(/[^a-z]/g,'');
    const start=sanitize(raw.slice(0,source.selectionStart??raw.length)).length,end=sanitize(raw.slice(0,source.selectionEnd??raw.length)).length,direction=source.selectionDirection||'none';
    commit(E.setDraft(p,s,raw));const input=root.querySelector('#keystone-input');input?.focus({preventScroll:true});input?.setSelectionRange(Math.min(start,input.value.length),Math.min(end,input.value.length),direction);
   };
   root.querySelector('#keystone-form').onsubmit=event=>{event.preventDefault();act(E.submit);};
   for(const b of root.querySelectorAll('[data-key]'))b.onclick=()=>b.dataset.key==='ENTER'?act(E.submit):b.dataset.key==='BACK'?act(E.backspace):act(E.typeKey,b.dataset.key);
  }
  const next=root.querySelector('#keystone-next');if(next)next.onclick=()=>act(E.nextArch);
  root.onkeydown=event=>{
   if(!active||event.defaultPrevented||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.target.closest('input,textarea,select,[contenteditable]'))return;
   if(/^[a-zA-Z]$/.test(event.key)){event.preventDefault();act(E.typeKey,event.key.toLowerCase());root.focus({preventScroll:true});}
   else if(event.key==='Backspace'){event.preventDefault();act(E.backspace);root.focus({preventScroll:true});}
   else if(event.key==='Enter'&&event.target===root){event.preventDefault();act(E.submit);}
   else if(event.key==='Escape'){event.preventDefault();act(E.setDraft,'');}
  };
  const replacement=focusId&&root.querySelector(`#${focusId}`);if(replacement&&!replacement.disabled){replacement.focus({preventScroll:true});if(selection)replacement.setSelectionRange(...selection.map(n=>Math.min(n,s.draft.length)));}else if(selection&&next)next.focus({preventScroll:true});else if(focusId==='keystone-next'&&active)root.querySelector('#keystone-input').focus({preventScroll:true});
 }
});
