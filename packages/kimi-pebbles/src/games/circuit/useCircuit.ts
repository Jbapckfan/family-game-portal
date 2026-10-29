import { useDailySession } from '../shared/useDailySession'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dailyCircuit, practiceCircuit, arcOf, type CircuitPuzzle } from './engine'
import { todayDayNumber } from '../shared/share'
import { loadGameStats, saveGameStats, loadDayProgress, saveDayProgress, type GameStats } from '../shared/stats'
import { isPremium } from '../shared/premium'
import { sfx } from '../shared/sound'
import { coverage, restoreCircuitProgress, undoCircuitWord, restartCircuitChain, type CircuitProgress } from './progress'

type Mode = 'daily' | 'practice'
type Phase = 'loading' | 'playing' | 'finished'

interface CircuitToast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

interface CircuitState {
  phase: Phase
  mode: Mode
  puzzle: CircuitPuzzle | null
  puzzleNo: number
  dayNumber: number
  played: string[]
  current: number[] // letter indices into puzzle.l
  revealed: number // how many solution words are revealed
  hintsUsed: number
  finished: boolean
  gaveUp: boolean
  toast: CircuitToast | null
  shaking: boolean
  stats: GameStats
}

const initial = (): CircuitState => ({
  phase: 'loading',
  mode: 'daily',
  puzzle: null,
  puzzleNo: 0,
  dayNumber: 0,
  played: [],
  current: [],
  revealed: 0,
  hintsUsed: 0,
  finished: false,
  gaveUp: false,
  toast: null,
  shaking: false,
  stats: loadGameStats('circuit'),
})

