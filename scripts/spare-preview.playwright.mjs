import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/spare-harder-20261101/browser');
await mkdir(out,{recursive:true});
const pw=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome',headless:true,args:['--disable-gpu']}:{headless:true});
 async function setup(width=393){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,reducedMotion:'reduce'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://spare.test')return route.abort();
   let name=url.pathname;if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);
   if(!file.startsWith(path.join(root,'games')+path.sep))return route.abort();
   try{await route.fulfill({path:file,contentType:({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]});}catch{await route.fulfill({status:404,body:'missing'});}
  });
  const page=await context.newPage();page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-01T18:00:00Z')});
  await page.goto('https://spare.test/games/deepseek-spare/');
  await page.locator('#preview-board').waitFor();
  return {page,context,errors};
 }
 const activate=async(page,selector,input)=>{
  if(input==='touch')await page.locator(selector).tap();
  else{await page.locator(selector).focus();await page.keyboard.press('Enter');}
 };
 const place=async(page,slot,word,input='touch')=>{
  const switcher=page.locator(`#preview-context-${Math.floor(slot/2)}`);
  if(await switcher.isVisible())await activate(page,`#preview-context-${Math.floor(slot/2)}`,input);
  await activate(page,`#preview-slot-${slot}`,input);
  await activate(page,`#preview-word-${word}`,input);
 };
 async function run(check,fn,width){
  if(process.env.CHECK_ONLY&&check!==process.env.CHECK_ONLY)return;
  let env;try{env=await setup(width);await fn(env.page);assert.deepEqual(env.errors,[]);results.push({engine,check,passed:true});}
  catch(error){results.push({engine,check,passed:false,error:error.message});if(env)try{await env.page.screenshot({path:path.join(out,`${engine}-${check}-failure.png`),fullPage:true,animations:'disabled',timeout:3000});}catch{}}
  finally{await env?.context.close();}
  console.log(JSON.stringify(results.at(-1)));
 }
 for(const input of ['touch','keyboard'])await run(`${input}-solve-save-share`,async page=>{
  for(let i=0;i<8;i++)await place(page,i,i^1,input);
  await page.reload();
  assert.equal(await page.locator('.preview-slot.filled').count(),8);
  await activate(page,'#preview-check',input);
  assert.match(await page.locator('#preview-result').innerText(),/Every meaning fits/);
  await page.reload();
  assert.match(await page.locator('#preview-result').innerText(),/Solved in 1 check/);
  await page.evaluate(()=>{window.copied=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied.push(text)},configurable:true});});
  await activate(page,'#preview-share',input);
  const copied=await page.evaluate(()=>window.copied[0]);
  assert.match(copied,/Preview 01/);assert.match(copied,/Solved/);
  assert.ok(!/\b(light|heavy|dark|sharp|flat|bright|soft|loud|dull)\b/i.test(copied));
 });
 await run('swap-remove-history-repeat-and-loss',async page=>{
  for(let i=0;i<8;i++)await place(page,i,i);
  await place(page,0,8);await page.locator('#preview-check').tap();
  assert.match(await page.locator('#preview-message').innerText(),/3 of 4/);
  await place(page,0,1);await page.locator('#preview-check').tap();
  assert.match(await page.locator('#preview-message').innerText(),/already checked/);
  assert.equal(await page.locator('.preview-check-history').count(),1);
  if(await page.locator('#preview-context-0').isVisible())await page.locator('#preview-context-0').tap();
  await page.locator('#preview-slot-0').tap();await page.locator('#preview-return').tap();
  assert.equal(await page.locator('.preview-slot.filled').count(),7);
  assert.ok(await page.locator('#preview-check').isDisabled());
  await page.locator('#preview-word-1').tap();
  for(const word of [2,4,6]){await place(page,0,word);await page.locator('#preview-check').tap();}
  assert.match(await page.locator('#preview-result').innerText(),/Four checks used/);
  assert.equal(await page.locator('.preview-check-history').count(),4);
  await page.reload();assert.match(await page.locator('#preview-result').innerText(),/Four checks used/);
 });
 await run('daily-save-preserved-and-reveal-cancel',async page=>{
  await page.locator('.preview-back').click();await page.locator('[data-word]').first().click();
  const daily=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-spare:v1:'))));
  assert.ok(Object.keys(daily).length);
  await page.locator('.preview-link').click();await page.locator('#preview-reveal').click();
  await page.locator('#preview-cancel').click();assert.equal(await page.locator('#preview-result').isVisible(),false);
  await page.locator('#preview-reveal').click();await page.locator('#preview-confirm-reveal').click();
  assert.match(await page.locator('#preview-result').innerText(),/Solution revealed/);
  const after=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('deepseek-spare:v1:'))));
  assert.deepEqual(after,daily);
  await page.locator('.preview-back').click();
  await page.locator('[data-word]').first().waitFor();
  assert.equal(await page.locator('[data-word][aria-pressed="true"]').count(),1);
 });
 await run('storage-unavailable',async page=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Blocked storage');}});});
  await page.reload();await place(page,0,0);
  assert.match(await page.locator('#preview-storage').innerText(),/Saving is unavailable/);
  assert.equal(await page.locator('.preview-slot.filled').count(),1);
 });
 await run('optional-clue-and-alternative-solution',async page=>{
  assert.equal(await page.locator('.preview-clue small').count(),0);
  await page.locator('#preview-clarify').tap();
  assert.equal(await page.locator('.preview-clue small').count(),1);
  await page.reload();assert.equal(await page.locator('.preview-clue small').count(),1);
  for(let i=0;i<8;i++)await place(page,i,i===4?8:i);
  await page.locator('#preview-check').tap();
  assert.match(await page.locator('#preview-result').innerText(),/Every meaning fits/);
  assert.match(await page.locator('#preview-result').innerText(),/spare is DULL/);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied');}},configurable:true});});
  await page.locator('#preview-share').tap();
  assert.match(await page.locator('#preview-message').innerText(),/1 context clue used/);
 });
 await run('repeated-tap-never-moves-without-retargeting',async page=>{
  await page.locator('#preview-word-0').tap();await page.locator('#preview-word-0').tap();
  assert.equal(await page.locator('#preview-slot-0').innerText(),'LIGHT');
  assert.equal(await page.locator('.preview-slot.filled').count(),1);
  await page.locator('#preview-slot-1').tap();await page.locator('#preview-word-0').tap();
  assert.equal(await page.locator('#preview-slot-1').innerText(),'LIGHT');
  assert.equal(await page.locator('.preview-slot.filled').count(),1);
 });
 for(const width of [320,393,1200])await run(`layout-${width}`,async page=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const sizes=await page.locator('.preview-slot:visible,.preview-word:visible,.preview-context-switch button:visible').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth+1})));
  assert.ok(sizes.every(s=>s.w>=44&&s.h>=44&&!s.overflow),JSON.stringify(sizes));
  await page.screenshot({path:path.join(out,`${engine}-${width}.png`),fullPage:true});
 },width);
 await browser.close();
}
await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
assert.ok(results.every(r=>r.passed),`${results.filter(r=>!r.passed).length} failures`);
