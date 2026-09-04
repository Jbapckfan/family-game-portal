// Lasers 3D - solver (DESIGN.md section 6 step 2, section 3.7 "3D-necessary").
// Node tooling only (.mjs). Pure, deterministic, no dependencies beyond src/sim.js.
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row (INTERFACES.md section 0).
//
// PITCH IS A DELTA (DESIGN.md section 12). The search itself never reads a piece's pitch - it only
// calls Sim.trace - so the corrected rule flows through unchanged. Two things about the search DO
// depend on it and are worth stating:
//   - The beam-order argument below is about WHERE a piece can be placed, not about what it does to
//     the pitch, so it survives the rule change verbatim.
//   - flatten() is the one place that rewrites piece semantics, and its claim had to be re-proven
//     under the new rule; see its doc comment and the flatten test in test/solver.test.mjs.
//
// ARCHES AND WINDOWS (DESIGN.md section 13). The search reads the board only through Sim.trace and
// Sim.canPlace, so an `openings` array flows through the DFS untouched: a beam that threads an arch
// or a window simply visits cells it could not visit before. Two places did need a decision, both
// recorded where they live: candidateCells (a beam inside an opening is at z < t, so that cell is
// NOT a placement candidate - correct, because a piece sits on the column TOP and nothing may be
// placed inside an opening) and flatten (an opened column stays an impassable wall - see its doc
// comment for the reasoning, which is load-bearing for every under-arch level).
//
// SEARCH (rewritten for the 12x12..24x24 level set)
// Iterative deepening, but each round is a depth-limited DFS in BEAM ORDER instead of a BFS over every
// distinct placed set. The canonical order kills the permutation blow-up that made big boards
// infeasible, and the DFS uses O(depth) memory instead of O(states).
//
// IRREDUNDANT PLACEMENTS AND WHY BEAM ORDER IS COMPLETE
// Call a placement IRREDUNDANT when every piece in it is actually hit by the beam. The DFS enumerates
// exactly the irredundant placements: order a placement's pieces p1..pn by first hit; with only p1..pk
// down, the trace is byte-identical to the full trace up to pk's first hit and onward to wherever
// p(k+1) is met, so p(k+1) always appears in `visited` AFTER pk acted. Restricting the next placement
// to cells visited strictly after the last placed piece acted therefore loses nothing and reaches each
// irredundant placement along exactly one build order.
//   - Every MINIMAL solution is irredundant (an unhit piece could be deleted without changing the
//     trace, giving a smaller solution), so `solve` is complete for par.
//   - Pruning a branch as soon as its prefix solves is also safe: any superset of a solving prefix
//     traces identically, stops at the same target, and so leaves the extra piece unhit - i.e. it is
//     not irredundant. `enumerate` relies on this.
//
// BUDGET
// `maxNodes` / `maxMs` stop a search early and set `truncated: true`. A truncated result NEVER claims
// `solvable: false` as proof - callers must check `truncated`.
//
// STEP-CAP TELEMETRY (`capHits`, `maxSegments`)
// LaserSim ends a trace with `end: 'loop'` either on a repeated state (exact) or on the step cap (an
// approximation). If the cap ever fires inside a search, the search's answer depends on the cap's
// value. Every result therefore reports how many traces ended at the cap and the longest trace seen, so
// a caller can assert `capHits === 0` and know the answer is independent of whatever the cap is. The
// cap is read from LaserSim.stepCap(level) when the engine exposes it (it is derived from the board's
// state space), falling back to LaserSim.MAX_STEPS.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sim = require('./src/sim.js');

const TYPES = Object.keys(Sim.PIECES); // registry order: MIRROR, WEDGE, DIP
const ORIENTS = Sim.ORIENTS;

function cellKey(x, y) { return x + ',' + y; }

// Canonical key of a placed set (order-independent) for solution dedupe.
function canonKey(placed) {
  return placed.map(p => p.x + ',' + p.y + ',' + p.type + ',' + p.orient).sort().join('|');
}

function copyPlaced(placed) {
  return placed.map(p => ({ x: p.x, y: p.y, type: p.type, orient: p.orient }));
}

// Index in `visited` at which the last placed piece acted (entered at its own terrain level).
// -1 when there is no placed piece yet, or (defensively) when it never acted - then the whole
// visited list is open and the solution dedupe catches any repeat.
function lastActIndex(L, placed, visited) {
  if (!placed.length) return -1;
  const last = placed[placed.length - 1];
  for (let i = 0; i < visited.length; i++) {
    const v = visited[i];
    if (v.x === last.x && v.y === last.y && v.z === L.t[v.y][v.x]) return i;
  }
  return -1;
}

