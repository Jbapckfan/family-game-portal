import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EPOCH, MAX_SCANS, getDateKey, getDayNumber, getDaily, createGame,
  countLetters, submitScan, submitPick, toggleElimination, possibleWords,
  findHint, useHint, revealGame, restoreGame, getStats, formatShare,
} from '../engine.mjs';

const puzzle = {
  id: 'test-shortlist', title: 'Small signals. Big deductions.', difficulty: 'Sharp',
  words: 'CRANE BRICK GHOST PLUMB FJORD WATCH SILKY DROWN MAPLE SCOUT FLING QUEST'.split(' '),
  answer: 'MAPLE',
};
const clone = value => JSON.parse(JSON.stringify(value));
const scanAll = (board = puzzle) => ['CR', 'IL', 'AC'].reduce((state, letters) => submitScan(board, state, letters).state, createGame(board));

test('new state has three available scans and no marks, pick, or assistance', () => {
  assert.equal(MAX_SCANS, 3);
  assert.deepEqual(createGame(puzzle), {
    puzzleId: puzzle.id, scans: [], eliminated: [], pick: null, hints: 0, hint: null, status: 'playing',
  });
  assert.notEqual(createGame(puzzle).scans, createGame(puzzle).scans);
});

test('a scan counts presence of distinct letters, not occurrences or positions', () => {
  assert.equal(countLetters('LEVEL', 'EL'), 2);
  assert.equal(countLetters('LEVEL', 'AL'), 1);
  assert.equal(countLetters('LEVEL', 'XY'), 0);
  assert.equal(countLetters('MAPLE', 'ae'), 2);
  for (const pair of ['AA', 'A', 'ABC', 'A1', null, {}, ['A', 'E']]) {
    assert.equal(countLetters('MAPLE', pair), null);
  }
  assert.equal(countLetters(null, 'AE'), null);
});

test('accepted scans are normalized, scored once, and preserve earlier state', () => {
  const fresh = createGame(puzzle);
  Object.freeze(fresh.scans);
  Object.freeze(fresh.eliminated);
  Object.freeze(fresh);
  const result = submitScan(puzzle, fresh, 'ra');
  assert.equal(result.accepted, true);
  assert.equal(result.changed, true);
  assert.equal(result.reason, null);
  assert.deepEqual(result.scan, { letters: 'AR', count: 1 });
  assert.deepEqual(result.state.scans, [{ letters: 'AR', count: 1 }]);
  assert.equal(fresh.scans.length, 0);
  assert.equal(result.state.status, 'playing');
});

test('malformed and repeated scans, including reversals, spend no scans', () => {
  const state = submitScan(puzzle, createGame(puzzle), 'AR').state;
  for (const [letters, reason] of [['RA', 'repeated'], ['ar', 'repeated'], ['AA', 'invalid'], ['ABC', 'invalid'], ['', 'invalid'], [null, 'invalid']]) {
    const result = submitScan(puzzle, state, letters);
    assert.equal(result.state, state);
    assert.equal(result.changed, false);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, reason);
    assert.equal(result.scan, null);
  }
});

test('three scans exhaust only the scan budget; the final pick remains available', () => {
  const state = scanAll();
  assert.equal(state.scans.length, 3);
  assert.equal(state.status, 'playing');
  const result = submitScan(puzzle, state, 'MT');
  assert.equal(result.state, state);
  assert.equal(result.reason, 'no-scans');
  assert.equal(submitPick(puzzle, state, 'MAPLE').state.status, 'won');
});

test('only board words are valid final picks and normalized lowercase is accepted', () => {
  const fresh = createGame(puzzle);
  for (const word of ['', 'APPLE', 'M A P L E', null, {}, 3]) {
    const result = submitPick(puzzle, fresh, word);
    assert.equal(result.state, fresh);
    assert.equal(result.changed, false);
    assert.equal(result.reason, 'invalid');
  }
  const result = submitPick(puzzle, fresh, 'maple');
  assert.equal(result.accepted, true);
  assert.equal(result.state.status, 'won');
  assert.equal(result.state.pick, 'MAPLE');
  assert.equal(result.state.scans.length, 0);
});

