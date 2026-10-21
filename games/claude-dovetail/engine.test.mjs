import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLES,COMMON,FUSED} from './puzzles.mjs';
import {createState,restoreState,getStatus,analyze,chooseRow,setTyped,submitWord,hint,reveal} from './engine.mjs';
import {createSession} from '../deepseek-runtime/core.mjs';
function solveRow(p,s,row,word=p.words[row]){return submitWord(p,chooseRow(p,s,row),word).state;}
test('all 77 original chains retain valid words and every neighboring compound',()=>{
 assert.equal(PUZZLES.length,77);assert.equal(COMMON.size,28743);assert.equal(FUSED.size,4447);
 assert.equal(PUZZLES.filter(p=>p.words.length===8).length,64);assert.equal(PUZZLES.filter(p=>p.words.length===7).length,13);
 for(const p of PUZZLES){assert.ok(p.words.every(w=>COMMON.has(w)),p.id);assert.ok(p.words.slice(1).every((w,i)=>FUSED.has(p.words[i]+w)),p.id);let s=createState(p);for(let row=1;row<p.words.length-1;row++){s=solveRow(p,s,row);assert.ok(restoreState(p,s),p.id);}assert.equal(getStatus(p,s),'won',p.id);}
});
test('an alternative is accepted only after both neighbors establish legal joins',()=>{
 const p=PUZZLES[3];assert.deepEqual(p.words.slice(5),['walk','way','ward']);
 let s=solveRow(p,createState(p),6,'out');assert.equal(analyze(p,s).solved[6],false);assert.equal(analyze(p,s).misses,1);
 s=solveRow(p,s,5);s=solveRow(p,s,6,'out');assert.equal(analyze(p,s).words[6],'out');assert.equal(analyze(p,s).solved[6],true);
 for(let row=1;row<5;row++)s=solveRow(p,s,row);assert.equal(getStatus(p,s),'won');assert.ok(analyze(p,s).words.slice(1).every((w,i)=>FUSED.has(analyze(p,s).words[i]+w)));
});
test('six distinct misses end the chain; repeats and unlisted words are free',()=>{
 const p=PUZZLES[0],wrong=[...COMMON].filter(w=>w.length===3&&w!==p.words[1]).slice(0,6);let s=createState(p);
 s=submitWord(p,s,'qzx').state;assert.equal(analyze(p,s).misses,0);
 s=submitWord(p,s,wrong[0]).state;assert.equal(analyze(p,s).misses,1);s=submitWord(p,s,wrong[0]).state;assert.equal(analyze(p,s).misses,1);
 for(const word of wrong.slice(1))s=submitWord(p,s,word).state;assert.equal(getStatus(p,s),'lost');assert.equal(s.active,-1);assert.ok(restoreState(p,s));
});
test('each letter hint costs one miss, protects its prefix, and can consume the final chance',()=>{
 const p=PUZZLES[0];let s=hint(p,createState(p));assert.equal(analyze(p,s).misses,1);assert.equal(s.typed,'g');assert.equal(setTyped(p,s,'a').state,null);assert.ok(setTyped(p,s,'gu').state);assert.ok(restoreState(p,s));
 s=hint(p,s);assert.equal(hint(p,s),null);s=chooseRow(p,s,2);s=hint(p,hint(p,hint(p,s)));s=chooseRow(p,s,3);s=hint(p,s);assert.equal(analyze(p,s).misses,6);assert.equal(getStatus(p,s),'lost');
});
test('restoration derives solved rows and rejects invalid or post-terminal evidence',()=>{
 const p=PUZZLES[0],s=createState(p);assert.equal(getStatus(p,restoreState(p,{...s,solved:Array(8).fill(true),status:'won',words:p.words})),'playing');
 assert.equal(restoreState(p,{...s,events:[{type:'guess',row:1,word:'qzx'}]}),null);
 assert.equal(restoreState(p,{...s,events:[{type:'guess',row:1,word:'gun'},{type:'guess',row:1,word:'gun'}]}),null);
 assert.equal(restoreState(p,{...hint(p,s),typed:'xxx'}),null);
 assert.equal(getStatus(p,reveal(p,s)),'revealed');assert.ok(restoreState(p,reveal(p,s)));
 let won=s;for(let row=1;row<7;row++)won=solveRow(p,won,row);assert.equal(restoreState(p,{...won,events:[...won.events,{type:'hint',row:1}]}),null);
});
test('all 77 chains survive real shared-session commits, daily recording, and reload',()=>{
 for(const p of PUZZLES){const saved=new Map(),storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},config={id:'claude-dovetail',name:'Dovetail',puzzles:[p],createState,restoreState,getStatus,hint,reveal},options={storage,now:()=>new Date('2026-10-20T18:00:00Z')};const session=createSession(config,options);
  for(let row=1;row<p.words.length-1;row++){assert.equal(session.commit(chooseRow(p,session.state,row)),true);assert.equal(session.commit(submitWord(p,session.state,p.words[row]).state),true);}
  assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.won,1);assert.equal(createSession(config,options).outcome,'won');
 }
});
