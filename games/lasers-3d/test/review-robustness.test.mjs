// ROBUSTNESS review suite for the Lasers 3D rules engine (DESIGN.md section 3, INTERFACES.md).
// Written as an adversarial reviewer: malformed levels, illegal placements, determinism,
// loop guard, the DERIVED step cap (LaserSim.stepCap), and the UMD wrapper under node require
// AND a browser-like vm.
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const Pieces = require('../src/pieces.js');
const Sim = require('../src/sim.js');
const { trace, canPlace, parseLevel, MAX_STEPS, stepCap } = Sim;
// The loop-guard cap is DERIVED per level from the finite state space; MAX_STEPS is only its floor.
const CAP = (level) => stepCap(level);

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../src');

function mk(o = {}) {
  const w = o.w || 7, d = o.d || 7;
  const terrain = o.terrain || Array.from({ length: d }, () => '0'.repeat(w));
  const lvl = {
    name: o.name || 'T',
    par: o.par == null ? 0 : o.par,
    size: { w, d },
    terrain,
    emitter: o.emitter || { x: 0, y: 3, dir: 'E' },
    targets: o.targets || [{ x: 6, y: 3 }],
    fixed: o.fixed || [],
    tray: o.tray || ['MIRROR', 'MIRROR', 'WEDGE', 'DIP'],
  };
  for (const k of Object.keys(o)) if (!(k in lvl) && k !== 'w' && k !== 'd') lvl[k] = o[k];
  return lvl;
}
const M = (x, y, orient = '/') => ({ x, y, type: 'MIRROR', orient });
const W = (x, y, orient = '/') => ({ x, y, type: 'WEDGE', orient });
const D = (x, y, orient = '/') => ({ x, y, type: 'DIP', orient });
const rows = (...r) => r;
const ENDS = new Set(['target', 'blocked', 'lost-edge', 'lost-floor', 'lost-sky', 'loop']);

// THE canonical 3D cycle under the corrected rule (DESIGN.md section 12). Under the OLD set-pitch
// rule almost any 3D shape could merge, because every piece threw the incoming pitch away. Now the
// step map is injective EVERYWHERE EXCEPT the clamp (a WEDGE maps v_in 0 and +1 both to +1; a DIP
// maps 0 and -1 both to -1), so a cycle has to be built ON the clamp - see the injectivity test in
// 'robustness: loop guard'. This fixture does exactly that:
//   emitter (0,3) on a t=1 ridge fires E at z=1, flying OVER the wedge at (2,3) which sits on t=0;
//   WEDGE (3,3) on t=1 is hit LEVEL (0 -> +1) and turns it north, climbing;
//   DIP (3,5) on t=3 levels it west, DIP (1,5) on t=3 turns it south falling to z=0,
//   WEDGE (1,2) levels it east, MIRROR (2,2) turns it north, WEDGE (2,3) sends it east CLIMBING,
//   so it re-enters (3,3) at z=1 heading E with v_in = +1 - and the clamp maps that to +1 again.
//   The post-piece state (3,3,1,N,+1) repeats exactly.
const LOOP_TERRAIN = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0303000', '0000000');
const loopLevel = (o) => mk(Object.assign({ terrain: LOOP_TERRAIN, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }] }, o || {}));
const loopPieces = () => [W(3, 3, '/'), D(3, 5, '\\'), D(1, 5, '/'), W(1, 2, '\\'), M(2, 2, '/'), W(2, 3, '/')];

// ---------------------------------------------------------------------------
describe('robustness: malformed levels (INTERFACES 3 validation list)', () => {
  test('ragged terrain: a short row, a long row, and an extra row all throw naming terrain', () => {
    const base = Array.from({ length: 7 }, () => '0000000');
    const short = base.slice(); short[2] = '000000';
    const long = base.slice(); long[5] = '00000000';
    assert.throws(() => parseLevel(mk({ terrain: short })), /lasers-3d level: terrain/);
    assert.throws(() => parseLevel(mk({ terrain: long })), /lasers-3d level: terrain/);
    assert.throws(() => parseLevel(mk({ terrain: base.concat(['0000000']) })), /lasers-3d level: terrain/);
    assert.throws(() => parseLevel(mk({ terrain: base.slice(0, 6) })), /lasers-3d level: terrain/);
  });
  test('terrain that is not an array (string, object, undefined) throws naming terrain', () => {
    assert.throws(() => parseLevel(mk({ terrain: '0000000' })), /terrain/);
    assert.throws(() => parseLevel(mk({ terrain: { 0: '0000000' } })), /terrain/);
    assert.throws(() => parseLevel({ ...mk(), terrain: undefined }), /terrain/);
    assert.throws(() => parseLevel({ ...mk(), terrain: null }), /terrain/);
  });
  test('terrain chars outside 0..3 throw: 4, 9, letters, minus, space, empty row, non-ASCII digit', () => {
    const bad = ['0000400', '0000009', '000a000', '-000000', '000 000', '０000000', '0000000\n'];
    for (const row of bad) {
      const terrain = Array.from({ length: 7 }, () => '0000000'); terrain[3] = row;
      assert.throws(() => parseLevel(mk({ terrain })), /terrain/, `row ${JSON.stringify(row)} should be rejected`);
    }
  });
  test('terrain row given as an array of digits: valid digits accepted, non-digits rejected', () => {
    const terrain = Array.from({ length: 7 }, () => '0000000');
    terrain[3] = [0, 1, 2, 3, 0, 0, 0];
    const L = parseLevel(mk({ terrain }));
    assert.deepEqual(L.t[3], [0, 1, 2, 3, 0, 0, 0]);
    const bad = terrain.slice(); bad[3] = [0, 1, 2, 4, 0, 0, 0];
    assert.throws(() => parseLevel(mk({ terrain: bad })), /terrain/);
    const ragged = terrain.slice(); ragged[3] = [0, 1, 2];
    assert.throws(() => parseLevel(mk({ terrain: ragged })), /terrain/);
  });
  // REGRESSION (fixed): parseTerrain used to row.join('') and validate the STRING, so a 6-element array
  // [10,0,0,0,0,0] joined to "1000000" and passed as a valid 7-wide row. Array rows are now validated
  // element by element (integer 0..3) with the row length checked against w.
  test('terrain row as an array of multi-digit numbers is NOT accepted as a row of w digits', () => {
    const terrain = Array.from({ length: 7 }, () => '0000000');
    terrain[3] = [10, 0, 0, 0, 0, 0];
    assert.throws(() => parseLevel(mk({ terrain })), /terrain/);
  });
  test('size: zero, negative, fractional, string, missing all throw naming size', () => {
    for (const size of [{ w: 0, d: 7 }, { w: 7, d: -1 }, { w: 7.5, d: 7 }, { w: '7', d: 7 }, {}, null, undefined, { w: NaN, d: 7 }, { w: Infinity, d: 7 }]) {
      assert.throws(() => parseLevel({ ...mk(), size }), /size/, `size ${JSON.stringify(size)}`);
    }
  });
  test('emitter off-grid on every side, fractional, string coords, NaN, missing, bad dir', () => {
    const cases = [
      { x: -1, y: 3, dir: 'E' }, { x: 7, y: 3, dir: 'E' }, { x: 0, y: -1, dir: 'E' }, { x: 0, y: 7, dir: 'E' },
      { x: 0.5, y: 3, dir: 'E' }, { x: '0', y: 3, dir: 'E' }, { x: NaN, y: 3, dir: 'E' }, { y: 3, dir: 'E' },
      { x: 0, y: 3, dir: 'e' }, { x: 0, y: 3, dir: 'NE' }, { x: 0, y: 3 }, { x: 0, y: 3, dir: '' },
      null, undefined,
    ];
    for (const emitter of cases) {
      assert.throws(() => parseLevel({ ...mk(), emitter }), /emitter/, `emitter ${JSON.stringify(emitter)}`);
    }
  });
  // FINDING: INTERFACES 3 says "emitter on-grid with a valid dir" throws otherwise, and 2 says dir is one of
  // 'E','N','W','S'. parseEmitter checks `DIRS[e.dir]` on a plain object, so any Object.prototype key
  // ('constructor', 'hasOwnProperty', 'toString', '__proto__', 'valueOf') is truthy and ACCEPTED. trace()
  // then reads dir.dx of a function -> NaN -> immediate 'lost-edge' with endPoint {x:NaN,y:NaN}.
  test('emitter dir that is an Object.prototype key must be rejected like any other bad dir', () => {
    for (const dir of ['constructor', 'hasOwnProperty', 'toString', '__proto__', 'valueOf']) {
      assert.throws(() => parseLevel({ ...mk(), emitter: { x: 0, y: 3, dir } }), /emitter/, `dir ${dir}`);
    }
  });
  test('a trace never reports a NaN endPoint (downstream symptom of the emitter-dir gap)', () => {
    for (const dir of ['constructor', 'toString']) {
      let r = null;
      try { r = trace({ ...mk(), emitter: { x: 0, y: 3, dir } }, []); } catch (e) { continue; } // throwing is the correct outcome
      assert.ok(Number.isFinite(r.endPoint.x) && Number.isFinite(r.endPoint.y), `dir ${dir}: endPoint ${JSON.stringify(r.endPoint)}`);
    }
  });
  test('targets: off-grid, fractional, on emitter, duplicates, null entry, non-array, empty', () => {
    assert.throws(() => parseLevel(mk({ targets: [{ x: 7, y: 3 }] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [{ x: 6, y: -1 }] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [{ x: 6.5, y: 3 }] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [{ x: 0, y: 3 }] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [{ x: 6, y: 3 }, { x: 6, y: 3 }] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [null] })), /target/);
    assert.throws(() => parseLevel(mk({ targets: { x: 6, y: 3 } })), /target/);
    assert.throws(() => parseLevel(mk({ targets: [] })), /target/);
    assert.throws(() => parseLevel({ ...mk(), targets: undefined }), /target/);
  });
  test('target on a fixed piece throws (either declaration order)', () => {
    assert.throws(() => parseLevel(mk({ targets: [{ x: 3, y: 3 }], fixed: [{ x: 3, y: 3, type: 'MIRROR', orient: '/' }] })), /fixed|target/);
    // Multi-target: the second target sits on the fixed piece.
    assert.throws(() => parseLevel(mk({ targets: [{ x: 6, y: 3 }, { x: 2, y: 2 }], fixed: [{ x: 2, y: 2, type: 'WEDGE', orient: '\\' }] })), /fixed|target/);
  });
  test('fixed: off-grid, on emitter, on another fixed piece, bad orient, unknown/prototype type, null entry, non-array', () => {
    assert.throws(() => parseLevel(mk({ fixed: [{ x: -1, y: 3, type: 'MIRROR', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 0, y: 3, type: 'MIRROR', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }, { x: 2, y: 2, type: 'DIP', orient: '\\' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'MIRROR', orient: '|' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'MIRROR' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'mirror', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'constructor', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: '__proto__', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'toString', orient: '/' }] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: [null] })), /fixed/);
    assert.throws(() => parseLevel(mk({ fixed: { x: 2, y: 2, type: 'MIRROR', orient: '/' } })), /fixed/);
  });
  test('tray: unknown type, lowercase, prototype names, null entry, non-array, tray < par', () => {
    assert.throws(() => parseLevel(mk({ tray: ['PRISM'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['mirror'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['constructor'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['__proto__'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['hasOwnProperty'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: [null] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: [{ type: 'MIRROR' }] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: 'MIRROR' })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: [], par: 1 })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['MIRROR', 'MIRROR'], par: 3 })), /tray/);
  });
  test('par: negative, fractional, string, NaN throw; absent/null defaults to 0', () => {
    for (const par of [-1, 0.5, '1', NaN, Infinity]) {
      assert.throws(() => parseLevel({ ...mk(), par }), /par/, `par ${par}`);
    }
    const L1 = parseLevel({ ...mk(), par: undefined, tray: [] });
    assert.equal(L1.par, 0);
    const L2 = parseLevel({ ...mk(), par: null, tray: [] });
    assert.equal(L2.par, 0);
  });
  test('non-object levels throw naming level', () => {
    for (const bad of [null, undefined, 42, 'level', true]) {
      assert.throws(() => parseLevel(bad), /level/);
    }
  });
  test('every validation error message starts with the documented prefix', () => {
    const bads = [
      () => parseLevel(mk({ terrain: ['000'] })),
      () => parseLevel(mk({ emitter: { x: 9, y: 3, dir: 'E' } })),
      () => parseLevel(mk({ targets: [] })),
      () => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'LASER', orient: '/' }] })),
      () => parseLevel(mk({ tray: ['PRISM'] })),
      () => parseLevel({ ...mk(), size: null }),
      () => parseLevel({ ...mk(), par: -1 }),
      () => parseLevel(null),
    ];
    for (const fn of bads) {
      let err = null;
      try { fn(); } catch (e) { err = e; }
      assert.ok(err instanceof Error, 'must throw an Error');
      assert.match(err.message, /^lasers-3d level: /);
    }
  });
  test('malformed levels throw from trace and canPlace too (parse is not skipped)', () => {
    assert.throws(() => trace(mk({ terrain: ['000'] }), []), /terrain/);
    assert.throws(() => canPlace(mk({ tray: ['PRISM'] }), [], 1, 1), /tray/);
  });
  test('parseLevel does not mutate its input and returns fresh arrays', () => {
    const raw = mk({ fixed: [{ x: 2, y: 2, type: 'WEDGE', orient: '/', secret: 1 }] });
    const snap = JSON.stringify(raw);
    const L = parseLevel(raw);
    assert.equal(JSON.stringify(raw), snap);
    assert.notEqual(L.terrain, raw.terrain);
    assert.notEqual(L.tray, raw.tray);
    assert.notEqual(L.fixed, raw.fixed);
    assert.notEqual(L.fixed[0], raw.fixed[0]);
    assert.equal(L.fixed[0].secret, true); // normalized to a boolean
    L.tray.push('DIP');
    assert.equal(raw.tray.length, 4);
  });
});

