import test from 'node:test';import assert from 'node:assert/strict';import {buildShareResult} from '../share-card.mjs';
const result=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',par:5,...opts});
test('only a five-swap win with no nudges or undos is perfect; reveal remains distinct',()=>{
 assert.equal(result({status:'won',moves:5,hints:0,undos:0}).headline,'A perfect trade.');
 for(const game of [{status:'won',moves:5,hints:1,undos:0},{status:'won',moves:7,hints:0,undos:1},{status:'won',moves:6,hints:0,undos:0}])assert.equal(result(game).headline,'Everything in its place.');
 assert.doesNotMatch(result({status:'revealed',moves:0,hints:0,undos:0}).caption,/Perfect|Solved/);
});
test('the frozen score/date snapshot excludes board, words, selected/hinted cells and events',()=>{
 const game={status:'won',moves:5,hints:0,undos:0,board:['SECRET'],events:['PATTERN'],history:['PRIVATE'],selected:{row:4,col:0},hinted:['ADVICE']};const r=result(game);game.moves=99;assert.ok(Object.isFrozen(r));assert.equal(r.moves,5);assert.doesNotMatch(JSON.stringify(r),/SECRET|PATTERN|PRIVATE|ADVICE|selected|board|events|history/);assert.match(r.caption,/2026-10-30/);
 const p=result(game,{mode:'practice',dateKey:null,number:null});assert.match(p.caption,/PRACTICE/);assert.doesNotMatch(p.caption,/DAILY|2026/);
});
test('unfinished results, impossible scores and fake daily dates are rejected',()=>{
 for(const game of [{status:'playing',moves:0,hints:0,undos:0},{status:'won',moves:4,hints:0,undos:0},{status:'won',moves:5,hints:-1,undos:0},{status:'won',moves:5,hints:0,undos:1.5}])assert.throws(()=>result(game));
 assert.throws(()=>result({status:'won',moves:5,hints:0,undos:0},{dateKey:'2026-02-30'}));
});
