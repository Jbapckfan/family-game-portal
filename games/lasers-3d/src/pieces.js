/* Lasers 3D - piece registry + turn tables (spec DESIGN.md section 3.3).
 * UMD: browser global `LaserPieces`, CommonJS `module.exports`.
 * Pure data. No DOM, no dependencies. ES2019 (Safari 15).
 *
 * The registry is data ({turn, pitch}) so twist pieces can be added later
 * without touching the stepper in sim.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LaserPieces = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Turn tables (spec 3.3). TURN[orient][incomingDir] -> outgoingDir. */
  var TURN = {
    '/':  { E: 'N', N: 'E', W: 'S', S: 'W' },
    '\\': { E: 'S', S: 'E', W: 'N', N: 'W' }
  };

  var ORIENTS = ['/', '\\'];

  /* Registry. `pitch` is the OUTGOING pitch the piece imposes on the beam.
   * `turn` is the table used to redirect the beam (all v1 pieces share TURN). */
  var PIECES = {
    MIRROR: { type: 'MIRROR', pitch: 0,  turn: TURN, label: 'Mirror', tag: '',  hint: 'Turns the beam and levels it.' },
    WEDGE:  { type: 'WEDGE',  pitch: 1,  turn: TURN, label: 'Wedge',  tag: '^', hint: 'Turns the beam and sends it climbing one level per cell.' },
    DIP:    { type: 'DIP',    pitch: -1, turn: TURN, label: 'Dip',    tag: 'v', hint: 'Turns the beam and sends it descending one level per cell.' }
  };

  var TYPES = Object.keys(PIECES);

  function isType(type) { return Object.prototype.hasOwnProperty.call(PIECES, type); }
  function isOrient(o) { return o === '/' || o === '\\'; }

  /* Next orientation on a rotate tap: '/' -> '\' -> '/'. */
  function rotate(orient) { return orient === '/' ? '\\' : '/'; }

  /* Apply a piece to an incoming beam direction. Returns {d, v}. */
  function apply(type, orient, dir) {
    var p = PIECES[type];
    return { d: p.turn[orient][dir], v: p.pitch };
  }

  return { TURN: TURN, ORIENTS: ORIENTS, PIECES: PIECES, TYPES: TYPES,
           isType: isType, isOrient: isOrient, rotate: rotate, apply: apply };
}));
