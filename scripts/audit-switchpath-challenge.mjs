import {PUZZLES} from '../games/switchpath/puzzles.mjs';
import {getDaily} from '../games/switchpath/engine.mjs';
import {writeFile} from 'node:fs/promises';
// Independent local-move enumeration; these are structural metrics, not human difficulty scores.
function choices(p,path){
 const a=path.at(-1);
 return p.values.map((_,i)=>i).filter(b=>!path.includes(b)
   && Math.abs(a%4-b%4)+Math.abs(Math.floor(a/4)-Math.floor(b/4))===1
   && (b!==p.end||path.length===15)
   && (path.length%2?p.values[b]>p.values[a]:p.values[b]<p.values[a]));
}
function deepest(p,path){
 const next=choices(p,path);
 return next.length?1+Math.max(...next.map(cell=>deepest(p,[...path,cell]))):0;
}
const boards=PUZZLES.map(p=>{
 let branches=0;const wrongBranches=[];
 for(let i=0;i<15;i++){
  const prefix=p.solution.slice(0,i+1),next=choices(p,prefix);if(next.length>1)branches++;
  for(const cell of next.filter(c=>c!==p.solution[i+1]))wrongBranches.push({atStep:i+1,survivesMoves:1+deepest(p,[...prefix,cell])});
 }
 return {id:p.id,label:p.difficulty,branches,wrongChoices:wrongBranches.length,longestWrongBranch:Math.max(0,...wrongBranches.map(x=>x.survivesMoves))};
});
const daily=getDaily(PUZZLES,new Date('2026-10-30T18:00:00Z'));
const bounds=key=>({min:Math.min(...boards.map(x=>x[key])),max:Math.max(...boards.map(x=>x[key])),mean:Math.round(boards.reduce((a,b)=>a+b[key],0)/boards.length*100)/100});
const result={date:'2026-10-30',method:'Independent orthogonal/alternating move enumeration along each authored unique solution; wrong-branch length includes the wrong step',humanDifficulty:false,boards:boards.length,branches:bounds('branches'),wrongBranchDepth:bounds('longestWrongBranch'),daily:boards.find(b=>b.id===daily.puzzle.id),perBoard:boards};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,perBoard:undefined},null,2));
