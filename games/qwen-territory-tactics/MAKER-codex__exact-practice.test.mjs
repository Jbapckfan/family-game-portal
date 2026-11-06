import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {EXACT_PUZZLES,EXACT_EDITION} from './exact-puzzles.mjs';
import {PUZZLES as LEGACY} from './puzzles.mjs';
import {createSession,centralDateKey,dailyIndex} from '../deepseek-runtime/core.mjs';
import {practiceCandidates} from '../deepseek-runtime/practice-calendar.mjs';
const id='qwen-territory-tactics',scheduleID=id+':'+EXACT_EDITION;
const config={...E,id,name:'Territory Tactics',puzzles:EXACT_PUZZLES,stateEdition:EXACT_EDITION,practiceReservedDays:186};
const dateAt=(date,offset)=>new Date(Date.parse(date+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
const indexAt=(date,offset)=>dailyIndex(scheduleID,dateAt(date,offset),EXACT_PUZZLES.length);
const storage=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
function practicePool(game){const seen=new Set();for(let i=0;i<EXACT_PUZZLES.length+1;i++){game.practice();seen.add(EXACT_PUZZLES.indexOf(game.puzzle));}return seen;}

for(const date of ['2026-11-06','2027-03-13','2027-03-14','2027-05-05','2027-11-06','2027-11-07'])test(`${date}: fresh exact Practice excludes today through day 185 inclusive, leaving 54 boards`,()=>{
 const game=createSession(config,{now:()=>new Date(date+'T18:00:00Z')}),seen=practicePool(game);
 assert.equal(seen.size,54);
 for(let offset=0;offset<186;offset++)assert.ok(!seen.has(indexAt(date,offset)),dateAt(date,offset)+' must stay protected');
 assert.ok(seen.has(indexAt(date,-1)),'yesterday may be replayed');assert.ok(seen.has(indexAt(date,186)),'day 186 is outside the inclusive 186-date window');
 assert.equal(game.stats.played,0);
});

test('Central midnight advances the reservation once; DST clock changes never shift it',()=>{
 const moments=[
  ['2027-03-14T05:59:59Z','2027-03-13'],['2027-03-14T06:00:00Z','2027-03-14'],
  ['2027-03-14T07:59:59Z','2027-03-14'],['2027-03-14T08:00:00Z','2027-03-14'],
  ['2027-11-07T04:59:59Z','2027-11-06'],['2027-11-07T05:00:00Z','2027-11-07'],
  ['2027-11-07T06:59:59Z','2027-11-07'],['2027-11-07T07:00:00Z','2027-11-07'],
 ];
 let time;const game=createSession(config,{now:()=>time??new Date(moments[0][0])});
 for(const [stamp,date] of moments){time=new Date(stamp);assert.equal(centralDateKey(time),date);game.daily();const seen=practicePool(game);
  assert.equal(seen.size,54);for(let offset=0;offset<186;offset++)assert.ok(!seen.has(indexAt(date,offset)),stamp+' '+offset);
 }
});

test('valid saved exact Practice survives protection, while Next returns to the safe pool',()=>{
 const date='2026-11-06',index=indexAt(date,1),p=EXACT_PUZZLES[index],saved=E.hint(p,E.createState(p)),store=storage();
 const prefix=id+':v1:edition:'+EXACT_EDITION+':';
 store.setItem(prefix+'practice',JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:index,state:saved}));
 const game=createSession(config,{storage:store,now:()=>new Date(date+'T18:00:00Z')});
 assert.equal(game.practice(),'resumed');assert.equal(game.puzzle.id,p.id);assert.deepEqual(game.state,saved);
 assert.equal(game.practice(),'new');assert.ok(!Array.from({length:186},(_,offset)=>indexAt(date,offset)).includes(EXACT_PUZZLES.indexOf(game.puzzle)));
});

test('legacy Territory practice candidates and calendar stay on the original reservation',()=>{
 const date='2026-11-06',game=createSession({...E,id,name:'Territory Tactics',puzzles:LEGACY},{now:()=>new Date(date+'T18:00:00Z')});
 const today=dailyIndex(id,date,LEGACY.length);assert.equal(game.puzzle.id,LEGACY[today].id);
 const expected=practiceCandidates(id,date,LEGACY.length,{excludeIndices:[today]}),seen=new Set();
 for(let i=0;i<LEGACY.length;i++){game.practice();seen.add(LEGACY.indexOf(game.puzzle));}
 assert.deepEqual(seen,new Set(expected));
});

test('invalid rolling reservations fail explicitly instead of exhausting the Practice pool',()=>{
 for(const practiceReservedDays of [0,-1,1.5,Infinity,'186',240,241])assert.throws(()=>createSession({...config,practiceReservedDays},{now:()=>new Date('2026-11-06T18:00:00Z')}),/Practice reservation/);
});