// ---------------------------------------------------------------------------
describe('robustness: illegal placed pieces never crash the stepper', () => {
  test('a placed piece on a fixed piece: the fixed piece wins, no throw', () => {
    // fixed WEDGE at (3,3) '/', placed MIRROR '\\' on the same cell. Wedge must act (turn N, climb).
    const lvl = mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/' }], targets: [{ x: 6, y: 6 }] });
    const r = trace(lvl, [M(3, 3, '\\')]);
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'WEDGE', orient: '/', fixed: true }]);
    assert.equal(r.visited[3].d, 'N');
    assert.equal(r.visited[3].z, 1);
    // and canPlace still says no for that cell
    assert.equal(canPlace(lvl, [], 3, 3), false);
  });
  test('a placed piece on the emitter cell is inert (the emitter is never entered)', () => {
    const r = trace(mk(), [M(0, 3, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits, []);
  });
  test('placed pieces off the grid are ignored, never entered, never throw', () => {
    const r = trace(mk(), [M(-1, 3), M(7, 3), M(3, 99), M(3, -5)]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits, []);
    assert.deepEqual(r.overflights, []);
  });
  test('placed pieces with fractional / NaN / undefined coords never match a cell and never throw', () => {
    const r = trace(mk(), [M(2.5, 3), M(NaN, 3), { type: 'MIRROR', orient: '/' }, M(undefined, undefined)]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits, []);
  });
  test('two placed pieces on the same cell: exactly one acts (the last), no throw', () => {
    const r = trace(mk({ targets: [{ x: 6, y: 6 }] }), [M(3, 3, '/'), W(3, 3, '\\')]);
    assert.equal(r.pieceHits.length >= 1, true);
    assert.equal(r.pieceHits.filter(p => p.x === 3 && p.y === 3).length, 1);
    assert.ok(ENDS.has(r.end));
  });
  test('placed piece with an unknown / prototype-name type throws the documented trace error', () => {
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: 'PRISM', orient: '/' }]), /lasers-3d trace: placed piece 0/);
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: 'constructor', orient: '/' }]), /lasers-3d trace/);
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: '__proto__', orient: '/' }]), /lasers-3d trace/);
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: 'mirror', orient: '/' }]), /lasers-3d trace/);
  });
  test('placed piece with a bad orient or a null entry throws the documented trace error', () => {
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: 'MIRROR', orient: '|' }]), /lasers-3d trace: placed piece 0/);
    assert.throws(() => trace(mk(), [{ x: 3, y: 3, type: 'MIRROR' }]), /lasers-3d trace/);
    assert.throws(() => trace(mk(), [M(1, 1), null]), /lasers-3d trace: placed piece 1/);
    assert.throws(() => trace(mk(), [undefined]), /lasers-3d trace/);
  });
  test('trace throws on a bad placed piece even when the beam would never reach it', () => {
    // (6,6) is nowhere near the straight E beam; validation must still be eager per INTERFACES 2.
    assert.throws(() => trace(mk(), [{ x: 6, y: 6, type: 'PRISM', orient: '/' }]), /lasers-3d trace/);
  });
  test('placed on a non-final target: the target lights first, then the piece turns the beam', () => {
    // Illegal per 3.4 but must not crash; documented order: target check, then piece.
    const lvl = mk({ targets: [{ x: 3, y: 3 }, { x: 3, y: 6 }] });
    const r = trace(lvl, [M(3, 3, '/')]);
    assert.deepEqual(r.hits, [0, 1]);
    assert.equal(r.end, 'target');
  });
  test('placed given as a non-array (undefined, null) is treated as empty', () => {
    assert.equal(trace(mk(), undefined).end, 'target');
    assert.equal(trace(mk(), null).end, 'target');
    assert.equal(canPlace(mk(), null, 1, 1), true);
    assert.equal(canPlace(mk(), undefined, 1, 1), true);
  });
  test('canPlace: fractional, NaN, string coordinates are off-grid (false); null entries in placed are skipped', () => {
    const lvl = mk();
    assert.equal(canPlace(lvl, [], 1.5, 1), false);
    assert.equal(canPlace(lvl, [], NaN, 1), false);
    assert.equal(canPlace(lvl, [], '1', 1), false);
    assert.equal(canPlace(lvl, [null, M(1, 1)], 2, 2), true);
    assert.equal(canPlace(lvl, [null, M(1, 1)], 1, 1), false);
  });
});

