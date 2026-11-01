import type { TanglePuzzle } from './engine'
import data from './data/five-preview.json'
import frozenV2 from './data/five-preview-v2.json'
import { restoreTangleProgress, tangleVocabulary, unsupportedTangleVocabulary, type TangleProgress, type TangleVocabulary } from './progress'

// Current and published v2 samples use the same grid and unchanged provisional
// goals. Freeze the whole v2 pool so counts, maximum and sharing stay coherent.
const preview=(value:Pick<TanglePuzzle,'g'|'words'|'n'|'max'>):TanglePuzzle=>({...value,best:'straight',targets:[10,20,30]})
export const TANGLE_FIVE_PREVIEW=preview(data)
export const TANGLE_FIVE_PREVIEW_V2=preview(frozenV2)
export const FIVE_PREVIEW_KEY='kimi:tangle:5x5-preview:v1'

export function restoreFivePreview(value:unknown):TangleProgress|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null
 const vocabulary=tangleVocabulary(value)
 if(vocabulary===null||vocabulary===1)return null
 const puzzle=vocabulary===3?TANGLE_FIVE_PREVIEW:TANGLE_FIVE_PREVIEW_V2
 if((value as {grid?:unknown}).grid!==puzzle.g)return null
 return restoreTangleProgress(value,puzzle)
}

export function fivePreviewRound(value?:unknown):{puzzle:TanglePuzzle;progress:TangleProgress|null;vocabulary?:TangleVocabulary;unsupported?:boolean} {
 if(unsupportedTangleVocabulary(value)||tangleVocabulary(value)===1)return {puzzle:TANGLE_FIVE_PREVIEW,progress:null,unsupported:true}
 const progress=restoreFivePreview(value)
 if(!progress)return {puzzle:TANGLE_FIVE_PREVIEW,progress:null,vocabulary:3}
 return {puzzle:progress.vocabulary===3?TANGLE_FIVE_PREVIEW:TANGLE_FIVE_PREVIEW_V2,progress,
   ...(progress.vocabulary===undefined?{}:{vocabulary:progress.vocabulary})}
}
