import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPOCH, getDateKey, getDayNumber, getDaily, createGame, nextDirection, legalNextCells,
  selectCell, findHint, useHint, revealGame, restoreGame, getStats, formatShare,
} from '../engine.mjs';

test('future records cannot inflate plays, streaks, perfects, or move averages', () => {
  const records = {
    '2026-10-19': { status: 'won', moves: 21, hints: 1 },
    '2026-10-21': { status: 'won', moves: 15, hints: 0 },
    '2026-10-22': { status: 'won', moves: 15, hints: 0 },
    '2026-10-23': { status: 'revealed', moves: 0, hints: 0 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), {
    played: 1, won: 1, streak: 1, bestStreak: 1, perfect: 0, averageMoves: 21,
  });
});

const puzzle = {
  id: 'test-switchpath', title: 'Change your direction', difficulty: 'Tricky',
  values: [1, 11, 6, 15, 5, 10, 8, 4, 2, 13, 3, 12, 16, 7, 14, 9],
  start: 0, end: 12,
  solution: [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11, 15, 14, 13, 12],
};
const clone = value => JSON.parse(JSON.stringify(value));
function solve(state = createGame(puzzle)) {
  if (state.path.length > 1) state = selectCell(puzzle, state, puzzle.start).state;
  for (const cell of puzzle.solution.slice(1)) {
    const result = selectCell(puzzle, state, cell);
    assert.equal(result.accepted, true);
    state = result.state;
  }
  return state;
}

test('new state starts at S with a higher next step and no moves', () => {
  const state = createGame(puzzle);
  assert.deepEqual(state, { puzzleId: puzzle.id, path: [0], moves: 0, hints: 0, status: 'playing' });
  assert.equal(nextDirection(state), 'higher');
  assert.deepEqual(legalNextCells(puzzle, state), [1, 4]);
  assert.notEqual(state.path, createGame(puzzle).path);
});

test('valid extensions alternate higher and lower and preserve their input', () => {
  const state = createGame(puzzle);
  Object.freeze(state.path);
  Object.freeze(state);
  const first = selectCell(puzzle, state, 4);
  assert.equal(first.accepted, true);
  assert.equal(first.changed, true);
  assert.equal(first.action, 'extend');
  assert.equal(first.reason, null);
  assert.deepEqual(first.state.path, [0, 4]);
  assert.equal(first.state.moves, 1);
  assert.equal(nextDirection(first.state), 'lower');
  const second = selectCell(puzzle, first.state, 8);
  assert.deepEqual(second.state.path, [0, 4, 8]);
  assert.equal(nextDirection(second.state), 'higher');
  assert.equal(second.state.moves, 2);
  assert.deepEqual(state.path, [0]);
});

test('invalid, diagonal, nonadjacent, and wrong-direction moves are unscored', () => {
  const fresh = createGame(puzzle);
  for (const [cell, reason] of [[-1, 'invalid'], [16, 'invalid'], [0.5, 'invalid'], ['4', 'invalid'], [null, 'invalid'], [5, 'not-adjacent'], [15, 'not-adjacent']]) {
    const result = selectCell(puzzle, fresh, cell);
    assert.equal(result.state, fresh);
    assert.equal(result.changed, false);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, reason);
    assert.equal(result.action, null);
  }
  const state = selectCell(puzzle, fresh, 4).state;
  assert.equal(selectCell(puzzle, state, 5).reason, 'direction');
  assert.equal(selectCell(puzzle, state, 5).state, state);
});

test('the end cell is forbidden until it would be the sixteenth cell', () => {
  let state = selectCell(puzzle, createGame(puzzle), 4).state;
  state = selectCell(puzzle, state, 8).state;
  assert.equal(selectCell(puzzle, state, 12).reason, 'end-too-early');
  assert.ok(!legalNextCells(puzzle, state).includes(12));
});

test('tapping an earlier path cell rewinds with one move and no refund', () => {
  let state = createGame(puzzle);
  for (const cell of [4, 8, 9, 5]) state = selectCell(puzzle, state, cell).state;
  const rewound = selectCell(puzzle, state, 4);
  assert.equal(rewound.accepted, true);
  assert.equal(rewound.action, 'rewind');
  assert.deepEqual(rewound.state.path, [0, 4]);
  assert.equal(rewound.state.moves, 5);
  assert.equal(nextDirection(rewound.state), 'lower');
  const reset = selectCell(puzzle, rewound.state, 0).state;
  assert.deepEqual(reset.path, [0]);
  assert.equal(reset.moves, 6);
});

