import { useDailySession } from '../shared/useDailySession'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dailyTangle, pointsFor, practiceTangle, tierFor, type TanglePuzzle } from './engine'
import { loadDayProgress, loadGameStats, saveDayProgress, saveGameStats, type GameStats } from '../shared/stats'
import { todayDayNumber } from '../shared/share'
import { sfx } from '../shared/sound'
import { isPremium } from '../shared/premium'
import { restoreTangleProgress, reconcileTangleCompletion, type TangleProgress } from './progress'

export type TanglePhase = 'loading' | 'playing'
export type TangleMode = 'daily' | 'practice'

export interface TangleToast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

export interface TangleState {
  phase: TanglePhase
  mode: TangleMode
  puzzle: TanglePuzzle | null
  puzzleNo: number
  dayNumber: number
  path: number[]
  found: string[]
  score: number
  misses: number
  hintsUsed: number
  hintPrefix: string | null
  goldReached: boolean
  winShownOnce: boolean
  toast: MorphToastAlias | null
  shaking: boolean
  stats: GameStats
}

type MorphToastAlias = TangleToast

const initial = (): TangleState => ({
  phase: 'loading',
  mode: 'daily',
  puzzle: null,
  puzzleNo: 0,
  dayNumber: 0,
  path: [],
  found: [],
  score: 0,
  misses: 0,
  hintsUsed: 0,
  hintPrefix: null,
  goldReached: false,
  winShownOnce: false,
  toast: null,
  shaking: false,
  stats: loadGameStats('tangle'),
})

