// Real browser checks on isolated, routed HTTPS. No listener or social send.
import path from 'node:path';import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/second-sense-review-20261030');await mkdir(out,{recursive:true});
const results=[];
for(const [name,type] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chromium'?{channel:'chrome',headless:true}:{headless:true,...(process.env.WEBKIT_EXECUTABLE_PATH?{executablePath:process.env.WEBKIT_EXECUTABLE_PATH}:{})});
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 await ctx.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='https://alford-daily.test')return route.abort();let n=u.pathname;if(n.endsWith('/'))n+='index.html';const file=path.resolve(root,'.'+n);if(!file.startsWith(root+path.sep))return route.abort();const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'};try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=description=>results.push({browser:name,description,pass:true});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('second-sense:v1:daily:2026-10-30')));
 const tick=()=>page.clock.runFor(25);
 const fresh=async()=>{await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.clock.setSystemTime(new Date('2026-10-30T18:00:00Z'));await page.reload();await page.evaluate(()=>document.fonts.ready);};

 const choose=async pair=>{await page.locator(`[data-noun="${pair.nounId}"]`).click();await page.locator(`[data-verb="${pair.verbId}"]`).click();await tick();};
 const fill=async pair=>{await choose(pair);await page.locator('#answer-input').fill(pair.word);};
 try{
  await page.clock.install({time:new Date('2026-10-30T18:00:00Z')});await page.goto('https://alford-daily.test/games/second-sense/');await page.locator('[data-noun]').first().waitFor();
  const puzzle=await page.evaluate(async()=>{const e=await import('./engine.mjs'),{PUZZLES}=await import('./puzzles.mjs');return e.getDaily(PUZZLES).puzzle;});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:width===1440?1000:640});await fresh();
   const cells=await page.locator('.sense-card').evaluateAll(nodes=>nodes.map(n=>({font:parseFloat(getComputedStyle(n).fontSize),w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height,sw:n.scrollWidth,cw:n.clientWidth,sh:n.scrollHeight,ch:n.clientHeight,span:n.querySelector("span").getBoundingClientRect().toJSON(),overflow:n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight})));
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});assert.ok(cells.every(c=>c.font>=16&&c.w>=44&&c.h>=44&&!c.overflow),JSON.stringify(cells));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
   await choose(puzzle.pairs[0]);assert.ok(await page.locator('#answer-input').evaluate(n=>{const r=n.getBoundingClientRect();return document.activeElement===n&&r.top>=0&&r.bottom<=innerHeight;}));
   await page.locator('#back-to-clues').click();await page.reload();await tick();
  }
  check('Readable 16px+ definitions, 44px+ targets, no clipping/overflow and reachable focused input at 320–1440 widths');
  await page.setViewportSize({width:390,height:844});await fresh();
  const pair=puzzle.pairs[0];await page.locator(`[data-noun="${pair.nounId}"]`).click();await page.locator('#answer-input').fill('UNFINISHED');
  await page.locator('#sense-hint').click();assert.match(await page.locator('#dialog-content').innerText(),/1 hint/);assert.equal((await saved())?.hintedNouns.length||0,0);await page.locator('[data-action="close"]').click();await tick();assert.equal(await page.locator('#answer-input').inputValue(),'UNFINISHED');assert.equal((await saved())?.hintedNouns.length||0,0);
  await page.locator('#sense-hint').click();await page.locator('[data-second-sense-hint]').click();await tick();assert.deepEqual((await saved()).hintedNouns,[pair.nounId]);assert.equal((await saved()).attempts,0);assert.match(await page.locator('#perfect-note').innerText(),/assisted/);
  assert.match(await page.locator(`[data-noun="${pair.nounId}"]`).getAttribute('aria-label'),new RegExp(`starts with ${pair.word[0]}, ${pair.word.length} letters`));
  check('Scored hint confirmation/cancel preserves draft; approval records one hint, announces assistance and exposes hint in accessible clue name');
  await page.reload();assert.equal(await page.locator('#answer-input').inputValue(),'UNFINISHED');assert.ok(await page.locator('#sense-hint').isDisabled());assert.match(await page.locator(`[data-noun="${pair.nounId}"]`).innerText(),/letters/);
  check('Reload restores unsent word/selection and persistent first-letter advice without a second hint');
  await fresh();await choose(pair);await page.locator('#answer-input').fill('bad1');await page.locator('#sense-check').click();assert.equal((await saved())?.attempts||0,0);assert.match(await page.locator('#feedback').innerText(),/letters only/);
  await page.locator('#answer-input').fill('ZZZZZZ');await page.locator('#sense-check').click();assert.equal((await saved()).attempts,1);assert.ok(await page.locator('#sense-error').isVisible());await page.locator('#answer-input').fill(pair.word.toLowerCase());assert.ok(await page.locator('#sense-error').isHidden());assert.match(await page.locator('#feedback').innerText(),/Word edited/);
  await page.locator('#sense-check').click();await tick();assert.equal((await saved()).attempts,2);assert.equal((await saved()).placements[0].word,pair.word);assert.equal(await page.locator('#answer-input').inputValue(),'');assert.match(await page.locator('#perfect-note').innerText(),/extra checks/);
  assert.ok(await page.locator('#noun-clues button:not(:disabled)').first().evaluate(n=>{const r=n.getBoundingClientRect();return document.activeElement===n&&r.top>=0&&r.bottom<=innerHeight;}));
  check('Malformed spelling is free; a wrong check costs one, editing clears both errors, normalized correct input locks clues and returns visible focus');
  await page.addInitScript(()=>{const add=window.addEventListener;window.addEventListener=function(type,listener,options){return add.call(this,type,type==='storage'?function(event){if(!window.__qaDelayStorage)listener.call(this,event);}:listener,options);};});await fresh();await fill(pair);await page.evaluate(()=>window.__qaDelayStorage=true);
  const other=await ctx.newPage();await other.goto('https://alford-daily.test/games/second-sense/');const next=puzzle.pairs[1];await other.locator(`[data-noun="${next.nounId}"]`).click();await other.locator(`[data-verb="${next.verbId}"]`).click();await other.locator('#answer-input').fill(next.word);await other.locator('#sense-check').click();assert.equal((await saved()).placements[0].word,next.word);
  await page.locator('#sense-check').click();assert.equal((await saved()).placements.length,1);assert.equal(await page.locator('#answer-input').inputValue(),pair.word);assert.match(await page.locator('#feedback').innerText(),/another window/);await tick();assert.ok(await page.locator('#answer-input').evaluate(n=>document.activeElement===n));await page.keyboard.press('Enter');assert.equal((await saved()).placements.length,2);assert.equal(await page.locator('#answer-input').inputValue(),'');await other.close();
  check('Real second-tab save, with storage-event delivery delayed, adopted at write boundary preserves the rejected correct draft; explicit retry commits exactly once');
  await fresh();for(const p of puzzle.pairs){await fill(p);await page.locator('#sense-check').click();await tick();}
  await page.clock.runFor(700);assert.equal((await saved()).status,'won');assert.equal((await saved()).attempts,5);assert.equal((await saved()).hintedNouns.length,0);assert.equal(await page.locator('.discovered-word').count(),5);assert.match(await page.locator('#perfect-note').innerText(),/perfect/);
  await page.locator('#dialog-close').click();await tick();assert.ok(await page.locator('#results-button').evaluate(n=>document.activeElement===n));
  check('Five actual correct checks give a perfect win with five explanations; closing result focuses its reachable result button');
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);assert.match(await page.locator('#card-caption').inputValue(),/Perfect/);assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  for(const p of puzzle.pairs)assert.ok(!(await page.locator('#card-caption').inputValue()).includes(p.word));
  for(const format of ['portrait','square']){if(format==='square'){await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);}const event=page.waitForEvent('download');await page.locator('#download-card').click();const dl=await event,png=await readFile(await dl.path());assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),format==='portrait'?1350:1080);await dl.saveAs(path.join(out,`${name}-result-${format}.png`));}
  check('Perfect result exports actual portrait/square PNGs with factual score/date and no answer words in caption');
  await page.clock.setSystemTime(new Date('2026-10-31T18:00:00Z'));await page.locator('#dialog-close').click();await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('Cancelled','AbortError'))});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Blocked'))}});});
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('share-card').disabled);assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);await page.locator('#share-card').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('card-status').textContent.includes('cancelled'));assert.ok(await page.locator('#share-card').evaluate(n=>document.activeElement===n));await page.locator('#copy-caption').click();assert.equal(await page.locator('#card-caption').evaluate(n=>n.selectionEnd-n.selectionStart),await page.locator('#card-caption').evaluate(n=>n.value.length));
  check('Reopened share freezes played date after midnight; mocked cancel retains focus and denied clipboard selects manual caption');
  await page.locator('#dialog-close').click();await page.locator('#practice-tab').click();await page.locator('[data-practice]').first().click();await page.locator('#more-button').click();await page.locator('[data-action="confirm-reveal"]').click();await page.locator('[data-action="reveal"]').click();
  await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);assert.match(await page.locator('#card-caption').inputValue(),/PRACTICE/);assert.match(await page.locator('#card-caption').inputValue(),/revealed/);assert.doesNotMatch(await page.locator('#card-caption').inputValue(),/Solved|Perfect/);
  await writeFile(path.join(out,`${name}-revealed-portrait.png`),Buffer.from(await page.locator('#result-card').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));assert.equal((await saved()).status,'won');
  check('Revealed Practice is explicit, spoiler-free and cannot replace the perfect Daily record');assert.deepEqual(errors,[]);check('No browser page errors');
 }catch(error){results.push({browser:name,pass:false,error:error.stack});}
 await browser.close();
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.pass))process.exitCode=1;
