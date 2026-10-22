// Original puzzle content authored for this integration. DeepSeek supplied the game concept.
const ORIGINAL_PUZZLES = [
  {
    "id": "trail-01",
    "answer": "NOTEBOOKS",
    "clue": "Bound pages used for writing notes.",
    "grid": [
      "B",
      "O",
      "O",
      "E",
      "K",
      "N",
      "T",
      "O",
      "S"
    ],
    "path": [
      5,
      7,
      6,
      3,
      0,
      1,
      2,
      4,
      8
    ],
    "accepted": [
      "NOTEBOOKS"
    ]
  },
  {
    "id": "trail-02",
    "answer": "BLUEPRINT",
    "clue": "A detailed technical drawing for a building or plan.",
    "grid": [
      "B",
      "P",
      "E",
      "L",
      "U",
      "R",
      "T",
      "N",
      "I"
    ],
    "path": [
      0,
      3,
      4,
      2,
      1,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "BLUEPRINT"
    ]
  },
  {
    "id": "trail-03",
    "answer": "WATERFALL",
    "clue": "A river dropping over a steep edge.",
    "grid": [
      "A",
      "F",
      "R",
      "W",
      "L",
      "E",
      "L",
      "A",
      "T"
    ],
    "path": [
      3,
      7,
      8,
      5,
      2,
      1,
      0,
      4,
      6
    ],
    "accepted": [
      "WATERFALL"
    ]
  },
  {
    "id": "trail-04",
    "answer": "PAINTINGS",
    "clue": "Pictures made with colored pigment.",
    "grid": [
      "I",
      "N",
      "P",
      "T",
      "A",
      "G",
      "N",
      "I",
      "S"
    ],
    "path": [
      2,
      4,
      7,
      6,
      3,
      0,
      1,
      5,
      8
    ],
    "accepted": [
      "PAINTINGS"
    ]
  },
  {
    "id": "trail-05",
    "answer": "TRIANGLES",
    "clue": "Shapes with three straight sides.",
    "grid": [
      "A",
      "N",
      "G",
      "I",
      "T",
      "L",
      "R",
      "S",
      "E"
    ],
    "path": [
      4,
      6,
      3,
      0,
      1,
      2,
      5,
      8,
      7
    ],
    "accepted": [
      "TRIANGLES"
    ]
  },
  {
    "id": "trail-06",
    "answer": "BUTTERFLY",
    "clue": "An insect with broad, often colorful wings.",
    "grid": [
      "Y",
      "B",
      "T",
      "L",
      "U",
      "T",
      "F",
      "R",
      "E"
    ],
    "path": [
      1,
      4,
      2,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "BUTTERFLY"
    ]
  },
  {
    "id": "trail-07",
    "answer": "SNOWFLAKE",
    "clue": "A tiny, patterned crystal of frozen water.",
    "grid": [
      "O",
      "N",
      "S",
      "L",
      "W",
      "K",
      "F",
      "A",
      "E"
    ],
    "path": [
      2,
      1,
      0,
      4,
      6,
      3,
      7,
      5,
      8
    ],
    "accepted": [
      "SNOWFLAKE"
    ]
  },
  {
    "id": "trail-08",
    "answer": "SUNFLOWER",
    "clue": "A tall plant with a large yellow flower head.",
    "grid": [
      "S",
      "R",
      "E",
      "U",
      "N",
      "W",
      "F",
      "L",
      "O"
    ],
    "path": [
      0,
      3,
      4,
      6,
      7,
      8,
      5,
      2,
      1
    ],
    "accepted": [
      "SUNFLOWER"
    ]
  },
  {
    "id": "trail-09",
    "answer": "HONEYCOMB",
    "clue": "A wax structure of hexagonal cells made by bees.",
    "grid": [
      "B",
      "E",
      "Y",
      "N",
      "M",
      "C",
      "O",
      "H",
      "O"
    ],
    "path": [
      7,
      6,
      3,
      1,
      2,
      5,
      8,
      4,
      0
    ],
    "accepted": [
      "HONEYCOMB"
    ]
  },
  {
    "id": "trail-10",
    "answer": "PINEAPPLE",
    "clue": "A tropical fruit with spiky skin and a leafy crown.",
    "grid": [
      "E",
      "N",
      "I",
      "A",
      "P",
      "L",
      "P",
      "P",
      "E"
    ],
    "path": [
      4,
      2,
      1,
      0,
      3,
      6,
      7,
      5,
      8
    ],
    "accepted": [
      "PINEAPPLE"
    ]
  },
  {
    "id": "trail-11",
    "answer": "CHOCOLATE",
    "clue": "A sweet treat made from cacao.",
    "grid": [
      "O",
      "L",
      "A",
      "C",
      "H",
      "T",
      "O",
      "C",
      "E"
    ],
    "path": [
      7,
      4,
      6,
      3,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "CHOCOLATE"
    ]
  },
  {
    "id": "trail-12",
    "answer": "STARLIGHT",
    "clue": "The faint glow arriving from distant suns.",
    "grid": [
      "I",
      "G",
      "T",
      "L",
      "T",
      "H",
      "A",
      "R",
      "S"
    ],
    "path": [
      8,
      4,
      6,
      7,
      3,
      0,
      1,
      5,
      2
    ],
    "accepted": [
      "STARLIGHT"
    ]
  },
  {
    "id": "trail-13",
    "answer": "CROCODILE",
    "clue": "A large reptile with powerful jaws and a long tail.",
    "grid": [
      "C",
      "O",
      "D",
      "O",
      "R",
      "I",
      "C",
      "L",
      "E"
    ],
    "path": [
      6,
      4,
      3,
      0,
      1,
      2,
      5,
      7,
      8
    ],
    "accepted": [
      "CROCODILE"
    ]
  },
  {
    "id": "trail-14",
    "answer": "JELLYFISH",
    "clue": "A drifting sea creature with a soft bell and tentacles.",
    "grid": [
      "Y",
      "F",
      "I",
      "L",
      "L",
      "S",
      "E",
      "J",
      "H"
    ],
    "path": [
      7,
      6,
      3,
      4,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "JELLYFISH"
    ]
  },
  {
    "id": "trail-15",
    "answer": "DRAGONFLY",
    "clue": "An insect with a long body and two pairs of clear wings.",
    "grid": [
      "R",
      "D",
      "Y",
      "O",
      "A",
      "L",
      "G",
      "N",
      "F"
    ],
    "path": [
      1,
      0,
      4,
      6,
      3,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "DRAGONFLY"
    ]
  },
  {
    "id": "trail-16",
    "answer": "SCARECROW",
    "clue": "A figure put in a field to frighten away birds.",
    "grid": [
      "W",
      "A",
      "R",
      "O",
      "E",
      "C",
      "C",
      "R",
      "S"
    ],
    "path": [
      8,
      5,
      1,
      2,
      4,
      6,
      7,
      3,
      0
    ],
    "accepted": [
      "SCARECROW"
    ]
  },
  {
    "id": "trail-17",
    "answer": "BACKPACKS",
    "clue": "Bags carried on the shoulders.",
    "grid": [
      "P",
      "A",
      "C",
      "A",
      "K",
      "B",
      "C",
      "K",
      "S"
    ],
    "path": [
      5,
      1,
      2,
      4,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "BACKPACKS"
    ]
  },
  {
    "id": "trail-18",
    "answer": "FIREPLACE",
    "clue": "A built-in place for a warming indoor fire.",
    "grid": [
      "E",
      "I",
      "R",
      "F",
      "C",
      "E",
      "A",
      "L",
      "P"
    ],
    "path": [
      3,
      1,
      2,
      5,
      8,
      7,
      6,
      4,
      0
    ],
    "accepted": [
      "FIREPLACE"
    ]
  },
  {
    "id": "trail-19",
    "answer": "SPACESHIP",
    "clue": "A vehicle designed to travel beyond Earth.",
    "grid": [
      "P",
      "A",
      "C",
      "I",
      "P",
      "E",
      "H",
      "S",
      "S"
    ],
    "path": [
      8,
      4,
      1,
      2,
      5,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "SPACESHIP"
    ]
  },
  {
    "id": "trail-20",
    "answer": "TELEPHONE",
    "clue": "A device for talking to someone far away.",
    "grid": [
      "E",
      "L",
      "E",
      "E",
      "T",
      "P",
      "N",
      "O",
      "H"
    ],
    "path": [
      4,
      0,
      1,
      2,
      5,
      8,
      7,
      6,
      3
    ],
    "accepted": [
      "TELEPHONE"
    ]
  },
  {
    "id": "trail-21",
    "answer": "PAPERCLIP",
    "clue": "A small bent-wire fastener for loose sheets.",
    "grid": [
      "P",
      "L",
      "C",
      "I",
      "R",
      "P",
      "P",
      "A",
      "E"
    ],
    "path": [
      6,
      7,
      5,
      8,
      4,
      2,
      1,
      3,
      0
    ],
    "accepted": [
      "PAPERCLIP"
    ]
  },
  {
    "id": "trail-22",
    "answer": "BLUEBERRY",
    "clue": "A small round fruit with deep blue skin.",
    "grid": [
      "E",
      "R",
      "Y",
      "R",
      "B",
      "U",
      "B",
      "L",
      "E"
    ],
    "path": [
      6,
      7,
      5,
      8,
      4,
      0,
      3,
      1,
      2
    ],
    "accepted": [
      "BLUEBERRY"
    ]
  },
  {
    "id": "trail-23",
    "answer": "RASPBERRY",
    "clue": "A soft red fruit made of many tiny segments.",
    "grid": [
      "R",
      "E",
      "B",
      "R",
      "A",
      "P",
      "Y",
      "R",
      "S"
    ],
    "path": [
      7,
      4,
      8,
      5,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "RASPBERRY"
    ]
  },
  {
    "id": "trail-24",
    "answer": "LIMESTONE",
    "clue": "A sedimentary rock often formed from marine remains.",
    "grid": [
      "S",
      "E",
      "M",
      "T",
      "N",
      "I",
      "O",
      "L",
      "E"
    ],
    "path": [
      7,
      5,
      2,
      1,
      0,
      3,
      6,
      4,
      8
    ],
    "accepted": [
      "LIMESTONE"
    ]
  },
  {
    "id": "trail-25",
    "answer": "BEANSTALK",
    "clue": "The climbing stem of a legume plant.",
    "grid": [
      "S",
      "N",
      "A",
      "T",
      "B",
      "E",
      "A",
      "L",
      "K"
    ],
    "path": [
      4,
      5,
      2,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "BEANSTALK"
    ]
  },
  {
    "id": "trail-26",
    "answer": "DANDELION",
    "clue": "A yellow wildflower that forms a fluffy seed head.",
    "grid": [
      "N",
      "O",
      "I",
      "D",
      "N",
      "L",
      "A",
      "D",
      "E"
    ],
    "path": [
      3,
      6,
      4,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "DANDELION"
    ]
  },
  {
    "id": "trail-27",
    "answer": "SUNSCREEN",
    "clue": "A lotion used to protect skin from sunlight.",
    "grid": [
      "S",
      "N",
      "N",
      "C",
      "E",
      "U",
      "R",
      "E",
      "S"
    ],
    "path": [
      8,
      5,
      1,
      0,
      3,
      6,
      7,
      4,
      2
    ],
    "accepted": [
      "SUNSCREEN"
    ]
  },
  {
    "id": "trail-28",
    "answer": "HAMBURGER",
    "clue": "A ground-meat patty, commonly served in a bun.",
    "grid": [
      "R",
      "E",
      "G",
      "H",
      "A",
      "R",
      "M",
      "B",
      "U"
    ],
    "path": [
      3,
      4,
      6,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "HAMBURGER"
    ]
  },
  {
    "id": "trail-29",
    "answer": "LIFEGUARD",
    "clue": "A person who watches swimmers and helps in emergencies.",
    "grid": [
      "F",
      "E",
      "G",
      "I",
      "L",
      "U",
      "D",
      "R",
      "A"
    ],
    "path": [
      4,
      3,
      0,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "LIFEGUARD"
    ]
  },
  {
    "id": "trail-30",
    "answer": "CLOCKWORK",
    "clue": "A system of gears that powers a mechanical timepiece.",
    "grid": [
      "K",
      "L",
      "O",
      "R",
      "C",
      "C",
      "O",
      "W",
      "K"
    ],
    "path": [
      4,
      1,
      2,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "CLOCKWORK"
    ]
  }
];

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// The first thirty records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "trail-031",
    "answer": "ADVENTURE",
    "clue": "An exciting experience with an uncertain outcome.",
    "grid": [
      "E",
      "R",
      "U",
      "D",
      "A",
      "T",
      "V",
      "E",
      "N"
    ],
    "path": [
      4,
      3,
      6,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "ADVENTURE"
    ]
  },
  {
    "id": "trail-032",
    "answer": "AFTERNOON",
    "clue": "The part of the day between noon and evening.",
    "grid": [
      "O",
      "O",
      "N",
      "N",
      "E",
      "F",
      "R",
      "A",
      "T"
    ],
    "path": [
      7,
      5,
      8,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "AFTERNOON"
    ]
  },
  {
    "id": "trail-033",
    "answer": "AIRPLANES",
    "clue": "Winged vehicles that fly through the sky.",
    "grid": [
      "S",
      "E",
      "N",
      "I",
      "A",
      "A",
      "R",
      "P",
      "L"
    ],
    "path": [
      4,
      3,
      6,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "AIRPLANES"
    ]
  },
  {
    "id": "trail-034",
    "answer": "ALLIGATOR",
    "clue": "A large reptile with a broad snout and powerful tail.",
    "grid": [
      "A",
      "O",
      "R",
      "L",
      "G",
      "T",
      "I",
      "L",
      "A"
    ],
    "path": [
      0,
      3,
      7,
      6,
      4,
      8,
      5,
      1,
      2
    ],
    "accepted": [
      "ALLIGATOR"
    ]
  },
  {
    "id": "trail-035",
    "answer": "APARTMENT",
    "clue": "A separate home within a larger residential building.",
    "grid": [
      "R",
      "T",
      "A",
      "A",
      "P",
      "M",
      "T",
      "N",
      "E"
    ],
    "path": [
      2,
      4,
      3,
      0,
      1,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "APARTMENT"
    ]
  },
  {
    "id": "trail-036",
    "answer": "ASTRONAUT",
    "clue": "A person trained to travel and work in space.",
    "grid": [
      "A",
      "U",
      "T",
      "N",
      "R",
      "A",
      "O",
      "S",
      "T"
    ],
    "path": [
      5,
      7,
      8,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "ASTRONAUT"
    ]
  },
  {
    "id": "trail-037",
    "answer": "BASEBALLS",
    "clue": "The stitched white balls used in a bat-and-ball sport.",
    "grid": [
      "B",
      "A",
      "L",
      "E",
      "L",
      "B",
      "S",
      "A",
      "S"
    ],
    "path": [
      5,
      7,
      6,
      3,
      0,
      1,
      2,
      4,
      8
    ],
    "accepted": [
      "BASEBALLS"
    ]
  },
  {
    "id": "trail-038",
    "answer": "BATHROOMS",
    "clue": "Rooms containing a bath, shower, or toilet.",
    "grid": [
      "O",
      "M",
      "S",
      "O",
      "T",
      "B",
      "H",
      "R",
      "A"
    ],
    "path": [
      5,
      8,
      4,
      6,
      7,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "BATHROOMS"
    ]
  },
  {
    "id": "trail-039",
    "answer": "BIRTHDAYS",
    "clue": "Annual celebrations of the days people were born.",
    "grid": [
      "S",
      "Y",
      "I",
      "A",
      "R",
      "B",
      "D",
      "H",
      "T"
    ],
    "path": [
      5,
      2,
      4,
      8,
      7,
      6,
      3,
      1,
      0
    ],
    "accepted": [
      "BIRTHDAYS"
    ]
  },
  {
    "id": "trail-040",
    "answer": "BLACKBIRD",
    "clue": "A familiar bird named for its dark plumage.",
    "grid": [
      "A",
      "L",
      "B",
      "C",
      "B",
      "D",
      "K",
      "R",
      "I"
    ],
    "path": [
      2,
      1,
      0,
      3,
      6,
      4,
      8,
      7,
      5
    ],
    "accepted": [
      "BLACKBIRD"
    ]
  },
  {
    "id": "trail-041",
    "answer": "BOOKCASES",
    "clue": "Pieces of furniture with shelves for books.",
    "grid": [
      "C",
      "K",
      "O",
      "A",
      "B",
      "O",
      "S",
      "E",
      "S"
    ],
    "path": [
      4,
      5,
      2,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "BOOKCASES"
    ]
  },
  {
    "id": "trail-042",
    "answer": "BOOKMARKS",
    "clue": "Strips or other markers that keep your place in books.",
    "grid": [
      "M",
      "A",
      "R",
      "K",
      "O",
      "K",
      "O",
      "B",
      "S"
    ],
    "path": [
      7,
      4,
      6,
      3,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "BOOKMARKS"
    ]
  },
  {
    "id": "trail-043",
    "answer": "BOOKSHOPS",
    "clue": "Stores where readers can buy volumes to read.",
    "grid": [
      "S",
      "H",
      "O",
      "K",
      "P",
      "B",
      "O",
      "O",
      "S"
    ],
    "path": [
      5,
      7,
      6,
      3,
      0,
      1,
      2,
      4,
      8
    ],
    "accepted": [
      "BOOKSHOPS"
    ]
  },
  {
    "id": "trail-044",
    "answer": "BREAKFAST",
    "clue": "The first meal of the day.",
    "grid": [
      "K",
      "A",
      "R",
      "F",
      "E",
      "B",
      "A",
      "S",
      "T"
    ],
    "path": [
      5,
      2,
      4,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "BREAKFAST"
    ]
  },
  {
    "id": "trail-045",
    "answer": "CALENDARS",
    "clue": "Charts that organize the days, weeks, and months of a year.",
    "grid": [
      "D",
      "R",
      "S",
      "A",
      "N",
      "C",
      "E",
      "L",
      "A"
    ],
    "path": [
      5,
      8,
      7,
      6,
      4,
      0,
      3,
      1,
      2
    ],
    "accepted": [
      "CALENDARS"
    ]
  },
  {
    "id": "trail-046",
    "answer": "CAMPFIRES",
    "clue": "Outdoor fires around which campers gather.",
    "grid": [
      "R",
      "E",
      "S",
      "I",
      "P",
      "A",
      "F",
      "C",
      "M"
    ],
    "path": [
      7,
      5,
      8,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "CAMPFIRES"
    ]
  },
  {
    "id": "trail-047",
    "answer": "CARNATION",
    "clue": "A flower with frilled petals, often given in bouquets.",
    "grid": [
      "N",
      "O",
      "I",
      "C",
      "R",
      "T",
      "A",
      "A",
      "N"
    ],
    "path": [
      3,
      6,
      4,
      8,
      7,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "CARNATION"
    ]
  },
  {
    "id": "trail-048",
    "answer": "CARPENTER",
    "clue": "A skilled worker who builds and repairs things made of wood.",
    "grid": [
      "T",
      "E",
      "C",
      "N",
      "R",
      "A",
      "E",
      "P",
      "R"
    ],
    "path": [
      2,
      5,
      8,
      7,
      6,
      3,
      0,
      1,
      4
    ],
    "accepted": [
      "CARPENTER"
    ]
  },
  {
    "id": "trail-049",
    "answer": "CARTWHEEL",
    "clue": "A sideways gymnastic turn with hands and feet touching the ground in sequence.",
    "grid": [
      "R",
      "T",
      "W",
      "C",
      "A",
      "H",
      "L",
      "E",
      "E"
    ],
    "path": [
      3,
      4,
      0,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "CARTWHEEL"
    ]
  },
  {
    "id": "trail-050",
    "answer": "CELEBRATE",
    "clue": "To mark a happy or important occasion with festivities.",
    "grid": [
      "E",
      "T",
      "R",
      "C",
      "B",
      "A",
      "E",
      "L",
      "E"
    ],
    "path": [
      3,
      6,
      7,
      8,
      4,
      2,
      5,
      1,
      0
    ],
    "accepted": [
      "CELEBRATE"
    ]
  },
  {
    "id": "trail-051",
    "answer": "CHAMELEON",
    "clue": "A lizard famous for changing its skin color.",
    "grid": [
      "H",
      "M",
      "E",
      "A",
      "C",
      "L",
      "N",
      "O",
      "E"
    ],
    "path": [
      4,
      0,
      3,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "CHAMELEON"
    ]
  },
  {
    "id": "trail-052",
    "answer": "CHAMPIONS",
    "clue": "Winners who hold first place in a competition.",
    "grid": [
      "P",
      "I",
      "O",
      "H",
      "M",
      "N",
      "A",
      "C",
      "S"
    ],
    "path": [
      7,
      3,
      6,
      4,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "CHAMPIONS"
    ]
  },
  {
    "id": "trail-053",
    "answer": "CHECKLIST",
    "clue": "A written set of items to tick off as they are completed.",
    "grid": [
      "E",
      "S",
      "T",
      "H",
      "C",
      "I",
      "C",
      "K",
      "L"
    ],
    "path": [
      6,
      3,
      0,
      4,
      7,
      8,
      5,
      1,
      2
    ],
    "accepted": [
      "CHECKLIST"
    ]
  },
  {
    "id": "trail-054",
    "answer": "CHILDHOOD",
    "clue": "The early period of life before becoming an adult.",
    "grid": [
      "D",
      "L",
      "I",
      "H",
      "C",
      "H",
      "O",
      "O",
      "D"
    ],
    "path": [
      4,
      5,
      2,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "CHILDHOOD"
    ]
  },
  {
    "id": "trail-055",
    "answer": "CLASSROOM",
    "clue": "A room in which a group of students is taught.",
    "grid": [
      "M",
      "O",
      "O",
      "S",
      "R",
      "C",
      "S",
      "A",
      "L"
    ],
    "path": [
      5,
      8,
      7,
      6,
      3,
      4,
      2,
      1,
      0
    ],
    "accepted": [
      "CLASSROOM"
    ]
  },
  {
    "id": "trail-056",
    "answer": "CLIPBOARD",
    "clue": "A portable board with a clip that holds sheets of paper.",
    "grid": [
      "D",
      "R",
      "A",
      "I",
      "L",
      "O",
      "C",
      "P",
      "B"
    ],
    "path": [
      6,
      4,
      3,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "CLIPBOARD"
    ]
  },
  {
    "id": "trail-057",
    "answer": "COASTLINE",
    "clue": "The boundary where land meets the sea.",
    "grid": [
      "C",
      "L",
      "I",
      "O",
      "N",
      "T",
      "E",
      "A",
      "S"
    ],
    "path": [
      0,
      3,
      7,
      8,
      5,
      1,
      2,
      4,
      6
    ],
    "accepted": [
      "COASTLINE"
    ]
  },
  {
    "id": "trail-058",
    "answer": "COLORLESS",
    "clue": "Having no hue or tint.",
    "grid": [
      "S",
      "S",
      "E",
      "C",
      "O",
      "L",
      "O",
      "L",
      "R"
    ],
    "path": [
      3,
      6,
      7,
      4,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "COLORLESS"
    ]
  },
  {
    "id": "trail-059",
    "answer": "COMPASSES",
    "clue": "Instruments with needles that help people find direction.",
    "grid": [
      "A",
      "S",
      "C",
      "S",
      "P",
      "O",
      "E",
      "S",
      "M"
    ],
    "path": [
      2,
      5,
      8,
      4,
      0,
      1,
      3,
      6,
      7
    ],
    "accepted": [
      "COMPASSES"
    ]
  },
  {
    "id": "trail-060",
    "answer": "COMPUTERS",
    "clue": "Electronic machines that process information and run programs.",
    "grid": [
      "S",
      "O",
      "C",
      "R",
      "M",
      "U",
      "E",
      "T",
      "P"
    ],
    "path": [
      2,
      1,
      4,
      8,
      5,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "COMPUTERS"
    ]
  },
  {
    "id": "trail-061",
    "answer": "CORKSCREW",
    "clue": "A spiral tool used to pull a stopper from a bottle.",
    "grid": [
      "C",
      "R",
      "C",
      "O",
      "S",
      "E",
      "K",
      "R",
      "W"
    ],
    "path": [
      0,
      3,
      7,
      6,
      4,
      2,
      1,
      5,
      8
    ],
    "accepted": [
      "CORKSCREW"
    ]
  },
  {
    "id": "trail-062",
    "answer": "COURTYARD",
    "clue": "An open area enclosed by the walls of a building.",
    "grid": [
      "O",
      "U",
      "D",
      "C",
      "R",
      "R",
      "T",
      "Y",
      "A"
    ],
    "path": [
      3,
      0,
      1,
      4,
      6,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "COURTYARD"
    ]
  },
  {
    "id": "trail-063",
    "answer": "CUPBOARDS",
    "clue": "Storage cabinets with doors and shelves.",
    "grid": [
      "R",
      "D",
      "S",
      "A",
      "P",
      "C",
      "O",
      "B",
      "U"
    ],
    "path": [
      5,
      8,
      4,
      7,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "CUPBOARDS"
    ]
  },
  {
    "id": "trail-064",
    "answer": "DAREDEVIL",
    "clue": "Someone who enjoys taking bold and risky chances.",
    "grid": [
      "A",
      "D",
      "L",
      "D",
      "R",
      "I",
      "E",
      "E",
      "V"
    ],
    "path": [
      1,
      0,
      4,
      6,
      3,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "DAREDEVIL"
    ]
  },
  {
    "id": "trail-065",
    "answer": "DAYDREAMS",
    "clue": "Pleasant imagined scenes that occupy the waking mind.",
    "grid": [
      "A",
      "M",
      "S",
      "E",
      "D",
      "Y",
      "R",
      "D",
      "A"
    ],
    "path": [
      7,
      8,
      5,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "DAYDREAMS"
    ]
  },
  {
    "id": "trail-066",
    "answer": "DETECTIVE",
    "clue": "A person who investigates clues to solve a mystery.",
    "grid": [
      "E",
      "T",
      "E",
      "C",
      "V",
      "E",
      "T",
      "I",
      "D"
    ],
    "path": [
      8,
      5,
      1,
      0,
      3,
      6,
      7,
      4,
      2
    ],
    "accepted": [
      "DETECTIVE"
    ]
  },
  {
    "id": "trail-067",
    "answer": "DISCOVERY",
    "clue": "The act of finding or learning something for the first time.",
    "grid": [
      "Y",
      "S",
      "C",
      "R",
      "O",
      "I",
      "V",
      "E",
      "D"
    ],
    "path": [
      8,
      5,
      1,
      2,
      4,
      6,
      7,
      3,
      0
    ],
    "accepted": [
      "DISCOVERY"
    ]
  },
  {
    "id": "trail-068",
    "answer": "DISHCLOTH",
    "clue": "A small piece of fabric used to wash kitchenware.",
    "grid": [
      "L",
      "O",
      "D",
      "C",
      "I",
      "T",
      "S",
      "H",
      "H"
    ],
    "path": [
      2,
      4,
      6,
      7,
      3,
      0,
      1,
      5,
      8
    ],
    "accepted": [
      "DISHCLOTH"
    ]
  },
  {
    "id": "trail-069",
    "answer": "DOORBELLS",
    "clue": "Devices that ring to announce visitors at an entrance.",
    "grid": [
      "S",
      "L",
      "D",
      "L",
      "O",
      "E",
      "O",
      "R",
      "B"
    ],
    "path": [
      2,
      4,
      6,
      7,
      8,
      5,
      1,
      3,
      0
    ],
    "accepted": [
      "DOORBELLS"
    ]
  },
  {
    "id": "trail-070",
    "answer": "EARTHWORM",
    "clue": "A long, legless creature that lives and burrows in soil.",
    "grid": [
      "E",
      "H",
      "T",
      "A",
      "R",
      "W",
      "M",
      "R",
      "O"
    ],
    "path": [
      0,
      3,
      4,
      2,
      1,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "EARTHWORM"
    ]
  },
  {
    "id": "trail-071",
    "answer": "EGGPLANTS",
    "clue": "Glossy purple vegetables also known as aubergines.",
    "grid": [
      "N",
      "T",
      "S",
      "A",
      "P",
      "G",
      "L",
      "E",
      "G"
    ],
    "path": [
      7,
      5,
      8,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "EGGPLANTS"
    ]
  },
  {
    "id": "trail-072",
    "answer": "ENVELOPES",
    "clue": "Folded paper coverings used to hold letters for mailing.",
    "grid": [
      "N",
      "V",
      "L",
      "E",
      "O",
      "E",
      "S",
      "E",
      "P"
    ],
    "path": [
      3,
      0,
      1,
      5,
      2,
      4,
      8,
      7,
      6
    ],
    "accepted": [
      "ENVELOPES"
    ]
  },
  {
    "id": "trail-073",
    "answer": "EVERGREEN",
    "clue": "A plant that keeps its green leaves throughout the year.",
    "grid": [
      "N",
      "E",
      "E",
      "V",
      "R",
      "R",
      "E",
      "E",
      "G"
    ],
    "path": [
      7,
      3,
      6,
      4,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "EVERGREEN"
    ]
  },
  {
    "id": "trail-074",
    "answer": "FARMHOUSE",
    "clue": "The main home on a piece of agricultural land.",
    "grid": [
      "H",
      "M",
      "R",
      "O",
      "A",
      "F",
      "U",
      "S",
      "E"
    ],
    "path": [
      5,
      4,
      2,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "FARMHOUSE"
    ]
  },
  {
    "id": "trail-075",
    "answer": "FEATHERED",
    "clue": "Covered with the light plumage of a bird.",
    "grid": [
      "D",
      "E",
      "F",
      "E",
      "H",
      "A",
      "R",
      "E",
      "T"
    ],
    "path": [
      2,
      1,
      5,
      8,
      4,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "FEATHERED"
    ]
  },
  {
    "id": "trail-076",
    "answer": "FIREWORKS",
    "clue": "Explosive displays that create colorful lights in the sky.",
    "grid": [
      "R",
      "K",
      "S",
      "O",
      "E",
      "I",
      "W",
      "F",
      "R"
    ],
    "path": [
      7,
      5,
      8,
      4,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "FIREWORKS"
    ]
  },
  {
    "id": "trail-077",
    "answer": "FISHERMAN",
    "clue": "A person who catches fish for work or recreation.",
    "grid": [
      "F",
      "M",
      "R",
      "A",
      "I",
      "E",
      "N",
      "H",
      "S"
    ],
    "path": [
      0,
      4,
      8,
      7,
      5,
      2,
      1,
      3,
      6
    ],
    "accepted": [
      "FISHERMAN"
    ]
  },
  {
    "id": "trail-078",
    "answer": "FLASHBULB",
    "clue": "A small lamp once used to provide a bright burst of light for photographs.",
    "grid": [
      "U",
      "B",
      "H",
      "L",
      "F",
      "S",
      "B",
      "L",
      "A"
    ],
    "path": [
      4,
      7,
      8,
      5,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "FLASHBULB"
    ]
  },
  {
    "id": "trail-079",
    "answer": "FLOWERPOT",
    "clue": "A container in which a decorative plant can grow.",
    "grid": [
      "T",
      "L",
      "F",
      "O",
      "O",
      "E",
      "P",
      "R",
      "W"
    ],
    "path": [
      2,
      1,
      4,
      8,
      5,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "FLOWERPOT"
    ]
  },
  {
    "id": "trail-080",
    "answer": "FOOTBALLS",
    "clue": "Inflated balls used in games played on a field with goals or goalposts.",
    "grid": [
      "S",
      "T",
      "B",
      "O",
      "L",
      "A",
      "F",
      "O",
      "L"
    ],
    "path": [
      6,
      7,
      3,
      1,
      2,
      5,
      8,
      4,
      0
    ],
    "accepted": [
      "FOOTBALLS"
    ]
  },
  {
    "id": "trail-081",
    "answer": "FOOTPRINT",
    "clue": "A mark left on the ground by a foot or shoe.",
    "grid": [
      "P",
      "T",
      "O",
      "R",
      "N",
      "O",
      "I",
      "F",
      "T"
    ],
    "path": [
      7,
      5,
      2,
      1,
      0,
      3,
      6,
      4,
      8
    ],
    "accepted": [
      "FOOTPRINT"
    ]
  },
  {
    "id": "trail-082",
    "answer": "FORESIGHT",
    "clue": "The ability to anticipate what may be needed in the future.",
    "grid": [
      "H",
      "T",
      "O",
      "G",
      "F",
      "R",
      "I",
      "S",
      "E"
    ],
    "path": [
      4,
      2,
      5,
      8,
      7,
      6,
      3,
      0,
      1
    ],
    "accepted": [
      "FORESIGHT"
    ]
  },
  {
    "id": "trail-083",
    "answer": "FRUITCAKE",
    "clue": "A rich baked cake containing dried or candied fruit.",
    "grid": [
      "E",
      "F",
      "U",
      "K",
      "R",
      "I",
      "A",
      "C",
      "T"
    ],
    "path": [
      1,
      4,
      2,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "FRUITCAKE"
    ]
  },
  {
    "id": "trail-084",
    "answer": "GARDENING",
    "clue": "The activity of growing and tending flowers or other plants.",
    "grid": [
      "I",
      "N",
      "E",
      "N",
      "D",
      "G",
      "G",
      "A",
      "R"
    ],
    "path": [
      5,
      7,
      8,
      4,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "GARDENING"
    ]
  },
  {
    "id": "trail-085",
    "answer": "GLASSWARE",
    "clue": "Drinking vessels and other objects made from glass.",
    "grid": [
      "G",
      "A",
      "S",
      "E",
      "L",
      "S",
      "R",
      "A",
      "W"
    ],
    "path": [
      0,
      4,
      1,
      2,
      5,
      8,
      7,
      6,
      3
    ],
    "accepted": [
      "GLASSWARE"
    ]
  },
  {
    "id": "trail-086",
    "answer": "GOLDSMITH",
    "clue": "A craftsperson who makes objects from a precious yellow metal.",
    "grid": [
      "I",
      "M",
      "S",
      "T",
      "G",
      "D",
      "H",
      "O",
      "L"
    ],
    "path": [
      4,
      7,
      8,
      5,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "GOLDSMITH"
    ]
  },
  {
    "id": "trail-087",
    "answer": "GRAPEVINE",
    "clue": "A climbing plant that produces bunches of small juicy fruit.",
    "grid": [
      "E",
      "P",
      "A",
      "V",
      "R",
      "G",
      "I",
      "N",
      "E"
    ],
    "path": [
      5,
      4,
      2,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "GRAPEVINE"
    ]
  },
  {
    "id": "trail-088",
    "answer": "GREETINGS",
    "clue": "Words or gestures used to welcome someone.",
    "grid": [
      "I",
      "N",
      "S",
      "E",
      "T",
      "G",
      "E",
      "R",
      "G"
    ],
    "path": [
      8,
      7,
      3,
      6,
      4,
      0,
      1,
      5,
      2
    ],
    "accepted": [
      "GREETINGS"
    ]
  },
  {
    "id": "trail-089",
    "answer": "GUIDEBOOK",
    "clue": "A book with useful information about a place or subject.",
    "grid": [
      "K",
      "G",
      "I",
      "O",
      "D",
      "U",
      "O",
      "B",
      "E"
    ],
    "path": [
      1,
      5,
      2,
      4,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "GUIDEBOOK"
    ]
  },
  {
    "id": "trail-090",
    "answer": "HANDSHAKE",
    "clue": "A greeting made by briefly clasping another person's hand.",
    "grid": [
      "H",
      "A",
      "K",
      "S",
      "H",
      "E",
      "D",
      "N",
      "A"
    ],
    "path": [
      4,
      8,
      7,
      6,
      3,
      0,
      1,
      2,
      5
    ],
    "accepted": [
      "HANDSHAKE"
    ]
  },
  {
    "id": "trail-091",
    "answer": "HARMONICA",
    "clue": "A small wind instrument played by blowing and drawing air through reeds.",
    "grid": [
      "O",
      "M",
      "A",
      "N",
      "R",
      "H",
      "I",
      "C",
      "A"
    ],
    "path": [
      5,
      2,
      4,
      1,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "HARMONICA"
    ]
  },
  {
    "id": "trail-092",
    "answer": "HATCHLING",
    "clue": "A young animal that has recently emerged from an egg.",
    "grid": [
      "C",
      "H",
      "L",
      "T",
      "H",
      "I",
      "A",
      "G",
      "N"
    ],
    "path": [
      4,
      6,
      3,
      0,
      1,
      2,
      5,
      8,
      7
    ],
    "accepted": [
      "HATCHLING"
    ]
  },
  {
    "id": "trail-093",
    "answer": "HEADLIGHT",
    "clue": "A lamp at the front of a vehicle that lights the road ahead.",
    "grid": [
      "T",
      "A",
      "E",
      "H",
      "D",
      "H",
      "G",
      "I",
      "L"
    ],
    "path": [
      5,
      2,
      1,
      4,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "HEADLIGHT"
    ]
  },
  {
    "id": "trail-094",
    "answer": "HIGHLIGHT",
    "clue": "The most memorable or outstanding part of an experience.",
    "grid": [
      "G",
      "I",
      "H",
      "H",
      "G",
      "L",
      "T",
      "H",
      "I"
    ],
    "path": [
      7,
      8,
      4,
      2,
      5,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "HIGHLIGHT"
    ]
  },
  {
    "id": "trail-095",
    "answer": "HOMEBOUND",
    "clue": "Confined to one's home.",
    "grid": [
      "O",
      "U",
      "N",
      "B",
      "O",
      "D",
      "E",
      "M",
      "H"
    ],
    "path": [
      8,
      4,
      7,
      6,
      3,
      0,
      1,
      2,
      5
    ],
    "accepted": [
      "HOMEBOUND"
    ]
  },
  {
    "id": "trail-096",
    "answer": "HOMEGROWN",
    "clue": "Cultivated in one's own garden or local area.",
    "grid": [
      "E",
      "R",
      "O",
      "G",
      "M",
      "W",
      "H",
      "O",
      "N"
    ],
    "path": [
      6,
      7,
      4,
      0,
      3,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "HOMEGROWN"
    ]
  },
  {
    "id": "trail-097",
    "answer": "HORSESHOE",
    "clue": "A curved metal plate fitted to an animal's hoof.",
    "grid": [
      "H",
      "O",
      "H",
      "O",
      "S",
      "R",
      "E",
      "S",
      "E"
    ],
    "path": [
      2,
      1,
      5,
      7,
      8,
      4,
      0,
      3,
      6
    ],
    "accepted": [
      "HORSESHOE"
    ]
  },
  {
    "id": "trail-098",
    "answer": "HOUSEBOAT",
    "clue": "A vessel equipped to serve as someone's home.",
    "grid": [
      "T",
      "A",
      "O",
      "H",
      "O",
      "B",
      "U",
      "S",
      "E"
    ],
    "path": [
      3,
      4,
      6,
      7,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "HOUSEBOAT"
    ]
  },
  {
    "id": "trail-099",
    "answer": "IMPORTANT",
    "clue": "Having great significance or value.",
    "grid": [
      "I",
      "T",
      "N",
      "M",
      "P",
      "A",
      "O",
      "R",
      "T"
    ],
    "path": [
      0,
      3,
      4,
      6,
      7,
      8,
      5,
      2,
      1
    ],
    "accepted": [
      "IMPORTANT"
    ]
  },
  {
    "id": "trail-100",
    "answer": "INVENTION",
    "clue": "A new device or process created through ingenuity.",
    "grid": [
      "I",
      "N",
      "N",
      "I",
      "O",
      "V",
      "T",
      "N",
      "E"
    ],
    "path": [
      0,
      1,
      5,
      8,
      7,
      6,
      3,
      4,
      2
    ],
    "accepted": [
      "INVENTION"
    ]
  },
  {
    "id": "trail-101",
    "answer": "JELLYBEAN",
    "clue": "A small bean-shaped sweet with a soft center.",
    "grid": [
      "A",
      "N",
      "J",
      "E",
      "E",
      "L",
      "B",
      "Y",
      "L"
    ],
    "path": [
      2,
      4,
      5,
      8,
      7,
      6,
      3,
      0,
      1
    ],
    "accepted": [
      "JELLYBEAN"
    ]
  },
  {
    "id": "trail-102",
    "answer": "KEYBOARDS",
    "clue": "Sets of keys used to type into computers or play certain instruments.",
    "grid": [
      "A",
      "R",
      "S",
      "O",
      "E",
      "D",
      "K",
      "B",
      "Y"
    ],
    "path": [
      6,
      4,
      8,
      7,
      3,
      0,
      1,
      5,
      2
    ],
    "accepted": [
      "KEYBOARDS"
    ]
  },
  {
    "id": "trail-103",
    "answer": "KNAPSACKS",
    "clue": "Bags carried on the back, often for walking or hiking.",
    "grid": [
      "S",
      "A",
      "C",
      "P",
      "A",
      "K",
      "K",
      "N",
      "S"
    ],
    "path": [
      6,
      7,
      4,
      3,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "KNAPSACKS"
    ]
  },
  {
    "id": "trail-104",
    "answer": "LADYBIRDS",
    "clue": "Small spotted beetles also known as ladybugs.",
    "grid": [
      "B",
      "L",
      "A",
      "I",
      "Y",
      "D",
      "R",
      "D",
      "S"
    ],
    "path": [
      1,
      2,
      5,
      4,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "LADYBIRDS"
    ]
  },
  {
    "id": "trail-105",
    "answer": "LANDMARKS",
    "clue": "Recognizable features that help identify a place.",
    "grid": [
      "S",
      "L",
      "A",
      "K",
      "M",
      "N",
      "R",
      "A",
      "D"
    ],
    "path": [
      1,
      2,
      5,
      8,
      4,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "LANDMARKS"
    ]
  },
  {
    "id": "trail-106",
    "answer": "LETTERBOX",
    "clue": "A slot or container through which mail is delivered.",
    "grid": [
      "T",
      "E",
      "L",
      "R",
      "T",
      "E",
      "B",
      "O",
      "X"
    ],
    "path": [
      2,
      5,
      4,
      0,
      1,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "LETTERBOX"
    ]
  },
  {
    "id": "trail-107",
    "answer": "LIGHTBULB",
    "clue": "The replaceable part of a lamp that produces illumination.",
    "grid": [
      "L",
      "I",
      "H",
      "L",
      "T",
      "G",
      "B",
      "U",
      "B"
    ],
    "path": [
      0,
      1,
      5,
      2,
      4,
      8,
      7,
      3,
      6
    ],
    "accepted": [
      "LIGHTBULB"
    ]
  },
  {
    "id": "trail-108",
    "answer": "LUNCHTIME",
    "clue": "The part of the day set aside for the midday meal.",
    "grid": [
      "H",
      "N",
      "U",
      "T",
      "C",
      "L",
      "I",
      "M",
      "E"
    ],
    "path": [
      5,
      2,
      1,
      4,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "LUNCHTIME"
    ]
  },
  {
    "id": "trail-109",
    "answer": "MAGNIFIER",
    "clue": "A lens that makes small things appear larger.",
    "grid": [
      "F",
      "I",
      "E",
      "I",
      "M",
      "R",
      "N",
      "G",
      "A"
    ],
    "path": [
      4,
      8,
      7,
      6,
      3,
      0,
      1,
      2,
      5
    ],
    "accepted": [
      "MAGNIFIER"
    ]
  },
  {
    "id": "trail-110",
    "answer": "MAILBOXES",
    "clue": "Containers where letters are delivered or collected.",
    "grid": [
      "M",
      "A",
      "L",
      "O",
      "B",
      "I",
      "X",
      "E",
      "S"
    ],
    "path": [
      0,
      1,
      5,
      2,
      4,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "MAILBOXES"
    ]
  },
  {
    "id": "trail-111",
    "answer": "MARMALADE",
    "clue": "A preserve made from citrus fruit, often including pieces of peel.",
    "grid": [
      "M",
      "D",
      "E",
      "A",
      "R",
      "A",
      "M",
      "A",
      "L"
    ],
    "path": [
      0,
      3,
      4,
      6,
      7,
      8,
      5,
      1,
      2
    ],
    "accepted": [
      "MARMALADE"
    ]
  },
  {
    "id": "trail-112",
    "answer": "MATCHBOOK",
    "clue": "A small cardboard cover holding a row of paper matches.",
    "grid": [
      "A",
      "H",
      "C",
      "M",
      "T",
      "B",
      "K",
      "O",
      "O"
    ],
    "path": [
      3,
      0,
      4,
      2,
      1,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "MATCHBOOK"
    ]
  },
  {
    "id": "trail-113",
    "answer": "MEASURING",
    "clue": "Finding the size, length, or amount of something.",
    "grid": [
      "G",
      "E",
      "A",
      "M",
      "N",
      "S",
      "I",
      "R",
      "U"
    ],
    "path": [
      3,
      1,
      2,
      5,
      8,
      7,
      6,
      4,
      0
    ],
    "accepted": [
      "MEASURING"
    ]
  },
  {
    "id": "trail-114",
    "answer": "MILESTONE",
    "clue": "A significant stage or achievement along the way.",
    "grid": [
      "S",
      "E",
      "E",
      "T",
      "N",
      "L",
      "O",
      "M",
      "I"
    ],
    "path": [
      7,
      8,
      5,
      1,
      0,
      3,
      6,
      4,
      2
    ],
    "accepted": [
      "MILESTONE"
    ]
  },
  {
    "id": "trail-115",
    "answer": "MILKSHAKE",
    "clue": "A cold drink made by blending milk with flavoring or ice cream.",
    "grid": [
      "A",
      "H",
      "S",
      "M",
      "K",
      "K",
      "E",
      "I",
      "L"
    ],
    "path": [
      3,
      7,
      8,
      5,
      2,
      1,
      0,
      4,
      6
    ],
    "accepted": [
      "MILKSHAKE"
    ]
  },
  {
    "id": "trail-116",
    "answer": "MISTLETOE",
    "clue": "A plant with white berries traditionally hung during winter festivities.",
    "grid": [
      "M",
      "O",
      "E",
      "T",
      "I",
      "S",
      "E",
      "L",
      "T"
    ],
    "path": [
      0,
      4,
      5,
      8,
      7,
      6,
      3,
      1,
      2
    ],
    "accepted": [
      "MISTLETOE"
    ]
  },
  {
    "id": "trail-117",
    "answer": "MOONLIGHT",
    "clue": "The soft illumination reflected from Earth's natural satellite.",
    "grid": [
      "N",
      "O",
      "M",
      "L",
      "O",
      "T",
      "I",
      "G",
      "H"
    ],
    "path": [
      2,
      1,
      4,
      0,
      3,
      6,
      7,
      8,
      5
    ],
    "accepted": [
      "MOONLIGHT"
    ]
  },
  {
    "id": "trail-118",
    "answer": "MOTORBIKE",
    "clue": "A motorized vehicle with two wheels.",
    "grid": [
      "I",
      "B",
      "R",
      "K",
      "O",
      "O",
      "E",
      "T",
      "M"
    ],
    "path": [
      8,
      5,
      7,
      4,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "MOTORBIKE"
    ]
  },
  {
    "id": "trail-119",
    "answer": "MUSHROOMS",
    "clue": "Fungi with caps and stalks, some of which are used in cooking.",
    "grid": [
      "M",
      "H",
      "R",
      "S",
      "U",
      "O",
      "S",
      "M",
      "O"
    ],
    "path": [
      0,
      4,
      3,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "MUSHROOMS"
    ]
  },
  {
    "id": "trail-120",
    "answer": "NEIGHBORS",
    "clue": "People who live nearby.",
    "grid": [
      "O",
      "B",
      "H",
      "R",
      "G",
      "E",
      "S",
      "N",
      "I"
    ],
    "path": [
      7,
      5,
      8,
      4,
      2,
      1,
      0,
      3,
      6
    ],
    "accepted": [
      "NEIGHBORS"
    ]
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 120,
  "uniqueCluedAnswers": 120,
  "newAuthoredAnswers": 90
});
