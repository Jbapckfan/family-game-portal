import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, COLLECTION } from '../puzzles.mjs';
import { createGame, getRows, getColumns, rotateRow, useHint, checkBoard, restoreGame } from '../engine.mjs';

const rotate = (strip, right) => right ? strip.slice(4 - right) + strip.slice(0, 4 - right) : strip;
const targetRows = puzzle => Array.from({ length: 5 }, (_, row) => puzzle.columns.map(column => column.answer[row]).join(''));

test('collection contains 180 distinct boards with authored clues and four or five shifted rows', () => {
  assert.equal(PUZZLES.length, 180);
  assert.equal(COLLECTION.boards, 180);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.id)).size, 180);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.columns.map(column => column.answer).sort().join(','))).size, 180);
  for (const puzzle of PUZZLES) {
    assert.equal(puzzle.strips.length, 5, puzzle.id);
    assert.equal(puzzle.columns.length, 4, puzzle.id);
    assert.equal(new Set(puzzle.columns.map(column => column.answer)).size, 4, puzzle.id);
    for (const strip of puzzle.strips) {
      assert.match(strip, /^[A-Z]{4}$/);
      assert.equal(new Set([0, 1, 2, 3].map(right => rotate(strip, right))).size, 4, `${puzzle.id}: no redundant rotations`);
    }
    for (const column of puzzle.columns) {
      assert.match(column.answer, /^[A-Z]{5}$/);
      assert.ok(column.clue.length >= 8, puzzle.id);
      assert.ok(!column.clue.toUpperCase().includes(column.answer), `${puzzle.id}: clue must not contain its answer`);
    }
    const rows = targetRows(puzzle);
    const shifted = puzzle.strips.filter((strip, row) => strip !== rows[row]).length;
    assert.ok(shifted === 4 || shifted === 5, puzzle.id);
    assert.ok(getColumns(puzzle, createGame(puzzle)).every((word, column) => word !== puzzle.columns[column].answer));
  }
});

test('every board requires cross-checking because each single answer leaves multiple row arrangements', () => {
  for (const puzzle of PUZZLES) {
    const rows = targetRows(puzzle);
    assert.ok(rows.filter(row => new Set(row).size < 4).length >= 3, puzzle.id);
    for (let column = 0; column < 4; column++) {
      const alternatives = rows.reduce((product, row) => product * [...row].filter(letter => letter === row[column]).length, 1);
      assert.ok(alternatives > 1, `${puzzle.id}: column ${column + 1} must not determine every strip alone`);
    }
  }
});

test('exhaustive enumeration proves exactly one full solution among all 1024 orientations per board', () => {
  let inspected = 0;
  for (const puzzle of PUZZLES) {
    let solutions = 0;
    for (let code = 0; code < 1024; code++) {
      let value = code;
      const offsets = Array.from({ length: 5 }, () => { const offset = value % 4; value = Math.floor(value / 4); return offset; });
      const rows = puzzle.strips.map((strip, row) => rotate(strip, offsets[row]));
      const columns = Array.from({ length: 4 }, (_, column) => rows.map(row => row[column]).join(''));
      if (columns.every((word, column) => word === puzzle.columns[column].answer)) solutions++;
      inspected++;
    }
    assert.equal(solutions, 1, puzzle.id);
  }
  assert.equal(inspected, 184320);
});

test('every reachable orientation can recover through actual row rotations and finish with an explicit check', () => {
  let recovered = 0;
  for (const puzzle of PUZZLES) {
    const targets = targetRows(puzzle);
    for (let code = 0; code < 1024; code++) {
      let value = code;
      const rotations = Array.from({ length: 5 }, () => { const rotation = value % 4; value = Math.floor(value / 4); return rotation; });
      let state = { ...createGame(puzzle), rotations, moves: 20 };
      state = restoreGame(puzzle, state);
      assert.deepEqual(state.rotations, rotations, `${puzzle.id}: orientation must restore`);
      for (let row = 0; row < 5; row++) {
        let turns = 0;
        while (getRows(puzzle, state)[row] !== targets[row] && turns < 4) {
          state = rotateRow(puzzle, state, row, 1);
          turns++;
        }
        assert.ok(turns < 4, `${puzzle.id}: every row can return to its solution`);
      }
      assert.equal(state.status, 'playing');
      assert.equal(checkBoard(puzzle, state).state.status, 'won');
      recovered++;
    }
  }
  assert.equal(recovered, 184320);
});

test('hints monotonically orient wrong rows from every initial puzzle without locking them', () => {
  for (const puzzle of PUZZLES) {
    let state = createGame(puzzle);
    for (let count = 0; count < 5; count++) {
      const result = useHint(puzzle, state);
      if (!result.hint) break;
      const before = getRows(puzzle, state);
      const after = getRows(puzzle, result.state);
      assert.equal(after.filter((row, index) => row !== before[index]).length, 1);
      assert.equal(after[result.hint.row], targetRows(puzzle)[result.hint.row]);
      state = result.state;
    }
    assert.deepEqual(getColumns(puzzle, state), puzzle.columns.map(column => column.answer));
    assert.equal(state.status, 'playing');
    assert.equal(checkBoard(puzzle, state).state.status, 'won');
  }
});

test('the collection avoids immediate answer repetition and maintains vocabulary variety', () => {
  const words = new Set(PUZZLES.flatMap(puzzle => puzzle.columns.map(column => column.answer)));
  assert.ok(words.size >= 150, `expected at least 150 unique answers, got ${words.size}`);
  assert.equal(words.size, COLLECTION.words);
  for (let index = 1; index < PUZZLES.length; index++) {
    const previous = new Set(PUZZLES[index - 1].columns.map(column => column.answer));
    assert.ok(PUZZLES[index].columns.every(column => !previous.has(column.answer)), `Adjacent boards ${index} and ${index + 1}`);
  }
});
