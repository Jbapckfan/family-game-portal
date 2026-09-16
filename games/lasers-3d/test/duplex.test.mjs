import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {solve,proveMinimal} from '../solver.mjs';
const require=createRequire(import.meta.url),Sim=require('../src/sim.js'),levels=require('../src/levels.js'),P=require('../src/progress.js');
const chapter=levels.filter(l=>l.duplex),copy=x=>JSON.parse(JSON.stringify(x));
for(const raw of chapter)test(raw.name+': crossings, legal solution, minimum par and required openings',()=>{
 const L=Sim.parseLevel(raw),placed=[];
 for(const p of raw.solution){assert.ok(Sim.canPlace(L,placed,p.x,p.y,p.side));placed.push(p);}
 const r=Sim.trace(L,placed);assert.ok(r.allTargetsHit);assert.ok(r.visited.some(v=>v.z<0));assert.ok(r.events.some(e=>e.kind==='crossing'));
 assert.ok(proveMinimal(raw,raw.par,{maxNodes:200000}).proven);
 const sealed=copy(raw);sealed.duplex.holes=[{x:0,y:10,w:2,d:2}];
 const solutions=solve(raw,{maxSolutions:Infinity,maxNodes:200000});assert.equal(solutions.truncated,false);assert.ok(solutions.solutions.every(p=>Sim.trace(raw,p).events.some(e=>e.kind==='crossing')));
 assert.equal(Sim.trace(sealed,raw.solution).allTargetsHit,false);
 assert.equal(P.fingerprint(raw),P.fingerprint(L));
 const saved={f:P.fingerprint(L),placed:raw.solution,camera:{layer:'below'}};
 assert.deepEqual(P.attempt(saved,L,Sim).placed,raw.solution);
});
test('round trip actually crosses downward and upward; split reaches both sides',()=>{
 assert.deepEqual(Sim.trace(chapter[1],chapter[1].solution).events.filter(e=>e.kind==='crossing').map(e=>e.side),['below','above']);
 const r=Sim.trace(chapter[3],chapter[3].solution);assert.ok(r.branched);assert.equal(r.hits.length,2);
});
test('same square supports independent pieces on each deck',()=>{
 const L=Sim.parseLevel(chapter[0]),upper={x:3,y:5,type:'MIRROR',orient:'/'},lower={...upper,side:'below',type:'DIP'};
 assert.ok(Sim.canPlace(L,[upper],3,5,'below'));assert.ok(Sim.canPlace(L,[lower],3,5));
 assert.equal(Sim.canPlace(L,[lower],3,5,'below'),false);assert.ok(Sim.trace(L,[upper,lower]).allTargetsHit);
 assert.equal(Sim.heightAt(L,3,5),0);assert.equal(Sim.heightAt(L,3,5,'below'),-2);
 const p={f:P.fingerprint(L),placed:[upper,lower]};const withTray={...chapter[0],tray:['MIRROR','DIP']};p.f=P.fingerprint(withTray);assert.equal(P.attempt(p,withTray,Sim).placed.length,2);
});
test('holes remove the placement surface from both faces',()=>{
 const L=Sim.parseLevel(chapter[0]);assert.equal(Sim.canPlace(L,[],3,3),false);assert.equal(Sim.canPlace(L,[],3,3,'below'),false);
 assert.equal(Sim.canPlace(levels[0],[],2,2,'below'),false);assert.equal(Sim.canPlace(L,[],2,2,'other'),false);
});
test('board blocks a crossing at the real half-step intersection, not just a destination cell',()=>{
 const raw=copy(chapter[0]);raw.duplex.holes=[{x:3,y:4,w:2,d:1}]; // end cell is open, crossing lies on its solid edge
 const r=Sim.trace(raw,raw.solution);assert.equal(r.end,'blocked-board');assert.equal(r.endPoint.z,-0.5);assert.equal(r.endPoint.y,3.5);
});
test('parser rejects floating actors, overlapping apertures, invalid sides and terrain inside an aperture',()=>{
 for(const mutate of [l=>l.emitter.side='elsewhere',l=>l.duplex.lower[0]='444444444444',l=>l.duplex.lower[3]='000100000000',l=>l.targets.push({x:3,y:3,side:'below'}),l=>l.duplex.holes.push(l.duplex.holes[0]),l=>l.targets.push({x:3,y:3}),l=>l.duplex.holes[0].w=99]){
  const l=copy(chapter[0]);mutate(l);assert.throws(()=>Sim.parseLevel(l));
 }
 const l=copy(levels[0]);l.emitter.side='below';assert.throws(()=>Sim.parseLevel(l));
});
test('save fingerprints include lower terrain and hole locations, and attempts reject stale deck geometry',()=>{
 const l=copy(chapter[0]),f=P.fingerprint(l);l.duplex.lower[0]='100000000000';assert.notEqual(P.fingerprint(l),f);
 const a={f,placed:chapter[0].solution};assert.equal(P.attempt(a,l,Sim),null);
 const moved=copy(chapter[0]);moved.duplex.holes[0].x++;assert.notEqual(P.fingerprint(moved),f);
});

// Reflect the entire existing campaign through the shared floor. This catches pitch,
// blockers, arches, windows, FLOOR plates, splitters and underside emitters together.
for(const raw of levels.filter(l=>!l.duplex))test(raw.name+': same puzzle works upside down',()=>{
 const w=raw.size.w,d=raw.size.d,zero='0'.repeat(w),below=p=>({...p,side:'below'});
 const mirrored={...raw,size:{w,d:d+1},terrain:Array(d+1).fill(zero),openings:[],
  duplex:{lower:raw.terrain.concat(zero),openings:raw.openings||[],holes:[{x:0,y:d,w:1,d:1}]},
  emitter:below(raw.emitter),targets:raw.targets.map(below),fixed:(raw.fixed||[]).map(below)};
 const a=Sim.trace(raw,raw.solution),b=Sim.trace(mirrored,raw.solution.map(below));
 assert.ok(b.allTargetsHit);assert.deepEqual(b.hits,a.hits);
 assert.deepEqual(b.visited.filter(v=>v.y<d).map(v=>({...v,z:-v.z-1,v:-v.v||0})),a.visited);
});
test('underside columns are solid toward the shared floor and open beyond their tips',()=>{
 const blank=()=>Array(5).fill('00000');
 const raw={size:{w:5,d:5},terrain:blank(),duplex:{lower:blank(),holes:[{x:0,y:4,w:1,d:1}]},emitter:{x:0,y:1,dir:'E',side:'below'},targets:[{x:4,y:1,side:'below'}],tray:[],par:0};
 raw.duplex.lower[1]='00300';assert.equal(Sim.trace(raw,[]).end,'blocked');
 raw.duplex.openings=[{x:2,y:1,levels:[0]}];assert.ok(Sim.trace(raw,[]).allTargetsHit);
});
test('floor blocks an upward crossing from the underside at the same physical plane',()=>{
 const raw=copy(chapter[1]);raw.duplex.holes=raw.duplex.holes.slice(0,1);
 const r=Sim.trace(raw,raw.solution);assert.equal(r.end,'blocked-board');assert.equal(r.endPoint.z,-0.5);assert.equal(r.endPoint.x,7);
 assert.deepEqual(r.events.filter(e=>e.kind==='crossing').map(e=>e.side),['below']);
});
