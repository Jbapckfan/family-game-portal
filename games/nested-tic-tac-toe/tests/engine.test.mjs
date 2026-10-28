import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, legalMoves, playMove, boardResult, matchResult, replayHistory, saveMatch, restoreMatch } from '../engine.mjs';

const draw = ['X','O','X','X','O','O','O','X','X'];
const position = (changes = {}) => ({ ...createGame(), ...changes });

test('opening move allows all 81 cells and does not mutate its input', () => {
  const game = createGame();
  assert.equal(legalMoves(game).length, 81);
  const next = playMove(game, { board: 2, cell: 6 });
  assert.equal(next.cells[2][6], 'X');
  assert.equal(game.cells[2][6], null);
  assert.equal(next.turn, 'O');
  assert.equal(next.forcedBoard, 6);
  assert.deepEqual(next.history, [{ board: 2, cell: 6 }]);
});

test('routing restricts the next move to the matching open mini board', () => {
  const game = playMove(createGame(), { board: 8, cell: 3 });
  assert.equal(legalMoves(game).length, 9);
  assert.ok(legalMoves(game).every(move => move.board === 3));
  assert.equal(playMove(game, { board: 2, cell: 0 }), null);
});

test('occupied, malformed and out-of-range moves are rejected', () => {
  const game = playMove(createGame(), { board: 4, cell: 4 });
  for (const move of [null, {}, {board:-1,cell:0}, {board:0,cell:9}, {board:4,cell:4}, {board:4.5,cell:1}, {board:'4',cell:1}]) {
    assert.equal(playMove(game, move), null);
  }
});

test('each row, column and diagonal can claim a mini board', () => {
  for (const line of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) {
    const cells = Array(9).fill(null);
    for (const index of line) cells[index] = 'O';
    assert.equal(boardResult(cells), 'O');
  }
});

test('full mini boards are drawn unless the final cell wins', () => {
  assert.equal(boardResult(draw), 'draw');
  assert.equal(boardResult(['X','O','X','O','X','O','O','X','X']), 'X');
});

test('a mini win claims its macro square and cannot receive more moves', () => {
  const game = position({ forcedBoard: 0 });
  game.cells[0] = ['X','X',null,'O',null,null,null,'O',null];
  const next = playMove(game, { board: 0, cell: 2 });
  assert.equal(next.boards[0], 'X');
  assert.equal(next.forcedBoard, 2);
  assert.ok(legalMoves({ ...next, forcedBoard:null }).every(move => move.board !== 0));
});

test('sending to a won or drawn board grants a free choice among unfinished boards', () => {
  for (const result of ['X', 'O', 'draw']) {
    const game = position();
    game.boards[4] = result;
    game.cells[4] = result === 'draw' ? [...draw] : Array(9).fill(result);
    const next = playMove(game, { board: 0, cell: 4 });
    assert.equal(next.forcedBoard, null);
    assert.equal(legalMoves(next).length, 71);
    assert.ok(legalMoves(next).every(move => move.board !== 4));
  }
});

test('a final drawing move closes a mini board without claiming it', () => {
  const game = position({ forcedBoard:0 });
  game.cells[0] = [...draw];
  game.cells[0][8] = null;
  assert.equal(playMove(game, {board:0,cell:8}).boards[0], 'draw');
});

test('macro lines win, drawn squares never form a winning line', () => {
  assert.equal(matchResult(['O',null,'X',null,'O',null,'X',null,'O']), 'O');
  assert.equal(matchResult(['draw','draw','draw',null,null,null,null,null,null]), 'playing');
  assert.equal(matchResult(['X','O','X','O','O','X','X','X','O']), 'draw');
});

test('claiming the third macro square ends the match immediately', () => {
  const game = position({ forcedBoard:2 });
  game.boards[0] = game.boards[1] = 'X';
  game.cells[2] = ['X','X',null,'O','O',null,null,null,null];
  const next = playMove(game, {board:2,cell:2});
  assert.equal(next.status, 'X');
  assert.equal(next.forcedBoard, null);
  assert.equal(legalMoves(next).length, 0);
  assert.equal(playMove(next, {board:3,cell:0}), null);
});

test('the last closed board ends a match with no macro line as a draw', () => {
  const game = position({forcedBoard:8});
  game.boards = ['X','O','X','O','draw','X','O','X',null];
  game.cells[8] = [...draw];
  game.cells[8][8] = null;
  const next = playMove(game, {board:8,cell:8});
  assert.equal(next.status, 'draw');
  assert.equal(next.boards[8], 'draw');
});

test('full move history replays deterministically and restores either turn', () => {
  const history = [{board:4,cell:0},{board:0,cell:8},{board:8,cell:4},{board:4,cell:3}];
  let game = createGame();
  for (const move of history) {
    game = playMove(game, move);
    assert.deepEqual(replayHistory(game.history), game);
    const restored = restoreMatch(saveMatch(game, {skill:'casual',guideDismissed:true}));
    assert.deepEqual(restored.state, game);
    assert.equal(restored.skill, 'casual');
    assert.equal(restored.guideDismissed, true);
  }
});

test('illegal history, corrupt shapes and incompatible saves fail safely', () => {
  const valid = saveMatch(createGame(), {skill:'tactical',guideDismissed:false});
  for (const value of [null, [], 'bad', {...valid,version:2}, {...valid,skill:'impossible'}, {...valid,guideDismissed:'yes'}, {...valid,history:{}}, {...valid,history:[{board:0,cell:0},{board:1,cell:1}]}, {...valid,history:[{board:0,cell:0},{board:0,cell:0}]}, {...valid,history:Array(82).fill({board:0,cell:0})}]) {
    assert.equal(restoreMatch(value), null);
  }
  assert.equal(replayHistory(null), null);
});

test('deterministic complete legal games round-trip and reject moves after the result', () => {
  for (let seed = 1; seed <= 12; seed++) {
    let game = createGame();
    let step = 0;
    while (game.status === 'playing') {
      const moves = legalMoves(game);
      game = playMove(game, moves[(seed * 13 + step++ * 7) % moves.length]);
    }
    assert.ok(game.history.length <= 81);
    assert.deepEqual(restoreMatch(saveMatch(game)).state, game);
    assert.equal(replayHistory([...game.history,{board:0,cell:0}]), null);
  }
});
