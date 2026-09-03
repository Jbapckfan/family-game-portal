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
// PIPELINE (buildLevel):
//   1. walkPath      emitter on an edge facing inward; alternate straight runs with piece placements,
//                    tracking (x, y, z, d, v) exactly as LaserSim.trace would; z stays in 0..3, on-grid,
//                    never revisiting a cell. The piece count on the path is the intended par.
//   2. layTerrain    piece / emitter / target cells get t = the beam's level there (a plateau target when
//                    that level is > 0); pass cells get raised into ridges and staircases the beam flies
//                    OVER (t <= z) - the hidden-height reveals.
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
//   (the shipped 20-level curve lives in tools/gen-batches.mjs, which drives generate() slot by slot)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { solve, needs3D, replay, proveMinimal, flatten } from './solver.mjs';
const require = createRequire(import.meta.url);
const Sim = require('./src/sim.js');

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

function runFloor(spec, z, v, isFinal) {
  const cap = v > 0 ? (H_MAX - 1 - z) : v < 0 ? z : Infinity;
  return Math.max(1, Math.min(isFinal ? spec.minFinalRun : spec.minRun, cap));
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
 * path entries: { x, y, z, role: 'emitter'|'pass'|'piece'|'target', type?, orient? } in beam order.
 * The state (x, y, z, d, v) is advanced exactly as LaserSim.trace advances it.
 */
function walkPath(r, spec) {
  const w = spec.w, h = spec.d;
  const em = pickEmitter(r, w, h);
  let x = em.x, y = em.y, z = spec.emitterZ, dir = em.dir, v = 0;
  const used = new Set([key(x, y)]);
  const path = [{ x, y, z, role: 'emitter' }];

  const advance = (n) => {
    for (let k = 0; k < n; k++) {
      x += DIRS[dir].dx; y += DIRS[dir].dy; z += v;
      used.add(key(x, y));
      path.push({ x, y, z, role: 'pass' });
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
    advance(Math.min(longRun(r, spec.minRun, cap), room));

    const cell = path[path.length - 1];
    const type = spec.plan[i] === '?' ? pick(r, spec.pool) : spec.plan[i];
    const pitch = Sim.PIECES[type].pitch;
    const need = runFloor(spec, z, pitch, isLast);
    const options = [];
    for (const o of ORIENTS) {
      const nd = TURN[o][dir];
      options.push({ o, nd, room: roomAhead(x, y, z, nd, pitch, used, w, h, spec.maxRun + 4) });
    }
    const viable = options.filter(t => t.room >= need);
    if (!viable.length) return null;
    viable.sort((a, b) => b.room - a.room);
    const chosen = (viable.length > 1 && r() < 0.35) ? viable[1] : viable[0];
    cell.role = 'piece';
    cell.type = type;
    cell.orient = chosen.o;
    dir = chosen.nd;
    v = pitch;
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

function assemble(spec, walk, t) {
  const pieces = walk.path.filter(c => c.role === 'piece');
  const fixedIdx = spec.fixedIdx == null ? -1 : spec.fixedIdx;
  const fixed = [];
  const solution = [];
  pieces.forEach((c, i) => {
    if (i === fixedIdx) fixed.push({ x: c.x, y: c.y, type: c.type, orient: c.orient, secret: !!spec.secret });
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

  return {
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
}

/* ---------- concepts (unchanged contract; validate-levels.mjs imports this) ---------- */

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
  for (const s of res.segments) {
    const x = s.to.x, y = s.to.y, z = s.to.z;
    if (!Number.isInteger(x) || !Number.isInteger(y)) continue;
    if (x < 0 || y < 0 || x >= L.size.w || y >= L.size.d) continue;
    const tt = L.t[y][x];
    if (tt > 0 && tt <= z) out.add('overflight');
  }
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
    if (onPath.has(key(v.x, v.y))) continue;
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
      if (seen.has(k) || onPath.has(k) || t[v.y][v.x] >= 1) continue;
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
  decorate(r, spec, t, onPath);

  const level = assemble(spec, walk, t);
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
    pool: ALL_TYPES.slice(),
    par: null,
    fixedIdx: null,
    secret: false,
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
    minSpan: Math.round(side * 0.5),
    minPathLen: Math.round(side * 1.15),
    slack: 1,
    slackType: 'MIRROR',
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
  if (s.par == null) s.par = s.plan.length - (s.fixedIdx == null ? 0 : 1);
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
  const res = generate(spec, { seed: +(a.seed || 1), tries: +(a.tries || 500), count: +(a.count || 1) });
  process.stdout.write(JSON.stringify(res.built, null, 1) + '\n');
  process.stderr.write('gen: ' + res.built.length + ' built in ' + res.tried + ' seeds\n');
}
