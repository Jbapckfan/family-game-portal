export const SHAPES=['circle','triangle','square','star'];
export const COLORS=['ocean','rose','gold','leaf'];
export const DIRECTIONS={0:'north',90:'east',180:'south',270:'west'};
export const tokenKey=t=>[t.shape,t.color,t.size,t.rotation].join('/');
export const tokenAt=(p,index)=>Object.fromEntries(Object.entries(p.cycles).map(([key,cycle])=>[key,cycle[index%cycle.length]]));
export function choicesAt(p,step) {
  const correct=tokenAt(p,5+step),choices=[correct];
  const changes=[{...correct,shape:SHAPES[(SHAPES.indexOf(correct.shape)+1)%4]}, {...correct,color:COLORS[(COLORS.indexOf(correct.color)+1)%4]}, {...correct,size:1-correct.size,rotation:(correct.rotation+90)%360}];
  choices.push(...changes);const offset=(p.offset+step)%4;
  return choices.map((_,i)=>choices[(i+offset)%4]);
}
export const correctIndex=(p,step)=>choicesAt(p,step).findIndex(t=>tokenKey(t)===tokenKey(tokenAt(p,5+step)));
export const createState=()=>({answers:[],wrong:[[],[],[]],hints:[0,0,0],lastWrong:null,revealed:false});
export const mistakes=s=>s.wrong.reduce((sum,entries)=>sum+entries.length,0);
export function getStatus(p,s){return s.revealed?'revealed':s.answers.length===3?'won':'playing';}
export function restoreState(p,raw) {
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.answers)||raw.answers.length>3||raw.answers.some((answer,step)=>answer!==correctIndex(p,step)))return null;
  if(!Array.isArray(raw.wrong)||raw.wrong.length!==3||raw.wrong.some((list,step)=>!Array.isArray(list)||new Set(list).size!==list.length||list.some(index=>!Number.isInteger(index)||index<0||index>3||index===correctIndex(p,step))))return null;
  if(!Array.isArray(raw.hints)||raw.hints.length!==3||raw.hints.some(n=>!Number.isInteger(n)||n<0||n>2)||typeof raw.revealed!=='boolean')return null;
  if(raw.lastWrong!==null&&(!Number.isInteger(raw.lastWrong)||raw.lastWrong<0||raw.lastWrong>3||raw.answers.length===3||!raw.wrong[raw.answers.length].includes(raw.lastWrong)))return null;
  if(raw.wrong.some((list,i)=>i>raw.answers.length&&list.length)||raw.hints.some((n,i)=>i>raw.answers.length&&n>0))return null;
  if(raw.revealed&&raw.answers.length!==3)return null;
  return {answers:[...raw.answers],wrong:raw.wrong.map(list=>[...list]),hints:[...raw.hints],lastWrong:raw.lastWrong,revealed:raw.revealed};
}
export function choose(p,s,index) {
  if(getStatus(p,s)!=='playing'||!Number.isInteger(index)||index<0||index>3)return {state:s,message:'This sequence is complete.'};
  const step=s.answers.length;
  if(index===correctIndex(p,step))return {state:{...s,answers:[...s.answers,index],lastWrong:null},message:step===2?'Three predictions. The pattern holds!':'That fits. Predict the next element.'};
  const wrong=s.wrong.map(list=>[...list]);if(!wrong[step].includes(index))wrong[step].push(index);
  return {state:{...s,wrong,lastWrong:index},message:'One or more attributes break the pattern. Try another choice.'};
}
export function hint(p,s){if(getStatus(p,s)!=='playing')return s;const step=s.answers.length;if(s.hints[step]===2)return s;const hints=[...s.hints];hints[step]++;return {...s,hints};}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,answers:[0,1,2].map(step=>correctIndex(p,step)),lastWrong:null,revealed:true}:s;}
function names(key,values){return values.map(v=>key==='size'?(v?'large':'small'):key==='rotation'?DIRECTIONS[v]:v).join(' → ');}
export const explanation=p=>Object.entries(p.cycles).map(([key,values])=>`${key[0].toUpperCase()+key.slice(1)} ${values.length===1?'stays '+names(key,values):'cycles '+names(key,values)}.`).join(' ');
export function hintText(p,s){const step=s.answers.length;if(step>=3||!s.hints[step])return '';if(s.hints[step]===2)return 'The outlined choice continues all four attributes.';const [key,values]=Object.entries(p.cycles).find(([,cycle])=>cycle.length>1);return `${key[0].toUpperCase()+key.slice(1)} repeats ${names(key,values)}. Check the other attributes too.`;}
export const summarize=(p,s)=>`${s.answers.length}/3 predictions · ${mistakes(s)} different misses · ${s.hints.reduce((a,b)=>a+b,0)} hints`;
