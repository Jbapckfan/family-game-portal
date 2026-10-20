import type { DayProgress } from './progress'
export type { DayProgress } from './progress'

export interface Stats {
  played: number
  completed: number
  perfect: number
  currentStreak: number
  maxStreak: number
  lastCompletedDay: number | null
  totalMisses: number
}

export const EMPTY_STATS: Stats = {
  played: 0,
  completed: 0,
  perfect: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDay: null,
  totalMisses: 0,
}

const STATS_KEY = 'kimi:cairn:v1:stats'
const SEEN_KEY = 'kimi:cairn:v1:seen-help'
const SOUND_KEY = 'kimi:cairn:v1:sound'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function loadStats(): Stats {
  const raw = read<Partial<Stats>>(STATS_KEY)
  const stats = { ...EMPTY_STATS }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return stats
  for (const key of ['played', 'completed', 'perfect', 'currentStreak', 'maxStreak', 'totalMisses'] as const) {
    const value = raw[key]
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) stats[key] = value
  }
  if (typeof raw.lastCompletedDay === 'number' && Number.isSafeInteger(raw.lastCompletedDay)) stats.lastCompletedDay = raw.lastCompletedDay
  return stats
}

export function saveStats(stats: Stats) {
  write(STATS_KEY, stats)
}

export function hasSeenHelp(): boolean {
  return read<boolean>(SEEN_KEY) === true
}

export function markHelpSeen() {
  write(SEEN_KEY, true)
}

export function loadSoundOn(): boolean {
  const v = read<boolean>(SOUND_KEY)
  return v === null ? true : v
}

export function saveSoundOn(on: boolean) {
  write(SOUND_KEY, on)
}

/* ---------------- per-day progress ---------------- */

const dayKey = (day: number) => `kimi:cairn:v1:day:${day}`

export function loadDayProgress(day: number): DayProgress | null {
  const p = read<DayProgress>(dayKey(day))
  if (!p || typeof p !== 'object' || Array.isArray(p) || !Number.isInteger(p.level) || !Array.isArray(p.results)) return null
  return p
}

export function saveDayProgress(day: number, p: DayProgress) {
  write(dayKey(day), p)
}
