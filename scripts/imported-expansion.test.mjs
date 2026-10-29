import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import {PUZZLES as hive} from '../games/deepseek-twin-hive/puzzles.mjs';
import {PUZZLES as spare} from '../games/deepseek-spare/puzzles.mjs';
import {PUZZLES as split} from '../games/deepseek-split/puzzles.mjs';
import {PUZZLES as ladders} from '../games/deepseek-rung/puzzles.mjs';
import {PUZZLES as lattice} from '../games/qwen-logic-lattice/puzzles.mjs';
import {PUZZLES as maze} from '../games/qwen-memory-maze/puzzles.mjs';
import {PUZZLES as prism} from '../games/qwen-pattern-prism/puzzles.mjs';
import {PUZZLES as quadra} from '../games/qwen-quadra/puzzles.mjs';
import {PUZZLES as siege} from '../games/qwen-syntax-siege/puzzles.mjs';
import {PUZZLES as territory} from '../games/qwen-territory-tactics/puzzles.mjs';
import {QUADRA_POOLS} from './imported-puzzle-content.mjs';

const unique=(values,label)=>assert.equal(new Set(values).size,values.length,label);
const normalizedCycle=values=>{const keys=new Map();return values.map(value=>{if(!keys.has(value))keys.set(value,keys.size);return keys.get(value);}).join(',');};
const cycleClass=cycle=>cycle.map((_,i)=>normalizedCycle([...cycle.slice(i),...cycle.slice(0,i)])).sort()[0];
const structure=p=>Object.entries(p.cycles).map(([key,cycle])=>key+':'+cycleClass(cycle)).join('|');
const common=(a,b)=>a.filter(value=>b.includes(value)).length;
const pairKey=pair=>[...pair].sort().join('/');
function squareTransforms(size){return Array.from({length:8},(_,n)=>index=>{let row=Math.floor(index/size),col=index%size;if(n>=4)col=size-1-col;for(let k=0;k<n%4;k++)[row,col]=[col,size-1-row];return row*size+col;});}
function hexKey(p){const variants=[];for(let flip=0;flip<2;flip++)for(let turn=0;turn<6;turn++){const transform=cell=>{let[q,r]=cell.split(',').map(Number);if(flip)[q,r]=[r,q];for(let n=0;n<turn;n++)[q,r]=[-r,q+r];return `${q},${r}`;};variants.push(JSON.stringify([p.radius,p.friendly.map(transform).sort(),p.enemy.map(transform).sort(),p.target,p.maxMoves]));}return variants.sort()[0];}

