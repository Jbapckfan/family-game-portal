import {createSession} from './core.mjs';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sendNative(payload){try{if(window.__ALFORD_NATIVE__?.platform!=='ios')return false;const handler=window.webkit?.messageHandlers?.alford;if(!handler?.postMessage)return false;handler.postMessage(payload);return true;}catch{return false;}}


const CATEGORY = {
 'deepseek-twin-hive':'Word gathering','deepseek-spare':'Find the opposites','deepseek-rung':'A word at a time',
 'deepseek-cipher':'Crack the code','deepseek-trail':'One winding word','deepseek-split':'Two words. One bank.',
 'qwen-quadra':'Four of a kind','qwen-logic-lattice':'Count. Mark. Deduce.','qwen-syntax-siege':'Words on the offensive',
 'qwen-memory-maze':'Remember the route','qwen-pattern-prism':'See the rhythm','qwen-territory-tactics':'A small tactical world',
 'claude-dovetail':'Words that fit','claude-splice':'Piece it together','claude-sprout':'Grow a little word',
 'claude-tangle':'Three threads. One string.','claude-keystone':'Find the missing link','claude-tumbler':'Dial in the word'
};

/** UI contract shared by completed concepts. Timed games may supply tick(puzzle,state,deltaMs,mode). */
export function mountDailyGame(config) {
  const doc=document,win=window,host=doc.getElementById('app');
  const creator=config.creator||'DeepSeek';
  const credit=config.credit||`Concept by ${creator} · Built by ChatGPT`;
  const native=win.__ALFORD_NATIVE__?.platform==='ios';
  doc.body.dataset.gameCreator=creator;doc.body.dataset.gameId=config.id;
  doc.documentElement.style.setProperty('--accent',config.accent||'#476b59');
  if(native){doc.body.classList.add('native-app');doc.documentElement.dataset.native='true';}
  let storage;try{storage=win.localStorage;}catch{storage=null;}
  const session=createSession(config,{storage});
  const home=native?'alford://app/':doc.documentElement.dataset.collectionHome||'../daily/';
  const category=CATEGORY[config.id]||'A daily puzzle';
  host.innerHTML=`<div class="game-shell"><header class="game-header"><div class="collection-bar"><a class="collection-back" href="${escapeHTML(home)}"><span aria-hidden="true">←</span> Alford Daily</a><span class="collection-label">A GOOD PUZZLE, EVERY DAY</span></div><div class="title-row"><div class="identity-heading"><span class="game-emblem" aria-hidden="true"><img src="./icon.svg" width="36" height="36" alt=""></span><div><p class="eyebrow">${category}</p><h1>${escapeHTML(config.name)}</h1></div></div><div class="header-tools"><button class="help-button" id="game-stats" aria-label="Your statistics" title="Your statistics"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19v-6h3v6M10 19V5h3v14M15 19V9h3v10"/></svg></button><button class="help-button" id="game-help" aria-label="How to play" title="How to play">?</button></div></div><p class="intro">${escapeHTML(config.intro)}</p><span class="game-credit" data-creator-label>${escapeHTML(credit)}</span><div class="edition"><span id="game-edition"></span><span class="pill" id="game-mode"></span></div></header><nav class="mode-switch" aria-label="Puzzle mode"><button id="daily-mode" class="button">Today</button><button id="practice-mode" class="button">Practice</button></nav><p id="storage-note" class="storage-note" hidden>Storage is unavailable. Progress is kept for this visit but may not survive closing the game.</p><main><div id="puzzle" class="puzzle"></div><p id="game-message" class="status-note" role="status" aria-live="polite"></p><section id="result" class="result" hidden><h2 id="result-heading"></h2><p id="result-summary"></p><p id="result-next"></p></section><div class="support-actions"><button class="button" id="game-hint">${escapeHTML(config.hintLabel||'A little hint')}</button><button class="button subtle" id="game-reveal">Reveal solution</button><button class="button primary" id="game-share" hidden>Share result</button></div><p id="local-stats" class="local-stats"></p></main><footer>New daily puzzle at midnight Central.<br><span id="collection-size"></span> · Progress stays on this device.</footer></div><dialog id="help-dialog" aria-labelledby="help-title"><p class="eyebrow">The essentials</p><h2 id="help-title">How to play ${escapeHTML(config.name)}</h2><ol>${config.instructions.map(text=>`<li>${escapeHTML(text)}</li>`).join('')}</ol><p class="muted">${escapeHTML(credit)}. Daily play and practice are recorded separately. Revealing a solution marks that daily result as revealed.</p><button class="button primary" id="close-help">Let’s play</button></dialog><dialog id="stats-dialog" aria-labelledby="stats-title"><p class="eyebrow">Your daily record</p><h2 id="stats-title">A little progress.</h2><p>${escapeHTML(config.name)}, one day at a time.</p><div class="stats-grid"><div><strong id="stats-played">0</strong><span>daily played</span></div><div><strong id="stats-won">0</strong><span>solved</span></div><div><strong id="stats-streak">0</strong><span>day streak</span></div></div><p class="muted">Practice is yours to explore. These numbers count daily puzzles on this device.</p><button class="button primary" id="close-stats">Back to the puzzle</button></dialog><dialog id="reveal-dialog" aria-labelledby="reveal-title"><h2 id="reveal-title">See the solution?</h2><p>This ends the current puzzle as revealed. You can keep playing other puzzles in Practice.</p><div class="actions"><button class="button" id="cancel-reveal">Keep playing</button><button class="button primary" id="confirm-reveal">Reveal</button></div></dialog>`;
  const $=id=>doc.getElementById(id),board=$('puzzle');
  let lastPayload='',lastOutcome=session.outcome,stopped=false,dialogPause=false;
  const dateFormat=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',month:'short',day:'numeric'});
  function announce(message){$('game-message').textContent=message||'';}
  function emit(){const payload=session.progress(),json=JSON.stringify(payload);if(json!==lastPayload){lastPayload=json;sendNative(payload);}}
  function render(message, preserveFocus=true, preserveDrafts=false) {
    session.refreshSavedResult();
    const state=session.state,puzzle=session.puzzle,status=session.outcome,finished=status!=='playing';
    const focused=preserveFocus&&board.contains(doc.activeElement)?doc.activeElement:null;
    const focusId=focused?.id;
    const focusData=focused?Object.entries(focused.dataset):[];
    const focusText=focused?.textContent;
    // Inputs with a value attribute are owned by their engine. Only keep
    // unsubmitted DOM drafts for a hint, never after submission or mode changes.
    const drafts=preserveDrafts?[...board.querySelectorAll('input:not([value])')].filter(el=>el.id&&el.type==='text').map(el=>({id:el.id,value:el.value,start:el.selectionStart,end:el.selectionEnd})):[];
    const selection=focused&&['INPUT','TEXTAREA'].includes(focused.tagName)&&Number.isInteger(focused.selectionStart)?[focused.selectionStart,focused.selectionEnd]:null;
    $('game-edition').textContent=dateFormat.format(new Date(`${session.dateKey}T12:00:00Z`));
    $('game-mode').textContent=session.mode==='daily'?'Daily puzzle':'Practice';
    $('daily-mode').setAttribute('aria-pressed',String(session.mode==='daily'));
    $('practice-mode').setAttribute('aria-pressed',String(session.mode==='practice'));
    $('practice-mode').textContent=session.mode==='practice'?'Next practice':'Practice';
    config.render({root:board,puzzle,state,mode:session.mode,announce,commit:(next,note)=>{
      const changed=session.commit(next);render(note||(!changed&&session.outcome==='playing'?'The puzzle changed. Try that move again.':''));return changed;
    }});
    board.dataset.gameReady='true';
    for(const draft of drafts){const input=$(draft.id);if(input&&board.contains(input)){input.value=draft.value;try{input.setSelectionRange(draft.start,draft.end);}catch{}input.dispatchEvent(new win.Event('input',{bubbles:true}));}}
    if(finished)board.querySelectorAll('button,input,textarea,select').forEach(el=>{el.disabled=true;});
    if(focused&&!finished){
      const replacement=focusId?$(focusId):[...board.querySelectorAll('button,input,textarea,select')].find(el=>el.tagName===focused.tagName&&(focusData.length?focusData.every(([key,value])=>el.dataset[key]===value):el.textContent===focusText));
      if(replacement&&board.contains(replacement)&&!replacement.disabled){
        replacement.focus({preventScroll:true});
        if(selection)try{replacement.setSelectionRange(...selection);}catch{}
      }else{board.tabIndex=-1;board.focus({preventScroll:true});}
    }
    $('game-hint').hidden=typeof config.hint!=='function';$('game-hint').disabled=finished;
    $('game-reveal').hidden=typeof config.reveal!=='function';$('game-reveal').disabled=finished;
    $('game-share').hidden=!finished;$('result').hidden=!finished;
    if(finished){
      $('result-heading').textContent=status==='won'?'That’s the one.':status==='lost'?'A good challenge.':'A new way to see it.';
      $('result-summary').textContent=config.summarize?.(puzzle,state)||(status==='won'?'Puzzle solved.':status==='lost'?'This round is complete.':'Solution revealed.');
      $('result-next').textContent=session.mode==='daily'?'Your daily result is saved. Another puzzle is ready in Practice.':'Try another practice puzzle, or return to Today.';
      if(lastOutcome==='playing'){$('result').tabIndex=-1;$('result').focus({preventScroll:true});}
    }
    if(status==='won'&&lastOutcome==='playing')sendNative({type:'haptic',kind:'win'});
    lastOutcome=status;
    const stats=session.stats;$('local-stats').textContent=`${stats.played} daily played · ${stats.won} solved · ${stats.streak} day streak`;
    $('stats-played').textContent=stats.played;$('stats-won').textContent=stats.won;$('stats-streak').textContent=stats.streak;
    $('storage-note').hidden=session.storageAvailable;
    $('collection-size').textContent=`${config.puzzles.length} prepared puzzles, repeating in rotation`;
    if(message!==undefined)announce(message);emit();
  }
  $('daily-mode').addEventListener('click',()=>{session.daily();lastOutcome=session.outcome;render('Today’s puzzle.');});
  $('practice-mode').addEventListener('click',()=>{const result=session.practice();lastOutcome=session.outcome;render(result==='resumed'?'Practice resumed. Your daily result is unchanged.':'A new practice puzzle. Your daily result is unchanged.');});
  $('game-hint').addEventListener('click',()=>{const changed=session.hint();render(changed?'A little help. Follow the clue.':'No further hint is available for this position.',true,true);});
  $('game-reveal').addEventListener('click',()=>{dialogPause=true;$('reveal-dialog').showModal();});
  $('cancel-reveal').addEventListener('click',()=>$('reveal-dialog').close());
  $('confirm-reveal').addEventListener('click',()=>{$('reveal-dialog').close();session.reveal();render('Solution revealed.');});
  $('game-help').addEventListener('click',()=>{dialogPause=true;$('help-dialog').showModal();});
  $('close-help').addEventListener('click',()=>$('help-dialog').close());
  $('game-stats').addEventListener('click',()=>{dialogPause=true;$('stats-dialog').showModal();});
  $('close-stats').addEventListener('click',()=>$('stats-dialog').close());
  for(const id of ['help-dialog','stats-dialog','reveal-dialog'])$(id).addEventListener('close',()=>{dialogPause=false;lastTick=performance.now();});
  $('game-share').addEventListener('click',async()=>{
    const status=session.outcome,symbol=status==='won'?'🟩':status==='lost'?'⬜':'🟨';
    const text=`Alford Daily · ${config.name}\n${session.dateKey}${session.mode==='practice'?' · Practice':''}\n${symbol} ${status==='won'?'Solved':status==='lost'?'Finished':'Revealed'}\n${credit}`;
    if(sendNative({type:'share',text}))return;
    try{await navigator.clipboard.writeText(text);announce('Spoiler-free result copied.');}catch{announce(text);}
  });
  let lastTick=performance.now();
  function refreshSaved(){
    if(session.refreshDate()){render('A new daily puzzle is ready.');return true;}
    if(session.refreshSavedResult()){render('Your saved daily result was restored.');return true;}
    return false;
  }
  function visibility(){lastTick=performance.now();if(!doc.hidden)refreshSaved();}
  function storageChanged(event){
    if(!doc.hidden&&(event.key===null||event.key?.startsWith(`${config.id}:v1:`)))refreshSaved();
  }
  doc.addEventListener('visibilitychange',visibility);
  win.addEventListener('storage',storageChanged);
  const clock=win.setInterval(()=>{
    const now=performance.now(),delta=Math.min(2500,Math.max(0,now-lastTick));lastTick=now;
    if(stopped||doc.hidden||dialogPause)return;
    if(refreshSaved())return;
    if(typeof config.tick==='function'&&session.outcome==='playing'){
      const next=config.tick(session.puzzle,session.state,delta,session.mode);
      if(next&&JSON.stringify(next)!==JSON.stringify(session.state)){session.commit(next);render(undefined,true);}
    }
  },500);
  const cleanup=()=>{stopped=true;win.clearInterval(clock);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('storage',storageChanged);win.removeEventListener('pageshow',pageShow);win.removeEventListener('pagehide',pageHide);};
  const pageShow=()=>{lastTick=performance.now();if(!stopped)refreshSaved();};
  const pageHide=event=>{if(!event.persisted)cleanup();};
  win.addEventListener('pageshow',pageShow);
  // A back/forward cache restore keeps this document and its interval alive.
  // Only dispose the clock when the document is actually being discarded.
  win.addEventListener('pagehide',pageHide);
  render();
  return {session,render,destroy:cleanup};
}
