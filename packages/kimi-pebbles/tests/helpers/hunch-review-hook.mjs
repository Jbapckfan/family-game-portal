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

const game = 'hunch';
const scenario = process.argv[2];
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
      if(id==='canvas-confetti')return {__esModule:true,default:()=>{confettiCalls++}};
      if (!id.startsWith('.') && !id.startsWith('@/')) return require(id);
      let target = id.startsWith('@/') ? resolve(base, '..', id.slice(2)) : resolve(dirname(file), id);
      if (!target.endsWith('?raw')) target = [target, `${target}.ts`, `${target}.tsx`, `${target}.json`].find(existsSync);
      assert.ok(target, `resolve ${id} from ${file}`);
      return load(target);
    };
    const override=process.env.HUNCH_BASELINE_DIR&&file.startsWith(resolve(base,'hunch')+'/')?resolve(process.env.HUNCH_BASELINE_DIR,file.slice(resolve(base,'hunch').length+1)):file;
    const output = ts.transpileModule(readFileSync(override, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Script(`(function(require,module,exports){${output}\n})`, { filename: file }).runInThisContext()(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}


let confettiCalls=0,state,actions;
for(const n of ['DocumentFragment','NodeFilter','HTMLTextAreaElement','HTMLSelectElement'])Object.defineProperty(globalThis,n,{configurable:true,value:dom.window[n]});
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);Object.defineProperty(globalThis,'getComputedStyle',{configurable:true,value:dom.window.getComputedStyle.bind(dom.window)});
const NativeDate=globalThis.Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[20756*86400000+18*3600000]));}static now(){return 20756*86400000+18*3600000;}};
disk.setItem('kimi:hunch:seen-help','1');disk.setItem('kimi:settings:v1:sound','false');
async function mount(){const load=tabLoader(),hooks=load(resolve(base,'hunch/useHunch.ts')),real=hooks.useHunch;hooks.useHunch=(...args)=>{const value=real(...args);({state,actions}=value);return value};const Page=load(resolve(base,'hunch/HunchPage.tsx')).default;const root=createRoot(document.getElementById('a'));await act(async()=>root.render(React.createElement(Page)));assert.equal(state.phase,'playing');return root;}
async function enter(word){for(const c of word)await act(async()=>actions.keyLetter(c));await act(async()=>actions.submit());}
let root=await mount();
if(scenario==='focus'){for(const c of 'cranx')await act(async()=>actions.keyLetter(c));const del=document.querySelector('[aria-label="Delete letter"]');await act(async()=>{del.focus();del.click()});await act(async()=>del.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'e',bubbles:true,cancelable:true})));assert.equal(document.activeElement?.tagName,'MAIN');await act(async()=>document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.equal(state.guesses.length,1);assert.equal(state.guesses[0],'crane');await act(async()=>root.unmount());
}else if(scenario==='composition'){await act(async()=>document.body.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'q',isComposing:true,bubbles:true,cancelable:true})));assert.equal(state.current,'');await act(async()=>root.unmount());
}else if(scenario==='burst'){const answer=state.answer;await act(async()=>{for(const key of [...answer,'Enter'])document.body.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))});assert.equal(state.guesses.length,1);assert.equal(state.won,true);await act(async()=>root.unmount());
}else if(scenario==='hint-aggregate'){const words=readFileSync(resolve(base,'cairn/data/dict.txt'),'utf8').split(/\s+/).filter(w=>/^[a-z]{5}$/.test(w));const guess=words.find(w=>w!==state.answer&&w.includes(state.answer[0]));assert.ok(guess);await enter(guess);const random=Math.random;Math.random=()=>0;await act(async()=>actions.hint());Math.random=random;assert.equal(state.hintsUsed,1);assert.equal(state.hintLetters[0],state.answer[0]);await act(async()=>root.unmount());
}else if(scenario==='practice'){const originalRandom=Math.random;Math.random=()=>0;await act(async()=>actions.startPractice());const first=state.puzzleNo;await act(async()=>actions.startPractice());assert.notEqual(state.puzzleNo,first);Math.random=originalRandom;await act(async()=>root.unmount());
}else if(scenario==='duplicate'){
 const guess=state.answer==='crane'?'slate':'crane';await enter(guess);assert.equal(state.guesses.length,1);await enter(guess);assert.equal(state.guesses.length,1);assert.equal(state.current,guess);await act(async()=>root.unmount());
}else{
 const answer=state.answer;await enter(answer);assert.equal(state.won,true);await act(async()=>new Promise(r=>setTimeout(r,350)));assert.ok(confettiCalls>0);const earned=confettiCalls;await act(async()=>root.unmount());
 const load=tabLoader(),hooks=load(resolve(base,'hunch/useHunch.ts')),real=hooks.useHunch;hooks.useHunch=(...args)=>{const value=real(...args);({state,actions}=value);return value};const Page=load(resolve(base,'hunch/HunchPage.tsx')).default;root=createRoot(document.getElementById('a'));await act(async()=>root.render(React.createElement(Page)));await act(async()=>new Promise(r=>setTimeout(r,1100)));assert.equal(state.finished,true);assert.equal(confettiCalls,earned);assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(state.freshFinish,false);await act(async()=>root.unmount());
}
globalThis.Date=NativeDate;dom.window.close();console.log('PASS real Hunch '+scenario);
