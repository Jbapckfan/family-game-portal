import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,getStatus,submitWord,undo,restart,hint,reveal,restoreState,findRoute,oneLetterApart,LEXICON} from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
const sample={id:'test',start:'COLD',target:'WARM',par:4};
test('a complete accepted ladder solves Rung',()=>{
 let state=createState(sample);for(const w of ['CORD','CARD','WARD','WARM'])state=submitWord(sample,state,w).state;
 assert.equal(getStatus(sample,state),'won');assert.equal(state.chain.length-1,4);
});
test('only one changed letter and accepted four-letter words may advance',()=>{
 const state=createState(sample);
 for(const w of ['WARM','COLDS','ZZZZ','COLD'])assert.deepEqual(submitWord(sample,state,w).state,state);
 assert.equal(submitWord(sample,state,' cord ').state.chain.at(-1),'CORD');
});
test('undo and restart recover from a legal detour without spending a turn limit',()=>{
 let state=submitWord(sample,createState(sample),'CORD').state;
 state=submitWord(sample,state,'CORN').state;state=undo(sample,state);assert.deepEqual(state.chain,['COLD','CORD']);
 state=restart(sample,state);assert.deepEqual(state.chain,['COLD']);
});
test('route hint supplies a valid next rung and survives a save',()=>{
 const state=hint(sample,createState(sample));assert.ok(oneLetterApart(sample.start,state.hintWord));assert.ok(LEXICON.includes(state.hintWord));
 assert.deepEqual(restoreState(sample,JSON.parse(JSON.stringify(state))),state);assert.equal(hint(sample,state),null);
});
test('reveal keeps its own result and never turns into a normal win',()=>{
 const state=reveal(sample,createState(sample));assert.equal(getStatus(sample,state),'revealed');
 assert.equal(getStatus(sample,submitWord(sample,state,'CORD').state),'revealed');
});
test('restoration revalidates every actual edge and does not trust a claimed win',()=>{
 const initial=createState(sample);assert.equal(restoreState(sample,{...initial,chain:['COLD','WARM']}),null);
 assert.equal(restoreState(sample,{...initial,chain:['CORD','CARD']}),null);
 assert.equal(getStatus(sample,restoreState(sample,{...initial,status:'won'})),'playing');
});
test('all thirty ladders have a verified shortest path in the real curated lexicon',()=>{
 assert.equal(PUZZLES.length,30);assert.equal(new Set(PUZZLES.map(p=>p.start+':'+p.target)).size,30);
 assert.ok(LEXICON.length>=250);assert.ok(LEXICON.every(w=>/^[A-Z]{4}$/.test(w)));
 for(const p of PUZZLES){const route=findRoute(p.start,p.target);assert.ok(route,p.id);assert.equal(route.length-1,p.par,p.id);assert.ok(p.par>=3,p.id);let s=createState(p);for(const w of route.slice(1))s=submitWord(p,s,w).state;assert.equal(getStatus(p,s),'won',p.id);}
});
