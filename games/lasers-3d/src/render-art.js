/* Lasers 3D — optical materials, bounded shot lighting and one-shot victory choreography.
 * No independent timer or RAF. Terrain shading is evaluated before the existing FLAT/fog overrides. */
(function (root) {
  'use strict';
  var THREE = root.THREE, Core = root.LaserRenderCore;

  function bevelBox(w, h, d, bevel) {
    var s = new THREE.Shape(), x = w / 2 - bevel, z = d / 2 - bevel;
    s.moveTo(-x, -z); s.lineTo(x, -z); s.lineTo(x, z); s.lineTo(-x, z); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * bevel, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1 });
    g.rotateX(-Math.PI / 2); g.translate(0, -h / 2 + bevel, 0);
    return g;
  }

  function create(theme, motion) {
    var group = new THREE.Group(); group.name = 'optical-studio';
    var decor = new THREE.Group(); group.add(decor);
    var beam = null, level = null, profile = theme.worldForLevel(0), reduced = false;
    var cuts = {}, victory = null, phase = -1, terrainMats = null;
    var uReveal = { value: 0 }, uTrim = { value: new THREE.Color(profile.trim) };
    var uBoard = { value: new THREE.Vector4() }, uWave = { value: new THREE.Vector3(0, 0, -1) };
    var lamps = [], lastHits = [], scratch = new THREE.Vector3();
    /* Seven unshadowed lamps, independent of board size, route length or effect count. Keeping lights in the
     * scene at intensity zero avoids shader recompilation on every FIRE or camera transition. */
    for (var i = 0; i < 7; i++) {
      var lamp = new THREE.PointLight(i === 4 ? theme.palette.emitter : '#61E9FF', 0, i < 4 ? 2.4 : 2.0, 2);
      lamp.name = 'shot-light-' + i; group.add(lamp); lamps.push(lamp);
    }

    function surface(m, kind) {
      var previous = m.onBeforeCompile, cache = m.customProgramCacheKey.bind(m);
      m.onBeforeCompile = function (s) {
        previous.call(m, s);
        s.uniforms.uArtReveal = uReveal; s.uniforms.uArtTrim = uTrim;
        s.uniforms.uArtBoard = uBoard; s.uniforms.uArtWave = uWave;
        s.vertexShader = 'varying vec3 vArtPosition; varying vec3 vArtNormal;\n' + s.vertexShader
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n vArtPosition = position; vArtNormal = normal;');
        s.fragmentShader = 'varying vec3 vArtPosition; varying vec3 vArtNormal;\n' +
          'uniform float uArtReveal; uniform vec3 uArtTrim; uniform vec4 uArtBoard; uniform vec3 uArtWave;\n' + s.fragmentShader;
        var top = kind === 'top', side = kind === 'side';
        if (top || side) {
          s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_maps>',
            '#include <normal_fragment_maps>\n' +
            'vec2 artCell = fract(vArtPosition.xz + 0.5) - 0.5;\n' +
            'vec2 artEdge = smoothstep(vec2(0.413), vec2(0.48), abs(artCell));\n' +
            (top ? 'vec3 artN = normalize(vec3(sign(artCell.x)*artEdge.x*0.85,1.0,sign(artCell.y)*artEdge.y*0.85));\n'
              : 'vec3 artN = normalize(vArtNormal + vec3(sign(artCell.x)*artEdge.x,0.0,sign(artCell.y)*artEdge.y)*0.52);\n') +
            'normal = normalize(mix(normal, mat3(viewMatrix)*artN, uArtReveal));\n');
          s.fragmentShader = s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' +
            'vec2 artC = abs(fract(vArtPosition.xz + 0.5) - 0.5);\n' +
            (top ? 'float artRim = smoothstep(0.453,0.464,max(artC.x,artC.y));\n'
              : 'float artRim = smoothstep(0.451,0.472,min(artC.x,artC.y));\n') +
            'diffuseColor.rgb = mix(diffuseColor.rgb,uArtTrim,artRim * uArtReveal * 0.72);\n');
          if (side) s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\n' +
            /* A finish gradient on the visible face gives tall enamel blocks depth. It reads no neighbouring
             * geometry, is reveal-gated, and is subsequently discarded by the terrain discovery mask. */
            'float artFinish = mix(1.0,0.42+0.58*smoothstep(0.0,3.5,vArtPosition.y),uArtReveal);\n' +
            'diffuseColor.rgb *= artFinish; totalEmissiveRadiance *= artFinish;\n');
        }
        /* A finite wave crosses known surfaces after the route pulse. The existing reveal/fog shader runs
         * afterwards, so neither this wave nor the bevel/trim can disclose a FLAT height or an unknown cell. */
        s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
          'float artWaveRadius = max(uArtBoard.z,uArtBoard.w)*1.5*max(0.0,(uArtWave.z-0.43)/0.57);\n' +
          'float artWave = 1.0-smoothstep(0.0,0.62,abs(length(vArtPosition.xz-uArtWave.xy)-artWaveRadius));\n' +
          'artWave *= step(0.43,uArtWave.z)*(1.0-smoothstep(0.8,1.0,uArtWave.z))*uArtReveal;\n' +
          'totalEmissiveRadiance += vec3(0.08,0.8,0.66)*artWave*0.72;\n');
      };
      m.customProgramCacheKey = function () { return cache() + '|optical-surface-' + kind; };
      return m;
    }

    function paintTerrain(m) {
      terrainMats = m;
      m.top.color.set(profile.top); m.side.color.set(profile.side); m.side.emissive.set(profile.side);
      m.bevel.color.set(profile.trim);
      m.floor.color.set(profile.floor); m.grid.color.set(profile.grid);
      m.frameEdge.color.set(profile.trim); m.frameMarks.color.set(profile.trim);
      m.sideEdge.color.set(profile.trim);
      uTrim.value.set(profile.trim);
    }

    function setLevel(parsed, index) {
      stopVictory(); level = parsed; lastHits = []; profile = theme.worldForLevel(index);
      uTrim.value.set(profile.trim);
      uBoard.value.set((parsed.size.w - 1) / 2, -(parsed.size.d - 1) / 2, parsed.size.w, parsed.size.d);
      Core.clearGroup(decor);
      /* A soft rectangular grounding shadow under the chassis, based only on public board dimensions. */
      var geo = new THREE.PlaneGeometry(parsed.size.w + 3, parsed.size.d + 3);
      geo.rotateX(-Math.PI / 2); geo.translate(uBoard.value.x, -0.49, uBoard.value.y);
      var mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
        uniforms: { uArtReveal: uReveal },
        vertexShader: 'varying vec2 vUV; void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'varying vec2 vUV; uniform float uArtReveal; void main(){vec2 q=abs(vUV-0.5)*2.0; float a=(1.0-smoothstep(0.66,1.0,max(q.x,q.y)));gl_FragColor=vec4(0.0,0.0,0.0,a*0.52*uArtReveal);}' });
      var shadow = new THREE.Mesh(geo, mat); shadow.name = 'chassis-contact-shadow'; shadow.renderOrder = -3; decor.add(shadow);
      if (terrainMats) paintTerrain(terrainMats);
      lamps.forEach(function (l) { l.intensity = 0; });
      return profile;
    }

    function setVictoryPhase(t) {
      phase = t; uWave.value.z = t;
      if (beam) beam.setVictorySweep(t);
      if (terrainMats && terrainMats.frameEdge.emissive) {
        terrainMats.frameEdge.emissive.set(theme.palette.targetLit);
        terrainMats.frameEdge.emissiveIntensity = t < 0 ? 0 : Math.sin(Math.PI * Core.clamp((t - 0.5) * 2, 0, 1)) * 2.2;
      }
    }
    function stopVictory() {
      if (victory && motion) { var h = victory; victory = null; motion.cancel(h); }
      setVictoryPhase(-1);
    }
    function playVictory() {
      if (!beam || !motion || reduced || cuts.rings) return false;
      stopVictory();
      var end = lastHits.length ? lastHits[lastHits.length - 1].pos : scratch.set(uBoard.value.x, 0, uBoard.value.y);
      uWave.value.set(end.x, end.z, 0);
      victory = motion.run({ key: 'win.opticalWave', role: 'decorative', surface: 'webgl',
        durationMs: theme.art.victoryMs, ease: 'linear',
        update: function (t) { setVictoryPhase(t); },
        final: function () { setVictoryPhase(-1); },
        cancel: function () { setVictoryPhase(-1); },
        fallback: function () { setVictoryPhase(-1); },
        onDone: function () { victory = null; } });
      return true;
    }
    function beginShot() { stopVictory(); lastHits = []; }
    function targetHit(index, pos) {
      if (!pos || lastHits.some(function (h) { return h.index === index; })) return;
      lastHits.push({ index: index, pos: pos.clone() });
    }
    function frame() {
      if (!beam || !level) return;
      var p = beam.getProgress(), charge = beam.getCharge(), r = uReveal.value * uReveal.value;
      var gain = cuts.scatter ? 0.5 : 1, on = p.total > 0;
      var sample = [p.cells, p.total * 0.2, p.total * 0.5, p.total * 0.8];
      for (var i = 0; i < 4; i++) {
        var lit = on && (i === 0 ? p.playing && !reduced : sample[i] <= p.cells);
        if (lit && beam.sampleAt(sample[i], lamps[i].position)) lamps[i].intensity = r * gain * (i === 0 ? 11 : 3.0);
        else lamps[i].intensity = 0;
      }
      var e = level.emitter;
      lamps[4].position.set(e.x, level.t[e.y][e.x] + 0.6, -e.y);
      lamps[4].intensity = r * (0.7 + charge.intensity * 8);
      for (i = 0; i < 2; i++) {
        var hit = lastHits[i];
        if (hit) { lamps[i + 5].position.copy(hit.pos); lamps[i + 5].intensity = r * (3.8 + (phase >= 0 ? Math.sin(phase * Math.PI) * 3 : 0)); }
        else lamps[i + 5].intensity = 0;
      }
    }
    return { group: group, surface: surface, setLevel: setLevel, paintTerrain: paintTerrain,
      connectBeam: function (b) { beam = b; }, profile: function () { return profile; },
      setReveal: function (r) { uReveal.value = r; }, frame: frame, beginShot: beginShot, targetHit: targetHit,
      playVictory: playVictory, setReducedMotion: function (b) { reduced = !!b; if (b) stopVictory(); },
      setDecorCuts: function (c) { cuts = c || {}; if (cuts.rings) stopVictory(); },
      state: function () { return { world: profile.id, reveal: uReveal.value, victory: phase,
        lamps: lamps.map(function (l) { return l.intensity; }), lampCount: lamps.length }; },
      dispose: function () { stopVictory(); Core.clearGroup(decor); group.clear(); } };
  }
  root.LaserRenderArt = { create: create, bevelBox: bevelBox };
}(typeof self !== 'undefined' ? self : this));
