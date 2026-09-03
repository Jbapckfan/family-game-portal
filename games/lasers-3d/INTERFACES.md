# Lasers 3D rules engine — INTERFACES

Shipped files (all under `games/lasers-3d/`):

- `src/pieces.js` — piece registry + turn tables (UMD: `window.LaserPieces` / `module.exports`)
- `src/sim.js` — stepper + public API (UMD: `window.LaserSim` / `module.exports`; loads `pieces.js` itself)
- `test/sim.test.mjs` — `node:test` suite, 35 tests, one or more per bullet of spec 3.2, 3.3, 3.4

Implements DESIGN.md section 3 (FROZEN). Pure, deterministic, no DOM, no Three.js, no dependencies, ES2019 (Safari 15).

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
LaserSim.MAX_STEPS       // 400 (loop guard step cap)                                      [added]
LaserSim.ORIENTS         // ['/', '\\']                                                    [added]
LaserSim.PIECES          // registry from pieces.js: { MIRROR:{pitch:0,...}, WEDGE:{pitch:1,...}, DIP:{pitch:-1,...} }
LaserSim.TURN            // turn tables: TURN['/'] and TURN['\\'], each { E, N, W, S } -> outgoing dir  [added, same object as LaserPieces.TURN]

LaserSim.parseLevel(level) -> normalized level (see section 3). Throws Error('lasers-3d level: ...') on a malformed level.
LaserSim.canPlace(level, placed, x, y) -> boolean (rule 3.4)
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
    overflights: [{x,y}]           // cells whose piece the beam passed OVER (beam level above the piece's terrain level), in order
}
```

`placed` may be omitted or `[]`. `level` may be raw (schema below) or already parsed; `parseLevel` is idempotent (a parsed level is returned as is, so a solver can parse once and call `trace` many times).

`trace` never throws on a valid level. It throws only if a *placed* piece has an unknown `type` or `orient` (that is a caller bug, not a level bug). Inputs are never mutated.

### 2.1 `src/pieces.js` (also exported, for the tray UI and future twist pieces)

```
LaserPieces.TURN          // { '/': {E:'N',N:'E',W:'S',S:'W'}, '\\': {E:'S',S:'E',W:'N',N:'W'} }
LaserPieces.ORIENTS       // ['/', '\\']
LaserPieces.PIECES        // { MIRROR:{type,pitch:0,turn,label:'Mirror',tag:'',hint}, WEDGE:{pitch:1,label:'Wedge',tag:'^'}, DIP:{pitch:-1,label:'Dip',tag:'v'} }
LaserPieces.TYPES         // ['MIRROR','WEDGE','DIP']
LaserPieces.isType(t), isOrient(o)
LaserPieces.rotate(orient)             // '/' -> '\\' -> '/'
LaserPieces.apply(type, orient, dir)   // -> { d: outgoingDir, v: outgoingPitch }
```

A piece is data `{turn, pitch}`; the stepper never special-cases a type. A new twist piece = one more registry entry.

---

## 3. Level schema (frozen; every module consumes exactly this)

```js
{
  name: 'FIRST BOUNCE',            // display name
  par: 1,                          // minimum pieces, proven by the solver (>= 0; default 0 if absent)
  size: { w: 7, d: 7 },            // w cells east-west (x), d cells north-south (y)
  terrain: ['0000000', ...],       // d strings of w chars '0'..'3'; terrain[y][x]; y = 0 is the SOUTH row
  emitter: { x: 0, y: 3, dir: 'E' },   // dir in 'E','N','W','S'; emits pitch 0 at level terrain[y][x]
  targets: [{ x: 5, y: 1 }],       // >= 1; orb sits at level terrain[y][x]
  fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/', secret: true }],  // pre-placed, immovable; secret = drawn as a plain mirror in the flat view
  tray: ['MIRROR', 'MIRROR', 'WEDGE'],  // inventory; tray.length >= par
  intro: 'optional one-line teaching text shown once'
}
// PLACED PIECES: [{ x, y, type: 'MIRROR'|'WEDGE'|'DIP', orient: '/'|'\\' }]
```

`parseLevel` returns:

```js
{ parsed: true, name, par, size:{w,d}, terrain: [...original strings], t: number[d][w] /* t[y][x] */,
  emitter:{x,y,dir}, targets:[{x,y}], fixed:[{x,y,type,orient,secret:boolean}], tray:[...], intro:'' }
