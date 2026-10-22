import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'

export interface CircuitPuzzle {
  /** 12 letters; arcs are indices 0-2, 3-5, 6-8, 9-11 */
  l: string
  /** number of accepted words */
  n: number
  /** minimal words needed to cover all letters */
  par: number
  words: string[]
  /** one minimal covering chain */
  sol: string[]
}

/** Editorial correction: PLUM is an ordinary word omitted by the original web-frequency list. */
const SUPPLEMENTAL_WORDS = ['plum']
export function withReviewedWords(puzzle: CircuitPuzzle): CircuitPuzzle {
  const additions = SUPPLEMENTAL_WORDS.filter(word => !puzzle.words.includes(word) &&
    [...word].every((letter, i) => puzzle.l.includes(letter) &&
      (i === 0 || arcOf(puzzle.l.indexOf(letter)) !== arcOf(puzzle.l.indexOf(word[i - 1])))))
  return additions.length ? { ...puzzle, words: [...puzzle.words, ...additions].sort(), n: puzzle.n + additions.length } : puzzle
}
const PUZZLES = (puzzlesData as CircuitPuzzle[]).map(withReviewedWords)

export function dailyCircuit(dayNumber = todayDayNumber()): { puzzle: CircuitPuzzle; puzzleNo: number } {
  const idx = ((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export function practiceCircuit(excludeNo = -1): { puzzle: CircuitPuzzle; puzzleNo: number } {
  let idx = Math.floor(Math.random() * PUZZLES.length)
  while (idx === excludeNo) idx = Math.floor(Math.random() * PUZZLES.length)
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

export const ARC_COLORS = ['hsl(24 92% 58%)', 'hsl(145 55% 52%)', 'hsl(200 82% 60%)', 'hsl(275 58% 60%)']
export const ARC_EDGES = ['hsl(20 85% 43%)', 'hsl(145 60% 37%)', 'hsl(205 75% 44%)', 'hsl(275 60% 42%)']

export function arcOf(i: number): number {
  return Math.floor(i / 3)
}

export function medalForChain(wordsUsed: number, par: number, gaveUp: boolean): { icon: string; label: string } {
  if (gaveUp) return { icon: '⬛', label: 'Route revealed' }
  if (wordsUsed <= par) return { icon: '🥇', label: 'Gold — par circuit!' }
  if (wordsUsed === par + 1) return { icon: '🥈', label: 'Silver — 1 over par' }
  if (wordsUsed === par + 2) return { icon: '🥉', label: 'Bronze — 2 over par' }
  return { icon: '✅', label: 'Circuit complete' }
}

export function buildCircuitShare(puzzleNo: number, wordsUsed: number, par: number, gaveUp: boolean): string {
  const medal = medalForChain(wordsUsed, par, gaveUp)
  const cells = gaveUp ? '⬛'.repeat(12) : '🟧🟧🟧🟩🟩🟩🟦🟦🟦🟪🟪🟪'
  return `CIRCUIT No.${puzzleNo}\n${medal.icon} ${wordsUsed} word${wordsUsed === 1 ? '' : 's'} · par ${par}\n${cells}`
}
