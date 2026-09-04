/* Lasers 3D - HUD, tray, modals, toasts, progress, viewport (INTERFACES-FRONTEND.md section 3).
 * Global: window.LaserUI. Classic script, ES2019, Safari 15. Adopts the markup shipped in index.html
 * (ids in section 3.3) and builds any missing part from LaserUI.markup() so create() works on a bare #app.
 */
(function () {
  'use strict';
  var doc = document, STORAGE_KEY = 'lasers3d.v1', TYPES = ['MIRROR', 'WEDGE', 'DIP'];
  var LABELS = { MIRROR: 'Mirror', WEDGE: 'Wedge', DIP: 'Dip' };
  /* Stars are three INDEPENDENT criteria (DESIGN.md 3.6), not a rank: a player can solve blind without hitting par.
   * Storing an ordinal count lit the wrong stars back (a hint + a blind solve scored 2 and lit "solve"+"par").
   * Progress therefore stores a flag per criterion; the count exists only for display. `schema` marks the migration
   * from the old numeric form so an existing save is upgraded, never discarded. */
  var STAR_KEYS = ['solved', 'par', 'blind'];
  var SCHEMA = 2;
  var DEFAULT_PROGRESS = function () { return { schema: SCHEMA, currentLevel: 0, highestUnlocked: 0, stars: {}, muted: false }; };
  var STAR_PATH = 'M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z';
  /* Sound control (VISUAL-DIRECTION A7): a 2 px stroked line glyph, not a loudspeaker emoji. */
  var SOUND_SVG = {
    on: '<svg class="icon-sound" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 7.4h2.9L10 4.1v11.8L6.1 12.6H3.2z"/><path d="M13.1 7.6a3.6 3.6 0 0 1 0 4.8"/><path d="M15.7 5.2a7.2 7.2 0 0 1 0 9.6"/></svg>',
    off: '<svg class="icon-sound" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 7.4h2.9L10 4.1v11.8L6.1 12.6H3.2z"/><path d="M13.4 8.1l4.2 4.2"/><path d="M17.6 8.1l-4.2 4.2"/></svg>'
  };
  /* The view button is a two-state toggle (see main.viewToggle): its label names the DESTINATION, never the current
   * state, and is always a word - never colour alone. */
  var VIEW_TOGGLE = {
    overview: { text: 'ALL', aria: 'Zoom out to see the whole board' },
    working: { text: 'ZOOM', aria: 'Zoom in for accurate taps' },
    fit: { text: 'FIT', aria: 'Fit board to screen' }
  };
  var END_TEXT = {
    'target': 'Beam connected!',
    'blocked': 'The beam hit a wall.',
    /* DESIGN.md 13.3: only when the wall the beam struck HAS a way through it. Naming the height the beam was
     * travelling at is what makes an arch or a window solvable without tilting; naming the open level would hand
     * over the answer, so it never does. `{z}` is filled in by LaserMainTrace.readout. */
    'blocked-height': 'The beam hit a wall at height {z}.',
    'lost-edge': 'The beam left the board.',
    'lost-floor': 'The beam fell to the floor.',
    'lost-sky': 'The beam went too high.',
    'loop': 'The beam went round in circles.',
    'over': 'The beam flew over the target.',
    'under': 'The beam passed under the target.'
  };
  /* DESIGN.md 12 (James's correction): a piece adds a pitch DELTA, it does not set one. A beam that is never
   * flattened therefore keeps going up (or down) until it leaves the board, so the readout says which - in words,
   * never by colour alone. Skipped where the end reason already says it ('went too high' / 'fell to the floor'). */
  var PITCH_TEXT = { '1': 'It was still going up.', '-1': 'It was still going down.' };
  var PITCH_OBVIOUS = { 'lost-sky': 1, 'lost-floor': -1 };
  /* The player-facing rule copy lives HERE, not in the piece registry: this is the wording the modal shows, and it
   * has to read comfortably to a six-year-old. MIRROR is the line that changed - it preserves the climb, so only a
   * DIP can flatten a rising beam and only a WEDGE can flatten a falling one. */
  var PIECE_HELP = {
    MIRROR: 'Turns the beam but does not change its climb. A beam that is going up keeps going up, and a beam that is going down keeps going down.',
    WEDGE: 'Turns the beam and tips it up one step: a flat beam starts going up, a beam going down comes back to flat, and a beam going up stays going up.',
    DIP: 'Turns the beam and tips it down one step: a flat beam starts going down, a beam going up comes back to flat, and a beam going down stays going down.'
  };
  var HELP_NOTE = 'Remember: a mirror can never flatten a beam. Only a DIP flattens a beam that is going up, and only a WEDGE flattens a beam that is going down.';
  /* DESIGN.md 13: arches and windows. Same voice as the piece lines above - short sentences, no jargon, and the
   * fair tell of 13.3 named outright, because a shape that is invisible from above is only fair if the player is
   * told what to look for. */
  var SHAPE_HELP = {
    ARCH: 'A tall wall with a gap along the ground. A beam running flat on the floor slides straight underneath it.',
    WINDOW: 'A tall wall with a gap part way up. Only a beam at that one height goes through. A beam at any other height stops.'
  };
  var SHAPE_NOTE = 'From above, an arch and a window look exactly like a solid wall. Watch the floor: a cell with a way through it shows a faint sliver of light. The sliver tells you there is a gap, but not how high the gap is. When a shot stops, the message says what height the beam was at, and that is the number to work from.';

  /* number | {solved,par,blind} | anything -> {solved,par,blind}. An old numeric count of N becomes the first N
   * flags in the order solved, par, blind (the order stars were awarded in). */
  function starFlags(v) {
    var out = { solved: false, par: false, blind: false }, i;
    if (typeof v === 'number' && isFinite(v)) { for (i = 0; i < 3 && i < v; i++) out[STAR_KEYS[i]] = true; return out; }
    if (v && typeof v === 'object') { for (i = 0; i < 3; i++) out[STAR_KEYS[i]] = !!v[STAR_KEYS[i]]; return out; }
    return out;
  }
  function starCount(v) { var f = starFlags(v), n = 0, i; for (i = 0; i < 3; i++) if (f[STAR_KEYS[i]]) n++; return n; }
  function mergeStars(a, b) {
    var x = starFlags(a), y = starFlags(b), i;
    for (i = 0; i < 3; i++) x[STAR_KEYS[i]] = x[STAR_KEYS[i]] || y[STAR_KEYS[i]];
    return x;
  }
  function $(id) { return doc.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function text(el, s) { if (el && el.textContent !== s) el.textContent = s; }
  function attr(el, k, v) { if (!el) return; if (v === null || v === undefined || v === false) { if (el.hasAttribute(k)) el.removeAttribute(k); } else if (el.getAttribute(k) !== String(v)) el.setAttribute(k, String(v)); }
  function call(fns, name) { var f = fns && fns[name]; if (typeof f !== 'function') return undefined; return f.apply(null, Array.prototype.slice.call(arguments, 2)); }
  function fmtCount(n) { return n === 1 ? '1 left' : n + ' left'; }

  function starSvg(earned, blind) {
    var s = '<svg class="star" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" data-earned="' + (earned ? 'true' : 'false') + '"' + (blind ? ' data-blind="true"' : '') + '>' +
      '<path d="' + STAR_PATH + '" fill="' + (earned ? 'url(#l3d-star-grad)' : '#0B1330') + '" stroke="' + (earned ? '#FFE28A' : 'var(--color-star-empty)') + '" stroke-width="1.5" stroke-linejoin="round"/>';
    if (blind) s += '<circle cx="12" cy="12.4" r="2" fill="var(--color-accent)" fill-opacity="0.85" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/>';
    return s + '</svg>';
  }
  /* Each star is drawn from its OWN criterion flag, so a hint + blind solve lights the blind star and leaves par dark. */
  function starsHtml(v) { var f = starFlags(v), h = '', i; for (i = 0; i < 3; i++) h += starSvg(f[STAR_KEYS[i]], i === 2); return h; }
  var LOCK_SVG = '<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="#7893A6" stroke="#A8C0CE" stroke-width="0.8"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#A8C0CE" stroke-width="1.4"/></svg>';

  /* Fallback markup for a bare root (kept in sync with index.html). */
  function markup() {
    function card(t) { return '<button class="tray-card" type="button" data-type="' + t + '" aria-pressed="false" aria-label="' + LABELS[t] + ', 0 left"><span class="tray-icon"><span class="tray-glyph" data-type="' + t + '"></span></span><span class="tray-meta"><span class="tray-label">' + LABELS[t] + '</span><span class="tray-count">0</span></span></button>'; }
    function modal(id, title, body, extra) { return '<div id="' + id + '" class="backdrop" hidden><div class="modal" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title">' + (extra || '') + '<button class="btn btn-icon modal-close" type="button" aria-label="Close ' + title.toLowerCase() + '">&#x2715;</button><h2 id="' + id + '-title"' + (id === 'modal-victory' ? ' class="victory-title"' : '') + '>' + title + '</h2>' + body + '</div></div>'; }
    return {
      hud: '<div id="hud" class="glass"><div class="hud-line"><span class="hud-num" id="hud-level-num">LEVEL 1</span><span class="hud-name" id="hud-level-name">&nbsp;</span></div><div class="hud-line"><span class="stars" id="hud-stars" aria-label="Stars earned"></span><span class="hud-pill" id="hud-camera" data-camera="flat">FLAT</span><span class="hud-pieces" id="hud-pieces">PIECES 0/0</span></div></div>',
      sound: '<button id="sound" class="btn btn-icon" type="button" aria-label="Sound on" aria-pressed="true" data-icon="on"><span class="icon-slot" aria-hidden="true">' + SOUND_SVG.on + '</span></button>',
      readout: '<div id="readout" class="glass" role="status" aria-live="polite" data-kind="info" hidden><span class="readout-msg"></span><span class="readout-chips"></span></div>',
      stageKids: '<div id="piece-controls" hidden><button id="btn-rotate" class="btn btn-icon" type="button" aria-label="Rotate piece"><span aria-hidden="true">&#x21BB;</span></button><button id="btn-remove" class="btn btn-icon btn-danger" type="button" aria-label="Remove piece"><span aria-hidden="true">&#x2715;</span></button></div><div id="toast" class="glass" role="status" aria-live="polite" data-kind="info"></div><div id="webgl-fallback" hidden><div class="glass"><h2 style="margin:0 0 8px;font-size:24px;font-weight:750">3D is not available here</h2><p class="caption">This browser could not start WebGL. The classic 2D game works everywhere.</p><a class="btn btn-selected" href="../mini-games/lasers_mirrors_game.html">Play Lasers and Mirrors (2D)</a></div></div>',
      tray: '<div id="tray" class="glass" aria-label="Piece tray and controls"><div class="tray-cards" role="group" aria-label="Pieces">' + card('MIRROR') + card('WEDGE') + card('DIP') + '</div><div class="tray-actions" role="group" aria-label="Actions"><button id="btn-fire" class="btn btn-primary" type="button" aria-label="Fire the laser">FIRE</button><button id="btn-tilt" class="btn" type="button" aria-label="Tilt the board" aria-pressed="false">TILT</button><button id="btn-fit" class="btn" type="button" aria-label="Fit board to screen" hidden>FIT</button><button id="btn-reset" class="btn" type="button" aria-label="Reset the level">RESET</button><button id="btn-hint" class="btn" type="button" aria-label="Show a hint">HINT</button><button id="btn-undo" class="btn btn-icon tray-side-only" type="button" aria-label="Undo"><span aria-hidden="true">&#x21A9;</span></button><button id="btn-redo" class="btn btn-icon tray-side-only" type="button" aria-label="Redo"><span aria-hidden="true">&#x21AA;</span></button><button id="btn-levels" class="btn tray-side-only" type="button" aria-label="Choose a level">LEVELS</button><button id="btn-help" class="btn tray-side-only" type="button" aria-label="How to play">HELP</button><button id="btn-more" class="btn btn-icon" type="button" aria-label="More controls" aria-expanded="false" aria-controls="more-sheet"><span aria-hidden="true">&#x22EF;</span></button></div><div id="more-sheet" class="glass" hidden role="group" aria-label="More controls"></div></div>',
      modals: modal('modal-help', 'How to play', '<div class="modal-body"></div>') + modal('modal-levels', 'Levels', '<div class="level-grid"></div>') +
        modal('modal-victory', 'Beam Connected', '<div class="victory-stars"></div><div class="victory-stats"></div><div class="modal-actions"></div>', '<div class="light-ring" aria-hidden="true"></div>'),
      defs: '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="l3d-star-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1A6"/><stop offset="1" stop-color="#FFD75A"/></linearGradient></defs></svg>'
    };
  }
  function insertHtml(parent, html, before) { var t = doc.createElement('template'); t.innerHTML = html; while (t.content.firstChild) parent.insertBefore(t.content.firstChild, before || null); }
  function ensureDom(root) {
    var m = markup(), stage = $('stage');
    if (!stage) { stage = doc.createElement('div'); stage.id = 'stage'; root.appendChild(stage); }
    if (!$('board')) { var c = doc.createElement('canvas'); c.id = 'board'; stage.appendChild(c); }
    if (!$('hud')) insertHtml(root, m.hud, stage);
    if (!$('readout')) insertHtml(root, m.readout, stage);
    if (!$('sound')) insertHtml(root, m.sound, stage);
    if (!$('piece-controls')) insertHtml(stage, m.stageKids);
    if (!$('tray')) insertHtml(root, m.tray);
    if (!$('modal-help')) insertHtml(doc.body, m.modals);
    if (!$('l3d-star-grad')) insertHtml(doc.body, m.defs);
  }

  function create(opts) {
    opts = opts || {};
    var root = opts.root || $('app') || doc.body, theme = opts.theme || window.LaserTheme, handlers = opts.handlers || {}, render = opts.render || null;
    var ui = { __version: 1 }, vm = null, viewportCbs = [], timers = {}, iconCache = {}, modalStack = [], openerStack = [], destroyed = false;
    var rm = theme && theme.reducedMotion && window.matchMedia ? window.matchMedia(theme.reducedMotion.mediaQuery).matches : false;
    var scale = rm ? (theme.reducedMotion.durationScale || 0.35) : 1;

    /* theme tokens + page background */
    if (theme && !$('lasers3d-theme')) { var st = doc.createElement('style'); st.id = 'lasers3d-theme'; st.textContent = theme.cssVariables(); doc.head.appendChild(st); }
    if (theme) { doc.body.style.background = theme.pageBackground; doc.body.style.backgroundColor = theme.palette.background; }
    ensureDom(root);
    var el = {}, ids = ['hud', 'hud-level-num', 'hud-level-name', 'hud-camera', 'hud-stars', 'hud-pieces', 'readout', 'sound', 'stage', 'board', 'tray', 'btn-fire', 'btn-tilt', 'btn-fit', 'btn-reset', 'btn-hint', 'btn-undo', 'btn-redo', 'btn-levels', 'btn-help', 'btn-more', 'more-sheet', 'piece-controls', 'btn-rotate', 'btn-remove', 'toast', 'modal-help', 'modal-levels', 'modal-victory', 'webgl-fallback'];
    ids.forEach(function (id) { el[id] = $(id); });
    var cards = {}; Array.prototype.forEach.call(el.tray.querySelectorAll('.tray-card'), function (c) { cards[c.getAttribute('data-type')] = c; });

    /* ------------------------------------------------------------ buttons */
    function wire(id, name) { on(el[id], 'click', function (e) { if (el[id].disabled) return; e.preventDefault(); call(handlers, name); }); }
    wire('btn-fire', 'onFire'); wire('btn-reset', 'onReset'); wire('btn-tilt', 'onTiltToggle'); wire('btn-hint', 'onHint'); wire('btn-fit', 'onFit');
    wire('btn-undo', 'onUndo'); wire('btn-redo', 'onRedo'); wire('sound', 'onSoundToggle'); wire('btn-rotate', 'onRotateSelected'); wire('btn-remove', 'onRemoveSelected');
    on(el['btn-levels'], 'click', function () { closeMore(); if (call(handlers, 'onLevels') !== false) ui.showLevelSelect(); });
    on(el['btn-help'], 'click', function () { closeMore(); if (call(handlers, 'onHelp') !== false) ui.showHowToPlay(); });
    TYPES.forEach(function (t) { on(cards[t], 'click', function () { if (cards[t].disabled) return; call(handlers, 'onTraySelect', vm && vm.selectedTray === t ? null : t); }); });

    /* MORE sheet: on portrait phones it holds Undo / Redo / Levels / Help (moved, not cloned, so ids stay unique) */
    var sideOnly = Array.prototype.slice.call(el.tray.querySelectorAll('.tray-side-only')), actionsRow = el.tray.querySelector('.tray-actions');
    function isDocked() { return el['btn-more'] && getComputedStyle(el['btn-more']).display !== 'none'; }
    function layoutMore() {
      var docked = isDocked();
      sideOnly.forEach(function (b) {
        if (docked) { b.classList.remove('tray-side-only'); if (b.parentNode !== el['more-sheet']) el['more-sheet'].appendChild(b); }
        else { b.classList.add('tray-side-only'); if (b.parentNode !== actionsRow) actionsRow.insertBefore(b, el['btn-more']); }
      });
      if (!docked) closeMore();
    }
    function closeMore() { if (el['more-sheet'] && !el['more-sheet'].hidden) { el['more-sheet'].hidden = true; attr(el['btn-more'], 'aria-expanded', 'false'); } }
    on(el['btn-more'], 'click', function () { var open = el['more-sheet'].hidden; el['more-sheet'].hidden = !open; attr(el['btn-more'], 'aria-expanded', open ? 'true' : 'false'); });
    on(doc, 'pointerdown', function (e) { if (el['more-sheet'].hidden || el.tray.contains(e.target)) return; closeMore(); });

    /* ----------------------------------------------------------- viewport */
    function fitStage() {
      var s = el.stage, vv = window.visualViewport, de = doc.documentElement;
      var w = s.clientWidth, h = s.clientHeight;
      if (vv) { w = Math.min(w, Math.floor(vv.width)); h = Math.min(h, Math.floor(vv.height)); }
      w = Math.max(1, Math.min(w, de.clientWidth)); h = Math.max(1, Math.min(h, de.clientHeight));
      var dpr = Math.min(window.devicePixelRatio || 1, theme && theme.renderer ? theme.renderer.maxDevicePixelRatio : 2);
      el.board.style.width = w + 'px'; el.board.style.height = h + 'px';
      /* The HUD reserves max(--hud-left, --hud-right) on BOTH sides so its panel is centred on the row, so every
       * pixel of --hud-left is paid for twice: keep the gap beside the Menu link tight. */
      var menu = doc.querySelector('a.menu-link'); if (menu) { var mr = menu.getBoundingClientRect().right; if (mr > 0) root.style.setProperty('--hud-left', Math.max(72, Math.ceil(mr) + 4) + 'px'); }
      var info = { width: w, height: h, dpr: dpr };
      layoutMore();
      call(handlers, 'onStageResize', info);
      viewportCbs.forEach(function (cb) { try { cb(info); } catch (e) { /* never break the loop */ } });
      return info;
    }
    var fitQueued = false;
    function queueFit() { if (fitQueued || destroyed) return; fitQueued = true; requestAnimationFrame(function () { fitQueued = false; if (!destroyed) fitStage(); }); }
    on(window, 'resize', queueFit); on(window, 'orientationchange', queueFit);
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', queueFit); window.visualViewport.addEventListener('scroll', queueFit); }
    var ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(queueFit); ro.observe(el.stage); }
    ui.onViewport = function (cb) { if (typeof cb === 'function') viewportCbs.push(cb); return function () { var i = viewportCbs.indexOf(cb); if (i >= 0) viewportCbs.splice(i, 1); }; };
    ui.fitStage = fitStage;

    /* -------------------------------------------------------------- icons */
    function trayIcon(type) {
      if (!render || typeof render.snapshotTrayIcon !== 'function') return '';
      if (iconCache[type] === undefined) { try { iconCache[type] = render.snapshotTrayIcon(type, 88) || ''; } catch (e) { iconCache[type] = ''; } }
      return iconCache[type];
    }
    function iconHtml(type) { var u = trayIcon(type); return u ? '<img src="' + u + '" alt="" draggable="false">' : '<span class="tray-glyph" data-type="' + type + '"></span>'; }

    /* ----------------------------------------------------------- setState */
    ui.setState = function (v) {
      if (!v) return; vm = v;
      var lvl = v.level || {}, par = lvl.par || 0, used = (v.placed || []).length;
      /* `cameraBusy` covers the exclusive camera choreographies (the free reveal, RESET's return to flat and the
       * view toggle): every control that could interrupt them is disabled for their duration. */
      var busy = !!v.revealPlaying || !!v.cameraBusy || v.status === 'tracing';
      var flags = starFlags(v.stars), count = starCount(flags);
      text(el['hud-level-num'], 'LEVEL ' + (v.levelIndex + 1)); attr(el.hud, 'aria-label', 'Level ' + (v.levelIndex + 1) + (v.levelCount ? ' of ' + v.levelCount : ''));
      text(el['hud-level-name'], lvl.name || '');
      attr(el['hud-camera'], 'data-camera', v.isFlat ? 'flat' : 'tilt'); text(el['hud-camera'], v.isFlat ? 'FLAT' : 'TILT');
      var sk = 'stars' + (flags.solved ? 1 : 0) + (flags.par ? 1 : 0) + (flags.blind ? 1 : 0);
      if (el['hud-stars'].getAttribute('data-key') !== sk) { el['hud-stars'].innerHTML = starsHtml(flags); el['hud-stars'].setAttribute('data-key', sk); }
      attr(el['hud-stars'], 'aria-label', count + ' of 3 stars: solve ' + (flags.solved ? 'earned' : 'not earned') +
        ', par ' + (flags.par ? 'earned' : 'not earned') + ', no-tilt ' + (flags.blind ? 'earned' : 'not earned'));
      text(el['hud-pieces'], 'PIECES ' + used + '/' + par);
      attr(el.sound, 'aria-pressed', v.muted ? 'false' : 'true'); attr(el.sound, 'aria-label', v.muted ? 'Sound off' : 'Sound on');
      var si = v.muted ? 'off' : 'on';
      if (el.sound.getAttribute('data-icon') !== si) { el.sound.firstElementChild.innerHTML = SOUND_SVG[si]; el.sound.setAttribute('data-icon', si); }
      ui.setReadout(v.readout);
      TYPES.forEach(function (t) {
        var c = cards[t], n = (v.trayRemaining && v.trayRemaining[t]) | 0, sel = v.selectedTray === t;
        text(c.querySelector('.tray-count'), String(n)); attr(c, 'aria-pressed', sel ? 'true' : 'false'); attr(c, 'aria-label', LABELS[t] + ', ' + fmtCount(n));
        var dis = n === 0 || busy; if (c.disabled !== dis) c.disabled = dis;
        var ic = c.querySelector('.tray-icon'); if (ic.getAttribute('data-src') !== (trayIcon(t) || 'glyph')) { ic.innerHTML = iconHtml(t); ic.setAttribute('data-src', trayIcon(t) || 'glyph'); }
      });
      var lock = !!v.revealPlaying || !!v.cameraBusy;
      el['btn-fire'].disabled = busy || v.status === 'won';   /* 'won' is terminal until an edit, RESET or a level change */
      el['btn-reset'].disabled = lock; el['btn-tilt'].disabled = lock;
      attr(el['btn-tilt'], 'aria-pressed', v.isFlat ? 'false' : 'true'); text(el['btn-tilt'], v.isFlat ? 'TILT' : 'FLAT'); attr(el['btn-tilt'], 'aria-label', v.isFlat ? 'Tilt the board' : 'Snap the board flat');
      /* The view button is a two-state toggle: OVERVIEW shows the whole board, WORKING keeps cells tappable
       * (DESIGN.md 11.2). Its label names where pressing it goes. It is hidden when there is nothing to go to. */
      if (el['btn-fit']) {
        var vt = v.viewToggle || (v.canFit ? 'fit' : null), spec = VIEW_TOGGLE[vt];
        el['btn-fit'].hidden = !spec; el['btn-fit'].disabled = lock;
        if (spec) { text(el['btn-fit'], spec.text); attr(el['btn-fit'], 'aria-label', spec.aria); }
      }
      el['btn-hint'].disabled = busy || v.hintAvailable === false; el['btn-undo'].disabled = busy || !v.canUndo; el['btn-redo'].disabled = busy || !v.canRedo;
      /* S6: nothing may cancel the one-time free reveal - not a level change, not a modal. */
      if (el['btn-levels']) el['btn-levels'].disabled = lock;
      if (el['btn-help']) el['btn-help'].disabled = lock;
      if (el['btn-more']) { el['btn-more'].disabled = lock; if (lock) closeMore(); }
      if (!v.selectedCell) ui.hidePieceControls();
    };

    /* A shot that failed while the beam was still pitched is the single fact the DELTA rule (DESIGN.md 12) makes
     * newly worth saying: nothing levelled it, so it went on climbing (or sinking) until it ran out of board. Say it
     * in words, and only where the end reason has not already said it. */
    function pitchNote(r) {
      var v = r && r.pitch;
      /* `altitude` is set only when a flyover REPLACED the end reason on screen. In that case the visible sentence
       * is "flew over the target", which says nothing about the climb, so the note still earns its place. */
      if (!v || r.kind === 'success' || (!r.altitude && PITCH_OBVIOUS[r.end] === v)) return '';
      return PITCH_TEXT[String(v)] || '';
    }

    /* Post-FIRE result readout (S5/S10): what the beam actually did, in kid language, with the altitude stated as a
     * NUMBER so it works without colour vision. Its own grid row, so it can cover neither the board nor the Menu link. */
    ui.setReadout = function (r) {
      var box = el.readout;
      if (!box) return;
      if (!r || !r.message) { if (!box.hidden) { box.hidden = true; box.removeAttribute('data-key'); } return; }
      var chips = '', A = (theme && theme.ui.readout && theme.ui.readout.altitudePrefix) || '^';
      if (r.altitude) {
        chips += '<span class="chip chip-alt"><span class="chip-k">beam</span><b>' + A + r.altitude.beamZ + '</b></span>' +
                 '<span class="chip chip-alt"><span class="chip-k">target</span><b>' + A + r.altitude.targetZ + '</b></span>';
      }
      if (r.progress) chips += '<span class="chip chip-progress">' + r.progress.lit + ' of ' + r.progress.total + ' lit</span>';
      var msg = r.message + (pitchNote(r) ? ' ' + pitchNote(r) : '');
      var key = r.kind + '|' + msg + '|' + chips;
      if (box.getAttribute('data-key') !== key) {
        box.querySelector('.readout-msg').textContent = msg;
        box.querySelector('.readout-chips').innerHTML = chips;
        box.setAttribute('data-key', key);
      }
      attr(box, 'data-kind', r.kind || 'info');
      if (box.hidden) box.hidden = false;
    };

    /* ----------------------------------------------- piece controls, toast */
    ui.showPieceControls = function (p) {
      var pc = el['piece-controls'], sr = el.stage.getBoundingClientRect(), wasHidden = pc.hidden;
      pc.hidden = false;
      var w = pc.offsetWidth || 96, h = pc.offsetHeight || 44, x = p.screenX - sr.left - w / 2, y = p.screenY - sr.top - h - 14;
      x = Math.max(4, Math.min(sr.width - w - 4, x)); if (y < 4) y = Math.min(sr.height - h - 4, p.screenY - sr.top + 28);
      pc.style.left = Math.round(x) + 'px'; pc.style.top = Math.round(y) + 'px'; pc.setAttribute('data-cell', p.cell ? p.cell.x + ',' + p.cell.y : '');
      /* These controls are revealed by the very tap that selected the piece, and the browser dispatches that tap's
       * `click` AFTER pointerup, against whatever is under the point BY THEN. Near a board edge the clamp can put
       * Rotate exactly there, so the one tap both rotated the piece and clicked Rotate - two rotations, back where
       * it started. Keep them inert until the opening tap is over. Re-anchoring (camera moves) does not re-arm. */
      if (wasHidden) {
        pc.style.pointerEvents = 'none';
        clearTimeout(timers.pieceArm);
        timers.pieceArm = setTimeout(function () { if (!destroyed) pc.style.pointerEvents = ''; }, 260);
      }
    };
    ui.hidePieceControls = function () {
      var pc = el['piece-controls'];
      clearTimeout(timers.pieceArm); pc.style.pointerEvents = '';
      if (!pc.hidden) pc.hidden = true;
    };
    var liveToast = null;   /* { text, kind, ms, at } while a toast is on screen */
    ui.showToast = function (s, o) {
      o = o || {}; var t = el.toast, ms = o.ms || (theme && theme.ui.toastMs) || 2600;
      clearTimeout(timers.toast); t.textContent = s; t.setAttribute('data-kind', o.kind || 'info'); t.classList.add('is-visible');
      liveToast = { text: s, kind: o.kind, ms: ms, at: Date.now() };
      timers.toast = setTimeout(function () { t.classList.remove('is-visible'); liveToast = null; }, ms);
    };
    /* A toast lives inside #stage, BEHIND a modal's backdrop, where it reads as a stray label under the victory or
     * level-select panel. Opening any modal retires it (VISUAL-DIRECTION A5). A toast that still had real time left
     * is resumed when the last modal closes, so the first-launch help modal cannot swallow a level's intro. */
    ui.hideToast = function (keep) {
      clearTimeout(timers.toast);
      if (el.toast) el.toast.classList.remove('is-visible');
      if (!keep) { liveToast = null; return; }
      if (liveToast) {
        var left = liveToast.ms - (Date.now() - liveToast.at);
        liveToast = left > 400 ? { text: liveToast.text, kind: liveToast.kind, ms: left, at: 0 } : null;
      }
    };
    function resumeToast() {
      if (!liveToast || modalStack.length) return;
      var t = liveToast; liveToast = null;
      ui.showToast(t.text, { kind: t.kind, ms: t.ms });
    }
    ui.flashInvalid = function (what) {
      var t = what === 'tray' ? (vm && vm.selectedTray ? cards[vm.selectedTray] : el.tray) : what === 'button:fire' ? el['btn-fire'] : what === 'cell' ? el.stage : el[what.replace('button:', 'btn-')];
      if (!t) return; t.classList.remove('is-invalid'); void t.offsetWidth; t.classList.add('is-invalid');
      setTimeout(function () { t.classList.remove('is-invalid'); }, 400);
    };
    ui.setHintGhostVisible = function (b) { el['btn-hint'].classList.toggle('is-active', !!b); };
    ui.showWebGLFallback = function () { el['webgl-fallback'].hidden = false; el.board.hidden = true; el.tray.hidden = true; el.hud.hidden = true; };

    /* -------------------------------------------------------------- modals */
    function focusables(m) { return Array.prototype.filter.call(m.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])'), function (b) { return !b.disabled && b.offsetParent !== null; }); }
    function openModal(id) {
      var b = el[id], m = b.querySelector('.modal'); if (!b.hidden) return; closeMore(); ui.hidePieceControls(); ui.hideToast(true);
      openerStack.push(doc.activeElement); modalStack.push(id); b.hidden = false;
      var close = m.querySelector('.modal-close'); if (close) close.focus();
      if (modalStack.length === 1) call(handlers, 'onModalOpen');
    }
    function closeModal(id) {
      var b = el[id]; if (b.hidden) return false; b.hidden = true;
      var i = modalStack.indexOf(id); if (i >= 0) { modalStack.splice(i, 1); var op = openerStack.splice(i, 1)[0]; if (op && op.focus && doc.body.contains(op)) { try { op.focus(); } catch (e) { /* ignore */ } } }
      if (modalStack.length === 0) { call(handlers, 'onModalClose'); resumeToast(); }
      return true;
    }
    ['modal-help', 'modal-levels', 'modal-victory'].forEach(function (id) {
      var b = el[id];
      on(b.querySelector('.modal-close'), 'click', function () { closeModal(id); });
      on(b, 'pointerdown', function (e) { if (e.target === b) { b.__downOutside = true; } else b.__downOutside = false; });
      on(b, 'click', function (e) { if (e.target === b && b.__downOutside) closeModal(id); });
      on(b, 'keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeModal(id); return; }
        if (e.key !== 'Tab') return;
        var f = focusables(b.querySelector('.modal')); if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (doc.activeElement === first || !b.contains(doc.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    });
    on(doc, 'keydown', function (e) { if (e.key === 'Escape' && modalStack.length && !el[modalStack[modalStack.length - 1]].contains(e.target)) { e.preventDefault(); ui.closeTopModal(); } });
    ui.isModalOpen = function () { return modalStack.length > 0; };
    ui.closeTopModal = function () { if (!modalStack.length) { if (!el['more-sheet'].hidden) { closeMore(); return true; } return false; } return closeModal(modalStack[modalStack.length - 1]); };

    function beamRow(z) { var c = theme ? theme.beamColors[z] : '#fff', w = theme ? Math.round(theme.beam.levels[z].coreDiameter * 40) + 1 : 2; return '<span class="help-beam" style="--c:' + c + ';--w:' + w + 'px"></span><span class="help-beam-label" style="--c:' + c + '">Z' + z + '</span>'; }

    /* ---- the pitch diagram (DESIGN.md 12) -------------------------------------------------------------------
     * The delta rule is far easier to SEE than to read, so the modal draws it: three side-on panels, each 100 x 102
     * user units, laid out in one 300 x 102 viewBox that scales to whatever the modal is wide (313 CSS px on a
     * 393 px phone, so 1 unit ~ 1 px). Every colour is a theme custom property via the .hd-* classes in the
     * stylesheet - nothing here invents a hue. Geometry: the piece sits at the panel's hinge (50, 40); an arm is
     * 22 units, so a +1 pitch is a true 45-degree segment and a 0 pitch is horizontal. */
    var PITCH_PANELS = [
      { type: 'MIRROR', vIn: 1, vOut: 1, note: 'up stays up' },
      { type: 'DIP', vIn: 1, vOut: 0, note: 'up becomes flat' },
      { type: 'WEDGE', vIn: 0, vOut: 1, note: 'flat becomes up' }
    ];
    /* The piece seen edge-on, as a SOLID body rather than a line: at this size a stroked glyph in the mirror's cyan
     * is hard to tell from the beam crossing it, and a filled slab/ramp also matches VISUAL-DIRECTION's "vertical
     * panel" and "sloped panel" language. Points are offsets from the panel hinge. */
    var PITCH_GLYPH = {
      MIRROR: [[-3, -11], [3, -11], [3, 11], [-3, 11]],   /* upright panel */
      WEDGE: [[-10, 9], [10, 9], [10, -9]],               /* ramp rising to the right */
      DIP: [[-10, -9], [10, 9], [-10, 9]]                 /* ramp falling to the right */
    };
    function pitchPanel(p, i) {
      var ox = i * 100, hx = ox + 50, hy = 40, arm = 22, g = PITCH_GLYPH[p.type], pts = [], j;
      for (j = 0; j < g.length; j++) pts.push((hx + g[j][0]) + ',' + (hy + g[j][1]));
      var sx = ox + 28, sy = hy + p.vIn * arm, ex = ox + 72, ey = hy - p.vOut * arm;
      /* piece first, beam over it: the beam has to read as the thing passing THROUGH the panel. */
      return '<g>' +
        '<line class="hd-ground" x1="' + (ox + 10) + '" y1="70" x2="' + (ox + 90) + '" y2="70"/>' +
        '<polygon class="hd-piece" data-type="' + p.type + '" points="' + pts.join(' ') + '"/>' +
        '<path class="hd-beam" d="M' + sx + ' ' + sy + 'L' + hx + ' ' + hy + 'L' + ex + ' ' + ey + '"/>' +
        '<polygon class="hd-arrow" points="0,-3.4 7.5,0 0,3.4" transform="translate(' + ex + ',' + ey + ') rotate(' + (-45 * p.vOut) + ')"/>' +
        '<text class="hd-name" data-type="' + p.type + '" x="' + hx + '" y="87" text-anchor="middle">' + p.type + '</text>' +
        '<text class="hd-note" x="' + hx + '" y="99" text-anchor="middle">' + p.note + '</text>' +
        '</g>';
    }
    function pitchDiagram() {
      var i, g = '';
      for (i = 0; i < PITCH_PANELS.length; i++) g += pitchPanel(PITCH_PANELS[i], i);
      return '<svg class="help-diagram" viewBox="0 0 300 102" role="img" aria-labelledby="help-diagram-t help-diagram-d" focusable="false">' +
        '<title id="help-diagram-t">What each piece does to the beam\'s climb</title>' +
        '<desc id="help-diagram-d">Seen from the side. A beam already going up meets a mirror and carries on going up at the same slope. ' +
        'The same rising beam meets a dip and comes out flat. A flat beam meets a wedge and starts going up.</desc>' +
        g + '</svg>';
    }

    /* ---- the arch / window diagram (DESIGN.md 13) ------------------------------------------------------------
     * A companion to the pitch diagram above and drawn to the same grid: three 100 x 102 panels in one 300 x 102
     * viewBox, one unit ~ one CSS px on a 393 px phone. The first two are SIDE views on the same ground line as the
     * pitch panels, with one altitude level = 18 units, so the wall bands line up with the beam heights. The third
     * is the view the player actually plays in - straight down - because the whole point of 13.3 is that the tell
     * lives THERE, and a side view can never show it. Every colour is a theme custom property (.ht-* in the
     * stylesheet); the beams take their own altitude's colour and the level-1 beam is drawn fractionally wider,
     * exactly as the board draws it.
     * Geometry: ground y = 70; level k spans y = 70 - 18(k+1) .. 70 - 18k; the wall column is 22 units wide. */
    var HT = { ground: 70, lvl: 18, wallX: 37, wallW: 26 };
    function htBand(k) { return { top: HT.ground - HT.lvl * (k + 1), bot: HT.ground - HT.lvl * k }; }
    function htRect(cls, ox, k0, k1) {   /* a block (or a marked gap) covering levels k0..k1 inclusive */
      var a = htBand(k1).top, b = htBand(k0).bot;
      return '<rect class="' + cls + '" x="' + (ox + HT.wallX) + '" y="' + a + '" width="' + HT.wallW + '" height="' + (b - a) + '" rx="1"/>';
    }
    function htBeam(ox, k, x0, x1, stopped) {   /* a beam running east along level k, from x0 to x1 (panel-local) */
      var y = htBand(k).top + HT.lvl / 2;
      var s = '<path class="ht-beam" data-z="' + k + '" d="M' + (ox + x0) + ' ' + y + 'H' + (ox + x1) + '"/>';
      if (stopped) s += '<rect class="ht-stop" x="' + (ox + x1 - 1.6) + '" y="' + (y - 5.5) + '" width="3.2" height="11" rx="1.6"/>';
      else s += '<polygon class="ht-arrow" data-z="' + k + '" points="0,-3.4 7.5,0 0,3.4" transform="translate(' + (ox + x1) + ',' + y + ')"/>';
      return s;
    }
    function htCaption(ox, name, note) {
      return '<text class="ht-name" x="' + (ox + 50) + '" y="87" text-anchor="middle">' + name + '</text>' +
             '<text class="ht-note" x="' + (ox + 50) + '" y="99" text-anchor="middle">' + note + '</text>';
    }
    /* The light leak, drawn the way render-terrain draws it: a four-point gleam over a soft halo. */
    function htGleam(cx, cy) {
      var i, ang, r, pts = [];
      for (i = 0; i < 8; i++) { ang = -Math.PI / 2 + i * Math.PI / 4; r = (i % 2 === 0) ? 8.5 : 1.6;
        pts.push((cx + Math.cos(ang) * r).toFixed(2) + ',' + (cy + Math.sin(ang) * r).toFixed(2)); }
      return '<circle class="ht-leak-halo" cx="' + cx + '" cy="' + cy + '" r="7.5"/>' +
             '<polygon class="ht-leak" points="' + pts.join(' ') + '"/>';
    }
    function terrainDiagram() {
      var g = '';
      /* 1. ARCH, from the side. The dashed outline is the block that ISN'T there: without it a single-cell arch in
       * cross-section is just a slab hanging in the air, which is true but does not read as a wall you go under. */
      g += '<line class="hd-ground" x1="6" y1="70" x2="94" y2="70"/>' +
           htRect('ht-wall', 0, 1, 2) + htRect('ht-gap', 0, 0, 0) +
           htBeam(0, 0, 6, 90, false) + htCaption(0, 'ARCH', 'goes under');
      /* 2. WINDOW: one beam at the open height threads it, one at the wrong height stops at the wall. */
      g += '<line class="hd-ground" x1="106" y1="70" x2="194" y2="70"/>' +
           htRect('ht-wall', 100, 0, 0) + htRect('ht-wall', 100, 2, 2) + htRect('ht-gap', 100, 1, 1) +
           htBeam(100, 1, 6, 90, false) + htBeam(100, 0, 6, HT.wallX - 1, true) +
           htCaption(100, 'WINDOW', 'one height fits');
      /* 3. FROM ABOVE: the two cells a player really sees, one solid and one not. */
      g += '<rect class="ht-cell" x="212" y="22" width="34" height="34" rx="1"/>' +
           '<rect class="ht-cell" x="254" y="22" width="34" height="34" rx="1"/>' +
           htGleam(271, 39) + htCaption(200, 'FROM ABOVE', 'one is not solid');
      return '<svg class="help-diagram help-diagram-terrain" viewBox="0 0 300 102" role="img" ' +
        'aria-labelledby="help-shapes-t help-shapes-d" focusable="false">' +
        '<title id="help-shapes-t">Arches and windows, and the sliver of light that gives them away</title>' +
        '<desc id="help-shapes-d">Three pictures. First, from the side: a tall wall block hanging above the ground ' +
        'with an empty square marked underneath it, and a beam travelling flat along the floor passing straight ' +
        'under the block. Second, from the side: a wall with an empty square marked part way up. A beam at the ' +
        'height of that gap goes through the wall, while a lower beam runs into the wall and stops dead. Third, ' +
        'looking straight down at two square cells that look identical: the right hand one carries a small four ' +
        'pointed sliver of light in the middle, and that sliver is the only sign that a beam can get through it.' +
        '</desc>' + g + '</svg>';
    }

    function helpBody() {
      function row(t) { return '<div class="help-row">' + iconHtml(t) + '<div><b style="color:var(--color-' + t.toLowerCase() + ')">' + LABELS[t].toUpperCase() + '</b> <span class="caption">' + PIECE_HELP[t] + '</span></div></div>'; }
      /* Terrain shapes have no tray icon to show, so they get a plain labelled line instead of a .help-row. */
      function shapeRow(t) { return '<p class="help-shape"><b>' + t + '</b> <span class="caption">' + SHAPE_HELP[t] + '</span></p>'; }
      return '<p>Steer the laser into every target. Tap a piece in the tray, then tap a cell to place it. Tap a placed piece to rotate it; drag it to move it.</p>' +
        '<p class="caption">All three pieces turn the beam the same way. What changes is the beam\'s height.</p>' +
        row('MIRROR') + row('WEDGE') + row('DIP') +
        '<p class="help-note">' + HELP_NOTE + '</p>' +
        '<p class="caption">Seen from the side:</p>' + pitchDiagram() +
        '<p class="caption">The board looks flat, but it is not. Higher beams are wider and brighter:</p><div class="help-beams">' + beamRow(0) + beamRow(1) + beamRow(2) + beamRow(3) + '</div>' +
        '<p class="caption">Some walls have a way through them:</p>' +
        shapeRow('ARCH') + shapeRow('WINDOW') +
        terrainDiagram() +
        '<p class="help-note">' + SHAPE_NOTE + '</p>' +
        '<p class="caption">Drag the empty board or press TILT to see the real heights. Solve without tilting for the third star ' + starSvg(true, true).replace('class="star"', 'class="star" style="display:inline-block;vertical-align:middle;width:18px;height:18px"') + '.</p>' +
        '<div class="help-keys"><kbd>Arrows</kbd><span>move cursor</span><kbd>Enter</kbd><span>place / rotate</span><kbd>Delete</kbd><span>remove</span><kbd>F</kbd><span>fire</span><kbd>T</kbd><span>tilt</span><kbd>R</kbd><span>reset</span><kbd>Z</kbd><span>undo (shift: redo)</span><kbd>H</kbd><span>hint</span><kbd>0</kbd><span>fit board to screen</span><kbd>1-3</kbd><span>pick a tray piece</span></div>';
    }
    ui.showHowToPlay = function () { el['modal-help'].querySelector('.modal-body').innerHTML = helpBody(); openModal('modal-help'); };
    ui.hideHowToPlay = function () { closeModal('modal-help'); };

    ui.showLevelSelect = function () {
      var p = ui.loadProgress(), grid = el['modal-levels'].querySelector('.level-grid'), levels = opts.levels || window.LEVELS || [];
      var count = (vm && vm.levelCount) || levels.length, cur = vm ? vm.levelIndex : p.currentLevel, h = '', i;
      for (i = 0; i < count; i++) {
        var sf = starFlags(p.stars[String(i)]), st = starCount(sf);
        var locked = i > p.highestUnlocked, state = locked ? 'locked' : i === cur ? 'current' : st > 0 ? 'completed' : 'open';
        var name = levels[i] && levels[i].name ? levels[i].name : 'Level ' + (i + 1);
        h += '<button class="level-tile" type="button" data-index="' + i + '" data-state="' + state + '" aria-label="' + name + (locked ? ', locked' : ', ' + st + ' of 3 stars') + '"' + (locked ? ' aria-disabled="true"' : '') + '>' +
          '<span class="tile-num">' + (i + 1) + '</span>' + (locked ? LOCK_SVG : '<span class="stars" aria-hidden="true">' + starsHtml(sf) + '</span>') + '</button>';
      }
      grid.innerHTML = h; openModal('modal-levels');
    };
    on(el['modal-levels'], 'click', function (e) {
      var t = e.target.closest ? e.target.closest('.level-tile') : null; if (!t || t.getAttribute('data-state') === 'locked') return;
      var idx = parseInt(t.getAttribute('data-index'), 10); closeModal('modal-levels'); call(handlers, 'onSelectLevel', idx);
    });
    ui.hideLevelSelect = function () { closeModal('modal-levels'); };

    ui.showVictory = function (r) {
      r = r || {}; var m = el['modal-victory'], stars = m.querySelector('.victory-stars'), stats = m.querySelector('.victory-stats'), acts = m.querySelector('.modal-actions');
      var vf = starFlags(r.stars);
      stars.innerHTML = starsHtml(vf);
      attr(stars, 'aria-label', starCount(vf) + ' of 3 stars: solve ' + (vf.solved ? 'earned' : 'not earned') +
        ', par ' + (vf.par ? 'earned' : 'not earned') + ', no-tilt ' + (vf.blind ? 'earned' : 'not earned'));
      stats.innerHTML = '<span>PIECES <b>' + (r.piecesUsed | 0) + '/' + (r.par | 0) + '</b></span><span>FIRES <b>' + (r.fires | 0) + '</b></span><span>TILTS <b>' + (r.tiltsUsed | 0) + '</b></span><span>HINT <b>' + (r.hintUsed ? 'used' : 'none') + '</b></span>';
      acts.innerHTML = (r.hasNext !== false ? '<button id="btn-next" class="btn btn-success" type="button" aria-label="Next level">NEXT LEVEL</button>' : '') +
        '<button id="btn-replay" class="btn" type="button" aria-label="Replay this level">REPLAY</button><button id="btn-victory-levels" class="btn" type="button" aria-label="Choose a level">LEVELS</button>';
      on($('btn-next'), 'click', function () { closeModal('modal-victory'); call(handlers, 'onNextLevel'); });
      on($('btn-replay'), 'click', function () { closeModal('modal-victory'); call(handlers, 'onRetryLevel'); });
      on($('btn-victory-levels'), 'click', function () { closeModal('modal-victory'); ui.showLevelSelect(); });
      var ring = m.querySelector('.light-ring'); if (ring) { var clone = ring.cloneNode(true); ring.parentNode.replaceChild(clone, ring); }
      openModal('modal-victory');
      var delays = (theme && theme.ui.victory.starDelaysMs) || [0, 180, 360];
      Array.prototype.forEach.call(stars.querySelectorAll('.star[data-earned="true"]'), function (s, i) { setTimeout(function () { s.classList.add('is-awarded'); }, Math.round(delays[i] * scale)); });
      var next = $('btn-next'); if (next) next.focus();
    };
    ui.hideVictory = function () { closeModal('modal-victory'); };

    /* ------------------------------------------------------------ progress */
    /* Extra keys are kept (DESIGN.md 3.6 tolerates them) but every key main.js indexes into must be a plain object,
     * so a corrupt value such as `"intros": "x"` can never make a later `progress.intros[key] = true` throw. */
    function plainObject(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    ui.loadProgress = function () {
      var p = DEFAULT_PROGRESS();
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return p;
        var j = JSON.parse(raw); if (!j || typeof j !== 'object' || Array.isArray(j)) return p;
        Object.keys(j).forEach(function (k) { if (k !== '__proto__') p[k] = j[k]; });
        p.currentLevel = Math.max(0, j.currentLevel | 0); p.highestUnlocked = Math.max(0, j.highestUnlocked | 0); p.muted = !!j.muted;
        /* Schema 1 stored an ordinal count per level; schema 2 stores the three criterion flags. starFlags()
         * migrates a count of N to the first N flags (solved, par, blind), so no earned star is lost. */
        p.stars = plainObject(j.stars);
        Object.keys(p.stars).forEach(function (k) { p.stars[k] = starFlags(p.stars[k]); });
        p.schema = SCHEMA;
        ['intros', 'revealed'].forEach(function (k) { if (p[k] !== undefined) p[k] = plainObject(p[k]); });
      } catch (e) { return DEFAULT_PROGRESS(); }
      return p;
    };
    ui.saveProgress = function (p) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p || DEFAULT_PROGRESS())); } catch (e) { /* quota / private mode */ } };
    ui.hasProgress = function () { try { return window.localStorage.getItem(STORAGE_KEY) !== null; } catch (e) { return true; } };

    ui.destroy = function () {
      destroyed = true; if (ro) ro.disconnect(); window.removeEventListener('resize', queueFit); window.removeEventListener('orientationchange', queueFit);
      if (window.visualViewport) { window.visualViewport.removeEventListener('resize', queueFit); window.visualViewport.removeEventListener('scroll', queueFit); }
      Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); }); viewportCbs.length = 0;
    };

    /* first run: How-to-play opens once; the flag lives in progress (DESIGN.md 3.6 tolerates extra keys) */
    fitStage();
    if (opts.autoHelp !== false) {
      var prog = ui.loadProgress();
      if (!ui.hasProgress() || !prog.seenHelp) { prog.seenHelp = true; ui.saveProgress(prog); timers.help = setTimeout(function () { if (!destroyed) ui.showHowToPlay(); }, 0); }
    }
    return ui;
  }

  window.LaserUI = { __version: 1, create: create, markup: markup, starSvg: starSvg, starsHtml: starsHtml,
    starFlags: starFlags, starCount: starCount, mergeStars: mergeStars, endText: END_TEXT,
    pieceHelp: PIECE_HELP, helpNote: HELP_NOTE, pitchText: PITCH_TEXT,
    STAR_KEYS: STAR_KEYS, SCHEMA: SCHEMA, STORAGE_KEY: STORAGE_KEY };
}());
