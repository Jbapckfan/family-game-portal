import { useEffect, useRef } from 'react'
import { acceptIntegrationValue, withMemoryPersistence, type KimiGame } from './integration'

type State = { mode: string; dayNumber: number; phase: string }
type Snapshot = { day: string | null; stats: string | null }

/** Per mounted game: compare actual storage at the input and write boundaries.
 * Storage events are an early notification, not a prerequisite for correctness.
 * A changed, valid round wins; the triggering stale input is discarded.
 */
export class DailySession {
  private dayNumber = 0
  private acknowledged: Snapshot | null = null
  private readable = true
  private pendingAdoptionFrom: State | null = null
  private game: KimiGame
  private actionDepth = 0
  private readonly interrupted = Symbol('daily session changed')
  private guarded = new WeakMap<(...args: never[]) => unknown, (...args: never[]) => unknown>()
  private current: () => State = () => ({ mode: 'practice', dayNumber: 0, phase: 'loading' })
  private validate: (raw: unknown) => unknown = () => null
  private reload: () => void = () => undefined

  constructor(game: KimiGame) { this.game = game }
  private get dayKey() { return `kimi:${this.game}:v1:day:${this.dayNumber}` }
  private get statsKey() { return `kimi:${this.game}:v1:stats` }
  configure(current: () => State, validate: (raw: unknown) => unknown, reload: () => void) {
    this.current = current
    this.validate = validate
    this.reload = reload
    // reload queues React state; acknowledging storage is not a render. Keep
    // inputs/effects blocked until this hook observes the replacement state.
    if (this.pendingAdoptionFrom && current() !== this.pendingAdoptionFrom) this.pendingAdoptionFrom = null
  }
  private read(): Snapshot | null {
    try {
      const snapshot = { day: localStorage.getItem(this.dayKey), stats: localStorage.getItem(this.statsKey) }
      this.readable = true
      return snapshot
    } catch {
      this.readable = false
      return null
    }
  }
  acknowledge(day: number) {
    if (day !== this.dayNumber) this.acknowledged = null
    this.dayNumber = day
    const snapshot = this.read()
    if (snapshot) this.acknowledged = snapshot
  }
  before(): boolean {
    if (this.pendingAdoptionFrom) return false
    const state = this.current()
    if (state.mode !== 'daily' || state.phase === 'loading' || !state.dayNumber) return true
    const snapshot = this.read()
    if (!snapshot) return true // Play in memory; commit must not write unreadable storage.
    if (snapshot.day === this.acknowledged?.day && snapshot.stats === this.acknowledged?.stats) return true
    let raw: unknown = null
    try { if (snapshot.day && snapshot.day.length <= 262144) raw = JSON.parse(snapshot.day) } catch { /* invalid external save */ }
    if (!this.validate(raw)) return true
    acceptIntegrationValue(this.dayKey, raw)
    try { acceptIntegrationValue(this.statsKey, snapshot.stats ? JSON.parse(snapshot.stats) : null) } catch { /* stats loader sanitizes */ }
    this.acknowledged = snapshot
    this.pendingAdoptionFrom = state
    this.reload()
    return false
  }
  commit(write: () => void): boolean {
    if (!this.before()) {
      if (this.actionDepth) throw this.interrupted
      return false
    }
    // A finished round has no further gameplay writes. Tangle deliberately has
    // no `finished` flag: finding extra words after gold remains supported.
    try {
      const saved = this.acknowledged?.day ? this.validate(JSON.parse(this.acknowledged.day)) as { finished?: boolean } | null : null
      if (saved?.finished === true) {
        if (this.actionDepth) throw this.interrupted
        return false
      }
    } catch (error) { if (error === this.interrupted) throw error /* corrupt storage may be replaced */ }
    withMemoryPersistence(!this.readable, write)
    const snapshot = this.read()
    if (snapshot) this.acknowledged = snapshot
    return true
  }
  actions<T extends Record<string, (...args: never[]) => unknown>>(actions: T): T {
    return Object.fromEntries(Object.entries(actions).map(([name, action]) => {
      let wrapped = this.guarded.get(action)
      if (!wrapped) {
        wrapped = (...args: never[]) => {
          if (!this.before()) return
          this.actionDepth++
          try { return action(...args) }
          catch (error) { if (error !== this.interrupted) throw error }
          finally { this.actionDepth-- }
        }
        this.guarded.set(action, wrapped)
      }
      return [name, wrapped]
    })) as T
  }

  storageChanged(event: StorageEvent) {
    if (event.key === null || event.key === this.dayKey || event.key === this.statsKey) this.before()
  }
}

export function useDailySession(game: KimiGame): DailySession {
  const session = useRef<DailySession | null>(null)
  session.current ??= new DailySession(game)
  const daily = session.current
  useEffect(() => {
    const onStorage = (event: StorageEvent) => daily.storageChanged(event)
    const onFocus = () => daily.before()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [daily])
  return daily
}
