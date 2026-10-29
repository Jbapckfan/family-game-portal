import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Pure Switchpath rules: visit every cell while comparisons alternate higher, lower. */
export const EPOCH = '2026-10-20';
const DAY_MS = 86_400_000;
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
});
const validCell = cell => Number.isInteger(cell) && cell >= 0 && cell < 16;
const adjacent = (a, b) => Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) + Math.abs(a % 4 - b % 4) === 1;

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
  const index = originalDailyIndex('switchpath', dateKey, number - 1, puzzles.length);
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return { puzzleId: puzzle.id, path: [puzzle.start], moves: 0, hints: 0, status: 'playing' };
}

export function nextDirection(state) {
  return state.path.length % 2 === 1 ? 'higher' : 'lower';
}

function correctDirection(puzzle, path, cell) {
  const current = puzzle.values[path.at(-1)];
  const next = puzzle.values[cell];
  return path.length % 2 === 1 ? next > current : next < current;
}

export function legalNextCells(puzzle, state) {
  if (state.status !== 'playing') return [];
  return Array.from({ length: 16 }, (_, cell) => cell).filter(cell => !state.path.includes(cell)
    && adjacent(state.path.at(-1), cell) && (cell !== puzzle.end || state.path.length === 15)
    && correctDirection(puzzle, state.path, cell));
}

export function selectCell(puzzle, state, cell) {
  const reject = reason => ({ state, accepted: false, changed: false, reason, action: null });
  if (state.status !== 'playing') return reject('finished');
  if (!validCell(cell)) return reject('invalid');
  const prior = state.path.indexOf(cell);
  if (prior === state.path.length - 1) return reject('unchanged');
  if (prior >= 0) return {
    state: { ...state, path: state.path.slice(0, prior + 1), moves: state.moves + 1 },
    accepted: true, changed: true, reason: null, action: 'rewind',
  };
  if (!adjacent(state.path.at(-1), cell)) return reject('not-adjacent');
  if (cell === puzzle.end && state.path.length !== 15) return reject('end-too-early');
  if (!correctDirection(puzzle, state.path, cell)) return reject('direction');
  const path = [...state.path, cell];
  return {
    state: { ...state, path, moves: state.moves + 1, status: path.length === 16 && cell === puzzle.end ? 'won' : 'playing' },
    accepted: true, changed: true, reason: null, action: 'extend',
  };
}

export function findHint(puzzle, state) {
  if (state.status !== 'playing') return null;
  let matching = 0;
  while (matching < state.path.length && state.path[matching] === puzzle.solution[matching]) matching++;
  if (matching === 16) return null;
  const path = puzzle.solution.slice(0, matching + 1);
  const cell = path.at(-1);
  const rewound = state.path.length - matching;
  const priorValue = puzzle.values[puzzle.solution[matching - 1]];
  const value = puzzle.values[cell];
  const message = rewound
    ? `Rewound ${rewound} ${rewound === 1 ? 'step' : 'steps'} to ${priorValue}, then moved to ${value}. Continue from here.`
    : `The next step is ${value}. It is ${value > priorValue ? 'higher' : 'lower'} than ${priorValue}.`;
  return { path, cell, rewound, message };
}

export function useHint(puzzle, state) {
  const hint = findHint(puzzle, state);
  if (!hint) return { state, hint: null };
  return {
    state: { ...state, path: [...hint.path], moves: state.moves + 1, hints: state.hints + 1,
      status: hint.path.length === 16 ? 'won' : 'playing' },
    hint,
  };
}

export function revealGame(puzzle, state) {
  return state.status === 'playing' ? { ...state, path: [...puzzle.solution], status: 'revealed' } : state;
}

function validCount(value) { return Number.isSafeInteger(value) && value >= 0; }
function validPath(puzzle, path) {
  if (!Array.isArray(path) || path.length < 1 || path.length > 16 || path[0] !== puzzle.start
    || Array.from(path).some(cell => !validCell(cell)) || new Set(path).size !== path.length
    || (path.includes(puzzle.end) && (path.length !== 16 || path.at(-1) !== puzzle.end))) return false;
  for (let step = 1; step < path.length; step++) {
    if (!adjacent(path[step - 1], path[step]) || !correctDirection(puzzle, path.slice(0, step), path[step])) return false;
  }
  return true;
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status) || !validPath(puzzle, raw.path)
    || !validCount(raw.moves) || !validCount(raw.hints) || raw.hints > raw.moves
    || (raw.status !== 'revealed' && raw.moves < raw.path.length - 1)) return fresh();
  const complete = raw.path.length === 16 && raw.path.at(-1) === puzzle.end;
  if (raw.status === 'revealed' && !complete) return fresh();
  return {
    puzzleId: puzzle.id, path: [...raw.path], moves: raw.moves, hints: raw.hints,
    status: raw.status === 'revealed' ? 'revealed' : complete ? 'won' : 'playing',
  };
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageMoves: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const todayTime = calendarTime(todayKey);
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(todayTime) || calendarTime(key) <= todayTime)
    && record && ['won', 'revealed'].includes(record.status) && validCount(record.moves)
    && validCount(record.hints) && record.hints <= record.moves
    && (record.status !== 'won' || record.moves >= 15)).sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalMoves = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status !== 'won') { run = 0; previousWin = NaN; continue; }
    stats.won++;
    totalMoves += record.moves;
    if (record.moves === 15 && record.hints === 0) stats.perfect++;
    const time = calendarTime(date);
    run = time - previousWin === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWin = time;
    wins.add(date);
  }
  stats.averageMoves = stats.won ? Math.round(totalMoves / stats.won * 10) / 10 : 0;
  let cursor = todayTime;
  if (!Number.isFinite(cursor)) return stats;
  if (entries.find(([key]) => key === todayKey)?.[1].status === 'revealed') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) { stats.streak++; cursor -= DAY_MS; }
  return stats;
}

export function formatShare(puzzle, state, { number = 1, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'SWITCHPATH Practice' : `SWITCHPATH #${String(number).padStart(3, '0')}`;
  const filled = Math.floor((state.path.length - 1) / 4);
  const squares = state.status === 'revealed' ? '🟨'.repeat(4) : state.status === 'won' ? '🟩'.repeat(4)
    : '🟩'.repeat(filled) + '⬜'.repeat(4 - filled);
  const details = [
    `${state.moves} ${state.moves === 1 ? 'move' : 'moves'}`,
    `${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}`,
  ];
  if (state.status === 'revealed') details.push('Revealed');
  else if (state.status === 'won') details.push(state.moves === 15 && state.hints === 0 ? 'Perfect' : 'Solved');
  else details.push('In progress');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
