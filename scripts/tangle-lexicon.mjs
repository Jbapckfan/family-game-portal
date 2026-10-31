/** Generation-time word sources and board solver. No dictionary download at play time. */
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {TANGLE_REVIEWED_EXCLUSIONS} from '../packages/kimi-pebbles/src/games/tangle/reviewed-words.ts';
const data=new URL('../packages/kimi-pebbles/data/',import.meta.url),excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS);

export function assertTangleSourceHash(bytes,expected,file){
 const actual=createHash('sha256').update(bytes).digest('hex');
 if(typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected)||actual!==expected)throw new Error(`Pinned word-source checksum mismatch: ${file}`);
 return actual;
}

export async function loadTangleLexicon(){
 const english=JSON.parse(await readFile(new URL('english-words-source.json',data),'utf8'));
 const games=JSON.parse(await readFile(new URL('word-game-sources.json',data),'utf8'));
 const pins={'english-words-alpha.txt':english.files['words_alpha.txt'].sha256,'wordnik-game-words.txt':games.find(s=>s.repository==='https://github.com/wordnik/wordlist').files['wordlist-20210729.txt'].sha256,'enable2k.txt.gz':games.find(s=>s.repository==='https://github.com/BartMassey/wordlists').files['enable2k.txt.gz'].sha256};
 const files=[['english-words-alpha.txt','plain'],['wordnik-game-words.txt','quoted'],['enable2k.txt.gz','gzip'],['zynga-disclosed-words.json','json']];
 const parts=await Promise.all(files.map(async([file,kind])=>{
  const bytes=await readFile(new URL(file,data));
  if(kind!=='json')assertTangleSourceHash(bytes,pins[file],file);
  const text=kind==='gzip'?gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');
  const entries=kind==='quoted'?text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)):kind==='json'?JSON.parse(text).words:text.split(/\s+/);
  const records=[...new Set(entries)].filter(w=>w!=='');
  const words=records.filter(w=>typeof w==='string'&&/^[a-z]+$/.test(w));
  return {words,source:{file,words:words.length,droppedShape:records.length-words.length,sha256:createHash('sha256').update(bytes).digest('hex'),pinVerified:kind!=='json'}};
 }));
 return {words:new Set(parts.flatMap(p=>p.words)),sources:parts.map(p=>p.source)};
}

export function buildTangleTrie(words){
 const root=new Map();
 for(const word of words){
  if(!/^[a-z]{3,25}$/.test(word)||excluded.has(word))continue;
  let node=root;
  for(const c of word){if(!node.has(c))node.set(c,new Map());node=node.get(c)}
  node.set('$',word);
 }
 return root;
}

export function solveTangleGrid(grid,trie){
 if(typeof grid!=='string'||!/^([a-z]{16}|[a-z]{25})$/.test(grid))throw new TypeError('A four- or five-wide lowercase grid is required');
 const size=Math.sqrt(grid.length),indices=[...grid].map((_,i)=>i);
 const neighbors=indices.map(i=>indices.filter(j=>i!==j&&Math.abs(i%size-j%size)<=1&&Math.abs(Math.floor(i/size)-Math.floor(j/size))<=1)),found=new Set();
 function visit(i,node,used){
  const next=node.get(grid[i]);if(!next)return;
  if(next.has('$'))found.add(next.get('$'));
  const occupied=used|(1<<i);
  for(const j of neighbors[i])if(!(occupied&(1<<j)))visit(j,next,occupied);
 }
 for(const i of indices)visit(i,trie,0);
 return [...found].sort();
}
