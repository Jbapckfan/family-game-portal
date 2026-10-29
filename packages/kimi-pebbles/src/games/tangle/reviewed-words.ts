import type { TanglePuzzle } from './engine.ts'
import { medalTargets, pointsFor } from './progress.ts'

/** Closed editorial policy, not a dictionary replacement or word-shape rule.
 * CCWS/FAGS are the exact additional variants present in the supplied bank.
 * Some suitability entries have other senses; this is an explicit product
 * choice for future default puzzles, not a claim that all senses are nonwords.
 */
export const TANGLE_REVIEWED_EXCLUSIONS: readonly string[] = Object.freeze([
  'ccm', 'ccw', 'ccws', 'cfm', 'whf',
  'mahmoud', 'wilhelm',
  'nig', 'wog', 'coon', 'fag', 'fags',
])

/** October 30, 2026 as the existing UTC-calendar day number. */
export const TANGLE_REVIEW_START_DAY = 20756
const excluded = new Set(TANGLE_REVIEWED_EXCLUSIONS)

export function reviewTanglePuzzle(puzzle: TanglePuzzle): TanglePuzzle {
  const words = puzzle.words.filter(word => !excluded.has(word))
  if (!words.length) throw new RangeError('Reviewed Tangle puzzle has no words')
  const max = words.reduce((total, word) => total + pointsFor(word), 0)
  const best = words.includes(puzzle.best)
    ? puzzle.best
    : [...words].sort((a, b) => b.length - a.length || a.localeCompare(b))[0]
  return { ...puzzle, words, n: words.length, max, best, targets: medalTargets(max) }
}

export function reviewTanglePuzzleForDay(puzzle: TanglePuzzle, day: number): TanglePuzzle {
  return day >= TANGLE_REVIEW_START_DAY ? reviewTanglePuzzle(puzzle) : puzzle
}
