import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,restoreState,getStatus,toggleCell,undo,restart,hint,reveal,solvePuzzle,constraintsSatisfied,clueStatus} from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
test('all prepared lattices have exactly one solution under their displayed clues',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.solution.join(''))).size,PUZZLES.length);
 for(const p of PUZZLES){const solutions=solvePuzzle(p,2);assert.equal(solutions.length,1,p.id);assert.deepEqual(solutions[0],p.solution,p.id);assert.ok(constraintsSatisfied(p,p.solution));assert.ok(p.givens.length<20,p.id);assert.ok(p.rows.every(n=>n>0&&n<5));assert.ok(p.columns.every(n=>n>0&&n<5));}
});
test('unknown, black, and white cycle with working undo and fixed givens',()=>{
 const p=PUZZLES[0],index=Array.from({length:25},(_,i)=>i).find(i=>!p.givens.some(g=>g[0]===i));let s=createState(p);assert.equal(s.cells[index],-1);s=toggleCell(p,s,index);assert.equal(s.cells[index],1);s=toggleCell(p,s,index);assert.equal(s.cells[index],0);s=toggleCell(p,s,index);assert.equal(s.cells[index],-1);s=undo(p,s);assert.equal(s.cells[index],0);assert.deepEqual(toggleCell(p,s,p.givens[0][0]),s);
});
test('every board can be solved through normal cell operations with valid intermediate saves',()=>{
 for(const p of PUZZLES){let s=createState(p);for(let i=0;i<25;i++){if(s.cells[i]===-1){s=toggleCell(p,s,i);if(p.solution[i]===0)s=toggleCell(p,s,i);s=restoreState(p,JSON.parse(JSON.stringify(s)));assert.ok(s,p.id);}}assert.equal(getStatus(p,s),'won',p.id);}
});
test('a full but incorrect grid does not win and contradictory line counts are visible',()=>{
 const p=PUZZLES[0],s=createState(p);s.cells=s.cells.map(v=>v===-1?1:v);assert.equal(getStatus(p,s),'playing');assert.ok(clueStatus(p,s.cells).some(c=>c.status==='contradiction'));assert.equal(constraintsSatisfied(p,s.cells),false);
});
test('hints correct a cell, restart retains assistance, reveal is never an unassisted win',()=>{
 const p=PUZZLES[0];let s=hint(p,createState(p));assert.equal(s.hinted.length,1);assert.equal(s.cells[s.lastHint],p.solution[s.lastHint]);s=restart(p,s);assert.equal(s.hinted.length,1);assert.deepEqual(s.cells,createState(p).cells);assert.equal(getStatus(p,reveal(p,s)),'revealed');assert.ok(restoreState(p,reveal(p,s)));
});
test('restoration rejects altered givens, invalid values, fabricated reveal, and malformed history',()=>{
 const p=PUZZLES[0],s=createState(p),cells=[...s.cells];cells[p.givens[0][0]]=1-cells[p.givens[0][0]];
 assert.equal(restoreState(p,{...s,cells}),null);assert.equal(restoreState(p,{...s,cells:Array(25).fill(2)}),null);assert.equal(restoreState(p,{...s,history:[[0]]}),null);assert.equal(restoreState(p,{...s,revealed:true}),null);assert.equal(getStatus(p,restoreState(p,{...s,status:'won'})),'playing');
});

// The initial thirty records are an append-only compatibility contract.
test('qwen-logic-lattice preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'87f09c40f6e5325e8f27b4aabb4400287ce410bb0f3a76efff986ade8ee07b3d');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
