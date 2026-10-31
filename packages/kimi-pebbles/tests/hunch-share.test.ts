import test from 'node:test'
import assert from 'node:assert/strict'
import {buildHunchShareResult} from '../src/games/hunch/share-card.ts'
import {isValidWord,loadDict} from '../src/games/hunch/dictionary.ts'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {restoreHunchProgress} from '../src/games/hunch/progress.ts'
import {evaluate} from '../src/games/hunch/engine.ts'
import {dayNumberForDate} from '../src/games/shared/integration.ts'
const green=['correct','correct','correct','correct','correct'] as const
const input={mode:'daily' as 'daily'|'practice',puzzleNo:143,dayNumber:dayNumberForDate('2026-10-30'),evals:[['absent','present','absent','absent','correct'],[...green]] as any,won:true,hintsUsed:0}
test('Hunch share records played Daily/Practice and assisted win/loss without letters or answer',()=>{
 const rich={...input,answer:'PRIVATE',guesses:['SPOIL'],hintLetters:['Z'],url:'https://private.test'},result=buildHunchShareResult(rich)
 assert.match(result.caption,/2026-10-30/);assert.match(result.caption,/2\/6/);assert.match(result.caption,/No clue used/)
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE|SPOIL|https?:|"answer"|"guesses"|"hintLetters"/)
 const practice=buildHunchShareResult({...input,mode:'practice',hintsUsed:1});assert.match(practice.caption,/PRACTICE/);assert.match(practice.caption,/Clue used/);assert.doesNotMatch(practice.caption,/DAILY|2026-10-30/)
 const loss=buildHunchShareResult({...input,won:false,evals:Array.from({length:6},()=>['absent','absent','present','absent','absent']) as any});assert.equal(loss.score,'X/6');assert.match(loss.caption,/Not solved/)
})
test('Hunch snapshot deeply freezes status rows and rejects inconsistent finished-game data',()=>{
 const copy=structuredClone(input),r=buildHunchShareResult(copy);copy.evals[0][0]='correct';assert.equal(r.rows[0][0],'absent');assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rows)&&Object.isFrozen(r.rows[0]))
 for(const bad of [{...input,evals:[]},{...input,won:false},{...input,evals:[green,['absent','absent','absent','absent','absent']]},{...input,hintsUsed:-1},{...input,puzzleNo:0},{...input,evals:[['wat']]}])assert.throws(()=>buildHunchShareResult(bad as any))
})
test('Hunch accepts the complete pinned five-letter guess list and retains its published answer bank',async()=>{
 await loadDict();const words=JSON.parse(readFileSync(new URL('../src/games/hunch/data/guesses.json',import.meta.url),'utf8'));const answers=JSON.parse(readFileSync(new URL('../src/games/hunch/data/answers.json',import.meta.url),'utf8'))
 const data=new URL('../data/',import.meta.url),all=[...new Set([...readFileSync(new URL('english-words-alpha.txt',data),'utf8').split(/\s+/),...readFileSync(new URL('wordnik-game-words.txt',data),'utf8').split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),...gunzipSync(readFileSync(new URL('enable2k.txt.gz',data))).toString().split(/\s+/),...JSON.parse(readFileSync(new URL('zynga-disclosed-words.json',data),'utf8')).words])].filter(w=>/^[a-z]{5}$/.test(w)).sort()
 assert.deepEqual(words,all)
 const older=readFileSync(new URL('../src/games/cairn/data/dict.txt',import.meta.url),'utf8').split(/\s+/).filter(w=>/^[a-z]{5}$/.test(w))
 for(const word of older)assert.ok(isValidWord(word),`older saved guess: ${word}`)
 for(const word of [...words,...answers])assert.ok(isValidWord(word),word)
 for(const word of ['qi','stoned','abcde!','AAAAA','a'.repeat(6),''])assert.equal(isValidWord(word),false)
})
test('historical repeated valid guesses remain restorable',async()=>{
 await loadDict();const raw={guesses:['crane','crane'],hintLetters:[],hintsUsed:0,countedPlayed:true}
 const r=restoreHunchProgress(raw,'apple',evaluate,isValidWord);assert.equal(r?.guesses.length,2);assert.equal(r?.finished,false)
})
