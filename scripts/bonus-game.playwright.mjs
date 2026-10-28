import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {createGame,legalMoves,restoreMatch} from '../games/nested-tic-tac-toe/engine.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/playwright/product-20261028');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),rows=[];
for(const name of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[name].launch(name==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
  await context.route('https://daily.test/**',async route=>{let name=new URL(route.request().url()).pathname;if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name),types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};try{if(!file.startsWith(root+path.sep))throw new Error();await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}});
  await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});await p.clock.pauseAt(new Date('2026-10-28T18:00:01Z'));
  await p.addInitScript(()=>{window.__shares=[];Object.defineProperty(navigator,'share',{value:async payload=>{window.__shares.push(payload);throw new DOMException('Canceled','AbortError');}});const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__denyMatchSave&&k==='alford:tic-tac-toe:v1:match')throw new DOMException('QA quota','QuotaExceededError');return set.call(this,k,v);};});
  await p.goto('https://daily.test/games/daily/');assert.equal(await p.locator('[data-bonus="nested-tic-tac-toe"]').count(),1);assert.equal(await p.locator('[data-collection] [data-game]').count(),32);
  await p.evaluate(()=>localStorage.setItem('shortlist:v1:records',JSON.stringify({'2026-10-28':{status:'won',scans:2,hints:0}})));
  const daily=await p.evaluate(()=>localStorage.getItem('shortlist:v1:records'));
  await p.locator('[data-bonus]').click();await p.waitForFunction(()=>document.getElementById('puzzle').dataset.gameReady==='true');
  const read=async()=>{const raw=await p.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match'));return raw?restoreMatch(JSON.parse(raw)).state:createGame();};
  assert.equal(await p.locator('.mini-board').count(),9);assert.equal(await p.locator('#detail-board button').count(),9);
  await p.locator('[data-skill="casual"]').click();await p.locator('.mini-board').nth(2).click();await p.clock.runFor(32);const detail=await p.locator('#detail-panel').boundingBox();assert.ok(detail.y>=-1&&detail.y+detail.height<=845,`selected playable board scrolls into the phone viewport: ${JSON.stringify(detail)}`);await p.screenshot({path:path.join(out,`${name}-nine-board-phone.png`)});await p.locator('#detail-board [data-cell="0"]').click();
  assert.equal((await read()).turn,'O');assert.equal((await read()).forcedBoard,0);assert.equal(await p.locator('#detail-board button:enabled').count(),0);
  await p.reload();await p.clock.runFor(350);assert.equal((await read()).history.length,2,'AI resumes exact interrupted match');
  // Start again, then cancel a queued AI callback through actual controls.
  await p.locator('#new-match-button').click();await p.locator('#confirm-restart').click();await p.locator('#detail-board [data-cell="4"]').click();
  await p.locator('#new-match-button').click();await p.locator('#confirm-restart').click();await p.clock.runFor(1000);assert.equal((await read()).history.length,0,'stale callback cannot alter replay');
  await p.evaluate(()=>window.__denyMatchSave=true);await p.locator('#detail-board [data-cell="0"]').click();assert.match(await p.locator('#storage-warning').innerText(),/cannot save/);await p.clock.runFor(350);await p.evaluate(()=>window.__denyMatchSave=false);
  await p.locator('#new-match-button').click();await p.locator('#confirm-restart').click();
  await p.setViewportSize({width:320,height:568});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const box=await p.locator('#detail-board button').first().boundingBox();assert.ok(box.width>=44&&box.height>=44);
  await p.setViewportSize({width:1100,height:1000});await p.locator('#puzzle').screenshot({path:path.join(out,`${name}-nine-board-opening.png`)});
  let state=await read(),turns=0;
  while(state.status==='playing'&&turns++<81){
   const move=legalMoves(state)[0];await p.locator('.mini-board').nth(move.board).click();await p.locator(`#detail-board [data-cell="${move.cell}"]`).click();
   const human=await read();if(human.status==='playing'){
    assert.equal(human.turn,'O');assert.equal(await p.locator('#detail-board button:enabled').count(),0);await p.clock.runFor(350);
   }
   const next=await read();assert.ok(next.history.length>state.history.length);state=next;
  }
  assert.notEqual(state.status,'playing');assert.ok(await p.locator('.board-overlay:not([hidden])').count()>0);
  const ended=await p.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match'));await p.locator('#share-button').click();assert.equal(await p.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match')),ended);
  const shared=await p.evaluate(()=>window.__shares.at(-1));assert.doesNotMatch(shared.text,/history|cells|\[|\]/);await p.reload();assert.equal((await read()).status,state.status);
  await p.locator('#puzzle').screenshot({path:path.join(out,`${name}-nine-board-finished.png`)});
  assert.equal(await p.evaluate(()=>localStorage.getItem('shortlist:v1:records')),daily,'bonus never changes daily records');
  await p.goto('https://daily.test/games/daily/');await p.waitForFunction(()=>document.getElementById('progress-count').textContent.startsWith('1 of 32'));
  assert.deepEqual(errors,[]);rows.push({engine:name,passed:true,match:state.status,moves:state.history.length,checks:['opening free choice','forced AI board','AI-turn input guard','reload during AI','stale callback after restart','save failure','320px/44px targets','complete real UI match','claimed overlays','canceled spoiler-free share','daily records unchanged']});await context.close();
 }catch(error){rows.push({engine:name,error:error.stack});process.exitCode=1;}finally{await browser.close();}
}
await writeFile(path.join(out,'bonus-browser-results.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
