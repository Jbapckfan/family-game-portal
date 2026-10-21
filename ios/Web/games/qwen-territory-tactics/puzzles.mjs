// Prepared static positions. Every position is independently checked by the game solver.
export const PUZZLES = [
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
