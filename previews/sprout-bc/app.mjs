import {createPreviewSession,E} from './model.mjs';
import {plantMarkup,updateTip,animateGrowth} from './plant.mjs';
const session=createPreviewSession();
const $=selector=>document.querySelector(selector);
let view=new URLSearchParams(location.search).get('view')==='c'?'c':'b',plantKey='',lastStack=[],lastPuzzle='',notice='A fresh seed. Grow it one letter at a time.';
const entry=$('#word-entry'),plant=$('#plant');
function showGrowth(){const offscreen=plant.getBoundingClientRect().top<0&&innerWidth<=760;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(offscreen)plant.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});animateGrowth(plant,offscreen&&!reduced?400:0);}
function announce(text){notice=text;$('#message').textContent=text;}
function commit(next,message='') {const changed=session.commit(next);if(changed){notice=message;render();}return changed;}
function render({animate=true}={}) {
 const p=session.puzzle,s=session.state,a=E.analyze(p,s),status=session.outcome,current=a.stack.at(-1),target=current.length+1,typed=E.typedWord(p,s),finished=status!=='playing';
 const grew=animate&&lastPuzzle===p.id&&a.stack.length===lastStack.length+1&&lastStack.every((word,i)=>word===a.stack[i])&&(status==='playing'||status==='won');
 const key=[view,p.id,a.stack.join(','),status].join('|');
 if(key!==plantKey){plant.innerHTML=plantMarkup({view,stack:a.stack,typed,status,growing:grew});plantKey=key;if(grew)showGrowth();}
 else updateTip(plant,view,typed);
 lastStack=[...a.stack];lastPuzzle=p.id;
 plant.setAttribute('aria-label',`${view==='b'?'Letter branches':'Living word vine'}. ${a.stack.join(', ')}. ${status==='won'?'Earned eight-letter bloom.':status==='playing'?`Build a ${target}-letter word.`:'Growth paused.'}`);
 plant.dataset.status=status;
 $('#progress').textContent=status==='won'?'In bloom':status==='lost'?'Five wilts · growth paused':status==='revealed'?'Path revealed':`${8-current.length} ${current.length===7?'step':'steps'} to bloom`;
 $('#wilts').textContent=`${5-a.wilts} wilts left`;
 $('#wilts').setAttribute('aria-label',`${5-a.wilts} of 5 wilts remaining`);
 $('#garden-caption').textContent=view==='b'?'Every word becomes a new branch.':'Your words become the living vine.';
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===view));
 $('#goal').textContent=finished?(status==='won'?'Eight letters. In bloom.':'A moment to begin again.'):`Grow to ${target} letters`;
 $('#stage-label').textContent=finished?'YOUR PRACTICE PLANT':'GROW YOUR NEXT WORD';
 $('#rack-panel').hidden=finished;$('#word-form').hidden=finished;
 $('#message').textContent=notice;
 if(!finished){
   const soilChosen=s.typed.some(t=>t.source==='soil');
   $('#word-rack').innerHTML=[...current].map((ch,index)=>{const used=s.typed.some(t=>t.source==='word'&&t.index===index);return `<button type="button" data-source="word" data-index="${index}" aria-label="Current word letter ${ch.toUpperCase()}, tile ${index+1}" aria-pressed="${used}" ${used?'disabled':''}>${ch.toUpperCase()}</button>`;}).join('');
   $('#soil-rack').innerHTML=[...p.pool].map((ch,index)=>{if(a.soilUsed.includes(index))return '';const used=s.typed.some(t=>t.source==='soil'&&t.index===index);return `<button type="button" data-source="soil" data-index="${index}" class="${a.hintLetter===ch?'hinted':''}" aria-label="Soil letter ${ch.toUpperCase()}, tile ${index+1}${a.hintLetter===ch?', hinted letter':''}" aria-pressed="${used}" ${soilChosen?'disabled':''}>${ch.toUpperCase()}</button>`;}).join('');
   if(entry.value!==typed.toUpperCase())entry.value=typed.toUpperCase();
   entry.maxLength=target;entry.setAttribute('aria-label',`Build a ${target}-letter word`);
   $('#grow').disabled=typed.length!==target;
   $('#clear').disabled=!typed.length;$('#delete').disabled=!typed.length;
   $('#arranged').textContent=`${typed.length} / ${target}`;
 }
 $('#replay').disabled=a.stack.length<2;
 $('#undo').disabled=finished||a.stack.length<2;
 $('#restart').disabled=finished;
 $('#hint').disabled=finished||a.hintLetter!==null;
 $('#reveal').hidden=finished;
 $('#hint-note').textContent=a.hintLetter?`Hint: add ${a.hintLetter.toUpperCase()}, then rearrange. One wilt used. Undo and Restart keep wilts.`:'Five wilts end the round. Undo and Restart keep wilts.';
 const reveal=status==='lost'||status==='revealed';
 $('#reveal-path').hidden=!reveal;
 if(reveal)$('#reveal-path').innerHTML=`<p><strong>One possible path</strong> · shown, not grown</p><p class="solution">${E.solutionPath(p,s).map(word=>word.toUpperCase()).join(' → ')}</p><p>Choose New practice for another seed.</p>`;
}
entry.addEventListener('input',event=>{
 const raw=entry.value,sanitize=value=>value.toLowerCase().replace(/[^a-z]/g,''),value=sanitize(raw),start=sanitize(raw.slice(0,entry.selectionStart??raw.length)).length,end=sanitize(raw.slice(0,entry.selectionEnd??raw.length)).length,direction=entry.selectionDirection??'none';
 const result=E.selectWord(session.puzzle,session.state,value);
 if(!result.state){entry.value=E.typedWord(session.puzzle,session.state).toUpperCase();entry.setSelectionRange(Math.min(start,entry.value.length),Math.min(end,entry.value.length),direction);announce(result.message);return;}
 commit(result.state);entry.setSelectionRange(start,end,direction);
});
$('#word-form').addEventListener('submit',event=>{event.preventDefault();const result=E.submitWord(session.puzzle,session.state);if(JSON.stringify(result.state)===JSON.stringify(session.state))announce(result.message);else commit(result.state,result.message);});
$('#rack-panel').addEventListener('click',event=>{const button=event.target.closest('[data-source]');if(!button)return;const next=E.chooseTile(session.puzzle,session.state,button.dataset.source,Number(button.dataset.index));commit(next);});
$('#clear').addEventListener('click',()=>commit({...session.state,typed:[]},'Letters returned to the rack.'));
$('#delete').addEventListener('click',()=>commit({...session.state,typed:session.state.typed.slice(0,-1)},'Last letter returned.'));
$('#undo').addEventListener('click',()=>commit(E.undo(session.puzzle,session.state),'Last growth undone. Wilts stay the same.'));
$('#restart').addEventListener('click',()=>commit(E.restart(session.puzzle,session.state),'Back to the seed. Wilts stay the same.'));
$('#hint').addEventListener('click',()=>{session.hint();notice=session.outcome==='lost'?'The last wilt was used. One possible path is shown; this plant did not bloom.':'A useful soil letter is highlighted. One wilt used.';render();});
$('#reveal').addEventListener('click',()=>{session.reveal();notice='Growth paused. The path below is a reveal, not an earned bloom.';render();});
$('#new-practice').addEventListener('click',()=>{session.practice();notice='A fresh practice seed. Grow it one letter at a time.';render({animate:false});});
$('.view-switch').addEventListener('click',event=>{const button=event.target.closest('[data-view]');if(!button||button.dataset.view===view)return;view=button.dataset.view;render({animate:false});});
render({animate:false});

$('#replay').addEventListener('click',()=>{const p=session.puzzle,s=session.state,a=E.analyze(p,s);if(a.stack.length<2)return;plant.innerHTML=plantMarkup({view,stack:a.stack,typed:E.typedWord(p,s),status:session.outcome,growing:true});showGrowth();});
