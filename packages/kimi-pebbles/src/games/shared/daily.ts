/** Published rotations are independent of later practice-bank additions.
 * A future daily-bank expansion must introduce an explicitly dated release.
 */
export function publishedDailyIndex(day: number, availableCount: number, publishedCount: number): number {
  const count = Math.min(availableCount, publishedCount)
  if (!Number.isSafeInteger(day) || !Number.isSafeInteger(count) || count < 1) throw new RangeError('Invalid daily collection')
  return ((day % count) + count) % count
}
