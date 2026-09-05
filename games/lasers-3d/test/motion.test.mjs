// node:test suite for src/motion.js (LaserMotion) and the theme.motion token ledger.
// Proves the registry's guarantees without a browser: a fake monotonic clock and fake one-shot timers stand in
// for performance.now() and setTimeout, so every assertion is deterministic.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LaserMotion = require('../src/motion.js');
const theme = require('../src/theme.js');

/* ------------------------------------------------------------------ harness */
function makeHost() {
  const host = {
    t: 0,
    dirtyCount: 0,
    timers: [],        // { id, fn, ms, at, cancelled }
    nextTimer: 1
  };
  host.motion = LaserMotion.create({
    theme,
    now: () => host.t,
    dirty: () => { host.dirtyCount++; },
    setTimeout: (fn, ms) => {
      const rec = { id: host.nextTimer++, fn, ms, at: host.t + ms, cancelled: false };
      host.timers.push(rec);
      return rec.id;
    },
    clearTimeout: (id) => {
      const rec = host.timers.find((r) => r.id === id);
      if (rec) rec.cancelled = true;
    }
  });
  // Advance the fake clock to `t`, firing any timer due, then tick the registry once (what main.js step() does).
  host.advance = (t) => {
    host.t = t;
    for (const rec of host.timers.slice()) {
      if (!rec.cancelled && rec.at <= t && !rec.fired) { rec.fired = true; rec.fn(); }
    }
    return host.motion.tick(t);
  };
  host.pending = () => host.timers.filter((r) => !r.cancelled && !r.fired);
  return host;
}

// A spy animation: records every update, its final state, and whether cancel ran.
function spy(extra) {
  const rec = { updates: [], finals: 0, cancels: 0, fallbacks: 0, applied: null, done: [] };
  const spec = Object.assign({
    durationMs: 100,
    update(eased, ctx) { rec.updates.push({ eased, progress: ctx.progress, value: ctx.value, from: ctx.from }); rec.applied = ctx.value; },
    final() { rec.finals++; rec.applied = 'FINAL'; },
    cancel() { rec.cancels++; },
    onDone(reason) { rec.done.push(reason); }
  }, extra || {});
  return { rec, spec };
}

/* ------------------------------------------------------------------ surface */
describe('LaserMotion surface', () => {
  test('exposes create and __version, and the registry API four implementers build on', () => {
    assert.equal(LaserMotion.__version, 1);
    assert.equal(typeof LaserMotion.create, 'function');
    const m = makeHost().motion;
    for (const k of ['run', 'hold', 'tick', 'needsFrame', 'isLive', 'busy', 'count', 'get', 'has',
      'cancel', 'cancelRole', 'cancelAll', 'settle', 'settleAll',
      'token', 'newAttempt', 'newTrace', 'isCurrent', 'guard',
      'setReducedMotion', 'isReducedMotion', 'scaleMs', 'holdMs',
      'documentHidden', 'documentVisible', 'ease', 'requestRender', 'dispose']) {
      assert.equal(typeof m[k], 'function', k);
    }
    assert.equal(m.tokens, theme.motion);
  });

  test('create requires a theme carrying the ledger', () => {
    assert.throws(() => LaserMotion.create({ theme: {} }), /theme\.motion/);
  });

  test('run rejects a spec that cannot end or cannot settle', () => {
    const m = makeHost().motion;
    assert.throws(() => m.run({ durationMs: 10, final() {} }), /update is required/);
    assert.throws(() => m.run({ durationMs: 10, update() {} }), /final is required/);
    assert.throws(() => m.run({ update() {}, final() {} }), /durationMs or spec\.endMs/);
  });
});

