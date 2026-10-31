import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {medalTargets, pointsFor, restoreTangleProgress} from '../src/games/tangle/progress.ts'
import type {TanglePuzzle} from '../src/games/tangle/engine.ts'
import {dailyTangle, practiceTangle} from '../src/games/tangle/engine.ts'
import {reviewTanglePuzzle, reviewTanglePuzzleForDay, TANGLE_REVIEWED_EXCLUSIONS} from '../src/games/tangle/reviewed-words.ts'
import {expandTanglePuzzle,TANGLE_LEXICON_START_DAY} from '../src/games/tangle/lexicon.ts'

const raw = JSON.parse(fs.readFileSync(new URL('../src/games/tangle/data/puzzles.json',import.meta.url),'utf8')) as TanglePuzzle[]
const puzzles=raw.map(p=>({...p,targets:medalTargets(p.max)}))
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const before=hash(raw)
function findPath(grid:string,word:string):number[]|null{
  function search(index:number,at:number,used:number,path:number[]):number[]|null{
    if(at===word.length)return path
    for(let next=0;next<16;next++){
      if(used&(1<<next)||grid[next]!==word[at])continue
      if(index>=0&&(Math.abs(Math.floor(index/4)-Math.floor(next/4))>1||Math.abs(index%4-next%4)>1))continue
      const result=search(next,at+1,used|(1<<next),[...path,next])
      if(result)return result
    }
    return null
  }
  return search(-1,0,0,[])
}

test('review starts October 30 and preserves every historical puzzle and actual threshold',()=>{
  for(const p of puzzles){
    assert.equal(reviewTanglePuzzleForDay(p,20755),p)
    assert.equal(reviewTanglePuzzleForDay(p,20089),p)
  }
  assert.deepEqual(reviewTanglePuzzleForDay(puzzles[0],20755).targets,[6,12,17])
})
test('new practice and future daily puzzles remove exactly the twelve reviewed spellings',()=>{
  assert.deepEqual([...TANGLE_REVIEWED_EXCLUSIONS].sort(),['ccm','ccw','ccws','cfm','coon','fag','fags','mahmoud','nig','whf','wilhelm','wog'].sort())
  for(const p of puzzles){
    const reviewed=reviewTanglePuzzle(p)
    assert.deepEqual(reviewTanglePuzzleForDay(p,20756),reviewed)
    assert.deepEqual(reviewed.words,p.words.filter(w=>!TANGLE_REVIEWED_EXCLUSIONS.includes(w)))
    assert.equal(reviewed.g,p.g)
    assert.equal(reviewed.n,reviewed.words.length)
    assert.equal(reviewed.max,reviewed.words.reduce((sum,w)=>sum+pointsFor(w),0))
    assert.ok(reviewed.words.includes(reviewed.best))
    assert.deepEqual(reviewed.targets,medalTargets(reviewed.max))
    assert.deepEqual(reviewTanglePuzzle(reviewed),reviewed)
  }
  assert.equal(reviewTanglePuzzle(puzzles[0]).words.includes('ccm'),false)
  assert.equal(reviewTanglePuzzle(puzzles[0]).words.includes('icica'),true)
  assert.equal(reviewTanglePuzzle(puzzles[4]).words.includes('wilhelm'),false)
  assert.equal(reviewTanglePuzzle(puzzles[4]).best,'pilule')
  assert.equal(reviewTanglePuzzle(puzzles[0]).max,82)
  assert.deepEqual(reviewTanglePuzzle(puzzles[0]).targets,[6,11,16])
})
test('every reviewed practice word has a legal path and all boards can still reach actual gold',()=>{
  let checked=0
  for(const p of puzzles.map(reviewTanglePuzzle)){
    for(const word of p.words){assert.ok(findPath(p.g,word),`${p.g} ${word}`);checked++}
    const restored=restoreTangleProgress({found:p.words,misses:0,hintsUsed:0,countedPlayed:true},p)
    assert.ok(restored)
    assert.equal(restored.score,p.max)
    assert.equal(restored.goldReached,true)
  }
  console.log(`Reviewed Tangle: ${puzzles.length} practice boards; ${checked} legal word paths`)
})
test('all 182 dated selections reach gold and restore with reviewed future words and actual targets',()=>{
  let days=0,paths=0
  for(let day=20755;day<20937;day++){
    const index=((day%430)+430)%430
    const p=reviewTanglePuzzleForDay(puzzles[index],day)
    const found:string[]=[]
    for(const word of p.words){
      assert.ok(findPath(p.g,word),`${day}: ${word}`);paths++
      found.push(word)
      const saved=restoreTangleProgress({found:[...found],misses:0,hintsUsed:0,countedPlayed:true},p)
      assert.ok(saved)
      assert.equal(saved.score,found.reduce((sum,w)=>sum+pointsFor(w),0))
    }
    const complete=restoreTangleProgress({found,misses:0,hintsUsed:0,countedPlayed:true},p)
    assert.equal(complete?.goldReached,true,`${day}`)
    days++
  }
  assert.equal(days,182)
  console.log(`Reviewed Tangle dated coverage: ${days} days; ${paths} legal word paths`)
})
test('historical saves containing reviewed-out words retain their score and gold state',()=>{
  const p=reviewTanglePuzzleForDay(puzzles[0],20755)
  const found=['ccm']
  for(const word of p.words.filter(w=>w!=='ccm')){
    if(found.reduce((sum,w)=>sum+pointsFor(w),0)>=17)break
    found.push(word)
  }
  const saved={found,misses:2,hintsUsed:0,countedPlayed:true}
  const original=restoreTangleProgress(saved,puzzles[0])
  assert.ok(original?.goldReached)
  assert.deepEqual(restoreTangleProgress(saved,p),original)
  assert.equal(restoreTangleProgress(saved,reviewTanglePuzzle(p)),null)
})
test('review does not mutate original records or change daily board identity',()=>{
  assert.equal(hash(raw),before)
  for(let i=0;i<raw.length;i++){
    assert.deepEqual(puzzles[i].words,raw[i].words)
    assert.equal(puzzles[i].n,raw[i].n)
    assert.equal(puzzles[i].max,raw[i].max)
    assert.equal(puzzles[i].best,raw[i].best)
  }
})

