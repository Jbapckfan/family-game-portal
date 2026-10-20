import { useCallback, useEffect, useRef, useState } from 'react'
import { dailyQuartet, practiceQuartet, seededOrder, MAX_MISSES, type QuartetPuzzle } from './engine'
import { todayDayNumber } from '../shared/share'
import { loadGameStats, saveGameStats, loadDayProgress, saveDayProgress, type GameStats } from '../shared/stats'
import { isPremium } from '../shared/premium'
import { sfx } from '../shared/sound'
import { activeQuartetHint, restoreQuartetProgress, type QuartetProgress, type Tile, type HintPair } from './progress'
export type { Tile } from './progress'

type Mode = 'daily' | 'practice'
type Phase = 'loading' | 'playing' | 'finished'

interface QuartetToast {
  id: number
  msg: string
  kind: 'info' | 'error' | 'success'
}

interface QuartetState {
  phase: Phase
  mode: Mode
  puzzle: QuartetPuzzle | null
  puzzleNo: number
  dayNumber: number
  /** grid positions → tile; solved positions hold null */
  tiles: (Tile | null)[]
  selected: number[]
  solvedGroups: number[] // group indexes, in solve order
  misses: number
  history: number[][] // each guess: tiers of its 4 members
  hintPair: HintPair | null
  hintsUsed: number
  finished: boolean
  won: boolean
  toast: QuartetToast | null
  shaking: boolean
  stats: GameStats
}

const initial = (): QuartetState => ({
  phase: 'loading',
  mode: 'daily',
  puzzle: null,
  puzzleNo: 0,
  dayNumber: 0,
  tiles: [],
  selected: [],
  solvedGroups: [],
  misses: 0,
  history: [],
  hintPair: null,
  hintsUsed: 0,
  finished: false,
  won: false,
  toast: null,
  shaking: false,
  stats: loadGameStats('quartet'),
})

function deal(puzzle: QuartetPuzzle, seed: number | null): (Tile | null)[] {
  const flat: Tile[] = puzzle.groups.flatMap((g, gi) => g.members.map((w) => ({ word: w, group: gi })))
  const order = seed === null ? shuffle(16) : seededOrder(seed)
  return order.map((src) => flat[src])
}

