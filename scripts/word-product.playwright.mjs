import assert from 'node:assert/strict';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/playwright/product-20261028');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),results=[];
for(const name of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[name].launch(name==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',error=>errors.push(error.message));
  await context.route('https://daily.test/**',async route=>{let url=new URL(route.request().url()),file=url.pathname;if(file.endsWith('/'))file+='index.html';file=path.resolve(root,'.'+file);const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};try{if(!file.startsWith(root+path.sep))throw new Error();await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}});
  await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});
  const snapshot=()=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)])));
  for(const slug of ['shortlist','counterpart','second-sense','sideways']){
   await p.goto(`https://daily.test/games/${slug}/`);await p.locator('#help-button').click();const saved=await snapshot();
   assert.equal(await p.locator('[data-lesson-choice]').count(),3,slug+' has a playable rule example');
   await p.locator('[data-lesson-choice="1"]').click();assert.match(await p.locator('#lesson-feedback').innerText(),/Try again/);
   await p.locator('[data-lesson-choice="0"]').click();assert.match(await p.locator('#lesson-feedback').innerText(),/Exactly/);
   assert.deepEqual(await snapshot(),saved,'lesson does not change any game save/hint/result');
   await p.screenshot({path:path.join(out,`${name}-${slug}-lesson.png`)});await p.locator('#dialog-close').click();
   if(slug==='shortlist'){
    assert.ok((await p.locator('.letter-key').first().boundingBox()).height>=44,'scan keys retain accessible height');
    assert.ok((await p.locator('#puzzle').boundingBox()).y<(await p.locator('.scan-panel').boundingBox()).y);
    assert.ok((await p.locator('#puzzle').boundingBox()).height<=250,'twelve candidates use four phone rows so evidence and scan controls stay close');
    await p.locator('#notes-mode').click();const word=await p.locator('[data-mark]').first().getAttribute('data-mark');await p.locator(`[data-mark="${word}"]`).click();assert.match(await p.locator('#puzzle').innerHTML(),/crossed/);await p.locator(`[data-mark="${word}"]`).click();await p.locator('#notes-mode').click();
    await p.locator('[data-letter="A"]').click();await p.locator('[data-letter="E"]').click();await p.locator('#scan-button').click();await p.reload();assert.equal(await p.locator('.scan-result:not(.empty)').count(),1);
   }
   if(slug==='counterpart'){
    const {PUZZLES}=await import(pathToFileURL(path.join(root,'games',slug,'puzzles.mjs')).href),engine=await import(pathToFileURL(path.join(root,'games',slug,'engine.mjs')).href),{puzzle}=engine.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z'));
    for(const id of [...puzzle.rows[0].answer].reverse())await p.locator(`[data-tile="${id}"]`).click();await p.locator('[data-check]').click();assert.match(await p.locator('.row-error').innerText(),/reversed/);await p.locator('[data-swap]').click();await p.locator('[data-check]').click();
    for(const row of puzzle.rows.slice(1,3)){for(const id of row.answer)await p.locator(`[data-tile="${id}"]`).click();await p.locator('[data-check]').click();}
    const active=await p.locator('.analogy.active').boundingBox();assert.ok(active.y>=0&&active.y+active.height<=844,'next working row remains in phone viewport');
   }
   if(slug==='second-sense'){
    assert.ok(await p.locator('.sense-card').first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize)>=14),'phone clues use readable type');
    assert.ok(await p.locator('#answer-input').evaluate(node=>parseFloat(getComputedStyle(node).fontSize)>=16),'phone input avoids focus zoom');
    const {PUZZLES}=await import(pathToFileURL(path.join(root,'games',slug,'puzzles.mjs')).href),engine=await import(pathToFileURL(path.join(root,'games',slug,'engine.mjs')).href),{puzzle}=engine.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z')),[a,b]=puzzle.pairs;
    await p.locator(`[data-noun="${a.nounId}"]`).click();await p.locator(`[data-verb="${b.verbId}"]`).click();await p.locator('#answer-input').fill(a.word);await p.locator('#sense-check').click();assert.match(await p.locator('#sense-error').innerText(),/fits the noun/);await p.locator(`[data-verb="${a.verbId}"]`).click();await p.locator('#sense-check').click();assert.match(await p.locator('#sense-progress').innerText(),/1 of 5/);
   }
   if(slug==='sideways'){await p.locator('[data-follow-column="1"]').click();assert.match(await p.locator('#column-reader').innerText(),/Following B/);await p.locator('[data-rotate="0"][data-direction="1"]').click();assert.equal(await p.locator('.strip-letter.following').count(),5);await p.locator('#shift-undo').click();}
   await p.evaluate(()=>document.activeElement?.blur());await p.locator('.game').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`${name}-${slug}-playing.png`)});
   await p.setViewportSize({width:320,height:568});if(slug==='shortlist')assert.ok(await p.locator('.candidate-word').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth+1)),'candidate words fit 320px tiles');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),slug+' 320px overflow');await p.setViewportSize({width:390,height:844});
   // Source-assisted QA finishes the actual UI; this is separate from the blind play probe.
   const sourceEngine=await import(pathToFileURL(path.join(root,'games',slug,'engine.mjs')).href),{PUZZLES:bank}=await import(pathToFileURL(path.join(root,'games',slug,'puzzles.mjs')).href),{puzzle:authored}=sourceEngine.getDaily(bank,new Date('2026-10-28T18:00:00Z'));
   if(slug==='shortlist'){await p.locator(`[data-pick="${authored.answer}"]`).click();await p.locator(`[data-final-pick="${authored.answer}"]`).click();}
   if(slug==='counterpart'){for(const row of authored.rows.slice(3)){for(const id of row.answer)await p.locator(`[data-tile="${id}"]`).click();await p.locator('[data-check]').click();}}
   if(slug==='second-sense'){for(const pair of authored.pairs.slice(1)){await p.locator(`[data-noun="${pair.nounId}"]`).click();await p.locator(`[data-verb="${pair.verbId}"]`).click();await p.locator('#answer-input').fill(pair.word);await p.locator('#sense-check').click();}}
   if(slug==='sideways'){let solved;for(let bits=0;bits<1024;bits++){const rotations=Array.from({length:5},(_,i)=>(bits>>(2*i))&3);if(sourceEngine.getColumns(authored,{rotations}).every((word,i)=>word===authored.columns[i].answer)){solved=rotations;break;}}assert.ok(solved);for(const [row,steps] of solved.entries())for(let i=0;i<steps;i++)await p.locator(`[data-rotate="${row}"][data-direction="1"]`).click();await p.locator('#shift-check').click();}
   await p.locator('.return-to-daily').waitFor({state:'visible'});assert.equal(await p.evaluate(slug=>JSON.parse(localStorage.getItem(slug+':v1:records'))['2026-10-28'].status,slug),'won');
   await p.screenshot({path:path.join(out,`${name}-${slug}-finished.png`)});await p.locator('.return-to-daily').click();await p.waitForFunction(()=>document.querySelectorAll('[data-collection] [data-game]').length===32);
   results.push({engine:name,slug,passed:true,completedViaRealUI:true});
  }
  assert.deepEqual(errors,[]);await context.close();
 }catch(error){results.push({engine:name,error:error.stack});process.exitCode=1;}finally{await browser.close();}
}
await writeFile(path.join(out,'word-product-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
