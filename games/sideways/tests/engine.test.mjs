import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPOCH, HISTORY_LIMIT, getDateKey, getDayNumber, getDaily, createGame,
  rotateStrip, getRows, getColumns, rotateRow, undoMove, checkBoard, feedbackCurrent,
  findHint, useHint, revealGame, restoreGame, getStats, formatShare,
} from '../engine.mjs';

test('future records cannot inflate plays, streaks, perfects, or check averages', () => {
  const records = {
    '2026-10-19': { status: 'won', checks: 3, moves: 12, hints: 1 },
    '2026-10-21': { status: 'won', checks: 1, moves: 6, hints: 0 },
    '2026-10-22': { status: 'won', checks: 1, moves: 6, hints: 0 },
    '2026-10-23': { status: 'revealed', checks: 0, moves: 0, hints: 0 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), {
    played: 1, won: 1, streak: 1, bestStreak: 1, perfect: 0, averageChecks: 3,
  });
});

const puzzle = {
  id: 'test-sideways', title: 'Read between the rows', difficulty: 'Tricky',
  strips: ['PCBS', 'TLRR', 'AAEO', 'ARNN', 'ETED'],
  columns: [
    { answer: 'CRANE', clue: 'Wading bird with a long neck' },
    { answer: 'BREAD', clue: 'Dough after baking' },
    { answer: 'STORE', clue: 'Put away for later' },
    { answer: 'PLANT', clue: 'Living thing with roots' },
  ],
};
const clone = value => JSON.parse(JSON.stringify(value));
function arranged(board = puzzle, state = createGame(board)) {
  let next = state;
  for (let row = 0; row < 5; row++) {
    let count = 0;
    const target = board.columns.map(column => column.answer[row]).join('');
    while (getRows(board, next)[row] !== target && count++ < 4) next = rotateRow(board, next, row, 1);
  }
  return next;
}

test('new board has five starting orientations, no feedback, and separate history', () => {
  assert.deepEqual(createGame(puzzle), {
    puzzleId: puzzle.id, rotations: [0, 0, 0, 0, 0], checks: 0, moves: 0,
    hints: 0, history: [], lastCheck: null, status: 'playing',
  });
  assert.notEqual(createGame(puzzle).rotations, createGame(puzzle).rotations);
  assert.equal(feedbackCurrent(puzzle, createGame(puzzle)), false);
});

test('strip rotations wrap cyclically in either direction', () => {
  assert.equal(rotateStrip('ABCD', 1), 'DABC');
  assert.equal(rotateStrip('ABCD', -1), 'BCDA');
  assert.equal(rotateStrip('ABCD', 2), 'CDAB');
  assert.equal(rotateStrip('ABCD', 4), 'ABCD');
  assert.equal(rotateStrip('ABCD', -5), 'BCDA');
  for (const [strip, steps] of [['ABC', 1], ['AB1D', 1], [null, 1], ['ABCD', 0.5]]) assert.equal(rotateStrip(strip, steps), null);
});

test('rows display current letters and columns read vertically top to bottom', () => {
  const state = createGame(puzzle);
  assert.deepEqual(getRows(puzzle, state), puzzle.strips);
  assert.deepEqual(getColumns(puzzle, state), ['PTAAE', 'CLART', 'BRENE', 'SROND']);
  assert.deepEqual(getColumns(puzzle, arranged()), puzzle.columns.map(column => column.answer));
});

test('rotating one row changes all columns, costs a move, and never mutates its input', () => {
  const state = createGame(puzzle);
  Object.freeze(state.rotations);
  Object.freeze(state.history);
  Object.freeze(state);
  const moved = rotateRow(puzzle, state, 0, 1);
  assert.deepEqual(moved.rotations, [1, 0, 0, 0, 0]);
  assert.equal(moved.moves, 1);
  assert.equal(moved.checks, 0);
  assert.equal(moved.history.length, 1);
  assert.deepEqual(moved.history[0], [0, 0, 0, 0, 0]);
  assert.deepEqual(state.rotations, [0, 0, 0, 0, 0]);
  assert.deepEqual(getRows(puzzle, moved), ['SPCB', ...puzzle.strips.slice(1)]);
});

