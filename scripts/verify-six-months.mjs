#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {calendarDates, loadDailyAudit} from './daily-audit-lib.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const dates = calendarDates('2026-10-29','2027-04-29');
const baseline = JSON.parse(await readFile(new URL('../docs/six-month-previous-calendar.json',import.meta.url),'utf8'));
const priorDates = calendarDates(baseline.start,'2026-10-30');
const {games,cleanup} = await loadDailyAudit();
try {
  const rows = [], failures = [];
  for (const game of games) {
    const keys = game.puzzles.map(game.key), distinctBank = new Set(keys).size;
    const selections = dates.map(date => {const {puzzle,puzzleId,index}=game.select(date); return {date,puzzleId,index,challengeSHA256:hash(game.key(puzzle))};});
    const distinctDaily = new Set(selections.map(p=>p.challengeSHA256)).size;
    const openingKeys=new Set(calendarDates('2026-10-20','2026-10-29').map(date=>hash(game.key(game.select(date).puzzle))));
    const openingWeekReplays=selections.filter(selection=>openingKeys.has(selection.challengeSHA256)).map(selection=>selection.date);
    const previous = baseline.games.find(old=>old.slug === game.slug);
    assert.ok(previous,`${game.slug}: missing historical baseline`);
    const historicalAssignmentsPreserved = hash(priorDates.map(date=>game.select(date).puzzleId)) === previous.sha256;
    if (distinctBank < 200) failures.push(`${game.slug}: only ${distinctBank} substantive prepared challenges`);
    if (distinctDaily !== dates.length) failures.push(`${game.slug}: only ${distinctDaily}/${dates.length} distinct scheduled challenges`);
    if (openingWeekReplays.length) failures.push(`${game.slug}: reuses a challenge scheduled before this update on ${openingWeekReplays.join(', ')}`);
    if (!historicalAssignmentsPreserved) failures.push(`${game.slug}: changed a previously published date`);
    rows.push({slug:game.slug,name:game.name,creator:game.creator,preparedRecords:game.puzzles.length,substantiveChallenges:distinctBank,distinctDailyChallenges:distinctDaily,historicalAssignmentsPreserved,openingWeekReplays,selections});
  }
  assert.equal(games.length,32);
  const report={start:dates[0],end:dates.at(-1),endExclusive:'2027-04-29',calendarMonths:6,days:dates.length,gameCount:games.length,totalDailySelections:games.length*dates.length,allActualSelectorsExecuted:true,historicalComparison:{sourceCommit:baseline.sourceCommit,start:baseline.start,end:baseline.end,days:baseline.days,games:baseline.games.length},passed:!failures.length,failures,games:rows};
  if (process.argv.includes('--write')) await writeFile(new URL('../docs/six-month-runway.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({start:report.start,end:report.end,days:report.days,games:report.gameCount,selections:report.totalDailySelections,passed:report.passed,failures},null,2));
  assert.deepEqual(failures,[],'Six-month content/calendar verification failed');
} finally { await cleanup(); }
