import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

const key = p => p.rows.map(row => `${row.start}:${row.answer}`).sort().join('|');

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
  assert.equal(digest, '1afe336ac738d19e4ffc4b961c141297b55c218ddb5242690994a85c3e525295');
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
  assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 180))).digest('hex'), '128c2beacff6faa6b108f910910bdeea475e902e0d99fb519c2d6553b63e92d3');
});

test('new boards replace substantial content, not only order or presentation', () => {
  const entries = puzzle => puzzle.rows.map(row => `${row.start}:${row.answer}`);
  for (let index = 180; index < PUZZLES.length; index++) {
    const current = new Set(entries(PUZZLES[index]));
    for (const earlier of PUZZLES.slice(0, index)) {
      assert.ok(entries(earlier).filter(value => current.has(value)).length <= 3,
        `${PUZZLES[index].id} is too similar to ${earlier.id}`);
    }
  }
});
