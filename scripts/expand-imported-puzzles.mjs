#!/usr/bin/env node
/**
 * Deterministic, append-only DeepSeek/Qwen content expansion.
 * Run: node scripts/expand-imported-puzzles.mjs [--check]
 * Every published record stays exact. Each game supplies at least 200 substantive
 * challenges; Prism retains 25 duplicate legacy records for save compatibility.
 * Runtime data stays inline; the generator never changes a daily schedule.
 * No external dictionaries, packages, services, or generated editorial clues.
 */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {substantiveSignature} from './imported-content-signatures.mjs';
import {CIPHER_CONTENT, TRAIL_CONTENT, QUADRA_POOLS, SIX_MONTH_CIPHER_CONTENT, SIX_MONTH_TRAIL_CONTENT} from './imported-puzzle-content.mjs';
import {findRoute} from '../games/deepseek-rung/engine.mjs';
import {solvePuzzle} from '../games/qwen-logic-lattice/engine.mjs';
import * as Territory from '../games/qwen-territory-tactics/engine.mjs';

const MARKER='// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION';
const slugs=['deepseek-twin-hive','deepseek-rung','deepseek-spare','deepseek-cipher','deepseek-trail','deepseek-split','qwen-logic-lattice','qwen-memory-maze','qwen-pattern-prism','qwen-quadra','qwen-syntax-siege','qwen-territory-tactics'];
const original={},source={};
for(const slug of slugs){
 const url=new URL(`../games/${slug}/puzzles.mjs`,import.meta.url);
 const module=await import(url);original[slug]=module.PUZZLES.slice(0,30);
 const text=await readFile(url,'utf8');source[slug]=text.split(MARKER)[0].replace('const ORIGINAL_PUZZLES','export const PUZZLES').trimEnd()+'\n';
 assert.equal(original[slug].length,30,slug);
}
const clone=value=>JSON.parse(JSON.stringify(value));
function random(seed){return()=>{seed=(seed+0x6D2B79F5)>>>0;let n=seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return((n^(n>>>14))>>>0)/4294967296;};}
function shuffle(values,rng){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
const overlap=(a,b)=>a.filter(x=>b.includes(x)).length;
const sorted=values=>[...values].sort();
const pairKey=pair=>sorted(pair).join('/');
const bag=values=>[...values].sort().join('');
const useCount=values=>{const out=new Map();for(const value of values)out.set(value,(out.get(value)||0)+1);return out;};
const updateCount=(counts,values)=>values.forEach(value=>counts.set(value,(counts.get(value)||0)+1));
const id=(prefix,index)=>`${prefix}-${String(index+31).padStart(3,'0')}`;
function squareTransforms(size){return Array.from({length:8},(_,n)=>index=>{let row=Math.floor(index/size),col=index%size;if(n>=4)col=size-1-col;for(let k=0;k<n%4;k++)[row,col]=[col,size-1-row];return row*size+col;});}
function solutionKey(solution){return squareTransforms(5).flatMap(transform=>[0,1].map(invert=>{const result=Array(25);solution.forEach((v,i)=>{result[transform(i)]=invert?1-v:v;});return result.join('');})).sort()[0];}
function routeKey(path){return [path,[...path].reverse()].flatMap(route=>squareTransforms(7).map(transform=>{const coordinates=route.map(transform).map(i=>[Math.floor(i/7),i%7]);const row=Math.min(...coordinates.map(x=>x[0])),col=Math.min(...coordinates.map(x=>x[1]));return JSON.stringify(coordinates.map(([r,c])=>[r-row,c-col]));})).sort()[0];}
function hexKey(p){const variants=[];for(let flip=0;flip<2;flip++)for(let turn=0;turn<6;turn++){const transform=cell=>{let[q,r]=cell.split(',').map(Number);if(flip)[q,r]=[r,q];for(let n=0;n<turn;n++)[q,r]=[-r,q+r];return `${q},${r}`;};variants.push(JSON.stringify([p.radius,p.friendly.map(transform).sort(),p.enemy.map(transform).sort(),p.target,p.maxMoves]));}return variants.sort()[0];}
function normalizedCycle(values){const keys=new Map();return values.map(value=>{if(!keys.has(value))keys.set(value,keys.size);return keys.get(value);}).join(',');}
function cycleClass(values){return values.map((_,i)=>normalizedCycle([...values.slice(i),...values.slice(0,i)])).sort()[0];}
const structure=p=>Object.entries(p.cycles).map(([key,cycle])=>key+':'+cycleClass(cycle)).join('|');
function inferable(cycle){const shown=Array.from({length:5},(_,i)=>cycle[i%cycle.length]),answers=[];for(let period=1;period<=4;period++)if(shown.every((value,i)=>value===shown[i%period]))answers.push(Array.from({length:3},(_,i)=>shown[(5+i)%period]).join('/'));return new Set(answers).size===1;}

function twinHive(){
 const old=original['deepseek-twin-hive'],seen=new Set(old.map(p=>p.letters+pairKey(p.gold))),byBank=[];
 for(const [,letters,raw] of source['deepseek-twin-hive'].matchAll(/\['([A-Z]+)',`([^`]+)`\]/g)){
  const words=[...new Set(raw.trim().split(/\s+/))].filter(w=>w.length>=4),extra=[];
  for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){
   const gold=[letters[a],letters[b]],answers=words.filter(w=>gold.every(c=>w.includes(c))).sort();
   assert.ok(answers.length>=12);if(!seen.has(letters+pairKey(gold)))extra.push({letters,gold,answers,target:6});
  }
  byBank.push(extra);
 }
 const additions=[];for(let n=0;n<22;n++)for(const bank of byBank)additions.push({id:id('twin-expanded',additions.length),...bank[n]});
 assert.equal(additions.length,110);
 const vocabulary=sorted(new Set([...old,...additions].flatMap(p=>p.answers)));
 const newRacks=['AEINORST','ADEINRST','AEILORST'];
 const newBanks=newRacks.map(letters=>{
  const words=vocabulary.filter(word=>[...word].every(c=>letters.includes(c))),challenges=[];
  for(let a=0;a<8;a++)for(let b=a+1;b<8;b++){
   const gold=[letters[a],letters[b]],answers=words.filter(word=>gold.every(c=>word.includes(c)));
   if(answers.length>=12)challenges.push({letters,gold,answers,target:6});
  }
  return challenges;
 });
 // Twenty distinct gold-letter constraints per new rack, interleaved.
 const answerSets=new Set([...old,...additions].map(p=>p.answers.join('/')));
 for(let n=0;n<20;n++)for(const bank of newBanks){let candidate;do{candidate=bank.shift();assert.ok(candidate,'Not enough distinct Hive answer banks');}while(answerSets.has(candidate.answers.join('/')));answerSets.add(candidate.answers.join('/'));additions.push({id:id('twin-expanded',additions.length),...candidate});}
 assert.equal(additions.length,170);
 return {additions,info:{preparedPuzzles:200,letterBanks:8,distinctGoldPairs:200,minAcceptedWords:Math.min(...[...old,...additions].map(p=>p.answers.length)),newRackVocabulary:'Common words retained from the published five editorial banks; filtered and validated for the three new rack blends.'}};
}
function rung(){
 const old=original['deepseek-rung'],rng=random(0xA11F0D01),endpoints=sorted(new Set(old.flatMap(p=>[p.start,p.target]))),seen=new Set(old.map(p=>pairKey([p.start,p.target]))),counts=useCount(old.flatMap(p=>[p.start,p.target])),candidates=[];
 for(let a=0;a<endpoints.length;a++)for(let b=a+1;b<endpoints.length;b++){
  const start=endpoints[a],target=endpoints[b];if(seen.has(pairKey([start,target])))continue;
  const route=findRoute(start,target);if(route&&route.length>=4&&route.length<=8)candidates.push({start,target,par:route.length-1,tie:rng()});
 }
 const additions=[];while(additions.length<170){
  candidates.sort((a,b)=>((counts.get(a.start)||0)+(counts.get(a.target)||0))-((counts.get(b.start)||0)+(counts.get(b.target)||0))||a.tie-b.tie);
  const candidate=candidates.shift();assert.ok(candidate,'Not enough distinct connected endpoint pairs');
  const {start,target,par}=candidate;additions.push({id:id('rung',additions.length),start,target,par});updateCount(counts,[start,target]);
 }
 return {additions,info:{preparedPuzzles:200,curatedEndpointWords:endpoints.length,minimumPar:3,maximumAddedPar:7}};
}
function spare(){
 const old=original['deepseek-spare'],rng=random(0xA11F0D02),pairs=old.flatMap(p=>p.pairs),spares=old.map(p=>p.spare),previous=old.map(p=>p.pairs.map(pairKey)),counts=useCount(previous.flat()),added=[];
 const families=[
 'ABUNDANT SCARCE PLENTIFUL SPARSE RARE COMMON', 'RIGID FLEXIBLE INFLEXIBLE',
 'TIMID BOLD COURAGE FEAR BRAVERY COWARDICE CONFIDENT UNCERTAIN CAUTIOUS RECKLESS',
 'VACANT OCCUPIED EMPTY FULL', 'ANCIENT MODERN FUTURE PAST EARLY LATE BEFORE AFTER ARRIVAL DEPARTURE ARRIVE DEPART TEMPORARY PERMANENT BEGIN END',
 'EXPAND CONTRACT INCREASE DECREASE SHRINK GROW LENGTHEN SHORTEN BROAD NARROW WIDE SHALLOW DEEP MAXIMUM MINIMUM',
 'GENEROUS STINGY THRIFT WASTE PROFIT LOSS DEFICIT SURPLUS', 'FRAGILE STURDY STRENGTH WEAKNESS SECURE VULNERABLE',
 'BITTER SWEET SOUR FRESH STALE', 'INCLUDE EXCLUDE COMBINE SEPARATE UNITE DIVIDE INNER OUTER EXTERIOR INTERIOR NATIVE FOREIGN PRIVATE PUBLIC LEADER FOLLOWER',
 'TRIUMPH DEFEAT VICTORY WIN LOSE SUCCESS FAILURE', 'HUMBLE PROUD MODEST ARROGANT',
 'VISIBLE HIDDEN OPAQUE TRANSPARENT REVEAL CONCEAL VANISH APPEAR',
 'ACCEPT REJECT APPROVE DISAPPROVE ALLOW FORBID OBEDIENT DEFIANT LEGAL ILLEGAL INNOCENT GUILTY FREEDOM CAPTIVITY COMPULSORY OPTIONAL ENCOURAGE DISCOURAGE RESIST YIELD',
 'ASCEND DESCEND ADVANCE RETREAT EAST WEST VERTICAL HORIZONTAL UPHILL DOWNHILL STEEP GRADUAL RAPID SLOW',
 'FLOURISH WITHER ALIVE DEAD DORMANT ACTIVE MATURE IMMATURE',
 'ORDINARY UNUSUAL SIMPLE COMPLEX LITERAL FIGURATIVE RATIONAL IRRATIONAL AUTHENTIC COUNTERFEIT HONEST DECEITFUL ACCURATE INACCURATE',
 ].map(row=>new Set(row.split(' ')));
 const family=pair=>families.findIndex(group=>pair.some(w=>group.has(w)));
 for(let attempt=0;added.length<170&&attempt<20000;attempt++){
  const candidates=shuffle(pairs,rng).sort((a,b)=>(counts.get(pairKey(a))||0)-(counts.get(pairKey(b))||0)),chosen=[];
  for(const pair of candidates){
   if(chosen.flat().some(word=>pair.includes(word)))continue;
   const group=family(pair);if(group>=0&&chosen.some(other=>family(other)===group))continue;
   chosen.push(pair);if(chosen.length===4)break;
  }
  if(chosen.length!==4)continue;const keys=chosen.map(pairKey);if(previous.some(p=>overlap(p,keys)>2))continue;
  const p={id:id('spare',added.length),prompt:old[0].prompt,pairs:clone(chosen),spare:spares[added.length%spares.length]};
  assert.equal(new Set([...p.pairs.flat(),p.spare]).size,9);added.push(p);previous.push(keys);updateCount(counts,keys);
 }
 assert.equal(added.length,170);
 return {additions:added,info:{preparedPuzzles:200,curatedAntonymPairs:pairs.length,neutralSpareWords:spares.length,maxSharedPairsPerAddedBoard:2}};
}
function cipher(){
 const rng=random(0xA11F0D03),alphabet=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],seen=new Set(original['deepseek-cipher'].map(p=>p.phrase));
 const content=[...CIPHER_CONTENT,...SIX_MONTH_CIPHER_CONTENT];assert.equal(content.length,170);
 const additions=content.map(([phrase,clue],n)=>{
  assert.match(phrase,/^[A-Z ]+$/);assert.ok(clue.length>10);assert.ok(!seen.has(phrase));seen.add(phrase);
  let shuffled;do{shuffled=shuffle(alphabet,rng);}while(shuffled.some((c,i)=>c===alphabet[i]));
  const key=Object.fromEntries(alphabet.map((c,i)=>[c,shuffled[i]])),encoded=[...phrase].map(c=>key[c]||c).join('');
  const counts=useCount([...encoded].filter(c=>c!==' '));const givens=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,2).map(x=>x[0]);
  return {id:id('cipher',n),phrase,clue,key,encoded,givens};
 });
 return {additions,info:{preparedPuzzles:200,uniqueAuthoredPhrases:200,newAuthoredPhrases:170}};
}
function trail(){
 const rng=random(0xA11F0D04),seen=new Set(original['deepseek-trail'].map(p=>p.answer));
 const content=[...TRAIL_CONTENT.slice(0,90),...SIX_MONTH_TRAIL_CONTENT];assert.equal(content.length,170);
 for(const [word,clue] of content){assert.match(word,/^[A-Z]{9}$/);assert.ok(clue.length>10);assert.ok(!seen.has(word));seen.add(word);}
 function route(){
  function visit(path){if(path.length===9)return path;const last=path.at(-1),neighbors=Array.from({length:9},(_,i)=>i).filter(i=>!path.includes(i)&&Math.max(Math.abs(Math.floor(i/3)-Math.floor(last/3)),Math.abs(i%3-last%3))===1);for(const next of shuffle(neighbors,rng)){const result=visit([...path,next]);if(result)return result;}return null;}
  for(const start of shuffle(Array.from({length:9},(_,i)=>i),rng)){const found=visit([start]);if(found)return found;}throw Error('No nine-cell route');
 }
 const additions=content.map(([answer,clue],n)=>{const path=route(),grid=Array(9);path.forEach((cell,i)=>{grid[cell]=answer[i];});return{id:id('trail',n),answer,clue,grid,path,accepted:[answer]};});
 return {additions,info:{preparedPuzzles:200,uniqueCluedAnswers:200,newAuthoredAnswers:170}};
}
function split(){
 const old=original['deepseek-split'],rng=random(0xA11F0D05),pool=new Map(old.flatMap(p=>p.words.map((w,i)=>[w,p.clues[i]]))),words=sorted(pool.keys()),seen=new Set(old.map(p=>pairKey(p.words))),counts=useCount(old.flatMap(p=>p.words)),candidates=[];
 for(let a=0;a<words.length;a++)for(let b=a+1;b<words.length;b++)if(words[a].length+words[b].length===10&&!seen.has(pairKey([words[a],words[b]]))&&bag(words[a])!==bag(words[b]))candidates.push({words:[words[a],words[b]],tie:rng()});
 const additions=[];while(additions.length<170){
  candidates.sort((a,b)=>a.words.reduce((n,w)=>n+(counts.get(w)||0),0)-b.words.reduce((n,w)=>n+(counts.get(w)||0),0)||a.tie-b.tie);
  const candidate=candidates.shift();assert.ok(candidate);const selected=shuffle(candidate.words,rng);updateCount(counts,selected);
  additions.push({id:id('split',additions.length),words:selected,clues:selected.map(w=>pool.get(w)),rack:shuffle([...selected.join('')],rng)});
 }
 return {additions,info:{preparedPuzzles:200,curatedWordCluePairs:pool.size,uniqueUnorderedAnswerPairs:200}};
}
function lattice(){
 const rng=random(0xA11F0D06),seen=new Set(original['qwen-logic-lattice'].map(p=>solutionKey(p.solution))),additions=[];
 for(let attempt=0;additions.length<170&&attempt<10000;attempt++){
  const solution=Array.from({length:25},()=>rng()<.5?0:1),rows=Array.from({length:5},(_,r)=>solution.slice(r*5,r*5+5).reduce((a,b)=>a+b,0)),columns=Array.from({length:5},(_,c)=>[0,1,2,3,4].reduce((n,r)=>n+solution[r*5+c],0));
  if([...rows,...columns].some(n=>n===0||n===5))continue;const signature=solutionKey(solution);if(seen.has(signature))continue;
  const diagonals=[[0,6,12,18,24],[4,8,12,16,20]].map(indices=>indices.reduce((n,i)=>n+solution[i],0));
  const p={id:id('lattice',additions.length),rows,columns,diagonals,givens:[],solution};
  for(let count=0;count<10;count++){
   const solutions=solvePuzzle(p,2);if(solutions.length===1)break;assert.ok(solutions.length>1);
   const other=solutions.find(s=>s.some((v,i)=>v!==solution[i]));const differing=shuffle(solution.map((v,i)=>v!==other[i]?i:-1).filter(i=>i>=0),rng);p.givens.push([differing[0],solution[differing[0]]]);
  }
  if(solvePuzzle(p,2).length!==1)continue;
  for(const given of shuffle(p.givens,rng)){const before=p.givens;p.givens=before.filter(g=>g!==given);if(solvePuzzle(p,2).length!==1)p.givens=before;}
  if(p.givens.length<2||p.givens.length>6)continue;
  p.givens.sort((a,b)=>a[0]-b[0]);assert.deepEqual(solvePuzzle(p,2),[solution]);seen.add(signature);additions.push(p);
 }
 assert.equal(additions.length,170);return {additions,info:{preparedPuzzles:200,solverUniqueBoards:200,symmetryAndComplementDistinctGrids:200,addedGivensRange:[Math.min(...additions.map(p=>p.givens.length)),Math.max(...additions.map(p=>p.givens.length))]}};
}
function maze(){
 const rng=random(0xA11F0D07),seen=new Set(original['qwen-memory-maze'].map(p=>routeKey(p.path))),additions=[];
 for(let attempt=0;additions.length<170&&attempt<20000;attempt++){
  const length=8+additions.length%7,path=[Math.floor(rng()*49)];
  while(path.length<length){const last=path.at(-1),r=Math.floor(last/7),c=last%7,next=shuffle([[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([r,c])=>r>=0&&r<7&&c>=0&&c<7).map(([r,c])=>r*7+c).filter(i=>!path.includes(i)),rng)[0];if(next===undefined)break;path.push(next);}
  if(path.length!==length)continue;const moves=path.slice(1).map((cell,i)=>cell-path[i]);if(moves.slice(1).filter((m,i)=>m!==moves[i]).length<3)continue;
  const key=routeKey(path);if(seen.has(key))continue;seen.add(key);
  const obstacles=shuffle(Array.from({length:49},(_,i)=>i).filter(i=>!path.includes(i)),rng).slice(0,8).sort((a,b)=>a-b);
  additions.push({id:id('maze',additions.length),path,obstacles});
 }
 assert.equal(additions.length,170);return {additions,info:{preparedPuzzles:200,distinctRouteShapes:200,pathLengthRange:[8,14],obstaclesPerAddedBoard:8}};
}
function prism(){
 const rng=random(0xA11F0D08),seen=new Set(original['qwen-pattern-prism'].map(structure));
 function patterns(alphabet){const map=new Map();function visit(prefix,length){if(prefix.length===length){for(let p=1;p<length;p++)if(length%p===0&&prefix.every((v,i)=>v===prefix[i%p]))return;if(inferable(prefix)&&!map.has(cycleClass(prefix)))map.set(cycleClass(prefix),prefix);return;}for(let n=0;n<alphabet;n++)visit([...prefix,n],length);}
  for(let length=1;length<=4;length++)visit([],length);return [...map.values()];}
 const four=patterns(4),two=patterns(2),candidates=[];
 for(const shape of four)for(const color of four)for(const size of two)for(const rotation of four){const cycles={shape,color,size,rotation},varying=Object.values(cycles).filter(c=>c.length>1).length;if(varying<2||varying>3||Object.values(cycles).reduce((n,c)=>n+c.length,0)>12)continue;if(!seen.has(structure({cycles})))candidates.push(cycles);}
 const additions=shuffle(candidates,rng).slice(0,195).map((patterns,n)=>{
  const palette={shape:shuffle(['circle','triangle','square','star'],rng),color:shuffle(['ocean','rose','gold','leaf'],rng),size:shuffle([0,1],rng),rotation:shuffle([0,90,180,270],rng)};
  const cycles=Object.fromEntries(Object.entries(patterns).map(([key,values])=>[key,values.map(v=>palette[key][v])]));
  assert.ok(!seen.has(structure({cycles})));seen.add(structure({cycles}));for(const cycle of Object.values(cycles))assert.ok(inferable(cycle));
  return{id:id('prism',n),cycles,offset:Math.floor(rng()*4)};
 });
 assert.equal(additions.length,195);assert.equal(seen.size,200);
 return {additions,info:{preparedPuzzles:225,structurallyDistinctRules:seen.size,maximumCycleLength:4,displayedExamples:5,ambiguousSupportedPredictions:0,structuralDeduplication:'Ignores attribute labels and independent cycle phases.'}};
}
function quadra(){
 const old=original['qwen-quadra'],rng=random(0xA11F0D09),previous=old.map(p=>p.answers),counts=useCount(previous.flat()),pools=[];
 for(const pool of QUADRA_POOLS){
  assert.ok(pool.words.every(w=>/^[A-Z]{4}$/.test(w)),pool.category);assert.equal(new Set(pool.words).size,pool.words.length);
  const candidates=[],bags=new Map();
  for(let a=0;a<pool.words.length;a++)for(let b=a+1;b<pool.words.length;b++)for(let c=b+1;c<pool.words.length;c++)for(let d=c+1;d<pool.words.length;d++){const answers=[pool.words[a],pool.words[b],pool.words[c],pool.words[d]],key=bag(answers.join(''));bags.set(key,(bags.get(key)||0)+1);candidates.push({answers,key,tie:rng()});}
  pools.push({category:pool.category,words:pool.words,candidates:candidates.filter(p=>bags.get(p.key)===1)});
 }
 const additions=[];let rounds=0;
 while(additions.length<170&&rounds++<60){let progress=false;
  for(const pool of pools){if(additions.length===170)break;
   const candidates=pool.candidates.filter(p=>previous.every(words=>overlap(words,p.answers)<=2));
   candidates.sort((a,b)=>a.answers.reduce((n,w)=>n+(counts.get(w)||0),0)-b.answers.reduce((n,w)=>n+(counts.get(w)||0),0)||a.tie-b.tie);
   if(!candidates.length)continue;const chosen=candidates[0];previous.push(chosen.answers);updateCount(counts,chosen.answers);
   additions.push({id:id('quadra',additions.length),category:pool.category,answers:chosen.answers,tiles:shuffle([...chosen.answers.join('')],rng)});progress=true;
  }
  if(!progress)break;
 }
 assert.equal(additions.length,170,'Not enough category boards satisfy diversity and unique-rack constraints');
 return {additions,info:{preparedPuzzles:200,additionalEditorialCategoryPools:QUADRA_POOLS.length,distinctPoolWords:new Set(QUADRA_POOLS.flatMap(p=>p.words)).size,maxSharedWordsPerAddedBoard:2,addedRacksWithUniqueCategoryPartition:170}};
}
function siege(){
 const old=original['qwen-syntax-siege'],rng=random(0xA11F0D0A),pool=new Map();for(const p of old)for(const wave of p.waves)if(!pool.has(wave.bank))pool.set(wave.bank,wave);
 const names=sorted(pool.keys()),previous=old.map(p=>p.waves.map(w=>w.bank)),counts=useCount(previous.flat()),additions=[];
 let candidates=[];function combinations(selected,start){if(selected.length===6){if(previous.every(p=>overlap(p,selected)<=4))candidates.push({names:selected,tie:rng()});return;}for(let i=start;i<names.length;i++)combinations([...selected,names[i]],i+1);}combinations([],0);
 while(additions.length<170){
  candidates.sort((a,b)=>a.names.reduce((n,w)=>n+(counts.get(w)||0),0)-b.names.reduce((n,w)=>n+(counts.get(w)||0),0)||a.tie-b.tie);
  const candidate=candidates.shift();assert.ok(candidate,'No sufficiently different six-wave schedule remains');const selected=candidate.names;
  const waves=shuffle(selected,rng).map(bank=>{const wave=clone(pool.get(bank));wave.rack=shuffle(wave.rack,rng);return wave;});
  additions.push({id:id('siege',additions.length),waves});previous.push(selected);updateCount(counts,selected);
  candidates=candidates.filter(p=>overlap(p.names,selected)<=4);
 }
 assert.equal(additions.length,170);return {additions,info:{preparedPuzzles:200,curatedWaveBanks:pool.size,wavesPerSchedule:6,maxSharedBanksPerAddedSchedule:4}};
}
function territory(){
 // Keep the published thirty as introductions. New positions ask which group
 // is worth the two placements: a legal smaller capture is an explicit decoy.
 const rng=random(0xA11F0D0B),template={radius:2},all=Territory.cells(template),neighbors=new Map(all.map(c=>[c,Territory.neighbors(template,c)])),seen=new Set(original['qwen-territory-tactics'].map(hexKey)),enemyShapes=new Set(),additions=[];
 for(let attempt=0;additions.length<170&&attempt<200000;attempt++){
  const size=3+additions.length%2,targetGroup=[all[Math.floor(rng()*all.length)]];
  while(targetGroup.length<size){const options=shuffle([...new Set(targetGroup.flatMap(cell=>neighbors.get(cell)).filter(c=>!targetGroup.includes(c)))],rng);targetGroup.push(options[0]);}
  const separated=all.filter(c=>!targetGroup.includes(c)&&!neighbors.get(c).some(n=>targetGroup.includes(n)));
  if(!separated.length)continue;
  const decoy=[separated[Math.floor(rng()*separated.length)]];
  if(additions.length%3){const options=shuffle(neighbors.get(decoy[0]).filter(c=>separated.includes(c)),rng);if(!options.length)continue;decoy.push(options[0]);}
  const enemy=[...targetGroup,...decoy].sort(),surround=[...new Set(enemy.flatMap(cell=>neighbors.get(cell)).filter(c=>!enemy.includes(c)))];
  const targetBoundary=shuffle([...new Set(targetGroup.flatMap(c=>neighbors.get(c)).filter(c=>!enemy.includes(c)))],rng);
  const decoyBoundary=shuffle([...new Set(decoy.flatMap(c=>neighbors.get(c)).filter(c=>!enemy.includes(c)))],rng);
  if(targetBoundary.length<2||!decoyBoundary.length)continue;
  const open=new Set([...targetBoundary.slice(0,2),...decoyBoundary.slice(0,1+additions.length%2)]);
  const friendly=surround.filter(c=>!open.has(c)).sort();if(all.length-enemy.length-friendly.length<5)continue;
  const p={id:id('territory',additions.length),radius:2,friendly,enemy,target:size,maxMoves:2};
  if(Territory.liberties(p,targetGroup,friendly,enemy).length!==2)continue;
  if(Territory.groups(p,friendly).some(g=>!Territory.liberties(p,g,friendly,enemy).length))continue;
  const key=hexKey(p),shape=hexKey({...p,friendly:[]});if(seen.has(key)||enemyShapes.has(shape))continue;
  const solutions=Territory.winningPaths(p);
  if(!solutions.length||solutions.some(moves=>moves.length<2))continue;
  // Verify the decoy is a real, legal, insufficient capture, not scenery.
  const decoyPuzzle={...p,target:decoy.length};
  if(!Territory.winningPaths(decoyPuzzle).some(moves=>{const board=Territory.simulate(p,moves);return board.captured>0&&board.captured<p.target&&decoy.every(c=>!board.enemy.includes(c));}))continue;
  seen.add(key);enemyShapes.add(shape);additions.push(p);
 }
 assert.equal(additions.length,170);return {additions,info:{preparedPuzzles:200,hexSymmetryDistinctBoards:200,addedEnemyConfigurationsDistinctUnderHexSymmetry:170,addedEnemyGroupsPerBoard:2,addedTargetGroupSizes:[3,4],addedDecoyGroupSizes:[1,2],minimumWinningMovesForAdditions:2,allAdditionsHaveLegalInsufficientDecoyCaptures:true,allAddedFriendlyStonesBlockAnEnemyLiberty:true}};
}

const generators={'deepseek-twin-hive':twinHive,'deepseek-rung':rung,'deepseek-spare':spare,'deepseek-cipher':cipher,'deepseek-trail':trail,'deepseek-split':split,'qwen-logic-lattice':lattice,'qwen-memory-maze':maze,'qwen-pattern-prism':prism,'qwen-quadra':quadra,'qwen-syntax-siege':siege,'qwen-territory-tactics':territory};
const check=process.argv.includes('--check');
if(process.argv.slice(2).some(arg=>arg!=='--check'))throw Error('Usage: node scripts/expand-imported-puzzles.mjs [--check]');
for(const slug of slugs){
 const {additions,info}=generators[slug]();assert.equal(info.preparedPuzzles,30+additions.length);
 assert.ok(new Set([...original[slug],...additions].map(p=>substantiveSignature(slug,p))).size>=200,`${slug}: fewer than 200 substantive challenges`);
 const retained=source[slug].replace('export const PUZZLES','const ORIGINAL_PUZZLES');
 const text=retained+`\n${MARKER}\n// All published records retain their original values, IDs, and ordering.\n// Additional prepared content by Alford Daily. Creator attribution is unchanged.\nexport const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...${JSON.stringify(additions,null,2)}]);\nexport const CONTENT_INFO = Object.freeze(${JSON.stringify(info,null,2)});\n`;
 const url=new URL(`../games/${slug}/puzzles.mjs`,import.meta.url);
 if(check)assert.equal(await readFile(url,'utf8'),text,`${slug}: generated content is stale`);else await writeFile(url,text);
 console.log(`${slug}: ${info.preparedPuzzles} prepared puzzles${check?' verified':''}`);
}
