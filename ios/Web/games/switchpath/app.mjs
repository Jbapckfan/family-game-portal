import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';

const $ = id => document.getElementById(id);
let focusedCell = null;
const perfect = game => game.status === 'won' && game.moves === 15 && game.hints === 0;
const help = `
  <p class="dialog-kicker">SIXTEEN NUMBERS. ONE UNBROKEN PATH.</p>
  <h2 class="dialog-title" id="dialog-title">Find your flow.</h2>
  <p class="dialog-body">Start at <strong>S</strong> and visit every cell exactly once, ending at <strong>E</strong>. Move only up, down, left or right.</p>
  <div class="help-example rhythm-help" aria-label="Example: 3 to 12 higher, 12 to 7 lower, 7 to 10 higher"><span>3</span><span class="example-comparison">↑<small>higher</small></span><span>12</span><span class="example-comparison">↓<small>lower</small></span><span>7</span><span class="example-comparison">↑<small>higher</small></span><span>10</span></div>
  <ol class="help-list"><li><strong>Go higher, then lower.</strong> Keep alternating. The numbers don’t need to be consecutive.</li><li><strong>Save E for the last step.</strong> A locally legal move can lead to a dead end, so think ahead.</li><li><strong>Try another turn.</strong> Tap an earlier step to rewind, or use Undo. Every board has one complete solution and you can always work back toward it.</li></ol>
  <p class="dialog-body">A perfect route takes <strong>15 moves and no hints</strong>. Each extension or rewind counts as one move. Reset path keeps your counts. A hint adds one correct step and may rewind a wrong branch; it counts as one move and one hint.</p>
  <p class="fineprint">Keyboard: arrow keys move focus; Enter or Space selects.<br>Backspace undoes one step. No timer. No lives to lose.</p>
  <div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Take the first step →</button></div>`;

const app = createShell({
  slug: 'switchpath', name: 'Switchpath', puzzles: PUZZLES, engine,
  sibling: { slug: 'ringcount', name: 'Ringcount', url: 'https://alford-daily.jbapckfan.chatgpt.site/games/ringcount/' },
  reset() { focusedCell = null; },
  record: game => ({ status: game.status, moves: game.moves, hints: game.hints }),
  help,
  about: 'Switchpath is a daily path puzzle about rhythm and planning. Move between neighboring numbers, alternating higher and lower, until all sixteen cells form one route. Every prepared board is checked by an exhaustive solver and has exactly one complete solution. Wrong turns stay recoverable through rewinding. A perfect route takes fifteen moves without hints.',
  statsExtra: stats => `<div class="stats-detail"><span>Perfect routes</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average moves when solved</span><strong>${stats.won ? stats.averageMoves.toFixed(1) : '—'}</strong></div>`,
  result(api) {
    const { game, mode, daily } = api;
    const won = game.status === 'won';
    const clean = perfect(game);
    return `<p class="dialog-kicker">${mode === 'daily' ? `DAILY NO. ${String(daily.number).padStart(3, '0')}` : 'A LITTLE PRACTICE. A GOOD CHALLENGE.'}</p>
      <div class="result-symbol route-result-symbol${clean ? ' perfect-symbol' : ''}" aria-hidden="true">${clean ? '✦' : won ? '↗↘' : '⌁'}</div>
      <h2 class="dialog-title" id="dialog-title">${clean ? 'Perfect flow.' : won ? 'Every turn found.' : 'The way through.'}</h2>
      <p class="result-copy">${clean ? 'Fifteen moves. No hints. Every step in place.' : won ? 'All sixteen numbers. One satisfying path.' : 'The complete route is on the board.<br>Take a look, then try a fresh challenge.'}</p>
      <div class="finish-ribbon${won ? '' : ' revealed-ribbon'}">${clean ? '✦ PERFECT ROUTE' : won ? '✓ ALL 16 CONNECTED' : 'ROUTE REVEALED'}</div>
      <div class="result-metrics"><div><strong>${game.moves}</strong><span>${game.moves === 1 ? 'move' : 'moves'}</span></div><div><strong>${game.hints}</strong><span>${game.hints === 1 ? 'hint' : 'hints'}</span></div></div>
      <div class="dialog-actions"><button class="primary-button" data-action="random" autofocus>One more path →</button><button class="secondary-button" data-action="share">Share result ↗</button></div>
      <p class="fineprint">${won ? game.hints ? 'Solved with assistance.' : 'Solved without a hint.' : 'Revealed routes do not count as wins.'}<br>${mode === 'daily' ? 'A fresh daily at midnight Central.' : 'Practice stays separate from your daily record.'}</p>`;
  },
  render: renderGame,
});

function point(cell) { return `${cell % 4 + .5},${Math.floor(cell / 4) + .5}`; }

