// node:test suite for the Lasers 3D rules engine (DESIGN.md section 3, as CORRECTED by section 12:
// pitch is a DELTA on the incoming beam, clamped to -1..+1, not an absolute the piece sets).
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Pieces = require('../src/pieces.js');
const Sim = require('../src/sim.js');

const { trace, canPlace, parseLevel, DIRS, H_MAX, PIECES, TURN, MAX_STEPS, stepCap } = Sim;

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

// THE 3D CYCLE under the corrected rule (spec 12). A cycle needs two different histories to reach
// the SAME (x,y,z,d,v) state, and the only thing in the engine that merges histories is the pitch
// CLAMP: a WEDGE maps both v_in = 0 and v_in = +1 to v_out = +1.
//   Emitter (0,3) on a t=1 ridge fires E at z=1 and flies OVER the wedge at (2,3) (it sits on t=0).
//   The WEDGE at (3,3) on t=1 is hit LEVEL (v 0 -> +1) and turns the beam north, climbing.
//   DIP (3,5) on t=3 levels it west; DIP (1,5) on t=3 turns it south, falling to z=0;
//   WEDGE (1,2) levels it east; MIRROR (2,2) turns it north; WEDGE (2,3) sends it east CLIMBING.
//   It re-enters (3,3) at z=1 - same cell, same level, same heading - but now with v_in = +1, and
//   the clamp maps that to the same v_out = +1. The post-piece state repeats exactly.
const loopTerrain = rows('0000000', '0000000', '0000000', '1001000', '0000000', '0303000', '0000000');
const loopLevel = () => mk({ terrain: loopTerrain, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }] });
const loopPieces = () => [W(3, 3, '/'), D(3, 5, '\\'), D(1, 5, '/'), W(1, 2, '\\'), M(2, 2, '/'), W(2, 3, '/')];