// Candidate cells for the NEXT piece: cells the current beam enters at exactly that cell's terrain
// level, strictly after the last placed piece acted, in beam order, deduped, placeable. A piece
// anywhere else is either flown over, never reached, or out of canonical order.
// SECTION 13: the `v.z !== t` test also excludes every cell the beam threads through an OPENING
// (there z < t), which is exactly right - a piece sits on the column TOP, so it could never catch a
// beam inside the opening, and nothing may be placed inside one.
function candidateCells(L, placed, visited) {
  const out = [], seen = {};
  for (let i = lastActIndex(L, placed, visited) + 1; i < visited.length; i++) {
    const v = visited[i];
    if (v.z !== L.t[v.y][v.x]) continue;
    const k = cellKey(v.x, v.y);
    if (seen[k]) continue;
    seen[k] = true;
    if (Sim.canPlace(L, placed, v.x, v.y)) out.push({ x: v.x, y: v.y });
  }
  return out;
}

/* ---------- shared depth-limited DFS ---------- */

function makeContext(level, opts) {
  const L = Sim.parseLevel(opts.flat ? flatten(level) : level);
  const tray = (opts.tray || L.tray).slice();
  const counts = {};
  for (const t of tray) counts[t] = (counts[t] || 0) + 1;
  return {
    L, tray, baseCounts: counts,
    // The engine's loop-guard cap is derived per level (LaserSim.stepCap); MAX_STEPS is only its floor.
    // Use the derived value when the engine offers it so `capHits` measures the real thing.
    stepCap: typeof Sim.stepCap === 'function' ? Sim.stepCap(L) : Sim.MAX_STEPS,
    maxNodes: opts.maxNodes == null ? Infinity : opts.maxNodes,
    maxMs: opts.maxMs == null ? Infinity : opts.maxMs,
    t0: Date.now(),
    nodes: 0, capHits: 0, maxSegments: 0, truncated: false
  };
}

// Enumerate every irredundant placement of exactly `depth` pieces; call sink(placed, trace) on each
// placement whose trace lights every target. `stopEarly` ends the round at the first such placement.
function searchDepth(ctx, depth, sink, stopEarly) {
  const L = ctx.L;
  const placed = [];
  const counts = Object.assign({}, ctx.baseCounts);
  let done = false;

  const rec = () => {
    if (ctx.nodes >= ctx.maxNodes) { ctx.truncated = true; return; }
    if (ctx.maxMs !== Infinity && (ctx.nodes & 511) === 0 && Date.now() - ctx.t0 > ctx.maxMs) { ctx.truncated = true; return; }
    const r = Sim.trace(L, placed);
    ctx.nodes++;
    if (r.segments.length > ctx.maxSegments) ctx.maxSegments = r.segments.length;
    if (r.end === 'loop' && r.segments.length >= ctx.stepCap) ctx.capHits++;
    if (r.allTargetsHit) {
      if (placed.length === depth) { sink(placed, r); if (stopEarly) done = true; }
      return; // a superset of a solving prefix is never irredundant (see header)
    }
    if (placed.length === depth) return;
    const cells = candidateCells(L, placed, r.visited);
    for (const c of cells) {
      for (const type of TYPES) {
        if (!counts[type]) continue;
        counts[type] -= 1;
        for (const orient of ORIENTS) {
          placed.push({ x: c.x, y: c.y, type, orient });
          rec();
          placed.pop();
          if (ctx.truncated || done) { counts[type] += 1; return; }
        }
        counts[type] += 1;
      }
    }
  };
  rec();
}

function telemetry(ctx) {
  return { nodes: ctx.nodes, truncated: ctx.truncated, capHits: ctx.capHits, maxSegments: ctx.maxSegments };
}

