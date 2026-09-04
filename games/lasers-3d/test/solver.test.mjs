// node:test suite for solver.mjs (DESIGN.md section 6 pruning, section 7 "Solver" bullet).
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { solve, replay, flatten, needs3D, enumerate, proveMinimal } from '../solver.mjs';
import { concepts } from '../gen.mjs';
const require = createRequire(import.meta.url);
const Sim = require('../src/sim.js');
const Pieces = require('../src/pieces.js');

function mk(o) {
  const w = o.w || 5, d = o.d || 5;
  return {
    name: o.name || 'T', par: 0, size: { w, d },
    terrain: o.terrain || Array.from({ length: d }, () => '0'.repeat(w)),
    emitter: o.emitter, targets: o.targets, fixed: o.fixed || [], tray: o.tray
  };
}

// (1) FIRST BOUNCE (INTERFACES.md example A): par 1, one mirror at (2,2) '/'.
const FIRST_BOUNCE = mk({ emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 2, y: 4 }], tray: ['MIRROR'] });

// (2) Wall at (2,2) blocks the straight shot; beam must go N at (1,2) then E at (1,4). par 2.
const WALLED = mk({
  terrain: ['00000', '00000', '00300', '00000', '00000'],
  emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 2, y: 4 }], tray: ['MIRROR', 'MIRROR']
});

// (3) Target in the middle of a 3x3 plateau (t=1). Needs WEDGE + DIP + MIRROR (par 3): the WEDGE
// starts the climb, the DIP LEVELS it on the plateau top (under the corrected rule a MIRROR cannot -
// spec 12.1 - so the old WEDGE + 2 MIRRORs tray no longer solves this at all), and the MIRROR steers
// the level beam into the orb. Under flat rules the plateau is a solid block and the target is
// unreachable, so this is also the flat-unsolvable fixture.
const PLATEAU = mk({
  terrain: ['00000', '00000', '00111', '00111', '00111'],
  emitter: { x: 0, y: 1, dir: 'E' }, targets: [{ x: 3, y: 3 }], tray: ['WEDGE', 'DIP', 'MIRROR']
});

// (4) Secret fixed WEDGE at (2,2). Flat: it is a mirror, a MIRROR at (2,4) finishes the shot.
// 3D: the beam climbs and flies over (2,4).
const SECRET_WEDGE = mk({
  emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 4, y: 4 }],
  fixed: [{ x: 2, y: 2, type: 'WEDGE', orient: '/', secret: true }], tray: ['MIRROR']
});

describe('solve: known levels', () => {
  test('(1) FIRST BOUNCE par 1, unique, known solution', () => {
    const r = solve(FIRST_BOUNCE);
    assert.equal(r.solvable, true);
    assert.equal(r.par, 1);
    assert.equal(r.unique, true);
    assert.deepEqual(r.solution, [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }]);
    assert.equal(replay(FIRST_BOUNCE, r.solution).allTargetsHit, true);
    assert.ok(r.nodes > 0);
  });

  test('(2) wall level par 2, unique, known solution', () => {
    const r = solve(WALLED);
    assert.equal(r.solvable, true);
    assert.equal(r.par, 2);
    assert.equal(r.unique, true);
    assert.deepEqual(r.solution, [
      { x: 1, y: 2, type: 'MIRROR', orient: '/' },
      { x: 1, y: 4, type: 'MIRROR', orient: '/' }
    ]);
    assert.equal(replay(WALLED, r.solution).allTargetsHit, true);
  });

  test('maxPieces caps the search; tray override works', () => {
    assert.equal(solve(WALLED, { maxPieces: 1 }).solvable, false);
    assert.equal(solve(WALLED, { tray: ['MIRROR'] }).solvable, false);
    assert.equal(solve(WALLED, { tray: ['MIRROR', 'MIRROR', 'MIRROR'] }).par, 2);
  });

  test('par 0 when the emitter already lights the target', () => {
    const lvl = mk({ emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 4, y: 2 }], tray: ['MIRROR'] });
    const r = solve(lvl);
    assert.equal(r.par, 0);
    assert.deepEqual(r.solution, []);
    assert.equal(r.unique, true);
  });

  test('(3) plateau level solvable in 3D with par 3 (WEDGE climbs, DIP levels, MIRROR steers)', () => {
    const r = solve(PLATEAU, { maxSolutions: Infinity });
    assert.equal(r.solvable, true);
    assert.equal(r.par, 3);
    assert.equal(replay(PLATEAU, r.solution).allTargetsHit, true);
    for (const s of r.solutions) assert.equal(replay(PLATEAU, s).allTargetsHit, true);
    // every minimal solution uses the DIP: only a DIP can level the climb onto the plateau top
    for (const s of r.solutions) assert.ok(s.some(p => p.type === 'DIP'), JSON.stringify(s));
    // and the old set-pitch tray is now genuinely unsolvable
    assert.equal(solve(PLATEAU, { tray: ['WEDGE', 'MIRROR', 'MIRROR'] }).solvable, false);
  });
});

