import { practiceCandidates } from '../../../../../games/deepseek-runtime/practice-calendar.mjs'
import { centralDateKey } from './integration'

export function availablePracticeIndices(slug: string, count: number, excludeIndex = -1, now = new Date()): number[] {
  return practiceCandidates(slug, centralDateKey(now), count, {excludeIndices:excludeIndex >= 0 ? [excludeIndex] : []})
}

export function choosePracticeIndex(slug: string, count: number, excludeIndex = -1): number {
  const available = availablePracticeIndices(slug, count, excludeIndex)
  if (!available.length) throw new RangeError('No practice puzzle is available')
  return available[Math.floor(Math.random() * available.length)]
}