/* ------------------------------------------------------------------ 1..3: runs live, applies final, goes quiet */
describe('an animation runs, applies its exact final state, and stops', () => {
  test('reports live while running and drives update from elapsed time', () => {
    const h = makeHost();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100, from: 0, to: 10, ease: theme.motion.easing.linear });
    h.motion.run(spec);

    assert.equal(h.motion.isLive(), true, 'live as soon as it is registered');
    assert.equal(h.motion.needsFrame(), true, 'a webgl animation asks the loop for frames');
    assert.equal(h.dirtyCount, 1, 'starting marks the scene dirty exactly once');

    h.advance(25);
    h.advance(50);
    assert.deepEqual(rec.updates.map((u) => u.progress), [0.25, 0.5]);
    assert.deepEqual(rec.updates.map((u) => u.value), [2.5, 5]);
    assert.equal(rec.finals, 0);
    assert.equal(h.motion.needsFrame(), true);
  });

  test('applies its exact final state once, then reports not-live and asks for no more frames', () => {
    const h = makeHost();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100, from: 0, to: 10 });
    h.motion.run(spec);
    h.advance(50);
    h.dirtyCount = 0;

    const stillLive = h.advance(100);

    assert.equal(rec.finals, 1, 'final() applied exactly once');
    assert.equal(rec.applied, 'FINAL', 'the resting state is final(), never the last update()');
    assert.ok(rec.updates.every((u) => u.progress < 1), 'update() is never called with the terminal value');
    assert.equal(h.dirtyCount, 1, 'completion causes exactly one last render');
    assert.equal(stillLive, false, 'tick() reports the registry has gone quiet');
    assert.equal(h.motion.isLive(), false);
    assert.equal(h.motion.needsFrame(), false, 'RETURNS TO ZERO FRAMES');
    assert.equal(h.motion.busy(), false);
    assert.deepEqual(h.motion.count(), { animations: 0, webgl: 0, dom: 0, holds: 0 });
    assert.deepEqual(rec.done, ['complete']);

    h.advance(200);
    assert.equal(rec.finals, 1, 'a completed animation is never ticked again');
    assert.equal(h.dirtyCount, 1);
  });

  test('a delayed animation displays nothing until its start time, and still holds the loop open', () => {
    const h = makeHost();
    const { rec, spec } = spy({ startMs: 0, delayMs: theme.motion.target.ringDelayMs, durationMs: 420 });
    h.motion.run(spec);
    h.advance(40);
    assert.equal(rec.updates.length, 0, 'nothing drawn during the stagger delay');
    assert.equal(h.motion.needsFrame(), true, 'but the frame loop stays alive so it can start');
    h.advance(80 + 210);
    assert.equal(rec.updates.length, 1);
    assert.equal(rec.updates[0].progress, 0.5);
  });

  test("a 'dom' animation (weather) is tracked but never asks for a WebGL frame", () => {
    const h = makeHost();
    const { rec, spec } = spy({ surface: 'dom', role: 'decorative', startMs: 0, durationMs: theme.motion.weather.ms });
    h.motion.run(spec);
    assert.equal(h.dirtyCount, 0, 'CSS weather must not schedule application frames');
    assert.equal(h.motion.needsFrame(), false);
    assert.equal(h.motion.isLive(), true);
    h.advance(theme.motion.weather.ms);
    assert.equal(rec.finals, 1);
    assert.equal(h.dirtyCount, 0);
    assert.equal(h.motion.isLive(), false);
  });
});

