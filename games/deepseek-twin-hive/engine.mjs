import {WORDS_BY_RACK} from './word-acceptance.mjs';
// Concept: DeepSeek. Completed rules, validation and implementation: ChatGPT.
// Keep the earlier common-word hint priority and all authored records intact.
// Broader offline source acceptance obeys the same rack and gold-letter rules.
const REVIEWED_COMMON_WORDS=Object.freeze(['EARS']);
const acceptanceCache=new WeakMap();
export function acceptedWords(puzzle){
 if(!acceptanceCache.has(puzzle)){
  const eligible=word=>[...word].every(letter=>puzzle.letters.includes(letter))&&puzzle.gold.every(letter=>word.includes(letter));
  // Authored words keep their order for familiar hints. Broader acceptance does
  // not change the six-word target or invalidate any previously valid save.
  acceptanceCache.set(puzzle,Object.freeze([...new Set([...puzzle.answers,...REVIEWED_COMMON_WORDS.filter(eligible),...(WORDS_BY_RACK[puzzle.letters]||[]).filter(eligible)])]));
 }
 return acceptanceCache.get(puzzle);
}
export const createState = () => ({ found: [], hinted: [], hintWord: null, revealed: false });
export function getStatus(puzzle, state) { return state.revealed ? 'revealed' : state.found.length >= puzzle.target ? 'won' : 'playing'; }
export const score = state => state.found.reduce((sum, word) => sum + word.length - 3, 0);
export function submitWord(puzzle, state, input) {
 if (getStatus(puzzle,state)!=='playing') return {state,message:'This round is complete.'};
 const word=typeof input==='string'?input.trim().toUpperCase():'';
 if(!/^[A-Z]{4,24}$/.test(word))return{state,message:'Use at least four letters.'};
 if(![...word].every(c=>puzzle.letters.includes(c)))return{state,message:'Use only the eight hive letters.'};
 if(!puzzle.gold.every(c=>word.includes(c)))return{state,message:'Every word needs both gold letters.'};
 if(!acceptedWords(puzzle).includes(word))return{state,message:'That is not in this puzzle’s word list. Try another word.'};
 if(state.found.includes(word))return{state,message:'You already found that word.'};
 return {state:{...state,found:[...state.found,word],hintWord:state.hintWord===word?null:state.hintWord},message:`${word} · +${word.length-3} ${word.length===4?'point':'points'}`};
}
export function hint(puzzle,state){
 if(getStatus(puzzle,state)!=='playing'||state.hintWord)return null;
 const word=acceptedWords(puzzle).find(w=>!state.found.includes(w));
 return word?{...state,hintWord:word,hinted:[...state.hinted,word]}:null;
}
export function reveal(puzzle,state){return getStatus(puzzle,state)==='playing'?{...state,revealed:true}:state;}
export function restoreState(puzzle,raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.found)||!Array.isArray(raw.hinted)||typeof raw.revealed!=='boolean')return null;
 const accepted=acceptedWords(puzzle);
 for(const values of [raw.found,raw.hinted])if(values.length>accepted.length||new Set(values).size!==values.length||values.some(w=>typeof w!=='string'||!accepted.includes(w)))return null;
 if(raw.hintWord!==null&&(typeof raw.hintWord!=='string'||!raw.hinted.includes(raw.hintWord)||raw.found.includes(raw.hintWord)))return null;
 return{found:[...raw.found],hinted:[...raw.hinted],hintWord:raw.hintWord,revealed:raw.revealed};
}
