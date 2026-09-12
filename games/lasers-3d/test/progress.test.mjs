import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),P=require('../src/progress.js'),sim=require('../src/sim.js'),levels=require('../src/levels.js');
const clone=x=>JSON.parse(JSON.stringify(x));
test('legacy earned stars follow explicit identity after reorder',()=>{
 const p=P.migrate({currentLevel:1,highestUnlocked:2,stars:{0:{solved:true,par:true,blind:true}},intros:{0:true}},levels);
 P.sync(p,levels);const reordered=[levels[1],levels[0],...levels.slice(2)];P.migrate(p,reordered);
 assert.equal(p.currentLevel,0);assert.equal(p.stars[1].par,true);assert.equal(p.intros[1],true);assert.equal(p.stars[0],undefined);
});
test('every shipped level has a unique stable ID',()=>assert.equal(new Set(levels.map(l=>l.id)).size,27));
test('fingerprint changes for fixed optics, openings, par, tray and dark rules',()=>{
 const l=levels[20],f=P.fingerprint(l);
 for(const mutate of [x=>x.fixed[0].orient='\\',x=>x.openings=[{x:1,y:1,levels:[0]}],x=>x.par++,x=>x.tray.push('MIRROR'),x=>x.dark=false]){const n=clone(l);mutate(n);assert.notEqual(P.fingerprint(n),f);}
 const cosmetic=clone(l);cosmetic.name='A new title';cosmetic.intro='New copy';assert.equal(P.fingerprint(cosmetic),f);
});
test('attempt validates legal placements and preserves assistance counters',()=>{
 const l=levels[6],a={f:P.fingerprint(l),placed:l.solution,fires:3,tiltsUsed:2,hintUsed:true};
 assert.deepEqual(P.attempt(a,l,sim).placed,l.solution);assert.equal(P.attempt(a,l,sim).hintUsed,true);
 for(const change of [x=>x.f='old',x=>x.placed.push(x.placed[0]),x=>x.placed[0].type='OTHER',x=>x.placed[0].type='constructor',x=>x.placed[0].x=NaN]){const bad=clone(a);change(bad);assert.equal(P.attempt(bad,l,sim),null);}
});
test('progress sync retains earned records for levels temporarily removed',()=>{const p=P.migrate({highestUnlocked:22,stars:{22:{solved:true}}},levels);P.sync(p,levels);P.migrate(p,levels.slice(0,20));P.sync(p,levels.slice(0,20));assert.equal(p.records.summit.stars.solved,true);});

test('a corrupt identity record is isolated without dropping healthy awards',()=>{const p=P.migrate({identitySchema:1,records:{'first-bounce':'broken','around-the-corner':{stars:{solved:true},unlocked:true}}},levels);P.sync(p,levels);assert.equal(p.stars[1].solved,true);assert.equal(typeof p.records['first-bounce'],'object');});
