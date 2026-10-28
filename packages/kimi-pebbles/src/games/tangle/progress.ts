import type { TanglePuzzle } from './engine'
import type { GameStats } from '../shared/stats'

/** The full dictionary includes rare words; medals reward an approachable word hunt. */
export function medalTargets(max: number): [number, number, number] {
  const gold = Math.min(18, Math.max(8, Math.round(max * 0.2)))
  return [Math.ceil(gold / 3), Math.ceil(gold * 2 / 3), gold]
}

/** A saved round can qualify under the revised targets; count that achievement once. */
export function reconcileTangleCompletion(stats: GameStats, progress: TangleProgress | null, day: number): GameStats {
  if (!progress?.goldReached || stats.lastCompletedDay === day) return stats
  const currentStreak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
  return { ...stats, played: stats.played + (progress.countedPlayed ? 0 : 1), completed: stats.completed + 1,
    currentStreak, maxStreak: Math.max(stats.maxStreak, currentStreak), lastCompletedDay: day }
}

export interface TangleProgress {
  found: string[]
  score: number
  misses: number
  hintsUsed: number
  hintPrefix?: string | null
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
  const hintPrefix = saved.hintsUsed > 0 && typeof saved.hintPrefix === 'string' && /^[a-z]{2}$/.test(saved.hintPrefix) &&
    puzzle.words.some(word => word.length >= 4 && word.startsWith(saved.hintPrefix as string)) ? saved.hintPrefix : null
  return { found: found.sort(), score, misses: saved.misses, hintsUsed: saved.hintsUsed, hintPrefix, goldReached: score >= puzzle.targets[2], countedPlayed: saved.countedPlayed }
}
