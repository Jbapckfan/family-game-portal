// Spec-conformance review: boundary cases for DESIGN.md 3.2 / 3.3 / 3.4 and INTERFACES.md.
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sim = require('../src/sim.js');
const { trace, canPlace, parseLevel, H_MAX, MAX_STEPS, stepCap } = Sim;

function mk(o = {}) {
  const w = o.w || 7, d = o.d || 7;
  const terrain = o.terrain || Array.from({ length: d }, () => '0'.repeat(w));
  return {
    name: o.name || 'R', par: o.par == null ? 0 : o.par, size: { w, d }, terrain,
    emitter: o.emitter || { x: 0, y: 3, dir: 'E' },
    targets: o.targets || [{ x: 6, y: 3 }],
    fixed: o.fixed || [],
    tray: o.tray || ['MIRROR', 'MIRROR', 'WEDGE', 'DIP'],
    openings: o.openings,          // DESIGN.md 13.1; undefined == "no openings"
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
    // (1,3) wedge E->N v1; (1,4) z'=1 == t=1 -> the mirror ACTS (that is what this test proves),
    // turning N->E while PRESERVING the climb (spec 12.1), so the next cell is one level higher.
    assert.deepEqual(r.visited[1], { x: 1, y: 4, z: 1, d: 'N', v: 1 });
    assert.equal(r.pieceHits.length, 2);
    assert.equal(r.pieceHits[1].type, 'MIRROR');
    assert.deepEqual(r.visited[2], { x: 2, y: 4, z: 2, d: 'E', v: 1 });
    // the same cell with a DIP: it also acts at z'==t, and levels the climber
    const lev = trace(mk({ terrain, targets: far }), [W(1, 3, '/'), D(1, 4, '/')]);
    assert.equal(lev.pieceHits.length, 2);
    assert.deepEqual(lev.visited[2], { x: 2, y: 4, z: 1, d: 'E', v: 0 });
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

  test('piece on terrain 3 catches a climbing beam that arrives at z=3 and a DIP levels it', () => {
    // emitter (0,0) E; wedge (1,0) '/' N climbing: (1,1) z1, (1,2) z2, (1,3) z3 where t=3 -> a DIP acts,
    // turning E and LEVELLING the climb at z=3 (a MIRROR there would preserve it and lose the beam to
    // the sky on the very next step - spec 12.1).
    // target on t=3 at (6,3); cells between are t=0 (flown over at z=3).
    const terrain = rows('0000000', '0000000', '0000000', '0300003', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 3 }] }), [W(1, 0, '/'), D(1, 3, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.deepEqual(r.visited.find(s => s.x === 1 && s.y === 3), { x: 1, y: 3, z: 3, d: 'N', v: 1 });
    assert.ok(r.visited.filter(s => s.y === 3 && s.x > 1).every(s => s.z === 3 && s.v === 0 && s.d === 'E'));
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 0, z: 0 }, { x: 1, y: 3, z: 3 }, { x: 6, y: 3, z: 3 }]);
    // the MIRROR version keeps climbing and is lost to the sky
    const keepsClimbing = trace(mk({ terrain, emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 3 }] }), [W(1, 0, '/'), M(1, 3, '/')]);
    assert.equal(keepsClimbing.end, 'lost-sky');
    assert.deepEqual(keepsClimbing.hits, []);
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
    // emitter (0,3) t=0 E; WEDGE (2,3) '/' N climbing: (2,4) z1, (2,5) z2 t=2 DIP '\\' N->W LEVELS it
    // (only a DIP can level a climber, spec 12.1); (1,5) z2, (0,5) z2 t=2 mirror '/' W->S keeps it level;
    // (0,4) z2; (0,3) z2 == emitter cell at t=0 -> pass over; (0,2)...(0,0); off-grid.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '2020000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(2, 3, '/'), D(2, 5, '\\'), M(0, 5, '/')]);
    assert.equal(r.end, 'lost-edge');
    const back = r.visited.find(s => s.x === 0 && s.y === 3);
    assert.deepEqual(back, { x: 0, y: 3, z: 2, d: 'S', v: 0 });
    assert.deepEqual(r.endPoint, { x: 0, y: -1, z: 2 });
  });

  test('beam re-entering the emitter cell AT its level from a descending path is blocked', () => {
    // emitter on t=0 (0,3) E; WEDGE (2,3) N v1: (2,4) z1 t1 DIP '\\' N->W LEVELS it (v0): (1,4) z1,
    // (0,4) z1 t1 DIP '/' W->S v-1: (0,3) z'=0 == emitter level -> blocked.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '1010000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: far }), [W(2, 3, '/'), D(2, 4, '\\'), D(0, 4, '/')]);
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
    // Under the corrected rule the ONLY way two histories can meet is the pitch CLAMP (spec 12.2):
    // the WEDGE at (3,3) is hit level on the way out (0 -> +1) and climbing on the way round
    // (+1 -> +1), so the post-piece state (3,3,1,N,+1) repeats exactly.
    const terrain = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0303000', '0000000');
    const placed = [W(3, 3, '/'), D(3, 5, '\\'), D(1, 5, '/'), W(1, 2, '\\'), M(2, 2, '/'), W(2, 3, '/')];
    const lvl = mk({ terrain, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }] });
    const r = trace(lvl, placed);
    assert.equal(r.end, 'loop');
    assert.deepEqual(r.endPoint, { x: 3, y: 3, z: 1 });
    assert.ok(r.segments.length <= stepCap(lvl));
    assert.deepEqual(r.altitudeMarks[r.altitudeMarks.length - 1], r.endPoint);
    assert.deepEqual(r.events.filter(e => e.kind === 'piece' && e.x === 3 && e.y === 3).map(e => [e.vIn, e.vOut]),
      [[0, 1], [1, 1]]);
  });

  test('DESIGN 3.2 loop guard: the step cap is derived from the state space, MAX_STEPS is its floor', () => {
    // Section 11 grows boards to 24x24, where a legal route can exceed 400 steps. The repeat guard on
    // (x,y,z,d,v) is what guarantees termination; the cap is a safety net that must never fire first.
    assert.equal(MAX_STEPS, 400);
    for (const [w, d] of [[6, 6], [12, 12], [14, 14], [16, 16], [18, 18], [20, 20], [22, 22], [24, 24]]) {
      const lvl = mk({ w, d, terrain: Array.from({ length: d }, () => '0'.repeat(w)),
        emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: w - 1, y: d - 1 }] });
      const states = w * d * H_MAX * 4 * 3;
      assert.equal(stepCap(lvl), Math.max(MAX_STEPS, states + 1), `${w}x${d}`);
      assert.ok(stepCap(lvl) > states, `${w}x${d}: the cap must exceed the state space`);
    }
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
  test('WEDGE and DIP turn exactly like MIRROR and only differ in the pitch DELTA they apply', () => {
    // The beam arrives LEVEL here, so the deltas read as the old absolute pitches: 0 / +1 / -1.
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

describe('INTERFACES 2.2 events stream (additive; consumers must not match on x,y)', () => {
  test('every documented legacy field keeps its shape; `events` and `underpasses` are the only additions', () => {
    const r = trace(mk(), []);
    assert.deepEqual(Object.keys(r).sort(),
      ['allTargetsHit', 'altitudeMarks', 'end', 'endPoint', 'events', 'hits', 'overflights', 'underpasses', 'pieceHits', 'segments', 'visited'].sort());
    // `underpasses` (DESIGN.md 13) is empty on every level that carries no openings, which is what
    // keeps the pre-openings corpus byte-identical - see the compatibility suite in sim.test.mjs.
    assert.deepEqual(r.underpasses, []);
  });

  test('a target is reported ONLY at the orb level: a fly-over at another height emits no target event', () => {
    // emitter on a t=2 ridge; the orb at (3,3) is on t=0 and the beam passes over it at z=2.
    const terrain = rows('0000000', '0000000', '0000000', '2000000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 3, y: 3 }] }), []);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.hits, []);
    assert.deepEqual(r.events.filter(e => e.kind === 'target'), []);
    // matching on x,y alone WOULD light it - the cell is entered
    assert.ok(r.events.some(e => e.kind === 'enter' && e.x === 3 && e.y === 3));
  });

  test('the stream is step-indexed onto segments and ends with exactly one terminal event', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0200002', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 5 }] }), [W(1, 3, '/'), D(1, 5, '/')]);
    assert.equal(r.end, 'target');
    assert.ok(r.events.length > 0);
    const terminals = r.events.filter(e => e.kind === 'end');
    assert.equal(terminals.length, 1);
    assert.equal(terminals[0], r.events[r.events.length - 1]);
    assert.equal(terminals[0].end, 'target');
    assert.equal(terminals[0].step, r.segments.length - 1);
    for (const e of r.events) assert.ok(e.step >= 0 && e.step < r.segments.length);
    // pitch events line up with the altitude badges the flat view draws
    assert.deepEqual(r.events.filter(e => e.kind === 'pitch').map(e => ({ x: e.x, y: e.y, z: e.z })),
      r.altitudeMarks.slice(0, -1));
  });

  test('a piece that acts emits piece (+pitch when it changes the pitch); a fly-over emits overflight', () => {
    const terrain = rows('0000000', '0000000', '0000000', '1000000', '0000000', '0000000', '0000000');
    const over = trace(mk({ terrain, targets: far }), [M(3, 3, '/')]);
    assert.deepEqual(over.events.filter(e => e.kind === 'overflight').map(e => ({ x: e.x, y: e.y, z: e.z })), [{ x: 3, y: 3, z: 1 }]);
    assert.deepEqual(over.events.filter(e => e.kind === 'piece'), []);
    const act = trace(mk({ targets: far }), [W(3, 3, '/')]);
    const piece = act.events.filter(e => e.kind === 'piece');
    assert.equal(piece.length, 1);
    assert.equal(piece[0].type, 'WEDGE');
    assert.equal(piece[0].fixed, false);
    assert.deepEqual(act.events.filter(e => e.kind === 'pitch').map(e => [e.from, e.to]), [[0, 1]]);
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

// ---------------------------------------------------------------------------
// DESIGN.md 13.2 - the blocked test, exhaustively
// ---------------------------------------------------------------------------
// "the next cell is BLOCKED when z' < t[next] AND z' is not one of that column's open levels."
// Everything below drives that sentence directly over every (column height, open set, beam level)
// the grid can express, so the rule is checked rather than sampled.
describe('13.2 the blocked test, over every column height x open set x beam level', () => {
  // Row y=3 only: the emitter column at x=0 sets the beam's level, the column under test is x=3,
  // and the orb at x=6 sits at the beam's level so "got through" is observable as a hit.
  function board(top, openLevels, emitZ) {
    const row = ['0', '0', '0', String(top), '0', '0', '0'];
    row[0] = String(emitZ); row[6] = String(emitZ);
    return mk({
      terrain: rows('0000000', '0000000', '0000000', row.join(''), '0000000', '0000000', '0000000'),
      emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }],
      openings: openLevels.length ? [{ x: 3, y: 3, levels: openLevels.slice() }] : undefined,
    });
  }

  test('every case: blocked iff z < t and z is not open; otherwise the beam enters and carries on', () => {
    let blocked = 0, entered = 0, threaded = 0;
    for (let top = 0; top <= 3; top++) {
      // every subset of the levels this column may legally have punched out
      for (let mask = 0; mask < (1 << top); mask++) {
        const openLevels = [];
        for (let z = 0; z < top; z++) if ((mask >> z) & 1) openLevels.push(z);
        for (let emitZ = 0; emitZ <= 3; emitZ++) {
          const lvl = board(top, openLevels, emitZ);
          const L = parseLevel(lvl);
          assert.equal(L.openMask[3][3], mask, `mask t=${top} m=${mask}`);
          const r = trace(lvl, []);
          const tag = `t=${top} open=[${openLevels}] z=${emitZ}`;
          const shouldBlock = emitZ < top && !openLevels.includes(emitZ);
          if (shouldBlock) {
            blocked++;
            assert.equal(r.end, 'blocked', tag);
            assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: emitZ }, tag + ' stub at the wall face');
            assert.deepEqual(r.hits, [], tag);
          } else {
            entered++;
            assert.equal(r.end, 'target', tag);
            assert.ok(r.visited.some(v => v.x === 3 && v.y === 3 && v.z === emitZ), tag + ' entered the column cell');
            if (emitZ < top) threaded++;
          }
        }
      }
    }
    // 4 heights x (1 + 2 + 4 + 8 legal open sets) x 4 beam levels = 60 cases, all of them
    assert.equal(blocked + entered, (1 + 2 + 4 + 8) * 4, 'every (t, mask, z) combination was exercised');
    assert.ok(blocked > 0 && threaded > 0, `blocked ${blocked}, threaded ${threaded}`);
  });

  test('an opening changes NOTHING about the rest of the step order (rules 1, 2, 4 of INTERFACES 4)', () => {
    // The blocked test is check 3. Openings must not disturb the checks around it: off-grid still
    // wins over everything, the floor and sky checks still come first, and the emitter body is still
    // an obstacle at its own level even when its column is open elsewhere.
    const wide = rows('0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000');
    const openAll = [{ x: 3, y: 3, levels: [0, 1, 2] }];

    // rule 1, off-grid: a level-0 beam threads the wide-open column and leaves the board
    const edge = trace(mk({ terrain: wide, targets: far, openings: openAll }), []);
    assert.equal(edge.end, 'lost-edge');
    assert.deepEqual(edge.endPoint, { x: 7, y: 3, z: 0 });

    // rule 2, the floor: a DIP one cell in sends the beam below z=0 before any terrain is consulted
    const floor = trace(mk({ terrain: wide, targets: far, openings: openAll }), [D(1, 3, '/')]);
    assert.equal(floor.end, 'lost-floor');

    // rule 2, the sky: the same shape one level from the ceiling, on a ridge so the piece can act
    const ridge = rows('0000000', '0000000', '0000000', '3303000', '0000000', '0000000', '0000000');
    const sky = trace(mk({ terrain: ridge, targets: far, openings: openAll }), [W(1, 3, '/')]);
    assert.equal(sky.end, 'lost-sky');

    // rule 4, the emitter body: an opened column at the emitter's own level is still its body
    const em = (openings) => mk({
      terrain: rows('0000000', '0000000', '0000000', '3003000', '0000000', '0000000', '0000000'),
      openings, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 0, y: 5 }],
    });
    const route = [D(3, 3, '\\'), W(3, 0, '/'), M(0, 0, '\\')];
    assert.equal(trace(em([{ x: 0, y: 3, levels: [0, 1, 2] }]), route).end, 'target', 'level 0 open: the beam goes under the emitter');
    assert.equal(trace(em([{ x: 0, y: 3, levels: [1, 2] }]), route).end, 'blocked', 'level 0 sealed: the same route dies at the pillar');
  });

  test('an opening does not change the derived loop-guard cap', () => {
    const plain = mk({ terrain: rows('0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000') });
    const open = mk({ terrain: rows('0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000'),
                      openings: [{ x: 3, y: 3, levels: [0, 1, 2] }] });
    assert.equal(stepCap(open), stepCap(plain));
    assert.equal(stepCap(open), MAX_STEPS > 7 * 7 * H_MAX * 12 ? MAX_STEPS : 7 * 7 * H_MAX * 12 + 1);
  });
});
