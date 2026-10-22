/** Original clue bank and deterministic Sideways construction. No runtime dictionary or API. */
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rotateStrip } from '../engine.mjs';

const authored = `
ACORN|An oak's future, inside a shell
ACTOR|Person paid to play someone else
ALBUM|Tracks collected under one title
ALERT|Watchful and ready to react
ALIEN|Visitor from another world
ALLEY|Narrow passage between buildings
AMBER|Fossil resin with a golden glow
ANGEL|Heavenly messenger with wings
ANGLE|What a protractor measures
ANKLE|Joint just above the foot
APPLE|Fruit at the center of a classic pie
APRON|Cook's protection from splatters
ARENA|Venue with spectators around the action
ARMOR|Protective covering worn into battle
AROMA|Smell that might draw you into a bakery
ARROW|Pointed mark showing a direction
ATLAS|Book that helps you find your place
AUDIO|The sound portion of a recording
AWARD|Recognition presented to a winner
BACON|Crisp breakfast strips from a skillet
BADGE|Small symbol of rank or membership
BAGEL|Ring-shaped bread often served toasted
BAKER|Person who turns dough into loaves
BANJO|Stringed instrument with a round body
BARGE|Flat-bottomed boat for heavy cargo
BASIL|Fragrant herb often used in pesto
BASIN|Wide bowl for holding water
BEACH|Where the shore meets sunbathers
BEAST|A large or fearsome animal
BENCH|Seat shared by several people
BERRY|Small juicy fruit, often in a cluster
BIRCH|Tree known for its pale peeling bark
BIRTH|The beginning of a person's life
BLADE|The cutting part of a knife
BLANK|Space waiting to be filled in
BLAST|Sudden burst from an explosion
BLAZE|Fire burning fiercely
BLEAK|Cold and without much hope
BLEND|Combine until the parts mix together
BLIMP|Airship without a rigid frame
BLINK|Close and open your eyes quickly
BLOCK|A solid piece, or one city section
BLOOM|A flower at its fullest
BLUFF|Pretend to hold a stronger hand
BLUSH|Turn pink with embarrassment
BOARD|Flat piece of lumber
BONUS|Something extra beyond the usual
BOOTH|Small enclosed space at a fair
BOUND|Leap forward in a single jump
BRACE|Support worn around an injured joint
BRAID|Interwoven strands of hair
BRAIN|Organ that does the thinking
BRAKE|What slows a moving bicycle
BRAND|Name that identifies a product line
BRASS|Yellow alloy used in some instruments
BREAD|Dough after baking
BRICK|Building block fired in a kiln
BRIDE|Woman on her wedding day
BRIEF|Lasting only a short time
BROOK|Small stream running through the woods
BROOM|Tool that sweeps a floor
BRUSH|Tool with bristles
BUDDY|A close and friendly companion
BULGE|Rounded part that sticks outward
BUNCH|Bananas sold together
BURST|Pop open suddenly
CABIN|Small house away from the city
CABLE|Thick bundle of wires
CAMEL|Desert animal with a hump
CANAL|Artificial channel for boats
CANDY|Sweet treat from a wrapper
CANOE|Narrow boat moved with a paddle
CARGO|Goods carried by a ship
CAROL|Festive song heard in December
CEDAR|Aromatic wood used in some closets
CHAIN|Connected metal links
CHAIR|Seat for one person
CHALK|Stick that leaves marks on a blackboard
CHANT|Words repeated in a steady rhythm
CHARM|Small ornament on a bracelet
CHART|Visual display of information
CHASE|Run after someone or something
CHEEK|Part of the face beside the mouth
CHEER|Shout of encouragement
CHESS|Board game ending in checkmate
CHEST|Box that might hold buried treasure
CHIEF|Person in charge of a group
CHIME|A clear ringing sound from a bell
CHIRP|Short high sound made by a bird
CHOIR|Group that sings together
CHORD|Several musical notes played together
CHORE|Routine task around the house
CIDER|Drink pressed from apples
CLAMP|Tool that holds pieces tightly together
CLASP|Fastener on a necklace
CLASS|Students taught as one group
CLERK|Worker who keeps records or serves customers
CLIFF|A steep face of rock
CLOCK|Face with hands that tell time
CLOTH|Material woven from fibers
CLOUD|Visible mass of droplets in the sky
CLOWN|Circus performer with a painted face
COACH|Person who helps a team improve
COAST|Land along the edge of the sea
COBRA|Snake that can spread a hood
COCOA|Warm chocolate drink
COMET|Icy visitor with a glowing tail near the sun
CORAL|Reef-building marine organism
COUCH|Long cushioned seat
COUGH|Sudden noisy expulsion of air from the lungs
COURT|Where a judge hears a case
COVER|Put something over the top
CRAFT|Skill used to make things by hand
CRANE|Wading bird with a long neck
CRATE|Slatted box used for shipping
CRAWL|Move along on hands and knees
CREAM|Rich layer that rises in milk
CREEK|Small natural waterway
CREST|The highest part of a wave
CRISP|Firm enough to make a crunch
CROWD|Many people gathered together
CROWN|Headwear that signals royalty
CRUMB|Tiny piece left from a cookie
CRUST|Outer layer of a loaf
CURVE|Line that bends smoothly
DAIRY|Farm that produces milk
DAISY|Flower with petals around a yellow center
DANCE|Move your body to music
DECOY|Fake object meant to draw attention
DELTA|River-mouth land shaped by sediment
DEPTH|Distance from the surface to the bottom
DIARY|Book of private daily thoughts
DIGIT|One symbol in a written number
DITCH|Long narrow trench
DOUBT|Feeling of being unsure
DOUGH|Unbaked mixture for bread
DRAFT|Rough first version of a piece of writing
DRAIN|Outlet that carries water away
DRAMA|Story performed by actors
DREAM|Story your mind creates while asleep
DRESS|One-piece garment with a skirt
DRIFT|Move slowly without a fixed course
DRILL|Tool that bores a hole
DRONE|Flying machine controlled from a distance
EAGLE|Large bird of prey with a hooked beak
EARTH|The planet we call home
EASEL|Stand that supports a painter's canvas
ELBOW|Joint halfway down the arm
EMPTY|Containing nothing at all
ENEMY|Someone on the opposing side
ENTRY|Way into a building or competition
EQUAL|The same in amount or value
ERASE|Remove marks from a surface
ERROR|Something that went wrong
EVENT|Something happening at a set time
EXTRA|More than the amount normally needed
FABLE|Short story that teaches a moral
FAINT|Barely strong enough to be noticed
FAIRY|Tiny magical being in a folk tale
FAITH|Trust without complete proof
FAULT|A mistake or a crack in Earth's crust
FEAST|Meal with an abundance of food
FENCE|Barrier around a yard
FERRY|Boat that repeatedly crosses a body of water
FEVER|Body temperature above normal
FIBER|Thin strand used to make cloth
FIELD|Open land where crops may grow
FINCH|Small songbird with a seed-cracking bill
FLAME|Visible burning gas above a candle
FLARE|Bright signal used in an emergency
FLASH|Very brief burst of light
FLEET|Group of ships under one command
FLINT|Hard stone used to strike sparks
FLOAT|Rest on the surface of water
FLOCK|A group of sheep or birds
FLOOD|Water overflowing onto normally dry land
FLOOR|Surface beneath your feet indoors
FLOUR|Powder ground from grain
FLUTE|Wind instrument held sideways
FOCUS|Bring a fuzzy image into clarity
FORCE|Push or pull on an object
FORGE|Workshop where a smith heats metal
FRAME|Border that holds a picture
FROST|Thin layer of ice crystals
FROWN|Expression with downturned corners of the mouth
FRUIT|Seed-bearing produce such as a peach
FUDGE|Soft dense chocolate confection
GAUGE|Instrument that measures a level or pressure
GHOST|Spirit said to haunt a place
GIANT|Someone much larger than ordinary people
GLAND|Organ that produces a substance for the body
GLASS|Transparent material in a window
GLAZE|Thin shiny coating on pottery
GLIDE|Move smoothly with little effort
GLOBE|Round model of the world
GLOVE|Covering with a place for each finger
GOOSE|Long-necked waterbird that honks
GRADE|Mark given for schoolwork
GRAIN|Small seed used as food
GRAPE|Small fruit that grows in bunches on a vine
GRAPH|Plot of values on axes
GRASS|Green groundcover trimmed by a mower
GRAVE|Place where a body is buried
GREEN|Color made by mixing blue and yellow paint
GRIEF|Deep sadness after a loss
GRILL|Cooking surface above an open heat source
GROAN|Low sound of pain or annoyance
GROOM|Man on his wedding day
GROVE|Small group of trees
GUARD|Person watching over a place
GUEST|Person invited to visit
GUIDE|Person who shows others the way
HABIT|Behavior repeated almost automatically
HATCH|Opening in a ship's deck
HAVEN|Place of shelter and safety
HEART|Organ that pumps blood
HEDGE|Row of shrubs forming a boundary
HERON|Long-legged bird that waits in shallow water
HINGE|Joint that lets a door swing
HIPPO|Large river-dwelling animal with a wide mouth
HOBBY|Activity enjoyed during free time
HONEY|Sweet food made by bees
HORSE|Animal fitted with a saddle
HOTEL|Building where travelers rent rooms
HOUSE|Building in which people live
HUMID|Full of moisture in the air
ICING|Sweet covering spread over a cake
IMAGE|Picture or visual representation
INDEX|Alphabetical reference at the back of a book
IVORY|Creamy white material from tusks
JEWEL|Precious stone set in an ornament
JOINT|Place where two parts meet
JUDGE|Official who decides a court case
JUICE|Liquid squeezed from fruit
KAYAK|Narrow boat paddled with a double-ended blade
KNEAD|Work dough by pressing and folding
KNIFE|Hand tool with a cutting edge
LABEL|Tag that identifies an item
LANCE|Long weapon used by a charging knight
LASER|Device that emits a concentrated beam of light
LATCH|Fastener that keeps a gate shut
LAYER|One thickness resting over another
LEDGE|Narrow shelf of rock on a cliff
LEMON|Sour yellow citrus fruit
LEVEL|Perfectly horizontal
LIGHT|What allows the eye to see
LILAC|Shrub with fragrant purple blossoms
LIMIT|Point beyond which something cannot go
LINEN|Fabric made from flax
LIVER|Large organ that processes nutrients and toxins
LODGE|Rustic accommodation for travelers
LOGIC|Reasoning from premises to conclusions
LOTUS|Water plant with broad floating leaves
LUNAR|Relating to the moon
LUNCH|Meal usually eaten near midday
LYRIC|Word of a song, or a verse meant to be sung
MAGIC|Seemingly impossible effect in a stage act
MANGO|Tropical fruit with a large flat pit
MAPLE|Tree whose sap can become syrup
MARCH|Walk in a steady military rhythm
MARSH|Wet ground with grasses and reeds
MATCH|Small stick tipped to start a fire
MAYOR|Elected leader of a town or city
MEDAL|Metal award worn on a ribbon
MELON|Large juicy fruit with a thick rind
MERCY|Compassion shown to someone in your power
METAL|Material that is often shiny and conducts heat
METER|Device that records a measured amount
MINER|Worker who extracts ore underground
MODEL|Small representation of a larger object
MONEY|What you exchange for goods and services
MONTH|One of twelve named parts of a year
MOTOR|Machine that turns energy into motion
MOTTO|Short statement of a guiding belief
MOUND|Small rounded pile of earth
MOUSE|Small rodent, or a computer pointing device
MOUTH|Opening used for eating and speaking
MOVIE|Story told through moving pictures
MURAL|Painting made directly on a wall
MUSIC|Art made with rhythm, melody, and sound
NERVE|Fiber that carries signals through the body
NIGHT|Time between sunset and sunrise
NOISE|Unwanted or unpleasant sound
NORTH|Direction opposite south
NOTCH|Small cut in the edge of something
NOVEL|Long work of fiction in prose
NURSE|Healthcare worker who tends patients
OASIS|Watered green spot in a desert
OCEAN|Vast body of salt water
OLIVE|Small fruit pressed to make cooking oil
ONION|Layered bulb that can bring tears
OPERA|Stage drama sung with an orchestra
ORBIT|Curving path around a planet or star
ORGAN|Keyboard instrument with pipes
OTTER|Playful water-loving mammal with dense fur
OUNCE|One sixteenth of a pound
OWNER|Person to whom something belongs
PAINT|Colored coating spread with a brush
PANEL|Flat section fitted into a larger surface
PAPER|Material made into sheets for writing
PARKA|Warm coat with a hood
PARTY|Gathering to celebrate
PASTE|Thick glue spread over a surface
PATCH|Small piece used to cover a hole
PATIO|Paved outdoor space beside a house
PAUSE|Brief stop before continuing
PEACH|Juicy fruit with fuzzy skin
PEARL|Gem formed inside an oyster
PECAN|Nut often used in a rich Southern pie
PEDAL|Foot-operated lever on a bicycle
PENNY|Coin worth one cent
PERCH|Branch or bar on which a bird rests
PETAL|One colorful part of a flower
PHONE|Device used to make a call
PHOTO|Picture captured by a camera
PIANO|Keyboard instrument with hammers and strings
PILOT|Person who flies an aircraft
PINCH|Grasp tightly between finger and thumb
PITCH|How high or low a musical note sounds
PIZZA|Round baked dish with sauce and toppings
PLAID|Pattern of crossing colored stripes
PLANE|Vehicle with wings and an engine
PLANK|Long flat piece of wood
PLANT|Living thing with roots
PLATE|Flat dish used for a meal
PLAZA|Open public square
PLUME|Long ornamental feather
POINT|Sharp end of a needle
POLAR|Relating to the far north or south
PORCH|Covered entrance outside a house
POUCH|Small soft bag
POUND|Unit equal to sixteen ounces
POWER|Ability to do work or influence events
PRESS|Push firmly against something
PRICE|Amount a seller asks for an item
PRIDE|Pleasure in a personal achievement
PRISM|Transparent solid that can split white light
PRIZE|Reward for winning a contest
PROBE|Instrument sent to explore
PROOF|Evidence that establishes a claim
PRUNE|Trim unwanted branches from a plant
PULSE|Rhythmic beat felt at the wrist
PUPIL|Opening at the center of the eye
PUPPY|Very young dog
PURSE|Small bag for money and personal items
QUAIL|Small ground-dwelling game bird
QUART|Measure equal to two pints
QUEEN|Female monarch
QUERY|A question seeking information
QUEST|Long search for something important
QUEUE|Line of people waiting their turn
QUILT|Bed covering stitched from layers
QUOTE|Repeat someone's exact words
RADAR|System that locates objects with radio waves
RADIO|Device that receives broadcast sound
RANCH|Large farm that raises livestock
RANGE|Span between the lowest and highest values
RAVEN|Large black bird with a deep croak
REALM|Kingdom or field of activity
RELAY|Race in which teammates take turns
RESIN|Sticky substance released by some trees
RHINO|Heavy animal with a horn on its nose
RHYME|Words with matching ending sounds
RIDGE|Long narrow crest of high ground
RINSE|Wash lightly with clean water
RIVAL|Competitor seeking the same goal
RIVER|Flowing waterway larger than a stream
ROAST|Cook with dry heat in an oven
ROBIN|Songbird with an orange-red breast
ROBOT|Machine programmed to perform tasks
RODEO|Contest of riding and roping skills
ROOST|Place where birds settle for the night
ROUTE|Way taken from one place to another
RULER|Straight tool marked for measuring length
RUMOR|Story passed around without confirmation
SALAD|Dish of mixed greens or other cold ingredients
SALON|Business where hair is cut and styled
SALSA|Spicy sauce served with tortilla chips
SAUCE|Liquid served to add flavor to food
SCALE|Device used to measure weight
SCARF|Cloth worn around the neck
SCENE|One setting or section in a play
SCENT|Smell that can linger in the air
SCORE|Number of points earned in a game
SCOUT|Person sent ahead to gather information
SCRAP|Small piece left over
SCREW|Fastener with a spiral thread
SENSE|One way of perceiving the world
SHADE|Cool spot protected from direct sunlight
SHAFT|Long narrow passage down a mine
SHAPE|The outline of an object
SHARK|Fish with a skeleton made of cartilage
SHAWL|Cloth draped around the shoulders
SHEEP|Wool-producing farm animal
SHEET|Large thin piece of paper or fabric
SHELF|Horizontal surface for storing books
SHELL|Hard outer covering of a snail
SHIRT|Garment worn on the upper body
SHOCK|Sudden surprise or jolt
SHORE|Land at the edge of a body of water
SHRUB|Woody plant smaller than a tree
SIGHT|Sense used to see
SIREN|Loud warning signal
SKATE|Glide on ice using a bladed boot
SKILL|Ability developed through practice
SKIRT|Garment hanging from the waist
SKULL|Bony structure protecting the brain
SLATE|Fine-grained rock used for roofing
SLEEP|Rest with eyes closed and awareness reduced
SLICE|Thin piece cut from a loaf
SLIDE|Move smoothly along a surface
SLOPE|Surface tilted away from horizontal
SLOTH|Slow-moving tree-dwelling mammal
SMELL|Detect an odor with the nose
SMILE|Expression with upturned corners of the mouth
SMOKE|Airborne particles rising from a fire
SNAIL|Slow mollusk carrying a spiral home
SNAKE|Reptile with no legs
SNORE|Noisy breathing during sleep
SNOUT|Projecting nose of an animal
SOLAR|Relating to the sun
SOLID|State of matter that keeps its shape
SOUND|Vibrations that can be heard
SOUTH|Direction opposite north
SPACE|Room available between things
SPADE|Digging tool with a flat blade
SPARK|Tiny glowing piece thrown from a fire
SPEAR|Long weapon with a pointed tip
SPECK|Very tiny spot or particle
SPEED|Distance traveled per unit of time
SPELL|Set of words thought to cause magic
SPICE|Aromatic ingredient used in small amounts
SPIKE|Long sharp point
SPINE|Column of bones supporting the back
SPOON|Utensil with a small bowl at one end
SPORT|Competitive physical activity
SPRAY|Liquid sent out in tiny droplets
SQUAD|Small group acting as a unit
SQUID|Sea animal with eight arms and two tentacles
STACK|Pile with items resting atop each other
STAFF|Group of people employed by an organization
STAGE|Raised platform for a performance
STAIN|Mark that is hard to wash away
STAIR|One step in a flight
STAKE|Pointed post driven into the ground
STALK|Main stem of a plant
STALL|Individual space for an animal in a stable
STAMP|Small label that pays postage
STAND|Be upright on your feet
STEAK|Thick cut of meat for grilling
STEAM|Water vapor from boiling
STEEL|Strong alloy made mostly of iron
STERN|Back end of a ship
STICK|Thin piece broken from a branch
STING|Sharp pain from an insect's defense
STOCK|Goods kept ready for sale
STONE|Small solid piece of rock
STOOL|Seat without a back
STORE|Put away for later
STORM|Violent weather with strong wind or rain
STORY|Account of connected events
STOVE|Appliance used to cook food
STRAP|Narrow band used to fasten or carry something
STRAW|Hollow tube used to sip a drink
STRIP|Long narrow piece of material
STUMP|Part of a tree left after cutting
STYLE|Distinctive way of doing or presenting something
SUGAR|Sweet crystals added to a dessert
SUITE|Connected set of hotel rooms
SWAMP|Wetland with standing water and trees
SWARM|Large group of insects moving together
SWEAT|Moisture released through the skin
SWEEP|Clear a floor with a broom
SWING|Seat hanging from ropes or chains
SWORD|Long-bladed weapon with a handle
SYRUP|Thick sweet liquid poured over pancakes
TABLE|Furniture with a flat top and legs
TANGO|Partner dance known for close turns
TAPER|Become gradually narrower toward one end
TASTE|Sense that distinguishes sweet from sour
TEETH|Hard structures used to bite and chew
TEMPO|Speed at which a piece of music is played
THEFT|Taking something that belongs to someone else
THEME|Central idea running through a work
THORN|Sharp point on the stem of a rose
THUMB|Shortest and broadest digit of the hand
TIGER|Large striped member of the cat family
TIMER|Device that signals when a set interval ends
TITLE|Name given to a book or film
TOAST|Bread browned by heat
TOKEN|Object standing for a value or permission
TORCH|Portable source of flame
TOWEL|Absorbent cloth used for drying
TOWER|Structure much taller than it is wide
TRACE|Follow the outline of something
TRACK|Path or mark left by movement
TRADE|Exchange one thing for another
TRAIL|Path through the countryside
TRAIN|Connected rail cars pulled together
TRAIT|Characteristic that helps describe someone
TRASH|Things thrown away as waste
TREAT|Something enjoyed as a special pleasure
TREND|General direction in which something changes
TRIAL|Formal examination of a case in court
TRIBE|Community linked by shared ancestry or culture
TRICK|Clever act meant to surprise or deceive
TROOP|Group of soldiers
TRUCK|Road vehicle designed to carry goods
TRUNK|Main woody stem of a tree
TRUST|Confidence that someone will act reliably
TRUTH|What agrees with the facts
TULIP|Spring flower shaped like a cup
TUTOR|Teacher who gives individual help
TWINE|Strong cord made of twisted strands
TWIRL|Spin around lightly
UNCLE|A parent's brother
UNION|Joining of separate things into one
VALUE|Worth or usefulness of something
VALVE|Device that controls the flow through a pipe
VAULT|Secure room for money or valuables
VENUE|Place where an event is held
VERSE|One section of a poem or song
VIDEO|Moving images recorded for viewing
VINYL|Material used for many phonograph records
VIOLA|String instrument larger than a violin
VIRUS|Infectious agent that reproduces inside living cells
VOICE|Sound produced while speaking or singing
VOTER|Person who casts a ballot
WAFER|Very thin crisp biscuit
WAGON|Four-wheeled vehicle pulled along
WAIST|Part of the body between ribs and hips
WALTZ|Dance in a three-beat rhythm
WATCH|Timepiece worn on the wrist
WATER|Liquid that fills lakes and falls as rain
WEAVE|Interlace threads to make fabric
WEDGE|Piece that tapers to a thin edge
WHEAT|Grain commonly ground into bread flour
WHEEL|Round part that turns on an axle
WHIRL|Move rapidly around a center
WHITE|Color of fresh snow
WIDTH|Distance from one side to the other
WORLD|The Earth and everyone on it
WOUND|Injury that breaks the skin
WRECK|What remains after a destructive crash
WRIST|Joint between the hand and forearm
WRITE|Set down words with letters
YEAST|Organism that helps bread dough rise
ZEBRA|Striped African member of the horse family
`.trim().split('\n').map(line => {
  const [answer, clue] = line.split('|');
  if (!/^[A-Z]{5}$/.test(answer) || !clue || clue.toUpperCase().includes(answer)) throw new Error(`Invalid original clue: ${line}`);
  return { answer, clue };
});

