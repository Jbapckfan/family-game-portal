/* Lasers 3D - THE animation registry and render scheduler (MOTION-DIRECTION.md, "Rendering and ownership").
 * Global: window.LaserMotion (CommonJS export for node tests). Classic script, ES2019 (Safari 15).
 * No DOM, no Three.js, no import/export, no dependency. Loads after src/theme.js, before src/render*.js.
 *
 * ============================================================================================================
 * THE CONTRACT. Read this before you animate anything. Four agents build on it and none of them may change it.
 * ============================================================================================================
 *
 * 1. ONE REGISTRY, ONE SCHEDULER.
 *    Every animation in the game is registered here. There is no second rAF loop, no setInterval, no perpetual
 *    CSS animation, no shader clock that advances on its own. If you find yourself writing
 *    `requestAnimationFrame` outside src/main.js, you are off-contract.
 *
 * 2. WHAT AN ANIMATION MUST SUPPLY.  motion.run(spec) where spec is:
 *      startMs      when it begins. Default motion.now(). Add `delayMs` for a stagger (target.ringDelayMs).
 *      durationMs   how long it lasts - OR `endMs`, the absolute end time. One of the two is REQUIRED.
 *      update(eased, ctx)  called once per frame while it runs. REQUIRED.
 *      final()      applies the EXACT final state. REQUIRED. Not "update(1)" - the exact, settled values.
 *      cancel()     undoes/releases the effect when it is abandoned (RESET, level change, document hidden).
 *                   Optional but expected of anything that owns a pooled sprite, a DOM node or a material.
 *      fallback()   the item's reduced-motion settle. Optional; defaults to final().
 *      ease         a theme.motion.easing NAME, or a function. Default linear.
 *      from, to     optional endpoints. When both are finite numbers ctx.value is the interpolated value and
 *                   the registry tracks it as the displayed pose (see 6).
 *      key          supersession key (see 6).
 *      role         'presentation' (default) | 'decorative'  (see 8, 9).
 *      surface      'webgl' (default) | 'dom'                (see 3).
 *      attempt, trace   staleness stamps (see 7).
 *      onDone(reason)   optional notification: 'complete' | 'settled' | 'cancelled' | 'superseded'.
 *    run() THROWS if update or final is missing, or if neither durationMs nor endMs is given. A spec that
 *    cannot end is not an animation.
 *
 * 3. DIRTY RENDERING - HOW THIS PLUGS INTO THE EXISTING LOOP. The game does NOT render every frame; it renders
 *    on demand (src/main.js markDirty/requestFrame, src/render.js needsFrame). Three edits wire the registry in,
 *    and they are the only ones:
 *      a) index.html: <script src="src/motion.js"> after src/theme.js and before src/render-core.js.
 *      b) main.js start(): var motion = LaserMotion.create({ theme: theme, dirty: markDirty,
 *           reducedMotion: reducedMotion });   // then pass `motion` to every module that animates
 *      c) main.js step(), immediately after `S.dirty = false; S.frames++;` and before `render.frame(dt)`:
 *           motion.tick();
 *      d) main.js loop(), the re-schedule test, one added term:
 *           if (S.dirty || S.status === 'tracing' || motion.needsFrame() || (render && render.needsFrame()))
 *    tick() MUST run before the render in the same frame, so a completing animation's final state is what that
 *    frame draws. The registry marks the scene dirty when a WebGL animation
 *    STARTS and once when it completes, settles or is cancelled, which is the "one last render" the contract
 *    requires. A 'dom' animation (weather) never marks dirty and never counts toward needsFrame().
 *    needsFrame() goes false the instant the last WebGL animation leaves the registry. Nothing else may hold it
 *    true: not a stationary pointer, a held selection, a visible beam, a lit target, an open result panel or an
 *    unresolved puzzle. Verification asks for ZERO scheduled frames after the last weather burst.
 *
 * 4. HOLDS DO NOT RENDER.  motion.hold(ms, then, opts) is the one-shot timer for stationary choreography waits
 *    (failure.quietMs, camera.revealChoreography.holdAtTiltMs). A hold never marks dirty, never counts toward
 *    needsFrame() and never counts as live. It is still tracked, so cancelAll() and documentHidden() reach it.
 *    Do not poll. Do not use hold() to drive an animation in steps.
 *
 * 5. COMPLETION. At progress 1 the registry removes the animation, calls final(), and marks the scene dirty
 *    once. update() is never called with the terminal value - final() is the authority, so a rounding error in
 *    the last frame can never become the resting state. No animation may be left live afterwards.
 *
 * 6. SUPERSESSION - "a new edit replaces the current edit animation starting from the currently displayed pose".
 *    Give both specs the same `key`. run() removes the incumbent WITHOUT calling its final() or its cancel()
 *    (the newcomer inherits the same visual), and:
 *      - `from` omitted        -> from = the incumbent's displayed pose,
 *      - `from` a function     -> from = from(displayedPose, incumbentHandle),
 *      - `from` a value        -> that value, verbatim.
 *    The displayed pose is whatever update() returned last, or ctx.value when from/to are numbers. That is what
 *    makes a retrace continue from where the eye last saw the piece instead of snapping.
 *
 * 7. ATTEMPT AND TRACE STAMPS - the rule that stops a late callback from a superseded shot.
 *    motion.token() returns { attempt, trace }. Stamp every animation, hold and deferred callback with it:
 *      var id = motion.token();  motion.run({ attempt: id.attempt, trace: id.trace, ... });
 *      element.addEventListener('x', motion.guard(id, function () { ... }));
 *    RESET and level navigation call motion.cancelAll() then motion.newAttempt() (which bumps the trace too).
 *    A new FIRE or live retrace calls motion.newTrace(). A stamped animation whose stamp has gone stale is
 *    dropped at the next tick - cancel() runs, final() does NOT - and a guarded callback becomes a no-op.
 *    Verify before you mutate: motion.isCurrent(id). Never trust a callback's mere arrival.
 *
 * 8. DOCUMENT HIDDEN.  motion.documentHidden({ commit: fn }) does exactly four things, in order:
 *      1) cancels every decorative animation and decorative hold,
 *      2) settles every remaining presentation to its exact final state (draining chained holds),
 *      3) calls commit() - where the host commits the authoritative gameplay result and its discoveries,
 *      4) arms a single resume render.
 *    motion.documentVisible() then marks dirty once, so the settled state is drawn once and nothing is replayed.
 *
 * 9. REDUCED MOTION.  motion.setReducedMotion(true) mid-animation settles every live DECORATIVE animation
 *    immediately using its fallback() (or final() when it has none); presentations keep the timing they were
 *    started with. Durations: always derive them with motion.scaleMs(ms, fixedReducedMs). Passing the item's
 *    fixed reduced value as the second argument returns it UNSCALED, which is how the contract's
 *    "do not multiply those fallback durations by reducedMotion.durationScale again" is enforced mechanically.
 *
 * 10. TOKENS. Every number, duration, colour, angle and easing name comes from theme.motion (motion.tokens
 *     here). Nothing is inline. If the ledger does not have it, the art director has not specified it.
 *
 * 11. THE FLAT-VIEW INFORMATION BOUNDARY OUTRANKS ALL OF THE ABOVE. While render.isFlat(), no animation's
 *     timing, amplitude, colour, scale, delay or shape may be derived from terrain height, opening height,
 *     opening count or opening shape. The beam may encode its own traced altitude after a FIRE; nothing else
 *     may sample the terrain to choose a decorative effect. This registry cannot check that for you.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(root); }
  else { root.LaserMotion = factory(root); }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var G = (typeof globalThis !== 'undefined') ? globalThis : (root || {});

  function noop() {}
  function isFiniteNum(v) { return typeof v === 'number' && isFinite(v); }
  function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
  function defaultNow() {
    return (G.performance && G.performance.now) ? G.performance.now() : Date.now();
  }

  /* Drain limit for settleAll(): a choreography is hold -> animation -> hold -> animation. Sixteen passes is far
   * more than any sequence in MOTION-DIRECTION.md and guarantees settling terminates even if one is miswired. */
  var MAX_SETTLE_PASSES = 16;

  function create(opts) {
    opts = opts || {};
    var theme = opts.theme || G.LaserTheme || (root && root.LaserTheme);
    if (!theme || !theme.motion || typeof theme.easeByName !== 'function') {
      throw new Error('LaserMotion.create: theme with theme.motion and theme.easeByName is required');
    }
    var tokens = theme.motion;
    var now = opts.now || defaultNow;
    var dirty = opts.dirty || noop;
    var setT = opts.setTimeout || function (fn, ms) { return G.setTimeout(fn, ms); };
    var clearT = opts.clearTimeout || function (id) { return G.clearTimeout(id); };

    var anims = [], holds = [], byKey = {}, holdsByKey = {};
    var attemptId = 1, traceId = 1, seq = 0;
    var reduced = !!opts.reducedMotion;
    var hidden = false, pendingResume = false, disposed = false;
    var api;

    /* ------------------------------------------------------------------ stamps (contract 7) */
    function token() { return { attempt: attemptId, trace: traceId }; }
    /* A stamp is current when each field it names still matches. A null/undefined field means "do not care", so
     * a level-lifetime effect can stamp only the attempt and survive every retrace inside it. */
    function isCurrent(stamp) {
      if (!stamp) return true;
      if (stamp.attempt != null && stamp.attempt !== attemptId) return false;
      if (stamp.trace != null && stamp.trace !== traceId) return false;
      return true;
    }
    /* A new attempt bumps the trace too: a trace belongs to an attempt, so RESET must invalidate both. */
    function newAttempt() { attemptId++; traceId++; return attemptId; }
    function newTrace() { traceId++; return traceId; }
    function guard(stamp, fn) {
      var f = fn || noop;
      return function () { if (disposed || !isCurrent(stamp)) return undefined; return f.apply(this, arguments); };
    }

    /* ------------------------------------------------------------------ bookkeeping */
    function removeAnim(a) {
      var i = anims.indexOf(a);
      if (i >= 0) anims.splice(i, 1);
      if (a.key && byKey[a.key] === a) delete byKey[a.key];
    }
    function removeHold(h) {
      var i = holds.indexOf(h);
      if (i >= 0) holds.splice(i, 1);
      if (h.key && holdsByKey[h.key] === h) delete holdsByKey[h.key];
      if (h.timer) { clearT(h.timer); h.timer = 0; }
    }
    function markDirtyFor(a) { if (a.surface === 'webgl') dirty(); }

    function handleOf(a) {
      if (a.handle) return a.handle;
      a.handle = {
        id: a.id, key: a.key, role: a.role, surface: a.surface,
        isLive: function () { return !a.done; },
        pose: function () { return a.displayed; },
        cancel: function () { return cancelAnim(a); },
        settle: function () { return settleAnim(a); }
      };
      return a.handle;
    }
    var DEAD = { id: 0, key: null, role: 'presentation', surface: 'webgl',
      isLive: function () { return false; }, pose: function () { return undefined; },
      cancel: function () { return false; }, settle: function () { return false; } };

    /* ------------------------------------------------------------------ run (contract 2, 5, 6) */
    function run(spec) {
      if (disposed) return DEAD;
      if (!spec || typeof spec.update !== 'function') throw new TypeError('LaserMotion.run: spec.update is required');
      if (typeof spec.final !== 'function') throw new TypeError('LaserMotion.run: spec.final is required (the exact final state)');

      var start = isFiniteNum(spec.startMs) ? spec.startMs : now();
      if (isFiniteNum(spec.delayMs)) start += spec.delayMs;
      var dur = isFiniteNum(spec.durationMs) ? spec.durationMs
        : (isFiniteNum(spec.endMs) ? spec.endMs - start : null);
      if (!isFiniteNum(dur) || dur < 0) {
        throw new TypeError('LaserMotion.run: spec.durationMs or spec.endMs is required (an animation must end)');
      }

      var stamp = (spec.attempt != null || spec.trace != null) ? { attempt: spec.attempt, trace: spec.trace } : null;
      /* Stamped stale before it even started - a callback that lost its race. Release, never display. */
      if (stamp && !isCurrent(stamp)) { if (typeof spec.cancel === 'function') spec.cancel(); return DEAD; }

      var prev = spec.key ? byKey[spec.key] || null : null;
      if (prev) supersedeAnim(prev);

      var from = spec.from;
      if (typeof from === 'function') from = from(prev ? prev.displayed : undefined, prev ? handleOf(prev) : null);
      else if (from === undefined && prev) from = prev.displayed;

      var a = {
        id: ++seq, key: spec.key || null,
        role: spec.role === 'decorative' ? 'decorative' : 'presentation',
        surface: spec.surface === 'dom' ? 'dom' : 'webgl',
        stamp: stamp, startMs: start, durationMs: dur, endMs: start + dur,
        ease: theme.easeByName(spec.ease == null ? tokens.easing.linear : spec.ease),
        from: from, to: spec.to,
        update: spec.update, final: spec.final,
        cancel: typeof spec.cancel === 'function' ? spec.cancel : noop,
        fallback: typeof spec.fallback === 'function' ? spec.fallback : null,
        onDone: typeof spec.onDone === 'function' ? spec.onDone : noop,
        displayed: from, done: false, handle: null
      };
      anims.push(a);
      if (a.key) byKey[a.key] = a;
      markDirtyFor(a);
      return handleOf(a);
    }

    /* ------------------------------------------------------------------ one-shot holds (contract 4) */
    function hold(ms, then, o) {
      if (disposed) return DEAD;
      o = o || {};
      var stamp = (o.attempt != null || o.trace != null) ? { attempt: o.attempt, trace: o.trace } : null;
      if (stamp && !isCurrent(stamp)) return DEAD;
      var prevHold = o.key ? holdsByKey[o.key] || null : null;
      if (prevHold) { removeHold(prevHold); prevHold.done = true; prevHold.onDone('superseded'); }

      var h = {
        id: ++seq, key: o.key || null, isHold: true,
        role: o.role === 'decorative' ? 'decorative' : 'presentation',
        stamp: stamp, ms: Math.max(0, ms | 0),
        then: typeof then === 'function' ? then : noop,
        settle: typeof o.settle === 'function' ? o.settle : null,
        cancel: typeof o.cancel === 'function' ? o.cancel : noop,
        onDone: typeof o.onDone === 'function' ? o.onDone : noop,
        timer: 0, done: false
      };
      h.timer = setT(function () { h.timer = 0; fireHold(h); }, h.ms);
      holds.push(h);
      if (h.key) holdsByKey[h.key] = h;
      /* Deliberately NO dirty(): a hold is a stationary wait and must not schedule a frame. */
      return {
        id: h.id, key: h.key, role: h.role, surface: 'none',
        isLive: function () { return !h.done; }, pose: function () { return undefined; },
        cancel: function () { return cancelHold(h); },
        settle: function () { return settleHold(h); }
      };
    }
    function fireHold(h) {
      if (h.done) return;
      removeHold(h); h.done = true;
      if (!isCurrent(h.stamp)) { h.onDone('cancelled'); return; }   /* late callback from a superseded attempt */
      h.then();
      h.onDone('complete');
    }
    function cancelHold(h) {
      if (h.done) return false;
      removeHold(h); h.done = true;
      h.cancel();
      h.onDone('cancelled');
      return true;
    }
    /* Settling a hold runs its `settle` if it has one, otherwise its `then` - the choreography jumps straight to
     * the step it was waiting for. Anything that starts is settled by the drain loop in settleAll(). */
    function settleHold(h) {
      if (h.done) return false;
      removeHold(h); h.done = true;
      if (!isCurrent(h.stamp)) { h.onDone('cancelled'); return true; }
      (h.settle || h.then)();
      h.onDone('settled');
      return true;
    }

    /* ------------------------------------------------------------------ animation terminations */
    function completeAnim(a) {
      if (a.done) return false;
      removeAnim(a); a.done = true;                 /* remove FIRST: final() may start its successor */
      if (a.to !== undefined) a.displayed = a.to;
      a.final();
      markDirtyFor(a);
      a.onDone('complete');
      return true;
    }
    function settleAnim(a) {
      if (a.done) return false;
      removeAnim(a); a.done = true;
      if (a.to !== undefined) a.displayed = a.to;
      a.final();
      markDirtyFor(a);
      a.onDone('settled');
      return true;
    }
    function fallbackAnim(a) {
      if (a.done) return false;
      removeAnim(a); a.done = true;
      (a.fallback || a.final)();
      markDirtyFor(a);
      a.onDone('settled');
      return true;
    }
    function cancelAnim(a) {
      if (a.done) return false;
      removeAnim(a); a.done = true;
      a.cancel();                                   /* final() is NOT applied: the effect is abandoned */
      markDirtyFor(a);
      a.onDone('cancelled');
      return true;
    }
    /* Superseded: neither final() nor cancel(). The incoming animation with the same key inherits the visual and
     * continues from the pose the player can currently see. */
    function supersedeAnim(a) {
      if (a.done) return false;
      removeAnim(a); a.done = true;
      a.onDone('superseded');
      return true;
    }

    /* ------------------------------------------------------------------ the tick (contract 3, 5) */
    function tick(nowMs) {
      if (disposed) return false;
      var t = isFiniteNum(nowMs) ? nowMs : now();
      var list = anims.slice(), i, a, p, eased, ctx, v;
      for (i = 0; i < list.length; i++) {
        a = list[i];
        if (a.done) continue;
        if (a.stamp && !isCurrent(a.stamp)) { cancelAnim(a); continue; }   /* stale shot: release, do not display */
        if (t < a.startMs) continue;                                       /* delayMs: nothing displayed yet */
        if (t >= a.endMs) { completeAnim(a); continue; }
        p = a.durationMs > 0 ? clamp01((t - a.startMs) / a.durationMs) : 1;
        eased = a.ease(p);
        ctx = { progress: p, eased: eased, elapsedMs: t - a.startMs, durationMs: a.durationMs,
          from: a.from, to: a.to,
          value: (isFiniteNum(a.from) && isFiniteNum(a.to)) ? a.from + (a.to - a.from) * eased : undefined,
          nowMs: t, handle: handleOf(a), motion: api };
        v = a.update(eased, ctx);
        a.displayed = (v !== undefined) ? v : (ctx.value !== undefined ? ctx.value : eased);
      }
      return needsFrame();
    }

    /* ------------------------------------------------------------------ liveness (contract 3, 4) */
    function needsFrame() {
      for (var i = 0; i < anims.length; i++) if (anims[i].surface === 'webgl') return true;
      return false;
    }
    function isLive() { return anims.length > 0; }
    function busy() { return anims.length > 0 || holds.length > 0; }
    function count() {
      var w = 0, i;
      for (i = 0; i < anims.length; i++) if (anims[i].surface === 'webgl') w++;
      return { animations: anims.length, webgl: w, dom: anims.length - w, holds: holds.length };
    }
    function get(key) { var a = byKey[key]; return a ? handleOf(a) : null; }
    function has(key) { return !!byKey[key]; }

    /* ------------------------------------------------------------------ cancel / settle */
    function resolve(target) {
      if (!target) return null;
      if (typeof target === 'string') return byKey[target] || holdsByKey[target] || null;
      if (typeof target.id === 'number') {
        var i;
        for (i = 0; i < anims.length; i++) if (anims[i].id === target.id) return anims[i];
        for (i = 0; i < holds.length; i++) if (holds[i].id === target.id) return holds[i];
      }
      return null;
    }
    function cancel(target) {
      var it = resolve(target);
      if (!it) return false;
      return it.isHold ? cancelHold(it) : cancelAnim(it);
    }
    function settle(target) {
      var it = resolve(target);
      if (!it) return false;
      return it.isHold ? settleHold(it) : settleAnim(it);
    }
    function cancelRole(role) {
      var n = 0, la = anims.slice(), lh = holds.slice(), i;
      for (i = 0; i < lh.length; i++) if (lh[i].role === role && cancelHold(lh[i])) n++;
      for (i = 0; i < la.length; i++) if (la[i].role === role && cancelAnim(la[i])) n++;
      return n;
    }
    /* RESET and level navigation: cancel ALL presentation work. Nothing is settled, nothing is applied. */
    function cancelAll() {
      var n = 0, la = anims.slice(), lh = holds.slice(), i;
      for (i = 0; i < lh.length; i++) if (cancelHold(lh[i])) n++;
      for (i = 0; i < la.length; i++) if (cancelAnim(la[i])) n++;
      anims.length = 0; holds.length = 0; byKey = {}; holdsByKey = {};
      return n;
    }
    /* Settle everything to its final state, draining any choreography a settling hold starts. */
    function settleAll(o) {
      o = o || {};
      var n = 0, passes = 0, la, lh, i;
      while ((anims.length || holds.length) && passes++ < MAX_SETTLE_PASSES) {
        lh = holds.slice(); la = anims.slice();
        for (i = 0; i < lh.length; i++) {
          if (o.cancelDecorative && lh[i].role === 'decorative') { if (cancelHold(lh[i])) n++; }
          else if (settleHold(lh[i])) n++;
        }
        for (i = 0; i < la.length; i++) {
          if (o.cancelDecorative && la[i].role === 'decorative') { if (cancelAnim(la[i])) n++; }
          else if (settleAnim(la[i])) n++;
        }
      }
      if (anims.length || holds.length) cancelAll();   /* a miswired chain never keeps the scheduler alive */
      return n;
    }

    /* ------------------------------------------------------------------ reduced motion (contract 9) */
    function isReducedMotion() { return reduced; }
    function setReducedMotion(b) {
      b = !!b;
      if (b === reduced) return reduced;
      reduced = b;
      if (!b) return reduced;
      var la = anims.slice(), lh = holds.slice(), i;
      for (i = 0; i < lh.length; i++) if (lh[i].role === 'decorative') cancelHold(lh[i]);
      for (i = 0; i < la.length; i++) if (la[i].role === 'decorative') fallbackAnim(la[i]);
      return reduced;
    }
    /* The ONLY way to compute a duration. `fixedReducedMs` (theme.motion.reduced.*, theme.reducedMotion.cameraMs,
     * theme.beam-travel reduced clamps) is returned as-is, so durationScale can never be applied to it twice. */
    function scaleMs(ms, fixedReducedMs) {
      if (!reduced) return ms;
      if (isFiniteNum(fixedReducedMs)) return fixedReducedMs;
      var s = (theme.reducedMotion && isFiniteNum(theme.reducedMotion.durationScale)) ? theme.reducedMotion.durationScale : 1;
      return Math.round(ms * s);
    }
    /* Stationary holds are capped rather than scaled (theme.reducedMotion.maxHoldMs), matching main.js holdMs. */
    function holdMs(ms) {
      if (!reduced) return ms;
      var cap = (theme.reducedMotion && isFiniteNum(theme.reducedMotion.maxHoldMs)) ? theme.reducedMotion.maxHoldMs : ms;
      return Math.min(ms, cap);
    }

    /* ------------------------------------------------------------------ visibility (contract 8) */
    function documentHidden(o) {
      o = o || {};
      hidden = true;
      cancelRole('decorative');                 /* 1. decorative effects are abandoned */
      settleAll();                              /* 2. presentations reach their exact final state */
      if (typeof o.commit === 'function') o.commit();   /* 3. authoritative result + discoveries are committed */
      pendingResume = true;                     /* 4. one render on return, no replay */
      return true;
    }
    function documentVisible() {
      hidden = false;
      if (!pendingResume) return false;
      pendingResume = false;
      dirty();
      return true;
    }
    function isHidden() { return hidden; }

    /* ------------------------------------------------------------------ misc */
    function requestRender() { dirty(); }
    function easeFn(nameOrFn) { return theme.easeByName(nameOrFn); }
    function dispose() {
      if (disposed) return;
      cancelAll();
      disposed = true;
    }

    api = {
      __version: 1,
      /* scheduling */
      run: run, hold: hold, tick: tick,
      /* liveness - main.js loop() consults needsFrame() alongside render.needsFrame() */
      needsFrame: needsFrame, isLive: isLive, busy: busy, count: count, get: get, has: has,
      /* termination */
      cancel: cancel, cancelRole: cancelRole, cancelAll: cancelAll, settle: settle, settleAll: settleAll,
      /* stamps */
      token: token, newAttempt: newAttempt, newTrace: newTrace, isCurrent: isCurrent, guard: guard,
      attempt: function () { return attemptId; }, trace: function () { return traceId; },
      /* reduced motion */
      setReducedMotion: setReducedMotion, isReducedMotion: isReducedMotion, scaleMs: scaleMs, holdMs: holdMs,
      /* visibility */
      documentHidden: documentHidden, documentVisible: documentVisible, isHidden: isHidden,
      /* tokens and helpers */
      tokens: tokens, ease: easeFn, now: function () { return now(); }, requestRender: requestRender,
      dispose: dispose
    };
    return api;
  }

  return { __version: 1, create: create };
}));
