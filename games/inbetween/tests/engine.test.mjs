import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPOCH, getDateKey, getDayNumber, getDaily, createGame, buildWord,
  submitPlacement, findHint, useHint, revealGame, restoreGame, getStats, formatShare,
} from '../engine.mjs';
import { PUZZLES } from '../puzzles.mjs';

const examples = [
  ['REST', 'ARREST', 'AR', 0],
  ['RING', 'RATING', 'AT', 1],
  ['CATS', 'CARETS', 'RE', 2],
  ['CANT', 'CANNOT', 'NO', 3],
  ['PLAN', 'PLANET', 'ET', 4],
  ['RUST', 'ROBUST', 'OB', 1],
];
const puzzle = {
  id: 'test-six', title: 'A place for every pair', difficulty: 'Easy',
  rows: examples.map(([seed, answer]) => ({ seed, answer, clue: 'A test clue' })),
  tiles: examples.map(([, , letters], index) => ({ id: `tile-${index}`, letters })),
};
const correct = row => ({ row, tileId: puzzle.tiles[row].id, gap: examples[row][3] });
const clone = value => JSON.parse(JSON.stringify(value));
function solve(board = puzzle, state = createGame(board)) {
  while (state.status === 'playing') {
    const hint = findHint(board, state);
    assert.ok(hint, `${board.id} must have a usable hint`);
    const result = submitPlacement(board, state, hint);
    assert.equal(result.accepted, true, `${board.id}: the hint must be a correct fit`);
    state = result.state;
  }
  return state;
}

test('new games have six empty placements and independent state', () => {
  const state = createGame(puzzle);
  assert.deepEqual(state, {
    puzzleId: puzzle.id, placements: Array(6).fill(null), attempts: 0, hints: 0, status: 'playing',
  });
  assert.notEqual(state.placements, createGame(puzzle).placements);
});

test('insertion preserves the seed and ordered pair at all five gaps', () => {
  for (const [seed, answer, letters, gap] of examples) {
    assert.equal(buildWord(seed, letters, gap), answer);
  }
  assert.equal(buildWord('REST', 'AR', 0), 'ARREST');
  assert.equal(buildWord('REST', 'RA', 0), 'RAREST');
  for (const args of [
    ['REST', 'AR', -1], ['REST', 'AR', 5], ['REST', 'AR', 0.5],
    ['REST', 'A', 0], ['REST', 'ARS', 0], ['RESTS', 'AR', 0],
    ['REST', 'A1', 0], [null, 'AR', 0], ['REST', null, 0],
  ]) assert.equal(buildWord(...args), null);
});

test('correct submissions score once, lock their row and consume exactly one tile', () => {
  let state = createGame(puzzle);
  const untouched = clone(state);
  Object.freeze(state.placements);
  Object.freeze(state);
  for (const row of [2, 5, 0, 3, 1, 4]) {
    const before = state;
    const result = submitPlacement(puzzle, state, correct(row));
    assert.equal(result.accepted, true);
    assert.equal(result.changed, true);
    assert.equal(result.reason, null);
    assert.equal(result.word, puzzle.rows[row].answer);
    assert.equal(result.state.attempts, before.attempts + 1);
    assert.deepEqual(result.state.placements[row], { tileId: puzzle.tiles[row].id, gap: examples[row][3] });
    assert.equal(before.placements[row], null, 'the caller\'s state stays unchanged');
    state = result.state;
    const placed = state.placements.filter(Boolean);
    assert.equal(new Set(placed.map(item => item.tileId)).size, placed.length);
  }
  assert.equal(state.status, 'won');
  assert.equal(state.attempts, 6);
  assert.deepEqual(createGame(puzzle), untouched);
});

