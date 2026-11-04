import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {PREVIEW} from '../games/deepseek-trail/engine.mjs';
const root=path.resolve(import.meta.dirname,'..');
const files=['packages/kimi-pebbles/data/english-words-alpha.txt','packages/kimi-pebbles/data/wordnik-game-words.txt','packages/kimi-pebbles/data/enable2k.txt.gz'];
const words=new Set(),sources=[];
for(const file of files){
 const raw=await readFile(path.join(root,file)),text=(file.endsWith('.gz')?gunzipSync(raw):raw).toString();
 const entries=new Set(text.split(/\r?\n/).map(s=>s.trim().replace(/^"|"$/g,'').toUpperCase()).filter(w=>/^[A-Z]{9}$/.test(w)));
 entries.forEach(w=>words.add(w));
 sources.push({path:file,sha256:createHash('sha256').update(raw).digest('hex'),nineLetterWords:entries.size});
}
const prefixes=new Set();
for(const word of words)for(let n=1;n<=9;n++)prefixes.add(word.slice(0,n));
const found={};
function walk(route,word){
 if(word.length===9){if(words.has(word))(found[word]??=[]).push(route);return;}
 PREVIEW.grid.forEach((letter,i)=>{
  const last=route.at(-1);
  if(!route.includes(i)&&Math.max(Math.abs(Math.floor(i/4)-Math.floor(last/4)),Math.abs(i%4-last%4))===1&&prefixes.has(word+letter))walk([...route,i],word+letter);
 });
}
PREVIEW.grid.forEach((c,i)=>{if(prefixes.has(c))walk([i],c);});
const result={sampleId:PREVIEW.id,grid:PREVIEW.grid,sources,uniqueNineLetterWordsSearched:words.size,traceableNineLetterWords:found,scope:'Pinned local lexicons; not an exhaustive claim about all dictionaries.'};
const out=path.join(root,'output/trail-harder-20261103');
await mkdir(out,{recursive:true});await writeFile(path.join(out,'lexicon-scan.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
