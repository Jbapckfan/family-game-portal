import {createHash} from 'node:crypto';
import test from 'node:test';import assert from 'node:assert/strict';import * as E from './engine.mjs';import {PUZZLES} from './puzzles.mjs';
test('all prepared Territory positions have solver-proven captures within two legal moves',()=>{assert.ok(PUZZLES.length>=120);assert.equal(new Set(PUZZLES.map(p=>JSON.stringify([p.friendly,p.enemy]))).size,PUZZLES.length);for(const p of PUZZLES){assert.ok(p.target>=3);assert.equal(E.cells(p).length,19);assert.ok(E.cells(p).length-p.friendly.length-p.enemy.length>=5);const routes=E.winningPaths(p,[]);assert.ok(routes.length>0,p.id);for(const moves of routes){assert.ok(moves.length<=2);const board=E.simulate(p,moves);assert.ok(board&&board.captured>=p.target);}let s=E.createState(p);for(const move of routes[0])s=E.place(p,s,move).state;assert.equal(E.getStatus(p,s),'won');assert.deepEqual(E.restoreState(p,s),s);}});
test('Territory boundaries do not add phantom liberties and captures remove whole groups',()=>{const p=PUZZLES[0];for(const c of E.cells(p))assert.ok(E.neighbors(p,c).every(n=>E.cells(p).includes(n)));const route=E.winningPaths(p,[])[0],after=E.simulate(p,route);assert.equal(after.enemy.length,p.enemy.length-after.captured);assert.ok(after.captured>=3);assert.ok(E.neighbors(p,'0,0').length===6);assert.ok(E.neighbors(p,'0,-2').length<6);});
test('Territory forbids self-capture that does not capture the enemy',()=>{const p={id:'fixture',radius:2,friendly:[],enemy:['1,0','0,1','-1,1','-1,0','0,-1','1,-1'],target:3,maxMoves:2};const s=E.createState(p);const result=E.place(p,s,'0,0');assert.deepEqual(result.state,s);assert.match(result.message,/liberty/i);});
test('Territory undo and hints recover every legal dead end',()=>{for(const p of PUZZLES){for(const move of E.cells(p)){let s=E.place(p,E.createState(p),move).state;if(E.getStatus(p,s)==='won')continue;for(let i=0;i<8&&E.getStatus(p,s)==='playing';i++)s=E.hint(p,s);assert.equal(E.getStatus(p,s),'won',p.id+' '+move);}}});
test('Territory restore replays legal moves and rejects forged captures or reveals',()=>{const p=PUZZLES[0],s=E.createState(p);assert.equal(E.restoreState(p,{...s,moves:[p.enemy[0]]}),null);assert.equal(E.restoreState(p,{...s,moves:['99,99']}),null);assert.equal(E.restoreState(p,{...s,moves:['0,0','0,0','0,0']}),null);assert.equal(E.restoreState(p,{...s,revealed:true}),null);const r=E.reveal(p,s);assert.equal(E.getStatus(p,r),'revealed');assert.deepEqual(E.restoreState(p,r),r);});

// The initial thirty records are an append-only compatibility contract.
test('qwen-territory-tactics preserves every original puzzle and stable ID',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(PUZZLES.slice(0,30))).digest('hex'),'35b2c446c69f2b92ee53e7abc019fe27a30831b249dcb9f46416a942614d43ae');
 assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length);
});

function symmetryKey(p,includeFriendly=true){
 const variants=[];
 for(let reflection=0;reflection<2;reflection++)for(let rotation=0;rotation<6;rotation++){
  const transform=cell=>{let [q,r]=cell.split(',').map(Number);if(reflection)[q,r]=[r,q];for(let n=0;n<rotation;n++)[q,r]=[-r,q+r];return `${q},${r}`;};
  variants.push(JSON.stringify([p.radius,includeFriendly?p.friendly.map(transform).sort():[],p.enemy.map(transform).sort(),p.target,p.maxMoves]));
 }
 return variants.sort()[0];
}

test('ninety new Territory boards add a genuine smaller capture choice without changing the published thirty',()=>{
 assert.equal(PUZZLES.length,120);
 assert.equal(new Set(PUZZLES.map(p=>symmetryKey(p))).size,120,'boards must differ under every hex rotation and reflection');
 const additions=PUZZLES.slice(30);
 assert.equal(new Set(additions.map(p=>symmetryKey(p,false))).size,90,'enemy geometry must differ, not only friendly padding');
 for(const p of additions){
  const groups=E.groups(p,p.enemy).sort((a,b)=>b.length-a.length);
  assert.equal(groups.length,2,p.id);
  assert.equal(groups[0].length,p.target,p.id);
  assert.ok(groups[1].length>=1&&groups[1].length<=2,p.id);
  assert.ok(p.target<p.enemy.length,p.id);
  assert.equal(p.maxMoves,2,p.id);
  for(const group of groups)assert.ok(E.liberties(p,group,p.friendly,p.enemy).length>0,p.id+' starts alive');
  for(const cell of p.friendly)assert.ok(E.neighbors(p,cell).some(n=>p.enemy.includes(n)),p.id+' has no decorative friendly stone');
  const winning=E.winningPaths(p);
  assert.ok(winning.length,p.id);
  assert.ok(winning.every(route=>route.length===2),p.id+' requires both moves');
  const decoy=groups[1];
  const decoyRoutes=E.winningPaths({...p,target:decoy.length}).filter(route=>{const board=E.simulate(p,route);return board.captured>0&&board.captured<p.target&&decoy.every(c=>!board.enemy.includes(c));});
  assert.ok(decoyRoutes.length,p.id+' decoy must be legally capturable, but insufficient');
  for(const route of decoyRoutes){
   let s=E.createState(p),last;for(const move of route){last=E.place(p,s,move);s=last.state;}
   assert.equal(E.getStatus(p,s),'playing',p.id+' smaller capture must not win');
   if(route.length===p.maxMoves){const captured=E.simulate(p,route).captured;assert.ok(last.message.startsWith(`${captured} ${captured===1?'stone':'stones'} captured; ${p.target} needed.`),p.id+' must report the real partial capture');}
   assert.deepEqual(E.restoreState(p,s),s,p.id+' smaller captures must restore');
   for(let i=0;i<8&&E.getStatus(p,s)==='playing';i++)s=E.hint(p,s);
   assert.equal(E.getStatus(p,s),'won',p.id+' decoy route must recover via hints');
  }
 }
});
