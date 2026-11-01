import {WORD_GAME_PATHS} from './vocabulary.mjs';
const cache=new WeakMap();
const size=mask=>{let n=0;for(let bits=mask;bits;bits&=bits-1)n++;return n;};
export const beadMask=indices=>indices.reduce((mask,i)=>mask|(1<<i),0);
const indicesOf=(p,mask)=>[...p.s].map((_,i)=>i).filter(i=>mask&(1<<i));
function paths(p){
 if(cache.has(p))return cache.get(p);
 const masks=WORD_GAME_PATHS[p.id];if(!masks)throw Error('The game dictionary is unavailable for this thread board.');
 const all=new Set(masks),byLength=new Map();
 for(const mask of masks){const length=size(mask);if(!byLength.has(length))byLength.set(length,[]);byLength.get(length).push(mask);}
 const value={all,byLength};cache.set(p,value);return value;
}
export const dictionaryPath=(p,indices)=>paths(p).all.has(beadMask(indices));
/** Exact cover of the remaining ordered beads by dictionary words with the
 * displayed remaining lengths. No authored target-word equality is required. */
export function wordPartition(p,v){
 const {all,byLength}=paths(p),full=(1<<p.s.length)-1,remaining=full^beadMask(v.removed);
 const slots=p.w.map((w,target)=>({target,length:w.length})).filter(x=>!v.pulls.some(pull=>pull.target===x.target));
 if(size(remaining)!==slots.reduce((total,x)=>total+x.length,0))return null;
 const failed=new Set();
 function visit(mask,left){
  if(!left.length)return mask===0?[]:null;
  if(left.length===1)return all.has(mask)&&size(mask)===left[0].length?[{target:left[0].target,mask}]:null;
  const key=mask+':'+left.map(x=>x.length).sort().join(',');if(failed.has(key))return null;
  if(left.length===2){
   for(const first of byLength.get(left[0].length)??[])if((first&mask)===first){const rest=mask^first;if(all.has(rest)&&size(rest)===left[1].length)return [{target:left[0].target,mask:first},{target:left[1].target,mask:rest}];}
  }else{
   const lowest=mask&-mask,seenLengths=new Set();
   for(const slot of left){
    if(seenLengths.has(slot.length))continue;seenLengths.add(slot.length);
    for(const first of byLength.get(slot.length)??[])if((first&lowest)&&(first&mask)===first){
     const tail=visit(mask^first,left.filter(x=>x.target!==slot.target));if(tail)return [{target:slot.target,mask:first},...tail];
    }
   }
  }
  failed.add(key);return null;
 }
 const found=visit(remaining,slots);if(!found)return null;
 const result=p.w.map(()=>[]);for(const {target,mask}of found)result[target]=indicesOf(p,mask);return result;
}
