/* Lasers 3D - terrain: merged voxel geometry, grid outlines, analytic picking, camera-fit points, reveal shader.
 * Global: window.LaserRenderTerrain. Classic script, ES2019. Needs THREE + LaserRenderCore.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;

  /* Inject the FLAT mix after tone mapping + colour space so uReveal = 0 yields EXACTLY #172544, then - on a dark
   * level (DESIGN.md 15) - the fog mix on top of it, so fog 0 yields exactly theme.terrain.darkness.unknownColor.
   * Order matters and is fixed: reveal first, fog second. The FLAT lie decides what a cell WOULD look like; the fog
   * decides whether the player has earned the right to see it yet. Doing it the other way round would let a
   * half-revealed cell come out lighter than the lit board it is supposed to be converging on. */
  function revealMaterial(spec, theme, uReveal, fog, mode, tint) {
    var m = Core.matFromSpec(spec);
    var v = theme.terrain.flatColorVec4;
    m.onBeforeCompile = function (shader) {
      shader.uniforms.uReveal = uReveal;
      shader.uniforms.uFlat = { value: new THREE.Vector4(v[0], v[1], v[2], v[3]) };
      shader.fragmentShader = 'uniform float uReveal;\nuniform vec4 uFlat;\n' + shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n gl_FragColor = mix(uFlat, gl_FragColor, uReveal);'
      );
      if (fog) Core.fogShader(shader, fog, mode, tint);
    };
    /* The cache key must name the injection, or three hands two differently-patched materials the same program:
     * the ground slab (which never moves) and the block tops (which grow out of it) are otherwise identical. */
    m.customProgramCacheKey = function () { return 'lasers3d-reveal|' + (fog ? mode + '|' + tint : 'nofog'); };
    return m;
  }

  /* The same injection for a material that has no FLAT mix of its own (the sides, the outline, the light leak). */
  function fogMaterial(m, fog, mode, tint) {
    if (!fog) return m;
    m.onBeforeCompile = function (shader) { Core.fogShader(shader, fog, mode, tint); };
    m.customProgramCacheKey = function () { return 'lasers3d-fog|' + mode + '|' + tint; };
    return m;
  }

  function create(theme, fog) {
    var uReveal = { value: 0 };
    var LEAK = theme.terrain.lightLeak;
    var mats = {
      /* The board's ground plane. It is the ONE surface darkness never removes (15.1: the player must always be
       * able to see the board's extent and tap a cell), so it is tinted rather than gated - 'none' because it is
       * itself the ground and has nowhere to rise from. */
      floor: revealMaterial(theme.materials.floor, theme, uReveal, fog, 'none', 'ground'),
      top: revealMaterial(theme.materials.blockTopLit, theme, uReveal, fog, 'rise', 'mix'),
      side: fogMaterial(Core.matFromSpec(theme.materials.blockSide), fog, 'rise', 'mix'),
      /* 15.1: "The empty grid outline is ALWAYS drawn." So the outline is the one fogged material that never
       * discards - it only lies flat on the ground plane and dims to uFogGrid until its cell is known. */
      grid: fogMaterial(new THREE.LineBasicMaterial({ color: new THREE.Color(theme.palette.gridOutline), toneMapped: false }), fog, 'lift', 'grid'),
      /* DESIGN.md 13.3: the ONE mark the flat view is allowed to show. Additive over the floor so it reads as light
       * escaping, never as paint; depthWrite off so it cannot disturb anything drawn after it. On a dark level it
       * is one of the things 15.1 hides until the beam has been there, and additive light cannot be darkened by
       * mixing toward a colour, so the fog scales it to nothing instead. */
      leak: fogMaterial(new THREE.MeshBasicMaterial({ color: new THREE.Color(LEAK.color), transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), fog, 'rise', 'alpha')
    };
    var leakTex = null;
    Core.markSharedAll([mats.floor, mats.top, mats.side, mats.grid, mats.leak]);
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
    function build(parsed) {
      level = parsed;
      Core.clearGroup(group);
      var w = parsed.size.w, d = parsed.size.d, t = parsed.t;
      var cell = theme.terrain.cellTop, hc = cell / 2, x, y, h, k;
      var tops = [], sides = [], lines = [], leaks = [];
      var byHeight = [];   /* height -> flat [worldX, worldZ, ...] of that height's top-face corners */
      maxHeight = 0;
      openings = Core.openMask(parsed);
      var om = openings.mask;

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
          lines.push(a, zl, c, b, zl, c, b, zl, c, b, zl, e, b, zl, e, a, zl, e, a, zl, e, a, zl, c);
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
        sideMesh.castShadow = true; sideMesh.receiveShadow = true;
        group.add(sideMesh);
      }
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
      var lineMesh = new THREE.LineSegments(lg, mats.grid);
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
      var so = Math.min(1, r / theme.lightRig.reveal.sideOpacityFullAt);
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
    }

    return { group: group, build: build, applyReveal: applyReveal, pick: pick, heightAt: heightAt, dispose: dispose,
      materials: mats, fitPoints: function () { return fitPoints; }, maxHeight: function () { return maxHeight; },
      openLevelsAt: openLevelsAt };
  }

  root.LaserRenderTerrain = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
