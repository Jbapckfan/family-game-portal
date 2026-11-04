import {mountDailyGame, escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
let live, boardStamp='',clockRound='',lastImpacts=0,practicePhase=0,motionWave=-1,feedback='Ready when you are.',feedbackKind='ready';
const eventMode=e=>e.pointerType||e.detail>0?'tiles':'keyboard';
function act(fn, args=[], inputMode=null) {
  const {puzzle:p,state:s,commit,announce,root}=live;
  const paced=inputMode?E.setInputMode(p,s,inputMode,fn===E.pick&&s.started):s;
  const result=fn(p,paced,...args), next=result?.state||result;
  if(fn===E.submit&&E.score(next)>E.score(s)){const word=E.currentWord(p,s);feedback=`${word} · ${word.length*10} damage${E.waveIndex(p,next)>E.waveIndex(p,s)?' · WAVE CLEARED':''}`;feedbackKind='hit';}
  else if(next.misses>s.misses){feedback='Word rejected · −10 core HP';feedbackKind='impact';}
  if(fn===E.start&&!s.started){feedback='Defense active · build a word and fire.';feedbackKind='ready';}
  if(fn===E.assist&&!s.untimed)practicePhase=20000-s.remainingMs;
  const message=result?.message;
  if(next===s)announce(message||'');else commit(next,message);
  if(E.getStatus(live.puzzle,live.state)==='playing')root.focus({preventScroll:true});
}
function updateClock() {
  const {root,puzzle:p,state:s,mode}=live;
  const current=E.waveIndex(p,s),w=p.waves[current],status=E.getStatus(p,s);
  const clock=root.querySelector('#siege-clock'),enemy=root.querySelector('#siege-enemy'),meter=root.querySelector('#siege-time-fill');
  if(!clock)return;
  const untimed=s.untimed||mode==='practice';
  clock.textContent=status!=='playing'?'Complete':!s.started?'Ready':untimed?'Untimed':`${E.secondsRemaining(s)}s`;
  const ratio=untimed?1-practicePhase/20000:w?s.remainingMs/w.durationMs:1;
  if(meter)meter.style.width=`${Math.max(0,ratio*100)}%`;
  const pace=root.querySelector('#siege-pace');if(pace)pace.textContent=status!=='playing'?E.entrySummary(s):!s.started?'Auto pace · tiles 30s / typing 20s':`${s.inputMode==='tiles'?'Tile entry · 30s pace':'Keyboard · 20s pace'}${untimed?' · approach loops':''}`;
  if(enemy){const progress=status==='lost'?0:!s.started?1:ratio;enemy.style.setProperty('--approach',`${progress}`);enemy.style.left=`calc(106px + (100% - 146px) * ${progress})`;}
  clock.classList.toggle('urgent',!untimed&&s.started&&status==='playing'&&E.secondsRemaining(s)<=5);
}
mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
 untimedAssistance:(p,s)=>s.untimed,
 shareDetails:(p,s)=>[E.entrySummary(s)],
  id:'qwen-syntax-siege',name:'Syntax Siege',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
  intro:'Build a word. Break the wave. Defend the core.',
  instructions:[
    'Defend your 100-HP core against six fixed letter waves. Tap Start defense when you are ready; the pace follows your actual input: 30 seconds for touch/click tiles or 20 seconds for typed entry. Switching input keeps the same approach progress.',
    'Tap the six letter tiles to form a word of three or more letters, then Fire word. Each tile can be used once in a word. Every wave has a six-letter solution.',
    'Each letter deals 10 damage. Defeat a 60-HP enemy with one six-letter word or several different shorter words. Points equal the square of each accepted word’s length; damage is 10 per letter.',
    'The game uses a broad English dictionary. A word outside that dictionary costs 10 core HP; an expired clock costs 20 HP. A repeated accepted word deals no extra damage.',
    'A hint adds the next letter of a six-letter solution and records assistance. Untimed assist stops the clock for the rest of the puzzle. Practice is always untimed: the enemy approaches and loops back without clock damage.',
    'Help and leaving the screen pause the timer. Clear and Undo change your current word; damage to the core remains. Defeat all six waves before core HP reaches zero.'
  ],
  puzzles:PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,
  hint:E.hint,reveal:E.reveal,summarize:E.summarize,tick:(p,s,delta,mode)=>{
    if((mode==='practice'||s.untimed)&&s.started&&E.getStatus(p,s)==='playing'){
      practicePhase=(practicePhase+(Number.isFinite(delta)?Math.max(0,delta):0)*E.paceFactor(s))%20000;updateClock();
    }
    return E.tick(p,s,delta,mode);
  },
  render(context) {
    live=context;
    const {root,puzzle:p,state:s,mode}=context;
    const round=`${p.id}:${mode}`,currentWave=E.waveIndex(p,s);
    if(clockRound!==round){practicePhase=0;motionWave=currentWave;feedback=E.getStatus(p,s)==='won'?'Core secure.':E.getStatus(p,s)==='lost'?'Core breached.':s.revealed?'Solutions revealed.':s.started?'Defense in progress.':'Ready when you are.';feedbackKind='ready';}
    if(currentWave!==motionWave){practicePhase=0;motionWave=currentWave;}
    if(clockRound===round&&s.timeouts>lastImpacts){feedback='Impact · −20 core HP';feedbackKind='impact';}
    if(clockRound===round&&s.timeouts>lastImpacts)context.announce(E.getStatus(p,s)==='lost'?'Clock expired. The core took 20 damage and was breached.':'Clock expired. The core took 20 damage. Your word cleared; the same wave has a fresh clock at your current input pace.');
    clockRound=round;lastImpacts=s.timeouts;
    const stamp=JSON.stringify([p.id,mode,{...s,remainingMs:0,paceCarry:0}]);
    // Clock-only renders keep the current buttons and their focus intact.
    if(stamp===boardStamp&&root.querySelector('#siege-clock')){updateClock();return;}
    boardStamp=stamp;
    const status=E.getStatus(p,s),finished=status!=='playing',index=E.waveIndex(p,s),wave=p.waves[index];
    const word=E.currentWord(p,s),hp=E.health(s),damage=wave?E.waveDamage(s,index):60,untimed=s.untimed||mode==='practice';
    root.tabIndex=-1;
    root.innerHTML=`<section class="panel siege-panel" aria-label="Core defense" data-state="${!s.started?'ready':status}">
      <div class="siege-top"><div><span class="siege-label">Core integrity</span><strong class="siege-hp ${hp<=30?'urgent':''}">${hp}<small> / 100 HP</small></strong></div><div class="siege-score"><span class="siege-label">Word power</span><strong>${E.score(s)}<small> points</small></strong></div></div>
      <div class="siege-health" role="meter" aria-label="Core health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${hp}"><span style="width:${hp}%"></span></div>
      <ol class="siege-waves" aria-label="Six incoming waves">${p.waves.map((w,i)=>`<li class="${i<index?'done':i===index?'current':''}" aria-label="Wave ${i+1}${i<index?', defeated':i===index?', current':', incoming'}"><span>${i<index?'✓':i+1}</span></li>`).join('')}</ol>
      <div class="siege-arena ${status==='lost'?'breached':''}"><div class="siege-tower" aria-hidden="true"><span class="tower-crown"></span><span class="tower-body"><i></i>CORE</span></div><div class="siege-lane" aria-hidden="true"></div>${wave?`<div id="siege-enemy" class="siege-enemy" aria-label="Wave ${index+1} enemy, ${Math.max(0,wave.health-damage)} health remaining"><span class="enemy-icon">◆</span><b>${Math.max(0,wave.health-damage)} HP</b></div>`:'<span class="siege-victory">CORE SECURE</span>'}</div>
      <p class="siege-feedback ${feedbackKind}" aria-live="polite">${esc(feedback)}</p><div class="siege-wave-title"><strong>${status==='won'?'Six waves defeated':status==='revealed'?'Six solutions revealed':status==='lost'?'Core breached':`Wave ${index+1} of 6`}</strong><span id="siege-clock" class="siege-clock"></span></div>
      <p id="siege-pace" class="siege-pace"></p><div class="siege-time" aria-hidden="true"><span id="siege-time-fill"></span></div>
      ${wave?`<p class="muted siege-rule">${s.started?'Make words of 3–6 letters. A full anagram clears the wave.':'Six waves. One core. Your clock starts when you are ready.'}</p>
      <div class="siege-word" role="status" aria-label="Your word: ${word||'empty'}">${word?esc(word):'<span>BUILD A WORD</span>'}</div>
      <div class="siege-rack" role="group" aria-label="Current letter rack">${wave.rack.map((letter,i)=>`<button id="siege-letter-${i}" type="button" class="tile ${s.selected.includes(i)?'selected':''}" data-letter="${i}" aria-label="${letter}, tile ${i+1}${s.selected.includes(i)?`, selected letter ${s.selected.indexOf(i)+1}`:''}" ${finished||!s.started||s.selected.includes(i)?'disabled':''}>${esc(letter)}${s.selected.includes(i)?`<small class="siege-order" aria-hidden="true">${s.selected.indexOf(i)+1}</small>`:''}</button>`).join('')}</div>
      <p class="siege-keys muted">After Start: type letters · Backspace undoes · Enter fires. Each tile is used once.</p><div class="actions siege-word-actions"><button id="siege-undo" class="button" type="button" data-action="undo" ${!s.selected.length||finished?'disabled':''}>Undo</button><button id="siege-clear" class="button" type="button" data-action="clear" ${!s.selected.length||finished?'disabled':''}>Clear</button><button id="siege-fire" class="button primary" type="button" data-action="fire" ${!s.started||word.length<3||finished?'disabled':''}>Fire word${word.length>=3?` · ${word.length*10} damage`:''}</button></div>
      ${s.played[index].length?`<ul class="word-list" aria-label="Words already fired">${s.played[index].map(w=>`<li>${esc(w)} <small>${w.length*10} damage · +${w.length**2} points</small></li>`).join('')}</ul>`:''}`:''}
      ${!s.started&&!finished?'<button id="siege-start" type="button" class="button primary siege-start" data-action="start">Start defense</button>':''}
      <div class="siege-assist">${!finished&&!untimed?'<button id="siege-assist" type="button" class="button subtle" data-action="assist">Use untimed assist</button>':`<span class="pill">${mode==='practice'?'Untimed practice':s.untimed?'Untimed assist':'Round complete'}</span>`}<span class="muted">${s.hints} hint${s.hints===1?'':'s'} · ${s.misses} miss${s.misses===1?'':'es'} · ${s.timeouts} impact${s.timeouts===1?'':'s'}</span></div>
      ${status==='revealed'?`<p class="clue">Wave solutions</p><ul class="word-list">${p.waves.map(w=>`<li>${esc(w.words[0])}</li>`).join('')}</ul>`:''}
    </section>`;
    for(const button of root.querySelectorAll('[data-letter]'))button.onclick=event=>act(E.pick,[Number(button.dataset.letter)],'tiles');
    const actions={undo:E.undo,clear:E.clear,fire:E.submit,start:E.start,assist:E.assist};
    for(const button of root.querySelectorAll('[data-action]'))button.onclick=event=>act(actions[button.dataset.action],[],button.dataset.action==='start'?eventMode(event):null);
    root.onkeydown=event=>{
      if(event.ctrlKey||event.altKey||event.metaKey||E.getStatus(live.puzzle,live.state)!=='playing')return;
      if(event.key==='Backspace'){event.preventDefault();act(E.undo);return;}
      if(event.key==='Enter'&&event.target===root){event.preventDefault();act(E.submit);return;}
      if(/^[a-zA-Z]$/.test(event.key)){
        event.preventDefault();const {puzzle:p,state:s}=live,w=p.waves[E.waveIndex(p,s)];
        const index=w.rack.findIndex((letter,i)=>letter===event.key.toUpperCase()&&!s.selected.includes(i));
        if(index>=0)act(E.pick,[index],'keyboard');else live.announce('That letter is not available in this rack.');
      }
    };
    updateClock();
  }
});

// Resume typed entry after Help or reload without intercepting forms/dialogs.
if(typeof document!=='undefined')document.addEventListener('keydown',event=>{
 if(!live?.state.started||live.root.contains(event.target)||document.querySelector('dialog[open]')||event.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
 if(/^[a-z]$/i.test(event.key)||event.key==='Backspace')live.root.onkeydown?.(event);
});
