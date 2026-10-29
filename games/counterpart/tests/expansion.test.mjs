import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PUZZLES } from '../puzzles.mjs';
import { getDaily } from '../engine.mjs';

const key = p => p.rows.map(row => row.sourceId).sort().join('|');

test('at least 210 substantive challenges are available; permutations do not increase the count', () => {
  assert.ok(new Set(PUZZLES.map(key)).size >= 210, 'Need at least 210 different challenges');
  const seen = new Set(PUZZLES.slice(0, 30).map(key));
  for (const puzzle of PUZZLES.slice(30)) {
    assert.ok(!seen.has(key(puzzle)), `${puzzle.id} repeats an earlier challenge`);
    seen.add(key(puzzle));
  }
});

test('every previously published puzzle retains its exact content, IDs, and position', () => {
  const digest = createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 30))).digest('hex');
  assert.equal(digest, '3e36a6a84d2f1998812c2dea7549b6fe354f742fe95ba3d513a508a2cfc5026b');
});

test('published daily dates through October 29 keep their identities after the bank grows', () => {
  for (let offset = 0; offset < 10; offset++) {
    const day = new Date(Date.UTC(2026, 9, 20 + offset, 18));
    const today = getDaily(PUZZLES, day);
    assert.equal(today.puzzle.id, PUZZLES[offset].id);
    assert.equal(today.number, offset + 1);
  }
});


test('every added board changes at least three of its five questions', () => {
  for (let index = 30; index < PUZZLES.length; index++) {
    const questions = new Set(PUZZLES[index].rows.map(row => row.sourceId));
    for (const earlier of PUZZLES.slice(0, index)) {
      assert.ok(earlier.rows.filter(row => questions.has(row.sourceId)).length <= 2,
        `${PUZZLES[index].id} repeats too much of ${earlier.id}`);
    }
  }
});

test('offline generation exactly reproduces the additional combinations', async () => {
  const { generateBoards } = await import('../scripts/generate-puzzles.mjs');
  const { ADDITIONAL_BOARDS } = await import('../puzzles.mjs');
  assert.deepEqual(generateBoards(), ADDITIONAL_BOARDS);
});

test('new boards avoid interchangeable answer pairs from the same relationship family', () => {
  // Labels use different wording, but the ordered target pairs could be swapped
  // without breaking these analogies. Distinct labels alone are insufficient.
  const families = [
    [1, 14, 24, 78], // development
    [2, 13, 28, 44, 84, 88], // coveringProtection
    [3, 23, 38, 69], // instrumentInformation
    [4, 9, 12, 33, 42, 48, 53, 55, 63, 66, 81, 87, 90], // causeEffectOrEvidence
    [5, 26, 80], // creatorCreation
    [8, 20, 22, 31, 32, 35, 36, 49, 54, 58, 64, 68, 77, 84], // partWholeOrCollection
    [10, 25, 65, 75, 83], // practitionerMaterialOrTool
    [11, 19, 46, 52, 59, 67, 71], // entityFunction
    [16, 77], // unitQuantity
    [17, 73, 87], // materialProduct
    [18, 80], // residentHome
    [21, 29, 40, 47, 57, 74], // actionObject
    [27, 51], // routeTraveler
    [34, 61, 85], // suppressionRemoval
    [37, 79], // perception
    [7, 25, 55, 60, 90], // permissionRequestFulfillment
    [39, 48, 62, 63, 69, 86], // informationConclusion
  ];
  for (const puzzle of PUZZLES.slice(30)) {
    const entries = new Set(puzzle.rows.map(row => Number(row.sourceId.slice('analogy-'.length))));
    for (const family of families) {
      assert.ok(family.filter(entry => entries.has(entry)).length <= 1,
        `${puzzle.id}: interchangeable analogy family ${family}`);
    }
  }
});

test('October 29 expansion preserves every previously published record', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0, 180))).digest('hex'), '08076f67e777dd47c48c357aef787c812732444ceaf8d0b2b882bd4cb1350ba4');
});