describe('flatten / needs3D', () => {
  test('flatten: raised -> 3, emitter/targets at 0, raised fixed dropped, all types MIRROR', () => {
    const lvl = mk({
      terrain: ['00000', '01000', '00020', '00000', '00003'],
      emitter: { x: 1, y: 1, dir: 'E' }, targets: [{ x: 4, y: 4 }],
      fixed: [{ x: 3, y: 2, type: 'WEDGE', orient: '\\', secret: true }, { x: 2, y: 0, type: 'DIP', orient: '/' }],
      tray: ['WEDGE', 'DIP', 'MIRROR']
    });
    const f = flatten(lvl);
    assert.deepEqual(f.terrain, ['00000', '00000', '00030', '00000', '00000']);
    assert.deepEqual(f.fixed, [{ x: 2, y: 0, type: 'MIRROR', orient: '/', secret: false }]);
    assert.deepEqual(f.tray, ['MIRROR', 'MIRROR', 'MIRROR']);
    assert.deepEqual(f.emitter, lvl.emitter);
    assert.deepEqual(f.targets, lvl.targets);
    assert.equal(lvl.terrain[1], '01000', 'input not mutated');
    assert.doesNotThrow(() => Sim.parseLevel(f));
  });

  test('(3) plateau target: needs3D with reason flat-unsolvable', () => {
    const r = needs3D(PLATEAU);
    assert.equal(r.needs3D, true);
    assert.equal(r.reason, 'flat-unsolvable');
    assert.deepEqual(r.flatSolutions, []);
  });

  test('(4) secret wedge: flat solution exists but fails in 3D', () => {
    const r = needs3D(SECRET_WEDGE);
    assert.equal(r.needs3D, true);
    assert.equal(r.reason, 'flat-routes-fail-in-3d');
    assert.deepEqual(r.flatSolutions, [[{ x: 2, y: 4, type: 'MIRROR', orient: '/' }]]);
    const t = replay(SECRET_WEDGE, r.flatSolutions[0]);
    assert.equal(t.allTargetsHit, false);
    assert.deepEqual(t.overflights, [{ x: 2, y: 4 }]);
  });

  test('pure 2D level: needs3D false, flat-route-works', () => {
    const r = needs3D(FIRST_BOUNCE);
    assert.equal(r.needs3D, false);
    assert.equal(r.reason, 'flat-route-works');
    assert.equal(r.flatSolutions.length, 1);
  });

  // The flat projection only ever describes the FLAT game. A candidate found there must be replayed
  // against the untouched 3D level with the tray's REAL piece types, never as a mirror-shaped stand-in:
  // the same cell and orientation solves flat as a MIRROR and misses in 3D as the WEDGE it really is.
  test('flat route is replayed with the tray\'s real piece types, not as MIRRORs', () => {
    const lvl = mk({ emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 2, y: 4 }], tray: ['WEDGE'] });
    assert.equal(replay(lvl, [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }]).allTargetsHit, true, 'as a MIRROR it works');
    assert.equal(replay(lvl, [{ x: 2, y: 2, type: 'WEDGE', orient: '/' }]).allTargetsHit, false, 'as the real WEDGE it climbs past');
    const r = needs3D(lvl);
    assert.equal(r.reason, 'flat-routes-fail-in-3d');
    assert.equal(r.needs3D, true);
  });

  // Under the corrected rule (spec 12) MIRROR PRESERVES the pitch instead of zeroing it, so
  // flatten()'s claim - "the CLASSIC 2D game" - has to be re-established rather than assumed.
  // It still holds, and for a stronger reason than before: in the flat projection the emitter fires
  // level, every t >= 1 cell is a full wall (nothing can climb onto one) and every piece is a MIRROR,
  // which now preserves v. v starts at 0 and no piece can ever change it, so EVERY segment is level.
  test('flatten really is 2D: every segment of every flat trace has v === 0 (spec 12 re-check)', () => {
    const cases = [FIRST_BOUNCE, WALLED, PLATEAU, SECRET_WEDGE];
    const r = rng(20260903);
    for (let i = 0; i < 120; i++) cases.push(randomLevel(r));
    for (const lvl of cases) {
      const F = Sim.parseLevel(flatten(lvl));
      // heights in the projection are only 0 or 3, and 3 is a full wall
      assert.ok(F.terrain.join('').split('').every(c => c === '0' || c === '3'), F.terrain.join('|'));
      assert.ok(F.tray.every(t => t === 'MIRROR'));
      assert.ok(F.fixed.every(f => f.type === 'MIRROR' && F.t[f.y][f.x] === 0));
      // every reachable flat trace, with any legal placement of any tray piece, stays level
      const placements = [[]];
      for (let y = 0; y < F.size.d; y++) for (let x = 0; x < F.size.w; x++) {
        for (const o of Pieces.ORIENTS) if (Sim.canPlace(F, [], x, y)) placements.push([{ x, y, type: 'MIRROR', orient: o }]);
      }
      for (const placed of placements) {
        const t = Sim.trace(F, placed);
        assert.ok(t.segments.every(sg => sg.v === 0), 'a flat segment climbed');
        assert.ok(t.visited.every(v => v.z === 0 && v.v === 0), 'a flat beam left level 0');
        assert.deepEqual(t.events.filter(e => e.kind === 'pitch'), [], 'a flat trace changed pitch');
        assert.deepEqual(t.overflights, [], 'nothing can be flown over in the flat game');
      }
    }
  });

  test('solve({flat:true}) equals solve(flatten(level))', () => {
    assert.deepEqual(solve(SECRET_WEDGE, { flat: true }), solve(flatten(SECRET_WEDGE)));
  });
});

