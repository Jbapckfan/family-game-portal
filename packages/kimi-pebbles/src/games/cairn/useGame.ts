import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LEVELS,
  MAX_HINTS_PER_LEVEL,
  addedLetter,
  buildRack,
  dailyPuzzle,
  generatePracticePuzzle,
  isValidWord,
  loadDict,
  todayDayNumber,
  type LevelResult,
  type Puzzle,
} from './engine'
import { EMPTY_STATS, loadDayProgress, loadStats, saveDayProgress, saveStats, type Stats } from './storage'
import { completeCairnLevel, restoreCairnProgress } from './progress'
import { loadSoundOn, saveSoundOn } from '../shared/stats'
import { setSoundEnabled, sfx } from '../shared/sound'
import { isPremium } from '../shared/premium'

export type Phase = 'loading' | 'playing' | 'advancing' | 'finished'
export type Mode = 'daily' | 'practice'

export interface Toast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

export interface GameState {
  phase: Phase
  mode: Mode
  puzzle: Puzzle | null
  puzzleNo: number
  dayNumber: number
  level: number
  rack: string[]
  slots: (number | null)[]
  misses: number
  hints: number
  results: LevelResult[]
  toast: Toast | null
  shaking: boolean
  solvedFlash: boolean
  newLetterIdx: number | null
  droppingIdx: number | null
  stats: Stats
  soundOn: boolean
  finished: boolean
  perfect: boolean
}

const initialState: GameState = {
  phase: 'loading',
  mode: 'daily',
  puzzle: null,
  puzzleNo: 0,
  dayNumber: 0,
  level: 0,
  rack: [],
  slots: [],
  misses: 0,
  hints: 0,
  results: [],
  toast: null,
  shaking: false,
  solvedFlash: false,
  newLetterIdx: null,
  droppingIdx: null,
  stats: { ...EMPTY_STATS },
  soundOn: true,
  finished: false,
  perfect: false,
}

function levelSetup(puzzle: Puzzle, level: number, seedBase: number) {
  const word = puzzle.words[level]
  const rack = buildRack(word, seedBase * 97 + level * 13 + 7)
  const prev = level > 0 ? puzzle.words[level - 1] : null
  const added = addedLetter(prev, word)
  const idx = added ? rack.indexOf(added) : -1
  return {
    rack,
    slots: Array<number | null>(word.length).fill(null),
    newLetterIdx: idx >= 0 ? idx : null,
  }
}

