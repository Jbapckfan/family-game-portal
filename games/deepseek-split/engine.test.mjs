import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
test('all 30 Split boards have ten conserved letters and two distinct clued answers',()=>{
 assert.equal(PUZZLES.length,30);assert.equal(new Set(PUZZLES.map(p=>p.words.join('/'))).size,30);
 for(const p of PUZZLES){assert.equal(p.rack.length,10);assert.equal(p.words.join('').length,10);assert.equal(new Set(p.words).size,2);
  assert.deepEqual([...p.rack].sort(),[...p.words.join('')].sort());
  let s=E.createState(p);
  for(let row=0;row<2;row++){s=E.setActive(p,s,row);for(const letter of p.words[row]){
    const used=s.rows.flat();const index=p.rack.findIndex((c,i)=>c===letter&&!used.includes(i));
    s=E.addTile(p,s,index).state;
  }}
  assert.equal(E.getStatus(p,s),'playing');s=E.submit(p,s).state;
  assert.equal(E.getStatus(p,s),'won');assert.deepEqual(E.restoreState(p,s),s);
 }
});
test('Split duplicate letters are distinct tiles and a tile cannot fill two slots',()=>{
 const p=PUZZLES.find(p=>new Set(p.rack).size<10);let s=E.createState(p);
 s=E.addTile(p,s,0).state;assert.deepEqual(E.addTile(p,s,0).state,s);
 s=E.setActive(p,s,1);assert.deepEqual(E.addTile(p,s,0).state,s);
 assert.equal(E.restoreState(p,{...s,rows:[[0],[0]]}),null);
 assert.equal(E.restoreState(p,{...s,rows:[[10],[]]}),null);
 assert.equal(E.restoreState(p,{...s,active:2}),null);
});
test('Split hints recover arbitrary partitions and can complete every puzzle',()=>{
 for(const p of PUZZLES){let s=E.createState(p);
  for(let i=0;i<10;i++)s=E.addTile(p,s,i).state;
  for(let n=0;n<10;n++)s=E.hint(p,s);
  s=E.submit(p,s).state;assert.equal(E.getStatus(p,s),'won');assert.equal(new Set(s.rows.flat()).size,10);
 }
});
test('Split undo/restart preserve assistance and reveal never becomes a win',()=>{
 const p=PUZZLES[0];let s=E.hint(p,E.createState(p));const hints=s.hints;
 s=E.undo(p,s);assert.equal(s.hints,hints);assert.equal(s.rows.flat().length,0);
 s=E.clearAll(p,s);assert.equal(s.hints,hints);
 assert.equal(E.restoreState(p,{...s,submitted:true}),null);
 const r=E.reveal(p,s);assert.equal(E.getStatus(p,r),'revealed');assert.deepEqual(E.restoreState(p,r),r);
});