/* ------------------------------------------------------------------ 4: supersession */
describe('supersession starts from the currently displayed pose', () => {
  test('a new edit replaces the running edit and continues from what the eye last saw', () => {
    const h = makeHost();
    const first = spy({ key: 'edit', startMs: 0, durationMs: 100, from: 0, to: 10 });
    h.motion.run(first.spec);
    h.advance(50);
    assert.equal(first.rec.applied, 5, 'displayed pose at the moment of the new edit');

    const second = spy({ key: 'edit', startMs: 50, durationMs: 100, to: 20 });
    h.motion.run(second.spec);

    assert.deepEqual(first.rec.done, ['superseded']);
    assert.equal(first.rec.finals, 0, 'a superseded animation does NOT apply its final state');
    assert.equal(first.rec.cancels, 0, 'nor its cancel action - the newcomer inherits the same visual');
    assert.equal(h.motion.count().animations, 1, 'exactly one animation owns the key');

    h.advance(50);
    assert.equal(second.rec.updates[0].from, 5, 'from == the displayed pose, not the old start');
    assert.equal(second.rec.updates[0].value, 5, 'no snap: it resumes exactly where it was');
    h.advance(100);
    assert.equal(second.rec.updates.at(-1).value, 12.5);
  });

  test('from may be a function of the displayed pose', () => {
    const h = makeHost();
    h.motion.run(spy({ key: 'edit', startMs: 0, durationMs: 100, from: 0, to: 8 }).spec);
    h.advance(25);
    let seen = 'unset';
    const next = spy({ key: 'edit', startMs: 25, durationMs: 100, to: 0, from: (pose) => { seen = pose; return pose; } });
    h.motion.run(next.spec);
    assert.equal(seen, 2);
    h.advance(25);
    assert.equal(next.rec.updates[0].from, 2);
  });

  test('get/has track the key and release it on completion', () => {
    const h = makeHost();
    const handle = h.motion.run(spy({ key: 'retrace', startMs: 0, durationMs: 140 }).spec);
    assert.equal(h.motion.has('retrace'), true);
    assert.equal(h.motion.get('retrace').id, handle.id);
    h.advance(140);
    assert.equal(h.motion.has('retrace'), false);
    assert.equal(handle.isLive(), false);
  });
});

/* ------------------------------------------------------------------ 5: cancellation */
describe('cancellation abandons the effect without applying it', () => {
  test('a cancelled animation runs its cancel action and does not apply its final state', () => {
    const h = makeHost();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100 });
    const handle = h.motion.run(spec);
    h.advance(50);
    h.dirtyCount = 0;

    assert.equal(handle.cancel(), true);

    assert.equal(rec.cancels, 1, 'the cancel action ran');
    assert.equal(rec.finals, 0, 'the final state was NOT applied');
    assert.deepEqual(rec.done, ['cancelled']);
    assert.equal(h.dirtyCount, 1, 'cancelling still causes one render of the state it left behind');
    assert.equal(h.motion.needsFrame(), false);
    assert.equal(handle.cancel(), false, 'cancelling twice is a no-op');
    assert.equal(rec.cancels, 1);
  });

  test('cancelAll() clears every animation and hold - RESET and level navigation', () => {
    const h = makeHost();
    const a = spy({ startMs: 0, durationMs: 100 });
    const b = spy({ startMs: 0, durationMs: 100, role: 'decorative' });
    h.motion.run(a.spec); h.motion.run(b.spec);
    let held = false;
    h.motion.hold(theme.motion.failure.quietMs, () => { held = true; });

    assert.equal(h.motion.cancelAll(), 3);

    assert.equal(a.rec.cancels, 1);
    assert.equal(b.rec.cancels, 1);
    assert.equal(a.rec.finals + b.rec.finals, 0);
    assert.equal(held, false, 'a pending hold never fires after cancelAll');
    assert.equal(h.motion.busy(), false);
    assert.equal(h.motion.needsFrame(), false);
    assert.equal(h.pending().length, 0, 'its one-shot timer was cleared, not left running');
  });

  test('cancelRole cuts only decorative work (the "what to cut first" order)', () => {
    const h = makeHost();
    const keep = spy({ startMs: 0, durationMs: 100 });
    const cut = spy({ startMs: 0, durationMs: 100, role: 'decorative' });
    h.motion.run(keep.spec); h.motion.run(cut.spec);
    assert.equal(h.motion.cancelRole('decorative'), 1);
    assert.equal(cut.rec.cancels, 1);
    assert.equal(keep.rec.cancels, 0);
    assert.equal(h.motion.isLive(), true);
  });
});