test('a wrong final pick is an immediate loss even before using all scans', () => {
  const result = submitPick(puzzle, createGame(puzzle), 'CRANE');
  assert.equal(result.accepted, false);
  assert.equal(result.changed, true);
  assert.equal(result.reason, 'wrong');
  assert.equal(result.state.status, 'lost');
  assert.equal(result.state.pick, 'CRANE');
  assert.equal(result.state.scans.length, 0);
});

test('pencil marks are unscored, reversible notes and never alter the real candidates', () => {
  const state = submitScan(puzzle, createGame(puzzle), 'CR').state;
  const before = clone(state);
  const marked = toggleElimination(puzzle, state, 'MAPLE');
  assert.deepEqual(marked.eliminated, ['MAPLE']);
  assert.deepEqual(marked.scans, state.scans);
  assert.equal(marked.hints, 0);
  assert.deepEqual(possibleWords(puzzle, marked), possibleWords(puzzle, state));
  assert.ok(possibleWords(puzzle, marked).includes('MAPLE'));
  assert.deepEqual(toggleElimination(puzzle, marked, 'MAPLE'), before);
  assert.equal(toggleElimination(puzzle, state, 'APPLE'), state);
  assert.deepEqual(state, before);
  assert.equal(submitPick(puzzle, marked, 'MAPLE').state.status, 'won');
});

test('visible scan evidence narrows the opening board to one word', () => {
  let state = createGame(puzzle);
  assert.equal(possibleWords(puzzle, state).length, 12);
  state = submitScan(puzzle, state, 'CR').state;
  assert.deepEqual(possibleWords(puzzle, state), ['GHOST', 'PLUMB', 'SILKY', 'MAPLE', 'FLING', 'QUEST']);
  state = submitScan(puzzle, state, 'IL').state;
  assert.deepEqual(possibleWords(puzzle, state), ['PLUMB', 'MAPLE']);
  state = submitScan(puzzle, state, 'AC').state;
  assert.deepEqual(possibleWords(puzzle, state), ['MAPLE']);
  assert.deepEqual(state.scans.map(scan => scan.count), [0, 1, 1]);
});

test('a useful hint is determined by visible evidence, never the secret word', () => {
  const state = createGame(puzzle);
  const hinted = useHint(puzzle, state);
  assert.equal(hinted.state.hints, 1);
  assert.equal(hinted.state.scans.length, 0);
  assert.equal(hinted.hint.type, 'scan');
  assert.match(hinted.hint.letters, /^[A-Z]{2}$/);
  assert.ok(!hinted.hint.message.includes(puzzle.answer));
  assert.deepEqual(findHint({ ...puzzle, answer: 'FJORD' }, state), hinted.hint);
  const groups = new Set(puzzle.words.map(word => countLetters(word, hinted.hint.letters)));
  assert.ok(groups.size > 1);
  assert.deepEqual(useHint(puzzle, hinted.state), { state: hinted.state, hint: null });
});

test('hint after the last scan explains remaining deduction without revealing the answer', () => {
  const state = scanAll();
  const { hint, state: assisted } = useHint(puzzle, state);
  assert.equal(hint.type, 'deduction');
  assert.equal(hint.letters, null);
  assert.ok(!hint.message.includes('MAPLE'));
  assert.equal(assisted.hints, 1);
  assert.deepEqual(assisted.scans, state.scans);
});

