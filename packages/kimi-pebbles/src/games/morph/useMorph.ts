import { useCallback, useEffect, useRef, useState } from 'react'
import { dailyMorph, diffCount, practiceMorph, type MorphPuzzle } from './engine'
import { isValidWord, loadDict } from '../shared/dict'
import { EMPTY_GAME_STATS, loadDayProgress, loadGameStats, saveDayProgress, saveGameStats, type GameStats } from '../shared/stats'
import { todayDayNumber } from '../shared/share'
import { sfx } from '../shared/sound'
import { restoreMorphProgress, rewindMorph, type MorphProgress } from './progress'

export type MorphPhase = 'loading' | 'playing' | 'finished'
export type MorphMode = 'daily' | 'practice'

export interface MorphToast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

export interface MorphState {
  phase: MorphPhase
  mode: MorphMode
  puzzle: MorphPuzzle | null
  puzzleNo: number
  dayNumber: number
  rows: string[] // confirmed rungs, rows[0] = start
  edit: string[] // active row being edited
  focusCell: number | null
  paletteOpen: boolean // letter sheet — only via tapping a cell, never keyboard
  misses: number
  hintsUsed: number
  showPath: boolean
  gaveUp: boolean
  finished: boolean
  toast: MorphToast | null
  shaking: boolean
  stats: GameStats
}

const initial: MorphState = {
  phase: 'loading',
  mode: 'daily',
  puzzle: null,
  puzzleNo: 0,
  dayNumber: 0,
  rows: [],
  edit: [],
  focusCell: null,
  paletteOpen: false,
  misses: 0,
  hintsUsed: 0,
  showPath: false,
  gaveUp: false,
  finished: false,
  toast: null,
  shaking: false,
  stats: { ...EMPTY_GAME_STATS },
}

