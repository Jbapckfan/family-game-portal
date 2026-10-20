import puzzlesData from './data/puzzles.json'
import commonRaw from './data/common.txt?raw'
import { loadDict as loadSharedDict, isValidWord as sharedIsValidWord } from '../shared/dict'
export { todayDayNumber, dateLabel, msUntilTomorrow } from '../shared/share'

export type LevelStatus = 'clean' | 'messy' | 'skipped'

export interface LevelResult {
  status: LevelStatus
  misses: number
  hints: number
  word: string
}

export interface Puzzle {
  words: string[]
}

export const LEVELS = 5
export const MAX_HINTS_PER_LEVEL = 2

const PUZZLES: Puzzle[] = (puzzlesData as { w: string[] }[]).map((p) => ({ words: p.w }))

/* ---------------- dates & daily selection ---------------- */

export function dailyPuzzle(dayNumber: number): { puzzle: Puzzle; puzzleNo: number } {
  const idx = ((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length
  return { puzzle: PUZZLES[idx], puzzleNo: idx + 1 }
}

/* ---------------- rng / shuffling ---------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Rack letters for a level: deterministic order per day+level (daily) or given seed. */
export function buildRack(word: string, seed: number): string[] {
  return shuffled(word.split(''), mulberry32(seed))
}

/** Letter added going from prev level word to current word (multiset diff). */
export function addedLetter(prevWord: string | null, word: string): string | null {
  if (!prevWord) return null
  const pool = word.split('')
  for (const ch of prevWord) {
    const i = pool.indexOf(ch)
    if (i >= 0) pool.splice(i, 1)
  }
  return pool[0] ?? null
}

/* ---------------- dictionary (shared across games) ---------------- */

export const loadDict = loadSharedDict
export const isValidWord = sharedIsValidWord

/* ---------------- practice puzzle generation ---------------- */

let commonWords: string[] | null = null
let sigIndex: Map<string, string[]> | null = null

function ensureCommonIndex() {
  if (commonWords && sigIndex) return
  commonWords = commonRaw.split('\n').filter(Boolean)
  sigIndex = new Map()
  for (const w of commonWords) {
    const s = w.split('').sort().join('')
    const list = sigIndex.get(s)
    if (list) list.push(w)
    else sigIndex.set(s, [w])
  }
}

export function generatePracticePuzzle(): Puzzle {
  ensureCommonIndex()
  const words = commonWords!
  const index = sigIndex!
  const starters = words.filter((w) => w.length === 3)

  for (let attempt = 0; attempt < 400; attempt++) {
    const start = starters[Math.floor(Math.random() * starters.length)]
    const chain = [start]
    const letters = start.split('')
    while (chain.length < LEVELS) {
      const prev = chain[chain.length - 1]
      const candidates = 'abcdefghijklmnopqrstuvwxyz'.split('')
      // random letter order
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
      }
      let found: string | null = null
      for (const c of candidates) {
        const s = [...letters, c].sort().join('')
        const hits = index.get(s)
        if (hits && hits.length) {
          const nxt = hits[0]
          if (nxt === prev + 's' || nxt === prev + 'es') continue
          found = nxt
          letters.push(c)
          break
        }
      }
      if (!found) break
      chain.push(found)
    }
    if (chain.length === LEVELS) return { words: chain }
  }
  // fallback: reuse a random daily puzzle
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
}

/* ---------------- share text ---------------- */

export function emojiFor(status: LevelStatus): string {
  return status === 'clean' ? '🟩' : status === 'messy' ? '🟨' : '⬛'
}

export function buildShareText(
  puzzleNo: number,
  results: LevelResult[],
  perfect: boolean,
): string {
  const grid = results.map((r) => emojiFor(r.status)).join('')
  const misses = results.reduce((s, r) => s + r.misses, 0)
  const skipped = results.some((r) => r.status === 'skipped')
  const headline = perfect
    ? 'Perfect stack! ✨'
    : skipped
      ? 'Stack finished'
      : misses === 0
        ? 'No misses!'
        : `${misses} miss${misses === 1 ? '' : 'es'}`
  return `CAIRN No.${puzzleNo}\n${grid}\n${headline}`
}
