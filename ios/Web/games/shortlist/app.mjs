import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';
import { openResultShare } from './share-card.mjs';

const $ = id => document.getElementById(id);
let selected=[];
let restoredHintKey=null;
let pendingPick=null;
let markMode=false;
const help=`<p class="dialog-kicker">A LITTLE INFORMATION GOES A LONG WAY</p><h2 class="dialog-title" id="dialog-title">Make the shortlist.</h2><p class="dialog-body">One of the twelve visible words is the secret. You have <strong>three scans and one final pick.</strong></p><div class="help-example">A + E <span class="arrow">→</span> 1<br><small>Exactly one of these letters appears in the secret.</small></div><ol class="help-list"><li><strong>Pick two different letters.</strong> A scan returns 0, 1 or 2 letters present. It never tells you which letter or where. Repeated letters in a word still count once.</li><li><strong>Narrow the field.</strong> Compare every candidate with all your scan results. Turn Pencil mode on to cross words off; tap a marked word to restore it. Turn Pencil mode off before making a final pick.</li><li><strong>Make your final pick.</strong> Tap a word and confirm. You can do this early, but you get only one pick.</li></ol><p class="dialog-body">Every starting board has a strategy that identifies any secret in at most three scans. Your questions matter: uninformative scans can leave more than one possibility. One optional hint suggests a useful scan and marks the result as assisted.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Start narrowing it down →</button></div>`;
const app=createShell({
  lesson:{question:'A + E gives 1. Which word fits that result?',choices:[{label:'MATCH',correct:true,why:'MATCH has A but no E: exactly one of the two letters.'},{label:'TABLE',correct:false,why:'TABLE contains both A and E, so its count would be 2.'},{label:'STORY',correct:false,why:'STORY contains neither A nor E, so its count would be 0.'}]},
  slug:'shortlist',name:'Shortlist',puzzles:PUZZLES,engine,
  sibling:{slug:'counterpart',name:'Counterpart',url:'https://counterpart-daily.jbapckfan.chatgpt.site'},
  reset(){selected=[];restoredHintKey=null;pendingPick=null;markMode=false;},
  record:game=>({status:game.status,scans:game.scans.length,hints:game.hints}),
  help,
  share:openResultShare,
  about:'Shortlist is a quick deduction game about asking useful questions. Twelve words, three scans of two letters, and one final pick. Every prepared starting board is checked by an exact decision-tree solver: there is a strategy to distinguish every candidate within three scans. Different choices can use up information, so a win is earned, not automatic.',
  statsExtra:stats=>`<div class="stats-detail"><span>Unassisted wins</span><strong>${stats.unassisted}</strong></div><div class="stats-detail"><span>Average scans when solved</span><strong>${stats.won?stats.averageScans.toFixed(1):'—'}</strong></div>`,
  result(api){
    const {game,puzzle,mode,daily}=api;const won=game.status==='won';
    return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A QUICK PRACTICE'}</p><div class="result-symbol" aria-hidden="true">${won?'⌕':'∴'}</div><h2 class="dialog-title" id="dialog-title">${won?'Secret found.':game.status==='lost'?'Not this time.':'A little clarity.'}</h2><p class="result-copy">${won?'You chose the secret word.':game.status==='lost'?`${esc(game.pick)} was your pick. The secret was:`:'The secret word was:'}</p><div class="answer-reveal">${esc(puzzle.answer)}</div><div class="result-metrics"><div><strong>${game.scans.length}<small>/3</small></strong><span>scans used</span></div><div><strong>${game.hints}</strong><span>hint used</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="random" autofocus>One more puzzle →</button><button class="secondary-button" data-action="share">Share result ↗</button></div><p class="fineprint">${won?game.hints?'Solved with a hint.':'Solved without a hint.':game.status==='lost'?'This round is recorded as a loss.':'Revealed rounds do not count as wins.'}<br>${mode==='daily'?'A fresh daily at midnight Central.':'Practice stays separate from your daily record.'}</p>`;
  },
  render:renderGame,
});

