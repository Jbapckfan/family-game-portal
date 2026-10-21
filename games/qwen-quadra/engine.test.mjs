import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,restoreState,getStatus,chooseTile,selectWord,submitWord,hint,reveal,analyze} from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';
function play(p,s,word){const selection=selectWord(p,s,word);assert.ok(selection.state,selection.message);return submitWord(p,selection.state).state;}
test('all 30 category boards use each of their 16 tiles exactly once',()=>{
 assert.equal(PUZZLES.length,30);assert.equal(new Set(PUZZLES.map(p=>p.id)).size,30);
 for(const p of PUZZLES){assert.equal(p.answers.length,4);assert.equal(new Set(p.answers).size,4);assert.ok(p.answers.every(w=>/^[A-Z]{4}$/.test(w)));assert.equal([...p.answers.join('')].sort().join(''),[...p.tiles].sort().join(''));let s=createState(p);for(const word of p.answers){s=play(p,s,word);s=restoreState(p,JSON.parse(JSON.stringify(s)));assert.ok(s,p.id);}assert.equal(getStatus(p,s),'won',p.id);assert.equal(analyze(p,s).used.size,16);}
});
test('the sixteen original Qwen boards and answers remain in order',()=>{
 assert.deepEqual(PUZZLES.slice(0,16).map(p=>p.answers.join(' ')),['RAIN SNOW WIND HAIL','CASH COIN NOTE BILL','BEAR LION WOLF DEER','BLUE CYAN GOLD TEAL','PEAR PLUM KIWI LIME','BOAT SHIP TAXI TRAM','HOOD DOOR SEAT TIRE','CHAT TEXT CALL MAIL','NOUN VERB CASE MOOD','KING ROOK PAWN MATE','OPAL RUBY JADE ONYX','JAZZ ROCK SOUL FUNK','MILE YARD FOOT INCH','BEER WINE COLA MILK','CUBE CONE OVAL STAR','CROW DOVE SWAN HAWK']);
});
test('repeated letters select separate indices and locked tiles cannot be reused',()=>{
 const p=PUZZLES[6];let s=selectWord(p,createState(p),'DOOR').state;assert.equal(new Set(s.selected).size,4);assert.equal(s.selected.filter(i=>p.tiles[i]==='O').length,2);s=submitWord(p,s).state;const used=[...analyze(p,s).used];assert.deepEqual(chooseTile(p,s,used[0]),s);s=play(p,s,'HOOD');assert.equal(analyze(p,s).used.size,8);
});
test('four incorrect submissions end the round, never mark it won',()=>{
 const p=PUZZLES[0];let s=createState(p);for(let n=0;n<4;n++)s=play(p,s,'NIAR');assert.equal(getStatus(p,s),'lost');assert.deepEqual(play(p,s,'RAIN'),s);assert.equal(analyze(p,s).mistakes,4);
});
test('hints are persistent assistance and revealing remains distinct from solving',()=>{
 const p=PUZZLES[0];let s=hint(p,createState(p));assert.equal(s.hinted.length,1);assert.equal(s.selected.length,4);assert.ok(restoreState(p,JSON.parse(JSON.stringify(s))));assert.equal(hint(p,s),null);s=submitWord(p,s).state;assert.ok(hint(p,s));assert.equal(getStatus(p,reveal(p,s)),'revealed');
});
test('restoration rejects duplicate, overlapping, terminal-after-terminal, and fabricated assignments',()=>{
 const p=PUZZLES[0],initial=createState(p),selected=selectWord(p,initial,'RAIN').state.selected;
 assert.equal(restoreState(p,{...initial,selected:[0,0]}),null);
 assert.equal(restoreState(p,{...initial,attempts:[{tiles:[0,0,1,2]}]}),null);
 assert.equal(restoreState(p,{...initial,attempts:[{tiles:selected},{tiles:selected}]}),null);
 assert.equal(getStatus(p,restoreState(p,{...initial,won:true,found:p.answers})),'playing');
 let solved=initial;for(const word of p.answers)solved=play(p,solved,word);assert.equal(restoreState(p,{...solved,attempts:[...solved.attempts,{tiles:selected}]}),null);
 assert.equal(restoreState(p,{...initial,hinted:['FAKE']}),null);
});
