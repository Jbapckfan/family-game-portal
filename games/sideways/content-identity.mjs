/** Changing strip offsets or column order does not make a new four-answer challenge. */
export function substantiveKey(puzzle) {
  return JSON.stringify(puzzle.columns.map(column => column.answer).sort());
}
