import test from 'node:test'
import assert from 'node:assert/strict'
import type { LevelResult } from '../src/games/cairn/engine.ts'
import { buildCairnShareResult } from '../src/games/cairn/share-card.ts'
import { dayNumberForDate } from '../src/games/shared/integration.ts'

const clean=():LevelResult[]=>Array.from({length:5},()=>({status:'clean' as const,misses:0,hints:0,word:'PRIVATE'}))
const share=(results=clean(),extra={})=>buildCairnShareResult({mode:'daily',puzzleNo:11,dayNumber:dayNumberForDate('2026-10-30'),results,...extra})
test('Cairn share derives perfect, assisted summit and skipped outcomes from five real level results',()=>{
 assert.equal(share().headline,'Perfect summit')
 const assisted=clean();assisted[1]={status:'messy',misses:1,hints:1,word:'SECRET'}
 const summit=share(assisted);assert.equal(summit.headline,'Summit reached');assert.equal(summit.misses,1);assert.equal(summit.hints,1);assert.equal(summit.solved,5)
 const skipped=clean();skipped[2]={status:'skipped',misses:0,hints:0,word:'REVEALED'}
 const shown=share(skipped);assert.equal(shown.headline,'Stack finished');assert.equal(shown.solved,4);assert.equal(shown.skipped,1);assert.doesNotMatch(shown.caption,/Perfect|5 of 5 levels solved/)
})
test('Cairn share freezes played identity and aggregate counters without answers or per-level patterns',()=>{
 const input=clean();const r=share(input);input[0].word='NEWSECRET';input[0].misses=99
 assert.ok(Object.isFrozen(r));assert.equal(r.misses,0);assert.match(r.caption,/2026-10-30/);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|SECRET|REVEALED|word|results|slots|rack|https?:/i)
 const practice=share(clean(),{mode:'practice',puzzleNo:0,dayNumber:0});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026/)
})
test('Cairn share rejects unfinished levels and inconsistent or impossible clean counters',()=>{
 assert.throws(()=>share(clean().slice(0,4)));const bad=clean();bad[0].hints=1;assert.throws(()=>share(bad));bad[0].hints=-1;assert.throws(()=>share(bad));assert.throws(()=>share(clean(),{dayNumber:NaN}));assert.throws(()=>share(clean(),{puzzleNo:0}))
})

test('Cairn displayed streak expires after a missed day while preserving saved counters',async()=>{
 const {displayedStreak}=await import('../src/games/cairn/StatsModal.tsx')
 const stats={played:9,completed:8,perfect:2,currentStreak:4,maxStreak:7,lastCompletedDay:99,totalMisses:3}
 assert.equal(displayedStreak(stats,99),4);assert.equal(displayedStreak(stats,100),4);assert.equal(displayedStreak(stats,101),0);assert.equal(displayedStreak({...stats,lastCompletedDay:null},100),0);assert.equal(stats.currentStreak,4)
})
