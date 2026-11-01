import {assistanceCount} from './engine.mjs';
import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
mountDailyGame({
 assistanceCount,
 id:'claude-tangle',name:'Tangle',creator:'Claude',credit:'Developed by Claude',accent:'#2b7194',
 intro:'Three words, woven together. Find the loose ends.',hintLabel:'Loose end · 1 knot',
 instructions:[
  'These are the rules for new rounds. A restored saved round keeps its earlier word rules; new Practice rounds use the expanded game dictionary.',
  'New rounds accept any three valid words with the displayed thread lengths that use every bead. Each word reads left to right by bead number. Saved classic rounds keep their original three threads.',
  'Tap the beads of a word in any order. Your selection is always read from left to right through the numbered beads, then continues on the next row.',
  'A valid word ties one knot only when none of its available bead placements leaves a complete partition. If other copies work, try those letters again with no knot. Its beads stay available. Words outside the game dictionary, wrong lengths and repeated failed words cost nothing.',
  'Four knots end the round. A loose-end hint marks the starting bead of one possible longest remaining thread and costs one knot. Repeating the same hint costs nothing.',
  'Duplicate letters are separate beads. Undo pull and Restart beads restore accepted pulls while keeping all knots and hints. In a saved classic round, a recovery hint can undo a blocked pull without another knot.',
  'Backspace removes the last selected bead; Enter pulls your word; Escape clears it. You can also type letters to choose the next matching bead, or use Tab and Space for a specific copy.'
 ],
 puzzles:PUZZLES,createState:E.createExpandedState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
 render({root,puzzle:p,state:s,commit,announce}){
  const v=E.view(p,s),status=E.getStatus(p,s),finished=status!=='playing',word=E.selectedWord(p,s),blocked=!finished&&!E.allocation(p,v),continuation=finished?E.allocation(p,v):null;
  const focused=root.contains(document.activeElement)?document.activeElement.id:null;
  root.tabIndex=-1;
  root.innerHTML=`<section class="panel tangle-panel">
   <div class="tangle-hud"><span>${v.pulls.length} of 3 threads pulled</span><div class="tangle-knots" aria-label="${v.knots} of 4 knots used">${[0,1,2,3].map(i=>`<span class="${i<v.knots?'tied':''}" aria-hidden="true">${i<v.knots?'×':'○'}</span>`).join('')}<b>${4-v.knots} left</b></div></div>
   <div class="tangle-threads">${p.w.map((w,j)=>{const done=v.pulls.some(x=>x.target===j),shown=done||finished,pulled=v.pulls.find(x=>x.target===j),solution=continuation,shownWord=pulled?.word??(solution?.[j]?.length?solution[j].map(i=>p.s[i]).join(''):w);return `<div class="tangle-thread thread-${j} ${done?'done':''}"><span class="thread-label">Thread ${j+1} · ${w.length} letters</span>${shown?`<strong>${esc(shownWord.toUpperCase())}</strong>`:`<span class="thread-ghost" aria-label="Hidden ${w.length}-letter word">${[...w].map(()=>'<i></i>').join('')}</span>`}${done?'<span class="thread-check">✓ Pulled</span>':''}</div>`;}).join('')}</div>
   <div class="tangle-beads" role="group" aria-label="Letter beads, read across each row in numbered order">${[...p.s].map((letter,i)=>{const removed=v.removed.includes(i),hint=v.hints.find(h=>h.index===i&&!v.pulls.some(x=>x.target===h.target));return removed?`<span class="tangle-bead removed" aria-label="Bead ${i+1} pulled"><small>${i+1}</small><span>·</span></span>`:`<button id="tangle-bead-${i}" type="button" class="tangle-bead ${s.selected.includes(i)?'selected':''} ${hint?'hinted':''}" data-bead="${i}" aria-pressed="${s.selected.includes(i)}" aria-label="Bead ${i+1}, ${letter.toUpperCase()}${hint?`, starts one possible thread ${hint.target+1}`:''}" ${finished?'disabled':''}><small>${i+1}</small><span>${letter.toUpperCase()}</span>${hint?'<b aria-hidden="true">★</b>':''}</button>`;}).join('')}</div>
   <div class="tangle-selection" aria-label="Selected word" aria-live="polite">${word?esc(word.toUpperCase()):'<span>Choose the beads of one word</span>'}</div>
   <p id="tangle-selection-detail" class="muted tangle-selection-detail">${s.selected.length?`Beads in reading order: ${[...s.selected].sort((a,b)=>a-b).map(i=>i+1).join(' → ')}`:'Select any copies; words are read by bead number.'}</p>
   <div class="actions tangle-actions"><button id="tangle-back" class="button" type="button" aria-label="${s.selected.length?`Back: remove last selected bead ${s.selected.at(-1)+1}`:'Back: no bead selected'}" data-action="back" ${!s.selected.length||finished?'disabled':''}>Back</button><button id="tangle-clear" class="button" type="button" data-action="clear" ${!s.selected.length||finished?'disabled':''}>Clear</button><button id="tangle-pull" class="button primary" type="button" data-action="pull" ${!word||finished?'disabled':''}>Pull thread</button></div>
   ${blocked?'<p class="tangle-note blocked">These bead copies block another thread. Undo your last pull to try different copies.</p>':s.events.at(-1)?.type==='recover'?'<p class="tangle-note">A blocked pull was undone. No extra knot was charged.</p>':`<p class="tangle-note">${s.vocabulary===2?'Any three valid words must fit the shown lengths and use every bead. A pull must leave a complete continuation.':'This saved round keeps earlier word rules. New Practice rounds use the expanded game dictionary.'} Letters keep their order; duplicate beads are separate copies.</p>`}
   <div class="actions tangle-recovery"><button id="tangle-undo-pull" class="button subtle" type="button" data-action="undo" ${!v.pulls.length||finished?'disabled':''}>Undo pull</button><button id="tangle-restart" class="button subtle" type="button" data-action="restart" ${!v.pulls.length||finished?'disabled':''}>Restart beads</button></div>
   <p class="muted tangle-footer">${v.assists} hints · knots stay after undo and restart${v.knots===3&&!finished?' · another knot ends the round':''}</p>
  </section>`;
  function action(fn,...args){const result=fn(p,s,...args),next=result?.state||result;if(!next||next===s)announce(result?.message||'');else commit(next,result?.message);}
  for(const b of root.querySelectorAll('[data-bead]'))b.onclick=()=>action(E.toggle,Number(b.dataset.bead));
  const actions={back:E.backspace,clear:E.clear,pull:E.submit,undo:E.undoPull,restart:E.restart};
  for(const b of root.querySelectorAll('[data-action]'))b.onclick=()=>action(actions[b.dataset.action]);
  root.onkeydown=event=>{
   if(finished||event.ctrlKey||event.altKey||event.metaKey)return;
   if(event.key==='Backspace'){event.preventDefault();action(E.backspace);}
   else if(event.key==='Escape'){event.preventDefault();action(E.clear);}
   else if(event.key==='Enter'&&(event.target===root||event.target.hasAttribute('data-bead'))){event.preventDefault();action(E.submit);}
   else if(/^[a-zA-Z]$/.test(event.key)){event.preventDefault();const after=s.selected.length?Math.max(...s.selected):-1;const i=[...p.s].findIndex((letter,i)=>i>after&&letter===event.key.toLowerCase()&&!v.removed.includes(i)&&!s.selected.includes(i));if(i>=0)action(E.toggle,i);else announce('No matching bead follows this selection. Clear or choose a specific bead with Tab and Space.');}
  };
  const replacement=focused&&root.querySelector(`#${focused}`);if(replacement&&!replacement.disabled)replacement.focus({preventScroll:true});else if(focused&&!finished)root.focus({preventScroll:true});
 }
});
