/* Lasers 3D - the two camera choreographies main drives, kept out of the integrator.
 * Global: window.LaserMainCamera. Classic script, ES2019 (Safari 15). Needs a LaserRender instance and LaserTheme;
 * no DOM, no Three.js of its own.
 *
 *  - the one-time free reveal (DESIGN.md 3.5): hold, roll to TILT, pulse the telling cell, roll back to FLAT. It is
 *    EXCLUSIVE (review S6): main disables input, modals and the level change for its duration, and only records the
 *    lesson as seen once `done` actually runs, so an interruption leaves it to replay.
 *  - the OVERVIEW / WORKING view toggle (DESIGN.md 11.2): boards run to 24x24 and the camera clamps to the 34 px
 *    touch floor, so on a phone most of a big board is off screen. WORKING is that tappable default; OVERVIEW zooms
 *    out to the whole-board fit for planning. `viewToggle()` names where a press would GO, so the button can label
 *    itself truthfully, and returns null when there is nothing to go to.
 */
(function (root) {
  'use strict';

  function create(opts) {
    var theme = opts.theme, render = opts.render;
    var motion = opts.motion || null;
    var hold = opts.hold || function (ms) { return ms; };
    var play = opts.play || function () {};
    var dirty = opts.dirty || function () {};
    var alive = opts.alive || function () { return true; };
    var token = 0, holds = [];

    /* THE CHOREOGRAPHY HOLDS. MOTION-DIRECTION.md's Implementation contract: "Use one-shot timers for stationary
     * choreography holds. A hold does not render." These used to be bare setTimeouts, which meant that RESET, a
     * level change and the tab going away could not reach them - the timer fired anyway and only the `live()`
     * token stopped it writing. They are motion.hold()s now: still one-shot, still rendering nothing, but tracked,
     * so cancelAll() and documentHidden() genuinely end them. Without a registry the old timer is the fallback,
     * because a reveal that never advances is worse than one that is merely harder to cancel. */
    function wait(ms) {
      return new Promise(function (res) {
        if (!motion) { setTimeout(res, ms); return; }
        var st = motion.token();
        holds.push(motion.hold(motion.holdMs(ms), res, { role: 'presentation', attempt: st.attempt, cancel: function () {} }));
      });
    }
    function dropHolds() {
      var i;
      for (i = 0; i < holds.length; i++) if (holds[i] && holds[i].cancel) holds[i].cancel();
      holds.length = 0;
    }

    /* Where a press of the view button would take us, or null to hide it. */
    function viewToggle() {
      if (!render) return null;
      if (!render.hasOverview()) return render.canFit() ? 'fit' : null;   /* nothing to toggle to: plain re-frame */
      return render.getViewMode() === 'overview' ? 'working' : 'overview';
    }
    /* Performs the move. Returns the destination that was applied, or null when the button should not have been
     * there at all. 'fit' re-frames the CURRENT mode, which is the old FIT behaviour. */
    function toggleView(o) {
      var next = viewToggle();
      if (!next) return null;
      render.setViewMode(next === 'fit' ? render.getViewMode() : next, o || { animate: true });
      dirty();
      return next;
    }

    /* Runs the reveal. `done` is called ONLY if the whole choreography finishes uninterrupted. */
    function playReveal(cell, done) {
      var C = theme.camera.revealChoreography, mine = ++token;
      dropHolds();
      /* Every step of the chain verifies its attempt AND its own token before it changes anything: a step from a
       * superseded reveal must be a no-op, never a late write into the current attempt (contract 7). */
      var stamp = motion ? motion.token() : null;
      function live() { return mine === token && alive() && (!motion || motion.isCurrent(stamp)); }
      wait(hold(C.holdAfterTraceMs)).then(function () {
        if (!live()) return;
        play('reveal'); dirty();
        return render.setCameraPreset('tilt', { animate: true, durationMs: C.toTiltMs }).then(function () {
          if (!live()) return;
          if (cell) render.pulseCell(cell, { color: C.pulseColor });
          dirty();
          return wait(hold(C.holdAtTiltMs));
        }).then(function () {
          if (!live()) return;
          dirty();
          return render.setCameraPreset('flat', { animate: true, durationMs: C.backToFlatMs });
        }).then(function () { if (live()) done(); });
      });
      dirty();
    }
    function cancelReveal() { token++; dropHolds(); }

    return { __version: 1, viewToggle: viewToggle, toggleView: toggleView, playReveal: playReveal, cancelReveal: cancelReveal };
  }

  root.LaserMainCamera = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