test('real daily and practice entry points apply the dated review without changing selected indices',()=>{
  for(let day=20746;day<20937;day++){
    const {puzzle,puzzleNo}=dailyTangle(day),index=day%430
    assert.equal(puzzleNo,index+1)
    const reviewed=reviewTanglePuzzleForDay(puzzles[index],day)
    assert.deepEqual(puzzle,day>=TANGLE_LEXICON_START_DAY?expandTanglePuzzle(reviewed):reviewed)
  }
  for(let i=0;i<100;i++){
    const {puzzle,puzzleNo}=practiceTangle()
    assert.deepEqual(puzzle,expandTanglePuzzle(reviewTanglePuzzle(puzzles[puzzleNo-1])))
  }
})


test('valid older-client daily saves retain their vocabulary edition and score',()=>{
 for(let day=20756;day<20937;day++){
  const index=day%430,p=puzzles[index],removed=p.words.find(word=>TANGLE_REVIEWED_EXCLUSIONS.includes(word))
  if(!removed)continue
  const saved={found:[removed,...p.words.filter(word=>word!==removed).slice(0,20)],misses:2,hintsUsed:0,countedPlayed:true}
  const actual=dailyTangle(day,saved)
  assert.equal(actual.puzzleNo,index+1);assert.deepEqual(actual.puzzle,day>=TANGLE_LEXICON_START_DAY?expandTanglePuzzle(p):p)
  assert.deepEqual(restoreTangleProgress(saved,actual.puzzle),restoreTangleProgress(saved,p))
  const reviewed=reviewTanglePuzzle(p),expected=day>=TANGLE_LEXICON_START_DAY?expandTanglePuzzle(reviewed):reviewed
  assert.deepEqual(dailyTangle(day).puzzle,expected)
  assert.deepEqual(dailyTangle(day,{...saved,found:[removed,'invalidzzzz']}).puzzle,expected)
 }
})
