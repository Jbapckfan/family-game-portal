import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,getStatus,submitWord,undo,restart,hint,reveal,restoreState,findRoute,oneLetterApart,shortestSteps,LEXICON} from './engine.mjs';
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
test('all prepared ladders have a verified shortest path in the expanded pinned lexicon',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.start+':'+p.target)).size,PUZZLES.length);
 assert.ok(LEXICON.length>=250);assert.ok(LEXICON.every(w=>/^[A-Z]{4}$/.test(w)));
 for(const p of PUZZLES){const route=findRoute(p.start,p.target);assert.ok(route,p.id);assert.equal(route.length-1,shortestSteps(p),p.id);assert.ok(shortestSteps(p)<=p.par,p.id);assert.ok(p.par>=3,p.id);let s=createState(p);for(const w of route.slice(1))s=submitWord(p,s,w).state;assert.equal(getStatus(p,s),'won',p.id);}
});

// The initial thirty records are an append-only compatibility contract.
test('deepseek-rung preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'6ce5312b5b141c3ee2938546f45c81a50c457ae5984f83ce3d4f5ec27110f3a7');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});

test('shortestSteps rejects disconnected dictionary words and preserves a genuine zero-step route',()=>{
 assert.ok(LEXICON.includes('ADZE'));assert.ok(LEXICON.includes('COLD'));
 assert.equal(findRoute('ADZE','COLD'),null);
 const disconnected={start:'ADZE',target:'COLD'};
 assert.throws(()=>shortestSteps(disconnected),RangeError);
 assert.throws(()=>shortestSteps(disconnected),RangeError,'repeated missing routes must not become zero');
 assert.equal(shortestSteps({start:'COLD',target:'COLD'}),0);
 assert.throws(()=>shortestSteps({start:'ZZZZ',target:'COLD'}),RangeError);
});
