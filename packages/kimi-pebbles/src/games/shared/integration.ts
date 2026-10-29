/** Alford integration only. Original game authorship remains Kimi. */
export const KIMI_NAMES = Object.freeze({ cairn: 'Cairn', morph: 'Morph', tangle: 'Tangle', hunch: 'Hunch', circuit: 'Circuit', quartet: 'Quartet' })
export type KimiGame = keyof typeof KIMI_NAMES
export type ResultStatus = 'playing' | 'won' | 'lost' | 'revealed'
export interface UnifiedState {
  phase: string; mode: string; dayNumber: number
  finished?: boolean; gaveUp?: boolean; goldReached?: boolean; won?: boolean
  results?: { status: string }[]
}
export interface DailyRecord { status: Exclude<ResultStatus, 'playing'> }
export interface Statistics { played: number; won: number; streak: number; bestStreak: number }
export interface ProgressPayload {
  type: 'progress'; slug: string; name: string; mode: 'daily' | 'practice'
  dateKey: string; status: ResultStatus; stats: Statistics
}
declare global {
  interface Window {
    __ALFORD_NATIVE__?: { platform: string; version: number }
    webkit?: { messageHandlers?: { alford?: { postMessage: (value: unknown) => void } } }
  }
}
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' })
const memory = new Map<string, unknown>()
const dirtyKeys = new Set<string>()
let memoryPersistence = 0
/** Keep a round playable when reading storage is forbidden, even if writes work. */
export function withMemoryPersistence<T>(memoryOnly: boolean, write: () => T): T {
  if (memoryOnly) memoryPersistence++
  try { return write() } finally { if (memoryOnly) memoryPersistence-- }
}
/** An explicitly validated external snapshot supersedes this tab's fallback. */
export function acceptIntegrationValue(key: string, value: unknown): void {
  memory.set(key, value)
  dirtyKeys.delete(key)
}
export function centralDateKey(now = new Date()): string {
  const parts = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
export function dayNumberForDate(key: string): number { return Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000) }
export function centralDayNumber(now = new Date()): number { return dayNumberForDate(centralDateKey(now)) }
export function dateForDayNumber(day: number): string { return new Date(day * 86400000).toISOString().slice(0, 10) }
export function millisecondsToCentralMidnight(now = new Date()): number {
  const key = centralDateKey(now)
  let low = now.getTime(), high = low + 27 * 3600000
  // Calendar lookup handles both 23- and 25-hour days without device-timezone arithmetic.
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (centralDateKey(new Date(middle)) === key) low = middle
    else high = middle
  }
  return high - now.getTime()
}
export function isKimiGame(value: string): value is KimiGame { return Object.hasOwn(KIMI_NAMES, value) }
export function nativeMessage(payload: unknown): boolean {
  try {
    const handler = window.webkit?.messageHandlers?.alford
    if (!handler?.postMessage || window.__ALFORD_NATIVE__?.platform !== 'ios') return false
    handler.postMessage(payload)
    return true
  } catch { return false }
}
export function homeURL(): string {
  if (typeof window !== 'undefined' && window.__ALFORD_NATIVE__?.platform === 'ios') return 'alford://app/'
  return typeof document === 'undefined' ? '../daily/' : document.documentElement.dataset.home || '../daily/'
}
export function resultStatus(game: KimiGame, state: UnifiedState): ResultStatus {
  if (game === 'tangle') return state.goldReached === true ? 'won' : 'playing'
  const finished = state.phase === 'finished' || state.finished === true
  if (!finished) return 'playing'
  if (game === 'cairn') return state.results?.length === 5 && state.results.every(r => ['clean', 'messy'].includes(r.status)) ? 'won' : 'revealed'
  if (game === 'morph' || game === 'circuit') return state.gaveUp === false ? 'won' : 'revealed'
  return state.won === true ? 'won' : 'lost'
}
function validDate(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(dayNumberForDate(key)) && dateForDayNumber(dayNumberForDate(key)) === key
}
export function cleanRecords(input: unknown, today: string): Record<string, DailyRecord> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  const entries = Object.entries(input)
  if (entries.length > 4096) return {}
  return Object.fromEntries(entries.filter(([date, r]) => validDate(date) && date >= '2026-01-01' && date <= today
    && r && typeof r === 'object' && !Array.isArray(r) && ['won', 'lost', 'revealed'].includes((r as DailyRecord).status))
    .map(([date, r]) => [date, { status: (r as DailyRecord).status }]))
}
export function recordStatistics(input: unknown, today: string): Statistics {
  const records = cleanRecords(input, today)
  const dates = Object.keys(records).sort()
  let run = 0, bestStreak = 0, last = -Infinity, won = 0
  for (const date of dates) {
    const day = dayNumberForDate(date)
    if (records[date].status === 'won') { run = day === last + 1 ? run + 1 : 1; won++; bestStreak = Math.max(bestStreak, run) }
    else run = 0
    last = day
  }
  const todayNumber = dayNumberForDate(today)
  return { played: dates.length, won, streak: last >= todayNumber - 1 ? run : 0, bestStreak }
}
export function readIntegrationValue(key: string): unknown {
  if (dirtyKeys.has(key)) return memory.get(key) ?? null
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return memory.get(key) ?? null
    if (raw.length > 262144) return null
    return JSON.parse(raw)
  } catch { return memory.get(key) ?? null }
}
export function writeIntegrationValue(key: string, value: unknown): void {
  memory.set(key, value)
  try {
    if (memoryPersistence) throw new Error('Storage is unreadable')
    localStorage.setItem(key, JSON.stringify(value)); dirtyKeys.delete(key)
  }
  catch { dirtyKeys.add(key); if (typeof window !== 'undefined') window.dispatchEvent(new Event('alford:storage-unavailable')) }
}
export function makeProgress(game: KimiGame, state: UnifiedState, now = new Date()): ProgressPayload | null {
  if (!['playing', 'finished'].includes(state.phase) || !['daily', 'practice'].includes(state.mode)) return null
  const today = centralDateKey(now)
  const dateKey = state.mode === 'practice' ? today : Number.isSafeInteger(state.dayNumber) && state.dayNumber >= dayNumberForDate('2026-01-01') && state.dayNumber <= centralDayNumber(now) ? dateForDayNumber(state.dayNumber) : ''
  if (!validDate(dateKey) || dateKey < '2026-01-01' || dateKey > today) return null
  const slug = `kimi-${game}`
  const recordKey = `${slug}:v1:records`
  const records = cleanRecords(readIntegrationValue(recordKey), today)
  let status = resultStatus(game, state)
  if (state.mode === 'daily') {
    if (records[dateKey]) status = records[dateKey].status
    else if (status !== 'playing') { records[dateKey] = { status }; writeIntegrationValue(recordKey, records) }
    const snapshotKey = `${slug}:v1:status:${dateKey}`
    const old = readIntegrationValue(snapshotKey) as { status?: string } | null
    if (old?.status !== status) writeIntegrationValue(snapshotKey, { status })
  }
  return { type: 'progress', slug, name: KIMI_NAMES[game], mode: state.mode as 'daily' | 'practice', dateKey, status, stats: recordStatistics(records, today) }
}