// ---------- (5) pruning soundness vs brute force on random 4x4 levels ----------

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }

function randomLevel(r) {
  const w = 4, d = 4;
  const terrain = [];
  for (let y = 0; y < d; y++) {
    let row = '';
    for (let x = 0; x < w; x++) { const u = r(); row += u < 0.55 ? '0' : u < 0.85 ? '1' : u < 0.95 ? '2' : '3'; }
    terrain.push(row);
  }
  const side = Math.floor(r() * 4);
  const k = Math.floor(r() * 4);
  const emitter = [{ x: 0, y: k, dir: 'E' }, { x: 3, y: k, dir: 'W' }, { x: k, y: 0, dir: 'N' }, { x: k, y: 3, dir: 'S' }][side];
  const used = new Set([`${emitter.x},${emitter.y}`]);
  const free = () => { for (;;) { const x = Math.floor(r() * w), y = Math.floor(r() * d); const key = `${x},${y}`; if (!used.has(key)) { used.add(key); return { x, y }; } } };
  const targets = [free()];
  const fixed = [];
  if (r() < 0.4) { const c = free(); fixed.push({ x: c.x, y: c.y, type: pick(r, Pieces.TYPES), orient: pick(r, Pieces.ORIENTS), secret: r() < 0.5 }); }
  const n = 1 + Math.floor(r() * 2);
  const tray = [];
  for (let i = 0; i < n; i++) tray.push(pick(r, Pieces.TYPES));
  return { name: 'R', par: 0, size: { w, d }, terrain, emitter, targets, fixed, tray };
}

function canon(placed) {
  return placed.map(p => `${p.x},${p.y},${p.type},${p.orient}`).sort().join('|');
}

