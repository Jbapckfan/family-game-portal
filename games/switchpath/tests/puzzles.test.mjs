import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, COLLECTION } from '../puzzles.mjs';
import { createGame, selectCell, useHint, restoreGame, legalNextCells } from '../engine.mjs';

const neighbors = cell => Array.from({ length: 16 }, (_, other) => other)
  .filter(other => Math.abs(Math.floor(cell / 4) - Math.floor(other / 4)) + Math.abs(cell % 4 - other % 4) === 1);
function choices(board, path) {
  return neighbors(path.at(-1)).filter(cell => !path.includes(cell) && (cell !== board.end || path.length === 15)
    && (path.length % 2 ? board.values[cell] > board.values[path.at(-1)] : board.values[cell] < board.values[path.at(-1)]));
}
function walk(board, path, visit) {
  visit(path);
  if (path.length === 16) return;
  for (const cell of choices(board, path)) walk(board, [...path, cell], visit);
}
const transforms = Array.from({ length: 8 }, (_, type) => cell => {
  let row = Math.floor(cell / 4), col = cell % 4;
  if (type >= 4) col = 3 - col;
  for (let count = 0; count < type % 4; count++) [row, col] = [col, 3 - row];
  return row * 4 + col;
});
function layoutKey(board) {
  return transforms.map(transform => {
    const values = Array(16);
    board.values.forEach((value, cell) => { values[transform(cell)] = value; });
    return `${transform(board.start)}:${transform(board.end)}:${values.join(',')}`;
  }).sort()[0];
}
const shapeKey = path => transforms.map(transform => path.map(transform).join(',')).sort()[0];

test('217 puzzles use every number once, fixed marked endpoints, and distinct layouts even under symmetry', () => {
  assert.equal(PUZZLES.length, 217);
  assert.equal(COLLECTION.boards, 217);
  assert.equal(new Set(PUZZLES.map(board => board.id)).size, 217);
  assert.equal(new Set(PUZZLES.map(layoutKey)).size, 217);
  for (const board of PUZZLES) {
    assert.deepEqual([...board.values].sort((a, b) => a - b), Array.from({ length: 16 }, (_, index) => index + 1), board.id);
    assert.ok(Number.isInteger(board.start) && board.start >= 0 && board.start < 16);
    assert.ok(Number.isInteger(board.end) && board.end >= 0 && board.end < 16);
    assert.notEqual(board.start, board.end);
    assert.equal(board.solution[0], board.start);
    assert.equal(board.solution.at(-1), board.end);
    assert.equal(board.solution.length, 16);
    assert.equal(new Set(board.solution).size, 16);
  }
});

test('independent exhaustive search proves one solution per board and at least four genuine branch choices', () => {
  let visited = 0;
  for (const board of PUZZLES) {
    const solutions = [];
    walk(board, [board.start], path => {
      visited++;
      if (path.length === 16 && path.at(-1) === board.end) solutions.push(path);
    });
    assert.equal(solutions.length, 1, board.id);
    assert.deepEqual(solutions[0], board.solution);
    const branches = board.solution.slice(0, -1).filter((_, index) => choices(board, board.solution.slice(0, index + 1)).length > 1).length;
    assert.ok(branches >= 4, `${board.id}: ${branches} branch points`);
    assert.equal(board.branchPoints, branches);
  }
  assert.equal(visited, COLLECTION.reachablePaths);
});

test('every legal partial path can rewind and recover through actual game actions', () => {
  let recovered = 0;
  for (const board of PUZZLES) {
    walk(board, [board.start], path => {
      let state = restoreGame(board, { ...createGame(board), path, moves: path.length - 1 });
      assert.deepEqual(state.path, path);
      if (state.status === 'won') { recovered++; return; }
      assert.deepEqual(legalNextCells(board, state), choices(board, path));
      if (path.length > 1) {
        const reset = selectCell(board, state, board.start);
        assert.equal(reset.action, 'rewind');
        state = reset.state;
        assert.deepEqual(state.path, [board.start]);
      }
      for (const cell of board.solution.slice(1)) {
        const result = selectCell(board, state, cell);
        assert.equal(result.accepted, true, `${board.id}: recovery step ${cell}`);
        state = result.state;
      }
      assert.equal(state.status, 'won');
      recovered++;
    });
  }
  assert.equal(recovered, COLLECTION.reachablePaths);
});

test('a hint from every legal partial path returns to a correct prefix and remains finishable', () => {
  let checked = 0;
  for (const board of PUZZLES) {
    walk(board, [board.start], path => {
      const state = restoreGame(board, { ...createGame(board), path, moves: path.length - 1 });
      if (state.status === 'won') return;
      const result = useHint(board, state);
      assert.ok(result.hint, board.id);
      assert.equal(result.state.hints, 1);
      assert.equal(result.state.moves, state.moves + 1);
      assert.deepEqual(result.state.path, board.solution.slice(0, result.state.path.length));
      assert.deepEqual(restoreGame(board, structuredClone(result.state)), result.state);
      checked++;
    });
  }
  assert.equal(checked, COLLECTION.reachablePaths - 217);
});

test('opening puzzle stays stable and the collection uses many genuinely different route shapes', () => {
  assert.deepEqual(PUZZLES[0].values, [1, 11, 6, 15, 5, 10, 8, 4, 2, 13, 3, 12, 16, 7, 14, 9]);
  assert.equal(PUZZLES[0].start, 0);
  assert.equal(PUZZLES[0].end, 12);
  assert.deepEqual(PUZZLES[0].solution, [0, 4, 8, 9, 5, 1, 2, 3, 7, 6, 10, 11, 15, 14, 13, 12]);
  const shapes = new Set(PUZZLES.map(board => shapeKey(board.solution)));
  assert.ok(shapes.size >= 30, `expected at least 30 route shapes modulo rotations/reflections, got ${shapes.size}`);
  assert.equal(shapes.size, COLLECTION.routeShapes);
  assert.ok(new Set(PUZZLES.map(board => board.start)).size >= 8);
});
