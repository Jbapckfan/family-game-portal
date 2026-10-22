import {createHash} from 'node:crypto';
import test from 'node:test';import assert from 'node:assert/strict';import * as E from './engine.mjs';import {PUZZLES} from './puzzles.mjs';
test('Expanded Prism rules provide three future states with four unique choices each',()=>{assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>JSON.stringify(p.cycles))).size,PUZZLES.length);for(const p of PUZZLES){let s=E.createState(p);for(let step=0;step<3;step++){const choices=E.choicesAt(p,step),answer=E.tokenAt(p,5+step);assert.equal(choices.length,4);assert.equal(new Set(choices.map(E.tokenKey)).size,4);const correct=choices.findIndex(x=>E.tokenKey(x)===E.tokenKey(answer));assert.ok(correct>=0);s=E.choose(p,s,correct).state;assert.ok(E.restoreState(p,s));}assert.equal(E.getStatus(p,s),'won');assert.ok(E.explanation(p).length>30);}});
test('Prism mistakes are recoverable and repeated wrong selections do not inflate mistakes',()=>{const p=PUZZLES[0];let s=E.createState(p);const wrong=E.choicesAt(p,0).findIndex(x=>E.tokenKey(x)!==E.tokenKey(E.tokenAt(p,5)));s=E.choose(p,s,wrong).state;assert.equal(s.answers.length,0);assert.equal(E.mistakes(s),1);s=E.choose(p,s,wrong).state;assert.equal(E.mistakes(s),1);s=E.choose(p,s,E.correctIndex(p,0)).state;assert.equal(s.answers.length,1);});
test('Prism hints are explicit and persisted; malformed solves cannot skip steps',()=>{const p=PUZZLES[0];let s=E.createState(p);s=E.hint(p,s);s=E.hint(p,s);assert.equal(s.hints[0],2);assert.deepEqual(E.restoreState(p,s),s);assert.equal(E.restoreState(p,{...s,answers:[(E.correctIndex(p,0)+1)%4]}),null);assert.equal(E.restoreState(p,{...s,hints:[3,0,0]}),null);assert.equal(E.restoreState(p,{...s,revealed:true}),null);});
test('Prism reveal supplies the sequence without recording a normal win',()=>{for(const p of PUZZLES){const s=E.reveal(p,E.createState(p));assert.equal(E.getStatus(p,s),'revealed');assert.deepEqual(E.restoreState(p,s),s);}});

// The initial thirty records are an append-only compatibility contract.
test('qwen-pattern-prism preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'6c53d77daa4b6b728e754ed71e87dcd081e5a58c2779b3550bd60940ce306dcf');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
