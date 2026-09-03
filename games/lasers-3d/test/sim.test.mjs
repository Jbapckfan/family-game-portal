// node:test suite for the Lasers 3D rules engine (DESIGN.md section 3, FROZEN).
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Pieces = require('../src/pieces.js');
const Sim = require('../src/sim.js');

const { trace, canPlace, parseLevel, DIRS, H_MAX, PIECES, TURN } = Sim;

// 7x7 all-floor by default; emitter west edge row 3 facing east; target east edge row 3.
function mk(o = {}) {
  const w = o.w || 7, d = o.d || 7;
  const terrain = o.terrain || Array.from({ length: d }, () => '0'.repeat(w));
  return {
    name: o.name || 'T',
    par: o.par == null ? 0 : o.par,
    size: { w, d },
    terrain,
    emitter: o.emitter || { x: 0, y: 3, dir: 'E' },
    targets: o.targets || [{ x: 6, y: 3 }],
    fixed: o.fixed || [],
    tray: o.tray || ['MIRROR', 'MIRROR', 'WEDGE', 'DIP'],
  };
}
const M = (x, y, orient = '/') => ({ x, y, type: 'MIRROR', orient });
const W = (x, y, orient = '/') => ({ x, y, type: 'WEDGE', orient });
const D = (x, y, orient = '/') => ({ x, y, type: 'DIP', orient });
const rows = (...r) => r; // helper: list rows SOUTH first (y=0 first)

describe('pieces.js registry and turn tables (3.3)', () => {
  test('turn table / ', () => {
    assert.deepEqual(TURN['/'], { E: 'N', N: 'E', W: 'S', S: 'W' });
  });
  test('turn table \\', () => {
    assert.deepEqual(TURN['\\'], { E: 'S', S: 'E', W: 'N', N: 'W' });
  });
  test('pitches', () => {
    assert.equal(PIECES.MIRROR.pitch, 0);
    assert.equal(PIECES.WEDGE.pitch, 1);
    assert.equal(PIECES.DIP.pitch, -1);
    assert.equal(Pieces.rotate('/'), '\\');
    assert.equal(Pieces.rotate('\\'), '/');
  });
  test('sim exports the same registry object', () => {
    assert.equal(PIECES, Pieces.PIECES);
    assert.deepEqual(DIRS, { E: { dx: 1, dy: 0 }, N: { dx: 0, dy: 1 }, W: { dx: -1, dy: 0 }, S: { dx: 0, dy: -1 } });
    assert.equal(H_MAX, 4);
  });
});

describe('parseLevel', () => {
  test('normalizes terrain to t[y][x] numbers', () => {
    const L = parseLevel(mk({ terrain: rows('0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '1230000') }));
    assert.equal(L.t[6][0], 1);
    assert.equal(L.t[6][2], 3);
    assert.equal(L.t[0][0], 0);
    assert.equal(L.size.w, 7);
  });
  test('idempotent on a parsed level', () => {
    const L = parseLevel(mk());
    assert.equal(parseLevel(L), L);
  });
  test('throws on malformed levels', () => {
    assert.throws(() => parseLevel(mk({ terrain: ['000'] })), /terrain/);
    assert.throws(() => parseLevel(mk({ terrain: Array.from({ length: 7 }, () => '0000400') })), /terrain/);
    assert.throws(() => parseLevel(mk({ emitter: { x: 9, y: 3, dir: 'E' } })), /emitter/);
    assert.throws(() => parseLevel(mk({ emitter: { x: 0, y: 3, dir: 'X' } })), /emitter/);
    assert.throws(() => parseLevel(mk({ targets: [] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [{ x: 0, y: 3 }] })), /target/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 6, y: 3, type: 'WEDGE', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'LASER', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ tray: ['MIRROR'], par: 2 })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['PRISM'] })), /tray/);
    assert.throws(() => parseLevel(null), /level/);
  });
});

