/* Lasers 3D - beam: merged 6-sided tubes per altitude (core / glow / filament), arc-length reveal,
 * end-state effects (VISUAL-DIRECTION.md G) and altitude badges.
 * Global: window.LaserRenderBeam. Classic script, ES2019. Needs THREE + LaserRenderCore + LaserTheme.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;

  function create(theme) {
    var B = theme.beam, ES = B.endStates;
    var group = new THREE.Group(); group.name = 'beam';
    var tubes = new THREE.Group(), fx = new THREE.Group(), badges = new THREE.Group();
    group.add(tubes); group.add(fx); group.add(badges);
    var uHead = { value: 0 }, uBias = { value: 0 };
    var DEPTH_BIAS_WORLD = 0.08;   /* pull the beam toward the camera so a tube grazing a block edge is not clipped */

    /* Shader hook: hide every fragment beyond the head distance (arc length along the beam) + depth bias. */
    function headHook(m) {
      m.onBeforeCompile = function (s) {
        s.uniforms.uHead = uHead; s.uniforms.uBias = uBias;
        s.vertexShader = 'attribute float aDist;\nvarying float vDist;\nuniform float uBias;\n' + s.vertexShader
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDist = aDist;')
          .replace('#include <project_vertex>', '#include <project_vertex>\n gl_Position.z -= uBias * gl_Position.w;');
        s.fragmentShader = 'uniform float uHead;\nvarying float vDist;\n' + s.fragmentShader.replace('void main() {', 'void main() {\n if (vDist > uHead) discard;');
      };
      m.customProgramCacheKey = function () { return 'lasers3d-beam-head'; };
      return m;
    }
    var mats = { core: [], glow: [], filament: [] };
    B.levels.forEach(function (L, z) {
      mats.core[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamCore, { color: L.color, emissive: L.color, emissiveIntensity: L.coreEmissive })));
      mats.glow[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamGlow, { color: L.color, opacity: L.glowOpacity })));
      mats.filament[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamFilament)));
    });
    var badgeTex = [], ringGeo = new THREE.RingGeometry(0.5 - 0.0625, 0.5, 40), discGeo = new THREE.CircleGeometry(0.5, 8);
    var sparkGeo = new THREE.SphereGeometry(0.5, 8, 6), triGeo = new THREE.CircleGeometry(0.5, 3);
    var burstTex = { hit: Core.markShared(Core.glowTexture(theme.palette.targetLit, ES.target.streaks)) };
    Core.markSharedAll([ringGeo, discGeo, sparkGeo, triGeo]);

    /* ---- tube building ---- */
    function Bucket() { this.pos = []; this.nor = []; this.dist = []; }
    var tmpA = new THREE.Vector3(), tmpN1 = new THREE.Vector3(), tmpN2 = new THREE.Vector3();
    function tube(bk, P, Q, r0, r1, d0, d1, extS, extE) {
      var axis = tmpA.subVectors(Q, P).normalize(), sides = B.tubeSides;
      var n1 = Math.abs(axis.y) > 0.9 ? tmpN1.set(1, 0, 0) : tmpN1.set(0, 1, 0).cross(axis).normalize();
      var n2 = tmpN2.crossVectors(axis, n1).normalize();
      var px = P.x - (extS ? axis.x * r0 : 0), py = P.y - (extS ? axis.y * r0 : 0), pz = P.z - (extS ? axis.z * r0 : 0);
      var qx = Q.x + (extE ? axis.x * r1 : 0), qy = Q.y + (extE ? axis.y * r1 : 0), qz = Q.z + (extE ? axis.z * r1 : 0);
      var ring = [], i, a, nx, ny, nz;
      for (i = 0; i <= sides; i++) {
        a = i / sides * Math.PI * 2;
        nx = Math.cos(a) * n1.x + Math.sin(a) * n2.x; ny = Math.cos(a) * n1.y + Math.sin(a) * n2.y; nz = Math.cos(a) * n1.z + Math.sin(a) * n2.z;
        ring.push([nx, ny, nz]);
      }
      function v(k, atQ) {
        var n = ring[k], r = atQ ? r1 : r0;
        bk.pos.push((atQ ? qx : px) + n[0] * r, (atQ ? qy : py) + n[1] * r, (atQ ? qz : pz) + n[2] * r);
        bk.nor.push(n[0], n[1], n[2]); bk.dist.push(atQ ? d1 : d0);
      }
      for (i = 0; i < sides; i++) { v(i, false); v(i + 1, false); v(i, true); v(i + 1, false); v(i + 1, true); v(i, true); }
    }
    function bucketMesh(bk, mat) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(bk.nor, 3));
      g.setAttribute('aDist', new THREE.Float32BufferAttribute(bk.dist, 1));
      var m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
    }

    /* ---- state ---- */
    var state = null;   /* { total, head, speed, playing, marks, lits, end, endPos, endDir, fired } */
    var effects = [], onLit = function () {};

    function clear() {
      while (effects.length) removeFx(effects.length - 1);
      Core.clearGroup(tubes); Core.clearGroup(fx); Core.clearGroup(badges);
      effects = []; state = null; uHead.value = 0;
    }

    function set(result, opts, motion) {
      clear();
      if (!result || !result.segments || !result.segments.length) return;
      opts = opts || {};
      var cores = [], glows = [], fils = [], i, z;
      for (z = 0; z < 4; z++) { cores.push(new Bucket()); glows.push(new Bucket()); fils.push(new Bucket()); }
      var cum = 0, marks = [], lits = [], segs = result.segments, P = new THREE.Vector3(), Q = new THREE.Vector3(), lastDir = new THREE.Vector3(1, 0, 0);
      var edge = result.end === 'lost-edge', run = null, runs = [];
      for (i = 0; i < segs.length; i++) {
        var s = segs[i], last = i === segs.length - 1, stub = (s.to.x % 1 !== 0) || (s.to.y % 1 !== 0);
        var toH = stub ? s.from.z + B.heightOffset + 0.5 * s.v : s.to.z + B.heightOffset;
        Core.world(s.from.x, s.from.y, s.from.z + B.heightOffset, P);
        Core.world(s.to.x, s.to.y, 0, Q); Q.y = toH;
        if (last && edge) Q.lerp(P, 0.5);                        /* stop at the board edge */
        var z0 = Core.clamp(s.from.z, 0, 3), z1 = Core.clamp(Math.round(stub ? s.from.z : s.to.z), 0, 3), len = P.distanceTo(Q);
        /* merge collinear level segments into one tube so additive glow never double-covers a joint */
        if (run && run.z0 === z0 && run.z1 === z1 && run.d === s.d && s.v === 0 && run.v === 0 && !stub) { run.b.copy(Q); run.d1 = cum + len; }
        else { run = { a: P.clone(), b: Q.clone(), z0: z0, z1: z1, d: s.d, v: s.v, d0: cum, d1: cum + len }; runs.push(run); }
        cum += len;
        lastDir.subVectors(Q, P).normalize();
        /* marks / target hits keyed by the cell this segment arrives at */
        result.altitudeMarks.forEach(function (m, mi) {
          if (!marks[mi] && m.x === s.to.x && m.y === s.to.y) marks[mi] = { dist: cum, pos: Q.clone(), z: Core.clamp(Math.round(m.z), 0, 3) };
        });
        if (opts.level) opts.level.targets.forEach(function (t, ti) {
          if (result.hits.indexOf(ti) >= 0 && t.x === s.to.x && t.y === s.to.y && !lits.some(function (l) { return l.index === ti; })) lits.push({ index: ti, dist: cum, pos: Q.clone() });
        });
      }
      runs.forEach(function (r, ri) {
        var L0 = B.levels[r.z0], L1 = B.levels[r.z1], lastRun = ri === runs.length - 1, len = r.a.distanceTo(r.b);
        var parts = [{ a: r.a, b: r.b, r0: L0.coreDiameter / 2, r1: L1.coreDiameter / 2, g0: L0.glowDiameter / 2, g1: L1.glowDiameter / 2, d0: r.d0, d1: r.d1, extE: !lastRun }];
        if (lastRun && edge && len > ES.lostEdge.taperCells) {
          var k = 1 - ES.lostEdge.taperCells / len, mid = r.a.clone().lerp(r.b, k), dm = r.d0 + (r.d1 - r.d0) * k;
          parts = [{ a: r.a, b: mid, r0: L0.coreDiameter / 2, r1: L1.coreDiameter / 2, g0: L0.glowDiameter / 2, g1: L1.glowDiameter / 2, d0: r.d0, d1: dm, extE: false },
                   { a: mid, b: r.b, r0: L1.coreDiameter / 2, r1: 0, g0: L1.glowDiameter / 2, g1: 0, d0: dm, d1: r.d1, extE: false }];
        }
        parts.forEach(function (p, j) {
          var extS = (ri > 0) && j === 0;
          tube(cores[r.z0], p.a, p.b, p.r0, p.r1, p.d0, p.d1, extS, p.extE);
          tube(glows[r.z0], p.a, p.b, p.g0, p.g1, p.d0, p.d1, extS, p.extE);
          if (L0.filament) tube(fils[r.z0], p.a, p.b, p.r0 * B.filament.diameterRatio, p.r1 * B.filament.diameterRatio, p.d0, p.d1, extS, p.extE);
        });
      });
      result.altitudeMarks.forEach(function (m, mi) {
        if (!marks[mi]) marks[mi] = { dist: 0, pos: Core.world(m.x, m.y, m.z + B.heightOffset), z: Core.clamp(Math.round(m.z), 0, 3) };
      });
      for (z = 0; z < 4; z++) {
        if (cores[z].pos.length) { tubes.add(bucketMesh(cores[z], mats.core[z])); var gm = bucketMesh(glows[z], mats.glow[z]); gm.renderOrder = 6; tubes.add(gm); }
        if (fils[z].pos.length) { var fm = bucketMesh(fils[z], mats.filament[z]); fm.renderOrder = 7; tubes.add(fm); }
      }
      /* The travel DURATION is what the player waits through, so it is what is clamped: a 60-cell route on a 24x24
       * board would take 11 s at a fixed 5.5 cells/s and the controls are locked for all of it. Short beams keep a
       * floor so they still read as a beam travelling. */
      var durMs = opts.animate
        ? Core.clamp(cum / Math.max(0.001, motion.cellsPerSecond) * 1000, motion.minDurationMs, motion.maxDurationMs)
        : motion.liveRetraceMs;
      var speed = cum / Math.max(0.001, durMs / 1000);
      state = { total: cum, head: 0, speed: speed, playing: true, marks: marks, lits: lits, end: result.end, endPos: Q.clone(), endDir: lastDir.clone(), fired: !!opts.fired, ended: false };
      if (opts.fired) marks.forEach(function (m) { badges.add(makeBadge(m)); });
    }

    /* Badge sprite materials never change after creation: one shared material per altitude, kept for the renderer's life. */
    var badgeMat = [];
    function makeBadge(m) {
      if (!badgeTex[m.z]) badgeTex[m.z] = Core.markShared(Core.badgeTexture(theme, m.z));
      if (!badgeMat[m.z]) badgeMat[m.z] = Core.markShared(new THREE.SpriteMaterial({ map: badgeTex[m.z], transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
      var sp = new THREE.Sprite(badgeMat[m.z]);
      sp.renderOrder = 20; sp.visible = false; sp.userData.mark = m; return sp;
    }

    /* ---- end-state effects ----
     * Effect materials animate their own opacity, so each live effect needs its own instance; they are pooled per
     * variant and reused across traces (never disposed until dispose()), so a live retrace after every edit does not
     * release and recompile their GL programs. */
    var pool = {};
    function acquire(key, make) {
      var list = pool[key] || (pool[key] = []);
      var m = list.pop();
      if (!m) { m = Core.markShared(make()); m.userData.poolKey = key; }
      m.opacity = 1;
      return m;
    }
    function release(obj) {
      var m = obj && obj.material;
      if (m && m.userData && m.userData.poolKey) pool[m.userData.poolKey].push(m);
    }
    function basic(color, extra) {
      var key = 'basic|' + color + '|' + (extra ? Object.keys(extra).sort().map(function (k) { return k + ':' + String(extra[k]); }).join(',') : '');
      return acquire(key, function () {
        var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
        if (extra) for (var k in extra) m[k] = extra[k];
        return m;
      });
    }
    function burstMaterial() {
      return acquire('sprite|hit', function () {
        return new THREE.SpriteMaterial({ map: burstTex.hit, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      });
    }
    function addFx(obj, ms, update, persist) { fx.add(obj); effects.push({ obj: obj, t: 0, ms: ms, update: update, persist: persist }); }
    function removeFx(i) { var e = effects[i]; fx.remove(e.obj); release(e.obj); Core.disposeObject(e.obj); effects.splice(i, 1); }
    function faceAlong(obj, dir) { obj.lookAt(obj.position.clone().add(dir)); }
    function spawnEnd(st, motion) {
      var e = st.endPos, dir = st.endDir, i;
      if (st.end === 'blocked') {
        var cap = new THREE.Mesh(discGeo, basic(ES.blocked.capColor)); cap.position.copy(e); faceAlong(cap, dir);
        cap.scale.setScalar(ES.blocked.capDiameter); cap.rotation.z += Math.PI / 8; addFx(cap, 1, null, true);
        for (i = 0; i < ES.blocked.sparks; i++) {
          var sp = new THREE.Mesh(sparkGeo, basic(ES.blocked.capColor)); sp.position.copy(e); sp.scale.setScalar(ES.blocked.sparkSize);
          var vel = new THREE.Vector3(Math.sin(i * 2.1) * 0.8, 0.9 + Math.cos(i * 1.7) * 0.4, Math.cos(i * 2.1) * 0.8).sub(dir.clone().multiplyScalar(0.6));
          addFx(sp, ES.blocked.sparkFadeMs, (function (v) { return function (o, k, dt) { o.position.addScaledVector(v, dt * 2.2); o.material.opacity = 1 - k; }; }(vel)), false);
        }
      } else if (st.end === 'lost-edge' || st.end === 'lost-floor' || st.end === 'lost-sky') {
        var spec = st.end === 'lost-edge' ? ES.lostEdge : (st.end === 'lost-floor' ? ES.lostFloor : ES.lostSky);
        var ring = new THREE.Mesh(ringGeo, basic(spec.ringColor)); ring.position.copy(e); ring.scale.setScalar(spec.ringDiameter);
        if (st.end === 'lost-edge') faceAlong(ring, dir);
        else if (st.end === 'lost-floor') { ring.position.y = 0.006; ring.rotation.x = -Math.PI / 2; }
        else ring.userData.screenFacing = true;
        addFx(ring, 1, null, true);
        if (spec.notch) {
          var tri = new THREE.Mesh(triGeo, basic(spec.ringColor)); tri.scale.setScalar(0.07);
          tri.position.copy(ring.position); tri.position.y += spec.notch === 'up' ? spec.ringDiameter * 0.62 : 0.001;
          if (spec.notch === 'up') { tri.rotation.z = Math.PI / 2; tri.userData.screenFacing = true; }
          else { tri.position.z += spec.ringDiameter * 0.62; tri.rotation.x = -Math.PI / 2; tri.rotation.z = -Math.PI / 2; }
          addFx(tri, 1, null, true);
        }
      } else if (st.end === 'loop') {
        for (i = 0; i < 2; i++) {
          var lr = new THREE.Mesh(ringGeo, basic(ES.loop.ringColor)); lr.position.copy(e); lr.scale.setScalar(0.22 + i * 0.1); lr.userData.screenFacing = true;
          addFx(lr, ES.loop.rotateOnceMs, function (o, k) { o.userData.spin = k * Math.PI * 2; }, true);
        }
      }
    }
    function spawnHit(pos) {
      var T = ES.target, i;
      var burst = new THREE.Sprite(burstMaterial());
      burst.position.copy(pos);
      addFx(burst, T.ringMs, function (o, k) { var s = 0.3 + k * 1.1; o.scale.set(s, s, 1); o.material.opacity = 1 - k; }, false);
      for (i = 0; i < T.rings; i++) {
        var r = new THREE.Mesh(ringGeo, basic(theme.palette.targetLit, { blending: THREE.AdditiveBlending })); r.position.copy(pos); r.userData.screenFacing = true;
        addFx(r, T.ringMs * (1 + i * 0.25), function (o, k) { var s = T.ringFrom + (T.ringTo - T.ringFrom) * k; o.scale.setScalar(s); o.material.opacity = 1 - k; }, false);
      }
    }

    /* ---- per frame ---- */
    function frame(dt, view, motion) {
      var i, k;
      if (view.camera) uBias.value = DEPTH_BIAS_WORLD * 2 / (view.camera.far - view.camera.near);
      if (state) {
        if (state.playing) {
          state.head = Math.min(state.total, state.head + state.speed * dt);
          uHead.value = state.head;
          for (i = 0; i < state.lits.length; i++) {   /* plain loop: no closure allocated per frame */
            var l = state.lits[i];
            if (!l.done && state.head >= l.dist - 1e-6) { l.done = true; onLit(l.index, l.pos); spawnHit(l.pos); }
          }
          if (state.head >= state.total - 1e-6) { state.playing = false; spawnEnd(state, motion); state.ended = true; }
        }
        for (i = 0; i < badges.children.length; i++) {
          var b = badges.children[i], m = b.userData.mark;
          b.visible = state.head >= m.dist - 1e-6;
          var px = 1 / view.zoom;
          b.scale.set(B.badge.widthPx * px, B.badge.heightPx * px, 1);
          b.position.copy(m.pos).addScaledVector(view.up, (B.badge.offsetAbovePx + B.badge.heightPx / 2) * px);
        }
      }
      for (i = effects.length - 1; i >= 0; i--) {
        var e = effects[i]; e.t += dt * 1000; k = Math.min(1, e.t / e.ms);
        if (e.update) e.update(e.obj, k, dt);
        if (e.obj.userData.screenFacing) { e.obj.quaternion.copy(view.quaternion); if (e.obj.userData.spin) e.obj.rotateZ(e.obj.userData.spin); }
        if (k >= 1 && !e.persist) removeFx(i);
      }
    }

    function getProgress() {
      return state ? { playing: state.playing, cells: state.head, total: state.total } : { playing: false, cells: 0, total: 0 };
    }
    /* Jump the head to the end of the path. The next frame() then fires every remaining target hit and the end-state
     * effect exactly as if the beam had flown there, so a skipped animation reaches the same visual state. */
    function skip() { if (state && state.playing) state.head = state.total; }
    /* Frames are still needed while the beam is flying or any end-state effect is still easing. Persistent effects
     * (end caps, rings) freeze once k reaches 1, so they must not pin the loop on for ever. */
    function isAnimating() {
      if (state && state.playing) return true;
      for (var i = 0; i < effects.length; i++) if (effects[i].t < effects[i].ms) return true;
      return false;
    }
    function dispose() {
      clear();
      ['core', 'glow', 'filament'].forEach(function (k) { mats[k].forEach(function (m) { m.dispose(); }); });
      Object.keys(pool).forEach(function (k) { pool[k].forEach(function (m) { m.dispose(); }); }); pool = {};
      badgeMat.forEach(function (m) { if (m) m.dispose(); }); badgeMat = [];
      badgeTex.forEach(function (t) { if (t) t.dispose(); }); burstTex.hit.dispose();
      ringGeo.dispose(); discGeo.dispose(); sparkGeo.dispose(); triGeo.dispose();
    }

    return { group: group, set: set, clear: clear, frame: frame, getProgress: getProgress, skip: skip,
      isAnimating: isAnimating, dispose: dispose,
      onLit: function (fn) { onLit = fn || function () {}; } };
  }

  root.LaserRenderBeam = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
