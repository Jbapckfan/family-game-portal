import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSession} from '../games/deepseek-runtime/core.mjs';
import {claudePuzzleSignature} from './claude-puzzle-signatures.mjs';
import {auditSproutLexicon,sproutNewContentExclusions} from './audit-claude-sprout-lexicon.mjs';

const original = {
  dovetail: [120,'4cfa2694a7e6d7ba8a1eba01cb347b37a4e02e43b7e0ce5d9c965bc580d995a4'],
  splice: [120,'d28077aa4b3bfb7222acbcef4987e8751388fae2bb8763a23d626dd0c8952dda'],
  sprout: [128,'2b3114fd769fa00564a2cad3c3fe9c56514f8057286a8f521924dc2e821a7a9a'],
  tangle: [160,'65d9e42f6685fc85f88e0e36e832d9226bd66a06e9b80c92cf7fc3c2a69b1782'],
  keystone: [120,'400f17c92fc9dde36432ed76aeb0cf363a2d9d65968b596d2c60680e82adbdcb'],
  tumbler: [1054,'624ac8b75ebea8b05b92a13b99a729c229fb2baf60d2e7c896c95d9b405d0968'],
};
const banks={};
for(const slug of Object.keys(original)){
  const data=await import(`../games/claude-${slug}/puzzles.mjs`);
  const engine=await import(`../games/claude-${slug}/engine.mjs`);
  banks[slug]={...data,E:engine};
  test(`${slug}: six-month reserve preserves every published record and ID`,()=>{
    const [count,hash]=original[slug],records=data.PUZZLES;
    assert.equal(createHash('sha256').update(JSON.stringify(records.slice(0,count))).digest('hex'),hash);
    assert.ok(records.length>=200,`${records.length} boards cannot supply the 200-board reserve`);
    assert.equal(new Set(records.map(p=>p.id)).size,records.length);
    assert.equal(new Set(records.map(p=>claudePuzzleSignature(`claude-${slug}`,p))).size,records.length);
  });
}
const sortLetters=word=>[...word].sort().join('');
const remainder=(letters,word)=>{const out=[...letters];for(const ch of word){const at=out.indexOf(ch);assert.ok(at>=0);out.splice(at,1);}return out;};

test('Splice preserves the prepared 200 and has 200 eligible bins after legacy exclusions',()=>{
  const {PUZZLES}=banks.splice;
  assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,200))).digest('hex'),'82700f5392cab837c3eb9f1460a95194f6a84234e81d953fefd1a494a3dd393b');
  const eligible=PUZZLES.filter(p=>!['splice-8','splice-24'].includes(p.id));
  assert.equal(eligible.length,200);
  assert.equal(new Set(eligible.map(p=>claudePuzzleSignature('claude-splice',p))).size,200);
});

test('new Splice content avoids identified dated slurs from the inherited pool',()=>{
  for(const p of banks.splice.PUZZLES.slice(120)){
    assert.ok(!p.parts.some(pair=>['midget','redskins'].includes(pair.join(''))),p.id);
  }
});
test('new Tangle content avoids identified names and editorial exclusions',()=>{
  const excluded=new Set('berlin donna geneva google graham manila murphy nelson trump turner victor wright kinda heroin racist virgin naked'.split(' '));
  for(const p of banks.tangle.PUZZLES.slice(160))assert.ok(!p.w.some(word=>excluded.has(word)),p.id);
});

test('new Sprout graphs admit ROBE, TEAR and EATER and complete their surviving routes',()=>{
  const {PUZZLES,E}=banks.sprout;
  for(const [id,path] of [
    ['sprout-129',['robe','borer','robber','robbers','absorber']],
    ['sprout-130',['tear','earth','heater','earthen','adherent']],
    ['sprout-130',['rate','eater','heater','earthen','adherent']],
  ]){
    const p=PUZZLES.find(p=>p.id===id);let state=E.createState(p);
    for(const word of path){
      const selection=E.selectWord(p,state,word);assert.ok(selection.state,word);
      state=E.submitWord(p,selection.state).state;
      assert.equal(E.analyze(p,state).stack.at(-1),word);
      assert.equal(E.analyze(p,state).wilts,0);
      assert.ok(E.restoreState(p,state));
    }
    assert.equal(E.getStatus(p,state),'won',id);
  }
});

test('Sprout dictionary repair retains every new ID and final ecosystem',()=>{
  const identities=banks.sprout.PUZZLES.slice(128).map(p=>({id:p.id,letters:sortLetters(p.seed+p.pool)}));
  assert.equal(createHash('sha256').update(JSON.stringify(identities)).digest('hex'),'453af012e9260311129a3981fbe430ac71ff60954028596681336e3148c8d46a');
});

test('every reachable COMMON growth is listed except explicit new-content exclusions',()=>{
  const audit=auditSproutLexicon();
  assert.equal(audit.omittedTransitions,0,JSON.stringify(audit.examples));
  for(const p of banks.sprout.PUZZLES.slice(128)){
    for(const word of Object.values(p.levels).flatMap(l=>[...l.a,...l.d])){
      assert.ok(!sproutNewContentExclusions.has(word),`${p.id} ${word}`);
    }
  }
});

