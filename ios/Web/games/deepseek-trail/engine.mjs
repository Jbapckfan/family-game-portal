const integer = n => Number.isInteger(n) && n >= 0 && n <= 100000;
export const adjacent = (a, b) => a !== b && Math.max(Math.abs(Math.floor(a / 3) - Math.floor(b / 3)), Math.abs(a % 3 - b % 3)) === 1;
export function validPath(path) {
  return Array.isArray(path) && path.length <= 9 && path.every(i => Number.isInteger(i) && i >= 0 && i < 9) && new Set(path).size === path.length && path.every((i, n) => n === 0 || adjacent(path[n - 1], i));
}
export const wordAt = (p, path) => path.map(i => p.grid[i]).join('');
const isAnswer = (p, s) => validPath(s.path) && s.path.length === p.answer.length && p.accepted.includes(wordAt(p, s.path));
export const createState = () => ({ path: [], hints: 0, checks: 0, submitted: false, revealed: false });
export function getStatus(p, s) {
  if (s.revealed) return 'revealed';
  return s.submitted && isAnswer(p, s) ? 'won' : 'playing';
}
export function restoreState(p, raw) {
  if (!raw || typeof raw !== 'object' || !validPath(raw.path) || !integer(raw.hints) || !integer(raw.checks) || typeof raw.submitted !== 'boolean' || typeof raw.revealed !== 'boolean') return null;
  if ((raw.submitted || raw.revealed) && !isAnswer(p, raw)) return null;
  return { path: [...raw.path], hints: raw.hints, checks: raw.checks, submitted: raw.submitted, revealed: raw.revealed };
}
export function selectTile(p, s, index) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'This trail is complete.' };
  if (!Number.isInteger(index) || index < 0 || index > 8) return { state: s, message: 'Choose a tile on the board.' };
  const previous = s.path.indexOf(index);
  if (previous !== -1) return { state: { ...s, path: s.path.slice(0, previous + 1) }, message: 'Trail shortened to this tile.' };
  if (s.path.length && !adjacent(s.path.at(-1), index)) return { state: s, message: 'Move to a neighboring tile, including diagonally.' };
  return { state: { ...s, path: [...s.path, index] }, message: '' };
}
export const undo = (p, s) => getStatus(p, s) === 'playing' ? { ...s, path: s.path.slice(0, -1) } : s;
export const clear = (p, s) => getStatus(p, s) === 'playing' ? { ...s, path: [] } : s;
export function submit(p, s) {
  if (getStatus(p, s) !== 'playing') return { state: s, message: 'This trail is complete.' };
  if (s.path.length < p.answer.length) return { state: s, message: `Find the ${p.answer.length}-letter word. Your trail has ${s.path.length} letters.` };
  if (!isAnswer(p, s)) return { state: { ...s, checks: s.checks + 1 }, message: 'That path does not match today’s clue. Try a different trail.' };
  return { state: { ...s, submitted: true, checks: s.checks + 1 }, message: 'Every step led to the answer!' };
}
export function hint(p, s) {
  if (getStatus(p, s) !== 'playing') return s;
  let prefix = 0;
  while (prefix < s.path.length && s.path[prefix] === p.path[prefix]) prefix++;
  if (prefix === p.path.length) return s;
  return { ...s, path: p.path.slice(0, prefix + 1), hints: s.hints + 1 };
}
export function reveal(p, s) {
  return getStatus(p, s) === 'playing' ? { ...s, path: [...p.path], revealed: true } : s;
}
export const summarize = (p, s) => `${s.path.length}/${p.answer.length} letters · ${s.hints} hint${s.hints === 1 ? '' : 's'}`;

// A review sample, isolated from the published 3×3 daily bank and its saves.
export const PREVIEW = Object.freeze({
 id: 'trail-4x4-01',
 clue: 'The moment ends. Something stays.',
 definition: 'A lingering light after sunset, or a pleasant feeling that remains after an experience.',
 answer: 'AFTERGLOW',
 grid: Object.freeze(Array.from('FTEOAALREGFWRTLO')),
 path: Object.freeze([5, 10, 13, 8, 12, 9, 14, 15, 11])
});
export const previewAdjacent = (a,b) => a!==b && Math.max(Math.abs(Math.floor(a/4)-Math.floor(b/4)),Math.abs(a%4-b%4))===1;
export const validPreviewPath = path => Array.isArray(path) && path.length<=9 &&
 path.every(i=>Number.isInteger(i)&&i>=0&&i<16) && new Set(path).size===path.length &&
 path.every((i,n)=>n===0||previewAdjacent(path[n-1],i));
