import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const pw=await import(process.env.DAILY_PLAYWRIGHT_MODULE?pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE).href:'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=process.env.DAILY_LAUNCH_OUTPUT||path.join(root,'output/launch-quality');await mkdir(out,{recursive:true});
const rows=[];
for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
  p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await context.route('https://daily.test/**',async route=>{
   let name=decodeURIComponent(new URL(route.request().url()).pathname);if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))return route.abort();
   const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
   try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}
  });
  await p.clock.install({time:new Date('2026-11-01T04:59:40Z')});
  await p.addInitScript(()=>{
   const set=Storage.prototype.setItem;
   window.__writeFailure=false;window.__shares=[];
   Storage.prototype.setItem=function(k,v){if(window.__writeFailure)throw new DOMException('QA quota','QuotaExceededError');return set.call(this,k,v);};
   Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:async payload=>{window.__shares.push(payload);if(window.__cancelShare)throw new DOMException('Canceled','AbortError');}});
  });
  await p.goto('https://daily.test/games/daily/');
  await p.waitForFunction(()=>document.getElementById('progress-count')?.textContent.includes('solved'));
  assert.equal(await p.locator('#todays-three [data-game]').count(),3);
  assert.equal(await p.locator('#featured-games [data-game]').count(),4);
  assert.equal(await p.locator('[data-collection] [data-game]').count(),32);
  const before=await p.locator('#todays-three [data-game]').evaluateAll(es=>es.map(e=>e.dataset.game));
  assert.equal(new Set(before).size,3);
  await p.evaluate(()=>{window.__focusedPick=document.querySelector('#todays-three [data-game]');window.__focusedPick.focus();window.dispatchEvent(new Event('pageshow'));});
  await p.waitForFunction(()=>!document.getElementById('share-today').disabled);
  assert.equal(await p.evaluate(()=>document.activeElement===window.__focusedPick),true,'same-day refresh preserves keyboard focus in Today’s Three');
  await p.locator('[data-creator-filter="Kimi"]').click();
  assert.equal(await p.locator('[data-collection] [data-game]:visible').count(),6);
  assert.equal(await p.locator('#todays-three [data-game]:visible').count(),3);
  await p.locator('#browse-all').click();assert.equal(await p.locator('[data-collection] [data-game]:visible').count(),32);
  await p.evaluate(()=>{localStorage.setItem('counterpart:v1:records',JSON.stringify({'2026-11-01':{status:'won',attempts:5,hints:0}}));localStorage.setItem('qa-preserved-wallet','213');});
  await p.clock.fastForward(30000);await p.waitForFunction(()=>document.getElementById('today-date').dateTime==='2026-11-01');
  const after=await p.locator('#todays-three [data-game]').evaluateAll(es=>es.map(e=>e.dataset.game));
  assert.deepEqual(after,['counterpart','shortlist','second-sense']);assert.notDeepEqual(after,before);
  await p.waitForFunction(()=>document.querySelector('#todays-three [data-game="counterpart"] [data-status-label]').textContent==='Solved');
  const saved=await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
  await p.evaluate(()=>{window.__cancelShare=true;window.__writeFailure=true;});await p.locator('#share-today').click();
  assert.deepEqual(await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))),saved);
  const share=await p.evaluate(()=>window.__shares.at(-1));assert.match(share.text,/2026-11-01/);assert.match(share.text,/Counterpart: Solved/);assert.doesNotMatch(share.text,/solution|cuts|MAPLE|ACORN|\[\d+(?:,\d+)+\]/i);
  await p.evaluate(()=>{navigator.share=async()=>{throw new Error('QA share unavailable');};});await p.locator('#share-today').click();
  assert.equal(await p.locator('#share-text').inputValue(),share.text);
  await p.clock.setSystemTime(new Date('2026-11-02T06:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await p.waitForFunction(()=>document.getElementById('today-date').dateTime==='2026-11-02');
  assert.equal(await p.locator('#share-fallback').isHidden(),true,'rollover removes an old manual-copy summary');
  await p.clock.setSystemTime(new Date('2026-11-01T18:00:00Z'));
  await p.evaluate(()=>window.__writeFailure=false);await p.reload();await p.waitForFunction(()=>document.getElementById('progress-count')?.textContent.includes('solved'));
  assert.deepEqual(await p.locator('#todays-three [data-game]').evaluateAll(es=>es.map(e=>e.dataset.game)),after);
  assert.equal(await p.evaluate(()=>localStorage.getItem('qa-preserved-wallet')),'213');
  await p.clock.setSystemTime(new Date('2026-11-01T04:59:40Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await p.waitForFunction(()=>document.getElementById('today-date').dateTime==='2026-10-31');
  assert.deepEqual(await p.locator('#todays-three [data-game]').evaluateAll(es=>es.map(e=>e.dataset.game)),before);
  await p.clock.setSystemTime(new Date('2026-11-01T18:00:00Z'));await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await p.waitForFunction(()=>document.getElementById('today-date').dateTime==='2026-11-01');
  const captureTime=new Date();await p.clock.setSystemTime(captureTime);await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await p.waitForFunction(()=>!document.getElementById('share-today').disabled);
  await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
  await p.locator('.ritual-section').screenshot({path:path.join(out,engine+'-today-phone.png')});
  await p.setViewportSize({width:320,height:568});await p.screenshot({path:path.join(out,engine+'-today-320.png'),fullPage:false});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:path.join(out,engine+'-today-desktop.png'),fullPage:false});
  await p.locator('.featured-section').screenshot({path:path.join(out,engine+'-featured.png')});
  assert.deepEqual(errors,[]);await context.close();rows.push({engine,passed:true,checks:['three distinct available games','four featured','all 32 accessible','creator filter isolation','Central midnight and clock rollback','status consistency','cancel share and failed writes preserve saves','reload','320px and reduced motion']});
 }catch(e){rows.push({engine,passed:false,error:e.stack});process.exitCode=1;}finally{await browser.close();}
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