test('Sprout adds genuinely new letter ecosystems with reachable wrong turns and real growth',()=>{
  const {PUZZLES,E}=banks.sprout,seen=new Set();
  for(const [i,p] of PUZZLES.entries()){
    const key=sortLetters(p.seed+p.pool);
    assert.ok(!seen.has(key),`${p.id} repeats an existing final multiset`);seen.add(key);
    if(i<128)continue;
    const route=E.findRoute(p);assert.equal(route.length,6,p.id);
    let reachableDead=0,frontier=new Set([p.seed]);
    for(let n=4;n<=8;n++){
      const level=p.levels[n];
      assert.equal(new Set([...level.a,...level.d]).size,level.a.length+level.d.length);
      for(const word of level.a)assert.ok(E.findRoute(p,word,remainder(p.seed+p.pool,word)),`${p.id} ${word}`);
      for(const word of level.d){
        assert.equal(E.findRoute(p,word,remainder(p.seed+p.pool,word)),null,`${p.id} ${word}`);
        if([...frontier].some(current=>E.extraLetter(current,word)))reachableDead++;
      }
      frontier=new Set(level.a.filter(word=>[...frontier].some(current=>E.extraLetter(current,word))));
    }
    if(['sprout-131','sprout-161'].includes(p.id))assert.equal(reachableDead,0,p.id);
    else assert.ok(reachableDead>=1,`${p.id} needs a reachable wrong turn`);
  }
});

test('Tangle adds new thread sets, no repeated pairs, and genuine interfering pulls',()=>{
  const {PUZZLES,E,DICTIONARY}=banks.tangle,previous=[];
  for(const [i,p] of PUZZLES.entries()){
    const words=new Set(p.w),key=[...words].sort().join('|');
    assert.equal(words.size,3,p.id);
    assert.ok(!previous.some(old=>old.key===key),`${p.id} repeats threads`);
    if(i>=160){
      for(const old of previous)assert.ok([...words].filter(w=>old.words.has(w)).length<=1,`${p.id} repeats a thread pair`);
      const wrong=DICTIONARY.filter(w=>!words.has(w)&&p.w.some(t=>t.length===w.length)&&E.findWordPaths(p.s,w).length);
      assert.ok(wrong.length>=4,`${p.id} has fewer than four legal wrong-word pulls`);
      let stranded=0;
      for(let j=0;j<3;j++)for(const indices of E.findWordPaths(p.s,p.w[j])){
        const v={pulls:[{target:j,indices}],removed:indices};
        if(!E.allocation(p,v))stranded++;
      }
      assert.ok(stranded>0,`${p.id} has no duplicate-bead interference`);
      assert.ok(p.o.slice(1).filter((owner,n)=>owner!==p.o[n]).length>=p.s.length/2,p.id);
    }
    previous.push({words,key});
  }
});

for(const [slug,{PUZZLES,E}] of Object.entries(banks)){
  test(`${slug}: every board completes, reloads and records one win through the real session`,()=>{
    for(const p of PUZZLES){
      const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
      const config={...E,id:`claude-${slug}-six-month`,name:slug,puzzles:[p]};
      const options={storage,now:()=>new Date('2026-10-29T17:00:00Z')};
      let session=createSession(config,options);
      const commit=state=>{assert.equal(session.commit(state),true,p.id);session=createSession(config,options);};
      if(slug==='dovetail')for(let row=1;row<p.words.length-1;row++){
        commit(E.chooseRow(p,session.state,row));commit(E.submitWord(p,session.state,p.words[row]).state);
      }
      if(slug==='splice')for(const [a,b] of E.findMatchings(p,undefined,1)[0]){
        commit(E.chooseTile(p,session.state,a));commit(E.chooseTile(p,session.state,b));commit(E.submitPair(p,session.state).state);
      }
      if(slug==='sprout')for(const word of E.findRoute(p).slice(1)){
        commit(E.selectWord(p,session.state,word).state);commit(E.submitWord(p,session.state).state);
      }
      if(slug==='tangle')for(const indices of E.allocation(p,E.view(p,session.state))){
        for(const i of indices)commit(E.toggle(p,session.state,i).state);
        commit(E.submit(p,session.state).state);
      }
      if(slug==='keystone')for(let row=0;row<3;row++){
        commit(E.setDraft(p,session.state,p.rounds[row].k));commit(E.submit(p,session.state).state);
        if(row<2)commit(E.nextArch(p,session.state));
      }
      if(slug==='tumbler'){commit(E.setDraft(p,session.state,p.answer));commit(E.submit(p,session.state).state);}
      assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.won,1,p.id);assert.equal(session.stats.played,1,p.id);
      assert.equal(createSession(config,options).outcome,'won',p.id);
    }
  });
}

test('Tumbler has a feedback-only winning strategy for every answer within six guesses',()=>{
  const {PUZZLES,ANSWERS,E}=banks.tumbler;
  const choice=new Map();
  function choose(candidates){
    const key=candidates.join('|');if(choice.has(key))return choice.get(key);
    let best=candidates[0],score=Infinity;
    for(const guess of candidates){
      const counts=new Map();
      for(const answer of candidates){const signature=E.feedback(guess,answer).join(',');counts.set(signature,(counts.get(signature)||0)+1);}
      const worst=Math.max(...counts.values()),tie=[...counts.values()].reduce((sum,n)=>sum+n*n,0);
      const rank=worst*1e7+tie;
      if(rank<score){score=rank;best=guess;}
    }
    choice.set(key,best);return best;
  }
  let maximum=0;
  for(const p of PUZZLES){
    let candidates=[...ANSWERS],state=E.createState(p);
    while(E.getStatus(p,state)==='playing'){
      const guess=choose(candidates);
      state=E.submit(p,E.setDraft(p,state,guess)).state;
      const feedback=E.feedback(guess,p.answer).join(',');
      candidates=candidates.filter(answer=>E.feedback(guess,answer).join(',')===feedback);
      assert.ok(E.restoreState(p,state),p.id);
    }
    maximum=Math.max(maximum,state.guesses.length);
    assert.equal(E.getStatus(p,state),'won',`${p.id} feedback-only solver exhausted six turns`);
  }
  console.log(`Tumbler feedback-only solver: ${PUZZLES.length} answers, maximum ${maximum} guesses`);
});
