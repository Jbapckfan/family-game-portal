import {quartetLabel} from '../packages/kimi-pebbles/src/games/quartet/labels.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as Sprout from '../games/claude-sprout/engine.mjs';
import {PUZZLES as sprouts} from '../games/claude-sprout/puzzles.mjs';
import * as Tumbler from '../games/claude-tumbler/engine.mjs';
import {PUZZLES as tumblers} from '../games/claude-tumbler/puzzles.mjs';

test('Sprout expanded rounds accept TARE while an existing classic round keeps its word graph',()=>{
 const p=sprouts[0],classic=Sprout.createState(p),expanded={...classic,vocabulary:2};
 const old=Sprout.submitWord(p,classic,'tare');
 assert.equal(old.state.events.length,0);
 const grown=Sprout.submitWord(p,expanded,'tare');
 assert.equal(grown.state.events.length,1,'TARE must be classified as growth or a real dead end, not rejected as unlisted');
 assert.ok(Sprout.restoreState(p,grown.state));
 assert.equal(Sprout.restoreState(p,grown.state).vocabulary,2);
 assert.equal(Sprout.restoreState(p,{...classic,vocabulary:99}),null);
});

test('Sprout preserves the CORNEA classic dead-end penalty through a real save replay',()=>{
 const p=sprouts[0];let s=Sprout.createState(p);
 for(const word of ['earn','crane','cornea'])s=Sprout.submitWord(p,s,word).state;
 assert.equal(Sprout.analyze(p,s).wilts,1);
 const restored=Sprout.restoreState(p,JSON.parse(JSON.stringify(s)));
 assert.equal(Sprout.analyze(p,restored).wilts,1);
 assert.deepEqual(Sprout.analyze(p,restored).stack,['ear','earn','crane']);
 assert.equal(Object.hasOwn(restored,'vocabulary'),false);
});

test('Tumbler accepts normal word-game alternatives ADIOS, COATI and SWALE without changing its answer',()=>{
 for(const word of ['adios','coati','swale']){
  const p=tumblers[0],s=Tumbler.submit(p,Tumbler.setDraft(p,Tumbler.createState(p),word)).state;
  assert.deepEqual(s.guesses,[word]);
  assert.ok(Tumbler.restoreState(p,s));
  assert.equal(Tumbler.getStatus(p,s),'playing');
 }
});

test('Quartet category descriptions cover the actual fixed target meanings without changing targets',async()=>{
 const boards=JSON.parse(await readFile(new URL('../packages/kimi-pebbles/src/games/quartet/data/puzzles.json',import.meta.url),'utf8'));
 for(const p of boards)for(const g of p.groups){
  if(g.members.includes('flip')||g.members.includes('medley'))assert.equal(quartetLabel(g.label),'Swimming terms');
  if(g.members.includes('ptero'))assert.equal(quartetLabel(g.label),'Prehistoric animal nicknames');
  if(g.members.includes('alto'))assert.equal(quartetLabel(g.label),'Cloud names & prefixes');
 }
});

test('every expanded Sprout round solves, hints and reloads using its explicit vocabulary edition',async()=>{
 const {createSession}=await import('../games/deepseek-runtime/core.mjs');
 for(const p of sprouts){
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const config={...Sprout,createState:Sprout.createExpandedState,id:'claude-sprout',name:'Sprout',puzzles:[p]},options={storage,now:()=>new Date('2026-11-01T18:00:00Z')};
  let session=createSession(config,options);
  assert.equal(session.state.vocabulary,2);
  assert.equal(session.hint(),true);
  assert.equal(Sprout.analyze(p,session.state).wilts,1);
  for(const word of Sprout.solutionPath(p,session.state).slice(1)){
   assert.equal(session.commit(Sprout.submitWord(p,session.state,word).state),true,p.id);
   session=createSession(config,options);
   assert.equal(session.state.vocabulary,2);
  }
  assert.equal(session.outcome,'won',p.id);
  assert.equal(session.stats.played,1);assert.equal(session.stats.won,1);
 }
});

