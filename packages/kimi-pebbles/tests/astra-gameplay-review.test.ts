import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as React from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { dailyTangle } from '../src/games/tangle/engine.ts'
import { pointsFor, restoreTangleProgress, reconcileTangleCompletion } from '../src/games/tangle/progress.ts'
import { dailyCircuit, withReviewedWords } from '../src/games/circuit/engine.ts'
import { restoreCircuitProgress } from '../src/games/circuit/progress.ts'
import { HunchBoard } from '../src/games/hunch/HunchBoard.tsx'

const tangles = JSON.parse(readFileSync(new URL('../src/games/tangle/data/puzzles.json', import.meta.url), 'utf8'))
const circuits = JSON.parse(readFileSync(new URL('../src/games/circuit/data/puzzles.json', import.meta.url), 'utf8'))

test('all 430 Tangle boards retain their data and have ordered, achievable capped medals', () => {
  assert.equal(tangles.length, 430)
  for (let i = 0; i < tangles.length; i++) {
    const { puzzle, puzzleNo } = dailyTangle(i)
    const raw = tangles[i]
    assert.equal(puzzleNo, i + 1)
    assert.equal(puzzle.g, raw.g)
    assert.deepEqual(puzzle.words, raw.words)
    const [bronze, silver, gold] = puzzle.targets
    assert.ok(bronze > 0 && bronze < silver && silver < gold)
    assert.ok(gold >= 8 && gold <= 18 && gold <= raw.targets[2])
    assert.ok(gold <= puzzle.words.reduce((n, w) => n + pointsFor(w), 0))
    const found: string[] = []
    let score = 0
    for (const word of puzzle.words) {
      if (score >= gold) break
      found.push(word); score += pointsFor(word)
    }
    const saved = { found, score: -999, misses: 2, hintsUsed: 1, countedPlayed: true, goldReached: false }
    const restored = restoreTangleProgress(saved, puzzle)!
    assert.equal(restored.score, score)
    assert.equal(restored.goldReached, true)
    assert.equal(restored.hintsUsed, 1)
  }
})

test('newly qualifying Tangle saves receive exactly one completion and preserve the streak', () => {
  const puzzle = dailyTangle(394).puzzle
  assert.deepEqual(puzzle.targets, [5, 10, 15])
  const found = ['bake','baker','bakers','oak','kerb','kerbs','soak','soaker','soakers']
  const restored = restoreTangleProgress({ found, misses: 0, hintsUsed: 1, countedPlayed: true }, puzzle)!
  assert.ok(restored.goldReached)
  const stats = { played: 9, completed: 5, currentStreak: 2, maxStreak: 2, lastCompletedDay: 20 }
  const next = reconcileTangleCompletion(stats, restored, 21)
  assert.deepEqual(next, { played: 9, completed: 6, currentStreak: 3, maxStreak: 3, lastCompletedDay: 21 })
  assert.equal(reconcileTangleCompletion(next, restored, 21), next)
  assert.equal(reconcileTangleCompletion(stats, { ...restored, goldReached: false }, 21), stats)
})

test('PLUM is accepted and restorable only on Circuit boards where it satisfies arc rules', () => {
  const puzzle = dailyCircuit(256).puzzle
  assert.ok(puzzle.words.includes('plum'))
  assert.ok(!circuits[256].words.includes('plum'))
  assert.ok(restoreCircuitProgress({ played: ['plum'], revealed: 0, hintsUsed: 0,
    finished: false, gaveUp: false, countedPlayed: true }, puzzle))
  for (const raw of circuits) {
    const revised = withReviewedWords(raw)
    assert.deepEqual(revised.sol, raw.sol)
    assert.equal(revised.par, raw.par)
    assert.equal(revised.n, revised.words.length)
    for (const word of revised.words.filter((w: string) => !raw.words.includes(w))) {
      assert.ok([...word].every((letter, i) => raw.l.includes(letter) &&
        (!i || Math.floor(raw.l.indexOf(letter) / 3) !== Math.floor(raw.l.indexOf(word[i - 1]) / 3))))
    }
  }
})

test('Hunch announces aggregate dot totals without identifying matched letters', () => {
  // tsx's standalone test transform uses classic JSX; Vite uses the automatic runtime.
  Object.assign(globalThis, { React })
  const html = renderToStaticMarkup(createElement(HunchBoard, {
    state: { phase: 'playing', answer: 'honey', guesses: ['stare'], evals: [['absent','absent','absent','absent','present']],
      current: '', hintLetters: [], hintsUsed: 0, finished: false, won: false, shaking: false },
    actions: { keyLetter() {}, backspace() {}, submit() {}, hint() {} },
  }))
  assert.ok(html.includes('Position 1: S'))
  assert.ok(html.includes('0 exact matches, 1 elsewhere'))
  assert.ok(!html.includes('Letter e, in the word'))
  assert.ok(!html.includes('Position 5: E, in the word'))
})