/**
 * solve(level, opts) -> { solvable, par, solution, solutions, unique, nodes, truncated, capHits, maxSegments }
 *
 * opts:
 *   maxPieces     cap on the piece count searched (default tray.length; also clamped to it).
 *                 `maxPieces: par - 1` is the cheap MINIMALITY proof - see proveMinimal().
 *   tray          override level.tray (a multiset of type names).
 *   flat          solve flatten(level) instead of level.
 *   maxSolutions  how many minimal solutions to return (default 2; Infinity for all). The round is
 *                 always fully enumerated, so `unique` is exact regardless of this cap.
 *   firstOnly     stop the round at the first solution found (fast "is it solvable at all"); then
 *                 `unique` is meaningless and reported as false.
 *   maxNodes      trace budget (default Infinity). maxMs: wall-clock budget (default Infinity).
 *
 * `nodes` is the number of traces performed. `truncated` is true when a budget stopped the search; in
 * that case `solvable: false` means "not proven", not "proven impossible". `capHits` is the number of
 * traces that ended on the engine step cap rather than on an exact repeated state; when it is 0
 * the result does not depend on the cap's value at all. `maxSegments` is the longest trace seen.
 */
export function solve(level, opts) {
  opts = opts || {};
  const ctx = makeContext(level, opts);
  const maxPieces = Math.min(opts.maxPieces == null ? ctx.tray.length : opts.maxPieces, ctx.tray.length);
  const maxSolutions = opts.maxSolutions == null ? 2 : opts.maxSolutions;
  const firstOnly = !!opts.firstOnly;
  let found = null;

  for (let depth = 0; depth <= maxPieces; depth++) {
    const sols = [];
    const seen = new Set();
    searchDepth(ctx, depth, (placed) => {
      const k = canonKey(placed);
      if (!seen.has(k)) { seen.add(k); sols.push(copyPlaced(placed)); }
    }, firstOnly);
    if (ctx.truncated) break;
    if (sols.length) { found = { par: depth, sols }; break; }
  }

  if (found) {
    return Object.assign({
      solvable: true,
      par: found.par,
      solution: copyPlaced(found.sols[0]),
      solutions: found.sols.slice(0, maxSolutions).map(copyPlaced),
      unique: firstOnly ? false : found.sols.length === 1
    }, telemetry(ctx), { truncated: false });
  }
  return Object.assign({ solvable: false, par: null, solution: null, solutions: [], unique: false }, telemetry(ctx));
}

/**
 * enumerate(level, opts) -> { solutions, byDepth, nodes, truncated, capHits, maxSegments }
 *
 * EVERY irredundant placement that lights all targets, at EVERY piece count 0..maxPieces (default the
 * full tray) - not just the minimal ones. `byDepth[k]` is the count found at size k. Used by needs3D
 * to test the whole flat game rather than only its cheapest answers.
 * `maxSolutions` (default 20000) caps the list; overflowing sets `truncated`.
 */
export function enumerate(level, opts) {
  opts = opts || {};
  const ctx = makeContext(level, opts);
  const maxPieces = Math.min(opts.maxPieces == null ? ctx.tray.length : opts.maxPieces, ctx.tray.length);
  const cap = opts.maxSolutions == null ? 20000 : opts.maxSolutions;
  const solutions = [];
  const byDepth = [];
  const seen = new Set();

  for (let depth = 0; depth <= maxPieces; depth++) {
    let n = 0;
    searchDepth(ctx, depth, (placed) => {
      const k = canonKey(placed);
      if (seen.has(k)) return;
      seen.add(k);
      n++;
      if (solutions.length >= cap) { ctx.truncated = true; return; }
      solutions.push(copyPlaced(placed));
    }, false);
    byDepth.push(n);
    if (ctx.truncated) break;
  }
  return Object.assign({ solutions, byDepth }, telemetry(ctx));
}

/**
 * proveMinimal(level, par, opts) -> { proven, truncated, nodes, capHits, maxSegments, counterexample }
 *
 * The cheap half of "par is real": an EXHAUSTIVE search bounded to depth par - 1. Proving that no
 * solution exists below par costs a fraction of searching at depth par, which is what makes the
 * 20x20+ boards feasible. `proven` is true only when the bounded search finished inside the budget and
 * found nothing. `counterexample` is the shorter solution when one exists.
 */
export function proveMinimal(level, par, opts) {
  if (!(par > 0)) return { proven: true, truncated: false, nodes: 0, capHits: 0, maxSegments: 0, counterexample: null };
  const r = solve(level, Object.assign({}, opts || {}, {
    maxPieces: par - 1, firstOnly: true, maxSolutions: 1
  }));
  return {
    proven: !r.solvable && !r.truncated,
    truncated: r.truncated,
    nodes: r.nodes,
    capHits: r.capHits,
    maxSegments: r.maxSegments,
    counterexample: r.solution
  };
}