test('the real Sprout app starts expanded rounds and restores a classic round without reinterpreting it',async()=>{
 const {createRequire}=await import('node:module');
 const {JSDOM}=createRequire(import.meta.url)('jsdom');
 const {centralDateKey}=await import('../games/deepseek-runtime/core.mjs');
 const descriptors=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 async function mount(saved,tag){
  const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'https://cq.test/games/claude-sprout/',pretendToBeVisual:true});
  dom.window.setInterval=()=>1;dom.window.clearInterval=()=>{};
  for(const [k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
  const key=`claude-sprout:v1:daily:${centralDateKey()}`;
  if(saved)dom.window.localStorage.setItem(key,JSON.stringify(saved));
  await import(`../games/claude-sprout/app.mjs?cq=${tag}`);
  return {dom,record:JSON.parse(dom.window.localStorage.getItem(key))};
 }
 let current;
 try{
  current=await mount(null,'new');assert.equal(current.record.state.vocabulary,2);current.dom.window.close();
  let state=Sprout.createState();for(const word of ['earn','crane','cornea'])state=Sprout.submitWord(sprouts[0],state,word).state;
  current=await mount({version:1,puzzleId:'sprout-1',puzzleIndex:0,state},'old');
  assert.equal(Sprout.analyze(sprouts[0],current.record.state).wilts,1);
  assert.equal(Object.hasOwn(current.record.state,'vocabulary'),false);
  assert.match(current.dom.window.document.querySelector('.sprout-hint-cost').textContent,/earlier word rules.*new Practice/si);
 }finally{
  current?.dom.window.close();
  for(const[k,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];
 }
});

test('each Claude game exposes exact zero and used assistance counts without exposing answers',async()=>{
 for(const slug of ['dovetail','splice','sprout','tangle','keystone','tumbler']){
  const E=await import(`../games/claude-${slug}/engine.mjs`),{PUZZLES}=await import(`../games/claude-${slug}/puzzles.mjs`),p=PUZZLES[0];
  let s=slug==='sprout'?E.createExpandedState():E.createState(p);
  assert.equal(E.assistanceCount(p,s),0,slug);
  s=E.hint(p,s);assert.ok(s,slug);
  assert.equal(E.assistanceCount(p,s),1,slug);
  s=E.restoreState(p,JSON.parse(JSON.stringify(s)));
  assert.equal(E.assistanceCount(p,s),1,slug);
 }
});

test('Splice expanded rounds evaluate LANDWARD as a real join and preserve classic saves',async()=>{
 const E=await import('../games/claude-splice/engine.mjs'),{PUZZLES}=await import('../games/claude-splice/puzzles.mjs'),p=PUZZLES[0],tiles=p.parts.flat();
 let classic=E.createState(p);for(const word of ['land','ward'])classic=E.chooseTile(p,classic,tiles.indexOf(word));
 assert.equal(E.submitPair(p,classic).state.attempts.length,0);
 const expanded=E.submitPair(p,{...classic,vocabulary:2}).state;
 assert.equal(expanded.attempts.length,1,'LANDWARD must evaluate remaining partners instead of disappearing as unlisted');
 assert.equal(E.restoreState(p,expanded).vocabulary,2);
 assert.equal(E.restoreState(p,{...classic,vocabulary:99}),null);
 assert.equal(Object.hasOwn(E.restoreState(p,classic),'vocabulary'),false);
});

test('Keystone accepts a full-five-join alternative in v2 while classic replay keeps its prepared answer',async()=>{
 const E=await import('../games/claude-keystone/engine.mjs'),{PUZZLES}=await import('../games/claude-keystone/puzzles.mjs');
 const p=PUZZLES.find(p=>p.rounds.some(r=>r.k==='walk')),index=p.rounds.findIndex(r=>r.k==='walk');
 let s=E.createState(p);for(let i=0;i<index;i++){s=E.submit(p,E.setDraft(p,s,p.rounds[i].k)).state;s=E.nextArch(p,s);}
 const classic=E.submit(p,E.setDraft(p,s,'foot')).state;
 assert.equal(E.roundView(p.rounds[index],classic.rounds[index]).status,'playing');
 const expanded=E.submit(p,E.setDraft(p,{...s,vocabulary:2},'foot')).state;
 assert.equal(E.roundView(p.rounds[index],expanded.rounds[index],2).status,'won','FOOT joins OUT, MAN, BOARD, WAYS and CROSS');
 assert.equal(E.roundView(p.rounds[index],expanded.rounds[index],2).answer,'foot');
 assert.equal(E.restoreState(p,expanded).vocabulary,2);
 assert.equal(E.restoreState(p,{...s,vocabulary:99}),null);
 assert.equal(Object.hasOwn(E.restoreState(p,classic),'vocabulary'),false);
});

test('Dovetail v2 accepts BACK–BAND–AGES while keeping legacy decisions and hint prefixes',async()=>{
 const E=await import('../games/claude-dovetail/engine.mjs'),{PUZZLES}=await import('../games/claude-dovetail/puzzles.mjs'),p=PUZZLES[0];
 const row=p.words.indexOf('pack');assert.ok(row>0);
 let s=E.createState(p);s=E.chooseRow(p,s,row-1);s=E.submitWord(p,s,p.words[row-1]).state;s=E.chooseRow(p,s,row);
 const classic=E.submitWord(p,s,'band').state;assert.equal(E.analyze(p,classic).solved[row],false);
 const expanded=E.submitWord(p,{...s,vocabulary:2},'band').state;
 assert.equal(E.analyze(p,expanded).solved[row],true,'BACKBAND and BANDAGES complete both directed joins');
 assert.equal(E.analyze(p,expanded).misses,0);assert.equal(E.restoreState(p,expanded).vocabulary,2);
 assert.equal(E.restoreState(p,{...s,vocabulary:99}),null);
});

test('the real Keystone app explains hidden-clue requirements and displays the accepted alternative',async()=>{
 const {createRequire}=await import('node:module'),{JSDOM}=createRequire(import.meta.url)('jsdom');
 const E=await import('../games/claude-keystone/engine.mjs'),{PUZZLES}=await import('../games/claude-keystone/puzzles.mjs');
 const {centralDateKey}=await import('../games/deepseek-runtime/core.mjs');
 const p=PUZZLES.find(p=>p.id==='keystone-003');let state=E.createExpandedState(p);
 for(let i=0;i<2;i++){state=E.submit(p,E.setDraft(p,state,p.rounds[i].k)).state;state=E.nextArch(p,state);}
 const descriptors=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'https://cq.test/games/claude-keystone/',pretendToBeVisual:true});
 try{
  dom.window.setInterval=()=>1;dom.window.clearInterval=()=>{};
  for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
  const key=`claude-keystone:v1:daily:${centralDateKey()}`;
  dom.window.localStorage.setItem(key,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:PUZZLES.indexOf(p),state}));
  await import('../games/claude-keystone/app.mjs?cq=alternative');
  const $=q=>dom.window.document.querySelector(q);
  assert.match($('#keystone-input-help').textContent,/including hidden/);
  const submit=word=>{const input=$('#keystone-input');input.value=word;input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));$('#keystone-form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));};
  submit('work');assert.match($('#game-message').textContent,/2 of 2 visible clues.*all five, including hidden/s);
  assert.match($('.keystone-log').textContent,/OUTWORK|WORKOUT/);assert.match($('.keystone-log').textContent,/WORKMAN/);
  submit('foot');assert.equal($('#result').hidden,false);
  assert.equal($('.keystone-summary:last-child strong').textContent,'FOOT');
  assert.match($('.keystone-summary:last-child p').textContent,/footways/);
  const saved=JSON.parse(dom.window.localStorage.getItem(key));assert.equal(saved.state.vocabulary,2);assert.equal(E.getStatus(p,E.restoreState(p,saved.state)),'won');assert.equal(E.total(p,saved.state),7);
 }finally{
  dom.window.close();for(const[k,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];
 }
});

