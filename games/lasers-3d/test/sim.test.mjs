// node:test suite for the Lasers 3D rules engine (DESIGN.md section 3, as CORRECTED by section 12:
// pitch is a DELTA on the incoming beam, clamped to -1..+1, not an absolute the piece sets).
// Row-order convention: terrain[y][x], y = 0 is the SOUTH row.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const Pieces = require('../src/pieces.js');
const Sim = require('../src/sim.js');
const LEVELS = require('../src/levels.js');

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
    openings: o.openings,          // DESIGN.md 13.1; undefined == "no openings"
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
    // The old absolute `pitch` NUMBER is gone; leaving it would let a stale consumer keep the old
    // "a piece SETS the pitch" rule. `pitch` is now the name of the optional FUNCTION form of the
    // vertical half of the transform, which only a piece that is not a plain delta carries.
    for (const t of Pieces.TYPES) {
      assert.notEqual(typeof PIECES[t].pitch, 'number', t + ' still carries an absolute pitch number');
      const hasDelta = Number.isInteger(PIECES[t].dPitch), hasFn = typeof PIECES[t].pitch === 'function';
      assert.ok(hasDelta !== hasFn, t + ' must declare EXACTLY one of dPitch / pitch');
    }
    assert.equal(Pieces.rotate('/'), '\\');
    assert.equal(Pieces.rotate('\\'), '/');
  });
  test('THE PITCH TABLE (spec 12.1 + 14.1), every cell: apply(type, orient, dir, vIn).v', () => {
    // rows are v_in = -1, 0, +1 (DESIGN.md section 12.1; the FLOOR row is section 14.1)
    const TABLE = {
      MIRROR: { '-1': -1, '0': 0, '1': 1 },     // preserved
      WEDGE:  { '-1': 0,  '0': 1, '1': 1 },     // +1, clamped at +1
      DIP:    { '-1': -1, '0': -1, '1': 0 },    // -1, clamped at -1
      FLOOR:  { '-1': 1,  '0': 0, '1': 1 },     // bounce: -1 flips to +1; level and climbing untouched
    };
    // The heading half of the transform, also data: the three upright pieces turn 90 degrees, the
    // flat plate does not turn at all (14.1).
    const TURNS = { MIRROR: true, WEDGE: true, DIP: true, FLOOR: false };
    assert.deepEqual(Object.keys(TABLE).sort(), Pieces.TYPES.slice().sort(), 'the registry grew a type this table does not cover');
    for (const type of Pieces.TYPES) {
      assert.equal(Pieces.turnsBeam(type), TURNS[type], type + ' turnsBeam');
      for (const vIn of [-1, 0, 1]) {
        assert.equal(Pieces.applyPitch(type, vIn), TABLE[type][String(vIn)], `${type} v_in ${vIn}`);
        for (const orient of Pieces.ORIENTS) for (const dir of ['E', 'N', 'W', 'S']) {
          const r = Pieces.apply(type, orient, dir, vIn);
          assert.equal(r.v, TABLE[type][String(vIn)], `${type} ${orient} ${dir} v_in ${vIn}`);
          assert.equal(r.d, TURNS[type] ? TURN[orient][dir] : dir, `${type} ${orient} ${dir}: heading`);
          assert.equal(Pieces.turnDir(type, orient, dir), r.d, `${type} ${orient} ${dir}: turnDir agrees with apply`);
          // `acts` is derived, never declared: it is exactly "the outgoing state differs".
          assert.equal(Pieces.acts(type, orient, dir, vIn), r.d !== dir || r.v !== vIn, `${type} acts ${orient} ${dir} ${vIn}`);
        }
      }
    }
  });
  test('the clamp is central: V_MIN/V_MAX are exported and clampPitch bounds every delta', () => {
    assert.equal(Pieces.V_MIN, -1);
    assert.equal(Pieces.V_MAX, 1);
    assert.deepEqual([-3, -2, -1, 0, 1, 2, 3].map(Pieces.clampPitch), [-1, -1, -1, 0, 1, 1, 1]);
    // A piece is one registry entry: a plain dPitch, or its own pitch(vIn), and the clamp is applied
    // centrally to WHICHEVER it is - an entry cannot escape it by supplying a function.
    for (const t of Pieces.TYPES) {
      const raw = typeof PIECES[t].pitch === 'function' ? PIECES[t].pitch : (v) => v + PIECES[t].dPitch;
      for (const vIn of [-1, 0, 1]) {
        assert.equal(Pieces.applyPitch(t, vIn), Pieces.clampPitch(raw(vIn)), t + ' v_in ' + vIn);
        assert.ok(Pieces.applyPitch(t, vIn) >= Pieces.V_MIN && Pieces.applyPitch(t, vIn) <= Pieces.V_MAX, t + ' escaped the clamp');
      }
    }
    // A hypothetical fifth piece with a wild pitch function is still clamped by applyPitch, because
    // the clamp lives there and not in the entry. Proven by clamping the entry's own raw output.
    assert.equal(Pieces.clampPitch(7), 1);
    assert.equal(Pieces.clampPitch(-7), -1);
  });
  test('TURN_KEEP is the identity table, so "does not turn" is DATA not a branch (14.1)', () => {
    for (const orient of Pieces.ORIENTS) for (const dir of ['E', 'N', 'W', 'S']) {
      assert.equal(Pieces.TURN_KEEP[orient][dir], dir, `TURN_KEEP ${orient} ${dir}`);
    }
    assert.equal(PIECES.FLOOR.turn, Pieces.TURN_KEEP);
    for (const t of ['MIRROR', 'WEDGE', 'DIP']) assert.equal(PIECES[t].turn, TURN, t + ' must use the 90-degree table');
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
      ['allTargetsHit', 'altitudeMarks', 'bounces', 'end', 'endPoint', 'events', 'glides', 'hits', 'overflights', 'underpasses', 'pieceHits', 'segments', 'visited'].sort());
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

// ---------------------------------------------------------------------------------------------
// ARCHES AND WINDOWS (DESIGN.md section 13)
// ---------------------------------------------------------------------------------------------
// The whole rule change is one clause of the blocked test (13.2):
//     BLOCKED when  z' < t[next]  AND  z' is not one of that column's open levels.
// Everything below either exercises that clause or proves it inert when `openings` is absent.

// Shared geometry for the arch / window cases. Row y = 3 only:
//   x=0 emitter column (its height sets the beam's level), x=3 the opened column (t = 3),
//   x=6 the target column (same height as the emitter, so a beam that gets through lands on it).
function pierced({ emitZ = 0, levels = [0], targetZ = null } = {}) {
  const tz = targetZ == null ? emitZ : targetZ;
  const row = ['0', '0', '0', '3', '0', '0', '0'];
  row[0] = String(emitZ);
  row[6] = String(tz);
  return mk({
    terrain: rows('0000000', '0000000', '0000000', row.join(''), '0000000', '0000000', '0000000'),
    emitter: { x: 0, y: 3, dir: 'E' },
    targets: [{ x: 6, y: 3 }],
    openings: levels === null ? undefined : [{ x: 3, y: 3, levels }],
  });
}

describe('openings: the ARCH (13.1) - a tall column open at level 0', () => {
  test('a beam at level 0 passes UNDER the arch and reaches the target', () => {
    const r = trace(pierced({ emitZ: 0, levels: [0] }), []);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    // it really went THROUGH the column, at level 0, while the column stands 3 high
    const L = parseLevel(pierced({ emitZ: 0, levels: [0] }));
    assert.equal(L.t[3][3], 3);
    assert.ok(r.visited.some(v => v.x === 3 && v.y === 3 && v.z === 0), 'the beam entered the arch cell at level 0');
    assert.equal(r.segments.length, 6);
  });

  test('WITHOUT the opening the identical board blocks that same beam - the opening is what does it', () => {
    const r = trace(pierced({ emitZ: 0, levels: null }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 0 });
  });

  test('the same beam at level 1 is BLOCKED by the arch (solid at 1)', () => {
    const r = trace(pierced({ emitZ: 1, levels: [0] }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 1 });
    assert.deepEqual(r.hits, []);
  });

  test('the same beam at level 2 is BLOCKED by the arch (solid at 2)', () => {
    const r = trace(pierced({ emitZ: 2, levels: [0] }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 2 });
  });

  test('a beam at level 3 flies OVER the arch exactly as it flies over any t=3 column', () => {
    const r = trace(pierced({ emitZ: 3, levels: [0] }), []);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.ok(r.visited.some(v => v.x === 3 && v.y === 3 && v.z === 3));
    // and it is over the TOP, not through the hole: t === z there
    const L = parseLevel(pierced({ emitZ: 3, levels: [0] }));
    assert.equal(L.t[3][3], 3);
  });
});

describe('openings: the WINDOW (13.1) - a tall column open at exactly one middle level', () => {
  test('threaded at exactly its open level (1)', () => {
    const r = trace(pierced({ emitZ: 1, levels: [1] }), []);
    assert.equal(r.end, 'target');
    assert.ok(r.visited.some(v => v.x === 3 && v.y === 3 && v.z === 1));
  });
  test('blocked one level BELOW the window (0 is solid)', () => {
    const r = trace(pierced({ emitZ: 0, levels: [1] }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 0 });
  });
  test('blocked one level ABOVE the window (2 is solid)', () => {
    const r = trace(pierced({ emitZ: 2, levels: [1] }), []);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2.5, y: 3, z: 2 });
  });
  test('a window at level 2 behaves the same way one level up', () => {
    assert.equal(trace(pierced({ emitZ: 2, levels: [2] }), []).end, 'target');
    assert.equal(trace(pierced({ emitZ: 1, levels: [2] }), []).end, 'blocked');
    assert.equal(trace(pierced({ emitZ: 0, levels: [2] }), []).end, 'blocked');
    assert.equal(trace(pierced({ emitZ: 3, levels: [2] }), []).end, 'target'); // over the top
  });
  test('a column may be open at more than one level (an arch AND a window in one column)', () => {
    assert.equal(trace(pierced({ emitZ: 0, levels: [0, 2] }), []).end, 'target');
    assert.equal(trace(pierced({ emitZ: 1, levels: [0, 2] }), []).end, 'blocked');
    assert.equal(trace(pierced({ emitZ: 2, levels: [0, 2] }), []).end, 'target');
    assert.equal(parseLevel(pierced({ emitZ: 0, levels: [2, 0] })).openings[0].levels.join(''), '02',
      'levels are normalised into ascending order');
  });
});

