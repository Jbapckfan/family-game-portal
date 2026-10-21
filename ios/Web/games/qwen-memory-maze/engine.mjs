export const STUDY_MS=6000;
const CELL_COUNT=49;
const indexOK=i=>Number.isInteger(i)&&i>=0&&i<CELL_COUNT;
const nonnegative=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
export function adjacent(a,b){return indexOK(a)&&indexOK(b)&&Math.abs(Math.floor(a/7)-Math.floor(b/7))+Math.abs(a%7-b%7)===1;}
export function createState(){return {phase:'ready',remainingMs:0,trail:[],mistakes:0,elapsedMs:0,replays:0,lastWrong:null,flashMs:0,revealed:false};}
export function getStatus(p,s){return s.revealed?'revealed':s.phase==='recall'&&s.trail.length===p.path.length&&s.trail.every((cell,i)=>cell===p.path[i])?'won':'playing';}
export function startStudy(p,s){return getStatus(p,s)==='playing'&&s.phase==='ready'?{...s,phase:'study',remainingMs:STUDY_MS}:s;}
export function tick(p,s,deltaMs){
 if(getStatus(p,s)!=='playing'||!Number.isFinite(deltaMs)||deltaMs<=0||s.phase==='ready')return s;
 if(s.phase==='study'){const remainingMs=Math.max(0,s.remainingMs-deltaMs);return {...s,remainingMs,phase:remainingMs===0?'recall':'study'};}
 const flashMs=Math.max(0,s.flashMs-deltaMs);
 return {...s,elapsedMs:s.elapsedMs+deltaMs,flashMs,lastWrong:flashMs?s.lastWrong:null};
}
export function chooseCell(p,s,index){
 if(getStatus(p,s)!=='playing'||s.phase!=='recall'||!indexOK(index))return {state:s,message:'Study the route first, then retrace it.'};
 if(p.obstacles.includes(index))return {state:s,message:'That square is blocked. The remembered route is always clear.'};
 if(s.trail.includes(index))return {state:s,message:'You have already retraced that square. Keep going from the numbered trail.'};
 if(index!==p.path[s.trail.length])return {state:{...s,mistakes:s.mistakes+1,lastWrong:index,flashMs:750},message:'Not the next square. Two seconds added; your correct trail is safe.'};
 const next={...s,trail:[...s.trail,index],lastWrong:null,flashMs:0};
 return {state:next,message:getStatus(p,next)==='won'?'The whole route, remembered.':`${next.trail.length} of ${p.path.length} squares retraced.`};
}
export function hint(p,s){
 if(getStatus(p,s)!=='playing'||s.phase==='study')return null;
 return {...s,phase:'study',remainingMs:STUDY_MS,replays:s.replays+1,lastWrong:null,flashMs:0};
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,phase:'recall',remainingMs:0,lastWrong:null,flashMs:0,revealed:true}:s;}
export function scoreSeconds(s){return Math.ceil(s.elapsedMs/1000)+s.mistakes*2;}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||!['ready','study','recall'].includes(raw.phase)||typeof raw.revealed!=='boolean')return null;
 if(!nonnegative(raw.remainingMs)||raw.remainingMs>STUDY_MS||!nonnegative(raw.elapsedMs)||!Number.isSafeInteger(raw.mistakes)||raw.mistakes<0||!Number.isSafeInteger(raw.replays)||raw.replays<0)return null;
 if(!Array.isArray(raw.trail)||raw.trail.length>p.path.length||!raw.trail.every((cell,i)=>cell===p.path[i]))return null;
 if(!nonnegative(raw.flashMs)||raw.flashMs>750||(raw.lastWrong!==null&&(!indexOK(raw.lastWrong)||raw.flashMs===0||p.obstacles.includes(raw.lastWrong)||raw.trail.includes(raw.lastWrong)||raw.lastWrong===p.path[raw.trail.length])))return null;
 if(raw.lastWrong===null&&raw.flashMs!==0)return null;
 if(raw.lastWrong!==null&&raw.mistakes===0)return null;
 if(raw.phase==='study'&&(raw.remainingMs<=0||raw.trail.length===p.path.length||raw.lastWrong!==null))return null;
 if(raw.phase!=='study'&&raw.remainingMs!==0)return null;
 if(raw.phase==='ready'&&(raw.trail.length||raw.elapsedMs||raw.mistakes||raw.replays||raw.lastWrong!==null||raw.revealed))return null;
 if(raw.phase==='study'&&raw.replays===0&&(raw.trail.length||raw.elapsedMs||raw.mistakes))return null;
 if(raw.revealed&&(raw.phase!=='recall'||raw.trail.length===p.path.length))return null;
 return {phase:raw.phase,remainingMs:raw.remainingMs,trail:[...raw.trail],mistakes:raw.mistakes,elapsedMs:raw.elapsedMs,replays:raw.replays,lastWrong:raw.lastWrong,flashMs:raw.flashMs,revealed:raw.revealed};
}
