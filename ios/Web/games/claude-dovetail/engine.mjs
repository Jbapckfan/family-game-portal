import {COMMON,FUSED} from './puzzles.mjs';
export const MAX_MISSES=6;
const wordOK=word=>typeof word==='string'&&/^[a-z]+$/.test(word);
const rowOK=(p,row)=>Number.isInteger(row)&&row>0&&row<p.words.length-1;
export function createState(){return {events:[],active:1,typed:'',revealed:false};}
function initialProgress(p){return {valid:true,words:[...p.words],solved:p.words.map((_,i)=>i===0||i===p.words.length-1),guesses:p.words.map(()=>[]),hints:p.words.map(()=>0),misses:0};}
function statusOf(a){return a.solved.every(Boolean)?'won':a.misses>=MAX_MISSES?'lost':'playing';}
function judgeProgress(p,a,row,word){
 if(!rowOK(p,row)||a.solved[row]||!wordOK(word)||word.length!==p.words[row].length)return {kind:'length'};
 if(!word.startsWith(p.words[row].slice(0,a.hints[row])))return {kind:'prefix'};
 const left=a.solved[row-1]?a.words[row-1]:null,right=a.solved[row+1]?a.words[row+1]:null;
 const up=!!left&&FUSED.has(left+word),down=!!right&&FUSED.has(word+right);
 // Even an expected answer must preserve every already completed neighboring join.
 const canonical=word===p.words[row]&&(!left||up)&&(!right||down);
 if(canonical||(left&&right&&up&&down&&COMMON.has(word)))return {kind:'solve',word,up,down,left,right};
 if(a.guesses[row].some(g=>g.word===word))return {kind:'duplicate'};
 if(!COMMON.has(word))return {kind:'unlisted'};
 return {kind:'miss',word,up,down,left,right};
}

// Replay verified guesses and hint costs; saved solved flags and word replacements
// are never trusted. An alternative requires both fixed neighboring joins.
export function analyze(p,s){
 const a=initialProgress(p);
 if(!Array.isArray(s?.events)||s.events.length>p.words.length+4)return {...a,valid:false};
 for(const event of s.events){
  if(!event||!rowOK(p,event.row)||a.solved[event.row]||statusOf(a)!=='playing')return {...a,valid:false};
  if(event.type==='hint'){
   if(a.hints[event.row]>=p.words[event.row].length-1)return {...a,valid:false};
   a.hints[event.row]++;a.misses++;
  }else if(event.type==='guess'){
   const result=judgeProgress(p,a,event.row,event.word);
   if(result.kind==='solve'){a.words[event.row]=event.word;a.solved[event.row]=true;}
   else if(result.kind==='miss'){a.guesses[event.row].push({word:event.word,up:result.up,down:result.down});a.misses++;}
   else return {...a,valid:false};
  }else return {...a,valid:false};
 }
 return a;
}
export function getStatus(p,s){const a=analyze(p,s);return !a.valid?'playing':s.revealed?'revealed':statusOf(a);}
function nextOpen(p,a,from){for(let step=1;step<p.words.length;step++){const row=(from+step)%p.words.length;if(!a.solved[row])return row;}return -1;}
export function chooseRow(p,s,row){const a=analyze(p,s);return getStatus(p,s)==='playing'&&rowOK(p,row)&&!a.solved[row]?{...s,active:row,typed:p.words[row].slice(0,a.hints[row])}:s;}
export function setTyped(p,s,input){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This chain is complete.'};
 const a=analyze(p,s),word=String(input).trim().toLowerCase(),prefix=p.words[s.active].slice(0,a.hints[s.active]);
 if(!/^[a-z]*$/.test(word)||word.length>p.words[s.active].length)return {state:null,message:`Use ${p.words[s.active].length} letters for this row.`};
 if(!word.startsWith(prefix))return {state:null,message:`Keep the hinted prefix ${prefix.toUpperCase()}.`};
 return {state:{...s,typed:word},message:''};
}
export function submitWord(p,s,input=s.typed){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This chain is complete.'};
 const word=String(input).trim().toLowerCase(),a=analyze(p,s),row=s.active,result=judgeProgress(p,a,row,word);
 if(result.kind==='length')return {state:s,message:`This row needs exactly ${p.words[row].length} letters.`};
 if(result.kind==='prefix')return {state:s,message:'Keep the letters already revealed by the hint.'};
 if(result.kind==='duplicate')return {state:s,message:'Already tried that word in this row. No extra miss charged.'};
 if(result.kind==='unlisted')return {state:s,message:'That is not in this puzzle’s word list. No miss charged.'};
 let next={...s,events:[...s.events,{type:'guess',row,word}],typed:''};
 const updated=analyze(p,next),status=statusOf(updated);
 next.active=status==='playing'?(result.kind==='solve'?nextOpen(p,updated,row):row):-1;
 if(next.active>=0)next.typed=p.words[next.active].slice(0,updated.hints[next.active]);
 const joinText=[result.up?result.left+word:null,result.down?word+result.right:null].filter(Boolean).map(w=>w.toUpperCase()).join(' · ');
 const message=status==='won'?'Every join fits. The chain is complete.':status==='lost'?'Six misses. The complete chain is shown below.':result.kind==='solve'?(joinText||'That word belongs in the chain.'):result.up?`${(result.left+word).toUpperCase()} fits above, but this word does not complete the chain.`:result.down?`${(word+result.right).toUpperCase()} fits below, but this word does not complete the chain.`:'Not this chain’s word. Try joining a known neighbor.';
 return {state:next,message};
}
export function hint(p,s){
 if(getStatus(p,s)!=='playing')return null;
 const a=analyze(p,s),row=s.active;if(a.hints[row]>=p.words[row].length-1)return null;
 const next={...s,events:[...s.events,{type:'hint',row}],typed:p.words[row].slice(0,a.hints[row]+1)};
 if(getStatus(p,next)!=='playing'){next.active=-1;next.typed='';}return next;
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,active:-1,typed:'',revealed:true}:s;}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean'||typeof raw.typed!=='string')return null;
 const a=analyze(p,raw);if(!a.valid)return null;
 const terminal=raw.revealed||statusOf(a)!=='playing';
 if(raw.revealed&&statusOf(a)!=='playing')return null;
 if(terminal){if(raw.active!==-1||raw.typed!=='')return null;}
 else if(!rowOK(p,raw.active)||a.solved[raw.active]||!/^[a-z]*$/.test(raw.typed)||raw.typed.length>p.words[raw.active].length||!raw.typed.startsWith(p.words[raw.active].slice(0,a.hints[raw.active])))return null;
 return {events:raw.events.map(e=>e.type==='guess'?{type:'guess',row:e.row,word:e.word}:{type:'hint',row:e.row}),active:raw.active,typed:raw.typed,revealed:raw.revealed};
}
