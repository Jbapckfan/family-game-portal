import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {MessageChannel} from 'node:worker_threads';
import * as playtest from './playtest.mjs';
const require=createRequire(new URL('../../packages/kimi-pebbles/package.json',import.meta.url));
const {JSDOM}=require('jsdom');

test('playtest note includes only selected public metadata and deliberate text',()=>{
  assert.equal(typeof playtest.buildPlaytestNote,'function');
  const text=playtest.buildPlaytestNote({slug:'shortlist',date:'2026-10-28',build:'abc123',feeling:'again',status:'won',note:'  Clear scans.  ',answer:'MAPLE',solution:[1,2,3]});
  assert.match(text,/Shortlist · Alford Daily/);assert.match(text,/2026-10-28/);assert.match(text,/abc123/);assert.match(text,/Play again/);assert.match(text,/Solved/);assert.match(text,/Clear scans\./);
  assert.doesNotMatch(text,/MAPLE|solution|1,2,3/);
  assert.throws(()=>playtest.buildPlaytestNote({slug:'missing',date:'2026-10-28'}),/game/i);
  assert.throws(()=>playtest.buildPlaytestNote({slug:'shortlist',date:'2026-02-30'}),/date/i);
  assert.doesNotMatch(playtest.buildPlaytestNote({slug:'shortlist',date:'2026-10-28',status:'ANSWER-LEAK',feeling:'RAW-LEAK'}),/LEAK/);
});

test('home note flow stays on-device, renders text safely and survives failed clipboard access',async()=>{
  const dom=new JSDOM(await readFile(new URL('./index.html',import.meta.url),'utf8'),{url:'https://daily.test/'}),win=dom.window,doc=win.document;
  try {
    assert.ok(doc.getElementById('playtest-form'),'real home exposes a feedback form');
    Object.defineProperty(win.navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}}});
    const before=win.localStorage.length;
    playtest.startPlaytest(doc,win,()=>({date:'2026-10-28',results:[{slug:'shortlist',status:'playing'}]}));
    doc.getElementById('playtest-game').value='shortlist';
    doc.getElementById('playtest-feeling').value='confusing';
    doc.getElementById('playtest-note').value='<img src=x onerror=alert(1)> scans';
    doc.getElementById('playtest-form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
    assert.equal(doc.getElementById('playtest-report').hidden,false);
    assert.match(doc.getElementById('playtest-text').value,/In progress/);
    assert.match(doc.getElementById('playtest-text').value,/<img/);
    assert.equal(doc.querySelector('#playtest-report img'),null);
    doc.getElementById('copy-playtest').click();await new Promise(setImmediate);
    assert.match(doc.getElementById('playtest-status').textContent,/select|copy/i);
    assert.equal(win.localStorage.length,before,'feedback never writes rewards, saves or tracking');
  }finally{win.close();}
});

test('first offline install waits for activation before claiming readiness',async()=>{
  const dom=new JSDOM(await readFile(new URL('./index.html',import.meta.url),'utf8'),{url:'https://daily.test/'}),win=dom.window,doc=win.document;
  try {
    const worker=new win.EventTarget();worker.state='installing';worker.scriptURL='https://daily.test/offline-worker.js';worker.postMessage=(_data,ports)=>ports[0].postMessage({ready:true,buildId:'a123'});
    win.MessageChannel=MessageChannel;
    const registration={scope:'https://daily.test/',installing:worker,waiting:null,active:null,update:async()=>{throw new Error('Redundant update must not turn a successful register into failure');}};
    Object.defineProperty(win,'isSecureContext',{value:true});
    win.fetch=async()=>({ok:true,json:async()=>({buildId:'a123',bytes:8000000})});
    Object.defineProperty(win.navigator,'serviceWorker',{value:{getRegistration:async()=>undefined,register:async()=>registration}});
    playtest.startPlaytest(doc,win,()=>({date:'2026-10-28',results:[]}));await new Promise(setImmediate);
    doc.getElementById('save-offline').click();await new Promise(setImmediate);
    worker.state='installed';worker.dispatchEvent(new win.Event('statechange'));await new Promise(setImmediate);
    assert.match(doc.getElementById('offline-status').textContent,/Saving the collection/);
    registration.active=worker;worker.state='activated';worker.dispatchEvent(new win.Event('statechange'));await new Promise(setImmediate);
    assert.match(doc.getElementById('offline-status').textContent,/Ready offline/);
  }finally{win.close();}
});

test('an active worker with an incomplete cache never earns a Ready offline claim',async()=>{
  const dom=new JSDOM(await readFile(new URL('./index.html',import.meta.url),'utf8'),{url:'https://daily.test/'}),win=dom.window,doc=win.document;
  try{
    let complete=false;const worker={scriptURL:'https://daily.test/offline-worker.js',postMessage:(_data,ports)=>ports[0].postMessage({ready:complete,buildId:'a123'})};
    const registration={scope:'https://daily.test/',active:worker,waiting:null,installing:null};
    win.MessageChannel=MessageChannel;Object.defineProperty(win,'isSecureContext',{value:true});
    win.fetch=async()=>({ok:true,json:async()=>({buildId:'a123',bytes:8000000})});
    Object.defineProperty(win.navigator,'serviceWorker',{value:{getRegistration:async()=>registration,register:async()=>registration}});
    playtest.startPlaytest(doc,win,()=>({date:'2026-10-28',results:[]}));await new Promise(resolve=>setTimeout(resolve,10));
    assert.doesNotMatch(doc.getElementById('offline-status').textContent,/edition is saved|Ready offline/);
    doc.getElementById('save-offline').click();await new Promise(resolve=>setTimeout(resolve,10));
    assert.doesNotMatch(doc.getElementById('offline-status').textContent,/Ready offline/);
    complete=true;doc.getElementById('save-offline').click();await new Promise(resolve=>setTimeout(resolve,10));
    assert.match(doc.getElementById('offline-status').textContent,/Ready offline/);
  }finally{win.close();}
});