```

Validation (each throws a descriptive `Error` whose message names the field): size is positive integers; exactly `d` terrain rows of exactly `w` chars in `0..3` (a row may also be an array of digits); emitter on-grid with a valid dir; at least one target, all on-grid, none on the emitter, no duplicates; fixed pieces on-grid, known type and orient, not on the emitter, a target, or another fixed piece; tray entries are known types; `tray.length >= par`; `par` a non-negative integer.

---

## 4. Rules as implemented (spec 3.2–3.4, with the resolved ambiguities)

Step from state `(x,y,z,d,v)`: next cell `(x+dx, y+dy)`, arrival level `z' = z+v`. Checks in this order:
1. off-grid -> `lost-edge` (checked FIRST, so a beam leaving the grid while climbing from z=3 reports `lost-edge` with endPoint z=4, not `lost-sky`);
2. `z' < 0` -> `lost-floor`; `z' > 3` -> `lost-sky`;
3. `t[next] > z'` -> `blocked` at the wall face;
4. **the emitter's own cell at its terrain level -> `blocked`** (the emitter body is a one-level-tall obstacle; the beam may fly over it) — *resolved ambiguity, spec is silent*;
5. otherwise enter. Then, in this order in the entered cell: target check, piece check, loop check.

Target: lit when entered at `z' == t[cell]` (from any direction, any pitch). Above the orb the beam flies over it and it is NOT lit. **A lit orb passes the beam through unchanged; the beam stops (`end:'target'`) only when the LAST unlit target is lit** — *resolved ambiguity*: the spec says both "the beam stops at the target" and "multi-target levels require all targets lit" with no splitter in v1; pass-through is the only reading under which a two-target level (spec 3.7, level 12) is solvable. Single-target levels behave exactly as "the beam stops at the target".

Piece: acts only when `z' == t[cell]`; sets `d = TURN[orient][d]` and `v = piece.pitch` (MIRROR 0, WEDGE +1, DIP -1). Above its level the beam passes over (`overflights`), keeping `d` and `v`. A pitched beam with no piece keeps its pitch cell after cell. Fixed and placed pieces behave identically; `pieceHits[i].fixed` tells them apart. If a placed piece is (illegally) on a fixed piece's cell, the fixed piece wins.

Loop guard: the start state is seeded; after each entered cell (post-piece) the state `(x,y,z,d,v)` is checked; a repeat -> `end:'loop'` with endPoint at that cell center. A 400-step cap also ends with `'loop'`. Note: in pure 2D, mirror dynamics are reversible so cycles cannot be entered; in 3D they can, because pieces RESET pitch (see the loop test for a constructed example).

canPlace: false off-grid, on the emitter, on any target, on a fixed piece, on a placed piece; true on any other cell, including raised terrain (`t` 1..3) — the piece then sits at that level and only a beam at that level meets it.

altitudeMarks: a mark at every pitch change (`{x,y,z}` of the piece cell at the beam's level there) plus the endPoint. A MIRROR hit by a level beam changes nothing and gets no mark; a MIRROR that levels a climbing beam does.

---

## 5. Worked examples (level literal + exact `trace` output)

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

### Example C — HIDDEN RAMP (secret fixed WEDGE). From above, (3,2) looks like a plain fixed mirror; it is a wedge, so the beam turns north AND climbs 1,2,3 then is lost to the sky. A MIRROR on the t=2 cell (3,4) levels the beam at z=2 and sends it east to the plateau target at (5,4), t=2.

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
    "MIRROR"
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

Solved (note the altitude marks: wedge at z=0, leveling mirror at z=2, end at z=2):

```
placed = [{"x":3,"y":4,"type":"MIRROR","orient":"/"}]

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
  "pieceHits": [{"x":3,"y":2,"type":"WEDGE","orient":"/","fixed":true},{"x":3,"y":4,"type":"MIRROR","orient":"/","fixed":false}],
  "overflights": []
}
```

---

## 6. Notes for downstream engineers

- **Renderer**: beam height in world units is `z + 0.5`; a segment with `v != 0` is a 45-degree diagonal from `from.z+0.5` to `to.z+0.5`. Terminal stubs keep `from.z` in `to.z`; slope them by `v` if you want the physically exact end (floor at height 0, sky at height 4 are reached exactly at the boundary). `endPoint` is where the altitude badge and the "lost/blocked" spark go.
- **Solver**: `visited` is the pruning set — a new piece can only change the beam if placed on a visited `(x,y)` whose `t[y][x] == z` at that visit (and `canPlace` is true). Parse once, then pass the parsed level to `trace`.
- **UI**: `hits.length` vs `targets.length` for the HUD; `end` for the status line; `pieceHits[].fixed === true && level.fixed[i].secret` is the reveal moment.
- Run the tests with `node --test test/sim.test.mjs` (or `node --test 'test/**/*.test.mjs'`; the installed Node 26 rejects a bare directory argument with MODULE_NOT_FOUND).
