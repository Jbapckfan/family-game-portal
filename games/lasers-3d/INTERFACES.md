# Lasers 3D rules engine — INTERFACES

Shipped files (all under `games/lasers-3d/`):

- `src/pieces.js` — piece registry + turn tables (UMD: `window.LaserPieces` / `module.exports`)
- `src/sim.js` — stepper + public API (UMD: `window.LaserSim` / `module.exports`; loads `pieces.js` itself)
- `test/sim.test.mjs` — `node:test` suite, one or more per bullet of spec 3.2, 3.3, 3.4, the corrected pitch rule of spec 12 (every cell of its table, all three clamp cases, and the owner's WEDGE-then-MIRROR scenario) and the FLOOR table of spec 14.1 (every row, through the engine; a plate on raised terrain; a bounce into a solid cell; a plate flown over; the skipping stone; an arch and a bounce in one shot; and an exhaustive proof that a FLOOR never changes the heading), plus the `events` stream, the `dark` flag of spec 15.1 and the derived step cap
- `test/review-robustness.test.mjs`, `test/review-spec-conformance.test.mjs` — adversarial review suites (malformed levels, illegal placements, determinism, loop guard, derived cap, UMD wrapper, and the whole `openings` truth table of DESIGN.md 13.2)
- `test/fixtures/pre-openings-traces.json` — 261 traces over 26 self-contained levels, captured from the engine as it stood BEFORE section 13. `test/sim.test.mjs` replays every one and compares a sha256 of the full result, which is the proof that a level with no `openings` behaves exactly as it did. It doubles as the section-14 compatibility corpus: it predates the FLOOR piece too, so `glides` and `bounces` are asserted empty on all 261 traces and the digest still matches byte for byte.

Implements DESIGN.md section 3 **as corrected by section 12** (pitch is a DELTA, not a set), **extended by section 13** (arches and windows: an optional `openings` array punches levels out of a column), **extended again by section 14** (FLOOR mirrors: a fourth piece that does not turn the beam) and carrying the **section 15** `dark` flag. Pure, deterministic, no DOM, no Three.js, no dependencies, ES2019 (Safari 15).

### PITCH IS A DELTA (DESIGN.md 12, supersedes the pitch column of 3.3)

A piece turns the beam 90 degrees exactly as before, but its vertical effect is applied **to the
incoming pitch**, then clamped to the three pitches the grid represents:

| piece | turn | pitch effect | `v_in` -1 | `v_in` 0 | `v_in` +1 |
|---|---|---|---|---|---|
| MIRROR | `/` or `\\` | `v_out = v_in` (preserved) | -1 | 0 | +1 |
| WEDGE  | `/` or `\\` | `v_out = min(v_in + 1, +1)` | 0 | +1 | **+1** |
| DIP    | `/` or `\\` | `v_out = max(v_in - 1, -1)` | **-1** | -1 | 0 |

A vertical mirror's normal is horizontal, so it cannot change the climb: **a MIRROR can no longer
level a climbing beam.** The only way to level a climber is a DIP, and the only way to level a
descender is a WEDGE. The bold cells are the clamp of spec 12.2 - the one deliberate approximation,
which keeps every beam segment at 45 degrees or level. A level beam behaves exactly as it did
before, so the pure-2D levels are unaffected.

### FLOOR MIRRORS (DESIGN.md 14, adds a fourth piece)

`FLOOR` is a mirror lying **flat in the cell's top surface**. A horizontal mirror's normal is
vertical, so it flips the beam's vertical component and leaves the horizontal one alone - the exact
complement of the upright `MIRROR` above, and the first piece in the game that does **not turn the
beam**:

| `v_in` | what a FLOOR does |
|---|---|
| `-1` (descending onto it) | **reflect**: heading UNCHANGED, pitch becomes `+1` |
| `0` (level) | nothing; the beam glides over it |
| `+1` (climbing away) | nothing |

**The registry generalised rather than the stepper special-casing it.** A piece entry now declares
BOTH halves of the transform of `(direction, pitch)` as data: `turn` (a table `orient -> dir -> dir`;
the three upright pieces share `TURN`, FLOOR uses `TURN_KEEP`, the identity) and either `dPitch` (a
constant delta) or `pitch(vIn)` (a function, for an effect that is not a plain delta). The clamp of
spec 12.2 is applied centrally to whichever one it is. Nothing in the stepper, the solver or the
generator names a piece type, so a fifth piece is still exactly one entry in `PIECES`.

Because a piece can now be met without being CHANGED by, the trace grew two additive fields:
`glides` (met at its own level and left the beam alone) and `bounces` (reflected the beam without
turning it - the bright dot of DESIGN.md 14.3, where beam and floor shadow coincide). Both are `[]`
on any level with no plate, which keeps every pre-section-14 trace byte-identical.

### DARKNESS (DESIGN.md 15, a rendering flag on the level)

A level may carry `dark: true`. `parseLevel` validates it (a boolean if present; anything else
throws rather than being coerced) and carries it through. **The rules engine never reads it** -
darkness gates WHEN the player sees the board, never what the beam does - so a dark level traces
identically to the same board without the flag.

### ARCHES AND WINDOWS (DESIGN.md 13, extends 3.1 and 3.2)

`terrain` is a HEIGHT FIELD: a column is solid at every level below `t`, so neither an overhang nor a
hole through a wall can exist. A level may now carry an **`openings`** array naming levels punched
OUT of specific columns:

```js
openings: [ { x: 4, y: 9, levels: [0] } ]   // this column is NOT solid at these levels
```

The whole rule change is one clause of the blocked test:

> the next cell is BLOCKED when `z' < t[next]` **AND** `z'` is not one of that column's open levels.

| shape | data | behaviour |
|---|---|---|
| **ARCH** | `t = 3`, `levels: [0]` | solid at 1 and 2. A floor beam passes UNDER it; a beam at 1 or 2 is blocked; a beam at 3 flies over as before. |
| **WINDOW** | `t = 3`, `levels: [1]` | solid at 0 and 2. Only a beam at level 1 threads it. |

Both are pixel-identical to an ordinary solid column seen from directly above, because the top
surface is unchanged - that is the point, and the fair tell is the light leak of DESIGN.md 13.3.

`parseLevel` normalises `openings` into **`openMask[y][x]`**, a per-column bitmask (bit `z` set =
level `z` is open), so the stepper's test is one shift and one AND. A level with **no** `openings`
gets an all-zero mask, the added clause is never true, and the engine behaves EXACTLY as it did
before - proved byte-for-byte by `test/sim.test.mjs` against `test/fixtures/pre-openings-traces.json`,
a 261-trace corpus captured from the pre-openings engine.

Nothing else moves. Pitch is still the DELTA above; a piece still sits on the column TOP at `t` and
acts only at that level; targets and the emitter are unchanged; and **nothing may be placed inside an
opening** - which needs no new rule, because a piece only ever exists at `t` and every open level is
strictly below it. The one additive result field is `underpasses` (section 2), because a beam can now
miss a piece by going UNDER it as well as over it, and those are different events on screen.

---

## 0. ROW-ORDER CONVENTION (read this first)

**Terrain is indexed `t[y][x]`. `terrain[0]` is the SOUTH row (y = 0, the bottom of the flat view). North is up, y increases northward. x increases eastward.**

```
terrain: [ 'row y=0 (SOUTH)',
           'row y=1',
           ...
           'row y=d-1 (NORTH)' ]        terrain[y][x]  ->  parsed  t[y][x]
```

The spec prose (3.1) writes `t[x][y]`; that is notation only. **Every module — levels, sim, solver, renderer, UI — uses `t[y][x]` with y = 0 south.** When you print a board for a human, print `terrain` in REVERSE (north row first) or the picture is upside down. A renderer that maps y to screen-up (or to world +Z/-Z in Three.js) must not flip x.

Directions: `E = (+1, 0)`, `N = (0, +1)`, `W = (-1, 0)`, `S = (0, -1)`. Orientation `/` turns `E->N, N->E, W->S, S->W`; `\` turns `E->S, S->E, W->N, N->W` (same as the 2D portal game, viewed north-up).

---

## 1. Loading

Browser (script tags, in this order; `sim.js` reads the global `LaserPieces`):

```html
<script src="src/pieces.js"></script>
<script src="src/sim.js"></script>
<script>const r = LaserSim.trace(level, placed);</script>
```

Node (CommonJS via `createRequire`; `sim.js` does `require('./pieces.js')` itself):

```js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LaserSim = require('./src/sim.js');       // or require('../src/sim.js') from test/
const LaserPieces = require('./src/pieces.js'); // optional; LaserSim.PIECES is the same object
```

---

## 2. Public API of `src/sim.js` (exact, as shipped)

```
LaserSim.DIRS            // { E:{dx:1,dy:0}, N:{dx:0,dy:1}, W:{dx:-1,dy:0}, S:{dx:0,dy:-1} }
LaserSim.H_MAX           // 4   (levels z in 0..3; arrival at z >= 4 is 'lost-sky')
LaserSim.MAX_STEPS       // 400 - the MINIMUM step cap, NOT the cap a trace actually uses.  [added]
                         //       See 2.1; the real cap is LaserSim.stepCap(level).
LaserSim.ORIENTS         // ['/', '\\']                                                    [added]
LaserSim.PIECES          // registry from pieces.js: { MIRROR:{turn:TURN,dPitch:0,...}, WEDGE:{dPitch:1,...},
                         //       DIP:{dPitch:-1,...}, FLOOR:{turn:TURN_KEEP,pitch:fn,...} }
                         //       `dPitch` is a DELTA on the incoming pitch, clamped to -1..+1 (spec 12);
                         //       `pitch(vIn)` is the function form, for FLOOR's bounce (spec 14).  [FLOOR added]
LaserSim.TURN            // turn tables: TURN['/'] and TURN['\\'], each { E, N, W, S } -> outgoing dir  [added, same object as LaserPieces.TURN]
                         //       NOTE: this is the 90-degree table only. To find where a piece sends the
                         //       beam, ask LaserPieces.turnDir(type, orient, dir) - a FLOOR does not turn.

LaserSim.stepCap(level)  // -> the DERIVED loop-guard cap for that level (see 2.1). Validates like parseLevel.  [added]

LaserSim.parseLevel(level) -> normalized level (see section 3). Throws Error('lasers-3d level: ...') on a malformed level.
LaserSim.canPlace(level, placed, x, y) -> boolean (rule 3.4). UNCHANGED by openings: placement is per CELL and a
                         piece always sits on the column TOP, so an opening never makes a column placeable at
                         another level, and never makes an opened column unplaceable.
LaserSim.isOpen(level, x, y, z) -> boolean  // is level z of column (x,y) punched out? (DESIGN.md 13.1)  [added]
                         false for an off-grid cell or a z outside 0..3. Accepts a raw or parsed level.
LaserSim.trace(level, placed) -> {
    segments: [{ from:{x,y,z}, to:{x,y,z}, d:'E'|'N'|'W'|'S', v:-1|0|1 }],  // one per cell-to-cell step; z is the LEVEL (integer).
                                                                            // A terminal stub (blocked / lost-floor / lost-sky) ends at the
                                                                            // cell boundary: to = midpoint (x or y is n.5) with the SAME z as from.
                                                                            // lost-edge: to = the off-grid cell center at z+v.
    visited: [{x,y,z,d,v}],        // beam state on ENTERING each cell, in order (the emitter cell itself is not listed;
                                   // d,v are the state on entry, BEFORE any piece in that cell acts)
    hits: [targetIndex, ...],      // targets lit, in order, no duplicates
    allTargetsHit: boolean,
    end: 'target'|'blocked'|'lost-edge'|'lost-floor'|'lost-sky'|'loop',
    endPoint: {x,y,z},             // where the visual beam stops (= last segment's `to`)
    altitudeMarks: [{x,y,z}],      // one per pitch CHANGE (at the piece's cell, at the beam's level there) plus the endPoint, in order
    pieceHits: [{x,y,type,orient,fixed:boolean}],   // pieces that acted, in order (a piece can appear more than once)
    overflights: [{x,y}],          // cells whose piece the beam passed OVER (beam level ABOVE the piece's terrain level), in order
    glides: [{x,y}],               // cells whose piece the beam MET at its own level and was NOT changed by.  [added]
                                   // Only a FLOOR plate can do this (under a level or climbing beam, DESIGN.md 14.1);
                                   // ALWAYS [] on a level with no plate. A glide is not an overflight: the beam is at
                                   // the plate's own level, skimming it, not passing it at another height.
    bounces: [{x,y,z}],            // cells where a piece changed the beam's pitch WITHOUT turning it - the floor  [added]
                                   // bounce of DESIGN.md 14. This is the anchor for the bright-dot tell of 14.3.
                                   // ALWAYS [] on a level with no plate.
    underpasses: [{x,y}],          // cells whose piece the beam passed UNDER (beam BELOW it, inside an opening), in order.  [added]
                                   // Only reachable on a level with `openings`; ALWAYS [] otherwise, which is what keeps
                                   // pre-section-13 levels byte-identical. Kept separate from `overflights` on purpose:
                                   // a consumer that merged them would put the reveal camera and the readout on the
                                   // wrong side of the block.
    events: [{kind, step, x, y, z, ...}]            // ordered, step-indexed event stream - see 2.2. PREFER THIS.  [added]
}
```

`placed` may be omitted or `[]`. `level` may be raw (schema below) or already parsed; `parseLevel` is idempotent for levels **this module produced** (they carry a module-private brand, so a solver can parse once and call `trace` many times). The `parsed: true` field on the returned object is a *label*, not a trust token: a hand-made object claiming `parsed: true` is validated like any other raw level.

`trace` never throws on a valid level. It throws only if a *placed* piece has an unknown `type` or `orient` (that is a caller bug, not a level bug). Inputs are never mutated.

### 2.1 The loop-guard step cap (`MAX_STEPS` vs `stepCap`)

Termination is guaranteed by the **repeated-state guard**, not by a step count: the beam state
`(x, y, z, d, v)` is drawn from a finite set, so the guard must fire within `w * d * H_MAX * 4 * 3`
steps on any level. The step cap is only a safety net, and it is derived from that state space:

```
stepCap(level) = max(MAX_STEPS, w * d * H_MAX * 4 directions * 3 pitches + 1)
```

| board | states (`w*d*H_MAX*4*3`) | `stepCap` |
|---|---|---|
| 2x2   | 192    | **400** (the `MAX_STEPS` floor) |
| 6x6   | 1728   | 1729 |
| 12x12 | 6912   | 6913 |
| 20x20 | 19200  | 19201 |
| 24x24 | 27648  | 27649 |

`LaserSim.MAX_STEPS` is exported and **stays 400**, but it is the MINIMUM cap, not the cap in force.
It used to be the hard-coded limit; on the boards DESIGN.md section 11 calls for (12x12 up to 24x24,
576 cells) a legal, non-repeating route can exceed 400 steps, and the old code reported such a route
as `end: 'loop'` - a false loss with the wrong end reason. Because `stepCap` strictly exceeds the
number of distinct states, **the cap can never be the terminator**: `end: 'loop'` always means a
genuine repeated state.

Consumers that want to know "did the trace end on a cap rather than a real cycle?" must compare
against `LaserSim.stepCap(level)`, never against `MAX_STEPS`.

### 2.2 `events` - the ordered, step-indexed event stream

`trace().events` is a flat, chronological list of everything the beam did, each item stamped with the
index of the **segment** that produced it. Every other field of the trace result keeps its exact
previous shape and semantics; `events` is purely additive.

**Prefer `events` over reconstructing the trace by matching cells on `x, y`.** A beam legitimately
enters the same `(x, y)` more than once at different heights - flying over a target at `z = 2` and
then hitting it at `z = 0` is a normal solution shape - so an `x, y` match lights the orb (and fires
the hit sound) on the fly-over. `events` disambiguates: the fly-over is an `enter` with no `target`
event at that step.

```
{ kind, step, x, y, z, ...kind-specific fields }
```

- `step` - index into `segments` of the segment whose traversal produced the event. Events are
  emitted in order and `step` is non-decreasing, so a renderer can drive animation timing straight
  from cumulative arc length: play event `e` when the head reaches the end of `segments[e.step]`.
- `x, y, z` - the cell and beam level the event happened at. For the terminal event these are the
  `endPoint`, so `x` or `y` may be fractional (`n.5` on a stub) or off-grid (`lost-edge`).

| `kind` | when | extra fields | mirrors |
|---|---|---|---|
| `enter` | the beam entered a cell | `d`, `v` (state on entry, BEFORE any piece in that cell acts) | one per `visited` entry |
| `target` | an orb was NEWLY lit (entered at `z == t[cell]`) | `targetIndex` | one per `hits` entry |
| `piece`  | a piece acted (`z == t[cell]`) | `type`, `orient`, `fixed`, `dIn`, `dOut`, `vIn`, `vOut` | one per `pieceHits` entry |
| `overflight` | the beam passed OVER a piece (`z > t[cell]`) | `type`, `orient`, `fixed` | one per `overflights` entry |
| `underpass` | the beam passed UNDER a piece (`z < t[cell]`, i.e. through an opening) | `type`, `orient`, `fixed` | one per `underpasses` entry |
| `glide` | the beam MET a piece at its own level and the piece did nothing (`z == t[cell]`, a FLOOR under a level or climbing beam) | `type`, `orient`, `fixed`, `d`, `v` | one per `glides` entry |
| `pitch` | a piece CHANGED the pitch | `from`, `to` (the old and new `v`) | the piece-cell `altitudeMarks` |
| `bounce` | a piece changed the pitch WITHOUT turning the beam (a floor bounce, DESIGN.md 14) | `type`, `fixed`, `d`, `vIn`, `vOut` | one per `bounces` entry |
| `end` | terminal, always last, exactly one | `end` - the same value as the result's `end` | the final `altitudeMarks` entry |

Order within one `step`: `enter`, then `target` (if it lights), then `piece` / `overflight` /
`underpass` / `glide` (exactly one of the four, when the cell holds a piece), then
`pitch` (if the piece changed the pitch), then `bounce` (if it changed the pitch without turning).
A trace that stops on a target emits no `piece` event for that cell, because the beam stops before
the piece can act.

**`piece` means ACTED, not MET.** A piece that leaves the beam exactly as it found it emits `glide`
instead, appears in neither `pieceHits` nor `events.filter(kind==='piece')`, and is indistinguishable
from a bare cell as far as the beam is concerned - which is precisely why a solution containing one
is never minimal (see solver.mjs's irredundancy argument).

Notes:
- A `target` event fires only for a NEWLY lit orb, exactly like `hits`. Passing back through an
  already-lit orb emits an `enter` and nothing else.
- A `target` event's `z` always equals `t[y][x]` of the orb's cell. There is no target event for a
  fly-over; detect one as an `enter` at `(x, y)` with no `target` event at the same `step`.
- Reconstructions that must stay in sync:
  `events.filter(kind==='enter')` -> `visited`, `filter(kind==='piece')` -> `pieceHits`,
  `filter(kind==='overflight')` -> `overflights`, `filter(kind==='underpass')` -> `underpasses`,
  `filter(kind==='glide')` -> `glides`, `filter(kind==='bounce')` -> `bounces`,
  `filter(kind==='target').map(targetIndex)` -> `hits`,
  `filter(kind==='pitch'||kind==='end')` cells -> `altitudeMarks`.

**Worked example.** Emitter on a `t=1` ridge at (0,3); the orb at (3,3) sits on `t=0`, so the
outbound level-1 beam flies OVER it. A DIP on the `t=1` pedestal at (5,3) starts the beam falling; a
WEDGE at (5,4) catches it at `z=0` and LEVELS it (`-1 + 1 = 0`) - a MIRROR there would have left it
falling into the floor. A MIRROR then walks the level beam south into (3,3) at `z=0` - the real hit.

```js
level  = { size:{w:7,d:7}, terrain:['0000000','0000000','0000000','1000010','0000000','0000000','0000000'],
           emitter:{x:0,y:3,dir:'E'}, targets:[{x:3,y:3}], fixed:[], tray:[] }
placed = [{x:5,y:3,type:'DIP',orient:'/'}, {x:5,y:4,type:'WEDGE',orient:'\\'}, {x:3,y:4,type:'MIRROR',orient:'/'}]
```

```json
{
  "end": "target", "hits": [0], "allTargetsHit": true,
  "events": [
    {"kind":"enter","step":0,"x":1,"y":3,"z":1,"d":"E","v":0},
    {"kind":"enter","step":1,"x":2,"y":3,"z":1,"d":"E","v":0},
    {"kind":"enter","step":2,"x":3,"y":3,"z":1,"d":"E","v":0},
    {"kind":"enter","step":3,"x":4,"y":3,"z":1,"d":"E","v":0},
    {"kind":"enter","step":4,"x":5,"y":3,"z":1,"d":"E","v":0},
    {"kind":"piece","step":4,"x":5,"y":3,"z":1,"type":"DIP","orient":"/","fixed":false,"dIn":"E","dOut":"N","vIn":0,"vOut":-1},
    {"kind":"pitch","step":4,"x":5,"y":3,"z":1,"from":0,"to":-1},
    {"kind":"enter","step":5,"x":5,"y":4,"z":0,"d":"N","v":-1},
    {"kind":"piece","step":5,"x":5,"y":4,"z":0,"type":"WEDGE","orient":"\\","fixed":false,"dIn":"N","dOut":"W","vIn":-1,"vOut":0},
    {"kind":"pitch","step":5,"x":5,"y":4,"z":0,"from":-1,"to":0},
    {"kind":"enter","step":6,"x":4,"y":4,"z":0,"d":"W","v":0},
    {"kind":"enter","step":7,"x":3,"y":4,"z":0,"d":"W","v":0},
    {"kind":"piece","step":7,"x":3,"y":4,"z":0,"type":"MIRROR","orient":"/","fixed":false,"dIn":"W","dOut":"S","vIn":0,"vOut":0},
    {"kind":"enter","step":8,"x":3,"y":3,"z":0,"d":"S","v":0},
    {"kind":"target","step":8,"x":3,"y":3,"z":0,"targetIndex":0},
    {"kind":"end","step":8,"x":3,"y":3,"z":0,"end":"target"}
  ]
}
```

Read it: `(3,3)` is entered TWICE - at `step 2` (`z:1`, the fly-over) and at `step 8` (`z:0`, the
hit) - but there is exactly ONE `target` event, at `step 8`. The mirror at (3,4) turns the beam
without changing its pitch - a MIRROR never does - so it gets a `piece` event and no `pitch` event,
exactly as it gets no `altitudeMarks` entry. The WEDGE at (5,4) does change it (`-1 -> 0`), so it
gets both.

### 2.3 `src/pieces.js` (also exported, for the tray UI and future twist pieces)

```
LaserPieces.TURN          // { '/': {E:'N',N:'E',W:'S',S:'W'}, '\\': {E:'S',S:'E',W:'N',N:'W'} }   the 90-degree bounce
LaserPieces.TURN_KEEP     // { '/': {E:'E',N:'N',W:'W',S:'S'}, '\\': same }  the IDENTITY - "does not turn"  [added]
LaserPieces.ORIENTS       // ['/', '\\']
LaserPieces.PIECES        // { MIRROR:{type,turn:TURN,dPitch:0,label:'Mirror',tag:'',hint},
                          //   WEDGE:{turn:TURN,dPitch:1,label:'Wedge',tag:'^'},
                          //   DIP:{turn:TURN,dPitch:-1,label:'Dip',tag:'v'},
                          //   FLOOR:{turn:TURN_KEEP,pitch:fn,label:'Floor',tag:'_'} }              [FLOOR added]
LaserPieces.V_MIN, V_MAX  // -1, +1 - the only pitches the grid represents (spec 12.2)
LaserPieces.TYPES         // ['MIRROR','WEDGE','DIP','FLOOR']
LaserPieces.isType(t), isOrient(o)
LaserPieces.rotate(orient)             // '/' -> '\\' -> '/'
LaserPieces.clampPitch(v)              // -> v clamped to -1..+1 (the central clamp, spec 12.2)
LaserPieces.turnDir(type, orient, dir) // -> outgoing HEADING alone, from the entry's own turn table   [added]
LaserPieces.turnsBeam(type)            // -> does this type EVER change the heading? false for FLOOR   [added]
                                       //    derived from the table, so it cannot drift from behaviour
LaserPieces.applyPitch(type, vIn)      // -> outgoing pitch alone: clampPitch(dPitch delta OR pitch(vIn))
LaserPieces.apply(type, orient, dir, vIn)  // -> { d: outgoingDir, v: outgoingPitch }
LaserPieces.acts(type, orient, dir, vIn)   // -> does it change the beam at all? (d or v differs)      [added]
```

**`apply` takes the INCOMING pitch.** It has to: under spec 12 the outgoing pitch is a function of
the incoming one, so the old 3-argument `apply(type, orient, dir)` could not express the rule and is
gone. `vIn` must be -1, 0 or +1.

**A piece declares how it transforms `(direction, pitch)`; the stepper never special-cases a type.**
An entry carries a `turn` table for the heading half - `TURN` for a 90-degree bounce, `TURN_KEEP` for
a piece that leaves the heading alone - and, for the vertical half, EXACTLY ONE of a constant
`dPitch` delta or a `pitch(vIn)` function. `applyPitch` applies the clamp of spec 12.2 centrally to
whichever it is, so no entry can escape it, and `acts` is derived rather than declared: it is simply
"the outgoing state differs from the incoming one". Adding a fifth piece is one more registry entry
and no change anywhere else.

**`acts` matters now that it can be false.** `MIRROR`, `WEDGE` and `DIP` always turn, so they always
act; a `FLOOR` acts only on a descending beam. The stepper uses `acts` (implicitly, by comparing
`apply`'s answer with the incoming state) to tell a `piece` event from a `glide`, and the generator
uses it to refuse to plan a piece that would be a no-op where it stands.

---

## 3. Level schema (frozen; every module consumes exactly this)

```js
{
  name: 'FIRST BOUNCE',            // display name
  par: 1,                          // minimum pieces, proven by the solver (>= 0; default 0 if absent)
  size: { w: 7, d: 7 },            // w cells east-west (x), d cells north-south (y)
  terrain: ['0000000', ...],       // d strings of w chars '0'..'3'; terrain[y][x]; y = 0 is the SOUTH row
  openings: [{ x: 4, y: 2, levels: [0] }],  // OPTIONAL (DESIGN.md 13.1). Levels punched OUT of a column: each an
                                   // integer 0..3 STRICTLY BELOW that column's terrain height. One entry per
                                   // column (list all its levels together). Absent, null and [] all mean "none".
  emitter: { x: 0, y: 3, dir: 'E' },   // dir in 'E','N','W','S'; emits pitch 0 at level terrain[y][x]
  targets: [{ x: 5, y: 1 }],       // >= 1; orb sits at level terrain[y][x]
  fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/', secret: true }],  // pre-placed, immovable; secret = drawn as a plain mirror in the flat view
  tray: ['MIRROR', 'MIRROR', 'WEDGE'],  // inventory; tray.length >= par
  intro: 'optional one-line teaching text shown once',
  dark: true                       // OPTIONAL (DESIGN.md 15.1). A RENDERING flag: the board is drawn only where a
                                   // beam has been. Boolean if present - anything else throws. Absent means false.
                                   // The engine never reads it; a dark level traces identically to a lit one.
}
// PLACED PIECES: [{ x, y, type: 'MIRROR'|'WEDGE'|'DIP'|'FLOOR', orient: '/'|'\\' }]
// FLOOR (DESIGN.md 14) is a plate lying flat in the cell's top surface. Its two orientations are
// indistinguishable in the rules - it never turns the beam - and it is never `secret`, because from
// directly above it reads as a flat plate by silhouette and needs no disguise (14.3).
```

`parseLevel` returns:

```js
{ parsed: true, name, par, size:{w,d}, terrain: string[d] /* ALWAYS canonical '0'..'3' strings */,
  t: number[d][w] /* t[y][x] */,
  openings: [{x, y, levels:number[] /* ASCENDING, deduped */}],   // canonical copy; [] when the level had none
  openMask: number[d][w],                                        // openMask[y][x], bit z set = level z is open
  emitter:{x,y,dir}, targets:[{x,y}], fixed:[{x,y,type,orient,secret:boolean}], tray:[...], intro:'',
  dark: boolean }
```

`openings` is the readable form (a renderer wants it to draw the hole); `openMask` is the fast form
(the stepper wants `(openMask[y][x] >> z) & 1`). They always agree, they are fresh copies - the input
level is never mutated or aliased - and `openMask` is a full `d x w` grid of zeros on a level with no
openings, so a consumer can index it unconditionally. `LaserSim.isOpen(level, x, y, z)` wraps the
bit test for callers that would rather not shift.

`terrain` on the returned object is always an array of `d` strings of `w` chars, even when the input
gave a row as an array of digits, so a renderer may index `terrain[y][x]` as a char without checking.
`terrain[y]` and `t[y].join('')` are always equal.

**`parsed: true` is a label, not a trust token.** Idempotence is keyed off a module-private brand (a
`WeakSet` of the objects `parseLevel` itself produced), which a caller cannot forge. Passing a
hand-made `{ parsed: true, t: [...] }` object runs the full validation like any raw level, so it
either normalizes correctly or throws - it can no longer slide through and crash a renderer later.
Genuinely parsed levels are still returned as-is (`parseLevel(L) === L`), so the solver's parse-once /
trace-many pattern is unchanged.

Validation (each throws a descriptive `Error` whose message names the field): size is positive integers; exactly `d` terrain rows; a **string** row must be exactly `w` chars in `0..3`; an **array** row must have exactly `w` elements, each an integer `0..3` (checked element by element - `[10, 0]` is NOT three cells); emitter on-grid with a valid dir; at least one target, all on-grid, none on the emitter, no duplicates; fixed pieces on-grid, known type and orient, not on the emitter, a target, or another fixed piece; tray entries are known types; `tray.length >= par`; `par` a non-negative integer; `dark`, when present, is a **boolean** (`dark must be true or false when present, got string`) - it is never coerced, because `dark: 'false'` reading as true is exactly the sort of quiet bug a level file should not be able to ship.

`openings` validation (DESIGN.md 13.1), each throwing a descriptive `Error` naming the field:
`openings` is an array if present; each entry is an object naming an **on-grid integer** column
(`openings[i] must name an on-grid column`); no column appears twice
(`openings[i] duplicates the column (x,y) of an earlier entry`); `levels` is a **non-empty** array
(`openings[i] levels must be a non-empty array of integers 0..3`); each level is an **integer 0..3**
(`openings[i] levels[j] must be an integer 0..3`); each level is **strictly below** that column's
height (`openings[i] levels[j] is Z, which is not strictly below the height t=T of column (x,y)`) -
so a floor column can carry no opening at all; and no level is repeated within an entry
(`openings[i] repeats level Z`).

---

## 4. Rules as implemented (spec 3.2–3.4, with the resolved ambiguities)

Step from state `(x,y,z,d,v)`: next cell `(x+dx, y+dy)`, arrival level `z' = z+v`. Checks in this order:
1. off-grid -> `lost-edge` (checked FIRST, so a beam leaving the grid while climbing from z=3 reports `lost-edge` with endPoint z=4, not `lost-sky`);
2. `z' < 0` -> `lost-floor`; `z' > 3` -> `lost-sky`;
3. `t[next] > z'` **and level `z'` of that column is not open** -> `blocked` at the wall face. This is the
   entire rule change of DESIGN.md 13.2; `openMask` is all zeros without `openings`, so it reduces to
   the old `t[next] > z'`. A beam at an open level enters the cell normally - it is inside the column,
   and the terminal-stub geometry, `visited`, `segments` and everything else are unchanged;
4. **the emitter's own cell at its terrain level -> `blocked`** (the emitter body is a one-level-tall obstacle; the beam may fly over it) — *resolved ambiguity, spec is silent*;
5. otherwise enter. Then, in this order in the entered cell: target check, piece check, loop check.

Target: lit when entered at `z' == t[cell]` (from any direction, any pitch). Above the orb the beam flies over it and it is NOT lit. **A lit orb passes the beam through unchanged; the beam stops (`end:'target'`) only when the LAST unlit target is lit** — *resolved ambiguity*: the spec says both "the beam stops at the target" and "multi-target levels require all targets lit" with no splitter in v1; pass-through is the only reading under which a two-target level (spec 3.7, level 12) is solvable. Single-target levels behave exactly as "the beam stops at the target".

Piece: it is only MET when `z' == t[cell]`; the outgoing state is `{d, v} = LaserPieces.apply(type, orient, d, v)`, i.e. the entry's own `turn` table for the heading and its `dPitch` delta or `pitch(vIn)` function for the climb, clamped to -1..+1 (MIRROR dPitch 0, WEDGE +1, DIP -1, FLOOR flips -1 to +1 and leaves 0 and +1 alone) - a DELTA on the incoming pitch, spec 12, generalised by spec 14. **A piece that returns the incoming state unchanged does nothing at all**: the beam carries on as if the cell were bare and a `glide` event is emitted instead of a `piece` event (only a FLOOR can do this, under a level or climbing beam). A piece that changes the pitch without changing the heading also emits `bounce`. Above its level the beam passes over (`overflights`), keeping `d` and `v`; **below** it - only possible through an opening - the beam passes under (`underpasses`), also keeping `d` and `v`. Over, under and glide are reported separately and never merged. A pitched beam with no piece keeps its pitch cell after cell. Fixed and placed pieces behave identically; `pieceHits[i].fixed` tells them apart. If a placed piece is (illegally) on a fixed piece's cell, the fixed piece wins.

Loop guard: the start state is seeded; after each entered cell (post-piece) the state `(x,y,z,d,v)` is checked; a repeat -> `end:'loop'` with endPoint at that cell center. This state guard is what guarantees termination. There is also a step cap, but it is DERIVED per level (`LaserSim.stepCap`, section 2.1) so that it strictly exceeds the number of distinct states and can never fire first - `end:'loop'` therefore always means a genuine repeated state. `MAX_STEPS` (400) is only the cap's floor for tiny boards; it is NOT the cap in force on a 12x12..24x24 board, where a legal route may run to hundreds of steps. Note: in pure 2D, mirror dynamics are reversible so cycles cannot be entered; in 3D they can, because a beam can leave a cell at a different height than it entered the board at and because the pitch CLAMP is not injective - a WEDGE maps both `v=0` and `v=+1` to `+1`, so two different histories can merge into one state (see the loop test for a constructed example).

canPlace: false off-grid, on the emitter, on any target, on a fixed piece, on a placed piece; true on any other cell, including raised terrain (`t` 1..3) — the piece then sits at that level and only a beam at that level meets it. Openings do NOT change this: an opened column is placeable exactly like any other cell (the piece goes on its TOP), and because every open level is strictly below `t`, nothing can ever be placed inside an opening.

altitudeMarks: a mark at every pitch change (`{x,y,z}` of the piece cell at the beam's level there) plus the endPoint. A MIRROR never changes the pitch, so a MIRROR NEVER gets a mark. A WEDGE hit by an already-climbing beam and a DIP hit by an already-descending beam are clamped to no change, so they get no mark either; a DIP that levels a climber, and a WEDGE that levels a descender, do. A FLOOR gets a mark exactly when it bounces (`-1 -> +1`) and never when it is glided over.

---

## 5. Worked examples (level literal + exact `trace` output)

> The JSON in this section shows the legacy fields only. Every result also carries `events`
> (section 2.2), elided here to keep the examples readable; section 2.2 has a fully worked
> `events` example.

### Example A — FIRST BOUNCE (pure 2D). One MIRROR, target hit.

```json
{
  "name": "FIRST BOUNCE",
  "par": 1,
  "size": {
    "w": 5,
    "d": 5
  },
  "terrain": [
    "00000",
    "00000",
    "00000",
    "00000",
    "00000"
  ],
  "emitter": {
    "x": 0,
    "y": 2,
    "dir": "E"
  },
  "targets": [
    {
      "x": 2,
      "y": 4
    }
  ],
  "fixed": [],
  "tray": [
    "MIRROR"
  ],
  "intro": "Tap a cell to place a mirror. Tap it again to rotate."
}
```

```
placed = [{"x":2,"y":2,"type":"MIRROR","orient":"/"}]

{
  "segments": [
    {"from":{"x":0,"y":2,"z":0},"to":{"x":1,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":1,"y":2,"z":0},"to":{"x":2,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":2,"y":2,"z":0},"to":{"x":2,"y":3,"z":0},"d":"N","v":0},
    {"from":{"x":2,"y":3,"z":0},"to":{"x":2,"y":4,"z":0},"d":"N","v":0}
  ],
  "visited": [
    {"x":1,"y":2,"z":0,"d":"E","v":0},
    {"x":2,"y":2,"z":0,"d":"E","v":0},
    {"x":2,"y":3,"z":0,"d":"N","v":0},
    {"x":2,"y":4,"z":0,"d":"N","v":0}
  ],
  "hits": [0],
  "allTargetsHit": true,
  "end": "target",
  "endPoint": {"x":2,"y":4,"z":0},
  "altitudeMarks": [{"x":2,"y":4,"z":0}],
  "pieceHits": [{"x":2,"y":2,"type":"MIRROR","orient":"/","fixed":false}],
  "overflights": []
}
```

### Example B — LOW WALL (hidden height). Emitter on a t=1 ridge; the t=1 wall at (2,2) is flown over; the mirror on the t=1 cell (4,2) acts at level 1; the target on the t=1 cell (4,4) is hit at level 1.

```json
{
  "name": "LOW WALL",
  "par": 1,
  "size": {
    "w": 6,
    "d": 5
  },
  "terrain": [
    "000000",
    "000000",
    "101010",
    "000000",
    "000010"
  ],
  "emitter": {
    "x": 0,
    "y": 2,
    "dir": "E"
  },
  "targets": [
    {
      "x": 4,
      "y": 4
    }
  ],
  "fixed": [],
  "tray": [
    "MIRROR",
    "MIRROR"
  ]
}
```

With nothing placed the beam flies over the low wall and exits east (`lost-edge`; `endPoint` is the off-grid cell center):

```
placed = []

{
  "segments": [
    {"from":{"x":0,"y":2,"z":1},"to":{"x":1,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":1,"y":2,"z":1},"to":{"x":2,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":2,"y":2,"z":1},"to":{"x":3,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":3,"y":2,"z":1},"to":{"x":4,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":4,"y":2,"z":1},"to":{"x":5,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":5,"y":2,"z":1},"to":{"x":6,"y":2,"z":1},"d":"E","v":0}
  ],
  "visited": [
    {"x":1,"y":2,"z":1,"d":"E","v":0},
    {"x":2,"y":2,"z":1,"d":"E","v":0},
    {"x":3,"y":2,"z":1,"d":"E","v":0},
    {"x":4,"y":2,"z":1,"d":"E","v":0},
    {"x":5,"y":2,"z":1,"d":"E","v":0}
  ],
  "hits": [],
  "allTargetsHit": false,
  "end": "lost-edge",
  "endPoint": {"x":6,"y":2,"z":1},
  "altitudeMarks": [{"x":6,"y":2,"z":1}],
  "pieceHits": [],
  "overflights": []
}
```

Solved with one MIRROR on the raised cell (4,2):

```
placed = [{"x":4,"y":2,"type":"MIRROR","orient":"/"}]

{
  "segments": [
    {"from":{"x":0,"y":2,"z":1},"to":{"x":1,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":1,"y":2,"z":1},"to":{"x":2,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":2,"y":2,"z":1},"to":{"x":3,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":3,"y":2,"z":1},"to":{"x":4,"y":2,"z":1},"d":"E","v":0},
    {"from":{"x":4,"y":2,"z":1},"to":{"x":4,"y":3,"z":1},"d":"N","v":0},
    {"from":{"x":4,"y":3,"z":1},"to":{"x":4,"y":4,"z":1},"d":"N","v":0}
  ],
  "visited": [
    {"x":1,"y":2,"z":1,"d":"E","v":0},
    {"x":2,"y":2,"z":1,"d":"E","v":0},
    {"x":3,"y":2,"z":1,"d":"E","v":0},
    {"x":4,"y":2,"z":1,"d":"E","v":0},
    {"x":4,"y":3,"z":1,"d":"N","v":0},
    {"x":4,"y":4,"z":1,"d":"N","v":0}
  ],
  "hits": [0],
  "allTargetsHit": true,
  "end": "target",
  "endPoint": {"x":4,"y":4,"z":1},
  "altitudeMarks": [{"x":4,"y":4,"z":1}],
  "pieceHits": [{"x":4,"y":2,"type":"MIRROR","orient":"/","fixed":false}],
  "overflights": []
}
```

### Example C — HIDDEN RAMP (secret fixed WEDGE). From above, (3,2) looks like a plain fixed mirror; it is a wedge, so the beam turns north AND climbs 1,2,3 then is lost to the sky. A **DIP** on the t=2 cell (3,4) levels the beam at z=2 (`+1 - 1 = 0`) and sends it east to the plateau target at (5,4), t=2. Under the corrected rule a MIRROR there would NOT work: it preserves the climb, so the beam would still fly off into the sky one cell later. Levelling a climber takes a DIP.

```json
{
  "name": "HIDDEN RAMP",
  "par": 1,
  "size": {
    "w": 6,
    "d": 7
  },
  "terrain": [
    "000000",
    "000000",
    "000000",
    "000000",
    "000202",
    "000000",
    "000000"
  ],
  "emitter": {
    "x": 0,
    "y": 2,
    "dir": "E"
  },
  "targets": [
    {
      "x": 5,
      "y": 4
    }
  ],
  "fixed": [
    {
      "x": 3,
      "y": 2,
      "type": "WEDGE",
      "orient": "/",
      "secret": true
    }
  ],
  "tray": [
    "DIP"
  ]
}
```

Nothing placed (`lost-sky`: the stub ends at the boundary y=5.5 with the same z=3; the segment's `v:1` tells the renderer to slope it):

```
placed = []

{
  "segments": [
    {"from":{"x":0,"y":2,"z":0},"to":{"x":1,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":1,"y":2,"z":0},"to":{"x":2,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":2,"y":2,"z":0},"to":{"x":3,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":3,"y":2,"z":0},"to":{"x":3,"y":3,"z":1},"d":"N","v":1},
    {"from":{"x":3,"y":3,"z":1},"to":{"x":3,"y":4,"z":2},"d":"N","v":1},
    {"from":{"x":3,"y":4,"z":2},"to":{"x":3,"y":5,"z":3},"d":"N","v":1},
    {"from":{"x":3,"y":5,"z":3},"to":{"x":3,"y":5.5,"z":3},"d":"N","v":1}
  ],
  "visited": [
    {"x":1,"y":2,"z":0,"d":"E","v":0},
    {"x":2,"y":2,"z":0,"d":"E","v":0},
    {"x":3,"y":2,"z":0,"d":"E","v":0},
    {"x":3,"y":3,"z":1,"d":"N","v":1},
    {"x":3,"y":4,"z":2,"d":"N","v":1},
    {"x":3,"y":5,"z":3,"d":"N","v":1}
  ],
  "hits": [],
  "allTargetsHit": false,
  "end": "lost-sky",
  "endPoint": {"x":3,"y":5.5,"z":3},
  "altitudeMarks": [{"x":3,"y":2,"z":0},{"x":3,"y":5.5,"z":3}],
  "pieceHits": [{"x":3,"y":2,"type":"WEDGE","orient":"/","fixed":true}],
  "overflights": []
}
```

Solved (note the altitude marks: wedge at z=0, levelling DIP at z=2, end at z=2):

```
placed = [{"x":3,"y":4,"type":"DIP","orient":"/"}]

{
  "segments": [
    {"from":{"x":0,"y":2,"z":0},"to":{"x":1,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":1,"y":2,"z":0},"to":{"x":2,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":2,"y":2,"z":0},"to":{"x":3,"y":2,"z":0},"d":"E","v":0},
    {"from":{"x":3,"y":2,"z":0},"to":{"x":3,"y":3,"z":1},"d":"N","v":1},
    {"from":{"x":3,"y":3,"z":1},"to":{"x":3,"y":4,"z":2},"d":"N","v":1},
    {"from":{"x":3,"y":4,"z":2},"to":{"x":4,"y":4,"z":2},"d":"E","v":0},
    {"from":{"x":4,"y":4,"z":2},"to":{"x":5,"y":4,"z":2},"d":"E","v":0}
  ],
  "visited": [
    {"x":1,"y":2,"z":0,"d":"E","v":0},
    {"x":2,"y":2,"z":0,"d":"E","v":0},
    {"x":3,"y":2,"z":0,"d":"E","v":0},
    {"x":3,"y":3,"z":1,"d":"N","v":1},
    {"x":3,"y":4,"z":2,"d":"N","v":1},
    {"x":4,"y":4,"z":2,"d":"E","v":0},
    {"x":5,"y":4,"z":2,"d":"E","v":0}
  ],
  "hits": [0],
  "allTargetsHit": true,
  "end": "target",
  "endPoint": {"x":5,"y":4,"z":2},
  "altitudeMarks": [{"x":3,"y":2,"z":0},{"x":3,"y":4,"z":2},{"x":5,"y":4,"z":2}],
  "pieceHits": [{"x":3,"y":2,"type":"WEDGE","orient":"/","fixed":true},{"x":3,"y":4,"type":"DIP","orient":"/","fixed":false}],
  "overflights": []
}
```

### Example D — ARCHWAY (an opening, DESIGN.md 13). The `t=3` tower at (3,2) is open at level 0, so the floor beam crosses a cell that looks solid from directly above. Raise the emitter one level and the identical board blocks it.

```json
{
  "name": "ARCHWAY",
  "par": 1,
  "size": { "w": 7, "d": 7 },
  "terrain": ["0000000", "0000000", "0003000", "0000000", "0000000", "0000000", "0000000"],
  "openings": [{ "x": 3, "y": 2, "levels": [0] }],
  "emitter": { "x": 0, "y": 2, "dir": "E" },
  "targets": [{ "x": 5, "y": 5 }],
  "fixed": [],
  "tray": ["MIRROR"]
}
```

`parseLevel` turns that into `openMask[2] = [0,0,0,1,0,0,0]` (bit 0 set on column x=3) and leaves
`t[2][3] = 3` and `terrain[2] = "0003000"` untouched — the top surface, which is all the FLAT camera
can see, is identical to any other tower.

```
placed = [{"x":5,"y":2,"type":"MIRROR","orient":"/"}]

segments:  (0,2,0)->(1,2,0)->(2,2,0)->(3,2,0)->(4,2,0)->(5,2,0) then N to (5,3,0),(5,4,0),(5,5,0)
visited:   every step at z 0, v 0; (3,2) is entered at z=0 INSIDE the t=3 column
end:       "target"        endPoint: {"x":5,"y":5,"z":0}      hits: [0]
pieceHits: [{"x":5,"y":2,"type":"MIRROR","orient":"/","fixed":false}]
overflights: []            underpasses: []      altitudeMarks: [{"x":5,"y":5,"z":0}]
```

Change `terrain[2]` to `"1003000"` so the emitter sits on a ridge and fires at level 1, and the same
board stops the beam dead: level 1 of that column is solid.

```
end: "blocked"    endPoint: {"x":2.5,"y":2,"z":1}
```

That pair is the whole of section 13: same terrain, same tower, different beam height, opposite
answer. Put a MIRROR on the arch's own cell and it is neither hit nor flown over — it is passed
UNDER, `underpasses: [{"x":3,"y":2}]` with a matching `underpass` event, and the beam carries on
unchanged.

### Example E — SKIP PAD (a FLOOR mirror, DESIGN.md 14). The plate at (2,3) is FIXED. A DIP at (2,4) drops the beam off the `t=1` ridge; the plate throws it back up **on the same heading**; the climb lands it on the `t=2` plateau orb at (2,1). A MIRROR at (2,4) instead keeps the beam level at `z=1` and is stopped by the plateau's own wall face, and a WEDGE overshoots — so this board's par-1 answer is forced to bounce.

```json
{
  "name": "SKIP PAD",
  "par": 1,
  "size": { "w": 5, "d": 5 },
  "terrain": ["00000", "00200", "00000", "00000", "10100"],
  "emitter": { "x": 0, "y": 4, "dir": "E" },
  "targets": [{ "x": 2, "y": 1 }],
  "fixed": [{ "x": 2, "y": 3, "type": "FLOOR", "orient": "/", "secret": false }],
  "tray": ["DIP", "MIRROR"]
}
```

```
placed = [{"x":2,"y":4,"type":"DIP","orient":"\\"}]

visited:   (1,4) z1 E v0 | (2,4) z1 E v0 | (2,3) z0 S v-1 | (2,2) z1 S v+1 | (2,1) z2 S v+1
end:       "target"      endPoint: {"x":2,"y":1,"z":2}      hits: [0]
pieceHits: [{"x":2,"y":4,"type":"DIP",...,"fixed":false}, {"x":2,"y":3,"type":"FLOOR",...,"fixed":true}]
bounces:   [{"x":2,"y":3,"z":0}]        glides: []      overflights: []
altitudeMarks: [{"x":2,"y":4,"z":1}, {"x":2,"y":3,"z":0}, {"x":2,"y":1,"z":2}]
```

The plate's `piece` event reads `"dIn":"S","dOut":"S","vIn":-1,"vOut":1` — the heading does not move,
which is the whole of 14.1 — and it is followed by a `pitch` event and a `bounce` event at the same
step. Raise the emitter's column to `t=2` so the beam arrives at the plate **level** instead of
falling, and the same plate does nothing at all: no `piece` event, no `pieceHits` entry, one
`glide` event and one entry in `glides`, and the beam sails on as if the cell were bare.

---

## 6. Notes for downstream engineers

- **Floor mirrors (DESIGN.md 14)**: `FLOOR` needs its own tray card, its own icon (14.3: lying flat, so the silhouette alone distinguishes it from the three upright pieces) and its own mesh - and it is the one piece never drawn as a decoy mirror, because it is never `secret`. Its two orientations are identical in the rules; the rotate tap still works, it just changes nothing. For the fair tell of 14.3, drive the bright dot from `bounces` / the `bounce` event, not from a plate's presence: a plate the beam glides over must not light up. `glides` is the third kind of miss beside `overflights` and `underpasses` and should read differently on screen - the beam is skimming the plate's own surface, not passing it at another height.
- **Darkness (DESIGN.md 15)**: `parseLevel(level).dark` is the flag; the engine does nothing else with it. What is KNOWN is the renderer's own accumulated state, seeded from the emitter and the target cells and grown from `visited` after each trace.
- **Openings (DESIGN.md 13)**: draw terrain per solid VOXEL, not as one column box, so a hole is a real hole - `LaserSim.isOpen(level, x, y, z)` (or `openMask[y][x]`) says which voxels exist. In FLAT the top surface is unchanged and the only difference is the light leak of 13.3. `underpasses` / the `underpass` event is the beam going UNDER a piece; `overflights` is still only OVER one. A blocked shot's readout should name the height the beam was travelling at, which is `endPoint.z` on the terminal stub (the level the beam was LEAVING; add the last segment's `v` for the level it would have arrived at).
- **Renderer / audio**: drive lighting, badges and sounds from `events` (section 2.2), not from matching `visited`/`hits` cells on `x, y`. A beam can enter one `(x, y)` at several heights; only an `events` `target` entry means the orb actually lit, and each event's `step` indexes the segment it belongs to, so animation timing follows cumulative arc length. Beam height in world units is `z + 0.5`; a segment with `v != 0` is a 45-degree diagonal from `from.z+0.5` to `to.z+0.5`. Terminal stubs keep `from.z` in `to.z`; slope them by `v` if you want the physically exact end (floor at height 0, sky at height 4 are reached exactly at the boundary). `endPoint` is where the altitude badge and the "lost/blocked" spark go.
- **Solver**: to test whether a trace ended on the safety-net cap rather than a real cycle, compare `segments.length` with `LaserSim.stepCap(level)`, never with `MAX_STEPS` (which is only the cap's floor and is far below the cap on a 12x12+ board). `visited` is the pruning set — a new piece can only change the beam if placed on a visited `(x,y)` whose `t[y][x] == z` at that visit (and `canPlace` is true). Parse once, then pass the parsed level to `trace`.
- **UI**: `hits.length` vs `targets.length` for the HUD; `end` for the status line; `pieceHits[].fixed === true && level.fixed[i].secret` is the reveal moment.
- Run the tests with `node --test test/sim.test.mjs` (or `node --test 'test/**/*.test.mjs'`; the installed Node 26 rejects a bare directory argument with MODULE_NOT_FOUND).
