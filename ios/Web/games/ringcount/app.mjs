import { PUZZLES } from './puzzles.mjs';
import { TOUGHER_SAMPLE } from './samples.mjs';
import * as engine from './engine.mjs';
import { createShell, esc } from './shell.mjs';
import {openResultShare} from './share-card.mjs';

const $ = id => document.getElementById(id);
const COLORS = ['#176b91','#16766c','#254d70','#2b7d91'];
const point = (angle, radius=126) => ({x:200+Math.cos(angle*Math.PI/180)*radius,y:200+Math.sin(angle*Math.PI/180)*radius});
const app = createShell({
  lesson:{question:'The target is 15. Which arc has the right total?',choices:[{label:'4 + 6 + 5',correct:true,why:'4 + 6 + 5 is 15. Arc length can vary; its sum is what matters.'},{label:'4 + 6 + 6',correct:false,why:'That totals 16. Each arc must equal the target exactly.'},{label:'5 + 5',correct:false,why:'That totals 10. There is no fixed count of numbers per arc.'}]},
  slug:'ringcount', name:'Ringcount', puzzles:PUZZLES, engine, sample:TOUGHER_SAMPLE,
  sibling:{slug:'switchpath',name:'Switchpath',url:'../switchpath/'},
  record:game=>({status:game.status,checks:game.checks,moves:game.moves,hints:game.hints}),
  help:`<p class="dialog-kicker">A LITTLE BALANCE GOES A LONG WAY</p><h2 class="dialog-title" id="dialog-title">Four cuts. Four equal totals.</h2><p class="dialog-body">Twelve numbers sit around a ring. Place four cuts in the gaps so every arc adds up to the target in the center.</p><div class="help-example">4 + 6 + 5 = <strong>15</strong><br><small>An arc can be short or long. Only its total matters.</small></div><ol class="help-list"><li>Tap a gap outside the ring to place a cut. Tap a selected cut to remove it.</li><li>The colored arc totals update as you work. All numbers are used exactly once, including the arc that wraps around the top.</li><li>When all four totals match, press <strong>Check the circle.</strong></li></ol><p class="dialog-body">Every board has exactly one solution. No timer and no dead ends: your cuts always stay editable until you finish. One check with no hints is perfect. A hint adds one correct cut; if four are already placed, it replaces an incorrect one.</p><div class="dialog-actions"><button class="primary-button" data-action="close" autofocus>Find the balance →</button></div>`,
  about:'Ringcount is an original daily number-partition puzzle. Divide a fixed ring into four contiguous arcs with equal sums. Every prepared board has one solution, verified by testing all 495 possible four-cut sets. Every complete placement can be recovered with hints. Session length and difficulty still need human playtesting.',
  statsExtra:stats=>`<div class="stats-detail"><span>Perfect circles</span><strong>${stats.perfect}</strong></div><div class="stats-detail"><span>Average checks when solved</span><strong>${stats.won?stats.averageChecks.toFixed(1):'—'}</strong></div>`,
  result(api){
    const {game,mode,daily}=api; const won=game.status==='won';const perfect=won&&game.checks===1&&game.hints===0;
    return `<p class="dialog-kicker">${mode==='daily'?`DAILY NO. ${String(daily.number).padStart(3,'0')}`:api.isBonus?'BONUS CHALLENGE':'A MOMENT OF BALANCE'}</p><div class="result-symbol ring-result" aria-hidden="true">◎</div><h2 class="dialog-title" id="dialog-title">${perfect?'Perfectly balanced.':won?'Full circle.':'The circle revealed.'}</h2><p class="result-copy">${won?'Four parts. One lovely whole. You found where everything belongs.':'The four cuts now show the solution. This round is recorded as revealed.'}</p><div class="result-metrics"><div><strong>${game.checks}</strong><span>checks</span></div><div><strong>${game.moves}</strong><span>moves</span></div><div><strong>${game.hints}</strong><span>hints</span></div></div><div class="dialog-actions"><button class="primary-button" data-action="share" autofocus>Share your circle ↗</button><button class="secondary-button" data-action="random">One more circle →</button></div><p class="fineprint">Your shared result keeps the cuts a secret.<br>${mode==='daily'?'A fresh daily at midnight Central.':api.isBonus?'Bonus result only. Your daily streak stays unchanged.':'Practice stays separate from your daily score.'}</p>`;
  },
  render:renderGame,
  share:openResultShare,
});

