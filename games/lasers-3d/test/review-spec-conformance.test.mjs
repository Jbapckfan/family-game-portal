// Spec-conformance review: boundary cases for DESIGN.md 3.2 / 3.3 / 3.4 and INTERFACES.md.
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sim = require('../src/sim.js');
const { trace, canPlace, parseLevel, H_MAX } = Sim;

function mk(o = {}) {
  const w = o.w || 7, d = o.d || 7;
  const terrain = o.terrain || Array.from({ length: d }, () => '0'.repeat(w));
  return {
    name: o.name || 'R', par: o.par == null ? 0 : o.par, size: { w, d }, terrain,
    emitter: o.emitter || { x: 0, y: 3, dir: 'E' },
    targets: o.targets || [{ x: 6, y: 3 }],
    fixed: o.fixed || [],
    tray: o.tray || ['MIRROR', 'MIRROR', 'WEDGE', 'DIP'],
  };
}
const M = (x, y, orient = '/') => ({ x, y, type: 'MIRROR', orient });
const W = (x, y, orient = '/') => ({ x, y, type: 'WEDGE', orient });
const D = (x, y, orient = '/') => ({ x, y, type: 'DIP', orient });
const rows = (...r) => r;
const far = [{ x: 6, y: 6 }]; // an unreachable target for "no hit" scenarios

