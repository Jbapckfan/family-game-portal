import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../games/claude-tangle/engine.mjs';
import {PUZZLES as TANGLES} from '../games/claude-tangle/puzzles.mjs';
import {WORD_GAME_PATHS} from '../games/claude-tangle/vocabulary.mjs';
import {wordPartition} from '../games/claude-tangle/word-acceptance.mjs';
import * as K from '../games/claude-keystone/engine.mjs';
import {PUZZLES as KEYSTONES} from '../games/claude-keystone/puzzles.mjs';
import {WORD_GAME_ALTERNATIVES,WORD_GAME_WORDS,WORD_GAME_JOINS} from '../games/claude-keystone/vocabulary.mjs';
import * as S from '../games/claude-splice/engine.mjs';
import {PUZZLES as SPLICES} from '../games/claude-splice/puzzles.mjs';
import {WORD_GAME_JOINS as SPLICE_WORDS} from '../games/claude-splice/vocabulary.mjs';
const all=Array.from({length:12},(_,i)=>i),roundTrip=(E,p,s)=>E.restoreState(p,JSON.parse(JSON.stringify(s)));

test('Tangle wrong duplicate N in BRAIN is free, preserves selection and does not auto-pull',()=>{
 const p=TANGLES.find(p=>p.id==='tangle-001'),selected=[1,2,4,5,6],good=[1,2,4,5,16];
 assert.equal(selected.map(i=>p.s[i]).join(''),'brain');assert.equal(good.map(i=>p.s[i]).join(''),'brain');
 assert.equal(wordPartition(p,{pulls:[{target:0,indices:selected}],removed:selected}),null);
 assert.ok(wordPartition(p,{pulls:[{target:0,indices:good}],removed:good}));
 const s={...T.createExpandedState(),selected},result=T.submit(p,s);
 assert.equal(T.view(p,result.state).knots,0);assert.deepEqual(result.state,s);assert.match(result.message,/other copies/i);assert.match(result.message,/no knot/i);
 const fixed=T.submit(p,{...s,selected:good}).state;assert.equal(T.view(p,fixed).pulls.length,1);assert.equal(T.view(p,fixed).knots,0);assert.deepEqual(roundTrip(T,p,fixed),fixed);
});

test('Tangle preserves previously recorded duplicate-copy knot events and their assistance/history',()=>{
 const p=TANGLES.find(p=>p.id==='tangle-001'),s={events:[{type:'knot',indices:[1,2,4,5,6]}],selected:[],revealed:false,vocabulary:2};
 assert.deepEqual(roundTrip(T,p,s),s);assert.equal(T.view(p,s).knots,1);assert.deepEqual(T.view(p,s).tried,['brain']);
 const next=T.submit(p,{...s,selected:[1,2,4,5,16]}).state;assert.equal(T.view(p,next).knots,1);assert.equal(T.view(p,next).pulls.length,1);assert.deepEqual(roundTrip(T,p,next),next);
});

test('Tangle still charges a real trap when every copy of BRING strands the remaining words',()=>{
 const p=TANGLES.find(p=>p.id==='tangle-001');for(const indices of T.findWordPaths(p.s,'bring'))assert.equal(wordPartition(p,{pulls:[{target:0,indices}],removed:indices}),null);
 const s=T.submit(p,{...T.createExpandedState(),selected:[1,2,3,6,7]}).state;assert.equal(T.view(p,s).knots,1);assert.deepEqual(roundTrip(T,p,s),s);
});

test('Keystone v2 alternatives and fit feedback exactly follow its visible either-order rules on every arch',t=>{
 const seen=new Set(),directions=new Map();let accepted=0,directedDifferences=0;
 for(const p of KEYSTONES)for(const round of p.rounds){const key=K.roundKey(round);const directional=round.clues.map(c=>c.d+':'+c.w).sort().join('/');if(!directions.has(key))directions.set(key,new Set());directions.get(key).add(directional);if(seen.has(key))continue;seen.add(key);
  const first=round.clues[0].w,candidates=new Set([round.k]);for(const fused of WORD_GAME_JOINS){if(fused.startsWith(first))candidates.add(fused.slice(first.length));if(fused.endsWith(first))candidates.add(fused.slice(0,-first.length));}
  const expected=[...candidates].filter(word=>word===round.k||(WORD_GAME_WORDS.has(word)&&!round.clues.some(c=>c.w===word)&&round.clues.every(c=>WORD_GAME_JOINS.has(word+c.w)||WORD_GAME_JOINS.has(c.w+word)))).sort();
  assert.deepEqual(WORD_GAME_ALTERNATIVES[key],expected,key);
  directedDifferences+=expected.filter(word=>!round.clues.every(c=>WORD_GAME_JOINS.has(K.fused(word,c)))).length;
  for(const word of expected){assert.equal(K.acceptedAnswer(round,word,2),true);assert.equal(K.roundView(round,[{type:'guess',word}],2).status,'won');accepted++;}
  for(const word of candidates){if(!WORD_GAME_WORDS.has(word)||round.clues.some(c=>c.w===word)||expected.includes(word))continue;const view=K.roundView(round,[{type:'guess',word}],2);assert.ok(view);assert.deepEqual(view.guesses[0].fits,round.clues.slice(0,2).map(c=>WORD_GAME_JOINS.has(word+c.w)||WORD_GAME_JOINS.has(c.w+word)));}
 }
 assert.equal(seen.size,174);assert.ok(accepted>174);t.diagnostic(JSON.stringify({uniqueArches:seen.size,acceptedAnswers:accepted,directedDifferences,directionKeyCollisions:[...directions.values()].filter(values=>values.size>1).length}));
});

