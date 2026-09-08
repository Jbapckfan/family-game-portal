/* Lasers 3D - terrain: merged voxel geometry, grid outlines, analytic picking, camera-fit points, reveal shader,
 * and MOTION-DIRECTION.md section 8 - the fog burning back along the beam.
 * Global: window.LaserRenderTerrain. Classic script, ES2019. Needs THREE + LaserRenderCore (+ LaserMotion to burn).
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;

  /* sRGB bytes as a 0..1 vec3. The burn rim is added AFTER tone mapping and the colour-space conversion (it is
   * injected past `#include <dithering_fragment>`), so it must be mixed in display space, exactly like
   * theme.terrain.darkness.unknownColorVec3 and theme.terrain.flatColorVec4 already are. */
  function srgbVec3(hex) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  /* ---- SECTION 8: THE FOG BURNS BACK ALONG THE BEAM --------------------------------------------------------
   * Discovery used to be a whole-cell cross-fade driven by render-core's own stepper, with the column growing up
   * out of the ground. Section 8 asks for something with a DIRECTION in it: at the cell's beam event a reveal
   * boundary sweeps across the cell from the edge the beam came in through to the opposite edge over
   * terrain.darkness.revealMs with `smoothstep` easing, joined by a fog.featherCells soft transition, with a
   * fog.rimWidthCells rim in fog.rimColor whose opacity follows `bell` over the cell's reveal - and the terrain is
   * simply THERE behind the boundary rather than rising into place.
   *
   * Three properties of this are load-bearing and none of them may be traded away:
   *
   *  1. DISCOVERY IS COMMITTED SYNCHRONOUSLY; ONLY THE DECORATION IS ANIMATED. discover() calls
   *     fog.learn(x, y, TRUE) for every cell before any animation exists, so a cell is known the instant the beam
   *     entered it. Cancel the burn, hide the tab, switch reduced motion on, blow the 24-cell cap: the cell stays
   *     known. Section 8: the cap "may never delay or discard discovery".
   *  2. IT CANNOT LEAK HEIGHT. The sweep coordinate is dot(fragment - cellCentre, incomingHeading) - the cell's own
   *     horizontal plane and the BEAM's heading, both of which the player can already see. Nothing here reads
   *     t[y][x], the opening mask or an opening count, and every cell burns for the same number of milliseconds at
   *     the same width and the same brightness.
   *  3. IT ENDS. ONE registry animation, key 'terrain.fogBurn', whose endMs is the last live cell's end. When it
   *     completes the registry calls settle(), the live list empties, no successor is started, and
   *     motion.needsFrame() goes false. Cells discovered mid-burn SUPERSEDE the same key with a later endMs rather
   *     than starting a second animation, so there is never more than one.
   *
   * The mask is one extra texture (w x d bytes, 2.3 KB at 24x24) sampled beside the existing fog texture, in the
   * same merged materials: no mesh per fog patch, no terrain rebuild, no new draw call.
   *   R  the eased boundary position, 0 = at the entry edge .. 1 = swept (a cell that is not burning reads 1)
   *   G  incoming heading x, and B heading y, each as (d + 1) / 2
   *   A  the rim envelope, bell(t) over the cell's own reveal
   * Known-ness itself stays in render-core's fog texture, which the shader multiplies in - so a cell that has
   * never burned needs no bookkeeping here at all, and a cell the fog has not learned can never be shown by us.
   */
  var BURN_HEAD =
    'uniform sampler2D uBurnMap;\nuniform float uBurnOn;\nuniform float uBurnFeather;\n' +
    'uniform float uBurnRimWidth;\nuniform float uBurnRimOpacity;\nuniform vec3 uBurnRimColor;\n' +
    'vec3 lasersBurnV = vec3(1.0, 1.0, 0.0);\n' +
    'vec3 lasersBurnAt(vec2 p) {\n' +
    '  vec2 c = floor(p + 0.5);\n' +
    '  vec2 uv = (c + 0.5) / uFogSize;\n' +
    '  vec4 b = texture2D(uBurnMap, uv);\n' +
    '  float fk = texture2D(uFogMap, uv).r;\n' +
    '  vec2 dir = b.gb * 2.0 - 1.0;\n' +
    '  float u = 0.5 + dot(p - c, dir);\n' +          /* 0 at the entry edge, 1 at the opposite edge */
    '  float f = uBurnFeather * 0.5;\n' +
    '  float pos = mix(-f, 1.0 + f, b.r);\n' +        /* so R = 0 hides the whole cell and R = 1 shows all of it */
    '  return vec3(fk * (1.0 - smoothstep(pos - f, pos + f, u)), pos - u, b.a);\n' +
    '}\n';
  /* The rim is a separate injection because it must survive the FLAT mix: the mask has to be applied where
   * render-core applies the fog (so a half-revealed cell in FLAT still resolves to the same flat #172544 as every
   * other cell and the lie is untouched), while the rim is drawn on top of the finished pixel so the player can
   * see the boundary travel in FLAT too. It is height-independent, so the information boundary permits it. */
  var BURN_RIM =
    '\n if (uBurnOn > 0.5) {\n' +
    '   float rb = lasersBurnV.x * lasersBurnV.z * (1.0 - smoothstep(0.0, uBurnRimWidth, max(lasersBurnV.y, 0.0)));\n' +
    '   gl_FragColor.rgb += uBurnRimColor * (uBurnRimOpacity * rb);\n' +
    ' }\n';

  function createBurn(theme, fog, motion) {
    var M = theme.motion, FT = M.fog, DK = theme.terrain.darkness;
    var CAP = M.budget.animatedFogCellsMax, KEY = 'terrain.fogBurn';
    var easePos = theme.easeByName(FT.easing), easeRim = theme.easeByName(M.easing.pulse);
    var w = 1, d = 1, data = new Uint8Array(4), tex = null, active = false;
    var live = [], settled = [], lastCell = null, lastTrace = -1;
    var u = {
      uBurnMap: { value: null }, uBurnOn: { value: 0 },
      uBurnFeather: { value: FT.featherCells }, uBurnRimWidth: { value: FT.rimWidthCells },
      uBurnRimOpacity: { value: FT.rimOpacity }, uBurnRimColor: { value: srgbVec3(FT.rimColor) }
    };

    function makeTex() {
      if (tex) tex.dispose();
      tex = new THREE.DataTexture(data, w, d, THREE.RGBAFormat, THREE.UnsignedByteType);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false; tex.flipY = false; tex.needsUpdate = true;
      Core.markShared(tex);
      u.uBurnMap.value = tex;
    }
    function write(i, pos, dx, dy, rim) {
      var o = i * 4;
      data[o] = Math.round(pos * 255);
      data[o + 1] = Math.round((dx + 1) * 127.5);
      data[o + 2] = Math.round((dy + 1) * 127.5);
      data[o + 3] = Math.round(rim * 255);
    }
    /* Every cell starts SWEPT. Whether it is visible at all is the fog texture's business (fk multiplies the mask
     * in the shader), so a cell that never burns - a seeded emitter, a restored save, a lit level - needs no entry
     * here and no synchronisation with main's known set. */
    function reset() {
      for (var i = 0; i < w * d; i++) write(i, 1, 1, 0, 0);
      if (tex) tex.needsUpdate = true;
    }
    function setBoard(W, H, on) {
      /* A level change during a burn. The host cancels all presentation work on level navigation anyway, but the
       * new board must not inherit the old one's animation whatever order those two arrive in. */
      if (live.length) motion.cancel(KEY);
      live.length = 0; lastCell = null; lastTrace = -1;
      active = !!on;
      u.uBurnOn.value = active ? 1 : 0;
      if (W !== w || H !== d || !tex) { w = W; d = H; data = new Uint8Array(w * d * 4); makeTex(); }
      reset();
    }
    function settleCell(c) { write(c.i, 1, c.dx, c.dy, 0); }
    function finish() {
      var i;
      for (i = 0; i < live.length; i++) settleCell(live[i]);
      live.length = 0;
      if (tex) tex.needsUpdate = true;
      /* Section 8, "Shadows during discovery": ONE shadow-cache update once every reveal from this trace has
       * settled - on completion, on a skip, and on an abandoned burn alike. Never one per cell, never per frame. */
      for (i = 0; i < settled.length; i++) settled[i]();
    }
    function update(eased, ctx) {
      var t, c, i;
      for (i = live.length - 1; i >= 0; i--) {
        c = live[i];
        t = (ctx.nowMs - c.startMs) / DK.revealMs;
        if (t >= 1) { settleCell(c); live.splice(i, 1); }
        else { t = t < 0 ? 0 : t; write(c.i, easePos(t), c.dx, c.dy, easeRim(t)); }
      }
      if (tex) tex.needsUpdate = true;
    }
    /* One animation, superseded by its own key while cells keep arriving, ending at the LAST live cell's end. */
    function schedule() {
      var end = 0, i, st;
      for (i = 0; i < live.length; i++) if (live[i].endMs > end) end = live[i].endMs;
      if (!live.length) { finish(); return; }
      st = motion.token();
      motion.run({ key: KEY, role: 'decorative', surface: 'webgl', attempt: st.attempt, trace: st.trace,
        startMs: motion.now(), endMs: end, ease: M.easing.linear,
        update: update, final: finish, cancel: finish, fallback: finish });
      if (tex) tex.needsUpdate = true;
    }
    function sign(v) { return v > 0 ? 1 : (v < 0 ? -1 : 0); }
    /* The incoming horizontal heading. Taken from the caller when it supplies one, otherwise from the beam's own
     * cell order - the previous cell of this trace, or the next one when this is the trace's first. It is derived
     * from the ROUTE, never from the board, so it carries no information the player cannot already see. */
    function heading(c, prev, next) {
      var dx = 0, dy = 0;
      if (typeof c.dx === 'number' && typeof c.dy === 'number') { dx = sign(c.dx); dy = sign(c.dy); }
      else if (prev) { dx = sign(c.x - prev.x); dy = sign(c.y - prev.y); }
      else if (next) { dx = sign(next.x - c.x); dy = sign(next.y - c.y); }
      if (dx && dy) { if (Math.abs(c.x - (prev ? prev.x : c.x)) >= Math.abs(c.y - (prev ? prev.y : c.y))) dy = 0; else dx = 0; }
      if (!dx && !dy) dx = 1;
      return { dx: dx, dy: dy };
    }
    function push(i, h, t0) {
      var k;
      for (k = 0; k < live.length; k++) if (live[k].i === i) { live.splice(k, 1); break; }
      /* budget.animatedFogCellsMax: over the cap the OLDEST is settled at once. It loses its sweep, never its
       * discovery - that was committed by fog.learn() before this function was reached. */
      while (live.length >= CAP) settleCell(live.shift());
      live.push({ i: i, dx: h.dx, dy: h.dy, startMs: t0, endMs: t0 + DK.revealMs });
      write(i, 0, h.dx, h.dy, 0);
    }
    function discover(cells) {
      if (!cells || !cells.length) return false;
      if (!active) return fog.learnAll(cells, false);              /* lit level, or no registry: unchanged path */
      if (motion.isReducedMotion()) return fog.learnAll(cells, true);   /* section 8: known at its event, at once */
      /* The host is committing the authoritative discoveries of a shot on a hidden tab (contract 8). A sweep
       * started here would never advance - nothing is rendering - and would then run on RETURN, which is exactly
       * the "replay missed animation" the contract forbids. The cells are simply known. */
      if (motion.isHidden()) return fog.learnAll(cells, true);
      var t0 = motion.now(), changed = false, i, c, prev, cx, cy, idx;
      if (motion.trace() !== lastTrace) { lastTrace = motion.trace(); lastCell = null; }
      for (i = 0; i < cells.length; i++) {
        c = cells[i];
        if (!c) continue;
        cx = Math.round(c.x); cy = Math.round(c.y);
        if (cx < 0 || cy < 0 || cx >= w || cy >= d) continue;
        idx = cy * w + cx;
        if (!fog.learn(cx, cy, true)) continue;   /* already known: no second discovery and no second burn */
        prev = lastCell; lastCell = c;
        changed = true;
        push(idx, heading(c, prev, cells[i + 1] || null), t0);
      }
      if (changed) schedule();
      return changed;
    }
    /* A whole-cell scalar for anything that cannot sample the mask per fragment (render-pieces' fixed pieces). */
    function value(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= d) return 0;
      if (!active) return fog.value(x, y);
      return fog.known(x, y) ? data[(y * w + x) * 4] / 255 : 0;
    }

    return {
      uniforms: u, setBoard: setBoard, discover: discover, value: value,
      /* Ladder rung 3 takes the fog rim. Only the rim: the sweep, its feather, its duration and its direction are
       * the discovery itself, and cutting any of those would change what the player learns, not how it looks. */
      setDecorCuts: function (c) { u.uBurnRimOpacity.value = (c && c.rings) ? 0 : FT.rimOpacity; },
      isActive: function () { return active; },
      isBurning: function () { return live.length > 0; },
      onSettled: function (fn) { if (typeof fn === 'function') settled.push(fn); },
      dispose: function () { if (tex) { tex.dispose(); tex = null; } live.length = 0; },
      /* Uniform binding + the mask, applied where render-core applies the fog so the FLAT lie is unchanged. */
      mask: function (shader, tint, isGrid) {
        var k;
        for (k in u) if (Object.prototype.hasOwnProperty.call(u, k)) shader.uniforms[k] = u[k];
        var body = '\n if (uBurnOn > 0.5) {\n   lasersBurnV = lasersBurnAt(vFogPos);\n   float mk = lasersBurnV.x;\n';
        if (isGrid) {
          /* Section 8's grid cross-fade. Two coincident outlines in ONE LineSegments - the unknown one on the
           * ground plane and the known one at the column top - swapped by opacity, never by moving a vertex.
           * role 1 = the ground copy, 0 = the top copy, 0.5 = a flat cell where the two are the same line and the
           * outline simply brightens (and so is still ALWAYS drawn, at its existing unknown brightness). */
          body += '   if (vGridRole > 0.75) { gl_FragColor.rgb = mix(uFogDark, gl_FragColor.rgb, uFogGrid); gl_FragColor.a *= 1.0 - mk; }\n' +
            '   else if (vGridRole > 0.25) { gl_FragColor.rgb = mix(uFogDark, gl_FragColor.rgb, mix(uFogGrid, 1.0, mk)); }\n' +
            '   else { gl_FragColor.a *= mk; }\n';
        } else if (tint === 'ground') body += '   gl_FragColor.rgb = mix(uFogDark, gl_FragColor.rgb, mk);\n';
        else if (tint === 'alpha') body += '   if (mk < uFogMin) discard;\n   gl_FragColor.rgb *= mk;\n   gl_FragColor.a *= mk;\n';
        else body += '   if (mk < uFogMin) discard;\n   gl_FragColor.rgb = mix(uFogDark, gl_FragColor.rgb, mk);\n';
        shader.fragmentShader = BURN_HEAD + (isGrid ? 'varying float vGridRole;\n' : '') +
          shader.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>' + body + ' }\n');
        if (isGrid) {
          shader.vertexShader = 'attribute float aGridRole;\nvarying float vGridRole;\n' +
            shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vGridRole = aGridRole;\n');
        }
      },
      rim: function (shader) {
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>', '#include <dithering_fragment>' + BURN_RIM);
      }
    };
  }

  /* Inject the FLAT mix after tone mapping + colour space so uReveal = 0 yields EXACTLY #172544, then - on a dark
   * level (DESIGN.md 15) - the fog mix on top of it, so fog 0 yields exactly theme.terrain.darkness.unknownColor.
   * Order matters and is fixed: reveal first, fog second. The FLAT lie decides what a cell WOULD look like; the fog
   * decides whether the player has earned the right to see it yet. Doing it the other way round would let a
   * half-revealed cell come out lighter than the lit board it is supposed to be converging on. */
  /* Each `.replace('#include <dithering_fragment>', ...)` inserts its block DIRECTLY after the include, so the
   * injection written LAST runs FIRST. The execution order the composite needs is fog, then burn mask, then the
   * FLAT mix, then the burn rim - so the calls below are made in exactly the reverse of that. */
  function revealMaterial(spec, theme, uReveal, fog, mode, tint, burn) {
    var m = Core.matFromSpec(spec);
    var v = theme.terrain.flatColorVec4;
    m.onBeforeCompile = function (shader) {
      if (burn) burn.rim(shader);
      shader.uniforms.uReveal = uReveal;
      shader.uniforms.uFlat = { value: new THREE.Vector4(v[0], v[1], v[2], v[3]) };
      shader.fragmentShader = 'uniform float uReveal;\nuniform vec4 uFlat;\n' + shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n gl_FragColor = mix(uFlat, gl_FragColor, uReveal);'
      );
      if (burn) burn.mask(shader, tint, false);
      if (fog) Core.fogShader(shader, fog, mode, tint);
    };
    /* The cache key must name the injection, or three hands two differently-patched materials the same program:
     * the ground slab (which never moves) and the block tops (which grow out of it) are otherwise identical. */
    m.customProgramCacheKey = function () {
      return 'lasers3d-reveal|' + (fog ? mode + '|' + tint : 'nofog') + (burn ? '|burn' : '');
    };
    return m;
  }

  /* The same injection for a material that has no FLAT mix of its own (the sides, the outline, the light leak). */
  function fogMaterial(m, fog, mode, tint, burn, isGrid) {
    if (!fog) return m;
    m.onBeforeCompile = function (shader) {
      if (burn && !isGrid && tint !== 'alpha') burn.rim(shader);   /* never on the additive light leak */
      if (burn) burn.mask(shader, tint, !!isGrid);
      Core.fogShader(shader, fog, mode, tint);
    };
    m.customProgramCacheKey = function () { return 'lasers3d-fog|' + mode + '|' + tint + (burn ? '|burn' : ''); };
    return m;
  }

  function create(theme, fog, motion) {
    var uReveal = { value: 0 };
    /* m.reveal.sideEasing, resolved through the theme's own table (never a curve written out here). */
    var easeSide = theme.easeByName(theme.motion.reveal.sideEasing);
    /* MOTION-DIRECTION 8. Without a registry there is nothing to schedule the burn on, so the module keeps its
     * original render-core arrival and every existing behaviour is byte-identical. */
    var burn = (fog && motion) ? createBurn(theme, fog, motion) : null;
    var LEAK = theme.terrain.lightLeak;
    var mats = {
      /* The board's ground plane. It is the ONE surface darkness never removes (15.1: the player must always be
       * able to see the board's extent and tap a cell), so it is tinted rather than gated - 'none' because it is
       * itself the ground and has nowhere to rise from. */
      floor: revealMaterial(theme.materials.floor, theme, uReveal, fog, 'none', 'ground', burn),
      top: revealMaterial(theme.materials.blockTopLit, theme, uReveal, fog, 'rise', 'mix', burn),
      side: fogMaterial(Core.matFromSpec(theme.materials.blockSide), fog, 'rise', 'mix', burn),
      sideEdge: fogMaterial(new THREE.LineBasicMaterial({color:0x9bbdcd,transparent:true,opacity:0,depthWrite:false,toneMapped:false}), fog, 'rise', 'alpha', burn, true),
      frame: new THREE.MeshBasicMaterial({color:0x0c1923,toneMapped:false}),
      frameEdge: new THREE.MeshBasicMaterial({color:0x507283,toneMapped:false}),
      frameMarks: new THREE.MeshBasicMaterial({color:0x93b9c5,toneMapped:false}),
      /* 15.1: "The empty grid outline is ALWAYS drawn." So the outline is the one fogged material that never
       * discards - it only lies flat on the ground plane and dims to uFogGrid until its cell is known. */
      grid: fogMaterial(new THREE.LineBasicMaterial({ color: new THREE.Color(theme.palette.gridOutline), toneMapped: false }), fog, 'lift', 'grid', burn, true),
      /* DESIGN.md 13.3: the ONE mark the flat view is allowed to show. Additive over the floor so it reads as light
       * escaping, never as paint; depthWrite off so it cannot disturb anything drawn after it. On a dark level it
       * is one of the things 15.1 hides until the beam has been there, and additive light cannot be darkened by
       * mixing toward a colour, so the fog scales it to nothing instead. */
      leak: fogMaterial(new THREE.MeshBasicMaterial({ color: new THREE.Color(LEAK.color), transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), fog, 'rise', 'alpha', burn)
    };
    var leakTex = null;
    Core.markSharedAll([mats.floor, mats.top, mats.side, mats.grid, mats.leak, mats.sideEdge, mats.frame, mats.frameEdge, mats.frameMarks]);
    mats.side.opacity = 0;
    mats.top.polygonOffset = true; mats.top.polygonOffsetFactor = 1; mats.top.polygonOffsetUnits = 1;
    mats.floor.polygonOffset = true; mats.floor.polygonOffsetFactor = 1; mats.floor.polygonOffsetUnits = 1;

    /* Terrain draws BEFORE everything else in the scene. In TILT that is just early-z; in FLAT it is what lets the
     * beam of 13.3 cross an arch (see applyReveal), because a mesh that writes no depth must be painted first or it
     * paints over what it was supposed to let through. */
    var TERRAIN_ORDER = -1;
    var group = new THREE.Group();
    group.name = 'terrain';
    var level = null, maxHeight = 0, fitPoints = new Float32Array(0), openings = null;

    /* ---- ARCHES AND WINDOWS (DESIGN.md 13.5) -----------------------------------------------------------------
     * Terrain used to be one box per column, which cannot express a gap under a block or a hole through a wall. It
     * is now built PER SOLID VOXEL: the column's open levels are simply skipped, so an opening is a genuine hole
     * with its own ceiling and floor faces. Three invariants keep the game's bargain intact:
     *
     *  1. THE FLAT VIEW IS UNCHANGED. The lid at z = t is emitted for EVERY column with t > 0 whatever is (or is
     *     not) underneath it, so the top surface never moves. Everything else the opening adds is either a vertical
     *     face or a downward face in `mats.side`, which is invisible while reveal = 0, or an upward face in
     *     `mats.top`, which the FLAT shader forces to exactly #172544 - the same byte the lid above it writes. The
     *     only pixels that can differ are the light leak's, and that is 13.3's deliberate exception.
     *  2. THE SILHOUETTE IS UNCHANGED. buildFitPoints still reads only the per-column top corners at height t, so
     *     the camera auto-fit sees the same convex hull with or without openings.
     *  3. MERGED PER MATERIAL. Every voxel's faces land in one of the same two buckets as before, so a 24x24 board
     *     is still four draw calls of terrain (base slab, tops, sides, outlines) plus one for the light leaks.
     *
     * A solid column is byte-identical to what the old code produced: the four side quads are simply cut into h
     * stacked quads over exactly the same rectangle, sharing vertices, with the same flat normals and an unused uv.
     */
    /* A fixed instrument chassis, independent of terrain and discovery. Its markings stay outside playable cells. */
    function platform(w, d) {
      var cx = (w - 1) / 2, cz = -(d - 1) / 2;
      var slab = new THREE.Mesh(Core.boxAt(cx, -0.22, cz, w + 0.42, 0.40, d + 0.42), mats.frame);
      slab.name = 'instrument-chassis'; slab.renderOrder = -2; group.add(slab);
      var rails = [
        Core.boxAt(cx, -0.005, 0.60, w + 0.35, 0.055, 0.06),
        Core.boxAt(cx, -0.005, -d + 0.40, w + 0.35, 0.055, 0.06),
        Core.boxAt(-0.60, -0.005, cz, 0.06, 0.055, d + 0.35),
        Core.boxAt(w - 0.40, -0.005, cz, 0.06, 0.055, d + 0.35)
      ];
      group.add(new THREE.Mesh(Core.mergeGeometries(rails), mats.frameEdge));
      var ticks = [];
      for (var x = 0; x < w; x++) {
        ticks.push(Core.boxAt(x, 0.027, 0.59, 0.025, 0.01, x % 5 === 0 ? 0.14 : 0.065));
        ticks.push(Core.boxAt(x, 0.027, -d + 0.41, 0.025, 0.01, x % 5 === 0 ? 0.14 : 0.065));
      }
      for (var y = 0; y < d; y++) {
        ticks.push(Core.boxAt(-0.59, 0.027, -y, y % 5 === 0 ? 0.14 : 0.065, 0.01, 0.025));
        ticks.push(Core.boxAt(w - 0.41, 0.027, -y, y % 5 === 0 ? 0.14 : 0.065, 0.01, 0.025));
      }
      var marks = new THREE.Mesh(Core.mergeGeometries(ticks), mats.frameMarks);
      marks.name = 'calibration-marks'; group.add(marks);
    }

    function build(parsed) {
      level = parsed;
      Core.clearGroup(group);
      var w = parsed.size.w, d = parsed.size.d, t = parsed.t;
      platform(w, d);
      var cell = theme.terrain.cellTop, hc = cell / 2, x, y, h, k;
      var tops = [], sides = [], lines = [], leaks = [], roles = [];
      var byHeight = [];   /* height -> flat [worldX, worldZ, ...] of that height's top-face corners */
      maxHeight = 0;
      openings = Core.openMask(parsed);
      var om = openings.mask;
      /* MOTION-DIRECTION 8. The burn owns the darkness presentation on a dark level; on a lit one it is inert and
       * every material behaves exactly as it did before. Doing this BEFORE the geometry is emitted is what lets the
       * outline decide whether it needs its unknown-state twin. */
      var burning = !!burn && !!parsed.dark;
      if (burn) burn.setBoard(w, d, burning);
      /* The cross-fade needs alpha on a material that has never had any. Only while it is being used: a lit board
       * keeps the original opaque line pass, and with it the original sort order. */
      if (mats.grid.transparent !== burning) {
        mats.grid.transparent = burning;
        mats.grid.depthWrite = !burning;
        mats.grid.needsUpdate = true;
      }
      var gridGround = theme.terrain.darkness.gridKnownAt;

      /* Base floor slab: one quad under the whole board so gaps show floor colour (never the page). It is also the
       * floor an ARCH is open onto: a beam passing under one runs along this slab. */
      var base = new THREE.PlaneGeometry(w, d);
      base.rotateX(-Math.PI / 2);
      base.translate((w - 1) / 2, -0.01, -(d - 1) / 2);
      var baseMesh = new THREE.Mesh(base, mats.floor);
      baseMesh.receiveShadow = true;
      baseMesh.renderOrder = TERRAIN_ORDER;
      group.add(baseMesh);

      function face(z, up) {
        var g = new THREE.PlaneGeometry(cell, cell);
        g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
        g.translate(x, z, -y);
        return g;
      }

      for (y = 0; y < d; y++) {
        for (x = 0; x < w; x++) {
          h = t[y][x];
          var bits = om[y * w + x];
          if (h > 0) {
            /* The lid. Always drawn at the column's own height, opening or not: this is the surface the FLAT view
             * shows, the surface a piece stands on, and the surface the camera fit measures. */
            tops.push(face(h, true));
            for (k = 0; k < h; k++) {
              if (bits & (1 << k)) continue;                 /* punched out - leave a real hole */
              /* four vertical faces of THIS voxel, z = k .. k+1 */
              sides.push(sideQuad([x + hc, k, -y + hc], [x + hc, k, -y - hc], k + 1, [1, 0, 0]));
              sides.push(sideQuad([x - hc, k, -y - hc], [x - hc, k, -y + hc], k + 1, [-1, 0, 0]));
              sides.push(sideQuad([x - hc, k, -y + hc], [x + hc, k, -y + hc], k + 1, [0, 0, 1]));
              sides.push(sideQuad([x + hc, k, -y - hc], [x - hc, k, -y - hc], k + 1, [0, 0, -1]));
              /* the floor INSIDE an opening: this voxel's own top, wherever the voxel above is missing. This is the
               * one interior surface a player ever sees, since the camera looks DOWN from 25..90 degrees, so it is a
               * lit block top like any other. */
              if (k + 1 < h && (bits & (1 << (k + 1)))) tops.push(face(k + 1, true));
              /* the ceiling INSIDE an opening: this voxel's underside, wherever the voxel below is missing. It is
               * back-facing at every legal camera elevation, so it is never seen; it exists so the hole is a real
               * hole and not a one-sided cut, and it goes in the dark side bucket with the walls. */
              if (k > 0 && (bits & (1 << (k - 1)))) sides.push(face(k, false));
            }
            /* the lid's own underside, when the voxel it caps was punched out (an overhang with nothing below it) */
            if (bits & (1 << (h - 1))) sides.push(face(h, false));
            /* 13.3: the fair tell. One quad on the column top; the material's opacity carries it (and retires it as
             * the board tilts), so an opened column costs exactly one more quad in one shared mesh. */
            if (bits) {
              var lq = new THREE.PlaneGeometry(LEAK.quadCells, LEAK.quadCells);
              lq.rotateX(-Math.PI / 2);
              lq.translate(x, h + LEAK.zOffset, -y);
              leaks.push(lq);
            }
          }
          /* outline square at this cell's actual top */
          var zl = h + 0.004, a = x - cell / 2, b = x + cell / 2, c = -y + cell / 2, e = -y - cell / 2;
          square(lines, a, b, c, e, zl);
          if (burning) {
            /* Section 8: "crossfade the unknown ground-plane grid outline to the stationary known top outline
             * using the reveal progress. Do not translate an outline between them." A raised column therefore gets
             * BOTH lines in the same buffer - role 0 at its top and role 1 on the ground plane - and a flat cell,
             * where the two are the same line, gets one that only brightens (role 0.5). Same LineSegments, same
             * material, same single draw call; in FLAT the two project on top of each other exactly. */
            if (h > 0) { role(roles, 0); square(lines, a, b, c, e, gridGround); role(roles, 1); }
            else role(roles, 0.5);
          } else role(roles, 0);
          if (h > maxHeight) maxHeight = h;
          if (h > 0) { (byHeight[h] = byHeight[h] || []).push(a, c, b, c, b, e, a, e); }
        }
      }
      buildFitPoints(parsed, byHeight);
      if (tops.length) {
        var topMesh = new THREE.Mesh(Core.mergeGeometries(tops), mats.top);
        topMesh.castShadow = true; topMesh.receiveShadow = true;
        topMesh.renderOrder = TERRAIN_ORDER;
        group.add(topMesh);
        var sideMesh = new THREE.Mesh(Core.mergeGeometries(sides), mats.side);
        var sideEdges = new THREE.LineSegments(new THREE.EdgesGeometry(sideMesh.geometry, 25), mats.sideEdge);
        sideEdges.name='terrain-edge-light'; group.add(sideEdges);
        sideMesh.castShadow = true; sideMesh.receiveShadow = true;
        group.add(sideMesh);
      }
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
      if (burn) lg.setAttribute('aGridRole', new THREE.Float32BufferAttribute(roles, 1));
      var lineMesh = new THREE.LineSegments(lg, mats.grid);
      lineMesh.name = 'terrain-grid';
      lineMesh.renderOrder = 1;
      group.add(lineMesh);
      if (leaks.length) {
        if (!leakTex) { leakTex = Core.markShared(Core.leakTexture(theme)); mats.leak.map = leakTex; mats.leak.needsUpdate = true; }
        var leakMesh = new THREE.Mesh(Core.mergeGeometries(leaks), mats.leak);
        leakMesh.name = 'terrainLightLeak';
        leakMesh.renderOrder = LEAK.renderOrder;
        group.add(leakMesh);
      }
    }

    /* One cell outline as four line segments at height z, and the matching eight entries of its cross-fade role. */
    function square(out, a, b, c, e, z) {
      out.push(a, z, c, b, z, c, b, z, c, b, z, e, b, z, e, a, z, e, a, z, e, a, z, c);
    }
    function role(out, v) { for (var i = 0; i < 8; i++) out.push(v); }

    /* Bitmask of the levels punched out of a column (0 = solid). Exposed so the readout and the tests can ask the
     * same question the geometry answered, without re-deriving the engine's field name. */
    function openLevelsAt(x, y) {
      if (!openings || !level) return 0;
      x = Math.round(x); y = Math.round(y);
      if (y < 0 || x < 0 || y >= level.size.d || x >= level.size.w) return 0;
      return openings.mask[y * level.size.w + x];
    }

    /* Camera-fit silhouette (INTERFACES-FRONTEND.md "Changes"): the solid's projected outline in ANY orientation is
     * the convex hull of the floor slab's four corners plus every top-face corner at its own height (a side-face point
     * projects onto the segment between the base and top corners above it, so it can never fall outside). Per height
     * the hull collapses the corner cloud to a few points, so a 24x24 board fits from ~20 points instead of ~2300. */
    function buildFitPoints(parsed, byHeight) {
      var w = parsed.size.w, d = parsed.size.d;
      var pts = [-0.5, 0, 0.5, w - 0.5, 0, 0.5, w - 0.5, 0, -(d - 0.5), -0.5, 0, -(d - 0.5)], h, hull, i;
      for (h = 1; h < byHeight.length; h++) {
        if (!byHeight[h]) continue;
        hull = Core.convexHull2D(byHeight[h]);
        for (i = 0; i < hull.length; i += 2) pts.push(hull[i], h, hull[i + 1]);
      }
      /* the emitter, the targets and the fixed pieces stand ON the board: keep their tops inside the frame too */
      var top = theme.piece.mirrorPanel.zTo, c = theme.terrain.cellTop / 2;
      function actor(x, y) {
        var hh = parsed.t[y][x] + top;
        pts.push(x - c, hh, -y + c, x + c, hh, -y + c, x + c, hh, -y - c, x - c, hh, -y - c);
      }
      actor(parsed.emitter.x, parsed.emitter.y);
      parsed.targets.forEach(function (t2) { actor(t2.x, t2.y); });
      parsed.fixed.forEach(function (f) { actor(f.x, f.y); });
      fitPoints = new Float32Array(pts);
    }

    /* Vertical quad from world point a to b (both at height a[1]) up to height h, with the given outward normal.
     * A column is cut into one of these per solid voxel; the quads share their edge vertices exactly, so a solid
     * column rasterises identically to the single full-height quad this used to emit. */
    function sideQuad(a, b, h, n) {
      var g = new THREE.BufferGeometry(), z0 = a[1];
      var p = [a[0], z0, a[2], b[0], z0, b[2], b[0], h, b[2], a[0], z0, a[2], b[0], h, b[2], a[0], h, a[2]];
      var nn = [], i;
      for (i = 0; i < 6; i++) nn.push(n[0], n[1], n[2]);
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
      return g;
    }

    /* Apply the reveal blend: shader mix + side opacity (VISUAL-DIRECTION.md D). */
    function applyReveal(r) {
      uReveal.value = r;
      /* MOTION-DIRECTION.md 3: "Side opacity uses smoothstep(clamp(r / lightRig.reveal.sideOpacityFullAt)). This
       * replaces the old discontinuous side-opacity jump" - the raw ramp arrives at a constant rate and then stops
       * dead at sideOpacityFullAt, which is a visible kink partway through the orbit. m.reveal.sideEasing names the
       * curve; theme.ease resolves it, so the expression is not written out a second time anywhere. */
      var so = easeSide(Math.min(1, r / theme.lightRig.reveal.sideOpacityFullAt));
      mats.sideEdge.opacity = 0.23 * r; mats.sideEdge.visible = r > 0;
      mats.side.opacity = so;
      mats.side.transparent = so < 1;
      mats.side.visible = so > 0;
      /* The light leak is a FLAT-view tell (13.3). Once the board is tilted the hole itself is the tell, and
       * VISUAL-DIRECTION C forbids decals on lit terrain tops, so it retires exactly as the sides arrive. */
      mats.leak.opacity = LEAK.opacity * (1 - r);
      mats.leak.visible = mats.leak.opacity > 0.001;
      /* 13.3's second tell, "the beam is its own": a beam passing UNDER an arch is hidden by the very column top
       * that hides the arch, so at reveal 0 a level-0 run would appear to stop dead at that cell - a lie in the
       * wrong direction, and the one thing worse than no tell. While the board is a flat graphic the terrain writes
       * no depth (VISUAL-DIRECTION D already keeps the beam among the objects FLAT must not hide), so the beam is
       * drawn crossing a cell that looks solid. The instant the board starts becoming physical, real occlusion is
       * back. Nothing else changes: at reveal 0 every terrain fragment is forced to the same #172544. */
      var occludes = r > 0;
      mats.top.depthWrite = occludes;
      mats.floor.depthWrite = occludes;
    }

    /* Picking is analytic, not a raycast against per-cell meshes: 576 invisible boxes at 24x24 would be 576 ray/box
     * tests per tap plus 576 matrices in the scene graph. The terrain is a height field and the camera looks down
     * from 25..90 degrees, so the ray only spans (maxHeight + 0.05) * cot(elevation) cells between the top of the
     * tallest block and the floor -- at most ~10 -- and a 2D DDA over exactly those cells, with one slab test per
     * cell against that column's box, is both EXACT (it reproduces the old box raycast, sides included) and O(10)
     * regardless of board size. */
    var HALF = theme.terrain.cellTop / 2, BASE = -0.05;
    var ndc = new THREE.Vector2(), raycaster = new THREE.Raycaster();
    var ou = 0, ov = 0, oh = 0, du = 0, dv = 0, dh = 0, rLo = 0, rHi = 0;
    function slab(o, d, lo, hi) {
      var a, b, t;
      if (d > -1e-9 && d < 1e-9) return o >= lo && o <= hi;
      a = (lo - o) / d; b = (hi - o) / d;
      if (a > b) { t = a; a = b; b = t; }
      if (a > rLo) rLo = a;
      if (b < rHi) rHi = b;
      return rLo <= rHi;
    }
    function boxHit(i, j, h) {
      rLo = 0; rHi = Infinity;
      return slab(ou, du, i - HALF, i + HALF) && slab(ov, dv, j - HALF, j + HALF) && slab(oh, dh, BASE, h);
    }
    function pick(ndcX, ndcY, camera) {
      if (!level) return null;
      ndc.set(ndcX, ndcY);
      raycaster.setFromCamera(ndc, camera);
      var o = raycaster.ray.origin, r = raycaster.ray.direction;
      ou = o.x; ov = -o.z; oh = o.y;                 /* board space: u = game x, v = game y, h = level */
      du = r.x; dv = -r.z; dh = r.y;
      if (dh > -1e-6) return null;                   /* the camera always looks down (elevation 25..90) */
      var w = level.size.w, d = level.size.d;
      var s = Math.max(0, (maxHeight - oh) / dh), sEnd = (BASE - oh) / dh;
      if (sEnd < s) return null;
      var i = Math.round(ou + du * s), j = Math.round(ov + dv * s);
      var stepI = du >= 0 ? 1 : -1, stepJ = dv >= 0 ? 1 : -1;
      var big = Math.abs(du) > 1e-9, bigV = Math.abs(dv) > 1e-9;
      var nextU = big ? (i + stepI * 0.5 - ou) / du : Infinity, nextV = bigV ? (j + stepJ * 0.5 - ov) / dv : Infinity;
      var stepU = big ? Math.abs(1 / du) : Infinity, stepV = bigV ? Math.abs(1 / dv) : Infinity;
      var guard = 0;
      while (s <= sEnd && guard++ < 80) {
        if (i >= 0 && j >= 0 && i < w && j < d && boxHit(i, j, level.t[j][i])) return { x: i, y: j };
        if (nextU < nextV) { s = nextU; i += stepI; nextU += stepU; }
        else { s = nextV; j += stepJ; nextV += stepV; }
      }
      return null;
    }

    function heightAt(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (!level || y < 0 || x < 0 || y >= level.size.d || x >= level.size.w) return 0;
      return level.t[y][x];
    }

    function dispose() {
      Core.clearGroup(group);
      for (var k in mats) if (Object.prototype.hasOwnProperty.call(mats, k)) mats[k].dispose();
      if (leakTex) { leakTex.dispose(); leakTex = null; }
      if (burn) burn.dispose();
    }

    /* MOTION-DIRECTION 8's public surface. `discover` replaces render.js's fog.learnAll(cells, false) for the cells
     * a travelling beam is paying out: it commits each one to the known set at once and then burns it in. Without a
     * registry it IS that same call, so the renderer keeps working unchanged. `cellReveal` is the whole-cell scalar
     * anything that cannot sample the mask per fragment (render-pieces' fixed pieces) should read instead of
     * fog.value(). `onFogSettled` fires once when every reveal from the current trace has settled - the one moment
     * section 8 allows the shadow cache to take in the newly discovered geometry. */
    function discover(cells) { return burn ? burn.discover(cells) : fog.learnAll(cells, false); }
    function cellReveal(x, y) { return burn ? burn.value(x, y) : fog.value(x, y); }

    return { group: group, build: build, applyReveal: applyReveal, pick: pick, heightAt: heightAt, dispose: dispose,
      materials: mats, fitPoints: function () { return fitPoints; }, maxHeight: function () { return maxHeight; },
      openLevelsAt: openLevelsAt,
      discover: discover, cellReveal: cellReveal,
      setDecorCuts: function (c) { if (burn) burn.setDecorCuts(c); },
      isBurning: function () { return !!burn && burn.isBurning(); },
      onFogSettled: function (fn) { if (burn) burn.onSettled(fn); } };
  }

  root.LaserRenderTerrain = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
