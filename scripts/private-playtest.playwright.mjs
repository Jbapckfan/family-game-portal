// Serial, source-assisted acceptance play. Does not measure blind human difficulty.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),stage=path.resolve(process.env.DAILY_STAGE||path.join(root,'dist/private-playtest-20261028'));
const out=path.join(root,'output/playwright/playtest-20261028');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href);
const results=[];
for(const name of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[name].launch(name==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:(process.env.DAILY_WEBKIT_EXECUTABLE?{executablePath:process.env.DAILY_WEBKIT_EXECUTABLE}:{}));
 try {
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];
  p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await ctx.route('https://daily.test/**',async route=>{
   let url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname).replace(/^\/beta\//,'/');if(relative.endsWith('/'))relative+='index.html';
   const file=path.resolve(stage,'.'+relative);if(!file.startsWith(stage+path.sep))return route.abort();
   const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
   try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});
  await p.goto('https://daily.test/');await p.waitForFunction(()=>document.getElementById('progress-count')?.textContent.includes('solved'));
  assert.equal(await p.locator('[data-collection] [data-game]').count(),32);
  await p.locator('.first-visit summary').click();await p.locator('[data-first-game="shortlist"]').focus();
  await p.screenshot({path:path.join(out,name+'-welcome.png')});
  for(const slug of ['ringcount','switchpath','counterpart','shortlist']){
   const engine=await import(pathToFileURL(path.join(root,'games',slug,'engine.mjs')).href),{PUZZLES}=await import(pathToFileURL(path.join(root,'games',slug,'puzzles.mjs')).href);
   const {puzzle,dateKey}=engine.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z'));
   await p.goto(`https://daily.test/games/${slug}/`);await p.locator('#help-button').click();await p.locator('#game-dialog [data-action="close"]').click();
   const key=`${slug}:v1:daily:${dateKey}`;
   if(slug==='ringcount'){
    await p.locator(`[data-gap="${puzzle.solution[0]}"]`).click();
    const saved=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);
    await p.screenshot({path:path.join(out,`${name}-ringcount-playing.png`)});
    for(const gap of puzzle.solution.slice(1))await p.locator(`[data-gap="${gap}"]`).click();await p.locator('#ring-check').click();
   }else if(slug==='switchpath'){
    for(const cell of puzzle.solution.slice(1,7))await p.locator(`[data-cell="${cell}"]`).click();
    const saved=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);
    for(const cell of puzzle.solution.slice(7))await p.locator(`[data-cell="${cell}"]`).click();
   }else if(slug==='counterpart'){
    for(const [index,row] of puzzle.rows.entries()){
     if(index)await p.locator(`[data-row="${index}"]`).first().click();
     for(const id of row.answer)await p.locator(`[data-tile="${id}"]`).click();await p.locator('[data-check]').click();
     if(index===0){const saved=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);}
    }
   }else{
    await p.locator('[data-letter="A"]').click();await p.locator('[data-letter="E"]').click();await p.locator('#scan-button').click();
    const saved=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);
    await p.locator(`[data-pick="${puzzle.answer}"]`).click();await p.locator(`[data-final-pick="${puzzle.answer}"]`).click();
   }
   await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').status==='won',key);
   const terminal=await p.evaluate(key=>localStorage.getItem(key),key);await p.reload();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),terminal);
   await p.screenshot({path:path.join(out,`${name}-${slug}-completed.png`)});
   assert.ok((await p.locator('#family-link').getAttribute('href')).includes('daily'));
   results.push({engine:name,slug,puzzleId:puzzle.id,win:'source-assisted actual controls',unfinishedReload:true,finishedReload:true});
  }
  await p.goto('https://daily.test/');await p.waitForFunction(()=>document.getElementById('progress-count')?.textContent.startsWith('4 of 32'));
  await p.locator('.playtest-tools details').first().locator('summary').click();await p.locator('#playtest-game').selectOption('shortlist');await p.locator('#playtest-feeling').selectOption('again');await p.locator('#playtest-note').fill('QA example: scan controls and reload checked. This is not a human playtest report.');await p.locator('#playtest-form button').click();
  assert.match(await p.locator('#playtest-text').inputValue(),/Shortlist · ChatGPT/);assert.match(await p.locator('#playtest-text').inputValue(),/Solved/);
  await p.setViewportSize({width:1100,height:1100});await p.evaluate(()=>document.activeElement?.blur());await p.locator('.playtest-tools').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'-feedback-desktop.png')});
  await p.setViewportSize({width:320,height:568});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Regression: a deployment prefix must not send testers out to a hosted sibling.
  await p.goto('https://daily.test/beta/games/shortlist/');
  assert.equal(new URL(await p.locator('#family-link').getAttribute('href'),p.url()).origin,'https://daily.test');
  assert.equal(new URL(await p.locator('#family-link').getAttribute('href'),p.url()).pathname,'/beta/games/daily/');
  assert.deepEqual(errors,[]);await ctx.close();
 }catch(error){results.push({engine:name,error:error.stack});process.exitCode=1;}finally{await browser.close();}
}
await writeFile(path.join(out,'gameplay-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
