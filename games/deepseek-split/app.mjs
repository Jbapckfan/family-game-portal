import { mountDailyGame, escapeHTML as esc } from '../deepseek-runtime/common.mjs';
import { PUZZLES } from './puzzles.mjs';
import * as E from './engine.mjs';
window.addEventListener('hashchange',()=>window.location.reload());
if(window.location.hash==='#daily')mountOriginal();else mountPreview();
function mountOriginal(){
mountDailyGame({
 assistanceCount:(p,s)=>s.hints,
  id: 'deepseek-split', name: 'Split', accent:'#087c99',
  intro: 'Ten letters. Two clues. A perfect split.',
  instructions: [
    'Use every tile exactly once to make two words that answer the two clues.',
    'Choose a word row, then tap letters from the rack. When a row fills, the next tile goes to the other row.',
    'Tap a filled slot to return that tile to the rack. Identical letters are separate tiles, so each has its own place.',
    'Try as many arrangements as you like. A hint keeps correct openings, clears incorrect endings, and adds one correct letter.',
    'Type rack letters on a keyboard. Arrow Up chooses Word 1; Arrow Down chooses Word 2. Backspace returns a letter.'
  ],
  puzzles: PUZZLES, createState: E.createState, restoreState: E.restoreState,
  getStatus: E.getStatus, hint: E.hint, reveal: E.reveal, summarize: E.summarize,
  render({ root, puzzle: p, state: s, commit, announce }) {
    const finished = E.getStatus(p, s) !== 'playing', used = s.rows.flat(), words = E.wordsAt(p, s);
    root.tabIndex = 0;root.setAttribute('aria-label', 'Split puzzle. Choose a row, then tap or type letters.');
    root.innerHTML = `<section class="panel split-panel">
      <div class="split-answers">${p.words.map((word,row) => `<section class="split-answer ${s.active===row?'active':''} ${words[row]===word?'fits':''}" aria-label="Word ${row+1}">
        <button type="button" class="split-row-select" data-row="${row}" aria-pressed="${s.active===row}" ${finished?'disabled':''}><span>Word ${row+1} · ${word.length} letters</span><span>${s.active===row&&!finished?'Filling this row':words[row]===word?'Fits the clue':'Choose row'}</span></button>
        <p class="clue">${esc(p.clues[row])}</p>
        <div class="split-slots" style="--slots:${word.length}">${[...word].map((_,slot)=>{const index=s.rows[row][slot],letter=index===undefined?'':p.rack[index];return `<button type="button" class="split-slot ${letter?'filled':''}" data-slot="${row}:${slot}" aria-label="Word ${row+1}, slot ${slot+1}, ${letter?`${letter}, return tile`:'empty'}" ${finished?'disabled':''}>${letter||'<span aria-hidden="true">·</span>'}</button>`;}).join('')}</div>
      </section>`).join('')}</div>
      <p class="muted split-counter" aria-live="polite">${used.length}/10 tiles placed · Filling Word ${s.active+1}</p>
      <div class="split-rack" role="group" aria-label="Available letter tiles">${p.rack.map((letter,index)=>`<button type="button" class="split-rack-tile ${used.includes(index)?'used':''}" data-index="${index}" aria-label="Letter ${letter}, tile ${index+1}${used.includes(index)?', placed':''}" ${finished||used.includes(index)?'disabled':''}>${letter}</button>`).join('')}</div>
      <div class="actions"><button type="button" class="button" data-action="undo" ${finished||!used.length?'disabled':''}>Undo letter</button><button type="button" class="button" data-action="clear" ${finished||!used.length?'disabled':''}>Start over</button><button type="button" class="button primary" data-action="check" ${finished||used.length<10?'disabled':''}>Check words</button></div>
      <p class="muted split-counter">${s.hints} hint${s.hints===1?'':'s'} used · rearrange as often as you like</p>
    </section>`;
    const keepFocus = () => { if(root.querySelector('button:not(:disabled)'))root.focus({ preventScroll: true }); };
    const apply = result => { if(result.state===s) announce(result.message);else {commit(result.state,result.message);keepFocus();} };
    for(const button of root.querySelectorAll('[data-row]'))button.onclick=()=>{commit(E.setActive(p,s,Number(button.dataset.row)));keepFocus();};
    for(const button of root.querySelectorAll('[data-index]'))button.onclick=()=>apply(E.addTile(p,s,Number(button.dataset.index)));
    for(const button of root.querySelectorAll('[data-slot]'))button.onclick=()=>{const [row,slot]=button.dataset.slot.split(':').map(Number);commit(s.rows[row][slot]===undefined?E.setActive(p,s,row):E.removeTile(p,s,row,slot));keepFocus();};
    root.querySelector('[data-action="undo"]').onclick=()=>{commit(E.undo(p,s),'Letter returned to the rack.');keepFocus();};
    root.querySelector('[data-action="clear"]').onclick=()=>{commit(E.clearAll(p,s),'All tiles returned. Your hint count is retained.');keepFocus();};
    root.querySelector('[data-action="check"]').onclick=()=>apply(E.submit(p,s));
    root.onkeydown=event=>{
      if(event.ctrlKey||event.metaKey||event.altKey||finished)return;
      if(event.key==='ArrowUp'||event.key==='ArrowDown'){
        event.preventDefault();const row=event.key==='ArrowUp'?0:1;commit(E.setActive(p,s,row),`Word ${row+1}: ${p.clues[row]}`);keepFocus();
      }else if(/^[a-z]$/i.test(event.key)){
        event.preventDefault();const letter=event.key.toUpperCase(),index=p.rack.findIndex((c,i)=>c===letter&&!used.includes(i));
        if(index===-1)announce(`No ${letter} tile remains in the rack.`);else apply(E.addTile(p,s,index));
      }else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();commit(E.undo(p,s));keepFocus();}
      else if(event.key==='Enter'&&event.target===root){event.preventDefault();apply(E.submit(p,s));}
    };
  }
});

 const link=document.createElement('a');link.href='#harder';link.className='button';link.textContent='Try the harder sample →';document.querySelector('.mode-switch').after(link);
}

