import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';
import { openResultShare } from './share-card.mjs';

const $=id=>document.getElementById(id);
let hintMessage='';
let followedColumn=null;
const app=createShell({
  lesson:{question:'Shift A B C D one place to the right. Which strip do you get?',choices:[{label:'D A B C',correct:true,why:'The right edge wraps around to become the first letter.'},{label:'B C D A',correct:false,why:'That is one shift to the left. Try wrapping D around to the front.'},{label:'D C B A',correct:false,why:'A shift keeps the letter order. It does not reverse the strip.'}]},
  slug:'sideways',name:'Sideways',puzzles:PUZZLES,engine,
  sibling:{slug:'second-sense',name:'Second Sense',url:'../second-sense/'},
  reset(){hintMessage='';followedColumn=null;},
  record:game=>({status:game.status,checks:game.checks,moves:game.moves,hints:game.hints}),
  share:openResultShare,
  help:`<p class="dialog-kicker">MOVE ACROSS. READ DOWN.</p><h2 class="dialog-title" id="dialog-title">Think sideways.</h2><p class="dialog-body">Five horizontal strips hold the letters of four vertical answers. Rotate a strip left or right; its edge letter wraps around.</p><div class="help-example">A B C D <span class="arrow">→</span> D A B C<br><small>One shift to the right. No letters added or removed.</small></div><ol class="help-list"><li>Read the four clues above the grid. Each answer has five letters and reads <strong>top to bottom.</strong></li><li>Use the arrows to rotate any row. Every row contributes to all four columns.</li><li>When the words line up, check the board. A check tells you which columns match. After a move, that feedback expires.</li></ol><p class="dialog-body">There is one arrangement that matches all four clues. Shift and undo freely; every shift stays in your move count. <strong>One check without nudges is perfect.</strong> A nudge turns one row into its correct position, but you still need to check the board.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Get things in line →</button></div>`,
  about:'Sideways is a spatial word puzzle. Rotate five four-letter strips until four clued words read down the columns. Every published board is exhaustively checked across all 1,024 row orientations and has exactly one arrangement matching all four answers. Repeated letters make the clues depend on each other, so one answer alone does not settle the whole board.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect first checks</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won?stats.averageChecks.toFixed(1):'—'}</strong></div>`,
  result(api){const {game,mode,daily}=api;const won=game.status==='won';const perfect=won&&game.checks===1&&game.hints===0;return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A CHANGE OF PERSPECTIVE'}</p><div class="result-symbol" aria-hidden="true">↔</div><h2 class="dialog-title" id="dialog-title">${perfect?'Perfectly in line.':won?'Everything lines up.':'Board revealed.'}</h2><p class="result-copy">${won?'Four words. One shared arrangement. You found the right angle.':'The four answers now read down. This board is recorded as revealed.'}</p><div class="result-metrics"><div><strong>${game.checks}</strong><span>checks</span></div><div><strong>${game.moves}</strong><span>moves</span></div><div><strong>${game.hints}</strong><span>nudges</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your result ↗</button><button class="secondary-button" data-action="random">Another puzzle →</button></div><p class="fineprint">The shared score never reveals the words.<br>${mode==='daily'?'A new daily at midnight Central.':'Practice stays separate from your daily score.'}</p>`;},
  render:renderGame,
});
function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';const rows=engine.getRows(puzzle,game);const columns=engine.getColumns(puzzle,game);const checked=engine.feedbackCurrent(puzzle,game);
  const correct=checked?columns.map((word,index)=>word===puzzle.columns[index].answer):null;
  $('column-clues').innerHTML=puzzle.columns.map((column,index)=>`<button type="button" class="column-clue${correct?.[index]?' correct':''}${followedColumn===index?' following':''}" data-follow-column="${index}" aria-pressed="${followedColumn===index}" aria-label="Follow column ${String.fromCharCode(65+index)}: ${esc(column.clue)}${correct?.[index]?', matched on last check':''}"><span>${String.fromCharCode(65+index)} <i aria-hidden="true">↓</i>${correct?.[index]?' ✓':''}</span><p>${esc(column.clue)}</p></button>`).join('');
  $('puzzle').innerHTML=rows.map((row,index)=>`<div class="letter-strip"><button class="rotate-button" data-rotate="${index}" data-direction="-1" aria-label="Rotate row ${index+1} left" ${active?'':'disabled'}>←</button><div class="strip-letters" role="group" aria-label="Row ${index+1}: ${[...row].join(' ')}">${[...row].map((letter,column)=>`<span class="strip-letter${correct?.[column]?' correct':''}${followedColumn===column?' following':''}">${letter}</span>`).join('')}</div><button class="rotate-button" data-rotate="${index}" data-direction="1" aria-label="Rotate row ${index+1} right" ${active?'':'disabled'}>→</button></div>`).join('');
  $('column-status').innerHTML=columns.map((word,index)=>`<div class="column-word${correct?.[index]?' correct':''}"><span>${String.fromCharCode(65+index)}${correct?.[index]?' ✓':''}</span><strong>${word}</strong></div>`).join('');
  $('column-reader').textContent=followedColumn===null?'Tap a clue to follow its column through the strips.':`Following ${String.fromCharCode(65+followedColumn)} ↓ ${puzzle.columns[followedColumn].clue} · ${[...columns[followedColumn]].join(' ')}`;
  $('shift-moves').textContent=game.moves;$('shift-checks').textContent=game.checks;
  $('shift-check').disabled=!active||checked;
  $('shift-check').textContent=checked&&active?'Board checked':'Check board';
  $('shift-undo').disabled=!active||!game.history.length;
  $('shift-hint').disabled=!active||!engine.findHint(puzzle,game);
  $('shift-hint-note').textContent=hintMessage;$('shift-hint-note').hidden=!hintMessage;
  $('shift-hints').textContent=game.hints;
  $('perfect-note').textContent=game.status==='revealed'?'· shown, not solved':game.status==='won'&&game.checks===1&&game.hints===0?'· perfect':game.status==='won'?(game.hints?'· solved with nudges':'· solved'):game.hints?'· assisted':game.checks?'· first check used':'· goal: 1 check, 0 nudges';
  $('check-status').textContent=game.status==='revealed'?'Answers shown. This round was revealed.':game.status==='won'?'All four columns matched on your final check.':checked?`Checked here: ${correct.filter(Boolean).length} of 4 columns match. Rows stay movable.`:game.lastCheck?'Changed since your last check. Green feedback returns only for that checked arrangement.':'Not checked yet. Teal follows your chosen column; green appears only after a check.';
  $('column-status').setAttribute('aria-label',checked?'Vertical words for this checked arrangement':'Current vertical words, not checked');
  document.querySelector('.shift-actions').hidden=!active;
  if(opts.row!==undefined)focusRow(opts.row,opts.direction);
}
function focusRow(row,direction=1){const button=$('puzzle').querySelector(`[data-rotate="${row}"][data-direction="${direction}"]`);button?.focus({preventScroll:true});button?.scrollIntoView({block:'nearest',behavior:'auto'});}
function rotate(row,direction){
  const next=engine.rotateRow(app.puzzle,app.game,row,direction);if(next===app.game)return;
  const reading=followedColumn===null?'Read the columns again.':`Column ${String.fromCharCode(65+followedColumn)} now reads ${[...engine.getColumns(app.puzzle,next)[followedColumn]].join(' ')}.`;
  hintMessage='';app.commit(next,{message:`Row ${row+1} shifted ${direction===1?'right':'left'}. ${reading}`,tone:'select',opts:{row,direction}});
  if(app.game!==next&&app.game.status==='playing')focusRow(row,direction);
}
function check(){
  const result=engine.checkBoard(app.puzzle,app.game);if(!result.changed){app.notice('Shift a row before checking this arrangement again.');return;}
  const count=result.correct.filter(Boolean).length;
  const won=result.state.status==='won';
  app.commit(result.state,{message:won?'Four answers. Everything is in line.':`${count} of 4 columns match. Keep working with the clues.`,tone:won?'win':'miss'});
  if(app.game.status==='playing')focusRow(0);
}
function applyHint(){
  const result=engine.useHint(app.puzzle,app.game);if(!result.hint)return;
  hintMessage=result.hint.message;
  app.commit(result.state,{message:hintMessage,tone:'fit',opts:{row:result.hint.row,direction:1}});
  if(app.game!==result.state&&app.game.status==='playing')focusRow(0);
}
function hint(){
 if(!engine.findHint(app.puzzle,app.game))return;
 app.openDialog(`<p class="dialog-kicker">A SCORED NUDGE</p><h2 class="dialog-title" id="dialog-title">Put one row in place?</h2><p class="confirm-copy">This records <strong>1 nudge and 1 move</strong>, making this an assisted round. Undo will not refund either. One row goes to its answer position and stays movable. No check is spent; you still press Check board to finish.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-sideways-nudge>Use this nudge</button></div>`);
}
$('dialog-content').addEventListener('click',event=>{const button=event.target.closest('[data-sideways-nudge]');if(!button||button.disabled)return;button.disabled=true;const before=app.game,id=app.puzzle.id,mode=app.mode,date=app.daily.dateKey;app.closeDialog();requestAnimationFrame(()=>{if(app.game===before&&app.puzzle.id===id&&app.mode===mode&&(mode!=='daily'||app.daily.dateKey===date))applyHint();});});
$('column-clues').addEventListener('click',event=>{const choice=event.target.closest('[data-follow-column]');if(!choice)return;const column=Number(choice.dataset.followColumn);if(column>=0&&column<4){followedColumn=followedColumn===column?null:column;app.render();$('column-clues').querySelector(`[data-follow-column="${column}"]`)?.focus({preventScroll:true});app.announce($('column-reader').textContent);}});
$('puzzle').addEventListener('click',event=>{const button=event.target.closest('[data-rotate]');if(button)rotate(Number(button.dataset.rotate),Number(button.dataset.direction));});
$('puzzle').addEventListener('keydown',event=>{
  const button=event.target.closest('[data-rotate]');
  if(!button||event.ctrlKey||event.metaKey||event.altKey||app.game.status!=='playing')return;
  const row=Number(button.dataset.rotate),direction=Number(button.dataset.direction);
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();rotate(row,event.key==='ArrowLeft'?-1:1);}
  else if(event.key==='ArrowUp'||event.key==='ArrowDown'){
    event.preventDefault();const next=Math.max(0,Math.min(4,row+(event.key==='ArrowUp'?-1:1)));
    focusRow(next,direction);
  }
});
$('shift-check').addEventListener('click',check);
$('shift-hint').addEventListener('click',hint);
$('shift-undo').addEventListener('click',()=>{const next=engine.undoMove(app.puzzle,app.game);if(next!==app.game){hintMessage='';app.commit(next,{message:'Last shift undone. Your move and hint counts are not reduced.'});if(app.game.status==='playing')focusRow(0);}});
$('feedback').textContent='Read down. Move across. Make all four words fit at once.';
$('board-note').textContent='One correct arrangement. No timer. One check without nudges is perfect.';
app.start();
