import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPOCH, getDateKey, getDayNumber, getDaily, createGame, swapLetters,
  undoMove, findHint, useHint, revealGame, restoreGame, getStats, formatShare,
} from '../engine.mjs';
import { PUZZLES } from '../puzzles.mjs';

const pairs = [
  ['CRANE', 'CRATE'], ['STARE', 'SHARE'], ['HATCH', 'CATCH'],
  ['CROWN', 'BROWN'], ['BOUND', 'ROUND'], ['CHAIR', 'CHAIN'],
];
const puzzle = {
  id: 'test-cycle', title: 'A fair trade', par: 5,
  rows: pairs.map(([start, answer]) => ({ start, answer, clue: 'A test clue', hint: 'A test hint' })),
};
const letters = board => board.join('').split('').sort().join('');

test('new games contain the original board and zero counters', () => {
  const state = createGame(puzzle);
  assert.deepEqual(state.board, pairs.map(pair => pair[0]));
  assert.equal(state.status, 'playing');
  for (const field of ['moves', 'undos', 'hints']) assert.equal(state[field], 0);
  assert.deepEqual(state.history, []);
});

test('five trades solve the six-cycle while conserving every letter', () => {
  let state = createGame(puzzle);
  const before = JSON.stringify(state);
  const targetLetters = letters(state.board);
  const positions = [3, 1, 0, 0, 0, 4];
  for (let row = 0; row < 5; row++) {
    const result = swapLetters(puzzle, state, { row, col: positions[row] }, { row: row + 1, col: positions[row + 1] });
    assert.equal(result.changed, true);
    assert.equal(result.state.moves, row + 1);
    assert.equal(letters(result.state.board), targetLetters);
    assert.deepEqual(result.newlySolved, row === 4 ? [4, 5] : [row]);
    state = result.state;
  }
  assert.equal(state.status, 'won');
  assert.deepEqual(state.board, pairs.map(pair => pair[1]));
  assert.equal(JSON.stringify(createGame(puzzle)), before);
});

test('invalid and no-op trades do not count or mutate the game', () => {
  const state = createGame(puzzle);
  for (const [a, b, reason] of [
    [{ row: -1, col: 0 }, { row: 1, col: 0 }, 'invalid'],
    [{ row: 0, col: 5 }, { row: 1, col: 0 }, 'invalid'],
    [{ row: 0.5, col: 1 }, { row: 1, col: 0 }, 'invalid'],
    [null, { row: 1, col: 0 }, 'invalid'],
    [{ row: 0, col: 0 }, { row: 0, col: 0 }, 'same-cell'],
    [{ row: 0, col: 2 }, { row: 1, col: 2 }, 'same-letter'],
  ]) {
    const result = swapLetters(puzzle, state, a, b);
    assert.equal(result.changed, false);
    assert.equal(result.reason, reason);
    assert.equal(result.state, state);
  }
});

test('solved rows lock, but a same-row swap can rescue the final word', () => {
  const state = createGame(puzzle);
  state.board = pairs.map(pair => pair[1]);
  state.board[0] = 'RCATE';
  const locked = swapLetters(puzzle, state, { row: 1, col: 0 }, { row: 0, col: 0 });
  assert.equal(locked.reason, 'locked');
  const hint = findHint(puzzle, state);
  assert.equal(hint.a.row, 0);
  assert.equal(hint.b.row, 0);
  const result = swapLetters(puzzle, state, hint.a, hint.b);
  assert.equal(result.state.status, 'won');
  assert.deepEqual(result.newlySolved, [0]);
});

test('undo restores the board and preserves total swap count', () => {
  const original = createGame(puzzle);
  const swapped = swapLetters(puzzle, original, { row: 0, col: 3 }, { row: 1, col: 1 }).state;
  const restored = undoMove(puzzle, swapped);
  assert.deepEqual(restored.board, original.board);
  assert.equal(restored.moves, 1);
  assert.equal(restored.undos, 1);
  assert.equal(restored.history.length, 0);
  assert.equal(restored.events.length, 1);
  assert.equal(undoMove(puzzle, original), original);
});

test('hints strictly reduce mismatches even after many exploratory swaps', () => {
  let state = createGame(puzzle);
  for (let i = 0; i < 55; i++) {
    state = swapLetters(puzzle, state,
      { row: (i * 5 + 2) % 6, col: (i * 3 + 1) % 5 },
      { row: (i * 7 + 4) % 6, col: (i * 2 + 3) % 5 }).state;
  }
  const mismatchCount = current => current.board.reduce((sum, word, row) => sum + [...word].filter((letter, col) => letter !== puzzle.rows[row].answer[col]).length, 0);
  for (let attempts = 0; state.status === 'playing' && attempts < 30; attempts++) {
    const before = mismatchCount(state);
    const { state: hinted, hint } = useHint(puzzle, state);
    assert.ok(hint);
    assert.equal(hinted.hints, state.hints + 1);
    state = swapLetters(puzzle, hinted, hint.a, hint.b).state;
    assert.ok(mismatchCount(state) < before);
  }
  assert.equal(state.status, 'won');
  assert.equal(findHint(puzzle, state), null);
});

test('won and revealed games cannot be changed or treated as fresh wins', () => {
  const revealed = revealGame(puzzle, createGame(puzzle));
  assert.equal(revealed.status, 'revealed');
  assert.deepEqual(revealed.board, pairs.map(pair => pair[1]));
  assert.equal(undoMove(puzzle, revealed), revealed);
  assert.equal(swapLetters(puzzle, revealed, { row: 0, col: 0 }, { row: 1, col: 0 }).reason, 'finished');
  assert.equal(useHint(puzzle, revealed).state, revealed);
  assert.equal(restoreGame(puzzle, JSON.parse(JSON.stringify(revealed))).status, 'revealed');
  const won = { ...revealed, status: 'won' };
  assert.equal(revealGame(puzzle, won), won);
  assert.equal(undoMove(puzzle, won), won);
});

