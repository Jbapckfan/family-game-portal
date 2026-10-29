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
// All published records retain their original values, IDs, and ordering.
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
  },
  {
    "id": "trail-121",
    "answer": "NEWSPAPER",
    "clue": "A printed publication containing current reports and articles.",
    "grid": [
      "E",
      "R",
      "N",
      "P",
      "S",
      "E",
      "A",
      "P",
      "W"
    ],
    "path": [
      2,
      5,
      8,
      4,
      7,
      6,
      3,
      0,
      1
    ],
    "accepted": [
      "NEWSPAPER"
    ]
  },
  {
    "id": "trail-122",
    "answer": "NIGHTFALL",
    "clue": "The time when daylight fades and darkness begins.",
    "grid": [
      "H",
      "T",
      "F",
      "G",
      "N",
      "A",
      "I",
      "L",
      "L"
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
      "NIGHTFALL"
    ]
  },
  {
    "id": "trail-123",
    "answer": "ORCHESTRA",
    "clue": "A large ensemble of string, wind, and percussion musicians.",
    "grid": [
      "A",
      "R",
      "T",
      "C",
      "H",
      "S",
      "R",
      "O",
      "E"
    ],
    "path": [
      7,
      6,
      3,
      4,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "ORCHESTRA"
    ]
  },
  {
    "id": "trail-124",
    "answer": "ACCORDION",
    "clue": "A portable instrument with a bellows and a keyboard.",
    "grid": [
      "A",
      "C",
      "O",
      "O",
      "C",
      "R",
      "N",
      "I",
      "D"
    ],
    "path": [
      0,
      1,
      4,
      2,
      5,
      8,
      7,
      3,
      6
    ],
    "accepted": [
      "ACCORDION"
    ]
  },
  {
    "id": "trail-125",
    "answer": "PASSENGER",
    "clue": "A traveler in a vehicle who is not driving it.",
    "grid": [
      "N",
      "G",
      "E",
      "E",
      "S",
      "R",
      "S",
      "P",
      "A"
    ],
    "path": [
      7,
      8,
      4,
      6,
      3,
      0,
      1,
      2,
      5
    ],
    "accepted": [
      "PASSENGER"
    ]
  },
  {
    "id": "trail-126",
    "answer": "PATCHWORK",
    "clue": "Fabric made by sewing smaller pieces together.",
    "grid": [
      "O",
      "R",
      "P",
      "K",
      "W",
      "A",
      "H",
      "C",
      "T"
    ],
    "path": [
      2,
      5,
      8,
      7,
      6,
      4,
      0,
      1,
      3
    ],
    "accepted": [
      "PATCHWORK"
    ]
  },
  {
    "id": "trail-127",
    "answer": "AEROPLANE",
    "clue": "A winged flying vehicle, using the British spelling.",
    "grid": [
      "E",
      "R",
      "O",
      "A",
      "P",
      "L",
      "E",
      "N",
      "A"
    ],
    "path": [
      3,
      0,
      1,
      2,
      4,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "AEROPLANE"
    ]
  },
  {
    "id": "trail-128",
    "answer": "PERISCOPE",
    "clue": "A viewing instrument used to look above a submarine.",
    "grid": [
      "S",
      "I",
      "R",
      "C",
      "E",
      "P",
      "O",
      "P",
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
      "PERISCOPE"
    ]
  },
  {
    "id": "trail-129",
    "answer": "AVALANCHE",
    "clue": "A large mass of snow rapidly descending a mountainside.",
    "grid": [
      "A",
      "C",
      "H",
      "N",
      "L",
      "E",
      "A",
      "V",
      "A"
    ],
    "path": [
      8,
      7,
      6,
      4,
      0,
      3,
      1,
      2,
      5
    ],
    "accepted": [
      "AVALANCHE"
    ]
  },
  {
    "id": "trail-130",
    "answer": "BADMINTON",
    "clue": "A racket sport played by hitting a shuttlecock over a net.",
    "grid": [
      "N",
      "O",
      "T",
      "A",
      "B",
      "N",
      "D",
      "M",
      "I"
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
      "BADMINTON"
    ]
  },
  {
    "id": "trail-131",
    "answer": "POLICEMAN",
    "clue": "A male officer who enforces the law.",
    "grid": [
      "I",
      "P",
      "O",
      "C",
      "L",
      "A",
      "E",
      "M",
      "N"
    ],
    "path": [
      1,
      2,
      4,
      0,
      3,
      6,
      7,
      5,
      8
    ],
    "accepted": [
      "POLICEMAN"
    ]
  },
  {
    "id": "trail-132",
    "answer": "PORCUPINE",
    "clue": "A rodent protected by a coat of sharp quills.",
    "grid": [
      "N",
      "I",
      "P",
      "E",
      "U",
      "R",
      "P",
      "O",
      "C"
    ],
    "path": [
      6,
      7,
      5,
      8,
      4,
      2,
      1,
      0,
      3
    ],
    "accepted": [
      "PORCUPINE"
    ]
  },
  {
    "id": "trail-133",
    "answer": "POSTCARDS",
    "clue": "Small cards mailed with a picture and a written message.",
    "grid": [
      "R",
      "D",
      "S",
      "A",
      "P",
      "S",
      "C",
      "T",
      "O"
    ],
    "path": [
      4,
      8,
      5,
      7,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "POSTCARDS"
    ]
  },
  {
    "id": "trail-134",
    "answer": "POTTERIES",
    "clue": "Workshops where clay vessels are made and fired.",
    "grid": [
      "T",
      "O",
      "S",
      "P",
      "T",
      "E",
      "E",
      "R",
      "I"
    ],
    "path": [
      3,
      1,
      0,
      4,
      6,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "POTTERIES"
    ]
  },
  {
    "id": "trail-135",
    "answer": "PRACTICAL",
    "clue": "Useful and suited to real tasks rather than theory alone.",
    "grid": [
      "P",
      "C",
      "A",
      "L",
      "R",
      "T",
      "A",
      "C",
      "I"
    ],
    "path": [
      0,
      4,
      2,
      1,
      5,
      8,
      7,
      6,
      3
    ],
    "accepted": [
      "PRACTICAL"
    ]
  },
  {
    "id": "trail-136",
    "answer": "PRESCHOOL",
    "clue": "An educational setting for children below primary school age.",
    "grid": [
      "L",
      "R",
      "P",
      "O",
      "S",
      "E",
      "O",
      "H",
      "C"
    ],
    "path": [
      2,
      1,
      5,
      4,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "PRESCHOOL"
    ]
  },
  {
    "id": "trail-137",
    "answer": "PRINTABLE",
    "clue": "Suitable for putting on paper with a printer.",
    "grid": [
      "N",
      "A",
      "B",
      "I",
      "T",
      "L",
      "P",
      "R",
      "E"
    ],
    "path": [
      6,
      7,
      3,
      0,
      4,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "PRINTABLE"
    ]
  },
  {
    "id": "trail-138",
    "answer": "PROJECTOR",
    "clue": "A device that casts enlarged images onto a screen.",
    "grid": [
      "R",
      "R",
      "P",
      "O",
      "O",
      "J",
      "T",
      "C",
      "E"
    ],
    "path": [
      2,
      1,
      4,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "PROJECTOR"
    ]
  },
  {
    "id": "trail-139",
    "answer": "BALLERINA",
    "clue": "A woman who performs classical ballet.",
    "grid": [
      "I",
      "R",
      "E",
      "N",
      "A",
      "L",
      "B",
      "A",
      "L"
    ],
    "path": [
      6,
      4,
      8,
      5,
      2,
      1,
      0,
      3,
      7
    ],
    "accepted": [
      "BALLERINA"
    ]
  },
  {
    "id": "trail-140",
    "answer": "QUICKSAND",
    "clue": "Loose wet ground that can yield beneath a person's weight.",
    "grid": [
      "K",
      "C",
      "I",
      "S",
      "Q",
      "U",
      "A",
      "N",
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
      "QUICKSAND"
    ]
  },
  {
    "id": "trail-141",
    "answer": "RAINCOATS",
    "clue": "Waterproof outer garments worn during wet weather.",
    "grid": [
      "S",
      "R",
      "I",
      "T",
      "A",
      "N",
      "A",
      "O",
      "C"
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
      "RAINCOATS"
    ]
  },
  {
    "id": "trail-142",
    "answer": "RECYCLING",
    "clue": "Processing used materials so they can be used again.",
    "grid": [
      "G",
      "N",
      "I",
      "E",
      "R",
      "L",
      "C",
      "Y",
      "C"
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
      "RECYCLING"
    ]
  },
  {
    "id": "trail-143",
    "answer": "DOLLHOUSE",
    "clue": "A miniature home furnished for small toy figures.",
    "grid": [
      "H",
      "O",
      "U",
      "L",
      "S",
      "D",
      "L",
      "O",
      "E"
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
      "DOLLHOUSE"
    ]
  },
  {
    "id": "trail-144",
    "answer": "ROADBLOCK",
    "clue": "A barrier placed across a route to stop traffic.",
    "grid": [
      "O",
      "L",
      "B",
      "C",
      "D",
      "O",
      "K",
      "R",
      "A"
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
      "ROADBLOCK"
    ]
  },
  {
    "id": "trail-145",
    "answer": "BARRICADE",
    "clue": "An improvised barrier blocking a road or entrance.",
    "grid": [
      "A",
      "B",
      "R",
      "D",
      "R",
      "I",
      "E",
      "A",
      "C"
    ],
    "path": [
      1,
      0,
      4,
      2,
      5,
      8,
      7,
      3,
      6
    ],
    "accepted": [
      "BARRICADE"
    ]
  },
  {
    "id": "trail-146",
    "answer": "SAILBOATS",
    "clue": "Boats propelled primarily by wind caught in canvas.",
    "grid": [
      "S",
      "T",
      "A",
      "S",
      "I",
      "O",
      "A",
      "L",
      "B"
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
      "SAILBOATS"
    ]
  },
  {
    "id": "trail-147",
    "answer": "SANDPAPER",
    "clue": "Abrasive sheets used to smooth a surface.",
    "grid": [
      "P",
      "E",
      "P",
      "R",
      "A",
      "D",
      "S",
      "A",
      "N"
    ],
    "path": [
      6,
      7,
      8,
      5,
      2,
      4,
      0,
      1,
      3
    ],
    "accepted": [
      "SANDPAPER"
    ]
  },
  {
    "id": "trail-148",
    "answer": "SATELLITE",
    "clue": "An object that travels in orbit around a planet.",
    "grid": [
      "I",
      "S",
      "E",
      "L",
      "T",
      "A",
      "L",
      "E",
      "T"
    ],
    "path": [
      1,
      5,
      8,
      7,
      6,
      3,
      0,
      4,
      2
    ],
    "accepted": [
      "SATELLITE"
    ]
  },
  {
    "id": "trail-149",
    "answer": "SCRAPBOOK",
    "clue": "An album containing pasted photographs and other keepsakes.",
    "grid": [
      "S",
      "O",
      "K",
      "C",
      "A",
      "O",
      "R",
      "P",
      "B"
    ],
    "path": [
      0,
      3,
      6,
      4,
      7,
      8,
      5,
      1,
      2
    ],
    "accepted": [
      "SCRAPBOOK"
    ]
  },
  {
    "id": "trail-150",
    "answer": "BEEKEEPER",
    "clue": "Someone who maintains colonies of honey-producing insects.",
    "grid": [
      "K",
      "E",
      "B",
      "E",
      "E",
      "E",
      "R",
      "E",
      "P"
    ],
    "path": [
      2,
      1,
      3,
      0,
      4,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "BEEKEEPER"
    ]
  },
  {
    "id": "trail-151",
    "answer": "SEASHELLS",
    "clue": "Hard outer coverings of marine mollusks found on beaches.",
    "grid": [
      "H",
      "A",
      "S",
      "S",
      "E",
      "E",
      "S",
      "L",
      "L"
    ],
    "path": [
      2,
      5,
      1,
      3,
      0,
      4,
      8,
      7,
      6
    ],
    "accepted": [
      "SEASHELLS"
    ]
  },
  {
    "id": "trail-152",
    "answer": "SHIPWRECK",
    "clue": "The remains of a vessel destroyed or sunk at sea.",
    "grid": [
      "P",
      "I",
      "R",
      "H",
      "W",
      "E",
      "S",
      "K",
      "C"
    ],
    "path": [
      6,
      3,
      1,
      0,
      4,
      2,
      5,
      8,
      7
    ],
    "accepted": [
      "SHIPWRECK"
    ]
  },
  {
    "id": "trail-153",
    "answer": "SHOEMAKER",
    "clue": "A craftsperson who constructs or repairs footwear.",
    "grid": [
      "A",
      "K",
      "R",
      "M",
      "O",
      "E",
      "E",
      "S",
      "H"
    ],
    "path": [
      7,
      8,
      4,
      6,
      3,
      0,
      1,
      5,
      2
    ],
    "accepted": [
      "SHOEMAKER"
    ]
  },
  {
    "id": "trail-154",
    "answer": "SHOPFRONT",
    "clue": "The outward-facing entrance and windows of a store.",
    "grid": [
      "F",
      "R",
      "O",
      "H",
      "P",
      "N",
      "O",
      "S",
      "T"
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
      "SHOPFRONT"
    ]
  },
  {
    "id": "trail-155",
    "answer": "SHOULDERS",
    "clue": "Body parts where the arms connect to the torso.",
    "grid": [
      "E",
      "R",
      "S",
      "D",
      "O",
      "H",
      "U",
      "L",
      "S"
    ],
    "path": [
      8,
      5,
      4,
      6,
      7,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "SHOULDERS"
    ]
  },
  {
    "id": "trail-156",
    "answer": "SIDEWALKS",
    "clue": "Paved paths for pedestrians alongside roads.",
    "grid": [
      "E",
      "W",
      "S",
      "A",
      "D",
      "I",
      "L",
      "K",
      "S"
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
      "SIDEWALKS"
    ]
  },
  {
    "id": "trail-157",
    "answer": "SNOWBOARD",
    "clue": "A single wide board ridden downhill over packed snow.",
    "grid": [
      "D",
      "A",
      "O",
      "R",
      "S",
      "B",
      "N",
      "O",
      "W"
    ],
    "path": [
      4,
      6,
      7,
      8,
      5,
      2,
      1,
      3,
      0
    ],
    "accepted": [
      "SNOWBOARD"
    ]
  },
  {
    "id": "trail-158",
    "answer": "SNOWSTORM",
    "clue": "Severe weather with falling flakes and often strong wind.",
    "grid": [
      "W",
      "O",
      "M",
      "N",
      "S",
      "R",
      "S",
      "O",
      "T"
    ],
    "path": [
      6,
      3,
      1,
      0,
      4,
      8,
      7,
      5,
      2
    ],
    "accepted": [
      "SNOWSTORM"
    ]
  },
  {
    "id": "trail-159",
    "answer": "SOMETHING",
    "clue": "An unspecified object, action, or matter.",
    "grid": [
      "S",
      "I",
      "H",
      "O",
      "T",
      "N",
      "E",
      "M",
      "G"
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
      "SOMETHING"
    ]
  },
  {
    "id": "trail-160",
    "answer": "SPAGHETTI",
    "clue": "Pasta made in long thin cylindrical strands.",
    "grid": [
      "H",
      "G",
      "A",
      "E",
      "P",
      "S",
      "T",
      "T",
      "I"
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
      "SPAGHETTI"
    ]
  },
  {
    "id": "trail-161",
    "answer": "SPARKLING",
    "clue": "Shining with small bright flashes of light.",
    "grid": [
      "G",
      "S",
      "A",
      "N",
      "P",
      "R",
      "I",
      "L",
      "K"
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
      "SPARKLING"
    ]
  },
  {
    "id": "trail-162",
    "answer": "SPECTACLE",
    "clue": "An impressive or unusual sight attracting attention.",
    "grid": [
      "E",
      "E",
      "L",
      "C",
      "P",
      "C",
      "S",
      "T",
      "A"
    ],
    "path": [
      6,
      4,
      0,
      3,
      7,
      8,
      5,
      2,
      1
    ],
    "accepted": [
      "SPECTACLE"
    ]
  },
  {
    "id": "trail-163",
    "answer": "SPOTLIGHT",
    "clue": "A lamp producing a focused beam on a performer or object.",
    "grid": [
      "P",
      "T",
      "L",
      "S",
      "O",
      "I",
      "T",
      "H",
      "G"
    ],
    "path": [
      3,
      0,
      4,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "SPOTLIGHT"
    ]
  },
  {
    "id": "trail-164",
    "answer": "STAIRCASE",
    "clue": "A connected set of steps between different floor levels.",
    "grid": [
      "A",
      "S",
      "E",
      "S",
      "C",
      "I",
      "T",
      "A",
      "R"
    ],
    "path": [
      3,
      6,
      7,
      5,
      8,
      4,
      0,
      1,
      2
    ],
    "accepted": [
      "STAIRCASE"
    ]
  },
  {
    "id": "trail-165",
    "answer": "BILINGUAL",
    "clue": "Able to speak two languages.",
    "grid": [
      "U",
      "G",
      "N",
      "A",
      "I",
      "I",
      "L",
      "B",
      "L"
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
      "BILINGUAL"
    ]
  },
  {
    "id": "trail-166",
    "answer": "STEAMBOAT",
    "clue": "A vessel driven by an engine powered with heated water vapor.",
    "grid": [
      "M",
      "A",
      "E",
      "B",
      "S",
      "T",
      "O",
      "A",
      "T"
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
      "STEAMBOAT"
    ]
  },
  {
    "id": "trail-167",
    "answer": "STORYBOOK",
    "clue": "A volume containing tales, often for young readers.",
    "grid": [
      "Y",
      "S",
      "O",
      "B",
      "R",
      "T",
      "O",
      "O",
      "K"
    ],
    "path": [
      1,
      5,
      2,
      4,
      0,
      3,
      6,
      7,
      8
    ],
    "accepted": [
      "STORYBOOK"
    ]
  },
  {
    "id": "trail-168",
    "answer": "STRONGBOX",
    "clue": "A sturdy locked container for valuables.",
    "grid": [
      "X",
      "R",
      "T",
      "O",
      "S",
      "O",
      "B",
      "G",
      "N"
    ],
    "path": [
      4,
      2,
      1,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "STRONGBOX"
    ]
  },
  {
    "id": "trail-169",
    "answer": "SUBMARINE",
    "clue": "A vessel designed to operate beneath the sea.",
    "grid": [
      "E",
      "N",
      "I",
      "U",
      "S",
      "R",
      "B",
      "M",
      "A"
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
      "SUBMARINE"
    ]
  },
  {
    "id": "trail-170",
    "answer": "LAMPSHADE",
    "clue": "A covering that diffuses and directs light from a lamp.",
    "grid": [
      "L",
      "A",
      "H",
      "A",
      "D",
      "S",
      "E",
      "M",
      "P"
    ],
    "path": [
      0,
      3,
      7,
      8,
      5,
      2,
      1,
      4,
      6
    ],
    "accepted": [
      "LAMPSHADE"
    ]
  },
  {
    "id": "trail-171",
    "answer": "SURFBOARD",
    "clue": "A long narrow board ridden on breaking waves.",
    "grid": [
      "D",
      "R",
      "A",
      "U",
      "S",
      "O",
      "R",
      "F",
      "B"
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
      "SURFBOARD"
    ]
  },
  {
    "id": "trail-172",
    "answer": "SWEETCORN",
    "clue": "A variety of maize eaten for its tender sugary kernels.",
    "grid": [
      "T",
      "C",
      "O",
      "E",
      "R",
      "S",
      "E",
      "W",
      "N"
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
      "SWEETCORN"
    ]
  },
  {
    "id": "trail-173",
    "answer": "BOARDWALK",
    "clue": "A path made of wooden planks, often beside a beach.",
    "grid": [
      "B",
      "R",
      "D",
      "O",
      "A",
      "W",
      "K",
      "L",
      "A"
    ],
    "path": [
      0,
      3,
      4,
      1,
      2,
      5,
      8,
      7,
      6
    ],
    "accepted": [
      "BOARDWALK"
    ]
  },
  {
    "id": "trail-174",
    "answer": "TANGERINE",
    "clue": "A small orange citrus fruit with easily removed peel.",
    "grid": [
      "I",
      "N",
      "E",
      "R",
      "A",
      "T",
      "E",
      "G",
      "N"
    ],
    "path": [
      5,
      4,
      8,
      7,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "TANGERINE"
    ]
  },
  {
    "id": "trail-175",
    "answer": "TEACHABLE",
    "clue": "Able and willing to learn from instruction.",
    "grid": [
      "A",
      "B",
      "T",
      "H",
      "L",
      "E",
      "E",
      "C",
      "A"
    ],
    "path": [
      2,
      5,
      8,
      7,
      3,
      0,
      1,
      4,
      6
    ],
    "accepted": [
      "TEACHABLE"
    ]
  },
  {
    "id": "trail-176",
    "answer": "TELEGRAPH",
    "clue": "A system for transmitting coded messages over a wire.",
    "grid": [
      "E",
      "T",
      "H",
      "E",
      "L",
      "P",
      "G",
      "R",
      "A"
    ],
    "path": [
      1,
      0,
      4,
      3,
      6,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "TELEGRAPH"
    ]
  },
  {
    "id": "trail-177",
    "answer": "THUMBNAIL",
    "clue": "The hard covering on the end of the broadest finger.",
    "grid": [
      "I",
      "L",
      "H",
      "A",
      "U",
      "T",
      "N",
      "B",
      "M"
    ],
    "path": [
      5,
      2,
      4,
      8,
      7,
      6,
      3,
      0,
      1
    ],
    "accepted": [
      "THUMBNAIL"
    ]
  },
  {
    "id": "trail-178",
    "answer": "TIMETABLE",
    "clue": "A schedule giving planned times for events or journeys.",
    "grid": [
      "E",
      "M",
      "T",
      "T",
      "I",
      "L",
      "A",
      "B",
      "E"
    ],
    "path": [
      2,
      4,
      1,
      0,
      3,
      6,
      7,
      5,
      8
    ],
    "accepted": [
      "TIMETABLE"
    ]
  },
  {
    "id": "trail-179",
    "answer": "BRIEFCASE",
    "clue": "A flat handled case used to carry work documents.",
    "grid": [
      "E",
      "B",
      "A",
      "R",
      "S",
      "C",
      "I",
      "E",
      "F"
    ],
    "path": [
      1,
      3,
      6,
      7,
      8,
      5,
      2,
      4,
      0
    ],
    "accepted": [
      "BRIEFCASE"
    ]
  },
  {
    "id": "trail-180",
    "answer": "TOOTHACHE",
    "clue": "Pain felt in a tooth or the area surrounding it.",
    "grid": [
      "C",
      "H",
      "E",
      "A",
      "O",
      "T",
      "H",
      "T",
      "O"
    ],
    "path": [
      5,
      4,
      8,
      7,
      6,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "TOOTHACHE"
    ]
  },
  {
    "id": "trail-181",
    "answer": "BUTTERCUP",
    "clue": "A small wildflower with glossy yellow petals.",
    "grid": [
      "T",
      "U",
      "P",
      "T",
      "E",
      "C",
      "B",
      "U",
      "R"
    ],
    "path": [
      6,
      7,
      3,
      0,
      4,
      8,
      5,
      1,
      2
    ],
    "accepted": [
      "BUTTERCUP"
    ]
  },
  {
    "id": "trail-182",
    "answer": "CASSEROLE",
    "clue": "A dish of mixed ingredients cooked together in an oven.",
    "grid": [
      "S",
      "C",
      "E",
      "S",
      "A",
      "L",
      "E",
      "R",
      "O"
    ],
    "path": [
      1,
      4,
      0,
      3,
      6,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "CASSEROLE"
    ]
  },
  {
    "id": "trail-183",
    "answer": "CENTIPEDE",
    "clue": "A many-legged arthropod with one pair of legs per body segment.",
    "grid": [
      "I",
      "P",
      "E",
      "T",
      "C",
      "D",
      "N",
      "E",
      "E"
    ],
    "path": [
      4,
      7,
      6,
      3,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "CENTIPEDE"
    ]
  },
  {
    "id": "trail-184",
    "answer": "TREASURED",
    "clue": "Held in high personal value and cared for closely.",
    "grid": [
      "T",
      "A",
      "E",
      "S",
      "R",
      "E",
      "U",
      "R",
      "D"
    ],
    "path": [
      0,
      4,
      2,
      1,
      3,
      6,
      7,
      5,
      8
    ],
    "accepted": [
      "TREASURED"
    ]
  },
  {
    "id": "trail-185",
    "answer": "TREEHOUSE",
    "clue": "A small structure built among the branches above ground.",
    "grid": [
      "U",
      "T",
      "E",
      "O",
      "S",
      "R",
      "H",
      "E",
      "E"
    ],
    "path": [
      1,
      5,
      8,
      7,
      6,
      3,
      0,
      4,
      2
    ],
    "accepted": [
      "TREEHOUSE"
    ]
  },
  {
    "id": "trail-186",
    "answer": "TRIATHLON",
    "clue": "A race combining swimming, cycling, and running.",
    "grid": [
      "N",
      "O",
      "R",
      "L",
      "I",
      "T",
      "H",
      "T",
      "A"
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
      "TRIATHLON"
    ]
  },
  {
    "id": "trail-187",
    "answer": "UMBRELLAS",
    "clue": "Portable canopies held overhead to keep off rain.",
    "grid": [
      "S",
      "B",
      "U",
      "R",
      "A",
      "M",
      "E",
      "L",
      "L"
    ],
    "path": [
      2,
      5,
      1,
      3,
      6,
      7,
      8,
      4,
      0
    ],
    "accepted": [
      "UMBRELLAS"
    ]
  },
  {
    "id": "trail-188",
    "answer": "UNDERPASS",
    "clue": "A route that travels beneath another road or railway.",
    "grid": [
      "A",
      "U",
      "S",
      "P",
      "S",
      "N",
      "R",
      "E",
      "D"
    ],
    "path": [
      1,
      5,
      8,
      7,
      6,
      3,
      0,
      4,
      2
    ],
    "accepted": [
      "UNDERPASS"
    ]
  },
  {
    "id": "trail-189",
    "answer": "VEGETABLE",
    "clue": "An edible plant or plant part served in savory meals.",
    "grid": [
      "G",
      "E",
      "T",
      "V",
      "E",
      "A",
      "E",
      "L",
      "B"
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
      "VEGETABLE"
    ]
  },
  {
    "id": "trail-190",
    "answer": "VOLUNTEER",
    "clue": "Someone who offers to help without being required to do so.",
    "grid": [
      "E",
      "E",
      "R",
      "T",
      "N",
      "V",
      "U",
      "L",
      "O"
    ],
    "path": [
      5,
      8,
      7,
      6,
      4,
      3,
      0,
      1,
      2
    ],
    "accepted": [
      "VOLUNTEER"
    ]
  },
  {
    "id": "trail-191",
    "answer": "WALLPAPER",
    "clue": "Decorative paper applied to the inside walls of a room.",
    "grid": [
      "P",
      "A",
      "P",
      "E",
      "L",
      "W",
      "R",
      "A",
      "L"
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
      "WALLPAPER"
    ]
  },
  {
    "id": "trail-192",
    "answer": "WANDERING",
    "clue": "Moving from place to place without a fixed route.",
    "grid": [
      "D",
      "N",
      "G",
      "A",
      "E",
      "N",
      "W",
      "R",
      "I"
    ],
    "path": [
      6,
      3,
      1,
      0,
      4,
      7,
      8,
      5,
      2
    ],
    "accepted": [
      "WANDERING"
    ]
  },
  {
    "id": "trail-193",
    "answer": "WASHCLOTH",
    "clue": "A small piece of fabric used for cleaning the body.",
    "grid": [
      "H",
      "O",
      "W",
      "T",
      "A",
      "L",
      "S",
      "H",
      "C"
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
      "WASHCLOTH"
    ]
  },
  {
    "id": "trail-194",
    "answer": "CHOPSTICK",
    "clue": "One of a pair of slender sticks used to pick up food.",
    "grid": [
      "T",
      "I",
      "K",
      "H",
      "S",
      "C",
      "C",
      "O",
      "P"
    ],
    "path": [
      6,
      3,
      7,
      8,
      4,
      0,
      1,
      5,
      2
    ],
    "accepted": [
      "CHOPSTICK"
    ]
  },
  {
    "id": "trail-195",
    "answer": "CROISSANT",
    "clue": "A flaky buttery pastry traditionally shaped like a crescent.",
    "grid": [
      "I",
      "S",
      "A",
      "S",
      "O",
      "N",
      "R",
      "C",
      "T"
    ],
    "path": [
      7,
      6,
      4,
      0,
      3,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "CROISSANT"
    ]
  },
  {
    "id": "trail-196",
    "answer": "WHEELBASE",
    "clue": "The distance between the front and rear axles of a vehicle.",
    "grid": [
      "L",
      "B",
      "A",
      "W",
      "E",
      "S",
      "E",
      "H",
      "E"
    ],
    "path": [
      3,
      7,
      6,
      4,
      0,
      1,
      2,
      5,
      8
    ],
    "accepted": [
      "WHEELBASE"
    ]
  },
  {
    "id": "trail-197",
    "answer": "WHIRLPOOL",
    "clue": "Water rotating rapidly around a central depression.",
    "grid": [
      "L",
      "I",
      "H",
      "O",
      "W",
      "R",
      "O",
      "P",
      "L"
    ],
    "path": [
      4,
      2,
      1,
      5,
      8,
      7,
      6,
      3,
      0
    ],
    "accepted": [
      "WHIRLPOOL"
    ]
  },
  {
    "id": "trail-198",
    "answer": "DRIFTWOOD",
    "clue": "Timber carried and deposited by moving water.",
    "grid": [
      "D",
      "I",
      "F",
      "O",
      "R",
      "T",
      "O",
      "W",
      "D"
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
      "DRIFTWOOD"
    ]
  },
  {
    "id": "trail-199",
    "answer": "WINDBREAK",
    "clue": "A barrier of trees or fencing that reduces the force of air.",
    "grid": [
      "W",
      "E",
      "R",
      "A",
      "I",
      "B",
      "K",
      "N",
      "D"
    ],
    "path": [
      0,
      4,
      7,
      8,
      5,
      2,
      1,
      3,
      6
    ],
    "accepted": [
      "WINDBREAK"
    ]
  },
  {
    "id": "trail-200",
    "answer": "WORKBENCH",
    "clue": "A sturdy table used for practical craft or repair tasks.",
    "grid": [
      "H",
      "C",
      "N",
      "W",
      "K",
      "E",
      "R",
      "O",
      "B"
    ],
    "path": [
      3,
      7,
      6,
      4,
      8,
      5,
      2,
      1,
      0
    ],
    "accepted": [
      "WORKBENCH"
    ]
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 200,
  "uniqueCluedAnswers": 200,
  "newAuthoredAnswers": 170
});
