/** Independent source-word enumeration and word-edge oracle, not the generator. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PUZZLES as sprouts} from '../../games/claude-sprout/puzzles.mjs';
import {WORD_GAME_LEVELS,WORD_GAME_INFO} from '../../games/claude-sprout/vocabulary.mjs';
import * as Sprout from '../../games/claude-sprout/engine.mjs';
import {PUZZLES as splices,FUSED} from '../../games/claude-splice/puzzles.mjs';
import {WORD_GAME_JOINS} from '../../games/claude-splice/vocabulary.mjs';
import * as Splice from '../../games/claude-splice/engine.mjs';
import {PUZZLES as keystones,COMMON as KEY_COMMON,FUSED as KEY_FUSED} from '../../games/claude-keystone/puzzles.mjs';
import {WORD_GAME_WORDS as KEY_WORDS,WORD_GAME_ALTERNATIVES} from '../../games/claude-keystone/vocabulary.mjs';
import * as Keystone from '../../games/claude-keystone/engine.mjs';
import {PUZZLES as dovetails,COMMON as DOVE_COMMON,FUSED as DOVE_FUSED} from '../../games/claude-dovetail/puzzles.mjs';
import {WORD_GAME_WORDS as DOVE_WORDS} from '../../games/claude-dovetail/vocabulary.mjs';
import * as Dovetail from '../../games/claude-dovetail/engine.mjs';
import {PUZZLES as tangles,DICTIONARY as TANGLE_DICTIONARY} from '../../games/claude-tangle/puzzles.mjs';
import {WORD_GAME_PATHS} from '../../games/claude-tangle/vocabulary.mjs';
import * as Tangle from '../../games/claude-tangle/engine.mjs';
import {GUESS_WORDS,ANSWERS} from '../../games/claude-tumbler/puzzles.mjs';
import {WORD_GAME_GUESSES} from '../../games/claude-tumbler/vocabulary.mjs';
import * as Tumbler from '../../games/claude-tumbler/engine.mjs';
import {calendarDates,loadDailyAudit} from '../../scripts/daily-audit-lib.mjs';
const root=new URL('../../',import.meta.url),data=new URL('packages/kimi-pebbles/data/',root);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const counts=word=>{const c=new Uint8Array(26);for(const ch of word)c[ch.charCodeAt(0)-97]++;return c;};
const fits=(word,pool)=>word.every((n,i)=>n<=pool[i]);
const grows=(a,b)=>{let difference=0;for(let i=0;i<26;i++){if(b[i]<a[i])return false;difference+=b[i]-a[i];}return difference===1;};
export async function audit(){
 const english=JSON.parse(await readFile(new URL('english-words-source.json',data),'utf8'));
 const other=JSON.parse(await readFile(new URL('word-game-sources.json',data),'utf8'));
 const definitions=[
  ['english-words-alpha.txt',english.files['words_alpha.txt'].sha256,'plain'],
  ['wordnik-game-words.txt',other.find(s=>s.repository.endsWith('/wordlist')).files['wordlist-20210729.txt'].sha256,'quoted'],
  ['enable2k.txt.gz',other.find(s=>s.repository.endsWith('/wordlists')).files['enable2k.txt.gz'].sha256,'gzip'],
 ];
 const dictionary=new Set(),pins=[];
 for(const [file,expected,type]of definitions){
  const bytes=await readFile(new URL(file,data));assert.equal(sha(bytes),expected,file);
  const text=type==='gzip'?gunzipSync(bytes).toString('utf8'):bytes.toString('utf8');
  const entries=type==='quoted'?text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)):text.split(/\s+/);
  for(const w of entries)if(/^[a-z]+$/.test(w))dictionary.add(w);
  pins.push({file,sha256:sha(bytes)});
 }
 for(const w of JSON.parse(await readFile(new URL('zynga-disclosed-words.json',data),'utf8')).words)dictionary.add(w);
 assert.equal(dictionary.size,WORD_GAME_INFO.sourceUnion);
 const policy=JSON.parse(await readFile(new URL('scripts/claude-sprout-editorial-exclusions.json',root),'utf8'));
 const excluded=new Set(Object.values(policy).filter(Array.isArray).flat());
 const candidates=[...dictionary].filter(w=>/^[a-z]{4,8}$/.test(w)&&!excluded.has(w)).map(w=>({w,c:counts(w)}));
 let entries=0,alive=0,dead=0,newEntries=0,reachableEdges=0;
 const perBoard=[];
 for(const p of sprouts){
  const full=counts(p.seed+p.pool),expected=new Map(candidates.filter(({c})=>fits(c,full)).map(({w,c})=>[w,c]));
  const old=new Set(Object.values(p.levels).flatMap(l=>[...l.a,...l.d]));
  for(const w of old)if(!excluded.has(w))expected.set(w,counts(w));
  const list=[...expected].map(([w,c])=>({w,c})),byLength=new Map();
  for(let n=4;n<=8;n++)byLength.set(n,list.filter(x=>x.w.length===n));
  const edges=new Map(),viable=new Map();
  function survives(word){
   if(viable.has(word))return viable.get(word);
   const wordCounts=expected.get(word)??counts(word);
   const next=(byLength.get(word.length+1)??[]).filter(x=>grows(wordCounts,x.c)).map(x=>x.w);
   edges.set(word,next);
   const yes=word.length===8||next.some(survives);viable.set(word,yes);return yes;
  }
  const actual=WORD_GAME_LEVELS[p.id],actualWords=Object.values(actual).flatMap(l=>[...l.a,...l.d]);
  assert.deepEqual(new Set(actualWords),new Set(expected.keys()),p.id+' complete source membership');
  for(const word of actualWords){
   const correct=survives(word);assert.equal(actual[word.length].a.includes(word),correct,p.id+':'+word);
   entries++;if(correct)alive++;else dead++;if(!old.has(word))newEntries++;
  }
  // A state reached through any viable path conserves the same remaining bag.
  let reachableDeadEdges=0;const visited=new Set(),queue=[p.seed];
  while(queue.length){
   const word=queue.pop();if(visited.has(word)||word.length===8)continue;visited.add(word);
   survives(word);for(const next of edges.get(word)){reachableEdges++;if(survives(next))queue.push(next);else reachableDeadEdges++;}
  }
  const state=Sprout.createExpandedState(),route=Sprout.solutionPath(p,state);assert.equal(route.length,6);
  perBoard.push({id:p.id,entries:actualWords.length,reachableStates:visited.size,reachableDeadEdges,wordSetSha256:sha(JSON.stringify([...expected.keys()].sort()))});
 }
 const expectedJoins=new Set(FUSED);let splicePairs=0,spliceListed=0,spliceSafe=0,spliceTraps=0;
 for(const p of splices){
  const tiles=p.parts.flat(),known=word=>FUSED.has(word)||(dictionary.has(word)&&!excluded.has(word)),memo=new Map();
  function canPair(mask){
   if(mask===0)return true;if(memo.has(mask))return memo.get(mask);
   let a=0;while(!(mask&(1<<a)))a++;
   for(let b=a+1;b<12;b++)if((mask&(1<<b))&&(known(tiles[a]+tiles[b])||known(tiles[b]+tiles[a]))&&canPair(mask&~(1<<a)&~(1<<b))){memo.set(mask,true);return true;}
   memo.set(mask,false);return false;
  }
  assert.equal(canPair(4095),true,p.id);
  for(let a=0;a<12;a++)for(let b=0;b<12;b++)if(a!==b){
   splicePairs++;const word=tiles[a]+tiles[b],listed=known(word),safe=listed&&canPair(4095&~(1<<a)&~(1<<b));
   if(listed){expectedJoins.add(word);spliceListed++;if(safe)spliceSafe++;else spliceTraps++;}
   let state=Splice.createExpandedState(p);state=Splice.chooseTile(p,state,a);state=Splice.chooseTile(p,state,b);
   const result=Splice.submitPair(p,state).state;assert.equal(result.attempts.length,listed?1:0,p.id+':'+word);
   const actual=Splice.analyze(p,result);assert.equal(actual.used.size,safe?2:0);assert.equal(actual.mistakes,listed&&!safe?1:0);assert.ok(Splice.restoreState(p,result));
  }
  let state=Splice.createExpandedState(p);for(const pair of Splice.solutionPairs(p,state)){for(const tile of pair)state=Splice.chooseTile(p,state,tile);state=Splice.submitPair(p,state).state;assert.ok(Splice.restoreState(p,state));}assert.equal(Splice.getStatus(p,state),'won');
 }
 assert.deepEqual(WORD_GAME_JOINS,expectedJoins);
 const expectedKeyWords=new Set([...KEY_COMMON,...[...dictionary].filter(w=>/^[a-z]{3,9}$/.test(w)&&!excluded.has(w))].filter(w=>/^[a-z]{3,9}$/.test(w)));
 assert.deepEqual(KEY_WORDS,expectedKeyWords);
 const keyJoins=new Set([...KEY_FUSED,...[...dictionary].filter(w=>!excluded.has(w))]),seenArches=new Set();
 let archesWithAlternates=0,acceptedArchAnswers=0,partialMatchesChecked=0;
 for(const p of keystones)for(const round of p.rounds){
  const key=Keystone.roundKey(round);if(seenArches.has(key))continue;seenArches.add(key);
  const first=round.clues[0].w,possible=new Set();
  for(const joined of keyJoins){if(joined.startsWith(first))possible.add(joined.slice(first.length));if(joined.endsWith(first))possible.add(joined.slice(0,-first.length));}
  const fitsAll=word=>round.clues.every(c=>keyJoins.has(word+c.w)||keyJoins.has(c.w+word));
  const candidates=[...possible].filter(w=>expectedKeyWords.has(w)&&!round.clues.some(c=>c.w===w));
  const expected=new Set([round.k,...candidates.filter(fitsAll)]);
  assert.deepEqual(new Set(WORD_GAME_ALTERNATIVES[key]),expected,key);
  if(expected.size>1)archesWithAlternates++;
  for(const word of expected){const result=Keystone.roundView(round,[{type:'guess',word}],2);assert.equal(result.status,'won',key+':'+word);assert.equal(result.score,2);assert.equal(result.answer,word);acceptedArchAnswers++;}
  const partial=candidates.find(w=>!fitsAll(w)&&round.clues.slice(0,2).every(c=>keyJoins.has(w+c.w)||keyJoins.has(c.w+w)));
  if(partial){const result=Keystone.roundView(round,[{type:'guess',word:partial}],2);assert.equal(result.status,'playing');assert.deepEqual(result.guesses[0].fits,[true,true]);assert.equal(result.clues,3);partialMatchesChecked++;}
 }
 const doveLengths=new Set(dovetails.flatMap(p=>p.words.slice(1,-1).map(w=>w.length))),expectedDoveWords=new Set([...DOVE_COMMON,...[...dictionary].filter(w=>doveLengths.has(w.length)&&!excluded.has(w))]);assert.deepEqual(DOVE_WORDS,expectedDoveWords);
 const doveJoins=new Set([...DOVE_FUSED,...[...dictionary].filter(w=>!excluded.has(w))]),afterCache=new Map();let directedAlternates=0;
 function after(left){if(!afterCache.has(left))afterCache.set(left,new Set([...doveJoins].filter(w=>w.startsWith(left)).map(w=>w.slice(left.length)).filter(w=>expectedDoveWords.has(w))));return afterCache.get(left);}
 for(const p of dovetails)for(let row=1;row<p.words.length-1;row++){
  const left=p.words[row-1],right=p.words[row+1],alternatives=[...after(left)].filter(w=>w.length===p.words[row].length&&doveJoins.has(w+right));
  let base=Dovetail.createExpandedState();for(let other=1;other<p.words.length-1;other++)if(other!==row){base=Dovetail.chooseRow(p,base,other);base=Dovetail.submitWord(p,base,p.words[other]).state;}
  base=Dovetail.chooseRow(p,base,row);
  for(const word of alternatives){const solved=Dovetail.submitWord(p,base,word).state;assert.equal(Dovetail.analyze(p,solved).solved[row],true,p.id+':'+word);assert.equal(Dovetail.analyze(p,solved).misses,0);assert.ok(Dovetail.restoreState(p,solved));if(word!==p.words[row])directedAlternates++;}
 }
 const threadWords=new Set([...dictionary,...TANGLE_DICTIONARY].filter(w=>/^[a-z]{5,7}$/.test(w)&&!excluded.has(w)));
 for(const p of tangles)for(const word of p.w)threadWords.add(word);
 let tanglePaths=0,safeFirstPulls=0,strandedFirstPulls=0,alternativeBoards=0,completePrefixes=0;const alternativeExamples=[];
 const bits=mask=>{let n=0;while(mask){mask&=mask-1;n++;}return n;};
 for(const p of tangles){
  const expected=new Map(),lengths=p.w.map(w=>w.length),byLength=new Map();
  // Independent combination enumeration; no trie or production partition helper.
  for(const length of new Set(lengths)){
   function enumerate(start,word,mask){if(word.length===length){if(threadWords.has(word))expected.set(mask,word);return;}for(let i=start;i<=p.s.length-(length-word.length);i++)enumerate(i+1,word+p.s[i],mask|(1<<i));}
   enumerate(0,'',0);
  }
  assert.deepEqual(new Set(WORD_GAME_PATHS[p.id]),new Set(expected.keys()),p.id+' full-source ordered paths');tanglePaths+=expected.size;
  for(const [mask,word]of expected){if(!byLength.has(word.length))byLength.set(word.length,[]);byLength.get(word.length).push(mask);}
  const full=(1<<p.s.length)-1,toIndices=mask=>[...p.s].map((_,i)=>i).filter(i=>mask&(1<<i));
  const play=(state,mask)=>{for(const i of toIndices(mask))state=Tangle.toggle(p,state,i).state;return Tangle.submit(p,state).state;};
  let hasAlternative=false;
  for(const [first,word]of expected){
   const target=lengths.indexOf(word.length),remaining=full^first,lens=lengths.filter((_,i)=>i!==target);
   const next=(byLength.get(lens[0])??[]).filter(mask=>(mask&remaining)===mask),completions=next.filter(mask=>expected.has(remaining^mask)&&bits(remaining^mask)===lens[1]);
   const safe=completions.length>0,state=play(Tangle.createExpandedState(),first),view=Tangle.view(p,state);
   // A bad copy is free when the same word has another exact-cover path.
   // Reconstruct that property from independently enumerated masks only.
   const otherCopies=safe||[...expected].some(([copy,sameWord])=>{
    if(sameWord!==word)return false;const left=full^copy;
    return (byLength.get(lens[0])??[]).some(mask=>(mask&left)===mask&&expected.has(left^mask)&&bits(left^mask)===lens[1]);
   });
   assert.equal(view.pulls.length,safe?1:0,p.id+':'+word);assert.equal(view.knots,otherCopies?0:1);assert.ok(Tangle.restoreState(p,state));
   if(!safe&&otherCopies){assert.deepEqual(state.events,[]);assert.deepEqual(state.selected,toIndices(first));}
   if(!safe){strandedFirstPulls++;continue;}safeFirstPulls++;
   if(!p.w.includes(word)){
    hasAlternative=true;if(alternativeExamples.length<12)alternativeExamples.push({id:p.id,original:p.w,words:[word,expected.get(completions[0]),expected.get(remaining^completions[0])],indices:[first,completions[0],remaining^completions[0]].map(toIndices)});
   }
   for(const second of [...new Set(lens.flatMap(length=>byLength.get(length)??[]))].filter(mask=>(mask&remaining)===mask)){
    const otherLengths=[...lens];otherLengths.splice(otherLengths.indexOf(expected.get(second).length),1);
    const complete=expected.has(remaining^second)&&bits(remaining^second)===otherLengths[0],after=play(state,second),actual=Tangle.view(p,after);
    const otherSecondCopies=complete||[...expected].some(([copy,sameWord])=>sameWord===expected.get(second)&&(copy&remaining)===copy&&expected.has(remaining^copy)&&bits(remaining^copy)===otherLengths[0]);
    assert.equal(actual.pulls.length,complete?2:1,p.id+' second prefix');assert.equal(actual.knots,otherSecondCopies?0:1);assert.ok(Tangle.restoreState(p,after));
    if(!complete&&otherSecondCopies){assert.deepEqual(after.events,state.events);assert.deepEqual(after.selected,toIndices(second));}
    if(complete){const won=play(after,remaining^second);assert.equal(Tangle.getStatus(p,won),'won');assert.ok(Tangle.restoreState(p,won));completePrefixes++;}
   }
  }
  if(hasAlternative)alternativeBoards++;
 }
 const tangleV2Keys=tangles.map(p=>p.s+':'+p.w.map(w=>w.length).sort().join(','));assert.equal(new Set(tangleV2Keys).size,tangles.length);
 const expectedGuesses=new Set([...GUESS_WORDS,...ANSWERS,...[...dictionary].filter(w=>/^[a-z]{5}$/.test(w)&&!excluded.has(w))]);
 assert.deepEqual(new Set(WORD_GAME_GUESSES),expectedGuesses);
 // Every accepted guess is submitted and restored, rather than only compared as a list.
 const target={answer:'about'};
 for(const word of WORD_GAME_GUESSES){const result=Tumbler.submit(target,Tumbler.setDraft(target,Tumbler.createState(),word));assert.deepEqual(result.state.guesses,[word]);assert.ok(Tumbler.restoreState(target,result.state));}
 const quartets=JSON.parse(await readFile(new URL('packages/kimi-pebbles/src/games/quartet/data/puzzles.json',root),'utf8'));
 const pools=new Map();for(const p of quartets)for(const g of p.groups){if(!pools.has(g.label))pools.set(g.label,new Set());for(const w of g.members)pools.get(g.label).add(w);}
 let alternatePartitions=0,crossCategoryChoices=0;
 for(const p of quartets){
  const words=p.groups.flatMap(g=>g.members);assert.equal(new Set(words).size,16);
  assert.deepEqual(p.groups.map(g=>g.tier).sort(),[1,2,3,4]);
  const choices=p.groups.map(g=>{
   const indices=words.map((w,i)=>pools.get(g.label).has(w)?i:-1).filter(i=>i>=0),out=[];
   for(let a=0;a<indices.length;a++)for(let b=a+1;b<indices.length;b++)for(let c=b+1;c<indices.length;c++)for(let d=c+1;d<indices.length;d++)out.push([indices[a],indices[b],indices[c],indices[d]].reduce((m,i)=>m|(1<<i),0));
   crossCategoryChoices+=out.length-1;return out;
  });
  let partitions=0;function visit(group,used){if(group===4){partitions++;return;}for(const mask of choices[group])if(!(used&mask))visit(group+1,used|mask);}visit(0,0);assert.ok(partitions>=1);alternatePartitions+=partitions-1;
 }
 const {games,cleanup}=await loadDailyAudit();let calendar;
 try{
  const dates=calendarDates('2026-11-01','2027-05-02');assert.equal(dates.length,182);
  calendar=games.filter(g=>g.creator==='Claude'||g.slug==='kimi-quartet').map(g=>{
   const selected=dates.map(date=>({date,...g.select(date)})),distinct=new Set(selected.map(x=>g.key(x.puzzle))).size;
   assert.equal(distinct,182,g.slug);return {slug:g.slug,stored:g.puzzles.length,bankDistinct:new Set(g.puzzles.map(g.key)).size,dates:dates.length,distinct,...(g.slug==='claude-tangle'?{partitionDistinct:new Set(selected.map(x=>x.puzzle.s+':'+x.puzzle.w.map(w=>w.length).sort().join(','))).size}:{}),ids:selected.map(x=>({date:x.date,puzzleId:x.puzzleId}))};
  });
 }finally{await cleanup();}
 return {maker:'Codex',scope:'Six Claude games and Kimi Quartet',sourceUnion:dictionary.size,pins,sprout:{boards:sprouts.length,entries,alive,dead,newEntries,reachableEdges,perBoard},splice:{boards:splices.length,joins:WORD_GAME_JOINS.size,originalJoins:FUSED.size,orderedPairsChecked:splicePairs,listedPairs:spliceListed,safePairs:spliceSafe,traps:spliceTraps},keystone:{uniqueArches:seenArches.size,archesWithAlternates,acceptedArchAnswers,partialMatchesChecked},dovetail:{boards:dovetails.length,directedAlternatesSubmitted:directedAlternates,guessWords:DOVE_WORDS.size},tangle:{boards:tangles.length,fullSourcePaths:tanglePaths,safeFirstPulls,strandedFirstPulls,alternativeBoards,completePrefixes,v2DistinctBoards:new Set(tangleV2Keys).size,alternativeExamples},tumbler:{acceptedGuesses:expectedGuesses.size,actualSubmittedAndRestored:WORD_GAME_GUESSES.length},quartet:{boards:quartets.length,categoryLabels:pools.size,alternatePartitions,crossCategoryChoices,meaning:'Known authored category memberships only; not proof against all human semantic interpretations.'},calendar};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=await audit();if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,sprout:{...report.sprout,perBoard:undefined},calendar:report.calendar.map(x=>({...x,ids:undefined}))},null,2));
}
