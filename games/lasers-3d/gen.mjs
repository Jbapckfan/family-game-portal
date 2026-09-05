// Lasers 3D - CONSTRUCTIVE level generator (DESIGN.md section 6, rebuilt for 12x12..24x24 boards).
// Node tooling only (.mjs). Deterministic: seeded mulberry32, never Math.random.
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row (INTERFACES.md section 0).
//
// WHY THIS IS NOT THE OLD GENERATOR
// The old pipeline was generate-then-solve: sprinkle random terrain, then ask the solver for par.
// On a 20x20 board the solve dominates and almost every proposal is rejected, so the yield collapses.
// This generator is PATH-FIRST: it walks the beam it wants, then builds the board around that beam,
// so every candidate is solvable by construction at exactly the intended par. The solver is then used
// only to FALSIFY - to prove no cheaper solution exists (bounded to depth par-1, the cheap half) and
// to prove 3D-necessity. Terrain is also the repair tool: an unwanted solution is killed by raising
// one cell of ITS beam that is not on the intended path, which can never touch the intended path.
//
// PITCH IS A DELTA (DESIGN.md section 12). walkPath tracks the beam's pitch as state and asks
// LaserPieces.applyPitch(type, v) for the outgoing one, exactly as the stepper does; it can no longer
// read an absolute pitch off the registry. The consequence for level DESIGN is the interesting part:
// a climbing beam can only be levelled by a DIP, so the plan 'WEDGE ... DIP' is the shape that
// teaches the corrected rule and the generator now scores it as its own concept (climb-then-level).
//
// FLOOR MIRRORS (DESIGN.md section 14). The registry grew a piece that does NOT turn the beam and that
// acts only on a FALLING one, so two assumptions inside walkPath had to go:
//   - "a planned piece always changes the beam". It does not: a plate under a level or climbing beam
//     is glided over, and a no-op on the intended path would make par a lie (the solver would find the
//     same route one piece cheaper). walkPath now refuses any candidate for which
//     LaserPieces.acts(type, orient, dir, v) is false in BOTH orientations - derived from the registry,
//     so a future inert piece is refused too without naming a type.
//   - "the two orientations are two options". For a plate they are the same option, because the
//     outgoing heading comes from the entry's own turn table (LaserPieces.turnDir) and TURN_KEEP is the
//     identity. The option list is deduped by outgoing direction.
// The design consequence worth knowing before writing a plan: a plate needs the beam to arrive with
// pitch -1, so the leg before it must be a descent, which means the level must start ABOVE the floor
// (`emitterZ >= 1`). And because a bounce leaves the beam CLIMBING while one DIP only levels a climber
// (the clamp of spec 12.2), a SECOND trough costs two dips: the skipping-stone plan is
// DIP, FLOOR, DIP, DIP, FLOOR, DIP - which is exactly what slot 22 of tools/gen-batches.mjs asks for.
//
// PRE-PLACED PIECES (14.5) and DARKNESS (15). `fixedIdxs` promotes several planned pieces to `fixed`
// (the old single `fixedIdx` still works), `secret` may be a boolean or a list of the indices that are
// disguised, and `spec.dark` puts `dark: true` on the emitted level. All three are level data; none of
// them changes a single step of the beam.
//
// PIPELINE (buildLevel):
//   1. walkPath      emitter on an edge facing inward; alternate straight runs with piece placements,
//                    tracking (x, y, z, d, v) exactly as LaserSim.trace would - including the pitch
//                    DELTA and its clamp; z stays in 0..3, on-grid, never revisiting a cell. The piece
//                    count on the path is the intended par.
//   2. layTerrain    piece / emitter / target cells get t = the beam's level there (a plateau target when
//                    that level is > 0); pass cells get raised into ridges and staircases the beam flies
//                    OVER (t <= z) - the hidden-height reveals.
//   2b. punchOpenings ARCHES AND WINDOWS (DESIGN.md section 13). The generator AUTHORS them: it takes a
//                    cell the beam already crosses, RAISES that column to full height, and punches out
//                    exactly the level the beam uses. From above the column is now indistinguishable
//                    from any other tower, so the route reads as impossible - which is the point. A
//                    pass cell at z = 0 becomes an ARCH (the beam goes under); a pass cell at z >= 1
//                    becomes a WINDOW (the beam threads it at one exact height). Short wing walls are
//                    grown to either side, off the path, so the shape reads as a wall with a hole in
//                    it rather than a lone spike. This never touches the intended trace: the column is
//                    open at exactly the level the beam is at, and the wings are on non-path cells.
//   3. decorate      ridges, plateaus and towers on non-path cells up to a coverage target. Every edit is
//                    re-traced against the intended solution and rolled back if the solution stops working.
//   4. repair        loop: kill any solution shorter than par, any same-length solution missing a required
//                    concept, and any flat (classic 2D) solution that still works in 3D, by walling one
//                    non-path cell of that solution's beam. Re-verify after every edit.
//   5. verify        intended solution replays to allTargetsHit; proveMinimal at depth par-1 inside the
//                    node budget; needs3D; not a trivial straight shot.
//
// CLI:
//   node gen.mjs --w 20 --d 20 --plan MIRROR,WEDGE,MIRROR --seed 1 --count 2
//   node gen.mjs --w 20 --d 20 --plan DIP,FLOOR,DIP --emitterZ 2 --seed 1
//     (a FLOOR plan needs --emitterZ >= 1: a plate only ever acts on a FALLING beam, and a beam
//      already on the floor cannot fall - see DESIGN.md 14.1 and walkPath's `Pieces.acts` guard)
//   (the shipped 20-level curve lives in tools/gen-batches.mjs, which drives generate() slot by slot)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { solve, needs3D, replay, proveMinimal, flatten } from './solver.mjs';
const require = createRequire(import.meta.url);
const Sim = require('./src/sim.js');
const Pieces = require('./src/pieces.js');

