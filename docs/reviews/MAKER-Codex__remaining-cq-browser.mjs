import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {playGame} from './MAKER-Codex__elite-deepseek-claude-qa.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const output='/private/tmp/MAKER-Codex__cq-browser';await mkdir(output,{recursive:true});
const pkg=path.join(root,'packages/kimi-pebbles');
const {build}=createRequire(path.join(pkg,'package.json'))('esbuild');
const {chromium}=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
await build({stdin:{contents:"import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/games/quartet/QuartetPage.tsx';createRoot(document.getElementById('root')).render(React.createElement(Page));",resolveDir:pkg,sourcefile:'qa.tsx'},bundle:true,jsx:'automatic',format:'esm',platform:'browser',outfile:path.join(output,'qa.js'),alias:{'@':path.join(pkg,'src')},define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.txt':'text/plain'};
async function session(){
 const context=await browser.newContext({viewport:{width:320,height:844},reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.hostname!=='cq.test')return route.abort();
  let file;
  if(u.pathname==='/games/kimi-quartet/'||u.pathname==='/games/kimi-quartet/index.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html data-game-id="kimi-quartet" lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/games/kimi-runtime/assets/index-D_R05fhP.css"><link rel="stylesheet" href="/qa.css"></head><body><div id="root"></div><script type="module" src="/qa.js"></script></body></html>'});
  if(u.pathname==='/qa.js'||u.pathname==='/qa.css')file=path.join(output,u.pathname.slice(1));
  else{file=path.resolve(root,'.'+u.pathname);if(!file.startsWith(root))return route.abort();if(u.pathname.endsWith('/'))file=path.join(file,'index.html');}
  try{return route.fulfill({contentType:mime[path.extname(file)]??'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:'Not found'});}
 });
 await context.addInitScript(()=>{try{localStorage.setItem('kimi:quartet:seen-help','1');}catch{}Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.__cqShare=value;}},configurable:true});});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-11-01T18:00:00Z'));
 return {context,page,errors};
}
async function geometry(page){return page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('button,input')].filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent,scroll:e.scrollWidth,client:e.clientWidth}))}));}
try{
 for(const name of ['dovetail','splice','sprout','tangle','keystone','tumbler']){
  const {context,page,errors}=await session(),slug='claude-'+name;
  await page.goto('http://cq.test/games/'+slug+'/');await page.locator('#puzzle[data-game-ready="true"]').waitFor();
  const initial=await geometry(page);assert.ok(initial.document<=320,slug+' page overflow');
  if(['dovetail','splice','sprout','keystone','tangle'].includes(name))assert.equal(await page.evaluate(slug=>JSON.parse(localStorage.getItem(slug+':v1:daily:2026-11-01')).state.vocabulary,slug),2);
  await page.screenshot({path:path.join(output,slug+'-320.png'),fullPage:true});
  const result=await playGame(page,slug,{date:'2026-11-01',checkpoint:async()=>{const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));await page.reload();assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),before);}});
  await page.locator('#game-share').click();const share=await page.evaluate(()=>window.__cqShare);assert.ok(share?.includes('Solved'));
  await page.reload();assert.equal(await page.locator('#result').isVisible(),true);assert.equal(await page.locator('#game-hint').isEnabled(),false);
  await page.setViewportSize({width:1280,height:900});assert.ok((await geometry(page)).document<=1280);await page.screenshot({path:path.join(output,slug+'-desktop.png'),fullPage:true});
  assert.deepEqual(errors,[]);reports.push({slug,...result,initial,share,errors});await writeFile(path.join(output,'results.json'),JSON.stringify(reports,null,2));await context.close();
 }
 const {context,page,errors}=await session();await page.goto('http://cq.test/games/kimi-quartet/');await page.locator('[data-game-ready="true"]').waitFor({timeout:5000}).catch(async e=>{console.error(JSON.stringify({errors,body:await page.locator('body').innerText()}));throw e;});
 const initial=await geometry(page);assert.ok(initial.document<=320);assert.deepEqual(initial.overflow,[]);
 await page.screenshot({path:path.join(output,'kimi-quartet-320.png'),fullPage:true});
 const boards=JSON.parse(await readFile(path.join(pkg,'src/games/quartet/data/puzzles.json'),'utf8'));
 // The browser's displayed puzzle number comes from the production selector.
 const {dailyQuartet}=await import(pathToFileURL(path.join(output,'quartet-selector.mjs')).href).catch(async()=>{
  await build({entryPoints:[path.join(pkg,'src/games/quartet/engine.ts')],bundle:true,format:'esm',platform:'node',outfile:path.join(output,'quartet-selector.mjs'),logLevel:'silent'});return import(pathToFileURL(path.join(output,'quartet-selector.mjs')).href);
 });
 const {puzzle}=dailyQuartet(Date.parse('2026-11-01T00:00:00Z')/86400000);assert.ok(boards.length);
 await page.getByRole('button',{name:'Pair glow · 1 free',exact:true}).click();
 for(let i=0;i<4;i++){
  for(const word of puzzle.groups[i].members)await page.locator(`button[aria-label^="Word ${word}"]`).click();
  await page.getByRole('button',{name:'Submit 4/4',exact:true}).click();
  if(i===0){await page.reload();await page.locator('[data-game-ready="true"]').waitFor();assert.equal(await page.locator('.quartet-solved').count(),1);assert.equal(await page.getByRole('button',{name:'Pair glow · used',exact:true}).count(),1);}
 }
 await page.getByRole('dialog').waitFor();assert.equal(await page.getByText('All four found!',{exact:true}).count(),1);
 await page.getByRole('button',{name:'Share result',exact:true}).click();const share=await page.evaluate(()=>window.__cqShare);assert.match(share,/1 pair hint/);
 for(const group of puzzle.groups)for(const word of group.members)assert.ok(!share.toLowerCase().includes(word));
 const resultGeometry=await geometry(page);assert.ok(resultGeometry.document<=320);await page.screenshot({path:path.join(output,'kimi-quartet-results-320.png'),fullPage:true});
 await page.reload();await page.locator('[data-game-ready="true"]').waitFor();assert.equal(await page.locator('.quartet-solved').count(),4);
 assert.deepEqual(errors,[]);reports.push({slug:'kimi-quartet',initial,resultGeometry,share,errors,assistance:'source-assisted'});await context.close();
 const fixture=await session(),{PUZZLES}=await import('../../games/claude-tangle/puzzles.mjs'),E=await import('../../games/claude-tangle/engine.mjs'),alternative=PUZZLES.find(p=>p.id==='tangle-165');
 await fixture.context.addInitScript(({p,state})=>{const key='claude-tangle:v1:daily:2026-11-01';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:164,state}));},{p:alternative,state:E.createExpandedState()});
 await fixture.page.goto('http://cq.test/games/claude-tangle/');
 // A source fixture in this isolated origin verifies an alternative the old client rejected.
 for(const [at,indices]of [[3,4,8,9,15],[0,2,5,6,11,13],[1,7,10,12,14,16]].entries()){
  for(const i of indices)await fixture.page.locator(`[data-bead="${i}"]`).click();await fixture.page.locator('#tangle-pull').click();
  if(at===0){assert.equal(await fixture.page.locator('.tangle-thread strong').textContent(),'TRIAL');await fixture.page.reload();assert.equal(await fixture.page.locator('.tangle-thread strong').textContent(),'TRIAL');}
 }
 assert.equal(await fixture.page.locator('#result-heading').textContent(),'That’s the one.');assert.deepEqual(await fixture.page.locator('.tangle-thread strong').allTextContents(),['TRIAL','DEBATE','RACIAL']);assert.deepEqual(fixture.errors,[]);
 reports.push({slug:'claude-tangle-alternative',puzzleId:alternative.id,assistance:'source fixture; actual controls',words:await fixture.page.locator('.tangle-thread strong').allTextContents(),errors:fixture.errors});await fixture.context.close();
 await writeFile(path.join(output,'results.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
}finally{await browser.close();}
