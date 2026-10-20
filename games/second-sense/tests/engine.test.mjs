import test from 'node:test';
import assert from 'node:assert/strict';
import { EPOCH, getDateKey, getDayNumber, getDaily, createGame, normalizeWord, submitPair, useHint, revealGame, restoreGame, isPerfect, getStats, formatShare } from '../engine.mjs';

const words=['FENCE','BARK','WIND','TENDER','COURT'];
const puzzle={id:'fixture',title:'Two readings',difficulty:'Tricky',nouns:words.map((word,i)=>({id:`n${i}`,clue:`Noun clue ${i}`})),verbs:words.map((word,i)=>({id:`v${i}`,clue:`Verb clue ${i}`})),pairs:words.map((word,i)=>({nounId:`n${i}`,verbId:`v${i}`,word,answers:[word],explanation:`Two different meanings of ${word}.`,sourceId:`word-${i}`}))};
const solve=(state=createGame(puzzle))=>puzzle.pairs.reduce((s,p)=>s.placements.some(x=>x.nounId===p.nounId)?s:submitPair(puzzle,s,p).state,state);
const record=(status='won',attempts=5,hints=0)=>({status,attempts,hints,puzzleId:'fixture'});

test('new game has no locked clues, checks or hints',()=>assert.deepEqual(createGame(puzzle),{puzzleId:'fixture',placements:[],attempts:0,hintedNouns:[],status:'playing'}));
test('normalization accepts case and surrounding spaces but requires a single word',()=>{
  assert.equal(normalizeWord('  fence  '),'FENCE');assert.equal(normalizeWord('WiNd'),'WIND');
  for(const value of [null,3,'','a','two words','wind-up','wind!','écho','ß','ſow','abcdefghijklmnopqrs'])assert.equal(normalizeWord(value),null);
});
test('correct word and paired clues lock both without mutating prior state',()=>{
  const state=createGame(puzzle),before=structuredClone(state);const result=submitPair(puzzle,state,{nounId:'n2',verbId:'v2',word:' wind '});
  assert.equal(result.accepted,true);assert.equal(result.changed,true);assert.equal(result.reason,null);assert.equal(result.word,'WIND');assert.deepEqual(result.state.placements,[{nounId:'n2',verbId:'v2',word:'WIND'}]);assert.equal(result.state.attempts,1);assert.deepEqual(state,before);
});
test('right word with wrong clue pairing costs one check and uses no cards',()=>{
  const result=submitPair(puzzle,createGame(puzzle),{nounId:'n0',verbId:'v1',word:'FENCE'});assert.equal(result.reason,'no-match');assert.equal(result.changed,true);assert.equal(result.state.attempts,1);assert.deepEqual(result.state.placements,[]);
});
test('right clue pairing with wrong word costs one check and uses no cards',()=>{
  const result=submitPair(puzzle,createGame(puzzle),{nounId:'n0',verbId:'v0',word:'HEDGE'});assert.equal(result.reason,'no-match');assert.equal(result.state.attempts,1);assert.deepEqual(result.state.placements,[]);
});
test('empty, malformed and unknown clue selections are unscored',()=>{
  const state=createGame(puzzle);
  for(const input of [null,[],{}, {nounId:'missing',verbId:'v0',word:'FENCE'},{nounId:'n0',verbId:'missing',word:'FENCE'},{nounId:'n0',verbId:'v0',word:''},{nounId:'n0',verbId:'v0',word:'two words'},{nounId:0,verbId:'v0',word:'FENCE'}]) {
    const result=submitPair(puzzle,state,input);assert.equal(result.reason,'invalid');assert.equal(result.changed,false);assert.equal(result.state,state);
  }
});
test('neither a solved noun nor a solved verb can be reused',()=>{
  const state=submitPair(puzzle,createGame(puzzle),puzzle.pairs[0]).state;
  for(const input of [{nounId:'n0',verbId:'v1',word:'BARK'},{nounId:'n1',verbId:'v0',word:'FENCE'},puzzle.pairs[0]]){const result=submitPair(puzzle,state,input);assert.equal(result.reason,'used');assert.equal(result.state,state);}
});
test('five solved pairs win with a perfect result',()=>{
  const state=solve();assert.equal(state.status,'won');assert.equal(state.placements.length,5);assert.equal(state.attempts,5);assert.equal(isPerfect(state),true);
});
test('a wrong check before solving stays in the total',()=>{
  const state=solve(submitPair(puzzle,createGame(puzzle),{nounId:'n0',verbId:'v1',word:'FENCE'}).state);assert.equal(state.attempts,6);assert.equal(isPerfect(state),false);
});
test('a hint reveals only first letter and length and counts once per noun',()=>{
  const first=useHint(puzzle,createGame(puzzle),'n3');assert.deepEqual(first.hint,{nounId:'n3',firstLetter:'T',length:6});assert.deepEqual(first.state.hintedNouns,['n3']);assert.equal(first.state.attempts,0);assert.equal(first.changed,true);assert.ok(!('verbId' in first.hint));
  const repeated=useHint(puzzle,first.state,'n3');assert.equal(repeated.state,first.state);assert.equal(repeated.changed,false);assert.deepEqual(repeated.hint,first.hint);assert.equal(isPerfect(solve(first.state)),false);
});
test('unknown, solved and terminal noun cards cannot add hints',()=>{
  const state=submitPair(puzzle,createGame(puzzle),puzzle.pairs[0]).state;
  for(const id of ['missing','n0',null,0])assert.equal(useHint(puzzle,state,id).hint,null);
  assert.equal(useHint(puzzle,solve(),'n1').hint,null);
});
test('reveal preserves checked work and costs without earning a win',()=>{
  const start=useHint(puzzle,submitPair(puzzle,createGame(puzzle),puzzle.pairs[2]).state,'n0').state;
  const state=revealGame(puzzle,start);assert.equal(state.status,'revealed');assert.equal(state.placements.length,5);assert.deepEqual(state.placements[0],start.placements[0]);assert.equal(state.attempts,1);assert.deepEqual(state.hintedNouns,['n0']);assert.equal(isPerfect(state),false);assert.equal(start.placements.length,1);
});
test('won and revealed boards cannot be modified',()=>{
  for(const state of [solve(),revealGame(puzzle,createGame(puzzle))]){assert.equal(submitPair(puzzle,state,puzzle.pairs[0]).reason,'finished');assert.equal(useHint(puzzle,state,'n0').state,state);assert.equal(revealGame(puzzle,state),state);}
});
test('explicit valid alternative words are accepted and survive restoration',()=>{
  const alternative=structuredClone(puzzle);alternative.pairs[0]={...alternative.pairs[0],word:'TAP',answers:['TAP','RAP']};alternative.nouns[0].clue='A light knock';alternative.verbs[0].clue='Knock lightly';
  const state=submitPair(alternative,createGame(alternative),{nounId:'n0',verbId:'v0',word:'rap'}).state;assert.equal(state.placements[0].word,'RAP');assert.deepEqual(restoreGame(alternative,state),state);
});
test('unfinished saves restore independent placement and hint arrays',()=>{
  const original=useHint(puzzle,submitPair(puzzle,createGame(puzzle),puzzle.pairs[3]).state,'n0').state;
  const restored=restoreGame(puzzle,original);assert.deepEqual(restored,original);assert.notEqual(restored.placements,original.placements);assert.notEqual(restored.placements[0],original.placements[0]);assert.notEqual(restored.hintedNouns,original.hintedNouns);
});
test('actual solved pairs determine whether a non-revealed save is won',()=>{
  assert.equal(restoreGame(puzzle,{...solve(),status:'playing'}).status,'won');assert.equal(restoreGame(puzzle,{...createGame(puzzle),status:'won'}).status,'playing');
});
test('revealed saves remain revealed after reload',()=>{
  const state=revealGame(puzzle,createGame(puzzle));assert.deepEqual(restoreGame(puzzle,state),state);
});
test('malformed counters, hints, duplicate cards and wrong answers reset safely',()=>{
  const fresh=createGame(puzzle),one={nounId:'n0',verbId:'v0',word:'FENCE'};
  for(const raw of [null,[],{}, {...fresh,puzzleId:'other'},{...fresh,status:'lost'},{...fresh,attempts:-1},{...fresh,attempts:1.5},{...fresh,attempts:Infinity},{...fresh,hintedNouns:['n0','n0']},{...fresh,hintedNouns:['missing']},{...fresh,hintedNouns:0},{...fresh,placements:null},{...fresh,placements:[one]},{...fresh,attempts:2,placements:[one,one]},{...fresh,attempts:1,placements:[{...one,word:'HEDGE'}]},{...fresh,attempts:1,placements:[{...one,verbId:'v1'}]},{...fresh,status:'revealed'}])assert.deepEqual(restoreGame(puzzle,raw),fresh);
});
test('date boundary follows Chicago daylight and standard time',()=>{
  assert.equal(EPOCH,'2026-10-20');assert.equal(getDateKey(new Date('2026-10-20T04:59:59Z')),'2026-10-19');assert.equal(getDateKey(new Date('2026-10-20T05:00:00Z')),'2026-10-20');assert.equal(getDateKey(new Date('2026-11-02T05:59:59Z')),'2026-11-01');assert.equal(getDateKey(new Date('2026-11-02T06:00:00Z')),'2026-11-02');
});
test('daily selection cycles by calendar day and rejects missing collections',()=>{
  assert.equal(getDayNumber(EPOCH),1);assert.equal(getDayNumber('2026-11-02'),14);assert.ok(Number.isNaN(getDayNumber('2026-02-30')));
  const list=[{id:'a'},{id:'b'},{id:'c'}];assert.equal(getDaily(list,new Date('2026-10-23T12:00:00Z')).puzzle.id,'a');assert.equal(getDaily(list,new Date('2026-10-19T12:00:00Z')).puzzle.id,'c');assert.throws(()=>getDaily([]),RangeError);
});
test('stats separate reveals from wins and preserve yesterday streak until today ends',()=>{
  const records={'2026-10-18':record(),'2026-10-19':record('won',7,1)};assert.deepEqual(getStats(records,'2026-10-20'),{played:2,won:2,streak:2,bestStreak:2,perfect:1,averageAttempts:6});assert.equal(getStats({...records,'2026-10-20':record('revealed',0)},'2026-10-20').streak,0);
});
test('stats reject impossible, corrupt and future entries',()=>{
  const records={'bad':record(),'2026-02-30':record(),'2026-10-16':record('won',4),'2026-10-17':record('won',5,6),'2026-10-18':record('playing',5),'2026-10-19':record(),'2026-10-21':record()};assert.deepEqual(getStats(records,'2026-10-20'),{played:1,won:1,streak:1,bestStreak:1,perfect:1,averageAttempts:5});assert.equal(getStats(null,EPOCH).played,0);
});
test('sharing includes checks and completion without revealing words or clues',()=>{
  const text=formatShare(puzzle,solve(),{number:7,url:'https://example.test/'});assert.match(text,/SECOND SENSE #007/);assert.match(text,/🟩🟩🟩🟩🟩/);assert.match(text,/5 checks · 0 hints · Perfect/);for(const word of words)assert.ok(!text.includes(word));assert.ok(text.endsWith('https://example.test/'));
});
test('sharing labels practice, assisted results and reveals distinctly',()=>{
  const hinted=solve(useHint(puzzle,createGame(puzzle),'n0').state);assert.match(formatShare(puzzle,hinted,{mode:'practice'}),/SECOND SENSE Practice/);assert.match(formatShare(puzzle,hinted),/1 hint/);assert.ok(!formatShare(puzzle,hinted).includes('Perfect'));assert.match(formatShare(puzzle,revealGame(puzzle,createGame(puzzle))),/Revealed/);
});