export function useCircuit() {
  const [s, setS] = useState<CircuitState>(initial)
  const dailySession = useDailySession('circuit')
  const ref = useRef(s)
  ref.current = s
  const toastId = useRef(0)

  const makeToast = useCallback((msg: string, kind: CircuitToast['kind'] = 'info'): CircuitToast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const startDaily = useCallback(() => {
    const day = todayDayNumber()
    const { puzzle, puzzleNo } = dailyCircuit(day)
    const saved = restoreCircuitProgress(loadDayProgress<unknown>('circuit', day), puzzle)
    const stats = loadGameStats('circuit')
    dailySession.acknowledge(day)
    if (saved?.finished) {
      setS((prev) => ({
        ...prev,
        phase: 'finished',
        mode: 'daily',
        puzzle,
        puzzleNo,
        dayNumber: day,
        stats,
        played: saved.played,
        current: [],
        revealed: saved.revealed,
        hintsUsed: saved.hintsUsed,
        finished: true,
        gaveUp: saved.gaveUp,
        toast: null,
        shaking: false,
      }))
      return
    }
    setS((prev) => ({
      ...prev,
      phase: 'playing',
      mode: 'daily',
      puzzle,
      puzzleNo,
      dayNumber: day,
      stats,
      played: saved?.played ?? [],
      current: saved?.current ?? [],
      revealed: saved?.revealed ?? 0,
      hintsUsed: saved?.hintsUsed ?? 0,
      finished: false,
      gaveUp: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  dailySession.configure(() => ref.current, (raw) => ref.current.puzzle && restoreCircuitProgress(raw, ref.current.puzzle), startDaily)

  useEffect(() => {
    startDaily()
  }, [startDaily])

  /* persist */
  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || !s.puzzle || s.dayNumber === 0) return
    dailySession.commit(() => {
      const saved = loadDayProgress<CircuitProgress>('circuit', s.dayNumber)
      saveDayProgress('circuit', s.dayNumber, {
        played: s.played,
        current: s.current,
        revealed: s.revealed,
        hintsUsed: s.hintsUsed,
        finished: s.finished,
        gaveUp: s.gaveUp,
        countedPlayed: saved?.countedPlayed === true,
      } satisfies CircuitProgress)
      saveGameStats('circuit', s.stats)
    })
  }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.played, s.current, s.revealed, s.hintsUsed, s.finished, s.gaveUp])

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

  const markPlayed = useCallback((prev: CircuitState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress<CircuitProgress>('circuit', prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    dailySession.commit(() => {
      saveDayProgress('circuit', prev.dayNumber, {
        played: prev.played,
        current: prev.current,
        revealed: prev.revealed,
        hintsUsed: prev.hintsUsed,
        finished: prev.finished,
        gaveUp: prev.gaveUp,
        countedPlayed: true,
      } satisfies CircuitProgress)
      saveGameStats('circuit', stats)
    })
    return stats
  }, [])

  const finish = useCallback((prev: CircuitState, played: string[], gaveUp: boolean) => {
    let stats = prev.stats
    if (prev.mode === 'daily' && !gaveUp) {
      const day = prev.dayNumber
      const streak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
      stats = {
        ...stats,
        completed: stats.completed + 1,
        currentStreak: streak,
        maxStreak: Math.max(stats.maxStreak, streak),
        lastCompletedDay: day,
      }
    } else if (prev.mode === 'daily') {
      stats = { ...stats, currentStreak: 0 }
    }
    if (gaveUp) sfx.remove()
    else sfx.win()
    setS((p) => ({ ...p, phase: 'finished', finished: true, played, gaveUp, current: [], stats }))
  }, [])

  /* --- input --- */

  const tapLetter = useCallback(
    (i: number) => {
      const prev = ref.current
      if (prev.phase !== 'playing' || !prev.puzzle) return
      const letters = prev.puzzle.l
      const cur = prev.current
      // chain rule: after a word, the next must start with its last letter
      if (cur.length === 0 && prev.played.length > 0) {
        const need = prev.played[prev.played.length - 1].slice(-1)
        if (letters[i] !== need) {
          sfx.error()
          setS({ ...prev, shaking: true, toast: makeToast(`Next word must start with ${need.toUpperCase()}`, 'error') })
          return
        }
      }
      // arc rule: consecutive letters from different arcs
      if (cur.length > 0 && arcOf(cur[cur.length - 1]) === arcOf(i)) {
        sfx.error()
        setS({ ...prev, shaking: true, toast: makeToast('Letters must hop arcs', 'error') })
        return
      }
      sfx.tap()
      setS({ ...prev, current: [...cur, i] })
    },
    [makeToast],
  )

  const backspace = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.current.length === 0) return
    sfx.remove()
    setS({ ...prev, current: prev.current.slice(0, -1) })
  }, [])

  const clearWord = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing') return
    setS({ ...prev, current: [] })
  }, [])

  const undoWord = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle || prev.played.length === 0) return
    sfx.remove()
    setS({ ...prev, ...undoCircuitWord(prev.played, prev.puzzle.l), toast: null, shaking: false })
  }, [])

  const restartChain = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing') return
    sfx.remove()
    setS({ ...prev, ...restartCircuitChain(), toast: null, shaking: false })
  }, [])

  const submit = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const word = prev.current.map((i) => prev.puzzle!.l[i]).join('')
    if (word.length < 3) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Words need 3+ letters', 'error') })
      return
    }
    if (!prev.puzzle.words.includes(word)) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Not in the word list', 'error') })
      return
    }
    if (prev.played.includes(word)) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Already played', 'info') })
      return
    }
    const stats = markPlayed(prev)
    const played = [...prev.played, word]
    // auto-seed next word with this word's last letter (the index that was tapped last)
    const lastIdx = prev.current[prev.current.length - 1]
    const FULL = (1 << 12) - 1
    if ((coverage(played, prev.puzzle.l) & FULL) === FULL) {
      sfx.levelUp()
      finish({ ...prev, stats }, played, false)
      return
    }
    sfx.levelUp()
    setS({ ...prev, played, current: [lastIdx], stats })
  }, [finish, makeToast, markPlayed])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    if (!isPremium() && prev.hintsUsed >= 1) {
      setS({ ...prev, toast: makeToast('The free hint for this round has been used', 'info') })
      return
    }
    const next = Math.min(prev.revealed + 1, prev.puzzle.sol.length)
    sfx.hint()
    setS({
      ...prev,
      revealed: next,
      hintsUsed: prev.hintsUsed + 1,
      toast: makeToast(`Route clue: ${prev.puzzle.sol.slice(0, next).join(' → ')}`, 'success'),
    })
  }, [makeToast])

  const giveUp = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const stats = markPlayed(prev)
    finish({ ...prev, stats }, prev.played, true)
  }, [finish, markPlayed])

  const startPractice = useCallback(() => {
    const cur = ref.current
    const { puzzle, puzzleNo } = practiceCircuit(cur.mode === 'daily' ? cur.puzzleNo - 1 : -1)
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      puzzle,
      puzzleNo,
      played: [],
      current: [],
      revealed: 0,
      hintsUsed: 0,
      finished: false,
      gaveUp: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  const exitPractice = useCallback(() => startDaily(), [startDaily])

  return {
    state: s,
    actions: dailySession.actions({ tapLetter, backspace, clearWord, undoWord, restartChain, submit, hint, giveUp, startPractice, exitPractice }),
  }
}
