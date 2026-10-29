import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

// Legal moves depend on neighboring inequalities, not the printed magnitudes.
function key(board) {
  const variants = [];
  for (let reflected = 0; reflected < 2; reflected++) for (let turns = 0; turns < 4; turns++) {
    const transform = cell => {
      let row = Math.floor(cell / 4), col = cell % 4;
      if (reflected) col = 3 - col;
      for (let n = 0; n < turns; n++) [row, col] = [col, 3 - row];
      return row * 4 + col;
    };
    const values = [];
    board.values.forEach((value, cell) => { values[transform(cell)] = value; });
    const comparisons = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const at = row * 4 + col;
      if (col < 3) comparisons.push(values[at] < values[at + 1] ? 1 : 0);
      if (row < 3) comparisons.push(values[at] < values[at + 4] ? 1 : 0);
    }
    variants.push(JSON.stringify([transform(board.start), transform(board.end), comparisons]));
  }
  return variants.sort()[0];
}

test('at least 210 substantive challenges are available; permutations do not increase the count', () => {
  assert.ok(new Set(PUZZLES.map(key)).size >= 210, 'Need at least 210 different challenges');
  const seen = new Set(PUZZLES.slice(0, 90).map(key));
  for (const puzzle of PUZZLES.slice(90)) {
    assert.ok(!seen.has(key(puzzle)), `${puzzle.id} repeats an earlier challenge`);
    seen.add(key(puzzle));
  }
});

test('every previously published puzzle retains its exact content, IDs, and position', () => {
  const digest = createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 90))).digest('hex');
  assert.equal(digest, '3ebf6991c5b527c674db1d127217241d8ef1ff0491ae0debd7db375c5f75ffba');
});

test('published daily dates through October 29 keep their identities after the bank grows', () => {
  for (let offset = 0; offset < 10; offset++) {
    const day = new Date(Date.UTC(2026, 9, 20 + offset, 18));
    const today = getDaily(PUZZLES, day);
    assert.equal(today.puzzle.id, PUZZLES[offset].id);
    assert.equal(today.number, offset + 1);
  }
});

test('October 29 expansion preserves every previously published record', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 187))).digest('hex'), '6be9368a99f036f8951b77079c0ff0812320a80801c6387fbab24975ea15d6b1');
});
