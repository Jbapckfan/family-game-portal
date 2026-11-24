import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLES} from './puzzles.mjs';
import {createState,restoreState,getStatus,analyze,extraLetter,findRoute,chooseTile,selectWord,submitWord,undo,restart,hint,reveal,solutionPath} from './engine.mjs';
import {createSession} from '../deepseek-runtime/core.mjs';
function remainder(all,word){const letters=[...all];for(const ch of word){const i=letters.indexOf(ch);assert.ok(i>=0,word);letters.splice(i,1);}return letters;}
function play(p,s,word){const selection=selectWord(p,s,word);assert.ok(selection.state,selection.message);return submitWord(p,selection.state).state;}
test('all 128 seeds bloom and every supplied alive/dead entry has the correct graph classification',()=>{
 assert.equal(PUZZLES.length,128);let alive=0,dead=0;
 for(const p of PUZZLES){assert.equal(p.seed.length,3);assert.equal(p.pool.length,5);const path=findRoute(p);assert.equal(path.length,6,p.id);assert.equal(path.at(-1).length,8);for(let n=4;n<=8;n++){for(const word of p.levels[n].a){assert.equal(word.length,n);assert.ok(findRoute(p,word,remainder(p.seed+p.pool,word)),`${p.id} ${word}`);alive++;}for(const word of p.levels[n].d){assert.equal(word.length,n);assert.equal(findRoute(p,word,remainder(p.seed+p.pool,word)),null,`${p.id} ${word}`);dead++;}}}
 assert.equal(alive,1706);assert.equal(dead,399);
});
test('every seed solves through legal one-letter additions with strict multiset conservation',()=>{
 for(const p of PUZZLES){let s=createState(p);for(const word of findRoute(p).slice(1)){const before=analyze(p,s);assert.ok(extraLetter(before.stack.at(-1),word));s=play(p,s,word);const a=analyze(p,s);assert.equal(a.soilUsed.length,a.stack.length-1);assert.equal(new Set(a.soilUsed).size,a.soilUsed.length);assert.equal([...a.stack.at(-1),...[...p.pool].filter((_,i)=>!a.soilUsed.includes(i))].sort().join(''),[...p.seed,p.pool].join('').split('').sort().join(''));assert.ok(restoreState(p,s));}assert.equal(getStatus(p,s),'won',p.id);}
});
test('a legal dead end wilts once and preserves the prior word; Undo and Restart retain penalties',()=>{
 const p=PUZZLES[0];let s=play(p,createState(p),'earn');s=play(p,s,'crane');const before=analyze(p,s);s=play(p,s,'cornea');assert.equal(analyze(p,s).wilts,1);assert.deepEqual(analyze(p,s).stack,before.stack);assert.deepEqual(analyze(p,s).soilUsed,before.soilUsed);s=undo(p,s);assert.equal(analyze(p,s).stack.at(-1),'earn');assert.equal(analyze(p,s).wilts,1);s=restart(p,s);assert.deepEqual(analyze(p,s).stack,['ear']);assert.equal(analyze(p,s).wilts,1);assert.ok(restoreState(p,s));assert.equal(solutionPath(p,s).at(-1).length,8);
});
test('five dead-end wilts lose without an unchecked completion flag; a repeated dead end is free',()=>{
 const p=PUZZLES[0];let s=play(p,createState(p),'earn');s=play(p,s,'crane');s=play(p,s,'cornea');const once=s.events;s=play(p,s,'cornea');assert.equal(analyze(p,s).wilts,1);assert.deepEqual(s.events,once);
 const saved={events:[...once,...Array(4).fill({type:'word',word:'cornea'})],typed:[],revealed:false};assert.equal(getStatus(p,saved),'lost');assert.equal(analyze(p,saved).wilts,5);assert.ok(restoreState(p,saved));
 const q=PUZZLES.find(x=>x.id==='sprout-114');s=createState(q);for(const word of ['gist','hits','list','silt','slit'])s=play(q,s,word);assert.equal(getStatus(q,s),'lost');assert.equal(analyze(q,s).wilts,5);assert.ok(restoreState(q,s));assert.deepEqual(undo(q,s),s);
});
test('hints charge a wilt and always identify a soil letter with a full surviving continuation',()=>{
 for(const p of PUZZLES){let s=createState(p);for(const nextWord of findRoute(p).slice(1)){const assisted=hint(p,s),a=analyze(p,assisted),current=a.stack.at(-1);assert.equal(a.wilts,1);assert.equal(hint(p,assisted),null);assert.ok([...p.levels[current.length+1].a].some(word=>extraLetter(current,word)===a.hintLetter&&findRoute(p,word,remainder(p.seed+p.pool,word))),p.id);assert.ok(restoreState(p,assisted));s=play(p,s,nextWord);}}
});
test('tile input uses distinct identities and permits exactly one unused soil tile per turn',()=>{
 const p=PUZZLES[0];let s=createState(p);s=chooseTile(p,s,'word',0);assert.deepEqual(chooseTile(p,s,'word',0),s);s=chooseTile(p,s,'soil',0);assert.deepEqual(chooseTile(p,s,'soil',1),s);assert.equal(s.typed.length,2);assert.ok(restoreState(p,s));assert.equal(restoreState(p,{...s,typed:[{source:'word',index:0},{source:'word',index:0}]}),null);
});
test('restoration rejects impossible growth, spent soil reuse, post-terminal events, and false status fields',()=>{
 const p=PUZZLES[0],s=createState(p);assert.equal(getStatus(p,restoreState(p,{...s,status:'won',stack:['reaction'],soilUsed:Array(5).fill(true)})),'playing');assert.equal(restoreState(p,{...s,events:[{type:'word',word:'bear'}]}),null);const grown=play(p,s,'earn'),used=analyze(p,grown).soilUsed[0];assert.equal(restoreState(p,{...grown,typed:[{source:'soil',index:used}]}),null);assert.equal(getStatus(p,reveal(p,grown)),'revealed');assert.ok(restoreState(p,reveal(p,grown)));let won=s;for(const word of findRoute(p).slice(1))won=play(p,won,word);assert.equal(restoreState(p,{...won,events:[...won.events,{type:'restart'}]}),null);
});
test('all 128 seeds solve and reload through actual shared-session state validation and daily records',()=>{
 for(const p of PUZZLES){const saved=new Map(),storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},config={id:'claude-sprout',name:'Sprout',puzzles:[p],createState,restoreState,getStatus,hint,reveal},options={storage,now:()=>new Date('2026-10-20T18:00:00Z')};const session=createSession(config,options);
  for(const word of findRoute(p).slice(1)){assert.equal(session.commit(selectWord(p,session.state,word).state),true);assert.equal(session.commit(submitWord(p,session.state).state),true);}
  assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.won,1);assert.equal(createSession(config,options).outcome,'won');
 }
});