test('a wrong valid fit costs an attempt without consuming its tile', () => {
  const original = createGame(puzzle);
  const wrong = { row: 0, tileId: 'tile-0', gap: 1 };
  const result = submitPlacement(puzzle, original, wrong);
  assert.equal(result.accepted, false);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'no-fit');
  assert.equal(result.word, 'RAREST', 'a real word still must answer the clue');
  assert.equal(result.state.attempts, 1);
  assert.deepEqual(result.state.placements, original.placements);
  assert.equal(original.attempts, 0);
  const retried = submitPlacement(puzzle, result.state, wrong).state;
  assert.equal(retried.attempts, 2, 'each explicit wrong submission counts');
  const accepted = submitPlacement(puzzle, retried, correct(0));
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.state.attempts, 3);
});

test('malformed submissions are unscored no-ops', () => {
  const state = createGame(puzzle);
  for (const placement of [
    null, undefined, [], {}, { ...correct(0), row: -1 }, { ...correct(0), row: 6 },
    { ...correct(0), row: 0.5 }, { ...correct(0), row: '0' },
    { ...correct(0), gap: -1 }, { ...correct(0), gap: 5 },
    { ...correct(0), gap: 1.5 }, { ...correct(0), gap: '0' },
    { ...correct(0), tileId: 'missing' }, { ...correct(0), tileId: null },
  ]) {
    const result = submitPlacement(puzzle, state, placement);
    assert.equal(result.state, state);
    assert.equal(result.changed, false);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, 'invalid');
    assert.equal(result.word, null);
  }
});

test('a consumed tile and a solved row cannot be submitted again', () => {
  const state = submitPlacement(puzzle, createGame(puzzle), correct(0)).state;
  for (const [placement, reason] of [
    [correct(0), 'locked'],
    [{ row: 0, tileId: 'tile-1', gap: 0 }, 'locked'],
    [{ row: 1, tileId: 'tile-0', gap: 0 }, 'used'],
  ]) {
    const result = submitPlacement(puzzle, state, placement);
    assert.equal(result.state, state);
    assert.equal(result.changed, false);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, reason);
    assert.equal(state.attempts, 1);
  }
});

test('the bank is authoritative and pairs cannot be reversed by a submission', () => {
  const result = submitPlacement(puzzle, createGame(puzzle), {
    ...correct(0), letters: 'RA', word: 'RAREST', answer: 'RAREST',
  });
  assert.equal(result.word, 'ARREST');
  assert.equal(result.accepted, true);
  assert.deepEqual(result.state.placements[0], { tileId: 'tile-0', gap: 0 });
});

test('finding a hint is pure and using it counts without placing a tile', () => {
  const state = submitPlacement(puzzle, createGame(puzzle), correct(2)).state;
  const before = clone(state);
  const hint = findHint(puzzle, state);
  assert.ok(hint);
  assert.notEqual(hint.row, 2);
  assert.notEqual(hint.tileId, puzzle.tiles[2].id);
  assert.equal(typeof hint.message, 'string');
  assert.ok(hint.message.includes(puzzle.tiles.find(tile => tile.id === hint.tileId).letters));
  assert.equal(submitPlacement(puzzle, state, hint).accepted, true);
  assert.deepEqual(state, before);
  const used = useHint(puzzle, state);
  assert.deepEqual(used.hint, hint);
  assert.equal(used.state.hints, 1);
  assert.equal(used.state.attempts, state.attempts);
  assert.deepEqual(used.state.placements, state.placements);
  assert.equal(useHint(puzzle, used.state).state.hints, 2);
});

test('hints can finish every unsolved row without reusing a tile', () => {
  let state = createGame(puzzle);
  for (let step = 0; step < 6; step++) {
    const hinted = useHint(puzzle, state);
    assert.ok(hinted.hint);
    const result = submitPlacement(puzzle, hinted.state, hinted.hint);
    assert.equal(result.accepted, true);
    state = result.state;
    assert.equal(state.attempts, step + 1);
    assert.equal(state.hints, step + 1);
    assert.equal(state.placements.filter(Boolean).length, step + 1);
  }
  assert.equal(state.status, 'won');
  assert.equal(findHint(puzzle, state), null);
});

