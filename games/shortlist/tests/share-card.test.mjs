import test from 'node:test';import assert from 'node:assert/strict';import {buildShareResult} from '../share-card.mjs';
const make=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',...opts});
test('zero-scan wins, losses and reveals carry factual outcomes and assistance counts',()=>{
 const lucky=make({status:'won',scans:[],hints:0});assert.equal(lucky.headline,'Secret found.');assert.equal(lucky.scans,0);assert.doesNotMatch(lucky.caption,/perfect|genius|skill/i);
 assert.match(make({status:'lost',scans:[{},{},{}],hints:1}).caption,/Missed/);
 assert.match(make({status:'revealed',scans:[],hints:1}).caption,/Revealed/);
});
test('frozen share result excludes the secret, pick, bank, pencil notes and scan evidence',()=>{
 const game={status:'won',scans:[{letters:'XY',count:2}],hints:1,secret:'APPLE',pick:'APPLE',words:['APPLE'],eliminated:['OTHER']};
 const r=make(game);game.scans.push({});assert.equal(r.scans,1);assert.ok(Object.isFrozen(r));
 assert.ok(!/APPLE|OTHER|XY|letters|eliminated|count/.test(JSON.stringify(r)));assert.match(r.caption,/2026-10-30/);
 const p=make(game,{mode:'practice',number:null,dateKey:null});assert.match(p.caption,/PRACTICE/);assert.doesNotMatch(p.caption,/DAILY|2026/);
});
test('unfinished rounds, impossible budgets and fake dates cannot be exported',()=>{
 for(const game of [{status:'playing',scans:[],hints:0},{status:'won',scans:[{},{},{},{}],hints:0},{status:'won',scans:[],hints:2},{status:'lost',scans:3,hints:0}])assert.throws(()=>make(game));
 assert.throws(()=>make({status:'won',scans:[],hints:0},{dateKey:'2026-02-30'}));
});
