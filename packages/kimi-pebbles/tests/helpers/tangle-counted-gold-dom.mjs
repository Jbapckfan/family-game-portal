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


const day=20757,NativeDate=globalThis.Date;
globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[day*86400000+18*3600000]));}static now(){return day*86400000+18*3600000;}};
const key=`kimi:tangle:v1:day:${day}`,statsKey='kimi:tangle:v1:stats';
disk.setItem(key,JSON.stringify({found:[],misses:0,hintsUsed:0,countedPlayed:true}));
disk.setItem(statsKey,JSON.stringify({played:1,completed:1,currentStreak:1,maxStreak:1,lastCompletedDay:day}));
const load=tabLoader(),useTangle=load(resolve(base,'tangle/useTangle.ts')).useTangle;
let state,actions;const root=createRoot(document.getElementById('a'));
function Probe(){({state,actions}=useTangle());return null;}
await act(async()=>root.render(React.createElement(Probe)));
function path(word){const g=state.puzzle.g;function search(i,k,used){if(g[i]!==word[k])return null;if(k===word.length-1)return[i];for(let j=0;j<16;j++)if(!used.has(j)&&i!==j&&Math.abs(i%4-j%4)<=1&&Math.abs(Math.floor(i/4)-Math.floor(j/4))<=1){const p=search(j,k+1,new Set([...used,j]));if(p)return[i,...p]}return null}for(let i=0;i<16;i++){const p=search(i,0,new Set([i]));if(p)return p}throw Error(word)}
for(const word of state.puzzle.words){await act(async()=>actions.setPath(path(word)));await act(async()=>actions.submitPath());if(state.goldReached)break;}
assert.ok(state.goldReached);assert.equal(JSON.parse(disk.getItem(statsKey)).completed,1);assert.equal(JSON.parse(disk.getItem(statsKey)).played,1);
await act(async()=>root.unmount());globalThis.Date=NativeDate;dom.window.close();
console.log('PASS real Tangle previously-counted day cannot count a fresh Gold crossing twice');