/** replay(level, placed) -> LaserSim.trace result. */
export function replay(level, placed) {
  return Sim.trace(level, placed || []);
}

/**
 * flatten(level) -> the CLASSIC 2D projection used by the 3D-necessity test (spec 3.7):
 *   - every cell with t >= 1 becomes a full-height wall ('3'), so it is impassable and
 *     no beam can ever meet a piece on it (pieces on raised terrain are unusable);
 *   - EVERY OPENING IS DROPPED (DESIGN.md section 13) - see the paragraph below;
 *   - the emitter and every target sit at level 0 (their cells are floor);
 *   - fixed pieces on raised cells are dropped (they would be inside a wall);
 *   - every piece, fixed or in the tray, behaves as MIRROR (secret flags cleared).
 * Returns a fresh raw level; the input is not mutated. flatten only ever describes the FLAT game -
 * a candidate found in it is always replayed against the untouched 3D level.
 *
 * DOES THIS STILL MEAN "THE CLASSIC 2D GAME" UNDER SPEC 12? Yes, and the reason got simpler.
 * Before, MIRROR forced v to 0, so flatness was imposed piece by piece. Now MIRROR PRESERVES v - so
 * flatness has to come from the projection itself, and it does: the emitter fires with v = 0, every
 * raised cell is a full-height wall that no beam can climb onto (arriving at z' > 0 anywhere would
 * need a piece that adds pitch, and the only pieces left are MIRRORs), and a MIRROR maps v = 0 to
 * v = 0. So v is 0 on the first step and preserved on every step after it: EVERY segment of EVERY
 * flat trace is level, at z = 0, with no over-flights. That is exactly the 2D game, and it is
 * asserted directly (over the fixtures and 120 random levels) in test/solver.test.mjs.
 *
 * IS AN OPENED COLUMN PASSABLE IN THE FLAT PROJECTION? NO - it stays a wall. Deliberately, and the
 * reasoning matters because it is what makes an under-arch level provable:
 *   1. flatten answers ONE question: "can a player who believes the board is the classic 2D game
 *      solve it?" That game has no levels at all, so there is nothing an opening could mean in it.
 *      A cell is a wall or it is not.
 *   2. From directly above an opened column is pixel-identical to a solid one - the top surface is
 *      untouched, which is the entire point of section 13.1. The only thing that distinguishes them
 *      in FLAT is the light leak of 13.3, and that leak is precisely a signal that the board is NOT
 *      flat. Handing the flat player the opening would be handing them 3D information.
 *   3. The claim above - "every t >= 1 is an impassable wall" - is structural, not decorative. It is
 *      what forces v = 0 on every step of every flat trace: a beam can never climb onto a wall, so
 *      no piece on raised terrain is reachable and no pitch ever appears. A passable opening would
 *      let a flat beam cross a wall at z = 0, and "wall" would stop meaning wall.
 * Consequence, stated plainly so it is not mistaken for a convenience: a route that goes UNDER an
 * arch is unavailable to the flat player by construction, so an under-arch level tends to come out
 * `flat-unsolvable` - the AIRTIGHT verdict. That is the correct answer, not a loophole: the route
 * requires knowing that a level-0 gap exists inside a wall, which is 3D knowledge and nothing else.
 * Openings are therefore omitted from the returned level (spelled out as `openings: []` rather than
 * left off, so a reader can see the decision was made rather than forgotten).
 */
export function flatten(level) {
  const L = Sim.parseLevel(level);
  const floor = {};
  floor[cellKey(L.emitter.x, L.emitter.y)] = true;
  for (const tg of L.targets) floor[cellKey(tg.x, tg.y)] = true;
  const terrain = [];
  for (let y = 0; y < L.size.d; y++) {
    let row = '';
    for (let x = 0; x < L.size.w; x++) row += (L.t[y][x] >= 1 && !floor[cellKey(x, y)]) ? '3' : '0';
    terrain.push(row);
  }
  const fixed = L.fixed
    .filter(f => L.t[f.y][f.x] === 0)
    .map(f => ({ x: f.x, y: f.y, type: 'MIRROR', orient: f.orient, secret: false }));
  return {
    name: L.name ? L.name + ' (flat)' : '',
    par: 0,
    size: { w: L.size.w, d: L.size.d },
    terrain,
    openings: [],                     // section 13: an opened column is a wall in the classic game
    emitter: { x: L.emitter.x, y: L.emitter.y, dir: L.emitter.dir },
    targets: L.targets.map(tg => ({ x: tg.x, y: tg.y })),
    fixed,
    tray: L.tray.map(() => 'MIRROR'),
    intro: ''
  };
}