function shuffle(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function useQuartet() {
  const [s, setS] = useState<QuartetState>(initial)
  const ref = useRef(s)
  ref.current = s
  const toastId = useRef(0)

  const makeToast = useCallback((msg: string, kind: QuartetToast['kind'] = 'info'): QuartetToast => {
    toastId.current += 1
    const id = toastId.current
    window.setTimeout(() => {
      setS((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev))
    }, 1900)
    return { id, msg, kind }
  }, [])

  const startDaily = useCallback(() => {
    const day = todayDayNumber()
    const { puzzle, puzzleNo } = dailyQuartet(day)
    const saved = restoreQuartetProgress(loadDayProgress<unknown>('quartet', day), puzzle)
    const stats = loadGameStats('quartet')
    if (saved?.finished) {
      setS((prev) => ({
        ...prev,
        phase: 'finished',
        mode: 'daily',
        puzzle,
        puzzleNo,
        dayNumber: day,
        stats,
        tiles: saved.tiles,
        selected: [],
        solvedGroups: saved.solvedGroups,
        misses: saved.misses,
        history: saved.history,
        hintPair: saved.hintPair,
        hintsUsed: saved.hintsUsed,
        finished: true,
        won: saved.won,
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
      tiles: saved?.tiles ?? deal(puzzle, day * 7919),
      selected: [],
      solvedGroups: saved?.solvedGroups ?? [],
      misses: saved?.misses ?? 0,
      history: saved?.history ?? [],
      hintPair: saved?.hintPair ?? null,
      hintsUsed: saved?.hintsUsed ?? 0,
      finished: false,
      won: false,
      toast: null,
      shaking: false,
    }))
  }, [])

  useEffect(() => {
    startDaily()
  }, [startDaily])

  /* persist */
  useEffect(() => {
    if (s.mode !== 'daily' || s.phase === 'loading' || !s.puzzle || s.dayNumber === 0) return
    const saved = loadDayProgress<QuartetProgress>('quartet', s.dayNumber)
    saveDayProgress('quartet', s.dayNumber, {
      tiles: s.tiles,
      solvedGroups: s.solvedGroups,
      misses: s.misses,
      history: s.history,
      hintPair: s.hintPair,
      hintsUsed: s.hintsUsed,
      finished: s.finished,
      won: s.won,
      countedPlayed: saved?.countedPlayed === true,
    } satisfies QuartetProgress)
  }, [s.mode, s.phase, s.puzzle, s.dayNumber, s.tiles, s.solvedGroups, s.misses, s.history, s.hintPair, s.hintsUsed, s.finished, s.won])

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

  const markPlayed = useCallback((prev: QuartetState) => {
    if (prev.mode !== 'daily') return prev.stats
    const saved = loadDayProgress<QuartetProgress>('quartet', prev.dayNumber)
    if (saved?.countedPlayed === true) return prev.stats
    saveDayProgress('quartet', prev.dayNumber, {
      tiles: prev.tiles,
      solvedGroups: prev.solvedGroups,
      misses: prev.misses,
      history: prev.history,
      hintPair: prev.hintPair,
      hintsUsed: prev.hintsUsed,
      finished: prev.finished,
      won: prev.won,
      countedPlayed: true,
    } satisfies QuartetProgress)
    const stats = { ...prev.stats, played: prev.stats.played + 1 }
    saveGameStats('quartet', stats)
    return stats
  }, [])

  const finish = useCallback((prev: QuartetState, won: boolean, tiles: (Tile | null)[], solvedGroups: number[], history: number[][]) => {
    let stats = prev.stats
    if (prev.mode === 'daily') {
      if (won) {
        const day = prev.dayNumber
        const streak = stats.lastCompletedDay === day - 1 ? stats.currentStreak + 1 : 1
        stats = {
          ...stats,
          completed: stats.completed + 1,
          currentStreak: streak,
          maxStreak: Math.max(stats.maxStreak, streak),
          lastCompletedDay: day,
        }
      } else {
        stats = { ...stats, currentStreak: 0 }
      }
      saveGameStats('quartet', stats)
    }
    if (won) sfx.win()
    else sfx.remove()
    setS((p) => ({
      ...p,
      phase: 'finished',
      finished: true,
      won,
      tiles,
      solvedGroups,
      history,
      misses: prev.misses,
      selected: [],
      hintPair: null,
      stats,
    }))
  }, [])

  const toggleTile = useCallback((pos: number) => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.tiles[pos]) return
    const at = prev.selected.indexOf(pos)
    if (at >= 0) {
      sfx.remove()
      setS({ ...prev, selected: prev.selected.filter((p) => p !== pos) })
      return
    }
    if (prev.selected.length >= 4) return
    sfx.tap()
    setS({ ...prev, selected: [...prev.selected, pos] })
  }, [])

  const deselectAll = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || prev.selected.length === 0) return
    sfx.remove()
    setS({ ...prev, selected: [] })
  }, [])

  const shuffleBoard = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    sfx.tap()
    const remaining = prev.tiles.filter((t): t is Tile => t !== null)
    const shuffled = shuffle(remaining.length).map((i) => remaining[i])
    const tiles: (Tile | null)[] = []
    let k = 0
    for (let i = 0; i < prev.tiles.length; i++) tiles.push(prev.tiles[i] === null ? null : shuffled[k++])
    setS({ ...prev, tiles, selected: [], hintPair: activeQuartetHint(prev.hintPair, tiles) })
  }, [])

  const submit = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle || prev.selected.length !== 4) return
    const stats = markPlayed(prev)
    const groups = prev.selected.map((p) => prev.tiles[p]!.group)
    const tiers = prev.selected.map((p) => prev.puzzle!.groups[prev.tiles[p]!.group].tier)
    const history = [...prev.history, tiers]
    const g0 = groups[0]
    const allSame = groups.every((g) => g === g0)
    if (allSame) {
      if (prev.solvedGroups.includes(g0)) {
        sfx.error()
        setS({ ...prev, shaking: true, selected: [], toast: makeToast('Already found that group', 'info') })
        return
      }
      const solvedGroups = [...prev.solvedGroups, g0]
      const tiles = prev.tiles.map((t, i) => (prev.selected.includes(i) ? null : t))
      const label = prev.puzzle.groups[g0].label
      if (solvedGroups.length === 4) {
        finish({ ...prev, stats }, true, tiles, solvedGroups, history)
        return
      }
      sfx.levelUp()
      setS({
        ...prev,
        tiles,
        solvedGroups,
        history,
        selected: [],
        hintPair: activeQuartetHint(prev.hintPair, tiles),
        stats,
        toast: makeToast(`${label}!`, 'success'),
      })
      return
    }
    // wrong guess
    const counts = new Map<number, number>()
    groups.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1))
    const oneAway = [...counts.values()].some((c) => c === 3)
    const misses = prev.misses + 1
    sfx.error()
    if (misses >= MAX_MISSES) {
      // reveal everything — unsolved groups shown by the board in tier order
      finish({ ...prev, stats, misses }, false, prev.tiles.map(() => null), prev.solvedGroups, history)
      return
    }
    setS({
      ...prev,
      misses,
      history,
      selected: [],
      hintPair: prev.hintPair,
      stats,
      shaking: true,
      toast: makeToast(oneAway ? 'One away…' : 'Not a group', oneAway ? 'info' : 'error'),
    })
  }, [finish, makeToast, markPlayed])

  const hint = useCallback(() => {
    const prev = ref.current
    if (prev.phase !== 'playing' || !prev.puzzle) return
    if (!isPremium() && prev.hintsUsed >= 1) {
      setS({ ...prev, toast: makeToast('The free hint for this round has been used', 'info') })
      return
    }
    const unsolved = [0, 1, 2, 3].filter((g) => !prev.solvedGroups.includes(g))
    if (unsolved.length === 0) return
    const g = unsolved[Math.floor(Math.random() * unsolved.length)]
    const positions = prev.tiles
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t && t.group === g)
      .map(({ i }) => i)
    if (positions.length < 2) return
    sfx.hint()
    setS({
      ...prev,
      hintPair: [prev.tiles[positions[0]]!.word, prev.tiles[positions[1]]!.word],
      hintsUsed: prev.hintsUsed + 1,
      toast: makeToast('Two glowing tiles belong together', 'success'),
    })
  }, [makeToast])

  const startPractice = useCallback(() => {
    const cur = ref.current
    const { puzzle, puzzleNo } = practiceQuartet(cur.mode === 'daily' ? cur.puzzleNo - 1 : -1)
    setS((prev) => ({
      ...prev,
      mode: 'practice',
      phase: 'playing',
      puzzle,
      puzzleNo,
      tiles: deal(puzzle, null),
      selected: [],
      solvedGroups: [],
      misses: 0,
      history: [],
      hintPair: null,
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
    actions: { toggleTile, deselectAll, shuffleBoard, submit, hint, startPractice, exitPractice },
  }
}
