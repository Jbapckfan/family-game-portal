/** Scheduling/solver/source audit, not human editorial or content-rights approval. */
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {writeFile} from 'node:fs/promises';
const dates=Array.from({length:30},(_,i)=>new Date(Date.parse('2026-10-28T18:00:00Z')+i*86400000).toISOString().slice(0,10)),games=[];
for(const slug of ['counterpart','shortlist','second-sense','sideways']){
 const engine=await import(`../games/${slug}/engine.mjs`),{PUZZLES}=await import(`../games/${slug}/puzzles.mjs`),rows=[],vocabulary=[];
 for(const date of dates){
  const {puzzle}=engine.getDaily(PUZZLES,new Date(date+'T18:00:00Z'));let state=engine.createGame(puzzle),solver={};
  if(slug==='counterpart'){
   for(const [row,pair] of puzzle.rows.entries()){assert.ok(pair.relationship&&pair.explanation);state=engine.submitPair(puzzle,state,{row,tileIds:pair.answer}).state;vocabulary.push(pair.sourceId||pair.cue.join('→'));}
  }else if(slug==='second-sense'){
   for(const pair of puzzle.pairs){assert.ok(pair.explanation);state=engine.submitPair(puzzle,state,{nounId:pair.nounId,verbId:pair.verbId,word:pair.word}).state;vocabulary.push(pair.word);}
  }else if(slug==='shortlist'){
   const tree=engine.solveDecisionTree(puzzle.words,3);assert.ok(tree,'three-scan starting strategy');let node=tree;
   while(node.letters){const scan=engine.submitScan(puzzle,state,node.letters);assert.ok(scan.changed);state=scan.state;node=node.branches[scan.scan.count];}
   assert.equal(node.word,puzzle.answer);state=engine.submitPick(puzzle,state,node.word).state;solver={worstCaseScans:tree.worstCase,expectedScans:tree.expectedScans};vocabulary.push(...puzzle.words);
  }else{
   const solutions=new Map();
   for(let bits=0;bits<1024;bits++){const rotations=Array.from({length:5},(_,i)=>(bits>>(2*i))&3),columns=engine.getColumns(puzzle,{rotations});if(columns.every((word,i)=>word===puzzle.columns[i].answer))solutions.set(engine.getRows(puzzle,{rotations}).join('|'),rotations);}
   assert.equal(solutions.size,1,'one distinct strip arrangement');for(const [row,steps] of [...solutions.values()][0].entries())for(let i=0;i<steps;i++)state=engine.rotateRow(puzzle,state,row,1);state=engine.checkBoard(puzzle,state).state;solver={distinctSolutions:1};vocabulary.push(...puzzle.columns.map(column=>column.answer));
  }
  assert.equal(state.status,'won');assert.deepEqual(engine.restoreGame(puzzle,state),state,'solved state reloads');
  rows.push({date,puzzleId:puzzle.id,contentFingerprint:createHash('sha256').update(JSON.stringify(puzzle)).digest('hex').slice(0,16),...solver});
 }
 assert.equal(new Set(rows.map(row=>row.puzzleId)).size,30);games.push({slug,days:30,distinctPuzzleIds:30,vocabularyAppearances:vocabulary.length,distinctVocabularyItems:new Set(vocabulary).size,selections:rows});
}
const result={start:dates[0],end:dates.at(-1),games,checks:'Actual selectors; authored/solver solutions win and restore. Existing full-bank unit validators are additional evidence.',limits:['Finite word/analogy pools repeat within different boards.','This is source-assisted machine verification, not human fairness/difficulty/fun review.','SCAB → WOUND / CALLUS → FRICTION remains flagged for independent editorial review.','Dictionary/content ownership remains unresolved where recorded; no rights clearance inferred.']};
await writeFile(new URL('../docs/word-edition-runway.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(games.map(({slug,days,distinctPuzzleIds,vocabularyAppearances,distinctVocabularyItems})=>({slug,days,distinctPuzzleIds,vocabularyAppearances,distinctVocabularyItems})),null,2));
