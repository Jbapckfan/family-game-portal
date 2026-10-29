/** Deterministic construction and exhaustive certification of Switchpath boards. */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const neighbors = Array.from({ length: 16 }, (_, cell) => Array.from({ length: 16 }, (_, other) => other)
  .filter(other => Math.abs(Math.floor(cell / 4) - Math.floor(other / 4)) + Math.abs(cell % 4 - other % 4) === 1));
const transforms = Array.from({ length: 8 }, (_, type) => cell => {
  let row = Math.floor(cell / 4), col = cell % 4;
  if (type >= 4) col = 3 - col;
  for (let count = 0; count < type % 4; count++) [row, col] = [col, 3 - row];
  return row * 4 + col;
});
const shapeKey = path => transforms.map(transform => path.map(transform).join(',')).sort()[0];
function layoutKey(board) {
  return transforms.map(transform => {
    const values = Array(16);
    board.values.forEach((value, cell) => { values[transform(cell)] = value; });
    return `${transform(board.start)}:${transform(board.end)}:${values.join(',')}`;
  }).sort()[0];
}

// A different numbering with the same neighboring inequalities is the same
// decision problem. Keep the published prefix, then reject those equivalents.
function challengeKey(board) {
  return transforms.map(transform => {
    const values = Array(16);
    board.values.forEach((value, cell) => { values[transform(cell)] = value; });
    const comparisons = [];
    for (let cell = 0; cell < 16; cell++) {
      if (cell % 4 < 3) comparisons.push(values[cell] < values[cell + 1] ? 1 : 0);
      if (cell < 12) comparisons.push(values[cell] < values[cell + 4] ? 1 : 0);
    }
    return `${transform(board.start)}:${transform(board.end)}:${comparisons.join('')}`;
  }).sort()[0];
}

const routes = [];
function allRoutes(path, mask) {
  if (path.length === 16) { routes.push(path); return; }
  for (const cell of neighbors[path.at(-1)]) {
    if (!(mask & (1 << cell))) allRoutes([...path, cell], mask | (1 << cell));
  }
}
for (let cell = 0; cell < 16; cell++) allRoutes([cell], 1 << cell);

function choices(board, path) {
  return neighbors[path.at(-1)].filter(cell => !path.includes(cell) && (cell !== board.end || path.length === 15)
    && (path.length % 2 ? board.values[cell] > board.values[path.at(-1)] : board.values[cell] < board.values[path.at(-1)]));
}
function certify(board, stopAfterTwo = true) {
  const solutions = [];
  let reachable = 0;
  function search(path) {
    reachable++;
    if (path.length === 16) {
      if (path.at(-1) === board.end) solutions.push(path);
      return;
    }
    for (const cell of choices(board, path)) {
      if (stopAfterTwo && solutions.length >= 2) return;
      search([...path, cell]);
    }
  }
  search([board.start]);
  return { solutions, reachable };
}
function branches(board, path) {
  return path.slice(0, -1).filter((_, index) => choices(board, path.slice(0, index + 1)).length > 1).length;
}

let seed = 20261024;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}
function alternatingValues() {
  const values = shuffled(Array.from({ length: 16 }, (_, index) => index + 1));
  for (let index = 0; index < values.length - 1; index++) {
    if (index % 2 === 0 ? values[index] > values[index + 1] : values[index] < values[index + 1]) {
      [values[index], values[index + 1]] = [values[index + 1], values[index]];
    }
  }
  return values;
}

const opening = {
  values: [1, 11, 6, 15, 5, 10, 8, 4, 2, 13, 3, 12, 16, 7, 14, 9], start: 0, end: 12,
  solution: [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11, 15, 14, 13, 12],
};
const puzzles = [];
const seen = new Set();
const challenges = new Set();
const shapes = new Map();
let reachablePaths = 0;
for (let index = 0; index < 217; index++) {
  let chosen;
  for (let attempt = 0; attempt < 100000; attempt++) {
    let candidate;
    if (index === 0) candidate = { ...opening, values: [...opening.values], solution: [...opening.solution] };
    else {
      const route = routes[Math.floor(random() * routes.length)];
      const shape = shapeKey(route);
      if ((shapes.get(shape) ?? 0) >= (index < 90 ? 3 : 5)) continue;
      const sequence = alternatingValues();
      const values = Array(16);
      route.forEach((cell, step) => { values[cell] = sequence[step]; });
      candidate = { values, start: route[0], end: route.at(-1), solution: [...route] };
    }
    const branchPoints = branches(candidate, candidate.solution);
    if (branchPoints < 4 || seen.has(layoutKey(candidate))) continue;
    if (index >= 90 && challenges.has(challengeKey(candidate))) continue;
    const certified = certify(candidate);
    if (certified.solutions.length !== 1) continue;
    chosen = { ...candidate, branchPoints };
    reachablePaths += certify(candidate, false).reachable;
    break;
  }
  if (!chosen) throw new Error(`Could not certify board ${index + 1}`);
  const shape = shapeKey(chosen.solution);
  shapes.set(shape, (shapes.get(shape) ?? 0) + 1);
  seen.add(layoutKey(chosen));
  challenges.add(challengeKey(chosen));
  puzzles.push({
    id: `switchpath-${String(index + 1).padStart(3, '0')}`, title: 'Change your direction',
    difficulty: chosen.branchPoints >= 6 ? 'Tricky' : 'Sharp', ...chosen,
  });
}

const collection = {
  boards: puzzles.length, distinctChallenges: challenges.size, routeShapes: shapes.size, reachablePaths,
  minimumBranchPoints: Math.min(...puzzles.map(board => board.branchPoints)),
  source: 'Deterministic ranked-grid construction; exhaustive unique-path certification.',
  cycle: 'The 217-board collection repeats after 217 days; it contains 210 distinct comparison challenges. Seven equivalent challenges in the original 90-board edition are retained to preserve saved games.',
};
const output = `// Generated by scripts/generate-puzzles.mjs. Do not edit by hand.\nexport const COLLECTION = ${JSON.stringify(collection, null, 2)};\n\nexport const PUZZLES = ${JSON.stringify(puzzles, null, 2)};\n`;
const path = fileURLToPath(new URL('../puzzles.mjs', import.meta.url));
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output) throw new Error('Generated collection differs from the checked-in file.');
} else writeFileSync(path, output);
console.log(JSON.stringify({ ...collection, rawHamiltonianRoutes: routes.length, starts: new Set(puzzles.map(board => board.start)).size }));
