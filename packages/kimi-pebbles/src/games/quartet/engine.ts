import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'

export interface QuartetGroup {
  label: string
  /** 1 easiest (yellow) → 4 trickiest (purple) */
  tier: 1 | 2 | 3 | 4
  members: string[]
}

export interface QuartetPuzzle {
  groups: QuartetGroup[]
}

const PUZZLES = puzzlesData as QuartetPuzzle[]

export const MAX_MISSES = 4

export const TIER_STYLE: Record<number, { face: string; name: string; emoji: string }> = {
  1: { face: 'hsl(43 92% 55%)', name: 'yellow', emoji: '🟨' },
  2: { face: 'hsl(145 55% 52%)', name: 'green', emoji: '🟩' },
  3: { face: 'hsl(200 82% 60%)', name: 'blue', emoji: '🟦' },
  4: { face: 'hsl(275 58% 60%)', name: 'purple', emoji: '🟪' },
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

/** one share row per guess: tier emoji of the 4 guessed members, in guess order */
export function buildQuartetShare(puzzleNo: number, history: number[][], won: boolean): string {
  const rows = history.map((row) => row.map((t) => TIER_STYLE[t].emoji).join('')).join('\n')
  return `QUARTET No.${puzzleNo} ${won ? '🏆' : '💔'}\n${rows}`
}
