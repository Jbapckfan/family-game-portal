import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {PREVIEW} from '../games/deepseek-split/engine.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/split-harder-20261104/browser');
await mkdir(out,{recursive:true});
const pw=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const results=[],key='deepseek-split:harder-preview:v1';
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true,args:['--disable-gpu']}:{headless:true});
 async function setup(width=393){
  const context=await browser.newContext({viewport:{width,height:950},hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://split.test')return route.abort();
   let name=url.pathname;if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);
   if(!file.startsWith(path.join(root,'games')+path.sep))return route.abort();
   try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]});}
   catch{await route.fulfill({status:404,body:'missing'});}
  });
  const page=await context.newPage();page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});
  await page.goto('https://split.test/games/deepseek-split/');
  await page.locator('[data-preview-index="0"]').waitFor();
  return {page,context,errors};
 }
 async function run(check,fn,width){
  if(process.env.CHECK_ONLY&&check!==process.env.CHECK_ONLY)return;
  let env;try{env=await setup(width);await fn(env.page);assert.deepEqual(env.errors,[]);results.push({engine,check,passed:true});}
  catch(error){results.push({engine,check,passed:false,error:error.stack});if(env)try{await env.page.screenshot({path:path.join(out,`${engine}-${check}-failure.png`),fullPage:true,animations:'disabled',timeout:3000});}catch{}}
  finally{await env?.context.close();}
  console.log(JSON.stringify(results.at(-1)));
 }

 for(const input of ['touch','keyboard'])await run(`${input}-solve-save-share`,async page=>{
  if(input==='keyboard'){await page.locator('#preview-board').focus();await page.keyboard.type(PREVIEW.words.join(''));}
  else{const used=new Set();for(const c of PREVIEW.words.join('')){const i=PREVIEW.rack.findIndex((v,i)=>v===c&&!used.has(i));used.add(i);await page.locator(`[data-preview-index="${i}"]`).tap();}}
  assert.equal(await page.locator('.fits').count(),0);
  assert.equal(await page.locator('#preview-result').isHidden(),true);
  await page.reload();await page.locator('#preview-check').tap();
  assert.match(await page.locator('#preview-result').innerText(),/Both meanings found/);
  await page.reload();assert.match(await page.locator('#preview-result').innerText(),/Both meanings found/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true});});
  await page.locator('#preview-share').tap();const text=await page.locator('#preview-message').innerText();
  assert.match(text,/Harder Preview/);for(const w of PREVIEW.words)assert.ok(!text.includes(w));
 });
 await run('editing-definition-reveal',async page=>{
  await page.locator('[data-preview-index="0"]').tap();await page.keyboard.press('Backspace');
  assert.equal(await page.locator('.preview-tile.used').count(),0);
  await page.locator('[data-define="1"]').tap();await page.reload();assert.equal(await page.locator('.preview-definition').count(),1);
  await page.locator('#preview-reveal').tap();await page.locator('#preview-cancel').tap();assert.ok(await page.locator('#preview-result').isHidden());
  await page.locator('#preview-reveal').tap();await page.locator('#preview-confirm').tap();
  assert.match(await page.locator('#preview-result').innerText(),/Solution revealed/);
  await page.reload();assert.match(await page.locator('#preview-result').innerText(),/Solution revealed/);
 });
 await run('daily-isolation',async page=>{
  await page.locator('a[href="#daily"]').click();await page.locator('[data-index="0"]').click();
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-split:v1:'))));
  await page.locator('a[href="#harder"]').click();await page.locator('[data-preview-index="0"]').tap();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-split:v1:')))),before);
 });
 for(const width of [320,393,1200])await run(`layout-${width}`,async page=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const sizes=await page.locator('.preview-slot,.preview-tile').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
  assert.ok(sizes.every(s=>s.w>=44&&s.h>=44),JSON.stringify(sizes));
  await page.screenshot({path:path.join(out,`${engine}-${width}.png`),fullPage:true});
 },width);
 await browser.close();
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
assert.ok(results.every(r=>r.passed),`${results.filter(r=>!r.passed).length} failures`);
