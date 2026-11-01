import {dictionaryPath,wordPartition} from './word-acceptance.mjs';
import {DICTIONARY} from './puzzles.mjs';
const WORDS=new Set(DICTIONARY);
export const MAX_KNOTS=4;
export const createState=()=>({events:[],selected:[],revealed:false});
const emptyView=()=>({pulls:[],removed:[],tried:[],hints:[],knots:0,assists:0});
export const selectedWord=(p,s)=>[...s.selected].sort((a,b)=>a-b).map(i=>p.s[i]).join('');
export function findWordPaths(sequence,word){const paths=[];function walk(start,used){if(used.length===word.length){paths.push(used);return;}for(let i=start;i<sequence.length;i++)if(sequence[i]===word[used.length])walk(i+1,[...used,i]);}walk(0,[]);return paths;}
/** Assign every remaining bead to an ordered target word. This also detects
 * duplicate-letter pulls that need undo instead of silently removing other beads. */
function legacyAllocation(p,v){
  const left=[...p.s].map((_,i)=>i).filter(i=>!v.removed.includes(i));
  const remaining=p.w.map((_,j)=>j).filter(j=>!v.pulls.some(x=>x.target===j));
  const cursors=p.w.map(()=>0),failed=new Set();
  function visit(at){
    if(at===left.length)return remaining.every(j=>cursors[j]===p.w[j].length)?[]:null;
    const key=`${at}:${cursors.join(',')}`;if(failed.has(key))return null;
    for(const j of remaining){if(p.w[j][cursors[j]]!==p.s[left[at]])continue;cursors[j]++;const tail=visit(at+1);cursors[j]--;if(tail)return [j,...tail];}
    failed.add(key);return null;
  }
  const owners=visit(0);if(!owners)return null;
  const result=p.w.map(()=>[]);owners.forEach((j,n)=>result[j].push(left[n]));return result;
}
export function allocation(p,v){return v.vocabulary===2?(legacyAllocation(p,v)??wordPartition(p,v)):legacyAllocation(p,v);}
function hintFor(p,v){
  const solution=allocation(p,v);
  if(!solution)return v.pulls.length?{type:'recover'}:null;
  const remaining=p.w.map((_,j)=>j).filter(j=>!v.pulls.some(x=>x.target===j)).sort((a,b)=>p.w[b].length-p.w[a].length||a-b);
  const target=remaining[0];if(target===undefined)return null;
  const index=solution[target][0];if(v.hints.some(h=>h.index===index&&h.target===target))return null;
  return {type:'hint',index,target};
}
function popPull(v){const pull=v.pulls.pop();if(!pull)return false;v.removed=v.removed.filter(i=>!pull.indices.includes(i));return true;}
export function replay(p,events,vocabulary=1){
  if(!Array.isArray(events)||events.length>2000)return null;
  const v={...emptyView(),...(vocabulary===2?{vocabulary:2}:{})};
  for(const event of events){
    if(!event||typeof event!=='object'||v.knots>=MAX_KNOTS||v.pulls.length===p.w.length)return null;
    if(event.type==='pull'||event.type==='knot'){
      const ix=event.indices;
      if(!Array.isArray(ix)||!ix.length||ix.some((n,i)=>!Number.isInteger(n)||n<0||n>=p.s.length||(i&&n<=ix[i-1])||v.removed.includes(n)))return null;
      const word=ix.map(i=>p.s[i]).join(''),remaining=p.w.map((_,j)=>j).filter(j=>!v.pulls.some(x=>x.target===j));
      if(!remaining.some(j=>p.w[j].length===word.length))return null;
      const slot=vocabulary===2?remaining.find(j=>p.w[j].length===word.length):remaining.find(j=>p.w[j]===word);
      const listed=vocabulary===2?dictionaryPath(p,ix):WORDS.has(word);
      const viable=vocabulary===2&&slot!==undefined&&listed?wordPartition(p,{pulls:[...v.pulls,{target:slot,indices:ix}],removed:[...v.removed,...ix]}):null;
      const target=vocabulary===2?(viable?slot:undefined):slot;
      if(event.type==='pull'){
        if(target===undefined)return null;v.pulls.push({target,indices:[...ix],...(vocabulary===2?{word}:{})});v.removed.push(...ix);v.removed.sort((a,b)=>a-b);
      }else{
        if(target!==undefined||!listed||v.tried.includes(word))return null;v.tried.push(word);v.knots++;
      }
    }else if(event.type==='hint'){
      const h=hintFor(p,v);if(!h||h.type!=='hint'||h.index!==event.index||h.target!==event.target)return null;
      v.hints.push({index:h.index,target:h.target});v.knots++;v.assists++;
    }else if(event.type==='recover'){
      if(hintFor(p,v)?.type!=='recover'||!popPull(v))return null;v.assists++;
    }else if(event.type==='undo'){
      if(!popPull(v))return null;
    }else if(event.type==='restart'){
      if(!v.pulls.length)return null;v.pulls=[];v.removed=[];
    }else return null;
  }
  return v;
}
export const view=(p,s)=>replay(p,s.events,s.vocabulary);
export function getStatus(p,s){if(s.revealed)return 'revealed';const v=view(p,s);if(!v)return 'playing';return v.knots>=MAX_KNOTS?'lost':v.pulls.length===p.w.length?'won':'playing';}
export function restoreState(p,raw){
  if(!raw||typeof raw!=='object'||typeof raw.revealed!=='boolean'||(raw.vocabulary!==undefined&&raw.vocabulary!==2)||!Array.isArray(raw.selected))return null;
  const v=replay(p,raw.events,raw.vocabulary);if(!v)return null;
  if(raw.selected.length>p.s.length||new Set(raw.selected).size!==raw.selected.length||raw.selected.some(i=>!Number.isInteger(i)||i<0||i>=p.s.length||v.removed.includes(i)))return null;
  if((raw.revealed||v.knots===MAX_KNOTS||v.pulls.length===p.w.length)&&raw.selected.length)return null;
  return {events:raw.events.map(e=>e.indices?{type:e.type,indices:[...e.indices]}:e.type==='hint'?{type:'hint',index:e.index,target:e.target}:{type:e.type}),selected:[...raw.selected],revealed:raw.revealed,...(raw.vocabulary===2?{vocabulary:2}:{})};
}
export function toggle(p,s,index){
  if(getStatus(p,s)!=='playing')return {state:s,message:'This tangle is finished.'};
  if(!Number.isInteger(index)||index<0||index>=p.s.length||view(p,s).removed.includes(index))return {state:s,message:'Choose a bead still in the tangle.'};
  return {state:{...s,selected:s.selected.includes(index)?s.selected.filter(i=>i!==index):[...s.selected,index]},message:''};
}
export const clear=(p,s)=>getStatus(p,s)==='playing'?{...s,selected:[]}:s;
export const backspace=(p,s)=>getStatus(p,s)==='playing'?{...s,selected:s.selected.slice(0,-1)}:s;
export function submit(p,s){
  if(getStatus(p,s)!=='playing')return {state:s,message:'This tangle is finished.'};
  const word=selectedWord(p,s),v=view(p,s),remaining=p.w.map((_,j)=>j).filter(j=>!v.pulls.some(x=>x.target===j));
  if(!word)return {state:s,message:'Select the beads of one word.'};
  if(!remaining.some(j=>p.w[j].length===word.length))return {state:s,message:`Threads left have ${remaining.map(j=>p.w[j].length).sort().join(', ')} letters.`};
  const indices=[...s.selected].sort((a,b)=>a-b),slot=s.vocabulary===2?remaining.find(j=>p.w[j].length===word.length):remaining.find(j=>p.w[j]===word);
  const listed=s.vocabulary===2?dictionaryPath(p,indices):WORDS.has(word);
  const viable=s.vocabulary===2&&slot!==undefined&&listed?wordPartition(p,{pulls:[...v.pulls,{target:slot,indices}],removed:[...v.removed,...indices]}):null;
  const target=s.vocabulary===2?(viable?slot:undefined):slot;
  // A word is not a trap merely because duplicate-letter copies were chosen
  // badly. Leave the selection in place so the player can choose the copies;
  // older saved knot events still replay under their original per-path rule.
  if(s.vocabulary===2&&target===undefined&&listed&&slot!==undefined&&findWordPaths(p.s,word).some(path=>
    path.every(i=>!v.removed.includes(i))&&dictionaryPath(p,path)&&wordPartition(p,{pulls:[...v.pulls,{target:slot,indices:path}],removed:[...v.removed,...path]})
  ))return {state:s,message:`${word.toUpperCase()} fits with other copies of its letters. Try other copies. No knot.`};
  if(target===undefined&&v.tried.includes(word))return {state:s,message:'Already tried that word. No extra knot.'};
  if(target===undefined&&!listed)return {state:{...s,selected:[]},message:'Not in the game dictionary. No knot.'};
  const event={type:target===undefined?'knot':'pull',indices:[...s.selected].sort((a,b)=>a-b)};
  const next={...s,events:[...s.events,event],selected:[]};
  return {state:next,message:target===undefined?(s.vocabulary===2?`${word.toUpperCase()} is a valid word, but no available placement leaves a complete set of threads. One knot; all beads stay available.`:`${word.toUpperCase()} is a word, but not one of these threads. One knot.`):getStatus(p,next)==='won'?'Every thread pulled clean.':allocation(p,view(p,next))?`${word.toUpperCase()} pulled. Follow the remaining threads.`:`${word.toUpperCase()} pulled, but these copies block another thread. Undo pull to choose different beads.`};
}
export function undoPull(p,s){return getStatus(p,s)==='playing'&&view(p,s).pulls.length?{...s,events:[...s.events,{type:'undo'}],selected:[]}:s;}
export function restart(p,s){if(getStatus(p,s)!=='playing')return s;return view(p,s).pulls.length?{...s,events:[...s.events,{type:'restart'}],selected:[]}:clear(p,s);}
export function hint(p,s){if(getStatus(p,s)!=='playing')return null;const h=hintFor(p,view(p,s));return h?{...s,events:[...s.events,h],selected:[]}:null;}
export const reveal=(p,s)=>getStatus(p,s)==='playing'?{...s,selected:[],revealed:true}:s;
export const summarize=(p,s)=>{const v=view(p,s);return `${v.pulls.length}/3 threads · ${v.knots}/4 knots · ${v.assists} hints`;};

export const assistanceCount=(p,s)=>view(p,s).assists;

export const createExpandedState=()=>({...createState(),vocabulary:2});