// Exhaustive: every placed set of size n (cells x types x orients) respecting the tray multiset and canPlace.
function brute(level) {
  const L = Sim.parseLevel(level);
  const cells = [];
  for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) if (Sim.canPlace(L, [], x, y)) cells.push({ x, y });
  const tray = L.tray.slice();
  for (let n = 0; n <= tray.length; n++) {
    const sols = new Set();
    const rec = (placed, startCell, remaining) => {
      if (placed.length === n) {
        if (Sim.trace(L, placed).allTargetsHit) sols.add(canon(placed));
        return;
      }
      for (let ci = startCell; ci < cells.length; ci++) {
        const tried = new Set();
        for (let ti = 0; ti < remaining.length; ti++) {
          const type = remaining[ti];
          if (tried.has(type)) continue;
          tried.add(type);
          const rest = remaining.slice(); rest.splice(ti, 1);
          for (const orient of Pieces.ORIENTS) rec(placed.concat([{ x: cells[ci].x, y: cells[ci].y, type, orient }]), ci + 1, rest);
        }
      }
    };
    rec([], 0, tray);
    if (sols.size) return { solvable: true, par: n, count: sols.size, sols };
  }
  return { solvable: false, par: null, count: 0, sols: new Set() };
}

describe('(5) pruning soundness', () => {
  test('solve() matches brute force on 30 random 4x4 levels (solvable, par, minimal-solution count)', () => {
    const r = rng(20260903);
    let solvableCount = 0;
    for (let i = 0; i < 30; i++) {
      const lvl = randomLevel(r);
      const a = solve(lvl, { maxSolutions: Infinity });
      const b = brute(lvl);
      const ctx = JSON.stringify(lvl);
      assert.equal(a.solvable, b.solvable, 'solvable ' + ctx);
      assert.equal(a.par, b.par, 'par ' + ctx);
      assert.equal(a.solutions.length, b.count, 'minimal solution count ' + ctx);
      assert.equal(a.unique, b.count === 1, 'unique ' + ctx);
      assert.deepEqual(new Set(a.solutions.map(canon)), b.sols, 'solution sets ' + ctx);
      if (a.solvable) { solvableCount++; assert.equal(replay(lvl, a.solution).allTargetsHit, true); }
    }
    assert.ok(solvableCount >= 3, 'sample has solvable levels: ' + solvableCount);
    assert.ok(solvableCount <= 27, 'sample has unsolvable levels: ' + solvableCount);
  });
});

// ---------- (5b) needs3D vs a TOTAL brute force over every placement ----------

// DESIGN.md 3.7 asks: is there ANY flat answer - any placement, of any size up to the tray, that solves
// the board under classic flat rules - which, played with the tray's real piece types, also solves the
// real 3D level? The reference below enumerates every such placement, including ones carrying a piece
// the flat beam never touches (which the solver's irredundant enumeration skips by design). It is the
// check that keeps needs3D() from overstating what it proved.
function bruteNeeds3D(level) {
  const L = Sim.parseLevel(level);
  const F = Sim.parseLevel(flatten(level));
  const cells = [];
  for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) cells.push({ x, y });
  const n = L.tray.length;
  let anyFlat = false, anyWorks = false;
  const rec = (idx, pos) => {
    if (pos.length) {
      const legalFlat = pos.every((p, i) => Sim.canPlace(F, pos.slice(0, i), p.x, p.y));
      if (legalFlat && Sim.trace(F, pos.map(p => ({ x: p.x, y: p.y, type: 'MIRROR', orient: p.orient }))).allTargetsHit) {
        anyFlat = true;
        const counts = {};
        for (const t of L.tray) counts[t] = (counts[t] || 0) + 1;
        const types = Object.keys(counts), cur = [];
        const assign = (i) => {
          if (anyWorks) return;
          if (i === pos.length) {
            const placed = pos.map((p, j) => ({ x: p.x, y: p.y, type: cur[j], orient: p.orient }));
            const legal = placed.every((p, j) => Sim.canPlace(L, placed.slice(0, j), p.x, p.y));
            if (legal && Sim.trace(L, placed).allTargetsHit) anyWorks = true;
            return;
          }
          for (const t of types) { if (!counts[t]) continue; counts[t]--; cur.push(t); assign(i + 1); cur.pop(); counts[t]++; }
        };
        assign(0);
      }
    }
    if (pos.length === n || anyWorks) return;
    for (let ci = idx; ci < cells.length; ci++) {
      for (const o of Pieces.ORIENTS) {
        pos.push({ x: cells[ci].x, y: cells[ci].y, orient: o });
        rec(ci + 1, pos);
        pos.pop();
        if (anyWorks) return;
      }
    }
  };
  rec(0, []);
  return { anyFlat, anyWorks };
}

