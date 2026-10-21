import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,chooseTile,submitPair,shuffle,hint,reveal} from './engine.mjs';
mountDailyGame({
 id:'deepseek-spare',name:'Spare',accent:'#9d4868',intro:'Four perfect opposites. One word without a partner. Find what belongs together.',
 puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,
 instructions:['The nine words contain four pairs with opposite meanings and one spare word.','Select two words, then choose Match pair. Correct pairs move above the board.','Three different wrong pairings end the round. Repeating a wrong pairing never costs another strike.','Find all four pairs to expose the spare and solve the puzzle. A little hint highlights one pair; it stays highlighted when you shuffle.'],
 summarize:(p,s)=>`${s.solved.length} of 4 pairs found · ${s.mistakes.length} ${s.mistakes.length===1?'miss':'misses'}${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'hint':'hints'}`:''}${getStatus(p,s)==='revealed'?' · solution revealed':''}. The spare was ${p.spare}.`,
 render({root,puzzle:p,state:s,commit,announce}){
  const status=getStatus(p,s),finished=status!=='playing',showAnswers=status==='lost'||status==='revealed',words=[...p.pairs.flat(),p.spare];
  const solved=showAnswers?[0,1,2,3]:s.solved;
  root.innerHTML=`<section class="panel"><div class="row spare-progress"><strong>${s.solved.length} / 4 pairs</strong><span class="pill" aria-label="${3-s.mistakes.length} chances remaining">${'●'.repeat(3-s.mistakes.length)}${'○'.repeat(s.mistakes.length)} · ${3-s.mistakes.length} left</span></div><p class="clue">${esc(p.prompt)}</p><div class="spare-solved" aria-label="Matched pairs">${solved.map(i=>`<div class="spare-pair ${s.solved.includes(i)?'found':'shown'}"><strong>${esc(p.pairs[i][0])}</strong><span aria-label="opposite">↔</span><strong>${esc(p.pairs[i][1])}</strong>${showAnswers&&!s.solved.includes(i)?'<small>revealed</small>':''}</div>`).join('')}</div>${finished?`<div class="spare-answer"><p class="muted">THE SPARE</p><strong>${esc(p.spare)}</strong><p class="muted">No opposite partner on this board.</p></div>`:`<div class="tiles spare-grid">${s.order.filter(i=>i===8||!s.solved.includes(Math.floor(i/2))).map(i=>`<button type="button" class="tile ${s.selected.includes(i)?'selected':''} ${s.hintPair!==null&&i<8&&Math.floor(i/2)===s.hintPair?'pair-hint':''}" data-word="${i}" aria-pressed="${s.selected.includes(i)}" aria-label="${esc(words[i])}${s.hintPair!==null&&i<8&&Math.floor(i/2)===s.hintPair?', hinted pair':''}">${esc(words[i])}</button>`).join('')}</div><div class="actions"><button class="button" id="spare-shuffle">Shuffle</button><button class="button" id="spare-clear" ${s.selected.length?'':'disabled'}>Clear</button><button class="button primary" id="spare-submit" ${s.selected.length===2?'':'disabled'}>Match pair</button></div>${s.hintPair!==null?'<p class="muted">The two outlined words are opposites.</p>':''}`}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-word]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.word),next=chooseTile(p,s,index);if(next===s){announce('Clear a word before selecting a third.');return;}commit(next,'');root.querySelector(`[data-word="${index}"]`)?.focus({preventScroll:true});}));
  root.querySelector('#spare-shuffle').addEventListener('click',()=>commit(shuffle(p,s),'Same words, a fresh arrangement.'));
  root.querySelector('#spare-clear').addEventListener('click',()=>commit({...s,selected:[]},'Selection cleared.'));
  root.querySelector('#spare-submit').addEventListener('click',()=>{const result=submitPair(p,s);commit(result.state,result.message);});
 }
});
