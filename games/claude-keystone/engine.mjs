import {COMMON,FUSED} from './puzzles.mjs';
const WORDS=new Set(COMMON),JOINS=new Set(FUSED);
export const fused=(word,clue)=>clue.d==='before'?clue.w+word:word+clue.w;
export const joins=(a,b)=>JOINS.has(a+b)||JOINS.has(b+a);
export const joinWord=(a,b)=>JOINS.has(a+b)?a+b:JOINS.has(b+a)?b+a:null;
export const createState=p=>({rounds:p.rounds.map(()=>[]),draft:'',awaitingNext:false,revealed:false});
/** Derive score, clue count, strikes, and status from actual accepted guesses.
 * Explicit Next arch replaces the source's race-prone delayed advancement. */
export function roundView(round,events){
  if(!Array.isArray(events)||events.length>20)return null;
  const r={clues:2,strikes:0,guesses:[],status:'playing',score:0,prefix:0,hints:0,words:[]};
  for(const event of events){
    if(!event||typeof event!=='object'||r.status!=='playing')return null;
    if(event.type==='clue'){
      if(r.clues>=5)return null;r.clues++;r.hints++;
    }else if(event.type==='letter'){
      if(r.clues!==5||r.prefix>=round.k.length)return null;r.prefix++;r.hints++;
    }else if(event.type==='guess'){
      const word=event.word;
      if(typeof word!=='string'||!/^[a-z]{3,9}$/.test(word)||r.words.includes(word))return null;
      if(word!==round.k&&(!WORDS.has(word)||round.clues.some(c=>c.w===word)))return null;
      r.words.push(word);
      if(word===round.k){r.status='won';r.score=r.clues;continue;}
      r.guesses.push({word,fits:round.clues.slice(0,r.clues).map(c=>joins(word,c.w))});
      if(r.clues<5)r.clues++;else if(++r.strikes===2){r.status='lost';r.score=6;}
    }else return null;
  }
  return r;
}
function views(p,s){return p.rounds.map((r,i)=>roundView(r,s.rounds[i]));}
export function getStatus(p,s){if(s.revealed)return 'revealed';const all=views(p,s);return all.every(r=>r?.status!=='playing')?(all.every(r=>r?.status==='won')?'won':'lost'):'playing';}
export function currentIndex(p,s){const first=views(p,s).findIndex(r=>r.status==='playing');return first===-1?p.rounds.length-1:s.awaitingNext?first-1:first;}
export const total=(p,s)=>views(p,s).reduce((sum,r)=>sum+r.score,0);
export const hintCount=(p,s)=>views(p,s).reduce((sum,r)=>sum+r.hints,0);
export function restoreState(p,raw){
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.rounds)||raw.rounds.length!==p.rounds.length||typeof raw.draft!=='string'||!/^[a-z]{0,9}$/.test(raw.draft)||typeof raw.awaitingNext!=='boolean'||typeof raw.revealed!=='boolean')return null;
  let firstPlaying=-1;
  for(let i=0;i<p.rounds.length;i++){
    const r=roundView(p.rounds[i],raw.rounds[i]);if(!r)return null;
    if(firstPlaying!==-1&&raw.rounds[i].length)return null;
    if(r.status==='playing'&&firstPlaying===-1)firstPlaying=i;
  }
  if(raw.awaitingNext&&(firstPlaying<=0||raw.draft))return null;
  if((firstPlaying===-1||raw.revealed)&&raw.draft)return null;
  if(raw.revealed&&raw.awaitingNext)return null;
  return {rounds:raw.rounds.map(events=>events.map(e=>e.type==='guess'?{type:'guess',word:e.word}:{type:e.type})),draft:raw.draft,awaitingNext:raw.awaitingNext,revealed:raw.revealed};
}
export function setDraft(p,s,value){return getStatus(p,s)==='playing'&&!s.awaitingNext?{...s,draft:String(value).toLowerCase().replace(/[^a-z]/g,'').slice(0,9)}:s;}
export const typeKey=(p,s,key)=>setDraft(p,s,s.draft+key);
export const backspace=(p,s)=>setDraft(p,s,s.draft.slice(0,-1));
export function submit(p,s){
  if(getStatus(p,s)!=='playing'||s.awaitingNext)return {state:s,message:s.awaitingNext?'Review this arch, then choose Next arch.':'This puzzle is complete.'};
  const i=currentIndex(p,s),round=p.rounds[i],r=roundView(round,s.rounds[i]),word=s.draft;
  if(word.length<3)return {state:s,message:'Use three or more letters.'};
  if(r.words.includes(word))return {state:s,message:'Already tried. No extra strike.'};
  if(word!==round.k&&round.clues.some(c=>c.w===word))return {state:s,message:'That is one of the clues.'};
  if(word!==round.k&&!WORDS.has(word))return {state:s,message:'Not in the supplied word list. No extra clue or strike.'};
  const rounds=s.rounds.map(events=>[...events]);rounds[i].push({type:'guess',word});const after=roundView(round,rounds[i]);
  const next={...s,rounds,draft:'',awaitingNext:after.status!=='playing'&&i<p.rounds.length-1};
  const fits=round.clues.slice(0,r.clues).filter(c=>joins(word,c.w)).length;
  return {state:next,message:after.status==='won'?`${word.toUpperCase()} holds the arch. Score ${after.score}.`:after.status==='lost'?`The keystone was ${round.k.toUpperCase()}. This arch scores 6.`:`${word.toUpperCase()} joins ${fits} of ${r.clues} visible clues. ${r.clues<5?'Another clue is open.':'One last try for this arch.'}`};
}
export const nextArch=(p,s)=>getStatus(p,s)==='playing'&&s.awaitingNext?{...s,awaitingNext:false,draft:''}:s;
export function hint(p,s){
  if(getStatus(p,s)!=='playing'||s.awaitingNext)return null;
  const i=currentIndex(p,s),r=roundView(p.rounds[i],s.rounds[i]);if(r.clues===5&&r.prefix===p.rounds[i].k.length)return null;
  const rounds=s.rounds.map(events=>[...events]);rounds[i].push({type:r.clues<5?'clue':'letter'});
  return {...s,rounds};
}
export const reveal=(p,s)=>getStatus(p,s)==='playing'?{...s,draft:'',awaitingNext:false,revealed:true}:s;
export const summarize=(p,s)=>`${views(p,s).filter(r=>r.status==='won').length}/3 arches solved · score ${total(p,s)} (6 is perfect) · ${hintCount(p,s)} hints`;
