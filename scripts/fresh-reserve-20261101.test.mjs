import test,{after} from 'node:test';import assert from 'node:assert/strict';import {calendarDates,loadDailyAudit} from './daily-audit-lib.mjs';import {practiceCandidates} from '../games/deepseek-runtime/practice-calendar.mjs';import {DAILY_RESERVATIONS} from '../games/deepseek-runtime/daily-rotations.mjs';
const {games,cleanup}=await loadDailyAudit();after(cleanup);const dates=calendarDates('2026-11-01','2027-05-02');
for(const game of games)test(`${game.slug}: the current 182-day runway stays fresh and cannot leak through Practice`,()=>{
 assert.equal(dates.length,182);const selected=dates.map(date=>game.select(date)),signatures=new Set(selected.map(({puzzle})=>game.key(puzzle)));assert.equal(signatures.size,182);
 const practice=new Set(practiceCandidates(game.slug,dates[0],game.puzzles.length));assert.ok(practice.size>0,'fresh practice remains available');
 for(let i=0;i<dates.length;i++)assert.equal(practice.has(selected[i].index),false,`Practice exposes ${dates[i]}`);
 for(let at=1;at<dates.length;at++){
  const available=new Set(practiceCandidates(game.slug,dates[at],game.puzzles.length));
  for(let future=at;future<dates.length;future++)assert.equal(available.has(selected[future].index),false,`${dates[at]} Practice exposes ${dates[future]}`);
 }
 assert.ok(DAILY_RESERVATIONS.end>=dates.at(-1));
});
