import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const game = process.argv[2] || 'hunch';
const scenario = process.argv[3] || 'draft';
const base = fileURLToPath(new URL('../../src/games/', import.meta.url));
const dom = new JSDOM('<div id="a"></div><div id="b"></div>', { url: 'https://games.example.test/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MutationObserver', 'NodeFilter', 'HTMLInputElement', 'getComputedStyle']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const disk = dom.window.localStorage;
let blockReads = scenario === 'blocked', blockWrites = false;
let writes = 0;
let onRead = () => undefined;
const storage = {
  getItem(key) { if (blockReads) throw new Error('read denied'); onRead(key); return disk.getItem(key); },
  setItem(key, value) { writes++; if (blockWrites) throw new Error('quota'); disk.setItem(key, value); },
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
const delayed = new Map();
let timerId = -1;
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = globalThis.clearTimeout;
window.setTimeout = (fn, ms, ...args) => {
  if (game === 'cairn' && [650, 1300].includes(ms)) { const id = timerId--; delayed.set(id, () => fn(...args)); return id; }
  return nativeSetTimeout(fn, ms, ...args);
};
globalThis.clearTimeout = id => { if (delayed.has(id)) delayed.delete(id); else nativeClearTimeout(id); };
async function advanceTimers() { const pending = [...delayed.values()]; delayed.clear(); await act(async () => pending.forEach(fn => fn())); }

// Each tab gets its own module cache (including the in-memory storage fallback).
// React and the DOM are the real libraries; only Vite raw-text loading is emulated.
function tabLoader() {
  const cache = new Map();
  function load(file) {
    if (file.endsWith('?raw')) return readFileSync(file.slice(0, -4), 'utf8');
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
    const module = { exports: {} }; cache.set(file, module);
    const require = createRequire(file);
    const localRequire = id => {
      if (!id.startsWith('.') && !id.startsWith('@/')) return require(id);
      let target = id.startsWith('@/') ? resolve(base, '..', id.slice(2)) : resolve(dirname(file), id);
      if (!target.endsWith('?raw')) target = [target, `${target}.ts`, `${target}.tsx`, `${target}.json`].find(existsSync);
      assert.ok(target, `resolve ${id} from ${file}`);
      return load(target);
    };
    const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Script(`(function(require,module,exports){${output}\n})`, { filename: file }).runInThisContext()(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const title = game === 'cairn' ? 'Game' : game[0].toUpperCase() + game.slice(1);
const roots = [];
const tabs = [];
async function mount(id) {
  const load = tabLoader();
  const useGame = load(resolve(base, game, `use${title}.ts`))[`use${title}`];
  const tab = { load };
  const root = createRoot(document.getElementById(id)); roots.push(root);
  function Probe() { tab.value = useGame(); return null; }
  await act(async () => root.render(React.createElement(Probe)));
  assert.equal(tab.value.state.phase, 'playing'); tabs.push(tab); return tab;
}
async function run(tab, action, ...args) { await act(async () => tab.value.actions[action](...args)); }
function pathFor(word, grid) {
  function visit(path) {
    if (path.length === word.length) return path;
    for (let i = 0; i < 16; i++) {
      const prev = path.at(-1);
      if (grid[i] !== word[path.length] || path.includes(i)) continue;
      if (prev !== undefined && (Math.abs(i % 4 - prev % 4) > 1 || Math.abs(Math.floor(i / 4) - Math.floor(prev / 4)) > 1)) continue;
      const found = visit([...path, i]); if (found) return found;
    }
    return null;
  }
  return visit([]);
}
async function cairnWord(tab) {
  const state = tab.value.state;
  const slots = new Set();
  for (const letter of state.puzzle.words[state.level]) {
    const i = state.rack.findIndex((ch, index) => ch === letter && !slots.has(index)); slots.add(i);
    await run(tab, 'tapRack', i);
  }
  await run(tab, 'submit');
}
async function solve(tab) {
  if (game === 'hunch') {
    for (const ch of tab.value.state.answer) await run(tab, 'keyLetter', ch);
    await run(tab, 'submit');
  } else if (game === 'morph') {
    for (const word of tab.value.state.puzzle.p.slice(1)) {
      const old = tab.value.state.rows.at(-1);
      const i = [...old].findIndex((ch, index) => ch !== word[index]);
      await run(tab, 'openCell', i); await run(tab, 'pickLetter', word[i]); await run(tab, 'submit');
    }
  } else if (game === 'cairn') {
    for (let level = 0; level < 5; level++) { await cairnWord(tab); await advanceTimers(); }
  } else if (game === 'circuit') {
    for (const word of tab.value.state.puzzle.sol) {
      const current = tab.value.state.current.length;
      for (const ch of word.slice(current)) await run(tab, 'tapLetter', tab.value.state.puzzle.l.indexOf(ch));
      await run(tab, 'submit');
      if (tab.value.state.finished) break;
    }
  } else if (game === 'quartet') {
    for (let group = 0; group < 4; group++) {
      const indices = tab.value.state.tiles.flatMap((tile, i) => tile?.group === group ? [i] : []);
      for (const i of indices) await run(tab, 'toggleTile', i);
      await run(tab, 'submit');
    }
  } else if (game === 'tangle') {
    for (const word of [...tab.value.state.puzzle.words].sort((a, b) => b.length - a.length)) {
      const path = pathFor(word, tab.value.state.puzzle.g); assert.ok(path);
      await run(tab, 'setPath', path); await run(tab, 'submitPath');
      if (tab.value.state.goldReached) break;
    }
  }
  assert.ok(tab.value.state.finished || tab.value.state.goldReached, 'actual actions finish the round');
}
try {
  const a = await mount('a'), b = await mount('b');
  const key = `kimi:${game}:v1:day:${a.value.state.dayNumber}`;
  if (scenario === 'draft') {
    if (game === 'hunch') {
      for (const ch of 'drain') await run(a, 'keyLetter', ch);
      await run(a, 'submit');
      assert.deepEqual(a.value.state.guesses, ['drain']);
      await run(b, 'keyLetter', 'p');
      assert.deepEqual(b.value.state.guesses, ['drain'], 'stale tab adopts accepted guess before applying input');
      assert.deepEqual(JSON.parse(disk.getItem(key)).guesses, ['drain'], 'stale tab cannot erase accepted guess');
    } else {
      await run(a, 'hint');
      const accepted = JSON.parse(disk.getItem(key));
      await run(b, 'hint');
      const hints = game === 'cairn' ? 'hints' : 'hintsUsed';
      assert.equal(b.value.state[hints], 1);
      assert.deepEqual(JSON.parse(disk.getItem(key)), accepted, 'stale action adopts the other tab hint unchanged');
    }
  }
  if (scenario === 'persist') {
    const baseline = disk.getItem(key);
    await run(b, 'hint');
    const incoming = JSON.parse(disk.getItem(key));
    const hints = game === 'cairn' ? 'hints' : 'hintsUsed';
    incoming[hints] = 2;
    if (game === 'hunch') incoming.hintLetters = [...new Set(b.value.state.answer)].slice(0, 2);
    disk.setItem(key, baseline);
    await act(async () => {
      a.value.actions.hint(); // state is queued; React has not run its persist effect
      disk.setItem(key, JSON.stringify(incoming));
    });
    assert.equal(a.value.state[hints], 2, 'persist effect adopts a concurrent valid save before writing');
    assert.equal(JSON.parse(disk.getItem(key))[hints], 2);
    assert.equal(a.value.state.stats.played, 0);
    assert.equal(a.value.state.stats.completed, 0);
  }
  if (scenario === 'checkpoint') {
    for (const ch of a.value.state.answer) await run(a, 'keyLetter', ch);
    const incoming = JSON.parse(disk.getItem(key));
    incoming.guesses = [a.value.state.answer === 'drain' ? 'pride' : 'drain'];
    incoming.current = ''; incoming.countedPlayed = true;
    const statsKey = `kimi:${game}:v1:stats`;
    const incomingStats = { ...a.value.state.stats, played: 1 };
    let reads = 0;
    onRead = readKey => {
      if (readKey === key && ++reads === 3) {
        onRead = () => undefined;
        disk.setItem(key, JSON.stringify(incoming));
        disk.setItem(statsKey, JSON.stringify(incomingStats));
      }
    };
    await run(a, 'submit');
    assert.deepEqual(a.value.state.guesses, incoming.guesses, 'conflict inside markPlayed aborts the rest of the stale action');
    assert.equal(a.value.state.finished, false);
    assert.deepEqual(a.value.state.stats, incomingStats);
    assert.deepEqual(JSON.parse(disk.getItem(statsKey)), incomingStats);
  }
  if (scenario === 'corrupt-terminal') {
    disk.setItem(key, JSON.stringify({ finished: true }));
    await run(a, 'hint');
    await solve(a);
    assert.ok(a.value.state.finished || a.value.state.goldReached);
    assert.equal(a.value.state.stats.completed, 1);
    assert.equal(JSON.parse(disk.getItem(key)).countedPlayed, true);
  }
  if (scenario === 'terminal' || scenario === 'assisted') {
    if (scenario === 'assisted') await run(a, 'hint');
    await solve(a);
    const accepted = disk.getItem(key);
    const stats = disk.getItem(`kimi:${game}:v1:stats`);
    assert.equal(a.value.state.stats.played, 1);
    assert.equal(a.value.state.stats.completed, 1);
    await run(b, 'hint');
    assert.ok(b.value.state.finished || b.value.state.goldReached);
    assert.deepEqual(b.value.state.stats, a.value.state.stats, 'adoption does not award play/completion again');
    assert.equal(disk.getItem(key), accepted, 'first terminal save remains exact after stale input');
    assert.equal(disk.getItem(`kimi:${game}:v1:stats`), stats);
    await run(b, 'hint');
    if (game !== 'tangle') assert.equal(disk.getItem(key), accepted, 'terminal board cannot be mutated');
    else {
      const next = b.value.state.puzzle.words.find(word => !b.value.state.found.includes(word));
      await run(b, 'setPath', pathFor(next, b.value.state.puzzle.g)); await run(b, 'submitPath');
      assert.ok(b.value.state.found.includes(next), 'Tangle remains playable after gold');
      assert.equal(b.value.state.stats.completed, 1);
    }
    if (scenario === 'assisted') {
      const { medalFor, buildMorphShare } = a.load(resolve(base, 'morph/engine.ts'));
      const state = a.value.state;
      assert.equal(state.hintsUsed, 1);
      assert.equal(medalFor(state.rows.length - 1, state.puzzle.par, false, 1).icon, '🥇');
      assert.match(medalFor(state.rows.length - 1, state.puzzle.par, false, 1).label, /Assisted/);
      assert.match(buildMorphShare(state.puzzleNo, state.rows.length - 1, state.puzzle.par, false, state.hintsUsed), /💡 Assisted · route shown/);
      assert.doesNotMatch(buildMorphShare(state.puzzleNo, state.rows.length - 1, state.puzzle.par, false), /Assisted|💡/);
      const { MorphWinModal } = a.load(resolve(base, 'morph/MorphWinModal.tsx'));
      const holder = document.createElement('div'); document.body.append(holder);
      const modal = createRoot(holder); roots.push(modal);
      let copied = '';
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text; } } });
      await act(async () => modal.render(React.createElement(MorphWinModal, {
        open: true, onOpenChange() {}, mode: 'daily', puzzle: state.puzzle, puzzleNo: state.puzzleNo,
        rows: state.rows, misses: state.misses, gaveUp: false, hintsUsed: state.hintsUsed,
        onPractice() {}, onNewPractice() {}, onBackToDaily() {},
      })));
      assert.match(document.body.textContent, /Assisted · route shown during play/);
      const share = [...document.querySelectorAll('button')].find(button => button.textContent === 'Share result');
      assert.ok(share);
      await act(async () => share.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
      assert.match(copied, /💡 Assisted · route shown/);

    }
  }
  if (scenario === 'event') {
    await run(a, 'hint');
    await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key })));
    assert.equal(b.value.state[game === 'cairn' ? 'hints' : 'hintsUsed'], 1, 'storage notification adopts without input');
    const accepted = disk.getItem(key);
    disk.setItem(key, '{invalid');
    await run(b, 'hint');
    assert.equal(b.value.state.phase, 'playing', 'corrupt external value does not reset the board');
    disk.setItem(key, accepted);
  }
  if (scenario === 'blocked') {
    assert.equal(writes, 0, 'read-blocked initialization never attempts writes even when setItem would succeed');
    await solve(a);
    assert.equal(a.value.state.stats.completed, 1, 'memory-only game can finish');
    assert.equal(writes, 0, 'all memory-only gameplay remains off disk');
    assert.equal(disk.getItem(key), null);
  }
  if (scenario === 'quota') {
    blockWrites = true;
    await solve(a);
    assert.equal(a.value.state.stats.completed, 1, 'quota failure stays playable');
    blockWrites = false;
  }
  if (scenario === 'delayed') {
    await cairnWord(a);
    assert.equal(a.value.state.phase, 'advancing');
    await run(b, 'hint'); // first input adopts A's pending round
    await run(b, 'hint'); // next input commits B's hint
    const accepted = disk.getItem(key);
    await advanceTimers();
    assert.equal(a.value.state.level, 0, 'old advance callback is discarded after a concurrent change');
    assert.equal(a.value.state.hints, 1);
    assert.equal(disk.getItem(key), accepted);
  }
  console.log(`${game}: ${scenario} passed`);
} finally {
  for (const root of roots) await act(async () => root.unmount());
  dom.window.close();
}
