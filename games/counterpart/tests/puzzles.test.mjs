import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, COLLECTION } from '../puzzles.mjs';
import { createGame, submitPair, useHint, revealGame, restoreGame, isPerfect } from '../engine.mjs';

test('collection contains 180 distinct curated combinations and ninety distinct analogies',()=>{
  assert.equal(PUZZLES.length,180);assert.equal(new Set(PUZZLES.map(p=>p.id)).size,180);
  assert.equal(COLLECTION.uniqueAnalogies,90);assert.equal(COLLECTION.totalRowAppearances,900);
  assert.equal(new Set(PUZZLES.flatMap(p=>p.rows.map(r=>r.sourceId))).size,90);
  assert.equal(new Set(PUZZLES.map(p=>p.rows.map(r=>r.sourceId).sort().join('|'))).size,180);
});
test('each board has five explained directed relationships and ten distinct words',()=>{
  for(const puzzle of PUZZLES) {
    assert.equal(puzzle.rows.length,5,puzzle.id);assert.equal(puzzle.tiles.length,10,puzzle.id);
    assert.equal(new Set(puzzle.tiles.map(t=>t.id)).size,10,puzzle.id);assert.equal(new Set(puzzle.tiles.map(t=>t.word)).size,10,puzzle.id);
    assert.equal(new Set(puzzle.rows.flatMap(r=>r.answer)).size,10,puzzle.id);
    assert.equal(new Set(puzzle.rows.map(r=>r.relationship)).size,5,puzzle.id);
    for(const tile of puzzle.tiles)assert.match(tile.word,/^[A-Z]+$/,`${puzzle.id}: ${tile.word}`);
    for(const row of puzzle.rows) {
      assert.equal(row.cue.length,2);assert.notEqual(row.cue[0],row.cue[1]);assert.equal(row.answer.length,2);assert.notEqual(row.answer[0],row.answer[1]);
      assert.ok(row.answer.every(id=>puzzle.tiles.some(t=>t.id===id)),puzzle.id);
      assert.ok(row.relationship.includes('→'),row.relationship);assert.ok(row.explanation.length>=45,puzzle.id);
      for(const word of row.cue)assert.match(word,/^[A-Z]+$/);
    }
  }
});
test('curated analogies recur in new combinations with no close daily repeat',()=>{
  const appearances=new Map();
  PUZZLES.forEach((p,i)=>p.rows.forEach(row=>appearances.set(row.sourceId,[...(appearances.get(row.sourceId)||[]),i])));
  for(const [id,days] of appearances) {
    assert.ok(days.length >= 1, id);
    for(let at=0;at<days.length;at++) {
      const gap=(days[(at+1)%days.length]-days[at]+PUZZLES.length)%PUZZLES.length;
      assert.ok(gap>=6,`${id}: ${days}`);
    }
  }
});
test('all prepared puzzles can finish from all thirty-two solved-row subsets',()=>{
  let states=0;
  for(const puzzle of PUZZLES)for(let mask=0;mask<32;mask++) {
    let state=createGame(puzzle);
    for(let row=0;row<5;row++)if(mask&(1<<row))state=submitPair(puzzle,state,{row,tileIds:puzzle.rows[row].answer}).state;
    state=restoreGame(puzzle,JSON.parse(JSON.stringify(state)));
    for(let row=4;row>=0;row--)if(!state.placements[row]) {
      const result=submitPair(puzzle,state,{row,tileIds:puzzle.rows[row].answer});assert.equal(result.accepted,true,`${puzzle.id} row ${row}`);state=result.state;
    }
    assert.equal(state.status,'won');assert.equal(state.attempts,5);assert.equal(isPerfect(state),true);states++;
  }
  assert.equal(states,PUZZLES.length*32);
});
test('all ninety ordered bank pairs have exactly one scored solution per row',()=>{
  for(const puzzle of PUZZLES)for(let row=0;row<5;row++) {
    let accepted=0;
    for(const a of puzzle.tiles)for(const b of puzzle.tiles)if(a.id!==b.id) {
      const result=submitPair(puzzle,createGame(puzzle),{row,tileIds:[a.id,b.id]});assert.equal(result.state.attempts,1);
      if(result.accepted)accepted++;
    }
    assert.equal(accepted,1,`${puzzle.id} row ${row}`);
  }
});
test('every board supports all relationship hints and a recoverable reveal',()=>{
  for(const puzzle of PUZZLES) {
    let state=createGame(puzzle);
    for(let row=0;row<5;row++) { const result=useHint(puzzle,state,row);assert.equal(result.hint.relationship,puzzle.rows[row].relationship);state=result.state; }
    assert.equal(state.hintedRows.length,5);assert.equal(state.attempts,0);
    state=revealGame(puzzle,state);assert.equal(state.status,'revealed');assert.deepEqual(restoreGame(puzzle,state),state);assert.equal(isPerfect(state),false);
  }
});
