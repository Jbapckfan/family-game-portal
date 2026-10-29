/** Real-control, source-assisted recipes. Root owns the browser and fixed clock. */
import {dailyIndex} from '../../games/deepseek-runtime/core.mjs';
import assert from 'node:assert/strict';
const names=new Set(['quadra','logic-lattice','syntax-siege','memory-maze','pattern-prism','territory-tactics']);

export async function playGame(page,slug,{checkpoint=async()=>{},date='2026-10-28'}={}) {
 const name=slug.replace(/^qwen-/, '');
 if(!names.has(name))throw new Error(`Unsupported Qwen game: ${slug}`);
 slug=`qwen-${name}`;
 const {PUZZLES}=await import(`../../games/${slug}/puzzles.mjs`),E=await import(`../../games/${slug}/engine.mjs`);
 const p=PUZZLES[dailyIndex(slug,date,PUZZLES.length)];
 await page.locator('#puzzle[data-game-ready="true"]').waitFor();

 if(name==='quadra') {
  for(let i=0;i<p.answers.length;i++){
   await page.locator('#quadra-word').fill(p.answers[i]);
   await page.locator('#quadra-form button[type="submit"]').click();
   if(i===0)await checkpoint();
  }
 }else if(name==='logic-lattice') {
  const given=new Set(p.givens.map(([i])=>i));let checkpointed=false;
  for(let i=0;i<25;i++){
   if(given.has(i))continue;
   // One click marks black; a second marks white. Use actual tap controls.
   await page.locator(`[data-cell="${i}"]`).click();
   if(p.solution[i]===0)await page.locator(`[data-cell="${i}"]`).click();
   if(!checkpointed){checkpointed=true;await checkpoint();}
  }
 }else if(name==='syntax-siege') {
  // Root's paused fake clock makes the timed save/reload deterministic.
  await page.locator('#siege-start').click();
  for(let wave=0;wave<p.waves.length;wave++){
   const w=p.waves[wave],used=new Set();
   for(const letter of w.words[0]){
    const tile=w.rack.findIndex((candidate,i)=>candidate===letter&&!used.has(i));
    if(tile<0)throw new Error(`Unspellable authored wave ${wave+1}`);
    used.add(tile);await page.locator(`[data-letter="${tile}"]`).click();
   }
   await page.locator('#siege-fire').click();
   if(wave===0)await checkpoint();
  }
 }else if(name==='memory-maze') {
  await page.locator('#maze-start').click();
  await page.clock.runFor(6000);
  await page.locator(`[data-cell="${p.path[0]}"]:not([disabled])`).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.cell),String(p.path[0]),'recall hands keyboard focus to the known starting square');
  for(let i=0;i<p.path.length;i++){
   await page.locator(`[data-cell="${p.path[i]}"]`).click();
   if(i===1)await checkpoint();
  }
 }else if(name==='pattern-prism') {
  for(let step=0;step<3;step++){
   await page.locator(`[data-choice="${E.correctIndex(p,step)}"]`).click();
   if(step===0)await checkpoint();
  }
 }else if(name==='territory-tactics') {
  const route=E.winningPaths(p)[0];
  if(!route||route.length<2)throw new Error('This dated restore recipe requires an unfinished first placement.');
  for(let i=0;i<route.length;i++){
   await page.locator(`[data-hex="${route[i]}"]`).click();
   if(i===0)await checkpoint();
  }
 }
 const terminalSelector='#result:not([hidden])';
 await page.locator(terminalSelector).waitFor();
 return {puzzleId:p.id,terminalSelector,terminalText:await page.locator(terminalSelector).innerText(),assistance:'source-assisted'};
}
