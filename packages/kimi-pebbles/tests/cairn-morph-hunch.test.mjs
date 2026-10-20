import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { restoreCairnProgress, completeCairnLevel } from '../src/games/cairn/progress.ts';
import { restoreMorphProgress, rewindMorph } from '../src/games/morph/progress.ts';
import { restoreHunchProgress } from '../src/games/hunch/progress.ts';

const source = new URL('../src/games/', import.meta.url);
const dictionary = new Set(readFileSync(new URL('cairn/data/dict.txt', source), 'utf8').split('\n'));
const validWord = word => dictionary.has(word);
const puzzle = { words: ['arc', 'care', 'trace', 'trance', 'central'] };
const fresh = { level: 0, results: [], rack: ['a', 'r', 'c'], slots: [2, null, null], misses: 0, hints: 0, finished: false, countedPlayed: true };

test('Cairn restores the actual shuffled rack, preserving entered letters', () => {
  const shuffled = { ...fresh, rack: ['c', 'r', 'a'], slots: [0, null, null] };
  const restored = restoreCairnProgress(JSON.parse(JSON.stringify(shuffled)), puzzle, validWord);
  assert.ok(restored);
  assert.equal(restored.rack[restored.slots[0]], 'c');
  assert.deepEqual(restored.rack, shuffled.rack);
});

test('Cairn commits each completed level and next rack together through all five levels', () => {
  let current = fresh;
  for (let level = 0; level < puzzle.words.length; level += 1) {
    const result = { status: 'clean', word: puzzle.words[level], misses: 0, hints: 0 };
    current = completeCairnLevel(current, result, puzzle.words[level + 1]?.split('') ?? current.rack);
    assert.equal(current.results.length, level + 1);
    assert.equal(current.level, Math.min(level + 1, 4));
    assert.equal(current.finished, level === 4);
    assert.ok(restoreCairnProgress(JSON.parse(JSON.stringify(current)), puzzle, validWord));
  }
  assert.deepEqual(completeCairnLevel(current, current.results[4], current.rack), current);
});

test('Cairn rejects incomplete, mismatched, and duplicate-tile saves without throwing', () => {
  for (const raw of [null, [], 1, { level: 0, results: [] }, { ...fresh, level: -1 }, { ...fresh, slots: [0, 0, null] }, { ...fresh, rack: ['x', 'r', 'c'] }, { ...fresh, results: [{ status: 'clean', word: 'arc', misses: 0, hints: 0 }] }]) {
    assert.equal(restoreCairnProgress(raw, puzzle, validWord), null);
  }
});

test('Morph can rewind the audited legal dead end and restart the same daily puzzle', () => {
  const p = JSON.parse(readFileSync(new URL('morph/data/puzzles.json', source), 'utf8'))[0];
  const progress = { rows: ['shaw', 'scaw', 'scam', 'scfm', 'scfh'], misses: 2, hintsUsed: 1, finished: false, gaveUp: false, countedPlayed: true };
  assert.ok(restoreMorphProgress(progress, p, validWord));
  const undone = rewindMorph(progress, p, false);
  assert.deepEqual(undone.rows, ['shaw', 'scaw', 'scam', 'scfm']);
  assert.equal(undone.hintsUsed, 1);
  const restarted = rewindMorph(progress, p, true);
  assert.deepEqual(restarted.rows, ['shaw']);
  assert.equal(restarted.misses, 2);
  assert.ok(restoreMorphProgress({ ...restarted, rows: p.p, finished: true }, p, validWord));
});

test('Morph rejects malformed and impossible saved ladders', () => {
  const p = { s: 'cold', t: 'warm', par: 4, p: ['cold', 'cord', 'card', 'ward', 'warm'] };
  const base = { rows: ['cold'], misses: 0, hintsUsed: 0, finished: false, gaveUp: false, countedPlayed: false };
  for (const raw of [[], { ...base, rows: [] }, { ...base, rows: ['cold', 'warm'] }, { ...base, rows: ['cold', 'cord', 'cold'] }, { ...base, finished: true }, { ...base, rows: [null] }]) assert.equal(restoreMorphProgress(raw, p, validWord), null);
});

function evaluate(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = [];
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) result[i] = 'correct'; else remaining.push(answer[i]);
  for (let i = 0; i < 5; i++) if (result[i] !== 'correct') { const at = remaining.indexOf(guess[i]); if (at !== -1) { result[i] = 'present'; remaining.splice(at, 1); } }
  return result;
}

test('Hunch recomputes evaluations and terminal status from validated guesses', () => {
  const raw = { guesses: ['drain'], evals: [], hintLetters: ['r'], hintsUsed: 1, finished: false, won: false, countedPlayed: true };
  const restored = restoreHunchProgress(raw, 'drain', evaluate, validWord);
  assert.ok(restored);
  assert.deepEqual(restored.evals, [Array(5).fill('correct')]);
  assert.equal(restored.won, true);
  assert.equal(restored.finished, true);
  assert.equal(restoreHunchProgress({ ...raw, guesses: [null] }, 'drain', evaluate, validWord), null);
  assert.equal(restoreHunchProgress({ ...raw, hintLetters: ['z'] }, 'drain', evaluate, validWord), null);
});

test('Every bundled Cairn, Morph, and Hunch solution survives the new save validators', () => {
  const cairn = JSON.parse(readFileSync(new URL('cairn/data/puzzles.json', source), 'utf8'));
  for (const { w: words } of cairn) {
    const current = { level: 4, results: words.map(word => ({ status: 'clean', word, misses: 0, hints: 0 })), rack: words[4].split(''), slots: [0, 1, 2, 3, 4, 5, 6], misses: 0, hints: 0, finished: true, countedPlayed: true };
    assert.ok(restoreCairnProgress(current, { words }, validWord), words.join(' → '));
  }
  const morph = JSON.parse(readFileSync(new URL('morph/data/puzzles.json', source), 'utf8'));
  for (const p of morph) assert.ok(restoreMorphProgress({ rows: p.p, misses: 0, hintsUsed: 0, finished: true, gaveUp: false, countedPlayed: true }, p, validWord), `${p.s} → ${p.t}`);
  const hunch = JSON.parse(readFileSync(new URL('hunch/data/answers.json', source), 'utf8'));
  for (const answer of hunch) assert.equal(restoreHunchProgress({ guesses: [answer], hintLetters: [], hintsUsed: 0, countedPlayed: true }, answer, evaluate, validWord)?.won, true, answer);
  assert.equal(cairn.length + morph.length + hunch.length, 2226);
});
