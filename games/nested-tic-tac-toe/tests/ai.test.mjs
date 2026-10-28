import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, legalMoves, playMove } from '../engine.mjs';
import { chooseMove } from '../ai.mjs';

function aiPosition(cells, {boards, forcedBoard = 4} = {}) {
  const state = createGame();
  state.turn = 'O';
  state.forcedBoard = forcedBoard;
  state.cells[forcedBoard ?? 4] = [...cells];
  if (boards) state.boards = boards;
  return state;
}

for (const skill of ['casual','tactical']) {
  test(`${skill} takes a forced mini-board win`, () => {
    const state = aiPosition(['O','O',null,'X',null,null,null,'X',null]);
    assert.deepEqual(chooseMove(state, {skill}).move, {board:4,cell:2});
  });

  test(`${skill} blocks an immediate forced mini-board loss`, () => {
    const state = aiPosition(['X','X',null,'O',null,null,null,null,null]);
    assert.deepEqual(chooseMove(state, {skill}).move, {board:4,cell:2});
  });

  test(`${skill} takes a macro win before other opportunities`, () => {
    const state = aiPosition(['O','O',null,'X',null,null,null,'X',null], {forcedBoard:2, boards:['O','O',null,null,null,null,null,null,null]});
    assert.deepEqual(chooseMove(state, {skill}).move, {board:2,cell:2});
  });

  test(`${skill} blocks a macro-losing mini-board threat`, () => {
    const state = aiPosition(['X','X',null,'O',null,null,null,null,null], {forcedBoard:2, boards:['X','X',null,null,null,null,null,null,null]});
    assert.deepEqual(chooseMove(state, {skill}).move, {board:2,cell:2});
  });

  test(`${skill} returns deterministic legal moves in forced and free positions`, () => {
    let state = createGame();
    for (let step = 0; step < 30 && state.status === 'playing'; step++) {
      if (state.turn === 'O') {
        const before = JSON.stringify(state);
        const choice = chooseMove(state, {skill});
        assert.deepEqual(chooseMove(state, {skill}), choice);
        assert.equal(JSON.stringify(state), before);
        assert.ok(choice.nodes <= (skill === 'casual' ? 180 : 1600));
        assert.ok(legalMoves(state).some(move => move.board === choice.move.board && move.cell === choice.move.cell));
        state = playMove(state, choice.move);
      } else {
        const moves = legalMoves(state);
        state = playMove(state, moves[(step * 17 + 4) % moves.length]);
      }
    }
    const free = createGame();
    free.turn = 'O';
    free.boards[0] = 'draw';
    free.boards[4] = 'X';
    const move = chooseMove(free, {skill}).move;
    assert.ok(move.board !== 0 && move.board !== 4);
    assert.ok(playMove(free, move));
  });

  test(`${skill} makes only legal moves through a complete match`, () => {
    let state = createGame();
    while (state.status === 'playing') {
      const moves = legalMoves(state);
      const move = state.turn === 'O' ? chooseMove(state, {skill}).move : moves[(state.history.length * 11 + 7) % moves.length];
      const next = playMove(state, move);
      assert.ok(next);
      state = next;
    }
    assert.equal(chooseMove(state, {skill}).move, null);
    assert.equal(chooseMove(state, {skill}).nodes, 0);
  });
}