test('tapping the current tip is an unchanged unscored action', () => {
  const state = selectCell(puzzle, createGame(puzzle), 4).state;
  const result = selectCell(puzzle, state, 4);
  assert.equal(result.state, state);
  assert.equal(result.reason, 'unchanged');
  assert.equal(result.changed, false);
});

test('all sixteen cells ending at E win automatically in fifteen moves', () => {
  const state = solve();
  assert.equal(state.status, 'won');
  assert.equal(state.moves, 15);
  assert.equal(state.hints, 0);
  assert.deepEqual(state.path, puzzle.solution);
  assert.equal(new Set(state.path).size, 16);
});

test('locally legal wrong branches remain playable and can be rewound', () => {
  let state = selectCell(puzzle, createGame(puzzle), 1).state;
  assert.equal(state.status, 'playing');
  assert.deepEqual(state.path, [0, 1]);
  state = selectCell(puzzle, state, 2).state;
  assert.equal(state.status, 'playing');
  const reset = selectCell(puzzle, state, 0).state;
  assert.deepEqual(reset.path, [0]);
  assert.equal(solve(reset).status, 'won');
});

test('hint on a matching prefix adds exactly one correct step', () => {
  const state = selectCell(puzzle, createGame(puzzle), 4).state;
  const hint = findHint(puzzle, state);
  assert.deepEqual(hint.path, [0, 4, 8]);
  assert.equal(hint.cell, 8);
  assert.equal(hint.rewound, 0);
  const result = useHint(puzzle, state);
  assert.deepEqual(result.hint, hint);
  assert.deepEqual(result.state.path, [0, 4, 8]);
  assert.equal(result.state.moves, 2);
  assert.equal(result.state.hints, 1);
  assert.deepEqual(state.path, [0, 4]);
});

test('hint corrects the earliest wrong branch and adds only the next correct step', () => {
  let state = createGame(puzzle);
  for (const cell of [1, 2, 3, 7, 6]) state = selectCell(puzzle, state, cell).state;
  const before = clone(state);
  const result = useHint(puzzle, state);
  assert.deepEqual(result.state.path, [0, 4]);
  assert.equal(result.hint.cell, 4);
  assert.equal(result.hint.rewound, 5);
  assert.equal(result.state.moves, 6);
  assert.equal(result.state.hints, 1);
  assert.ok(result.hint.message.includes('Rewound'));
  assert.deepEqual(state, before);
});

test('hint can finish the final step but that win is assisted', () => {
  let state = createGame(puzzle);
  for (const cell of puzzle.solution.slice(1, -1)) state = selectCell(puzzle, state, cell).state;
  const result = useHint(puzzle, state);
  assert.equal(result.state.status, 'won');
  assert.equal(result.state.moves, 15);
  assert.equal(result.state.hints, 1);
  assert.ok(!formatShare(puzzle, result.state).includes('Perfect'));
});

test('reveal fills the route without adding moves or awarding a win', () => {
  const state = selectCell(puzzle, createGame(puzzle), 1).state;
  const revealed = revealGame(puzzle, state);
  assert.equal(revealed.status, 'revealed');
  assert.equal(revealed.moves, 1);
  assert.equal(revealed.hints, 0);
  assert.deepEqual(revealed.path, puzzle.solution);
  assert.deepEqual(state.path, [0, 1]);
});

test('won and revealed routes are immutable terminal states', () => {
  for (const state of [solve(), revealGame(puzzle, createGame(puzzle))]) {
    assert.equal(selectCell(puzzle, state, 0).state, state);
    assert.equal(selectCell(puzzle, state, 0).reason, 'finished');
    assert.deepEqual(legalNextCells(puzzle, state), []);
    assert.equal(findHint(puzzle, state), null);
    assert.deepEqual(useHint(puzzle, state), { state, hint: null });
    assert.equal(revealGame(puzzle, state), state);
  }
});