test('a paid hint survives refresh and later scans with its original evidence context', () => {
  const before = submitScan(puzzle, createGame(puzzle), 'CR').state;
  const assisted = useHint(puzzle, before);
  const savedHint = { ...assisted.hint, scanCount: before.scans.length };
  assert.deepEqual(assisted.state.hint, savedHint);
  const reloaded = restoreGame(puzzle, clone(assisted.state));
  assert.deepEqual(reloaded.hint, savedHint);
  assert.equal(reloaded.hints, 1);
  assert.equal(useHint(puzzle, reloaded).hint, null);
  const later = submitScan(puzzle, reloaded, assisted.hint.letters).state;
  assert.deepEqual(restoreGame(puzzle, clone(later)).hint, savedHint);
  assert.notEqual(reloaded.hint, assisted.state.hint);
});

test('older assisted saves recover a useful hint without spending another hint', () => {
  const legacy = { ...submitScan(puzzle, createGame(puzzle), 'CR').state, hints: 1 };
  delete legacy.hint;
  const restored = restoreGame(puzzle, clone(legacy));
  const expected = findHint(puzzle, { ...legacy, hints: 0 });
  assert.deepEqual(restored.hint, { ...expected, scanCount: legacy.scans.length });
  assert.equal(restored.hints, 1);
  assert.deepEqual(restored.scans, legacy.scans);
  assert.ok(!restored.hint.message.includes(puzzle.answer));
});

test('restoration rejects a forged hint payload or impossible hint context', () => {
  const assisted = useHint(puzzle, submitScan(puzzle, createGame(puzzle), 'CR').state).state;
  const stored = { ...findHint(puzzle, { ...assisted, hints: 0 }), scanCount: 1 };
  const fresh = createGame(puzzle);
  for (const hint of [
    { ...stored, scanCount: 2 }, { ...stored, scanCount: -1 },
    { ...stored, message: `The secret is ${puzzle.answer}.` },
    { ...stored, letters: 'ZZ' }, { ...stored, type: 'answer' },
  ]) assert.deepEqual(restoreGame(puzzle, { ...assisted, hint }), fresh);
  assert.deepEqual(restoreGame(puzzle, { ...fresh, hint: stored }), fresh);
});

test('a unique deduction can be recognized early without spending another scan', () => {
  const board = { ...puzzle, answer: 'WATCH' };
  let state = submitScan(board, createGame(board), 'CR').state;
  state = submitScan(board, state, 'AC').state;
  assert.deepEqual(possibleWords(board, state), ['WATCH']);
  assert.equal(findHint(board, state).type, 'deduction');
  assert.equal(submitPick(board, state, 'WATCH').state.scans.length, 2);
});

test('reveal preserves honest scan history and marks, and never awards a win', () => {
  const state = toggleElimination(puzzle, submitScan(puzzle, createGame(puzzle), 'CR').state, 'BRICK');
  const revealed = revealGame(puzzle, state);
  assert.equal(revealed.status, 'revealed');
  assert.equal(revealed.pick, null);
  assert.deepEqual(revealed.scans, state.scans);
  assert.deepEqual(revealed.eliminated, ['BRICK']);
  assert.equal(state.status, 'playing');
});

test('won, lost, and revealed states are immutable terminal results', () => {
  const fresh = createGame(puzzle);
  const ends = [submitPick(puzzle, fresh, 'MAPLE').state, submitPick(puzzle, fresh, 'CRANE').state, revealGame(puzzle, fresh)];
  for (const state of ends) {
    assert.equal(submitScan(puzzle, state, 'AE').state, state);
    assert.equal(submitScan(puzzle, state, 'AE').reason, 'finished');
    assert.equal(submitPick(puzzle, state, 'MAPLE').state, state);
    assert.equal(submitPick(puzzle, state, 'MAPLE').reason, 'finished');
    assert.equal(toggleElimination(puzzle, state, 'BRICK'), state);
    assert.equal(findHint(puzzle, state), null);
    assert.deepEqual(useHint(puzzle, state), { state, hint: null });
    assert.equal(revealGame(puzzle, state), state);
  }
});

