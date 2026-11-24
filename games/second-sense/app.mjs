import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';

const $=id=>document.getElementById(id);
let nounId=null,verbId=null,draft='',error='';
const app=createShell({
  slug:'second-sense',name:'Second Sense',puzzles:PUZZLES,engine,
  sibling:{slug:'sideways',name:'Sideways',url:'https://alford-daily.jbapckfan.chatgpt.site/games/sideways/'},
  reset(){nounId=null;verbId=null;draft='';error='';},
  record:game=>({status:game.status,attempts:game.attempts,hints:game.hintedNouns.length}),
  help:`<p class="dialog-kicker">ONE WORD. TWO WAYS TO READ IT.</p><h2 class="dialog-title" id="dialog-title">Find its second sense.</h2><p class="dialog-body">Five common words are hiding behind ten meanings. Each word has <strong>one noun sense and one verb sense</strong> on the board.</p><div class="help-example">A kitchen vessel<br><strong>POT</strong><br>Put a plant in a container</div><ol class="help-list"><li>Pick a noun clue from the left and a verb clue from the right.</li><li>Type the single word that fits both. The spelling must be the same; the pronunciation may change.</li><li>Check your word. A correct answer locks both meanings and explains the connection.</li></ol><p class="dialog-body">Wrong checks leave every clue available. Change your selections freely. A first-letter hint also shows the word length and is noted in your result. <strong>Five checks without hints is perfect.</strong></p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Look twice →</button></div>`,
  about:'Second Sense pairs two different meanings of the same spelling. Match a noun definition with a verb definition, then retrieve the shared word yourself. Some words, such as WIND, change pronunciation between senses. This edition combines 75 curated noun/verb pairs into 180 different boards. Familiar meanings recur beside different clues; matching spelling is what matters.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect discoveries</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won?stats.averageAttempts.toFixed(1):'—'}</strong></div>`,
  result(api){
    const {game,mode,daily}=api;const won=game.status==='won';const perfect=engine.isPerfect(game);
    return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A SECOND LOOK'}</p><div class="result-symbol" aria-hidden="true">&amp;</div><h2 class="dialog-title" id="dialog-title">${perfect?'A perfect second sense.':won?'You saw both sides.':'Another meaning found.'}</h2><p class="result-copy">${won?'Five familiar words. Ten ways to see them.':'The words and their two meanings are now explained below. This board is recorded as revealed.'}</p><div class="result-metrics"><div><strong>${game.attempts}</strong><span>checks</span></div><div><strong>${game.hintedNouns.length}</strong><span>hints</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your result ↗</button><button class="secondary-button" data-action="random">Another puzzle →</button></div><p class="fineprint">Your shared result keeps all five words a secret.<br>${mode==='daily'?'A fresh daily at midnight Central.':'Practice has its own score.'}</p>`;
  },
  render:renderGame,
});
function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';
  const usedNouns=new Set(game.placements.map(item=>item.nounId));const usedVerbs=new Set(game.placements.map(item=>item.verbId));
  const card=(item,type)=>{
    const used=(type==='noun'?usedNouns:usedVerbs).has(item.id);const chosen=(type==='noun'?nounId:verbId)===item.id;
    const pair=type==='noun'&&game.hintedNouns.includes(item.id)?puzzle.pairs.find(row=>row.nounId===item.id):null;
    return `<button class="sense-card${chosen?' selected':''}${used?' used':''}" data-${type}="${esc(item.id)}" aria-pressed="${chosen}" aria-label="${type}: ${esc(item.clue)}${used?', found':''}" ${used||!active?'disabled':''}><span>${esc(item.clue)}</span>${pair?`<small>✦ ${pair.word[0]} · ${pair.word.length} letters</small>`:''}${used?'<i aria-hidden="true">✓</i>':''}</button>`;
  };
  $('noun-clues').innerHTML=puzzle.nouns.map(item=>card(item,'noun')).join('');
  $('verb-clues').innerHTML=puzzle.verbs.map(item=>card(item,'verb')).join('');
  $('chosen-noun').textContent=puzzle.nouns.find(item=>item.id===nounId)?.clue||'Pick a noun clue above.';
  $('chosen-verb').textContent=puzzle.verbs.find(item=>item.id===verbId)?.clue||'Pick a verb clue above.';
  $('answer-input').value=draft;
  $('answer-input').disabled=!active;
  $('sense-check').disabled=!active||!nounId||!verbId||!draft.trim();
  $('sense-hint').disabled=!active||!nounId||game.hintedNouns.includes(nounId);
  $('sense-hint').textContent=nounId&&game.hintedNouns.includes(nounId)?'✦ Hint shown':'✦ First-letter hint';
  $('sense-progress').textContent=game.status==='revealed'?'All meanings revealed':`${game.placements.length} of 5 found`;
  $('attempt-count').textContent=game.attempts;
  $('sense-hints').textContent=game.hintedNouns.length?`${game.hintedNouns.length} ${game.hintedNouns.length===1?'hint':'hints'} used`:'No hints used';
  $('sense-error').hidden=!error;$('sense-error').textContent=error;
  document.querySelector('.answer-panel').hidden=!active;
  $('solved-senses').innerHTML=game.placements.map(placement=>{
    const pair=puzzle.pairs.find(item=>item.nounId===placement.nounId&&item.verbId===placement.verbId);
    const noun=puzzle.nouns.find(item=>item.id===placement.nounId);const verb=puzzle.verbs.find(item=>item.id===placement.verbId);
    return `<article class="discovered-word"><header><strong>${esc(placement.word)}</strong><span>${game.status==='revealed'?'revealed':'two senses found ✓'}</span></header><div><p><b>n.</b> ${esc(noun.clue)}</p><p><b>v.</b> ${esc(verb.clue)}</p></div><p class="sense-explanation">${esc(pair.explanation)}</p></article>`;
  }).join('');
  if(opts.type)$('answer-input').focus({preventScroll:true});
  if(opts.clue)document.querySelector(`[data-${opts.clue.type}="${CSS.escape(opts.clue.id)}"]`)?.focus({preventScroll:true});
}
function select(type,id){
  if(app.game.status!=='playing')return;
  if(type==='noun')nounId=nounId===id?null:id;else verbId=verbId===id?null:id;
  error='';app.sound('select');app.render({clue:{type,id}});
  if(nounId&&verbId)app.notice('Two meanings selected. What single word fits both?');
  else app.notice(`Choose ${nounId?'a verb':verbId?'a noun':'one noun and one verb'} clue to make your pair.`);
}
function check(event){
  event.preventDefault();
  if(error)return;
  const result=engine.submitPair(app.puzzle,app.game,{nounId,verbId,word:draft});
  if(!result.changed){app.notice('Select a noun clue and a verb clue, then enter one word using letters only.');return;}
  let message;
  if(result.accepted){message=`${result.word}. Two senses, one word.`;nounId=null;verbId=null;draft='';error='';}
  else{error='That word doesn’t fit both selected meanings. Try another word or clue pairing.';message=error;}
  app.commit(result.state,{message,tone:result.accepted?(result.state.status==='won'?'win':'fit'):'miss',opts:result.accepted?{}:{type:true}});
  if(result.accepted&&app.game.status==='playing')$('noun-clues').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
function hint(){
  const result=engine.useHint(app.puzzle,app.game,nounId);if(!result.hint)return;
  app.commit(result.state,{message:`This noun’s word starts with ${result.hint.firstLetter} and has ${result.hint.length} letters. Find its verb meaning.`,opts:{clue:{type:'noun',id:nounId}}});
}
$('noun-clues').addEventListener('click',event=>{const clue=event.target.closest('[data-noun]');if(clue)select('noun',clue.dataset.noun);});
$('verb-clues').addEventListener('click',event=>{const clue=event.target.closest('[data-verb]');if(clue)select('verb',clue.dataset.verb);});
$('answer-input').addEventListener('input',event=>{draft=event.target.value;error='';$('sense-error').hidden=true;$('sense-check').disabled=!nounId||!verbId||!draft.trim();});
$('answer-form').addEventListener('submit',check);
$('sense-hint').addEventListener('click',hint);
$('feedback').textContent='Read the clues twice. A familiar word is living two lives.';
$('board-note').textContent='Same spelling. Different senses. Five checks without hints is perfect.';
app.start();
