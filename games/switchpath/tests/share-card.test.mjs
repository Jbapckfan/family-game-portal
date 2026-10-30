import test from 'node:test';
import assert from 'node:assert/strict';
const share=await import('../share-card.mjs').catch(()=>({}));
const state={status:'won',moves:15,hints:0,path:[0,1,2,3],puzzleId:'answer-should-stay-private'};
const daily={game:state,mode:'daily',number:11,dateKey:'2026-10-30'};
test('perfect, explored, hinted and revealed routes are honestly distinguished',()=>{
 assert.equal(typeof share.buildShareResult,'function');
 assert.equal(share.buildShareResult(daily).headline,'Perfect flow.');
 assert.equal(share.buildShareResult({...daily,game:{...state,moves:17}}).headline,'Route solved.');
 assert.equal(share.buildShareResult({...daily,game:{...state,hints:1}}).headline,'Route solved.');
 const revealed=share.buildShareResult({...daily,game:{...state,status:'revealed',moves:0}});
 assert.equal(revealed.headline,'Route revealed.');assert.match(revealed.caption,/Revealed/);
 assert.match(share.buildShareResult({...daily,game:{...state,hints:1}}).caption,/1 hint/);
});
test('image data excludes all values and route geometry, and freezes the played identity',()=>{
 assert.equal(typeof share.buildShareResult,'function');
 const game={...state},data=share.buildShareResult({...daily,game});game.moves=100;
 assert.equal(data.moves,15);assert.ok(Object.isFrozen(data));
 for(const secret of ['path','solution','values','puzzleId','answer-should-stay-private','0,1,2,3'])assert.equal(Object.hasOwn(data,secret),false);
 const serialized=JSON.stringify(data);assert.equal(serialized.includes('answer-should-stay-private'),false);
 assert.equal(serialized.includes('0,1,2,3'),false);assert.equal(/https?:/.test(data.caption),false);
 assert.match(data.caption,/#011/);assert.match(data.caption,/2026-10-30/);
});
test('practice cannot impersonate a daily and invalid or unfinished scores cannot be exported',()=>{
 assert.equal(typeof share.buildShareResult,'function');
 const practice=share.buildShareResult({...daily,mode:'practice'});
 assert.match(practice.caption,/practice/i);assert.equal(practice.caption.includes('2026-10-30'),false);
 for(const game of [{...state,status:'playing'},{...state,moves:14},{...state,hints:-1},{...state,hints:16}])
   assert.throws(()=>share.buildShareResult({...daily,game}));
 assert.throws(()=>share.buildShareResult({...daily,dateKey:'2026-02-30'}));
});
