// node:test suite for src/audio.js (LaserAudio) using a fake AudioContext that records the node graph.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const LaserAudio = require('../src/audio.js');
const theme = require('../src/theme.js');

const NAMES = ['place', 'rotate', 'remove', 'fire', 'hit', 'blocked', 'lost', 'win', 'tilt', 'flat', 'ui', 'invalid', 'hint', 'reveal'];

class FakeParam {
  constructor(v) { this.value = v; this.calls = []; }
  setValueAtTime(v, t) { this.calls.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); return this; }
  setTargetAtTime(v, t, c) { this.calls.push(['target', v, t, c]); return this; }
  cancelScheduledValues(t) { this.calls.push(['cancel', t]); return this; }
}
class FakeNode {
  constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; this.outputs = []; this.disconnected = false; ctx.nodes.push(this); }
  connect(target) { this.outputs.push(target); return target; }
  disconnect() { this.disconnected = true; this.outputs = []; }
}
class FakeSource extends FakeNode {
  constructor(ctx, kind) { super(ctx, kind); this.started = null; this.stopped = null; this.onended = null; }
  start(t) { this.started = t == null ? this.ctx.currentTime : t; }
  stop(t) { this.stopped = t == null ? this.ctx.currentTime : t; }
  end() { if (this.onended) this.onended(); }
}
class FakeAudioContext {
  constructor() {
    this.nodes = []; this.currentTime = 0; this.sampleRate = 44100; this.state = 'suspended';
    this.resumed = 0; this.closed = 0; this.destination = { kind: 'destination' };
    FakeAudioContext.instances.push(this);
  }
  resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
  close() { this.closed++; this.state = 'closed'; return Promise.resolve(); }
  createGain() { const n = new FakeNode(this, 'gain'); n.gain = new FakeParam(1); return n; }
  createOscillator() { const n = new FakeSource(this, 'osc'); n.type = 'sine'; n.frequency = new FakeParam(440); n.detune = new FakeParam(0); return n; }
  createBufferSource() { const n = new FakeSource(this, 'buffer'); n.buffer = null; return n; }
  createBiquadFilter() { const n = new FakeNode(this, 'filter'); n.type = 'lowpass'; n.frequency = new FakeParam(350); n.Q = new FakeParam(1); return n; }
  createBuffer(ch, len, rate) { return { ch, len, rate, data: new Float32Array(len), getChannelData() { return this.data; } }; }
}
FakeAudioContext.instances = [];

function make() {
  FakeAudioContext.instances = [];
  const audio = LaserAudio.create({ theme, AudioContext: FakeAudioContext });
  return audio;
}
const ctxOf = () => FakeAudioContext.instances[0];
const sources = (ctx) => ctx.nodes.filter((n) => n instanceof FakeSource);
const reachesDestination = (node, ctx, seen = new Set()) => {
  if (node === ctx.destination) return true;
  if (!node || seen.has(node)) return false;
  seen.add(node);
  return (node.outputs || []).some((o) => reachesDestination(o, ctx, seen));
};

describe('LaserAudio surface', () => {
  test('exposes create and __version', () => {
    assert.equal(typeof LaserAudio.create, 'function');
    assert.equal(LaserAudio.__version, 1);
    const a = make();
    for (const k of ['unlock', 'play', 'stop', 'setMuted', 'isMuted', 'setLevel', 'dispose']) assert.equal(typeof a[k], 'function', k);
  });

  test('creates no AudioContext until unlock(); play before unlock is a no-op', () => {
    const a = make();
    a.play('place'); a.play('travel'); a.stop('travel'); a.setLevel(2);
    assert.equal(FakeAudioContext.instances.length, 0);
    assert.equal(a.unlock(), true);
    assert.equal(FakeAudioContext.instances.length, 1);
    assert.equal(ctxOf().resumed, 1);
    assert.equal(a.unlock(), true, 'repeat unlock is safe');
    assert.equal(FakeAudioContext.instances.length, 1, 'no second context');
  });

  test('master gain is -12 dB and routed to destination', () => {
    const a = make(); a.unlock();
    const master = ctxOf().nodes.find((n) => n.kind === 'gain' && n.outputs.includes(ctxOf().destination));
    assert.ok(master, 'master gain connected to destination');
    assert.ok(Math.abs(master.gain.value - 0.2512) < 0.001, `master gain ${master.gain.value}`);
  });
});