test('Splice clears any hint made non-viable by a disjoint accepted pair, preserving assistance on all reachable tile sets',t=>{
 let states=0,disjointTransitions=0,staleHintsCleared=0,staleExample=null;
 for(const p of SPLICES){const initial=S.createExpandedState(p),queue=[initial],seen=new Set();
  for(let at=0;at<queue.length;at++){const s=queue[at],used=S.analyze(p,s).used,mask=[...used].reduce((m,i)=>m|(1<<i),0);if(seen.has(mask))continue;seen.add(mask);states++;if(used.size===12)continue;
   const hinted=S.hint(p,s);assert.ok(hinted);const hint=hinted.hintPair,tiles=p.parts.flat(),remaining=all.filter(i=>!used.has(i));
   for(const a of remaining)for(const b of remaining){if(a===b||!SPLICE_WORDS.has(tiles[a]+tiles[b])||!S.findMatchings(S.puzzleForState(p,s),remaining.filter(i=>i!==a&&i!==b),1).length)continue;
    const next=S.submitPair(p,{...hinted,selected:[a,b]}).state;assert.deepEqual(roundTrip(S,p,next),next,p.id+' reachable hinted state must restore');assert.deepEqual(next.hinted,hinted.hinted,p.id+' assistance remains recorded');
    if(!hint.includes(a)&&!hint.includes(b)){disjointTransitions++;const afterUsed=S.analyze(p,next).used,stillViable=S.findMatchings(S.puzzleForState(p,next),all.filter(i=>!afterUsed.has(i)&&!hint.includes(i)),1).length>0;if(!stillViable){staleHintsCleared++;staleExample??={id:p.id,previousAttempts:s.attempts,pendingHint:hint,acceptedPair:[a,b]};assert.equal(next.hintPair,null,p.id);assert.ok(S.hint(p,next),p.id+' another hint remains available');}else assert.deepEqual(next.hintPair,hint,p.id);}
    queue.push({...next,hintPair:null,selected:[],hinted:[]});
   }
  }
 }
 assert.ok(states>=SPLICES.length);assert.ok(disjointTransitions>0);assert.ok(staleHintsCleared>0,'current broad vocabulary exercises actual stale hints');t.diagnostic(JSON.stringify({bins:SPLICES.length,reachableTileSets:states,disjointTransitions,staleHintsCleared,staleExample}));
});


test('Tangle first pulls classify all 200 current banks by whole-word placement viability',t=>{
 let paths=0,safe=0,freeCopies=0,traps=0;
 const bits=mask=>{let n=0;for(;mask;mask&=mask-1)n++;return n;};
 for(const p of TANGLES){
  const masks=WORD_GAME_PATHS[p.id],allMasks=new Set(masks),byLength=new Map(),byWord=new Map(),toIndices=mask=>[...p.s].flatMap((_,i)=>mask&(1<<i)?[i]:[]),full=(1<<p.s.length)-1;
  for(const mask of masks){const length=bits(mask),word=toIndices(mask).map(i=>p.s[i]).join('');if(!byLength.has(length))byLength.set(length,[]);byLength.get(length).push(mask);if(!byWord.has(word))byWord.set(word,[]);byWord.get(word).push(mask);}
  // Independent two-mask complement cover, not the production recursive helper.
  const canPlace=mask=>{const lengths=p.w.map(w=>w.length),slot=lengths.indexOf(bits(mask));if(slot<0)return false;lengths.splice(slot,1);const left=full^mask;return (byLength.get(lengths[0])||[]).some(next=>(next&left)===next&&allMasks.has(left^next)&&bits(left^next)===lengths[1]);};
  const viable=new Map(masks.map(mask=>[mask,canPlace(mask)]));
  for(const mask of masks){paths++;const selected=toIndices(mask),word=selected.map(i=>p.s[i]).join(''),s={...T.createExpandedState(),selected},result=T.submit(p,s),view=T.view(p,result.state),anyCopy=byWord.get(word).some(other=>viable.get(other));
   if(viable.get(mask)){safe++;assert.equal(view.pulls.length,1,p.id+':'+word);assert.equal(view.knots,0);}
   else if(anyCopy){freeCopies++;assert.deepEqual(result.state,s,p.id+':'+word);assert.match(result.message,/other copies/i);}
   else{traps++;assert.equal(view.knots,1,p.id+':'+word);assert.equal(view.pulls.length,0);}
   assert.deepEqual(roundTrip(T,p,result.state),result.state,p.id);
   // A pre-fix recorded knot on this exact unsafe path remains valid.
   if(!viable.get(mask)){const old={...T.createExpandedState(),events:[{type:'knot',indices:selected}]};assert.deepEqual(roundTrip(T,p,old),old,p.id+' old knot replay');}
  }
 }
 assert.ok(freeCopies>0);assert.equal(paths,safe+freeCopies+traps);t.diagnostic(JSON.stringify({banks:TANGLES.length,paths,safe,freeCopies,traps}));
});