test('invalid row indices and directions are unscored no-ops', () => {
  const state = createGame(puzzle);
  for (const [row, direction] of [[-1, 1], [5, 1], [0.5, 1], ['0', 1], [0, 0], [0, 2], [0, '1']]) {
    assert.equal(rotateRow(puzzle, state, row, direction), state);
  }
});

test('symmetric row rotations canonicalize equivalent boards', () => {
  const board = { ...puzzle, strips: ['AAAA', 'ABAB', ...puzzle.strips.slice(2)] };
  const state = createGame(board);
  assert.equal(rotateRow(board, state, 0, 1), state, 'an unchanged strip is not a move');
  const moved = rotateRow(board, state, 1, 1);
  assert.equal(moved.rotations[1], 1);
  assert.equal(rotateRow(board, moved, 1, 1).rotations[1], 0);
  assert.equal(rotateRow(board, state, 1, -1).rotations[1], 1);
});

test('checks disclose actual correct columns but never lock a partly correct column', () => {
  let state = arranged();
  state = rotateRow(puzzle, state, 4, -1);
  const result = checkBoard(puzzle, state);
  assert.equal(result.changed, true);
  assert.equal(result.accepted, true);
  assert.equal(result.reason, null);
  assert.equal(result.state.checks, 1);
  assert.deepEqual(result.correct, getColumns(puzzle, state).map((word, col) => word === puzzle.columns[col].answer));
  assert.equal(result.state.status, 'playing');
  assert.equal(feedbackCurrent(puzzle, result.state), true);
  assert.notEqual(rotateRow(puzzle, result.state, 0, 1), result.state);
});

test('rechecking the same visible board does not score, even after rotating away and back', () => {
  const state = checkBoard(puzzle, createGame(puzzle)).state;
  const repeated = checkBoard(puzzle, state);
  assert.equal(repeated.state, state);
  assert.equal(repeated.changed, false);
  assert.equal(repeated.reason, 'unchanged');
  let restored = rotateRow(puzzle, state, 0, 1);
  assert.equal(feedbackCurrent(puzzle, restored), false);
  restored = rotateRow(puzzle, restored, 0, -1);
  assert.equal(feedbackCurrent(puzzle, restored), true);
  assert.equal(checkBoard(puzzle, restored).reason, 'unchanged');
});

test('a correct arrangement wins only after an explicit Check board', () => {
  const state = arranged();
  assert.equal(state.status, 'playing');
  assert.equal(state.checks, 0);
  const checked = checkBoard(puzzle, state);
  assert.equal(checked.state.status, 'won');
  assert.equal(checked.state.checks, 1);
  assert.deepEqual(checked.correct, [true, true, true, true]);
});

test('undo restores an orientation without refunding moves or checks', () => {
  let state = rotateRow(puzzle, createGame(puzzle), 0, 1);
  state = checkBoard(puzzle, state).state;
  state = rotateRow(puzzle, state, 1, -1);
  const restored = undoMove(puzzle, state);
  assert.deepEqual(restored.rotations, [1, 0, 0, 0, 0]);
  assert.equal(restored.moves, 2);
  assert.equal(restored.checks, 1);
  assert.equal(restored.history.length, 1);
  assert.equal(feedbackCurrent(puzzle, restored), true);
  const empty = createGame(puzzle);
  assert.equal(undoMove(puzzle, empty), empty);
});

