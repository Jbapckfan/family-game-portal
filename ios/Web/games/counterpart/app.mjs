import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';

const $ = id => document.getElementById(id);
let rowIndex = 0;
let draft = [null, null];
let slotIndex = 0;
let rejected = false;

const help = `<p class="dialog-kicker">A DAILY GAME OF RELATIONSHIPS</p><h2 class="dialog-title" id="dialog-title">Find the counterpart.</h2><p class="dialog-body">Each row gives you two words with a relationship. Use two words from the shared bank to make <strong>the same relationship, in the same direction.</strong></p><div class="help-example">PEN <span class="arrow">→</span> WRITER<br>BRUSH <span class="arrow">→</span> PAINTER<br><small>A tool → the person who uses it</small></div><ol class="help-list"><li>Choose a row, then fill its two spaces from the bank.</li><li>Think about <strong>how the words relate</strong>: a cause and effect, a container and contents, a part and whole, or something subtler.</li><li>Check the pair. Correct pairs lock and explain the connection. Wrong checks leave every word available.</li></ol><p class="dialog-body"><strong>Five checks with no hints is perfect.</strong> There is no limit on checks. A hint names one row’s relationship and is noted in your score. You can change drafts freely.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Find the connections →</button></div>`;

const app = createShell({
  slug:'counterpart', name:'Counterpart', puzzles:PUZZLES, engine,
  sibling:{slug:'shortlist', name:'Shortlist', url:'https://shortlist-daily.jbapckfan.chatgpt.site'},
  reset(){rowIndex=0;draft=[null,null];slotIndex=0;rejected=false;},
  record:game=>({status:game.status,attempts:game.attempts,hints:game.hintedRows.length}),
  help,
  about:'Counterpart is a game of analogies: different words, the same relationship. Each board uses ten words once across five directed pairs. The challenge is to recognize a relationship and carry it into a new context. All explanations were written for this collection.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect counterparts</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won ? stats.averageAttempts.toFixed(1) : '—'}</strong></div>`,
  result(api){
    const {game,mode,daily}=api;
    const won=game.status==='won'; const perfect=engine.isPerfect(game);
    return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A LITTLE PRACTICE'}</p><div class="result-symbol" aria-hidden="true">${perfect?'✳':won?'⇄':'∴'}</div><h2 class="dialog-title" id="dialog-title">${perfect?'Perfect counterparts.':won?'You made the connection.':'Another way to see it.'}</h2><p class="result-copy">${perfect?'Five relationships. Five checks. A beautifully clear connection.':won?'Different words, all thinking alike. Take a moment to read the relationships.':'The relationships are explained on the board. This result is recorded as revealed, not solved.'}</p><div class="result-strip" aria-hidden="true">${'<span></span>'.repeat(5)}</div><div class="result-metrics"><div><strong>${game.attempts}</strong><span>checks</span></div><div><strong>${game.hintedRows.length}</strong><span>hints</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your result ↗</button><button class="secondary-button" data-action="random">Another puzzle →</button></div><p class="fineprint">${mode==='daily'?'A fresh puzzle at midnight Central.':'Practice stays separate from your daily record.'}<br>No answers in your shared result.</p>`;
  },
  render:renderGame,
});

function tile(id){return app.puzzle.tiles.find(item=>item.id===id);}
function focus(selector){requestAnimationFrame(()=>$('puzzle').querySelector(selector)?.focus({preventScroll:true}));}
function renderGame(api,opts={}){
  const {game,puzzle}=api; const active=game.status==='playing';
  if(active&&game.placements[rowIndex])rowIndex=game.placements.findIndex(value=>!value);
  const used=new Set(game.placements.filter(Boolean).flat());
  const solved=game.placements.filter(Boolean).length;
  $('bank').innerHTML=puzzle.tiles.map(item=>`<button class="word-tile${draft.includes(item.id)?' selected':''}${used.has(item.id)?' used':''}" data-tile="${esc(item.id)}" aria-pressed="${draft.includes(item.id)}" aria-label="${esc(item.word)}${used.has(item.id)?', already paired':''}" ${!active||used.has(item.id)?'disabled':''}>${esc(item.word)}</button>`).join('');
  $('bank-count').textContent=active?`${10-used.size} words left · each used once`:'Every word has a counterpart';
  $('bank-note').textContent=active?`Working on row ${rowIndex+1}. ${draft.every(Boolean)?'Check your pair, or change either word.':`Choose the ${slotIndex===0?'first':'second'} word in the relationship.`}`:'Read the explanations. The connection is what matters.';
  $('puzzle').innerHTML=puzzle.rows.map((row,index)=>{
    const locked=game.placements[index]; const selected=active&&index===rowIndex;
    const ids=locked|| (selected?draft:[null,null]);
    return `<section class="analogy${selected?' active':''}${locked?' solved':''}${game.status==='revealed'?' revealed':''}" data-analogy="${index}" aria-label="Analogy ${index+1}${locked?', completed':''}"><div class="analogy-head"><span class="row-number" aria-hidden="true">${locked?'✓':String(index+1).padStart(2,'0')}</span><button class="cue-button" data-row="${index}" ${locked?'disabled':''} aria-label="Work on analogy ${index+1}: ${esc(row.cue[0])} is to ${esc(row.cue[1])}"><span>${esc(row.cue[0])}</span><span class="arrow" aria-hidden="true">→</span><span>${esc(row.cue[1])}</span></button><span class="row-state">${locked?game.status==='revealed'?'revealed':'paired':selected?'as…':'tap to work'}</span></div><div class="analogy-answer">${ids.map((id,slot)=>`${slot===1?'<span class="arrow" aria-hidden="true">→</span>':''}${locked?`<span class="locked-word">${esc(tile(id).word)}</span>`:`<button class="answer-slot${id?' filled':''}${selected&&slot===slotIndex?' current':''}" data-slot="${slot}" data-row="${index}" aria-label="Row ${index+1}, ${slot===0?'first':'second'} word${id?`: ${esc(tile(id).word)}`:', empty'}">${id?esc(tile(id).word):slot===0?'First word':'Second word'}</button>`}`).join('')}</div>${locked?`<p class="relation"><strong>${esc(row.relationship)}.</strong> ${esc(row.explanation)}</p>`:game.hintedRows.includes(index)?`<p class="hint-line">✦ Relationship: <strong>${esc(row.relationship)}</strong></p>`:''}${selected?`<div class="analogy-actions"><button class="mini-button" data-swap aria-label="Reverse your draft pair" ${draft.some(Boolean)?'':'disabled'}>⇄ Reverse</button><button class="mini-button" data-hint="${index}" ${game.hintedRows.includes(index)?'disabled':''}>${game.hintedRows.includes(index)?'Hint shown':'✦ Hint'}</button><button class="mini-button check-button" data-check ${draft.every(Boolean)?'':'disabled'}>Check pair ↵</button></div>${rejected?'<p class="row-error">That pair doesn’t carry the same relationship in that order. Your words are still available.</p>':''}`:''}</section>`;
  }).join('');
  $('progress-dots').innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<solved?'filled':''}"></i>`).join('');
  $('progress-label').textContent=game.status==='revealed'?'Relationships revealed':`${solved} of 5 paired`;
  $('attempt-count').textContent=game.attempts;
  if(opts.tile)$('bank').querySelector(`[data-tile="${CSS.escape(opts.tile)}"]:not(:disabled)`)?.focus({preventScroll:true});
  if(opts.slot!==undefined)focus(`[data-slot="${opts.slot}"][data-row="${rowIndex}"]`);
  if(opts.check)focus('[data-check]');
}