/* ------------------------------------------------------------------ 6: late callbacks */
describe('a late callback from a superseded attempt cannot mutate state', () => {
  test('guard() makes a stale callback a no-op', () => {
    const h = makeHost();
    let state = 'clean';
    const stamp = h.motion.token();
    const late = h.motion.guard(stamp, () => { state = 'MUTATED'; });

    late();
    assert.equal(state, 'MUTATED', 'it fires normally while its stamp is current');
    state = 'clean';

    h.motion.newAttempt();                       // RESET: a whole new attempt
    late();
    assert.equal(state, 'clean', 'the superseded shot could not touch current state');
    assert.equal(h.motion.isCurrent(stamp), false);
    assert.equal(h.motion.isCurrent(h.motion.token()), true);
  });

  test('a new attempt invalidates the trace stamp too', () => {
    const h = makeHost();
    const stamp = h.motion.token();
    h.motion.newAttempt();
    assert.equal(h.motion.isCurrent({ trace: stamp.trace }), false);
  });

  test('a stamped animation from a superseded shot is dropped at the next tick', () => {
    const h = makeHost();
    const stamp = h.motion.token();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100, attempt: stamp.attempt, trace: stamp.trace });
    h.motion.run(spec);
    h.advance(25);
    assert.equal(rec.updates.length, 1);

    h.motion.newTrace();                          // an explicit FIRE, or a live retrace
    h.advance(50);

    assert.equal(rec.cancels, 1, 'released');
    assert.equal(rec.finals, 0, 'a superseded shot may not write the final state');
    assert.equal(rec.updates.length, 1, 'and drew nothing more');
    assert.equal(h.motion.needsFrame(), false);
  });

  test('run() and hold() refuse a stamp that is already stale', () => {
    const h = makeHost();
    const stamp = h.motion.token();
    h.motion.newAttempt();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100, attempt: stamp.attempt });
    const handle = h.motion.run(spec);
    assert.equal(handle.isLive(), false);
    assert.equal(rec.cancels, 1, 'it is released immediately, never displayed');
    assert.equal(h.motion.isLive(), false);

    let ran = false;
    h.motion.hold(10, () => { ran = true; }, { attempt: stamp.attempt });
    assert.equal(h.motion.busy(), false);
    assert.equal(ran, false);
  });

  test('a hold whose stamp goes stale while waiting never runs its continuation', () => {
    const h = makeHost();
    const stamp = h.motion.token();
    let ran = false;
    h.motion.hold(theme.camera.revealChoreography.holdAtTiltMs, () => { ran = true; },
      { attempt: stamp.attempt, trace: stamp.trace });
    h.motion.newAttempt();
    h.advance(2000);
    assert.equal(ran, false);
    assert.equal(h.motion.busy(), false);
  });
});

/* ------------------------------------------------------------------ 7: holds do not render */
describe('one-shot holds are stationary choreography, not animation', () => {
  test('a hold does not request frames and does not mark the scene dirty', () => {
    const h = makeHost();
    let ran = false;
    const handle = h.motion.hold(theme.motion.failure.quietMs, () => { ran = true; });

    assert.equal(h.dirtyCount, 0, 'A HOLD DOES NOT RENDER');
    assert.equal(h.motion.needsFrame(), false, 'and never schedules a frame');
    assert.equal(h.motion.isLive(), false, 'a hold is not a live animation');
    assert.equal(h.motion.busy(), true, 'but it is outstanding work');
    assert.equal(handle.isLive(), true);
    assert.equal(h.pending().length, 1, 'exactly one one-shot timer - no polling');
    assert.deepEqual(h.pending().map((r) => r.ms), [theme.motion.failure.quietMs]);

    h.advance(theme.motion.failure.quietMs);
    assert.equal(ran, true);
    assert.equal(h.motion.busy(), false);
    assert.equal(handle.isLive(), false);
    assert.equal(h.dirtyCount, 0, 'the hold itself still rendered nothing');
    assert.equal(h.pending().length, 0);
  });

  test('ticking during a hold reports nothing live', () => {
    const h = makeHost();
    h.motion.hold(240, () => {});
    assert.equal(h.motion.tick(100), false);
    assert.equal(h.dirtyCount, 0);
  });

  test('a keyed hold supersedes the previous one', () => {
    const h = makeHost();
    let first = 0, second = 0;
    h.motion.hold(200, () => { first++; }, { key: 'weather' });
    h.motion.hold(200, () => { second++; }, { key: 'weather' });
    assert.equal(h.motion.busy(), true);
    h.advance(400);
    assert.equal(first, 0, 'coalesced: bursts are never enqueued');
    assert.equal(second, 1);
  });
});

