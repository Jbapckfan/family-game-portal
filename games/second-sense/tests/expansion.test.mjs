import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

const key = p => p.pairs.map(pair => pair.word).sort().join('|');

test('at least 180 substantive challenges are available; permutations do not increase the count', () => {
  assert.ok(new Set(PUZZLES.map(key)).size >= 180, 'Need at least 180 different challenges');
  const seen = new Set(PUZZLES.slice(0, 30).map(key));
  for (const puzzle of PUZZLES.slice(30)) {
    assert.ok(!seen.has(key(puzzle)), `${puzzle.id} repeats an earlier challenge`);
    seen.add(key(puzzle));
  }
});

test('every previously published puzzle retains its exact content, IDs, and position', () => {
  const digest = createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 30))).digest('hex');
  assert.equal(digest, '0e6382c4eda4c941681f4155f49447b8c362e9b6bf336f6283112c5c0e375eb9');
});

test('the launch dates keep their daily identities after the bank grows', () => {
  for (let offset = 0; offset < 3; offset++) {
    const day = new Date(Date.UTC(2026, 9, 20 + offset, 18));
    const today = getDaily(PUZZLES, day);
    assert.equal(today.puzzle.id, PUZZLES[offset].id);
    assert.equal(today.number, offset + 1);
  }
});


test('every added board changes at least three of its five questions', () => {
  for (let index = 30; index < PUZZLES.length; index++) {
    const questions = new Set(PUZZLES[index].pairs.map(row => row.sourceId));
    for (const earlier of PUZZLES.slice(0, index)) {
      assert.ok(earlier.pairs.filter(row => questions.has(row.sourceId)).length <= 2,
        `${PUZZLES[index].id} repeats too much of ${earlier.id}`);
    }
  }
});

test('offline generation exactly reproduces the additional combinations', async () => {
  const { generateBoards } = await import('../scripts/generate-puzzles.mjs');
  const { ADDITIONAL_BOARDS } = await import('../puzzles.mjs');
  assert.deepEqual(generateBoards(), ADDITIONAL_BOARDS);
});
