import { PUZZLES } from './puzzles.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';

const $ = id => document.getElementById(id);
const COLORS = ['#a45e2c','#4a746c','#786392','#9b684f'];
const point = (angle, radius=126) => ({x:200+Math.cos(angle*Math.PI/180)*radius,y:200+Math.sin(angle*Math.PI/180)*radius});
const app = createShell({
  slug:'ringcount', name:'Ringcount', puzzles:PUZZLES, engine,
  sibling:{slug:'switchpath',name:'Switchpath',url:'https://alford-daily.jbapckfan.chatgpt.site/games/switchpath/'},
  record:game=>({status:game.status,checks:game.checks,moves:game.moves,hints:game.hints}),
  help:`<p class="dialog-kicker">A LITTLE BALANCE GOES A LONG WAY</p><h2 class="dialog-title" id="dialog-title">Four cuts. Four equal totals.</h2><p class="dialog-body">Twelve numbers sit around a ring. Place four cuts in the gaps so every arc adds up to the target in the center.</p><div class="help-example">4 + 6 + 5 = <strong>15</strong><br><small>An arc can be short or long. Only its total matters.</small></div><ol class="help-list"><li>Tap a gap outside the ring to place a cut. Tap a selected cut to remove it.</li><li>The colored arc totals update as you work. All numbers are used exactly once, including the arc that wraps around the top.</li><li>When all four totals match, press <strong>Check the circle.</strong></li></ol><p class="dialog-body">Every board has exactly one solution. No timer and no dead ends: your cuts always stay editable until you finish. One check with no hints is perfect. A hint adds one correct cut; if four are already placed, it replaces an incorrect one.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Find the balance →</button></div>`,
  about:'Ringcount is an original daily number-partition puzzle. Divide a fixed ring into four contiguous arcs with equal sums. Every prepared board has one solution, verified by testing all 495 possible four-cut sets. Every complete placement can be recovered with hints. Session length and difficulty still need human playtesting.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect circles</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won?stats.averageChecks.toFixed(1):'—'}</strong></div>`,
  result(api){
    const {game,mode,daily}=api; const won=game.status==='won';const perfect=won&&game.checks===1&&game.hints===0;
    return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:'A MOMENT OF BALANCE'}</p><div class="result-symbol ring-result" aria-hidden="true">◎</div><h2 class="dialog-title" id="dialog-title">${perfect?'Perfectly balanced.':won?'Full circle.':'The circle revealed.'}</h2><p class="result-copy">${won?'Four parts. One lovely whole. You found where everything belongs.':'The four cuts now show the solution. This round is recorded as revealed.'}</p><div class="result-metrics"><div><strong>${game.checks}</strong><span>checks</span></div><div><strong>${game.moves}</strong><span>moves</span></div><div><strong>${game.hints}</strong><span>hints</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your circle ↗</button><button class="secondary-button" data-action="random">One more circle →</button></div><p class="fineprint">Your shared result keeps the cuts a secret.<br>${mode==='daily'?'A fresh daily at midnight Central.':'Practice stays separate from your daily score.'}</p>`;
  },
  render:renderGame,
});

function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';
  const cuts=game.status==='revealed'?puzzle.solution:game.cuts;
  const segments=engine.getSegments(puzzle,cuts);
  const colors=puzzle.numbers.map((_,index)=>cuts.length?COLORS[segments.findIndex(segment=>segment.indices.includes(index))]:'#776f60');
  $('ring-target').textContent=puzzle.target;
  $('cut-count').textContent=game.status==='revealed'?'Solution shown':`${cuts.length} / 4 cuts`;
  $('puzzle').classList.toggle('complete',game.status==='won');
  $('ring-numbers').innerHTML=puzzle.numbers.map((number,index)=>{
    const angle=-90+index*30;const p=point(angle,126);
    return `<span class="ring-number" style="left:${p.x/4}%;top:${p.y/4}%;--arc:${colors[index]}" aria-label="Position ${index+1}, number ${number}">${number}<small>${index+1}</small></span>`;
  }).join('');
  $('ring-gaps').innerHTML=puzzle.numbers.map((number,index)=>{
    const angle=-75+index*30;const p=point(angle,172);const selected=cuts.includes(index);
    return `<button class="ring-gap${selected?' selected':''}" style="left:${p.x/4}%;top:${p.y/4}%;--angle:${angle+90}deg" data-gap="${index}" aria-pressed="${selected}" aria-label="${selected?'Remove':'Place'} cut after position ${index+1}, between ${number} and ${puzzle.numbers[(index+1)%12]}" ${active?'':'disabled'}><span aria-hidden="true">${selected?'':'+'}</span></button>`;
  }).join('');
  $('ring-arcs').innerHTML=segments.map((segment,index)=>{
    if(!cuts.length)return '<circle cx="200" cy="200" r="126" fill="none" stroke="#ddd6c8" stroke-width="7"/>';
    const start=-90+segment.start*30-13;const end=start+segment.indices.length*30-4;
    const a=point(start),b=point(end);
    return `<path d="M${a.x} ${a.y} A126 126 0 ${end-start>180?1:0} 1 ${b.x} ${b.y}" fill="none" stroke="${COLORS[index]}" stroke-width="7" stroke-linecap="round" opacity=".42"/>`;
  }).join('');
  $('arc-totals').innerHTML=cuts.length?segments.map((segment,index)=>{
    const matches=segment.sum===puzzle.target;
    return `<div class="arc-total${matches?' matched':''}" style="--arc:${COLORS[index]}"><span>ARC ${index+1}</span><strong>${segment.sum}${matches?'<i aria-label="matches target">✓</i>':''}</strong><small>${segment.values.join(' + ')}</small></div>`;
  }).join(''):'<p class="empty-arcs">Your four arc totals will appear here.<br>Start with any gap.</p>';
  $('ring-check').disabled=!active||cuts.length!==4||game.checkedSets.includes(cuts.join(','));
  $('ring-check').textContent=cuts.length===4&&segments.every(segment=>segment.sum===puzzle.target)?'Bring it full circle ↵':'Check the circle ↵';
  $('ring-hint').disabled=!active||puzzle.solution.every(gap=>cuts.includes(gap));
  document.querySelector('.ring-actions').hidden=!active;
  $('ring-moves').textContent=game.moves;$('ring-hints').textContent=game.hints;$('ring-checks').textContent=game.checks;
  if(opts.gap!==undefined)$('ring-gaps').querySelector(`[data-gap="${opts.gap}"]`)?.focus({preventScroll:true});
}
function toggle(gap){
  const result=engine.toggleCut(app.puzzle,app.game,gap);
  if(!result.changed){if(result.reason==='full')app.notice('Four cuts are placed. Remove one before choosing a different gap.');return;}
  const cuts=result.state.cuts;const segments=engine.getSegments(app.puzzle,cuts);const matches=segments.filter(segment=>segment.sum===app.puzzle.target).length;
  const message=cuts.length===4&&matches===4?'All four totals match. Check your circle to finish.':`${cuts.length} of 4 cuts placed.${matches?` ${matches} ${matches===1?'arc matches':'arcs match'} the target.`:''}`;
  app.commit(result.state,{message,tone:matches?'fit':'select',opts:{gap}});
}
function check(){
  const result=engine.checkBoard(app.puzzle,app.game);
  if(!result.changed){app.notice(result.reason==='incomplete'?'Place all four cuts before checking.':'Try a different arrangement before checking again.');return;}
  const won=result.state.status==='won';
  app.commit(result.state,{message:won?'Four equal parts. A perfectly balanced circle.':'Not balanced yet. Your cuts are still yours to move.',tone:won?'win':'miss'});
}
$('ring-gaps').addEventListener('click',event=>{const gap=event.target.closest('[data-gap]');if(gap)toggle(Number(gap.dataset.gap));});
$('ring-gaps').addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const gap=event.target.closest('[data-gap]');if(!gap)return;event.preventDefault();
  const current=Number(gap.dataset.gap);const next=event.key==='Home'?0:event.key==='End'?11:(current+(['ArrowRight','ArrowDown'].includes(event.key)?1:11))%12;
  $('ring-gaps').querySelector(`[data-gap="${next}"]`)?.focus();
});
$('ring-check').addEventListener('click',check);
$('ring-hint').addEventListener('click',()=>{const result=engine.useHint(app.puzzle,app.game);if(result.changed)app.commit(result.state,{message:result.hint.message,tone:'fit',opts:{gap:result.hint.gap}});});
$('feedback').textContent='Four cuts, four equal totals. Every number has its place.';
$('board-note').textContent='One solution. No timer. One check without hints is perfect.';
app.start();
