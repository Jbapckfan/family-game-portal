/* Lasers 3D - MOTION-DIRECTION.md section 10 and "What to cut first": the adaptive decorative-degradation ladder.
 * Global: window.LaserQuality (CommonJS export for node tests). Classic script, ES2019 (Safari 15).
 * Pure logic - no DOM, no Three.js, no timers, no dependency but theme.motion.quality/budget tokens.
 *
 * ============================================================================================================
 * WHAT THIS IS, AND THE TWO THINGS IT MUST NEVER DO
 * ============================================================================================================
 * The document sets 60 fps as an acceptance TARGET and then says, in as many words, that the specification alone
 * does not guarantee it. So the build measures itself and gives up decoration in a fixed order rather than
 * dropping frames on a slow phone. This module is only the decision; the host owns every cut function.
 *
 *  1. IT NEVER TOUCHES INFORMATION. The ladder's last rung is the document's own reduced-motion presentation,
 *     which still shows every logical event, complete diagnostic route, discovery, target state and star
 *     condition. "Never cut the flat-view information boundary, unknown-cell masking, departure length, beam
 *     altitude encoding, input responsiveness, or the final transition back to zero frames."
 *  2. IT NEVER CLIMBS BACK INSIDE AN ATTEMPT (budget.restoreWithinAttempt is false and stays false). Quality that
 *     oscillates is worse than quality that is merely low: the picture would change under the player's hands
 *     mid-shot. reset() exists for the host to call at an attempt boundary, and nowhere else.
 *
 * MEASUREMENT. sample(intervalMs) takes the interval between two CONSECUTIVE ACTIVE frames. The host must not
 * feed it a stationary hold or a background-tab gap - the document excludes both explicitly, and either would
 * look like a 300 ms frame and cut decoration off a machine that is perfectly fast. When budget.sampleFrames
 * samples have accumulated, their MEDIAN (not their mean: one compositor hiccup must not spend a tier) is
 * compared with budget.degradeMedianMs. Over it, exactly one tier goes and the window is cleared - "reassess
 * after another full sample window".
 *
 * THE LADDER is theme.motion.quality.cutOrder, verbatim, with its one two-step rung expanded: 'pixel-ratio'
 * caps the device pixel ratio at quality.degradedDprMax and then, after another failed window, at
 * quality.floorDprMax. Every step is cumulative and each is applied exactly once.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LaserQuality = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
    if (!n) return 0;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }

  function create(opts) {
    opts = opts || {};
    var theme = opts.theme;
    if (!theme || !theme.motion) throw new Error('LaserQuality.create: theme with theme.motion is required');
    var Q = theme.motion.quality, B = theme.motion.budget;
    var apply = opts.apply || function () {};

    /* cutOrder verbatim, with the pixel-ratio rung expanded into its two documented caps. Each entry is one step:
     * `name` is the cutOrder label the host switches on, `dpr` the cap that step asks for (pixel-ratio only). */
    var steps = [];
    for (var i = 0; i < Q.cutOrder.length; i++) {
      var name = Q.cutOrder[i];
      if (name === 'pixel-ratio') { steps.push({ name: name, dpr: Q.degradedDprMax }); steps.push({ name: name, dpr: Q.floorDprMax }); }
      else steps.push({ name: name, dpr: null });
    }

    var win = [], level = 0, applied = [];

    /* Feed ONLY consecutive active-frame intervals. Returns the step just applied, or null. */
    function sample(intervalMs) {
      if (typeof intervalMs !== 'number' || !isFinite(intervalMs) || intervalMs <= 0) return null;
      if (level >= steps.length) return null;
      win.push(intervalMs);
      if (win.length < B.sampleFrames) return null;
      var med = median(win);
      win.length = 0;                                   /* a full window is spent whether or not it cost a tier */
      if (med <= B.degradeMedianMs) return null;
      var step = steps[level++];
      applied.push(step.name);
      apply(step.name, step);
      return step;
    }

    /* An attempt boundary - and ONLY an attempt boundary - may clear the window. It does not restore quality:
     * budget.restoreWithinAttempt is false, and nothing in the document ever raises a tier back. */
    function reset() { win.length = 0; }

    return {
      __version: 1,
      sample: sample, reset: reset,
      level: function () { return level; },
      steps: function () { return steps.slice(); },
      appliedCuts: function () { return applied.slice(); },
      windowSize: function () { return win.length; },
      isCut: function (name) { return applied.indexOf(name) >= 0; }
    };
  }

  return { __version: 1, create: create, median: median };
}));
