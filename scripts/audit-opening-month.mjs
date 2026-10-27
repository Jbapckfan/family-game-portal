/** Reproducible content evidence, not legal clearance or a human difficulty trial. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {featuredGames} from '../games/daily/catalog.mjs';
const start='2026-10-20',days=Array.from({length:30},(_,i)=>new Date(Date.parse(start+'T18:00:00Z')+i*86400000).toISOString().slice(0,10));
const runway=JSON.parse(await readFile(new URL('../docs/daily-runway.json',import.meta.url),'utf8'));
assert.equal(runway.start,start);assert.equal(runway.totalDailySelections,960);assert.equal(runway.allSelectorsExecuted,true);
const games=[],analogyRows=new Map(),shortlists=[];
for(const game of featuredGames()){
 const engine=await import(`../games/${game.slug}/engine.mjs`),{PUZZLES}=await import(`../games/${game.slug}/puzzles.mjs`);
 const selections=days.map(date=>{
  const daily=engine.getDaily(PUZZLES,new Date(date+'T18:00:00Z')),p=daily.puzzle;
  assert.equal(daily.dateKey,date);
  const selection={date,id:p.id,difficulty:p.difficulty};
  if(game.slug==='counterpart'){
   selection.sourceIds=p.rows.map(r=>r.sourceId);
   for(const r of p.rows)analogyRows.set(r.sourceId,{id:r.sourceId,cue:r.cue,answer:r.answer.map(id=>p.tiles.find(t=>t.id===id).word),relationship:r.relationship,explanation:r.explanation});
   selection.fingerprint=[...selection.sourceIds].sort().join('|');
  }else if(game.slug==='shortlist'){
   shortlists.push({date,id:p.id,words:p.words,answer:p.answer});selection.fingerprint=[...p.words].sort().join('|');
   assert.ok(p.words.includes(p.answer));assert.equal(new Set(p.words).size,12);
  }else{
   selection.fingerprint=JSON.stringify(game.slug==='ringcount'?p.numbers:{values:p.values,start:p.start,end:p.end});
  }
  return selection;
 });
 games.push({slug:game.slug,selectedBoards:selections.length,distinctPuzzleIDs:new Set(selections.map(s=>s.id)).size,distinctContentSets:new Set(selections.map(s=>s.fingerprint)).size,selections});
}
const report={start,end:days.at(-1),allGameSelections:960,featuredSelections:120,games,wordReview:{counterpartRowAppearances:150,uniqueAnalogies:analogyRows.size,shortlistAnswerCount:new Set(shortlists.map(p=>p.answer)).size,analogies:[...analogyRows.values()],shortlists},limits:['Selector/content checks do not measure human difficulty or establish distribution rights.','Counterpart analogies and Shortlist vocabulary recur across the month; distinct puzzle IDs do not imply wholly new editorial content.']};
await mkdir(new URL('../output/launch-quality/',import.meta.url),{recursive:true});
await writeFile(new URL('../docs/opening-month-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('../output/launch-quality/word-editorial.txt',import.meta.url),[...analogyRows.values()].map(r=>`${r.id}: ${r.cue.join(' → ')} / ${r.answer.join(' → ')}; ${r.relationship}. ${r.explanation}`).join('\n')+'\n\n'+shortlists.map(p=>`${p.date} ${p.id}: ${p.words.join(', ')}; answer ${p.answer}`).join('\n')+'\n');
console.log(JSON.stringify({start:report.start,end:report.end,allGameSelections:960,featuredSelections:120,games:games.map(({slug,distinctPuzzleIDs,distinctContentSets})=>({slug,distinctPuzzleIDs,distinctContentSets})),uniqueAnalogies:analogyRows.size,shortlistAnswerCount:report.wordReview.shortlistAnswerCount},null,2));
