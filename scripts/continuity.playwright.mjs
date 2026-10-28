import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'output/continuity-20261028');
await mkdir(out,{recursive:true});
const modulePath=process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs';
const playwright=await import(pathToFileURL(modulePath).href);
const positions=['top left','top middle','top right','middle left','center','middle right','bottom left','bottom middle','bottom right'];
const results=[];

for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')) {
  const browser=await playwright[engine].launch({headless:process.env.HEADFUL!=='1',...(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}: {})});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const errors=[];
    context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
    await context.route('https://daily.test/**',async route=>{
      let name=new URL(route.request().url()).pathname;
      if(name.endsWith('/'))name+='index.html';
      const file=path.resolve(root,'.'+name);
      const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
      if(!file.startsWith(root+path.sep))return route.abort();
      try { await route.fulfill({path:file,contentType:types[path.extname(file)]}); }
      catch { await route.fulfill({status:404,body:'missing'}); }
    });
    // Suppress this window's storage listeners to reproduce a genuinely delayed
    // update while keeping the real same-origin localStorage implementation.
    await context.addInitScript(()=>{
      const add=window.addEventListener.bind(window);
      window.addEventListener=(type,...args)=>{if(type!=='storage')add(type,...args);};
    });
    const page=await context.newPage();
    page.setDefaultTimeout(8000);
    await page.clock.install({time:new Date('2026-10-28T18:00:00Z')});
    await page.clock.pauseAt(new Date('2026-10-28T18:00:01Z'));

    await page.goto('https://daily.test/games/shortlist/');
    const stale=await context.newPage();
    await stale.clock.install({time:new Date('2026-10-28T18:00:00Z')});
    await stale.goto('https://daily.test/games/shortlist/');
    await page.locator('[data-letter="A"]').click();
    await page.locator('[data-letter="E"]').click();
    await page.locator('#scan-button').click();
    const wordKey='shortlist:v1:daily:2026-10-28';
    const saved=await page.evaluate(key=>localStorage.getItem(key),wordKey);
    await stale.locator('[data-letter="B"]').click();
    await stale.locator('[data-letter="C"]').click();
    await stale.locator('#scan-button').click();
    assert.equal(await stale.evaluate(key=>localStorage.getItem(key),wordKey),saved);
    assert.match(await stale.locator('#feedback').innerText(),/another window/);
    assert.equal(await stale.locator('.scan-result:not(.empty)').count(),1);
    assert.match(await stale.locator('.scan-letters').first().innerText(),/A\s*\+\s*E/);
    await stale.locator('[data-letter="B"]').click();
    await stale.locator('[data-letter="C"]').click();
    await stale.locator('#scan-button').click();
    await stale.reload();
    assert.equal(await stale.locator('.scan-result:not(.empty)').count(),2);
    await stale.close();

    await page.goto('https://daily.test/games/nested-tic-tac-toe/');
    await page.waitForFunction(()=>document.getElementById('puzzle').dataset.gameReady==='true');
    assert.equal(await page.locator('#recent-move').isVisible(),false);
    await page.locator('[data-skill="casual"]').click();
    await page.locator('.mini-board').nth(4).click();
    await page.locator('#detail-board [data-cell="0"]').click();
    assert.match(await page.locator('#last-move').innerText(),/You played.*center board.*top left (square|cell)/i);
    await page.clock.runFor(350);
    const matchKey='alford:tic-tac-toe:v1:match';
    const match=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),matchKey);
    assert.equal(match.history.length,2);
    const last=match.history.at(-1);
    assert.match(await page.locator('#last-move').innerText(),new RegExp(`AI played.*${positions[last.board]} board.*${positions[last.cell]} (square|cell)`,'i'));
    assert.equal(await page.locator('.mini-mark.last-move').count(),1);
    assert.equal(await page.locator('.mini-board.has-last-move').count(),1);
    assert.match(await page.locator('.mini-board.has-last-move').getAttribute('aria-label'),/last move.*AI/i);
    const beforeInspect=await page.evaluate(key=>localStorage.getItem(key),matchKey);
    await page.locator('#inspect-last-move').click();
    assert.match(await page.locator('#selected-board-title').innerText(),new RegExp(positions[last.board],'i'));
    if(last.board!==last.cell)assert.equal(await page.evaluate(()=>document.activeElement.id),'detail-panel','inspection moves keyboard focus to the board it shows');
    assert.equal(await page.locator('#detail-board .last-move').count(),1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),matchKey),beforeInspect);
    if(last.board!==last.cell) {
      assert.equal(await page.locator('#return-to-play').isVisible(),true);
      await page.locator('#return-to-play').click();
      assert.match(await page.locator('#selected-board-title').innerText(),new RegExp(positions[last.cell],'i'));
      assert.ok(await page.locator('#detail-board button:enabled').count()>0);
    }
    await page.reload();
    await page.waitForFunction(()=>document.getElementById('puzzle').dataset.gameReady==='true');
    assert.match(await page.locator('#last-move').innerText(),/AI played/i);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),matchKey),beforeInspect);
    await page.locator('#inspect-last-move').click();
    await page.locator('#recent-move').screenshot({path:path.join(out,`${engine}-recent-move.png`)});
    await page.locator('#puzzle').screenshot({path:path.join(out,`${engine}-nine-board-phone.png`)});
    await page.setViewportSize({width:320,height:568});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    for(const id of ['inspect-last-move','return-to-play']) {
      if(await page.locator('#'+id).isVisible())assert.ok((await page.locator('#'+id).boundingBox()).height>=44);
    }
    await page.setViewportSize({width:1100,height:1000});
    await page.locator('#puzzle').screenshot({path:path.join(out,`${engine}-nine-board-desktop.png`)});
    await page.locator('#new-match-button').click();
    await page.locator('#confirm-restart').click();
    assert.equal(await page.locator('#recent-move').isVisible(),false);
    assert.equal(await page.locator('.mini-mark.last-move').count(),0);
    assert.equal(await page.locator('.mini-board.has-last-move').count(),0);
    assert.deepEqual(errors,[]);
    results.push({engine,passed:true,checks:['real delayed-tab save protection','continued word play and reload','human and AI last-move summaries','overview square and board markers','inspection never changes saves','return to forced play','version-1 reload','320px and 44px controls','restart clears recent move'],moves:match.history});
    await context.close();
  } catch(error) {
    results.push({engine,error:error.stack});
    process.exitCode=1;
  } finally { await browser.close(); }
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
