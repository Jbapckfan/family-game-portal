import { reviewTanglePuzzle, reviewTanglePuzzleForDay, TANGLE_REVIEWED_EXCLUSIONS } from './reviewed-words'
import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
import puzzlesData from './data/puzzles.json'
import { todayDayNumber } from '../shared/share'
import { medalTargets, restoreTangleProgress, tangleVocabulary, unsupportedTangleVocabulary, type TangleVocabulary } from './progress'
import { expandTanglePuzzle, TANGLE_LEXICON_START_DAY, TANGLE_LEXICON_V3_START_DAY } from './lexicon'

export interface TanglePuzzle {
  g: string // row-major: 16 letters for daily/practice, 25 for the optional preview
  n: number // total findable words
  max: number // total possible points
  best: string // a nice long word findable today
  words: string[] // all findable words
  targets: [number, number, number] // bronze, silver, gold thresholds
}

const PUZZLES = (puzzlesData as TanglePuzzle[]).map(puzzle => ({ ...puzzle, targets: medalTargets(puzzle.max) }))

export interface TangleRound { puzzle:TanglePuzzle; puzzleNo:number; vocabulary?:TangleVocabulary; unsupported?:boolean }

export function dailyTangle(dayNumber = todayDayNumber(), savedProgress?: unknown): TangleRound {
  const idx = publishedDailyIndex(dayNumber, PUZZLES.length, 430), original = PUZZLES[idx]
  const edition=(puzzle:TanglePuzzle,vocabulary:TangleVocabulary):TanglePuzzle => vocabulary===1? puzzle : expandTanglePuzzle(puzzle,vocabulary)
  const reviewed=reviewTanglePuzzleForDay(original,dayNumber)
  if(unsupportedTangleVocabulary(savedProgress))return {puzzle:edition(reviewed,dayNumber>=TANGLE_LEXICON_V3_START_DAY?3:dayNumber>=TANGLE_LEXICON_START_DAY?2:1),puzzleNo:idx+1,unsupported:true}
  const marker=tangleVocabulary(savedProgress)
  if(marker!==null && savedProgress!==undefined){
    // Before explicit markers, October31+ used the now-frozen v2 pool. The
    // old-client exception retains original excluded words and its exact max.
    const vocabulary=marker??(dayNumber>=TANGLE_LEXICON_START_DAY?2:1)
    const legacyBase=edition(original,vocabulary), legacy=restoreTangleProgress(savedProgress,legacyBase)
    if(legacy){
      const keepExcluded=legacy.found.some(word=>TANGLE_REVIEWED_EXCLUSIONS.includes(word))
      const puzzle=keepExcluded?legacyBase:edition(reviewed,vocabulary)
      if(restoreTangleProgress(savedProgress,puzzle))return {puzzle,puzzleNo:idx+1,...(marker===undefined?{}:{vocabulary:marker})}
    }
  }
  if(dayNumber>=TANGLE_LEXICON_V3_START_DAY)return {puzzle:expandTanglePuzzle(reviewed,3),puzzleNo:idx+1,vocabulary:3}
  return {puzzle:dayNumber>=TANGLE_LEXICON_START_DAY?expandTanglePuzzle(reviewed,2):reviewed,puzzleNo:idx+1}
}

export function practiceTangle(excludeIdx = -1): TangleRound {
  const idx = choosePracticeIndex('kimi-tangle', PUZZLES.length, excludeIdx)
  return { puzzle: expandTanglePuzzle(reviewTanglePuzzle(PUZZLES[idx]),3), puzzleNo: idx + 1, vocabulary:3 }
}

export { pointsFor } from './progress'

export type Tier = 0 | 1 | 2 | 3 // none, bronze, silver, gold

export function tierFor(score: number, targets: [number, number, number]): Tier {
  if (score >= targets[2]) return 3
  if (score >= targets[1]) return 2
  if (score >= targets[0]) return 1
  return 0
}

export const TIER_META: { icon: string; label: string; color: string }[] = [
  { icon: '⚪', label: 'No medal yet', color: 'hsl(30 8% 62%)' },
  { icon: '🥉', label: 'Bronze', color: 'hsl(24 60% 50%)' },
  { icon: '🥈', label: 'Silver', color: 'hsl(210 10% 60%)' },
  { icon: '🥇', label: 'Gold', color: 'hsl(45 95% 52%)' },
]

export function buildTangleShare(
  puzzleNo: number,
  score: number,
  max: number,
  found: number,
  total: number,
  tier: Tier,
): string {
  const t = TIER_META[tier]
  return `TANGLE No.${puzzleNo}\n${t.icon} ${t.label} · ${score}/${max} pts · ${found}/${total} words`
}

/** 8-way adjacency; existing callers retain the published 4x4 geometry. */
export function isAdjacent(a: number, b: number, size = 4): boolean {
  if (![4,5].includes(size) || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= size*size || b >= size*size) return false
  const ra = Math.floor(a / size), ca = a % size
  const rb = Math.floor(b / size), cb = b % size
  return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1 && a !== b
}
