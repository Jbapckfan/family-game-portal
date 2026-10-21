export const MAX_WILTS=5;
const wordOK=word=>typeof word==='string'&&/^[a-z]+$/.test(word);
export function extraLetter(current,next){
 if(!wordOK(current)||!wordOK(next)||next.length!==current.length+1)return null;
 const letters=[...next];for(const ch of current){const index=letters.indexOf(ch);if(index<0)return null;letters.splice(index,1);}return letters.length===1?letters[0]:null;
}
function candidates(p,length){const level=p.levels[String(length)];return level?[...level.a,...level.d]:[];}
function remainingLetters(p,used){return [...p.pool].filter((_,i)=>!used.includes(i));}
export function findRoute(p,current=p.seed,remaining=[...p.pool]){
 const memo=new Map();
 function visit(word,soil){
  const key=`${word}:${[...soil].sort().join('')}`;if(memo.has(key))return memo.get(key);
  if(word.length===8){const result=p.levels['8'].a.includes(word)?[word]:null;memo.set(key,result);return result;}
  for(const next of candidates(p,word.length+1)){
   const added=extraLetter(word,next),index=soil.indexOf(added);if(added===null||index<0)continue;
   const rest=[...soil];rest.splice(index,1);const path=visit(next,rest);
   if(path){const result=[word,...path];memo.set(key,result);return result;}
  }
  memo.set(key,null);return null;
 }
 return visit(current,remaining);
}
function judgeProgress(p,a,word){
 const current=a.stack.at(-1),added=extraLetter(current,word),remaining=remainingLetters(p,a.soilUsed);
 if(!wordOK(word)||word.length!==current.length+1)return {kind:'length'};
 if(added===null||!remaining.includes(added))return {kind:'letters'};
 if(!candidates(p,word.length).includes(word))return {kind:'unlisted'};
 const rest=[...remaining];rest.splice(rest.indexOf(added),1);
 return {kind:findRoute(p,word,rest)?'grow':'dead',added};
}
function hintLetter(p,a){
 const current=a.stack.at(-1),remaining=remainingLetters(p,a.soilUsed);
 for(const letter of [...new Set(remaining)].sort()){
  const desired=[...current,letter].sort().join('');
  for(const word of candidates(p,current.length+1))if([...word].sort().join('')===desired&&judgeProgress(p,a,word).kind==='grow')return letter;
 }
 return null;
}
export function createState(){return {events:[],typed:[],revealed:false};}
function initialProgress(p){return {valid:true,stack:[p.seed],soilUsed:[],wilts:0,levelWilts:{},hintLetter:null,hints:0};}
function statusOf(a){return a.stack.at(-1).length===8?'won':a.wilts>=MAX_WILTS?'lost':'playing';}
export function analyze(p,s){
 const a=initialProgress(p);
 if(!Array.isArray(s?.events)||s.events.length>10000)return {...a,valid:false};
 for(const event of s.events){
  if(!event||statusOf(a)!=='playing')return {...a,valid:false};
  const level=a.stack.at(-1).length+1;
  if(event.type==='word'){
   const result=judgeProgress(p,a,event.word);
   if(result.kind==='grow'){const index=[...p.pool].findIndex((c,i)=>c===result.added&&!a.soilUsed.includes(i));a.stack.push(event.word);a.soilUsed.push(index);a.hintLetter=null;}
   else if(result.kind==='dead'){a.wilts++;a.levelWilts[level]=(a.levelWilts[level]||0)+1;}
   else return {...a,valid:false};
  }else if(event.type==='hint'){
   if(a.hintLetter!==null)return {...a,valid:false};
   const letter=hintLetter(p,a);if(letter===null)return {...a,valid:false};
   a.hintLetter=letter;a.hints++;a.wilts++;a.levelWilts[level]=(a.levelWilts[level]||0)+1;
  }else if(event.type==='undo'){
   if(a.stack.length===1)return {...a,valid:false};
   a.stack.pop();a.soilUsed.pop();a.hintLetter=null;
  }else if(event.type==='restart'){
   a.stack=[p.seed];a.soilUsed=[];a.hintLetter=null;
  }else return {...a,valid:false};
 }
 return a;
}
export function getStatus(p,s){const a=analyze(p,s);return !a.valid?'playing':s.revealed?'revealed':statusOf(a);}
export function typedWord(p,s){const current=analyze(p,s).stack.at(-1);return s.typed.map(pick=>pick.source==='word'?current[pick.index]:p.pool[pick.index]).join('');}
export function chooseTile(p,s,source,index){
 if(getStatus(p,s)!=='playing'||!['word','soil'].includes(source)||!Number.isInteger(index))return s;
 const a=analyze(p,s),current=a.stack.at(-1),length=source==='word'?current.length:p.pool.length;
 if(index<0||index>=length||s.typed.length>=current.length+1||s.typed.some(pick=>pick.source===source&&pick.index===index))return s;
 if(source==='soil'&&(a.soilUsed.includes(index)||s.typed.some(pick=>pick.source==='soil')))return s;
 return {...s,typed:[...s.typed,{source,index}]};
}
export function selectWord(p,s,input){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This plant is complete.'};
 const word=String(input).trim().toLowerCase(),a=analyze(p,s),current=a.stack.at(-1),typed=[];
 if(!/^[a-z]*$/.test(word)||word.length>current.length+1)return {state:null,message:`Build a ${current.length+1}-letter word.`};
 for(const ch of word){
  let index=[...current].findIndex((c,i)=>c===ch&&!typed.some(t=>t.source==='word'&&t.index===i));
  if(index>=0){typed.push({source:'word',index});continue;}
  index=[...p.pool].findIndex((c,i)=>c===ch&&!a.soilUsed.includes(i));
  if(index<0||typed.some(t=>t.source==='soil'))return {state:null,message:'Use every letter in your word and only one available soil letter.'};
  typed.push({source:'soil',index});
 }
 return {state:{...s,typed},message:''};
}
export function submitWord(p,s,input=typedWord(p,s)){
 if(getStatus(p,s)!=='playing')return {state:s,message:'This plant is complete.'};
 const word=String(input).trim().toLowerCase(),a=analyze(p,s),result=judgeProgress(p,a,word);
 if(result.kind==='length')return {state:s,message:`Use all ${a.stack.at(-1).length+1} letters.`};
 if(result.kind==='letters')return {state:s,message:'Keep every letter in your word and add exactly one available soil letter.'};
 if(result.kind==='unlisted')return {state:s,message:'That is not in this puzzle’s word list. No wilt charged.'};
 const next={...s,events:[...s.events,{type:'word',word}],typed:[]},status=getStatus(p,next);
 return {state:next,message:status==='won'?`${word.toUpperCase()} — in bloom.`:status==='lost'?'Five wilts. One complete growth path is shown below.':result.kind==='grow'?`${word.toUpperCase()} grows. Now add one more letter.`:`${word.toUpperCase()} is a dead end. One wilt; your previous word and soil are kept.`};
}
export function undo(p,s){return getStatus(p,s)==='playing'&&analyze(p,s).stack.length>1?{...s,events:[...s.events,{type:'undo'}],typed:[]}:s;}
export function restart(p,s){return getStatus(p,s)==='playing'?{...s,events:[...s.events,{type:'restart'}],typed:[]}:s;}
export function hint(p,s){
 const a=analyze(p,s);if(getStatus(p,s)!=='playing'||a.hintLetter!==null||hintLetter(p,a)===null)return null;
 return {...s,events:[...s.events,{type:'hint'}],typed:[]};
}
export function reveal(p,s){return getStatus(p,s)==='playing'?{...s,typed:[],revealed:true}:s;}
export function solutionPath(p,s){const a=analyze(p,s),tail=findRoute(p,a.stack.at(-1),remainingLetters(p,a.soilUsed));return tail?[...a.stack.slice(0,-1),...tail]:(findRoute(p)||[]);}
export function restoreState(p,raw){
 if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean')return null;
 const a=analyze(p,raw);if(!a.valid||!Array.isArray(raw.typed)||raw.typed.length>a.stack.at(-1).length+1)return null;
 const current=a.stack.at(-1),keys=new Set();let soil=0;
 for(const pick of raw.typed){
  if(!pick||!['word','soil'].includes(pick.source)||!Number.isInteger(pick.index)||pick.index<0)return null;
  if(pick.source==='word'&&pick.index>=current.length)return null;
  if(pick.source==='soil'&&(pick.index>=p.pool.length||a.soilUsed.includes(pick.index)||++soil>1))return null;
  const key=`${pick.source}:${pick.index}`;if(keys.has(key))return null;keys.add(key);
 }
 if((raw.revealed||statusOf(a)!=='playing')&&raw.typed.length)return null;
 if(raw.revealed&&statusOf(a)!=='playing')return null;
 return {events:raw.events.map(e=>e.type==='word'?{type:'word',word:e.word}:{type:e.type}),typed:raw.typed.map(t=>({source:t.source,index:t.index})),revealed:raw.revealed};
}