// ---------------------------------------------------------------------------
describe('robustness: determinism and purity', () => {
  test('same inputs twice -> byte-identical results (raw level and parsed level)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0220000', '0000000');
    const placed = [M(1, 4, '/'), M(1, 3, '\\'), W(2, 3, '/'), M(2, 5, '\\'), D(1, 5, '/')];
    const raw = mk({ terrain, emitter: { x: 6, y: 4, dir: 'W' }, targets: [{ x: 6, y: 0 }] });
    const a = trace(raw, placed);
    const b = trace(raw, placed);
    const c = trace(parseLevel(raw), placed);
    const d = trace(parseLevel(parseLevel(raw)), placed.map(p => ({ ...p })));
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(JSON.stringify(a), JSON.stringify(c));
    assert.equal(JSON.stringify(a), JSON.stringify(d));
  });
  test('placed order does not change the trace (no duplicate cells)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0220000', '0000000');
    const placed = [M(1, 4, '/'), M(1, 3, '\\'), W(2, 3, '/'), M(2, 5, '\\'), D(1, 5, '/')];
    const raw = mk({ terrain, emitter: { x: 6, y: 4, dir: 'W' }, targets: [{ x: 6, y: 0 }] });
    const a = trace(raw, placed);
    const b = trace(raw, placed.slice().reverse());
    assert.deepEqual(a, b);
  });
  test('results are fresh objects: mutating one result does not leak into the next', () => {
    const lvl = parseLevel(mk());
    const a = trace(lvl, []);
    a.segments.length = 0; a.hits.push(99); a.endPoint.x = -100; a.altitudeMarks[0].z = 9;
    const b = trace(lvl, []);
    assert.equal(b.segments.length, 6);
    assert.deepEqual(b.hits, [0]);
    assert.deepEqual(b.endPoint, { x: 6, y: 3, z: 0 });
  });
  test('trace does not mutate a parsed level or the placed list (deep snapshot)', () => {
    const L = parseLevel(mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/' }], targets: [{ x: 6, y: 6 }] }));
    const placed = [M(3, 5, '\\'), D(1, 1, '/')];
    const snapL = JSON.stringify(L), snapP = JSON.stringify(placed);
    trace(L, placed); trace(L, placed); canPlace(L, placed, 2, 2);
    assert.equal(JSON.stringify(L), snapL);
    assert.equal(JSON.stringify(placed), snapP);
  });
  test('result objects do not alias the placed input (pieceHits are copies)', () => {
    const placed = [M(3, 3, '/')];
    const r = trace(mk({ targets: [{ x: 3, y: 6 }] }), placed);
    assert.equal(r.pieceHits.length, 1);
    assert.notEqual(r.pieceHits[0], placed[0]);
    r.pieceHits[0].orient = '\\';
    assert.equal(placed[0].orient, '/');
  });
});

// ---------------------------------------------------------------------------
describe('robustness: loop guard', () => {
  test('THE ONLY source of a cycle is the pitch CLAMP: every other step is injective (spec 12.2)', () => {
    // A cycle needs two different histories to reach one state. The turn tables are bijections and
    // MIRROR preserves the pitch, so the only many-to-one map in the engine is the clamped delta.
    for (const type of Pieces.TYPES) {
      const preimages = {};
      for (const vIn of [-1, 0, 1]) {
        const vOut = Pieces.applyPitch(type, vIn);
        (preimages[vOut] = preimages[vOut] || []).push(vIn);
      }
      const merged = Object.keys(preimages).filter(k => preimages[k].length > 1);
      if (type === 'MIRROR') assert.deepEqual(merged, [], 'MIRROR preserves the pitch, so it merges nothing');
      if (type === 'WEDGE') assert.deepEqual(merged, ['1'], 'WEDGE: v_in 0 and +1 both leave as +1');
      if (type === 'DIP') assert.deepEqual(merged, ['-1'], 'DIP: v_in 0 and -1 both leave as -1');
    }
    // and every turn table is a bijection on the four directions, in both orientations
    for (const o of Pieces.ORIENTS) {
      const out = ['E', 'N', 'W', 'S'].map(d => Pieces.TURN[o][d]);
      assert.equal(new Set(out).size, 4, 'orient ' + o);
    }
  });
  test('a clamp cycle -> end loop at the first repeated state, well under the cap', () => {
    const r = trace(loopLevel(), loopPieces());
    assert.equal(r.end, 'loop');
    assert.ok(r.segments.length < CAP(loopLevel()), `segments ${r.segments.length} vs cap ${CAP(loopLevel())}`);
    assert.equal(r.segments.length, 13);
    assert.deepEqual(r.endPoint, { x: 3, y: 3, z: 1 });
    // The wedge at (3,3) is the merge point: hit level on the way in, climbing on the way round.
    const atWedge = r.events.filter(e => e.kind === 'piece' && e.x === 3 && e.y === 3);
    assert.deepEqual(atWedge.map(e => [e.vIn, e.vOut]), [[0, 1], [1, 1]]);
    // the outbound level-1 beam flew over the wedge sitting on the floor at (2,3)
    assert.deepEqual(r.overflights, [{ x: 2, y: 3 }]);
    assert.deepEqual(r.pieceHits.map(p => `${p.x},${p.y}`), ['3,3', '3,5', '1,5', '1,2', '2,2', '2,3', '3,3']);
    assert.deepEqual(r.hits, []);
    assert.equal(r.allTargetsHit, false);
    // endPoint equals the last segment's `to`, as documented
    assert.deepEqual(r.endPoint, r.segments[r.segments.length - 1].to);
    // altitudeMarks: every pitch CHANGE, then the endPoint. The second visit to the wedge is
    // clamped to no change, so it adds no mark.
    assert.deepEqual(r.altitudeMarks, [{ x: 3, y: 3, z: 1 }, { x: 3, y: 5, z: 3 }, { x: 1, y: 5, z: 3 },
      { x: 1, y: 2, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 1 }]);
  });
  test('the clamp cycle is deterministic and idempotent across repeated calls', () => {
    const L = parseLevel(loopLevel());
    const a = trace(L, loopPieces()), b = trace(L, loopPieces());
    assert.deepEqual(a, b);
  });
  test('a square of MIRRORs can no longer be entered: MIRROR preserves the pitch, so nothing merges', () => {
    // This shape WAS a loop under the old set-pitch rule (a DIP dropped the beam into the square and
    // the first corner mirror levelled it). Now the mirror keeps the descent, so the beam falls out
    // of the square onto the floor instead of circling - a direct regression test for spec 12.1.
    const squareTerrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '3003000');
    const lvl = mk({ d: 8, terrain: squareTerrain, emitter: { x: 0, y: 7, dir: 'E' }, targets: [{ x: 6, y: 0 }] });
    const r = trace(lvl, [D(3, 7, '\\'), M(3, 4, '/'), M(0, 4, '\\'), M(0, 5, '/'), M(3, 5, '\\')]);
    assert.notEqual(r.end, 'loop');
    assert.equal(r.end, 'lost-floor');
    assert.ok(ENDS.has(r.end));
  });
  test('2-cell ping-pong is impossible under 3.3 (no piece reverses); adjacent opposing mirrors terminate', () => {
    // Every piece turns 90 degrees, so a beam can never return along its own segment. The closest
    // construction - two adjacent mirrors that hand the beam back and forth - must terminate normally.
    for (const [o1, o2] of [['/', '\\'], ['\\', '/'], ['/', '/'], ['\\', '\\']]) {
      const r = trace(mk({ targets: [{ x: 6, y: 6 }] }), [M(3, 3, o1), M(3, 4, o2), M(4, 3, o2), M(2, 3, o1)]);
      assert.ok(ENDS.has(r.end));
      assert.notEqual(r.end, 'loop', `orients ${o1}${o2}`);
      assert.ok(r.segments.length <= CAP(mk({ targets: [{ x: 6, y: 6 }] })));
    }
    // Direct check on the turn tables: no orientation maps a direction to its opposite.
    const OPP = { E: 'W', W: 'E', N: 'S', S: 'N' };
    for (const o of Pieces.ORIENTS) for (const d of Object.keys(OPP)) {
      assert.notEqual(Pieces.TURN[o][d], OPP[d]);
      assert.notEqual(Pieces.TURN[o][d], d);
    }
  });
  test('the smallest real cycle: one cell re-entered at the same level through the clamp is caught', () => {
    const r = trace(loopLevel(), loopPieces());
    assert.equal(r.end, 'loop');
    const keys = r.visited.map(s => `${s.x},${s.y},${s.z},${s.d},${s.v}`);
    // visited records ENTRY states; the repeat is detected on the post-piece state so entries may all differ,
    // but the trace must have stopped at the first repeat: no visited entry appears 3 times.
    const counts = {}; keys.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
    assert.ok(Object.values(counts).every(n => n <= 2));
  });
});

