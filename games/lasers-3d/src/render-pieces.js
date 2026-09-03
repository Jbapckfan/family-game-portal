/* Lasers 3D - pieces, emitter, targets, selection/ghost/hover/cursor overlays.
 * Global: window.LaserRenderPieces. Classic script, ES2019. Needs THREE + LaserRenderCore + LaserTheme.
 * Piece group origin = (x, t, -y): the cell's top. Local +X = east, local -Z = north, local +Y = up.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;
  var Core = root.LaserRenderCore;
  var DIR_ROT = { E: 0, N: Math.PI / 2, W: Math.PI, S: -Math.PI / 2 };

  function orientAngle(o) { return o === '/' ? Math.PI / 4 : -Math.PI / 4; }

  function create(theme) {
    var P = theme.piece, M = theme.materials;
    var group = new THREE.Group(); group.name = 'pieces';
    var overlay = new THREE.Group(); overlay.name = 'overlay';
    group.add(overlay);
    var heightAt = function () { return 0; };
    var level = null, placedGroup = new THREE.Group(), fixedGroup = new THREE.Group(), actorGroup = new THREE.Group();
    group.add(placedGroup); group.add(fixedGroup); group.add(actorGroup);

    /* ---- shared geometries ---- */
    var geo = {};
    (function () {
      var h = P.housing, c = h.chamfer, s = h.w / 2 - c;
      var shape = new THREE.Shape();
      shape.moveTo(-s, -s); shape.lineTo(s, -s); shape.lineTo(s, s); shape.lineTo(-s, s); shape.closePath();
      var hg = new THREE.ExtrudeGeometry(shape, { depth: h.h - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1 });
      hg.rotateX(-Math.PI / 2); hg.translate(0, c, 0);
      geo.housing = hg;
      var gg = new THREE.PlaneGeometry(P.flatGlyph.length, P.flatGlyph.width);
      gg.rotateX(-Math.PI / 2); gg.translate(0, h.h + 0.003, 0);
      geo.glyph = gg;
      geo.faces = { MIRROR: faceGeo(0, 'MIRROR'), WEDGE: faceGeo(-Math.PI / 4, 'WEDGE'), DIP: faceGeo(Math.PI / 4, 'DIP') };
      geo.emBase = Core.boxAt(0, 0.14, 0, 0.6, 0.28, 0.6);
      var barrel = new THREE.CylinderGeometry(0.2, 0.22, 0.62, 24); barrel.rotateZ(-Math.PI / 2); barrel.translate(0, 0.5, 0);
      geo.emBarrel = barrel;
      var fil = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16); fil.rotateZ(-Math.PI / 2); fil.translate(0.33, 0.5, 0);
      geo.emFilament = fil;
      var sock = new THREE.CylinderGeometry(0.24, 0.28, 0.08, 24); sock.translate(0, 0.04, 0);
      geo.socket = sock;
      geo.orb = new THREE.SphereGeometry(0.24, 32, 20); geo.orb.translate(0, 0.5, 0);
      geo.core = new THREE.SphereGeometry(0.1, 16, 12); geo.core.translate(0, 0.5, 0);
      /* FLAT target proxy: a reticle in the XY plane (so copying the camera quaternion makes it screen-facing). */
      geo.proxyRing = new THREE.RingGeometry(0.19, 0.25, 32);
      geo.proxyDot = new THREE.CircleGeometry(0.085, 20);
      geo.ring = new THREE.RingGeometry(0.42, 0.47, 40); geo.ring.rotateX(-Math.PI / 2);
      geo.pulse = new THREE.RingGeometry(0.46, 0.5, 40); geo.pulse.rotateX(-Math.PI / 2);
      geo.hover = new THREE.PlaneGeometry(theme.terrain.cellTop, theme.terrain.cellTop); geo.hover.rotateX(-Math.PI / 2);
      var q = 0.45, cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute([-q, 0, -q, q, 0, -q, q, 0, q, -q, 0, q, -q, 0, -q], 3));
      geo.cursor = cg;
      /* every geometry above is reused by many meshes: never disposed with a mesh (see Core.disposeObject) */
      for (var k in geo) if (Object.prototype.hasOwnProperty.call(geo, k)) {
        if (geo[k].isBufferGeometry) Core.markShared(geo[k]);
        else for (var f in geo[k]) if (geo[k][f].face) { Core.markShared(geo[k][f].face); Core.markShared(geo[k][f].filament); }
      }
    }());

    /* Face plane (+ merged 0.025 filament boxes) tilted about the diagonal (local X) by `tilt`, centred at mid height. */
    function faceGeo(tilt, type) {
      var size = P.mirrorPanel.size, zFrom = P.mirrorPanel.zFrom, zTo = P.mirrorPanel.zTo, f = P.edgeFilament;
      var span = zTo - zFrom, h = tilt === 0 ? span : span * Math.SQRT2, mid = (zFrom + zTo) / 2;
      var face = new THREE.PlaneGeometry(size, h);
      var fil = Core.mergeGeometries([
        Core.boxAt(0, h / 2, 0, size + f, f, f), Core.boxAt(0, -h / 2, 0, size + f, f, f),
        Core.boxAt(size / 2, 0, 0, f, h, f), Core.boxAt(-size / 2, 0, 0, f, h, f)]);
      face.rotateX(tilt); fil.rotateX(tilt);
      face.translate(0, mid, 0); fil.translate(0, mid, 0);
      return { face: face, filament: fil, type: type };
    }

    /* ---- shared materials (reveal-driven) ---- */
    var mats = {
      housing: Core.matFromSpec(M.pieceHousing), glyph: Core.matFromSpec(M.flatPieceGlyph),
      emitterBody: Core.matFromSpec(M.emitterBody), emitterFilament: Core.matFromSpec(M.emitterFilament),
      emitterHalo: new THREE.SpriteMaterial({ map: Core.glowTexture(theme.palette.emitter, 0), color: new THREE.Color(theme.palette.emitter),
        transparent: true, opacity: M.emitterHalo.opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      socket: Core.matFromSpec(M.targetSocket),
      selection: new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.palette.uiAccent), transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false }),
      hover: new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.palette.uiAccent), transparent: true, opacity: 0.14, toneMapped: false, depthWrite: false }),
      cursor: new THREE.LineDashedMaterial({ color: new THREE.Color(theme.palette.uiAccent), dashSize: 0.08, gapSize: 0.05, toneMapped: false }),
      face: { MIRROR: Core.matFromSpec(M.mirrorFace), WEDGE: Core.matFromSpec(M.wedgeFace), DIP: Core.matFromSpec(M.dipFace) },
      filament: {}
    };
    mats.housing.map = Core.grainTexture(theme);
    ['MIRROR', 'WEDGE', 'DIP'].forEach(function (t) {
      mats.filament[t] = Core.matFromSpec(M.edgeFilament, { color: theme.pieceAccent[t], emissive: theme.pieceAccent[t] });
    });
    Core.markSharedAll([mats.housing, mats.glyph, mats.emitterBody, mats.emitterFilament, mats.emitterHalo, mats.emitterHalo.map, mats.socket,
      mats.selection, mats.hover, mats.cursor, mats.face.MIRROR, mats.face.WEDGE, mats.face.DIP, mats.filament.MIRROR, mats.filament.WEDGE, mats.filament.DIP]);
    /* materials whose opacity is `reveal * base` */
    var physical = [mats.housing, mats.emitterBody, mats.socket, mats.face.MIRROR, mats.face.WEDGE, mats.face.DIP,
      mats.filament.MIRROR, mats.filament.WEDGE, mats.filament.DIP];
    physical.forEach(function (m) { m.userData.baseOpacity = m.opacity; m.userData.baseTransparent = m.transparent; });
    var reveal = 0;

    /* ---- model builders ---- */
    function faceMesh(type, faceMat, filMat) {
      var g = new THREE.Group();
      var f = new THREE.Mesh(geo.faces[type].face, faceMat); f.castShadow = true;
      var l = new THREE.Mesh(geo.faces[type].filament, filMat);
      g.add(f); g.add(l);
      return g;
    }

    /* A piece group. Secret pieces keep both models and swap on reveal >= 0.5. */
    function pieceModel(type, orient, secret, ghostMats) {
      var g = new THREE.Group(), gm = ghostMats;
      g.rotation.y = orientAngle(orient);
      var housing = new THREE.Mesh(geo.housing, gm ? gm.body : mats.housing); housing.castShadow = !gm; g.add(housing);
      var glyph = new THREE.Mesh(geo.glyph, gm ? gm.body : mats.glyph); glyph.renderOrder = 2; g.add(glyph);
      var real = faceMesh(type, gm ? gm.face : mats.face[type], gm ? gm.face : mats.filament[type]); g.add(real);
      g.userData = { type: type, orient: orient, secret: !!secret, real: real, glyph: glyph, housing: housing };
      if (secret && type !== 'MIRROR') {
        var decoy = faceMesh('MIRROR', mats.face.MIRROR, mats.filament.MIRROR);
        g.add(decoy); g.userData.decoy = decoy;
      }
      updateSecret(g);
      return g;
    }
    function updateSecret(g) {
      if (!g.userData.decoy) return;
      var showReal = reveal >= 0.5;
      g.userData.real.visible = showReal; g.userData.decoy.visible = !showReal;
    }
    function placeAt(obj, x, y) { obj.position.set(x, heightAt(x, y), -y); return obj; }

    /* ---- level actors ---- */
    var targets = [];
    function setLevel(parsed, hAt) {
      level = parsed; heightAt = hAt;
      Core.clearGroup(placedGroup); Core.clearGroup(fixedGroup); Core.clearGroup(actorGroup);
      targets = [];
      clearOverlay();
      var em = new THREE.Group();
      em.rotation.y = DIR_ROT[parsed.emitter.dir] || 0;
      var b1 = new THREE.Mesh(geo.emBase, mats.emitterBody); b1.castShadow = true; em.add(b1);
      var b2 = new THREE.Mesh(geo.emBarrel, mats.emitterBody); b2.castShadow = true; em.add(b2);
      em.add(new THREE.Mesh(geo.emFilament, mats.emitterFilament));
      var halo = new THREE.Sprite(mats.emitterHalo); halo.position.set(0.36, 0.5, 0); halo.scale.set(0.7, 0.7, 1); em.add(halo);
      actorGroup.add(placeAt(em, parsed.emitter.x, parsed.emitter.y));
      parsed.targets.forEach(function (tg, i) {
        var g = new THREE.Group();
        var sock = new THREE.Mesh(geo.socket, mats.socket); sock.castShadow = true; g.add(sock);
        var orbMat = Core.matFromSpec(M.targetUnlit);
        var orb = new THREE.Mesh(geo.orb, orbMat); orb.renderOrder = 3; g.add(orb);
        var coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.palette.targetLit), transparent: true, opacity: 0, toneMapped: false });
        g.add(new THREE.Mesh(geo.core, coreMat));
        var haloMat = new THREE.SpriteMaterial({ map: Core.glowTexture(theme.palette.targetLit, 0), color: new THREE.Color(theme.palette.targetLit),
          transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
        var hs = new THREE.Sprite(haloMat); hs.position.set(0, 0.5, 0);
        var hd = theme.beam.endStates.target.haloDiameter * 2; hs.scale.set(hd, hd, 1); g.add(hs);
        /* FLAT proxy (VISUAL-DIRECTION A4): the glass orb is unlit in FLAT and reads as a hole in the floor. This
         * reticle stands in for it and cross-fades with the physical orb as the board tilts. It sits at the cell's
         * OWN top, so under the top-down orthographic camera it projects to the cell centre whatever the terrain
         * height: the flat view still gives nothing away. */
        var proxyMat = Core.matFromSpec(M.targetFlatProxy);
        var proxy = new THREE.Group(); proxy.position.set(0, 0.80, 0); proxy.renderOrder = 6;
        var pr = new THREE.Mesh(geo.proxyRing, proxyMat); pr.renderOrder = 6; proxy.add(pr);
        var pd = new THREE.Mesh(geo.proxyDot, proxyMat); pd.renderOrder = 6; proxy.add(pd);
        g.add(proxy);
        actorGroup.add(placeAt(g, tg.x, tg.y));
        orbMat.envMapIntensity = reveal;
        var rec = { index: i, orb: orbMat, core: coreMat, halo: haloMat, proxy: proxy, proxyMat: proxyMat, lit: 0, goal: 0 };
        targets.push(rec);
        refreshTarget(rec);
      });
      parsed.fixed.forEach(function (f) { fixedGroup.add(placeAt(pieceModel(f.type, f.orient, f.secret), f.x, f.y)); });
    }

    function setPlaced(placed) {
      Core.clearGroup(placedGroup);
      (placed || []).forEach(function (p) { placedGroup.add(placeAt(pieceModel(p.type, p.orient, false), p.x, p.y)); });
    }

    function setTargetLit(index, lit) { if (targets[index]) targets[index].goal = lit ? 1 : 0; }
    function resetTargets() { targets.forEach(function (t) { t.goal = 0; }); }

    var TC = { colorUnlit: new THREE.Color(M.targetUnlit.color), colorLit: new THREE.Color(M.targetLit.color),
      emissiveUnlit: new THREE.Color(M.targetUnlit.emissive), emissiveLit: new THREE.Color(M.targetLit.emissive) };
    function lerpTarget(t, k) {
      var a = M.targetUnlit, b = M.targetLit, m = t.orb;
      m.color.copy(TC.colorUnlit).lerp(TC.colorLit, k);
      m.emissive.copy(TC.emissiveUnlit).lerp(TC.emissiveLit, k);
      m.emissiveIntensity = a.emissiveIntensity + (b.emissiveIntensity - a.emissiveIntensity) * k;
      m.userData.baseOpacity = a.opacity + (b.opacity - a.opacity) * k;
      m.transmission = a.transmission + (b.transmission - a.transmission) * k;
      m.roughness = a.roughness + (b.roughness - a.roughness) * k;
      m.metalness = a.metalness + (b.metalness - a.metalness) * k;
      t.core.opacity = k; t.halo.opacity = k * theme.beam.endStates.target.haloOpacity;
      refreshTarget(t);
    }
    /* Physical orb vs FLAT proxy, on complementary curves. `show` is max(reveal, lit): a LIT target must glow in the
     * flat view too (it is the game's only "you did it" tell before the modal), so lighting it brings the physical
     * orb in even at reveal 0, and retires the proxy at the same rate. */
    function refreshTarget(t) {
      var a = M.targetUnlit, b = M.targetLit;
      var base = t.orb.userData.baseOpacity === undefined ? a.opacity + (b.opacity - a.opacity) * t.lit : t.orb.userData.baseOpacity;
      var show = Math.max(reveal, t.lit);
      t.orb.opacity = base * show;
      t.orb.transparent = true;
      t.orb.visible = show > 0.001;
      var hide = (1 - reveal) * (1 - t.lit);
      t.proxyMat.opacity = hide;
      t.proxy.visible = hide > 0.001;
    }

    /* ---- reveal ---- */
    function applyReveal(r) {
      reveal = r;
      physical.forEach(function (m) {
        m.opacity = m.userData.baseOpacity * r;
        m.transparent = m.userData.baseTransparent || r < 1;
        m.visible = r > 0;
      });
      mats.glyph.opacity = 1 - r; mats.glyph.visible = r < 1;
      targets.forEach(function (t) { t.orb.envMapIntensity = r; refreshTarget(t); });
      placedGroup.children.forEach(updateSecret); fixedGroup.children.forEach(updateSecret);
      if (ghost) { ghost.userData.faceMat.opacity = 0.45 * r; ghost.userData.faceMat.visible = r > 0; }
    }

    /* ---- overlays: selection, ghost, hover, cursor, pulse ---- */
    var selection = null, ghost = null, hover = null, cursor = null, pulses = [];
    function clearOverlay() { Core.clearGroup(overlay); selection = ghost = hover = cursor = null; pulses = []; }
    function swap(old, mesh) { if (old) { overlay.remove(old); Core.disposeObject(old); } if (mesh) overlay.add(mesh); return mesh; }

    function setSelection(cell) {
      selection = swap(selection, cell ? placeAt(new THREE.Mesh(geo.ring, mats.selection), cell.x, cell.y) : null);
      if (selection) { selection.position.y += P.housing.h + 0.006; selection.renderOrder = 4; }
    }
    function setHover(cell) {
      hover = swap(hover, cell ? placeAt(new THREE.Mesh(geo.hover, mats.hover), cell.x, cell.y) : null);
      if (hover) { hover.position.y += 0.003; hover.renderOrder = 2; }
    }
    function setCursor(cell) {
      var line = null;
      if (cell) { line = new THREE.Line(geo.cursor, mats.cursor); line.computeLineDistances(); placeAt(line, cell.x, cell.y); line.position.y += 0.008; line.renderOrder = 4; }
      cursor = swap(cursor, line);
    }
    function setGhost(g) {
      if (ghost) { swap(ghost, null); ghost = null; }
      if (!g) return;
      var col = g.invalid ? theme.palette.danger : (theme.pieceAccent[g.type] || theme.palette.uiAccent);
      var gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false });
      var fm = gm.clone(); fm.opacity = 0.45 * reveal; fm.visible = reveal > 0; fm.side = THREE.DoubleSide;
      var model = pieceModel(g.type, g.orient, false, { body: gm, face: fm });
      model.userData.faceMat = fm;
      model.renderOrder = 5;
      ghost = swap(null, placeAt(model, g.x, g.y));
    }
    function pulseCell(cell, opts) {
      var col = (opts && opts.color) || theme.camera.revealChoreography.pulseColor;
      var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 1, toneMapped: false, depthWrite: false });
      var mesh = placeAt(new THREE.Mesh(geo.pulse, m), cell.x, cell.y);
      mesh.position.y += 0.01; mesh.renderOrder = 4;
      overlay.add(mesh);
      pulses.push({ mesh: mesh, t: 0, ms: theme.camera.revealChoreography.pulseOutlineMs });
    }

    function frame(dt, speed, view) {
      var litMs = theme.beam.endStates.target.litFadeMs / 1000 / speed, i;
      for (i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (view && t.proxy.visible) t.proxy.quaternion.copy(view.quaternion);   /* screen-facing reticle */
        if (t.lit === t.goal) continue;
        t.lit = t.goal > t.lit ? Math.min(t.goal, t.lit + dt / litMs) : Math.max(t.goal, t.lit - dt / litMs);
        lerpTarget(t, t.lit);
      }
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i]; p.t += dt * 1000 * speed;
        var k = Math.min(1, p.t / p.ms);
        p.mesh.material.opacity = 1 - k; var s = 1 + 0.35 * k; p.mesh.scale.set(s, 1, s);
        if (k >= 1) { overlay.remove(p.mesh); Core.disposeObject(p.mesh); pulses.splice(i, 1); }
      }
    }

    /* Standalone model for tray icons (real type, always physical). Caller adds it to its own scene. */
    function trayModel(type) {
      var g = new THREE.Group();
      function solid(m, opacity) { var c = m.clone(); c.userData.shared = false; c.visible = true; c.opacity = opacity; c.transparent = opacity < 1; if (c.envMapIntensity !== undefined) c.envMapIntensity = 1; return c; }
      g.add(new THREE.Mesh(geo.housing, solid(mats.housing, 1)));
      g.add(faceMesh(type, solid(mats.face[type], mats.face[type].userData.baseOpacity), solid(mats.filament[type], 1)));
      g.rotation.y = orientAngle('/');
      return g;
    }

    function dispose() {
      Core.clearGroup(group);
      for (var k in geo) if (Object.prototype.hasOwnProperty.call(geo, k)) {
        if (geo[k].dispose) geo[k].dispose();
        else for (var f in geo[k]) if (geo[k][f].face) { geo[k][f].face.dispose(); geo[k][f].filament.dispose(); }
      }
      physical.concat([mats.glyph, mats.emitterFilament, mats.emitterHalo, mats.selection, mats.hover, mats.cursor]).forEach(function (m) { m.dispose(); });
      if (mats.emitterHalo.map) mats.emitterHalo.map.dispose();
    }

    /* Frames are still needed while a target is fading between lit states or a reveal pulse is easing. */
    function isAnimating() {
      var i;
      if (pulses.length) return true;
      for (i = 0; i < targets.length; i++) if (targets[i].lit !== targets[i].goal) return true;
      return false;
    }

    return { group: group, setLevel: setLevel, setPlaced: setPlaced, applyReveal: applyReveal, setTargetLit: setTargetLit,
      resetTargets: resetTargets, setSelection: setSelection, setGhost: setGhost, setHover: setHover, setCursor: setCursor,
      pulseCell: pulseCell, frame: frame, isAnimating: isAnimating, trayModel: trayModel, dispose: dispose, materials: mats };
  }

  root.LaserRenderPieces = { __version: 1, create: create, orientAngle: orientAngle };
}(typeof self !== 'undefined' ? self : this));
