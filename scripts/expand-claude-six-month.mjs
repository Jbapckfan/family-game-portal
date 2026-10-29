#!/usr/bin/env node
// Deterministic, append-only Sprout/Tangle preparation. No engine/lexicon changes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {COMMON} from '../games/claude-keystone/puzzles.mjs';
import * as Sprout from '../games/claude-sprout/puzzles.mjs';
import * as SE from '../games/claude-sprout/engine.mjs';
import * as Tangle from '../games/claude-tangle/puzzles.mjs';
import * as TE from '../games/claude-tangle/engine.mjs';

const TARGET=200,MARKER='// BEGIN ALFORD DAILY SIX MONTH EXPANSION';
const sproutEditorial=JSON.parse(await readFile(new URL('./claude-sprout-editorial-exclusions.json',import.meta.url),'utf8'));
const excludedSproutWords=new Set(Object.values(sproutEditorial).filter(Array.isArray).flat());
const hashes={sprout:'edac3e85a0b66a065fad327d727e5037322bd00ceab1550a27fb78e1ba018dfc',tangle:'e19ec5ceb420a069e14f40e4b330923b98a9319e82212b7569b5afafab803288'};
const sha=text=>createHash('sha256').update(text).digest('hex');
const sorted=word=>[...word].sort().join('');
const subset=(word,letters)=>{const rest=[...letters];for(const ch of word){const i=rest.indexOf(ch);if(i<0)return false;rest.splice(i,1);}return true;};
const remainder=(letters,word)=>{const rest=[...letters];for(const ch of word)rest.splice(rest.indexOf(ch),1);return rest.join('');};
function random(seed){return ()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// Each line is an editorially selected common-word route, not an arbitrary
// dictionary hit. All words must also exist in the unchanged supplied COMMON.
// The generator exposes all fitting words from this small reviewed pool, then
// classifies them by a complete graph search rather than declaring them alive.
const routes=`
tea ante agent eating beating abetting
den done boned bonded bounded abounded
ear dare bread badger brigade abridged
ore bore borer robber robbers absorber
ear ears scare sacred crusade accursed
gas sang gains casing causing accusing
arm arms roams ransom masonry acronyms
ear ears spare spread departs adapters
ear rate heart heater earthen adherent
rid arid drain daring reading adhering
ear ears smear armies marries admirers
rid arid drain daring raiding admiring
ear ears spare spread departs adopters
rid arid drain daring adoring adorning
ear ears raise raised adviser advisers
sad said raids radios advisor advisors
ore sore loser looser aerosol aerosols
tea feat fated defeat faceted affected
gas sang gains easing ceasing agencies
ant ants stain antics actions coasting
ear earn anger regain gearing agreeing
tea seat least metals laments ailments
ear ream frame farmer firearm airframe
ear earn learn linear airline airliner
ear earn learn linear airline airlines
pot post sport pastor parrots airports
par pair pairs parish airship airships
ear ears spare spread speared airspeed
ear ears raise varies waivers airwaves
ear earn learn lander adrenal alderman
ear earn learn lander learned aldermen
ear real blare arable algebra algebras
nil nail align ailing nailing aligning
ear real early really gallery allegory
ear earn learn angler general allergen
air rail grail garlic glacier allergic
all call local locale collate allocate
gas sang snags assign massing amassing
ear ears stare master matures amateurs
aim main anime enigma meaning amending
tea team meant tandem untamed amounted
ear ears stare astern senator ancestor
sad said raids radios inroads androids
ear earn anger regain earning angering
tea team meant inmate animate animated
ear ears snare answer wardens answered
tea tape plate planet polenta antelope
tie tire inert retain terrain anterior
ten sent tunes unites inquest antiques
tea seat least staple staples apostles
ear ears spare papers appears appraise
pot post sport pastor captors apricots
ear dare cared arched chaired archived
ear ears share search cashier archives
ear real blare arable algebra arguable
ear earn anger ranger grander arranged
ear earn anger ranger arrange arranger
ear ears snare ranges rangers arranges
ear ears stare arrest traders arrested
ear ears snare learns arsenal arsenals
ant ants stain stains strains arsonist
tie tire trier retire retires arteries
ear rate crate cartel article articles
ant ants stain stains strains artisans
den send sedan ascend encased ascended
ear ears scare scared sidecar ascribed
ant ants stain strain artisan partisan
air rain grain airing raising aspiring
sea seal seals leases measles assemble
ear ears stare teaser teasers asserted
den send dines design designs assigned
ear ears stare trades roasted assorted
gas sang snags assign massing assuming
ear ears stare assert skaters asterisk
tea seat least latest stealth athletes
tea heat teach detach chatted attached
ton tons snout counts suction auctions
out tour route detour readout authored
ear gear grave ravage average averaged
ear ears snare arisen ravines aversion
ear rate great garnet granite averting
rid arid drain daring drawing awarding
tea seat beast basket setback backseat
den send sedan sedans badness baldness
bed bead badge banged bandage bandaged
ear ears stare astern retains banister
air rain grain baring bargain bargains
ear ears snare reason reasons baroness
tea seat beast absent batsmen basement
ice nice mince income combine becoming
tie tire liter litter brittle bitterly
tea seat least castle tackles blackest
ant ants stain giants lasting blasting
tea tale leant entail gelatin tangible
tie tire tires liters blister blisters
ion lion lingo goblin bolting bloating
toe toes stole hotels clothes blotches
die idle riled bridle builder bluebird
den send nerds nursed burdens blunders
sun sung using busing bushing blushing
use sure rules result bluster blustery
ear dare bread barred broader boarders
rid arid drain daring adoring boarding
one nose bones nobles blondes boldness
too soot roots robots booster boosters
ore rode erode eroded ordered bordered
ear rate crate cartel treacle bracelet
ear ears stare skater rackets brackets
ear ears smear realms marbles brambles
ear ears share search ranches branches
ear dare cared arched reached breached
ear ears stare trades roasted broadest
ore sore store roster shorter brothers
ore sore worse rowers browser browsers
use uses issue issues sinuses business
ear ears spare pearls parcels replicas
ear ears scare coarse oracles calories
ear ears scare cranes arsenic canaries
den lend laden leaned cleaned canceled
ear rate crate nectar certain canister
tea seat caste stance nascent canteens
lap slap leaps places capsule capsules
ant ants stain antics actions captions
ear rate crate curate capture captured
ear ears scare crease creases careless
ear ears scare coarse oracles carousel
ear rate crate create created carpeted
cat cast coast actors cartons cartoons
ear ears share search reaches cashmere
`.trim().split('\n').map(line=>line.split(' '));
const extraWords=`
act add age ago aid air all and ant any ape apt arc are arm art ash ask ate awe
bad bag ban bar bat bay bed bee beg bet bid big bin bit bog bow box boy bud bug bun bus but buy
cab can cap car cat cob cod cog con cop cot cow cry cub cup cur cut
dad dam day den dew did die dig dim din dip dog don dot dry due dug duo dye
ear eat eel egg ego elm end era eve ewe eye
fan far fat fax fed fee fen few fib fig fin fir fit fix flu fly foe fog for fox fry fun fur
gap gas gel gem get gin god got gum gun gut guy
had ham has hat hay hem hen her hid him hip his hit hoe hog hop hot how hub hug hum hut
ice icy ill ink inn ion ire ivy jar jaw jet job jog jot joy jug jut
key kid kin kit lab lad lag lap law lay lea led leg lei let lid lie lip lit log lot low lug
mad man map mar mat maw may men met mid mix mob mod mop mud mug mum
nap net new nib nil nip nit nod nor not now nun nut oak oar oat odd off oil old one opt orb ore our out owe owl own
pad pal pan par pat paw pay pea peg pen per pet pew pie pig pin pit ply pod pop pot pro pry pub pug pun pup pus put
rag ram ran rap rat raw ray red rib rid rig rim rip rob rod roe rot row rub rug rum run rut rye
sad sag sap sat saw say sea see set sew she shy sip sir sis sit six ski sky sly sob sod son sop sow soy spa spy sub sue sum sun sup
tab tag tan tap tar tax tea tee ten the tie tin tip toe ton too top tot tow toy try tub tug two
use van vat vet via vie vow wad wag war was wax way web wed wee wet who why wig win wit woe won woo wow wry yak yam yap yaw yea yes yet yew you zip zoo
acre acres acorn actor acute adore adore adult after alert alter amber anger angle ankle apple apron arena arise arose arrow asset atlas attic audio awake award aware
baker basic basin beach beard beast begun below berry birth blade blame blank blast blend blind board boast bonus bound brace braid brain brake brand brass brave break bride broad brown brush build burst
cable cabin camel canal candy cargo carry carve catch cause cedar chair chant charm chart chase cheap cheat check cheek chest chief child chill choir chose claim class clean clear cliff climb clock close cloud coach coast color coral could count court cover craft crane crash cream creep crisp crown curve
daily dairy dance dealt death delta depth diary doing doubt dozen draft drain drama drawn dream dress dried drift drive drove
eager early earth eight elite empty enemy enjoy enter equal error event every exact exile exist extra
fable faint fairy faith false fancy fault feast fence ferry fetch fever field fiery fifth fight final first fixed flame fleet flesh float flood floor flour fluid flute focus force forge forth found frame fresh front frost fruit fully
giant given glass globe glory glove grace grade grain grand grant grape graph grasp grass grave great green grief grind groan gross group grove grown guard guess guest guide guilt
habit haste haven heart heavy hedge hello hence herbs horse hotel house human humid humor
ideal image imply inbox index inner input issue ivory
joint judge juice known label labor large laser later laugh layer learn least leave legal lemon level light limit lined linen links liver local lodge logic loose lower loyal lunar lunch
magic major maker mango maple march match meant medal media melon mercy merit metal meter might minor minus mixed model money month moral mount mouse mouth movie music
nails names nasty never newly niece night noise north novel nurse ocean offer often olive onion onset opera orbit order organ other ought outer owned owner
paint pairs panel panic paper party patch pause peace pearl pedal penny phase phone photo piano piece pilot pitch place plain plane plant plate plead plume point polar porch pound power pride prime print prior prize proof proud prove pulse pupil purse
queen query quest queue quick quiet quite quote radio raise range rapid ratio reach ready realm rebel refer reign relax repay reply reset rhyme rider rifle right rigid risky rival river roast robot rocky rough round route royal ruler rural
safer saint salad sales satin sauce scale scare scene scent score scout scrap screw seal sense serve seven shade shake shall shame shape share sharp sheep sheet shelf shell shift shine shirt shock shore short shout shown shrub sight since skill skull slice slide slope small smart smile smoke solid solve sound south space spare speak speed spell spend spice spine split spoil sport spray squad stack staff stage stain stair stake stale stand stare start state steam steel steep steer stick still sting stock stone stood store storm story stove straw strip stuck study stuff style sugar suite sunny super surge swamp sweat sweet swept swift swing sword
table taken taste teach teeth thank their theme there thick thing think third those three threw throw tight timer title toast today token total touch tough tower track trade trail train trait trash treat trend trial tribe trick tried trout truly trunk trust truth twice twist
uncle under undue union unite until upper urban usage usual valid value video visit vital vivid vocal voice waste watch water weave weigh weird wheat wheel where which while white whole whose wider widow width woman women world worry worse worth would wound woven wrath wreck wrist write wrong wrote yacht years yield young yours zebra
`.trim().split(/\s+/);

function sprout(){
  const source=Sprout.PUZZLES.slice(0,128),dictionary=new Set(COMMON);
  const words=[...new Set([...routes.flat(),...extraWords.filter(w=>dictionary.has(w))])];
  const acceptedWords=COMMON.filter(w=>/^[a-z]{4,8}$/.test(w)&&!excludedSproutWords.has(w));
  for(const w of words)assert.ok(dictionary.has(w),`Unapproved source word: ${w}`);
  for(const route of routes){assert.deepEqual(route.map(w=>w.length),[3,4,5,6,7,8]);for(let i=1;i<6;i++)assert.ok(SE.extraLetter(route[i-1],route[i]),route.join(' > '));}
  const seen=new Set(source.map(p=>sorted(p.seed+p.pool))),added=[],skipped=[];
  const seedUse=new Map(source.map(p=>[p.seed,source.filter(q=>q.seed===p.seed).length]));
  for(const route of routes){
    if(source.length+added.length===TARGET)break;
    const total=sorted(route.at(-1));if(seen.has(total))continue;
    const seeds=words.filter(w=>w.length===3&&subset(w,route[1])).sort((a,b)=>(seedUse.get(a)||0)-(seedUse.get(b)||0)||a.localeCompare(b));
    let chosen=null;
    for(const seed of seeds){
      const p={id:`sprout-${source.length+added.length+1}`,seed,pool:remainder(total,seed),levels:{}};
      for(let n=4;n<=8;n++)p.levels[n]={a:words.filter(w=>w.length===n&&subset(w,total)).sort(),d:[]};
      // All eight-letter anagrams in this reviewed pool are valid flowers.
      for(let n=7;n>=4;n--){
        const all=p.levels[n].a;p.levels[n]={a:[],d:[]};
        for(const word of all)(SE.findRoute(p,word,[...remainder(total,word)])?p.levels[n].a:p.levels[n].d).push(word);
      }
      if(!SE.findRoute(p))continue;
      let frontier=[seed],dead=0;
      for(let n=4;n<=8;n++){
        dead+=p.levels[n].d.filter(w=>frontier.some(current=>SE.extraLetter(current,w))).length;
        frontier=p.levels[n].a.filter(w=>frontier.some(current=>SE.extraLetter(current,w)));
      }
      if(dead){chosen=p;break;}
    }
    if(!chosen){skipped.push(route.at(-1));continue;}
    // Keep prepared IDs and ecosystem selection stable.
    // The smaller reviewed pool selects ecosystems, but cannot be the acceptance
    // dictionary: it omitted ordinary valid alternatives such as ROBE and TEAR.
    // Enumerate the same existing COMMON contract as the original 128 boards,
    // with only the closed, documented new-content exclusions.
    for(let n=4;n<=8;n++)chosen.levels[n]={a:acceptedWords.filter(w=>w.length===n&&subset(w,total)).sort(),d:[]};
    for(let n=7;n>=4;n--){
      const all=chosen.levels[n].a;chosen.levels[n]={a:[],d:[]};
      for(const word of all)(SE.findRoute(chosen,word,[...remainder(total,word)])?chosen.levels[n].a:chosen.levels[n].d).push(word);
    }
    assert.ok(SE.findRoute(chosen),`${chosen.id}: complete COMMON graph lost its growth path`);
    added.push(chosen);seen.add(total);seedUse.set(chosen.seed,(seedUse.get(chosen.seed)||0)+1);
  }
  assert.equal(source.length+added.length,TARGET,`Only ${added.length} new Sprout ecosystems`);
  // Restoring omitted valid continuations removed artificial traps. Sixteen
  // ecosystems retain genuine traps from another familiar seed. Two ecosystems
  // have no dead entries at all and are explicitly easy rather than restricting
  // valid vocabulary to manufacture difficulty.
  const seedRepairs={132:'dot',133:'dig',138:'sit',141:'see',143:'men',146:'age',148:'sad',149:'aim',153:'lap',164:'cat',165:'ice',166:'pin',167:'red',175:'bat',179:'let',184:'sun'};
  for(const p of added){
    const seed=seedRepairs[Number(p.id.split('-').at(-1))];
    if(seed){const letters=sorted(p.seed+p.pool);p.seed=seed;p.pool=remainder(letters,seed);}
    assert.ok(SE.findRoute(p),`${p.id}: repaired seed has no complete route`);
  }
  return {added,info:{originalRecords:128,preparedRecords:TARGET,newLetterMultisets:added.length,ecosystemSelectionPoolWords:words.length,acceptanceLexicon:'Existing supplied COMMON, except documented new-content editorial exclusions',excludedNewWords:[...excludedSproutWords].sort(),minimumReachableDeadEnds:0,nonEasyMinimumReachableDeadEnds:1,easyPuzzleIds:['sprout-131','sprout-161'],seedRepairs,skippedWithoutReachableTrap:skipped,contentNote:'New eight-letter multisets selected using reviewed routes; every fitting COMMON word except explicit editorial exclusions is graph-classified as alive/dead. Prepared IDs/final ecosystems are preserved. Sixteen familiar seeds restore genuine traps; two explicitly easy boards have no dead-end branches.'}};
}

function tangle(){
  const source=Tangle.PUZZLES.slice(0,160),rng=random(0x7A6C2026),added=[];
  // Preserve the original 160 boards, but do not repeat proper names, slang,
  // or these editorially excluded words in newly prepared default boards.
  const excluded=new Set('berlin donna geneva google graham manila murphy nelson trump turner victor wright kinda heroin racist virgin naked'.split(' '));
  const words=[...new Set(source.flatMap(p=>p.w))].filter(w=>!excluded.has(w)).sort(),dictionary=Tangle.DICTIONARY;
  const previous=source.map(p=>new Set(p.w)),seen=new Set(source.map(p=>p.s));
  let attempts=0;
  while(source.length+added.length<TARGET&&attempts<50000){
    attempts++;
    const w=shuffled(words,rng).slice(0,3);
    if(previous.some(old=>w.filter(word=>old.has(word)).length>1))continue;
    const cursors=[0,0,0],o=[],beads=[];
    while(cursors.some((n,i)=>n<w[i].length)){
      const choices=[0,1,2].filter(i=>cursors[i]<w[i].length),owner=choices[Math.floor(rng()*choices.length)];
      o.push(owner);beads.push(w[owner][cursors[owner]++]);
    }
    const s=beads.join('');if(seen.has(s)||o.slice(1).filter((owner,n)=>owner!==o[n]).length<s.length/2)continue;
    const p={id:`tangle-${String(source.length+added.length+1).padStart(3,'0')}`,s,w,o};
    const wrong=dictionary.filter(word=>!w.includes(word)&&w.some(target=>target.length===word.length)&&TE.findWordPaths(s,word).length);
    if(wrong.length<4)continue;
    let stranded=false;
    for(let j=0;j<3&&!stranded;j++)for(const indices of TE.findWordPaths(s,w[j])){
      if(!TE.allocation(p,{pulls:[{target:j,indices}],removed:indices})){stranded=true;break;}
    }
    if(!stranded)continue;
    assert.ok(TE.allocation(p,{pulls:[],removed:[]}));
    added.push(p);previous.push(new Set(w));seen.add(s);
  }
  assert.equal(source.length+added.length,TARGET);
  return {added,info:{originalRecords:160,preparedRecords:TARGET,approvedThreadWords:words.length,excludedNewThreads:[...excluded].sort(),attempts,maxSharedThreadWords:1,minimumWrongWordPulls:4,duplicateBeadInterference:true,contentNote:'New three-word sets from the original thread vocabulary after explicit editorial exclusions, no reused pair of threads, interwoven source ownership and recoverable duplicate-bead traps.'}};
}
const output=[];
for(const [slug,build] of [['sprout',sprout],['tangle',tangle]]){
  const file=new URL(`../games/claude-${slug}/puzzles.mjs`,import.meta.url),current=await readFile(file,'utf8'),original=current.split(MARKER)[0];
  assert.equal(sha(original),hashes[slug],`${slug}: original source changed`);
  const {added,info}=build();
  const generated=original+MARKER+'\n// Additional content prepared by ChatGPT; published records above are unchanged.\n'+
    `PUZZLES.push(...${JSON.stringify(added)});\nexport const CONTENT_INFO = Object.freeze(${JSON.stringify(info)});\n`;
  output.push({slug,file,current,generated,info});
}
for(const item of output){
  if(process.argv.includes('--check'))assert.equal(item.current,item.generated,`${item.slug}: regenerate the six-month expansion`);
  else await writeFile(item.file,item.generated);
  console.log(`${item.slug}: ${JSON.stringify(item.info)}`);
}
