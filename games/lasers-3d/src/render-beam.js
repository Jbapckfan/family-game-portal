/* Lasers 3D - THE BEAM AS A LIVING THING (MOTION-DIRECTION.md sections 1 and 2).
 * Global: window.LaserRenderBeam. Classic script, ES2019. Needs THREE + LaserRenderCore + LaserTheme.
 *
 * WHAT THIS FILE OWNS
 *   - the merged 6-sided tubes per altitude (core / glow / filament / departure) and their arc-length reveal
 *   - the travelling head highlight and the pulse train, both as UNIFORMS on that merged geometry (section 1)
 *   - one ordered EVENT CURSOR per trace, driven by the simulation's own `result.events` stream, which dispatches
 *     contact discs, scatter streaks, FLOOR bounce dots, target arrivals, altitude badges and the three terminal
 *     behaviours (blocked / lost / loop) at their arc distances (section 2)
 *
 * ONE CLOCK. Everything above is a pure function of ONE accumulator, `state.clock` (ms since the FIRE was accepted).
 * The head position, every scheduled event time, every fade and every sprite's age are derived from it, and it is
 * clamped to `state.animEndMs` - a value computed up front in set() as the last instant at which anything on screen
 * still changes. isAnimating() is therefore exactly `clock < animEndMs`: it cannot drift, it cannot be forgotten by
 * an effect that failed to unregister, and it goes false on the same frame that draws the settled picture. That is
 * how this module keeps main.js's dirty-driven loop (main.loop -> render.needsFrame -> beam.isAnimating) returning
 * to ZERO scheduled frames. There is no requestAnimationFrame, no setTimeout, no setInterval and no free-running
 * shader clock anywhere in this file: the pulse uniforms advance only while `clock < animEndMs`.
 *
 * THE FLAT-VIEW INFORMATION BOUNDARY OUTRANKS EVERYTHING HERE. Nothing in this file samples terrain height, opening
 * height, opening count or opening shape. The only altitude any effect reads is the TRACED BEAM'S OWN (its segment
 * pitch, its arrival level), which MOTION-DIRECTION.md explicitly permits after a FIRE because the beam already
 * announces it through the settled colour-and-width ramp.
 *
 * DRAW CALLS. All new transient decoration - contact discs, scatter streaks, blocked sparks, FLOOR bounce dots and
 * the eight target streaks - lives in TWO InstancedMeshes (one disc, one quad) with a per-instance alpha attribute.
 * That is 2 new draw calls for every sprite in the game, against the budget of 4 (m.budget.newDrawCallsMax), and it
 * is why nothing here is a per-object mesh with a per-frame JavaScript transform of its own.
 *
 * SEAMS THIS MODULE EXPOSES FOR THE INTEGRATOR (see the report):
 *   setGlowMultiplier(k)  the reveal's beam-glow intake (section 3) as a shared uniform - render.js already calls it
 *   setChargeMs(ms)       enables section 2's T0..T0+chargeMs emitter charge before the head is released
 *   getCharge()           { intensity, halo } in 0..1, so render-pieces can drive the emitter filament and halo
 *   attachMotion(reg)     an optional LaserMotion lease, so cancelAll()/documentHidden() reach the beam
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;

  function create(theme) {
    var B = theme.beam, ES = B.endStates;
    /* The art director's ledger. `M` is theme.motion; every number below comes from it or from theme.beam. */
    var M = theme.motion, MB = M.beam, MC = M.contact, MSC = M.scatter, MF = M.fire, MT = M.target, MFA = M.failure;
    var MRED = M.reduced;
    /* Easings by LEDGER NAME (m.easing.*), never by hand-rolled curve. */
    var easeLinear = theme.easeByName(M.easing.linear), easeSmooth = theme.easeByName(M.easing.smooth);
    var easeEnter = theme.easeByName(M.easing.enter), easeExit = theme.easeByName(M.easing.exit);

    var group = new THREE.Group(); group.name = 'beam';
    var tubes = new THREE.Group(), fx = new THREE.Group(), badges = new THREE.Group(), sprites = new THREE.Group();
    tubes.name = 'beamTubes'; fx.name = 'beamFx'; badges.name = 'beamBadges'; sprites.name = 'beamSprites';
    group.add(tubes); group.add(fx); group.add(badges); group.add(sprites);

    var uHead = { value: 0 }, uBias = { value: 0 };
    /* uPulse = (elapsedTravelMs, speed in cells per ms, master gain). uPk = (packetIntervalMs, packetMs, packetGain,
     * headCells). Shared by every beam material, so the whole modulation is ONE uniform write per frame. */
    var uPulse = { value: new THREE.Vector3(0, 1, 0) };
    var uPk = { value: new THREE.Vector4(MB.packetIntervalMs, MB.packetMs, MB.packetGain, MB.headCells) };
    var uHeadGain = { value: MB.headGain }, uGlowMul = { value: 1 };
    /* The section-6 victory seal: ONE whole-route gain of m.win.beamSealGain * bell(t), added identically to the
     * core emissive and the glow opacity at every point of the route. It is deliberately position-independent -
     * a travelling flourish here would be a second pulse train, and section 6 forbids celebratory circulation.
     * It is exactly 0 at rest, so the sealed beam settles to the same baseline every altitude reading depends on. */
    var uSeal = { value: 0 };
    var uSweep = { value: new THREE.Vector2(-1, 0) };
    /* MOTION-DIRECTION.md "What to cut first". A SHARED, host-owned object (see render.setQualityCut): rung 2
     * takes scatter streaks and target streaks, rung 3 takes target rings, rung 4 takes the trailing pulse train.
     * Nothing here cuts a contact disc, a blocked cap, a lost departure, a badge, an altitude width or a FLOOR
     * bounce dot - those are evidence, and the ladder's rules forbid spending them. */
    var cuts = { weather: false, scatter: false, rings: false, pulses: false };
    function setDecorCuts(c) { if (c) cuts = c; uPk.value.z = cuts.pulses ? 0 : MB.packetGain; }
    var DEPTH_BIAS_WORLD = 0.08;   /* pull the beam toward the camera so a tube grazing a block edge is not clipped */
    var FX_DEPTH_BIAS = '2.0';     /* decoration sits one bias step in FRONT of the beam it marks (shader literal) */

    /* The pulse train, evaluated analytically in the fragment shader. At a fixed point the packets are
     * packetIntervalMs apart and packetMs long, so at most ceil(packetMs / interval) + 1 = 3 can overlap; the loop
     * is a fixed 3 and masks the out-of-range ones with step() rather than branching (Safari 15 / ANGLE safe).
     * `vPeak` is the per-vertex peakAt of m.beam.peakAt, blended over m.beam.pitchBlendCells at every join. */
    var PULSE_GLSL =
      'uniform float uHead;\nuniform vec3 uPulse;\nuniform vec4 uPk;\nuniform float uHeadGain;\nuniform float uSeal;\nuniform vec2 uSweep;\n' +
      'varying float vDist;\nvarying float vFade;\nvarying float vPeak;\n' +
      'float l3ss(float t){ t = clamp(t, 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }\n' +
      'float l3pulse(){\n' +
      '  float t0 = uPulse.x - vDist / max(uPulse.y, 1e-6);\n' +
      '  float kf = floor(t0 / uPk.x);\n' +
      '  float sum = 0.0;\n' +
      '  for (int i = 0; i < 3; i++) {\n' +
      '    float k = kf - float(i);\n' +
      '    float u = (t0 - k * uPk.x) / uPk.y;\n' +
      '    float ok = step(0.0, k) * step(0.0, u) * step(u, 1.0);\n' +
      '    float rise = l3ss(u / max(vPeak, 1e-4));\n' +
      '    float fall = 1.0 - l3ss((u - vPeak) / max(1.0 - vPeak, 1e-4));\n' +
      '    sum += ok * mix(fall, rise, step(u, vPeak));\n' +
      '  }\n' +
      '  return sum * uPk.z;\n' +
      '}\n';

    /* Shader hook: hide every fragment beyond the head distance (arc length along the beam) + depth bias, and scale
     * the fragment's alpha by the per-vertex `aFade` that the departure (see set()) tapers to zero. EVERY beam mesh
     * carries aFade - 1 all along the beam proper - because a missing attribute reads as 0 and would blank the beam.
     * `kind` picks what the section-1 modulation drives: 'emissive' raises the core/filament/departure light BEFORE
     * tone mapping (a true emissive gain, never a post-tonemap smear); 'glow' raises the additive glow's opacity.
     * The head highlight is emissive only - "it affects light intensity only; never enlarge or displace the
     * centerline" - and the darkest trough of both is exactly 1.0, the settled baseline, so motion can never
     * temporarily disguise altitude. */
    function headHook(m, kind) {
      var glow = kind === 'glow';
      m.onBeforeCompile = function (s) {
        s.uniforms.uHead = uHead; s.uniforms.uBias = uBias; s.uniforms.uPulse = uPulse;
        s.uniforms.uPk = uPk; s.uniforms.uHeadGain = uHeadGain; s.uniforms.uGlowMul = uGlowMul; s.uniforms.uSeal = uSeal;
        s.uniforms.uSweep = uSweep;
        s.vertexShader = 'attribute float aDist;\nattribute float aFade;\nattribute float aPeak;\n' +
          'varying float vDist;\nvarying float vFade;\nvarying float vPeak;\nuniform float uBias;\n' + s.vertexShader
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n vDist = aDist;\n vFade = aFade;\n vPeak = aPeak;')
          .replace('#include <project_vertex>', '#include <project_vertex>\n gl_Position.z -= uBias * gl_Position.w;');
        s.fragmentShader = PULSE_GLSL + 'uniform float uGlowMul;\n' + s.fragmentShader
          .replace('void main() {', 'void main() {\n if (vDist > uHead) discard;\n float l3g = uPulse.z * l3pulse() + uSweep.y * (1.0 - smoothstep(0.0,1.6,abs(vDist-uSweep.x)));')
          .replace('#include <opaque_fragment>', glow ? '#include <opaque_fragment>'
            : '#include <opaque_fragment>\n gl_FragColor.rgb *= 1.0 + uSeal + l3g + uPulse.z * uHeadGain * l3ss(1.0 - (uHead - vDist) / max(uPk.w, 1e-4));')
          .replace('#include <dithering_fragment>', glow
            ? '#include <dithering_fragment>\n gl_FragColor.a *= vFade * uGlowMul * (1.0 + uSeal + l3g);'
            : '#include <dithering_fragment>\n gl_FragColor.a *= vFade;');
      };
      m.customProgramCacheKey = function () { return 'lasers3d-beam-' + (glow ? 'glow' : 'emissive'); };
      return m;
    }
    var mats = { core: [], glow: [], filament: [] };
    B.levels.forEach(function (L, z) {
      mats.core[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamCore, { color: L.color, emissive: L.color, emissiveIntensity: L.coreEmissive }), 'emissive'));
      mats.glow[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamGlow, { color: L.glowColor || L.color, opacity: L.glowOpacity }), 'glow'));
      mats.filament[z] = Core.markShared(headHook(Core.matFromSpec(theme.materials.beamFilament), 'emissive'));
    });
    /* The departure fades its opacity to zero, which the OPAQUE core material cannot express (alpha is ignored with
     * blending off), so the departure's core gets its own transparent copy per altitude. Glow and filament are
     * already transparent, so the departure reuses their buckets and materials as they are. */
    var depMats = [];
    B.levels.forEach(function (L, z) {
      var m = Core.matFromSpec(theme.materials.beamCore, { color: L.color, emissive: L.color, emissiveIntensity: L.coreEmissive });
      m.transparent = true; m.depthWrite = false;
      depMats[z] = Core.markShared(headHook(m, 'emissive'));
    });
    /* result.end -> theme.beam.endStates key, for the three endings that leave the world. */
    var DEPART = { 'lost-edge': 'lostEdge', 'lost-floor': 'lostFloor', 'lost-sky': 'lostSky' };
    var badgeTex = [], ringGeo = new THREE.RingGeometry(0.5 - 0.0625, 0.5, 40), discGeo = new THREE.CircleGeometry(0.5, 8);
    var triGeo = new THREE.CircleGeometry(0.5, 3), bandGeo = new THREE.CircleGeometry(0.5, 48);
    var discQuad = new THREE.CircleGeometry(0.5, 20), streakQuad = new THREE.PlaneGeometry(1, 1);
    Core.markSharedAll([ringGeo, discGeo, triGeo, bandGeo, discQuad, streakQuad]);

    var UP = new THREE.Vector3(0, 1, 0), DEG = Math.PI / 180;
    var _p = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
    var _t = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _fwd = new THREE.Vector3(), _axis = new THREE.Quaternion();

    /* Every decoration here is a FLAT, single-quad billboard. r160 renders a transparent DoubleSide material in
     * TWO passes (back faces, then front faces) unless forceSinglePass is set, which doubles its draw calls and
     * flips material.needsUpdate twice per draw. A flat quad is only ever front- OR back-facing from a given
     * camera, so exactly one of those passes ever draws anything: single-pass is pixel-identical and halves the
     * cost. Measured on the harness: the two instanced meshes went from 4 draw calls to 2.
     * ------------------------------------------------------------------ transient sprite pool (2 draw calls) */
    var SPRITE_MAX = M.budget.transientSpritesMax;
    /* Per-instance colour is carried by OUR OWN aColor attribute rather than three's instanceColor, because in r160
     * instanceColor only reaches the fragment stage when the material sets vertexColors, which in turn wants a
     * per-vertex `color` attribute this geometry does not have. aColor is already in the working (linear) space, so
     * it multiplies straight into the output before the colour-space conversion. */
    function instGeometry(base) {
      var g = base.clone();
      g.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(new Float32Array(SPRITE_MAX), 1));
      g.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(SPRITE_MAX * 3), 3));
      return g;
    }
    function instMaterial() {
      var m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      m.forceSinglePass = true;   /* see singlePass() */
      m.onBeforeCompile = function (s) {
        s.uniforms.uBias = uBias;
        s.vertexShader = 'attribute float aAlpha;\nattribute vec3 aColor;\nvarying float vAlpha;\nvarying vec3 vFxColor;\nuniform float uBias;\n' + s.vertexShader
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n vAlpha = aAlpha;\n vFxColor = aColor;')
          .replace('#include <project_vertex>', '#include <project_vertex>\n gl_Position.z -= uBias * ' + FX_DEPTH_BIAS + ' * gl_Position.w;');
        s.fragmentShader = 'varying float vAlpha;\nvarying vec3 vFxColor;\n' + s.fragmentShader
          .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n gl_FragColor.rgb *= vFxColor;')
          .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.a *= vAlpha;');
      };
      m.customProgramCacheKey = function () { return 'lasers3d-fx-instanced'; };
      return Core.markShared(m);
    }
    var discInst = new THREE.InstancedMesh(instGeometry(discQuad), instMaterial(), SPRITE_MAX);
    var streakInst = new THREE.InstancedMesh(instGeometry(streakQuad), instMaterial(), SPRITE_MAX);
    [discInst, streakInst].forEach(function (mesh, i) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false; mesh.count = 0; mesh.visible = false; mesh.renderOrder = 10 + i;
      mesh.userData.alpha = mesh.geometry.getAttribute('aAlpha');
      mesh.userData.tint = mesh.geometry.getAttribute('aColor');
      mesh.userData.alpha.setUsage(THREE.DynamicDrawUsage);
      mesh.userData.tint.setUsage(THREE.DynamicDrawUsage);
      sprites.add(mesh);
    });

    /* One live record per visible sprite. `rank` is the drop order of MOTION-DIRECTION 10 when the pool is full:
     * 2 = scatter (goes first), 1 = contact decoration, 0 = a fair tell that is never dropped. */
    var live = [];
    function spawnSprite(rec) {
      if (live.length >= SPRITE_MAX) {
        var best = -1, bestRank = 0, bestT = Infinity, i;
        for (i = 0; i < live.length; i++) {
          if (live[i].rank <= 0) continue;
          if (live[i].rank > bestRank || (live[i].rank === bestRank && live[i].t0 < bestT)) { best = i; bestRank = live[i].rank; bestT = live[i].t0; }
        }
        if (best < 0) return;              /* every slot holds a fair tell: drop the newcomer, never the evidence */
        live.splice(best, 1);
      }
      live.push(rec);
    }
    /* Orientation: local +X along the travel direction, local +Z as close to `normal` as that allows, so a disc
     * lies IN the struck face's plane and a streak lies along it. */
    function basisQuat(dir, normal, out) {
      _x.copy(dir);
      if (_x.lengthSq() < 1e-12) _x.set(1, 0, 0);
      _x.normalize();
      _z.copy(normal).addScaledVector(_x, -normal.dot(_x));
      if (_z.lengthSq() < 1e-10) { _z.set(0, 1, 0).addScaledVector(_x, -_x.y); }
      if (_z.lengthSq() < 1e-10) { _z.set(0, 0, 1).addScaledVector(_x, -_x.z); }
      _z.normalize();
      _y.crossVectors(_z, _x).normalize();
      _m4.makeBasis(_x, _y, _z);
      return out.setFromRotationMatrix(_m4);
    }
    function rotateAbout(dir, axis, deg, out) {
      _axis.setFromAxisAngle(axis, deg * DEG);
      return out.copy(dir).applyQuaternion(_axis);
    }
    /* A contact disc lying IN `normal`'s plane. `envelope` true = rise to peak in attackMs then fall to zero over
     * decayMs, both easeOutCubic (m.contact); false = a flat hold, which is both the reduced-motion contact disc
     * (m.reduced.contactHoldMs, then removed in one update) and the persistent FLOOR bounce dot. */
    function makeDisc(pos, normal, diameter, color, peak, rank) {
      _t.copy(normal).cross(UP);
      if (_t.lengthSq() < 1e-8) _t.set(1, 0, 0);
      return { disc: true, t0: 0, attack: 0, decay: 0, ms: 0, peak: peak, rank: rank, travel: 0,
        pos: pos.clone(), dir: new THREE.Vector3(), quat: basisQuat(_t, normal, new THREE.Quaternion()),
        scale: new THREE.Vector3(diameter, diameter, 1), color: new THREE.Color(color), persist: false };
    }
    /* A scatter streak: travels `distance` over `ms`, easeOutCubic, while opacity falls linearly from
     * m.scatter.opacity to zero. It keeps its length, has no gravity, and never resembles a beam branch. */
    function addStreak(pos, dir, normal, ms, distance, size, color, t0) {
      if (cuts.scatter) return;   /* ladder rung 2: streaks are the first decoration to go */
      var r = { disc: false, t0: t0, ms: ms, travel: distance, peak: MSC.opacity, rank: 2,
        pos: pos.clone(), dir: dir.clone().normalize(), quat: basisQuat(dir, normal, new THREE.Quaternion()),
        scale: new THREE.Vector3(size[0], size[1], 1), color: new THREE.Color(color), persist: false };
      spawnSprite(r);
      return r;
    }
    var STREAK_SIZE = [MSC.lengthCells, MSC.widthCells];
    /* The blocked recoil sparks keep their existing 0.08-cell size and 260 ms life; only their DIRECTIONS
     * (m.failure.blockedAnglesDeg), travel distance and easing come from the new ledger. */
    var SPARK_SIZE = [ES.blocked.sparkSize, ES.blocked.sparkSize];
    function fanStreaks(pos, outDir, normal, anglesDeg, ms, distance, color, t0) {
      if (cuts.scatter) return;   /* ladder rung 2: streaks are the first decoration to go */
      var d = new THREE.Vector3(), i;
      for (i = 0; i < anglesDeg.length; i++) addStreak(pos, rotateAbout(outDir, normal, anglesDeg[i], d), normal, ms, distance, STREAK_SIZE, color, t0);
    }
    function updateSprites(nowMs) {
      var nD = 0, nS = 0, i, s, k, a, el, mesh, slot;
      for (i = 0; i < live.length; i++) {
        s = live[i];
        k = s.ms > 0 ? Core.clamp((nowMs - s.t0) / s.ms, 0, 1) : 1;
        if (k >= 1 && !s.persist) { live.splice(i, 1); i--; continue; }
        if (!s.disc) a = s.peak * (1 - k);                                      /* scatter: linear to zero */
        else if (s.attack <= 0 && s.decay <= 0) a = s.peak;                      /* held disc / settled bounce dot */
        else {
          el = nowMs - s.t0;                                                     /* the contact envelope */
          a = el <= s.attack ? s.peak * easeEnter(s.attack > 0 ? el / s.attack : 1)
                             : (s.decay > 0 ? s.peak * (1 - easeEnter((el - s.attack) / s.decay)) : s.peak);
        }
        _p.copy(s.pos).addScaledVector(s.dir, s.travel * easeEnter(k));
        _m4.compose(_p, s.quat, s.scale);
        if (s.disc) { mesh = discInst; slot = nD++; } else { mesh = streakInst; slot = nS++; }
        mesh.setMatrixAt(slot, _m4);
        mesh.userData.tint.setXYZ(slot, s.color.r, s.color.g, s.color.b);
        mesh.userData.alpha.setX(slot, a < 0 ? 0 : a);
      }
      applyInst(discInst, nD); applyInst(streakInst, nS);
    }
    function applyInst(mesh, n) {
      mesh.count = n; mesh.visible = n > 0;
      if (!n) return;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.userData.tint.needsUpdate = true;
      mesh.userData.alpha.needsUpdate = true;
    }

    /* ---- tube building ---- */
    function Bucket() { this.pos = []; this.nor = []; this.dist = []; this.fade = []; this.peak = []; }
    var tmpA = new THREE.Vector3(), tmpN1 = new THREE.Vector3(), tmpN2 = new THREE.Vector3();
    function tube(bk, P, Q, r0, r1, d0, d1, extS, extE, f0, f1, k0, k1) {
      var fS = f0 === undefined ? 1 : f0, fE = f1 === undefined ? 1 : f1;
      var pS = k0 === undefined ? MB.peakAt.level : k0, pE = k1 === undefined ? MB.peakAt.level : k1;
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
        bk.nor.push(n[0], n[1], n[2]); bk.dist.push(atQ ? d1 : d0); bk.fade.push(atQ ? fE : fS); bk.peak.push(atQ ? pE : pS);
      }
      for (i = 0; i < sides; i++) { v(i, false); v(i + 1, false); v(i, true); v(i + 1, false); v(i + 1, true); v(i, true); }
    }
    function bucketMesh(bk, mat) {
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(bk.nor, 3));
      g.setAttribute('aDist', new THREE.Float32BufferAttribute(bk.dist, 1));
      g.setAttribute('aFade', new THREE.Float32BufferAttribute(bk.fade, 1));
      g.setAttribute('aPeak', new THREE.Float32BufferAttribute(bk.peak, 1));
      var m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
    }
    /* m.beam.peakAt, chosen by the TRACED SEGMENT'S OWN PITCH. This is the one thing in the file that varies with
     * altitude, and MOTION-DIRECTION.md's flat-view boundary permits exactly it: "beam animation may encode the
     * traced beam's altitude and pitch after FIRE". No terrain is read. */
    function peakForPitch(v) { return v > 0 ? MB.peakAt.climb : (v < 0 ? MB.peakAt.descend : MB.peakAt.level); }

    /* ---- state ---- */
    var state = null;
    var effects = [], onLit = function () {};
    var reducedOverride = null, chargeMsSetting = 0, motionReg = null, motionHandle = null;

    function releaseBadges() {
      var i, c;
      for (i = 0; i < badges.children.length; i++) { c = badges.children[i]; release(c); }
    }
    function clear() {
      var h = motionHandle; motionHandle = null;      /* nulled FIRST: the lease's cancel() calls back into here */
      if (h) h.cancel();
      while (effects.length) removeFx(effects.length - 1);
      releaseBadges();
      Core.clearGroup(tubes); Core.clearGroup(fx); Core.clearGroup(badges);
      live.length = 0; applyInst(discInst, 0); applyInst(streakInst, 0);
      effects = []; state = null; uHead.value = 0; uPulse.value.set(0, 1, 0); uSeal.value = 0; uSweep.value.set(-1, 0);
    }

    function set(result, opts, motion) {
      clear();
      if (!result || !result.segments || !result.segments.length) return;
      opts = opts || {};
      var reduced = reducedOverride === null
        ? !!(motion && motion.cellsPerSecond === theme.reducedMotion.beamTravelCellsPerSecond)
        : reducedOverride;
      var fired = !!opts.fired && !!opts.animate;
      var cores = [], glows = [], fils = [], deps = [], i, z;
      for (z = 0; z < 4; z++) { cores.push(new Bucket()); glows.push(new Bucket()); fils.push(new Bucket()); deps.push(new Bucket()); }
      var cum = 0, segs = result.segments, P = new THREE.Vector3(), Q = new THREE.Vector3(), lastDir = new THREE.Vector3(1, 0, 0);
      var edge = result.end === 'lost-edge', run = null, runs = [];
      var segDist = [], segPos = [], segDir = [];
      for (i = 0; i < segs.length; i++) {
        var s = segs[i], last = i === segs.length - 1, stub = (s.to.x % 1 !== 0) || (s.to.y % 1 !== 0);
        var toH = stub ? s.from.z + B.heightOffset + 0.5 * s.v : s.to.z + B.heightOffset;
        Core.world(s.from.x, s.from.y, s.from.z + B.heightOffset, P);
        Core.world(s.to.x, s.to.y, 0, Q); Q.y = toH;
        if ((last && edge) || s.terminal === 'lost-edge') Q.lerp(P, 0.5); /* stop at the board edge */
        var z0 = Core.clamp(s.from.z, 0, 3), z1 = Core.clamp(Math.round(stub ? s.from.z : s.to.z), 0, 3), len = P.distanceTo(Q);
        var startDist = result.branched ? s.d0 : cum, arrivalDist = result.branched ? s.d1 : cum + len;
        /* merge collinear level segments into one tube so additive glow never double-covers a joint */
        if (run && run.b.distanceToSquared(P) < 1e-10 && run.z0 === z0 && run.z1 === z1 && run.d === s.d && s.v === 0 && run.v === 0 && !stub) { run.b.copy(Q); run.d1 = arrivalDist; }
        else { run = { a: P.clone(), b: Q.clone(), z0: z0, z1: z1, d: s.d, v: s.v, d0: startDist, d1: arrivalDist }; runs.push(run); }
        cum = Math.max(cum, arrivalDist);
        lastDir.subVectors(Q, P).normalize();
        /* Per-segment arc distance, arrival point and heading: the ONLY index the event stream needs. */
        segDist.push(arrivalDist); segPos.push(Q.clone()); segDir.push(lastDir.clone());
      }
      /* `dep` is the departure spec for an ending that LEAVES the world (theme.beam.endStates.<state>). It only ever
       * affects the last run's radius ramp here; the continuation past endPoint is built right after this loop. */
      var dep = DEPART[result.end] ? ES[DEPART[result.end]] : null;
      var endDist = cum, endPos = Q.clone(), endDir = lastDir.clone(), blendCells = MB.pitchBlendCells;
      runs.forEach(function (r, ri) {
        var L0 = B.levels[r.z0], L1 = B.levels[r.z1], lastRun = ri === runs.length - 1;
        var len = r.a.distanceTo(r.b);
        if (len <= 1e-9) return;
        var peak = peakForPitch(r.v), prevPeak = ri > 0 && !result.branched ? peakForPitch(runs[ri - 1].v) : peak;
        var back = (dep && lastRun) ? Math.min(dep.taperBackCells || 0, len * 0.9) : 0;
        var taperAt = back > 0 ? 1 - back / len : 1;
        var blendAt = (prevPeak !== peak) ? Math.min(blendCells / len, 1) : 0;
        var endScale = (dep && lastRun && dep.startScale !== undefined) ? dep.startScale : 1;
        var cuts = [0], ci;
        if (blendAt > 0 && blendAt < 1) cuts.push(blendAt);
        if (taperAt > 0 && taperAt < 1) cuts.push(taperAt);
        cuts.push(1);
        cuts.sort(function (x, y) { return x - y; });
        function scaleAt(f) { return f <= taperAt ? 1 : 1 + (endScale - 1) * (f - taperAt) / Math.max(1e-6, 1 - taperAt); }
        function peakAt(f) { return (blendAt <= 0 || f >= blendAt) ? peak : prevPeak + (peak - prevPeak) * (f / blendAt); }
        for (ci = 0; ci < cuts.length - 1; ci++) {
          var f0 = cuts[ci], f1 = cuts[ci + 1];
          if (f1 - f0 < 1e-6) continue;
          var A = r.a.clone().lerp(r.b, f0), Bv = r.a.clone().lerp(r.b, f1);
          var dA = r.d0 + (r.d1 - r.d0) * f0, dB = r.d0 + (r.d1 - r.d0) * f1;
          var s0 = scaleAt(f0), s1 = scaleAt(f1), p0 = peakAt(f0), p1 = peakAt(f1);
          var cd0 = (L0.coreDiameter + (L1.coreDiameter - L0.coreDiameter) * f0) / 2 * s0;
          var cd1 = (L0.coreDiameter + (L1.coreDiameter - L0.coreDiameter) * f1) / 2 * s1;
          var gd0 = (L0.glowDiameter + (L1.glowDiameter - L0.glowDiameter) * f0) / 2 * s0;
          var gd1 = (L0.glowDiameter + (L1.glowDiameter - L0.glowDiameter) * f1) / 2 * s1;
          var extS = (ri > 0) && ci === 0, extE = !lastRun && ci === cuts.length - 2;
          if (result.branched) { extS = false; extE = false; }
          tube(cores[r.z0], A, Bv, cd0, cd1, dA, dB, extS, extE, 1, 1, p0, p1);
          tube(glows[r.z0], A, Bv, gd0, gd1, dA, dB, extS, extE, 1, 1, p0, p1);
          if (L0.filament) tube(fils[r.z0], A, Bv, cd0 * B.filament.diameterRatio, cd1 * B.filament.diameterRatio, dA, dB, extS, extE, 1, 1, p0, p1);
        }
      });
      /* ---- the departure: carry the DRAWING past the simulation's endPoint ----
       * A beam that leaves the world used to stop dead at endPoint (owner report). It continues along its own
       * direction - a 45-degree climb keeps climbing at 45 degrees, it is never bent - for theme departCells, with
       * core and glow radius and opacity both easing to zero. The distances continue `cum`, so the travel sweep
       * reveals the departure as part of the same arc, and its pitch envelope is blended in over pitchBlendCells
       * exactly like any other join. Nothing here is compressed to a cap and nothing fades the whole route away. */
      var depDir = null;
      if (dep && runs.length) {
        var lr = runs[runs.length - 1], bz = lr.z0, LZ = B.levels[lr.z1], bL = B.levels[bz];
        var span = Math.max(0, dep.departCells || 0), steps = Math.max(1, dep.departSteps | 0);
        var sc = dep.startScale === undefined ? 1 : dep.startScale, rp = dep.radiusPower || 1, fp = dep.fadePower || 1;
        depDir = new THREE.Vector3().subVectors(lr.b, lr.a);
        if (depDir.lengthSq() < 1e-12) depDir.copy(lastDir);
        depDir.normalize();
        var origin = lr.b.clone();
        if (dep.departMode === 'skim') {
          /* A lost-floor beam reaches the floor plane EXACTLY at endPoint, so there is no descending room left:
           * continuing the ray would only bury the tube. The departure runs along the ground heading instead. */
          depDir.y = 0;
          if (depDir.lengthSq() < 1e-12) depDir.set(1, 0, 0);
          depDir.normalize();
          origin.y = Math.max(origin.y, dep.floorClearance || 0);
        }
        /* A 'skim' departure runs level along the ground, so its pulse rhythm becomes the LEVEL one; a 'ray'
         * departure continues the beam's own pitch. Either way the change is blended in over pitchBlendCells, so
         * the join into the departure carries no intensity seam. */
        var lastPeak = peakForPitch(lr.v), depPeak = dep.departMode === 'skim' ? peakForPitch(0) : lastPeak;
        var depPeakAt = function (t) {
          var d = t * span;
          if (depPeak === lastPeak || blendCells <= 0 || d >= blendCells) return depPeak;
          return lastPeak + (depPeak - lastPeak) * (d / blendCells);
        };
        var ts = [], ti;
        for (i = 1; i <= steps; i++) ts.push(i / steps);
        if (depPeak !== lastPeak && span > 0 && blendCells > 0 && blendCells < span) ts.push(blendCells / span);
        ts.sort(function (x, y) { return x - y; });
        var prev = origin.clone(), pt = new THREE.Vector3(), tPrev = 0, dPrev = cum;
        for (ti = 0; ti < ts.length && span > 0; ti++) {
          var t = ts[ti];
          if (t - tPrev < 1e-6) continue;
          var dNow = cum + span * t;
          pt.copy(origin).addScaledVector(depDir, span * t);
          var a0 = sc * Math.pow(1 - tPrev, rp), a1 = sc * Math.pow(1 - t, rp);
          var o0 = Math.pow(1 - tPrev, fp), o1 = Math.pow(1 - t, fp);
          var q0 = depPeakAt(tPrev), q1 = depPeakAt(t);
          tube(deps[bz], prev, pt, LZ.coreDiameter / 2 * a0, LZ.coreDiameter / 2 * a1, dPrev, dNow, false, false, o0, o1, q0, q1);
          tube(glows[bz], prev, pt, LZ.glowDiameter / 2 * a0, LZ.glowDiameter / 2 * a1, dPrev, dNow, false, false, o0, o1, q0, q1);
          if (bL.filament) tube(fils[bz], prev, pt, LZ.coreDiameter / 2 * a0 * B.filament.diameterRatio, LZ.coreDiameter / 2 * a1 * B.filament.diameterRatio, dPrev, dNow, false, false, o0, o1, q0, q1);
          prev.copy(pt); tPrev = t; dPrev = dNow;
        }
        cum += span;
      }
      for (z = 0; z < 4; z++) {
        if (cores[z].pos.length) { tubes.add(bucketMesh(cores[z], mats.core[z])); var gm = bucketMesh(glows[z], mats.glow[z]); gm.renderOrder = 6; tubes.add(gm); }
        if (fils[z].pos.length) { var fm = bucketMesh(fils[z], mats.filament[z]); fm.renderOrder = 7; tubes.add(fm); }
        if (deps[z].pos.length) { var dpm = bucketMesh(deps[z], depMats[z]); dpm.renderOrder = 8; tubes.add(dpm); }
      }
      /* The travel DURATION is what the player waits through, so it is what is clamped: a 60-cell route on a 24x24
       * board would take 11 s at a fixed 5.5 cells/s and the controls are locked for all of it. Short beams keep a
       * floor so they still read as a beam travelling. Travel is LINEAR: corners and piece hits never pause it. */
      var durMs = opts.animate
        ? Core.clamp(cum / Math.max(0.001, motion.cellsPerSecond) * 1000, motion.minDurationMs, motion.maxDurationMs)
        : motion.liveRetraceMs;
      var speedPerMs = cum / Math.max(0.001, durMs);
      var chargeMs = fired ? (opts.chargeMs !== undefined ? opts.chargeMs : chargeMsSetting) : 0;
      if (reduced && chargeMs > 0) chargeMs = MRED.chargeMs;
      var routeEndMs = chargeMs + durMs;
      /* Section 1's modulation runs only on a real FIRE: a live retrace omits emitter charging, pulse trains,
       * scatter and target rings (section 7), and reduced motion omits moving pulses and leading brightness. */
      var pulseOn = fired && !reduced;

      state = { total: cum, speedPerMs: speedPerMs, clock: 0, chargeMs: chargeMs, durMs: durMs,
        routeEndMs: routeEndMs, animEndMs: routeEndMs + (pulseOn ? MB.settleMs : 0),
        pulseOn: pulseOn, reduced: reduced, fired: fired, decorate: fired,
        end: result.end, endPos: endPos, endDir: endDir, endDist: endDist, depDir: depDir,
        sched: [], cursor: 0, marks: [], skipped: false, runs: runs };
      if (fired) state.animEndMs = Math.max(state.animEndMs, chargeMs + (reduced ? MRED.releaseMs : MF.releaseMs));

      buildSchedule(result, segDist, segPos, segDir, dep);
      if (opts.fired) state.marks.forEach(function (m) { badges.add(makeBadge(m)); });
      if (motionReg) leaseMotion();
    }

    /* ---- the ordered event cursor (MOTION-DIRECTION 2: "one ordered event cursor per trace") ----
     * Driven by the simulation's own step-indexed `result.events`, never by matching cells - which is how an earlier
     * bug lit a target on a fly-over. `overflight`, `underpass` and `glide` produce no contact effect by
     * construction, because they are not in this switch at all. */
    function buildSchedule(result, segDist, segPos, segDir, dep) {
      var evs = result.events || [], i, ev, st, sched = state.sched, marks = state.marks;
      for (i = 0; i < evs.length; i++) {
        ev = evs[i]; st = ev.step;
        if (typeof st !== 'number' || st < 0 || st >= segDist.length) continue;
        if (ev.kind === 'piece') {
          sched.push({ d: segDist[st], kind: 'contact', pos: segPos[st], inDir: segDir[st],
            outDir: result.branched ? new THREE.Vector3(ev.dOut === 'E' ? 1 : ev.dOut === 'W' ? -1 : 0, ev.vOut, ev.dOut === 'N' ? -1 : ev.dOut === 'S' ? 1 : 0).normalize() : segDir[st + 1] || segDir[st], type: ev.type });
        } else if (ev.kind === 'bounce') {
          sched.push({ d: segDist[st], kind: 'dot', pos: segPos[st], z: Core.clamp(Math.round(ev.z), 0, 3) });
        } else if (ev.kind === 'target') {
          sched.push({ d: segDist[st], kind: 'target', index: ev.targetIndex, pos: segPos[st] });
        } else if (ev.kind === 'branch-end') {
          var spec = DEPART[ev.end] ? ES[DEPART[ev.end]] : null;
          sched.push({ d: segDist[st], kind: ev.end === 'blocked' ? 'blocked' : 'marker', spec: spec,
            end: ev.end, endPos: segPos[st], endDir: segDir[st] });
          marks.push({ dist: segDist[st], pos: segPos[st], z: Core.clamp(Math.round(ev.z), 0, 3) });
        } else if (ev.kind === 'pitch') {
          marks.push({ dist: segDist[st], pos: segPos[st], z: Core.clamp(Math.round(ev.z), 0, 3) });
        }
      }
      /* The endpoint badge arrives with its endpoint (section 2). */
      if (result.endPoint) marks.push({ dist: state.endDist, pos: state.endPos, z: Core.clamp(Math.round(result.endPoint.z), 0, 3) });
      /* Terminal behaviour, scheduled by arc distance like everything else. */
      if (state.end === 'blocked') sched.push({ d: state.total, kind: 'blocked' });
      else if (state.end === 'loop') sched.push({ d: state.total, kind: 'loop' });
      else if (dep) {
        sched.push({ d: state.endDist + (dep.markerAlongCells || 0), kind: 'marker', spec: dep });
        if (state.end === 'lost-floor') sched.push({ d: state.endDist, kind: 'floorScatter' });
      }
      sched.sort(function (a, b) { return a.d - b.d; });
      /* Every scheduled item's absolute time, and with it the LAST instant anything on screen changes. */
      var t, i2;
      for (i2 = 0; i2 < sched.length; i2++) {
        sched[i2].t = timeAt(sched[i2].d);
        state.animEndMs = Math.max(state.animEndMs, sched[i2].t + durationOf(sched[i2]));
      }
      for (i2 = 0; i2 < marks.length; i2++) {
        marks[i2].t = timeAt(marks[i2].dist);
        t = marks[i2].t + (state.reduced ? 0 : MF.badgeFadeMs);
        state.animEndMs = Math.max(state.animEndMs, t);
      }
    }
    function timeAt(d) { return state.chargeMs + d / Math.max(1e-6, state.speedPerMs); }
    /* MUST mirror dispatch() exactly: animEndMs is built from these, and an event whose real effect outlives the
     * duration claimed here would be frozen part-way when the clock stops. */
    function durationOf(e) {
      var decor = state.decorate && !state.reduced;                 /* full section-1 decoration */
      if (e.kind === 'contact') return !state.decorate ? 0 : (state.reduced ? MRED.contactHoldMs : Math.max(MC.attackMs + MC.decayMs, MSC.ms));
      if (e.kind === 'dot') return state.reduced ? 0 : MC.attackMs;
      if (e.kind === 'target') return decor ? Math.max(MT.ringDelayMs + ES.target.ringMs, MSC.ms) : 0;
      if (e.kind === 'blocked') return decor ? ES.blocked.sparkFadeMs : 0;
      if (e.kind === 'floorScatter') return decor ? MSC.ms : 0;
      if (e.kind === 'loop') return state.reduced ? 0 : ES.loop.rotateOnceMs;
      if (e.kind === 'marker') return state.reduced ? 0 : MF.lostMarkerFadeMs;
      return 0;
    }

    /* Badge sprite materials carry a per-badge opacity (m.fire.badgeFadeMs), so they are POOLED per altitude rather
     * than shared: a shared material could not fade one badge in without fading every other badge with it. */
    function makeBadge(m) {
      if (!badgeTex[m.z]) badgeTex[m.z] = Core.markShared(Core.badgeTexture(theme, m.z));
      var mat = acquire('badge|' + m.z, function () {
        return new THREE.SpriteMaterial({ map: badgeTex[m.z], transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
      });
      var sp = new THREE.Sprite(mat);
      sp.renderOrder = 20; sp.visible = false; sp.userData.mark = m; return sp;
    }

    /* ---- effect pool ----
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
        m.forceSinglePass = true;
        if (extra) for (var k in extra) m[k] = extra[k];
        return m;
      });
    }
    /* A ring of CONSTANT stroke: m.target.ringStrokeCells stays 0.018 cell while the diameter grows from 0.18 to
     * 0.75, which a fixed-ratio RingGeometry cannot express. One pooled material per live ring, each with its own
     * uInner uniform; the compiled program is shared through customProgramCacheKey. */
    function bandMaterial(color) {
      return acquire('band|' + color, function () {
        var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, toneMapped: false,
          depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        m.forceSinglePass = true;
        m.userData.uInner = { value: 0 };
        m.onBeforeCompile = function (s) {
          s.uniforms.uInner = m.userData.uInner; s.uniforms.uBias = uBias;
          s.vertexShader = 'varying vec2 vLP;\nuniform float uBias;\n' + s.vertexShader
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n vLP = position.xy;')
            .replace('#include <project_vertex>', '#include <project_vertex>\n gl_Position.z -= uBias * ' + FX_DEPTH_BIAS + ' * gl_Position.w;');
          s.fragmentShader = 'uniform float uInner;\nvarying vec2 vLP;\n' + s.fragmentShader
            .replace('void main() {', 'void main() {\n if (length(vLP) < uInner) discard;');
        };
        m.customProgramCacheKey = function () { return 'lasers3d-fx-band'; };
        return m;
      });
    }
    function addFx(obj, t0, delayMs, ms, update, persist) {
      fx.add(obj);
      effects.push({ obj: obj, t0: t0, delay: delayMs || 0, ms: Math.max(1e-6, ms), update: update, persist: persist });
    }
    function removeFx(i) { var e = effects[i]; fx.remove(e.obj); release(e.obj); Core.disposeObject(e.obj); effects.splice(i, 1); }
    function faceAlong(obj, dir) { obj.lookAt(obj.position.clone().add(dir)); }

    /* ---- dispatch: one scheduled event ---- */
    function isFlatView(view) {
      if (!view || !view.camera) return true;
      view.camera.getWorldDirection(_fwd);
      var el = Math.asin(Core.clamp(-_fwd.y, -1, 1)) / DEG;
      return el >= 90 - theme.camera.flatEpsilonDeg;
    }
    function dispatch(e, view, skipped) {
      var t0 = e.t, flat = isFlatView(view), n = new THREE.Vector3(), i;
      var endPos = e.endPos || state.endPos, endDir = e.endDir || state.endDir;
      var endKind = e.end || state.end, depDir = e.end ? null : state.depDir;
      if (e.kind === 'target') {
        onLit(e.index, e.pos);                               /* target state is NEVER dropped, skipped or not */
        if (skipped || !state.decorate || state.reduced) return;
        /* Rings and streaks lie in the common presentation plane in FLAT and in the target's horizontal socket
         * plane in TILT - both horizontal; nothing about them reads the terrain. */
        if (!cuts.rings) for (i = 0; i < ES.target.rings; i++) {
          var ring = new THREE.Mesh(bandGeo, bandMaterial(theme.palette.targetLit));
          ring.position.copy(e.pos); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 9;
          addFx(ring, t0, MT.ringDelayMs * i, ES.target.ringMs, ringUpdate, false);
        }
        fanStreaks(e.pos, _p.set(1, 0, 0), UP, targetAngles(), MSC.ms, MSC.distanceCells, theme.palette.targetLit, t0);
        return;
      }
      if (e.kind === 'contact') {
        if (skipped || !state.decorate) return;              /* an overflight, underpass or glide never gets here */
        /* The struck face's plane: its normal is the reflection normal of the traced beam itself, out - in. For a
         * FLOOR plate (heading unchanged, pitch flipped) that is vertical, so the plate reads horizontal; for an
         * upright piece it is the panel's own normal. Derived from the BEAM, never from the terrain. In FLAT it is
         * replaced by the common, height-independent presentation plane and the common flat-piece colour, so MIRROR,
         * WEDGE and DIP are indistinguishable there. */
        n.copy(e.outDir).sub(e.inDir);
        if (flat || n.lengthSq() < 1e-8) n.copy(UP);
        n.normalize();
        var color = flat ? MC.flatColor : (theme.pieceAccent[e.type] || MC.flatColor);
        var disc = makeDisc(e.pos, n, MC.diameterCells, color, MC.peakOpacity, 1);
        disc.t0 = t0;
        if (state.reduced) { disc.ms = MRED.contactHoldMs; spawnSprite(disc); return; }
        disc.attack = MC.attackMs; disc.decay = MC.decayMs; disc.ms = MC.attackMs + MC.decayMs;
        spawnSprite(disc);
        fanStreaks(e.pos, e.outDir, n, MSC.anglesDeg, MSC.ms, MSC.distanceCells, color, t0);
        return;
      }
      if (e.kind === 'dot') {
        /* DESIGN.md 14.3 / MOTION-DIRECTION 1: the FLOOR bounce tell. Stationary, for the life of the displayed
         * trace, in the ARRIVAL beam colour. It is the prescribed bounce tell and the only mark of its kind - there
         * is no altitude-dependent shadow anywhere else in FLAT. */
        var dotColor = MC.bounceDot.color === 'arrivalBeamColor' ? theme.beamColors[e.z] : MC.bounceDot.color;
        var dot = makeDisc(e.pos, UP, MC.bounceDot.diameterCells, dotColor, MC.bounceDot.opacity, 0);
        dot.t0 = t0; dot.persist = true;
        if (!skipped && !state.reduced) { dot.attack = MC.attackMs; dot.ms = MC.attackMs; }
        spawnSprite(dot);
        return;
      }
      if (e.kind === 'blocked') {
        var cap = new THREE.Mesh(discGeo, basic(ES.blocked.capColor));
        cap.position.copy(endPos); faceAlong(cap, endDir);
        cap.scale.setScalar(ES.blocked.capDiameter); cap.rotation.z += Math.PI / 8;
        addFx(cap, t0, 0, 1, null, true);                    /* the cap stays; the wall does not flash or shake */
        if (skipped || !state.decorate || state.reduced) return;
        /* Three sparks at m.failure.blockedAnglesDeg around the REVERSE incoming heading, in the horizontal
         * presentation plane, travelling m.scatter.distanceCells over the existing sparkFadeMs. */
        var back = _p.copy(endDir).negate(); back.y = 0;
        if (back.lengthSq() < 1e-8) back.set(1, 0, 0);
        back.normalize();
        var d = new THREE.Vector3();
        for (i = 0; i < MFA.blockedAnglesDeg.length; i++) {
          rotateAbout(back, UP, MFA.blockedAnglesDeg[i], d);
          addStreak(endPos, d, UP, ES.blocked.sparkFadeMs, MSC.distanceCells,
            SPARK_SIZE, ES.blocked.capColor, t0);
        }
        return;
      }
      if (e.kind === 'marker') {
        /* The hollow reason marker fades in over m.fire.lostMarkerFadeMs when the head reaches its position. The
         * departure itself is never compressed to a cap and never faded away. */
        var spec = e.spec, at = endPos.clone();
        if (depDir && spec.markerAlongCells) at.addScaledVector(depDir, spec.markerAlongCells);
        var fadeMs = (skipped || state.reduced) ? 0 : MF.lostMarkerFadeMs;
        var mk = new THREE.Mesh(ringGeo, basic(spec.ringColor));
        mk.position.copy(at); mk.scale.setScalar(spec.ringDiameter);
        if (endKind === 'lost-edge') faceAlong(mk, endDir);
        else if (endKind === 'lost-floor') { mk.position.y = 0.006; mk.rotation.x = -Math.PI / 2; }
        else mk.userData.screenFacing = true;
        addFx(mk, t0, 0, Math.max(1e-6, fadeMs), fadeInUpdate, true);
        if (spec.notch) {
          var tri = new THREE.Mesh(triGeo, basic(spec.ringColor)); tri.scale.setScalar(0.07);
          tri.position.copy(mk.position); tri.position.y += spec.notch === 'up' ? spec.ringDiameter * 0.62 : 0.001;
          if (spec.notch === 'up') { tri.rotation.z = Math.PI / 2; tri.userData.screenFacing = true; }
          else { tri.position.z += spec.ringDiameter * 0.62; tri.rotation.x = -Math.PI / 2; tri.rotation.z = -Math.PI / 2; }
          addFx(tri, t0, 0, Math.max(1e-6, fadeMs), fadeInUpdate, true);
        }
        return;
      }
      if (e.kind === 'floorScatter') {
        if (skipped || !state.decorate || state.reduced || !depDir) return;
        fanStreaks(endPos, depDir, UP, MSC.anglesDeg, MSC.ms, MSC.distanceCells, ES.lostFloor.ringColor, e.t);
        return;
      }
      if (e.kind === 'loop') {
        /* A loop is a diagnostic result, never an indefinitely circulating beam: ONE 500 ms linear turn, then still. */
        var spin = (skipped || state.reduced) ? null : loopUpdate;
        for (i = 0; i < 2; i++) {
          var lrr = new THREE.Mesh(ringGeo, basic(ES.loop.ringColor));
          lrr.position.copy(endPos); lrr.scale.setScalar(0.22 + i * 0.1); lrr.userData.screenFacing = true;
          addFx(lrr, e.t, 0, ES.loop.rotateOnceMs, spin, true);
        }
      }
    }
    function targetAngles() {
      if (!targetAngles.cache) {
        var a = [], i, n = ES.target.streaks;
        for (i = 0; i < n; i++) a.push(i * 360 / n);
        targetAngles.cache = a;
      }
      return targetAngles.cache;
    }
    function ringUpdate(o, k) {
      var dia = ES.target.ringFrom + (ES.target.ringTo - ES.target.ringFrom) * easeEnter(k);
      o.scale.set(dia, dia, 1);
      o.material.opacity = MT.ringOpacity * (1 - easeLinear(k));
      o.material.userData.uInner.value = Math.max(0, 0.5 * (1 - 2 * MT.ringStrokeCells / Math.max(1e-6, dia)));
    }
    function fadeInUpdate(o, k) { o.material.opacity = easeLinear(k); }
    function loopUpdate(o, k) { o.userData.spin = easeLinear(k) * Math.PI * 2; }

    /* ---- per frame ---- */
    function frame(dt, view, motion) {
      var i, k, e;
      if (view && view.camera) uBias.value = DEPTH_BIAS_WORLD * 2 / (view.camera.far - view.camera.near);
      if (state) {
        /* THE ONE CLOCK. It advances only while something still changes, and it stops EXACTLY on animEndMs so the
         * final state is applied by value rather than reached by accumulation. */
        if (state.clock < state.animEndMs) {
          state.clock += Math.max(0, dt) * 1000;
          if (state.clock > state.animEndMs) state.clock = state.animEndMs;
        }
        var head = Core.clamp((state.clock - state.chargeMs) * state.speedPerMs, 0, state.total);
        uHead.value = head;
        /* Pulse train and head highlight: full while the head travels, then faded to zero over m.beam.settleMs
         * with easeOutCubic, after which the complete baseline route remains visible and STILL. */
        if (state.pulseOn) {
          var over = state.clock - state.routeEndMs;
          var gain = over <= 0 ? 1 : 1 - easeEnter(over / MB.settleMs);
          uPulse.value.set(state.clock - state.chargeMs, state.speedPerMs, gain < 0 ? 0 : gain);
        } else uPulse.value.set(0, state.speedPerMs, 0);
        while (state.cursor < state.sched.length && state.sched[state.cursor].d <= head + 1e-6) {
          dispatch(state.sched[state.cursor++], view, false);
        }
        /* Altitude badges appear at their traced point's arrival with an 80 ms linear opacity fade. They are
         * stationary at the existing screen offset and never bob. */
        var fade = (state.reduced || state.skipped) ? 0 : MF.badgeFadeMs;
        for (i = 0; i < badges.children.length; i++) {
          var b = badges.children[i], m = b.userData.mark, age = state.clock - m.t;
          b.visible = age >= 0;
          b.material.opacity = age < 0 ? 0 : (fade > 0 ? easeLinear(age / fade) : 1);
          var px = view ? 1 / view.zoom : 1;
          b.scale.set(B.badge.widthPx * px, B.badge.heightPx * px, 1);
          if (view) b.position.copy(m.pos).addScaledVector(view.up, (B.badge.offsetAbovePx + B.badge.heightPx / 2) * px);
        }
        updateSprites(state.clock);
        if (motionHandle && state.clock >= state.animEndMs) { var h = motionHandle; motionHandle = null; motionReg.settle(h); }
      }
      for (i = effects.length - 1; i >= 0; i--) {
        e = effects[i];
        var t = state ? state.clock : e.t0 + e.delay + e.ms;
        k = Core.clamp((t - e.t0 - e.delay) / e.ms, 0, 1);
        e.obj.visible = t >= e.t0 + e.delay;
        if (e.update) e.update(e.obj, k, dt);
        if (e.obj.userData.screenFacing && view) { e.obj.quaternion.copy(view.quaternion); if (e.obj.userData.spin) e.obj.rotateZ(e.obj.userData.spin); }
        if (k >= 1 && !e.persist) removeFx(i);
      }
    }

    function getProgress() {
      return state ? { playing: state.clock < state.routeEndMs, cells: Core.clamp((state.clock - state.chargeMs) * state.speedPerMs, 0, state.total), total: state.total }
        : { playing: false, cells: 0, total: 0 };
    }
    /* Arc-length sampling for the bounded studio lamps. Binary search handles long/looping routes without
     * scanning every segment on each animation frame. The visible departure keeps the last contact position. */
    function sampleAt(distance, out) {
      if (!state || !state.runs.length) return false;
      var a = state.runs, lo = 0, hi = a.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (a[mid].d1 < distance) lo = mid + 1; else hi = mid; }
      var r = a[lo], k = Core.clamp((distance - r.d0) / Math.max(1e-6, r.d1 - r.d0), 0, 1);
      out.copy(r.a).lerp(r.b, k); return true;
    }
    function setVictorySweep(t) {
      var k = t < 0 ? -1 : t / 0.48;
      uSweep.value.set(state ? state.total * k : -1, k >= 0 && k <= 1 ? Math.sin(k * Math.PI) * 2.2 : 0);
    }
    /* A tap or key after the skip grace completes the presentation IMMEDIATELY (section 2): the final route, the
     * endpoint, every target state and every traversed discovery, with no queued scatter or rings replayed. Every
     * remaining event is dispatched in trace order with `skipped` set, transient decoration is dropped, the
     * modulation goes to zero and animEndMs collapses onto the clock - so isAnimating() is false on return. */
    function skip() {
      if (!state || state.clock >= state.routeEndMs) return;
      var i;
      state.clock = state.routeEndMs;
      state.skipped = true;
      while (state.cursor < state.sched.length) dispatch(state.sched[state.cursor++], null, true);
      for (i = live.length - 1; i >= 0; i--) if (!live[i].persist) live.splice(i, 1);
      for (i = 0; i < live.length; i++) { live[i].ms = 0; live[i].attack = 0; live[i].decay = 0; }
      /* Anything already mid-fade (a marker, a ring) is placed at its end: k becomes exactly 1 on the next frame,
       * transient effects are removed there and persistent ones are left at their final value. */
      for (i = 0; i < effects.length; i++) effects[i].t0 = state.clock - effects[i].delay - effects[i].ms;
      uPulse.value.set(0, state.speedPerMs, 0);
      state.pulseOn = false;
      state.animEndMs = state.clock;
      if (motionHandle) { var h = motionHandle; motionHandle = null; motionReg.settle(h); }
    }
    /* Frames are needed exactly while the one clock still has somewhere to go. Every fade, sprite, badge and
     * terminal effect contributed its end time to animEndMs in set(), so this cannot be true a millisecond longer
     * than something is actually moving - and it cannot be false while something still is. */
    function isAnimating() { return !!state && state.clock < state.animEndMs; }

    /* The reveal's beam-glow intake (MOTION-DIRECTION 3): one shared uniform, so it never bakes a multiplier into a
     * material's stored opacity and is exactly 1 at rest. */
    function setGlowMultiplier(k) { uGlowMul.value = (typeof k === 'number' && isFinite(k)) ? k : 1; }
    /* MOTION-DIRECTION.md section 6, W0..W0+m.win.beamSealMs. The host drives this through THE registry with
     * `bell` easing; nothing here owns a clock, so the seal cannot outlive the animation that set it. */
    function setSealGain(k) { uSeal.value = (typeof k === 'number' && isFinite(k) && k > 0) ? k : 0; }
    function setReducedMotion(b) { reducedOverride = (b === null || b === undefined) ? null : !!b; }
    function setChargeMs(ms) { chargeMsSetting = (typeof ms === 'number' && isFinite(ms) && ms > 0) ? ms : 0; }
    /* The emitter charge of section 2, for render-pieces to read: `intensity` drives the filament (easeInCubic in,
     * easeOutCubic back), `halo` drives the halo's scale and opacity (smoothstep in, easeOutCubic back). Both are
     * zero whenever there is no charge, so a settled emitter is exactly its theme state. */
    function getCharge() {
      if (!state || !state.fired || state.chargeMs <= 0) return { active: false, intensity: 0, halo: 0 };
      var relMs = state.reduced ? MRED.releaseMs : MF.releaseMs;
      if (state.clock < state.chargeMs) {
        var u = state.clock / state.chargeMs;
        return { active: true, intensity: easeExit(u), halo: easeSmooth(u) };
      }
      var v = (state.clock - state.chargeMs) / Math.max(1e-6, relMs);
      if (v >= 1) return { active: false, intensity: 0, halo: 0 };
      var back = 1 - easeEnter(v);
      return { active: true, intensity: back, halo: back };
    }
    /* OPTIONAL LaserMotion lease. The beam is advanced by main's ONE scheduler through render.frame(dt) either way -
     * that is what makes needsFrame() -> isAnimating() the beam's liveness - so the registry is not a second clock
     * here. The lease exists so that cancelAll() (RESET, level navigation) and documentHidden() reach the beam:
     * cancel clears it, settle applies its exact final state. The beam releases its own lease the moment its clock
     * reaches animEndMs, so the registry can never hold the loop open longer than the beam does. */
    function attachMotion(reg) { motionReg = reg || null; }
    function leaseMotion() {
      if (motionHandle) { var old = motionHandle; motionHandle = null; old.cancel(); }
      if (!motionReg || !state) return;
      var tok = motionReg.token();
      motionHandle = motionReg.run({
        key: 'beam.trace', role: 'presentation', surface: 'webgl',
        attempt: tok.attempt, trace: tok.trace, durationMs: state.animEndMs,
        update: noop, final: settleNow, fallback: settleNow,
        cancel: function () { if (motionHandle) { motionHandle = null; clear(); } }
      });
    }
    function noop() {}
    function settleNow() { if (state) { skip(); state.clock = state.animEndMs; } }

    function dispose() {
      clear();
      ['core', 'glow', 'filament'].forEach(function (k) { mats[k].forEach(function (m) { m.dispose(); }); });
      depMats.forEach(function (m) { m.dispose(); }); depMats = [];
      Object.keys(pool).forEach(function (k) { pool[k].forEach(function (m) { m.dispose(); }); }); pool = {};
      badgeTex.forEach(function (t) { if (t) t.dispose(); }); badgeTex = [];
      discInst.geometry.dispose(); discInst.material.dispose();
      streakInst.geometry.dispose(); streakInst.material.dispose();
      ringGeo.dispose(); discGeo.dispose(); triGeo.dispose(); bandGeo.dispose();
      discQuad.dispose(); streakQuad.dispose();
    }

    return { group: group, set: set, clear: clear, frame: frame, getProgress: getProgress, skip: skip,
      isAnimating: isAnimating, dispose: dispose,
      onLit: function (fn) { onLit = fn || function () {}; },
      setGlowMultiplier: setGlowMultiplier, setSealGain: setSealGain, setReducedMotion: setReducedMotion,
      sampleAt: sampleAt, setVictorySweep: setVictorySweep,
      setDecorCuts: setDecorCuts,
      setChargeMs: setChargeMs, getCharge: getCharge, attachMotion: attachMotion,
      /* test hooks: the live decoration and the one clock, so a smoke test can prove both stop */
      _debug: function () {
        return { clock: state ? state.clock : 0, animEndMs: state ? state.animEndMs : 0,
          chargeMs: state ? state.chargeMs : 0, routeEndMs: state ? state.routeEndMs : 0,
          gain: uPulse.value.z, seal: uSeal.value, head: uHead.value, total: state ? state.total : 0,
          sprites: live.length, discs: discInst.count, streaks: streakInst.count,
          effects: effects.length, badges: badges.children.length,
          scheduled: state ? state.sched.length : 0, cursor: state ? state.cursor : 0 };
      } };
  }

  root.LaserRenderBeam = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
