import { readIntegrationValue, writeIntegrationValue } from './integration'
/* Lightweight per-game stats + daily progress storage (localStorage). */

export interface GameStats {
  played: number
  completed: number
  currentStreak: number
  maxStreak: number
  lastCompletedDay: number | null
}

export const EMPTY_GAME_STATS: GameStats = {
  played: 0,
  completed: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDay: null,
}

function read<T>(key: string): T | null { return readIntegrationValue(key) as T | null }
function write(key: string, value: unknown) { writeIntegrationValue(key, value) }
const safeCount = (n: unknown): number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= 1000000 ? n : 0

export function loadGameStats(game: string): GameStats {
  const raw = read<Partial<GameStats>>(`kimi:${game}:v1:stats`)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...EMPTY_GAME_STATS }
  const played = safeCount(raw.played), completed = Math.min(played, safeCount(raw.completed))
  return { played, completed, currentStreak: Math.min(completed, safeCount(raw.currentStreak)), maxStreak: Math.min(completed, safeCount(raw.maxStreak)), lastCompletedDay: Number.isSafeInteger(raw.lastCompletedDay) ? raw.lastCompletedDay! : null }

}

export function saveGameStats(game: string, s: GameStats) {
  write(`kimi:${game}:v1:stats`, s)
}

export function loadDayProgress<T>(game: string, day: number): T | null {
  return read<T>(`kimi:${game}:v1:day:${day}`)
}

export function saveDayProgress(game: string, day: number, p: unknown) {
  write(`kimi:${game}:v1:day:${day}`, p)
}

export function loadSoundOn(): boolean {
  const v = read<boolean>('kimi:settings:v1:sound')
  return v === true
}

export function saveSoundOn(on: boolean) {
  write('kimi:settings:v1:sound', on)
}