describe('openings: a CLIMBING beam must arrive at the window\'s exact height', () => {
  // Emitter (2,0) fires N at level 0 up the clear column x = 2. The player's piece at (2,2) turns it
  // east; a MIRROR leaves it level (z stays 0) and a WEDGE starts it climbing (spec 12).
  //   window column (4,2): t = 3      target tower (5,2): t = 3
  //   level route:    (3,2) z=0 -> (4,2) at z=0
  //   climbing route: (3,2) z=1 -> (4,2) at z=2 -> (5,2) at z=3 = the tower top
  const climb = (levels) => mk({
    terrain: rows('0000000', '0000000', '0000330', '0000000', '0000000', '0000000', '0000000'),
    emitter: { x: 2, y: 0, dir: 'N' },
    targets: [{ x: 5, y: 2 }],
    openings: [{ x: 4, y: 2, levels }],
  });

  test('window open at 2: the CLIMBING beam threads it and lights the tower target', () => {
    const r = trace(climb([2]), [W(2, 2, '/')]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.ok(r.visited.some(v => v.x === 4 && v.y === 2 && v.z === 2), 'threaded at level 2');
    assert.deepEqual(r.endPoint, { x: 5, y: 2, z: 3 });
  });

  test('window open at 2: the LEVEL beam arrives at 0 - the wrong height - and is blocked', () => {
    const r = trace(climb([2]), [M(2, 2, '/')]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 3.5, y: 2, z: 0 });
  });

  test('window open at 1: the same climbing beam arrives at 2 - one level too high - and is blocked', () => {
    const r = trace(climb([1]), [W(2, 2, '/')]);
    assert.equal(r.end, 'blocked');
    // the stub stops at the wall face and keeps the level of the cell it is LEAVING (INTERFACES 2);
    // the beam was climbing out of (3,2) at z=1, so it would have ARRIVED at z=2 - one above the window
    assert.deepEqual(r.endPoint, { x: 3.5, y: 2, z: 1 });
    assert.equal(r.segments[r.segments.length - 1].v, 1, 'still climbing when it hit the wall');
    assert.equal(trace(climb([2]), [W(2, 2, '/')]).end, 'target', 'and the same beam threads a window at 2');
  });

  test('window open at 0: the climbing beam is blocked, the level beam goes UNDER (the arch case)', () => {
    assert.equal(trace(climb([0]), [W(2, 2, '/')]).end, 'blocked');
    const under = trace(climb([0]), [M(2, 2, '/')]);
    assert.ok(under.visited.some(v => v.x === 4 && v.y === 2 && v.z === 0), 'passed under at level 0');
    assert.equal(under.end, 'blocked', 'and is then stopped by the t=3 tower it meets at level 0');
    assert.deepEqual(under.endPoint, { x: 4.5, y: 2, z: 0 });
  });
});

