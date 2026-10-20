import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../engine.mjs';

export const fixture = Object.freeze({
  id: 'ring-test', title: 'Four equal arcs', difficulty: 'Sharp',
  numbers: Object.freeze([5, 4, 6, 9, 6, 7, 2, 5, 1, 8, 3, 4]),
  target: 15, sections: 4, solution: Object.freeze([2, 4, 8, 11]),
});

function withCuts(cuts, state = engine.createGame(fixture)) {
  for (const gap of cuts) state = engine.toggleCut(fixture, state, gap).state;
  return state;
}

test('Central daily dates, DST boundaries, and wrapping use calendar days', () => {
  assert.equal(engine.getDateKey(new Date('2026-10-20T04:59:59Z')), '2026-10-19');
  assert.equal(engine.getDateKey(new Date('2026-10-20T05:00:00Z')), '2026-10-20');
  assert.equal(engine.getDateKey(new Date('2026-11-01T07:30:00Z')), '2026-11-01');
  assert.equal(engine.getDayNumber('2026-10-20'), 1);
  const next = {...fixture, id: 'next'};
  assert.equal(engine.getDaily([fixture, next], new Date('2026-10-19T18:00:00Z')).puzzle.id, 'next');
  assert.equal(engine.getDaily([fixture, next], new Date('2026-10-22T18:00:00Z')).puzzle.id, fixture.id);
  assert.throws(() => engine.getDaily([]), RangeError);
});

test('the solver finds every valid cut set, independently of the authored solution', () => {
  assert.deepEqual(engine.solvePuzzle({...fixture, solution: []}), [[2, 4, 8, 11]]);
  assert.equal(engine.solvePuzzle({...fixture, target: 16}).length, 0);
  assert.equal(engine.solvePuzzle({...fixture, numbers: Array(12).fill(1), target: 3}).length, 3);
});

test('segments include the wraparound arc exactly once and preserve every number', () => {
  const segments = engine.getSegments(fixture, [2, 4, 8, 11]);
  assert.deepEqual(segments.map(s => s.indices), [[3, 4], [5, 6, 7, 8], [9, 10, 11], [0, 1, 2]]);
  assert.deepEqual(segments.map(s => s.sum), [15, 15, 15, 15]);
  assert.deepEqual(engine.getSegments(fixture, []).map(s => s.sum), [60]);
  assert.deepEqual(engine.getSegments(fixture, [5]).map(s => s.indices), [[6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5]]);
  assert.equal(new Set(segments.flatMap(s => s.indices)).size, 12);
});

test('cut toggles are immutable, capped at four, and counted even when removed', () => {
  const initial = engine.createGame(fixture);
  const next = engine.toggleCut(fixture, initial, 7);
  assert.deepEqual(initial.cuts, []);
  assert.deepEqual(next.state.cuts, [7]);
  assert.equal(next.state.moves, 1);
  assert.equal(next.changed, true);
  const removed = engine.toggleCut(fixture, next.state, 7);
  assert.deepEqual(removed.state.cuts, []);
  assert.equal(removed.state.moves, 2);
  const full = withCuts([0, 1, 2, 3]);
  assert.equal(engine.toggleCut(fixture, full, 4).reason, 'full');
  for (const gap of [-1, 12, 2.5, '2', null]) {
    const result = engine.toggleCut(fixture, initial, gap);
    assert.equal(result.changed, false);
    assert.equal(result.state, initial);
  }
});

test('only an explicit complete check wins; incomplete and repeated checks are unscored', () => {
  const initial = engine.createGame(fixture);
  assert.equal(engine.checkBoard(fixture, initial).reason, 'incomplete');
  let state = withCuts(fixture.solution);
  assert.equal(state.status, 'playing');
  const result = engine.checkBoard(fixture, state);
  assert.equal(result.accepted, true);
  assert.equal(result.state.status, 'won');
  assert.equal(result.state.checks, 1);
  assert.deepEqual(result.state.checkedSets, ['2,4,8,11']);
  assert.equal(engine.checkBoard(fixture, result.state).reason, 'finished');
});

test('wrong checks preserve all legal choices and any previously checked arrangement is unscored', () => {
  let state = withCuts([0, 1, 2, 3]);
  let result = engine.checkBoard(fixture, state);
  assert.equal(result.reason, 'wrong');
  assert.equal(result.changed, true);
  assert.equal(result.state.status, 'playing');
  assert.equal(result.state.checks, 1);
  state = engine.toggleCut(fixture, result.state, 3).state;
  state = engine.toggleCut(fixture, state, 4).state;
  state = engine.checkBoard(fixture, state).state;
  state = engine.toggleCut(fixture, state, 4).state;
  state = engine.toggleCut(fixture, state, 3).state;
  result = engine.checkBoard(fixture, state);
  assert.equal(result.reason, 'repeated');
  assert.equal(result.changed, false);
  assert.equal(result.state.checks, 2);
  for (const cut of [0, 1, 3]) state = engine.toggleCut(fixture, state, cut).state;
  for (const cut of [4, 8, 11]) state = engine.toggleCut(fixture, state, cut).state;
  assert.equal(engine.checkBoard(fixture, state).state.status, 'won');
});