test('restoration round-trips legal partial, winning, and revealed paths without aliases', () => {
  const partial = useHint(puzzle, selectCell(puzzle, createGame(puzzle), 1).state).state;
  for (const value of [partial, solve(), revealGame(puzzle, partial)]) {
    const raw = clone(value);
    const restored = restoreGame(puzzle, raw);
    assert.deepEqual(restored, value);
    assert.notEqual(restored.path, raw.path);
  }
});

test('restoration derives a win only from a valid complete route', () => {
  const partial = selectCell(puzzle, createGame(puzzle), 1).state;
  assert.equal(restoreGame(puzzle, { ...partial, status: 'won' }).status, 'playing');
  assert.equal(restoreGame(puzzle, { ...solve(), status: 'playing' }).status, 'won');
});

test('damaged saves cannot admit nonadjacent, repeating, early-end, or nonalternating paths', () => {
  const fresh = createGame(puzzle);
  const invalid = [
    null, [], {}, { ...fresh, puzzleId: 'other' }, { ...fresh, status: 'lost' },
    { ...fresh, path: [] }, { ...fresh, path: [1] }, { ...fresh, path: [0, 5], moves: 1 },
    { ...fresh, path: [0, 4, 5], moves: 2 }, { ...fresh, path: [0, 4, 0], moves: 2 },
    { ...fresh, path: [0, 4, 8, 12], moves: 3 }, { ...fresh, path: [0, 16], moves: 1 },
    { ...fresh, path: [0, '4'], moves: 1 }, { ...fresh, path: [0, 4], moves: 0 },
    { ...fresh, moves: -1 }, { ...fresh, moves: 0.5 }, { ...fresh, hints: 1 },
    { ...fresh, hints: '0' }, { ...fresh, status: 'revealed' },
  ];
  for (const raw of invalid) assert.deepEqual(restoreGame(puzzle, raw), fresh, JSON.stringify(raw));
});

test('daily selection uses Chicago midnight and calendar numbering across DST', () => {
  assert.equal(EPOCH, '2026-10-20');
  assert.equal(getDateKey(new Date('2026-10-20T04:59:59Z')), '2026-10-19');
  assert.equal(getDateKey(new Date('2026-10-20T05:00:00Z')), '2026-10-20');
  assert.equal(getDateKey(new Date('2026-11-02T06:00:00Z')), '2026-11-02');
  assert.equal(getDayNumber('2026-11-02'), 14);
  assert.ok(Number.isNaN(getDayNumber('2026-02-30')));
  const boards = [puzzle, { ...puzzle, id: 'second' }];
  assert.equal(getDaily(boards, new Date('2026-10-21T12:00:00Z')).puzzle.id, 'second');
  assert.equal(getDaily(boards, new Date('2026-10-22T12:00:00Z')).puzzle.id, puzzle.id);
  assert.throws(() => getDaily([]), RangeError);
});

test('statistics distinguish fifteen-move perfect routes, assisted wins, and reveals', () => {
  const win = { status: 'won', moves: 15, hints: 0 };
  const records = {
    '2026-10-16': win, '2026-10-17': { ...win, status: 'revealed' },
    '2026-10-18': { ...win, moves: 19 }, '2026-10-19': { ...win, hints: 1 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), { played: 4, won: 3, streak: 2, bestStreak: 2, perfect: 1, averageMoves: 16.3 });
  assert.equal(getStats({ ...records, '2026-10-20': win }, '2026-10-20').streak, 3);
  assert.equal(getStats({ ...records, '2026-10-20': { ...win, status: 'revealed' } }, '2026-10-20').streak, 0);
  assert.equal(getStats(records, '2026-10-21').streak, 0);
  assert.equal(getStats({ '2026-10-19': { ...win, moves: 14 } }, EPOCH).played, 0);
});

test('sharing conveys progress and result without numbers or route coordinates', () => {
  const state = solve();
  assert.equal(formatShare(puzzle, state, { number: 1 }), 'SWITCHPATH #001\n🟩🟩🟩🟩\n15 moves · 0 hints · Perfect');
  assert.match(formatShare(puzzle, revealGame(puzzle, createGame(puzzle)), { mode: 'practice' }), /^SWITCHPATH Practice\n🟨🟨🟨🟨[\s\S]*Revealed/);
  assert.match(formatShare(puzzle, createGame(puzzle)), /In progress/);
});
