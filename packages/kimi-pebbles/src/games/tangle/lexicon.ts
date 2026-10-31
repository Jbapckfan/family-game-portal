import type {TanglePuzzle} from './engine'
import data from './data/lexicon-expansions.json'
import {pointsFor} from './progress'
import {TANGLE_REVIEWED_EXCLUSIONS} from './reviewed-words'

/** Keep earlier published editions intact; widen current/future acceptance. */
export const TANGLE_LEXICON_START_DAY=20757
const expansions=data as Record<string,string[]>
const excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS)

export function expandTanglePuzzle(puzzle:TanglePuzzle):TanglePuzzle {
 const extension=expansions[puzzle.g]
 if(!extension)throw new RangeError('Tangle grid is missing its audited word-game lexicon')
 // Retain every word in a valid original/legacy edition, including old-client
 // exceptions. Expanding acceptance must never invalidate an earned score.
 const words=[...new Set([...puzzle.words,...extension.filter(word=>!excluded.has(word))])].sort()
 return {...puzzle,words,n:words.length,max:words.reduce((n,w)=>n+pointsFor(w),0),targets:[...puzzle.targets]}
}
