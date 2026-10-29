/** Challenge identity, independent of puzzle number or cosmetic rearrangement. */
const sorted = values => [...values].sort();
const squareKey = grid => Array.from({length:8}, (_, variant) => {
  const cells = Array(16);
  for (let i = 0; i < 16; i++) {
    let row = Math.floor(i / 4), col = i % 4;
    if (variant >= 4) col = 3 - col;
    for (let turn = 0; turn < variant % 4; turn++) [row, col] = [col, 3 - row];
    cells[row * 4 + col] = grid[i];
  }
  return cells.join('');
}).sort()[0];

export function kimiContentKey(slug, puzzle) {
  switch (slug.replace(/^kimi-/, '')) {
    case 'cairn': return (puzzle.w ?? puzzle.words).map(word => sorted(word).join('')).join('/');
    case 'morph': return sorted([puzzle.s, puzzle.t]).join('/');
    case 'tangle': return squareKey(puzzle.g);
    case 'hunch': return puzzle;
    case 'circuit': return sorted(Array.from({length:4}, (_, i) => sorted(puzzle.l.slice(i * 3, i * 3 + 3)).join(''))).join('/');
    case 'quartet': return sorted(puzzle.groups.map(group => sorted(group.members).join('/'))).join('|');
    default: throw new Error(`Unknown Kimi game: ${slug}`);
  }
}
