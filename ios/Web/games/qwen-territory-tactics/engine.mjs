const DIRECTIONS=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const coordinate=key=>key.split(',').map(Number);
export function cells(p){const result=[];for(let r=-p.radius;r<=p.radius;r++)for(let q=-p.radius;q<=p.radius;q++)if(Math.abs(q+r)<=p.radius)result.push(`${q},${r}`);return result;}
export function neighbors(p,key){const [q,r]=coordinate(key),inside=new Set(cells(p));return DIRECTIONS.map(([a,b])=>`${q+a},${r+b}`).filter(x=>inside.has(x));}
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
    if(board.captured>=p.target){wins.push(moves);return;}
    if(moves.length===p.maxMoves)return;
    for(const key of cells(p)){
      const next=applyMove(p,board,key);if(next)search(next,[...moves,key]);
    }
  }
  search(initial,[...prefix]);return wins;
}
export const createState=()=>({moves:[],hints:0,lastHint:null,revealed:false});
export function getStatus(p,s){if(s.revealed)return 'revealed';return (simulate(p,s.moves)?.captured||0)>=p.target?'won':'playing';}
export function restoreState(p,raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.moves)||!Number.isInteger(raw.hints)||raw.hints<0||raw.hints>100000||![null,'move','undo'].includes(raw.lastHint)||typeof raw.revealed!=='boolean')return null;
  if(raw.moves.some(key=>typeof key!=='string'))return null;
  const board=simulate(p,raw.moves);if(!board)return null;
  if(raw.revealed&&board.captured<p.target)return null;
  // A completed capture ends the game; no stored extra move can follow it.
  for(let n=1;n<raw.moves.length;n++)if(simulate(p,raw.moves.slice(0,n)).captured>=p.target)return null;
  return {moves:[...raw.moves],hints:raw.hints,lastHint:raw.lastHint,revealed:raw.revealed};
}
export function place(p,s,key){
  if(getStatus(p,s)!=='playing')return {state:s,message:'This position is complete.'};
  if(s.moves.length===p.maxMoves)return {state:s,message:'Two moves used. Undo or restart to try another plan.'};
  const before=simulate(p,s.moves);
  if(before.friendly.includes(key)||before.enemy.includes(key)||!cells(p).includes(key))return {state:s,message:'Choose an empty hex.'};
  const after=applyMove(p,before,key);
  if(!after)return {state:s,message:'That stone would have no liberty. Find another placement.'};
  const state={...s,moves:[...s.moves,key],lastHint:null};
  return {state,message:after.captured>=p.target?`${after.captured} stones captured. A clean tactical finish!`:state.moves.length===p.maxMoves?'No capture yet. Undo or restart to investigate another route.':`${p.maxMoves-state.moves.length} move left. Close the remaining liberties.`};
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
