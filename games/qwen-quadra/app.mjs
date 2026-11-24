import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,chooseTile,selectWord,submitWord,hint,reveal,analyze} from './engine.mjs';

mountDailyGame({
 id:'qwen-quadra',name:'Quadra',creator:'Qwen',credit:'Developed by Qwen',accent:'#594ab5',
 intro:'One category. Sixteen letters. Four words waiting to click.',
 instructions:[
  'Find today’s four 4-letter words in the displayed category. Together they use all 16 letter tiles exactly once.',
  'Tap letters in word order, or type a word. Choose Lock word to submit. Duplicate letters are separate tiles.',
  'Correct words lock their tiles. Four incorrect submissions end the round. A valid English word may still be outside today’s four selected answers.',
  'A little hint selects one complete answer for you to submit and marks the result assisted. Daily play and practice use separate progress.'
 ],puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 summarize:(p,s)=>{const a=analyze(p,s);return `${a.found.length} of 4 words found · ${a.mistakes} ${a.mistakes===1?'miss':'misses'}${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'hint':'hints'}`:''}${s.revealed?' · solution revealed':''}.`;},
 render({root,puzzle:p,state:s,commit,announce}){
  const a=analyze(p,s),status=getStatus(p,s),finished=status!=='playing',showAnswers=status==='lost'||status==='revealed';
  const foundWords=a.found.map(f=>f.word),display=showAnswers?[...foundWords,...p.answers.filter(w=>!foundWords.includes(w))]:foundWords;
  const currentWord=s.selected.map(i=>p.tiles[i]).join(''),hintWord=s.hinted.find(w=>!foundWords.includes(w));
  root.innerHTML=`<section class="panel quadra-category"><p class="muted">TODAY’S CATEGORY</p><h2>${esc(p.category)}</h2><div class="row"><span>${a.found.length} / 4 words found</span><span class="pill" aria-label="${4-a.mistakes} ${4-a.mistakes===1?'chance':'chances'} remaining">${'●'.repeat(4-a.mistakes)}${'○'.repeat(a.mistakes)} · ${4-a.mistakes} left</span></div></section><section class="panel"><div class="quadra-found" aria-label="Found words">${Array.from({length:4},(_,i)=>`<div class="quadra-word ${display[i]?foundWords.includes(display[i])?'found':'shown':''}">${display[i]?esc(display[i]):'<span aria-label="Unsolved word">· · · ·</span>'}${display[i]&&!foundWords.includes(display[i])?'<small>revealed</small>':''}</div>`).join('')}</div><div class="tiles quadra-grid" aria-label="Sixteen letter tiles">${p.tiles.map((letter,index)=>`<button type="button" class="tile ${a.used.has(index)?'correct':''} ${s.selected.includes(index)?'selected':''}" data-tile="${index}" ${a.used.has(index)||finished?'disabled':''} aria-pressed="${s.selected.includes(index)}" aria-label="${letter}, tile ${index+1}${a.used.has(index)?', locked':s.selected.includes(index)?`, selected letter ${s.selected.indexOf(index)+1}`:''}">${letter}${s.selected.includes(index)?`<span class="quadra-order">${s.selected.indexOf(index)+1}</span>`:''}</button>`).join('')}</div>${finished?'':`<form id="quadra-form"><label class="quadra-input-label" for="quadra-word">Your four-letter word <span>${s.selected.length} / 4</span></label><input id="quadra-word" class="word-input" type="text" value="${esc(currentWord)}" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" aria-describedby="quadra-entry-note"><p id="quadra-entry-note" class="muted">Tap tiles in order, or type here.</p><div class="actions"><button type="button" class="button" id="quadra-delete" ${s.selected.length?'':'disabled'}>Delete</button><button type="button" class="button" id="quadra-clear" ${s.selected.length?'':'disabled'}>Clear</button><button type="submit" class="button primary" ${s.selected.length===4?'':'disabled'}>Lock word</button></div></form>${hintWord?`<p class="quadra-hint">Hint: <strong>${esc(hintWord)}</strong> is one of today’s four words.</p>`:''}`}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-tile]').forEach(button=>button.addEventListener('click',()=>{
   const index=Number(button.dataset.tile),next=chooseTile(p,s,index);
   if(next===s){announce('Clear or remove a letter before choosing another.');return;}
   commit(next,'');root.querySelector(`[data-tile="${index}"]`)?.focus({preventScroll:true});
  }));
  root.querySelector('#quadra-word').addEventListener('input',event=>{
   const value=event.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4),result=selectWord(p,s,value);
   if(!result.state){event.target.value=currentWord;announce(result.message);return;}
   commit(result.state,'');const input=root.querySelector('#quadra-word');input?.focus({preventScroll:true});input?.setSelectionRange(value.length,value.length);
  });
  root.querySelector('#quadra-form').addEventListener('submit',event=>{event.preventDefault();const focused=document.activeElement?.id==='quadra-word',result=submitWord(p,s);commit(result.state,result.message);if(focused)root.querySelector('#quadra-word')?.focus({preventScroll:true});});
  root.querySelector('#quadra-delete').addEventListener('click',()=>commit({...s,selected:s.selected.slice(0,-1)},''));
  root.querySelector('#quadra-clear').addEventListener('click',()=>commit({...s,selected:[]},'Selection cleared.'));
 }
});