function scanDescription(scan){
  return scan.count===0?`Neither ${scan.letters[0]} nor ${scan.letters[1]} appears.`:scan.count===2?`Both ${scan.letters[0]} and ${scan.letters[1]} appear.`:`Exactly one of ${scan.letters[0]} or ${scan.letters[1]} appears.`;
}
function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';const canScan=active&&game.scans.length<3;
  const scanPanel=document.querySelector('.scan-panel');
  const pencilNote=document.querySelector('.pencil-note');
  if(scanPanel)scanPanel.hidden=!active;
  if(pencilNote){pencilNote.hidden=!active;pencilNote.textContent=markMode?'Pencil mode: tap a word to cross it off or restore it. These are your notes, not automatic deductions.':'Pick mode: tapping a word opens a final-pick confirmation. Turn Pencil mode on to make notes.';}
  const savedHint=game.hint;
  const hintKey=savedHint?`${puzzle.id}:${savedHint.scanCount}:${savedHint.letters}`:null;
  if(hintKey&&hintKey!==restoredHintKey){
    restoredHintKey=hintKey;
    if(canScan&&savedHint.scanCount===game.scans.length&&savedHint.letters&&!game.scans.some(scan=>scan.letters===savedHint.letters))selected=[...savedHint.letters];
  }
  $('letters-button').hidden=!canScan;
  $('clear-letters').disabled=!canScan||selected.length===0;
  $('scan-history').hidden=game.scans.length===0;
  $('scan-budget').textContent=active?`${3-game.scans.length} ${game.scans.length===2?'scan':'scans'} left`:'Round complete';
  $('scan-preview').innerHTML=`<span class="${selected[0]?'chosen':''}">${selected[0]||'?'}</span><b>+</b><span class="${selected[1]?'chosen':''}">${selected[1]||'?'}</span>`;
  $('scan-preview').setAttribute('aria-label',selected.length?`Selected letters: ${selected.join(' and ')}`:'Choose two letters');
  $('letter-bank').innerHTML=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter=>`<button class="letter-key${selected.includes(letter)?' selected':''}" data-letter="${letter}" aria-label="Letter ${letter}" aria-pressed="${selected.includes(letter)}" ${canScan?'':'disabled'}>${letter}</button>`).join('');
  $('letter-bank').hidden=!canScan;
  $('scan-preview').hidden=!canScan;
  $('scan-button').disabled=!active||(canScan&&selected.length!==2);
  $('scan-button').innerHTML=!active?'Round complete':!canScan?'Back to the words ↑':selected.length===2?`Scan ${selected.join(' + ')} <span aria-hidden="true">↗</span>`:'Scan letters ↗';
  $('scan-history').innerHTML=Array.from({length:game.scans.length},(_,index)=>{
    const scan=game.scans[index];
    return scan?`<div class="scan-result" aria-label="Scan ${index+1}: ${scan.letters.split('').join(' and ')}, ${scan.count} present"><span class="scan-index">${index+1}</span><span class="scan-letters">${scan.letters[0]} <b>+</b> ${scan.letters[1]}</span><span class="scan-count count-${scan.count}">${scan.count}</span><span class="scan-explanation">${esc(scanDescription(scan))}</span></div>`:`<div class="scan-result empty" aria-label="Scan ${index+1} not yet used"><span class="scan-index">${index+1}</span><span class="scan-letters">— + —</span><span class="scan-count">?</span><span class="scan-explanation">${index===game.scans.length&&canScan?'Your next question.':'A little more to learn.'}</span></div>`;
  }).join('');
  $('candidate-count').textContent=active?`${12-game.eliminated.length} on your list · 1 secret`:`The secret: ${puzzle.answer}`;
  $('notes-mode').hidden=!active;
  $('notes-mode').setAttribute('aria-pressed',String(markMode));
  $('notes-mode').textContent=markMode?'Pencil mode: ON':'Pencil mode: OFF';
  $('puzzle').innerHTML=puzzle.words.map(word=>{
    const off=game.eliminated.includes(word),answer=!active&&word===puzzle.answer,wrong=game.status==='lost'&&word===game.pick;
    const label=markMode?`${off?'Restore':'Cross off'} ${word}`:`Choose ${word} as your final pick${off?', crossed off':''}${answer?', secret word':''}`;
    return `<div class="candidate${off&&active?' crossed':''}${answer?' answer':''}${wrong?' wrong-pick':''}"><button class="candidate-word" ${markMode?`data-mark="${word}" aria-pressed="${off}"`:`data-pick="${word}"`} aria-label="${label}" ${!active||(!markMode&&off)?'disabled':''}>${word}${answer?'<span class="word-badge" aria-hidden="true">✓</span>':wrong?'<span class="word-badge" aria-hidden="true">×</span>':''}${active&&markMode?`<span class="pencil-symbol" aria-hidden="true">${off?'↶':'×'}</span>`:''}</button></div>`;
  }).join('');
  $('hint-button').disabled=!active||(canScan&&game.hints>0);
  $('hint-button').textContent=!canScan?'Review scan rules · free':game.hints?'✦ Hint used':'✦ Strategy hint';
  $('hint-preview').hidden=(!savedHint&&game.hints===0)||!active;
  $('hint-preview').textContent=savedHint?`Your hint · ${savedHint.scanCount===0?'before your first scan':`after scan ${savedHint.scanCount}`}: ${savedHint.message}`:game.hints?'Your earlier hint is still counted; its original advice was not saved.':'';
  if(opts.letter)$('letter-bank').querySelector(`[data-letter="${opts.letter}"]`)?.focus({preventScroll:true});
  if(opts.candidate)$('puzzle').querySelector(`[data-pick="${opts.candidate}"],[data-mark="${opts.candidate}"]`)?.focus({preventScroll:true});
  if(opts.mark)$('puzzle').querySelector(`[data-mark="${opts.mark}"]`)?.focus({preventScroll:true});
}
function chooseLetter(letter){
  if(app.game.status!=='playing'||app.game.scans.length>=3)return;
  if(selected.includes(letter))selected=selected.filter(item=>item!==letter);
  else if(selected.length<2)selected.push(letter);
  else{selected=[selected[0],letter];}
  app.sound('select');app.render({letter});
  app.notice(selected.length===2?`${selected.join(' + ')} ready. Scan when you’re sure.`:'Choose two different letters to scan.');
}
function showEvidence(){const target=app.game.scans.length?$('scan-history'):$('puzzle');target.scrollIntoView({block:'start',behavior:'auto'});$('puzzle').querySelector('button:not(:disabled)')?.focus({preventScroll:true});}
function showComposer(letter){$('scan-controls').scrollIntoView({block:'start',behavior:'auto'});const target=typeof letter==='string'&&/^[A-Z]$/.test(letter)?$('letter-bank').querySelector(`[data-letter="${letter}"]`):$('letter-bank').querySelector('button:not(:disabled)');target?.focus({preventScroll:true});}
function scan(){
  if(app.game.status==='playing'&&app.game.scans.length===3){
    $('puzzle').scrollIntoView({block:'nearest',behavior:'auto'});
    $('puzzle').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
    app.notice('All three scans are recorded. Compare the words with every result, then confirm your final pick.');
    return;
  }
  const result=engine.submitScan(app.puzzle,app.game,selected.join(''));
  if(!result.changed){if(result.reason==='repeated')app.notice('You already scanned that pair. Pick a different question; no scan was used.');return;}
  selected=[];
  app.commit(result.state,{message:`${scanDescription(result.scan)} ${result.state.scans.length===3?'Use all three results to make your final pick.':'Which words still fit every result?'}`,tone:'fit'});
  if(app.game.status==='playing')showEvidence();
}
function mark(word){
  const next=engine.toggleElimination(app.puzzle,app.game,word);
  if(next===app.game)return;
  app.commit(next,{message:`${word} ${next.eliminated.includes(word)?'crossed off. You can restore it at any time.':'restored to your list.'}`,opts:{mark:word}});
}
function confirmPick(word){
  if(app.game.status!=='playing'||app.game.eliminated.includes(word))return;
  pendingPick=word;
  app.openDialog(`<p class="dialog-kicker">ONE WORD. ONE FINAL PICK.</p><h2 class="dialog-title" id="dialog-title">Is it ${word}?</h2><p class="confirm-copy">${app.game.scans.length<3?`You still have ${3-app.game.scans.length} ${app.game.scans.length===2?'scan':'scans'} available. `:''}Confirming this word ends the round. Does it match every scan?</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-final-pick="${word}">Pick ${word}</button></div>`);
}
function finalPick(word){
  if(word!==pendingPick)return;
  const result=engine.submitPick(app.puzzle,app.game,word);
  if(!result.changed)return;
  pendingPick=null;selected=[];app.closeDialog();
  app.commit(result.state,{message:result.accepted?`${word}. You found the secret.`:`The secret was ${app.puzzle.answer}. Another puzzle is ready when you are.`,tone:result.accepted?'win':'miss'});
}
function applyHint(){
  const result=engine.useHint(app.puzzle,app.game);
  if(!result.hint)return;
  if(result.hint.letters)selected=[...result.hint.letters];
  app.commit(result.state,{message:result.hint.message});
  requestAnimationFrame(()=>{if(result.hint.letters){$('scan-controls').scrollIntoView({block:'start',behavior:'auto'});$('scan-button').focus({preventScroll:true});}else showEvidence();});
}
function hint(){
 if(app.game.status!=='playing')return;
 if(app.game.scans.length>=3){app.openDialog(`<p class="dialog-kicker">YOUR SCAN RULES</p><h2 class="dialog-title" id="dialog-title">Read each count.</h2><p class="dialog-body"><strong>0</strong>: neither letter appears. <strong>1</strong>: exactly one appears. <strong>2</strong>: both appear. A repeated letter in a word counts once. Compare each word with every scan; poor questions can leave more than one candidate.</p><p class="fineprint">This reminder is free and doesn't add a hint.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Back to my evidence</button></div>`);return;}
 if(app.game.hints)return;
 app.openDialog(`<p class="dialog-kicker">ONE OPTIONAL STRATEGY HINT</p><h2 class="dialog-title" id="dialog-title">Use your hint?</h2><p class="confirm-copy">This records <strong>1 hint</strong> and marks the round assisted. It suggests a useful question or explains your evidence. It doesn't spend a scan or make your final pick.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-shortlist-hint>Use my hint</button></div>`);
}
$('letters-button').addEventListener('click',showComposer);
$('evidence-button').addEventListener('click',showEvidence);
$('clear-letters').addEventListener('click',()=>{selected=[];app.render();$('letter-bank').querySelector('button:not(:disabled)')?.focus({preventScroll:true});app.notice('Letters cleared. No scan used.');});
$('notes-mode').addEventListener('click',()=>{if(app.game.status!=='playing')return;markMode=!markMode;app.render();app.notice(markMode?'Pencil marks on. Tap a word to cross it off or restore it; turn pencil marks off to make a final pick.':'Pencil marks off. Tap a word when you are ready for your final pick.');});
$('letter-bank').addEventListener('click' ,event=>{const key=event.target.closest('[data-letter]');if(key)chooseLetter(key.dataset.letter);});
$('scan-button').addEventListener('click',scan);
$('hint-button').addEventListener('click',hint);
$('puzzle').addEventListener('click',event=>{const pencil=event.target.closest('[data-mark]');if(pencil){mark(pencil.dataset.mark);return;}const word=event.target.closest('[data-pick]');if(word)confirmPick(word.dataset.pick);});
$('dialog-content').addEventListener('click',event=>{if(event.target.closest('[data-shortlist-hint]')){app.closeDialog();applyHint();return;}const button=event.target.closest('[data-final-pick]');if(button)finalPick(button.dataset.finalPick);});
document.addEventListener('keydown',event=>{
  if($('game-dialog').open||app.game.status!=='playing'||event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA)$/.test(event.target.tagName))return;
  if(/^[a-z]$/i.test(event.key)){event.preventDefault();if(app.game.scans.length>=3)return;chooseLetter(event.key.toUpperCase());if(!event.target.closest('[data-letter]'))showComposer(event.key.toUpperCase());}
  else if(event.key==='Enter'&&selected.length===2&&(!event.target.closest('button')||event.target.closest('[data-letter]'))){event.preventDefault();scan();}
  else if(event.key==='Backspace'||event.key==='Escape'){event.preventDefault();if(!selected.length)return;const letter=event.target.closest('[data-letter]')?.dataset.letter,candidate=event.target.closest('[data-pick],[data-mark]')?.dataset.pick||event.target.closest('[data-mark]')?.dataset.mark;const removed=selected.at(-1);if(event.key==='Escape')selected=[];else selected.pop();app.render({letter,candidate});if(!document.activeElement||document.activeElement===document.body||document.activeElement.disabled){const fallback=selected.at(-1)||removed||'A';$('letter-bank').querySelector(`[data-letter="${fallback}"]`)?.focus({preventScroll:true});}app.notice('Letter selection updated. No scan used.');}
});
$('feedback').textContent='What two letters would tell you the most?';
$('board-note').textContent='Every starting board has a three-scan solution. Your questions make the difference.';
app.start();
