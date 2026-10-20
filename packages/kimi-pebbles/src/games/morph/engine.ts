import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'

export interface MorphPuzzle {
  s: string // start word
  t: string // target word
  par: number // supplied route length, used as a suggested target
  p: string[] // one valid supplied path (start..target), not necessarily shortest
}

const PUZZLES = puzzlesData as MorphPuzzle[]

export function dailyMorph(dayNumber = todayDayNumber()): { puzzle: MorphPuzzle; puzzleNo: number } {
  const idx = ((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export function practiceMorph(excludeNo = -1): { puzzle: MorphPuzzle; puzzleNo: number } {
  let idx = Math.floor(Math.random() * PUZZLES.length)
  if (PUZZLES.length > 1) {
    while (idx === excludeNo) idx = Math.floor(Math.random() * PUZZLES.length)
  }
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

/** Number of differing letter positions (words must be same length). */
export function diffCount(a: string, b: string): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

/** Index of the position that changed between two rungs, or -1. */
export function changedIndex(prev: string, next: string): number {
  for (let i = 0; i < prev.length; i++) if (prev[i] !== next[i]) return i
  return -1
}

export function medalFor(moves: number, par: number, gaveUp: boolean): { icon: string; label: string } {
  if (gaveUp) return { icon: '⬛', label: 'Gave up' }
  if (moves <= par) return { icon: '🥇', label: 'Gold — target met' }
  if (moves === par + 1) return { icon: '🥈', label: 'Silver — 1 over target' }
  if (moves === par + 2) return { icon: '🥉', label: 'Bronze — 2 over target' }
  return { icon: '✅', label: 'Finished' }
}

export function buildMorphShare(
  puzzleNo: number,
  moves: number,
  par: number,
  gaveUp: boolean,
): string {
  const medal = medalFor(moves, par, gaveUp)
  return gaveUp
    ? `MORPH No.${puzzleNo}\n⬛ Route revealed (target ${par})`
    : `MORPH No.${puzzleNo}\n${medal.icon} ${moves} move${moves === 1 ? '' : 's'} · target ${par}`
}