const ALL_TYPES = Object.keys(Sim.PIECES);
const ORIENTS = Sim.ORIENTS;
const DIRS = Sim.DIRS;
const TURN = Sim.TURN;
const H_MAX = Sim.H_MAX; // 4 -> levels 0..3

/* ---------- PRNG ---------- */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rint(r, n) { return Math.floor(r() * n); }
function pick(r, arr) { return arr[rint(r, arr.length)]; }
function shuffle(r, arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = rint(r, i + 1); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
}
const key = (x, y) => x + ',' + y;

/* ---------- 1. the beam walk ---------- */

// How many consecutive legal steps a beam at (x,y,z) heading d with pitch v can take:
// on-grid, arrival level inside 0..3, and never onto a cell the path already owns.
function roomAhead(x, y, z, d, v, used, w, h, limit) {
  const dx = DIRS[d].dx, dy = DIRS[d].dy;
  let n = 0;
  let cx = x, cy = y, cz = z;
  while (n < limit) {
    cx += dx; cy += dy; cz += v;
    if (cx < 0 || cy < 0 || cx >= w || cy >= h) break;
    if (cz < 0 || cz >= H_MAX) break;
    if (used.has(key(cx, cy))) break;
    n++;
  }
  return n;
}

// A pitched beam runs out of sky (or floor) before it runs out of board: a climb from level z has
// only H_MAX-1-z cells left, a descent only z. The run-length floor has to bend to that or every
// WEDGE / DIP level is rejected before it is ever built.
// Straight runs are drawn long-biased (best of two): long straights are the good-looking half of a
// big board, and short legs make the path fail the span / length quality gates anyway.
function longRun(r, lo, hi) {
  if (hi <= lo) return lo;
  const n = hi - lo + 1;
  return lo + Math.max(rint(r, n), rint(r, n));
}

// How many more cells a beam at level z with pitch v can travel before the sky or the floor stops it.
function headroom(z, v) { return v > 0 ? (H_MAX - 1 - z) : v < 0 ? z : Infinity; }

function runFloor(spec, z, v, isFinal) {
  return Math.max(1, Math.min(isFinal ? spec.minFinalRun : spec.minRun, headroom(z, v)));
}

// THE DELTA RULE'S EFFECT ON PATH WALKING (DESIGN.md section 12).
// A straight run at pitch v moves the beam's LEVEL, and the next piece's outgoing pitch depends on
// the pitch it is hit with, so a run has to stop short of the ceiling (or the floor) or the leg after
// it has nowhere to go. Under the old set-pitch rule this never bit: a MIRROR always reset v to 0, so
// any run could be followed by a level leg. Now a climb carried through a MIRROR keeps climbing, and
// a run that goes all the way to z=3 strands the beam.
// Returns the LONGEST run length in [minLen, want] that leaves `wantRoom` cells for the next leg,
// or null when no length does.
function fitRun(z, v, vOut, want, minLen, wantRoom) {
  for (let len = want; len >= minLen; len--) {
    const zz = z + v * len;
    if (zz < 0 || zz >= H_MAX) continue;
    if (headroom(zz, vOut) >= wantRoom) return len;
  }
  return null;
}

function pickEmitter(r, w, h) {
  const side = rint(r, 4);
  // keep off the exact corners so the walk has room on both hands
  const px = 1 + rint(r, Math.max(1, w - 2));
  const py = 1 + rint(r, Math.max(1, h - 2));
  if (side === 0) return { x: 0, y: py, dir: 'E' };
  if (side === 1) return { x: w - 1, y: py, dir: 'W' };
  if (side === 2) return { x: px, y: 0, dir: 'N' };
  return { x: px, y: h - 1, dir: 'S' };
}

/**
 * walkPath(r, spec) -> { emitter, path } | null
 * path entries: { x, y, z, v, role: 'emitter'|'pass'|'piece'|'target', type?, orient? } in beam order.
 * `v` is the pitch the beam ARRIVES at that cell with, which is what punchOpenings needs to tell a
 * window the beam merely flies past while climbing from one it arrives at level and on purpose.
 * The state (x, y, z, d, v) is advanced exactly as LaserSim.trace advances it.
 */
