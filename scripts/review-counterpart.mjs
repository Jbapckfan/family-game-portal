// Real browser checks on isolated, routed HTTPS. No listener or social send.
import path from 'node:path';import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/counterpart-review-20261030');await mkdir(out,{recursive:true});
const results=[];
for(const [name,type] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chromium'?{channel:'chrome',headless:true}:{headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 await ctx.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='https://alford-daily.test')return route.abort();let n=u.pathname;if(n.endsWith('/'))n+='index.html';const file=path.resolve(root,'.'+n);if(!file.startsWith(root+path.sep))return route.abort();const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'};try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=description=>results.push({browser:name,description,pass:true});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('counterpart:v1:daily:2026-10-30')));
 const tick=()=>page.clock.runFor(25);
 const fresh=async()=>{await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.clock.setSystemTime(new Date('2026-10-30T18:00:00Z'));await page.reload();};
 const chooseRow=async row=>{await page.locator(`.cue-button[data-row="${row}"]`).click();await tick();};
 const fill=async(row,ids)=>{await chooseRow(row);await page.locator(`.answer-slot[data-row="${row}"][data-slot="0"]`).click();for(const id of ids){await page.locator(`[data-tile="${id}"]`).click();await tick();}};
 try{
  await page.clock.install({time:new Date('2026-10-30T18:00:00Z')});await page.goto('https://alford-daily.test/games/counterpart/');await page.locator('[data-tile]').first().waitFor();
  const puzzle=await page.evaluate(async()=>{const e=await import('./engine.mjs'),{PUZZLES}=await import('./puzzles.mjs');return e.getDaily(PUZZLES).puzzle;});
  await fill(0,[...puzzle.rows[0].answer].reverse());assert.equal((await saved())?.attempts||0,0);
  await page.locator('[data-check]').click();assert.equal((await saved()).attempts,1);assert.match(await page.locator('.row-error').innerText(),/direction is reversed/);
  await page.locator('[data-swap]').click();assert.equal((await saved()).attempts,1);await page.locator('[data-check]').click();await tick();
  assert.equal((await saved()).attempts,2);assert.ok((await saved()).placements[0]);assert.equal(await page.locator('[data-analogy]').first().getAttribute('data-analogy'),'1');
  check('Free draft edits/reverse spend no checks; wrong and correct submissions each cost one; active next row moves first');
  const before=await saved();await page.locator('[data-hint="1"]').click();assert.match(await page.locator('#dialog-content').innerText(),/1 hint/);await page.locator('[data-action="close"]').click();assert.deepEqual(await saved(),before);
  await page.locator('[data-hint="1"]').click();await page.locator('[data-counterpart-hint="1"]').click();assert.deepEqual((await saved()).hintedRows,[1]);assert.match(await page.locator('#perfect-note').innerText(),/assisted/);assert.ok(await page.locator('[data-hint="1"]').isDisabled());
  check('Hint cancel preserves game; confirmation records exactly one hint and status says assisted');
  await fresh();await page.evaluate(p=>sessionStorage.setItem(`counterpart:ui:v1:2026-10-30:${p.id}`,JSON.stringify({rows:[[null,null],[p.rows[1].answer[0],null]],row:0,slot:0})),puzzle);await page.reload();
  await fill(0,puzzle.rows[0].answer);await page.locator('[data-check]').click();await tick();
  await page.locator(`[data-tile="${puzzle.rows[1].answer[1]}"]`).click();await tick();
  const words=await page.locator('.analogy.active .answer-slot').allTextContents();assert.deepEqual(words,puzzle.rows[1].answer.map(id=>puzzle.tiles.find(t=>t.id===id).word));
  assert.ok(await page.locator('[data-check]').evaluate(n=>{const r=n.getBoundingClientRect();return document.activeElement===n&&r.top>=0&&r.bottom<=innerHeight;}));await page.keyboard.press('Enter');await tick();assert.equal((await saved()).placements.filter(Boolean).length,2);
  check('A real saved first-word draft survives auto-advance; second tile fills the empty slot and Enter checks the pair');
  await chooseRow(4);await page.locator(`[data-tile="${puzzle.rows[4].answer[0]}"]`).click();await tick();await chooseRow(3);await chooseRow(4);
  assert.equal(await page.locator('.analogy.active .answer-slot').first().innerText(),puzzle.tiles.find(t=>t.id===puzzle.rows[4].answer[0]).word);
  await page.reload();assert.equal(await page.locator('[data-analogy]').first().getAttribute('data-analogy'),'4');
  assert.equal(await page.locator('.analogy.active .answer-slot').first().innerText(),puzzle.tiles.find(t=>t.id===puzzle.rows[4].answer[0]).word);
  check('Changing rows and reload preserve separate unsent drafts and selected work area');
  const preEscape=await saved();await page.keyboard.press('Escape');assert.deepEqual(await saved(),preEscape);assert.deepEqual(await page.locator('.analogy.active .answer-slot').allTextContents(),['First word','Second word']);
  check('Escape clears only an unfinished draft without spending a check');
  await fresh();await page.evaluate(p=>sessionStorage.setItem(`counterpart:ui:v1:2026-10-30:${p.id}`,JSON.stringify({rows:[[null,null],p.rows[1].answer],row:0,slot:0})),puzzle);await page.reload();await fill(0,puzzle.rows[0].answer);await page.locator('[data-check]').click();await tick();assert.ok(await page.locator('[data-check]').evaluate(n=>{const r=n.getBoundingClientRect();return document.activeElement===n&&r.top>=0&&r.bottom<=innerHeight;}));
  check('Auto-advance focuses Check when the next row already has a complete saved draft');
  await fresh();
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:width===1440?1000:width===320?640:width===390?720:844});await chooseRow(4);
   const layout=await page.evaluate(()=>{const b=document.querySelector('.bank-panel').getBoundingClientRect(),a=document.querySelector('.analogy.active').getBoundingClientRect();return {width:innerWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth,bankTop:b.top,bankBottom:b.bottom,activeTop:a.top,activeBottom:a.bottom,viewport:innerHeight};});
   assert.ok(layout.noOverflow,JSON.stringify(layout));if(width<=390)assert.ok(layout.bankTop>=-1,JSON.stringify(layout));
   const type=await page.locator('[data-tile]').first().evaluate(n=>({font:parseFloat(getComputedStyle(n).fontSize),clipped:n.scrollWidth>n.clientWidth||n.scrollHeight>n.clientHeight}));assert.ok(type.font>=16&&!type.clipped,JSON.stringify(type));
   await page.locator('.analogy.active').scrollIntoViewIfNeeded();assert.ok(await page.locator('[data-check]').isVisible());
   const cells=await page.locator('[data-tile]').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
   assert.ok(cells.every(r=>r.w>=44&&r.h>=44),JSON.stringify(cells));assert.equal(await page.locator('[data-analogy]').first().getAttribute('data-analogy'),'4');
   await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
  }
  check('Large 16px+ bank words, reachable active controls, matching DOM/visual order, no overflow and 44px+ tiles at 320–1440');
  await page.setViewportSize({width:390,height:844});await fresh();
  for(let row=0;row<5;row++){await fill(row,puzzle.rows[row].answer);await page.locator('[data-check]').click();await tick();}
  await page.clock.runFor(700);assert.equal((await saved()).status,'won');assert.equal((await saved()).attempts,5);assert.equal(await page.locator('.relation').count(),5);
  await page.locator('#dialog-close').click();const terminalFeedback=await page.locator('#feedback').innerText();await page.keyboard.press('Escape');assert.equal(await page.locator('#feedback').innerText(),terminalFeedback);
  check('Five actual correct checks finish perfectly, explain all relationships and terminal Escape leaves feedback alone');
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/Perfect/);assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  for(const tile of puzzle.tiles)assert.ok(!(await page.locator('#card-caption').inputValue()).includes(tile.word));
  const event=page.waitForEvent('download');await page.locator('#download-card').click();const dl=await event,png=await readFile(await dl.path());assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350);await dl.saveAs(path.join(out,`${name}-result-portrait.png`));
  await page.clock.setSystemTime(new Date('2026-10-31T18:00:00Z'));await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  const sqEvent=page.waitForEvent('download');await page.locator('#download-card').click();const sq=await sqEvent;assert.equal((await readFile(await sq.path())).readUInt32BE(20),1080);await sq.saveAs(path.join(out,`${name}-result-square.png`));
  check('Perfect result exports real 1080×1350 and 1080×1080 PNGs, with no bank words in caption');
  await page.locator('#dialog-close').click();await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('Cancelled','AbortError'))});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Blocked'))}});});
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('share-card').disabled);assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  await page.locator('#share-card').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('card-status').textContent.includes('cancelled'));assert.ok(await page.locator('#share-card').evaluate(n=>document.activeElement===n));
  await page.locator('#copy-caption').click();assert.equal(await page.locator('#card-caption').evaluate(n=>n.selectionEnd-n.selectionStart),await page.locator('#card-caption').evaluate(n=>n.value.length));
  check('Reopened share keeps played date after midnight; mocked cancellation preserves focus and denied clipboard selects text');
  await page.locator('#dialog-close').click();await page.locator('#practice-tab').click();await page.locator('[data-practice]').first().click();await page.locator('#more-button').click();await page.locator('[data-action="confirm-reveal"]').click();await page.locator('[data-action="reveal"]').click();
  await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);assert.match(await page.locator('#card-caption').inputValue(),/PRACTICE/);assert.match(await page.locator('#card-caption').inputValue(),/revealed/);
  await writeFile(path.join(out,`${name}-revealed-portrait.png`),Buffer.from(await page.locator('#result-card').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));assert.equal((await saved()).status,'won');
  check('Revealed practice is honestly labelled and cannot replace the daily win');assert.deepEqual(errors,[]);check('No browser page errors');
 }catch(error){results.push({browser:name,pass:false,error:error.stack});}
 await browser.close();
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.pass))process.exitCode=1;
