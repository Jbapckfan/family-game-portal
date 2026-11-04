import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {calendarDates,loadDailyAudit} from './daily-audit-lib.mjs';
import {dailyIndex,centralDateKey} from '../games/deepseek-runtime/core.mjs';
import {DAILY_RESERVATIONS,FRESH_ROTATIONS,originalDailyIndex,releasedDailyIndex} from '../games/deepseek-runtime/daily-rotations.mjs';

const {games,cleanup}=await loadDailyAudit();
after(cleanup);
const dates=calendarDates('2026-10-29','2027-04-29');
const baseline=JSON.parse(await readFile(new URL('../docs/six-month-previous-calendar.json',import.meta.url),'utf8'));
const historical=calendarDates(baseline.start,'2026-10-30');
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

for(const game of games)test(`${game.slug}: six calendar months select distinct substantive challenges and preserve published dates`,()=>{
  assert.equal(dates.length,182);
  assert.ok(new Set(game.puzzles.map(game.key)).size>=200);
  assert.equal(new Set(dates.map(date=>game.key(game.select(date).puzzle))).size,182);
  assert.deepEqual(DAILY_RESERVATIONS.byGame[game.slug].indices.slice(0,dates.length),dates.map(date=>game.select(date).index),'original reservation prefix still matches every previously protected date');
  const openingWeek=new Set(calendarDates('2026-10-20','2026-10-29').map(date=>game.key(game.select(date).puzzle)));
  assert.ok(dates.every(date=>!openingWeek.has(game.key(game.select(date).puzzle))),`${game.slug}: the next six months must not recycle a challenge scheduled before this update`);
  const previous=baseline.games.find(p=>p.slug===game.slug);
  assert.ok(previous,`${game.slug}: a baseline is required`);
  assert.equal(sha(historical.map(date=>game.select(date).puzzleId)),previous.sha256);
});

test('dated rotations contain valid distinct challenge indices and remain stable when future records are appended',()=>{
  for(const game of games.filter(g=>g.creator!=='Kimi')){
    const rotation=FRESH_ROTATIONS[game.slug], count=game.puzzles.length;
    assert.equal(rotation.bankCount,count);
    assert.ok(rotation.indices.every(index=>Number.isInteger(index)&&index>=0&&index<count));
    assert.equal(new Set(rotation.indices.map(i=>game.key(game.puzzles[i]))).size,rotation.indices.length);
    for(const date of dates){
      if(game.creator==='Alford Daily'){
        const ordinal=(Date.parse(date)-Date.parse('2026-10-20'))/86400000;
        assert.equal(originalDailyIndex(game.slug,date,ordinal,count+11),originalDailyIndex(game.slug,date,ordinal,count));
      }else assert.equal(dailyIndex(game.slug,date,count+11),dailyIndex(game.slug,date,count));
    }
  }
});

test('the expanded release starts at Central midnight and does not activate for an old or reduced bank',()=>{
  assert.equal(centralDateKey(new Date('2026-10-30T04:59:59Z')),'2026-10-29');
  assert.equal(centralDateKey(new Date('2026-10-30T05:00:00Z')),'2026-10-30');
  for(const [slug,release] of Object.entries(FRESH_ROTATIONS)){
    assert.equal(releasedDailyIndex(slug,'2026-10-29',release.bankCount),null);
    assert.equal(releasedDailyIndex(slug,'2026-10-30',release.bankCount),release.indices[0]);
    assert.equal(releasedDailyIndex(slug,'2026-10-30',release.bankCount-1),null);
    assert.equal(releasedDailyIndex(slug,'2026-10-30',1),null);
  }
});
