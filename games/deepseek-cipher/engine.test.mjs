import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {PUZZLES} from './puzzles.mjs';

test('all 30 Cipher phrases have an exact reversible derangement and solvable givens', () => {
  assert.equal(PUZZLES.length,30); assert.equal(new Set(PUZZLES.map(p=>p.phrase)).size,30);
  for(const p of PUZZLES){
    assert.match(p.phrase,/^[A-Z ,.!?]+$/);assert.ok(p.clue.length>10);
    assert.equal(new Set(Object.values(p.key)).size,26);
    for(const [plain,code] of Object.entries(p.key))assert.notEqual(plain,code);
    assert.equal([...p.phrase].map(c=>p.key[c]||c).join(''),p.encoded);
    let s=E.createState(p);assert.equal(E.getStatus(p,s),'playing');
    for(const code of E.cipherLetters(p))s=E.guess(p,s,code,E.solution(p)[code]).state;
    assert.equal(E.getStatus(p,s),'won');assert.deepEqual(E.restoreState(p,s),s);
  }
});
test('Cipher hints repair wrong assignments without duplicate plaintext letters',()=>{
  for(const p of PUZZLES){let s=E.createState(p);const code=E.cipherLetters(p).find(c=>!s.locked.includes(c));
    const wrong='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(c=>c!==E.solution(p)[code]&&!Object.values(s.guesses).includes(c));
    s=E.guess(p,s,code,wrong).state;
    for(let n=0;n<26&&E.getStatus(p,s)==='playing';n++)s=E.hint(p,s);
    assert.equal(E.getStatus(p,s),'won');assert.ok(s.hints>0);
    assert.equal(new Set(Object.values(s.guesses)).size,Object.values(s.guesses).length);
  }
});
test('Cipher rejects corrupted saves and cannot overwrite a given',()=>{
  const p=PUZZLES[0],s=E.createState(p),given=s.locked[0];
  assert.deepEqual(E.guess(p,s,given,'Z').state,s);
  assert.equal(E.restoreState(p,{...s,guesses:{...s.guesses,'<script>':'A'}}),null);
  assert.equal(E.restoreState(p,{...s,hints:-1}),null);
  assert.equal(E.restoreState(p,{...s,locked:['?']}),null);
  assert.equal(E.restoreState(p,{...s,revealed:true}),null);
  const mutable=E.cipherLetters(p).filter(c=>!s.locked.includes(c));
  assert.equal(E.restoreState(p,{...s,guesses:{...s.guesses,[mutable[0]]:'Z',[mutable[1]]:'Z'}}),null);
});
test('Cipher clear retains earned hints; reveal remains a reveal after restoration',()=>{
 const p=PUZZLES[1];let s=E.hint(p,E.createState(p));const c=E.clearGuesses(p,s);
 assert.equal(c.hints,s.hints);assert.deepEqual(c.locked,s.locked);
 const revealed=E.reveal(p,c);assert.equal(E.getStatus(p,revealed),'revealed');
 assert.equal(E.getStatus(p,E.restoreState(p,revealed)),'revealed');
 assert.deepEqual(E.hint(p,revealed),revealed);
});