test('reveal fills the solution and preserves attempts without awarding a win', () => {
  let state = submitPlacement(puzzle, createGame(puzzle), correct(3)).state;
  state = submitPlacement(puzzle, state, { row: 0, tileId: 'tile-0', gap: 1 }).state;
  state = useHint(puzzle, state).state;
  const before = clone(state);
  const revealed = revealGame(puzzle, state);
  assert.equal(revealed.status, 'revealed');
  assert.equal(revealed.attempts, 2);
  assert.equal(revealed.hints, 1);
  assert.deepEqual(revealed.placements[3], state.placements[3]);
  for (const [row, placement] of revealed.placements.entries()) {
    const tile = puzzle.tiles.find(item => item.id === placement.tileId);
    assert.equal(buildWord(puzzle.rows[row].seed, tile.letters, placement.gap), puzzle.rows[row].answer);
  }
  assert.equal(new Set(revealed.placements.map(item => item.tileId)).size, 6);
  assert.deepEqual(state, before);
});

test('won and revealed games are immutable terminal results', () => {
  for (const state of [solve(), revealGame(puzzle, createGame(puzzle))]) {
    const attempt = submitPlacement(puzzle, state, correct(0));
    assert.equal(attempt.state, state);
    assert.equal(attempt.reason, 'finished');
    assert.equal(attempt.changed, false);
    assert.equal(attempt.accepted, false);
    assert.equal(findHint(puzzle, state), null);
    assert.deepEqual(useHint(puzzle, state), { state, hint: null });
    assert.equal(useHint(puzzle, state).state, state);
    assert.equal(revealGame(puzzle, state), state);
  }
});

test('wrong submissions have no attempt limit or terminal penalty', () => {
  let state = createGame(puzzle);
  for (let count = 0; count < 200; count++) {
    state = submitPlacement(puzzle, state, { row: 0, tileId: 'tile-0', gap: 1 }).state;
  }
  assert.equal(state.status, 'playing');
  assert.equal(state.attempts, 200);
  assert.deepEqual(state.placements, Array(6).fill(null));
  assert.equal(solve(puzzle, state).attempts, 206);
});

test('saved placements and counters round-trip without sharing mutable objects', () => {
  let state = submitPlacement(puzzle, createGame(puzzle), correct(0)).state;
  state = useHint(puzzle, state).state;
  const raw = clone(state);
  const restored = restoreGame(puzzle, raw);
  assert.deepEqual(restored, state);
  assert.notEqual(restored.placements, raw.placements);
  assert.notEqual(restored.placements[0], raw.placements[0]);
  raw.placements[0].gap = 4;
  assert.equal(restored.placements[0].gap, 0);
});

test('damaged saves reset instead of admitting impossible placements or counters', () => {
  const fresh = createGame(puzzle);
  const state = submitPlacement(puzzle, fresh, correct(0)).state;
  const holey = Array(6);
  holey[0] = state.placements[0];
  const badSaves = [
    null, undefined, [], {}, 'saved', { ...state, puzzleId: 'other' },
    { ...state, status: 'mystery' }, { ...state, status: undefined },
    { ...state, placements: null }, { ...state, placements: {} },
    { ...state, placements: state.placements.slice(0, 5) },
    { ...state, placements: [...state.placements, null] },
    { ...state, placements: holey },
    { ...state, placements: [{ tileId: 'tile-0', gap: 1 }, ...state.placements.slice(1)] },
    { ...state, placements: [{ tileId: 'missing', gap: 0 }, ...state.placements.slice(1)] },
    { ...state, placements: [{ tileId: 'tile-0', gap: 0.5 }, ...state.placements.slice(1)] },
    { ...state, placements: [{ tileId: 'tile-0', gap: '0' }, ...state.placements.slice(1)] },
    { ...state, placements: [false, ...state.placements.slice(1)] },
    { ...state, placements: [[], ...state.placements.slice(1)] },
    { ...state, attempts: 0 }, { ...state, attempts: -1 }, { ...state, attempts: 1.5 },
    { ...state, attempts: '1' }, { ...state, attempts: NaN }, { ...state, attempts: Infinity },
    { ...state, attempts: Number.MAX_SAFE_INTEGER + 1 },
    { ...state, hints: -1 }, { ...state, hints: 0.5 }, { ...state, hints: Infinity },
    { ...state, hints: '0' }, { ...state, hints: undefined },
    { ...state, status: 'revealed' },
  ];
  for (const raw of badSaves) assert.deepEqual(restoreGame(puzzle, raw), fresh);
});

