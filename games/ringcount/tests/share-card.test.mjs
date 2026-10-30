import test from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../share-card.mjs').catch(()=>({}));
const game={status:'won',checks:1,hints:0,moves:4,puzzleId:'private-answer-id',cuts:[2,4,8,11],checkedSets:['2,4,8,11']};
const daily={game,mode:'daily',number:10,dateKey:'2026-10-29'};
test('result cards distinguish assisted wins and revealed answers from perfect results',()=>{
  assert.equal(typeof module.buildShareResult,'function');
  assert.equal(module.buildShareResult(daily).headline,'Perfect circle.');
  assert.equal(module.buildShareResult({...daily,game:{...game,hints:1}}).headline,'Circle solved.');
  assert.equal(module.buildShareResult({...daily,game:{...game,status:'revealed'}}).headline,'Answer revealed.');
  assert.match(module.buildShareResult({...daily,game:{...game,hints:1}}).caption,/1 hint/);
  assert.match(module.buildShareResult({...daily,game:{...game,status:'revealed'}}).caption,/Revealed/);
});
test('the share payload contains no answer material and preserves a result snapshot',()=>{
  assert.equal(typeof module.buildShareResult,'function');
  const input={...daily,game:{...game}};
  const data=module.buildShareResult(input);
  input.game.hints=8;
  assert.equal(data.hints,0);
  assert.ok(Object.isFrozen(data));
  const text=JSON.stringify(data);
  for(const secret of ['private-answer-id','2,4,8,11','cuts','checkedSets','numbers','solution','target'])assert.equal(text.includes(secret),false,secret);
  assert.match(data.caption,/2026-10-29/);
  assert.match(data.caption,/#010/);
  assert.equal(/https?:/.test(data.caption),false);
});
test('practice cards cannot impersonate a daily; unfinished or invalid results do not export',()=>{
  assert.equal(typeof module.buildShareResult,'function');
  const data=module.buildShareResult({...daily,mode:'practice',number:9});
  assert.match(data.caption,/practice/i);
  assert.equal(data.caption.includes('2026-10-29'),false);
  assert.equal(data.caption.includes('#010'),false);
  for(const bad of [
    {...daily,game:{...game,status:'playing'}},
    {...daily,game:{...game,hints:-1}},
    {...daily,game:{...game,checks:0}},
    {...daily,mode:'bogus'},
    {...daily,dateKey:'2026-02-30'},
  ])assert.throws(()=>module.buildShareResult(bad));
});
