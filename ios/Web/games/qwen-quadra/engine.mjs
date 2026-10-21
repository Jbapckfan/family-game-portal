const indexOK=i=>Number.isInteger(i)&&i>=0&&i<16;
const unique=values=>new Set(values).size===values.length;
export function createState(){return {attempts:[],selected:[],hinted:[],revealed:false};}

// Tile assignments, rather than a claimed "won" flag, are the source of truth.
// Chronological attempts let restoration check that no locked tile was reused.
export function analyze(p,s){
 const result={valid:true,found:[],used:new Set(),mistakes:0};
 if(!Array.isArray(s?.attempts)||s.attempts.length>7)return {...result,valid:false};
 for(const attempt of s.attempts){
  const tiles=attempt?.tiles;
  if(result.found.length===4||result.mistakes===4||!Array.isArray(tiles)||tiles.length!==4||!unique(tiles)||!tiles.every(i=>indexOK(i)&&!result.used.has(i)))return {...result,valid:false};
  const word=tiles.map(i=>p.tiles[i]).join('');
  if(p.answers.includes(word)&&!result.found.some(f=>f.word===word)){result.found.push({word,tiles:[...tiles]});tiles.forEach(i=>result.used.add(i));}
  else result.mistakes++;
 }
 return result;
}
export function getStatus(p,s){const a=analyze(p,s);if(!a.valid)return 'playing';return s.revealed?'revealed':a.found.length===4?'won':a.mistakes===4?'lost':'playing';}
export function chooseTile(p,s,index){
 if(getStatus(p,s)!=='playing'||!indexOK(index)||analyze(p,s).used.has(index))return s;
 if(s.selected.includes(index))return {...s,selected:s.selected.filter(i=>i!==index)};
 return s.selected.length<4?{...s,selected:[...s.selected,index]}:s;
}
export function selectWord(p,s,input){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This round is complete.'};
 const word=String(input).trim().toUpperCase();
 if(!/^[A-Z]{0,4}$/.test(word))return {state:null,message:'Use up to four letters from the remaining tiles.'};
 const used=analyze(p,s).used,selected=[];
 for(const ch of word){const index=p.tiles.findIndex((letter,i)=>letter===ch&&!used.has(i)&&!selected.includes(i));if(index<0)return {state:null,message:`No unused ${ch} tile is available.`};selected.push(index);}
 return {state:{...s,selected},message:''};
}
export function submitWord(p,s){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This round is complete.'};
 if(s.selected.length!==4)return {state:s,message:'Choose four tiles in word order.'};
 const word=s.selected.map(i=>p.tiles[i]).join(''),a=analyze(p,s);
 if(a.found.some(f=>f.word===word))return {state:{...s,selected:[]},message:`${word} is already found. Try another word.`};
 const next={...s,attempts:[...s.attempts,{tiles:[...s.selected]}],selected:[]},status=getStatus(p,next);
 return {state:next,message:status==='won'?'Four words. All sixteen tiles. Beautifully done.':status==='lost'?'Four misses. Today’s four words are shown below.':p.answers.includes(word)?`${word} locked in.`:`Not one of today’s four category words. ${4-analyze(p,next).mistakes} ${analyze(p,next).mistakes===3?'chance':'chances'} left.`};
}
export function hint(p,s){
 if(getStatus(p,s)!=='playing')return null;
 const found=analyze(p,s).found.map(f=>f.word);
 if(s.hinted.some(word=>!found.includes(word)))return null;
 const word=p.answers.find(w=>!found.includes(w));
 if(!word)return null;const selected=selectWord(p,s,word).state;
 return selected?{...selected,hinted:[...s.hinted,word]}:null;
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,selected:[],revealed:true}:s;}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean')return null;
 const a=analyze(p,raw);
 if(!a.valid||!Array.isArray(raw.selected)||raw.selected.length>4||!unique(raw.selected)||!raw.selected.every(i=>indexOK(i)&&!a.used.has(i)))return null;
 if(!Array.isArray(raw.hinted)||raw.hinted.length>4||!unique(raw.hinted)||!raw.hinted.every(word=>p.answers.includes(word)))return null;
 if((raw.revealed||a.found.length===4||a.mistakes===4)&&raw.selected.length)return null;
 if(raw.revealed&&(a.found.length===4||a.mistakes===4))return null;
 return {attempts:raw.attempts.map(a=>({tiles:[...a.tiles]})),selected:[...raw.selected],hinted:[...raw.hinted],revealed:raw.revealed};
}
