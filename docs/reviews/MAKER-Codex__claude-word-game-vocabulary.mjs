/** Reuse the locally pinned, checksum-verified four-source vocabulary. No downloads. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {loadTangleLexicon} from '../../scripts/tangle-lexicon.mjs';
import {PUZZLES} from '../../games/claude-sprout/puzzles.mjs';
import {PUZZLES as SPLICES,FUSED} from '../../games/claude-splice/puzzles.mjs';
import {PUZZLES as ARCHES,COMMON,FUSED as KEYSTONE_FUSED} from '../../games/claude-keystone/puzzles.mjs';
import {PUZZLES as CHAINS,FUSED as DOVE_FUSED,COMMON as DOVE_COMMON} from '../../games/claude-dovetail/puzzles.mjs';
import {PUZZLES as THREADS,DICTIONARY as THREAD_DICTIONARY} from '../../games/claude-tangle/puzzles.mjs';
import {GUESS_WORDS,ANSWERS} from '../../games/claude-tumbler/puzzles.mjs';
const root=new URL('../../',import.meta.url);
const sort=w=>[...w].sort().join('');
export async function generate({check=false}={}){
 const {words,sources}=await loadTangleLexicon();
 const policy=JSON.parse(await readFile(new URL('scripts/claude-sprout-editorial-exclusions.json',root),'utf8'));
 const excluded=new Set(Object.values(policy).filter(Array.isArray).flat());
 const byBag=new Map();
 for(const word of words)if(/^[a-z]{4,8}$/.test(word)&&!excluded.has(word)){
  const bag=sort(word);if(!byBag.has(bag))byBag.set(bag,[]);byBag.get(bag).push(word);
 }
 // The original round graph is retained in puzzles.mjs; expanded graphs are
 // selected only by the explicit vocabulary marker of newly created rounds.
 const graphs={};let entries=0;
 for(const p of PUZZLES){
  const letters=sort(p.seed+p.pool),bags=new Set();
  for(let mask=0;mask<256;mask++){
   const bag=[...letters].filter((_,i)=>mask&(1<<i)).join('');
   if(bag.length>=4)bags.add(bag);
  }
  const levels={};
  for(let n=4;n<=8;n++)levels[n]={a:[],d:[]};
  const candidates=new Set([...bags].flatMap(bag=>byBag.get(bag)??[]));
  // Retain all originally accepted, nonexcluded entries even if their source
  // spelling is absent from a newer dictionary source.
  for(const l of Object.values(p.levels))for(const word of [...l.a,...l.d])if(!excluded.has(word))candidates.add(word);
  const aliveBags=new Set([...candidates].filter(w=>w.length===8).map(sort));
  for(let n=8;n>=4;n--){
   for(const word of [...candidates].filter(w=>w.length===n).sort()){
    const bag=sort(word);let alive=n===8;
    if(!alive)for(let i=0;i<letters.length;i++){
     const next=sort(bag+letters[i]);
     // A next bag must conserve the full ecosystem multiplicities.
     if(aliveBags.has(next)){alive=true;break;}
    }
    levels[n][alive?'a':'d'].push(word);if(alive)aliveBags.add(bag);
    entries++;
   }
  }
  graphs[p.id]=levels;
 }
 const commonInfo={sourceUnion:words.size,sources,policy:'Existing closed Sprout editorial exclusions; source membership is not a familiarity or complete-English guarantee.'};
 const guesses=[...new Set([...GUESS_WORDS,...ANSWERS,...[...words].filter(w=>/^[a-z]{5}$/.test(w)&&!excluded.has(w))])].sort();
 const joins=new Set(FUSED);
 for(const p of SPLICES){const tiles=p.parts.flat();for(let a=0;a<12;a++)for(let b=0;b<12;b++)if(a!==b){const word=tiles[a]+tiles[b];if(words.has(word)&&!excluded.has(word))joins.add(word);}}
 const keyWords=[...new Set([...COMMON,...[...words].filter(w=>/^[a-z]{3,9}$/.test(w)&&!excluded.has(w))])].filter(w=>/^[a-z]{3,9}$/.test(w)).sort(),keySet=new Set(keyWords);
 const clues=new Set(ARCHES.flatMap(p=>p.rounds.flatMap(r=>r.clues.map(c=>c.w)))),keyJoins=new Set(KEYSTONE_FUSED),forClue=new Map([...clues].map(c=>[c,new Set()]));
 for(const word of words)if(!excluded.has(word))for(let split=1;split<word.length;split++){
  const a=word.slice(0,split),b=word.slice(split);
  if((clues.has(a)&&keySet.has(b))||(clues.has(b)&&keySet.has(a)))keyJoins.add(word);
 }
 for(const clue of clues)for(const word of keyJoins){
  if(word.startsWith(clue)&&keySet.has(word.slice(clue.length)))forClue.get(clue).add(word.slice(clue.length));
  if(word.endsWith(clue)&&keySet.has(word.slice(0,-clue.length)))forClue.get(clue).add(word.slice(0,-clue.length));
 }
 const alternatives={};
 for(const p of ARCHES)for(const round of p.rounds){
  const key=round.k+':'+round.clues.map(c=>c.w).sort().join('/');
  alternatives[key]=[...new Set([round.k,...[...forClue.get(round.clues[0].w)].filter(w=>!round.clues.some(c=>c.w===w)&&round.clues.every(c=>forClue.get(c.w).has(w)))])].sort();
 }
 const doveLengths=new Set(CHAINS.flatMap(p=>p.words.slice(1,-1).map(w=>w.length))),doveWords=[...new Set([...DOVE_COMMON,...[...words].filter(w=>doveLengths.has(w.length)&&!excluded.has(w))])].sort(),doveSet=new Set(doveWords),neighbors=new Set(CHAINS.flatMap(p=>p.words)),doveJoins=new Set(DOVE_FUSED);
 for(const word of words)if(!excluded.has(word))for(let split=1;split<word.length;split++){
  const a=word.slice(0,split),b=word.slice(split);
  if((neighbors.has(a)&&doveSet.has(b))||(neighbors.has(b)&&doveSet.has(a)))doveJoins.add(word);
 }
 const threadWords=new Set([...words,...THREAD_DICTIONARY].filter(w=>/^[a-z]{5,7}$/.test(w)&&!excluded.has(w)));
 for(const p of THREADS)for(const w of p.w)threadWords.add(w);
 const trie=new Map();for(const word of threadWords){let node=trie;for(const letter of word){if(!node.has(letter))node.set(letter,new Map());node=node.get(letter);}node.set('$',true);}
 const paths={};let threadPaths=0;
 for(const p of THREADS){
  const found=new Set(),lengths=new Set(p.w.map(w=>w.length)),maximum=Math.max(...lengths);
  function visit(start,node,mask,length){
   if(node.has('$')&&lengths.has(length))found.add(mask);
   if(length===maximum)return;
   for(let i=start;i<p.s.length;i++){const child=node.get(p.s[i]);if(child)visit(i+1,child,mask|(1<<i),length+1);}
  }
  visit(0,trie,0,0);paths[p.id]=[...found].sort((a,b)=>a-b);threadPaths+=found.size;
 }
 const outputs=[
  ['games/claude-tangle/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,words:threadWords.size,boards:THREADS.length,paths:threadPaths})};\nexport const WORD_GAME_PATHS=${JSON.stringify(paths)};\n`],
  ['games/claude-dovetail/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,guesses:doveWords.length,joins:doveJoins.size})};\nexport const WORD_GAME_WORDS=new Set(${JSON.stringify(doveWords)});\nexport const WORD_GAME_JOINS=new Set(${JSON.stringify([...doveJoins].sort())});\n`],
  ['games/claude-keystone/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,guesses:keyWords.length,joins:keyJoins.size,arches:Object.keys(alternatives).length})};\nexport const WORD_GAME_WORDS=new Set(${JSON.stringify(keyWords)});\nexport const WORD_GAME_JOINS=new Set(${JSON.stringify([...keyJoins].sort())});\nexport const WORD_GAME_ALTERNATIVES=${JSON.stringify(alternatives)};\n`],
  ['games/claude-splice/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,joins:joins.size,originalJoins:FUSED.size})};\nexport const WORD_GAME_JOINS=new Set(${JSON.stringify([...joins].sort())});\n`],
  ['games/claude-sprout/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,boards:PUZZLES.length,entries})};\nexport const WORD_GAME_LEVELS=${JSON.stringify(graphs)};\n`],
  ['games/claude-tumbler/vocabulary.mjs',`// Generated by docs/reviews/MAKER-Codex__claude-word-game-vocabulary.mjs\nexport const WORD_GAME_INFO=${JSON.stringify({...commonInfo,guesses:guesses.length,originalGuesses:GUESS_WORDS.length})};\nexport const WORD_GAME_GUESSES=${JSON.stringify(guesses)};\n`],
 ];
 const notices=await Promise.all(['english-words-LICENSE.md','wordnik-LICENSE.txt','enable2k-README.txt','enable2k-mirror-LICENSE.txt'].map(async f=>`${f}\n${await readFile(new URL('packages/kimi-pebbles/data/'+f,root),'utf8')}`));
 const {modernWordSourceNotice}=await import('../../scripts/word-source-notice.mjs');notices.push(await modernWordSourceNotice());
 const notice=`Word-game vocabulary sources\n\nPinned upstream revisions and source hashes are recorded in vocabulary.mjs.\nThe sources are build inputs; gameplay is offline. This is not the full proprietary Words With Friends dictionary.\n\n${notices.join('\n\n---\n\n')}`;
 for(const slug of ['sprout','tumbler','splice','keystone','dovetail','tangle'])outputs.push([`games/claude-${slug}/word-lists-LICENSE.txt`,notice]);
 for(const [file,content]of outputs){
  if(check){if(await readFile(new URL(file,root),'utf8')!==content)throw Error(`Stale generated vocabulary: ${file}`);}
  else await writeFile(new URL(file,root),content);
 }
 return {sourceUnion:words.size,sproutBoards:PUZZLES.length,sproutEntries:entries,tumblerGuesses:guesses.length,spliceJoins:joins.size,keystoneWords:keyWords.length,keystoneJoins:keyJoins.size,dovetailWords:doveWords.length,dovetailJoins:doveJoins.size,tanglePaths:threadPaths};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await generate({check:process.argv.includes('--check')})));
