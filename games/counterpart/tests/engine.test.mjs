import test from 'node:test';
import assert from 'node:assert/strict';
import { EPOCH, getDateKey, getDayNumber, getDaily, createGame, submitPair, useHint, revealGame, restoreGame, isPerfect, getStats, formatShare } from '../engine.mjs';

const puzzle = {
  id:'fixture', title:'Meaning matters', difficulty:'Tricky',
  rows: [
    {id:'r0',cue:['ACORN','OAK'],answer:['a','b'],relationship:'Earlier stage → later stage',explanation:'An acorn can become an oak; a caterpillar can become a butterfly.'},
    {id:'r1',cue:['GLOVE','HAND'],answer:['c','d'],relationship:'Protective covering → what it protects',explanation:'A glove protects a hand; a sheath protects a blade.'},
    {id:'r2',cue:['COMPASS','DIRECTION'],answer:['e','f'],relationship:'Instrument → what it indicates',explanation:'A compass indicates direction; a barometer indicates pressure.'},
    {id:'r3',cue:['EMBER','FIRE'],answer:['g','h'],relationship:'Lingering trace → its source',explanation:'An ember remains from a fire; an echo remains from a sound.'},
    {id:'r4',cue:['AUTHOR','NOVEL'],answer:['i','j'],relationship:'Creator → creation',explanation:'An author writes a novel; a composer writes a symphony.'},
  ],
  tiles: [['a','CATERPILLAR'],['b','BUTTERFLY'],['c','SHEATH'],['d','BLADE'],['e','BAROMETER'],['f','PRESSURE'],['g','ECHO'],['h','SOUND'],['i','COMPOSER'],['j','SYMPHONY']].map(([id,word])=>({id,word})),
};
const solve = (state=createGame(puzzle)) => puzzle.rows.reduce((current,row,index)=>current.placements[index]?current:submitPair(puzzle,current,{row:index,tileIds:row.answer}).state,state);
const record=(status='won',attempts=5,hints=0)=>({status,attempts,hints,puzzleId:'fixture'});

