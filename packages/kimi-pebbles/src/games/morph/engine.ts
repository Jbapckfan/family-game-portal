import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
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
  const idx = publishedDailyIndex(dayNumber, PUZZLES.length, 450)
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export function practiceMorph(excludeNo = -1): { puzzle: MorphPuzzle; puzzleNo: number } {
  const idx = choosePracticeIndex('kimi-morph', PUZZLES.length, excludeNo)
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

export function medalFor(moves: number, par: number, gaveUp: boolean, hintsUsed = 0): { icon: string; label: string } {
  const medal = gaveUp ? { icon: '⬛', label: 'Gave up' }
    : moves <= par ? { icon: '🥇', label: 'Gold — target met' }
      : moves === par + 1 ? { icon: '🥈', label: 'Silver — 1 over target' }
        : moves === par + 2 ? { icon: '🥉', label: 'Bronze — 2 over target' }
          : { icon: '✅', label: 'Finished' }
  return { ...medal, label: medal.label + (hintsUsed > 0 ? ' · Assisted' : '') }
}

export function buildMorphShare(
  puzzleNo: number,
  moves: number,
  par: number,
  gaveUp: boolean,
  hintsUsed = 0,
): string {
  const medal = medalFor(moves, par, gaveUp)
  const result = gaveUp
    ? `MORPH No.${puzzleNo}\n⬛ Route revealed (target ${par})`
    : `MORPH No.${puzzleNo}\n${medal.icon} ${moves} move${moves === 1 ? '' : 's'} · target ${par}`
  return result + (hintsUsed > 0 ? '\n💡 Assisted · route shown' : '')
}
