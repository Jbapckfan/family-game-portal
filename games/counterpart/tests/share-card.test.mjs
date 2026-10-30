import test from 'node:test';import assert from 'node:assert/strict';
import {buildShareResult} from '../share-card.mjs';
const result=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',...opts});
test('perfect, hinted, extra-check and revealed outcomes remain honest',()=>{
 assert.equal(result({status:'won',attempts:5,hintedRows:[]}).headline,'Perfect counterparts.');
 assert.equal(result({status:'won',attempts:5,hintedRows:[0]}).headline,'Connections found.');
 assert.equal(result({status:'won',attempts:6,hintedRows:[]}).headline,'Connections found.');
 const revealed=result({status:'revealed',attempts:0,hintedRows:[0,1,2,3,4]});
 assert.equal(revealed.headline,'Answers revealed.');assert.equal(revealed.hints,5);assert.equal(revealed.checks,0);
});
test('only a frozen score/date snapshot reaches the renderer; words and placements are excluded',()=>{
 const game={status:'won',attempts:5,hintedRows:[],placements:[['SECRET','SPOILER']],puzzleId:'PRIVATE'};
 const r=result(game);assert.ok(Object.isFrozen(r));game.attempts=99;
 assert.equal(r.checks,5);assert.ok(!/SECRET|SPOILER|PRIVATE|placements/.test(JSON.stringify(r)));
 assert.match(r.caption,/2026-10-30/);assert.match(r.caption,/DAILY #011/);
 const practice=result(game,{mode:'practice',dateKey:null,number:null});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026/);
});
test('unfinished, impossible wins, invalid hint rows and fake daily dates cannot be shared',()=>{
 for(const game of [{status:'playing',attempts:0,hintedRows:[]},{status:'won',attempts:4,hintedRows:[]},{status:'won',attempts:-1,hintedRows:[]},{status:'won',attempts:5,hintedRows:[0,0]},{status:'won',attempts:5,hintedRows:[5]}])assert.throws(()=>result(game));
 assert.throws(()=>result({status:'won',attempts:5,hintedRows:[]},{dateKey:'2026-02-30'}));
});