export function useTangle() {
  const [s, setS] = useState<TangleState>(initial)
  const dailySession = useDailySession('tangle')
  const ref = useRef(s)
  ref.current = s
  const toastId = useRef(0)

  const makeToast = useCallback((msg: string, kind: TangleToast['kind'] = 'info'): TangleToast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const startDaily = useCallback(() => {
    const day = todayDayNumber()
    const raw = loadDayProgress<unknown>('tangle', day)
    const { puzzle, puzzleNo } = dailyTangle(day, raw)
    const saved = restoreTangleProgress(raw, puzzle)
    const previousStats = loadGameStats('tangle')
    const stats = reconcileTangleCompletion(previousStats, saved, day)
    if (stats !== previousStats && saved) {
      saveGameStats('tangle', stats)
      saveDayProgress('tangle', day, { ...saved, countedPlayed: true })
    }
    dailySession.acknowledge(day)
    setS((prev) => ({
      ...prev,
      phase: 'playing',
      mode: 'daily',
      puzzle,
      puzzleNo,
      dayNumber: day,
      stats,
      path: [],
      found: saved?.found ?? [],
      score: saved?.score ?? 0,
      misses: saved?.misses ?? 0,
      hintsUsed: saved?.hintsUsed ?? 0,
      hintPrefix: saved?.hintPrefix ?? null,
      goldReached: saved?.goldReached ?? false,
      winShownOnce: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  dailySession.configure(() => ref.current, (raw) => ref.current.puzzle &&
    restoreTangleProgress(raw, dailyTangle(ref.current.dayNumber, raw).puzzle), startDaily)

  useEffect(() => {
    // no dictionary fetch needed — tangle validates against per-grid word lists
    startDaily()
  }, [startDaily])

  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || !s.puzzle || s.dayNumber === 0) return
    dailySession.commit(() => {
      const saved = loadDayProgress<TangleProgress>('tangle', s.dayNumber)
      saveDayProgress('tangle', s.dayNumber, {
        found: s.found,
        score: s.score,
        misses: s.misses,
        hintsUsed: s.hintsUsed,
        hintPrefix: s.hintPrefix,
        goldReached: s.goldReached,
        countedPlayed: saved?.countedPlayed === true,
      } satisfies TangleProgress)
      saveGameStats('tangle', s.stats)
    })
  }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.found, s.score, s.misses, s.hintsUsed, s.hintPrefix, s.goldReached])

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

  const markPlayed = useCallback((prev: TangleState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress<TangleProgress>('tangle', prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    dailySession.commit(() => {
      saveDayProgress('tangle', prev.dayNumber, {
        found: prev.found,
        score: prev.score,
        misses: prev.misses,
        hintsUsed: prev.hintsUsed,
        hintPrefix: prev.hintPrefix,
        goldReached: prev.goldReached,
        countedPlayed: true,
      } satisfies TangleProgress)
      saveGameStats('tangle', stats)
    })
    return stats
  }, [])

  const setPath = useCallback((path: number[]) => {
    setS((prev) => (prev.phase === 'playing' ? { ...prev, path } : prev))
  }, [])

  const submitPath = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const path = prev.path
    if (path.length === 0) return
    const word = path.map((i) => prev.puzzle!.g[i]).join('')
    const clear = { path: [] as number[] }
    if (word.length < 3) {
      setS({ ...prev, ...clear, toast: makeToast('Words need 3+ letters', 'info') })
      return
    }
    if (prev.found.includes(word)) {
      sfx.error()
      setS({ ...prev, ...clear, shaking: true, toast: makeToast('Already found', 'info') })
      return
    }
    if (!prev.puzzle.words.includes(word)) {
      sfx.error()
      const stats = markPlayed(prev)
      setS({ ...prev, ...clear, shaking: true, misses: prev.misses + 1, stats, toast: makeToast('Not in the word list', 'error') })
      return
    }
    // success
    const pts = pointsFor(word)
    const score = prev.score + pts
    const found = [...prev.found, word].sort()
    const prevTier = tierFor(prev.score, prev.puzzle.targets)
    const tier = tierFor(score, prev.puzzle.targets)
    let stats = markPlayed(prev)
    let goldReached = prev.goldReached
    let winShownOnce = prev.winShownOnce
    if (tier === 3 && !prev.goldReached) {
      goldReached = true
      winShownOnce = true
      if (prev.mode === 'daily') {
        const day = prev.dayNumber
        const streak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
        stats = {
          ...stats,
          completed: stats.completed + 1,
          currentStreak: streak,
          maxStreak: Math.max(stats.maxStreak, streak),
          lastCompletedDay: day,
        }
      }
      sfx.win()
    } else if (tier > prevTier && tier > 0) {
      sfx.levelUp()
    } else {
      sfx.tap()
    }
    setS({
      ...prev,
      ...clear,
      found,
      score,
      stats,
      goldReached,
      winShownOnce,
      toast: makeToast(`+${pts} · ${word.toUpperCase()}`, 'success'),
    })
  }, [makeToast, markPlayed])

  const clearPath = useCallback(() => {
    setS((prev) => ({ ...prev, path: [] }))
  }, [])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    if (!isPremium() && prev.hintsUsed >= 1) {
      setS({ ...prev, toast: makeToast('The free hint for this round has been used', 'info') })
      return
    }
    const unfound = prev.puzzle.words.filter((w) => !prev.found.includes(w) && w.length >= 4)
    if (!unfound.length) {
      setS({ ...prev, toast: makeToast('Nothing left to hint!', 'info') })
      return
    }
    const pick = unfound[Math.floor(Math.random() * unfound.length)]
    sfx.hint()
    setS({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      hintPrefix: pick.slice(0, 2),
      toast: makeToast(`An unfound word starts with “${pick.slice(0, 2).toUpperCase()}”`, 'info'),
    })
  }, [makeToast])

  const startPractice = useCallback(() => {
    const cur = ref.current
    const { puzzle, puzzleNo } = practiceTangle(cur.mode === 'daily' ? cur.puzzleNo - 1 : -1)
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      puzzle,
      puzzleNo,
      path: [],
      found: [],
      score: 0,
      misses: 0,
      hintsUsed: 0,
      hintPrefix: null,
      goldReached: false,
      winShownOnce: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  const exitPractice = useCallback(() => startDaily(), [startDaily])

  return {
    state: s,
    actions: dailySession.actions({ setPath, submitPath, clearPath, hint, startPractice, exitPractice }),
  }
}
