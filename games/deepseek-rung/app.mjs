import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,submitWord,undo,restart,hint,reveal,findRoute,shortestSteps,LEXICON} from './engine.mjs';
const changeLabel=(word,previous)=>{if(!previous)return '';const i=[...word].findIndex((c,i)=>c!==previous[i]);return `Position ${i+1}: ${previous[i]} → ${word[i]}`;};
const tiles=(word,previous='')=>[...word].map((c,i)=>`<span class="rung-letter ${previous&&previous[i]!==c?'changed':''}">${esc(c)}</span>`).join('');
mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
 id:'deepseek-rung',name:'Rung',accent:'#087c99',intro:'Change a letter. Find a new word. Climb all the way to the target.',
 puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 instructions:['Turn the start word into the target word by changing exactly one letter each step. Every rung must be a four-letter word.','The target shown is the shortest possible route in the game dictionary. You can still solve the daily if your route takes more steps.','Use Undo rung or Restart ladder whenever you need a different route. There is no strike limit.','A little hint suggests a next word on a shortest route from your current rung. This edition accepts '+LEXICON.length+' four-letter words, including uncommon vocabulary.'],
 summarize:(p,s)=>`${getStatus(p,s)==='revealed'?'Route revealed. ':''}${s.chain.length-1} ${s.chain.length===2?'step':'steps'} · shortest route ${shortestSteps(p)}${s.hints?` · ${s.hints} ${s.hints===1?'hint':'hints'}`:''}`,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=getStatus(p,s),finished=status!=='playing',current=s.chain.at(-1),route=s.revealed?findRoute(p.start,p.target):null;
  root.innerHTML=`<section class="panel"><div class="rung-endpoints"><div><p class="muted">START</p><strong>${esc(p.start)}</strong></div><span class="rung-arrow" aria-hidden="true">→</span><div><p class="muted">TARGET</p><strong>${esc(p.target)}</strong></div></div><div class="row rung-progress"><span class="pill">${s.chain.length-1} ${s.chain.length===2?'step':'steps'}</span><p class="muted">Shortest route: <strong>${shortestSteps(p)}</strong> steps</p></div><ol class="rung-chain" aria-label="Your word ladder">${s.chain.map((word,i)=>`<li><span class="rung-number">${i}</span><div class="rung-letters" aria-label="${esc(word)}${i?`, ${esc(changeLabel(word,s.chain[i-1]))}`:''}">${tiles(word,s.chain[i-1])}</div>${i===s.chain.length-1?'<span class="rung-current">current</span>':''}${i?`<span class="rung-change">${esc(changeLabel(word,s.chain[i-1]))}</span>`:''}</li>`).join('')}</ol>${!finished?`<form id="rung-form"><label class="muted" for="rung-word">Change one letter in ${esc(current)}</label><input class="word-input" id="rung-word" type="text" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done"><div class="actions"><button class="button" type="button" id="rung-undo" ${s.chain.length>1?'':'disabled'}>Undo rung</button><button class="button" type="button" id="rung-restart" ${s.chain.length>1?'':'disabled'}>Restart ladder</button><button class="button primary" type="submit">Add rung</button></div></form>`:''}${s.hintWord?`<p class="clue rung-hint">Your next step could be <strong>${esc(s.hintWord)}</strong>.</p>`:''}</section>${route?`<section class="panel"><h2>A shortest route</h2><p class="rung-route">${route.map(esc).join(' → ')}</p></section>`:''}`;
  if(finished)return;
  const input=root.querySelector('#rung-word');
  root.querySelector('#rung-form').addEventListener('submit',event=>{event.preventDefault();const focus=input===document.activeElement;const result=submitWord(p,s,input.value);if(result.state===s){announce(result.message);return;}commit(result.state,result.message);if(focus)root.querySelector('#rung-word')?.focus({preventScroll:true});});
  root.querySelector('#rung-undo').addEventListener('click',()=>commit(undo(p,s),'Last rung removed.'));
  root.querySelector('#rung-restart').addEventListener('click',()=>commit(restart(p,s),'Back at the start. Your hint count is retained.'));
 }
});