// Every ordered k-tuple of piece types drawable from the real tray multiset. A flat route says WHERE
// and WHICH WAY the pieces go; it says nothing about which tray slot goes where, so a player following
// flat reasoning may land on any of these assignments.
function typeAssignments(tray, k) {
  const counts = {};
  for (const t of tray) counts[t] = (counts[t] || 0) + 1;
  const types = Object.keys(counts);
  const out = [], cur = [];
  if (k > tray.length) return out;
  const rec = (i) => {
    if (i === k) { out.push(cur.slice()); return; }
    for (const t of types) {
      if (!counts[t]) continue;
      counts[t] -= 1; cur.push(t);
      rec(i + 1);
      cur.pop(); counts[t] += 1;
    }
  };
  rec(0);
  return out;
}

/**
 * needs3D(level, opts) -> { needs3D, reason, flatSolutions, flatCount, replays, nodes, truncated, capHits, maxSegments }
 *
 * DESIGN.md 3.7: a level is 3D-necessary when the CLASSIC flat game (all t >= 1 are full walls, every
 * piece is a MIRROR) is either unsolvable with the tray, or every flat answer fails when actually
 * played in 3D.
 *
 * WHAT IS ACTUALLY PROVEN (read this before trusting a reason string):
 *   'flat-unsolvable'        AIRTIGHT. No placement of any size up to the full tray solves the flat
 *                            board. Placements with idle pieces need no separate check: deleting an
 *                            unhit piece leaves the flat trace identical, so every flat solution
 *                            reduces to an irredundant one, and every irredundant one is enumerated.
 *   'flat-routes-fail-in-3d' SCOPED. Every irredundant flat solution, at every size up to the full
 *                            tray, replayed against the UNTOUCHED 3D level under EVERY assignment of
 *                            the real tray's piece types to its cells, misses. Not covered: a
 *                            placement carrying a piece that is idle in the flat trace but active in
 *                            3D. Enumerating those means enumerating all placements on the board,
 *                            which is not feasible at 24x24 - so this reason is a strong statement,
 *                            not a total one. Prefer 'flat-unsolvable' for shipped levels.
 *   'flat-route-works'       A flat route does solve the 3D level: NOT 3D-necessary.
 *   'budget'                 The flat search hit the node/time budget. Nothing is proven either way.
 *
 * `opts` is forwarded to the flat search (maxNodes / maxMs / maxSolutions).
 */
export function needs3D(level, opts) {
  const L = Sim.parseLevel(level);
  const flat = enumerate(flatten(L), opts || {});
  if (flat.truncated) {
    return { needs3D: false, reason: 'budget', flatSolutions: [], flatCount: flat.solutions.length, replays: 0, nodes: flat.nodes, truncated: true, capHits: flat.capHits, maxSegments: flat.maxSegments };
  }
  if (!flat.solutions.length) {
    return { needs3D: true, reason: 'flat-unsolvable', flatSolutions: [], flatCount: 0, replays: 0, nodes: flat.nodes, truncated: false, capHits: flat.capHits, maxSegments: flat.maxSegments };
  }
  const assignCache = {};
  let replays = 0;
  for (const sol of flat.solutions) {
    const k = sol.length;
    if (!assignCache[k]) assignCache[k] = typeAssignments(L.tray, k);
    for (const assign of assignCache[k]) {
      const placed = sol.map((p, i) => ({ x: p.x, y: p.y, type: assign[i], orient: p.orient }));
      replays++;
      if (Sim.trace(L, placed).allTargetsHit) {
        return { needs3D: false, reason: 'flat-route-works', flatSolutions: [placed], flatCount: flat.solutions.length, replays, nodes: flat.nodes, truncated: false, capHits: flat.capHits, maxSegments: flat.maxSegments };
      }
    }
  }
  return { needs3D: true, reason: 'flat-routes-fail-in-3d', flatSolutions: flat.solutions.map(copyPlaced), flatCount: flat.solutions.length, replays, nodes: flat.nodes, truncated: false, capHits: flat.capHits, maxSegments: flat.maxSegments };
}
