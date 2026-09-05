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
    /* MOTION-DIRECTION.md 3, "Shadow handling": the shadow map belongs to the SETTLED geometry and the light rig,
     * not to the camera. With autoUpdate on, three re-renders it on EVERY frame of the 720 ms reveal for a picture
     * that cannot change - the key light does not move and its intensity is not part of the depth pass. It is
     * rendered once whenever geometry or the rig actually changes (invalidateShadows), and the whole orbit samples
     * that same map. */
    renderer.shadowMap.autoUpdate = false;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    /* DESIGN.md 15: one fog-of-war state for the whole renderer - a w x d byte texture every fogged material reads.
     * It is created before the modules that sample it so terrain and pieces can bind its uniforms at construction,
     * and it is INERT (uFogOn = 0) on every level that does not set `dark`. */
    var fog = Core.createFog(theme);
    /* THE ONE ANIMATION REGISTRY (src/motion.js), created by main.js and handed down here. Every module below
     * degrades to its pre-motion behaviour when it is absent - a stripped harness, an embedding host - so a
     * missing registry costs presentation and never a frozen board or a loop with no way out. */
    var reg = opts.motion || null;
    var terrain = root.LaserRenderTerrain.create(theme, fog, reg);
    var pieces = root.LaserRenderPieces.create(theme, fog, { motion: reg });
    var beam = root.LaserRenderBeam.create(theme);
    /* The beam runs on its own single clock inside frame(dt); the lease exists so that cancelAll() (RESET, level
     * navigation) and documentHidden() reach it. It releases the lease itself the moment that clock ends. */
    beam.attachMotion(reg);
    /* MOTION-DIRECTION.md 2: T0..T0+m.fire.chargeMs charges the emitter before the head is released. The beam owns
     * the schedule and publishes the envelope through getCharge(); frame() hands it to render-pieces below. */
    beam.setChargeMs(theme.motion.fire.chargeMs);
    /* Section 8's one shadow commit: newly discovered geometry joins the cache when every reveal from the current
     * trace has settled - on completion, on a skip and on an abandoned burn alike. */
    terrain.onFogSettled(invalidateShadows);
    /* A fixed piece must arrive through the SAME sweep as the terrain around it, not pop in at the beam event. */
    pieces.setFogSampler(terrain.cellReveal);
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
    /* One flag, one commit. `shadowDirty` is raised by the things that actually change the depth pass - a new
     * level, a placed piece, a discovered cell finishing its arrival, the shadow pass being switched on - and is
     * consumed by exactly one shadow-map render in frame(). m.fog.shadowCommit is 'after-trace-reveals-settle',
     * so discovery commits once when the last cell has settled, never per cell and never per fade frame. */
    var shadowDirty = true;
    function invalidateShadows() { shadowDirty = true; }
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
    var rig = root.LaserRenderCamera.create({ theme: theme, size: size, motion: opts.motion || null });
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

    /* ---- reveal (VISUAL-DIRECTION.md D + MOTION-DIRECTION.md 3) --------------------------------------------
     * ONE scalar drives the whole collapse of the lie: r = theme.revealBlend(elevation), zero through the flat
     * dead band and one by 56 degrees. The document fixes every consumer of it, and this is the whole list:
     *
     *   floor and terrain-top shading   exactly r          (terrain's uReveal shader mix)
     *   all tilted light intensities    exactly r          (the key is SPLIT into a shadow-casting and a
     *                                                       shadowless half so the shadow can have its own
     *                                                       opacity curve while the two still sum to intensity*r)
     *   physical piece visibility       r * base opacity   (render-pieces)
     *   common glyph visibility         1 - r              (render-pieces)
     *   side opacity                    smoothstep(clamp(r / lightRig.reveal.sideOpacityFullAt))
     *   shadow opacity                  smoothstep(0.25, 0.65, r)
     *   opening gleams                  1 - r              (render-terrain's light leak)
     *   beam-glow multiplier            0.82 -> 1 with r   (frame(), below - it also owns the anticipation)
     *
     * Nothing here samples terrain height, opening height, opening count or opening shape. r is a function of the
     * camera's elevation alone, so the whole board reveals together and no column is staggered by position or
     * height - which is the only reason the flat view can be a lie in the first place. */
    function applyReveal(r) {
      if (r === appliedReveal) return;
      appliedReveal = r;
      terrain.applyReveal(r); pieces.applyReveal(r);
      /* Side opacity is smoothstep(clamp(r / lightRig.reveal.sideOpacityFullAt)) and render-terrain.applyReveal now
       * writes exactly that, so the override this file used to keep here is gone rather than duplicated: there is
       * one expression for the curve and one place it lives. */
      envMaterials.forEach(function (m) { m.envMapIntensity = ENV_STRENGTH * r; });
      var so = Core.smoothstep(0.25, 0.65, r);
      lights.hemi.intensity = LR.hemisphere.intensity * r;
      lights.key.intensity = LR.key.intensity * r * so;
      lights.keyFlat.intensity = LR.key.intensity * r * (1 - so);
      lights.rim.intensity = LR.rim.intensity * r;
      lights.fill.intensity = LR.fill.intensity * r;
      lights.ambient.intensity = LR.ambient.intensity * r;
      var shadows = r > S.updateAboveReveal;
      /* The existing enable threshold, unchanged. Crossing it needs ONE shadow render, not one per frame; below it
       * the pass is off entirely, which is what "at the flat dead band ... disable shadows" asks for. */
      if (lights.key.castShadow !== shadows) { lights.key.castShadow = shadows; if (shadows) shadowDirty = true; }
      renderer.shadowMap.enabled = shadows;
    }

    /* ---- the reveal's anticipation, on the beam (MOTION-DIRECTION.md 3) ------------------------------------
     * "Multiply existing beam-glow opacity toward 0.82, smoothstep, creating a brief intake. If no beam exists,
     * omit this change." ... "Beam-glow multiplier returns from 0.82 to 1 with r."
     * The rig owns the scalar (rig.revealIntake(), 0 at rest and 0 the instant the move ends); the beam owns the
     * material - render-beam.setGlowMultiplier(k) is one shared uniform over the merged geometry, so this costs no
     * draw call and no per-segment work. The multiplier is exactly 1 whenever no reveal is in flight, so a settled
     * beam is always at its baseline brightness (section 9, "settled lit targets and beam: steady light"), and it
     * is skipped entirely when render-beam has no such seam rather than reaching into its materials. */
    var RVL = (theme.motion && theme.motion.reveal) || {}, GLOW_MIN = RVL.beamGlowMinimum;
    var appliedGlowMul = 1;
    function setBeamGlowMultiplier(k) {
      if (k === appliedGlowMul || typeof beam.setGlowMultiplier !== 'function') return;
      beam.setGlowMultiplier(k);      /* one shared uniform on the merged beam geometry; no per-segment work */
      appliedGlowMul = k;
    }
    /* MOTION-DIRECTION.md section 6. The host owns the bell curve and the registry lease; this is only the seam,
     * kept beside the reveal's glow seam because both are one shared uniform over the merged beam geometry. */
    function setBeamSeal(k) { if (typeof beam.setSealGain === 'function') beam.setSealGain(k); }

    /* ---- MOTION-DIRECTION.md section 10: the decorative-degradation ladder's renderer half ----
     * ONE shared object. src/quality.js decides WHEN a rung is spent; this applies it. The object is passed by
     * reference to every module that has to honour a cut, so a cut is one mutation plus one re-read - never a
     * per-module flag to keep in sync, and never a rebuild of anything the player is looking at. */
    var qualityCuts = { weather: false, scatter: false, rings: false, pulses: false };
    function pushCuts() {
      if (beam.setDecorCuts) beam.setDecorCuts(qualityCuts);
      if (pieces.setDecorCuts) pieces.setDecorCuts(qualityCuts);
      if (terrain.setDecorCuts) terrain.setDecorCuts(qualityCuts);
    }
    function setQualityCut(name, step) {
      if (name === 'scatter-and-target-streaks') qualityCuts.scatter = true;
      else if (name === 'decorative-rings-and-fog-rim') qualityCuts.rings = true;
      else if (name === 'trailing-beam-pulses') qualityCuts.pulses = true;
      else if (name === 'weather') qualityCuts.weather = true;
      else if (name === 'pixel-ratio') { dprCap = (step && step.dpr) || dprCap; pushCuts(); resize(size.w, size.h, requestedDpr); return; }
      /* 'reduced-presentation' is the host's rung: it owns the registry, the weather and this facade's own
       * reduced-motion switch, so main.js applies that one and this function does not double-apply it. */
      pushCuts();
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
      appliedGlowMul = 1;                    /* a new level always starts at baseline beam brightness, even if a */
      if (typeof beam.setGlowMultiplier === 'function') beam.setGlowMultiplier(1);   /* reveal was cut short */
      invalidateShadows();                   /* new terrain and a re-placed light rig: the depth pass is stale */
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
      invalidateShadows();                   /* a whole known set arrives at once: geometry changed */
    }
    function revealCells(cells) {
      if (!cells || !cells.length) return false;
      /* MOTION-DIRECTION.md 8: the cell is committed to the known set FIRST and then burned back along the beam.
       * terrain.discover() does both; without a registry it IS the old fog.learnAll(cells, false). */
      var changed = terrain.discover(cells);
      if (changed) pieces.applyFog();
      /* "Newly discovered geometry does not join that cache until all reveals from the current trace have settled."
       * While a burn or a core arrival is running, the ONE commit comes from terrain.onFogSettled / frame() below;
       * invalidating here as well would be one shadow render per discovery batch, which section 8 forbids. With
       * reduced motion there is no arrival to settle, so this call is itself the settled moment. */
      if (changed && !terrain.isBurning() && !fog.isAnimating()) invalidateShadows();
      return changed;
    }
    function fogState() {
      return { dark: fog.isDark(), known: fog.count(), total: fog.total() };
    }
    function setPlaced(placed) { pieces.setPlaced(placed); invalidateShadows(); }
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

    /* MOTION-DIRECTION.md "What to cut first", rung 5. The requested ratio is remembered separately from the cap
     * so a later resize cannot silently undo a cut, and theme.renderer.maxDevicePixelRatio stays the absolute
     * ceiling above it. Rung 5 preserves "CSS cell size, geometry, information, timing, and typography": nothing
     * here touches the layout, only how many device pixels it is sampled at. */
    var dprCap = Infinity, requestedDpr = 1;
    function resize(w, h, dpr) {
      requestedDpr = dpr || requestedDpr;
      size.w = Math.max(1, w | 0); size.h = Math.max(1, h | 0);
      size.dpr = Math.min(requestedDpr, theme.renderer.maxDevicePixelRatio, dprCap);
      renderer.setPixelRatio(size.dpr);
      renderer.setSize(size.w, size.h, true);
      rig.refit(true);
    }

    var view = { zoom: 1, up: rig.up, quaternion: camera.quaternion, camera: camera };
    function frame(dt) {
      dt = Math.min(0.05, Math.max(0, dt || 0));
      rig.step(dt);
      applyReveal(getShadingBlend());
      /* The reveal's intake, applied to the beam glow. It is skipped entirely when there is no beam to dim, and it
       * is exactly 1 at rest, so a settled board never carries a residue of it. */
      setBeamGlowMultiplier(beam.getProgress().total > 0 ? 1 - (1 - GLOW_MIN) * rig.revealIntake() : 1);
      /* MOTION-DIRECTION.md 2, T0..T0+180 ms: the emitter charges before the head is released. The beam owns the
       * clock and publishes { intensity, halo }; render-pieces owns the filament and the halo sprite. Both are
       * exactly zero whenever there is no charge, so a settled emitter is its plain theme state. */
      pieces.setCharge(beam.getCharge());
      var speed = reducedMotion ? 1 / theme.reducedMotion.durationScale : 1;
      var fogAnim = fog.isAnimating();
      if (fog.step(dt * speed)) pieces.applyFog();   /* the arrival eases; reduced motion snaps it (setReducedMotion) */
      /* m.fog.shadowCommit: newly discovered geometry joins the shadow cache once, when the last cell of the trace
       * has finished arriving - never per cell, never per fade frame. */
      if (fogAnim && !fog.isAnimating()) shadowDirty = true;
      view.zoom = rig.effectiveZoom();
      pieces.frame(dt, speed, view);
      beam.frame(dt, view, motion());
      /* The one shadow-map render. Camera motion and light-intensity changes never reach it. */
      if (renderer.shadowMap.enabled && shadowDirty) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
      renderer.render(scene, camera);
    }
    /* Dirty rendering (main owns the loop): true while ANY of the renderer's own animations still has work to do -
     * a camera preset move, a view/fit tween, the eased fit chasing a new orientation, the travelling beam, an
     * end-state effect, a target fading between lit states, or a reveal pulse. main schedules a frame whenever it
     * changes state and keeps scheduling while this is true, so a static board costs nothing. */
    function needsFrame() { return rig.isAnimating() || beam.isAnimating() || pieces.isAnimating() || fog.isAnimating() || terrain.isBurning(); }

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
      setBeamSeal: setBeamSeal, setQualityCut: setQualityCut,
      setCameraPreset: setCameraPreset, orbit: rig.orbit, zoom: rig.zoomBy, pan: rig.panBy, needsFrame: needsFrame,
      fitToBoard: rig.fitToBoard, canFit: rig.canFit, getCellPx: rig.getCellPx, getBoardScreenBox: rig.getBoardScreenBox,
      setViewMode: rig.setViewMode, getViewMode: rig.getViewMode, hasOverview: rig.hasOverview,
      pickCell: pickCell, projectCell: projectCell, cellToScreen: function (cell) { return projectCell(cell, 0); },
      /* DESIGN.md 13: bitmask of the levels punched out of a column (0 = an ordinary solid column). The renderer
       * owns the adapter for the engine's normalised `openings` field, so nothing else has to guess its shape. */
      openLevelsAt: terrain.openLevelsAt,
      setSelection: pieces.setSelection, setGhost: pieces.setGhost, setHover: pieces.setHover, setCursor: pieces.setCursor, pulseCell: pieces.pulseCell,
      /* MOTION-DIRECTION.md section 5. Neither of these is inferable from the state the renderer is handed - a
       * drag that lifts a piece and a refused footprint are both host knowledge - so they are entry points, and
       * they have to be reachable through the facade or section 5's "Pick up", "Drag", "Cancel drag" and
       * "Illegal placement" rows are dead code. main.js onDragPiece() and its refusal paths call them. */
      setPickup: pieces.setPickup, flashInvalid: pieces.flashInvalid,
      resize: resize, frame: frame, isFlat: isFlat, getShadingBlend: getShadingBlend, getCamera: getCamera,
      /* DESIGN.md 15: fog of war. setDarkness() installs a level's whole known set at once; revealCells() eases in
       * the cells a shot has just reached; fogState() reports coverage for the HUD. */
      setDarkness: setDarkness, revealCells: revealCells, fogState: fogState,
      /* MOTION-DIRECTION.md 3: the shadow map is rendered on demand, not per frame. Anything that moves geometry
       * or the light rig must say so; camera motion and intensity changes must NOT. */
      invalidateShadows: invalidateShadows,
      /* The reveal's anticipation scalar, 0 at rest (tests and the integrator read it; nothing else needs it). */
      getRevealIntake: rig.revealIntake,
      setReducedMotion: function (b) { reducedMotion = !!b; rig.setReducedMotion(!!b); fog.setInstant(!!b); }, dispose: dispose, snapshotTrayIcon: snapshotTrayIcon,
      /* debug/test hooks */
      _scene: scene, _camera: camera, _renderer: renderer, _fog: fog
    };
  }

  root.LaserRender = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
