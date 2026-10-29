import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceCandidates} from './practice-calendar.mjs';
import {DAILY_RESERVATIONS,FRESH_ROTATIONS} from './daily-rotations.mjs';
import {substantiveSignature} from '../../scripts/imported-content-signatures.mjs';

const day=date=>Date.parse(date)/86400000;
const dates=['2026-10-28','2026-10-29','2026-10-30','2026-11-01','2027-03-14','2027-04-28','2027-04-29'];
for(const [slug,reservation] of Object.entries(DAILY_RESERVATIONS.byGame)){
 test(`${slug}: fresh Practice excludes every remaining daily, with inclusive boundaries`,()=>{
  for(const date of dates){
   const first=Math.max(0,day(date)-day(DAILY_RESERVATIONS.start));
   const protectedIndices=date>DAILY_RESERVATIONS.end?[]:reservation.indices.slice(first);
   const today=reservation.indices[first],options={excludeIndices:today===undefined?[]:[today]};
   const candidates=practiceCandidates(slug,date,reservation.bankCount,options);
   const canonical=FRESH_ROTATIONS[slug]?.indices??Array.from({length:reservation.bankCount},(_,i)=>i);
   assert.ok(candidates.length,`${slug} ${date}: has a usable practice reserve`);
   assert.deepEqual(candidates,canonical.filter(index=>!protectedIndices.includes(index)&&index!==today),`${slug} ${date}`);
   assert.equal(new Set(candidates).size,candidates.length);
  }
 });
}

test('unknown games and reduced fixtures use valid local indices, with a one-board replay exception',()=>{
 for(const slug of ['fixture','qwen-pattern-prism','claude-tumbler']){
  assert.deepEqual(practiceCandidates(slug,'2026-10-30',3,{excludeIndices:[1]}),[0,2]);
  assert.deepEqual(practiceCandidates(slug,'2026-10-30',1,{excludeIndices:[0]}),[0]);
 }
 assert.deepEqual(practiceCandidates('fixture','2026-10-30',3,{excludeIndices:[-1,3,NaN,1,1]}),[0,2]);
});
test('invalid counts and nonexistent dates cannot silently bypass reservations',()=>{
 for(const date of ['2026-02-30','2026-13-01','2026-1-01','not-a-date'])assert.throws(()=>practiceCandidates('fixture',date,3));
 for(const count of [0,-1,1.5,NaN,Infinity])assert.throws(()=>practiceCandidates('fixture','2026-10-30',count));
});
test('appended unpublished records do not change the canonical practice reserve',()=>{
 for(const [slug,rotation] of Object.entries(FRESH_ROTATIONS))assert.deepEqual(practiceCandidates(slug,'2027-04-29',rotation.bankCount+11),practiceCandidates(slug,'2027-04-29',rotation.bankCount));
});
test('Prism practice omits the duplicate legacy rules even after the daily reservation expires',async()=>{
 const {PUZZLES}=await import('../qwen-pattern-prism/puzzles.mjs');
 const candidates=practiceCandidates('qwen-pattern-prism','2027-04-29',PUZZLES.length);
 assert.equal(candidates.length,200);
 assert.equal(new Set(candidates.map(index=>substantiveSignature('qwen-pattern-prism',PUZZLES[index]))).size,200);
 assert.equal(candidates.filter(index=>index<30).length,5);
});
test('Splice practice honors the canonical editorial hold after the reservation expires',()=>{
 const rotation=FRESH_ROTATIONS['claude-splice'];
 const candidates=practiceCandidates('claude-splice','2027-04-29',rotation.bankCount);
 assert.ok(!candidates.includes(7),'splice-8 is held');
 assert.ok(!candidates.includes(23),'splice-24 is held');
 assert.equal(candidates.length,200);
});
test('Sprout keeps all eleven reviewed legacy graphs out of new practice',async()=>{
 const {PUZZLES}=await import('../claude-sprout/puzzles.mjs');
 const held=new Set([7,12,54,58,61,62,86,88,116,124,128].map(n=>`sprout-${n}`));
 const candidates=practiceCandidates('claude-sprout','2027-04-29',PUZZLES.length);
 assert.equal(PUZZLES.length,211);assert.equal(candidates.length,200);
 assert.ok(candidates.every(index=>!held.has(PUZZLES[index].id)));
});
