import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';

const guideVisibility=new WeakMap();
function captureExample(after=false){
 const hex=(x,y)=>`<path d="M${x} ${y-15}l13 7.5v15L${x} ${y+15}l-13-7.5v-15Z" fill="#f8fcff" stroke="#b5cddd" stroke-width="1"/>`;
 const adjacent=[[76,48],[62,72],[34,72],[20,48],[34,24],[62,24]];
 return `<svg viewBox="0 0 96 96" aria-hidden="true" class="territory-example-board">${hex(48,48)}${adjacent.map(([x,y],i)=>hex(x,y)+(!after&&i===0?`<path d="M${x-4} ${y}h8m-4-4v8" stroke="#247a9e" stroke-width="2"/>`:`<circle cx="${x}" cy="${y}" r="8" fill="#2e7898"/>`)).join('')}${after?'':`<rect x="41" y="41" width="14" height="14" rx="2" fill="#e5b83f" stroke="#bc9125" transform="rotate(45 48 48)"/>`}</svg>`;
}

mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
  id:'qwen-territory-tactics',name:'Territory Tactics',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
  intro:'Close the openings. Capture the amber stones.',
  instructions:[
    'Your goal is to capture at least the number of amber stones shown, using at most two new blue stones. The blue stones already on the board help you and do not use up your placements. There is no opposing turn.',
    'Amber stones whose hexes share a side form a group. Every empty hex touching any stone in that group is an opening. A group may have more than one opening.',
    'Tap an empty hex to add a blue stone. If that closes the last opening around an amber group, every stone in the group is removed and added to your captured total.',
    'For example, if an amber group has two empty neighboring hexes, fill both to capture it. If it has one, only the last empty hex needs filling. The edge of the board is already closed.',
    'Watch the capture goal: removing a smaller group might not capture enough stones. Your own blue group must also have an empty neighboring hex after any captures.',
    'If both placements are used without reaching the goal, Undo a placement or Restart and try another route. Both are free, and there is no timer.',
    'Hint places one stone on a winning route. If your current route cannot finish within two placements, a hint undoes one move so you can recover.'
  ],
  puzzles:PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
  render({root,puzzle:p,state:s,commit,announce}) {
    const board=E.simulate(p,s.moves),status=E.getStatus(p,s),finished=status!=='playing',all=E.cells(p);
    const note=s.lastHint==='undo'?'That route could not reach the goal within two placements. One placement was undone.':s.lastHint==='move'?'A hint filled one opening on a winning route.':s.moves.length===p.maxMoves&&!finished?`${board.captured} captured; ${p.target} needed. Undo or restart to try a different route.`:s.moves.length?`${p.maxMoves-s.moves.length} placement left. Close the remaining openings around your target group.`:'Find an amber group, then look for every empty hex touching it.';
    root.innerHTML=`<section class="panel territory-panel">
      <div class="territory-objective"><div><span class="territory-label">Captured / needed</span><strong>${board.captured}<small> / ${p.target} stones</small></strong></div><div><span class="territory-label">New stones used</span><strong>${s.moves.length}<small> / ${p.maxMoves} used</small></strong></div></div>
      <p class="territory-task">Use up to <strong>${p.maxMoves} new blue stones</strong> to capture <strong>${p.target} or more amber stones</strong>.</p>
      <details class="territory-guide" id="territory-guide" ${guideVisibility.get(root)===false?'':'open'}><summary>How to capture a group</summary><div class="territory-guide-content"><ol>
        <li><strong>Find a group.</strong> Amber stones whose hexes share a side belong together.</li>
        <li><strong>Find its openings.</strong> Look for every empty hex sharing a side with that group.</li>
        <li><strong>Fill the openings.</strong> Add blue stones. When no openings remain, the whole amber group disappears.</li>
      </ol><figure class="territory-capture-example"><div><div>${captureExample(false)}<span>One opening</span></div><b aria-hidden="true">→</b><div>${captureExample(true)}<span>Fill it: capture</span></div></div><figcaption>A one-stone example. The same rule applies to a connected group.</figcaption></figure></div><p class="territory-guide-note">Board edges are already closed. Existing blue stones help. No opponent takes a turn. A smaller capture may not reach your goal.</p></details>
      <div class="territory-legend"><span><i class="stone friendly"></i> Your stones</span><span><i class="stone enemy"></i> Amber targets</span></div>
      <div class="territory-board" role="group" aria-label="Hex position, five staggered rows">
        ${all.map(key=>{const [q,r]=key.split(',').map(Number),row=all.filter(k=>Number(k.split(',')[1])===r),column=row.indexOf(key)+1,friendly=board.friendly.includes(key),enemy=board.enemy.includes(key),move=s.moves.indexOf(key),kind=friendly?'friendly':enemy?'enemy':'empty';const x=50+Math.sqrt(3)*(q+r/2)/8.66*100,y=50+1.5*r/8*100;return `<button id="territory-hex-${r+3}-${column}" type="button" class="territory-hex ${kind} ${move>=0?'placed':''}" style="left:${x.toFixed(4)}%;top:${y.toFixed(4)}%" data-hex="${esc(key)}" aria-label="Row ${r+3}, column ${column}: ${friendly?'your stone':enemy?'enemy stone':'empty hex'}${move>=0?`, placement ${move+1}`:''}" ${friendly||enemy||finished||s.moves.length===p.maxMoves?'disabled':''}><span class="hex-inner">${friendly?`<i class="stone friendly"></i>${move>=0?`<b>${move+1}</b>`:''}`:enemy?'<i class="stone enemy"></i>':'<span class="hex-plus">+</span>'}</span></button>`;}).join('')}
      </div>
      <p class="territory-note">${finished?(status==='won'?`${board.captured} stones captured. The captured group had no openings left.`:'A winning route is shown.'):esc(note)}</p>
      <div class="actions"><button id="territory-undo" type="button" class="button" data-action="undo" ${!s.moves.length||finished?'disabled':''}>Undo placement</button><button id="territory-restart" type="button" class="button" data-action="restart" ${!s.moves.length||finished?'disabled':''}>Restart position</button></div>
      <p class="muted territory-footer">${s.hints} hint${s.hints===1?'':'s'} used · unlimited retries · no time limit</p>
    </section>`;
    root.querySelector('#territory-guide').addEventListener('toggle',event=>guideVisibility.set(root,event.currentTarget.open));
    for(const button of root.querySelectorAll('[data-hex]'))button.onclick=()=>{
      const result=E.place(p,s,button.dataset.hex);if(result.state===s){announce(result.message);return;}
      commit(result.state,result.message);
      if(result.state.moves.length===p.maxMoves&&E.getStatus(p,result.state)==='playing')root.querySelector('#territory-undo')?.focus({preventScroll:true});
    };
    root.querySelector('[data-action="undo"]').onclick=()=>commit(E.undo(p,s),'Last placement removed.');
    root.querySelector('[data-action="restart"]').onclick=()=>commit(E.restart(p,s),'The original position is ready.');
  }
});
