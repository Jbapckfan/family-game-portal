import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../engine.mjs';

// Run the actual shared browser shell with the real game engine. Only browser
// facilities (DOM, timers and storage) are stand-ins; persistence is production code.
const shellURL = new URL('../shell.mjs', import.meta.url);
const source = readFileSync(shellURL, 'utf8').replace(/^export /gm, '');
const meaningGame = typeof engine.submitPair === 'function';
const slug = meaningGame ? 'counterpart' : 'shortlist';
const prefix = slug + ':v1:';
const fixture = meaningGame ? {
  id: 'fixture', title: 'Test board', difficulty: 'Tricky',
  rows: [
    {id:'r0',cue:['ACORN','OAK'],answer:['a','b'],relationship:'Earlier → later',explanation:'An acorn grows into an oak.'},
    {id:'r1',cue:['GLOVE','HAND'],answer:['c','d'],relationship:'Covering → protected thing',explanation:'A glove covers a hand.'},
    {id:'r2',cue:['COMPASS','DIRECTION'],answer:['e','f'],relationship:'Instrument → reading',explanation:'A compass indicates direction.'},
    {id:'r3',cue:['EMBER','FIRE'],answer:['g','h'],relationship:'Trace → source',explanation:'An ember is a trace of fire.'},
    {id:'r4',cue:['AUTHOR','NOVEL'],answer:['i','j'],relationship:'Creator → creation',explanation:'An author writes a novel.'},
  ],
  tiles: [['a','CATERPILLAR'],['b','BUTTERFLY'],['c','SHEATH'],['d','BLADE'],['e','BAROMETER'],['f','PRESSURE'],['g','ECHO'],['h','SOUND'],['i','COMPOSER'],['j','SYMPHONY']].map(([id,word])=>({id,word})),
} : {
  id:'fixture', title:'Test board', difficulty:'Sharp',
  words:'CRANE BRICK GHOST PLUMB FJORD WATCH SILKY DROWN MAPLE SCOUT FLING QUEST'.split(' '), answer:'MAPLE',
};
const puzzles = [fixture, {...fixture,id:'practice-two'}, {...fixture,id:'practice-three'}];
const record = state => meaningGame
  ? {status:state.status,attempts:state.attempts,hints:state.hintedRows.length}
  : {status:state.status,scans:state.scans.length,hints:state.hints};
const plain = value => JSON.parse(JSON.stringify(value));

