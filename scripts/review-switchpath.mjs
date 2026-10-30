// Uses installed browsers, an isolated context and intercepted HTTPS; no listener or external traffic.
import path from 'node:path';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(import.meta.dirname,'..'),out=process.env.REVIEW_OUTPUT?path.resolve(process.env.REVIEW_OUTPUT):path.join(root,'output/switchpath-review-20261030');
await mkdir(out,{recursive:true});
const results=[];
for(const [name,type] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chromium'?{channel:'chrome',headless:true}:{headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!=='https://alford-daily.test')return route.abort();
  let pathname=url.pathname;if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))return route.abort();
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'};
  try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=description=>results.push({browser:name,description,pass:true});
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('switchpath:v1:daily:2026-10-30')));
 const fresh=async()=>{await page.evaluate(()=>localStorage.clear());await page.clock.setSystemTime(new Date('2026-10-30T18:00:00Z'));await page.reload();};
 try{
  await page.clock.install({time:new Date('2026-10-30T18:00:00Z')});
  await page.goto('https://alford-daily.test/games/switchpath/');await page.locator('[data-cell]').first().waitFor();
  const fixture=await page.evaluate(async()=>{
    const e=await import('./engine.mjs'),{PUZZLES}=await import('./puzzles.mjs'),daily=e.getDaily(PUZZLES),p=daily.puzzle;
    function dead(state){if(state.status!=='playing')return null;const next=e.legalNextCells(p,state);if(!next.length)return state;for(const c of next){const d=dead(e.selectCell(p,state,c).state);if(d)return d;}return null;}
    return {solution:p.solution,dead:dead(e.createGame(p)).path};
  });
  async function directionState(word,comparison,arrow){
    assert.equal(await page.locator('#direction-label').innerText(),word);
    assert.equal(await page.locator('#direction-detail').innerText(),comparison);
    assert.equal(await page.locator('#direction-icon').innerText(),arrow);
    assert.equal(await page.locator('#direction-panel .rhythm').count(),0);
  }
  const values=await page.locator('[data-cell] .cell-value').allTextContents();
  await directionState('GO HIGHER',`Greater than ${values[fixture.solution[0]]}`,'↑');
  const panels=[];
  for(const [word,comparison,arrow] of [['GO HIGHER',`Greater than ${values[fixture.solution[0]]}`,'↑'],['GO LOWER',`Less than ${values[fixture.solution[1]]}`,'↓']]){
    if(word==='GO LOWER')await page.locator(`[data-cell="${fixture.solution[1]}"]`).click();
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:width===1440?1000:844});
      await directionState(word,comparison,arrow);
      const panel=await page.evaluate(()=>{
        const panel=document.getElementById('direction-panel'),label=document.getElementById('direction-label'),detail=document.getElementById('direction-detail'),icon=document.getElementById('direction-icon');
        const p=panel.getBoundingClientRect(),l=label.getBoundingClientRect(),d=detail.getBoundingClientRect();
        const style=getComputedStyle(label),colors=[style.color,getComputedStyle(panel).backgroundColor];
        const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
        const a=luminance(colors[0]),b=luminance(colors[1]);
        return {width:innerWidth,label:label.textContent,color:colors[0],background:colors[1],fontSize:parseFloat(style.fontSize),arrowSize:parseFloat(getComputedStyle(icon).fontSize),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fits:l.left>=p.left&&l.right<=p.right&&d.right<=p.right&&label.scrollWidth<=label.clientWidth&&detail.scrollWidth<=detail.clientWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth};
      });
      assert.ok(panel.fits&&panel.noOverflow&&panel.fontSize>=20&&panel.arrowSize>=42&&panel.contrast>=4.5,JSON.stringify(panel));panels.push(panel);
      await page.screenshot({path:path.join(out,`${name}-${word==='GO HIGHER'?'higher':'lower'}-${width}.png`),fullPage:true});
    }
  }
  await writeFile(path.join(out,`${name}-direction-measurements.json`),JSON.stringify(panels,null,2)+'\n');
  check('Higher/lower show one bold arrow, 20px+ instruction and readable value at 320/390/1440; contrast exceeds 4.5:1');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#undo-button').click();await directionState('GO HIGHER',`Greater than ${values[fixture.solution[0]]}`,'↑');
  await page.locator('#hint-button').click();await page.locator('[data-hint-confirm]').click();
  await directionState('GO LOWER',`Less than ${values[fixture.solution[1]]}`,'↓');
  await page.reload();await directionState('GO LOWER',`Less than ${values[fixture.solution[1]]}`,'↓');
  check('Prominent direction and comparison track actual moves, Undo, confirmed hint and saved-game reload');
  await fresh();
  for(const c of fixture.dead.slice(1))await page.locator(`[data-cell="${c}"]`).click();
  assert.equal(await page.locator('#direction-kicker').innerText(),'DEAD END');
  const before=await saved();await page.reload();assert.deepEqual(await saved(),before);
  assert.equal(await page.locator('#direction-kicker').innerText(),'DEAD END');
  assert.match(await page.locator('#movement-note').innerText(),/Undo/);
  await page.screenshot({path:path.join(out,`${name}-dead-end.png`),fullPage:true});
  await page.locator('#undo-button').click();assert.notEqual(await page.locator('#direction-kicker').innerText(),'DEAD END');
  assert.equal((await saved()).moves,before.moves+1);check('Actual wrong route reaches a dead end; reload preserves it and Undo recovers with honest cost');
  const preHint=await saved();await page.locator('#hint-button').click();
  assert.match(await page.locator('#dialog-content').innerText(),/1 move and 1 hint/);assert.match(await page.locator('#dialog-content').innerText(),/rewind/);
  await page.locator('[data-action="close"]').click();assert.deepEqual(await saved(),preHint);
  await page.locator('#hint-button').click();await page.locator('[data-hint-confirm]').click();
  assert.equal((await saved()).moves,preHint.moves+1);assert.equal((await saved()).hints,preHint.hints+1);
  check('Hint cancel is inert; confirmation discloses rewind and adds exactly one move and hint');
  await fresh();
  const start=fixture.solution[0],neighbor=start%4<3?start+1:start-1;
  await page.locator(`[data-cell="${start}"]`).focus();await page.keyboard.press(start%4<3?'ArrowRight':'ArrowLeft');
  assert.equal(await page.locator(`[data-cell="${neighbor}"]`).evaluate(n=>document.activeElement===n),true);
  assert.equal((await saved())?.moves||0,0);
  await page.locator(`[data-cell="${fixture.solution[1]}"]`).focus();await page.keyboard.press('Enter');await page.clock.runFor(20);
  await page.keyboard.press('Backspace');assert.equal((await saved()).moves,2);assert.equal((await saved()).path.length,1);
  check('Keyboard focus does not spend a move; Enter and Backspace perform scored actions');
  await fresh();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width===1440?1000:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} overflow`);
    const sizes=await page.locator('[data-cell]').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
    assert.ok(sizes.every(r=>r.w>=44&&r.h>=44),JSON.stringify(sizes));
    const bounds=await page.evaluate(()=>({board:document.getElementById('puzzle').getBoundingClientRect().bottom,controls:document.getElementById('game-controls').getBoundingClientRect().top}));
    assert.ok(bounds.controls-bounds.board<=20,JSON.stringify(bounds));
    if(width===390)assert.ok(bounds.controls<780,JSON.stringify(bounds));
    await page.screenshot({path:path.join(out,`${name}-${width}.png`),fullPage:true});
  }
  check('320–1440 widths have no horizontal overflow; 44px cells and actions immediately below board');
  await page.setViewportSize({width:390,height:844});
  for(const c of fixture.solution.slice(1))await page.locator(`[data-cell="${c}"]`).click();
  await page.clock.runFor(700);assert.equal((await saved()).status,'won');assert.equal((await saved()).moves,15);
  await page.locator('#dialog-close').click();await page.locator('#route-inspection summary').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#route-steps li').count(),16);assert.ok(await page.locator('#route-steps').isVisible());
  assert.equal(await page.locator('[data-cell]:disabled').count(),16);check('Perfect win is immutable and its finished route can be inspected with keyboard');
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();
  await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/Perfect/);
  assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  await page.screenshot({path:path.join(out,`${name}-share-portrait.png`),fullPage:true});
  const ev=page.waitForEvent('download');await page.locator('#download-card').click();const dl=await ev;
  const png=await readFile(await dl.path());assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350);
  await dl.saveAs(path.join(out,`${name}-result-portrait.png`));check('Actual perfect win exports 1080×1350 PNG with played date and score');
  await page.clock.setSystemTime(new Date('2026-10-31T18:00:00Z'));
  await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  const sqev=page.waitForEvent('download');await page.locator('#download-card').click();const sq=await sqev;
  assert.equal((await readFile(await sq.path())).readUInt32BE(20),1080);await sq.saveAs(path.join(out,`${name}-result-square.png`));
  check('Square export is 1080×1080 and midnight cannot relabel an existing result');
  await page.locator('#dialog-close').click();await page.evaluate(()=>{
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new DOMException('Cancelled','AbortError'))});
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Blocked'))}});
  });
  await page.locator('#results-button').click();await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('share-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/2026-10-30/);
  let downloads=0;page.on('download',()=>downloads++);
  await page.locator('#share-card').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('card-status').textContent.includes('cancelled'));
  assert.equal(downloads,0);assert.equal(await page.locator('#share-card').evaluate(n=>document.activeElement===n),true);
  await page.locator('#copy-caption').click();assert.ok(await page.locator('.share-caption').evaluate(n=>n.open));
  assert.equal(await page.locator('#card-caption').evaluate(n=>n.selectionEnd-n.selectionStart),await page.locator('#card-caption').evaluate(n=>n.value.length));
  check('Mocked share cancellation preserves focus without download; blocked clipboard selects caption manually');
  await page.locator('#dialog-close').click();await page.locator('#practice-tab').click();await page.locator('[data-practice]').first().click();
  assert.equal(await page.locator('#route-steps li').count(),0);
  await page.locator('#more-button').click();await page.locator('[data-action="confirm-reveal"]').click();await page.locator('[data-action="reveal"]').click();
  await page.locator('[data-action="share"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  assert.match(await page.locator('#card-caption').inputValue(),/PRACTICE/);assert.match(await page.locator('#card-caption').inputValue(),/Revealed/);
  await page.locator('[data-card-format="square"]').click();await page.waitForFunction(()=>!document.getElementById('download-card').disabled);
  await writeFile(path.join(out,`${name}-revealed-square.png`),Buffer.from(await page.locator('#result-card').evaluate(c=>c.toDataURL().split(',')[1]),'base64'));
  assert.equal((await saved()).status,'won');check('Practice clears old route inspection; revealed export is honest and daily win persists');
  assert.deepEqual(errors,[]);check('No browser page errors');
 }catch(error){results.push({browser:name,pass:false,error:error.stack});}
 await browser.close();
}
await writeFile(path.join(out,'browser-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.pass))process.exitCode=1;