test('undo history is bounded while total move count remains honest', () => {
  let state = createGame(puzzle);
  for (let move = 0; move < HISTORY_LIMIT + 20; move++) state = rotateRow(puzzle, state, 0, 1);
  assert.equal(state.moves, HISTORY_LIMIT + 20);
  assert.equal(state.history.length, HISTORY_LIMIT);
  for (let undo = 0; undo < HISTORY_LIMIT; undo++) state = undoMove(puzzle, state);
  assert.equal(state.history.length, 0);
  assert.equal(state.moves, HISTORY_LIMIT + 20);
});

test('each hint orients one wrong row, scores assistance, and awaits explicit checking', () => {
  let state = createGame(puzzle);
  for (let step = 0; step < 5; step++) {
    const before = clone(state);
    const hint = findHint(puzzle, state);
    assert.ok(hint);
    const result = useHint(puzzle, state);
    assert.deepEqual(result.hint, hint);
    const changedRows = result.state.rotations.filter((rotation, row) => rotation !== state.rotations[row]);
    assert.equal(changedRows.length, 1);
    assert.equal(result.state.hints, step + 1);
    assert.equal(result.state.moves, step + 1);
    assert.equal(result.state.status, 'playing');
    assert.deepEqual(state, before);
    state = result.state;
  }
  assert.equal(findHint(puzzle, state), null);
  assert.equal(checkBoard(puzzle, state).state.status, 'won');
});

test('undoing a hint does not refund assistance or move count', () => {
  const hinted = useHint(puzzle, createGame(puzzle)).state;
  const undone = undoMove(puzzle, hinted);
  assert.deepEqual(undone.rotations, [0, 0, 0, 0, 0]);
  assert.equal(undone.moves, 1);
  assert.equal(undone.hints, 1);
  assert.equal(useHint(puzzle, undone).state.hints, 2);
});

test('reveal arranges all answers but preserves counters and never awards a win', () => {
  const state = checkBoard(puzzle, rotateRow(puzzle, createGame(puzzle), 0, 1)).state;
  const revealed = revealGame(puzzle, state);
  assert.equal(revealed.status, 'revealed');
  assert.equal(revealed.moves, 1);
  assert.equal(revealed.checks, 1);
  assert.deepEqual(getColumns(puzzle, revealed), puzzle.columns.map(column => column.answer));
});

test('won and revealed boards are immutable terminal states', () => {
  for (const state of [checkBoard(puzzle, arranged()).state, revealGame(puzzle, createGame(puzzle))]) {
    assert.equal(rotateRow(puzzle, state, 0, 1), state);
    assert.equal(undoMove(puzzle, state), state);
    assert.equal(checkBoard(puzzle, state).state, state);
    assert.equal(checkBoard(puzzle, state).reason, 'finished');
    assert.equal(findHint(puzzle, state), null);
    assert.deepEqual(useHint(puzzle, state), { state, hint: null });
    assert.equal(revealGame(puzzle, state), state);
  }
});

test('valid saves round-trip without retaining mutable aliases', () => {
  let state = checkBoard(puzzle, createGame(puzzle)).state;
  state = rotateRow(puzzle, state, 0, 1);
  state = useHint(puzzle, state).state;
  for (const value of [state, checkBoard(puzzle, arranged(puzzle, state)).state, revealGame(puzzle, state)]) {
    const raw = clone(value);
    const restored = restoreGame(puzzle, raw);
    assert.deepEqual(restored, value);
    assert.notEqual(restored.rotations, raw.rotations);
    assert.notEqual(restored.history, raw.history);
    assert.notEqual(restored.lastCheck, raw.lastCheck);
  }
});

test('restoring a solved-but-unchecked arrangement does not invent a win', () => {
  const unchecked = arranged();
  assert.equal(restoreGame(puzzle, unchecked).status, 'playing');
  assert.equal(restoreGame(puzzle, { ...unchecked, status: 'won' }).status, 'playing');
  const checked = checkBoard(puzzle, unchecked).state;
  assert.equal(restoreGame(puzzle, { ...checked, status: 'playing' }).status, 'won');
});

