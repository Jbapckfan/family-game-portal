import {FUSED} from './puzzles.mjs';
export const MAX_MISTAKES=4;
const indexOK=i=>Number.isInteger(i)&&i>=0&&i<12;
const unique=items=>new Set(items).size===items.length;
const graphCache=new WeakMap();
function graph(p){
 if(graphCache.has(p))return graphCache.get(p);
 const tiles=p.parts.flat(),edges=Array.from({length:12},()=>[]);
 for(let i=0;i<12;i++)for(let j=0;j<12;j++)if(i!==j&&FUSED.has(tiles[i]+tiles[j]))edges[i].push(j);
 const value={tiles,edges};graphCache.set(p,value);return value;
}
export function findMatchings(p,remaining=Array.from({length:12},(_,i)=>i),limit=2){
 const {edges}=graph(p),results=[];
 function visit(indices,pairs){
  if(results.length>=limit)return;
  if(!indices.length){results.push(pairs);return;}
  const first=indices[0];
  for(const other of indices.slice(1))for(const [a,b] of [[first,other],[other,first]]){
   if(!edges[a].includes(b))continue;
   visit(indices.filter(i=>i!==first&&i!==other),[...pairs,[a,b]]);
   if(results.length>=limit)return;
  }
 }
 visit(remaining,[]);return results;
}
function canPair(p,used,a,b){return findMatchings(p,Array.from({length:12},(_,i)=>i).filter(i=>!used.has(i)&&i!==a&&i!==b),1).length>0;}
function shuffled(p,n){let seed=([...p.id].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),0)+n*104729)>>>0;const order=Array.from({length:12},(_,i)=>i);for(let i=11;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[order[i],order[j]]=[order[j],order[i]];}return order;}
export function createState(p){return {attempts:[],selected:[],order:shuffled(p,0),shuffles:0,hinted:[],hintPair:null,revealed:false};}
export function analyze(p,s){
 const result={valid:true,pairs:[],used:new Set(),mistakes:0,tried:new Set()},tiles=graph(p).tiles;
 if(!Array.isArray(s?.attempts)||s.attempts.length>9)return {...result,valid:false};
 for(const attempt of s.attempts){
  const pair=attempt?.tiles;
  if(result.used.size===12||result.mistakes===4||!Array.isArray(pair)||pair.length!==2||!unique(pair)||!pair.every(i=>indexOK(i)&&!result.used.has(i)))return {...result,valid:false};
  const [a,b]=pair,word=tiles[a]+tiles[b],key=`${tiles[a]}+${tiles[b]}`;
  if(!FUSED.has(word))return {...result,valid:false};
  if(canPair(p,result.used,a,b)){result.pairs.push([a,b]);result.used.add(a);result.used.add(b);}
  else {if(result.tried.has(key))return {...result,valid:false};result.tried.add(key);result.mistakes++;}
 }
 return result;
}
export function getStatus(p,s){const a=analyze(p,s);return !a.valid?'playing':s.revealed?'revealed':a.used.size===12?'won':a.mistakes===4?'lost':'playing';}
export function chooseTile(p,s,index){
 if(getStatus(p,s)!=='playing'||!indexOK(index)||analyze(p,s).used.has(index))return s;
 if(s.selected.includes(index))return {...s,selected:s.selected.filter(i=>i!==index)};
 return {...s,selected:s.selected.length<2?[...s.selected,index]:[s.selected[0],index]};
}
export function submitPair(p,s){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This bin is complete.'};
 if(s.selected.length!==2)return {state:s,message:'Choose two different halves in word order.'};
 const a=analyze(p,s),tiles=graph(p).tiles,[first,second]=s.selected,word=tiles[first]+tiles[second],key=`${tiles[first]}+${tiles[second]}`;
 if(!FUSED.has(word))return {state:{...s,selected:[]},message:`${word.toUpperCase()} is not in this puzzle’s word list. No mistake charged.`};
 const valid=canPair(p,a.used,first,second);
 if(!valid&&a.tried.has(key))return {state:{...s,selected:[]},message:'Already tried that splice. No extra mistake charged.'};
 const next={...s,attempts:[...s.attempts,{tiles:[...s.selected]}],selected:[]},after=analyze(p,next),status=getStatus(p,next);
 if(next.hintPair&&(next.hintPair.some(i=>after.used.has(i))||!canPair(p,after.used,...next.hintPair)))next.hintPair=null;
 return {state:next,message:status==='won'?'All twelve halves, neatly spliced.':status==='lost'?'Four mistakes. One complete pairing is shown below.':valid?`${word.toUpperCase()} leaves a partner for every half.`:`${word.toUpperCase()} is a word, but it strands another half. One mistake.`};
}
export function shuffle(p,s){if(getStatus(p,s)!=='playing')return s;const shuffles=s.shuffles+1;return {...s,shuffles,order:shuffled(p,shuffles)};}
export function hint(p,s){
 if(getStatus(p,s)!=='playing'||s.hintPair)return null;
 const used=analyze(p,s).used,matching=findMatchings(p,Array.from({length:12},(_,i)=>i).filter(i=>!used.has(i)),1)[0];if(!matching?.length)return null;
 const pair=matching[0];return {...s,selected:[...pair],hintPair:[...pair],hinted:[...s.hinted,[...pair]]};
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,selected:[],hintPair:null,revealed:true}:s;}
export function solutionPairs(p,s){const a=analyze(p,s),remaining=Array.from({length:12},(_,i)=>i).filter(i=>!a.used.has(i));return [...a.pairs,...(findMatchings(p,remaining,1)[0]||[])];}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean')return null;
 const a=analyze(p,raw);if(!a.valid)return null;
 if(!Array.isArray(raw.selected)||raw.selected.length>2||!unique(raw.selected)||!raw.selected.every(i=>indexOK(i)&&!a.used.has(i)))return null;
 if(!Array.isArray(raw.order)||raw.order.length!==12||!unique(raw.order)||!raw.order.every(indexOK)||!Number.isSafeInteger(raw.shuffles)||raw.shuffles<0)return null;
 const pairOK=pair=>Array.isArray(pair)&&pair.length===2&&unique(pair)&&pair.every(indexOK)&&FUSED.has(graph(p).tiles[pair[0]]+graph(p).tiles[pair[1]])&&canPair(p,new Set(),...pair);
 if(!Array.isArray(raw.hinted)||raw.hinted.length>6||!raw.hinted.every(pairOK)||!unique(raw.hinted.map(pair=>pair.join(':'))))return null;
 if(raw.hintPair!==null&&(!pairOK(raw.hintPair)||raw.hintPair.some(i=>a.used.has(i))||!canPair(p,a.used,...raw.hintPair)||!raw.hinted.some(pair=>pair.join(':')===raw.hintPair.join(':'))))return null;
 const terminal=raw.revealed||a.used.size===12||a.mistakes===4;
 if(terminal&&raw.selected.length)return null;
 if(raw.revealed&&(a.used.size===12||a.mistakes===4))return null;
 return {attempts:raw.attempts.map(a=>({tiles:[...a.tiles]})),selected:[...raw.selected],order:[...raw.order],shuffles:raw.shuffles,hinted:raw.hinted.map(pair=>[...pair]),hintPair:raw.hintPair?[...raw.hintPair]:null,revealed:raw.revealed};
}
