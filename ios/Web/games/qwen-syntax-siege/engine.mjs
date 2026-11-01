import {WORDS_BY_RACK} from './word-acceptance.mjs';
const acceptanceCache=new WeakMap();
export function acceptedWords(w){
 if(!acceptanceCache.has(w))acceptanceCache.set(w,Object.freeze([...new Set([...w.words,...(WORDS_BY_RACK[[...w.rack].sort().join('')]||[])])]));
 return acceptanceCache.get(w);
}
const count = (n, max=100000) => Number.isInteger(n) && n >= 0 && n <= max;
export const health = s => Math.max(0, 100 - s.misses * 10 - s.timeouts * 20);
export const waveDamage = (s, wave) => s.played[wave].reduce((total, word) => total + word.length * 10, 0);
export const score = s => s.played.flat().reduce((total, word) => total + word.length ** 2, 0);
export const waveIndex = (p, s) => { const index=p.waves.findIndex((w,i)=>waveDamage(s,i)<w.health);return index===-1?p.waves.length:index; };
export function canSpell(w, word) {
  const available=[...w.rack];
  return typeof word==='string' && /^[A-Z]{3,6}$/.test(word) && [...word].every(letter=>{const i=available.indexOf(letter);if(i===-1)return false;available.splice(i,1);return true;});
}
export function createState(p) { return { played:p.waves.map(()=>[]),selected:[],started:false,untimed:false,remainingMs:p.waves[0].durationMs,misses:0,timeouts:0,hints:0,revealed:false }; }
export function getStatus(p,s) { if(s.revealed)return 'revealed';if(health(s)===0)return 'lost';return waveIndex(p,s)===p.waves.length?'won':'playing'; }
export function restoreState(p,raw) {
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.played)||raw.played.length!==p.waves.length||!Array.isArray(raw.selected))return null;
  // A final 20-HP impact can land when only 10 HP remains.
  if(![raw.started,raw.untimed,raw.revealed].every(x=>typeof x==='boolean')||!count(raw.misses,10)||!count(raw.timeouts,5)||!count(raw.hints)||raw.misses*10+raw.timeouts*20>110)return null;
  if(!Number.isInteger(raw.remainingMs)||raw.remainingMs<1||raw.remainingMs>20000)return null;
  let unfinished=false;
  for(let i=0;i<p.waves.length;i++){
    const w=p.waves[i],words=raw.played[i];
    if(!Array.isArray(words)||words.length>6||new Set(words).size!==words.length||words.some(word=>!acceptedWords(w).includes(word)||!canSpell(w,word)))return null;
    if(unfinished&&words.length)return null;
    if(words.slice(0,-1).reduce((sum,word)=>sum+word.length*10,0)>=w.health)return null;
    if(words.reduce((sum,word)=>sum+word.length*10,0)<w.health)unfinished=true;
  }
  const index=waveIndex(p,raw);
  if(raw.selected.length>6||raw.selected.some(i=>!Number.isInteger(i)||i<0||i>5)||new Set(raw.selected).size!==raw.selected.length)return null;
  if(index===p.waves.length&&raw.selected.length)return null;
  if(!raw.started&&(raw.played.some(words=>words.length)||raw.misses||raw.timeouts))return null;
  if(raw.revealed&&index!==p.waves.length)return null;
  return {played:raw.played.map(words=>[...words]),selected:[...raw.selected],started:raw.started,untimed:raw.untimed,remainingMs:raw.remainingMs,misses:raw.misses,timeouts:raw.timeouts,hints:raw.hints,revealed:raw.revealed};
}
export const start = (p,s) => getStatus(p,s)==='playing'?{...s,started:true}:s;
export const assist = (p,s) => getStatus(p,s)==='playing'?{...s,untimed:true}:s;
export function pick(p,s,index) {
  if(getStatus(p,s)!=='playing'||!s.started)return {state:s,message:'Start the defense when you are ready.'};
  if(!Number.isInteger(index)||index<0||index>5||s.selected.includes(index))return {state:s,message:'Choose an unused letter tile.'};
  return {state:{...s,selected:[...s.selected,index]},message:''};
}
export const clear = (p,s) => getStatus(p,s)==='playing'?{...s,selected:[]}:s;
export const undo = (p,s) => getStatus(p,s)==='playing'?{...s,selected:s.selected.slice(0,-1)}:s;
export const currentWord = (p,s) => {const w=p.waves[waveIndex(p,s)];return w?s.selected.map(i=>w.rack[i]).join(''):'';};
export function submit(p,s) {
  if(getStatus(p,s)!=='playing'||!s.started)return {state:s,message:'Start the defense first.'};
  const index=waveIndex(p,s),w=p.waves[index],word=currentWord(p,s);
  if(word.length<3)return {state:s,message:'Use at least three letters to fire a word.'};
  if(s.played[index].includes(word))return {state:{...s,selected:[]},message:'That word already hit this wave. Find a different one.'};
  if(!acceptedWords(w).includes(word))return {state:{...s,selected:[],misses:s.misses+1},message:'That word is not in the game dictionary. The core takes 10 damage.'};
  const played=s.played.map(words=>[...words]);played[index].push(word);
  let state={...s,played,selected:[]};
  const cleared=waveDamage(state,index)>=w.health;
  if(cleared)state={...state,remainingMs:20000};
  return {state,message:getStatus(p,state)==='won'?'All six waves defeated. Core secure!':cleared?`${word}: ${word.length*10} damage. Wave cleared!`:`${word}: ${word.length*10} damage. Keep firing!`};
}
export function tick(p,s,deltaMs,mode='daily') {
  if(!s.started||s.untimed||mode==='practice'||getStatus(p,s)!=='playing')return null;
  const delta=Math.max(0,Math.floor(Number.isFinite(deltaMs)?deltaMs:0));
  if(!delta)return null;
  const remaining=s.remainingMs-delta;
  return remaining>0?{...s,remainingMs:remaining}:{...s,remainingMs:20000,timeouts:s.timeouts+1,selected:[]};
}
export function hint(p,s) {
  if(getStatus(p,s)!=='playing')return s;
  const w=p.waves[waveIndex(p,s)],answer=w.words[0],word=currentWord(p,s);
  let prefix=0;while(prefix<word.length&&word[prefix]===answer[prefix])prefix++;
  if(prefix===answer.length)return s;
  const selected=s.selected.slice(0,prefix),letter=answer[prefix];
  const index=w.rack.findIndex((c,i)=>c===letter&&!selected.includes(i));
  return {...s,selected:[...selected,index],hints:s.hints+1};
}
export function reveal(p,s) {
  if(getStatus(p,s)!=='playing')return s;
  return {...s,played:p.waves.map(w=>[w.words[0]]),selected:[],started:true,revealed:true};
}
export const summarize=(p,s)=>`${waveIndex(p,s)}/${p.waves.length} waves · ${health(s)} core HP · ${score(s)} points${s.untimed?' · untimed assist':''}${s.hints?` · ${s.hints} hints`:''}`;
