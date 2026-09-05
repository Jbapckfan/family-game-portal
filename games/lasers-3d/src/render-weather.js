/* Lasers 3D - weather: MOTION-DIRECTION.md section 4, "life after the hand leaves".
 * Global: window.LaserWeather. Classic script, ES2019 (Safari 15). No THREE, no canvas, no dependency but
 * src/theme.js (tokens) and src/motion.js (the registry). Load it after both.
 *
 * ============================================================================================================
 * WHY THIS IS THE MOST DANGEROUS EFFECT IN THE BUILD, AND WHAT KEEPS IT SAFE
 * ============================================================================================================
 * Weather is motion at rest on a board of up to 576 columns. Done naively it is simultaneously the easiest way to
 * blow the frame budget, the easiest way to turn a column's height into a timing code, and the easiest way to
 * leave a phone rendering for ever. Section 4 bounds it deliberately and this module obeys those bounds literally:
 *
 *  1. IT IS NOT ON THE BOARD AT ALL. Two DOM flecks, 2 x 1 CSS px, in 6 px rails immediately OUTSIDE the canvas's
 *     top and bottom edges, clipped to those rails. They never pass over the board, so there is no per-column
 *     anything, nothing samples the terrain, and the flat-view information boundary is untouchable from here.
 *  2. IT COSTS NO WEBGL FRAME. The visual is two bounded compositor animations - transform and opacity only, one
 *     iteration, no fill - so it is registered as a `dom` animation: tracked, cancellable and settleable by the
 *     registry, but it never marks the scene dirty and never counts toward motion.needsFrame(). Nothing here
 *     paints a canvas, blurs, gradients, or asks for a frame.
 *  3. IT ENDS, AND ITS END DOES NOT DEPEND ON A FRAME EVER HAPPENING. This is the subtle one. The registry only
 *     advances animations inside motion.tick(), which main.js calls from a rendered frame - and a `dom` animation
 *     asks for no frames, so if weather were only an animation its completion could never be reached and its
 *     flecks would sit in the DOM with `will-change` set for ever. So the burst's clock is a motion.hold(): a
 *     one-shot stationary timer that renders nothing. Whichever of the two gets there first tears the burst down
 *     and releases the other; teardown is idempotent.
 *  4. IT NEVER RESTARTS ITSELF (theme.motion.policy.weatherSelfRestart is false and stays false). One burst on
 *     board-ready and one after a completed interaction settles. A new interaction CANCELS the burst in flight;
 *     the host schedules one fresh burst when that interaction settles. Bursts are never enqueued, so the worst
 *     case is one burst outstanding, ending no later than delaysMs[1] + ms = 2720 ms after the settle.
 *
 * Host contract (three calls):
 *   weather.settled()     the board first became ready, or a player interaction has finished settling -> one burst
 *   weather.interrupt()   new input -> cancel whatever is in flight now; do NOT queue a replacement
 *   weather.setReducedMotion(on)   on = true cancels the burst in flight and creates no more (reducedEnabled)
 */
