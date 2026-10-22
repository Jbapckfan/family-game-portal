/** Shared completion runtime by ChatGPT; individual concept credits stay in the catalog. */
/** Published daily rotations. Append releases here when expanding a bank again.
 * Keeping the previous sizes makes old dates independent of future additions.
 * Practice always uses the complete installed bank.
 */
const expanded = {
  'deepseek-twin-hive': [30, 140],
  'deepseek-spare': [30, 120],
  'deepseek-rung': [30, 120],
  'deepseek-cipher': [30, 120],
  'deepseek-trail': [30, 120],
  'deepseek-split': [30, 120],
  'qwen-quadra': [30, 120],
  'qwen-logic-lattice': [30, 120],
  'qwen-syntax-siege': [30, 120],
  'qwen-memory-maze': [30, 120],
  'qwen-pattern-prism': [30, 150],
  'qwen-territory-tactics': [30, 120],
  'claude-dovetail': [77, 120],
  'claude-splice': [73, 120],
  'claude-keystone': [58, 120],
};

export const DAILY_BANK_SCHEDULES = Object.freeze(Object.fromEntries(
  Object.entries(expanded).map(([id, [initialCount, count]]) => [id, Object.freeze({
    initialCount,
    releases: Object.freeze([Object.freeze({from: '2026-10-23', count, startIndex: initialCount})]),
  })]),
));