export function useGame() {
  const [s, setS] = useState<GameState>(() => ({ ...initialState, stats: loadStats(), soundOn: loadSoundOn() }))
  const ref = useRef(s)
  ref.current = s
  const timers = useRef<number[]>([])
  const toastId = useRef(0)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const cancelPending = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const makeToast = useCallback((msg: string, kind: Toast['kind'] = 'info'): Toast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const toast = useCallback(
    (msg: string, kind: Toast['kind'] = 'info') => {
      const t = makeToast(msg, kind)
      setS((prev) => ({ ...prev, toast: t }))
    },
    [makeToast],
  )

  /* ---------- daily init / restore ---------- */
  const startDaily = useCallback(() => {
    cancelPending()
    const day = todayDayNumber()
    const { puzzle, puzzleNo } = dailyPuzzle(day)
    const saved = restoreCairnProgress(loadDayProgress(day), puzzle, isValidWord)
    const stats = loadStats()
    if (saved?.finished) {
      setS((prev) => ({
        ...prev,
        phase: 'finished',
        mode: 'daily',
        puzzle,
        puzzleNo,
        dayNumber: day,
        stats,
        level: saved.level,
        results: saved.results,
        finished: true,
        perfect: saved.results.every((r) => r.status === 'clean'),
        rack: saved.rack,
        slots: saved.slots,
        misses: 0,
        hints: 0,
        newLetterIdx: null,
        droppingIdx: null,
        toast: null,
        solvedFlash: false,
        shaking: false,
      }))
      return
    }
    const level = saved ? Math.min(saved.level, LEVELS - 1) : 0
    const setup = levelSetup(puzzle, level, day)
    setS((prev) => ({
      ...prev,
      phase: 'playing',
      mode: 'daily',
      puzzle,
      puzzleNo,
      dayNumber: day,
      stats,
      level,
      rack: saved?.rack ?? setup.rack,
      slots: saved?.slots ?? setup.slots,
      newLetterIdx: saved ? null : setup.newLetterIdx,
      droppingIdx: saved ? null : setup.newLetterIdx,
      misses: saved?.misses ?? 0,
      hints: saved?.hints ?? 0,
      results: saved?.results ?? [],
      finished: false,
      perfect: false,
      toast: null,
      solvedFlash: false,
      shaking: false,
    }))
  }, [cancelPending])

  /* ---------- boot ---------- */
  useEffect(() => {
    let alive = true
    loadDict()
      .then(() => {
        if (alive) startDaily()
      })
      .catch(() => {
        if (alive) toast('Could not load the dictionary. Check your connection.', 'error')
      })
    return () => {
      alive = false
    }
  }, [startDaily, toast])

  /* ---------- new-day rollover when tab regains focus ---------- */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      const cur = ref.current
      if (cur.mode === 'daily' && cur.dayNumber !== 0 && cur.dayNumber !== todayDayNumber()) {
        startDaily()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    const rolloverTimer = window.setInterval(onVis, 30_000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.clearInterval(rolloverTimer)
    }
  }, [startDaily])

  /* ---------- persist daily progress ---------- */
  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || !s.puzzle || s.dayNumber === 0) return
    const saved = loadDayProgress(s.dayNumber)
    saveDayProgress(s.dayNumber, {
      level: s.level,
      results: s.results,
      rack: s.rack,
      misses: s.misses,
      hints: s.hints,
      slots: s.slots,
      finished: s.finished,
      countedPlayed: saved?.countedPlayed === true,
    })
  }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.level, s.results, s.rack, s.misses, s.hints, s.slots, s.finished])

  /* ---------- clear one-shot animation flags ---------- */
  useEffect(() => {
    if (s.droppingIdx === null) return
    const id = window.setTimeout(() => setS((prev) => ({ ...prev, droppingIdx: null })), 600)
    return () => clearTimeout(id)
  }, [s.droppingIdx])

  useEffect(() => {
    if (!s.shaking) return
    const id = window.setTimeout(() => setS((prev) => ({ ...prev, shaking: false })), 500)
    return () => clearTimeout(id)
  }, [s.shaking])

  const markCountedPlayed = useCallback((prev: GameState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress(prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    saveDayProgress(prev.dayNumber, {
      level: prev.level,
      results: prev.results,
      rack: prev.rack,
      misses: prev.misses,
      hints: prev.hints,
      slots: prev.slots,
      finished: prev.finished,
      countedPlayed: true,
    })
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    saveStats(stats)
    return stats
  }, [])

  /* ---------- advance to next level / finish ---------- */
  const advance = useCallback(
    (result: LevelResult, prev: GameState) => {
      if (!prev.puzzle || prev.finished || prev.results.length !== prev.level) return
      const isLast = prev.level === LEVELS - 1
      const nextLevel = Math.min(prev.level + 1, LEVELS - 1)
      const seed = prev.mode === 'daily' ? prev.dayNumber : Math.floor(Math.random() * 1e9)
      const setup = levelSetup(prev.puzzle, nextLevel, seed)
      const transition = completeCairnLevel({ ...prev, countedPlayed: true }, result, setup.rack)
      const results = transition.results
      if (isLast) {
        const perfect = results.every((r) => r.status === 'clean')
        let stats = prev.stats
        if (prev.mode === 'daily') {
          const day = prev.dayNumber
          const streak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
          stats = {
            ...stats,
            completed: stats.completed + 1,
            perfect: stats.perfect + (perfect ? 1 : 0),
            currentStreak: streak,
            maxStreak: Math.max(stats.maxStreak, streak),
            lastCompletedDay: day,
            totalMisses: stats.totalMisses + results.reduce((a, r) => a + r.misses, 0),
          }
          saveStats(stats)
        }
        setS((p) => ({ ...p, ...transition, phase: 'finished', perfect, stats }))
        sfx.win()
        return
      }
      setS((p) => ({
        ...p,
        ...transition,
        phase: 'playing',
        newLetterIdx: setup.newLetterIdx,
        droppingIdx: setup.newLetterIdx,
        solvedFlash: false,
      }))
    },
    [],
  )

  /* ---------- input actions ---------- */

  const tapRack = useCallback((i: number) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.slots.includes(i)) return
    const empty = prev.slots.indexOf(null)
    if (empty === -1) return
    const slots = [...prev.slots]
    slots[empty] = i
    sfx.tap()
    setS({ ...prev, slots })
  }, [])

  const tapSlot = useCallback((pos: number) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.slots[pos] === null) return
    const slots = [...prev.slots]
    slots[pos] = null
    sfx.remove()
    setS({ ...prev, slots })
  }, [])

  const del = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing') return
    for (let p = prev.slots.length - 1; p >= 0; p--) {
      if (prev.slots[p] !== null) {
        const slots = [...prev.slots]
        slots[p] = null
        sfx.remove()
        setS({ ...prev, slots })
        return
      }
    }
  }, [])

  const shuffle = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const slottedIdx = prev.slots.filter((x): x is number => x !== null)
    const slottedLetters = slottedIdx.map((i) => prev.rack[i])
    const pool = prev.rack.filter((_, i) => !slottedIdx.includes(i))
    for (let k = pool.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1))
      ;[pool[k], pool[j]] = [pool[j], pool[k]]
    }
    const rack = [...slottedLetters, ...pool]
    let k = 0
    const slots = prev.slots.map((x) => (x === null ? null : k++))
    // keep the new-letter highlight on the same letter (only if it's still free in the rack)
    let newLetterIdx: number | null = null
    if (prev.newLetterIdx !== null) {
      const letter = prev.rack[prev.newLetterIdx]
      const freeIdx = rack.findIndex((ch, i) => i >= slottedLetters.length && ch === letter)
      newLetterIdx = freeIdx >= 0 ? freeIdx : null
    }
    sfx.tap()
    setS({ ...prev, rack, slots, newLetterIdx })
  }, [])

  const submit = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    if (prev.slots.some((x) => x === null)) {
      sfx.error()
      setS({ ...prev, shaking: true, toast: makeToast('Use every letter!', 'info') })
      return
    }
    const attempt = prev.slots.map((i) => prev.rack[i as number]).join('')
    if (!isValidWord(attempt)) {
      sfx.error()
      const stats = markCountedPlayed(prev)
      setS({
        ...prev,
        shaking: true,
        misses: prev.misses + 1,
        stats,
        toast: makeToast('Not in the word list', 'error'),
      })
      return
    }
    const clean = prev.misses === 0 && prev.hints === 0
    const result: LevelResult = {
      status: clean ? 'clean' : 'messy',
      misses: prev.misses,
      hints: prev.hints,
      word: attempt,
    }
    const stats = markCountedPlayed(prev)
    sfx.levelUp()
    setS({ ...prev, phase: 'advancing', solvedFlash: true, stats })
    later(() => advance(result, { ...prev, stats }), 650)
  }, [advance, later, markCountedPlayed, makeToast])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const word = prev.puzzle.words[prev.level]
    const max = isPremium() ? word.length - 2 : Math.min(MAX_HINTS_PER_LEVEL, word.length - 2)
    if (prev.hints >= max) {
      setS({ ...prev, toast: makeToast('No hints left for this level', 'info') })
      return
    }
    sfx.hint()
    setS({
      ...prev,
      hints: prev.hints + 1,
      toast: makeToast(`One answer starts with “${word.slice(0, prev.hints + 1).toUpperCase()}”`, 'info'),
    })
  }, [makeToast])

  const giveUp = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    const word = prev.puzzle.words[prev.level]
    const result: LevelResult = {
      status: 'skipped',
      misses: prev.misses,
      hints: prev.hints,
      word,
    }
    const stats = markCountedPlayed(prev)
    sfx.remove()
    setS({
      ...prev,
      phase: 'advancing',
      stats,
      solvedFlash: false,
      toast: makeToast(`The word was “${word.toUpperCase()}”`, 'info'),
    })
    later(() => advance(result, { ...prev, stats }), 1300)
  }, [advance, later, makeToast, markCountedPlayed])

  /* ---------- mode switching ---------- */

  const startPractice = useCallback(() => {
    cancelPending()
    const puzzle = generatePracticePuzzle()
    const setup = levelSetup(puzzle, 0, Math.floor(Math.random() * 1e9))
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      puzzle,
      level: 0,
      rack: setup.rack,
      slots: setup.slots,
      newLetterIdx: null,
      droppingIdx: null,
      misses: 0,
      hints: 0,
      results: [],
      finished: false,
      perfect: false,
      toast: null,
      shaking: false,
      solvedFlash: false,
    }))
    toast('Practice round — stats untouched', 'info')
  }, [cancelPending, toast])

  const exitPractice = useCallback(() => {
    startDaily()
  }, [startDaily])

  const toggleSound = useCallback(() => {
    const prev = ref.current
    const on = !prev.soundOn
    saveSoundOn(on)
    setSoundEnabled(on)
    setS({ ...prev, soundOn: on })
    if (on) sfx.tap()
  }, [])

  useEffect(() => {
    setSoundEnabled(s.soundOn)
  }, [s.soundOn])

  const currentWord = useMemo(() => {
    if (!s.puzzle) return ''
    return s.slots.map((i) => (i === null ? '' : s.rack[i])).join('')
  }, [s.puzzle, s.slots, s.rack])

  return {
    state: s,
    currentWord,
    actions: {
      tapRack,
      tapSlot,
      del,
      shuffle,
      submit,
      hint,
      giveUp,
      startPractice,
      exitPractice,
      toggleSound,
    },
  }
}
