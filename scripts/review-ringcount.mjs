// Run with installed Playwright: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/review-ringcount.mjs
import path from 'node:path';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/ringcount-review-20261029');
await mkdir(out,{recursive:true});
const results=[];
for(const [name,type] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chromium'?{channel:'chrome',headless:true}:{headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!=='https://alford-daily.test')return route.abort();
  let pathname=url.pathname;if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))return route.abort();
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'};
  try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(description)=>results.push({browser:name,description,pass:true});
 try{
  await page.clock.install({time:new Date('2026-10-29T18:00:00Z')});
  await page.goto('https://alford-daily.test/games/ringcount/');
  await page.locator('[data-gap]').first().waitFor();
  const cardSpacing=await page.evaluate(async()=>{
    const {drawShareCard,buildShareResult}=await import('./share-card.mjs');
    await document.fonts.ready;
    const checks=[];
    for(const format of ['square','portrait'])for(const status of ['won','revealed']){
      const canvas=document.createElement('canvas'),c=canvas.getContext('2d'),arcs=[],texts=[];
      const arc=c.arc.bind(c),fillText=c.fillText.bind(c);
      c.arc=(...args)=>{arcs.push(args);return arc(...args);};
      c.fillText=(text,x,y,...rest)=>{
        texts.push({text,x,y,width:c.measureText(text).width,ascent:c.measureText(text).actualBoundingBoxAscent,descent:c.measureText(text).actualBoundingBoxDescent});
        return fillText(text,x,y,...rest);
      };
      drawShareCard(canvas,buildShareResult({game:{status,checks:1,hints:0},mode:'daily',number:10,dateKey:'2026-10-29'}),format);
      const edition=texts.find(t=>t.text.includes('DAILY #'));
      const top=arcs[0][1]-arcs[0][2]-13;
      const middle=texts.find(t=>t.text===(status==='won'?'4 / 4':'Revealed'));
      const inner=arcs[0][2]-13,offset=Math.max(Math.abs(middle.y-middle.ascent-arcs[0][1]),Math.abs(middle.y+middle.descent-arcs[0][1]));
      checks.push({format,status,clearance:top-(edition.y+edition.descent),insideClearance:2*Math.sqrt(inner**2-offset**2)-middle.width});
    }
    return checks;
  });
  assert.ok(cardSpacing.every(c=>c.clearance>=16&&c.insideClearance>=16),JSON.stringify(cardSpacing));check('Solved/revealed text fits both card formats with readable space below the daily label');
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ringcount:v1:daily:2026-10-29')));
  assert.match(await page.locator('#ring-hint').innerText(),/hint/i);
  await page.locator('#ring-hint').click();
  assert.match(await page.locator('#dialog-content').innerText(),/1 hint/);
  await page.locator('[data-action="close"]').click();assert.equal((await saved())?.hints||0,0);
  await page.locator('#ring-hint').click();await page.locator('[data-ring-hint-confirm]').click();
  assert.equal((await saved()).hints,1);check('Hint is explicit; cancel preserves score; confirmed hint counts');
  for(const gap of await page.locator('[data-gap].selected').evaluateAll(nodes=>nodes.map(n=>n.dataset.gap)))await page.locator(`[data-gap="${gap}"]`).click();
  for(const gap of [0,3,6,9])await page.locator(`[data-gap="${gap}"]`).click();
  await page.locator('#ring-check').click();
  assert.equal(await page.locator('[data-gap="0"]').evaluate(n=>document.activeElement===n),true);
  assert.equal((await saved()).checks,1);check('Wrong check returns keyboard focus to an editable cut');
  const arc=page.locator('[data-arc="0"]');await arc.click();
  assert.equal(await arc.getAttribute('aria-pressed'),'true');assert.ok(await page.locator('.ring-number.arc-focused').count()>0);
  await arc.press('Escape');assert.equal(await page.locator('.ring-number.arc-focused').count(),0);check('Arc focus connects totals to board and dismisses with Escape');
  const state=await page.evaluate(async()=>{const e=await import('./engine.mjs'),{PUZZLES}=await import('./puzzles.mjs');return e.getDaily(PUZZLES);});
  for(const gap of [0,3,6,9])await page.locator(`[data-gap="${gap}"]`).click();
  for(const gap of state.puzzle.solution)await page.locator(`[data-gap="${gap}"]`).click();
  assert.match(await page.locator('#balance-status').innerText(),/4.*4/);
  assert.match(await page.locator('#ring-check').innerText(),/finish/i);
  await page.locator('#ring-check').click();await page.clock.runFor(700);
  assert.equal((await saved()).status,'won');
  await page.locator('[data-action="share"]').click();
  await page.locator('#download-card').waitFor();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/1 hint/);
  await page.screenshot({path:path.join(out,`${name}-share-portrait.png`),fullPage:true});
  const downloadEvent=page.waitForEvent('download');await page.locator('#download-card').click();const download=await downloadEvent;
  const png=await readFile(await download.path());assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350);
  await download.saveAs(path.join(out,`${name}-result-portrait.png`));check('Hinted win exports a real 1080×1350 PNG with honest caption');
  await page.clock.setSystemTime(new Date('2026-10-30T18:00:00Z'));
  await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/2026-10-29/);
  const sqEvent=page.waitForEvent('download');await page.locator('#download-card').click();const sq=await sqEvent;
  const sqPng=await readFile(await sq.path());assert.equal(sqPng.readUInt32BE(20),1080);
  await sq.saveAs(path.join(out,`${name}-result-square.png`));check('Format changes preserve the played date across midnight; square PNG is 1080×1080');
  await page.locator('#dialog-close').click();
  await page.evaluate(()=>{
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('Cancelled','AbortError'))});
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Blocked'))}});
  });
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('share-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/2026-10-29/);
  let downloads=0;page.on('download',()=>downloads++);
  await page.locator('#share-card').focus();await page.locator('#share-card').press('Enter');await page.waitForFunction(()=>document.getElementById('card-status').textContent.includes('cancelled'));
  assert.equal(await page.locator('#share-card').evaluate(n=>document.activeElement===n),true);
  assert.equal(downloads,0);await page.locator('#copy-caption').click();
  assert.ok(await page.locator('.share-caption').evaluate(n=>n.open));assert.match(await page.locator('#card-status').innerText(),/selected/);
  check('Share cancellation has no download side effect; denied clipboard offers manual selection');
  await page.locator('#dialog-close').click();
  await page.locator('#practice-tab').click();await page.locator('[data-practice]').first().click();
  await page.locator('#more-button').click();await page.locator('[data-action="confirm-reveal"]').click();await page.locator('[data-action="reveal"]').click();
  await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/PRACTICE/);assert.match(await page.locator('#card-caption').inputValue(),/Revealed/);
  await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  await writeFile(path.join(out,`${name}-revealed-square.png`),Buffer.from(await page.locator('#result-card').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
  assert.equal((await saved()).status,'won');check('Revealed practice is labelled honestly and preserves the daily result');
  await page.locator('#dialog-close').click();
  await page.evaluate(()=>localStorage.clear());await page.clock.setSystemTime(new Date('2026-10-29T18:00:00Z'));await page.reload();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width===1440?1000:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} overflow`);
    const gaps=await page.locator('[data-gap]').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
    assert.ok(gaps.every(r=>r.w>=44&&r.h>=44));
    await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
  }
  await page.locator('[data-gap="0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-gap="1"]').evaluate(n=>document.activeElement===n),true);
  await page.keyboard.press('Enter');assert.equal(await page.locator('[data-gap="1"]').getAttribute('aria-pressed'),'true');
  await page.reload();assert.equal(await page.locator('[data-gap="1"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('img',{name:/^Position \d+, number \d+$/}).count(),12);
  check('320–1440 widths fit; 44px cut targets, keyboard selection and reload persistence work');
  assert.deepEqual(errors,[]);check('No browser page errors');
 }catch(error){results.push({browser:name,pass:false,error:error.stack});}
 await browser.close();
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