describe('openings: the degenerate t = 1 column (level 0 only)', () => {
  // t = 1 open at 0 is the smallest legal opening: the block is hollow all the way through, so a
  // floor beam passes under it and a beam at 1 or above was already flying over it.
  const one = (levels) => mk({
    terrain: rows('0000000', '0000000', '0000000', '0001000', '0000000', '0000000', '0000000'),
    openings: levels === null ? undefined : [{ x: 3, y: 3, levels }],
  });
  test('a level-0 beam passes under a t=1 arch that would otherwise block it', () => {
    assert.equal(trace(one(null), []).end, 'blocked');
    const r = trace(one([0]), []);
    assert.equal(r.end, 'target');
    assert.ok(r.visited.some(v => v.x === 3 && v.y === 3 && v.z === 0));
  });
  test('level 1 is NOT an opening on a t=1 column: it is the column top, and parseLevel rejects it', () => {
    assert.throws(() => parseLevel(one([1])), /openings\[0\] levels\[0\] is 1, which is not strictly below the height t=1/);
  });
  test('a piece still sits on top of the hollow column and acts on a level-1 beam', () => {
    const lvl = mk({
      terrain: rows('0000000', '0000000', '0000000', '1001000', '0000000', '0000000', '0000000'),
      openings: [{ x: 3, y: 3, levels: [0] }],
      targets: [{ x: 3, y: 6 }],
    });
    // emitter on the t=1 ridge at (0,3) fires east at z=1 and meets the piece on the column top
    const r = trace(lvl, [M(3, 3, '/')]);
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'MIRROR', orient: '/', fixed: false }]);
    assert.equal(r.end, 'lost-edge'); // (3,6) is on t=0, so the z=1 beam flies over the orb
    assert.deepEqual(r.hits, []);
  });
});

