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

const game = 'tangle';
const scenario = 'legacy';
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

const bank=JSON.parse(readFileSync(resolve(base,'tangle/data/puzzles.json'),'utf8'));
const exclusions=new Set(['ccm','ccw','ccws','cfm','whf','mahmoud','wilhelm','nig','wog','coon','fag','fags']);
let day=20757;while(!bank[day%430].words.some(word=>exclusions.has(word)))day++;
assert.ok(day<20937);const raw=bank[day%430],removed=raw.words.find(word=>exclusions.has(word));
const extension=JSON.parse(readFileSync(resolve(base,'tangle/data/lexicon-expansions.json'),'utf8'))[raw.g].find(word=>!raw.words.includes(word));assert.ok(extension);
const NativeDate=globalThis.Date;globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[day*86400000+18*3600000]));}static now(){return day*86400000+18*3600000;}};
const saved={found:[removed,extension,...raw.words.filter(word=>word!==removed).slice(0,20)],misses:2,hintsUsed:0,countedPlayed:true};
const key=`kimi:tangle:v1:day:${day}`;disk.setItem(key,JSON.stringify(saved));
const statsKey='kimi:tangle:v1:stats';disk.setItem(statsKey,JSON.stringify({played:1,completed:1,currentStreak:1,maxStreak:1,lastCompletedDay:day}));
let state;
for(let pass=0;pass<2;pass++){
 const load=tabLoader(),useTangle=load(resolve(base,'tangle/useTangle.ts')).useTangle,progress=load(resolve(base,'tangle/progress.ts'));
 const expected=progress.restoreTangleProgress(saved,load(resolve(base,'tangle/lexicon.ts')).expandTanglePuzzle({...raw,targets:progress.medalTargets(raw.max)}));
 const root=createRoot(document.getElementById('a'));function Probe(){state=useTangle().state;return null;}
 await act(async()=>root.render(React.createElement(Probe)));
 assert.equal(JSON.parse(disk.getItem(statsKey)).completed,1);assert.equal(state.phase,'playing');assert.deepEqual(state.found,expected.found);assert.equal(state.score,expected.score);assert.equal(state.misses,2);assert.equal(state.goldReached,expected.goldReached);assert.ok(state.puzzle.words.includes(removed));
 assert.deepEqual(progress.restoreTangleProgress(JSON.parse(disk.getItem(key)),state.puzzle),expected);
 await act(async()=>root.unmount());
}
disk.removeItem(key);disk.removeItem(statsKey);
const load=tabLoader(),useTangle=load(resolve(base,'tangle/useTangle.ts')).useTangle;
const root=createRoot(document.getElementById('b'));function Fresh(){state=useTangle().state;return null;}
await act(async()=>root.render(React.createElement(Fresh)));
assert.deepEqual(state.found,[]);assert.ok(!state.puzzle.words.includes(removed));
await act(async()=>root.unmount());globalThis.Date=NativeDate;dom.window.close();
console.log(`PASS real Tangle legacy plus expansion save preserved across reload on day${day}; fresh game reviewed`);
