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
    var render = null, input = null, ui = null, audio = null, progress = null, cam = null, weather = null, quality = null, learning = null;
    var wasAnimating = false;   /* section 10: only an interval BETWEEN two animating frames is a sample */
    /* THE ONE ANIMATION REGISTRY AND THE ONE RENDER SCHEDULER (src/motion.js, MOTION-DIRECTION.md "Rendering and
     * ownership"). Everything that moves in this game registers here and is advanced by step() below: there is no
     * second requestAnimationFrame loop, no setInterval, no perpetual CSS animation and no free-running shader
     * clock anywhere in the build. It is created before the renderer because the renderer, the UI and the camera
     * choreography are all handed it. */
    var motion = root.LaserMotion.create({ theme: theme, dirty: markDirty, reducedMotion: reducedMotion });
    var S = { levelIndex: 0, level: null, solution: null, placed: [], history: [], future: [], selectedTray: null, selectedCell: null, cursorCell: null,
      hintStage: 0, moveFrom: null, fires: 0, tiltsUsed: 0, hintUsed: false, result: null, lastShot: null, status: 'idle', isFlat: true, canFit: false, viewToggle: null, revealPlaying: false,
      resetting: false, readout: null, traceStartedAt: 0,
      placedDirty: false, fireDirty: false, cues: [], drag: null, hintGhost: null, hintTimer: null, pendingIntro: null, camDirty: false,
      version: 0, pushed: -1, nudged: false, dirty: true, frames: 0,
      /* DESIGN.md 15: fog of war. `known` is the level's whole discovered set, `discoveries` the queue a shot is
       * still paying out as its beam travels, `knownDirty` whether the set has moved since it was last saved. */
      dark: false, known: null, discoveries: [], knownDirty: false };
    var resetToken = 0, rafId = 0, last = 0, destroyed = false, docListeners = [];
    var WIN_DELAY = 'win.modalDelay', WEATHER_SETTLE = 'weather.settle';

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
    /* Every accepted action in this file announces itself with a sound, which makes this the one honest choke point
     * for section 4's "a new interaction cancels the current weather". The few cues that are NOT input - the
     * blocked/lost/win chimes at the end of a shot - reach it too, and that is correct: each of those paths
     * schedules its own fresh burst immediately afterwards. Camera drags make no sound and interrupt explicitly. */
    function play(name) { calmWeather(); if (audio) audio.play(name); }
    function busy() { return S.status === 'tracing' || S.revealPlaying || S.resetting || (ui && ui.isModalOpen()); }
    /* Exclusive camera choreography: the free reveal and RESET's return to flat. Controls that could cancel them
     * (level change, modals, TILT, RESET) are disabled for the duration (S4, S6). */
    function locked() { return S.revealPlaying || S.resetting; }
    /* The registry owns both, so a fixed reduced-motion value can never be scaled twice (contract 9). */
    function scaleMs(ms, fixedReducedMs) { return motion.scaleMs(ms, fixedReducedMs); }
    function holdMs(ms) { return motion.holdMs(ms); }
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
    /* Independent campaign criteria. The legacy blind key now means unassisted; tilt has a separate mastery badge. */
    function attemptStars() {
      return { solved: true, par: !!(S.level && S.placed.length <= S.level.par && !S.hintUsed), blind: !S.hintUsed };
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
      if (root.LaserRenderPieces) root.LaserRenderPieces.attachMotion(motion);   /* section 5's placement feel */
      render = root.LaserRender.create({ canvas: canvas, theme: theme, sim: sim, motion: motion });
    } catch (e) { render = null; }
    if (root.LaserAudio) audio = root.LaserAudio.create({ theme: theme });
    ui = root.LaserUI.create({ root: rootEl, theme: theme, render: render, motion: motion, levels: LEVELS, autoHelp: false, handlers: {
      onTraySelect: onTraySelect, onFire: fire, onReset: reset, onTiltToggle: tilt, onHint: hint, onUndo: undo, onRedo: redo,
      onSoundToggle: toggleSound, onRotateSelected: function () { if (S.selectedCell) rotateAt(S.selectedCell); },
      onRemoveSelected: function () { if (S.selectedCell) removeAt(S.selectedCell); },
      onSelectLevel: function (i) { loadLevel(i); }, onNextLevel: nextLevel, onRetryLevel: reset, onFit: fitBoard,
      /* Returning false vetoes the modal: nothing may interrupt the one-time free reveal (S6). */
      onLevels: function () { return locked() ? false : undefined; }, onHelp: function () { return locked() ? false : undefined; },
      /* Section 7: "New input cancels remaining decoration immediately." Opening a panel is input. Presentations
       * - the beam, the camera, an award already begun - are left to finish; only decoration is dropped. */
      onModalOpen: function () { if (learning) learning.close(); motion.cancelRole('decorative'); calmWeather(); syncInput(); markDirty(); },
      onModalClose: function () { syncInput(); flushIntro(); markDirty(); },
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
    cam = root.LaserMainCamera.create({ theme: theme, render: render, motion: motion, hold: holdMs, play: play, dirty: markDirty,
      alive: function () { return !destroyed; } });
    weather = root.LaserWeather ? root.LaserWeather.create({ theme: theme, motion: motion, canvas: canvas, reducedMotion: reducedMotion }) : null;
    /* The Implementation contract, "When reduced motion becomes enabled during an animation": settle decorative
     * effects immediately and apply each item's own fallback. The registry does the settling (its fallback() is
     * the item-specific one, and scaleMs never re-scales a fixed reduced duration); this only flips the switch on
     * every module that owns a presentation, and it is idempotent so the ladder's last rung can share it. */
    function applyReducedMotion(on) {
      on = !!on;
      if (on === reducedMotion) return;
      reducedMotion = on;
      motion.setReducedMotion(on);
      if (render) render.setReducedMotion(on);
      if (weather) weather.setReducedMotion(on);
      markDirty(); bump();
    }
    if (root.matchMedia && theme.reducedMotion) {
      var rmq = root.matchMedia(theme.reducedMotion.mediaQuery);
      var onRm = function (e) { applyReducedMotion(!!(e && e.matches !== undefined ? e.matches : rmq.matches)); };
      if (rmq.addEventListener) rmq.addEventListener('change', onRm);
      else if (rmq.addListener) rmq.addListener(onRm);
    }

    /* MOTION-DIRECTION.md section 10: measure, and give up decoration in the document's order rather than frames.
     * src/quality.js owns the decision (median of the last budget.sampleFrames ACTIVE-frame intervals against
     * budget.degradeMedianMs, one rung per failed window, never a climb back inside an attempt); everything below
     * is the application, and each rung's REPLACEMENT is the one the document names - not an absence.
     * The two rungs the renderer cannot own are here: weather is a DOM effect this file schedules, and
     * 'reduced-presentation' is the whole registry's switch. */
    quality = root.LaserQuality ? root.LaserQuality.create({ theme: theme, apply: function (name) {
      if (destroyed) return;
      if (name === 'weather') { weatherCut = true; calmWeather(); }
      else if (name === 'reduced-presentation') applyReducedMotion(true);
      if (render && render.setQualityCut) render.setQualityCut(name, arguments[1]);
      markDirty();
    } }) : null;
    input = root.LaserInput.attach({ element: canvas, render: render, theme: theme, handlers: {
      onTapCell: onTapCell, onTapEmpty: function () { clearSelection(); }, onDragPiece: onDragPiece,
      onOrbitStart: function () { if (locked()) return; calmWeather(); S.tiltsUsed++; clearSelection(); bump(); },
      onOrbit: function (dAz, dEl) { if (locked()) return; render.orbit(dAz, dEl); S.camDirty = true; markDirty(); },
      onOrbitEnd: function () { S.camDirty = true; saveAttempt(); markDirty(); },
      onZoom: function (f) { calmWeather(); render.zoom(f); S.camDirty = true; bump(); },
      onPan: function (dx, dy) { calmWeather(); render.pan(dx, dy); S.camDirty = true; bump(); },
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
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        motion.documentHidden({ commit: commitHidden }); saveAttempt();
        return;
      }
      last = 0;
      motion.documentVisible();   /* exactly one render of the settled state; nothing is replayed */
      /* AND ONE UNCONDITIONALLY, because documentVisible() only fires when documentHidden() armed it. A page that
       * BOOTED hidden - a background tab, or the app switched away before start() finished - never saw a hide
       * transition, so nothing is armed, yet every markDirty() during that period was swallowed by requestFrame()'s
       * `if (document.hidden) return`. Without this line the board, the HUD and the tray stay blank until the
       * player's first pointer or key event, because ui.setState() and render.frame() both live inside step().
       * markDirty() is idempotent here: requestFrame() bails while rafId is set, so a resume that WAS armed still
       * draws exactly one frame. The invariant restored is "S.dirty implies a frame is scheduled once visible". */
      markDirty();
    }
    /* MOTION-DIRECTION.md, Implementation contract: "On document hiding, cancel decorative effects and settle
     * active presentations to their final states. Commit the corresponding authoritative gameplay result and
     * discoveries. On return, render the settled state once. Do not replay missed animation."
     *
     * By the time this runs the registry has already done the first two. What is left is the GAME's half: a shot
     * that was still travelling has, as far as the rules are concerned, already happened, so it is completed here -
     * the whole route drawn, every cell it crossed learned AND SAVED, the readout written, a win recorded.
     *
     * The one-time teaching reveal is the exception. It is abandoned rather than fast-forwarded, exactly as every
     * other interruption abandons it (S6: the flag is written only when it FINISHES), so the lesson is still there
     * to play next time - and the camera is put back flat, because a reveal settled mid-orbit would hand over the
     * board's structure on return without ever costing the blind star. */
    function commitHidden() {
      var wasReveal = S.revealPlaying;
      if (S.status === 'tracing') { if (render) render.finishBeam(); finishTrace(); }
      if (wasReveal) {
        cancelReveal();
        if (render) render.setCameraPreset('flat', { animate: false });
        S.camDirty = true;
      }
      cancelHint();
      calmWeather();
      drainDiscoveries(Infinity); saveKnown();
      /* A victory modal still waiting on its one-shot delay is part of the authoritative result, so it is shown now
       * rather than replayed on return. settleAll() already drained any hold that existed BEFORE this commit; this
       * settles the one a win discovered inside it. (settle() takes a key or a handle and simply reports false when
       * there is nothing by that name - unlike has(), which only knows about animations.) */
      motion.settle(WIN_DELAY);
      /* One last drain, because THIS function is allowed to start work: settling the victory delay above opens the
       * modal, which queues the star awards as a chain of one-shots. They render nothing, but leaving them pending
       * would mean the player's stars arrive on a stopwatch nobody is watching. Decoration created here is
       * cancelled rather than settled - a weather burst on a hidden tab is exactly what section 4 forbids. */
      motion.settleAll({ cancelDecorative: true });
    }
    [['pointerdown', unlockAudio], ['keydown', unlockAudio], ['touchend', unlockAudio],
      ['pointerdown', skipTrace], ['keydown', skipTrace], ['touchstart', skipTrace],
      ['visibilitychange', onVisibility]].forEach(function (l) { document.addEventListener(l[0], l[1], { passive: true }); docListeners.push(l); });

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); saveAttempt(); ui.showToast('Graphics paused. Your puzzle is saved.', {ms:8000}); });
    canvas.addEventListener('webglcontextrestored', function () { render.invalidateShadows(); S.placedDirty = true; markDirty(); });
    var startIndex = Math.min(Math.max(0, progress.currentLevel | 0), Math.max(0, LEVELS.length - 1));
    if (startIndex > (progress.highestUnlocked | 0)) startIndex = progress.highestUnlocked | 0;
    if (!loadLevel(startIndex)) loadLevel(0);
    syncInput();
    markDirty();
    return finishApp();

    function finishApp() {
      var app = { state: S, sim: sim, render: render, input: input, ui: ui, audio: audio, theme: theme, levels: LEVELS,
        loadLevel: loadLevel, fire: fire, reset: reset, saveAttempt: saveAttempt, knownCell: knownCell, focusCell: focusCell, moveSelected: function () { S.moveFrom = S.selectedCell || S.cursorCell; if (S.moveFrom && pieceAt(S.moveFrom)) ui.showToast('Tap the destination square.', {ms:8000}); }, undo: undo, redo: redo, hint: hint, tilt: tilt, setPlaced: setPlaced,
        /* DESIGN.md 15 test/debug surface: the level's discovered set and a way to grow it without firing. */
        knownList: knownList, learnCells: learnCells, saveKnown: saveKnown,
        getViewModel: getViewModel, getProgress: function () { return progress; }, step: step, destroy: destroy,
        /* The scheduler and the one DOM effect it does not hold frames for. test/motion.frames.mjs drives both:
         * every kind of motion must be seen to run AND to stop. */
        motion: motion, weather: weather, __version: 1 };
      root.__lasers3d = app;
      if (render && root.LaserLearning) learning = root.LaserLearning.attach(app);
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
    function fingerprint(parsed) { return root.LaserProgress.fingerprint(LEVELS[S.levelIndex] || parsed); }
    function knownCell(c) { return !S.dark || !!(S.known && S.known.cells[c.y * S.known.w + c.x]); }
    function focusCell(c, zoom) { if (!render || !c) return; render.focusCell(c, zoom); S.camDirty = true; bump(); }
    function saveAttempt() {
      if (!progress || !S.level || !root.LaserProgress) return;
      var key = String(S.levelIndex);
      if (S.status === 'won') delete bag('attempts')[key];
      else bag('attempts')[key] = {f:fingerprint(S.level), placed:clone(S.placed), fires:S.fires, tiltsUsed:S.tiltsUsed, hintUsed:S.hintUsed, camera:render ? render.getCamera() : null};
      ui.saveProgress(progress);
    }
    function restoreAttempt(raw) {
      var a = root.LaserProgress.attempt(raw, LEVELS[S.levelIndex], sim);
      if (!a) return false;
      S.placed = a.placed; S.fires = a.fires; S.tiltsUsed = a.tiltsUsed; S.hintUsed = a.hintUsed;
      S.status = a.placed.length ? 'placing' : 'idle';
      if (render && a.camera) render.restoreCamera(a.camera);
      S.isFlat = render ? render.isFlat() : true; S.camDirty = true;
      return true;
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

    /* ------------------------------------------------------ weather (MOTION-DIRECTION.md 4) */
    /* "Run this once when the board first becomes ready, and once after a completed player interaction settles.
     * Coalesce activity: a new interaction cancels the current weather and schedules one fresh burst after that
     * interaction settles. Do not enqueue bursts."
     *
     * So there are exactly two calls: calmWeather() ends whatever is in flight AND drops any burst that has not
     * started, and settleWeather(ms) replaces both with one fresh burst after a stationary hold. The hold is the
     * quiet of section 7 - it renders nothing, holds the loop open for nothing and locks no input - and because it
     * carries the attempt stamp, a RESET between the settle and the burst silently cancels it. */
    var weatherHold = null, weatherCut = false;
    function calmWeather() {
      if (weatherHold) { var h = weatherHold; weatherHold = null; h.cancel(); }
      if (weather) weather.interrupt();
    }
    function settleWeather(delayMs) {
      /* Ladder rung 1. The document's first cut, and the cheapest: weather is the only idle-motion allowance in
       * the whole build, so nothing the player is reasoning about is lost when it goes. */
      if (!weather || destroyed || weatherCut) return;
      calmWeather();
      var st = motion.token();
      weatherHold = motion.hold(holdMs(delayMs || 0), function () {
        weatherHold = null;
        if (!destroyed) weather.settled();
      }, { key: WEATHER_SETTLE, role: 'decorative', attempt: st.attempt, trace: st.trace,
        cancel: function () { weatherHold = null; } });
    }

    /* ------------------------------------------------------- levels */
    function loadLevel(index) {
      if (typeof index !== 'number' || index < 0 || index >= LEVELS.length) return false;
      /* S6: the free reveal is exclusive. A level change during it would cancel the lesson, and the lesson only
       * plays once, so it would be lost for good. */
      if (S.revealPlaying) return false;
      saveAttempt();
      var raw = LEVELS[index], parsed;
      try { parsed = sim.parseLevel(raw); }
      catch (e) { console.warn('lasers-3d: level ' + (index + 1) + ' skipped: ' + (e && e.message)); return loadLevel(index + 1); }
      cancelReveal(); cancelReset(); cancelHint(); S.drag = null;
      /* Level navigation abandons every animation of the level being left WITHOUT applying any final state - the
       * board it belonged to is about to be replaced - and bumps the attempt (and with it the trace), so a callback
       * still in flight from that level can never write into this one (contract 7). */
      motion.cancelAll(); motion.newAttempt(); if (quality) quality.reset();
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
        render.setLevel(parsed, index); applyDarkness(); render.setCameraPreset('flat', { animate: false });
        render.setSelection(null); render.setGhost(null); render.setCursor(null); render.setHover(null);
      }
      if (input) input.setCursor(null);
      restoreAttempt(bag('attempts')[String(index)]);
      progress.currentLevel = index; ui.saveProgress(progress);
      S.placedDirty = true; S.isFlat = render ? render.isFlat() : true;
      ui.hideToast(); queueIntro(parsed.intro);
      syncInput(); bump();
      settleWeather(0);                  /* section 4: one burst when the board first becomes ready */
      return true;
    }
    function nextLevel() { if (!loadLevel(S.levelIndex + 1)) ui.showLevelSelect(); }
    /* Note what is NOT here: S.known. DESIGN.md 15.1 - "RESET keeps what is known" - so discovery is not part of an
     * attempt at all, it is part of the level. The in-flight `discoveries` queue IS cleared: it belongs to a shot
     * that is being abandoned, and anything it had already paid out is in S.known already. */
    function resetAttempt() {
      S.hintStage = 0; S.moveFrom = null; S.placed = []; S.history = []; S.future = []; S.fires = 0; S.tiltsUsed = 0; S.hintUsed = false; S.status = 'idle';
      S.result = null; S.lastShot = null; S.selectedTray = null; S.selectedCell = null; S.cues = []; S.fireDirty = false; S.readout = null;
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
      /* RESET is a new attempt. Abandon every animation of the old one without applying its final state, then bump
       * the stamp so nothing already in flight - a queued star award, a fog burn, a weather burst - can write into
       * the new attempt. cancelAll() runs FIRST so the camera's return to flat below belongs to the new attempt. */
      motion.cancelAll(); motion.newAttempt(); if (quality) quality.reset();
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
          S.placedDirty = true; S.camDirty = true; saveAttempt();
          syncInput(); bump();
        });
      } else {
        if (render) render.setCameraPreset('flat', { animate: false });
        S.camDirty = true; saveAttempt(); syncInput(); bump();
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
      S.hintStage = 0; S.placedDirty = true; if (sound) play(sound); saveAttempt(); bump();
      /* Section 4: one burst once this edit has settled. PL.dropMs + PL.seatMs is exactly section 5's drop and its
       * seating mark, i.e. the moment the edit stops moving. */
      settleWeather(theme.motion.placement.dropMs + theme.motion.placement.seatMs);
    }
    function placeAt(cell, type) {
      if (busy() || !type) return false;
      if (remaining()[type] <= 0 || !sim.canPlace(S.level, S.placed, cell.x, cell.y)) {
        /* Section 5, "Illegal placement": the board and the piece stay put; the danger outline goes on the
         * ATTEMPTED FOOTPRINT (the renderer's, ui.js only owns the tray card's two shake beats). It is the same
         * outline whatever the refusal's reason, so a refusal on a dark cell still tells the player nothing about
         * what is hidden there - only that the answer was no. */
        ui.flashInvalid('cell'); play('invalid');
        if (render) render.flashInvalid(cell);
        return false;
      }
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
    function afterHistory() { S.status = 'placing'; S.readout = null; S.placedDirty = true; clearSelection(); refreshGhost(); play('ui'); saveAttempt(); bump(); }
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
      if (g && !knownCell(g)) g.invalid = false;
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
      if (S.moveFrom) { var from = S.moveFrom; S.moveFrom = null; if (canPlaceExcluding(from, cell)) { movePiece(from, cell); clearSelection(); } else ui.showToast('That square is unavailable.', {kind:'danger'}); return; }
      if (render.getViewMode() === 'overview') { focusCell(cell, true); return; }
      if (pieceAt(cell)) { rotateAt(cell); select(cell); return; }
      if (fixedAt(cell)) { ui.flashInvalid('cell'); play('invalid'); ui.showToast(knownCell(cell) ? 'That piece is bolted down.' : 'That square is unavailable.', { kind: 'danger' }); return; }
      if (S.selectedTray) { placeAt(cell, S.selectedTray); return; }
      clearSelection();
      if (!S.nudged && trayTotal() > 0) { S.nudged = true; ui.showToast('Pick a piece from the tray first.', { kind: 'info' }); }
    }
    /* MOTION-DIRECTION.md section 5, rows "Pick up", "Drag" and "Cancel drag". The renderer cannot infer any of
     * them: `setPlaced` only ever sees committed edits, so a piece that is merely BEING CARRIED looks identical to
     * one sitting still. main has to say so.
     *   start          -> setPickup(cell): the 100 ms, 6 CSS px, 1.04 lift, and the board copy is hidden behind the
     *                     proxy in the same update, so a carried piece is drawn exactly once.
     *   committed end  -> NOTHING. render-placement's drop() calls endPickup() itself, which releases the source
     *                     proxy without a return tween; calling setPickup(null) here as well would start a 140 ms
     *                     cancel animation back at the source cell while the drop plays at the destination, i.e.
     *                     precisely the "trailing clone" the Drag row forbids.
     *   every other end, and cancel -> setPickup(null): the 140 ms return to the original screen anchor.
     * The "released on the cell it started on" and "released outside the board" cases go down that last path too -
     * without them a lifted piece would simply stay lifted for ever, a settled animation with no way home. */
    function onDragPiece(phase, p) {
      if (phase === 'start') {
        if (busy()) return;
        S.drag = { from: p.from, piece: p.piece, over: null };
        clearSelection(); cancelHint();
        if (render && p.from && p.piece) render.setPickup({ x: p.from.x, y: p.from.y, type: p.piece.type, orient: p.piece.orient });
        refreshGhost();
        return;
      }
      if (!S.drag) return;
      if (phase === 'move') { S.drag.over = p.over; refreshGhost(); return; }
      var d = S.drag, committed = false;
      S.drag = null;
      if (phase === 'end' && p.to && !sameCell(p.to, d.from)) {
        if (canPlaceExcluding(d.from, p.to)) { committed = true; movePiece(d.from, p.to); }
        else { ui.flashInvalid('cell'); play('invalid'); if (render) render.flashInvalid(p.to); }
      }
      if (!committed && render) render.setPickup(null);
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
      if (render) { render.setCursor(S.cursorCell); if (S.cursorCell) focusCell(S.cursorCell, false); }
      if (input) input.setCursor(S.cursorCell);
      refreshGhost(); bump();
    }

    /* ------------------------------------------------ fire, tracing */
    function fire() {
      if (busy() || S.status === 'won') return;   /* a solved board is not re-fired; any edit or RESET re-arms FIRE */
      clearSelection(); cancelHint();
      S.fires++; S.status = 'tracing'; S.fireDirty = true; S.placedDirty = true; S.readout = null;
      S.traceStartedAt = now(); saveAttempt();
      play('fire');
      syncInput(); bump();
    }
    function retrace() {
      S.result = sim.trace(S.level, S.placed);
      var fired = S.fireDirty; S.fireDirty = false;
      if (fired) S.lastShot = S.result;
      /* A FIRE and a live retrace are both new traces: bumping the stamp here (once, in the one place both go
       * through) is what stops a scatter streak, a fog burn or a badge fade from the PREVIOUS route writing into
       * this one after the geometry under it has been replaced. */
      motion.newTrace();
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
      /* Nothing starts a 3.1-second camera choreography on a board nobody is looking at. */
      if (shouldReveal() && !motion.isHidden()) startReveal(); else syncInput();
      bump();
      /* Section 7, step 4: "Allow 240 ms of quiet before starting optional weather." Reduced motion omits it. */
      if (!S.revealPlaying) settleWeather(scaleMs(theme.motion.failure.quietMs, 0));
    }
    function win() {
      S.status = 'won';
      var stars = attemptStars(), key = String(S.levelIndex);
      progress.stars[key] = root.LaserUI.mergeStars(progress.stars[key], stars);   /* per criterion, never max() of a count */
      progress.highestUnlocked = Math.max(progress.highestUnlocked | 0, S.levelIndex + 1);
      if (S.tiltsUsed === 0 && !S.hintUsed) bag('mastery')[key] = true;
      delete bag('attempts')[key]; ui.saveProgress(progress);
      play('win');
      var detail = { stars: progress.stars[key], starCount: root.LaserUI.starCount(progress.stars[key]),
        piecesUsed: S.placed.length, par: S.level.par, fires: S.fires, tiltsUsed: S.tiltsUsed, hintUsed: S.hintUsed,
        mastery: !!bag('mastery')[key], hasNext: S.levelIndex + 1 < LEVELS.length };
      /* MOTION-DIRECTION.md 6: the modal begins at W0 + m.win.modalDelayMs. Reduced motion drops that to the
       * target's own 120 ms material change and then fades modal and stars in together - scaleMs returns the fixed
       * reduced value verbatim, so durationScale can never be applied to it twice.
       *
       * A HOLD, not a timer: it renders nothing (the board is allowed to go to sleep while the modal animates,
       * which section 6 asks for in as many words), it is tracked so RESET and a level change cancel it, and
       * documentHidden() settles it - which shows the modal the player earned rather than replaying it on return. */
      var wt = motion.token();
      if (typeof render.playVictory === 'function') render.playVictory();
      /* MOTION-DIRECTION.md section 6, W0 to W0 + m.win.beamSealMs: ONE whole-route emissive and glow gain of
       * m.win.beamSealGain * bell(t), underneath the optical route pulse. bell() starts and
       * ends at exactly zero, so the circuit settles back onto the same baseline the altitude widths and
       * colours are read against, and every baseline altitude difference survives the celebration untouched.
       * A registry animation, so it holds frames only while it runs, RESET and a level change cancel it, and
       * documentHidden() settles it to the exact final gain of 0. Reduced motion omits the seal entirely. */
      if (!motion.isReducedMotion() && typeof render.setBeamSeal === 'function') {
        motion.run({
          key: 'win.beamSeal', role: 'decorative', surface: 'webgl',
          attempt: wt.attempt, trace: wt.trace,
          durationMs: theme.motion.win.beamSealMs, ease: theme.motion.easing.pulse,
          from: 0, to: theme.motion.win.beamSealGain,
          update: function (eased, ctx) { render.setBeamSeal(ctx.value); },
          final: function () { render.setBeamSeal(0); },
          fallback: function () { render.setBeamSeal(0); },
          cancel: function () { render.setBeamSeal(0); }
        });
      }
      motion.hold(holdMs(scaleMs(theme.motion.win.modalDelayMs, theme.motion.reduced.fadeMs)), function () {
        if (destroyed || S.status !== 'won') return;
        ui.showVictory(detail); markDirty();
      }, { key: WIN_DELAY, role: 'presentation', attempt: wt.attempt, cancel: function () {} });
      syncInput(); bump();
      settleWeather(theme.motion.win.modalDelayMs + theme.ui.victory.fadeMs);
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
      settleWeather(0);                  /* the interaction has settled */
    }
    function cancelReveal() { if (cam) cam.cancelReveal(); if (S.revealPlaying) { S.revealPlaying = false; syncInput(); bump(); } }

    /* ---------------------------------------------------- tilt, hint */
    function tilt() {
      if (locked() || !render || (ui && ui.isModalOpen())) return;
      clearSelection();
      if (render.isFlat()) { S.tiltsUsed++; play('tilt'); render.setCameraPreset('tilt', { animate: true }).then(saveAttempt); }
      else { play('flat'); render.setCameraPreset('flat', { animate: true }).then(saveAttempt); }
      S.camDirty = true; saveAttempt(); bump();
    }
    function hint() {
      if (busy() || !S.solution) return;
      if (sim.trace(S.level, S.placed).allTargetsHit) { ui.showToast('Your route works. Press FIRE!', {kind:'success'}); return; }
      S.hintStage++;
      if (S.hintStage === 1) { ui.showToast(S.readout && S.readout.pitch > 0 ? 'The beam keeps climbing. A DIP can level it.' : S.readout && S.readout.pitch < 0 ? 'The beam keeps falling. A WEDGE can level it.' : 'Follow the beam to its last turn. Which direction would reach the target? Tilt freely to inspect the heights.', {ms:8000}); bump(); return; }
      var entry = null, i;
      for (i = 0; i < S.solution.length && !entry; i++) {
        var e = S.solution[i], p = pieceAt(e);
        if (!(p && p.type === e.type && p.orient === e.orient)) entry = e;
      }
      if (!entry) { ui.showToast('That is the answer. Press FIRE!', { kind: 'success' }); return; }
      focusCell(entry, true);
      if (S.hintStage === 2) { render.pulseCell(entry); ui.showToast('Study this area. Ask once more to reveal a placement; that uses an assist.', {ms:8000}); bump(); return; }
      S.hintUsed = true; S.hintGhost = { x: entry.x, y: entry.y, type: entry.type, orient: entry.orient };
      refreshGhost(); ui.setHintGhostVisible(true); play('hint'); saveAttempt();
      ui.showToast(entry.type + ' at column ' + (entry.x + 1) + ', row ' + (entry.y + 1) + ', facing ' + entry.orient + (pieceAt(entry) ? '. Move or rotate the piece already there.' : '.'), {ms:8000});
      /* The ghost's lifetime is a stationary one-shot - it renders nothing while it waits - so it is a registry
       * hold rather than a bare timer: RESET, a level change and the tab going away all reach it. */
      var ht = motion.token();
      S.hintTimer = motion.hold(theme.ui.hintGhostMs, function () {
        S.hintTimer = null; S.hintGhost = null;
        if (!destroyed) { refreshGhost(); ui.setHintGhostVisible(false); markDirty(); }
      }, { key: 'hint.ghost', role: 'decorative', attempt: ht.attempt, cancel: function () { S.hintTimer = null; } });
      bump();
    }
    function cancelHint() {
      if (S.hintTimer) { var h = S.hintTimer; S.hintTimer = null; h.cancel(); }
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
      /* THE ONE SCHEDULER TICK, and it belongs exactly here: before anything reads a pose and before render.frame()
       * draws. An animation that completes inside tick() applies its EXACT final state there, so the frame this
       * call belongs to is the frame that draws it. Ticking after the render would show every settled state one
       * frame late and would let a last-frame rounding error be the resting picture for 16 ms. */
      motion.tick();
      if (S.placedDirty) { S.placedDirty = false; retrace(); }
      if (S.status === 'tracing') pollTrace();
      if (render) {
        var flat = render.isFlat();
        if (flat !== S.isFlat) { S.isFlat = flat; bump(); }
        var vt = cam.viewToggle();   /* the button appears, vanishes and flips as pan, zoom and the clamp settle */
        if (vt !== S.viewToggle) { S.viewToggle = vt; S.canFit = !!vt; bump(); }
        if (S.selectedCell && (S.camDirty || render.getCamera().animating)) anchorControls();
        if (S.camDirty && !render.getCamera().animating) saveAttempt();
        S.camDirty = false;
      }
      if (S.version !== S.pushed) { S.pushed = S.version; var vm = getViewModel(); ui.setState(vm); if (learning) learning.update(vm); }
      if (render) render.frame(dt);
    }
    function loop(ts) {
      rafId = 0;
      if (destroyed) return;
      var dt = last ? Math.min(0.05, Math.max(0, (ts - last) / 1000)) : 0;
      last = ts;
      step(dt);
      /* Section 10's measurement. "Target 60 fps DURING ACTIVE MOTION... Do not include stationary holds or
       * background-tab intervals in those samples." So a sample is taken only for the interval between two frames
       * that were BOTH animating - which excludes, by construction and without a special case for any of them:
       * the first frame of every run (dt is 0, because `last` is zeroed the moment the loop stops), a hidden tab,
       * a stationary hold, and a lone repaint for a state push or a stage resize. Those cost what they cost; they
       * are not the 16.7 ms the ladder exists to defend, and letting a layout reflow spend a rung would cut
       * decoration off a machine that is perfectly fast. */
      var animatingNow = motion.needsFrame() || (render && render.needsFrame()) || S.status === 'tracing';
      if (quality && dt > 0 && wasAnimating && animatingNow && !motion.isHidden()) quality.sample(dt * 1000);
      wasAnimating = animatingNow;
      /* THE LINE THE WHOLE BUILD TURNS ON. Keep scheduling frames while - and only while - something is actually
       * moving. Four terms and not one more:
       *   S.dirty                a state change that has not been drawn yet;
       *   status === 'tracing'   the beam finishes INSIDE render.frame(), after pollTrace() ran, so main always
       *                          needs one more frame to leave the tracing state;
       *   motion.needsFrame()    true iff a live WebGL animation is registered. A DOM animation (weather) and a
       *                          stationary hold (the quiet, the victory delay, the reveal's waits) hold nothing
       *                          open, which is what lets the board sleep while the modal is still animating;
       *   render.needsFrame()    the renderer's own clocks - camera rig, beam, target fades, fog arrival, burn.
       * Drop a term and the board freezes mid-animation. Add a term that never goes false - a visible beam, a lit
       * target, an open result panel, a held selection, an unresolved puzzle - and the phone renders for ever.
       * Both failures are invisible in a screenshot, which is why test/motion.frames.mjs measures them. */
      if (S.dirty || S.status === 'tracing' || motion.needsFrame() || (render && render.needsFrame())) requestFrame();
      else last = 0;
    }
    function destroy() {
      if (destroyed) return;
      saveKnown(); saveAttempt();
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0; cancelReveal(); cancelReset(); cancelHint();
      motion.cancelAll(); motion.dispose();
      if (weather) weather.dispose();
      docListeners.forEach(function (l) { document.removeEventListener(l[0], l[1]); });
      if (input) input.detach();
      if (audio) audio.dispose();
      if (render) render.dispose();
      if (learning) learning.destroy();
      ui.destroy();
    }
  }

  root.LaserMain = { __version: 1, start: start };
}(typeof self !== 'undefined' ? self : this));
