import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as catalog from './catalog.mjs';
import {dateKey} from './app.mjs';

test('curation keeps four featured entries and all 32 playable identities',()=>{
  assert.equal(typeof catalog.featuredGames,'function');
  assert.deepEqual(catalog.featuredGames().map(g=>g.slug),['ringcount','switchpath','counterpart','shortlist']);
  assert.equal(catalog.GAMES.length,32);
});
test('Today’s Three is date-stable, distinct and available across epoch and DST boundaries',()=>{
  assert.equal(typeof catalog.todayThree,'function');
  for(const [key,want] of [
    ['2026-10-20',['ringcount','switchpath','counterpart']],
    ['2026-10-21',['switchpath','counterpart','shortlist']],
    ['2026-10-23',['shortlist','ringcount','switchpath']],
    ['2026-11-01',['ringcount','switchpath','counterpart']],
    ['2026-10-19',['shortlist','ringcount','switchpath']],
  ])assert.deepEqual(catalog.todayThree(key).map(g=>g.slug),want,key);
  const available=catalog.GAMES.filter(g=>!['ringcount','counterpart','shortlist'].includes(g.slug));
  const result=catalog.todayThree('2026-10-20',available);
  assert.equal(result.length,3);assert.equal(new Set(result.map(g=>g.slug)).size,3);
  assert.ok(result.every(g=>available.includes(g)));
  assert.deepEqual(catalog.todayThree('invalid'),[]);
  assert.deepEqual(catalog.todayThree('2026-02-31'),[]);
});
test('Central date rollover and clock rollback reproduce the same selected set',()=>{
  assert.equal(typeof catalog.todayThree,'function');
  const before=dateKey(new Date('2026-11-01T04:59:59Z')),after=dateKey(new Date('2026-11-01T05:00:00Z'));
  assert.equal(before,'2026-10-31');assert.equal(after,'2026-11-01');
  const previous=catalog.todayThree(before).map(g=>g.slug);
  assert.notDeepEqual(catalog.todayThree(after).map(g=>g.slug),previous);
  assert.deepEqual(catalog.todayThree(dateKey(new Date('2026-11-01T04:59:59Z'))).map(g=>g.slug),previous);
  assert.equal(dateKey(new Date('2026-11-01T06:30:00Z')),dateKey(new Date('2026-11-01T07:30:00Z')));
});
test('sharing is allowlisted metadata and never serializes answers, geometry or arbitrary status text',()=>{
  assert.equal(typeof catalog.buildDailyShare,'function');
  const results=[{slug:'ringcount',status:'won',solution:[2,4,8,11]},{slug:'switchpath',status:'revealed',grid:'SECRET_ROUTE'},{slug:'counterpart',status:'ANSWER_LEAK',answer:'SECRET_WORD'}];
  assert.equal(catalog.buildDailyShare('2026-10-20',results),'Alford Daily · 2026-10-20\nToday’s Three\nRingcount: Solved\nSwitchpath: Revealed\nCounterpart: Ready');
  assert.doesNotMatch(catalog.buildDailyShare('2026-10-20',results),/SECRET|ANSWER|2,4|grid|solution/);
  assert.throws(()=>catalog.buildDailyShare('bad',results),RangeError);
});