function walkPath(r, spec) {
  const w = spec.w, h = spec.d;
  const em = pickEmitter(r, w, h);
  let x = em.x, y = em.y, z = spec.emitterZ, dir = em.dir, v = 0;
  const used = new Set([key(x, y)]);
  const path = [{ x, y, z, v: 0, dir, role: 'emitter' }];

  const advance = (n) => {
    for (let k = 0; k < n; k++) {
      x += DIRS[dir].dx; y += DIRS[dir].dy; z += v;
      used.add(key(x, y));
      path.push({ x, y, z, v, dir, role: 'pass' });
    }
  };

  for (let i = 0; i < spec.plan.length; i++) {
    const isLast = i === spec.plan.length - 1;
    // the opening leg is allowed to be extra long: the beam crossing open board reads well
    const cap = i === 0 ? spec.maxRun + 4 : spec.maxRun;
    const room = roomAhead(x, y, z, dir, v, used, w, h, cap);
    // A climb that has already hit level 3 (or a dip that reached the floor) cannot advance another
    // cell; the piece then goes ON the last cell of that run - the "mirror at the top of the ramp".
    const canReuse = path[path.length - 1].role === 'pass';
    if (room === 0 && !canReuse) return null;
    const minLen = canReuse ? 0 : 1;
    // A PITCHED run is what sets the height the next level leg sits at: climbing k cells from z
    // leaves the beam at z + k, and fitRun below always takes the LONGEST run that fits, so an
    // unconstrained climb from the floor always tops out at H_MAX-1 = 3. `maxPitchedRun` caps it, which
    // is how a level leg at height 1 or 2 - the only heights a WINDOW can sit at - is ever produced.
    const pitchCap = (v !== 0 && spec.maxPitchedRun != null) ? Math.min(cap, spec.maxPitchedRun) : cap;
    const want = Math.min(longRun(r, Math.min(spec.minRun, pitchCap), pitchCap), room);

    // A wildcard slot tries its candidate types in a shuffled order and keeps the first that leaves
    // the beam somewhere to go. Under the delta rule a type's usefulness depends on the CURRENT
    // pitch (a WEDGE on an already-climbing beam does nothing), so a single blind pick wastes seeds.
    const wild = spec.plan[i] === '?';
    const candidates = wild ? shuffle(r, spec.pool.slice()) : [spec.plan[i]];
    const base = isLast ? spec.minFinalRun : spec.minRun;
    let chosen = null, type = null, runLen = 0;
    for (const cand of candidates) {
      // THE DELTA (spec 12.1): the outgoing pitch depends on the incoming one, clamped to -1..+1.
      const vOut = Pieces.applyPitch(cand, v);
      // A PIECE THAT WOULD DO NOTHING HERE IS NOT A PIECE (DESIGN.md 14.1). Since FLOOR joined the
      // registry a planned piece can be a no-op - a plate under a level or climbing beam is glided
      // over - and a no-op on the path would make the intended par a lie: the solver would simply
      // find the same route one piece cheaper. `acts` is derived from the registry's own transform,
      // so this refuses any future inert piece too without naming a type.
      if (!ORIENTS.some(o => Pieces.acts(cand, o, dir, v))) continue;
      // Stop the run short of the ceiling / floor so the leg AFTER this piece still has room.
      let len = fitRun(z, v, vOut, want, minLen, Math.min(base, H_MAX - 1));
      if (len === null) len = fitRun(z, v, vOut, want, minLen, 1);
      if (len === null) continue;
      // The piece would sit at (px, py, pz). The outgoing ray is either perpendicular to this run
      // (a 90-degree turn) or straight ahead of its last cell (a FLOOR bounce); either way it never
      // touches a cell of this run, so it can be measured before the run is added to `used`.
      const px = x + DIRS[dir].dx * len, py = y + DIRS[dir].dy * len, pz = z + v * len;
      const need = runFloor(spec, pz, vOut, isLast);
      // The heading half of the transform is the registry's, not TURN's: a FLOOR plate leaves the
      // heading alone, so its two orientations are the SAME option and only one is offered.
      const options = [], seenDir = new Set();
      for (const o of ORIENTS) {
        const nd = Pieces.turnDir(cand, o, dir);
        if (seenDir.has(nd)) continue;
        seenDir.add(nd);
        options.push({ o, nd, v: vOut, room: roomAhead(px, py, pz, nd, vOut, used, w, h, spec.maxRun + 4) });
      }
      const viable = options.filter(t => t.room >= need);
      if (!viable.length) continue;
      viable.sort((a, b) => b.room - a.room);
      chosen = (viable.length > 1 && r() < 0.35) ? viable[1] : viable[0];
      type = cand;
      runLen = len;
      break;
    }
    if (!chosen) return null;
    advance(runLen);

    const cell = path[path.length - 1];
    cell.role = 'piece';
    cell.type = type;
    cell.orient = chosen.o;
    dir = chosen.nd;
    v = chosen.v;
  }

  // final run to the target
  const room = roomAhead(x, y, z, dir, v, used, w, h, spec.maxRun + 4);
  const finalNeed = runFloor(spec, z, v, true);
  if (room < finalNeed) return null;
  const span = Math.max(finalNeed, Math.min(room, spec.maxRun + 4));
  advance(Math.min(longRun(r, finalNeed, span), room));
  path[path.length - 1].role = 'target';

  // quality: use the board
  const t0 = path[0], tn = path[path.length - 1];
  if (Math.abs(tn.x - t0.x) + Math.abs(tn.y - t0.y) < spec.minSpan) return null;
  if (path.length < spec.minPathLen) return null;
  return { emitter: { x: em.x, y: em.y, dir: em.dir }, path };
}

/* ---------- 2 + 3. terrain ---------- */

function zeros(w, h) {
  const t = [];
  for (let y = 0; y < h; y++) t.push(new Array(w).fill(0));
  return t;
}

