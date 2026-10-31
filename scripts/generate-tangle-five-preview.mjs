/** Exhaustive board solver: full bundled dictionary, eight neighbors, no cell reuse. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {TANGLE_REVIEWED_EXCLUSIONS} from '../packages/kimi-pebbles/src/games/tangle/reviewed-words.ts';
import {pointsFor} from '../packages/kimi-pebbles/src/games/tangle/progress.ts';
const dictionaryURL=new URL('../packages/kimi-pebbles/data/english-words-alpha.txt',import.meta.url);
const outputURL=new URL('../packages/kimi-pebbles/src/games/tangle/data/five-preview.json',import.meta.url);
const dictionary=await readFile(dictionaryURL,'utf8'),excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS);
const grid='stoneareadlightpatescores',size=5,trie=new Map();
for(const word of new Set(dictionary.split(/\s+/))){
  if(!/^[a-z]{3,25}$/.test(word)||excluded.has(word))continue;
  let node=trie;
  for(const letter of word){if(!node.has(letter))node.set(letter,new Map());node=node.get(letter)}
  node.set('$',word);
}
const neighbors=[...grid].map((_,i)=>[...grid].map((_,j)=>j).filter(j=>i!==j&&Math.abs(i%size-j%size)<=1&&Math.abs(Math.floor(i/size)-Math.floor(j/size))<=1));
const found=new Set();
function visit(i,node,used){
  const next=node.get(grid[i]);if(!next)return;
  if(next.has('$'))found.add(next.get('$'));
  const occupied=used|(1<<i);
  for(const j of neighbors[i])if(!(occupied&(1<<j)))visit(j,next,occupied);
}
for(let i=0;i<grid.length;i++)visit(i,trie,0);
const words=[...found].sort(),puzzle={g:grid,words,n:words.length,max:words.reduce((sum,w)=>sum+pointsFor(w),0)};
await writeFile(outputURL,JSON.stringify(puzzle,null,2)+'\n');
console.log(JSON.stringify({file:fileURLToPath(outputURL),dictionaryWords:new Set(dictionary.trim().split(/\s+/)).size,dictionarySha256:createHash('sha256').update(dictionary).digest('hex'),words:puzzle.n,max:puzzle.max,exclusions:TANGLE_REVIEWED_EXCLUSIONS}));