test('restoration round-trips valid playing and all terminal states without mutable aliases', () => {
  const state = toggleElimination(puzzle, useHint(puzzle, scanAll()).state, 'BRICK');
  const values = [state, submitPick(puzzle, state, 'MAPLE').state, submitPick(puzzle, state, 'CRANE').state, revealGame(puzzle, state)];
  for (const value of values) {
    const raw = clone(value);
    const restored = restoreGame(puzzle, raw);
    assert.deepEqual(restored, value);
    assert.notEqual(restored.scans, raw.scans);
    assert.notEqual(restored.scans[0], raw.scans[0]);
    assert.notEqual(restored.eliminated, raw.eliminated);
  }
});

test('restoration derives won/lost from the actual final pick, not a forged status label', () => {
  const fresh = createGame(puzzle);
  assert.equal(restoreGame(puzzle, { ...fresh, status: 'won' }).status, 'playing');
  assert.equal(restoreGame(puzzle, { ...fresh, status: 'lost' }).status, 'playing');
  assert.equal(restoreGame(puzzle, { ...fresh, pick: 'MAPLE' }).status, 'won');
  assert.equal(restoreGame(puzzle, { ...fresh, status: 'won', pick: 'CRANE' }).status, 'lost');
  assert.deepEqual(restoreGame(puzzle, { ...fresh, status: 'revealed', pick: 'MAPLE' }), fresh);
});

test('damaged saves reset instead of accepting impossible scans, marks, or counters', () => {
  const fresh = createGame(puzzle);
  const state = submitScan(puzzle, fresh, 'CR').state;
  const invalid = [
    null, undefined, [], {}, 5, { ...state, puzzleId: 'other' }, { ...state, status: 'unknown' },
    { ...state, hints: -1 }, { ...state, hints: 2 }, { ...state, hints: 0.5 }, { ...state, hints: '0' },
    { ...state, scans: null }, { ...state, scans: [{}] }, { ...state, scans: [{ letters: 'AA', count: 1 }] },
    { ...state, scans: [{ letters: 'CR', count: 2 }] }, { ...state, scans: [{ letters: 'CR', count: '0' }] },
    { ...state, scans: [{ letters: 'CR', count: 0 }, { letters: 'RC', count: 0 }] },
    { ...state, scans: ['CR', 'IL', 'AC', 'AD'].map(letters => ({ letters, count: countLetters('MAPLE', letters) })) },
    { ...state, eliminated: null }, { ...state, eliminated: ['APPLE'] }, { ...state, eliminated: ['BRICK', 'BRICK'] },
    { ...state, pick: 'APPLE' }, { ...state, pick: 42 }, { ...state, pick: undefined },
  ];
  for (const raw of invalid) assert.deepEqual(restoreGame(puzzle, raw), fresh, JSON.stringify(raw));
});

test('Chicago date rollover and day numbers work across both daylight saving transitions', () => {
  assert.equal(EPOCH, '2026-10-20');
  for (const [instant, key] of [
    ['2026-10-20T04:59:59Z', '2026-10-19'], ['2026-10-20T05:00:00Z', '2026-10-20'],
    ['2026-03-08T05:59:59Z', '2026-03-07'], ['2026-03-08T06:00:00Z', '2026-03-08'],
    ['2026-03-09T05:00:00Z', '2026-03-09'], ['2026-11-01T06:30:00Z', '2026-11-01'],
    ['2026-11-01T07:30:00Z', '2026-11-01'], ['2026-11-02T05:59:59Z', '2026-11-01'],
    ['2026-11-02T06:00:00Z', '2026-11-02'],
  ]) assert.equal(getDateKey(new Date(instant)), key);
  assert.equal(getDayNumber(EPOCH), 1);
  assert.equal(getDayNumber('2026-11-02'), 14);
  for (const key of ['', '2026-02-30', '2026-13-01', '2026-1-01', null]) assert.ok(Number.isNaN(getDayNumber(key)));
});

