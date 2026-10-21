import {createSession} from './core.mjs';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sendNative(payload){try{if(window.__ALFORD_NATIVE__?.platform!=='ios')return false;const handler=window.webkit?.messageHandlers?.alford;if(!handler?.postMessage)return false;handler.postMessage(payload);return true;}catch{return false;}}

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
  host.innerHTML=`<div class="game-shell"><header class="game-header"><a class="collection-back" href="${escapeHTML(home)}">← All games</a><span class="game-credit" data-creator-label>${escapeHTML(credit)}</span><div class="title-row"><div><p class="eyebrow">Alford Daily</p><h1>${escapeHTML(config.name)}</h1></div><button class="help-button" id="game-help" aria-label="How to play">?</button></div><p class="intro">${escapeHTML(config.intro)}</p><div class="edition"><span id="game-edition"></span><span class="pill" id="game-mode"></span></div></header><nav class="mode-switch" aria-label="Puzzle mode"><button id="daily-mode" class="button">Today</button><button id="practice-mode" class="button">Practice</button></nav><p id="storage-note" class="storage-note" hidden>Storage is unavailable. Progress is kept for this visit but may not survive closing the game.</p><main><div id="puzzle" class="puzzle"></div><p id="game-message" class="status-note" role="status" aria-live="polite"></p><section id="result" class="result" hidden><h2 id="result-heading"></h2><p id="result-summary"></p><p id="result-next"></p></section><div class="support-actions"><button class="button" id="game-hint">${escapeHTML(config.hintLabel||'A little hint')}</button><button class="button subtle" id="game-reveal">Reveal solution</button><button class="button primary" id="game-share" hidden>Share result</button></div><p id="local-stats" class="local-stats"></p></main><footer>New daily puzzle at midnight Central.<br><span id="collection-size"></span> · Progress stays on this device.</footer></div><dialog id="help-dialog" aria-labelledby="help-title"><h2 id="help-title">How to play ${escapeHTML(config.name)}</h2><ol>${config.instructions.map(text=>`<li>${escapeHTML(text)}</li>`).join('')}</ol><p class="muted">${escapeHTML(credit)}. Daily play and practice are recorded separately. Revealing a solution marks that daily result as revealed.</p><button class="button primary" id="close-help">Let’s play</button></dialog><dialog id="reveal-dialog" aria-labelledby="reveal-title"><h2 id="reveal-title">See the solution?</h2><p>This ends the current puzzle as revealed. You can keep playing other puzzles in Practice.</p><div class="actions"><button class="button" id="cancel-reveal">Keep playing</button><button class="button primary" id="confirm-reveal">Reveal</button></div></dialog>`;
  const $=id=>doc.getElementById(id),board=$('puzzle');
  let lastPayload='',lastOutcome=session.outcome,stopped=false,dialogPause=false;
  const dateFormat=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',month:'short',day:'numeric'});
  function announce(message){$('game-message').textContent=message||'';}
  function emit(){const payload=session.progress(),json=JSON.stringify(payload);if(json!==lastPayload){lastPayload=json;sendNative(payload);}}
  function render(message, preserveFocus=false) {
    const state=session.state,puzzle=session.puzzle,status=session.outcome,finished=status!=='playing';
    const focused=preserveFocus&&board.contains(doc.activeElement)?doc.activeElement:null;
    const focusId=focused?.id;
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
    if(finished)board.querySelectorAll('button,input,textarea,select').forEach(el=>{el.disabled=true;});
    if(focusId&&!finished){
      const replacement=$(focusId);
      if(replacement&&board.contains(replacement)&&!replacement.disabled){
        replacement.focus({preventScroll:true});
        if(selection)try{replacement.setSelectionRange(...selection);}catch{}
      }
    }
    $('game-hint').hidden=typeof config.hint!=='function';$('game-hint').disabled=finished;
    $('game-reveal').hidden=typeof config.reveal!=='function';$('game-reveal').disabled=finished;
    $('game-share').hidden=!finished;$('result').hidden=!finished;
    if(finished){
      $('result-heading').textContent=status==='won'?'That’s the one.':status==='lost'?'A good challenge.':'A new way to see it.';
      $('result-summary').textContent=config.summarize?.(puzzle,state)||(status==='won'?'Puzzle solved.':status==='lost'?'This round is complete.':'Solution revealed.');
      $('result-next').textContent=session.mode==='daily'?'Your daily result is saved. Another puzzle is ready in Practice.':'Try another practice puzzle, or return to Today.';
    }
    if(status==='won'&&lastOutcome==='playing')sendNative({type:'haptic',kind:'win'});
    lastOutcome=status;
    const stats=session.stats;$('local-stats').textContent=`${stats.played} daily played · ${stats.won} solved · ${stats.streak} day streak`;
    $('storage-note').hidden=session.storageAvailable;
    $('collection-size').textContent=`${config.puzzles.length} prepared puzzles, repeating in rotation`;
    if(message!==undefined)announce(message);emit();
  }
  $('daily-mode').addEventListener('click',()=>{session.daily();lastOutcome=session.outcome;render('Today’s puzzle.');});
  $('practice-mode').addEventListener('click',()=>{const result=session.practice();lastOutcome=session.outcome;render(result==='resumed'?'Practice resumed. Your daily result is unchanged.':'A new practice puzzle. Your daily result is unchanged.');});
  $('game-hint').addEventListener('click',()=>{const changed=session.hint();render(changed?'A little help. Follow the clue.':'No further hint is available for this position.');});
  $('game-reveal').addEventListener('click',()=>{dialogPause=true;$('reveal-dialog').showModal();});
  $('cancel-reveal').addEventListener('click',()=>$('reveal-dialog').close());
  $('confirm-reveal').addEventListener('click',()=>{$('reveal-dialog').close();session.reveal();render('Solution revealed.');});
  $('game-help').addEventListener('click',()=>{dialogPause=true;$('help-dialog').showModal();});
  $('close-help').addEventListener('click',()=>$('help-dialog').close());
  for(const id of ['help-dialog','reveal-dialog'])$(id).addEventListener('close',()=>{dialogPause=false;lastTick=performance.now();});
  $('game-share').addEventListener('click',async()=>{
    const status=session.outcome,symbol=status==='won'?'🟩':status==='lost'?'⬜':'🟨';
    const text=`Alford Daily · ${config.name}\n${session.dateKey}${session.mode==='practice'?' · Practice':''}\n${symbol} ${status==='won'?'Solved':status==='lost'?'Finished':'Revealed'}\n${credit}`;
    if(sendNative({type:'share',text}))return;
    try{await navigator.clipboard.writeText(text);announce('Spoiler-free result copied.');}catch{announce(text);}
  });
  let lastTick=performance.now();
  function visibility(){lastTick=performance.now();if(!doc.hidden&&session.refreshDate())render('A new daily puzzle is ready.');}
  doc.addEventListener('visibilitychange',visibility);
  const clock=win.setInterval(()=>{
    const now=performance.now(),delta=Math.min(2500,Math.max(0,now-lastTick));lastTick=now;
    if(stopped||doc.hidden||dialogPause)return;
    if(session.refreshDate()){render('A new daily puzzle is ready.');return;}
    if(typeof config.tick==='function'&&session.outcome==='playing'){
      const next=config.tick(session.puzzle,session.state,delta,session.mode);
      if(next&&JSON.stringify(next)!==JSON.stringify(session.state)){session.commit(next);render(undefined,true);}
    }
  },500);
  const cleanup=()=>{stopped=true;win.clearInterval(clock);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pageshow',pageShow);win.removeEventListener('pagehide',pageHide);};
  const pageShow=()=>{lastTick=performance.now();if(!stopped&&session.refreshDate())render('A new daily puzzle is ready.');};
  const pageHide=event=>{if(!event.persisted)cleanup();};
  win.addEventListener('pageshow',pageShow);
  // A back/forward cache restore keeps this document and its interval alive.
  // Only dispose the clock when the document is actually being discarded.
  win.addEventListener('pagehide',pageHide);
  render();
  return {session,render,destroy:cleanup};
}