// ---------------------------------------------------------------------------
// The step cap used to be the hard-coded 400 and a >400-step legal route was reported as a
// false 'loop'. It is now DERIVED per level from the finite state space, so the (x,y,z,d,v)
// repeat guard - the thing that actually guarantees termination - always fires first.
// These tests keep the original intent: the guard exists, it fires when it should, and it
// never cuts a legal route short.
describe('robustness: the derived step cap (LaserSim.stepCap)', () => {
  // The schema does not bound size, so a 1-row corridor is the longest possible straight run.
  const corridor = (w, tx) => mk({ w, d: 1, terrain: ['0'.repeat(w)], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: tx, y: 0 }], tray: [] });
  const derived = (w, d) => Math.max(MAX_STEPS, w * d * Sim.H_MAX * 4 * 3 + 1);

  test('stepCap is max(MAX_STEPS, w * d * H_MAX * 4 dirs * 3 pitches + 1) and MAX_STEPS is only the floor', () => {
    assert.equal(MAX_STEPS, 400, 'the documented minimum cap must not change');
    assert.equal(CAP(mk({ w: 6, d: 6, emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 5, y: 5 }], terrain: Array.from({ length: 6 }, () => '000000') })), 1729);
    assert.equal(CAP(mk({ w: 24, d: 24, emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 23, y: 23 }], terrain: Array.from({ length: 24 }, () => '0'.repeat(24)) })), 27649);
    // small boards fall back to the 400 floor (2 * 2 * 4 * 4 * 3 + 1 = 193 < 400)
    assert.equal(CAP({ size: { w: 2, d: 2 }, terrain: ['00', '00'], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 1, y: 1 }] }), MAX_STEPS);
    for (const [w, d] of [[1, 2], [7, 7], [12, 12], [18, 18], [22, 22], [1000, 1]]) {
      const lvl = { size: { w, d }, terrain: Array.from({ length: d }, () => '0'.repeat(w)),
        emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: w - 1, y: d - 1 }] };
      assert.equal(CAP(lvl), derived(w, d), `${w}x${d}`);
    }
    // stepCap validates like parseLevel and accepts an already-parsed level
    assert.throws(() => CAP(mk({ terrain: ['000'] })), /lasers-3d level: terrain/);
    assert.equal(CAP(parseLevel(mk())), CAP(mk()));
  });
  test('the cap can never fire: it strictly exceeds the number of distinct (x,y,z,d,v) states', () => {
    for (const [w, d] of [[1, 1], [6, 6], [12, 12], [24, 24], [1000, 1]]) {
      const states = w * d * Sim.H_MAX * 4 * 3;
      const cap = derived(w, d);
      assert.ok(cap > states, `${w}x${d}: cap ${cap} must exceed ${states} states`);
    }
  });
  test('a legal straight run far longer than 400 cells reaches its target (was a false loop)', () => {
    const r = trace(corridor(1000, 999), []);
    assert.equal(r.end, 'target');
    assert.notEqual(r.end, 'loop');
    assert.equal(r.segments.length, 999);
    assert.equal(r.visited.length, 999);
    assert.ok(r.segments.length > MAX_STEPS, 'the run must be longer than the old hard-coded cap');
    assert.ok(r.segments.length < CAP(corridor(1000, 999)));
    assert.deepEqual(r.endPoint, { x: 999, y: 0, z: 0 });
    assert.deepEqual(r.endPoint, r.segments[r.segments.length - 1].to);
    assert.deepEqual(r.hits, [0]);
    assert.equal(r.allTargetsHit, true);
  });
  test('no boundary at 400: a target on the 400th, 401st and 900th entered cell is hit alike', () => {
    for (const tx of [MAX_STEPS, MAX_STEPS + 1, 900]) {
      const r = trace(corridor(1000, tx), []);
      assert.equal(r.end, 'target', `target at x=${tx}`);
      assert.equal(r.visited.length, tx);
      assert.deepEqual(r.hits, [0]);
    }
  });
  test('a long corridor with no target on the beam leaves the grid instead of reporting loop', () => {
    // target parked off the beam row so the beam runs the full corridor and exits east
    const lvl = mk({ w: 1000, d: 2, terrain: ['0'.repeat(1000), '0'.repeat(1000)], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 5, y: 1 }], tray: [] });
    const r = trace(lvl, []);
    assert.equal(r.end, 'lost-edge');
    assert.notEqual(r.end, 'loop');
    assert.equal(r.visited.length, 999);
    assert.deepEqual(r.endPoint, { x: 1000, y: 0, z: 0 });
    assert.ok(r.segments.length < CAP(lvl));
  });
  test('the guard still fires on a 24x24 board: the documented 3D cycle ends loop far below the cap', () => {
    // Same construction as the documented 3D cycle, replayed on a 24x24 board: the state-repeat
    // guard - not the step cap - is what stops it, and it stops at the same place as on 7x7.
    const big = Array.from({ length: 24 }, (_, y) => (LOOP_TERRAIN[y] || '0000000') + '0'.repeat(17));
    const lvl = mk({ w: 24, d: 24, terrain: big, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 23, y: 23 }], tray: [] });
    const r = trace(lvl, loopPieces());
    assert.equal(r.end, 'loop');
    assert.deepEqual(r.endPoint, { x: 3, y: 3, z: 1 });
    assert.ok(r.segments.length < CAP(lvl), `segments ${r.segments.length} vs cap ${CAP(lvl)}`);
    assert.ok(r.segments.length < MAX_STEPS, 'a real cycle is caught by the state guard, not the cap');
  });
  test('cap end is deterministic', () => {
    const L = parseLevel(corridor(1000, 999));
    assert.deepEqual(trace(L, []), trace(L, []));
  });
});

