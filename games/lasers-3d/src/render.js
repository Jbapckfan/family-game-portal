/* Lasers 3D - renderer facade (INTERFACES-FRONTEND.md section 1).
 * Global: window.LaserRender. Classic script, ES2019 (Safari 15).
 * Load order: vendor/three.min.js, src/theme.js, src/render-core.js, src/render-camera.js, src/render-terrain.js,
 *             src/render-pieces.js, src/render-beam.js, src/render.js.
 * World mapping (FROZEN): game (x, y, z) -> three (x, z, -y). Camera up (0,1,0); FLAT = north up, east right.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var DEG = Math.PI / 180;

  function create(opts) {
    var canvas = opts.canvas, theme = opts.theme || root.LaserTheme;
    var Core = root.LaserRenderCore;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { throw new Error('webgl-unavailable'); }
    if (!renderer.getContext()) throw new Error('webgl-unavailable');
    renderer.outputColorSpace = THREE[theme.renderer.outputColorSpace];
    renderer.toneMapping = THREE[theme.renderer.toneMapping];
    renderer.toneMappingExposure = theme.renderer.toneMappingExposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE[theme.renderer.shadowMapType];
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    /* DESIGN.md 15: one fog-of-war state for the whole renderer - a w x d byte texture every fogged material reads.
     * It is created before the modules that sample it so terrain and pieces can bind its uniforms at construction,
     * and it is INERT (uFogOn = 0) on every level that does not set `dark`. */
    var fog = Core.createFog(theme);
    var terrain = root.LaserRenderTerrain.create(theme, fog);
    var pieces = root.LaserRenderPieces.create(theme, fog);
    var beam = root.LaserRenderBeam.create(theme);
    /* The reveal moves geometry (a column grows out of the ground, its outline rides up with it), which needs a
     * vertex texture fetch. Every GL this game ships on has one; a hypothetical one that does not still gets the
     * whole fog, it just arrives as a cross-fade in place. Asked once, here, rather than guessed in a shader. */
    try {
      var glc = renderer.getContext();
      fog.setRise((glc.getParameter(glc.MAX_VERTEX_TEXTURE_IMAGE_UNITS) | 0) > 0);
    } catch (eVtf) { fog.setRise(false); }
    scene.add(terrain.group); scene.add(pieces.group); scene.add(beam.group);
    beam.onLit(function (index) { pieces.setTargetLit(index, true); });

    /* Procedural environment (no texture files): a navy studio with the rig's key/rim/fill as soft spots, so
     * brushed metal and glass have something to reflect. Strength follows the reveal blend. */
    var ENV_STRENGTH = 0.9, envMaterials = [];
    function makeEnvironment() {
      var c = document.createElement('canvas'); c.width = 256; c.height = 128;
      var ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, LR.hemisphere.skyColor); g.addColorStop(0.45, theme.palette.backgroundRadialLight); g.addColorStop(1, LR.hemisphere.groundColor);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 128);
      function spot(x, y, rad, color) { var r = ctx.createRadialGradient(x, y, 0, x, y, rad); r.addColorStop(0, color); r.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = r; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      spot(80, 28, 46, LR.key.color); spot(196, 44, 30, LR.rim.color); spot(40, 56, 26, LR.fill.color);
      var tex = new THREE.CanvasTexture(c); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
      var pmrem = new THREE.PMREMGenerator(renderer), env = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose(); tex.dispose();
      scene.environment = env;
      var tm = terrain.materials, pm = pieces.materials;
      envMaterials = [tm.floor, tm.top, tm.side, pm.housing, pm.emitterBody, pm.socket];
      pieces.types().forEach(function (t) { if (pm.face[t]) envMaterials.push(pm.face[t]); });
      envMaterials.forEach(function (m) { m.envMapIntensity = 0; });
      return env;
    }

    /* ---- lights (TILT rig; intensities scale with reveal) ---- */
    var LR = theme.lightRig.tilt, S = theme.lightRig.shadow, lights = {};
    var lightGroup = new THREE.Group(); scene.add(lightGroup);
    var boardCenter = new THREE.Vector3(0, 0, 0), lightTarget = new THREE.Object3D(); lightGroup.add(lightTarget);
    lights.hemi = new THREE.HemisphereLight(new THREE.Color(LR.hemisphere.skyColor), new THREE.Color(LR.hemisphere.groundColor), 0);
    lights.key = new THREE.DirectionalLight(new THREE.Color(LR.key.color), 0);      /* shadow-casting part */
    lights.keyFlat = new THREE.DirectionalLight(new THREE.Color(LR.key.color), 0);  /* shadowless part (shadow opacity blend) */
    lights.rim = new THREE.DirectionalLight(new THREE.Color(LR.rim.color), 0);
    lights.fill = new THREE.PointLight(new THREE.Color(LR.fill.color), 0, LR.fill.distance, LR.fill.decay);
    lights.ambient = new THREE.AmbientLight(new THREE.Color(LR.ambient.color), 0);
    var mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 0;
    var mapSize = mem > S.deviceMemoryThresholdGB ? S.mapSizeHighMem : S.mapSizeLowMem;
    lights.key.castShadow = false;
    lights.key.shadow.mapSize.set(mapSize, mapSize);
    lights.key.shadow.bias = S.bias; lights.key.shadow.normalBias = S.normalBias;
    lights.key.target = lightTarget; lights.keyFlat.target = lightTarget; lights.rim.target = lightTarget;
    for (var lk in lights) if (Object.prototype.hasOwnProperty.call(lights, lk)) lightGroup.add(lights[lk]);

    function placeLights(w, d) {
      boardCenter.set((w - 1) / 2, 0, -(d - 1) / 2);
      lightTarget.position.copy(boardCenter);
      function at(light, p) { light.position.set(boardCenter.x + p[0], boardCenter.y + p[2], boardCenter.z - p[1]); }
      at(lights.key, LR.key.position); at(lights.keyFlat, LR.key.position); at(lights.rim, LR.rim.position); at(lights.fill, LR.fill.position);
      var half = Math.max(w, d) * 0.75 + S.cameraPaddingCells + 2, sc = lights.key.shadow.camera;
      sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 0.5; sc.far = 60;
      sc.updateProjectionMatrix();
    }
    var envTexture = makeEnvironment();

    /* ---- camera rig (src/render-camera.js) ---- */
    var size = { w: 300, h: 300, dpr: 1 };
    var rig = root.LaserRenderCamera.create({ theme: theme, size: size });
    var camera = rig.camera;
    var level = null, reducedMotion = !!(theme.reducedMotion && root.matchMedia && root.matchMedia(theme.reducedMotion.mediaQuery).matches);
    var appliedReveal = -1;
    var projVec = new THREE.Vector3();   /* scratch: no per-call allocation */
    rig.setReducedMotion(reducedMotion);
    fog.setInstant(reducedMotion);   /* prefers-reduced-motion: a cell is simply known, with no arrival at all */

    function setCameraPreset(name, o) { return rig.setPreset(name, o); }
    function isFlat() { return rig.isFlat(); }
    function getShadingBlend() { return theme.revealBlend(rig.getCamera().elevationDeg); }
    function getCamera() { return rig.getCamera(); }

    /* ---- reveal (VISUAL-DIRECTION.md D) ---- */
    function applyReveal(r) {
      if (r === appliedReveal) return;
      appliedReveal = r;
      terrain.applyReveal(r); pieces.applyReveal(r);
      envMaterials.forEach(function (m) { m.envMapIntensity = ENV_STRENGTH * r; });
      var so = Core.smoothstep(0.25, 0.65, r);
      lights.hemi.intensity = LR.hemisphere.intensity * r;
      lights.key.intensity = LR.key.intensity * r * so;
      lights.keyFlat.intensity = LR.key.intensity * r * (1 - so);
      lights.rim.intensity = LR.rim.intensity * r;
      lights.fill.intensity = LR.fill.intensity * r;
      lights.ambient.intensity = LR.ambient.intensity * r;
      var shadows = r > S.updateAboveReveal;
      if (lights.key.castShadow !== shadows) lights.key.castShadow = shadows;
      renderer.shadowMap.enabled = shadows;
    }

    /* ---- screen mapping ---- */
    function ndc(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      return { x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -((clientY - rect.top) / rect.height) * 2 + 1 };
    }
    function pickCell(clientX, clientY) {
      if (!level) return null;
      var n = ndc(clientX, clientY);
      return terrain.pick(n.x, n.y, camera);   /* analytic ray/plane per height level: O(4), not O(cells) */
    }
    function projectCell(cell, zOffset) {
      var rect = canvas.getBoundingClientRect();
      var p = projVec.set(cell.x, terrain.heightAt(cell.x, cell.y) + (zOffset || 0), -cell.y).project(camera);
      return { x: rect.left + (p.x + 1) / 2 * rect.width, y: rect.top + (1 - p.y) / 2 * rect.height };
    }

    /* ---- level / content ---- */
    function setLevel(parsed) {
      level = parsed;
      placeLights(parsed.size.w, parsed.size.d);
      /* The fog is sized and cleared BEFORE the content is built, so nothing is ever drawn against another level's
       * knowledge for a frame. A level opens LIT: main calls setDarkness() straight after with the level's own flag
       * and whatever the player already knew (DESIGN.md 15.1 - discovery survives RESET and re-entry). */
      fog.setBoard(parsed.size.w, parsed.size.d, !!parsed.dark);
      terrain.build(parsed);
      pieces.setLevel(parsed, terrain.heightAt);
      beam.clear();
      appliedReveal = -1;
      rig.setBoard(boardCenter, terrain.fitPoints());
    }

    /* ---- DARKNESS (DESIGN.md 15) ------------------------------------------------------------------------------
     * main owns WHAT is known (it is game state, it is saved, and it survives RESET); the renderer owns only how a
     * known cell arrives. `known` is the full set to hold - seeded from the emitter and the targets and restored
     * from the save - and it is applied INSTANTLY, because a level opening with thirty cells easing in at once
     * would read as a title card rather than as a board. revealCells() is the animated one, called as the beam
     * head reaches each cell.
     *
     * The camera fit is deliberately NOT re-derived from the known set. It is built once per level from the
     * terrain silhouette (render-terrain.buildFitPoints), so it cannot pump as cells arrive - and under the
     * top-down FLAT camera the silhouette carries no height information to leak in the first place. */
    function setDarkness(o) {
      o = o || {};
      if (!level) return;
      fog.setBoard(level.size.w, level.size.d, !!o.dark);
      if (o.known) fog.learnAll(o.known, true);
      pieces.applyFog();
    }
    function revealCells(cells) {
      if (!cells || !cells.length) return false;
      var changed = fog.learnAll(cells, false);
      if (changed) pieces.applyFog();
      return changed;
    }
    function fogState() {
      return { dark: fog.isDark(), known: fog.count(), total: fog.total() };
    }
    function setPlaced(placed) { pieces.setPlaced(placed); }
    /* Beam motion parameters: two frozen objects (normal / reduced motion), nothing allocated per frame. */
    var MOTION_NORMAL = { cellsPerSecond: theme.beam.travel.cellsPerSecond, liveRetraceMs: theme.beam.travel.liveRetraceMs,
      minDurationMs: theme.beam.travel.minDurationMs, maxDurationMs: theme.beam.travel.maxDurationMs };
    var MOTION_REDUCED = { cellsPerSecond: theme.reducedMotion.beamTravelCellsPerSecond, liveRetraceMs: theme.beam.travel.liveRetraceMs * theme.reducedMotion.durationScale,
      minDurationMs: theme.reducedMotion.beamTravelMinDurationMs, maxDurationMs: theme.reducedMotion.beamTravelMaxDurationMs };
    function motion() { return reducedMotion ? MOTION_REDUCED : MOTION_NORMAL; }
    function setBeam(result, o) {
      pieces.resetTargets();
      if (!result) { beam.clear(); return; }
      o = o || {};
      beam.set(result, { animate: !!o.animate, fired: !!o.fired, level: level }, motion());
    }

    function resize(w, h, dpr) {
      size.w = Math.max(1, w | 0); size.h = Math.max(1, h | 0); size.dpr = Math.min(dpr || 1, theme.renderer.maxDevicePixelRatio);
      renderer.setPixelRatio(size.dpr);
      renderer.setSize(size.w, size.h, true);
      rig.refit(true);
    }

    var view = { zoom: 1, up: rig.up, quaternion: camera.quaternion, camera: camera };
    function frame(dt) {
      dt = Math.min(0.05, Math.max(0, dt || 0));
      rig.step(dt);
      applyReveal(getShadingBlend());
      var speed = reducedMotion ? 1 / theme.reducedMotion.durationScale : 1;
      if (fog.step(dt * speed)) pieces.applyFog();   /* the arrival eases; reduced motion snaps it (setReducedMotion) */
      view.zoom = rig.effectiveZoom();
      pieces.frame(dt, speed, view);
      beam.frame(dt, view, motion());
      renderer.render(scene, camera);
    }
    /* Dirty rendering (main owns the loop): true while ANY of the renderer's own animations still has work to do -
     * a camera preset move, a view/fit tween, the eased fit chasing a new orientation, the travelling beam, an
     * end-state effect, a target fading between lit states, or a reveal pulse. main schedules a frame whenever it
     * changes state and keeps scheduling while this is true, so a static board costs nothing. */
    function needsFrame() { return rig.isAnimating() || beam.isAnimating() || pieces.isAnimating() || fog.isAnimating(); }

    /* ---- tray icons: the piece's physical model, seen from an angle that shows the panel's SLOPE ---- */
    /* The panel hinge runs along the '/' diagonal, so the old camera (azimuth 45) looked straight into it and MIRROR,
     * WEDGE and DIP all came out as the same plain rectangle. theme.piece.trayIcon stands ~40 deg off the hinge at a
     * low elevation instead: MIRROR reads upright, WEDGE rises to the right, DIP falls to the right. One camera and
     * one frustum for all three (fitted to the union of their bounds) so they compare as a set. */
    var iconCache = {}, iconSpan = 0;
    function iconBasis(out) {
      var TI = theme.piece.trayIcon, e = TI.elevationDeg * DEG, a = TI.azimuthDeg * DEG;
      out.dir.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
      out.up.set(-Math.sin(e) * Math.sin(a), Math.cos(e), -Math.sin(e) * Math.cos(a));
      out.right.crossVectors(out.dir.clone().negate(), out.up).normalize();
      return out;
    }
    /* Half-span of the frustum: the largest projected extent over all three models, so no icon is cropped and the
     * three are drawn at the same scale. */
    function iconHalfSpan() {
      if (iconSpan) return iconSpan;
      var b = iconBasis({ dir: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3() });
      var lookY = theme.piece.trayIcon.lookAtY, span = 0.1;
      pieces.types().forEach(function (t) {
        var m = pieces.trayModel(t);
        m.updateMatrixWorld(true);
        var box = new THREE.Box3().setFromObject(m), p = new THREE.Vector3(), i;
        for (i = 0; i < 8; i++) {
          p.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
          p.y -= lookY;
          span = Math.max(span, Math.abs(p.dot(b.right)), Math.abs(p.dot(b.up)));
        }
        Core.disposeObject(m);
      });
      iconSpan = span / (1 - 2 * theme.piece.trayIcon.marginPct);
      return iconSpan;
    }
    function snapshotTrayIcon(type, sizePx) {
      var key = type + ':' + sizePx;
      if (iconCache[key]) return iconCache[key];
      var out = '';
      try {
        var sc = new THREE.Scene(), model = pieces.trayModel(type);
        sc.add(model);
        sc.environment = scene.environment;
        sc.add(new THREE.HemisphereLight(new THREE.Color(LR.hemisphere.skyColor), new THREE.Color(LR.hemisphere.groundColor), LR.hemisphere.intensity));
        var key2 = new THREE.DirectionalLight(new THREE.Color(LR.key.color), LR.key.intensity); key2.position.set(-5, 6, 2); sc.add(key2);
        var rim = new THREE.DirectionalLight(new THREE.Color(LR.rim.color), LR.rim.intensity); rim.position.set(4, 3, -4); sc.add(rim);
        var span = iconHalfSpan(), TI = theme.piece.trayIcon;
        var c = new THREE.OrthographicCamera(-span, span, span, -span, 0.1, 50);
        var b = iconBasis({ dir: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3() });
        c.position.copy(b.dir).multiplyScalar(10); c.position.y += TI.lookAtY;
        c.up.copy(b.up);
        c.lookAt(0, TI.lookAtY, 0); c.updateMatrixWorld();
        var rt = new THREE.WebGLRenderTarget(sizePx, sizePx);
        var prevTarget = renderer.getRenderTarget(), prevShadow = renderer.shadowMap.enabled;
        renderer.shadowMap.enabled = false;
        renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, c);
        var buf = new Uint8Array(sizePx * sizePx * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, sizePx, sizePx, buf);
        renderer.setRenderTarget(prevTarget); renderer.shadowMap.enabled = prevShadow;
        var cv = document.createElement('canvas'); cv.width = sizePx; cv.height = sizePx;
        var ctx = cv.getContext('2d'), img = ctx.createImageData(sizePx, sizePx), y, x, i, j, ch;
        for (y = 0; y < sizePx; y++) for (x = 0; x < sizePx; x++) {
          i = ((sizePx - 1 - y) * sizePx + x) * 4; j = (y * sizePx + x) * 4;
          for (ch = 0; ch < 3; ch++) { var v = buf[i + ch] / 255; v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; img.data[j + ch] = Math.round(Core.clamp(v, 0, 1) * 255); }
          img.data[j + 3] = buf[i + 3];
        }
        ctx.putImageData(img, 0, 0);
        out = cv.toDataURL('image/png');
        rt.dispose(); Core.disposeObject(model);
      } catch (err) { out = ''; }
      iconCache[key] = out;
      return out;
    }

    var disposed = false;
    function dispose() {
      if (disposed) return; disposed = true;
      terrain.dispose(); pieces.dispose(); beam.dispose(); fog.dispose();
      if (envTexture) envTexture.dispose(); scene.environment = null;
      renderer.dispose();
    }

    resize(size.w, size.h, 1);
    return {
      __version: 1,
      setLevel: setLevel, setPlaced: setPlaced, setBeam: setBeam, getBeamProgress: beam.getProgress, finishBeam: beam.skip,
      setCameraPreset: setCameraPreset, orbit: rig.orbit, zoom: rig.zoomBy, pan: rig.panBy, needsFrame: needsFrame,
      fitToBoard: rig.fitToBoard, canFit: rig.canFit, getCellPx: rig.getCellPx, getBoardScreenBox: rig.getBoardScreenBox,
      setViewMode: rig.setViewMode, getViewMode: rig.getViewMode, hasOverview: rig.hasOverview,
      pickCell: pickCell, projectCell: projectCell, cellToScreen: function (cell) { return projectCell(cell, 0); },
      /* DESIGN.md 13: bitmask of the levels punched out of a column (0 = an ordinary solid column). The renderer
       * owns the adapter for the engine's normalised `openings` field, so nothing else has to guess its shape. */
      openLevelsAt: terrain.openLevelsAt,
      setSelection: pieces.setSelection, setGhost: pieces.setGhost, setHover: pieces.setHover, setCursor: pieces.setCursor, pulseCell: pieces.pulseCell,
      resize: resize, frame: frame, isFlat: isFlat, getShadingBlend: getShadingBlend, getCamera: getCamera,
      /* DESIGN.md 15: fog of war. setDarkness() installs a level's whole known set at once; revealCells() eases in
       * the cells a shot has just reached; fogState() reports coverage for the HUD. */
      setDarkness: setDarkness, revealCells: revealCells, fogState: fogState,
      setReducedMotion: function (b) { reducedMotion = !!b; rig.setReducedMotion(!!b); fog.setInstant(!!b); }, dispose: dispose, snapshotTrayIcon: snapshotTrayIcon,
      /* debug/test hooks */
      _scene: scene, _camera: camera, _renderer: renderer, _fog: fog
    };
  }

  root.LaserRender = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
