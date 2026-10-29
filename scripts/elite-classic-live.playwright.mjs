import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';import {mkdir,writeFile} from 'node:fs/promises';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/elite-20261028');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),rows=[];
for(const engine of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{for(const slug of ['tradeoff','inbetween']){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  try{
   await ctx.route('https://daily.test/**',async r=>{let n=new URL(r.request().url()).pathname;if(n.endsWith('/'))n+='index.html';const f=path.resolve(root,'.'+n);if(!f.startsWith(root+path.sep))return r.abort();try{await r.fulfill({path:f,contentType:({'.mjs':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(f)]});}catch{await r.fulfill({status:404,body:'missing'});}});
   const first=await ctx.newPage(),second=await ctx.newPage();for(const p of [first,second]){p.setDefaultTimeout(5000);await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});await p.goto(`https://daily.test/games/${slug}/`);}
   const E=await import(`../games/${slug}/engine.mjs`),{PUZZLES}=await import(`../games/${slug}/puzzles.mjs`),{puzzle}=E.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z'));
   async function action(p,move){if(slug==='tradeoff'){for(const c of [move.a,move.b])await p.locator(`[data-row="${c.row}"][data-col="${c.col}"]`).click();}else{await p.locator(`[data-tile="${move.tileId}"]`).click();await p.locator(`[data-row="${move.row}"][data-gap="${move.gap}"]`).click();await p.locator(`[data-fit="${move.row}"]`).click();}}
   const firstMove=E.findHint(puzzle,E.createGame(puzzle));await action(first,firstMove);
   const count=slug==='tradeoff'?'move-count':'attempt-count';await second.waitForFunction(id=>document.getElementById(id).textContent==='1',count);
   const state=slug==='tradeoff'?E.swapLetters(puzzle,E.createGame(puzzle),firstMove.a,firstMove.b).state:E.submitPlacement(puzzle,E.createGame(puzzle),firstMove).state;
   await action(second,E.findHint(puzzle,state));
   const saved=await second.evaluate(key=>JSON.parse(localStorage.getItem(key)),`${slug}:v1:daily:2026-10-28`);
   assert.equal(slug==='tradeoff'?saved.moves:saved.attempts,2,'the first move after a delivered update must be accepted');
   rows.push({engine,slug,passed:true});
  }catch(error){rows.push({engine,slug,error:error.stack});process.exitCode=1;}finally{await ctx.close();}
 }}finally{await browser.close();}
}
await writeFile(path.join(out,'classic-live-results.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows,null,2));