function storage(entries=[]) {
  const values=new Map(entries);
  return { values, denyReads:false, denyWrites:false,
    getItem(key) { if(this.denyReads)throw new Error('Access denied'); return values.get(key)??null; },
    setItem(key,value) { if(this.denyWrites)throw new Error('Quota exceeded'); values.set(key,value); },
  };
}
function openShell(saved=storage()) {
  const nodes=new Map(); const windowEvents=new Map(); const timerCallbacks=new Map();
  let document; let timerId=0; let resets=0; let now=new Date('2026-10-20T12:00:00Z');
  function element() {
    const listeners=new Map(); const attributes=new Map();
    return {textContent:'',innerHTML:'',hidden:false,open:false,disabled:false,isConnected:true,className:'',dataset:{},
      classList:{toggle(){}},setAttribute(key,value){attributes.set(key,String(value));},getAttribute(key){return attributes.get(key);},
      querySelector(){return null;},getClientRects(){return [{}];},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100};},
      focus(){document.activeElement=this;},scrollIntoView(){},close(){this.open=false;},showModal(){this.open=true;},
      addEventListener(type,listener){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(listener);},
      emit(type,event={}){for(const listener of listeners.get(type)??[])listener({target:this,preventDefault(){},...event});},
      click(){this.emit('click');},
    };
  }
  document={activeElement:null,hidden:false,
    getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},
    querySelector(){return null;},addEventListener(){},
  };
  document.activeElement=element();
  document.getElementById('feedback').textContent='Think it through.';
  document.getElementById('board-note').textContent='Your daily puzzle.';
  const context=createContext({document,localStorage:saved,navigator:{},
    window:{addEventListener(type,fn){windowEvents.set(type,fn);}},location:{pathname:`/games/${slug}/`},
    matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>fn(),
    setTimeout(fn){const id=++timerId;timerCallbacks.set(id,fn);return id;},clearTimeout(id){timerCallbacks.delete(id);},setInterval:()=>1,
  });
  runInContext(source,context,{filename:shellURL.pathname});
  const createShell=runInContext('createShell',context);
  const timedEngine={...engine,getDaily:items=>engine.getDaily(items,now),getDateKey:()=>engine.getDateKey(now)};
  const shell=createShell({slug,name:meaningGame?'Counterpart':'Shortlist',puzzles,engine:timedEngine,
    render(){},reset(){resets++;},record,result:()=>'<h2 id="dialog-title">Result</h2>',statsExtra:()=>'',help:'<h2 id="dialog-title">Help</h2>',about:'A word game.',
    sibling:{slug:'companion',name:'Companion',url:'https://example.com/companion'},
  });
  shell.start();
  return {shell,saved,nodes,timerCallbacks,
    click(id){document.getElementById(id).click();},
    action(action){document.getElementById('dialog-content').emit('click',{target:{closest(selector){return selector==='[data-action]'?{dataset:{action}}:null;}}});},
    choosePractice(index){document.getElementById('dialog-content').emit('click',{target:{closest(selector){return selector==='[data-practice]'?{dataset:{practice:String(index)}}:null;}}});},
    storageEvent(key){windowEvents.get('storage')?.({key});},
    setNow(value){now=new Date(value);},
    get resets(){return resets;},
    stats(){return engine.getStats(JSON.parse(saved.values.get(prefix+'records')??'{}'),shell.daily.dateKey);},
  };
}
function advance(app) {
  const state=app.shell.game; const puzzle=app.shell.puzzle;
  const next=meaningGame
    ? engine.submitPair(puzzle,state,{row:state.placements.findIndex(x=>!x),tileIds:puzzle.rows[state.placements.findIndex(x=>!x)].answer}).state
    : engine.submitScan(puzzle,state,['CR','GH','BK'][state.scans.length]).state;
  app.shell.commit(next,{message:'A useful step.'});
}
function solved(puzzle=fixture) {
  let state=engine.createGame(puzzle);
  if(meaningGame)for(let row=0;row<puzzle.rows.length;row++)state=engine.submitPair(puzzle,state,{row,tileIds:puzzle.rows[row].answer}).state;
  else state=engine.submitPick(puzzle,state,puzzle.answer).state;
  return state;
}

test('denied reads and writes retain real progress when Daily is reselected',()=>{
  const saved=storage();saved.denyReads=true;saved.denyWrites=true;
  const app=openShell(saved);advance(app);
  const before=plain(app.shell.game);
  assert.equal(meaningGame?before.attempts:before.scans.length,1);
  app.click('daily-tab');
  assert.deepEqual(plain(app.shell.game),before);
  assert.equal(saved.values.size,0);
});

test('a quota failure preserves newer memory over an old save and later recovers',()=>{
  const app=openShell();advance(app);
  const dailyKey=prefix+'daily:'+app.shell.daily.dateKey;
  const firstSave=app.saved.values.get(dailyKey);
  app.saved.denyWrites=true;advance(app);const unsaved=plain(app.shell.game);
  assert.equal(meaningGame?unsaved.attempts:unsaved.scans.length,2);
  assert.equal(app.saved.values.get(dailyKey),firstSave);
  app.click('daily-tab');assert.deepEqual(plain(app.shell.game),unsaved);
  app.saved.denyWrites=false;advance(app);
  assert.equal(meaningGame?app.shell.game.attempts:app.shell.game.scans.length,3);
  assert.deepEqual(JSON.parse(app.saved.values.get(dailyKey)),plain(app.shell.game));
  assert.deepEqual(plain(openShell(app.saved).shell.game),plain(app.shell.game));
});

test('terminal saves repair missing, malformed and invalid daily result records',()=>{
  const finished=solved();
  const badRecord=JSON.stringify({'2026-10-20':meaningGame?{status:'won',attempts:0,hints:0}:{status:'won',scans:99,hints:0}});
  for(const raw of [undefined,'{bad json',badRecord]){
    const entries=[[prefix+'daily:2026-10-20',JSON.stringify(finished)]];
    if(raw!==undefined)entries.push([prefix+'records',raw]);
    const app=openShell(storage(entries));
    assert.equal(app.stats().played,1);assert.equal(app.stats().won,1);
    assert.deepEqual(JSON.parse(app.saved.values.get(prefix+'records'))['2026-10-20'],record(finished));
    app.click('daily-tab');app.click('stats-button');assert.equal(app.stats().played,1);
  }
});

