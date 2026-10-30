// Opus follow-up: a basic no-search forcing audit, not a human difficulty rating.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PUZZLES} from '../games/switchpath/puzzles.mjs';
const color=c=>(c%4+Math.floor(c/4))%2;
const key=(a,b)=>[a,b].sort((x,y)=>x-y).join('-');
const boards=PUZZLES.map(p=>{
 const edges=[];
 for(let a=0;a<16;a++)for(const b of [a%4<3?a+1:-1,a<12?a+4:-1])if(b>=0){
  const valley=color(a)===color(p.start)?a:b,peak=valley===a?b:a;
  if(p.values[valley]<p.values[peak])edges.push({a,b,key:key(a,b),state:0});
 }
 const solution=new Set(p.solution.slice(1).map((b,i)=>key(p.solution[i],b)));
 assert.ok([...solution].every(k=>edges.some(e=>e.key===k)),`${p.id}: static graph must admit actual route`);
 let rounds=0,changed;
 do{
  changed=false;rounds++;
  for(let v=0;v<16;v++){
   const incident=edges.filter(e=>e.a===v||e.b===v),required=v===p.start||v===p.end?1:2;
   const selected=incident.filter(e=>e.state===1),available=incident.filter(e=>e.state!==-1),unknown=incident.filter(e=>e.state===0);
   assert.ok(selected.length<=required&&available.length>=required,`${p.id}: degree contradiction`);
   let state=0;if(selected.length===required)state=-1;else if(available.length===required)state=1;
   if(state)for(const e of unknown){e.state=state;changed=true;}
  }
 }while(changed);
 const forced=edges.filter(e=>e.state===1),excluded=edges.filter(e=>e.state===-1);
 assert.ok(forced.every(e=>solution.has(e.key)),`${p.id}: forced edge disagrees with exhaustive unique solution`);
 assert.ok(excluded.every(e=>!solution.has(e.key)),`${p.id}: removed solution edge`);
 return {id:p.id,initialEdges:edges.length,forcedEdges:forced.length,undecidedEdges:edges.filter(e=>e.state===0).length,solvedByDegreeOnly:forced.length===15,rounds:rounds-1};
});
const result={date:'2026-10-30',humanDifficulty:false,method:'Filter adjacent edges by checkerboard valley/peak comparison. Repeatedly include all remaining edges when a vertex has exactly its required degree, or exclude extras once its required edges are selected. S/E require degree1, others degree2. No guessing, connectivity deduction or subtour pruning. Every conclusion cross-checked against the previously exhaustive unique solution.',boards:boards.length,solvedByDegreeOnly:boards.filter(b=>b.solvedByDegreeOnly).length,requireMoreThanDegreeOnly:boards.filter(b=>!b.solvedByDegreeOnly).length,minForcedEdges:Math.min(...boards.map(b=>b.forcedEdges)),maxForcedEdges:Math.max(...boards.map(b=>b.forcedEdges)),daily:boards.find(b=>b.id==='switchpath-011'),perBoard:boards};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,perBoard:undefined},null,2));