describe('3.2 step order and boundaries', () => {
  test('arrival level exactly equal to terrain ENTERS (t[next] > z\' is strict)', () => {
    // level-0 beam arrives at a t=0 cell: enters. Climbing beam z'=1 arrives at t=1: enters, piece there acts.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0100000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(1, 3, '/'), M(1, 4, '/')]);
    // (1,3) wedge E->N v1; (1,4) z'=1 == t=1 -> mirror acts N->E level at z=1
    assert.deepEqual(r.visited[1], { x: 1, y: 4, z: 1, d: 'N', v: 1 });
    assert.equal(r.pieceHits.length, 2);
    assert.equal(r.pieceHits[1].type, 'MIRROR');
    assert.deepEqual(r.visited[2], { x: 2, y: 4, z: 1, d: 'E', v: 0 });
  });

  test('descending beam arriving one below the terrain is blocked (z\' used, not z)', () => {
    // emitter on t=1 ridge at (0,3) E; DIP on t=1 at (2,3) '/' E->N v-1; (2,4) is t=1 and z'=0 -> blocked.
    const terrain = rows('0000000', '0000000', '0000000', '1010000', '0010000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [D(2, 3, '/')]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2, y: 3.5, z: 1 });
    assert.equal(r.visited[r.visited.length - 1].x, 2);
    assert.equal(r.visited[r.visited.length - 1].y, 3);
  });

  test('off-grid is checked before floor: DIP at z=0 on the edge going off-grid -> lost-edge', () => {
    // emitter (0,0) E, DIP at (1,0) '\\' E->S v-1: next (1,-1) is off-grid AND z'=-1.
    const r = trace(mk({ emitter: { x: 0, y: 0, dir: 'E' }, targets: far }), [D(1, 0, '\\')]);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.endPoint, { x: 1, y: -1, z: -1 });
  });

  test('off-grid is checked before sky: wedge at z=3 on the north edge -> lost-edge with endPoint z=4', () => {
    // emitter on t=3 at (0,6) E; wedge on t=3 at (1,6) '/' E->N v+1; next (1,7) off-grid and z'=4.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '3300000');
    const r = trace(mk({ terrain, emitter: { x: 0, y: 6, dir: 'E' }, targets: [{ x: 6, y: 0 }] }), [W(1, 6, '/')]);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.endPoint, { x: 1, y: 7, z: 4 });
  });

  test('sky boundary: level 3 is the top valid level; z\'=4 is lost-sky', () => {
    assert.equal(H_MAX, 4);
    // emitter on t=3 at (0,3) E; the whole row 3 is t=3 -> a level beam at z=3 crosses to the target on t=3.
    const terrain = rows('0000000', '0000000', '0000000', '3333333', '0000000', '0000000', '0000000');
    const ok = trace(mk({ terrain }), []);
    assert.equal(ok.end, 'target');
    assert.equal(ok.endPoint.z, 3);
    // WEDGE on t=3: acts (z'==t), then the very next step is z'=4 -> lost-sky, stub at boundary with z=3 and v=1
    const up = trace(mk({ terrain, targets: far }), [W(3, 3, '/')]);
    assert.equal(up.end, 'lost-sky');
    assert.deepEqual(up.pieceHits, [{ x: 3, y: 3, type: 'WEDGE', orient: '/', fixed: false }]);
    const last = up.segments[up.segments.length - 1];
    assert.deepEqual(last, { from: { x: 3, y: 3, z: 3 }, to: { x: 3, y: 3.5, z: 3 }, d: 'N', v: 1 });
    assert.deepEqual(up.altitudeMarks, [{ x: 3, y: 3, z: 3 }, { x: 3, y: 3.5, z: 3 }]);
  });

  test('piece on terrain 3 catches a climbing beam that arrives at z=3 and levels it', () => {
    // emitter (0,0) E; wedge (1,0) '/' N climbing: (1,1) z1, (1,2) z2, (1,3) z3 where t=3 -> mirror acts, E level at z3.
    // target on t=3 at (6,3); cells between are t=0 (flown over at z=3).
    const terrain = rows('0000000', '0000000', '0000000', '0300003', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 3 }] }), [W(1, 0, '/'), M(1, 3, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.deepEqual(r.visited.find(s => s.x === 1 && s.y === 3), { x: 1, y: 3, z: 3, d: 'N', v: 1 });
    assert.ok(r.visited.filter(s => s.y === 3 && s.x > 1).every(s => s.z === 3 && s.v === 0 && s.d === 'E'));
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 0, z: 0 }, { x: 1, y: 3, z: 3 }, { x: 6, y: 3, z: 3 }]);
  });

  test('emitter on t=3 raised terrain emits level at z=3 and can be blocked by nothing but the sky rule', () => {
    // emitter on t=3 at (0,3); a WEDGE on a t=3 cell at (2,3) acts at z=3, the next step is z'=4 -> lost-sky.
    const terrain = rows('0000000', '0000000', '0000000', '3030000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(2, 3, '/')]);
    assert.equal(r.visited[0].z, 3);
    assert.equal(r.visited[0].v, 0);
    assert.equal(r.pieceHits.length, 1);
    assert.equal(r.end, 'lost-sky');
    // the same wedge on a t=0 cell is flown over at z=3 and the beam exits east
    const over = trace(mk({ terrain: rows('0000000', '0000000', '0000000', '3000000', '0000000', '0000000', '0000000'), targets: far }), [W(2, 3, '/')]);
    assert.equal(over.end, 'lost-edge');
    assert.deepEqual(over.overflights, [{ x: 2, y: 3 }]);
  });

  test('emitter facing directly off the grid: one stub segment, no visited cells, lost-edge', () => {
    const r = trace(mk({ emitter: { x: 0, y: 3, dir: 'W' } }), []);
    assert.equal(r.end, 'lost-edge');
    assert.equal(r.segments.length, 1);
    assert.deepEqual(r.visited, []);
    assert.deepEqual(r.endPoint, { x: -1, y: 3, z: 0 });
  });

  test('emitter facing a wall directly: blocked at the boundary, no visited cells', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0100000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.visited, []);
    assert.deepEqual(r.endPoint, { x: 0.5, y: 3, z: 0 });
  });

  test('target adjacent to the emitter (same row): lit on the first step', () => {
    const r = trace(mk({ targets: [{ x: 1, y: 3 }] }), []);
    assert.equal(r.end, 'target');
    assert.equal(r.segments.length, 1);
    assert.deepEqual(r.hits, [0]);
  });

  test('target on the emitter row BEHIND the emitter is not lit by the forward beam', () => {
    // target west of an east-facing emitter is never entered; the beam exits east.
    const r = trace(mk({ emitter: { x: 1, y: 3, dir: 'E' }, targets: [{ x: 0, y: 3 }] }), []);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.hits, []);
  });

  test('beam re-entering the emitter cell ABOVE its level passes over (emitter body is one level tall)', () => {
    // emitter (0,3) t=0 E; WEDGE (2,3) '/' N climbing: (2,4) z1, (2,5) z2 t=2 mirror '\\' N->W level;
    // (1,5) z2, (0,5) z2 t=2 mirror '/' W->S; (0,4) z2; (0,3) z2 == emitter cell at t=0 -> pass over; (0,2)...(0,0); off-grid.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '2020000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(2, 3, '/'), M(2, 5, '\\'), M(0, 5, '/')]);
    assert.equal(r.end, 'lost-edge');
    const back = r.visited.find(s => s.x === 0 && s.y === 3);
    assert.deepEqual(back, { x: 0, y: 3, z: 2, d: 'S', v: 0 });
    assert.deepEqual(r.endPoint, { x: 0, y: -1, z: 2 });
  });

  test('beam re-entering the emitter cell AT its level from a descending path is blocked', () => {
    // emitter on t=0 (0,3) E; WEDGE (2,3) N v1: (2,4) z1 t1 mirror '\\' N->W v0: (1,4) z1, (0,4) z1 t1 DIP '/' W->S v-1: (0,3) z'=0 == emitter level -> blocked.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '1010000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(2, 3, '/'), M(2, 4, '\\'), D(0, 4, '/')]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 0, y: 3.5, z: 1 });
    assert.equal(r.visited.some(s => s.x === 0 && s.y === 3), false);
  });

  test('lit target re-entered later on a different heading: hits has no duplicate, beam passes through', () => {
    // emitter (0,3) E; target0 (3,3); mirror (5,3) '/' E->N; (5,5) '\\' N->W; (3,5) '/' W->S; back through (3,3) heading S; exits south.
    const lvl = mk({ targets: [{ x: 3, y: 3 }, { x: 6, y: 6 }] });
    const r = trace(lvl, [M(5, 3, '/'), M(5, 5, '\\'), M(3, 5, '/')]);
    assert.deepEqual(r.hits, [0]);
    assert.equal(r.allTargetsHit, false);
    assert.equal(r.end, 'lost-edge');
    assert.equal(r.visited.filter(s => s.x === 3 && s.y === 3).length, 2);
    assert.deepEqual(r.endPoint, { x: 3, y: -1, z: 0 });
  });

  test('two targets on one path in one straight line: order of hits follows the beam, end is target at the second', () => {
    const r = trace(mk({ targets: [{ x: 4, y: 3 }, { x: 2, y: 3 }] }), []);
    assert.deepEqual(r.hits, [1, 0]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.endPoint, { x: 4, y: 3, z: 0 });
    assert.equal(r.visited.length, 4);
  });

  test('second target on a plateau: the first target is lit at level 0, the second only at its own level', () => {
    // target0 (2,3) t=0; target1 (5,3) t=1. Level-0 beam: lights 0, blocked by the plateau face at (5,3).
    const terrain = rows('0000000', '0000000', '0000000', '0000010', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 2, y: 3 }, { x: 5, y: 3 }] }), []);
    assert.deepEqual(r.hits, [0]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 4.5, y: 3, z: 0 });
  });

  test('loop guard: a repeated (x,y,z,d,v) state ends with loop and segments are finite', () => {
    // Reuse the documented 3D cycle and check the visited list has a repeated post-piece state at the loop cell.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0220000', '0000000');
    const placed = [M(1, 4, '/'), M(1, 3, '\\'), W(2, 3, '/'), M(2, 5, '\\'), D(1, 5, '/')];
    const r = trace(mk({ terrain, emitter: { x: 6, y: 4, dir: 'W' }, targets: [{ x: 6, y: 0 }] }), placed);
    assert.equal(r.end, 'loop');
    assert.ok(r.segments.length <= Sim.MAX_STEPS);
    assert.deepEqual(r.altitudeMarks[r.altitudeMarks.length - 1], r.endPoint);
  });
});