test('all expanded Dovetail, Splice, Keystone and Tangle banks complete with real per-action saved-round reloads',async()=>{
 const {createSession}=await import('../games/deepseek-runtime/core.mjs');
 for(const slug of ['dovetail','splice','keystone','tangle']){
  const E=await import(`../games/claude-${slug}/engine.mjs`),{PUZZLES}=await import(`../games/claude-${slug}/puzzles.mjs`);
  for(const p of PUZZLES){
   const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},config={...E,createState:E.createExpandedState,id:'claude-'+slug,name:slug,puzzles:[p]},options={storage,now:()=>new Date('2026-11-01T18:00:00Z')};
   let session=createSession(config,options);
   const commit=state=>{assert.equal(session.commit(state),true,p.id);session=createSession(config,options);assert.equal(session.state.vocabulary,2);};
   if(slug==='dovetail')for(let row=1;row<p.words.length-1;row++){commit(E.chooseRow(p,session.state,row));commit(E.submitWord(p,session.state,p.words[row]).state);}
   if(slug==='splice')for(const pair of E.solutionPairs(p,session.state)){for(const tile of pair)commit(E.chooseTile(p,session.state,tile));commit(E.submitPair(p,session.state).state);}
   if(slug==='tangle')for(const indices of E.allocation(p,E.view(p,session.state))){for(const i of indices)commit(E.toggle(p,session.state,i).state);commit(E.submit(p,session.state).state);}
   if(slug==='keystone')for(let row=0;row<3;row++){commit(E.setDraft(p,session.state,p.rounds[row].k));commit(E.submit(p,session.state).state);if(row<2)commit(E.nextArch(p,session.state));}
   assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.won,1);assert.equal(session.stats.played,1);
  }
 }
});

