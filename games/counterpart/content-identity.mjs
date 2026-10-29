/** Row/tile identifiers and ordering are presentation; directed analogy words are content. */
export function substantiveKey(puzzle) {
  const words = new Map(puzzle.tiles.map(tile => [tile.id, tile.word]));
  return JSON.stringify(puzzle.rows.map(row =>
    JSON.stringify([row.cue, row.answer.map(id => words.get(id))]),
  ).sort());
}
