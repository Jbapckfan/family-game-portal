import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as E from './engine.mjs';
import {PUZZLES as LEGACY} from './puzzles.mjs';
import {createSession} from '../deepseek-runtime/core.mjs';
const old=LEGACY[1],exact={...old,id:'exact-fixture',captureRule:'exact',maxMoves:3};
const now=()=>new Date('2026-11-06T18:00:00Z');
const store=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const config=puzzles=>({...E,id:'qwen-territory-tactics',name:'Territory Tactics',puzzles});

test('exact rule rejects the reported four-for-three capture and offers Undo',()=>{
 const path=E.winningPaths(old)[0];
 assert.equal(E.simulate(old,path).captured,4);
 let s=E.createState(exact),last;for(const key of path){last=E.place(exact,s,key);s=last.state;}
 assert.equal(E.getStatus(exact,s),'playing');assert.match(last.message,/too many|over/i);assert.match(last.message,/undo/i);
 assert.deepEqual(E.restoreState(exact,s),s);assert.equal(E.restoreState(exact,{...s,revealed:true}),null);
 assert.equal(E.winningPaths(exact,s.moves).length,0);assert.equal(E.hint(exact,s).moves.length,s.moves.length-1);
 assert.equal(E.undo(exact,s).moves.length,s.moves.length-1);assert.equal(E.restart(exact,s).moves.length,0);
});

test('legacy four-for-three result still restores under its original identity',()=>{
 let s=E.createState(old);for(const key of E.winningPaths(old)[0])s=E.place(old,s,key).state;
 assert.equal(E.getStatus(old,s),'won');assert.deepEqual(E.restoreState(old,s),s);
 assert.equal(createHash('sha256').update(JSON.stringify(LEGACY.slice(0,30))).digest('hex'),'35b2c446c69f2b92ee53e7abc019fe27a30831b249dcb9f46416a942614d43ae');
});

for(const completed of [false,true])test(`state edition leaves legacy ${completed?'completed':'in-progress'} saves and records byte-for-byte intact`,()=>{
 const storage=store(),legacy=createSession(config(LEGACY),{storage,now});
 if(completed)legacy.hint();if(completed&&legacy.outcome==='playing')legacy.hint();
 else if(!completed){const legal=E.cells(legacy.puzzle).find(key=>E.place(legacy.puzzle,legacy.state,key).state.moves.length);legacy.commit(E.place(legacy.puzzle,legacy.state,legal).state);}
 legacy.practice();legacy.hint();legacy.daily();
 const previous=new Map(storage.data),editionConfig={...config([{...LEGACY[0],id:'territory-exact-test',captureRule:'exact'}]),stateEdition:'exact-v2'};
 const expanded=createSession(editionConfig,{storage,now});
 assert.equal(expanded.outcome,'playing');assert.equal(expanded.puzzle.id,'territory-exact-test');assert.deepEqual(expanded.state.moves,[]);
 assert.equal(expanded.progress().slug,'qwen-territory-tactics');
 for(const [k,v] of previous)assert.equal(storage.getItem(k),v,k);
 expanded.hint();expanded.hint();assert.equal(expanded.outcome,'won');assert.equal(expanded.stats.played,1);assert.equal(expanded.stats.won,1);
 for(const [k,v] of previous)assert.equal(storage.getItem(k),v,k);
 assert.equal(createSession(editionConfig,{storage,now}).outcome,'won');
 assert.deepEqual(createSession(config(LEGACY),{storage,now}).state,legacy.state);
});

test('edition results preserve earned historical wins and never double-credit a calendar date',()=>{
 const storage=store();storage.setItem('qwen-territory-tactics:v1:records',JSON.stringify({'2026-11-05':{status:'won'},'2026-11-06':{status:'won'}}));
 const g=createSession({...config([{...LEGACY[0],id:'territory-exact-test',captureRule:'exact'}]),stateEdition:'exact-v2'},{storage,now});
 assert.equal(g.outcome,'playing');assert.equal(g.stats.won,2);g.reveal();assert.equal(g.outcome,'revealed');
 assert.equal(g.stats.played,2);assert.equal(g.stats.won,2);assert.equal(g.stats.streak,2);
});
