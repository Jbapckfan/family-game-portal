// Original puzzle content authored for this integration. DeepSeek supplied the game concept.
const ORIGINAL_PUZZLES = [
  {
    "id": "split-01",
    "words": [
      "BRAVE",
      "QUIET"
    ],
    "clues": [
      "Facing danger with courage.",
      "Making little or no noise."
    ],
    "rack": [
      "E",
      "T",
      "E",
      "R",
      "A",
      "I",
      "B",
      "Q",
      "V",
      "U"
    ]
  },
  {
    "id": "split-02",
    "words": [
      "OCEAN",
      "RIVER"
    ],
    "clues": [
      "A vast body of salt water.",
      "A natural stream flowing toward a sea or lake."
    ],
    "rack": [
      "I",
      "V",
      "N",
      "C",
      "O",
      "E",
      "R",
      "E",
      "A",
      "R"
    ]
  },
  {
    "id": "split-03",
    "words": [
      "CLOUD",
      "STORM"
    ],
    "clues": [
      "A visible mass of water droplets in the sky.",
      "A period of violent wind, rain, or snow."
    ],
    "rack": [
      "R",
      "D",
      "O",
      "M",
      "O",
      "U",
      "C",
      "L",
      "T",
      "S"
    ]
  },
  {
    "id": "split-04",
    "words": [
      "NIGHT",
      "LIGHT"
    ],
    "clues": [
      "The dark hours between sunset and sunrise.",
      "What makes things visible to the eye."
    ],
    "rack": [
      "N",
      "L",
      "H",
      "H",
      "G",
      "T",
      "G",
      "T",
      "I",
      "I"
    ]
  },
  {
    "id": "split-05",
    "words": [
      "SWEET",
      "SHARP"
    ],
    "clues": [
      "Tasting like sugar.",
      "Having a keen cutting edge."
    ],
    "rack": [
      "R",
      "S",
      "E",
      "W",
      "A",
      "S",
      "H",
      "P",
      "T",
      "E"
    ]
  },
  {
    "id": "split-06",
    "words": [
      "STONE",
      "BRICK"
    ],
    "clues": [
      "A small piece of rock.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "N",
      "I",
      "B",
      "O",
      "S",
      "K",
      "R",
      "E",
      "T",
      "C"
    ]
  },
  {
    "id": "split-07",
    "words": [
      "GRAPE",
      "LEMON"
    ],
    "clues": [
      "A small fruit that grows in clusters on a vine.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "R",
      "E",
      "L",
      "G",
      "P",
      "M",
      "E",
      "A",
      "N",
      "O"
    ]
  },
  {
    "id": "split-08",
    "words": [
      "APPLE",
      "PEACH"
    ],
    "clues": [
      "A round orchard fruit often used in pie.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "H",
      "A",
      "A",
      "P",
      "L",
      "E",
      "E",
      "P",
      "C",
      "P"
    ]
  },
  {
    "id": "split-09",
    "words": [
      "CHAIR",
      "TABLE"
    ],
    "clues": [
      "A separate seat with a back, usually for one person.",
      "Furniture with a flat top used for meals or work."
    ],
    "rack": [
      "T",
      "A",
      "L",
      "E",
      "H",
      "C",
      "B",
      "I",
      "A",
      "R"
    ]
  },
  {
    "id": "split-10",
    "words": [
      "TRAIN",
      "PLANE"
    ],
    "clues": [
      "Connected railway cars pulled along a track.",
      "A powered aircraft with fixed wings."
    ],
    "rack": [
      "N",
      "A",
      "T",
      "I",
      "E",
      "P",
      "N",
      "R",
      "A",
      "L"
    ]
  },
  {
    "id": "split-11",
    "words": [
      "CROWN",
      "SWORD"
    ],
    "clues": [
      "A ceremonial headpiece worn by a monarch.",
      "A weapon with a long metal blade and a handle."
    ],
    "rack": [
      "R",
      "W",
      "D",
      "O",
      "N",
      "S",
      "O",
      "C",
      "R",
      "W"
    ]
  },
  {
    "id": "split-12",
    "words": [
      "NORTH",
      "SOUTH"
    ],
    "clues": [
      "The compass direction toward the Arctic.",
      "The compass direction opposite north."
    ],
    "rack": [
      "H",
      "S",
      "T",
      "O",
      "T",
      "U",
      "H",
      "R",
      "N",
      "O"
    ]
  },
  {
    "id": "split-13",
    "words": [
      "SMILE",
      "LAUGH"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "To make sounds that express amusement."
    ],
    "rack": [
      "M",
      "L",
      "E",
      "U",
      "L",
      "I",
      "G",
      "S",
      "H",
      "A"
    ]
  },
  {
    "id": "split-14",
    "words": [
      "PAINT",
      "BRUSH"
    ],
    "clues": [
      "A colored coating spread onto a surface.",
      "A tool with bristles used to apply a coating."
    ],
    "rack": [
      "U",
      "H",
      "P",
      "R",
      "A",
      "I",
      "N",
      "T",
      "B",
      "S"
    ]
  },
  {
    "id": "split-15",
    "words": [
      "HEART",
      "BRAIN"
    ],
    "clues": [
      "The organ that pumps blood around the body.",
      "The organ in the skull that coordinates thought."
    ],
    "rack": [
      "R",
      "A",
      "E",
      "R",
      "H",
      "N",
      "A",
      "T",
      "I",
      "B"
    ]
  },
  {
    "id": "split-16",
    "words": [
      "WATCH",
      "CLOCK"
    ],
    "clues": [
      "A small timepiece worn on the wrist.",
      "A timepiece commonly hung on a wall."
    ],
    "rack": [
      "K",
      "L",
      "T",
      "C",
      "C",
      "W",
      "H",
      "O",
      "C",
      "A"
    ]
  },
  {
    "id": "split-17",
    "words": [
      "SHEEP",
      "HORSE"
    ],
    "clues": [
      "A farm animal raised for its wool.",
      "A large hoofed animal used for riding."
    ],
    "rack": [
      "O",
      "P",
      "H",
      "H",
      "E",
      "E",
      "R",
      "S",
      "E",
      "S"
    ]
  },
  {
    "id": "split-18",
    "words": [
      "TIGER",
      "ZEBRA"
    ],
    "clues": [
      "A large wild cat with dark stripes.",
      "An African hoofed animal with black and white stripes."
    ],
    "rack": [
      "R",
      "E",
      "A",
      "Z",
      "R",
      "B",
      "E",
      "T",
      "I",
      "G"
    ]
  },
  {
    "id": "split-19",
    "words": [
      "BREAD",
      "TOAST"
    ],
    "clues": [
      "A staple food baked from flour-based dough.",
      "Bread browned by dry heat."
    ],
    "rack": [
      "B",
      "A",
      "A",
      "T",
      "O",
      "E",
      "D",
      "T",
      "S",
      "R"
    ]
  },
  {
    "id": "split-20",
    "words": [
      "FLAME",
      "SPARK"
    ],
    "clues": [
      "The visible, glowing part of a fire.",
      "A tiny glowing particle thrown from a fire."
    ],
    "rack": [
      "P",
      "A",
      "F",
      "S",
      "R",
      "A",
      "M",
      "E",
      "K",
      "L"
    ]
  },
  {
    "id": "split-21",
    "words": [
      "RINGS",
      "PEARL"
    ],
    "clues": [
      "Circular bands often worn on fingers.",
      "A smooth gem formed inside an oyster."
    ],
    "rack": [
      "P",
      "I",
      "S",
      "E",
      "G",
      "R",
      "R",
      "A",
      "L",
      "N"
    ]
  },
  {
    "id": "split-22",
    "words": [
      "SPICE",
      "HONEY"
    ],
    "clues": [
      "An aromatic plant ingredient used to flavor food.",
      "A sweet substance made by bees."
    ],
    "rack": [
      "C",
      "Y",
      "E",
      "H",
      "N",
      "S",
      "P",
      "O",
      "I",
      "E"
    ]
  },
  {
    "id": "split-23",
    "words": [
      "SILK",
      "COTTON"
    ],
    "clues": [
      "A smooth fiber produced by certain insect larvae.",
      "A soft fiber harvested from fluffy plant bolls."
    ],
    "rack": [
      "N",
      "C",
      "T",
      "K",
      "L",
      "T",
      "O",
      "S",
      "O",
      "I"
    ]
  },
  {
    "id": "split-24",
    "words": [
      "WOLF",
      "RABBIT"
    ],
    "clues": [
      "A wild canine that often lives in a pack.",
      "A long-eared mammal that hops."
    ],
    "rack": [
      "O",
      "A",
      "T",
      "B",
      "R",
      "B",
      "I",
      "W",
      "F",
      "L"
    ]
  },
  {
    "id": "split-25",
    "words": [
      "MOON",
      "PLANET"
    ],
    "clues": [
      "Earth's natural satellite.",
      "A large body that orbits a star."
    ],
    "rack": [
      "L",
      "N",
      "T",
      "E",
      "M",
      "O",
      "N",
      "O",
      "A",
      "P"
    ]
  },
  {
    "id": "split-26",
    "words": [
      "SNOW",
      "WINTER"
    ],
    "clues": [
      "Soft frozen flakes falling from clouds.",
      "The coldest season of the year."
    ],
    "rack": [
      "I",
      "R",
      "S",
      "W",
      "N",
      "W",
      "E",
      "N",
      "O",
      "T"
    ]
  },
  {
    "id": "split-27",
    "words": [
      "ROSE",
      "VIOLET"
    ],
    "clues": [
      "A fragrant flower on a thorny shrub.",
      "A small flower whose name also means purple."
    ],
    "rack": [
      "O",
      "L",
      "I",
      "T",
      "E",
      "S",
      "V",
      "R",
      "E",
      "O"
    ]
  },
  {
    "id": "split-28",
    "words": [
      "LAMP",
      "CANDLE"
    ],
    "clues": [
      "A device that gives light, often placed on a desk.",
      "A stick of wax with a wick for burning."
    ],
    "rack": [
      "N",
      "L",
      "E",
      "L",
      "D",
      "P",
      "M",
      "C",
      "A",
      "A"
    ]
  },
  {
    "id": "split-29",
    "words": [
      "FROG",
      "TURTLE"
    ],
    "clues": [
      "An amphibian with long back legs for jumping.",
      "A reptile protected by a hard shell."
    ],
    "rack": [
      "U",
      "O",
      "G",
      "R",
      "L",
      "T",
      "E",
      "R",
      "T",
      "F"
    ]
  },
  {
    "id": "split-30",
    "words": [
      "TIDE",
      "STREAM"
    ],
    "clues": [
      "The regular rise and fall of sea level.",
      "A small natural flow of water."
    ],
    "rack": [
      "R",
      "E",
      "D",
      "A",
      "S",
      "M",
      "T",
      "E",
      "T",
      "I"
    ]
  }
];

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// All published records retain their original values, IDs, and ordering.
// Additional prepared content by Alford Daily. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "split-031",
    "words": [
      "HORSE",
      "PEACH"
    ],
    "clues": [
      "A large hoofed animal used for riding.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "E",
      "E",
      "H",
      "H",
      "P",
      "R",
      "A",
      "C",
      "S",
      "O"
    ]
  },
  {
    "id": "split-032",
    "words": [
      "CLOCK",
      "TABLE"
    ],
    "clues": [
      "A timepiece commonly hung on a wall.",
      "Furniture with a flat top used for meals or work."
    ],
    "rack": [
      "T",
      "E",
      "L",
      "B",
      "C",
      "L",
      "K",
      "O",
      "C",
      "A"
    ]
  },
  {
    "id": "split-033",
    "words": [
      "RIVER",
      "SHEEP"
    ],
    "clues": [
      "A natural stream flowing toward a sea or lake.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "E",
      "S",
      "V",
      "I",
      "R",
      "E",
      "H",
      "R",
      "P",
      "E"
    ]
  },
  {
    "id": "split-034",
    "words": [
      "BRAIN",
      "SWEET"
    ],
    "clues": [
      "The organ in the skull that coordinates thought.",
      "Tasting like sugar."
    ],
    "rack": [
      "E",
      "I",
      "B",
      "N",
      "W",
      "E",
      "S",
      "A",
      "R",
      "T"
    ]
  },
  {
    "id": "split-035",
    "words": [
      "NIGHT",
      "PEARL"
    ],
    "clues": [
      "The dark hours between sunset and sunrise.",
      "A smooth gem formed inside an oyster."
    ],
    "rack": [
      "T",
      "P",
      "G",
      "L",
      "R",
      "E",
      "I",
      "H",
      "A",
      "N"
    ]
  },
  {
    "id": "split-036",
    "words": [
      "RINGS",
      "SPARK"
    ],
    "clues": [
      "Circular bands often worn on fingers.",
      "A tiny glowing particle thrown from a fire."
    ],
    "rack": [
      "N",
      "R",
      "A",
      "K",
      "I",
      "P",
      "S",
      "R",
      "S",
      "G"
    ]
  },
  {
    "id": "split-037",
    "words": [
      "HONEY",
      "GRAPE"
    ],
    "clues": [
      "A sweet substance made by bees.",
      "A small fruit that grows in clusters on a vine."
    ],
    "rack": [
      "G",
      "H",
      "O",
      "N",
      "P",
      "Y",
      "E",
      "A",
      "R",
      "E"
    ]
  },
  {
    "id": "split-038",
    "words": [
      "BREAD",
      "BRICK"
    ],
    "clues": [
      "A staple food baked from flour-based dough.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "B",
      "C",
      "R",
      "I",
      "K",
      "A",
      "D",
      "B",
      "E",
      "R"
    ]
  },
  {
    "id": "split-039",
    "words": [
      "CLOUD",
      "LEMON"
    ],
    "clues": [
      "A visible mass of water droplets in the sky.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "D",
      "L",
      "M",
      "O",
      "C",
      "N",
      "E",
      "O",
      "U",
      "L"
    ]
  },
  {
    "id": "split-040",
    "words": [
      "PLANET",
      "TIDE"
    ],
    "clues": [
      "A large body that orbits a star.",
      "The regular rise and fall of sea level."
    ],
    "rack": [
      "I",
      "D",
      "N",
      "A",
      "E",
      "E",
      "T",
      "L",
      "T",
      "P"
    ]
  },
  {
    "id": "split-041",
    "words": [
      "STREAM",
      "ROSE"
    ],
    "clues": [
      "A small natural flow of water.",
      "A fragrant flower on a thorny shrub."
    ],
    "rack": [
      "S",
      "R",
      "O",
      "T",
      "A",
      "E",
      "E",
      "M",
      "S",
      "R"
    ]
  },
  {
    "id": "split-042",
    "words": [
      "LIGHT",
      "NORTH"
    ],
    "clues": [
      "What makes things visible to the eye.",
      "The compass direction toward the Arctic."
    ],
    "rack": [
      "H",
      "O",
      "L",
      "N",
      "I",
      "R",
      "T",
      "H",
      "T",
      "G"
    ]
  },
  {
    "id": "split-043",
    "words": [
      "STONE",
      "APPLE"
    ],
    "clues": [
      "A small piece of rock.",
      "A round orchard fruit often used in pie."
    ],
    "rack": [
      "O",
      "A",
      "N",
      "P",
      "E",
      "P",
      "T",
      "S",
      "L",
      "E"
    ]
  },
  {
    "id": "split-044",
    "words": [
      "TOAST",
      "SOUTH"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "The compass direction opposite north."
    ],
    "rack": [
      "S",
      "H",
      "T",
      "O",
      "O",
      "T",
      "U",
      "A",
      "T",
      "S"
    ]
  },
  {
    "id": "split-045",
    "words": [
      "FLAME",
      "STORM"
    ],
    "clues": [
      "The visible, glowing part of a fire.",
      "A period of violent wind, rain, or snow."
    ],
    "rack": [
      "E",
      "L",
      "F",
      "S",
      "M",
      "O",
      "R",
      "T",
      "A",
      "M"
    ]
  },
  {
    "id": "split-046",
    "words": [
      "QUIET",
      "CROWN"
    ],
    "clues": [
      "Making little or no noise.",
      "A ceremonial headpiece worn by a monarch."
    ],
    "rack": [
      "U",
      "O",
      "Q",
      "I",
      "E",
      "N",
      "T",
      "W",
      "R",
      "C"
    ]
  },
  {
    "id": "split-047",
    "words": [
      "ZEBRA",
      "TRAIN"
    ],
    "clues": [
      "An African hoofed animal with black and white stripes.",
      "Connected railway cars pulled along a track."
    ],
    "rack": [
      "I",
      "Z",
      "R",
      "R",
      "A",
      "T",
      "B",
      "N",
      "A",
      "E"
    ]
  },
  {
    "id": "split-048",
    "words": [
      "VIOLET",
      "WOLF"
    ],
    "clues": [
      "A small flower whose name also means purple.",
      "A wild canine that often lives in a pack."
    ],
    "rack": [
      "L",
      "I",
      "F",
      "O",
      "O",
      "E",
      "T",
      "L",
      "V",
      "W"
    ]
  },
  {
    "id": "split-049",
    "words": [
      "SMILE",
      "TIGER"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "A large wild cat with dark stripes."
    ],
    "rack": [
      "E",
      "E",
      "G",
      "R",
      "I",
      "I",
      "M",
      "L",
      "T",
      "S"
    ]
  },
  {
    "id": "split-050",
    "words": [
      "BRAVE",
      "BRUSH"
    ],
    "clues": [
      "Facing danger with courage.",
      "A tool with bristles used to apply a coating."
    ],
    "rack": [
      "U",
      "B",
      "B",
      "H",
      "A",
      "V",
      "R",
      "R",
      "E",
      "S"
    ]
  },
  {
    "id": "split-051",
    "words": [
      "SWORD",
      "OCEAN"
    ],
    "clues": [
      "A weapon with a long metal blade and a handle.",
      "A vast body of salt water."
    ],
    "rack": [
      "N",
      "R",
      "E",
      "O",
      "D",
      "O",
      "S",
      "C",
      "W",
      "A"
    ]
  },
  {
    "id": "split-052",
    "words": [
      "CHAIR",
      "WATCH"
    ],
    "clues": [
      "A separate seat with a back, usually for one person.",
      "A small timepiece worn on the wrist."
    ],
    "rack": [
      "I",
      "A",
      "R",
      "A",
      "W",
      "C",
      "H",
      "H",
      "T",
      "C"
    ]
  },
  {
    "id": "split-053",
    "words": [
      "FROG",
      "COTTON"
    ],
    "clues": [
      "An amphibian with long back legs for jumping.",
      "A soft fiber harvested from fluffy plant bolls."
    ],
    "rack": [
      "G",
      "N",
      "O",
      "T",
      "O",
      "T",
      "R",
      "C",
      "F",
      "O"
    ]
  },
  {
    "id": "split-054",
    "words": [
      "SNOW",
      "RABBIT"
    ],
    "clues": [
      "Soft frozen flakes falling from clouds.",
      "A long-eared mammal that hops."
    ],
    "rack": [
      "B",
      "B",
      "T",
      "W",
      "A",
      "S",
      "O",
      "N",
      "R",
      "I"
    ]
  },
  {
    "id": "split-055",
    "words": [
      "WINTER",
      "MOON"
    ],
    "clues": [
      "The coldest season of the year.",
      "Earth's natural satellite."
    ],
    "rack": [
      "N",
      "N",
      "T",
      "I",
      "E",
      "R",
      "O",
      "W",
      "O",
      "M"
    ]
  },
  {
    "id": "split-056",
    "words": [
      "PLANE",
      "PAINT"
    ],
    "clues": [
      "A powered aircraft with fixed wings.",
      "A colored coating spread onto a surface."
    ],
    "rack": [
      "T",
      "P",
      "A",
      "N",
      "L",
      "A",
      "P",
      "N",
      "I",
      "E"
    ]
  },
  {
    "id": "split-057",
    "words": [
      "SPICE",
      "LAUGH"
    ],
    "clues": [
      "An aromatic plant ingredient used to flavor food.",
      "To make sounds that express amusement."
    ],
    "rack": [
      "G",
      "C",
      "A",
      "H",
      "I",
      "P",
      "S",
      "L",
      "E",
      "U"
    ]
  },
  {
    "id": "split-058",
    "words": [
      "CANDLE",
      "SILK"
    ],
    "clues": [
      "A stick of wax with a wick for burning.",
      "A smooth fiber produced by certain insect larvae."
    ],
    "rack": [
      "D",
      "N",
      "E",
      "A",
      "L",
      "I",
      "S",
      "K",
      "L",
      "C"
    ]
  },
  {
    "id": "split-059",
    "words": [
      "LAMP",
      "TURTLE"
    ],
    "clues": [
      "A device that gives light, often placed on a desk.",
      "A reptile protected by a hard shell."
    ],
    "rack": [
      "E",
      "T",
      "U",
      "A",
      "T",
      "L",
      "P",
      "R",
      "M",
      "L"
    ]
  },
  {
    "id": "split-060",
    "words": [
      "SHARP",
      "HEART"
    ],
    "clues": [
      "Having a keen cutting edge.",
      "The organ that pumps blood around the body."
    ],
    "rack": [
      "A",
      "R",
      "E",
      "R",
      "A",
      "S",
      "T",
      "H",
      "H",
      "P"
    ]
  },
  {
    "id": "split-061",
    "words": [
      "TABLE",
      "APPLE"
    ],
    "clues": [
      "Furniture with a flat top used for meals or work.",
      "A round orchard fruit often used in pie."
    ],
    "rack": [
      "L",
      "T",
      "A",
      "E",
      "E",
      "B",
      "P",
      "A",
      "P",
      "L"
    ]
  },
  {
    "id": "split-062",
    "words": [
      "SWEET",
      "OCEAN"
    ],
    "clues": [
      "Tasting like sugar.",
      "A vast body of salt water."
    ],
    "rack": [
      "E",
      "S",
      "T",
      "A",
      "W",
      "O",
      "N",
      "E",
      "C",
      "E"
    ]
  },
  {
    "id": "split-063",
    "words": [
      "PEARL",
      "SHEEP"
    ],
    "clues": [
      "A smooth gem formed inside an oyster.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "E",
      "E",
      "A",
      "P",
      "L",
      "P",
      "H",
      "R",
      "S",
      "E"
    ]
  },
  {
    "id": "split-064",
    "words": [
      "SPARK",
      "BRICK"
    ],
    "clues": [
      "A tiny glowing particle thrown from a fire.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "R",
      "C",
      "K",
      "B",
      "P",
      "R",
      "K",
      "I",
      "S",
      "A"
    ]
  },
  {
    "id": "split-065",
    "words": [
      "STONE",
      "NIGHT"
    ],
    "clues": [
      "A small piece of rock.",
      "The dark hours between sunset and sunrise."
    ],
    "rack": [
      "G",
      "T",
      "T",
      "S",
      "H",
      "N",
      "N",
      "E",
      "O",
      "I"
    ]
  },
  {
    "id": "split-066",
    "words": [
      "QUIET",
      "HORSE"
    ],
    "clues": [
      "Making little or no noise.",
      "A large hoofed animal used for riding."
    ],
    "rack": [
      "H",
      "R",
      "S",
      "U",
      "Q",
      "E",
      "T",
      "I",
      "O",
      "E"
    ]
  },
  {
    "id": "split-067",
    "words": [
      "BREAD",
      "PLANE"
    ],
    "clues": [
      "A staple food baked from flour-based dough.",
      "A powered aircraft with fixed wings."
    ],
    "rack": [
      "L",
      "P",
      "E",
      "E",
      "B",
      "R",
      "A",
      "D",
      "A",
      "N"
    ]
  },
  {
    "id": "split-068",
    "words": [
      "RINGS",
      "CHAIR"
    ],
    "clues": [
      "Circular bands often worn on fingers.",
      "A separate seat with a back, usually for one person."
    ],
    "rack": [
      "A",
      "I",
      "H",
      "C",
      "N",
      "S",
      "G",
      "R",
      "I",
      "R"
    ]
  },
  {
    "id": "split-069",
    "words": [
      "CLOUD",
      "CROWN"
    ],
    "clues": [
      "A visible mass of water droplets in the sky.",
      "A ceremonial headpiece worn by a monarch."
    ],
    "rack": [
      "U",
      "N",
      "W",
      "O",
      "C",
      "O",
      "L",
      "D",
      "R",
      "C"
    ]
  },
  {
    "id": "split-070",
    "words": [
      "TIDE",
      "WINTER"
    ],
    "clues": [
      "The regular rise and fall of sea level.",
      "The coldest season of the year."
    ],
    "rack": [
      "T",
      "E",
      "I",
      "D",
      "I",
      "T",
      "W",
      "R",
      "N",
      "E"
    ]
  },
  {
    "id": "split-071",
    "words": [
      "HEART",
      "RIVER"
    ],
    "clues": [
      "The organ that pumps blood around the body.",
      "A natural stream flowing toward a sea or lake."
    ],
    "rack": [
      "R",
      "A",
      "H",
      "R",
      "E",
      "V",
      "R",
      "E",
      "T",
      "I"
    ]
  },
  {
    "id": "split-072",
    "words": [
      "SHARP",
      "PEACH"
    ],
    "clues": [
      "Having a keen cutting edge.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "H",
      "P",
      "E",
      "C",
      "A",
      "P",
      "R",
      "H",
      "S",
      "A"
    ]
  },
  {
    "id": "split-073",
    "words": [
      "SMILE",
      "BRAIN"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "The organ in the skull that coordinates thought."
    ],
    "rack": [
      "L",
      "I",
      "I",
      "R",
      "S",
      "A",
      "N",
      "M",
      "B",
      "E"
    ]
  },
  {
    "id": "split-074",
    "words": [
      "CLOCK",
      "FLAME"
    ],
    "clues": [
      "A timepiece commonly hung on a wall.",
      "The visible, glowing part of a fire."
    ],
    "rack": [
      "A",
      "L",
      "C",
      "L",
      "C",
      "K",
      "M",
      "E",
      "F",
      "O"
    ]
  },
  {
    "id": "split-075",
    "words": [
      "BRUSH",
      "NORTH"
    ],
    "clues": [
      "A tool with bristles used to apply a coating.",
      "The compass direction toward the Arctic."
    ],
    "rack": [
      "T",
      "S",
      "B",
      "R",
      "N",
      "H",
      "O",
      "R",
      "H",
      "U"
    ]
  },
  {
    "id": "split-076",
    "words": [
      "WOLF",
      "TURTLE"
    ],
    "clues": [
      "A wild canine that often lives in a pack.",
      "A reptile protected by a hard shell."
    ],
    "rack": [
      "E",
      "O",
      "T",
      "L",
      "F",
      "U",
      "W",
      "R",
      "T",
      "L"
    ]
  },
  {
    "id": "split-077",
    "words": [
      "SPICE",
      "GRAPE"
    ],
    "clues": [
      "An aromatic plant ingredient used to flavor food.",
      "A small fruit that grows in clusters on a vine."
    ],
    "rack": [
      "S",
      "E",
      "C",
      "P",
      "G",
      "A",
      "I",
      "E",
      "P",
      "R"
    ]
  },
  {
    "id": "split-078",
    "words": [
      "SOUTH",
      "BRAVE"
    ],
    "clues": [
      "The compass direction opposite north.",
      "Facing danger with courage."
    ],
    "rack": [
      "U",
      "A",
      "S",
      "V",
      "O",
      "E",
      "T",
      "B",
      "H",
      "R"
    ]
  },
  {
    "id": "split-079",
    "words": [
      "TIGER",
      "LAUGH"
    ],
    "clues": [
      "A large wild cat with dark stripes.",
      "To make sounds that express amusement."
    ],
    "rack": [
      "T",
      "A",
      "R",
      "G",
      "E",
      "H",
      "L",
      "G",
      "U",
      "I"
    ]
  },
  {
    "id": "split-080",
    "words": [
      "TOAST",
      "PAINT"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "A colored coating spread onto a surface."
    ],
    "rack": [
      "T",
      "T",
      "I",
      "O",
      "N",
      "P",
      "T",
      "A",
      "A",
      "S"
    ]
  },
  {
    "id": "split-081",
    "words": [
      "HONEY",
      "ZEBRA"
    ],
    "clues": [
      "A sweet substance made by bees.",
      "An African hoofed animal with black and white stripes."
    ],
    "rack": [
      "H",
      "A",
      "B",
      "N",
      "R",
      "O",
      "Y",
      "E",
      "E",
      "Z"
    ]
  },
  {
    "id": "split-082",
    "words": [
      "STREAM",
      "LAMP"
    ],
    "clues": [
      "A small natural flow of water.",
      "A device that gives light, often placed on a desk."
    ],
    "rack": [
      "S",
      "R",
      "M",
      "E",
      "P",
      "T",
      "M",
      "A",
      "A",
      "L"
    ]
  },
  {
    "id": "split-083",
    "words": [
      "LIGHT",
      "WATCH"
    ],
    "clues": [
      "What makes things visible to the eye.",
      "A small timepiece worn on the wrist."
    ],
    "rack": [
      "T",
      "I",
      "G",
      "W",
      "H",
      "L",
      "C",
      "T",
      "H",
      "A"
    ]
  },
  {
    "id": "split-084",
    "words": [
      "SILK",
      "VIOLET"
    ],
    "clues": [
      "A smooth fiber produced by certain insect larvae.",
      "A small flower whose name also means purple."
    ],
    "rack": [
      "L",
      "L",
      "I",
      "T",
      "E",
      "K",
      "I",
      "O",
      "V",
      "S"
    ]
  },
  {
    "id": "split-085",
    "words": [
      "MOON",
      "COTTON"
    ],
    "clues": [
      "Earth's natural satellite.",
      "A soft fiber harvested from fluffy plant bolls."
    ],
    "rack": [
      "O",
      "T",
      "O",
      "N",
      "N",
      "C",
      "T",
      "M",
      "O",
      "O"
    ]
  },
  {
    "id": "split-086",
    "words": [
      "LEMON",
      "TRAIN"
    ],
    "clues": [
      "A sour yellow citrus fruit.",
      "Connected railway cars pulled along a track."
    ],
    "rack": [
      "T",
      "E",
      "A",
      "R",
      "M",
      "N",
      "N",
      "I",
      "O",
      "L"
    ]
  },
  {
    "id": "split-087",
    "words": [
      "CANDLE",
      "FROG"
    ],
    "clues": [
      "A stick of wax with a wick for burning.",
      "An amphibian with long back legs for jumping."
    ],
    "rack": [
      "E",
      "A",
      "D",
      "F",
      "C",
      "R",
      "G",
      "O",
      "N",
      "L"
    ]
  },
  {
    "id": "split-088",
    "words": [
      "STORM",
      "SWORD"
    ],
    "clues": [
      "A period of violent wind, rain, or snow.",
      "A weapon with a long metal blade and a handle."
    ],
    "rack": [
      "R",
      "W",
      "O",
      "O",
      "T",
      "D",
      "S",
      "M",
      "S",
      "R"
    ]
  },
  {
    "id": "split-089",
    "words": [
      "ROSE",
      "RABBIT"
    ],
    "clues": [
      "A fragrant flower on a thorny shrub.",
      "A long-eared mammal that hops."
    ],
    "rack": [
      "E",
      "R",
      "R",
      "B",
      "B",
      "S",
      "A",
      "I",
      "T",
      "O"
    ]
  },
  {
    "id": "split-090",
    "words": [
      "SNOW",
      "PLANET"
    ],
    "clues": [
      "Soft frozen flakes falling from clouds.",
      "A large body that orbits a star."
    ],
    "rack": [
      "P",
      "O",
      "E",
      "N",
      "L",
      "N",
      "A",
      "T",
      "W",
      "S"
    ]
  },
  {
    "id": "split-091",
    "words": [
      "TABLE",
      "STORM"
    ],
    "clues": [
      "Furniture with a flat top used for meals or work.",
      "A period of violent wind, rain, or snow."
    ],
    "rack": [
      "L",
      "T",
      "T",
      "R",
      "O",
      "A",
      "M",
      "E",
      "B",
      "S"
    ]
  },
  {
    "id": "split-092",
    "words": [
      "CROWN",
      "SHEEP"
    ],
    "clues": [
      "A ceremonial headpiece worn by a monarch.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "N",
      "W",
      "O",
      "C",
      "E",
      "S",
      "H",
      "R",
      "E",
      "P"
    ]
  },
  {
    "id": "split-093",
    "words": [
      "HORSE",
      "BRICK"
    ],
    "clues": [
      "A large hoofed animal used for riding.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "B",
      "C",
      "S",
      "R",
      "E",
      "H",
      "O",
      "R",
      "K",
      "I"
    ]
  },
  {
    "id": "split-094",
    "words": [
      "RIVER",
      "CLOUD"
    ],
    "clues": [
      "A natural stream flowing toward a sea or lake.",
      "A visible mass of water droplets in the sky."
    ],
    "rack": [
      "V",
      "R",
      "R",
      "E",
      "I",
      "U",
      "L",
      "D",
      "C",
      "O"
    ]
  },
  {
    "id": "split-095",
    "words": [
      "STONE",
      "GRAPE"
    ],
    "clues": [
      "A small piece of rock.",
      "A small fruit that grows in clusters on a vine."
    ],
    "rack": [
      "O",
      "T",
      "A",
      "E",
      "P",
      "G",
      "S",
      "N",
      "R",
      "E"
    ]
  },
  {
    "id": "split-096",
    "words": [
      "CHAIR",
      "SPARK"
    ],
    "clues": [
      "A separate seat with a back, usually for one person.",
      "A tiny glowing particle thrown from a fire."
    ],
    "rack": [
      "R",
      "R",
      "A",
      "A",
      "P",
      "K",
      "S",
      "C",
      "H",
      "I"
    ]
  },
  {
    "id": "split-097",
    "words": [
      "PAINT",
      "RINGS"
    ],
    "clues": [
      "A colored coating spread onto a surface.",
      "Circular bands often worn on fingers."
    ],
    "rack": [
      "G",
      "S",
      "N",
      "P",
      "A",
      "I",
      "R",
      "T",
      "I",
      "N"
    ]
  },
  {
    "id": "split-098",
    "words": [
      "NIGHT",
      "TRAIN"
    ],
    "clues": [
      "The dark hours between sunset and sunrise.",
      "Connected railway cars pulled along a track."
    ],
    "rack": [
      "H",
      "T",
      "G",
      "R",
      "I",
      "A",
      "T",
      "I",
      "N",
      "N"
    ]
  },
  {
    "id": "split-099",
    "words": [
      "LAUGH",
      "BREAD"
    ],
    "clues": [
      "To make sounds that express amusement.",
      "A staple food baked from flour-based dough."
    ],
    "rack": [
      "L",
      "D",
      "E",
      "A",
      "A",
      "U",
      "B",
      "G",
      "H",
      "R"
    ]
  },
  {
    "id": "split-100",
    "words": [
      "HEART",
      "SWEET"
    ],
    "clues": [
      "The organ that pumps blood around the body.",
      "Tasting like sugar."
    ],
    "rack": [
      "A",
      "E",
      "H",
      "R",
      "W",
      "S",
      "E",
      "E",
      "T",
      "T"
    ]
  },
  {
    "id": "split-101",
    "words": [
      "BRAIN",
      "BRAVE"
    ],
    "clues": [
      "The organ in the skull that coordinates thought.",
      "Facing danger with courage."
    ],
    "rack": [
      "I",
      "R",
      "N",
      "A",
      "B",
      "E",
      "A",
      "B",
      "R",
      "V"
    ]
  },
  {
    "id": "split-102",
    "words": [
      "FLAME",
      "OCEAN"
    ],
    "clues": [
      "The visible, glowing part of a fire.",
      "A vast body of salt water."
    ],
    "rack": [
      "E",
      "E",
      "L",
      "N",
      "C",
      "F",
      "M",
      "A",
      "A",
      "O"
    ]
  },
  {
    "id": "split-103",
    "words": [
      "SMILE",
      "PEACH"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "H",
      "E",
      "P",
      "E",
      "M",
      "L",
      "C",
      "S",
      "A",
      "I"
    ]
  },
  {
    "id": "split-104",
    "words": [
      "TIGER",
      "PLANE"
    ],
    "clues": [
      "A large wild cat with dark stripes.",
      "A powered aircraft with fixed wings."
    ],
    "rack": [
      "I",
      "L",
      "T",
      "P",
      "R",
      "G",
      "A",
      "N",
      "E",
      "E"
    ]
  },
  {
    "id": "split-105",
    "words": [
      "SOUTH",
      "BRUSH"
    ],
    "clues": [
      "The compass direction opposite north.",
      "A tool with bristles used to apply a coating."
    ],
    "rack": [
      "T",
      "B",
      "O",
      "U",
      "R",
      "S",
      "U",
      "S",
      "H",
      "H"
    ]
  },
  {
    "id": "split-106",
    "words": [
      "PEARL",
      "APPLE"
    ],
    "clues": [
      "A smooth gem formed inside an oyster.",
      "A round orchard fruit often used in pie."
    ],
    "rack": [
      "A",
      "L",
      "E",
      "P",
      "R",
      "A",
      "P",
      "L",
      "P",
      "E"
    ]
  },
  {
    "id": "split-107",
    "words": [
      "COTTON",
      "TIDE"
    ],
    "clues": [
      "A soft fiber harvested from fluffy plant bolls.",
      "The regular rise and fall of sea level."
    ],
    "rack": [
      "T",
      "O",
      "D",
      "O",
      "N",
      "T",
      "I",
      "C",
      "E",
      "T"
    ]
  },
  {
    "id": "split-108",
    "words": [
      "WOLF",
      "CANDLE"
    ],
    "clues": [
      "A wild canine that often lives in a pack.",
      "A stick of wax with a wick for burning."
    ],
    "rack": [
      "L",
      "W",
      "C",
      "F",
      "A",
      "L",
      "E",
      "D",
      "O",
      "N"
    ]
  },
  {
    "id": "split-109",
    "words": [
      "ROSE",
      "WINTER"
    ],
    "clues": [
      "A fragrant flower on a thorny shrub.",
      "The coldest season of the year."
    ],
    "rack": [
      "R",
      "N",
      "W",
      "T",
      "S",
      "E",
      "E",
      "O",
      "I",
      "R"
    ]
  },
  {
    "id": "split-110",
    "words": [
      "ZEBRA",
      "CLOCK"
    ],
    "clues": [
      "An African hoofed animal with black and white stripes.",
      "A timepiece commonly hung on a wall."
    ],
    "rack": [
      "E",
      "Z",
      "L",
      "K",
      "R",
      "A",
      "C",
      "C",
      "B",
      "O"
    ]
  },
  {
    "id": "split-111",
    "words": [
      "WATCH",
      "QUIET"
    ],
    "clues": [
      "A small timepiece worn on the wrist.",
      "Making little or no noise."
    ],
    "rack": [
      "E",
      "T",
      "I",
      "A",
      "H",
      "Q",
      "W",
      "U",
      "C",
      "T"
    ]
  },
  {
    "id": "split-112",
    "words": [
      "STREAM",
      "MOON"
    ],
    "clues": [
      "A small natural flow of water.",
      "Earth's natural satellite."
    ],
    "rack": [
      "M",
      "T",
      "A",
      "O",
      "S",
      "M",
      "R",
      "O",
      "E",
      "N"
    ]
  },
  {
    "id": "split-113",
    "words": [
      "TOAST",
      "LEMON"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "T",
      "E",
      "O",
      "S",
      "A",
      "L",
      "N",
      "T",
      "O",
      "M"
    ]
  },
  {
    "id": "split-114",
    "words": [
      "NORTH",
      "SWORD"
    ],
    "clues": [
      "The compass direction toward the Arctic.",
      "A weapon with a long metal blade and a handle."
    ],
    "rack": [
      "W",
      "O",
      "H",
      "T",
      "N",
      "R",
      "O",
      "R",
      "D",
      "S"
    ]
  },
  {
    "id": "split-115",
    "words": [
      "LIGHT",
      "HONEY"
    ],
    "clues": [
      "What makes things visible to the eye.",
      "A sweet substance made by bees."
    ],
    "rack": [
      "E",
      "H",
      "H",
      "I",
      "L",
      "O",
      "T",
      "Y",
      "N",
      "G"
    ]
  },
  {
    "id": "split-116",
    "words": [
      "PLANET",
      "SILK"
    ],
    "clues": [
      "A large body that orbits a star.",
      "A smooth fiber produced by certain insect larvae."
    ],
    "rack": [
      "L",
      "E",
      "L",
      "I",
      "S",
      "K",
      "A",
      "N",
      "T",
      "P"
    ]
  },
  {
    "id": "split-117",
    "words": [
      "LAMP",
      "RABBIT"
    ],
    "clues": [
      "A device that gives light, often placed on a desk.",
      "A long-eared mammal that hops."
    ],
    "rack": [
      "L",
      "R",
      "A",
      "M",
      "B",
      "I",
      "B",
      "T",
      "P",
      "A"
    ]
  },
  {
    "id": "split-118",
    "words": [
      "VIOLET",
      "SNOW"
    ],
    "clues": [
      "A small flower whose name also means purple.",
      "Soft frozen flakes falling from clouds."
    ],
    "rack": [
      "N",
      "E",
      "V",
      "T",
      "O",
      "L",
      "I",
      "W",
      "S",
      "O"
    ]
  },
  {
    "id": "split-119",
    "words": [
      "SPICE",
      "SHARP"
    ],
    "clues": [
      "An aromatic plant ingredient used to flavor food.",
      "Having a keen cutting edge."
    ],
    "rack": [
      "H",
      "P",
      "P",
      "R",
      "C",
      "I",
      "E",
      "A",
      "S",
      "S"
    ]
  },
  {
    "id": "split-120",
    "words": [
      "STREAM",
      "FROG"
    ],
    "clues": [
      "A small natural flow of water.",
      "An amphibian with long back legs for jumping."
    ],
    "rack": [
      "O",
      "A",
      "R",
      "M",
      "R",
      "T",
      "F",
      "S",
      "G",
      "E"
    ]
  },
  {
    "id": "split-121",
    "words": [
      "TURTLE",
      "SNOW"
    ],
    "clues": [
      "A reptile protected by a hard shell.",
      "Soft frozen flakes falling from clouds."
    ],
    "rack": [
      "U",
      "T",
      "L",
      "E",
      "W",
      "S",
      "N",
      "R",
      "O",
      "T"
    ]
  },
  {
    "id": "split-122",
    "words": [
      "BRICK",
      "SWORD"
    ],
    "clues": [
      "A rectangular block used to build walls.",
      "A weapon with a long metal blade and a handle."
    ],
    "rack": [
      "S",
      "I",
      "B",
      "R",
      "O",
      "K",
      "C",
      "R",
      "D",
      "W"
    ]
  },
  {
    "id": "split-123",
    "words": [
      "TABLE",
      "LIGHT"
    ],
    "clues": [
      "Furniture with a flat top used for meals or work.",
      "What makes things visible to the eye."
    ],
    "rack": [
      "L",
      "L",
      "A",
      "I",
      "E",
      "G",
      "B",
      "T",
      "T",
      "H"
    ]
  },
  {
    "id": "split-124",
    "words": [
      "CROWN",
      "PEACH"
    ],
    "clues": [
      "A ceremonial headpiece worn by a monarch.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "R",
      "C",
      "P",
      "H",
      "O",
      "W",
      "C",
      "E",
      "N",
      "A"
    ]
  },
  {
    "id": "split-125",
    "words": [
      "BRUSH",
      "RIVER"
    ],
    "clues": [
      "A tool with bristles used to apply a coating.",
      "A natural stream flowing toward a sea or lake."
    ],
    "rack": [
      "H",
      "I",
      "R",
      "S",
      "R",
      "R",
      "V",
      "U",
      "B",
      "E"
    ]
  },
  {
    "id": "split-126",
    "words": [
      "STONE",
      "TIGER"
    ],
    "clues": [
      "A small piece of rock.",
      "A large wild cat with dark stripes."
    ],
    "rack": [
      "I",
      "T",
      "T",
      "G",
      "O",
      "S",
      "E",
      "R",
      "N",
      "E"
    ]
  },
  {
    "id": "split-127",
    "words": [
      "CHAIR",
      "BRAIN"
    ],
    "clues": [
      "A separate seat with a back, usually for one person.",
      "The organ in the skull that coordinates thought."
    ],
    "rack": [
      "I",
      "C",
      "A",
      "H",
      "N",
      "R",
      "I",
      "A",
      "R",
      "B"
    ]
  },
  {
    "id": "split-128",
    "words": [
      "GRAPE",
      "SHEEP"
    ],
    "clues": [
      "A small fruit that grows in clusters on a vine.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "S",
      "H",
      "A",
      "P",
      "E",
      "E",
      "R",
      "G",
      "E",
      "P"
    ]
  },
  {
    "id": "split-129",
    "words": [
      "RINGS",
      "BREAD"
    ],
    "clues": [
      "Circular bands often worn on fingers.",
      "A staple food baked from flour-based dough."
    ],
    "rack": [
      "G",
      "R",
      "B",
      "I",
      "R",
      "A",
      "E",
      "S",
      "D",
      "N"
    ]
  },
  {
    "id": "split-130",
    "words": [
      "SPARK",
      "NORTH"
    ],
    "clues": [
      "A tiny glowing particle thrown from a fire.",
      "The compass direction toward the Arctic."
    ],
    "rack": [
      "R",
      "O",
      "P",
      "S",
      "H",
      "A",
      "T",
      "N",
      "R",
      "K"
    ]
  },
  {
    "id": "split-131",
    "words": [
      "PEARL",
      "CLOUD"
    ],
    "clues": [
      "A smooth gem formed inside an oyster.",
      "A visible mass of water droplets in the sky."
    ],
    "rack": [
      "L",
      "D",
      "R",
      "E",
      "A",
      "U",
      "P",
      "O",
      "C",
      "L"
    ]
  },
  {
    "id": "split-132",
    "words": [
      "HORSE",
      "APPLE"
    ],
    "clues": [
      "A large hoofed animal used for riding.",
      "A round orchard fruit often used in pie."
    ],
    "rack": [
      "O",
      "H",
      "P",
      "R",
      "P",
      "A",
      "L",
      "S",
      "E",
      "E"
    ]
  },
  {
    "id": "split-133",
    "words": [
      "LAUGH",
      "FLAME"
    ],
    "clues": [
      "To make sounds that express amusement.",
      "The visible, glowing part of a fire."
    ],
    "rack": [
      "M",
      "U",
      "H",
      "A",
      "L",
      "E",
      "G",
      "A",
      "L",
      "F"
    ]
  },
  {
    "id": "split-134",
    "words": [
      "SWEET",
      "SPICE"
    ],
    "clues": [
      "Tasting like sugar.",
      "An aromatic plant ingredient used to flavor food."
    ],
    "rack": [
      "W",
      "T",
      "I",
      "E",
      "P",
      "S",
      "E",
      "E",
      "C",
      "S"
    ]
  },
  {
    "id": "split-135",
    "words": [
      "STORM",
      "QUIET"
    ],
    "clues": [
      "A period of violent wind, rain, or snow.",
      "Making little or no noise."
    ],
    "rack": [
      "R",
      "I",
      "O",
      "E",
      "S",
      "T",
      "Q",
      "M",
      "U",
      "T"
    ]
  },
  {
    "id": "split-136",
    "words": [
      "PAINT",
      "TRAIN"
    ],
    "clues": [
      "A colored coating spread onto a surface.",
      "Connected railway cars pulled along a track."
    ],
    "rack": [
      "P",
      "A",
      "N",
      "T",
      "R",
      "T",
      "I",
      "N",
      "A",
      "I"
    ]
  },
  {
    "id": "split-137",
    "words": [
      "OCEAN",
      "BRAVE"
    ],
    "clues": [
      "A vast body of salt water.",
      "Facing danger with courage."
    ],
    "rack": [
      "E",
      "O",
      "R",
      "A",
      "N",
      "V",
      "C",
      "E",
      "B",
      "A"
    ]
  },
  {
    "id": "split-138",
    "words": [
      "SOUTH",
      "HONEY"
    ],
    "clues": [
      "The compass direction opposite north.",
      "A sweet substance made by bees."
    ],
    "rack": [
      "S",
      "H",
      "H",
      "O",
      "T",
      "U",
      "O",
      "E",
      "Y",
      "N"
    ]
  },
  {
    "id": "split-139",
    "words": [
      "SMILE",
      "CLOCK"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "A timepiece commonly hung on a wall."
    ],
    "rack": [
      "O",
      "S",
      "M",
      "C",
      "L",
      "L",
      "I",
      "C",
      "E",
      "K"
    ]
  },
  {
    "id": "split-140",
    "words": [
      "TOAST",
      "PLANE"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "A powered aircraft with fixed wings."
    ],
    "rack": [
      "E",
      "P",
      "L",
      "T",
      "A",
      "A",
      "N",
      "O",
      "T",
      "S"
    ]
  },
  {
    "id": "split-141",
    "words": [
      "HEART",
      "WATCH"
    ],
    "clues": [
      "The organ that pumps blood around the body.",
      "A small timepiece worn on the wrist."
    ],
    "rack": [
      "C",
      "T",
      "E",
      "T",
      "A",
      "H",
      "W",
      "R",
      "A",
      "H"
    ]
  },
  {
    "id": "split-142",
    "words": [
      "NIGHT",
      "ZEBRA"
    ],
    "clues": [
      "The dark hours between sunset and sunrise.",
      "An African hoofed animal with black and white stripes."
    ],
    "rack": [
      "Z",
      "G",
      "I",
      "R",
      "A",
      "T",
      "E",
      "N",
      "H",
      "B"
    ]
  },
  {
    "id": "split-143",
    "words": [
      "SHARP",
      "LEMON"
    ],
    "clues": [
      "Having a keen cutting edge.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "L",
      "N",
      "A",
      "S",
      "M",
      "P",
      "O",
      "R",
      "E",
      "H"
    ]
  },
  {
    "id": "split-144",
    "words": [
      "FROG",
      "WINTER"
    ],
    "clues": [
      "An amphibian with long back legs for jumping.",
      "The coldest season of the year."
    ],
    "rack": [
      "R",
      "T",
      "R",
      "O",
      "E",
      "I",
      "W",
      "N",
      "G",
      "F"
    ]
  },
  {
    "id": "split-145",
    "words": [
      "ROSE",
      "COTTON"
    ],
    "clues": [
      "A fragrant flower on a thorny shrub.",
      "A soft fiber harvested from fluffy plant bolls."
    ],
    "rack": [
      "T",
      "T",
      "E",
      "R",
      "N",
      "O",
      "O",
      "O",
      "C",
      "S"
    ]
  },
  {
    "id": "split-146",
    "words": [
      "CANDLE",
      "TIDE"
    ],
    "clues": [
      "A stick of wax with a wick for burning.",
      "The regular rise and fall of sea level."
    ],
    "rack": [
      "N",
      "I",
      "L",
      "A",
      "E",
      "C",
      "D",
      "D",
      "T",
      "E"
    ]
  },
  {
    "id": "split-147",
    "words": [
      "WOLF",
      "PLANET"
    ],
    "clues": [
      "A wild canine that often lives in a pack.",
      "A large body that orbits a star."
    ],
    "rack": [
      "A",
      "F",
      "W",
      "L",
      "O",
      "T",
      "E",
      "P",
      "N",
      "L"
    ]
  },
  {
    "id": "split-148",
    "words": [
      "RABBIT",
      "SILK"
    ],
    "clues": [
      "A long-eared mammal that hops.",
      "A smooth fiber produced by certain insect larvae."
    ],
    "rack": [
      "T",
      "I",
      "K",
      "I",
      "B",
      "R",
      "L",
      "S",
      "A",
      "B"
    ]
  },
  {
    "id": "split-149",
    "words": [
      "MOON",
      "TURTLE"
    ],
    "clues": [
      "Earth's natural satellite.",
      "A reptile protected by a hard shell."
    ],
    "rack": [
      "O",
      "M",
      "T",
      "T",
      "U",
      "R",
      "N",
      "E",
      "L",
      "O"
    ]
  },
  {
    "id": "split-150",
    "words": [
      "LAMP",
      "VIOLET"
    ],
    "clues": [
      "A device that gives light, often placed on a desk.",
      "A small flower whose name also means purple."
    ],
    "rack": [
      "M",
      "L",
      "I",
      "A",
      "O",
      "T",
      "L",
      "V",
      "E",
      "P"
    ]
  },
  {
    "id": "split-151",
    "words": [
      "RIVER",
      "TABLE"
    ],
    "clues": [
      "A natural stream flowing toward a sea or lake.",
      "Furniture with a flat top used for meals or work."
    ],
    "rack": [
      "A",
      "T",
      "L",
      "E",
      "V",
      "B",
      "R",
      "E",
      "I",
      "R"
    ]
  },
  {
    "id": "split-152",
    "words": [
      "PEACH",
      "BRICK"
    ],
    "clues": [
      "A fuzzy-skinned fruit with a large central pit.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "C",
      "A",
      "C",
      "I",
      "H",
      "K",
      "R",
      "P",
      "E",
      "B"
    ]
  },
  {
    "id": "split-153",
    "words": [
      "BREAD",
      "QUIET"
    ],
    "clues": [
      "A staple food baked from flour-based dough.",
      "Making little or no noise."
    ],
    "rack": [
      "Q",
      "U",
      "I",
      "E",
      "R",
      "D",
      "B",
      "E",
      "A",
      "T"
    ]
  },
  {
    "id": "split-154",
    "words": [
      "TOAST",
      "STONE"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "A small piece of rock."
    ],
    "rack": [
      "S",
      "S",
      "O",
      "E",
      "A",
      "T",
      "O",
      "T",
      "N",
      "T"
    ]
  },
  {
    "id": "split-155",
    "words": [
      "SPARK",
      "TRAIN"
    ],
    "clues": [
      "A tiny glowing particle thrown from a fire.",
      "Connected railway cars pulled along a track."
    ],
    "rack": [
      "N",
      "A",
      "K",
      "P",
      "S",
      "I",
      "R",
      "A",
      "T",
      "R"
    ]
  },
  {
    "id": "split-156",
    "words": [
      "CLOCK",
      "SHEEP"
    ],
    "clues": [
      "A timepiece commonly hung on a wall.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "C",
      "O",
      "E",
      "L",
      "C",
      "H",
      "S",
      "E",
      "P",
      "K"
    ]
  },
  {
    "id": "split-157",
    "words": [
      "SWORD",
      "SWEET"
    ],
    "clues": [
      "A weapon with a long metal blade and a handle.",
      "Tasting like sugar."
    ],
    "rack": [
      "O",
      "R",
      "E",
      "T",
      "S",
      "W",
      "W",
      "S",
      "D",
      "E"
    ]
  },
  {
    "id": "split-158",
    "words": [
      "CROWN",
      "HORSE"
    ],
    "clues": [
      "A ceremonial headpiece worn by a monarch.",
      "A large hoofed animal used for riding."
    ],
    "rack": [
      "N",
      "S",
      "H",
      "R",
      "C",
      "O",
      "O",
      "E",
      "R",
      "W"
    ]
  },
  {
    "id": "split-159",
    "words": [
      "CLOUD",
      "SHARP"
    ],
    "clues": [
      "A visible mass of water droplets in the sky.",
      "Having a keen cutting edge."
    ],
    "rack": [
      "S",
      "H",
      "R",
      "A",
      "L",
      "C",
      "U",
      "P",
      "D",
      "O"
    ]
  },
  {
    "id": "split-160",
    "words": [
      "FLAME",
      "NIGHT"
    ],
    "clues": [
      "The visible, glowing part of a fire.",
      "The dark hours between sunset and sunrise."
    ],
    "rack": [
      "F",
      "E",
      "G",
      "T",
      "A",
      "N",
      "M",
      "L",
      "H",
      "I"
    ]
  },
  {
    "id": "split-161",
    "words": [
      "BRAIN",
      "NORTH"
    ],
    "clues": [
      "The organ in the skull that coordinates thought.",
      "The compass direction toward the Arctic."
    ],
    "rack": [
      "I",
      "T",
      "B",
      "R",
      "O",
      "R",
      "N",
      "H",
      "A",
      "N"
    ]
  },
  {
    "id": "split-162",
    "words": [
      "LAUGH",
      "ZEBRA"
    ],
    "clues": [
      "To make sounds that express amusement.",
      "An African hoofed animal with black and white stripes."
    ],
    "rack": [
      "U",
      "B",
      "A",
      "L",
      "G",
      "R",
      "H",
      "A",
      "Z",
      "E"
    ]
  },
  {
    "id": "split-163",
    "words": [
      "TIGER",
      "LEMON"
    ],
    "clues": [
      "A large wild cat with dark stripes.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "E",
      "T",
      "G",
      "R",
      "E",
      "I",
      "L",
      "N",
      "M",
      "O"
    ]
  },
  {
    "id": "split-164",
    "words": [
      "APPLE",
      "HONEY"
    ],
    "clues": [
      "A round orchard fruit often used in pie.",
      "A sweet substance made by bees."
    ],
    "rack": [
      "N",
      "P",
      "O",
      "P",
      "E",
      "Y",
      "L",
      "E",
      "A",
      "H"
    ]
  },
  {
    "id": "split-165",
    "words": [
      "LIGHT",
      "OCEAN"
    ],
    "clues": [
      "What makes things visible to the eye.",
      "A vast body of salt water."
    ],
    "rack": [
      "A",
      "N",
      "H",
      "G",
      "I",
      "C",
      "L",
      "O",
      "E",
      "T"
    ]
  },
  {
    "id": "split-166",
    "words": [
      "STORM",
      "SPICE"
    ],
    "clues": [
      "A period of violent wind, rain, or snow.",
      "An aromatic plant ingredient used to flavor food."
    ],
    "rack": [
      "O",
      "I",
      "S",
      "P",
      "S",
      "R",
      "E",
      "M",
      "C",
      "T"
    ]
  },
  {
    "id": "split-167",
    "words": [
      "WATCH",
      "RINGS"
    ],
    "clues": [
      "A small timepiece worn on the wrist.",
      "Circular bands often worn on fingers."
    ],
    "rack": [
      "R",
      "S",
      "G",
      "T",
      "W",
      "C",
      "I",
      "A",
      "N",
      "H"
    ]
  },
  {
    "id": "split-168",
    "words": [
      "PEARL",
      "BRAVE"
    ],
    "clues": [
      "A smooth gem formed inside an oyster.",
      "Facing danger with courage."
    ],
    "rack": [
      "E",
      "E",
      "V",
      "A",
      "A",
      "R",
      "P",
      "B",
      "R",
      "L"
    ]
  },
  {
    "id": "split-169",
    "words": [
      "CHAIR",
      "BRUSH"
    ],
    "clues": [
      "A separate seat with a back, usually for one person.",
      "A tool with bristles used to apply a coating."
    ],
    "rack": [
      "B",
      "S",
      "A",
      "C",
      "R",
      "H",
      "R",
      "I",
      "H",
      "U"
    ]
  },
  {
    "id": "split-170",
    "words": [
      "GRAPE",
      "SOUTH"
    ],
    "clues": [
      "A small fruit that grows in clusters on a vine.",
      "The compass direction opposite north."
    ],
    "rack": [
      "P",
      "U",
      "T",
      "R",
      "O",
      "E",
      "S",
      "A",
      "H",
      "G"
    ]
  },
  {
    "id": "split-171",
    "words": [
      "SMILE",
      "PAINT"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "A colored coating spread onto a surface."
    ],
    "rack": [
      "I",
      "N",
      "P",
      "I",
      "T",
      "L",
      "M",
      "S",
      "E",
      "A"
    ]
  },
  {
    "id": "split-172",
    "words": [
      "COTTON",
      "WOLF"
    ],
    "clues": [
      "A soft fiber harvested from fluffy plant bolls.",
      "A wild canine that often lives in a pack."
    ],
    "rack": [
      "C",
      "F",
      "L",
      "O",
      "O",
      "W",
      "T",
      "T",
      "O",
      "N"
    ]
  },
  {
    "id": "split-173",
    "words": [
      "SILK",
      "STREAM"
    ],
    "clues": [
      "A smooth fiber produced by certain insect larvae.",
      "A small natural flow of water."
    ],
    "rack": [
      "T",
      "E",
      "S",
      "R",
      "L",
      "I",
      "S",
      "M",
      "A",
      "K"
    ]
  },
  {
    "id": "split-174",
    "words": [
      "ROSE",
      "CANDLE"
    ],
    "clues": [
      "A fragrant flower on a thorny shrub.",
      "A stick of wax with a wick for burning."
    ],
    "rack": [
      "A",
      "O",
      "E",
      "N",
      "D",
      "E",
      "S",
      "L",
      "R",
      "C"
    ]
  },
  {
    "id": "split-175",
    "words": [
      "RABBIT",
      "TIDE"
    ],
    "clues": [
      "A long-eared mammal that hops.",
      "The regular rise and fall of sea level."
    ],
    "rack": [
      "I",
      "B",
      "T",
      "B",
      "I",
      "R",
      "E",
      "A",
      "T",
      "D"
    ]
  },
  {
    "id": "split-176",
    "words": [
      "FROG",
      "PLANET"
    ],
    "clues": [
      "An amphibian with long back legs for jumping.",
      "A large body that orbits a star."
    ],
    "rack": [
      "G",
      "O",
      "E",
      "N",
      "R",
      "P",
      "L",
      "F",
      "T",
      "A"
    ]
  },
  {
    "id": "split-177",
    "words": [
      "LAMP",
      "WINTER"
    ],
    "clues": [
      "A device that gives light, often placed on a desk.",
      "The coldest season of the year."
    ],
    "rack": [
      "N",
      "T",
      "L",
      "I",
      "E",
      "A",
      "R",
      "W",
      "M",
      "P"
    ]
  },
  {
    "id": "split-178",
    "words": [
      "HEART",
      "PLANE"
    ],
    "clues": [
      "The organ that pumps blood around the body.",
      "A powered aircraft with fixed wings."
    ],
    "rack": [
      "H",
      "T",
      "A",
      "E",
      "N",
      "E",
      "P",
      "L",
      "A",
      "R"
    ]
  },
  {
    "id": "split-179",
    "words": [
      "MOON",
      "VIOLET"
    ],
    "clues": [
      "Earth's natural satellite.",
      "A small flower whose name also means purple."
    ],
    "rack": [
      "M",
      "T",
      "O",
      "V",
      "O",
      "O",
      "N",
      "I",
      "E",
      "L"
    ]
  },
  {
    "id": "split-180",
    "words": [
      "SNOW",
      "COTTON"
    ],
    "clues": [
      "Soft frozen flakes falling from clouds.",
      "A soft fiber harvested from fluffy plant bolls."
    ],
    "rack": [
      "C",
      "N",
      "N",
      "O",
      "O",
      "O",
      "W",
      "T",
      "T",
      "S"
    ]
  },
  {
    "id": "split-181",
    "words": [
      "TURTLE",
      "ROSE"
    ],
    "clues": [
      "A reptile protected by a hard shell.",
      "A fragrant flower on a thorny shrub."
    ],
    "rack": [
      "O",
      "T",
      "S",
      "E",
      "L",
      "U",
      "E",
      "R",
      "T",
      "R"
    ]
  },
  {
    "id": "split-182",
    "words": [
      "RINGS",
      "TABLE"
    ],
    "clues": [
      "Circular bands often worn on fingers.",
      "Furniture with a flat top used for meals or work."
    ],
    "rack": [
      "T",
      "G",
      "L",
      "N",
      "S",
      "R",
      "B",
      "I",
      "E",
      "A"
    ]
  },
  {
    "id": "split-183",
    "words": [
      "TOAST",
      "RIVER"
    ],
    "clues": [
      "Bread browned by dry heat.",
      "A natural stream flowing toward a sea or lake."
    ],
    "rack": [
      "E",
      "T",
      "S",
      "I",
      "V",
      "O",
      "A",
      "T",
      "R",
      "R"
    ]
  },
  {
    "id": "split-184",
    "words": [
      "CLOUD",
      "STONE"
    ],
    "clues": [
      "A visible mass of water droplets in the sky.",
      "A small piece of rock."
    ],
    "rack": [
      "T",
      "O",
      "N",
      "S",
      "O",
      "C",
      "L",
      "D",
      "U",
      "E"
    ]
  },
  {
    "id": "split-185",
    "words": [
      "LAUGH",
      "PEACH"
    ],
    "clues": [
      "To make sounds that express amusement.",
      "A fuzzy-skinned fruit with a large central pit."
    ],
    "rack": [
      "H",
      "H",
      "U",
      "E",
      "G",
      "A",
      "P",
      "L",
      "A",
      "C"
    ]
  },
  {
    "id": "split-186",
    "words": [
      "APPLE",
      "SWEET"
    ],
    "clues": [
      "A round orchard fruit often used in pie.",
      "Tasting like sugar."
    ],
    "rack": [
      "P",
      "A",
      "T",
      "S",
      "E",
      "P",
      "E",
      "L",
      "W",
      "E"
    ]
  },
  {
    "id": "split-187",
    "words": [
      "OCEAN",
      "SHEEP"
    ],
    "clues": [
      "A vast body of salt water.",
      "A farm animal raised for its wool."
    ],
    "rack": [
      "E",
      "C",
      "E",
      "A",
      "N",
      "S",
      "H",
      "P",
      "E",
      "O"
    ]
  },
  {
    "id": "split-188",
    "words": [
      "CLOCK",
      "BRICK"
    ],
    "clues": [
      "A timepiece commonly hung on a wall.",
      "A rectangular block used to build walls."
    ],
    "rack": [
      "I",
      "K",
      "B",
      "L",
      "O",
      "C",
      "R",
      "C",
      "K",
      "C"
    ]
  },
  {
    "id": "split-189",
    "words": [
      "BREAD",
      "CROWN"
    ],
    "clues": [
      "A staple food baked from flour-based dough.",
      "A ceremonial headpiece worn by a monarch."
    ],
    "rack": [
      "C",
      "B",
      "D",
      "R",
      "A",
      "O",
      "N",
      "R",
      "E",
      "W"
    ]
  },
  {
    "id": "split-190",
    "words": [
      "SPARK",
      "PAINT"
    ],
    "clues": [
      "A tiny glowing particle thrown from a fire.",
      "A colored coating spread onto a surface."
    ],
    "rack": [
      "R",
      "K",
      "P",
      "A",
      "P",
      "N",
      "T",
      "I",
      "A",
      "S"
    ]
  },
  {
    "id": "split-191",
    "words": [
      "STORM",
      "HORSE"
    ],
    "clues": [
      "A period of violent wind, rain, or snow.",
      "A large hoofed animal used for riding."
    ],
    "rack": [
      "R",
      "R",
      "O",
      "M",
      "O",
      "S",
      "E",
      "T",
      "S",
      "H"
    ]
  },
  {
    "id": "split-192",
    "words": [
      "PEARL",
      "BRAIN"
    ],
    "clues": [
      "A smooth gem formed inside an oyster.",
      "The organ in the skull that coordinates thought."
    ],
    "rack": [
      "P",
      "L",
      "I",
      "R",
      "B",
      "N",
      "E",
      "A",
      "R",
      "A"
    ]
  },
  {
    "id": "split-193",
    "words": [
      "GRAPE",
      "FLAME"
    ],
    "clues": [
      "A small fruit that grows in clusters on a vine.",
      "The visible, glowing part of a fire."
    ],
    "rack": [
      "A",
      "E",
      "R",
      "E",
      "A",
      "L",
      "F",
      "P",
      "M",
      "G"
    ]
  },
  {
    "id": "split-194",
    "words": [
      "BRUSH",
      "HONEY"
    ],
    "clues": [
      "A tool with bristles used to apply a coating.",
      "A sweet substance made by bees."
    ],
    "rack": [
      "S",
      "E",
      "H",
      "N",
      "O",
      "U",
      "R",
      "H",
      "B",
      "Y"
    ]
  },
  {
    "id": "split-195",
    "words": [
      "SWORD",
      "TIGER"
    ],
    "clues": [
      "A weapon with a long metal blade and a handle.",
      "A large wild cat with dark stripes."
    ],
    "rack": [
      "T",
      "E",
      "R",
      "I",
      "D",
      "W",
      "O",
      "G",
      "R",
      "S"
    ]
  },
  {
    "id": "split-196",
    "words": [
      "SMILE",
      "NIGHT"
    ],
    "clues": [
      "A pleased expression made by curving the mouth.",
      "The dark hours between sunset and sunrise."
    ],
    "rack": [
      "H",
      "L",
      "I",
      "M",
      "N",
      "I",
      "E",
      "T",
      "S",
      "G"
    ]
  },
  {
    "id": "split-197",
    "words": [
      "SOUTH",
      "LEMON"
    ],
    "clues": [
      "The compass direction opposite north.",
      "A sour yellow citrus fruit."
    ],
    "rack": [
      "E",
      "O",
      "H",
      "N",
      "T",
      "O",
      "M",
      "U",
      "L",
      "S"
    ]
  },
  {
    "id": "split-198",
    "words": [
      "PLANE",
      "NORTH"
    ],
    "clues": [
      "A powered aircraft with fixed wings.",
      "The compass direction toward the Arctic."
    ],
    "rack": [
      "T",
      "A",
      "N",
      "E",
      "N",
      "L",
      "P",
      "H",
      "R",
      "O"
    ]
  },
  {
    "id": "split-199",
    "words": [
      "WATCH",
      "BRAVE"
    ],
    "clues": [
      "A small timepiece worn on the wrist.",
      "Facing danger with courage."
    ],
    "rack": [
      "E",
      "A",
      "T",
      "R",
      "C",
      "B",
      "H",
      "V",
      "W",
      "A"
    ]
  },
  {
    "id": "split-200",
    "words": [
      "TRAIN",
      "LIGHT"
    ],
    "clues": [
      "Connected railway cars pulled along a track.",
      "What makes things visible to the eye."
    ],
    "rack": [
      "L",
      "H",
      "A",
      "I",
      "G",
      "I",
      "T",
      "N",
      "T",
      "R"
    ]
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 200,
  "curatedWordCluePairs": 60,
  "uniqueUnorderedAnswerPairs": 200
});
