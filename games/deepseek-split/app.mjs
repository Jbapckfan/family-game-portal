import { mountDailyGame, escapeHTML as esc } from '../deepseek-runtime/common.mjs';
import { PUZZLES } from './puzzles.mjs';
import * as E from './engine.mjs';
mountDailyGame({
  id: 'deepseek-split', name: 'Split', accent:'#b54f40',
  intro: 'Ten letters. Two clues. A perfect split.',
  instructions: [
    'Use every tile exactly once to make two words that answer the two clues.',
    'Choose a word row, then tap letters from the rack. When a row fills, the next tile goes to the other row.',
    'Tap a filled slot to return that tile to the rack. Identical letters are separate tiles, so each has its own place.',
    'Try as many arrangements as you like. A hint keeps correct openings, clears incorrect endings, and adds one correct letter.'
  ],
  puzzles: PUZZLES, createState: E.createState, restoreState: E.restoreState,
  getStatus: E.getStatus, hint: E.hint, reveal: E.reveal, summarize: E.summarize,
  render({ root, puzzle: p, state: s, commit, announce }) {
    const finished = E.getStatus(p, s) !== 'playing', used = s.rows.flat(), words = E.wordsAt(p, s);
    root.tabIndex = 0;root.setAttribute('aria-label', 'Split puzzle. Choose a row, then tap or type letters.');
    root.innerHTML = `<section class="panel split-panel">
      <div class="split-answers">${p.words.map((word,row) => `<section class="split-answer ${s.active===row?'active':''} ${words[row]===word?'fits':''}" aria-label="Word ${row+1}">
        <button type="button" class="split-row-select" data-row="${row}" aria-pressed="${s.active===row}" ${finished?'disabled':''}><span>Word ${row+1} · ${word.length} letters</span><span>${s.active===row&&!finished?'Filling this row':words[row]===word?'Fits the clue':'Choose row'}</span></button>
        <p class="clue">${esc(p.clues[row])}</p>
        <div class="split-slots" style="--slots:${word.length}">${[...word].map((_,slot)=>{const index=s.rows[row][slot],letter=index===undefined?'':p.rack[index];return `<button type="button" class="split-slot ${letter?'filled':''}" data-slot="${row}:${slot}" aria-label="Word ${row+1}, slot ${slot+1}, ${letter?`${letter}, return tile`:'empty'}" ${finished?'disabled':''}>${letter||'<span aria-hidden="true">·</span>'}</button>`;}).join('')}</div>
      </section>`).join('')}</div>
      <p class="muted split-counter">${used.length}/10 tiles placed</p>
      <div class="split-rack" role="group" aria-label="Available letter tiles">${p.rack.map((letter,index)=>`<button type="button" class="split-rack-tile ${used.includes(index)?'used':''}" data-index="${index}" aria-label="Letter ${letter}, tile ${index+1}${used.includes(index)?', placed':''}" ${finished||used.includes(index)?'disabled':''}>${letter}</button>`).join('')}</div>
      <div class="actions"><button type="button" class="button" data-action="undo" ${finished||!used.length?'disabled':''}>Undo letter</button><button type="button" class="button" data-action="clear" ${finished||!used.length?'disabled':''}>Start over</button><button type="button" class="button primary" data-action="check" ${finished||used.length<10?'disabled':''}>Check words</button></div>
      <p class="muted split-counter">${s.hints} hint${s.hints===1?'':'s'} used · rearrange as often as you like</p>
    </section>`;
    const keepFocus = () => root.focus({ preventScroll: true });
    const apply = result => { if(result.state===s) announce(result.message);else {commit(result.state,result.message);keepFocus();} };
    for(const button of root.querySelectorAll('[data-row]'))button.onclick=()=>{commit(E.setActive(p,s,Number(button.dataset.row)));keepFocus();};
    for(const button of root.querySelectorAll('[data-index]'))button.onclick=()=>apply(E.addTile(p,s,Number(button.dataset.index)));
    for(const button of root.querySelectorAll('[data-slot]'))button.onclick=()=>{const [row,slot]=button.dataset.slot.split(':').map(Number);commit(s.rows[row][slot]===undefined?E.setActive(p,s,row):E.removeTile(p,s,row,slot));keepFocus();};
    root.querySelector('[data-action="undo"]').onclick=()=>{commit(E.undo(p,s),'Letter returned to the rack.');keepFocus();};
    root.querySelector('[data-action="clear"]').onclick=()=>{commit(E.clearAll(p,s),'All tiles returned. Your hint count is retained.');keepFocus();};
    root.querySelector('[data-action="check"]').onclick=()=>apply(E.submit(p,s));
    root.onkeydown=event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||finished)return;
      if(/^[a-z]$/i.test(event.key)){
        event.preventDefault();const letter=event.key.toUpperCase(),index=p.rack.findIndex((c,i)=>c===letter&&!used.includes(i));
        if(index===-1)announce(`No ${letter} tile remains in the rack.`);else apply(E.addTile(p,s,index));
      }else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();commit(E.undo(p,s));keepFocus();}
      else if(event.key==='Enter'&&event.target===root){event.preventDefault();apply(E.submit(p,s));}
    };
  }
});
