import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,submitWord,hint,reveal,score,acceptedWords} from './engine.mjs';
mountDailyGame({
 assistanceCount:(p,s)=>s.hinted.length,
 id:'deepseek-twin-hive',name:'Twin Hive',accent:'#087c99',intro:'Two gold letters. One busy little hive. Find six words that bring them together.',
 puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 instructions:['Make six different words of at least four letters. Every word must include both gold letters.','Use only the eight displayed letters. You may reuse a letter as often as needed. Tap letters or type on your keyboard.','Each accepted word earns one point per letter beyond three. Six words complete the daily goal.','Words come from the pinned English, Wordnik and ENABLE source union. Uncommon words may count. A little hint gives a familiar prepared word without submitting it.'],
 summarize:(p,s)=>`${getStatus(p,s)==='revealed'?'Solution revealed. ':''}${s.found.length} of ${p.target} words · ${score(s)} points${s.hinted.length?` · ${s.hinted.length} word ${s.hinted.length===1?'hint':'hints'}`:''}`,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=getStatus(p,s),finished=status!=='playing';
  root.innerHTML=`<section class="panel"><div class="row hive-progress"><strong>${s.found.length} / ${p.target} words</strong><span class="pill">${score(s)} ${score(s)===1?'point':'points'}</span></div><div class="hive-meter" role="progressbar" aria-label="Daily word goal" aria-valuemin="0" aria-valuemax="${p.target}" aria-valuenow="${Math.min(s.found.length,p.target)}"><span style="width:${Math.min(100,s.found.length/p.target*100)}%"></span></div><p class="muted">Every word needs <strong>${p.gold.map(esc).join(' + ')}</strong>.</p><div class="tiles hive-rack">${[...p.letters].map(c=>`<button type="button" class="tile ${p.gold.includes(c)?'gold':''}" data-letter="${esc(c)}" aria-label="Letter ${esc(c)}${p.gold.includes(c)?', required':''}">${esc(c)}${p.gold.includes(c)?'<span class="hive-gold-dot" aria-hidden="true">✦</span>':''}</button>`).join('')}</div>${!finished?`<form id="hive-form"><label class="muted" for="hive-word">Your next word</label><input class="word-input" id="hive-word" type="text" maxlength="24" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-describedby="hive-rule"><p id="hive-rule" class="muted" aria-live="polite">At least 4 letters · repeats allowed</p><div class="actions"><button class="button" type="button" id="hive-delete" aria-label="Delete selected or previous letter">⌫ Delete</button><button class="button" type="button" id="hive-clear">Clear</button><button class="button primary" type="submit">Add word</button></div></form>`:''}${s.hintWord?`<p class="clue hive-hint">Try <strong>${esc(s.hintWord)}</strong>. A hinted word still needs to be submitted.</p>`:''}</section><section aria-label="Found words"><h2>${s.found.length?'Your word collection':'A little space for your first word'}</h2><ul class="word-list">${s.found.map(w=>`<li>${esc(w)} <span class="muted">+${w.length-3}${s.hinted.includes(w)?' · hint':''}</span></li>`).join('')}</ul></section>${s.revealed?`<section class="panel"><h2>The puzzle’s accepted words</h2><ul class="word-list hive-solutions">${acceptedWords(p).map(w=>`<li>${esc(w)}</li>`).join('')}</ul></section>`:''}`;
  if(finished)return;
  const input=root.querySelector('#hive-word');
  const updateRule=()=>{const missing=p.gold.filter(letter=>!input.value.toUpperCase().includes(letter));root.querySelector('#hive-rule').textContent=`At least 4 letters · repeats allowed · ${missing.length?`Still needs ${missing.join(' + ')}`:'Both required letters included'}`;};
  input.addEventListener('input',updateRule);updateRule();
  root.querySelectorAll('[data-letter]').forEach(button=>button.addEventListener('click',()=>{
   const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
   if(input.value.length-(end-start)>=24){announce('The entry holds up to 24 letters. Delete or select letters to replace them.');return;}
   input.setRangeText(button.dataset.letter,start,end,'end');updateRule();
  }));
  root.querySelector('#hive-delete').addEventListener('click',()=>{const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');updateRule();});
  root.querySelector('#hive-clear').addEventListener('click',()=>{input.value='';updateRule();});
  root.querySelector('#hive-form').addEventListener('submit',event=>{
   event.preventDefault();const focus=input===document.activeElement;const result=submitWord(p,s,input.value);
   if(result.state===s){announce(result.message);return;}
   commit(result.state,result.message);if(focus)root.querySelector('#hive-word')?.focus({preventScroll:true});
  });
 }
});
