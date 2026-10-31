import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const scenario=process.argv[2],dom=new JSDOM('<div id="root"></div>',{url:'https://alford-daily.test/games/kimi-hunch/',pretendToBeVisual:true});
for(const n of ['window','document','navigator','localStorage','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Element','Node','NodeFilter','Event','CustomEvent','DocumentFragment','MutationObserver'])Object.defineProperty(globalThis,n,{configurable:true,value:dom.window[n]});
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');globalThis.React=React;const {act,createElement:h,useState}=React,{createRoot}=await import('react-dom/client'),{HunchBoard}=await import('../../src/games/hunch/HunchBoard.tsx');
let state,setState,hints=0;
function Fixture(){[state,setState]=useState({phase:'playing',mode:'daily',dayNumber:20757,puzzleNo:144,answer:'apple',guesses:[],evals:[],current:'',hintLetters:[],hintsUsed:0,finished:false,won:false,shaking:false});const actions={keyLetter:c=>setState(s=>({...s,current:s.current+c})),backspace:()=>{},submit:()=>{},hint:()=>{hints++;setState(s=>({...s,hintsUsed:s.hintsUsed+1,hintLetters:['a']}))}};return h(HunchBoard,{state,actions})}
const root=createRoot(document.getElementById('root')),button=pattern=>[...document.querySelectorAll('button')].find(b=>pattern.test(b.getAttribute('aria-label')||b.textContent));
try{
 await act(async()=>root.render(h(Fixture)));
 if(scenario==='focus-cancel'){const opener=button(/Reveal a letter/);opener.focus();await act(async()=>opener.click());await act(async()=>button(/Keep guessing/).click());await act(async()=>new Promise(r=>setTimeout(r,300)));assert.ok(document.activeElement===opener,'cancel restores the actual clue opener');
 }else if(scenario==='aggregate'){
 await act(async()=>setState(s=>({...s,guesses:['alley'],evals:[['correct','present','absent','present','absent']]})));
 const row=document.querySelector('[data-hunch-row="0"]');assert.equal(row.querySelectorAll('[data-eval]').length,0);assert.equal(row.querySelectorAll('[data-hunch-dot="correct"]').length,1);assert.equal(row.querySelectorAll('[data-hunch-dot="present"]').length,2);assert.equal(document.querySelectorAll('[data-hunch-key][data-eval]').length,0);assert.equal(row.querySelector('[data-hunch-cell]').getAttribute('aria-label'),'Position 1: A');assert.match(row.textContent,/alley/i);
 }else if(scenario==='consumed'){
  document.addEventListener('keydown',e=>e.preventDefault());const e=new dom.window.KeyboardEvent('keydown',{key:'q',bubbles:true,cancelable:true});await act(async()=>document.body.dispatchEvent(e));assert.equal(state.current,'');
 }else{
  await act(async()=>button(/Reveal a letter/).click());assert.equal(hints,0);assert.ok(document.querySelector('[role="dialog"]'));
  if(scenario==='stale-clue'){await act(async()=>setState(s=>({...s,puzzleNo:145,answer:'crane',guesses:[]})));assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(hints,0)}
  else{await act(async()=>button(/Keep guessing/).click());assert.equal(hints,0);await act(async()=>button(/Reveal a letter/).click());const confirm=button(/Use my clue/);await act(async()=>{confirm.click();confirm.click()});assert.equal(hints,1);assert.equal(button(/Clue used/).disabled,true)}
 }
}finally{await act(async()=>root.unmount());dom.window.close()}
console.log('PASS Hunch UI '+scenario);
