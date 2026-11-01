import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {JSDOM} from 'jsdom';
import ts from 'typescript';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
const base=fileURLToPath(new URL('../../src/games/',import.meta.url));
const dom=new JSDOM('<div id="root"></div>',{url:'https://v3.example.test/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','localStorage','sessionStorage','HTMLElement','Element','Node','Event','CustomEvent','MutationObserver','NodeFilter','HTMLInputElement','getComputedStyle'])Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const disk=dom.window.localStorage,tab=dom.window.sessionStorage;
function tabLoader() {
  const cache = new Map();
  function load(file) {
    if (file.endsWith('?raw')) return readFileSync(file.slice(0, -4), 'utf8');
    if (cache.has(file)) return cache.get(file).exports;
    if (file.endsWith('.json')) {
      const value=JSON.parse(readFileSync(file,'utf8'));
      // Before root regenerates, exercise the actual missing VAPE path using an
      // in-memory current-pool addition. Frozen v2 JSON is never intercepted.
      if(file.endsWith('/tangle/data/lexicon-expansions.json'))value['apwovewbeuvmircl']=[...new Set([...value['apwovewbeuvmircl'],'vape'])].sort();
      // A coherent legal-word subset makes the preview edition observably
      // different before regeneration; it is only a test fixture, never shipped.
      if(file.endsWith('/tangle/data/five-preview.json')){value.words=value.words.filter(w=>w!=='pores');value.n=value.words.length;value.max=value.words.reduce((n,w)=>n+(w.length<=4?1:w.length===5?2:w.length===6?3:w.length===7?5:11),0);}
      return value;
    }
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

const NativeDate=globalThis.Date;
let seed=tabLoader(),engine=seed(resolve(base,'tangle/engine.ts')),day=20758;
while(engine.dailyTangle(day).puzzleNo!==335&&day<22000)day++;assert.ok(day<22000);
globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[day*86400000+18*3600000]));}static now(){return day*86400000+18*3600000;}};
const previewSaveFixture=preview=>({grid:preview.g,found:['stone'],misses:1,hintsUsed:0,countedPlayed:false});
const key=`kimi:tangle:v1:day:${day}`,statsKey='kimi:tangle:v1:stats',previewKey='kimi:tangle:5x5-preview:v1';
let activeRoot,state,actions;
async function mount(){const load=tabLoader(),useTangle=load(resolve(base,'tangle/useTangle.ts')).useTangle;activeRoot=createRoot(document.getElementById('root'));function Probe(){({state,actions}=useTangle());return null;}await act(async()=>activeRoot.render(React.createElement(Probe)));return load;}
async function unmount(){await act(async()=>activeRoot.unmount());}
const raw=JSON.parse(readFileSync(resolve(base,'tangle/data/puzzles.json'),'utf8'))[334],progress=seed(resolve(base,'tangle/progress.ts'));
const frozen=seed(resolve(base,'tangle/lexicon.ts')).expandTanglePuzzle({...raw,targets:progress.medalTargets(raw.max)},2);
const found=[];let score=0;for(const word of frozen.words){found.push(word);score+=progress.pointsFor(word);if(score>=frozen.targets[2])break;}
const saved={found,misses:2,hintsUsed:1,hintPrefix:frozen.words.find(w=>w.length>=4).slice(0,2),countedPlayed:true};
const wonStats={played:1,completed:1,currentStreak:1,maxStreak:1,lastCompletedDay:day};
try{
 disk.setItem(key,JSON.stringify(saved));disk.setItem(statsKey,JSON.stringify(wonStats));
 for(let pass=0;pass<2;pass++){
  await mount();assert.deepEqual(state.found,[...found].sort());assert.equal(state.score,score);assert.equal(state.puzzle.max,frozen.max);assert.equal(state.puzzle.n,frozen.n);assert.deepEqual(state.puzzle.targets,frozen.targets);assert.equal(state.vocabulary,undefined);assert.equal(state.goldReached,true);assert.equal(state.hintsUsed,1);assert.deepEqual(JSON.parse(disk.getItem(statsKey)),wonStats);assert.equal(Object.hasOwn(JSON.parse(disk.getItem(key)),'vocabulary'),false);await unmount();
 }
 disk.removeItem(key);disk.removeItem(statsKey);await mount();assert.equal(state.vocabulary,3);assert.ok(state.puzzle.words.includes('vape'));assert.ok(state.puzzle.max>frozen.max);await act(async()=>actions.setPath([4,0,1,5]));await act(async()=>actions.submitPath());assert.deepEqual(state.found,['vape']);assert.equal(state.score,1);assert.equal(JSON.parse(disk.getItem(key)).vocabulary,3);const currentMax=state.puzzle.max,currentCount=state.puzzle.n;await unmount();
 await mount();assert.deepEqual(state.found,['vape']);assert.equal(state.vocabulary,3);assert.equal(state.puzzle.max,currentMax);assert.equal(state.puzzle.n,currentCount);
 const preview=seed(resolve(base,'tangle/five-preview.ts')).TANGLE_FIVE_PREVIEW_V2;
 tab.setItem(previewKey,JSON.stringify({grid:preview.g,found:['stone'],misses:1,hintsUsed:1,hintPrefix:'st',countedPlayed:false}));
 await act(async()=>actions.startFivePreview());assert.equal(state.puzzle.max,preview.max);assert.equal(state.puzzle.n,preview.n);assert.deepEqual(state.puzzle.targets,[10,20,30]);assert.equal(state.score,2);assert.equal(state.hintsUsed,1);assert.equal(state.vocabulary,undefined);assert.equal(Object.hasOwn(JSON.parse(tab.getItem(previewKey)),'vocabulary'),false);
 await act(async()=>actions.startFivePreview(true));assert.equal(state.vocabulary,3);assert.notEqual(state.puzzle.n,preview.n);assert.equal(JSON.parse(tab.getItem(previewKey)).vocabulary,3);
 const incomingPreview=JSON.stringify({...previewSaveFixture(preview),vocabulary:99});tab.setItem(previewKey,incomingPreview);await act(async()=>actions.hint());assert.equal(state.phase,'unavailable');assert.equal(tab.getItem(previewKey),incomingPreview);await act(async()=>actions.startFivePreview(true));assert.equal(state.phase,'playing');assert.equal(JSON.parse(tab.getItem(previewKey)).vocabulary,3);await unmount();
 await mount();const incomingDay=JSON.stringify({...saved,vocabulary:99});disk.setItem(key,incomingDay);await act(async()=>actions.setPath([4]));assert.equal(state.phase,'unavailable');assert.equal(disk.getItem(key),incomingDay);await unmount();
 const unknown={...saved,vocabulary:99},encoded=JSON.stringify(unknown);disk.setItem(key,encoded);const beforeStats=disk.getItem(statsKey);await mount();assert.equal(state.phase,'unavailable');assert.equal(disk.getItem(key),encoded);assert.equal(disk.getItem(statsKey),beforeStats);await act(async()=>actions.setPath([4,0,1,5]));await act(async()=>actions.submitPath());assert.equal(disk.getItem(key),encoded);await act(async()=>actions.startPractice());assert.equal(state.vocabulary,3);assert.equal(state.phase,'playing');assert.equal(disk.getItem(key),encoded);await unmount();
 disk.removeItem(key);await mount();const unknownPreview=JSON.stringify({grid:preview.g,found:['stone'],misses:1,hintsUsed:0,countedPlayed:false,vocabulary:99});tab.setItem(previewKey,unknownPreview);await act(async()=>actions.startFivePreview());assert.equal(state.phase,'unavailable');assert.equal(tab.getItem(previewKey),unknownPreview);await act(async()=>actions.startFivePreview(true));assert.equal(state.vocabulary,3);assert.equal(state.phase,'playing');assert.equal(JSON.parse(tab.getItem(previewKey)).vocabulary,3);await unmount();
 console.log('PASS Kimi Tangle v3 real-hook old Daily/preview snapshots, VAPE acceptance/reload, Gold count and unknown-save preservation');
}finally{globalThis.Date=NativeDate;dom.window.close();}
