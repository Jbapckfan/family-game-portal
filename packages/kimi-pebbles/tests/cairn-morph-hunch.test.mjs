import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { restoreCairnProgress, completeCairnLevel } from '../src/games/cairn/progress.ts';
import { restoreMorphProgress, rewindMorph } from '../src/games/morph/progress.ts';
import { restoreHunchProgress } from '../src/games/hunch/progress.ts';
import { coverage } from '../src/games/circuit/progress.ts';

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

// Exercise the production hook's action callbacks without mounting a browser.
// Storage and audio are the external boundaries; scoring and transitions run unchanged.
function morphActions(mode = 'daily') {
  const stats = { played: 8, completed: 5, currentStreak: 2, maxStreak: 4, lastCompletedDay: 99 };
  let state = { phase: 'playing', mode, dayNumber: 100, puzzle: { s: 'cold', t: 'cord' },
    rows: ['cold'], edit: [...'cord'], misses: 0, hintsUsed: 0, finished: false, gaveUp: false, stats };
  let storedStats = structuredClone(stats), storedProgress = null;
  const sounds = [];
  const source = readFileSync(new URL('../src/games/morph/useMorph.ts', import.meta.url), 'utf8');
  const executable = ts.transpileModule(source.replace(/^import .*\n/gm, '').replace(/^export /gm, ''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const actions = new Script(`${executable}\nuseMorph().actions`).runInNewContext({
    EMPTY_GAME_STATS: stats,
    useState: () => [state, next => { state = typeof next === 'function' ? next(state) : next; }],
    useRef: value => ({ current: value }),
    useCallback: fn => fn,
    useEffect: () => {},
    loadGameStats: () => storedStats,
    saveGameStats: (_game, value) => { storedStats = structuredClone(value); },
    loadDayProgress: () => storedProgress,
    saveDayProgress: (_game, _day, value) => { storedProgress = structuredClone(value); },
    isValidWord: word => ['cold', 'cord'].includes(word),
    diffCount: (a, b) => [...a].filter((letter, i) => letter !== b[i]).length,
    sfx: Object.fromEntries(['remove', 'win', 'levelUp'].map(name => [name, () => sounds.push(name)])),
  });
  return { actions, sounds, originalStats: stats, get state() { return state; }, get stats() { return storedStats; } };
}

test('Morph daily give-up records play without awarding a completion, streak, or win sound', () => {
  const game = morphActions();
  game.actions.giveUp();
  assert.equal(game.state.finished, true);
  assert.equal(game.state.gaveUp, true);
  assert.deepEqual([...game.state.rows], ['cold']);
  assert.deepEqual(game.stats, { ...game.originalStats, played: 9, currentStreak: 0 });
  assert.deepEqual(game.sounds, ['remove']);
});

test('Morph practice give-up leaves daily statistics unchanged and has no win sound', () => {
  const game = morphActions('practice');
  game.actions.giveUp();
  assert.equal(game.state.gaveUp, true);
  assert.deepEqual(game.stats, game.originalStats);
  assert.deepEqual(game.sounds, ['remove']);
});

test('Morph solving the target still awards the daily completion and win sound', () => {
  const game = morphActions();
  game.actions.submit();
  assert.equal(game.state.finished, true);
  assert.equal(game.state.gaveUp, false);
  assert.deepEqual([...game.state.rows], ['cold', 'cord']);
  assert.deepEqual(game.stats, { ...game.originalStats, played: 9, completed: 6, currentStreak: 3, lastCompletedDay: 100 });
  assert.deepEqual(game.sounds, ['levelUp', 'win']);
});

function cairnActions(previousStatuses, mode = 'daily') {
  const stats = { played: 8, completed: 5, perfect: 2, currentStreak: 2, maxStreak: 4, lastCompletedDay: 99, totalMisses: 10 };
  const results = previousStatuses.map((status, i) => ({ status, word: puzzle.words[i], misses: 0, hints: 0 }));
  let state = { phase: 'playing', mode, dayNumber: 100, puzzle, level: 4,
    results, rack: [...'central'], slots: [0, 1, 2, 3, 4, 5, 6], misses: 2, hints: 1,
    finished: false, stats };
  let storedStats = structuredClone(stats);
  const sounds = [], timers = [];
  const source = readFileSync(new URL('../src/games/cairn/useGame.ts', import.meta.url), 'utf8');
  const executable = ts.transpileModule(source.replace(/^import[\s\S]*?from ['"][^'"]+['"]\r?\n/gm, '').replace(/^export /gm, ''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const actions = new Script(`${executable}\nuseGame().actions`).runInNewContext({
    EMPTY_STATS: stats, LEVELS: 5, completeCairnLevel,
    useState: () => [state, next => { state = typeof next === 'function' ? next(state) : next; }],
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: () => {}, useMemo: fn => fn(),
    loadDayProgress: () => ({ countedPlayed: true }),
    saveStats: value => { storedStats = structuredClone(value); },
    isValidWord: validWord,
    // Rack order is irrelevant to the final result; retain every answer letter.
    buildRack: word => [...word], addedLetter: () => null,
    window: { setTimeout: fn => { timers.push(fn); return timers.length; } },
    sfx: Object.fromEntries(['remove', 'win', 'levelUp'].map(name => [name, () => sounds.push(name)])),
  });
  return { actions, sounds, originalStats: stats,
    flush() { while (timers.length) timers.shift()(); },
    get state() { return state; }, get stats() { return storedStats; } };
}

for (const [label, statuses, action] of [
  ['all skipped', ['skipped', 'skipped', 'skipped', 'skipped'], 'giveUp'],
  ['last word skipped', ['clean', 'clean', 'clean', 'clean'], 'giveUp'],
  ['earlier word skipped', ['skipped', 'clean', 'clean', 'clean'], 'submit'],
]) {
  test(`Cairn ${label} finishes without awarding a summit, streak, or win sound`, () => {
    const game = cairnActions(statuses);
    game.actions[action](); game.flush();
    assert.equal(game.state.finished, true);
    assert.equal(game.state.results.length, 5);
    assert.deepEqual(game.stats, { ...game.originalStats, currentStreak: 0, totalMisses: 12 });
    assert.equal(game.sounds.includes('win'), false);
  });
}

test('Cairn a fully solved tower still earns a summit and streak with hints and misses', () => {
  const game = cairnActions(['clean', 'clean', 'clean', 'clean']);
  game.actions.submit(); game.flush();
  assert.equal(game.state.finished, true);
  assert.equal(game.state.results[4].status, 'messy');
  assert.deepEqual(game.stats, { ...game.originalStats, completed: 6, currentStreak: 3, lastCompletedDay: 100, totalMisses: 12 });
  assert.deepEqual(game.sounds, ['levelUp', 'win']);
});

test('Cairn practice skips leave daily statistics unchanged', () => {
  const game = cairnActions(['clean', 'clean', 'clean', 'clean'], 'practice');
  game.actions.giveUp(); game.flush();
  assert.equal(game.state.finished, true);
  assert.deepEqual(game.stats, game.originalStats);
  assert.equal(game.sounds.includes('win'), false);
});

function circuitActions(mode = 'daily') {
  const stats = { played: 8, completed: 5, currentStreak: 2, maxStreak: 4, lastCompletedDay: 99 };
  const puzzle = JSON.parse(readFileSync(new URL('../src/games/circuit/data/puzzles.json', import.meta.url), 'utf8'))[0];
  let state = { phase: 'playing', mode, dayNumber: 100, puzzle,
    played: puzzle.sol.slice(0, -1), current: [...puzzle.sol.at(-1)].map(letter => puzzle.l.indexOf(letter)),
    revealed: 0, hintsUsed: 0, finished: false, gaveUp: false, stats };
  let storedStats = structuredClone(stats);
  const sounds = [];
  const source = readFileSync(new URL('../src/games/circuit/useCircuit.ts', import.meta.url), 'utf8');
  const executable = ts.transpileModule(source.replace(/^import .*\n/gm, '').replace(/^export /gm, ''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const actions = new Script(`${executable}\nuseCircuit().actions`).runInNewContext({
    coverage,
    useState: () => [state, next => { state = typeof next === 'function' ? next(state) : next; }],
    useRef: value => ({ current: value }), useCallback: fn => fn, useEffect: () => {},
    loadDayProgress: () => ({ countedPlayed: true }),
    saveGameStats: (_game, value) => { storedStats = structuredClone(value); },
    sfx: Object.fromEntries(['remove', 'win', 'levelUp'].map(name => [name, () => sounds.push(name)])),
  });
  return { actions, sounds, originalStats: stats, get state() { return state; }, get stats() { return storedStats; } };
}

test('Circuit daily give-up resets only the current streak, without awarding a completion', () => {
  const game = circuitActions();
  game.actions.giveUp();
  assert.equal(game.state.gaveUp, true);
  assert.deepEqual(game.stats, { ...game.originalStats, currentStreak: 0 });
  assert.deepEqual(game.sounds, ['remove']);
});

test('Circuit practice give-up leaves daily statistics unchanged', () => {
  const game = circuitActions('practice');
  game.actions.giveUp();
  assert.equal(game.state.gaveUp, true);
  assert.deepEqual(game.stats, game.originalStats);
});

test('Circuit solved daily chain still earns a completion and extends the streak', () => {
  const game = circuitActions();
  game.actions.submit();
  assert.equal(game.state.finished, true);
  assert.equal(game.state.gaveUp, false);
  assert.deepEqual(game.stats, { ...game.originalStats, completed: 6, currentStreak: 3, lastCompletedDay: 100 });
  assert.deepEqual(game.sounds, ['levelUp', 'win']);
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