describe('pieces.js registry and turn tables (3.3)', () => {
  test('turn table / ', () => {
    assert.deepEqual(TURN['/'], { E: 'N', N: 'E', W: 'S', S: 'W' });
  });
  test('turn table \\', () => {
    assert.deepEqual(TURN['\\'], { E: 'S', S: 'E', W: 'N', N: 'W' });
  });
  test('pitch DELTAS (spec 12.1): MIRROR 0, WEDGE +1, DIP -1 - not absolute pitches', () => {
    assert.equal(PIECES.MIRROR.dPitch, 0);
    assert.equal(PIECES.WEDGE.dPitch, 1);
    assert.equal(PIECES.DIP.dPitch, -1);
    // the old absolute `pitch` field is GONE; leaving it would let a stale consumer keep the old rule
    for (const t of Pieces.TYPES) assert.equal(PIECES[t].pitch, undefined, t + ' still carries an absolute pitch');
    assert.equal(Pieces.rotate('/'), '\\');
    assert.equal(Pieces.rotate('\\'), '/');
  });
  test('THE PITCH TABLE (spec 12.1), every cell: apply(type, orient, dir, vIn).v', () => {
    // rows are v_in = -1, 0, +1 (DESIGN.md section 12.1)
    const TABLE = {
      MIRROR: { '-1': -1, '0': 0, '1': 1 },     // preserved
      WEDGE:  { '-1': 0,  '0': 1, '1': 1 },     // +1, clamped at +1
      DIP:    { '-1': -1, '0': -1, '1': 0 },    // -1, clamped at -1
    };
    for (const type of Pieces.TYPES) {
      for (const vIn of [-1, 0, 1]) {
        assert.equal(Pieces.applyPitch(type, vIn), TABLE[type][String(vIn)], `${type} v_in ${vIn}`);
        for (const orient of Pieces.ORIENTS) for (const dir of ['E', 'N', 'W', 'S']) {
          const r = Pieces.apply(type, orient, dir, vIn);
          assert.equal(r.v, TABLE[type][String(vIn)], `${type} ${orient} ${dir} v_in ${vIn}`);
          assert.equal(r.d, TURN[orient][dir], `${type} ${orient} ${dir}: the turn is unchanged by the pitch rule`);
        }
      }
    }
  });
  test('the clamp is central: V_MIN/V_MAX are exported and clampPitch bounds every delta', () => {
    assert.equal(Pieces.V_MIN, -1);
    assert.equal(Pieces.V_MAX, 1);
    assert.deepEqual([-3, -2, -1, 0, 1, 2, 3].map(Pieces.clampPitch), [-1, -1, -1, 0, 1, 1, 1]);
    // a future piece is one registry entry: a plain dPitch, or its own applyPitch, clamped centrally
    for (const t of Pieces.TYPES) {
      assert.ok(Number.isInteger(PIECES[t].dPitch), t + ' must carry a numeric dPitch');
      for (const vIn of [-1, 0, 1]) {
        assert.equal(Pieces.applyPitch(t, vIn), Pieces.clampPitch(vIn + PIECES[t].dPitch), t + ' v_in ' + vIn);
      }
    }
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
  // ---- the corrected pitch rule (DESIGN.md 12.1), one test per cell of the table ----
  // Shared board: a WEDGE at (1,3) on the floor turns E->N and starts the beam climbing; the piece
  // under test sits at (1,5) on a t=2 block, so it meets that climbing beam at z=2. A plateau target
  // waits at (6,5), t=2, which only a LEVEL beam at z=2 can reach.
  const climbTerrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0200002', '0000000');
  const climbLevel = () => mk({ terrain: climbTerrain, targets: [{ x: 6, y: 5 }] });

  test("THE OWNER'S SCENARIO: a WEDGE sends the beam climbing, a plain MIRROR turns it, and the beam is STILL climbing", () => {
    // James: "when the wedge angles the beam upward and then a regular mirror interacts with it next
    // the beam should still be directed upward." A vertical mirror's normal is horizontal, so it
    // rotates the heading and leaves the climb alone (spec 12.1).
    const r = trace(climbLevel(), [W(1, 3, '/'), M(1, 5, '/')]);
    assert.deepEqual(r.pieceHits.map(p => p.type), ['WEDGE', 'MIRROR']);

    // THE ASSERTION: the beam leaves the MIRROR still climbing (v = +1), and keeps gaining a level per cell.
    const mirrorHit = r.events.find(e => e.kind === 'piece' && e.x === 1 && e.y === 5);
    assert.equal(mirrorHit.vIn, 1, 'the mirror is hit by a climbing beam');
    assert.equal(mirrorHit.vOut, 1, 'THE RULE: a MIRROR preserves the climb');
    assert.equal(mirrorHit.dIn, 'N');
    assert.equal(mirrorHit.dOut, 'E', 'and it still turns the beam 90 degrees');
    const afterMirror = r.visited.filter(v => v.y === 5 && v.x > 1);
    assert.ok(afterMirror.length > 0);
    assert.ok(afterMirror.every(v => v.v === 1), 'every cell after the mirror is still climbing');
    assert.deepEqual(afterMirror.map(v => v.z), [3], 'and it gains a level: z=2 at the mirror, z=3 the next cell');

    // A mirror that changes nothing gets no pitch event and no altitude mark.
    assert.deepEqual(r.events.filter(e => e.kind === 'pitch').map(e => [e.x, e.y, e.from, e.to]), [[1, 3, 0, 1]]);
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 3, z: 0 }, { x: 2.5, y: 5, z: 3 }]);

    // Consequence: the still-climbing beam overshoots the t=2 plateau target and flies off the top.
    assert.equal(r.end, 'lost-sky');
    assert.deepEqual(r.hits, []);
  });
  test('DIP levels a climbing beam - the ONLY way to level a climber (spec 12.1)', () => {
    const r = trace(climbLevel(), [W(1, 3, '/'), D(1, 5, '/')]);
    assert.equal(r.end, 'target', 'the levelled beam runs along z=2 into the plateau target');
    assert.deepEqual(r.pieceHits.map(p => p.type), ['WEDGE', 'DIP']);
    const dip = r.events.find(e => e.kind === 'piece' && e.x === 1 && e.y === 5);
    assert.equal(dip.vIn, 1);
    assert.equal(dip.vOut, 0);
    const after = r.visited.filter(v => v.y === 5 && v.x > 1);
    assert.ok(after.every(v => v.z === 2 && v.v === 0 && v.d === 'E'));
    assert.deepEqual(r.altitudeMarks, [{ x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 2 }, { x: 6, y: 5, z: 2 }]);
  });
  test('WEDGE on an already-climbing beam is CLAMPED: it stays climbing, it does not go vertical (spec 12.2)', () => {
    const r = trace(climbLevel(), [W(1, 3, '/'), W(1, 5, '/')]);
    const w2 = r.events.find(e => e.kind === 'piece' && e.x === 1 && e.y === 5);
    assert.equal(w2.vIn, 1);
    assert.equal(w2.vOut, 1, 'min(+1 + 1, +1) = +1');
    assert.deepEqual(r.events.filter(e => e.kind === 'pitch' && e.x === 1 && e.y === 5), [],
      'a clamped no-op is not a pitch change, so it gets no event and no altitude mark');
    assert.equal(r.end, 'lost-sky');
  });
  test('MIRROR preserves a DESCENDING beam too', () => {
    // emitter on the t=3 ridge at (0,3) facing E; DIP on t=3 at (2,3) turns E->N descending;
    // the MIRROR on the t=2 block at (2,4) is met at z=2 and must leave the beam falling.
    const terrain = rows('0000000', '0000000', '0000000', '3030000', '0020000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 6 }] }), [D(2, 3, '/'), M(2, 4, '/')]);
    const m = r.events.find(e => e.kind === 'piece' && e.x === 2 && e.y === 4);
    assert.equal(m.vIn, -1);
    assert.equal(m.vOut, -1, 'THE RULE: a MIRROR preserves the descent');
    assert.equal(m.dOut, 'E');
    assert.deepEqual(r.visited.filter(v => v.y === 4 && v.x > 2).map(v => [v.z, v.v]), [[1, -1], [0, -1]]);
    assert.equal(r.end, 'lost-floor', 'still falling, so it reaches the floor');
  });
  test('WEDGE levels a descending beam - the ONLY way to level a descender (spec 12.1)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '3030000', '0020002', '0000000', '0000000');
    const r = trace(mk({ terrain, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 4 }] }), [D(2, 3, '/'), W(2, 4, '/')]);
    const w = r.events.find(e => e.kind === 'piece' && e.x === 2 && e.y === 4);
    assert.equal(w.vIn, -1);
    assert.equal(w.vOut, 0);
    assert.equal(w.dOut, 'E');
    assert.equal(r.end, 'target', 'levelled at z=2 and run east into the t=2 plateau orb');
    assert.deepEqual(r.hits, [0]);
  });
  test('DIP on an already-descending beam is CLAMPED: it stays descending (spec 12.2)', () => {
    const terrain = rows('0000000', '0000000', '0000000', '3030000', '0020000', '0000000', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 6 }] }), [D(2, 3, '/'), D(2, 4, '/')]);
    const d2 = r.events.find(e => e.kind === 'piece' && e.x === 2 && e.y === 4);
    assert.equal(d2.vIn, -1);
    assert.equal(d2.vOut, -1, 'max(-1 - 1, -1) = -1');
    assert.deepEqual(r.events.filter(e => e.kind === 'pitch' && e.x === 2 && e.y === 4), []);
    assert.equal(r.end, 'lost-floor');
  });
  test('WEDGE-then-DIP: climb to clear a wall, then level off onto the plateau (the taught pattern)', () => {
    // A t=2 ridge down column x=3 walls off the east half at ground level. The route is: WEDGE (1,1)
    // starts the climb, MIRROR (2,1) turns it east STILL CLIMBING (spec 12.1), and a DIP on the t=2
    // block at (2,2) levels it at z=2 - the height that clears the ridge and matches the plateau orb.
    const terrain = rows('0002000', '0012000', '0022002', '0002000', '0002000', '0000000', '0000000');
    const lvl = mk({ terrain, emitter: { x: 1, y: 0, dir: 'N' }, targets: [{ x: 6, y: 2 }] });
    const r = trace(lvl, [W(1, 1, '/'), M(2, 1, '/'), D(2, 2, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.pieceHits.map(p => p.type), ['WEDGE', 'MIRROR', 'DIP']);
    assert.deepEqual(r.hits, [0]);
    // the beam really does cross the ridge: it enters the t=2 wall cell (3,2) at z=2, on top of it
    assert.ok(r.visited.some(v => v.x === 3 && v.y === 2 && v.z === 2 && v.v === 0));
    // and every cell after the DIP is level at z=2
    assert.ok(r.visited.filter(v => v.x >= 3).every(v => v.z === 2 && v.v === 0));
    // swap the DIP for a MIRROR and the still-climbing beam is lost to the sky: only a DIP levels a climber
    const withMirror = trace(lvl, [W(1, 1, '/'), M(2, 1, '/'), M(2, 2, '/')]);
    assert.equal(withMirror.end, 'lost-sky');
    assert.deepEqual(withMirror.hits, []);
  });
  test('target on a plateau: reached only by a level or descending beam at its level', () => {
    // plateau target on t=2 at (4,3). A level-0 beam is blocked by the plateau face.
    const terrain = rows('0000000', '0000000', '0000000', '0000200', '0000000', '0000000', '0000000');
    const flat = trace(mk({ terrain, targets: [{ x: 4, y: 3 }] }), []);
    assert.equal(flat.end, 'blocked');
    assert.deepEqual(flat.hits, []);
    // Level arrival: wedge (2,3) climbs N; a DIP on t=2 at (2,5) LEVELS it east (a mirror there would
    // leave it climbing, spec 12.1); mirror on t=2 at (4,5) turns S level; enters (4,3) at z=2.
    const terr2 = rows('0000000', '0000000', '0000000', '0000200', '0000000', '0020200', '0000000');
    const ok = trace(mk({ terrain: terr2, targets: [{ x: 4, y: 3 }] }), [W(2, 3, '/'), D(2, 5, '/'), M(4, 5, '\\')]);
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
  test('loop guard: a 3D cycle (the pitch CLAMP merges two histories) -> end loop, never throws', () => {
    const r = trace(loopLevel(), loopPieces());
    assert.equal(r.end, 'loop');
    assert.deepEqual(r.endPoint, { x: 3, y: 3, z: 1 });
    assert.equal(r.segments.length, 13);
    assert.deepEqual(r.overflights, [{ x: 2, y: 3 }]);
    assert.deepEqual(r.hits, []);
    // the merge is exactly the clamp: the wedge at (3,3) acts twice, level in and climbing in,
    // and both times it emits the same +1
    const atWedge = r.events.filter(e => e.kind === 'piece' && e.x === 3 && e.y === 3);
    assert.deepEqual(atWedge.map(e => [e.vIn, e.vOut]), [[0, 1], [1, 1]]);
    assert.ok(r.segments.length < stepCap(loopLevel()), 'the state guard fires, not the cap');
  });
  test('step cap: MAX_STEPS is the MINIMUM cap; the real cap is derived per level', () => {
    // Was: `MAX_STEPS is 400`. The hard-coded 400 reported a legal >400-step route on a big board
    // as a false 'loop'. MAX_STEPS stays 400 as the documented floor; stepCap(level) derives the
    // real cap from the finite state space so the (x,y,z,d,v) repeat guard always fires first.
    assert.equal(MAX_STEPS, 400);
    const cap = (w, d) => stepCap({ size: { w, d }, terrain: Array.from({ length: d }, () => '0'.repeat(w)),
      emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: w - 1, y: d - 1 }] });
    const want = (w, d) => Math.max(MAX_STEPS, w * d * H_MAX * 4 * 3 + 1);
    for (const [w, d] of [[2, 2], [6, 6], [12, 12], [16, 16], [20, 20], [24, 24]]) {
      assert.equal(cap(w, d), want(w, d), `${w}x${d}`);
      assert.ok(cap(w, d) > w * d * H_MAX * 4 * 3, `${w}x${d}: cap must exceed the state count`);
    }
    assert.equal(cap(2, 2), MAX_STEPS);   // floor
    assert.equal(cap(6, 6), 1729);        // 6*6*4*4*3 + 1
    assert.equal(cap(24, 24), 27649);     // 24*24*4*4*3 + 1
    // stepCap accepts a raw or a parsed level and validates like parseLevel
    assert.equal(stepCap(parseLevel(mk())), stepCap(mk()));
    assert.throws(() => stepCap(mk({ terrain: ['000'] })), /lasers-3d level: terrain/);
  });
  test('REGRESSION: a legal 575-step route on a 24x24 board reaches its target, not a false loop', () => {
    // Serpentine corridor of fixed mirrors on a flat 24x24 board. The route enters every cell of
    // every row exactly once (575 segments > the old 400-step cap) and ends on the target at (0,23).
    // Under the old hard-coded MAX_STEPS this reported end:'loop' at step 400 - a false loss.
    const w = 24, d = 24;
    const fixed = [];
    for (let y = 0; y < d; y++) {
      // east column: even rows turn E->N ('/'), odd rows turn N->W ('\\')
      fixed.push({ x: w - 1, y, type: 'MIRROR', orient: y % 2 === 0 ? '/' : '\\' });
      // west column: odd rows turn W->N ('\\'), even rows turn N->E ('/'). (0,0) is the emitter,
      // (0,23) is the target, so both are skipped.
      if (y > 0 && y < d - 1) fixed.push({ x: 0, y, type: 'MIRROR', orient: y % 2 === 0 ? '/' : '\\' });
    }
    const level = {
      name: 'SERPENTINE 24',
      par: 0,
      size: { w, d },
      terrain: Array.from({ length: d }, () => '0'.repeat(w)),
      emitter: { x: 0, y: 0, dir: 'E' },
      targets: [{ x: 0, y: d - 1 }],
      fixed,
      tray: [],
    };
    const r = trace(level, []);
    assert.equal(r.end, 'target');
    assert.notEqual(r.end, 'loop');
    assert.deepEqual(r.hits, [0]);
    assert.equal(r.allTargetsHit, true);
    assert.deepEqual(r.endPoint, { x: 0, y: 23, z: 0 });
    // 24 rows x 23 horizontal steps + 23 vertical steps between rows
    assert.equal(r.segments.length, 575);
    assert.equal(r.visited.length, 575);
    assert.ok(r.segments.length > MAX_STEPS, 'the route must be longer than the old hard-coded cap');
    assert.ok(r.segments.length < stepCap(level), 'and still far below the derived cap');
    assert.equal(stepCap(level), 27649);
    // every cell except the emitter is entered exactly once: a genuinely non-repeating route
    const cells = new Set(r.visited.map(s => `${s.x},${s.y}`));
    assert.equal(cells.size, 575);
    assert.equal(r.pieceHits.length, 46);
    assert.ok(r.pieceHits.every(p => p.fixed === true));
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

describe('trace events (ordered, step-indexed stream)', () => {
  const kinds = (r) => r.events.map(e => e.kind);
  const ENDS = ['target', 'blocked', 'lost-edge', 'lost-floor', 'lost-sky', 'loop'];

  test('events is purely additive: every documented field keeps its shape', () => {
    const r = trace(mk(), []);
    assert.deepEqual(Object.keys(r).sort(),
      ['allTargetsHit', 'altitudeMarks', 'end', 'endPoint', 'events', 'hits', 'overflights', 'pieceHits', 'segments', 'visited'].sort());
    assert.ok(Array.isArray(r.events));
    assert.equal(r.end, 'target');
    assert.equal(r.segments.length, 6);
    assert.equal(r.visited.length, 6);
    assert.deepEqual(r.hits, [0]);
    assert.deepEqual(r.altitudeMarks, [{ x: 6, y: 3, z: 0 }]);
  });

  test('a straight shot: one enter per segment, then target, then the terminal event', () => {
    const r = trace(mk({ targets: [{ x: 2, y: 3 }] }), []);
    assert.deepEqual(r.events, [
      { kind: 'enter', step: 0, x: 1, y: 3, z: 0, d: 'E', v: 0 },
      { kind: 'enter', step: 1, x: 2, y: 3, z: 0, d: 'E', v: 0 },
      { kind: 'target', step: 1, x: 2, y: 3, z: 0, targetIndex: 0 },
      { kind: 'end', step: 1, x: 2, y: 3, z: 0, end: 'target' },
    ]);
  });

  test('step is the index of the segment that produced the event', () => {
    const terrain = rows('0000000', '0000000', '0000000', '0000000', '0000000', '0200002', '0000000');
    const r = trace(mk({ terrain, targets: [{ x: 6, y: 5 }] }), [W(1, 3, '/'), M(1, 5, '/')]);
    for (const e of r.events) {
      assert.ok(Number.isInteger(e.step) && e.step >= 0 && e.step < r.segments.length, `step ${e.step}`);
    }
    // steps are non-decreasing, and each 'enter' at step i lands on segment i's `to`
    for (let i = 1; i < r.events.length; i++) assert.ok(r.events[i].step >= r.events[i - 1].step);
    for (const e of r.events) {
      if (e.kind !== 'enter') continue;
      assert.deepEqual({ x: e.x, y: e.y, z: e.z }, r.segments[e.step].to);
    }
    // the terminal event is last, unique, and carries the same value as `end`
    const terminals = r.events.filter(e => e.kind === 'end');
    assert.equal(terminals.length, 1);
    assert.equal(terminals[0], r.events[r.events.length - 1]);
    assert.equal(terminals[0].end, r.end);
    assert.deepEqual({ x: terminals[0].x, y: terminals[0].y, z: terminals[0].z }, r.endPoint);
    assert.equal(terminals[0].step, r.segments.length - 1);
  });

  test('THE BUG: a beam that flies OVER a target and hits it later emits one target event, at the hit', () => {
    // emitter on a t=1 ridge at (0,3); the orb at (3,3) sits on t=0 so the outbound level-1 beam
    // passes over it. A DIP on the t=1 pedestal (5,3) starts it falling, a WEDGE at (5,4) LEVELS it
    // at z=0 (a mirror there would leave it falling into the floor, spec 12.1), and a mirror walks it
    // back into (3,3) at z=0 - the real hit. Matching on x,y alone lights it twice.
    const terrain = rows('0000000', '0000000', '0000000', '1000010', '0000000', '0000000', '0000000');
    const placed = [D(5, 3, '/'), W(5, 4, '\\'), M(3, 4, '/')];
    const r = trace(mk({ terrain, targets: [{ x: 3, y: 3 }] }), placed);
    assert.equal(r.end, 'target');
    assert.equal(r.segments.length, 9);
    // (3,3) is ENTERED twice, at two different heights
    const at33 = r.events.filter(e => e.kind === 'enter' && e.x === 3 && e.y === 3);
    assert.deepEqual(at33.map(e => [e.step, e.z]), [[2, 1], [8, 0]]);
    // ...but exactly ONE target event, on the second entry, at the orb's own level
    const hits = r.events.filter(e => e.kind === 'target');
    assert.deepEqual(hits, [{ kind: 'target', step: 8, x: 3, y: 3, z: 0, targetIndex: 0 }]);
    assert.deepEqual(r.hits, [0]);
    // the fly-over is visible as an 'enter' with no matching 'target' at the same step
    assert.equal(r.events.some(e => e.kind === 'target' && e.step === 2), false);
  });

  test('piece, pitch and overflight events carry the piece and the pitch change', () => {
    const terrain = rows('0000000', '0000000', '0000000', '1000000', '0000000', '0000000', '0000000');
    const over = trace(mk({ terrain, targets: [{ x: 6, y: 0 }] }), [M(3, 3, '/')]);
    assert.deepEqual(over.events.filter(e => e.kind === 'overflight'),
      [{ kind: 'overflight', step: 2, x: 3, y: 3, z: 1, type: 'MIRROR', orient: '/', fixed: false }]);
    assert.deepEqual(over.overflights, [{ x: 3, y: 3 }]);
    assert.deepEqual(over.events.filter(e => e.kind === 'piece'), []);

    const wedge = trace(mk({ targets: [{ x: 6, y: 6 }] }), [W(3, 3, '/')]);
    assert.deepEqual(wedge.events.filter(e => e.kind === 'piece'), [
      { kind: 'piece', step: 2, x: 3, y: 3, z: 0, type: 'WEDGE', orient: '/', fixed: false,
        dIn: 'E', dOut: 'N', vIn: 0, vOut: 1 },
    ]);
    assert.deepEqual(wedge.events.filter(e => e.kind === 'pitch'),
      [{ kind: 'pitch', step: 2, x: 3, y: 3, z: 0, from: 0, to: 1 }]);

    // a MIRROR hit by a level beam changes no pitch: piece event, no pitch event (same rule as altitudeMarks)
    const flat = trace(mk({ targets: [{ x: 3, y: 6 }] }), [M(3, 3, '/')]);
    assert.equal(flat.events.filter(e => e.kind === 'piece').length, 1);
    assert.deepEqual(flat.events.filter(e => e.kind === 'pitch'), []);
  });

  test('a fixed piece is reported with fixed:true, and the secret wedge reveal is one event', () => {
    const lvl = mk({ fixed: [{ x: 3, y: 3, type: 'WEDGE', orient: '/', secret: true }], targets: [{ x: 6, y: 6 }] });
    const r = trace(lvl, []);
    const piece = r.events.filter(e => e.kind === 'piece');
    assert.equal(piece.length, 1);
    assert.equal(piece[0].fixed, true);
    assert.equal(piece[0].type, 'WEDGE');
    assert.equal(parseLevel(lvl).fixed[0].secret, true);
  });

  test('every terminal kind produces exactly one end event carrying the same value as `end`', () => {
    const cases = [
      trace(mk(), []),                                                                     // target
      trace(mk({ terrain: rows('0000000', '0000000', '0000000', '0001000', '0000000', '0000000', '0000000') }), []),  // blocked
      trace(mk({ targets: [{ x: 6, y: 0 }] }), []),                                        // lost-edge
      trace(mk({ targets: [{ x: 6, y: 0 }] }), [D(2, 3, '/')]),                            // lost-floor
      trace(mk({ emitter: { x: 0, y: 0, dir: 'E' }, targets: [{ x: 6, y: 6 }] }), [W(1, 0, '/')]),  // lost-sky
      trace(loopLevel(), loopPieces()),                                                    // loop
    ];
    const seen = new Set();
    for (const r of cases) {
      const terminals = r.events.filter(e => e.kind === 'end');
      assert.equal(terminals.length, 1, `end ${r.end}`);
      assert.equal(terminals[0].end, r.end);
      assert.equal(terminals[0], r.events[r.events.length - 1]);
      assert.deepEqual({ x: terminals[0].x, y: terminals[0].y, z: terminals[0].z }, r.endPoint);
      seen.add(r.end);
    }
    assert.deepEqual([...seen].sort(), [...ENDS].sort());
  });

  test('events agree with the legacy fields they mirror', () => {
    const r = trace(loopLevel(), loopPieces());
    assert.deepEqual(r.events.filter(e => e.kind === 'enter').map(e => ({ x: e.x, y: e.y, z: e.z, d: e.d, v: e.v })), r.visited);
    assert.deepEqual(r.events.filter(e => e.kind === 'piece').map(e => ({ x: e.x, y: e.y, type: e.type, orient: e.orient, fixed: e.fixed })), r.pieceHits);
    assert.deepEqual(r.events.filter(e => e.kind === 'overflight').map(e => ({ x: e.x, y: e.y })), r.overflights);
    assert.deepEqual(r.events.filter(e => e.kind === 'target').map(e => e.targetIndex), r.hits);
    // altitudeMarks = every pitch event's cell + the endPoint, in order
    const marks = r.events.filter(e => e.kind === 'pitch' || e.kind === 'end').map(e => ({ x: e.x, y: e.y, z: e.z }));
    assert.deepEqual(marks, r.altitudeMarks);
    assert.deepEqual(kinds(r).filter(k => k === 'end'), ['end']);
  });

  test('a multi-target level emits one target event per NEWLY lit orb, in hit order', () => {
    const r = trace(mk({ targets: [{ x: 3, y: 3 }, { x: 6, y: 3 }] }), []);
    assert.deepEqual(r.events.filter(e => e.kind === 'target'), [
      { kind: 'target', step: 2, x: 3, y: 3, z: 0, targetIndex: 0 },
      { kind: 'target', step: 5, x: 6, y: 3, z: 0, targetIndex: 1 },
    ]);
    assert.deepEqual(r.hits, [0, 1]);
    assert.equal(r.end, 'target');
  });

  test('events are fresh per call and never alias the inputs', () => {
    const lvl = parseLevel(mk());
    const a = trace(lvl, []);
    a.events.length = 0;
    const b = trace(lvl, []);
    assert.equal(b.events.length, 8);   // 6 enters + 1 target + 1 end
    assert.notEqual(a.events, b.events);
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