test('equal letter pairs are distinct tiles and saved games cannot reuse one ID', () => {
  const repeated = {
    ...puzzle, id: 'repeated-pair',
    rows: puzzle.rows.map((row, index) => index === 1 ? { ...puzzle.rows[0] } : row),
    tiles: puzzle.tiles.map((tile, index) => index === 1 ? { ...tile, letters: 'AR' } : tile),
  };
  const fresh = createGame(repeated);
  const repeatedID = { ...fresh, attempts: 2, placements: [
    { tileId: 'tile-0', gap: 0 }, { tileId: 'tile-0', gap: 0 }, null, null, null, null,
  ] };
  assert.deepEqual(restoreGame(repeated, repeatedID), fresh);
  const won = solve(repeated);
  assert.equal(won.status, 'won');
  assert.equal(new Set(won.placements.map(item => item.tileId)).size, 6);
});

test('restore derives wins from the placements and preserves an honest reveal', () => {
  const partial = submitPlacement(puzzle, createGame(puzzle), correct(0)).state;
  assert.equal(restoreGame(puzzle, { ...partial, status: 'won' }).status, 'playing');
  const won = solve();
  assert.deepEqual(restoreGame(puzzle, { ...won, status: 'playing' }), won);
  assert.deepEqual(restoreGame(puzzle, { ...won, attempts: 5 }), createGame(puzzle));
  const revealed = revealGame(puzzle, createGame(puzzle));
  assert.equal(revealed.attempts, 0);
  assert.deepEqual(restoreGame(puzzle, clone(revealed)), revealed);
  assert.equal(restoreGame(puzzle, { ...revealed, attempts: 3 }).status, 'revealed');
});

test('Chicago dates turn over at local midnight through both DST changes', () => {
  assert.equal(EPOCH, '2026-10-20');
  for (const [instant, expected] of [
    ['2026-10-20T04:59:59Z', '2026-10-19'], ['2026-10-20T05:00:00Z', '2026-10-20'],
    ['2026-03-08T05:59:59Z', '2026-03-07'], ['2026-03-08T06:00:00Z', '2026-03-08'],
    ['2026-03-09T04:59:59Z', '2026-03-08'], ['2026-03-09T05:00:00Z', '2026-03-09'],
    ['2026-11-01T06:30:00Z', '2026-11-01'], ['2026-11-01T07:30:00Z', '2026-11-01'],
    ['2026-11-02T05:59:59Z', '2026-11-01'], ['2026-11-02T06:00:00Z', '2026-11-02'],
  ]) assert.equal(getDateKey(new Date(instant)), expected);
});

test('puzzle numbers use calendar days and daily selection cycles in both directions', () => {
  assert.equal(getDayNumber(EPOCH), 1);
  assert.equal(getDayNumber('2026-10-19'), 0);
  assert.equal(getDayNumber('2026-11-02'), 14);
  assert.equal(getDayNumber('2026-03-09') - getDayNumber('2026-03-08'), 1);
  for (const invalid of ['', '2026-02-30', '2026-13-01', '2026-1-01', null]) {
    assert.ok(Number.isNaN(getDayNumber(invalid)));
  }
  const bank = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  assert.deepEqual(getDaily(bank, new Date('2026-10-20T12:00:00Z')), {
    puzzle: bank[0], dateKey: '2026-10-20', number: 1,
  });
  assert.equal(getDaily(bank, new Date('2026-10-19T12:00:00Z')).puzzle.id, 'three');
  assert.equal(getDaily(bank, new Date('2026-10-18T12:00:00Z')).puzzle.id, 'two');
  assert.equal(getDaily(bank, new Date('2026-10-23T12:00:00Z')).puzzle.id, 'one');
  assert.throws(() => getDaily([]), RangeError);
});

