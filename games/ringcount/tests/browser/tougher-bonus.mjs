/** Run with PLAYWRIGHT_MODULE pointing at an existing Playwright install. No server/listener. */
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {PUZZLES} from '../../puzzles.mjs';
import {TOUGHER_SAMPLE as sample} from '../../samples.mjs';
import {getDaily,createGame,toggleCut} from '../../engine.mjs';
const playwright=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../../../../',import.meta.url)));
const artifacts=process.env.RINGCOUNT_ARTIFACTS||'/private/tmp/MAKER-codex__ringcount-bonus';
await mkdir(artifacts,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.ttf':'font/ttf'};
const url='https://ringcount.test/games/ringcount/';
const daily=getDaily(PUZZLES),dailyKey='ringcount:v1:daily:'+daily.dateKey;
const dailyState=toggleCut(daily.puzzle,createGame(daily.puzzle),0).state;
const records=JSON.stringify({'2026-10-20':{status:'won',checks:1,moves:4,hints:0}});
const sampleKey='ringcount:v1:practice:'+sample.id;
for(const browserName of ['chromium','webkit']) {
 const browser=await playwright[browserName].launch({headless:true,...(browserName==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{})});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.route('https://ringcount.test/**',async route=>{
   const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
   const path=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
   if(!path.startsWith(root+sep)){await route.abort();return;}
   try{await route.fulfill({body:await readFile(path),contentType:mime[extname(path)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  await page.evaluate(({dailyKey,dailyState,records})=>{localStorage.setItem(dailyKey,JSON.stringify(dailyState));localStorage.setItem('ringcount:v1:records',records);},{dailyKey,dailyState,records});
  await page.reload();
  assert.equal(await page.locator('#cut-count').innerText(),'1 / 4 cuts');
  await page.locator('#sample-button').click();
  assert.equal(await page.locator('#issue').innerText(),'BONUS');
  assert.equal(await page.locator('#ring-target').innerText(),'17');
  // Two correct-looking totals remain on a wrong complete placement.
  for(const gap of [0,4,7,9])await page.locator(`[data-gap="${gap}"]`).click();
  assert.match(await page.locator('#balance-status').innerText(),/^2 of 4/);
  await page.locator('#ring-check').click();
  assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),sampleKey)).status,'playing');
  await page.goto(url+'?sample=tougher');
  assert.equal(await page.locator('#ring-checks').innerText(),'1');
  assert.equal(await page.locator('#cut-count').innerText(),'4 / 4 cuts');
  for(const gap of [4,5])await page.locator(`[data-gap="${gap}"]`).click();
  assert.equal(await page.locator('#ring-check').innerText(),'Finish circle ✓');
  await page.screenshot({path:`${artifacts}/${browserName}-phone.png`,fullPage:true});
  await page.locator('#ring-check').click();
  await page.locator('#game-dialog[open]').waitFor();
  assert.equal(await page.locator('#dialog-title').innerText(),'Full circle.');
  assert.match(await page.locator('#dialog-content').innerText(),/BONUS CHALLENGE/);
  await page.locator('[data-action="share"]').click();
  await page.locator('#download-card:not([disabled])').waitFor();
  assert.match(await page.locator('#card-caption').inputValue(),/BONUS CHALLENGE/);
  await page.locator('#dialog-close').click();
  await page.reload();
  const won=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),sampleKey);
  assert.equal(won.status,'won');assert.equal(won.checks,2);
  assert.equal(await page.locator('#ring-gaps button:disabled').count(),12);
  await page.locator('#daily-tab').click();
  assert.equal(await page.locator('#cut-count').innerText(),'1 / 4 cuts');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),dailyKey),JSON.stringify(dailyState));
  assert.equal(await page.evaluate(()=>localStorage.getItem('ringcount:v1:records')),records);
  await page.locator('#sample-button').click();
  await page.locator('#finished-more-button').click();
  await page.locator('[data-action="confirm-restart"]').click();
  await page.locator('[data-action="restart"]').click();
  await page.locator('#more-button').click();
  await page.locator('[data-action="confirm-reveal"]').click();
  await page.locator('[data-action="reveal"]').click();
  assert.equal(await page.locator('#dialog-title').innerText(),'The circle revealed.');
  await page.locator('[data-action="share"]').click();
  assert.match(await page.locator('#card-caption').inputValue(),/BONUS CHALLENGE[\s\S]*Revealed/);
  await page.locator('#dialog-close').click();
  await page.reload();
  assert.equal(await page.locator('#cut-count').innerText(),'Solution shown');
  assert.equal(await page.locator('#balance-status').innerText(),'Solution shown · not counted as solved');
  assert.equal(await page.evaluate(()=>localStorage.getItem('ringcount:v1:records')),records);
  for(const width of [320,390,1280]) {
   await page.setViewportSize({width,height:844});
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dimensions.scroll<=dimensions.width,`${browserName} overflow at ${width}`);
   await page.screenshot({path:`${artifacts}/${browserName}-${width}-revealed.png`,fullPage:true});
  }
  assert.doesNotMatch(await page.locator('body').innerText(),/ChatGPT|chatgpt\.site/);
  assert.equal(await page.locator('a[href*="chatgpt"]').count(),0);
  assert.deepEqual(errors,[]);
  console.log(`${browserName}: bonus entry, near miss, restore, solve, result export, reveal, daily preservation and three layout widths passed.`);
  await context.close();
 }finally {await browser.close();}
}
console.log(`Screenshots: ${artifacts}`);
