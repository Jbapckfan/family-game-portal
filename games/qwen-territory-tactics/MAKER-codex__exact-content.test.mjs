import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as E from './engine.mjs';
import {EXACT_PUZZLES,EXACT_EDITION} from './exact-puzzles.mjs';
import {PUZZLES as LEGACY} from './puzzles.mjs';
import {createSession} from '../deepseek-runtime/core.mjs';

// Independent flood-fill oracle: does not call game geometry, captures, or solver.
function reference(p){
 const keys=[];for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(Math.abs(x+y)<=3)keys.push(`${x},${y}`);
 const adjacent=Object.fromEntries(keys.map(c=>{const [x,y]=c.split(',').map(Number);return [c,keys.filter(d=>{const [u,v]=d.split(',').map(Number);return Math.max(Math.abs(x-u),Math.abs(y-v),Math.abs(x+y-u-v))===1;})];}));
 function components(stones){const unseen=new Set(stones),out=[];while(unseen.size){const group=[unseen.values().next().value];unseen.delete(group[0]);for(let i=0;i<group.length;i++)for(const n of adjacent[group[i]])if(unseen.delete(n))group.push(n);out.push(group);}return out;}
 function move(b,key){
  if(b.blue.includes(key)||b.amber.includes(key))return;
  const blue=[...b.blue,key],occupied=new Set([...blue,...b.amber]);
  const gone=components(b.amber).filter(group=>!group.some(c=>adjacent[c].some(n=>!occupied.has(n)))).flat();
  const amber=b.amber.filter(c=>!gone.includes(c)),filled=new Set([...blue,...amber]);
  const own=components(blue).find(group=>group.includes(key));
  if(!own.some(c=>adjacent[c].some(n=>!filled.has(n))))return;
  return {blue,amber,captured:b.captured+gone.length};
 }
 const wins=[],under=[],over=[],first=[];
 function visit(b,path){
  if(b.captured===p.target){wins.push(path);return;}
  if(b.captured>p.target){over.push(path);return;}
  if(b.captured>0)under.push(path);
  if(path.length===3)return;
  for(const key of keys){const next=move(b,key);if(next){if(!path.length)first.push(key);visit(next,[...path,key]);}}
 }
 visit({blue:p.friendly,amber:p.enemy,captured:0},[]);
 return {wins,under,over,first};
}
function canonical(p,enemyOnly=false){const variants=[];for(let reflect=0;reflect<2;reflect++)for(let turn=0;turn<6;turn++){
 const transform=c=>{let [x,y]=c.split(',').map(Number);if(reflect)y=-x-y;for(let i=0;i<turn;i++)[x,y]=[-y,x+y];return `${x},${y}`;};
 variants.push(JSON.stringify([enemyOnly?[]:p.friendly.map(transform).sort(),p.enemy.map(transform).sort()]));
}return variants.sort()[0];}
const proofs=new Map();

test('240 expanded boards are distinct even after rotation/reflection and retain every legacy record',()=>{
 assert.equal(EXACT_PUZZLES.length,240);assert.equal(LEGACY.length,200);
 assert.equal(createHash('sha256').update(JSON.stringify(LEGACY)).digest('hex'),'9cbaeae439050732a65f6630b409f9e7dacf050a5901ec3bb1052dd44e512cc5');
 assert.equal(new Set(EXACT_PUZZLES.map(p=>p.id)).size,240);assert.ok(EXACT_PUZZLES.every(p=>!LEGACY.some(old=>old.id===p.id)));
 assert.equal(new Set(EXACT_PUZZLES.map(p=>canonical(p))).size,240);
 assert.equal(new Set(EXACT_PUZZLES.map(p=>canonical(p,true))).size,240,'enemy geometry itself varies');
});

test('independent exhaustive oracle proves all exact goals, three-move depth, and intentional under/overshoot traps',()=>{
 let combination=0;
 for(const p of EXACT_PUZZLES){
  assert.equal(p.radius,3,p.id);assert.equal(E.cells(p).length,37);assert.equal(p.maxMoves,3);assert.equal(p.captureRule,'exact');
  assert.ok(37-p.friendly.length-p.enemy.length>=8);assert.equal(new Set([...p.friendly,...p.enemy]).size,p.friendly.length+p.enemy.length);
  for(const stone of [...p.friendly,...p.enemy])assert.ok(E.cells(p).includes(stone));
  for(const group of E.groups(p,p.enemy))assert.ok(E.liberties(p,group,p.friendly,p.enemy).length);
  for(const group of E.groups(p,p.friendly))assert.ok(E.liberties(p,group,p.friendly,p.enemy).length);
  const proof=reference(p);proofs.set(p.id,proof);
  assert.ok(proof.wins.length,p.id+' solvable');assert.ok(proof.wins.every(r=>r.length===3),p.id+' all three placements required');
  assert.ok(proof.under.length,p.id+' smaller capture exists');assert.ok(proof.over.length,p.id+' overshoot exists');assert.ok(proof.first.length>=6);
  assert.deepEqual(E.winningPaths(p).map(r=>r.join(';')).sort(),proof.wins.map(r=>r.join(';')).sort(),p.id+' engine and independent oracle agree');
  if(!E.groups(p,p.enemy).some(g=>g.length===p.target))combination++;
 }
 assert.equal(combination,120,'half the boards require combining groups, not just selecting the target-size group');
});

test('every exact win, smaller capture and overshoot restores; hints recover all selected dead ends',()=>{
 for(const p of EXACT_PUZZLES){const proof=proofs.get(p.id)||reference(p);
  for(const path of [proof.wins[0],proof.under.at(-1),proof.over[0]]){
   let s=E.createState(p);
   for(const key of path){const result=E.place(p,s,key);assert.notEqual(result.state,s,p.id);s=result.state;assert.deepEqual(E.restoreState(p,s),s);}
   const count=E.simulate(p,s.moves).captured;assert.equal(E.getStatus(p,s),count===p.target?'won':'playing');
   if(count>p.target){assert.equal(E.restoreState(p,{...s,revealed:true}),null);assert.equal(E.place(p,s,proof.first[0]).state,s);}
   for(let n=0;n<7&&E.getStatus(p,s)==='playing';n++){s=E.hint(p,s);assert.deepEqual(E.restoreState(p,s),s);}
   assert.equal(E.getStatus(p,s),'won',p.id+' hints recover');assert.equal(E.simulate(p,s.moves).captured,p.target);
  }
  const shown=E.reveal(p,E.createState(p));assert.equal(E.getStatus(p,shown),'revealed');assert.deepEqual(E.restoreState(p,shown),shown);
 }
});

test('actual edition sessions cover six calendar months with distinct expanded daily puzzles',()=>{
 const config={...E,id:'qwen-territory-tactics',name:'Territory Tactics',stateEdition:EXACT_EDITION,puzzles:EXACT_PUZZLES},seen=new Set();
 for(let time=Date.parse('2026-11-06T18:00:00Z');time<Date.parse('2027-05-06T18:00:00Z');time+=86400000){
  const g=createSession(config,{now:()=>new Date(time)});assert.equal(g.puzzle.radius,3);assert.equal(g.outcome,'playing');assert.ok(!seen.has(g.puzzle.id),g.dateKey);seen.add(g.puzzle.id);
 }
 assert.equal(seen.size,181);
});
