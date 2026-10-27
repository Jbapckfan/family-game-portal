import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {startHome} from './app.mjs';
const require=createRequire(new URL('../../packages/kimi-pebbles/package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
for(const service of ['share','clipboard'])test(`late ${service} rejection cannot restore yesterday’s summary`,async()=>{
  const RealDate=globalThis.Date;let instant='2026-11-01T04:59:59Z';
  globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[instant]));}static now(){return new RealDate(instant).getTime();}};
  const dom=new JSDOM(html,{url:'https://daily.test/games/daily/'}),win=dom.window,doc=win.document;
  let reject;
  const delayed=()=>new Promise((_,fail)=>{reject=fail;});
  Object.defineProperty(win.navigator,service,{configurable:true,value:service==='share'?delayed:{writeText:delayed}});
  try{
    const home=startHome(doc,win);await home.refresh();
    doc.getElementById('share-today').click();assert.equal(typeof reject,'function');
    instant='2026-11-01T05:00:01Z';await home.refresh();
    reject(new Error('QA unavailable'));await new Promise(setImmediate);
    assert.equal(doc.getElementById('share-fallback').hidden,true);
    assert.equal(doc.getElementById('share-text').value,'');
    assert.equal(win.localStorage.length,0,'sharing and rollover never write a score or reward');
  }finally{win.close();globalThis.Date=RealDate;}
});
