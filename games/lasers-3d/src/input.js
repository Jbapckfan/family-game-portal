/* Lasers 3D - gesture arbitration and keyboard. CURRENT-RULES.md defines the touch contract.
 * Global: window.LaserInput (also CommonJS module.exports for node tests).
 * ES2019, Safari 15. Pointer Events (with a touch fallback ONLY when PointerEvent is missing).
 *
 * Touch: drag to pan, two-finger drag to orbit, pinch to zoom, hold then drag to move a piece.
 * Multi-touch samples share the host's frame scheduler so alternating pointer events cannot wobble the camera.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LaserInput = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    tapMaxPx: 10,            /* < 10 px movement = tap / long-press candidate */
    tapMaxMs: 300,           /* < 300 ms = tap */
    longPressMs: 500,        /* held on a movable piece with no movement */
    orbitRadPerPx: 0.0075,   /* azimuth and elevation, per CSS px */
    wheelStep: 1.1,          /* onZoom(1.1) or onZoom(1/1.1) per notch */
    pinchTapDebounceMs: 250, /* a tap whose pointerdown lands this soon after a pinch is ignored */
    twoFingerMinPx: 6,      /* intent threshold: ignore finger-placement jitter */
    twoFingerMinSeparationPx: 24,
    touchOrbitRadPerPx: 0.006
  };

  var KEY_ACTIONS = {
    ArrowUp: ['cursor', { dx: 0, dy: 1 }],
    ArrowDown: ['cursor', { dx: 0, dy: -1 }],
    ArrowLeft: ['cursor', { dx: -1, dy: 0 }],
    ArrowRight: ['cursor', { dx: 1, dy: 0 }],
    Enter: ['enter'],
    Delete: ['delete'], Backspace: ['delete'],
    f: ['fire'], t: ['tilt'], r: ['reset'], h: ['hint'], y: ['redo'],
    '0': ['fit'],
    Escape: ['escape'], Esc: ['escape']
  };

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function sameCell(a, b) { return a === b || (!!a && !!b && a.x === b.x && a.y === b.y); }

  function attach(opts) {
    opts = opts || {};
    var element = opts.element || null;
    var render = opts.render || null;
    var handlers = opts.handlers || {};
    var theme = opts.theme || null;
    var cfg = {}, k;
    for (k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
      cfg[k] = (theme && theme.input && typeof theme.input[k] === 'number') ? theme.input[k] : DEFAULTS[k];
    }
    var clock = opts.clock || {};
    var now = clock.now || (typeof performance !== 'undefined' && performance.now ? function () { return performance.now(); } : function () { return Date.now(); });
    var setT = clock.setTimeout || function (fn, ms) { return setTimeout(fn, ms); };
    var clearT = clock.clearTimeout || function (h) { clearTimeout(h); };

    var doc = opts.keyTarget || (element && element.ownerDocument) || (typeof document !== 'undefined' ? document : null);
    var view = (element && element.ownerDocument && element.ownerDocument.defaultView) || (typeof window !== 'undefined' ? window : null);
    var hasPointerEvents = typeof opts.hasPointerEvents === 'boolean' ? opts.hasPointerEvents : !!(view && typeof view.PointerEvent !== 'undefined');

    var enabled = true;
    var attached = false;
    var placedLookup = null;
    var cursorCell = null;
    var hoverCell = null;
    var pointers = {};          /* pointerId -> {x, y, type} */
    var pointerCount = 0;
    var g = null;               /* active gesture, see newGesture() */
    var pinchLastDist = 0;
    var pinchLastMid = null;
    var cameraPending = false;
    var pinchEndedAt = -Infinity;
    var spaceHeld = false;
    var listeners = [];

    function call(name, a, b) {
      var fn = handlers[name];
      if (typeof fn === 'function') return fn(a, b);
      return undefined;
    }
    function pick(x, y) {
      if (!render || typeof render.pickCell !== 'function') return null;
      var c = render.pickCell(x, y);
      return c ? { x: c.x, y: c.y } : null;
    }
    function lookup(cell) {
      if (!cell || typeof placedLookup !== 'function') return null;
      return placedLookup(cell) || null;
    }
    function movable(piece) { return !!piece && !piece.fixed; }

    /* ------------------------------------------------------------ gesture */
    function newGesture(id, p, type) {
      var cell0 = pick(p.x, p.y);
      var piece0 = lookup(cell0);
      var gg = { id: id, t0: now(), p0: { x: p.x, y: p.y }, last: { x: p.x, y: p.y }, type: type,
        cell0: cell0, piece0: piece0, mode: 'pending', timer: null };
      if (movable(piece0)) {
        gg.timer = setT(function () {
          gg.timer = null;
          if (g !== gg || gg.mode !== 'pending') return;
          gg.mode = type === 'touch' ? 'held' : 'consumed';
          call('onLongPressPiece', { x: cell0.x, y: cell0.y });
        }, cfg.longPressMs);
      }
      return gg;
    }
    function clearTimer(gg) { if (gg && gg.timer !== null) { clearT(gg.timer); gg.timer = null; } }
    function abortGesture(gg) {
      /* Cancel whatever is in flight without producing a tap. */
      if (!gg) return;
      clearTimer(gg);
      if (gg.mode === 'drag') call('onDragPiece', 'cancel', { from: gg.cell0, piece: gg.piece0 });
      else if (gg.mode === 'orbit' || gg.orbitStarted) { gg.orbitStarted = false; call('onOrbitEnd'); }
      cameraPending = false;
      gg.mode = 'dead';   /* PAN ends silently: it has no start/end event */
    }
    function twoPointers() {
      if (g && g.pair) return pointers[g.pair[0]] && pointers[g.pair[1]] ? [pointers[g.pair[0]], pointers[g.pair[1]]] : null;
      var pts = [], id;
      for (id in pointers) if (Object.prototype.hasOwnProperty.call(pointers, id)) { pts.push(pointers[id]); if (pts.length === 2) break; }
      return pts.length === 2 ? pts : null;
    }
    function pinchDistance() { var p = twoPointers(); return p ? dist(p[0], p[1]) : 0; }
    function pinchMid() { var p = twoPointers(); return p ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : null; }
    function rebasePair() {
      g.pair = null;
      var p = twoPointers();
      if (!p) return;
      g.pair = [p[0].id, p[1].id];
      g.pairStart = [{ x: p[0].x, y: p[0].y }, { x: p[1].x, y: p[1].y }];
      g.pairMid = pinchMid(); g.pairDist = pinchDistance(); g.pinchMode = null;
      pinchLastMid = g.pairMid; pinchLastDist = g.pairDist; cameraPending = false;
    }
    function queueCamera() {
      cameraPending = true;
      if (typeof opts.requestFrame === 'function') opts.requestFrame();
      else flush();
    }
    /* Called once by main before its render. Intent locks for this pair: a drifting pinch must not rotate the
     * board or consume FROM ABOVE eligibility. Releasing/replacing a finger gives the next gesture a fresh origin. */
    function flush() {
      if (!cameraPending) return;
      cameraPending = false;
      if (!enabled || !g || g.mode !== 'pinch') return;
      var p = twoPointers(), d = pinchDistance(), mid = pinchMid();
      if (!p || !mid) return;
      if (d < cfg.twoFingerMinSeparationPx || g.pairDist < cfg.twoFingerMinSeparationPx) { rebasePair(); return; }
      if (!g.pinchMode) {
        var travel = dist(mid, g.pairMid), spread = Math.abs(d - g.pairDist) / 2;
        if (spread >= cfg.twoFingerMinPx && spread >= travel * 0.7) g.pinchMode = 'zoom';
        else if (travel >= cfg.twoFingerMinPx && spread < travel * 0.7 &&
          dist(p[0], g.pairStart[0]) >= 3 && dist(p[1], g.pairStart[1]) >= 3) g.pinchMode = 'orbit';
        else return;
      }
      if (g.pinchMode === 'zoom') {
        if (d !== pinchLastDist) call('onZoom', d / pinchLastDist);
      } else {
        var dx = mid.x - pinchLastMid.x, dy = mid.y - pinchLastMid.y;
        if (dx || dy) {
          if (!g.orbitStarted) { g.orbitStarted = true; call('onOrbitStart'); }
          call('onOrbit', dx * cfg.touchOrbitRadPerPx, -dy * cfg.touchOrbitRadPerPx || 0);
        }
      }
      pinchLastDist = d; pinchLastMid = mid;
    }
    function setHover(cell) {
      if (sameCell(cell, hoverCell)) return;
      hoverCell = cell;
      call('onHover', cell);
    }

    function onDown(ev) {
      if (!enabled) return;
      var id = ev.pointerId, p = { id: id, x: ev.clientX, y: ev.clientY, type: ev.pointerType || 'mouse' };
      var isMouse = (ev.pointerType || 'mouse') === 'mouse', btn = typeof ev.button === 'number' ? ev.button : 0;
      /* desktop pan: middle-drag, or left-drag with Space held. Every other non-primary button is ignored. */
      var panDrag = isMouse && (btn === 1 || (btn === 0 && spaceHeld));
      if (isMouse && btn !== 0 && btn !== 1) return;
      try { if (element.setPointerCapture) element.setPointerCapture(id); } catch (e) { /* ignore */ }
      if (!Object.prototype.hasOwnProperty.call(pointers, id)) pointerCount++;
      pointers[id] = p;
      if (p.type === 'mouse') setHover(null);
      if (pointerCount === 1) {
        g = panDrag
          ? { id: id, t0: now(), p0: { x: p.x, y: p.y }, last: { x: p.x, y: p.y }, type: p.type, cell0: null, piece0: null, mode: 'pan', timer: null }
          : newGesture(id, p, p.type);
      } else if (pointerCount === 2) {
        if (g && g.mode !== 'pinch') abortGesture(g);
        if (!g) g = { id: id, mode: 'dead', cell0: null, piece0: null, timer: null };
        g.mode = 'pinch';
        rebasePair();
      }
      /* a third pointer is tracked but changes nothing */
    }

    function onMove(ev) {
      if (!enabled) return;
      var id = ev.pointerId, cur = { x: ev.clientX, y: ev.clientY };
      if (!Object.prototype.hasOwnProperty.call(pointers, id)) {
        /* fine pointer, no button held: hover only */
        if (ev.pointerType === 'mouse' && !ev.buttons && !g) setHover(pick(cur.x, cur.y));
        return;
      }
      pointers[id].x = cur.x; pointers[id].y = cur.y;
      if (!g) return;
      if (g.mode === 'pinch') {
        if (g.pair && g.pair.indexOf(id) >= 0) queueCamera();
        return;
      }
      if (id !== g.id) return;
      if (g.mode === 'pan') {
        var pdx = cur.x - g.last.x, pdy = cur.y - g.last.y;
        if (pdx !== 0 || pdy !== 0) call('onPan', pdx, pdy);
        g.last = cur;
        return;
      }
      if (g.mode === 'pending' || g.mode === 'held') {
        if (dist(g.p0, cur) < cfg.tapMaxPx) return;
        clearTimer(g);
        if (movable(g.piece0) && (g.type !== 'touch' || g.mode === 'held')) {
          g.mode = 'drag';
          call('onDragPiece', 'start', { from: g.cell0, piece: g.piece0 });
          call('onDragPiece', 'move', { from: g.cell0, piece: g.piece0, over: pick(cur.x, cur.y) });
          g.last = cur;
          return;
        }
        g.mode = g.type === 'touch' ? 'pan' : 'orbit';
        if (g.mode === 'orbit') call('onOrbitStart');
        /* fall through: first delta from the press point */
        g.last = g.p0;
      }
      if (g.mode === 'drag') {
        call('onDragPiece', 'move', { from: g.cell0, piece: g.piece0, over: pick(cur.x, cur.y) });
      } else if (g.mode === 'pan') {
        call('onPan', cur.x - g.last.x, cur.y - g.last.y);
      } else if (g.mode === 'orbit') {
        var dx = cur.x - g.last.x, dy = cur.y - g.last.y;
        if (dx !== 0 || dy !== 0) call('onOrbit', dx * cfg.orbitRadPerPx, (0 - dy) * cfg.orbitRadPerPx || 0);
      }
      g.last = cur;
    }

    function releasePointer(id) {
      try { if (element.releasePointerCapture && (!element.hasPointerCapture || element.hasPointerCapture(id))) element.releasePointerCapture(id); } catch (e) { /* ignore */ }
      if (Object.prototype.hasOwnProperty.call(pointers, id)) { delete pointers[id]; pointerCount--; }
    }

    function finish(ev, cancelled) {
      var id = ev.pointerId;
      if (!Object.prototype.hasOwnProperty.call(pointers, id)) { releasePointer(id); return; }
      var pairMember = g && g.mode === 'pinch' && g.pair && g.pair.indexOf(id) >= 0;
      if (pairMember) { if (cancelled) cameraPending = false; else flush(); }
      releasePointer(id);
      if (!g) return;
      if (g.mode === 'pinch') {
        if (!pairMember) return;    /* a third finger lifting does not interrupt the active pair */
        pinchEndedAt = now();
        if (pointerCount >= 2) { rebasePair(); return; }
        if (g.orbitStarted) { g.orbitStarted = false; call('onOrbitEnd'); }
        g.mode = 'dead';
        if (pointerCount === 1) {
          var remaining = pointers[Object.keys(pointers)[0]];
          g = { id: remaining.id, type: remaining.type, mode: cancelled ? 'dead' : 'pan',
            last: { x: remaining.x, y: remaining.y }, timer: null, cell0: null, piece0: null };
          return;                 /* continue panning from here; this contact can never become an edit/tap */
        }
      }
      if (pointerCount === 0) { endPrimary(ev, cancelled); g = null; return; }
      if (id === g.id && g.mode !== 'dead') { endPrimary(ev, cancelled); g.mode = 'dead'; }
    }

    function endPrimary(ev, cancelled) {
      clearTimer(g);
      var mode = g.mode;
      if (mode === 'drag') {
        if (cancelled) call('onDragPiece', 'cancel', { from: g.cell0, piece: g.piece0 });
        else call('onDragPiece', 'end', { from: g.cell0, piece: g.piece0, to: pick(ev.clientX, ev.clientY) });
      } else if (mode === 'orbit') {
        call('onOrbitEnd');
      } else if (mode === 'pending' && !cancelled) {
        var held = now() - g.t0;
        var moved = dist(g.p0, { x: ev.clientX, y: ev.clientY });
        var afterPinch = (g.t0 - pinchEndedAt) < cfg.pinchTapDebounceMs;
        if (held < cfg.tapMaxMs && moved < cfg.tapMaxPx && !afterPinch) {
          if (g.cell0) call('onTapCell', { x: g.cell0.x, y: g.cell0.y, pointerType: g.type });
          else call('onTapEmpty', { pointerType: g.type });
        }
      }
      g.mode = 'dead';
    }

    function onUp(ev) { if (enabled) finish(ev, false); else releasePointer(ev.pointerId); }
    function onCancel(ev) { if (enabled) finish(ev, true); else releasePointer(ev.pointerId); }
    function onLeave(ev) {
      if (!enabled || ev.pointerType !== 'mouse') return;
      if (!Object.prototype.hasOwnProperty.call(pointers, ev.pointerId)) setHover(null);
    }

    function onWheel(ev) {
      if (!enabled) return;
      if (ev.preventDefault) ev.preventDefault();
      var dy = ev.deltaY || 0;
      if (dy === 0) return;
      call('onZoom', dy < 0 ? cfg.wheelStep : 1 / cfg.wheelStep);
    }

    /* ---------------------------------------------- touch fallback (no PointerEvent) */
    function synth(t, type) { return { pointerId: t.identifier, clientX: t.clientX, clientY: t.clientY, pointerType: 'touch', buttons: 1, button: 0 }; }
    function eachChanged(ev, fn) { var list = ev.changedTouches || [], i; for (i = 0; i < list.length; i++) fn(synth(list[i])); }
    function onTouchStart(ev) {
      if (enabled && ev.preventDefault && (ev.touches && ev.touches.length >= 2)) ev.preventDefault();
      if (!hasPointerEvents) eachChanged(ev, onDown);
    }
    function onTouchMove(ev) {
      /* block page scroll / rubber-banding while any gesture is in flight */
      if (enabled && ev.preventDefault && (g || pointerCount > 0)) ev.preventDefault();
      if (!hasPointerEvents) eachChanged(ev, onMove);
    }
    function onTouchEnd(ev) { if (!hasPointerEvents) eachChanged(ev, onUp); }
    function onTouchCancel(ev) { if (!hasPointerEvents) eachChanged(ev, onCancel); }
    function onGesture(ev) { if (ev.preventDefault) ev.preventDefault(); }
    function onContextMenu(ev) { if (ev.preventDefault) ev.preventDefault(); }

    /* ---------------------------------------------------------------- keys */
    function editableTarget(t) {
      if (!t) return false;
      var tag = (t.tagName || '').toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || t.isContentEditable === true;
    }
    function onKeyDown(ev) {
      if (!enabled || editableTarget(ev.target)) return;
      var key = ev.key || '';
      var mod = !!(ev.metaKey || ev.ctrlKey);
      var lower = key.length === 1 ? key.toLowerCase() : key;
      if (mod) {
        if (lower !== 'z' || ev.altKey) return;   /* never preventDefault other modifier combos */
        if (ev.preventDefault) ev.preventDefault();
        call('onKey', ev.shiftKey ? 'redo' : 'undo');
        return;
      }
      if (ev.altKey) return;
      var action = null, payload;
      if (lower === 'z') { action = ev.shiftKey ? 'redo' : 'undo'; }
      else if (key.length === 1 && key >= '1' && key <= '9') { action = 'select'; payload = { index: key.charCodeAt(0) - 48 }; }
      else {
        var entry = KEY_ACTIONS[lower] || KEY_ACTIONS[key];
        if (entry) { action = entry[0]; if (entry[1]) payload = { dx: entry[1].dx, dy: entry[1].dy }; }
      }
      if (!action) return;
      if (ev.preventDefault) ev.preventDefault();
      call('onKey', action, payload);
    }
    /* Space only arms panning; Enter activates the cursor. */
    function onKeyDownSpace(ev) { if (enabled && (ev.key === ' ' || ev.key === 'Spacebar') && !editableTarget(ev.target)) { spaceHeld = true; ev.preventDefault(); } }
    function onKeyUpSpace(ev) { if (ev.key === ' ' || ev.key === 'Spacebar') spaceHeld = false; }
    function onBlur() { resetAll(); }

    /* --------------------------------------------------------------- wiring */
    function on(target, type, fn, options) {
      if (!target || typeof target.addEventListener !== 'function') return;
      target.addEventListener(type, fn, options);
      listeners.push([target, type, fn, options]);
    }
    function wire() {
      if (attached || !element) return;
      attached = true;
      if (element.style) {
        element.style.touchAction = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.userSelect = 'none';
        element.style.webkitTouchCallout = 'none';
        element.style.webkitTapHighlightColor = 'transparent';
      }
      var passive = { passive: true }, active = { passive: false };
      if (hasPointerEvents) {
        on(element, 'pointerdown', onDown, passive);
        on(element, 'pointermove', onMove, passive);
        on(element, 'pointerup', onUp, passive);
        on(element, 'pointercancel', onCancel, passive);
        on(element, 'lostpointercapture', onCancel, passive);
        on(element, 'pointerleave', onLeave, passive);
      }
      on(element, 'touchstart', onTouchStart, active);
      on(element, 'touchmove', onTouchMove, active);
      on(element, 'touchend', onTouchEnd, passive);
      on(element, 'touchcancel', onTouchCancel, passive);
      on(element, 'gesturestart', onGesture, active);
      on(element, 'gesturechange', onGesture, active);
      on(element, 'wheel', onWheel, active);
      on(element, 'contextmenu', onContextMenu, active);
      on(doc, 'keydown', onKeyDown, active);
      on(doc, 'keydown', onKeyDownSpace, active);
      on(doc, 'keyup', onKeyUpSpace, passive);
      if (view) on(view, 'blur', onBlur, passive);
    }
    function resetAll() {
      abortGesture(g);
      g = null;
      var id, ids = [];
      for (id in pointers) if (Object.prototype.hasOwnProperty.call(pointers, id)) ids.push(pointers[id].id);
      for (id = 0; id < ids.length; id++) releasePointer(ids[id]);
      pointers = {}; pointerCount = 0; pinchLastDist = 0; pinchLastMid = null; cameraPending = false; spaceHeld = false;
      setHover(null);
    }

    var api = {
      __version: 1,
      setEnabled: function (on_) {
        var next = !!on_;
        if (enabled === next) return;
        enabled = next;
        if (!enabled) resetAll();
      },
      isEnabled: function () { return enabled; },
      setPlacedLookup: function (fn) { placedLookup = typeof fn === 'function' ? fn : null; },
      setCursor: function (cell) { cursorCell = cell ? { x: cell.x, y: cell.y } : null; },
      getCursor: function () { return cursorCell; },
      getGesture: function () { return g ? g.mode : 'none'; },
      config: cfg,
      flush: flush,
      detach: function () {
        if (!attached) return;
        resetAll();
        var i;
        for (i = 0; i < listeners.length; i++) {
          var l = listeners[i];
          try { l[0].removeEventListener(l[1], l[2], l[3]); } catch (e) { /* ignore */ }
        }
        listeners = [];
        attached = false;
      }
    };
    wire();
    return api;
  }

  return { attach: attach, DEFAULTS: DEFAULTS, __version: 1 };
}));