(function (root) {
  'use strict';

  var KEY = 'weather', END_KEY = 'weather.end';
  var DEFAULT_OBSTACLES = ['#hud', '#readout', '#tray', '.menu-link', '#sound'];

  function noop() {}

  function inert() {
    return { __version: 1, settled: function () { return false; }, interrupt: noop,
      setReducedMotion: noop, isRunning: function () { return false; },
      rails: function () { return 0; }, dispose: noop };
  }

  function create(opts) {
    opts = opts || {};
    var theme = opts.theme || root.LaserTheme;
    var motion = opts.motion;
    var doc = opts.document || root.document;
    var canvas = opts.canvas;
    if (!theme || !theme.motion || !motion || !doc || !canvas) return inert();

    var W = theme.motion.weather;
    var Z = (theme.ui && theme.ui.zIndex && theme.ui.zIndex.badge) || 50;
    var host = opts.host || doc.body;
    var sel = opts.obstacles || DEFAULT_OBSTACLES;
    var reduced = !!opts.reducedMotion;
    var rails = null, flecks = null, playing = [], handle = null, ender = null, running = false;

    /* ---- the two rails ------------------------------------------------------------------------------------ */
    /* Built once and reused. Nothing is created or destroyed per burst; between bursts both rails are display:none
     * with no `will-change`, which is what "no running CSS animations" means in practice. */
    function ensure() {
      if (rails) return;
      rails = []; flecks = [];
      var top = (W.railPx - W.fleckSizePx[1]) / 2, i, rail, f;
      for (i = 0; i < 2; i++) {
        rail = doc.createElement('div');
        rail.className = 'l3d-weather';
        rail.setAttribute('aria-hidden', 'true');
        rail.style.cssText = 'position:fixed;overflow:hidden;pointer-events:none;display:none;' +
          'height:' + W.railPx + 'px;z-index:' + Z + ';';
        f = doc.createElement('div');
        f.style.cssText = 'position:absolute;left:0;top:' + top + 'px;opacity:0;' +
          'width:' + W.fleckSizePx[0] + 'px;height:' + W.fleckSizePx[1] + 'px;background:' + W.color + ';';
        rail.appendChild(f);
        host.appendChild(rail);
        rails.push(rail); flecks.push(f);
      }
    }

    /* Section 4: "exclude HUD, tray, and Menu hit areas ... Omit a rail if no unobstructed space exists." The rail
     * is measured against the live layout every burst, because the readout row appears and disappears with a shot
     * and the tray reflows between portrait and landscape. */
    function obstacles() {
      var out = [], i, j, list, r;
      for (i = 0; i < sel.length; i++) {
        list = doc.querySelectorAll(sel[i]);
        for (j = 0; j < list.length; j++) {
          if (list[j].hidden) continue;
          r = list[j].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) out.push(r);
        }
      }
      return out;
    }
    function clear(band, obs) {
      var i, o;
      if (band.top < 0 || band.left < 0 || band.width < W.travelXPx + W.fleckSizePx[0]) return false;
      if (band.top + W.railPx > (root.innerHeight || 0) || band.left + band.width > (root.innerWidth || 0)) return false;
      for (i = 0; i < obs.length; i++) {
        o = obs[i];
        if (band.left < o.right && band.left + band.width > o.left &&
            band.top < o.bottom && band.top + W.railPx > o.top) return false;
      }
      return true;
    }
    /* The two candidate bands, in token order: index 0 is the top rail, index 1 the bottom one. */
    function bands() {
      var c = canvas.getBoundingClientRect();
      return [{ top: c.top - W.railPx, left: c.left, width: c.width },
        { top: c.bottom, left: c.left, width: c.width }];
    }

    /* ---- one burst ---------------------------------------------------------------------------------------- */
    /* Every number below is a token: startX, delaysMs, travelXPx, ms, opacityStops, progressStops, iterations.
     * Transform is written at every opacity stop from progressStops so the whole keyframe list is explicit and the
     * travel stays linear whatever a browser does with partial keyframes. */
    function build() {
      var obs = obstacles(), list = bands(), used = [], i, k, frames, band, f;
      ensure();
      for (i = 0; i < 2; i++) {
        band = list[i];
        if (!clear(band, obs)) { rails[i].style.display = 'none'; continue; }
        rails[i].style.display = 'block';
        rails[i].style.top = band.top + 'px';
        rails[i].style.left = band.left + 'px';
        rails[i].style.width = band.width + 'px';
        f = flecks[i];
        if (typeof f.animate !== 'function') { rails[i].style.display = 'none'; continue; }
        f.style.left = (band.width * W.startX[i]) + 'px';
        f.style.willChange = 'transform, opacity';
        frames = [];
        for (k = 0; k < W.progressStops.length; k++) {
          frames.push({ offset: W.progressStops[k], opacity: W.opacityStops[k],
            transform: 'translateX(' + (W.travelXPx * W.progressStops[k]) + 'px)' });
        }
        playing.push(f.animate(frames, { duration: W.ms, delay: W.delaysMs[i], iterations: W.iterations,
          easing: theme.motion.easing.linear, fill: 'none' }));
        used.push(W.delaysMs[i] + W.ms);
      }
      return used;
    }

    /* Idempotent teardown: cancel the compositor animations, drop `will-change`, hide the rails. Called from the
     * registry's final(), from its cancel(), from the hold's cancel and from interrupt(); whichever arrives first
     * does the work and the rest are no-ops. */
    function quiet() {
      var i;
      for (i = 0; i < playing.length; i++) { try { playing[i].cancel(); } catch (e) { /* already gone */ } }
      playing.length = 0;
      if (flecks) {
        for (i = 0; i < flecks.length; i++) { flecks[i].style.willChange = ''; flecks[i].style.opacity = '0'; }
        for (i = 0; i < rails.length; i++) rails[i].style.display = 'none';
      }
      running = false;
    }
    function release() {
      var e = ender; ender = null;
      if (e) e.cancel();
      handle = null;
    }

    function stop() {
      var h = handle;
      handle = null;
      release();
      if (h) h.cancel(); else quiet();
      quiet();
    }

    function settled() {
      stop();                                        /* coalesce: never two bursts, never a queue */
      if (!W.enabled || (reduced && !W.reducedEnabled)) return false;
      var used = build(), total = 0, i, st;
      if (!used.length) return false;                /* no unobstructed space: both rails omitted */
      for (i = 0; i < used.length; i++) if (used[i] > total) total = used[i];
      running = true;
      st = motion.token();
      handle = motion.run({ key: KEY, role: 'decorative', surface: 'dom', attempt: st.attempt,
        durationMs: total, update: noop, final: quiet, cancel: quiet, fallback: quiet,
        onDone: function () { release(); } });
      /* The clock. A hold renders nothing and holds no lease; it is the only thing that can end a `dom` animation
       * on a board that has stopped asking for frames - which, after weather, is every board. */
      ender = motion.hold(total, function () { if (handle) handle.settle(); else quiet(); },
        { key: END_KEY, role: 'decorative', attempt: st.attempt, cancel: quiet });
      return true;
    }

    return {
      __version: 1,
      settled: settled,
      interrupt: stop,
      setReducedMotion: function (on) { reduced = !!on; if (reduced && !W.reducedEnabled) stop(); },
      isRunning: function () { return running; },
      rails: function () { return rails ? rails.slice() : []; },
      dispose: function () {
        stop();
        if (rails) { for (var i = 0; i < rails.length; i++) if (rails[i].parentNode) rails[i].parentNode.removeChild(rails[i]); }
        rails = null; flecks = null;
      }
    };
  }

  root.LaserWeather = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
