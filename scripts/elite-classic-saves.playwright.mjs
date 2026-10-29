import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';import {mkdir,writeFile} from 'node:fs/promises';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/elite-20261028');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),rows=[];
for(const engine of (process.env.ENGINES||'chromium').split(',')){
const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
try{for(const slug of ['tradeoff','inbetween']){
const ctx=await browser.newContext({viewport:{width:390,height:844}});
try{
await ctx.route('https://daily.test/**',async r=>{let n=new URL(r.request().url()).pathname;if(n.endsWith('/'))n+='index.html';const f=path.resolve(root,'.'+n);if(!f.startsWith(root+path.sep))return r.abort();try{await r.fulfill({path:f,contentType:({'.mjs':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(f)]});}catch{await r.fulfill({status:404,body:'missing'});}});
await ctx.addInitScript(()=>{const add=window.addEventListener.bind(window);window.addEventListener=(type,...args)=>{if(type!=='storage')add(type,...args);};});
const first=await ctx.newPage(),stale=await ctx.newPage();for(const p of [first,stale]){p.setDefaultTimeout(5000);await p.clock.install({time:new Date('2026-10-28T18:00:00Z')});await p.goto(`https://daily.test/games/${slug}/`);}
const E=await import(`../games/${slug}/engine.mjs`),{PUZZLES}=await import(`../games/${slug}/puzzles.mjs`),{puzzle}=E.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z'));
let state=E.createGame(puzzle);const steps=[];for(let i=0;i<4;i++){const move=E.findHint(puzzle,state);steps.push(move);state=slug==='tradeoff'?E.swapLetters(puzzle,state,move.a,move.b).state:E.submitPlacement(puzzle,state,move).state;}
async function action(p,move){if(slug==='tradeoff'){for(const c of [move.a,move.b])await p.locator(`[data-row="${c.row}"][data-col="${c.col}"]`).click();}else{await p.locator(`[data-tile="${move.tileId}"]`).click();await p.locator(`[data-row="${move.row}"][data-gap="${move.gap}"]`).click();await p.locator(`[data-fit="${move.row}"]`).click();}}
await action(first,steps[0]);await action(first,steps[1]);const key=`${slug}:v1:daily:2026-10-28`,saved=await first.evaluate(k=>localStorage.getItem(k),key);
await stale.locator('#stats-button').click();await stale.locator('#dialog-close').click();await action(stale,steps[0]);assert.equal(await first.evaluate(k=>localStorage.getItem(k),key),saved,'stale classic window cannot overwrite newer unfinished play after Stats');
await stale.evaluate(prefix=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(window.__denyRead&&k.startsWith(prefix))throw Error('QA blocked read');return get.call(this,k);};window.__denyRead=true;},`${slug}:v1:`);
await action(stale,steps[2]);assert.equal(await first.evaluate(k=>localStorage.getItem(k),key),saved,'unreadable existing save cannot receive an unverified write');
await stale.locator('#daily-tab').click();await stale.evaluate(()=>window.__denyRead=false);await action(stale,steps[3]);assert.notEqual(await first.evaluate(k=>localStorage.getItem(k),key),saved,'verified read resumes persistence from memory');
rows.push({engine,slug,passed:true});
}catch(error){rows.push({engine,slug,error:error.stack});process.exitCode=1;}finally{await ctx.close();}
}}finally{await browser.close();}}
await writeFile(path.join(out,'classic-saves-results.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows,null,2));
