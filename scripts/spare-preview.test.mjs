import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../games/deepseek-spare/engine.mjs';

test('harder preview provides an isolated, restorable board and can be solved in reversed pair order',()=>{
 assert.equal(typeof E.createPreview,'function','harder preview engine is not implemented yet');
 const p=E.PREVIEW;
 let s=E.createPreview();
 assert.equal(E.previewStatus(s),'playing');
 for(let i=0;i<8;i++)s=E.placePreview(s,i,i^1);
 const result=E.checkPreview(s);
 assert.equal(E.previewStatus(result.state),'won');
 assert.equal(result.state.checks[0].correct,4);
 assert.deepEqual(E.restorePreview(JSON.parse(JSON.stringify(result.state))),result.state);
 assert.equal(p.words.length,9);
});

test('moving a placed word swaps instead of duplicates; removing a word returns it to the bank',()=>{
 assert.equal(typeof E.placePreview,'function');
 let s=E.placePreview(E.createPreview(),0,1);
 s=E.placePreview(s,1,2);
 s=E.placePreview(s,0,2);
 assert.deepEqual(s.slots.slice(0,2),[2,1]);
 s=E.placePreview(s,0,null);
 assert.deepEqual(s.slots.slice(0,2),[null,1]);
 assert.equal(E.restorePreview({...s,slots:[1,1,null,null,null,null,null,null]}),null);
});

test('incomplete and equivalent repeated layouts cost no check; four wrong checks end the sample',()=>{
 assert.equal(typeof E.checkPreview,'function');
 let s=E.createPreview();
 assert.equal(E.checkPreview(s).state.checks.length,0);
 for(let i=0;i<8;i++)s=E.placePreview(s,i,i);
 s=E.placePreview(s,0,8);
 s=E.checkPreview(s).state;
 assert.equal(s.checks.length,1);
 assert.equal(s.checks[0].correct,3);
 s=E.placePreview(s,0,1);
 s=E.checkPreview(s).state;
 assert.equal(s.checks.length,1,'reversing a pair must not consume a check');
 for(const word of [2,4,6]){s=E.placePreview(s,0,word);s=E.checkPreview(s).state;}
 assert.equal(E.previewStatus(s),'lost');
 assert.deepEqual(E.placePreview(s,0,0),s);
 assert.equal(s.checks.length,4);
});

test('save validation recomputes feedback and rejects tampering and impossible history',()=>{
 assert.equal(typeof E.restorePreview,'function');
 let s=E.createPreview();
 for(let i=0;i<8;i++)s=E.placePreview(s,i,i);
 s=E.checkPreview(s).state;
 assert.equal(E.restorePreview({...s,checks:[{...s.checks[0],correct:0}]}),null);
 assert.equal(E.restorePreview({...s,checks:[...s.checks,...s.checks]}),null);
 assert.equal(E.restorePreview({...s,slots:[...s.slots].reverse()}),null);
 assert.equal(E.restorePreview({slots:Array(8).fill(null),checks:[],revealed:'no'}),null);
 assert.equal(E.restorePreview({...E.createPreview(),sampleId:'unknown'}),null);
});

test('reveal stays distinct from solving and shares contain no puzzle words or guesses',()=>{
 assert.equal(typeof E.previewShare,'function');
 const s=E.revealPreview(E.createPreview());
 assert.equal(E.previewStatus(s),'revealed');
 assert.equal(E.previewStatus(E.restorePreview(s)),'revealed');
 const text=E.previewShare(s);
 assert.match(text,/Preview/);
 assert.match(text,/Revealed/);
 for(const word of E.PREVIEW.words)assert.ok(!new RegExp(`\\b${word}\\b`,'i').test(text),word);
 assert.deepEqual(E.placePreview(s,0,0),s);
});

test('both defensible brightness pairings are accepted and the remaining spare follows the arrangement',()=>{
 let s=E.createPreview();for(let i=0;i<8;i++)s=E.placePreview(s,i,i);
 s=E.placePreview(s,4,8);
 assert.equal(E.previewStatus(E.checkPreview(s).state),'won');
 assert.equal(typeof E.clarifyPreview,'function');
 s=E.clarifyPreview(E.createPreview(),2);
 assert.deepEqual(s.clarified,[2]);
 assert.deepEqual(E.clarifyPreview(s,2),s);
 assert.equal(E.restorePreview({...s,clarified:[2,2]}),null);
 assert.match(E.previewShare(s),/1 context clue/);
});
