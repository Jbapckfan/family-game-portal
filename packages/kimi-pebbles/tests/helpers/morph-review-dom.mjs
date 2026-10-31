import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {Script} from 'node:vm';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';import ts from 'typescript';
const scenario=process.argv[2],dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://alford-daily.test/games/kimi-morph/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','localStorage','HTMLElement','HTMLInputElement','Element','Node','NodeFilter','HTMLTextAreaElement','HTMLSelectElement','Event','CustomEvent','DocumentFragment','MutationObserver','getComputedStyle'])Object.defineProperty(globalThis,name,{configurable:true,value:typeof dom.window[name]==='function'&&name==='getComputedStyle'?dom.window[name].bind(dom.window):dom.window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
const React=await import('react'),{createRoot}=await import('react-dom/client');const {act,createElement:h}=React;
globalThis.React=React;
const file=fileURLToPath(new URL('../../src/games/morph/MorphBoard.tsx',import.meta.url)),require=createRequire(file),module={exports:{}};
const source=process.env.MORPH_REVIEW_BASELINE?readFileSync(fileURLToPath(new URL('../../../../output/morph-review-20261030/baseline-MorphBoard.tsx',import.meta.url)),'utf8'):readFileSync(file,'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Script(`(function(require,module,exports){${compiled}\n})`,{filename:file}).runInThisContext()(id=>require(id),module,module.exports);
let hints=0,skips=0,restarts=0,picked=[];const actions={openCell(){},closePalette(){},pickLetter(ch){picked.push(ch)},keyboardLetter(){},submit(){},hint(){hints++},closePath(){},undo(){},restart(){restarts++},giveUp(){skips++}};
let state={phase:'playing',mode:'daily',dayNumber:20756,puzzleNo:57,puzzle:{s:'mood',t:'four',par:4,p:['mood','food','fool','foul','four']},rows:['mood','food'],edit:[...'food'],focusCell:null,paletteOpen:false,misses:0,hintsUsed:0,showPath:false,gaveUp:false,finished:false,shaking:false};
const root=createRoot(document.getElementById('root')),render=()=>act(async()=>root.render(h(module.exports.MorphBoard,{state,actions}))),button=pattern=>[...document.querySelectorAll('button')].find(n=>pattern.test(n.textContent));
const trigger=()=>button(scenario==='skip'?/Give up|Reveal route/:scenario==='restart'?/Restart ladder/:/Show a route/);
try{
 await render();
 if(scenario==='palette'){state={...state,focusCell:2,paletteOpen:true};await render();const dialog=document.querySelector('[role="dialog"]');assert.match(dialog.textContent,/position 3/i);await act(async()=>dialog.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'a',bubbles:true,cancelable:true})));assert.deepEqual(picked,['a']);}
 else if(scenario==='saved'){state={...state,hintsUsed:1};await render();await act(async()=>button(/View saved route/).click());assert.equal(hints,1);assert.equal(document.querySelector('[role="dialog"]'),null);}
 else{
  await act(async()=>trigger().click());assert.equal(hints+skips+restarts,0);assert.ok(document.querySelector('[role="dialog"]'));
  if(scenario==='stale'){state={...state,rows:['mood']};await render();assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(hints+skips+restarts,0);}
  else{await act(async()=>button(/Keep playing/).click());assert.equal(hints+skips+restarts,0);await act(async()=>trigger().click());const confirm=button(scenario==='hint'?/Show route and mark assisted/:scenario==='skip'?/Reveal and finish/:/Restart this ladder/);await act(async()=>{confirm.click();confirm.click();});assert.equal(hints,scenario==='hint'?1:0);assert.equal(skips,scenario==='skip'?1:0);assert.equal(restarts,scenario==='restart'?1:0);}
 }
}finally{await act(async()=>root.unmount());dom.window.close();}
