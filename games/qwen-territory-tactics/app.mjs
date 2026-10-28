import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
mountDailyGame({
  id:'qwen-territory-tactics',name:'Territory Tactics',creator:'Qwen',credit:'Concept by Qwen · Built by ChatGPT',accent:'#356f58',
  intro:'Two moves. One opening. Make the capture count.',
  instructions:[
    'Capture at least the number of amber enemy stones shown in the capture goal, using no more than two blue placements. This is a prepared position puzzle; there is no opposing player taking turns.',
    'Tap an empty hex to place a blue stone. Stones of the same side that touch form a connected group.',
    'A group’s liberties are the empty hexes touching it. Close every liberty of an enemy group to capture and remove the whole group. Board edges do not count as liberties.',
    'You cannot place a stone that leaves its own group without a liberty, unless the move captures enemy stones and creates an opening.',
    'If two placements do not solve the position, use Undo or Restart to try another plan. There is no penalty or timer.',
    'A hint plays one move on a winning route. If your current route cannot finish within the move budget, the hint undoes one move so you can recover.'
  ],
  puzzles:PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
  render({root,puzzle:p,state:s,commit,announce}) {
    const board=E.simulate(p,s.moves),status=E.getStatus(p,s),finished=status!=='playing',all=E.cells(p);
    const note=s.lastHint==='undo'?'The previous route could not finish in time. One move was undone.':s.lastHint==='move'?'A hint placed the next stone on a winning route.':s.moves.length===p.maxMoves&&!finished?'Two moves used. Undo or restart to investigate another route.':'Study the empty hexes touching the amber group.';
    root.innerHTML=`<section class="panel territory-panel">
      <div class="territory-objective"><div><span class="territory-label">Capture goal</span><strong>${board.captured}<small> / ${p.target} stones</small></strong></div><div><span class="territory-label">Placements</span><strong>${s.moves.length}<small> / ${p.maxMoves} used</small></strong></div></div>
      <div class="territory-legend"><span><i class="stone friendly"></i> Your stones</span><span><i class="stone enemy"></i> Enemy group</span></div>
      <div class="territory-board" role="group" aria-label="Hex position, five staggered rows">
        ${all.map(key=>{const [q,r]=key.split(',').map(Number),row=all.filter(k=>Number(k.split(',')[1])===r),column=row.indexOf(key)+1,friendly=board.friendly.includes(key),enemy=board.enemy.includes(key),move=s.moves.indexOf(key),kind=friendly?'friendly':enemy?'enemy':'empty';const x=50+Math.sqrt(3)*(q+r/2)/8.66*100,y=50+1.5*r/8*100;return `<button id="territory-hex-${r+3}-${column}" type="button" class="territory-hex ${kind} ${move>=0?'placed':''}" style="left:${x.toFixed(4)}%;top:${y.toFixed(4)}%" data-hex="${esc(key)}" aria-label="Row ${r+3}, column ${column}: ${friendly?'your stone':enemy?'enemy stone':'empty hex'}${move>=0?`, placement ${move+1}`:''}" ${friendly||enemy||finished||s.moves.length===p.maxMoves?'disabled':''}><span class="hex-inner">${friendly?`<i class="stone friendly"></i>${move>=0?`<b>${move+1}</b>`:''}`:enemy?'<i class="stone enemy"></i>':'<span class="hex-plus">+</span>'}</span></button>`;}).join('')}
      </div>
      <p class="territory-note">${finished?(status==='won'?`${board.captured} stones captured. The group is surrounded.`:'A winning route is shown.'):esc(note)}</p>
      <div class="actions"><button id="territory-undo" type="button" class="button" data-action="undo" ${!s.moves.length||finished?'disabled':''}>Undo placement</button><button id="territory-restart" type="button" class="button" data-action="restart" ${!s.moves.length||finished?'disabled':''}>Restart position</button></div>
      <p class="muted territory-footer">${s.hints} hint${s.hints===1?'':'s'} used · unlimited retries · no time limit</p>
    </section>`;
    for(const button of root.querySelectorAll('[data-hex]'))button.onclick=()=>{
      const result=E.place(p,s,button.dataset.hex);if(result.state===s){announce(result.message);return;}
      commit(result.state,result.message);
      if(result.state.moves.length===p.maxMoves&&E.getStatus(p,result.state)==='playing')root.querySelector('#territory-undo')?.focus({preventScroll:true});
    };
    root.querySelector('[data-action="undo"]').onclick=()=>commit(E.undo(p,s),'Last placement removed.');
    root.querySelector('[data-action="restart"]').onclick=()=>commit(E.restart(p,s),'The original position is ready.');
  }
});
