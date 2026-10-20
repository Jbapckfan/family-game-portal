// Offline editorial tool. No dictionary, generator, or network is used at play time.
// The word bank and clues below are authored for Tradeoff. Board composition is
// deterministic and checked by tests/puzzles.test.mjs.
import { writeFileSync } from 'node:fs';

const BANK = `
CRANE|A bird that shares its name with a lifting machine|A tall wading bird, or a machine that lifts heavy loads.
CRATE|A box with a shipping label|A sturdy container used to transport goods.
GRATE|Make cheese fall like snow|To shred food against a rough metal surface.
GRAPE|A little fruit with big wine ambitions|A small fruit that grows in bunches.
GRADE|A teacher's final letter|A mark given for schoolwork.
TRADE|A deal with something on both sides|An exchange of goods or services.
TRACE|Follow the faintest outline|To copy a drawing by following its lines.
TRACK|Where runners go in circles|A prepared course for running races.
TRICK|A magician's secret ingredient|An action designed to deceive or surprise.
TRUCK|A vehicle with a working bed|A road vehicle built to carry goods.
TRUNK|An elephant's multipurpose nose|The long flexible nose of an elephant.
DRANK|Made a beverage disappear|The past tense of consuming a liquid.
DRINK|A toast's liquid companion|A beverage, or the act of consuming one.
BLINK|The shortest break your eyes take|To close and reopen your eyes quickly.
BLANK|What a mind sometimes draws|Empty, with nothing written or marked.
BLACK|The color of a moonless sky|The darkest color.
BLOCK|A cube, or a way to stop someone|A solid piece with flat sides.
CLOCK|A face that tells you when|A device that displays the time.
CLOAK|A cape with something to hide|A loose outer garment worn over the shoulders.
CROAK|A frog's contribution to the choir|The rough sound a frog makes.
CROOK|A thief, or a bend in a shepherd's staff|A dishonest person who steals.
BROOK|A stream on the smaller side|A small natural stream of water.
BROOM|A floor cleaner with no battery|A brush on a long handle used for sweeping.
BLOOM|A flower's big entrance|A flower, or the act of opening into one.
GLOOM|A room's mood when the light gives up|Darkness or a feeling of sadness.
GROOM|One half of a wedding couple|A man on his wedding day.
GRAIN|A single speck from a sandy beach|A tiny particle of sand, or a cereal seed.
DRAIN|Where the bathwater goes|A pipe that carries water away.
BRAIN|The headquarters inside your head|The organ responsible for thought and memory.
TRAIN|A ride that sticks to its rails|A connected series of railroad cars.
TRAIL|A hiker's line through the woods|A marked path through natural surroundings.
FRAIL|Handle this person with extra care|Physically weak or easily injured.
SNAIL|A traveler who brings the house|A small animal with a spiral shell.
SNARE|A trap with a loop in its plan|A loop of wire or cord used as a trap.
SHARE|Give someone a piece|To let another person have or use part of something.
SHARK|An ocean predator with a fin to announce it|A large fish with a skeleton made of cartilage.
SHARP|Ready to cut, or quick to understand|Having an edge that can slice easily.
SHAPE|A circle is one; so is a square|The outline or form of an object.
SHADE|A tree's gift on a hot day|A place sheltered from direct sunlight.
SHAME|The feeling after a regrettable choice|A painful feeling about something dishonorable.
SHAVE|Give your whiskers a close call|To remove hair with a razor.
SHAKE|A milk drink, or a nervous movement|To move back and forth rapidly.
STAKE|A pointed post with something riding on it|A pointed piece of wood driven into the ground.
STALE|Past its prime, like yesterday's bread|No longer fresh.
STARE|A look that overstays its welcome|To look at something for a long time.
STAGE|Where the actors take their places|A raised platform for performances.
STATE|Kansas is one; so is Maine|A political division of a country.
SLATE|A rock that once did classroom duty|A fine-grained rock used for roofing and writing boards.
PLATE|Dinner's landing pad|A flat dish used to hold food.
PLANE|A passenger ride above the clouds|An aircraft with fixed wings.
PLACE|A spot that can be on the map|A particular position or location.
PEACE|The quiet after everyone agrees|Freedom from war or conflict.
PEACH|A fuzzy fruit with a stone inside|A sweet fruit with velvety skin and a large pit.
BEACH|Where sand meets the sea|A sandy or pebbly shore beside water.
BENCH|A seat with room for company|A long seat for several people.
BUNCH|How bananas like to hang out|A group of things gathered together.
LUNCH|The meal in the middle|A meal usually eaten around midday.
PUNCH|A party drink with a fighting name|A drink often made with several fruit juices.
PINCH|A cook's smallest finger measurement|A small amount held between finger and thumb.
PITCH|A sales talk, or a baseball delivery|A throw of the ball toward a batter.
PATCH|A small fix for a hole|A piece of material used to cover damage.
WATCH|A little timekeeper on your wrist|A small clock worn on the body.
MATCH|A tiny stick that starts a flame|A small stick with a head that ignites when struck.
BATCH|One oven load of cookies|A group of things made at the same time.
HATCH|A chick's first escape|To come out of an egg.
CATCH|What a fielder hopes to make|To stop and hold something moving through the air.
LATCH|A little catch that keeps a gate shut|A fastening device for a door or gate.
LATER|The time procrastinators prefer|At a time after the present.
WATER|What a thirsty plant is waiting for|The clear liquid essential for life.
WAFER|A cookie that keeps a slim profile|A very thin, crisp biscuit.
WAGER|Put money behind your prediction|A bet on an uncertain result.
WAGES|What working hours should bring in|Money paid to someone for their work.
PAGES|The leaves of a book|The individual sheets in a book.
PAPER|A printer's favorite blank canvas|A thin material used for writing and printing.
TAPER|Gradually get narrower|To become thinner toward one end.
TAPES|Old-school music holders with two reels|Magnetic strips used to record sound or video.
TALES|Stories told around the campfire|Narratives, especially imaginative ones.
TILES|Pieces that make a mosaic|Flat pieces used to cover floors or walls.
TIRES|The four rubber rings under most cars|Rubber coverings around wheels.
TIRED|Ready to call it a night|In need of rest or sleep.
FIRES|What campgrounds allow only in certain spots|Burning flames that produce heat.
FARES|The prices of getting there|Charges paid to ride public transportation.
FARMS|Places where crops are a main event|Areas of land used for growing food or raising animals.
WORMS|Garden residents that work underground|Long, soft-bodied animals with no limbs.
WORDS|A sentence's building blocks|Units of language that carry meaning.
CARDS|A deck's individual pieces|Small printed rectangles used in many games.
BOUND|Headed somewhere, as in homeward|Going toward a particular destination.
ROUND|No corners here|Having a circular shape.
SOUND|What your ears are tuned to|Vibrations that can be heard.
FOUND|What a successful search finally did|Discovered something that had been missing.
POUND|Sixteen ounces, or a heavy thump|A unit of weight equal to sixteen ounces.
MOUND|A pitcher's little hill|A raised pile of earth.
HOUND|A dog with a nose for the chase|A type of dog bred for hunting.
CROWN|A ruler's fancy headwear|A ceremonial headpiece worn by a monarch.
BROWN|Chocolate, color-wise|The color of chocolate or dark wood.
FROWN|A smile turned upside down|An unhappy expression with lowered eyebrows.
GROWN|No longer the little version|Having developed into an adult or full size.
GROAN|The soundtrack to a terrible pun|A low sound of pain or disapproval.
CHAIR|A table's usual companion|A seat for one person, usually with a back.
CHAIN|Links that stick together|A series of connected metal links.
HEART|A tireless pump with a romantic reputation|The organ that pumps blood through the body.
HEARD|Caught it with your ears|Perceived a sound.
YEARS|A birthday counts these|Periods of twelve months.
TEARS|What onions sometimes bring out|Drops of liquid that come from the eyes.
PEARS|Fruits with narrow tops and wide bottoms|Sweet fruits related to apples.
BEARS|Large animals that may sleep through winter|Large mammals including grizzlies and polar varieties.
GEARS|Teeth that help a machine change speed|Toothed wheels that transmit motion.
FEARS|Things that keep courage busy|Feelings of being afraid.
LEAPS|Jumps with a little extra ambition|Large jumps through the air.
LEADS|What the person in front does|Guides others by going first.
LEAFY|Full of the green parts of plants|Covered with many leaves.
LEAKY|Not doing a great job holding water|Allowing liquid to escape through holes.
LEAKS|Drips where there should not be drips|Unwanted escapes of liquid or gas.
LEANS|Tilts without quite falling|Slants or rests at an angle.
LEARN|Turn curiosity into knowledge|To gain knowledge or a new skill.
YEARN|Want something with your whole heart|To have a strong longing.
LIGHT|The opposite of heavy, or what a lamp gives|Something that makes objects visible.
NIGHT|The sun's daily absence|The dark period between sunset and sunrise.
RIGHT|A direction that is also correct|Correct, or the opposite of left.
MIGHT|Strength, or a word that leaves room for doubt|Power or great strength.
FIGHT|A contest where fists may do the talking|A physical struggle or serious argument.
SIGHT|The sense that lets you enjoy a view|The ability to see.
TIGHT|Not leaving much wiggle room|Firmly held or fitting very closely.
PAINT|Color that comes in a can|A colored coating applied with a brush or roller.
FAINT|So weak you can barely see it|Very slight or hard to detect.
TAINT|Spoil an otherwise good reputation|To contaminate or damage the quality of something.
SAINT|A very holy person, or an unusually patient one|A person recognized for exceptional holiness.
CARVE|Turn wood into a sculpture|To shape material by cutting pieces away.
CURVE|A line that refuses to go straight|A smoothly bending line.
SHIRT|A top with sleeves and a collar, perhaps|A garment worn on the upper body.
SHORT|The opposite of tall or lengthy|Small in height or length.
SHORE|Where the water comes to land|The edge of a sea, lake, or river.
HORSE|A rider's four-legged partner|A large hoofed animal used for riding.
HOUSE|A building that can become a home|A building in which people live.
MOUSE|A tiny rodent, or a computer companion|A small rodent with a long tail.
MOOSE|A huge deer with broad antlers|A large deer found in northern forests.
GOOSE|A honking bird with a long neck|A large waterbird related to ducks.
NOOSE|A loop that tightens when pulled|A sliding loop at the end of a rope.
BREAD|What sandwiches are built on|Food baked from flour, water, and usually yeast.
BROAD|Wide enough to make room|Having a large width.
BROOD|A group of newly hatched chicks|A family of young birds hatched together.
BLOOD|The red delivery system inside you|The fluid that circulates through the body.
FLOOD|Water that ignores its usual boundaries|An overflow of water onto normally dry land.
FLOOR|The part of a room beneath your feet|The lower surface of a room.
FLOUR|A baker's powdery starting point|Powder made by grinding grain.
FLOUT|Openly disregard a rule|To show deliberate disregard for a law or convention.
FLOAT|Stay on top of the water|To remain on the surface of a liquid.
GLOAT|Enjoy winning a little too obviously|To take excessive pleasure in one's own success.
COAST|The edge of a country facing the sea|The land beside an ocean.
TOAST|Bread after a trip through the heater|Bread browned by exposure to heat.
BOAST|Talk yourself up a little too much|To speak with excessive pride.
BOOST|A helpful little lift|An increase or encouraging push.
ROAST|Cook with dry heat|To cook food in an oven or over a fire.
ROOST|A bird's place to settle for the night|A place where birds rest or sleep.
ROOTS|A plant's underground anchors|The parts of a plant that absorb water from soil.
BOOTS|Footwear that rises above the ankle|Sturdy shoes that cover the ankles or lower legs.
BOOTH|A cozy restaurant seat with its own sides|A small enclosed seating area or stall.
TOOTH|A smile's individual piece|A hard structure in the mouth used for biting.
TEETH|A smile's complete cutting crew|The hard structures used for biting and chewing.
TENTH|The place just after ninth|The ordinal number after ninth.
TENSE|Not exactly relaxed|Nervous or tightly stretched.
DENSE|Packed in very closely|Containing many things in a small space.
SENSE|One of the ways you notice the world|A faculty such as sight, hearing, or touch.
TERSE|Using very few words|Brief and direct in expression.
VERSE|A poem's lines, or part of a song|A section of poetry or song lyrics.
VERGE|Right on the edge of happening|The edge or brink of something.
MERGE|Become one where two used to be|To combine two things into one.
SPORE|A fungus's tiny reproductive package|A reproductive cell produced by fungi and some plants.
SNORE|An unwanted solo from a sleeping person|To breathe noisily while asleep.
SNORT|A sudden noisy breath through the nose|To expel air noisily through the nostrils.
SKIRT|A garment that hangs from the waist|Clothing that covers the body below the waist.
SKILL|Practice is how you earn this|An ability to do something well.
SPILL|A drink's unexpected escape|To let liquid accidentally run out of its container.
STILL|Not moving, even a little|Remaining motionless.
STALL|A market seller's little space|A booth or compartment used for selling goods.
SMALL|Not taking up much room|Little in size or amount.
SMELL|The sense that finds fresh cookies first|The ability to detect odors.
SHELL|A turtle's built-in protection|A hard outer covering that protects an animal.
SHAWL|A wrap that gives shoulders some warmth|A large piece of cloth worn over the shoulders.
SHIRK|Avoid doing your fair share|To evade a duty or responsibility.
SPINE|A book and a body both have one|The backbone, or the bound edge of a book.
SPITE|The urge to annoy just for the sake of it|A desire to hurt or upset another person.
SPICE|A little seasoning with a big personality|An aromatic substance used to flavor food.
SLICE|A pizza's most shareable unit|A thin piece cut from something larger.
SLIDE|A playground ride with gravity on its side|A smooth sloping surface for moving downward.
GLIDE|Move smoothly with very little effort|To travel with a smooth, continuous motion.
GLARE|A harsh light, or a harsher look|An intense, dazzling light.
FLARE|A bright signal for someone in trouble|A bright burning light used as a signal.
FLAME|The bright moving part of a fire|A stream of burning gas that gives off heat and light.
FRAME|A picture's finishing border|A structure that surrounds and supports a picture.
GRIME|Dirt that has made itself at home|A thick layer of ingrained dirt.
GRAVE|A resting place beneath a headstone|A hole in the ground where a body is buried.
GRACE|Elegance that makes effort look easy|Smoothness and beauty of movement.
BRACE|Something that supports a weak joint|A device used to support or strengthen something.
BRAKE|The pedal that asks a car to slow down|A mechanism used to slow or stop a vehicle.
BRAVE|Afraid, perhaps, but doing it anyway|Showing courage in the face of danger.
BRIDE|One half of a wedding couple|A woman on her wedding day.
BRINE|A salty bath for pickles|Water containing a large amount of dissolved salt.
BRING|Carry it toward the person asking|To take something to a place or person.
WRING|Twist the water out of a towel|To squeeze liquid out by twisting.
WRITE|Turn thoughts into marks on a page|To form words on a surface or screen.
WHITE|The color of fresh snow|The palest color.
WHILE|A little stretch of time|A period of time.
WHINE|Complain in a high, unhappy voice|To make a long, high-pitched complaining sound.
SHINE|Do what polished silver does|To give out or reflect bright light.
SWINE|Pigs, collectively speaking|Domestic pigs considered as a group.
SWING|A playground seat that goes back and forth|A seat suspended by ropes or chains.
STING|A bee's painful parting gift|A sharp painful jab from an insect.
STINK|Offend the nose|To have a very unpleasant smell.
STINT|A stretch of time doing one job|A period spent doing a particular task.
STUNT|A daring feat for the cameras|A dangerous or impressive physical performance.
SHUNT|Move something onto a different track|To divert something onto another path.
CHUNK|A piece that is too big to call a crumb|A large, thick piece of something.
CHUCK|Throw it without much ceremony|To toss something carelessly.
SHUCK|Peel the husk off an ear of corn|To remove an outer husk or shell.
SHOCK|A jolt that catches you off guard|A sudden unexpected surprise or electrical jolt.
STOCK|A shop's supply of things to sell|Goods kept ready for sale or use.
STICK|A small branch that makes a dog's day|A thin piece of wood from a tree.
STACK|A neat pile with one thing on another|A pile of objects arranged on top of each other.
SLACK|Not pulled tight|Loose rather than taut.
SLINK|Move quietly, hoping nobody notices|To move stealthily or furtively.
CLINK|The little sound of glasses meeting|A short ringing sound made by glass or metal.
CLANK|A heavier cousin of a metallic chink|A loud sound made by heavy metal objects striking.
CLASH|A loud meeting of things that do not agree|A collision or conflict between opposing things.
CLASS|A group gathered to learn|A group of students taught together.
GLASS|A clear material that can shatter|A hard transparent material used in windows.
GRASS|The green carpet that needs mowing|A plant with narrow green blades.
GROSS|The amount before deductions|A total before costs or taxes are removed.
CROSS|Go from one side to the other|To pass across something.
CLOVE|A little aromatic bud with a strong flavor|A dried flower bud used as a spice.
GLOVE|A hand covering with room for every finger|A fitted covering for the hand.
GLOBE|The world you can spin on a desk|A spherical model of Earth.
GLADE|A clearing with trees all around|An open space in a forest.
BLADE|The business end of a knife|The sharp cutting part of a tool.
BLAME|Point the finger over what went wrong|To hold someone responsible for a fault.
FLAKE|One small piece of falling snow|A thin, flat piece that has broken off something.
FLUKE|A lucky result that is hard to repeat|An unlikely chance occurrence.
FLUTE|A wind instrument held sideways|A woodwind instrument played by blowing across a hole.
FLASH|A very quick burst of light|A sudden brief bright light.
FLASK|A small bottle built for carrying|A small container used to hold liquids.
CHEAT|Break the rules to gain an advantage|To act dishonestly in a game or test.
WHEAT|The grain behind many loaves|A cereal grain commonly ground into flour.
SWEAT|Your body's built-in cooling system|Moisture produced by the skin to cool the body.
SWEET|The flavor sugar brings to the party|Having a taste like sugar or honey.
SHEET|A bed's thin layer of fabric|A large rectangular piece of cloth used on a bed.
SHEEP|A woolly member of the flock|A farm animal raised for wool and meat.
SLEEP|What an alarm clock rudely interrupts|A natural state of rest with reduced awareness.
SLEET|Winter weather that cannot quite pick a side|Rain that freezes into ice pellets.
FLEET|A group of ships under one command|A collection of ships or vehicles.
FLESH|The soft part beneath the skin|The soft tissue of a body.
FLUSH|Send the toilet's water on its way|To wash away with a rush of water.
BLUSH|A face's pink response to embarrassment|To become red in the face.
BRUSH|A tool for hair, teeth, or paint|A tool with bristles used for cleaning or grooming.
CRUSH|Press until the original shape is gone|To squeeze or smash with force.
CRUST|The outside edge of a loaf|The hard outer layer of bread.
TRUST|Believe someone will come through|Confidence in someone's honesty or reliability.
`.trim().split('\n').map(line => {
  const [word, clue, hint] = line.split('|');
  return { word, clue, hint };
});

