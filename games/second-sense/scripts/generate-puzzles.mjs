/** Offline extension of the original curated content; no semantic generation. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUZZLES } from '../puzzles.mjs';

const KIND = 'second-sense';
const TARGET = 180;
const ORIGINAL_COUNT = 30;
const MIN_GAP = 11;

export function generateBoards() {
  const words = [...new Set(PUZZLES.slice(0, ORIGINAL_COUNT).flatMap(puzzle => puzzle.pairs.map(pair => pair.word)))];
  if (words.length !== 75) throw new Error('The original 75-word editorial pool must remain intact.');
  const additional = [];
  // Work over the five-element field. A board chooses one word from each of
  // five original rows, with column = a*row^2 + b*row + offset (mod 5).
  // Different polynomial families share at most two words, since a nonzero
  // quadratic has at most two roots. The original second round is (a=0,b=1).
  // Each family partitions all 75 words into 15 boards, preserving 11–19-board
  // repeat spacing, including the final-to-first boundary.
  const families = [[0,2],[0,3],[0,4],[0,0],[1,0],[1,1],[1,2],[1,3],[1,4],[2,0]];
  for (const [a, b] of families) for (let group = 0; group < 3; group++) {
    for (let offset = 0; offset < 5; offset++) {
      additional.push(Array.from({ length: 5 }, (_, row) =>
        group * 25 + row * 5 + ((a * row * row + b * row + offset) % 5)));
    }
  }
  if (ORIGINAL_COUNT + additional.length !== TARGET) throw new Error('Incorrect board count.');
  return additional;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const boards = generateBoards();
  const destination = new URL('../puzzles.mjs', import.meta.url);
  const current = readFileSync(destination, 'utf8');
  const block = '// BEGIN ADDITIONAL BOARDS\n'
    + '// Prepared offline from the original curated pool; published boards stay unchanged.\n'
    + `export const ADDITIONAL_BOARDS = ${JSON.stringify(boards)};\n`
    + '// END ADDITIONAL BOARDS';
  const marker = /\/\/ BEGIN ADDITIONAL BOARDS[\s\S]*?\/\/ END ADDITIONAL BOARDS/;
  if (!marker.test(current)) throw new Error('Missing additional-board section.');
  const source = current.replace(marker, block);
  if (process.argv.includes('--check')) {
    if (current !== source) throw new Error('Generated collection differs from the checked-in file.');
  } else writeFileSync(destination, source);
  console.log(JSON.stringify({ game: KIND, boards: ORIGINAL_COUNT + boards.length, addedBoards: boards.length, minimumRepeatGap: MIN_GAP }));
}
