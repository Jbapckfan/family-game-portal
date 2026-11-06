import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {EXACT_PUZZLES,EXACT_EDITION} from './exact-puzzles.mjs';
import * as E from './engine.mjs';

const guideVisibility=new WeakMap(),boardScroll=new WeakMap();
function captureExample(after=false){
 const hex=(x,y)=>`<path d="M${x} ${y-15}l13 7.5v15L${x} ${y+15}l-13-7.5v-15Z" fill="#f8fcff" stroke="#b5cddd" stroke-width="1"/>`;
 const adjacent=[[76,48],[62,72],[34,72],[20,48],[34,24],[62,24]];
 return `<svg viewBox="0 0 96 96" aria-hidden="true" class="territory-example-board">${hex(48,48)}${adjacent.map(([x,y],i)=>hex(x,y)+(!after&&i===0?`<path d="M${x-4} ${y}h8m-4-4v8" stroke="#247a9e" stroke-width="2"/>`:`<circle cx="${x}" cy="${y}" r="8" fill="#2e7898"/>`)).join('')}${after?'':`<rect x="41" y="41" width="14" height="14" rx="2" fill="#e5b83f" stroke="#bc9125" transform="rotate(45 48 48)"/>`}</svg>`;
}

mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
  id:'qwen-territory-tactics',name:'Territory Tactics',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
  stateEdition:EXACT_EDITION,practiceReservedDays:186,
  intro:'A larger board. Three placements. One exact capture total.',
  instructions:[
    'Capture EXACTLY the number of amber stones shown, using up to three new blue stones on a 37-hex board. The blue stones already on the board help you and do not use up your placements. There is no opposing turn.',
    'Amber stones whose hexes share a side form a group. Every empty hex touching any stone in that group is an opening. A group may have more than one opening.',
    'Tap an empty hex to add a blue stone. If that closes the last opening around an amber group, every stone in the group is removed and added to your captured total.',
    'For example, if an amber group has two empty neighboring hexes, fill both to capture it. If it has one, only the last empty hex needs filling. The edge of the board is already closed.',
    'Count your total across all groups: a smaller capture may not be enough, and a larger capture overshoots. You may need to capture more than one group. Your own blue group must also have an empty neighboring hex after any captures.',
    'If you capture too many stones or use all three placements without the exact total, Undo a placement or Restart and try another route. Both are free, and there is no timer.',
    'Hint places one stone on a winning route. If your current route cannot finish within three placements, a hint undoes one move so you can recover.'
  ],
  puzzles:EXACT_PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
  render({root,puzzle:p,state:s,commit,announce}) {
    const board=E.simulate(p,s.moves),status=E.getStatus(p,s),finished=status!=='playing',all=E.cells(p);
    const over=E.overshot(p,board.captured),left=p.maxMoves-s.moves.length,remaining=p.target-board.captured;
    const note=s.lastHint==='undo'?'That route could not finish with the exact total. One placement was undone.':s.lastHint==='move'?'A hint filled one opening on an exact winning route.':over?`${board.captured} captured — ${-remaining} too many. Undo a placement: your goal is exactly ${p.target}.`:!left&&!finished?`${board.captured} captured — ${remaining} more needed. No placements left. Undo or restart.`:s.moves.length?`${board.captured} captured. ${remaining} more needed, with ${left} placement${left===1?'':'s'} left.`:'Count the amber stones in each group. Which openings give you the exact total?';
    root.innerHTML=`<section class="panel territory-panel">
      <p class="territory-edition">Expanded board · exact target</p>
      <div class="territory-objective"><div><span class="territory-label">Capture EXACTLY ${p.target}</span><strong>${board.captured}<small> / ${p.target} captured</small></strong></div><div><span class="territory-label">New stones used</span><strong>${s.moves.length}<small> / ${p.maxMoves} used</small></strong></div></div>
      <p class="territory-task">Use up to <strong>${p.maxMoves} new blue stones</strong> to capture <strong>EXACTLY ${p.target} amber stones</strong>. Too few or too many will not solve it.</p>
      <details class="territory-guide" id="territory-guide" ${guideVisibility.get(root)===false?'':'open'}><summary>How to capture a group</summary><div class="territory-guide-content"><ol>
        <li><strong>Find a group.</strong> Amber stones whose hexes share a side belong together.</li>
        <li><strong>Find its openings.</strong> Look for every empty hex sharing a side with that group.</li>
        <li><strong>Fill the openings.</strong> Add blue stones. When no openings remain, the whole amber group disappears.</li>
      </ol><figure class="territory-capture-example"><div><div>${captureExample(false)}<span>One opening</span></div><b aria-hidden="true">→</b><div>${captureExample(true)}<span>Fill it: capture</span></div></div><figcaption>A one-stone example. The same rule applies to a connected group.</figcaption></figure></div><p class="territory-guide-note">Board edges are already closed. Existing blue stones help. No opponent takes a turn. Count every group you capture: the total must be exact.</p></details>
      <div class="territory-legend"><span><i class="stone friendly"></i> Your stones</span><span><i class="stone enemy"></i> Amber targets</span></div>
      <p class="territory-board-help" id="territory-board-help">37 hexes · 7 rows. On a small screen, swipe the board sideways. Keyboard: Tab to a hex, Enter or Space to place.</p>
      <div class="territory-board-viewport" tabindex="0" role="region" aria-label="Scrollable hex board" aria-describedby="territory-board-help"><div class="territory-board" role="group" aria-label="Hex position, seven staggered rows">
        ${all.map(key=>{const [q,r]=key.split(',').map(Number),row=all.filter(k=>Number(k.split(',')[1])===r),column=row.indexOf(key)+1,friendly=board.friendly.includes(key),enemy=board.enemy.includes(key),move=s.moves.indexOf(key),kind=friendly?'friendly':enemy?'enemy':'empty';const x=50+(q+r/2)/(2*p.radius+1)*100,y=50+1.5*r/(3*p.radius+2)*100;return `<button id="territory-hex-${r+p.radius+1}-${column}" type="button" class="territory-hex ${kind} ${move>=0?'placed':''}" style="left:${x.toFixed(4)}%;top:${y.toFixed(4)}%" data-hex="${esc(key)}" aria-label="Row ${r+p.radius+1}, column ${column}: ${friendly?'your stone':enemy?'enemy stone':'empty hex'}${move>=0?`, placement ${move+1}`:''}" ${friendly||enemy||finished||over||s.moves.length===p.maxMoves?'disabled':''}><span class="hex-inner">${friendly?`<i class="stone friendly"></i>${move>=0?`<b>${move+1}</b>`:''}`:enemy?'<i class="stone enemy"></i>':'<span class="hex-plus">+</span>'}</span></button>`;}).join('')}
      </div></div>
      <p class="territory-note" role="status">${finished?(status==='won'?`Exactly ${board.captured} stones captured. Every captured group had no openings left.`:'An exact winning route is shown.'):esc(note)}</p>
      <div class="actions"><button id="territory-undo" type="button" class="button" data-action="undo" ${!s.moves.length||finished?'disabled':''}>Undo placement</button><button id="territory-restart" type="button" class="button" data-action="restart" ${!s.moves.length||finished?'disabled':''}>Restart position</button></div>
      <p class="muted territory-footer">${s.hints} hint${s.hints===1?'':'s'} used · unlimited retries · no time limit</p>
      <p class="territory-history">This expanded edition starts a fresh position. Earlier saves and daily results are kept; each calendar day counts once in your stats.</p>
    </section>`;
    const viewport=root.querySelector('.territory-board-viewport');
    viewport.scrollLeft=boardScroll.get(root)??Math.max(0,(viewport.scrollWidth-viewport.clientWidth)/2);
    viewport.addEventListener('scroll',()=>boardScroll.set(root,viewport.scrollLeft),{passive:true});
    root.querySelector('#territory-guide').addEventListener('toggle',event=>guideVisibility.set(root,event.currentTarget.open));
    for(const button of root.querySelectorAll('[data-hex]'))button.onclick=()=>{
      const result=E.place(p,s,button.dataset.hex);if(result.state===s){announce(result.message);return;}
      commit(result.state,result.message);
      if((result.state.moves.length===p.maxMoves||E.overshot(p,E.simulate(p,result.state.moves).captured))&&E.getStatus(p,result.state)==='playing')root.querySelector('#territory-undo')?.focus({preventScroll:true});
    };
    root.querySelector('[data-action="undo"]').onclick=()=>commit(E.undo(p,s),'Last placement removed.');
    root.querySelector('[data-action="restart"]').onclick=()=>commit(E.restart(p,s),'The original position is ready.');
  }
});
