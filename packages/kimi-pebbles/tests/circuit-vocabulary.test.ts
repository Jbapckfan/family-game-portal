import {independentlyReadModernWords} from '../../../scripts/independent-modern-lexicon.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {dailyCircuit,withReviewedWords} from '../src/games/circuit/engine.ts'
import {restoreCircuitProgress} from '../src/games/circuit/progress.ts'
import {dayNumberForDate} from '../src/games/shared/integration.ts'
const raw=JSON.parse(readFileSync(new URL('../src/games/circuit/data/puzzles.json',import.meta.url),'utf8'))
const legal=(word:string,letters:string)=>word.length>=3&&[...word].every((c,i)=>letters.includes(c)&&(!i||Math.floor(letters.indexOf(word[i-1])/3)!==Math.floor(letters.indexOf(c)/3)))

test('MORN and NICE are accepted on the reported daily and every eligible ring',()=>{
 const p=dailyCircuit(dayNumberForDate('2026-11-01')).puzzle
 for(const word of ['morn','nice']){assert.ok(legal(word,p.l));assert.ok(p.words.includes(word),`${word} is missing on November 1`);for(const board of raw)if(legal(word,board.l))assert.ok(withReviewedWords(board).words.includes(word),`${word}: ${board.l}`)}
})
test('Circuit preserves original words, layouts, routes and targets through vocabulary expansion',()=>{
 for(const board of raw){const p=withReviewedWords(board);assert.equal(p.l,board.l);assert.equal(p.par,board.par);assert.deepEqual(p.sol,board.sol);assert.equal(p.n,p.words.length);assert.equal(new Set(p.words).size,p.n);for(const word of board.words)assert.ok(p.words.includes(word));for(const word of p.words)assert.ok(legal(word,p.l),word)}
})
test('accepted reported words and an existing unfinished draft survive restore without changing assistance',()=>{
 const p=dailyCircuit(dayNumberForDate('2026-11-01')).puzzle,current=[...'nice'].map(c=>p.l.indexOf(c)),value={played:['morn'],current,revealed:1,hintsUsed:1,finished:false,gaveUp:false,countedPlayed:true};assert.deepEqual(restoreCircuitProgress(value,p),value)
 const chain={...value,played:['morn','nice'],current:[p.l.indexOf('e')]};assert.deepEqual(restoreCircuitProgress(chain,p),chain)
})
test('every source-eligible Circuit word is present, using an independent regex arc oracle',()=>{
 const d=new URL('../data/',import.meta.url),source=new Set<string>([...readFileSync(new URL('english-words-alpha.txt',d),'utf8').split(/\s+/),...readFileSync(new URL('wordnik-game-words.txt',d),'utf8').split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),...gunzipSync(readFileSync(new URL('enable2k.txt.gz',d))).toString().split(/\s+/),...JSON.parse(readFileSync(new URL('zynga-disclosed-words.json',d),'utf8')).words,...independentlyReadModernWords(d)].filter(w=>/^[a-z]{3,}$/.test(w)))
 const words=[...source]
 for(const board of raw){const allowed=new RegExp(`^[${board.l}]{3,}$`),sameArc=new RegExp([0,3,6,9].map(i=>`[${board.l.slice(i,i+3)}]{2}`).join('|')),actual=new Set<string>(withReviewedWords(board).words);for(const word of words)if(allowed.test(word)&&!sameArc.test(word))assert.ok(actual.has(word),`source word missing: ${word} on ${board.l}`);for(const word of actual)assert.ok(source.has(word)||board.words.includes(word)||word==='plum',`unproven addition: ${word}`)}
})
