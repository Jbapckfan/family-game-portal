// Thirty authored antonym boards. The spare is a neutral concrete noun.
const boards=[
 ['ABUNDANT/SCARCE','RIGID/FLEXIBLE','TIMID/BOLD','VACANT/OCCUPIED','COMPASS'],
 ['ANCIENT/MODERN','EXPAND/CONTRACT','PRIVATE/PUBLIC','ASCEND/DESCEND','RIBBON'],
 ['GENEROUS/STINGY','FRAGILE/STURDY','SHALLOW/DEEP','NOISY/SILENT','MEADOW'],
 ['BITTER/SWEET','INCLUDE/EXCLUDE','TRIUMPH/DEFEAT','ARRIVE/DEPART','TEAPOT'],
 ['COMBINE/SEPARATE','TEMPORARY/PERMANENT','HUMBLE/PROUD','VISIBLE/HIDDEN','ANCHOR'],
 ['FUTURE/PAST','PROFIT/LOSS','ACCEPT/REJECT','LEGAL/ILLEGAL','THIMBLE'],
 ['OPAQUE/TRANSPARENT','CAUTIOUS/RECKLESS','EAGER/RELUCTANT','NATIVE/FOREIGN','PENCIL'],
 ['FLOURISH/WITHER','REVEAL/CONCEAL','EMPTY/FULL','LOOSE/TIGHT','KETTLE'],
 ['INCREASE/DECREASE','ORDINARY/UNUSUAL','SMOOTH/ROUGH','INNOCENT/GUILTY','CANYON'],
 ['BROAD/NARROW','DELIBERATE/ACCIDENTAL','OPTIMIST/PESSIMIST','ADVANCE/RETREAT','BUTTON'],
 ['LAZY/DILIGENT','SIMPLE/COMPLEX','FLOAT/SINK','VICTORY/DEFEAT','LANTERN'],
 ['COURAGE/FEAR','OPEN/CLOSED','ALIVE/DEAD','MELT/FREEZE','PEBBLE'],
 ['EARLY/LATE','LENGTHEN/SHORTEN','SOLID/LIQUID','STRENGTH/WEAKNESS','TRUMPET'],
 ['MAXIMUM/MINIMUM','RARE/COMMON','PATIENCE/IMPATIENCE','EAST/WEST','SADDLE'],
 ['THRIFT/WASTE','OPTIMISTIC/PESSIMISTIC','FRESH/STALE','WIN/LOSE','ORCHARD'],
 ['GENTLE/HARSH','CONFIDENT/UNCERTAIN','FREEDOM/CAPTIVITY','FINITE/INFINITE','WINDOW'],
 ['MODERATE/EXTREME','CREATE/DESTROY','ENCOURAGE/DISCOURAGE','CONVEX/CONCAVE','SPARROW'],
 ['DORMANT/ACTIVE','REWARD/PUNISHMENT','OBEDIENT/DEFIANT','INNER/OUTER','BUCKET'],
 ['SECURE/VULNERABLE','INHALE/EXHALE','COMPULSORY/OPTIONAL','LEADER/FOLLOWER','MARBLE'],
 ['PLENTIFUL/SPARSE','LITERAL/FIGURATIVE','RESIST/YIELD','APPROVE/DISAPPROVE','BASKET'],
 ['HONEST/DECEITFUL','MODEST/ARROGANT','TAME/WILD','MATURE/IMMATURE','HARBOR'],
 ['BEGIN/END','BUY/SELL','BEFORE/AFTER','PUSH/PULL','COBALT'],
 ['BRAVERY/COWARDICE','POLITE/RUDE','ACCURATE/INACCURATE','PRESENT/ABSENT','ACORN'],
 ['SOUR/SWEET','STEEP/GRADUAL','BORROW/LEND','FLEXIBLE/INFLEXIBLE','GALAXY'],
 ['PROTECT/ENDANGER','MAJOR/MINOR','ALLOW/FORBID','SUPERIOR/INFERIOR','CANVAS'],
 ['CERTAIN/DOUBTFUL','DRY/WET','WIDE/NARROW','REPAIR/DAMAGE','VIOLIN'],
 ['PEACE/WAR','RAPID/SLOW','DUSK/DAWN','UPHILL/DOWNHILL','NEEDLE'],
 ['RATIONAL/IRRATIONAL','VANISH/APPEAR','UNITE/DIVIDE','VERTICAL/HORIZONTAL','TURTLE'],
 ['SUCCESS/FAILURE','SHRINK/GROW','AUTHENTIC/COUNTERFEIT','EXPORT/IMPORT','WAFFLE'],
 ['ARRIVAL/DEPARTURE','DEFICIT/SURPLUS','ENEMY/ALLY','EXTERIOR/INTERIOR','SILVER'],
];
const ORIGINAL_PUZZLES=Object.freeze(boards.map((board,i)=>Object.freeze({
 id:`spare-${String(i+1).padStart(2,'0')}`,
 prompt:'Find four pairs with opposite meanings. One word has no partner.',
 pairs:Object.freeze(board.slice(0,4).map(pair=>Object.freeze(pair.split('/')))),spare:board[4],
})));

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// All published records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "spare-031",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ABUNDANT",
        "SCARCE"
      ],
      [
        "LENGTHEN",
        "SHORTEN"
      ],
      [
        "EXPORT",
        "IMPORT"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-032",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "VERTICAL",
        "HORIZONTAL"
      ],
      [
        "SUCCESS",
        "FAILURE"
      ],
      [
        "DRY",
        "WET"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-033",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PROTECT",
        "ENDANGER"
      ],
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "PUSH",
        "PULL"
      ],
      [
        "BUY",
        "SELL"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-034",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FINITE",
        "INFINITE"
      ],
      [
        "OPTIMIST",
        "PESSIMIST"
      ],
      [
        "PROFIT",
        "LOSS"
      ],
      [
        "LOOSE",
        "TIGHT"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-035",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EARLY",
        "LATE"
      ],
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ],
      [
        "MODERATE",
        "EXTREME"
      ],
      [
        "INCLUDE",
        "EXCLUDE"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-036",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SUPERIOR",
        "INFERIOR"
      ],
      [
        "COMPULSORY",
        "OPTIONAL"
      ],
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-037",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FRESH",
        "STALE"
      ],
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "DORMANT",
        "ACTIVE"
      ],
      [
        "REVEAL",
        "CONCEAL"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-038",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MATURE",
        "IMMATURE"
      ],
      [
        "PEACE",
        "WAR"
      ],
      [
        "CAUTIOUS",
        "RECKLESS"
      ],
      [
        "STRENGTH",
        "WEAKNESS"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-039",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CERTAIN",
        "DOUBTFUL"
      ],
      [
        "BEGIN",
        "END"
      ],
      [
        "PRIVATE",
        "PUBLIC"
      ],
      [
        "LEGAL",
        "ILLEGAL"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-040",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "WIDE",
        "NARROW"
      ],
      [
        "EMPTY",
        "FULL"
      ],
      [
        "RAPID",
        "SLOW"
      ],
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-041",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SIMPLE",
        "COMPLEX"
      ],
      [
        "PLENTIFUL",
        "SPARSE"
      ],
      [
        "FLOAT",
        "SINK"
      ],
      [
        "DUSK",
        "DAWN"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-042",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "TAME",
        "WILD"
      ],
      [
        "TIMID",
        "BOLD"
      ],
      [
        "INNOCENT",
        "GUILTY"
      ],
      [
        "OPAQUE",
        "TRANSPARENT"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-043",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "TEMPORARY",
        "PERMANENT"
      ],
      [
        "BORROW",
        "LEND"
      ],
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "HUMBLE",
        "PROUD"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-044",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "LEADER",
        "FOLLOWER"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "ORDINARY",
        "UNUSUAL"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-045",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "COMBINE",
        "SEPARATE"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ],
      [
        "GENTLE",
        "HARSH"
      ],
      [
        "LAZY",
        "DILIGENT"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-046",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VICTORY",
        "DEFEAT"
      ],
      [
        "RARE",
        "COMMON"
      ],
      [
        "INHALE",
        "EXHALE"
      ],
      [
        "BRAVERY",
        "COWARDICE"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-047",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VACANT",
        "OCCUPIED"
      ],
      [
        "ACCEPT",
        "REJECT"
      ],
      [
        "BITTER",
        "SWEET"
      ],
      [
        "EAST",
        "WEST"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-048",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MODEST",
        "ARROGANT"
      ],
      [
        "LITERAL",
        "FIGURATIVE"
      ],
      [
        "CONFIDENT",
        "UNCERTAIN"
      ],
      [
        "STEEP",
        "GRADUAL"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-049",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MELT",
        "FREEZE"
      ],
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "FUTURE",
        "PAST"
      ],
      [
        "BROAD",
        "NARROW"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-050",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "VISIBLE",
        "HIDDEN"
      ],
      [
        "SHALLOW",
        "DEEP"
      ],
      [
        "APPROVE",
        "DISAPPROVE"
      ]
    ],
    "spare": "BASKET"
  },
  {
    "id": "spare-051",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ASCEND",
        "DESCEND"
      ],
      [
        "PRESENT",
        "ABSENT"
      ],
      [
        "REWARD",
        "PUNISHMENT"
      ],
      [
        "RESIST",
        "YIELD"
      ]
    ],
    "spare": "HARBOR"
  },
  {
    "id": "spare-052",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EAGER",
        "RELUCTANT"
      ],
      [
        "WIN",
        "LOSE"
      ],
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "ADVANCE",
        "RETREAT"
      ]
    ],
    "spare": "COBALT"
  },
  {
    "id": "spare-053",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "GENEROUS",
        "STINGY"
      ],
      [
        "ALLOW",
        "FORBID"
      ],
      [
        "MAXIMUM",
        "MINIMUM"
      ],
      [
        "ARRIVE",
        "DEPART"
      ]
    ],
    "spare": "ACORN"
  },
  {
    "id": "spare-054",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "RATIONAL",
        "IRRATIONAL"
      ],
      [
        "DEFICIT",
        "SURPLUS"
      ]
    ],
    "spare": "GALAXY"
  },
  {
    "id": "spare-055",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "NOISY",
        "SILENT"
      ],
      [
        "UNITE",
        "DIVIDE"
      ],
      [
        "SOUR",
        "SWEET"
      ],
      [
        "MAJOR",
        "MINOR"
      ]
    ],
    "spare": "CANVAS"
  },
  {
    "id": "spare-056",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ALIVE",
        "DEAD"
      ],
      [
        "HONEST",
        "DECEITFUL"
      ],
      [
        "UPHILL",
        "DOWNHILL"
      ],
      [
        "SMOOTH",
        "ROUGH"
      ]
    ],
    "spare": "VIOLIN"
  },
  {
    "id": "spare-057",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OBEDIENT",
        "DEFIANT"
      ],
      [
        "EXTERIOR",
        "INTERIOR"
      ],
      [
        "SHRINK",
        "GROW"
      ],
      [
        "OPTIMISTIC",
        "PESSIMISTIC"
      ]
    ],
    "spare": "NEEDLE"
  },
  {
    "id": "spare-058",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "POLITE",
        "RUDE"
      ],
      [
        "COURAGE",
        "FEAR"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ],
      [
        "OPEN",
        "CLOSED"
      ]
    ],
    "spare": "TURTLE"
  },
  {
    "id": "spare-059",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "FLOURISH",
        "WITHER"
      ],
      [
        "THRIFT",
        "WASTE"
      ],
      [
        "ANCIENT",
        "MODERN"
      ]
    ],
    "spare": "WAFFLE"
  },
  {
    "id": "spare-060",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FRAGILE",
        "STURDY"
      ],
      [
        "INCREASE",
        "DECREASE"
      ],
      [
        "ENEMY",
        "ALLY"
      ],
      [
        "INNER",
        "OUTER"
      ]
    ],
    "spare": "SILVER"
  },
  {
    "id": "spare-061",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EAGER",
        "RELUCTANT"
      ],
      [
        "LEADER",
        "FOLLOWER"
      ],
      [
        "TEMPORARY",
        "PERMANENT"
      ],
      [
        "DORMANT",
        "ACTIVE"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-062",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "POLITE",
        "RUDE"
      ],
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "ENEMY",
        "ALLY"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-063",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "OPEN",
        "CLOSED"
      ],
      [
        "MAXIMUM",
        "MINIMUM"
      ],
      [
        "INHALE",
        "EXHALE"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-064",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OBEDIENT",
        "DEFIANT"
      ],
      [
        "GENTLE",
        "HARSH"
      ],
      [
        "REVEAL",
        "CONCEAL"
      ],
      [
        "ORDINARY",
        "UNUSUAL"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-065",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "SMOOTH",
        "ROUGH"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-066",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ALIVE",
        "DEAD"
      ],
      [
        "VACANT",
        "OCCUPIED"
      ],
      [
        "ACCEPT",
        "REJECT"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-067",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "HONEST",
        "DECEITFUL"
      ],
      [
        "REWARD",
        "PUNISHMENT"
      ],
      [
        "INCREASE",
        "DECREASE"
      ],
      [
        "EXTERIOR",
        "INTERIOR"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-068",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "COMPULSORY",
        "OPTIONAL"
      ],
      [
        "RAPID",
        "SLOW"
      ],
      [
        "VISIBLE",
        "HIDDEN"
      ],
      [
        "THRIFT",
        "WASTE"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-069",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MELT",
        "FREEZE"
      ],
      [
        "LEGAL",
        "ILLEGAL"
      ],
      [
        "BEGIN",
        "END"
      ],
      [
        "PUSH",
        "PULL"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-070",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXPORT",
        "IMPORT"
      ],
      [
        "OPTIMISTIC",
        "PESSIMISTIC"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ],
      [
        "CAUTIOUS",
        "RECKLESS"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-071",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "SHRINK",
        "GROW"
      ],
      [
        "MODERATE",
        "EXTREME"
      ],
      [
        "MODEST",
        "ARROGANT"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-072",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "LITERAL",
        "FIGURATIVE"
      ],
      [
        "DEFICIT",
        "SURPLUS"
      ],
      [
        "PRIVATE",
        "PUBLIC"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-073",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "WIDE",
        "NARROW"
      ],
      [
        "FLOURISH",
        "WITHER"
      ],
      [
        "ASCEND",
        "DESCEND"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-074",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "SIMPLE",
        "COMPLEX"
      ],
      [
        "SOUR",
        "SWEET"
      ],
      [
        "SUPERIOR",
        "INFERIOR"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-075",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "UPHILL",
        "DOWNHILL"
      ],
      [
        "INCLUDE",
        "EXCLUDE"
      ],
      [
        "ARRIVE",
        "DEPART"
      ],
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-076",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MAJOR",
        "MINOR"
      ],
      [
        "FRESH",
        "STALE"
      ],
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "FLOAT",
        "SINK"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-077",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RATIONAL",
        "IRRATIONAL"
      ],
      [
        "OPTIMIST",
        "PESSIMIST"
      ],
      [
        "BRAVERY",
        "COWARDICE"
      ],
      [
        "EMPTY",
        "FULL"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-078",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "STRENGTH",
        "WEAKNESS"
      ],
      [
        "DRY",
        "WET"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "NOISY",
        "SILENT"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-079",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PROTECT",
        "ENDANGER"
      ],
      [
        "WIN",
        "LOSE"
      ],
      [
        "PLENTIFUL",
        "SPARSE"
      ],
      [
        "TIMID",
        "BOLD"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-080",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "ANCIENT",
        "MODERN"
      ],
      [
        "PRESENT",
        "ABSENT"
      ],
      [
        "PEACE",
        "WAR"
      ]
    ],
    "spare": "BASKET"
  },
  {
    "id": "spare-081",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ADVANCE",
        "RETREAT"
      ],
      [
        "TAME",
        "WILD"
      ],
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ],
      [
        "INNER",
        "OUTER"
      ]
    ],
    "spare": "HARBOR"
  },
  {
    "id": "spare-082",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "APPROVE",
        "DISAPPROVE"
      ],
      [
        "BROAD",
        "NARROW"
      ],
      [
        "FINITE",
        "INFINITE"
      ],
      [
        "PROFIT",
        "LOSS"
      ]
    ],
    "spare": "COBALT"
  },
  {
    "id": "spare-083",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FUTURE",
        "PAST"
      ],
      [
        "OPAQUE",
        "TRANSPARENT"
      ],
      [
        "INNOCENT",
        "GUILTY"
      ],
      [
        "BORROW",
        "LEND"
      ]
    ],
    "spare": "ACORN"
  },
  {
    "id": "spare-084",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONFIDENT",
        "UNCERTAIN"
      ],
      [
        "FRAGILE",
        "STURDY"
      ],
      [
        "SUCCESS",
        "FAILURE"
      ],
      [
        "ALLOW",
        "FORBID"
      ]
    ],
    "spare": "GALAXY"
  },
  {
    "id": "spare-085",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SHALLOW",
        "DEEP"
      ],
      [
        "VERTICAL",
        "HORIZONTAL"
      ],
      [
        "HUMBLE",
        "PROUD"
      ],
      [
        "BITTER",
        "SWEET"
      ]
    ],
    "spare": "CANVAS"
  },
  {
    "id": "spare-086",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "RESIST",
        "YIELD"
      ],
      [
        "VICTORY",
        "DEFEAT"
      ],
      [
        "UNITE",
        "DIVIDE"
      ]
    ],
    "spare": "VIOLIN"
  },
  {
    "id": "spare-087",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EAST",
        "WEST"
      ],
      [
        "DUSK",
        "DAWN"
      ],
      [
        "LAZY",
        "DILIGENT"
      ],
      [
        "ABUNDANT",
        "SCARCE"
      ]
    ],
    "spare": "NEEDLE"
  },
  {
    "id": "spare-088",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "GENEROUS",
        "STINGY"
      ],
      [
        "MATURE",
        "IMMATURE"
      ],
      [
        "EARLY",
        "LATE"
      ],
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ]
    ],
    "spare": "TURTLE"
  },
  {
    "id": "spare-089",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BUY",
        "SELL"
      ],
      [
        "LENGTHEN",
        "SHORTEN"
      ],
      [
        "STEEP",
        "GRADUAL"
      ],
      [
        "LOOSE",
        "TIGHT"
      ]
    ],
    "spare": "WAFFLE"
  },
  {
    "id": "spare-090",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "COMBINE",
        "SEPARATE"
      ],
      [
        "COURAGE",
        "FEAR"
      ],
      [
        "RARE",
        "COMMON"
      ],
      [
        "CERTAIN",
        "DOUBTFUL"
      ]
    ],
    "spare": "SILVER"
  },
  {
    "id": "spare-091",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ],
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "PRESENT",
        "ABSENT"
      ],
      [
        "INCREASE",
        "DECREASE"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-092",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FUTURE",
        "PAST"
      ],
      [
        "VICTORY",
        "DEFEAT"
      ],
      [
        "OPAQUE",
        "TRANSPARENT"
      ],
      [
        "REWARD",
        "PUNISHMENT"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-093",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "HONEST",
        "DECEITFUL"
      ],
      [
        "BUY",
        "SELL"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-094",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SHALLOW",
        "DEEP"
      ],
      [
        "OBEDIENT",
        "DEFIANT"
      ],
      [
        "COURAGE",
        "FEAR"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-095",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RARE",
        "COMMON"
      ],
      [
        "EAST",
        "WEST"
      ],
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "PROFIT",
        "LOSS"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-096",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FRESH",
        "STALE"
      ],
      [
        "GENTLE",
        "HARSH"
      ],
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "SIMPLE",
        "COMPLEX"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-097",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RESIST",
        "YIELD"
      ],
      [
        "STEEP",
        "GRADUAL"
      ],
      [
        "MELT",
        "FREEZE"
      ],
      [
        "SUCCESS",
        "FAILURE"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-098",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BRAVERY",
        "COWARDICE"
      ],
      [
        "SHRINK",
        "GROW"
      ],
      [
        "ACCEPT",
        "REJECT"
      ],
      [
        "ORDINARY",
        "UNUSUAL"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-099",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "TIMID",
        "BOLD"
      ],
      [
        "INNOCENT",
        "GUILTY"
      ],
      [
        "ALIVE",
        "DEAD"
      ],
      [
        "BEGIN",
        "END"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-100",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ENEMY",
        "ALLY"
      ],
      [
        "EMPTY",
        "FULL"
      ],
      [
        "ANCIENT",
        "MODERN"
      ],
      [
        "MODEST",
        "ARROGANT"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-101",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LEADER",
        "FOLLOWER"
      ],
      [
        "PLENTIFUL",
        "SPARSE"
      ],
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "LENGTHEN",
        "SHORTEN"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-102",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "HUMBLE",
        "PROUD"
      ],
      [
        "DRY",
        "WET"
      ],
      [
        "POLITE",
        "RUDE"
      ],
      [
        "GENEROUS",
        "STINGY"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-103",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FLOURISH",
        "WITHER"
      ],
      [
        "ASCEND",
        "DESCEND"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ],
      [
        "MAXIMUM",
        "MINIMUM"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-104",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FRAGILE",
        "STURDY"
      ],
      [
        "MAJOR",
        "MINOR"
      ],
      [
        "EXTERIOR",
        "INTERIOR"
      ],
      [
        "VISIBLE",
        "HIDDEN"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-105",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONFIDENT",
        "UNCERTAIN"
      ],
      [
        "EARLY",
        "LATE"
      ],
      [
        "TAME",
        "WILD"
      ],
      [
        "RAPID",
        "SLOW"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-106",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PROTECT",
        "ENDANGER"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "SUPERIOR",
        "INFERIOR"
      ],
      [
        "WIN",
        "LOSE"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-107",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ARRIVE",
        "DEPART"
      ],
      [
        "UPHILL",
        "DOWNHILL"
      ],
      [
        "FLOAT",
        "SINK"
      ],
      [
        "EAGER",
        "RELUCTANT"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-108",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PRIVATE",
        "PUBLIC"
      ],
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ],
      [
        "WIDE",
        "NARROW"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-109",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BORROW",
        "LEND"
      ],
      [
        "STRENGTH",
        "WEAKNESS"
      ],
      [
        "MATURE",
        "IMMATURE"
      ],
      [
        "INCLUDE",
        "EXCLUDE"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-110",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "DEFICIT",
        "SURPLUS"
      ],
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "DUSK",
        "DAWN"
      ],
      [
        "ADVANCE",
        "RETREAT"
      ]
    ],
    "spare": "BASKET"
  },
  {
    "id": "spare-111",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "DORMANT",
        "ACTIVE"
      ],
      [
        "THRIFT",
        "WASTE"
      ],
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "INNER",
        "OUTER"
      ]
    ],
    "spare": "HARBOR"
  },
  {
    "id": "spare-112",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "MODERATE",
        "EXTREME"
      ],
      [
        "RATIONAL",
        "IRRATIONAL"
      ],
      [
        "INHALE",
        "EXHALE"
      ]
    ],
    "spare": "COBALT"
  },
  {
    "id": "spare-113",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VERTICAL",
        "HORIZONTAL"
      ],
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "COMBINE",
        "SEPARATE"
      ]
    ],
    "spare": "ACORN"
  },
  {
    "id": "spare-114",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "REVEAL",
        "CONCEAL"
      ],
      [
        "LEGAL",
        "ILLEGAL"
      ],
      [
        "CERTAIN",
        "DOUBTFUL"
      ],
      [
        "TEMPORARY",
        "PERMANENT"
      ]
    ],
    "spare": "GALAXY"
  },
  {
    "id": "spare-115",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "UNITE",
        "DIVIDE"
      ],
      [
        "EXPORT",
        "IMPORT"
      ],
      [
        "COMPULSORY",
        "OPTIONAL"
      ],
      [
        "BROAD",
        "NARROW"
      ]
    ],
    "spare": "CANVAS"
  },
  {
    "id": "spare-116",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OPTIMIST",
        "PESSIMIST"
      ],
      [
        "SMOOTH",
        "ROUGH"
      ],
      [
        "OPEN",
        "CLOSED"
      ],
      [
        "ALLOW",
        "FORBID"
      ]
    ],
    "spare": "VIOLIN"
  },
  {
    "id": "spare-117",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "APPROVE",
        "DISAPPROVE"
      ],
      [
        "LOOSE",
        "TIGHT"
      ],
      [
        "OPTIMISTIC",
        "PESSIMISTIC"
      ],
      [
        "SOUR",
        "SWEET"
      ]
    ],
    "spare": "NEEDLE"
  },
  {
    "id": "spare-118",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "ABUNDANT",
        "SCARCE"
      ],
      [
        "BITTER",
        "SWEET"
      ],
      [
        "PEACE",
        "WAR"
      ]
    ],
    "spare": "TURTLE"
  },
  {
    "id": "spare-119",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "NOISY",
        "SILENT"
      ],
      [
        "PUSH",
        "PULL"
      ],
      [
        "VACANT",
        "OCCUPIED"
      ],
      [
        "LITERAL",
        "FIGURATIVE"
      ]
    ],
    "spare": "WAFFLE"
  },
  {
    "id": "spare-120",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LAZY",
        "DILIGENT"
      ],
      [
        "FINITE",
        "INFINITE"
      ],
      [
        "CAUTIOUS",
        "RECKLESS"
      ],
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ]
    ],
    "spare": "SILVER"
  },
  {
    "id": "spare-121",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "STRENGTH",
        "WEAKNESS"
      ],
      [
        "OPTIMIST",
        "PESSIMIST"
      ],
      [
        "APPROVE",
        "DISAPPROVE"
      ],
      [
        "INCLUDE",
        "EXCLUDE"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-122",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PRIVATE",
        "PUBLIC"
      ],
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ],
      [
        "DORMANT",
        "ACTIVE"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-123",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MAXIMUM",
        "MINIMUM"
      ],
      [
        "DEFICIT",
        "SURPLUS"
      ],
      [
        "RARE",
        "COMMON"
      ],
      [
        "EMPTY",
        "FULL"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-124",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MELT",
        "FREEZE"
      ],
      [
        "CERTAIN",
        "DOUBTFUL"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "BROAD",
        "NARROW"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-125",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BRAVERY",
        "COWARDICE"
      ],
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ],
      [
        "ENEMY",
        "ALLY"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-126",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "REWARD",
        "PUNISHMENT"
      ],
      [
        "COURAGE",
        "FEAR"
      ],
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "FLOURISH",
        "WITHER"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-127",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "WIDE",
        "NARROW"
      ],
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "PROFIT",
        "LOSS"
      ],
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-128",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "COMBINE",
        "SEPARATE"
      ],
      [
        "FRAGILE",
        "STURDY"
      ],
      [
        "VACANT",
        "OCCUPIED"
      ],
      [
        "MAJOR",
        "MINOR"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-129",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BEGIN",
        "END"
      ],
      [
        "EAGER",
        "RELUCTANT"
      ],
      [
        "DRY",
        "WET"
      ],
      [
        "FINITE",
        "INFINITE"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-130",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "WIN",
        "LOSE"
      ],
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "LITERAL",
        "FIGURATIVE"
      ],
      [
        "RESIST",
        "YIELD"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-131",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "UNITE",
        "DIVIDE"
      ],
      [
        "PUSH",
        "PULL"
      ],
      [
        "THRIFT",
        "WASTE"
      ],
      [
        "COMPULSORY",
        "OPTIONAL"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-132",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "VISIBLE",
        "HIDDEN"
      ],
      [
        "MODERATE",
        "EXTREME"
      ],
      [
        "INNER",
        "OUTER"
      ],
      [
        "UPHILL",
        "DOWNHILL"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-133",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EARLY",
        "LATE"
      ],
      [
        "PRESENT",
        "ABSENT"
      ],
      [
        "SUPERIOR",
        "INFERIOR"
      ],
      [
        "LAZY",
        "DILIGENT"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-134",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PROTECT",
        "ENDANGER"
      ],
      [
        "CAUTIOUS",
        "RECKLESS"
      ],
      [
        "LEGAL",
        "ILLEGAL"
      ],
      [
        "ARRIVE",
        "DEPART"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-135",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OPEN",
        "CLOSED"
      ],
      [
        "VERTICAL",
        "HORIZONTAL"
      ],
      [
        "EXPORT",
        "IMPORT"
      ],
      [
        "POLITE",
        "RUDE"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-136",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PEACE",
        "WAR"
      ],
      [
        "TEMPORARY",
        "PERMANENT"
      ],
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "INNOCENT",
        "GUILTY"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-137",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "BUY",
        "SELL"
      ],
      [
        "LOOSE",
        "TIGHT"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-138",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ALIVE",
        "DEAD"
      ],
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "TIMID",
        "BOLD"
      ],
      [
        "OPTIMISTIC",
        "PESSIMISTIC"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-139",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "HONEST",
        "DECEITFUL"
      ],
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "DUSK",
        "DAWN"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-140",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SOUR",
        "SWEET"
      ],
      [
        "HUMBLE",
        "PROUD"
      ],
      [
        "REVEAL",
        "CONCEAL"
      ],
      [
        "VICTORY",
        "DEFEAT"
      ]
    ],
    "spare": "BASKET"
  },
  {
    "id": "spare-141",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FUTURE",
        "PAST"
      ],
      [
        "OBEDIENT",
        "DEFIANT"
      ],
      [
        "EAST",
        "WEST"
      ],
      [
        "SMOOTH",
        "ROUGH"
      ]
    ],
    "spare": "HARBOR"
  },
  {
    "id": "spare-142",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BITTER",
        "SWEET"
      ],
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ],
      [
        "RAPID",
        "SLOW"
      ]
    ],
    "spare": "COBALT"
  },
  {
    "id": "spare-143",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SUCCESS",
        "FAILURE"
      ],
      [
        "ADVANCE",
        "RETREAT"
      ],
      [
        "TAME",
        "WILD"
      ],
      [
        "GENTLE",
        "HARSH"
      ]
    ],
    "spare": "ACORN"
  },
  {
    "id": "spare-144",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SHALLOW",
        "DEEP"
      ],
      [
        "NOISY",
        "SILENT"
      ],
      [
        "ABUNDANT",
        "SCARCE"
      ],
      [
        "LEADER",
        "FOLLOWER"
      ]
    ],
    "spare": "GALAXY"
  },
  {
    "id": "spare-145",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OPAQUE",
        "TRANSPARENT"
      ],
      [
        "ORDINARY",
        "UNUSUAL"
      ],
      [
        "ANCIENT",
        "MODERN"
      ],
      [
        "MATURE",
        "IMMATURE"
      ]
    ],
    "spare": "CANVAS"
  },
  {
    "id": "spare-146",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LENGTHEN",
        "SHORTEN"
      ],
      [
        "BORROW",
        "LEND"
      ],
      [
        "PLENTIFUL",
        "SPARSE"
      ],
      [
        "RATIONAL",
        "IRRATIONAL"
      ]
    ],
    "spare": "VIOLIN"
  },
  {
    "id": "spare-147",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ASCEND",
        "DESCEND"
      ],
      [
        "ACCEPT",
        "REJECT"
      ],
      [
        "SIMPLE",
        "COMPLEX"
      ],
      [
        "INHALE",
        "EXHALE"
      ]
    ],
    "spare": "NEEDLE"
  },
  {
    "id": "spare-148",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ALLOW",
        "FORBID"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ],
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "STEEP",
        "GRADUAL"
      ]
    ],
    "spare": "TURTLE"
  },
  {
    "id": "spare-149",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SHRINK",
        "GROW"
      ],
      [
        "EXTERIOR",
        "INTERIOR"
      ],
      [
        "GENEROUS",
        "STINGY"
      ],
      [
        "FRESH",
        "STALE"
      ]
    ],
    "spare": "WAFFLE"
  },
  {
    "id": "spare-150",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONFIDENT",
        "UNCERTAIN"
      ],
      [
        "FLOAT",
        "SINK"
      ],
      [
        "MODEST",
        "ARROGANT"
      ],
      [
        "INCREASE",
        "DECREASE"
      ]
    ],
    "spare": "SILVER"
  },
  {
    "id": "spare-151",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BROAD",
        "NARROW"
      ],
      [
        "OPTIMIST",
        "PESSIMIST"
      ],
      [
        "ABUNDANT",
        "SCARCE"
      ],
      [
        "INNOCENT",
        "GUILTY"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-152",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LEGAL",
        "ILLEGAL"
      ],
      [
        "FINITE",
        "INFINITE"
      ],
      [
        "ADVANCE",
        "RETREAT"
      ],
      [
        "INCLUDE",
        "EXCLUDE"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-153",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "WIDE",
        "NARROW"
      ],
      [
        "PEACE",
        "WAR"
      ],
      [
        "PUSH",
        "PULL"
      ],
      [
        "POLITE",
        "RUDE"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-154",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EARLY",
        "LATE"
      ],
      [
        "PRESENT",
        "ABSENT"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-155",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "STEEP",
        "GRADUAL"
      ],
      [
        "APPROVE",
        "DISAPPROVE"
      ],
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "BITTER",
        "SWEET"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-156",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PROTECT",
        "ENDANGER"
      ],
      [
        "MODERATE",
        "EXTREME"
      ],
      [
        "RARE",
        "COMMON"
      ],
      [
        "UPHILL",
        "DOWNHILL"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-157",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "ASCEND",
        "DESCEND"
      ],
      [
        "INNER",
        "OUTER"
      ],
      [
        "VACANT",
        "OCCUPIED"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-158",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LITERAL",
        "FIGURATIVE"
      ],
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "OPTIMISTIC",
        "PESSIMISTIC"
      ],
      [
        "FRAGILE",
        "STURDY"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-159",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ARRIVE",
        "DEPART"
      ],
      [
        "REWARD",
        "PUNISHMENT"
      ],
      [
        "WIN",
        "LOSE"
      ],
      [
        "LOOSE",
        "TIGHT"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-160",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PRIVATE",
        "PUBLIC"
      ],
      [
        "OBEDIENT",
        "DEFIANT"
      ],
      [
        "TEMPORARY",
        "PERMANENT"
      ],
      [
        "SHALLOW",
        "DEEP"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-161",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXPORT",
        "IMPORT"
      ],
      [
        "DUSK",
        "DAWN"
      ],
      [
        "ENEMY",
        "ALLY"
      ],
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-162",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "COURAGE",
        "FEAR"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ],
      [
        "PROFIT",
        "LOSS"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-163",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EMPTY",
        "FULL"
      ],
      [
        "CERTAIN",
        "DOUBTFUL"
      ],
      [
        "HUMBLE",
        "PROUD"
      ],
      [
        "SIMPLE",
        "COMPLEX"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-164",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "GENTLE",
        "HARSH"
      ],
      [
        "BRAVERY",
        "COWARDICE"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-165",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BUY",
        "SELL"
      ],
      [
        "DEFICIT",
        "SURPLUS"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ],
      [
        "ACCEPT",
        "REJECT"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-166",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LENGTHEN",
        "SHORTEN"
      ],
      [
        "FLOURISH",
        "WITHER"
      ],
      [
        "ANCIENT",
        "MODERN"
      ],
      [
        "VISIBLE",
        "HIDDEN"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-167",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONFIDENT",
        "UNCERTAIN"
      ],
      [
        "NOISY",
        "SILENT"
      ],
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "DRY",
        "WET"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-168",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "UNITE",
        "DIVIDE"
      ],
      [
        "TIMID",
        "BOLD"
      ],
      [
        "VICTORY",
        "DEFEAT"
      ],
      [
        "MAJOR",
        "MINOR"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-169",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SUPERIOR",
        "INFERIOR"
      ],
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "RAPID",
        "SLOW"
      ],
      [
        "SUCCESS",
        "FAILURE"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-170",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MELT",
        "FREEZE"
      ],
      [
        "ORDINARY",
        "UNUSUAL"
      ],
      [
        "CAUTIOUS",
        "RECKLESS"
      ],
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ]
    ],
    "spare": "BASKET"
  },
  {
    "id": "spare-171",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "FLOAT",
        "SINK"
      ],
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ]
    ],
    "spare": "HARBOR"
  },
  {
    "id": "spare-172",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "GENEROUS",
        "STINGY"
      ],
      [
        "SMOOTH",
        "ROUGH"
      ],
      [
        "FUTURE",
        "PAST"
      ]
    ],
    "spare": "COBALT"
  },
  {
    "id": "spare-173",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "SOUR",
        "SWEET"
      ],
      [
        "REVEAL",
        "CONCEAL"
      ],
      [
        "BEGIN",
        "END"
      ],
      [
        "LEADER",
        "FOLLOWER"
      ]
    ],
    "spare": "ACORN"
  },
  {
    "id": "spare-174",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "OPEN",
        "CLOSED"
      ],
      [
        "COMPULSORY",
        "OPTIONAL"
      ],
      [
        "RATIONAL",
        "IRRATIONAL"
      ],
      [
        "SHRINK",
        "GROW"
      ]
    ],
    "spare": "GALAXY"
  },
  {
    "id": "spare-175",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "DORMANT",
        "ACTIVE"
      ],
      [
        "INCREASE",
        "DECREASE"
      ],
      [
        "LAZY",
        "DILIGENT"
      ],
      [
        "STRENGTH",
        "WEAKNESS"
      ]
    ],
    "spare": "CANVAS"
  },
  {
    "id": "spare-176",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EAGER",
        "RELUCTANT"
      ],
      [
        "VERTICAL",
        "HORIZONTAL"
      ],
      [
        "EXTERIOR",
        "INTERIOR"
      ],
      [
        "ALIVE",
        "DEAD"
      ]
    ],
    "spare": "VIOLIN"
  },
  {
    "id": "spare-177",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "PLENTIFUL",
        "SPARSE"
      ],
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "INHALE",
        "EXHALE"
      ],
      [
        "OPAQUE",
        "TRANSPARENT"
      ]
    ],
    "spare": "NEEDLE"
  },
  {
    "id": "spare-178",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "MATURE",
        "IMMATURE"
      ],
      [
        "MODEST",
        "ARROGANT"
      ],
      [
        "FRESH",
        "STALE"
      ],
      [
        "MAXIMUM",
        "MINIMUM"
      ]
    ],
    "spare": "TURTLE"
  },
  {
    "id": "spare-179",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "ALLOW",
        "FORBID"
      ],
      [
        "EAST",
        "WEST"
      ],
      [
        "BORROW",
        "LEND"
      ],
      [
        "TAME",
        "WILD"
      ]
    ],
    "spare": "WAFFLE"
  },
  {
    "id": "spare-180",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "THRIFT",
        "WASTE"
      ],
      [
        "COMBINE",
        "SEPARATE"
      ],
      [
        "RESIST",
        "YIELD"
      ],
      [
        "HONEST",
        "DECEITFUL"
      ]
    ],
    "spare": "SILVER"
  },
  {
    "id": "spare-181",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FINITE",
        "INFINITE"
      ],
      [
        "POLITE",
        "RUDE"
      ],
      [
        "INNER",
        "OUTER"
      ],
      [
        "COURAGE",
        "FEAR"
      ]
    ],
    "spare": "COMPASS"
  },
  {
    "id": "spare-182",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "BEFORE",
        "AFTER"
      ],
      [
        "CERTAIN",
        "DOUBTFUL"
      ],
      [
        "OPEN",
        "CLOSED"
      ],
      [
        "BITTER",
        "SWEET"
      ]
    ],
    "spare": "RIBBON"
  },
  {
    "id": "spare-183",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "RIGID",
        "FLEXIBLE"
      ],
      [
        "BRAVERY",
        "COWARDICE"
      ],
      [
        "ENCOURAGE",
        "DISCOURAGE"
      ],
      [
        "HONEST",
        "DECEITFUL"
      ]
    ],
    "spare": "MEADOW"
  },
  {
    "id": "spare-184",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FREEDOM",
        "CAPTIVITY"
      ],
      [
        "EARLY",
        "LATE"
      ],
      [
        "ASCEND",
        "DESCEND"
      ],
      [
        "DEFICIT",
        "SURPLUS"
      ]
    ],
    "spare": "TEAPOT"
  },
  {
    "id": "spare-185",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EAST",
        "WEST"
      ],
      [
        "RARE",
        "COMMON"
      ],
      [
        "VACANT",
        "OCCUPIED"
      ],
      [
        "OPTIMIST",
        "PESSIMIST"
      ]
    ],
    "spare": "ANCHOR"
  },
  {
    "id": "spare-186",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "CONVEX",
        "CONCAVE"
      ],
      [
        "ARRIVAL",
        "DEPARTURE"
      ],
      [
        "RESIST",
        "YIELD"
      ],
      [
        "VERTICAL",
        "HORIZONTAL"
      ]
    ],
    "spare": "THIMBLE"
  },
  {
    "id": "spare-187",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LOOSE",
        "TIGHT"
      ],
      [
        "LEADER",
        "FOLLOWER"
      ],
      [
        "BEGIN",
        "END"
      ],
      [
        "ACCEPT",
        "REJECT"
      ]
    ],
    "spare": "PENCIL"
  },
  {
    "id": "spare-188",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "INNOCENT",
        "GUILTY"
      ],
      [
        "SOUR",
        "SWEET"
      ],
      [
        "VANISH",
        "APPEAR"
      ],
      [
        "EAGER",
        "RELUCTANT"
      ]
    ],
    "spare": "KETTLE"
  },
  {
    "id": "spare-189",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "DORMANT",
        "ACTIVE"
      ],
      [
        "SOLID",
        "LIQUID"
      ],
      [
        "COMBINE",
        "SEPARATE"
      ],
      [
        "VISIBLE",
        "HIDDEN"
      ]
    ],
    "spare": "CANYON"
  },
  {
    "id": "spare-190",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "REPAIR",
        "DAMAGE"
      ],
      [
        "DUSK",
        "DAWN"
      ],
      [
        "MAJOR",
        "MINOR"
      ],
      [
        "SUPERIOR",
        "INFERIOR"
      ]
    ],
    "spare": "BUTTON"
  },
  {
    "id": "spare-191",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "DELIBERATE",
        "ACCIDENTAL"
      ],
      [
        "ALLOW",
        "FORBID"
      ],
      [
        "INCREASE",
        "DECREASE"
      ],
      [
        "PLENTIFUL",
        "SPARSE"
      ]
    ],
    "spare": "LANTERN"
  },
  {
    "id": "spare-192",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "WIDE",
        "NARROW"
      ],
      [
        "HUMBLE",
        "PROUD"
      ],
      [
        "FUTURE",
        "PAST"
      ],
      [
        "PROFIT",
        "LOSS"
      ]
    ],
    "spare": "PEBBLE"
  },
  {
    "id": "spare-193",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FRAGILE",
        "STURDY"
      ],
      [
        "TRIUMPH",
        "DEFEAT"
      ],
      [
        "MELT",
        "FREEZE"
      ],
      [
        "ACCURATE",
        "INACCURATE"
      ]
    ],
    "spare": "TRUMPET"
  },
  {
    "id": "spare-194",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "GENTLE",
        "HARSH"
      ],
      [
        "BORROW",
        "LEND"
      ],
      [
        "CREATE",
        "DESTROY"
      ],
      [
        "COMPULSORY",
        "OPTIONAL"
      ]
    ],
    "spare": "SADDLE"
  },
  {
    "id": "spare-195",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "GENEROUS",
        "STINGY"
      ],
      [
        "BROAD",
        "NARROW"
      ],
      [
        "MODEST",
        "ARROGANT"
      ],
      [
        "EXPORT",
        "IMPORT"
      ]
    ],
    "spare": "ORCHARD"
  },
  {
    "id": "spare-196",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "AUTHENTIC",
        "COUNTERFEIT"
      ],
      [
        "SECURE",
        "VULNERABLE"
      ],
      [
        "RAPID",
        "SLOW"
      ],
      [
        "INHALE",
        "EXHALE"
      ]
    ],
    "spare": "WINDOW"
  },
  {
    "id": "spare-197",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "NATIVE",
        "FOREIGN"
      ],
      [
        "LAZY",
        "DILIGENT"
      ],
      [
        "PATIENCE",
        "IMPATIENCE"
      ],
      [
        "STRENGTH",
        "WEAKNESS"
      ]
    ],
    "spare": "SPARROW"
  },
  {
    "id": "spare-198",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "LITERAL",
        "FIGURATIVE"
      ],
      [
        "BUY",
        "SELL"
      ],
      [
        "EXPAND",
        "CONTRACT"
      ],
      [
        "EMPTY",
        "FULL"
      ]
    ],
    "spare": "BUCKET"
  },
  {
    "id": "spare-199",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "EXTERIOR",
        "INTERIOR"
      ],
      [
        "ALIVE",
        "DEAD"
      ],
      [
        "ADVANCE",
        "RETREAT"
      ],
      [
        "REWARD",
        "PUNISHMENT"
      ]
    ],
    "spare": "MARBLE"
  },
  {
    "id": "spare-200",
    "prompt": "Find four pairs with opposite meanings. One word has no partner.",
    "pairs": [
      [
        "FLEXIBLE",
        "INFLEXIBLE"
      ],
      [
        "UNITE",
        "DIVIDE"
      ],
      [
        "MAXIMUM",
        "MINIMUM"
      ],
      [
        "REVEAL",
        "CONCEAL"
      ]
    ],
    "spare": "BASKET"
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 200,
  "curatedAntonymPairs": 120,
  "neutralSpareWords": 30,
  "maxSharedPairsPerAddedBoard": 2
});