test('every imported concept offers at least 200 immediately selectable prepared boards',async()=>{
 const slugs=(await readdir(new URL('../games/',import.meta.url))).filter(name=>/^(deepseek|qwen)-/.test(name)&&name!=='deepseek-runtime');
 assert.equal(slugs.length,12);
 for(const slug of slugs){const {PUZZLES}=await import(`../games/${slug}/puzzles.mjs`);assert.ok(PUZZLES.length>=200,slug);unique(PUZZLES.map(p=>p.id),slug);}
});
test('Twin Hive uses distinct gold pairs on eight racks, each with a generous accepted answer bank',()=>{
 assert.equal(hive.length,200);unique(hive.map(p=>p.letters+pairKey(p.gold)));
 for(const p of hive)assert.ok(p.answers.length>=12,p.id);
 assert.equal(new Set(hive.map(p=>p.letters)).size,8);
});
test('Rung expansion never counts the same ladder backwards as a new puzzle',()=>{unique(ladders.map(p=>pairKey([p.start,p.target])));});
test('Spare additions use four distinct existing pairs and do not repeat most of an old board',()=>{
 const keys=spare.map(p=>p.pairs.map(pairKey));unique(keys.map(k=>[...k].sort().join('|')));
 const approved=new Set(keys.slice(0,30).flat());
 for(let i=30;i<spare.length;i++){for(const key of keys[i])assert.ok(approved.has(key));for(let j=0;j<i;j++)assert.ok(common(keys[i],keys[j])<=2,spare[i].id+' / '+spare[j].id);}
});
test('Split additions preserve curated clues and introduce different unordered word pairs',()=>{
 unique(split.map(p=>pairKey(p.words)));
 const approved=new Map(split.slice(0,30).flatMap(p=>p.words.map((w,i)=>[w,p.clues[i]])));
 for(const p of split)for(let i=0;i<2;i++)assert.equal(p.clues[i],approved.get(p.words[i]),p.id);
});
test('Lattice grids stay distinct after reflection, rotation, and black-white inversion',()=>{
 const keys=lattice.map(p=>squareTransforms(5).flatMap(transform=>[0,1].map(invert=>{const cells=Array(25);p.solution.forEach((v,i)=>{cells[transform(i)]=invert?1-v:v;});return cells.join('');})).sort()[0]);unique(keys);
});
test('Maze additions have distinct route shapes, beyond relocation, reversal, and mirror images',()=>{
 const key=p=>[p.path,[...p.path].reverse()].flatMap(path=>squareTransforms(7).map(transform=>{const coordinates=path.map(transform).map(i=>[Math.floor(i/7),i%7]);const row=Math.min(...coordinates.map(x=>x[0])),col=Math.min(...coordinates.map(x=>x[1]));return JSON.stringify(coordinates.map(([r,c])=>[r-row,c-col]));})).sort()[0];unique(maze.map(key));
});
test('Prism has at least 200 actual rule structures and no recolored additions',()=>{
 assert.ok(new Set(prism.map(structure)).size>=200);
 const seen=new Set(prism.slice(0,30).map(structure));
 for(const p of prism.slice(30)){assert.ok(!seen.has(structure(p)),p.id);seen.add(structure(p));}
});
test('five Prism examples determine all three predictions across every supported short cycle',()=>{
 for(const p of prism)for(const [attribute,cycle] of Object.entries(p.cycles)){
  assert.ok(cycle.length>=1&&cycle.length<=4);
  const shown=Array.from({length:5},(_,i)=>cycle[i%cycle.length]);const predictions=[];
  for(let period=1;period<=4;period++)if(shown.every((value,i)=>value===shown[i%period]))predictions.push(Array.from({length:3},(_,i)=>shown[(5+i)%period]).join('/'));
  assert.equal(new Set(predictions).size,1,p.id+' '+attribute);
 }
});
test('Quadra additions have one complete solution within their disclosed category pool',()=>{
 unique(quadra.map(p=>[...p.answers].sort().join('/')));
 const bags=new Map();for(const pool of QUADRA_POOLS){const lookup=new Map();for(let a=0;a<pool.words.length;a++)for(let b=a+1;b<pool.words.length;b++)for(let c=b+1;c<pool.words.length;c++)for(let d=c+1;d<pool.words.length;d++){const key=[pool.words[a],pool.words[b],pool.words[c],pool.words[d]].join('').split('').sort().join('');lookup.set(key,(lookup.get(key)||0)+1);}bags.set(pool.category,lookup);}
 for(const p of quadra.slice(30)){assert.equal(bags.get(p.category)?.get([...p.tiles].sort().join('')),1,p.id);}
});
test('Siege schedules introduce different six-bank sets with at least two changed waves',()=>{
 const sets=siege.map(p=>p.waves.map(w=>w.bank));unique(sets.map(w=>[...w].sort().join('/')));
 for(let i=30;i<siege.length;i++)for(let j=0;j<i;j++)assert.ok(common(sets[i],sets[j])<=4,siege[i].id+' / '+siege[j].id);
 assert.equal(new Set(sets.flat()).size,18);
});
test('Territory positions are different after all twelve hex-board symmetries',()=>{unique(territory.map(hexKey));});
