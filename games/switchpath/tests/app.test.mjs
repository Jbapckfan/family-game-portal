import {practiceCandidates} from '../../deepseek-runtime/practice-calendar.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { PUZZLES } from '../puzzles.mjs';
import * as engine from '../engine.mjs';

// Exercise the actual adapter, shell, and engine together. The stand-ins model
// only browser facilities; rules, rendering, scoring, and storage are production code.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../shell.mjs', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const shareSource = readFileSync(new URL('../share-card.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');
const appSource = readFileSync(new URL('../app.mjs', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
const prefix = 'switchpath:v1:';
const plain = value => JSON.parse(JSON.stringify(value));

function openApp(saved = new Map()) {
  const nodes = new Map();
  const timers = new Map();
  let document;
  let timerId = 0;
  function element(id = '') {
    const listeners = new Map();
    const attributes = new Map();
    let markup = '';
    const node = {
      id, textContent: '', className: '', hidden: false, disabled: false, open: false,
      isConnected: true, dataset: {}, style: {}, tagName: 'DIV', cells: new Map(), tabIndex: 0,
      get innerHTML() { return markup; },
      set innerHTML(value) {
        markup = value;
        for (const cell of this.cells.values()) cell.isConnected = false;
        this.cells.clear();
        for (const match of value.matchAll(/<button\b([^>]*)data-cell="(\d+)"([^>]*)>/g)) {
          const child = element();
          child.dataset.cell = match[2]; child.tagName = 'BUTTON';
          child.disabled = /\bdisabled\b/.test(match[3]);
          child.className = match[1].match(/class="([^"]*)"/)?.[1] || '';
          child.tabIndex = Number(match[3].match(/tabindex="(-?\d+)"/)?.[1] ?? 0);
          this.cells.set(Number(match[2]), child);
        }
      },
      setAttribute(key, value) { attributes.set(key, String(value)); },
      getAttribute(key) { return attributes.get(key); },
      querySelector(selector) {
        const match = selector.match(/^\[data-cell="(\d+)"\]$/);
        return match ? this.cells.get(Number(match[1])) || null : null;
      },
      closest(selector) { return selector === '[data-cell]' && this.dataset.cell !== undefined ? this : null; },
      getClientRects() { return this.hidden ? [] : [{}]; },
      getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100 }; },
      focus() { document.activeElement = this; }, scrollIntoView() {},
      close() { this.open = false; }, showModal() { this.open = true; },
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
      emit(type, event = {}) { for (const fn of listeners.get(type) || []) fn({ target: this, preventDefault() {}, ...event }); },
      click() { if (!this.disabled) this.emit('click'); },
    };
    node.classList = {
      add(value) { node.className = [...new Set([...node.className.split(' '), value])].filter(Boolean).join(' '); },
      remove(value) { node.className = node.className.split(' ').filter(item => item !== value).join(' '); },
      toggle(value, enabled) { if (enabled) this.add(value); else this.remove(value); },
    };
    return node;
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(id, element(id));
  document = { activeElement: null, hidden: false, getElementById: id => nodes.get(id) || null, querySelector: () => null, addEventListener() {} };
  document.activeElement = element();
  const timedEngine = { ...engine,
    getDaily: puzzles => engine.getDaily(puzzles, new Date('2026-10-20T12:00:00Z')),
    getDateKey: () => '2026-10-20',
  };
  const context = createContext({practiceCandidates,
    PUZZLES, engine: timedEngine, document,
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    navigator: {}, window: { addEventListener() {} }, location: { pathname: '/games/switchpath/' },
    matchMedia: () => ({ matches: true }), requestAnimationFrame: fn => fn(),
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id), setInterval: () => 1,
  });
  runInContext(shellSource, context, { filename: 'shell.mjs' });
  runInContext(shareSource, context, { filename: 'share-card.mjs' });
  runInContext(appSource, context, { filename: 'app.mjs' });
  const app = runInContext('app', context);
  return {
    app, nodes, saved, document,
    tap(cell) { const target = nodes.get('puzzle').cells.get(cell); if (!target.disabled) nodes.get('puzzle').emit('click', { target }); },
    key(cell, key) { nodes.get('puzzle').emit('keydown', { key, target: nodes.get('puzzle').cells.get(cell) }); },
    click(id) { nodes.get(id).click(); },
    action(action) { nodes.get('dialog-content').emit('click', { target: { closest: selector => selector === '[data-action]' ? { dataset: { action } } : null } }); },
    confirmHint() { nodes.get('dialog-content').emit('click', { target: { closest: selector => selector === '[data-hint-confirm]' ? {} : null } }); },
    resetPath() { nodes.get('dialog-content').emit('click', { target: { closest: selector => selector === '[data-reset-path]' ? {} : null } }); },
    showPendingResult() { for (const fn of [...timers.values()]) fn(); },
    stats() { return engine.getStats(JSON.parse(saved.get(prefix + 'records') || '{}'), '2026-10-20'); },
  };
}

