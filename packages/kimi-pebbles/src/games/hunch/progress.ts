import type { Eval } from './engine'

export interface HunchProgress {
  guesses: string[]
  evals: Eval[][]
  hintLetters: string[]
  hintsUsed: number
  finished: boolean
  won: boolean
  countedPlayed: boolean
}

export function restoreHunchProgress(raw: unknown, answer: string, evaluate: (guess: string, answer: string) => Eval[], validWord: (word: string) => boolean): HunchProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const p = raw as Partial<HunchProgress>
  if (!Array.isArray(p.guesses) || p.guesses.length > 6 || p.guesses.some(word => typeof word !== 'string' || !/^[a-z]{5}$/.test(word) || !validWord(word))) return null
  if (!Array.isArray(p.hintLetters) || p.hintLetters.some(ch => typeof ch !== 'string' || !/^[a-z]$/.test(ch) || !answer.includes(ch)) || new Set(p.hintLetters).size !== p.hintLetters.length) return null
  if (typeof p.hintsUsed !== 'number' || !Number.isInteger(p.hintsUsed) || p.hintsUsed !== p.hintLetters.length || typeof p.countedPlayed !== 'boolean') return null
  const answerAt = p.guesses.indexOf(answer)
  if (answerAt !== -1 && answerAt !== p.guesses.length - 1) return null
  const won = answerAt !== -1
  return { guesses: [...p.guesses], evals: p.guesses.map(guess => evaluate(guess, answer)), hintLetters: [...p.hintLetters], hintsUsed: p.hintsUsed, finished: won || p.guesses.length === 6, won, countedPlayed: p.countedPlayed }
}
