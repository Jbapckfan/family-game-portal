import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/elite-20261028/originals');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),rows=[];
for(const engine of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  for(const slug of ['ringcount','switchpath','counterpart','shortlist','second-sense','sideways','tradeoff','inbetween','nested-tic-tac-toe']){
   const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
   await ctx.route('https://daily.test/**',async route=>{let n=new URL(route.request().url()).pathname;if(n.endsWith('/'))n+='index.html';const f=path.resolve(root,'.'+n);if(!f.startsWith(root+path.sep))return route.abort();try{await route.fulfill({path:f,contentType:({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(f)]});}catch{await route.fulfill({status:404,body:'missing'});}});
   try{
    await page.clock.install({time:new Date('2026-10-28T18:00:00Z')});await page.goto(`https://daily.test/games/${slug}/`);
    await page.waitForFunction(()=>document.querySelectorAll('main button').length>3);
    const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
    if(slug==='ringcount'||slug==='switchpath'){
     await page.locator('#help-button').click();const before=await snapshot();
     assert.equal(await page.locator('[data-lesson-choice]').count(),3,'game-specific practice rule exists');
     await page.locator('[data-lesson-choice="1"]').click();assert.match(await page.locator('#lesson-feedback').innerText(),/Try again/);
     await page.locator('[data-lesson-choice="0"]').click();assert.match(await page.locator('#lesson-feedback').innerText(),/Exactly/);assert.deepEqual(await snapshot(),before);
     await page.locator('#dialog-close').click();
    }
    if(slug==='counterpart'){
     const first=await page.locator('[data-tile]').first().getAttribute('data-tile');await page.locator(`[data-tile="${first}"]`).click();
     await page.locator('[data-row="1"]').first().click();assert.equal(await page.locator('.analogy.active .answer-slot.filled').count(),0,'each analogy has its own draft');
     await page.locator('[data-row="0"]').first().click();assert.equal(await page.locator('.analogy.active .answer-slot.filled').count(),1);
     await page.reload();await page.locator('[data-row="0"]').first().click();assert.equal(await page.locator('.analogy.active .answer-slot.filled').count(),1,'unsent pair survives same-tab reload');
    }
    if(slug==='shortlist'){
     for(const pair of ['AE','BC','DF']){for(const letter of pair)await page.locator(`[data-letter="${letter}"]`).click();await page.locator('#scan-button').click();}
     assert.equal(await page.locator('#scan-button').isEnabled(),true,'spent scan budget offers a way back to candidates');
     const before=await snapshot();await page.locator('#scan-button').click();assert.deepEqual(await snapshot(),before);assert.ok(await page.evaluate(()=>document.activeElement.hasAttribute('data-pick')));
     assert.match(await page.locator('#hint-button').innerText(),/evidence|results/i);
    }
    if(slug==='second-sense'){
     await page.locator('[data-noun]').first().click();await page.locator('[data-verb]').first().click();await page.locator('#answer-input').fill('RIVER');const before=await snapshot();
     await page.reload();assert.equal(await page.locator('#answer-input').inputValue(),'RIVER');assert.equal(await page.locator('.sense-card.selected').count(),2);assert.deepEqual(await snapshot(),before,'draft resume does not score or hint');
    }
    if(slug==='sideways'){
     await page.locator('[data-rotate="0"][data-direction="1"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#shift-moves').innerText(),'1');
     await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.rotate),'1');assert.equal(await page.locator('#shift-moves').innerText(),'1');
    }
    if(slug==='tradeoff'){
     await page.locator('#hint-button').click();assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('hinted')),true,'hint brings its trading partner into keyboard focus');
    }
    if(slug==='inbetween'){
     await page.locator('[data-tile]').first().click();await page.locator('[data-row="0"][data-gap="0"]').focus();const before=await snapshot();await page.keyboard.press('ArrowRight');
     assert.equal(await page.evaluate(()=>document.activeElement.dataset.gap),'1');await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.dataset.row),'1');assert.deepEqual(await snapshot(),before,'gap navigation is not a scored placement');
    }
    if(slug==='nested-tic-tac-toe'){
     const {createGame,playMove,legalMoves,saveMatch}=await import('../games/nested-tic-tac-toe/engine.mjs');let state=createGame();
     while(state.status==='playing'&&!state.boards.some(Boolean)){const move=legalMoves(state)[0];state=playMove(state,move);}
     assert.ok(state.boards.some(Boolean));await page.evaluate(save=>localStorage.setItem('alford:tic-tac-toe:v1:match',JSON.stringify(save)),saveMatch(state));await page.reload();
     const marker=page.locator('.mini-board.has-last-move .recent-square-marker');assert.equal(await marker.count(),1);
     assert.equal(await page.locator('.mini-board.has-last-move .mini-mark').evaluateAll(nodes=>new Set(nodes.map(node=>Math.round(node.getBoundingClientRect().y))).size),3,'recent marker never displaces the nine actual squares');
     assert.equal(await marker.evaluate(node=>{const r=node.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===node||node.contains(top);}),true,'last-square marker remains above closed-board overlay');
    }
    await page.screenshot({path:path.join(out,`${engine}-${slug}.png`),fullPage:true});assert.deepEqual(errors,[]);rows.push({engine,slug,passed:true});
   }catch(error){rows.push({engine,slug,error:error.stack});process.exitCode=1;}finally{await ctx.close();}
  }
 }finally{await browser.close();}
}
await writeFile(path.join(out,'results.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows,null,2));
