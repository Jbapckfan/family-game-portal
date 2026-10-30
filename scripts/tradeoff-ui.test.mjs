import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {createRequire} from 'node:module';import {runInContext} from 'node:vm';
import {PUZZLES} from '../games/tradeoff/puzzles.mjs';import * as E from '../games/tradeoff/engine.mjs';import {practiceCandidates} from '../games/deepseek-runtime/practice-calendar.mjs';
const {JSDOM}=createRequire(import.meta.url)('jsdom'),strip=s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const plain=v=>JSON.parse(JSON.stringify(v));
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
function open(saved=storage(),session=storage()){
 const dom=new JSDOM(readFileSync(new URL('../games/tradeoff/index.html',import.meta.url),'utf8'),{url:'https://daily.test/games/tradeoff/',runScripts:'outside-only'}),w=dom.window;
 Object.defineProperty(w,'localStorage',{value:saved});Object.defineProperty(w,'sessionStorage',{value:session});w.matchMedia=()=>({matches:true});w.requestAnimationFrame=fn=>fn();w.setTimeout=()=>1;w.clearTimeout=()=>{};w.setInterval=()=>1;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 Object.assign(w,E,{PUZZLES,practiceCandidates,getDateKey:()=> '2026-10-30',getDaily:items=>E.getDaily(items,new Date('2026-10-30T18:00:00Z'))});
 const ctx=dom.getInternalVMContext(),share=new URL('../games/tradeoff/share-card.mjs',import.meta.url);if(existsSync(share))runInContext(strip(readFileSync(share,'utf8')),ctx);runInContext(strip(readFileSync(new URL('../games/tradeoff/app.mjs',import.meta.url),'utf8')),ctx);
 const $=q=>w.document.querySelector(q),state=()=>runInContext('({game,puzzle,selected,hinted,feedback,records})',ctx),tile=cell=>$(`[data-row="${cell.row}"][data-col="${cell.col}"]`).click();
 return {w,$,saved,session,state,tile,action:a=>$(`[data-action="${a}"]`).click(),close:()=>w.close()};
}
function anotherMove(p,state,excluded){for(let r=0;r<6;r++)for(let c=0;c<5;c++)for(let s=r+1;s<6;s++){const a={row:r,col:c},b={row:s,col:(c+1)%5},out=E.swapLetters(p,state,a,b);if(out.changed&&JSON.stringify(out.state.board)!==JSON.stringify(excluded))return {a,b};}throw Error('No alternative');}
function complete(p){let state=E.createGame(p);while(state.status==='playing'){const h=E.findHint(p,state);state=E.swapLetters(p,state,h.a,h.b).state;}return state;}
test('hint confirmation is inert until approval; visible paid advice survives reload without another charge',()=>{
 const saved=storage(),session=storage(),g=open(saved,session);try{
 g.$('#hint-button').click();assert.equal(g.state().game.hints,0);assert.match(g.$('#dialog-content').textContent,/1 nudge/);g.action('close');assert.equal(g.state().game.hints,0);
 g.$('#hint-button').click();g.action('use-hint');assert.equal(g.state().game.hints,1);assert.equal(g.state().game.moves,0);assert.equal(g.state().hinted.length,2);assert.ok(g.$('#hint-button').disabled);
 const reloaded=open(saved,session);try{assert.equal(reloaded.state().game.hints,1);assert.equal(reloaded.state().hinted.length,2);assert.ok(reloaded.$('#hint-button').disabled);}finally{reloaded.close();}
 }finally{g.close();}
});
test('a stale swap adopts newer progress without stale solve animation or announcement',()=>{
 const saved=storage(),g=open(saved),other=open(saved);try{
 const p=g.state().puzzle,first=E.findHint(p,g.state().game),predicted=E.swapLetters(p,g.state().game,first.a,first.b).state,m=anotherMove(p,other.state().game,predicted.board);
 g.tile(first.a);other.tile(m.a);other.tile(m.b);g.tile(first.b);
 assert.deepEqual(plain(g.state().game),plain(other.state().game));assert.equal(g.$('.just-solved'),null);assert.match(g.$('#announcer').textContent,/another window/);
 }finally{g.close();other.close();}
});
test('a stale hint adoption never announces an uncharged suggested pair',()=>{
 const saved=storage(),g=open(saved),other=open(saved);try{
 const p=other.state().puzzle,h=E.findHint(p,other.state().game);other.tile(h.a);other.tile(h.b);g.$('#hint-button').click();
 if(g.$('[data-action="use-hint"]'))g.action('use-hint');
 assert.equal(g.state().game.hints,0);assert.equal(g.state().hinted.length,0);assert.match(g.$('#announcer').textContent,/another window/);
 }finally{g.close();other.close();}
});
test('adopting a terminal daily repairs a missing result record immediately',()=>{
 const g=open();try{const p=g.state().puzzle,won=complete(p);g.saved.setItem('tradeoff:v1:daily:2026-10-30',JSON.stringify(won));const h=E.findHint(p,g.state().game);g.tile(h.a);g.tile(h.b);assert.equal(g.state().game.status,'won');const records=JSON.parse(g.saved.getItem('tradeoff:v1:records'));assert.equal(records?.['2026-10-30']?.status,'won');assert.equal(records['2026-10-30'].moves,5);}finally{g.close();}
});
test('a completed daily cannot roll back when an older unfinished storage event arrives',()=>{
 const g=open();try{const p=g.state().puzzle;while(g.state().game.status==='playing'){const h=E.findHint(p,g.state().game);g.tile(h.a);g.tile(h.b);}const won=plain(g.state().game),raw=JSON.stringify(E.createGame(p));g.saved.setItem('tradeoff:v1:daily:2026-10-30',raw);g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:'tradeoff:v1:daily:2026-10-30',newValue:raw}));assert.deepEqual(plain(g.state().game),won);assert.equal(JSON.parse(g.saved.getItem('tradeoff:v1:daily:2026-10-30')).status,'won');}finally{g.close();}
});
test('a valid terminal storage event supersedes dirty unsaved local play',()=>{
 const saved=storage(),put=saved.setItem;let fail=false;saved.setItem=(k,v)=>{if(fail&&k==='tradeoff:v1:daily:2026-10-30')throw Error('Blocked');put(k,v);};const g=open(saved);try{
 const p=g.state().puzzle,h=E.findHint(p,g.state().game);fail=true;g.tile(h.a);g.tile(h.b);assert.equal(g.state().game.moves,1);fail=false;
 const won=complete(p),raw=JSON.stringify(won);put('tradeoff:v1:daily:2026-10-30',raw);g.w.dispatchEvent(new g.w.StorageEvent('storage',{key:'tradeoff:v1:daily:2026-10-30',newValue:raw}));assert.equal(g.state().game.status,'won');assert.equal(g.state().game.moves,5);
 }finally{g.close();}
});
test('a revealed daily remains the first terminal when a stale tab attempts its final winning trade',()=>{
 const saved=storage(),stale=open(saved);let revealer;try{
 const p=stale.state().puzzle;for(let i=0;i<4;i++){const h=E.findHint(p,stale.state().game);stale.tile(h.a);stale.tile(h.b);}const last=E.findHint(p,stale.state().game);
 revealer=open(saved);revealer.$('#more-button').click();revealer.action('confirm-reveal');revealer.action('reveal');assert.equal(revealer.state().game.status,'revealed');
 stale.tile(last.a);stale.tile(last.b);assert.equal(stale.state().game.status,'revealed');assert.equal(JSON.parse(saved.getItem('tradeoff:v1:records'))['2026-10-30'].status,'revealed');
 }finally{stale.close();revealer?.close();}
});