describe('one-shots', () => {
  for (const name of NAMES) {
    test(`play('${name}') builds a node graph that reaches the destination and releases on ended`, () => {
      const a = make(); a.unlock();
      const before = ctxOf().nodes.length;
      a.play(name);
      const ctx = ctxOf();
      const created = ctx.nodes.slice(before);
      assert.ok(created.length >= 2, 'created nodes');
      const srcs = created.filter((n) => n instanceof FakeSource);
      assert.ok(srcs.length >= 1, 'has at least one source');
      for (const s of srcs) {
        assert.notEqual(s.started, null, 'started');
        assert.notEqual(s.stopped, null, 'stop scheduled');
        assert.ok(s.stopped > s.started, 'stop after start');
        assert.ok(reachesDestination(s, ctx), 'source reaches destination');
      }
      // gain envelopes stay <= 0.5 peak
      for (const g of created.filter((n) => n.kind === 'gain')) {
        for (const c of g.gain.calls) if (c[0] === 'lin' || c[0] === 'set') assert.ok(c[1] <= 0.5, `peak ${c[1]} <= 0.5`);
      }
      // S14: a voice is released only once EVERY source has finished, so a later note is never cut short.
      if (srcs.length > 1) {
        srcs[0].end();
        assert.equal(created.some((n) => n.disconnected), false, 'first source ending does not tear down the voice');
      }
      for (const s of srcs) s.end();
      for (const n of created) assert.equal(n.disconnected, true, `${n.kind} released`);
    });
  }

  test('multi-source voices survive until their LAST source ends (invalid beep 2, win note 4)', () => {
    for (const [name, notes] of [['invalid', 2], ['win', 4]]) {
      const a = make(); a.unlock();
      const ctx = ctxOf();
      const before = ctx.nodes.length;
      a.play(name);
      const created = ctx.nodes.slice(before);
      const srcs = created.filter((n) => n instanceof FakeSource);
      assert.equal(srcs.length, notes, `${name} schedules ${notes} sources`);
      const last = srcs.reduce((m, s) => (s.stopped > m.stopped ? s : m), srcs[0]);
      for (const s of srcs) {
        if (s === last) continue;
        s.end();
        assert.equal(last.disconnected, false, `${name}: the last note is still connected after an earlier one ends`);
      }
      last.end();
      for (const n of created) assert.equal(n.disconnected, true, `${name}: ${n.kind} released once all sources ended`);
    }
  });

  test('polyphony caps at 8 voices: the 9th play steals the oldest', () => {
    const a = make(); a.unlock();
    const ctx = ctxOf();
    for (let i = 0; i < 9; i++) a.play('ui');
    const srcs = sources(ctx);
    assert.equal(srcs.length, 9);
    assert.equal(srcs[0].disconnected, true, 'oldest voice stolen');
    assert.ok(srcs[0].stopped <= ctx.currentTime + 0.05, 'oldest stopped now-ish');
    assert.equal(srcs[8].disconnected, false, 'newest alive');
    assert.equal(srcs.filter((s) => !s.disconnected).length, 8);
  });

  test('unknown names and stop on one-shots are ignored without throwing', () => {
    const a = make(); a.unlock();
    const n = ctxOf().nodes.length;
    assert.doesNotThrow(() => { a.play('nope'); a.play(); a.stop('place'); a.stop(); });
    assert.equal(ctxOf().nodes.length, n);
  });
});