// Piece / emitter / target cells must sit at the beam's level there. Pass cells are raised into
// ridges and staircases the beam flies over (t <= z, and t >= 1 to make it a real block).
function layTerrain(r, spec, path) {
  const t = zeros(spec.w, spec.d);
  for (const c of path) if (c.role !== 'pass') t[c.y][c.x] = c.z;

  // contiguous runs of pass cells, so raised terrain reads as a ridge instead of noise
  let i = 0;
  while (i < path.length) {
    if (path[i].role !== 'pass') { i++; continue; }
    let j = i;
    while (j < path.length && path[j].role === 'pass') j++;
    const run = path.slice(i, j).filter(c => c.z >= 1);
    if (run.length >= 2 && r() < spec.overflightChance) {
      const len = 2 + rint(r, Math.min(spec.maxRidge, run.length) - 1);
      const at = rint(r, run.length - len + 1);
      const climbing = run.length > 1 && run[1].z !== run[0].z;
      for (let k = 0; k < len; k++) {
        const c = run[at + k];
        // a level flight skims a flat ridge top; a climb gets a staircase one step under the beam
        const hgt = climbing ? Math.max(1, c.z - 1) : (r() < 0.6 ? c.z : Math.max(1, c.z - 1));
        t[c.y][c.x] = Math.min(hgt, c.z);
      }
    }
    i = j;
  }
  return t;
}

/* ---------- 2b. arches and windows (DESIGN.md section 13) ---------- */

// Cells the beam merely passes through, far enough from both ends to read as a real obstacle, that
// can be turned into an opened column. An ARCH needs the beam at level 0; a WINDOW needs it at 1 or
// 2 (the column must stand strictly higher than the hole, and H_MAX-1 = 3 is the tallest column).
function openingCandidates(path, kind, wantLevelBeam) {
  const out = [];
  for (let i = 2; i < path.length - 2; i++) {
    const c = path[i];
    if (c.role !== 'pass') continue;
    if (kind === 'arch' ? c.z !== 0 : !(c.z >= 1 && c.z <= H_MAX - 2)) continue;
    // A window the player must ARRIVE at (rather than climb past) is one on a LEVEL leg: the beam is
    // flat there, so its height is a thing the player has to have set up, not a thing in passing.
    if (wantLevelBeam && c.v !== 0) continue;
    out.push({ i, c });
  }
  return out;
}

// Grow a short wall to either side of an opened column, perpendicular to the beam, on cells the path
// does not own. Cosmetic and structural: the hole reads as a hole in something.
function growWings(t, c, onPath, w, h, span) {
  const perp = (c.dir === 'E' || c.dir === 'W') ? { dx: 0, dy: 1 } : { dx: 1, dy: 0 };
  for (const sign of [1, -1]) {
    for (let k = 1; k <= span; k++) {
      const x = c.x + perp.dx * sign * k, y = c.y + perp.dy * sign * k;
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      if (onPath.has(key(x, y))) break;
      t[y][x] = Math.max(t[y][x], H_MAX - 1);
    }
  }
}

/**
 * punchOpenings(r, spec, t, path, onPath) -> [{ x, y, levels: [z] }]
 * Raises chosen pass columns to full height and punches out exactly the level the beam uses there.
 * Returns null when the path cannot supply what the spec asked for (the seed is then rejected).
 */
function punchOpenings(r, spec, t, path, onPath) {
  const want = spec.openings;
  if (!want || (!want.arch && !want.window)) return [];
  const out = [];
  const taken = new Set();
  const place = (kind, wantLevelBeam, preferLate) => {
    // `wantLevelBeam` is STRICT on purpose: falling back to a cell the beam merely climbs THROUGH
    // would still satisfy the tag, but the level would then teach the wrong lesson - and its intro
    // would be a lie. A seed that cannot offer a level leg at the right height is rejected instead.
    const cands = openingCandidates(path, kind, wantLevelBeam).filter(o => !taken.has(o.i));
    if (!cands.length) return false;
    // Late cells sit after the beam has done its climbing and levelling, which is where a window
    // makes the player commit to a height; a small random nudge keeps seeds from all looking alike.
    cands.sort((a, b) => (preferLate ? b.i - a.i : a.i - b.i));
    const pickIdx = Math.min(cands.length - 1, rint(r, Math.max(1, Math.ceil(cands.length * 0.4))));
    const chosen = cands[pickIdx];
    // neighbouring path cells must not be swallowed by this column's wings
    taken.add(chosen.i); taken.add(chosen.i - 1); taken.add(chosen.i + 1);
    const c = chosen.c;
    t[c.y][c.x] = H_MAX - 1;                       // a full-height column: solid everywhere but the hole
    growWings(t, c, onPath, spec.w, spec.d, want.wingSpan == null ? 2 : want.wingSpan);
    out.push({ x: c.x, y: c.y, levels: [c.z] });
    return true;
  };
  for (let k = 0; k < (want.arch || 0); k++) if (!place('arch', false, false)) return null;
  for (let k = 0; k < (want.window || 0); k++) if (!place('window', !!want.windowOnLevelLeg, true)) return null;
  return out;
}

function coverage(t) {
  let n = 0, total = 0;
  for (const row of t) for (const v of row) { total++; if (v > 0) n++; }
  return n / total;
}

