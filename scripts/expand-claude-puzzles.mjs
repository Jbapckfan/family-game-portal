#!/usr/bin/env node
/**
 * Extend the three smaller Claude banks using only their supplied semantic pools.
 * Run: node scripts/expand-claude-puzzles.mjs [--check]
 * No downloaded dictionary, new word, invented clue, tile shuffle, or engine change.
 * Original source bytes remain a verified prefix of each generated module.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import * as D from '../games/claude-dovetail/puzzles.mjs';
import * as S from '../games/claude-splice/puzzles.mjs';
import * as K from '../games/claude-keystone/puzzles.mjs';
import {findMatchings} from '../games/claude-splice/engine.mjs';

const TARGET=120;
const MARKER='// BEGIN ALFORD DAILY PREPARED EXPANSION';
const hashes={
  dovetail:'7160d19bd64e70b259fd3b90a62e22129a2f4b25235446e0d181208ab930eee7',
  splice:'08e5a304f8c60a36f296ef3d2bfd88934176d16860700a21260e0d059edb5fef',
  keystone:'09b25f22c1e3ebbdb9182d748e57f8b622abcb4da9fb7afe8be6303216793c0b',
};
const originals={dovetail:D.PUZZLES.slice(0,77),splice:S.PUZZLES.slice(0,73),keystone:K.PUZZLES.slice(0,58)};
const sha=text=>createHash('sha256').update(text).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const counter=items=>{const result=new Map();for(const item of items)result.set(item,(result.get(item)||0)+1);return result;};
const intersection=(a,b)=>[...a].filter(value=>b.has(value)).length;
const edgeList=words=>words.slice(1).map((word,i)=>words[i]+'|'+word);
const windows=(words,n)=>words.slice(n-1).map((_,i)=>words.slice(i,i+n).join('|'));
function random(seed){return ()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

function dovetail(){
  const source=originals.dovetail,rng=random(0xD0E2026),adj=new Map();
  for(const p of source)for(let i=0;i<p.words.length-1;i++){
    if(!adj.has(p.words[i]))adj.set(p.words[i],new Set());adj.get(p.words[i]).add(p.words[i+1]);
  }
  const describe=words=>({words,edges:new Set(edgeList(words)),blocks:new Set(windows(words,5)),presentation:[words[0],words.at(-1),...words.map(w=>w.length)].join('|')});
  const previous=source.map(p=>describe(p.words));
  const compatible=(p,old)=>p.presentation!==old.presentation&&intersection(p.edges,old.edges)<=4&&intersection(p.blocks,old.blocks)===0;
  const forbidden=new Set(source.flatMap(p=>windows(p.words,5))),candidates=[];
  const wordUse=counter(source.flatMap(p=>p.words)),edgeUse=counter(source.flatMap(p=>edgeList(p.words)));
  let visits=0;
  function visit(words){
    if(++visits>1_000_000)throw Error('Dovetail search exceeded its deterministic candidate budget.');
    if(words.length===8){const p=describe(words);if(previous.every(old=>compatible(p,old)))candidates.push({...p,tie:rng()});return;}
    for(const next of [...(adj.get(words.at(-1))||[])].sort()){
      if(words.includes(next))continue;
      const path=[...words,next];if(path.length>=5&&forbidden.has(path.slice(-5).join('|')))continue;
      visit(path);
    }
  }
  for(const first of [...adj.keys()].sort())visit([first]);
  const candidateCount=candidates.length,added=[];
  while(source.length+added.length<TARGET){
    let best=-1,bestScore=-Infinity;
    for(let i=0;i<candidates.length;i++){
      const p=candidates[i];
      if(!previous.slice(source.length).every(old=>compatible(p,old)))continue;
      const score=p.tie-4*[...p.edges].reduce((n,e)=>n+(edgeUse.get(e)||0),0)-p.words.reduce((n,w)=>n+(wordUse.get(w)||0),0);
      if(score>bestScore){best=i;bestScore=score;}
    }
    if(best<0)throw Error(`Dovetail: only ${source.length+added.length} substantive chains satisfy the similarity limits.`);
    const picked=candidates.splice(best,1)[0];previous.push(picked);
    added.push({id:`dovetail-${source.length+added.length+1}`,words:picked.words});
    for(const w of picked.words)wordUse.set(w,(wordUse.get(w)||0)+1);
    for(const e of picked.edges)edgeUse.set(e,(edgeUse.get(e)||0)+1);
  }
  return {added,info:{originalRecords:source.length,preparedRecords:TARGET,approvedWords:wordUse.size,approvedDirectedJoins:edgeUse.size,distinctFusedWords:new Set([...edgeUse.keys()].map(e=>e.replace('|',''))).size,candidatesConsidered:candidateCount,maxSharedJoins:4,maxSharedConsecutiveWords:4,maxJoinReuse:Math.max(...edgeUse.values()),contentNote:'New chains recombine the original approved words and joins; no new dictionary entries.'}};
}

function splice(){
  const source=originals.splice,rng=random(0x5F11CE26),indices=Array.from({length:12},(_,i)=>i);
  // Preserve original records exactly, while keeping this dated source answer out
  // of newly prepared content. Dictionary membership is not editorial approval.
  const excludedAdditionalAnswers=new Set(['midget']);
  const pairs=[...new Map(source.flatMap(p=>p.parts.map(pair=>[pair.join('|'),pair]))).values()].sort((a,b)=>a.join('|').localeCompare(b.join('|')));
  const partner=new Map();
  const tiles=[...new Set(pairs.flat())].sort();
  for(const a of tiles)partner.set(a,new Set(tiles.filter(b=>a!==b&&(S.FUSED.has(a+b)||S.FUSED.has(b+a)))));
  const neighbors=pairs.map(pair=>pairs.map((other,j)=>({other,j})).filter(({other})=>pair.some(a=>other.some(b=>partner.get(a).has(b)))).map(({j})=>j));
  const wordUse=counter(source.flatMap(p=>p.parts.map(pair=>pair.join(''))));
  const previous=source.map(p=>new Set(p.parts.map(pair=>pair.join(''))));
  const seen=new Set(source.map(p=>p.parts.flat().sort().join('|'))),added=[];
  let attempts=0;
  while(source.length+added.length<TARGET&&attempts<250_000){
    attempts++;
    const selected=[Math.floor(rng()*pairs.length)],used=new Set(pairs[selected[0]]);
    while(selected.length<6){
      const choices=[...new Set(selected.flatMap(i=>neighbors[i]))].filter(i=>pairs[i].every(tile=>!used.has(tile))&&!selected.some(j=>pairs[j].join('')===pairs[i].join('')));
      if(!choices.length)break;
      // Favor less-used approved words without making selection order non-deterministic.
      const sampled=shuffled(choices,rng).slice(0,10).sort((a,b)=>(wordUse.get(pairs[a].join(''))||0)-(wordUse.get(pairs[b].join(''))||0));
      const next=sampled[Math.floor(rng()*Math.min(3,sampled.length))];selected.push(next);for(const tile of pairs[next])used.add(tile);
    }
    if(selected.length!==6)continue;
    const parts=selected.map(i=>[...pairs[i]]),signature=parts.flat().sort().join('|');
    if(seen.has(signature))continue;
    const words=new Set(parts.map(pair=>pair.join('')));
    if([...words].some(word=>excludedAdditionalAnswers.has(word)))continue;
    if(!previous.every(old=>intersection(words,old)<=3))continue;
    const flat=parts.flat(),degrees=flat.map(()=>new Set());let directed=0;
    for(let i=0;i<12;i++)for(let j=0;j<12;j++)if(i!==j&&S.FUSED.has(flat[i]+flat[j])){directed++;degrees[i].add(j);degrees[j].add(i);}
    if(directed<11||degrees.filter(n=>n.size<2).length>2)continue;
    const p={id:`splice-${source.length+added.length+1}`,parts};
    if(findMatchings(p,indices,2).length!==1)continue;
    added.push(p);seen.add(signature);previous.push(words);for(const word of words)wordUse.set(word,(wordUse.get(word)||0)+1);
  }
  if(source.length+added.length<TARGET)throw Error(`Splice: only ${source.length+added.length} substantive bins satisfy unique matching and trap constraints.`);
  return {added,info:{originalRecords:source.length,preparedRecords:TARGET,approvedWords:379,approvedFragmentPairs:pairs.length,approvedFragments:tiles.length,excludedAdditionalAnswers:[...excludedAdditionalAnswers],attempts,maxSharedAnswers:3,minimumWordJoins:11,maximumIsolatedTiles:2,contentNote:'New bins recombine source fragment pairs after an additional editorial exclusion; each new bin has exactly one oriented complete matching.'}};
}

function keystone(){
  const source=originals.keystone,added=[];
  // Each original day already supplies one arch from each difficulty band. The first
  // extra cycle uses every arch once. New combinations never reuse a pair of arches.
  for(let i=0;source.length+added.length<TARGET;i++){
    const cycle=Math.floor(i/source.length),base=i%source.length;
    const offsets=cycle===0?[0,19,37]:[0,7,29];
    const rounds=offsets.map((offset,slot)=>clone(source[(base+offset)%source.length].rounds[slot]));
    added.push({id:`keystone-${String(source.length+added.length+1).padStart(3,'0')}`,rounds});
  }
  return {added,info:{originalRecords:source.length,preparedRecords:TARGET,uniqueArches:174,archesPerDay:3,maxSharedArchesBetweenNewDays:1,maxArchUses:3,contentNote:'120 different three-arch sets drawn from the original 174 approved arches; arches recur in new combinations.'}};
}

const output=[];
for(const [slug,build] of [['dovetail',dovetail],['splice',splice],['keystone',keystone]]){
  const file=new URL(`../games/claude-${slug}/puzzles.mjs`,import.meta.url),current=await readFile(file,'utf8'),original=current.split(MARKER)[0];
  assert.equal(sha(original),hashes[slug],`${slug}: original source changed; review instead of silently regenerating it.`);
  const {added,info}=build();
  const generated=original+MARKER+'\n// Additional prepared combinations by ChatGPT; original Claude records above are unchanged.\n'+
    `PUZZLES.push(...${JSON.stringify(added)});\nexport const CONTENT_INFO = Object.freeze(${JSON.stringify(info)});\n`;
  output.push({slug,file,current,generated,info});
}
// Build all banks before changing any file, so a failed search leaves the source intact.
for(const item of output){
  if(process.argv.includes('--check'))assert.equal(item.current,item.generated,`${item.slug}: regenerate the prepared expansion.`);
  else await writeFile(item.file,item.generated);
  console.log(`${item.slug}: ${item.info.preparedRecords} prepared records; ${JSON.stringify(item.info)}`);
}
