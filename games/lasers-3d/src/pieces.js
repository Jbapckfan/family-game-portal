/* Lasers 3D - piece registry + turn tables (spec DESIGN.md section 3.3 as CORRECTED by section 12).
 * UMD: browser global `LaserPieces`, CommonJS `module.exports`.
 * Pure data. No DOM, no dependencies. ES2019 (Safari 15).
 *
 * PITCH IS A DELTA, NOT A SET (DESIGN.md section 12, supersedes the pitch column of 3.3).
 * A vertical mirror's normal is horizontal, so reflecting off it rotates the beam's HORIZONTAL
 * heading by 90 degrees and leaves its vertical component untouched: a climbing beam stays
 * climbing. Only a sloped face changes the climb, and it does so by ONE step:
 *
 *   MIRROR  v_out = v_in                 (preserved)
 *   WEDGE   v_out = min(v_in + 1, +1)    (climb one more, clamped)
 *   DIP     v_out = max(v_in - 1, -1)    (descend one more, clamped)
 *
 * The clamp (section 12.2) is the one deliberate approximation: the grid only represents
 * -45, 0 and +45 degrees, so a WEDGE hit by an already-climbing beam leaves it climbing and a
 * DIP hit by an already-descending beam leaves it descending. Every beam segment therefore
 * stays at 45 degrees or level, which is what keeps the board readable from directly above.
 *
 * The registry stays DATA: an entry carries `dPitch` (the delta) and, optionally, an
 * `applyPitch(vIn)` function for a future piece whose effect is not a plain delta (a floor
 * mirror that flips -1 to +1, say). The clamp is applied CENTRALLY in applyPitch() below, so a
 * new twist piece is still exactly one registry entry and the stepper never special-cases a type.
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

  /* The only pitches the grid represents (spec 12.2). */
  var V_MIN = -1, V_MAX = 1;

  /* Registry. `dPitch` is the DELTA the piece applies to the incoming pitch; the clamp to
   * [V_MIN, V_MAX] is applied centrally by applyPitch(). `turn` is the table used to redirect
   * the beam (all v1 pieces share TURN). */
  var PIECES = {
    MIRROR: { type: 'MIRROR', dPitch: 0,  turn: TURN, label: 'Mirror', tag: '',  hint: 'Turns the beam and keeps it going the way it was: level stays level, a climb keeps climbing.' },
    WEDGE:  { type: 'WEDGE',  dPitch: 1,  turn: TURN, label: 'Wedge',  tag: '^', hint: 'Turns the beam and tilts it UP one step. It levels a falling beam.' },
    DIP:    { type: 'DIP',    dPitch: -1, turn: TURN, label: 'Dip',    tag: 'v', hint: 'Turns the beam and tilts it DOWN one step. It is the only way to level a climbing beam.' }
  };

  var TYPES = Object.keys(PIECES);

  function isType(type) { return Object.prototype.hasOwnProperty.call(PIECES, type); }
  function isOrient(o) { return o === '/' || o === '\\'; }

  /* Next orientation on a rotate tap: '/' -> '\' -> '/'. */
  function rotate(orient) { return orient === '/' ? '\\' : '/'; }

  /* The central clamp (spec 12.2). Every pitch the engine produces goes through here. */
  function clampPitch(v) { return v < V_MIN ? V_MIN : (v > V_MAX ? V_MAX : v); }

  /* Outgoing pitch for a piece hit by a beam whose pitch is vIn. Data-driven: a registry entry
   * may supply its own applyPitch(vIn); otherwise the entry's dPitch is added. Either way the
   * result is clamped centrally. */
  function applyPitch(type, vIn) {
    var p = PIECES[type];
    var v = typeof p.applyPitch === 'function' ? p.applyPitch(vIn) : vIn + p.dPitch;
    return clampPitch(v);
  }

  /* Apply a piece to an incoming beam. The outgoing pitch depends on the INCOMING pitch
   * (spec 12.1), so vIn is required. Returns {d, v}. */
  function apply(type, orient, dir, vIn) {
    var p = PIECES[type];
    return { d: p.turn[orient][dir], v: applyPitch(type, vIn) };
  }

  return { TURN: TURN, ORIENTS: ORIENTS, PIECES: PIECES, TYPES: TYPES,
           V_MIN: V_MIN, V_MAX: V_MAX,
           isType: isType, isOrient: isOrient, rotate: rotate,
           clampPitch: clampPitch, applyPitch: applyPitch, apply: apply };
}));