test('a stale tab cannot replace the first terminal daily, even with unsaved memory',()=>{
  for(const status of ['won','revealed',...(meaningGame?[]:['lost'])]){
    const shared=storage();const first=openShell(shared);const stale=openShell(shared);
    // Leave a dirty, readable-stale state in the second tab before the first finishes.
    shared.denyWrites=true;advance(stale);shared.denyWrites=false;
    const state=status==='won'?solved():status==='revealed'?engine.revealGame(fixture,engine.createGame(fixture)):engine.submitPick(fixture,engine.createGame(fixture),'CRANE').state;
    first.shell.commit(state);
    const firstRecord=shared.values.get(prefix+'records');
    advance(stale);
    assert.deepEqual(plain(stale.shell.game),plain(state));
    assert.deepEqual(JSON.parse(shared.values.get(prefix+'daily:2026-10-20')),plain(state));
    assert.equal(shared.values.get(prefix+'records'),firstRecord);
  }
});

test('practice stays separate, reserves the unfinished daily and can restart',()=>{
  const app=openShell();app.click('practice-tab');app.choosePractice(0);
  assert.equal(app.shell.mode,'daily');
  app.choosePractice(1);assert.equal(app.shell.mode,'practice');assert.equal(app.shell.puzzle.id,'practice-two');
  advance(app);assert.ok(app.saved.values.has(prefix+'practice:practice-two'));
  assert.equal(app.stats().played,0);
  app.action('restart');assert.equal(meaningGame?app.shell.game.attempts:app.shell.game.scans.length,0);
  app.click('daily-tab');assert.equal(app.shell.mode,'daily');assert.equal(meaningGame?app.shell.game.attempts:app.shell.game.scans.length,0);
});

test('storage events synchronize progress and reset selection state',()=>{
  const shared=storage();const first=openShell(shared);const second=openShell(shared);
  advance(first);const resets=second.resets;
  second.storageEvent(prefix+'daily:2026-10-20');
  assert.deepEqual(plain(second.shell.game),plain(first.shell.game));
  assert.ok(second.resets>resets);
});

test('notices survive renders and a new board clears them',()=>{
  const app=openShell();app.shell.notice('Consider the direction.');app.shell.render();
  assert.equal(app.nodes.get('feedback').textContent,'Consider the direction.');
  app.click('daily-tab');assert.equal(app.nodes.get('feedback').textContent,'Think it through.');
});

test('a completed daily cannot be restarted through the options action',()=>{
  const app=openShell();app.shell.commit(solved());const finished=plain(app.shell.game);
  app.action('restart');assert.deepEqual(plain(app.shell.game),finished);assert.equal(app.stats().won,1);
});

test('switching boards cancels a pending result popup',()=>{
  const app=openShell();app.shell.commit(solved());
  app.choosePractice(1);
  for(const callback of app.timerCallbacks.values())callback();
  assert.equal(app.shell.mode,'practice');assert.equal(app.nodes.get('game-dialog').open,false);
});

test('practice reservation follows the new Central day before the daily tab is refreshed',()=>{
  const app=openShell();app.setNow('2026-10-21T05:00:00Z');
  app.click('practice-tab');app.choosePractice(1);
  assert.equal(app.shell.mode,'daily');assert.equal(app.shell.daily.dateKey,'2026-10-20');
  app.click('new-day-button');
  assert.equal(app.shell.daily.dateKey,'2026-10-21');assert.equal(app.shell.puzzle.id,'practice-two');
});


test('a delayed storage event cannot overwrite another window unfinished daily',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  advance(first);advance(first);
  const key=prefix+'daily:2026-10-20',saved=shared.values.get(key);
  advance(stale);
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
  assert.match(stale.nodes.get('feedback').textContent,/another (tab|window)|updated elsewhere/i);
  advance(stale);
  assert.deepEqual(JSON.parse(shared.values.get(key)),plain(stale.shell.game));
  assert.notEqual(shared.values.get(key),saved);
});