describe('3.3 pieces via trace (all four incoming directions, both orientations)', () => {
  const cases = [
    // [emitter, orient, expected outgoing dir]
    [{ x: 0, y: 3, dir: 'E' }, '/', 'N'], [{ x: 3, y: 0, dir: 'N' }, '/', 'E'],
    [{ x: 6, y: 3, dir: 'W' }, '/', 'S'], [{ x: 3, y: 6, dir: 'S' }, '/', 'W'],
    [{ x: 0, y: 3, dir: 'E' }, '\\', 'S'], [{ x: 3, y: 0, dir: 'N' }, '\\', 'W'],
    [{ x: 6, y: 3, dir: 'W' }, '\\', 'N'], [{ x: 3, y: 6, dir: 'S' }, '\\', 'E'],
  ];
  for (const [emitter, orient, outDir] of cases) {
    test(`MIRROR ${orient} from ${emitter.dir} -> ${outDir}`, () => {
      const r = trace(mk({ emitter, targets: [{ x: 6, y: 6 }] }), [M(3, 3, orient)]);
      const after = r.visited[r.visited.indexOf(r.visited.find(s => s.x === 3 && s.y === 3)) + 1];
      assert.equal(after.d, outDir);
      assert.equal(after.v, 0);
    });
  }
  test('WEDGE and DIP turn exactly like MIRROR and only differ in pitch', () => {
    // emitter on a t=1 ridge so a DIP can descend to z=0 before the floor; the piece sits on a t=1 cell.
    const terrain = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0000000', '0000000');
    for (const orient of ['/', '\\']) {
      const rm = trace(mk({ terrain, targets: far }), [M(3, 3, orient)]);
      const rw = trace(mk({ terrain, targets: far }), [W(3, 3, orient)]);
      const rd = trace(mk({ terrain, targets: far }), [D(3, 3, orient)]);
      assert.equal(rw.visited[3].d, rm.visited[3].d);
      assert.equal(rd.visited[3].d, rm.visited[3].d);
      assert.equal(rw.visited[3].v, 1);
      assert.equal(rd.visited[3].v, -1);
      assert.equal(rm.visited[3].v, 0);
    }
  });
  test('a piece that does not change the pitch gets no altitude mark; one that does gets exactly one', () => {
    // WEDGE hit by a climbing beam: pitch stays +1 -> no mark. Then MIRROR on t=2 levels -> mark.
    // emitter (0,0) E; wedge (1,0) '/' N v1; (1,1) z1 t1 wedge '\\' N->W v1 (no mark); (0,1) z2? t=0 -> enters z2; then (-1,1) off-grid.
    const terrain = rows('0000000', '0100000', '0000000', '0000000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, emitter: { x: 0, y: 0, dir: 'E' }, targets: far }), [W(1, 0, '/'), W(1, 1, '\\')]);
    assert.equal(r.pieceHits.length, 2);
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 0, z: 0 }, r.endPoint]);
    // DIP hit by a descending beam: no mark either.
    const terr2 = rows('0000000', '0000000', '0000000', '2020000', '0010000', '0000000', '0000000');
    const r2 = trace(mk({ terrain: terr2, targets: far }), [D(2, 3, '/'), D(2, 4, '\\')]);
    // (2,3) z2 t2 DIP E->N v-1 (mark); (2,4) z1 t1 DIP N->W v-1 (no mark); (1,4) z0; (0,4) z'=-1 floor.
    assert.equal(r2.pieceHits.length, 2);
    assert.equal(r2.end, 'lost-floor');
    assert.deepEqual(r2.altitudeMarks, [{ x: 2, y: 3, z: 2 }, r2.endPoint]);
  });
  test('secret fixed piece: pieceHits reports fixed:true and the parsed level keeps secret:true for the reveal lookup', () => {
    const lvl = mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '\\', secret: true }, { x: 3, y: 1, type: 'MIRROR', orient: '/' }], targets: far });
    const L = parseLevel(lvl);
    const r = trace(L, []);
    assert.deepEqual(r.pieceHits[0], { x: 3, y: 3, type: 'WEDGE', orient: '\\', fixed: true });
    const fx = L.fixed.find(f => f.x === r.pieceHits[0].x && f.y === r.pieceHits[0].y);
    assert.equal(fx.secret, true);
    assert.equal(L.fixed[1].secret, false);
    // secret is NOT part of the pieceHits shape (INTERFACES 2); the UI correlates by (x,y).
    assert.equal('secret' in r.pieceHits[0], false);
    // fixed WEDGE behaves exactly as a placed WEDGE
    const r2 = trace(mk({ targets: far }), [W(3, 3, '\\')]);
    assert.deepEqual(r2.visited.map(s => [s.x, s.y, s.z, s.d, s.v]), r.visited.map(s => [s.x, s.y, s.z, s.d, s.v]));
  });
  test('fixed piece wins over an illegal placed piece on the same cell', () => {
    const lvl = mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/' }], targets: far });
    const r = trace(lvl, [M(3, 3, '\\')]);
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'WEDGE', orient: '/', fixed: true }]);
    assert.equal(r.visited[3].d, 'N');
  });
  test('unknown placed type / orient throws; fixed on the emitter or target is a level error', () => {
    assert.throws(() => trace(mk(), [{ x: 2, y: 2, type: 'PRISM', orient: '/' }]), /placed piece/);
    assert.throws(() => trace(mk(), [{ x: 2, y: 2, type: 'MIRROR', orient: '|' }]), /placed piece/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 0, y: 3, type: 'MIRROR', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }, { x: 2, y: 2, type: 'DIP', orient: '/' }] })), /fixed/);
  });
});