describe('beam stepping (3.2)', () => {
  test('straight shot hits the target; beam stops there', () => {
    const r = trace(mk(), []);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.equal(r.allTargetsHit, true);
    assert.equal(r.segments.length, 6);
    assert.deepEqual(r.segments[0], { from: { x: 0, y: 3, z: 0 }, to: { x: 1, y: 3, z: 0 }, d: 'E', v: 0 });
    assert.deepEqual(r.visited[0], { x: 1, y: 3, z: 0, d: 'E', v: 0 });
    assert.deepEqual(r.endPoint, { x: 6, y: 3, z: 0 });
    assert.deepEqual(r.altitudeMarks, [{ x: 6, y: 3, z: 0 }]);
  });
  test('edge loss: beam exits the grid', () => {
    const r = trace(mk({ targets: [{ x: 6, y: 0 }] }), []);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.hits, []);
    assert.equal(r.allTargetsHit, false);
    assert.deepEqual(r.endPoint, { x: 7, y: 3, z: 0 });
    assert.equal(r.segments.length, 7);
  });
  test('floor loss: DIP at level 0 sends the beam into the floor on the next step', () => {
    const r = trace(mk({ targets: [{ x: 6, y: 0 }] }), [D(2, 3, '/')]);
    assert.equal(r.end, 'lost-floor');
    assert.deepEqual(r.pieceHits, [{ x: 2, y: 3, type: 'DIP', orient: '/', fixed: false }]);
    // stub from the dip cell toward north, ends at the boundary at the same z
    const last = r.segments[r.segments.length - 1];
    assert.deepEqual(last, { from: { x: 2, y: 3, z: 0 }, to: { x: 2, y: 3.5, z: 0 }, d: 'N', v: -1 });
    assert.deepEqual(r.endPoint, { x: 2, y: 3.5, z: 0 });
  });
  test('sky loss: WEDGE climbs 1,2,3 then the 4th step is lost to the sky', () => {
    // wedge at (1,0) turns E->N and climbs; cells (1,1)=1, (1,2)=2, (1,3)=3, (1,4) would be 4.
    const r = trace(mk({ emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 6 }] }), [W(1, 0, '/')]);
    assert.equal(r.end, 'lost-sky');
    const zs = r.visited.map(s => s.z);
    assert.deepEqual(zs, [0, 1, 2, 3]);
    assert.deepEqual(r.endPoint, { x: 1, y: 3.5, z: 3 });
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 0, z: 0 }, { x: 1, y: 3.5, z: 3 }]);
  });
  test('wall block: t[next] > z stops the beam at the cell boundary', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0001000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain }), []);
    assert.equal(r.end, 'blocked');
    assert.equal(r.visited.length, 2);
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 0 });
    const last = r.segments[r.segments.length - 1];
    assert.deepEqual(last, { from: { x: 2, y: 3, z: 0 }, to: { x: 2.5, y: 3, z: 0 }, d: 'E', v: 0 });
  });
  test('over-flight of a low wall: a beam at level 1 passes a t=1 cell (emitter on a ridge)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 0 }] }), []);
    assert.equal(r.end, 'lost-edge');
    assert.equal(r.visited[0].z, 1);       // emitter emits at its terrain level
    assert.equal(r.visited[2].z, 1);       // entered the low wall cell at level 1
    assert.equal(r.visited[2].x, 3);
  });
  test('over-flight of a low wall by a climbing beam, then blocked by a taller one', () => {
    // wedge at (1,3) '/' turns E->N climbing. (1,4) z=1 with t=1 -> flies over. (1,5) z=2 with t=3 -> blocked.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0100000', '0300000', '0000000');
    const r = trace(mk({ terrain }), [W(1, 3, '/')]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.visited[r.visited.length - 1], { x: 1, y: 4, z: 1, d: 'N', v: 1 });
    assert.deepEqual(r.endPoint, { x: 1, y: 4.5, z: 1 });
  });
  test('over-flight of a piece: a beam above a piece ignores it', () => {
    const terrain = rows('0000000', '0000000', '0000000', '1000000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 0 }] }), [M(3, 3, '/')]);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.pieceHits, []);
    assert.deepEqual(r.overflights, [{ x: 3, y: 3 }]);
    assert.equal(r.visited[2].d, 'E');
  });
  test('a piece on raised terrain acts at its own level', () => {
    const terrain = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0000000', '0001000');
    const r = trace(mk({ terrain, targets: [{ x: 3, y: 6 }] }), [M(3, 3, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'MIRROR', orient: '/', fixed: false }]);
    assert.deepEqual(r.overflights, []);
  });
  test('MIRROR levels a climbing beam', () => {
    // wedge at (1,3) climbs north; mirror at (1,5) sits on t=2 so it acts at z=2 and turns N->E level.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0200002', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 5 }] }), [W(1, 3, '/'), M(1, 5, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits.map(p => p.type), ['WEDGE', 'MIRROR']);
    const after = r.visited.slice(r.visited.indexOf(r.visited.find(s => s.x === 2 && s.y === 5)));
    assert.ok(after.every(s => s.z === 2 && s.v === 0 && s.d === 'E'));
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 2 }, { x: 6, y: 5, z: 2 }]);
  });
  test('target on a plateau: reached only by a level or descending beam at its level', () => {
    // plateau target on t=2 at (4,3). A level-0 beam is blocked by the plateau face.
    const terrain = rows('0000000', '0000000', '0000000', '0000200', '0000000', '0000000', '0000000');
    const flat = trace(mk({ terrain, targets: [{ x: 4, y: 3 }] }), []);
    assert.equal(flat.end, 'blocked');
    assert.deepEqual(flat.hits, []);
    // Level arrival: wedge (2,3) climbs N; mirror on t=2 at (2,5) levels E; mirror on t=2 at (4,5) turns S; enters (4,3) at z=2.
    const terr2 = rows('0000000', '0000000', '0000000', '0000200', '0000000', '0020200', '0000000');
    const ok = trace(mk({ terrain: terr2, targets: [{ x: 4, y: 3 }] }), [W(2, 3, '/'), M(2, 5, '/'), M(4, 5, '\\')]);
    assert.equal(ok.end, 'target');
    assert.deepEqual(ok.hits, [0]);
    assert.deepEqual(ok.endPoint, { x: 4, y: 3, z: 2 });
    // Descending arrival: emitter on a t=3 ridge at (6,4) facing W; DIP on t=3 at (4,4) turns W->S descending; enters (4,3) at z=2.
    const terr3 = rows('0000000', '0000000', '0000000', '0000200', '0000303', '0000000', '0000000');
    const desc = trace(mk({ terrain: terr3, emitter: { x: 6, y: 4, dir: 'W' }, targets: [{ x: 4, y: 3 }] }), [D(4, 4, '/')]);
    assert.equal(desc.end, 'target');
    assert.deepEqual(desc.visited[desc.visited.length - 1], { x: 4, y: 3, z: 2, d: 'S', v: -1 });
    // Climbing arrival ABOVE the orb (z=3 over a t=2 plateau) flies over it: wedge (2,3) climbs N to (2,4) z1;
    // mirror on t=2 at (2,5)? No: use a wedge on t=2 at (2,5) -> E climbing: (3,5) z3, (4,5) z'=4 sky. Instead wedge at (2,4) on t=1:
    // (2,4) z1==t1 -> WEDGE '/' N->E v1: (3,4) z2, (4,4) z3 t0, then mirror? Keep it simple: assert no hit when passing above.
    const terr4 = rows('0000000', '0000000', '0000000', '0000200', '0010000', '0000000', '0000000');
    const above = trace(mk({ terrain: terr4, targets: [{ x: 4, y: 3 }] }), [W(2, 3, '/'), W(2, 4, '/'), M(4, 4, '\\')]);
    // beam: (2,3) N v1 -> (2,4) z1 wedge E v1 -> (3,4) z2 -> (4,4) z3 t0: mirror is at level 0, fly over -> (5,4) z'=4 sky
    assert.equal(above.end, 'lost-sky');
    assert.deepEqual(above.hits, []);
    assert.deepEqual(above.overflights, [{ x: 4, y: 4 }]);
  });
  test('target over-flight: a beam above the orb does not light it', () => {
    // emitter on a t=2 ridge at (0,3) facing E; target on t=0 at (3,3); beam at level 2 flies over and exits.
    const terrain = rows('0000000', '0000000', '0000000', '2000000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 3, y: 3 }] }), []);
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.hits, []);
  });
  test('wedge climb: turns like a mirror and sets pitch +1; altitude mark at the wedge', () => {
    const r = trace(mk({ targets: [{ x: 6, y: 6 }] }), [W(3, 3, '/')]);
    assert.deepEqual(r.visited[3], { x: 3, y: 4, z: 1, d: 'N', v: 1 });
    assert.deepEqual(r.altitudeMarks[0], { x: 3, y: 3, z: 0 });
  });
  test('dip descent: from level 2 a DIP goes 1, 0 then floor', () => {
    const terrain = rows('0000000', '0000000', '0000000', '2020000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 6 }] }), [D(2, 3, '/')]);
    assert.deepEqual(r.visited.map(s => s.z), [2, 2, 1, 0]);
    assert.equal(r.end, 'lost-floor');
  });
  test('secret fixed wedge acts as a wedge and reports fixed:true', () => {
    const lvl = mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/', secret: true }], targets: [{ x: 6, y: 6 }] });
    const r = trace(lvl, []);
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'WEDGE', orient: '/', fixed: true }]);
    assert.equal(r.visited[3].z, 1);
    assert.equal(parseLevel(lvl).fixed[0].secret, true);
  });
  test('loop guard: a 3D cycle (pieces reset pitch, so paths can merge) -> end loop, never throws', () => {
    // Emitter (6,4) W at level 0. Mirror (1,4) W->S, mirror (1,3) S->E, WEDGE (2,3) E->N climbing, mirror on t=2 at (2,5) N->W,
    // DIP on t=2 at (1,5) W->S descending, flies OVER the (1,4) mirror at z=1, re-enters (1,3) at z=0 heading S: state repeats.
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0220000', '0000000');
    const placed = [M(1, 4, '/'), M(1, 3, '\\'), W(2, 3, '/'), M(2, 5, '\\'), D(1, 5, '/')];
    const r = trace(mk({ terrain, emitter: { x: 6, y: 4, dir: 'W' }, targets: [{ x: 6, y: 0 }] }), placed);
    assert.equal(r.end, 'loop');
    assert.deepEqual(r.endPoint, { x: 1, y: 3, z: 0 });
    assert.equal(r.segments.length, 12);
    assert.deepEqual(r.overflights, [{ x: 1, y: 4 }]);
    assert.deepEqual(r.hits, []);
  });
  test('step cap: MAX_STEPS is 400', () => {
    assert.equal(Sim.MAX_STEPS, 400);
  });
  test('the emitter body blocks a beam that comes back to it at its level', () => {
    // E from (0,3); mirror (3,3) '/' -> N; mirror (3,5) '\\' -> W; mirror (0,5) '/' -> S ... arrives at (0,3) from N.
    const placed = [M(3, 3, '/'), M(3, 5, '\\'), M(0, 5, '/')];
    const r = trace(mk({ targets: [{ x: 6, y: 6 }] }), placed);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 0, y: 3.5, z: 0 });
  });
  test('multi-target: a lit orb passes the beam through; the beam stops when all are lit', () => {
    const lvl = mk({ targets: [{ x: 3, y: 3 }, { x: 6, y: 3 }] });
    const r = trace(lvl, []);
    assert.deepEqual(r.hits, [0, 1]);
    assert.equal(r.allTargetsHit, true);
    assert.equal(r.end, 'target');
    const one = trace(mk({ targets: [{ x: 3, y: 3 }, { x: 6, y: 0 }] }), []);
    assert.deepEqual(one.hits, [0]);
    assert.equal(one.allTargetsHit, false);
    assert.equal(one.end, 'lost-edge');
  });
  test('trace is pure: inputs are not mutated and results are deterministic', () => {
    const lvl = mk();
    const placed = [M(3, 3, '/')];
    const snapL = JSON.stringify(lvl), snapP = JSON.stringify(placed);
    const a = trace(lvl, placed), b = trace(lvl, placed);
    assert.deepEqual(a, b);
    assert.equal(JSON.stringify(lvl), snapL);
    assert.equal(JSON.stringify(placed), snapP);
  });
  test('trace accepts a parsed level and an omitted placed list', () => {
    const r = trace(parseLevel(mk()));
    assert.equal(r.end, 'target');
  });
});

describe('canPlace (3.4)', () => {
  const lvl = mk({
    terrain: rows('0000000', '0000000', '0000000', '0000000', '0030000', '0000000', '0000000'),
    fixed: [{ x: 5, y: 5, type: 'MIRROR', orient: '/' }],
  });
  const placed = [M(1, 1)];
  test('false on the emitter', () => assert.equal(canPlace(lvl, placed, 0, 3), false));
  test('false on a target', () => assert.equal(canPlace(lvl, placed, 6, 3), false));
  test('false on a fixed piece', () => assert.equal(canPlace(lvl, placed, 5, 5), false));
  test('false on an occupied cell', () => assert.equal(canPlace(lvl, placed, 1, 1), false));
  test('false off the grid', () => {
    assert.equal(canPlace(lvl, placed, -1, 0), false);
    assert.equal(canPlace(lvl, placed, 7, 0), false);
    assert.equal(canPlace(lvl, placed, 0, 7), false);
  });
  test('true on raised terrain', () => assert.equal(canPlace(lvl, placed, 2, 4), true));
  test('true on an empty floor cell', () => assert.equal(canPlace(lvl, [], 1, 1), true));
});