function routeMarkup(puzzle, game, opts) {
  const active = game.status === 'playing';
  const tip = game.path.at(-1);
  const extend = opts.extend === tip && game.path.length > 1 && active;
  const path = extend ? game.path.slice(0, -1) : game.path;
  const last = extend ? `<line class="route-line route-last" x1="${game.path.at(-2) % 4 + .5}" y1="${Math.floor(game.path.at(-2) / 4) + .5}" x2="${tip % 4 + .5}" y2="${Math.floor(tip / 4) + .5}" pathLength="1"/>` : '';
  const svg = `<svg class="route-lines" viewBox="0 0 4 4" aria-hidden="true" focusable="false"><polyline class="route-line" points="${path.map(point).join(' ')}"/>${last}</svg>`;
  return svg + puzzle.values.map((value, cell) => {
    const step = game.path.indexOf(cell);
    const visited = step >= 0;
    const current = active && cell === tip;
    const start = cell === puzzle.start;
    const end = cell === puzzle.end;
    const classes = ['number-cell', visited && 'visited', current && 'current-cell', start && 'start-cell', end && 'end-cell', opts.extend === cell && 'new-step'].filter(Boolean).join(' ');
    const label = [String(value), start && 'Start', end && 'End', `row ${Math.floor(cell / 4) + 1}, column ${cell % 4 + 1}`, visited && `path step ${step + 1}`, current ? 'current position' : active && visited ? 'select to rewind here' : null].filter(Boolean).join(', ');
    return `<button class="${classes}" data-cell="${cell}" style="--step:${step < 0 ? 0 : step}" aria-label="${esc(label)}" ${current ? 'aria-current="step"' : ''} tabindex="${active && cell === focusedCell ? '0' : '-1'}" ${active ? '' : 'disabled'}>
      <span class="cell-label">${start ? 'S · START' : end ? 'E · END' : current ? 'HERE' : ''}</span>
      <span class="cell-value">${value}</span>
      ${visited ? `<span class="path-order" aria-hidden="true">${step + 1}</span>` : ''}
    </button>`;
  }).join('');
}

function renderGame(api, opts = {}) {
  const { game, puzzle } = api;
  const active = game.status === 'playing';
  const tip = game.path.at(-1);
  const direction = engine.nextDirection(game);
  if (Number.isInteger(opts.focus)) focusedCell = opts.focus;
  if (!Number.isInteger(focusedCell)) focusedCell = tip;
  $('puzzle').className = `puzzle route-board${game.status === 'won' ? ' is-complete' : game.status === 'revealed' ? ' is-revealed' : ''}${opts.complete && game.status === 'won' ? ' celebrate' : ''}`;
  $('puzzle').innerHTML = routeMarkup(puzzle, game, opts);
  $('puzzle').setAttribute('aria-label', active ? `Switchpath board. ${game.path.length} of 16 cells connected. Next number must be ${direction} than ${puzzle.values[tip]}.` : `Switchpath ${game.status === 'won' ? 'solved' : 'revealed'} route: ${game.path.map(cell => puzzle.values[cell]).join(', ')}.`);
  $('direction-panel').className = `direction-panel${active ? ` direction-${direction}` : game.status === 'won' ? ' direction-finished' : ' direction-revealed'}`;
  $('direction-icon').textContent = active ? direction === 'higher' ? '↑' : '↓' : game.status === 'won' ? '✓' : '⌁';
  $('direction-kicker').textContent = active ? game.path.length === 15 ? 'YOUR FINAL STEP' : 'YOUR NEXT STEP' : game.status === 'won' ? perfect(game) ? 'PERFECT ROUTE' : 'ROUTE COMPLETE' : 'ROUTE REVEALED';
  $('direction-label').textContent = active ? `Go ${direction} than ${puzzle.values[tip]}` : game.status === 'won' ? 'One unbroken path.' : 'Follow the numbered steps.';
  $('rhythm-higher').className = `rhythm-step${active && direction === 'higher' ? ' current' : ''}`;
  $('rhythm-lower').className = `rhythm-step${active && direction === 'lower' ? ' current' : ''}`;
  $('progress-label').textContent = `${game.path.length} of 16 connected`;
  $('progress-track').setAttribute('aria-valuenow', String(game.path.length));
  $('progress-track').setAttribute('aria-valuetext', `${game.path.length} of 16 cells connected`);
  $('progress-fill').style.width = `${game.path.length / 16 * 100}%`;
  $('move-count').textContent = String(game.moves);
  $('move-label').textContent = game.moves === 1 ? 'move' : 'moves';
  $('hint-count').textContent = String(game.hints);
  $('hint-label').textContent = game.hints === 1 ? 'hint' : 'hints';
  $('par-label').textContent = perfect(game) ? '✦ Perfect route' : game.status === 'won' ? 'Route complete' : game.status === 'revealed' ? 'Shown, not solved' : game.hints ? 'Assisted route' : game.moves > game.path.length - 1 ? 'Keep exploring' : '15 moves is perfect';
  $('undo-button').disabled = !active || game.path.length <= 1;
  $('reset-path-button').disabled = !active || game.path.length <= 1;
  $('hint-button').disabled = !active;
  $('movement-note').textContent = active ? 'Move up, down, left or right. Tap an earlier step to rewind.' : 'The small numbers mark each step along the complete route.';
  if (Number.isInteger(opts.focus) && active) requestAnimationFrame(() => $('puzzle').querySelector(`[data-cell="${opts.focus}"]`)?.focus({ preventScroll: true }));
}

