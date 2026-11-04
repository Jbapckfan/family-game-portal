import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,toggleCell,markCell,undo,restart,hint,reveal,clueStatus} from './engine.mjs';

let selectedLine=0,tool='cycle',viewPuzzle=null,helpOpen=false;
mountDailyGame({
 assistanceCount:(p,s)=>s.hinted.length,
 id:'qwen-logic-lattice',name:'Logic Lattice',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
 intro:'Make each row, column and diagonal contain exactly the right number of black squares.',
 instructions:[
  'Numbers count an entire line of five squares. They do not count neighboring squares, and there are no hidden mines.',
  'A line labeled 2 needs two black squares and three white squares, in any positions. White means decided empty; a question mark means undecided.',
  'Select any number or diagonal card to highlight the five squares it counts. The line guide tracks your marks without revealing the answer.',
  'Choose Black, White or Clear to mark squares directly, or Cycle to rotate unknown → black → white → unknown. With a square focused, B, W and U work too. Arrow keys move to the next editable square.',
  'Squares marked ◆ are fixed givens. The center square belongs to both diagonals. Every square must be decided before you win.',
  'Undo reverses a mark. Restart returns to the givens. Hints correct a square and are recorded as assistance.'
 ],puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 summarize:(p,s)=>`${s.revealed?'Solution revealed':'All 25 squares and all 12 counting clues agree'}${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'square':'squares'} hinted`:s.revealed?'':' · solved without hints'}.`,
 render:renderBoard
});
function renderBoard(ctx){
 const {root,puzzle:p,state:s,commit,announce}=ctx;
 helpOpen=root.querySelector('.lattice-explanation')?.open??helpOpen;
 if(viewPuzzle!==p.id){viewPuzzle=p.id;selectedLine=0;tool='cycle';}
 const clues=clueStatus(p,s.cells),givens=new Map(p.givens),known=s.cells.filter(v=>v!==-1).length,finished=getStatus(p,s)!=='playing',line=clues[selectedLine];
 const selected=new Set(line.indices),white=5-line.black-line.unknown;
 const clueLabel=c=>`${c.label}: ${c.target} black required, ${c.black} marked black, ${c.unknown} undecided${c.status==='satisfied'?', count met':c.status==='contradiction'?', impossible with current marks':''}. Select to highlight this line.`;
 const mark=c=>c.status==='satisfied'?'✓':c.status==='contradiction'?'!':'';
 const countButton=(c,n)=>`<button type="button" class="lattice-count ${c.status} ${n===selectedLine?'active-clue':''}" data-clue="${n}" aria-pressed="${n===selectedLine}" aria-label="${esc(clueLabel(c))}">${c.target}<small aria-hidden="true">${mark(c)}</small></button>`;
 let guidance;
 if(line.black>line.target)guidance=`Too many black squares: change ${line.black-line.target} or more of them.`;
 else if(line.black+line.unknown<line.target)guidance='Too many white squares: this line cannot reach its black total. Revisit a white mark.';
 else if(!line.unknown)guidance='This line’s count is met. Its marks must also fit the crossing lines.';
 else if(line.black===line.target)guidance=`If these black marks stand, the ${line.unknown} undecided ${line.unknown===1?'square must':'squares must'} be white.`;
 else if(line.black+line.unknown===line.target)guidance=`To meet this total, all ${line.unknown} undecided ${line.unknown===1?'square must':'squares must'} be black.`;
 else guidance=`Find ${line.target-line.black} more black ${line.target-line.black===1?'square':'squares'} among the ${line.unknown} undecided. The rest must be white.`;
 root.innerHTML=`<section class="panel lattice-panel">
 <div class="lattice-top"><div><p class="eyebrow">COUNT THE WHOLE LINE</p><h2>Fill the grid. Match every total.</h2></div><span class="pill">${known}/25 decided</span></div>
 <div class="lattice-example"><strong>A line labeled 2</strong><span class="example-squares" role="img" aria-label="Example only: two black and three white squares"><i class="black"></i><i class="white"></i><i class="black"></i><i class="white"></i><i class="white"></i></span><span>2 black + 3 white. <b>Any positions.</b></span></div>
 <div class="lattice-tools" role="group" aria-label="Choose how to mark squares">${[['cycle','Cycle'],['black','● Black'],['white','○ White'],['clear','? Clear']].map(([value,label])=>`<button class="button" type="button" data-tool="${value}" aria-pressed="${tool===value}" ${finished?'disabled':''}>${label}</button>`).join('')}</div>
 <div class="lattice-layout"><div class="lattice-grid-area"><p class="lattice-axis">Column totals above · row totals at left</p>
 <p class="lattice-selected-summary"><strong>${esc(line.label)} · ${line.target} black total.</strong> ${esc(guidance)}</p><div class="lattice-board" role="group" aria-label="Five by five logic grid; numbers count whole lines"><span class="lattice-corner" aria-hidden="true"></span>${clues.slice(5,10).map((c,i)=>countButton(c,i+5)).join('')}${Array.from({length:5},(_,row)=>`${countButton(clues[row],row)}${Array.from({length:5},(_,column)=>{const i=row*5+column,value=s.cells[i],label=value===-1?'undecided':value===1?'black':'white';return `<button class="lattice-cell ${value===-1?'unknown':label} ${selected.has(i)?'in-line':''} ${givens.has(i)?'given':''} ${s.lastHint===i?'hinted':''}" type="button" data-cell="${i}" ${givens.has(i)||finished?'disabled':''} aria-label="Row ${row+1}, column ${column+1}: ${label}${givens.has(i)?', fixed given':''}${selected.has(i)?', in selected line':''}"><span aria-hidden="true">${value===-1?'?':value===1?'●':'○'}</span>${givens.has(i)?'<small aria-hidden="true">◆</small>':''}</button>`;}).join('')}`).join('')}</div>
 <div class="lattice-legend"><span>? Undecided</span><span>● Black</span><span>○ White = empty</span><span>◆ Fixed</span></div>
 <div class="lattice-diagonals">${clues.slice(10).map((c,i)=>`<button type="button" data-clue="${i+10}" class="lattice-diagonal ${c.status} ${selectedLine===i+10?'active-clue':''}" aria-pressed="${selectedLine===i+10}" aria-label="${esc(clueLabel(c))}"><strong>${i===0?'↘':'↙'} ${c.target} black ${mark(c)}</strong><small>${i===0?'Top left → bottom right':'Top right → bottom left'}</small></button>`).join('')}</div></div>
 <aside class="lattice-guide" aria-label="Selected line guide"><p class="eyebrow">HIGHLIGHTED LINE</p><h3>${esc(line.label)}</h3><p class="lattice-goal">Needs <strong>${line.target} black</strong> <br>and <strong>${5-line.target} white</strong></p><div class="lattice-tally"><span><b>${line.black}</b>Black</span><span><b>${white}</b>White</span><span><b>${line.unknown}</b>Undecided</span></div><p id="lattice-guidance" role="status">${esc(guidance)}</p><p class="lattice-guide-tip">Tap another number to inspect its line. All twelve lines must agree.</p></aside></div>
 <details class="lattice-explanation" ${helpOpen?'open':''}><summary>How the clues work</summary><p>Every number counts <strong>black squares across its entire line</strong>. Positions are up to you. Nothing is hidden beneath the squares.</p><p>The two diagonal clues count the five squares between opposite corners. The center square counts in both. Fixed ◆ squares already count toward their lines.</p><p><strong>White is a decision.</strong> Even after reaching the black total, mark the remaining squares white. ✓ means that line’s count is met; its squares must still satisfy crossing lines. ! means the current marks make its total impossible.</p><p>Keyboard: Tab to a square; arrows move; B black, W white, U undecided. Undo reverses individual square marks. Restart clears your marks and returns to the givens.</p></details>
 ${finished?'':`<div class="actions"><button type="button" id="lattice-undo" class="button" ${s.history.length?'':'disabled'}>Undo</button><button type="button" id="lattice-restart" class="button">Restart</button></div>`}
 ${s.lastHint!==null?`<p class="lattice-hint">Hint: row ${Math.floor(s.lastHint/5)+1}, column ${s.lastHint%5+1} is ${s.cells[s.lastHint]===1?'black':'white'}. The outlined square has been set.</p>`:''}</section>`;
 root.querySelectorAll('[data-clue]').forEach(b=>b.onclick=()=>{selectedLine=+b.dataset.clue;renderBoard(ctx);root.querySelector(`[data-clue="${selectedLine}"]`).focus({preventScroll:true});announce(`${clueLabel(clues[selectedLine])} ${root.querySelector("#lattice-guidance").textContent}`);});
 if(finished){queueMicrotask(()=>root.querySelectorAll('[data-clue]').forEach(b=>{b.disabled=false;}));return;}
 root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;renderBoard(ctx);root.querySelector(`[data-tool="${tool}"]`).focus({preventScroll:true});});
 const apply=(index,value)=>{const next=value===undefined?toggleCell(p,s,index):markCell(p,s,index,value);if(next!==s)commit(next,`Row ${Math.floor(index/5)+1}, column ${index%5+1}: ${next.cells[index]===1?'black':next.cells[index]===0?'white':'undecided'}.`);root.querySelector(`[data-cell="${index}"]`)?.focus({preventScroll:true});};
 root.querySelectorAll('[data-cell]').forEach(button=>{
  const index=+button.dataset.cell;
  button.onclick=()=>apply(index,{black:1,white:0,clear:-1}[tool]);
  button.onkeydown=event=>{
   if(event.ctrlKey||event.altKey||event.metaKey)return;
   const value={b:1,w:0,u:-1}[event.key.toLowerCase()];
   if(value!==undefined){event.preventDefault();if(!event.repeat)apply(index,value);return;}
   const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[event.key];
   if(!delta)return;event.preventDefault();let row=Math.floor(index/5)+delta[0],col=index%5+delta[1];
   while(row>=0&&row<5&&col>=0&&col<5){const next=root.querySelector(`[data-cell="${row*5+col}"]`);if(!next.disabled){next.focus({preventScroll:true});break;}row+=delta[0];col+=delta[1];}
  };
 });
 root.querySelector('#lattice-undo').onclick=()=>{commit(undo(p,s),'Last mark undone.');root.querySelector('[data-cell]:not(:disabled)')?.focus({preventScroll:true});};
 root.querySelector('#lattice-restart').onclick=()=>{commit(restart(p,s),'Starting givens restored. Hint use stays recorded.');root.querySelector('[data-cell]:not(:disabled)')?.focus({preventScroll:true});};
}
