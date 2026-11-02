import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,chooseTile,submitPair,shuffle,hint,reveal} from './engine.mjs';
import {PREVIEW,createPreview,restorePreview,previewStatus,placePreview,checkPreview,revealPreview,clarifyPreview,previewShare} from './engine.mjs';

window.addEventListener('hashchange',()=>window.location.reload());
if(window.location.hash==='#daily')mountOriginal();else mountPreview();

function mountOriginal(){
 mountDailyGame({
 assistanceCount:(p,s)=>s.hinted.length,
 id:'deepseek-spare',name:'Spare',accent:'#087c99',intro:'Four perfect opposites. One word without a partner. Find what belongs together.',
 puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 instructions:['The nine words contain four pairs with opposite meanings and one spare word.','Select two words, then choose Match pair. Correct pairs move above the board.','Three different wrong pairings end the round. Repeating a wrong pairing never costs another strike.','Find all four pairs to expose the spare and solve the puzzle. A little hint highlights one pair; it stays highlighted when you shuffle.'],
 summarize:(p,s)=>`${s.solved.length} of 4 pairs found · ${s.mistakes.length} ${s.mistakes.length===1?'miss':'misses'}${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'hint':'hints'}`:''}${getStatus(p,s)==='revealed'?' · solution revealed':''}. The spare was ${p.spare}.`,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=getStatus(p,s),finished=status!=='playing',showAnswers=status==='lost'||status==='revealed',words=[...p.pairs.flat(),p.spare];
  const solved=showAnswers?[0,1,2,3]:s.solved;
  root.innerHTML=`<section class="panel"><div class="row spare-progress"><strong>${s.solved.length} / 4 pairs</strong><span class="pill" aria-label="${3-s.mistakes.length} chances remaining">${'●'.repeat(3-s.mistakes.length)}${'○'.repeat(s.mistakes.length)} · ${3-s.mistakes.length} left</span></div><p class="clue">${esc(p.prompt)}</p><div class="spare-solved" aria-label="Matched pairs">${solved.map(i=>`<div class="spare-pair ${s.solved.includes(i)?'found':'shown'}"><strong>${esc(p.pairs[i][0])}</strong><span aria-label="opposite">↔</span><strong>${esc(p.pairs[i][1])}</strong>${showAnswers&&!s.solved.includes(i)?'<small>revealed</small>':''}</div>`).join('')}</div>${finished?`<div class="spare-answer"><p class="muted">THE SPARE</p><strong>${esc(p.spare)}</strong><p class="muted">No opposite partner on this board.</p></div>`:`<div class="tiles spare-grid">${s.order.filter(i=>i===8||!s.solved.includes(Math.floor(i/2))).map(i=>`<button type="button" class="tile ${s.selected.includes(i)?'selected':''} ${s.hintPair!==null&&i<8&&Math.floor(i/2)===s.hintPair?'pair-hint':''}" data-word="${i}" aria-pressed="${s.selected.includes(i)}" aria-label="${esc(words[i])}${s.hintPair!==null&&i<8&&Math.floor(i/2)===s.hintPair?', hinted pair':''}">${esc(words[i])}</button>`).join('')}</div><div class="actions"><button class="button" id="spare-shuffle">Shuffle</button><button class="button" id="spare-clear" ${s.selected.length?'':'disabled'}>Clear</button><button class="button primary" id="spare-submit" ${s.selected.length===2?'':'disabled'}>Match pair</button></div>${s.hintPair!==null?'<p class="muted">The two outlined words are opposites.</p>':''}`}${s.mistakes.length?`<div class="spare-misses"><p class="muted">Already tried · repeating these pairs costs no extra strike</p><ul>${s.mistakes.map(key=>`<li>${key.split(':').map(i=>esc(words[Number(i)])).join(' + ')}</li>`).join('')}</ul></div>`:''}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-word]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.word),next=chooseTile(p,s,index);if(next===s){announce('Clear a word before selecting a third.');return;}commit(next,'');root.querySelector(`[data-word="${index}"]`)?.focus({preventScroll:true});}));
  root.querySelector('#spare-shuffle').addEventListener('click',()=>commit(shuffle(p,s),'Same words, a fresh arrangement.'));
  root.querySelector('#spare-clear').addEventListener('click',()=>commit({...s,selected:[]},'Selection cleared.'));
  root.querySelector('#spare-submit').addEventListener('click',()=>{const result=submitPair(p,s);commit(result.state,result.message);});
 }
});
 const link=document.createElement('a');link.href='#harder';link.className='button preview-link';link.textContent='Try the harder preview →';
 document.querySelector('.mode-switch').after(link);
}

