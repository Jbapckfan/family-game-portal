import test from 'node:test'
import assert from 'node:assert/strict'
import {dailyTangle,practiceTangle} from '../src/games/tangle/engine.ts'
import {restoreTangleProgress} from '../src/games/tangle/progress.ts'
import {TANGLE_FIVE_PREVIEW,restoreFivePreview} from '../src/games/tangle/five-preview.ts'

const save=(found:string[]=[])=>({found,score:999,misses:2,hintsUsed:0,countedPlayed:true})

test('new current and future Daily and new Practice Tangle rounds are tagged vocabulary3',()=>{
 for(const day of [20758,20759,20939])assert.equal(dailyTangle(day).vocabulary,3)
 assert.equal(practiceTangle().vocabulary,3)
 assert.equal(dailyTangle(20757).vocabulary,undefined,'published v2 dates do not become v3')
})

test('unknown or malformed vocabulary markers cannot be restored as a known dictionary edition',()=>{
 const p=dailyTangle(20758).puzzle
 for(const vocabulary of [0,4,99,'3',null,{},[]])assert.equal(restoreTangleProgress({...save(),vocabulary},p),null)
 for(const vocabulary of [1,2,3])assert.equal(restoreTangleProgress({...save(),vocabulary},p)?.vocabulary,vocabulary)
 assert.equal(Object.hasOwn(restoreTangleProgress(save(),p)!,'vocabulary'),false)
})

test('preview session saves reject unknown markers and retain a known marker after validation',()=>{
 const base={...save(['stone']),grid:TANGLE_FIVE_PREVIEW.g}
 assert.equal(restoreFivePreview({...base,vocabulary:99}),null)
 assert.equal(restoreFivePreview({...base,vocabulary:3})?.vocabulary,3)
})


test('actual Tangle hooks preserve prior snapshots and unknown-version saves while new rounds accept v3 words',async()=>{
 const {spawnSync}=await import('node:child_process'),{fileURLToPath}=await import('node:url');
 const env={...process.env,TSX_TSCONFIG_PATH:fileURLToPath(new URL('../tsconfig.app.json',import.meta.url))};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,['--import','tsx','tests/helpers/MAKER-Codex__tangle-v3-dom.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env,encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/PASS Kimi Tangle v3 real-hook/);
})

test('frozen published v2 files retain exact released bytes and older save snapshots across all grids',async t=>{
 const {readFileSync}=await import('node:fs'),{createHash}=await import('node:crypto');
 const {expandTanglePuzzle}=await import('../src/games/tangle/lexicon.ts');
 const {medalTargets}=await import('../src/games/tangle/progress.ts'),{reviewTanglePuzzle}=await import('../src/games/tangle/reviewed-words.ts');
 const sha=(name:string)=>createHash('sha256').update(readFileSync(new URL('../src/games/tangle/data/'+name,import.meta.url))).digest('hex');
 assert.equal(sha('lexicon-expansions-v2.json'),'5aefff209f5b14e11b781c5e5b123a2d16a797e707a3165ac3d1a212b95a8e2b');
 assert.equal(sha('five-preview-v2.json'),'48ba85ef81a7439ddab6c4a9743a08289a19c003792e761455251eb8ba34b498');
 const bank=JSON.parse(readFileSync(new URL('../src/games/tangle/data/puzzles.json',import.meta.url),'utf8'));
 let actualDifferenceDays=0;
 for(let day=20758;day<20758+430;day++){
  const current=dailyTangle(day),raw=bank[current.puzzleNo-1],base=reviewTanglePuzzle({...raw,targets:medalTargets(raw.max)}),frozen=expandTanglePuzzle(base,2);
  const prior={...save(frozen.words.slice(0,3)),hintsUsed:1,hintPrefix:frozen.words.find(w=>w.length>=4)?.slice(0,2)};
  const markerless=dailyTangle(day,prior),marked=dailyTangle(day,{...prior,vocabulary:2});
  assert.deepEqual(markerless.puzzle,frozen);assert.deepEqual(marked.puzzle,frozen);assert.equal(marked.vocabulary,2);assert.equal(markerless.vocabulary,undefined);
  const restored=restoreTangleProgress(prior,markerless.puzzle)!;
  assert.equal(restored.score,prior.found.reduce((n,w)=>n+(w.length<=4?1:w.length===5?2:w.length===6?3:w.length===7?5:11),0));
  assert.equal(restored.misses,2);assert.equal(restored.hintsUsed,1);assert.equal(restored.goldReached,restored.score>=frozen.targets[2]);
  assert.deepEqual(current.puzzle.targets,frozen.targets);assert.equal(current.vocabulary,3);
  const additional=current.puzzle.words.find(w=>!frozen.words.includes(w));
  if(additional){actualDifferenceDays++;assert.equal(restoreTangleProgress({...save([additional]),vocabulary:3},current.puzzle)?.found[0],additional);assert.equal(restoreTangleProgress(save([additional]),markerless.puzzle),null);}
 }
 if(process.env.TANGLE_REQUIRE_V3_DATA==='1')assert.ok(actualDifferenceDays>0,'root must regenerate current v3 data before release');
 t.diagnostic(`${actualDifferenceDays} selected days currently differ from frozen v2; root generation must make this positive before release.`);
})

test('preview edition selection keeps maximum, count and share/medal snapshot coherent',async()=>{
 const {fivePreviewRound,TANGLE_FIVE_PREVIEW_V2}=await import('../src/games/tangle/five-preview.ts'),{buildTangleShareResult}=await import('../src/games/tangle/share-card.ts');
 const raw={grid:TANGLE_FIVE_PREVIEW_V2.g,...save(['stone','cores','pore']),hintsUsed:1,hintPrefix:'st',countedPlayed:false};
 for(const version of [undefined,2]){
  const value=version===undefined?raw:{...raw,vocabulary:version},round=fivePreviewRound(value),p=round.puzzle,s=round.progress!;
  assert.equal(p.max,4384);assert.equal(p.n,1671);assert.deepEqual(p.words,TANGLE_FIVE_PREVIEW_V2.words);assert.deepEqual(p.targets,[10,20,30]);assert.equal(s.score,5);assert.equal(s.goldReached,false);assert.equal(round.vocabulary,version);
  const snapshot=buildTangleShareResult({mode:'practice',boardSize:5,puzzleNo:1,dayNumber:0,score:s.score,maxScore:p.max,wordCount:s.found.length,totalWords:p.n,targets:p.targets,misses:s.misses,hintsUsed:s.hintsUsed});
  assert.equal(snapshot.maxScore,4384);assert.equal(snapshot.totalWords,1671);assert.equal(snapshot.goldTarget,30);assert.equal(snapshot.wordCount,3);assert.equal(snapshot.score,5);assert.equal(snapshot.assisted,true);assert.equal(snapshot.medal,'No medal yet');
 }
 assert.equal(fivePreviewRound().vocabulary,3);assert.deepEqual(fivePreviewRound().puzzle,TANGLE_FIVE_PREVIEW);
 assert.equal(fivePreviewRound({...raw,vocabulary:3}).vocabulary,3);
 assert.equal(fivePreviewRound({...raw,vocabulary:99}).unsupported,true);
})
