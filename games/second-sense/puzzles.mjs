/** Original noun/verb clue pairs. Same spelling; pronunciation may change. */
const ENTRIES = [
  ['FENCE','Barrier enclosing a yard','Buy or sell stolen goods','A fence can mark a property boundary. To fence goods is to deal in stolen property.'],
  ['BARK','A tree’s protective outer layer','Make a sharp canine sound','Bark covers the outside of a tree. To bark is to make the characteristic sharp sound of a dog.'],
  ['WIND','Air moving through the atmosphere','Wrap thread around a reel','Wind is moving air. To wind thread is to wrap it around something. The pronunciation changes: the noun rhymes with pinned, the verb with find.'],
  ['TENDER','Small boat that serves a larger vessel','Formally offer a resignation or payment','A tender carries people or supplies to a larger vessel. To tender something is to offer it formally for acceptance.'],
  ['COURT','Room where a judge hears cases','Try to win someone’s affection','A court is a place where legal cases are heard. To court someone is to seek their affection.'],

  ['BOLT','Metal fastener used with a nut','Run away suddenly','A bolt fastens objects together with a nut. To bolt is to dash away suddenly.'],
  ['SEAL','Flippered marine mammal','Close so air cannot get through','A seal is a marine mammal. To seal an opening is to close it tightly against passage.'],
  ['SPRING','Coiled metal part that stores force','Leap suddenly upward','A spring is an elastic coil. To spring is to jump or leap suddenly.'],
  ['MATCH','Small stick with a flame-making tip','Correspond exactly','A match is a small fire-lighting stick. To match is to agree or correspond with something.'],
  ['DUCK','Waterbird with a broad, flat bill','Lower your head quickly to avoid something','A duck is a broad-billed waterbird. To duck is to lower yourself quickly out of the way.'],

  ['WATCH','Wrist-worn timepiece','Observe attentively','A watch tells the time. To watch is to look at or observe something attentively.'],
  ['ROCK','Solid natural mass of mineral material','Sway gently back and forth','A rock is a solid piece of natural mineral matter. To rock is to move back and forth.'],
  ['RING','Band worn on a finger','Make a bell sound','A ring can be worn as jewelry. To ring is to produce the clear sound associated with a bell.'],
  ['BEAR','Large, shaggy omnivorous mammal','Endure a heavy burden or hardship','A bear is a large mammal. To bear something is to carry or endure its weight or difficulty.'],
  ['BAT','Flying mammal active mostly at night','Strike a ball with a club','A bat is a flying mammal. To bat is to strike a ball with a sporting implement.'],

  ['CLUB','Organization whose members share an interest','Hit with a heavy stick','A club is an association of people. To club something is to hit it with a heavy stick.'],
  ['COACH','Long-distance passenger bus','Train an athlete','A coach is a passenger vehicle. To coach an athlete is to train and guide them.'],
  ['CRANE','Long-legged wading bird with a long neck','Stretch your neck for a better view','A crane is a tall wading bird. To crane your neck is to stretch it to see better.'],
  ['CROW','Glossy black bird with a harsh call','Boast triumphantly','A crow is a black bird. To crow over a success is to boast about it triumphantly.'],
  ['FLY','Small two-winged insect','Travel through the air','A fly is an insect. To fly is to move through the air.'],

  ['FOX','Bushy-tailed wild canine','Puzzle or outwit someone','A fox is a wild member of the dog family. To fox someone is to baffle or outwit them.'],
  ['HAWK','Hook-beaked bird of prey','Offer goods for sale with shouted calls','A hawk is a bird of prey. To hawk goods is to offer them for sale, often by calling out.'],
  ['PERCH','Spiny-finned freshwater fish, often striped','Settle on a narrow, raised support','A perch is a freshwater fish. To perch is to sit or settle on a raised support.'],
  ['QUAIL','Small ground-dwelling game bird','Shrink back in fear','A quail is a small game bird. To quail is to recoil or lose courage in fear.'],
  ['SWALLOW','Fork-tailed bird that catches insects in flight','Make food pass down your throat','A swallow is an insect-eating bird. To swallow is to make something pass down the throat.'],

  ['CARP','Freshwater fish often raised in ornamental ponds','Complain persistently about small faults','A carp is a freshwater fish. To carp is to complain or find fault repeatedly.'],
  ['FLOUNDER','Flat bony sea fish with both eyes on one side','Struggle clumsily without making progress','A flounder is a flatfish. To flounder is to struggle awkwardly or ineffectually.'],
  ['SKATE','Broad, flat sea fish related to rays','Glide over ice on bladed footwear','A skate is a fish related to rays. To skate is to glide on ice using blades under your feet.'],
  ['SMELT','Small silvery fish often cooked whole','Extract metal from ore using heat','A smelt is a small fish. To smelt ore is to process it with heat to obtain metal.'],
  ['CAN','Cylindrical metal food container','Dismiss an employee, informally','A can is a metal container. To can someone is an informal way to say dismiss them from a job.'],

  ['PERMIT','Official document granting permission','Allow an action','A permit is a document authorizing something. To permit an action is to allow it. The stressed syllable changes.'],
  ['OBJECT','Physical thing you can touch','Express disagreement','An object is a tangible thing. To object is to raise a disagreement or protest. The stressed syllable changes.'],
  ['RECORD','Flat vinyl disc played on a turntable','Set down information for future reference','A record can be a vinyl music disc. To record information is to preserve it for later. The stressed syllable changes.'],
  ['CONDUCT','A person’s behavior','Direct an orchestra','Conduct is the way someone behaves. To conduct an orchestra is to direct its performance. The stressed syllable changes.'],
  ['PRESENT','Gift given to someone','Introduce a speaker to an audience','A present is a gift. To present a speaker is to introduce them. The stressed syllable changes.'],

  ['PROJECT','Planned piece of work','Cast an image onto a screen','A project is a planned undertaking. To project an image is to cast it onto a surface. The stressed syllable changes.'],
  ['SUBJECT','Topic of a discussion','Make someone undergo an experience','A subject is what a discussion concerns. To subject someone to something is to make them undergo it. The stressed syllable changes.'],
  ['DESERT','Vast, extremely dry landscape','Abandon someone who needs you','A desert is a very dry region. To desert someone is to abandon them. The stressed syllable changes.'],
  ['REFUSE','Garbage awaiting disposal','Decline to accept an offer','Refuse is waste material. To refuse something is to decline it. The pronunciation and stressed syllable change.'],
  ['PRODUCE','Fresh fruit and vegetables at a market','Bring something into existence','Produce means fresh fruits and vegetables. To produce is to create or bring something forth. The stressed syllable changes.'],

  ['CONTENT','Material in a book or website','Make someone satisfied','Content is the material a publication contains. To content someone is to satisfy them. The stressed syllable changes.'],
  ['CONTEST','Competition for a prize','Challenge the truth or legality of something','A contest is a competition. To contest a claim is to challenge it. The stressed syllable changes.'],
  ['CONTRACT','Legally binding agreement','Become smaller or tighter','A contract is a binding agreement. To contract is to shrink or tighten. The stressed syllable changes.'],
  ['CONVERT','Person who has adopted a new faith','Change from one format to another','A convert is someone who has adopted a different faith or belief. To convert is to change form or format. The stressed syllable changes.'],
  ['BUFFET','Meal laid out for guests to serve themselves','Strike repeatedly, as waves do','A buffet is a self-service meal. To buffet something is to strike it repeatedly. The pronunciation changes: the meal ends in an ay sound; the verb does not.'],

  ['LEAD','Dense metal once common in water pipes','Guide someone along a route','Lead is a dense metal. To lead is to guide. The pronunciation changes: the metal rhymes with red, the verb with seed.'],
  ['SOW','Adult female pig','Scatter seeds for planting','A sow is a female pig. To sow is to plant seeds. The pronunciation changes: the animal rhymes with cow, the verb with go.'],
  ['TEAR','Drop produced by a crying eye','Pull something apart by ripping','A tear is a drop from the eye. To tear is to rip. The pronunciation changes: the noun rhymes with near, the verb with care.'],
  ['ROW','Line of seats next to one another','Propel a boat with oars','A row is a line of things placed beside one another. To row is to move a boat using oars.'],
  ['BOW','Ribbon tied into two loops','Bend at the waist as a greeting','A bow is a looped ribbon knot. To bow is to bend in greeting or respect. The pronunciation changes: the ribbon rhymes with go, the verb with cow.'],

  ['PAWN','Chess piece that usually advances one square','Leave an item as security for a loan','A pawn is a chess piece. To pawn an item is to leave it as collateral for a loan.'],
  ['CHECK','Written order directing a bank to pay money','Examine for accuracy','A check is a written payment instruction to a bank. To check something is to examine it for accuracy.'],
  ['DRAFT','Current of cool air inside a room','Select someone for compulsory military service','A draft is a current of air. To draft someone is to select them for compulsory service.'],
  ['PITCH','Dark, sticky substance used for waterproofing','Throw a baseball toward a batter','Pitch is a dark, sticky material. To pitch a baseball is to throw it toward the batter.'],
  ['PLOT','Small piece of land','Plan something secretly','A plot is a piece of land. To plot is to make a secret plan.'],

  ['PORT','Fortified wine often served after dinner','Adapt software to a different operating system','Port is a fortified wine. To port software is to adapt it so it runs on a different system.'],
  ['FILE','Rough metal tool used to smooth a surface','Submit paperwork officially','A file is an abrasive hand tool. To file paperwork is to submit it to the appropriate office or system.'],
  ['BOARD','Long, flat piece of lumber','Get onto a bus, ship, or plane','A board is a flat piece of wood. To board a vehicle is to get on it.'],
  ['DOCK','Landing place for ships','Reduce someone’s pay as a penalty','A dock is a place where a ship lands. To dock pay is to subtract an amount from it.'],
  ['QUARRY','Animal being pursued by a hunter','Extract building stone from an excavation','A quarry is an animal being hunted. To quarry is to extract stone from the ground. These senses have different historical origins.'],

  ['MINE','Explosive device hidden in the ground','Extract ore from the earth','A mine can be an explosive device. To mine is to extract useful material from the earth.'],
  ['PLANT','Living thing with roots, stems, and leaves','Place evidence secretly to mislead','A plant is a rooted living organism. To plant evidence is to put it somewhere secretly to mislead others.'],
  ['ROOT','Underground part that takes in water','Cheer for a team or person','A root takes in water beneath the ground. To root for someone is to support or cheer for them.'],
  ['STEM','Main stalk of a flower','Stop or check the flow of something','A stem is a plant’s stalk. To stem a flow is to stop or restrain it.'],
  ['STOCK','Liquid base made by simmering bones or vegetables','Keep a supply of goods for sale','Stock is a flavorful liquid used in cooking. To stock goods is to keep a supply available.'],

  ['TANK','Armored military vehicle with continuous tracks','Fail spectacularly, informally','A tank is an armored tracked vehicle. To tank is an informal way to say fail badly.'],
  ['TRAIN','Connected railway cars pulled by an engine','Teach a skill through repeated practice','A train is a series of railway cars. To train someone is to develop their skill through instruction and practice.'],
  ['BUS','Large road vehicle carrying many passengers','Clear dirty dishes from restaurant tables','A bus carries passengers by road. To bus tables is to clear away used dishes.'],
  ['FIELD','Open stretch of land used for crops or games','Handle a question without preparation','A field is an open area of land. To field a question is to receive and handle it.'],
  ['TABLE','Furniture with a flat top and legs','Postpone consideration of a proposal, in U.S. usage','A table is a piece of furniture. In U.S. usage, to table a proposal is to put off considering it; British usage can differ.'],

  ['PRUNE','Plum preserved by drying','Trim unwanted branches from a plant','A prune is a dried plum. To prune is to cut back branches or growth.'],
  ['DATE','Sweet fruit of a palm','Go out romantically with someone','A date is a palm fruit. To date someone is to go out with them romantically.'],
  ['SQUASH','Vegetable such as a zucchini or pumpkin','Crush by pressing firmly','A squash is a vegetable in the gourd family. To squash something is to crush it under pressure.'],
  ['SEASON','One of a year’s recurring weather periods','Add salt, herbs, or spices to food','A season is a recurring division of the year. To season food is to add flavoring.'],
  ['JAM','Fruit preserve spread on toast','Block a mechanism so it cannot move','Jam is a fruit preserve. To jam a mechanism is to block or immobilize its movement.'],
];

