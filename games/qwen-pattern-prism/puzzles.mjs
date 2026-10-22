// Original finite visual sequences derived from Qwen’s concept.
const ORIGINAL_PUZZLES = [
  {
    "id": "prism-01",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "triangle"
      ],
      "color": [
        "gold",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-02",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "ocean",
        "gold",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-03",
    "cycles": {
      "shape": [
        "circle",
        "square"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-04",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "triangle"
      ],
      "color": [
        "leaf",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-05",
    "cycles": {
      "shape": [
        "triangle",
        "square"
      ],
      "color": [
        "ocean",
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-06",
    "cycles": {
      "shape": [
        "triangle",
        "star",
        "circle"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-07",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "ocean",
        "gold",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-08",
    "cycles": {
      "shape": [
        "square",
        "circle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-09",
    "cycles": {
      "shape": [
        "triangle",
        "circle",
        "square"
      ],
      "color": [
        "ocean",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-10",
    "cycles": {
      "shape": [
        "square",
        "circle"
      ],
      "color": [
        "rose",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-11",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "triangle"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-12",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "leaf",
        "rose",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-13",
    "cycles": {
      "shape": [
        "circle",
        "square"
      ],
      "color": [
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-14",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "star"
      ],
      "color": [
        "leaf",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-15",
    "cycles": {
      "shape": [
        "circle",
        "triangle"
      ],
      "color": [
        "rose",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-16",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "square"
      ],
      "color": [
        "rose",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-17",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "ocean",
        "leaf",
        "gold"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-18",
    "cycles": {
      "shape": [
        "triangle",
        "star"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-19",
    "cycles": {
      "shape": [
        "triangle",
        "star",
        "circle"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-20",
    "cycles": {
      "shape": [
        "square",
        "circle"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-21",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "triangle"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-22",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "leaf",
        "rose",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-23",
    "cycles": {
      "shape": [
        "star",
        "square"
      ],
      "color": [
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-24",
    "cycles": {
      "shape": [
        "circle",
        "triangle",
        "square"
      ],
      "color": [
        "leaf",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-25",
    "cycles": {
      "shape": [
        "square",
        "star"
      ],
      "color": [
        "ocean",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-26",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "star"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-27",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "gold",
        "ocean",
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-28",
    "cycles": {
      "shape": [
        "star",
        "square"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-29",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "triangle"
      ],
      "color": [
        "ocean",
        "leaf"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-30",
    "cycles": {
      "shape": [
        "triangle",
        "square"
      ],
      "color": [
        "rose",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        180,
        270
      ]
    },
    "offset": 1
  }
];

// BEGIN ALFORD DAILY DEEPSEEK QWEN EXPANSION
// The first thirty records retain their original values, IDs, and ordering.
// Additional prepared content by ChatGPT. Creator attribution is unchanged.
export const PUZZLES = Object.freeze([...ORIGINAL_PUZZLES, ...[
  {
    "id": "prism-031",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        90,
        90,
        270,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-032",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        1,
        1,
        0,
        0
      ],
      "rotation": [
        0,
        90,
        0
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-033",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "triangle",
        "circle"
      ],
      "color": [
        "leaf",
        "gold",
        "ocean"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-034",
    "cycles": {
      "shape": [
        "square",
        "star",
        "circle"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270,
        90,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-035",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "star",
        "circle"
      ],
      "color": [
        "leaf",
        "ocean",
        "rose",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-036",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "triangle"
      ],
      "color": [
        "leaf",
        "rose",
        "leaf",
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        0,
        0,
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-037",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "star"
      ],
      "color": [
        "rose",
        "rose",
        "rose",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        270,
        180,
        0,
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-038",
    "cycles": {
      "shape": [
        "triangle",
        "circle",
        "triangle",
        "square"
      ],
      "color": [
        "rose",
        "gold",
        "rose",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        180,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-039",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "circle",
        "square"
      ],
      "color": [
        "leaf",
        "leaf",
        "ocean",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-040",
    "cycles": {
      "shape": [
        "star",
        "star",
        "circle",
        "triangle"
      ],
      "color": [
        "gold",
        "ocean",
        "gold",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-041",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "ocean",
        "ocean",
        "rose",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-042",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "leaf",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        0,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-043",
    "cycles": {
      "shape": [
        "star",
        "circle"
      ],
      "color": [
        "ocean",
        "gold",
        "rose"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-044",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "triangle",
        "square"
      ],
      "color": [
        "leaf",
        "gold",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        90,
        90,
        0,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-045",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "square",
        "circle"
      ],
      "color": [
        "leaf",
        "rose",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        180,
        270,
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-046",
    "cycles": {
      "shape": [
        "square",
        "star",
        "circle"
      ],
      "color": [
        "gold",
        "gold",
        "rose",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        180,
        0,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-047",
    "cycles": {
      "shape": [
        "square",
        "circle"
      ],
      "color": [
        "gold",
        "leaf"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-048",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "triangle"
      ],
      "color": [
        "ocean",
        "leaf",
        "ocean",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        90,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-049",
    "cycles": {
      "shape": [
        "circle",
        "circle",
        "circle",
        "star"
      ],
      "color": [
        "gold",
        "rose",
        "ocean",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-050",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "circle"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        90,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-051",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "triangle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        1,
        1,
        0,
        0
      ],
      "rotation": [
        90,
        0,
        90,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-052",
    "cycles": {
      "shape": [
        "star",
        "triangle",
        "square"
      ],
      "color": [
        "rose",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        90,
        180,
        90,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-053",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "leaf",
        "leaf",
        "leaf",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        90,
        0,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-054",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "circle"
      ],
      "color": [
        "leaf",
        "gold",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        0,
        0,
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-055",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "circle",
        "star"
      ],
      "color": [
        "gold"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        180,
        180,
        90,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-056",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose",
        "gold"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        180,
        180,
        0,
        0
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-057",
    "cycles": {
      "shape": [
        "star",
        "square",
        "triangle"
      ],
      "color": [
        "rose"
      ],
      "size": [
        1,
        1,
        0,
        0
      ],
      "rotation": [
        180,
        180,
        180,
        0
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-058",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "rose",
        "ocean",
        "rose",
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        90,
        90,
        90,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-059",
    "cycles": {
      "shape": [
        "circle",
        "circle",
        "square",
        "star"
      ],
      "color": [
        "leaf",
        "rose",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        180,
        180,
        0
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-060",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        180,
        90,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-061",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        0,
        0,
        0,
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-062",
    "cycles": {
      "shape": [
        "star",
        "triangle"
      ],
      "color": [
        "gold",
        "leaf",
        "rose",
        "ocean"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-063",
    "cycles": {
      "shape": [
        "square",
        "square",
        "square",
        "triangle"
      ],
      "color": [
        "rose",
        "rose",
        "gold",
        "gold"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-064",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "circle",
        "star"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        0,
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-065",
    "cycles": {
      "shape": [
        "circle",
        "triangle",
        "square"
      ],
      "color": [
        "rose",
        "rose",
        "rose",
        "gold"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-066",
    "cycles": {
      "shape": [
        "square",
        "star",
        "square",
        "triangle"
      ],
      "color": [
        "ocean",
        "leaf"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-067",
    "cycles": {
      "shape": [
        "circle",
        "circle",
        "circle",
        "square"
      ],
      "color": [
        "rose"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        180,
        270,
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-068",
    "cycles": {
      "shape": [
        "star",
        "star",
        "square",
        "triangle"
      ],
      "color": [
        "rose",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        0,
        90,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-069",
    "cycles": {
      "shape": [
        "square",
        "square",
        "circle",
        "circle"
      ],
      "color": [
        "rose",
        "gold",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        90,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-070",
    "cycles": {
      "shape": [
        "star",
        "triangle"
      ],
      "color": [
        "rose",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-071",
    "cycles": {
      "shape": [
        "star",
        "star",
        "star",
        "circle"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-072",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "gold",
        "rose",
        "gold"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        90,
        0,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-073",
    "cycles": {
      "shape": [
        "star",
        "square",
        "star"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        0,
        90,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-074",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "ocean",
        "ocean",
        "ocean",
        "rose"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        270,
        270,
        0,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-075",
    "cycles": {
      "shape": [
        "triangle",
        "circle"
      ],
      "color": [
        "ocean",
        "ocean",
        "gold",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        270,
        0,
        180,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-076",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "circle"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        0,
        0,
        0,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-077",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "star"
      ],
      "color": [
        "leaf",
        "rose",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-078",
    "cycles": {
      "shape": [
        "triangle",
        "star",
        "triangle"
      ],
      "color": [
        "leaf",
        "leaf",
        "leaf",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        180,
        180,
        270,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-079",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "square",
        "triangle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        0,
        0,
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-080",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "square",
        "triangle"
      ],
      "color": [
        "gold",
        "ocean",
        "gold",
        "leaf"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-081",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "star"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        90
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-082",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "gold",
        "leaf",
        "rose",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        0,
        0,
        0,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-083",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "leaf",
        "ocean",
        "gold"
      ],
      "size": [
        1,
        1,
        0,
        0
      ],
      "rotation": [
        180,
        90,
        270,
        0
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-084",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "leaf",
        "rose",
        "gold",
        "ocean"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-085",
    "cycles": {
      "shape": [
        "circle",
        "triangle",
        "square",
        "star"
      ],
      "color": [
        "rose",
        "rose",
        "ocean",
        "ocean"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-086",
    "cycles": {
      "shape": [
        "star",
        "square",
        "star",
        "circle"
      ],
      "color": [
        "gold",
        "rose"
      ],
      "size": [
        1
      ],
      "rotation": [
        180,
        270,
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-087",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "star",
        "circle"
      ],
      "color": [
        "rose",
        "gold",
        "leaf",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-088",
    "cycles": {
      "shape": [
        "star",
        "square",
        "star",
        "circle"
      ],
      "color": [
        "rose",
        "rose",
        "rose",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-089",
    "cycles": {
      "shape": [
        "triangle",
        "square",
        "star",
        "circle"
      ],
      "color": [
        "rose"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        180,
        180,
        0,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-090",
    "cycles": {
      "shape": [
        "square",
        "square",
        "star",
        "star"
      ],
      "color": [
        "gold",
        "leaf",
        "gold",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        90,
        0
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-091",
    "cycles": {
      "shape": [
        "square",
        "square",
        "circle",
        "triangle"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-092",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose",
        "ocean",
        "rose"
      ],
      "size": [
        1,
        1,
        0,
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-093",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "triangle",
        "star"
      ],
      "color": [
        "rose",
        "rose",
        "gold",
        "gold"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-094",
    "cycles": {
      "shape": [
        "triangle",
        "circle",
        "triangle"
      ],
      "color": [
        "ocean",
        "leaf",
        "ocean",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        270,
        180,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-095",
    "cycles": {
      "shape": [
        "circle",
        "triangle",
        "square"
      ],
      "color": [
        "rose",
        "rose",
        "leaf",
        "leaf"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-096",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "ocean",
        "ocean",
        "leaf",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        0,
        90,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-097",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "leaf",
        "ocean",
        "gold"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        270,
        90,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-098",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "leaf",
        "rose",
        "gold"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-099",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "circle"
      ],
      "color": [
        "rose",
        "leaf",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0,
        90,
        270,
        180
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-100",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "circle"
      ],
      "color": [
        "rose",
        "ocean"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-101",
    "cycles": {
      "shape": [
        "triangle",
        "square",
        "triangle",
        "star"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        180,
        270,
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-102",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "star",
        "star"
      ],
      "color": [
        "ocean",
        "ocean",
        "ocean",
        "rose"
      ],
      "size": [
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-103",
    "cycles": {
      "shape": [
        "star",
        "star",
        "circle",
        "circle"
      ],
      "color": [
        "gold",
        "leaf",
        "gold",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        0,
        90
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-104",
    "cycles": {
      "shape": [
        "circle",
        "circle",
        "circle",
        "star"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270,
        270,
        180,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-105",
    "cycles": {
      "shape": [
        "star",
        "triangle"
      ],
      "color": [
        "leaf",
        "leaf",
        "rose",
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        0,
        270,
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-106",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "circle",
        "square"
      ],
      "color": [
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        0,
        90
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-107",
    "cycles": {
      "shape": [
        "star",
        "triangle",
        "star",
        "circle"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-108",
    "cycles": {
      "shape": [
        "star",
        "circle"
      ],
      "color": [
        "gold",
        "gold",
        "leaf",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        90,
        270,
        90
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-109",
    "cycles": {
      "shape": [
        "triangle",
        "square",
        "triangle"
      ],
      "color": [
        "leaf",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        0,
        270,
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-110",
    "cycles": {
      "shape": [
        "star",
        "star",
        "square",
        "circle"
      ],
      "color": [
        "rose"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-111",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "star",
        "square"
      ],
      "color": [
        "rose",
        "rose",
        "rose",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        270,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-112",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "ocean",
        "ocean",
        "rose",
        "rose"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270,
        180,
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-113",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "gold",
        "leaf",
        "ocean",
        "rose"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        270,
        180,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-114",
    "cycles": {
      "shape": [
        "star",
        "circle"
      ],
      "color": [
        "rose",
        "gold",
        "ocean",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        0,
        270,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-115",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose",
        "rose",
        "gold",
        "ocean"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        180,
        90,
        180
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-116",
    "cycles": {
      "shape": [
        "circle",
        "square",
        "triangle",
        "star"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90,
        270,
        180,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-117",
    "cycles": {
      "shape": [
        "star",
        "star",
        "square",
        "square"
      ],
      "color": [
        "ocean",
        "rose",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        180
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-118",
    "cycles": {
      "shape": [
        "triangle",
        "triangle",
        "circle",
        "circle"
      ],
      "color": [
        "leaf",
        "leaf",
        "gold",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-119",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        1,
        1,
        1,
        0
      ],
      "rotation": [
        0,
        180,
        0
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-120",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "circle"
      ],
      "color": [
        "rose",
        "ocean",
        "rose",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-121",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "gold",
        "gold",
        "gold",
        "rose"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        270,
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-122",
    "cycles": {
      "shape": [
        "square",
        "circle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-123",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "square",
        "star"
      ],
      "color": [
        "leaf",
        "ocean"
      ],
      "size": [
        1
      ],
      "rotation": [
        180,
        270,
        90,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-124",
    "cycles": {
      "shape": [
        "triangle",
        "square",
        "triangle"
      ],
      "color": [
        "gold",
        "rose",
        "gold",
        "leaf"
      ],
      "size": [
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-125",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "leaf",
        "leaf",
        "ocean",
        "ocean"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        0,
        180,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-126",
    "cycles": {
      "shape": [
        "square",
        "square",
        "circle",
        "circle"
      ],
      "color": [
        "leaf",
        "gold",
        "ocean",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-127",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "gold",
        "ocean",
        "gold"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        180
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-128",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "star",
        "triangle"
      ],
      "color": [
        "rose",
        "leaf"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-129",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "gold",
        "leaf",
        "gold",
        "ocean"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        90,
        0,
        180
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-130",
    "cycles": {
      "shape": [
        "triangle",
        "star",
        "triangle",
        "circle"
      ],
      "color": [
        "gold"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        0,
        90,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-131",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "triangle",
        "square"
      ],
      "color": [
        "ocean",
        "rose"
      ],
      "size": [
        1
      ],
      "rotation": [
        0,
        270,
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-132",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "circle"
      ],
      "color": [
        "rose",
        "rose",
        "leaf",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        90,
        270,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-133",
    "cycles": {
      "shape": [
        "circle",
        "star",
        "circle"
      ],
      "color": [
        "gold",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        90,
        270,
        0
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-134",
    "cycles": {
      "shape": [
        "square",
        "triangle",
        "circle"
      ],
      "color": [
        "rose",
        "leaf",
        "ocean",
        "gold"
      ],
      "size": [
        0
      ],
      "rotation": [
        180,
        180,
        180,
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-135",
    "cycles": {
      "shape": [
        "star",
        "star",
        "circle",
        "circle"
      ],
      "color": [
        "leaf",
        "rose",
        "leaf"
      ],
      "size": [
        0
      ],
      "rotation": [
        180
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-136",
    "cycles": {
      "shape": [
        "star",
        "star",
        "star",
        "circle"
      ],
      "color": [
        "leaf"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        90,
        270
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-137",
    "cycles": {
      "shape": [
        "star",
        "circle",
        "star"
      ],
      "color": [
        "gold",
        "gold",
        "ocean",
        "ocean"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-138",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "triangle"
      ],
      "color": [
        "rose"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        0,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-139",
    "cycles": {
      "shape": [
        "triangle",
        "square"
      ],
      "color": [
        "gold",
        "ocean"
      ],
      "size": [
        0
      ],
      "rotation": [
        0
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-140",
    "cycles": {
      "shape": [
        "triangle",
        "circle",
        "triangle"
      ],
      "color": [
        "ocean",
        "gold",
        "leaf"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-141",
    "cycles": {
      "shape": [
        "triangle",
        "star",
        "triangle",
        "square"
      ],
      "color": [
        "gold",
        "leaf",
        "gold"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        0
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-142",
    "cycles": {
      "shape": [
        "star"
      ],
      "color": [
        "gold",
        "ocean",
        "leaf",
        "rose"
      ],
      "size": [
        0
      ],
      "rotation": [
        270,
        0,
        180,
        90
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-143",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose",
        "gold",
        "rose",
        "leaf"
      ],
      "size": [
        0,
        1
      ],
      "rotation": [
        270,
        270,
        180,
        0
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-144",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "rose",
        "leaf"
      ],
      "size": [
        1,
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 2
  },
  {
    "id": "prism-145",
    "cycles": {
      "shape": [
        "square",
        "circle",
        "square"
      ],
      "color": [
        "ocean",
        "rose",
        "leaf",
        "gold"
      ],
      "size": [
        1
      ],
      "rotation": [
        90,
        0,
        270,
        180
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-146",
    "cycles": {
      "shape": [
        "square",
        "star",
        "circle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270,
        0,
        180,
        90
      ]
    },
    "offset": 1
  },
  {
    "id": "prism-147",
    "cycles": {
      "shape": [
        "square"
      ],
      "color": [
        "rose",
        "ocean",
        "gold"
      ],
      "size": [
        1,
        0
      ],
      "rotation": [
        270,
        90
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-148",
    "cycles": {
      "shape": [
        "circle",
        "square"
      ],
      "color": [
        "gold"
      ],
      "size": [
        0,
        0,
        1,
        1
      ],
      "rotation": [
        180,
        90,
        180
      ]
    },
    "offset": 3
  },
  {
    "id": "prism-149",
    "cycles": {
      "shape": [
        "circle"
      ],
      "color": [
        "leaf",
        "leaf",
        "leaf",
        "gold"
      ],
      "size": [
        0,
        0,
        0,
        1
      ],
      "rotation": [
        270
      ]
    },
    "offset": 0
  },
  {
    "id": "prism-150",
    "cycles": {
      "shape": [
        "triangle"
      ],
      "color": [
        "ocean"
      ],
      "size": [
        0,
        1,
        0
      ],
      "rotation": [
        180,
        90,
        180
      ]
    },
    "offset": 2
  }
]]);
export const CONTENT_INFO = Object.freeze({
  "preparedPuzzles": 150,
  "structurallyDistinctRules": 125,
  "maximumCycleLength": 4,
  "displayedExamples": 5,
  "ambiguousSupportedPredictions": 0,
  "structuralDeduplication": "Ignores attribute labels and independent cycle phases."
});