// Ridges, plateaus and towers on cells the beam never touches. Readable shapes, not noise.
function decorate(r, spec, t, onPath) {
  const w = spec.w, h = spec.d;
  const heights = spec.heights;
  const put = (x, y, hgt) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    if (onPath.has(key(x, y))) return;
    t[y][x] = Math.max(t[y][x], hgt);
  };
  let guard = 0;
  while (coverage(t) < spec.density && guard++ < 600) {
    const u = r();
    const hgt = pick(r, heights);
    if (u < 0.45) {                       // ridge
      const horiz = r() < 0.5;
      const len = 3 + rint(r, Math.max(1, Math.round(Math.max(w, h) * 0.45)));
      let x = rint(r, w), y = rint(r, h);
      for (let k = 0; k < len; k++) { put(x, y, hgt); if (horiz) x++; else y++; }
    } else if (u < 0.82) {                // plateau
      const pw = 2 + rint(r, 3), ph = 2 + rint(r, 3);
      const x0 = rint(r, Math.max(1, w - pw + 1)), y0 = rint(r, Math.max(1, h - ph + 1));
      for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) put(x0 + xx, y0 + yy, hgt);
    } else {                              // tower
      const x = rint(r, w), y = rint(r, h);
      put(x, y, Math.max(hgt, 2));
      if (r() < 0.5) put(x + 1, y, Math.max(hgt, 2));
    }
  }
}

/* ---------- level assembly ---------- */

function assemble(spec, walk, t, openings) {
  const pieces = walk.path.filter(c => c.role === 'piece');
  // WHICH PLANNED PIECES ARE PRE-PLACED (DESIGN.md 14.5). `fixedIdx` (one index) is kept for the
  // levels that already used it; `fixedIdxs` (a list) is how a board carries SEVERAL built-in
  // pieces. A fixed piece is always taken from the intended path, never sprinkled elsewhere: that
  // is what makes it "a constraint the player cannot remove" rather than scenery, and it is why the
  // player's par drops by one for each of them. `secret` may be a boolean (all of them) or a list of
  // the indices that are disguised, because a fixed FLOOR is never disguised (14.3).
  const fixedIdxs = spec.fixedIdxs != null ? spec.fixedIdxs.slice()
    : (spec.fixedIdx == null ? [] : [spec.fixedIdx]);
  const secretOf = (i) => (Array.isArray(spec.secret) ? spec.secret.indexOf(i) >= 0 : !!spec.secret);
  const fixed = [];
  const solution = [];
  pieces.forEach((c, i) => {
    if (fixedIdxs.indexOf(i) >= 0) fixed.push({ x: c.x, y: c.y, type: c.type, orient: c.orient, secret: secretOf(i) });
    else solution.push({ x: c.x, y: c.y, type: c.type, orient: c.orient });
  });
  const targets = [];
  if (spec.targets === 2) {
    // an extra orb on a pass cell the beam already crosses at that cell's level; the sim passes a lit
    // orb through, so the beam carries on to the final target (INTERFACES.md section 4).
    const mid = walk.path.filter((c, i) => c.role === 'pass' && i > 2 && i < walk.path.length - 3);
    if (!mid.length) return null;
    const pickCell = mid[Math.floor(mid.length / 2)];
    t[pickCell.y][pickCell.x] = pickCell.z;
    pickCell.role = 'target2';
    targets.push({ x: pickCell.x, y: pickCell.y });
  }
  const last = walk.path[walk.path.length - 1];
  targets.push({ x: last.x, y: last.y });

  const tray = solution.map(p => p.type);
  for (let i = 0; i < spec.slack; i++) tray.push(spec.slackType);

  const out = {
    name: '',
    par: solution.length,
    size: { w: spec.w, d: spec.d },
    terrain: t.map(row => row.join('')),
    emitter: walk.emitter,
    targets,
    fixed,
    tray,
    intro: '',
    solution
  };
  if (openings && openings.length) out.openings = openings.map(o => ({ x: o.x, y: o.y, levels: o.levels.slice() }));
  // DESIGN.md 15.1: a pure RENDERING flag. It is level data, so the generator carries it, and the
  // engine ignores it entirely - nothing about the beam changes on a dark board.
  if (spec.dark) out.dark = true;
  return out;
}

/* ---------- concepts (validate-levels.mjs imports this) ----------
 * Tags added for the corrected pitch rule (DESIGN.md section 12):
 *   climb-then-level  a piece sends the beam CLIMBING and a later piece brings it back to level.
 *                     Under the delta rule that second piece can only be a DIP, so this tag marks
 *                     exactly the WEDGE-then-DIP pattern the rule is built to teach: climb to clear
 *                     something, then level off to arrive.
 *   fall-then-level   the mirror image (DIP down, WEDGE back to level).
 *   pitched-mirror    a MIRROR acted on a beam that was NOT level, and preserved its climb or fall.
 *                     This is the beat that changed: a mirror used to flatten such a beam.
 *
 * Tags added for arches and windows (DESIGN.md section 13):
 *   under-arch        the beam entered a cell THROUGH an opening at level 0 - it went under an
 *                     overhang that looks, from directly above, like solid wall.
 *   through-window    the beam entered a cell through an opening ABOVE level 0 - it threaded a hole
 *                     at one exact height, with solid block below it and solid block above it.
 * Both are read off `visited`: the beam is inside the column (z < t) at a level the column's
 * openMask has punched out. A beam flying OVER the same column (z >= t) is an `overflight`, not
 * either of these, and a beam that merely stops at its wall face tags nothing.
 *
 * Tags added for floor mirrors (DESIGN.md section 14):
 *   bounce            the beam reflected off a FLOOR plate at least once: it arrived pitched DOWN,
 *                     left pitched UP, and kept its heading. Read off the engine's own `bounces`
 *                     list, so a plate the beam merely GLIDES over (level or climbing, 14.1) tags
 *                     nothing - which is the whole distinction the piece exists to make.
 *   skip              TWO OR MORE bounces in one shot: the skipping-stone rhythm of 14.2, where the
 *                     player is spacing the peaks and troughs rather than steering.
 *   floor-glide       a FLOOR plate the beam met at its own level and was NOT changed by. Not a
 *                     teaching beat - it is here so a level whose "bounce" is really a fly-past can
 *                     be told apart at a glance in the validator's table.
 */

