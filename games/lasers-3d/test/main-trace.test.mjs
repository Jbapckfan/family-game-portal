// node:test suite for src/main-trace.js - the reader that turns a TraceResult into what the player hears and what
// the board learns (MOTION-DIRECTION.md section 2, "FIRE as a timed sequence": ONE ordered event cursor per trace).
//
// The point of this file is a single claim: every timed beat of a shot is scheduled from the SIMULATION'S ORDERED
// EVENT STREAM against ONE arc-length table, and that table is the renderer's. If these two ever drift, the target
// chime plays while the beam is somewhere else and a cell lights before or after the head reaches it - both of
// which look like sound bugs and are actually timing bugs.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../src/main-trace.js');
const Sim = require('../src/sim.js');
const LEVELS = require('../src/levels.js');

/* The renderer's own arc length, recomputed here from src/render-beam.js's set(): world distance per segment, a
 * terminal stub climbing half a cell, and a lost-edge run stopping half a cell out. If main-trace and render-beam
 * ever disagree the audio and the picture come apart, so this is deliberately a SECOND implementation rather than
 * a call into the first. */
function rendererSegDist(result) {
  const out = [];
  let cum = 0;
  const segs = result.segments;
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const stub = (s.to.x % 1 !== 0) || (s.to.y % 1 !== 0);
    const toH = stub ? s.from.z + 0.5 * s.v : s.to.z;
    let len = Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y, toH - s.from.z);
    if ((i === segs.length - 1 && result.end === 'lost-edge') || s.terminal === 'lost-edge') len *= 0.5;
    cum = (result.branched ? (s.parent < 0 ? 0 : out[s.parent]) : cum) + len;
    out.push(cum);
  }
  return out;
}

function traceLevel(i, placed) {
  const raw = LEVELS[i];
  const level = Sim.parseLevel(raw);
  return { level, result: Sim.trace(raw, placed || raw.solution || []) };
}

describe('arcLengths: the one table the audio, the fog and the renderer all measure against', () => {
  test('matches render-beam segDist on every shipped level solution', () => {
    let checked = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      const { result } = traceLevel(i);
      const mine = T.arcLengths(result), theirs = rendererSegDist(result);
      assert.equal(mine.length, theirs.length, 'level ' + (i + 1) + ' segment count');
      for (let k = 0; k < mine.length; k++) {
        assert.ok(Math.abs(mine[k] - theirs[k]) < 1e-9,
          'level ' + (i + 1) + ' step ' + k + ': ' + mine[k] + ' vs ' + theirs[k]);
      }
      checked += mine.length;
    }
    assert.ok(checked > 100, 'sampled ' + checked + ' segments');
  });

  test('is monotonic and starts after the first segment, never at zero', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const d = T.arcLengths(traceLevel(i).result);
      assert.ok(d[0] > 0, 'level ' + (i + 1) + ' first arrival is past the emitter');
      for (let k = 1; k < d.length; k++) assert.ok(d[k] >= d[k - 1], 'level ' + (i + 1) + ' step ' + k);
    }
  });

  test('a lost-edge run stops half a cell out, and a terminal stub climbs half a step', () => {
    const straight = { end: 'lost-edge', segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 }] };
    assert.equal(T.arcLengths(straight)[0], 0.5);
    const stub = { end: 'blocked', segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 0.5, y: 0, z: 0 }, d: 'E', v: 1 }] };
    assert.ok(Math.abs(T.arcLengths(stub)[0] - Math.hypot(0.5, 0, 0.5)) < 1e-12);
  });
});

