/** Isolated, source-assisted regression; no server or personal browser/profile. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as E from '../games/qwen-territory-tactics/engine.mjs';
import {PUZZLES as LEGACY} from '../games/qwen-territory-tactics/puzzles.mjs';
import {EXACT_PUZZLES,EXACT_EDITION} from '../games/qwen-territory-tactics/exact-puzzles.mjs';
import {dailyIndex} from '../games/deepseek-runtime/core.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'output/MAKER-codex__territory-exact-20261106');await mkdir(out,{recursive:true});
const pw=await import(pathToFileURL(process.env.DAILY_PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs').href);
const date='2026-11-06',prefix='qwen-territory-tactics:v1:',edition=prefix+`edition:${EXACT_EDITION}:`,url='https://territory.test/games/qwen-territory-tactics/';
let oldState=E.createState(LEGACY[1]);for(const key of E.winningPaths(LEGACY[1])[0])oldState=E.place(LEGACY[1],oldState,key).state;
const legacyEntries={
 [prefix+'daily:'+date]:JSON.stringify({version:1,puzzleId:LEGACY[1].id,puzzleIndex:1,state:oldState}),
 [prefix+'records']:JSON.stringify({'2026-11-05':{status:'won'},[date]:{status:'won'}}),
 [prefix+'status:'+date]:JSON.stringify({status:'won'}),
 [prefix+'practice']:JSON.stringify({version:1,puzzleId:LEGACY[0].id,puzzleIndex:0,state:E.createState(LEGACY[0])})
};
function trap(p,over){let found;function search(s){const captured=E.simulate(p,s.moves).captured;if(over?captured>p.target:captured>0&&captured<p.target&&s.moves.length===3){found=s.moves;return true;}if(E.getStatus(p,s)!=='playing'||s.moves.length===3)return false;for(const key of E.cells(p)){const next=E.place(p,s,key).state;if(next!==s&&search(next))return true;}return false;}search(E.createState(p));assert.ok(found);return found;}
const results=[];
for(const name of ['chromium','webkit']){
 const browser=await pw[name].launch(name==='chromium'?{channel:'chrome'}:{});
 try{for(const width of [320,393,1280]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<500,isMobile:width<500}),page=await ctx.newPage(),errors=[];
  page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await ctx.route('**/*',async route=>{
   const u=new URL(route.request().url());if(u.origin!=='https://territory.test')return route.abort();
   const rel=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname,file=path.resolve(root,'.'+rel);
   if(!file.startsWith(root+path.sep))return route.abort();
   const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
   try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await page.clock.install({time:new Date(date+'T18:00:00Z')});
  await ctx.addInitScript(entries=>{if(!localStorage.getItem('territory-test-seeded')){for(const [k,v] of Object.entries(entries))localStorage.setItem(k,v);localStorage.setItem('territory-test-seeded','1');}},legacyEntries);
  await page.goto(url);await page.waitForSelector('[data-game-ready="true"]');
  assert.equal(await page.locator('[data-hex]').count(),37);assert.match(await page.locator('.territory-task').innerText(),/EXACTLY/);
  assert.equal(await page.locator('.territory-capture-example svg').count(),2);assert.equal(await page.locator('#result').isVisible(),false);
  const envelope=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),edition+'daily:'+date),p=EXACT_PUZZLES.find(p=>p.id===envelope.puzzleId);assert.ok(p);
  assert.equal(p.radius,3);assert.deepEqual(envelope.state.moves,[]);
  const layout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,width:innerWidth,targets:[...document.querySelectorAll('[data-hex]')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height};}),board:document.querySelector('.territory-board-viewport').getBoundingClientRect().toJSON()}));
  assert.ok(layout.doc<=layout.width+1,`${name}/${width} document overflow`);assert.ok(layout.targets.every(r=>r.width>=44&&r.height>=44));
  await page.screenshot({path:path.join(out,`${name}-${width}-expanded.png`),fullPage:true});
  await page.locator('#territory-guide summary').click();
  const play=async moves=>{for(const key of moves){const cell=page.locator(`[data-hex="${key}"]`);await cell.scrollIntoViewIfNeeded();if(width<500)await cell.tap();else await cell.click();}};
  await play(trap(p,false));assert.equal(await page.locator('#result').isVisible(),false);assert.match(await page.locator('.territory-note').innerText(),/more needed/);
  await page.reload();await page.waitForSelector('[data-game-ready="true"]');assert.match(await page.locator('.territory-note').innerText(),/more needed/);
  await page.locator('#territory-restart').click();await play(trap(p,true));
  assert.equal(await page.locator('#result').isVisible(),false);assert.match(await page.locator('.territory-note').innerText(),/too many/);assert.match(await page.locator('.territory-note').innerText(),/Undo/);
  assert.equal(await page.locator('[data-hex]:enabled').count(),0);assert.equal(await page.locator('#territory-undo').isEnabled(),true);
  await page.locator('#territory-undo').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-hex]:enabled').count()>0,true);
  await page.locator('#territory-restart').click();const winning=E.winningPaths(p)[0];
  const first=page.locator(`[data-hex="${winning[0]}"]`);await first.focus();await page.keyboard.press('Space');
  await page.reload();await page.waitForSelector('[data-game-ready="true"]');
  const partial=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,edition+'daily:'+date);assert.deepEqual(partial.moves,[winning[0]]);
  await page.locator('#territory-restart').click();await play(trap(p,true));
  for(let i=0;i<7&&!await page.locator('#result').isVisible();i++)await page.locator('#game-hint').click();
  assert.equal(await page.locator('#result').isVisible(),true);assert.match(await page.locator('.territory-note').innerText(),new RegExp(`Exactly ${p.target} stones captured`));
  assert.match(await page.locator('#local-stats').innerText(),/2 daily played · 2 solved/);
  await page.reload();await page.waitForSelector('[data-game-ready="true"]');assert.equal(await page.locator('#result').isVisible(),true);
  for(const [key,value] of Object.entries(legacyEntries))assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),value);
  await page.locator('#practice-mode').click();assert.equal(await page.locator('#result').isVisible(),false);
  const practice=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),edition+'practice');assert.ok(practice.puzzleId.startsWith('territory-exact-'));assert.notEqual(practice.puzzleId,p.id);
  const protectedIds=new Set(Array.from({length:186},(_,offset)=>EXACT_PUZZLES[dailyIndex('qwen-territory-tactics:'+EXACT_EDITION,new Date(Date.parse(date+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10),EXACT_PUZZLES.length)].id));
  assert.ok(!protectedIds.has(practice.puzzleId),'actual app config protects upcoming daily boards');
  for(let i=0;i<3;i++){await page.locator('#practice-mode').click();const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),edition+'practice');assert.ok(!protectedIds.has(next.puzzleId));}
  await page.locator('#daily-mode').click();assert.equal(await page.locator('#result').isVisible(),true);
  assert.deepEqual(errors,[]);results.push({engine:name,width,puzzleId:p.id,minTargetWidth:Math.min(...layout.targets.map(r=>r.width)),minTargetHeight:Math.min(...layout.targets.map(r=>r.height)),legacyPreserved:true,underOverUndoHintsKeyboardReloadPractice:true,protectedUpcomingDailyDates:186,errors});
  await ctx.close();
 }}catch(error){results.push({engine:name,error:error.stack});process.exitCode=1;}finally{await browser.close();}
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
