import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, COLLECTION } from '../puzzles.mjs';
import { MAX_SCANS, solveDecisionTree, createGame, submitScan, submitPick, possibleWords, restoreGame } from '../engine.mjs';

test('collection has 210 distinct twelve-word boards and 210 distinct answers', () => {
  assert.equal(PUZZLES.length, 210);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.id)).size, 210);
  assert.equal(new Set(PUZZLES.map(puzzle => puzzle.answer)).size, 210);
  assert.equal(new Set(PUZZLES.map(puzzle => [...puzzle.words].sort().join(','))).size, 210);
  assert.equal(COLLECTION.boards, 210);
  assert.equal(COLLECTION.maxScans, 3);
  for (const puzzle of PUZZLES) {
    assert.equal(puzzle.words.length, 12, puzzle.id);
    assert.equal(new Set(puzzle.words).size, 12, puzzle.id);
    assert.ok(puzzle.words.includes(puzzle.answer), puzzle.id);
    assert.ok(puzzle.title && puzzle.difficulty, puzzle.id);
    assert.equal(new Set(puzzle.words.map(word => [...new Set(word)].sort().join(''))).size, 12,
      `${puzzle.id}: words with identical letter sets cannot be distinguished`);
    for (const word of puzzle.words) assert.match(word, /^[A-Z]{5}$/);
  }
});

test('each of all 2520 possible board answers has a fully verified strategy of at most three scans', () => {
  let paths = 0;
  for (const puzzle of PUZZLES) {
    const tree = solveDecisionTree(puzzle.words, MAX_SCANS);
    assert.ok(tree, `${puzzle.id}: an exact decision tree must exist`);
    assert.equal(tree.worstCase, 3, 'twelve words cannot all be distinguished by two ternary scans');
    for (const answer of puzzle.words) {
      const board = { ...puzzle, answer };
      let node = tree;
      let state = createGame(board);
      const seen = new Set();
      while (!node.word) {
        assert.match(node.letters, /^[A-Z]{2}$/);
        assert.notEqual(node.letters[0], node.letters[1]);
        assert.ok(!seen.has(node.letters), 'the strategy must not repeat a scan');
        seen.add(node.letters);
        const independentCount = Number(answer.includes(node.letters[0])) + Number(answer.includes(node.letters[1]));
        const result = submitScan(board, state, node.letters);
        assert.equal(result.accepted, true, `${puzzle.id}: ${answer}`);
        assert.equal(result.scan.count, independentCount);
        state = result.state;
        assert.deepEqual(restoreGame(board, structuredClone(state)), state);
        node = node.branches[independentCount];
        assert.ok(node, `${puzzle.id}: every observed count needs a branch`);
      }
      assert.equal(node.word, answer);
      assert.ok(state.scans.length <= 3);
      assert.deepEqual(possibleWords(board, state), [answer]);
      assert.equal(submitPick(board, state, answer).state.status, 'won');
      paths++;
    }
  }
  assert.equal(paths, 2520);
});

test('opening board and answer remain stable while future boards use varied words and positions', () => {
  assert.deepEqual(PUZZLES[0].words, 'CRANE BRICK GHOST PLUMB FJORD WATCH SILKY DROWN MAPLE SCOUT FLING QUEST'.split(' '));
  assert.equal(PUZZLES[0].answer, 'MAPLE');
  const words = new Set(PUZZLES.flatMap(puzzle => puzzle.words));
  assert.ok(words.size >= 300, `expected substantial vocabulary diversity, got ${words.size}`);
  assert.equal(COLLECTION.words, words.size);
  const positions = Array(12).fill(0);
  for (const puzzle of PUZZLES) positions[puzzle.words.indexOf(puzzle.answer)]++;
  assert.ok(positions.every(count => count >= Math.floor(PUZZLES.length / 12) && count <= Math.ceil(PUZZLES.length / 12)), positions.join(','));
});

test('the exact solver rejects indistinguishable boards and impossible budgets', () => {
  assert.equal(solveDecisionTree(['STARE', 'TEARS'], 3), null);
  assert.equal(solveDecisionTree(PUZZLES[0].words, 2), null);
  for (const [words, budget] of [[[], 3], [['APPLE', 'APPLE'], 3], [['PEAR'], 3], [['APPLE'], -1], [['APPLE'], 4]]) {
    assert.equal(solveDecisionTree(words, budget), null);
  }
  assert.deepEqual(solveDecisionTree(['APPLE'], 0), { word: 'APPLE', worstCase: 0, expectedScans: 0 });
});
