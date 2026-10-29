import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const contentURL = new URL('../puzzles.mjs', import.meta.url);
const { PUZZLES = [] } = existsSync(contentURL) ? await import(contentURL) : {};
const letters = rows => rows.join('').split('').sort().join('');

test('ships at least 210 distinct, authored puzzle boards', () => {
  assert.ok(PUZZLES.length >= 210, 'The 210-board collection must exist');
  assert.equal(new Set(PUZZLES.map(p => p.id)).size, PUZZLES.length);
  const signatures = PUZZLES.map(p => p.rows.map(r => `${r.start}:${r.answer}`).sort().join('|'));
  assert.equal(new Set(signatures).size, PUZZLES.length, 'Reordering a board does not create a new puzzle');
});

test('the opening puzzle preserves the agreed approachable wordplay', () => {
  assert.deepEqual(PUZZLES[0]?.rows.map(r => [r.start, r.answer]), [
    ['CRANE','CRATE'], ['STARE','SHARE'], ['HATCH','CATCH'],
    ['CROWN','BROWN'], ['BOUND','ROUND'], ['CHAIR','CHAIN'],
  ]);
});

test('every board has exactly six valid rows, useful clues, and conserved letters', () => {
  assert.ok(PUZZLES.length > 0);
  for (const puzzle of PUZZLES) {
    assert.equal(puzzle.rows.length, 6, puzzle.id);
    assert.equal(puzzle.par, 5, puzzle.id);
    assert.ok(['Gentle','Tricky','Clever'].includes(puzzle.difficulty), puzzle.id);
    assert.ok(typeof puzzle.title === 'string' && puzzle.title.length > 0, puzzle.id);
    assert.equal(new Set(puzzle.rows.map(r => r.start)).size, 6, `${puzzle.id}: repeated start`);
    assert.equal(new Set(puzzle.rows.map(r => r.answer)).size, 6, `${puzzle.id}: repeated answer`);
    assert.equal(letters(puzzle.rows.map(r => r.start)), letters(puzzle.rows.map(r => r.answer)), puzzle.id);
    for (const row of puzzle.rows) {
      assert.match(row.start, /^[A-Z]{5}$/, `${puzzle.id}: ${row.start}`);
      assert.match(row.answer, /^[A-Z]{5}$/, `${puzzle.id}: ${row.answer}`);
      assert.equal([...row.start].filter((letter, i) => letter !== row.answer[i]).length, 1, `${puzzle.id}: ${row.start} → ${row.answer}`);
      assert.ok(row.clue.length >= 8 && row.clue.length <= 70, `${puzzle.id}: clue`);
      assert.ok(row.hint.length >= 8 && row.hint.length <= 95, `${puzzle.id}: hint`);
      assert.ok(!new RegExp(`\\b${row.answer}\\b`, 'i').test(row.clue), `${puzzle.id}: clue gives away ${row.answer}`);
    }
  }
});

test('every board is one six-letter cycle, proving the five-swap target is reachable', () => {
  assert.ok(PUZZLES.length > 0);
  for (const puzzle of PUZZLES) {
    const transitions = puzzle.rows.map(row => {
      const index = [...row.start].findIndex((letter, i) => letter !== row.answer[i]);
      return [row.start[index], row.answer[index]];
    });
    assert.equal(new Set(transitions.map(t => t[0])).size, 6, `${puzzle.id}: repeated outgoing letter`);
    assert.equal(new Set(transitions.map(t => t[1])).size, 6, `${puzzle.id}: repeated incoming letter`);
    const next = new Map(transitions);
    const seen = new Set();
    let letter = transitions[0][0];
    while (!seen.has(letter)) {
      assert.ok(next.has(letter), `${puzzle.id}: broken chain`);
      seen.add(letter);
      letter = next.get(letter);
    }
    assert.equal(seen.size, 6, `${puzzle.id}: more than one cycle`);
    assert.equal(letter, transitions[0][0], `${puzzle.id}: chain does not close`);
    const words = puzzle.rows.map(r => r.start.split(''));
    let swaps = 0;
    for (let row = 0; row < 6; row++) {
      const col = words[row].findIndex((letter, i) => letter !== puzzle.rows[row].answer[i]);
      if (col === -1) continue;
      const wanted = puzzle.rows[row].answer[col];
      let donor;
      for (let other = 0; other < 6; other++) {
        if (other === row) continue;
        const otherCol = words[other].findIndex((letter, i) => letter !== puzzle.rows[other].answer[i]);
        if (otherCol >= 0 && words[other][otherCol] === wanted) donor = [other, otherCol];
      }
      assert.ok(donor, `${puzzle.id}: no donor for ${wanted}`);
      const [other, otherCol] = donor;
      [words[row][col], words[other][otherCol]] = [words[other][otherCol], words[row][col]];
      swaps++;
    }
    assert.equal(swaps, 5, puzzle.id);
    assert.deepEqual(words.map(w => w.join('')), puzzle.rows.map(r => r.answer), puzzle.id);
  }
});
