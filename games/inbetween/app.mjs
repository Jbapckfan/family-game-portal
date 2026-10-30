import {practiceCandidates} from '../deepseek-runtime/practice-calendar.mjs';
import { PUZZLES } from './puzzles.mjs';
import { getDateKey, getDaily, createGame, buildWord, submitPlacement, findHint, useHint, revealGame, restoreGame, getStats, formatShare } from './engine.mjs';
import { openResultShare } from './share-card.mjs';
import { installPlacementDrag } from './placement-drag.mjs';

// Optional native bridge; browser rules and existing save keys are unchanged.
function nativeMessage(payload) {
  try { const handler = window.webkit?.messageHandlers?.alford; if (!handler?.postMessage) return false; handler.postMessage({...payload,slug:'inbetween'}); return true; } catch {return false;}
}
if (window.webkit?.messageHandlers?.alford) document.body.classList.add('native-app');

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PREFIX = 'inbetween:v1:';
const dialog = $('game-dialog');
const memory = new Map();
const dirtyKeys = new Set();
const acceptedSaves = new Map();
let mode = 'daily';
let daily = getDaily(PUZZLES);
let puzzle = daily.puzzle;
let storageWarning = false;
let game = restoreGame(puzzle, read('daily:' + daily.dateKey, null, true));
let records = readRecords();
let selectedTile = null;
let preview = null;
let hinted = null;
let rejected = false;
let feedback = '';
let lastFocus = null;
let toastTimer;
let resultTimer;
let placementDrag=null;
let audioContext;
let soundOn = read('settings', {})?.sound === true;

function read(key, fallback, acceptGame=false) {
  if(dirtyKeys.has(key)&&memory.has(key))return memory.get(key);
  try {
    const value = localStorage.getItem(PREFIX + key);
    if(acceptGame)acceptedSaves.set(key,value);
    if(value===null)return memory.has(key)?memory.get(key):fallback;
    const parsed=JSON.parse(value);memory.set(key,parsed);return parsed;
  }
  catch { return memory.has(key)?memory.get(key):fallback; }
}
function readRecords() {
  const value = read('records', {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function write(key, value, readable=true) {
  // A shared records object must not flush any terminal daily still unsaved.
  if(key==='records'&&[...dirtyKeys].some(k=>k.startsWith('daily:')))readable=false;
  memory.set(key,value);
  try { if(!readable)throw Error('Unverified storage');localStorage.getItem(PREFIX+key);const raw=JSON.stringify(value);localStorage.setItem(PREFIX+key,raw);acceptedSaves.set(key,raw);dirtyKeys.delete(key);storageWarning=dirtyKeys.size>0;return true; }
  catch {
    dirtyKeys.add(key);
    if (!storageWarning) { storageWarning = true; toast('You can play, but this browser couldn’t save your progress.'); }
    return false;
  }
}
function keyForGame() { return mode === 'daily' ? 'daily:' + daily.dateKey : 'practice:' + puzzle.id; }
function recordDailyResult(dateKey,state,readable=true) {
  if(state.status==='playing')return;
  const next={status:state.status,attempts:state.attempts,hints:state.hints};
  if(JSON.stringify(records[dateKey])!==JSON.stringify(next)){
    records[dateKey]=next;
    write('records',records,readable);
  }else if(dirtyKeys.has('records'))write('records',records,readable);
}
function flushPendingGame() {if(dirtyKeys.has(keyForGame())){saveGame();render();}}
function reconcileDailyResult() {
  records={...records,...readRecords()};
  if(mode==='daily')recordDailyResult(daily.dateKey,game);
  const current=getDaily(PUZZLES);
  recordDailyResult(current.dateKey,restoreGame(current.puzzle,read('daily:'+current.dateKey,null)));
}
function hintViewKey(){return `inbetween:ui:v1:${keyForGame()}`;}
function rememberHintView(){try{if(hinted)sessionStorage.setItem(hintViewKey(),JSON.stringify({placements:game.placements,hints:game.hints,hint:{row:hinted.row,tileId:hinted.tileId,gap:hinted.gap}}));else sessionStorage.removeItem(hintViewKey());}catch{}}
function restoreHintView(){
  if(game.status!=='playing'||!game.hints)return;
  try{const saved=JSON.parse(sessionStorage.getItem(hintViewKey())),expected=findHint(puzzle,game);if(saved?.hints!==game.hints||JSON.stringify(saved.placements)!==JSON.stringify(game.placements)||!expected)return;const expectedKey={row:expected.row,tileId:expected.tileId,gap:expected.gap};if(JSON.stringify(saved.hint)!==JSON.stringify(expectedKey))return;hinted=expected;selectedTile=expected.tileId;preview=expectedKey;}catch{}
}
function adoptedFeedback(){
  clearTimeout(resultTimer);clearSelection();rememberHintView();
  feedback=game.status==='playing'?'Progress changed in another window. Your saved board is restored; try your move again.':'This board was completed in another window. Your saved result is restored.';
  if(dialog.open)closeDialog();toast(feedback);if(mode==='daily'){records={...records,...readRecords()};recordDailyResult(daily.dateKey,game);}
}
function saveGame(previous=game) {
  const key = keyForGame();
  let raw;try{raw=localStorage.getItem(PREFIX+key);}catch{}
  if(raw===undefined){write(key,game,false);if(mode==='daily')recordDailyResult(daily.dateKey,game,false);return true;}
  if(acceptedSaves.has(key)?raw!==acceptedSaves.get(key):raw!==null){
    try{const restored=restoreGame(puzzle,raw===null?null:JSON.parse(raw));
      if(mode==='daily'&&previous.status!=='playing'&&restored.status==='playing')game=previous;
      else{game=restored;memory.set(key,game);acceptedSaves.set(key,raw);dirtyKeys.delete(key);storageWarning=dirtyKeys.size>0;adoptedFeedback();return false;}
    }catch{}
  }
  if (mode === 'daily') {
    const stored = restoreGame(puzzle, read(key, null));
    if (stored.status !== 'playing') {
      if (game.status !== stored.status || game.attempts !== stored.attempts || game.hints !== stored.hints) {
        toast('This daily was finished in another tab. Your saved result is restored.');
        clearSelection();
      }
      game = stored;
    }
    records = { ...records, ...readRecords() };
  }
  const saved=write(key, game);
  if (mode === 'daily')recordDailyResult(daily.dateKey,game,saved);
  return true;
}
function tileById(id) { return puzzle.tiles.find(tile => tile.id === id); }
function solvedCount() { return game.placements.filter(Boolean).length; }
function clearSelection() { placementDrag?.cancel();selectedTile = null; preview = null; hinted = null; rejected = false; }
function announce(message) { $('announcer').textContent = ''; requestAnimationFrame(() => { $('announcer').textContent = message; }); }
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3800); }
function formatDate(key) { return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(key+'T12:00:00Z')); }
function gapDescription(seed, gap) { return gap === 0 ? `before ${seed[0]}` : gap === seed.length ? `after ${seed.at(-1)}` : `between ${seed[gap-1]} and ${seed[gap]}`; }

