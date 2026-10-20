import type { LevelResult, Puzzle } from './engine'

export interface DayProgress {
  level: number
  results: LevelResult[]
  rack: string[]
  misses: number
  hints: number
  slots: (number | null)[]
  finished: boolean
  countedPlayed: boolean
}

const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 1_000_000
const signature = (word: string) => word.split('').sort().join('')

/** Reject inconsistent saves instead of interpreting their indices on another rack. */
export function restoreCairnProgress(raw: unknown, puzzle: Puzzle, validWord: (word: string) => boolean): DayProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const p = raw as Partial<DayProgress>
  if (!count(p.level) || p.level >= puzzle.words.length || !Array.isArray(p.results) || p.results.length > puzzle.words.length) return null
  if (typeof p.finished !== 'boolean' || typeof p.countedPlayed !== 'boolean' || !count(p.misses) || !count(p.hints)) return null
  if (p.results.length !== (p.finished ? puzzle.words.length : p.level) || (p.finished && p.level !== puzzle.words.length - 1)) return null
  for (let i = 0; i < p.results.length; i++) {
    const r = p.results[i]
    if (!r || typeof r !== 'object' || !['clean', 'messy', 'skipped'].includes(r.status)) return null
    if (!count(r.misses) || !count(r.hints) || typeof r.word !== 'string' || signature(r.word) !== signature(puzzle.words[i]) || !validWord(r.word)) return null
    if (r.status === 'clean' && (r.misses !== 0 || r.hints !== 0)) return null
  }
  const word = puzzle.words[p.level]
  if (!Array.isArray(p.rack) || p.rack.length !== word.length || p.rack.some(ch => typeof ch !== 'string' || !/^[a-z]$/.test(ch))) return null
  if (signature(p.rack.join('')) !== signature(word) || !Array.isArray(p.slots) || p.slots.length !== word.length) return null
  const indices = p.slots.filter(index => index !== null)
  if (indices.some(index => !Number.isInteger(index) || index < 0 || index >= word.length) || new Set(indices).size !== indices.length) return null
  return { level: p.level, results: p.results.map(r => ({ ...r })), rack: [...p.rack], slots: [...p.slots], misses: p.misses, hints: p.hints, finished: p.finished, countedPlayed: p.countedPlayed }
}

/** One atomic logical transition; a finished level is never saved beside its old index. */
export function completeCairnLevel(progress: DayProgress, result: LevelResult, nextRack: string[]): DayProgress {
  if (progress.finished || progress.results.length !== progress.level) return progress
  const results = [...progress.results, { ...result }]
  if (results.length === 5) return { ...progress, results, finished: true }
  return { ...progress, results, level: progress.level + 1, rack: [...nextRack], slots: Array(nextRack.length).fill(null), misses: 0, hints: 0 }
}