const previewAnswer = path => path.length===9 && wordAt(PREVIEW,path)===PREVIEW.answer;
export const createPreview = () => ({sampleId:PREVIEW.id,path:[],attempts:[],definitionShown:false,revealed:false});
export const previewStatus = s => s.revealed?'revealed':s.attempts.length&&previewAnswer(s.attempts.at(-1))?'won':'playing';
export function restorePreview(raw){
 if(!raw||raw.sampleId!==PREVIEW.id||!validPreviewPath(raw.path)||!Array.isArray(raw.attempts)||
  raw.attempts.length>1001||typeof raw.definitionShown!=='boolean'||typeof raw.revealed!=='boolean')return null;
 const guesses=new Set();
 for(let n=0;n<raw.attempts.length;n++){
  const path=raw.attempts[n];
  if(!validPreviewPath(path)||path.length!==9)return null;
  const word=wordAt(PREVIEW,path);
  if(guesses.has(word))return null;
  guesses.add(word);
  if(previewAnswer(path)&&(n!==raw.attempts.length-1||raw.revealed||JSON.stringify(path)!==JSON.stringify(raw.path)))return null;
 }
 if(raw.attempts.length===1001&&!previewAnswer(raw.attempts.at(-1)))return null;
 if(raw.revealed&&!previewAnswer(raw.path))return null;
 return {sampleId:PREVIEW.id,path:[...raw.path],attempts:raw.attempts.map(p=>[...p]),definitionShown:raw.definitionShown,revealed:raw.revealed};
}
export function selectPreview(s,index){
 if(previewStatus(s)!=='playing')return {state:s,message:'This sample is complete.'};
 if(!Number.isInteger(index)||index<0||index>=16)return {state:s,message:'Choose a tile on the board.'};
 const previous=s.path.indexOf(index);
 if(previous===s.path.length-1&&previous!==-1)return {state:s,message:'This is the end of your trail. Choose a neighbor to continue.'};
 if(previous!==-1)return {state:{...s,path:s.path.slice(0,previous+1)},message:'Trail shortened to this tile.'};
 if(s.path.length===9)return {state:s,message:'Your nine letters are ready. Check your trail or backtrack.'};
 if(s.path.length&&!previewAdjacent(s.path.at(-1),index))return {state:s,message:'Choose a neighboring tile, including diagonally.'};
 return {state:{...s,path:[...s.path,index]},message:''};
}
export const undoPreview = s => previewStatus(s)==='playing'?{...s,path:s.path.slice(0,-1)}:s;
export const clearPreview = s => previewStatus(s)==='playing'?{...s,path:[]}:s;
export const definePreview = s => previewStatus(s)==='playing'&&!s.definitionShown?{...s,definitionShown:true}:s;
export const revealPreview = s => previewStatus(s)==='playing'?{...s,path:[...PREVIEW.path],revealed:true}:s;
export function checkPreview(s){
 if(previewStatus(s)!=='playing')return {state:s,message:'This sample is complete.'};
 if(s.path.length!==9)return {state:s,message:`Use nine letters. You have ${s.path.length}.`};
 if(s.attempts.some(p=>wordAt(PREVIEW,p)===wordAt(PREVIEW,s.path)))return {state:s,message:'You already checked that word. Try a different trail.'};
 // Reserve a final record for a win even when the bounded wrong-guess history is full.
 if(s.attempts.length>=1000&&!previewAnswer(s.path))return {state:s,message:'That trail does not fit this clue. Check history is full, but you can keep trying and submit the correct answer.'};
 const state={...s,attempts:[...s.attempts,[...s.path]]};
 return {state,message:previewAnswer(s.path)?'You found your way.': 'That word does not fit this clue. Backtrack or start a new trail.'};
}
export function previewShare(s){
 const status=previewStatus(s);
 return `Alford Daily · Trail · Harder Preview 01\n4×4 · nine letters, seven decoys\n${status==='won'?`Solved in ${s.attempts.length} ${s.attempts.length===1?'check':'checks'}`:status==='revealed'?'Revealed':'In progress'}\n${s.definitionShown?'Definition used':'No definition used'}`;
}