test('statistics count terminal plays, honest perfect wins, and calendar streaks', () => {
  const win = { status: 'won', attempts: 6, hints: 0 };
  const records = {
    '2026-10-15': win, '2026-10-16': win,
    '2026-10-17': { status: 'revealed', attempts: 4, hints: 0 },
    '2026-10-18': { ...win, attempts: 9 }, '2026-10-19': { ...win, hints: 1 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), {
    played: 5, won: 4, streak: 2, bestStreak: 2, perfect: 2, averageAttempts: 6.8,
  });
  assert.equal(getStats(records, '2026-10-21').streak, 0);
  assert.equal(getStats({ ...records, '2026-10-20': win }, '2026-10-20').streak, 3);
  assert.equal(getStats({ ...records, '2026-10-20': { ...win, status: 'revealed' } }, '2026-10-20').streak, 0);
});

test('statistics ignore invalid dates, incomplete records, and impossible counters', () => {
  const empty = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageAttempts: 0 };
  for (const raw of [null, undefined, [], 42]) assert.deepEqual(getStats(raw, EPOCH), empty);
  const win = { status: 'won', attempts: 6, hints: 0 };
  assert.deepEqual(getStats({
    '2026-02-30': win, '2026-10-01': null,
    '2026-10-02': { ...win, status: 'playing' }, '2026-10-03': { ...win, attempts: 5 },
    '2026-10-04': { ...win, attempts: Infinity }, '2026-10-05': { ...win, hints: -1 },
    '2026-10-06': { ...win, attempts: 6.5 }, '2026-10-07': { ...win, hints: '0' },
  }, EPOCH), empty);
  const invalidToday = getStats({ '2026-10-19': win }, 'invalid');
  assert.equal(invalidToday.won, 1);
  assert.equal(invalidToday.streak, 0);
  assert.equal(invalidToday.bestStreak, 1);
});

test('sharing a win contains six squares, attempt and hint counts, and no answers', () => {
  const text = formatShare(puzzle, solve(), { number: 1, mode: 'daily', url: 'https://example.test/inbetween/' });
  assert.equal(text, [
    'INBETWEEN #001', '🟩🟩🟩🟩🟩🟩', '6 attempts · 0 hints · Perfect',
    'https://example.test/inbetween/',
  ].join('\n'));
  for (const row of puzzle.rows) {
    assert.ok(!text.includes(row.answer));
    assert.ok(!text.includes(row.clue));
  }
});

test('practice, partial, hinted and revealed shares remain distinguishable', () => {
  const partial = useHint(puzzle, submitPlacement(puzzle, createGame(puzzle), correct(0)).state).state;
  const progress = formatShare(puzzle, partial, { mode: 'practice' });
  assert.ok(progress.startsWith('INBETWEEN Practice\n🟩⬜⬜⬜⬜⬜'));
  assert.ok(progress.includes('1 attempt · 1 hint'));
  assert.ok(!progress.includes('Perfect'));
  assert.ok(!progress.includes('undefined'));
  const wonWithHint = solve(puzzle, partial);
  assert.ok(!formatShare(puzzle, wonWithHint).includes('Perfect'));
  const revealed = formatShare(puzzle, revealGame(puzzle, partial), { number: 12 });
  assert.ok(revealed.startsWith('INBETWEEN #012\n🟨🟨🟨🟨🟨🟨'));
  assert.ok(revealed.includes('Revealed'));
  assert.ok(!revealed.includes('Perfect'));
  for (const row of puzzle.rows) assert.ok(!revealed.includes(row.answer));
});

