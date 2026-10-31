import test from 'node:test'
import assert from 'node:assert/strict'
import { TANGLE_FIVE_PREVIEW, restoreFivePreview } from '../src/games/tangle/five-preview.ts'
import { isAdjacent } from '../src/games/tangle/engine.ts'
import { pointsFor } from '../src/games/tangle/progress.ts'
import { buildTangleShareResult } from '../src/games/tangle/share-card.ts'
import { readFileSync } from 'node:fs'
import { TANGLE_REVIEWED_EXCLUSIONS } from '../src/games/tangle/reviewed-words.ts'

function pathExists(word:string):boolean {
  const grid=TANGLE_FIVE_PREVIEW.g
  const search=(i:number,k:number,used:Set<number>):boolean => {
    if(grid[i]!==word[k])return false
    if(k===word.length-1)return true
    for(let j=0;j<25;j++)if(!used.has(j)&&i!==j&&Math.abs(Math.floor(i/5)-Math.floor(j/5))<=1&&Math.abs(i%5-j%5)<=1&&search(j,k+1,new Set([...used,j])))return true
    return false
  }
  return [...grid].some((_,i)=>search(i,0,new Set([i])))
}

test('sample restore validates board identity and recalculates actual found-word points without daily stats',()=>{
  const saved={grid:TANGLE_FIVE_PREVIEW.g,found:['area','core','light','lights','read','right','rights','stone','stoned','tread','cores','pores','pore','tare','tares'],misses:0,hintsUsed:0,countedPlayed:false,score:999}
  const restored=restoreFivePreview(saved)
  assert.equal(restored?.score,28)
  assert.equal(restored?.found.length,15)
  assert.equal(restored?.goldReached,false)
  assert.equal(restoreFivePreview({...saved,grid:'a'.repeat(25)}),null)
  assert.equal(restoreFivePreview({...saved,found:['not-a-word']}),null)
})

test('reported valid words and inflections are accepted, including STONED, TREAD, CORES, PORES, PORE, TARE and TARES',()=>{
  for(const word of ['stoned','tread','cores','pores','pore','tare','tares']){
    assert.ok(pathExists(word),`legal path: ${word}`)
    assert.ok(TANGLE_FIVE_PREVIEW.words.includes(word),`accepted word: ${word}`)
  }
})

test('the preview accepts every bundled-dictionary word with a legal path, under the existing closed exclusion policy',()=>{
  const dict=readFileSync(new URL('../data/english-words-alpha.txt',import.meta.url),'utf8').split(/\s+/)
  const excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS)
  const counts=(text:string)=>Object.fromEntries([...new Set(text)].map(c=>[c,[...text].filter(x=>x===c).length]))
  const available=counts(TANGLE_FIVE_PREVIEW.g)
  const possible=[...new Set(dict)].filter(w=>/^[a-z]{3,25}$/.test(w)&&!excluded.has(w)&&Object.entries(counts(w)).every(([c,n])=>n<=(available[c]??0)))
  const expected=possible.filter(pathExists).sort()
  assert.deepEqual([...TANGLE_FIVE_PREVIEW.words].sort(),expected)
})

test('five-wide adjacency handles diagonals and row boundaries while preserving four-wide defaults', () => {
  assert.equal(isAdjacent(3,4),false)
  assert.equal(isAdjacent(3,4,5),true)
  assert.equal(isAdjacent(4,5,5),false)
  assert.equal(isAdjacent(0,6,5),true)
  assert.equal(isAdjacent(18,24,5),true)
  for (const [a,b] of [[0,0],[-1,0],[24,25],[1.5,2],[0,24]]) assert.equal(isAdjacent(a,b,5),false)
})

test('every listed preview word has an independently enumerated nonreusing five-wide path and honest totals', () => {
  const p=TANGLE_FIVE_PREVIEW
  assert.match(p.g,/^[a-z]{25}$/)
  function path(word:string):boolean {
    const search=(i:number,k:number,used:Set<number>):boolean => {
      if(p.g[i]!==word[k])return false
      if(k===word.length-1)return true
      for(let j=0;j<25;j++)if(!used.has(j)&&i!==j&&Math.abs(Math.floor(i/5)-Math.floor(j/5))<=1&&Math.abs(i%5-j%5)<=1&&search(j,k+1,new Set([...used,j])))return true
      return false
    }
    return [...p.g].some((_,i)=>search(i,0,new Set([i])))
  }
  assert.equal(new Set(p.words).size,p.words.length)
  for(const word of p.words){assert.match(word,/^[a-z]{3,}$/);assert.ok(path(word),word)}
  assert.equal(p.n,p.words.length)
  assert.equal(p.max,p.words.reduce((n,w)=>n+pointsFor(w),0))
  assert.ok(p.words.includes('straight')&&p.words.includes('light'))
  assert.ok(p.targets[0]<p.targets[1]&&p.targets[1]<p.targets[2]&&p.targets[2]<=p.max)
  assert.ok(p.targets[2]>18)
})

test('five-wide sharing labels the sample and cannot impersonate a daily edition',()=>{
  const p=TANGLE_FIVE_PREVIEW,input={mode:'practice' as const,boardSize:5 as const,puzzleNo:1,dayNumber:0,score:1,maxScore:p.max,wordCount:1,totalWords:p.n,targets:p.targets,misses:0,hintsUsed:0}
  const r=buildTangleShareResult(input)
  assert.match(r.caption,/5×5 PREVIEW/)
  assert.doesNotMatch(r.caption,/DAILY|2026-|stonearead/)
  assert.equal(r.boardSize,5)
  assert.match(r.filename,/5x5-preview/)
  assert.throws(()=>buildTangleShareResult({...input,mode:'daily',dayNumber:20756}))
})