function randomLevelN(r, w, d, traySize) {
  const terrain = [];
  for (let y = 0; y < d; y++) {
    let row = '';
    for (let x = 0; x < w; x++) { const u = r(); row += u < 0.55 ? '0' : u < 0.85 ? '1' : u < 0.95 ? '2' : '3'; }
    terrain.push(row);
  }
  const side = Math.floor(r() * 4), k = Math.floor(r() * d);
  const emitter = [{ x: 0, y: k, dir: 'E' }, { x: w - 1, y: k, dir: 'W' }, { x: k, y: 0, dir: 'N' }, { x: k, y: d - 1, dir: 'S' }][side];
  const used = new Set([`${emitter.x},${emitter.y}`]);
  const free = () => { for (;;) { const x = Math.floor(r() * w), y = Math.floor(r() * d); const q = `${x},${y}`; if (!used.has(q)) { used.add(q); return { x, y }; } } };
  const targets = [free()];
  const fixed = [];
  if (r() < 0.35) { const c = free(); fixed.push({ x: c.x, y: c.y, type: pick(r, Pieces.TYPES), orient: pick(r, Pieces.ORIENTS), secret: r() < 0.5 }); }
  const tray = [];
  for (let i = 0; i < traySize; i++) tray.push(pick(r, Pieces.TYPES));
  return { name: 'R', par: 0, size: { w, d }, terrain, emitter, targets, fixed, tray };
}

describe('(5b) needs3D soundness', () => {
  test('needs3D() matches a total brute force on 90 random 4x4 and 5x5 levels', () => {
    const r = rng(20260904);
    let unsolvable = 0, works = 0, fails = 0;
    for (let i = 0; i < 90; i++) {
      const w = i % 3 === 0 ? 5 : 4;
      const lvl = randomLevelN(r, w, w, 1 + Math.floor(r() * 3));
      const mine = needs3D(lvl);
      const ref = bruteNeeds3D(lvl);
      const ctx = mine.reason + ' ' + JSON.stringify(lvl);
      assert.equal(mine.needs3D, !ref.anyWorks, '3D-necessity ' + ctx);
      if (!ref.anyFlat) assert.equal(mine.reason, 'flat-unsolvable', 'no flat answer at all -> flat-unsolvable ' + ctx);
      if (mine.reason === 'flat-unsolvable') unsolvable++;
      else if (mine.reason === 'flat-route-works') works++;
      else fails++;
    }
    assert.ok(unsolvable > 0 && works > 0 && fails > 0, 'sample hits all three verdicts: ' + [unsolvable, works, fails]);
  });
});

describe('enumerate / proveMinimal', () => {
  test('enumerate() finds solutions at every size, not just the minimum', () => {
    const e = enumerate(WALLED);
    assert.equal(e.truncated, false);
    assert.equal(e.byDepth.length, WALLED.tray.length + 1);
    assert.equal(e.byDepth[0], 0);
    assert.equal(e.byDepth[1], 0);
    assert.equal(e.byDepth[2], 1);
    assert.equal(e.solutions.length, 1);
    for (const s of e.solutions) assert.equal(replay(WALLED, s).allTargetsHit, true);
  });

  test('proveMinimal() proves par by exhausting depth par-1', () => {
    const a = proveMinimal(WALLED, 2);
    assert.equal(a.proven, true);
    assert.equal(a.truncated, false);
    assert.equal(a.counterexample, null);
    const b = proveMinimal(WALLED, 3);            // par is really 2, so depth 2 finds a counterexample
    assert.equal(b.proven, false);
    assert.equal(replay(WALLED, b.counterexample).allTargetsHit, true);
    assert.ok(a.nodes < solve(WALLED, { maxSolutions: Infinity }).nodes, 'the bounded proof is cheaper than the full solve');
  });

  test('a node budget truncates instead of lying about unsolvability', () => {
    const r = solve(PLATEAU, { maxNodes: 3 });
    assert.equal(r.truncated, true);
    assert.equal(r.solvable, false);
    assert.ok(r.nodes <= 4);
    const p = proveMinimal(PLATEAU, 3, { maxNodes: 3 });
    assert.equal(p.proven, false);
    assert.equal(p.truncated, true);
  });

  test('step-cap telemetry: these searches never depend on MAX_STEPS', () => {
    for (const lvl of [FIRST_BOUNCE, WALLED, PLATEAU, SECRET_WEDGE]) {
      const r = solve(lvl, { maxSolutions: Infinity });
      assert.equal(r.capHits, 0, 'no trace ended on the step cap');
      assert.ok(r.maxSegments > 0 && r.maxSegments < Sim.MAX_STEPS);
    }
  });
});

