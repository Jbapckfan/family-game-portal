import { mountDailyGame, escapeHTML as esc } from '../deepseek-runtime/common.mjs';
import { PUZZLES } from './puzzles.mjs';
import * as E from './engine.mjs';
window.addEventListener('hashchange',()=>window.location.reload());
if(window.location.hash==='#daily')mountOriginal();else mountPreview();

function mountOriginal(){
mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
  id: 'deepseek-trail', name: 'Trail', accent:'#087c99',
  intro: 'Nine letters. One winding way through.',
  instructions: [
    'Find a nine-letter word by joining neighboring tiles. Horizontal, vertical, and diagonal steps all count.',
    'Use each tile at most once. The meaning clue points to a longest word hidden in the board.',
    'Tap an earlier tile to shorten your trail back to that point. Undo removes the last tile; Clear starts a fresh path.',
    'Check your trail when it uses all nine tiles. A hint keeps the correct opening of one solution and adds its next step.',
    'On a keyboard, use the arrow keys to move between tiles, then Space or Enter to select one. Backspace undoes a step and Escape clears the trail.'
  ],
  puzzles: PUZZLES, createState: E.createState, restoreState: E.restoreState,
  getStatus: E.getStatus, hint: E.hint, reveal: E.reveal, summarize: E.summarize,
  render({ root, puzzle: p, state: s, commit, announce }) {
    const finished = E.getStatus(p, s) !== 'playing';
    const word = E.wordAt(p, s.path);
    const points = s.path.map(index => `${50 + (index % 3) * 100},${50 + Math.floor(index / 3) * 100}`).join(' ');
    root.innerHTML = `<section class="panel trail-panel">
      <p class="clue">${esc(p.clue)}</p>
      <div class="trail-word" aria-label="Your current trail" aria-live="polite">${word ? esc(word) : '<span class="muted">Choose your first letter</span>'}</div>
      <p class="muted trail-count">${s.path.length} of ${p.answer.length} letters · arrows move focus; Space selects</p>
      <div class="trail-board">
        <svg class="trail-lines" viewBox="0 0 300 300" aria-hidden="true"><polyline points="${points}"/></svg>
        <div class="trail-grid" role="group" aria-label="Trail letter grid">
          ${p.grid.map((letter, index) => { const step = s.path.indexOf(index);return `<button type="button" class="trail-tile ${step >= 0 ? 'selected' : ''} ${index === s.path.at(-1) ? 'last' : ''}" data-index="${index}" aria-label="Letter ${letter}, row ${Math.floor(index / 3)+1}, column ${index%3+1}${step >= 0 ? `, step ${step+1}` : ''}" aria-pressed="${step>=0}" ${finished ? 'disabled' : ''}><span>${letter}</span>${step >= 0 ? `<small>${step+1}</small>` : ''}</button>`; }).join('')}
        </div>
      </div>
      <div class="actions"><button type="button" class="button" data-action="undo" ${finished || !s.path.length ? 'disabled' : ''}>Undo</button><button type="button" class="button" data-action="clear" ${finished || !s.path.length ? 'disabled' : ''}>Clear trail</button><button type="button" class="button primary" data-action="check" ${finished || !s.path.length ? 'disabled' : ''}>Check trail</button></div>
      <p class="muted trail-count">${s.hints} hint${s.hints===1?'':'s'} used · no time limit</p>
    </section>`;
    for (const button of root.querySelectorAll('[data-index]')) button.onclick = () => {
      const result = E.selectTile(p, s, Number(button.dataset.index));
      if (result.state === s) announce(result.message); else commit(result.state, result.message);
    };
    root.querySelector('[data-action="undo"]').onclick = () => commit(E.undo(p, s), 'Last step removed.');
    root.querySelector('[data-action="clear"]').onclick = () => commit(E.clear(p, s), 'A fresh trail.');
    root.querySelector('[data-action="check"]').onclick = () => { const result=E.submit(p,s);if(result.state===s)announce(result.message);else commit(result.state,result.message); };
    root.onkeydown = event => {
      if(finished||event.ctrlKey||event.metaKey||event.altKey)return;
      const delta={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[event.key];
      if(delta&&event.target.hasAttribute('data-index')){
        event.preventDefault();const i=Number(event.target.dataset.index),row=Math.floor(i/3)+delta[0],col=i%3+delta[1];
        if(row>=0&&row<3&&col>=0&&col<3)root.querySelector(`[data-index="${row*3+col}"]`)?.focus({preventScroll:true});
      }else if(event.key==='Backspace'){event.preventDefault();if(s.path.length)commit(E.undo(p,s),'Last step removed.');}
      else if(event.key==='Escape'){event.preventDefault();if(s.path.length)commit(E.clear(p,s),'A fresh trail.');}
    };
  }
});
 const link=document.createElement('a');link.href='#harder';link.className='button preview-link';link.textContent='Try the harder preview →';
 document.querySelector('.mode-switch').after(link);
}

