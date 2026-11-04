import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
const PALETTE={ocean:'#467b9f',rose:'#ae5271',gold:'#b98219',leaf:'#5f864f'};
const ARROWS={0:'↑',90:'→',180:'↓',270:'←'};
const cap=word=>word[0].toUpperCase()+word.slice(1);
const label=t=>`${t.size?'Large':'Small'} ${t.color} ${t.shape}, pointing ${E.DIRECTIONS[t.rotation]}`;
function symbol(t) {
  const shapes={circle:'<circle cx="50" cy="50" r="28"/>',triangle:'<path d="M50 20L80 76H20Z"/>',square:'<rect x="24" y="24" width="52" height="52" rx="3"/>',star:'<path d="M50 18L59 39L82 42L65 58L70 81L50 69L30 81L35 58L18 42L41 39Z"/>'};
  return `<svg viewBox="0 0 100 100" class="prism-symbol" aria-hidden="true"><g transform="translate(50 50) scale(${t.size?1:.67}) rotate(${t.rotation}) translate(-50 -50)" fill="${PALETTE[t.color]}" stroke="${PALETTE[t.color]}" stroke-width="2">${shapes[t.shape]}</g><g transform="rotate(${t.rotation} 50 50)" fill="#293b34"><path d="M50 2L45 11H55Z"/><rect x="48.5" y="10" width="3" height="7" rx="1"/></g></svg>`;
}
function token(t,number,extra='') {
  return `<div class="prism-token ${extra}" role="img" aria-label="Element ${number}: ${esc(label(t))}"><span class="prism-number">${number}</span>${symbol(t)}<span class="prism-caption">${esc(cap(t.shape))}<br>${esc(cap(t.color))} · ${t.size?'large':'small'}<br><b>${ARROWS[t.rotation]} ${E.DIRECTIONS[t.rotation]}</b></span></div>`;
}
mountDailyGame({
 assistanceCount:(p,s)=>s.hints.reduce((a,b)=>a+b,0),
  id:'qwen-pattern-prism',name:'Pattern Prism',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
  intro:'Follow the shape. Find the rhythm. See what comes next.',
  instructions:[
    'Study the five examples in order. Shape, color, size, and direction each follow a repeating cycle of at most four elements; some attributes stay the same.',
    'Predict the next three elements, one at a time. Choose the option that continues all four attributes.',
    'The small arrow shows direction, even when a shape looks the same after rotation. Every color and size is also named below its symbol.',
    'Wrong choices are marked and you can keep trying. A first hint explains one changing attribute; a second outlines the correct option for that step.',
    'There is no timer. The full rule is explained when the sequence is complete.'
  ],
  puzzles:PUZZLES,createState:E.createState,restoreState:E.restoreState,getStatus:E.getStatus,hint:E.hint,reveal:E.reveal,summarize:E.summarize,
  render({root,puzzle:p,state:s,commit,announce}) {
    const step=s.answers.length,status=E.getStatus(p,s),finished=status!=='playing',hint=E.hintText(p,s);
    root.innerHTML=`<section class="panel prism-panel">
      <div class="prism-heading"><h2>Read the sequence</h2><span class="pill">${E.mistakes(s)} miss${E.mistakes(s)===1?'':'es'}</span></div>
      <div class="prism-examples" aria-label="Five examples in sequence">${[0,1,2,3,4].map(i=>token(E.tokenAt(p,i),i+1)).join('')}</div>
      <div class="prism-divider"><span>Your next three</span></div>
      <div class="prism-predictions" aria-label="Your predictions">${[0,1,2].map(i=>i<step?token(E.tokenAt(p,5+i),6+i,'completed'):`<div class="prism-token blank ${i===step?'current':''}" aria-label="Element ${6+i}, ${i===step?'predict this one next':'not yet reached'}"><span class="prism-number">${6+i}</span><span class="prism-question">${i===step?'?':'·'}</span><span class="prism-caption">${i===step?'Your move':'Coming next'}</span></div>`).join('')}</div>
      ${!finished?`<h2 id="prism-prompt" class="prism-prompt" tabindex="-1">What belongs at ${step+6}?</h2><p class="prism-keys muted">Choose A, B, C or D · keyboard letters work too.</p><div class="prism-choices" role="group" aria-labelledby="prism-prompt">${E.choicesAt(p,step).map((t,i)=>{const wrong=s.wrong[step].includes(i),hinted=s.hints[step]===2&&i===E.correctIndex(p,step);return `<button id="prism-choice-${i}" type="button" class="prism-choice ${wrong?'wrong':''} ${hinted?'hinted':''}" data-choice="${i}" aria-label="Choice ${'ABCD'[i]}: ${esc(label(t))}${wrong?', does not fit':''}${hinted?', hinted answer':''}" ${wrong?'disabled':''}><span class="prism-choice-letter">${'ABCD'[i]}</span>${symbol(t)}<span class="prism-choice-caption"><strong>${esc(cap(t.shape))} · ${esc(cap(t.color))}</strong><span>${t.size?'Large':'Small'} · ${ARROWS[t.rotation]} ${E.DIRECTIONS[t.rotation]}</span></span>${wrong?'<span class="prism-choice-note">Does not fit</span>':hinted?'<span class="prism-choice-note">Hint</span>':''}</button>`;}).join('')}</div>${hint?`<p class="prism-hint">${esc(hint)}</p>`:''}`:`<div class="prism-explanation"><h2>${status==='revealed'?'The sequence revealed':'The pattern holds'}</h2><p>${esc(E.explanation(p))}</p></div>`}
      <p class="muted prism-footer">${step} of 3 predictions · ${s.hints.reduce((a,b)=>a+b,0)} hints · no time limit</p>
    </section>`;
    const choose=index=>{
      const button=root.querySelector(`[data-choice="${index}"]`);if(!button||button.disabled)return;
      const result=E.choose(p,s,index);if(result.state===s){announce(result.message);return;}
      commit(result.state,result.message);
      if(result.state.answers.length>step)root.querySelector('#prism-prompt')?.focus({preventScroll:true});
      else {const choices=[...root.querySelectorAll('[data-choice]')];(choices.find(b=>!b.disabled&&Number(b.dataset.choice)>index)||choices.find(b=>!b.disabled))?.focus({preventScroll:true});}
    };
    for(const button of root.querySelectorAll('[data-choice]'))button.onclick=()=>choose(Number(button.dataset.choice));
    root.onkeydown=finished?null:event=>{if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||!/^[a-d]$/i.test(event.key))return;event.preventDefault();choose(event.key.toUpperCase().charCodeAt(0)-65);};
  }
});
