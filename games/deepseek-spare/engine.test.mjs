import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,getStatus,chooseTile,submitPair,shuffle,hint,reveal,restoreState} from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
const sample={id:'test',prompt:'Find pairs with opposite meanings.',pairs:[['HOT','COLD'],['UP','DOWN'],['BIG','SMALL'],['WET','DRY']],spare:'SPOON'};
function pair(p,state,a,b){state=chooseTile(p,state,a);state=chooseTile(p,state,b);return submitPair(p,state).state;}
test('four correct pairs leave exactly one spare and solve the round',()=>{
 let state=createState(sample);for(let i=0;i<4;i++)state=pair(sample,state,2*i,2*i+1);
 assert.equal(getStatus(sample,state),'won');assert.equal(state.solved.length,4);
});
test('three distinct mistakes lose; repeating a failed pair does not consume another strike',()=>{
 let state=pair(sample,createState(sample),0,2);assert.equal(state.mistakes.length,1);
 state=pair(sample,state,0,2);assert.equal(state.mistakes.length,1);
 state=pair(sample,state,0,4);state=pair(sample,state,0,6);
 assert.equal(getStatus(sample,state),'lost');assert.deepEqual(pair(sample,state,0,1),state);
});
test('a pair hint survives shuffle and restoration until the pair is solved',()=>{
 let state=hint(sample,createState(sample));const first=state.hintPair;
 assert.equal(typeof first,'number');state=shuffle(sample,state);
 state=restoreState(sample,JSON.parse(JSON.stringify(state)));assert.equal(state.hintPair,first);
 assert.equal(hint(sample,state),null);state=pair(sample,state,first*2,first*2+1);assert.equal(state.hintPair,null);
});
test('locked tiles cannot be reused and clear removes only current selection',()=>{
 let state=pair(sample,createState(sample),0,1);assert.deepEqual(chooseTile(sample,state,0),state);
 state=chooseTile(sample,state,2);assert.equal(state.selected.length,1);
});
test('reveal is distinct from a win and corrupt saves are refused',()=>{
 const initial=createState(sample);assert.equal(getStatus(sample,reveal(sample,initial)),'revealed');
 assert.equal(restoreState(sample,{...initial,solved:[0,0,1,2]}),null);
 assert.equal(restoreState(sample,{...initial,order:[0,1]}),null);
 assert.equal(restoreState(sample,{...initial,mistakes:['0:1']}),null);
 assert.equal(getStatus(sample,restoreState(sample,{...initial,status:'won'})),'playing');
});
test('All prepared authored boards have four disjoint pairs and one distinct spare',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
 for(const p of PUZZLES){assert.equal(p.pairs.length,4);const words=[...p.pairs.flat(),p.spare];assert.equal(words.length,9);assert.equal(new Set(words).size,9,p.id);assert.ok(words.every(w=>/^[A-Z]+$/.test(w)));let s=createState(p);for(let i=0;i<4;i++)s=pair(p,s,i*2,i*2+1);assert.equal(getStatus(p,s),'won',p.id);}
});

// The initial thirty records are an append-only compatibility contract.
test('deepseek-spare preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'989b40acb0a5d95732ddce10019710ce3a831167f1e6d1000b2022be0221d80a');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
