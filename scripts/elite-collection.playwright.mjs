// Source-assisted acceptance through actual controls. No state/answer injection.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {GAMES,BONUS_GAMES} from '../games/daily/catalog.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(process.env.DAILY_ELITE_OUTPUT||path.join(root,'output/elite-20261028/collection'));
await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href),rows=[];
const group=slug=>slug.startsWith('kimi-')?'kimi':slug.startsWith('qwen-')?'qwen':slug.startsWith('deepseek-')||slug.startsWith('claude-')?'deepseek-claude':'originals';
const selected=[...GAMES,...BONUS_GAMES].filter(game=>!process.env.GROUPS||process.env.GROUPS.split(',').includes(group(game.slug)));
for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  for(const game of selected){
   const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
   await ctx.route('https://daily.test/**',async route=>{let n=new URL(route.request().url()).pathname;if(n.endsWith('/'))n+='index.html';const f=path.resolve(root,'.'+n),types={'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};if(!f.startsWith(root+path.sep))return route.abort();try{await route.fulfill({path:f,contentType:types[path.extname(f)]});}catch{await route.fulfill({status:404,body:'missing'});}});
   const snapshot=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
   const settle=async()=>{if(game.slug.startsWith('kimi-'))for(let i=0;i<12;i++){await page.clock.runFor(500);if(await page.locator('[data-game-ready="true"]').count())break;}};
   try{
    await page.clock.install({time:new Date('2026-10-28T18:00:00Z')});await page.clock.pauseAt(new Date('2026-10-28T18:00:01Z'));
    await page.goto(`https://daily.test/games/${game.slug}/`);
    await settle();
    await page.waitForFunction(()=>document.querySelectorAll('main button,#puzzle button').length>1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'phone opening fits width');
    const driver=await import(pathToFileURL(path.join(root,'docs/reviews',`MAKER-Codex__elite-${group(game.slug)}-qa.mjs`)).href);
    let checkpoints=0;
    const meta=await driver.playGame(page,game.slug,{checkpoint:async()=>{
     checkpoints++;const before=await snapshot();assert.ok(Object.keys(before).length>0,'real unfinished save exists');await page.reload();await settle();await page.locator('main').first().waitFor();assert.deepEqual(await snapshot(),before,'unfinished save bytes survive reload');
    }});
    assert.equal(checkpoints,1,'one real unfinished reload per game');
    await page.locator(meta.terminalSelector).first().waitFor({state:'visible'});
    if(meta.terminalText)assert.match(await page.locator(meta.terminalSelector).first().innerText(),new RegExp(meta.terminalText,'i'),'actual completed result');
    await page.clock.runFor(900);
    await page.screenshot({path:path.join(out,`${engine}-${game.slug}-completed.png`),fullPage:true});
    const terminal=await snapshot();await page.reload();await settle();await page.locator('main').first().waitFor();assert.deepEqual(await snapshot(),terminal,'terminal save bytes survive reload');
    await page.setViewportSize({width:320,height:568});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'completed narrow phone fits width');
    if(game.slug==='deepseek-cipher'&&driver.checkLongCipherWord){await driver.checkLongCipherWord(page);await page.screenshot({path:path.join(out,`${engine}-cipher-long-word-320.png`),fullPage:true});meta.longWord320=true;}
    assert.deepEqual(errors,[]);
    rows.push({engine,slug:game.slug,...meta,passed:true,unfinishedReload:true,finishedReload:true,narrowWidth:320,errors});
    console.log(`PASS ${engine} ${game.slug}: ${meta.puzzleId}`);
   }catch(error){rows.push({engine,slug:game.slug,error:error.stack,errors});console.log(`FAIL ${engine} ${game.slug}: ${error.message.split('\n')[0]}`);process.exitCode=1;try{await page.screenshot({path:path.join(out,`${engine}-${game.slug}-failure.png`),fullPage:true});}catch{}}
   finally{await ctx.close();}
   await writeFile(path.join(out,'results.json'),JSON.stringify(rows,null,2)+'\n');
  }
 }finally{await browser.close();}
}
console.log(JSON.stringify({passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,total:rows.length}));
