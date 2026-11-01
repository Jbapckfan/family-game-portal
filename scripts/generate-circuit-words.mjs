/** Add every pinned source word that obeys a published Circuit ring's arc rule. */
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {loadTangleLexicon} from './tangle-lexicon.mjs'
const data=new URL('../packages/kimi-pebbles/src/games/circuit/data/',import.meta.url)
const boards=JSON.parse(await readFile(new URL('puzzles.json',data),'utf8'))
const lexicon=await loadTangleLexicon()
const mask=word=>{let bits=0;for(const ch of word)bits|=1<<(ch.charCodeAt(0)-97);return bits}
const entries=[...lexicon.words].filter(word=>/^[a-z]{3,}$/.test(word)).map(word=>({word,bits:mask(word)}))
const additions={},perBoard=[];let total=0,maxLength=0
for(const board of boards){
 assert.match(board.l,/^[a-z]{12}$/);assert.equal(new Set(board.l).size,12)
 const bits=mask(board.l),arcs=new Int8Array(26).fill(-1),old=new Set(board.words)
 for(let i=0;i<12;i++)arcs[board.l.charCodeAt(i)-97]=Math.floor(i/3)
 const next=[]
 for(const item of entries){
  if((item.bits&~bits)!==0||old.has(item.word))continue
  let previous=-1,valid=true
  for(const ch of item.word){const arc=arcs[ch.charCodeAt(0)-97];if(arc===previous){valid=false;break}previous=arc}
  if(valid){next.push(item.word);maxLength=Math.max(maxLength,item.word.length)}
 }
 next.sort();additions[board.l]=next;total+=next.length
 perBoard.push({letters:board.l,originalWords:old.size,added:next.length,total:old.size+next.length,target:board.par})
}
const pool=[...new Set(Object.values(additions).flat())].sort()
const content=JSON.stringify(pool)+'\n',file=new URL('word-additions.json',data)
if(process.argv.includes('--check'))assert.equal(await readFile(file,'utf8'),content,'Circuit vocabulary needs regeneration')
else await writeFile(file,content)
console.log(JSON.stringify({boards:boards.length,sourceWords:lexicon.words.size,additions:total,uniqueAdditionalWords:pool.length,maximumAddedWordLength:maxLength,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex'),sources:lexicon.sources,perBoard}))
