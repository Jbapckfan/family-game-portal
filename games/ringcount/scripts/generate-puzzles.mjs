import {writeFile, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {solvePuzzle, getSegments} from '../engine.mjs';

const SEED = 0x71c0a26;
const COUNT = 210;
const LENGTH_PATTERNS = [[2, 2, 3, 5], [2, 2, 4, 4], [2, 3, 3, 4]];
const FIRST = [5, 4, 6, 9, 6, 7, 2, 5, 1, 8, 3, 4];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function canonical(numbers) {
  const variants = [];
  for (const ring of [numbers, [...numbers].reverse()])
    for (let offset = 0; offset < ring.length; offset++)
      variants.push([...ring.slice(offset), ...ring.slice(0, offset)].join(','));
  return variants.sort()[0];
}

function decoyArcs(numbers, target) {
  let count = 0;
  for (let start = 0; start < numbers.length; start++) {
    let sum = 0;
    for (let length = 1; length <= numbers.length; length++) {
      sum += numbers[(start + length - 1) % numbers.length];
      if (sum === target) count++;
      if (sum >= target) break;
    }
  }
  return count - 4;
}

export function generatePuzzles() {
  const random = createRandom(SEED);
  const integer = (minimum, maximum) => minimum + Math.floor(random() * (maximum - minimum + 1));
  const shuffle = values => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const other = integer(0, index);
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };
  const composition = (target, length) => {
    const values = [];
    let left = target;
    for (let index = 0; index < length; index++) {
      const remaining = length - index - 1;
      const value = integer(Math.max(1, left - remaining * 9), Math.min(9, left - remaining));
      values.push(value);
      left -= value;
    }
    return shuffle(values);
  };
  const boards = [];
  const seen = new Set();
  let attempts = 0;
  while (boards.length < COUNT && attempts++ < 50_000) {
    const target = 15 + boards.length % 4;
    let numbers;
    if (boards.length === 0) numbers = [...FIRST];
    else {
      const lengths = shuffle(LENGTH_PATTERNS[integer(0, LENGTH_PATTERNS.length - 1)]);
      numbers = lengths.flatMap(length => composition(target, length));
      if (random() < 0.5) numbers.reverse();
      const offset = integer(0, numbers.length - 1);
      numbers = [...numbers.slice(offset), ...numbers.slice(0, offset)];
    }
    const key = canonical(numbers);
    if (seen.has(key)) continue;
    const candidate = {numbers, target, sections: 4};
    const solutions = solvePuzzle(candidate);
    if (solutions.length !== 1) continue;
    const solution = solutions[0];
    const lengths = getSegments(candidate, solution).map(segment => segment.indices.length);
    if (new Set(lengths).size < 2) continue;
    const decoys = decoyArcs(numbers, target);
    if (decoys < 2) continue;
    const number = String(boards.length + 1).padStart(3, '0');
    boards.push({
      id: `ringcount-${number}`, title: `Circle ${number}`, difficulty: decoys >= 4 ? 'Deep' : 'Sharp',
      numbers, target, sections: 4, solution, decoyArcs: decoys,
    });
    seen.add(key);
  }
  if (boards.length !== COUNT) throw new Error(`Generated ${boards.length} certified boards; expected ${COUNT}.`);
  return boards;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const boards = generatePuzzles();
  const source = `/** ${COUNT} deterministic boards; each has one certified four-cut solution. */\nexport const PUZZLES = Object.freeze(${JSON.stringify(boards, null, 2)}.map(puzzle => Object.freeze({\n  ...puzzle, numbers: Object.freeze(puzzle.numbers), solution: Object.freeze(puzzle.solution),\n})));\n`;
  const destination = new URL('../puzzles.mjs', import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(destination, 'utf8') !== source) throw new Error('Generated collection differs from the checked-in file.');
  } else await writeFile(destination, source);
  console.log(`Generated ${boards.length} unique rings; all ${boards.length * 495} cut sets certified.`);
}