test('the actual Tangle UI announces other copies without saving a knot or changing the selected beads',async()=>{
 const {createRequire}=await import('node:module'),{JSDOM}=createRequire(import.meta.url)('jsdom'),{centralDateKey,createSession}=await import('../games/deepseek-runtime/core.mjs');
 const descriptors=Object.fromEntries(['window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),p=TANGLES.find(p=>p.id==='tangle-001'),dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'https://review-fixes.test/games/claude-tangle/',pretendToBeVisual:true});
 try{
  dom.window.setInterval=()=>1;dom.window.clearInterval=()=>{};for(const[k,v]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator}))Object.defineProperty(globalThis,k,{configurable:true,value:v});
  const key='claude-tangle:v1:daily:'+centralDateKey(),$=q=>dom.window.document.querySelector(q);dom.window.localStorage.setItem(key,JSON.stringify({version:1,puzzleId:p.id,puzzleIndex:TANGLES.indexOf(p),state:T.createExpandedState()}));
  await import('../games/claude-tangle/app.mjs?review-fix=duplicates');for(const i of [1,2,4,5,6])$(`[data-bead="${i}"]`).click();$('#tangle-pull').click();
  assert.match($('#game-message').textContent,/other copies/i);let saved=JSON.parse(dom.window.localStorage.getItem(key)).state;assert.equal(T.view(p,saved).knots,0);assert.deepEqual(saved.selected,[1,2,4,5,6]);assert.deepEqual(saved.events,[]);
  $('[data-bead="6"]').click();$('[data-bead="16"]').click();$('#tangle-pull').click();saved=JSON.parse(dom.window.localStorage.getItem(key)).state;assert.equal(T.view(p,saved).knots,0);assert.equal(T.view(p,saved).pulls[0].word,'brain');
  const restored=createSession({...T,createState:T.createExpandedState,id:'claude-tangle',name:'Tangle',puzzles:TANGLES},{storage:dom.window.localStorage});assert.deepEqual(restored.state,saved);assert.equal(restored.puzzle.id,p.id);
 }finally{dom.window.close();for(const[k,d]of Object.entries(descriptors))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
});


test('Tangle free-copy feedback also works after a real GUEST pull without undoing any beads',()=>{
 const p=TANGLES.find(p=>p.id==='tangle-001'),first=[7,8,11,12,15];assert.equal(first.map(i=>p.s[i]).join(''),'guest');
 const prior=T.submit(p,{...T.createExpandedState(),selected:first}).state,s={...prior,selected:[1,2,4,5,6]},result=T.submit(p,s);assert.equal(T.view(p,s).pulls.length,1);
 assert.deepEqual(result.state,s);assert.match(result.message,/other copies/i);assert.equal(T.view(p,result.state).knots,0);assert.deepEqual(T.view(p,result.state).removed,first);assert.deepEqual(roundTrip(T,p,result.state),result.state);
});

test('Tangle cannot offer a free alternative that would reuse beads already pulled',()=>{
 const p=TANGLES.find(p=>p.id==='tangle-001'),first=[0,4,5,10,11,12,15],prior=T.submit(p,{...T.createExpandedState(),selected:first}).state;
 assert.equal(T.view(p,prior).pulls.length,1);const s={...prior,selected:[1,2,3,9,16]};assert.equal(T.selectedWord(p,s),'brian');
 const next=T.submit(p,s).state;assert.equal(T.view(p,next).knots,1);assert.equal(T.view(p,next).pulls.length,1);assert.deepEqual(roundTrip(T,p,next),next);
});
