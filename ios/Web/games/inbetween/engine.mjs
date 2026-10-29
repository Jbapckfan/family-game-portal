import {originalDailyIndex} from '../deepseek-runtime/daily-rotations.mjs';
/** Pure Inbetween rules. No browser or storage dependencies. */
export const EPOCH = '2026-10-20';
const DAY_MS = 86_400_000;
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
  const index = originalDailyIndex('inbetween', dateKey, number - 1, puzzles.length);
  return { puzzle: puzzles[index], dateKey, number };
}

export function createGame(puzzle) {
  return {
    puzzleId: puzzle.id, placements: puzzle.rows.map(() => null),
    attempts: 0, hints: 0, status: 'playing',
  };
}

export function buildWord(seed, letters, gap) {
  if (typeof seed !== 'string' || !/^[A-Z]{4}$/.test(seed)
    || typeof letters !== 'string' || !/^[A-Z]{2}$/.test(letters)
    || !Number.isInteger(gap) || gap < 0 || gap > seed.length) return null;
  return seed.slice(0, gap) + letters + seed.slice(gap);
}

export function submitPlacement(puzzle, state, placement) {
  const reject = reason => ({ state, accepted: false, changed: false, reason, word: null });
  if (state.status !== 'playing') return reject('finished');
  if (!placement || typeof placement !== 'object' || Array.isArray(placement)
    || !Number.isInteger(placement.row) || placement.row < 0 || placement.row >= puzzle.rows.length
    || !Number.isInteger(placement.gap) || placement.gap < 0 || placement.gap > 4) return reject('invalid');
  const { row, tileId, gap } = placement;
  const tile = puzzle.tiles.find(item => item.id === tileId);
  if (!tile) return reject('invalid');
  if (state.placements[row] !== null) return reject('locked');
  if (state.placements.some(item => item?.tileId === tileId)) return reject('used');
  const word = buildWord(puzzle.rows[row].seed, tile.letters, gap);
  if (word === null) return reject('invalid');
  if (word !== puzzle.rows[row].answer) {
    return {
      state: { ...state, attempts: state.attempts + 1 },
      accepted: false, changed: true, reason: 'no-fit', word,
    };
  }
  const placements = state.placements.map((item, index) => index === row ? { tileId, gap } : item);
  return {
    state: {
      ...state, placements, attempts: state.attempts + 1,
      status: placements.every(Boolean) ? 'won' : 'playing',
    },
    accepted: true, changed: true, reason: null, word,
  };
}

function solutionPlacements(puzzle, placements) {
  const solution = placements.map(item => item ? { ...item } : null);
  const used = new Set(solution.filter(Boolean).map(item => item.tileId));
  function search(row) {
    if (row === puzzle.rows.length) return true;
    if (solution[row]) return search(row + 1);
    for (const tile of puzzle.tiles) {
      if (used.has(tile.id)) continue;
      for (let gap = 0; gap <= 4; gap++) {
        if (buildWord(puzzle.rows[row].seed, tile.letters, gap) !== puzzle.rows[row].answer) continue;
        solution[row] = { tileId: tile.id, gap };
        used.add(tile.id);
        if (search(row + 1)) return true;
        used.delete(tile.id);
        solution[row] = null;
      }
    }
    return false;
  }
  return search(0) ? solution : null;
}

export function findHint(puzzle, state) {
  if (state.status !== 'playing') return null;
  const row = state.placements.findIndex(item => item === null);
  if (row === -1) return null;
  const solution = solutionPlacements(puzzle, state.placements);
  if (!solution) return null;
  const { tileId, gap } = solution[row];
  const { letters } = puzzle.tiles.find(tile => tile.id === tileId);
  const { seed } = puzzle.rows[row];
  const where = gap === 0 ? `before ${seed}` : gap === 4 ? `after ${seed}`
    : `between ${seed.slice(0, gap)} and ${seed.slice(gap)}`;
  return { row, tileId, gap, message: `Put ${letters} ${where} in row ${row + 1}.` };
}

export function useHint(puzzle, state) {
  const hint = findHint(puzzle, state);
  return { state: hint ? { ...state, hints: state.hints + 1 } : state, hint };
}

export function revealGame(puzzle, state) {
  if (state.status !== 'playing') return state;
  const placements = solutionPlacements(puzzle, state.placements);
  return placements ? { ...state, placements, status: 'revealed' } : state;
}

function nonnegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function restoreGame(puzzle, raw) {
  const fresh = () => createGame(puzzle);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.puzzleId !== puzzle.id
    || !['playing', 'won', 'revealed'].includes(raw.status)
    || !nonnegativeInteger(raw.attempts) || !nonnegativeInteger(raw.hints)
    || !Array.isArray(raw.placements) || raw.placements.length !== puzzle.rows.length) return fresh();
  const placements = [];
  const used = new Set();
  for (let row = 0; row < puzzle.rows.length; row++) {
    const placement = raw.placements[row];
    if (placement === null) {
      placements.push(null);
      continue;
    }
    if (!placement || typeof placement !== 'object' || Array.isArray(placement)
      || typeof placement.tileId !== 'string' || used.has(placement.tileId)) return fresh();
    const tile = puzzle.tiles.find(item => item.id === placement.tileId);
    if (!tile || buildWord(puzzle.rows[row].seed, tile.letters, placement.gap) !== puzzle.rows[row].answer) return fresh();
    placements.push({ tileId: tile.id, gap: placement.gap });
    used.add(tile.id);
  }
  const complete = used.size === puzzle.rows.length;
  if (raw.status === 'revealed' ? !complete : raw.attempts < used.size) return fresh();
  // The placements determine a win. A revealed board remains a reveal after reload.
  const status = raw.status === 'revealed' ? 'revealed' : complete ? 'won' : 'playing';
  return { puzzleId: puzzle.id, placements, attempts: raw.attempts, hints: raw.hints, status };
}

export function getStats(records, todayKey) {
  const stats = { played: 0, won: 0, streak: 0, bestStreak: 0, perfect: 0, averageAttempts: 0 };
  if (!records || typeof records !== 'object' || Array.isArray(records)) return stats;
  const entries = Object.entries(records).filter(([key, record]) => Number.isFinite(calendarTime(key))
    && (!Number.isFinite(calendarTime(todayKey)) || key <= todayKey)
    && record && (record.status === 'won' || record.status === 'revealed')
    && nonnegativeInteger(record.attempts) && nonnegativeInteger(record.hints)
    && (record.status !== 'won' || record.attempts >= 6))
    .sort(([a], [b]) => a.localeCompare(b));
  stats.played = entries.length;
  const wins = new Set();
  let totalAttempts = 0;
  let previousWin = NaN;
  let run = 0;
  for (const [date, record] of entries) {
    if (record.status === 'revealed') {
      run = 0;
      previousWin = NaN;
      continue;
    }
    stats.won++;
    totalAttempts += record.attempts;
    if (record.attempts === 6 && record.hints === 0) stats.perfect++;
    const time = calendarTime(date);
    run = time - previousWin === DAY_MS ? run + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, run);
    previousWin = time;
    wins.add(date);
  }
  stats.averageAttempts = stats.won ? Math.round(totalAttempts / stats.won * 10) / 10 : 0;
  let cursor = calendarTime(todayKey);
  if (!Number.isFinite(cursor)) return stats;
  if (entries.find(([key]) => key === todayKey)?.[1].status === 'revealed') return stats;
  const dateAt = time => new Date(time).toISOString().slice(0, 10);
  if (!wins.has(dateAt(cursor))) cursor -= DAY_MS;
  while (wins.has(dateAt(cursor))) {
    stats.streak++;
    cursor -= DAY_MS;
  }
  return stats;
}

export function formatShare(puzzle, state, { number = 1, mode = 'daily', url } = {}) {
  const label = mode === 'practice' ? 'INBETWEEN Practice' : `INBETWEEN #${String(number).padStart(3, '0')}`;
  const squares = puzzle.rows.map((_, row) => state.status === 'revealed' ? '🟨'
    : state.placements[row] ? '🟩' : '⬜').join('');
  const details = [
    `${state.attempts} ${state.attempts === 1 ? 'attempt' : 'attempts'}`,
    `${state.hints} ${state.hints === 1 ? 'hint' : 'hints'}`,
  ];
  if (state.status === 'won' && state.attempts === 6 && state.hints === 0) details.push('Perfect');
  if (state.status === 'revealed') details.push('Revealed');
  return [label, squares, details.join(' · '), ...(typeof url === 'string' && url ? [url] : [])].join('\n');
}
