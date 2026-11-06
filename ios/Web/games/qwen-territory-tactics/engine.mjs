const DIRECTIONS=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const coordinate=key=>key.split(',').map(Number);
const geometry=new Map();
function grid(p){
  if(!geometry.has(p.radius)){
    const keys=[];for(let r=-p.radius;r<=p.radius;r++)for(let q=-p.radius;q<=p.radius;q++)if(Math.abs(q+r)<=p.radius)keys.push(`${q},${r}`);
    const inside=new Set(keys),adjacent=new Map(keys.map(key=>{const [q,r]=coordinate(key);return [key,DIRECTIONS.map(([a,b])=>`${q+a},${r+b}`).filter(x=>inside.has(x))];}));
    geometry.set(p.radius,{keys,adjacent});
  }
  return geometry.get(p.radius);
}
export const goalReached=(p,captured)=>p.captureRule==='exact'?captured===p.target:captured>=p.target;
export const overshot=(p,captured)=>p.captureRule==='exact'&&captured>p.target;
export function cells(p){return [...grid(p).keys];}
export function neighbors(p,key){return [...(grid(p).adjacent.get(key)||[])];}
export function groups(p,stones){const unseen=new Set(stones),result=[];while(unseen.size){const first=unseen.values().next().value;unseen.delete(first);const group=[first],queue=[first];while(queue.length){for(const next of neighbors(p,queue.pop()))if(unseen.has(next)){unseen.delete(next);group.push(next);queue.push(next);}}result.push(group);}return result;}
export function liberties(p,group,friendly,enemy){const occupied=new Set([...friendly,...enemy]);return [...new Set(group.flatMap(key=>neighbors(p,key)).filter(key=>!occupied.has(key)))];}
export function applyMove(p,board,key){
  if(!cells(p).includes(key)||board.friendly.includes(key)||board.enemy.includes(key))return null;
  const friendly=[...board.friendly,key],captured=[];
  for(const group of groups(p,board.enemy))if(liberties(p,group,friendly,board.enemy).length===0)captured.push(...group);
  const enemy=board.enemy.filter(key=>!captured.includes(key));
  const own=groups(p,friendly).find(group=>group.includes(key));
  if(!liberties(p,own,friendly,enemy).length)return null;
  return {friendly,enemy,captured:board.captured+captured.length};
}
export function simulate(p,moves){
  if(!Array.isArray(moves)||moves.length>p.maxMoves)return null;
  let board={friendly:[...p.friendly],enemy:[...p.enemy],captured:0};
  for(const key of moves){board=applyMove(p,board,key);if(!board)return null;}
  return board;
}
export function winningPaths(p,prefix=[]){
  const initial=simulate(p,prefix);if(!initial)return [];
  const wins=[];
  function search(board,moves){
    if(goalReached(p,board.captured)){wins.push(moves);return;}
    if(overshot(p,board.captured)||moves.length===p.maxMoves)return;
    for(const key of cells(p)){
      const next=applyMove(p,board,key);if(next)search(next,[...moves,key]);
    }
  }
  search(initial,[...prefix]);return wins;
}
export const createState=()=>({moves:[],hints:0,lastHint:null,revealed:false});
export function getStatus(p,s){if(s.revealed)return 'revealed';return goalReached(p,simulate(p,s.moves)?.captured||0)?'won':'playing';}
export function restoreState(p,raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.moves)||!Number.isInteger(raw.hints)||raw.hints<0||raw.hints>100000||![null,'move','undo'].includes(raw.lastHint)||typeof raw.revealed!=='boolean')return null;
  if(raw.moves.some(key=>typeof key!=='string'))return null;
  const board=simulate(p,raw.moves);if(!board)return null;
  if(raw.revealed&&!goalReached(p,board.captured))return null;
  // A completed capture ends the game; no stored extra move can follow it.
  for(let n=1;n<raw.moves.length;n++)if(goalReached(p,simulate(p,raw.moves.slice(0,n)).captured)||overshot(p,simulate(p,raw.moves.slice(0,n)).captured))return null;
  return {moves:[...raw.moves],hints:raw.hints,lastHint:raw.lastHint,revealed:raw.revealed};
}
export function place(p,s,key){
  if(getStatus(p,s)!=='playing')return {state:s,message:'This position is complete.'};
  if(s.moves.length===p.maxMoves)return {state:s,message:`All ${p.maxMoves} placements used. Undo or restart to try another plan.`};
  const before=simulate(p,s.moves);
  if(overshot(p,before.captured))return {state:s,message:`${before.captured} captured: too many. Undo to reach exactly ${p.target}.`};
  if(before.friendly.includes(key)||before.enemy.includes(key)||!cells(p).includes(key))return {state:s,message:'Choose an empty hex.'};
  const after=applyMove(p,before,key);
  if(!after)return {state:s,message:'That stone would have no liberty. Find another placement.'};
  const state={...s,moves:[...s.moves,key],lastHint:null};
  if(p.captureRule==='exact'){
    const left=p.maxMoves-state.moves.length,remaining=p.target-after.captured;
    return {state,message:goalReached(p,after.captured)?`Exactly ${p.target} stones captured. A precise tactical finish!`:overshot(p,after.captured)?`${after.captured} captured: ${-remaining} too many. Undo to reach exactly ${p.target}.`:`${after.captured} captured; ${remaining} more needed for exactly ${p.target}. ${left?`${left} placement${left===1?'':'s'} left.`:'No placements left. Undo or restart.'}`};
  }
  return {state,message:goalReached(p,after.captured)?`${after.captured} stones captured. A clean tactical finish!`:state.moves.length===p.maxMoves?`${after.captured} ${after.captured===1?'stone':'stones'} captured; ${p.target} needed. Undo or restart to investigate another route.`:`${p.maxMoves-state.moves.length} move left. Close the remaining liberties.`};
}
export const undo=(p,s)=>getStatus(p,s)==='playing'?{...s,moves:s.moves.slice(0,-1),lastHint:null}:s;
export const restart=(p,s)=>getStatus(p,s)==='playing'?{...s,moves:[],lastHint:null}:s;
export function hint(p,s){
  if(getStatus(p,s)!=='playing')return s;
  const route=winningPaths(p,s.moves)[0];
  if(route)return {...s,moves:route.slice(0,s.moves.length+1),hints:s.hints+1,lastHint:'move'};
  if(s.moves.length)return {...s,moves:s.moves.slice(0,-1),hints:s.hints+1,lastHint:'undo'};
  return s;
}
export function reveal(p,s){
  if(getStatus(p,s)!=='playing')return s;
  const route=winningPaths(p,[])[0];return route?{...s,moves:route,lastHint:null,revealed:true}:s;
}
export const summarize=(p,s)=>`${simulate(p,s.moves)?.captured||0} stones captured · ${s.moves.length}/${p.maxMoves} moves · ${s.hints} hint${s.hints===1?'':'s'}`;
