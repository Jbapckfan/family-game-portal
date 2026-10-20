/** Original editorial content. No generated semantic judgments at play time. */
const ENTRIES = [
  ['ACORN','OAK','CATERPILLAR','BUTTERFLY','Earlier stage → later stage','An acorn can develop into an oak; a caterpillar develops into a butterfly.'],
  ['GLOVE','HAND','SHEATH','BLADE','Protective covering → what it protects','A glove covers and protects a hand; a sheath covers and protects a blade.'],
  ['COMPASS','DIRECTION','BAROMETER','PRESSURE','Instrument → what it indicates','A compass indicates direction; a barometer indicates atmospheric pressure.'],
  ['EMBER','FIRE','ECHO','SOUND','Lingering trace → its source','An ember can remain after a fire subsides; an echo repeats after the original sound.'],
  ['AUTHOR','NOVEL','COMPOSER','SYMPHONY','Creator → creation','An author writes a novel; a composer writes a symphony.'],

  ['MAP','TERRITORY','PORTRAIT','PERSON','Representation → what it depicts','A map represents a territory; a portrait represents a person.'],
  ['KEY','LOCK','PASSWORD','ACCOUNT','Credential → what it unlocks','A key opens a lock; a password unlocks access to an account.'],
  ['CHAPTER','BOOK','SCENE','PLAY','Narrative section → larger work','A chapter is a section of a book; a scene is a section of a play.'],
  ['DROUGHT','WILTING','FRICTION','HEAT','Physical cause → resulting effect','Drought can cause plants to wilt; friction can produce heat.'],
  ['SCRIBE','PEN','SCULPTOR','CHISEL','Craftsperson → working tool','A scribe works with a pen; a sculptor can work with a chisel.'],

  ['ROOT','ANCHOR','GILL','BREATHE','Body part → one of its functions','Roots anchor a plant; gills allow an aquatic animal to breathe.'],
  ['SPARK','IGNITION','PROMPT','RESPONSE','Initiating stimulus → what follows','A spark can initiate ignition; a prompt can elicit a response.'],
  ['BARK','TREE','RIND','FRUIT','Outer layer → what it surrounds','Bark is the outer covering of a tree; rind is the outer covering of a fruit.'],
  ['INFANT','ADULT','SAPLING','TREE','Young form → mature form','An infant grows into an adult; a sapling grows into a mature tree.'],
  ['HUNGER','FOOD','THIRST','WATER','Bodily need → what satisfies it','Food satisfies hunger; water satisfies thirst.'],

  ['MILE','DISTANCE','MINUTE','TIME','Unit → quantity measured','A mile is a unit of distance; a minute is a unit of time.'],
  ['MARBLE','STATUE','CLAY','POT','Raw material → crafted object','Marble can be shaped into a statue; clay can be shaped into a pot.'],
  ['BEE','HIVE','MONK','MONASTERY','Resident → customary home','A bee lives in a hive; a monk may live in a monastery.'],
  ['THORN','PRICK','FANG','PUNCTURE','Sharp structure → action it performs','A thorn can prick skin; a fang can puncture it.'],
  ['CHORUS','SONG','REFRAIN','POEM','Repeated passage → larger work','A chorus repeats within a song; a refrain repeats within a poem.'],

  ['MOLT','FEATHERS','SHED','LEAVES','Discarding action → what is discarded','A bird molts its old feathers; a deciduous tree sheds its leaves.'],
  ['PROLOGUE','STORY','OVERTURE','OPERA','Introduction → main work','A prologue introduces a story; an overture introduces an opera.'],
  ['SEISMOGRAPH','TREMOR','THERMOMETER','TEMPERATURE','Measuring device → phenomenon measured','A seismograph records ground tremors; a thermometer measures temperature.'],
  ['BUD','BLOSSOM','LARVA','ADULT','Immature stage → developed stage','A bud develops into a blossom; a larva develops into the adult form of its species.'],
  ['RECIPE','COOK','BLUEPRINT','BUILDER','Instruction document → intended user','A cook follows a recipe; a builder follows a blueprint.'],

  ['WITNESS','TESTIMONY','HISTORIAN','CHRONICLE','Account giver → account given','A witness gives testimony; a historian can write a chronicle.'],
  ['CANAL','BOAT','RAILWAY','TRAIN','Constructed route → traveling vehicle','A canal provides a route for a boat; a railway provides a route for a train.'],
  ['ZEST','ORANGE','HUSK','CORN','Removed outer covering → its source','Zest comes from the outer peel of an orange; a husk is removed from an ear of corn.'],
  ['DEBT','REPAY','RIDDLE','SOLVE','Unresolved matter → resolving action','A debt is settled by repaying it; a riddle is resolved by solving it.'],
  ['BIRTH','DEATH','DAWN','DUSK','Beginning → ending of a natural span','Birth and death mark the ends of a life; dawn and dusk mark the ends of daylight.'],

  ['ORCHARD','TREES','LIBRARY','BOOKS','Collection site → collected items','An orchard contains trees; a library contains books.'],
  ['ANT','COLONY','WOLF','PACK','Social animal → its group','An ant belongs to a colony; a wolf belongs to a pack.'],
  ['FLINT','SPARK','MATCH','FLAME','Fire starter → what it produces','Struck flint can produce a spark; a struck match can produce a flame.'],
  ['FILTER','IMPURITY','CENSOR','OBSCENITY','Remover → material it screens out','A filter removes an impurity; a censor may remove obscenity.'],
  ['QUOTE','SPEECH','EXCERPT','TEXT','Selected passage → original source','A quote can be selected from a speech; an excerpt is selected from a text.'],

  ['GRAIN','SAND','FLAKE','SNOW','Small particle → accumulated substance','A grain is a small particle of sand; a flake is a small particle of snow.'],
  ['MIRAGE','SIGHT','ECHO','HEARING','Sensory phenomenon → sense detecting it','A mirage is perceived through sight; an echo is perceived through hearing.'],
  ['SUNDIAL','TIME','ODOMETER','DISTANCE','Instrument → quantity displayed','A sundial displays time; an odometer displays distance traveled.'],
  ['FOSSIL','PAST','FORECAST','FUTURE','Information source → time it concerns','A fossil provides evidence about the past; a forecast makes a prediction about the future.'],
  ['RETRACT','STATEMENT','REVOKE','PERMISSION','Withdrawal action → what is withdrawn','You retract a statement; you revoke permission.'],

  ['BAIT','TRAP','LURE','AMBUSH','Attraction → capture it draws toward','Bait draws a target toward a trap; a lure can draw a target into an ambush.'],
  ['SCAB','WOUND','CALLUS','FRICTION','Skin response → what prompts it','A scab forms over a wound; a callus develops in response to repeated friction.'],
  ['IRON','MAGNET','MOTH','LIGHT','Attracted thing → attractor','Iron is attracted to a magnet; a moth may be attracted to a light.'],
  ['CIPHER','MESSAGE','MASK','FACE','Concealing device → what it conceals','A cipher conceals the meaning of a message; a mask conceals a face.'],
  ['ORCHESTRA','CONDUCTOR','TEAM','COACH','Performing group → its leader','A conductor directs an orchestra; a coach directs a team.'],

  ['OVEN','BAKE','LOOM','WEAVE','Production tool → its operation','An oven is used to bake; a loom is used to weave.'],
  ['SEED','SOW','VOTE','CAST','Thing → conventional action applied to it','The conventional verb for putting a seed in the ground is sow; for submitting a vote, it is cast.'],
  ['FEVER','ILLNESS','SMOKE','FIRE','Observable sign → underlying condition','A fever can signal illness; smoke can signal a fire.'],
  ['PETAL','FLOWER','SPOKE','WHEEL','Distinct component → whole object','A petal is a component of a flower; a spoke is a component of a wheel.'],
  ['MONARCH','CROWN','JUDGE','ROBE','Role → ceremonial clothing','A monarch may wear a crown; a judge may wear a robe.'],

  ['ORBIT','PLANET','ITINERARY','TRAVELER','Route → one who follows it','A planet follows an orbit; a traveler follows an itinerary.'],
  ['LEVER','PRY','AWL','PIERCE','Hand tool → characteristic action','A lever can be used to pry; an awl is used to pierce holes.'],
  ['SHIVER','COLD','SWEAT','HEAT','Body response → prompting condition','Shivering is a response to cold; sweating is a response to heat.'],
  ['APPETIZER','MEAL','PRELUDE','CONCERT','Opening portion → main experience','An appetizer opens a meal; a prelude can open a concert.'],
  ['INSULT','APOLOGY','DAMAGE','REPAIR','Harm → corrective response','An apology can address an insult; a repair can address damage.'],

  ['CONFIDENCE','ARROGANCE','CAUTION','TIMIDITY','Useful quality → excessive version','Too much confidence can become arrogance; too much caution can become timidity.'],
  ['KNIFE','SHARPEN','STRING','TUNE','Item → adjustment that readies it','You sharpen a knife for use; you tune a musical string before playing.'],
  ['DROPLET','CLOUD','STAR','GALAXY','Constituent → natural aggregation','A cloud contains many droplets; a galaxy contains many stars.'],
  ['SIEVE','SIFT','NET','CATCH','Utensil → intended action','A sieve is used to sift; a net is used to catch.'],
  ['PERMISSION','ACT','INVITATION','ATTEND','Authorization → action it enables','Permission allows someone to act; an invitation allows someone to attend.'],

  ['ANCHOR','DRIFT','BRAKE','MOTION','Restraint → movement it limits','An anchor limits a vessel\'s drift; a brake limits a vehicle\'s motion.'],
  ['EVIDENCE','VERDICT','SYMPTOM','DIAGNOSIS','Evidence type → conclusion it informs','Evidence informs a verdict; a symptom informs a diagnosis.'],
  ['FORESHADOWING','EVENT','OMEN','OUTCOME','Advance sign → what it anticipates','Foreshadowing anticipates an event in a story; an omen is taken to anticipate an outcome.'],
  ['SHIP','FLEET','TREE','FOREST','Individual → collective grouping','A fleet is a group of ships; a forest is a collection of trees.'],
  ['CANVAS','PAINTER','CLAY','POTTER','Artistic medium → craftsperson','A painter works on canvas; a potter works with clay.'],

  ['LULLABY','SLEEP','CAFFEINE','ALERTNESS','Inducer → intended state','A lullaby is intended to encourage sleep; caffeine can increase alertness.'],
  ['LIFEGUARD','RESCUE','REFEREE','OFFICIATE','Role → primary duty','A lifeguard may need to rescue; a referee officiates a contest.'],
  ['SKELETON','BODY','FRAME','BUILDING','Supporting structure → what it supports','A skeleton supports a body; a frame supports a building.'],
  ['CALENDAR','DATE','DICTIONARY','DEFINITION','Reference → information looked up','A calendar lets you look up a date; a dictionary lets you look up a definition.'],
  ['TEACH','LEARN','TELL','HEAR','Communicator\'s action → receiver\'s action','The receiver of teaching is meant to learn; the receiver of telling is meant to hear.'],

  ['NEEDLE','SEW','CHISEL','CARVE','Implement → craft action','A needle is used to sew; a chisel is used to carve.'],
  ['MARATHON','ENDURANCE','SPRINT','SPEED','Contest → central ability tested','A marathon especially tests endurance; a sprint especially tests speed.'],
  ['ICICLE','WATER','CANDLE','WAX','Shaped object → constituent material','An icicle is made of frozen water; a conventional candle is made of wax.'],
  ['PLUCK','FEATHER','PRUNE','BRANCH','Removal action → part removed','You remove a feather by plucking it; you remove a branch by pruning it.'],
  ['EDITOR','MANUSCRIPT','CURATOR','COLLECTION','Caretaking role → material managed','An editor tends a manuscript; a curator tends a collection.'],

  ['DIAMOND','HARDNESS','RUBBER','ELASTICITY','Material → characteristic property','Diamond is noted for hardness; rubber is noted for elasticity.'],
  ['CENTURY','YEARS','DOZEN','ITEMS','Fixed quantity → what is counted','A century counts one hundred years; a dozen counts twelve items.'],
  ['REHEARSAL','PERFORMANCE','DRAFT','PUBLICATION','Preparation → finished presentation','Rehearsal prepares for a performance; a draft prepares a work for publication.'],
  ['SCENT','NOSE','TEXTURE','SKIN','Perceived quality → detecting organ','The nose detects scent; touch receptors in the skin detect texture.'],
  ['HONEYCOMB','BEE','WEB','SPIDER','Built structure → its animal builder','Honeycomb is a structure built by bees; a web is a structure built by a spider.'],

  ['FREEZE','ICE','EVAPORATE','VAPOR','Phase change → resulting form','Water that freezes becomes ice; water that evaporates becomes vapor.'],
  ['COMMA','SENTENCE','REST','MUSIC','Pause marker → expressive medium','A comma can indicate a pause within a sentence; a rest indicates a pause within music.'],
  ['ARTIFACT','ARCHAEOLOGIST','FOSSIL','PALEONTOLOGIST','Evidence object → specialist who studies it','An archaeologist studies artifacts; a paleontologist studies fossils.'],
  ['NEST','EGG','VAULT','TREASURE','Protective container → contents','A nest holds and protects an egg; a vault holds and protects treasure.'],
  ['CAMOUFLAGE','VISIBILITY','MUFFLER','NOISE','Suppressor → what it reduces','Camouflage reduces visibility; a muffler reduces noise.'],

  ['THESIS','ARGUMENT','THEOREM','PROOF','Claim → structured support','A thesis is supported by an argument; a theorem is established by a proof.'],
  ['PRISM','SPECTRUM','KILN','CERAMICS','Device → product it helps create','A prism separates light into a spectrum; a kiln fires clay into ceramics.'],
  ['SHELL','TURTLE','ARMOR','SOLDIER','Body protection → protected wearer','A shell protects a turtle; armor protects a soldier.'],
  ['BASS','LOW','SOPRANO','HIGH','Voice category → relative register','A bass voice occupies a low register; a soprano voice occupies a high register.'],
  ['INVOICE','PAYMENT','SUMMONS','APPEARANCE','Formal request → expected fulfillment','An invoice requests payment; a summons requires an appearance.'],
];