describe('travel loop', () => {
  test('starts once, pitches with setLevel, stops and releases', () => {
    const a = make(); a.unlock();
    const ctx = ctxOf();
    const before = ctx.nodes.length;
    a.play('travel');
    const created = ctx.nodes.slice(before);
    const oscs = created.filter((n) => n.kind === 'osc');
    assert.ok(oscs.length >= 2, 'at least two oscillators (voice + LFO)');
    assert.equal(oscs.every((o) => o.started != null && o.stopped == null), true, 'running, not stopped');
    const voiceOscs = oscs.filter((o) => reachesDestination(o, ctx));
    assert.ok(voiceOscs.length >= 1, 'voice reaches destination');
    const lfo = oscs.find((o) => o.type === 'sawtooth');
    assert.ok(lfo, 'rising LFO present');
    const gains = created.filter((n) => n.kind === 'gain');
    const loopGain = gains.find((g) => g.gain.calls.some((c) => c[0] === 'lin' && Math.abs(c[1] - 0.18) < 1e-9));
    assert.ok(loopGain, 'loop gain ramps to 0.18');

    a.play('travel');
    assert.equal(ctx.nodes.length, before + created.length, 'second play(travel) is a no-op');

    const f0 = voiceOscs[0].frequency.value;
    a.setLevel(1);
    const call = voiceOscs[0].frequency.calls.find((c) => c[0] === 'target');
    assert.ok(call, 'setLevel retargets frequency');
    assert.ok(Math.abs(call[1] / f0 - Math.pow(2, 2 / 12)) < 1e-6, 'one whole step up per altitude');

    a.stop('travel');
    for (const o of oscs) assert.notEqual(o.stopped, null, 'osc stop scheduled');
    voiceOscs[0].end();
    for (const n of created) assert.equal(n.disconnected, true, `${n.kind} released`);
    a.stop('travel'); // idempotent
    a.play('travel');
    assert.ok(ctx.nodes.length > before + created.length, 'can restart after stop');
  });
});

describe('mute and lifecycle', () => {
  test('setMuted drives master gain, before and after unlock', () => {
    const a = make();
    a.setMuted(true);
    assert.equal(a.isMuted(), true);
    a.unlock();
    const master = ctxOf().nodes.find((n) => n.kind === 'gain' && n.outputs.includes(ctxOf().destination));
    assert.equal(master.gain.value, 0);
    a.setMuted(false);
    assert.equal(a.isMuted(), false);
    assert.ok(Math.abs(master.gain.value - 0.2512) < 0.001);
    a.play('place');
    assert.ok(sources(ctxOf()).length > 0, 'context stays alive and still plays');
  });

  test('dispose closes the context and every call after is a no-op', () => {
    const a = make(); a.unlock();
    a.play('travel'); a.play('hit');
    a.dispose();
    assert.equal(ctxOf().closed, 1);
    for (const s of sources(ctxOf())) assert.notEqual(s.stopped, null, `${s.kind} stopped`);
    assert.doesNotThrow(() => { a.dispose(); a.play('place'); a.unlock(); a.stop('travel'); a.setLevel(3); });
    assert.equal(FakeAudioContext.instances.length, 1, 'no new context after dispose');
  });

  test('missing AudioContext: every call is a safe no-op and unlock returns false', () => {
    const saved = [globalThis.AudioContext, globalThis.webkitAudioContext];
    delete globalThis.AudioContext; delete globalThis.webkitAudioContext;
    try {
      const a = LaserAudio.create({ theme });
      assert.equal(a.unlock(), false);
      assert.doesNotThrow(() => {
        for (const n of NAMES.concat(['travel'])) a.play(n);
        a.stop('travel'); a.setMuted(true); a.setLevel(2); a.dispose();
      });
      assert.equal(a.isMuted(), true);
    } finally {
      if (saved[0]) globalThis.AudioContext = saved[0];
      if (saved[1]) globalThis.webkitAudioContext = saved[1];
    }
  });

  test('a throwing context never propagates', () => {
    class Boom extends FakeAudioContext { createOscillator() { throw new Error('boom'); } }
    const a = LaserAudio.create({ theme, AudioContext: Boom });
    assert.equal(a.unlock(), true);
    assert.doesNotThrow(() => { a.play('hit'); a.play('travel'); a.stop('travel'); });
  });
});