describe('openings: an opening never makes a column placeable at another level', () => {
  // Placement is per CELL and a piece always sits on the column top at `t`; every open level is
  // strictly below `t`, so a piece can never be inside an opening (DESIGN.md 13.2, last sentence).
  const lvl = () => mk({
    terrain: rows('0000000', '0000000', '0000000', '0003000', '0000000', '0000000', '0000000'),
    openings: [{ x: 3, y: 3, levels: [0] }],
  });

  test('canPlace is unchanged: the arch column is placeable (on its TOP) exactly like any other cell', () => {
    assert.equal(canPlace(lvl(), [], 3, 3), true);
    assert.equal(canPlace(lvl(), [M(3, 3)], 3, 3), false);
    assert.equal(canPlace(lvl(), [], 0, 3), false, 'still not on the emitter');
    assert.equal(canPlace(lvl(), [], 6, 3), false, 'still not on a target');
  });

  test('a piece on the arch top does NOT act on the beam threading the opening below it', () => {
    const r = trace(lvl(), [M(3, 3, '/')]);
    assert.equal(r.end, 'target', 'the beam went under the piece and on to the orb');
    assert.deepEqual(r.pieceHits, [], 'the piece did not act');
    assert.deepEqual(r.overflights, [], 'and it was not flown OVER either');
    assert.deepEqual(r.underpasses, [{ x: 3, y: 3 }], 'it was passed UNDER - a distinct event');
    assert.deepEqual(r.events.filter(e => e.kind === 'underpass'),
      [{ kind: 'underpass', step: 2, x: 3, y: 3, z: 0, type: 'MIRROR', orient: '/', fixed: false }]);
  });

  test('the same piece DOES act when the beam arrives at the column top', () => {
    // emitter raised onto a t=3 ridge, so the beam meets the piece at level 3
    const high = mk({
      terrain: rows('0000000', '0000000', '0000000', '3003000', '0000000', '0000000', '0000000'),
      openings: [{ x: 3, y: 3, levels: [0] }],
      targets: [{ x: 3, y: 6 }],
    });
    const r = trace(high, [M(3, 3, '/')]);
    assert.deepEqual(r.pieceHits, [{ x: 3, y: 3, type: 'MIRROR', orient: '/', fixed: false }]);
    assert.deepEqual(r.underpasses, []);
  });

  test('over and under are reported separately, never merged into overflights', () => {
    // t=1 column open at 0 with a piece on top: a z=0 beam goes UNDER, a z=2 beam goes OVER.
    const board = (emitZ) => mk({
      terrain: rows('0000000', '0000000', '0000000', emitZ + '001000', '0000000', '0000000', '0000000'),
      openings: [{ x: 3, y: 3, levels: [0] }],
    });
    const under = trace(board(0), [M(3, 3)]);
    assert.deepEqual(under.underpasses, [{ x: 3, y: 3 }]);
    assert.deepEqual(under.overflights, []);
    const over = trace(board(2), [M(3, 3)]);
    assert.deepEqual(over.overflights, [{ x: 3, y: 3 }]);
    assert.deepEqual(over.underpasses, []);
  });
});

describe('openings: parseLevel validation (13.1)', () => {
  const base = (openings) => mk({
    terrain: rows('0000000', '0000000', '0000000', '0003000', '0020000', '0000000', '0000000'),
    openings,
  });
  test('normalises to a per-column bitmask and keeps a canonical array', () => {
    const L = parseLevel(base([{ x: 3, y: 3, levels: [2, 0] }, { x: 2, y: 4, levels: [1] }]));
    assert.deepEqual(L.openings, [{ x: 3, y: 3, levels: [0, 2] }, { x: 2, y: 4, levels: [1] }]);
    assert.equal(L.openMask[3][3], 0b101);
    assert.equal(L.openMask[4][2], 0b010);
    assert.equal(L.openMask[0][0], 0, 'every other column is 0');
    assert.equal(Sim.isOpen(L, 3, 3, 0), true);
    assert.equal(Sim.isOpen(L, 3, 3, 1), false);
    assert.equal(Sim.isOpen(L, 3, 3, 2), true);
    assert.equal(Sim.isOpen(L, 0, 0, 0), false);
    assert.equal(Sim.isOpen(L, 99, 0, 0), false, 'off-grid is never open');
    assert.equal(Sim.isOpen(L, 3, 3, 4), false, 'off-range level is never open');
  });
  test('absent, null and [] all mean "no openings"', () => {
    for (const v of [undefined, null, []]) {
      const L = parseLevel(base(v));
      assert.deepEqual(L.openings, []);
      assert.ok(L.openMask.every(row => row.every(m => m === 0)));
    }
  });
  test('rejects an OFF-GRID column, naming the field', () => {
    assert.throws(() => parseLevel(base([{ x: 9, y: 3, levels: [0] }])), /openings\[0\] must name an on-grid column/);
    assert.throws(() => parseLevel(base([{ x: 3, y: -1, levels: [0] }])), /openings\[0\] must name an on-grid column/);
    assert.throws(() => parseLevel(base([{ x: 1.5, y: 3, levels: [0] }])), /openings\[0\] must name an on-grid column/);
  });
  test('rejects a NON-INTEGER or out-of-range level', () => {
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [0.5] }])), /openings\[0\] levels\[0\] must be an integer 0\.\.3/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [-1] }])), /openings\[0\] levels\[0\] must be an integer 0\.\.3/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [4] }])), /openings\[0\] levels\[0\] must be an integer 0\.\.3/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: ['0'] }])), /openings\[0\] levels\[0\] must be an integer 0\.\.3/);
  });
  test('rejects a level that is NOT strictly below the column height', () => {
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [3] }])), /not strictly below the height t=3/);
    assert.throws(() => parseLevel(base([{ x: 2, y: 4, levels: [2] }])), /not strictly below the height t=2/);
    assert.throws(() => parseLevel(base([{ x: 0, y: 0, levels: [0] }])), /not strictly below the height t=0/,
      'a floor column has no level to punch');
  });
  test('rejects DUPLICATES - a repeated level, and a column named twice', () => {
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [1, 1] }])), /openings\[0\] repeats level 1/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [0] }, { x: 3, y: 3, levels: [1] }])),
      /openings\[1\] duplicates the column \(3,3\)/);
  });
  test('rejects a malformed container or entry', () => {
    assert.throws(() => parseLevel(base({ x: 3, y: 3, levels: [0] })), /openings must be an array/);
    assert.throws(() => parseLevel(base([null])), /openings\[0\] must be an object/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3 }])), /openings\[0\] levels must be a non-empty array/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: [] }])), /openings\[0\] levels must be a non-empty array/);
    assert.throws(() => parseLevel(base([{ x: 3, y: 3, levels: 1 }])), /openings\[0\] levels must be a non-empty array/);
  });
  test('the normalised openings are a fresh copy: the input level is never mutated or aliased', () => {
    const raw = base([{ x: 3, y: 3, levels: [2, 0] }]);
    const L = parseLevel(raw);
    assert.deepEqual(raw.openings, [{ x: 3, y: 3, levels: [2, 0] }]);
    assert.notEqual(L.openings, raw.openings);
    assert.notEqual(L.openings[0].levels, raw.openings[0].levels);
  });
  test('stepCap is unchanged: an opening does not enlarge the (x,y,z,d,v) state space', () => {
    assert.equal(stepCap(base([{ x: 3, y: 3, levels: [0] }])), stepCap(base()));
  });
});

