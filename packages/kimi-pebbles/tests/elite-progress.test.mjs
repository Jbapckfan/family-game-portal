import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { restoreMorphProgress } from '../src/games/morph/progress.ts';
import { restoreHunchProgress } from '../src/games/hunch/progress.ts';
import { restoreCircuitProgress } from '../src/games/circuit/progress.ts';
import { restoreTangleProgress } from '../src/games/tangle/progress.ts';

const read = game => JSON.parse(readFileSync(new URL(`../src/games/${game}/data/puzzles.json`, import.meta.url), 'utf8'))[0];

test('Morph resumes an unfinished letter edit without accepting it as a rung', () => {
  const puzzle = { s: 'cold', t: 'warm', p: ['cold', 'cord', 'card', 'ward', 'warm'], par: 4 };
  const progress = { rows: ['cold'], edit: [...'cord'], misses: 2, hintsUsed: 0, finished: false, gaveUp: false, countedPlayed: true };
  const restored = restoreMorphProgress(progress, puzzle, () => true);
  assert.deepEqual(restored.edit, [...'cord']);
  assert.deepEqual(restored.rows, ['cold']);
  assert.equal(restored.misses, 2);
  for (const edit of [null, ['x'], [...'COld'], [1, 'o', 'l', 'd']]) {
    assert.deepEqual(restoreMorphProgress({ ...progress, edit }, puzzle, () => true).edit, [...'cold']);
  }
  assert.deepEqual(restoreMorphProgress({ ...progress, rows: puzzle.p, edit: [...'xxxx'], finished: true }, puzzle, () => true).edit, [...'warm']);
});

test('Hunch resumes partial typing but never treats draft text as a submitted guess', () => {
  const progress = { guesses: [], current: 'cra', hintLetters: [], hintsUsed: 0, countedPlayed: false };
  const restored = restoreHunchProgress(progress, 'crane', () => Array(5).fill('correct'), () => true);
  assert.equal(restored.current, 'cra');
  assert.deepEqual(restored.guesses, []);
  assert.equal(restored.finished, false);
  for (const current of [null, 'TOOLONG', 'crane!', 7]) {
    assert.equal(restoreHunchProgress({ ...progress, current }, 'crane', () => [], () => true).current, '');
  }
  assert.equal(restoreHunchProgress({ ...progress, guesses: ['crane'], current: 'other' }, 'crane', () => [], () => true).current, '');
});

test('Circuit restores a legal unfinished word including the auto-seeded chain letter', () => {
  const puzzle = read('circuit');
  const played = [puzzle.sol[0]];
  const current = [...puzzle.sol[1].slice(0, 3)].map(ch => puzzle.l.indexOf(ch));
  const progress = { played, current, revealed: 0, hintsUsed: 0, finished: false, gaveUp: false, countedPlayed: true };
  const restored = restoreCircuitProgress(progress, puzzle);
  assert.deepEqual(restored.current, current);
  assert.deepEqual(restored.played, played);
  for (const draft of [[99], [0, 0], [0.5], 'bad']) {
    assert.deepEqual(restoreCircuitProgress({ ...progress, current: draft }, puzzle).current, []);
  }
  const wrongStart = [...Array(12).keys()].find(i => puzzle.l[i] !== played[0].at(-1));
  assert.deepEqual(restoreCircuitProgress({ ...progress, current: [wrongStart] }, puzzle).current, []);
  assert.deepEqual(restoreCircuitProgress({ ...progress, played: puzzle.sol, current, finished: true }, puzzle).current, []);
});

test('Tangle keeps the consumed clue available after its transient toast and reload', () => {
  const puzzle = read('tangle');
  const hintPrefix = puzzle.words.find(word => word.length >= 4).slice(0, 2);
  const progress = { found: [], misses: 0, hintsUsed: 1, countedPlayed: false, hintPrefix };
  const restored = restoreTangleProgress(progress, puzzle);
  assert.equal(restored.hintPrefix, hintPrefix);
  assert.equal(restored.hintsUsed, 1);
  for (const prefix of ['zzzz', 'A!', 9, null]) {
    assert.equal(restoreTangleProgress({ ...progress, hintPrefix: prefix }, puzzle).hintPrefix, null);
  }
  assert.equal(restoreTangleProgress({ ...progress, hintsUsed: 0 }, puzzle).hintPrefix, null);
});
