import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Hashes of every published record at 553772c, including the previous expansion.
const published={
 'deepseek-cipher':[120,'b58c76fcc53565a1865f2bf09e9d738441db2423fb15d21faf1e51d29e928486'],
 'deepseek-rung':[120,'c168e571df60553709ffa6869911862e073301547a156c52c83779c113d2186c'],
 'deepseek-spare':[120,'a5c5ba21ed17eef70f17617b1752f6b50d8773bc2c27a3d504c6e3d07658da5a'],
 'deepseek-split':[120,'e113c124317bc32efaf9a26abcbd4cfee239b7d27c1c2eeb37e66144af8458dd'],
 'deepseek-trail':[120,'0c5438d3fbf6e85f2d3e8357b0985c69e3fde3100d2181d9a9864eb12c0ba081'],
 'deepseek-twin-hive':[140,'b6dca8eb68cf6ab99485566da4cb49b59d9d27c58e6e06f956a12669ba67c6b8'],
 'qwen-logic-lattice':[120,'380efcb8e666c5b73096ca35f6e041da9209f58a4ec9918f8e8853bb3ee4b761'],
 'qwen-memory-maze':[120,'131293476d13d8e695cbe86bf4edb2ab02c17c716cf96d39ad12cfc6cf2876e6'],
 'qwen-pattern-prism':[150,'0f950bd948ce5bb1491d091f77942f4eb301d34fd67735620636f58b5f0595a0'],
 'qwen-quadra':[120,'1066430e96783acf5e94d6e89b82c7d8820e42962fbc011ba586cff65a331d49'],
 'qwen-syntax-siege':[120,'13916189f3ddc2c78a680c1fada915d26bbdde97d51bcc889d83e047c2b1f84e'],
 'qwen-territory-tactics':[120,'cca287bfd4967c47b24a1b49ad21c573fa6482de57a4af0d2807e195228109df'],
};
for(const [slug,[count,hash]] of Object.entries(published)){
 const {PUZZLES,CONTENT_INFO}=await import(`../games/${slug}/puzzles.mjs`);
 test(`${slug}: every previously published record remains exact`,()=>assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,count))).digest('hex'),hash));
 test(`${slug}: at least 200 stored boards with distinct stable IDs`,()=>{assert.ok(PUZZLES.length>=200);assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);assert.equal(CONTENT_INFO.preparedPuzzles,PUZZLES.length);});
}

import {substantiveSignature,duplicateGroups} from './imported-content-signatures.mjs';
for(const slug of Object.keys(published)){
 const {PUZZLES}=await import(`../games/${slug}/puzzles.mjs`);
 test(`${slug}: at least 200 substantive challenges beyond ID or display permutations`,()=>{
  assert.ok(new Set(PUZZLES.map(p=>substantiveSignature(slug,p))).size>=200);
  if(slug!=='qwen-pattern-prism')assert.deepEqual(duplicateGroups(slug,PUZZLES),[]);
  else assert.ok(duplicateGroups(slug,PUZZLES).every(group=>group.indices.every(i=>i<30)),'only immutable legacy Prism rules may repeat');
 });
}

// Exercise the assistance APIs as a player would, saving after every transition.
// This covers all records, including repeated letters, every constraint grid,
// every two-move capture, and every wave; terminal status is produced by engines.
for(const slug of Object.keys(published)){
 const {PUZZLES}=await import(`../games/${slug}/puzzles.mjs`);
 const E=await import(`../games/${slug}/engine.mjs`);
 test(`${slug}: full-bank assisted play and every intermediate save restore`,()=>{
  for(const p of PUZZLES){
   let s=E.createState(p);
   const save=next=>{assert.ok(next,`${p.id}: missing state`);const restored=E.restoreState(p,JSON.parse(JSON.stringify(next)));assert.deepEqual(restored,next,`${p.id}: reachable state must restore`);s=restored;};
   save(s);
   if(slug==='qwen-syntax-siege')save(E.assist(p,E.start(p,s)));
   if(slug==='qwen-memory-maze'){
    save(E.hint(p,s));save(E.tick(p,s,E.STUDY_MS));
    for(const cell of p.path)save(E.chooseCell(p,s,cell).state);
   } else {
    for(let step=0;step<100&&E.getStatus(p,s)==='playing';step++){
     save(E.hint(p,s));
     switch(slug){
      case 'deepseek-twin-hive': save(E.submitWord(p,s,s.hintWord).state);break;
      case 'deepseek-spare': {
       const pair=s.hintPair;save(E.chooseTile(p,s,pair*2));save(E.chooseTile(p,s,pair*2+1));save(E.submitPair(p,s).state);break;
      }
      case 'deepseek-rung': save(E.submitWord(p,s,s.hintWord).state);break;
      case 'deepseek-trail': if(s.path.length===9)save(E.submit(p,s).state);break;
      case 'deepseek-split': if(s.rows.flat().length===10)save(E.submit(p,s).state);break;
      case 'qwen-pattern-prism': save(E.hint(p,s));save(E.choose(p,s,E.correctIndex(p,s.answers.length)).state);break;
      case 'qwen-quadra': save(E.submitWord(p,s).state);break;
      case 'qwen-syntax-siege': if(s.selected.length===6)save(E.submit(p,s).state);break;
     }
    }
   }
   assert.equal(E.getStatus(p,s),'won',p.id);
   assert.deepEqual(E.reveal(p,s),s,p.id+' completed games cannot become reveals');
   const revealed=E.reveal(p,E.createState(p));
   assert.equal(E.getStatus(p,revealed),'revealed',p.id);
   save(revealed);
  }
 });
}