test('hints add a correct cut, replace only wrong cuts on a full ring, and require Check to win', () => {
  let state = withCuts([0, 2, 4, 8]);
  const result = engine.useHint(fixture, state);
  assert.equal(result.hint.gap, 11);
  assert.equal(result.hint.removedGap, 0);
  assert.deepEqual(result.state.cuts, [2, 4, 8, 11]);
  assert.equal(result.state.hints, 1);
  assert.equal(result.state.moves, state.moves + 1);
  assert.equal(result.state.status, 'playing');
  assert.equal(engine.useHint(fixture, result.state).hint, null);
  assert.equal(engine.checkBoard(fixture, result.state).state.status, 'won');
  state = engine.useHint(fixture, engine.createGame(fixture)).state;
  assert.equal(state.cuts.length, 1);
  assert.ok(fixture.solution.includes(state.cuts[0]));
  assert.equal(state.moves, 1);
});

test('reveal is terminal, never a win, and terminal states reject all further edits', () => {
  const playing = withCuts([2, 4]);
  const revealed = engine.revealGame(fixture, playing);
  assert.equal(revealed.status, 'revealed');
  assert.deepEqual(revealed.cuts, [2, 4]);
  assert.equal(engine.toggleCut(fixture, revealed, 8).state, revealed);
  assert.equal(engine.useHint(fixture, revealed).state, revealed);
  assert.equal(engine.checkBoard(fixture, revealed).state, revealed);
  const won = engine.checkBoard(fixture, withCuts(fixture.solution)).state;
  assert.equal(engine.revealGame(fixture, won), won);
});

test('restore rebuilds valid progress and refuses forged scores, terminal status, and history', () => {
  let state = engine.checkBoard(fixture, withCuts([0, 1, 2, 3])).state;
  state = engine.useHint(fixture, state).state;
  assert.deepEqual(engine.restoreGame(fixture, JSON.parse(JSON.stringify(state))), state);
  const fresh = engine.createGame(fixture);
  for (const corrupt of [
    null, [], {...state, puzzleId: 'else'}, {...state, cuts: [2, 2]}, {...state, cuts: [12]},
    {...state, moves: -1}, {...state, hints: state.moves + 1}, {...state, checks: 99},
    {...state, status: 'won'}, {...state, checkedSets: ['0,1,2,3', '0,1,2,3'], checks: 2},
    {...state, checkedSets: ['0,1,2'], checks: 1},
    {...state, checkedSets: ['2,4,8,11'], checks: 1},
  ]) assert.deepEqual(engine.restoreGame(fixture, corrupt), fresh);
  const won = engine.checkBoard(fixture, withCuts(fixture.solution)).state;
  assert.deepEqual(engine.restoreGame(fixture, won), won);
  const revealed = engine.revealGame(fixture, state);
  assert.deepEqual(engine.restoreGame(fixture, revealed), revealed);
});

test('stats count genuine terminal records, perfect rounds, and calendar streaks', () => {
  const win = {status: 'won', checks: 1, moves: 4, hints: 0};
  const stats = engine.getStats({
    '2026-10-17': win,
    '2026-10-18': {...win, checks: 2, moves: 7},
    '2026-10-19': {...win, hints: 1},
    '2026-10-20': {status: 'revealed', checks: 0, moves: 0, hints: 0},
    '2026-02-30': win,
    '2026-10-16': {...win, checks: 0},
    '2026-10-15': {...win, hints: -1},
  }, '2026-10-20');
  assert.equal(stats.played, 4);
  assert.equal(stats.won, 3);
  assert.equal(stats.perfect, 1);
  assert.equal(stats.streak, 0);
  assert.equal(stats.bestStreak, 3);
  assert.equal(stats.averageChecks, 1.3);
  assert.equal(engine.getStats({'2026-10-19': win}, '2026-10-20').streak, 1);
});

test('share text reports the result without numbers or cut positions', () => {
  const won = engine.checkBoard(fixture, withCuts(fixture.solution)).state;
  const text = engine.formatShare(fixture, won, {number: 7, url: 'https://example.test/ringcount/'});
  assert.match(text, /RINGCOUNT #007/);
  assert.match(text, /1 check/);
  assert.match(text, /0 hints/);
  assert.match(text, /https:\/\/example.test\/ringcount\//);
  assert.ok(!text.includes(fixture.numbers.join(',')));
  assert.ok(!text.includes(fixture.solution.join(',')));
  assert.match(engine.formatShare(fixture, won, {mode: 'practice'}), /Practice/);
});

test('future records do not affect any statistics before their calendar date', () => {
  const win = {status: 'won', checks: 1, moves: 4, hints: 0};
  const past = {'2026-10-19': win};
  const withFuture = {...past,
    '2026-10-21': {...win, checks: 3, moves: 9, hints: 1},
    '2026-10-22': win,
    '2026-10-23': {status: 'revealed', checks: 0, moves: 0, hints: 0},
  };
  assert.deepEqual(engine.getStats(withFuture, '2026-10-20'), engine.getStats(past, '2026-10-20'));
  assert.equal(engine.getStats(withFuture, '2026-10-21').played, 2);
  assert.equal(engine.getStats(withFuture, '2026-10-22').played, 3);
});