if (new Set(authored.map(item => item.answer)).size !== authored.length) throw new Error('Duplicate authored answer.');
const byWord = new Map(authored.map(item => [item.answer, item]));
let seed = 20261023;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}
const rowsFor = words => Array.from({ length: 5 }, (_, row) => words.map(word => word[row]).join(''));
function acceptable(words) {
  const rows = rowsFor(words);
  if (rows.some(strip => new Set([0, 1, 2, 3].map(right => rotateStrip(strip, right))).size !== 4)) return false;
  if (rows.filter(row => new Set(row).size < 4).length < 3) return false;
  return words.every((_, column) => rows.some(row => [...row].filter(letter => letter === row[column]).length > 1));
}

const usage = new Map(authored.map(item => [item.answer, 0]));
const seen = new Set();
const puzzles = [];
for (let index = 0; index < 180; index++) {
  let words;
  if (index === 0) words = ['CRANE', 'BREAD', 'STORE', 'PLANT'];
  else {
    const recent = new Set(puzzles.slice(-2).flatMap(puzzle => puzzle.columns.map(column => column.answer)));
    for (let attempt = 0; attempt < 10000; attempt++) {
      const ranked = shuffled(authored.map(item => item.answer).filter(word => !recent.has(word)))
        .sort((a, b) => usage.get(a) - usage.get(b));
      const pool = ranked.slice(0, 100);
      const candidate = shuffled(pool).slice(0, 4);
      if (!acceptable(candidate) || seen.has([...candidate].sort().join(','))) continue;
      words = candidate;
      break;
    }
  }
  if (!words || !acceptable(words)) throw new Error(`Could not construct board ${index + 1}`);
  seen.add([...words].sort().join(','));
  const solution = rowsFor(words);
  const shiftedRows = index % 3 === 1 ? 4 : 5;
  let strips;
  for (let attempt = 0; attempt < 200; attempt++) {
    const unchanged = shiftedRows === 4 ? Math.floor(random() * 5) : -1;
    const shifts = Array.from({ length: 5 }, (_, row) => row === unchanged ? 0 : 1 + Math.floor(random() * 3));
    strips = solution.map((strip, row) => rotateStrip(strip, shifts[row]));
    const columns = Array.from({ length: 4 }, (_, column) => strips.map(strip => strip[column]).join(''));
    if (columns.every((word, column) => word !== words[column])) break;
    strips = null;
  }
  if (!strips) throw new Error(`Could not scramble board ${index + 1}`);
  if (index === 0) strips = ['PCBS', 'TLRR', 'AAEO', 'ARNN', 'ETED'];
  for (const word of words) usage.set(word, usage.get(word) + 1);
  puzzles.push({
    id: `sideways-${String(index + 1).padStart(3, '0')}`,
    title: 'Read between the rows', difficulty: shiftedRows === 5 ? 'Tricky' : 'Sharp',
    strips, columns: words.map(word => ({ ...byWord.get(word) })),
  });
}

const usedWords = new Set(puzzles.flatMap(puzzle => puzzle.columns.map(column => column.answer)));
const collection = {
  boards: puzzles.length, words: usedWords.size, orientationsPerBoard: 1024,
  certifiedOrientations: puzzles.length * 1024, source: 'Original clues; deterministic cyclic-strip construction.',
  cycle: 'The 180-board collection repeats after 180 days.',
};
const output = `// Generated by scripts/generate-puzzles.mjs. Do not edit by hand.\nexport const COLLECTION = ${JSON.stringify(collection, null, 2)};\n\nexport const PUZZLES = ${JSON.stringify(puzzles, null, 2)};\n`;
const path = fileURLToPath(new URL('../puzzles.mjs', import.meta.url));
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output) throw new Error('Generated collection differs from the checked-in file.');
} else writeFileSync(path, output);
console.log(JSON.stringify({ ...collection, authoredClues: authored.length, maxAnswerUses: Math.max(...usage.values()) }));