test('invalid saved orientations, fabricated feedback, and malformed counters reset', () => {
  const fresh = createGame(puzzle);
  const checked = checkBoard(puzzle, fresh).state;
  const invalid = [
    null, [], {}, { ...fresh, puzzleId: 'other' }, { ...fresh, status: 'lost' },
    { ...fresh, rotations: [0, 0] }, { ...fresh, rotations: [4, 0, 0, 0, 0] },
    { ...fresh, rotations: [0.5, 0, 0, 0, 0] }, { ...fresh, rotations: null },
    { ...fresh, moves: -1 }, { ...fresh, moves: 0.5 }, { ...fresh, checks: '0' },
    { ...fresh, hints: -1 }, { ...fresh, hints: 1 }, { ...fresh, history: [[0, 1]] },
    { ...fresh, history: Array(HISTORY_LIMIT + 1).fill([0, 0, 0, 0, 0]) },
    { ...checked, checks: 0 }, { ...fresh, checks: 1 },
    { ...checked, lastCheck: { ...checked.lastCheck, correct: [true, true, true, true] } },
    { ...fresh, status: 'revealed' },
  ];
  for (const raw of invalid) assert.deepEqual(restoreGame(puzzle, raw), fresh, JSON.stringify(raw));
});

test('daily selection uses Chicago midnight and stable calendar numbering', () => {
  assert.equal(EPOCH, '2026-10-20');
  assert.equal(getDateKey(new Date('2026-10-20T04:59:59Z')), '2026-10-19');
  assert.equal(getDateKey(new Date('2026-10-20T05:00:00Z')), '2026-10-20');
  assert.equal(getDateKey(new Date('2026-11-02T05:59:59Z')), '2026-11-01');
  assert.equal(getDateKey(new Date('2026-11-02T06:00:00Z')), '2026-11-02');
  assert.equal(getDayNumber('2026-11-02'), 14);
  assert.ok(Number.isNaN(getDayNumber('2026-02-30')));
  const boards = [puzzle, { ...puzzle, id: 'second' }];
  assert.equal(getDaily(boards, new Date('2026-10-21T12:00:00Z')).puzzle.id, 'second');
  assert.equal(getDaily(boards, new Date('2026-10-22T12:00:00Z')).puzzle.id, puzzle.id);
  assert.throws(() => getDaily([]), RangeError);
});

test('statistics award perfect only for one-check unassisted wins and preserve streaks', () => {
  const win = { status: 'won', checks: 1, moves: 8, hints: 0 };
  const records = {
    '2026-10-16': win, '2026-10-17': { ...win, status: 'revealed' },
    '2026-10-18': { ...win, checks: 3 }, '2026-10-19': { ...win, hints: 1 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), { played: 4, won: 3, streak: 2, bestStreak: 2, perfect: 1, averageChecks: 1.7 });
  assert.equal(getStats({ ...records, '2026-10-20': win }, '2026-10-20').streak, 3);
  assert.equal(getStats({ ...records, '2026-10-20': { ...win, status: 'revealed' } }, '2026-10-20').streak, 0);
  assert.equal(getStats(records, '2026-10-21').streak, 0);
  assert.equal(getStats({ '2026-10-19': { ...win, checks: 0 } }, EPOCH).played, 0);
});

test('sharing reports checks, moves, hints, and result without puzzle spoilers', () => {
  const state = checkBoard(puzzle, arranged()).state;
  const share = formatShare(puzzle, state, { number: 1 });
  assert.match(share, /^SIDEWAYS #001\n🟩🟩🟩🟩\n1 check · \d+ moves · 0 hints · Perfect$/);
  for (const { answer, clue } of puzzle.columns) {
    assert.ok(!share.includes(answer));
    assert.ok(!share.includes(clue));
  }
  assert.match(formatShare(puzzle, revealGame(puzzle, createGame(puzzle)), { mode: 'practice' }), /^SIDEWAYS Practice\n🟨🟨🟨🟨[\s\S]*Revealed/);
});
