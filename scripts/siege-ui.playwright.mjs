import assert from 'node:assert/strict';import path from 'node:path';import {writeFile} from 'node:fs/promises';
const root=process.cwd(),out='output/siege-ui-20261104',pw=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs'),results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 async function setup(width=393){const ctx=await browser.newContext({viewport:{width,height:950},hasTouch:true,reducedMotion:'reduce'});await ctx.route('https://siege.test/**',async route=>{let name=new URL(route.request().url()).pathname;if(name==='/api/feedback'){const body=route.request().postDataJSON();return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({received:true,receipt:{id:body.id,receivedAt:'2026-11-04T12:00:00.000Z'}})});}if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);assert.ok(file.startsWith(root+'/games/'));try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-11-04T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-04T12:00:01Z'));await page.goto('https://siege.test/games/qwen-syntax-siege/');await page.locator('#siege-start').waitFor();return {ctx,page,errors};}
 async function run(name,fn,width){let e;try{e=await setup(width);await fn(e.page);assert.deepEqual(e.errors,[]);results.push({engine,name,passed:true});}catch(error){results.push({engine,name,passed:false,error:error.stack});}finally{await e?.ctx.close();}console.log(JSON.stringify(results.at(-1)));}
 const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('qwen-syntax-siege:v1:daily:2026-11-04')).state);
 const pos=page=>page.locator('#siege-enemy').evaluate(e=>parseFloat(e.style.getPropertyValue('--approach')));
 await run('automatic-pace-switch-save-real-timeout',async page=>{
  await page.locator('#siege-start').tap();assert.match(await page.locator('#siege-pace').innerText(),/Tile entry/);assert.equal(await page.locator('#siege-clock').innerText(),'30s');
  await page.evaluate(()=>window.testRack=document.querySelector('.siege-rack'));
  await page.clock.runFor(15000);assert.equal((await state(page)).remainingMs,10000);assert.ok(await page.evaluate(()=>window.testRack===document.querySelector('.siege-rack')),'fractional timer must not rebuild controls');
  await page.locator('[data-letter="0"]').tap();const before=await pos(page),letter=(await page.locator('[data-letter="1"]').innerText()).trim();await page.keyboard.type(letter);
  assert.match(await page.locator('#siege-pace').innerText(),/Keyboard/);assert.equal((await state(page)).remainingMs,10000);assert.equal(await pos(page),before);assert.equal(await page.locator('#siege-clock').innerText(),'10s');
  await page.reload();assert.equal((await state(page)).inputMode,'keyboard');assert.equal((await state(page)).inputHistory,3);
  await page.clock.runFor(10000);assert.equal((await state(page)).timeouts,1);assert.match(await page.locator('.siege-hp').innerText(),/^80/);
 });
 await run('practice-moves-loops-pauses-and-six-wave-win',async page=>{
  await page.locator('#practice-mode').click();await page.locator('#siege-start').tap();const begin=await pos(page);
  await page.clock.runFor(6000);const moved=await pos(page);assert.ok(moved<begin);
  await page.locator('[data-letter="0"]').tap();assert.equal(await pos(page),moved,'typing/tapping must not reset cosmetic approach');
  await page.locator('#game-help').click();await page.clock.runFor(10000);assert.equal(await pos(page),moved);await page.locator('#close-help').click();
  await page.clock.runFor(65000);assert.match(await page.locator('.siege-hp').innerText(),/^100/);assert.equal(await page.locator('#siege-clock').innerText(),'Untimed');assert.notEqual(await pos(page),begin);
  await page.locator('#siege-clear').click();
  const words=await page.evaluate(async()=>{const {PUZZLES}=await import('/games/qwen-syntax-siege/puzzles.mjs');const raw=JSON.parse(localStorage.getItem('qwen-syntax-siege:v1:practice'));return PUZZLES.find(p=>p.id===raw.puzzleId).waves.map(w=>w.words[0]);});
  for(const word of words){await page.locator('#puzzle').focus();await page.keyboard.type(word);await page.keyboard.press('Enter');}
  await page.locator('#result').waitFor({state:'visible'});assert.match(await page.locator('#result-heading').innerText(),/That’s the one/);assert.match(await page.locator('#result-summary').innerText(),/100 core HP/);await page.reload();const restored=await page.evaluate(async()=>{const E=await import('/games/qwen-syntax-siege/engine.mjs'),{PUZZLES}=await import('/games/qwen-syntax-siege/puzzles.mjs'),raw=JSON.parse(localStorage.getItem('qwen-syntax-siege:v1:practice')),p=PUZZLES.find(p=>p.id===raw.puzzleId);return E.getStatus(p,E.restoreState(p,raw.state));});assert.equal(restored,'won');
 });
 await run('daily-keyboard-win-share-and-reload',async page=>{
  await page.locator('#siege-start').click();
  const words=await page.evaluate(async()=>{const {PUZZLES}=await import('/games/qwen-syntax-siege/puzzles.mjs'),raw=JSON.parse(localStorage.getItem('qwen-syntax-siege:v1:daily:2026-11-04'));return PUZZLES.find(p=>p.id===raw.puzzleId).waves.map(w=>w.words[0]);});
  for(const word of words){await page.keyboard.type(word);await page.keyboard.press('Enter');}
  await page.locator('#result').waitFor({state:'visible'});assert.equal((await state(page)).inputHistory,1,'clicking Start must not falsely record mixed word entry');
  await page.reload();await page.locator('#result').waitFor({state:'visible'});assert.match(await page.locator('#result-heading').innerText(),/That’s the one/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.resultCopy=text},configurable:true});});await page.locator('#game-share').click();const share=await page.evaluate(()=>window.resultCopy);assert.match(share,/Keyboard entry/);for(const word of words)assert.ok(!share.includes(word));
 });
 await run('suggestion-save-draft-copy-reload-and-failure',async page=>{
  await page.locator('#siege-start').tap();await page.clock.runFor(3000);const remaining=(await state(page)).remainingMs;
  await page.locator('[data-feedback-shortcut]').click();await page.locator('#suggestion-text').fill('Test suggestion: clearer wave transitions.');await page.clock.runFor(10000);assert.equal((await state(page)).remainingMs,remaining,'feedback pauses the game');
  await page.locator('#puzzle').focus();await page.reload();assert.equal(await page.locator('#suggestion-text').inputValue(),'Test suggestion: clearer wave transitions.');
  await page.locator('#suggestion-save').click();await page.waitForFunction(()=>!document.querySelector('#suggestion-save').disabled);assert.match(await page.locator('#suggestion-status').innerText(),/submitted successfully/);assert.equal(await page.locator('#suggestion-text').inputValue(),'');
  await page.locator('#puzzle').focus();await page.reload();assert.equal(await page.locator('#suggestion-count').innerText(),'(1)');
  await page.locator('#suggestion-history summary').click();assert.match(await page.locator('#suggestion-list').innerText(),/clearer wave transitions/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.savedCopy=text},configurable:true});});await page.locator('#suggestion-copy').click();assert.match(await page.evaluate(()=>window.savedCopy),/Syntax Siege/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true});});await page.locator('#suggestion-copy').click();assert.match(await page.locator('#suggestion-export').inputValue(),/clearer wave transitions/);
  await page.locator('#suggestion-text').fill('Keep this text if storage fails.');await page.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('Quota');};});await page.route('**/api/feedback',route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));await page.locator('#suggestion-save').click();await page.waitForFunction(()=>!document.querySelector('#suggestion-save').disabled);assert.match(await page.locator('#suggestion-status').innerText(),/Could not submit/);assert.equal(await page.locator('#suggestion-text').inputValue(),'Keep this text if storage fails.');
 });
 for(const width of [320,393,1200])await run(`layout-${width}`,async page=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const sizes=await page.locator('.siege-rack .tile').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert.ok(sizes.every(s=>s.w>=44&&s.h>=44),JSON.stringify(sizes));
  await page.screenshot({path:`${out}/${engine}-${width}-ready.png`,fullPage:true});await page.locator('#siege-start').tap();await page.clock.runFor(5000);await page.screenshot({path:`${out}/${engine}-${width}-playing.png`,fullPage:true});
 },width);
 await browser.close();
}
await writeFile(`${out}/browser-results.json`,JSON.stringify(results,null,2)+'\n');assert.ok(results.every(r=>r.passed),'Browser failures');
