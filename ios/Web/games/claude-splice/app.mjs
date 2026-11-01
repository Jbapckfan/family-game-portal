import {createExpandedState,assistanceCount} from './engine.mjs';
import {mountDailyGame,escapeHTML as esc} from '../deepseek-runtime/common.mjs';
import {PUZZLES} from './puzzles.mjs';
import {restoreState,getStatus,analyze,chooseTile,submitPair,shuffle,hint,reveal,solutionPairs} from './engine.mjs';

mountDailyGame({
 assistanceCount,
 id:'claude-splice',name:'Splice',creator:'Claude',credit:'Developed by Claude',accent:'#3258b7',
 intro:'Twelve halves. Six words. Leave a partner for every piece.',
 hintLabel:'Show a safe splice',puzzles:PUZZLES,createState:createExpandedState,restoreState,getStatus,hint,reveal,
 instructions:[
  'These are the rules for new rounds. A restored saved round keeps its earlier word rules; new Practice rounds use the expanded game dictionary.',
  'Splice the twelve letter fragments into six words, using every tile exactly once. Select the first half, then the second half, and choose Splice.',
  'The order matters. Flip swaps the two selected halves before you submit.',
  'A splice is accepted when it forms a word in the supplied list and the remaining halves can still be paired into complete words. Every complete valid pairing counts.',
  'A listed word that strands another half costs one mistake. An unlisted join or a repeated failed splice costs nothing. Four mistakes end the round.',
  'Shuffle rearranges the remaining tiles. Show a safe splice selects two halves that preserve a complete solution and marks your result assisted.'
 ],
 summarize:(p,s)=>{const a=analyze(p,s);return `${a.pairs.length} of 6 words spliced · ${a.mistakes} of 4 mistakes${s.hinted.length?` · ${s.hinted.length} ${s.hinted.length===1?'hint':'hints'}`:''}${s.revealed?' · solution revealed':''}.`;},
 render({root,puzzle:p,state:s,commit,announce}){
  const a=analyze(p,s),status=getStatus(p,s),finished=status!=='playing',showAll=status==='lost'||status==='revealed',tiles=p.parts.flat(),pairs=showAll?solutionPairs(p,s):a.pairs;
  root.innerHTML=`<section class="panel splice-panel"><div class="row splice-progress"><strong>${a.pairs.length} / 6 words spliced</strong><span class="pill" aria-label="${4-a.mistakes} mistakes remaining">${'●'.repeat(4-a.mistakes)}${'○'.repeat(a.mistakes)} · ${4-a.mistakes} left</span></div>${pairs.length?`<div class="splice-reel" aria-label="Completed words">${pairs.map(([first,second],index)=>`<div class="splice-strip ${index<a.pairs.length?'found':'revealed'}" aria-label="${esc(tiles[first]+tiles[second])}${index<a.pairs.length?'':', revealed'}"><span>${esc(tiles[first].toUpperCase())}</span><i aria-hidden="true"></i><span>${esc(tiles[second].toUpperCase())}</span>${index>=a.pairs.length?'<small>shown</small>':''}</div>`).join('')}</div>`:''}${finished?'':`<div class="splice-preview" aria-live="polite">${s.selected.length?`<strong>${esc(tiles[s.selected[0]].toUpperCase())}</strong><span class="splice-plus">+</span>${s.selected.length===2?`<strong>${esc(tiles[s.selected[1]].toUpperCase())}</strong>`:'<span class="muted">pick a partner</span>'}`:'<span class="muted">Choose two halves in word order.</span>'}</div><div class="actions splice-submit"><button type="button" id="splice-flip" class="button" ${s.selected.length===2?'':'disabled'}>⇄ Flip</button><button type="button" id="splice-go" class="button primary" ${s.selected.length===2?'':'disabled'}>Splice</button></div><div class="tiles splice-grid">${s.order.filter(i=>!a.used.has(i)).map(i=>`<button type="button" class="tile splice-tile ${s.selected.includes(i)?'selected':''} ${s.hintPair?.includes(i)?'hinted':''}" data-tile="${i}" aria-pressed="${s.selected.includes(i)}" aria-label="${esc(tiles[i])}, tile ${i+1}${s.selected.includes(i)?`, selected ${s.selected.indexOf(i)===0?'first':'second'}`:''}">${esc(tiles[i].toUpperCase())}${s.selected.includes(i)?`<small aria-hidden="true">${s.selected.indexOf(i)+1}</small>`:''}</button>`).join('')}</div><div class="actions splice-tools"><button type="button" id="splice-shuffle" class="button">Shuffle</button><button type="button" id="splice-clear" class="button" ${s.selected.length?'':'disabled'}>Deselect</button></div><p class="splice-note">${s.vocabulary===2?'Expanded game dictionary.':'This saved round keeps earlier word rules. New Practice rounds use the expanded game dictionary.'} A good word also leaves a partner for every remaining half.</p>${s.hintPair?'<p class="splice-hint">The outlined halves make a safe splice. Their selected order is shown above.</p>':''}`}</section>`;
  if(finished)return;
  root.querySelectorAll('[data-tile]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.tile),replacing=s.selected.length===2&&!s.selected.includes(index);commit(chooseTile(p,s,index),replacing?'Second half replaced. Your first half stays selected.':'');root.querySelector(`[data-tile="${index}"]`)?.focus({preventScroll:true});}));
  root.querySelector('#splice-flip').addEventListener('click',()=>commit({...s,selected:[...s.selected].reverse()},'Order flipped.'));
  root.querySelector('#splice-clear').addEventListener('click',()=>commit({...s,selected:[]},'Selection cleared.'));
  root.querySelector('#splice-shuffle').addEventListener('click',()=>commit(shuffle(p,s),'Same halves, a fresh arrangement.'));
  root.querySelector('#splice-go').addEventListener('click',()=>{const result=submitPair(p,s);if(result.state===s){announce(result.message);return;}commit(result.state,result.message);});
 }
});
