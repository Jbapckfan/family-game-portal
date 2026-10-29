import assert from 'node:assert/strict';
import {dailyIndex} from '../../games/deepseek-runtime/core.mjs';

export const QA_DATE='2026-10-28';
export const GAME_IDS=['deepseek-twin-hive','deepseek-rung','deepseek-spare','deepseek-cipher','deepseek-trail','deepseek-split','claude-dovetail','claude-splice','claude-sprout','claude-tangle','claude-keystone','claude-tumbler'];
const text=(selector,value,submit)=>({selector,value,submit}),clicks=(...clicks)=>({clicks});

async function recipe(slug,date=QA_DATE){
 assert.ok(GAME_IDS.includes(slug),`Owned game: ${slug}`);
 const {PUZZLES}=await import(`../../games/${slug}/puzzles.mjs`),E=await import(`../../games/${slug}/engine.mjs`);
 const p=PUZZLES[dailyIndex(slug,date,PUZZLES.length)];let actions;
 switch(slug){
  case 'deepseek-twin-hive':actions=E.acceptedWords(p).slice(0,p.target).map(w=>text('#hive-word',w,'#hive-form'));break;
  case 'deepseek-rung':actions=E.findRoute(p.start,p.target).slice(1).map(w=>text('#rung-word',w,'#rung-form'));break;
  case 'deepseek-spare':actions=p.pairs.map((_,i)=>clicks(`[data-word="${2*i}"]`,`[data-word="${2*i+1}"]`,'#spare-submit'));break;
  case 'deepseek-cipher':actions=E.cipherLetters(p).filter(c=>!p.givens.includes(c)).map(c=>clicks(`[data-code="${c}"]`,`[data-letter="${E.solution(p)[c]}"]`));break;
  case 'deepseek-trail':actions=[...p.path.map(i=>clicks(`[data-index="${i}"]`)),clicks('[data-action="check"]')];break;
  case 'deepseek-split':actions=[...p.words.join('').split('').map(key=>({key})),clicks('[data-action="check"]')];break;
  case 'claude-dovetail':actions=p.words.slice(1,-1).map(w=>text('#dovetail-entry',w,'#dovetail-form'));break;
  case 'claude-splice':actions=p.parts.map((_,i)=>clicks(`[data-tile="${2*i}"]`,`[data-tile="${2*i+1}"]`,'#splice-go'));break;
  case 'claude-sprout':actions=E.findRoute(p).slice(1).map(w=>text('#sprout-entry',w,'#sprout-form'));break;
  case 'claude-tangle':actions=p.w.map((_,j)=>clicks(...p.o.flatMap((owner,i)=>owner===j?[`[data-bead="${i}"]`]:[]),'#tangle-pull'));break;
  case 'claude-keystone':actions=p.rounds.flatMap((r,i)=>[text('#keystone-input',r.k,'#keystone-form'),...(i<p.rounds.length-1?[clicks('#keystone-next')]:[])]);break;
  case 'claude-tumbler':actions=[text('#tumbler-input',p.answer.slice(0,2)),text('#tumbler-input',p.answer,'#tumbler-form')];break;
 }
 return {p,actions};
}

async function perform(page,action){
 if(action.clicks)for(const selector of action.clicks)await page.locator(selector).first().click();
 else if(action.key){await page.locator('#puzzle').focus();await page.locator('#puzzle').press(action.key);}
 else{await page.locator(action.selector).fill(action.value);if(action.submit)await page.locator(`${action.submit} button[type="submit"]`).click();}
}

/** Root supplies a fresh daily origin with Date frozen at 2026-10-28T18:00Z.
 * Each move uses the public UI; checkpoint reloads after an unfinished move.
 */
export async function playGame(page,slug,{checkpoint=async()=>{},date=QA_DATE}={}){
 const {p,actions}=await recipe(slug,date);
 await page.locator('#puzzle[data-game-ready="true"]').waitFor();
 for(let i=0;i<actions.length;i++){
  await perform(page,actions[i]);
  if(i===0){assert.equal(await page.locator('#result').isVisible(),false,'first move is unfinished');await checkpoint();}
 }
 await page.locator('#result').waitFor({state:'visible'});
 const terminalText=await page.locator('#result-heading').textContent();assert.equal(terminalText,'That’s the one.');
 return {puzzleId:p.id,terminalSelector:'#result',terminalText,assistance:'source-assisted'};
}

/** Separate longest-word phone check. Call on a fresh Cipher daily page.
 * It reaches the prepared record through Next practice, without saved-state injection.
 * evaluate only reads geometry; it never makes a move.
 */
export async function checkLongCipherWord(page,{date=QA_DATE}={}){
 const slug='deepseek-cipher',{PUZZLES}=await import('../../games/deepseek-cipher/puzzles.mjs');
 const longest=PUZZLES.flatMap((p,index)=>p.encoded.split(' ').map(word=>({p,index,word}))).sort((a,b)=>b.word.length-a.word.length)[0];
 const {practiceCandidates}=await import('../../games/deepseek-runtime/practice-calendar.mjs');
 // Move beyond the protected window to exercise the longest authored word.
 await page.clock.setFixedTime(new Date('2027-04-29T18:00:00Z'));
 await page.reload();
 const available=practiceCandidates(slug,'2027-04-29',PUZZLES.length,{excludeIndices:[dailyIndex(slug,'2027-04-29',PUZZLES.length)]});
 const steps=available.indexOf(longest.index)+1;assert.ok(steps>0,'longest-word fixture remains available');
 await page.setViewportSize({width:320,height:844});
 for(let i=0;i<steps;i++)await page.locator('#practice-mode').click();
 assert.equal(await page.locator('.cipher-panel > .clue').textContent(),longest.p.clue);
 const geometry=await page.locator('.cipher-phrase').evaluate(el=>({
  client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
  groups:[...el.querySelectorAll('.cipher-word')].map(word=>{const r=word.getBoundingClientRect();return {left:r.left,right:r.right,count:word.querySelectorAll('.cipher-cell').length};}),
  tiles:[...el.querySelectorAll('.cipher-cell')].map(tile=>{const r=tile.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};})
 }));
 assert.ok(geometry.groups.some(g=>g.count===longest.word.length));assert.ok(geometry.scroll<=geometry.client,'no document overflow at 320px');
 assert.ok(geometry.groups.every(g=>g.left>=0&&g.right<=320),'word groups remain in the viewport');
 assert.ok(geometry.tiles.every(t=>t.left>=0&&t.right<=320&&t.width>=44&&t.height>=44),'all cipher tiles fit and retain a 44px touch target');
 return {puzzleId:longest.p.id,longestWordLength:longest.word.length,assistance:'source-assisted',geometry};
}
