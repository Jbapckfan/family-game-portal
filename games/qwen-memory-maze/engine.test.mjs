import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,restoreState,getStatus,startStudy,chooseCell,tick,hint,reveal,adjacent,STUDY_MS,scoreSeconds} from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
test('all prepared paths are self-avoiding, orthogonal, 8–14 cells, and never blocked',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.path.join(','))).size,PUZZLES.length);
 for(const p of PUZZLES){assert.ok(p.path.length>=8&&p.path.length<=14,p.id);assert.equal(new Set(p.path).size,p.path.length);assert.ok(p.path.every(i=>Number.isInteger(i)&&i>=0&&i<49));assert.ok(p.path.slice(1).every((i,n)=>adjacent(p.path[n],i)),p.id);assert.equal(new Set(p.obstacles).size,p.obstacles.length);assert.ok(p.obstacles.every(i=>!p.path.includes(i)&&i>=0&&i<49));}
});
test('the full six-second study phase precedes recall and paused time is not wall-clock time',()=>{
 const p=PUZZLES[0];let s=createState(p);assert.equal(s.phase,'ready');s=startStudy(p,s);assert.equal(s.remainingMs,STUDY_MS);s=tick(p,s,2000);assert.equal(s.phase,'study');assert.equal(s.remainingMs,4000);s=restoreState(p,JSON.parse(JSON.stringify(s)));assert.equal(s.remainingMs,4000);s=tick(p,s,3999);assert.equal(s.phase,'study');s=tick(p,s,1);assert.equal(s.phase,'recall');assert.equal(s.elapsedMs,0);s=tick(p,s,1250);assert.equal(s.elapsedMs,1250);assert.equal(tick(p,s,0),s);
});
test('all prepared mazes can be completed and restored through the actual input validator',()=>{
 for(const p of PUZZLES){let s=tick(p,startStudy(p,createState(p)),STUDY_MS);for(const cell of p.path){s=chooseCell(p,s,cell).state;s=restoreState(p,JSON.parse(JSON.stringify(s)));assert.ok(s,p.id);}assert.equal(getStatus(p,s),'won',p.id);assert.equal(s.trail.length,p.path.length);assert.deepEqual(chooseCell(p,s,0).state,s);}
});
test('errors add two seconds but preserve the correct prefix and never make the path unsolvable',()=>{
 const p=PUZZLES[0];let s=tick(p,startStudy(p,createState(p)),STUDY_MS);s=chooseCell(p,s,p.path[0]).state;const wrong=Array.from({length:49},(_,i)=>i).find(i=>!p.obstacles.includes(i)&&!p.path.includes(i));s=chooseCell(p,s,wrong).state;assert.equal(s.mistakes,1);assert.deepEqual(s.trail,[p.path[0]]);assert.equal(scoreSeconds(s),2);assert.equal(getStatus(p,s),'playing');for(const i of p.path.slice(1))s=chooseCell(p,s,i).state;assert.equal(getStatus(p,s),'won');
});
test('a replay preserves progress, pauses recall time, and marks the solve assisted',()=>{
 const p=PUZZLES[0];let s=tick(p,startStudy(p,createState(p)),STUDY_MS);s=chooseCell(p,s,p.path[0]).state;s=tick(p,s,1000);s=hint(p,s);assert.equal(s.phase,'study');assert.equal(s.replays,1);assert.deepEqual(s.trail,[p.path[0]]);assert.equal(hint(p,s),null);s=tick(p,s,STUDY_MS);assert.equal(s.elapsedMs,1000);assert.ok(restoreState(p,s));assert.equal(getStatus(p,reveal(p,s)),'revealed');
});
test('restoration rejects fabricated progress, phases, timers, and impossible ready states',()=>{
 const p=PUZZLES[0],s=createState(p);assert.equal(restoreState(p,{...s,phase:'won'}),null);assert.equal(restoreState(p,{...s,trail:p.path}),null);assert.equal(restoreState(p,{...s,phase:'recall',trail:[p.path[1]]}),null);assert.equal(restoreState(p,{...s,phase:'study',remainingMs:STUDY_MS+1}),null);assert.equal(restoreState(p,{...s,elapsedMs:NaN}),null);assert.equal(restoreState(p,{...s,mistakes:-1}),null);assert.equal(getStatus(p,restoreState(p,{...s,status:'won'})),'playing');
});

// The initial thirty records are an append-only compatibility contract.
test('qwen-memory-maze preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'2300c11c50597bb8abacbd996eecd69e308d3530f66e0a4b1feeb905df2ea5b9');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
