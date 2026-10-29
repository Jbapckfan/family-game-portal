import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, boardResult, matchResult, legalMoves, playMove, saveMatch, restoreMatch,
} from '../engine.mjs';
import { chooseMove } from '../ai.mjs';

// Independent rule oracle: flat 81-cell storage, coordinate-based line checks,
// and no imported engine line table, result helper, legality helper, or replay.
function wins(grid, mark) {
  for (let coordinate = 0; coordinate < 3; coordinate++) {
    if ([0, 1, 2].every(column => grid[coordinate * 3 + column] === mark)) return true;
    if ([0, 1, 2].every(row => grid[row * 3 + coordinate] === mark)) return true;
  }
  return [0, 1, 2].every(index => grid[index * 4] === mark)
    || [0, 1, 2].every(index => grid[2 + index * 2] === mark);
}

function result(grid, unfinished) {
  if (wins(grid, 'X')) return 'X';
  if (wins(grid, 'O')) return 'O';
  return grid.includes(null) ? unfinished : 'draw';
}

function emptyReference() {
  return { squares:Array(81).fill(null), claims:Array(9).fill(null),
    player:'X', destination:null, outcome:'playing', moves:[] };
}

function referenceMoves(reference) {
  if (reference.outcome !== 'playing') return [];
  const boardRequired = reference.destination !== null
    && reference.claims[reference.destination] === null ? reference.destination : null;
  return Array.from({length:81}, (_, index) => ({board:Math.floor(index / 9), cell:index % 9}))
    .filter(move => reference.claims[move.board] === null
      && (boardRequired === null || boardRequired === move.board)
      && reference.squares[move.board * 9 + move.cell] === null);
}

function referenceStep(reference, move) {
  const squares = [...reference.squares], claims = [...reference.claims];
  squares[move.board * 9 + move.cell] = reference.player;
  claims[move.board] = result(squares.slice(move.board * 9, move.board * 9 + 9), null);
  const outcome = result(claims, 'playing');
  return {
    squares, claims, player:reference.player === 'X' ? 'O' : 'X',
    destination:outcome === 'playing' && claims[move.cell] === null ? move.cell : null,
    outcome, moves:[...reference.moves, {...move}],
  };
}

function projected(reference) {
  return {
    cells:Array.from({length:9}, (_, board) => reference.squares.slice(board * 9, board * 9 + 9)),
    boards:reference.claims, turn:reference.player, forcedBoard:reference.destination,
    status:reference.outcome, history:reference.moves,
  };
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function randomSource(seed) {
  let value = seed >>> 0;
  return limit => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value % limit;
  };
}

const sameMove = (a, b) => a.board === b.board && a.cell === b.cell;

test('all mini-board assignments agree with an independent line/draw oracle', t => {
  let checked = 0, impossibleDualWinners = 0;
  for (let code = 0; code < 3 ** 9; code++) {
    let remainder = code;
    const cells = Array.from({length:9}, () => {
      const value = [null, 'X', 'O'][remainder % 3];
      remainder = Math.floor(remainder / 3);
      return value;
    });
    // The public engine never reaches two winners: the first win closes a board.
    if (wins(cells, 'X') && wins(cells, 'O')) { impossibleDualWinners++; continue; }
    assert.equal(boardResult(freeze(cells)), result(cells, null), JSON.stringify(cells));
    checked++;
  }
  assert.equal(checked + impossibleDualWinners, 19683);
  t.diagnostic(JSON.stringify({assignments:19683,checked,impossibleDualWinners}));
});

test('all macro assignments treat drawn boards as blockers and resolve wins before fullness', t => {
  let checked = 0, impossibleDualWinners = 0, terminalDraws = 0;
  for (let code = 0; code < 4 ** 9; code++) {
    let remainder = code;
    const claims = Array.from({length:9}, () => {
      const value = [null, 'X', 'O', 'draw'][remainder % 4];
      remainder = Math.floor(remainder / 4);
      return value;
    });
    if (wins(claims, 'X') && wins(claims, 'O')) { impossibleDualWinners++; continue; }
    const expected = result(claims, 'playing');
    assert.equal(matchResult(freeze(claims)), expected, JSON.stringify(claims));
    if (expected === 'draw') terminalDraws++;
    checked++;
  }
  assert.equal(checked + impossibleDualWinners, 262144);
  assert.ok(terminalDraws > 0);
  t.diagnostic(JSON.stringify({assignments:262144,checked,impossibleDualWinners,terminalDraws}));
});