function mountPreview(){
 const key='deepseek-spare:context-preview:v1',host=document.getElementById('app');
 let s=createPreview(),active=0,autoPlaced=null,message='',storageOK=true;
 try{const raw=localStorage.getItem(key);if(raw){let restored;try{restored=raw.length<=16384?restorePreview(JSON.parse(raw)):null;}catch{restored=null;}if(restored)s=restored;else message='The sample save could not be restored. Starting a fresh preview.';}}
 catch{storageOK=false;message='Progress stays in this tab; saving is unavailable.';}
 host.innerHTML=`<div class="game-shell spare-preview">
 <header><div class="collection-bar"><a class="collection-back" href="../daily/">← Alford Daily</a><a href="#daily" class="preview-back">Original daily →</a></div>
 <div class="preview-heading"><div><p class="eyebrow">HARDER PREVIEW · 01</p><h1>Spare</h1></div><span class="preview-mark" aria-hidden="true">↔</span></div>
 <p class="intro">Same words. Different meanings.</p>
 <p class="preview-instructions">Make an opposite pair for each context. Use each word once; leave one spare. Check all four pairs together.</p>
 <details class="preview-rules"><summary>How to place & check</summary><p>Choose a space, then tap or click a word. A word already on the board swaps places. Use Tab and Enter or Space on a keyboard. “Return word” empties the selected space.</p><p>You get four distinct checks. Feedback tells you how many rows are correct, but not which ones. Pair order does not matter; repeating a checked layout costs nothing. Check history stays visible below. Optional context clues are counted in your result. More than one complete arrangement can be valid.</p></details></header>
 <main><p class="preview-meta"><span>ONE REVIEW SAMPLE</span><span id="preview-counter"></span></p>
 <div id="preview-board" class="preview-board"></div>
 <p id="preview-message" class="status-note" role="status" aria-live="polite"></p>
 <div id="preview-history"></div><section id="preview-result" class="result" hidden></section>
 <div class="preview-footer"><button id="preview-reveal" class="button subtle">Reveal solution</button><button id="preview-share" class="button primary" hidden>Copy result</button></div>
 <p id="preview-storage" class="muted"></p></main>
 <footer>Preview progress is separate from your daily record.<br>One sample to try. Your original daily game is still available.</footer></div>
 <dialog id="preview-confirm" aria-labelledby="preview-confirm-title"><h2 id="preview-confirm-title">Reveal this sample?</h2><p>This ends the sample and shows its four contextual pairs.</p><div class="actions"><button id="preview-cancel" class="button">Keep playing</button><button id="preview-confirm-reveal" class="button primary">Reveal</button></div></dialog>`;
 const $=id=>document.getElementById(id);
 function persist(){try{localStorage.setItem(key,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}}
 function update(next,note=''){s=next;message=note;persist();render();}
 function render(focusSlot=null){
  const status=previewStatus(s),finished=status!=='playing',oldFocus=document.activeElement?.id;
  $('preview-counter').textContent=`${s.checks.length} / 4 checks used`;
  $('preview-board').dataset.finished=String(finished);$('preview-board').hidden=finished;
  $('preview-board').innerHTML=`${!finished?`<nav class="preview-context-switch" aria-label="Choose context">${PREVIEW.clues.map((c,i)=>`<button id="preview-context-${i}" data-context="${i}" aria-pressed="${Math.floor(active/2)===i}"><strong>${i+1}</strong><span>${s.slots.slice(i*2,i*2+2).filter(n=>n!==null).length}/2 placed</span></button>`).join('')}</nav>`:''}<section class="preview-contexts" aria-label="Four contexts">${PREVIEW.clues.map((clue,i)=>`<div class="preview-context ${!finished&&Math.floor(active/2)===i?'active-context':''}"><div class="preview-clue"><span class="context-number">${i+1}</span><p>${esc(clue.text)}${s.clarified.includes(i)?`<small>${esc(clue.sense)}</small>`:''}</p></div><div class="preview-pair">${[2*i,2*i+1].map(slot=>`<button id="preview-slot-${slot}" class="preview-slot ${s.slots[slot]!==null?'filled':''} ${!finished&&slot===active?'active-slot':''}" data-slot="${slot}" aria-pressed="${!finished&&slot===active}" aria-label="Context ${i+1}, space ${slot%2+1}: ${s.slots[slot]===null?'empty':esc(PREVIEW.words[s.slots[slot]])}" ${finished?'disabled':''}>${s.slots[slot]===null?'<span>Choose a word</span>':esc(PREVIEW.words[s.slots[slot]])}</button>`).join('<span class="pair-arrow" aria-hidden="true">↔</span>')}</div></div>`).join('')}</section>
  ${!finished?`<section class="preview-rack" aria-label="Word bank"><div class="rack-heading"><strong>The word bank</strong><span>${8-s.slots.filter(n=>n!==null).length} spaces left</span></div><p id="placement-guide">Place a word in <strong>context ${Math.floor(active/2)+1}, space ${active%2+1}</strong>.</p><div class="preview-words">${[3,8,0,5,2,7,1,4,6].map(i=>`<button id="preview-word-${i}" data-preview-word="${i}" class="preview-word ${s.slots.includes(i)?'used':''}" aria-label="${esc(PREVIEW.words[i])}${s.slots.includes(i)?', already placed; move or swap':', in bank'}">${esc(PREVIEW.words[i])}<small>${s.slots.includes(i)?'PLACED':'IN BANK'}</small></button>`).join('')}</div><div class="preview-actions"><button id="preview-return" class="button" ${s.slots[active]===null?'disabled':''}>Return word</button><button id="preview-check" class="button primary" ${s.slots.includes(null)?'disabled':''}>Check all four</button></div><button class="preview-clarify" id="preview-clarify" ${s.clarified.includes(Math.floor(active/2))?'disabled':''}>${s.clarified.includes(Math.floor(active/2))?'Context clue shown':'Clarify this context'}</button></section>`:''}`;
  $('preview-message').textContent=message;
  $('preview-history').innerHTML=s.checks.length?`<details class="preview-history" open><summary>Check history · ${s.checks.length}</summary>${s.checks.map((c,i)=>`<div class="preview-check-history"><strong>Check ${i+1} <span>${c.correct} / 4 correct</span></strong><ol>${[0,1,2,3].map(j=>`<li>${c.slots.slice(j*2,j*2+2).map(n=>esc(PREVIEW.words[n])).join(' ↔ ')}</li>`).join('')}</ol></div>`).join('')}</details>`:'';
  $('preview-reveal').hidden=finished;$('preview-share').hidden=!finished;$('preview-result').hidden=!finished;
  $('preview-storage').textContent=storageOK?'Saved on this device.':'Saving is unavailable. Keep this tab open to retain progress.';
  if(finished){
   const answerSlots=status==='won'?s.slots:[0,1,2,3,4,5,6,7],spare=PREVIEW.words.find((word,i)=>!answerSlots.includes(i));
   $('preview-result').innerHTML=`<p class="eyebrow">PREVIEW RESULT</p><h2>${status==='won'?'Every meaning fits.':status==='lost'?'Four checks used.':'Solution revealed.'}</h2><p>${status==='won'?`Solved in ${s.checks.length} ${s.checks.length===1?'check':'checks'}.`:'Here is how the contextual pairs fit.'} The spare is <strong>${esc(spare)}</strong>.</p><ol class="preview-explanations">${PREVIEW.clues.map((c,i)=>`<li><strong>${PREVIEW.words[answerSlots[2*i]]} ↔ ${PREVIEW.words[answerSlots[2*i+1]]}</strong><br>${esc(c.explanation)}</li>`).join('')}</ol><p class="muted">Some of these words are opposites in other senses. The stated contexts decide whether a pair fits; both reasonable brightness pairs are accepted.</p>`;
  }
  $('preview-board').querySelectorAll('[data-context]').forEach(button=>button.addEventListener('click',()=>{
   const row=Number(button.dataset.context);
   autoPlaced=null;active=s.slots[row*2]===null?row*2:s.slots[row*2+1]===null?row*2+1:row*2;
   render();
  }));
  $('preview-board').querySelectorAll('[data-slot]').forEach(button=>button.addEventListener('click',()=>{autoPlaced=null;active=Number(button.dataset.slot);render(active);}));
  $('preview-board').querySelectorAll('[data-preview-word]').forEach(button=>button.addEventListener('click',()=>{
   const word=Number(button.dataset.previewWord);
   if(word===autoPlaced){message='That word is already placed. Choose a space first to move it.';render();return;}
   const slot=active,displaced=s.slots[slot],previous=s.slots.indexOf(word),next=placePreview(s,slot,word);
   if(next===s){message='That word is already in the selected space.';render();return;}
   autoPlaced=word;const empty=Array.from({length:8},(_,i)=>(slot+1+i)%8).find(i=>next.slots[i]===null);
   if(empty!==undefined)active=empty;
   update(next,`${PREVIEW.words[word]} placed in context ${Math.floor(slot/2)+1}.${displaced===null?'':previous===-1?` ${PREVIEW.words[displaced]} returned to the bank.`:` ${PREVIEW.words[displaced]} moved to context ${Math.floor(previous/2)+1}, space ${previous%2+1}.`} Next target: context ${Math.floor(active/2)+1}, space ${active%2+1}. ${PREVIEW.clues[Math.floor(active/2)].text}`);
  }));
  $('preview-clarify')?.addEventListener('click',()=>{const row=Math.floor(active/2);update(clarifyPreview(s,row),`Context ${row+1} clue: ${PREVIEW.clues[row].sense}`);});
  $('preview-return')?.addEventListener('click',()=>{autoPlaced=null;update(placePreview(s,active,null),'Word returned to the bank.');$('preview-slot-'+active)?.focus({preventScroll:true});});
  $('preview-check')?.addEventListener('click',()=>{const result=checkPreview(s);update(result.state,result.message);if(previewStatus(s)!=='playing'){$('preview-result').tabIndex=-1;$('preview-result').focus();}});
  if(focusSlot!==null)$('preview-slot-'+focusSlot)?.focus({preventScroll:true});
  else if(oldFocus){const replacement=$(oldFocus);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else if(!finished)$('preview-slot-'+active)?.focus({preventScroll:true});}
 }
 $('preview-reveal').addEventListener('click',()=>$('preview-confirm').showModal());
 $('preview-cancel').addEventListener('click',()=>$('preview-confirm').close());
 $('preview-confirm-reveal').addEventListener('click',()=>{$('preview-confirm').close();update(revealPreview(s),'Solution revealed.');$('preview-result').tabIndex=-1;$('preview-result').focus();});
 $('preview-share').addEventListener('click',async()=>{const text=previewShare(s);try{await navigator.clipboard.writeText(text);message='Spoiler-free preview result copied.';}catch{message=text;}render();});
 render();
}