test('new board starts with five free rows and no scored actions',()=>{
  assert.deepEqual(createGame(puzzle),{puzzleId:'fixture',placements:[null,null,null,null,null],attempts:0,hintedRows:[],status:'playing'});
});
test('correct pair locks that row and costs one check without mutating prior state',()=>{
  const state=createGame(puzzle); const before=structuredClone(state);
  const result=submitPair(puzzle,state,{row:1,tileIds:['c','d']});
  assert.equal(result.accepted,true);assert.equal(result.changed,true);assert.equal(result.reason,null);
  assert.equal(result.state.attempts,1);assert.deepEqual(result.state.placements,[null,['c','d'],null,null,null]);assert.deepEqual(state,before);
});
test('wrong ordered pair costs a check without consuming either word',()=>{
  const result=submitPair(puzzle,createGame(puzzle),{row:0,tileIds:['a','d']});
  assert.equal(result.reason,'no-match');assert.equal(result.changed,true);assert.equal(result.accepted,false);assert.equal(result.state.attempts,1);assert.ok(result.state.placements.every(x=>x===null));
});
test('correct words in reverse order do not match a directional relationship',()=>{
  const result=submitPair(puzzle,createGame(puzzle),{row:0,tileIds:['b','a']});
  assert.equal(result.reason,'no-match');assert.equal(result.state.attempts,1);
});
test('incomplete, duplicate, malformed and unknown selections are unscored',()=>{
  const state=createGame(puzzle);
  for (const selection of [null,[],{}, {row:-1,tileIds:['a','b']},{row:5,tileIds:['a','b']},{row:0.5,tileIds:['a','b']},{row:'0',tileIds:['a','b']},{row:0,tileIds:['a']},{row:0,tileIds:['a','a']},{row:0,tileIds:['a','x']},{row:0,tileIds:['a','b','c']}]) {
    const result=submitPair(puzzle,state,selection);assert.equal(result.reason,'invalid');assert.equal(result.changed,false);assert.equal(result.state,state);
  }
});
test('a solved row cannot be overwritten and used words cannot enter another row',()=>{
  const state=submitPair(puzzle,createGame(puzzle),{row:0,tileIds:['a','b']}).state;
  assert.equal(submitPair(puzzle,state,{row:0,tileIds:['c','d']}).reason,'locked');
  const result=submitPair(puzzle,state,{row:1,tileIds:['a','d']});assert.equal(result.reason,'used');assert.equal(result.state,state);
});
test('five successful checks wins and is perfect',()=>{
  const state=solve();assert.equal(state.status,'won');assert.equal(state.attempts,5);assert.equal(isPerfect(state),true);
});
test('a mistake before a solve keeps its check cost and prevents perfect',()=>{
  const state=solve(submitPair(puzzle,createGame(puzzle),{row:0,tileIds:['a','d']}).state);assert.equal(state.attempts,6);assert.equal(isPerfect(state),false);
});
test('hints reveal only the chosen relationship, once per row',()=>{
  const first=useHint(puzzle,createGame(puzzle),3);assert.deepEqual(first.hint,{row:3,relationship:puzzle.rows[3].relationship});assert.equal(first.changed,true);assert.deepEqual(first.state.hintedRows,[3]);assert.equal(first.state.attempts,0);
  const again=useHint(puzzle,first.state,3);assert.equal(again.changed,false);assert.equal(again.state,first.state);assert.deepEqual(again.hint,first.hint);
  const next=useHint(puzzle,first.state,0);assert.deepEqual(next.state.hintedRows,[3,0]);assert.equal(isPerfect(solve(next.state)),false);
});
test('invalid, solved, and terminal rows cannot add hints',()=>{
  const state=submitPair(puzzle,createGame(puzzle),{row:0,tileIds:['a','b']}).state;
  for(const row of [-1,5,'1',0,null])assert.equal(useHint(puzzle,state,row).hint,null);
  assert.equal(useHint(puzzle,solve(),0).hint,null);
});
test('reveal fills the remaining board and preserves costs without awarding a win',()=>{
  const start=useHint(puzzle,createGame(puzzle),1).state;
  const state=revealGame(puzzle,start);assert.equal(state.status,'revealed');assert.deepEqual(state.placements,puzzle.rows.map(row=>row.answer));assert.equal(state.attempts,0);assert.deepEqual(state.hintedRows,[1]);assert.equal(isPerfect(state),false);assert.ok(start.placements.every(x=>x===null));
});
test('won and revealed results are terminal for all mutations',()=>{
  for(const state of [solve(),revealGame(puzzle,createGame(puzzle))]) {
    assert.equal(submitPair(puzzle,state,{row:0,tileIds:['a','b']}).reason,'finished');assert.equal(useHint(puzzle,state,1).state,state);assert.equal(revealGame(puzzle,state),state);
  }
});
test('valid unfinished save restores independent arrays',()=>{
  const original=useHint(puzzle,submitPair(puzzle,createGame(puzzle),{row:1,tileIds:['c','d']}).state,2).state;
  const restored=restoreGame(puzzle,original);assert.deepEqual(restored,original);assert.notEqual(restored.placements,original.placements);assert.notEqual(restored.placements[1],original.placements[1]);assert.notEqual(restored.hintedRows,original.hintedRows);
});
test('placements determine a win rather than trusting saved status',()=>{
  assert.equal(restoreGame(puzzle,{...solve(),status:'playing'}).status,'won');
  const state=createGame(puzzle);assert.equal(restoreGame(puzzle,{...state,status:'won'}).status,'playing');
});
test('a revealed save remains revealed on reload',()=>{
  const state=revealGame(puzzle,createGame(puzzle));assert.deepEqual(restoreGame(puzzle,state),state);
});
test('bad counters, hints, puzzle ids and placement shapes reset safely',()=>{
  const fresh=createGame(puzzle);
  const bads=[null,[],{}, {...fresh,puzzleId:'other'},{...fresh,status:'lost'},{...fresh,attempts:-1},{...fresh,attempts:0.2},{...fresh,attempts:Infinity},{...fresh,attempts:Number.MAX_SAFE_INTEGER+1},{...fresh,hintedRows:[0,0]},{...fresh,hintedRows:[5]},{...fresh,hintedRows:['1']},{...fresh,hintedRows:1},{...fresh,placements:[]},{...fresh,placements:[['a','d'],null,null,null,null]},{...fresh,placements:[['b','a'],null,null,null,null]},{...fresh,placements:[['a','b'],null,null,null,null]},{...fresh,status:'revealed'}];
  for(const raw of bads)assert.deepEqual(restoreGame(puzzle,raw),fresh);
});
test('date boundary follows Chicago, including daylight and standard time',()=>{
  assert.equal(EPOCH,'2026-10-20');assert.equal(getDateKey(new Date('2026-10-20T04:59:59Z')),'2026-10-19');assert.equal(getDateKey(new Date('2026-10-20T05:00:00Z')),'2026-10-20');assert.equal(getDateKey(new Date('2026-11-02T05:59:59Z')),'2026-11-01');assert.equal(getDateKey(new Date('2026-11-02T06:00:00Z')),'2026-11-02');
});
test('daily numbering advances by calendar days and cycles safely before the epoch',()=>{
  assert.equal(getDayNumber(EPOCH),1);assert.equal(getDayNumber('2026-11-02'),14);assert.ok(Number.isNaN(getDayNumber('2026-02-30')));
  const list=[{id:'first'},{id:'second'},{id:'third'}];assert.equal(getDaily(list,new Date('2026-10-23T12:00:00Z')).puzzle.id,'first');assert.equal(getDaily(list,new Date('2026-10-19T12:00:00Z')).puzzle.id,'third');assert.throws(()=>getDaily([],new Date()),RangeError);
});
test('stats count reveals as played, wins separately, and perfect only without help',()=>{
  const stats=getStats({'2026-10-18':record(),'2026-10-19':record('revealed',2,1),'2026-10-20':record('won',7,1)},'2026-10-20');
  assert.deepEqual(stats,{played:3,won:2,streak:1,bestStreak:1,perfect:1,averageAttempts:6});
});
test('streak survives an unfinished today but ends on a reveal or missed day',()=>{
  const records={'2026-10-18':record(),'2026-10-19':record()};assert.equal(getStats(records,'2026-10-20').streak,2);assert.equal(getStats(records,'2026-10-21').streak,0);assert.equal(getStats({...records,'2026-10-20':record('revealed',0)},'2026-10-20').streak,0);
});
test('stats ignore impossible, malformed, and future records',()=>{
  const records={'bad':record(),'2026-02-30':record(),'2026-10-16':record('won',4),'2026-10-17':record('won',5,6),'2026-10-18':record('playing',5),'2026-10-19':record('won',5,0),'2026-10-21':record()};assert.deepEqual(getStats(records,'2026-10-20'),{played:1,won:1,streak:1,bestStreak:1,perfect:1,averageAttempts:5});assert.equal(getStats(null,EPOCH).played,0);
});
test('share text contains progress and scoring without answer or clue spoilers',()=>{
  const text=formatShare(puzzle,solve(),{number:4,url:'https://example.test/'});assert.match(text,/COUNTERPART #004/);assert.match(text,/🟩🟩🟩🟩🟩/);assert.match(text,/5 checks · 0 hints · Perfect/);for(const tile of puzzle.tiles)assert.ok(!text.includes(tile.word));assert.ok(!text.includes('ACORN'));assert.ok(text.endsWith('https://example.test/'));
});
test('share distinguishes practice, hinted solves and reveals',()=>{
  const hinted=solve(useHint(puzzle,createGame(puzzle),2).state);const text=formatShare(puzzle,hinted,{mode:'practice'});assert.match(text,/COUNTERPART Practice/);assert.match(text,/1 hint/);assert.ok(!text.includes('Perfect'));assert.match(formatShare(puzzle,revealGame(puzzle,createGame(puzzle))),/Revealed/);
});
