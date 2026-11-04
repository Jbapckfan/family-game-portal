import test from 'node:test';
import assert from 'node:assert/strict';
import {TOUGHER_SAMPLE} from '../samples.mjs';
import {PUZZLES} from '../puzzles.mjs';
import {substantiveKey} from '../content-identity.mjs';
import {createGame,toggleCut,checkBoard,restoreGame,revealGame,getSegments} from '../engine.mjs';

// Independent prefix-sum calculation, without consulting the stored solution.
function partitions(puzzle) {
  const prefix=[0];for(const n of puzzle.numbers)prefix.push(prefix.at(-1)+n);
  const result=[];
  for(let a=0;a<9;a++)for(let b=a+1;b<10;b++)for(let c=b+1;c<11;c++)for(let d=c+1;d<12;d++) {
    const cuts=[a,b,c,d],ends=cuts.map(i=>i+1);
    const sums=ends.map((end,i)=>{const start=ends[(i+3)%4];return end>start?prefix[end]-prefix[start]:prefix[12]-prefix[start]+prefix[end]});
    result.push({cuts,sums});
  }
  return result;
}

test('sample has a separate stable identity outside the daily collection',()=>{
  assert.equal(TOUGHER_SAMPLE.id,'ringcount-tougher-v1');
  assert.equal(TOUGHER_SAMPLE.numbers.length,12);
  assert.equal(TOUGHER_SAMPLE.sections,4);
  assert.equal(TOUGHER_SAMPLE.target,17);
  assert.ok(TOUGHER_SAMPLE.numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=9));
  assert.ok(!PUZZLES.some(p=>p.id===TOUGHER_SAMPLE.id||substantiveKey(p)===substantiveKey(TOUGHER_SAMPLE)));
});
test('all 495 placements prove uniqueness, uneven lengths and meaningful near misses',()=>{
  const placements=partitions(TOUGHER_SAMPLE);
  assert.equal(placements.length,495);
  assert.deepEqual(placements.filter(p=>p.sums.every(n=>n===17)).map(p=>p.cuts),[TOUGHER_SAMPLE.solution]);
  assert.deepEqual(getSegments(TOUGHER_SAMPLE,TOUGHER_SAMPLE.solution).map(s=>s.indices.length).sort(),[2,2,3,5]);
  let matchingArcs=0;
  for(let start=0;start<12;start++)for(let length=1;length<12;length++) {
    let sum=0;for(let i=0;i<length;i++)sum+=TOUGHER_SAMPLE.numbers[(start+i)%12];
    if(sum===17)matchingArcs++;
  }
  assert.equal(matchingArcs-4,4);
  assert.ok(placements.some(p=>p.sums.filter(n=>n===17).length===2&&p.sums.every(n=>Math.abs(n-17)<=2)));
});
test('sample solves and restores with ordinary rules; reveal remains distinct',()=>{
  let game=createGame(TOUGHER_SAMPLE);
  for(const gap of TOUGHER_SAMPLE.solution)game=toggleCut(TOUGHER_SAMPLE,game,gap).state;
  const solved=checkBoard(TOUGHER_SAMPLE,game).state;
  assert.equal(solved.status,'won');assert.equal(solved.checks,1);
  assert.deepEqual(restoreGame(TOUGHER_SAMPLE,solved),solved);
  const revealed=revealGame(TOUGHER_SAMPLE,game);
  assert.equal(revealed.status,'revealed');assert.equal(revealed.checks,0);
  assert.deepEqual(restoreGame(TOUGHER_SAMPLE,revealed),revealed);
  assert.equal(restoreGame(PUZZLES[0],solved).status,'playing');
});

test('bonus sharing has its own label and cannot masquerade as a daily',async()=>{
  const {buildShareResult}=await import('../share-card.mjs');
  const {formatShare}=await import('../engine.mjs');
  const game={status:'won',checks:1,hints:1};
  const bonus=buildShareResult({game,mode:'practice',bonus:true});
  assert.equal(bonus.edition,'BONUS CHALLENGE');
  assert.equal(bonus.headline,'Circle solved.');
  assert.equal(bonus.filename,'alford-ringcount-bonus');
  assert.match(formatShare(TOUGHER_SAMPLE,game,{mode:'practice',bonus:true}),/^RINGCOUNT Bonus challenge/);
  assert.equal(buildShareResult({game,mode:'daily',bonus:true,number:16,dateKey:'2026-11-04'}).edition,'DAILY #016');
});
