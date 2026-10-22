import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

const key = p => p.rows.map(row => `${row.seed}:${row.answer}`).sort().join('|');

test('at least 180 substantive challenges are available; permutations do not increase the count', () => {
  assert.ok(new Set(PUZZLES.map(key)).size >= 180, 'Need at least 180 different challenges');
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

test('the launch dates keep their daily identities after the bank grows', () => {
  for (let offset = 0; offset < 3; offset++) {
    const day = new Date(Date.UTC(2026, 9, 20 + offset, 18));
    const today = getDaily(PUZZLES, day);
    assert.equal(today.puzzle.id, PUZZLES[offset].id);
    assert.equal(today.number, offset + 1);
  }
});
