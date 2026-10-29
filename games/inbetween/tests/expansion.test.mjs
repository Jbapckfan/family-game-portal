import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

const key = p => p.rows.map(row => `${row.seed}:${row.answer}`).sort().join('|');

test('at least 210 substantive challenges are available; permutations do not increase the count', () => {
  assert.ok(new Set(PUZZLES.map(key)).size >= 210, 'Need at least 210 different challenges');
  const seen = new Set(PUZZLES.slice(0, 60).map(key));
  for (const puzzle of PUZZLES.slice(60)) {
    assert.ok(!seen.has(key(puzzle)), `${puzzle.id} repeats an earlier challenge`);
    seen.add(key(puzzle));
  }
});

test('every previously published puzzle retains its exact content, IDs, and position', () => {
  const digest = createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 60))).digest('hex');
  assert.equal(digest, '2f4fac98e7007903f237d073359dcbaecbfe074e8edd4c258ca6770213d6048a');
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
  assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 180))).digest('hex'), 'eee07e7e22fdced4c94de06754a04f19dd51eefa426668505d23be1d69b27750');
});

test('new boards replace substantial content, not only order or presentation', () => {
  const entries = puzzle => puzzle.rows.map(row => `${row.seed}:${row.answer}`);
  for (let index = 180; index < PUZZLES.length; index++) {
    const current = new Set(entries(PUZZLES[index]));
    for (const earlier of PUZZLES.slice(0, index)) {
      assert.ok(entries(earlier).filter(value => current.has(value)).length <= 3,
        `${PUZZLES[index].id} is too similar to ${earlier.id}`);
    }
  }
});
