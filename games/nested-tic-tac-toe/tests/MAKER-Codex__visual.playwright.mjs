/** Isolated filesystem-backed HTTPS test; no listener, personal profile or network. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGame,legalMoves,playMove,saveMatch} from '../engine.mjs';
import {chooseMove} from '../ai.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const {chromium,webkit} = await import(process.env.PLAYWRIGHT_MODULE || '/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const out = process.env.TTT_EVIDENCE || '/private/tmp/MAKER-Codex__ttt-ui-20261104';
await fs.mkdir(out,{recursive:true});
let seed=101;
function random(n){ seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n; }
const fixtures={};
// All fixtures are legal, replayable moves. Human play varies; AI is the real casual player.
for(let game=0;game<1000 && Object.keys(fixtures).length<4;game++){
 let state=createGame();
 while(state.status==='playing'){
  const moves=legalMoves(state), move=state.turn==='O'?chooseMove(state,{skill:'casual'}).move:moves[random(moves.length)];
  const next=playMove(state,move);
  if(!state.boards[move.board] && next.boards[move.board]){
   const result=next.boards[move.board];
   if(result==='X'&&!fixtures.X)fixtures.X={state,move,next};
   if(result==='O'&&!fixtures.O)fixtures.O={state,move,next};
   if(result==='draw'&&!fixtures.draw)fixtures.draw={state:next};
  }
  if(['X','O'].includes(next.status)&&!fixtures.macro)fixtures.macro={state:next};
  state=next;
 }
}
assert.equal(Object.keys(fixtures).length,4);
const results=[];
for(const browserType of [chromium,webkit]){
 const browser=await browserType.launch(browserType===chromium?{channel:'chrome',headless:true}:{headless:true});
 try {
 for(const [name,viewport] of [['desktop',{width:1280,height:1050}],['phone',{width:390,height:844}],['small',{width:320,height:740}]]){
  const context=await browser.newContext({viewport});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://alford.test')return route.abort();
   const target=path.resolve(root,`.${decodeURIComponent(url.pathname)}`);
   assert.ok(target.startsWith(root+path.sep));
   try {const file=(await fs.stat(target)).isDirectory()?path.join(target,'index.html'):target;
    await route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html'});
   }catch{await route.fulfill({status:404,body:'Not found'});}
  });
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  async function load(state,reduced=false){
   await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
   await page.goto('https://alford.test/games/nested-tic-tac-toe/');
   await page.evaluate(saved=>localStorage.setItem('alford:tic-tac-toe:v1:match',JSON.stringify(saved)),saveMatch(state,{skill:'casual',guideDismissed:true}));
   await page.reload();
   await page.waitForSelector('[data-game-ready="true"]');
  }
  await load(createGame());
  assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('body').innerText().then(text=>/chatgpt/i.test(text)),false);
  assert.equal(await page.locator('.mini-board').count(),9);
  for(const button of await page.locator('.cell').all()){const box=await button.boundingBox();assert.ok(box.width>=44&&box.height>=44);}
  await page.screenshot({path:path.join(out,`${browserType.name()}-${name}-start.png`),fullPage:true});
  await load(fixtures.X.state);
  await page.locator('.mini-board').nth(fixtures.X.move.board).click();
  await page.locator('.cell').nth(fixtures.X.move.cell).click();
  const winner=page.locator('.mini-board').nth(fixtures.X.move.board);
  await winner.waitFor({state:'visible'});
  assert.match(await winner.getAttribute('class'),/result-x/);
  const animation=await winner.locator('.board-overlay').evaluate(el=>el.getAnimations().length);
  assert.ok(animation>0,'new human mini win animates');
  const claimBounds=await winner.boundingBox();
  assert.ok(claimBounds.y>=0 && claimBounds.y+claimBounds.height<=viewport.height,'claim is visible even when playing below the overview');
  await page.waitForFunction(()=>document.querySelector('#puzzle').dataset.turn==='X');
  assert.ok(await page.locator('.cell:not(:disabled)').count()>0,'next move works without animation lock');
  // The closure animation is still running as human input resumes.
  await page.locator('.cell:not(:disabled)').first().click();
  assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('alford:tic-tac-toe:v1:match')).history.length))>fixtures.X.next.history.length);
  await load(fixtures.X.next);
  await page.waitForFunction(()=>document.querySelector('#puzzle').dataset.turn==='X');
  await page.locator('#macro-board').screenshot({path:path.join(out,`${browserType.name()}-${name}-claimed.png`)});
  await load(fixtures.O.state);
  await page.waitForFunction(board=>document.querySelectorAll('.mini-board')[board].classList.contains('result-o'),fixtures.O.move.board);
  await load(fixtures.draw.state);
  assert.ok(await page.locator('.result-draw').count()>0);
  await page.locator('#macro-board').screenshot({path:path.join(out,`${browserType.name()}-${name}-draw.png`)});
  await load(fixtures.macro.state);
  assert.ok(await page.locator('.winning-board').count()>=3);
  assert.equal(await page.locator('.board-overlay').evaluateAll(els=>els.reduce((n,el)=>n+el.getAnimations().length,0)),0,'restored match does not replay animations');
  assert.equal(await page.locator('.cell:not(:disabled)').count(),0);
  await page.screenshot({path:path.join(out,`${browserType.name()}-${name}-finished.png`),fullPage:true});
  await load(fixtures.X.state,true);
  await page.locator('.mini-board').nth(fixtures.X.move.board).click();
  await page.locator('.cell').nth(fixtures.X.move.cell).click();
  assert.equal(await page.locator('.board-overlay').evaluateAll(els=>els.reduce((n,el)=>n+el.getAnimations().length,0)),0);
  assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
  if(name==='phone') {
   await context.addInitScript(()=>window.__ALFORD_NATIVE__=true);
   await load(createGame());
   assert.equal(await page.locator('.masthead').isVisible(),false);
   assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
   await page.screenshot({path:path.join(out,`${browserType.name()}-native-start.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);
  results.push({browser:browserType.name(),layout:name,passed:true});
  await context.close();
 }
 }finally{await browser.close();}
}
await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,fixtures},null,2));
console.log(JSON.stringify(results,null,2));
