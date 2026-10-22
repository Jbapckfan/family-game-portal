import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLES as ALL_PUZZLES,FUSED} from './puzzles.mjs';
import {createState,restoreState,getStatus,analyze,chooseTile,submitPair,shuffle,hint,reveal,findMatchings} from './engine.mjs';
import {createSession} from '../deepseek-runtime/core.mjs';
// Preserve the original orientation regression cases; new bins are exhaustively
// validated separately by scripts/claude-expansion.test.mjs.
const PUZZLES=ALL_PUZZLES.slice(0,73);
const indices=Array.from({length:12},(_,i)=>i);
function pair(p,s,a,b){return submitPair(p,chooseTile(p,chooseTile(p,s,a),b)).state;}
test('all 73 bins have a complete matching; three original bins allow two orientations',()=>{
 assert.equal(PUZZLES.length,73);assert.equal(FUSED.size,3864);const multiple=[];
 for(const p of PUZZLES){assert.equal(p.parts.length,6);assert.ok(p.parts.every(pair=>pair.length===2&&pair.every(part=>/^[a-z]+$/.test(part))));const solutions=findMatchings(p,indices,3);assert.ok(solutions.length>0,p.id);if(solutions.length>1)multiple.push(p.id);for(const matching of solutions){let s=createState(p);for(const [a,b] of matching){s=pair(p,s,a,b);assert.ok(restoreState(p,s));}assert.equal(getStatus(p,s),'won',p.id);assert.equal(analyze(p,s).used.size,12);}}
 assert.deepEqual(multiple,['splice-9','splice-46','splice-49']);
});
test('the alternative LOOKOUT orientation is accepted without a mistake',()=>{
 const p=PUZZLES[8];let s=pair(p,createState(p),9,8);assert.equal(analyze(p,s).mistakes,0);assert.equal(analyze(p,s).pairs.length,1);assert.ok(restoreState(p,s));for(const [a,b] of findMatchings(p,indices.filter(i=>i!==8&&i!==9),1)[0])s=pair(p,s,a,b);assert.equal(getStatus(p,s),'won');
});
test('four distinct real-word splices that strand tiles lose; a repeated trap is free',()=>{
 let fixture=null;
 for(const p of PUZZLES){const tiles=p.parts.flat(),traps=[],seen=new Set();for(const i of indices)for(const j of indices){if(i===j||!FUSED.has(tiles[i]+tiles[j]))continue;const key=tiles[i]+'+'+tiles[j];if(seen.has(key))continue;if(!findMatchings(p,indices.filter(k=>k!==i&&k!==j),1).length){traps.push([i,j]);seen.add(key);}}if(traps.length>=4){fixture={p,traps};break;}}
 assert.ok(fixture);const {p,traps}=fixture;let s=pair(p,createState(p),...traps[0]);assert.equal(analyze(p,s).mistakes,1);s=pair(p,s,...traps[0]);assert.equal(analyze(p,s).mistakes,1);for(const trap of traps.slice(1,4))s=pair(p,s,...trap);assert.equal(getStatus(p,s),'lost');assert.ok(restoreState(p,s));
});
test('unlisted joins do not spend a mistake and used tile identities cannot be reused',()=>{
 const p=PUZZLES[0],tiles=p.parts.flat();let bad;
 for(const i of indices)for(const j of indices)if(i!==j&&!FUSED.has(tiles[i]+tiles[j]))bad=[i,j];
 let s=pair(p,createState(p),...bad);assert.equal(analyze(p,s).mistakes,0);s=pair(p,s,0,1);assert.deepEqual(chooseTile(p,s,0),s);assert.equal(restoreState(p,{...createState(p),selected:[0,0]}),null);assert.equal(restoreState(p,{...s,attempts:[...s.attempts,{tiles:[0,1]}]}),null);
});
test('hint indices survive shuffle and are cleared when their pair is locked',()=>{
 const p=PUZZLES[0];let s=hint(p,createState(p));const target=[...s.hintPair];assert.equal(hint(p,s),null);s=shuffle(p,s);s=restoreState(p,JSON.parse(JSON.stringify(s)));assert.deepEqual(s.hintPair,target);assert.deepEqual(s.selected,target);s=submitPair(p,s).state;assert.equal(s.hintPair,null);assert.equal(s.hinted.length,1);assert.equal(getStatus(p,reveal(p,s)),'revealed');
});
test('saved completion flags, invented pairs, and duplicate display indices cannot fake completion',()=>{
 const p=PUZZLES[0],s=createState(p);assert.equal(getStatus(p,restoreState(p,{...s,status:'won',done:[0,1,2,3,4,5]})),'playing');assert.equal(restoreState(p,{...s,attempts:[{tiles:[0,0]}]}),null);assert.equal(restoreState(p,{...s,order:Array(12).fill(0)}),null);assert.equal(restoreState(p,{...s,hinted:[[0,0]]}),null);
});
test('all 73 bins solve through the real shared runtime and reload one recorded daily win',()=>{
 for(const p of PUZZLES){const saved=new Map(),storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},config={id:'claude-splice',name:'Splice',puzzles:[p],createState,restoreState,getStatus,hint,reveal},options={storage,now:()=>new Date('2026-10-20T18:00:00Z')};const session=createSession(config,options);
  for(const [a,b] of findMatchings(p,indices,1)[0]){assert.equal(session.commit(chooseTile(p,session.state,a)),true);assert.equal(session.commit(chooseTile(p,session.state,b)),true);assert.equal(session.commit(submitPair(p,session.state).state),true);}
  assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.won,1);assert.equal(createSession(config,options).outcome,'won');
 }
});
