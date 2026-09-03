/* Lasers 3D - pure rules engine (DESIGN.md section 3, FROZEN).
 * UMD: browser global `LaserSim`, CommonJS `module.exports`.
 * No DOM, no Three.js, no dependencies. ES2019 (Safari 15).
 *
 * ROW ORDER: terrain is indexed t[y][x]; y = 0 is the SOUTH row.
 * (The spec prose writes t[x][y]; the level schema and every module use t[y][x].)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./pieces.js'));
  } else {
    root.LaserSim = factory(root.LaserPieces);
  }
}(typeof self !== 'undefined' ? self : this, function (Pieces) {
  'use strict';

  var DIRS = { E: { dx: 1, dy: 0 }, N: { dx: 0, dy: 1 }, W: { dx: -1, dy: 0 }, S: { dx: 0, dy: -1 } };
  var H_MAX = 4;
  var MAX_STEPS = 400;
  var ORIENTS = Pieces.ORIENTS;
  var PIECES = Pieces.PIECES;

  function key(x, y) { return x + ',' + y; }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function fail(msg) { throw new Error('lasers-3d level: ' + msg); }

  /* ---------- parseLevel ---------- */

  function parseSize(level) {
    var s = level.size;
    if (!s || !isInt(s.w) || !isInt(s.d) || s.w < 1 || s.d < 1) fail('size must be {w, d} positive integers');
    return { w: s.w, d: s.d };
  }

  function parseTerrain(level, size) {
    var rows = level.terrain;
    if (!Array.isArray(rows) || rows.length !== size.d) fail('terrain must have d=' + size.d + ' rows (got ' + (rows && rows.length) + ')');
    var t = [];
    for (var y = 0; y < size.d; y++) {
      var row = rows[y];
      if (Array.isArray(row)) row = row.join('');
      if (typeof row !== 'string' || row.length !== size.w) fail('terrain row ' + y + ' must be a string of w=' + size.w + ' chars');
      if (!/^[0-3]+$/.test(row)) fail('terrain row ' + y + ' has a char outside 0..3: "' + row + '"');
      var cells = [];
      for (var x = 0; x < size.w; x++) cells.push(row.charCodeAt(x) - 48);
      t.push(cells);
    }
    return t;
  }

  function inGrid(size, x, y) { return isInt(x) && isInt(y) && x >= 0 && y >= 0 && x < size.w && y < size.d; }

  function parseEmitter(level, size) {
    var e = level.emitter;
    if (!e || !inGrid(size, e.x, e.y)) fail('emitter must be on the grid');
    if (!Object.prototype.hasOwnProperty.call(DIRS, e.dir)) fail('emitter dir must be E, N, W or S');
    return { x: e.x, y: e.y, dir: e.dir };
  }

  function parseTargets(level, size, emitter) {
    var list = level.targets;
    if (!Array.isArray(list) || list.length < 1) fail('targets must be a non-empty array');
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var tg = list[i];
      if (!tg || !inGrid(size, tg.x, tg.y)) fail('target ' + i + ' is off the grid');
      var k = key(tg.x, tg.y);
      if (k === key(emitter.x, emitter.y)) fail('target ' + i + ' sits on the emitter');
      if (seen[k]) fail('target ' + i + ' duplicates another target');
      seen[k] = true;
      out.push({ x: tg.x, y: tg.y });
    }
    return out;
  }

  function parseFixed(level, size, emitter, targets) {
    var list = level.fixed || [];
    if (!Array.isArray(list)) fail('fixed must be an array');
    var taken = {};
    taken[key(emitter.x, emitter.y)] = true;
    targets.forEach(function (tg) { taken[key(tg.x, tg.y)] = true; });
    return list.map(function (f, i) {
      if (!f || !inGrid(size, f.x, f.y)) fail('fixed piece ' + i + ' is off the grid');
      if (!Pieces.isType(f.type)) fail('fixed piece ' + i + ' has unknown type ' + f.type);
      if (!Pieces.isOrient(f.orient)) fail('fixed piece ' + i + ' orient must be / or \\');
      var k = key(f.x, f.y);
      if (taken[k]) fail('fixed piece ' + i + ' overlaps the emitter, a target or another fixed piece');
      taken[k] = true;
      return { x: f.x, y: f.y, type: f.type, orient: f.orient, secret: !!f.secret };
    });
  }

  function parseTray(level, par) {
    var tray = level.tray || [];
    if (!Array.isArray(tray)) fail('tray must be an array');
    tray.forEach(function (tp, i) { if (!Pieces.isType(tp)) fail('tray item ' + i + ' has unknown type ' + tp); });
    if (tray.length < par) fail('tray has ' + tray.length + ' pieces but par is ' + par);
    return tray.slice();
  }

  /* Returns a normalized copy. Idempotent: a parsed level is returned as is. */
  function parseLevel(level) {
    if (!level || typeof level !== 'object') fail('level must be an object');
    if (level.parsed === true && Array.isArray(level.t)) return level;
    var size = parseSize(level);
    var par = level.par == null ? 0 : level.par;
    if (!isInt(par) || par < 0) fail('par must be a non-negative integer');
    var emitter = parseEmitter(level, size);
    var targets = parseTargets(level, size, emitter);
    return {
      parsed: true,
      name: String(level.name || ''),
      par: par,
      size: size,
      terrain: Array.isArray(level.terrain) ? level.terrain.slice() : [],
      t: parseTerrain(level, size),
      emitter: emitter,
      targets: targets,
      fixed: parseFixed(level, size, emitter, targets),
      tray: parseTray(level, par),
      intro: level.intro ? String(level.intro) : ''
    };
  }

  /* ---------- canPlace (3.4) ---------- */

  function occupiedMap(L, placed) {
    var occ = {};
    occ[key(L.emitter.x, L.emitter.y)] = 'emitter';
    L.targets.forEach(function (tg) { occ[key(tg.x, tg.y)] = 'target'; });
    L.fixed.forEach(function (f) { occ[key(f.x, f.y)] = 'fixed'; });
    (placed || []).forEach(function (p) { if (p) occ[key(p.x, p.y)] = 'placed'; });
    return occ;
  }

  function canPlace(level, placed, x, y) {
    var L = parseLevel(level);
    if (!inGrid(L.size, x, y)) return false;
    return !occupiedMap(L, placed)[key(x, y)];
  }

  /* ---------- trace (3.2) ---------- */

  function buildPieceMap(L, placed) {
    var map = {};
    (placed || []).forEach(function (p, i) {
      if (!p || !Pieces.isType(p.type)) throw new Error('lasers-3d trace: placed piece ' + i + ' has unknown type ' + (p && p.type));
      if (!Pieces.isOrient(p.orient)) throw new Error('lasers-3d trace: placed piece ' + i + ' orient must be / or \\');
      map[key(p.x, p.y)] = { x: p.x, y: p.y, type: p.type, orient: p.orient, fixed: false };
    });
    L.fixed.forEach(function (f) { // fixed pieces win over an (illegal) placed piece on the same cell
      map[key(f.x, f.y)] = { x: f.x, y: f.y, type: f.type, orient: f.orient, fixed: true };
    });
    return map;
  }

  function buildTargetMap(L) {
    var map = {};
    L.targets.forEach(function (tg, i) { map[key(tg.x, tg.y)] = i; });
    return map;
  }

  function stateKey(s) { return s.x + ',' + s.y + ',' + s.z + ',' + s.d + ',' + s.v; }
  function pt(x, y, z) { return { x: x, y: y, z: z }; }
  function copyState(s) { return { x: s.x, y: s.y, z: s.z, d: s.d, v: s.v }; }

  /* One step from state s. Returns {kind:'enter', state} or {kind:<terminal>}. */
  function advance(L, s) {
    var dir = DIRS[s.d];
    var nx = s.x + dir.dx, ny = s.y + dir.dy, nz = s.z + s.v;
    if (!inGrid(L.size, nx, ny)) return { kind: 'lost-edge' };
    if (nz < 0) return { kind: 'lost-floor' };
    if (nz >= H_MAX) return { kind: 'lost-sky' };
    if (L.t[ny][nx] > nz) return { kind: 'blocked' };
    if (nx === L.emitter.x && ny === L.emitter.y && nz === L.t[ny][nx]) return { kind: 'blocked' }; // emitter body
    return { kind: 'enter', state: { x: nx, y: ny, z: nz, d: s.d, v: s.v } };
  }

  /* Terminal stub: the visual stops at the cell boundary (lost-edge: at the off-grid cell center). */
  function finish(out, s, kind) {
    var dir = DIRS[s.d], to;
    if (kind === 'lost-edge') to = pt(s.x + dir.dx, s.y + dir.dy, s.z + s.v);
    else to = pt(s.x + dir.dx / 2, s.y + dir.dy / 2, s.z);
    out.segments.push({ from: pt(s.x, s.y, s.z), to: to, d: s.d, v: s.v });
    return end(out, kind, to);
  }

  function end(out, kind, at) {
    out.end = kind;
    out.endPoint = pt(at.x, at.y, at.z);
    out.altitudeMarks.push(pt(at.x, at.y, at.z));
    return out;
  }

  /* Piece interaction on entering a cell at level ns.z. Mutates ns (d, v). */
  function applyPiece(L, out, pieces, ns) {
    var p = pieces[key(ns.x, ns.y)];
    if (!p) return;
    if (ns.z !== L.t[ns.y][ns.x]) { out.overflights.push(pt2(ns)); return; }
    var r = Pieces.apply(p.type, p.orient, ns.d);
    out.pieceHits.push({ x: p.x, y: p.y, type: p.type, orient: p.orient, fixed: p.fixed });
    if (r.v !== ns.v) out.altitudeMarks.push(pt(ns.x, ns.y, ns.z));
    ns.d = r.d;
    ns.v = r.v;
  }
  function pt2(s) { return { x: s.x, y: s.y }; }

  /* Target check on entering a cell. Returns true when the beam must stop (all targets lit). */
  function applyTarget(L, out, targets, lit, ns) {
    var ti = targets[key(ns.x, ns.y)];
    if (ti === undefined || ns.z !== L.t[ns.y][ns.x]) return false;
    if (!lit[ti]) { lit[ti] = true; out.hits.push(ti); }
    return out.hits.length === L.targets.length;
  }

  function trace(level, placed) {
    var L = parseLevel(level);
    var pieces = buildPieceMap(L, placed);
    var targets = buildTargetMap(L);
    var out = { segments: [], visited: [], hits: [], allTargetsHit: false, end: null, endPoint: null,
                altitudeMarks: [], pieceHits: [], overflights: [] };
    var s = { x: L.emitter.x, y: L.emitter.y, z: L.t[L.emitter.y][L.emitter.x], d: L.emitter.dir, v: 0 };
    var seen = {}, lit = {};
    seen[stateKey(s)] = true;
    for (var step = 0; step < MAX_STEPS; step++) {
      var r = advance(L, s);
      if (r.kind !== 'enter') return finish(out, s, r.kind);
      var ns = r.state;
      out.segments.push({ from: pt(s.x, s.y, s.z), to: pt(ns.x, ns.y, ns.z), d: s.d, v: s.v });
      out.visited.push(copyState(ns));
      if (applyTarget(L, out, targets, lit, ns)) { out.allTargetsHit = true; return end(out, 'target', ns); }
      applyPiece(L, out, pieces, ns);
      var sk = stateKey(ns);
      if (seen[sk]) return end(out, 'loop', ns);
      seen[sk] = true;
      s = ns;
    }
    return end(out, 'loop', s);
  }

  return { DIRS: DIRS, H_MAX: H_MAX, MAX_STEPS: MAX_STEPS, ORIENTS: ORIENTS, PIECES: PIECES, TURN: Pieces.TURN,
           parseLevel: parseLevel, canPlace: canPlace, trace: trace };
}));
