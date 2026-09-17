/* Lasers 3D - synthesized WebAudio cues. Global: window.LaserAudio (CommonJS export for node tests).
 * API per INTERFACES-FRONTEND.md section 4. No files, no fetch; oscillators + gain envelopes + a
 * little filtered noise. Creates NO AudioContext until unlock(). Never throws. ES2019 (Safari 15). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(root); }
  else { root.LaserAudio = factory(root); }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var MASTER_GAIN = Math.pow(10, -12 / 20);   /* -12 dB = 0.251 */
  var MAX_VOICES = 8, TRAVEL_GAIN = 0.105, TRAVEL_BASE_HZ = 185;

  /* One-shot recipes. They deliberately avoid exposed square/saw fundamentals in the firing sequence: those read
   * as a cheap buzzer on iPad speakers. A shot instead has a low capacitor thump, a fast ion chirp and a filtered
   * air transient. Interaction beats share the same A-major/add-nine colour so a successful route resolves rather
   * than becoming a pile of unrelated bleeps.
   *
   * tones: [type, f0, f1, t0, dur, peak, optionalFilterType, filterHz, filterQ]
   * noise: [filterType, freqHz, dur, peak, filterQ] */
  var RECIPES = {
    place:   { tones: [['sine', 520, 660, 0, 0.09, 0.35]] },
    rotate:  { tones: [['triangle', 440, 520, 0, 0.06, 0.30]] },
    remove:  { tones: [['sine', 500, 250, 0, 0.12, 0.30]] },
    fire:    { tones: [['sine', 96, 46, 0, 0.28, 0.42], ['triangle', 260, 780, 0.012, 0.19, 0.18],
                       ['sine', 2100, 690, 0.006, 0.14, 0.17]], noise: ['bandpass', 2400, 0.10, 0.12, 0.8] },
    reflect: { tones: [['sine', 1480, 980, 0, 0.075, 0.18], ['sine', 740, 620, 0.01, 0.10, 0.11]] },
    bounce:  { tones: [['triangle', 330, 990, 0, 0.16, 0.20], ['sine', 1320, 1760, 0.035, 0.15, 0.13]] },
    cross:   { tones: [['sine', 1160, 420, 0, 0.24, 0.15], ['sine', 290, 870, 0.025, 0.25, 0.14]],
               noise: ['bandpass', 1500, 0.18, 0.09, 0.55] },
    split:   { tones: [['sine', 440, 554, 0, 0.20, 0.14], ['sine', 660, 830, 0.018, 0.23, 0.13],
                       ['sine', 880, 1108, 0.035, 0.25, 0.11]] },
    hit:     { tones: [['sine', 880, 880, 0, 0.30, 0.25], ['sine', 1320, 1320, 0.035, 0.32, 0.21],
                       ['sine', 1760, 1760, 0.075, 0.30, 0.12]] },
    blocked: { tones: [['sine', 150, 54, 0, 0.22, 0.38], ['triangle', 420, 120, 0.008, 0.16, 0.14]],
               noise: ['lowpass', 520, 0.14, 0.18, 0.7] },
    lost:    { tones: [['sine', 740, 210, 0, 0.38, 0.23], ['sine', 370, 105, 0.04, 0.42, 0.16]],
               noise: ['bandpass', 900, 0.22, 0.07, 0.5] },
    win:     { tones: [['sine', 110, 55, 0, 0.72, 0.28], ['triangle', 440, 440, 0.035, 0.78, 0.20],
                       ['sine', 554, 554, 0.075, 0.82, 0.18], ['sine', 660, 660, 0.12, 0.86, 0.17],
                       ['sine', 880, 880, 0.21, 0.92, 0.15]], noise: ['bandpass', 3200, 0.52, 0.055, 0.6] },
    tilt:    { noise: ['bandpass', 900, 0.22, 0.30], tones: [['sine', 260, 420, 0, 0.22, 0.12]] },
    flat:    { noise: ['bandpass', 700, 0.20, 0.30], tones: [['sine', 420, 260, 0, 0.20, 0.12]] },
    ui:      { tones: [['sine', 1200, 1200, 0, 0.03, 0.20]] },
    invalid: { tones: [['square', 160, 150, 0, 0.07, 0.30], ['square', 160, 150, 0.10, 0.07, 0.30]] },
    hint:    { tones: [['sine', 1046, 1046, 0, 0.24, 0.30], ['sine', 2093, 2093, 0, 0.16, 0.10]] },
    reveal:  { tones: [['sine', 330, 494, 0, 0.50, 0.30]] }
  };

  function create(opts) {
    opts = opts || {};
    var Ctor = opts.AudioContext || root.AudioContext || root.webkitAudioContext || null;
    var ctx = null, master = null, noiseBuf = null, muted = false, level = 0, disposed = false;
    var voices = [];          /* { nodes:[], src, born } newest last */
    var travel = null;        /* { nodes:[], oscs:[] } while looping */
    var rebuild = false;      /* the context is wedged (resume never completed / it closed): rebuild on next unlock */

    var docRef = opts.document !== undefined ? opts.document : (typeof document !== 'undefined' ? document : null);
    var winRef = opts.window !== undefined ? opts.window : root;
    var lifecycle = [];

    function safe(fn) { try { return fn(); } catch (e) { return undefined; } }
    function ready() { return !!(ctx && master && !disposed); }

    function build() {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_GAIN;
      master.connect(ctx.destination);
    }
    /* Drop the whole graph. iOS can leave a context 'interrupted' or closed after a call, an alarm or a tab switch;
     * resume() then never completes and every later play() is silent forever. Rebuilding is the only cure. */
    function teardown() {
      safe(function () { if (ready()) stopTravel(); });
      travel = null; voices.length = 0; noiseBuf = null;
      var old = ctx;
      ctx = null; master = null;
      safe(function () { if (old && typeof old.close === 'function') { var p = old.close(); if (p && p.catch) p.catch(function () {}); } });
    }

    function unlock() {
      return !!safe(function () {
        if (disposed || !Ctor) return false;
        if (ctx && (rebuild || ctx.state === 'closed')) { teardown(); rebuild = false; }
        if (!ctx) build();
        if (ctx.state !== 'running' && typeof ctx.resume === 'function') {
          var p = ctx.resume();
          if (p && typeof p.then === 'function') {
            p.then(function () { if (!disposed && ctx && ctx.state !== 'running') rebuild = true; },
                   function () { rebuild = true; });
          } else if (ctx.state !== 'running') rebuild = true;
        }
        return ctx.state === 'running';
      });
    }

    /* Page lifecycle: a looping oscillator that survives into a hidden page drones on when the page comes back (and
     * on iOS the context is usually interrupted anyway). Stop the loop on the way out; the next user gesture calls
     * unlock(), which resumes or rebuilds. Every handler is a no-op when there is no context. */
    function onHidden() { safe(function () { if (ready()) stopTravel(); }); }
    function onVisibility() { safe(function () { if (docRef && docRef.hidden) onHidden(); }); }
    function listen(target, type, fn) {
      if (!target || typeof target.addEventListener !== 'function') return;
      target.addEventListener(type, fn, false);
      lifecycle.push([target, type, fn]);
    }
    listen(docRef, 'visibilitychange', onVisibility);
    listen(winRef, 'pagehide', onHidden);
    listen(winRef, 'freeze', onHidden);

    function noiseBuffer() {
      if (noiseBuf) return noiseBuf;
      var n = Math.floor(ctx.sampleRate * 0.5), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), i;
      for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return (noiseBuf = buf);
    }

    function disconnectAll(nodes) { for (var i = 0; i < nodes.length; i++) safe(function () { nodes[i].disconnect(); }); }

    function release(voice) {
      var i = voices.indexOf(voice);
      if (i >= 0) voices.splice(i, 1);
      disconnectAll(voice.nodes);
    }
    function steal(voice) {                       /* immediate fade + stop */
      var now = ctx.currentTime;
      safe(function () { voice.env.gain.cancelScheduledValues(now); voice.env.gain.setTargetAtTime(0, now, 0.01); });
      for (var i = 0; i < voice.srcs.length; i++) safe(function () { voice.srcs[i].stop(now + 0.03); });
      release(voice);
    }

    function envelope(t0, dur, peak, output) {
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      g.connect(output || master);
      return g;
    }

    function oneShot(recipe, options) {
      var now = ctx.currentTime, voice = { nodes: [], srcs: [], env: null, born: now }, end = 0, i;
      /* Every layer shares a bus. Voice stealing fades the whole sound before stopping it, avoiding the clicks that
       * occur when a busy splitter route reaches the voice cap while several harmonics are still sounding. */
      var bus = ctx.createGain(), panner = null; bus.gain.value = 1;
      if (options && isFinite(options.pan) && typeof ctx.createStereoPanner === 'function') {
        panner = ctx.createStereoPanner(); panner.pan.value = Math.max(-0.85, Math.min(0.85, +options.pan));
        bus.connect(panner); panner.connect(master);
      } else bus.connect(master);
      voice.nodes.push(bus); voice.env = bus;
      if (panner) voice.nodes.push(panner);
      var tones = recipe.tones || [], k;
      for (i = 0; i < tones.length; i++) {
        k = tones[i];
        var t0 = now + k[3], osc = ctx.createOscillator(), g = envelope(t0, k[4], k[5], bus), toneFilter = null;
        osc.type = k[0];
        osc.frequency.setValueAtTime(k[1], t0);
        if (k[2] !== k[1]) osc.frequency.exponentialRampToValueAtTime(k[2], t0 + k[4]);
        if (k[6]) {
          toneFilter = ctx.createBiquadFilter(); toneFilter.type = k[6]; toneFilter.frequency.value = k[7]; toneFilter.Q.value = k[8] || 0.7;
          osc.connect(toneFilter); toneFilter.connect(g);
        } else osc.connect(g);
        osc.start(t0); osc.stop(t0 + k[4] + 0.02);
        voice.nodes.push(osc); if (toneFilter) voice.nodes.push(toneFilter); voice.nodes.push(g);
        voice.srcs.push(osc);
        end = Math.max(end, k[3] + k[4]);
      }
      if (recipe.noise) {
        k = recipe.noise;
        var src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), ng = envelope(now, k[2], k[3], bus);
        src.buffer = noiseBuffer(); flt.type = k[0]; flt.frequency.value = k[1]; flt.Q.value = k[4] || 1.2;
        src.connect(flt); flt.connect(ng); src.start(now); src.stop(now + k[2] + 0.02);
        voice.nodes.push(src, flt, ng); voice.srcs.push(src);
        end = Math.max(end, k[2]);
      }
      /* Release only once EVERY source in the voice has finished. Attaching the cleanup to the first source that
       * ends disconnected the whole voice while later sources were still scheduled, which cut off the second beep of
       * `invalid` and the final note of `win`. */
      voice.pending = voice.srcs.length;
      for (i = 0; i < voice.srcs.length; i++) {
        voice.srcs[i].onended = function () { if (--voice.pending <= 0) release(voice); };
      }
      if (!voice.srcs.length) release(voice);
      while (voices.length >= MAX_VOICES) steal(voices[0]);
      voices.push(voice);
    }

    function travelHz() { return TRAVEL_BASE_HZ * Math.pow(2, (3 * level) / 12); }   /* a minor third per altitude */

    function startTravel() {
      if (travel) return;
      var now = ctx.currentTime, g = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(TRAVEL_GAIN, now + 0.065); g.connect(master);
      /* Subtle analogue drift gives the beam energy without the old repeating sawtooth siren. */
      lfo.type = 'sine'; lfo.frequency.value = 0.38; depth.gain.value = 7;
      lfo.connect(depth);
      var t = { nodes: [g, lfo, depth], oscs: [], gain: g }, i, ratios = [0.5, 1, 1.006, 2.01];
      for (i = 0; i < ratios.length; i++) {
        var o = ctx.createOscillator(), og = ctx.createGain();
        o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = travelHz() * ratios[i];
        og.gain.value = [0.22, 0.18, 0.10, 0.045][i];
        depth.connect(o.detune); o.connect(og); og.connect(g); o.start(now);
        t.oscs.push(o); t.nodes.push(o, og);
      }
      lfo.start(now);
      travel = t;
    }
    function stopTravel() {
      if (!travel) return;
      var t = travel, now = ctx.currentTime; travel = null;
      safe(function () { t.gain.gain.cancelScheduledValues(now); t.gain.gain.setTargetAtTime(0, now, 0.065); });
      for (var i = 0; i < t.nodes.length; i++) if (t.nodes[i].stop) safe(function () { t.nodes[i].stop(now + 0.32); });
      var first = t.oscs[0]; if (first) first.onended = function () { disconnectAll(t.nodes); };
    }

    return {
      unlock: unlock,
      play: function (name, options) { safe(function () {
        if (!ready()) return;
        if (name === 'travel') startTravel();
        else if (RECIPES[name]) oneShot(RECIPES[name], options);
      }); },
      stop: function (name) { safe(function () { if (name === 'travel' && ready()) stopTravel(); }); },
      setMuted: function (m) { muted = !!m; safe(function () { if (master) master.gain.value = muted ? 0 : MASTER_GAIN; }); },
      isMuted: function () { return muted; },
      setLevel: function (z) { safe(function () {
        level = Math.max(0, Math.min(3, Math.round(+z) || 0));
        if (!travel) return;
        var hz = travelHz(), ratios = [0.5, 1, 1.006, 2.01];
        for (var i = 0; i < travel.oscs.length; i++) travel.oscs[i].frequency.setTargetAtTime(hz * ratios[i], ctx.currentTime, 0.055);
      }); },
      dispose: function () { safe(function () {
        if (disposed) return; disposed = true;
        for (var i = 0; i < lifecycle.length; i++) {
          var l = lifecycle[i];
          safe(function () { l[0].removeEventListener(l[1], l[2], false); });
        }
        lifecycle.length = 0;
        if (ctx) { stopTravel(); while (voices.length) steal(voices[0]); disconnectAll(master ? [master] : []);
          if (typeof ctx.close === 'function') { var p = ctx.close(); if (p && p.catch) p.catch(function () {}); } }
        ctx = null; master = null;
      }); },
      /* test hooks: drive the page-lifecycle path without a real browser */
      __onVisibility: onVisibility, __onPageHide: onHidden,
      __state: function () { return { hasContext: !!ctx, state: ctx ? ctx.state : null, rebuild: rebuild, travelling: !!travel }; },
      __version: 2
    };
  }

  return { create: create, __version: 2 };
}));
