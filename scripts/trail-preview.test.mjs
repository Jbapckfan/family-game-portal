import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../games/deepseek-trail/engine.mjs';

test('harder Trail has seven decoys, one complete route and credible false starts',()=>{
 assert.equal(typeof E.createPreview,'function');
 const p=E.PREVIEW,counts=Array(9).fill(0),solutions=[];
 // Independent enumeration: do not use engine adjacency or the authored solution.
 const near=(a,b)=>a!==b&&Math.abs(a%4-b%4)<=1&&Math.abs(Math.floor(a/4)-Math.floor(b/4))<=1;
 function walk(path){
  counts[path.length-1]++;
  if(path.length===9){solutions.push(path);return;}
  for(let i=0;i<16;i++)if(!path.includes(i)&&near(path.at(-1),i)&&p.grid[i]===p.answer[path.length])walk([...path,i]);
 }
 p.grid.forEach((c,i)=>{if(c===p.answer[0])walk([i]);});
 assert.equal(p.grid.length-p.answer.length,7);
 assert.deepEqual(solutions,[p.path]);
 assert.ok(counts.slice(1,5).every(n=>n>=3),'multiple plausible opening routes must survive to five letters');
 assert.equal(E.wordAt(p,p.path),p.answer);
});

test('four-column path rejects row wrap, jumps, reuse and excess letters; backtracking works',()=>{
 assert.equal(E.validPreviewPath([3,4]),false);
 assert.equal(E.validPreviewPath([0,5,0]),false);
 assert.equal(E.validPreviewPath([0,15]),false);
 assert.equal(E.validPreviewPath([0,1,2,3,7,6,5,4,8,9]),false);
 let s=E.createPreview();
 for(const i of [0,1,2,3,7])s=E.selectPreview(s,i).state;
 assert.equal(E.selectPreview(s,9).state,s);
 s=E.selectPreview(s,1).state;
 assert.deepEqual(s.path,[0,1]);
 assert.deepEqual(E.undoPreview(s).path,[0]);
 assert.deepEqual(E.clearPreview(s).path,[]);
 for(const i of [-1,16,1.5,NaN])assert.equal(E.selectPreview(s,i).state,s);
});

test('wrong checks are retryable, repeated guesses cost nothing and every legal answer path is accepted',()=>{
 let s=E.createPreview();
 assert.equal(E.checkPreview(s).state,s);
 for(const i of [0,1,2,3,7,6,5,4,8])s=E.selectPreview(s,i).state;
 assert.equal(E.selectPreview(s,9).state,s);
 s=E.checkPreview(s).state;
 assert.equal(E.previewStatus(s),'playing');
 assert.equal(s.attempts.length,1);
 assert.equal(E.checkPreview(s).state,s);
 s=E.clearPreview(s);
 for(const i of E.PREVIEW.path)s=E.selectPreview(s,i).state;
 s=E.checkPreview(s).state;
 assert.equal(E.previewStatus(s),'won');
 assert.equal(s.attempts.length,2);
 assert.deepEqual(E.restorePreview(JSON.parse(JSON.stringify(s))),s);
 assert.equal(E.clearPreview(s),s);
 assert.equal(E.undoPreview(s),s);
 assert.equal(E.selectPreview(s,0).state,s);
});

test('optional definition is counted once, reveal stays distinct and sharing is spoiler-free',()=>{
 let s=E.definePreview(E.createPreview());
 assert.equal(s.definitionShown,true);
 assert.equal(E.definePreview(s),s);
 s=E.revealPreview(s);
 assert.equal(E.previewStatus(s),'revealed');
 assert.equal(E.previewStatus(E.restorePreview(s)),'revealed');
 assert.equal(E.checkPreview(s).state,s);
 const share=E.previewShare(s);
 assert.match(share,/Preview 01/);
 assert.match(share,/Revealed/);
 assert.match(share,/Definition used/);
 assert.ok(!share.includes(E.PREVIEW.answer));
 assert.ok(!share.includes(E.PREVIEW.clue));
});

test('restoring rejects malformed paths, duplicate guesses and impossible completion histories',()=>{
 const fresh=E.createPreview(),wrong=[0,1,2,3,7,6,5,4,8],correct=[...E.PREVIEW.path];
 for(const raw of [
  null,{}, {...fresh,sampleId:'old'}, {...fresh,path:[3,4]}, {...fresh,path:[0,1,0]},
  {...fresh,definitionShown:1}, {...fresh,revealed:'yes'}, {...fresh,attempts:[[]]},
  {...fresh,attempts:[wrong,wrong]}, {...fresh,attempts:[correct],path:[]},
  {...fresh,attempts:[correct,wrong]}, {...fresh,revealed:true},
  {...fresh,attempts:[correct],path:correct,revealed:true}
 ])assert.equal(E.restorePreview(raw),null,JSON.stringify(raw));
 const played={...fresh,path:[0,1],attempts:[wrong],definitionShown:true};
 assert.deepEqual(E.restorePreview(played),played);
});

test('a full wrong-guess history never locks out a correct submission or its saved win',()=>{
 const attempts=[],words=new Set();
 function walk(path){
  if(attempts.length===1000)return;
  if(path.length===9){
   const word=E.wordAt(E.PREVIEW,path);
   if(word!==E.PREVIEW.answer&&!words.has(word)){words.add(word);attempts.push(path);}
   return;
  }
  for(let i=0;i<16;i++)if(!path.includes(i)&&(!path.length||E.previewAdjacent(path.at(-1),i)))walk([...path,i]);
 }
 walk([]);
 assert.equal(attempts.length,1000);
 let s={...E.createPreview(),attempts,path:[...E.PREVIEW.path]};
 assert.ok(E.restorePreview(s));
 s=E.checkPreview(s).state;
 assert.equal(E.previewStatus(s),'won');
 assert.equal(s.attempts.length,1001);
 assert.deepEqual(E.restorePreview(s),s);
});
