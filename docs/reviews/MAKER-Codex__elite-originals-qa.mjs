import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'../..');
export async function playGame(page,slug,{checkpoint}){
 const E=await import(pathToFileURL(path.join(root,'games',slug,'engine.mjs')).href);
 if(slug==='nested-tic-tac-toe'){
  const read=async()=>{const raw=await page.evaluate(()=>localStorage.getItem('alford:tic-tac-toe:v1:match'));return raw?E.restoreMatch(JSON.parse(raw)).state:E.createGame();};
  await page.locator('[data-skill="casual"]').click();let state=await read(),checked=false;
  while(state.status==='playing'){
   if(state.turn==='X'){const move=E.legalMoves(state)[0];await page.locator('.mini-board').nth(move.board).click();await page.locator(`[data-cell="${move.cell}"]`).click();if(!checked){checked=true;await checkpoint();}}
   await page.clock.runFor(350);state=await read();
  }
  return{puzzleId:'local-ai-match',terminalSelector:'#turn-title',terminalText:state.status==='X'?'You win':state.status==='O'?'AI wins':'draw',assistance:'source-assisted legal moves',moves:state.history.length};
 }
 const {PUZZLES}=await import(pathToFileURL(path.join(root,'games',slug,'puzzles.mjs')).href),{puzzle}=E.getDaily(PUZZLES,new Date('2026-10-28T18:00:00Z'));
 if(slug==='ringcount'){for(const [i,gap] of puzzle.solution.entries()){await page.locator(`[data-gap="${gap}"]`).click();if(i===0)await checkpoint();}await page.locator('#ring-check').click();}
 if(slug==='switchpath'){for(const [i,cell] of puzzle.solution.slice(1).entries()){await page.locator(`[data-cell="${cell}"]`).click();if(i===4)await checkpoint();}}
 if(slug==='counterpart'){for(const [i,row] of puzzle.rows.entries()){await page.locator(`[data-row="${i}"]`).first().click();for(const id of row.answer)await page.locator(`[data-tile="${id}"]`).click();await page.locator('[data-check]').click();if(i===0)await checkpoint();}}
 if(slug==='shortlist'){for(const letter of 'AE')await page.locator(`[data-letter="${letter}"]`).click();await page.locator('#scan-button').click();await checkpoint();await page.locator(`[data-pick="${puzzle.answer}"]`).click();await page.locator(`[data-final-pick="${puzzle.answer}"]`).click();}
 if(slug==='second-sense'){for(const [i,pair] of puzzle.pairs.entries()){await page.locator(`[data-noun="${pair.nounId}"]`).click();await page.locator(`[data-verb="${pair.verbId}"]`).click();await page.locator('#answer-input').fill(pair.word);await page.locator('#sense-check').click();if(i===0)await checkpoint();}}
 if(slug==='sideways'){
  let state=E.createGame(puzzle),checked=false;
  while(E.findHint(puzzle,state)){const hint=E.findHint(puzzle,state);await page.locator(`[data-rotate="${hint.row}"][data-direction="1"]`).click();state=E.rotateRow(puzzle,state,hint.row,1);if(!checked){checked=true;await checkpoint();}}
  await page.locator('#shift-check').click();
 }
 if(slug==='tradeoff'){
  let state=E.createGame(puzzle),checked=false;
  while(state.status==='playing'){const hint=E.findHint(puzzle,state);for(const cell of [hint.a,hint.b])await page.locator(`[data-row="${cell.row}"][data-col="${cell.col}"]`).click();state=E.swapLetters(puzzle,state,hint.a,hint.b).state;if(!checked){checked=true;await checkpoint();}}
 }
 if(slug==='inbetween'){let state=E.createGame(puzzle),checked=false;while(state.status==='playing'){const move=E.findHint(puzzle,state);await page.locator(`[data-tile="${move.tileId}"]`).click();await page.locator(`[data-row="${move.row}"][data-gap="${move.gap}"]`).click();await page.locator(`[data-fit="${move.row}"]`).click();state=E.submitPlacement(puzzle,state,move).state;if(!checked){checked=true;await checkpoint();}}}
 const key=`${slug}:v1:daily:2026-10-28`;
 const state=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);if(state.status!=='won')throw Error(`${slug} did not win through its real controls`);
 return{puzzleId:puzzle.id,terminalSelector:slug==='tradeoff'||slug==='inbetween'||slug==='counterpart'||slug==='switchpath'?'#progress-label':slug==='second-sense'?'#sense-progress':slug==='shortlist'?'#candidate-count':'#finished-actions',terminalText:slug==='switchpath'?'16 of 16':slug==='counterpart'||slug==='second-sense'?'5 of 5':slug==='tradeoff'||slug==='inbetween'?'6 of 6':slug==='shortlist'?puzzle.answer:'result',assistance:'source-assisted actual controls'};
}
