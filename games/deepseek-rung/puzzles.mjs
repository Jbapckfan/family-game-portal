// Thirty authored start/target challenges. Freeze their originally published
// pars independently of later dictionary growth; the UI computes today's shortest route.
const ORIGINAL_PARS=Object.freeze([4,5,3,3,5,7,3,6,4,4,8,6,9,5,6,4,5,8,6,9,6,3,5,6,10,7,3,5,3,5]);
const endpoints=[
 ['COLD','WARM'],['HEAD','TAIL'],['LOVE','HATE'],['WEST','EAST'],['DARK','LAMP'],
 ['DUSK','DAWN'],['SAND','SOIL'],['FIRE','RAIN'],['MIND','BODY'],['WORD','BOOK'],
 ['POOR','RICH'],['FAST','SLOW'],['HOME','AWAY'],['SAFE','WILD'],['HARD','SOFT'],
 ['GIVE','TAKE'],['LOST','FIND'],['WOLF','LAMB'],['FISH','BIRD'],['GAME','PLAY'],
 ['MOON','STAR'],['GOOD','FOUL'],['WORK','REST'],['LIFE','DEAD'],['BLUE','PINK'],
 ['TREE','LEAF'],['LEAD','GOLD'],['BEAR','LION'],['TIDE','WAVE'],['CATS','DOGS'],
];
const ORIGINAL_PUZZLES=Object.freeze(endpoints.map(([start,target],index)=>{
 return Object.freeze({id:`rung-${String(index+1).padStart(2,'0')}`,start,target,par:ORIGINAL_PARS[index]});
}));

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// All published records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "rung-031",
    "start": "HARD",
    "target": "LEAD",
    "par": 3
  },
  {
    "id": "rung-032",
    "start": "DUSK",
    "target": "WORD",
    "par": 7
  },
  {
    "id": "rung-033",
    "start": "FAST",
    "target": "RAIN",
    "par": 6
  },
  {
    "id": "rung-034",
    "start": "FOUL",
    "target": "WILD",
    "par": 6
  },
  {
    "id": "rung-035",
    "start": "FIRE",
    "target": "MOON",
    "par": 4
  },
  {
    "id": "rung-036",
    "start": "BODY",
    "target": "SOIL",
    "par": 7
  },
  {
    "id": "rung-037",
    "start": "BEAR",
    "target": "LOST",
    "par": 4
  },
  {
    "id": "rung-038",
    "start": "GOOD",
    "target": "HEAD",
    "par": 4
  },
  {
    "id": "rung-039",
    "start": "AWAY",
    "target": "STAR",
    "par": 3
  },
  {
    "id": "rung-040",
    "start": "FISH",
    "target": "WAVE",
    "par": 5
  },
  {
    "id": "rung-041",
    "start": "LAMP",
    "target": "TAKE",
    "par": 3
  },
  {
    "id": "rung-042",
    "start": "POOR",
    "target": "SAFE",
    "par": 6
  },
  {
    "id": "rung-043",
    "start": "GIVE",
    "target": "HATE",
    "par": 3
  },
  {
    "id": "rung-044",
    "start": "TREE",
    "target": "WEST",
    "par": 6
  },
  {
    "id": "rung-045",
    "start": "REST",
    "target": "SOFT",
    "par": 4
  },
  {
    "id": "rung-046",
    "start": "GOLD",
    "target": "WARM",
    "par": 5
  },
  {
    "id": "rung-047",
    "start": "LAMB",
    "target": "PINK",
    "par": 5
  },
  {
    "id": "rung-048",
    "start": "DAWN",
    "target": "DEAD",
    "par": 7
  },
  {
    "id": "rung-049",
    "start": "HOME",
    "target": "TIDE",
    "par": 3
  },
  {
    "id": "rung-050",
    "start": "CATS",
    "target": "SAND",
    "par": 4
  },
  {
    "id": "rung-051",
    "start": "LION",
    "target": "MIND",
    "par": 6
  },
  {
    "id": "rung-052",
    "start": "LIFE",
    "target": "TAIL",
    "par": 6
  },
  {
    "id": "rung-053",
    "start": "SLOW",
    "target": "WOLF",
    "par": 6
  },
  {
    "id": "rung-054",
    "start": "BIRD",
    "target": "WORK",
    "par": 6
  },
  {
    "id": "rung-055",
    "start": "COLD",
    "target": "FIND",
    "par": 3
  },
  {
    "id": "rung-056",
    "start": "EAST",
    "target": "LOVE",
    "par": 4
  },
  {
    "id": "rung-057",
    "start": "BOOK",
    "target": "PLAY",
    "par": 5
  },
  {
    "id": "rung-058",
    "start": "DARK",
    "target": "GAME",
    "par": 4
  },
  {
    "id": "rung-059",
    "start": "DOGS",
    "target": "LEAF",
    "par": 7
  },
  {
    "id": "rung-060",
    "start": "RICH",
    "target": "TAKE",
    "par": 4
  },
  {
    "id": "rung-061",
    "start": "BEAR",
    "target": "BLUE",
    "par": 6
  },
  {
    "id": "rung-062",
    "start": "HARD",
    "target": "TREE",
    "par": 7
  },
  {
    "id": "rung-063",
    "start": "GOLD",
    "target": "SOIL",
    "par": 4
  },
  {
    "id": "rung-064",
    "start": "BODY",
    "target": "EAST",
    "par": 6
  },
  {
    "id": "rung-065",
    "start": "DEAD",
    "target": "DUSK",
    "par": 6
  },
  {
    "id": "rung-066",
    "start": "MOON",
    "target": "SOFT",
    "par": 3
  },
  {
    "id": "rung-067",
    "start": "GOOD",
    "target": "PLAY",
    "par": 5
  },
  {
    "id": "rung-068",
    "start": "BIRD",
    "target": "WORD",
    "par": 5
  },
  {
    "id": "rung-069",
    "start": "LAMP",
    "target": "STAR",
    "par": 7
  },
  {
    "id": "rung-070",
    "start": "FOUL",
    "target": "TAIL",
    "par": 3
  },
  {
    "id": "rung-071",
    "start": "DOGS",
    "target": "HATE",
    "par": 6
  },
  {
    "id": "rung-072",
    "start": "COLD",
    "target": "POOR",
    "par": 4
  },
  {
    "id": "rung-073",
    "start": "AWAY",
    "target": "REST",
    "par": 6
  },
  {
    "id": "rung-074",
    "start": "BOOK",
    "target": "HEAD",
    "par": 5
  },
  {
    "id": "rung-075",
    "start": "TIDE",
    "target": "WORK",
    "par": 4
  },
  {
    "id": "rung-076",
    "start": "HOME",
    "target": "LAMB",
    "par": 4
  },
  {
    "id": "rung-077",
    "start": "LEAD",
    "target": "WOLF",
    "par": 5
  },
  {
    "id": "rung-078",
    "start": "FAST",
    "target": "GAME",
    "par": 4
  },
  {
    "id": "rung-079",
    "start": "FISH",
    "target": "SLOW",
    "par": 7
  },
  {
    "id": "rung-080",
    "start": "MIND",
    "target": "RAIN",
    "par": 6
  },
  {
    "id": "rung-081",
    "start": "DARK",
    "target": "SAFE",
    "par": 5
  },
  {
    "id": "rung-082",
    "start": "RICH",
    "target": "WAVE",
    "par": 4
  },
  {
    "id": "rung-083",
    "start": "DAWN",
    "target": "FIRE",
    "par": 4
  },
  {
    "id": "rung-084",
    "start": "LEAF",
    "target": "WILD",
    "par": 5
  },
  {
    "id": "rung-085",
    "start": "BLUE",
    "target": "SAND",
    "par": 7
  },
  {
    "id": "rung-086",
    "start": "GIVE",
    "target": "LION",
    "par": 7
  },
  {
    "id": "rung-087",
    "start": "CATS",
    "target": "PINK",
    "par": 4
  },
  {
    "id": "rung-088",
    "start": "LIFE",
    "target": "WARM",
    "par": 4
  },
  {
    "id": "rung-089",
    "start": "FIND",
    "target": "WEST",
    "par": 5
  },
  {
    "id": "rung-090",
    "start": "LOVE",
    "target": "WORK",
    "par": 3
  },
  {
    "id": "rung-091",
    "start": "LOST",
    "target": "PLAY",
    "par": 6
  },
  {
    "id": "rung-092",
    "start": "TAIL",
    "target": "TAKE",
    "par": 3
  },
  {
    "id": "rung-093",
    "start": "BODY",
    "target": "LIFE",
    "par": 5
  },
  {
    "id": "rung-094",
    "start": "SOFT",
    "target": "WORD",
    "par": 4
  },
  {
    "id": "rung-095",
    "start": "DEAD",
    "target": "STAR",
    "par": 3
  },
  {
    "id": "rung-096",
    "start": "BIRD",
    "target": "GOOD",
    "par": 5
  },
  {
    "id": "rung-097",
    "start": "AWAY",
    "target": "PINK",
    "par": 7
  },
  {
    "id": "rung-098",
    "start": "RICH",
    "target": "TIDE",
    "par": 3
  },
  {
    "id": "rung-099",
    "start": "FISH",
    "target": "POOR",
    "par": 6
  },
  {
    "id": "rung-100",
    "start": "COLD",
    "target": "FOUL",
    "par": 4
  },
  {
    "id": "rung-101",
    "start": "SOIL",
    "target": "WEST",
    "par": 6
  },
  {
    "id": "rung-102",
    "start": "MOON",
    "target": "RAIN",
    "par": 6
  },
  {
    "id": "rung-103",
    "start": "BOOK",
    "target": "WAVE",
    "par": 6
  },
  {
    "id": "rung-104",
    "start": "FAST",
    "target": "HARD",
    "par": 4
  },
  {
    "id": "rung-105",
    "start": "DUSK",
    "target": "LAMP",
    "par": 6
  },
  {
    "id": "rung-106",
    "start": "REST",
    "target": "WILD",
    "par": 5
  },
  {
    "id": "rung-107",
    "start": "DOGS",
    "target": "GOLD",
    "par": 7
  },
  {
    "id": "rung-108",
    "start": "BEAR",
    "target": "TREE",
    "par": 6
  },
  {
    "id": "rung-109",
    "start": "LAMB",
    "target": "SAFE",
    "par": 3
  },
  {
    "id": "rung-110",
    "start": "FIRE",
    "target": "WOLF",
    "par": 6
  },
  {
    "id": "rung-111",
    "start": "EAST",
    "target": "LION",
    "par": 5
  },
  {
    "id": "rung-112",
    "start": "BLUE",
    "target": "LOST",
    "par": 7
  },
  {
    "id": "rung-113",
    "start": "DARK",
    "target": "SAND",
    "par": 4
  },
  {
    "id": "rung-114",
    "start": "CATS",
    "target": "HOME",
    "par": 5
  },
  {
    "id": "rung-115",
    "start": "DAWN",
    "target": "HEAD",
    "par": 6
  },
  {
    "id": "rung-116",
    "start": "HATE",
    "target": "LEAF",
    "par": 6
  },
  {
    "id": "rung-117",
    "start": "LOVE",
    "target": "SLOW",
    "par": 6
  },
  {
    "id": "rung-118",
    "start": "LEAD",
    "target": "WARM",
    "par": 5
  },
  {
    "id": "rung-119",
    "start": "GAME",
    "target": "MIND",
    "par": 5
  },
  {
    "id": "rung-120",
    "start": "FIND",
    "target": "GIVE",
    "par": 3
  },
  {
    "id": "rung-121",
    "start": "MIND",
    "target": "TAKE",
    "par": 4
  },
  {
    "id": "rung-122",
    "start": "PLAY",
    "target": "POOR",
    "par": 7
  },
  {
    "id": "rung-123",
    "start": "GAME",
    "target": "WORD",
    "par": 5
  },
  {
    "id": "rung-124",
    "start": "RICH",
    "target": "SOFT",
    "par": 6
  },
  {
    "id": "rung-125",
    "start": "DEAD",
    "target": "WORK",
    "par": 5
  },
  {
    "id": "rung-126",
    "start": "FOUL",
    "target": "SLOW",
    "par": 5
  },
  {
    "id": "rung-127",
    "start": "LIFE",
    "target": "STAR",
    "par": 7
  },
  {
    "id": "rung-128",
    "start": "GOOD",
    "target": "REST",
    "par": 6
  },
  {
    "id": "rung-129",
    "start": "MOON",
    "target": "WAVE",
    "par": 5
  },
  {
    "id": "rung-130",
    "start": "BOOK",
    "target": "WARM",
    "par": 5
  },
  {
    "id": "rung-131",
    "start": "FAST",
    "target": "LAMB",
    "par": 5
  },
  {
    "id": "rung-132",
    "start": "DARK",
    "target": "TAIL",
    "par": 5
  },
  {
    "id": "rung-133",
    "start": "BIRD",
    "target": "SOIL",
    "par": 6
  },
  {
    "id": "rung-134",
    "start": "HATE",
    "target": "RAIN",
    "par": 5
  },
  {
    "id": "rung-135",
    "start": "GOLD",
    "target": "LION",
    "par": 5
  },
  {
    "id": "rung-136",
    "start": "DOGS",
    "target": "PINK",
    "par": 6
  },
  {
    "id": "rung-137",
    "start": "DUSK",
    "target": "LEAF",
    "par": 6
  },
  {
    "id": "rung-138",
    "start": "EAST",
    "target": "FIRE",
    "par": 5
  },
  {
    "id": "rung-139",
    "start": "SAND",
    "target": "WEST",
    "par": 4
  },
  {
    "id": "rung-140",
    "start": "CATS",
    "target": "WILD",
    "par": 6
  },
  {
    "id": "rung-141",
    "start": "BEAR",
    "target": "WOLF",
    "par": 7
  },
  {
    "id": "rung-142",
    "start": "HARD",
    "target": "LAMP",
    "par": 5
  },
  {
    "id": "rung-143",
    "start": "LEAD",
    "target": "TREE",
    "par": 7
  },
  {
    "id": "rung-144",
    "start": "BODY",
    "target": "COLD",
    "par": 4
  },
  {
    "id": "rung-145",
    "start": "LOST",
    "target": "SAFE",
    "par": 5
  },
  {
    "id": "rung-146",
    "start": "AWAY",
    "target": "BLUE",
    "par": 7
  },
  {
    "id": "rung-147",
    "start": "LOVE",
    "target": "TIDE",
    "par": 4
  },
  {
    "id": "rung-148",
    "start": "GIVE",
    "target": "HEAD",
    "par": 5
  },
  {
    "id": "rung-149",
    "start": "FISH",
    "target": "HOME",
    "par": 6
  },
  {
    "id": "rung-150",
    "start": "DAWN",
    "target": "FIND",
    "par": 6
  },
  {
    "id": "rung-151",
    "start": "CATS",
    "target": "WORD",
    "par": 4
  },
  {
    "id": "rung-152",
    "start": "TAKE",
    "target": "WEST",
    "par": 6
  },
  {
    "id": "rung-153",
    "start": "LAMB",
    "target": "WORK",
    "par": 6
  },
  {
    "id": "rung-154",
    "start": "DEAD",
    "target": "TIDE",
    "par": 6
  },
  {
    "id": "rung-155",
    "start": "BIRD",
    "target": "FOUL",
    "par": 6
  },
  {
    "id": "rung-156",
    "start": "PLAY",
    "target": "SOFT",
    "par": 5
  },
  {
    "id": "rung-157",
    "start": "COLD",
    "target": "MOON",
    "par": 3
  },
  {
    "id": "rung-158",
    "start": "SLOW",
    "target": "WAVE",
    "par": 7
  },
  {
    "id": "rung-159",
    "start": "FIND",
    "target": "STAR",
    "par": 6
  },
  {
    "id": "rung-160",
    "start": "EAST",
    "target": "GOOD",
    "par": 5
  },
  {
    "id": "rung-161",
    "start": "BODY",
    "target": "RICH",
    "par": 7
  },
  {
    "id": "rung-162",
    "start": "LAMP",
    "target": "POOR",
    "par": 7
  },
  {
    "id": "rung-163",
    "start": "DUSK",
    "target": "LION",
    "par": 6
  },
  {
    "id": "rung-164",
    "start": "AWAY",
    "target": "BOOK",
    "par": 7
  },
  {
    "id": "rung-165",
    "start": "GIVE",
    "target": "SOIL",
    "par": 7
  },
  {
    "id": "rung-166",
    "start": "RAIN",
    "target": "REST",
    "par": 7
  },
  {
    "id": "rung-167",
    "start": "HOME",
    "target": "TAIL",
    "par": 5
  },
  {
    "id": "rung-168",
    "start": "FIRE",
    "target": "SAFE",
    "par": 4
  },
  {
    "id": "rung-169",
    "start": "BEAR",
    "target": "MIND",
    "par": 4
  },
  {
    "id": "rung-170",
    "start": "HEAD",
    "target": "TREE",
    "par": 6
  },
  {
    "id": "rung-171",
    "start": "LIFE",
    "target": "SAND",
    "par": 4
  },
  {
    "id": "rung-172",
    "start": "DOGS",
    "target": "LEAD",
    "par": 6
  },
  {
    "id": "rung-173",
    "start": "HATE",
    "target": "WILD",
    "par": 5
  },
  {
    "id": "rung-174",
    "start": "GOLD",
    "target": "PINK",
    "par": 5
  },
  {
    "id": "rung-175",
    "start": "DAWN",
    "target": "GAME",
    "par": 5
  },
  {
    "id": "rung-176",
    "start": "DARK",
    "target": "LOVE",
    "par": 5
  },
  {
    "id": "rung-177",
    "start": "FISH",
    "target": "LOST",
    "par": 3
  },
  {
    "id": "rung-178",
    "start": "LEAF",
    "target": "WOLF",
    "par": 6
  },
  {
    "id": "rung-179",
    "start": "FAST",
    "target": "WARM",
    "par": 4
  },
  {
    "id": "rung-180",
    "start": "BLUE",
    "target": "SOIL",
    "par": 5
  },
  {
    "id": "rung-181",
    "start": "DUSK",
    "target": "HARD",
    "par": 6
  },
  {
    "id": "rung-182",
    "start": "LION",
    "target": "WORD",
    "par": 5
  },
  {
    "id": "rung-183",
    "start": "EAST",
    "target": "SOFT",
    "par": 4
  },
  {
    "id": "rung-184",
    "start": "FAST",
    "target": "TIDE",
    "par": 6
  },
  {
    "id": "rung-185",
    "start": "FOUL",
    "target": "GOLD",
    "par": 4
  },
  {
    "id": "rung-186",
    "start": "DEAD",
    "target": "FISH",
    "par": 7
  },
  {
    "id": "rung-187",
    "start": "DARK",
    "target": "STAR",
    "par": 6
  },
  {
    "id": "rung-188",
    "start": "PLAY",
    "target": "SLOW",
    "par": 3
  },
  {
    "id": "rung-189",
    "start": "FIND",
    "target": "RAIN",
    "par": 6
  },
  {
    "id": "rung-190",
    "start": "BIRD",
    "target": "REST",
    "par": 5
  },
  {
    "id": "rung-191",
    "start": "LEAD",
    "target": "POOR",
    "par": 6
  },
  {
    "id": "rung-192",
    "start": "RICH",
    "target": "SAND",
    "par": 6
  },
  {
    "id": "rung-193",
    "start": "BODY",
    "target": "GAME",
    "par": 6
  },
  {
    "id": "rung-194",
    "start": "BOOK",
    "target": "WOLF",
    "par": 4
  },
  {
    "id": "rung-195",
    "start": "LIFE",
    "target": "MOON",
    "par": 5
  },
  {
    "id": "rung-196",
    "start": "CATS",
    "target": "TAKE",
    "par": 4
  },
  {
    "id": "rung-197",
    "start": "BEAR",
    "target": "LEAF",
    "par": 3
  },
  {
    "id": "rung-198",
    "start": "LAMP",
    "target": "WILD",
    "par": 6
  },
  {
    "id": "rung-199",
    "start": "COLD",
    "target": "LAMB",
    "par": 5
  },
  {
    "id": "rung-200",
    "start": "SAFE",
    "target": "TAIL",
    "par": 4
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 200,
  "curatedEndpointWords": 60,
  "minimumPar": 3,
  "maximumAddedPar": 7
});
