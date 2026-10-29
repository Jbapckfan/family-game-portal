/** Rephrasing/reordering familiar meanings does not make their five-word set new. */
export function substantiveKey(puzzle) {
  return JSON.stringify(puzzle.pairs.map(pair => pair.word).sort());
}