describe('openings: BACKWARD COMPATIBILITY - a level with no `openings` behaves exactly as before', () => {
  // test/fixtures/pre-openings-traces.json was captured from the engine as it stood BEFORE section 13
  // was implemented, and it is self-contained: every level literal is embedded, so it stays a valid
  // "before" corpus even after src/levels.js is rebuilt. Each case stores the sha256 of
  // JSON.stringify(trace(level, placed)) - the whole result, byte for byte, not a summary.
  //
  // Section 13's only additive field is `underpasses`, and section 14 added `glides` and `bounces`;
  // all three sit between `overflights` and `events`. Deleting them restores the exact pre-change key
  // order, so the digest below compares the legacy result BYTE FOR BYTE, and each one is asserted
  // EMPTY on every case - which is what "no openings, no floor plates, nothing changes" means. The
  // corpus predates both sections, so it contains no opening and no FLOOR piece anywhere.
  const golden = JSON.parse(readFileSync(new URL('./fixtures/pre-openings-traces.json', import.meta.url), 'utf8'));

  test('the corpus is the real one: 26 levels, every terminal kind, hundreds of traces', () => {
    assert.ok(golden.entries.length >= 26, 'levels: ' + golden.entries.length);
    assert.ok(golden.traces >= 250, 'traces: ' + golden.traces);
    const ends = new Set();
    for (const e of golden.entries) for (const c of e.cases) ends.add(c.end);
    for (const k of ['target', 'blocked', 'lost-edge', 'lost-floor', 'lost-sky', 'loop']) {
      assert.ok(ends.has(k), 'the corpus never reaches ' + k);
    }
    assert.ok(golden.entries.every(e => e.level.openings === undefined), 'a corpus level carries openings');
  });

  test('every trace is byte-identical to the pre-openings engine', () => {
    let n = 0;
    for (const e of golden.entries) {
      for (const c of e.cases) {
        const r = trace(e.level, c.placed);
        assert.deepEqual(r.underpasses, [], `${e.name}: an under-pass on a level with no openings`);
        assert.deepEqual(r.glides, [], `${e.name}: a glide on a level with no floor plate`);
        assert.deepEqual(r.bounces, [], `${e.name}: a bounce on a level with no floor plate`);
        delete r.underpasses;
        delete r.glides;
        delete r.bounces;
        assert.equal(createHash('sha256').update(JSON.stringify(r)).digest('hex'), c.sha,
          `${e.name} with ${JSON.stringify(c.placed)}: trace changed (end ${r.end} vs ${c.end})`);
        n++;
      }
    }
    assert.equal(n, golden.traces);
  });

  test('and every corpus level parses to an all-zero openMask and an empty openings list', () => {
    for (const e of golden.entries) {
      const L = parseLevel(e.level);
      assert.deepEqual(L.openings, [], e.name);
      assert.ok(L.openMask.length === L.size.d && L.openMask.every(row => row.length === L.size.w && row.every(m => m === 0)), e.name);
    }
  });

  test('the shipped level set still parses, and any openings it carries are legal', () => {
    for (const raw of LEVELS) {
      const L = parseLevel(raw);
      for (const o of L.openings) {
        assert.ok(o.levels.length > 0 && o.levels.every(z => Number.isInteger(z) && z >= 0 && z < L.t[o.y][o.x]),
          raw.name + ': illegal opening ' + JSON.stringify(o));
      }
    }
  });
});

/* =============================================================================================
 * FLOOR MIRRORS (DESIGN.md section 14)
 * The first piece that does NOT turn the beam. It lies flat in the cell's top surface and acts only
 * on a beam coming DOWN onto it, flipping the pitch and leaving the heading alone.
 * ============================================================================================= */

const F = (x, y, orient = '/') => ({ x, y, type: 'FLOOR', orient });

