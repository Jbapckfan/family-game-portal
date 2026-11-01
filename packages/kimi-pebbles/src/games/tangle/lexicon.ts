import type {TanglePuzzle} from './engine'
import data from './data/lexicon-expansions.json'
import frozenV2 from './data/lexicon-expansions-v2.json'
import {pointsFor} from './progress'
import {TANGLE_REVIEWED_EXCLUSIONS} from './reviewed-words'

/** Keep earlier published editions intact; widen current/future acceptance. */
export const TANGLE_LEXICON_START_DAY=20757
export const TANGLE_LEXICON_V3_START_DAY=20758
const expansions=data as Record<string,string[]>
const expansionsV2=frozenV2 as Record<string,string[]>
const excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS)

export function expandTanglePuzzle(puzzle:TanglePuzzle,vocabulary:2|3=3):TanglePuzzle {
 if(vocabulary!==2&&vocabulary!==3)throw new RangeError('Unsupported Tangle dictionary edition')
 const extension=(vocabulary===2?expansionsV2:expansions)[puzzle.g]
 if(!extension)throw new RangeError('Tangle grid is missing its audited word-game lexicon')
 // Retain every word in a valid original/legacy edition, including old-client
 // exceptions. Expanding acceptance must never invalidate an earned score.
 const words=[...new Set([...puzzle.words,...extension.filter(word=>!excluded.has(word))])].sort()
 return {...puzzle,words,n:words.length,max:words.reduce((n,w)=>n+pointsFor(w),0),targets:[...puzzle.targets]}
}