const dateFormat = new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'});
const terminal = new Set(['won','lost','revealed']);
const clone = value => JSON.parse(JSON.stringify(value));
export function centralDateKey(now = new Date()) {
  const parts=Object.fromEntries(dateFormat.formatToParts(now).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function dayNumber(key) { return Date.parse(`${key}T00:00:00Z`)/86400000; }
function validDate(key) {const n=dayNumber(key);return /^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isInteger(n)&&new Date(n*86400000).toISOString().slice(0,10)===key;}
export function dailyIndex(id,key,count) {
  if(!validDate(key)||!Number.isSafeInteger(count)||count<1)throw new Error('Invalid daily collection');
  const schedule=DAILY_BANK_SCHEDULES[id];
  if(schedule){
    let release;for(const candidate of schedule.releases)if(candidate.from<=key&&candidate.count<=count)release=candidate;
    if(release)return (release.startIndex+dayNumber(key)-dayNumber(release.from))%release.count;
    count=Math.min(count,schedule.initialCount);
  }
  let hash=2166136261;for(const char of id)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  return ((dayNumber(key)+hash)%count+count)%count;
}
export function makeStore(storage) {
  const memory=new Map(),dirty=new Set();let available=Boolean(storage);
  return {
    get available(){return available;},
    read(key){
      if(dirty.has(key))return clone(memory.get(key)??null);
      try{const raw=storage?.getItem(key);if(raw==null)return clone(memory.get(key)??null);if(raw.length>262144)return null;return JSON.parse(raw);}
      catch{available=false;return clone(memory.get(key)??null);}
    },
    write(key,value){
      memory.set(key,clone(value));
      try{if(!storage)throw Error('Storage unavailable');storage.setItem(key,JSON.stringify(value));dirty.delete(key);}
      catch{available=false;dirty.add(key);}
    },
  };
}
export function cleanRecords(input,today) {
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length>4096)return {};
  return Object.fromEntries(Object.entries(input).filter(([key,r])=>validDate(key)&&key>='2026-01-01'&&key<=today&&r&&typeof r==='object'&&!Array.isArray(r)&&terminal.has(r.status)).map(([key,r])=>[key,{status:r.status}]));
}
export function recordStatistics(input,today) {
  const records=cleanRecords(input,today),dates=Object.keys(records).sort();let streak=0,bestStreak=0,won=0,last=-Infinity;
  for(const date of dates){const day=dayNumber(date);if(records[date].status==='won'){won++;streak=day===last+1?streak+1:1;bestStreak=Math.max(streak,bestStreak);}else streak=0;last=day;}
  return {played:dates.length,won,streak:last>=dayNumber(today)-1?streak:0,bestStreak};
}

/** Pure session controller, shared by visible UI and persistence/rollover tests. */
export function createSession(config,{storage,now=()=>new Date()}={}) {
  const store=makeStore(storage),prefix=`${config.id}:v1:`,recordKey=prefix+'records';
  if(!Array.isArray(config.puzzles)||!config.puzzles.length)throw Error('A playable puzzle bank is required');
  let date=centralDateKey(now()),mode='daily',index=0,puzzle,state;
  let cursor=store.read(prefix+'practice-cursor');if(!Number.isSafeInteger(cursor)||cursor<0||cursor>1_000_000)cursor=0;
  const puzzleID=()=>String(puzzle.id??index);
  const stateKey=()=>prefix+(mode==='daily'?`daily:${date}`:'practice');
  const records=()=>cleanRecords(store.read(recordKey),centralDateKey(now()));
  function restore(raw) {
    try{const restored=config.restoreState(puzzle,clone(raw));return restored&&['playing','won','lost','revealed'].includes(config.getStatus(puzzle,restored))?clone(restored):null;}catch{return null;}
  }
  function outcome(){return mode==='daily'&&records()[date]?records()[date].status:config.getStatus(puzzle,state);}
  function persist() {
    store.write(stateKey(),{version:1,puzzleId:puzzleID(),puzzleIndex:index,state});
    if(mode==='daily'){
      const all=records(),status=config.getStatus(puzzle,state);
      if(!all[date]&&terminal.has(status)){all[date]={status};store.write(recordKey,all);}
      store.write(prefix+`status:${date}`,{status:all[date]?.status||status});
    }
  }
  function load(fresh=false) {
    const saved=fresh?null:store.read(stateKey()),scheduledIndex=index;
    puzzle=config.puzzles[index];state=null;
    if(saved?.version===1&&typeof saved.puzzleId==='string'){
      // A saved date belongs to its original puzzle even when a bank grows.
      // Resolve by ID; a stale or malformed numeric index cannot redirect it.
      const candidate=config.puzzles.findIndex((p,i)=>String(p.id??i)===saved.puzzleId);
      if(candidate>=0){index=candidate;puzzle=config.puzzles[index];state=restore(saved.state);}
      if(!state){index=scheduledIndex;puzzle=config.puzzles[index];}
    }
    if(!state)state=clone(config.createState(puzzle));
    if(!restore(state))throw Error(`${config.id}: createState is not restorable`);
    persist();
  }
  function refreshDate() {
    const today=centralDateKey(now());if(today===date)return false;date=today;
    if(mode==='daily'){index=dailyIndex(config.id,date,config.puzzles.length);load();}
    return true;
  }
  function commit(next) {
    if(refreshDate()||terminal.has(outcome()))return false;
    const valid=restore(next);if(!valid)return false;state=valid;persist();return true;
  }
  function apply(action) {
    if(refreshDate()||terminal.has(outcome())||typeof action!=='function')return false;
    const next=action(puzzle,clone(state));return next?commit(next):false;
  }
  index=dailyIndex(config.id,date,config.puzzles.length);load();
  return {
    get puzzle(){return puzzle;},get state(){return clone(state);},get mode(){return mode;},get dateKey(){return date;},get outcome(){return outcome();},
    get stats(){return recordStatistics(records(),centralDateKey(now()));},get storageAvailable(){return store.available;},
    commit,hint:()=>apply(config.hint),reveal:()=>apply(config.reveal),refreshDate,
    daily(){date=centralDateKey(now());mode='daily';index=dailyIndex(config.id,date,config.puzzles.length);load();},
    practice(){
      const advancing=mode==='practice';let previous=advancing?index:null;
      date=centralDateKey(now());mode='practice';
      if(!advancing){
        const saved=store.read(stateKey()),candidate=saved?.puzzleIndex;
        if(saved?.version===1&&Number.isSafeInteger(candidate)&&candidate>=0&&candidate<config.puzzles.length&&saved.puzzleId===String(config.puzzles[candidate].id??candidate)){
          index=candidate;puzzle=config.puzzles[index];const restored=restore(saved.state);
          if(restored){
            previous=index;
            if(config.getStatus(puzzle,restored)==='playing'){state=restored;persist();return 'resumed';}
          }
        }
      }
      cursor=(cursor+1)%1_000_000;store.write(prefix+'practice-cursor',cursor);
      index=((previous??dailyIndex(config.id,date,config.puzzles.length))+1)%config.puzzles.length;
      load(true);return 'new';
    },
    progress(){const today=centralDateKey(now());return {type:'progress',slug:config.id,name:config.name,mode,dateKey:mode==='daily'?date:today,status:outcome(),stats:recordStatistics(records(),today)};},
  };
}
