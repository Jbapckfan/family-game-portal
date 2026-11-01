/** Independent content, real-engine play and current 182-Central-date audit. */
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dailyIndex,centralDateKey,createSession} from '../games/deepseek-runtime/core.mjs';
import {substantiveSignature} from './imported-content-signatures.mjs';
const slugs=['deepseek-twin-hive','deepseek-spare','deepseek-rung','deepseek-cipher','deepseek-trail','deepseek-split','qwen-quadra','qwen-logic-lattice','qwen-syntax-siege','qwen-memory-maze','qwen-pattern-prism','qwen-territory-tactics'];
const dates=Array.from({length:182},(_,n)=>new Date(Date.UTC(2026,10,1+n,12)).toISOString().slice(0,10));
assert.equal(centralDateKey(new Date('2026-11-01T04:59:59Z')),'2026-10-31');
assert.equal(centralDateKey(new Date('2026-11-01T05:00:00Z')),dates[0]);
assert.equal(centralDateKey(new Date('2027-05-01T04:59:59Z')),dates.at(-1));
assert.equal(centralDateKey(new Date('2027-05-01T05:00:00Z')),'2027-05-01');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const inGrid=(a,b,size,diagonal=false)=>{const dr=Math.abs(Math.floor(a/size)-Math.floor(b/size)),dc=Math.abs(a%size-b%size);return a!==b&&(diagonal?Math.max(dr,dc)===1:dr+dc===1);};
function trailPath(p,word){let answer=null;function visit(path){if(answer)return;const i=path.length;if(i===word.length){answer=path;return;}for(let cell=0;cell<9;cell++)if(!path.includes(cell)&&p.grid[cell]===word[i]&&(!i||inGrid(path.at(-1),cell,3,true)))visit([...path,cell]);}visit([]);return answer;}
function independentLattice(p){const cells=Array(25).fill(-1);p.givens.forEach(([i,v])=>cells[i]=v);const lines=Array.from({length:5},(_,r)=>[Array.from({length:5},(_,c)=>r*5+c),p.rows[r]]).concat(Array.from({length:5},(_,c)=>[Array.from({length:5},(_,r)=>r*5+c),p.columns[c]]),[[[0,6,12,18,24],p.diagonals[0]],[[4,8,12,16,20],p.diagonals[1]]]);const solutions=[];function search(){if(solutions.length>=2)return;for(const [indices,target]of lines){const black=indices.filter(i=>cells[i]===1).length,open=indices.filter(i=>cells[i]===-1).length;if(black>target||black+open<target)return;}const at=cells.indexOf(-1);if(at<0){solutions.push([...cells]);return;}for(const v of [0,1]){cells[at]=v;search();}cells[at]=-1;}search();return solutions;}
function territorySolver(p){const all=[];for(let q=-p.radius;q<=p.radius;q++)for(let r=-p.radius;r<=p.radius;r++)if(Math.abs(q+r)<=p.radius)all.push([q,r].join(','));const adjacent=(a,b)=>{const[x,y]=a.split(',').map(Number),[u,v]=b.split(',').map(Number);return Math.max(Math.abs(x-u),Math.abs(y-v),Math.abs(x+y-u-v))===1;};const neighbors=new Map(all.map(k=>[k,all.filter(n=>adjacent(k,n))]));const groups=stones=>{const left=new Set(stones),out=[];while(left.size){const first=[...left][0],group=[first];left.delete(first);for(let n=0;n<group.length;n++)for(const k of neighbors.get(group[n]))if(left.has(k)){left.delete(k);group.push(k);}out.push(group);}return out;};const liberty=(g,f,e)=>g.some(k=>neighbors.get(k).some(n=>!f.includes(n)&&!e.includes(n)));const move=(f,e,key)=>{if(f.includes(key)||e.includes(key))return null;f=[...f,key];e=e.filter(k=>!groups(e).filter(g=>!liberty(g,f,e)).flat().includes(k));if(!liberty(groups(f).find(g=>g.includes(key)),f,e))return null;return [f,e];};const wins=[];function search(f,e,moves){if(p.enemy.length-e.length>=p.target){wins.push(moves);return;}if(moves.length===p.maxMoves)return;for(const key of all){const next=move(f,e,key);if(next)search(...next,[...moves,key]);}}search(p.friendly,p.enemy,[]);return wins;}
// Independent neighbor enumeration by 104 direct substitutions, rather than
// the engine's wildcard buckets. It proves shortest distances in the full graph.
let ladderGraph;
function independentLadderDistance(start,target,lexicon){
 if(!ladderGraph){const words=new Set(lexicon);ladderGraph=new Map();for(const word of words){const next=[];for(let i=0;i<4;i++)for(const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){if(c===word[i])continue;const candidate=word.slice(0,i)+c+word.slice(i+1);if(words.has(candidate))next.push(candidate);}ladderGraph.set(word,next);}}
 const distance=new Map([[start,0]]),queue=[start];for(let i=0;i<queue.length;i++){const word=queue[i];if(word===target)return distance.get(word);for(const next of ladderGraph.get(word)||[])if(!distance.has(next)){distance.set(next,distance.get(word)+1);queue.push(next);}}return null;
}
const rows=[];
for(const slug of slugs){
 const {PUZZLES}=await import(`../games/${slug}/puzzles.mjs`),E=await import(`../games/${slug}/engine.mjs`);let transitions=0,shorterRungPars=0;
 const oldHash=sha(PUZZLES),selections=dates.map(date=>{const index=dailyIndex(slug,date,PUZZLES.length);return {date,index,puzzleId:PUZZLES[index].id,signatureSHA256:sha(substantiveSignature(slug,PUZZLES[index]))};});
 assert.equal(new Set(selections.map(x=>x.signatureSHA256)).size,182,slug+' whole-board freshness');
 const prior=new Set(Array.from({length:12},(_,n)=>{const date=new Date(Date.UTC(2026,9,20+n,12)).toISOString().slice(0,10);return sha(substantiveSignature(slug,PUZZLES[dailyIndex(slug,date,PUZZLES.length)]));}));
 const previousEditionReplays=selections.filter(x=>prior.has(x.signatureSHA256));assert.deepEqual(previousEditionReplays,[],slug+' no Oct 20–31 replay');
 for(const p of PUZZLES){
  let s=E.createState(p);const save=next=>{assert.ok(next,slug+' '+p.id+' transition');const restored=E.restoreState(p,JSON.parse(JSON.stringify(next)));assert.deepEqual(restored,next,slug+' '+p.id+' restoration');s=restored;transitions++;};save(s);
  switch(slug){
   case 'deepseek-twin-hive':for(const word of E.acceptedWords(p).slice(0,p.target))save(E.submitWord(p,s,word).state);break;
   case 'deepseek-spare':{assert.equal(new Set([...p.pairs.flat(),p.spare]).size,9,p.id);for(let pair=0;pair<4;pair++){save(E.chooseTile(p,s,pair*2));save(E.chooseTile(p,s,pair*2+1));save(E.submitPair(p,s).state);}break;}
   case 'deepseek-rung':{const route=E.findRoute(p.start,p.target);assert.ok(route,p.id);if(route.length-1<p.par)shorterRungPars++;assert.equal(E.shortestSteps(p),route.length-1);assert.equal(route.length-1,independentLadderDistance(p.start,p.target,E.LEXICON),p.id+' independent shortest distance');assert.ok(route.every((word,i)=>!i||[...word].filter((c,n)=>c!==route[i-1][n]).length===1),p.id);for(const word of route.slice(1))save(E.submitWord(p,s,word).state);break;}
   case 'deepseek-cipher':{const inverted=Object.fromEntries(Object.entries(p.key).map(([plain,code])=>[code,plain]));assert.equal(new Set(Object.values(p.key)).size,26);assert.equal([...p.encoded].map(c=>inverted[c]||c).join(''),p.phrase,p.id);for(const code of [...new Set(p.encoded.match(/[A-Z]/g))])if(!p.givens.includes(code))save(E.guess(p,s,code,inverted[code]).state);break;}
   case 'deepseek-trail':{assert.equal(p.answer.length,9,p.id);for(const word of p.accepted)assert.ok(trailPath(p,word),p.id+' '+word);const path=trailPath(p,p.answer);for(const tile of path)save(E.selectTile(p,s,tile).state);save(E.submit(p,s).state);break;}
   case 'deepseek-split':for(let row=0;row<2;row++){save(E.setActive(p,s,row));for(const c of p.words[row]){const tile=p.rack.findIndex((v,i)=>v===c&&!s.rows.flat().includes(i));assert.ok(tile>=0);save(E.addTile(p,s,tile).state);}}save(E.submit(p,s).state);break;
   case 'qwen-quadra':assert.equal(p.answers.join('').split('').sort().join(''),[...p.tiles].sort().join(''));for(const word of p.answers){save(E.selectWord(p,s,word).state);save(E.submitWord(p,s).state);}break;
   case 'qwen-logic-lattice':{const solutions=independentLattice(p);assert.equal(solutions.length,1,p.id);assert.deepEqual(solutions[0],p.solution,p.id);for(let i=0;i<25;i++)if(!p.givens.some(([n])=>n===i))save(E.markCell(p,s,i,solutions[0][i]));break;}
   case 'qwen-syntax-siege':save(E.start(p,s));for(const wave of p.waves){assert.equal(wave.words[0].length,6,p.id);for(const c of wave.words[0])save(E.pick(p,s,wave.rack.findIndex((v,i)=>v===c&&!s.selected.includes(i))).state);save(E.submit(p,s).state);}assert.equal(E.health(s),100);break;
   case 'qwen-memory-maze':assert.equal(new Set(p.path).size,p.path.length);assert.ok(p.path.every((v,i)=>!p.obstacles.includes(v)&&(!i||inGrid(p.path[i-1],v,7))),p.id);save(E.startStudy(p,s));save(E.tick(p,s,E.STUDY_MS));for(const cell of p.path)save(E.chooseCell(p,s,cell).state);break;
   case 'qwen-pattern-prism':for(const[key,cycle]of Object.entries(p.cycles)){const first=Array.from({length:5},(_,i)=>cycle[i%cycle.length]);for(let n=1;n<=4;n++){const alternative=first.slice(0,n);if(first.every((v,i)=>v===alternative[i%n]))assert.ok(Array.from({length:3},(_,i)=>alternative[(5+i)%n]).every((v,i)=>v===cycle[(5+i)%cycle.length]),p.id+' '+key+' ambiguous visible cycle');}}for(let step=0;step<3;step++)save(E.choose(p,s,E.correctIndex(p,step)).state);break;
   case 'qwen-territory-tactics':{const routes=territorySolver(p);assert.ok(routes.length,p.id);for(const move of routes[0])save(E.place(p,s,move).state);break;}
  }
  assert.equal(E.getStatus(p,s),'won',slug+' '+p.id);assert.deepEqual(E.reveal(p,s),s,'win remains a win');save(E.reveal(p,E.createState(p)));assert.equal(E.getStatus(p,s),'revealed',p.id);
 }
 assert.equal(sha(PUZZLES),oldHash,'audit cannot mutate puzzle records');
 // Daily/practice switching uses actual persistence controller, not flags.
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},config={id:slug,name:slug,puzzles:PUZZLES,...E};
 const now=()=>new Date('2026-11-01T18:00:00Z'),session=createSession(config,{storage,now});const id=session.puzzle.id;session.hint();const hinted=session.state;const reload=createSession(config,{storage,now});assert.deepEqual(reload.state,hinted);reload.practice();reload.reveal();reload.daily();assert.equal(reload.puzzle.id,id);assert.deepEqual(reload.state,hinted);assert.equal(reload.outcome,'playing');
 rows.push({slug,records:PUZZLES.length,substantiveChallenges:new Set(PUZZLES.map(p=>substantiveSignature(slug,p))).size,allBankNormalWins:PUZZLES.length,allBankDistinctReveals:PUZZLES.length,validatedTransitions:transitions,fullBankSHA256:oldHash,shorterRungPars,selections,distinctDailyChallenges:182,previousEditionReplays,sessionHintReloadAndPracticeIsolation:true});
 console.log(slug,PUZZLES.length,'normal wins; 182 distinct dates;',transitions,'restorable transitions');
}
const report={start:dates[0],end:dates.at(-1),dateCount:dates.length,timezone:'America/Chicago',banks:rows.length,records:rows.reduce((n,r)=>n+r.records,0),dailySelections:rows.length*dates.length,passed:true,limitations:['Meaning and enjoyment need human editorial review; solver proof does not establish either.','Whole-board freshness can reuse words, racks, clues, phrases styles, or rule ingredients in different combinations.','This does not certify hardware touch, timing, audio, haptics, screen readers, or Safari/native packaging.'],games:rows};
await writeFile(new URL('../docs/game-reviews/remaining-dq/evidence/MAKER-Codex__all-bank-and-dates.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
