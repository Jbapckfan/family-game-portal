import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { completeCairnLevel, restoreCairnProgress } from '../src/games/cairn/progress.ts'
import { dailyMorph, diffCount } from '../src/games/morph/engine.ts'
import { restoreMorphProgress } from '../src/games/morph/progress.ts'
import { dailyTangle, isAdjacent } from '../src/games/tangle/engine.ts'
import { pointsFor, restoreTangleProgress } from '../src/games/tangle/progress.ts'
import { dailyHunch, evaluate } from '../src/games/hunch/engine.ts'
import { restoreHunchProgress } from '../src/games/hunch/progress.ts'
import { dailyCircuit } from '../src/games/circuit/engine.ts'
import { coverage, restoreCircuitProgress } from '../src/games/circuit/progress.ts'
import { dailyQuartet } from '../src/games/quartet/engine.ts'
import { restoreQuartetProgress } from '../src/games/quartet/progress.ts'
import { kimiContentKey } from '../../../scripts/kimi-content-signatures.mjs'

const readBank = (name: string) => JSON.parse(readFileSync(new URL(`../src/games/${name}/data/${name === 'hunch' ? 'answers' : 'puzzles'}.json`, import.meta.url), 'utf8'))
const dictionary = new Set(readFileSync(new URL('../src/games/cairn/data/dict.txt', import.meta.url), 'utf8').trim().split(/\r?\n/))
const validWord = (word: string) => dictionary.has(word)
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

for (const name of ['cairn', 'morph', 'tangle', 'hunch', 'circuit', 'quartet']) {
  test(`${name}: at least 200 substantive challenges, excluding cosmetic equivalents`, () => {
    const bank = readBank(name), keys = bank.map((p: unknown) => kimiContentKey(name, p))
    assert.ok(bank.length >= 200)
    assert.equal(new Set(keys).size, bank.length)
  })
}

test('every Cairn tower has legal one-letter additions and survives each completed-level save', () => {
  const bank = readBank('cairn')
  for (let i = 0; i < bank.length; i++) {
    const puzzle = {words:bank[i].w as string[]}
    let progress: any = {level:0, results:[], rack:[...puzzle.words[0]], slots:Array(3).fill(null), misses:0, hints:0, finished:false, countedPlayed:true}
    for (let level = 0; level < 5; level++) {
      const word = puzzle.words[level]
      assert.equal(word.length, level + 3); assert.ok(validWord(word), word)
      if (level) {
        const pool = [...word]
        for (const letter of puzzle.words[level - 1]) {
          const at = pool.indexOf(letter); assert.ok(at >= 0, `${i}: ${word}`); pool.splice(at, 1)
        }
        assert.equal(pool.length, 1)
      }
      progress = completeCairnLevel(progress, {status:'clean', word, misses:0, hints:0}, [...(puzzle.words[level + 1] ?? word)])
      assert.ok(restoreCairnProgress(clone(progress), puzzle, validWord), `${i}:${level}`)
    }
    assert.equal(progress.finished, true)
  }
})

test('every Morph has a dictionary-valid nonrepeating route accepted at every saved prefix', () => {
  for (let i = 0; i < readBank('morph').length; i++) {
    const {puzzle} = dailyMorph(i), path = puzzle.p
    assert.equal(path[0], puzzle.s); assert.equal(path.at(-1), puzzle.t)
    assert.equal(new Set(path).size, path.length)
    for (let n = 1; n <= path.length; n++) {
      assert.ok(validWord(path[n - 1]), path[n - 1])
      if (n > 1) assert.equal(diffCount(path[n - 2], path[n - 1]), 1)
      assert.ok(restoreMorphProgress({rows:path.slice(0,n), misses:0, hintsUsed:0, finished:n === path.length, gaveUp:false, countedPlayed:true}, puzzle, validWord))
    }
  }
})

test('every listed Tangle word has a real non-reusing eight-way grid path; all medals are reachable', () => {
  const neighbors = Array.from({length:16}, (_, a) => Array.from({length:16}, (_, b) => b).filter(b => isAdjacent(a,b)))
  let words = 0
  for (let i = 0; i < readBank('tangle').length; i++) {
    const {puzzle} = dailyTangle(i)
    const trace = (word: string, at: number, pos: number, used: number): boolean => {
      if (puzzle.g[at] !== word[pos] || (used & (1 << at))) return false
      if (pos === word.length - 1) return true
      return neighbors[at].some(next => trace(word, next, pos + 1, used | (1 << at)))
    }
    assert.equal(new Set(puzzle.words).size, puzzle.words.length)
    for (const word of puzzle.words) {
      assert.ok(Array.from({length:16}, (_, at) => at).some(at => trace(word, at, 0, 0)), `${i}:${word}`)
      words++
    }
    assert.equal(puzzle.max, puzzle.words.reduce((sum,w) => sum + pointsFor(w), 0))
    assert.ok(puzzle.words.includes(puzzle.best))
    const result = restoreTangleProgress({found:puzzle.words, misses:0, hintsUsed:0, countedPlayed:true}, puzzle)
    assert.equal(result?.goldReached, true); assert.equal(result?.score, puzzle.max)
  }
  console.log(`Tangle: traced ${words} accepted words through all 430 grids.`)
})

