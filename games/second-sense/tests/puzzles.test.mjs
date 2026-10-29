import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, COLLECTION } from '../puzzles.mjs';
import { createGame, submitPair, useHint, revealGame, restoreGame, isPerfect } from '../engine.mjs';

test('collection has 210 distinct combinations from seventy-five original double meanings',()=>{
  assert.equal(PUZZLES.length,210);assert.equal(COLLECTION.uniqueWords,75);assert.equal(COLLECTION.totalPairAppearances,1050);
  assert.equal(new Set(PUZZLES.map(p=>p.id)).size,210);assert.equal(new Set(PUZZLES.flatMap(p=>p.pairs.map(x=>x.word))).size,75);
  assert.equal(new Set(PUZZLES.map(p=>p.pairs.map(x=>x.word).sort().join('|'))).size,210);
});
test('opening contains the three requested examples plus two less obvious shifts',()=>{
  assert.deepEqual(PUZZLES[0].pairs.map(p=>p.word),['FENCE','BARK','WIND','TENDER','COURT']);
  assert.match(PUZZLES[0].pairs.find(p=>p.word==='WIND').explanation,/pronunciation/i);
});
test('every board has five unique noun cards, verb cards and answer pairings',()=>{
  for(const p of PUZZLES) {
    assert.equal(p.nouns.length,5);assert.equal(p.verbs.length,5);assert.equal(p.pairs.length,5);
    assert.equal(new Set(p.nouns.map(x=>x.id)).size,5);assert.equal(new Set(p.verbs.map(x=>x.id)).size,5);assert.equal(new Set(p.pairs.map(x=>x.word)).size,5);
    assert.equal(new Set(p.pairs.map(x=>x.nounId)).size,5);assert.equal(new Set(p.pairs.map(x=>x.verbId)).size,5);
    for(const pair of p.pairs) {
      const noun=p.nouns.find(x=>x.id===pair.nounId),verb=p.verbs.find(x=>x.id===pair.verbId);assert.ok(noun&&verb,p.id);assert.match(pair.word,/^[A-Z]{2,18}$/);assert.ok(pair.answers.includes(pair.word));assert.ok(pair.explanation.length>30);
      for(const clue of [noun.clue,verb.clue]) { assert.ok(clue.length>=12&&clue.length<110,`${pair.word}: ${clue}`);assert.ok(!new RegExp(`\\b${pair.word}\\b`,'i').test(clue),`${pair.word} leaked into its clue`); }
    }
    const aligned=p.nouns.map(n=>p.pairs.find(x=>x.nounId===n.id).verbId).join('|');assert.notEqual(aligned,p.verbs.map(v=>v.id).join('|'),p.id);
  }
});
test('each word appears fourteen times with at least eleven boards between appearances including wrap',()=>{
  const appearances=new Map();PUZZLES.forEach((p,i)=>p.pairs.forEach(pair=>appearances.set(pair.word,[...(appearances.get(pair.word)||[]),i])));
  for(const [word,days] of appearances){
    assert.equal(days.length,14,word);
    for(let at=0;at<days.length;at++){const gap=(days[(at+1)%days.length]-days[at]+PUZZLES.length)%PUZZLES.length;assert.ok(gap>=11,`${word}: ${days}`);}
  }
});
test('all prepared puzzles can finish from every one of the thirty-two solved-pair subsets',()=>{
  let checked=0;
  for(const puzzle of PUZZLES)for(let mask=0;mask<32;mask++) {
    let state=createGame(puzzle);for(let i=0;i<5;i++)if(mask&(1<<i))state=submitPair(puzzle,state,puzzle.pairs[i]).state;
    state=restoreGame(puzzle,JSON.parse(JSON.stringify(state)));
    for(let i=4;i>=0;i--)if(!state.placements.some(x=>x.nounId===puzzle.pairs[i].nounId)){const result=submitPair(puzzle,state,puzzle.pairs[i]);assert.equal(result.accepted,true,puzzle.id);state=result.state;}
    assert.equal(state.status,'won');assert.equal(state.attempts,5);assert.equal(isPerfect(state),true);checked++;
  }
  assert.equal(checked,PUZZLES.length*32);
});
test('all noun/verb pairings accept only their encoded word from the full collection',()=>{
  const words=[...new Set(PUZZLES.flatMap(p=>p.pairs.flatMap(x=>x.answers)))];let accepted=0,checked=0;
  for(const puzzle of PUZZLES)for(const noun of puzzle.nouns)for(const verb of puzzle.verbs)for(const word of words) {
    const result=submitPair(puzzle,createGame(puzzle),{nounId:noun.id,verbId:verb.id,word});const expected=puzzle.pairs.some(p=>p.nounId===noun.id&&p.verbId===verb.id&&p.answers.includes(word));
    assert.equal(result.accepted,expected,`${puzzle.id} ${noun.id} ${verb.id} ${word}`);assert.equal(result.state.attempts,1);if(result.accepted)accepted++;checked++;
  }
  assert.equal(accepted,PUZZLES.length*5);assert.equal(checked,PUZZLES.length*25*75);
});
test('all hints identify only their noun answer initial and length, and reveals restore',()=>{
  for(const puzzle of PUZZLES) {
    let state=createGame(puzzle);
    for(const noun of puzzle.nouns) {const pair=puzzle.pairs.find(p=>p.nounId===noun.id);const result=useHint(puzzle,state,noun.id);assert.deepEqual(result.hint,{nounId:noun.id,firstLetter:pair.word[0],length:pair.word.length});state=result.state;}
    assert.equal(state.hintedNouns.length,5);assert.equal(state.attempts,0);state=revealGame(puzzle,state);assert.equal(state.status,'revealed');assert.deepEqual(restoreGame(puzzle,state),state);assert.equal(isPerfect(state),false);
  }
});
