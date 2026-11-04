import {createSession} from './core.mjs';
import {newFeedbackId,validFeedbackId,sendFeedback} from './feedback-client.mjs';
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

/** UI contract shared by completed concepts. Timed games may supply tick(puzzle,state,deltaMs,mode).
 * Optional assistanceCount and untimedAssistance return aggregates only; never share summarize(), which can contain answers.
 */
export function mountDailyGame(config) {
  const doc=document,win=window,host=doc.getElementById('app');
  const creator=config.creator||'DeepSeek';
  const credit=config.credit||`Concept by ${creator} · Built by Alford Daily`;
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
    // A renderer may move focus to the next interaction (for example, when
    // Memory Maze ends its study phase). Keep that deliberate handoff.
    const assignedFocus=doc.activeElement!==focused&&doc.activeElement!==doc.body&&board.contains(doc.activeElement);
    if(focused&&!finished&&!assignedFocus){
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
    if(status==='playing')return;
    const details=[];
    try{
      if(typeof config.assistanceCount==='function'){
        const count=config.assistanceCount(session.puzzle,session.state);
        if(!Number.isSafeInteger(count)||count<0)throw new TypeError('Invalid assistance count');
        details.push(`Hints: ${count}`);
      }
      if(typeof config.shareDetails==='function'){const extra=config.shareDetails(session.puzzle,session.state);if(!Array.isArray(extra)||extra.some(line=>typeof line!=='string'||line.length>160))throw new TypeError('Invalid share details');details.push(...extra);}
      if(typeof config.untimedAssistance==='function'){
        const untimed=config.untimedAssistance(session.puzzle,session.state);
        if(typeof untimed!=='boolean')throw new TypeError('Invalid untimed assistance');
        if(untimed)details.push('Untimed assist');
      }
    }catch{announce('Your result could not be prepared. Please reopen the result and try again.');return;}
    const text=[`Alford Daily · ${config.name}`,`${session.dateKey}${session.mode==='practice'?' · Practice':''}`,`${symbol} ${status==='won'?'Solved':status==='lost'?'Finished':'Revealed'}`,...details,credit].join('\n');
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
  if(config.suggestions!==false)mountSuggestionBox({doc,win,gameId:config.id,gameName:config.name,snapshot:()=>({mode:session.mode,date:session.dateKey,puzzleId:session.puzzle.id}),pause:()=>{dialogPause=true;},resume:()=>{dialogPause=false;lastTick=performance.now();}});
  render();
  return {session,render,destroy:cleanup};
}


// Private playtest feedback: durable local records, never a false delivery claim.
export function mountSuggestionBox({doc,win,gameId,gameName,snapshot,pause=()=>{},resume=()=>{},anchor=null}){
 if(doc.getElementById('suggestion-form'))return;
 const native=win.__ALFORD_NATIVE__?.platform==='ios';
 const prefix='alford-daily:suggestions:v1:note:',draftKey=`alford-daily:suggestions:v1:draft:${gameId}`,box=doc.createElement('section');box.className='suggestion-box';
 box.innerHTML=`<h2>What would make this game better?</h2><p>${native?'Save your idea on this device, then use Copy / share saved feedback to send it to James. Nothing is sent automatically.':'Send your suggestion to Alford Daily. If a connection fails, your text stays here so you can retry.'}</p><form id="suggestion-form"><label for="suggestion-text">Your feedback</label><textarea id="suggestion-text" rows="4" maxlength="2000" required placeholder="Tell us what you would improve…"></textarea><button type="submit" id="suggestion-save" class="button primary">${native?'Save feedback on device':'Submit feedback'}</button></form><p id="suggestion-status" role="status" aria-live="polite"></p><details id="suggestion-history"><summary>Saved feedback <span id="suggestion-count"></span></summary><ol id="suggestion-list"></ol><button type="button" id="suggestion-copy" class="button">Copy / share saved feedback</button><textarea id="suggestion-export" readonly hidden rows="6" aria-label="Feedback ready to copy"></textarea></details>`;
 (anchor||doc.getElementById('local-stats')||doc.querySelector('.game-shell main')||doc.body.lastElementChild).after(box);
 if(!doc.getElementById('alford-feedback-style')){const style=doc.createElement('style');style.id='alford-feedback-style';style.textContent=`.suggestion-box{box-sizing:border-box;width:min(100% - 24px,720px);margin:22px auto;padding:18px;border:1px solid #b9cfde;border-radius:15px;background:#fff;color:#17384b;font:14px/1.6 system-ui;text-align:left}.suggestion-box h2{font:750 21px/1.3 system-ui;margin:0 0 8px}.suggestion-box p{font-size:13px;line-height:1.6}.suggestion-box label{display:block;font-weight:700;margin:12px 0 7px}.suggestion-box textarea{display:block;width:100%;box-sizing:border-box;resize:vertical;min-height:115px;padding:12px;border:1px solid #9cbacb;border-radius:10px;background:#fff;color:#17384b;font:16px/1.5 system-ui}.suggestion-box textarea[hidden]{display:none}.suggestion-box button{min-height:44px;padding:10px 14px;margin-top:10px;border:1px solid #247c98;border-radius:9px;background:#126f8c;color:#fff;font:700 14px system-ui;cursor:pointer}.suggestion-box button:disabled{opacity:.6;cursor:wait}.suggestion-box #suggestion-status{font-size:14px;min-height:22px;margin:12px 0}.suggestion-box #suggestion-status.saved{color:#17664b;font-weight:700}.suggestion-box summary{cursor:pointer;min-height:36px}.suggestion-box li p{white-space:pre-wrap;overflow-wrap:anywhere}.suggestion-box small{color:#4d687a}`;doc.head.append(style);}
 box.addEventListener('keydown',event=>event.stopPropagation());
 const $=id=>box.querySelector('#'+id),input=$('suggestion-text'),status=$('suggestion-status');let pendingId=null,inFlight=false;
 function records(){const storage=win.localStorage,result=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(prefix))continue;try{const item=JSON.parse(storage.getItem(key));if(item.gameId===gameId&&typeof item.text==='string'&&item.text.length<=2000&&typeof item.created==='string')result.push(item);}catch{}}return result.sort((a,b)=>a.created.localeCompare(b.created));}
 function showRecords(){try{const items=records(),list=$('suggestion-list');list.replaceChildren();for(const item of items){const li=doc.createElement('li'),stamp=doc.createElement('small'),text=doc.createElement('p');stamp.textContent=`${(item.receipt?.receivedAt||item.created).slice(0,10)} · ${item.mode==='practice'?'Practice':item.mode==='daily'?'Daily':'Game feedback'} · ${item.status==='received'?'✓ Received':native?'Saved on this device':'Not submitted'}`;text.textContent=item.text;li.append(stamp,text);list.append(li);}$('suggestion-count').textContent=`(${items.length})`;$('suggestion-copy').disabled=!items.length;}catch{status.textContent='Saved feedback could not be read. Keep a copy of what you type.';}}
 try{const raw=win.localStorage.getItem(draftKey)||'';let draft;try{draft=JSON.parse(raw);}catch{}input.value=typeof draft?.text==='string'?draft.text:raw;pendingId=validFeedbackId(draft?.id)?draft.id:null;}catch{status.textContent='Device storage is unavailable. Keep a copy of what you type.';}showRecords();
 box.addEventListener('focusin',pause);box.addEventListener('focusout',event=>{if(!box.contains(event.relatedTarget))resume();});
 input.oninput=()=>{pendingId=null;status.classList.remove('saved');try{win.localStorage.setItem(draftKey,JSON.stringify({id:null,text:input.value}));status.textContent='Draft saved on this device.';}catch{status.textContent='Draft is not saved. Copy your text before leaving.';}};
 $('suggestion-form').onsubmit=async event=>{
  event.preventDefault();if(inFlight)return;const text=input.value.trim();if(!text){status.textContent='Write some feedback first.';input.focus();return;}
  inFlight=true;$('suggestion-save').disabled=true;status.classList.remove('saved');status.textContent=native?'Saving…':'Submitting…';let locallySaved=false;
  try{
   pendingId??=newFeedbackId(win.crypto);const key=prefix+pendingId,record={id:pendingId,gameId,gameName,...snapshot(),created:new Date().toISOString(),text,status:'pending'};
   try{win.localStorage.setItem(draftKey,JSON.stringify({id:pendingId,text:input.value}));const value=JSON.stringify(record);win.localStorage.setItem(key,value);locallySaved=win.localStorage.getItem(key)===value;}catch{}
   if(native){
    if(!locallySaved)throw Error('Device save failed');
    try{win.localStorage.setItem(draftKey,'');}catch{}
    input.value='';pendingId=null;showRecords();$('suggestion-history').open=true;
    status.textContent='✓ Saved on this device. Use Copy / share saved feedback to send it to James.';status.classList.add('saved');return;
   }
   const receipt=await sendFeedback(record,win);
   try{win.localStorage.setItem(key,JSON.stringify({...record,status:'received',receipt}));win.localStorage.setItem(draftKey,'');}catch{}
   input.value='';pendingId=null;showRecords();status.textContent='✓ Feedback submitted successfully. Thank you!';status.classList.add('saved');
  }catch{status.classList.remove('saved');status.textContent=native?'Could not save your feedback. Your text is still here—copy it before leaving.':locallySaved?'Not submitted yet. A copy is saved on this device; retry when connected.':'Could not submit your feedback. Your text is still here—copy it before leaving.';}
  finally{inFlight=false;$('suggestion-save').disabled=false;}
 };
 $('suggestion-copy').onclick=async()=>{let text;try{text=records().map(n=>`${n.gameName} · ${n.mode==='practice'?'Practice':n.mode==='daily'?'Daily':'Game feedback'} · ${n.date}\n${n.text}`).join('\n\n');}catch{status.textContent='Saved feedback could not be read.';return;}if(!text){status.textContent='No saved feedback yet.';return;}if(sendNative({type:'share',text})){status.textContent='Share sheet opened. Choose where to send your feedback.';return;}try{await win.navigator.clipboard.writeText(text);status.textContent='Feedback copied. Paste it into your message to James.';}catch{$('suggestion-export').hidden=false;$('suggestion-export').value=text;$('suggestion-export').focus();$('suggestion-export').select();status.textContent='Copy your saved feedback from the text box below.';}};
 win.dispatchEvent(new win.CustomEvent('alford:feedback-ready'));
 return {destroy:()=>box.remove()};
}
