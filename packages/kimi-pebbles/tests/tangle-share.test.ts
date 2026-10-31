import test from 'node:test'
import assert from 'node:assert/strict'
import {buildTangleShareResult} from '../src/games/tangle/share-card.ts'
import {dayNumberForDate} from '../src/games/shared/integration.ts'
const input={mode:'daily' as 'daily'|'practice',puzzleNo:117,dayNumber:dayNumberForDate('2026-10-30'),score:9,maxScore:90,wordCount:5,totalWords:72,targets:[6,12,18] as [number,number,number],misses:0,hintsUsed:0}
test('Tangle snapshot distinguishes ongoing, gold and all-listed progress without ending the hunt',()=>{
 const progress=buildTangleShareResult(input);assert.equal(progress.headline,'Hunt in progress');assert.equal(progress.medal,'Bronze');assert.equal(progress.goldReached,false)
 const gold=buildTangleShareResult({...input,score:20,wordCount:9,hintsUsed:1,misses:2});assert.equal(gold.headline,'Gold reached');assert.equal(gold.goldReached,true);assert.equal(gold.assisted,true);assert.match(gold.caption,/Clue used/);assert.match(gold.caption,/2 misses/)
 const all=buildTangleShareResult({...input,score:90,wordCount:72});assert.equal(all.headline,'Every listed word found');assert.doesNotMatch(all.caption,/Perfect|shortest|unassisted/i)
})
test('Tangle snapshot freezes played identity and contains only aggregates, never grid/words/path/clue',()=>{
 const rich={...input,grid:'SECRET',found:['PRIVATE'],best:'SPOILER',hintPrefix:'XX',path:[0,1,2],url:'https://private.test'};const r=buildTangleShareResult(rich);assert.ok(Object.isFrozen(r));rich.score=44;assert.equal(r.score,9);assert.match(r.caption,/DAILY #117.*2026-10-30/)
 assert.doesNotMatch(JSON.stringify(r),/SECRET|PRIVATE|SPOILER|"grid"|"found"|"best"|"hintPrefix"|"path"|https?:/)
 const practice=buildTangleShareResult({...input,mode:'practice',puzzleNo:0,dayNumber:0});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026-10-30/)
})
test('Tangle snapshot rejects inconsistent score/counts, invalid targets and invalid daily identity',()=>{
 for(const field of ['score','maxScore','wordCount','totalWords','misses','hintsUsed'] as const)assert.throws(()=>buildTangleShareResult({...input,[field]:-1}))
 assert.throws(()=>buildTangleShareResult({...input,score:91}));assert.throws(()=>buildTangleShareResult({...input,wordCount:73}));assert.throws(()=>buildTangleShareResult({...input,wordCount:72}));assert.throws(()=>buildTangleShareResult({...input,targets:[6,18,12]}));assert.throws(()=>buildTangleShareResult({...input,puzzleNo:0}));assert.throws(()=>buildTangleShareResult({...input,dayNumber:NaN}))
})