test('every Circuit accepted word obeys arcs; every solution prefix restores and covers all twelve letters', () => {
  for (let i = 0; i < readBank('circuit').length; i++) {
    const {puzzle} = dailyCircuit(i)
    assert.equal(puzzle.l.length, 12); assert.equal(new Set(puzzle.l).size, 12)
    assert.equal(puzzle.n, puzzle.words.length)
    for (const word of puzzle.words) {
      assert.ok(word.length >= 3)
      for (let n = 0; n < word.length; n++) {
        const at = puzzle.l.indexOf(word[n]); assert.ok(at >= 0)
        if (n) assert.notEqual(Math.floor(at / 3), Math.floor(puzzle.l.indexOf(word[n - 1]) / 3), `${i}:${word}`)
      }
    }
    assert.equal(puzzle.sol.length, puzzle.par)
    for (let n = 0; n <= puzzle.sol.length; n++) {
      const played = puzzle.sol.slice(0,n), finished = coverage(played,puzzle.l) === 4095
      assert.ok(restoreCircuitProgress({played, revealed:0, hintsUsed:0, finished, gaveUp:false, countedPlayed:true}, puzzle), `${i}:${n}`)
      assert.equal(finished, n === puzzle.sol.length)
    }
  }
})

test('every Quartet can solve all four groups with valid remaining tiles and history after each save', () => {
  for (let i = 0; i < readBank('quartet').length; i++) {
    const {puzzle} = dailyQuartet(i)
    assert.equal(new Set(puzzle.groups.flatMap(group => group.members)).size, 16)
    assert.deepEqual(puzzle.groups.map(group => group.tier).sort(), [1,2,3,4])
    for (let count = 0; count <= 4; count++) {
      const solvedGroups = Array.from({length:count}, (_, group) => group)
      const tiles = puzzle.groups.flatMap((g,group) => g.members.map(word => group < count ? null : {word,group}))
      assert.ok(restoreQuartetProgress({tiles, solvedGroups, history:solvedGroups.map(g => Array(4).fill(puzzle.groups[g].tier)), misses:0, hintPair:null, hintsUsed:0, finished:count === 4, won:count === 4, countedPlayed:true}, puzzle))
    }
  }
})

test('Hunch feedback-only decision tree solves every bundled answer within six guesses', () => {
  const answers: string[] = readBank('hunch'), size = answers.length
  const encode = (feedback: string[]) => feedback.reduce((n, value) => n * 3 + ['absent','present','correct'].indexOf(value), 0)
  const matrix = new Uint8Array(size * size)
  for (let g = 0; g < size; g++) for (let a = 0; a < size; a++) matrix[g * size + a] = encode(evaluate(answers[g],answers[a]))
  let maximum = 0, solved = 0
  function search(candidates: number[], guesses: string[]) {
    let selected = candidates[0], bestWorst = Infinity, bestSquared = Infinity
    const candidateSet = new Set(candidates)
    // A legal information-gathering word need not remain a possible answer.
    for (let guess = 0; guess < size; guess++) {
      const counts = new Uint16Array(243)
      for (const answer of candidates) counts[matrix[guess * size + answer]]++
      const worst = Math.max(...counts), squared = counts.reduce((n,c) => n + c*c,0)
      if (worst < bestWorst || worst === bestWorst && (squared < bestSquared ||
          squared === bestSquared && candidateSet.has(guess) && !candidateSet.has(selected))) {
        selected = guess; bestWorst = worst; bestSquared = squared
      }
    }
    const nextGuesses = [...guesses,answers[selected]], buckets = new Map<number,number[]>()
    for (const answer of candidates) {
      const pattern = matrix[selected * size + answer]
      if (pattern === 242) {
        solved++; maximum = Math.max(maximum,nextGuesses.length)
        assert.ok(nextGuesses.length <= 6, answers[answer])
        assert.equal(dailyHunch(answer).answer, answers[answer])
        const saved = restoreHunchProgress({guesses:nextGuesses, evals:[], hintLetters:[], hintsUsed:0, finished:true, won:true, countedPlayed:true}, answers[answer], evaluate, validWord)
        assert.equal(saved?.won,true)
      } else { if (!buckets.has(pattern)) buckets.set(pattern,[]); buckets.get(pattern)!.push(answer) }
    }
    for (const bucket of buckets.values()) search(bucket,nextGuesses)
  }
  search(Array.from({length:size}, (_,i) => i),[])
  assert.equal(solved,size)
  console.log(`Hunch: ${solved} answers solved from feedback alone; maximum ${maximum} guesses.`)
})