function nextMessage(state, action) {
  if (state.status === 'won') return perfect(state) ? 'Perfect flow. All sixteen connected in fifteen moves, without a hint.' : 'Every turn found. Your complete route is solved.';
  const value = app.puzzle.values[state.path.at(-1)];
  const direction = engine.nextDirection(state);
  if (engine.legalNextCells(app.puzzle, state).length === 0) return 'This route has no next step. Tap an earlier cell to rewind, or use Undo.';
  if (action === 'rewind') return `Back at ${value}. Your next step goes ${direction}.`;
  if (state.path.length === 15) return 'One last step. Finish at E.';
  if (state.path.length === 8) return 'Half the board connected. Keep the rhythm.';
  if (state.path.length === 12) return 'Four cells to go. Save E for last.';
  return `${state.path.length} connected. Next: ${direction} than ${value}.`;
}

function select(cell) {
  const result = engine.selectCell(app.puzzle, app.game, cell);
  if (!result.changed) {
    const direction = engine.nextDirection(app.game);
    const value = app.puzzle.values[app.game.path.at(-1)];
    const messages = {
      'not-adjacent': 'Choose a cell beside your current step: up, down, left or right. No move used.',
      'end-too-early': 'Save E for your sixteenth and final cell. No move used.',
      direction: `This step needs a number ${direction} than ${value}. No move used.`,
      unchanged: 'You are here. Choose a neighboring number, or an earlier step to rewind.',
    };
    if (messages[result.reason]) app.notice(messages[result.reason]);
    if (result.reason !== 'unchanged' && result.reason !== 'finished') {
      const node = $('puzzle').querySelector(`[data-cell="${cell}"]`);
      node?.classList.add('invalid-cell');
      setTimeout(() => node?.classList.remove('invalid-cell'), 260);
      app.sound('miss');
    }
    return;
  }
  app.commit(result.state, {
    message: nextMessage(result.state, result.action),
    tone: result.state.status === 'won' ? 'win' : result.action === 'extend' ? 'select' : null,
    opts: { focus: cell, extend: result.action === 'extend' ? cell : null, complete: result.state.status === 'won' },
  });
}

function undo() {
  if (app.game.status === 'playing' && app.game.path.length > 1) select(app.game.path.at(-2));
}

function confirmReset() {
  if (app.game.status !== 'playing' || app.game.path.length <= 1) return;
  app.openDialog(`<p class="dialog-kicker">TRY ANOTHER WAY THROUGH</p><h2 class="dialog-title" id="dialog-title">Return to the start?</h2><p class="confirm-copy">This rewinds your route to S. It counts as one move and keeps your existing move and hint totals.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep this route</button><button class="primary-button" data-reset-path>Reset path</button></div>`);
}

function hint() {
  const result = engine.useHint(app.puzzle, app.game);
  if (!result.hint) return;
  app.commit(result.state, {
    message: result.hint.message,
    tone: result.state.status === 'won' ? 'win' : 'select',
    opts: { focus: result.hint.cell, extend: result.hint.cell, complete: result.state.status === 'won' },
  });
}

$('puzzle').addEventListener('click', event => {
  const button = event.target.closest('[data-cell]');
  if (button) select(Number(button.dataset.cell));
});
$('puzzle').addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || app.game.status !== 'playing') return;
  const button = event.target.closest('[data-cell]');
  const cell = button ? Number(button.dataset.cell) : app.game.path.at(-1);
  let next = cell;
  if (event.key === 'ArrowUp' && cell >= 4) next = cell - 4;
  else if (event.key === 'ArrowDown' && cell < 12) next = cell + 4;
  else if (event.key === 'ArrowLeft' && cell % 4 > 0) next = cell - 1;
  else if (event.key === 'ArrowRight' && cell % 4 < 3) next = cell + 1;
  else if (event.key === 'Home') next = app.puzzle.start;
  else if (event.key === 'End') next = app.puzzle.end;
  else if (event.key === 'Backspace') { event.preventDefault(); undo(); return; }
  else if ((event.key === 'Enter' || event.key === ' ') && !button) { event.preventDefault(); select(cell); return; }
  else if (!event.key.startsWith('Arrow')) return;
  event.preventDefault();
  const previous = $('puzzle').querySelector(`[data-cell="${focusedCell}"]`);
  const target = $('puzzle').querySelector(`[data-cell="${next}"]`);
  if (previous) previous.tabIndex = -1;
  if (target) { target.tabIndex = 0; focusedCell = next; target.focus({ preventScroll: true }); }
});
$('undo-button').addEventListener('click', undo);
$('reset-path-button').addEventListener('click', confirmReset);
$('hint-button').addEventListener('click', hint);
$('dialog-content').addEventListener('click', event => {
  if (!event.target.closest('[data-reset-path]')) return;
  app.closeDialog();
  if (app.game.status === 'playing') select(app.puzzle.start);
});
$('feedback').textContent = 'Your first step goes higher. Think a turn ahead.';
$('board-note').textContent = 'One solution. Room to rethink. Progress saved in this browser.';
app.start();