for (const skill of ['casual', 'tactical']) {
  test(`${skill}: every opening reaches a legal terminal match and every ply independently restores`, {timeout:120000}, t => {
    const metrics = {
      games:0, plies:0, aiDecisions:0, maxNodes:0, minPlies:81, maxPlies:0,
      forcedPositions:0, freePositions:0, closedDestinations:0, drawnMiniBoards:0,
      immediateWins:0, avoidedImmediateLosses:0, terminal:{X:0,O:0,draw:0},
    };
    for (let opening = 0; opening < 81; opening++) {
      let reference = emptyReference(), state = createGame();
      const random = randomSource(0x6a29b + opening * 7919 + (skill === 'tactical' ? 97 : 0));
      assert.deepEqual(state, projected(reference));
      while (reference.outcome === 'playing') {
        const label = `${skill} opening ${opening} ply ${reference.moves.length}`;
        const allowed = referenceMoves(reference);
        assert.ok(allowed.length > 0, `${label}: playing must have a move`);
        assert.deepEqual(legalMoves(freeze(state)), allowed, `${label}: routing/closures`);
        if (reference.destination === null) metrics.freePositions++;
        else metrics.forcedPositions++;

        // Reject every currently forbidden coordinate, including occupied cells,
        // closed boards, and cells outside the current routing destination.
        const allowedKeys = new Set(allowed.map(move => move.board * 9 + move.cell));
        for (let index = 0; index < 81; index++) {
          if (!allowedKeys.has(index)) {
            assert.equal(playMove(state, {board:Math.floor(index / 9),cell:index % 9}), null,
              `${label}: illegal coordinate ${index}`);
          }
        }

        let move;
        if (reference.moves.length === 0) move = {board:Math.floor(opening / 9),cell:opening % 9};
        else if (reference.player === 'X') move = allowed[random(allowed.length)];
        else {
          const decision = chooseMove(state, {skill});
          assert.equal(decision.skill, skill);
          assert.equal(decision.budget, skill === 'casual' ? 180 : 1600);
          assert.ok(Number.isInteger(decision.nodes) && decision.nodes >= allowed.length
            && decision.nodes <= decision.budget, `${label}: search budget`);
          assert.ok(decision.move && allowed.some(candidate => sameMove(candidate, decision.move)),
            `${label}: AI must choose an oracle-legal move`);
          // First decisions and all free-routing decisions must also reproduce
          // exactly from a serialized/restored state, including node counts.
          if (reference.moves.length === 1 || reference.destination === null) {
            const restored = restoreMatch(JSON.parse(JSON.stringify(saveMatch(state, {skill}))));
            assert.deepEqual(chooseMove(restored.state, {skill}), decision, `${label}: determinism`);
          }
          move = decision.move;
          metrics.aiDecisions++;
          metrics.maxNodes = Math.max(metrics.maxNodes, decision.nodes);

          const successors = allowed.map(candidate => referenceStep(reference, candidate));
          if (successors.some(next => next.outcome === 'O')) {
            assert.equal(referenceStep(reference, move).outcome, 'O', `${label}: take a match win`);
            metrics.immediateWins++;
          } else {
            // The opponent can only win next if its macro claims can complete a
            // line. This guard avoids expensive pointless reply enumeration.
            const threatened = reference.claims.some((claim, board) => {
              if (claim !== null) return false;
              const possible = [...reference.claims]; possible[board] = 'X';
              return wins(possible, 'X');
            });
            if (threatened) {
              const permitsImmediateLoss = next => referenceMoves(next)
                .some(reply => referenceStep(next, reply).outcome === 'X');
              const unsafe = successors.map(permitsImmediateLoss);
              if (unsafe.some(Boolean) && unsafe.some(value => !value)) {
                assert.equal(permitsImmediateLoss(referenceStep(reference, move)), false,
                  `${label}: avoid an immediate match loss when a safe move exists`);
                metrics.avoidedImmediateLosses++;
              }
            }
          }
        }

        const before = projected(reference);
        const next = playMove(state, move);
        assert.ok(next, `${label}: legal move accepted`);
        reference = referenceStep(reference, move);
        assert.deepEqual(state, before, `${label}: input must remain immutable`);
        assert.deepEqual(next, projected(reference), `${label}: complete engine/oracle state`);
        if (reference.claims[move.cell] !== null && reference.outcome === 'playing') {
          assert.equal(next.forcedBoard, null, `${label}: closed destination grants free choice`);
          metrics.closedDestinations++;
        }
        const guideDismissed = reference.moves.length % 2 === 0;
        const serialized = JSON.parse(JSON.stringify(saveMatch(next, {skill,guideDismissed})));
        const restored = restoreMatch(serialized);
        assert.deepEqual(restored, {state:projected(reference),skill,guideDismissed},
          `${label}: per-ply history restoration`);
        assert.equal(restoreMatch({...serialized,history:[...serialized.history,{...move}]}), null,
          `${label}: an occupied-cell replay suffix must be rejected`);
        state = restored.state;
        metrics.plies++;
        assert.ok(reference.moves.length <= 81, `${label}: bounded match length`);
      }

      assert.deepEqual(legalMoves(state), [], `${skill}/${opening}: terminal has no moves`);
      for (let index = 0; index < 81; index++) {
        assert.equal(playMove(state, {board:Math.floor(index / 9),cell:index % 9}), null);
      }
      assert.deepEqual(chooseMove(freeze(state), {skill}),
        {move:null,nodes:0,budget:skill === 'casual' ? 180 : 1600,skill});
      metrics.games++;
      metrics.terminal[reference.outcome]++;
      metrics.minPlies = Math.min(metrics.minPlies, reference.moves.length);
      metrics.maxPlies = Math.max(metrics.maxPlies, reference.moves.length);
      metrics.drawnMiniBoards += reference.claims.filter(claim => claim === 'draw').length;
    }
    assert.equal(metrics.games, 81);
    assert.ok(metrics.aiDecisions > 81);
    assert.ok(metrics.closedDestinations > 0, 'the corpus must exercise closed-board routing');
    assert.ok(metrics.drawnMiniBoards > 0, 'the corpus must exercise mini-board draws');
    assert.ok(metrics.immediateWins > 0, 'the corpus must exercise immediate AI match wins');
    t.diagnostic(JSON.stringify({skill,...metrics}));
  });
}