describe('cues: the audio beats land on the visual beats, not on cell positions', () => {
  test('every cue distance is an event step\'s arc distance', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const dist = T.arcLengths(result), cues = T.cues(level, result);
      for (const c of cues) {
        assert.ok(c.dist === 0 || dist.indexOf(c.dist) >= 0,
          'level ' + (i + 1) + ' cue at ' + c.dist + ' is not a traced arrival');
      }
    }
  });

  test('cue distances never run backwards and never pass the drawn route', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const dist = T.arcLengths(result), total = dist[dist.length - 1], cues = T.cues(level, result);
      let last = -1;
      for (const c of cues) {
        assert.ok(c.dist >= last, 'level ' + (i + 1) + ' cue order');
        assert.ok(c.dist <= total + 1e-9, 'level ' + (i + 1) + ' cue past the route');
        last = c.dist;
      }
    }
  });

  test('the opening cue is the emitter\'s own altitude at distance zero', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const first = T.cues(level, result)[0];
      assert.equal(first.dist, 0);
      assert.equal(first.kind, 'level');
      assert.equal(first.z, result.segments[0].from.z);
    }
  });

  test('one \'hit\' per target event, in the trace\'s own order', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const hits = T.cues(level, result).filter((c) => c.kind === 'hit');
      const targetEvents = (result.events || []).filter((e) => e.kind === 'target');
      assert.equal(hits.length, targetEvents.length, 'level ' + (i + 1) + ' hit count');
      const dist = T.arcLengths(result);
      for (let k = 0; k < hits.length; k++) assert.equal(hits[k].dist, dist[targetEvents[k].step]);
    }
  });

  test('a level cue for every altitude the head actually arrives at, and no cue where nothing changes', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const levels = T.cues(level, result).filter((c) => c.kind === 'level');
      let z = result.segments[0].from.z;
      const want = [z];
      for (const e of result.events || []) {
        if (e.kind !== 'enter' || e.z === z) continue;
        z = e.z; want.push(z);
      }
      assert.deepEqual(levels.map((c) => c.z), want, 'level ' + (i + 1) + ' altitude cue sequence');
    }
  });

  /* THE REGRESSION. The old reader asked, for every segment, "does a target sit at this segment's far end and is
   * that target in result.hits?" - a CELL match. A beam that crosses a target's cell at the wrong height early and
   * only lights it later, from another direction, matched on that first crossing and played the chime while the
   * beam was still passing overhead. The event stream says exactly which arrival lit the target, so it cannot. */
  test('a target crossed at the wrong height first and lit later chimes ONLY at the arrival that lit it', () => {
    const result = {
      end: 'target', allTargetsHit: true, hits: [0],
      segments: [
        { from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 },   // step 0: crosses the target cell
        { from: { x: 1, y: 0, z: 0 }, to: { x: 2, y: 0, z: 0 }, d: 'E', v: 0 },   // step 1
        { from: { x: 2, y: 0, z: 0 }, to: { x: 1, y: 0, z: 1 }, d: 'W', v: 1 }    // step 2: arrives and LIGHTS it
      ],
      events: [
        { kind: 'enter', step: 0, x: 1, y: 0, z: 0, d: 'E', v: 0 },
        { kind: 'enter', step: 1, x: 2, y: 0, z: 0, d: 'E', v: 0 },
        { kind: 'enter', step: 2, x: 1, y: 0, z: 1, d: 'W', v: 1 },
        { kind: 'target', step: 2, x: 1, y: 0, z: 1, targetIndex: 0 }
      ]
    };
    const level = { targets: [{ x: 1, y: 0 }], emitter: { x: 0, y: 0 } };
    const dist = T.arcLengths(result);
    const hits = T.cues(level, result).filter((c) => c.kind === 'hit');
    assert.equal(hits.length, 1);
    assert.equal(hits[0].dist, dist[2]);
    assert.notEqual(hits[0].dist, dist[0]);
  });

  test('an overflight, an underpass and a glide are silent by construction', () => {
    const result = {
      end: 'lost-edge', hits: [],
      segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 }],
      events: [
        { kind: 'enter', step: 0, x: 1, y: 0, z: 0 },
        { kind: 'overflight', step: 0, x: 1, y: 0, z: 0, type: 'WEDGE' },
        { kind: 'underpass', step: 0, x: 1, y: 0, z: 0, type: 'DIP' },
        { kind: 'glide', step: 0, x: 1, y: 0, z: 0, type: 'FLOOR' }
      ]
    };
    const cues = T.cues({ targets: [], emitter: { x: 0, y: 0 } }, result);
    assert.deepEqual(cues, [{ dist: 0, kind: 'level', z: 0 }]);
  });

  test('an empty or malformed result produces no cues rather than throwing', () => {
    assert.deepEqual(T.cues(null, null), []);
    assert.deepEqual(T.cues({ targets: [] }, { segments: [] }), []);
    assert.deepEqual(T.cues({ targets: [] }, { segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, v: 0 }],
      events: [{ kind: 'enter', step: 99, x: 9, y: 9, z: 2 }], end: null }), [{ dist: 0, kind: 'level', z: 0 }]);
  });
});

describe('discoveries: the board opens where the head is', () => {
  test('the emitter at zero, then one cell per \'enter\' event at its own arrival distance', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const dist = T.arcLengths(result), got = T.discoveries(level, result);
      const enters = (result.events || []).filter((e) => e.kind === 'enter');
      assert.equal(got.length, enters.length + 1, 'level ' + (i + 1) + ' count');
      assert.deepEqual(got[0], { dist: 0, x: level.emitter.x, y: level.emitter.y });
      for (let k = 0; k < enters.length; k++) {
        assert.equal(got[k + 1].dist, dist[enters[k].step]);
        assert.equal(got[k + 1].x, enters[k].x);
        assert.equal(got[k + 1].y, enters[k].y);
      }
    }
  });

  test('discoveries and cues share the same distances - the sound and the light arrive together', () => {
    for (let i = 0; i < LEVELS.length; i++) {
      const { level, result } = traceLevel(i);
      const dset = T.discoveries(level, result).map((d) => d.dist);
      for (const c of T.cues(level, result)) {
        assert.ok(dset.indexOf(c.dist) >= 0, 'level ' + (i + 1) + ' cue at ' + c.dist + ' has no matching arrival');
      }
    }
  });

  /* Section 8: "A blocked cell has not been entered and remains unknown." The stepper emits no 'enter' for it, so
   * the rule is enforced by the event stream rather than written out a second time in this file. */
  test('a blocked shot never discovers the cell it was stopped by', () => {
    const result = {
      end: 'blocked',
      segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 },
        { from: { x: 1, y: 0, z: 0 }, to: { x: 1.5, y: 0, z: 0 }, d: 'E', v: 0 }],
      events: [{ kind: 'enter', step: 0, x: 1, y: 0, z: 0 }, { kind: 'end', step: 1, x: 1.5, y: 0, z: 0, end: 'blocked' }]
    };
    const got = T.discoveries({ emitter: { x: 0, y: 0 } }, result);
    assert.deepEqual(got.map((c) => c.x + ',' + c.y), ['0,0', '1,0']);
  });
});
