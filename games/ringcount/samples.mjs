/** Versioned practice only: never append to or reorder the published daily pool. */
export const TOUGHER_SAMPLE = Object.freeze({
  id: 'ringcount-tougher-v1',
  title: 'Tougher bonus',
  difficulty: 'A little tougher',
  numbers: Object.freeze([2, 3, 5, 1, 6, 2, 9, 8, 9, 8, 8, 7]),
  target: 17,
  sections: 4,
  solution: Object.freeze([0, 5, 7, 9]),
  decoyArcs: 4,
});
