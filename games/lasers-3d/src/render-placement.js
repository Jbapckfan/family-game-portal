/* Lasers 3D - placement feel (MOTION-DIRECTION.md section 5) and the failure-side overlays it owns.
 * Global: window.LaserPlacementFx. Classic script, ES2019 (Safari 15). Needs THREE + LaserRenderCore.
 * Constructed by src/render-pieces.js; it owns nothing on the board batch, only transient overlay objects.
 *
 * WHY THIS IS A SEPARATE FILE. render-pieces.js is the board's permanent content (pieces, emitter, targets,
 * selection, hover, cursor). Everything here is transient: it exists for between 80 and 400 ms and then must be
 * gone. Keeping the two apart is what makes "did every animation stop?" answerable by reading one file.
 *
 * THE TWO RULES THAT OUTRANK EVERY LINE BELOW.
 *  1. FLAT LEAKS NOTHING. Nothing here reads terrain height, opening height, opening count or opening shape to
 *     choose a duration, an amplitude, a colour, a scale or a delay. The 6 CSS px lift is converted to world units
 *     through the orthographic camera's uniform world-per-pixel scale, so it is the SAME screen displacement on a
 *     3-high column and on the floor. Proxies draw with depthTest off, so a neighbouring column can never bite a
 *     height-dependent sliver out of a lifted piece. The ghost is one common footprint plus one common glyph in
 *     one common colour: MIRROR, WEDGE, DIP and FLOOR are indistinguishable in it except by the FLOOR disc the
 *     flat view is already allowed to show (DESIGN.md 14.3).
 *  2. EVERY ANIMATION ENDS. Every effect here is one LaserMotion animation with a duration, an exact final state
 *     and a cancel. Nothing polls, nothing loops, nothing is scheduled from inside an update. With no registry
 *     attached the module applies the settled state immediately and animates nothing at all, so a page that has
 *     not wired the scheduler degrades to today's behaviour rather than to a frozen board or an endless loop.
 */
