import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../puzzles.mjs';

import { substantiveKey } from '../content-identity.mjs';

function presentations(puzzle) {
  const remapped=new Map(puzzle.tiles.map((tile,index)=>[tile.id,`renamed-${index}`]));
  return [{...puzzle,rows:[...puzzle.rows].reverse().map(row=>({...row,sourceId:'changed-source-id',id:'changed-row-id',answer:row.answer.map(id=>remapped.get(id))})),
    tiles:[...puzzle.tiles].reverse().map(tile=>({...tile,id:remapped.get(tile.id)}))}];
}

test('the schedule identity exposes at least 210 substantive challenges', () => {
  assert.equal(typeof substantiveKey,'function','the schedule needs a canonical substantive identity');
  const keys=PUZZLES.map(substantiveKey);
  assert.ok(keys.every(key=>typeof key==='string'&&key.length>0));
  assert.equal(new Set(keys).size,210);
});

test('renaming a puzzle cannot create a fresh daily challenge', () => {
  assert.equal(typeof substantiveKey,'function');
  for(const puzzle of PUZZLES) assert.equal(substantiveKey({...puzzle,id:'changed-id',title:'Changed title',difficulty:'Different label'}),substantiveKey(puzzle));
});

test('equivalent puzzle presentations keep the same schedule identity', () => {
  assert.equal(typeof substantiveKey,'function');
  for(const puzzle of PUZZLES) for(const equivalent of presentations(puzzle)) assert.equal(substantiveKey(equivalent),substantiveKey(puzzle),puzzle.id);
});
