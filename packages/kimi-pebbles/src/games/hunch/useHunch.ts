import { useCallback, useEffect, useRef, useState } from 'react'
import { dailyHunch, practiceHunch, evaluate, WORD_LEN, MAX_GUESSES, type Eval } from './engine'
import { loadDict, isValidWord } from '../shared/dict'
import { todayDayNumber } from '../shared/share'
import { EMPTY_GAME_STATS, loadGameStats, saveGameStats, loadDayProgress, saveDayProgress, type GameStats } from '../shared/stats'
import { restoreHunchProgress, type HunchProgress } from './progress'
import { isPremium } from '../shared/premium'
import { sfx } from '../shared/sound'

type Mode = 'daily' | 'practice'
type Phase = 'loading' | 'playing' | 'finished'

interface HunchToast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

interface HunchState {
  phase: Phase
  mode: Mode
  answer: string
  puzzleNo: number
  dayNumber: number
  guesses: string[]
  evals: Eval[][]
  current: string
  hintLetters: string[]
  hintsUsed: number
  finished: boolean
  won: boolean
  toast: HunchToast | null
  shaking: boolean
  stats: GameStats
}

const initial: HunchState = {
  phase: 'loading',
  mode: 'daily',
  answer: '',
  puzzleNo: 0,
  dayNumber: 0,
  guesses: [],
  evals: [],
  current: '',
  hintLetters: [],
  hintsUsed: 0,
  finished: false,
  won: false,
  toast: null,
  shaking: false,
  stats: { ...EMPTY_GAME_STATS },
}

