import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,toggleCell,markCell,undo,restart,hint,reveal,clueStatus} from './engine.mjs';

mountDailyGame({
 assistanceCount:(p,s)=>s.hinted.length,
 id:'qwen-logic-lattice',name:'Logic Lattice',creator:'Qwen',credit:'Concept by Qwen · Built by ChatGPT',accent:'#087c99',
 intro:'A quiet grid. A handful of clues. Exactly one way for every square to agree.',
 instructions:[
  'Make every square black or white. Each number above or beside the grid is the required number of black squares in that column or row.',
  'The two diagonal clues count black squares from corner to opposite corner. The center square belongs to both diagonals.',
  'Tap a square to cycle unknown → black → white → unknown. With a square focused, B marks black, W marks white, and U clears it to unknown. Squares marked with a small fixed dot are given and cannot change.',
  'A check marks a correct completed line; an exclamation marks an impossible total. A matching black total still needs every remaining square marked white.',
  'There is exactly one solution. Undo and Restart are always available during play. A little hint fills or corrects one square and marks the result assisted.'
 ],puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 summarize:(p,s)=>`${s.revealed?'Solution revealed':'All 25 squares and all 12 counting clues agree'}${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'square':'squares'} hinted`:s.revealed?'':' · solved without hints'}.`,
 render({root,puzzle:p,state:s,commit}){
  const clues=clueStatus(p,s.cells),givens=new Map(p.givens),known=s.cells.filter(v=>v!==-1).length,finished=getStatus(p,s)!=='playing';
  const clueLabel=clue=>`${clue.label}: ${clue.target} black required, ${clue.black} placed, ${clue.unknown} unknown${clue.status==='contradiction'?', contradictory marks':clue.status==='satisfied'?', satisfied':''}`;
  root.innerHTML=`<section class="panel lattice-panel"><div class="row lattice-progress"><strong>${known} / 25 squares marked</strong><span class="pill">${p.givens.length} fixed</span></div><p class="muted lattice-note">Numbers count black squares. Tap to cycle · B black · W white · U unknown. ✓ complete · ! impossible.</p><div class="lattice-board" role="group" aria-label="Five by five logic grid"><span class="lattice-corner" aria-hidden="true">●</span>${clues.filter(c=>c.kind==='column').map(c=>`<div class="lattice-count ${c.status}" aria-label="${esc(clueLabel(c))}" title="${esc(clueLabel(c))}">${c.target}<small class="lattice-clue-mark" aria-hidden="true">${c.status==='satisfied'?'✓':c.status==='contradiction'?'!':''}</small></div>`).join('')}${Array.from({length:5},(_,row)=>`<div class="lattice-count ${clues[row].status}" aria-label="${esc(clueLabel(clues[row]))}" title="${esc(clueLabel(clues[row]))}">${clues[row].target}<small class="lattice-clue-mark" aria-hidden="true">${clues[row].status==='satisfied'?'✓':clues[row].status==='contradiction'?'!':''}</small></div>${Array.from({length:5},(_,column)=>{const i=row*5+column,value=s.cells[i],label=value===-1?'unknown':value===1?'black':'white';return `<button class="lattice-cell ${label} ${givens.has(i)?'given':''} ${s.lastHint===i?'hinted':''}" type="button" data-cell="${i}" ${givens.has(i)||finished?'disabled':''} aria-label="Row ${row+1}, column ${column+1}: ${label}${givens.has(i)?', fixed given':s.lastHint===i?', hinted':''}"><span aria-hidden="true">${value===-1?'·':value===1?'●':'○'}</span>${givens.has(i)?'<small aria-hidden="true">◆</small>':''}</button>`;}).join('')}`).join('')}</div><div class="lattice-legend" aria-label="Square states"><span><i class="unknown"></i>Unknown</span><span><i class="black"></i>Black</span><span><i class="white"></i>White</span></div><div class="lattice-diagonals">${clues.filter(c=>c.kind==='diagonal').map(c=>`<div class="lattice-diagonal ${c.status}" aria-label="${esc(clueLabel(c))}"><strong><span aria-hidden="true">${c.index===0?'↘':'↙'}</span> ${c.target} black</strong><small>${c.black} placed · ${c.unknown} unknown${c.status==='satisfied'?' · ✓ complete':c.status==='contradiction'?' · ! impossible':''}</small></div>`).join('')}</div>${finished?'':`<div class="actions"><button type="button" id="lattice-undo" class="button" ${s.history.length?'':'disabled'}>Undo</button><button type="button" id="lattice-restart" class="button">Restart</button></div>`}${clues.some(c=>c.status==='contradiction')?'<p class="lattice-warning">A clue marked ! cannot be satisfied with the current marks. You can change any square without a fixed dot.</p>':''}${s.lastHint!==null?`<p class="lattice-hint">Hint: row ${Math.floor(s.lastHint/5)+1}, column ${s.lastHint%5+1} is ${s.cells[s.lastHint]===1?'black':'white'}. The outlined square is corrected.</p>`:''}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.cell);commit(toggleCell(p,s,index),'');root.querySelector(`[data-cell="${index}"]`)?.focus({preventScroll:true});}));
  root.querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('keydown',event=>{
   if(event.ctrlKey||event.altKey||event.metaKey)return;
   const value={b:1,w:0,u:-1}[event.key.toLowerCase()];
   if(value===undefined)return;
   event.preventDefault();const index=Number(button.dataset.cell),next=markCell(p,s,index,value);
   if(next===s)return;
   commit(next,`Row ${Math.floor(index/5)+1}, column ${index%5+1}: ${value===1?'black':value===0?'white':'unknown'}.`);
   root.querySelector(`[data-cell="${index}"]`)?.focus({preventScroll:true});
  }));
  root.querySelector('#lattice-undo').addEventListener('click',()=>commit(undo(p,s),'Last mark undone.'));
  root.querySelector('#lattice-restart').addEventListener('click',()=>commit(restart(p,s),'The starting clues are ready again. Hint use stays recorded.'));
 }
});