export function useMorph() {
  const [s, setS] = useState<MorphState>(() => ({ ...initial, stats: loadGameStats('morph') }))
  const ref = useRef(s)
  ref.current = s
  const toastId = useRef(0)

  const makeToast = useCallback((msg: string, kind: MorphToast['kind'] = 'info'): MorphToast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const startDaily = useCallback(() => {
    const day = todayDayNumber()
    const { puzzle, puzzleNo } = dailyMorph(day)
    const saved = restoreMorphProgress(loadDayProgress<unknown>('morph', day), puzzle, isValidWord)
    const stats = loadGameStats('morph')
    if (saved?.finished) {
      setS((prev) => ({
        ...prev,
        phase: 'finished',
        mode: 'daily',
        puzzle,
        puzzleNo,
        dayNumber: day,
        stats,
        rows: saved.rows,
        edit: saved.rows[saved.rows.length - 1].split(''),
        misses: saved.misses,
        hintsUsed: saved.hintsUsed,
        gaveUp: saved.gaveUp,
        finished: true,
        toast: null,
        shaking: false,
        focusCell: null,
        paletteOpen: false,
        showPath: saved.gaveUp || saved.hintsUsed > 0,
      }))
      return
    }
    const rows = saved?.rows?.length ? saved.rows : [puzzle.s]
    setS((prev) => ({
      ...prev,
      phase: 'playing',
      mode: 'daily',
      puzzle,
      puzzleNo,
      dayNumber: day,
      stats,
      rows,
      edit: rows[rows.length - 1].split(''),
      misses: saved?.misses ?? 0,
      hintsUsed: saved?.hintsUsed ?? 0,
      finished: false,
      gaveUp: false,
      toast: null,
      shaking: false,
      focusCell: null,
      paletteOpen: false,
      showPath: (saved?.hintsUsed ?? 0) > 0,
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

  /* persist */
  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || !s.puzzle || s.dayNumber === 0) return
    const saved = loadDayProgress<MorphProgress>('morph', s.dayNumber)
    saveDayProgress('morph', s.dayNumber, {
      rows: s.rows,
      misses: s.misses,
      hintsUsed: s.hintsUsed,
      finished: s.finished,
      gaveUp: s.gaveUp,
      countedPlayed: saved?.countedPlayed === true,
    } satisfies MorphProgress)
  }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.rows, s.misses, s.hintsUsed, s.finished, s.gaveUp])

  /* rollover at midnight */
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

  const markPlayed = useCallback((prev: MorphState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress<MorphProgress>('morph', prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    saveDayProgress('morph', prev.dayNumber, {
      rows: prev.rows,
      misses: prev.misses,
      hintsUsed: prev.hintsUsed,
      finished: prev.finished,
      gaveUp: prev.gaveUp,
      countedPlayed: true,
    } satisfies MorphProgress)
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    saveGameStats('morph', stats)
    return stats
  }, [])

  const finish = useCallback(
    (prev: MorphState, finalRows: string[], gaveUp: boolean) => {
      let stats = prev.stats
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
        saveGameStats('morph', stats)
      }
      setS((p) => ({
        ...p,
        phase: 'finished',
        finished: true,
        rows: finalRows,
        gaveUp,
        stats,
        focusCell: null,
        paletteOpen: false,
        showPath: gaveUp,
      }))
      sfx.win()
    },
    [],
  )

  /* ---------- actions ---------- */

  const openCell = useCallback((i: number) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !Number.isInteger(i) || i < 0 || i >= prev.edit.length) return
    sfx.tap()
    setS({ ...prev, focusCell: i, paletteOpen: true })
  }, [])

  const closePalette = useCallback(() => {
    setS((prev) => ({ ...prev, focusCell: null, paletteOpen: false }))
  }, [])

  const pickLetter = useCallback((ch: string) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.focusCell === null || !/^[a-z]$/.test(ch)) return
    const edit = [...prev.edit]
    edit[prev.focusCell] = ch
    sfx.tap()
    setS({ ...prev, edit, focusCell: null, paletteOpen: false })
  }, [])

  const keyboardLetter = useCallback((ch: string) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !/^[a-z]$/.test(ch)) return
    const focus = prev.focusCell ?? 0
    const edit = [...prev.edit]
    edit[focus] = ch
    sfx.tap()
    setS({ ...prev, edit, focusCell: (focus + 1) % edit.length, paletteOpen: false })
  }, [])

  const submit = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const word = prev.edit.join('')
    const last = prev.rows[prev.rows.length - 1]
    const diff = diffCount(word, last)
    if (diff !== 1) {
      sfx.error()
      setS({
        ...prev,
        shaking: true,
        toast: makeToast(
          diff === 0 ? 'Change exactly one letter' : `Only one letter may change (${diff} changed)`,
          'error',
        ),
      })
      return
    }
    if (!isValidWord(word)) {
      sfx.error()
      const stats = markPlayed(prev)
      setS({ ...prev, shaking: true, misses: prev.misses + 1, stats, toast: makeToast('Not in the word list', 'error') })
      return
    }
    if (prev.rows.includes(word)) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Already used that word', 'info') })
      return
    }
    const stats = markPlayed(prev)
    const rows = [...prev.rows, word]
    if (word === prev.puzzle.t) {
      sfx.levelUp()
      setS({ ...prev, rows, stats })
      finish({ ...prev, stats }, rows, false)
      return
    }
    sfx.levelUp()
    setS({ ...prev, rows, edit: word.split(''), stats, focusCell: null, paletteOpen: false })
  }, [finish, makeToast, markPlayed])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    sfx.hint()
    setS({ ...prev, hintsUsed: Math.max(1, prev.hintsUsed), showPath: true })
  }, [])

  const recover = useCallback((restart: boolean) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const recovered = rewindMorph({ ...prev, countedPlayed: true }, prev.puzzle, restart)
    sfx.remove()
    setS({ ...prev, rows: recovered.rows, edit: recovered.rows[recovered.rows.length - 1].split(''), focusCell: null, paletteOpen: false, shaking: false, toast: makeToast(restart ? 'Ladder restarted. Hints and misses are kept.' : 'Last rung removed.', 'info') })
  }, [makeToast])
  const undo = useCallback(() => recover(false), [recover])
  const restart = useCallback(() => recover(true), [recover])

  const closePath = useCallback(() => setS((prev) => ({ ...prev, showPath: false })), [])

  const giveUp = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const stats = markPlayed(prev)
    sfx.remove()
    finish({ ...prev, stats }, prev.rows, true)
  }, [finish, markPlayed])

  const startPractice = useCallback(() => {
    const cur = ref.current
    const { puzzle, puzzleNo } = practiceMorph(cur.mode === 'daily' ? cur.puzzleNo - 1 : -1)
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      puzzle,
      puzzleNo,
      rows: [puzzle.s],
      edit: puzzle.s.split(''),
      misses: 0,
      hintsUsed: 0,
      finished: false,
      gaveUp: false,
      showPath: false,
      focusCell: null,
      paletteOpen: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  const exitPractice = useCallback(() => startDaily(), [startDaily])

  return {
    state: s,
    actions: { openCell, closePalette, pickLetter, keyboardLetter, submit, hint, closePath, undo, restart, giveUp, startPractice, exitPractice },
  }
}
