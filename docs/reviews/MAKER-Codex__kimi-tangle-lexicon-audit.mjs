// Read-only independent data audit. No project engine/module is imported.
// Usage: node THIS_FILE ROOT_CHECKOUT [--json]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.argv[2];
if(!root)throw Error('Supply the checkout to audit.');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const bankPath='packages/kimi-pebbles/src/games/tangle/data/puzzles.json';
const fullPath='packages/kimi-pebbles/src/games/cairn/data/dict.txt';
const commonPath='packages/kimi-pebbles/src/games/cairn/data/common.txt';
const paths=[bankPath,fullPath,commonPath,'packages/kimi-pebbles/src/games/tangle/engine.ts','packages/kimi-pebbles/src/games/tangle/progress.ts','packages/kimi-pebbles/src/games/shared/daily.ts','docs/six-month-runway.json'];
const inputs=paths.map(relative=>({path:relative,sha256:crypto.createHash('sha256').update(read(relative)).digest('hex'),mtimeMs:fs.statSync(path.join(root,relative)).mtimeMs}));
const bank=JSON.parse(read(bankPath));
const full=new Set(read(fullPath).trim().split(/\s+/));
const common=new Set(read(commonPath).trim().split(/\s+/));
const webLines=fs.readFileSync('/usr/share/dict/web2','utf8').trim().split(/\r?\n/);
const webAny=new Set(webLines.map(w=>w.toLowerCase()));
const webLower=new Set(webLines.filter(w=>w===w.toLowerCase()));
const proper=new Set(fs.readFileSync('/usr/share/dict/propernames','utf8').trim().split(/\r?\n/).map(w=>w.toLowerCase()));
const points=w=>w.length<=4?1:w.length===5?2:w.length===6?3:w.length===7?5:11;
const sum=words=>words.reduce((n,w)=>n+points(w),0);
const gold=p=>Math.min(18,Math.max(8,Math.round(p.max*.2)));
const words=[...new Set(bank.flatMap(p=>p.words))].sort();
const flagged=new Set(['ccm','ccw','cfm','whf']);
const approvedPolicy=new Set(['ccm','ccw','ccws','cfm','whf','mahmoud','wilhelm','nig','wog','coon','fag','fags']);
const noVowel=w=>!/[aeiouy]/.test(w);
const start=Date.parse('2026-10-29T00:00:00Z'),end=Date.parse('2027-04-29T00:00:00Z');
const schedule=[];
for(let time=start;time<end;time+=86400000){
  const day=time/86400000,index=((day%430)+430)%430,p=bank[index],g=gold(p);
  const commonWords=p.words.filter(w=>common.has(w));
  const corroborated=p.words.filter(w=>webLower.has(w)||common.has(w));
  const remainder=p.words.filter(w=>!flagged.has(w));
  schedule.push({
    date:new Date(time).toISOString().slice(0,10),index,puzzleNo:index+1,grid:p.g,
    count:p.words.length,max:p.max,targets:[Math.ceil(g/3),Math.ceil(g*2/3),g],
    flagged:p.words.filter(w=>flagged.has(w)),scoreWithoutFlagged:sum(remainder),
    goldMarginWithoutFlagged:sum(remainder)-g,
    commonWords,commonScore:sum(commonWords),
    lowercaseWebsterOrCommonWords:corroborated,lowercaseWebsterOrCommonScore:sum(corroborated),
    uncorroborated:p.words.filter(w=>!webAny.has(w)&&!common.has(w)),
    capitalizedWebsterOnly:p.words.filter(w=>webAny.has(w)&&!webLower.has(w)),
    noVowelWords:p.words.filter(noVowel),
  });
}
const calendar=JSON.parse(read('docs/six-month-runway.json')).games.find(g=>g.slug==='kimi-tangle').selections;
const calendarMatches=calendar.length===schedule.length&&calendar.every((p,i)=>p.date===schedule[i].date&&p.index===schedule[i].index);
const thresholds=['bronze','silver','gold'];
const shortages=scoreField=>Object.fromEntries(thresholds.map((tier,i)=>[tier,schedule.filter(p=>p[scoreField]<p.targets[i]).map(p=>({date:p.date,puzzleNo:p.puzzleNo,score:p[scoreField],required:p.targets[i]}))]));
const examples=[...new Set([...approvedPolicy,'icica','acinic','acini','minish','wodge','ficin','usine','muhly','hugh','diego'])];
const evidence=examples.map(word=>({
  word,points:points(word),fullDictionary:full.has(word),commonDictionary:common.has(word),
  websterExactEntries:webLines.filter(w=>w.toLowerCase()===word),propernames:proper.has(word),
  bankPuzzleNumbers:bank.flatMap((p,i)=>p.words.includes(word)?[i+1]:[]),
  scheduled:schedule.filter(p=>bank[p.index].words.includes(word)).map(p=>({date:p.date,puzzleNo:p.puzzleNo})),
}));
const summary={
  bankBoards:bank.length,bankWordOccurrences:bank.flatMap(p=>p.words).length,distinctBankWords:words.length,
  allWordsInSuppliedFullDictionary:words.every(w=>full.has(w)),commonVocabulary:common.size,
  absentFromSuppliedFullDictionary:words.filter(w=>!full.has(w)),
  malformedEntries:words.filter(w=>!/^[a-z]{3,16}$/.test(w)),pointsMetadataMismatches:bank.flatMap((p,i)=>sum(p.words)!==p.max?[i+1]:[]),
  scheduledBoards:schedule.length,calendarMatches,
  scheduledRange:[schedule[0].puzzleNo,schedule.at(-1).puzzleNo],
  flaggedWords:[...flagged],flaggedBankOccurrences:bank.reduce((n,p)=>n+p.words.filter(w=>flagged.has(w)).length,0),
  flaggedScheduledOccurrences:schedule.reduce((n,p)=>n+p.flagged.length,0),
  flaggedScheduledBoards:schedule.filter(p=>p.flagged.length).length,
  minimumGoldMarginWithoutFlagged:Math.min(...schedule.map(p=>p.goldMarginWithoutFlagged)),
  goldDependsOnFlagged:schedule.filter(p=>p.goldMarginWithoutFlagged<0),
  commonOnlyShortages:shortages('commonScore'),localCorroborationShortages:shortages('lowercaseWebsterOrCommonScore'),
  noVowelDistinctBankWords:words.filter(noVowel),
  locallyUncorroboratedDistinctBankWords:words.filter(w=>!webAny.has(w)&&!common.has(w)).length,
};
const policyBoards=bank.map((p,index)=>{
  const removed=p.words.filter(w=>approvedPolicy.has(w));
  const kept=p.words.filter(w=>!approvedPolicy.has(w));
  const max=sum(kept),g=gold({max});
  return {puzzleNo:index+1,removed,removedPoints:sum(removed),keptWords:kept.length,max,targets:[Math.ceil(g/3),Math.ceil(g*2/3),g],bestNeedsReplacement:removed.includes(p.best)};
});
const policySchedule=schedule.map(p=>{
  const r=p.date<'2026-10-30'?{...policyBoards[p.index],removed:[],removedPoints:0,max:p.max,targets:p.targets}:policyBoards[p.index];
  return {date:p.date,...r,goldMargin:r.max-r.targets[2]};
});
const approvedPolicyEvidence={
  terms:[...approvedPolicy],
  affectedBankBoards:policyBoards.filter(p=>p.removed.length).length,
  removedBankOccurrences:policyBoards.reduce((n,p)=>n+p.removed.length,0),
  removedBankPoints:policyBoards.reduce((n,p)=>n+p.removedPoints,0),
  bestReplacements:policyBoards.filter(p=>p.bestNeedsReplacement).map(p=>p.puzzleNo),
  affectedScheduledBoards:policySchedule.filter(p=>p.removed.length).length,
  removedScheduledOccurrences:policySchedule.reduce((n,p)=>n+p.removed.length,0),
  minimumGoldMargin:Math.min(...policySchedule.map(p=>p.goldMargin)),
  calendarChanges:policySchedule.filter(p=>p.removed.length),
};
const changedInputs=inputs.filter(before=>fs.statSync(path.join(root,before.path)).mtimeMs!==before.mtimeMs).map(p=>p.path);
const result={scope:'Independent data-only audit; project engines were read, not imported or executed.',inputs,changedInputs,summary,approvedPolicyEvidence,evidence,schedule};
console.log(JSON.stringify(process.argv.includes('--json')?result:{...result,schedule:undefined},null,2));
