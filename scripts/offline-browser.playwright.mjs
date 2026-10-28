// Real Chromium worker/cache lifecycle on a routed HTTPS test origin; no server/listener.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {GAMES} from '../games/daily/catalog.mjs';
const root=path.resolve(import.meta.dirname,'..'),stage=path.resolve(process.env.DAILY_STAGE||path.join(root,'dist/private-playtest-prefix-20261028'));
const out=path.resolve(process.env.DAILY_OFFLINE_OUTPUT||path.join(root,'output/playwright/playtest-20261028'));await mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href);
const manifest=JSON.parse(await readFile(path.join(stage,'playtest-build.json'),'utf8'));
const workerSource=await readFile(path.join(stage,'offline-worker.js'),'utf8');
const browser=await chromium.launch({channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']});
const checks=[];
async function until(check,label){const deadline=Date.now()+30000;while(Date.now()<deadline){if(await check())return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(`Timed out: ${label}`);}
try {
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});let fail=false,corrupt=false,version='';
 ctx.on('serviceworker',worker=>worker.on('console',message=>console.log('WORKER',message.text())));
 const handler=async route=>{
  let name=new URL(route.request().url()).pathname;if(name.endsWith('/'))name+='index.html';
  if(fail&&name==='/app.mjs'&&route.request().serviceWorker())return route.abort('failed');
  if(corrupt&&name==='/app.mjs'&&route.request().serviceWorker())return route.fulfill({body:'new incompatible edition',contentType:'text/javascript'});
  if(name==='/offline-worker.js')return route.fulfill({body:workerSource.replaceAll(manifest.buildId,manifest.buildId+version),contentType:'text/javascript'});
  const file=path.resolve(stage,'.'+name);if(!file.startsWith(stage+path.sep))return route.abort();
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
  try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}
 };
 await ctx.route('https://daily.test/**',handler);
 let p=await ctx.newPage();p.setDefaultTimeout(20000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('https://daily.test/');await p.locator('.offline-tools summary').click();
 await p.waitForFunction(()=>!document.getElementById('save-offline').disabled);
 await p.evaluate(async()=>{localStorage.setItem('qa-preserved','old-save');await caches.open('unrelated-app');});
 fail=true;await p.locator('#save-offline').click();await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('did not finish'));
 assert.equal(await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration())?.active),false);checks.push('Interrupted first download never claims readiness');
 fail=false;await p.locator('#save-offline').click();
 try{await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('Ready offline'),null,{timeout:30000});}
 catch(error){console.log(await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {status:document.getElementById('offline-status').textContent,active:r?.active?.state,installing:r?.installing?.state,waiting:r?.waiting?.state,caches:await caches.keys()};}));throw error;}
 assert.equal(await p.evaluate(()=>localStorage.getItem('qa-preserved')),'old-save');checks.push('All byte-verified assets downloaded through real service worker');
 const activeCache=`alford-offline:https://daily.test/:${manifest.buildId}`;
 await p.evaluate(async key=>{await (await caches.open(key)).delete('https://daily.test/app.mjs');},activeCache);
 corrupt=true;await p.locator('#save-offline').click();await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('did not finish'));
 assert.equal(await p.evaluate(async key=>!!await (await caches.open(key)).match('https://daily.test/app.mjs'),activeCache),false);
 checks.push('Lost-cache retry rejects changed network bytes and never claims readiness');
 corrupt=false;await p.locator('#save-offline').click();await p.waitForFunction(()=>document.getElementById('offline-status').textContent.includes('Ready offline'),null,{timeout:30000});
 assert.equal(await p.evaluate(async key=>!!await (await caches.open(key)).match('https://daily.test/app.mjs'),activeCache),true);checks.push('Real active worker repairs a lost entry using verified same-edition bytes');
 await p.locator('.offline-tools').screenshot({path:path.join(out,'chromium-offline-ready.png')});
 // Remove every route BEFORE taking the browser offline, so no route can fake a cache hit.
 await ctx.unroute('https://daily.test/**',handler);await ctx.setOffline(true);await p.close();p=await ctx.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});await p.goto('https://daily.test/');await p.waitForFunction(()=>document.querySelectorAll('[data-collection] [data-game]').length===32);
 checks.push('Cold offline home launch with all network routes removed');
 for(const game of GAMES){
  await p.goto(`https://daily.test/games/${game.slug}/`);
  const selector=game.runtime==='kimi'?"#root [data-game-ready='true']":game.runtime!=='alford'?"#puzzle[data-game-ready='true']":game.slug==='tradeoff'?'#board':'#puzzle';
  await p.waitForFunction(selector=>document.querySelector(selector)?.childElementCount>0,selector);
  assert.ok((await p.locator('body').innerText()).length>100,game.slug);
 }
 checks.push('All 32 actual daily game pages boot with browser offline and no test routing');
 await p.goto('https://daily.test/games/nested-tic-tac-toe/');await p.waitForFunction(()=>document.getElementById('puzzle')?.dataset.gameReady==='true');await p.locator('#detail-board [data-cell="0"]').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('alford:tic-tac-toe:v1:match'))?.history?.length===2);const bonusSaved=await p.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match'));await p.reload();assert.equal(await p.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match')),bonusSaved);checks.push('Bonus boots, completes a human/AI turn and restores the match offline');
 await p.goto('https://daily.test/games/shortlist/');await p.locator('[data-letter="A"]').click();await p.locator('[data-letter="E"]').click();await p.locator('#scan-button').click();
 const saved=await p.evaluate(()=>localStorage.getItem('shortlist:v1:daily:2026-10-28'));await p.reload();assert.equal(await p.evaluate(()=>localStorage.getItem('shortlist:v1:daily:2026-10-28')),saved);checks.push('Real scan and unfinished save survive offline reload');
 await p.goto('https://daily.test/');await p.waitForFunction(()=>!document.getElementById('share-today').disabled);
 await p.clock.setSystemTime(new Date('2026-10-29T18:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await p.waitForFunction(()=>document.getElementById('today-date').dateTime==='2026-10-29');
 assert.equal(await p.evaluate(()=>localStorage.getItem('shortlist:v1:daily:2026-10-28')),saved);assert.equal(await p.evaluate(()=>localStorage.getItem('qa-preserved')),'old-save');checks.push('Offline Central date advances while prior saves stay intact');
 // Synthetic second worker version exercises browser waiting/activation without changing source.
 await ctx.setOffline(false);version='-qa-update';await ctx.route('https://daily.test/**',handler);
 // Chromium's routed-origin harness cannot intercept update fetches for an identical
 // script URL. A query distinguishes this synthetic candidate; lifecycle/cache code is real.
 await p.evaluate(()=>navigator.serviceWorker.register('./offline-worker.js?qa=update',{scope:'./',updateViaCache:'none'}));
 await until(()=>p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting),'updated worker installed and waiting');
 assert.equal(await p.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting),true);
 const cacheKeys=await p.evaluate(()=>caches.keys());assert.ok(cacheKeys.includes(`alford-offline:https://daily.test/:${manifest.buildId}`));checks.push('Update waits without replacing the active edition or open game');
 await p.close();p=await ctx.newPage();await p.goto('https://daily.test/');await until(()=>p.evaluate(async()=>!(await navigator.serviceWorker.getRegistration()).waiting),'updated worker activated');
 const finalKeys=await p.evaluate(()=>caches.keys());assert.ok(finalKeys.includes('unrelated-app'));assert.ok(!finalKeys.includes(`alford-offline:https://daily.test/:${manifest.buildId}`));
 assert.equal(await p.evaluate(()=>localStorage.getItem('shortlist:v1:daily:2026-10-28')),saved);checks.push('Closing tabs activates next edition, retires only own old cache, preserves saves');
 assert.deepEqual(errors,[]);await ctx.close();
}catch(error){checks.push({failed:error.stack});process.exitCode=1;}finally{await browser.close();}
await writeFile(path.join(out,'offline-browser-results.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks,null,2));