function mountPreview(){
 const p=E.PREVIEW,key='deepseek-trail:4x4-preview:v1',host=document.getElementById('app');
 let s=E.createPreview(),message='',storageOK=true;
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   let restored;try{restored=raw.length<=65536?E.restorePreview(JSON.parse(raw)):null;}catch{restored=null;}
   if(restored)s=restored;else message='The sample save could not be restored. Starting a fresh preview.';
  }
 }catch{storageOK=false;}
 host.innerHTML=`<div class="game-shell trail-preview">
 <header><div class="collection-bar"><a class="collection-back" href="../daily/">← Alford Daily</a><a class="preview-back" href="#daily">Original daily →</a></div>
 <div class="preview-heading"><div><p class="eyebrow">HARDER PREVIEW · 01</p><h1>Trail</h1></div><span class="preview-badge">4 × 4</span></div>
 <p class="intro">Find the word. Find the way.</p>
 <p class="preview-instructions">One clue. Nine connected letters. Seven decoys to leave behind.</p>
 <details class="preview-rules"><summary>How to play</summary><p>Build a nine-letter word that fits the clue. Tap neighboring tiles, including diagonals. Each tile can be used once. Tap an earlier tile to backtrack; Undo removes one step.</p><p>On a keyboard, arrows move between tiles; Space or Enter selects. Backspace undoes, Escape clears. There is no strike limit; repeating a word adds no check. The optional definition is recorded in your result.</p></details></header>
 <main><section class="panel trail-preview-panel" aria-label="Harder Trail sample">
 <div class="preview-clue"><p class="eyebrow">THE CLUE</p><p class="clue">${esc(p.clue)}</p>
 <button id="preview-definition" class="definition-button" aria-controls="preview-definition-text">Need a definition?</button><p id="preview-definition-text" hidden></p></div>
 <div id="preview-board"></div>
 <p id="preview-trail-announcement" class="trail-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
 <p id="preview-message" class="status-note" role="status" aria-live="polite"></p>
 </section>
 <section id="preview-result" class="result" hidden tabindex="-1"></section>
 <div id="preview-history"></div>
 <div class="preview-footer"><button id="preview-reveal" class="button subtle">Reveal solution</button><button id="preview-share" class="button primary" hidden>Copy result</button></div>
 <p id="preview-storage" class="muted"></p></main>
 <footer>One review sample · separate from your daily record</footer></div>
 <dialog id="preview-confirm" aria-labelledby="preview-confirm-title"><h2 id="preview-confirm-title">Reveal this trail?</h2><p>This ends the sample and shows the word and its route.</p><div class="actions"><button id="preview-cancel" class="button">Keep playing</button><button id="preview-confirm-reveal" class="button primary">Reveal</button></div></dialog>`;
 const $=id=>document.getElementById(id);
 function update(next,note=''){
  s=next;message=note;
  try{localStorage.setItem(key,JSON.stringify(s));storageOK=true;}catch{storageOK=false;}
  render();
 }
 function render(){
  const status=E.previewStatus(s),finished=status!=='playing',word=E.wordAt(p,s.path),focusId=document.activeElement?.id,historyOpen=$('preview-history').querySelector('details')?.open;
  $('preview-definition').disabled=s.definitionShown||finished;
  $('preview-definition').textContent=s.definitionShown?'Definition shown · help used':'Need a definition?';
  $('preview-definition').setAttribute('aria-expanded',String(s.definitionShown));
  $('preview-definition-text').hidden=!s.definitionShown;
  $('preview-definition-text').textContent=p.definition;
  const points=s.path.map(i=>`${50+(i%4)*100},${50+Math.floor(i/4)*100}`).join(' ');
  $('preview-board').innerHTML=`<div class="trail-slots" aria-label="Your trail: ${word||'empty'}">${Array.from({length:9},(_,i)=>`<span class="${word[i]?'filled':''}">${word[i]||'·'}</span>`).join('')}</div>
   <p class="trail-count"><strong>${s.path.length} / 9</strong> letters · <span>${s.attempts.length} ${s.attempts.length===1?'check':'checks'}</span></p>
   <div class="trail-board"><svg class="trail-lines" viewBox="0 0 400 400" aria-hidden="true"><polyline points="${points}"/></svg>
   <div class="trail-grid" role="group" aria-label="Four by four letter grid">${p.grid.map((letter,i)=>{
    const step=s.path.indexOf(i);
    return `<button type="button" id="preview-tile-${i}" data-preview-index="${i}" class="trail-tile ${step>=0?'selected':''} ${i===s.path.at(-1)?'last':''}" aria-label="Letter ${letter}, row ${Math.floor(i/4)+1}, column ${i%4+1}${step>=0?`, step ${step+1}`:''}" aria-pressed="${step>=0}" ${finished?'disabled':''}><span>${letter}</span>${step>=0?`<small>${step+1}</small>`:''}</button>`;
   }).join('')}</div></div>
   <div class="actions preview-actions"><button id="preview-undo" class="button" ${finished||!s.path.length?'disabled':''}>Undo</button><button id="preview-clear" class="button" ${finished||!s.path.length?'disabled':''}>Clear</button><button id="preview-check" class="button primary" ${finished||s.path.length!==9?'disabled':''}>Check trail</button></div>`;
  $('preview-message').textContent=message;
  $('preview-trail-announcement').textContent=`Your trail: ${word?word.split('').join(' '):'empty'}. ${s.path.length} of nine letters.`;
  $('preview-history').innerHTML=s.attempts.length?`<details class="preview-history" ${historyOpen?'open':''}><summary>Checked words · ${s.attempts.length}</summary><ul>${s.attempts.map(path=>`<li>${esc(E.wordAt(p,path))} <span>${E.wordAt(p,path)===p.answer?'✓':'— try another'}</span></li>`).join('')}</ul></details>`:'';
  $('preview-result').hidden=!finished;
  $('preview-reveal').hidden=finished;$('preview-share').hidden=!finished;
  $('preview-storage').textContent=storageOK?'Saved on this device.':'Saving is unavailable. Keep this tab open to retain progress.';
  if(finished)$('preview-result').innerHTML=`<p class="eyebrow">PREVIEW RESULT</p><h2>${status==='won'?'You found your way.':'Solution revealed.'}</h2><p><strong>${esc(p.answer)}</strong> — ${esc(p.definition)}</p><p>${status==='won'?`Solved in ${s.attempts.length} ${s.attempts.length===1?'check':'checks'}.`:'Revealed, rather than counted as a solve.'} ${s.definitionShown?'Definition used.':'No definition used.'}</p>`;
  $('preview-board').querySelectorAll('[data-preview-index]').forEach(button=>button.onclick=()=>{
   const index=Number(button.dataset.previewIndex),result=E.selectPreview(s,index);update(result.state,result.message);
   $(`preview-tile-${index}`).focus({preventScroll:true});
  });
  $('preview-undo').onclick=()=>update(E.undoPreview(s),'Last step removed.');
  $('preview-clear').onclick=()=>update(E.clearPreview(s),'A fresh trail.');
  $('preview-check').onclick=()=>{
   const result=E.checkPreview(s);update(result.state,result.message);
   if(E.previewStatus(s)!=='playing')$('preview-result').focus();
  };
  if(focusId){
   const el=$(focusId);
   if(el&&!el.disabled)el.focus({preventScroll:true});
   else if(!finished&&['preview-clear','preview-undo'].includes(focusId))$(`preview-tile-${s.path.at(-1)??0}`).focus({preventScroll:true});
  }
 }
 $('preview-board').onkeydown=event=>{
  if(E.previewStatus(s)!=='playing'||event.ctrlKey||event.metaKey||event.altKey)return;
  const delta={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[event.key];
  if(delta&&event.target.hasAttribute('data-preview-index')){
   event.preventDefault();const i=Number(event.target.dataset.previewIndex),row=Math.floor(i/4)+delta[0],col=i%4+delta[1];
   if(row>=0&&row<4&&col>=0&&col<4)$(`preview-tile-${row*4+col}`).focus({preventScroll:true});
  }else if(event.key==='Backspace'){event.preventDefault();if(s.path.length)update(E.undoPreview(s),'Last step removed.');}
  else if(event.key==='Escape'){event.preventDefault();if(s.path.length)update(E.clearPreview(s),'A fresh trail.');}
 };
 $('preview-definition').onclick=()=>{update(E.definePreview(s),'Definition revealed. This help is recorded in your result.');$('preview-definition-text').tabIndex=-1;$('preview-definition-text').focus({preventScroll:true});};
 $('preview-reveal').onclick=()=>$('preview-confirm').showModal();
 $('preview-cancel').onclick=()=>$('preview-confirm').close();
 $('preview-confirm-reveal').onclick=()=>{$('preview-confirm').close();update(E.revealPreview(s),'Solution revealed.');$('preview-result').focus();};
 $('preview-share').onclick=async()=>{const share=E.previewShare(s);try{await navigator.clipboard.writeText(share);message='Spoiler-free preview result copied.';}catch{message=share;}render();};
 render();
}
