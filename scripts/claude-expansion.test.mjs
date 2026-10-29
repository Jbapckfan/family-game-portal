import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import * as D from '../games/claude-dovetail/puzzles.mjs';
import * as S from '../games/claude-splice/puzzles.mjs';
import * as K from '../games/claude-keystone/puzzles.mjs';
import * as DE from '../games/claude-dovetail/engine.mjs';
import * as SE from '../games/claude-splice/engine.mjs';
import * as KE from '../games/claude-keystone/engine.mjs';
import {createSession} from '../games/deepseek-runtime/core.mjs';

const MARKER='// BEGIN ALFORD DAILY PREPARED EXPANSION';
const originalCounts={dovetail:77,splice:73,keystone:58};
const originalHashes={
  dovetail:'7160d19bd64e70b259fd3b90a62e22129a2f4b25235446e0d181208ab930eee7',
  splice:'08e5a304f8c60a36f296ef3d2bfd88934176d16860700a21260e0d059edb5fef',
  keystone:'09b25f22c1e3ebbdb9182d748e57f8b622abcb4da9fb7afe8be6303216793c0b',
};
const bank={dovetail:D,splice:S,keystone:K};
const edges=words=>words.slice(1).map((word,i)=>words[i]+'|'+word);
const windows=(words,n)=>words.slice(n-1).map((_,i)=>words.slice(i,i+n).join('|'));
const commonCount=(a,b)=>[...a].filter(x=>b.has(x)).length;
const archKey=r=>r.k+'|'+r.clues.map(c=>c.d+':'+c.w).sort().join(',');
const indices=Array.from({length:12},(_,i)=>i);

for(const slug of Object.keys(bank)){
  test(`${slug} retains the complete original source bytes before its appended bank`,async()=>{
    const source=await readFile(new URL(`../games/claude-${slug}/puzzles.mjs`,import.meta.url),'utf8');
    const original=source.split(MARKER)[0];
    assert.equal(createHash('sha256').update(original).digest('hex'),originalHashes[slug]);
  });
  test(`${slug} offers 200 uniquely identified boards with honest source-pool metadata`,()=>{
    const {PUZZLES,CONTENT_INFO}=bank[slug];
    assert.equal(PUZZLES.length,200);
    assert.equal(new Set(PUZZLES.map(p=>p.id)).size,200);
    assert.equal(CONTENT_INFO.originalRecords,originalCounts[slug]);
    assert.equal(CONTENT_INFO.preparedRecords,200);
  });
}

test('new Dovetail chains use approved joins and differ substantially from every previous chain',()=>{
  const originals=D.PUZZLES.slice(0,77),allowed=new Set(originals.flatMap(p=>edges(p.words)));
  const previous=[];
  for(const [i,p] of D.PUZZLES.entries()){
    const joins=new Set(edges(p.words)),blocks=new Set(windows(p.words,5));
    const presentation=[p.words[0],p.words.at(-1),...p.words.map(w=>w.length)].join('|');
    if(i>=77){
      assert.equal(p.words.length,8,p.id);
      assert.equal(new Set(p.words).size,8,p.id);
      assert.ok([...joins].every(join=>allowed.has(join)),p.id);
      for(const old of previous){
        assert.notEqual(presentation,old.presentation,p.id);
        assert.ok(commonCount(joins,old.joins)<=4,`${p.id} shares too many joins`);
        assert.equal(commonCount(blocks,old.blocks),0,`${p.id} repeats five consecutive words`);
      }
    }
    previous.push({joins,blocks,presentation});
  }
  assert.equal(D.CONTENT_INFO.approvedWords,261);
  assert.equal(D.CONTENT_INFO.approvedDirectedJoins,330);
});

