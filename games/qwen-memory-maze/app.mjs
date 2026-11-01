import {mountDailyGame} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,startStudy,chooseCell,tick,hint,reveal,STUDY_MS,scoreSeconds} from './engine.mjs';
let lastRound='',lastPhase='';

mountDailyGame({
 assistanceCount:(p,s)=>s.replays,
 id:'qwen-memory-maze',name:'Memory Maze',creator:'Qwen',credit:'Concept by Qwen · Built by ChatGPT',accent:'#087c99',
 intro:'See the route. Hold it in your mind. Bring it back, one square at a time.',
 instructions:[
  'Choose Study the route. A numbered path appears for six seconds on the 7 × 7 grid. Remember the order, including every turn.',
  'When the route disappears, tap its squares in order, beginning at S. Each next square shares a side with the previous square. The diamond marks the finish.',
  'Blocked squares appear only after study. They never block the route you need to retrace.',
  'A wrong tap adds two seconds to your result, but keeps every correct square you have already retraced. There is no limit on mistakes.',
  'A little hint replays the route for six seconds, preserving your progress and marking the result assisted. Study and recall timing pause while the app is hidden or a help dialog is open.'
 ],puzzles:PUZZLES,createState,restoreState,getStatus,hint,reveal,tick,
 summarize:(p,s)=>`${s.revealed?`${s.trail.length} of ${p.path.length} squares retraced · route revealed`:`${p.path.length} squares remembered · ${scoreSeconds(s)} seconds including penalties`}${s.mistakes?` · ${s.mistakes} ${s.mistakes===1?'miss':'misses'}`:' · no misses'}${s.replays?` · ${s.replays} ${s.replays===1?'assisted replay':'assisted replays'}`:''}.`,
 render({root,puzzle:p,state:s,mode,commit,announce}){
  const activeCell=root.contains(document.activeElement)?document.activeElement?.dataset?.cell:null;
  const round=`${p.id}:${mode}`,studyEnded=lastRound===round&&lastPhase==='study'&&s.phase==='recall';
  lastRound=round;lastPhase=s.phase;
  const status=getStatus(p,s),finished=status!=='playing',showPath=s.phase==='study'||s.revealed,showObstacles=s.phase==='recall'||finished;
  const title=s.revealed?'The complete route':status==='won'?'Route remembered':s.phase==='ready'?'Ready to remember?':s.phase==='study'?`Study · ${Math.ceil(s.remainingMs/1000)} seconds`:'Retrace the route';
  const subtitle=s.phase==='ready'?`${p.path.length} squares · six seconds to study`:s.phase==='study'?'Follow the numbers and notice each turn.':s.trail.length===0?'Begin at S, then tap the next remembered square.':finished?'Every route is a little story of turns.':`${s.trail.length} / ${p.path.length} squares · continue from ${s.trail.length}`;
  const visibleTrail=showPath?p.path:s.trail,points=visibleTrail.map(i=>`${i%7+.5},${Math.floor(i/7)+.5}`).join(' ');
  root.innerHTML=`<section class="panel maze-panel"><div class="maze-phase"><h2>${title}</h2><p>${subtitle}</p></div>${s.phase==='study'?`<div class="maze-study-track" role="progressbar" aria-label="Study time remaining" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${Math.ceil(s.remainingMs/1000)}"><span style="width:${100*s.remainingMs/STUDY_MS}%"></span></div>`:'<div class="maze-study-spacer"></div>'}<div class="maze-board-wrap"><svg class="maze-trail" viewBox="0 0 7 7" aria-hidden="true" focusable="false"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width=".14" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="maze-grid" role="group" aria-label="Seven by seven memory maze">${Array.from({length:49},(_,index)=>{const pathIndex=p.path.indexOf(index),correct=s.trail.includes(index),visible=showPath&&pathIndex>=0,blocked=showObstacles&&p.obstacles.includes(index),start=index===p.path[0],goal=index===p.path.at(-1),wrong=s.lastWrong===index;const symbol=visible?pathIndex+1:correct?s.trail.indexOf(index)+1:blocked?'×':start?'S':goal?'◇':'';const label=`Row ${Math.floor(index/7)+1}, column ${index%7+1}${visible?`, route square ${pathIndex+1}`:correct?`, retraced square ${s.trail.indexOf(index)+1}`:blocked?', blocked':start?', start':goal?', finish':''}${wrong?', incorrect tap':''}`;return `<button type="button" class="maze-cell ${visible?'shown':''} ${correct?'retraced':''} ${blocked?'blocked':''} ${start?'start':''} ${goal?'goal':''} ${wrong?'wrong':''}" data-cell="${index}" aria-label="${label}" ${s.phase!=='recall'||finished||blocked?'disabled':''}>${symbol}</button>`;}).join('')}</div></div>${s.phase==='ready'?'<button type="button" class="button primary maze-start" id="maze-start">Study the route</button>':''}<div class="maze-score" aria-label="Round score"><div><strong>${scoreSeconds(s)}s</strong><span>time + penalties</span></div><div><strong>${s.mistakes}</strong><span>misses · +2s each</span></div><div><strong>${s.replays}</strong><span>hint replays</span></div></div>${s.phase==='recall'&&!finished?'<p class="maze-reassurance">A miss keeps your correct trail. Arrow keys move focus; Enter chooses. Need another look? Use A little hint below.</p>':''}${s.phase==='study'&&s.replays?'<p class="maze-reassurance">Assisted replay. Your correct trail and recall time are paused.</p>':''}</section>`;
  if(finished)return;
  if(s.phase==='ready')root.querySelector('#maze-start').addEventListener('click',()=>commit(startStudy(p,s),'Study the numbered route. When it disappears, begin at S.'));
  if(s.phase==='recall')root.querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('click',()=>{const result=chooseCell(p,s,Number(button.dataset.cell));if(result.state===s){announce(result.message);return;}commit(result.state,result.message);}));
  if(s.phase==='recall')root.querySelectorAll('[data-cell]').forEach(button=>button.addEventListener('keydown',event=>{
   if(event.ctrlKey||event.altKey||event.metaKey)return;
   const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
   if(delta===undefined)return;
   event.preventDefault();const from=Number(button.dataset.cell);
   for(let next=from+delta;next>=0&&next<49;next+=delta){
    if(Math.abs(delta)===1&&Math.floor(next/7)!==Math.floor(from/7))break;
    const target=root.querySelector(`[data-cell="${next}"]`);
    if(target&&!target.disabled){target.focus({preventScroll:true});break;}
   }
  }));
  if(activeCell!==null)root.querySelector(`[data-cell="${activeCell}"]`)?.focus({preventScroll:true});
  if(studyEnded){
   const resume=s.trail.at(-1)??p.path[0];root.querySelector(`[data-cell="${resume}"]`)?.focus({preventScroll:true});
   announce(s.trail.length?'Study complete. Continue from your numbered trail.':'Study complete. Begin at S, then retrace the route.');
  }
 }
});
