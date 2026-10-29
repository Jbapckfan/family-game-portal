/** Content identity for scheduling. Rotating or reflecting a ring is not new content. */
export function substantiveKey(puzzle) {
  const variants = [];
  for (const numbers of [puzzle.numbers, [...puzzle.numbers].reverse()]) {
    for (let offset = 0; offset < numbers.length; offset++) {
      variants.push([...numbers.slice(offset), ...numbers.slice(0, offset)].join(','));
    }
  }
  return JSON.stringify([puzzle.sections, puzzle.target, variants.sort()[0]]);
}
