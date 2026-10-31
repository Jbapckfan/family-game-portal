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

const game = 'circuit';
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
    const override=process.env.CIRCUIT_BASELINE_DIR&&file.startsWith(resolve(base,'circuit')+'/')?resolve(process.env.CIRCUIT_BASELINE_DIR,file.slice(resolve(base,'circuit').length+1)):file;
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
disk.setItem('kimi:circuit:seen-help','1');disk.setItem('kimi:settings:v1:sound','false');
async function mount(){const load=tabLoader(),hooks=load(resolve(base,'circuit/useCircuit.ts')),real=hooks.useCircuit;hooks.useCircuit=(...args)=>{const value=real(...args);({state,actions}=value);return value};const Page=load(resolve(base,'circuit/CircuitPage.tsx')).default;const root=createRoot(document.getElementById('a'));await act(async()=>root.render(React.createElement(Page)));return root;}
async function word(w){await act(async()=>actions.clearWord());for(const c of w)await act(async()=>actions.tapLetter(state.puzzle.l.indexOf(c)));await act(async()=>actions.submit());}
const button=pattern=>[...document.querySelectorAll('button')].find(b=>pattern.test(b.getAttribute('aria-label')||b.textContent));let root=await mount();
try{
 if(scenario==='focus-cancel'){const opener=button(/Route clue/);opener.focus();await act(async()=>opener.click());await act(async()=>button(/Keep playing/).click());await act(async()=>new Promise(r=>setTimeout(r,300)));assert.ok(document.activeElement===opener,'cancel restores the actual clue opener');
 }else if(scenario==='undo-focus'){assert.equal(state.puzzle.par,3);await word(state.puzzle.sol[0]);await word(state.puzzle.sol[1]);const undo=button(/Undo word/);await act(async()=>{undo.focus();undo.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,detail:1}))});assert.ok(document.activeElement!==undo,'pointer Undo releases native Enter ownership');await act(async()=>document.activeElement.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.equal(state.played.length,2);
 }else if(scenario==='restore'){for(const w of state.puzzle.sol)await word(w);assert.equal(state.finished,true);assert.equal(state.gaveUp,false);await act(async()=>new Promise(r=>setTimeout(r,350)));assert.ok(confettiCalls>0);const earned=confettiCalls;await act(async()=>root.unmount());root=await mount();await act(async()=>new Promise(r=>setTimeout(r,1100)));assert.equal(state.finished,true);assert.equal(confettiCalls,earned);assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(state.freshFinish,false);
 }else if(scenario==='practice'){const before=JSON.stringify(state.stats),random=Math.random;Math.random=()=>0;await act(async()=>actions.startPractice());const first=state.puzzleNo;await act(async()=>actions.startPractice());assert.notEqual(state.puzzleNo,first);assert.equal(JSON.stringify(state.stats),before);Math.random=random;
 }else if(scenario==='burst'){const w=state.puzzle.sol[0];await act(async()=>{for(const key of [...w,'Enter'])document.body.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))});assert.equal(state.played.length,1);assert.equal(state.played[0],w);
 }else if(scenario==='consent'){await act(async()=>button(/Route clue/).click());assert.equal(state.hintsUsed,0);assert.ok(document.querySelector('[role="dialog"]'));await act(async()=>button(/Keep playing/).click());assert.equal(state.hintsUsed,0);await act(async()=>button(/Route clue/).click());const use=button(/Use route clue/);await act(async()=>{use.click();use.click()});assert.equal(state.hintsUsed,1);assert.equal(state.revealed,1);await act(async()=>button(/Reveal route/).click());assert.equal(state.finished,false);await act(async()=>button(/Keep playing/).click());assert.equal(state.finished,false);
 }else if(scenario==='stale'){await act(async()=>button(/Reveal route/).click());assert.equal(state.finished,false);await act(async()=>actions.startPractice());assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(state.finished,false);
 }else if(scenario==='assistance'){await act(async()=>actions.hint());const hints=state.hintsUsed,revealed=state.revealed;await word(state.puzzle.sol[0]);await act(async()=>actions.undoWord());assert.equal(state.hintsUsed,hints);assert.equal(state.revealed,revealed);await act(async()=>actions.restartChain());assert.equal(state.hintsUsed,hints);assert.equal(state.revealed,revealed);
 }
}finally{await act(async()=>root.unmount());globalThis.Date=NativeDate;dom.window.close()}
console.log('PASS real Circuit '+scenario);
