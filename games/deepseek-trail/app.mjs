import { mountDailyGame, escapeHTML as esc } from '../deepseek-runtime/common.mjs';
import { PUZZLES } from './puzzles.mjs';
import * as E from './engine.mjs';
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