describe('DESIGN.md 14.1: the FLOOR table, every row, through the ENGINE', () => {
  // One board, three incoming pitches at the same cell. (2,3) is the plate, always on t=0.
  // A DIP at (2,5) drops the beam onto it; nothing there leaves the beam level; a WEDGE lifts it.
  //   x:       0123456
  const board = rows('0000000', '0000000', '0000000', '0000000', '0000000', '2020000', '0000000');
  const lvl = (o = {}) => mk(Object.assign({ terrain: board, emitter: { x: 0, y: 5, dir: 'E' }, targets: [{ x: 6, y: 0 }] }, o));

  test('v = -1 (descending onto it): REFLECT - pitch becomes +1 and the heading is UNCHANGED', () => {
    // DIP at (2,5) turns the beam south and drops it: (2,4) z=1, (2,3) z=0 where the plate waits.
    const r = trace(lvl(), [D(2, 5, '\\'), F(2, 3)]);
    const hit = r.events.find(e => e.kind === 'piece' && e.type === 'FLOOR');
    assert.ok(hit, 'the plate was never met');
    assert.equal(hit.vIn, -1);
    assert.equal(hit.vOut, 1);
    assert.equal(hit.dIn, 'S');
    assert.equal(hit.dOut, 'S', 'a FLOOR must never turn the beam');
    assert.deepEqual(r.bounces, [{ x: 2, y: 3, z: 0 }]);
    assert.deepEqual(r.glides, []);
    // and the beam really does climb away northbound... southbound, rather: same heading, rising
    assert.deepEqual(r.visited.map(v => `${v.x},${v.y},${v.z},${v.d},${v.v}`).slice(2, 6),
      ['2,4,1,S,-1', '2,3,0,S,-1', '2,2,1,S,1', '2,1,2,S,1']);
  });

  test('v = 0 (level): NOTHING - the beam glides over it, and it is not a pieceHit', () => {
    // no DIP: the beam runs east along y=5 at z=2 and meets a plate sitting on t=2 at (3,5)
    const flat = rows('0000000', '0000000', '0000000', '0000000', '0000000', '2002002', '0000000');
    const r = trace(mk({ terrain: flat, emitter: { x: 0, y: 5, dir: 'E' }, targets: [{ x: 6, y: 5 }] }), [F(3, 5)]);
    assert.equal(r.end, 'target', 'the plate must not stop or turn a level beam');
    assert.deepEqual(r.pieceHits, [], 'an inert plate is not a piece hit');
    assert.deepEqual(r.bounces, []);
    assert.deepEqual(r.altitudeMarks, [{ x: 6, y: 5, z: 2 }], 'no pitch change, so no altitude mark but the end');
    assert.deepEqual(r.glides, [{ x: 3, y: 5 }]);
    const g = r.events.find(e => e.kind === 'glide');
    assert.deepEqual({ kind: g.kind, x: g.x, y: g.y, z: g.z, type: g.type, d: g.d, v: g.v },
      { kind: 'glide', x: 3, y: 5, z: 2, type: 'FLOOR', d: 'E', v: 0 });
    assert.deepEqual(r.events.filter(e => e.kind === 'pitch'), []);
  });

  test('v = +1 (climbing away from it): NOTHING - it is behind the beam, not under it', () => {
    // a WEDGE at (1,5) on t=2 starts the climb; the plate at (3,5) sits on t=... the beam is ABOVE
    // it, so put the plate at the exact level the beam is at by raising its column to match.
    // emitter on t=2 fires level east; the WEDGE at (2,5) on t=2 turns it north and starts it
    // climbing; the plate at (2,6) sits on a t=3 column, which is exactly the level the climbing beam
    // arrives at - so it is MET, at its own top, and still does nothing.
    const climb = rows('0000000', '0000000', '0000000', '0000000', '0000000', '2020000', '0030000');
    const r = trace(mk({ terrain: climb, emitter: { x: 0, y: 5, dir: 'E' }, targets: [{ x: 6, y: 5 }] }),
      [W(2, 5, '/'), F(2, 6)]);
    const g = r.events.find(e => e.kind === 'glide');
    assert.ok(g, 'the climbing beam never met the plate');
    assert.equal(g.v, 1, 'it was met while climbing');
    assert.equal(g.z, 3, 'and at the plate column top');
    assert.deepEqual(r.bounces, []);
    assert.equal(r.pieceHits.filter(h => h.type === 'FLOOR').length, 0);
  });

  test('a FLOOR NEVER changes the heading: exhaustive over orientation, heading and pitch', () => {
    for (const orient of Pieces.ORIENTS) for (const dir of ['E', 'N', 'W', 'S']) for (const vIn of [-1, 0, 1]) {
      assert.equal(Pieces.apply('FLOOR', orient, dir, vIn).d, dir, `${orient} ${dir} ${vIn}`);
    }
    assert.equal(Pieces.turnsBeam('FLOOR'), false);
    // and through the engine: no `piece` or `glide` event on a FLOOR ever reports a turn, on any of
    // the boards in this file or in the shipped set.
    const boards = [
      { lvl: lvl(), placed: [D(2, 5, '\\'), F(2, 3)] },
      { lvl: lvl(), placed: [D(2, 5, '\\'), F(2, 4)] },
      { lvl: lvl(), placed: [F(1, 5)] },
      { lvl: lvl(), placed: [W(2, 5, '/'), F(2, 6)] }
    ];
    let met = 0;
    for (const b of boards) {
      for (const e of trace(b.lvl, b.placed).events) {
        if (e.type !== 'FLOOR') continue;
        met++;
        if (e.kind === 'piece') assert.equal(e.dOut, e.dIn, JSON.stringify(e));
      }
    }
    assert.ok(met >= 4, 'the plates were never met: ' + met);
    for (const raw of LEVELS) {
      const sol = raw.solution || [];
      for (const e of trace(raw, sol).events) {
        if (e.kind === 'piece' && e.type === 'FLOOR') assert.equal(e.dOut, e.dIn, raw.name + ' ' + JSON.stringify(e));
      }
    }
  });
});

