/** Seed/answer transformations identify content; row order and tile IDs do not. */
export function substantiveKey(puzzle) {
  return JSON.stringify(puzzle.rows.map(row => JSON.stringify([row.seed, row.answer])).sort());
}
