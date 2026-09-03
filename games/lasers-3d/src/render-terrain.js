/* Lasers 3D - terrain: merged voxel geometry, grid outlines, analytic picking, camera-fit points, reveal shader.
 * Global: window.LaserRenderTerrain. Classic script, ES2019. Needs THREE + LaserRenderCore.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;

  /* Inject the FLAT mix after tone mapping + colour space so uReveal = 0 yields EXACTLY #172544. */
  function revealMaterial(spec, theme, uReveal) {
    var m = Core.matFromSpec(spec);
    var v = theme.terrain.flatColorVec4;
    m.onBeforeCompile = function (shader) {
      shader.uniforms.uReveal = uReveal;
      shader.uniforms.uFlat = { value: new THREE.Vector4(v[0], v[1], v[2], v[3]) };
      shader.fragmentShader = 'uniform float uReveal;\nuniform vec4 uFlat;\n' + shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n gl_FragColor = mix(uFlat, gl_FragColor, uReveal);'
      );
    };
    m.customProgramCacheKey = function () { return 'lasers3d-reveal'; };
    return m;
  }

  function create(theme) {
    var uReveal = { value: 0 };
    var mats = {
      floor: revealMaterial(theme.materials.floor, theme, uReveal),
      top: revealMaterial(theme.materials.blockTopLit, theme, uReveal),
      side: Core.matFromSpec(theme.materials.blockSide),
      grid: new THREE.LineBasicMaterial({ color: new THREE.Color(theme.palette.gridOutline), toneMapped: false })
    };
    Core.markSharedAll([mats.floor, mats.top, mats.side, mats.grid]);
    mats.side.opacity = 0;
    mats.top.polygonOffset = true; mats.top.polygonOffsetFactor = 1; mats.top.polygonOffsetUnits = 1;
    mats.floor.polygonOffset = true; mats.floor.polygonOffsetFactor = 1; mats.floor.polygonOffsetUnits = 1;

    var group = new THREE.Group();
    group.name = 'terrain';
    var level = null, maxHeight = 0, fitPoints = new Float32Array(0);

    function build(parsed) {
      level = parsed;
      Core.clearGroup(group);
      var w = parsed.size.w, d = parsed.size.d, t = parsed.t;
      var cell = theme.terrain.cellTop, x, y, h;
      var tops = [], sides = [], lines = [];
      var byHeight = [];   /* height -> flat [worldX, worldZ, ...] of that height's top-face corners */
      maxHeight = 0;

      /* Base floor slab: one quad under the whole board so gaps show floor colour (never the page). */
      var base = new THREE.PlaneGeometry(w, d);
      base.rotateX(-Math.PI / 2);
      base.translate((w - 1) / 2, -0.01, -(d - 1) / 2);
      var baseMesh = new THREE.Mesh(base, mats.floor);
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      for (y = 0; y < d; y++) {
        for (x = 0; x < w; x++) {
          h = t[y][x];
          if (h > 0) {
            var top = new THREE.PlaneGeometry(cell, cell);
            top.rotateX(-Math.PI / 2);
            top.translate(x, h, -y);
            tops.push(top);
            /* four vertical faces from z=0 to z=h */
            var hc = cell / 2;
            sides.push(sideQuad([x + hc, 0, -y + hc], [x + hc, 0, -y - hc], h, [1, 0, 0]));
            sides.push(sideQuad([x - hc, 0, -y - hc], [x - hc, 0, -y + hc], h, [-1, 0, 0]));
            sides.push(sideQuad([x - hc, 0, -y + hc], [x + hc, 0, -y + hc], h, [0, 0, 1]));
            sides.push(sideQuad([x + hc, 0, -y - hc], [x - hc, 0, -y - hc], h, [0, 0, -1]));
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

    /* Vertical quad from world point a to b (both at y=0) up to height h, with the given outward normal. */
    function sideQuad(a, b, h, n) {
      var g = new THREE.BufferGeometry();
      var p = [a[0], 0, a[2], b[0], 0, b[2], b[0], h, b[2], a[0], 0, a[2], b[0], h, b[2], a[0], h, a[2]];
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
    }

    return { group: group, build: build, applyReveal: applyReveal, pick: pick, heightAt: heightAt, dispose: dispose,
      materials: mats, fitPoints: function () { return fitPoints; }, maxHeight: function () { return maxHeight; } };
  }

  root.LaserRenderTerrain = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
