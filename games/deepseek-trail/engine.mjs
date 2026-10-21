const integer = n => Number.isInteger(n) && n >= 0 && n <= 100000;
export const adjacent = (a, b) => a !== b && Math.max(Math.abs(Math.floor(a / 3) - Math.floor(b / 3)), Math.abs(a % 3 - b % 3)) === 1;
export function validPath(path) {
  return Array.isArray(path) && path.length <= 9 && path.every(i => Number.isInteger(i) && i >= 0 && i < 9) && new Set(path).size === path.length && path.every((i, n) => n === 0 || adjacent(path[n - 1], i));
}
export const wordAt = (p, path) => path.map(i => p.grid[i]).join('');
const isAnswer = (p, s) => validPath(s.path) && s.path.length === p.answer.length && p.accepted.includes(wordAt(p, s.path));
export const createState = () => ({ path: [], hints: 0, checks: 0, submitted: false, revealed: false });
export function getStatus(p, s) {
  if (s.revealed) return 'revealed';
  return s.submitted && isAnswer(p, s) ? 'won' : 'playing';
}
export function restoreState(p, raw) {
  if (!raw || typeof raw !== 'object' || !validPath(raw.path) || !integer(raw.hints) || !integer(raw.checks) || typeof raw.submitted !== 'boolean' || typeof raw.revealed !== 'boolean') return null;
  if ((raw.submitted || raw.revealed) && !isAnswer(p, raw)) return null;
  return { path: [...raw.path], hints: raw.hints, checks: raw.checks, submitted: raw.submitted, revealed: raw.revealed };
}
export function selectTile(p, s, index) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'This trail is complete.' };
  if (!Number.isInteger(index) || index < 0 || index > 8) return { state: s, message: 'Choose a tile on the board.' };
  const previous = s.path.indexOf(index);
  if (previous !== -1) return { state: { ...s, path: s.path.slice(0, previous + 1) }, message: 'Trail shortened to this tile.' };
  if (s.path.length && !adjacent(s.path.at(-1), index)) return { state: s, message: 'Move to a neighboring tile, including diagonally.' };
  return { state: { ...s, path: [...s.path, index] }, message: '' };
}
export const undo = (p, s) => getStatus(p, s) === 'playing' ? { ...s, path: s.path.slice(0, -1) } : s;
export const clear = (p, s) => getStatus(p, s) === 'playing' ? { ...s, path: [] } : s;
export function submit(p, s) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'This trail is complete.' };
  if (s.path.length < p.answer.length) return { state: s, message: `Find the ${p.answer.length}-letter word. Your trail has ${s.path.length} letters.` };
  if (!isAnswer(p, s)) return { state: { ...s, checks: s.checks + 1 }, message: 'That path does not match today’s clue. Try a different trail.' };
  return { state: { ...s, submitted: true, checks: s.checks + 1 }, message: 'Every step led to the answer!' };
}
export function hint(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  let prefix = 0;
  while (prefix < s.path.length && s.path[prefix] === p.path[prefix]) prefix++;
  if (prefix === p.path.length) return s;
  return { ...s, path: p.path.slice(0, prefix + 1), hints: s.hints + 1 };
}
export function reveal(p, s) {
  return getStatus(p, s) === 'playing' ? { ...s, path: [...p.path], revealed: true } : s;
}
export const summarize = (p, s) => `${s.path.length}/${p.answer.length} letters · ${s.hints} hint${s.hints === 1 ? '' : 's'}`;
