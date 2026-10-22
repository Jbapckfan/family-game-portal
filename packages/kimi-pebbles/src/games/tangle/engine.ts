import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'
import { medalTargets } from './progress'

export interface TanglePuzzle {
  g: string // 16 letters, row-major 4x4
  n: number // total findable words
  max: number // total possible points
  best: string // a nice long word findable today
  words: string[] // all findable words
  targets: [number, number, number] // bronze, silver, gold thresholds
}

const PUZZLES = (puzzlesData as TanglePuzzle[]).map(puzzle => ({ ...puzzle, targets: medalTargets(puzzle.max) }))

export function dailyTangle(dayNumber = todayDayNumber()): { puzzle: TanglePuzzle; puzzleNo: number } {
  const idx = ((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export function practiceTangle(excludeIdx = -1): { puzzle: TanglePuzzle; puzzleNo: number } {
  let idx = Math.floor(Math.random() * PUZZLES.length)
  if (PUZZLES.length > 1) {
    while (idx === excludeIdx) idx = Math.floor(Math.random() * PUZZLES.length)
  }
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
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

/** 8-way adjacency on a 4x4 grid. */
export function isAdjacent(a: number, b: number): boolean {
  const ra = Math.floor(a / 4), ca = a % 4
  const rb = Math.floor(b / 4), cb = b % 4
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1 && a !== b
}