describe('DESIGN.md 14: floor mirrors on the board', () => {
  test('a plate on RAISED terrain sits at the COLUMN TOP, not at z = 0', () => {
    //             x:       0123456
    const raised = rows('0000000', '0000000', '0000000', '2020000', '0010000', '0000000', '0000000');
    const r = trace(mk({ terrain: raised, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 2, y: 6 }] }),
      [D(2, 3, '/'), F(2, 4)]);
    // the plate's column is t=1, so the falling beam meets it at z=1 and bounces from THERE
    assert.deepEqual(r.bounces, [{ x: 2, y: 4, z: 1 }]);
    assert.deepEqual(r.visited.map(v => v.z), [2, 2, 1, 2, 3]);
    // the identical placement on a t=0 column bounces one level lower, two cells further on
    const flat = rows('0000000', '0000000', '0000000', '2020000', '0000000', '0000000', '0000000');
    const r2 = trace(mk({ terrain: flat, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 2, y: 6 }] }),
      [D(2, 3, '/'), F(2, 5)]);
    assert.deepEqual(r2.bounces, [{ x: 2, y: 5, z: 0 }]);
  });

  test('a plate the beam passes OVER at a higher level is an overflight, and is left alone', () => {
    const over = rows('0000000', '0000000', '0000000', '2000002', '0000000', '0000000', '0000000');
    const r = trace(mk({ terrain: over, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }] }), [F(3, 3)]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.overflights, [{ x: 3, y: 3 }], 'the plate is on t=0 and the beam is at z=2');
    assert.deepEqual(r.glides, [], 'passing OVER a plate is not gliding ALONG it');
    assert.deepEqual(r.bounces, []);
    assert.equal(r.events.filter(e => e.kind === 'overflight').length, 1);
    // and the beam is unchanged: same trace as with nothing placed at all
    const bare = trace(mk({ terrain: over, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 3 }] }), []);
    assert.deepEqual(r.visited, bare.visited);
    assert.deepEqual(r.segments, bare.segments);
  });

  test('the bounce happens even when the cell it climbs into is solid: bounce, then BLOCKED', () => {
    //           x:       0123456
    const wall = rows('0000000', '0000000', '0000000', '2020000', '0000000', '0000000', '0020000');
    const r = trace(mk({ terrain: wall, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 6, y: 6 }] }),
      [D(2, 3, '/'), F(2, 5)]);
    // the plate does its job - the pitch flips - and only THEN does the wall stop the beam
    assert.deepEqual(r.bounces, [{ x: 2, y: 5, z: 0 }]);
    assert.equal(r.end, 'blocked');
    assert.deepEqual(r.endPoint, { x: 2, y: 5.5, z: 0 }, 'the visual stops at the wall face');
    // `visited` records the state on ENTRY, before the plate acts, so the last entry still reads -1;
    // the outgoing pitch is on the piece event, and it is that +1 the wall then stops.
    assert.equal(r.visited[r.visited.length - 1].v, -1);
    assert.equal(r.events.find(e => e.kind === 'bounce').vOut, 1, 'it was climbing when it hit the wall');
    assert.equal(r.segments[r.segments.length - 1].v, 1, 'the stub segment carries the post-bounce pitch');
  });

  test('THE SKIPPING STONE (14.2): DIP, bounce, DIP-DIP, bounce, target', () => {
    // Note the shape the CLAMP of spec 12.2 forces, and it is the real design consequence of the
    // fourth piece: a bounce leaves the beam climbing at +1, and one DIP only LEVELS a climber. So
    // the second trough costs TWO dips - "dip, bounce, dip, bounce" is not spellable in one dip.
    const lvl = {
      name: 'SKIP', par: 0, size: { w: 7, d: 11 },
      terrain: ['0000000', '0000000', '0000000', '0000000', '0000000',
                '2002020', '0000000', '0000000', '0000000', '0002020', '0000000'],
      emitter: { x: 0, y: 5, dir: 'E' }, targets: [{ x: 5, y: 5 }], fixed: [],
      tray: ['DIP', 'FLOOR', 'DIP', 'DIP', 'FLOOR']
    };
    const r = trace(lvl, [D(3, 5, '/'), F(3, 7), D(3, 9, '/'), D(5, 9, '\\'), F(5, 7)]);
    assert.equal(r.end, 'target');
    assert.deepEqual(r.hits, [0]);
    assert.deepEqual(r.bounces, [{ x: 3, y: 7, z: 0 }, { x: 5, y: 7, z: 0 }]);
    // the height profile IS the skip: down to the floor, up, level, down, up onto the plateau
    assert.deepEqual(r.visited.map(v => v.z), [2, 2, 2, 1, 0, 1, 2, 2, 2, 1, 0, 1, 2]);
    // the heading only ever changes at a DIP, never at a plate
    for (const e of r.events) if (e.kind === 'piece') {
      assert.equal(e.dOut === e.dIn, e.type === 'FLOOR', JSON.stringify(e));
    }
  });

  test('an arch, a bounce, and a fly-over in one shot (13 + 14 together)', () => {
    // Level at z=0 UNDER the t=3 arch at (2,4); a WEDGE climbs to z=2; a DIP levels it; a second DIP
    // drops it onto the plate at (6,4); the bounce lifts it OVER the t=1 block at (6,3) and onto the
    // t=2 plateau orb at (6,2).
    const lvl = {
      name: 'ARCH+BOUNCE', par: 0, size: { w: 9, d: 9 },
      terrain: ['000000000', '000000000', '000000200', '000000100', '003000000',
                '000000000', '000020200', '000000000', '000000000'],
      openings: [{ x: 2, y: 4, levels: [0] }],
      emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 6, y: 2 }], fixed: [],
      tray: ['WEDGE', 'DIP', 'DIP', 'FLOOR']
    };
    const placed = [W(4, 4, '/'), D(4, 6, '/'), D(6, 6, '\\'), F(6, 4)];
    const r = trace(lvl, placed);
    assert.equal(r.end, 'target');
    // it really went UNDER the arch: inside the column (z < t) at a level punched out
    const inArch = r.visited.find(v => v.x === 2 && v.y === 4);
    assert.equal(inArch.z, 0);
    assert.equal(Sim.isOpen(lvl, 2, 4, 0), true);
    assert.deepEqual(r.bounces, [{ x: 6, y: 4, z: 0 }]);
    // and after the bounce it flew OVER the t=1 block at (6,3) at z=1
    const overCell = r.visited.find(v => v.x === 6 && v.y === 3);
    assert.equal(overCell.z, 1);
    assert.equal(overCell.v, 1, 'still climbing as it cleared the block');
  });

  test('a plate is placeable like any other piece, and blocks its cell like any other piece', () => {
    const lvl = mk({ tray: ['FLOOR'] });
    assert.equal(canPlace(lvl, [], 3, 3), true);
    assert.equal(canPlace(lvl, [F(3, 3)], 3, 3), false);
    assert.equal(canPlace(lvl, [], 0, 3), false, 'the emitter cell');
    assert.equal(canPlace(lvl, [], 6, 3), false, 'the target cell');
    // on raised terrain too (3.4), where it then only ever meets a beam at that level
    const raised = mk({ terrain: rows('0000000', '0000000', '0000000', '0002000', '0000000', '0000000', '0000000') });
    assert.equal(canPlace(raised, [], 3, 3), true);
  });

  test('a fixed FLOOR parses, traces and reports itself as fixed', () => {
    const raised = rows('0000000', '0000000', '0000000', '2020000', '0000000', '0000000', '0000000');
    const lvl = mk({ terrain: raised, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 2, y: 6 }],
      fixed: [{ x: 2, y: 5, type: 'FLOOR', orient: '/', secret: false }], tray: ['DIP'] });
    const L = parseLevel(lvl);
    assert.deepEqual(L.fixed, [{ x: 2, y: 5, type: 'FLOOR', orient: '/', secret: false }]);
    const r = trace(lvl, [D(2, 3, '/')]);
    assert.deepEqual(r.bounces, [{ x: 2, y: 5, z: 0 }]);
    assert.equal(r.pieceHits.find(h => h.type === 'FLOOR').fixed, true);
  });

  test('both orientations of a FLOOR behave identically - a plate has no handedness', () => {
    const raised = rows('0000000', '0000000', '0000000', '2020000', '0000000', '0000000', '0000000');
    const base = mk({ terrain: raised, emitter: { x: 0, y: 3, dir: 'E' }, targets: [{ x: 2, y: 6 }] });
    const a = trace(base, [D(2, 3, '/'), F(2, 5, '/')]);
    const b = trace(base, [D(2, 3, '/'), F(2, 5, '\\')]);
    assert.deepEqual(a.visited, b.visited);
    assert.deepEqual(a.segments, b.segments);
    assert.deepEqual(a.bounces, b.bounces);
  });
});

