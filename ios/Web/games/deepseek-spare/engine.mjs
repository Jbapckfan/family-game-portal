// Concept: DeepSeek. Completed rules, validation and implementation: Alford Daily.
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

// An isolated review sample. Published daily boards and their save schema stay above.
export const PREVIEW=Object.freeze({
 id:'spare-context-01-v2',
 words:['LIGHT','HEAVY','FLAT','SHARP','DULL','BRIGHT','SOFT','LOUD','DARK'],
 clues:[
  {text:'A porter lifts a suitcase.',sense:'Think about weight.',explanation:'Light and heavy describe how much the suitcase weighs.'},
  {text:'A singer misses the intended note.',sense:'Think about pitch, not volume.',explanation:'Flat is below the intended pitch; sharp is above it.'},
  {text:'A gem catches the light.',sense:'Think about how brightly it shines.',explanation:'Bright contrasts with dull for lustre, or with dark for visible brightness. Both pairings are accepted.'},
  {text:'A radio plays in the next room.',sense:'Think about volume, not pitch.',explanation:'Soft and loud describe the volume of the sound.'}
 ]
});
const previewSlot=n=>Number.isInteger(n)&&n>=0&&n<8;
const validSlots=slots=>Array.isArray(slots)&&slots.length===8&&slots.every(n=>n===null||tileIndex(n))&&unique(slots.filter(n=>n!==null));
const layoutKey=slots=>[0,2,4,6].map(i=>slots.slice(i,i+2).sort((a,b)=>a-b).join(':')).join('|');
const correctRows=slots=>[0,1,2,3].filter(i=>{
 const [a,b]=slots.slice(2*i,2*i+2);
 if(a===null||b===null)return false;
 return (Math.floor(a/2)===i&&Math.floor(b/2)===i)||(i===2&&[a,b].includes(5)&&[a,b].includes(8));
}).length;
export function createPreview(){return{sampleId:PREVIEW.id,slots:Array(8).fill(null),checks:[],clarified:[],revealed:false};}
export function previewStatus(s){return s.checks.at(-1)?.correct===4?'won':s.checks.length===4?'lost':s.revealed?'revealed':'playing';}
export function placePreview(s,slot,word){
 if(previewStatus(s)!=='playing'||!previewSlot(slot)||(word!==null&&!tileIndex(word)))return s;
 const slots=[...s.slots],previous=word===null?-1:slots.indexOf(word);
 if(previous===slot)return s;
 if(previous!==-1)slots[previous]=slots[slot];
 slots[slot]=word;
 return{...s,slots};
}
export function checkPreview(s){
 if(previewStatus(s)!=='playing')return{state:s,message:'This sample is complete.'};
 if(s.slots.includes(null))return{state:s,message:'Fill all eight spaces before checking. One word stays spare.'};
 const key=layoutKey(s.slots);
 if(s.checks.some(c=>layoutKey(c.slots)===key))return{state:s,message:'You already checked that arrangement. No check used; word order within a pair does not matter.'};
 const correct=correctRows(s.slots),checks=[...s.checks,{slots:[...s.slots],correct}];
 return{state:{...s,checks},message:correct===4?'All four contexts matched.':checks.length===4?`${correct} of 4 pairs fit. All four checks are used; the solution is below.`:`${correct} of 4 pairs fit their contexts. ${4-checks.length} ${checks.length===3?'check':'checks'} left. Which meanings could you reconsider?`};
}
export function revealPreview(s){return previewStatus(s)==='playing'?{...s,revealed:true}:s;}
export function clarifyPreview(s,row){
 return previewStatus(s)!=='playing'||!Number.isInteger(row)||row<0||row>3||s.clarified.includes(row)?s:{...s,clarified:[...s.clarified,row]};
}
export function restorePreview(r){
 if(!r||r.sampleId!==PREVIEW.id||typeof r.revealed!=='boolean'||!validSlots(r.slots)||!Array.isArray(r.checks)||r.checks.length>4)return null;
 if(!Array.isArray(r.clarified)||r.clarified.length>4||!unique(r.clarified)||r.clarified.some(n=>!Number.isInteger(n)||n<0||n>3))return null;
 const keys=[];
 for(let i=0;i<r.checks.length;i++){
  const c=r.checks[i];
  if(!c||!validSlots(c.slots)||c.slots.includes(null)||c.correct!==correctRows(c.slots))return null;
  const key=layoutKey(c.slots);if(keys.includes(key))return null;keys.push(key);
  if(c.correct===4&&i!==r.checks.length-1)return null;
 }
 const status=previewStatus(r);
 if((status==='won'||status==='lost')&&(r.revealed||layoutKey(r.slots)!==keys.at(-1)))return null;
 return{sampleId:PREVIEW.id,slots:[...r.slots],checks:r.checks.map(c=>({slots:[...c.slots],correct:c.correct})),clarified:[...r.clarified],revealed:r.revealed};
}
export function previewShare(s){
 const status=previewStatus(s);
 return`Alford Daily · Spare\nHarder Preview 01\n${status==='won'?'🟩 Solved':status==='lost'?'⬜ Finished':status==='revealed'?'🟨 Revealed':'In progress'} · ${s.checks.length}/4 checks\n${s.clarified.length} context ${s.clarified.length===1?'clue':'clues'} used\nFour contexts. One spare.`;
}