function fitsFor(board, row) {
  const { seed, answer } = board.rows[row];
  return board.tiles.flatMap(tile => Array.from({ length: 5 }, (_, gap) => ({ row, tileId: tile.id, gap }))
    .filter(({ gap }) => seed.slice(0, gap) + tile.letters + seed.slice(gap) === answer));
}

test('published boards have six valid rows and one unique bank tile for every answer', () => {
  assert.ok(PUZZLES.length > 0);
  assert.equal(new Set(PUZZLES.map(board => board.id)).size, PUZZLES.length);
  for (const board of PUZZLES) {
    assert.equal(board.rows.length, 6, board.id);
    assert.equal(board.tiles.length, 6, board.id);
    assert.ok(typeof board.title === 'string' && board.title.trim().length > 0, board.id);
    assert.ok(typeof board.difficulty === 'string' && board.difficulty.trim().length > 0, board.id);
    assert.equal(new Set(board.tiles.map(tile => tile.id)).size, 6, board.id);
    for (const tile of board.tiles) {
      assert.ok(typeof tile.id === 'string' && tile.id.length > 0, board.id);
      assert.match(tile.letters, /^[A-Z]{2}$/, board.id);
    }
    const assigned = new Set();
    for (let row = 0; row < 6; row++) {
      assert.match(board.rows[row].seed, /^[A-Z]{4}$/, board.id);
      assert.match(board.rows[row].answer, /^[A-Z]{6}$/, board.id);
      assert.ok(typeof board.rows[row].clue === 'string' && board.rows[row].clue.trim().length > 0, board.id);
      const fits = fitsFor(board, row);
      assert.ok(fits.length > 0, `${board.id}: row ${row + 1} must have a solution`);
      assert.equal(new Set(fits.map(fit => fit.tileId)).size, 1, `${board.id}: row ${row + 1} must identify one tile`);
      assigned.add(fits[0].tileId);
      for (const fit of fits) {
        const result = submitPlacement(board, createGame(board), fit);
        assert.equal(result.accepted, true, `${board.id}: every equivalent correct gap is valid`);
      }
    }
    assert.equal(assigned.size, 6, `${board.id}: every bank tile is used exactly once`);
  }
});

test('every published board can finish by hints from all 64 solved-row subsets', () => {
  for (const board of PUZZLES) {
    const choices = board.rows.map((_, row) => fitsFor(board, row)[0]);
    for (let mask = 0; mask < 64; mask++) {
      let state = createGame(board);
      for (let row = 0; row < 6; row++) {
        if (mask & (1 << row)) state = submitPlacement(board, state, choices[row]).state;
      }
      const placed = state.placements.filter(Boolean).length;
      assert.deepEqual(restoreGame(board, clone(state)), state, `${board.id}: valid partial saves restore`);
      for (let step = 0; step < 6 && state.status === 'playing'; step++) {
        const hinted = useHint(board, state);
        assert.ok(hinted.hint, `${board.id}: subset ${mask} needs a usable hint`);
        assert.deepEqual(hinted.state.placements, state.placements);
        const result = submitPlacement(board, hinted.state, hinted.hint);
        assert.equal(result.accepted, true, `${board.id}: a hint must fit without conflict`);
        state = result.state;
      }
      assert.equal(state.status, 'won', `${board.id}: subset ${mask} must finish`);
      assert.equal(state.attempts, 6);
      assert.equal(state.hints, 6 - placed);
      assert.equal(new Set(state.placements.map(item => item.tileId)).size, 6);
    }
  }
});

test('future-dated records do not inflate current statistics', () => {
  const win={status:'won',attempts:6,hints:0};
  assert.deepEqual(getStats({'2026-10-29':win,'2027-01-01':win},'2026-10-29'),getStats({'2026-10-29':win},'2026-10-29'));
});
