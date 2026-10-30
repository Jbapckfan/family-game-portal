import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {createRequire} from 'node:module';import {runInContext} from 'node:vm';
import {PUZZLES} from '../games/inbetween/puzzles.mjs';import * as E from '../games/inbetween/engine.mjs';import {practiceCandidates} from '../games/deepseek-runtime/practice-calendar.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom'),strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,''),plain=v=>JSON.parse(JSON.stringify(v));
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
function open(saved=storage(),session=storage()){
 const dom=new JSDOM(readFileSync(new URL('../games/inbetween/index.html',import.meta.url),'utf8'),{url:'https://daily.test/games/inbetween/',runScripts:'outside-only'}),w=dom.window,messages=[];
 Object.defineProperty(w,'localStorage',{value:saved});Object.defineProperty(w,'sessionStorage',{value:session});w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>fn();w.setTimeout=()=>1;w.clearTimeout=()=>{};w.setInterval=()=>1;w.CSS={escape:s=>s};
 w.webkit={messageHandlers:{alford:{postMessage:m=>messages.push(m)}}};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 Object.assign(w,E,{PUZZLES,practiceCandidates,getDateKey:()=> '2026-10-30',getDaily:items=>E.getDaily(items,new Date('2026-10-30T18:00:00Z'))});
 const ctx=dom.getInternalVMContext(),share=new URL('../games/inbetween/share-card.mjs',import.meta.url);if(existsSync(share))runInContext(strip(readFileSync(share,'utf8')),ctx);runInContext(strip(readFileSync(new URL('../games/inbetween/app.mjs',import.meta.url),'utf8')),ctx);
 const $=q=>w.document.querySelector(q),state=()=>runInContext('({game,puzzle,preview,hinted,feedback,records})',ctx),action=a=>$(`[data-action="${a}"]`).click();
 const preview=h=>{$(`[data-tile="${h.tileId}"]`).click();$(`[data-row="${h.row}"][data-gap="${h.gap}"]`).click();};
 const fit=()=>{preview(E.findHint(state().puzzle,state().game));$('[data-fit]').click();};
 return {w,$,saved,session,state,action,preview,fit,messages,close:()=>w.close()};
}
function complete(p){let state=E.createGame(p);while(state.status==='playing')state=E.submitPlacement(p,state,E.findHint(p,state)).state;return state;}
test('nudge confirmation is inert until approved; same-board paid advice survives reload without another charge',()=>{
 const saved=storage(),session=storage(),g=open(saved,session);try{
 g.$('#hint-button').click();assert.equal(g.state().game.hints,0);assert.match(g.$('#dialog-content').textContent,/1 nudge/);g.action('close');assert.equal(g.state().game.hints,0);
 g.$('#hint-button').click();g.action('use-hint');assert.equal(g.state().game.hints,1);assert.equal(g.state().game.attempts,0);assert.ok(g.state().hinted);assert.ok(g.$('#hint-button').disabled);
 const reloaded=open(saved,session);try{assert.equal(reloaded.state().game.hints,1);assert.deepEqual(plain(reloaded.state().preview),plain(g.state().preview));assert.ok(reloaded.$('#hint-button').disabled);}finally{reloaded.close();}
 }finally{g.close();}
});
test('pair/gap previews and clear/Escape spend no attempts',()=>{const g=open();try{const h=E.findHint(g.state().puzzle,g.state().game);g.preview(h);assert.equal(g.state().game.attempts,0);g.$('#clear-button').click();assert.equal(g.state().preview,null);g.preview(h);g.w.document.dispatchEvent(new g.w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(g.state().preview,null);assert.equal(g.state().game.attempts,0);}finally{g.close();}});
test('a stale correct placement adopts changed progress before any success animation, speech or haptic',()=>{
 const saved=storage(),g=open(saved),other=open(saved);try{
 const p=g.state().puzzle,h=E.findHint(p,g.state().game);g.preview(h);
 const second=E.findHint(p,E.submitPlacement(p,E.createGame(p),h).state);other.preview(second);other.$('[data-fit]').click();g.messages.length=0;g.$('[data-fit]').click();
 assert.deepEqual(plain(g.state().game),plain(other.state().game));assert.equal(g.$('.just-solved'),null);assert.match(g.$('#announcer').textContent,/another window/);assert.equal(g.messages.filter(m=>m.type==='haptic').length,0);
 }finally{g.close();other.close();}
});
test('a stale nudge adopts newer progress without announcing uncharged advice',()=>{
 const saved=storage(),g=open(saved),other=open(saved);try{other.fit();g.$('#hint-button').click();if(g.$('[data-action="use-hint"]'))g.action('use-hint');assert.equal(g.state().game.hints,0);assert.equal(g.state().hinted,null);assert.match(g.$('#announcer').textContent,/another window/);}finally{g.close();other.close();}
});
test('adopting a terminal daily immediately repairs missing or stale records',()=>{
 const g=open();try{const p=g.state().puzzle,won=complete(p);g.saved.setItem('inbetween:v1:daily:2026-10-30',JSON.stringify(won));g.saved.setItem('inbetween:v1:records',JSON.stringify({'2026-10-30':{status:'revealed',attempts:0,hints:0}}));g.fit();assert.equal(g.state().game.status,'won');assert.equal(JSON.parse(g.saved.getItem('inbetween:v1:records'))['2026-10-30'].status,'won');}finally{g.close();}
});
test('a completed daily survives an older unfinished storage event',()=>{
 const g=open();try{while(g.state().game.status==='playing')g.fit();const won=plain(g.state().game),raw=JSON.stringify(E.createGame(g.state().puzzle));g.saved.setItem('inbetween:v1:daily:2026-10-30',raw);g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:'inbetween:v1:daily:2026-10-30',newValue:raw}));assert.deepEqual(plain(g.state().game),won);assert.equal(JSON.parse(g.saved.getItem('inbetween:v1:daily:2026-10-30')).status,'won');}finally{g.close();}
});
test('valid external terminal progress supersedes dirty unsaved local progress',()=>{
 const saved=storage(),put=saved.setItem;let fail=false;saved.setItem=(k,v)=>{if(fail&&k==='inbetween:v1:daily:2026-10-30')throw Error('Blocked');put(k,v);};const g=open(saved);try{fail=true;g.fit();fail=false;const raw=JSON.stringify(complete(g.state().puzzle));put('inbetween:v1:daily:2026-10-30',raw);g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:'inbetween:v1:daily:2026-10-30',newValue:raw}));assert.equal(g.state().game.status,'won');assert.equal(g.state().game.attempts,6);}finally{g.close();}
});
test('an already revealed daily remains final when a stale tab tries its winning placement',()=>{
 const saved=storage(),g=open(saved);let revealer;try{for(let i=0;i<5;i++)g.fit();const h=E.findHint(g.state().puzzle,g.state().game);g.preview(h);revealer=open(saved);revealer.$('#more-button').click();revealer.action('confirm-reveal');revealer.action('reveal');g.$('[data-fit]').click();assert.equal(g.state().game.status,'revealed');assert.equal(JSON.parse(saved.getItem('inbetween:v1:records'))['2026-10-30'].status,'revealed');assert.doesNotMatch(g.$('#announcer').textContent,/A good fit/);}finally{g.close();revealer?.close();}
});
test('result close restores its button when the previous focus was only a page container',()=>{
 const g=open();try{while(g.state().game.status==='playing')g.fit();for(const node of [g.w.document.body,g.$('#puzzle'),g.$('#bank')]){node.getClientRects=()=>[{}];node.focus();g.$('#results-button').click();g.$('#dialog-close').click();assert.equal(g.w.document.activeElement,g.$('#results-button'));}}finally{g.close();}
});
test('Stats and Daily cannot persist a win record while its game save still fails',()=>{
 const saved=storage(),put=saved.setItem;saved.setItem=(k,v)=>{if(k==='inbetween:v1:daily:2026-10-30')throw Error('Quota');put(k,v);};const g=open(saved);try{while(g.state().game.status==='playing')g.fit();assert.equal(saved.getItem('inbetween:v1:records'),null);g.$('#stats-button').click();g.$('#dialog-close').click();g.$('#daily-tab').click();assert.equal(saved.getItem('inbetween:v1:records'),null);assert.equal(g.state().game.status,'won');}finally{g.close();}
});
test('a wrong fit immediately loses perfect eligibility even before six attempts',()=>{
 const g=open();try{const h=E.findHint(g.state().puzzle,g.state().game);g.preview({...h,gap:(h.gap+1)%5});g.$('[data-fit]').click();assert.equal(g.state().game.attempts,1);assert.match(g.$('#perfect-goal').textContent,/extra attempts/);}finally{g.close();}
});
test('paid advice survives a wrong preview placement but clear, Escape and another pair discard it without inventing legacy advice',()=>{
 for(const choice of ['clear','escape','pair','wrong']){
  const saved=storage(),session=storage(),g=open(saved,session);try{g.$('#hint-button').click();g.action('use-hint');const hint=plain(g.state().hinted);
   if(choice==='clear')g.$('#clear-button').click();
   if(choice==='escape')g.w.document.dispatchEvent(new g.w.KeyboardEvent('keydown',{key:'Escape'}));
   if(choice==='pair')g.$(`[data-tile="${g.state().puzzle.tiles.find(t=>t.id!==hint.tileId).id}"]`).click();
   if(choice==='wrong'){g.$(`[data-row="${hint.row}"][data-gap="${(hint.gap+1)%5}"]`).click();g.$('[data-fit]').click();assert.equal(g.state().game.attempts,1);}
   const reloaded=open(saved,session);try{assert.equal(reloaded.state().game.hints,1);assert.equal(Boolean(reloaded.state().hinted),choice==='wrong');}finally{reloaded.close();}
  }finally{g.close();}
 }
});
