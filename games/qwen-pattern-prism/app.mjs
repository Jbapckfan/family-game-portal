import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import * as E from './engine.mjs';
// Named satin finishes retain color as a puzzle signal. Lighting stays fixed as pieces rotate.
const MATERIALS={
  ocean:{light:'#c7e2ee',face:'#689db8',shade:'#376580',edge:'#e2f0f5',side:'#31536b'},
  rose:{light:'#efd7dc',face:'#c18a96',shade:'#8f5b6b',edge:'#f8e9ed',side:'#754958'},
  gold:{light:'#f4e8c5',face:'#d0b979',shade:'#a28a51',edge:'#fff6dd',side:'#877344'},
  leaf:{light:'#d5e6df',face:'#8eb5a4',shade:'#577f6d',edge:'#eaf5ee',side:'#456555'}
};
const ARROWS={0:'↑',90:'→',180:'↓',270:'←'};
const cap=word=>word[0].toUpperCase()+word.slice(1);
const label=t=>`${t.size?'Large':'Small'} ${t.color} ${t.shape}, pointing ${E.DIRECTIONS[t.rotation]}`;
function geometry(t) {
  if(t.shape==='circle')return '<circle cx="50" cy="50" r="28"/>';
  const vertices={triangle:[[50,20],[80,76],[20,76]],square:[[24,24],[76,24],[76,76],[24,76]],star:[[50,18],[59,39],[82,42],[65,58],[70,81],[50,69],[30,81],[35,58],[18,42],[41,39]]};
  // Rotate the geometry, rather than the lighting or cast shadow.
  const points=vertices[t.shape].map(([x,y])=>({0:[x,y],90:[100-y,x],180:[100-x,100-y],270:[y,100-x]})[t.rotation].join(',')).join(' ');
  return `<polygon points="${points}"/>`;
}
function symbol(t,id) {
  const m=MATERIALS[t.color],form=geometry(t),uid=`prism-material-${id}`;
  return `<svg viewBox="0 0 100 100" class="prism-symbol" aria-hidden="true"><defs>
    <linearGradient id="${uid}-face" x1="20" y1="15" x2="76" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="${m.light}"/><stop offset=".42" stop-color="${m.face}"/><stop offset="1" stop-color="${m.shade}"/></linearGradient>
    <linearGradient id="${uid}-edge" x1="22" y1="15" x2="72" y2="85" gradientUnits="userSpaceOnUse"><stop stop-color="${m.edge}"/><stop offset=".48" stop-color="${m.face}"/><stop offset="1" stop-color="${m.side}"/></linearGradient>
    <filter id="${uid}-shadow" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
    </defs><g class="prism-form" transform="translate(50 50) scale(${t.size?1:.67}) translate(-50 -50)">
    <g transform="translate(1 9)" fill="#29485b" opacity=".22" filter="url(#${uid}-shadow)">${form}</g>
    <g class="prism-piece-side" transform="translate(0 5)" fill="${m.side}" stroke="${m.side}" stroke-width="1.5" stroke-linejoin="round">${form}</g>
    <g class="prism-piece-face" fill="url(#${uid}-face)" stroke="url(#${uid}-edge)" stroke-width="2.2" stroke-linejoin="round">${form}</g>
    <g class="prism-piece-bevel" transform="translate(50 50) scale(.93) translate(-50 -50)" fill="none" stroke="${m.edge}" stroke-width=".9" stroke-opacity=".65" stroke-linejoin="round">${form}</g>
    </g><g class="prism-bearing" transform="rotate(${t.rotation} 50 50)"><path d="M46 10l4-5 4 5M50 6v10"/></g></svg>`;
}
function token(t,number,extra='') {
  return `<div class="prism-token ${extra}" role="img" aria-label="Element ${number}: ${esc(label(t))}"><span class="prism-number">${String(number).padStart(2,'0')}</span>${symbol(t,`element-${number}`)}<span class="prism-caption"><strong>${esc(cap(t.shape))}</strong><span>${esc(cap(t.color))} · ${t.size?'large':'small'}</span><b>${ARROWS[t.rotation]} ${E.DIRECTIONS[t.rotation]}</b></span></div>`;
}
mountDailyGame({
 assistanceCount:(p,s)=>s.hints.reduce((a,b)=>a+b,0),
  id:'qwen-pattern-prism',name:'Pattern Prism',creator:'Qwen',credit:'Concept by Qwen · Built by Alford Daily',accent:'#087c99',
  intro:'Four signals. One underlying rhythm. Find what comes next.',
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
      <div class="prism-heading"><div><p class="prism-overline">Observe / 01–05</p><h2>Read the sequence</h2></div><span class="pill">${E.mistakes(s)} miss${E.mistakes(s)===1?'':'es'}</span></div>
      <p class="prism-attributes">Shape <span>·</span> Color <span>·</span> Size <span>·</span> Direction</p>
      <div class="prism-examples" aria-label="Five examples in sequence">${[0,1,2,3,4].map(i=>token(E.tokenAt(p,i),i+1)).join('')}</div>
      <div class="prism-divider"><span>Continue / 06–08</span></div>
      <div class="prism-predictions" aria-label="Your predictions">${[0,1,2].map(i=>i<step?token(E.tokenAt(p,5+i),6+i,'completed'):`<div class="prism-token blank ${i===step?'current':''}" aria-label="Element ${6+i}, ${i===step?'predict this one next':'not yet reached'}"><span class="prism-number">0${6+i}</span><span class="prism-question">${i===step?'?':'—'}</span><span class="prism-caption">${i===step?'Your move':'Next'}</span></div>`).join('')}</div>
      ${!finished?`<h2 id="prism-prompt" class="prism-prompt" tabindex="-1">What belongs at ${step+6}?</h2><p class="prism-keys muted">Choose A, B, C or D · keyboard letters work too.</p><div class="prism-choices" role="group" aria-labelledby="prism-prompt">${E.choicesAt(p,step).map((t,i)=>{const wrong=s.wrong[step].includes(i),hinted=s.hints[step]===2&&i===E.correctIndex(p,step);return `<button id="prism-choice-${i}" type="button" class="prism-choice ${wrong?'wrong':''} ${hinted?'hinted':''}" data-choice="${i}" aria-label="Choice ${'ABCD'[i]}: ${esc(label(t))}${wrong?', does not fit':''}${hinted?', hinted answer':''}" ${wrong?'disabled':''}><span class="prism-choice-letter">${'ABCD'[i]}</span>${symbol(t,`choice-${i}`)}<span class="prism-choice-caption"><strong>${esc(cap(t.shape))} · ${esc(cap(t.color))}</strong><span>${t.size?'Large':'Small'} · ${ARROWS[t.rotation]} ${E.DIRECTIONS[t.rotation]}</span></span>${wrong?'<span class="prism-choice-note">Does not fit</span>':hinted?'<span class="prism-choice-note">Hint</span>':''}</button>`;}).join('')}</div>${hint?`<p class="prism-hint">${esc(hint)}</p>`:''}`:`<div class="prism-explanation"><h2>${status==='revealed'?'The sequence revealed':'The pattern holds'}</h2><p>${esc(E.explanation(p))}</p></div>`}
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
