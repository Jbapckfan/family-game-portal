/* Lasers 3D - piece registry + turn tables (spec DESIGN.md section 3.3 as CORRECTED by section 12
 * and EXTENDED by section 14).
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
 * THE FOURTH PIECE, AND WHY THE REGISTRY HAD TO GENERALISE (DESIGN.md section 14).
 * FLOOR is a mirror lying flat in the cell's top surface. It is the first piece that does NOT turn
 * the beam: a horizontal mirror's normal is VERTICAL, so it flips the vertical component and leaves
 * the horizontal one alone - the exact complement of the upright MIRROR above.
 *
 *   FLOOR   v_in -1 -> v_out +1, heading UNCHANGED   (the bounce)
 *           v_in  0 -> nothing; the beam glides over it
 *           v_in +1 -> nothing; the beam is already climbing away from it
 *
 * The old registry baked in "every piece is {turn, dPitch} and always turns". It does not any more.
 * An entry now declares BOTH halves of the transform of `(direction, pitch)` as data:
 *
 *   turn    a table orient -> incomingDir -> outgoingDir. The three upright pieces share TURN
 *           (a 90-degree bounce); FLOOR uses TURN_KEEP, the identity, which is what "it does not
 *           turn the beam" IS, expressed as data rather than as a branch in the stepper.
 *   dPitch  a constant delta added to the incoming pitch (MIRROR 0, WEDGE +1, DIP -1), OR
 *   pitch   a function of the incoming pitch, for a piece whose vertical effect is not a plain
 *           delta. FLOOR uses `bounceUp` below.
 *
 * An entry supplies exactly one of `dPitch` / `pitch`. The CLAMP of section 12.2 is applied
 * CENTRALLY in applyPitch() to whichever one it is, so no entry can quietly escape it. Nothing in
 * the stepper, the solver or the generator ever names a piece type: they call apply() / applyPitch()
 * / acts() and read the answer. A fifth piece is still exactly one entry in PIECES.
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

  /* The identity turn table: a piece that leaves the HEADING alone whichever way it is laid down
   * (spec 14.1). A FLOOR plate's two orientations are therefore indistinguishable in the rules -
   * the tap-to-rotate gesture still works on one, it just never changes the beam. */
  var TURN_KEEP = {
    '/':  { E: 'E', N: 'N', W: 'W', S: 'S' },
    '\\': { E: 'E', N: 'N', W: 'W', S: 'S' }
  };

  var ORIENTS = ['/', '\\'];

  /* The four headings, in the order the turn tables are written. Local only; LaserSim owns DIRS. */
  var DIR_NAMES = ['E', 'N', 'W', 'S'];

  /* The only pitches the grid represents (spec 12.2). */
  var V_MIN = -1, V_MAX = 1;

  /* FLOOR's vertical effect (spec 14.1): a beam coming DOWN onto the plate is reflected upward with
   * the same heading; a level beam and a climbing beam are left exactly as they are. */
  function bounceUp(vIn) { return vIn < 0 ? -vIn : vIn; }

  /* Registry. Each entry declares the whole transform of (direction, pitch) as data:
   *   turn            orient -> dir -> dir           (TURN turns 90 degrees, TURN_KEEP does not)
   *   dPitch | pitch  the vertical half, delta or function; clamped centrally by applyPitch()
   * `label`, `tag` and `hint` are for the tray UI and are not read by the rules. */
  var PIECES = {
    MIRROR: { type: 'MIRROR', turn: TURN,      dPitch: 0,       label: 'Mirror', tag: '',  hint: 'Turns the beam and keeps it going the way it was: level stays level, a climb keeps climbing.' },
    WEDGE:  { type: 'WEDGE',  turn: TURN,      dPitch: 1,       label: 'Wedge',  tag: '^', hint: 'Turns the beam and tilts it UP one step. It levels a falling beam.' },
    DIP:    { type: 'DIP',    turn: TURN,      dPitch: -1,      label: 'Dip',    tag: 'v', hint: 'Turns the beam and tilts it DOWN one step. It is the only way to level a climbing beam.' },
    FLOOR:  { type: 'FLOOR',  turn: TURN_KEEP, pitch: bounceUp, label: 'Floor',  tag: '_', hint: 'A mirror lying flat in the ground. It does NOT turn the beam: a beam falling onto it bounces straight back up, still heading the same way. A level or climbing beam glides right over it.' },
    SPLITTER: { type: 'SPLITTER', turn: TURN, dPitch: 0, split: true, label: 'Splitter', tag: '+', hint: 'Makes two beams: one continues straight and one turns along the diagonal. Both keep their climb. Light every receiver in one shot.' }
  };

  var TYPES = Object.keys(PIECES);

  function isType(type) { return Object.prototype.hasOwnProperty.call(PIECES, type); }
  function isOrient(o) { return o === '/' || o === '\\'; }

  /* Next orientation on a rotate tap: '/' -> '\' -> '/'. */
  function rotate(orient) { return orient === '/' ? '\\' : '/'; }

  /* The central clamp (spec 12.2). Every pitch the engine produces goes through here. */
  function clampPitch(v) { return v < V_MIN ? V_MIN : (v > V_MAX ? V_MAX : v); }

  /* Outgoing HEADING for a piece hit by a beam heading `dir`. Data-driven: the entry's own turn
   * table answers, so "this piece does not turn the beam" is a table, not a special case. */
  function turnDir(type, orient, dir) { return PIECES[type].turn[orient][dir]; }

  /* True when this piece type never changes the heading, whatever the orientation (spec 14.1).
   * Derived from the table so it cannot drift away from the behaviour it describes. */
  function turnsBeam(type) {
    var turn = PIECES[type].turn, o, d;
    for (o = 0; o < ORIENTS.length; o++) {
      for (d = 0; d < DIR_NAMES.length; d++) {
        if (turn[ORIENTS[o]][DIR_NAMES[d]] !== DIR_NAMES[d]) return true;
      }
    }
    return false;
  }

  /* Outgoing pitch for a piece hit by a beam whose pitch is vIn. Data-driven: an entry supplies
   * either a constant `dPitch` delta or its own `pitch(vIn)` function. Either way the result goes
   * through the ONE clamp of spec 12.2. */
  function applyPitch(type, vIn) {
    var p = PIECES[type];
    var v = typeof p.pitch === 'function' ? p.pitch(vIn) : vIn + p.dPitch;
    return clampPitch(v);
  }

  /* Apply a piece to an incoming beam. Both halves of the outgoing state depend on the INCOMING
   * state (spec 12.1 for the pitch, spec 14.1 for the heading), so dir and vIn are both required.
   * Returns {d, v}. */
  function apply(type, orient, dir, vIn) {
    return { d: turnDir(type, orient, dir), v: applyPitch(type, vIn) };
  }

  /* Does this piece do ANYTHING to a beam arriving as (dir, vIn)? Defined generically as "the
   * outgoing state differs from the incoming one", so it needs no per-type knowledge:
   *   - the three upright pieces always turn, so they always act;
   *   - a FLOOR acts only on a descending beam; a level or climbing beam glides over it (14.1).
   * The stepper uses this to tell a piece HIT from a glide, and the generator uses it to refuse to
   * plan a piece that would be a no-op where it stands. */
  function acts(type, orient, dir, vIn) {
    var r = apply(type, orient, dir, vIn);
    return r.d !== dir || r.v !== vIn;
  }

  return { TURN: TURN, TURN_KEEP: TURN_KEEP, ORIENTS: ORIENTS, PIECES: PIECES, TYPES: TYPES,
           V_MIN: V_MIN, V_MAX: V_MAX,
           isType: isType, isOrient: isOrient, rotate: rotate,
           clampPitch: clampPitch, turnDir: turnDir, turnsBeam: turnsBeam,
           applyPitch: applyPitch, apply: apply, acts: acts };
}));