// ---------------------------------------------------------------------------
describe('robustness: seeded fuzz - random levels and random (possibly illegal) placements', () => {
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  const TYPES = Pieces.TYPES, ORS = Pieces.ORIENTS, DIRK = ['E', 'N', 'W', 'S'];

  function randomLevel(r) {
    const w = 6 + Math.floor(r() * 4), d = 6 + Math.floor(r() * 4);
    const terrain = Array.from({ length: d }, () => Array.from({ length: w }, () => String(r() < 0.6 ? 0 : Math.floor(r() * 4))).join(''));
    const cell = () => ({ x: Math.floor(r() * w), y: Math.floor(r() * d) });
    const emitter = { ...cell(), dir: DIRK[Math.floor(r() * 4)] };
    const used = new Set([`${emitter.x},${emitter.y}`]);
    const pick = () => { for (;;) { const c = cell(); const k = `${c.x},${c.y}`; if (!used.has(k)) { used.add(k); return c; } } };
    const targets = Array.from({ length: 1 + Math.floor(r() * 2) }, pick);
    const fixed = Array.from({ length: Math.floor(r() * 3) }, () => ({ ...pick(), type: TYPES[Math.floor(r() * 3)], orient: ORS[Math.floor(r() * 2)], secret: r() < 0.5 }));
    return { name: 'F', par: 0, size: { w, d }, terrain, emitter, targets, fixed, tray: ['MIRROR'] };
  }
  function randomPlaced(r, L) {
    // Deliberately allowed to overlap fixed pieces, targets, the emitter, and each other.
    return Array.from({ length: Math.floor(r() * 8) }, () => ({
      x: Math.floor(r() * L.size.w), y: Math.floor(r() * L.size.d),
      type: TYPES[Math.floor(r() * 3)], orient: ORS[Math.floor(r() * 2)],
    }));
  }
  function checkInvariants(L, placed, res, tag) {
    assert.ok(ENDS.has(res.end), `${tag}: end ${res.end}`);
    assert.ok(res.segments.length <= CAP(L), `${tag}: segments ${res.segments.length} vs cap ${CAP(L)}`);
    // the cap is a safety net only: a fuzz board is small enough that a real cycle always ends first
    assert.ok(res.segments.length < CAP(L), `${tag}: the derived cap must never be the terminator`);
    assert.ok(res.segments.length >= 1, `${tag}: at least the terminal segment`);
    assert.deepEqual(res.endPoint, res.segments[res.segments.length - 1].to, `${tag}: endPoint = last to`);
    assert.deepEqual(res.altitudeMarks[res.altitudeMarks.length - 1], res.endPoint, `${tag}: last mark = endPoint`);
    assert.equal(res.allTargetsHit, res.hits.length === L.targets.length, `${tag}: allTargetsHit`);
    assert.equal(new Set(res.hits).size, res.hits.length, `${tag}: hits unique`);
    assert.equal(res.end === 'target', res.allTargetsHit, `${tag}: end target iff all lit`);
    // segments chain: each from = previous to
    for (let i = 1; i < res.segments.length; i++) {
      assert.deepEqual(res.segments[i].from, res.segments[i - 1].to, `${tag}: segment ${i} chains`);
    }
    // every visited cell is on-grid with z in 0..3 and z >= t
    for (const s of res.visited) {
      assert.ok(s.x >= 0 && s.x < L.size.w && s.y >= 0 && s.y < L.size.d, `${tag}: visited on grid`);
      assert.ok(s.z >= 0 && s.z <= 3, `${tag}: visited z`);
      // DESIGN.md 13.2: a visited cell is at or above the column top, OR at a level punched out of it.
      assert.ok(L.t[s.y][s.x] <= s.z || ((L.openMask[s.y][s.x] >> s.z) & 1) === 1,
        `${tag}: visited inside solid rock at (${s.x},${s.y}) level ${s.z}, column height ${L.t[s.y][s.x]}`);
      assert.ok(DIRK.includes(s.d) && [-1, 0, 1].includes(s.v), `${tag}: visited d/v`);
    }
    // visited.length equals the number of non-terminal-stub segments
    const stub = ['blocked', 'lost-floor', 'lost-sky', 'lost-edge'].includes(res.end) ? 1 : 0;
    assert.equal(res.visited.length, res.segments.length - stub, `${tag}: visited count`);
    // piece hits reference real pieces on cells at the beam's level; fixed flag correct
    const fixedKeys = new Set(L.fixed.map(f => `${f.x},${f.y}`));
    for (const p of res.pieceHits) {
      assert.equal(p.fixed, fixedKeys.has(`${p.x},${p.y}`), `${tag}: fixed flag`);
      assert.ok(TYPES.includes(p.type) && ORS.includes(p.orient), `${tag}: piece hit shape`);
    }
    // the emitter cell is never entered
    assert.ok(!res.visited.some(s => s.x === L.emitter.x && s.y === L.emitter.y), `${tag}: emitter never entered`);
    // --- events stream mirrors the legacy fields exactly and is ordered by segment index
    assert.ok(Array.isArray(res.events), `${tag}: events array`);
    const EK = new Set(['enter', 'piece', 'overflight', 'underpass', 'target', 'pitch', 'end']);
    for (let i = 0; i < res.events.length; i++) {
      const e = res.events[i];
      assert.ok(EK.has(e.kind), `${tag}: event kind ${e.kind}`);
      assert.ok(Number.isInteger(e.step) && e.step >= 0 && e.step < res.segments.length, `${tag}: event step ${e.step}`);
      if (i) assert.ok(e.step >= res.events[i - 1].step, `${tag}: events ordered by step`);
    }
    const last = res.events[res.events.length - 1];
    assert.equal(last.kind, 'end', `${tag}: last event is the terminal`);
    assert.equal(last.end, res.end, `${tag}: terminal event carries end`);
    assert.equal(res.events.filter(e => e.kind === 'end').length, 1, `${tag}: exactly one terminal`);
    assert.deepEqual({ x: last.x, y: last.y, z: last.z }, res.endPoint, `${tag}: terminal at endPoint`);
    assert.deepEqual(res.events.filter(e => e.kind === 'enter').map(e => ({ x: e.x, y: e.y, z: e.z, d: e.d, v: e.v })), res.visited, `${tag}: enters = visited`);
    assert.deepEqual(res.events.filter(e => e.kind === 'piece').map(e => ({ x: e.x, y: e.y, type: e.type, orient: e.orient, fixed: e.fixed })), res.pieceHits, `${tag}: pieces = pieceHits`);
    assert.deepEqual(res.events.filter(e => e.kind === 'overflight').map(e => ({ x: e.x, y: e.y })), res.overflights, `${tag}: overflights`);
    assert.deepEqual(res.events.filter(e => e.kind === 'underpass').map(e => ({ x: e.x, y: e.y })), res.underpasses, `${tag}: underpasses`);
    // over and under are never both reported for the same step, and each is on the right side of the piece
    for (const e of res.events) {
      if (e.kind === 'overflight') assert.ok(e.z > L.t[e.y][e.x], `${tag}: overflight not above the piece`);
      if (e.kind === 'underpass') assert.ok(e.z < L.t[e.y][e.x] && ((L.openMask[e.y][e.x] >> e.z) & 1) === 1, `${tag}: underpass not through an opening`);
    }
    assert.deepEqual(res.events.filter(e => e.kind === 'target').map(e => e.targetIndex), res.hits, `${tag}: targets = hits`);
    assert.deepEqual(res.events.filter(e => e.kind === 'pitch' || e.kind === 'end').map(e => ({ x: e.x, y: e.y, z: e.z })), res.altitudeMarks, `${tag}: pitch+end = altitudeMarks`);
    // a target is only ever reported at the orb's own level - never on a fly-over
    for (const e of res.events) {
      if (e.kind !== 'target') continue;
      assert.equal(e.z, L.t[e.y][e.x], `${tag}: target event above the orb`);
      assert.deepEqual({ x: e.x, y: e.y }, { x: L.targets[e.targetIndex].x, y: L.targets[e.targetIndex].y }, `${tag}: target event cell`);
    }
  }

  test('1500 random boards: never throws, invariants hold, deterministic', () => {
    const r = rng(0xC0FFEE);
    let loops = 0, caps = 0, over = 0;
    for (let i = 0; i < 1500; i++) {
      const raw = randomLevel(r);
      let L;
      try { L = parseLevel(raw); } catch (e) { assert.fail(`generator produced an invalid level: ${e.message}`); }
      const placed = randomPlaced(r, L);
      const a = trace(L, placed);
      const b = trace(raw, placed.map(p => ({ ...p })));
      assert.deepEqual(a, b, `iteration ${i}: nondeterministic`);
      checkInvariants(L, placed, a, `iteration ${i}`);
      if (a.end === 'loop') { loops++; if (a.segments.length >= CAP(L)) caps++; }
      if (a.overflights.length) over++;
      for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) {
        assert.equal(typeof canPlace(L, placed, x, y), 'boolean');
      }
    }
    assert.ok(over > 0, 'fuzz should exercise overflights');
  });

  test('1200 random boards WITH openings: never throws, deterministic, and no beam is ever inside rock', () => {
    const r = rng(0x0FE0FE);
    let threaded = 0, under = 0, withOpen = 0;
    for (let i = 0; i < 1200; i++) {
      const raw = randomLevel(r);
      const base = parseLevel(raw);
      const openings = [];
      for (let y = 0; y < base.size.d; y++) for (let x = 0; x < base.size.w; x++) {
        const top = base.t[y][x];
        if (top < 1 || r() < 0.55) continue;
        const levels = [];
        for (let z = 0; z < top; z++) if (r() < 0.5) levels.push(z);
        if (levels.length) openings.push({ x, y, levels });
      }
      const withOpenings = Object.assign({}, raw, { openings });
      if (openings.length) withOpen++;
      let L;
      try { L = parseLevel(withOpenings); } catch (e) { assert.fail(`iteration ${i}: ${e.message}`); }
      const placed = randomPlaced(r, L);
      const a = trace(L, placed);
      const b = trace(withOpenings, placed.map(p => ({ ...p })));
      assert.deepEqual(a, b, `iteration ${i}: nondeterministic`);
      checkInvariants(L, placed, a, `iteration ${i} (openings)`);
      // THE RULE OF 13.2, stated as an invariant: the beam is below a column's top only at a level
      // that column has actually had punched out.
      for (const v of a.visited) {
        if (v.z >= L.t[v.y][v.x]) continue;
        assert.equal((L.openMask[v.y][v.x] >> v.z) & 1, 1, `iteration ${i}: beam inside solid rock`);
        assert.equal(Sim.isOpen(L, v.x, v.y, v.z), true, `iteration ${i}: isOpen disagrees with openMask`);
        threaded++;
      }
      for (const u of a.underpasses) under++;
      // openings never change the derived loop-guard cap: the state space is unchanged
      assert.equal(Sim.stepCap(L), Sim.stepCap(raw), `iteration ${i}: stepCap moved`);
    }
    assert.ok(withOpen > 600, 'the fuzz should carry openings: ' + withOpen);
    assert.ok(threaded > 100, 'the fuzz should thread openings: ' + threaded);
    assert.ok(under > 0, 'the fuzz should pass under a piece at least once: ' + under);
  });
});

