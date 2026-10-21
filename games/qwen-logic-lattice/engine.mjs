const SIZE=5,CELLS=25;
const cellOK=v=>v===-1||v===0||v===1;
const indexOK=i=>Number.isInteger(i)&&i>=0&&i<CELLS;
const givenMap=p=>new Map(p.givens);
function validCells(p,cells){return Array.isArray(cells)&&cells.length===CELLS&&cells.every(cellOK)&&p.givens.every(([i,v])=>cells[i]===v);}
function initialCells(p){const cells=Array(CELLS).fill(-1);p.givens.forEach(([i,v])=>{cells[i]=v;});return cells;}
export function createState(p){return {cells:initialCells(p),history:[],hinted:[],lastHint:null,revealed:false};}
export function clueStatus(p,cells){
 const lines=[];
 for(let r=0;r<SIZE;r++)lines.push({kind:'row',index:r,label:`Row ${r+1}`,target:p.rows[r],indices:Array.from({length:SIZE},(_,c)=>r*SIZE+c)});
 for(let c=0;c<SIZE;c++)lines.push({kind:'column',index:c,label:`Column ${c+1}`,target:p.columns[c],indices:Array.from({length:SIZE},(_,r)=>r*SIZE+c)});
 lines.push({kind:'diagonal',index:0,label:'Top-left to bottom-right diagonal',target:p.diagonals[0],indices:[0,6,12,18,24]},{kind:'diagonal',index:1,label:'Top-right to bottom-left diagonal',target:p.diagonals[1],indices:[4,8,12,16,20]});
 return lines.map(line=>{const black=line.indices.filter(i=>cells[i]===1).length,unknown=line.indices.filter(i=>cells[i]===-1).length;return {...line,black,unknown,status:black>line.target||black+unknown<line.target?'contradiction':unknown===0?'satisfied':'pending'};});
}
export function constraintsSatisfied(p,cells){return validCells(p,cells)&&cells.every(v=>v!==-1)&&clueStatus(p,cells).every(c=>c.status==='satisfied');}
export function getStatus(p,s){return s.revealed?'revealed':constraintsSatisfied(p,s.cells)?'won':'playing';}
function remember(s,cells,lastHint=null){return {...s,cells,history:[...s.history.slice(-99),[...s.cells]],lastHint};}
export function toggleCell(p,s,index){
 if(getStatus(p,s)!=='playing'||!indexOK(index)||givenMap(p).has(index))return s;
 const cells=[...s.cells];cells[index]=cells[index]===-1?1:cells[index]===1?0:-1;return remember(s,cells);
}
export function undo(p,s){if(getStatus(p,s)!=='playing'||!s.history.length)return s;return {...s,cells:[...s.history.at(-1)],history:s.history.slice(0,-1),lastHint:null};}
export function restart(p,s){return getStatus(p,s)==='playing'?{...createState(p),hinted:[...s.hinted]}:s;}
export function hint(p,s){
 if(getStatus(p,s)!=='playing')return null;
 const index=s.cells.findIndex((v,i)=>v!==p.solution[i]);if(index<0)return null;
 const cells=[...s.cells];cells[index]=p.solution[index];return {...remember(s,cells,index),hinted:[...new Set([...s.hinted,index])]};
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,cells:[...p.solution],history:[],lastHint:null,revealed:true}:s;}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean'||!validCells(p,raw.cells))return null;
 if(!Array.isArray(raw.history)||raw.history.length>100||!raw.history.every(cells=>validCells(p,cells)))return null;
 if(!Array.isArray(raw.hinted)||raw.hinted.length>25||new Set(raw.hinted).size!==raw.hinted.length||!raw.hinted.every(i=>indexOK(i)&&!givenMap(p).has(i)))return null;
 if(raw.lastHint!==null&&(!indexOK(raw.lastHint)||!raw.hinted.includes(raw.lastHint)||raw.cells[raw.lastHint]!==p.solution[raw.lastHint]))return null;
 if(raw.revealed&&!constraintsSatisfied(p,raw.cells))return null;
 return {cells:[...raw.cells],history:raw.history.map(c=>[...c]),hinted:[...raw.hinted],lastHint:raw.lastHint,revealed:raw.revealed};
}

// Enumerate actual constraint solutions. No answer-key comparison is used here.
// Row candidates and remaining column/diagonal capacity prune the small search.
export function solvePuzzle(p,limit=2){
 const givens=givenMap(p),rowOptions=[];
 for(let row=0;row<SIZE;row++){
  const options=[];
  for(let mask=0;mask<32;mask++){
   const values=Array.from({length:SIZE},(_,c)=>(mask>>c)&1);
   if(values.reduce((a,b)=>a+b,0)!==p.rows[row])continue;
   if(values.some((v,c)=>givens.has(row*SIZE+c)&&givens.get(row*SIZE+c)!==v))continue;
   options.push(values);
  }
  rowOptions.push(options);
 }
 const results=[],columnSums=Array(SIZE).fill(0),diagonalSums=[0,0],cells=[];
 function visit(row){
  if(results.length>=limit)return;
  if(row===SIZE){if(columnSums.every((v,c)=>v===p.columns[c])&&diagonalSums.every((v,i)=>v===p.diagonals[i]))results.push([...cells]);return;}
  for(const values of rowOptions[row]){
   const remaining=SIZE-row-1;
   if(values.some((v,c)=>columnSums[c]+v>p.columns[c]||columnSums[c]+v+remaining<p.columns[c]))continue;
   const diagonalValues=[values[row],values[SIZE-row-1]];
   if(diagonalValues.some((v,i)=>diagonalSums[i]+v>p.diagonals[i]||diagonalSums[i]+v+remaining<p.diagonals[i]))continue;
   values.forEach((v,c)=>{columnSums[c]+=v;});diagonalValues.forEach((v,i)=>{diagonalSums[i]+=v;});cells.push(...values);
   visit(row+1);
   cells.length-=SIZE;values.forEach((v,c)=>{columnSums[c]-=v;});diagonalValues.forEach((v,i)=>{diagonalSums[i]-=v;});
   if(results.length>=limit)return;
  }
 }
 visit(0);return results;
}