for (const item of BANK) {
  if (!/^[A-Z]{5}$/.test(item.word) || !item.clue || !item.hint) {
    throw new Error(`Invalid editorial word-bank entry: ${item.word}`);
  }
}
if (new Set(BANK.map(item=>item.word)).size !== BANK.length) {
  throw new Error('Duplicate word-bank entry');
}

const words = new Map(BANK.map(item => [item.word, item]));
const edges = [];
for (const start of BANK) {
  for (const answer of BANK) {
    const changed = [...start.word].map((letter,index) => letter === answer.word[index] ? -1 : index).filter(index => index >= 0);
    if (changed.length !== 1) continue;
    const at = changed[0];
    edges.push({start:start.word,answer:answer.word,clue:answer.clue,hint:answer.hint,old:start.word[at],next:answer.word[at],at});
  }
}

let seed = 0x20261020;
function random() {
  seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function shuffle(items) {
  const copy = [...items];
  for (let i=copy.length-1;i>0;i--) {
    const j = Math.floor(random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
const first = [['CRANE','CRATE'],['STARE','SHARE'],['HATCH','CATCH'],['CROWN','BROWN'],['BOUND','ROUND'],['CHAIR','CHAIN']].map(([start,answer]) => ({start,answer,clue:words.get(answer).clue,hint:words.get(answer).hint}));
const output = [{id:'p001',title:'The first trade',difficulty:'Gentle',rows:first,par:5}];
const signature = rows => rows.map(row => `${row.start}:${row.answer}`).sort().join('|');
const signatures = new Set([signature(first)]);
const usage = new Map(first.flatMap(row => [row.start,row.answer]).map(word => [word,1]));
const byOld = new Map();
for (const edge of edges) {
  if (!byOld.has(edge.old)) byOld.set(edge.old,[]);
  byOld.get(edge.old).push(edge);
}
const titles = ['A fair exchange','Changing hands','Pass it on','Small change','The long way round','A clever exchange','In good hands','A fresh perspective','Trading places','A little give and take','The missing piece','One good turn','New arrangements','A change of heart','Passing thoughts','Give it a spin','A quiet shuffle','Good connections'];
// Difficulty is an editorial estimate, not a calibrated player percentile.
const lessFamiliar = new Set(['TAINT','TERSE','FLOUT','SHUNT','SHUCK','SHIRK','BRINE','GLADE','SPORE','SLEET','SNARE','FRAIL','FLUKE','WAGER','VERGE','BROOD']);
function difficulty(rows) {
  const count = rows.filter(row => lessFamiliar.has(row.start) || lessFamiliar.has(row.answer)).length;
  return count >= 2 ? 'Tricky' : count === 1 ? 'Clever' : 'Gentle';
}

function findCycle() {
  const starts = shuffle(edges).sort((a,b) => (usage.get(a.start)||0)+(usage.get(a.answer)||0)-(usage.get(b.start)||0)-(usage.get(b.answer)||0));
  let attempts = 0;
  function search(path, letters, usedWords) {
    if (++attempts > 4000) return null;
    const last = path.at(-1);
    const options = shuffle(byOld.get(last.next)||[]).sort((a,b) => (usage.get(a.start)||0)+(usage.get(a.answer)||0)-(usage.get(b.start)||0)-(usage.get(b.answer)||0));
    for (const candidate of options) {
      if (usedWords.has(candidate.start)||usedWords.has(candidate.answer)) continue;
      if (path.length === 5) {
        if (candidate.next !== path[0].old) continue;
        const result = [...path,candidate];
        if (new Set(result.map(edge=>edge.at)).size < 3) continue;
        if (signatures.has(signature(result))) continue;
        // Keep each board distinguishable from every previous board.
        const pairs = new Set(result.map(row => `${row.start}:${row.answer}`));
        if (output.some(puzzle => puzzle.rows.filter(row => pairs.has(`${row.start}:${row.answer}`)).length > 3)) continue;
        return result;
      }
      if (letters.has(candidate.next)) continue;
      const found = search([...path,candidate],new Set([...letters,candidate.next]),new Set([...usedWords,candidate.start,candidate.answer]));
      if (found) return found;
    }
    return null;
  }
  for (const first of starts) {
    attempts=0;
    const found=search([first],new Set([first.old,first.next]),new Set([first.start,first.answer]));
    if (found) return shuffle(found);
  }
  return null;
}

while (output.length < 90) {
  const cycle = findCycle();
  if (!cycle) throw new Error(`Could not produce board ${output.length+1}`);
  const rows = cycle.map(({start,answer,clue,hint}) => ({start,answer,clue,hint}));
  signatures.add(signature(rows));
  for (const row of rows) for (const word of [row.start,row.answer]) usage.set(word,(usage.get(word)||0)+1);
  const count=output.length;
  output.push({id:`p${String(count+1).padStart(3,'0')}`,title:titles[(count-1)%titles.length],difficulty:difficulty(rows),rows,par:5});
}

writeFileSync(new URL('../puzzles.mjs',import.meta.url), `// Tradeoff starter collection. Ninety deterministic boards from an authored word/clue bank.\n// Each board conserves letters and forms one six-letter cycle: five swaps is optimal.\n// Generated offline with scripts/generate-puzzles.mjs; no runtime content generation.\nexport const PUZZLES = ${JSON.stringify(output,null,2)};\n`);
console.log(JSON.stringify({boards:output.length,authoredWords:BANK.length,eligibleDirectedPairs:edges.length,usedWords:usage.size,mostUsed:Math.max(...usage.values())}));
