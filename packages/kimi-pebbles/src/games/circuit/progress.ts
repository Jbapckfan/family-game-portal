import type { CircuitPuzzle } from './engine'

export interface CircuitProgress {
  played: string[]
  revealed: number
  hintsUsed: number
  finished: boolean
  gaveUp: boolean
  countedPlayed: boolean
}

export function coverage(played: string[], letters: string): number {
  let mask = 0
  for (const word of played) {
    for (const letter of new Set(word)) {
      const index = letters.indexOf(letter)
      if (index >= 0) mask |= 1 << index
    }
  }
  return mask
}

export function undoCircuitWord(played: string[], letters: string): { played: string[]; current: number[] } {
  const last = played.at(-1)
  return { played: played.slice(0, -1), current: last ? [...last].map((letter) => letters.indexOf(letter)) : [] }
}

export function restartCircuitChain(): { played: string[]; current: number[] } {
  return { played: [], current: [] }
}

export function restoreCircuitProgress(value: unknown, puzzle: CircuitPuzzle): CircuitProgress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const saved = value as Record<string, unknown>
  const count = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max
  if (!Array.isArray(saved.played) || saved.played.length > puzzle.words.length ||
    !saved.played.every((word): word is string => typeof word === 'string' && puzzle.words.includes(word)) ||
    new Set(saved.played).size !== saved.played.length ||
    !count(saved.revealed, puzzle.sol.length) || !count(saved.hintsUsed, 10000) ||
    typeof saved.finished !== 'boolean' || typeof saved.gaveUp !== 'boolean' || typeof saved.countedPlayed !== 'boolean') return null
  const played = saved.played as string[]
  if (played.some((word, index) => {
    if (index > 0 && played[index - 1].at(-1) !== word[0]) return true
    return [...word].some((letter, pos) => puzzle.l.indexOf(letter) < 0 ||
      (pos > 0 && Math.floor(puzzle.l.indexOf(word[pos - 1]) / 3) === Math.floor(puzzle.l.indexOf(letter) / 3)))
  })) return null
  const complete = coverage(played, puzzle.l) === (1 << 12) - 1
  if (saved.gaveUp && !saved.finished || saved.finished !== (saved.gaveUp || complete)) return null
  return { played: [...played], revealed: saved.revealed, hintsUsed: saved.hintsUsed, finished: saved.finished, gaveUp: saved.gaveUp, countedPlayed: saved.countedPlayed }
}
