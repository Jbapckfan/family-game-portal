import test from 'node:test';
import assert from 'node:assert/strict';
import {centralDateKey, dailyIndex, makeStore, cleanRecords, recordStatistics, createSession} from './core.mjs';

function storage(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
function config(){return {id:'deepseek-fixture',name:'Fixture',puzzles:[{id:'a',answer:1},{id:'b',answer:2},{id:'c',answer:3}],createState:()=>({value:0,revealed:false}),restoreState:(p,s)=>s&&Number.isInteger(s.value)&&s.value>=0&&s.value<=3&&typeof s.revealed==='boolean'?{value:s.value,revealed:s.revealed}:null,getStatus:(p,s)=>s.revealed?'revealed':s.value===p.answer?'won':'playing',hint:(p,s)=>({...s,value:p.answer}),reveal:(p,s)=>({...s,value:p.answer,revealed:true})};}
test('Central calendar changes at local midnight on both daylight-saving offsets',()=>{
 assert.equal(centralDateKey(new Date('2026-03-08T05:59:59Z')),'2026-03-07');
 assert.equal(centralDateKey(new Date('2026-03-08T06:00:00Z')),'2026-03-08');
 assert.equal(centralDateKey(new Date('2026-11-02T05:59:59Z')),'2026-11-01');
 assert.equal(centralDateKey(new Date('2026-11-02T06:00:00Z')),'2026-11-02');
});
test('daily selection is deterministic, bounded, and advances one record a day',()=>{
 for(let i=0;i<30;i++){const day=new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);assert.equal(dailyIndex('deepseek-rung',day,30),(dailyIndex('deepseek-rung','2026-10-01',30)+i)%30);}
 assert.throws(()=>dailyIndex('x','2026-02-30',30));assert.throws(()=>dailyIndex('x','2026-10-20',0));
});
test('failed writes retain newer memory instead of stale persisted records',()=>{
 const s=storage();s.setItem('x','{"old":true}');s.setItem=()=>{throw Error('quota');};const store=makeStore(s);store.write('x',{new:true});assert.deepEqual(store.read('x'),{new:true});assert.equal(store.available,false);
});
test('records reject impossible, future, nonterminal and malformed dates',()=>{
 const records=cleanRecords({'2026-02-30':{status:'won'},'2026-10-21':{status:'won'},'2026-10-20':{status:'revealed'},'2026-10-19':{status:'playing'},'2026-10-18':[]},'2026-10-20');assert.deepEqual(records,{'2026-10-20':{status:'revealed'}});
});
test('streaks distinguish wins, reveals and missed days',()=>{
 const r={'2026-10-15':{status:'won'},'2026-10-16':{status:'won'},'2026-10-18':{status:'won'},'2026-10-19':{status:'revealed'},'2026-10-20':{status:'won'}};
 assert.deepEqual(recordStatistics(r,'2026-10-20'),{played:5,won:4,streak:1,bestStreak:2});assert.equal(recordStatistics(r,'2026-10-23').streak,0);
});
test('daily win restores, terminal result is final and daily actions cannot reset it',()=>{
 const s=storage(),c=config(),now=()=>new Date('2026-10-20T18:00:00Z');let game=createSession(c,{storage:s,now});game.commit({value:game.puzzle.answer,revealed:false});assert.equal(game.outcome,'won');assert.equal(game.reveal(),false);assert.equal(game.commit({value:0,revealed:false}),false);
 game=createSession(c,{storage:s,now});assert.equal(game.outcome,'won');assert.deepEqual(game.stats,{played:1,won:1,streak:1,bestStreak:1});assert.equal(game.progress().slug,c.id);
});
test('revealed result remains revealed, and practice never creates a daily result',()=>{
 const s=storage(),game=createSession(config(),{storage:s,now:()=>new Date('2026-10-20T18:00:00Z')});game.reveal();assert.equal(game.outcome,'revealed');game.practice();assert.equal(game.mode,'practice');game.hint();assert.equal(game.outcome,'won');assert.deepEqual(game.stats,{played:1,won:0,streak:0,bestStreak:0});game.daily();assert.equal(game.outcome,'revealed');
});
test('unknown and mismatched saved states cannot fabricate a win',()=>{
 const s=storage(),c=config(),key='deepseek-fixture:v1:daily:2026-10-20';s.setItem(key,JSON.stringify({version:1,puzzleId:'wrong',state:{value:999,revealed:false}}));const g=createSession(c,{storage:s,now:()=>new Date('2026-10-20T18:00:00Z')});assert.equal(g.outcome,'playing');assert.equal(g.stats.played,0);
});
test('a move from before midnight cannot complete the next day’s puzzle',()=>{
 const s=storage();let time=new Date('2026-10-21T04:59:59Z');const g=createSession(config(),{storage:s,now:()=>time}),old={value:g.puzzle.answer,revealed:false};time=new Date('2026-10-21T05:00:00Z');assert.equal(g.commit(old),false);assert.equal(g.dateKey,'2026-10-21');assert.equal(g.outcome,'playing');assert.equal(g.stats.played,0);
});
test('first terminal result survives unavailable storage during further renders',()=>{
 const s=storage();s.setItem=()=>{throw Error('denied');};const g=createSession(config(),{storage:s,now:()=>new Date('2026-10-20T18:00:00Z')});g.reveal();assert.equal(g.outcome,'revealed');g.practice();g.hint();g.daily();assert.equal(g.outcome,'revealed');assert.equal(g.stats.played,1);assert.equal(g.stats.won,0);
});
test('unfinished practice resumes across Today, reload, and the next Central date; Next practice advances',()=>{
 const s=storage(),c=config();let time=new Date('2026-10-20T18:00:00Z');let g=createSession(c,{storage:s,now:()=>time});
 g.practice();const id=g.puzzle.id,value=g.puzzle.answer===3?2:3;g.commit({value,revealed:false});g.daily();time=new Date('2026-10-21T18:00:00Z');g.practice();
 assert.equal(g.puzzle.id,id);assert.equal(g.state.value,value);assert.equal(g.stats.played,0);
 g=createSession(c,{storage:s,now:()=>time});g.practice();assert.equal(g.puzzle.id,id);assert.equal(g.state.value,value);
 g.practice();assert.notEqual(g.puzzle.id,id);assert.equal(g.state.value,0);assert.equal(g.stats.played,0);
});
test('completed practice advances on re-entry while malformed practice envelopes cannot redirect selection',()=>{
 const s=storage(),c=config(),now=()=>new Date('2026-10-20T18:00:00Z');const g=createSession(c,{storage:s,now});
 g.practice();g.hint();const id=g.puzzle.id;g.daily();g.practice();assert.notEqual(g.puzzle.id,id);assert.equal(g.outcome,'playing');
 s.setItem('deepseek-fixture:v1:practice',JSON.stringify({version:1,puzzleIndex:999,puzzleId:'a',state:{value:1,revealed:false}}));
 const fresh=createSession(c,{storage:s,now});fresh.practice();assert.equal(fresh.outcome,'playing');assert.equal(fresh.stats.played,0);
});
