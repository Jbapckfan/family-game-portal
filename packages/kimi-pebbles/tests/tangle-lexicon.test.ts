import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {loadTangleLexicon,buildTangleTrie,solveTangleGrid,assertTangleSourceHash} from '../../../scripts/tangle-lexicon.mjs'
import {createHash} from 'node:crypto'
import {expandTanglePuzzle,TANGLE_LEXICON_START_DAY} from '../src/games/tangle/lexicon.ts'
import {dailyTangle,practiceTangle} from '../src/games/tangle/engine.ts'
import {medalTargets,restoreTangleProgress} from '../src/games/tangle/progress.ts'
import {reviewTanglePuzzle,TANGLE_REVIEWED_EXCLUSIONS} from '../src/games/tangle/reviewed-words.ts'
import {TANGLE_FIVE_PREVIEW} from '../src/games/tangle/five-preview.ts'

const dir=new URL('../data/',import.meta.url)
const dictionary=[...new Set([
 ...readFileSync(new URL('english-words-alpha.txt',dir),'utf8').split(/\s+/),
 ...readFileSync(new URL('wordnik-game-words.txt',dir),'utf8').split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),
 ...gunzipSync(readFileSync(new URL('enable2k.txt.gz',dir))).toString().split(/\s+/),
 ...JSON.parse(readFileSync(new URL('zynga-disclosed-words.json',dir),'utf8')).words,
])].filter(w=>/^[a-z]+$/.test(w)).sort()
const raw=JSON.parse(readFileSync(new URL('../src/games/tangle/data/puzzles.json',import.meta.url),'utf8'))

test('word-source loading rejects substituted bytes and a missing or malformed expected checksum',()=>{
 const bytes=Buffer.from('example\n'),expected=createHash('sha256').update(bytes).digest('hex')
 assert.doesNotThrow(()=>assertTangleSourceHash(bytes,expected,'fixture'))
 assert.throws(()=>assertTangleSourceHash(Buffer.from('changed\n'),expected,'fixture'),/checksum/)
 assert.throws(()=>assertTangleSourceHash(bytes,undefined,'fixture'),/checksum/)
})

test('game lexicon includes every English, Wordnik, ENABLE and disclosed Zynga entry without a seven-letter cap',async()=>{
 const {words}=await loadTangleLexicon()
 assert.deepEqual([...words].sort(),dictionary)
 for(const w of ['stoned','tread','cores','pores','pore','tare','tares','selfie','texting','qi','za','qat','qoph','bff','bookclub','buzzworthy','straight','straighter'])assert.ok(words.has(w),w)
})

test('solver handles both board sizes, diagonal paths, no reuse, row edges, and all word-game inflections',()=>{
 const words=new Set(['stone','stoned','tread','cores','pores','pore','tare','tares','straight','ss','stor','sos','sto-ne'])
 const found=solveTangleGrid(TANGLE_FIVE_PREVIEW.g,buildTangleTrie(words))
 for(const w of ['stone','stoned','tread','cores','pores','pore','tare','tares','straight'])assert.ok(found.includes(w),w)
 assert.ok(!found.includes('ss')&&!found.includes('sto-ne'))
 assert.throws(()=>solveTangleGrid('abc',buildTangleTrie(words)))
 assert.deepEqual(solveTangleGrid('abcdefghijklmnop',buildTangleTrie(new Set(['abc','dhi','abe','aba']))),['abc','abe'])
})

test('expanded four-wide entry points keep daily grid/calendar and current Gold goals while widening acceptance',()=>{
 assert.equal(TANGLE_LEXICON_START_DAY,20757)
 let additions=0
 for(let day=TANGLE_LEXICON_START_DAY;day<TANGLE_LEXICON_START_DAY+430;day++){
  const index=day%430,original={...raw[index],targets:medalTargets(raw[index].max)},reviewed=reviewTanglePuzzle(original)
  const expected=expandTanglePuzzle(reviewed),actual=dailyTangle(day)
  assert.equal(actual.puzzleNo,index+1)
  assert.equal(actual.puzzle.g,original.g)
  assert.deepEqual(actual.puzzle,expected)
  assert.deepEqual(actual.puzzle.targets,reviewed.targets)
  assert.ok(actual.puzzle.words.length>=reviewed.words.length)
  additions+=actual.puzzle.words.length-reviewed.words.length
  for(const word of reviewed.words)assert.ok(actual.puzzle.words.includes(word),word)
  const saved={found:reviewed.words,misses:2,hintsUsed:0,countedPlayed:true}
  assert.deepEqual(restoreTangleProgress(saved,actual.puzzle),restoreTangleProgress(saved,reviewed))
 }
 assert.ok(additions>0)
 for(let i=0;i<20;i++){
  const p=practiceTangle(),base=reviewTanglePuzzle({...raw[p.puzzleNo-1],targets:medalTargets(raw[p.puzzleNo-1].max)})
  assert.deepEqual(p.puzzle,expandTanglePuzzle(base))
 }
})

test('every published grid has an expansion entry and generated extensions keep the closed exclusion policy',()=>{
 const entries=JSON.parse(readFileSync(new URL('../src/games/tangle/data/lexicon-expansions.json',import.meta.url),'utf8'))
 for(const p of raw){assert.ok(Object.hasOwn(entries,p.g),p.g);for(const word of entries[p.g])assert.ok(!TANGLE_REVIEWED_EXCLUSIONS.includes(word),word)}
})

test('historical editions and valid older-client words retain their earned scores and goals',()=>{
 let expandedLegacySaves=0
 for(let day=20746;day<TANGLE_LEXICON_START_DAY;day++){
  const p=dailyTangle(day).puzzle,original={...raw[day%430],targets:medalTargets(raw[day%430].max)}
  assert.deepEqual(p,day<20756?original:reviewTanglePuzzle(original))
 }
 for(let day=TANGLE_LEXICON_START_DAY;day<TANGLE_LEXICON_START_DAY+182;day++){
  const p={...raw[day%430],targets:medalTargets(raw[day%430].max)},removed=p.words.find((w:string)=>TANGLE_REVIEWED_EXCLUSIONS.includes(w))
  if(!removed)continue
  const save={found:[removed,...p.words.filter((w:string)=>w!==removed).slice(0,20)],misses:2,hintsUsed:0,countedPlayed:true}
  const extension=expandTanglePuzzle(p).words.find(w=>!p.words.includes(w))
  if(extension){save.found.push(extension);expandedLegacySaves++}
  const actual=dailyTangle(day,save).puzzle
  assert.deepEqual(restoreTangleProgress(save,actual),restoreTangleProgress(save,expandTanglePuzzle(p)))
  assert.ok(actual.words.length>=p.words.length)
  assert.deepEqual(actual.targets,p.targets)
 }
 assert.ok(expandedLegacySaves>0)
})
