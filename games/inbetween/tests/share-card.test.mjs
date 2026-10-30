import test from 'node:test';import assert from 'node:assert/strict';import {buildShareResult} from '../share-card.mjs';
const result=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',...opts});
test('only a six-attempt unassisted win is perfect; revealed stays distinct',()=>{
 assert.equal(result({status:'won',attempts:6,hints:0}).headline,'A perfect fit.');
 for(const game of [{status:'won',attempts:6,hints:1},{status:'won',attempts:7,hints:0}])assert.equal(result(game).headline,'Right where they belong.');
 assert.doesNotMatch(result({status:'revealed',attempts:0,hints:0}).caption,/Perfect|Solved/);
});
test('frozen aggregate sharing excludes seeds, pairs, clues, answers, gaps and placement history',()=>{
 const game={status:'won',attempts:6,hints:0,placements:[{tileId:'SECRET',gap:2}],seed:'SEED',pair:'AB',answer:'ANSWER',clue:'PRIVATE',preview:'PREVIEW'};const r=result(game);game.attempts=99;assert.ok(Object.isFrozen(r));assert.equal(r.attempts,6);assert.doesNotMatch(JSON.stringify(r),/SECRET|SEED|ANSWER|PRIVATE|PREVIEW|placement|tileId|gap|clue|seed|pair/);assert.match(r.caption,/2026-10-30/);
 const practice=result(game,{mode:'practice',number:null,dateKey:null});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026/);
});
test('unfinished games, impossible counters and fake daily identities cannot be shared',()=>{
 for(const game of [{status:'playing',attempts:0,hints:0},{status:'won',attempts:5,hints:0},{status:'won',attempts:6,hints:-1},{status:'won',attempts:6.5,hints:0}])assert.throws(()=>result(game));
 assert.throws(()=>result({status:'won',attempts:6,hints:0},{dateKey:'2026-02-30'}));
});
