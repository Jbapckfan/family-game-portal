import assert from 'node:assert/strict';import path from 'node:path';import {writeFile} from 'node:fs/promises';
const root=process.cwd(),pw=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs'),results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true}:{headless:true});
 for(const mode of ['touch','keyboard']){
  const ctx=await browser.newContext({viewport:{width:393,height:900},hasTouch:true});
  await ctx.route('https://lattice.test/**',async route=>{let name=new URL(route.request().url()).pathname;if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);assert.ok(file.startsWith(root+'/games/'));try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('https://lattice.test/games/qwen-logic-lattice/');
  for(const width of [320,393,1200]){
   await page.setViewportSize({width,height:950});await page.waitForTimeout(200);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const sizes=await page.locator('.lattice-cell,.lattice-count').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
   assert.ok(sizes.every(s=>s.w>=44&&s.h>=44),JSON.stringify({width,sizes}));
   if(mode==='touch')await page.screenshot({path:`output/lattice-ui-20261104/${engine}-${width}.png`,fullPage:true});
  }
  await page.locator('.lattice-explanation summary').click();
  const saved=await page.evaluate(()=>JSON.stringify({...localStorage}));
  for(let n=0;n<12;n++){
   const b=page.locator(`[data-clue="${n}"]`);if(mode==='touch')await b.tap();else{await b.focus();await page.keyboard.press('Enter');}
   const cells=await page.locator('.lattice-cell.in-line').evaluateAll(els=>els.map(e=>Number(e.dataset.cell)));
   const expected=n<5?Array.from({length:5},(_,i)=>n*5+i):n<10?Array.from({length:5},(_,i)=>i*5+n-5):n===10?[0,6,12,18,24]:[4,8,12,16,20];
   assert.deepEqual(cells,expected);assert.equal(await page.locator('.lattice-explanation').evaluate(el=>el.open),true);
   assert.match(await page.locator('#game-message').innerText(),/black required/);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),saved,'inspecting clues must not change the saved puzzle');
  const index=await page.locator('[data-cell]:not(:disabled)').first().getAttribute('data-cell'),cell=page.locator(`[data-cell="${index}"]`);
  for(const [tool,state] of [['white','white'],['black','black'],['clear','undecided']]){
   await page.locator(`[data-tool="${tool}"]`).click();await cell.tap();assert.match(await cell.getAttribute('aria-label'),new RegExp(': '+state));
  }
  await page.locator('[data-tool="cycle"]').click();
  for(const [key,state] of [['b','black'],['w','white'],['u','undecided']]){if(mode==='touch')await cell.tap();else{await cell.focus();await page.keyboard.press(key);}assert.match(await cell.getAttribute('aria-label'),new RegExp(': '+state));}
  if(mode==='touch')await cell.tap();else await page.keyboard.press('b');
  await page.reload();assert.match(await cell.getAttribute('aria-label'),/: black/);await page.locator('#lattice-undo').click();assert.match(await cell.getAttribute('aria-label'),/: undecided/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('#game-reveal').click();await page.locator('#confirm-reveal').click();await page.locator('[data-clue="11"]').click();assert.equal(await page.locator('.lattice-cell.in-line').count(),5);assert.match(await page.locator('#result-summary').innerText(),/revealed/i);assert.deepEqual(errors,[]);results.push({engine,mode,passed:true});await ctx.close();
 }
 await browser.close();
}
await writeFile('output/lattice-ui-20261104/results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
