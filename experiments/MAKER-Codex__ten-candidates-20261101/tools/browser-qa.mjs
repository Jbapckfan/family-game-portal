import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),bank=JSON.parse(fs.readFileSync(path.join(base,'bank.json'))),url=pathToFileURL(path.join(base,'index.html')).href;
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];let download;
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.evaluate(()=>localStorage.clear());await page.reload();
  assert.equal(await page.locator('[data-open]').count(),10,JSON.stringify(errors));
  if(viewport.width===1440)await page.screenshot({path:path.join(base,'evidence/MAKER-Codex__gallery-desktop.png'),fullPage:true});
  if(viewport.width===390)await page.screenshot({path:path.join(base,'evidence/MAKER-Codex__gallery-phone.png'),fullPage:true});
  for(let kind=1;kind<=10;kind++){
   await page.locator(`[data-open="${kind}"]`).click();await page.locator('#date').fill(bank.dates[0]);await page.locator('#date').dispatchEvent('change');
   const p=bank.games[kind][0];
   const snapshot=()=>page.evaluate(()=>window.candidateLab.snapshot());
   const assertNoOverflow=async()=>{const dims=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert(dims.scroll<=dims.width,`overflow ${kind}/${viewport.width}: ${JSON.stringify(dims)}`);};
   await assertNoOverflow();
   if(kind===1){for(const d of p.solution)await page.locator(`[data-action="dir${d}"]`).click();}
   if(kind===2){for(let i=0;i<5;i++)for(let j=0;j<p.solution[i];j++)await page.locator(`[data-action="shift${i}:1"]`).click();}
   if(kind===3){for(const[a,b]of p.solution){await page.locator(`[data-node="${a}"]`).click();await page.locator(`[data-node="${b}"]`).click();}}
   if(kind===4){for(const op of p.solution)await page.locator(`[data-op="${op}"]`).click();}
   if(kind===5){for(const o of p.solution){await page.locator(`[data-piece="${o.piece}"]`).click();for(let i=0;i<o.orientation;i++)await page.locator('[data-action="orient1"]').click();await page.locator(`[data-cell="${o.anchor}"]`).click();}}
   if(kind===6){for(let i=0;i<6;i++){const snap=await snapshot(),j=snap.state.data.indexOf(p.solution[i]);if(j!==i){await page.locator(`[data-artifact="${i}"]`).click();await page.locator(`[data-artifact="${j}"]`).click();}}await page.locator('[data-action="check-order"]').click();}
   if(kind===7){for(const cell of p.solution)await page.locator(`[data-cell="${cell}"]`).click();}
   if(kind===8){for(const shot of p.solution){await page.locator('#angle').fill(String(shot.angle));await page.locator('#angle').dispatchEvent('change');await page.locator('#power').fill(String(shot.power));await page.locator('#power').dispatchEvent('change');await page.locator('[data-action="launch"]').click();}}
   if(kind===9){for(let turn=0;turn<10;turn+=2)await page.locator(`[data-draft="${p.solution[turn]}"]`).click();}
   if(kind===10){for(let i=0;i<6;i++){await page.locator(`[data-command="${p.solution[i]}"]`).click();await page.locator(`[data-slot="${i}"]`).click();}await page.locator('[data-action="run"]').click();}
   const solved=await snapshot();assert.equal(solved.state.status,'won',`did not solve ${kind}/${viewport.width}`);if(kind===10){await page.locator('#run-step').fill('0');await page.locator('#run-step').dispatchEvent('change');assert.equal(await page.locator('.run-review strong').innerText(),'Start');await page.locator('#run-step').fill(String(solved.state.lastRun.steps.length));await page.locator('#run-step').dispatchEvent('change');assert.deepEqual((await snapshot()).state,solved.state);};assert.equal(solved.state.assisted,false);await assertNoOverflow();
   await page.screenshot({path:path.join(base,`evidence/MAKER-Codex__candidate-${String(kind).padStart(2,'0')}-${viewport.width===390?'phone':'desktop'}.png`),fullPage:true});
   await page.reload();await page.locator(`[data-open="${kind}"]`).click();const reloaded=await snapshot();assert.deepEqual(reloaded.state,solved.state,`reload ${kind}`);
   await page.locator('[data-action="undo"]').click();const undone=await snapshot();assert.equal(undone.state.status,'playing');assert.equal(undone.state.undos,1);assert.equal(undone.state.moves,solved.state.moves);
   await page.locator('[data-action="share"]').first().click();const text=await page.locator('#share-text').inputValue();assert(text.includes('In progress'));assert(text.includes('1 undo'));assert(!text.includes('SPOILER'));assert(!text.includes('solution'));assert.equal(await page.locator('#share-dialog').isVisible(),true);
   await page.locator('[data-action="close-share"]').click();
   await page.locator('summary').click();await page.locator('[data-action="solution"]').click();const assisted=await snapshot();assert.equal(assisted.state.status,'won');assert.equal(assisted.state.assisted,true);
   await page.locator('[data-action="share"]').first().click();const assistedText=await page.locator('#share-text').inputValue();assert(assistedText.includes('Assisted finish'));
   if(kind===1&&viewport.width===1440){const event=page.waitForEvent('download');await page.locator('[data-action="image"]').click();download=await event;await download.saveAs(path.join(base,'evidence/MAKER-Codex__share-result.png'));}
   await page.locator('[data-action="close-share"]').click();
   await page.locator('[data-action="replay"]').first().click();const practice=await snapshot();assert.equal(practice.practice,true);assert.equal(practice.index,1);assert.equal(practice.state.status,'playing');assert.equal(practice.state.assisted,false);
   await page.locator('[data-action="home"]').first().click();
   results.push({kind,viewport,completedThroughControls:true,solverAssisted:true,wonReload:true,undo:true,spoilerFreeShare:true,assistedShare:true,separatePractice:true,noHorizontalOverflow:true,moves:solved.state.moves});
   console.log(JSON.stringify(results.at(-1)));
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(path.join(base,'evidence/MAKER-Codex__browser-qa.json'),JSON.stringify({browser:'Chrome headless',transport:'file://; no server or visible tabs',cases:results.length,results,pngExport:!!download,limitations:['Automated source-assisted completion; not blind human play.','No physical phone or screen-reader certification.','Native share sheet external send was not invoked.']},null,2)+'\n');
}finally{await browser.close();}