// ---------------------------------------------------------------------------
describe('robustness: UMD wrapper', () => {
  const piecesSrc = readFileSync(path.join(SRC, 'pieces.js'), 'utf8');
  const simSrc = readFileSync(path.join(SRC, 'sim.js'), 'utf8');

  test('node require: sim.js loads pieces.js itself and shares the same registry object', () => {
    assert.equal(Sim.PIECES, Pieces.PIECES);
    assert.equal(Sim.TURN, Pieces.TURN);
    assert.equal(Sim.ORIENTS, Pieces.ORIENTS);
    assert.equal(typeof Sim.trace, 'function');
    assert.equal(typeof Sim.canPlace, 'function');
    assert.equal(typeof Sim.parseLevel, 'function');
    // require cache: a second require returns the same exports
    assert.equal(require('../src/sim.js'), Sim);
  });
  test('node require: module.exports is the factory result, not wrapped', () => {
    assert.deepEqual(Object.keys(Sim).sort(), ['DIRS', 'H_MAX', 'MAX_STEPS', 'ORIENTS', 'PIECES', 'TURN', 'canPlace', 'isOpen', 'parseLevel', 'stepCap', 'trace'].sort());
    assert.deepEqual(Object.keys(Pieces).sort(),
      ['ORIENTS', 'PIECES', 'TURN', 'TURN_KEEP', 'TYPES', 'V_MIN', 'V_MAX', 'acts', 'apply', 'applyPitch', 'clampPitch',
       'isOrient', 'isType', 'rotate', 'turnDir', 'turnsBeam'].sort());
  });

  function browserContext({ withSelf }) {
    // Browser-like sandbox: window === self === globalThis; no `module`, no `require`.
    const sandbox = {};
    sandbox.window = sandbox;
    if (withSelf) sandbox.self = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(piecesSrc, ctx, { filename: 'pieces.js' });
    vm.runInContext(simSrc, ctx, { filename: 'sim.js' });
    return sandbox;
  }

  test('vm with window+self: plain-script evaluation defines window.LaserPieces and window.LaserSim', () => {
    const win = browserContext({ withSelf: true });
    assert.equal(typeof win.LaserPieces, 'object');
    assert.equal(typeof win.LaserSim, 'object');
    assert.equal(win.window.LaserSim, win.LaserSim);
    assert.equal(win.self.LaserSim, win.LaserSim);
    assert.equal(win.LaserSim.PIECES, win.LaserPieces.PIECES);
    assert.equal(typeof win.module, 'undefined');
    assert.equal(typeof win.exports, 'undefined');
  });
  test('vm with window only (no self): falls back to `this` and still defines the globals', () => {
    const win = browserContext({ withSelf: false });
    assert.equal(typeof win.LaserPieces, 'object');
    assert.equal(typeof win.LaserSim, 'object');
    assert.equal(win.window.LaserSim, win.LaserSim);
  });
  test('vm globals produce the same trace as the node require build (Example A from INTERFACES 5)', () => {
    const win = browserContext({ withSelf: true });
    const lvl = {
      name: 'FIRST BOUNCE', par: 1, size: { w: 5, d: 5 },
      terrain: ['00000', '00000', '00000', '00000', '00000'],
      emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 2, y: 4 }], fixed: [], tray: ['MIRROR'],
    };
    const placed = [{ x: 2, y: 2, type: 'MIRROR', orient: '/' }];
    const fromVm = JSON.parse(JSON.stringify(win.LaserSim.trace(lvl, placed)));
    const fromNode = JSON.parse(JSON.stringify(trace(lvl, placed)));
    assert.deepEqual(fromVm, fromNode);
    assert.equal(fromVm.end, 'target');
    assert.deepEqual(fromVm.altitudeMarks, [{ x: 2, y: 4, z: 0 }]);
    // and the documented validation error surfaces across the realm boundary as an Error with the prefix
    assert.throws(() => win.LaserSim.parseLevel({ ...lvl, terrain: ['000'] }), /lasers-3d level: terrain/);
  });
  test('vm: evaluating sim.js before pieces.js fails loudly (documented load order), not silently', () => {
    const sandbox = {}; sandbox.window = sandbox; sandbox.self = sandbox;
    const ctx = vm.createContext(sandbox);
    // cross-realm: the vm's TypeError has a different prototype, so match by name
    assert.throws(() => vm.runInContext(simSrc, ctx, { filename: 'sim.js' }), (e) => e.name === 'TypeError');
    assert.equal(typeof sandbox.LaserSim, 'undefined');
  });
  test('vm: the sources are ES2019-safe plain scripts (no import/export, no optional chaining, no ??)', () => {
    for (const [name, src] of [['pieces.js', piecesSrc], ['sim.js', simSrc]]) {
      assert.doesNotMatch(src, /^\s*(import|export)\b/m, `${name} must not use ESM syntax`);
      assert.doesNotMatch(src, /\?\.\w/, `${name} must not use optional chaining`);
      assert.doesNotMatch(src, /\?\?/, `${name} must not use nullish coalescing`);
      // a Script (not Module) parse must succeed
      assert.doesNotThrow(() => new vm.Script(src, { filename: name }));
    }
  });
});

// ===========================================================================
// SECOND REVIEW PASS - angles the first pass did not touch.
// ===========================================================================
describe('robustness (pass 2): frozen inputs, spoofed parsed levels, coordinate-type parity', () => {
  function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); }
    return o;
  }
  test('deep-frozen raw level and placed list: parseLevel/canPlace/trace never throw (strict-mode mutation would)', () => {
    const lvl = deepFreeze(mk({ terrain: rows('0000000', '0000000', '0000000', '1001000', '0000000', '0000000', '0001000'), targets: [{ x: 3, y: 6 }],
      fixed: [{ x: 5, y: 5, type: 'WEDGE', orient: '\\', secret: true }] }));
    const placed = deepFreeze([M(3, 3, '/')]);
    const L = parseLevel(lvl);
    assert.equal(L.parsed, true);
    assert.equal(canPlace(lvl, placed, 2, 2), true);
    const r = trace(lvl, placed);
    assert.equal(r.end, 'target');
    // a frozen PARSED level is also fine (a solver may freeze it)
    deepFreeze(L);
    assert.equal(trace(L, placed).end, 'target');
    assert.equal(canPlace(L, placed, 3, 3), false);
  });
  // REGRESSION (fixed): parseLevel used to treat `parsed: true` as a trust brand and return early, so a
  // hand-made object claiming it bypassed every check and could crash the renderer later. The brand is now
  // module-private (a WeakSet), so `parsed: true` on an input is just a label and is validated like any field.
  test('a forged "parsed" level (parsed:true, t:[]) is validated, not trusted', () => {
    const spoof = { ...mk(), parsed: true, t: [] };
    const out = trace(spoof, []);
    assert.ok(ENDS.has(out.end) && Number.isFinite(out.endPoint.x), 'forged parsed level produced garbage: ' + JSON.stringify(out.endPoint));
    assert.equal(out.end, 'target');
    // the forged `t` is discarded: the real terrain is re-derived from `terrain`
    const L = parseLevel(spoof);
    assert.notEqual(L, spoof);
    assert.equal(L.t.length, 7);
    assert.equal(L.t[0].length, 7);
  });
  test('a forged "parsed" level with an invalid body still throws the documented error', () => {
    for (const [bad, re] of [
      [{ ...mk(), parsed: true, t: [[0]], terrain: ['000'] }, /lasers-3d level: terrain/],
      [{ ...mk(), parsed: true, t: [[0]], size: { w: 0, d: 7 } }, /lasers-3d level: size/],
      [{ ...mk(), parsed: true, t: [[0]], emitter: { x: 99, y: 0, dir: 'E' } }, /lasers-3d level: emitter/],
      [{ ...mk(), parsed: true, t: [[0]], targets: [] }, /lasers-3d level: target/],
      [{ ...mk(), parsed: true, t: [[0]], tray: ['PRISM'] }, /lasers-3d level: tray/],
      [{ parsed: true, t: [[0]] }, /lasers-3d level: size/],
    ]) {
      assert.throws(() => parseLevel(bad), re);
      assert.throws(() => trace(bad, []), re);
      assert.throws(() => canPlace(bad, [], 1, 1), re);
    }
  });
  test('the parsed brand cannot be forged by copying a genuinely parsed level', () => {
    const L = parseLevel(mk());
    assert.equal(parseLevel(L), L, 'idempotent for a level THIS module parsed');
    // a structural clone is NOT branded: it is re-validated and a fresh object comes back
    const clone = { ...L };
    const re = parseLevel(clone);
    assert.notEqual(re, clone);
    assert.equal(re.parsed, true);
    assert.deepEqual(re.t, L.t);
    // ...and a clone with a poisoned body throws instead of sliding through
    assert.throws(() => parseLevel({ ...L, terrain: ['0'] }), /lasers-3d level: terrain/);
    assert.throws(() => parseLevel({ ...L, targets: [{ x: 99, y: 0 }] }), /lasers-3d level: target/);
  });
  test('parseLevel stays idempotent across many traces (the solver parses once, traces many)', () => {
    const L = parseLevel(mk({ targets: [{ x: 3, y: 6 }] }));
    for (let i = 0; i < 200; i++) {
      assert.equal(parseLevel(L), L);
      assert.equal(trace(L, [M(3, 3, '/')]).end, 'target');
    }
    assert.equal(JSON.stringify(L), JSON.stringify(parseLevel(L)));
  });
  // REGRESSION (fixed): parsed.terrain used to keep an array row as-is, so a renderer indexing
  // terrain[y][x] as a string saw a number, not a char. parseLevel now always returns canonical strings.
  test('parseLevel always returns canonical string terrain rows (INTERFACES 3)', () => {
    const terrain = Array.from({ length: 7 }, () => '0000000');
    terrain[3] = [0, 1, 2, 3, 0, 0, 0];
    const L = parseLevel(mk({ terrain }));
    assert.ok(L.terrain.every(rw => typeof rw === 'string'), 'parsed.terrain rows should all be strings');
    assert.equal(L.terrain[3], '0123000');
    assert.equal(L.terrain.length, 7);
    L.terrain.forEach((rw, y) => assert.equal(rw, L.t[y].join(''), `row ${y} matches t`));
  });
  test('placed piece coordinates as strings: trace and canPlace agree on whether the cell is occupied (both key by "x,y")', () => {
    // Spec silent on coordinate types; the invariant asserted is internal consistency between 3.4 and 3.2.
    const strPlaced = [{ x: '3', y: '3', type: 'MIRROR', orient: '/' }];
    const acted = trace(mk({ targets: [{ x: 6, y: 0 }] }), strPlaced).pieceHits.length > 0;
    const occupied = !canPlace(mk(), strPlaced, 3, 3);
    assert.equal(acted, occupied, `trace acted=${acted} but canPlace occupied=${occupied}`);
  });
  test('placed piece whose coordinates alias another cell via key collision cannot exist (keys are "x,y" with ints)', () => {
    // {x:1, y:23} vs {x:12, y:3} must be different cells on a wide board
    const lvl = mk({ w: 20, d: 30, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 19, y: 3 }] });
    const r = trace(lvl, [M(1, 23, '/'), M(12, 3, '/')]);
    assert.deepEqual(r.pieceHits.map(p => [p.x, p.y]), [[12, 3]]);
  });
  test('fixed piece secret flag is a strict boolean in the parsed level for the documented boolean inputs', () => {
    for (const [inp, want] of [[true, true], [false, false], [undefined, false], [null, false], [0, false], [1, true]]) {
      const L = parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'MIRROR', orient: '/', secret: inp }] }));
      assert.equal(L.fixed[0].secret, want, `secret ${String(inp)}`);
    }
  });
  test('non-array placed (plain object, number, string) never crashes the stepper', { todo: 'trace calls placed.forEach directly; a plain object throws TypeError' }, () => {
    // INTERFACES 2: "placed may be omitted or []". Anything else is a caller bug (spec silent). Asserting graceful handling.
    for (const placed of [{}, 0, 'MIRROR', { length: 1, 0: M(3, 3) }]) {
      assert.doesNotThrow(() => trace(mk(), placed), `placed=${JSON.stringify(placed)}`);
    }
  });
});

