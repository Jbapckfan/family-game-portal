// Concept: DeepSeek. Completed rules, validation and implementation: ChatGPT.
const unique=values=>new Set(values).size===values.length;
const tileIndex=n=>Number.isInteger(n)&&n>=0&&n<9;
const pairKey=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
const matchingPair=(a,b)=>a<8&&b<8&&a!==b&&Math.floor(a/2)===Math.floor(b/2);
const locked=(s,t)=>t<8&&s.solved.includes(Math.floor(t/2));
function shuffledOrder(seed){
 let v=2166136261;for(const c of seed)v=Math.imul(v^c.charCodeAt(0),16777619)>>>0;
 const order=Array.from({length:9},(_,i)=>i);
 for(let i=8;i>0;i--){v=(Math.imul(v,1664525)+1013904223)>>>0;const j=v%(i+1);[order[i],order[j]]=[order[j],order[i]];}
 return order;
}
export function createState(p){return{solved:[],mistakes:[],selected:[],order:shuffledOrder(p.id),shuffles:0,hintPair:null,hinted:[],revealed:false};}
export function getStatus(p,s){return s.solved.length===4?'won':s.mistakes.length>=3?'lost':s.revealed?'revealed':'playing';}
export function chooseTile(p,s,t){
 if(getStatus(p,s)!=='playing'||!tileIndex(t)||locked(s,t))return s;
 if(s.selected.includes(t))return{...s,selected:s.selected.filter(i=>i!==t)};
 return s.selected.length>=2?s:{...s,selected:[...s.selected,t]};
}
export function submitPair(p,s){
 if(getStatus(p,s)!=='playing')return{state:s,message:'This round is complete.'};
 if(s.selected.length!==2)return{state:s,message:'Select two words first.'};
 const[a,b]=s.selected;
 if(matchingPair(a,b)){const n=Math.floor(a/2);return{state:{...s,selected:[],solved:[...s.solved,n],hintPair:s.hintPair===n?null:s.hintPair},message:`${p.pairs[n].join(' + ')} · opposites found`};}
 const key=pairKey(a,b);
 if(s.mistakes.includes(key))return{state:{...s,selected:[]},message:'You tried that pair already. No extra strike.'};
 const mistakes=[...s.mistakes,key];
 return{state:{...s,selected:[],mistakes},message:mistakes.length===3?'Three misses. Here are the four pairs.':`Those are not a pair. ${3-mistakes.length} ${mistakes.length===2?'chance':'chances'} left.`};
}
export function shuffle(p,s){if(getStatus(p,s)!=='playing')return s;const shuffles=(s.shuffles+1)%100000;return{...s,shuffles,order:shuffledOrder(`${p.id}:${shuffles}`)};}
export function hint(p,s){
 if(getStatus(p,s)!=='playing'||s.hintPair!==null)return null;
 const n=[0,1,2,3].find(i=>!s.solved.includes(i));
 return n===undefined?null:{...s,hintPair:n,hinted:s.hinted.includes(n)?s.hinted:[...s.hinted,n]};
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,revealed:true,selected:[]}:s;}
export function restoreState(p,r){
 if(!r||typeof r!=='object'||typeof r.revealed!=='boolean')return null;
 for(const name of ['solved','mistakes','selected','order','hinted'])if(!Array.isArray(r[name])||!unique(r[name]))return null;
 const pi=n=>Number.isInteger(n)&&n>=0&&n<4;
 if(r.solved.length>4||r.solved.some(n=>!pi(n))||r.hinted.length>4||r.hinted.some(n=>!pi(n)))return null;
 if(r.order.length!==9||r.order.some(n=>!tileIndex(n))||r.selected.length>2||r.selected.some(n=>!tileIndex(n)||locked(r,n)))return null;
 if(!Number.isInteger(r.shuffles)||r.shuffles<0||r.shuffles>=100000)return null;
 if(r.mistakes.length>3||r.mistakes.some(key=>{if(typeof key!=='string'||!/^[0-8]:[0-8]$/.test(key))return true;const[a,b]=key.split(':').map(Number);return a>=b||matchingPair(a,b);}))return null;
 if(r.hintPair!==null&&(!pi(r.hintPair)||r.solved.includes(r.hintPair)||!r.hinted.includes(r.hintPair)))return null;
 if((r.solved.length===4||r.mistakes.length===3||r.revealed)&&r.selected.length)return null;
 return{solved:[...r.solved],mistakes:[...r.mistakes],selected:[...r.selected],order:[...r.order],shuffles:r.shuffles,hintPair:r.hintPair,hinted:[...r.hinted],revealed:r.revealed};
}