export function useHunch() {
  const [s, setS] = useState<HunchState>(() => ({ ...initial, stats: loadGameStats('hunch') }))
  const ref = useRef(s)
  ref.current = s
  const toastId = useRef(0)

  const makeToast = useCallback((msg: string, kind: HunchToast['kind'] = 'info'): HunchToast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const startDaily = useCallback(() => {
    const day = todayDayNumber()
    const { answer, puzzleNo } = dailyHunch(day)
    const saved = restoreHunchProgress(loadDayProgress<unknown>('hunch', day), answer, evaluate, isValidWord)
    const stats = loadGameStats('hunch')
    if (saved?.finished) {
      setS((prev) => ({
        ...prev,
        phase: 'finished',
        mode: 'daily',
        answer,
        puzzleNo,
        dayNumber: day,
        stats,
        guesses: saved.guesses,
        evals: saved.evals,
        hintLetters: saved.hintLetters,
        hintsUsed: saved.hintsUsed,
        finished: true,
        won: saved.won,
        current: '',
        toast: null,
        shaking: false,
      }))
      return
    }
    setS((prev) => ({
      ...prev,
      phase: 'playing',
      mode: 'daily',
      answer,
      puzzleNo,
      dayNumber: day,
      stats,
      guesses: saved?.guesses ?? [],
      evals: saved?.evals ?? [],
      current: saved?.current ?? '',
      hintLetters: saved?.hintLetters ?? [],
      hintsUsed: saved?.hintsUsed ?? 0,
      finished: false,
      won: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  useEffect(() => {
    let alive = true
    loadDict()
      .then(() => alive && startDaily())
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [startDaily])

  /* persist daily progress */
  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || s.dayNumber === 0) return
    const saved = loadDayProgress<HunchProgress>('hunch', s.dayNumber)
    saveDayProgress('hunch', s.dayNumber, {
      guesses: s.guesses,
      current: s.current,
      evals: s.evals,
      hintLetters: s.hintLetters,
      hintsUsed: s.hintsUsed,
      finished: s.finished,
      won: s.won,
      countedPlayed: saved?.countedPlayed === true,
    } satisfies HunchProgress)
  }, [s.mode, s.phase, s.dayNumber, s.guesses, s.current, s.evals, s.hintLetters, s.hintsUsed, s.finished, s.won])

  /* midnight rollover */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      const cur = ref.current
      if (cur.mode === 'daily' && cur.dayNumber !== 0 && cur.dayNumber !== todayDayNumber()) startDaily()
    }
    document.addEventListener('visibilitychange', onVis)
    const rolloverTimer = window.setInterval(onVis, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(rolloverTimer)
    }
  }, [startDaily])

  useEffect(() => {
    if (!s.shaking) return
    const id = window.setTimeout(() => setS((prev) => ({ ...prev, shaking: false })), 500)
    return () => clearTimeout(id)
  }, [s.shaking])

  const markPlayed = useCallback((prev: HunchState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress<HunchProgress>('hunch', prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    saveDayProgress('hunch', prev.dayNumber, {
      guesses: prev.guesses,
      current: prev.current,
      evals: prev.evals,
      hintLetters: prev.hintLetters,
      hintsUsed: prev.hintsUsed,
      finished: prev.finished,
      won: prev.won,
      countedPlayed: true,
    } satisfies HunchProgress)
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    saveGameStats('hunch', stats)
    return stats
  }, [])

  const finish = useCallback((prev: HunchState, won: boolean, guesses: string[], evals: Eval[][]) => {
    let stats = prev.stats
    if (prev.mode === 'daily' && won) {
      const day = prev.dayNumber
      const streak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
      stats = {
        ...stats,
        completed: stats.completed + 1,
        currentStreak: streak,
        maxStreak: Math.max(stats.maxStreak, streak),
        lastCompletedDay: day,
      }
      saveGameStats('hunch', stats)
    } else if (prev.mode === 'daily') {
      stats = { ...stats, currentStreak: 0, lastCompletedDay: stats.lastCompletedDay }
      saveGameStats('hunch', stats)
    }
    if (won) sfx.win()
    else sfx.remove()
    setS((p) => ({ ...p, phase: 'finished', finished: true, won, guesses, evals, current: '', stats }))
  }, [])

  const keyLetter = useCallback((ch: string) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !/^[a-z]$/.test(ch)) return
    if (prev.current.length >= WORD_LEN) return
    sfx.tap()
    setS({ ...prev, current: prev.current + ch })
  }, [])

  const backspace = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.current.length === 0) return
    sfx.remove()
    setS({ ...prev, current: prev.current.slice(0, -1) })
  }, [])

  const submit = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing') return
    const guess = prev.current
    if (guess.length < WORD_LEN) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Not enough letters', 'error') })
      return
    }
    if (!isValidWord(guess)) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Not in the word list', 'error') })
      return
    }
    const stats = markPlayed(prev)
    const evals = [...prev.evals, evaluate(guess, prev.answer)]
    const guesses = [...prev.guesses, guess]
    if (guess === prev.answer) {
      finish({ ...prev, stats }, true, guesses, evals)
      return
    }
    if (guesses.length >= MAX_GUESSES) {
      finish({ ...prev, stats }, false, guesses, evals)
      return
    }
    sfx.levelUp()
    setS({ ...prev, guesses, evals, current: '', stats })
  }, [finish, makeToast, markPlayed])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing') return
    if (!isPremium() && prev.hintsUsed >= 1) {
      setS({ ...prev, toast: makeToast('Your one letter hint has been used for this round.', 'info') })
      return
    }
    const greens = new Set<string>()
    prev.evals.forEach((row, r) =>
      row.forEach((e, i) => {
        if (e === 'correct') greens.add(prev.guesses[r][i])
      }),
    )
    const candidates = prev.answer.split('').filter((c) => !hintTaken(prev, c, greens))
    if (candidates.length === 0) {
      setS({ ...prev, toast: makeToast('No more to reveal', 'info') })
      return
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    sfx.hint()
    setS({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      hintLetters: [...prev.hintLetters, pick],
      toast: makeToast(`The answer contains ${pick.toUpperCase()}`, 'success'),
    })
  }, [makeToast])

  const startPractice = useCallback(() => {
    const cur = ref.current
    const { answer, puzzleNo } = practiceHunch(cur.mode === 'daily' ? cur.puzzleNo - 1 : -1)
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      answer,
      puzzleNo,
      guesses: [],
      evals: [],
      current: '',
      hintLetters: [],
      hintsUsed: 0,
      finished: false,
      won: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  const exitPractice = useCallback(() => startDaily(), [startDaily])

  return {
    state: s,
    actions: { keyLetter, backspace, submit, hint, startPractice, exitPractice },
  }
}

function hintTaken(prev: { hintLetters: string[] }, ch: string, greens: Set<string>): boolean {
  return prev.hintLetters.includes(ch) || greens.has(ch)
}