test('a stale finish cannot replace newer unfinished play or claim daily credit',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  advance(first);
  const key=prefix+'daily:2026-10-20',saved=shared.values.get(key);
  stale.shell.commit(solved());
  assert.equal(shared.values.get(key),saved);
  assert.equal(stale.shell.game.status,'playing');
  assert.equal(stale.stats().played,0);
});

test('dirty memory cannot overwrite a different unfinished save',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  shared.denyWrites=true;advance(stale);advance(stale);shared.denyWrites=false;
  advance(first);
  const key=prefix+'daily:2026-10-20',saved=shared.values.get(key);
  advance(stale);
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
});

test('a stale practice restart preserves the other window progress',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  first.choosePractice(1);stale.choosePractice(1);
  advance(first);advance(first);
  const key=prefix+'practice:practice-two',saved=shared.values.get(key);
  stale.action('restart');
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
  stale.action('restart');
  assert.deepEqual(plain(stale.shell.game),plain(engine.createGame(stale.shell.puzzle)));
  assert.equal(stale.stats().played,0);
});

test('blocked reads never overwrite an unreadable save and recovery saves memory',()=>{
  const app=openShell();advance(app);
  const key=prefix+'daily:2026-10-20',saved=app.saved.values.get(key);
  app.saved.denyReads=true;advance(app);
  assert.equal(app.saved.values.get(key),saved);
  const memory=plain(app.shell.game);
  assert.notDeepEqual(memory,JSON.parse(saved));
  app.saved.denyReads=false;advance(app);
  assert.deepEqual(JSON.parse(app.saved.values.get(key)),plain(app.shell.game));
  assert.notDeepEqual(plain(app.shell.game),memory);
});

test('recovered reads adopt a previously unreadable save before any write',()=>{
  const shared=storage(),first=openShell(shared);advance(first);
  const key=prefix+'daily:2026-10-20',saved=shared.values.get(key);
  shared.denyReads=true;const app=openShell(shared);advance(app);
  assert.equal(shared.values.get(key),saved);
  shared.denyReads=false;advance(app);
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(app.shell.game),plain(first.shell.game));
});


test('a finished daily in this window cannot be rolled back by an older unfinished save',()=>{
  const app=openShell();app.shell.commit(solved());
  const finished=plain(app.shell.game),key=prefix+'daily:2026-10-20';
  app.saved.values.set(key,JSON.stringify(engine.createGame(app.shell.puzzle)));
  app.shell.commit(engine.createGame(app.shell.puzzle));
  assert.deepEqual(plain(app.shell.game),finished);
  assert.deepEqual(JSON.parse(app.saved.values.get(key)),finished);
  assert.equal(app.stats().won,1);
});

test('a storage event adopts different unfinished progress over dirty memory',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  shared.denyWrites=true;advance(stale);advance(stale);shared.denyWrites=false;
  advance(first);
  stale.storageEvent(prefix+'daily:2026-10-20');
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
});


test('even a single failed pre-write read keeps that action in memory only',()=>{
  const app=openShell();advance(app);
  const key=prefix+'daily:2026-10-20',saved=app.saved.values.get(key);
  const get=app.saved.getItem;let failNext=true;
  app.saved.getItem=function(key){if(failNext){failNext=false;throw new Error('temporary read failure');}return get.call(this,key);};
  advance(app);
  assert.equal(app.saved.values.get(key),saved);
  assert.notDeepEqual(plain(app.shell.game),JSON.parse(saved));
  advance(app);
  assert.deepEqual(JSON.parse(app.saved.values.get(key)),plain(app.shell.game));
});


test('opening statistics cannot acknowledge an unseen newer daily save',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  advance(first);advance(first);
  const key=prefix+'daily:2026-10-20',saved=shared.values.get(key);
  stale.click('stats-button');stale.action('close');
  advance(stale);
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
});

test('opening the practice picker cannot acknowledge unseen active practice progress',()=>{
  const shared=storage(),first=openShell(shared),stale=openShell(shared);
  first.choosePractice(1);stale.choosePractice(1);
  advance(first);advance(first);
  const key=prefix+'practice:practice-two',saved=shared.values.get(key);
  stale.click('practice-tab');stale.action('close');
  advance(stale);
  assert.equal(shared.values.get(key),saved);
  assert.deepEqual(plain(stale.shell.game),plain(first.shell.game));
});
