const integer = n => Number.isInteger(n) && n >= 0 && n <= 100000;
export const wordsAt = (p, s) => s.rows.map(row => row.map(index => p.rack[index]).join(''));
const fits = (p, s) => wordsAt(p, s).every((word, row) => word === p.words[row]);
export const createState = () => ({ rows: [[], []], active: 0, hints: 0, checks: 0, submitted: false, revealed: false });
export function getStatus(p, s) {
  if (s.revealed) return 'revealed';
  return s.submitted && fits(p, s) ? 'won' : 'playing';
}
export function restoreState(p, raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.rows) || raw.rows.length !== 2 || ![0, 1].includes(raw.active) || !integer(raw.hints) || !integer(raw.checks) || typeof raw.submitted !== 'boolean' || typeof raw.revealed !== 'boolean') return null;
  if (raw.rows.some((row, i) => !Array.isArray(row) || row.length > p.words[i].length || row.some(n => !Number.isInteger(n) || n < 0 || n >= 10))) return null;
  const used = raw.rows.flat();
  if (new Set(used).size !== used.length || ((raw.submitted || raw.revealed) && !fits(p, raw))) return null;
  return { rows: raw.rows.map(row => [...row]), active: raw.active, hints: raw.hints, checks: raw.checks, submitted: raw.submitted, revealed: raw.revealed };
}
export function setActive(p, s, row) {
  return getStatus(p, s) === 'playing' && [0, 1].includes(row) ? { ...s, active: row } : s;
}
export function addTile(p, s, index) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'Both words are complete.' };
  if (!Number.isInteger(index) || index < 0 || index > 9) return { state: s, message: 'Choose a letter from the rack.' };
  if (s.rows.flat().includes(index)) return { state: s, message: 'That tile is already in a word.' };
  let active = s.active;
  if (s.rows[active].length === p.words[active].length) active = 1 - active;
  if (s.rows[active].length === p.words[active].length) return { state: s, message: 'Both rows are full. Check them or return a tile.' };
  const rows = s.rows.map(row => [...row]);rows[active].push(index);
  const nextActive = rows[active].length === p.words[active].length && rows[1-active].length < p.words[1-active].length ? 1-active : active;
  return { state: { ...s, rows, active: nextActive }, message: '' };
}
export function removeTile(p, s, row, slot) {
  if (getStatus(p, s) !== 'playing' || ![0, 1].includes(row) || !Number.isInteger(slot) || slot < 0 || slot >= s.rows[row].length) return s;
  const rows = s.rows.map(values => [...values]);rows[row].splice(slot, 1);
  return { ...s, rows, active: row };
}
export function undo(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  let active = s.active;
  if (!s.rows[active].length) active = 1-active;
  return removeTile(p, s, active, s.rows[active].length - 1);
}
export const clearAll = (p, s) => getStatus(p, s) === 'playing' ? { ...s, rows: [[], []], active: 0 } : s;
export function submit(p, s) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'Both words are complete.' };
  if (s.rows.some((row, i) => row.length !== p.words[i].length)) return { state: s, message: 'Use all ten tiles to fill both clued words.' };
  if (fits(p, s)) return { state: { ...s, submitted: true, checks: s.checks + 1 }, message: 'Two words. Every letter in its place!' };
  const words = wordsAt(p, s), correct = words.map((w, i) => w === p.words[i]);
  const message = correct[0] ? 'The first word fits. Revisit the second clue.' : correct[1] ? 'The second word fits. Revisit the first clue.' : 'Try another split. Both words must answer their clues.';
  return { state: { ...s, checks: s.checks + 1 }, message };
}
export function hint(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  const current = wordsAt(p, s);
  // Keep only correct prefixes. This guarantees that duplicate tiles cannot trap a hint.
  const rows = s.rows.map((row, n) => {
    let count = 0;while (count < row.length && current[n][count] === p.words[n][count]) count++;
    return row.slice(0, count);
  });
  let active = s.active;
  if (rows[active].length === p.words[active].length) active = 1-active;
  if (rows[active].length === p.words[active].length) return s;
  const letter = p.words[active][rows[active].length], used = rows.flat();
  const index = p.rack.findIndex((c, i) => c === letter && !used.includes(i));
  if (index === -1) return s; // Defensive guard; validated puzzles always provide it.
  rows[active].push(index);
  return { ...s, rows, active, hints: s.hints + 1 };
}
export function reveal(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  const used = new Set(), rows = p.words.map(word => [...word].map(letter => {
    const index = p.rack.findIndex((c, i) => c === letter && !used.has(i));used.add(index);return index;
  }));
  return { ...s, rows, revealed: true };
}
export const summarize = (p, s) => `${wordsAt(p, s).filter((word, i) => word === p.words[i]).length}/2 words · ${s.hints} hint${s.hints === 1 ? '' : 's'}`;