/* ------------------------------------------------------------------ 8: document hidden */
describe('document hidden settles, commits, and does not replay', () => {
  test('cancels decoration, settles presentation, commits the result, renders once on return', () => {
    const h = makeHost();
    const show = spy({ startMs: 0, durationMs: 400 });                        // presentation
    const sparkle = spy({ startMs: 0, durationMs: 180, role: 'decorative' }); // decoration
    h.motion.run(show.spec); h.motion.run(sparkle.spec);
    let chained = false;
    h.motion.hold(280, () => { chained = true; });
    h.advance(100);
    h.dirtyCount = 0;

    let committed = 0;
    h.motion.documentHidden({ commit: () => { committed++; } });

    assert.equal(sparkle.rec.cancels, 1, 'decorative effects are cancelled');
    assert.equal(sparkle.rec.finals, 0);
    assert.equal(show.rec.finals, 1, 'presentations settle to their exact final state');
    assert.equal(show.rec.cancels, 0);
    assert.equal(chained, true, 'a waiting choreography step is settled, not stranded');
    assert.equal(committed, 1, 'the authoritative gameplay result is committed');
    assert.equal(h.motion.busy(), false);
    assert.equal(h.motion.needsFrame(), false);

    const renders = h.dirtyCount;
    assert.equal(h.motion.documentVisible(), true);
    assert.equal(h.dirtyCount, renders + 1, 'exactly one render of the settled state on return');
    assert.equal(h.motion.documentVisible(), false, 'and nothing is replayed');
    assert.equal(h.dirtyCount, renders + 1);
  });

  test('settleAll drains a chained choreography and always ends quiet', () => {
    const h = makeHost();
    const tail = spy({ startMs: 0, durationMs: 650 });
    h.motion.hold(280, () => {
      h.motion.hold(1300, () => { h.motion.run(tail.spec); });
    });
    h.motion.settleAll();
    assert.equal(tail.rec.finals, 1, 'the whole chain reached its end state');
    assert.equal(h.motion.busy(), false);
    assert.equal(h.motion.needsFrame(), false);
  });
});

/* ------------------------------------------------------------------ 9: reduced motion */
describe('reduced motion turning on mid-animation', () => {
  test('settles decorative effects immediately using each item fallback', () => {
    const h = makeHost();
    const decorative = spy({
      startMs: 0, durationMs: theme.motion.scatter.ms, role: 'decorative',
      fallback() { decorative.rec.fallbacks++; decorative.rec.applied = 'FALLBACK'; }
    });
    const presentation = spy({ startMs: 0, durationMs: theme.camera.motion.flatToTiltMs });
    h.motion.run(decorative.spec); h.motion.run(presentation.spec);
    h.advance(50);

    h.motion.setReducedMotion(true);

    assert.equal(decorative.rec.fallbacks, 1, 'the item-specific fallback was applied');
    assert.equal(decorative.rec.finals, 0, 'the fallback replaces final(), it does not follow it');
    assert.equal(decorative.rec.applied, 'FALLBACK');
    assert.equal(presentation.rec.finals, 0, 'a presentation keeps the timing it was started with');
    assert.equal(h.motion.isLive(), true);
    assert.equal(h.motion.isReducedMotion(), true);
  });

  test('a decorative effect with no fallback settles to its final state', () => {
    const h = makeHost();
    const d = spy({ startMs: 0, durationMs: 180, role: 'decorative' });
    h.motion.run(d.spec);
    h.motion.setReducedMotion(true);
    assert.equal(d.rec.finals, 1);
    assert.equal(h.motion.isLive(), false);
  });

  test('scaleMs never applies the global duration scale twice', () => {
    const h = makeHost();
    const m = h.motion;
    const R = theme.motion.reduced;
    assert.equal(m.scaleMs(theme.motion.fire.chargeMs), theme.motion.fire.chargeMs, 'unscaled while motion is on');

    m.setReducedMotion(true);
    assert.equal(m.scaleMs(140), Math.round(140 * theme.reducedMotion.durationScale),
      'a plain duration is scaled once');
    assert.equal(m.scaleMs(theme.motion.fire.chargeMs, R.chargeMs), R.chargeMs,
      'an item-specific reduced value is returned verbatim, never re-scaled');
    assert.equal(m.scaleMs(m.scaleMs(theme.motion.fire.chargeMs, R.chargeMs), R.chargeMs), R.chargeMs,
      'and stays verbatim however many times it is passed through');
    assert.equal(m.holdMs(theme.camera.revealChoreography.holdAtTiltMs), theme.reducedMotion.maxHoldMs,
      'stationary holds are capped, not scaled');
  });

  test('turning reduced motion off again settles nothing', () => {
    const h = makeHost();
    const d = spy({ startMs: 0, durationMs: 180, role: 'decorative' });
    h.motion.run(d.spec);
    h.motion.setReducedMotion(false);
    assert.equal(d.rec.finals, 0);
    assert.equal(h.motion.isLive(), true);
  });
});

