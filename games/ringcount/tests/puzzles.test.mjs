import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLES} from '../puzzles.mjs';
import {generatePuzzles} from '../scripts/generate-puzzles.mjs';
import {createGame, toggleCut, checkBoard, useHint, restoreGame, getSegments, solvePuzzle} from '../engine.mjs';

function canonical(numbers) {
  const variants = [];
  for (const ring of [numbers, [...numbers].reverse()])
    for (let offset = 0; offset < ring.length; offset++)
      variants.push([...ring.slice(offset), ...ring.slice(0, offset)].join(','));
  return variants.sort()[0];
}

const cutSets = [];
for (let a = 0; a < 9; a++) for (let b = a + 1; b < 10; b++)
  for (let c = b + 1; c < 11; c++) for (let d = c + 1; d < 12; d++) cutSets.push([a, b, c, d]);

function referenceSolutions(puzzle) {
  const prefix = [0];
  for (const value of puzzle.numbers) prefix.push(prefix.at(-1) + value);
  return cutSets.filter(cuts => {
    const boundaries = cuts.map(gap => gap + 1);
    return boundaries.every((end, index) => {
      const start = boundaries[(index + 3) % 4];
      return (end > start ? prefix[end] - prefix[start]
        : prefix[12] - prefix[start] + prefix[end]) === puzzle.target;
    });
  });
}

test('180 distinct boards use small numbers, varied arc lengths, and rotation/reflection deduplication', () => {
  assert.equal(PUZZLES.length, 180);
  assert.equal(new Set(PUZZLES.map(p => p.id)).size, 180);
  assert.equal(new Set(PUZZLES.map(p => canonical(p.numbers))).size, 180);
  assert.deepEqual(new Set(PUZZLES.map(p => p.target)), new Set([15, 16, 17, 18]));
  for (const puzzle of PUZZLES) {
    assert.equal(puzzle.sections, 4);
    assert.equal(puzzle.numbers.length, 12);
    assert.ok(puzzle.numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 9));
    assert.equal(puzzle.numbers.reduce((sum, n) => sum + n, 0), puzzle.target * 4);
    assert.ok(new Set(getSegments(puzzle, puzzle.solution).map(s => s.indices.length)).size >= 2);
    assert.ok(puzzle.decoyArcs >= 2);
  }
});

test('an independent prefix-sum validator checks all 89,100 cut sets and proves one solution per board', () => {
  assert.equal(PUZZLES.length, 180);
  assert.equal(cutSets.length, 495);
  for (const puzzle of PUZZLES) {
    const reference = referenceSolutions(puzzle);
    assert.deepEqual(reference, [puzzle.solution], puzzle.id);
    assert.deepEqual(solvePuzzle(puzzle), reference, puzzle.id);
  }
});

test('every complete placement is recoverable with at most four hints and an explicit winning check', () => {
  assert.equal(PUZZLES.length, 180);
  for (const puzzle of PUZZLES) for (const cuts of cutSets) {
    let state = createGame(puzzle);
    for (const gap of cuts) state = toggleCut(puzzle, state, gap).state;
    state = checkBoard(puzzle, state).state;
    if (state.status === 'won') continue;
    const initialCorrect = cuts.filter(gap => puzzle.solution.includes(gap));
    for (let i = 0; i < 4; i++) {
      const result = useHint(puzzle, state);
      if (!result.changed) break;
      state = result.state;
      assert.ok(initialCorrect.every(gap => state.cuts.includes(gap)), puzzle.id);
      assert.equal(state.status, 'playing');
    }
    assert.ok(state.hints <= 4, puzzle.id);
    assert.deepEqual(restoreGame(puzzle, state), state, puzzle.id);
    state = checkBoard(puzzle, state).state;
    assert.equal(state.status, 'won', `${puzzle.id} from ${cuts}`);
    assert.deepEqual(restoreGame(puzzle, state), state, puzzle.id);
  }
});

test('the deterministic generator reproduces the checked-in collection exactly', () => {
  assert.equal(PUZZLES.length, 180);
  assert.deepEqual(generatePuzzles(), PUZZLES);
});
