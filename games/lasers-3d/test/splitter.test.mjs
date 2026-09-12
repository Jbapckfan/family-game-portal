import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {proveMinimal,solve,flatten} from '../solver.mjs';
const require=createRequire(import.meta.url),Sim=require('../src/sim.js'),Pieces=require('../src/pieces.js'),Trace=require('../src/main-trace.js'),P=require('../src/progress.js'),levels=require('../src/levels.js');
const clone=o=>JSON.parse(JSON.stringify(o));
const board=(extra={})=>({size:{w:7,d:7},terrain:Array(7).fill('0000000'),emitter:{x:0,y:3,dir:'E'},targets:[{x:6,y:3},{x:3,y:6}],fixed:[],tray:['SPLITTER'],...extra});
const piece=(x,y,type='SPLITTER',orient='/')=>({x,y,type,orient});
test('splitter keeps the old keyboard ordering and both branch pitches for all headings',()=>{
 assert.deepEqual(Pieces.TYPES,['MIRROR','WEDGE','DIP','FLOOR','SPLITTER']);
 for(const d of Object.keys(Sim.DIRS))for(const o of Pieces.ORIENTS)for(const v of [-1,0,1]){
  // Registry guarantees no pitch delta. Actual pitched arrivals are exercised by the raised chapter below.
  assert.deepEqual(Pieces.apply('SPLITTER',o,d,v),{d:Pieces.TURN[o][d],v});
  assert.equal(Pieces.PIECES.SPLITTER.split,true);
 }
});
test('equal-length branches arrive together and do not count the common stem twice',()=>{
 const r=Sim.trace(board(),[piece(3,3)]),ds=Trace.arcLengths(r);
 assert.equal(r.allTargetsHit,true);assert.deepEqual(r.hits,[1,0]);
 const hits=r.events.filter(e=>e.kind==='target');assert.deepEqual(hits.map(e=>ds[e.step]),[6,6]);
 assert.equal(Math.max(...ds),6);assert.equal(r.events.filter(e=>e.kind==='split').length,1);
 const fork=r.events.find(e=>e.kind==='split').step;
 assert.equal(r.segments.filter(s=>s.parent===fork).length,2);
 assert.equal(Trace.cues(Sim.parseLevel(board()),r).filter(c=>c.kind==='hit').length,2);
});
test('rotating the splitter changes only the reflected branch; partial hits never win',()=>{
 const r=Sim.trace(board(),[piece(3,3,'SPLITTER','\\')]);
 assert.equal(r.allTargetsHit,false);assert.deepEqual(r.hits,[0]);assert.equal(r.end,'split-incomplete');
 assert.ok(r.events.some(e=>e.kind==='branch-end'));
});
test('blocking one branch does not stop its sibling',()=>{
 const l=board();l.terrain[4]='0003000';const r=Sim.trace(l,[piece(3,3)]);
 assert.deepEqual(r.hits,[0]);assert.equal(r.allTargetsHit,false);assert.ok(r.segments.some(s=>s.terminal==='blocked'));
});
test('an overflown or underpassed splitter does not split',()=>{
 for(const [z,top,opening] of [[2,0,false],[0,3,true]]){
  const l=board({emitter:{x:0,y:3,dir:'E'},targets:[{x:6,y:3}],openings:opening?[{x:3,y:3,levels:[0]}]:[]});
  const row=Array(7).fill(z);row[3]=top;l.terrain[3]=row.join('');const r=Sim.trace(l,[piece(3,3)]);
  assert.equal(r.allTargetsHit,true);assert.ok(!r.events.some(e=>e.kind==='split'));
  assert.ok(r.events.some(e=>e.kind===(opening?'underpass':'overflight')));
 }
});
test('a falling arrival produces two falling branches at the same physical distance',()=>{
 const l=board({emitter:{x:0,y:3,dir:'E'},targets:[{x:6,y:6}],fixed:[piece(2,3,'DIP','/') ]});
 l.terrain[3]='2220000';l.terrain[4]='0010000';
 const r=Sim.trace(l,[piece(2,4)]),e=r.events.find(e=>e.kind==='split');
 assert.ok(e);assert.equal(e.v,-1);const branches=r.segments.filter(s=>s.parent===e.step);
 assert.equal(branches.length,2);assert.ok(branches.every(s=>s.v===-1));assert.equal(branches[0].d0,branches[1].d0);
});
test('recirculating splitter network terminates within the finite state space',()=>{
 const l=board({emitter:{x:0,y:1,dir:'E'},targets:[{x:6,y:6}]});
 const ps=[piece(2,1,'SPLITTER','\\'),piece(2,4),piece(5,4,'SPLITTER','\\'),piece(5,1)];
 const r=Sim.trace(l,ps);assert.equal(r.allTargetsHit,false);assert.ok(r.events.some(e=>e.kind==='merge'));assert.ok(r.segments.length<Sim.stepCap(l));
 assert.deepEqual(Sim.trace(l,ps),r);
});
for(const l of levels.filter(l=>l.bonus))test(l.name+': authored route and minimum par are proven; a splitter is required',()=>{
 const r=Sim.trace(l,l.solution),min=proveMinimal(l,l.par,{maxNodes:100000,maxMs:10000});
 assert.equal(r.allTargetsHit,true);assert.equal(r.hits.length,l.targets.length);assert.ok(min.nodes>0&&min.proven&&!min.truncated);
 assert.ok(r.events.some(e=>e.kind==='split'));assert.equal(l.solution.length,l.par);
 const no=solve({...l,par:0,tray:l.tray.filter(t=>t!=='SPLITTER')},{firstOnly:true,maxNodes:100000,maxMs:10000});
 assert.ok(!no.solvable&&!no.truncated);assert.ok(flatten(l).tray.includes('SPLITTER'));
});
test('branch discoveries are monotonic and targets that were flown over still read as success when reached later',()=>{
 const l=Sim.parseLevel(levels[26]),r=Sim.trace(l,levels[26].solution),d=Trace.discoveries(l,r);
 assert.ok(d.every((e,i)=>i===0||e.dist>=d[i-1].dist));
 const copy=clone(r);copy.visited.unshift({...l.targets[0],z:3,d:'E',v:0});
 assert.equal(Trace.readout(l,copy,{target:'Connected',over:'Over'}).message,'Connected');
});
test('bonus chapter persists without unlocking the original campaign or changing old records',()=>{
 const p=P.migrate({currentLevel:0,highestUnlocked:2,stars:{0:{solved:true,par:true}}},levels);P.sync(p,levels);
 const old=clone(p.records['first-bounce']);p.currentLevel=23;p.stars[23]={solved:true,par:true,blind:true};P.sync(p,levels);P.migrate(p,levels);
 assert.equal(p.currentLevel,23);assert.equal(p.highestUnlocked,2);assert.deepEqual(p.records['first-bounce'],old);assert.equal(p.stars[23].solved,true);
 const l=levels[23],a={f:P.fingerprint(l),placed:l.solution};assert.deepEqual(P.attempt(a,l,Sim).placed,l.solution);
});
// Independent unweighted graph oracle on flat boards. This exercises many splitter crossings and
// cycles without reusing trace(), advance(), heap ordering, or the production repeat guard.
test('300 generated splitter networks agree with an independent reachability oracle',()=>{
 let seed=61923;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let sample=0;sample<300;sample++){
  const l=board(),ps=[];for(let y=0;y<7;y++)for(let x=0;x<7;x++)if((x||y!==3)&&!l.targets.some(t=>t.x===x&&t.y===y)&&rand()<0.25)ps.push(piece(x,y,rand()<0.65?'SPLITTER':'MIRROR',rand()<0.5?'/':'\\'));
  const queue=[[0,3,'E']],seen=new Set(),hits=new Set();
  while(queue.length){const [x,y,d]=queue.shift(),k=[x,y,d].join();if(seen.has(k))continue;seen.add(k);const delta=Sim.DIRS[d],nx=x+delta.dx,ny=y+delta.dy;if(nx<0||nx>6||ny<0||ny>6||(nx===0&&ny===3))continue;
   l.targets.forEach((t,i)=>{if(t.x===nx&&t.y===ny)hits.add(i);});const p=ps.find(p=>p.x===nx&&p.y===ny);
   if(!p||p.type==='SPLITTER')queue.push([nx,ny,d]);if(p)queue.push([nx,ny,Pieces.TURN[p.orient][d]]);
  }
  const r=Sim.trace(l,ps);assert.deepEqual([...r.hits].sort(),[...hits].sort(),'network '+sample);assert.equal(r.allTargetsHit,hits.size===2);assert.ok(r.segments.length<Sim.stepCap(l));
 }
});