function mountPreview(){
 const p=E.PREVIEW,key='deepseek-split:harder-preview:v2',host=document.getElementById('app');
 let s=E.createPreview(),message='',saved=true;
 try{const raw=localStorage.getItem(key);if(raw){const value=raw.length<16384?E.restorePreview(JSON.parse(raw)):null;if(value)s=value;else message='Starting a fresh sample: the saved data was invalid.';}}catch{saved=false;}
 host.innerHTML=`<div class="game-shell split-preview"><header><div class="collection-bar"><a class="collection-back" href="../daily/">← Alford Daily</a><a href="#daily">Original daily →</a></div><p class="eyebrow">HARDER SAMPLE · 01</p><h1>Split</h1><p class="intro">Two answers. Four distractions.</p><p class="muted">Make two six-letter words. Use each tile once and leave four behind.</p><details><summary>How to play</summary><p>Choose a row, then tap or type letters. Tap a placed letter to return it. Up/Down switches rows; Backspace removes a letter. Check both answers together. Feedback says how many fit, without naming the row. Optional definitions count as help.</p></details></header><main><div id="preview-board" tabindex="0" aria-label="Split puzzle. Choose a row, then tap or type letters."></div><p id="preview-message" role="status" class="status-note"></p><section id="preview-result" class="result" hidden tabindex="-1"></section><div class="support-actions"><button id="preview-reveal" class="button subtle">Reveal solution</button><button id="preview-share" class="button primary" hidden>Copy result</button></div><p id="preview-storage" class="muted"></p></main><footer>One review sample · progress separate from your daily record</footer></div><dialog id="preview-dialog"><h2>Reveal both words?</h2><p>This ends the sample as revealed.</p><div class="actions"><button id="preview-cancel" class="button">Keep playing</button><button id="preview-confirm" class="button primary">Reveal</button></div></dialog>`;
 const $=id=>document.getElementById(id),board=$('preview-board');
 function update(next,note=''){s=next;message=note;try{localStorage.setItem(key,JSON.stringify(s));saved=true;}catch{saved=false;}render();if(E.getStatus(p,s)==='playing')board.focus({preventScroll:true});else $('preview-result').focus({preventScroll:true});}
 function render(){
  const status=E.getStatus(p,s),done=status!=='playing',used=s.rows.flat(),words=E.wordsAt(p,s);
  board.innerHTML=`<div class="preview-answers">${p.words.map((word,row)=>`<section class="preview-answer ${s.active===row?'active':''}"><button class="preview-row" data-preview-row="${row}" aria-pressed="${s.active===row}" ${done?'disabled':''}><span>WORD ${row+1} · 6 LETTERS</span><span>${done?'Complete':s.active===row?'Selected':'Select row'}</span></button><p class="clue">${esc(p.clues[row])}</p><div class="preview-slots">${Array.from({length:6},(_,slot)=>`<button class="preview-slot" data-preview-slot="${row}:${slot}" aria-label="Word ${row+1}, position ${slot+1}: ${words[row][slot]||'empty'}${words[row][slot]&&!done?', return letter':''}" ${done?'disabled':''}>${words[row][slot]||'·'}</button>`).join('')}</div><button class="preview-define" data-define="${row}" ${done||s.definitions[row]?'disabled':''}>${s.definitions[row]?'Definition used':'Need a definition?'}</button>${s.definitions[row]?`<p class="preview-definition">${esc(p.definitions[row])}</p>`:''}</section>`).join('')}</div><p class="split-counter" aria-live="polite">${used.length} / 12 placed · ${16-used.length} in the rack · ${s.checks} checks</p><div class="preview-rack">${p.rack.map((letter,i)=>`<button class="preview-tile ${used.includes(i)?'used':''}" data-preview-index="${i}" aria-label="Letter ${letter}, tile ${i+1}" ${done||used.includes(i)?'disabled':''}>${letter}</button>`).join('')}</div><div class="actions"><button id="preview-undo" class="button" ${done||!used.length?'disabled':''}>Undo</button><button id="preview-clear" class="button" ${done||!used.length?'disabled':''}>Clear</button><button id="preview-check" class="button primary" ${done||used.length!==12?'disabled':''}>Check both</button></div>`;
  $('preview-message').textContent=message;$('preview-result').hidden=!done;$('preview-reveal').hidden=done;$('preview-share').hidden=!done;
  $('preview-storage').textContent=saved?'Saved on this device.':'Saving is unavailable. Keep this tab open.';
  if(done)$('preview-result').innerHTML=`<h2>${status==='won'?'Both meanings found.':'Solution revealed.'}</h2><p>${p.words.map((w,i)=>`<strong>${w}</strong> — ${esc(p.definitions[i])}`).join('<br>')}</p><p>${s.checks} checks · ${s.definitions.filter(Boolean).length} definitions used</p>`;
  board.querySelectorAll('[data-preview-row]').forEach(b=>b.onclick=()=>update(E.setActive(p,s,+b.dataset.previewRow)));
  board.querySelectorAll('[data-preview-index]').forEach(b=>b.onclick=()=>{const r=E.addTile(p,s,+b.dataset.previewIndex);update(r.state,r.message);});
  board.querySelectorAll('[data-preview-slot]').forEach(b=>b.onclick=()=>{const [row,slot]=b.dataset.previewSlot.split(':').map(Number);update(s.rows[row][slot]===undefined?E.setActive(p,s,row):E.removeTile(p,s,row,slot));});
  board.querySelectorAll('[data-define]').forEach(b=>b.onclick=()=>update(E.definePreview(s,+b.dataset.define),'Definition shown; help is recorded in your result.'));
  $('preview-undo').onclick=()=>update(E.undo(p,s),'Letter returned.');$('preview-clear').onclick=()=>update(E.clearAll(p,s),'Letters returned; help and checks retained.');
  $('preview-check').onclick=()=>{const r=E.checkPreview(s);update(r.state,r.message);};
 }
 board.onkeydown=e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.repeat||E.getStatus(p,s)!=='playing')return;
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();update(E.setActive(p,s,e.key==='ArrowUp'?0:1));}
  else if(/^[a-z]$/i.test(e.key)){e.preventDefault();const i=p.rack.findIndex((c,i)=>c===e.key.toUpperCase()&&!s.rows.flat().includes(i));if(i<0){$('preview-message').textContent=`No ${e.key.toUpperCase()} remains.`;return;}const r=E.addTile(p,s,i);update(r.state,r.message);}
  else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();update(E.undo(p,s));}
  else if(e.key==='Enter'&&e.target===board){e.preventDefault();const r=E.checkPreview(s);update(r.state,r.message);}
 };
 $('preview-reveal').onclick=()=>$('preview-dialog').showModal();$('preview-cancel').onclick=()=>{$('preview-dialog').close();board.focus({preventScroll:true});};$('preview-confirm').onclick=()=>{$('preview-dialog').close();update(E.reveal(p,s),'Solution revealed.');};
 $('preview-share').onclick=async()=>{const text=E.previewShare(s);try{await navigator.clipboard.writeText(text);$('preview-message').textContent='Result copied without answers.';}catch{$('preview-message').textContent=text;}};
 render();board.focus({preventScroll:true});
}