function renderGame(api,opts={}){
  const {game,puzzle}=api;const active=game.status==='playing';
  const cuts=game.status==='revealed'?puzzle.solution:game.cuts;
  const segments=engine.getSegments(puzzle,cuts);
  const colors=puzzle.numbers.map((_,index)=>cuts.length?COLORS[segments.findIndex(segment=>segment.indices.includes(index))]:'#526c78');
  $('ring-target').textContent=puzzle.target;
  $('cut-count').textContent=game.status==='revealed'?'Solution shown':`${cuts.length} / 4 cuts`;
  $('puzzle').classList.toggle('complete',game.status==='won');
  $('ring-numbers').innerHTML=puzzle.numbers.map((number,index)=>{
    const angle=-90+index*30;const p=point(angle,126);
    return `<span class="ring-number" role="img" style="left:${p.x/4}%;top:${p.y/4}%;--arc:${colors[index]}" aria-label="Position ${index+1}, number ${number}">${number}<small>${index+1}</small></span>`;
  }).join('');
  $('ring-gaps').innerHTML=puzzle.numbers.map((number,index)=>{
    const angle=-75+index*30;const p=point(angle,172);const selected=cuts.includes(index);
    return `<button class="ring-gap${selected?' selected':''}" style="left:${p.x/4}%;top:${p.y/4}%;--angle:${angle+90}deg" data-gap="${index}" aria-pressed="${selected}" aria-label="${selected?'Remove':'Place'} cut after position ${index+1}, between ${number} and ${puzzle.numbers[(index+1)%12]}" ${active?'':'disabled'}><span aria-hidden="true">${selected?'':'+'}</span></button>`;
  }).join('');
  $('ring-arcs').innerHTML=segments.map((segment,index)=>{
    if(!cuts.length)return '<circle cx="200" cy="200" r="126" fill="none" stroke="#d2e1e6" stroke-width="7"/>';
    const start=-90+segment.start*30-13;const end=start+segment.indices.length*30-4;
    const a=point(start),b=point(end);
    return `<path d="M${a.x} ${a.y} A126 126 0 ${end-start>180?1:0} 1 ${b.x} ${b.y}" fill="none" stroke="${COLORS[index]}" stroke-width="7" stroke-linecap="round" opacity="${segment.sum===puzzle.target?.85:.6}"/>`;
  }).join('');
  $('arc-totals').innerHTML=cuts.length?segments.map((segment,index)=>{
    const matches=segment.sum===puzzle.target;
    return `<button type="button" data-arc="${index}" data-positions="${segment.indices.join(',')}" aria-pressed="false" class="arc-total${matches?' matched':''}" style="--arc:${COLORS[index]}" aria-label="Positions ${segment.indices.map(i=>i+1).join(', ')}, total ${segment.sum}${matches?', matches target':''}. Highlight this arc."><span>${segment.start+1} → ${segment.end+1}</span><strong>${segment.sum}${matches?'<i aria-hidden="true">✓</i>':''}</strong><small>${segment.values.join(' + ')}</small></button>`;
  }).join(''):'<p class="empty-arcs">Your four arc totals will appear here.<br>Start with any gap.</p>';
  $('ring-check').disabled=!active||cuts.length!==4||game.checkedSets.includes(cuts.join(','));
  const balanced=cuts.length?segments.filter(segment=>segment.sum===puzzle.target).length:0;
  $('balance-status').textContent=game.status==='revealed'?'Solution shown · not counted as solved':game.status==='won'?'Circle solved · four equal totals':cuts.length?`${balanced} of 4 totals match${balanced===4?' · Ready to finish':'. Keep exploring.'}`:'Tap a gap to place your first cut.';
  const ready=cuts.length===4&&balanced===4;
  $('ring-check').textContent=ready?'Finish circle ✓':'Check circle';
  $('ring-check').classList.toggle('ready',ready);
  $('ring-hint').textContent=cuts.length===4?'Hint · move a cut':'Hint · place a cut';
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
  app.commit(result.state,{message:won?'Four equal parts. A perfectly balanced circle.':'Not balanced yet. Your cuts are still yours to move.',tone:won?'win':'miss',opts:won?{}:{gap:result.state.cuts[0]}});
}
$('ring-gaps').addEventListener('click',event=>{const gap=event.target.closest('[data-gap]');if(gap)toggle(Number(gap.dataset.gap));});
$('ring-gaps').addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const gap=event.target.closest('[data-gap]');if(!gap)return;event.preventDefault();
  const current=Number(gap.dataset.gap);const next=event.key==='Home'?0:event.key==='End'?11:(current+(['ArrowRight','ArrowDown'].includes(event.key)?1:11))%12;
  $('ring-gaps').querySelector(`[data-gap="${next}"]`)?.focus();
});
$('ring-check').addEventListener('click',check);
function hint(){
  const result=engine.useHint(app.puzzle,app.game);
  if(result.changed)app.commit(result.state,{message:`${result.hint.message} 1 hint added to your result.`,tone:'fit',opts:{gap:result.hint.gap}});
}
$('ring-hint').addEventListener('click',()=>{
  app.openDialog(`<p class="dialog-kicker">A LITTLE HELP</p><h2 class="dialog-title" id="dialog-title">Show a correct cut?</h2><p class="dialog-body">This adds <strong>1 hint</strong> to your result. ${app.game.cuts.length===4?'One incorrect cut will move to a correct gap.':'One correct cut will be placed.'} You can still finish, but this round won’t count as perfect.</p><div class="dialog-actions"><button class="secondary-button" data-action="close" autofocus>Keep thinking</button><button class="primary-button" data-ring-hint-confirm>Use 1 hint</button></div>`);
});
$('dialog-content').addEventListener('click',event=>{if(event.target.closest('[data-ring-hint-confirm]')){app.closeDialog();hint();}});
function focusArc(button){
  const selected=button&&button.getAttribute('aria-pressed')!=='true';
  const indices=selected?button.dataset.positions.split(',').map(Number):[];
  document.querySelectorAll('[data-arc]').forEach(b=>b.setAttribute('aria-pressed',String(selected&&b===button)));
  document.querySelectorAll('.ring-number').forEach((node,i)=>node.classList.toggle('arc-focused',indices.includes(i)));
}
$('arc-totals').addEventListener('click',event=>{const button=event.target.closest('[data-arc]');if(button)focusArc(button);});
$('arc-totals').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();focusArc(null);}});
$('feedback').textContent='Four cuts, four equal totals. Every number has its place.';
$('board-note').textContent='One solution. No timer. One check without hints is perfect.';
app.start();
