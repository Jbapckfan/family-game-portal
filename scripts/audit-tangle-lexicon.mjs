/** Independent word-centric audit. Does not import the production trie/solver. */
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dailyTangle} from '../packages/kimi-pebbles/src/games/tangle/engine.ts';
import {TANGLE_REVIEWED_EXCLUSIONS,reviewTanglePuzzle} from '../packages/kimi-pebbles/src/games/tangle/reviewed-words.ts';
import {medalTargets,pointsFor,restoreTangleProgress} from '../packages/kimi-pebbles/src/games/tangle/progress.ts';
const root=new URL('../',import.meta.url),data=new URL('packages/kimi-pebbles/data/',root),game=new URL('packages/kimi-pebbles/src/games/tangle/data/',root);
const [alpha,wordnik,enable,disclosed,raw,extension,preview]=await Promise.all([
 readFile(new URL('english-words-alpha.txt',data),'utf8'),readFile(new URL('wordnik-game-words.txt',data),'utf8'),readFile(new URL('enable2k.txt.gz',data)),readFile(new URL('zynga-disclosed-words.json',data),'utf8'),readFile(new URL('puzzles.json',game),'utf8'),readFile(new URL('lexicon-expansions.json',game),'utf8'),readFile(new URL('five-preview.json',game),'utf8'),
]);
const englishPin=JSON.parse(await readFile(new URL('english-words-source.json',data),'utf8')),gamePins=JSON.parse(await readFile(new URL('word-game-sources.json',data),'utf8'));
for(const [bytes,expected] of [[alpha,englishPin.files['words_alpha.txt'].sha256],[wordnik,gamePins.find(p=>p.repository==='https://github.com/wordnik/wordlist').files['wordlist-20210729.txt'].sha256],[enable,gamePins.find(p=>p.repository==='https://github.com/BartMassey/wordlists').files['enable2k.txt.gz'].sha256]])assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,'independent source checksum');
const excluded=new Set(TANGLE_REVIEWED_EXCLUSIONS),union=[...new Set([...alpha.split(/\s+/),...wordnik.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),...gunzipSync(enable).toString().split(/\s+/),...JSON.parse(disclosed).words])].filter(w=>/^[a-z]+$/.test(w));
const allWords=union.filter(w=>w.length>=3&&w.length<=25&&!excluded.has(w));
const omitted={shorterThanThree:union.filter(w=>w.length<3).length,longerThanBoard:union.filter(w=>w.length>25).length,closedExclusions:union.filter(w=>w.length>=3&&w.length<=25&&excluded.has(w)).length};
assert.equal(union.length-allWords.length,Object.values(omitted).reduce((a,b)=>a+b,0));
const candidates=allWords.map(word=>{let mask=0;const counts=new Uint8Array(26);for(const c of word){const n=c.charCodeAt(0)-97;counts[n]++;mask|=1<<n}return {word,mask,counts}});
function enumerate(grid){
 const width=Math.sqrt(grid.length),counts=new Uint8Array(26),starts={};let mask=0;
 for(let i=0;i<grid.length;i++){const c=grid[i],n=c.charCodeAt(0)-97;counts[n]++;mask|=1<<n;(starts[c]??=[]).push(i)}
 const neighbors=Array.from({length:grid.length},(_,i)=>Array.from({length:grid.length},(_,j)=>j).filter(j=>i!==j&&Math.abs(i%width-j%width)<=1&&Math.abs(Math.floor(i/width)-Math.floor(j/width))<=1));
 const found=[];
 for(const item of candidates){
  const {word}=item;if(word.length>grid.length||(item.mask&~mask)!==0)continue;
  let enough=true;for(let i=0;i<26;i++)if(item.counts[i]>counts[i]){enough=false;break}if(!enough)continue;
  function visit(i,k,used){if(grid[i]!==word[k])return false;if(k===word.length-1)return true;const occupied=used|(1<<i);for(const j of neighbors[i])if(!(occupied&(1<<j))&&visit(j,k+1,occupied))return true;return false}
  if(starts[word[0]].some(i=>visit(i,0,0)))found.push(word);
 }
 return found.sort();
}
const originals=JSON.parse(raw),extensions=JSON.parse(extension),sample=JSON.parse(preview),perBoard=[];let total=0,added=0,unchanged=0;
for(let i=0;i<originals.length;i++){
 const p=originals[i],expected=enumerate(p.g);assert.deepEqual(extensions[p.g],expected,`generated coverage: ${i+1}`);
 const base=reviewTanglePuzzle({...p,targets:medalTargets(p.max)}),expectedRuntime=[...new Set([...base.words,...expected])].sort();
 const day=20757+((i-20757%430+430)%430),selection=dailyTangle(day),actual=selection.puzzle;
 assert.equal(actual.g,p.g);assert.equal(selection.puzzleNo,i+1);
 assert.deepEqual(actual.words,expectedRuntime,`runtime coverage: ${i+1}`);assert.deepEqual(actual.targets,base.targets,`goal preserved: ${i+1}`);
 assert.equal(actual.n,actual.words.length);assert.equal(actual.max,actual.words.reduce((n,w)=>n+pointsFor(w),0));
 const save={found:base.words,misses:2,hintsUsed:0,countedPlayed:true};assert.deepEqual(restoreTangleProgress(save,actual),restoreTangleProgress(save,base),`save score: ${i+1}`);
 const n=actual.words.length-base.words.length;total+=actual.words.length;added+=n;if(!n)unchanged++;
 perBoard.push({puzzle:i+1,sourceWords:expected.length,accepted:actual.n,added:n,max:actual.max,gold:actual.targets[2],acceptedSetSha256:createHash('sha256').update(actual.words.join('\n')+'\n').digest('hex')});
}
const expectedSample=enumerate(sample.g);assert.deepEqual(sample.words,expectedSample);assert.equal(sample.n,expectedSample.length);assert.equal(sample.max,expectedSample.reduce((n,w)=>n+pointsFor(w),0));
const report={method:'Independent word-by-word DFS with board letter-count prefilter, eight neighbors, no reused cells; checks source pins, every union-source candidate, per-board hashes, calendars and actual Daily entry points.',unionWords:union.length,sourceCandidates:allWords.length,omitted,boards:originals.length,acceptedWordPaths:total,addedWordPaths:added,unchangedAlreadyCoveredBoards:unchanged,previewWords:sample.n,previewMax:sample.max,sourceExclusions:TANGLE_REVIEWED_EXCLUSIONS,scope:'Completeness against pinned sources under Tangle 3+ letter/path rules; not a complete English dictionary or certified current Words With Friends parity.',perBoard};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,perBoard:undefined}));