describe('(6) unsolvable and (7) determinism', () => {
  test('(6) unsolvable 7x7 with 3 mirrors returns solvable:false in < 2 s', () => {
    const lvl = mk({
      w: 7, d: 7,
      terrain: ['0000000', '0000000', '0000333', '0000303', '0000333', '0000000', '0000000'],
      emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 5, y: 3 }], tray: ['MIRROR', 'MIRROR', 'MIRROR']
    });
    const t0 = Date.now();
    const r = solve(lvl);
    const ms = Date.now() - t0;
    assert.equal(r.solvable, false);
    assert.equal(r.par, null);
    assert.deepEqual(r.solutions, []);
    assert.equal(r.unique, false);
    assert.ok(ms < 2000, 'took ' + ms + ' ms');
  });

  test('(7) deterministic: repeated calls give identical results', () => {
    for (const lvl of [FIRST_BOUNCE, WALLED, PLATEAU, SECRET_WEDGE]) {
      assert.deepEqual(solve(lvl), solve(lvl));
      assert.deepEqual(needs3D(lvl), needs3D(lvl));
    }
    const r = rng(7);
    for (let i = 0; i < 5; i++) { const lvl = randomLevel(r); assert.deepEqual(solve(lvl), solve(lvl)); }
  });

  test('inputs are not mutated', () => {
    const before = JSON.stringify(PLATEAU);
    solve(PLATEAU); needs3D(PLATEAU); flatten(PLATEAU);
    assert.equal(JSON.stringify(PLATEAU), before);
  });
});

// ---------------------------------------------------------------------------------------------
// ARCHES AND WINDOWS (DESIGN.md section 13) - the solver's side
// ---------------------------------------------------------------------------------------------

// 7x7. Row y=3: emitter at (0,3), a full-height column at (3,3) with a hole in it, target at (6,3).
function opened(levels, emitZ = 0) {
  const row = ['0', '0', '0', '3', '0', '0', '0'];
  row[0] = String(emitZ); row[6] = String(emitZ);
  return {
    name: 'OPEN', par: 0, size: { w: 7, d: 7 },
    terrain: ['0000000', '0000000', '0000000', row.join(''), '0000000', '0000000', '0000000'],
    openings: [{ x: 3, y: 3, levels }],
    emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }], fixed: [], tray: ['MIRROR', 'MIRROR']
  };
}

describe('openings: flatten keeps an opened column a WALL (DESIGN.md 13, reasoning in solver.mjs)', () => {
  test('flatten drops `openings` entirely and reports it as an explicit empty array', () => {
    const f = flatten(opened([0]));
    assert.deepEqual(f.openings, [], 'the decision is spelled out, not left off');
    assert.equal(f.terrain[3][3], '3', 'the opened column is a full wall in the projection');
    const F = Sim.parseLevel(f);
    assert.ok(F.openMask.every(row => row.every(m => m === 0)));
  });

  test('the route UNDER an arch exists in 3D and does not exist in the flat projection', () => {
    const lvl = opened([0]);
    assert.equal(replay(lvl, []).end, 'target', 'in 3D the beam goes under the arch');
    assert.equal(replay(flatten(lvl), []).end, 'blocked', 'in the flat game that column is a wall');
  });

  // The claim flatten makes - "every t >= 1 is an impassable wall, so every flat segment is level at
  // z = 0" - is what forces the projection to BE the classic 2D game. Section 13 could have broken it
  // (a passable opening would let a flat beam cross a wall), so it is re-proven here over levels that
  // DO carry openings, exactly as it was re-proven for the delta pitch rule of section 12.
  test('flatten is still 2D on levels WITH openings: every flat trace is level at z = 0', () => {
    const r = rng(20260913);
    const cases = [opened([0]), opened([1], 1), opened([2], 2), opened([0, 2])];
    for (let i = 0; i < 80; i++) cases.push(randomOpenLevel(r));
    for (const lvl of cases) {
      const F = Sim.parseLevel(flatten(lvl));
      assert.ok(F.terrain.join('').split('').every(c => c === '0' || c === '3'));
      assert.deepEqual(F.openings, [], 'an opening survived into the flat projection');
      const placements = [[]];
      for (let y = 0; y < F.size.d; y++) for (let x = 0; x < F.size.w; x++) {
        for (const o of Pieces.ORIENTS) if (Sim.canPlace(F, [], x, y)) placements.push([{ x, y, type: 'MIRROR', orient: o }]);
      }
      for (const placed of placements) {
        const t = Sim.trace(F, placed);
        assert.ok(t.segments.every(sg => sg.v === 0), 'a flat segment climbed');
        assert.ok(t.visited.every(v => v.z === 0 && v.v === 0), 'a flat beam left level 0');
        assert.deepEqual(t.underpasses, [], 'a flat beam went UNDER something - the wall stopped being a wall');
        assert.deepEqual(t.overflights, [], 'nothing can be flown over in the flat game');
      }
    }
  });

  test('an under-arch level comes out flat-unsolvable - the AIRTIGHT verdict the shipped set needs', () => {
    // A one-mirror board whose only route threads the opening.
    const lvl = {
      name: 'ARCHED', par: 1, size: { w: 7, d: 7 },
      terrain: ['0000000', '0000000', '0003000', '0000000', '0000000', '0000000', '0000000'],
      openings: [{ x: 3, y: 2, levels: [0] }],
      emitter: { x: 3, y: 0, dir: 'N' }, targets: [{ x: 6, y: 4 }], fixed: [], tray: ['MIRROR']
    };
    assert.equal(replay(lvl, [{ x: 3, y: 4, type: 'MIRROR', orient: '/' }]).allTargetsHit, true);
    const n3 = needs3D(lvl);
    assert.equal(n3.needs3D, true);
    assert.equal(n3.reason, 'flat-unsolvable');
    assert.deepEqual(n3.flatSolutions, []);
  });
});