export function concepts(level, solution) {
  const L = Sim.parseLevel(level);
  const res = replay(L, solution);
  const out = new Set();
  const solCells = new Set(solution.map(p => p.x + ',' + p.y));
  const secretCells = new Set(L.fixed.filter(f => f.secret).map(f => f.x + ',' + f.y));
  for (const h of res.pieceHits) {
    if (h.type === 'WEDGE') out.add('wedge');
    if (h.type === 'DIP') out.add('dip');
    if (h.fixed && secretCells.has(h.x + ',' + h.y)) out.add('secret');
    if (!h.fixed && solCells.has(h.x + ',' + h.y) && L.t[h.y][h.x] >= 1) out.add('stilt');
  }
  // pitch history along the beam, in order: what each acting piece did to v
  let climbing = false, falling = false;
  for (const e of res.events) {
    if (e.kind !== 'piece') continue;
    if (e.type === 'MIRROR' && e.vIn !== 0) out.add('pitched-mirror');   // a MIRROR that kept a climb or a fall
    if (e.vOut === 1) climbing = true;
    if (e.vOut === -1) falling = true;
    if (e.vIn === 1 && e.vOut === 0 && climbing) out.add('climb-then-level');
    if (e.vIn === -1 && e.vOut === 0 && falling) out.add('fall-then-level');
  }
  for (const s of res.segments) {
    const x = s.to.x, y = s.to.y, z = s.to.z;
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || y < 0 || x >= L.size.w || y >= L.size.d) continue;
    const tt = L.t[y][x];
    if (tt > 0 && tt <= z) out.add('overflight');
  }
  // ARCHES AND WINDOWS (section 13): a cell the beam is INSIDE, at a level punched out of the column.
  for (const v of res.visited) {
    if (!((L.openMask[v.y][v.x] >> v.z) & 1)) continue;
    out.add(v.z === 0 ? 'under-arch' : 'through-window');
  }
  // FLOOR mirrors (section 14). `bounces` is the engine's own list of vertical-only reflections.
  if (res.bounces.length) out.add('bounce');
  if (res.bounces.length >= 2) out.add('skip');
  if (res.glides.length) out.add('floor-glide');
  if (res.overflights.length) out.add('piece-overflight');
  if (L.targets.length === 2) out.add('twotargets');
  for (const ti of res.hits) { const tg = L.targets[ti]; if (L.t[tg.y][tg.x] >= 1) out.add('plateau-target'); }
  return Array.from(out).sort();
}

/* ---------- 4. repair: wall off an unwanted solution ---------- */

// Raise ONE cell on `placed`'s beam that the intended path does not own, high enough to block the
// beam there. A non-path cell can never affect the intended trace, so the intended solution survives
// by construction (verifyIntended re-checks anyway).
function blockHeight(spec, z) {
  let best = null;
  for (const h of spec.heights) if (h > z && (best === null || h < best)) best = h;
  return best;   // null when nothing in the allowed height set can block a beam at level z
}

function blockPlacement(level, t, onPath, placed, spec) {
  const L = Sim.parseLevel(level);
  const res = replay(L, placed);
  const cands = [];
  for (const v of res.visited) {
    // Opened columns are path cells, so `onPath` already protects them; the explicit test says so.
    if (onPath.has(key(v.x, v.y)) || L.openMask[v.y][v.x]) continue;
    const want = blockHeight(spec, v.z);
    if (want === null) continue;
    if (t[v.y][v.x] >= want) continue;
    cands.push({ x: v.x, y: v.y, want });
  }
  if (!cands.length) return false;
  // prefer late in the beam: blocking near the end keeps the early board readable
  const c = cands[Math.max(0, cands.length - 1 - Math.floor(cands.length * 0.25))];
  t[c.y][c.x] = c.want;
  return true;
}

// Wall off the CLASSIC-2D game. A flat route is killed by raising one cell of its flat beam to height
// 1: in flatten() every t >= 1 becomes a full-height wall, so the route dies, while in the real 3D
// level it is only a low ridge that beams above level 0 still fly over. The cell that appears on the
// most routes is chosen, so one edit collapses a whole family of them.
function blockFlatRoutes(level, t, onPath, routes, spec) {
  const F = Sim.parseLevel(flatten(level));
  const tally = new Map();
  for (const sol of routes.slice(0, 400)) {
    const asMirrors = sol.map(p => ({ x: p.x, y: p.y, type: 'MIRROR', orient: p.orient }));
    let res;
    try { res = replay(F, asMirrors); } catch (e) { continue; }
    const seen = new Set();
    for (const v of res.visited) {
      const k = key(v.x, v.y);
      if (seen.has(k) || onPath.has(k) || t[v.y][v.x] >= 1) continue;   // opened columns are already t = 3
      seen.add(k);
      tally.set(k, (tally.get(k) || 0) + 1);
    }
  }
  let best = null, bestN = 0;
  for (const [k, n] of tally) if (n > bestN) { bestN = n; best = k; }
  if (!best) return false;
  const [bx, by] = best.split(',').map(Number);
  const want = blockHeight(spec, 0);       // any t >= 1 is a full wall once flattened
  if (want === null) return false;
  t[by][bx] = want;
  return true;
}

