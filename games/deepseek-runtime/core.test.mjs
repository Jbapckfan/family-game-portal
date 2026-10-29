import test from 'node:test';
import assert from 'node:assert/strict';
import {centralDateKey, dailyIndex, makeStore, cleanRecords, recordStatistics, createSession, DAILY_BANK_SCHEDULES} from './core.mjs';

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

test('expanded banks preserve every old daily assignment and expose the new rotation at Central midnight',()=>{
 for(const [id,schedule]of Object.entries(DAILY_BANK_SCHEDULES)){
  const release=schedule.releases[0],oldCount=schedule.initialCount,newCount=release.count;
  for(const key of ['2026-01-01','2026-10-20','2026-10-21','2026-10-22'])
   assert.equal(dailyIndex(id,key,newCount),dailyIndex(id,key,oldCount),`${id}: ${key}`);
  assert.equal(dailyIndex(id,release.from,newCount),oldCount,`${id}: first added board`);
  const visited=new Set();
  for(let offset=0;offset<newCount;offset++){
   const key=new Date(Date.parse(release.from+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
   visited.add(dailyIndex(id,key,newCount));
   assert.equal(dailyIndex(id,key,newCount+50),dailyIndex(id,key,newCount),`${id}: unpublished additions cannot change a date`);
  }
  assert.equal(visited.size,newCount,`${id}: a complete rotation visits every board`);
 }
});

test('bank expansion and reordering retain the saved daily puzzle, state, and completed result',()=>{
 for(const finish of [false,true]){
  const s=storage(),c=config(),now=()=>new Date('2026-10-22T18:00:00Z');
  const before=createSession(c,{storage:s,now}),id=before.puzzle.id;
  const value=finish?before.puzzle.answer:(before.puzzle.answer===3?2:3);
  before.commit({value,revealed:false});
  const updated={...c,puzzles:[{id:'new',answer:1},...c.puzzles].reverse()};
  const after=createSession(updated,{storage:s,now});
  assert.equal(after.puzzle.id,id);assert.equal(after.state.value,value);
  assert.equal(after.outcome,finish?'won':'playing');assert.equal(after.stats.played,finish?1:0);
  after.practice();after.daily();assert.equal(after.puzzle.id,id);assert.equal(after.state.value,value);
 }
});

test('invalid saved daily state falls back to the scheduled board without creating a result',()=>{
 const s=storage(),c=config(),key='2026-10-22',index=dailyIndex(c.id,key,c.puzzles.length);
 const different=c.puzzles[(index+1)%c.puzzles.length];
 s.setItem(`${c.id}:v1:daily:${key}`,JSON.stringify({version:1,puzzleId:different.id,puzzleIndex:index,state:{value:999,revealed:false}}));
 const g=createSession(c,{storage:s,now:()=>new Date(key+'T18:00:00Z')});
 assert.equal(g.puzzle.id,c.puzzles[index].id);assert.equal(g.outcome,'playing');assert.equal(g.stats.played,0);
});

test('unfinished practice survives appended puzzles and reaches every board except today',()=>{
 const s=storage(),c=config(),now=()=>new Date('2026-10-22T18:00:00Z');
 const before=createSession(c,{storage:s,now});before.practice();
 const id=before.puzzle.id,value=before.puzzle.answer===3?2:3;before.commit({value,revealed:false});
 const updated={...c,puzzles:[...c.puzzles,{id:'d',answer:1},{id:'e',answer:2}]};
 const after=createSession(updated,{storage:s,now});assert.equal(after.practice(),'resumed');
 assert.equal(after.puzzle.id,id);assert.equal(after.state.value,value);
 const visited=new Set([after.puzzle.id]);
 for(let i=1;i<updated.puzzles.length;i++){after.practice();visited.add(after.puzzle.id);}
 const today=dailyIndex(c.id,'2026-10-22',updated.puzzles.length);
 const expected=new Set([id,...updated.puzzles.filter((_,index)=>index!==today).map(p=>p.id)]);
 assert.deepEqual(visited,expected);assert.equal(after.stats.played,0);
});

test('a stale tab cannot overwrite a finished daily when its ledger write failed',()=>{
 const s=storage(),c=config(),now=()=>new Date('2026-10-22T18:00:00Z');
 const winner=createSession(c,{storage:s,now}),stale=createSession(c,{storage:s,now});
 const write=s.setItem;s.setItem=(key,value)=>{if(key.endsWith(':records'))throw Error('quota');write(key,value);};
 winner.hint();const finished=s.getItem(`${c.id}:v1:daily:2026-10-22`);
 s.setItem=write;
 assert.equal(stale.commit({value:0,revealed:false}),false);
 assert.equal(s.getItem(`${c.id}:v1:daily:2026-10-22`),finished);
 assert.equal(stale.state.value,winner.puzzle.answer);
 assert.equal(stale.outcome,'won');assert.equal(stale.stats.won,1);
});

test('stale hint and reveal actions adopt the other tab’s completed board',()=>{
 for(const action of ['hint','reveal']){
  const s=storage(),c=config(),now=()=>new Date('2026-10-22T18:00:00Z');
  const winner=createSession(c,{storage:s,now}),stale=createSession(c,{storage:s,now});
  winner.hint();
  assert.equal(stale[action](),false);
  assert.deepEqual(stale.state,winner.state);
  assert.equal(stale.outcome,'won');assert.equal(stale.stats.won,1);
 }
});

test('refreshing another tab’s result preserves practice and rejects invalid terminal snapshots',()=>{
 const s=storage(),c=config(),now=()=>new Date('2026-10-22T18:00:00Z');
 const winner=createSession(c,{storage:s,now}),stale=createSession(c,{storage:s,now});
 winner.reveal();
 assert.equal(stale.refreshSavedResult(),true);
 assert.equal(stale.outcome,'revealed');assert.deepEqual(stale.state,winner.state);
 assert.equal(stale.refreshSavedResult(),false);
 stale.practice();const practice=stale.state;
 assert.equal(stale.refreshSavedResult(),false);assert.deepEqual(stale.state,practice);
 const freshStorage=storage(),fresh=createSession(c,{storage:freshStorage,now});
 freshStorage.setItem(`${c.id}:v1:daily:2026-10-22`,JSON.stringify({version:1,puzzleId:fresh.puzzle.id,state:{value:999,revealed:false}}));
 assert.equal(fresh.refreshSavedResult(),false);assert.equal(fresh.outcome,'playing');
});

test('fresh Tumbler Practice never reveals tomorrow or another protected future daily',async()=>{
 const E=await import('../claude-tumbler/engine.mjs'),{PUZZLES}=await import('../claude-tumbler/puzzles.mjs');
 const c={...E,id:'claude-tumbler',name:'Tumbler',puzzles:PUZZLES},date='2026-10-30';
 assert.equal(dailyIndex(c.id,date,PUZZLES.length),391);
 assert.equal(dailyIndex(c.id,'2026-10-31',PUZZLES.length),392);
 const protectedIndices=new Set();
 for(let t=Date.parse(date);t<=Date.parse('2027-04-28');t+=86400000)protectedIndices.add(dailyIndex(c.id,new Date(t).toISOString().slice(0,10),PUZZLES.length));
 const g=createSession(c,{storage:storage(),now:()=>new Date(`${date}T17:00:00Z`)});
 for(let n=0;n<PUZZLES.length;n++){g.practice();assert.ok(!protectedIndices.has(PUZZLES.indexOf(g.puzzle)),`${g.puzzle.id} is a protected daily`);}
 assert.equal(g.stats.played,0);
});

test('a valid unfinished saved Practice round keeps progress even when its board is now reserved',async()=>{
 const E=await import('../claude-tumbler/engine.mjs'),{PUZZLES}=await import('../claude-tumbler/puzzles.mjs');
 const c={...E,id:'claude-tumbler',name:'Tumbler',puzzles:PUZZLES},s=storage(),now=()=>new Date('2026-10-30T17:00:00Z');
 const index=392,p=PUZZLES[index],state=E.setDraft(p,E.createState(p),'ab');
 s.setItem(`${c.id}:v1:practice`,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:index,state}));
 const g=createSession(c,{storage:s,now});assert.equal(g.practice(),'resumed');
 assert.equal(g.puzzle.id,p.id);assert.deepEqual(g.state,state);assert.equal(g.stats.played,0);
 assert.equal(g.practice(),'new');assert.notEqual(g.puzzle.id,p.id);
 const {practiceCandidates}=await import('./practice-calendar.mjs');
 assert.ok(practiceCandidates(c.id,'2026-10-30',PUZZLES.length).includes(PUZZLES.indexOf(g.puzzle)));
});
test('finished reserved Practice is replaced and a legacy Prism draft is preserved only until Next',async()=>{
 const {practiceCandidates}=await import('./practice-calendar.mjs');
 for(const slug of ['claude-tumbler','qwen-pattern-prism']){
  const E=await import(`../${slug}/engine.mjs`),{PUZZLES}=await import(`../${slug}/puzzles.mjs`);
  const c={...E,id:slug,name:slug,puzzles:PUZZLES},s=storage(),now=()=>new Date('2026-10-30T17:00:00Z');
  const index=slug==='claude-tumbler'?392:PUZZLES.findIndex((_,i)=>!practiceCandidates(slug,'2027-04-29',PUZZLES.length).includes(i));
  const p=PUZZLES[index],state=slug==='claude-tumbler'?E.reveal(p,E.createState(p)):E.hint(p,E.createState(p));
  s.setItem(`${slug}:v1:practice`,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:index,state}));
  const g=createSession(c,{storage:s,now});
  if(slug==='qwen-pattern-prism'){assert.equal(g.practice(),'resumed');assert.equal(g.puzzle.id,p.id);assert.deepEqual(g.state,state);}
  assert.equal(g.practice(),'new');
  assert.ok(practiceCandidates(slug,'2026-10-30',PUZZLES.length).includes(PUZZLES.indexOf(g.puzzle)));
 }
});
test('one-board solve fixtures can enter and advance Practice without writing daily results',()=>{
 const c={...config(),puzzles:[{id:'only',answer:1}]},g=createSession(c,{storage:storage(),now:()=>new Date('2026-10-30T17:00:00Z')});
 assert.equal(g.practice(),'new');assert.equal(g.puzzle.id,'only');g.hint();assert.equal(g.outcome,'won');
 assert.equal(g.practice(),'new');assert.equal(g.outcome,'playing');assert.equal(g.stats.played,0);
});
test('Prism Next Practice stays canonical and traverses the entire nonreserved pool',async()=>{
 const E=await import('../qwen-pattern-prism/engine.mjs'),{PUZZLES}=await import('../qwen-pattern-prism/puzzles.mjs');
 const {practiceCandidates}=await import('./practice-calendar.mjs'),slug='qwen-pattern-prism',date='2026-10-30';
 const c={...E,id:slug,name:slug,puzzles:PUZZLES},g=createSession(c,{storage:storage(),now:()=>new Date(`${date}T17:00:00Z`)});
 const expected=practiceCandidates(slug,date,PUZZLES.length,{excludeIndices:[dailyIndex(slug,date,PUZZLES.length)]}),visited=new Set();
 for(let i=0;i<expected.length;i++){g.practice();visited.add(PUZZLES.indexOf(g.puzzle));}
 assert.deepEqual([...visited],expected);g.practice();assert.equal(PUZZLES.indexOf(g.puzzle),expected[0]);
});