function chooseRow(index,slot=0){
  if(app.game.status!=='playing'||app.game.placements[index])return;
  rowIndex=index;slotIndex=slot;rejected=false;
  app.render({slot});app.notice(`Row ${index+1}. ${app.puzzle.rows[index].cue.join(' is to ')}. Choose its counterpart.`);
}
function chooseTile(id){
  if(app.game.status!=='playing'||app.game.placements.some(pair=>pair?.includes(id)))return;
  const old=draft.indexOf(id);
  if(old>=0){draft[old]=null;slotIndex=old;}else{draft[slotIndex]=id;slotIndex=draft[0]===null?0:draft[1]===null?1:0;}
  rejected=false;app.sound('select');app.render({tile:id});
  app.notice(draft.every(Boolean)?`${tile(draft[0]).word} is to ${tile(draft[1]).word}. Check the pair for row ${rowIndex+1}.`:`${tile(id).word} ${old>=0?'removed':'selected'}. Choose ${slotIndex===0?'the first':'the second'} word.`);
}
function checkPair(){
  const result=engine.submitPair(app.puzzle,app.game,{row:rowIndex,tileIds:draft});
  if(!result.changed)return;
  const row=app.puzzle.rows[rowIndex];
  if(result.accepted){draft=[null,null];slotIndex=0;rejected=false;}else rejected=true;
  app.commit(result.state,{message:result.accepted?`${row.relationship}. ${row.explanation}`:'Not quite. Try a different relationship or reverse your pair.',tone:result.accepted?(result.state.status==='won'?'win':'fit'):'miss',opts:result.accepted?{}:{check:true}});
  if(result.accepted&&app.game.status==='playing')$('bank').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
function hint(index){
  const result=engine.useHint(app.puzzle,app.game,index);
  if(!result.hint)return;
  app.commit(result.state,{message:`Row ${index+1} hint: ${result.hint.relationship}.`,opts:{slot:slotIndex}});
}
$('bank').addEventListener('click',event=>{const button=event.target.closest('[data-tile]');if(button)chooseTile(button.dataset.tile);});
$('puzzle').addEventListener('click',event=>{
  const slot=event.target.closest('[data-slot]');if(slot){chooseRow(Number(slot.dataset.row),Number(slot.dataset.slot));return;}
  const row=event.target.closest('[data-row]');if(row){chooseRow(Number(row.dataset.row));return;}
  if(event.target.closest('[data-check]')){checkPair();return;}
  const hintButton=event.target.closest('[data-hint]');if(hintButton){hint(Number(hintButton.dataset.hint));return;}
  if(event.target.closest('[data-swap]')){draft.reverse();slotIndex=draft[0]===null?0:draft[1]===null?1:0;rejected=false;app.render({check:true});app.notice('Draft reversed. The direction should match the first pair.');}
});
document.addEventListener('keydown',event=>{
  if($('game-dialog').open)return;
  if(event.key==='Escape'){draft=[null,null];slotIndex=0;rejected=false;app.render();app.notice('Draft cleared. Every unused word is available.');}
});
$('feedback').textContent='Look for the relationship. Carry it into a new pair.';
$('board-note').textContent='Five checks without hints is perfect. Take as many checks as you need.';
app.start();
