import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Pure game rules. This module has no browser or storage dependencies. */
export const EPOCH = '2026-10-20';
const DAY_MS = 86_400_000;
const HISTORY_LIMIT = 100;
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
  const index = originalDailyIndex('tradeoff', dateKey, number - 1, puzzles.length);
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return {
    puzzleId: puzzle.id, board: puzzle.rows.map(row => row.start),
    moves: 0, undos: 0, hints: 0, history: [], events: [], status: 'playing',
  };
}

export function isSolved(puzzle, state, row) {
  return state.board[row] === puzzle.rows[row]?.answer;
}

function complete(puzzle, board) {
  return puzzle.rows.every((row, index) => board[index] === row.answer);
}

function validCell(state, cell) {
  return cell !== null && typeof cell === 'object'
    && Number.isInteger(cell.row) && Number.isInteger(cell.col)
    && cell.row >= 0 && cell.row < state.board.length
    && cell.col >= 0 && cell.col < state.board[cell.row].length;
}

function tradedBoard(board, a, b) {
  const changed = board.map(word => [...word]);
  [changed[a.row][a.col], changed[b.row][b.col]] = [changed[b.row][b.col], changed[a.row][a.col]];
  return changed.map(word => word.join(''));
}

export function swapLetters(puzzle, state, a, b) {
  const reject = reason => ({ state, changed: false, reason, newlySolved: [] });
  if (state.status !== 'playing') return reject('finished');
  if (!validCell(state, a) || !validCell(state, b)) return reject('invalid');
  if (a.row === b.row && a.col === b.col) return reject('same-cell');
  if (isSolved(puzzle, state, a.row) || isSolved(puzzle, state, b.row)) return reject('locked');
  if (state.board[a.row][a.col] === state.board[b.row][b.col]) return reject('same-letter');
  const board = tradedBoard(state.board, a, b);
  const newlySolved = [...new Set([a.row, b.row])].sort((x, y) => x - y)
    .filter(row => board[row] === puzzle.rows[row].answer);
  return {
    changed: true, reason: null, newlySolved,
    state: {
      ...state, board, moves: state.moves + 1,
      history: [...state.history, [...state.board]].slice(-HISTORY_LIMIT),
      events: [...state.events, { solved: newlySolved.length }],
      status: complete(puzzle, board) ? 'won' : 'playing',
    },
  };
}

export function undoMove(puzzle, state) {
  if (state.status !== 'playing' || state.history.length === 0) return state;
  const board = [...state.history[state.history.length - 1]];
  return {
    ...state, board, history: state.history.slice(0, -1), undos: state.undos + 1,
    status: complete(puzzle, board) ? 'won' : 'playing',
  };
}

export function findHint(puzzle, state) {
  if (state.status !== 'playing') return null;
  const cells = [];
  state.board.forEach((word, row) => {
    [...word].forEach((letter, col) => {
      if (letter !== puzzle.rows[row].answer[col]) cells.push({ row, col });
    });
  });
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i];
      const b = cells[j];
      const first = state.board[a.row][a.col];
      const second = state.board[b.row][b.col];
      const fixed = Number(second === puzzle.rows[a.row].answer[a.col])
        + Number(first === puzzle.rows[b.row].answer[b.col]);
      if (!fixed) continue;
      const board = tradedBoard(state.board, a, b);
      const rowsSolved = [...new Set([a.row, b.row])].filter(row => board[row] === puzzle.rows[row].answer).length;
      const score = fixed * 10 + rowsSolved;
      if (score > bestScore) {
        bestScore = score;
        best = { a: { ...a }, b: { ...b }, message: `Trade the highlighted ${first} and ${second}.` };
      }
    }
  }
  return best;
}

export function useHint(puzzle, state) {
  const hint = findHint(puzzle, state);
  return { state: hint ? { ...state, hints: state.hints + 1 } : state, hint };
}

export function revealGame(puzzle, state) {
  if (state.status !== 'playing') return state;
  return { ...state, board: puzzle.rows.map(row => row.answer), history: [], status: 'revealed' };
}

function letterSignature(board) {
  return board.join('').split('').sort().join('');
}

function validBoard(puzzle, board, signature) {
  return Array.isArray(board) && board.length === puzzle.rows.length
    && board.every((word, index) => typeof word === 'string'
      && /^[A-Z]+$/.test(word) && word.length === puzzle.rows[index].start.length)
    && letterSignature(board) === signature;
}

function nonnegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id) return fresh();
  const signature = letterSignature(puzzle.rows.map(row => row.start));
  if (!validBoard(puzzle, raw.board, signature)
    || !['moves', 'undos', 'hints'].every(key => nonnegativeInteger(raw[key]))) return fresh();
  const allCorrect = complete(puzzle, raw.board);
  // A reveal remains a reveal when reloaded. A forged/stale win flag never overrides the board.
  const status = raw.status === 'revealed' ? 'revealed' : allCorrect ? 'won' : 'playing';
  if (status === 'revealed' && !allCorrect) return fresh();
  const history = Array.isArray(raw.history)
    ? raw.history.filter(board => validBoard(puzzle, board, signature)).slice(-HISTORY_LIMIT).map(board => [...board])
    : [];
  const events = Array.isArray(raw.events)
    ? raw.events.filter(event => event && nonnegativeInteger(event.solved) && event.solved <= 2)
      .slice(0, raw.moves).map(event => ({ solved: event.solved }))
    : [];
  return {
    puzzleId: puzzle.id, board: [...raw.board], moves: raw.moves, undos: raw.undos, hints: raw.hints,
    history: status === 'revealed' ? [] : history, events, status,
  };
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageSwaps: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(calendarTime(todayKey)) || key <= todayKey)
    && record && (record.status === 'won' || record.status === 'revealed')
    && ['moves', 'hints', 'undos', 'par'].every(field => nonnegativeInteger(record[field])))
    .sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  let total = 0;
  let previousWinTime = NaN;
  let run = 0;
  const wins = new Set();
  for (const [date, record] of entries) {
    if (record.status !== 'won') {
      run = 0;
      previousWinTime = NaN;
      continue;
    }
    stats.won++;
    total += record.moves;
    if (record.moves <= record.par && record.hints === 0 && record.undos === 0) stats.perfect++;
    const time = calendarTime(date);
    run = time - previousWinTime === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWinTime = time;
    wins.add(date);
  }
  stats.averageSwaps = stats.won ? Math.round(total / stats.won * 10) / 10 : 0;
  let cursor = calendarTime(todayKey);
  if (!Number.isFinite(cursor)) return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  const todayRecord = entries.find(([key]) => key === todayKey)?.[1];
  if (todayRecord?.status === 'revealed') return stats;
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) {
    stats.streak++;
    cursor -= DAY_MS;
  }
  return stats;
}

export function formatShare(puzzle, state, { number, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'TRADEOFF Practice' : `TRADEOFF #${String(number ?? 1).padStart(3, '0')}`;
  const completeResult = state.status === 'won';
  const squares = state.board.map((_, row) => completeResult ? '🟩' : state.status === 'revealed' ? '🟨' : isSolved(puzzle, state, row) ? '🟩' : '⬜').join('');
  const details = [`${state.moves} ${state.moves === 1 ? 'swap' : 'swaps'}`];
  if (state.hints) details.push(`${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}`);
  if (state.undos) details.push(`${state.undos} ${state.undos === 1 ? 'undo' : 'undos'}`);
  if (completeResult && state.moves <= puzzle.par && !state.hints && !state.undos) details.push('Perfect');
  if (state.status === 'revealed') details.push('Revealed');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