describe('DESIGN.md 15.1: the `dark` flag on a level', () => {
  test('absent, null and false all parse to false; true parses to true', () => {
    assert.equal(parseLevel(mk()).dark, false);
    assert.equal(parseLevel(mk({})).dark, false);
    assert.equal(parseLevel(Object.assign(mk(), { dark: null })).dark, false);
    assert.equal(parseLevel(Object.assign(mk(), { dark: false })).dark, false);
    assert.equal(parseLevel(Object.assign(mk(), { dark: true })).dark, true);
  });
  test('anything that is not a boolean THROWS rather than being coerced', () => {
    for (const bad of ['true', 'false', 1, 0, {}, [], 'yes']) {
      assert.throws(() => parseLevel(Object.assign(mk(), { dark: bad })), /dark/, 'dark: ' + JSON.stringify(bad));
    }
  });
  test('it changes NOTHING about the beam: a dark level traces exactly like a lit one', () => {
    const lit = mk({ terrain: rows('0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000') });
    const dark = Object.assign(mk({ terrain: rows('0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000') }), { dark: true });
    assert.deepEqual(trace(dark, [M(2, 3)]), trace(lit, [M(2, 3)]));
  });
  test('the shipped set carries `dark` only on LATE levels, and never on a teaching level', () => {
    const darkAt = LEVELS.map((l, i) => (l.dark ? i + 1 : 0)).filter(Boolean);
    assert.ok(darkAt.length >= 2 && darkAt.length <= 3, 'dark levels: ' + darkAt.join(','));
    for (const n of darkAt) assert.ok(n > LEVELS.length - 4, 'level ' + n + ' is not a late level');
  });
});