describe('robustness (pass 2): degenerate boards and immediate terminals', () => {
  test('1x2 board: emitter (0,0) facing N lights the target at (0,1) in one segment; facing E is lost-edge at once', () => {
    const north = trace({ size: { w: 1, d: 2 }, terrain: ['0', '0'], emitter: { x: 0, y: 0, dir: 'N' }, targets: [{ x: 0, y: 1 }] }, []);
    assert.equal(north.end, 'target');
    assert.equal(north.segments.length, 1);
    const east = trace({ size: { w: 1, d: 2 }, terrain: ['0', '0'], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 0, y: 1 }] }, []);
    assert.equal(east.end, 'lost-edge');
    assert.deepEqual(east.endPoint, { x: 1, y: 0, z: 0 });
    assert.deepEqual(east.visited, []);
    assert.deepEqual(east.altitudeMarks, [{ x: 1, y: 0, z: 0 }]);
  });
  test('1x1 board cannot hold both an emitter and a target: parseLevel throws naming target', () => {
    assert.throws(() => parseLevel({ size: { w: 1, d: 1 }, terrain: ['0'], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 0, y: 0 }] }), /target/);
  });
  test('emitter facing a t=3 wall from t=0: one half-cell stub, blocked, no visited cells', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0300000', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.visited, []);
    assert.deepEqual(r.segments, [{ from: { x: 0, y: 3, z: 0 }, to: { x: 0.5, y: 3, z: 0 }, d: 'E', v: 0 }]);
  });
  test('emitter on t=3 facing a t=3 cell: enters (t == z is not a wall), never sky (pitch 0)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '3333333', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain }), []);
    assert.equal(r.end, 'target');
    assert.ok(r.visited.every(s => s.z === 3));
  });
  test('all-3 terrain with WEDGE at z=3: the very next step is lost-sky with the stub at z=3', () => {
    const terrain = Array.from({ length: 7 }, () => '3333333');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 6 }] }), [W(1, 3, '/')]);
    assert.equal(r.end, 'lost-sky');
    assert.deepEqual(r.endPoint, { x: 1, y: 3.5, z: 3 });
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 3, z: 3 }, { x: 1, y: 3.5, z: 3 }]);
  });
  test('DIP at z=0 on the grid edge heading off-grid: off-grid wins over floor (INTERFACES 4 check order)', () => {
    const r = trace(mk({ emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 6 }] }), [D(1, 0, '\\')]); // E->S at y=0 -> off grid
    assert.equal(r.end, 'lost-edge');
    assert.deepEqual(r.endPoint, { x: 1, y: -1, z: -1 });
  });
});

describe('robustness (pass 2): loop guard corner cases', () => {
  test('a cycle that re-enters the EMITTER state is impossible: the emitter body blocks first (seeded start state is never matched)', () => {
    // Square: E from (0,3); mirrors at (3,3) '/', (3,5) '\\', (0,5) '/': beam heads S back into the emitter cell.
    const r = trace(mk({ targets: [{ x: 6, y: 6 }] }), [M(3, 3, '/'), M(3, 5, '\\'), M(0, 5, '/')]);
    assert.equal(r.end, 'blocked');
    assert.notEqual(r.end, 'loop');
  });
  test('loop detection compares the POST-piece state: the loop endPoint is the cell where the state first repeats, and pieceHits records the repeat', () => {
    // Reuse the documented clamp cycle and check the repeated-state bookkeeping.
    const r = trace(loopLevel(), loopPieces());
    assert.equal(r.end, 'loop');
    const keys = r.visited.map(s => `${s.x},${s.y},${s.z},${s.d},${s.v}`);
    // the entry-state list may legitimately repeat only at the very last entry (that is what a loop is)
    const firstRepeatIdx = keys.findIndex((k, i) => keys.indexOf(k) !== i);
    assert.ok(firstRepeatIdx === -1 || firstRepeatIdx === keys.length - 1, 'a repeated ENTRY state should end the trace immediately');
    // the ENTRY states at the wedge DIFFER (v_in 0 then +1); it is the POST-piece state that repeats
    assert.deepEqual(r.visited.filter(v => v.x === 3 && v.y === 3).map(v => v.v), [0, 1]);
    assert.deepEqual(r.pieceHits[r.pieceHits.length - 1], { x: 3, y: 3, type: 'WEDGE', orient: '/', fixed: false });
    assert.ok(r.segments.length < CAP(loopLevel()));
    // the same trace repeated 50 times is identical (loop guard has no hidden state)
    const s = JSON.stringify(r);
    for (let i = 0; i < 50; i++) assert.equal(JSON.stringify(trace(loopLevel(), loopPieces())), s);
  });
  test('a huge empty board runs to its natural terminal, never to the derived cap', () => {
    // Was: cut at exactly 400 with end 'loop'. The cap is now derived (1000*1*4*4*3+1 = 48001)
    // and a 999-cell straight run is a legal route, so it must reach the target.
    const lvl = { size: { w: 1000, d: 1 }, terrain: ['0'.repeat(1000)], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 999, y: 0 }] };
    const r = trace(lvl, []);
    assert.equal(CAP(lvl), 48001);
    assert.equal(r.end, 'target');
    assert.notEqual(r.end, 'loop');
    assert.equal(r.segments.length, 999);
    assert.equal(r.visited.length, 999);
    assert.deepEqual(r.endPoint, { x: 999, y: 0, z: 0 });
    assert.deepEqual(r.altitudeMarks, [{ x: 999, y: 0, z: 0 }]);
    // and with the target moved off the run, it exits the grid rather than reporting loop
    const off = { size: { w: 1000, d: 2 }, terrain: ['0'.repeat(1000), '0'.repeat(1000)], emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 3, y: 1 }] };
    const r2 = trace(off, []);
    assert.equal(r2.end, 'lost-edge');
    assert.equal(r2.visited.length, 999);
  });
});

