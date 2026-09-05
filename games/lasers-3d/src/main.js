/* Lasers 3D - integrator (INTERFACES-FRONTEND.md section 5).
 * Global: window.LaserMain. Classic script, ES2019 (Safari 15). Wires sim, render, input, ui and audio;
 * owns the level state, the state machine (idle -> placing -> tracing -> placing|won), undo/redo,
 * stars + progress (DESIGN.md 3.6), the free reveal (levels 4 and 5), the hint and the frame loop.
 * Test hooks: window.__lasers3d = app (contract) and window.__laser = { main, render, sim, ui }.
 */
(function (root) {
  'use strict';
  var REVEAL_LEVELS = { 3: true, 4: true };   /* 0-based: levels 4 and 5 play the free reveal once */
  /* DESIGN.md 15: the alphabet the discovered set is packed into, four cells per character. Module scope, not
   * start()'s: everything after start()'s `return finishApp()` is a hoisted function DECLARATION, so a `var`
   * initialiser down there is hoisted to undefined and never assigned. */
  var HEX = '0123456789abcdef';

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function sameCell(a, b) { return !!a && !!b && a.x === b.x && a.y === b.y; }
  function now() { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); }

  function start(opts) {
    opts = opts || {};
    var theme = root.LaserTheme, sim = root.LaserSim, Pieces = root.LaserPieces, Trace = root.LaserMainTrace;
    /* The piece set is the registry's. Everything that used to be a literal ['MIRROR', 'WEDGE', 'DIP'] in here -
     * the tray count, the number keys - reads it, so a fourth piece (DESIGN.md 14) or a fifth needs no edit. */
    var TYPES = (Pieces && Pieces.TYPES && Pieces.TYPES.length) ? Pieces.TYPES.slice() : ['MIRROR', 'WEDGE', 'DIP'];
    var LEVELS = root.LASER_LEVELS || root.LEVELS || [];
    var rootEl = opts.root || document.getElementById('app'), canvas = opts.canvas || document.getElementById('board');
    var reducedMotion = !!(root.matchMedia && theme.reducedMotion && root.matchMedia(theme.reducedMotion.mediaQuery).matches);
    var render = null, input = null, ui = null, audio = null, progress = null, cam = null;
    var S = { levelIndex: 0, level: null, solution: null, placed: [], history: [], future: [], selectedTray: null, selectedCell: null, cursorCell: null,
      fires: 0, tiltsUsed: 0, hintUsed: false, result: null, status: 'idle', isFlat: true, canFit: false, viewToggle: null, revealPlaying: false,
      resetting: false, readout: null, traceStartedAt: 0,
      placedDirty: false, fireDirty: false, cues: [], drag: null, hintGhost: null, hintTimer: null, pendingIntro: null, camDirty: false,
      version: 0, pushed: -1, nudged: false, dirty: true, frames: 0,
      /* DESIGN.md 15: fog of war. `known` is the level's whole discovered set, `discoveries` the queue a shot is
       * still paying out as its beam travels, `knownDirty` whether the set has moved since it was last saved. */
      dark: false, known: null, discoveries: [], knownDirty: false };
    var resetToken = 0, victoryTimer = null, rafId = 0, last = 0, destroyed = false, docListeners = [];

    /* Dirty rendering (S13): a WebGL frame every 16 ms for ever, on a phone, for a board that is not moving, is
     * pure battery. Frames are scheduled on demand instead - markDirty() on any change, then the loop re-schedules
     * itself while render.needsFrame() reports a live animation - and never while the document is hidden. Every
     * state change funnels through bump(), which marks dirty. */
    function markDirty() { S.dirty = true; requestFrame(); }
    function requestFrame() {
      if (destroyed || rafId) return;
      if (document.hidden) return;   /* resumed by onVisibility */
      rafId = requestAnimationFrame(loop);
    }
    function bump() { S.version++; markDirty(); }
    function play(name) { if (audio) audio.play(name); }
    function busy() { return S.status === 'tracing' || S.revealPlaying || S.resetting || (ui && ui.isModalOpen()); }
    /* Exclusive camera choreography: the free reveal and RESET's return to flat. Controls that could cancel them
     * (level change, modals, TILT, RESET) are disabled for the duration (S4, S6). */
    function locked() { return S.revealPlaying || S.resetting; }
    function scaleMs(ms) { return reducedMotion ? Math.round(ms * theme.reducedMotion.durationScale) : ms; }
    function holdMs(ms) { return reducedMotion ? Math.min(ms, theme.reducedMotion.maxHoldMs) : ms; }
    function pieceAt(cell) { for (var i = 0; i < S.placed.length; i++) if (S.placed[i].x === cell.x && S.placed[i].y === cell.y) return S.placed[i]; return null; }
    function fixedAt(cell) { var f = S.level ? S.level.fixed : [], i; for (i = 0; i < f.length; i++) if (f[i].x === cell.x && f[i].y === cell.y) return f[i]; return null; }
    function remaining() {
      var r = {}, i;
      for (i = 0; i < TYPES.length; i++) r[TYPES[i]] = 0;
      if (!S.level) return r;
      for (i = 0; i < S.level.tray.length; i++) if (r[S.level.tray[i]] !== undefined) r[S.level.tray[i]]++;
      for (i = 0; i < S.placed.length; i++) if (r[S.placed[i].type] !== undefined) r[S.placed[i].type]--;
      return r;
    }
    function trayTotal() { var r = remaining(), n = 0, k; for (k in r) if (Object.prototype.hasOwnProperty.call(r, k)) n += r[k]; return n; }
    /* Three INDEPENDENT criteria, never an ordinal count (S3): a hinted blind solve earns solve + blind, not "2". */
    function attemptStars() {
      return { solved: true, par: !!(S.level && S.placed.length <= S.level.par && !S.hintUsed), blind: S.tiltsUsed === 0 };
    }
    function canPlaceExcluding(from, to) {
      var others = S.placed.filter(function (p) { return !sameCell(p, from); });
      return sim.canPlace(S.level, others, to.x, to.y);
    }
    function syncInput() { if (input) input.setEnabled(!busy()); }
    /* A per-level flag bag inside progress (`intros`, `revealed`): always a plain object, whatever storage held. */
    function bag(name) {
      var b = progress[name];
      if (!b || typeof b !== 'object' || Array.isArray(b)) { b = {}; progress[name] = b; }
      return b;
    }

    /* ---------------------------------------------------------- boot */
    try {
      if (!root.THREE || !root.LaserRender) throw new Error('webgl-unavailable');
      render = root.LaserRender.create({ canvas: canvas, theme: theme, sim: sim });
    } catch (e) { render = null; }
    if (root.LaserAudio) audio = root.LaserAudio.create({ theme: theme });
    ui = root.LaserUI.create({ root: rootEl, theme: theme, render: render, levels: LEVELS, handlers: {
      onTraySelect: onTraySelect, onFire: fire, onReset: reset, onTiltToggle: tilt, onHint: hint, onUndo: undo, onRedo: redo,
      onSoundToggle: toggleSound, onRotateSelected: function () { if (S.selectedCell) rotateAt(S.selectedCell); },
      onRemoveSelected: function () { if (S.selectedCell) removeAt(S.selectedCell); },
      onSelectLevel: function (i) { loadLevel(i); }, onNextLevel: nextLevel, onRetryLevel: reset, onFit: fitBoard,
      /* Returning false vetoes the modal: nothing may interrupt the one-time free reveal (S6). */
      onLevels: function () { return locked() ? false : undefined; }, onHelp: function () { return locked() ? false : undefined; },
      onModalOpen: function () { syncInput(); markDirty(); }, onModalClose: function () { syncInput(); flushIntro(); markDirty(); },
      onStageResize: function (info) { if (render) render.resize(info.width, info.height, info.dpr); S.camDirty = true; markDirty(); }
    } });
    progress = ui.loadProgress();
    if (!progress.stars || typeof progress.stars !== 'object') progress.stars = {};
    if (audio) audio.setMuted(!!progress.muted);
    if (!render) {
      ui.showWebGLFallback();
      return finishApp();
    }
    render.setReducedMotion(reducedMotion);
    cam = root.LaserMainCamera.create({ theme: theme, render: render, hold: holdMs, play: play, dirty: markDirty,
      alive: function () { return !destroyed; } });
    input = root.LaserInput.attach({ element: canvas, render: render, theme: theme, handlers: {
      onTapCell: onTapCell, onTapEmpty: function () { clearSelection(); }, onDragPiece: onDragPiece,
      onOrbitStart: function () { if (locked()) return; S.tiltsUsed++; clearSelection(); bump(); },
      onOrbit: function (dAz, dEl) { if (locked()) return; render.orbit(dAz, dEl); S.camDirty = true; markDirty(); },
      onOrbitEnd: function () { S.camDirty = true; markDirty(); },
      onZoom: function (f) { render.zoom(f); S.camDirty = true; bump(); },
      onPan: function (dx, dy) { render.pan(dx, dy); S.camDirty = true; bump(); },
      onLongPressPiece: function (c) { if (!busy() && pieceAt(c)) select({ x: c.x, y: c.y }); },
      onHover: function (c) { render.setHover(c); markDirty(); }, onKey: onKey
    } });
    input.setPlacedLookup(function (cell) { return pieceAt(cell); });
    function unlockAudio() { if (audio) audio.unlock(); }
    /* S8: a tap or any key finishes the beam animation at once. Board input is off while tracing, so this listens
     * on the document; the grace window stops the gesture (or `f` keypress) that FIRED from skipping its own beam. */
    function skipTrace() {
      if (S.status !== 'tracing' || !render) return;
      if (now() - S.traceStartedAt < theme.beam.travel.skipGraceMs) return;
      render.finishBeam(); markDirty();
    }
    function onVisibility() {
      if (document.hidden) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } return; }
      last = 0; markDirty();
    }
    [['pointerdown', unlockAudio], ['keydown', unlockAudio], ['touchend', unlockAudio],
      ['pointerdown', skipTrace], ['keydown', skipTrace], ['touchstart', skipTrace],
      ['visibilitychange', onVisibility]].forEach(function (l) { document.addEventListener(l[0], l[1], { passive: true }); docListeners.push(l); });

    var startIndex = Math.min(Math.max(0, progress.currentLevel | 0), Math.max(0, LEVELS.length - 1));
    if (startIndex > (progress.highestUnlocked | 0)) startIndex = progress.highestUnlocked | 0;
    if (!loadLevel(startIndex)) loadLevel(0);
    syncInput();
    markDirty();
    return finishApp();

    function finishApp() {
      var app = { state: S, sim: sim, render: render, input: input, ui: ui, audio: audio, theme: theme, levels: LEVELS,
        loadLevel: loadLevel, fire: fire, reset: reset, undo: undo, redo: redo, hint: hint, tilt: tilt, setPlaced: setPlaced,
        /* DESIGN.md 15 test/debug surface: the level's discovered set and a way to grow it without firing. */
        knownList: knownList, learnCells: learnCells, saveKnown: saveKnown,
        getViewModel: getViewModel, getProgress: function () { return progress; }, step: step, destroy: destroy, __version: 1 };
      root.__lasers3d = app;
      root.__laser = { main: app, render: render, sim: sim, ui: ui, input: input, audio: audio };
      return app;
    }

    /* ------------------------------------------------- darkness (DESIGN.md 15) */
    /* A level may carry `dark: true`. On such a level the board's terrain, pieces, targets and openings are not
     * drawn until a beam has been in the cell; the grid outline always is, so the board's extent and every tap
     * target stay visible. main owns WHAT is known - it is game state, the renderer only owns how it arrives.
     *
     * THE SET IS A BITMASK, ONE BYTE PER CELL, and it is:
     *   seeded  with the emitter's cell and every target's cell (15.1: a puzzle whose goal you cannot see is a
     *           maze, not a puzzle);
     *   grown   only ever grown, one cell at a time, as the travelling beam head reaches each cell's centre;
     *   kept    across RESET (resetAttempt deliberately does not touch it) and across leaving and re-entering the
     *           level, because 15.1 calls re-learning a board tedium rather than difficulty;
     *   SAVED   to the same progress record that already holds stars, seen intros and consumed reveals.
     *
     * The save is the one call this file makes that 15.1 does not spell out, so here is the reasoning: a page
     * reload is the strongest form of "leaving and re-entering the level", and the rule it would otherwise break is
     * the one written in the spec's own voice - fog of war, not punishment. A child who closes the tab and comes
     * back to a 24x24 board should not have to re-survey it. Everything else in this game that costs the player
     * time to earn already survives a reload; discovery is no different.
     *
     * A saved mask is only restored when the level it was saved for is still THAT level: the record carries the
     * board's size and a fingerprint of its terrain, emitter and targets, and a mismatch is discarded silently.
     * The level set is regenerated from the solver, so index 17 is not a stable identity and a stale mask would
     * un-hide a board the player has never actually seen. */
    function levelIsDark(parsed, raw) {
      /* The `dark` flag is the ENGINE's to validate and carry (parseLevel), and this is the seam between the two
       * modules, so read the parsed level first and fall back to the raw one - the same tolerance the renderer's
       * `openings` adapter uses, and for the same reason. */
      if (parsed && parsed.dark !== undefined) return !!parsed.dark;
      return !!(raw && raw.dark);
    }
    /* FNV-1a over everything that makes this board THIS board. Cheap, stable across sessions, and it changes the
     * moment the generator moves a wall. */
    function fingerprint(parsed) {
      var str = parsed.size.w + 'x' + parsed.size.d + '|', h = 0x811c9dc5, i;
      for (i = 0; i < parsed.t.length; i++) str += parsed.t[i].join('') + ';';
      str += '|' + parsed.emitter.x + ',' + parsed.emitter.y + ',' + parsed.emitter.dir + '|';
      for (i = 0; i < parsed.targets.length; i++) str += parsed.targets[i].x + ',' + parsed.targets[i].y + ';';
      for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
      return h.toString(36);
    }
    function packKnown(mask, n) {
      var out = '', i, v;
      for (i = 0; i < n; i += 4) {
        v = (mask[i] ? 1 : 0) | (mask[i + 1] ? 2 : 0) | (mask[i + 2] ? 4 : 0) | (mask[i + 3] ? 8 : 0);
        out += HEX.charAt(v);
      }
      return out;
    }
    function unpackKnown(str, n) {
      var mask = new Uint8Array(n), i, v, k;
      if (typeof str !== 'string') return mask;
      for (i = 0; i < n; i += 4) {
        v = HEX.indexOf(str.charAt(i >> 2));
        if (v < 0) continue;
        for (k = 0; k < 4 && i + k < n; k++) mask[i + k] = (v >> k) & 1;
      }
      return mask;
    }
    function countMask(mask) { var n = 0, i; for (i = 0; i < mask.length; i++) if (mask[i]) n++; return n; }
    /* Build (or restore) this level's known set. Always returns a usable record, even with no save and no storage. */
    function makeKnown(parsed) {
      var w = parsed.size.w, d = parsed.size.d, n = w * d, fp = fingerprint(parsed);
      var rec = bag('known')[String(S.levelIndex)], mask = null, i;
      if (rec && typeof rec === 'object' && rec.w === w && rec.d === d && rec.f === fp) mask = unpackKnown(rec.b, n);
      if (!mask) mask = new Uint8Array(n);
      mask[parsed.emitter.y * w + parsed.emitter.x] = 1;                       /* 15.1: known from the start */
      for (i = 0; i < parsed.targets.length; i++) mask[parsed.targets[i].y * w + parsed.targets[i].x] = 1;
      return { w: w, d: d, f: fp, cells: mask, count: countMask(mask) };
    }
    function knownList() {
      var out = [], K = S.known, x, y;
      if (!K) return out;
      for (y = 0; y < K.d; y++) for (x = 0; x < K.w; x++) if (K.cells[y * K.w + x]) out.push({ x: x, y: y });
      return out;
    }
    /* Push the whole set to the renderer at once, with no arrival animation: a level that opened by easing thirty
     * cells in would read as a title card rather than as a board. */
    function applyDarkness() {
      if (!render) return;
      render.setDarkness({ dark: S.dark, known: S.dark ? knownList() : null });
    }
    function learnCells(cells) {
      if (!S.dark || !S.known || !cells || !cells.length) return;
      var fresh = [], K = S.known, i, c, idx;
      for (i = 0; i < cells.length; i++) {
        c = cells[i];
        if (!c || c.x < 0 || c.y < 0 || c.x >= K.w || c.y >= K.d) continue;
        idx = c.y * K.w + c.x;
        if (K.cells[idx]) continue;
        K.cells[idx] = 1; K.count++;
        fresh.push({ x: c.x, y: c.y });
      }
      if (!fresh.length) return;
      if (render) render.revealCells(fresh);      /* the renderer eases each one in; main only says WHICH */
      S.knownDirty = true;
      bump();
    }
    /* Saved once a shot is over rather than once per cell: a 40-cell beam would otherwise serialise the board forty
     * times while the animation was still playing. */
    function saveKnown() {
      if (!S.knownDirty || !S.known) return;
      S.knownDirty = false;
      var K = S.known;
      bag('known')[String(S.levelIndex)] = { w: K.w, d: K.d, f: K.f, b: packKnown(K.cells, K.w * K.d) };
      ui.saveProgress(progress);
    }
    /* Everything the CURRENT shot still has to teach, drained as the beam head passes each cell (15.2: a shot is an
     * expedition, so the board opens along the beam rather than all at once when the trigger is pulled). */
    function drainDiscoveries(upTo) {
      if (!S.discoveries.length) return;
      var take = [];
      while (S.discoveries.length && S.discoveries[0].dist <= upTo + 1e-6) take.push(S.discoveries.shift());
      learnCells(take);
    }

    /* ------------------------------------------------------- levels */
    function loadLevel(index) {
      if (typeof index !== 'number' || index < 0 || index >= LEVELS.length) return false;
      /* S6: the free reveal is exclusive. A level change during it would cancel the lesson, and the lesson only
       * plays once, so it would be lost for good. */
      if (S.revealPlaying) return false;
      var raw = LEVELS[index], parsed;
      try { parsed = sim.parseLevel(raw); }
      catch (e) { console.warn('lasers-3d: level ' + (index + 1) + ' skipped: ' + (e && e.message)); return loadLevel(index + 1); }
      cancelReveal(); cancelReset(); cancelHint(); S.drag = null;
      if (victoryTimer) { clearTimeout(victoryTimer); victoryTimer = null; }
      if (audio) audio.stop('travel');   /* a level change mid-FIRE must not leave the travel loop droning */
      saveKnown();                       /* a level change mid-shot must not lose what that shot already taught */
      S.levelIndex = index; S.level = parsed; S.solution = Array.isArray(raw.solution) && raw.solution.length ? clone(raw.solution) : null;
      resetAttempt();
      S.cursorCell = null; S.nudged = false;
      /* DESIGN.md 15: the fog is decided BEFORE anything is drawn, and restored from the save, so a level the
       * player has already surveyed opens showing what they surveyed rather than flashing a dark board first. */
      S.dark = levelIsDark(parsed, raw);
      S.known = makeKnown(parsed);
      S.knownDirty = false;
      if (render) {
        render.setLevel(parsed); applyDarkness(); render.setCameraPreset('flat', { animate: false });
        render.setSelection(null); render.setGhost(null); render.setCursor(null); render.setHover(null);
      }
      if (input) input.setCursor(null);
      progress.currentLevel = index; ui.saveProgress(progress);
      S.placedDirty = true; S.isFlat = true;
      queueIntro(parsed.intro);
      syncInput(); bump();
      return true;
    }
    function nextLevel() { if (!loadLevel(S.levelIndex + 1)) ui.showLevelSelect(); }
    /* Note what is NOT here: S.known. DESIGN.md 15.1 - "RESET keeps what is known" - so discovery is not part of an
     * attempt at all, it is part of the level. The in-flight `discoveries` queue IS cleared: it belongs to a shot
     * that is being abandoned, and anything it had already paid out is in S.known already. */
    function resetAttempt() {
      S.placed = []; S.history = []; S.future = []; S.fires = 0; S.tiltsUsed = 0; S.hintUsed = false; S.status = 'idle';
      S.result = null; S.selectedTray = null; S.selectedCell = null; S.cues = []; S.fireDirty = false; S.readout = null;
      S.discoveries = [];
      ui.hidePieceControls();
    }
    /* S4: RESET used to zero tiltsUsed and re-enable input while the camera was still swinging back from tilted,
     * so a player could act on a visibly tilted board during an attempt that still counted as blind. The new
     * attempt now starts only once the camera has settled flat, and the counters are cleared again at the end so
     * the return move itself can never cost the blind star. */
    function reset() {
      if (S.revealPlaying) return;
      cancelReset(); cancelHint(); S.drag = null;
      if (victoryTimer) { clearTimeout(victoryTimer); victoryTimer = null; }
      if (audio) audio.stop('travel');
      resetAttempt();
      if (render) { render.setBeam(null); render.setSelection(null); render.setGhost(null); }
      S.placedDirty = true; play('ui');
      if (render && !render.isFlat()) {
        var token = ++resetToken;
        S.resetting = true; syncInput(); bump();
        render.setCameraPreset('flat', { animate: true }).then(function () {
          if (destroyed || token !== resetToken) return;
          S.resetting = false;
          resetAttempt();               /* the camera move must not leave a tilt on the new attempt's record */
          S.placedDirty = true; S.camDirty = true;
          syncInput(); bump();
        });
      } else {
        if (render) render.setCameraPreset('flat', { animate: false });
        S.camDirty = true; syncInput(); bump();
      }
    }
    function cancelReset() { resetToken++; if (S.resetting) { S.resetting = false; syncInput(); bump(); } }
    function queueIntro(text) {
      S.pendingIntro = null;
      if (!text) return;
      var key = String(S.levelIndex);
      if (bag('intros')[key]) return;
      S.pendingIntro = text; flushIntro();
    }
    function flushIntro() {
      if (!S.pendingIntro || ui.isModalOpen()) return;
      var text = S.pendingIntro; S.pendingIntro = null;
      ui.showToast(text, { kind: 'intro', ms: Math.max(theme.ui.toastMs, 45 * text.length) });
      bag('intros')[String(S.levelIndex)] = true; ui.saveProgress(progress);
    }

    /* -------------------------------------------------------- edits */
    function commit(nextPlaced, sound) {
      S.history.push(clone(S.placed)); S.future = []; S.placed = nextPlaced;
      if (S.status !== 'tracing') S.status = 'placing';
      S.readout = null;   /* the readout describes the last FIRE; an edit makes it stale */
      S.placedDirty = true; if (sound) play(sound); bump();
    }
    function placeAt(cell, type) {
      if (busy() || !type) return false;
      if (remaining()[type] <= 0 || !sim.canPlace(S.level, S.placed, cell.x, cell.y)) { ui.flashInvalid('cell'); play('invalid'); return false; }
      var next = clone(S.placed); next.push({ x: cell.x, y: cell.y, type: type, orient: '/' });
      commit(next, 'place');
      if (remaining()[type] <= 0) S.selectedTray = null;
      clearSelection(); refreshGhost();
      return true;
    }
    function rotateAt(cell) {
      if (busy() || !pieceAt(cell)) return;
      var next = clone(S.placed);
      next.forEach(function (p) { if (sameCell(p, cell)) p.orient = Pieces.rotate(p.orient); });
      commit(next, 'rotate');
    }
    function removeAt(cell) {
      if (busy() || !pieceAt(cell)) return;
      commit(S.placed.filter(function (p) { return !sameCell(p, cell); }), 'remove');
      clearSelection(); refreshGhost();
    }
    function movePiece(from, to) {
      var next = clone(S.placed);
      next.forEach(function (p) { if (sameCell(p, from)) { p.x = to.x; p.y = to.y; } });
      commit(next, 'place');
    }
    function undo() { if (busy() || !S.history.length) return; S.future.push(clone(S.placed)); S.placed = S.history.pop(); afterHistory(); }
    function redo() { if (busy() || !S.future.length) return; S.history.push(clone(S.placed)); S.placed = S.future.pop(); afterHistory(); }
    function afterHistory() { S.status = 'placing'; S.readout = null; S.placedDirty = true; clearSelection(); refreshGhost(); play('ui'); bump(); }
    function setPlaced(placed) {
      S.placed = clone(placed || []); S.history = []; S.future = []; S.status = S.placed.length ? 'placing' : 'idle';
      S.readout = null; S.placedDirty = true; clearSelection(); bump();
    }

    /* ---------------------------------------------- selection, ghost */
    function select(cell) {
      S.selectedCell = { x: cell.x, y: cell.y };
      if (render) render.setSelection(S.selectedCell);
      anchorControls(); bump();
    }
    function clearSelection() {
      if (!S.selectedCell) return;
      S.selectedCell = null; if (render) render.setSelection(null); ui.hidePieceControls(); bump();
    }
    function anchorControls() {
      if (!S.selectedCell || !render) return;
      var p = render.projectCell(S.selectedCell, theme.piece.housing.h);
      ui.showPieceControls({ screenX: p.x, screenY: p.y, cell: S.selectedCell });
    }
    function refreshGhost() {
      if (!render) return;
      var g = null;
      if (S.drag) {
        var o = S.drag.over;
        if (o) g = { x: o.x, y: o.y, type: S.drag.piece.type, orient: S.drag.piece.orient, invalid: !sameCell(o, S.drag.from) && !canPlaceExcluding(S.drag.from, o) };
      } else if (S.hintGhost) g = S.hintGhost;
      else if (S.cursorCell && S.selectedTray && !pieceAt(S.cursorCell)) {
        g = { x: S.cursorCell.x, y: S.cursorCell.y, type: S.selectedTray, orient: '/', invalid: !sim.canPlace(S.level, S.placed, S.cursorCell.x, S.cursorCell.y) };
      }
      render.setGhost(g);
    }

    /* ----------------------------------------------------- gestures */
    function onTraySelect(type) {
      if (busy()) return;
      if (type && remaining()[type] <= 0) { ui.flashInvalid('tray'); play('invalid'); return; }
      S.selectedTray = type || null; play('ui'); refreshGhost(); bump();
    }
    function onTapCell(c) {
      if (busy()) return;
      var cell = { x: c.x, y: c.y };
      if (pieceAt(cell)) { rotateAt(cell); select(cell); return; }
      if (fixedAt(cell)) { ui.flashInvalid('cell'); play('invalid'); ui.showToast('That piece is bolted down.', { kind: 'danger' }); return; }
      if (S.selectedTray) { placeAt(cell, S.selectedTray); return; }
      clearSelection();
      if (!S.nudged && trayTotal() > 0) { S.nudged = true; ui.showToast('Pick a piece from the tray first.', { kind: 'info' }); }
    }
    function onDragPiece(phase, p) {
      if (phase === 'start') { if (busy()) return; S.drag = { from: p.from, piece: p.piece, over: null }; clearSelection(); cancelHint(); refreshGhost(); return; }
      if (!S.drag) return;
      if (phase === 'move') { S.drag.over = p.over; refreshGhost(); return; }
      var d = S.drag; S.drag = null;
      if (phase === 'end' && p.to && !sameCell(p.to, d.from)) {
        if (canPlaceExcluding(d.from, p.to)) movePiece(d.from, p.to);
        else { ui.flashInvalid('cell'); play('invalid'); }
      }
      refreshGhost();
    }
    function onKey(action, payload) {
      if (action === 'escape') {
        if (ui.closeTopModal()) return;
        if (S.selectedCell) clearSelection(); else if (S.selectedTray) { S.selectedTray = null; refreshGhost(); bump(); }
        else if (S.cursorCell) setCursor(null);
        return;
      }
      if (busy()) return;
      if (action === 'cursor') {
        var c = S.cursorCell || { x: S.level.emitter.x, y: S.level.emitter.y };   /* the cursor starts on the emitter */
        c = { x: c.x + payload.dx, y: c.y + payload.dy };
        c.x = Math.max(0, Math.min(S.level.size.w - 1, c.x)); c.y = Math.max(0, Math.min(S.level.size.d - 1, c.y));
        setCursor(c);
      } else if (action === 'enter') {
        if (!S.cursorCell) { setCursor({ x: S.level.emitter.x, y: S.level.emitter.y }); return; }
        if (pieceAt(S.cursorCell)) { rotateAt(S.cursorCell); select(S.cursorCell); }
        else if (S.selectedTray) placeAt(S.cursorCell, S.selectedTray);
        else { ui.flashInvalid('tray'); play('invalid'); }
      } else if (action === 'delete') {
        var target = S.selectedCell || S.cursorCell;
        if (target && pieceAt(target)) removeAt(target); else { ui.flashInvalid('cell'); play('invalid'); }
      } else if (action === 'fire') fire();
      else if (action === 'tilt') tilt();
      else if (action === 'reset') reset();
      else if (action === 'undo') undo();
      else if (action === 'redo') redo();
      else if (action === 'hint') hint();
      else if (action === 'fit') fitBoard();
      else if (action === 'select') {
        var type = TYPES[payload.index - 1];
        if (type) onTraySelect(S.selectedTray === type ? null : type);
      }
    }
    function setCursor(cell) {
      S.cursorCell = cell ? { x: cell.x, y: cell.y } : null;
      if (render) render.setCursor(S.cursorCell);
      if (input) input.setCursor(S.cursorCell);
      refreshGhost(); bump();
    }

    /* ------------------------------------------------ fire, tracing */
    function fire() {
      if (busy() || S.status === 'won') return;   /* a solved board is not re-fired; any edit or RESET re-arms FIRE */
      clearSelection(); cancelHint();
      S.fires++; S.status = 'tracing'; S.fireDirty = true; S.placedDirty = true; S.readout = null;
      S.traceStartedAt = now();
      play('fire');
      syncInput(); bump();
    }
    function retrace() {
      S.result = sim.trace(S.level, S.placed);
      var fired = S.fireDirty; S.fireDirty = false;
      if (render) { render.setPlaced(S.placed); render.setBeam(S.result, { animate: fired, fired: fired }); }
      if (fired) {
        S.cues = Trace.cues(S.level, S.result);
        /* DESIGN.md 15: a FIRED shot is what surveys the board. The live retrace after every edit draws a beam but
         * teaches nothing - 15.2 makes the shot the expedition, and a preview that lit the route would leave the
         * FIRE button with nothing left to do. The queue is paid out cell by cell as the head travels. */
        S.discoveries = S.dark ? Trace.discoveries(S.level, S.result) : [];
        if (audio) { audio.setLevel(S.result.segments.length ? S.result.segments[0].from.z : 0); audio.play('travel'); }
        if (!render) finishTrace();
      }
      bump();
    }
    function pollTrace() {
      var p = render ? render.getBeamProgress() : { playing: false, cells: Infinity };
      drainDiscoveries(p.cells);          /* the board opens along the beam, in step with it */
      while (S.cues.length && S.cues[0].dist <= p.cells + 1e-6) {
        var c = S.cues.shift();
        if (c.kind === 'hit') play('hit'); else if (audio) audio.setLevel(c.z);
      }
      if (!p.playing) finishTrace();
    }
    function finishTrace() {
      if (audio) audio.stop('travel');
      S.cues = [];
      /* Whatever the head did not reach - because the player skipped the animation, or because there is no
       * renderer at all - is learned now. A shot always teaches the whole of its own path. */
      drainDiscoveries(Infinity);
      saveKnown();
      var r = S.result;
      S.readout = Trace.readout(S.level, r, root.LaserUI.endText);   /* what the beam did, in kid language (S5/S10) */
      if (r && r.allTargetsHit) { win(); return; }
      play(r && r.end === 'blocked' ? 'blocked' : 'lost');
      S.status = 'placing';
      if (shouldReveal()) startReveal(); else syncInput();
      bump();
    }
    function win() {
      S.status = 'won';
      var stars = attemptStars(), key = String(S.levelIndex);
      progress.stars[key] = root.LaserUI.mergeStars(progress.stars[key], stars);   /* per criterion, never max() of a count */
      progress.highestUnlocked = Math.max(progress.highestUnlocked | 0, S.levelIndex + 1);
      ui.saveProgress(progress);
      play('win');
      var detail = { stars: progress.stars[key], starCount: root.LaserUI.starCount(progress.stars[key]),
        piecesUsed: S.placed.length, par: S.level.par, fires: S.fires, tiltsUsed: S.tiltsUsed, hintUsed: S.hintUsed,
        hasNext: S.levelIndex + 1 < LEVELS.length };
      victoryTimer = setTimeout(function () { victoryTimer = null; if (!destroyed && S.status === 'won') { ui.showVictory(detail); markDirty(); } }, scaleMs(theme.beam.endStates.target.ringMs));
      syncInput(); bump();
    }

    /* ------------------------------------------------- free reveal */
    function shouldReveal() {
      if (!render || !REVEAL_LEVELS[S.levelIndex]) return false;
      return !bag('revealed')[String(S.levelIndex)];
    }
    /* S6: the reveal is EXCLUSIVE (input, level change, modals and the camera controls are all blocked while it
     * plays - see locked()), and the "already seen" flag is written only when it actually FINISHES. Marking it
     * consumed up front meant a reload, a tab close or any interruption burned the one-time lesson for good. */
    function startReveal() {
      S.revealPlaying = true; clearSelection(); syncInput(); bump();
      cam.playReveal(Trace.revealCell(S.level, S.result), endReveal);
    }
    function endReveal() {
      bag('revealed')[String(S.levelIndex)] = true; ui.saveProgress(progress);   /* consumed only once it has played */
      S.revealPlaying = false; S.camDirty = true; syncInput(); bump();
    }
    function cancelReveal() { if (cam) cam.cancelReveal(); if (S.revealPlaying) { S.revealPlaying = false; syncInput(); bump(); } }

    /* ---------------------------------------------------- tilt, hint */
    function tilt() {
      if (locked() || !render || (ui && ui.isModalOpen())) return;
      clearSelection();
      if (render.isFlat()) { S.tiltsUsed++; play('tilt'); render.setCameraPreset('tilt', { animate: true }); }
      else { play('flat'); render.setCameraPreset('flat', { animate: true }); }
      S.camDirty = true; bump();
    }
    function hint() {
      if (busy() || !S.solution) return;
      var entry = null, i;
      for (i = 0; i < S.solution.length && !entry; i++) {
        var e = S.solution[i], p = pieceAt(e);
        if (!(p && p.type === e.type && p.orient === e.orient)) entry = e;
      }
      if (!entry) { ui.showToast('That is the answer. Press FIRE!', { kind: 'success' }); return; }
      S.hintUsed = true; S.hintGhost = { x: entry.x, y: entry.y, type: entry.type, orient: entry.orient };
      refreshGhost(); ui.setHintGhostVisible(true); play('hint');
      clearTimeout(S.hintTimer);
      S.hintTimer = setTimeout(function () { S.hintTimer = null; S.hintGhost = null; if (!destroyed) { refreshGhost(); ui.setHintGhostVisible(false); markDirty(); } }, scaleMs(theme.ui.hintGhostMs));
      bump();
    }
    function cancelHint() {
      if (S.hintTimer) { clearTimeout(S.hintTimer); S.hintTimer = null; }
      if (S.hintGhost) { S.hintGhost = null; refreshGhost(); ui.setHintGhostVisible(false); markDirty(); }
    }
    /* The view button toggles OVERVIEW / WORKING (see src/main-camera.js). Never a tilt, so it never costs the
     * blind star. */
    function fitBoard() {
      if (!render || locked() || !cam.toggleView({ animate: true })) return;
      play('ui'); S.camDirty = true; bump();
    }
    function toggleSound() {
      progress.muted = !progress.muted; ui.saveProgress(progress);
      if (audio) { audio.unlock(); audio.setMuted(progress.muted); if (!progress.muted) audio.play('ui'); }
      bump();
    }

    /* ----------------------------------------------- view model, loop */
    function getViewModel() {
      var key = String(S.levelIndex), flags = root.LaserUI.starFlags(progress.stars[key]);
      return { levelIndex: S.levelIndex, levelCount: LEVELS.length, level: S.level, placed: S.placed, trayRemaining: remaining(),
        selectedTray: S.selectedTray, selectedCell: S.selectedCell, cursorCell: S.cursorCell,
        fires: S.fires, tiltsUsed: S.tiltsUsed, hintUsed: S.hintUsed, beamResult: S.result, status: S.status,
        stars: flags, starCount: root.LaserUI.starCount(flags),
        attemptStars: attemptStars(), attemptStarCount: root.LaserUI.starCount(attemptStars()),
        camera: S.isFlat ? 'flat' : 'tilt', isFlat: S.isFlat,
        muted: !!progress.muted, canUndo: S.history.length > 0, canRedo: S.future.length > 0,
        revealPlaying: S.revealPlaying, cameraBusy: S.resetting,
        readout: S.readout, hintAvailable: !!S.solution, canFit: !!S.canFit, viewToggle: S.viewToggle,
        /* DESIGN.md 15: the HUD says the level is dark and how much of it the player has uncovered. */
        dark: S.dark, known: S.known ? S.known.count : 0, knownTotal: S.known ? S.known.w * S.known.d : 0 };
    }
    function step(dt) {
      S.dirty = false; S.frames++;
      if (S.placedDirty) { S.placedDirty = false; retrace(); }
      if (S.status === 'tracing') pollTrace();
      if (render) {
        var flat = render.isFlat();
        if (flat !== S.isFlat) { S.isFlat = flat; bump(); }
        var vt = cam.viewToggle();   /* the button appears, vanishes and flips as pan, zoom and the clamp settle */
        if (vt !== S.viewToggle) { S.viewToggle = vt; S.canFit = !!vt; bump(); }
        if (S.selectedCell && (S.camDirty || render.getCamera().animating)) anchorControls();
        S.camDirty = false;
      }
      if (S.version !== S.pushed) { S.pushed = S.version; ui.setState(getViewModel()); }
      if (render) render.frame(dt);
    }
    function loop(ts) {
      rafId = 0;
      if (destroyed) return;
      var dt = last ? Math.min(0.05, Math.max(0, (ts - last) / 1000)) : 0;
      last = ts;
      step(dt);
      /* Keep going only while something is moving. `tracing` is in the condition because the beam finishes INSIDE
       * render.frame(), after pollTrace() ran: main always needs one more frame to leave the tracing state. */
      if (S.dirty || S.status === 'tracing' || (render && render.needsFrame())) requestFrame();
      else last = 0;
    }
    function destroy() {
      if (destroyed) return;
      saveKnown();
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0; cancelReveal(); cancelReset(); cancelHint();
      if (victoryTimer) clearTimeout(victoryTimer);
      docListeners.forEach(function (l) { document.removeEventListener(l[0], l[1]); });
      if (input) input.detach();
      if (audio) audio.dispose();
      if (render) render.dispose();
      ui.destroy();
    }
  }

  root.LaserMain = { __version: 1, start: start };
}(typeof self !== 'undefined' ? self : this));
