import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {PREVIEW} from '../games/deepseek-trail/engine.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/trail-harder-20261103/browser');
await mkdir(out,{recursive:true});
const pw=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const results=[],key='deepseek-trail:4x4-preview:v1';
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true,args:['--disable-gpu']}:{headless:true});
 async function setup(width=393){
  const context=await browser.newContext({viewport:{width,height:950},hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://trail.test')return route.abort();
   let name=url.pathname;if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);
   if(!file.startsWith(path.join(root,'games')+path.sep))return route.abort();
   try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]});}
   catch{await route.fulfill({status:404,body:'missing'});}
  });
  const page=await context.newPage();page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-03T18:00:00Z')});
  await page.goto('https://trail.test/games/deepseek-trail/');
  await page.locator('#preview-tile-0').waitFor();
  return {page,context,errors};
 }
 async function run(check,fn,width){
  if(process.env.CHECK_ONLY&&check!==process.env.CHECK_ONLY)return;
  let env;try{env=await setup(width);await fn(env.page);assert.deepEqual(env.errors,[]);results.push({engine,check,passed:true});}
  catch(error){results.push({engine,check,passed:false,error:error.stack});if(env)try{await env.page.screenshot({path:path.join(out,`${engine}-${check}-failure.png`),fullPage:true,animations:'disabled',timeout:3000});}catch{}}
  finally{await env?.context.close();}
  console.log(JSON.stringify(results.at(-1)));
 }
 const tap=async(page,i)=>page.locator(`#preview-tile-${i}`).tap();
 async function keyboardSelect(page,i){
  let from=await page.evaluate(()=>Number(document.activeElement?.dataset.previewIndex??0));
  if(!await page.locator('[data-preview-index]:focus').count())await page.locator('#preview-tile-0').focus();
  while(Math.floor(from/4)!==Math.floor(i/4)){const step=from<i?4:-4;await page.keyboard.press(step>0?'ArrowDown':'ArrowUp');from+=step;}
  while(from%4!==i%4){const step=from%4<i%4?1:-1;await page.keyboard.press(step>0?'ArrowRight':'ArrowLeft');from+=step;}
  assert.equal(await page.evaluate(()=>document.activeElement.id),`preview-tile-${i}`);
  await page.keyboard.press(i%2?'Space':'Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),`preview-tile-${i}`,'selection preserves tile focus');
 }
 for(const input of ['touch','keyboard'])await run(`${input}-solve-reload-share`,async page=>{
  for(const i of PREVIEW.path)await (input==='touch'?tap(page,i):keyboardSelect(page,i));
  assert.equal(await page.locator('.trail-tile.selected').count(),9);
  await page.reload();assert.equal(await page.locator('.trail-tile.selected').count(),9);
  if(input==='touch')await page.locator('#preview-check').tap();
  else{await page.locator('#preview-check').focus();await page.keyboard.press('Enter');}
  assert.match(await page.locator('#preview-result').innerText(),/Solved in 1 check/);
  await page.reload();assert.match(await page.locator('#preview-result').innerText(),/Solved in 1 check/);
  assert.ok(await page.locator('#preview-tile-0').isDisabled());
  await page.evaluate(()=>{window.copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied.push(text)},configurable:true});});
  await page.locator('#preview-share').tap();
  const share=await page.evaluate(()=>window.copied[0]);
  assert.match(share,/Preview 01/);assert.match(share,/Solved/);assert.ok(!share.includes(PREVIEW.answer));
 });
 await run('wrong-path-repeat-backtrack-and-keyboard-boundaries',async page=>{
  for(const i of [0,1,2,3,7,6,5,4,8])await tap(page,i);
  await tap(page,9);assert.equal(await page.locator('.trail-tile.selected').count(),9);
  await page.locator('#preview-check').tap();assert.match(await page.locator('#preview-message').innerText(),/does not fit/);
  await page.locator('#preview-check').tap();assert.match(await page.locator('#preview-message').innerText(),/already checked/);
  assert.equal(await page.locator('.preview-history li').count(),1);
  await page.locator('.preview-history summary').click();
  await tap(page,1);assert.equal(await page.locator('.trail-tile.selected').count(),2);
  assert.equal(await page.locator('.preview-history').evaluate(el=>el.open),true);
  await page.keyboard.press('Backspace');assert.equal(await page.locator('.trail-tile.selected').count(),1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.trail-tile.selected').count(),0);
  await page.locator('#preview-tile-3').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'preview-tile-3');
  await page.keyboard.press('Enter');await tap(page,4);
  assert.equal(await page.locator('.trail-tile.selected').count(),1);
  assert.match(await page.locator('#preview-message').innerText(),/neighboring/);
  await page.locator('#preview-clear').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'preview-tile-0');
  await page.keyboard.press('Space');
  await page.locator('#preview-undo').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'preview-tile-0');
  assert.match(await page.locator('#preview-trail-announcement').innerText(),/empty/);
 });
 await run('definition-save-reveal-cancel-and-share-fallback',async page=>{
  assert.ok(await page.locator('#preview-definition-text').isHidden());
  await page.locator('#preview-definition').tap();
  await page.reload();assert.ok(await page.locator('#preview-definition-text').isVisible());
  assert.ok(await page.locator('#preview-definition').isDisabled());
  await page.locator('#preview-reveal').tap();await page.locator('#preview-cancel').tap();
  assert.ok(await page.locator('#preview-result').isHidden());
  await page.locator('#preview-reveal').tap();await page.locator('#preview-confirm-reveal').tap();
  assert.match(await page.locator('#preview-result').innerText(),/Solution revealed/);
  await page.reload();assert.match(await page.locator('#preview-result').innerText(),/Solution revealed/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true});});
  await page.locator('#preview-share').tap();
  const share=await page.locator('#preview-message').innerText();
  assert.match(share,/Definition used/);assert.match(share,/Revealed/);assert.ok(!share.includes(PREVIEW.answer));
 });
 await run('daily-save-isolation',async page=>{
  await page.locator('.preview-back').click();await page.locator('[data-index="0"]').click();
  const daily=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-trail:v1:'))));
  assert.ok(Object.keys(daily).length);
  await page.locator('.preview-link').click();await tap(page,5);await tap(page,10);
  await page.locator('#preview-definition').click();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-trail:v1:')))),daily);
  await page.locator('.preview-back').click();
  await page.locator('[data-index="0"]').waitFor();
  assert.equal(await page.locator('[data-index][aria-pressed="true"]').count(),1);
  await page.locator('.preview-link').click();
  await page.locator('#preview-tile-0').waitFor();
  assert.equal(await page.locator('.trail-tile.selected').count(),2);
 });
 await run('corrupt-save-and-storage-unavailable',async page=>{
  await page.evaluate(key=>localStorage.setItem(key,'{"path":[900],"revealed":true}'),key);
  await page.reload();assert.equal(await page.locator('.trail-tile.selected').count(),0);
  assert.match(await page.locator('#preview-message').innerText(),/could not be restored/);
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Blocked storage');}});});
  await page.reload();await tap(page,5);
  assert.match(await page.locator('#preview-storage').innerText(),/Saving is unavailable/);
  assert.equal(await page.locator('.trail-tile.selected').count(),1);
 });
 for(const width of [320,393,1200])await run(`layout-${width}`,async page=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const sizes=await page.locator('.trail-tile').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
  assert.ok(sizes.every(s=>s.w>=44&&s.h>=44),JSON.stringify(sizes));
  await page.screenshot({path:path.join(out,`${engine}-${width}.png`),fullPage:true});
  for(const i of [5,10,13])await tap(page,i);
  const centered=await page.evaluate(()=>{
   const svg=document.querySelector('.trail-lines').getBoundingClientRect();
   return [...document.querySelectorAll('.trail-tile')].every((el,i)=>{
    const r=el.getBoundingClientRect();
    return Math.abs(r.x+r.width/2-(svg.x+(i%4+.5)*svg.width/4))<1&&Math.abs(r.y+r.height/2-(svg.y+(Math.floor(i/4)+.5)*svg.height/4))<1;
   });
  });
  assert.ok(centered,'route lines must pass through tile centers');
  await page.screenshot({path:path.join(out,`${engine}-${width}-selected.png`),fullPage:true});
 },width);
 await browser.close();
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
assert.ok(results.every(r=>r.passed),`${results.filter(r=>!r.passed).length} failures`);