test('the visible rhythm, route steps, and progress survive a real saved-game refresh', () => {
  const view = openApp();
  assert.equal(view.nodes.get('puzzle').cells.size, 16);
  assert.equal(view.nodes.get('direction-label').textContent, 'GO HIGHER');
  assert.equal(view.nodes.get('direction-detail').textContent, 'Greater than 1');
  assert.equal(view.nodes.get('direction-icon').textContent, '↑');
  assert.equal(view.nodes.get('undo-button').disabled, true);
  view.tap(4);
  assert.deepEqual(plain(view.app.game.path), [0, 4]);
  assert.equal(view.nodes.get('direction-label').textContent, 'GO LOWER');
  assert.equal(view.nodes.get('direction-detail').textContent, 'Less than 5');
  assert.equal(view.nodes.get('direction-icon').textContent, '↓');
  assert.equal(view.nodes.get('progress-label').textContent, '2 of 16 connected');
  assert.equal(view.nodes.get('move-count').textContent, '1');
  assert.match(view.nodes.get('puzzle').innerHTML, /path step 2, current position/);
  const reloaded = openApp(view.saved);
  assert.deepEqual(plain(reloaded.app.game), plain(view.app.game));
  assert.equal(reloaded.nodes.get('direction-label').textContent, 'GO LOWER');
  assert.equal(reloaded.nodes.get('direction-detail').textContent, 'Less than 5');
  assert.equal(reloaded.nodes.get('puzzle').cells.get(4).tabIndex, 0);
});

test('nonadjacent, wrong-rhythm, and early-end taps explain the rule without adding moves', () => {
  const view = openApp();
  view.tap(4);
  for (const [cell, message] of [[5, /lower than 5/], [15, /beside your current step/]]) {
    view.tap(cell);
    assert.equal(view.app.game.moves, 1);
    assert.deepEqual(plain(view.app.game.path), [0, 4]);
    assert.match(view.nodes.get('feedback').textContent, message);
  }
  view.tap(8); view.tap(12);
  assert.equal(view.app.game.moves, 2);
  assert.deepEqual(plain(view.app.game.path), [0, 4, 8]);
  assert.match(view.nodes.get('feedback').textContent, /Save E/);
});

test('hint correction, undo, and confirmed path reset preserve honest assistance and move totals', () => {
  const view = openApp();
  view.tap(1);
  view.click('hint-button');
  assert.match(view.nodes.get('dialog-content').innerHTML, /1 move and 1 hint/);
  assert.match(view.nodes.get('dialog-content').innerHTML, /rewind/);
  assert.equal(view.app.game.hints, 0);
  view.action('close');
  assert.deepEqual(plain(view.app.game.path), [0, 1]);
  view.click('hint-button'); view.confirmHint();
  assert.deepEqual(plain(view.app.game.path), [0, 4]);
  assert.equal(view.app.game.moves, 2);
  assert.equal(view.app.game.hints, 1);
  assert.match(view.nodes.get('feedback').textContent, /Rewound 1 step to 1/);
  view.click('undo-button');
  assert.deepEqual(plain(view.app.game.path), [0]);
  assert.equal(view.app.game.moves, 3);
  view.tap(4); view.tap(8);
  view.click('reset-path-button');
  assert.equal(view.nodes.get('game-dialog').open, true);
  assert.match(view.nodes.get('dialog-content').innerHTML, /keeps your existing move and hint totals/);
  view.resetPath();
  assert.deepEqual(plain(view.app.game.path), [0]);
  assert.equal(view.app.game.moves, 6);
  assert.equal(view.app.game.hints, 1);
  assert.equal(view.nodes.get('game-dialog').open, false);
});

