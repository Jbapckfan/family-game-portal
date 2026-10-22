import {findRoute} from './engine.mjs';
// Thirty authored start/target challenges. Pars are calculated against the actual accepted lexicon.
const endpoints=[
 ['COLD','WARM'],['HEAD','TAIL'],['LOVE','HATE'],['WEST','EAST'],['DARK','LAMP'],
 ['DUSK','DAWN'],['SAND','SOIL'],['FIRE','RAIN'],['MIND','BODY'],['WORD','BOOK'],
 ['POOR','RICH'],['FAST','SLOW'],['HOME','AWAY'],['SAFE','WILD'],['HARD','SOFT'],
 ['GIVE','TAKE'],['LOST','FIND'],['WOLF','LAMB'],['FISH','BIRD'],['GAME','PLAY'],
 ['MOON','STAR'],['GOOD','FOUL'],['WORK','REST'],['LIFE','DEAD'],['BLUE','PINK'],
 ['TREE','LEAF'],['LEAD','GOLD'],['BEAR','LION'],['TIDE','WAVE'],['CATS','DOGS'],
];
const ORIGINAL_PUZZLES=Object.freeze(endpoints.map(([start,target],index)=>{
 const route=findRoute(start,target);
 if(!route)throw new Error(`Disconnected authored ladder: ${start} to ${target}`);
 return Object.freeze({id:`rung-${String(index+1).padStart(2,'0')}`,start,target,par:route.length-1});
}));

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// The first thirty records retain their original values, IDs, and ordering.
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
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 120,
  "curatedEndpointWords": 60,
  "minimumPar": 3,
  "maximumAddedPar": 7
});
