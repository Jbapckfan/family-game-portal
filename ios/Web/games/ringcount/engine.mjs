import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Ringcount's pure rules and exhaustive ring-partition solver. */
export const EPOCH = '2026-10-20';
export const SECTIONS = 4;
export const RING_SIZE = 12;
const DAY_MS = 86_400_000;
const MAX_CHECKS = 495;
const MAX_COUNTER = 1_000_000;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function getDateKey(now = new Date()) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarTime(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return NaN;
  const time = Date.parse(`${key}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === key ? time : NaN;
}

export function getDayNumber(dateKey) {
  return Math.floor((calendarTime(dateKey) - calendarTime(EPOCH)) / DAY_MS) + 1;
}

export function getDaily(puzzles, now = new Date()) {
  if (!Array.isArray(puzzles) || puzzles.length === 0) throw new RangeError('A daily puzzle collection is required.');
  const dateKey = getDateKey(now);
  const number = getDayNumber(dateKey);
  const index = originalDailyIndex('ringcount', dateKey, number - 1, puzzles.length);
  return {puzzle: puzzles[index], dateKey, number};
}

export function createGame(puzzle) {
  return {puzzleId: puzzle.id, cuts: [], moves: 0, checks: 0, hints: 0, checkedSets: [], status: 'playing'};
}

const validGap = gap => Number.isInteger(gap) && gap >= 0 && gap < RING_SIZE;
const ordered = cuts => [...cuts].sort((a, b) => a - b);
const signature = cuts => ordered(cuts).join(',');
const validCuts = cuts => Array.isArray(cuts) && cuts.length <= SECTIONS
  && cuts.every(validGap) && new Set(cuts).size === cuts.length;

/** A gap index is the gap AFTER that number, moving clockwise. */
export function getSegments(puzzle, cuts) {
  if (!validCuts(cuts)) return [];
  const makeSegment = (start, end) => {
    const indices = [];
    let index = start;
    do {
      indices.push(index);
      if (index === end) break;
      index = (index + 1) % RING_SIZE;
    } while (indices.length < RING_SIZE);
    const values = indices.map(i => puzzle.numbers[i]);
    return {start, end, indices, values, sum: values.reduce((total, value) => total + value, 0)};
  };
  if (cuts.length === 0) return [makeSegment(0, RING_SIZE - 1)];
  const sorted = ordered(cuts);
  return sorted.map((cut, i) => makeSegment((cut + 1) % RING_SIZE, sorted[(i + 1) % sorted.length]));
}

function isSolved(puzzle, cuts) {
  return cuts.length === SECTIONS && getSegments(puzzle, cuts).every(segment => segment.sum === puzzle.target);
}

export function toggleCut(puzzle, state, gap) {
  const reject = reason => ({state, changed: false, reason});
  if (state.status !== 'playing') return reject('finished');
  if (!validGap(gap)) return reject('invalid');
  const removing = state.cuts.includes(gap);
  if (!removing && state.cuts.length === SECTIONS) return reject('full');
  const cuts = removing ? state.cuts.filter(cut => cut !== gap) : ordered([...state.cuts, gap]);
  return {state: {...state, cuts, moves: state.moves + 1}, changed: true, reason: null};
}

export function checkBoard(puzzle, state) {
  const segments = getSegments(puzzle, state.cuts);
  const reject = reason => ({state, changed: false, accepted: false, reason, segments});
  if (state.status !== 'playing') return reject('finished');
  if (state.cuts.length !== SECTIONS) return reject('incomplete');
  const key = signature(state.cuts);
  if (state.checkedSets.includes(key)) return reject('repeated');
  const accepted = isSolved(puzzle, state.cuts);
  return {
    state: {...state, checks: state.checks + 1, checkedSets: [...state.checkedSets, key],
      status: accepted ? 'won' : 'playing'},
    changed: true, accepted, reason: accepted ? null : 'wrong', segments,
  };
}

export function useHint(puzzle, state) {
  const unchanged = {state, changed: false, hint: null};
  if (state.status !== 'playing') return unchanged;
  const gap = puzzle.solution.find(cut => !state.cuts.includes(cut));
  if (gap === undefined) return unchanged;
  const removedGap = state.cuts.length === SECTIONS
    ? state.cuts.find(cut => !puzzle.solution.includes(cut)) : null;
  if (state.cuts.length === SECTIONS && removedGap === undefined) return unchanged;
  const cuts = ordered([...state.cuts.filter(cut => cut !== removedGap), gap]);
  const message = removedGap === null
    ? `A correct cut has been added after position ${gap + 1}.`
    : `The cut after position ${removedGap + 1} was moved to a correct gap after position ${gap + 1}.`;
  return {
    state: {...state, cuts, hints: state.hints + 1, moves: state.moves + 1},
    changed: true, hint: {gap, removedGap, message},
  };
}

export function revealGame(puzzle, state) {
  return state.status === 'playing' ? {...state, status: 'revealed'} : state;
}

function validCounter(value, maximum = MAX_COUNTER) {
  return Number.isInteger(value) && value >= 0 && value <= maximum;
}

function validRecord(record) {
  return record && typeof record === 'object' && !Array.isArray(record)
    && ['won', 'revealed'].includes(record.status)
    && validCounter(record.moves) && validCounter(record.hints) && record.hints <= record.moves
    && validCounter(record.checks, MAX_CHECKS) && record.checks <= record.moves
    && (record.status !== 'won' || (record.checks >= 1 && record.moves >= SECTIONS))
    && (record.checks === 0 || record.moves >= SECTIONS);
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status) || !validCuts(raw.cuts)
    || !validCounter(raw.moves) || !validCounter(raw.hints) || raw.hints > raw.moves
    || raw.moves < raw.cuts.length || !validCounter(raw.checks, MAX_CHECKS)
    || raw.checks > raw.moves || (raw.checks > 0 && raw.moves < SECTIONS)
    || !Array.isArray(raw.checkedSets) || raw.checkedSets.length !== raw.checks
    || new Set(raw.checkedSets).size !== raw.checkedSets.length) return fresh();
  const checkedSets = [];
  for (let index = 0; index < raw.checkedSets.length; index++) {
    const key = raw.checkedSets[index];
    if (typeof key !== 'string' || !/^\d+(,\d+){3}$/.test(key)) return fresh();
    const cuts = key.split(',').map(Number);
    if (!validCuts(cuts) || signature(cuts) !== key) return fresh();
    const solved = isSolved(puzzle, cuts);
    // A successful check ends the round immediately. No later history can be legitimate.
    if (solved && (raw.status !== 'won' || index !== raw.checkedSets.length - 1)) return fresh();
    checkedSets.push(key);
  }
  const cuts = ordered(raw.cuts);
  if (raw.status === 'won' && (!isSolved(puzzle, cuts) || raw.checks === 0
    || checkedSets.at(-1) !== signature(cuts))) return fresh();
  return {puzzleId: puzzle.id, cuts, moves: raw.moves, checks: raw.checks, hints: raw.hints,
    checkedSets, status: raw.status};
}

/** Enumerates all C(12,4)=495 cut sets. Does not read puzzle.solution. */
export function solvePuzzle(puzzle) {
  if (!puzzle || !Array.isArray(puzzle.numbers) || puzzle.numbers.length !== RING_SIZE
    || puzzle.numbers.some(value => !Number.isInteger(value) || value < 1 || value > 9)
    || !Number.isInteger(puzzle.target) || puzzle.target < 1
    || puzzle.numbers.reduce((sum, value) => sum + value, 0) !== puzzle.target * SECTIONS) return [];
  const solutions = [];
  for (let a = 0; a < RING_SIZE - 3; a++)
    for (let b = a + 1; b < RING_SIZE - 2; b++)
      for (let c = b + 1; c < RING_SIZE - 1; c++)
        for (let d = c + 1; d < RING_SIZE; d++) {
          const cuts = [a, b, c, d];
          if (isSolved(puzzle, cuts)) solutions.push(cuts);
        }
  return solutions;
}

export function getStats(records, todayKey) {
  const stats = {played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, unassisted: 0, averageChecks: 0};
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const todayTime = calendarTime(todayKey);
  const cutoff = Number.isFinite(todayTime) ? todayTime : Infinity;
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && calendarTime(key) <= cutoff && validRecord(record)).sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalChecks = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status !== 'won') {run = 0; previousWin = NaN; continue;}
    stats.won++;
    totalChecks += record.checks;
    if (record.hints === 0) stats.unassisted++;
    if (record.checks === 1 && record.hints === 0) stats.perfect++;
    const time = calendarTime(date);
    run = time - previousWin === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWin = time;
    wins.add(date);
  }
  stats.averageChecks = stats.won ? Math.round(totalChecks / stats.won * 10) / 10 : 0;
  let cursor = todayTime;
  if (!Number.isFinite(cursor)) return stats;
  const today = entries.find(([key]) => key === todayKey)?.[1];
  if (today && today.status !== 'won') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) {stats.streak++; cursor -= DAY_MS;}
  return stats;
}

export function formatShare(puzzle, state, {number = 1, mode = 'daily', url} = {}) {
  const label = mode === 'practice' ? 'RINGCOUNT Practice' : `RINGCOUNT #${String(number).padStart(3, '0')}`;
  const result = {won: ['🟩🟩🟩🟩', 'Solved'], revealed: ['🟨🟨🟨🟨', 'Revealed'], playing: ['⬜⬜⬜⬜', 'In progress']}[state.status];
  const details = `${state.checks} ${state.checks === 1 ? 'check' : 'checks'} · ${state.hints} ${state.hints === 1 ? 'hint' : 'hints'} · ${result[1]}`;
  return [label, result[0], details, ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