function render(options = {}) {
  nativeMessage({type:'progress',name:'Inbetween',mode,dateKey:daily.dateKey,status:game.status,stats:getStats(records,getDateKey())});
  const used = new Set(game.placements.filter(Boolean).map(p => p.tileId));
  const count = solvedCount();
  const active = game.status === 'playing';
  const selected = tileById(selectedTile);
  $('bank').innerHTML = puzzle.tiles.map(tile => `<button class="pair${tile.id === selectedTile ? ' selected' : ''}${used.has(tile.id) ? ' used' : ''}" data-tile="${esc(tile.id)}" aria-label="Pair ${esc(tile.letters.split('').join(' '))}${used.has(tile.id) ? ', placed' : ''}" aria-pressed="${tile.id === selectedTile}" ${!active || used.has(tile.id) ? 'disabled' : ''}><span>${tile.letters[0]}</span><span>${tile.letters[1]}</span></button>`).join('');
  $('bank-count').textContent = count === 6 ? 'Every pair is home' : `${6-count} to place`;
  $('bank-note').textContent = !active ? 'Every letter has found its place.' : selected ? `${selected.letters} is ready. Drag it to a +, or tap a gap.` : 'Drag a pair to a gap, or tap to choose. Preview freely.';
  $('bank-note').classList.toggle('active', !!selected);
  $('puzzle').innerHTML = puzzle.rows.map((row,r) => {
    const placement = game.placements[r];
    const hasPreview = preview?.row === r;
    const letters = placement ? tileById(placement.tileId).letters : null;
    const word = hasPreview && selected ? buildWord(row.seed, selected.letters, preview.gap) : null;
    const heading = `<div class="clue"><span class="row-number" aria-hidden="true">${placement ? game.status === 'revealed' ? '·' : '✓' : String(r+1).padStart(2,'0')}</span><div class="clue-copy">${esc(row.clue)}${placement ? `<small>${esc(row.seed)} + ${esc(letters)}</small>` : ''}</div></div>`;
    const burst=options.solved===r?`<div class="fit-burst" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--x:${Math.round(Math.cos(i*Math.PI/6)*64)}px;--y:${Math.round(Math.sin(i*Math.PI/6)*46)}px;--turn:${i*30}deg"></i>`).join('')}</div>`:'';
    const line = placement ? `<div class="answer-letters" aria-label="${esc(row.answer)}, ${game.status === 'revealed' ? 'revealed' : 'fits'}">${[...row.answer].map((letter,c)=>`<span style="--letter-index:${c}" class="answer-letter${c >= placement.gap && c < placement.gap+2 ? ' inserted' : ''}" aria-hidden="true">${letter}</span>`).join('')}${burst}</div>` : `<div class="word-line" role="group" aria-label="${esc(row.seed)}; select an insertion gap">${Array.from({length:5},(_,gap)=>`<button class="gap${hasPreview && preview.gap===gap ? ' active' : ''}${hinted?.row===r && hinted.gap===gap ? ' hinted' : ''}" data-row="${r}" data-gap="${gap}" aria-label="${selected ? `Insert ${esc(selected.letters)}` : 'Pick a pair first, then insert'} ${gapDescription(row.seed,gap)} in ${row.seed}. Clue: ${esc(row.clue)}" aria-pressed="${Boolean(hasPreview && preview.gap===gap)}" ${!selected || !active ? 'disabled' : ''}>+</button>${gap<4 ? `<span class="seed-letter" aria-hidden="true">${row.seed[gap]}</span>` : ''}`).join('')}</div>`;
    const panel = hasPreview && word ? `<div class="preview-panel"><div><span class="preview-label">Your fit</span><span class="preview-word" aria-label="Preview: ${word}">${word.slice(0,preview.gap)}<mark>${selected.letters}</mark>${word.slice(preview.gap+2)}</span></div><button class="fit-button" data-fit="${r}" ${rejected?'disabled':''}>${rejected?'Try another gap':'Place pair'}</button></div>${rejected ? '<p class="preview-error">That word doesn’t match the clue. Try another gap or pair.</p>' : ''}` : '';
    return `<div class="word-row${placement?' solved':''}${game.status==='revealed'?' revealed':''}${hasPreview?' previewing':''}${hasPreview && rejected?' rejected':''}${options.solved===r?' just-solved':''}${options.landed===r?' drop-landed':''}" role="group" aria-label="Word ${r+1}: ${esc(row.clue)}${placement?', completed':''}"><div class="row-main">${heading}${line}</div>${panel}</div>`;
  }).join('');
  if(options.solved!==undefined){const word=$('puzzle').querySelector('.just-solved .answer-letters'),letters=word?.querySelectorAll('.answer-letter.inserted');if(letters?.length===2){const parent=word.getBoundingClientRect(),first=letters[0].getBoundingClientRect(),last=letters[1].getBoundingClientRect();word.style.setProperty('--burst-x',`${(first.left+last.right)/2-parent.left}px`);}}
  $('daily-tab').classList.toggle('active',mode==='daily'); $('daily-tab').setAttribute('aria-pressed',String(mode==='daily'));
  $('practice-tab').classList.toggle('active',mode==='practice'); $('practice-tab').setAttribute('aria-pressed',String(mode==='practice'));
  $('issue').textContent = mode==='daily' ? `NO. ${String(daily.number).padStart(3,'0')}` : `PRACTICE ${String(PUZZLES.indexOf(puzzle)+1).padStart(2,'0')}`;
  $('puzzle-date').textContent = mode==='daily' ? formatDate(daily.dateKey) : puzzle.title;
  $('difficulty').textContent = puzzle.difficulty;
  $('progress-dots').innerHTML = Array.from({length:6},(_,i)=>`<i class="progress-dot${i<count?' filled':''}"></i>`).join('');
  $('progress-label').textContent = game.status==='revealed' ? 'Answers revealed' : `${count} of 6 fit`;
  $('attempt-count').textContent = game.attempts;
  $('attempt-word').textContent = game.attempts===1?'attempt':'attempts';
  $('perfect-goal').textContent=game.status==='revealed'?'· shown, not solved':game.status==='won'?(game.attempts===6&&!game.hints?'· perfect':'· solved'):game.hints?'· assisted':game.attempts>count?'· extra attempts':'Goal: 6 attempts · 0 nudges';
  $('feedback').textContent = feedback || (game.status==='won' ? 'Every pair, perfectly at home.' : game.status==='revealed' ? 'Answers shown. There’s always another way in.' : 'Pick a pair. Tap a gap. See what fits.');
  $('feedback').className = `feedback${game.status==='won'?' success':rejected?' error':''}`;
  $('game-controls').hidden = !active; $('finished-actions').hidden = active;
  $('clear-button').disabled = !selectedTile;
  $('hint-button').disabled = !active||Boolean(hinted);
  $('hint-button').textContent=hinted?'✦ Nudge shown':'✦ A little nudge';
  $('finished-more-button').hidden = mode!=='practice';
  $('next-button').textContent = mode==='daily'?'Try a practice →':'Another puzzle →';
  $('results-button').textContent = game.status==='revealed'?'See the result ↗':'Your result ↗';
  $('board-note').textContent = storageWarning ? 'Progress could not be saved in this browser.' : game.hints ? `${game.hints} ${game.hints===1?'nudge':'nudges'} used. Every confirmed attempt stays in the count.` : 'No timer. No lost lives. There’s room to think.';
  $('board-note').classList.toggle('warning',storageWarning);
  $('new-day').hidden = mode!=='daily'||getDateKey()===daily.dateKey;
  if(options.focusTile) $('bank').querySelector(`[data-tile="${CSS.escape(options.focusTile)}"]:not(:disabled)`)?.focus({preventScroll:true});
  if(options.focusGap) $('puzzle').querySelector(`[data-row="${options.focusGap.row}"][data-gap="${options.focusGap.gap}"]`)?.focus({preventScroll:true});
  if(options.focusFit) $('puzzle').querySelector('[data-fit]')?.focus({preventScroll:true});
}

function chooseTile(id) {
  if(game.status!=='playing'||game.placements.some(p=>p?.tileId===id)) return;
  if(selectedTile===id){clearSelection();feedback='Choice cleared. Try any pair.';}
  else {selectedTile=id;preview=null;hinted=null;rejected=false;feedback=`Choose a gap for ${tileById(id).letters}. You can preview before placing.`;playTone('select');}
  render({focusTile:id});
  rememberHintView();
  announce(feedback);
}
function chooseGap(row,gap,{fromDrag=false}={}) {
  if(!selectedTile||game.status!=='playing'||game.placements[row])return;
  if(rejected&&preview?.row===row&&preview.gap===gap&&preview.tileId===selectedTile)return;
  preview={row,tileId:selectedTile,gap};rejected=false;
  feedback='Does it match the clue? Place the pair, or try another gap.';
  render(fromDrag?{focusFit:true,landed:row}:{focusGap:{row,gap}});
  if(fromDrag)$('puzzle').querySelector('[data-fit]')?.scrollIntoView({block:'nearest'});
  announce(`${buildWord(puzzle.rows[row].seed,tileById(selectedTile).letters,gap)}. Preview for ${puzzle.rows[row].clue}. Confirm with Place pair.`);
}
function placePair() {
  if(!preview||rejected)return;
  const before=game;
  const row=preview.row;
  const outcome=submitPlacement(puzzle,game,preview);
  if(!outcome.changed)return;
  game=outcome.state;
  if(outcome.accepted){clearSelection();feedback=`${puzzle.rows[row].answer}. A good fit.`;}
  else {rejected=true;feedback='Not quite. Your pair is still available. Try another place.';}
  if(!saveGame(before)){render();focusAvailable();announce(feedback);return;}
  rememberHintView();playTone(outcome.accepted?(game.status==='won'?'win':'fit'):'miss');
  render(outcome.accepted?{solved:row}:{focusGap:{row,gap:preview.gap}});
  announce(`${feedback} ${game.attempts} ${game.attempts===1?'attempt':'attempts'}.`);
  if(outcome.accepted && game.status==='playing')focusAvailable();
  if(game.status!=='playing'){clearTimeout(resultTimer);resultTimer=setTimeout(showResult,650);}
}
function takeHint() {
  if(game.status!=='playing'||hinted)return;
  const before=game;
  const result=useHint(puzzle,game);
  if(!result.hint)return;
  game=result.state;hinted=result.hint;selectedTile=hinted.tileId;
  preview={row:hinted.row,tileId:hinted.tileId,gap:hinted.gap};rejected=false;
  feedback='Here’s one way in. Place this pair when you’re ready.';
  if(!saveGame(before)){render();focusAvailable();announce(feedback);return;}
  rememberHintView();render({focusFit:true});
  $('puzzle').querySelector('[data-fit]')?.scrollIntoView({block:'center',behavior:reducedMotion()?'instant':'smooth'});
  announce(`Nudge ${game.hints}. ${result.hint.message} Confirm with Place pair.`);
}
function confirmHint(){
  if(game.status!=='playing'||hinted)return;
  openDialog('<p class="dialog-kicker">A SCORED NUDGE</p><h2 class="dialog-title" id="dialog-title">Show one useful fit?</h2><p class="confirm-copy">This records <strong>1 nudge</strong> and makes this an assisted round. It previews a pair and its gap; you still confirm with Place pair. Your attempt count stays the same. The advice remains until you place it, clear your choice or choose another pair.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-action="use-hint">Use this nudge</button></div>');
}
function focusAvailable(){const target=game.status!=='playing'?$('results-button'):$('bank').querySelector('button:not(:disabled)');target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});}

function openDialog(content) {
  placementDrag?.cancel();
  clearTimeout(resultTimer);
  if(!dialog.open)lastFocus=document.activeElement;
  $('dialog-content').innerHTML=content;
  if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>($('dialog-content').querySelector('[autofocus]')||$('dialog-close')).focus());
}
function closeDialog() {
  dialog.close();
  requestAnimationFrame(()=>{
    if(lastFocus?.isConnected&&lastFocus.matches?.('button,a,input,textarea,select')&&!lastFocus.disabled&&lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});
    else if(game.status!=='playing')$('results-button').focus({preventScroll:true});
    else if(preview)$('puzzle').querySelector('[data-fit]')?.focus({preventScroll:true});
    else focusAvailable();
  });
}
function showHelp() {
  openDialog(`<p class="dialog-kicker">A LITTLE SPACE. A NEW MEANING.</p><h2 class="dialog-title" id="dialog-title">Find where you fit.</h2><p class="dialog-body">Six real words are missing a little something. Use every pair in the bank once to make the six clue answers.</p><div class="help-example" aria-label="SING plus PR makes SPRING">SING <span>→</span> S<mark>PR</mark>ING</div><ol class="help-list"><li><b>1</b><span><strong>Pick a pair.</strong> Drag it to a gap, or tap to choose. Its two letters stay together and in order.</span></li><li><b>2</b><span><strong>Tap a + in a word.</strong> Insert at the start, end, or any gap. Keep the original letters in order.</span></li><li><b>3</b><span><strong>Preview, then place.</strong> Drop to preview, then use Place pair to lock it in. Wrong confirmed fits cost an attempt; previews are free.</span></li></ol><p class="dialog-body"><strong>Six attempts without nudges is a perfect fit.</strong> Take as many as you need. A nudge shows a useful placement and is noted in your result.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Let’s make room →</button></div>`);
}
function showResult() {
  if(game.status==='playing')return;
  const won=game.status==='won';
  const perfect=won&&game.attempts===6&&game.hints===0;
  openDialog(`<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A LITTLE PRACTICE'}</p><div class="result-symbol${perfect?' perfect':''}" aria-hidden="true">[ ${perfect?'✳':won?'✓':'·'} ]</div><h2 class="dialog-title" id="dialog-title">${perfect?'A perfect fit.':won?'Right where they belong.':'A little perspective.'}</h2><p class="result-copy">${perfect?'Six pairs. Six placements. No nudges needed.':won?'A few little letters. Six entirely new possibilities.':'Answers revealed. This board doesn’t count as a win.'}</p><div class="result-dots${won?'':' revealed'}" aria-hidden="true">${'<span></span>'.repeat(6)}</div><div class="result-metrics"><div><strong>${game.attempts}</strong><span>${game.attempts===1?'attempt':'attempts'}</span></div><div><strong>${game.hints}</strong><span>${game.hints===1?'nudge':'nudges'}</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your fit ↗</button><button class="secondary-button" data-action="practice">${mode==='daily'?'Try a practice':'Another puzzle'} →</button></div><p class="fineprint">${mode==='daily'?'A fresh puzzle at midnight Central.':'Practice is separate from your daily streak.'}<br>Your result never shares the answers.</p>`);
}
function showStats() {
  flushPendingGame();
  records=readRecords();reconcileDailyResult();const stats=getStats(records,getDateKey());
  openDialog(`<p class="dialog-kicker">YOUR DAILY RITUAL</p><h2 class="dialog-title" id="dialog-title">A place in your day.</h2><div class="stats-grid"><div><div class="stat-number">${stats.played}</div><div class="stat-label">Completed</div></div><div><div class="stat-number">${stats.played?Math.round(stats.won/stats.played*100):0}%</div><div class="stat-label">Solved</div></div><div><div class="stat-number">${stats.streak}</div><div class="stat-label">Current streak</div></div><div><div class="stat-number">${stats.bestStreak}</div><div class="stat-label">Best streak</div></div></div><div class="stats-detail"><span>Perfect fits</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average attempts when solved</span><strong>${!stats.won?'—':Number(stats.averageAttempts).toFixed(1)}</strong></div><p class="fineprint">Daily results are saved in this browser.<br>Practice and revealed boards don’t extend a streak.<br>Clearing browser data removes your progress.</p>`);
}
function savedPractice(index, acceptGame=false) {
  const candidate=PUZZLES[index];if(!candidate)return null;
  const raw=read('practice:'+candidate.id,null,acceptGame);
  if(raw?.puzzleId!==candidate.id)return null;
  const saved=restoreGame(candidate,raw);
  // Reject validator fallbacks instead of treating malformed data as a saved round.
  if(JSON.stringify(saved)!==JSON.stringify(createGame(candidate)))return saved;
  return Object.keys(saved).every(key=>JSON.stringify(raw[key])===JSON.stringify(saved[key]))?saved:null;
}
function unfinishedPractice(index) {
  const saved=savedPractice(index);
  return saved?.status==='playing';
}
function practiceIndices() {
  const current=getDaily(PUZZLES),todayIndex=PUZZLES.findIndex(item=>item.id===current.puzzle.id);
  const indices=practiceCandidates('inbetween',current.dateKey,PUZZLES.length,{excludeIndices:[todayIndex]});
  const saved=read('daily:'+current.dateKey,null);
  if(todayIndex>=0&&saved?.puzzleId===current.puzzle.id&&restoreGame(current.puzzle,saved).status!=='playing'&&!indices.includes(todayIndex))indices.push(todayIndex);
  return indices;
}
function canPractice(index) {return Number.isInteger(index)&&Boolean(PUZZLES[index])&&(practiceIndices().includes(index)||unfinishedPractice(index));}
function showPractice() {
  const fresh=new Set(practiceIndices()),available=PUZZLES.map((_,i)=>i).filter(i=>fresh.has(i)||unfinishedPractice(i));
  openDialog(`<p class="dialog-kicker">MAKE A LITTLE MORE ROOM</p><h2 class="dialog-title" id="dialog-title">A little practice.</h2><p class="result-copy">Pick a puzzle. Take your time.<br>Practice never changes your daily score.</p><button class="primary-button practice-random" data-action="random" autofocus>Find me a fresh one ↗</button><div class="practice-grid">${available.map(i=>{
    const p=PUZZLES[i],saved=savedPractice(i),done=saved&&saved.status!=='playing',resume=unfinishedPractice(i);
    return `<button class="practice-choice${done?' done':''}" data-practice="${i}" aria-label="${resume?'Resume practice':'Practice'} ${i+1}: ${esc(p.title)}${done?', completed':''}">${String(i+1).padStart(2,'0')}</button>`;
  }).join('')}</div><p class="fineprint">${available.length} available now. Upcoming dailies stay fresh. Saved rounds can be resumed; finish today’s daily to replay it.</p>`);
}
function loadPractice(index) {
  if(!Number.isInteger(index)||!PUZZLES[index]||!canPractice(index))return;
  clearTimeout(resultTimer);mode='practice';puzzle=PUZZLES[index];game=savedPractice(index,true)||createGame(puzzle);
  clearSelection();restoreHintView();feedback='';render();lastFocus=null;closeDialog();document.querySelector('.game-topline').scrollIntoView({block:'start',behavior:reducedMotion()?'instant':'smooth'});
}
function randomPractice() {
  const possible=practiceIndices().map(i=>({p:PUZZLES[i],i})).filter(({p})=>p.id!==puzzle.id);
  const fresh=possible.filter(({i})=>{const saved=savedPractice(i);return !saved||saved.status==='playing';});
  const pool=fresh.length?fresh:possible;
  if(pool.length)loadPractice(pool[Math.floor(Math.random()*pool.length)].i);
}
function loadDaily() {
  flushPendingGame();
  clearTimeout(resultTimer);mode='daily';daily=getDaily(PUZZLES);puzzle=daily.puzzle;game=restoreGame(puzzle,read('daily:'+daily.dateKey,null,true));
  clearSelection();restoreHintView();feedback='';reconcileDailyResult();render();if(dialog.open)closeDialog();
}
function showOptions() {
  openDialog(`<p class="dialog-kicker">A LITTLE BREATHING ROOM</p><h2 class="dialog-title" id="dialog-title">Your way to play.</h2><div class="option-list">${game.status==='playing'?'<button data-action="confirm-reveal">Reveal the answers →<small>Ends this board as revealed, not solved.</small></button>':''}${mode==='practice'?'<button data-action="confirm-restart">Start this practice over ↻<small>Clears this practice’s progress and score.</small></button>':''}<button data-action="practice">Choose another practice →<small>Your current progress stays saved.</small></button><button data-action="help">A refresher on the rules ↗</button></div>`);
}
function confirmReveal() {
  openDialog('<p class="dialog-kicker">CURIOUS HOW IT FITS?</p><h2 class="dialog-title" id="dialog-title">Show the answers?</h2><p class="confirm-copy">This ends the puzzle as revealed. It won’t count as a win or extend your streak.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-action="reveal">Reveal this board</button></div>');
}
function reveal() {
  const before=game;game=revealGame(puzzle,game);clearSelection();feedback='';const saved=saveGame(before);rememberHintView();render();showResult();announce(saved?'Answers revealed. This board is not recorded as a win.':feedback);
}
function confirmRestart() {
  if(mode!=='practice')return;
  openDialog('<p class="dialog-kicker">A FRESH PERSPECTIVE</p><h2 class="dialog-title" id="dialog-title">Start this one over?</h2><p class="confirm-copy">The current practice board and attempt count will be reset. Your daily results stay saved.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep this board</button><button class="primary-button" data-action="restart">Restart practice</button></div>');
}
function restart() {
  if(mode!=='practice')return;
  const before=game;game=createGame(puzzle);clearSelection();feedback='A fresh start. Find where they fit.';const saved=saveGame(before);rememberHintView();render();lastFocus=null;closeDialog();announce(saved?'Practice restarted. Six pairs ready.':feedback);
}
async function share() {
  if(game.status==='playing')return;
  const text=formatShare(puzzle,game,{number:mode==='daily'?daily.number:PUZZLES.indexOf(puzzle)+1,mode});
  if(nativeMessage({type:'share',text})) return;
  try{openResultShare({game,mode,daily,openDialog});}catch{toast('This saved result needs a valid score before it can be shared.');}
}
function showAbout() {
  openDialog(`<p class="dialog-kicker">AN ALFORD FAMILY GAME</p><h2 class="dialog-title" id="dialog-title">A little more possibility.</h2><p class="dialog-body">Inbetween is a daily word puzzle about making room: six real words, six two-letter pairs, six new meanings.</p><p class="dialog-body">This edition has <strong>${PUZZLES.length} prepared puzzles</strong>. The daily rotates through the collection and eventually repeats. Everyone gets the same puzzle at midnight Central.</p><p class="dialog-body">Progress is saved on this browser, with no account or tracking. Your scores don’t sync across devices. This is a new game in the established family of word-insertion puzzles.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Back to the spaces →</button></div>`);
}
function reducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
function updateSoundButton(){
  $('sound-button').setAttribute('aria-label',soundOn?'Turn sound off':'Turn sound on');
  $('sound-button').title=soundOn?'Turn sound off':'Turn sound on';
  $('sound-button').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4V4Z"/>${soundOn?'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>':'<path d="m16 9 6 6m0-6-6 6"/>'}</svg>`;
}
function playTone(kind){
  nativeMessage({type:'haptic',kind:kind==='win'?'win':kind==='miss'?'miss':kind==='select'?'select':'fit'});
  if(!soundOn)return;
  try{
    audioContext??=new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const notes=kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='fit'?[523.25,783.99]:kind==='miss'?[233.08]:[440];
    notes.forEach((hz,i)=>{const oscillator=audioContext.createOscillator();const gain=audioContext.createGain();const start=audioContext.currentTime+i*.09;oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.035,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+.22);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.24);});
  }catch{}
}

