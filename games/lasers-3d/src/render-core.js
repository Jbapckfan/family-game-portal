/* Lasers 3D - renderer core helpers (shared by render-*.js and render.js).
 * Global: window.LaserRenderCore. Classic script, ES2019 (Safari 15). Needs THREE (r160 UMD).
 *
 * World mapping (INTERFACES-FRONTEND.md 1.2, FROZEN): game (x, y, z) -> three (x, z, -y).
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;

  function world(x, y, z, out) {
    out = out || new THREE.Vector3();
    return out.set(x, z, -y);
  }

  /* Build a THREE material from a theme materials entry. `ov` overrides / fills 'accent' / 'beam' slots. */
  function matFromSpec(spec, ov) {
    ov = ov || {};
    var Ctor = THREE[spec.material] || THREE.MeshStandardMaterial;
    var m = new Ctor();
    var color = ov.color || spec.color;
    var emissive = ov.emissive || spec.emissive;
    if (typeof color === 'string' && color.charAt(0) === '#') m.color = new THREE.Color(color);
    if (m.emissive !== undefined && typeof emissive === 'string' && emissive.charAt(0) === '#') m.emissive = new THREE.Color(emissive);
    if (m.metalness !== undefined && typeof spec.metalness === 'number') m.metalness = spec.metalness;
    if (m.roughness !== undefined && typeof spec.roughness === 'number') m.roughness = spec.roughness;
    var ei = ov.emissiveIntensity !== undefined ? ov.emissiveIntensity : spec.emissiveIntensity;
    if (m.emissiveIntensity !== undefined && typeof ei === 'number') m.emissiveIntensity = ei;
    var op = ov.opacity !== undefined ? ov.opacity : spec.opacity;
    if (typeof op === 'number') m.opacity = op;
    m.transparent = ov.transparent !== undefined ? ov.transparent : !!spec.transparent;
    if (m.clearcoat !== undefined && typeof spec.clearcoat === 'number') m.clearcoat = spec.clearcoat;
    if (m.clearcoatRoughness !== undefined && typeof spec.clearcoatRoughness === 'number') m.clearcoatRoughness = spec.clearcoatRoughness;
    if (m.transmission !== undefined && typeof spec.transmission === 'number') m.transmission = spec.transmission;
    if (m.ior !== undefined && typeof spec.ior === 'number') m.ior = spec.ior;
    if (spec.side === 'DoubleSide') m.side = THREE.DoubleSide;
    if (spec.blending === 'AdditiveBlending') m.blending = THREE.AdditiveBlending;
    if (spec.depthWrite === false) m.depthWrite = false;
    if (spec.depthTest === false) m.depthTest = false;
    if (spec.toneMapped === false) m.toneMapped = false;
    return m;
  }

  /* Brushed-metal grain: 64x2 canvas of near-white vertical bands (<= 8% luminance contrast),
   * used as a map under the housing colour so the colour stays metal-mid. */
  var grainCache = null;
  function grainTexture(theme) {
    if (grainCache) return grainCache;
    var g = theme.brushedGrain;
    var c = document.createElement('canvas');
    c.width = g.width; c.height = g.height;
    var ctx = c.getContext('2d');
    var hi = 255, lo = Math.round(255 * (1 - g.maxLuminanceContrast));
    for (var x = 0; x < g.width; x++) {
      var v = (x % 2 === 0) ? hi : lo;
      ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      ctx.fillRect(x, 0, 1, g.height);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(g.repeatX, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    grainCache = markShared(tex);
    return tex;
  }

  /* Merge non-indexed geometries (position/normal/uv) into one BufferGeometry. No addons. */
  function mergeGeometries(list) {
    var pos = [], nor = [], uv = [], i, j, g, p, n, u;
    for (i = 0; i < list.length; i++) {
      g = list[i].index ? list[i].toNonIndexed() : list[i];
      p = g.getAttribute('position'); n = g.getAttribute('normal'); u = g.getAttribute('uv');
      for (j = 0; j < p.count * 3; j++) pos.push(p.array[j]);
      for (j = 0; j < p.count * 3; j++) nor.push(n ? n.array[j] : 0);
      for (j = 0; j < p.count * 2; j++) uv.push(u ? u.array[j] : 0);
      if (g !== list[i]) g.dispose();
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return out;
  }

  /* Box placed by center + size (world units), returned as a transformed geometry for merging. */
  function boxAt(cx, cy, cz, sx, sy, sz) {
    var g = new THREE.BoxGeometry(sx, sy, sz);
    g.translate(cx, cy, cz);
    return g;
  }

  /* Canvas-drawn sprite textures. */
  function makeCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function badgeTexture(theme, level) {
    var b = theme.beam.badge, scale = 4;
    var w = b.widthPx * scale, h = b.heightPx * scale;
    var c = makeCanvas(w, h), ctx = c.getContext('2d'), r = h / 2, bw = b.borderPx * scale;
    var color = theme.beamColors[level];
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = b.glowPx * scale;
    roundRect(ctx, bw, bw, w - 2 * bw, h - 2 * bw, r - bw);
    ctx.fillStyle = b.fill; ctx.fill();
    ctx.restore();
    roundRect(ctx, bw, bw, w - 2 * bw, h - 2 * bw, r - bw);
    ctx.lineWidth = bw; ctx.strokeStyle = color; ctx.stroke();
    ctx.fillStyle = theme.palette.uiText;
    ctx.font = b.fontWeight + ' ' + (b.fontSizePx * scale) + 'px ' + theme.ui.fonts.data;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.labels[level], w / 2, h / 2 + scale);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r); ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    ctx.closePath();
  }

  /* Soft radial glow (halo) or a starburst with `streaks` glass-like rays. */
  function glowTexture(color, streaks) {
    var s = 128, c = makeCanvas(s, s), ctx = c.getContext('2d'), i;
    var g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    if (streaks) {
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
      for (i = 0; i < streaks; i++) {
        ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, s / 2 - 2); ctx.stroke();
        ctx.rotate(Math.PI * 2 / streaks);
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* Resource ownership. Module-level geometries / materials / textures that many meshes reuse are flagged with
   * `userData.shared = true` (markShared) and are NEVER disposed by disposeObject/clearGroup; only the module that
   * created them disposes them in its own dispose(). Everything else (per-piece, per-effect, per-target) is owned
   * by the object and freed with it. Disposing a shared material makes three.js recompile its shader program on
   * the next frame (a per-tap hitch); disposing a shared texture forces a re-upload. */
  function markShared(r) { if (r && r.userData) r.userData.shared = true; return r; }
  function isShared(r) { return !!(r && r.userData && r.userData.shared === true); }
  function markSharedAll(list) { for (var i = 0; i < list.length; i++) markShared(list[i]); return list; }

  function disposeObject(obj) {
    obj.traverse(function (o) {
      if (o.geometry && !o.isSprite && !isShared(o.geometry)) o.geometry.dispose();   /* Sprite.geometry is three's own shared quad */
      if (o.material) {
        var mats = Array.isArray(o.material) ? o.material : [o.material];
        for (var i = 0; i < mats.length; i++) {
          if (isShared(mats[i])) continue;
          if (mats[i].map && !isShared(mats[i].map)) mats[i].map.dispose();
          mats[i].dispose();
        }
      }
    });
  }

  function clearGroup(group) {
    while (group.children.length) { var c = group.children[group.children.length - 1]; group.remove(c); disposeObject(c); }
  }

  /* Monotone-chain convex hull of [x0,y0, x1,y1, ...] -> the same flat form, counter-clockwise, no duplicate end.
   * Used to shrink the camera-fit candidate set: the maximum of a linear function over a point set is attained on
   * its hull, so a 24x24 board's 2304 top-face corners collapse to a handful of points per height level. */
  function convexHull2D(pts) {
    var n = pts.length / 2, i, idx = [];
    for (i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return pts[a * 2] - pts[b * 2] || pts[a * 2 + 1] - pts[b * 2 + 1]; });
    /* dedup */
    var uniq = [];
    for (i = 0; i < idx.length; i++) {
      var j = idx[i];
      if (uniq.length && pts[uniq[uniq.length - 1] * 2] === pts[j * 2] && pts[uniq[uniq.length - 1] * 2 + 1] === pts[j * 2 + 1]) continue;
      uniq.push(j);
    }
    if (uniq.length < 3) { var out0 = []; for (i = 0; i < uniq.length; i++) out0.push(pts[uniq[i] * 2], pts[uniq[i] * 2 + 1]); return out0; }
    function cross(o, a, b) {
      return (pts[a * 2] - pts[o * 2]) * (pts[b * 2 + 1] - pts[o * 2 + 1]) - (pts[a * 2 + 1] - pts[o * 2 + 1]) * (pts[b * 2] - pts[o * 2]);
    }
    var lower = [], upper = [];
    for (i = 0; i < uniq.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], uniq[i]) <= 0) lower.pop();
      lower.push(uniq[i]);
    }
    for (i = uniq.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], uniq[i]) <= 0) upper.pop();
      upper.push(uniq[i]);
    }
    lower.pop(); upper.pop();
    var hull = lower.concat(upper), out = [];
    for (i = 0; i < hull.length; i++) out.push(pts[hull[i] * 2], pts[hull[i] * 2 + 1]);
    return out;
  }

  function smoothstep(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : (t > 1 ? 1 : t); return t * t * (3 - 2 * t); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  root.LaserRenderCore = {
    __version: 1,
    world: world, matFromSpec: matFromSpec, grainTexture: grainTexture,
    mergeGeometries: mergeGeometries, boxAt: boxAt,
    badgeTexture: badgeTexture, glowTexture: glowTexture,
    disposeObject: disposeObject, clearGroup: clearGroup, smoothstep: smoothstep, clamp: clamp, convexHull2D: convexHull2D,
    markShared: markShared, markSharedAll: markSharedAll, isShared: isShared
  };
}(typeof self !== 'undefined' ? self : this));
