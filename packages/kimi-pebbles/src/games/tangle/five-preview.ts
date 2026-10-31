import type { TanglePuzzle } from './engine'
import data from './data/five-preview.json'
import { restoreTangleProgress, type TangleProgress } from './progress'

// One sample, not a published daily bank. Accepted words come from exhaustive
// full-dictionary solving, not a shortlist of familiar words.
// Medal goals remain provisional until James judges the larger board's feel.
export const TANGLE_FIVE_PREVIEW: TanglePuzzle = {
  ...data,
  best: 'straight',
  targets: [10,20,30],
}

export const FIVE_PREVIEW_KEY = 'kimi:tangle:5x5-preview:v1'
export function restoreFivePreview(value:unknown):TangleProgress|null {
  if(!value||typeof value!=='object'||Array.isArray(value)||(value as {grid?:unknown}).grid!==TANGLE_FIVE_PREVIEW.g)return null
  return restoreTangleProgress(value,TANGLE_FIVE_PREVIEW)
}
