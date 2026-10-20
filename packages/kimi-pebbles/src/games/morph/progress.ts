import type { MorphPuzzle } from './engine'

export interface MorphProgress {
  rows: string[]
  misses: number
  hintsUsed: number
  finished: boolean
  gaveUp: boolean
  countedPlayed: boolean
}

const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 1_000_000

export function restoreMorphProgress(raw: unknown, puzzle: MorphPuzzle, validWord: (word: string) => boolean): MorphProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const p = raw as Partial<MorphProgress>
  if (!Array.isArray(p.rows) || p.rows.length < 1 || p.rows.length > 8192 || p.rows[0] !== puzzle.s) return null
  if (p.rows.some(word => typeof word !== 'string' || word.length !== puzzle.s.length || !validWord(word)) || new Set(p.rows).size !== p.rows.length) return null
  for (let i = 1; i < p.rows.length; i++) if ([...p.rows[i]].filter((letter, position) => letter !== p.rows![i - 1][position]).length !== 1) return null
  if (!count(p.misses) || !count(p.hintsUsed) || typeof p.finished !== 'boolean' || typeof p.gaveUp !== 'boolean' || typeof p.countedPlayed !== 'boolean') return null
  const targetIndex = p.rows.indexOf(puzzle.t)
  if (targetIndex !== -1 && targetIndex !== p.rows.length - 1) return null
  if (p.gaveUp && (!p.finished || targetIndex !== -1)) return null
  if (p.finished !== (p.gaveUp || targetIndex !== -1)) return null
  return { rows: [...p.rows], misses: p.misses, hintsUsed: p.hintsUsed, finished: p.finished, gaveUp: p.gaveUp, countedPlayed: p.countedPlayed }
}

/** Recovery keeps the same puzzle, mistakes, and previously consumed help. */
export function rewindMorph<T extends MorphProgress>(progress: T, puzzle: MorphPuzzle, restart = false): T {
  if (progress.finished) return progress
  const rows = restart ? [puzzle.s] : progress.rows.slice(0, Math.max(1, progress.rows.length - 1))
  return { ...progress, rows }
}
