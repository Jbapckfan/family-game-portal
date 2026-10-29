import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Pure Sideways rules. Every row is a cyclic strip shared by all four answer columns. */
export const EPOCH = '2026-10-20';
export const HISTORY_LIMIT = 64;
const DAY_MS = 86_400_000;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
});
const mod = (value, base) => ((value % base) + base) % base;

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
  const index = originalDailyIndex('sideways', dateKey, number - 1, puzzles.length);
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return {
    puzzleId: puzzle.id, rotations: Array(5).fill(0), checks: 0, moves: 0,
    hints: 0, history: [], lastCheck: null, status: 'playing',
  };
}

export function rotateStrip(strip, steps) {
  if (typeof strip !== 'string' || !/^[A-Z]{4}$/.test(strip) || !Number.isInteger(steps)) return null;
  const right = mod(steps, strip.length);
  return right ? strip.slice(-right) + strip.slice(0, -right) : strip;
}

function period(strip) {
  if (rotateStrip(strip, 1) === strip) return 1;
  if (rotateStrip(strip, 2) === strip) return 2;
  return 4;
}

function canonical(puzzle, rotations) {
  return rotations.map((rotation, row) => mod(rotation, period(puzzle.strips[row])));
}

export function getRows(puzzle, state) {
  return puzzle.strips.map((strip, row) => rotateStrip(strip, state.rotations[row]));
}

export function getColumns(puzzle, state) {
  const rows = getRows(puzzle, state);
  return Array.from({ length: 4 }, (_, column) => rows.map(row => row[column]).join(''));
}

function changedOrientation(puzzle, state, rotations, hint = false) {
  return {
    ...state, rotations: canonical(puzzle, rotations), moves: state.moves + 1,
    hints: state.hints + Number(hint),
    history: [...state.history, [...state.rotations]].slice(-HISTORY_LIMIT),
  };
}

export function rotateRow(puzzle, state, row, direction) {
  if (state.status !== 'playing' || !Number.isInteger(row) || row < 0 || row >= 5
    || (direction !== -1 && direction !== 1) || period(puzzle.strips[row]) === 1) return state;
  const rotations = [...state.rotations];
  rotations[row] += direction;
  return changedOrientation(puzzle, state, rotations);
}

export function undoMove(puzzle, state) {
  if (state.status !== 'playing' || state.history.length === 0) return state;
  return { ...state, rotations: [...state.history.at(-1)], history: state.history.slice(0, -1) };
}

export function feedbackCurrent(puzzle, state) {
  return Boolean(state.lastCheck && getRows(puzzle, state).join('')
    === getRows(puzzle, { rotations: state.lastCheck.rotations }).join(''));
}

function correctness(puzzle, state) {
  return getColumns(puzzle, state).map((word, column) => word === puzzle.columns[column].answer);
}

export function checkBoard(puzzle, state) {
  const reject = reason => ({ state, accepted: false, changed: false, reason, correct: state.lastCheck?.correct ?? Array(4).fill(false) });
  if (state.status !== 'playing') return reject('finished');
  if (feedbackCurrent(puzzle, state)) return reject('unchanged');
  const correct = correctness(puzzle, state);
  return {
    state: {
      ...state, checks: state.checks + 1,
      lastCheck: { rotations: [...state.rotations], correct: [...correct] },
      status: correct.every(Boolean) ? 'won' : 'playing',
    },
    accepted: true, changed: true, reason: null, correct,
  };
}

function solutionRotations(puzzle) {
  const rotations = [];
  for (let row = 0; row < 5; row++) {
    const target = puzzle.columns.map(column => column.answer[row]).join('');
    const rotation = Array.from({ length: period(puzzle.strips[row]) }, (_, index) => index)
      .find(index => rotateStrip(puzzle.strips[row], index) === target);
    if (rotation === undefined) return null;
    rotations.push(rotation);
  }
  return rotations;
}

export function findHint(puzzle, state) {
  if (state.status !== 'playing') return null;
  const solution = solutionRotations(puzzle);
  if (!solution) return null;
  const row = canonical(puzzle, state.rotations).findIndex((rotation, index) => rotation !== solution[index]);
  if (row < 0) return null;
  const letters = rotateStrip(puzzle.strips[row], solution[row]);
  return {
    row, rotation: solution[row],
    message: `Row ${row + 1} is in place: ${[...letters].join(' ')}. It stays movable, so check the other rows before submitting.`,
  };
}

