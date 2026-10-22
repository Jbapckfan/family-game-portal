import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';

// Real React and Radix portals, focus scopes and Escape listeners. Only game
// engines/boards are fixtures; no dialog or coordinator behavior is mocked.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const originalGlobals = new Map();
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'NodeFilter', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'getComputedStyle', 'localStorage']) {
  originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom.window[name] });
}
originalGlobals.set('IS_REACT_ACT_ENVIRONMENT', Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createElement, act } = await import('react');
const { createRoot } = await import('react-dom/client');
after(() => {
  dom.window.close();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

const games = ['cairn', 'morph', 'hunch', 'circuit', 'tangle', 'quartet'];
const titles = Object.fromEntries(games.map(game => [game, game[0].toUpperCase() + game.slice(1)]));
const flush = () => new Promise(resolve => setTimeout(resolve, 5));
const openDialogs = () => [...document.querySelectorAll('[role="dialog"][data-state="open"]')];
function button(name) {
  const found = [...document.querySelectorAll('button')].find(el => (el.getAttribute('aria-label') || el.textContent.trim()) === name);
  assert.ok(found, `button ${name} exists`);
  return found;
}
async function click(name) {
  const target = button(name);
  await act(async () => { target.focus(); target.click(); await flush(); });
  return target;
}
async function escape() {
  await act(async () => {
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await flush();
  });
  // Radix restores focus on the turn after its content unmounts.
  await act(flush);
}

async function mount(game = 'morph', completed = true, { firstHelp = false, rolloverChanges = null } = {}) {
  document.body.innerHTML = '<div id="root"></div>';
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  for (const name of games) localStorage.setItem(`kimi:${name}:seen-help`, '1');
  localStorage.setItem('kimi:cairn:v1:seen-help', '1');
  if (firstHelp) localStorage.removeItem(game === 'cairn' ? 'kimi:cairn:v1:seen-help' : `kimi:${game}:seen-help`);
  const file = fileURLToPath(new URL(`../../src/games/${game}/${titles[game]}Page.tsx`, import.meta.url));
  const require = createRequire(file);
  const puzzle = game === 'hunch' ? null : game === 'cairn' ? { words: ['arc', 'char', 'reach', 'search', 'reaches'] } : JSON.parse(readFileSync(new URL(`../../src/games/${game}/data/puzzles.json`, import.meta.url), 'utf8'))[0];
  let state = {
    mode: 'daily', phase: completed && game !== 'tangle' ? 'finished' : 'playing', dayNumber: 100, puzzleNo: 1,
    puzzle, answer: 'crane', rows: ['cold'], results: [], played: [], found: [], history: [], evals: [], guesses: [],
    stats: { played: 1, completed: 0, currentStreak: 0, maxStreak: 0, perfect: 0, totalMisses: 0 },
    finished: completed, goldReached: completed, winShownOnce: completed, won: false, gaveUp: true,
    perfect: false, score: 0, misses: 0, hintsUsed: 0, toast: null,
  };
  const root = createRoot(document.getElementById('root'));
  let Page;
  const render = () => root.render(createElement(Page));
  const actions = {
    startPractice() { state = { ...state, mode: 'practice', phase: 'playing', finished: false, goldReached: false, winShownOnce: false }; render(); },
    exitPractice() { state = { ...state, mode: 'daily', phase: 'playing', finished: false, goldReached: false, winShownOnce: false }; render(); },
  };
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Script(`(function(require,module,exports){${compiled}\n})`, { filename: file }).runInThisContext()((id) => {
    if (/^\.\/use/.test(id)) return new Proxy({}, { get: () => () => ({ state, actions }) });
    if (id.endsWith('/useUnifiedProgress')) return { useUnifiedProgress() {} };
    if (id.endsWith('/effects')) return { ...require(id), fireConfetti() {} };
    if (id.endsWith('Board')) return { [`${titles[game]}Board`]: () => null, GameBoard: () => null };
    if (game === 'cairn' && id === './WinModal') {
      // Cairn's formatting module imports Vite-only raw word lists. Keep the
      // real modal and isolate its unrelated dictionary/share-text dependency.
      const modalFile = file.replace('CairnPage.tsx', 'WinModal.tsx');
      const modal = { exports: {} };
      const code = ts.transpileModule(readFileSync(modalFile, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
      new Script(`(function(require,module,exports){${code}\n})`, { filename: modalFile }).runInThisContext()((name) => name === './engine' ? {
        buildShareText: () => 'CAIRN', emojiFor: () => '⬛', msUntilTomorrow: () => 10000,
      } : require(name), modal, modal.exports);
      return modal.exports;
    }
    return require(id);
  }, module, module.exports);
  Page = module.exports.default;
  let nextTimer = 100000, now = 0;
  const timers = new Map();
  const set = window.setTimeout, clear = window.clearTimeout;
  window.setTimeout = (callback, delay = 0, ...args) => {
    if (delay < 400) return set.call(window, callback, delay, ...args);
    const id = nextTimer++;
    timers.set(id, { time: now + delay, callback: () => callback(...args) });
    return id;
  };
  window.clearTimeout = id => { if (!timers.delete(id)) clear.call(window, id); };
  // Game hooks register their day-refresh listener before the coordinator.
  // Exercise both updates in one event/batch instead of precommitting the day.
  const rollover = () => {
    if (!document.hidden && rolloverChanges) { state = { ...state, ...rolloverChanges }; render(); }
  };
  document.addEventListener('visibilitychange', rollover);
  await act(async () => { render(); await flush(); });
  return {
    async advance(milliseconds = 1000) {
      await act(async () => {
        now += milliseconds;
        for (const [id, timer] of [...timers]) if (timer.time <= now) { timers.delete(id); timer.callback(); }
        await flush();
      });
    },
    async update(changes) { await act(async () => { state = { ...state, ...changes }; render(); await flush(); }); },
    async visibility(hidden) {
      await act(async () => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: hidden ? 'hidden' : 'visible' });
        document.dispatchEvent(new Event('visibilitychange')); await flush();
      });
    },
    async pageEvent(name) { await act(async () => { window.dispatchEvent(new Event(name)); await flush(); }); },
    async close() {
      document.removeEventListener('visibilitychange', rollover);
      await act(async () => { root.unmount(); await flush(); });
      await act(flush);
      window.setTimeout = set; window.clearTimeout = clear;
      document.body.innerHTML = '';
      assert.equal(timers.size, 0, 'result timers cleaned up on unmount');
    },
  };
}

for (const game of games) {
  test(`${game}: statistics chosen before the result delay stays the only overlay`, async () => {
    const fixture = await mount(game);
    try {
      await click('Statistics');
      await fixture.advance();
      assert.equal(openDialogs().length, 1);
      assert.match(openDialogs()[0].textContent, /Your play statistics/);
    } finally { await fixture.close(); }
  });
}

test('Escape restores Statistics focus and the dismissed result timer does not reopen', async () => {
  const fixture = await mount();
  try {
    const opener = await click('Statistics');
    await escape();
    assert.equal(openDialogs().length, 0);
    assert.ok(document.activeElement === opener, 'focus returns to the opening control');
    await fixture.advance();
    assert.equal(openDialogs().length, 0);
    await click('Statistics');
    assert.equal(openDialogs().length, 1);
    await escape();
    assert.ok(document.activeElement === opener, 'focus returns to the opening control');
  } finally { await fixture.close(); }
});

test('manual See results cancels its automatic timer and restores keyboard focus on close', async () => {
  const fixture = await mount();
  try {
    const opener = await click('See results');
    await escape();
    await fixture.advance();
    assert.equal(openDialogs().length, 0);
    assert.ok(document.activeElement === opener, 'focus returns to the opening control');
    await click('See results');
    assert.equal(openDialogs().length, 1);
  } finally { await fixture.close(); }
});

test('automatically opened results restore focus to the visible See results control', async () => {
  const fixture = await mount();
  try {
    await fixture.advance();
    assert.equal(openDialogs().length, 1);
    await escape();
    assert.ok(document.activeElement === button('See results'), 'automatic results return focus to See results');
  } finally { await fixture.close(); }
});

test('a hidden completion waits for visibility and opens only once', async () => {
  const fixture = await mount();
  try {
    await fixture.visibility(true); await fixture.advance();
    assert.equal(openDialogs().length, 0);
    await fixture.visibility(false);
    assert.equal(openDialogs().length, 1);
    await escape(); await fixture.visibility(true); await fixture.visibility(false);
    assert.equal(openDialogs().length, 0);
  } finally { await fixture.close(); }
});

test('interrupted pages defer results until pageshow and discard a previous day', async () => {
  const fixture = await mount();
  try {
    await fixture.pageEvent('pagehide'); await fixture.advance();
    assert.equal(openDialogs().length, 0);
    await fixture.update({ dayNumber: 101, phase: 'playing', finished: false });
    await fixture.pageEvent('pageshow');
    assert.equal(openDialogs().length, 0);
    await fixture.update({ phase: 'finished', finished: true }); await fixture.advance();
    assert.equal(openDialogs().length, 1);
  } finally { await fixture.close(); }
});

test('new practice rounds close results even if the selected puzzle number repeats', async () => {
  const fixture = await mount();
  try {
    await click('See results'); await click('Practice while you wait');
    await fixture.advance();
    assert.equal(openDialogs().length, 0);
    await fixture.update({ phase: 'finished', finished: true });
    assert.equal(openDialogs().length, 0, 'old open flag must not open the new result early');
    await fixture.advance(); assert.equal(openDialogs().length, 1);
    await click('New practice round');
    await fixture.update({ phase: 'finished', finished: true });
    assert.equal(openDialogs().length, 0);
    await fixture.advance(); assert.equal(openDialogs().length, 1);
  } finally { await fixture.close(); }
});

test('manually opened help restores focus to its opening control', async () => {
  const fixture = await mount('morph', false);
  try {
    await click('How to play'); await escape();
    assert.ok(document.activeElement === button('How to play'), 'help returns focus to its opener');
  } finally { await fixture.close(); }
});

test('first-visit automatic Help closes to the game focus target', async () => {
  const fixture = await mount('morph', false, { firstHelp: true });
  try {
    assert.equal(openDialogs().length, 1);
    assert.match(openDialogs()[0].textContent, /MORPH/);
    await escape();
    assert.equal(openDialogs().length, 0);
    assert.ok(document.activeElement === document.querySelector('[data-game-focus]'));
  } finally { await fixture.close(); }
});

test('visibility rollover in the same event discards a previous day result', async () => {
  const fixture = await mount('morph', true, { rolloverChanges: { dayNumber: 101, phase: 'playing', finished: false } });
  try {
    await fixture.visibility(true); await fixture.advance(); await fixture.visibility(false);
    assert.equal(openDialogs().length, 0);
    await fixture.advance(); assert.equal(openDialogs().length, 0);
  } finally { await fixture.close(); }
});

test('a completed new day resumed in the same event receives its own delay', async () => {
  const fixture = await mount('morph', true, { rolloverChanges: { dayNumber: 101, phase: 'finished', finished: true } });
  try {
    await fixture.visibility(true); await fixture.advance(); await fixture.visibility(false);
    assert.equal(openDialogs().length, 0);
    await fixture.advance(); assert.equal(openDialogs().length, 1);
  } finally { await fixture.close(); }
});

test('replacing Help with Statistics keeps focus inside the replacement dialog', async () => {
  const fixture = await mount('morph', false);
  try {
    await click('How to play'); await click('Statistics'); await act(flush);
    assert.equal(openDialogs().length, 1);
    assert.match(openDialogs()[0].textContent, /Your play statistics/);
    assert.ok(openDialogs()[0].contains(document.activeElement));
  } finally { await fixture.close(); }
});
