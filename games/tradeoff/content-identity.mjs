/** The six directed word transformations identify the challenge, regardless of row order. */
export function substantiveKey(puzzle) {
  return JSON.stringify(puzzle.rows.map(row => JSON.stringify([row.start, row.answer])).sort());
}
