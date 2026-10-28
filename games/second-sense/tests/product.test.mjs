import {test} from 'node:test';import assert from 'node:assert/strict';
import {PUZZLES} from '../puzzles.mjs';import * as engine from '../engine.mjs';
test('wrong-pair coaching follows the submitted word and chosen clues, preserving one check',()=>{
 const puzzle=PUZZLES[0],state=engine.createGame(puzzle),[a,b]=puzzle.pairs;
 for(const [selection,feedback] of [
  [{nounId:a.nounId,verbId:b.verbId,word:a.word},'noun-only'],
  [{nounId:b.nounId,verbId:a.verbId,word:a.word},'verb-only'],
  [{nounId:a.nounId,verbId:a.verbId,word:'ZZZZZZ'},'pair-only'],
  [{nounId:a.nounId,verbId:b.verbId,word:'ZZZZZZ'},'mismatch'],
 ]){
  const result=engine.submitPair(puzzle,state,selection);assert.equal(result.feedback,feedback);assert.equal(result.state.attempts,1);assert.deepEqual(result.state.placements,[]);assert.deepEqual(result.state.hintedNouns,[]);assert.deepEqual(engine.restoreGame(puzzle,result.state),result.state);
 }
 assert.equal(engine.submitPair(puzzle,state,{...a,word:''}).changed,false);
});
