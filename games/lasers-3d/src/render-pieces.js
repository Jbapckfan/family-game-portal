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

  /* ---- the piece set is the REGISTRY's, not this file's (DESIGN.md 14) ------------------------------------------
   * There used to be three literal ['MIRROR', 'WEDGE', 'DIP'] lists in here and every one of them was a place a
   * fourth piece could be forgotten. The set now comes from LaserPieces.TYPES and each type's SHAPE is derived from
   * what the rules say it does, so a new registry entry renders without anyone editing this file:
   *
   *   does it turn the beam?   A piece that turns the horizontal heading is a mirror whose normal is HORIZONTAL,
   *                            i.e. an upright panel standing on the cell's diagonal. A piece that leaves the
   *                            heading alone can only be turning the beam vertically, i.e. a horizontal mirror -
   *                            a plate lying in the cell's top surface (14.1).
   *   what does it do to a     For an upright panel that is the SLOPE of its face: +1 rises to the right (WEDGE),
   *   level beam's pitch?      -1 falls to the right (DIP), 0 stands straight up (MIRROR). The face is tilted about
   *                            its own hinge by -slope * 45 degrees, which is the geometry the slope names.
   *
   * Anything a future piece needs beyond that (a colour, a material) is looked up by type with a fallback, so the
   * worst a missing token can do is make the piece look like a mirror - never make it fail to draw. */
  var Pieces = root.LaserPieces;
  function types() { return (Pieces && Pieces.TYPES && Pieces.TYPES.length) ? Pieces.TYPES : ['MIRROR', 'WEDGE', 'DIP']; }
  function describe(type) {
    var turns = (Pieces && typeof Pieces.turnsBeam === 'function') ? Pieces.turnsBeam(type) : true;
    var slope = (Pieces && typeof Pieces.applyPitch === 'function') ? Pieces.applyPitch(type, 0) : 0;
    return { type: type, flat: !turns, slope: slope, tilt: -slope * Math.PI / 4 };
  }

  /* The animation registry is created by main.js (there is exactly one). render.js builds this module, so the
   * registry cannot be handed in through create()'s existing call; attachMotion() is the one-line hook the host
   * uses instead - `LaserRenderPieces.attachMotion(motion)` right after LaserMotion.create(). Instances built
   * before the call pick it up too. WITHOUT a registry every section-5 animation below is skipped and the settled
   * state is applied at once: no frozen board, no loop with nothing to end it, exactly today's behaviour. */
  var sharedMotion = null, instances = [];

  function create(theme, fog, opts) {
    var P = theme.piece, M = theme.materials;
    var motion = (opts && opts.motion) || sharedMotion || null;
    var group = new THREE.Group(); group.name = 'pieces';
    var overlay = new THREE.Group(); overlay.name = 'overlay';
    group.add(overlay);
    var heightAt = function () { return 0; };
    var level = null, placedGroup = new THREE.Group(), fixedGroup = new THREE.Group(), actorGroup = new THREE.Group();
    group.add(placedGroup); group.add(fixedGroup); group.add(actorGroup);

    /* ---- shared geometries ---- */
    var TYPES = types(), SHAPE = {};
    TYPES.forEach(function (t) { SHAPE[t] = describe(t); });
    var geo = {};
    (function () {
      var h = P.housing, c = h.chamfer, s = h.w / 2 - c;
      var shape = new THREE.Shape();
      shape.moveTo(-s, -s); shape.lineTo(s, -s); shape.lineTo(s, s); shape.lineTo(-s, s); shape.closePath();
      var hg = new THREE.ExtrudeGeometry(shape, { depth: h.h - 2 * c, bevelEnabled: true, bevelThickness: c, bevelSize: c, bevelSegments: 1 });
      hg.rotateX(-Math.PI / 2); hg.translate(0, c, 0);
      var hardware = [hg];
      [-0.26, 0.26].forEach(function (x) { [-0.26, 0.26].forEach(function (z) {
        var screw = new THREE.CylinderGeometry(0.028, 0.028, 0.018, 10);
        screw.translate(x, h.h + 0.007, z); hardware.push(screw);
      }); });
      var hinge = new THREE.CylinderGeometry(0.035, 0.035, 0.58, 12);
      hinge.rotateZ(Math.PI / 2); hinge.translate(0, h.h + 0.01, 0); hardware.push(hinge);
      geo.housing = Core.mergeGeometries(hardware);
      var gg = new THREE.PlaneGeometry(P.flatGlyph.length, P.flatGlyph.width);
      gg.rotateX(-Math.PI / 2); gg.translate(0, h.h + 0.003, 0);
      geo.glyph = gg;                                   /* the diagonal strip every UPRIGHT piece shows in FLAT */
      /* DESIGN.md 14.3: a plate lying in the floor "reads differently from the three upright pieces by silhouette
       * alone; it does not need a disguise". So its FLAT mark is a disc, not the shared diagonal strip - the one
       * place the flat view is allowed to tell two piece types apart, because the rules already do. */
      var pg = new THREE.CircleGeometry(P.floorPlate.glyphRadius, 28);
      pg.rotateX(-Math.PI / 2); pg.translate(0, h.h + 0.003, 0);
      geo.plateGlyph = pg;
      geo.faces = {};
      TYPES.forEach(function (t) { geo.faces[t] = SHAPE[t].flat ? plateGeo(t) : faceGeo(SHAPE[t].tilt, t); });
      /* Instrument hardware stays inside one cell. Every optical centre remains at y=0.5,
       * so the visible aperture/crystal and the authoritative beam agree at any height. */
      function bevel(w, h, d, c, x, y, z) {
        var b = root.LaserRenderArt.bevelBox(w, h, d, c); b.translate(x, y, z); return b;
      }
      function barrel(radius, length, x, segments) {
        var b = new THREE.CylinderGeometry(radius, radius, length, segments || 32);
        b.rotateZ(-Math.PI / 2); b.translate(x, 0.5, 0); return b;
      }
      function ring(radius, tube, x) {
        var r = new THREE.TorusGeometry(radius, tube, 8, 32);
        r.rotateY(Math.PI / 2); r.translate(x, 0.5, 0); return r;
      }
      function floorRing(radius, tube, y, arc) {
        var r = new THREE.TorusGeometry(radius, tube, 8, 40, arc);
        r.rotateX(-Math.PI / 2); r.translate(0, y, 0); return r;
      }
      geo.emChassis = Core.mergeGeometries([
        bevel(0.69, 0.16, 0.62, 0.04, -0.02, 0.17, 0),
        bevel(0.27, 0.18, 0.36, 0.03, -0.09, 0.30, 0), barrel(0.25, 0.60, 0),
        barrel(0.21, 0.035, 0.335)
      ]);
      var bands = [bevel(0.78, 0.08, 0.72, 0.025, -0.02, 0.055, 0), ring(0.252, 0.036, 0.29), ring(0.25, 0.025, -0.29)];
      [-0.22, -0.13, -0.04].forEach(function (x) { bands.push(ring(0.253, 0.014, x)); });
      [-0.26, 0.26].forEach(function (z) { bands.push(bevel(0.46, 0.035, 0.065, 0.01, -0.04, 0.255, z)); });
      geo.emHardware = Core.mergeGeometries(bands);
      geo.emLens = barrel(0.176, 0.026, 0.353);
      geo.emFilament = Core.mergeGeometries([
        ring(0.20, 0.018, 0.37), barrel(0.072, 0.012, 0.373),
        Core.boxAt(0.10, 0.56, -0.247, 0.21, 0.028, 0.016),
        Core.boxAt(0.10, 0.56, 0.247, 0.21, 0.028, 0.016)
      ]);
      // Four swept supports leave the cardinal beam paths open; the crystal is a receiver from every direction.
      geo.targetBase = new THREE.CylinderGeometry(0.34, 0.39, 0.14, 8); geo.targetBase.translate(0, 0.12, 0);
      var foot = new THREE.CylinderGeometry(0.38, 0.40, 0.06, 8); foot.translate(0, 0.035, 0);
      var cradle = [foot, floorRing(0.305, 0.035, 0.205)];
      for (var arm = 0; arm < 4; arm++) {
        var angle = Math.PI / 8 + arm * Math.PI / 2;
        var points = [[0.28, 0.18], [0.35, 0.34], [0.32, 0.62], [0.22, 0.76]].map(function (p) {
          return new THREE.Vector3(Math.cos(angle) * p[0], p[1], Math.sin(angle) * p[0]);
        });
        cradle.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.026, 6, false));
      }
      geo.socket = Core.mergeGeometries(cradle);
      var crown = [];
      for (var sector = 0; sector < 8; sector++) {
        var arc = floorRing(0.352, 0.021, 0.175, Math.PI / 4 - 0.12);
        arc.rotateY(sector * Math.PI / 4); crown.push(arc);
      }
      geo.targetCrown = Core.mergeGeometries(crown);
      geo.emGlyph=Core.mergeGeometries([Core.boxAt(-0.18,0.10,-0.23,0.35,0.012,0.045),Core.boxAt(-0.18,0.10,0.23,0.35,0.012,0.045),Core.boxAt(-0.35,0.10,0,0.045,0.012,0.46)]);
      geo.orb = new THREE.SphereGeometry(0.255, 24, 16); geo.orb.translate(0, 0.5, 0);
      geo.core = new THREE.OctahedronGeometry(0.19, 0); geo.core.scale(0.9, 1.2, 0.9); geo.core.translate(0, 0.5, 0);
      /* FLAT target proxy: a reticle in the XY plane (so copying the camera quaternion makes it screen-facing). */
      geo.proxyRing = new THREE.RingGeometry(0.25, 0.32, 40);
      geo.proxyDot = new THREE.CircleGeometry(0.075, 20);
      geo.ring = new THREE.RingGeometry(0.42, 0.47, 40); geo.ring.rotateX(-Math.PI / 2);
      /* MOTION-DIRECTION.md 3, free teaching reveal: "Use a 0.018-cell cyan outline." */
      geo.pulse = new THREE.RingGeometry(0.5 - theme.motion.reveal.teachingOutlineWidthCells, 0.5, 40); geo.pulse.rotateX(-Math.PI / 2);
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

    /* The horizontal mirror of DESIGN.md 14: a silvered DISC set into the housing lid, with the same edge filament
     * the upright faces carry so the four pieces still read as one family. A disc rather than a square because a
     * FLOOR plate's two orientations are identical in the rules (LaserPieces.TURN_KEEP) and the model is rotated by
     * the orientation like every other piece - a square would spin visibly and promise a difference that is not
     * there, while a disc is honest under any rotation. */
    function plateGeo(type) {
      var F = P.floorPlate, y = P.housing.h + 0.004 + F.thickness / 2;
      var disc = new THREE.CylinderGeometry(F.radius, F.radius, F.thickness, F.segments);
      disc.translate(0, y, 0);
      var rim = new THREE.TorusGeometry(F.radius + F.rimFilament / 2, F.rimFilament / 2, 6, F.segments);
      rim.rotateX(-Math.PI / 2); rim.translate(0, y, 0);
      return { face: disc, filament: rim, type: type };
    }

    /* Face plane (+ merged 0.025 filament boxes) tilted about the diagonal (local X) by `tilt`, centred at mid height. */
    function faceGeo(tilt, type) {
      var size = P.mirrorPanel.size, zFrom = P.mirrorPanel.zFrom, zTo = P.mirrorPanel.zTo, f = P.edgeFilament;
      var span = zTo - zFrom, h = tilt === 0 ? span : span * Math.SQRT2, mid = (zFrom + zTo) / 2;
      var face = new THREE.BoxGeometry(size, h, 0.018);
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
      instrumentShell: Core.matFromSpec(M.instrumentShell), emitterLens: Core.matFromSpec(M.emitterLens),
      emitterHalo: new THREE.SpriteMaterial({ map: Core.glowTexture(theme.palette.emitter, 0), color: new THREE.Color(theme.palette.emitter),
        transparent: true, opacity: M.emitterHalo.opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      socket: Core.matFromSpec(M.targetSocket),
      selection: new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.palette.uiAccent), transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false }),
      hover: new THREE.MeshBasicMaterial({ color: new THREE.Color(theme.palette.uiAccent), transparent: true, opacity: 0.14, toneMapped: false, depthWrite: false }),
      cursor: new THREE.LineDashedMaterial({ color: new THREE.Color(theme.palette.uiAccent), dashSize: 0.08, gapSize: 0.05, toneMapped: false }),
      face: {},
      filament: {}
    };
    mats.housing.map = Core.grainTexture(theme);
    /* One face + one filament material per REGISTRY type. The face spec is looked up as `<type>Face` in the theme
     * (mirrorFace, wedgeFace, dipFace, floorFace); a type the theme has no entry for still draws, as a mirror face
     * repainted in its own accent, so a fifth piece is never invisible while its tokens are being written. */
    function accentOf(t) { return theme.pieceAccent[t] || theme.palette.uiAccent; }
    TYPES.forEach(function (t) {
      var spec = M[t.toLowerCase() + 'Face'];
      mats.face[t] = spec ? Core.matFromSpec(spec) : Core.matFromSpec(M.mirrorFace, { color: accentOf(t), emissive: accentOf(t) });
      mats.filament[t] = Core.matFromSpec(M.edgeFilament, { color: accentOf(t), emissive: accentOf(t) });
    });
    Core.markSharedAll([mats.housing, mats.glyph, mats.emitterBody, mats.instrumentShell, mats.emitterLens, mats.emitterFilament, mats.emitterHalo, mats.emitterHalo.map, mats.socket,
      mats.selection, mats.hover, mats.cursor]);
    TYPES.forEach(function (t) { Core.markShared(mats.face[t]); Core.markShared(mats.filament[t]); });
    /* materials whose opacity is `reveal * base` */
    var physical = [mats.housing, mats.emitterBody, mats.instrumentShell, mats.emitterLens, mats.socket];
    TYPES.forEach(function (t) { physical.push(mats.face[t], mats.filament[t]); });
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

    /* The type a piece PRETENDS to be while the board is flat: a secret piece wears a MIRROR (the common case), and
     * everything else wears itself. It decides the decoy model AND the flat glyph together, so a disguised piece can
     * never be given away by the mark on its lid. */
    function shownType(type, secret) { return (secret && type !== 'MIRROR' && geo.faces.MIRROR) ? 'MIRROR' : type; }
    function glyphGeo(type) { return (SHAPE[type] && SHAPE[type].flat) ? geo.plateGlyph : geo.glyph; }

    /* A piece group. Secret pieces keep both models and swap on reveal >= 0.5. */
    function pieceModel(type, orient, secret, ghostMats) {
      var g = new THREE.Group(), gm = ghostMats, shown = shownType(type, secret);
      if (!geo.faces[type]) type = TYPES[0];            /* an unknown type still draws, as the first registry piece */
      g.rotation.y = orientAngle(orient);
      var housing = new THREE.Mesh(geo.housing, gm ? gm.body : mats.housing); housing.castShadow = !gm; g.add(housing);
      var glyph = new THREE.Mesh(glyphGeo(shown), gm ? gm.body : mats.glyph); glyph.renderOrder = 2; g.add(glyph);
      var real = faceMesh(type, gm ? gm.face : mats.face[type], gm ? gm.face : mats.filament[type]); g.add(real);
      g.userData = { type: type, orient: orient, secret: !!secret, real: real, glyph: glyph, housing: housing };
      if (shown !== type) {
        var decoy = faceMesh(shown, mats.face[shown], mats.filament[shown]);
        g.add(decoy); g.userData.decoy = decoy;
      }
      updateSecret(g);
      return g;
    }
    /* A `secret` fixed piece wears another type's flat glyph, and that glyph IS the lie: it is drawn at 1 - r, so
     * it is the whole of what FLAT shows. The physical faces are drawn at r * base opacity, so at r = 0 neither
     * face is on screen at all - which means the decoy face has nothing to say during the reveal and everything to
     * lose by saying it. Swapping the two at r >= 0.5 was a hard identity change partway through the orbit, and
     * MOTION-DIRECTION.md 3 allows no threshold there: "the lie collapses" means the TRUE face is what fades in
     * with r, from nothing, while the glyph fades out with 1 - r. */
    function updateSecret(g) {
      if (!g.userData.decoy) return;
      var showReal = reveal > 0;
      g.userData.real.visible = showReal; g.userData.decoy.visible = !showReal;
    }
    function placeAt(obj, x, y) { obj.position.set(x, heightAt(x, y), -y); return obj; }

    /* ---- the drag/drop/rotate/remove proxy (MOTION-DIRECTION.md section 5) -------------------------------------
     * A detached copy of the piece with its OWN materials, so it can be lifted, scaled, spun and faded without
     * touching the shared board materials every other piece is drawn with. depthTest is off: in FLAT a 6 px lift
     * pushes a sliver of the housing past its own cell edge, and letting a taller neighbour clip that sliver would
     * make the lift's appearance depend on hidden height. The clones are disposed by hand rather than through
     * Core.disposeObject, because they share the housing's brushed-grain texture with the real board material. */
    function proxyModel(type, orient) {
      if (!geo.faces[type]) type = TYPES[0];
      var g = new THREE.Group();
      g.rotation.y = orientAngle(orient);
      var clones = [];
      function own(src, base) {
        var m = src.clone();
        m.userData = { shared: false, baseOpacity: base };
        m.transparent = true; m.depthWrite = false; m.depthTest = false;
        clones.push(m);
        return m;
      }
      var hm = own(mats.housing, mats.housing.userData.baseOpacity);
      var gm = own(mats.glyph, 1);
      var fm = own(mats.face[type], mats.face[type].userData.baseOpacity);
      var lm = own(mats.filament[type], mats.filament[type].userData.baseOpacity);
      var housing = new THREE.Mesh(geo.housing, hm); housing.renderOrder = 7; g.add(housing);
      var glyph = new THREE.Mesh(glyphGeo(type), gm); glyph.renderOrder = 8; g.add(glyph);
      var face = new THREE.Mesh(geo.faces[type].face, fm); face.renderOrder = 7;
      var fil = new THREE.Mesh(geo.faces[type].filament, lm); fil.renderOrder = 7;
      g.add(face); g.add(fil);
      g.userData = {};
      return {
        group: g,
        /* The same mapping applyReveal() uses, so the proxy is the piece the player was already looking at:
         * physical parts at reveal x their base opacity, the common glyph at 1 - reveal. */
        setOpacity: function (fade, r) {
          var i, m;
          for (i = 0; i < clones.length; i++) {
            m = clones[i];
            m.opacity = (m === gm ? (1 - r) : m.userData.baseOpacity * r) * fade;
            m.visible = m.opacity > 0.001;
          }
        },
        dispose: function () { for (var i = 0; i < clones.length; i++) clones[i].dispose(); }
      };
    }

    /* Section 5 lives in its own file: everything it draws is transient, and keeping it apart is what makes
     * "does every placement animation stop?" answerable by reading one short module. */
    var fx = root.LaserPlacementFx ? root.LaserPlacementFx.create({
      theme: theme, parent: group, place: placeAt, makeProxy: proxyModel, fog: fog, motion: motion,
      onProxies: function () { applyProxyMasks(); }
    }) : null;

    /* ---- the emitter's charge (MOTION-DIRECTION.md 2, T0..T0+m.fire.chargeMs) ---------------------------------
     * "Multiply filament emissive intensity from 1 to 1.35, easeInCubic. Contract its halo from scale 1 to 0.84
     * while opacity rises from its existing value to 0.34, smoothstep." Then "Return filament intensity, halo
     * scale, and halo opacity to their existing values" over m.fire.releaseMs, easeOutCubic.
     *
     * The CURVES are the beam's: it owns the one clock a shot runs on, and getCharge() hands back the two already
     * eased scalars. This function is therefore pure application - two material writes and one scale - and it is a
     * strict no-op once the charge is over, so a settled emitter carries no residue of it. Nothing here reads the
     * board: the emitter's cell is the same cell at every terrain height. */
    var NO_CHARGE = { active: false, intensity: 0, halo: 0 };
    var emitterHalo = null, emitterHaloScale = 1, chargeApplied = false;
    var FIRE = theme.motion.fire;
    var filamentBaseIntensity = (mats.emitterFilament.emissiveIntensity === undefined) ? 1 : mats.emitterFilament.emissiveIntensity;
    var haloBaseOpacity = mats.emitterHalo.opacity;
    function setCharge(c) {
      var on = !!(c && c.active);
      if (!on && !chargeApplied) return;                 /* the common case: nothing to write, nothing to undo */
      chargeApplied = on;
      var k = on ? c.intensity : 0, h = on ? c.halo : 0;
      mats.emitterFilament.emissiveIntensity = filamentBaseIntensity * (1 + (FIRE.chargeEmissiveMultiplier - 1) * k);
      mats.emitterLens.emissiveIntensity = M.emitterLens.emissiveIntensity * (1 + 2 * k);
      mats.emitterHalo.opacity = haloBaseOpacity + (FIRE.chargeHaloOpacity - haloBaseOpacity) * h;
      if (emitterHalo) {
        var s = emitterHaloScale * (1 + (FIRE.chargeHaloScale - 1) * h);
        emitterHalo.scale.set(s, s, 1);
      }
    }

    /* ---- level actors ---- */
    var targets = [];
    function setLevel(parsed, hAt) {
      level = parsed; heightAt = hAt;
      Core.clearGroup(placedGroup); Core.clearGroup(fixedGroup); Core.clearGroup(actorGroup);
      targets = [];
      clearOverlay();
      var em = new THREE.Group(); em.name = 'laser-emitter';
      em.rotation.y = DIR_ROT[parsed.emitter.dir] || 0;
      var b1 = new THREE.Mesh(geo.emChassis, mats.instrumentShell); b1.castShadow = true; em.add(b1);
      var b2 = new THREE.Mesh(geo.emHardware, mats.emitterBody); b2.castShadow = true; em.add(b2);
      em.add(new THREE.Mesh(geo.emLens, mats.emitterLens));
      em.add(new THREE.Mesh(geo.emFilament, mats.emitterFilament));
      var sourceGlyph=new THREE.Mesh(geo.emGlyph,mats.glyph);sourceGlyph.renderOrder=6;em.add(sourceGlyph);
      var halo = new THREE.Sprite(mats.emitterHalo); halo.position.set(0.36, 0.5, 0); halo.scale.set(0.7, 0.7, 1); em.add(halo);
      emitterHalo = halo; emitterHaloScale = halo.scale.x;
      setCharge(NO_CHARGE);                  /* a new level always starts at the emitter's plain theme state */
      actorGroup.add(placeAt(em, parsed.emitter.x, parsed.emitter.y));
      parsed.targets.forEach(function (tg, i) {
        var g = new THREE.Group(); g.name = 'laser-receiver-' + i;
        var base = new THREE.Mesh(geo.targetBase, mats.instrumentShell); base.castShadow = true; g.add(base);
        var sock = new THREE.Mesh(geo.socket, mats.socket); sock.castShadow = true; g.add(sock);
        var crownMat=new THREE.MeshBasicMaterial({color:new THREE.Color(theme.palette.targetUnlit),transparent:true,opacity:0,toneMapped:false,depthWrite:false});
        g.add(new THREE.Mesh(geo.targetCrown,crownMat));
        var orbMat = Core.matFromSpec(M.targetUnlit);
        var orb = new THREE.Mesh(geo.orb, orbMat); orb.renderOrder = 3; g.add(orb);
        var coreMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.palette.targetUnlit),
          emissive: new THREE.Color(theme.palette.targetUnlit), emissiveIntensity: 0.8,
          roughness: 0.18, metalness: 0.25, transparent: true, opacity: 0 });
        var core = new THREE.Mesh(geo.core, coreMat); g.add(core);
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
        orbMat.envMapIntensity = reveal; coreMat.envMapIntensity = reveal;
        var rec = { index: i, crown: crownMat, orb: orbMat, core: coreMat, coreMesh: core, halo: haloMat, proxy: proxy, proxyMat: proxyMat, lit: 0, goal: 0 };
        targets.push(rec);
        lerpTarget(rec, 0);
      });
      /* DESIGN.md 15.1: a piece the LEVEL placed is part of the world and is hidden until the beam has been in its
       * cell; a piece the PLAYER placed is always drawn, known cell or not (setPlaced below is deliberately not
       * fogged). The cell and the column top are stashed on the group so the per-frame pass costs one lookup. */
      parsed.fixed.forEach(function (f) {
        var m = placeAt(pieceModel(f.type, f.orient, f.secret), f.x, f.y);
        m.userData.cell = { x: f.x, y: f.y };
        m.userData.baseY = m.position.y;
        fixedGroup.add(m);
      });
      applyFog();
    }

    /* The fog pass for the level's own pieces: they ride the column as it grows out of the ground, and are simply
     * not there before it does. Nothing else in this module is fogged - targets and the emitter are known from the
     * start (15.1), the player's own pieces are always drawn, and every overlay is a player affordance. */
    /* MOTION-DIRECTION.md 8: "Apply the same mask to terrain, fixed pieces, and opening gleams." A fixed piece
     * cannot sample the per-fragment mask, so render-terrain publishes a whole-cell scalar (cellReveal) and the
     * host installs it here. With the burn running that scalar is the SWEEP's position across the cell, so the
     * piece arrives with the terrain around it instead of popping in at the beam event - and it arrives at its
     * true position, because section 8 says terrain "does not grow upward". The old lift is kept on the pre-burn
     * path, where the scalar is render-core's own eased arrival and the lift is what that arrival IS. */
    var fogSampler = null;
    function setFogSampler(fn) { fogSampler = (typeof fn === 'function') ? fn : null; applyFog(); }
    function applyFog() {
      var i, c, k, on = !!(fog && fog.isDark()), min = theme.terrain.darkness.minVisible;
      for (i = 0; i < fixedGroup.children.length; i++) {
        c = fixedGroup.children[i];
        if (!c.userData || !c.userData.cell) continue;
        k = on ? (fogSampler ? fogSampler(c.userData.cell.x, c.userData.cell.y) : fog.value(c.userData.cell.x, c.userData.cell.y)) : 1;
        c.visible = k > min;
        c.position.y = fogSampler ? c.userData.baseY : c.userData.baseY * k;
      }
    }

    /* ---- placed pieces, and the edit that produced them (MOTION-DIRECTION.md section 5) ------------------------
     * The host commits an edit and hands over the WHOLE new list; it does not say what changed. Rather than ask it
     * to, the change is read off the two lists: a cell that gained a piece was a drop, a cell that lost one was a
     * removal, a cell whose orientation moved was a rotation, and exactly one loss plus exactly one gain of the
     * same type is a drag from one cell to the other. That keeps the feel of an edit in the renderer, where the
     * pose being animated lives, and it costs one pass over a list that is at most a level's tray. */
    var placedNow = [];
    function findAt(list, x, y) { for (var i = 0; i < list.length; i++) if (list[i].x === x && list[i].y === y) return list[i]; return null; }
    function isPlate(type) { return !!(SHAPE[type] && SHAPE[type].flat); }
    function diffPlaced(prev, next) {
      if (!fx) return;
      var gained = [], lost = [], i, p, q;
      for (i = 0; i < next.length; i++) {
        p = next[i]; q = findAt(prev, p.x, p.y);
        if (!q) gained.push(p);
        else if (q.orient !== p.orient || q.type !== p.type) fx.rotate(p, p.type, p.orient, isPlate(p.type));
      }
      for (i = 0; i < prev.length; i++) { q = prev[i]; if (!findAt(next, q.x, q.y)) lost.push(q); }
      /* One out, one in, same type: the player dragged it. The destination gets the drop; the source gets nothing,
       * because the piece did not cease to exist there, it arrived here. */
      if (gained.length === 1 && lost.length === 1 && gained[0].type === lost[0].type) {
        fx.drop(gained[0], gained[0].type, gained[0].orient);
        return;
      }
      for (i = 0; i < lost.length; i++) fx.remove(lost[i], lost[i].type, lost[i].orient);
      for (i = 0; i < gained.length; i++) fx.drop(gained[i], gained[i].type, gained[i].orient);
    }
    function setPlaced(placed) {
      var next = (placed || []).map(function (p) { return { x: p.x, y: p.y, type: p.type, orient: p.orient }; });
      Core.clearGroup(placedGroup);
      next.forEach(function (p) {
        var m = placeAt(pieceModel(p.type, p.orient, false), p.x, p.y);
        m.userData.cell = { x: p.x, y: p.y };
        placedGroup.add(m);
      });
      diffPlaced(placedNow, next);
      placedNow = next;
      applyProxyMasks();
    }
    /* While a proxy stands in for a piece, the board copy is hidden: two of the same piece in one cell, one of
     * them lifted, would read as a duplicate rather than as one piece being seated. */
    function applyProxyMasks() {
      if (!fx) return;
      var i, c;
      for (i = 0; i < placedGroup.children.length; i++) {
        c = placedGroup.children[i];
        if (c.userData && c.userData.cell) c.visible = !fx.hasProxy(c.userData.cell.x, c.userData.cell.y);
      }
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
      t.crown.color.copy(TC.colorUnlit).lerp(TC.colorLit,k);
      t.core.color.copy(TC.colorUnlit).lerp(TC.colorLit, k);
      t.core.emissive.copy(TC.colorUnlit).lerp(TC.colorLit, k);
      t.core.emissiveIntensity = 0.8 + 0.9 * k;
      t.halo.opacity = k * theme.beam.endStates.target.haloOpacity;
      var fill = 0.72 + 0.28 * k;
      t.coreMesh.scale.setScalar(fill); t.coreMesh.position.y = 0.5 * (1 - fill);
      refreshTarget(t);
    }
    /* Physical orb vs FLAT proxy, on complementary curves. `show` is max(reveal, lit): a LIT target must glow in the
     * flat view too (it is the game's only "you did it" tell before the modal), so lighting it brings the physical
     * orb in even at reveal 0, and retires the proxy at the same rate. */
    function refreshTarget(t) {
      var a = M.targetUnlit, b = M.targetLit;
      var base = t.orb.userData.baseOpacity === undefined ? a.opacity + (b.opacity - a.opacity) * t.lit : t.orb.userData.baseOpacity;
      var show = Math.max(reveal, t.lit);
      t.crown.opacity = show * 0.90; t.crown.visible = show > 0.001;
      t.orb.opacity = base * show;
      t.orb.transparent = true;
      t.orb.visible = show > 0.001;
      t.core.opacity = show; t.core.visible = show > 0.001;
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
      targets.forEach(function (t) { t.orb.envMapIntensity = r; t.core.envMapIntensity = r; refreshTarget(t); });
      placedGroup.children.forEach(updateSecret); fixedGroup.children.forEach(updateSecret);
    }

    /* ---- overlays: selection, ghost, hover, cursor, pulse ---- */
    var selection = null, hover = null, cursor = null, pulses = [];
    function clearOverlay() {
      Core.clearGroup(overlay); selection = hover = cursor = null; pulses = [];
      if (fx) fx.clear();                      /* the transient placement overlays belong to the attempt that is going away */
      placedNow = [];
    }
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
    /* MOTION-DIRECTION.md section 5, "Legal ghost": one fixed 0.72-cell footprint plus the proposed COMMON glyph,
     * in palette.commonFlatPiece. The old ghost was the physical model in the piece's own accent, which named the
     * piece on the board before it was placed - exactly the identity the flat view must not carry. src/render-
     * placement.js owns the drawing; the only thing decided here is whether the piece lies flat (FLOOR's disc). */
    function setGhost(g) {
      if (!fx) return;
      fx.setGhost(g ? { x: g.x, y: g.y, orient: g.orient, invalid: !!g.invalid, flatPlate: isPlate(g.type) } : null);
    }
    var PULSE_PEAK = theme.motion.reveal.teachingOutlineOpacity;
    var easePulse = theme.easeByName(theme.motion.easing.pulse);
    /* Ladder rung 3 takes the teaching outline's PULSE, and the document's replacement is named: "Use a stationary
     * teaching outline." That is exactly the reduced-motion presentation this predicate already selects, so the cut
     * reuses it rather than inventing a second stationary outline. */
    var decorCuts = { rings: false };
    function setDecorCuts(c) { if (c) decorCuts = c; if (fx && fx.setDecorCuts) fx.setDecorCuts(c); }
    function pulseStill() { return !!((motion && motion.isReducedMotion()) || decorCuts.rings); }
    function pulseCell(cell, opts) {
      var col = (opts && opts.color) || theme.camera.revealChoreography.pulseColor;
      var m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: PULSE_PEAK * (pulseStill() ? 1 : 0), toneMapped: false, depthWrite: false });
      var mesh = placeAt(new THREE.Mesh(geo.pulse, m), cell.x, cell.y);
      mesh.position.y += 0.01; mesh.renderOrder = 4;
      overlay.add(mesh);
      pulses.push({ mesh: mesh, t: 0, ms: theme.camera.revealChoreography.pulseOutlineMs });
    }

    function frame(dt, speed, view) {
      /* Two different clocks, and section 7 is why. A target LIGHTING is the arrival of the shot and keeps the
       * existing 160 ms; a target going dark again is a retrace discovering the beam no longer reaches it, and
       * that is `failure.targetUnlightMs` - 120 ms. Same material, opposite directions, different durations. */
      var litMs = theme.beam.endStates.target.litFadeMs / 1000 / speed;
      var unlitMs = theme.motion.failure.targetUnlightMs / 1000 / speed, i;
      applyFog();
      for (i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (view && t.proxy.visible) t.proxy.quaternion.copy(view.quaternion);   /* screen-facing reticle */
        if (t.lit === t.goal) continue;
        t.lit = t.goal > t.lit ? Math.min(t.goal, t.lit + dt / litMs) : Math.max(t.goal, t.lit - dt / unlitMs);
        lerpTarget(t, t.lit);
      }
      if (fx) { fx.frame(view, reveal); applyProxyMasks(); }
      /* MOTION-DIRECTION.md 3, step 4 of the free teaching reveal: "pulse one relevant visible outline for 500 ms,
       * using bell opacity from zero to 0.55 and back". Opacity ONLY - the outline does not grow, so it never
       * spills into a neighbouring cell and never suggests a size the board does not have. Reduced motion asks for
       * "a stationary outline", which is the same mark held at its peak for the same 500 ms. */
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i]; p.t += dt * 1000 * speed;
        var k = Math.min(1, p.t / p.ms);
        p.mesh.material.opacity = PULSE_PEAK * (pulseStill() ? 1 : easePulse(k));
        if (k >= 1) { overlay.remove(p.mesh); Core.disposeObject(p.mesh); pulses.splice(i, 1); }
      }
    }

    /* Standalone model for tray icons (real type, always physical). Caller adds it to its own scene. */
    function trayModel(type) {
      var g = new THREE.Group();
      if (!geo.faces[type]) type = TYPES[0];
      function solid(m, opacity) { var c = m.clone(); c.userData.shared = false; c.visible = true; c.opacity = opacity; c.transparent = opacity < 1; if (c.envMapIntensity !== undefined) c.envMapIntensity = 1; return c; }
      g.add(new THREE.Mesh(geo.housing, solid(mats.housing, 1)));
      g.add(faceMesh(type, solid(mats.face[type], mats.face[type].userData.baseOpacity), solid(mats.filament[type], 1)));
      g.rotation.y = orientAngle('/');
      return g;
    }

    function dispose() {
      if (fx) fx.dispose();
      var at = instances.indexOf(self); if (at >= 0) instances.splice(at, 1);
      Core.clearGroup(group);
      for (var k in geo) if (Object.prototype.hasOwnProperty.call(geo, k)) {
        if (geo[k].dispose) geo[k].dispose();
        else for (var f in geo[k]) if (geo[k][f].face) { geo[k][f].face.dispose(); geo[k][f].filament.dispose(); }
      }
      physical.concat([mats.glyph, mats.emitterFilament, mats.emitterHalo, mats.selection, mats.hover, mats.cursor]).forEach(function (m) { m.dispose(); });
      /* physical already carries every per-type face and filament material, so a fifth piece needs nothing here. */
      if (mats.emitterHalo.map) mats.emitterHalo.map.dispose();
    }

    /* Frames are still needed while a target is fading between lit states, a reveal pulse is easing, or a
     * placement proxy is live. The last term matters: the host's loop already consults render.needsFrame(), so a
     * placement animation keeps the loop alive through a path that exists today, and src/render-placement.js's
     * sweep() guarantees it goes false again even if motion.tick() were never wired in. */
    function isAnimating() {
      var i;
      if (pulses.length) return true;
      if (fx && fx.isAnimating()) return true;
      for (i = 0; i < targets.length; i++) if (targets[i].lit !== targets[i].goal) return true;
      return false;
    }

    var self = {
      group: group, setLevel: setLevel, setPlaced: setPlaced, applyReveal: applyReveal, setTargetLit: setTargetLit,
      resetTargets: resetTargets, setSelection: setSelection, setGhost: setGhost, setHover: setHover, setCursor: setCursor,
      pulseCell: pulseCell, setDecorCuts: setDecorCuts, frame: frame, isAnimating: isAnimating, trayModel: trayModel, dispose: dispose, materials: mats,
      applyFog: applyFog, types: function () { return TYPES.slice(); }, shape: function (t) { return SHAPE[t] || null; },
      /* MOTION-DIRECTION.md section 5. setPickup(cell) is the "Pick up" row - the host calls it when a drag takes
       * hold of a placed piece, and setPickup(null) is "Cancel drag". flashInvalid(cell) is the danger outline on
       * a refused footprint. Both are no-ops until the host calls them, and neither is inferable from the state
       * the renderer is handed, which is why they are entry points rather than something diffed. */
      setPickup: function (cell) { if (fx) fx.setPickup(cell); },
      flashInvalid: function (cell) { if (fx) fx.flashInvalid(cell); },
      /* MOTION-DIRECTION.md 2's emitter charge, and section 8's whole-cell reveal scalar. Both are pushed by
       * render.js: the beam owns the charge clock, render-terrain owns the sweep. */
      setCharge: setCharge, setFogSampler: setFogSampler,
      setMotion: function (m) { motion = m || null; if (fx) fx.setMotion(motion); }
    };
    instances.push(self);
    return self;
  }

  /* The one wiring hook. main.js: `LaserRenderPieces.attachMotion(motion);` right after LaserMotion.create().
   * Everything section 5 draws is skipped until this is called, so forgetting it costs the placement feel and
   * nothing else - never a frozen board and never a loop with no way out. */
  function attachMotion(m) {
    sharedMotion = m || null;
    for (var i = 0; i < instances.length; i++) instances[i].setMotion(sharedMotion);
    return sharedMotion;
  }

  root.LaserRenderPieces = { __version: 1, create: create, orientAngle: orientAngle, describe: describe, types: types,
    attachMotion: attachMotion,
    /* Live instances, newest last. render.js DOES now re-export setPickup/flashInvalid and main.js onDragPiece()
     * calls them, so this is no longer the only way to reach section 5's two entry points - it remains what the
     * verification harness drives. Read-only: the array is copied. */
    instances: function () { return instances.slice(); } };
}(typeof self !== 'undefined' ? self : this));