test('both AI levels avoid immediate match losses in independently generated reachable threat positions', t => {
  let positions = 0, decisions = 0, gamesSearched = 0;
  for (let seed = 1; seed <= 81 && positions < 24; seed++) {
    const random = randomSource(0x12c84 + seed * 104729);
    let reference = emptyReference();
    gamesSearched++;
    while (reference.outcome === 'playing' && positions < 24) {
      const allowed = referenceMoves(reference);
      if (reference.player === 'O') {
        const successors = allowed.map(move => referenceStep(reference, move));
        const permitsImmediateLoss = next => referenceMoves(next)
          .some(reply => referenceStep(next, reply).outcome === 'X');
        // Require an actual defensive problem, rather than a position where
        // winning immediately makes all defensive considerations irrelevant.
        if (!successors.some(next => next.outcome === 'O')) {
          const unsafe = successors.map(permitsImmediateLoss);
          if (unsafe.some(Boolean) && unsafe.some(value => !value)) {
            const label = `seed ${seed}, history ${JSON.stringify(reference.moves)}`;
            for (const skill of ['casual', 'tactical']) {
              const loaded = restoreMatch({version:1,skill,guideDismissed:true,history:reference.moves});
              assert.deepEqual(loaded?.state, projected(reference), `${label}: independently reachable`);
              const decision = chooseMove(freeze(loaded.state), {skill});
              assert.ok(decision.move && allowed.some(move => sameMove(move, decision.move)));
              assert.equal(permitsImmediateLoss(referenceStep(reference, decision.move)), false,
                `${skill}: a safe alternative exists; ${label}`);
              decisions++;
            }
            positions++;
          }
        }
      }
      reference = referenceStep(reference, allowed[random(allowed.length)]);
    }
  }
  assert.equal(positions, 24, 'the deterministic corpus must actually reach the defensive cases');
  assert.equal(decisions, 48);
  t.diagnostic(JSON.stringify({positions,decisions,gamesSearched}));
});
