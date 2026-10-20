import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import * as circuit from '../src/games/circuit/progress.ts'
import * as tangle from '../src/games/tangle/progress.ts'
import * as quartet from '../src/games/quartet/progress.ts'
const readPuzzles = async (game) => JSON.parse(await readFile(new URL(`../src/games/${game}/data/puzzles.json`, import.meta.url), 'utf8'))
const circuits = await readPuzzles('circuit')
const tangles = await readPuzzles('tangle')
const quartets = await readPuzzles('quartet')

test('Circuit can undo the legal dead end BECOME and restart its chain', () => {
  assert.equal(typeof circuit.undoCircuitWord, 'function')
  const puzzle = circuits[1]
  assert.ok(puzzle.words.includes('become'))
  assert.equal(puzzle.words.some((w) => w.startsWith('e')), false)
  const undone = circuit.undoCircuitWord(['become'], puzzle.l)
  assert.deepEqual(undone.played, [])
  assert.equal(undone.current.map((i) => puzzle.l[i]).join(''), 'become')
  assert.deepEqual(circuit.restartCircuitChain(), { played: [], current: [] })
  const two = circuit.undoCircuitWord(puzzle.sol.slice(0, 2), puzzle.l)
  assert.deepEqual(two.played, [puzzle.sol[0]])
  assert.equal(two.current.map((i) => puzzle.l[i]).join(''), puzzle.sol[1])
})

test('Circuit rejects malformed or impossible saved chains and accepts a complete solution', () => {
  assert.equal(typeof circuit.restoreCircuitProgress, 'function')
  const puzzle = circuits[1]
  const progress = { played: puzzle.sol, revealed: 0, hintsUsed: 0, finished: true, gaveUp: false, countedPlayed: true }
  assert.deepEqual(circuit.restoreCircuitProgress(progress, puzzle), progress)
  for (const bad of [null, [], { ...progress, played: 'bad' }, { ...progress, played: ['become', 'bird'] }, { ...progress, revealed: -1 }, { ...progress, hintsUsed: Infinity }]) {
    assert.equal(circuit.restoreCircuitProgress(bad, puzzle), null)
  }
})

function newQuartetProgress(puzzle) {
  return { tiles: puzzle.groups.flatMap((g, group) => g.members.map((word) => ({ word, group }))), solvedGroups: [], misses: 0, history: [], hintPair: null, hintsUsed: 0, finished: false, won: false, countedPlayed: false }
}

test('Quartet hint identity survives shuffled tiles and persisted restoration', () => {
  assert.equal(typeof quartet.restoreQuartetProgress, 'function')
  const puzzle = quartets[0]
  const progress = newQuartetProgress(puzzle)
  progress.hintPair = puzzle.groups[0].members.slice(0, 2)
  progress.hintsUsed = 1
  progress.tiles.reverse()
  const restored = quartet.restoreQuartetProgress(JSON.parse(JSON.stringify(progress)), puzzle)
  assert.deepEqual(restored.hintPair, progress.hintPair)
  assert.equal(restored.hintsUsed, 1)
  assert.equal(restored.tiles.filter((tile) => restored.hintPair.includes(tile.word)).length, 2)
})

test('Quartet restores the fourth miss from history, including older saves with a stale counter', () => {
  assert.equal(typeof quartet.restoreQuartetProgress, 'function')
  const puzzle = quartets[0]
  const progress = { ...newQuartetProgress(puzzle), tiles: Array(16).fill(null), misses: 3, history: Array.from({ length: 4 }, () => [1, 1, 1, 2]), finished: true, countedPlayed: true }
  const restored = quartet.restoreQuartetProgress(progress, puzzle)
  assert.equal(restored.misses, 4)
  assert.equal(restored.finished, true)
})

test('Quartet rejects malformed groups, tile identities, histories, and impossible wins', () => {
  assert.equal(typeof quartet.restoreQuartetProgress, 'function')
  const puzzle = quartets[0]
  const valid = newQuartetProgress(puzzle)
  assert.ok(quartet.restoreQuartetProgress(valid, puzzle))
  for (const bad of [null, [], { ...valid, tiles: 'bad' }, { ...valid, solvedGroups: [9] }, { ...valid, history: [[0, 0, 0, 0]] }, { ...valid, finished: true, won: true }, { ...valid, tiles: Array(16).fill(valid.tiles[0]) }]) {
    assert.equal(quartet.restoreQuartetProgress(bad, puzzle), null)
  }
})

test('Tangle restores only accepted unique words and recomputes score and gold from them', () => {
  assert.equal(typeof tangle.restoreTangleProgress, 'function')
  const puzzle = tangles[0]
  const progress = { found: ['finish'], score: 99999, misses: 1, hintsUsed: 0, goldReached: true, countedPlayed: true }
  const restored = tangle.restoreTangleProgress(progress, puzzle)
  assert.equal(restored.score, 3)
  assert.equal(restored.goldReached, false)
  for (const bad of [null, { ...progress, found: 'bad' }, { ...progress, found: ['finish', 'finish'] }, { ...progress, found: ['notaword'] }, { ...progress, hintsUsed: -1 }]) {
    assert.equal(tangle.restoreTangleProgress(bad, puzzle), null)
  }
  const complete = tangle.restoreTangleProgress({ ...progress, found: puzzle.words }, puzzle)
  assert.equal(complete.score, puzzle.max)
  assert.equal(complete.goldReached, true)
})

test('Quartet editorial corrections preserve board structure and remove the two identified mistakes', () => {
  const ping = quartets.filter((p) => p.groups.some((g) => g.label === 'Words before "ball"' && g.members.includes('ping')))
  const hidden = quartets.filter((p) => p.groups.some((g) => g.label === 'Hidden animals'))
  assert.equal(ping.length, 0)
  assert.equal(hidden.length, 0)
  assert.equal(quartets.filter((p) => p.groups.some((g) => g.label === 'Words before "ball"' && g.members.includes('pin'))).length, 8)
  assert.equal(quartets.filter((p) => p.groups.some((g) => g.label === 'Animals')).length, 23)
  for (const puzzle of quartets) {
    assert.equal(puzzle.groups.length, 4)
    assert.equal(new Set(puzzle.groups.flatMap((g) => g.members)).size, 16)
  }
})

test('Save validation accepts every bundled complete solution without changing its score', () => {
  for (const puzzle of circuits) {
    assert.ok(circuit.restoreCircuitProgress({ played: puzzle.sol, revealed: 0, hintsUsed: 0, finished: true, gaveUp: false, countedPlayed: true }, puzzle))
  }
  for (const puzzle of tangles) {
    const complete = tangle.restoreTangleProgress({ found: puzzle.words, score: 0, misses: 0, hintsUsed: 0, goldReached: false, countedPlayed: true }, puzzle)
    assert.equal(complete?.score, puzzle.max)
    assert.equal(complete?.goldReached, true)
  }
  for (const puzzle of quartets) {
    const complete = { ...newQuartetProgress(puzzle), tiles: Array(16).fill(null), solvedGroups: [0, 1, 2, 3], history: puzzle.groups.map((group) => Array(4).fill(group.tier)), finished: true, won: true, countedPlayed: true }
    assert.ok(quartet.restoreQuartetProgress(complete, puzzle))
  }
})
