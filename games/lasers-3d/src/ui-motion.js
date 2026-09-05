/* Lasers 3D - the DOM half of the motion language: MOTION-DIRECTION.md section 6 (the win) and the section 7
 * readout, plus the section 5 tray-card shake. Global: window.LaserUiMotion. Classic script, ES2019 (Safari 15).
 * Loads after src/theme.js and src/motion.js, before src/ui.js. No THREE, no DOM at load time.
 *
 * WHY THE KEYFRAMES ARE GENERATED. "CSS animation parameters must be generated from these tokens." A hand-written
 * `cubic-bezier(...)` would be a fourth easing curve invented in this file; instead each @keyframes rule is
 * SAMPLED from the curve theme.ease already defines (easeOutCubic, smoothstep, bell...) and played back with
 * `animation-timing-function: linear`, so what the browser draws is the document's curve and nothing else.
 *
 * WHY CSS AND NOT THE REGISTRY'S update(). A 'dom' animation in LaserMotion is advanced by motion.tick(), which
 * only runs while the render loop is scheduling frames - and section 6 requires the opposite: "The board stops
 * rendering as soon as its target and beam effects finish, even while the modal animation continues." So the DOM
 * work runs on the compositor as bounded CSS with `animation-fill-mode: both` (it settles and stays settled), and
 * the registry supplies the CHOREOGRAPHY through one-shot holds, which are setTimeout-driven and need no frames.
 * Every hold is tracked, so cancelAll() on RESET and documentHidden() reach all of it.
 */