(function (root) {
  'use strict';
  var THREE = root.THREE;

  function cellKey(x, y) { return x + ',' + y; }
  /* The piece's own orientation angle, borrowed from render-pieces rather than restated, so the ghost's glyph can
   * never drift out of step with the model it previews. Resolved at call time (load order puts this file first). */
  function orientAngle(o) {
    var RP = root.LaserRenderPieces;
    return (RP && typeof RP.orientAngle === 'function') ? RP.orientAngle(o) : (o === '/' ? Math.PI / 4 : -Math.PI / 4);
  }

  function create(o) {
    var theme = o.theme;
    var T = theme.motion.placement;             /* the whole of section 5's ledger */
    var RED = theme.motion.reduced;
    var INV = theme.ui.button.invalid;          /* "the existing 400 ms" danger outline */
    var P = theme.piece;
    var place = o.place;                        /* (obj, x, y) -> obj at that cell's top */
    var makeProxy = o.makeProxy;                /* (type, orient) -> { group, setOpacity(fade, reveal), dispose() } */
    /* Called the instant a proxy appears or is released, so the board copy it stands in for is hidden and
     * unhidden in the SAME update - never one frame later. final() must be the settled state, not a promise of
     * one: documentHidden() settles without rendering, and the piece has to be right at that moment. */
    var notifyProxies = o.onProxies || function () {};
    var fog = o.fog || null;
    var motion = o.motion || null;
    /* Its own group, hung off the pieces group rather than off render-pieces' `overlay`: that overlay is emptied
     * with Core.clearGroup on every level change, which disposes what it holds, and these geometries and
     * materials are shared for the life of the renderer. clear() below is this module's own teardown. */
    var overlay = new THREE.Group();
    overlay.name = 'placement-fx';
    o.parent.add(overlay);

    /* ---------------------------------------------------------------- geometry (shared, never disposed per use) */
    var yPad = P.housing.h + 0.004, yMark = P.housing.h + 0.006;
    function plate(w, d, y) { var g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; }
    var geo = {
      pad: plate(P.housing.w, P.housing.d, yPad),
      seat: plate(P.housing.w, P.housing.d, P.housing.h + 0.003),
      glyph: plate(P.flatGlyph.length, P.flatGlyph.width, yMark),
      disc: (function () { var g = new THREE.CircleGeometry(P.floorPlate.glyphRadius, 28); g.rotateX(-Math.PI / 2); g.translate(0, yMark, 0); return g; }()),
      /* The illegal-placement outline: a square ring exactly the housing's footprint, one edge-filament thick, so
       * it reuses the housing dimensions the Tokens line points at rather than inventing a size. */
      outline: (function () {
        var h = P.housing.w / 2, t = P.edgeFilament, i = h - t;
        var s = new THREE.Shape();
        s.moveTo(-h, -h); s.lineTo(h, -h); s.lineTo(h, h); s.lineTo(-h, h); s.closePath();
        var hole = new THREE.Path();
        hole.moveTo(-i, -i); hole.lineTo(-i, i); hole.lineTo(i, i); hole.lineTo(i, -i); hole.closePath();
        s.holes.push(hole);
        var g = new THREE.ShapeGeometry(s);
        g.rotateX(-Math.PI / 2); g.translate(0, P.housing.h + 0.008, 0);
        return g;
      }())
    };

    /* ---------------------------------------------------------------- materials */
    function basic(color, opacity) {
      return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: opacity,
        toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
    }
    var mats = {
      ghost: basic(T.overlayColor, T.ghostOpacity),
      seat: basic(T.overlayColor, T.seatOpacity),
      invalid: basic(theme.palette.danger, 1)
    };
    (function () {
      var Core = root.LaserRenderCore, k;
      if (!Core) return;
      for (k in geo) if (Object.prototype.hasOwnProperty.call(geo, k)) Core.markShared(geo[k]);
      for (k in mats) if (Object.prototype.hasOwnProperty.call(mats, k)) Core.markShared(mats[k]);
    }());

    /* ---------------------------------------------------------------- live animation bookkeeping */
    /* Every handle this module starts is tracked with the wall-clock time it must be finished by. sweep() is the
     * TERMINATION GUARANTEE, not a second scheduler: it never advances an animation, it only settles one that is
     * already past its end - which can happen for exactly one reason, that motion.tick() is not being called. That
     * turns "the host forgot to wire the scheduler" from an endless requestAnimationFrame into one settled frame. */
    var live = [];
    function track(handle, endMs) { if (handle && handle.isLive && handle.isLive()) live.push({ h: handle, end: endMs }); }
    function sweep() {
      var t = motion ? motion.now() : 0, i;
      for (i = live.length - 1; i >= 0; i--) {
        if (!live[i].h.isLive()) { live.splice(i, 1); continue; }
        if (t > live[i].end + 1) { live[i].h.settle(); live.splice(i, 1); }
      }
    }
    function isAnimating() {
      var i;
      for (i = 0; i < live.length; i++) if (live[i].h.isLive()) return true;
      return false;
    }

    function reduced() { return !!(motion && motion.isReducedMotion()); }
    function ms(v, fixedReduced) { return motion ? motion.scaleMs(v, fixedReduced) : v; }
    function attempt() { return motion ? motion.token().attempt : undefined; }
    /* One place where a spec becomes a live animation, so no caller can forget the stamp or the tracking. */
    function run(spec) {
      if (!motion) { spec.final(); return null; }
      spec.attempt = attempt();
      var h = motion.run(spec);
      track(h, motion.now() + (spec.delayMs || 0) + spec.durationMs);
      return h;
    }
    function repaint() { if (motion) motion.requestRender(); }

    /* ================================================================ the ghost (section 5, "Legal ghost") */
    /* One common footprint plus the proposed common glyph, in palette.commonFlatPiece at 0.28. It is deliberately
     * NOT the physical model: identical presentation for MIRROR, WEDGE and DIP is the flat-view boundary's first
     * requirement, and a ghost that showed the piece's accent would say which piece is coming before it lands. */
    var ghost = new THREE.Group();
    var ghostPad = new THREE.Mesh(geo.pad, mats.ghost);
    var ghostMark = new THREE.Mesh(geo.glyph, mats.ghost);
    ghostPad.renderOrder = 5; ghostMark.renderOrder = 6; ghost.renderOrder = 5;
    ghost.add(ghostPad); ghost.add(ghostMark);
    ghost.visible = false;
    overlay.add(ghost);
    var ghostAt = null;                          /* the cell the current fade belongs to */

    function setGhost(g) {
      if (!g) {
        if (motion) motion.cancel('placement.ghost');
        ghost.visible = false; ghostAt = null; mats.ghost.opacity = 0;
        repaint();
        return;
      }
      /* Darkness: an unknown cell's legality is decided by contents the player cannot see, so colouring the ghost
       * by it would hand over what is hidden there. It stays neutral until an attempted placement answers. */
      var bad = !!g.invalid;
      if (bad && fog && fog.isDark() && !fog.known(g.x, g.y)) bad = false;
      mats.ghost.color.set(bad ? theme.palette.danger : T.overlayColor);
      var flat = !!g.flatPlate;
      ghostMark.geometry = flat ? geo.disc : geo.glyph;
      ghostMark.rotation.y = flat ? 0 : orientAngle(g.orient);
      place(ghost, g.x, g.y);
      ghost.visible = true;
      var k = cellKey(g.x, g.y);
      /* "Changing orientation updates the ghost immediately": the pose above has already been written, so a
       * same-cell call only needs the frame, never a second fade. */
      if (ghostAt === k) { repaint(); return; }
      ghostAt = k;
      if (reduced()) { mats.ghost.opacity = T.ghostOpacity; repaint(); return; }
      run({
        key: 'placement.ghost', role: 'decorative', surface: 'webgl',
        durationMs: ms(T.ghostFadeMs), ease: theme.motion.easing.linear,
        from: 0, to: T.ghostOpacity,
        update: function (e, ctx) { mats.ghost.opacity = ctx.value; },
        final: function () { mats.ghost.opacity = T.ghostOpacity; },
        fallback: function () { mats.ghost.opacity = T.ghostOpacity; },
        cancel: function () { mats.ghost.opacity = T.ghostOpacity; }
      });
    }

    /* ================================================================ the seating mark (section 5, "Seating mark") */
    /* Ladder rung 3 takes the seating FADE, never the mark: the footprint still confirms where the piece landed,
     * it simply stops fading out - the same stationary presentation reduced motion already uses. */
    var decorCuts = { rings: false };
    var seat = null;                             /* { mesh } while one is on screen; at most one at a time */
    function clearSeat() { if (seat) { overlay.remove(seat); seat = null; } }
    function showSeat(cell, durationMs, fade) {
      /* Only one seating mark exists, and both presentations drive the same material: retire whichever one is
       * still running before the next takes the mesh. */
      if (motion) { motion.cancel('placement.seat'); motion.cancel('placement.seat.hold'); }
      clearSeat();
      seat = place(new THREE.Mesh(geo.seat, mats.seat), cell.x, cell.y);
      seat.renderOrder = 4;
      mats.seat.opacity = T.seatOpacity;
      overlay.add(seat);
      repaint();
      if (!motion) { clearSeat(); return; }
      if (!fade) {
        /* Reduced motion and the FLOOR acknowledgement: stationary, then gone in one update. A hold renders
         * nothing, so the two repaints around it are the only frames it costs. */
        var h = motion.hold(motion.holdMs(durationMs), function () { clearSeat(); repaint(); },
          { key: 'placement.seat.hold', role: 'decorative', attempt: attempt(), cancel: function () { clearSeat(); repaint(); } });
        return h;
      }
      run({
        key: 'placement.seat', role: 'decorative', surface: 'webgl',
        durationMs: durationMs, ease: theme.motion.easing.enter,
        from: T.seatOpacity, to: 0,
        update: function (e, ctx) { mats.seat.opacity = ctx.value; },
        final: clearSeat, fallback: clearSeat, cancel: clearSeat
      });
    }

    /* ================================================================ illegal placement (section 5, last row) */
    /* "Keep the board and piece in place." The board does not move, the piece does not move, nothing flashes:
     * a stationary danger outline sits on the footprint that was refused and then it is gone. */
    var invalid = null;
    function clearInvalid() { if (invalid) { overlay.remove(invalid); invalid = null; } }
    function flashInvalid(cell) {
      if (!cell || !motion) return;
      clearInvalid();
      invalid = place(new THREE.Mesh(geo.outline, mats.invalid), cell.x, cell.y);
      invalid.renderOrder = 7;
      overlay.add(invalid);
      run({
        key: 'placement.invalid', role: 'decorative', surface: 'webgl',
        durationMs: INV.dangerBorderMs, ease: theme.motion.easing.linear,
        update: function () { mats.invalid.opacity = 1; },      /* stationary for its whole life, then removed */
        final: clearInvalid, fallback: clearInvalid, cancel: clearInvalid
      });
    }

    /* ================================================================ proxies (pick up, drop, rotate, remove) */
    /* A proxy is the piece as the player sees it, detached from the board batch so it can be lifted, scaled and
     * turned without touching shared geometry. It draws with depthTest off at a high render order: in FLAT that is
     * what stops a taller neighbour from clipping a lifted piece, which would otherwise be a height tell. */
    var proxies = {};                            /* cellKey -> state */
    /* placement.rotateDeg, in radians. NEGATIVE on rotation.y: positive rotation.y turns east toward north, which
     * reads anticlockwise on screen, so the spin counts DOWN from +rotateDeg to zero to turn CLOCKWISE. */
    var SPIN = T.rotateDeg * Math.PI / 180;
    var up = new THREE.Vector3(), base = new THREE.Vector3();
    var lastView = null, reveal = 0;

    function endProxy(st) {
      if (!st || st.dead) return;
      st.dead = true;
      if (proxies[st.k] === st) delete proxies[st.k];
      overlay.remove(st.api.group);
      st.api.dispose();
      notifyProxies();
      repaint();
    }
    function startProxy(cell, type, orient) {
      var k = cellKey(cell.x, cell.y);
      if (proxies[k]) endProxy(proxies[k]);
      var api = makeProxy(type, orient);
      if (!api) return null;
      var g = api.group;
      place(g, cell.x, cell.y);
      g.userData.basePos = g.position.clone();
      g.userData.baseAngle = g.rotation.y;
      overlay.add(g);
      var st = { k: k, cell: { x: cell.x, y: cell.y }, api: api, lift: 0, scale: 1, spin: 0, fade: 1, dead: false };
      proxies[k] = st;
      notifyProxies();
      return st;
    }
    function hasProxy(x, y) { return !!proxies[cellKey(x, y)]; }

    /* Pick up: 6 CSS px toward screen top, scale 1.04, over 100 ms. Identical screen displacement at every
     * terrain height because the world offset is derived from the orthographic world-per-pixel scale alone. */
    var pickupCell = null;
    /* A drop, a rotate or a removal ends the held piece outright: its proxy has been superseded by the committed
     * edit, so it is released rather than returned (returning it is what "Cancel drag" means, and only that). */
    function endPickup() {
      if (!pickupCell) return;
      var st = proxies[cellKey(pickupCell.x, pickupCell.y)];
      pickupCell = null;
      if (!st) return;
      if (motion) motion.cancel('placement.proxy:' + st.k);
      endProxy(st);
    }
    function setPickup(cell) {
      if (!cell) {
        if (!pickupCell) return;
        var was = pickupCell, st0 = proxies[cellKey(was.x, was.y)];
        pickupCell = null;
        if (!st0) return;
        if (!motion || reduced()) { endProxy(st0); return; }
        /* Cancel drag: back to the original screen anchor, exact base pose. It continues from the pose the player
         * can see (the registry hands the incumbent's displayed value to `from`), so a release part way through
         * the pick-up does not snap to full lift first. */
        run({
          key: 'placement.proxy:' + st0.k, role: 'presentation', surface: 'webgl',
          durationMs: ms(T.cancelMs), ease: theme.motion.easing.enter,
          from: function (displayed) { return (typeof displayed === 'number' && isFinite(displayed)) ? displayed : 1; }, to: 0,
          update: function (e, ctx) { st0.lift = T.liftPx * ctx.value; st0.scale = 1 + (T.pickupScale - 1) * ctx.value; },
          final: function () { endProxy(st0); }, fallback: function () { endProxy(st0); }, cancel: function () { endProxy(st0); }
        });
        return;
      }
      /* `cell` is { x, y, type, orient }: the piece the pointer has taken hold of. */
      if (pickupCell && pickupCell.x === cell.x && pickupCell.y === cell.y) return;
      setPickup(null);
      if (!motion || reduced()) { pickupCell = { x: cell.x, y: cell.y }; return; }
      var st = startProxy(cell, cell.type, cell.orient);
      if (!st) return;
      pickupCell = { x: cell.x, y: cell.y };
      run({
        key: 'placement.proxy:' + st.k, role: 'presentation', surface: 'webgl',
        durationMs: ms(T.pickupMs), ease: theme.motion.easing.enter,
        from: 0, to: 1,
        update: function (e, ctx) { st.lift = T.liftPx * ctx.value; st.scale = 1 + (T.pickupScale - 1) * ctx.value; },
        final: function () { st.lift = T.liftPx; st.scale = T.pickupScale; },
        fallback: function () { endProxy(st); },
        cancel: function () { endProxy(st); }
      });
    }

    /* Drop: from the 6 px lift and 1.04 scale to the seated pose over 140 ms, then the seating mark. */
    function drop(cell, type, orient) {
      endPickup();
      if (!motion) return;
      if (reduced()) { showSeat(cell, RED.contactHoldMs, false); return; }
      var st = startProxy(cell, type, orient);
      if (!st) return;
      st.lift = T.liftPx; st.scale = T.pickupScale;
      run({
        key: 'placement.proxy:' + st.k, role: 'presentation', surface: 'webgl',
        durationMs: ms(T.dropMs), ease: theme.motion.easing.enter,
        from: 1, to: 0,
        update: function (e, ctx) { st.lift = T.liftPx * ctx.value; st.scale = 1 + (T.pickupScale - 1) * ctx.value; },
        final: function () { endProxy(st); showSeat(cell, ms(T.seatMs), !decorCuts.rings); },
        fallback: function () { endProxy(st); },
        cancel: function () { endProxy(st); }
      });
    }

    /* Rotate: a true clockwise placement.rotateDeg about the piece's own centre, landing EXACTLY on the committed
     * pose. Starting at +rotateDeg and running to zero (rather than turning from the previous orientation to the
     * new one by the shorter way) is what makes every rotation identical: always clockwise, always the same arc,
     * and always ending on the angle the rules committed rather than half a turn away from it. */
    function rotate(cell, type, orient, flatPlate) {
      endPickup();
      if (!motion) return;
      /* A FLOOR plate's two orientations are the same object; turning it would promise an optical difference that
       * the rules do not have, so it is acknowledged with the seating mark instead (section 5, "FLOOR rotate"). */
      if (flatPlate) { showSeat(cell, motion.holdMs(T.floorAcknowledgeMs), false); return; }
      if (reduced()) return;
      var st = startProxy(cell, type, orient);
      if (!st) return;
      st.spin = SPIN;
      run({
        key: 'placement.proxy:' + st.k, role: 'presentation', surface: 'webgl',
        durationMs: ms(T.rotateMs), ease: theme.motion.easing.turn,
        from: 1, to: 0,
        update: function (e, ctx) { st.spin = SPIN * ctx.value; },
        final: function () { endProxy(st); }, fallback: function () { endProxy(st); }, cancel: function () { endProxy(st); }
      });
    }

    /* Remove: the simulation already dropped it. The proxy fades to zero and shrinks to 0.92 where it stood - it
     * never flies back to the tray, because that would draw a path across cells it was never on. */
    function remove(cell, type, orient) {
      endPickup();
      if (!motion || reduced()) return;
      var st = startProxy(cell, type, orient);
      if (!st) return;
      run({
        key: 'placement.proxy:' + st.k, role: 'presentation', surface: 'webgl',
        durationMs: ms(T.removeMs), ease: theme.motion.easing.exit,
        from: 1, to: 0,
        update: function (e, ctx) { st.fade = ctx.value; st.scale = T.removeScale + (1 - T.removeScale) * ctx.value; },
        final: function () { endProxy(st); }, fallback: function () { endProxy(st); }, cancel: function () { endProxy(st); }
      });
    }

    /* ---------------------------------------------------------------- per-frame application */
    /* The pose is carried as a SCALAR (CSS pixels of lift, a scale, an angle) and converted here, against the
     * live camera, so a zoom mid-animation keeps the displacement at exactly 6 CSS px and every terrain height
     * gets the same screen offset. In an orthographic camera world-units-per-CSS-pixel is 1 / effectiveZoom. */
    function frame(view, revealValue) {
      reveal = revealValue;
      if (view) lastView = view;
      var v = lastView, k, st, wpp;
      sweep();
      if (!v) return;
      wpp = v.zoom > 0 ? 1 / v.zoom : 0;
      up.set(0, 1, 0).applyQuaternion(v.quaternion);
      for (k in proxies) {
        if (!Object.prototype.hasOwnProperty.call(proxies, k)) continue;
        st = proxies[k];
        base.copy(st.api.group.userData.basePos);
        st.api.group.position.copy(base).addScaledVector(up, st.lift * wpp);
        st.api.group.scale.setScalar(st.scale);
        st.api.group.rotation.y = st.api.group.userData.baseAngle + st.spin;
        st.api.setOpacity(st.fade, reveal);
      }
    }

    /* ---------------------------------------------------------------- teardown */
    function clear() {
      var k;
      if (motion) {
        motion.cancel('placement.ghost'); motion.cancel('placement.seat'); motion.cancel('placement.seat.hold');
        motion.cancel('placement.invalid');
        for (k in proxies) if (Object.prototype.hasOwnProperty.call(proxies, k)) motion.cancel('placement.proxy:' + k);
      }
      for (k in proxies) if (Object.prototype.hasOwnProperty.call(proxies, k)) endProxy(proxies[k]);
      proxies = {}; live.length = 0; pickupCell = null; ghostAt = null;
      notifyProxies();
      clearSeat(); clearInvalid();
      ghost.visible = false; mats.ghost.opacity = 0;
    }
    function dispose() {
      clear();
      overlay.remove(ghost);
      if (overlay.parent) overlay.parent.remove(overlay);
      var g; for (g in geo) if (Object.prototype.hasOwnProperty.call(geo, g)) geo[g].dispose();
      mats.ghost.dispose(); mats.seat.dispose(); mats.invalid.dispose();
    }

    return {
      __version: 1,
      setMotion: function (m) { motion = m || null; },
      setDecorCuts: function (c) { if (c) decorCuts = c; },
      setGhost: setGhost, setPickup: setPickup, flashInvalid: flashInvalid,
      drop: drop, rotate: rotate, remove: remove,
      hasProxy: hasProxy, isAnimating: isAnimating, frame: frame, clear: clear, dispose: dispose
    };
  }

  root.LaserPlacementFx = { __version: 1, create: create };
}(typeof self !== 'undefined' ? self : this));
