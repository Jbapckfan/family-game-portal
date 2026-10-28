import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';

const source=await readFile(new URL('../games/daily/offline-worker.js',import.meta.url),'utf8').catch(()=>'');
const sha=body=>createHash('sha256').update(body).digest('hex');
function harness({failure,scope='https://daily.test/beta/',previous=true}={}) {
  const handlers={},stores=new Map(),prefix=`alford-offline:${scope}:`;
  if(previous)stores.set(prefix+'previous',new Map());stores.set('another-app',new Map());
  const files={'index.html':'home','games/shortlist/index.html':'game','app.mjs':'module'};
  const manifest={buildId:'new',assets:Object.entries(files).map(([url,body])=>({url,sha256:sha(body)}))};
  let claims=0;
  const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{
    if(!stores.has(key))stores.set(key,new Map());const store=stores.get(key);
    return {put:async(request,response)=>store.set(String(request.url||request),response.clone()),match:async request=>store.get(String(request.url||request))?.clone()};
  }};
  vm.runInNewContext(source.replace('/* OFFLINE_MANIFEST */ null',JSON.stringify(manifest)),{self:{registration:{scope},clients:{claim:async()=>claims++},addEventListener:(name,fn)=>{handlers[name]=fn;},skipWaiting:()=>{throw new Error('must not interrupt open games');}},caches,URL,Request,Response,crypto:webcrypto,fetch:async request=>{
    const relative=new URL(request.url).pathname.slice(new URL(scope).pathname.length);
    if(failure==='network'&&relative==='app.mjs')throw new Error('offline');
    return new Response(failure==='bytes'&&relative==='app.mjs'?'login page':files[relative]);
  }});
  return {handlers,stores,prefix,claims:()=>claims,async message(type){assert.equal(typeof handlers.message,'function');let promise,result;handlers.message({data:{type},ports:[{postMessage:value=>result=value}],waitUntil:value=>promise=value});await promise;return result;},async lifecycle(name){assert.equal(typeof handlers[name],'function',`${name} handler exists`);let promise;handlers[name]({waitUntil:value=>promise=value});await promise;},async fetch(url,method='GET'){assert.equal(typeof handlers.fetch,'function');let response;handlers.fetch({request:new Request(url,{method}),respondWith:value=>response=value});return response&&await response;}};
}

test('complete byte-verified offline edition serves cold directory navigation and ignores unrelated requests',async()=>{
  const h=harness();await h.lifecycle('install');assert.equal(h.claims(),0);
  assert.equal(h.stores.get(h.prefix+'new').size,3);await h.lifecycle('activate');
  assert.equal(h.claims(),1);assert.equal(h.stores.has(h.prefix+'previous'),false);assert.equal(h.stores.has('another-app'),true);
  assert.equal(await (await h.fetch('https://daily.test/beta/')).text(),'home');
  assert.equal(await (await h.fetch('https://daily.test/beta/games/shortlist/?practice=1')).text(),'game');
  assert.equal(await h.fetch('https://daily.test/admin/'),undefined);
  assert.equal(await h.fetch('https://daily.test/beta/private.json'),undefined);
  assert.equal(await h.fetch('https://other.test/beta/'),undefined);
  assert.equal(await h.fetch('https://daily.test/beta/','POST'),undefined);
});
for(const failure of ['network','bytes'])test(`failed ${failure} install preserves previous edition and removes partial download`,async()=>{
  const h=harness({failure});await assert.rejects(h.lifecycle('install'),/offline|integrity/);
  assert.equal(h.stores.has(h.prefix+'new'),false);assert.equal(h.stores.has(h.prefix+'previous'),true);assert.equal(h.claims(),0);
});

test('readiness detects lost cache entries and repair verifies the exact active edition',async()=>{
  const h=harness();await h.lifecycle('install');
  assert.equal((await h.message('OFFLINE_CHECK')).ready,true);
  h.stores.get(h.prefix+'new').delete('https://daily.test/beta/app.mjs');
  assert.equal((await h.message('OFFLINE_CHECK')).ready,false);
  assert.equal((await h.message('OFFLINE_REPAIR')).ready,true);
  assert.equal(await (await h.fetch('https://daily.test/beta/app.mjs')).text(),'module');
});

test('a missing old module never consumes newer unverified server bytes',async()=>{
  const h=harness({failure:'bytes'});
  const old=new Map([['https://daily.test/beta/index.html',new Response('home')]]);
  h.stores.set(h.prefix+'new',old);
  const result=await h.fetch('https://daily.test/beta/app.mjs');
  assert.equal(result.status,503);
  assert.equal(old.has('https://daily.test/beta/app.mjs'),false);
  assert.equal((await h.message('OFFLINE_REPAIR')).ready,false);
});