(function (root) {
  'use strict';
  var doc = root.document;

  /* ------------------------------------------------------------------ token -> @keyframes */
  var STEPS = 20;                    /* 5% apart: below the threshold where linear segments are visible */
  function keyframes(name, steps, at) {
    var out = '@keyframes ' + name + '{', i, t;
    for (i = 0; i <= steps; i++) {
      t = i / steps;
      out += (Math.round(t * 10000) / 100) + '%{' + at(t) + '}';
    }
    return out + '}';
  }
  /* A rule whose stops are the document's own progress list, not a sampled curve: the invalid shake names its
   * keyframes outright ([0, +1, -1, +1, 0] at [0, 0.25, 0.50, 0.75, 1], linear). */
  function stopFrames(name, progress, at) {
    var out = '@keyframes ' + name + '{', i;
    for (i = 0; i < progress.length; i++) out += (Math.round(progress[i] * 10000) / 100) + '%{' + at(i) + '}';
    return out + '}';
  }
  function px(v) { return (Math.round(v * 1000) / 1000) + 'px'; }
  function num(v) { return String(Math.round(v * 10000) / 10000); }

  function css(theme) {
    var m = theme.motion, W = m.win, V = theme.ui.victory, PL = m.placement, INV = theme.ui.button.invalid;
    var ease = theme.ease, out = '';

    /* --- section 6: the modal's existing 360 ms fade and 12 px rise, easeOutCubic --- */
    out += keyframes('l3d-victory-rise', STEPS, function (t) {
      var e = ease.easeOutCubic(t);
      return 'opacity:' + num(e) + ';transform:translateY(' + px(V.riseFromPx * (1 - e)) + ')';
    });

    /* --- section 6: each earned star. Scale runs through the existing [0.72, 1.12, 1] at [0, 0.55, 1], easeOutCubic
     * INTO the peak and smoothstep INTO rest; opacity is a separate linear fade over starFadeMs. --- */
    var sp = W.starProgress, sv = V.starScale, peak = sp[1];
    out += keyframes('l3d-star-award', STEPS, function (t) {
      var s;
      if (t <= peak) s = sv[0] + (sv[1] - sv[0]) * ease.easeOutCubic(peak > 0 ? t / peak : 1);
      else s = sv[1] + (sv[2] - sv[1]) * ease.smoothstep((t - peak) / (1 - peak));
      var o = W.starMs > 0 ? Math.min(1, (t * W.starMs) / W.starFadeMs) : 1;
      return 'opacity:' + num(o) + ';transform:scale(' + num(s) + ')';
    });

    /* --- section 6: ONE cyan modal light ring. Diameter 0.25 -> 1.25 of the modal's smaller dimension
     * (--l3d-ring-base, measured in JS), easeOutCubic; its 1 px stroke fades linearly from 0.18 to zero. --- */
    var d0 = W.ringDiameterFactors[0], d1 = W.ringDiameterFactors[1];
    out += keyframes('l3d-ring', STEPS, function (t) {
      var f = d0 + (d1 - d0) * ease.easeOutCubic(t), size = 'calc(var(--l3d-ring-base, 0px) * ' + num(f) + ')';
      return 'width:' + size + ';height:' + size + ';opacity:' + num(W.ringOpacity * (1 - t));
    });

    /* --- section 7: the post-FIRE readout, and the reduced-motion "everything together" fade. Both are linear,
     * so they need no sampling at all. --- */
    out += '@keyframes l3d-fade-in{from{opacity:0}to{opacity:1}}';

    /* --- section 5: the illegal-placement shake, on the selected tray card only. --- */
    out += stopFrames('l3d-shake', PL.invalidProgress, function (i) {
      return 'transform:translateX(' + px(PL.invalidOffsets[i] * INV.shakePx) + ')';
    });

    /* --- the rules that use them. Durations are token values written into the sheet, never guessed. --- */
    var riseMs = V.fadeMs, starMs = W.starMs, ringMs = W.ringMs, redMs = m.reduced.fadeMs;
    var shakeMs = INV.shakes * INV.shakeMs;
    out += '#modal-victory .modal{animation:none}';
    out += '#modal-victory[data-motion="full"] .modal{animation:l3d-victory-rise ' + riseMs + 'ms linear both}';
    out += '#modal-victory[data-motion="reduced"] .modal{animation:l3d-fade-in ' + redMs + 'ms linear both}';
    /* Empty stars are stationary and fully present the whole time; only an EARNED star is awarded. */
    out += '.victory-stars{position:relative;z-index:1}';
    out += '.victory-stars .star{opacity:0;transform:scale(' + num(V.starScale[0]) + ')}';
    out += '.victory-stars .star[data-earned="false"]{opacity:1;transform:none;animation:none}';
    out += '.victory-stars .star.is-awarded{animation:l3d-star-award ' + starMs + 'ms linear both}';
    out += '#modal-victory[data-motion="reduced"] .victory-stars .star.is-awarded{animation:l3d-fade-in ' + redMs + 'ms linear both;transform:none}';
    /* The ring is centred behind the stars and clipped to the modal. One outline, no blur, no repeat. */
    out += '.light-ring{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:inherit}';
    out += '.light-ring::after{content:"";position:absolute;left:50%;top:var(--l3d-ring-y,50%);width:0;height:0;' +
      'transform:translate(-50%,-50%);border:' + W.ringStrokePx + 'px solid ' + W.ringColor + ';border-radius:50%;opacity:0;box-sizing:border-box}';
    out += '.light-ring.is-live::after{animation:l3d-ring ' + ringMs + 'ms linear both}';
    /* Section 7: the readout fades in where it already sits. Opacity only - its row is reserved, so nothing moves. */
    out += '#readout.is-entering{animation:l3d-fade-in ' + m.failure.readoutFadeMs + 'ms linear both}';
    /* Section 5: the danger border stays for the existing 400 ms; the shake is the two 70 ms beats. */
    out += '.is-invalid{border-color:var(--color-danger)!important;box-shadow:0 0 0 1px var(--color-danger)!important}';
    out += '.is-shaking{animation:l3d-shake ' + shakeMs + 'ms linear 1}';
    /* prefers-reduced-motion is also honoured structurally (the JS below never adds .is-shaking, and the modal is
     * marked data-motion="reduced"), but a page that swaps the OS setting mid-animation still lands here. */
    out += '@media (prefers-reduced-motion: reduce){.is-shaking{animation:none}' +
      '.light-ring.is-live::after{animation:none;opacity:0}' +
      '#modal-victory[data-motion="full"] .modal{animation:l3d-fade-in ' + redMs + 'ms linear both}' +
      '.victory-stars .star.is-awarded{animation:l3d-fade-in ' + redMs + 'ms linear both;transform:none}}';
    return out;
  }

  function install(theme) {
    if (!doc || doc.getElementById('lasers3d-motion')) return;
    var st = doc.createElement('style');
    st.id = 'lasers3d-motion';
    st.textContent = css(theme);
    doc.head.appendChild(st);
  }

  /* ------------------------------------------------------------------ the choreography */
  function create(o) {
    var theme = o.theme, motion = o.motion || null;
    var m = theme.motion, W = m.win, V = theme.ui.victory;
    var held = [];

    function reduced() { return motion ? motion.isReducedMotion() : !!o.reducedMotion; }
    /* One-shot, stationary, tracked. A hold renders nothing and never keeps the loop alive, which is exactly what
     * section 6 asks for: the board is allowed to go to sleep while the modal is still animating. */
    function after(ms, key, fn) {
      if (!motion) { fn(); return; }
      /* `cancel` runs the step too. A star records an EARNED condition, not decoration: abandoning the sequence
       * (RESET, a level change, the tab going away) must still leave the star the player won on screen. */
      held.push(motion.hold(motion.holdMs(ms), fn, { key: key, role: 'presentation', cancel: fn, attempt: motion.token().attempt }));
    }
    function cancel() {
      for (var i = 0; i < held.length; i++) if (held[i] && held[i].cancel) held[i].cancel();
      held.length = 0;
    }
    function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

    /* Section 6. W0 + win.modalDelayMs has already elapsed when the host opens the modal; from here the sequence is
     * rise, then the star awards at their existing offsets, then one ring behind the first star. Nothing loops and
     * nothing is left running: every rule uses `both`, so each element simply stops at its final state. */
    function victory(nodes, opts) {
      cancel();
      var backdrop = nodes.backdrop, modal = nodes.modal, stars = nodes.stars, ring = nodes.ring;
      var earned = stars ? Array.prototype.slice.call(stars.querySelectorAll('.star[data-earned="true"]')) : [];
      var soft = reduced() || (opts && opts.reduced);
      /* Clear then set, so a second win in the same session starts the rise again instead of matching a rule the
       * element is already under. */
      if (backdrop) { backdrop.removeAttribute('data-motion'); void backdrop.offsetWidth; backdrop.setAttribute('data-motion', soft ? 'reduced' : 'full'); }
      if (ring) ring.classList.remove('is-live');
      if (soft) {
        /* "Fade in the modal and all earned stars together over 120 ms, linear." No stagger, no scaling, no ring. */
        earned.forEach(function (s) { restart(s, 'is-awarded'); });
        return;
      }
      var delays = V.starDelaysMs;
      earned.forEach(function (s, i) {
        var d = delays[Math.min(i, delays.length - 1)];
        var start = function () {
          restart(s, 'is-awarded');
          if (i !== 0 || !ring) return;
          sizeRing(modal, stars, ring);
          restart(ring, 'is-live');
          /* The ring is removed rather than left as a settled 0-opacity element, exactly as the document says. */
          after(W.ringMs, 'ui.win.ring', function () { ring.classList.remove('is-live'); });
        };
        if (d <= 0) after(V.fadeMs, 'ui.win.star0', start);        /* "Modal fully visible" is the zero of the offsets */
        else after(V.fadeMs + d, 'ui.win.star' + i, start);
      });
    }
    /* Diameter is a fraction of the MODAL's smaller dimension, and the ring is centred behind the stars. */
    function sizeRing(modal, stars, ring) {
      if (!modal || !ring) return;
      var mw = modal.offsetWidth || 0, mh = modal.offsetHeight || 0;
      var base = Math.min(mw, mh);
      ring.style.setProperty('--l3d-ring-base', base + 'px');
      if (stars) ring.style.setProperty('--l3d-ring-y', (stars.offsetTop + stars.offsetHeight / 2) + 'px');
    }

    /* Section 7, step 2: the readout fades in where it already is. */
    function readout(el) {
      if (!el) return;
      if (reduced()) { el.classList.remove('is-entering'); return; }
      restart(el, 'is-entering');
    }

    /* Section 5, last row: the shake is the selected tray card's, and only the card's. */
    function shake(el) {
      if (!el || reduced()) return;
      restart(el, 'is-shaking');
    }

    return { victory: victory, readout: readout, shake: shake, cancel: cancel, reduced: reduced,
      setMotion: function (x) { motion = x || null; } };
  }

  root.LaserUiMotion = { __version: 1, install: install, css: css, create: create };
}(typeof self !== 'undefined' ? self : this));
