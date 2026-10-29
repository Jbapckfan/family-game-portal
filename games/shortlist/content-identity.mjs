/** Reordering a candidate bank or choosing a different answer does not make a new bank. */
export function substantiveKey(puzzle) {
  return JSON.stringify([...puzzle.words].sort());
}