function syncTerrain(level, t) { level.terrain = t.map(row => row.join('')); }

/* ---------- 5. verification ---------- */

function verifyIntended(level) {
  try { return replay(level, level.solution).allTargetsHit; } catch (e) { return false; }
}

/**
 * buildLevel(seed, spec) -> { level, concepts, nodes, minNodes, needs3D, unique } | null
 */
export function buildLevel(seed, spec, stats) {
  const bail = (why) => { if (stats) stats[why] = (stats[why] || 0) + 1; return null; };
  const r = mulberry32(seed);
  const walk = walkPath(r, spec);
  if (!walk) return bail('walk');
  const t = layTerrain(r, spec, walk.path);
  const onPath = new Set(walk.path.map(c => key(c.x, c.y)));
  // Arches and windows are punched BEFORE decorate so their wings count towards coverage and
  // decorate cannot bury them: `put` never touches a path cell, and an opened column is a path cell.
  const openings = punchOpenings(r, spec, t, walk.path, onPath);
  if (openings === null) return bail('openings');
  decorate(r, spec, t, onPath);

  const level = assemble(spec, walk, t, openings);
  if (!level) return bail('assemble');
  if (level.par !== spec.par) return bail('par');
  syncTerrain(level, t);

  // schema + intended solution must hold before anything else
  try { Sim.parseLevel(level); } catch (e) { return bail('parse'); }
  if (!verifyIntended(level)) return bail('intended');
  if (replay(level, []).allTargetsHit) return bail('trivial');    // trivial straight shot
  for (let i = 0; i < level.solution.length; i++) {
    if (!Sim.canPlace(level, level.solution.slice(0, i), level.solution[i].x, level.solution[i].y)) return bail('canplace');
  }

  const budget = { maxNodes: spec.maxNodes, maxMs: spec.maxMs };
  let minNodes = 0, flatNodes = 0;

  for (let pass = 0; pass < spec.repairPasses; pass++) {
    let edited = false;

    // (a) nothing may solve it with fewer than par pieces
    const cheap = proveMinimal(level, level.par, budget);
    minNodes = cheap.nodes;
    if (cheap.truncated) return bail('budget-min');
    if (!cheap.proven) {
      if (!blockPlacement(level, t, onPath, cheap.counterexample, spec)) return bail('unblockable-short');
      syncTerrain(level, t);
      if (!verifyIntended(level)) return bail('repair-broke-path');
      edited = true;
    }

    // (b) every minimal solution must show the required concepts (teaching beats), when asked
    if (!edited && spec.require.length && spec.forceRequire) {
      const all = solve(level, Object.assign({ maxSolutions: Infinity }, budget));
      if (all.truncated || !all.solvable || all.par !== level.par) return bail('budget-all');
      let bad = null;
      for (const sol of all.solutions) {
        const cs = concepts(level, sol);
        if (!spec.require.every(c => cs.includes(c))) { bad = sol; break; }
      }
      if (bad) {
        if (!blockPlacement(level, t, onPath, bad, spec)) return bail('unblockable-concept');
        syncTerrain(level, t);
        if (!verifyIntended(level)) return bail('repair-broke-path');
        edited = true;
      }
    }

    // (c) 3D-necessity (spec 3.7) from the first hidden-height level on. spec.need3d === 'unsolvable'
    // demands the AIRTIGHT verdict: no placement of any size up to the tray solves the flat board at
    // all, so the guarantee needs no caveat about pieces that idle in flat but act in 3D.
    if (!edited && spec.need3d) {
      const n3 = needs3D(level, budget);
      flatNodes = n3.nodes;
      if (n3.truncated) return bail('budget-flat');
      const ok = spec.need3d === 'unsolvable' ? n3.reason === 'flat-unsolvable' : n3.needs3D;
      if (!ok) {
        if (!n3.flatSolutions.length) return bail('no-flat-culprit');
        if (!blockFlatRoutes(level, t, onPath, n3.flatSolutions, spec)) return bail('unblockable-flat');
        syncTerrain(level, t);
        if (!verifyIntended(level)) return bail('repair-broke-path');
        edited = true;
      }
    }

    if (!edited) break;
    if (pass === spec.repairPasses - 1) return bail('repair-exhausted');
  }

  // final gate
  if (!verifyIntended(level)) return bail('final-intended');
  if (replay(level, []).allTargetsHit) return bail('final-trivial');
  const cheap = proveMinimal(level, level.par, budget);
  if (!cheap.proven) return bail('final-minimality');
  minNodes = cheap.nodes;
  const n3 = needs3D(level, budget);
  if (n3.truncated) return bail('final-flat-budget');
  if (spec.need3d && !n3.needs3D) return bail('final-needs3d');
  if (spec.need3d === 'unsolvable' && n3.reason !== 'flat-unsolvable') return bail('final-not-flat-unsolvable');
  flatNodes = n3.nodes;

  // LaserSim ends a trace on either an exact repeated state or the MAX_STEPS cap. If the cap never
  // fired anywhere in the proofs, the proofs hold for ANY value of MAX_STEPS - which matters because
  // the engine's cap is being widened for these bigger boards.
  if (cheap.capHits || n3.capHits) return bail('step-cap-dependent');
  const solTrace = replay(level, level.solution);
  if (solTrace.segments.length >= Sim.MAX_STEPS) return bail('solution-too-long');

  const cs = concepts(level, level.solution);
  for (const c of spec.require) if (!cs.includes(c)) return bail('missing:' + c);
  for (const c of spec.forbid) if (cs.includes(c)) return bail('forbidden');
  if (coverage(t) < spec.minCoverage || coverage(t) > spec.maxCoverage) return bail('coverage');

  let unique = null;
  if (spec.wantUnique != null) {
    const all = solve(level, Object.assign({ maxSolutions: Infinity }, budget));
    if (all.truncated || all.par !== level.par) return bail('final-budget-all');
    unique = all.unique;
    if (spec.wantUnique && !unique) return bail('not-unique');
    if (spec.forceRequire) {
      for (const sol of all.solutions) {
        const c2 = concepts(level, sol);
        if (!spec.require.every(c => c2.includes(c))) return bail('concept-not-forced');
      }
    }
    if (spec.allSolutionsStilt) {
      const L = Sim.parseLevel(level);
      if (!all.solutions.every(one => one.some(p => L.t[p.y][p.x] >= 1))) return bail('stilt-not-forced');
    }
  }

  return {
    level, seed,
    concepts: cs,
    par: level.par,
    minNodes,
    flatNodes,
    minCapHits: cheap.capHits,
    maxSegments: Math.max(cheap.maxSegments, n3.maxSegments, solTrace.segments.length),
    solutionSegments: solTrace.segments.length,
    needs3D: n3.reason,
    unique,
    coverage: coverage(t),
    pathLen: walk.path.length
  };
}

