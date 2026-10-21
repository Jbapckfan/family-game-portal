import test from 'node:test';
import assert from 'node:assert/strict';
import {mountDailyGame} from './common.mjs';

// A small DOM/event harness exercises the real shell's lifecycle, not a copy
// of its clock logic. Real layouts and game interactions are checked in-browser.
function environment(){
 const saved=Object.fromEntries(['document','window','performance'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let now=0,nextTimer=0;const timers=new Map(),elements=new Map(),messages=[];
 class Target{
  constructor(){this.listeners=new Map();}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of [...this.listeners.get(type)||[]])fn(event);}
 }
 class Element extends Target{
  constructor(id,tag='div'){super();this.id=id;this.tagName=tag.toUpperCase();this.dataset={};this.style={setProperty(){}};this.classList={add(){}};this.attributes={};this.value='';this.selectionStart=0;this.selectionEnd=0;}
  set innerHTML(html){this.html=html;for(const match of html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g))elements.set(match[2],new Element(match[2],match[1]));}
  get innerHTML(){return this.html||'';}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelectorAll(){return [];}
  contains(el){return Boolean(el&&this.innerHTML.includes(`id="${el.id}"`));}
  focus(){doc.activeElement=this;}
  setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
 }
 const doc=new Target();doc.hidden=false;doc.body=new Element('body');doc.documentElement=new Element('html');doc.getElementById=id=>elements.get(id);doc.activeElement=doc.body;elements.set('app',new Element('app'));
 const win=new Target();const data=new Map();win.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};win.__ALFORD_NATIVE__={platform:'ios'};win.webkit={messageHandlers:{alford:{postMessage:p=>messages.push(p)}}};win.setInterval=fn=>{timers.set(++nextTimer,fn);return nextTimer;};win.clearInterval=id=>timers.delete(id);
 Object.defineProperty(globalThis,'document',{configurable:true,value:doc});Object.defineProperty(globalThis,'window',{configurable:true,value:win});Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});
 const config={id:'qwen-shell-fixture',name:'Fixture',creator:'Qwen',credit:'Developed by Qwen',intro:'A timer fixture.',instructions:['Play.'],puzzles:[{id:'one'},{id:'two'}],createState:()=>({elapsed:0,revealed:false}),restoreState:(p,s)=>s&&Number.isFinite(s.elapsed)&&s.elapsed>=0&&typeof s.revealed==='boolean'?{...s}:null,getStatus:(p,s)=>s.revealed?'revealed':s.elapsed>=20000?'won':'playing',render:({root,state})=>{root.innerHTML='<input id="fixture-word">';elements.get('fixture-word').value='WORD';},tick:(p,s,delta)=>({...s,elapsed:s.elapsed+delta}),reveal:(p,s)=>({...s,revealed:true})};
 return {doc,win,elements,messages,timers,config,advance(ms){now+=ms;for(const fn of [...timers.values()])fn();},restore(){for(const [k,d]of Object.entries(saved)){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};
}

test('clock pauses while hidden or in help, statistics, and reveal dialogs, without charging that time later',()=>{
 const e=environment();let shell;try{
  shell=mountDailyGame(e.config);e.advance(500);assert.equal(shell.session.state.elapsed,500);
  e.doc.hidden=true;e.doc.emit('visibilitychange');e.advance(9000);assert.equal(shell.session.state.elapsed,500);
  e.doc.hidden=false;e.doc.emit('visibilitychange');e.advance(500);assert.equal(shell.session.state.elapsed,1000);
  for(const [open,close]of [['game-help','close-help'],['game-stats','close-stats'],['game-reveal','cancel-reveal']]){e.elements.get(open).emit('click');e.advance(8000);assert.equal(shell.session.state.elapsed,1000);e.elements.get(close).emit('click');}
  e.advance(500);assert.equal(shell.session.state.elapsed,1500);
 }finally{shell?.destroy();e.restore();}
});
test('back-forward cache retains the clock; disposal clears it and listeners',()=>{
 const e=environment();let shell;try{
  shell=mountDailyGame(e.config);e.advance(500);e.win.emit('pagehide',{persisted:true});e.win.emit('pageshow',{persisted:true});e.advance(500);assert.equal(shell.session.state.elapsed,1000);assert.equal(e.timers.size,1);
  e.win.emit('pagehide',{persisted:false});e.advance(500);assert.equal(shell.session.state.elapsed,1000);assert.equal(e.timers.size,0);assert.equal(e.win.listeners.get('pageshow')?.size,0);assert.equal(e.doc.listeners.get('visibilitychange')?.size,0);
 }finally{shell?.destroy();e.restore();}
});
test('clock renders retain the focused word input and caret',()=>{
 const e=environment();let shell;try{
  shell=mountDailyGame(e.config);const old=e.elements.get('fixture-word');old.focus();old.setSelectionRange(2,3);e.advance(500);
  assert.notEqual(e.elements.get('fixture-word'),old);assert.equal(e.doc.activeElement,e.elements.get('fixture-word'));assert.equal(e.doc.activeElement.selectionStart,2);assert.equal(e.doc.activeElement.selectionEnd,3);
 }finally{shell?.destroy();e.restore();}
});
test('ready native board has correct attribution and shares no solution text',()=>{
 const e=environment();let shell;try{
  shell=mountDailyGame({...e.config,summarize:()=> 'SECRET ANSWER'});assert.match(e.elements.get('app').innerHTML,/Developed by Qwen/);assert.equal(e.doc.body.dataset.gameCreator,'Qwen');assert.equal(e.doc.documentElement.dataset.native,'true');assert.equal(e.elements.get('puzzle').dataset.gameReady,'true');assert.equal(e.messages[0].type,'progress');
  e.elements.get('game-reveal').emit('click');e.elements.get('confirm-reveal').emit('click');e.elements.get('game-share').emit('click');const share=e.messages.find(m=>m.type==='share');assert.ok(share);assert.match(share.text,/Revealed/);assert.doesNotMatch(share.text,/SECRET|ANSWER/);assert.equal(shell.session.stats.won,0);
 }finally{shell?.destroy();e.restore();}
});
