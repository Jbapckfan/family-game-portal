import { reviewTanglePuzzle, reviewTanglePuzzleForDay, TANGLE_REVIEWED_EXCLUSIONS } from './reviewed-words'
import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'
import { medalTargets, restoreTangleProgress } from './progress'

export interface TanglePuzzle {
  g: string // row-major: 16 letters for daily/practice, 25 for the optional preview
  n: number // total findable words
  max: number // total possible points
  best: string // a nice long word findable today
  words: string[] // all findable words
  targets: [number, number, number] // bronze, silver, gold thresholds
}

const PUZZLES = (puzzlesData as TanglePuzzle[]).map(puzzle => ({ ...puzzle, targets: medalTargets(puzzle.max) }))

export function dailyTangle(dayNumber = todayDayNumber(), savedProgress?: unknown): { puzzle: TanglePuzzle; puzzleNo: number } {
  const idx = publishedDailyIndex(dayNumber, PUZZLES.length, 430)
  const original = PUZZLES[idx]
  // A cached older client may already have played this day's original edition.
  // Preserve a fully valid such round, including earned points and medals.
  const legacy = savedProgress === undefined ? null : restoreTangleProgress(savedProgress, original)
  const keepEdition = legacy && legacy.found.some(word => TANGLE_REVIEWED_EXCLUSIONS.includes(word))
  return { puzzle: keepEdition ? original : reviewTanglePuzzleForDay(original, dayNumber), puzzleNo: idx + 1 }
}

export function practiceTangle(excludeIdx = -1): { puzzle: TanglePuzzle; puzzleNo: number } {
  const idx = choosePracticeIndex('kimi-tangle', PUZZLES.length, excludeIdx)
  return { puzzle: reviewTanglePuzzle(PUZZLES[idx]), puzzleNo: idx + 1 }
}

export { pointsFor } from './progress'

export type Tier = 0 | 1 | 2 | 3 // none, bronze, silver, gold

export function tierFor(score: number, targets: [number, number, number]): Tier {
  if (score >= targets[2]) return 3
  if (score >= targets[1]) return 2
  if (score >= targets[0]) return 1
  return 0
}

export const TIER_META: { icon: string; label: string; color: string }[] = [
  { icon: '⚪', label: 'No medal yet', color: 'hsl(30 8% 62%)' },
  { icon: '🥉', label: 'Bronze', color: 'hsl(24 60% 50%)' },
  { icon: '🥈', label: 'Silver', color: 'hsl(210 10% 60%)' },
  { icon: '🥇', label: 'Gold', color: 'hsl(45 95% 52%)' },
]

export function buildTangleShare(
  puzzleNo: number,
  score: number,
  max: number,
  found: number,
  total: number,
  tier: Tier,
): string {
  const t = TIER_META[tier]
  return `TANGLE No.${puzzleNo}\n${t.icon} ${t.label} · ${score}/${max} pts · ${found}/${total} words`
}

/** 8-way adjacency; existing callers retain the published 4x4 geometry. */
export function isAdjacent(a: number, b: number, size = 4): boolean {
  if (![4,5].includes(size) || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= size*size || b >= size*size) return false
  const ra = Math.floor(a / size), ca = a % size
  const rb = Math.floor(b / size), cb = b % size
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1 && a !== b
}