// S9: iOS interrupts an AudioContext on a call / lock / tab switch. Without lifecycle handling the travel loop
// drones into the hidden page and the context stays suspended (or closed) for ever, silencing the game.
describe('page lifecycle', () => {
  class FakeTarget {
    constructor() { this.handlers = {}; }
    addEventListener(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); }
    removeEventListener(type, fn) { this.handlers[type] = (this.handlers[type] || []).filter((f) => f !== fn); }
    emit(type) { for (const f of (this.handlers[type] || []).slice()) f({ type }); }
    count(type) { return (this.handlers[type] || []).length; }
  }
  function lifecycleAudio(Ctx = FakeAudioContext) {
    FakeAudioContext.instances = [];
    const docEl = new FakeTarget(); docEl.hidden = false;
    const winEl = new FakeTarget();
    const audio = LaserAudio.create({ theme, AudioContext: Ctx, document: docEl, window: winEl });
    return { audio, docEl, winEl };
  }

  test('subscribes to visibilitychange, pagehide and freeze, and unsubscribes on dispose', () => {
    const { audio, docEl, winEl } = lifecycleAudio();
    assert.equal(docEl.count('visibilitychange'), 1);
    assert.equal(winEl.count('pagehide'), 1);
    assert.equal(winEl.count('freeze'), 1);
    audio.dispose();
    assert.equal(docEl.count('visibilitychange'), 0);
    assert.equal(winEl.count('pagehide') + winEl.count('freeze'), 0);
  });

  test('hiding the page stops the travel loop; a visible page leaves it alone', () => {
    const { audio, docEl } = lifecycleAudio();
    audio.unlock(); audio.play('travel');
    assert.equal(audio.__state().travelling, true);
    docEl.hidden = false; docEl.emit('visibilitychange');
    assert.equal(audio.__state().travelling, true, 'a visibilitychange back to visible changes nothing');
    docEl.hidden = true; docEl.emit('visibilitychange');
    assert.equal(audio.__state().travelling, false, 'travel loop stopped on hide');
    const oscs = ctxOf().nodes.filter((n) => n instanceof FakeSource && n.kind === 'osc');
    assert.equal(oscs.every((o) => o.stopped != null), true, 'every travel oscillator has a stop scheduled');
  });

  test('pagehide stops the travel loop and never throws without a context', () => {
    const { audio, winEl } = lifecycleAudio();
    assert.doesNotThrow(() => winEl.emit('pagehide'), 'no context yet: a no-op');
    audio.unlock(); audio.play('travel');
    winEl.emit('pagehide');
    assert.equal(audio.__state().travelling, false);
  });

  test('a closed context is rebuilt on the next user gesture', () => {
    const { audio } = lifecycleAudio();
    audio.unlock();
    const first = ctxOf();
    first.state = 'closed';
    assert.equal(audio.unlock(), true, 'unlock recovers');
    assert.equal(FakeAudioContext.instances.length, 2, 'a fresh context was built');
    assert.equal(first.closed, 1, 'the wedged context was closed');
    audio.play('place');
    assert.ok(FakeAudioContext.instances[1].nodes.some((n) => n instanceof FakeSource), 'sound plays from the new graph');
  });

  test('a resume() that never completes marks the graph for rebuild on the next gesture', async () => {
    class Wedged extends FakeAudioContext {
      resume() { this.resumed++; return Promise.resolve(); }   // resolves but the state stays 'suspended' (iOS interrupted)
    }
    const { audio } = lifecycleAudio(Wedged);
    assert.equal(audio.unlock(), false, 'still not running');
    await Promise.resolve(); await Promise.resolve();
    assert.equal(audio.__state().rebuild, true, 'flagged for rebuild');
    audio.unlock();
    assert.equal(FakeAudioContext.instances.length, 2, 'the next gesture rebuilds the graph');
  });

  test('a rejecting resume() also flags a rebuild and never throws', async () => {
    class Rejects extends FakeAudioContext { resume() { return Promise.reject(new Error('nope')); } }
    const { audio } = lifecycleAudio(Rejects);
    assert.doesNotThrow(() => audio.unlock());
    await Promise.resolve(); await Promise.resolve();
    assert.equal(audio.__state().rebuild, true);
    assert.doesNotThrow(() => { audio.unlock(); audio.play('hit'); });
  });
});