test('v2 Dovetail, Splice, Sprout and Keystone retain their actual loss boundaries and terminal saves',async()=>{
 {
  const E=await import('../games/claude-dovetail/engine.mjs'),{PUZZLES}=await import('../games/claude-dovetail/puzzles.mjs'),p=PUZZLES[0];let s=E.createExpandedState();
  for(let row=1;row<p.words.length-1&&E.getStatus(p,s)==='playing';row++){s=E.chooseRow(p,s,row);for(let n=0;n<p.words[row].length-1&&E.getStatus(p,s)==='playing';n++)s=E.hint(p,s);}
  assert.equal(E.getStatus(p,s),'lost');assert.equal(E.analyze(p,s).misses,6);assert.ok(E.restoreState(p,s));
 }
 {
  const E=await import('../games/claude-splice/engine.mjs'),{PUZZLES}=await import('../games/claude-splice/puzzles.mjs'),p=PUZZLES[0],tiles=p.parts.flat();let s=E.createExpandedState(p);
  for(const pair of [['land','ward'],['land','owners'],['head','master'],['head','piece']]){for(const word of pair)s=E.chooseTile(p,s,tiles.indexOf(word));s=E.submitPair(p,s).state;assert.ok(E.restoreState(p,s));}
  assert.equal(E.getStatus(p,s),'lost');assert.equal(E.analyze(p,s).mistakes,4);
 }
 {
  const p=sprouts[0];let s=Sprout.createExpandedState();for(let step=0;step<5;step++){s=Sprout.hint(p,s);assert.ok(Sprout.restoreState(p,s));if(step<4)s=Sprout.submitWord(p,s,Sprout.solutionPath(p,s)[step+1]).state;}
  assert.equal(Sprout.getStatus(p,s),'lost');assert.equal(Sprout.analyze(p,s).wilts,5);
 }
 {
  const E=await import('../games/claude-keystone/engine.mjs'),{PUZZLES}=await import('../games/claude-keystone/puzzles.mjs'),p=PUZZLES[0];let s=E.createExpandedState(p);
  for(let row=0;row<3;row++){for(const word of ['pivot','zebra','quark','tango','nylon'])s=E.submit(p,E.setDraft(p,s,word)).state;assert.equal(E.roundView(p.rounds[row],s.rounds[row],2).status,'lost');if(row<2)s=E.nextArch(p,s);}
  assert.equal(E.getStatus(p,s),'lost');assert.equal(E.total(p,s),18);assert.ok(E.restoreState(p,s));
 }
});

test('Claude Tangle v2 accepts an entire alternative ordered-bead partition instead of an arbitrary target rejection',async()=>{
 const E=await import('../games/claude-tangle/engine.mjs'),{PUZZLES}=await import('../games/claude-tangle/puzzles.mjs'),p=PUZZLES.find(p=>p.id==='tangle-165');
 const pulls=[[3,4,8,9,15],[0,2,5,6,11,13],[1,7,10,12,14,16]];
 let s={...E.createState(),vocabulary:2};
 for(const indices of pulls){for(const i of indices)s=E.toggle(p,s,i).state;s=E.submit(p,s).state;assert.ok(E.restoreState(p,s));}
 assert.equal(E.getStatus(p,s),'won','TRIAL / DEBATE / RACIAL partitions every bead in the shown lengths');
 assert.equal(E.view(p,s).knots,0);assert.equal(E.restoreState(p,s).vocabulary,2);
 let legacy=E.createState();for(const i of pulls[0])legacy=E.toggle(p,legacy,i).state;legacy=E.submit(p,legacy).state;
 assert.equal(E.view(p,legacy).pulls.length,0);assert.equal(E.view(p,legacy).knots,1);
 assert.equal(E.restoreState(p,{...E.createState(),vocabulary:99}),null);
});

