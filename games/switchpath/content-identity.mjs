/**
 * Legal decisions depend on start/end and neighboring inequalities, not printed
 * magnitudes. Canonicalize all eight square-grid rotations/reflections.
 */
export function substantiveKey(puzzle) {
  const variants = [];
  for (let reflected = 0; reflected < 2; reflected++) {
    for (let turns = 0; turns < 4; turns++) {
      const transform = cell => {
        let row = Math.floor(cell / 4), col = cell % 4;
        if (reflected) col = 3 - col;
        for (let turn = 0; turn < turns; turn++) [row, col] = [col, 3 - row];
        return row * 4 + col;
      };
      const values = [];
      puzzle.values.forEach((value, cell) => { values[transform(cell)] = value; });
      const comparisons = [];
      for (let cell = 0; cell < 16; cell++) {
        if (cell % 4 < 3) comparisons.push(values[cell] < values[cell + 1] ? 1 : 0);
        if (cell < 12) comparisons.push(values[cell] < values[cell + 4] ? 1 : 0);
      }
      variants.push(JSON.stringify([transform(puzzle.start), transform(puzzle.end), comparisons]));
    }
  }
  return variants.sort()[0];
}
