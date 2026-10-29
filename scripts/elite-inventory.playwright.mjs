import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {GAMES,BONUS_GAMES} from '../games/daily/catalog.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/elite-20261028/inventory');
await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href);
const rows=[];
for(const engine of (process.env.ENGINES||'chromium').split(',')){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',args:['--disable-gpu','--disable-gpu-compositing']}:{});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.route('https://daily.test/**',async route=>{
   let name=new URL(route.request().url()).pathname;if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name),types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};
   if(!file.startsWith(root+path.sep))return route.abort();
   try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}
  });
  for(const game of [...GAMES,...BONUS_GAMES]){
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.clock.install({time:new Date('2026-10-28T18:00:00Z')});
    await page.goto(`https://daily.test/games/${game.slug}/`);
    await page.waitForFunction(()=>document.querySelectorAll('main button,#puzzle button').length>1);
    await page.screenshot({path:path.join(out,`${engine}-${game.slug}-phone.png`),fullPage:true});
    const describe=()=>({title:document.title,text:document.body.innerText,controls:[...document.querySelectorAll('button,input')].map(e=>({tag:e.tagName,id:e.id,text:e.innerText||e.getAttribute('aria-label'),data:{...e.dataset},disabled:e.disabled})),overflow:document.documentElement.scrollWidth>innerWidth+1});
    const state=await page.evaluate(describe);
    await page.setViewportSize({width:320,height:568});
    const narrowOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    rows.push({engine,slug:game.slug,...state,narrowOverflow,errors});
    console.log(`${engine} ${game.slug}: controls=${state.controls.length}, overflow=${state.overflow}/${narrowOverflow}, errors=${errors.length}`);
   }catch(error){rows.push({engine,slug:game.slug,error:error.stack,errors});process.exitCode=1;}
   finally{await page.close();}
  }
  await context.close();
 }finally{await browser.close();}
}
await writeFile(path.join(out,'inventory.json'),JSON.stringify(rows,null,2)+'\n');
