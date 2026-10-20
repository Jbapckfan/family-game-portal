import type { TanglePuzzle } from './engine'

export interface TangleProgress {
  found: string[]
  score: number
  misses: number
  hintsUsed: number
  goldReached: boolean
  countedPlayed: boolean
}

export function pointsFor(word: string): number {
  const n = word.length
  return n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11
}

export function restoreTangleProgress(value: unknown, puzzle: TanglePuzzle): TangleProgress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const saved = value as Record<string, unknown>
  const count = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 1000000
  if (!Array.isArray(saved.found) || saved.found.length > puzzle.words.length ||
    !saved.found.every((word): word is string => typeof word === 'string' && puzzle.words.includes(word)) ||
    new Set(saved.found).size !== saved.found.length || !count(saved.misses) || !count(saved.hintsUsed) ||
    typeof saved.countedPlayed !== 'boolean') return null
  const found = [...saved.found] as string[]
  const score = found.reduce((total, word) => total + pointsFor(word), 0)
  return { found: found.sort(), score, misses: saved.misses, hintsUsed: saved.hintsUsed, goldReached: score >= puzzle.targets[2], countedPlayed: saved.countedPlayed }
}
