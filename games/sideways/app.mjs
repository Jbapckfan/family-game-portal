import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';

const $=id=>document.getElementById(id);
let hintMessage='';
const app=createShell({
  slug:'sideways',name:'Sideways',puzzles:PUZZLES,engine,
  sibling:{slug:'second-sense',name:'Second Sense',url:'https://alford-daily.jbapckfan.chatgpt.site/games/second-sense/'},
  reset(){hintMessage='';},
  record:game=>({status:game.status,checks:game.checks,moves:game.moves,hints:game.hints}),
  help:`<p class="dialog-kicker">MOVE ACROSS. READ DOWN.</p><h2 class="dialog-title" id="dialog-title">Think sideways.</h2><p class="dialog-body">Five horizontal strips hold the letters of four vertical answers. Rotate a strip left or right; its edge letter wraps around.</p><div class="help-example">A B C D <span class="arrow">→</span> D A B C<br><small>One shift to the right. No letters added or removed.</small></div><ol class="help-list"><li>Read the four clues above the grid. Each answer has five letters and reads <strong>top to bottom.</strong></li><li>Use the arrows to rotate any row. Every move changes all four columns.</li><li>When the words line up, check the board. A check tells you which columns match. After a move, that feedback expires.</li></ol><p class="dialog-body">There is one arrangement that matches all four clues. Shift and undo freely; every shift stays in your move count. <strong>One check without nudges is perfect.</strong> A nudge turns one row into its correct position, but you still need to check the board.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Get things in line →</button></div>`,
  about:'Sideways is a spatial word puzzle. Rotate five four-letter strips until four clued words read down the columns. Every published board is exhaustively checked across all 1,024 row orientations and has exactly one arrangement matching all four answers. Repeated letters make the clues depend on each other, so one answer alone does not settle the whole board.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect first checks</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won?stats.averageChecks.toFixed(1):'—'}</strong></div>`,
  result(api){const {game,mode,daily}=api;const won=game.status==='won';const perfect=won&&game.checks===1&&game.hints===0;return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A CHANGE OF PERSPECTIVE'}</p><div class="result-symbol" aria-hidden="true">↔</div><h2 class="dialog-title" id="dialog-title">${perfect?'Perfectly in line.':won?'Everything lines up.':'A new perspective.'}</h2><p class="result-copy">${won?'Four words. One shared arrangement. You found the right angle.':'The four answers now read down. This board is recorded as revealed.'}</p><div class="result-metrics"><div><strong>${game.checks}</strong><span>checks</span></div><div><strong>${game.moves}</strong><span>shifts</span></div><div><strong>${game.hints}</strong><span>nudges</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your result ↗</button><button class="secondary-button" data-action="random">Another puzzle →</button></div><p class="fineprint">The shared score never reveals the words.<br>${mode==='daily'?'A new daily at midnight Central.':'Practice stays separate from your daily score.'}</p>`;},
  render:renderGame,
});
function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';const rows=engine.getRows(puzzle,game);const columns=engine.getColumns(puzzle,game);const checked=engine.feedbackCurrent(puzzle,game);
  const correct=checked?columns.map((word,index)=>word===puzzle.columns[index].answer):null;
  $('column-clues').innerHTML=puzzle.columns.map((column,index)=>`<div class="column-clue${correct?.[index]?' correct':''}"><span>${String.fromCharCode(65+index)} <i aria-hidden="true">↓</i></span><p>${esc(column.clue)}</p></div>`).join('');
  $('puzzle').innerHTML=rows.map((row,index)=>`<div class="letter-strip"><button class="rotate-button" data-rotate="${index}" data-direction="-1" aria-label="Rotate row ${index+1} left" ${active?'':'disabled'}>←</button><div class="strip-letters" aria-label="Row ${index+1}: ${[...row].join(' ')}">${[...row].map((letter,column)=>`<span class="strip-letter${correct?.[column]?' correct':''}">${letter}</span>`).join('')}</div><button class="rotate-button" data-rotate="${index}" data-direction="1" aria-label="Rotate row ${index+1} right" ${active?'':'disabled'}>→</button></div>`).join('');
  $('column-status').innerHTML=columns.map((word,index)=>`<div class="column-word${correct?.[index]?' correct':''}"><span>${String.fromCharCode(65+index)}${correct?.[index]?' ✓':''}</span><strong>${word}</strong></div>`).join('');
  $('shift-moves').textContent=game.moves;$('shift-checks').textContent=game.checks;
  $('shift-check').disabled=!active||checked;
  $('shift-check').textContent=checked&&active?'Board checked':'Check board ↵';
  $('shift-undo').disabled=!active||!game.history.length;
  $('shift-hint').disabled=!active||!engine.findHint(puzzle,game);
  $('shift-hint-note').textContent=hintMessage;$('shift-hint-note').hidden=!hintMessage;
  document.querySelector('.shift-actions').hidden=!active;
  if(opts.row!==undefined)$('puzzle').querySelector(`[data-rotate="${opts.row}"][data-direction="${opts.direction}"]`)?.focus({preventScroll:true});
}
function rotate(row,direction){
  const next=engine.rotateRow(app.puzzle,app.game,row,direction);if(next===app.game)return;
  hintMessage='';app.commit(next,{message:`Row ${row+1} shifted ${direction===1?'right':'left'}. Read the columns again.`,tone:'select',opts:{row,direction}});
}
function check(){
  const result=engine.checkBoard(app.puzzle,app.game);if(!result.changed){app.notice('Shift a row before checking this arrangement again.');return;}
  const count=result.correct.filter(Boolean).length;
  const won=result.state.status==='won';
  app.commit(result.state,{message:won?'Four answers. Everything is in line.':`${count} of 4 columns match. Keep working with the clues.`,tone:won?'win':'miss'});
}
function hint(){
  const result=engine.useHint(app.puzzle,app.game);if(!result.hint)return;
  hintMessage=result.hint.message;
  app.commit(result.state,{message:hintMessage,tone:'fit'});
}
$('puzzle').addEventListener('click',event=>{const button=event.target.closest('[data-rotate]');if(button)rotate(Number(button.dataset.rotate),Number(button.dataset.direction));});
$('shift-check').addEventListener('click',check);
$('shift-hint').addEventListener('click',hint);
$('shift-undo').addEventListener('click',()=>{const next=engine.undoMove(app.puzzle,app.game);if(next!==app.game){hintMessage='';app.commit(next,{message:'Last shift undone. Your move and hint counts are not reduced.'});}});
$('feedback').textContent='Read down. Move across. Make all four words fit at once.';
$('board-note').textContent='One correct arrangement. No timer. One check without nudges is perfect.';
app.start();
