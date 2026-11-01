import {WORD_GAME_GUESSES} from './vocabulary.mjs';
import {GUESS_WORDS,ANSWERS} from './puzzles.mjs';
const WORDS=new Set([...GUESS_WORDS,...ANSWERS,...WORD_GAME_GUESSES]);
export const ALPHABET='abcdefghijklmnopqrstuvwxyz';
export const MAX_GUESSES=6;
export const createState=()=>({guesses:[],draft:'',hints:[],revealed:false});
export const feedback=(guess,answer)=>[...guess].map((letter,i)=>letter===answer[i]?0:answer[i]>letter?1:-1);
export function getStatus(p,s){if(s.revealed)return 'revealed';if(s.guesses.at(-1)===p.answer)return 'won';return s.guesses.length>=MAX_GUESSES?'lost':'playing';}
export function restoreState(p,raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.guesses)||raw.guesses.length>MAX_GUESSES||typeof raw.draft!=='string'||!/^[a-z]{0,5}$/.test(raw.draft)||!Array.isArray(raw.hints)||typeof raw.revealed!=='boolean')return null;
  if(new Set(raw.guesses).size!==raw.guesses.length||raw.guesses.some((word,i)=>typeof word!=='string'||!/^[a-z]{5}$/.test(word)||!WORDS.has(word)||(word===p.answer&&i!==raw.guesses.length-1)))return null;
  if(raw.hints.length>5||new Set(raw.hints).size!==raw.hints.length||raw.hints.some(i=>!Number.isInteger(i)||i<0||i>4))return null;
  if(getStatus(p,raw)!=='playing'&&raw.draft)return null;
  return {guesses:[...raw.guesses],draft:raw.draft,hints:[...raw.hints],revealed:raw.revealed};
}
/** Feedback and ranges are never restored from storage; all are recomputed
 * against the selected day's secret, including exact hint constraints. */
export function ranges(p,s){
  const lo=[0,0,0,0,0],hi=[25,25,25,25,25],locked=[false,false,false,false,false];
  for(const word of s.guesses){const row=feedback(word,p.answer);for(let i=0;i<5;i++){const n=ALPHABET.indexOf(word[i]);if(row[i]===0){lo[i]=hi[i]=n;locked[i]=true;}else if(row[i]>0)lo[i]=Math.max(lo[i],n+1);else hi[i]=Math.min(hi[i],n-1);}}
  for(const i of s.hints){lo[i]=hi[i]=ALPHABET.indexOf(p.answer[i]);locked[i]=true;}
  return {lo,hi,locked};
}
export function keyState(p,s,letter){const r=ranges(p,s),n=ALPHABET.indexOf(letter);if(r.locked.some((locked,i)=>locked&&p.answer[i]===letter))return 'locked';return r.lo.every((lo,i)=>n<lo||n>r.hi[i])?'excluded':'';}
export function setDraft(p,s,value){return getStatus(p,s)==='playing'?{...s,draft:String(value).toLowerCase().replace(/[^a-z]/g,'').slice(0,5)}:s;}
export const typeKey=(p,s,key)=>setDraft(p,s,s.draft+key);
export const backspace=(p,s)=>setDraft(p,s,s.draft.slice(0,-1));
export function submit(p,s){
  if(getStatus(p,s)!=='playing')return {state:s,message:'This lock is finished.'};
  if(s.draft.length!==5)return {state:s,message:'Enter a five-letter word.'};
  if(s.guesses.includes(s.draft))return {state:s,message:'Already tried. No guess used.'};
  if(!WORDS.has(s.draft))return {state:s,message:'Not in the supplied word list. No guess used.'};
  const next={...s,guesses:[...s.guesses,s.draft],draft:''},status=getStatus(p,next);
  return {state:next,message:status==='won'?`${p.answer.toUpperCase()} · unlocked.`:status==='lost'?`The word was ${p.answer.toUpperCase()}.`:'Follow the arrows for each position, then try another word.'};
}
export function hint(p,s){
  if(getStatus(p,s)!=='playing')return null;const r=ranges(p,s);
  const candidates=[0,1,2,3,4].filter(i=>!r.locked[i]).sort((a,b)=>(r.hi[b]-r.lo[b])-(r.hi[a]-r.lo[a])||a-b);
  return candidates.length?{...s,hints:[...s.hints,candidates[0]]}:null;
}
export const reveal=(p,s)=>getStatus(p,s)==='playing'?{...s,draft:'',revealed:true}:s;
export const summarize=(p,s)=>`${s.guesses.length}/6 guesses · ${ranges(p,s).locked.filter(Boolean).length}/5 dials locked · ${s.hints.length} hints`;

export const assistanceCount=(p,s)=>s.hints.length;
