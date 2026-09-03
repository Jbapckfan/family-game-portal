/* Lasers 3D - orthographic camera rig: bounding-box auto-fit, minimum tappable cell, pan, zoom, presets.
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
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var DEG = Math.PI / 180;

  function create(opts) {
    var theme = opts.theme, size = opts.size, Core = root.LaserRenderCore;
    var CAM = theme.camera, R = opts.distance || 60;

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
      fitZoom: 40, userZoom: 1, preset: 'flat', view: 'working', anim: null, tween: null
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

    /* ------------------------------------------------------------------- pan */
    /* Screen dx moves the board with the finger: the look-at target slides the opposite way along screen-right, and
     * along the ground shadow of screen-up (which covers sin(e) of a screen pixel, hence the /se). */
    function panBy(dxPx, dyPx) {
      var se = basis(cam.az, cam.el), z = effectiveZoom();
      if (z <= 0) return;
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
    function endAnim() { if (cam.anim) { var res = cam.anim.resolve; cam.anim = null; res(); } }
    function endTween() { if (cam.tween) { var res = cam.tween.resolve; cam.tween = null; res(); } }
    function setPreset(name, o) {
      o = o || {};
      var P = CAM.presets[name] || CAM.presets.flat;
      var fromAz = cam.az, fromEl = cam.el;
      var dAz = ((P.azimuthDeg - fromAz + 540) % 360) - 180;
      endAnim(); endTween();
      cam.preset = name;
      if (!o.animate) { cam.az = P.azimuthDeg; cam.el = P.elevationDeg; refit(true); return Promise.resolve(); }
      var ms = o.durationMs || (name === 'tilt' ? CAM.motion.flatToTiltMs : CAM.motion.tiltToFlatMs), linear = false;
      if (reducedMotion) { ms = theme.reducedMotion.cameraMs; linear = true; }
      return new Promise(function (resolve) {
        cam.anim = { t: 0, ms: ms, linear: linear, fromAz: fromAz, dAz: dAz, fromEl: fromEl, toEl: P.elevationDeg, resolve: resolve };
      });
    }
    function orbit(dAz, dEl) {
      endAnim();
      cam.preset = null;
      cam.az = (cam.az + dAz / DEG) % 360;
      cam.el = Core.clamp(cam.el + dEl / DEG, CAM.orbit.elevationMinDeg, CAM.orbit.elevationMaxDeg);
      refit(false);       /* the fit EASES to the new orientation in step(); a hard snap here pumps during a drag */
    }
    function zoomBy(f) {
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
        a.t += dt * 1000;
        k = Math.min(1, a.t / a.ms); e = a.linear ? k : theme.easeCamera(k);
        cam.az = a.fromAz + a.dAz * e; cam.el = a.fromEl + (a.toEl - a.fromEl) * e;
        refit(true);       /* the orientation is already eased, so the fit can follow it exactly */
        if (k >= 1) { cam.anim = null; a.resolve(); }
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
    /* True while the rig still has work to do: a preset move, a view/fit tween, or the eased fit chasing a new
     * orientation. main uses it to decide whether to schedule another animation frame (dirty rendering). */
    function isAnimating() {
      if (cam.anim || cam.tween) return true;
      var t = targetFit();
      return Math.abs(t - cam.fitZoom) >= t * 0.001;
    }
    function getCamera() {
      return { azimuthDeg: cam.az, elevationDeg: cam.el, zoom: cam.userZoom, preset: cam.preset, view: cam.view,
        animating: !!(cam.anim || cam.tween), cellPx: getCellPx(), fitZoom: cam.fitZoom, effectiveZoom: effectiveZoom() };
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
      pan.set(0, 0, 0); cam.userZoom = 1; cam.view = 'working';   /* a level always opens tappable */
      endTween();
      refit(true);
    }

    return {
      camera: camera, up: upVec, right: rightVec, dir: dirVec, boardCenter: boardCenter, pan: pan,
      setBoard: setBoard, apply: apply, refit: refit, step: step,
      setPreset: setPreset, orbit: orbit, zoomBy: zoomBy, panBy: panBy, fitToBoard: fitToBoard, canFit: canFit,
      setViewMode: setViewMode, getViewMode: getViewMode, hasOverview: hasOverview,
      getCellPx: getCellPx, isFlat: isFlat, isAnimating: isAnimating, getCamera: getCamera, getBoardScreenBox: getBoardScreenBox,
      effectiveZoom: effectiveZoom, minCellZoom: minCellZoom, zoomLimits: zoomLimits,
      setReducedMotion: function (b) { reducedMotion = !!b; },
      getPan: function () { return { x: pan.x, y: pan.y, z: pan.z }; }
    };
  }

  root.LaserRenderCamera = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
