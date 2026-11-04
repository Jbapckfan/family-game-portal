import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GAME_SLUGS} from '../games/deepseek-runtime/player-tools.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium,webkit}=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const out='/private/tmp/MAKER-Codex__web-favorites-20261104';await fs.mkdir(out,{recursive:true});
const results=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{channel:'chrome',headless:true}:{headless:true});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport});
  await ctx.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!=='https://alford.test')return route.abort();
   let target=path.resolve(root,`.${decodeURIComponent(url.pathname)}`);if(!target.startsWith(root+path.sep))target=path.join(root,'games/daily/index.html');
   try{if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');const ext=path.extname(target);await route.fulfill({body:await fs.readFile(target),contentType:({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ttf':'font/ttf'}[ext]||'application/octet-stream')});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const home='https://alford.test/games/daily/';
  await page.goto(home);await page.waitForSelector('[data-pref-controls] button');
  assert.equal(await page.locator('a button').count(),0);
  assert.equal(await page.locator('[data-pref-controls][data-preferences-ready=true]').count(),40);
  const dailySet=await page.locator('#todays-three [data-game]').evaluateAll(els=>els.map(el=>el.dataset.game));
  const favorite=page.locator('#flagship-games [data-pref-game="ringcount"] [data-preference="favorite"]');await favorite.click();
  await page.reload();await page.waitForSelector('[data-pref-controls] button');assert.equal(await favorite.getAttribute('aria-pressed'),'true');
  await page.locator('#favorites-only').click();assert.ok((await page.locator('[data-pref-game]:visible').evaluateAll(els=>els.map(el=>el.dataset.prefGame))).every(slug=>slug==='ringcount'));
  await page.locator('#flagship-games [data-game="ringcount"]').click();await page.waitForSelector('#alford-player-tools');
  assert.equal(await page.locator('#alford-player-tools [data-preference="favorite"]').getAttribute('aria-pressed'),'true');
  await page.locator('#alford-player-tools [data-preference="favorite"]').click();await page.locator('#alford-player-tools [data-preference="hidden"]').click();
  await page.goto(home);await page.waitForSelector('[data-pref-controls] button');assert.equal(await page.locator('[data-pref-game="ringcount"]:visible').count(),0);
  await page.locator('#show-hidden').click();await page.locator('#flagship-games [data-pref-game="ringcount"] [data-preference="hidden"]').click();
  assert.equal(await page.locator('#flagship-games [data-pref-game="ringcount"] [data-preference="favorite"]').getAttribute('aria-pressed'),'false');
  await page.reload();await page.waitForSelector('[data-pref-controls] button');assert.ok(await page.locator('[data-pref-game="ringcount"]:visible').count()>=1);
  assert.deepEqual(await page.locator('#todays-three [data-game]').evaluateAll(els=>els.map(el=>el.dataset.game)),dailySet);
  // Bonus controls, all duplicate cards and filters use the same store.
  await page.locator('[data-pref-game="nested-tic-tac-toe"] [data-preference="favorite"]').click();
  await page.locator('#favorites-only').click();assert.equal(await page.locator('[data-pref-game]:visible').count(),1);
  await page.locator('#favorites-only').click();
  await page.locator('#featured-games [data-pref-game="shortlist"] [data-preference="hidden"]').click();assert.equal(await page.locator('[data-pref-game="shortlist"]:visible').count(),0);
  await page.locator('#show-hidden').click();assert.ok(await page.locator('[data-pref-game="shortlist"]:visible').count()>=2);
  await page.screenshot({path:path.join(out,`${engine.name()}-${viewport.width}-home.png`),fullPage:true});
  await page.locator('.collection-preferences').screenshot({path:path.join(out,`${engine.name()}-${viewport.width}-filters.png`)});
  await page.locator('#featured-games [data-pref-game="shortlist"]').screenshot({path:path.join(out,`${engine.name()}-${viewport.width}-card.png`)});
  for(const slug of GAME_SLUGS){
   await page.goto(`https://alford.test/games/${slug}/`);await page.waitForSelector('#alford-player-tools');
   assert.equal(await page.locator('#alford-player-tools').count(),1);
   assert.equal(await page.locator('#alford-player-tools button').count(),2);
   assert.equal(await page.locator('#alford-player-tools').evaluate(el=>el.getBoundingClientRect().top>=0),true);
   assert.equal(await page.locator('#alford-player-tools button').first().evaluate(el=>el.getBoundingClientRect().height>=44),true);
  }
  await page.screenshot({path:path.join(out,`${engine.name()}-${viewport.width}-game.png`),fullPage:true});
  // Native startup and event synchronization must never echo back to native.
  await page.addInitScript(()=>{window.__ALFORD_NATIVE__={gamePreference:{slug:'nested-tic-tac-toe',favorite:true,hidden:false}};window.received=[];window.webkit={messageHandlers:{alford:{postMessage:value=>window.received.push(value)}}};});
  await page.reload();await page.waitForSelector('#alford-player-tools');
  assert.equal(await page.locator('#alford-player-tools [data-preference="favorite"]').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>dispatchEvent(new CustomEvent('alford:game-preference-change',{detail:{slug:'nested-tic-tac-toe',favorite:false,hidden:true}})));
  assert.equal(await page.locator('#alford-player-tools [data-preference="hidden"]').innerText(),'Unhide');
  assert.equal(await page.evaluate(()=>received.filter(x=>x.type==='gamePreference').length),0);
  await page.locator('#alford-player-tools [data-preference="favorite"]').click();
  assert.deepEqual(await page.evaluate(()=>received.filter(x=>x.type==='gamePreference')), [{type:'gamePreference',slug:'nested-tic-tac-toe',favorite:true,hidden:true}]);
  // Quota failure leaves the last verified favorite state and reports the failure.
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('quota');};});
  await page.locator('#alford-player-tools [data-preference="favorite"]').click();
  assert.match(await page.locator('#alford-player-tools .alford-preference-message').innerText(),/Could not save/);
  assert.equal(await page.locator('#alford-player-tools [data-preference="favorite"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors,[]);results.push({browser:engine.name(),width:viewport.width,passed:true,gameToolbars:GAME_SLUGS.length});await ctx.close();
 }}finally{await browser.close();}
}
await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(results);
