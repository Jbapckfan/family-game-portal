import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, getStatus, submitWord, hint, reveal, restoreState, score, acceptedWords } from './engine.mjs';
import { PUZZLES } from './puzzles.mjs';

const sample = {id:'test',letters:'ACENORST',gold:['A','R'],target:6,answers:['ACRE','ACRES','ACTOR','ACTORS','ACORN','ACORNS','CARROT']};
test('reviewed common-word supplement accepts EARS and survives save, hint, and reveal-list round trips',()=>{
 const p=PUZZLES.find(p=>p.letters==='AEGILNRS'&&p.gold.join('')==='AE');
 assert.ok(p);assert.ok(!p.answers.includes('EARS'));
 const state=submitWord(p,createState(),' ears ').state;
 assert.deepEqual(state.found,['EARS']);assert.deepEqual(restoreState(p,JSON.parse(JSON.stringify(state))),state);
 assert.ok(acceptedWords(p).includes('EARS'));assert.equal(new Set(acceptedWords(p)).size,acceptedWords(p).length);
 const tiny={...p,target:2,answers:['GEAR']};
 const hinted=hint(tiny,submitWord(tiny,createState(),'GEAR').state);
 assert.equal(hinted.hintWord,'EARS');assert.deepEqual(restoreState(tiny,hinted),hinted);
 assert.equal(submitWord(tiny,hinted,'EARS').state.hintWord,null);
});
test('common-word supplement still requires the rack and both gold letters',()=>{
 for(const p of [{...sample,letters:'ACENORTU'}, {...sample,gold:['A','C']}]){
  assert.ok(!acceptedWords(p).includes('EARS'));
  assert.deepEqual(submitWord(p,createState(),'EARS').state.found,[]);
  assert.equal(restoreState(p,{...createState(),found:['EARS']}),null);
 }
});
test('six different legal words complete Twin Hive; duplicate words cannot inflate progress',()=>{
 let state=createState(sample);
 for(const w of sample.answers.slice(0,5)) state=submitWord(sample,state,w).state;
 assert.equal(getStatus(sample,state),'playing');
 state=submitWord(sample,state,' acre ').state;
 assert.equal(state.found.length,5);
 state=submitWord(sample,state,sample.answers[5]).state;
 assert.equal(getStatus(sample,state),'won');
 assert.equal(score(state),sample.answers.slice(0,6).reduce((n,w)=>n+w.length-3,0));
});
test('both gold letters, rack membership, minimum length and curated membership are enforced',()=>{
 for(const word of ['ART','STONE','BARK','RACER']) assert.equal(submitWord(sample,createState(sample),word).state.found.length,0);
 assert.match(submitWord(sample,createState(sample),'RACER').message,/word list/);
});
test('hint identifies one missing word and persists without granting it',()=>{
 const state=hint(sample,createState(sample));
 assert.equal(state.found.length,0);assert.ok(sample.answers.includes(state.hintWord));
 assert.deepEqual(restoreState(sample,JSON.parse(JSON.stringify(state))),state);
 assert.equal(hint(sample,state),null);
 const found=submitWord(sample,state,state.hintWord).state;
 assert.equal(found.hintWord,null);assert.equal(found.hinted.length,1);
});
test('solution reveal stays revealed and cannot become a played win',()=>{
 let state=reveal(sample,createState(sample));
 assert.equal(getStatus(sample,state),'revealed');
 state=submitWord(sample,state,sample.answers[0]).state;
 assert.equal(getStatus(sample,state),'revealed');
});
test('untrusted saved words, duplicate entries and fake counters are rejected or ignored',()=>{
 const good=createState(sample);
 assert.equal(restoreState(sample,{...good,found:['FAKE']}),null);
 assert.equal(restoreState(sample,{...good,found:['ACRE','ACRE']}),null);
 const state=restoreState(sample,{...good,score:999,status:'won'});
 assert.equal(getStatus(sample,state),'playing');assert.equal(score(state),0);
});
test('all prepared daily configurations have enough legal, unique authored solutions',()=>{
 assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>p.letters+':'+p.gold.join(''))).size,PUZZLES.length);
 for(const p of PUZZLES){
  assert.equal(new Set(p.letters).size,8,p.id);assert.equal(p.gold.length,2);assert.equal(new Set(p.gold).size,2);
  assert.ok(p.answers.length>=p.target);assert.equal(new Set(p.answers).size,p.answers.length);
  for(const word of p.answers){assert.ok(word.length>=4&&/^[A-Z]+$/.test(word));assert.ok([...word].every(c=>p.letters.includes(c)),word);assert.ok(p.gold.every(c=>word.includes(c)),word);}
  let state=createState(p);for(const w of p.answers.slice(0,p.target))state=submitWord(p,state,w).state;assert.equal(getStatus(p,state),'won',p.id);
 }
});

// The initial thirty records are an append-only compatibility contract.
test('deepseek-twin-hive preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'91b9d93d0b54315e759b054c5041d1e9d911b6d278a22a8a0c4eb2fd5bdb04fb');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});