test('daily collection cycles deterministically, including before the epoch', () => {
  const boards = [{ id: 'first' }, { id: 'second' }];
  assert.deepEqual(getDaily(boards, new Date('2026-10-20T12:00:00Z')), { puzzle: boards[0], dateKey: EPOCH, number: 1 });
  assert.equal(getDaily(boards, new Date('2026-10-21T12:00:00Z')).puzzle.id, 'second');
  assert.equal(getDaily(boards, new Date('2026-10-22T12:00:00Z')).puzzle.id, 'first');
  assert.equal(getDaily(boards, new Date('2026-10-19T12:00:00Z')).puzzle.id, 'second');
  assert.throws(() => getDaily([]), RangeError);
});

test('statistics count terminal plays, assistance, average scans, and honest streaks', () => {
  const win = { status: 'won', scans: 3, hints: 0 };
  const records = {
    '2026-10-15': win, '2026-10-16': win,
    '2026-10-17': { status: 'lost', scans: 3, hints: 0 },
    '2026-10-18': { ...win, scans: 2 }, '2026-10-19': { ...win, hints: 1 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), { played: 5, won: 4, streak: 2, bestStreak: 2, unassisted: 3, averageScans: 2.8 });
  assert.equal(getStats(records, '2026-10-21').streak, 0);
  assert.equal(getStats({ ...records, '2026-10-20': win }, '2026-10-20').streak, 3);
  for (const status of ['lost', 'revealed']) assert.equal(getStats({ ...records, '2026-10-20': { ...win, status } }, '2026-10-20').streak, 0);
});

test('statistics ignore malformed records and impossible scan counts', () => {
  const empty = { played: 0, won: 0, streak: 0, bestStreak: 0, unassisted: 0, averageScans: 0 };
  for (const raw of [null, undefined, [], 5]) assert.deepEqual(getStats(raw, EPOCH), empty);
  const win = { status: 'won', scans: 3, hints: 0 };
  assert.deepEqual(getStats({
    '2026-02-30': win, '2026-10-01': null, '2026-10-02': { ...win, status: 'playing' },
    '2026-10-03': { ...win, scans: -1 }, '2026-10-04': { ...win, scans: 4 },
    '2026-10-05': { ...win, hints: 2 }, '2026-10-06': { ...win, scans: 1.5 },
    '2026-10-07': { ...win, scans: '3' },
  }, EPOCH), empty);
});

test('future records cannot inflate played totals, streaks, assistance, or scan averages', () => {
  const records = {
    '2026-10-19': { status: 'won', scans: 3, hints: 1 },
    '2026-10-21': { status: 'won', scans: 0, hints: 0 },
    '2026-10-22': { status: 'won', scans: 0, hints: 0 },
    '2026-10-23': { status: 'revealed', scans: 0, hints: 0 },
  };
  assert.deepEqual(getStats(records, '2026-10-20'), {
    played: 1, won: 1, streak: 1, bestStreak: 1, unassisted: 0, averageScans: 3,
  });
});

test('sharing is spoiler-free and distinguishes early wins, losses, practice, and reveals', () => {
  const state = submitPick(puzzle, scanAll(), 'MAPLE').state;
  const shared = formatShare(puzzle, state, { number: 1, url: 'https://example.test/shortlist/' });
  assert.equal(shared, 'SHORTLIST #001\n🔎🔎🔎 🟩\n3 scans · 0 hints · Solved\nhttps://example.test/shortlist/');
  for (const word of puzzle.words) assert.ok(!shared.includes(word));
  for (const scan of state.scans) assert.ok(!shared.includes(scan.letters));
  assert.match(formatShare(puzzle, submitPick(puzzle, createGame(puzzle), 'CRANE').state), /🟥[\s\S]*Missed/);
  assert.match(formatShare(puzzle, revealGame(puzzle, createGame(puzzle)), { mode: 'practice' }), /^SHORTLIST Practice[\s\S]*🟨[\s\S]*Revealed/);
  assert.match(formatShare(puzzle, createGame(puzzle)), /In progress/);
});
