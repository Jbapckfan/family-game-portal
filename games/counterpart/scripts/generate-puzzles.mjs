/** Offline extension of the original curated content; no semantic generation. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUZZLES } from '../puzzles.mjs';

const KIND = 'counterpart';
const TARGET = 210;
const PUBLISHED_COUNT = 180;
const ORIGINAL_COUNT = 30;
const MIN_GAP = 6;
const sourceId = row => KIND === 'counterpart' ? row.sourceId : row.word;
const rowsOf = puzzle => KIND === 'counterpart' ? puzzle.rows : puzzle.pairs;
const key = entries => [...entries].sort().join('|');

// Conservative editorial exclusions: related labels and reversed pairs can
// still produce interchangeable answers. Applies only to newly added boards.
const RELATION_FAMILIES = {
  development: [1, 14, 24, 78],
  coveringProtection: [2, 13, 28, 44, 84, 88],
  instrumentInformation: [3, 23, 38, 69],
  causeEffectOrEvidence: [4, 9, 12, 33, 42, 48, 53, 55, 63, 66, 81, 87, 90],
  creatorCreation: [5, 26, 80],
  partWholeOrCollection: [8, 20, 22, 31, 32, 35, 36, 49, 54, 58, 64, 68, 77, 84],
  practitionerMaterialOrTool: [10, 25, 65, 75, 83],
  entityFunction: [11, 19, 46, 52, 59, 67, 71],
  unitQuantity: [16, 77],
  materialProduct: [17, 73, 87],
  residentHome: [18, 80],
  actionObject: [21, 29, 40, 47, 57, 74],
  routeTraveler: [27, 51],
  suppressionRemoval: [34, 61, 85],
  perception: [37, 79],
  permissionRequestFulfillment: [7, 25, 55, 60, 90],
  informationConclusion: [39, 48, 62, 63, 69, 86],
};

export function generateBoards() {
  const original = PUZZLES.slice(0, ORIGINAL_COUNT);
  const entries = new Map();
  for (const puzzle of original) for (const row of rowsOf(puzzle)) {
    if (!entries.has(sourceId(row))) entries.set(sourceId(row), {
      row,
      families: Object.entries(RELATION_FAMILIES).filter(([, numbers]) => numbers.includes(Number(row.sourceId.slice('analogy-'.length)))).map(([name]) => name),
      words: KIND === 'counterpart' ? row.answer.map(id => puzzle.tiles.find(tile => tile.id === id).word) : [row.word],
    });
  }
  const ids = [...entries.keys()];
  const output = original.map(puzzle => rowsOf(puzzle).map(sourceId));
  let state = 0x5c202610;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  const tried = new Map();
  let backtracks = 0;
  while (output.length < TARGET) {
    const index = output.length;
    const blocked = new Set(output.slice(-(MIN_GAP - 1)).flat());
    // Reconstruct the former cycle before appending; its seam constraints are
    // part of the deterministic published prefix and must not be rerolled.
    const editionEnd = index < PUBLISHED_COUNT ? PUBLISHED_COUNT : TARGET;
    const wrapCount = Math.max(0, index + MIN_GAP - editionEnd);
    for (const id of output.slice(0, wrapCount).flat()) blocked.add(id);
    const uses = new Map(ids.map(id => [id, 0]));
    for (const id of output.flat()) uses.set(id, uses.get(id) + 1);
    const rejected = tried.get(index) || new Set();
    tried.set(index, rejected);
    let chosen;
    for (let attempt = 0; attempt < 800; attempt++) {
      const eligible = shuffle(ids.filter(id => !blocked.has(id)));
      // The old use-count ordering has exhausted its feasible combinations by
      // this point. New boards search the same reviewed pool without forcing
      // its least-used relationships to occur together on every attempt.
      if (index < PUBLISHED_COUNT) eligible.sort((a, b) => uses.get(a) - uses.get(b));
      const candidate = [], words = new Set(), relations = new Set(), families = new Set();
      for (const id of eligible) {
        const entry = entries.get(id);
        if (entry.words.some(word => words.has(word))) continue;
        if (KIND === 'counterpart' && relations.has(entry.row.relationship)) continue;
        if (entry.families.some(family => families.has(family))) continue;
        candidate.push(id);
        entry.words.forEach(word => words.add(word));
        relations.add(entry.row.relationship);
        entry.families.forEach(family => families.add(family));
        if (candidate.length === 5) break;
      }
      if (candidate.length < 5 || rejected.has(key(candidate))) continue;
      const set = new Set(candidate);
      // At least three of five rows differ from every earlier board. Simply
      // shuffling the same familiar five questions never adds to the bank.
      if (output.some(board => board.filter(id => set.has(id)).length > 2)) continue;
      chosen = shuffle(candidate);
      break;
    }
    if (chosen) { output.push(chosen); tried.delete(index + 1); continue; }
    if (output.length <= (index >= PUBLISHED_COUNT ? PUBLISHED_COUNT : ORIGINAL_COUNT) || ++backtracks > 20000) throw new Error(`Could not compose board ${index + 1}`);
    const removed = output.pop();
    const at = output.length;
    if (!tried.has(at)) tried.set(at, new Set());
    tried.get(at).add(key(removed));
  }
  return output.slice(ORIGINAL_COUNT).map(board => board.map(id => KIND === 'counterpart' ? Number(id.slice('analogy-'.length)) : ids.indexOf(id)));
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
