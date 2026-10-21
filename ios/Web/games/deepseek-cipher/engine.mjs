const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const integer = n => Number.isInteger(n) && n >= 0 && n <= 100000;
export const cipherLetters = p => [...new Set(p.encoded.match(/[A-Z]/g))];
export const solution = p => Object.fromEntries(Object.entries(p.key).map(([plain, code]) => [code, plain]));
export function createState(p) {
  const answer = solution(p), locked = [...p.givens];
  return { guesses: Object.fromEntries(locked.map(code => [code, answer[code]])), locked,
    selected: cipherLetters(p).find(code => !locked.includes(code)) || null, hints: 0, moves: 0, revealed: false };
}
export function getStatus(p, s) {
  if (s.revealed) return 'revealed';
  const answer = solution(p);
  return cipherLetters(p).every(code => s.guesses[code] === answer[code]) ? 'won' : 'playing';
}
export function restoreState(p, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.guesses || typeof raw.guesses !== 'object' || Array.isArray(raw.guesses)) return null;
  if (!Array.isArray(raw.locked) || raw.locked.length > 26 || new Set(raw.locked).size !== raw.locked.length || !integer(raw.hints) || !integer(raw.moves) || typeof raw.revealed !== 'boolean') return null;
  const codes = cipherLetters(p), answer = solution(p), entries = Object.entries(raw.guesses);
  if (entries.some(([code, plain]) => !codes.includes(code) || typeof plain !== 'string' || !/^[A-Z]$/.test(plain))) return null;
  if (new Set(entries.map(([, plain]) => plain)).size !== entries.length) return null;
  if (raw.locked.some(code => !codes.includes(code) || raw.guesses[code] !== answer[code]) || p.givens.some(code => !raw.locked.includes(code))) return null;
  if (raw.locked.length > p.givens.length + raw.hints && !raw.revealed) return null;
  if (raw.selected !== null && !codes.includes(raw.selected)) return null;
  if (raw.revealed && !codes.every(code => raw.guesses[code] === answer[code])) return null;
  return { guesses: { ...raw.guesses }, locked: [...raw.locked], selected: raw.selected, hints: raw.hints, moves: raw.moves, revealed: raw.revealed };
}
export function select(p, s, code) {
  return getStatus(p, s) === 'playing' && cipherLetters(p).includes(code) ? { ...s, selected: code } : s;
}
export function guess(p, s, code, plain) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'This phrase is complete.' };
  if (!cipherLetters(p).includes(code)) return { state: s, message: 'Select a coded letter first.' };
  if (s.locked.includes(code)) return { state: s, message: 'That letter is already confirmed.' };
  const letter = String(plain).toUpperCase();
  if (letter && !/^[A-Z]$/.test(letter)) return { state: s, message: 'Choose one letter.' };
  const conflict = Object.keys(s.guesses).find(key => key !== code && s.guesses[key] === letter);
  if (letter && conflict) return { state: s, message: `${letter} is assigned to ${conflict}. Erase that guess first.` };
  const guesses = { ...s.guesses };
  if (letter) guesses[code] = letter; else delete guesses[code];
  const state = { ...s, guesses, selected: code, moves: s.moves + 1 };
  return { state, message: getStatus(p, state) === 'won' ? 'The whole phrase clicks into place!' : letter ? `${code} becomes ${letter} everywhere.` : `Guess for ${code} erased.` };
}
export function clearGuesses(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  return { ...s, guesses: Object.fromEntries(s.locked.map(code => [code, s.guesses[code]])) };
}
export function hint(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  const answer = solution(p), code = cipherLetters(p).find(code => s.guesses[code] !== answer[code]);
  if (!code) return s;
  const guesses = { ...s.guesses };
  // A guessed letter might occupy this answer. Remove that conflicting guess first.
  for (const other of Object.keys(guesses)) if (other !== code && guesses[other] === answer[code]) delete guesses[other];
  guesses[code] = answer[code];
  return { ...s, guesses, locked: [...new Set([...s.locked, code])], selected: code, hints: s.hints + 1 };
}
export function reveal(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  const answer = solution(p);
  return { ...s, guesses: Object.fromEntries(cipherLetters(p).map(code => [code, answer[code]])), revealed: true };
}
export function summarize(p, s) {
  return `${cipherLetters(p).filter(code => s.guesses[code] === solution(p)[code]).length}/${cipherLetters(p).length} letters · ${s.hints} hint${s.hints === 1 ? '' : 's'}`;
}
