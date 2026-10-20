import test from 'node:test'
import assert from 'node:assert/strict'
import { centralDateKey, centralDayNumber, millisecondsToCentralMidnight, resultStatus, recordStatistics, makeProgress, readIntegrationValue, writeIntegrationValue } from '../src/games/shared/integration.ts'

test('Central daily keys advance once at midnight across both DST boundaries', () => {
  for (const [a, b] of [['2026-03-08T06:00:00Z', '2026-03-09T05:00:00Z'], ['2026-11-01T05:00:00Z', '2026-11-02T06:00:00Z']]) {
    assert.equal(centralDayNumber(new Date(b)) - centralDayNumber(new Date(a)), 1)
    assert.equal(millisecondsToCentralMidnight(new Date(a)), Date.parse(b) - Date.parse(a))
  }
  assert.equal(centralDateKey(new Date('2026-10-21T04:59:59Z')), '2026-10-20')
  assert.equal(centralDateKey(new Date('2026-10-21T05:00:00Z')), '2026-10-21')
})
test('reveals, losses and Tangle gold map to truthful daily outcomes', () => {
  const base = { phase: 'finished', mode: 'daily', dayNumber: 20746 }
  assert.equal(resultStatus('cairn', { ...base, results: Array(5).fill({ status: 'clean' }) }), 'won')
  assert.equal(resultStatus('cairn', { ...base, results: [{ status: 'skipped' }] }), 'revealed')
  assert.equal(resultStatus('morph', { ...base, gaveUp: true }), 'revealed')
  assert.equal(resultStatus('hunch', { ...base, won: false }), 'lost')
  assert.equal(resultStatus('quartet', { ...base, won: true }), 'won')
  assert.equal(resultStatus('tangle', { ...base, phase: 'playing', goldReached: true }), 'won')
})
test('only terminal wins extend streaks, and malformed records do not count', () => {
  const records = { '2026-10-17': { status: 'won' }, '2026-10-18': { status: 'won' }, '2026-10-19': { status: 'revealed' }, '2026-10-20': { status: 'won' }, '2026-10-21': { status: 'won' }, invalid: { status: 'won' }, '2026-10-16': { status: 'playing' } }
  assert.deepEqual(recordStatistics(records, '2026-10-20'), { played: 4, won: 3, streak: 1, bestStreak: 2 })
  assert.equal(recordStatistics({ '2026-10-18': { status: 'won' } }, '2026-10-20').streak, 0)
})
test('practice and loading never create a daily result; the first terminal result is final', () => {
  const now = new Date('2026-10-20T18:00:00Z')
  const state = { phase: 'finished', mode: 'practice', dayNumber: 0, won: true }
  assert.equal(makeProgress('hunch', { ...state, phase: 'loading' }, now), null)
  assert.equal(makeProgress('hunch', state, now)?.stats.played, 0)
  const daily = { ...state, mode: 'daily', dayNumber: centralDayNumber(now) }
  assert.equal(makeProgress('hunch', { ...daily, won: false }, now)?.status, 'lost')
  assert.equal(makeProgress('hunch', daily, now)?.status, 'lost')
  assert.equal(makeProgress('hunch', daily, now)?.stats.won, 0)
})

test('a failed storage write keeps newer in-memory progress and its first terminal result', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => '{}', setItem: () => { throw new Error('Quota exceeded') } } })
  try {
    writeIntegrationValue('quota-regression', { n: 2 })
    assert.deepEqual(readIntegrationValue('quota-regression'), { n: 2 })
    const now = new Date('2026-10-20T18:00:00Z')
    const state = { phase: 'finished', mode: 'daily', dayNumber: centralDayNumber(now), gaveUp: true }
    assert.equal(makeProgress('circuit', state, now)?.status, 'revealed')
    assert.equal(makeProgress('circuit', { ...state, gaveUp: false }, now)?.status, 'revealed')
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
