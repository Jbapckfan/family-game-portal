import test from 'node:test'
import assert from 'node:assert/strict'
import {buildMorphShareResult} from '../src/games/morph/share-card.ts'
import {dayNumberForDate} from '../src/games/shared/integration.ts'
const input={mode:'daily' as 'daily'|'practice',puzzleNo:57,dayNumber:dayNumberForDate('2026-10-30'),moves:4,suggested:4,misses:0,hintsUsed:0,gaveUp:false}
test('Morph shares truthful suggested-pace, assisted and revealed outcomes',()=>{
 const win=buildMorphShareResult(input);assert.equal(win.headline,'Ladder complete');assert.equal(win.pace,'Gold · suggested pace met');assert.equal(win.assisted,false)
 const help=buildMorphShareResult({...input,moves:5,misses:2,hintsUsed:1});assert.equal(help.pace,'Silver · 1 over suggestion');assert.equal(help.assisted,true);assert.match(help.caption,/Assisted/);assert.match(help.caption,/2 misses/)
 const shown=buildMorphShareResult({...input,moves:2,gaveUp:true});assert.equal(shown.headline,'Route revealed');assert.doesNotMatch(shown.caption,/Gold|complete|shortest|Perfect/i);assert.match(shown.caption,/2 moves before reveal/)
})
test('Morph share is a frozen allowlist without endpoints, ladder words or per-step pattern',()=>{
 const rich={...input,start:'PRIVATE',target:'SECRET',rows:['SPOILERS'],edit:['X'],puzzle:{p:['ANSWERS']},url:'https://private.test'}
 const result=buildMorphShareResult(rich);assert.ok(Object.isFrozen(result));assert.match(result.caption,/DAILY #057.*2026-10-30/);assert.doesNotMatch(JSON.stringify(result),/PRIVATE|SECRET|SPOILERS|ANSWERS|"rows"|"puzzle"|"edit"|https?:|🥇/)
 const practice=buildMorphShareResult({...input,mode:'practice',puzzleNo:0,dayNumber:0});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/2026|DAILY/)
})
test('Morph share rejects invalid counters, uncompleted wins and invalid played identity',()=>{
 for(const field of ['moves','suggested','misses','hintsUsed'] as const){assert.throws(()=>buildMorphShareResult({...input,[field]:NaN}));assert.throws(()=>buildMorphShareResult({...input,[field]:-1}))}
 assert.throws(()=>buildMorphShareResult({...input,moves:0}));assert.throws(()=>buildMorphShareResult({...input,suggested:0}));assert.throws(()=>buildMorphShareResult({...input,puzzleNo:0}));assert.throws(()=>buildMorphShareResult({...input,dayNumber:NaN}));assert.throws(()=>buildMorphShareResult({...input,gaveUp:'yes' as unknown as boolean}))
})
