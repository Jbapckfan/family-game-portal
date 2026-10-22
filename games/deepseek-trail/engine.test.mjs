import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
test('all prepared Trail targets occupy a legal nine-cell path',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.answer)).size,PUZZLES.length);
 for(const p of PUZZLES){assert.match(p.answer,/^[A-Z]{9}$/);assert.equal(p.grid.length,9);assert.equal(p.path.length,9);assert.ok(E.validPath(p.path));
  assert.equal(E.wordAt(p,p.path),p.answer);let s=E.createState(p);
  for(const index of p.path)s=E.selectTile(p,s,index).state;
  assert.equal(E.getStatus(p,s),'playing');s=E.submit(p,s).state;
  assert.equal(E.getStatus(p,s),'won');assert.deepEqual(E.restoreState(p,s),s);
 }
});
test('Trail rejects jumps/reused cells and permits backtracking',()=>{
 const p=PUZZLES[0];let s=E.selectTile(p,E.createState(p),0).state;
 assert.deepEqual(E.selectTile(p,s,8).state,s);
 s=E.selectTile(p,s,1).state;s=E.selectTile(p,s,2).state;
 s=E.selectTile(p,s,1).state;assert.deepEqual(s.path,[0,1]);
 assert.deepEqual(E.undo(p,s).path,[0]);assert.deepEqual(E.clear(p,s).path,[]);
 assert.equal(E.restoreState(p,{...s,path:[0,0]}),null);assert.equal(E.restoreState(p,{...s,path:[0,8]}),null);
});
test('Trail hint restores a valid route from any legal opening and finishes every puzzle',()=>{
 for(const p of PUZZLES){for(let cell=0;cell<9;cell++){
  let s=E.selectTile(p,E.createState(p),cell).state;
  for(let n=0;n<9;n++)s=E.hint(p,s);
  s=E.submit(p,s).state;assert.equal(E.getStatus(p,s),'won');assert.ok(E.validPath(s.path));
 }}
});
test('Trail reveal is not a win; malformed terminal saves cannot forge completion',()=>{
 const p=PUZZLES[0],s=E.createState(p);
 assert.equal(E.restoreState(p,{...s,submitted:true}),null);
 assert.equal(E.restoreState(p,{...s,revealed:true}),null);
 assert.equal(E.restoreState(p,{...s,checks:Infinity}),null);
 const r=E.reveal(p,s);assert.equal(E.getStatus(p,r),'revealed');assert.deepEqual(E.restoreState(p,r),r);
});

// The initial thirty records are an append-only compatibility contract.
test('deepseek-trail preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'c810621f47db3fb25f0dd9f33a212262552eb1875407568dd34d6704a87ab41b');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