test('new Splice bins preserve a unique matching and meaningful traps from approved fragments',()=>{
  const original=S.PUZZLES.slice(0,73),allowed=new Set(original.flatMap(p=>p.parts.map(pair=>pair.join('|'))));
  const signatures=new Set(),previous=[];
  for(const [i,p] of S.PUZZLES.entries()){
    const tiles=p.parts.flat(),signature=[...tiles].sort().join('|'),words=new Set(p.parts.map(pair=>pair.join('')));
    assert.ok(!signatures.has(signature),p.id);signatures.add(signature);
    if(i>=73){
      assert.equal(new Set(tiles).size,12,p.id);
      assert.ok(!words.has('midget'),`${p.id}: do not repeat this dated derogatory source answer in new content`);
      assert.ok(p.parts.every(pair=>allowed.has(pair.join('|'))),p.id);
      assert.equal(SE.findMatchings(p,indices,3).length,1,p.id);
      const neighbors=tiles.map(()=>new Set());let directed=0;
      for(let a=0;a<12;a++)for(let b=0;b<12;b++)if(a!==b&&S.FUSED.has(tiles[a]+tiles[b])){directed++;neighbors[a].add(b);neighbors[b].add(a);}
      assert.ok(directed>=11,`${p.id}: insufficient alternate word joins`);
      assert.ok(neighbors.filter(n=>n.size<2).length<=2,`${p.id}: too many isolated obvious pairs`);
      for(const old of previous)assert.ok(commonCount(words,old)<=3,`${p.id}: mostly repeats a previous six-word bin`);
    }
    previous.push(words);
  }
  assert.equal(S.CONTENT_INFO.approvedWords,379);
  assert.equal(S.CONTENT_INFO.approvedFragmentPairs,380);
});

test('Keystone has distinct three-arch sets drawn from 174 uniquely solvable original arches',()=>{
  const originals=K.PUZZLES.slice(0,58),arches=new Map(originals.flatMap(p=>p.rounds.map(r=>[archKey(r),r]))),previous=[];
  const used=new Map();
  for(const [i,p] of K.PUZZLES.entries()){
    const keys=new Set(p.rounds.map(archKey));assert.equal(keys.size,3,p.id);
    for(const key of keys){assert.ok(arches.has(key),p.id);used.set(key,(used.get(key)||0)+1);}
    if(i>=58)for(const old of previous)assert.ok(commonCount(keys,old)<=1,`${p.id}: repeats an existing pair of arches`);
    previous.push(keys);
  }
  const joins=new Set(K.FUSED);
  for(const r of arches.values()){
    const answers=K.COMMON.filter(word=>word.length>=3&&word.length<=9&&!r.clues.some(c=>c.w===word)&&r.clues.every(c=>joins.has(word+c.w)||joins.has(c.w+word)));
    assert.deepEqual(answers,[r.k],r.k);
  }
  assert.equal(arches.size,174);
  assert.ok([...used.values()].every(n=>n<=4));
  assert.equal(K.CONTENT_INFO.uniqueArches,174);
});

test('every additional board solves through its real engine, persists, and stays separate in practice',()=>{
  for(const [slug,module,E] of [['dovetail',D,DE],['splice',S,SE],['keystone',K,KE]]){
    for(const p of module.PUZZLES.slice(originalCounts[slug])){
      const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
      const config={...E,id:`claude-${slug}-expansion-test`,name:slug,puzzles:[p]},options={storage,now:()=>new Date('2026-10-22T16:00:00Z')};
      let session=createSession(config,options);session.practice();
      const commit=next=>assert.equal(session.commit(next),true,p.id);
      if(slug==='dovetail')for(let row=1;row<p.words.length-1;row++){
        commit(E.chooseRow(p,session.state,row));commit(E.submitWord(p,session.state,p.words[row]).state);
      }
      if(slug==='splice')for(const [a,b] of E.findMatchings(p,indices,1)[0]){
        commit(E.chooseTile(p,session.state,a));commit(E.chooseTile(p,session.state,b));commit(E.submitPair(p,session.state).state);
      }
      if(slug==='keystone')for(let row=0;row<3;row++){
        commit(E.setDraft(p,session.state,p.rounds[row].k));commit(E.submit(p,session.state).state);
        if(row<2)commit(E.nextArch(p,session.state));
      }
      assert.equal(session.outcome,'won',p.id);assert.equal(session.stats.played,0,p.id);
      session=createSession(config,options);assert.equal(session.outcome,'playing',p.id);
      session.reveal();assert.equal(session.stats.won,0,p.id);assert.equal(session.stats.played,1,p.id);
    }
  }
});
