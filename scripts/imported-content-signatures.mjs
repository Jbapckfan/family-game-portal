// Mechanic-level identity: ignore tile shuffle, labels, orientation, and IDs where
// they do not change the challenge. This file is also browser-compatible.
const sorted = values => [...values].sort();
const pair = values => sorted(values).join('/');
function squareTransforms(size) {
 return Array.from({length:8},(_,n)=>index=>{
  let row=Math.floor(index/size),column=index%size;
  if(n>=4)column=size-1-column;
  for(let k=0;k<n%4;k++)[row,column]=[column,size-1-row];
  return row*size+column;
 });
}
const normalizedCycle=values=>{
 const names=new Map();
 return values.map(value=>{if(!names.has(value))names.set(value,names.size);return names.get(value);}).join(',');
};
const cycleClass=cycle=>cycle.map((_,i)=>normalizedCycle([...cycle.slice(i),...cycle.slice(0,i)])).sort()[0];
export function prismSignature(p) {
 return ['shape','color','size','rotation'].map(key=>`${key}:${cycleClass(p.cycles[key])}`).join('|');
}
function gridSignature(p) {
 return squareTransforms(5).flatMap(transform=>[0,1].map(invert=>{
  const cells=Array(25);p.solution.forEach((v,i)=>{cells[transform(i)]=invert?1-v:v;});return cells.join('');
 })).sort()[0];
}
function routeSignature(p) {
 return [p.path,[...p.path].reverse()].flatMap(path=>squareTransforms(7).map(transform=>{
  const coordinates=path.map(transform).map(i=>[Math.floor(i/7),i%7]);
  const row=Math.min(...coordinates.map(x=>x[0])),column=Math.min(...coordinates.map(x=>x[1]));
  return JSON.stringify(coordinates.map(([r,c])=>[r-row,c-column]));
 })).sort()[0];
}
function territorySignature(p) {
 const variants=[];
 for(let flip=0;flip<2;flip++)for(let turn=0;turn<6;turn++){
  const transform=cell=>{let[q,r]=cell.split(',').map(Number);if(flip)[q,r]=[r,q];for(let n=0;n<turn;n++)[q,r]=[-r,q+r];return `${q},${r}`;};
  variants.push(JSON.stringify([p.radius,p.friendly.map(transform).sort(),p.enemy.map(transform).sort(),p.target,p.maxMoves]));
 }
 return variants.sort()[0];
}
export function substantiveSignature(slug,p) {
 switch(slug){
  case 'deepseek-twin-hive': {
   const supplement=[...'EARS'].every(c=>p.letters.includes(c))&&p.gold.every(c=>'EARS'.includes(c))?['EARS']:[];
   return sorted(new Set([...p.answers,...supplement])).join('/');
  }
  case 'deepseek-spare': return sorted(p.pairs.map(pair)).join('|');
  case 'deepseek-rung': return pair([p.start,p.target]);
  case 'deepseek-cipher': return p.phrase;
  case 'deepseek-trail': return p.answer;
  case 'deepseek-split': return pair(p.words);
  case 'qwen-logic-lattice': return gridSignature(p);
  case 'qwen-memory-maze': return routeSignature(p);
  case 'qwen-pattern-prism': return prismSignature(p);
  case 'qwen-quadra': return pair(p.answers);
  case 'qwen-syntax-siege': return pair(p.waves.map(w=>w.bank));
  case 'qwen-territory-tactics': return territorySignature(p);
  default: throw Error(`Unknown imported game: ${slug}`);
 }
}
export function duplicateGroups(slug,puzzles) {
 const groups=new Map();
 puzzles.forEach((p,index)=>{
  const signature=substantiveSignature(slug,p);
  if(!groups.has(signature))groups.set(signature,{signature,indices:[],ids:[]});
  groups.get(signature).indices.push(index);groups.get(signature).ids.push(p.id);
 });
 return [...groups.values()].filter(group=>group.indices.length>1);
}