$('bank').addEventListener('click',event=>{const button=event.target.closest('[data-tile]');if(button)chooseTile(button.dataset.tile);});
$('puzzle').addEventListener('click',event=>{
  const gap=event.target.closest('[data-gap]');if(gap){chooseGap(Number(gap.dataset.row),Number(gap.dataset.gap));return;}
  if(event.target.closest('[data-fit]'))placePair();
});
$('hint-button').addEventListener('click',confirmHint);
$('puzzle').addEventListener('keydown',event=>{
  const button=event.target.closest('[data-row][data-gap]');
  if(!button||event.ctrlKey||event.metaKey||event.altKey||game.status!=='playing')return;
  const row=Number(button.dataset.row),gap=Number(button.dataset.gap);
  let nextRow=row,nextGap=gap;
  if(event.key==='ArrowLeft')nextGap=Math.max(0,gap-1);
  else if(event.key==='ArrowRight')nextGap=Math.min(4,gap+1);
  else if(event.key==='ArrowUp'||event.key==='ArrowDown'){
    const step=event.key==='ArrowUp'?-1:1;
    for(let candidate=row+step;candidate>=0&&candidate<puzzle.rows.length;candidate+=step){if(!game.placements[candidate]){nextRow=candidate;break;}}
  }else if(event.key==='Home')nextGap=0;
  else if(event.key==='End')nextGap=4;
  else return;
  event.preventDefault();const target=$('puzzle').querySelector(`[data-row="${nextRow}"][data-gap="${nextGap}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:'center'});
});
$('clear-button').addEventListener('click',()=>{clearSelection();rememberHintView();feedback='Choice cleared. Try any pair.';render();focusAvailable();});
$('daily-tab').addEventListener('click',loadDaily);
$('new-day-button').addEventListener('click',loadDaily);
$('practice-tab').addEventListener('click',showPractice);
$('next-button').addEventListener('click',showPractice);
$('results-button').addEventListener('click',showResult);
$('help-button').addEventListener('click',showHelp);
$('quick-help').addEventListener('click',showHelp);
$('stats-button').addEventListener('click',showStats);
$('about-button').addEventListener('click',showAbout);
$('more-button').addEventListener('click',showOptions);
$('finished-more-button').addEventListener('click',showOptions);
$('dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
$('dialog-content').addEventListener('click',event=>{
  const practice=event.target.closest('[data-practice]');if(practice){loadPractice(Number(practice.dataset.practice));return;}
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='use-hint'){event.target.closest('[data-action]').disabled=true;closeDialog();takeHint();return;}
  const actions={close:closeDialog,share,practice:showPractice,random:randomPractice,help:showHelp,'confirm-reveal':confirmReveal,reveal,'confirm-restart':confirmRestart,restart,'select-share':()=>{$('share-text')?.focus();$('share-text')?.select();}};
  actions[action]?.();
});
$('sound-button').addEventListener('click',()=>{soundOn=!soundOn;write('settings',{sound:soundOn});updateSoundButton();if(soundOn)playTone('fit');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.open&&selectedTile){clearSelection();rememberHintView();feedback='Choice cleared.';render();focusAvailable();}});
window.addEventListener('storage',event=>{
  if(event.key===PREFIX+'records'){records=readRecords();return;}
  if(event.key!==PREFIX+keyForGame())return;
  const key=keyForGame();let raw;try{raw=localStorage.getItem(PREFIX+key);}catch{return;}
  let restored;try{restored=restoreGame(puzzle,raw===null?null:JSON.parse(raw));}catch{return;}
  if(mode==='daily'&&game.status!=='playing'&&restored.status==='playing'){const saved=write(key,game);recordDailyResult(daily.dateKey,game,saved);return;}
  game=restored;memory.set(key,game);acceptedSaves.set(key,raw);dirtyKeys.delete(key);storageWarning=dirtyKeys.size>0;adoptedFeedback();render();focusAvailable();announce(feedback);
});
setInterval(()=>{$('new-day').hidden=mode!=='daily'||getDateKey()===daily.dateKey;},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)$('new-day').hidden=mode!=='daily'||getDateKey()===daily.dateKey;});
if(/\/games\/inbetween\/?(?:index\.html)?$/.test(location.pathname)){
  $('family-link').href=document.documentElement?.dataset?.collectionHome||'../../';$('tradeoff-link').href='../tradeoff/';
}
reconcileDailyResult();restoreHintView();updateSoundButton();render();
if(window.PointerEvent)placementDrag=installPlacementDrag({
  bank:$('bank'),board:$('puzzle'),reducedMotion,
  getSession:()=>({key:`${mode}:${puzzle.id}:${daily.dateKey}`,revision:game,playing:game.status==='playing'}),
  isAvailable:id=>Boolean(tileById(id))&&game.status==='playing'&&!game.placements.some(p=>p?.tileId===id),
  getLetters:id=>tileById(id)?.letters,
  getWord:(row,id,gap)=>puzzle.rows[row]&&buildWord(puzzle.rows[row].seed,tileById(id)?.letters,gap),
  selectPair:id=>{const before={selectedTile,preview,hinted,rejected,feedback};if(selectedTile!==id)chooseTile(id);return ()=>{({selectedTile,preview,hinted,rejected,feedback}=before);rememberHintView();render();focusAvailable();};},
  previewDrop:({tileId,row,gap})=>{if(game.status!=='playing'||game.placements[row]||game.placements.some(p=>p?.tileId===tileId))return false;if(selectedTile!==tileId)chooseTile(tileId);chooseGap(row,gap,{fromDrag:true});return true;},
});
