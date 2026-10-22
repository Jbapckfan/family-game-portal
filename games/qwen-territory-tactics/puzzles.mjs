// Prepared static positions. Every position is independently checked by the game solver.
const ORIGINAL_PUZZLES = [
  {
    "id": "territory-01",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-1,0",
      "0,2",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "0,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-02",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "0,-2",
      "0,1",
      "1,-2",
      "2,0"
    ],
    "enemy": [
      "0,0",
      "1,-1",
      "2,-2",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-03",
    "radius": 2,
    "friendly": [
      "-2,2",
      "-1,1",
      "1,0"
    ],
    "enemy": [
      "-1,2",
      "0,1",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-04",
    "radius": 2,
    "friendly": [
      "-1,0",
      "1,-1",
      "2,-2"
    ],
    "enemy": [
      "-2,0",
      "-1,-1",
      "0,-2",
      "1,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-05",
    "radius": 2,
    "friendly": [
      "-2,0",
      "-1,0",
      "0,0",
      "1,-2",
      "2,-2",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "0,-1",
      "1,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-06",
    "radius": 2,
    "friendly": [
      "-2,0",
      "0,0",
      "0,1",
      "1,0"
    ],
    "enemy": [
      "-2,1",
      "-2,2",
      "-1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-07",
    "radius": 2,
    "friendly": [
      "0,-2",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "1,-2",
      "2,-2",
      "2,-1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-08",
    "radius": 2,
    "friendly": [
      "-2,2",
      "-1,1",
      "0,-1",
      "0,1",
      "2,-2"
    ],
    "enemy": [
      "-2,0",
      "-2,1",
      "-1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-09",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,2",
      "0,-2",
      "1,0",
      "2,-2",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "0,-1",
      "0,0",
      "1,-2",
      "1,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-10",
    "radius": 2,
    "friendly": [
      "-2,2",
      "-1,0",
      "-1,2",
      "0,1",
      "1,1"
    ],
    "enemy": [
      "-2,0",
      "-2,1",
      "-1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-11",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-1,-1",
      "-1,1",
      "-1,2",
      "0,0",
      "0,2",
      "1,-1",
      "1,1"
    ],
    "enemy": [
      "0,-2",
      "0,-1",
      "1,-2",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-12",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-2,2",
      "-1,-1",
      "-1,2",
      "0,-1",
      "0,0",
      "1,0",
      "1,1",
      "2,-2"
    ],
    "enemy": [
      "-1,0",
      "-1,1",
      "0,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-13",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-1,2",
      "0,-2",
      "1,-1",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "0,-1",
      "0,0",
      "0,1",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-14",
    "radius": 2,
    "friendly": [
      "-2,2",
      "-1,-1",
      "-1,0",
      "-1,1",
      "0,-2",
      "0,1",
      "1,1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "0,0",
      "1,0",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-15",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "0,2",
      "1,0"
    ],
    "enemy": [
      "-2,0",
      "-2,1",
      "-2,2",
      "-1,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-16",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,0",
      "1,0"
    ],
    "enemy": [
      "0,1",
      "0,2",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-17",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-2,2",
      "-1,2",
      "0,-1",
      "0,0",
      "0,1"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "0,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-18",
    "radius": 2,
    "friendly": [
      "-2,2",
      "-1,0",
      "-1,1",
      "0,-1",
      "0,1",
      "1,1",
      "2,-2",
      "2,-1"
    ],
    "enemy": [
      "0,0",
      "1,-1",
      "1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-19",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,0",
      "1,-2",
      "1,0"
    ],
    "enemy": [
      "-2,0",
      "-1,-1",
      "-1,0",
      "0,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-20",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-1,2",
      "0,-1",
      "2,-1"
    ],
    "enemy": [
      "-2,1",
      "-2,2",
      "-1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-21",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-1,-1",
      "-1,1",
      "0,0",
      "0,1",
      "2,-2"
    ],
    "enemy": [
      "-1,0",
      "0,-2",
      "0,-1",
      "1,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-22",
    "radius": 2,
    "friendly": [
      "-2,2",
      "0,0",
      "0,1",
      "1,-2",
      "2,-1"
    ],
    "enemy": [
      "1,0",
      "1,1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-23",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-2,2",
      "-1,-1",
      "-1,0",
      "1,-1",
      "1,0",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "0,1",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-24",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-2,2",
      "-1,0",
      "0,2",
      "1,-2",
      "1,1",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "0,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-25",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,0",
      "0,2",
      "1,1"
    ],
    "enemy": [
      "-2,2",
      "-1,1",
      "-1,2",
      "0,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-26",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-1",
      "0,0",
      "0,1"
    ],
    "enemy": [
      "-2,0",
      "-1,-1",
      "-1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-27",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "0,0",
      "1,-1",
      "1,1",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "0,1",
      "0,2",
      "1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-28",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-2",
      "1,-1",
      "2,0"
    ],
    "enemy": [
      "1,-2",
      "2,-2",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-29",
    "radius": 2,
    "friendly": [
      "-2,0",
      "-2,2",
      "-1,1",
      "0,-2",
      "0,0",
      "1,0",
      "2,-2",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-2,1",
      "-1,0",
      "0,-1",
      "1,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-30",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "0,-2",
      "0,-1",
      "0,0",
      "0,1",
      "1,-2",
      "1,1"
    ],
    "enemy": [
      "1,-1",
      "1,0",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  }
];

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// The first thirty records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "territory-031",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-2,2",
      "1,-1",
      "1,0",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "0,1",
      "1,1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-032",
    "radius": 2,
    "friendly": [
      "-2,1",
      "-2,2",
      "0,-1",
      "0,0",
      "0,1",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "-2,0",
      "1,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-033",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "1,-1",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "0,-1",
      "0,-2",
      "0,0",
      "2,-1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-034",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "0,2",
      "1,-1",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "-1,2",
      "-2,1",
      "-2,2",
      "0,1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-035",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,2",
      "0,-1",
      "0,0",
      "1,0",
      "1,1",
      "2,-1"
    ],
    "enemy": [
      "-1,1",
      "-2,2",
      "0,1",
      "1,-1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-036",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "0,-1",
      "1,-1",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-2,0",
      "-2,1",
      "0,0",
      "0,1",
      "0,2",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-037",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,1",
      "0,0",
      "0,1",
      "1,1"
    ],
    "enemy": [
      "-2,2",
      "1,0",
      "2,-1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-038",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,0",
      "0,-1",
      "0,0",
      "0,2",
      "1,0",
      "2,-2"
    ],
    "enemy": [
      "-2,1",
      "-2,2",
      "1,-1",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-039",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-2,1",
      "0,-1",
      "0,0",
      "0,2",
      "1,1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "0,1",
      "1,0",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-040",
    "radius": 2,
    "friendly": [
      "-2,0",
      "0,0",
      "0,1",
      "1,-1",
      "1,-2"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "0,-1",
      "0,-2",
      "0,2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-041",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,2",
      "-2,2",
      "0,-2",
      "0,2",
      "1,0",
      "1,1",
      "2,-1"
    ],
    "enemy": [
      "-1,1",
      "0,-1",
      "0,1",
      "1,-2",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-042",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-2,1",
      "0,0",
      "0,2",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "-2,2",
      "0,-1",
      "1,-2",
      "2,-1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-043",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,0",
      "-2,1",
      "-2,2",
      "0,-1",
      "0,0",
      "1,-1"
    ],
    "enemy": [
      "-1,-1",
      "-1,1",
      "0,-2",
      "1,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-044",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,2",
      "1,-1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-2,1",
      "-2,2",
      "0,1",
      "0,2",
      "1,0",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-045",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-1,2",
      "-2,0",
      "0,-1",
      "0,2",
      "1,-2",
      "1,0"
    ],
    "enemy": [
      "-1,-1",
      "0,-2",
      "0,1",
      "1,1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-046",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,2",
      "0,-1",
      "1,-1"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "0,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-047",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,2",
      "0,0",
      "0,2",
      "1,-1",
      "1,0",
      "1,1",
      "2,-2"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "0,-2",
      "0,1",
      "1,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-048",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-2,0",
      "0,-1",
      "0,0",
      "0,2",
      "1,0"
    ],
    "enemy": [
      "-1,-1",
      "0,-2",
      "0,1",
      "1,-2",
      "1,1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-049",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,0",
      "-2,1",
      "0,-1",
      "0,1"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "-2,2",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-050",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,1",
      "1,-1",
      "1,1",
      "2,-1"
    ],
    "enemy": [
      "-1,2",
      "-2,1",
      "-2,2",
      "0,2",
      "1,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-051",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,0",
      "1,-2",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "0,-1",
      "0,-2",
      "2,-1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-052",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "0,-1",
      "0,1",
      "2,-1"
    ],
    "enemy": [
      "-1,0",
      "-1,1",
      "-1,2",
      "-2,2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-053",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-1,2",
      "0,-1",
      "1,-1",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "-2,0",
      "-2,1",
      "0,1",
      "1,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-054",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-1,2",
      "0,-1",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "0,-2",
      "0,1",
      "0,2",
      "1,1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-055",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,1",
      "0,-1",
      "0,-2",
      "0,0",
      "0,2",
      "1,1"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "-2,2",
      "0,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-056",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-2,1",
      "0,-1",
      "0,1",
      "1,-2",
      "1,0"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "0,-2",
      "0,0",
      "1,1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-057",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-2,2",
      "0,0",
      "1,-2",
      "1,0",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "1,-1",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-058",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-1",
      "0,1",
      "1,-1",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "0,-2",
      "1,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-059",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "-2,2",
      "0,1",
      "1,0",
      "2,-1",
      "2,-2"
    ],
    "enemy": [
      "-1,2",
      "0,-1",
      "0,0",
      "0,2",
      "1,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-060",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-1,2",
      "0,-1",
      "0,2",
      "1,-1",
      "1,-2",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "0,-2",
      "0,1",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-061",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "0,0",
      "1,-1",
      "2,-2"
    ],
    "enemy": [
      "-2,0",
      "1,0",
      "2,-1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-062",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-2",
      "0,0",
      "0,1"
    ],
    "enemy": [
      "-1,-1",
      "-1,1",
      "-1,2",
      "-2,0",
      "-2,2",
      "0,2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-063",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,1",
      "0,2",
      "1,-1",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "-2,2",
      "1,-2",
      "2,-1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-064",
    "radius": 2,
    "friendly": [
      "-2,0",
      "-2,1",
      "-2,2",
      "0,-2",
      "0,0",
      "0,1",
      "1,-1",
      "1,-2",
      "1,0"
    ],
    "enemy": [
      "-1,0",
      "-1,1",
      "-1,2",
      "0,-1",
      "2,-1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-065",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-1",
      "0,-2",
      "0,1",
      "0,2",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "1,0",
      "1,1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-066",
    "radius": 2,
    "friendly": [
      "0,-1",
      "0,0",
      "0,1",
      "1,0"
    ],
    "enemy": [
      "0,-2",
      "0,2",
      "1,-1",
      "1,-2",
      "1,1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-067",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-2,0",
      "0,-2",
      "0,0",
      "0,2",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "0,1",
      "1,1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-068",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,0",
      "0,1",
      "0,2",
      "1,1",
      "2,-1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "0,-1",
      "1,-1",
      "1,-2",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-069",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-2",
      "0,0",
      "0,1",
      "1,1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "-2,0",
      "1,0",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-070",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "0,0",
      "1,-2"
    ],
    "enemy": [
      "-1,1",
      "-2,0",
      "-2,1",
      "-2,2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-071",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,2",
      "0,1",
      "1,-1",
      "1,-2"
    ],
    "enemy": [
      "-2,1",
      "-2,2",
      "0,-1",
      "0,-2",
      "0,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-072",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-2,1",
      "-2,2",
      "0,-1",
      "0,0",
      "0,1",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "-1,0",
      "-1,1",
      "-1,2",
      "0,2",
      "2,-1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-073",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,1",
      "-2,2",
      "0,0",
      "1,0"
    ],
    "enemy": [
      "-1,1",
      "0,1",
      "0,2",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-074",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "0,-1",
      "0,0",
      "0,2",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "-2,2",
      "0,-2",
      "0,1",
      "1,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-075",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-2,1",
      "0,0",
      "0,1",
      "1,-2",
      "1,1",
      "2,-2"
    ],
    "enemy": [
      "-1,2",
      "-2,2",
      "1,-1",
      "2,-1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-076",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,1",
      "-2,2",
      "0,-1",
      "0,-2",
      "0,0",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "0,1",
      "0,2",
      "1,-2",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-077",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,-1",
      "0,1",
      "1,-1",
      "1,-2",
      "1,1"
    ],
    "enemy": [
      "-1,-1",
      "0,-2",
      "1,0",
      "2,-1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-078",
    "radius": 2,
    "friendly": [
      "-1,0",
      "1,-1",
      "1,-2",
      "1,0",
      "2,-2"
    ],
    "enemy": [
      "0,-1",
      "0,-2",
      "0,2",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-079",
    "radius": 2,
    "friendly": [
      "-2,0",
      "-2,1",
      "0,-1",
      "0,0",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "-1,0",
      "-1,2",
      "0,1",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-080",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "0,-1",
      "0,-2",
      "0,0",
      "0,1",
      "0,2",
      "2,-1"
    ],
    "enemy": [
      "-1,0",
      "-1,2",
      "-2,1",
      "-2,2",
      "1,-1",
      "1,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-081",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "0,-1",
      "0,-2",
      "2,-1",
      "2,-2"
    ],
    "enemy": [
      "-2,0",
      "-2,1",
      "0,0",
      "1,-1",
      "1,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-082",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,0",
      "1,-1",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "0,-1",
      "0,-2",
      "1,-2",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-083",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "0,-1",
      "0,1",
      "1,-1",
      "2,-1"
    ],
    "enemy": [
      "-1,0",
      "0,0",
      "0,2",
      "1,1",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-084",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-2",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "-2,0",
      "-2,2",
      "0,2",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-085",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-1",
      "0,0",
      "0,1",
      "1,1"
    ],
    "enemy": [
      "-1,0",
      "-2,0",
      "-2,1",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-086",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-2,1",
      "0,0",
      "1,-1"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "-2,0",
      "-2,2",
      "0,-1",
      "0,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-087",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-2,0",
      "-2,2",
      "0,0",
      "0,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "-2,1",
      "0,2",
      "1,0",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-088",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,0",
      "-2,1",
      "0,-1",
      "0,-2",
      "0,1",
      "1,-1"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "-1,1",
      "0,0",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-089",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,2",
      "-2,1",
      "0,0",
      "0,2",
      "1,-2",
      "2,-1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "-2,2",
      "1,-1",
      "1,0",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-090",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,2",
      "-2,2",
      "0,0",
      "0,1",
      "1,0",
      "2,-1"
    ],
    "enemy": [
      "-1,1",
      "-2,1",
      "0,-1",
      "1,-1",
      "1,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-091",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "0,-1",
      "1,0",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "-2,1",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-092",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,0",
      "-2,2",
      "0,-1",
      "0,2",
      "1,-1",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,1",
      "-2,1",
      "0,1",
      "1,-2",
      "1,1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-093",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-1,2",
      "-2,1",
      "1,-1",
      "1,-2",
      "1,0",
      "1,1"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "0,-1",
      "0,1",
      "0,2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-094",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "0,2",
      "1,0",
      "2,-1"
    ],
    "enemy": [
      "0,-1",
      "0,-2",
      "1,-1",
      "1,-2",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-095",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "0,-1",
      "0,-2",
      "2,-1",
      "2,-2",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-096",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,0",
      "0,-2",
      "0,0",
      "1,-1"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "-2,1",
      "-2,2",
      "0,-1",
      "1,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-097",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-2,1",
      "0,0",
      "1,-1",
      "1,-2",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "0,-1",
      "0,-2",
      "2,-1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-098",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "0,-2",
      "0,0",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "-1,0",
      "-2,0",
      "-2,1",
      "0,-1",
      "2,-1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-099",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-1,2",
      "0,-1",
      "0,-2",
      "0,1",
      "2,-1",
      "2,-2"
    ],
    "enemy": [
      "0,0",
      "0,2",
      "1,-1",
      "1,-2",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-100",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-2,1",
      "1,-1",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "-2,2",
      "0,-2",
      "0,1",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-101",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-1,2",
      "0,-1",
      "0,2",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "0,-2",
      "0,0",
      "0,1",
      "1,-2",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-102",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "0,0",
      "1,-1",
      "2,-2"
    ],
    "enemy": [
      "-1,0",
      "-2,0",
      "1,0",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-103",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-2,0",
      "-2,2",
      "0,0",
      "0,1",
      "1,-2",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-2,1",
      "1,-1",
      "1,0",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-104",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,-1",
      "0,1",
      "0,2",
      "1,-1",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "0,-2",
      "1,-2",
      "1,0",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-105",
    "radius": 2,
    "friendly": [
      "-1,1",
      "-1,2",
      "0,-2",
      "0,0",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-1,0",
      "-2,0",
      "0,2",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-106",
    "radius": 2,
    "friendly": [
      "-1,2",
      "0,-2",
      "0,0",
      "0,1",
      "1,1",
      "2,-1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-2,2",
      "0,-1",
      "1,-1",
      "1,-2",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-107",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-2,1",
      "-2,2",
      "0,-1",
      "0,1",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "-1,2",
      "-2,0",
      "0,2",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-108",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-1",
      "0,0",
      "0,2",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "-2,0",
      "-2,1",
      "-2,2",
      "1,0",
      "1,1"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-109",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "-2,0",
      "0,-1",
      "0,1",
      "2,-1"
    ],
    "enemy": [
      "-1,-1",
      "0,0",
      "1,0",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-110",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-2,0",
      "0,-1",
      "0,1",
      "2,-1"
    ],
    "enemy": [
      "-1,0",
      "-1,1",
      "-2,1",
      "-2,2",
      "1,-2",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-111",
    "radius": 2,
    "friendly": [
      "-1,0",
      "0,-1",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "-1,-1",
      "-2,0",
      "1,-2",
      "2,-1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-112",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-1",
      "0,-2",
      "0,0",
      "0,2",
      "1,0"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "-2,2",
      "0,1",
      "1,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-113",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,0",
      "-2,1",
      "-2,2",
      "0,-2",
      "0,1",
      "0,2",
      "1,-1"
    ],
    "enemy": [
      "-1,1",
      "-1,2",
      "0,-1",
      "1,-2",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-114",
    "radius": 2,
    "friendly": [
      "-1,0",
      "-1,1",
      "0,2",
      "1,-1",
      "1,-2",
      "1,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "-1,2",
      "-2,2",
      "0,-1",
      "0,-2",
      "0,0",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-115",
    "radius": 2,
    "friendly": [
      "1,-1",
      "1,0",
      "2,-1"
    ],
    "enemy": [
      "0,2",
      "1,1",
      "2,-2",
      "2,0"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-116",
    "radius": 2,
    "friendly": [
      "-1,2",
      "-2,0",
      "0,-1",
      "1,-1",
      "1,0"
    ],
    "enemy": [
      "-1,-1",
      "0,-2",
      "0,2",
      "1,-2",
      "1,1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-117",
    "radius": 2,
    "friendly": [
      "-1,-1",
      "-1,1",
      "-1,2",
      "0,0",
      "1,-1",
      "1,-2",
      "1,0",
      "2,0"
    ],
    "enemy": [
      "-1,0",
      "0,-1",
      "0,-2",
      "0,1",
      "1,1"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-118",
    "radius": 2,
    "friendly": [
      "-2,1",
      "0,-1",
      "0,-2",
      "0,0",
      "0,1",
      "2,0"
    ],
    "enemy": [
      "-2,0",
      "1,-2",
      "1,0",
      "2,-1",
      "2,-2"
    ],
    "target": 4,
    "maxMoves": 2
  },
  {
    "id": "territory-119",
    "radius": 2,
    "friendly": [
      "-1,2",
      "0,-1",
      "0,1",
      "2,-1",
      "2,0"
    ],
    "enemy": [
      "0,2",
      "1,-2",
      "1,0",
      "1,1",
      "2,-2"
    ],
    "target": 3,
    "maxMoves": 2
  },
  {
    "id": "territory-120",
    "radius": 2,
    "friendly": [
      "-1,1",
      "0,-1",
      "0,2",
      "1,-2",
      "1,1",
      "2,-1",
      "2,-2",
      "2,0"
    ],
    "enemy": [
      "-1,-1",
      "-1,2",
      "0,-2",
      "0,1",
      "1,-1",
      "1,0"
    ],
    "target": 4,
    "maxMoves": 2
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 120,
  "hexSymmetryDistinctBoards": 120,
  "addedEnemyConfigurationsDistinctUnderHexSymmetry": 90,
  "addedEnemyGroupsPerBoard": 2,
  "addedTargetGroupSizes": [
    3,
    4
  ],
  "addedDecoyGroupSizes": [
    1,
    2
  ],
  "minimumWinningMovesForAdditions": 2,
  "allAdditionsHaveLegalInsufficientDecoyCaptures": true,
  "allAddedFriendlyStonesBlockAnEnemyLiberty": true
});
