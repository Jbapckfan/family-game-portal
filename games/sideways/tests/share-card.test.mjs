import test from 'node:test';import assert from 'node:assert/strict';
import {buildShareResult} from '../share-card.mjs';
const result=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',...opts});
test('first-check perfection depends on no nudges, never on a supposed optimal move count',()=>{
 assert.equal(result({status:'won',checks:1,moves:80,hints:0}).headline,'Perfectly in line.');
 assert.equal(result({status:'won',checks:1,moves:8,hints:1}).headline,'Everything lines up.');
 assert.equal(result({status:'won',checks:2,moves:8,hints:0}).headline,'Everything lines up.');
 const revealed=result({status:'revealed',checks:0,moves:0,hints:0});assert.equal(revealed.headline,'Board revealed.');assert.doesNotMatch(revealed.caption,/Solved|Perfect/);
 // Undo and re-nudging permit more than five legitimate nudges.
 assert.equal(result({status:'won',checks:1,moves:16,hints:7}).hints,7);
});
test('only frozen identity and aggregate checks/moves/nudges reach the renderer',()=>{
 const game={status:'won',checks:1,moves:14,hints:0,rotations:['LEAK'],history:['HISTORY'],lastCheck:{correct:['PATTERN']},words:['SECRET'],clue:'PRIVATE'};
 const r=result(game);game.moves=99;assert.equal(r.moves,14);assert.ok(Object.isFrozen(r));assert.doesNotMatch(JSON.stringify(r),/LEAK|HISTORY|PATTERN|SECRET|PRIVATE|rotations|lastCheck/);assert.match(r.caption,/2026-10-30/);
 const practice=result(game,{mode:'practice',dateKey:null,number:null});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026/);
});
test('unfinished, impossible counters and fake daily identities cannot be shared',()=>{
 for(const game of [{status:'playing',checks:0,moves:0,hints:0},{status:'won',checks:0,moves:2,hints:0},{status:'won',checks:1,moves:2,hints:3},{status:'won',checks:1,moves:-1,hints:0},{status:'won',checks:1.5,moves:2,hints:0}])assert.throws(()=>result(game));
 assert.throws(()=>result({status:'won',checks:1,moves:2,hints:0},{dateKey:'2026-02-30'}));
});
