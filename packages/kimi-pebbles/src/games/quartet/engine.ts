import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'

export interface QuartetGroup {
  label: string
  /** Author-assigned connection tiers; human difficulty can vary. */
  tier: 1 | 2 | 3 | 4
  members: string[]
}

export interface QuartetPuzzle {
  groups: QuartetGroup[]
}

const PUZZLES = puzzlesData as QuartetPuzzle[]

export const MAX_MISSES = 4

export const TIER_STYLE: Record<number, { face: string; name: string; emoji: string }> = {
  1: { face: '#146c75', name: 'teal', emoji: '1' },
  2: { face: '#26669a', name: 'blue', emoji: '2' },
  3: { face: '#315481', name: 'navy', emoji: '3' },
  4: { face: '#384763', name: 'slate', emoji: '4' },
}

export function dailyQuartet(dayNumber = todayDayNumber()): { puzzle: QuartetPuzzle; puzzleNo: number } {
  const idx = publishedDailyIndex(dayNumber, PUZZLES.length, 420)
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export function practiceQuartet(excludeNo = -1): { puzzle: QuartetPuzzle; puzzleNo: number } {
  const idx = choosePracticeIndex('kimi-quartet', PUZZLES.length, excludeNo)
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

/** deterministic shuffle for daily boards */
export function seededOrder(seed: number, n = 16): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  let s = seed || 1
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** One spoiler-free numbered tier row per guess, in selection order. */
export function buildQuartetShare(puzzleNo: number, history: number[][], won: boolean, hintsUsed = 0): string {
  const rows = history.map((row) => row.map((t) => TIER_STYLE[t].emoji).join('')).join('\n')
  return `QUARTET No.${puzzleNo} ${won ? 'Solved' : 'Revealed'}\n${rows}${hintsUsed ? `\n${hintsUsed} pair hint${hintsUsed === 1 ? '' : 's'}` : ''}`
}
