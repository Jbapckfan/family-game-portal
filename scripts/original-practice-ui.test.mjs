import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInContext} from 'node:vm';
import {practiceCandidates} from '../games/deepseek-runtime/practice-calendar.mjs';
import {DAILY_RESERVATIONS,originalDailyIndex} from '../games/deepseek-runtime/daily-rotations.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const slugs=['ringcount','switchpath','counterpart','shortlist','second-sense','sideways','tradeoff','inbetween'];
const strip=source=>source.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const plain=value=>JSON.parse(JSON.stringify(value));

async function openGame(slug,{saved={},date='2026-10-30'}={}){
 const root=new URL(`../games/${slug}/`,import.meta.url),E=await import(new URL('engine.mjs',root)),{PUZZLES}=await import(new URL('puzzles.mjs',root));
 const dom=new JSDOM(await readFile(new URL('index.html',root),'utf8'),{url:`https://daily.test/games/${slug}/`,runScripts:'outside-only'}),w=dom.window;
 w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>fn();w.setInterval=()=>1;w.setTimeout=()=>1;w.clearTimeout=()=>{};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.CSS={escape:String};
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,JSON.stringify(value));
 let currentDate=date;
 const engine={...E,getDateKey:()=>currentDate,getDaily:items=>{
  const daily=E.getDaily(items,new Date(`${currentDate}T17:00:00Z`));
  return {...daily,puzzle:items[originalDailyIndex(slug,currentDate,daily.number-1,items.length)]};
 }};
 Object.assign(w,engine,{engine,PUZZLES,practiceCandidates});
 const context=dom.getInternalVMContext(),shell=!['tradeoff','inbetween'].includes(slug);
 if(shell)runInContext(strip(await readFile(new URL('shell.mjs',root),'utf8')),context);
 if(['ringcount','switchpath','counterpart','shortlist','second-sense'].includes(slug))runInContext(strip(await readFile(new URL('share-card.mjs',root),'utf8')),context);
 runInContext(strip(await readFile(new URL('app.mjs',root),'utf8')),context);
 const state=()=>runInContext(shell?'({mode:app.mode,puzzle:app.puzzle,game:app.game})':'({mode,puzzle,game})',context);
 const $=q=>w.document.querySelector(q);
 const picker=()=>{$('#practice-tab').click();return [...w.document.querySelectorAll('.practice-choice')].map(b=>({index:Number(b.dataset.practice??b.dataset.index),disabled:b.disabled,label:b.getAttribute('aria-label')}));};
 const choose=index=>{
  const b=w.document.createElement('button');
  if(slug==='tradeoff'){b.dataset.action='practice';b.dataset.index=String(index);}else b.dataset.practice=String(index);
  $('#dialog-content').append(b);b.click();b.remove();
 };
 const next=()=>{$(slug==='tradeoff'?'#next-practice-button':'#next-button').click();if(slug==='inbetween')$('[data-action="random"]').click();};
 return {E,PUZZLES,dom,w,$,state,picker,choose,next,now:()=>currentDate,setDate:date=>{currentDate=date;},daily:()=>engine.getDaily(PUZZLES),close:()=>dom.window.close()};
}
function progressed(slug,E,p){return E.useHint(p,E.createGame(p),slug==='counterpart'?0:slug==='second-sense'?p.pairs[0].nounId:undefined).state;}

for(const slug of slugs){
 test(`${slug}: picker and random/Next show only eligible Practice, never upcoming dailies`,async()=>{
  const g=await openGame(slug);try{
   const today=g.PUZZLES.indexOf(g.daily().puzzle),expected=practiceCandidates(slug,g.now(),g.PUZZLES.length,{excludeIndices:[today]});
   const choices=g.picker();assert.deepEqual(choices.map(c=>c.index).sort((a,b)=>a-b),[...expected].sort((a,b)=>a-b));assert.ok(choices.every(c=>!c.disabled));
   assert.match(g.$('#dialog-content').textContent,/upcoming dailies stay fresh/i);
   const future=DAILY_RESERVATIONS.byGame[slug].indices[2];g.choose(future);assert.equal(g.state().mode,'daily','forged picker events cannot open future boards');
   for(let n=0;n<40;n++){g.w.Math.random=()=>n/40;g.next();assert.equal(g.state().mode,'practice');assert.ok(expected.includes(g.PUZZLES.indexOf(g.state().puzzle)));}
  }finally{g.close();}
 });
 test(`${slug}: valid saved future progress resumes explicitly, malformed saves cannot unlock it`,async()=>{
  const {PUZZLES}=await import(`../games/${slug}/puzzles.mjs`),E=await import(`../games/${slug}/engine.mjs`),index=DAILY_RESERVATIONS.byGame[slug].indices[2],p=PUZZLES[index],state=progressed(slug,E,p);
  assert.equal(state.status,'playing');assert.notDeepEqual(state,E.createGame(p));
  const key=`${slug}:v1:practice:${p.id}`;
  const cases=[['valid',state],['mismatch',{...state,puzzleId:'another-puzzle'}],['initial',E.createGame(p)],['invalid',{puzzleId:p.id,status:'playing'}]];
  if(slug==='inbetween'){
   const placed=E.submitPlacement(p,state,E.findHint(p,state)).state;
   cases.push(['normalized',{...placed,placements:placed.placements.map(item=>item?{gap:item.gap,tileId:item.tileId}:null)}]);
  }
  for(const [kind,raw] of cases){
   const g=await openGame(slug,{saved:{[key]:raw}});try{
    const choices=g.picker(),present=choices.find(c=>c.index===index);
    if(['valid','initial','normalized'].includes(kind)){
     assert.ok(present);assert.match(present.label,/resume/i);g.choose(index);assert.equal(g.state().puzzle.id,p.id);assert.deepEqual(plain(g.state().game),E.restoreGame(p,raw));
     g.next();assert.notEqual(g.state().puzzle.id,p.id);assert.deepEqual(JSON.parse(g.w.localStorage.getItem(key)),raw,'Next leaves saved progress intact');
    }else{assert.equal(present,undefined);g.choose(index);assert.equal(g.state().mode,'daily');}
   }finally{g.close();}
  }
 });
 test(`${slug}: a finished daily may replay while tomorrow remains reserved`,async()=>{
  const seed=await openGame(slug);const {E,PUZZLES}=seed,today=seed.daily(),finished=E.revealGame(today.puzzle,E.createGame(today.puzzle));seed.close();
  const g=await openGame(slug,{saved:{[`${slug}:v1:daily:${today.dateKey}`]:finished}});try{
   const choices=g.picker(),index=PUZZLES.findIndex(p=>p.id===today.puzzle.id);
   assert.ok(choices.some(c=>c.index===index&&!c.disabled));g.choose(index);assert.equal(g.state().mode,'practice');assert.equal(g.state().puzzle.id,today.puzzle.id);
   assert.equal(g.state().game.status,'playing');assert.deepEqual(JSON.parse(g.w.localStorage.getItem(`${slug}:v1:daily:${today.dateKey}`)),finished);
   assert.ok(!choices.some(c=>c.index===DAILY_RESERVATIONS.byGame[slug].indices[2]));
  }finally{g.close();}
 });
}
