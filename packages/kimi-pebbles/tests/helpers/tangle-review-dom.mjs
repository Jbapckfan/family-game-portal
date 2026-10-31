import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const scenario=process.argv[2],dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://alford-daily.test/games/kimi-tangle/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','localStorage','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Element','Node','NodeFilter','Event','CustomEvent','DocumentFragment','MutationObserver'])Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');globalThis.React=React;const {act,createElement:h,useState}=React,{createRoot}=await import('react-dom/client'),{TangleBoard}=await import('../../src/games/tangle/TangleBoard.tsx');
let state,setState,submits=0,hints=0,lastSubmitted=null,hit=null;
function Fixture(){[state,setState]=useState({mode:'daily',dayNumber:20756,puzzleNo:117,phase:'playing',puzzle:{g:'abcdefghijklmnop',words:['abc','abcd'],n:2,max:2,targets:[1,1,2]},path:[],found:[],score:0,misses:0,hintsUsed:0,hintPrefix:null,goldReached:false,winShownOnce:false});const actions={setPath:path=>setState(s=>({...s,path})),submitPath(){submits++;lastSubmitted=[...state.path];setState(s=>({...s,path:[]}))},clearPath:()=>setState(s=>({...s,path:[]})),hint(){hints++;setState(s=>({...s,hintsUsed:s.hintsUsed+1,hintPrefix:'ab'}))}};return h(TangleBoard,{state,actions});}
const root=createRoot(document.getElementById('root')),cell=i=>document.querySelector(`[data-cell="${i}"]`),button=p=>[...document.querySelectorAll('button')].find(n=>p.test(n.textContent));
const pointer=async(type,target,{id=1,button=0,buttons=1}={})=>{const e=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,button,buttons,isPrimary:id===1,clientX:20,clientY:20});await act(async()=>target.dispatchEvent(e));};
try{
 await act(async()=>root.render(h(Fixture)));const field=document.querySelector('.tangle-field');field.setPointerCapture=()=>{};field.releasePointerCapture=()=>{};field.hasPointerCapture=()=>true;document.elementFromPoint=()=>hit;
 if(scenario==='contextmenu'){const e=new dom.window.Event('contextmenu',{bubbles:true,cancelable:true});await act(async()=>field.dispatchEvent(e));assert.equal(e.defaultPrevented,true);}
 else if(scenario==='resolved'){await act(async()=>setState(s=>({...s,hintsUsed:1,hintPrefix:'ab',found:['abcd']})));assert.match(document.querySelector('[data-tangle-clue]').textContent,/found/i);}
 else if(scenario==='assistive'){await act(async()=>cell(0).click());assert.deepEqual(state.path,[0]);}
 else if(scenario==='clue'){
  await act(async()=>button(/^Hint|^Clue/).click());assert.equal(hints,0);assert.ok(document.querySelector('[role="dialog"]'));await act(async()=>button(/Keep hunting/).click());assert.equal(hints,0);await act(async()=>button(/^Hint|^Clue/).click());const confirm=button(/Use my clue/);await act(async()=>{confirm.click();confirm.click()});assert.equal(hints,1);assert.match(document.querySelector('[data-tangle-clue]').textContent,/AB/);
 }else{
  const right=scenario==='secondary';hit=cell(0);await pointer('pointerdown',cell(0),{button:right?2:0,buttons:right?2:1});hit=cell(1);await pointer('pointermove',field);hit=cell(2);if(scenario==='burst'){const move=new dom.window.Event('pointermove',{bubbles:true,cancelable:true}),up=new dom.window.Event('pointerup',{bubbles:true,cancelable:true});for(const e of [move,up])Object.assign(e,{pointerId:1,button:0,buttons:1,isPrimary:true,clientX:20,clientY:20});await act(async()=>{field.dispatchEvent(move);field.dispatchEvent(up)});assert.equal(submits,1);assert.deepEqual(lastSubmitted,[0,1,2]);}else await pointer('pointermove',field);
  if(scenario==='stale')await act(async()=>setState(s=>({...s,puzzle:{...s.puzzle,g:'qbcdefghijklmnop'}})));
  if(scenario==='outside')hit=null;
  if(scenario==='cancel')await pointer('pointercancel',field);
  if(scenario==='secondary'){await pointer('pointerup',field,{id:2});await pointer('pointerup',field);assert.equal(submits,0);}
  else{if(scenario==='inside'){await pointer('pointerup',field,{id:2});assert.equal(submits,0);}await pointer('pointerup',field);assert.equal(submits,['inside','burst'].includes(scenario)?1:0);if(scenario==='inside')assert.deepEqual(lastSubmitted,[0,1,2]);if(['outside','cancel'].includes(scenario))assert.deepEqual(state.path,[0,1,2]);}
 }
}finally{await act(async()=>root.unmount());dom.window.close();}