test('restore validates the complete board, counters, identity and history', () => {
  const initial = createGame(puzzle);
  const swapped = swapLetters(puzzle, initial, { row: 0, col: 3 }, { row: 1, col: 1 }).state;
  assert.deepEqual(restoreGame(puzzle, JSON.parse(JSON.stringify(swapped))), swapped);
  for (const bad of [null, [], {}, { ...swapped, puzzleId: 'other' },
    { ...swapped, board: ['XXXXX', ...swapped.board.slice(1)] },
    { ...swapped, board: ['crane', ...swapped.board.slice(1)] },
    { ...swapped, moves: -1 }, { ...swapped, hints: Infinity }, { ...swapped, undos: 0.5 }]) {
    assert.deepEqual(restoreGame(puzzle, bad), initial);
  }
  const validWithBadHistory = { ...swapped, history: [null, ['BAD'], initial.board] };
  assert.deepEqual(restoreGame(puzzle, validWithBadHistory).history, [initial.board]);
  const falseWin = { ...swapped, status: 'won' };
  assert.equal(restoreGame(puzzle, falseWin).status, 'playing');
});

test('undo history retains at most one hundred previous boards', () => {
  let state = createGame(puzzle);
  for (let i = 0; i < 105; i++) state = swapLetters(puzzle, state, { row: 0, col: 0 }, { row: 0, col: 1 }).state;
  assert.equal(state.history.length, 100);
  assert.equal(state.moves, 105);
  const restored = restoreGame(puzzle, { ...state, history: Array(120).fill(createGame(puzzle).board) });
  assert.equal(restored.history.length, 100);
});

test('every published puzzle can recover from seeded exploratory trades', () => {
  let seed = 0x51a97;
  const random = limit => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % limit;
  };
  for (const published of PUZZLES) {
    for (let run = 0; run < 3; run++) {
      let state = createGame(published);
      const signature = letters(state.board);
      for (let turn = 0; turn < 80; turn++) {
        state = swapLetters(published, state,
          { row: random(6), col: random(5) },
          { row: random(6), col: random(5) }).state;
      }
      for (let repair = 0; state.status === 'playing' && repair < 30; repair++) {
        const hint = findHint(published, state);
        assert.ok(hint, `${published.id}: valid board needs a hint`);
        const changed = swapLetters(published, state, hint.a, hint.b);
        assert.equal(changed.changed, true, `${published.id}: hinted trade must be legal`);
        state = changed.state;
        assert.equal(letters(state.board), signature);
      }
      assert.equal(state.status, 'won', `${published.id}: hints should finish every recoverable board`);
    }
  }
});

test('Chicago dates cross midnight correctly on both sides of DST', () => {
  assert.equal(EPOCH, '2026-10-20');
  assert.equal(getDateKey(new Date('2026-10-20T04:59:59Z')), '2026-10-19');
  assert.equal(getDateKey(new Date('2026-10-20T05:00:00Z')), '2026-10-20');
  assert.equal(getDateKey(new Date('2026-11-02T05:59:59Z')), '2026-11-01');
  assert.equal(getDateKey(new Date('2026-11-02T06:00:00Z')), '2026-11-02');
  assert.equal(getDayNumber(EPOCH), 1);
  assert.equal(getDayNumber('2026-10-19'), 0);
  assert.equal(getDayNumber('2026-11-02'), 14);
  const bank = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  assert.equal(getDaily(bank, new Date('2026-10-20T12:00Z')).puzzle.id, 'one');
  assert.equal(getDaily(bank, new Date('2026-10-19T12:00Z')).puzzle.id, 'three');
  assert.equal(getDaily(bank, new Date('2026-10-23T12:00Z')).puzzle.id, 'one');
});

test('statistics count actual wins, perfect solves, and calendar streaks', () => {
  const win = { status: 'won', moves: 5, hints: 0, undos: 0, par: 5 };
  const records = {
    '2026-10-15': win, '2026-10-16': win,
    '2026-10-17': { ...win, status: 'revealed' },
    '2026-10-18': { ...win, moves: 7, undos: 1 },
    '2026-10-19': { ...win, hints: 1 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), { played: 5, won: 4, streak: 2, bestStreak: 2, perfect: 2, averageSwaps: 5.5 });
  assert.equal(getStats({ ...records, '2026-10-20': { ...win, status: 'revealed' } }, '2026-10-20').streak, 0);
  assert.equal(getStats(records, '2026-10-21').streak, 0);
  assert.deepEqual(getStats(null, '2026-10-20'), { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageSwaps: 0 });
});

test('share text exposes results but never clue answers', () => {
  const won = { ...createGame(puzzle), status: 'won', board: pairs.map(pair => pair[1]), moves: 5 };
  const text = formatShare(puzzle, won, { number: 1, mode: 'daily', url: 'https://example.test' });
  assert.ok(text.includes('TRADEOFF #001'));
  assert.ok(text.includes('🟩🟩🟩🟩🟩🟩'));
  assert.ok(text.includes('5 swaps'));
  assert.ok(text.includes('https://example.test'));
  for (const [, answer] of pairs) assert.ok(!text.includes(answer));
  const practice = formatShare(puzzle, { ...won, hints: 1, undos: 2 }, { mode: 'practice' });
  assert.ok(practice.includes('Practice'));
  assert.ok(practice.includes('1 hint'));
  assert.ok(practice.includes('2 undos'));
  assert.ok(!practice.includes('undefined'));
});