// Explicit board composition: 18 first appearances, then 12 new combinations.
// Numbers are one-based editorial entry numbers, not hidden gameplay logic.
const BOARDS = [
  ['The shape of a thought',[1,2,3,4,5]],
  ['Look past the surface',[6,7,8,9,10]],
  ['From here to there',[11,12,13,14,15]],
  ['Five little parallels',[16,17,18,19,20]],
  ['A change in perspective',[21,22,23,24,25]],
  ['Read between the pairs',[26,27,28,29,30]],
  ['The company words keep',[31,32,33,34,35]],
  ['Follow the idea',[36,37,38,39,40]],
  ['An eye for meaning',[41,42,43,44,45]],
  ['One thought, another form',[46,47,48,49,50]],
  ['The next connection',[51,52,53,54,55]],
  ['Precisely related',[56,57,58,59,60]],
  ['Five ways to see it',[61,62,63,64,65]],
  ['What comes with what',[66,67,68,69,70]],
  ['A question of relation',[71,72,73,74,75]],
  ['Reason by resemblance',[76,77,78,79,80]],
  ['The subtler pattern',[81,82,83,84,85]],
  ['Meaning in the margins',[86,87,88,89,90]],
  ['A familiar idea, moved',[1,7,21,39,65]],
  ['Separate but similar',[2,8,26,53,45]],
  ['Another way of looking',[3,12,31,44,56]],
  ['The right comparison',[4,16,27,18,68]],
  ['Patterns in plain sight',[13,47,34,52,81]],
  ['Five borrowed shapes',[6,17,14,60,77]],
  ['Which way is the arrow',[9,23,15,76,88]],
  ['Match the thought',[10,24,35,57,83]],
  ['The meaning carries over',[11,28,38,64,74]],
  ['Consider the relationship',[85,36,50,59,86]],
  ['Think one step further',[32,33,51,61,79]],
  ['One last parallel',[40,46,37,63,89]],
];

function shuffle(items, seed) {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const PUZZLES = BOARDS.map(([title, entryNumbers], index) => {
  const id = `counterpart-${String(index + 1).padStart(3, '0')}`;
  const tiles = [];
  const rows = entryNumbers.map((entryNumber, row) => {
    const [a,b,c,d,relationship,explanation] = ENTRIES[entryNumber - 1];
    const answer = [`${id}-w${row * 2}`, `${id}-w${row * 2 + 1}`];
    tiles.push({ id: answer[0], word: c }, { id: answer[1], word: d });
    return { id: `${id}-r${row}`, sourceId: `analogy-${entryNumber}`, cue: [a,b], answer, relationship, explanation };
  });
  return { id, title, difficulty: index >= 10 ? 'Tricky' : 'Thoughtful', rows, tiles: shuffle(tiles, 20261020 + index * 101) };
});

export const COLLECTION = {
  name: 'Counterpart · Collection One',
  boards: 30,
  uniqueAnalogies: 90,
  totalRowAppearances: 150,
  note: 'Thirty authored boards. Each analogy appears once or twice; the daily collection repeats after thirty days.',
};