/* ---------- spec defaults + seed search ---------- */

export function normalizeSpec(spec) {
  const w = spec.w || 12, d = spec.d || spec.w || 12;
  const side = Math.max(w, d);
  // Runs are sized so the whole path is roughly 1.7 boards long however many pieces it carries:
  // few pieces -> long dramatic straights, many pieces -> shorter legs that still cross the board.
  const runs = (spec.plan ? spec.plan.length : 1) + 1;
  const maxRun = Math.max(4, Math.min(side - 2, Math.round(side * 1.7 / runs)));
  return Object.assign({
    w, d,
    plan: ['MIRROR'],
    // Wildcard '?' slots draw from here. FLOOR is in the pool: walkPath only ever accepts a type
    // that ACTS where it stands (see the `Pieces.acts` guard), so a plate is only ever planned onto
    // a descending leg, which is exactly where it belongs.
    pool: ALL_TYPES.slice(),
    par: null,
    fixedIdx: null,
    fixedIdxs: null,
    secret: false,
    dark: false,
    emitterZ: 0,
    targets: 1,
    heights: [1, 2, 3],
    density: 0.34,
    minCoverage: 0.2,
    maxCoverage: 0.5,
    overflightChance: 0.75,
    maxRidge: 5,
    minRun: Math.max(2, Math.round(maxRun * 0.45)),
    maxRun,
    minFinalRun: 2,
    // Cap on a run the beam takes while CLIMBING or FALLING (null = uncapped). See walkPath.
    maxPitchedRun: null,
    minSpan: Math.round(side * 0.5),
    minPathLen: Math.round(side * 1.15),
    slack: 1,
    slackType: 'MIRROR',
    // DESIGN.md 13: { arch: n, window: n, windowOnLevelLeg: bool, wingSpan: n }. null = no openings.
    openings: null,
    need3d: 'unsolvable',
    require: [],
    forbid: [],
    forceRequire: false,
    wantUnique: null,
    allSolutionsStilt: false,
    repairPasses: 26,
    maxNodes: 4000000,
    maxMs: 20000
  }, spec);
}

/**
 * generate(spec, opts) -> { built: [...], tried }
 * Walks seeds from opts.seed until `count` levels pass every gate.
 */
export function generate(spec, opts) {
  const s = normalizeSpec(spec);
  if (s.par == null) {
    const nFixed = s.fixedIdxs != null ? s.fixedIdxs.length : (s.fixedIdx == null ? 0 : 1);
    s.par = s.plan.length - nFixed;
  }
  const o = Object.assign({ seed: 1, tries: 3000, count: 1, stats: null }, opts);
  const built = [];
  let tried = 0;
  for (let seed = o.seed; seed < o.seed + o.tries && built.length < o.count; seed++) {
    tried++;
    let res = null;
    try { res = buildLevel(seed, s, o.stats); } catch (e) { if (o.stats) o.stats.threw = (o.stats.threw || 0) + 1; res = null; }
    if (res) built.push(res);
  }
  return { built, tried, spec: s, stats: o.stats };
}

export function writeOut(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}

/* ---------- CLI ---------- */

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) a[process.argv[i].slice(2)] = process.argv[++i];
  const spec = { w: +(a.w || 12), d: +(a.d || a.w || 12), plan: (a.plan || 'MIRROR').split(',') };
  // A FLOOR plan needs the emitter OFF the floor, or the first DIP has nowhere to fall to and every
  // walk is rejected. `--emitterZ 2` is the usual answer; the shipped slots set it in their specs.
  if (a.emitterZ != null) spec.emitterZ = +a.emitterZ;
  const res = generate(spec, { seed: +(a.seed || 1), tries: +(a.tries || 500), count: +(a.count || 1) });
  process.stdout.write(JSON.stringify(res.built, null, 1) + '\n');
  process.stderr.write('gen: ' + res.built.length + ' built in ' + res.tried + ' seeds\n');
}