describe('openings: the search never places a piece inside one', () => {
  // canPlace is per CELL, so an opened column IS placeable - on its top. What must never happen is a
  // piece being offered because the beam threads the hole below it: the beam is at z < t there, and
  // candidateCells only offers cells the beam enters at exactly t.
  const lvl = {
    name: 'THREAD', par: 1, size: { w: 7, d: 7 },
    terrain: ['0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000'],
    openings: [{ x: 3, y: 3, levels: [0] }],
    emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 5, y: 5 }], fixed: [], tray: ['MIRROR', 'MIRROR']
  };
  test('the opened column is placeable (on its top) but never appears in a minimal solution', () => {
    assert.equal(Sim.canPlace(lvl, [], 3, 3), true, 'canPlace is unchanged by an opening');
    const r = solve(lvl, { maxSolutions: Infinity });
    assert.equal(r.solvable, true);
    assert.equal(r.par, 1);
    for (const sol of r.solutions) {
      for (const p of sol) assert.ok(!(p.x === 3 && p.y === 3), 'a piece was placed on the column the beam threads');
    }
  });
  test('a piece put there by hand is passed UNDER, not acted on, so it cannot solve the level', () => {
    const t = replay(lvl, [{ x: 3, y: 3, type: 'MIRROR', orient: '/' }]);
    assert.deepEqual(t.pieceHits, []);
    assert.deepEqual(t.underpasses, [{ x: 3, y: 3 }]);
    assert.equal(t.allTargetsHit, false);
  });
});

// A random 4x4 level that carries openings, for the brute-force cross-check below.
function randomOpenLevel(r) {
  const lvl = randomLevel(r);
  const L = Sim.parseLevel(lvl);
  const openings = [];
  for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) {
    const top = L.t[y][x];
    if (top < 1 || r() < 0.6) continue;
    const levels = [];
    for (let z = 0; z < top; z++) if (r() < 0.5) levels.push(z);
    if (levels.length) openings.push({ x, y, levels });
  }
  return Object.assign({}, lvl, { openings });
}

