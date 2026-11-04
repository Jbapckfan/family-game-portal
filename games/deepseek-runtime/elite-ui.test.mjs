import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {centralDateKey} from './core.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
let sequence=0;

// Real app modules, real engines and real persisted state. No browser/layout
// claims: jsdom supplies events; dialogs need its missing native methods.
async function game(id, saved={}) {
 const globals=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const dom=new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>',{url:`https://example.test/games/${id}/${['deepseek-spare','deepseek-trail','deepseek-split'].includes(id)?'#daily':''}`,pretendToBeVisual:true});
 const {window:w}=dom;
 w.setInterval=()=>1;w.clearInterval=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;this.querySelector('button')?.focus();};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
 for(const [k,v] of Object.entries({window:w,document:w.document,navigator:w.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
 await import(`../${id}/app.mjs?elite=${++sequence}`);
 const {PUZZLES}=await import(`../${id}/puzzles.mjs`),E=await import(`../${id}/engine.mjs`);
 const $=q=>w.document.querySelector(q),click=q=>{$(q).focus();$(q).click();};
 const record=()=>JSON.parse(w.localStorage.getItem(`${id}:v1:daily:${centralDateKey()}`));
 const input=(q,value,caret=value.length)=>{const el=$(q);el.focus();el.value=value;el.setSelectionRange(caret,caret);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const key=(q,key)=>$(q).dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
 const snapshot=()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];}));
 return {w,$,click,input,key,E,record,snapshot,puzzle:PUZZLES.find(p=>p.id===record().puzzleId),close(){w.close();for(const [k,d]of Object.entries(globals)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};
}

test('Rung teaches the changed position in text instead of color alone',async()=>{
 const g=await game('deepseek-rung');try{
  const route=g.E.findRoute(g.puzzle.start,g.puzzle.target);g.input('#rung-word',route[1]);g.$('#rung-form').dispatchEvent(new g.w.Event('submit',{bubbles:true,cancelable:true}));
  const i=[...route[0]].findIndex((c,i)=>c!==route[1][i]);
  assert.match(g.$('.rung-change').textContent,new RegExp(`Position ${i+1}: ${route[0][i]}.*${route[1][i]}`));
 }finally{g.close();}
});
test('Spare retains visible failed pairs after another selection and reload',async()=>{
 let g=await game('deepseek-spare');let saved;try{
  g.click('[data-word="0"]');g.click('[data-word="2"]');g.click('#spare-submit');g.click('[data-word="1"]');
  assert.ok(g.$('.spare-misses').textContent.includes(g.puzzle.pairs[0][0]));assert.ok(g.$('.spare-misses').textContent.includes(g.puzzle.pairs[1][0]));saved=g.snapshot();
 }finally{g.close();}
 g=await game('deepseek-spare',saved);try{assert.equal(g.record().state.mistakes.length,1);assert.match(g.$('.spare-misses').textContent,/already tried/i);}finally{g.close();}
});
test('Cipher names word boundaries and assigned keyboard letters without exposing answers',async()=>{
 const g=await game('deepseek-cipher');try{
  const first=g.$('.cipher-word');assert.equal(first.getAttribute('role'),'group');assert.match(first.getAttribute('aria-label'),/Word 1/);
  const [code,plain]=Object.entries(g.record().state.guesses)[0];assert.match(g.$(`[data-letter="${plain}"]`).getAttribute('aria-label'),new RegExp(`assigned to code ${code}, confirmed`));
  const unguessed=g.E.cipherLetters(g.puzzle).find(c=>!g.record().state.guesses[c]);assert.match(g.$(`[data-code="${unguessed}"]`).getAttribute('aria-label'),/blank/);
 }finally{g.close();}
});
test('Trail arrows move focus on the spatial grid and selections keep it',async()=>{
 const g=await game('deepseek-trail');try{
  g.$('[data-index="0"]').focus();g.key('[data-index="0"]','ArrowRight');assert.equal(g.w.document.activeElement.dataset.index,'1');
  g.click('[data-index="1"]');assert.equal(g.w.document.activeElement.dataset.index,'1');assert.equal(g.$('[data-index="1"]').getAttribute('aria-pressed'),'true');
  g.key('[data-index="1"]','ArrowDown');assert.equal(g.w.document.activeElement.dataset.index,'4');assert.deepEqual(g.record().state.path,[1]);
 }finally{g.close();}
});
test('Split keyboard row change does not consume a tile and announces the active clue',async()=>{
 const g=await game('deepseek-split');try{
  g.$('#puzzle').focus();g.key('#puzzle','ArrowDown');assert.equal(g.record().state.active,1);assert.deepEqual(g.record().state.rows,[[],[]]);
  assert.match(g.$('#game-message').textContent,/Word 2/);assert.equal(g.$('[data-row="1"]').getAttribute('aria-pressed'),'true');
 }finally{g.close();}
});
test('Twin Hive rack inserts at the edit position and reports unmet gold requirements',async()=>{
 const g=await game('deepseek-twin-hive');try{
  const letter=g.puzzle.letters[0];g.input('#hive-word','AB',1);g.click(`[data-letter="${letter}"]`);assert.equal(g.$('#hive-word').value,`A${letter}B`);
  g.input('#hive-word',g.puzzle.gold[0]);assert.ok(g.$('#hive-rule').textContent.includes(g.puzzle.gold[1]));assert.match(g.$('#hive-rule').textContent,/still needs/i);
 }finally{g.close();}
});
test('Twin Hive and Rung hint rerenders retain unsubmitted drafts',async()=>{
 for(const [id,selector]of [['deepseek-twin-hive','#hive-word'],['deepseek-rung','#rung-word']]){
  const g=await game(id);try{g.input(selector,'ABC',1);g.click('#game-hint');assert.equal(g.$(selector).value,'ABC',id);}finally{g.close();}
 }
});
test('Dovetail selecting the current row keeps the typed draft and labels selection',async()=>{
 const g=await game('claude-dovetail');try{
  g.input('#dovetail-entry',g.puzzle.words[1].slice(0,1));const draft=g.record().state.typed;g.click('[data-row="1"]');
  assert.equal(g.record().state.typed,draft);assert.equal(g.$('[data-row="1"]').getAttribute('aria-pressed'),'true');
 }finally{g.close();}
});
test('Splice explains replacing the second half and keeps first/second selection roles',async()=>{
 const g=await game('claude-splice');try{
  g.click('[data-tile="0"]');g.click('[data-tile="2"]');g.click('[data-tile="3"]');
  assert.deepEqual(g.record().state.selected,[0,3]);assert.match(g.$('#game-message').textContent,/Second half replaced/);
  assert.match(g.$('[data-tile="0"]').getAttribute('aria-label'),/selected first/);assert.match(g.$('[data-tile="3"]').getAttribute('aria-label'),/selected second/);
 }finally{g.close();}
});
test('Sprout distinguishes the chosen soil tile from unavailable alternatives',async()=>{
 const g=await game('claude-sprout');try{
  g.click('[data-source="soil"][data-index="0"]');assert.equal(g.$('[data-source="soil"][data-index="0"]').getAttribute('aria-pressed'),'true');
  assert.equal(g.$('[data-source="soil"][data-index="1"]').getAttribute('aria-pressed'),'false');
  assert.match(g.$('#sprout-build-status').textContent,/1 of/);assert.match(g.$('#sprout-build-status').textContent,/soil letter chosen/i);
 }finally{g.close();}
});
test('Tangle selection shows bead numbers in reading order and the actual Back target',async()=>{
 const g=await game('claude-tangle');try{
  g.click('[data-bead="4"]');g.click('[data-bead="0"]');assert.match(g.$('#tangle-selection-detail').textContent,/1.*5/);
  assert.match(g.$('#tangle-back').getAttribute('aria-label'),/bead 1/);g.click('#tangle-back');assert.deepEqual(g.record().state.selected,[4]);
 }finally{g.close();}
});
for(const [id,field]of [['claude-keystone','#keystone-input'],['claude-tumbler','#tumbler-input']]){
 test(`${id} sanitizes a pasted edit without moving the caret past retained letters`,async()=>{
  const g=await game(id);try{g.input(field,'a-bcd',2);assert.equal(g.$(field).value,'abcd');assert.equal(g.w.document.activeElement,g.$(field));assert.equal(g.$(field).selectionStart,1);assert.equal(g.record().state.draft,'abcd');}finally{g.close();}
 });
}

// Source-assisted actions go through the visible game controls, with no state
// injection. Root separately runs the phone-layout browser version of this QA.
function solutionActions(g,id){
 const p=g.puzzle,text=(selector,value,submit)=>({selector,value,submit}),clicks=(...clicks)=>({clicks});
 switch(id){
  case 'deepseek-twin-hive':return g.E.acceptedWords(p).slice(0,p.target).map(w=>text('#hive-word',w,'#hive-form'));
  case 'deepseek-rung':return g.E.findRoute(p.start,p.target).slice(1).map(w=>text('#rung-word',w,'#rung-form'));
  case 'deepseek-spare':return p.pairs.map((_,i)=>clicks(`[data-word="${2*i}"]`,`[data-word="${2*i+1}"]`,'#spare-submit'));
  case 'deepseek-cipher':return g.E.cipherLetters(p).filter(c=>!p.givens.includes(c)).map(c=>clicks(`[data-code="${c}"]`,`[data-letter="${g.E.solution(p)[c]}"]`));
  case 'deepseek-trail':return [...p.path.map(i=>clicks(`[data-index="${i}"]`)),clicks('[data-action="check"]')];
  case 'deepseek-split':return [...p.words.join('').split('').map(key=>({key})),clicks('[data-action="check"]')];
  case 'claude-dovetail':return p.words.slice(1,-1).map(w=>text('#dovetail-entry',w,'#dovetail-form'));
  case 'claude-splice':return p.parts.map((_,i)=>clicks(`[data-tile="${2*i}"]`,`[data-tile="${2*i+1}"]`,'#splice-go'));
  case 'claude-sprout':return g.E.findRoute(p).slice(1).map(w=>text('#sprout-entry',w,'#sprout-form'));
  case 'claude-tangle':return p.w.map((_,j)=>clicks(...p.o.flatMap((owner,i)=>owner===j?[`[data-bead="${i}"]`]:[]),'#tangle-pull'));
  case 'claude-keystone':return p.rounds.flatMap((r,i)=>[text('#keystone-input',r.k,'#keystone-form'),...(i<p.rounds.length-1?[clicks('#keystone-next')]:[])]);
  case 'claude-tumbler':return [text('#tumbler-input',p.answer.slice(0,2)),text('#tumbler-input',p.answer,'#tumbler-form')];
 }
}
function act(g,action){
 if(action.clicks)for(const q of action.clicks){assert.ok(g.$(q),`visible control ${q}`);assert.equal(g.$(q).disabled,false,`enabled control ${q}`);g.click(q);}
 else if(action.key){g.$('#puzzle').focus();g.key('#puzzle',action.key);}
 else {g.input(action.selector,action.value);if(action.submit)g.$(action.submit).dispatchEvent(new g.w.Event('submit',{bubbles:true,cancelable:true}));}
}
for(const id of ['deepseek-twin-hive','deepseek-rung','deepseek-spare','deepseek-cipher','deepseek-trail','deepseek-split','claude-dovetail','claude-splice','claude-sprout','claude-tangle','claude-keystone','claude-tumbler']){
 test(`${id} real controls retain an interrupted move and a first solved result`,async()=>{
  let g=await game(id),saved,first,puzzleId,actions;
  try{puzzleId=g.puzzle.id;actions=solutionActions(g,id);act(g,actions[0]);first=g.record().state;assert.notDeepEqual(first,g.E.createState(g.puzzle));saved=g.snapshot();}finally{g.close();}
  g=await game(id,saved);try{
   assert.equal(g.puzzle.id,puzzleId);assert.deepEqual(g.record().state,first);for(const action of actions.slice(1))act(g,action);
   assert.equal(g.E.getStatus(g.puzzle,g.record().state),'won');assert.equal(g.$('#result').hidden,false);assert.equal(g.$('#game-share').hidden,false);assert.match(g.$('#result-heading').textContent,/That’s the one/);assert.equal(g.w.document.activeElement.id,'result','completion is announced through useful keyboard focus');saved=g.snapshot();
  }finally{g.close();}
  g=await game(id,saved);try{
   assert.equal(g.E.getStatus(g.puzzle,g.record().state),'won');assert.equal(g.$('#result').hidden,false);assert.match(g.$('#local-stats').textContent,/1 daily played · 1 solved/);
   assert.ok([...g.$('#puzzle').querySelectorAll('button,input')].every(el=>el.disabled));
   assert.equal(g.$('#game-hint').disabled,true);assert.equal(g.$('#game-reveal').disabled,true);
  }finally{g.close();}
 });
}
