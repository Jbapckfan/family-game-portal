import answersData from './data/answers.json'
import { todayDayNumber } from '../shared/share'

export const WORD_LEN = 5
export const MAX_GUESSES = 6

export type Eval = 'correct' | 'present' | 'absent'

const ANSWERS = answersData as string[]

export function dailyHunch(dayNumber = todayDayNumber()): { answer: string; puzzleNo: number } {
  const idx = ((dayNumber % ANSWERS.length) + ANSWERS.length) % ANSWERS.length
  return { answer: ANSWERS[idx], puzzleNo: idx + 1 }
}

export function practiceHunch(excludeNo = -1): { answer: string; puzzleNo: number } {
  let idx = Math.floor(Math.random() * ANSWERS.length)
  while (idx === excludeNo) idx = Math.floor(Math.random() * ANSWERS.length)
  return { answer: ANSWERS[idx], puzzleNo: idx + 1 }
}

/** Standard Wordle evaluation with correct duplicate-letter handling. */
export function evaluate(guess: string, answer: string): Eval[] {
  const res: Eval[] = Array(WORD_LEN).fill('absent')
  const pool: Record<string, number> = {}
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) res[i] = 'correct'
    else pool[answer[i]] = (pool[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (res[i] === 'correct') continue
    if ((pool[guess[i]] ?? 0) > 0) {
      res[i] = 'present'
      pool[guess[i]] -= 1
    }
  }
  return res
}

export function buildHunchShare(
  puzzleNo: number,
  evals: Eval[][],
  won: boolean,
  hintsUsed: number,
): string {
  const rows = evals
    .map((r) => r.map((e) => (e === 'correct' ? '🟩' : e === 'present' ? '🟨' : '⬛')).join(''))
    .join('\n')
  const score = won ? `${evals.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
  const hint = hintsUsed > 0 ? ' 💡' : ''
  return `HUNCH No.${puzzleNo} ${score}${hint}\n${rows}`
}