describe('robustness (pass 2): UMD wrapper under hostile globals', () => {
  const piecesSrc = readFileSync(path.join(SRC, 'pieces.js'), 'utf8');
  const simSrc = readFileSync(path.join(SRC, 'sim.js'), 'utf8');
  function run(sandbox) {
    const ctx = vm.createContext(sandbox);
    vm.runInContext(piecesSrc, ctx, { filename: 'pieces.js' });
    vm.runInContext(simSrc, ctx, { filename: 'sim.js' });
    return sandbox;
  }
  test('worker-like context: self defined, no window -> globals land on self', () => {
    const sb = {}; sb.self = sb;
    run(sb);
    assert.equal(typeof sb.LaserSim, 'object');
    assert.equal(sb.LaserSim.PIECES, sb.LaserPieces.PIECES);
  });
  test('page that defines a bare `module` global WITHOUT exports (e.g. `var module = {}`): still a browser build', () => {
    const sb = {}; sb.window = sb; sb.self = sb; sb.module = {};
    run(sb);
    assert.equal(typeof sb.LaserSim, 'object', 'must fall through to the browser branch when module.exports is falsy');
  });
  test('page that defines `module.exports` but no `require` (bundler shim leak): loading must not throw ReferenceError', { todo: 'sim.js takes the CommonJS branch on any module.exports and calls require(); a page with a module shim but no require crashes' }, () => {
    const sb = {}; sb.window = sb; sb.self = sb; sb.module = { exports: {} };
    assert.doesNotThrow(() => run(sb));
    assert.ok(typeof sb.LaserSim === 'object' || typeof sb.module.exports.trace === 'function');
  });
  test('vm build: pieces.js and sim.js each evaluate twice without error and the second sim.js rebinds to the latest LaserPieces', () => {
    const sb = {}; sb.window = sb; sb.self = sb;
    const ctx = vm.createContext(sb);
    vm.runInContext(piecesSrc, ctx); vm.runInContext(simSrc, ctx);
    const first = sb.LaserPieces;
    vm.runInContext(piecesSrc, ctx); vm.runInContext(simSrc, ctx);
    assert.notEqual(sb.LaserPieces, first);
    assert.equal(sb.LaserSim.PIECES, sb.LaserPieces.PIECES);
  });
  test('vm build: cross-realm inputs (level built in node, placed built in vm) trace identically', () => {
    const sb = {}; sb.window = sb; sb.self = sb;
    run(sb);
    const vmPlaced = vm.runInContext('[{x:3,y:3,type:"MIRROR",orient:"/"}]', vm.createContext(sb));
    const lvl = mk({ targets: [{ x: 3, y: 6 }] });
    const a = JSON.stringify(sb.LaserSim.trace(lvl, vmPlaced));
    const b = JSON.stringify(trace(lvl, [M(3, 3, '/')]));
    assert.equal(a, b);
  });
  test('vm build: strict-mode factory does not leak implicit globals into the page', () => {
    const sb = {}; sb.window = sb; sb.self = sb;
    run(sb);
    const leaked = Object.keys(sb).filter(k => !['window', 'self', 'LaserPieces', 'LaserSim'].includes(k));
    assert.deepEqual(leaked, []);
  });
});

// ---------------------------------------------------------------------------
// ARCHES AND WINDOWS (DESIGN.md section 13) - the adversarial half
// ---------------------------------------------------------------------------
describe('robustness: openings', () => {
  const arch = (o = {}) => mk(Object.assign({
    terrain: ['0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000'],
    openings: [{ x: 3, y: 3, levels: [0] }],
  }, o));

  test('a FORGED openMask on a hand-made "parsed" level is discarded and re-derived from `openings`', () => {
    // The mask is the thing the stepper actually reads, so a forged one is the dangerous forgery:
    // it would open a column that `openings` never named, or seal one that it did.
    const spoof = { ...arch(), parsed: true, openMask: Array.from({ length: 7 }, () => new Array(7).fill(15)) };
    const L = parseLevel(spoof);
    assert.notEqual(L, spoof);
    assert.equal(L.openMask[3][3], 1, 'only the level `openings` names is open');
    assert.equal(L.openMask[0][0], 0, 'the forged all-open mask is gone');
    assert.equal(trace(spoof, []).end, 'target', 'and the beam still only goes where the data allows');
  });

  test('a forged openMask cannot seal an opening that `openings` declares', () => {
    const spoof = { ...arch(), parsed: true, openMask: Array.from({ length: 7 }, () => new Array(7).fill(0)) };
    assert.equal(parseLevel(spoof).openMask[3][3], 1);
    assert.equal(trace(spoof, []).end, 'target');
  });

  test('a malformed `openings` throws the documented error from trace and canPlace too, not only parseLevel', () => {
    for (const [bad, re] of [
      [arch({ openings: [{ x: 99, y: 3, levels: [0] }] }), /openings\[0\] must name an on-grid column/],
      [arch({ openings: [{ x: 3, y: 3, levels: [3] }] }), /not strictly below the height t=3/],
      [arch({ openings: [{ x: 3, y: 3, levels: [1, 1] }] }), /openings\[0\] repeats level 1/],
      [arch({ openings: [{ x: 3, y: 3, levels: [0] }, { x: 3, y: 3, levels: [1] }] }), /openings\[1\] duplicates the column/],
      [arch({ openings: 'nope' }), /openings must be an array/],
      [{ ...arch(), parsed: true, openings: [{ x: 3, y: 3, levels: [9] }] }, /openings\[0\] levels\[0\] must be an integer/],
    ]) {
      assert.throws(() => parseLevel(bad), re);
      assert.throws(() => trace(bad, []), re);
      assert.throws(() => canPlace(bad, [], 1, 1), re);
      assert.throws(() => Sim.stepCap(bad), re);
      assert.throws(() => Sim.isOpen(bad, 3, 3, 0), re);
    }
  });

  test('the parsed level never aliases the input: mutating `openings` afterwards changes nothing', () => {
    const raw = arch();
    const L = parseLevel(raw);
    raw.openings[0].levels.push(2);
    raw.openings.push({ x: 0, y: 0, levels: [0] });
    assert.deepEqual(L.openings, [{ x: 3, y: 3, levels: [0] }]);
    assert.equal(L.openMask[3][3], 1);
    assert.equal(trace(L, []).end, 'target');
  });

  test('an opening under the EMITTER lets a beam pass beneath the emitter body', () => {
    // The emitter body is a one-level-tall obstacle at its own terrain level (INTERFACES 4, rule 4).
    // Stand the emitter on a t=3 pillar and punch level 0 out of it: a beam that comes back round at
    // ground level runs straight UNDER the emitter instead of being stopped by its body.
    //   emitter (0,3) on the t=3 pillar fires E at z=3 -> DIP on the t=3 tower at (3,3) turns it S and
    //   drops it to z=0 by (3,0) -> WEDGE there levels it and sends it W -> MIRROR at (0,0) turns it N
    //   -> it passes THROUGH the emitter's own pillar at level 0 and lights the orb at (0,5).
    const board = (openings) => mk({
      terrain: ['0000000', '0000000', '0000000', '3003000', '0000000', '0000000', '0000000'],
      openings, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 0, y: 5 }],
    });
    const placed = [D(3, 3, '\\'), W(3, 0, '/'), M(0, 0, '\\')];
    const open = trace(board([{ x: 0, y: 3, levels: [0] }]), placed);
    assert.equal(open.visited[0].z, 3, 'the emitter fires from the TOP of its pillar');
    assert.equal(open.end, 'target');
    assert.ok(open.visited.some(v => v.x === 0 && v.y === 3 && v.z === 0), 'the beam passed under the emitter');
    // the identical board without the opening stops at the pillar's wall face
    const solid = trace(board(undefined), placed);
    assert.equal(solid.end, 'blocked');
    assert.deepEqual(solid.endPoint, { x: 0, y: 2.5, z: 0 });
  });

});

/* DESIGN.md 14 + 15: the new type and the new flag, held to the same validation standard as the rest. */
describe('robustness: the FLOOR type and the `dark` flag', () => {
  const trace = Sim.trace, parseLevel = Sim.parseLevel;

  test('FLOOR is a first-class type everywhere a type is accepted', () => {
    assert.equal(Pieces.isType('FLOOR'), true);
    assert.ok(Pieces.TYPES.includes('FLOOR'));
    assert.doesNotThrow(() => parseLevel(mk({ tray: ['FLOOR'] })));
    assert.doesNotThrow(() => parseLevel(mk({ fixed: [{ x: 2, y: 2, type: 'FLOOR', orient: '\\' }] })));
    assert.doesNotThrow(() => trace(mk(), [{ x: 2, y: 2, type: 'FLOOR', orient: '/' }]));
    // and the near-misses are still rejected the same way any unknown type is
    assert.throws(() => parseLevel(mk({ tray: ['floor'] })), /tray/);
    assert.throws(() => parseLevel(mk({ tray: ['PLATE'] })), /tray/);
    assert.throws(() => trace(mk(), [{ x: 2, y: 2, type: 'floor', orient: '/' }]), /placed piece/);
  });

  test('`dark` rejects every non-boolean, with the documented message prefix', () => {
    for (const bad of ['true', 'false', '', 0, 1, NaN, {}, [], () => {}]) {
      let msg = '';
      try { parseLevel(mk({ dark: bad })); } catch (e) { msg = e.message; }
      assert.ok(/^lasers-3d level: dark must be true or false/.test(msg), 'dark: ' + String(bad) + ' -> ' + msg);
    }
    assert.equal(parseLevel(mk({ dark: undefined })).dark, false);
    assert.equal(parseLevel(mk({ dark: null })).dark, false);
    assert.equal(parseLevel(mk({ dark: true })).dark, true);
    // parseLevel is idempotent on its own output, dark included
    const L = parseLevel(mk({ dark: true }));
    assert.equal(parseLevel(L), L);
    assert.equal(parseLevel(L).dark, true);
  });

  test('a FLOOR cannot be smuggled past the clamp or the turn table', () => {
    for (const orient of Pieces.ORIENTS) for (const dir of ['E', 'N', 'W', 'S']) for (const v of [-1, 0, 1]) {
      const r = Pieces.apply('FLOOR', orient, dir, v);
      assert.equal(r.d, dir);
      assert.ok(r.v >= Pieces.V_MIN && r.v <= Pieces.V_MAX);
      assert.ok(r.v === (v === -1 ? 1 : v));
    }
  });
});
