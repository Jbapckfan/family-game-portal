import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,analyze,chooseRow,setTyped,submitWord,hint,reveal} from './engine.mjs';

mountDailyGame({
 id:'claude-dovetail',name:'Dovetail',creator:'Claude',credit:'Developed by Claude',accent:'#a37149',
 intro:'Make every word meet its neighbor. One satisfying join at a time.',
 hintLabel:'Reveal a letter · costs 1 miss',puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 instructions:[
  'The top and bottom words are given. Fill the missing rows so each word, joined to the word below it, spells another word.',
  'The letter boxes show the required length. Tap any unfinished row, then type your word and choose Fit word.',
  'A join can be a compound, such as BOOK + WORM, or a spelling split, such as CAR + PET. Only the letters matter.',
  'The puzzle has a prepared chain. An alternative also counts when both neighbors are already placed and both joined words are in the supplied word list.',
  'Six misses end the round. Repeating a wrong guess or entering a word outside the supplied list costs nothing. Arrows on a past guess show which known neighbor it fitted.',
  'Reveal a letter gives the next letter in the selected row and costs one miss. The sixth miss ends the round, including when it comes from a hint.'
 ],
 summarize:(p,s)=>{const a=analyze(p,s),hints=a.hints.reduce((n,v)=>n+v,0);return `${a.solved.filter(Boolean).length-2} of ${p.words.length-2} missing words placed · ${a.misses} of 6 misses used${hints?` (${hints} from letter hints)`:''}${s.revealed?' · chain revealed':''}.`;},
 render({root,puzzle:p,state:s,commit,announce}){
  const a=analyze(p,s),status=getStatus(p,s),finished=status!=='playing',showAll=status==='lost'||status==='revealed',missing=p.words.length-2;
  root.innerHTML=`<section class="panel dovetail-panel"><div class="row dovetail-progress"><strong>${a.solved.filter(Boolean).length-2} / ${missing} words placed</strong><span class="pill" aria-label="${6-a.misses} misses remaining">${'●'.repeat(6-a.misses)}${'○'.repeat(a.misses)}</span></div><p class="muted dovetail-note">Join each word to the next. Top and bottom are given.</p><div class="dovetail-board">${p.words.map((word,row)=>{const visible=a.solved[row]||showAll,given=row===0||row===p.words.length-1,active=row===s.active&&!finished,display=visible?a.words[row]:active?s.typed:word.slice(0,a.hints[row]);let html=`<div class="dovetail-row-wrap"><button type="button" class="dovetail-row ${given?'given':a.solved[row]?'solved':showAll?'revealed':'open'} ${active?'active':''}" data-row="${row}" ${visible?'disabled':''} aria-label="Row ${row+1}, ${word.length} letters${given?`, given ${a.words[row].toUpperCase()}`:a.solved[row]?`, solved ${a.words[row].toUpperCase()}`:showAll?`, revealed ${a.words[row].toUpperCase()}`:', unfinished'}"><span class="dovetail-row-number" aria-hidden="true">${row+1}</span><span class="dovetail-letters">${Array.from({length:word.length},(_,i)=>`<span class="dovetail-letter ${!visible&&i<a.hints[row]?'hinted':''}">${display[i]?esc(display[i].toUpperCase()):''}</span>`).join('')}</span><span class="dovetail-row-size" aria-hidden="true">${word.length}</span></button>${!visible&&a.guesses[row].length?`<div class="dovetail-guesses" aria-label="Past guesses for row ${row+1}">${a.guesses[row].map(g=>`<span class="${g.up||g.down?'fits':''}" aria-label="${esc(g.word)}, ${g.up?'fits above':''} ${g.down?'fits below':''}${!g.up&&!g.down?'no known join fits':''}">${g.up?'↑ ':''}${esc(g.word.toUpperCase())}${g.down?' ↓':''}</span>`).join('')}</div>`:''}</div>`;if(row<p.words.length-1&&(a.solved[row]||showAll)&&(a.solved[row+1]||showAll))html+=`<div class="dovetail-join" aria-label="Joined word ${esc(a.words[row]+a.words[row+1])}">${esc(a.words[row]+a.words[row+1])}</div>`;return html;}).join('')}</div>${finished?'':`<form id="dovetail-form"><label for="dovetail-entry">Row ${s.active+1} · ${p.words[s.active].length} letters</label><input id="dovetail-entry" class="word-input" type="text" value="${esc(s.typed.toUpperCase())}" maxlength="${p.words[s.active].length}" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done"><div class="actions"><button class="button" type="button" id="dovetail-clear">Clear</button><button class="button primary" type="submit" ${s.typed.length===p.words[s.active].length?'':'disabled'}>Fit word</button></div></form><p class="dovetail-hint-cost">${6-a.misses} ${6-a.misses===1?'miss':'misses'} remaining. A letter hint costs one miss.</p>`}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-row]').forEach(button=>button.addEventListener('click',()=>{commit(chooseRow(p,s,Number(button.dataset.row)),'');root.querySelector('#dovetail-entry')?.focus({preventScroll:false});}));
  root.querySelector('#dovetail-entry').addEventListener('input',event=>{
   const source=event.target,raw=source.value,sanitize=value=>value.toLowerCase().replace(/[^a-z]/g,''),value=sanitize(raw);
   const start=sanitize(raw.slice(0,source.selectionStart??raw.length)).length,end=sanitize(raw.slice(0,source.selectionEnd??raw.length)).length,direction=source.selectionDirection??'none';
   const result=setTyped(p,s,value);if(!result.state){source.value=s.typed.toUpperCase();source.setSelectionRange(Math.min(start,source.value.length),Math.min(end,source.value.length),direction);announce(result.message);return;}
   commit(result.state,'');const input=root.querySelector('#dovetail-entry');input?.focus({preventScroll:true});input?.setSelectionRange(start,end,direction);
  });
  root.querySelector('#dovetail-form').addEventListener('submit',event=>{event.preventDefault();const result=submitWord(p,s);if(result.state===s){announce(result.message);return;}const focused=document.activeElement?.id==='dovetail-entry';commit(result.state,result.message);if(focused)root.querySelector('#dovetail-entry')?.focus({preventScroll:true});});
  root.querySelector('#dovetail-clear').addEventListener('click',()=>commit({...s,typed:p.words[s.active].slice(0,a.hints[s.active])},'Unhinted letters cleared.'));
 }
});
