/* Lasers 3D - orthographic camera rig: bounding-box auto-fit, minimum tappable cell, pan, zoom, presets, and THE
 * REVEAL (MOTION-DIRECTION.md section 3).
 * Global: window.LaserRenderCamera. Classic script, ES2019. Needs THREE + LaserRenderCore + LaserTheme.
 *
 * DESIGN.md 11.2: the frustum is fitted to the board's PROJECTED bounding box in the CURRENT orientation (not to a
 * fixed padding on board width), leaving theme.camera.fitMarginPct of margin per side, so the board fills 92% of the
 * limiting canvas dimension. Cells are never shrunk below theme.camera.minCellPx; when the fit would go under it the
 * camera zooms so cells are exactly minCellPx and the board overflows, with panning to reach the rest.
 *
 * Frame of reference (INTERFACES-FRONTEND.md 1.2): game (x, y, z) -> three (x, z, -y); camera at azimuth a and
 * elevation e sits at boardCenter + R * (cos e sin a, sin e, cos e cos a). Screen-right is always the horizontal
 * (cos a, 0, -sin a); screen-up has a vertical part, and its ground shadow is (-sin a, 0, -cos a) shortened by sin e.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * THE REVEAL (MOTION-DIRECTION.md 3, "The reveal: the lie collapses"). Tilting is the move that costs the third
 * star, so a preset move is not one tween any more; it is a staged one, and every number below is a token:
 *
 *   0 .. m.reveal.prepareMs (96 ms)   the camera HOLDS at exactly FLAT. Nothing about the board moves. The only
 *                                     thing that changes is `intake`, the scalar the renderer multiplies into the
 *                                     beam glow (down toward m.reveal.beamGlowMinimum, smoothstep) - the intake of
 *                                     breath before the lie fails. render.js reads it through revealIntake().
 *   prepareMs .. camera.motion.flatToTiltMs (720 ms)   the spherical orbit to the TILT preset, on
 *                                     m.reveal.cameraEasing (easeInOutCubic). The complete move still lasts
 *                                     flatToTiltMs; the hold is inside it, not added to it.
 *
 * Returning to FLAT keeps the existing 620 ms `camera` easing and has NO preparatory hold. The free teaching
 * reveal names its own duration (900 ms) and therefore also gets no hold - "with no additional preparation hold".
 * Reduced motion collapses all of it to the existing 140 ms linear move with no anticipation and no beam dimming.
 *
 * The per-view framing rule (FLAT keeps the 34 px tapping floor, TILT frames the WHOLE board) is unchanged, but it
 * used to SWITCH the base zoom on the first frame of the move - a zoom punch on a board the document says must
 * "remain exactly FLAT". It is now blended across the same interval as the orbit (see setPreset).
 *
 * Scheduling: a move is one record with a start, an exact duration, an update, an exact final state and a cancel.
 * When the host has wired the one LaserMotion registry (opts.motion) the record is registered there and the
 * registry is its clock; otherwise it is advanced by step(dt) from the single main-loop frame, exactly like every
 * other renderer module. Either way isAnimating() goes false the instant it ends, so the dirty-driven loop stops.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var DEG = Math.PI / 180;

  function create(opts) {
    var theme = opts.theme, size = opts.size, Core = root.LaserRenderCore;
    var CAM = theme.camera, R = opts.distance || 60;
    /* MOTION-DIRECTION.md 3 token block (`m.reveal.*`) and the callable curves. theme.motion is pure data by
     * contract, so the easing NAMES in it resolve through theme.easeByName. */
    var MR = (theme.motion && theme.motion.reveal) || {};
    var MEASE = (theme.motion && theme.motion.easing) || {};
    /* The one animation registry (src/motion.js), when the host has wired it. Optional: without it the move is
     * advanced by step(dt) from the same single main-loop frame that already drives beam, pieces and fog. */
    var sched = opts.motion || null;
    function easeOf(name) { return theme.easeByName ? theme.easeByName(name) : theme.easeCamera; }
    var easeSmooth = easeOf(MEASE.smooth || 'smoothstep');

    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    var boardCenter = new THREE.Vector3(0, 0, 0);
    var fitPoints = new Float32Array([-0.5, 0, 0.5, 0.5, 0, -0.5]);

    var upVec = new THREE.Vector3(), rightVec = new THREE.Vector3(), dirVec = new THREE.Vector3();
    var groundUp = new THREE.Vector3(), negDir = new THREE.Vector3(), pan = new THREE.Vector3(), target = new THREE.Vector3();
    /* view: 'working' = the shipping default, cells never below theme.camera.minCellPx (the board overflows and the
     * player pans). 'overview' = the WHOLE board on screen at the bounding-box fit, cells allowed below the touch
     * floor because it is a planning view, not a tapping view. DESIGN.md 11.2 fixes 'working' as the default; the
     * view button toggles between the two. */
    var cam = {
      az: CAM.presets.flat.azimuthDeg, el: CAM.presets.flat.elevationDeg,
      fitZoom: 40, userZoom: 1, preset: 'flat', view: 'working', anim: null, tween: null,
      /* manual: the player has zoomed, panned, or pressed the view toggle since the level loaded, so the
       * per-preset default framing below must stop overriding them. Cleared only on setLevel. */
      manual: false
    };
    var extent = { hw: 1, hh: 1 };          /* world half-extents of the projected box, around boardCenter */
    var reducedMotion = false;

    /* ------------------------------------------------------------------ basis */
    function basis(azDeg, elDeg) {
      var a = azDeg * DEG, e = elDeg * DEG, se = Math.sin(e), ce = Math.cos(e), sa = Math.sin(a), ca = Math.cos(a);
      dirVec.set(ce * sa, se, ce * ca);
      upVec.set(-se * sa, ce, -se * ca);
      rightVec.crossVectors(negDir.copy(dirVec).negate(), upVec).normalize();
      groundUp.set(-sa, 0, -ca);
      return se;
    }

    /* Projected length of a unit board axis: 1 in FLAT, cos(view angle) under tilt. The SMALLER of the two board
     * axes is what a finger has to hit, so that is the number the minimum-cell rule uses. */
    function cellFactor() {
      var fx = 1 - dirVec.x * dirVec.x, fz = 1 - dirVec.z * dirVec.z;
      return Math.sqrt(Math.max(1e-6, Math.min(fx, fz)));
    }
    function minCellZoom() { return (CAM.minCellPx || 0) / cellFactor(); }

    /* ------------------------------------------------------------------- fit */
    function measure(azDeg, elDeg) {
      basis(azDeg, elDeg);
      var hw = 0, hh = 0, i, px, py, pz, dw, dh;
      for (i = 0; i < fitPoints.length; i += 3) {
        px = fitPoints[i] - boardCenter.x; py = fitPoints[i + 1] - boardCenter.y; pz = fitPoints[i + 2] - boardCenter.z;
        dw = Math.abs(px * rightVec.x + py * rightVec.y + pz * rightVec.z);
        dh = Math.abs(px * upVec.x + py * upVec.y + pz * upVec.z);
        if (dw > hw) hw = dw;
        if (dh > hh) hh = dh;
      }
      extent.hw = Math.max(1e-4, hw); extent.hh = Math.max(1e-4, hh);
      return extent;
    }
    function fitZoomFor(azDeg, elDeg) {
      var e = measure(azDeg, elDeg), m = 1 - 2 * (CAM.fitMarginPct || 0);
      return Math.min(size.w * m / (2 * e.hw), size.h * m / (2 * e.hh));
    }
    function targetFit() { return fitZoomFor(cam.az, cam.el); }
    /* The base zoom the board rests at. WORKING: the bounding-box fit, raised to the minimum-cell zoom when the fit
     * is tighter (DESIGN.md 11.2). OVERVIEW: the bounding-box fit itself, so the whole board is on screen. */
    function baseZoom() { return cam.view === 'overview' ? cam.fitZoom : Math.max(cam.fitZoom, minCellZoom()); }
    /* True when the two view states differ, i.e. the minimum-cell clamp is what is hiding part of the board. When
     * they are identical (a small board on a tablet) there is nothing to toggle to. */
    function hasOverview() { var f = targetFit(); return minCellZoom() > f * 1.001; }
    function zoomLimits() {
      var lo = cam.fitZoom * (CAM.zoom.minFactorOfFit || 1);
      return { lo: lo, hi: Math.max(lo, (CAM.zoom.maxCellPxMultiple || 3) * minCellZoom()) };
    }
    function effectiveZoom() {
      var lim = zoomLimits();
      return Core.clamp(baseZoom() * cam.userZoom, lim.lo, lim.hi);
    }

    /* The player has taken the framing. Besides latching cam.manual (which stops the per-preset default framing
     * from ever coming back), this releases the pan/zoom blend of a preset move that is still in flight, so a pinch
     * during the reveal is not overwritten a frame later by the move that was easing the framing under it. The
     * orbit itself continues: the player asked for the tilt. */
    function takeManualFraming() {
      cam.manual = true;
      if (cam.anim) { cam.anim.fromPan = null; cam.anim.fromZoom = null; }
    }

    /* ------------------------------------------------------------------- pan */
    /* Screen dx moves the board with the finger: the look-at target slides the opposite way along screen-right, and
     * along the ground shadow of screen-up (which covers sin(e) of a screen pixel, hence the /se). */
    function panBy(dxPx, dyPx) {
      endTween();
      var se = basis(cam.az, cam.el), z = effectiveZoom();
      if (z <= 0) return;
      takeManualFraming();               /* the player has chosen where to look; stop re-framing under them */
      pan.addScaledVector(rightVec, -dxPx / z);
      pan.addScaledVector(groundUp, dyPx / (z * Math.max(0.2, se)));
      clampPan();
      apply();
    }
    /* At least theme.camera.panMinVisiblePct of the board's projected box stays inside the canvas on each axis. */
    function clampPan() {
      var se = basis(cam.az, cam.el), z = effectiveZoom();
      measure(cam.az, cam.el);
      var hwPx = extent.hw * z, hhPx = extent.hh * z;
      var keep = CAM.panMinVisiblePct || 0.25;
      var maxX = hwPx + size.w / 2 - keep * Math.min(2 * hwPx, size.w);
      var maxY = hhPx + size.h / 2 - keep * Math.min(2 * hhPx, size.h);
      var aR = pan.dot(rightVec), aU = pan.dot(groundUp);
      var sx = -aR * z, sy = -aU * se * z;
      var cx = Core.clamp(sx, -maxX, maxX), cy = Core.clamp(sy, -maxY, maxY);
      if (cx !== sx || cy !== sy) {
        pan.set(0, 0, 0);
        pan.addScaledVector(rightVec, -cx / z);
        pan.addScaledVector(groundUp, -cy / (se * z));
      }
    }

    /* ---------------------------------------------------------------- apply */
    function apply() {
      basis(cam.az, cam.el);
      target.copy(boardCenter).add(pan);
      camera.position.copy(target).addScaledVector(dirVec, R);
      camera.up.copy(upVec);
      camera.lookAt(target);
      var z = effectiveZoom();
      camera.left = -size.w / 2 / z; camera.right = size.w / 2 / z;
      camera.top = size.h / 2 / z; camera.bottom = -size.h / 2 / z;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    }
    function refit(snap) {
      var t = targetFit();
      if (snap !== false) cam.fitZoom = t;
      clampPan();
      apply();
    }

    /* -------------------------------------------------------------- presets */
    /* A preset move (MOTION-DIRECTION.md 3). Four functions, and nothing else may write the move's state:
     *   advance(a, elapsedMs)  the update. Below prepareMs it writes ONLY the intake and the camera does not move.
     *   applyFinal(a)          the exact final state. Never "advance(a, total)" - the endpoint is written, not
     *                          interpolated, so a rounding error in the last frame cannot become the resting pose.
     *   abandon(a)             cancellation: the pose the eye can see is KEPT (a superseding move continues from
     *                          it), only the decorative intake is released.
     *   detach(a)              removes the record and resolves its promise exactly once, whatever ended it.
     */
    function advance(a, elapsedMs) {
      if (elapsedMs < a.prepareMs) {
        /* "0-96 ms: Remain exactly FLAT. No deformation or ripple. Camera holds." Not one camera value is touched
         * here. "Multiply existing beam-glow opacity toward 0.82, smoothstep, creating a brief intake." */
        a.intake = a.reveal ? easeSmooth(elapsedMs / a.prepareMs) : 0;
        return;
      }
      var k = a.orbitMs > 0 ? Math.min(1, (elapsedMs - a.prepareMs) / a.orbitMs) : 1;
      var e = a.linear ? k : a.ease(k);
      /* Spherical orbit around the board centre: azimuth and elevation are interpolated and the radius is fixed,
       * so the camera swings on the sphere rather than sliding through it (VISUAL-DIRECTION E). */
      cam.az = a.fromAz + a.dAz * e;
      cam.el = a.fromEl + (a.toEl - a.fromEl) * e;
      if (a.fromPan) pan.copy(a.fromPan).multiplyScalar(1 - e);
      if (a.fromZoom !== null) cam.userZoom = a.fromZoom + (1 - a.fromZoom) * e;
      /* "Beam-glow multiplier returns from 0.82 to 1 with r", r = theme.revealBlend(elevation). One scalar, read
       * by render.js; the rig never touches a beam material and never samples terrain for it. */
      a.intake = a.reveal ? 1 - theme.revealBlend(cam.el) : 0;
      refit(true);       /* the orientation is already eased, so the fit can follow it exactly */
    }
    function applyFinal(a) {
      cam.az = a.fromAz + a.dAz;
      cam.el = a.toEl;
      if (a.fromPan) pan.set(0, 0, 0);
      if (a.fromZoom !== null) cam.userZoom = 1;
      a.intake = 0;
      refit(true);
    }
    function abandon(a) { a.intake = 0; }
    function detach(a) {
      if (cam.anim === a) cam.anim = null;
      if (!a.settled) { a.settled = true; a.resolve(); }
    }
    function endAnim() {
      var a = cam.anim;
      if (!a) return;
      cam.anim = null;
      if (a.handle && sched) sched.cancel(a.handle);   /* runs cancel() -> abandon(), then onDone -> detach() */
      else abandon(a);
      detach(a);
    }
    function endTween() { if (cam.tween) { var res = cam.tween.resolve; cam.tween = null; res(); } }
    function setPreset(name, o) {
      o = o || {};
      var P = CAM.presets[name] || CAM.presets.flat;
      var fromAz = cam.az, fromEl = cam.el;
      var dAz = ((P.azimuthDeg - fromAz + 540) % 360) - 180;
      var wasFlat = isFlat();          /* read BEFORE anything moves: only flat -> tilt is "the reveal" */
      endAnim(); endTween();
      cam.preset = name;
      basis(cam.az, cam.el);           /* effectiveZoom()/minCellZoom() read dirVec; make it current, not inherited */
      /* Each view gets the framing it is FOR. FLAT is where the player taps individual cells, so it wants the
       * working zoom that keeps cells at the touch floor. TILT is bought with the third star and its whole job is
       * showing the shape of the board at once, so it wants the entire board on screen - panning around a zoomed
       * isometric board to reconstruct the structure in your head is strictly worse than just looking at it.
       * Suppressed once the player has taken manual control of the framing (cam.manual). */
      var effBefore = effectiveZoom(), fromPan = null, fromZoom = null;
      if (!cam.manual) {
        var want = (name === 'tilt') ? 'overview' : 'working';
        if (cam.view !== want) {
          cam.view = want;
          if (!o.animate) { pan.set(0, 0, 0); cam.userZoom = 1; }
          else {
            /* baseZoom() STEPS here (working clamps to minCellPx, overview does not), and switching it at t = 0
             * was a zoom punch on the very first frame of the reveal - against "Remain exactly FLAT" and "Do not
             * add camera zoom punches". Pre-load userZoom so the effective zoom is unchanged at t = 0, then let
             * the move ease it back to 1 alongside the orbit. Same technique as applyViewMode(). */
            fromPan = pan.clone();
            var nb = baseZoom(), lim = zoomLimits();
            cam.userZoom = nb > 0 ? Core.clamp(effBefore, lim.lo, lim.hi) / nb : 1;
            fromZoom = cam.userZoom;
          }
        }
      }
      if (!o.animate) { cam.az = P.azimuthDeg; cam.el = P.elevationDeg; refit(true); return Promise.resolve(); }
      var ms = o.durationMs || (name === 'tilt' ? CAM.motion.flatToTiltMs : CAM.motion.tiltToFlatMs);
      var linear = false, easeFn = theme.easeCamera, prepareMs = 0, isReveal = false;
      /* THE REVEAL is flat -> tilt and only that: m.reveal.prepareMs of held anticipation, then
       * m.reveal.cameraEasing over the rest, so "the complete move still lasts camera.motion.flatToTiltMs".
       * A caller that names its own durationMs owns the whole timing - that is the free teaching reveal, which the
       * document gives 900 ms "with no additional preparation hold" - and o.prepareMs overrides either way.
       * Returning to FLAT keeps the existing camera easing and has no preparatory hold at all. */
      if (name === 'tilt' && wasFlat) {
        isReveal = true;
        easeFn = easeOf(MR.cameraEasing);
        prepareMs = (o.prepareMs != null) ? o.prepareMs : (o.durationMs ? 0 : (MR.prepareMs || 0));
      } else if (o.prepareMs) prepareMs = o.prepareMs;
      /* Reduced motion: "Omit anticipation, beam dimming... Use the existing 140 ms linear camera transition with
       * the same elevation-based information boundary." */
      if (reducedMotion) { ms = theme.reducedMotion.cameraMs; linear = true; prepareMs = 0; isReveal = false; }
      prepareMs = Core.clamp(prepareMs, 0, ms);
      var a = { t: 0, prepareMs: prepareMs, orbitMs: Math.max(0, ms - prepareMs), linear: linear, ease: easeFn,
        fromAz: fromAz, dAz: dAz, fromEl: fromEl, toEl: P.elevationDeg, fromPan: fromPan, fromZoom: fromZoom,
        reveal: isReveal, intake: 0, handle: null, settled: false, resolve: null };
      var promise = new Promise(function (resolve) { a.resolve = resolve; });
      cam.anim = a;
      if (sched) {
        var total = a.prepareMs + a.orbitMs;
        a.handle = sched.run({
          key: 'camera.preset', role: 'presentation', surface: 'webgl',
          durationMs: total, ease: MEASE.linear || 'linear',
          update: function (t) { advance(a, t * total); },
          final: function () { applyFinal(a); },
          cancel: function () { abandon(a); },
          onDone: function () { detach(a); }
        });
      }
      return promise;
    }
    function orbit(dAz, dEl) {
      endAnim(); endTween();
      var oldAz = cam.az, oldEl = cam.el;
      cam.preset = null;
      cam.az = (cam.az + dAz / DEG) % 360;
      cam.el = Core.clamp(cam.el + dEl / DEG, CAM.orbit.elevationMinDeg, CAM.orbit.elevationMaxDeg);
      refit(false);       /* the fit EASES to the new orientation in step(); a hard snap here pumps during a drag */
      return oldAz !== cam.az || oldEl !== cam.el;
    }
    function zoomBy(f) {
      endTween();
      takeManualFraming();               /* the player has chosen a zoom; stop re-framing under them */
      var lim = zoomLimits(), base = baseZoom();
      var eff = Core.clamp(base * cam.userZoom * (f || 1), lim.lo, lim.hi);
      cam.userZoom = eff / base;
      clampPan();
      apply();
    }
    /* Move to `name` ('working' | 'overview'), re-framing the board in the CURRENT orientation and dropping the pan.
     * Animated moves keep the on-screen zoom continuous across the base-zoom step by pre-loading userZoom with the
     * ratio the tween then eases back to 1. */
    function applyViewMode(name, o) {
      o = o || {};
      endTween();
      cam.manual = true;                 /* an explicit view toggle is manual control */
      var effBefore = effectiveZoom();
      cam.view = name === 'overview' ? 'overview' : 'working';
      cam.fitZoom = targetFit();
      if (!o.animate || reducedMotion) {
        pan.set(0, 0, 0); cam.userZoom = 1; refit(true);
        return Promise.resolve();
      }
      var newBase = baseZoom(), lim = zoomLimits();
      cam.userZoom = newBase > 0 ? Core.clamp(effBefore, lim.lo, lim.hi) / newBase : 1;
      var fromPan = pan.clone(), fromZoom = cam.userZoom, ms = o.durationMs || CAM.motion.fitMs || 420;
      clampPan(); apply();
      return new Promise(function (resolve) {
        cam.tween = { t: 0, ms: ms, fromPan: fromPan, fromZoom: fromZoom, resolve: resolve };
      });
    }
    function fitToBoard(o) { return applyViewMode(cam.view, o); }
    function setViewMode(name, o) { return applyViewMode(name, o); }
    function getViewMode() { return cam.view; }
    function canFit() { return Math.abs(cam.userZoom - 1) > 1e-3 || pan.lengthSq() > 1e-6; }

    /* ----------------------------------------------------------------- step */
    function step(dt) {
      var a = cam.anim, w = cam.tween, k, e;
      if (w) {
        w.t += dt * 1000;
        k = Math.min(1, w.t / w.ms); e = theme.easeCamera(k);
        pan.copy(w.fromPan).multiplyScalar(1 - e);
        cam.userZoom = w.fromZoom + (1 - w.fromZoom) * e;
        if (k >= 1) { pan.set(0, 0, 0); cam.userZoom = 1; cam.tween = null; refit(true); w.resolve(); }
        else refit(true);
      }
      if (a) {
        /* When the host wired the registry it is the clock: motion.tick() already ran advance()/applyFinal() for
         * this frame, before the render. Advancing here too would double the move's speed. */
        if (a.handle) return;
        a.t += dt * 1000;
        if (a.t >= a.prepareMs + a.orbitMs) { cam.anim = null; applyFinal(a); detach(a); }
        else advance(a, a.t);
        return;
      }
      if (w) return;
      var t = targetFit();
      if (t !== cam.fitZoom) {
        var tau = (CAM.fitSmoothingMs || 0) / 1000;
        if (tau <= 0 || Math.abs(t - cam.fitZoom) < t * 0.001) cam.fitZoom = t;
        else cam.fitZoom += (t - cam.fitZoom) * (1 - Math.exp(-dt / tau));
        clampPan();
        apply();
      }
    }

    /* ----------------------------------------------------------------- info */
    function getCellPx() { basis(cam.az, cam.el); return effectiveZoom() * cellFactor(); }
    function isFlat() { return cam.el >= 90 - CAM.flatEpsilonDeg; }
    /* MOTION-DIRECTION.md 3: how far into the reveal's anticipation we are, in [0, 1]. It is 0 at rest, 0 for
     * every move that is not a flat -> tilt reveal, and exactly 0 again the instant the move ends. render.js turns
     * it into the beam-glow multiplier; nothing else reads it. It is a function of TIME and camera ELEVATION only
     * - never of terrain height, opening height, opening count or opening shape. */
    function revealIntake() { return cam.anim ? (cam.anim.intake || 0) : 0; }
    /* True while the rig still has work to do: a preset move, a view/fit tween, or the eased fit chasing a new
     * orientation. main uses it to decide whether to schedule another animation frame (dirty rendering). */
    function isAnimating() {
      if (cam.anim || cam.tween) return true;
      var t = targetFit();
      return Math.abs(t - cam.fitZoom) >= t * 0.001;
    }
    function getCamera() {
      return { azimuthDeg: cam.az, elevationDeg: cam.el, zoom: cam.userZoom, preset: cam.preset, view: cam.view,
        pan: {x:pan.x,y:pan.y,z:pan.z}, manual:cam.manual, animating: !!(cam.anim || cam.tween), cellPx: getCellPx(), fitZoom: cam.fitZoom, effectiveZoom: effectiveZoom(),
        revealIntake: revealIntake() };
    }
    /* The board's projected box in canvas CSS px: {width, height, centerX, centerY} with the canvas centre at (0,0). */
    function getBoardScreenBox() {
      var se = basis(cam.az, cam.el), z = effectiveZoom();
      measure(cam.az, cam.el);
      var aR = pan.dot(rightVec), aU = pan.dot(groundUp);
      return { width: 2 * extent.hw * z, height: 2 * extent.hh * z, centerX: -aR * z, centerY: aU * se * z };
    }
    function setBoard(center, points) {
      boardCenter.copy(center);
      fitPoints = points && points.length >= 3 ? points : fitPoints;
      pan.set(0, 0, 0); cam.userZoom = 1; cam.view = 'working'; cam.manual = false;   /* a level always opens tappable */
      endAnim();     /* level navigation cancels presentation work: a move aimed at the old board must not finish */
      endTween();
      refit(true);
    }

    function restoreCamera(c) {
      if (!c || !Number.isFinite(c.azimuthDeg) || !Number.isFinite(c.elevationDeg)) return;
      endAnim(); endTween();
      cam.az = c.azimuthDeg % 360;
      cam.el = Core.clamp(c.elevationDeg, CAM.orbit.elevationMinDeg, 90);
      cam.view = c.view === 'overview' ? 'overview' : 'working';
      /* Reloading an automatic view must still let TILT fit the whole board. Older saves without
       * this flag keep their chosen framing, as before. */
      cam.manual = c.manual !== false;
      cam.userZoom = Number.isFinite(c.zoom) ? Core.clamp(c.zoom, 0.1, 10) : 1;
      var p = c.pan || {};
      pan.set(Number.isFinite(p.x) ? p.x : 0, 0, Number.isFinite(p.z) ? p.z : 0);
      refit(true); clampPan(); apply();
    }

    return {
      camera: camera, up: upVec, right: rightVec, dir: dirVec, boardCenter: boardCenter, pan: pan,
      setBoard: setBoard, apply: apply, refit: refit, step: step,
      setPreset: setPreset, orbit: orbit, zoomBy: zoomBy, panBy: panBy, fitToBoard: fitToBoard, canFit: canFit,
      restoreCamera: restoreCamera,
      setViewMode: setViewMode, getViewMode: getViewMode, hasOverview: hasOverview,
      getCellPx: getCellPx, isFlat: isFlat, isAnimating: isAnimating, getCamera: getCamera, getBoardScreenBox: getBoardScreenBox,
      revealIntake: revealIntake,
      effectiveZoom: effectiveZoom, minCellZoom: minCellZoom, zoomLimits: zoomLimits,
      setReducedMotion: function (b) { reducedMotion = !!b; },
      getPan: function () { return { x: pan.x, y: pan.y, z: pan.z }; }
    };
  }

  root.LaserRenderCamera = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
