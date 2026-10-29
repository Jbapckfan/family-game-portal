import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES } from '../puzzles.mjs';
import { TRANSFORMATIONS, generatePuzzles } from '../scripts/generate-puzzles.mjs';

// Deliberately independent of the generator's insertion/matching helpers.
function possibleFits(row, tiles) {
  const fits = [];
  for (const tile of tiles) {
    for (let gap = 0; gap <= 4; gap += 1) {
      if ([row.seed.slice(0, gap), tile.letters, row.seed.slice(gap)].join('') === row.answer) {
        fits.push({ tileId: tile.id, letters: tile.letters, gap });
      }
    }
  }
  return fits;
}

function countAssignments(rows, tiles, rowIndex = 0, used = new Set()) {
  if (rowIndex === rows.length) return 1;
  let count = 0;
  const candidateIds = new Set(possibleFits(rows[rowIndex], tiles).map(fit => fit.tileId));
  for (const tileId of candidateIds) {
    if (used.has(tileId)) continue;
    used.add(tileId);
    count += countAssignments(rows, tiles, rowIndex + 1, used);
    used.delete(tileId);
  }
  return count;
}

const rowKey = row => `${row.seed}:${row.answer}`;

test('the edition has 210 complete, uniquely identified daily boards', () => {
  assert.equal(PUZZLES.length, 210);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.id)).size, PUZZLES.length);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.title)).size, PUZZLES.length);
  PUZZLES.forEach((puzzle, index) => {
    assert.equal(puzzle.id, `inbetween-${String(index + 1).padStart(3, '0')}`);
    assert.match(puzzle.title, /^[A-Z][A-Za-z ,'-]+$/);
    assert.ok(puzzle.title.length >= 6 && puzzle.title.length <= 40);
    assert.ok(['Gentle', 'Medium', 'Tricky'].includes(puzzle.difficulty));
    assert.equal(puzzle.rows.length, 6);
    assert.equal(puzzle.tiles.length, 6);
  });
});

test('the requested introductory puzzle stays intact', () => {
  assert.deepEqual(PUZZLES[0].rows.map(({ seed, answer }) => [seed, answer]), [
    ['CART', 'CARPET'], ['PLAN', 'PLANET'], ['SAND', 'STRAND'],
    ['NOTE', 'NOTICE'], ['FORM', 'FORMAT'], ['PAST', 'PASTRY'],
  ]);
  assert.deepEqual(PUZZLES[0].tiles.map(tile => tile.letters).sort(), ['AT', 'ET', 'IC', 'PE', 'RY', 'TR']);
  assert.equal(PUZZLES[0].difficulty, 'Gentle');
});

test('every row uses the intended 4 + 2 = 6 operation, and every bank is used exactly once', () => {
  for (const puzzle of PUZZLES) {
    const label = puzzle.id;
    assert.equal(new Set(puzzle.rows.map(row => row.seed)).size, 6, `${label}: duplicate seed`);
    assert.equal(new Set(puzzle.rows.map(row => row.answer)).size, 6, `${label}: duplicate answer`);
    assert.equal(new Set(puzzle.tiles.map(tile => tile.id)).size, 6, `${label}: duplicate tile ID`);
    assert.equal(new Set(puzzle.tiles.map(tile => tile.letters)).size, 6, `${label}: duplicate pair`);
    const assigned = [];
    const positions = [];
    for (const tile of puzzle.tiles) {
      assert.equal(typeof tile.id, 'string');
      assert.ok(tile.id.length > 0);
      assert.match(tile.letters, /^[A-Z]{2}$/);
    }
    for (const row of puzzle.rows) {
      assert.match(row.seed, /^[A-Z]{4}$/);
      assert.match(row.answer, /^[A-Z]{6}$/);
      assert.equal(row.clue.trim(), row.clue);
      assert.ok(row.clue.length >= 5 && row.clue.length <= 85, `${label}: clue length`);
      assert.ok(!new RegExp(`\\b${row.answer}\\b`, 'i').test(row.clue), `${label}: clue gives away answer`);
      const fits = possibleFits(row, puzzle.tiles);
      assert.ok(fits.length > 0, `${label}: ${row.seed} cannot form ${row.answer}`);
      const usableTileIds = [...new Set(fits.map(fit => fit.tileId))];
      assert.equal(usableTileIds.length, 1, `${label}: locking ${row.answer} could consume another row's tile`);
      assigned.push(usableTileIds[0]);
      positions.push(fits[0].gap);
    }
    assert.equal(new Set(assigned).size, 6, `${label}: one tile is required twice`);
    assert.equal(countAssignments(puzzle.rows, puzzle.tiles), 1, `${label}: assignment is not unique`);
    assert.ok(new Set(positions).size >= 3, `${label}: too little positional variety`);
    const answerOrder = puzzle.rows.map(row => possibleFits(row, puzzle.tiles)[0].letters);
    assert.notDeepEqual(puzzle.tiles.map(tile => tile.letters), answerOrder, `${label}: bank reveals row order`);
  }
});

test('boards have genuinely different content and no answer repeats within six days', () => {
  const signatures = PUZZLES.map(puzzle => puzzle.rows.map(rowKey).sort().join('|'));
  assert.equal(new Set(signatures).size, PUZZLES.length, 'a board is just another board reordered');
  for (let current = 0; current < PUZZLES.length; current += 1) {
    const currentKeys = new Set(PUZZLES[current].rows.map(rowKey));
    for (let previous = 0; previous < current; previous += 1) {
      const overlap = PUZZLES[previous].rows.filter(row => currentKeys.has(rowKey(row))).length;
      assert.ok(overlap <= 3, `${PUZZLES[current].id} shares more than half its rows with ${PUZZLES[previous].id}`);
      if (current - previous <= 6) assert.equal(overlap, 0, 'a transformation repeats too soon');
    }
    for (let offset = 1; offset <= 6; offset += 1) {
      const next = (current + offset) % PUZZLES.length;
      const overlap = PUZZLES[next].rows.filter(row => currentKeys.has(rowKey(row))).length;
      assert.equal(overlap, 0, 'a transformation repeats too soon across the edition cycle');
    }
  }
});

test('the curated vocabulary pool is broad, internally sound, and fully represented', () => {
  assert.ok(TRANSFORMATIONS.length >= 80);
  const allKeys = TRANSFORMATIONS.map(rowKey);
  assert.equal(new Set(allKeys).size, allKeys.length);
  for (const row of TRANSFORMATIONS) {
    assert.match(row.seed, /^[A-Z]{4}$/);
    assert.match(row.answer, /^[A-Z]{6}$/);
    assert.match(row.letters, /^[A-Z]{2}$/);
    assert.equal(row.seed.slice(0, row.gap) + row.letters + row.seed.slice(row.gap), row.answer);
  }
  const usedKeys = new Set(PUZZLES.flatMap(puzzle => puzzle.rows.map(rowKey)));
  assert.deepEqual([...usedKeys].sort(), [...allKeys].sort());
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.difficulty)).size, 3);
});

test('the checked-in edition is reproduced exactly by the deterministic offline generator', () => {
  assert.deepEqual(generatePuzzles(), PUZZLES);
});
