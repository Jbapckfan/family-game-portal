import {test} from 'node:test';import assert from 'node:assert/strict';
import {PUZZLES} from '../puzzles.mjs';import * as engine from '../engine.mjs';
test('reversed submitted pair is coached precisely without revealing a different row',()=>{
 const puzzle=PUZZLES[0],state=engine.createGame(puzzle),row=puzzle.rows[0];
 const result=engine.submitPair(puzzle,state,{row:0,tileIds:[...row.answer].reverse()});
 assert.equal(result.feedback,'reverse');assert.equal(result.state.attempts,1);assert.equal(result.state.hintedRows.length,0);assert.ok(result.state.placements.every(x=>x===null));
 assert.equal(engine.submitPair(puzzle,state,{row:0,tileIds:puzzle.rows[1].answer}).feedback,'relationship');
 assert.deepEqual(engine.restoreGame(puzzle,result.state),result.state);
});