describe('openings: pruning soundness on levels that carry them', () => {
  test('solve() still matches brute force on 120 random 4x4 levels WITH openings', () => {
    const r = rng(20260914);
    let withOpenings = 0, threaded = 0, solvableCount = 0, beamThreads = 0;
    for (let i = 0; i < 120; i++) {
      const lvl = randomOpenLevel(r);
      const L = Sim.parseLevel(lvl);
      if (L.openings.length) withOpenings++;
      const a = solve(lvl, { maxSolutions: Infinity });
      const b = brute(lvl);
      const ctx = JSON.stringify(lvl);
      assert.equal(a.solvable, b.solvable, 'solvable ' + ctx);
      assert.equal(a.par, b.par, 'par ' + ctx);
      assert.equal(a.solutions.length, b.count, 'minimal solution count ' + ctx);
      assert.deepEqual(new Set(a.solutions.map(canon)), b.sols, 'solution sets ' + ctx);
      if (a.solvable) {
        solvableCount++;
        assert.equal(replay(lvl, a.solution).allTargetsHit, true);
        if (a.solutions.some(sol => replay(lvl, sol).visited.some(v => v.z < L.t[v.y][v.x]))) threaded++;
      }
      // Every trace inside the sample must respect 13.2: the beam is only ever below a column's top
      // at a level that column has open. A stepper bug here would show up as a beam inside rock.
      const t0 = replay(lvl, []);
      let usedOpening = false;
      for (const v of t0.visited) {
        if (v.z >= L.t[v.y][v.x]) continue;
        assert.equal((L.openMask[v.y][v.x] >> v.z) & 1, 1, 'the beam entered solid rock: ' + JSON.stringify(lvl));
        usedOpening = true;
      }
      if (usedOpening) beamThreads++;
    }
    assert.ok(withOpenings >= 60, 'the sample must actually carry openings: ' + withOpenings);
    assert.ok(solvableCount >= 3, 'sample has solvable levels: ' + solvableCount);
    assert.ok(beamThreads >= 5, 'beams should routinely thread the openings: ' + beamThreads);
    assert.ok(threaded >= 1, 'at least one minimal solution should route through an opening: ' + threaded);
  });

  test('proveMinimal and enumerate agree with brute force on an opening level', () => {
    const lvl = opened([0]);                            // solvable with nothing placed: par 0
    assert.equal(solve(lvl).par, 0);
    assert.equal(proveMinimal(lvl, 0).proven, true, 'par 0 needs no search');
    const both = {
      name: 'TWO WAYS', par: 1, size: { w: 7, d: 7 },
      terrain: ['0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000'],
      openings: [{ x: 3, y: 3, levels: [0] }],
      emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 5, y: 5 }], fixed: [], tray: ['MIRROR', 'MIRROR']
    };
    const e = enumerate(both, {});
    const b = brute(both);
    assert.equal(e.byDepth[b.par], b.count, 'enumerate finds every minimal solution the brute force does');
    assert.equal(proveMinimal(both, b.par).proven, true);
    assert.equal(proveMinimal(both, b.par + 1).proven, false, 'a par one too high is caught');
  });
});

describe('openings: the concept tags of DESIGN.md 13', () => {
  test('under-arch is tagged for a level-0 thread, through-window for one above it', () => {
    assert.ok(concepts(opened([0]), []).includes('under-arch'));
    assert.ok(!concepts(opened([0]), []).includes('through-window'));
    assert.ok(concepts(opened([1], 1), []).includes('through-window'));
    assert.ok(!concepts(opened([1], 1), []).includes('under-arch'));
    assert.ok(concepts(opened([2], 2), []).includes('through-window'));
  });
  test('flying OVER the same column tags neither - it is an overflight', () => {
    const cs = concepts(opened([0], 3), []);
    assert.ok(!cs.includes('under-arch'));
    assert.ok(!cs.includes('through-window'));
    assert.ok(cs.includes('overflight'));
  });
  test('being BLOCKED by the column tags neither', () => {
    const cs = concepts(opened([0], 1), []);
    assert.equal(replay(opened([0], 1), []).end, 'blocked');
    assert.ok(!cs.includes('under-arch') && !cs.includes('through-window'));
  });
  test('the shipped level set carries both tags, on distinct levels', () => {
    const LEVELS = require('../src/levels.js');
    const arch = [], win = [];
    for (const [i, raw] of LEVELS.entries()) {
      const cs = concepts(raw, raw.solution || []);
      if (cs.includes('under-arch')) arch.push(i + 1);
      if (cs.includes('through-window')) win.push(i + 1);
    }
    assert.ok(arch.length >= 3, 'under-arch levels: ' + arch.join(','));
    assert.ok(win.length >= 3, 'through-window levels: ' + win.join(','));
    assert.ok(Math.min(...arch) < Math.min(...win), 'the arch must be introduced before the window');
  });
});
