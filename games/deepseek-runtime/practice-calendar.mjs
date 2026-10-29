import {DAILY_RESERVATIONS,FRESH_ROTATIONS} from './daily-rotations.mjs';

const DAY_MS=86400000;
function dateOrdinal(date){
 const ordinal=Date.parse(`${date}T00:00:00Z`)/DAY_MS;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isInteger(ordinal)||new Date(ordinal*DAY_MS).toISOString().slice(0,10)!==date)throw Error('Invalid practice date');
 return ordinal;
}

/** Selectable fresh Practice boards, never the remaining protected dailies.
 * Canonical rotations also omit duplicate legacy challenges and editorial holds.
 * Reservations apply only to a complete compatible installed bank, so reduced
 * test fixtures retain their normal behavior. A one-board fixture may replay its
 * sole board even when the caller excludes today's index.
 */
export function practiceCandidates(slug,date,count,{excludeIndices=[]}={}){
 const today=dateOrdinal(date);
 if(!Number.isSafeInteger(count)||count<1||!Array.isArray(excludeIndices))throw Error('Invalid practice collection');
 const valid=index=>Number.isSafeInteger(index)&&index>=0&&index<count;
 const rotation=FRESH_ROTATIONS[slug];
 const eligible=rotation&&count>=rotation.bankCount?[...new Set(rotation.indices.filter(valid))]:Array.from({length:count},(_,i)=>i);
 const excluded=new Set(excludeIndices.filter(valid));
 const reservation=DAILY_RESERVATIONS.byGame[slug];
 if(reservation&&count>=reservation.bankCount&&date<=DAILY_RESERVATIONS.end){
  const first=Math.max(0,today-dateOrdinal(DAILY_RESERVATIONS.start));
  for(const index of reservation.indices.slice(first))if(valid(index))excluded.add(index);
 }
 const candidates=eligible.filter(index=>!excluded.has(index));
 // A fixture with one board cannot provide a different Practice round. This
 // exception never exposes a reserved board from a full production bank.
 if(!candidates.length&&count===1)return [0];
 return candidates;
}