/* ------------------------------------------------------------------ dispose */
describe('dispose', () => {
  test('cancels everything and refuses further work', () => {
    const h = makeHost();
    const a = spy({ startMs: 0, durationMs: 100 });
    h.motion.run(a.spec);
    h.motion.dispose();
    assert.equal(a.rec.cancels, 1);
    assert.equal(h.motion.needsFrame(), false);
    assert.equal(h.motion.run(spy().spec).isLive(), false);
    assert.equal(h.motion.tick(500), false);
  });
});

/* ------------------------------------------------------------------ theme.motion: the token ledger */
describe('theme.motion transcribes the MOTION-DIRECTION.md token ledger', () => {
  const leaves = (o, p = '', out = []) => {
    for (const k of Object.keys(o)) {
      const v = o[k], q = p ? `${p}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, q, out); else out.push(q);
    }
    return out;
  };

  test('is exported as pure data (no functions anywhere in the tree)', () => {
    const walk = (o, path = 'm') => {
      for (const k of Object.keys(o)) {
        const v = o[k];
        assert.notEqual(typeof v, 'function', `${path}.${k} must be pure data`);
        if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, `${path}.${k}`);
      }
    };
    walk(theme.motion);
    assert.equal(leaves(theme.motion).length, 126);
  });

  test('shared tokens', () => {
    const m = theme.motion;
    assert.deepEqual(m.easing, { linear: 'linear', smooth: 'smoothstep', enter: 'easeOutCubic', exit: 'easeInCubic',
      turn: 'easeInOutCubic', camera: theme.camera.motion.easing, pulse: 'bell' });
    assert.deepEqual(m.reduced, { fadeMs: 120, contactHoldMs: 120, chargeMs: 60, releaseMs: 60 });
    assert.deepEqual(m.budget, { targetFps: 60, floorFps: 30, newDrawCallsMax: 4, transientSpritesMax: 32,
      animatedFogCellsMax: 24, cpuUpdateMs: 1, sampleFrames: 30, degradeMedianMs: 18, restoreWithinAttempt: false });
  });

  test('beam, contact, scatter, fire and target tokens', () => {
    const m = theme.motion;
    assert.deepEqual(m.beam, { headCells: 0.28, headGain: 0.45, packetIntervalMs: 240, packetMs: 480,
      packetGain: 0.32, peakAt: { level: 0.50, climb: 0.78, descend: 0.22 }, pitchBlendCells: 0.10, settleMs: 160 });
    assert.deepEqual(m.contact, { diameterCells: 0.12, peakOpacity: 0.60, attackMs: 36, decayMs: 144,
      flatColor: theme.palette.commonFlatPiece,
      bounceDot: { diameterCells: 0.10, opacity: 0.65, color: 'arrivalBeamColor' } });
    assert.deepEqual(m.scatter, { anglesDeg: [-35, 35], lengthCells: 0.06, widthCells: 0.012,
      distanceCells: 0.18, ms: 180, opacity: 0.45 });
    assert.deepEqual(m.fire, { chargeMs: 180, chargeEmissiveMultiplier: 1.35, chargeHaloScale: 0.84,
      chargeHaloOpacity: 0.34, releaseMs: 120, badgeFadeMs: 80, lostMarkerFadeMs: 120 });
    assert.deepEqual(m.target, { ringDelayMs: 80, ringOpacity: 0.32, ringStrokeCells: 0.018 });
  });

  test('reveal, weather and placement tokens', () => {
    const m = theme.motion;
    assert.deepEqual(m.reveal, { prepareMs: 96, cameraEasing: 'easeInOutCubic', beamGlowMinimum: 0.82,
      eligibilityFadeMs: 160, sideEasing: 'smoothstep', teachingOutlineOpacity: 0.55, teachingOutlineWidthCells: 0.018 });
    assert.deepEqual(m.weather, { enabled: true, reducedEnabled: false, color: theme.palette.metalLight, railPx: 6,
      fleckSizePx: [2, 1], startX: [0.16, 0.78], delaysMs: [0, 320], travelXPx: 18, ms: 2400,
      opacityStops: [0, 0.16, 0.16, 0], progressStops: [0, 0.20, 0.70, 1], iterations: 1 });
    assert.deepEqual(m.placement, { pickupMs: 100, liftPx: 6, pickupScale: 1.04, ghostOpacity: 0.28,
      ghostFadeMs: 80, overlayColor: theme.palette.commonFlatPiece, dropMs: 140, seatOpacity: 0.24, seatMs: 180,
      rotateDeg: 90, rotateMs: 120, floorAcknowledgeMs: 120, removeMs: 100, removeScale: 0.92, cancelMs: 140,
      invalidOffsets: [0, 1, -1, 1, 0], invalidProgress: [0, 0.25, 0.50, 0.75, 1] });
    // The illegal-card shake runs the five keyframes over the two existing 70 ms beats (section 5).
    assert.equal(m.placement.invalidOffsets.length, m.placement.invalidProgress.length);
    assert.equal(theme.ui.button.invalid.shakes * theme.ui.button.invalid.shakeMs, 140);
  });

  test('win, failure, fog, policy and quality tokens', () => {
    const m = theme.motion;
    assert.deepEqual(m.win, { beamSealMs: 480, beamSealGain: 0.18, modalDelayMs: 520, starMs: 320,
      starProgress: [0, 0.55, 1], starFadeMs: 120, ringMs: 540, ringDiameterFactors: [0.25, 1.25],
      ringStrokePx: 1, ringOpacity: 0.18, ringColor: theme.palette.uiAccent });
    assert.deepEqual(m.failure, { blockedAnglesDeg: [-35, 0, 35], readoutFadeMs: 120, quietMs: 240, targetUnlightMs: 120 });
    assert.deepEqual(m.fog, { featherCells: 0.08, rimWidthCells: 0.04, rimOpacity: 0.12,
      rimColor: theme.palette.uiAccent, easing: 'smoothstep', shadowCommit: 'after-trace-reveals-settle' });
    assert.deepEqual(m.quality, { cutOrder: ['weather', 'scatter-and-target-streaks',
      'decorative-rings-and-fog-rim', 'trailing-beam-pulses', 'pixel-ratio', 'reduced-presentation'],
      degradedDprMax: 1.5, floorDprMax: 1.0 });
    // Section 9: every stationary-policy flag is false, and stays false.
    assert.equal(Object.keys(m.policy).length, 12);
    for (const k of Object.keys(m.policy)) assert.equal(m.policy[k], false, k);
  });

  test('reused existing tokens are references, not copies', () => {
    assert.equal(theme.motion.easing.camera, theme.camera.motion.easing);
    assert.equal(theme.motion.contact.flatColor, theme.palette.commonFlatPiece);
    assert.equal(theme.motion.placement.overlayColor, theme.palette.commonFlatPiece);
    assert.equal(theme.motion.weather.color, theme.palette.metalLight);
    assert.equal(theme.motion.fog.rimColor, theme.palette.uiAccent);
    assert.equal(theme.motion.win.ringColor, theme.palette.uiAccent);
    // Durations the ledger says to REUSE rather than restate.
    assert.equal(theme.camera.motion.flatToTiltMs, 720);
    assert.equal(theme.beam.endStates.target.litFadeMs, 160);
    assert.equal(theme.beam.travel.minDurationMs, 340);
    assert.equal(theme.beam.travel.maxDurationMs, 2200);
    assert.equal(theme.terrain.darkness.revealMs, 420);
  });
});

/* ------------------------------------------------------------------ named easing functions */
describe('theme.ease: the named easing functions of the Implementation contract', () => {
  const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

  test('every named curve exists, is pure, and clamps normalized time to 0..1', () => {
    for (const k of ['linear', 'smoothstep', 'easeOutCubic', 'easeInCubic', 'easeInOutCubic', 'bell', 'camera']) {
      assert.equal(typeof theme.ease[k], 'function', k);
      assert.equal(theme.ease[k](-5), theme.ease[k](0), `${k} clamps below 0`);
      assert.equal(theme.ease[k](5), theme.ease[k](1), `${k} clamps above 1`);
    }
  });

  test('matches the formulas in the document exactly', () => {
    const e = theme.ease;
    near(e.linear(0.37), 0.37, 'linear f(t) = t');
    near(e.smoothstep(0.25), 0.25 * 0.25 * (3 - 2 * 0.25), 'smoothstep t^2(3-2t)');
    near(e.easeOutCubic(0.25), 1 - Math.pow(0.75, 3), 'easeOutCubic 1-(1-t)^3');
    near(e.easeInCubic(0.25), Math.pow(0.25, 3), 'easeInCubic t^3');
    near(e.easeInOutCubic(0.25), 4 * Math.pow(0.25, 3), 'easeInOutCubic 4t^3 before the midpoint');
    near(e.easeInOutCubic(0.75), 1 - Math.pow(-2 * 0.75 + 2, 3) / 2, 'easeInOutCubic after the midpoint');
    near(e.bell(0.5), 1, 'bell sin^2(pi t) peaks at the midpoint');
    near(e.bell(0.25), Math.pow(Math.sin(Math.PI * 0.25), 2), 'bell sin^2(pi t)');
    assert.ok(e.bell(1) < 1e-15, 'bell returns to zero');
    assert.equal(e.camera, theme.easeCamera, 'camera is the EXISTING theme.easeCamera, not a second curve');
    for (const k of ['linear', 'smoothstep', 'easeOutCubic', 'easeInCubic', 'easeInOutCubic', 'camera']) {
      assert.equal(theme.ease[k](0), 0, `${k}(0)`);
      assert.equal(theme.ease[k](1), 1, `${k}(1)`);
    }
  });

  test('easeByName resolves ledger names, the camera css string, and functions', () => {
    assert.equal(theme.easeByName('smoothstep'), theme.ease.smoothstep);
    assert.equal(theme.easeByName(theme.motion.easing.enter), theme.ease.easeOutCubic);
    assert.equal(theme.easeByName(theme.motion.easing.pulse), theme.ease.bell);
    assert.equal(theme.easeByName(theme.motion.easing.camera), theme.easeCamera);
    assert.equal(theme.easeByName(theme.camera.motion.easingName), theme.easeCamera);
    assert.equal(theme.easeByName(theme.motion.reveal.sideEasing), theme.ease.smoothstep);
    assert.equal(theme.easeByName(theme.motion.fog.easing), theme.ease.smoothstep);
    assert.equal(theme.easeByName(theme.motion.reveal.cameraEasing), theme.ease.easeInOutCubic);
    const custom = (t) => t;
    assert.equal(theme.easeByName(custom), custom);
    assert.equal(theme.easeByName('not-a-curve'), theme.ease.linear, 'unknown names fall back to linear');
    assert.equal(theme.easeByName(undefined), theme.ease.linear);
  });

  test('the registry resolves a spec.ease name through the same table', () => {
    const h = makeHost();
    const { rec, spec } = spy({ startMs: 0, durationMs: 100, from: 0, to: 1, ease: theme.motion.easing.enter });
    h.motion.run(spec);
    h.advance(25);
    near(rec.updates[0].eased, theme.ease.easeOutCubic(0.25), 'eased through easeOutCubic');
    assert.equal(h.motion.ease(theme.motion.easing.turn), theme.ease.easeInOutCubic);
  });
});
