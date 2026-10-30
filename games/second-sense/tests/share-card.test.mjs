import test from 'node:test';import assert from 'node:assert/strict';
import {buildShareResult} from '../share-card.mjs';
const result=(game,opts={})=>buildShareResult({game,mode:'daily',number:11,dateKey:'2026-10-30',...opts});
test('perfect, hinted, extra-check and revealed outcomes remain honest',()=>{
 assert.equal(result({status:'won',attempts:5,hintedNouns:[]}).headline,'Perfect second sense.');
 assert.equal(result({status:'won',attempts:5,hintedNouns:['n0']}).headline,'Both meanings found.');
 assert.equal(result({status:'won',attempts:6,hintedNouns:[]}).headline,'Both meanings found.');
 const revealed=result({status:'revealed',attempts:0,hintedNouns:['n0','n1','n2','n3','n4']});
 assert.equal(revealed.headline,'Answers revealed.');assert.equal(revealed.hints,5);assert.equal(revealed.checks,0);
});
test('only a frozen score/date snapshot reaches the renderer; words and placements are excluded',()=>{
 const game={status:'won',attempts:5,hintedNouns:[],placements:[{word:'SECRET',nounId:'SPOILER',verbId:'MAPPING'}],puzzleId:'PRIVATE',draft:'DRAFTLEAK',clues:['CLUELEAK']};
 const r=result(game);assert.ok(Object.isFrozen(r));game.attempts=99;
 assert.equal(r.checks,5);assert.ok(!/SECRET|SPOILER|MAPPING|PRIVATE|placements|DRAFTLEAK|CLUELEAK/.test(JSON.stringify(r)));
 assert.match(r.caption,/2026-10-30/);assert.match(r.caption,/DAILY #011/);
 const practice=result(game,{mode:'practice',dateKey:null,number:null});assert.match(practice.caption,/PRACTICE/);assert.doesNotMatch(practice.caption,/DAILY|2026/);
});
test('unfinished, impossible wins, invalid hint counts and fake daily dates cannot be shared',()=>{
 for(const game of [{status:'playing',attempts:0,hintedNouns:[]},{status:'won',attempts:4,hintedNouns:[]},{status:'won',attempts:-1,hintedNouns:[]},{status:'won',attempts:5,hintedNouns:['n0','n0']},{status:'won',attempts:5,hintedNouns:['n0','n1','n2','n3','n4','n5']}])assert.throws(()=>result(game));
 assert.throws(()=>result({status:'won',attempts:5,hintedNouns:[]},{dateKey:'2026-02-30'}));
});