const TITLES = [
  'A word with another life','Look at it another way','Familiar words, unfamiliar turns',
  'The other reading','Change your point of view','Not the meaning you expected',
  'Listen differently','The stress of meaning','Read it twice','Same letters, new sound',
  'A second line of thought','More than one use','The word underneath','Try a different sense',
  'Something else entirely','Another side to the story','Both things can be true','The hidden reading',
  'A little semantic shift','Meaning in motion','Five alternate lives','A turn of the tongue',
  'The unfamiliar familiar','Read around the obvious','A word to reconsider','Past the first thought',
  'Look again','The double life of words','Find the second sense','One spelling, two stories',
];

// Fifteen original boards and fifteen explicitly reviewable recombinations.
// Each group of five later boards takes one word from each of five earlier
// boards. Every word occurs exactly twice, 11–19 board positions apart.
const BOARDS = Array.from({ length: 15 }, (_, board) => Array.from({ length: 5 }, (_, slot) => board * 5 + slot));
for (let group = 0; group < 3; group++) {
  for (let offset = 0; offset < 5; offset++) {
    BOARDS.push(Array.from({ length: 5 }, (_, board) => (group * 5 + board) * 5 + ((board + offset) % 5)));
  }
}

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

export const PUZZLES = BOARDS.map((entries, index) => {
  const id = `second-sense-${String(index + 1).padStart(3, '0')}`;
  const nouns = [], verbs = [];
  const pairs = entries.map((entryIndex, pairIndex) => {
    const [word,nounClue,verbClue,explanation] = ENTRIES[entryIndex];
    const nounId = `${id}-n${pairIndex}`, verbId = `${id}-v${pairIndex}`;
    nouns.push({ id: nounId, clue: nounClue });
    verbs.push({ id: verbId, clue: verbClue });
    return { nounId, verbId, word, answers: [word], explanation, sourceId: `sense-${word.toLowerCase()}` };
  });
  const shuffledNouns = shuffle(nouns, 5102026 + index * 73);
  let shuffledVerbs = shuffle(verbs, 10192026 + index * 137);
  if (shuffledNouns.every((noun, i) => pairs.find(pair => pair.nounId === noun.id).verbId === shuffledVerbs[i].id)) {
    shuffledVerbs = [...shuffledVerbs.slice(1), shuffledVerbs[0]];
  }
  return { id, title: TITLES[index], difficulty: index < 4 ? 'Thoughtful' : 'Tricky', nouns: shuffledNouns, verbs: shuffledVerbs, pairs };
});

export const COLLECTION = {
  name: 'Second Sense · Collection One',
  boards: 30,
  uniqueWords: 75,
  totalPairAppearances: 150,
  note: 'Thirty boards from seventy-five original noun/verb pairs. Each pair appears twice; the daily collection repeats after thirty days.',
};
