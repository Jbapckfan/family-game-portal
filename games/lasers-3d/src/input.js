/* Lasers 3D - gesture arbitration and keyboard (INTERFACES-FRONTEND.md section 2, FROZEN).
 * Global: window.LaserInput (also CommonJS module.exports for node tests).
 * ES2019, Safari 15. Pointer Events (with a touch fallback ONLY when PointerEvent is missing).
 *
 * Gesture thresholds are the contract's frozen numbers; `theme.input` may override
 * them (same keys as DEFAULTS) so nothing is re-decided here.
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
    panMinPx: 0              /* two-finger midpoint travel before onPan starts (0 = immediately) */
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
          gg.mode = 'consumed';
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
      else if (gg.mode === 'orbit') call('onOrbitEnd');
      gg.mode = 'dead';   /* PAN ends silently: it has no start/end event */
    }
    function twoPointers() {
      var pts = [], id;
      for (id in pointers) if (Object.prototype.hasOwnProperty.call(pointers, id)) { pts.push(pointers[id]); if (pts.length === 2) break; }
      return pts.length === 2 ? pts : null;
    }
    function pinchDistance() { var p = twoPointers(); return p ? dist(p[0], p[1]) : 0; }
    function pinchMid() { var p = twoPointers(); return p ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : null; }
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
        pinchLastDist = pinchDistance();
        pinchLastMid = pinchMid();
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
        /* two fingers do BOTH at once, exactly as iOS map gestures do: the spread zooms, the midpoint pans. */
        if (pointerCount >= 2) {
          var d = pinchDistance(), mid = pinchMid();
          if (d > 0 && pinchLastDist > 0 && d !== pinchLastDist) call('onZoom', d / pinchLastDist);
          if (d > 0) pinchLastDist = d;
          if (mid && pinchLastMid) {
            var mdx = mid.x - pinchLastMid.x, mdy = mid.y - pinchLastMid.y;
            if ((mdx !== 0 || mdy !== 0) && Math.sqrt(mdx * mdx + mdy * mdy) >= cfg.panMinPx) { call('onPan', mdx, mdy); pinchLastMid = mid; }
          } else pinchLastMid = mid;
        }
        return;
      }
      if (id !== g.id) return;
      if (g.mode === 'pan') {
        var pdx = cur.x - g.last.x, pdy = cur.y - g.last.y;
        if (pdx !== 0 || pdy !== 0) call('onPan', pdx, pdy);
        g.last = cur;
        return;
      }
      if (g.mode === 'pending') {
        if (dist(g.p0, cur) < cfg.tapMaxPx) return;
        clearTimer(g);
        if (movable(g.piece0)) {
          g.mode = 'drag';
          call('onDragPiece', 'start', { from: g.cell0, piece: g.piece0 });
          call('onDragPiece', 'move', { from: g.cell0, piece: g.piece0, over: pick(cur.x, cur.y) });
          g.last = cur;
          return;
        }
        g.mode = 'orbit';
        call('onOrbitStart');
        /* fall through: first delta from the press point */
        g.last = g.p0;
      }
      if (g.mode === 'drag') {
        call('onDragPiece', 'move', { from: g.cell0, piece: g.piece0, over: pick(cur.x, cur.y) });
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
      releasePointer(id);
      if (!g) return;
      if (g.mode === 'pinch') {
        pinchEndedAt = now();
        g.mode = 'dead';            /* the remaining finger does nothing until it lifts */
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
    function onBlur() { spaceHeld = false; }

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
      pointers = {}; pointerCount = 0; pinchLastDist = 0; pinchLastMid = null; spaceHeld = false;
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