export function useHint(puzzle, state) {
  const hint = findHint(puzzle, state);
  if (!hint) return { state, hint: null };
  const rotations = [...state.rotations];
  rotations[hint.row] = hint.rotation;
  return { state: changedOrientation(puzzle, state, rotations, true), hint };
}

export function revealGame(puzzle, state) {
  if (state.status !== 'playing') return state;
  const rotations = solutionRotations(puzzle);
  return rotations ? { ...state, rotations, status: 'revealed' } : state;
}

function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validRotations(value) {
  return Array.isArray(value) && value.length === 5
    && Array.from(value).every(rotation => Number.isInteger(rotation) && rotation >= 0 && rotation < 4);
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status) || !validRotations(raw.rotations)
    || !validCount(raw.checks) || !validCount(raw.moves) || !validCount(raw.hints) || raw.hints > raw.moves
    || !Array.isArray(raw.history) || raw.history.length > HISTORY_LIMIT || raw.history.length > raw.moves
    || Array.from(raw.history).some(rotations => !validRotations(rotations))) return fresh();
  let lastCheck = null;
  if (raw.lastCheck !== null) {
    const check = raw.lastCheck;
    if (!check || typeof check !== 'object' || Array.isArray(check) || !validRotations(check.rotations)
      || !Array.isArray(check.correct) || check.correct.length !== 4
      || Array.from(check.correct).some(value => typeof value !== 'boolean') || raw.checks === 0) return fresh();
    const correct = correctness(puzzle, { rotations: check.rotations });
    if (correct.some((value, index) => value !== check.correct[index])) return fresh();
    lastCheck = { rotations: canonical(puzzle, check.rotations), correct };
  } else if (raw.checks !== 0) return fresh();
  const rotations = canonical(puzzle, raw.rotations);
  const complete = correctness(puzzle, { rotations }).every(Boolean);
  if (raw.status === 'revealed' && !complete) return fresh();
  if (lastCheck?.correct.every(Boolean) && !complete) return fresh();
  const won = complete && lastCheck?.correct.every(Boolean);
  return {
    puzzleId: puzzle.id, rotations, checks: raw.checks, moves: raw.moves, hints: raw.hints,
    history: raw.history.map(item => canonical(puzzle, item)), lastCheck,
    status: raw.status === 'revealed' ? 'revealed' : won ? 'won' : 'playing',
  };
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageChecks: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const todayTime = calendarTime(todayKey);
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(todayTime) || calendarTime(key) <= todayTime)
    && record && ['won', 'revealed'].includes(record.status) && validCount(record.checks)
    && validCount(record.moves) && validCount(record.hints) && record.hints <= record.moves
    && (record.status !== 'won' || record.checks > 0)).sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalChecks = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status !== 'won') { run = 0; previousWin = NaN; continue; }
    stats.won++;
    totalChecks += record.checks;
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
  if (entries.find(([key]) => key === todayKey)?.[1].status === 'revealed') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) { stats.streak++; cursor -= DAY_MS; }
  return stats;
}

export function formatShare(puzzle, state, { number = 1, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'SIDEWAYS Practice' : `SIDEWAYS #${String(number).padStart(3, '0')}`;
  const squares = state.status === 'revealed' ? '🟨'.repeat(4) : state.status === 'won' ? '🟩'.repeat(4)
    : (feedbackCurrent(puzzle, state) ? state.lastCheck.correct : Array(4).fill(false)).map(correct => correct ? '🟩' : '⬜').join('');
  const details = [
    `${state.checks} ${state.checks === 1 ? 'check' : 'checks'}`,
    `${state.moves} ${state.moves === 1 ? 'move' : 'moves'}`,
    `${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}`,
  ];
  if (state.status === 'revealed') details.push('Revealed');
  else if (state.status === 'won') details.push(state.checks === 1 && state.hints === 0 ? 'Perfect' : 'Solved');
  else details.push('In progress');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
