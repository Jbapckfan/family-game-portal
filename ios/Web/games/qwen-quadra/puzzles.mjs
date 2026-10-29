// Boards 1–16 preserve Qwen's supplied QUADRA prototype verbatim.
// Boards 17–30 are additional editorial content by ChatGPT.
const BOARDS = [
 ['Weather',['RAIN','SNOW','WIND','HAIL']],
 ['Money',['CASH','COIN','NOTE','BILL']],
 ['Animals',['BEAR','LION','WOLF','DEER']],
 ['Colors',['BLUE','CYAN','GOLD','TEAL']],
 ['Fruits',['PEAR','PLUM','KIWI','LIME']],
 ['Vehicles',['BOAT','SHIP','TAXI','TRAM']],
 ['Car parts',['HOOD','DOOR','SEAT','TIRE']],
 ['Communication',['CHAT','TEXT','CALL','MAIL']],
 ['Grammar',['NOUN','VERB','CASE','MOOD']],
 ['Chess',['KING','ROOK','PAWN','MATE']],
 ['Gemstones',['OPAL','RUBY','JADE','ONYX']],
 ['Music genres',['JAZZ','ROCK','SOUL','FUNK']],
 ['Length units',['MILE','YARD','FOOT','INCH']],
 ['Beverages',['BEER','WINE','COLA','MILK']],
 ['Shapes',['CUBE','CONE','OVAL','STAR']],
 ['Birds',['CROW','DOVE','SWAN','HAWK']],
 ['Body parts',['HAND','FOOT','HEAD','KNEE']],
 ['Kitchen verbs',['BOIL','BAKE','STIR','PEEL']],
 ['Things in the sky',['MOON','STAR','KITE','BIRD']],
 ['At the beach',['SAND','SURF','TIDE','WAVE']],
 ['Reading and writing',['BOOK','READ','PAGE','WORD']],
 ['Playing-card ranks',['KING','JACK','NINE','FIVE']],
 ['Sports',['GOLF','POLO','JUDO','SUMO']],
 ['Clothing',['COAT','SOCK','VEST','ROBE']],
 ['Cooking ingredients',['SALT','RICE','OATS','CORN']],
 ['Plant parts',['ROOT','STEM','LEAF','SEED']],
 ['Parts of a home',['ROOM','WALL','ROOF','HALL']],
 ['Computer terms',['FILE','BYTE','DATA','CODE']],
 ['On a farm',['PLOW','BARN','HENS','GOAT']],
 ['Parts of the face',['EYES','NOSE','LIPS','CHIN']],
];
function shuffle(letters,seed){
 const values=[...letters];let n=seed>>>0;
 for(let i=values.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[values[i],values[j]]=[values[j],values[i]];}
 return values;
}
const ORIGINAL_PUZZLES=BOARDS.map(([category,answers],i)=>({id:`quadra-${i+1}`,category,answers,tiles:shuffle(answers.join(''),0x716c39+i*104729)}));

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// All published records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "quadra-031",
    "category": "Weather",
    "answers": [
      "MIST",
      "GALE",
      "GUST",
      "HAZE"
    ],
    "tiles": [
      "E",
      "H",
      "G",
      "Z",
      "S",
      "T",
      "A",
      "G",
      "A",
      "E",
      "I",
      "S",
      "T",
      "L",
      "U",
      "M"
    ]
  },
  {
    "id": "quadra-032",
    "category": "Money and banking",
    "answers": [
      "CENT",
      "EURO",
      "DIME",
      "BANK"
    ],
    "tiles": [
      "T",
      "M",
      "N",
      "C",
      "E",
      "I",
      "U",
      "E",
      "A",
      "R",
      "D",
      "N",
      "O",
      "E",
      "B",
      "K"
    ]
  },
  {
    "id": "quadra-033",
    "category": "Animals",
    "answers": [
      "MOLE",
      "SEAL",
      "TOAD",
      "FROG"
    ],
    "tiles": [
      "R",
      "L",
      "E",
      "A",
      "F",
      "O",
      "L",
      "D",
      "O",
      "O",
      "E",
      "G",
      "T",
      "M",
      "A",
      "S"
    ]
  },
  {
    "id": "quadra-034",
    "category": "Colors",
    "answers": [
      "PINK",
      "GRAY",
      "ROSE",
      "AQUA"
    ],
    "tiles": [
      "A",
      "R",
      "P",
      "N",
      "O",
      "I",
      "Y",
      "Q",
      "G",
      "U",
      "K",
      "R",
      "A",
      "A",
      "S",
      "E"
    ]
  },
  {
    "id": "quadra-035",
    "category": "Vehicles",
    "answers": [
      "JEEP",
      "SLED",
      "CART",
      "RAFT"
    ],
    "tiles": [
      "P",
      "T",
      "A",
      "R",
      "D",
      "E",
      "T",
      "A",
      "L",
      "J",
      "C",
      "E",
      "E",
      "F",
      "R",
      "S"
    ]
  },
  {
    "id": "quadra-036",
    "category": "Car parts",
    "answers": [
      "HORN",
      "AXLE",
      "GEAR",
      "RIMS"
    ],
    "tiles": [
      "R",
      "A",
      "G",
      "E",
      "A",
      "X",
      "L",
      "O",
      "R",
      "I",
      "H",
      "E",
      "M",
      "N",
      "S",
      "R"
    ]
  },
  {
    "id": "quadra-037",
    "category": "Communication",
    "answers": [
      "TALK",
      "SIGN",
      "TELL",
      "HEAR"
    ],
    "tiles": [
      "L",
      "T",
      "R",
      "I",
      "E",
      "A",
      "L",
      "N",
      "L",
      "T",
      "K",
      "H",
      "G",
      "A",
      "S",
      "E"
    ]
  },
  {
    "id": "quadra-038",
    "category": "Grammar and language",
    "answers": [
      "VERB",
      "PAST",
      "STEM",
      "WORD"
    ],
    "tiles": [
      "B",
      "M",
      "T",
      "E",
      "S",
      "R",
      "R",
      "V",
      "P",
      "O",
      "A",
      "W",
      "E",
      "T",
      "D",
      "S"
    ]
  },
  {
    "id": "quadra-039",
    "category": "Chess",
    "answers": [
      "DRAW",
      "FORK",
      "FILE",
      "RANK"
    ],
    "tiles": [
      "A",
      "O",
      "F",
      "L",
      "I",
      "N",
      "W",
      "R",
      "R",
      "E",
      "D",
      "R",
      "A",
      "K",
      "K",
      "F"
    ]
  },
  {
    "id": "quadra-040",
    "category": "Music genres",
    "answers": [
      "JAZZ",
      "ROCK",
      "FOLK",
      "TRAP"
    ],
    "tiles": [
      "J",
      "K",
      "P",
      "O",
      "A",
      "R",
      "K",
      "A",
      "C",
      "Z",
      "F",
      "O",
      "R",
      "T",
      "L",
      "Z"
    ]
  },
  {
    "id": "quadra-041",
    "category": "Beverages",
    "answers": [
      "WINE",
      "SODA",
      "MEAD",
      "SAKE"
    ],
    "tiles": [
      "K",
      "I",
      "E",
      "W",
      "E",
      "O",
      "E",
      "S",
      "N",
      "M",
      "A",
      "A",
      "S",
      "D",
      "A",
      "D"
    ]
  },
  {
    "id": "quadra-042",
    "category": "Shapes",
    "answers": [
      "KITE",
      "RING",
      "LINE",
      "DISK"
    ],
    "tiles": [
      "L",
      "I",
      "S",
      "K",
      "E",
      "G",
      "D",
      "I",
      "I",
      "N",
      "K",
      "T",
      "I",
      "E",
      "N",
      "R"
    ]
  },
  {
    "id": "quadra-043",
    "category": "Birds",
    "answers": [
      "WREN",
      "IBIS",
      "RHEA",
      "TERN"
    ],
    "tiles": [
      "A",
      "W",
      "H",
      "R",
      "E",
      "R",
      "S",
      "I",
      "R",
      "I",
      "E",
      "E",
      "N",
      "T",
      "B",
      "N"
    ]
  },
  {
    "id": "quadra-044",
    "category": "Body parts",
    "answers": [
      "NECK",
      "LUNG",
      "PALM",
      "FACE"
    ],
    "tiles": [
      "M",
      "U",
      "N",
      "E",
      "C",
      "G",
      "A",
      "E",
      "L",
      "F",
      "C",
      "K",
      "L",
      "N",
      "P",
      "A"
    ]
  },
  {
    "id": "quadra-045",
    "category": "Kitchen verbs",
    "answers": [
      "DICE",
      "WHIP",
      "BEAT",
      "SEAR"
    ],
    "tiles": [
      "H",
      "I",
      "S",
      "A",
      "P",
      "A",
      "R",
      "E",
      "I",
      "D",
      "E",
      "T",
      "C",
      "W",
      "E",
      "B"
    ]
  },
  {
    "id": "quadra-046",
    "category": "Things in the sky",
    "answers": [
      "BIRD",
      "HAZE",
      "RAIN",
      "SNOW"
    ],
    "tiles": [
      "Z",
      "S",
      "H",
      "I",
      "A",
      "I",
      "B",
      "O",
      "W",
      "E",
      "R",
      "N",
      "A",
      "R",
      "D",
      "N"
    ]
  },
  {
    "id": "quadra-047",
    "category": "At the beach",
    "answers": [
      "DUNE",
      "CLAM",
      "CRAB",
      "GULL"
    ],
    "tiles": [
      "C",
      "E",
      "M",
      "U",
      "C",
      "A",
      "G",
      "R",
      "L",
      "U",
      "A",
      "B",
      "D",
      "L",
      "L",
      "N"
    ]
  },
  {
    "id": "quadra-048",
    "category": "Reading and writing",
    "answers": [
      "POEM",
      "TALE",
      "LINE",
      "EDIT"
    ],
    "tiles": [
      "D",
      "E",
      "I",
      "E",
      "T",
      "M",
      "L",
      "E",
      "T",
      "I",
      "P",
      "O",
      "A",
      "E",
      "N",
      "L"
    ]
  },
  {
    "id": "quadra-049",
    "category": "Clothing",
    "answers": [
      "GOWN",
      "CAPE",
      "KILT",
      "SUIT"
    ],
    "tiles": [
      "C",
      "K",
      "I",
      "L",
      "O",
      "P",
      "T",
      "N",
      "A",
      "W",
      "T",
      "G",
      "S",
      "I",
      "E",
      "U"
    ]
  },
  {
    "id": "quadra-050",
    "category": "Cooking ingredients",
    "answers": [
      "RICE",
      "LARD",
      "HERB",
      "LIME"
    ],
    "tiles": [
      "E",
      "L",
      "C",
      "I",
      "M",
      "A",
      "L",
      "R",
      "R",
      "E",
      "D",
      "I",
      "E",
      "R",
      "H",
      "B"
    ]
  },
  {
    "id": "quadra-051",
    "category": "Parts of a home",
    "answers": [
      "ROOM",
      "GATE",
      "STEP",
      "FLUE"
    ],
    "tiles": [
      "M",
      "O",
      "R",
      "O",
      "T",
      "G",
      "L",
      "P",
      "E",
      "F",
      "E",
      "E",
      "U",
      "T",
      "A",
      "S"
    ]
  },
  {
    "id": "quadra-052",
    "category": "Computer terms",
    "answers": [
      "DATA",
      "FONT",
      "ICON",
      "CHIP"
    ],
    "tiles": [
      "O",
      "I",
      "I",
      "A",
      "P",
      "N",
      "A",
      "H",
      "T",
      "N",
      "T",
      "F",
      "O",
      "C",
      "C",
      "D"
    ]
  },
  {
    "id": "quadra-053",
    "category": "On a farm",
    "answers": [
      "COWS",
      "PIGS",
      "CROP",
      "SOIL"
    ],
    "tiles": [
      "S",
      "C",
      "I",
      "O",
      "W",
      "S",
      "C",
      "O",
      "O",
      "S",
      "P",
      "R",
      "P",
      "I",
      "G",
      "L"
    ]
  },
  {
    "id": "quadra-054",
    "category": "In the garden",
    "answers": [
      "RAKE",
      "HOSE",
      "POTS",
      "SHED"
    ],
    "tiles": [
      "K",
      "H",
      "D",
      "H",
      "E",
      "S",
      "E",
      "E",
      "A",
      "P",
      "O",
      "R",
      "S",
      "O",
      "T",
      "S"
    ]
  },
  {
    "id": "quadra-055",
    "category": "At the bakery",
    "answers": [
      "CAKE",
      "LOAF",
      "ROLL",
      "PIES"
    ],
    "tiles": [
      "E",
      "S",
      "A",
      "L",
      "F",
      "O",
      "K",
      "P",
      "O",
      "R",
      "E",
      "I",
      "L",
      "A",
      "L",
      "C"
    ]
  },
  {
    "id": "quadra-056",
    "category": "Musical instruments",
    "answers": [
      "OBOE",
      "LUTE",
      "GONG",
      "PIPE"
    ],
    "tiles": [
      "U",
      "O",
      "L",
      "P",
      "E",
      "O",
      "I",
      "G",
      "B",
      "G",
      "O",
      "E",
      "P",
      "T",
      "E",
      "N"
    ]
  },
  {
    "id": "quadra-057",
    "category": "Things used in sports",
    "answers": [
      "BATS",
      "GOAL",
      "PINS",
      "PUCK"
    ],
    "tiles": [
      "P",
      "S",
      "C",
      "N",
      "B",
      "A",
      "I",
      "G",
      "U",
      "O",
      "K",
      "T",
      "S",
      "L",
      "A",
      "P"
    ]
  },
  {
    "id": "quadra-058",
    "category": "Ways to move on foot",
    "answers": [
      "SKIP",
      "PACE",
      "LIMP",
      "RUSH"
    ],
    "tiles": [
      "P",
      "R",
      "L",
      "E",
      "C",
      "S",
      "U",
      "I",
      "P",
      "I",
      "S",
      "H",
      "P",
      "A",
      "K",
      "M"
    ]
  },
  {
    "id": "quadra-059",
    "category": "Feelings",
    "answers": [
      "FEAR",
      "LOVE",
      "HOPE",
      "RAGE"
    ],
    "tiles": [
      "H",
      "V",
      "A",
      "E",
      "R",
      "A",
      "E",
      "P",
      "E",
      "O",
      "R",
      "L",
      "F",
      "O",
      "E",
      "G"
    ]
  },
  {
    "id": "quadra-060",
    "category": "Periods of time",
    "answers": [
      "DAYS",
      "WEEK",
      "YEAR",
      "AGES"
    ],
    "tiles": [
      "W",
      "R",
      "Y",
      "S",
      "A",
      "A",
      "E",
      "E",
      "E",
      "E",
      "K",
      "D",
      "Y",
      "G",
      "S",
      "A"
    ]
  },
  {
    "id": "quadra-061",
    "category": "Weather",
    "answers": [
      "WIND",
      "HAIL",
      "MIST",
      "GUST"
    ],
    "tiles": [
      "T",
      "I",
      "G",
      "A",
      "S",
      "W",
      "L",
      "H",
      "S",
      "M",
      "I",
      "N",
      "D",
      "U",
      "I",
      "T"
    ]
  },
  {
    "id": "quadra-062",
    "category": "Money and banking",
    "answers": [
      "CASH",
      "DEBT",
      "LOAN",
      "BANK"
    ],
    "tiles": [
      "H",
      "B",
      "N",
      "B",
      "C",
      "D",
      "L",
      "N",
      "O",
      "A",
      "A",
      "S",
      "E",
      "T",
      "K",
      "A"
    ]
  },
  {
    "id": "quadra-063",
    "category": "Animals",
    "answers": [
      "HARE",
      "LYNX",
      "MULE",
      "NEWT"
    ],
    "tiles": [
      "N",
      "N",
      "A",
      "X",
      "W",
      "E",
      "L",
      "Y",
      "T",
      "H",
      "L",
      "E",
      "E",
      "M",
      "R",
      "U"
    ]
  },
  {
    "id": "quadra-064",
    "category": "Colors",
    "answers": [
      "CYAN",
      "TEAL",
      "GRAY",
      "AQUA"
    ],
    "tiles": [
      "A",
      "R",
      "A",
      "T",
      "L",
      "Q",
      "N",
      "Y",
      "Y",
      "G",
      "E",
      "U",
      "C",
      "A",
      "A",
      "A"
    ]
  },
  {
    "id": "quadra-065",
    "category": "Vehicles",
    "answers": [
      "SHIP",
      "JEEP",
      "RAFT",
      "BIKE"
    ],
    "tiles": [
      "R",
      "H",
      "I",
      "P",
      "B",
      "E",
      "E",
      "J",
      "T",
      "S",
      "P",
      "E",
      "F",
      "K",
      "I",
      "A"
    ]
  },
  {
    "id": "quadra-066",
    "category": "Car parts",
    "answers": [
      "SEAT",
      "TIRE",
      "AXLE",
      "RIMS"
    ],
    "tiles": [
      "R",
      "R",
      "I",
      "E",
      "T",
      "S",
      "E",
      "M",
      "L",
      "A",
      "I",
      "E",
      "A",
      "T",
      "S",
      "X"
    ]
  },
  {
    "id": "quadra-067",
    "category": "Communication",
    "answers": [
      "CHAT",
      "MAIL",
      "SIGN",
      "TELL"
    ],
    "tiles": [
      "G",
      "T",
      "M",
      "L",
      "E",
      "L",
      "S",
      "H",
      "I",
      "A",
      "T",
      "N",
      "A",
      "L",
      "I",
      "C"
    ]
  },
  {
    "id": "quadra-068",
    "category": "Grammar and language",
    "answers": [
      "CASE",
      "MOOD",
      "PAST",
      "ROOT"
    ],
    "tiles": [
      "A",
      "T",
      "O",
      "T",
      "D",
      "R",
      "O",
      "O",
      "P",
      "M",
      "O",
      "S",
      "C",
      "S",
      "E",
      "A"
    ]
  },
  {
    "id": "quadra-069",
    "category": "Chess",
    "answers": [
      "ROOK",
      "MATE",
      "FORK",
      "RANK"
    ],
    "tiles": [
      "E",
      "O",
      "O",
      "K",
      "A",
      "R",
      "F",
      "A",
      "K",
      "R",
      "M",
      "T",
      "O",
      "K",
      "N",
      "R"
    ]
  },
  {
    "id": "quadra-070",
    "category": "Music genres",
    "answers": [
      "SOUL",
      "FUNK",
      "FOLK",
      "TRAP"
    ],
    "tiles": [
      "P",
      "O",
      "K",
      "F",
      "R",
      "F",
      "N",
      "K",
      "L",
      "U",
      "O",
      "L",
      "S",
      "A",
      "U",
      "T"
    ]
  },
  {
    "id": "quadra-071",
    "category": "Beverages",
    "answers": [
      "BEER",
      "MILK",
      "SODA",
      "SAKE"
    ],
    "tiles": [
      "K",
      "A",
      "K",
      "E",
      "E",
      "B",
      "S",
      "A",
      "D",
      "S",
      "I",
      "E",
      "L",
      "M",
      "O",
      "R"
    ]
  },
  {
    "id": "quadra-072",
    "category": "Shapes",
    "answers": [
      "CONE",
      "OVAL",
      "RING",
      "DISK"
    ],
    "tiles": [
      "I",
      "D",
      "K",
      "R",
      "S",
      "A",
      "L",
      "I",
      "C",
      "V",
      "O",
      "N",
      "E",
      "G",
      "O",
      "N"
    ]
  },
  {
    "id": "quadra-073",
    "category": "Birds",
    "answers": [
      "CROW",
      "LARK",
      "LOON",
      "DUCK"
    ],
    "tiles": [
      "U",
      "A",
      "R",
      "L",
      "K",
      "K",
      "C",
      "O",
      "C",
      "L",
      "O",
      "D",
      "R",
      "N",
      "O",
      "W"
    ]
  },
  {
    "id": "quadra-074",
    "category": "Body parts",
    "answers": [
      "HEAD",
      "NECK",
      "BACK",
      "HEEL"
    ],
    "tiles": [
      "H",
      "K",
      "B",
      "L",
      "C",
      "D",
      "E",
      "A",
      "A",
      "E",
      "K",
      "E",
      "C",
      "H",
      "N",
      "E"
    ]
  },
  {
    "id": "quadra-075",
    "category": "Kitchen verbs",
    "answers": [
      "BOIL",
      "PEEL",
      "CHOP",
      "SEAR"
    ],
    "tiles": [
      "B",
      "L",
      "P",
      "O",
      "E",
      "H",
      "A",
      "P",
      "O",
      "S",
      "I",
      "E",
      "C",
      "L",
      "R",
      "E"
    ]
  },
  {
    "id": "quadra-076",
    "category": "Things in the sky",
    "answers": [
      "MOON",
      "KITE",
      "RAIN",
      "SNOW"
    ],
    "tiles": [
      "M",
      "N",
      "N",
      "O",
      "T",
      "O",
      "E",
      "R",
      "O",
      "I",
      "S",
      "K",
      "W",
      "N",
      "I",
      "A"
    ]
  },
  {
    "id": "quadra-077",
    "category": "At the beach",
    "answers": [
      "SAND",
      "CLAM",
      "CRAB",
      "KELP"
    ],
    "tiles": [
      "A",
      "C",
      "L",
      "L",
      "D",
      "C",
      "N",
      "K",
      "A",
      "M",
      "R",
      "B",
      "P",
      "E",
      "S",
      "A"
    ]
  },
  {
    "id": "quadra-078",
    "category": "Reading and writing",
    "answers": [
      "BOOK",
      "READ",
      "TALE",
      "TEXT"
    ],
    "tiles": [
      "T",
      "A",
      "T",
      "B",
      "X",
      "O",
      "L",
      "D",
      "O",
      "T",
      "A",
      "E",
      "E",
      "R",
      "E",
      "K"
    ]
  },
  {
    "id": "quadra-079",
    "category": "Clothing",
    "answers": [
      "COAT",
      "SOCK",
      "KILT",
      "SUIT"
    ],
    "tiles": [
      "T",
      "I",
      "C",
      "T",
      "O",
      "U",
      "A",
      "C",
      "K",
      "O",
      "K",
      "I",
      "T",
      "S",
      "S",
      "L"
    ]
  },
  {
    "id": "quadra-080",
    "category": "Cooking ingredients",
    "answers": [
      "OATS",
      "CORN",
      "LARD",
      "HERB"
    ],
    "tiles": [
      "D",
      "R",
      "B",
      "O",
      "R",
      "S",
      "E",
      "A",
      "H",
      "L",
      "C",
      "R",
      "A",
      "T",
      "O",
      "N"
    ]
  },
  {
    "id": "quadra-081",
    "category": "Parts of a home",
    "answers": [
      "WALL",
      "ROOF",
      "GATE",
      "STEP"
    ],
    "tiles": [
      "T",
      "F",
      "L",
      "R",
      "L",
      "O",
      "W",
      "O",
      "E",
      "G",
      "T",
      "P",
      "A",
      "E",
      "S",
      "A"
    ]
  },
  {
    "id": "quadra-082",
    "category": "Computer terms",
    "answers": [
      "BYTE",
      "CODE",
      "ICON",
      "CHIP"
    ],
    "tiles": [
      "H",
      "C",
      "E",
      "D",
      "B",
      "N",
      "T",
      "I",
      "C",
      "P",
      "O",
      "C",
      "E",
      "I",
      "Y",
      "O"
    ]
  },
  {
    "id": "quadra-083",
    "category": "On a farm",
    "answers": [
      "HENS",
      "COWS",
      "SOIL",
      "SEED"
    ],
    "tiles": [
      "H",
      "C",
      "E",
      "S",
      "W",
      "I",
      "D",
      "S",
      "N",
      "O",
      "O",
      "L",
      "E",
      "S",
      "E",
      "S"
    ]
  },
  {
    "id": "quadra-084",
    "category": "In the garden",
    "answers": [
      "RAKE",
      "PLOW",
      "SEED",
      "POTS"
    ],
    "tiles": [
      "S",
      "W",
      "O",
      "T",
      "D",
      "P",
      "L",
      "K",
      "S",
      "R",
      "E",
      "A",
      "P",
      "E",
      "E",
      "O"
    ]
  },
  {
    "id": "quadra-085",
    "category": "At the bakery",
    "answers": [
      "TART",
      "BUNS",
      "ROLL",
      "FLAN"
    ],
    "tiles": [
      "A",
      "U",
      "N",
      "S",
      "L",
      "R",
      "F",
      "T",
      "L",
      "T",
      "O",
      "L",
      "B",
      "N",
      "R",
      "A"
    ]
  },
  {
    "id": "quadra-086",
    "category": "Musical instruments",
    "answers": [
      "HARP",
      "DRUM",
      "BASS",
      "GONG"
    ],
    "tiles": [
      "U",
      "R",
      "M",
      "R",
      "H",
      "N",
      "D",
      "S",
      "B",
      "G",
      "G",
      "P",
      "S",
      "A",
      "A",
      "O"
    ]
  },
  {
    "id": "quadra-087",
    "category": "Things used in sports",
    "answers": [
      "BALL",
      "NETS",
      "PADS",
      "TEES"
    ],
    "tiles": [
      "L",
      "E",
      "P",
      "N",
      "S",
      "S",
      "A",
      "T",
      "E",
      "L",
      "A",
      "D",
      "S",
      "E",
      "B",
      "T"
    ]
  },
  {
    "id": "quadra-088",
    "category": "Ways to move on foot",
    "answers": [
      "WALK",
      "JUMP",
      "TROT",
      "LIMP"
    ],
    "tiles": [
      "M",
      "L",
      "J",
      "U",
      "T",
      "P",
      "A",
      "I",
      "L",
      "P",
      "R",
      "K",
      "O",
      "M",
      "W",
      "T"
    ]
  },
  {
    "id": "quadra-089",
    "category": "Feelings",
    "answers": [
      "CALM",
      "ENVY",
      "GLEE",
      "HATE"
    ],
    "tiles": [
      "L",
      "M",
      "Y",
      "E",
      "N",
      "E",
      "E",
      "A",
      "T",
      "A",
      "V",
      "E",
      "C",
      "H",
      "G",
      "L"
    ]
  },
  {
    "id": "quadra-090",
    "category": "Periods of time",
    "answers": [
      "DAYS",
      "HOUR",
      "EONS",
      "AGES"
    ],
    "tiles": [
      "D",
      "R",
      "O",
      "E",
      "S",
      "A",
      "A",
      "S",
      "E",
      "U",
      "N",
      "H",
      "S",
      "Y",
      "G",
      "O"
    ]
  },
  {
    "id": "quadra-091",
    "category": "Weather",
    "answers": [
      "WIND",
      "HAIL",
      "GALE",
      "HAZE"
    ],
    "tiles": [
      "A",
      "I",
      "E",
      "Z",
      "A",
      "I",
      "A",
      "L",
      "L",
      "N",
      "H",
      "G",
      "W",
      "E",
      "D",
      "H"
    ]
  },
  {
    "id": "quadra-092",
    "category": "Money and banking",
    "answers": [
      "COIN",
      "CENT",
      "EURO",
      "LOAN"
    ],
    "tiles": [
      "C",
      "A",
      "O",
      "O",
      "L",
      "I",
      "E",
      "N",
      "U",
      "T",
      "R",
      "E",
      "N",
      "C",
      "N",
      "O"
    ]
  },
  {
    "id": "quadra-093",
    "category": "Animals",
    "answers": [
      "BEAR",
      "MOLE",
      "LAMB",
      "TOAD"
    ],
    "tiles": [
      "L",
      "R",
      "A",
      "A",
      "M",
      "O",
      "L",
      "M",
      "B",
      "D",
      "B",
      "E",
      "A",
      "O",
      "T",
      "E"
    ]
  },
  {
    "id": "quadra-094",
    "category": "Colors",
    "answers": [
      "BLUE",
      "PLUM",
      "ROSE",
      "JADE"
    ],
    "tiles": [
      "S",
      "D",
      "E",
      "M",
      "L",
      "E",
      "P",
      "A",
      "R",
      "B",
      "U",
      "L",
      "J",
      "O",
      "U",
      "E"
    ]
  },
  {
    "id": "quadra-095",
    "category": "Vehicles",
    "answers": [
      "BOAT",
      "TAXI",
      "SLED",
      "CART"
    ],
    "tiles": [
      "D",
      "X",
      "O",
      "I",
      "R",
      "B",
      "E",
      "C",
      "T",
      "A",
      "S",
      "A",
      "T",
      "A",
      "T",
      "L"
    ]
  },
  {
    "id": "quadra-096",
    "category": "Car parts",
    "answers": [
      "HOOD",
      "DOOR",
      "HORN",
      "GEAR"
    ],
    "tiles": [
      "H",
      "G",
      "O",
      "R",
      "D",
      "O",
      "O",
      "H",
      "N",
      "D",
      "R",
      "E",
      "R",
      "O",
      "O",
      "A"
    ]
  },
  {
    "id": "quadra-097",
    "category": "Communication",
    "answers": [
      "CALL",
      "MAIL",
      "TALK",
      "HEAR"
    ],
    "tiles": [
      "L",
      "C",
      "K",
      "H",
      "L",
      "A",
      "M",
      "A",
      "E",
      "L",
      "L",
      "A",
      "A",
      "T",
      "I",
      "R"
    ]
  },
  {
    "id": "quadra-098",
    "category": "Grammar and language",
    "answers": [
      "NOUN",
      "PAST",
      "ROOT",
      "WORD"
    ],
    "tiles": [
      "O",
      "S",
      "O",
      "U",
      "D",
      "N",
      "W",
      "T",
      "A",
      "R",
      "T",
      "R",
      "O",
      "O",
      "P",
      "N"
    ]
  },
  {
    "id": "quadra-099",
    "category": "Chess",
    "answers": [
      "PAWN",
      "MATE",
      "DRAW",
      "RANK"
    ],
    "tiles": [
      "A",
      "N",
      "A",
      "A",
      "K",
      "W",
      "W",
      "P",
      "D",
      "T",
      "A",
      "R",
      "R",
      "E",
      "M",
      "N"
    ]
  },
  {
    "id": "quadra-100",
    "category": "Beverages",
    "answers": [
      "BEER",
      "COLA",
      "SODA",
      "MEAD"
    ],
    "tiles": [
      "C",
      "A",
      "D",
      "B",
      "M",
      "A",
      "R",
      "E",
      "D",
      "A",
      "O",
      "E",
      "O",
      "S",
      "E",
      "L"
    ]
  },
  {
    "id": "quadra-101",
    "category": "Shapes",
    "answers": [
      "CUBE",
      "STAR",
      "LINE",
      "DISK"
    ],
    "tiles": [
      "L",
      "T",
      "D",
      "E",
      "I",
      "K",
      "E",
      "R",
      "S",
      "S",
      "A",
      "N",
      "U",
      "I",
      "C",
      "B"
    ]
  },
  {
    "id": "quadra-102",
    "category": "Birds",
    "answers": [
      "DOVE",
      "WREN",
      "TERN",
      "GULL"
    ],
    "tiles": [
      "E",
      "V",
      "R",
      "E",
      "T",
      "D",
      "O",
      "U",
      "E",
      "L",
      "W",
      "N",
      "G",
      "N",
      "R",
      "L"
    ]
  },
  {
    "id": "quadra-103",
    "category": "Body parts",
    "answers": [
      "NOSE",
      "CHIN",
      "HEEL",
      "PALM"
    ],
    "tiles": [
      "S",
      "N",
      "L",
      "M",
      "C",
      "L",
      "E",
      "E",
      "H",
      "N",
      "E",
      "O",
      "H",
      "P",
      "I",
      "A"
    ]
  },
  {
    "id": "quadra-104",
    "category": "Kitchen verbs",
    "answers": [
      "BAKE",
      "CHOP",
      "WHIP",
      "BEAT"
    ],
    "tiles": [
      "B",
      "B",
      "A",
      "I",
      "C",
      "P",
      "W",
      "H",
      "A",
      "H",
      "K",
      "E",
      "P",
      "O",
      "E",
      "T"
    ]
  },
  {
    "id": "quadra-105",
    "category": "Things in the sky",
    "answers": [
      "MOON",
      "BIRD",
      "MIST",
      "RAIN"
    ],
    "tiles": [
      "I",
      "M",
      "R",
      "A",
      "I",
      "I",
      "D",
      "N",
      "R",
      "O",
      "O",
      "N",
      "M",
      "S",
      "T",
      "B"
    ]
  },
  {
    "id": "quadra-106",
    "category": "At the beach",
    "answers": [
      "SURF",
      "TIDE",
      "DUNE",
      "KELP"
    ],
    "tiles": [
      "N",
      "T",
      "E",
      "R",
      "K",
      "U",
      "L",
      "P",
      "D",
      "D",
      "U",
      "E",
      "I",
      "F",
      "E",
      "S"
    ]
  },
  {
    "id": "quadra-107",
    "category": "Reading and writing",
    "answers": [
      "PAGE",
      "POEM",
      "NOTE",
      "EDIT"
    ],
    "tiles": [
      "E",
      "A",
      "O",
      "G",
      "O",
      "E",
      "P",
      "T",
      "E",
      "T",
      "I",
      "P",
      "E",
      "D",
      "M",
      "N"
    ]
  },
  {
    "id": "quadra-108",
    "category": "Clothing",
    "answers": [
      "VEST",
      "ROBE",
      "GOWN",
      "CAPE"
    ],
    "tiles": [
      "C",
      "V",
      "E",
      "O",
      "E",
      "O",
      "P",
      "E",
      "W",
      "R",
      "T",
      "A",
      "G",
      "S",
      "N",
      "B"
    ]
  },
  {
    "id": "quadra-109",
    "category": "Cooking ingredients",
    "answers": [
      "SALT",
      "CORN",
      "HERB",
      "MILK"
    ],
    "tiles": [
      "N",
      "M",
      "T",
      "E",
      "O",
      "I",
      "S",
      "B",
      "C",
      "R",
      "L",
      "L",
      "H",
      "A",
      "R",
      "K"
    ]
  },
  {
    "id": "quadra-110",
    "category": "Parts of a home",
    "answers": [
      "ROOF",
      "HALL",
      "GATE",
      "FLUE"
    ],
    "tiles": [
      "R",
      "L",
      "U",
      "E",
      "L",
      "H",
      "G",
      "T",
      "O",
      "E",
      "F",
      "A",
      "L",
      "F",
      "O",
      "A"
    ]
  },
  {
    "id": "quadra-111",
    "category": "Computer terms",
    "answers": [
      "FILE",
      "BYTE",
      "FONT",
      "ICON"
    ],
    "tiles": [
      "O",
      "I",
      "E",
      "T",
      "F",
      "N",
      "N",
      "B",
      "O",
      "E",
      "Y",
      "F",
      "C",
      "T",
      "L",
      "I"
    ]
  },
  {
    "id": "quadra-112",
    "category": "On a farm",
    "answers": [
      "BARN",
      "GOAT",
      "PIGS",
      "CROP"
    ],
    "tiles": [
      "A",
      "P",
      "R",
      "B",
      "S",
      "I",
      "C",
      "P",
      "G",
      "R",
      "T",
      "A",
      "O",
      "O",
      "N",
      "G"
    ]
  },
  {
    "id": "quadra-113",
    "category": "In the garden",
    "answers": [
      "HOSE",
      "PLOW",
      "FORK",
      "SHED"
    ],
    "tiles": [
      "R",
      "O",
      "F",
      "H",
      "K",
      "H",
      "S",
      "D",
      "L",
      "O",
      "O",
      "P",
      "E",
      "W",
      "S",
      "E"
    ]
  },
  {
    "id": "quadra-114",
    "category": "At the bakery",
    "answers": [
      "CAKE",
      "TART",
      "PIES",
      "FLAN"
    ],
    "tiles": [
      "T",
      "P",
      "F",
      "C",
      "T",
      "A",
      "E",
      "K",
      "R",
      "A",
      "S",
      "I",
      "N",
      "L",
      "E",
      "A"
    ]
  },
  {
    "id": "quadra-115",
    "category": "Musical instruments",
    "answers": [
      "HARP",
      "OBOE",
      "LUTE",
      "BASS"
    ],
    "tiles": [
      "R",
      "P",
      "T",
      "U",
      "H",
      "S",
      "B",
      "S",
      "O",
      "L",
      "B",
      "E",
      "A",
      "A",
      "O",
      "E"
    ]
  },
  {
    "id": "quadra-116",
    "category": "Things used in sports",
    "answers": [
      "BALL",
      "BATS",
      "TEES",
      "GOAL"
    ],
    "tiles": [
      "E",
      "E",
      "L",
      "O",
      "L",
      "A",
      "T",
      "L",
      "A",
      "B",
      "G",
      "S",
      "A",
      "B",
      "T",
      "S"
    ]
  },
  {
    "id": "quadra-117",
    "category": "Ways to move on foot",
    "answers": [
      "WALK",
      "JUMP",
      "SKIP",
      "RUSH"
    ],
    "tiles": [
      "J",
      "P",
      "K",
      "W",
      "L",
      "U",
      "S",
      "I",
      "A",
      "H",
      "P",
      "S",
      "K",
      "U",
      "M",
      "R"
    ]
  },
  {
    "id": "quadra-118",
    "category": "Feelings",
    "answers": [
      "LOVE",
      "HOPE",
      "GLEE",
      "HATE"
    ],
    "tiles": [
      "E",
      "H",
      "O",
      "E",
      "H",
      "E",
      "A",
      "O",
      "E",
      "T",
      "E",
      "V",
      "L",
      "G",
      "P",
      "L"
    ]
  },
  {
    "id": "quadra-119",
    "category": "Periods of time",
    "answers": [
      "WEEK",
      "HOUR",
      "YEAR",
      "EONS"
    ],
    "tiles": [
      "U",
      "Y",
      "O",
      "O",
      "E",
      "E",
      "R",
      "S",
      "N",
      "E",
      "A",
      "W",
      "R",
      "E",
      "K",
      "H"
    ]
  },
  {
    "id": "quadra-120",
    "category": "Weather",
    "answers": [
      "SNOW",
      "HAIL",
      "GALE",
      "GUST"
    ],
    "tiles": [
      "A",
      "L",
      "H",
      "N",
      "O",
      "S",
      "S",
      "G",
      "I",
      "E",
      "A",
      "L",
      "U",
      "W",
      "T",
      "G"
    ]
  },
  {
    "id": "quadra-121",
    "category": "Money and banking",
    "answers": [
      "BILL",
      "CENT",
      "DIME",
      "DEBT"
    ],
    "tiles": [
      "D",
      "E",
      "T",
      "C",
      "T",
      "I",
      "B",
      "M",
      "D",
      "I",
      "L",
      "E",
      "N",
      "B",
      "L",
      "E"
    ]
  },
  {
    "id": "quadra-122",
    "category": "Animals",
    "answers": [
      "LION",
      "HARE",
      "NEWT",
      "FROG"
    ],
    "tiles": [
      "E",
      "R",
      "R",
      "E",
      "N",
      "W",
      "T",
      "F",
      "A",
      "I",
      "N",
      "L",
      "O",
      "G",
      "H",
      "O"
    ]
  },
  {
    "id": "quadra-123",
    "category": "Colors",
    "answers": [
      "GOLD",
      "PINK",
      "GRAY",
      "LIME"
    ],
    "tiles": [
      "R",
      "L",
      "M",
      "N",
      "L",
      "P",
      "D",
      "A",
      "E",
      "I",
      "K",
      "I",
      "Y",
      "O",
      "G",
      "G"
    ]
  },
  {
    "id": "quadra-124",
    "category": "Vehicles",
    "answers": [
      "TAXI",
      "TRAM",
      "CART",
      "BIKE"
    ],
    "tiles": [
      "K",
      "R",
      "M",
      "A",
      "E",
      "R",
      "A",
      "I",
      "T",
      "C",
      "A",
      "T",
      "T",
      "X",
      "B",
      "I"
    ]
  },
  {
    "id": "quadra-125",
    "category": "Car parts",
    "answers": [
      "HOOD",
      "TIRE",
      "AXLE",
      "GEAR"
    ],
    "tiles": [
      "A",
      "O",
      "T",
      "X",
      "R",
      "E",
      "E",
      "E",
      "O",
      "H",
      "D",
      "I",
      "A",
      "L",
      "G",
      "R"
    ]
  },
  {
    "id": "quadra-126",
    "category": "Communication",
    "answers": [
      "CHAT",
      "TEXT",
      "TALK",
      "SIGN"
    ],
    "tiles": [
      "C",
      "T",
      "L",
      "S",
      "N",
      "K",
      "T",
      "I",
      "A",
      "A",
      "T",
      "E",
      "G",
      "T",
      "H",
      "X"
    ]
  },
  {
    "id": "quadra-127",
    "category": "Grammar and language",
    "answers": [
      "CASE",
      "MOOD",
      "STEM",
      "WORD"
    ],
    "tiles": [
      "M",
      "E",
      "T",
      "D",
      "R",
      "C",
      "W",
      "M",
      "O",
      "S",
      "E",
      "S",
      "O",
      "A",
      "D",
      "O"
    ]
  },
  {
    "id": "quadra-128",
    "category": "Chess",
    "answers": [
      "KING",
      "ROOK",
      "DRAW",
      "FORK"
    ],
    "tiles": [
      "R",
      "W",
      "O",
      "D",
      "A",
      "R",
      "N",
      "O",
      "K",
      "K",
      "O",
      "K",
      "I",
      "R",
      "G",
      "F"
    ]
  },
  {
    "id": "quadra-129",
    "category": "Beverages",
    "answers": [
      "COLA",
      "MILK",
      "MEAD",
      "SAKE"
    ],
    "tiles": [
      "E",
      "C",
      "A",
      "L",
      "M",
      "M",
      "S",
      "O",
      "K",
      "I",
      "E",
      "K",
      "A",
      "L",
      "D",
      "A"
    ]
  },
  {
    "id": "quadra-130",
    "category": "Shapes",
    "answers": [
      "CUBE",
      "CONE",
      "KITE",
      "RING"
    ],
    "tiles": [
      "E",
      "T",
      "B",
      "O",
      "C",
      "U",
      "R",
      "K",
      "I",
      "G",
      "N",
      "I",
      "N",
      "E",
      "C",
      "E"
    ]
  },
  {
    "id": "quadra-131",
    "category": "Birds",
    "answers": [
      "SWAN",
      "IBIS",
      "LOON",
      "DUCK"
    ],
    "tiles": [
      "A",
      "N",
      "S",
      "B",
      "D",
      "I",
      "C",
      "N",
      "I",
      "K",
      "L",
      "O",
      "U",
      "W",
      "S",
      "O"
    ]
  },
  {
    "id": "quadra-132",
    "category": "Body parts",
    "answers": [
      "HAND",
      "BACK",
      "LUNG",
      "FACE"
    ],
    "tiles": [
      "N",
      "F",
      "C",
      "E",
      "A",
      "A",
      "D",
      "A",
      "L",
      "K",
      "N",
      "U",
      "C",
      "H",
      "G",
      "B"
    ]
  },
  {
    "id": "quadra-133",
    "category": "Kitchen verbs",
    "answers": [
      "BOIL",
      "STIR",
      "DICE",
      "SEAR"
    ],
    "tiles": [
      "A",
      "E",
      "S",
      "R",
      "L",
      "B",
      "R",
      "S",
      "E",
      "O",
      "I",
      "T",
      "I",
      "C",
      "I",
      "D"
    ]
  },
  {
    "id": "quadra-134",
    "category": "Things in the sky",
    "answers": [
      "STAR",
      "BIRD",
      "MIST",
      "HAZE"
    ],
    "tiles": [
      "S",
      "A",
      "R",
      "R",
      "Z",
      "T",
      "T",
      "I",
      "E",
      "A",
      "S",
      "D",
      "M",
      "I",
      "B",
      "H"
    ]
  },
  {
    "id": "quadra-135",
    "category": "At the beach",
    "answers": [
      "WAVE",
      "CLAM",
      "GULL",
      "KELP"
    ],
    "tiles": [
      "L",
      "E",
      "G",
      "C",
      "K",
      "V",
      "U",
      "L",
      "L",
      "W",
      "A",
      "A",
      "P",
      "E",
      "L",
      "M"
    ]
  },
  {
    "id": "quadra-136",
    "category": "Reading and writing",
    "answers": [
      "READ",
      "PAGE",
      "POEM",
      "TALE"
    ],
    "tiles": [
      "A",
      "E",
      "E",
      "O",
      "E",
      "A",
      "P",
      "T",
      "M",
      "R",
      "L",
      "G",
      "P",
      "A",
      "D",
      "E"
    ]
  },
  {
    "id": "quadra-137",
    "category": "Clothing",
    "answers": [
      "COAT",
      "SOCK",
      "GOWN",
      "CAPE"
    ],
    "tiles": [
      "O",
      "G",
      "T",
      "S",
      "P",
      "K",
      "N",
      "A",
      "E",
      "O",
      "C",
      "W",
      "A",
      "O",
      "C",
      "C"
    ]
  },
  {
    "id": "quadra-138",
    "category": "Cooking ingredients",
    "answers": [
      "SALT",
      "OATS",
      "LARD",
      "LIME"
    ],
    "tiles": [
      "M",
      "R",
      "L",
      "D",
      "T",
      "A",
      "O",
      "L",
      "E",
      "S",
      "S",
      "L",
      "A",
      "A",
      "I",
      "T"
    ]
  },
  {
    "id": "quadra-139",
    "category": "Parts of a home",
    "answers": [
      "HALL",
      "DOOR",
      "STEP",
      "FLUE"
    ],
    "tiles": [
      "D",
      "O",
      "E",
      "O",
      "A",
      "P",
      "E",
      "T",
      "F",
      "L",
      "L",
      "L",
      "H",
      "R",
      "U",
      "S"
    ]
  },
  {
    "id": "quadra-140",
    "category": "Computer terms",
    "answers": [
      "DATA",
      "CODE",
      "DISK",
      "CHIP"
    ],
    "tiles": [
      "D",
      "P",
      "A",
      "T",
      "K",
      "D",
      "H",
      "C",
      "E",
      "I",
      "D",
      "O",
      "I",
      "C",
      "A",
      "S"
    ]
  },
  {
    "id": "quadra-141",
    "category": "On a farm",
    "answers": [
      "HENS",
      "GOAT",
      "PIGS",
      "SOIL"
    ],
    "tiles": [
      "O",
      "I",
      "L",
      "O",
      "G",
      "S",
      "P",
      "A",
      "N",
      "S",
      "G",
      "I",
      "T",
      "E",
      "H",
      "S"
    ]
  },
  {
    "id": "quadra-142",
    "category": "In the garden",
    "answers": [
      "RAKE",
      "PLOW",
      "SOIL",
      "SHED"
    ],
    "tiles": [
      "I",
      "L",
      "W",
      "P",
      "R",
      "A",
      "D",
      "O",
      "E",
      "O",
      "K",
      "H",
      "S",
      "L",
      "S",
      "E"
    ]
  },
  {
    "id": "quadra-143",
    "category": "At the bakery",
    "answers": [
      "LOAF",
      "BUNS",
      "PIES",
      "FLAN"
    ],
    "tiles": [
      "S",
      "L",
      "L",
      "N",
      "U",
      "A",
      "O",
      "B",
      "N",
      "E",
      "I",
      "F",
      "S",
      "F",
      "P",
      "A"
    ]
  },
  {
    "id": "quadra-144",
    "category": "Musical instruments",
    "answers": [
      "HORN",
      "DRUM",
      "GONG",
      "PIPE"
    ],
    "tiles": [
      "U",
      "P",
      "D",
      "R",
      "H",
      "I",
      "R",
      "E",
      "G",
      "M",
      "O",
      "N",
      "N",
      "P",
      "G",
      "O"
    ]
  },
  {
    "id": "quadra-145",
    "category": "Things used in sports",
    "answers": [
      "NETS",
      "PADS",
      "PINS",
      "PUCK"
    ],
    "tiles": [
      "I",
      "D",
      "U",
      "C",
      "A",
      "P",
      "S",
      "P",
      "T",
      "K",
      "P",
      "S",
      "S",
      "N",
      "E",
      "N"
    ]
  },
  {
    "id": "quadra-146",
    "category": "Ways to move on foot",
    "answers": [
      "WALK",
      "PACE",
      "TROT",
      "RUSH"
    ],
    "tiles": [
      "L",
      "R",
      "A",
      "E",
      "P",
      "O",
      "K",
      "W",
      "T",
      "S",
      "T",
      "C",
      "R",
      "A",
      "H",
      "U"
    ]
  },
  {
    "id": "quadra-147",
    "category": "Feelings",
    "answers": [
      "FEAR",
      "RAGE",
      "CALM",
      "ENVY"
    ],
    "tiles": [
      "M",
      "E",
      "C",
      "F",
      "A",
      "E",
      "R",
      "A",
      "Y",
      "L",
      "G",
      "V",
      "A",
      "R",
      "N",
      "E"
    ]
  },
  {
    "id": "quadra-148",
    "category": "Weather",
    "answers": [
      "RAIN",
      "WIND",
      "GALE",
      "GUST"
    ],
    "tiles": [
      "G",
      "W",
      "E",
      "I",
      "G",
      "R",
      "A",
      "U",
      "N",
      "N",
      "T",
      "D",
      "S",
      "L",
      "I",
      "A"
    ]
  },
  {
    "id": "quadra-149",
    "category": "Money and banking",
    "answers": [
      "CASH",
      "NOTE",
      "DIME",
      "DEBT"
    ],
    "tiles": [
      "M",
      "E",
      "O",
      "I",
      "H",
      "C",
      "A",
      "B",
      "T",
      "E",
      "T",
      "S",
      "E",
      "D",
      "D",
      "N"
    ]
  },
  {
    "id": "quadra-150",
    "category": "Animals",
    "answers": [
      "WOLF",
      "DEER",
      "LAMB",
      "MULE"
    ],
    "tiles": [
      "A",
      "L",
      "O",
      "W",
      "B",
      "E",
      "D",
      "L",
      "M",
      "M",
      "R",
      "E",
      "F",
      "U",
      "L",
      "E"
    ]
  },
  {
    "id": "quadra-151",
    "category": "Colors",
    "answers": [
      "CYAN",
      "TEAL",
      "PINK",
      "ROSE"
    ],
    "tiles": [
      "T",
      "Y",
      "N",
      "O",
      "E",
      "C",
      "E",
      "S",
      "A",
      "P",
      "A",
      "L",
      "R",
      "K",
      "N",
      "I"
    ]
  },
  {
    "id": "quadra-152",
    "category": "Vehicles",
    "answers": [
      "SHIP",
      "TRAM",
      "SLED",
      "RAFT"
    ],
    "tiles": [
      "A",
      "R",
      "P",
      "A",
      "T",
      "E",
      "S",
      "F",
      "R",
      "S",
      "L",
      "H",
      "D",
      "M",
      "I",
      "T"
    ]
  },
  {
    "id": "quadra-153",
    "category": "Car parts",
    "answers": [
      "DOOR",
      "SEAT",
      "HORN",
      "RIMS"
    ],
    "tiles": [
      "R",
      "D",
      "T",
      "S",
      "O",
      "O",
      "R",
      "S",
      "H",
      "O",
      "E",
      "I",
      "R",
      "M",
      "N",
      "A"
    ]
  },
  {
    "id": "quadra-154",
    "category": "Communication",
    "answers": [
      "TEXT",
      "CALL",
      "TELL",
      "HEAR"
    ],
    "tiles": [
      "L",
      "L",
      "R",
      "L",
      "C",
      "E",
      "T",
      "A",
      "E",
      "T",
      "L",
      "H",
      "T",
      "X",
      "E",
      "A"
    ]
  },
  {
    "id": "quadra-155",
    "category": "Grammar and language",
    "answers": [
      "NOUN",
      "VERB",
      "STEM",
      "ROOT"
    ],
    "tiles": [
      "E",
      "R",
      "E",
      "S",
      "O",
      "M",
      "N",
      "T",
      "U",
      "V",
      "T",
      "O",
      "O",
      "N",
      "B",
      "R"
    ]
  },
  {
    "id": "quadra-156",
    "category": "Chess",
    "answers": [
      "KING",
      "PAWN",
      "FILE",
      "RANK"
    ],
    "tiles": [
      "F",
      "L",
      "I",
      "E",
      "A",
      "R",
      "N",
      "A",
      "P",
      "G",
      "W",
      "K",
      "K",
      "I",
      "N",
      "N"
    ]
  },
  {
    "id": "quadra-157",
    "category": "Shapes",
    "answers": [
      "CUBE",
      "OVAL",
      "RING",
      "LINE"
    ],
    "tiles": [
      "L",
      "R",
      "O",
      "B",
      "E",
      "V",
      "I",
      "N",
      "I",
      "U",
      "E",
      "C",
      "A",
      "N",
      "L",
      "G"
    ]
  },
  {
    "id": "quadra-158",
    "category": "Birds",
    "answers": [
      "HAWK",
      "LARK",
      "KIWI",
      "RHEA"
    ],
    "tiles": [
      "W",
      "I",
      "R",
      "I",
      "W",
      "A",
      "H",
      "E",
      "K",
      "K",
      "K",
      "H",
      "R",
      "L",
      "A",
      "A"
    ]
  },
  {
    "id": "quadra-159",
    "category": "Body parts",
    "answers": [
      "HEAD",
      "KNEE",
      "NOSE",
      "PALM"
    ],
    "tiles": [
      "A",
      "E",
      "E",
      "P",
      "N",
      "K",
      "S",
      "M",
      "E",
      "N",
      "O",
      "H",
      "A",
      "L",
      "D",
      "E"
    ]
  },
  {
    "id": "quadra-160",
    "category": "Kitchen verbs",
    "answers": [
      "BAKE",
      "PEEL",
      "DICE",
      "WHIP"
    ],
    "tiles": [
      "E",
      "E",
      "W",
      "K",
      "A",
      "I",
      "H",
      "P",
      "C",
      "P",
      "B",
      "L",
      "E",
      "D",
      "E",
      "I"
    ]
  },
  {
    "id": "quadra-161",
    "category": "Things in the sky",
    "answers": [
      "MOON",
      "STAR",
      "MIST",
      "SNOW"
    ],
    "tiles": [
      "A",
      "T",
      "N",
      "S",
      "O",
      "S",
      "M",
      "O",
      "R",
      "O",
      "T",
      "M",
      "N",
      "I",
      "W",
      "S"
    ]
  },
  {
    "id": "quadra-162",
    "category": "At the beach",
    "answers": [
      "SURF",
      "WAVE",
      "DUNE",
      "CRAB"
    ],
    "tiles": [
      "U",
      "F",
      "E",
      "U",
      "A",
      "N",
      "C",
      "R",
      "S",
      "A",
      "V",
      "W",
      "D",
      "B",
      "E",
      "R"
    ]
  },
  {
    "id": "quadra-163",
    "category": "Reading and writing",
    "answers": [
      "BOOK",
      "PAGE",
      "TALE",
      "EDIT"
    ],
    "tiles": [
      "D",
      "T",
      "K",
      "A",
      "B",
      "I",
      "L",
      "E",
      "E",
      "O",
      "E",
      "T",
      "O",
      "G",
      "P",
      "A"
    ]
  },
  {
    "id": "quadra-164",
    "category": "Clothing",
    "answers": [
      "VEST",
      "ROBE",
      "KILT",
      "SUIT"
    ],
    "tiles": [
      "V",
      "E",
      "B",
      "K",
      "R",
      "O",
      "I",
      "L",
      "T",
      "U",
      "S",
      "E",
      "S",
      "T",
      "I",
      "T"
    ]
  },
  {
    "id": "quadra-165",
    "category": "Cooking ingredients",
    "answers": [
      "RICE",
      "OATS",
      "HERB",
      "MILK"
    ],
    "tiles": [
      "R",
      "R",
      "A",
      "C",
      "B",
      "S",
      "M",
      "I",
      "K",
      "E",
      "I",
      "L",
      "T",
      "O",
      "E",
      "H"
    ]
  },
  {
    "id": "quadra-166",
    "category": "Parts of a home",
    "answers": [
      "ROOM",
      "WALL",
      "DOOR",
      "STEP"
    ],
    "tiles": [
      "A",
      "S",
      "W",
      "D",
      "O",
      "M",
      "E",
      "L",
      "L",
      "R",
      "O",
      "O",
      "P",
      "T",
      "R",
      "O"
    ]
  },
  {
    "id": "quadra-167",
    "category": "Computer terms",
    "answers": [
      "CODE",
      "DISK",
      "FONT",
      "ICON"
    ],
    "tiles": [
      "O",
      "O",
      "O",
      "E",
      "D",
      "I",
      "N",
      "I",
      "F",
      "C",
      "K",
      "T",
      "D",
      "S",
      "C",
      "N"
    ]
  },
  {
    "id": "quadra-168",
    "category": "On a farm",
    "answers": [
      "BARN",
      "HENS",
      "COWS",
      "CROP"
    ],
    "tiles": [
      "R",
      "R",
      "S",
      "C",
      "C",
      "P",
      "B",
      "N",
      "O",
      "W",
      "S",
      "N",
      "H",
      "E",
      "O",
      "A"
    ]
  },
  {
    "id": "quadra-169",
    "category": "In the garden",
    "answers": [
      "HOSE",
      "FORK",
      "SEED",
      "POTS"
    ],
    "tiles": [
      "P",
      "E",
      "S",
      "O",
      "E",
      "O",
      "D",
      "K",
      "H",
      "R",
      "S",
      "O",
      "E",
      "F",
      "T",
      "S"
    ]
  },
  {
    "id": "quadra-170",
    "category": "At the bakery",
    "answers": [
      "CAKE",
      "TART",
      "LOAF",
      "BUNS"
    ],
    "tiles": [
      "B",
      "F",
      "T",
      "L",
      "E",
      "A",
      "U",
      "T",
      "A",
      "O",
      "C",
      "K",
      "R",
      "N",
      "S",
      "A"
    ]
  },
  {
    "id": "quadra-171",
    "category": "Musical instruments",
    "answers": [
      "HARP",
      "OBOE",
      "DRUM",
      "PIPE"
    ],
    "tiles": [
      "R",
      "P",
      "O",
      "B",
      "P",
      "D",
      "E",
      "A",
      "U",
      "E",
      "R",
      "O",
      "M",
      "I",
      "P",
      "H"
    ]
  },
  {
    "id": "quadra-172",
    "category": "Things used in sports",
    "answers": [
      "BATS",
      "NETS",
      "TEES",
      "PUCK"
    ],
    "tiles": [
      "S",
      "T",
      "P",
      "K",
      "C",
      "S",
      "E",
      "T",
      "A",
      "E",
      "B",
      "N",
      "T",
      "E",
      "U",
      "S"
    ]
  },
  {
    "id": "quadra-173",
    "category": "Ways to move on foot",
    "answers": [
      "JUMP",
      "SKIP",
      "PACE",
      "TROT"
    ],
    "tiles": [
      "O",
      "E",
      "M",
      "J",
      "T",
      "A",
      "S",
      "T",
      "P",
      "R",
      "K",
      "P",
      "U",
      "P",
      "I",
      "C"
    ]
  },
  {
    "id": "quadra-174",
    "category": "Feelings",
    "answers": [
      "FEAR",
      "LOVE",
      "ENVY",
      "HATE"
    ],
    "tiles": [
      "N",
      "O",
      "A",
      "V",
      "T",
      "A",
      "E",
      "F",
      "H",
      "E",
      "R",
      "L",
      "E",
      "V",
      "E",
      "Y"
    ]
  },
  {
    "id": "quadra-175",
    "category": "Weather",
    "answers": [
      "SNOW",
      "WIND",
      "GUST",
      "HAZE"
    ],
    "tiles": [
      "S",
      "W",
      "O",
      "Z",
      "N",
      "S",
      "A",
      "G",
      "U",
      "W",
      "D",
      "T",
      "E",
      "I",
      "H",
      "N"
    ]
  },
  {
    "id": "quadra-176",
    "category": "Money and banking",
    "answers": [
      "COIN",
      "BILL",
      "LOAN",
      "BANK"
    ],
    "tiles": [
      "A",
      "O",
      "O",
      "I",
      "K",
      "L",
      "B",
      "N",
      "B",
      "I",
      "N",
      "L",
      "N",
      "C",
      "A",
      "L"
    ]
  },
  {
    "id": "quadra-177",
    "category": "Animals",
    "answers": [
      "BEAR",
      "LYNX",
      "SEAL",
      "NEWT"
    ],
    "tiles": [
      "L",
      "S",
      "X",
      "E",
      "W",
      "Y",
      "E",
      "N",
      "T",
      "A",
      "L",
      "B",
      "E",
      "A",
      "R",
      "N"
    ]
  },
  {
    "id": "quadra-178",
    "category": "Colors",
    "answers": [
      "BLUE",
      "GOLD",
      "JADE",
      "AQUA"
    ],
    "tiles": [
      "G",
      "L",
      "U",
      "D",
      "D",
      "B",
      "O",
      "L",
      "J",
      "A",
      "E",
      "E",
      "Q",
      "A",
      "A",
      "U"
    ]
  },
  {
    "id": "quadra-179",
    "category": "Vehicles",
    "answers": [
      "BOAT",
      "JEEP",
      "SLED",
      "BIKE"
    ],
    "tiles": [
      "K",
      "B",
      "P",
      "B",
      "E",
      "L",
      "E",
      "S",
      "J",
      "E",
      "D",
      "E",
      "I",
      "T",
      "A",
      "O"
    ]
  },
  {
    "id": "quadra-180",
    "category": "Car parts",
    "answers": [
      "HOOD",
      "SEAT",
      "GEAR",
      "RIMS"
    ],
    "tiles": [
      "G",
      "E",
      "M",
      "H",
      "I",
      "T",
      "R",
      "A",
      "S",
      "R",
      "O",
      "D",
      "E",
      "O",
      "A",
      "S"
    ]
  },
  {
    "id": "quadra-181",
    "category": "Communication",
    "answers": [
      "CHAT",
      "CALL",
      "SIGN",
      "HEAR"
    ],
    "tiles": [
      "C",
      "S",
      "L",
      "N",
      "G",
      "A",
      "A",
      "L",
      "H",
      "T",
      "C",
      "A",
      "R",
      "H",
      "I",
      "E"
    ]
  },
  {
    "id": "quadra-182",
    "category": "Grammar and language",
    "answers": [
      "NOUN",
      "MOOD",
      "PAST",
      "STEM"
    ],
    "tiles": [
      "N",
      "M",
      "P",
      "A",
      "S",
      "E",
      "T",
      "T",
      "O",
      "S",
      "M",
      "D",
      "N",
      "U",
      "O",
      "O"
    ]
  },
  {
    "id": "quadra-183",
    "category": "Chess",
    "answers": [
      "ROOK",
      "PAWN",
      "DRAW",
      "FILE"
    ],
    "tiles": [
      "R",
      "N",
      "F",
      "I",
      "W",
      "E",
      "L",
      "O",
      "D",
      "O",
      "R",
      "A",
      "A",
      "K",
      "W",
      "P"
    ]
  },
  {
    "id": "quadra-184",
    "category": "Shapes",
    "answers": [
      "CONE",
      "OVAL",
      "KITE",
      "LINE"
    ],
    "tiles": [
      "V",
      "A",
      "L",
      "N",
      "E",
      "I",
      "O",
      "E",
      "T",
      "E",
      "N",
      "L",
      "C",
      "O",
      "I",
      "K"
    ]
  },
  {
    "id": "quadra-185",
    "category": "Birds",
    "answers": [
      "CROW",
      "SWAN",
      "WREN",
      "LOON"
    ],
    "tiles": [
      "O",
      "E",
      "R",
      "N",
      "O",
      "W",
      "R",
      "N",
      "C",
      "W",
      "S",
      "O",
      "N",
      "W",
      "A",
      "L"
    ]
  },
  {
    "id": "quadra-186",
    "category": "Body parts",
    "answers": [
      "HAND",
      "KNEE",
      "BACK",
      "CHIN"
    ],
    "tiles": [
      "C",
      "K",
      "H",
      "D",
      "K",
      "N",
      "A",
      "N",
      "H",
      "A",
      "N",
      "B",
      "C",
      "E",
      "E",
      "I"
    ]
  },
  {
    "id": "quadra-187",
    "category": "Kitchen verbs",
    "answers": [
      "STIR",
      "CHOP",
      "BEAT",
      "SEAR"
    ],
    "tiles": [
      "R",
      "C",
      "B",
      "P",
      "T",
      "I",
      "A",
      "R",
      "H",
      "A",
      "O",
      "E",
      "T",
      "E",
      "S",
      "S"
    ]
  },
  {
    "id": "quadra-188",
    "category": "Things in the sky",
    "answers": [
      "MOON",
      "KITE",
      "MIST",
      "HAZE"
    ],
    "tiles": [
      "K",
      "E",
      "S",
      "I",
      "E",
      "I",
      "N",
      "Z",
      "M",
      "O",
      "A",
      "T",
      "M",
      "H",
      "T",
      "O"
    ]
  },
  {
    "id": "quadra-189",
    "category": "At the beach",
    "answers": [
      "SAND",
      "TIDE",
      "DUNE",
      "GULL"
    ],
    "tiles": [
      "S",
      "T",
      "E",
      "D",
      "U",
      "D",
      "U",
      "N",
      "D",
      "N",
      "L",
      "E",
      "I",
      "L",
      "G",
      "A"
    ]
  },
  {
    "id": "quadra-190",
    "category": "Reading and writing",
    "answers": [
      "BOOK",
      "READ",
      "POEM",
      "EDIT"
    ],
    "tiles": [
      "E",
      "O",
      "K",
      "O",
      "R",
      "T",
      "P",
      "B",
      "A",
      "M",
      "E",
      "D",
      "D",
      "E",
      "I",
      "O"
    ]
  },
  {
    "id": "quadra-191",
    "category": "Clothing",
    "answers": [
      "COAT",
      "VEST",
      "CAPE",
      "SUIT"
    ],
    "tiles": [
      "V",
      "C",
      "T",
      "P",
      "E",
      "E",
      "I",
      "C",
      "S",
      "T",
      "O",
      "S",
      "T",
      "U",
      "A",
      "A"
    ]
  },
  {
    "id": "quadra-192",
    "category": "Cooking ingredients",
    "answers": [
      "RICE",
      "CORN",
      "LARD",
      "MILK"
    ],
    "tiles": [
      "R",
      "R",
      "O",
      "M",
      "D",
      "K",
      "R",
      "C",
      "I",
      "I",
      "E",
      "L",
      "L",
      "A",
      "N",
      "C"
    ]
  },
  {
    "id": "quadra-193",
    "category": "Parts of a home",
    "answers": [
      "WALL",
      "ROOF",
      "DOOR",
      "FLUE"
    ],
    "tiles": [
      "U",
      "R",
      "O",
      "R",
      "A",
      "L",
      "O",
      "L",
      "F",
      "D",
      "O",
      "O",
      "F",
      "E",
      "L",
      "W"
    ]
  },
  {
    "id": "quadra-194",
    "category": "Computer terms",
    "answers": [
      "BYTE",
      "DATA",
      "DISK",
      "FONT"
    ],
    "tiles": [
      "A",
      "I",
      "K",
      "N",
      "O",
      "E",
      "S",
      "B",
      "F",
      "T",
      "D",
      "D",
      "T",
      "Y",
      "A",
      "T"
    ]
  },
  {
    "id": "quadra-195",
    "category": "On a farm",
    "answers": [
      "GOAT",
      "COWS",
      "PIGS",
      "SEED"
    ],
    "tiles": [
      "S",
      "S",
      "W",
      "E",
      "P",
      "G",
      "G",
      "S",
      "D",
      "E",
      "A",
      "T",
      "O",
      "I",
      "C",
      "O"
    ]
  },
  {
    "id": "quadra-196",
    "category": "In the garden",
    "answers": [
      "HOSE",
      "PLOW",
      "SOIL",
      "POTS"
    ],
    "tiles": [
      "E",
      "O",
      "H",
      "I",
      "S",
      "L",
      "W",
      "O",
      "S",
      "P",
      "P",
      "L",
      "O",
      "O",
      "T",
      "S"
    ]
  },
  {
    "id": "quadra-197",
    "category": "Musical instruments",
    "answers": [
      "DRUM",
      "LUTE",
      "BASS",
      "PIPE"
    ],
    "tiles": [
      "A",
      "E",
      "E",
      "T",
      "S",
      "I",
      "U",
      "P",
      "D",
      "U",
      "L",
      "B",
      "R",
      "M",
      "P",
      "S"
    ]
  },
  {
    "id": "quadra-198",
    "category": "Things used in sports",
    "answers": [
      "BALL",
      "PADS",
      "GOAL",
      "PINS"
    ],
    "tiles": [
      "A",
      "G",
      "I",
      "A",
      "S",
      "P",
      "S",
      "L",
      "N",
      "A",
      "L",
      "O",
      "L",
      "D",
      "B",
      "P"
    ]
  },
  {
    "id": "quadra-199",
    "category": "Ways to move on foot",
    "answers": [
      "WALK",
      "STEP",
      "PACE",
      "LIMP"
    ],
    "tiles": [
      "A",
      "L",
      "P",
      "K",
      "W",
      "E",
      "M",
      "E",
      "T",
      "I",
      "S",
      "L",
      "A",
      "P",
      "C",
      "P"
    ]
  },
  {
    "id": "quadra-200",
    "category": "Feelings",
    "answers": [
      "HOPE",
      "RAGE",
      "CALM",
      "GLEE"
    ],
    "tiles": [
      "E",
      "H",
      "E",
      "E",
      "M",
      "O",
      "C",
      "P",
      "L",
      "L",
      "G",
      "A",
      "R",
      "E",
      "G",
      "A"
    ]
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 200,
  "additionalEditorialCategoryPools": 30,
  "distinctPoolWords": 237,
  "maxSharedWordsPerAddedBoard": 2,
  "addedRacksWithUniqueCategoryPartition": 170
});
