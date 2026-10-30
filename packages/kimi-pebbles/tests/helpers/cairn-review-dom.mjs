import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {Script} from 'node:vm';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';import ts from 'typescript';
const scenario=process.argv[2],dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://alford-daily.test/games/kimi-cairn/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','localStorage','HTMLElement','HTMLInputElement','Element','Node','Event','CustomEvent','DocumentFragment','MutationObserver','getComputedStyle'])Object.defineProperty(globalThis,name,{configurable:true,value:typeof dom.window[name]==='function'&&name==='getComputedStyle'?dom.window[name].bind(dom.window):dom.window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
const React=await import('react'),{createRoot}=await import('react-dom/client');const {act,createElement:h}=React;
globalThis.React=React;
const file=fileURLToPath(new URL('../../src/games/cairn/GameBoard.tsx',import.meta.url)),require=createRequire(file),module={exports:{}};
const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Script(`(function(require,module,exports){${compiled}\n})`,{filename:file}).runInThisContext()(id=>id==='./engine'?{LEVELS:5,MAX_HINTS_PER_LEVEL:2,emojiFor:()=>'',addedLetter:()=> 'e'}:require(id),module,module.exports);
let hints=0,skips=0;const actions={tapRack(){},tapSlot(){},del(){},shuffle(){},submit(){},hint(){hints++},giveUp(){skips++}};
let state={phase:'playing',mode:'daily',dayNumber:20756,puzzleNo:11,puzzle:{words:['car','care','trace','trance','central']},level:0,rack:[...'car'],slots:[null,null,null],misses:0,hints:0,results:[],finished:false,newLetterIdx:null,droppingIdx:null};
const root=createRoot(document.getElementById('root')),render=()=>act(async()=>root.render(h(module.exports.GameBoard,{state,actions}))),button=pattern=>[...document.querySelectorAll('button')].find(n=>pattern.test(n.textContent));
try{
 await render();
 if(scenario==='added'){state={...state,level:1,rack:[...'care'],slots:[null,null,null,null],results:[{word:'car',status:'clean',misses:0,hints:0}]};await render();assert.match(document.querySelector('.cairn-added')?.textContent||'',/CAR/);assert.match(document.querySelector('.cairn-added')?.textContent||'',/E/);}
 else{
  await act(async()=>button(scenario==='skip'?/Give up|Skip level/:/Hint|Nudge/).click());assert.equal(hints,0);assert.equal(skips,0);assert.ok(document.querySelector('[role="dialog"]'));
  if(scenario==='stale'){state={...state,level:1,rack:[...'care'],slots:[null,null,null,null],results:[{word:'car',status:'clean',misses:0,hints:0}]};await render();assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(hints,0);}
  else{
   await act(async()=>button(/Keep trying/).click());assert.equal(hints+skips,0);await act(async()=>button(scenario==='skip'?/Give up|Skip level/:/Hint|Nudge/).click());const confirm=button(scenario==='skip'?/Show and skip/:/Use nudge/);await act(async()=>{confirm.click();confirm.click();});assert.equal(hints,scenario==='hint'?1:0);assert.equal(skips,scenario==='skip'?1:0);
  }
 }
}finally{await act(async()=>root.unmount());dom.window.close();}
