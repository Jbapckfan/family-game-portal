import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=await import('/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const slugs=['deepseek-twin-hive','deepseek-spare','deepseek-rung','deepseek-cipher','deepseek-trail','deepseek-split','qwen-quadra','qwen-logic-lattice','qwen-syntax-siege','qwen-memory-maze','qwen-pattern-prism','qwen-territory-tactics'];
const out=new URL('../docs/game-reviews/remaining-dq/evidence/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{
 for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('https://alford-dq.invalid/**',async route=>{try{const rel=decodeURIComponent(new URL(route.request().url()).pathname),file=path.resolve(root,'.'+rel);assert.ok(file.startsWith(root));const ext=path.extname(file),types={'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.txt':'text/plain'};await route.fulfill({status:200,body:await readFile(file),contentType:types[ext]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing test fixture'});}});
  await context.addInitScript(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const slug of slugs){
   await page.goto(`https://alford-dq.invalid/games/${slug}/index.html`);await page.locator('[data-game-ready="true"]').waitFor();
   const metrics=await page.evaluate(()=>({intro:parseFloat(getComputedStyle(document.querySelector('.intro')).fontSize),button:parseFloat(getComputedStyle(document.querySelector('.support-actions .button')).fontSize),scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,background:getComputedStyle(document.body).backgroundColor,accent:getComputedStyle(document.body).getPropertyValue('--accent').trim()}));
   assert.ok(metrics.intro>=16,`${slug} ${width}: readable intro, got ${metrics.intro}px`);assert.ok(metrics.button>=14,`${slug}: readable buttons`);assert.ok(metrics.scroll<=metrics.client,`${slug}: no page overflow`);
   if(slug==='deepseek-cipher'&&width<700){const controls=page.locator('.cipher-controls');assert.equal(await controls.count(),1,'Cipher needs one selected-code/keyboard unit');assert.equal(await controls.evaluate(el=>getComputedStyle(el).position),'sticky','Cipher keyboard remains within reach while a long phrase scrolls');}
   await page.locator('#game-help').click();await page.locator('#help-dialog').waitFor({state:'visible'});assert.ok((await page.locator('#help-dialog li').count())>=4);await page.locator('#close-help').click();
   // A real hint must survive reload. Syntax and Maze need no clock to run here.
   await page.locator('#game-hint').click();
   const saved=await page.evaluate(id=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith(id+':v1:'))),slug);
   await page.reload();await page.locator('[data-game-ready="true"]').waitFor();
   const loaded=await page.evaluate(id=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith(id+':v1:'))),slug);assert.deepEqual(loaded,saved,`${slug}: hint/save reload`);
   await page.screenshot({path:fileURLToPath(new URL(`MAKER-Codex__${slug}-${width}.png`,out)),fullPage:true});
   await page.locator('#game-reveal').click();await page.locator('#confirm-reveal').click();await page.locator('#result').waitFor({state:'visible'});
   await page.locator('#game-share').click();const share=await page.evaluate(()=>window.__copied);assert.match(share,new RegExp(slug.split('-').slice(1).map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')));assert.match(share,/Revealed/);assert.ok(share.split('\n').every((line,i)=>i<4||/^Hints: \d+$/.test(line)||line==='Untimed assist'),`${slug}: no solution text in share`);
   await page.reload();await page.locator('#result').waitFor({state:'visible'});assert.equal(await page.locator('#game-share').isVisible(),true);
   await page.locator('#practice-mode').click();await page.locator('[data-game-ready="true"]').waitFor();assert.equal(await page.locator('#game-mode').textContent(),'Practice');assert.equal(await page.locator('#result').isVisible(),false);
   let actualInputWin=false;
   if(width===393){
    const plan=await page.evaluate(async id=>{const {PUZZLES}=await import(`/games/${id}/puzzles.mjs`),E=await import(`/games/${id}/engine.mjs`),raw=JSON.parse(localStorage.getItem(id+':v1:practice')),p=PUZZLES.find(p=>p.id===raw.puzzleId);return {p,route:id==='deepseek-rung'?E.findRoute(p.start,p.target):id==='qwen-territory-tactics'?E.winningPaths(p)[0]:id==='qwen-pattern-prism'?[0,1,2].map(step=>E.correctIndex(p,step)):null};},slug),p=plan.p;
    switch(slug){
     case 'deepseek-twin-hive':for(const word of p.answers.slice(0,p.target)){await page.locator('#hive-word').fill(word);await page.locator('#hive-form button[type=submit]').click();}break;
     case 'deepseek-spare':for(let pair=0;pair<4;pair++){await page.locator(`[data-word="${pair*2}"]`).click();await page.locator(`[data-word="${pair*2+1}"]`).click();await page.locator('#spare-submit').click();}break;
     case 'deepseek-rung':for(const word of plan.route.slice(1)){await page.locator('#rung-word').fill(word);await page.locator('#rung-form button[type=submit]').click();}break;
     case 'deepseek-cipher':for(const [plain,code]of Object.entries(p.key)){if(p.givens.includes(code)||!p.encoded.includes(code))continue;await page.locator(`[data-code="${code}"]`).first().click();await page.locator(`[data-letter="${plain}"]`).click();}break;
     case 'deepseek-trail':for(const cell of p.path)await page.locator(`[data-index="${cell}"]`).click();await page.locator('[data-action="check"]').click();break;
     case 'deepseek-split':{const used=new Set();for(let row=0;row<2;row++){await page.locator(`[data-row="${row}"]`).click();for(const c of p.words[row]){const i=p.rack.findIndex((v,i)=>v===c&&!used.has(i));used.add(i);await page.locator(`[data-index="${i}"]`).click();}}await page.locator('[data-action="check"]').click();break;}
     case 'qwen-quadra':for(const word of p.answers){await page.locator('#quadra-word').fill(word);await page.locator('#quadra-form button[type=submit]').click();}break;
     case 'qwen-logic-lattice':for(let i=0;i<25;i++){if(p.givens.some(([n])=>n===i))continue;await page.locator(`[data-cell="${i}"]`).focus();await page.keyboard.press(p.solution[i]?'b':'w');}break;
     case 'qwen-syntax-siege':await page.locator('#siege-start').click();for(const w of p.waves){const used=new Set();for(const c of w.words[0]){const i=w.rack.findIndex((v,i)=>v===c&&!used.has(i));used.add(i);await page.locator(`[data-letter="${i}"]`).click();}await page.locator('#siege-fire').click();}break;
     case 'qwen-memory-maze':await page.locator('#maze-start').click();await page.waitForFunction(()=>Boolean(document.querySelector('.maze-cell.start:not(:disabled)')));for(const cell of p.path)await page.locator(`[data-cell="${cell}"]`).click();break;
     case 'qwen-pattern-prism':for(const i of plan.route)await page.locator(`[data-choice="${i}"]`).click();break;
     case 'qwen-territory-tactics':for(const key of plan.route)await page.locator(`[data-hex="${key}"]`).click();break;
    }
    await page.locator('#result').waitFor({state:'visible'});assert.equal(await page.locator('#result-heading').textContent(),'That’s the one.',slug+' real input win');
    await page.reload();await page.locator('#result').waitFor({state:'visible'});const savedStatus=await page.evaluate(async id=>{const {PUZZLES}=await import(`/games/${id}/puzzles.mjs`),E=await import(`/games/${id}/engine.mjs`),raw=JSON.parse(localStorage.getItem(id+':v1:practice'));return E.getStatus(PUZZLES.find(p=>p.id===raw.puzzleId),E.restoreState(PUZZLES.find(p=>p.id===raw.puzzleId),raw.state));},slug);assert.equal(savedStatus,'won',slug+' completed practice save remains valid after reload');actualInputWin=true;
    await page.locator('#daily-mode').click();assert.equal(await page.locator('#result-heading').textContent(),'A new way to see it.',slug+' daily reveal remains separate from practice win');
   }
   results.push({slug,width,metrics,hintReload:true,revealReload:true,spoilerFreeShare:true,practiceSeparate:true,actualInputWin});
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 await writeFile(new URL('MAKER-Codex__browser-results.json',out),JSON.stringify({browser:'Chrome headless; isolated contexts; filesystem routes; no server',results},null,2)+'\n');
 console.log(JSON.stringify({checks:results.length,passed:true},null,2));
}finally{await browser.close();}