test('the real Claude Tangle app displays the chosen valid partition and preserves it on reload',async()=>{
 const {createRequire}=await import('node:module'),{JSDOM}=createRequire(import.meta.url)('jsdom');
 const E=await import('../games/claude-tangle/engine.mjs'),{PUZZLES}=await import('../games/claude-tangle/puzzles.mjs'),p=PUZZLES.find(p=>p.id==='tangle-165');
 const {centralDateKey,createSession}=await import('../games/deepseek-runtime/core.mjs');
 const descriptors=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'https://cq.test/games/claude-tangle/',pretendToBeVisual:true});
 try{
  dom.window.setInterval=()=>1;dom.window.clearInterval=()=>{};
  for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
  const key=`claude-tangle:v1:daily:${centralDateKey()}`;
  dom.window.localStorage.setItem(key,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:PUZZLES.indexOf(p),state:E.createExpandedState()}));
  await import('../games/claude-tangle/app.mjs?cq=partition');
  for(const indices of [[3,4,8,9,15],[0,2,5,6,11,13],[1,7,10,12,14,16]]){
   for(const i of indices)dom.window.document.querySelector(`[data-bead="${i}"]`).click();dom.window.document.querySelector('#tangle-pull').click();
  }
  assert.deepEqual([...dom.window.document.querySelectorAll('.tangle-thread strong')].map(x=>x.textContent),['TRIAL','DEBATE','RACIAL']);
  assert.equal(dom.window.document.querySelector('#result').hidden,false);
  const session=createSession({...E,createState:E.createExpandedState,id:'claude-tangle',name:'Tangle',puzzles:PUZZLES},{storage:dom.window.localStorage});
  assert.equal(session.puzzle.id,p.id);assert.equal(session.outcome,'won');assert.equal(session.state.vocabulary,2);assert.equal(session.stats.won,1);
 }finally{dom.window.close();for(const[k,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
});

test('all five classic-round apps disclose earlier rules in play and Help while new Practice uses the expanded dictionary',async()=>{
 const {createRequire}=await import('node:module'),{JSDOM}=createRequire(import.meta.url)('jsdom'),{centralDateKey}=await import('../games/deepseek-runtime/core.mjs');
 const descriptors=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const slug of ['dovetail','splice','sprout','keystone','tangle']){
  const E=await import(`../games/claude-${slug}/engine.mjs`),{PUZZLES}=await import(`../games/claude-${slug}/puzzles.mjs`),p=PUZZLES[0],classic=E.createState(p);
  const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:`https://cq.test/games/claude-${slug}/`,pretendToBeVisual:true});
  try{
   dom.window.setInterval=()=>1;dom.window.clearInterval=()=>{};
   for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
   const prefix=`claude-${slug}:v1:`,key=prefix+'daily:'+centralDateKey();
   dom.window.localStorage.setItem(key,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:0,state:classic}));
   await import(`../games/claude-${slug}/app.mjs?cq=classic-message`);
   assert.match(dom.window.document.querySelector('#puzzle').textContent,/saved round keeps earlier word rules.*New Practice rounds use the expanded game dictionary/s,slug);
   assert.match(dom.window.document.querySelector('#help-dialog').textContent,/restored saved round keeps its earlier word rules.*new Practice rounds/s,slug);
   dom.window.document.querySelector('#practice-mode').click();
   assert.equal(JSON.parse(dom.window.localStorage.getItem(prefix+'practice')).state.vocabulary,2,slug);
   assert.deepEqual(JSON.parse(dom.window.localStorage.getItem(key)).state,classic,slug+' classic Daily stays intact');
  }finally{dom.window.close();for(const[k,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
 }
});