test('a perfect finish records one honest daily and the result offers immediate separate practice', () => {
  const view = openApp();
  for (const cell of PUZZLES[0].solution.slice(1)) view.tap(cell);
  assert.equal(view.app.game.status, 'won');
  assert.equal(view.nodes.get('progress-label').textContent, '16 of 16 connected');
  assert.equal(view.nodes.get('par-label').textContent, '✦ Perfect route');
  assert.match(view.nodes.get('puzzle').className, /is-complete celebrate/);
  assert.equal(view.nodes.get('game-controls').hidden, true);
  assert.equal(view.nodes.get('finished-actions').hidden, false);
  assert.deepEqual(view.stats(), { played: 1, won: 1, streak: 1, bestStreak: 1, perfect: 1, averageMoves: 15 });
  view.showPendingResult();
  assert.match(view.nodes.get('dialog-content').innerHTML, /Perfect flow/);
  assert.match(view.nodes.get('dialog-content').innerHTML, /data-action="random"/);
  view.action('random');
  assert.equal(view.app.mode, 'practice');
  assert.notEqual(view.app.puzzle.id, PUZZLES[0].id);
  assert.equal(view.app.game.moves, 0);
  assert.equal(view.app.game.path.length, 1);
  assert.equal(view.stats().perfect, 1);
});

test('revealing renders the full actual solution but records no win or perfect route', () => {
  const view = openApp();
  view.tap(4);
  view.action('reveal');
  assert.equal(view.app.game.status, 'revealed');
  assert.deepEqual(plain(view.app.game.path), PUZZLES[0].solution);
  assert.equal(view.app.game.moves, 1);
  assert.match(view.nodes.get('puzzle').className, /is-revealed/);
  assert.match(view.nodes.get('puzzle').getAttribute('aria-label'), /revealed route: 1, 5, 2, 13/);
  assert.equal(view.nodes.get('direction-label').textContent, 'Follow the numbered steps.');
  assert.match(view.nodes.get('dialog-content').innerHTML, /Revealed routes do not count as wins/);
  assert.deepEqual(view.stats(), { played: 1, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageMoves: 0 });
});

test('arrow keys move board focus without a move and Backspace rewinds one actual step', () => {
  const view = openApp();
  view.key(0, 'ArrowRight');
  assert.equal(view.document.activeElement.dataset.cell, '1');
  assert.equal(view.app.game.moves, 0);
  view.tap(4);
  view.key(4, 'Backspace');
  assert.deepEqual(plain(view.app.game.path), [0]);
  assert.equal(view.app.game.moves, 2);
  assert.equal(view.document.activeElement.dataset.cell, '0');
});


test('dead ends remain clear after reload and disappear after undo without revealing a move', () => {
  const view = openApp(), puzzle = view.app.puzzle;
  function deadEnd(state) {
    if (state.status !== 'playing') return null;
    const next = engine.legalNextCells(puzzle, state);
    if (!next.length) return state;
    for (const cell of next) { const found = deadEnd(engine.selectCell(puzzle,state,cell).state); if(found) return found; }
    return null;
  }
  const dead = deadEnd(view.app.game); assert.ok(dead);
  for(const cell of dead.path.slice(1)) view.tap(cell);
  const reloaded = openApp(view.saved);
  assert.equal(reloaded.nodes.get('direction-kicker').textContent, 'DEAD END');
  assert.equal(reloaded.nodes.get('direction-label').textContent, 'No next step.');
  assert.match(reloaded.nodes.get('movement-note').textContent, /Undo/);
  reloaded.click('undo-button');
  assert.notEqual(reloaded.nodes.get('direction-kicker').textContent, 'DEAD END');
});

test('finished route has ordered readable coordinates and is absent during play', () => {
  const view = openApp();
  assert.equal(view.nodes.get('route-inspection').hidden, true);
  assert.equal(view.nodes.get('route-steps').innerHTML, '');
  view.action('reveal');
  assert.equal(view.nodes.get('route-inspection').hidden, false);
  assert.equal((view.nodes.get('route-steps').innerHTML.match(/<li>/g)||[]).length, 16);
  assert.match(view.nodes.get('route-steps').innerHTML, /row 1, column 1/);
  assert.match(view.nodes.get('route-steps').innerHTML, /higher/);
  view.action('random');
  assert.equal(view.nodes.get('route-steps').innerHTML, '');
});
