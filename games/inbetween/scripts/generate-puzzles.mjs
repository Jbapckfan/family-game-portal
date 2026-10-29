// Offline editorial tool for Inbetween. The game ships only the finished boards.
// Every seed is a real four-letter word; every answer and clue is hand curated.
// The gap is the number of seed letters before the inserted, ordered pair.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EDITORIAL_BANK = `
CART|CARPET|3|Soft floor covering
PLAN|PLANET|4|World orbiting a star
SAND|STRAND|1|A single thread in a rope
NOTE|NOTICE|3|Written announcement
FORM|FORMAT|4|Layout or arrangement
PAST|PASTRY|4|A flaky baked treat
CART|CARROT|3|Orange root vegetable
CART|CARTON|4|A box for milk or eggs
SAND|SANDAL|4|An open shoe with straps
LAND|ISLAND|0|Land surrounded by water
FORM|INFORM|0|Give someone the facts
FORM|REFORM|0|Make changes to improve something
FORM|FORMAL|4|Suited to a black-tie occasion
PAST|PASTEL|4|A soft, pale color
SING|STRING|1|A thin cord
SING|SPRING|1|The season after winter
SING|CASING|0|A protective outer covering
SING|RISING|0|Moving upward
SONG|STRONG|1|Able to exert plenty of force
SUNG|SPRUNG|1|Jumped suddenly
SUNG|UNSUNG|0|Not given deserved praise
SUNK|SUNKEN|4|Below the surrounding surface
TURN|RETURN|0|Come back
TURN|UPTURN|0|A change for the better
TONE|TONGUE|3|The organ used for tasting
SIDE|STRIDE|1|A long walking step
SIDE|INSIDE|0|On the inner side
SIDE|BESIDE|0|Next to
SINE|SHRINE|1|A sacred place
SINE|SALINE|1|Containing dissolved salt
LINE|ONLINE|0|Connected to the internet
LINE|LINEUP|4|The players picked for a team
LION|LEGION|1|A vast number of people
LION|LOTION|1|A liquid used to soothe the skin
LONG|BELONG|0|Be in the right place
LONG|LOVING|2|Affectionate and caring
RING|DARING|0|Bold enough to take a risk
RING|ROWING|1|Moving a boat with oars
KING|BAKING|0|Cooking with dry oven heat
KING|HIKING|0|Walking on countryside trails
KING|JOKING|0|Speaking in fun
NEST|HONEST|0|Truthful and sincere
NEST|NEWEST|2|Most recently made
NEST|NESTLE|4|Settle into a snug spot
REST|FOREST|0|A large area of trees
REST|RESIST|3|Push back against
REST|RESULT|3|The outcome
REST|RECAST|2|Give a role to a different actor
RENT|RECENT|2|Not long ago
RENT|RELENT|2|Finally give in
RENT|REGENT|2|A ruler acting for a monarch
RENT|RENTAL|4|Something borrowed for a fee
SENT|ABSENT|0|Not here
SENT|SILENT|1|Making no sound
CENT|CEMENT|2|The binding ingredient in concrete
CENT|CLIENT|1|Someone using a professional's services
CENT|ACCENT|0|A distinctive way of pronouncing words
CORN|CORNET|4|A small brass instrument
COVE|COVERT|4|Hidden or secret
CURE|SECURE|0|Safe and firmly protected
CURE|CURATE|3|Select items for an exhibition
CUED|CURLED|2|Formed into coils
CUES|CURVES|2|Smooth bends
COLT|COBALT|2|A metallic element that lends its name to a deep blue
COTS|COUNTS|2|Adds up the total
COTS|COURTS|2|Places where tennis is played
LATE|LOCATE|1|Find the position of
LAST|LATEST|2|Most recent
DATE|UPDATE|0|Bring up to date
DATE|SEDATE|0|Calm and unhurried
DATE|DEBATE|1|A structured exchange of opposing views
DATE|DONATE|1|Give to a good cause
DATE|DILATE|1|Grow wider
DART|DEPART|1|Leave for a destination
DARK|DARKEN|4|Make less bright
MART|MARKET|3|A place to buy and sell
MATE|MATURE|3|Fully grown
MATE|MUTATE|1|Undergo a genetic change
MALE|MANTLE|2|A cloak, or a layer surrounding Earth's core
MALE|MARBLE|2|A small glass toy, or a veined stone
MALE|MANGLE|2|Twist badly out of shape
MALT|MALLET|3|A hammer with a large wooden or rubber head
MOLE|MOBILE|2|Able to move around
MILE|MIDDLE|2|Halfway between the ends
MILE|MINGLE|2|Mix with others at a party
MITE|MINUTE|2|Sixty seconds
MIST|MISFIT|3|Someone who feels out of place
MOST|MODEST|2|Not inclined to boast
MUSE|MUSEUM|4|A home for exhibits
MUSE|MUSCLE|3|Body tissue that contracts to move you
MUSE|MISUSE|1|Use in the wrong way
USED|AMUSED|0|Entertained by something funny
USED|UNUSED|0|Still waiting to be put to work
PARE|PARADE|3|A procession with floats and bands
PART|PARROT|3|A bird known for copying sounds
PANT|PARENT|2|A mother or father
PANT|PLIANT|1|Easily bent
PANT|PANTRY|4|A food-storage cupboard
PANT|PATENT|2|An inventor's exclusive legal right
PACE|PALACE|2|A ruler's grand residence
PEAR|APPEAR|0|Come into view
PEER|PEPPER|2|The seasoning next to salt
PEER|PEWTER|2|A metal alloy often used for tankards
PEER|PEELER|2|A kitchen tool that removes potato skins
PEST|PRIEST|1|A member of the clergy
PEST|PUREST|1|Least mixed with anything else
POST|POSTER|4|A large printed notice
POTS|POINTS|2|Units added to a score
PORT|IMPORT|0|Bring goods into a country
PORT|EXPORT|0|Send goods to another country
PORT|REPORT|0|Give an account of what happened
PORT|PORTAL|4|A doorway or gateway
BARN|BARREN|3|Too poor to support much vegetation
BARE|BEWARE|1|Be on your guard
BAND|BANDIT|4|A robber or outlaw
BEST|BEHEST|2|A person's request or command
BEST|BESTOW|4|Give as an honor or gift
BETS|BEASTS|2|Animals, especially large ones
BATH|BREATH|1|Air taken into your lungs
BOND|BEYOND|1|On the far side of
BONE|BOVINE|2|Relating to cattle
BORE|BEFORE|1|Earlier than
BUST|ROBUST|0|Strong and sturdy
BUST|BUSTLE|4|Move about with busy energy
CAMP|CAMPUS|4|The grounds of a college
CANE|CANDLE|3|A light with a wick and wax
CANE|CANINE|3|Related to dogs
CARE|CAREER|4|A long-term profession
CARE|CARAFE|3|A glass container for serving drinks
CASH|CASHEW|4|A curved edible nut
CAST|CASTLE|4|A fortified building with towers
FAST|FASTEN|4|Fix securely in place
FACE|FACADE|3|The front of a building
FIRE|FIGURE|2|A number, or an illustration
FINE|DEFINE|0|Explain the meaning of a word
FINE|REFINE|0|Improve by making small changes
FINE|FINITE|3|Having an end or limit
FIST|FINEST|2|Of the highest quality
FISH|FINISH|2|Bring to an end
FOLD|UNFOLD|0|Open something that was bent over
FREE|FREEZE|4|Turn liquid into solid ice
TREE|TREBLE|3|The high notes on a stereo dial
TRUE|TRUDGE|3|Walk slowly with heavy steps
TAIL|DETAIL|0|A small individual feature
TAIL|RETAIL|0|Selling goods to the public
TAIL|TAILOR|4|Someone who alters clothes
TALE|TACKLE|2|Deal with a difficult problem
TALE|TANGLE|2|A confused knot of threads
TALE|TATTLE|2|Tell on someone
TIRE|ENTIRE|0|Whole, with nothing left out
TIRE|RETIRE|0|Stop working at the end of a career
TIRE|SATIRE|0|Humor used to expose foolishness
TIRE|TIRADE|3|A long, angry speech
TIER|TIMBER|2|Wood prepared for building
TIER|TINDER|2|Dry material used to start a fire
TIER|TINKER|2|Make small experimental repairs
TILE|TINGLE|2|A prickly sensation
TIED|TIDIED|2|Put things neatly away
TEND|ATTEND|0|Be present at an event
TEND|EXTEND|0|Make longer
TEND|INTEND|0|Have a plan to do something
TENT|TALENT|1|A natural skill
TEST|DETEST|0|Dislike very strongly
TEST|ATTEST|0|Confirm that something is true
SEAM|STREAM|1|A small flowing waterway
SEAM|SCREAM|1|A loud, piercing cry
SEAL|SERIAL|2|A story told in episodes
SEEN|SCREEN|1|A display for films or pictures
SEND|SECOND|2|The position after first
SOFT|SOFTEN|4|Make less hard
LENT|LAMENT|1|Express sorrow or regret
LESS|UNLESS|0|Except if
LESS|LESSEN|4|Make smaller in amount
LASH|LAVISH|2|Generous or extravagant
`.trim();

export const TRANSFORMATIONS = EDITORIAL_BANK.split('\n').map((line, index) => {
  const [seed, answer, gapText, clue] = line.split('|');
  const gap = Number(gapText);
  const letters = answer.slice(gap, gap + 2);
  if (!/^[A-Z]{4}$/.test(seed) || !/^[A-Z]{6}$/.test(answer)
      || !Number.isInteger(gap) || gap < 0 || gap > 4
      || seed.slice(0, gap) + letters + seed.slice(gap) !== answer
      || !clue || clue.includes(answer)) {
    throw new Error(`Invalid editorial row ${index + 1}: ${line}`);
  }
  return { seed, answer, clue, letters, gap };
});

const TITLES = [
  'A little room', 'Room to grow', 'The right place', 'Small wonders',
  'A fresh opening', 'Piece by piece', 'A quiet moment', 'Just enough space',
  'Something new', 'An extra thought', 'A neat fit', 'Look a little closer',
  'The little things', 'A change of pace', 'Make yourself at home', 'Words in bloom',
  'A welcome addition', 'A bit of breathing room', 'The space between', 'A small surprise',
  'Perfectly placed', 'Take a second look', 'A new beginning', 'A gentle stretch',
  'Every little bit', 'Right where it belongs', 'An open invitation', 'A brighter idea',
  'One thing at a time', 'A touch of curiosity', 'A little more to say', 'A pocket of time',
  'Find your footing', 'Room for two', 'A fresh pair of eyes', 'The finishing touch',
  'A place for everything', 'Something to ponder', 'A slight adjustment', 'The next little step',
  'A dash of possibility', 'An easy rhythm', 'A natural fit', 'A well-kept secret',
  'Words taking shape', 'A moment of clarity', 'Two of a kind', 'The missing piece',
  'A little discovery', 'Full of possibilities', 'A change in the air', 'In good company',
  'The shape of things', 'A pleasant diversion', 'At your own pace', 'A new perspective',
  'The art of fitting in', 'A thoughtful pause', 'A little ingenuity', 'All in its place',
];

function randomSource(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function matchingGaps(seed, letters, answer) {
  const matches = [];
  for (let gap = 0; gap <= seed.length; gap += 1) {
    if (seed.slice(0, gap) + letters + seed.slice(gap) === answer) matches.push(gap);
  }
  return matches;
}

// Correct rows lock during play. A board must therefore remain safe no matter
// which correct row the player fits first, not merely have one global solution.
export function hasIndependentFits(rows) {
  return rows.every(row => rows.filter(tile =>
    matchingGaps(row.seed, tile.letters, row.answer).length > 0,
  ).length === 1);
}

function transformKey(row) {
  return `${row.seed}:${row.answer}`;
}

function internalCount(rows) {
  return rows.filter(row => row.gap > 0 && row.gap < 4).length;
}

export function generatePuzzles() {
  const random = randomSource(0x1b37ee42);
  const selectedBoards = [TRANSFORMATIONS.slice(0, 6)];
  const uses = new Map(TRANSFORMATIONS.map(row => [transformKey(row), 0]));
  for (const row of selectedBoards[0]) uses.set(transformKey(row), 1);

  for (let boardIndex = 1; boardIndex < TITLES.length; boardIndex += 1) {
    const desiredInternal = [3, 4, 4, 5][boardIndex % 4];
    let best = null;
    let bestScore = Infinity;
    for (let attempt = 0; attempt < 1600; attempt += 1) {
      const rows = [];
      const seeds = new Set();
      const answers = new Set();
      const pairs = new Set();
      for (const candidate of shuffled(TRANSFORMATIONS, random)) {
        if (seeds.has(candidate.seed) || answers.has(candidate.answer)
            || pairs.has(candidate.letters)) continue;
        const nextInternal = internalCount(rows) + (candidate.gap > 0 && candidate.gap < 4 ? 1 : 0);
        if (nextInternal > desiredInternal || nextInternal + (5 - rows.length) < desiredInternal) continue;
        rows.push(candidate);
        seeds.add(candidate.seed);
        answers.add(candidate.answer);
        pairs.add(candidate.letters);
        if (rows.length === 6) break;
      }
      if (rows.length !== 6 || internalCount(rows) !== desiredInternal
          || new Set(rows.map(row => row.gap)).size < 3 || !hasIndependentFits(rows)) continue;
      const keys = new Set(rows.map(transformKey));
      const overlaps = selectedBoards.map(previous => previous.filter(row => keys.has(transformKey(row))).length);
      if (Math.max(...overlaps) > 3) continue;
      // A familiar answer should not turn up again a few mornings later.
      if (overlaps.slice(-6).some(overlap => overlap > 0)) continue;
      // Daily selection cycles through the edition, so protect its seam too.
      const wrapCount = Math.max(0, boardIndex + 7 - TITLES.length);
      if (overlaps.slice(0, wrapCount).some(overlap => overlap > 0)) continue;
      const score = rows.reduce((total, row) => total + (uses.get(transformKey(row)) + 1) ** 2, 0)
        + overlaps.reduce((total, overlap) => total + Math.max(0, overlap - 1) * 0.3, 0);
      if (score < bestScore) {
        best = rows;
        bestScore = score;
      }
    }
    if (!best) throw new Error(`Unable to compose board ${boardIndex + 1}`);
    selectedBoards.push(best);
    for (const row of best) uses.set(transformKey(row), uses.get(transformKey(row)) + 1);
  }

  const published = selectedBoards.map((rows, index) => {
    let tileRows = shuffled(rows, random);
    // Do not hand out the answers by leaving the entire bank in row order.
    if (tileRows.every((row, tileIndex) => row === rows[tileIndex])) {
      tileRows = [...tileRows.slice(1), tileRows[0]];
    }
    const interior = internalCount(rows);
    return {
      id: `inbetween-${String(index + 1).padStart(3, '0')}`,
      title: TITLES[index],
      difficulty: interior <= 3 ? 'Gentle' : interior === 4 ? 'Medium' : 'Tricky',
      rows: rows.map(({ seed, answer, clue }) => ({ seed, answer, clue })),
      tiles: tileRows.map(({ letters }, tileIndex) => ({ id: `tile-${tileIndex}`, letters })),
    };
  });
  return appendBoards(published);
}

function appendBoards(published) {
  const random = randomSource(0x2b37ee42);
  const output = [...published];
  const uses = new Map(TRANSFORMATIONS.map(row => [transformKey(row), 0]));
  for (const puzzle of output) for (const row of puzzle.rows) uses.set(transformKey(row), uses.get(transformKey(row)) + 1);
  while (output.length < 210) {
    const index = output.length;
    const forbidden = new Set(output.slice(-6).flatMap(puzzle => puzzle.rows.map(transformKey)));
    // Protect six days of separation across the enlarged collection's seam.
    // Reconstruct the published 180-board edition unchanged before extending.
    const editionEnd = index < 180 ? 180 : 210;
    const wrapCount = Math.max(0, index + 7 - editionEnd);
    for (const puzzle of output.slice(0, wrapCount)) for (const row of puzzle.rows) forbidden.add(transformKey(row));
    let chosen;
    const desiredInternal = [3, 4, 4, 5][index % 4];
    for (let attempt = 0; attempt < 1600; attempt++) {
      const pool = shuffled(TRANSFORMATIONS.filter(row => !forbidden.has(transformKey(row))), random)
        .sort((a, b) => uses.get(transformKey(a)) - uses.get(transformKey(b)));
      const rows = [];
      for (const row of pool) {
        if (rows.some(other => other.seed === row.seed || other.answer === row.answer || other.letters === row.letters)) continue;
        const nextInternal = internalCount(rows) + (row.gap > 0 && row.gap < 4 ? 1 : 0);
        if (nextInternal > desiredInternal || nextInternal + (5 - rows.length) < desiredInternal) continue;
        rows.push(row);
        if (rows.length === 6) break;
      }
      if (rows.length !== 6 || !hasIndependentFits(rows) || new Set(rows.map(row => row.gap)).size < 3) continue;
      const keys = new Set(rows.map(transformKey));
      if (output.some(puzzle => puzzle.rows.filter(row => keys.has(transformKey(row))).length > 3)) continue;
      chosen = rows;
      break;
    }
    if (!chosen) throw new Error(`Unable to append board ${index + 1}`);
    let tileRows = shuffled(chosen, random);
    if (tileRows.every((row, tileIndex) => row === chosen[tileIndex])) tileRows = [...tileRows.slice(1), tileRows[0]];
    const interior = internalCount(chosen);
    output.push({
      id: `inbetween-${String(index + 1).padStart(3, '0')}`,
      title: `${TITLES[index % TITLES.length]}, ${index < 120 ? 'a new fit' : index < 180 ? 'another fit' : 'a fresh fit'}`,
      difficulty: interior <= 3 ? 'Gentle' : interior === 4 ? 'Medium' : 'Tricky',
      rows: chosen.map(({ seed, answer, clue }) => ({ seed, answer, clue })),
      tiles: tileRows.map(({ letters }, tileIndex) => ({ id: `tile-${tileIndex}`, letters })),
    });
    for (const row of chosen) uses.set(transformKey(row), uses.get(transformKey(row)) + 1);
  }
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const puzzles = generatePuzzles();
  const destination = fileURLToPath(new URL('../puzzles.mjs', import.meta.url));
  const source =
    '// Curated Inbetween puzzles. Generated by scripts/generate-puzzles.mjs.\n'
    + '// All words, clues, and boards are included locally; no network is needed to play.\n'
    + `export const PUZZLES = ${JSON.stringify(puzzles, null, 2)};\n`;
  if (process.argv.includes('--check')) {
    if (readFileSync(destination, 'utf8') !== source) throw new Error('Generated collection differs from the checked-in file.');
  } else writeFileSync(destination, source);
  const used = new Set(puzzles.flatMap(puzzle => puzzle.rows.map(transformKey)));
  console.log(`Wrote ${puzzles.length} puzzles from ${TRANSFORMATIONS.length} curated transformations (${used.size} used).`);
}