describe('3.4 placement boundaries', () => {
  test('canPlace on every terrain height 0..3 is true; emitter on raised terrain still blocks placement', () => {
    const terrain = rows('0123000', '0000000', '0000000', '3000000', '0000000', '0000000', '0000000');
    const lvl = mk({ terrain });
    for (let x = 0; x < 4; x++) assert.equal(canPlace(lvl, [], x, 0), true, 'x=' + x);
    assert.equal(canPlace(lvl, [], 0, 3), false);
  });
  test('canPlace on a secret fixed piece is false (it is still a fixed piece)', () => {
    const lvl = mk({ fixed: [{ x: 2, y: 2, type: 'WEDGE', orient: '/', secret: true }] });
    assert.equal(canPlace(lvl, [], 2, 2), false);
  });
  test('canPlace on every target of a multi-target level is false', () => {
    const lvl = mk({ targets: [{ x: 6, y: 3 }, { x: 2, y: 5 }] });
    assert.equal(canPlace(lvl, [], 6, 3), false);
    assert.equal(canPlace(lvl, [], 2, 5), false);
  });
  test('canPlace tolerates null holes in placed and does not mutate placed', () => {
    const placed = [null, M(1, 1)];
    const snap = JSON.stringify(placed);
    assert.equal(canPlace(mk(), placed, 1, 1), false);
    assert.equal(canPlace(mk(), placed, 2, 2), true);
    assert.equal(JSON.stringify(placed), snap);
  });
  test('canPlace rejects non-integer and out-of-range coordinates', () => {
    assert.equal(canPlace(mk(), [], 1.5, 1), false);
    assert.equal(canPlace(mk(), [], 6, 7), false);
    assert.equal(canPlace(mk(), [], -1, 3), false);
  });
});
