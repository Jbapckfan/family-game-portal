/* Lasers 3D - pure rules engine (DESIGN.md section 3, as corrected by section 12).
 * UMD: browser global `LaserSim`, CommonJS `module.exports`.
 * No DOM, no Three.js, no dependencies. ES2019 (Safari 15).
 *
 * ROW ORDER: terrain is indexed t[y][x]; y = 0 is the SOUTH row.
 * (The spec prose writes t[x][y]; the level schema and every module use t[y][x].)
 *
 * ARCHES AND WINDOWS (DESIGN.md section 13, extends 3.1 and 3.2). Terrain is a HEIGHT FIELD, so a
 * column is solid at every level below `t` and neither an overhang nor a hole through a wall can
 * exist. A level may now carry an `openings` array naming levels punched OUT of specific columns:
 *
 *   openings: [ { x: 4, y: 9, levels: [0] } ]   // this column is NOT solid at these levels
 *
 * The whole rule change is one clause of the blocked test (13.2):
 *
 *   BLOCKED when  z' < t[next]  AND  z' is not one of that column's open levels.
 *
 * parseLevel normalises `openings` into `openMask[y][x]`, a per-column BITMASK (bit z set = level z
 * is open), so the stepper's test is one shift and one AND. A level with no `openings` gets an
 * all-zero mask, the second clause is never true, and the engine behaves EXACTLY as it did before -
 * which test/sim.test.mjs proves byte-for-byte against a corpus captured from the pre-openings
 * engine (test/fixtures/pre-openings-traces.json).
 *
 * Nothing else in section 3 moves: pitch is still the DELTA of section 12, a piece still sits on the
 * column TOP at `t` and acts only at that level, and nothing may be placed inside an opening - which
 * needs no new rule, because a piece only ever exists at `t` and every open level is strictly below it.
 *
 * FLOOR MIRRORS (DESIGN.md section 14). The registry now carries a piece that does NOT turn the beam:
 * a FLOOR plate lies flat in the cell's top surface, reflects a beam arriving with pitch -1 back up
 * at +1 with the HEADING UNCHANGED, and does nothing at all to a level or climbing beam. The stepper
 * does not know that. It asks LaserPieces.apply(type, orient, d, v) for the outgoing (d, v) exactly as
 * before and compares the answer with what came in:
 *   - different            -> the piece ACTED: a `piece` event, a `pitch` event if v moved, and, when
 *                             the heading did not move, a `bounce` event and an entry in `bounces`
 *                             (the bright dot of 14.3, where the beam meets its own floor shadow);
 *   - identical            -> the piece had no purchase on this beam: a `glide` event and an entry in
 *                             `glides`. The beam carries on untouched, exactly as if the cell were bare.
 * `glide` is the third way to MISS a piece, alongside `overflight` (over it) and `underpass` (under
 * it, through an opening). It is reported separately because it is a different thing on screen: the
 * beam is at the plate's own level, skimming its surface, rather than passing it at another height.
 *
 * DARKNESS (DESIGN.md section 15). A level may carry `dark: true`. It is a RENDERING flag - the rules
 * engine does not read it - so parseLevel validates it (a boolean, if present) and carries it through
 * on the parsed level, and nothing in the stepper changes.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports && typeof require === 'function') {
    module.exports = factory(require('./pieces.js'));
  } else {
    root.LaserSim = factory(root.LaserPieces || (typeof module === 'object' ? module.exports : undefined));
  }
}(typeof self !== 'undefined' ? self : this, function (Pieces) {
  'use strict';

  var DIRS = { E: { dx: 1, dy: 0 }, N: { dx: 0, dy: 1 }, W: { dx: -1, dy: 0 }, S: { dx: 0, dy: -1 } };
  var H_MAX = 4;
  var N_DIRS = 4;
  var N_PITCHES = 3;
  /* MINIMUM step cap. The real per-level cap is derived from the finite state space
   * (see stepCap): it must exceed w * d * H_MAX * 4 directions * 3 pitches so that the
   * (x,y,z,d,v) repeat guard - which is what actually guarantees termination - always
   * fires first. MAX_STEPS is only the floor for tiny boards. */
  var MAX_STEPS = 400;
  var ORIENTS = Pieces.ORIENTS;
  var PIECES = Pieces.PIECES;

  function key(x, y, side) { return x + ',' + y + (side === 'below' ? ',below' : ''); }
  function sideOf(z) { return z < 0 ? 'below' : undefined; }
  function withSide(out, source) { if (source.side === 'below') out.side = 'below'; return out; }
  // Heights on each face extend OUTWARD from the same floor. Beam centres sit half a cell
  // off the surface: world height = z + .5, so underside height h has logical z = -h-1.
  function heightAt(L, x, y, side) { return side === 'below' && L.duplex ? -L.duplex.lower[y][x] - 1 : L.t[y][x]; }
  function inHole(L, x, y, margin) {
    return !!L.duplex && L.duplex.holes.some(function (h) { return x > h.x - 0.5 + margin && x < h.x + h.w - 0.5 - margin && y > h.y - 0.5 + margin && y < h.y + h.d - 0.5 - margin; });
  }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function fail(msg) { throw new Error('lasers-3d level: ' + msg); }

  /* Distinct beam states on a w x d board, + 1. A trace can never reach it. */
  function capForSize(size, duplex) {
    var n = size.w * size.d * H_MAX * (duplex ? 2 : 1) * N_DIRS * N_PITCHES + 1;
    return n > MAX_STEPS ? n : MAX_STEPS;
  }

  /* ---------- parseLevel ---------- */

  /* Private brand: a caller cannot forge membership, so `parsed: true` is a label, not a trust token. */
  var PARSED = new WeakSet();

  function parseSize(level) {
    var s = level.size;
    if (!s || !isInt(s.w) || !isInt(s.d) || s.w < 1 || s.d < 1) fail('size must be {w, d} positive integers');
    return { w: s.w, d: s.d };
  }

  /* Returns { t: number[d][w], terrain: string[d] } - always canonical strings. */
  function parseTerrain(level, size) {
    var rows = level.terrain;
    if (!Array.isArray(rows) || rows.length !== size.d) fail('terrain must have d=' + size.d + ' rows (got ' + (rows && rows.length) + ')');
    var t = [], text = [];
    for (var y = 0; y < size.d; y++) {
      var row = rows[y], cells = [], x, n;
      if (Array.isArray(row)) {
        if (row.length !== size.w) fail('terrain row ' + y + ' must have w=' + size.w + ' cells (got ' + row.length + ')');
        for (x = 0; x < size.w; x++) {
          n = row[x];
          if (!isInt(n) || n < 0 || n > 3) fail('terrain row ' + y + ' cell ' + x + ' must be an integer 0..3');
          cells.push(n);
        }
      } else {
        if (typeof row !== 'string' || row.length !== size.w) fail('terrain row ' + y + ' must be a string of w=' + size.w + ' chars');
        if (!/^[0-3]+$/.test(row)) fail('terrain row ' + y + ' has a char outside 0..3: "' + row + '"');
        for (x = 0; x < size.w; x++) cells.push(row.charCodeAt(x) - 48);
      }
      t.push(cells);
      text.push(cells.join(''));
    }
    return { t: t, terrain: text };
  }

  function inGrid(size, x, y) { return isInt(x) && isInt(y) && x >= 0 && y >= 0 && x < size.w && y < size.d; }

  /* ---------- openings (DESIGN.md 13.1) ----------
   * Returns { openings: [{x, y, levels:[asc ints]}], openMask: number[d][w] }.
   * openMask[y][x] has bit z set when level z of that column is NOT solid. An absent or empty
   * `openings` gives an all-zero mask, which is exactly the old height-field behaviour.
   *
   * ARCH   t = 3, levels [0]  - solid at 1 and 2; a floor beam passes UNDER it, a beam at 1 or 2 is
   *                             blocked, a beam at 3 flies over as before.
   * WINDOW t = 3, levels [1]  - solid at 0 and 2; only a beam at level 1 threads it.
   * Both are pixel-identical to a solid column from directly above: the top surface is untouched. */
  function parseOpenings(level, size, t) {
    var raw = level.openings;
    var mask = [], y, x;
    for (y = 0; y < size.d; y++) { mask.push([]); for (x = 0; x < size.w; x++) mask[y].push(0); }
    if (raw == null) return { openings: [], openMask: mask };
    if (!Array.isArray(raw)) fail('openings must be an array of { x, y, levels }');
    var out = [], seenCol = {};
    for (var i = 0; i < raw.length; i++) {
      var o = raw[i];
      if (!o || typeof o !== 'object') fail('openings[' + i + '] must be an object { x, y, levels }');
      if (!inGrid(size, o.x, o.y)) fail('openings[' + i + '] must name an on-grid column, got (' + o.x + ',' + o.y + ')');
      var k = key(o.x, o.y);
      if (seenCol[k]) fail('openings[' + i + '] duplicates the column (' + o.x + ',' + o.y + ') of an earlier entry; put every level of a column in one entry');
      seenCol[k] = true;
      var top = t[o.y][o.x];
      var levels = o.levels;
      if (!Array.isArray(levels) || levels.length === 0) fail('openings[' + i + '] levels must be a non-empty array of integers 0..3');
      var seenLvl = {}, list = [];
      for (var j = 0; j < levels.length; j++) {
        var z = levels[j];
        if (!isInt(z) || z < 0 || z >= H_MAX) fail('openings[' + i + '] levels[' + j + '] must be an integer 0..' + (H_MAX - 1) + ', got ' + z);
        if (z >= top) fail('openings[' + i + '] levels[' + j + '] is ' + z + ', which is not strictly below the height t=' + top + ' of column (' + o.x + ',' + o.y + ')');
        if (seenLvl[z]) fail('openings[' + i + '] repeats level ' + z);
        seenLvl[z] = true;
        list.push(z);
      }
      list.sort(function (a, b) { return a - b; });
      for (var m = 0; m < list.length; m++) mask[o.y][o.x] |= (1 << list[m]);
      out.push({ x: o.x, y: o.y, levels: list });
    }
    return { openings: out, openMask: mask };
  }

  /* True when level z of column (x, y) has been punched out (DESIGN.md 13.1). */
  function isOpen(level, x, y, z) {
    var L = parseLevel(level);
    if (!inGrid(L.size, x, y) || !isInt(z) || z < 0 || z >= H_MAX) return false;
    return ((L.openMask[y][x] >> z) & 1) === 1;
  }

  function parseEmitter(level, size) {
    var e = level.emitter;
    if (!e || !inGrid(size, e.x, e.y)) fail('emitter must be on the grid');
    if (!Object.prototype.hasOwnProperty.call(DIRS, e.dir)) fail('emitter dir must be E, N, W or S');
    return withSide({ x: e.x, y: e.y, dir: e.dir }, e);
  }

  function parseTargets(level, size, emitter) {
    var list = level.targets;
    if (!Array.isArray(list) || list.length < 1) fail('targets must be a non-empty array');
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var tg = list[i];
      if (!tg || !inGrid(size, tg.x, tg.y)) fail('target ' + i + ' is off the grid');
      var k = key(tg.x, tg.y, tg.side);
      if (k === key(emitter.x, emitter.y, emitter.side)) fail('target ' + i + ' sits on the emitter');
      if (seen[k]) fail('target ' + i + ' duplicates another target');
      seen[k] = true;
      out.push(withSide({ x: tg.x, y: tg.y }, tg));
    }
    return out;
  }

  function parseFixed(level, size, emitter, targets) {
    var list = level.fixed || [];
    if (!Array.isArray(list)) fail('fixed must be an array');
    var taken = {};
    taken[key(emitter.x, emitter.y, emitter.side)] = true;
    targets.forEach(function (tg) { taken[key(tg.x, tg.y, tg.side)] = true; });
    return list.map(function (f, i) {
      if (!f || !inGrid(size, f.x, f.y)) fail('fixed piece ' + i + ' is off the grid');
      if (!Pieces.isType(f.type)) fail('fixed piece ' + i + ' has unknown type ' + f.type);
      if (!Pieces.isOrient(f.orient)) fail('fixed piece ' + i + ' orient must be / or \\');
      var k = key(f.x, f.y, f.side);
      if (taken[k]) fail('fixed piece ' + i + ' overlaps the emitter, a target or another fixed piece');
      taken[k] = true;
      return withSide({ x: f.x, y: f.y, type: f.type, orient: f.orient, secret: !!f.secret }, f);
    });
  }

  /* ---------- dark (DESIGN.md 15.1) ----------
   * An OPTIONAL boolean. Absent, null and undefined all mean false; anything that is not a boolean
   * is a mistake and throws rather than being coerced, because `dark: 'false'` reading as true is
   * exactly the sort of quiet bug a level file should not be able to ship. The engine itself never
   * reads it - darkness gates WHEN the player sees the board, never what the beam does. */
  function parseDark(level) {
    var v = level.dark;
    if (v == null) return false;
    if (typeof v !== 'boolean') fail('dark must be true or false when present, got ' + typeof v);
    return v;
  }

  function parseTray(level, par) {
    var tray = level.tray || [];
    if (!Array.isArray(tray)) fail('tray must be an array');
    tray.forEach(function (tp, i) { if (!Pieces.isType(tp)) fail('tray item ' + i + ' has unknown type ' + tp); });
    if (tray.length < par) fail('tray has ' + tray.length + ' pieces but par is ' + par);
    return tray.slice();
  }

  /* Returns a normalized copy. Idempotent for levels THIS module parsed (private brand);
   * a hand-made object claiming `parsed: true` is validated like any other raw level. */
  function parseLevel(level) {
    if (!level || typeof level !== 'object') fail('level must be an object');
    if (PARSED.has(level)) return level;
    var size = parseSize(level);
    [level.emitter].concat(level.targets || [], level.fixed || []).forEach(function (p) {
      if (p && p.side != null && p.side !== 'above' && p.side !== 'below') fail('side must be above or below');
      if (p && p.side === 'below' && !level.duplex) fail('below actors require a duplex board');
    });
    var par = level.par == null ? 0 : level.par;
    if (!isInt(par) || par < 0) fail('par must be a non-negative integer');
    var emitter = parseEmitter(level, size);
    var targets = parseTargets(level, size, emitter);
    var terr = parseTerrain(level, size);
    var open = parseOpenings(level, size, terr.t);
    var out = {
      parsed: true,
      name: String(level.name || ''),
      par: par,
      size: size,
      terrain: terr.terrain,
      t: terr.t,
      openings: open.openings,
      openMask: open.openMask,
      emitter: emitter,
      targets: targets,
      fixed: parseFixed(level, size, emitter, targets),
      tray: parseTray(level, par),
      intro: level.intro ? String(level.intro) : '',
      dark: parseDark(level)
    };
    if (level.duplex != null) {
      var d = level.duplex;
      if (!d || typeof d !== 'object' || !Array.isArray(d.holes) || !d.holes.length) fail('duplex requires lower terrain and holes');
      var lower = parseTerrain({terrain:d.lower}, size);
      var lowerOpen = parseOpenings({openings:d.openings},size,lower.t);
      var cells = {};
      var holes = d.holes.map(function(h) {
        if (!h || !inGrid(size,h.x,h.y) || !isInt(h.w) || !isInt(h.d) || h.w < 1 || h.d < 1 || h.x+h.w > size.w || h.y+h.d > size.d) fail('hole rectangle must fit the board');
        for (var y=h.y;y<h.y+h.d;y++) for (var x=h.x;x<h.x+h.w;x++) {
          if (cells[key(x,y)] || terr.t[y][x] !== 0 || lower.t[y][x] !== 0) fail('holes cannot overlap or cut terrain on either face');
          cells[key(x,y)] = true;
        }
        return {x:h.x,y:h.y,w:h.w,d:h.d};
      });
      out.duplex = {lower:lower.t, holes:holes, openings:lowerOpen.openings, openMask:lowerOpen.openMask};
      [out.emitter].concat(out.targets,out.fixed).forEach(function(p) {
        if (inHole(out,p.x,p.y,0)) fail('actor cannot sit in a hole on either face');
      });
    }
    PARSED.add(out);
    return out;
  }

  /* Derived per-level loop-guard step cap (>= MAX_STEPS). Accepts a raw or parsed level. */
  function stepCap(level) { var L = parseLevel(level); return capForSize(L.size, L.duplex); }

  /* ---------- canPlace (3.4) ----------
   * Unchanged by section 13. Placement is per CELL and a piece always sits on the column TOP at `t`,
   * so an opening - which is strictly below `t` - can never be placed in and never makes a column
   * placeable at any other level. A beam threading an opening passes UNDER any piece on that column. */

  function occupiedMap(L, placed) {
    var occ = {};
    occ[key(L.emitter.x, L.emitter.y, L.emitter.side)] = 'emitter';
    L.targets.forEach(function (tg) { occ[key(tg.x, tg.y, tg.side)] = 'target'; });
    L.fixed.forEach(function (f) { occ[key(f.x, f.y, f.side)] = 'fixed'; });
    (Array.isArray(placed) ? placed : []).forEach(function (p) { if (p) occ[key(p.x, p.y, p.side)] = 'placed'; });
    return occ;
  }

  function canPlace(level, placed, x, y, side) {
    var L = parseLevel(level);
    if (!inGrid(L.size, x, y)) return false;
    if (side != null && side !== 'above' && side !== 'below') return false;
    if (side === 'below' && !L.duplex) return false;
    if (inHole(L,x,y,0)) return false;
    return !occupiedMap(L, placed)[key(x, y, side)];
  }

  /* ---------- trace (3.2) ---------- */

  function buildPieceMap(L, placed) {
    var map = {};
    (Array.isArray(placed) ? placed : []).forEach(function (p, i) {
      if (!p || !Pieces.isType(p.type)) throw new Error('lasers-3d trace: placed piece ' + i + ' has unknown type ' + (p && p.type));
      if (!Pieces.isOrient(p.orient)) throw new Error('lasers-3d trace: placed piece ' + i + ' orient must be / or \\');
      if ((L.duplex && !inGrid(L.size,p.x,p.y)) || (p.side != null && p.side !== 'above' && p.side !== 'below') || (p.side === 'below' && !L.duplex) || inHole(L,p.x,p.y,0)) throw new Error('lasers-3d trace: invalid piece surface');
      map[key(p.x, p.y, p.side)] = withSide({ x: p.x, y: p.y, type: p.type, orient: p.orient, fixed: false }, p);
    });
    L.fixed.forEach(function (f) { // fixed pieces win over an (illegal) placed piece on the same cell
      map[key(f.x, f.y, f.side)] = withSide({ x: f.x, y: f.y, type: f.type, orient: f.orient, fixed: true }, f);
    });
    return map;
  }

  function buildTargetMap(L) {
    var map = {};
    L.targets.forEach(function (tg, i) { map[key(tg.x, tg.y, tg.side)] = i; });
    return map;
  }

  function stateKey(s) { return s.x + ',' + s.y + ',' + s.z + ',' + s.d + ',' + s.v; }
  function pt(x, y, z) { return { x: x, y: y, z: z }; }
  function copyState(s) { return { x: s.x, y: s.y, z: s.z, d: s.d, v: s.v }; }

  /* Ordered, step-indexed event stream (see INTERFACES 2.2). `step` is the index of the
   * segment that produced the event, so a renderer can drive timing from arc length. */
  function emit(out, kind, step, x, y, z, extra) {
    var e = { kind: kind, step: step, x: x, y: y, z: z }, k;
    if (extra) for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) e[k] = extra[k];
    out.events.push(e);
  }

  /* One step from state s. Returns {kind:'enter', state} or {kind:<terminal>}. */
  function advance(L, s) {
    var dir = DIRS[s.d];
    var nx = s.x + dir.dx, ny = s.y + dir.dy, nz = s.z + s.v;
    if (!inGrid(L.size, nx, ny)) return { kind: 'lost-edge' };
    if (nz < (L.duplex ? -4 : 0)) return { kind: 'lost-floor' };
    if (L.duplex && (s.z < 0) !== (nz < 0)) {
      var k = (-0.5 - s.z) / s.v;
      if (!inHole(L, s.x + dir.dx*k, s.y + dir.dy*k, 0.12)) return {kind:'blocked-board'};
    }
    if (nz >= H_MAX) return { kind: 'lost-sky' };
    /* THE BLOCKED TEST (DESIGN.md 13.2): solid below the column top, UNLESS this level is punched out.
     * openMask is all zeros on a level with no `openings`, so this is the old test exactly. */
    if (nz < 0 ? heightAt(L,nx,ny,'below') < nz && !((L.duplex.openMask[ny][nx] >> (-nz-1)) & 1) : L.t[ny][nx] > nz && !((L.openMask[ny][nx] >> nz) & 1)) return { kind: 'blocked' };
    if (nx === L.emitter.x && ny === L.emitter.y && nz === heightAt(L,nx,ny,L.emitter.side)) return { kind: 'blocked' }; // emitter body
    return { kind: 'enter', state: { x: nx, y: ny, z: nz, d: s.d, v: s.v } };
  }

  /* Terminal stub: the visual stops at the cell boundary (lost-edge: at the off-grid cell center). */
  function finish(out, s, kind) {
    var dir = DIRS[s.d], to;
    if (kind === 'lost-edge') to = pt(s.x + dir.dx, s.y + dir.dy, s.z + s.v);
    else to = pt(s.x + dir.dx / 2, s.y + dir.dy / 2, kind === 'blocked-board' ? -0.5 : s.z);
    out.segments.push({ from: pt(s.x, s.y, s.z), to: to, d: s.d, v: s.v });
    return end(out, kind, to);
  }

  function end(out, kind, at) {
    out.end = kind;
    out.endPoint = pt(at.x, at.y, at.z);
    out.altitudeMarks.push(pt(at.x, at.y, at.z));
    emit(out, 'end', out.segments.length - 1, at.x, at.y, at.z, { end: kind });
    return out;
  }

  /* Piece interaction on entering a cell at level ns.z. Mutates ns (d, v).
   * A piece is only ever MET at the column top (z === t). Otherwise the beam misses it, and there are
   * two ways to miss: OVER the piece (z > t, the old hidden-information beat) or, since section 13,
   * UNDER it (z < t, only reachable through an opening). They are reported separately because they
   * are different events on screen and a consumer that treats an under-pass as a fly-over would put
   * the reveal camera - and the readout - on the wrong side of the block.
   *
   * Meeting a piece is not the same as being CHANGED by one (DESIGN.md 14.1). The whole transform is
   * data in the registry - `turn` for the heading, `dPitch` or `pitch` for the climb, the clamp of
   * spec 12.2 applied centrally - so the stepper simply asks for the outgoing (d, v) and compares:
   *   changed   -> the piece acted. `piece`, plus `pitch` when the climb moved, plus `bounce` when the
   *                HEADING did not (a floor plate flipping a falling beam back up: the beam meets its
   *                own floor shadow there, which is the bright dot of 14.3).
   *   unchanged -> the piece had no purchase on this beam (a FLOOR under a level or climbing beam).
   *                `glide`, and the beam carries on exactly as if the cell were bare.
   * No piece type is named here, so a fifth piece is still one registry entry. */
  function applyPiece(L, out, pieces, ns, step) {
    var p = pieces[key(ns.x, ns.y, sideOf(ns.z))];
    if (!p) return;
    if (ns.z !== heightAt(L,ns.x,ns.y,sideOf(ns.z))) {
      var under = ns.z < 0 ? ns.z > heightAt(L,ns.x,ns.y,'below') : ns.z < heightAt(L,ns.x,ns.y);
      (under ? out.underpasses : out.overflights).push(pt2(ns));
      emit(out, under ? 'underpass' : 'overflight', step, ns.x, ns.y, ns.z, { type: p.type, orient: p.orient, fixed: p.fixed });
      return;
    }
    var straight = PIECES[p.type].split ? copyState(ns) : null;
    var outward = ns.z < 0 ? -1 : 1;
    var r = Pieces.apply(p.type, p.orient, ns.d, ns.v * outward);
    r.v = r.v * outward || 0;
    if (r.d === ns.d && r.v === ns.v) {
      out.glides.push(pt2(ns));
      emit(out, 'glide', step, ns.x, ns.y, ns.z, { type: p.type, orient: p.orient, fixed: p.fixed, d: ns.d, v: ns.v });
      return;
    }
    out.pieceHits.push(withSide({ x: p.x, y: p.y, type: p.type, orient: p.orient, fixed: p.fixed }, p));
    emit(out, 'piece', step, ns.x, ns.y, ns.z,
         { type: p.type, orient: p.orient, fixed: p.fixed, dIn: ns.d, dOut: r.d, vIn: ns.v, vOut: r.v });
    if (r.v !== ns.v) {
      out.altitudeMarks.push(pt(ns.x, ns.y, ns.z));
      emit(out, 'pitch', step, ns.x, ns.y, ns.z, { from: ns.v, to: r.v });
      if (r.d === ns.d) {
        out.bounces.push(pt(ns.x, ns.y, ns.z));
        emit(out, 'bounce', step, ns.x, ns.y, ns.z, { type: p.type, fixed: p.fixed, d: ns.d, vIn: ns.v, vOut: r.v });
      }
    }
    ns.d = r.d;
    ns.v = r.v;
    if (straight) {
      emit(out, 'split', step, ns.x, ns.y, ns.z, { dStraight: straight.d, dTurn: ns.d, v: ns.v });
      return straight;
    }
  }
  function pt2(s) { return { x: s.x, y: s.y }; }

  /* Target check on entering a cell. Returns true when the beam must stop (all targets lit). */
  function applyTarget(L, out, targets, lit, ns, step) {
    var ti = targets[key(ns.x, ns.y, sideOf(ns.z))];
    if (ti === undefined || ns.z !== heightAt(L,ns.x,ns.y,sideOf(ns.z))) return false;
    if (!lit[ti]) {
      lit[ti] = true;
      out.hits.push(ti);
      emit(out, 'target', step, ns.x, ns.y, ns.z, { targetIndex: ti });
    }
    return out.hits.length === L.targets.length;
  }

  function trace(level, placed) {
    var L = parseLevel(level);
    var pieces = buildPieceMap(L, placed);
    if (Object.keys(pieces).some(function (k) { return PIECES[pieces[k].type].split; })) return traceBranches(L, pieces);
    var targets = buildTargetMap(L);
    var cap = capForSize(L.size, L.duplex);
    var out = { segments: [], visited: [], hits: [], allTargetsHit: false, end: null, endPoint: null,
                altitudeMarks: [], pieceHits: [], overflights: [], underpasses: [], glides: [],
                bounces: [], events: [] };
    var s = { x: L.emitter.x, y: L.emitter.y, z: heightAt(L,L.emitter.x,L.emitter.y,L.emitter.side), d: L.emitter.dir, v: 0 };
    var seen = {}, lit = {};
    seen[stateKey(s)] = true;
    for (var step = 0; step < cap; step++) {
      var r = advance(L, s);
      if (r.kind !== 'enter') return finish(out, s, r.kind);
      var ns = r.state;
      out.segments.push({ from: pt(s.x, s.y, s.z), to: pt(ns.x, ns.y, ns.z), d: s.d, v: s.v });
      out.visited.push(copyState(ns));
      emit(out, 'enter', step, ns.x, ns.y, ns.z, { d: ns.d, v: ns.v });
      if (L.duplex && (s.z < 0) !== (ns.z < 0)) emit(out,'crossing',step,(s.x+ns.x)/2,(s.y+ns.y)/2,-0.5,{side:ns.z<0?'below':'above'});
      if (applyTarget(L, out, targets, lit, ns, step)) { out.allTargetsHit = true; return end(out, 'target', ns); }
      applyPiece(L, out, pieces, ns, step);
      var sk = stateKey(ns);
      if (seen[sk]) return end(out, 'loop', ns);
      seen[sk] = true;
      s = ns;
    }
    return end(out, 'loop', s); // unreachable: cap > the number of distinct states
  }

  /* A finite graph of outgoing beam states. The min-heap processes arrivals in physical distance
   * order; two children inherit their split's distance, so they travel simultaneously. Identical
   * outgoing states share their continuation, preventing both cycles and exponential re-splitting.
   * Legacy traces keep their exact shape above. Branch segments add d0/d1, parent and terminal. */
  function traceBranches(L, pieces) {
    var out = { segments: [], visited: [], hits: [], allTargetsHit: false, end: null, endPoint: null,
      altitudeMarks: [], pieceHits: [], overflights: [], underpasses: [], glides: [], bounces: [], events: [], branched: true };
    var targets = buildTargetMap(L), lit = {}, seen = {}, heap = [], order = 0;
    function before(a, b) { return a.d1 < b.d1 || (a.d1 === b.d1 && a.order < b.order); }
    function push(s, d0, parent) {
      var r = advance(L, s), to, dir = DIRS[s.d];
      if (r.kind === 'enter') to = pt(r.state.x, r.state.y, r.state.z);
      else if (r.kind === 'lost-edge') to = pt(s.x + dir.dx, s.y + dir.dy, s.z + s.v);
      else to = pt(s.x + dir.dx / 2, s.y + dir.dy / 2, r.kind === 'blocked-board' ? -0.5 : s.z);
      var len = r.kind === 'enter' ? Math.sqrt(1 + s.v * s.v) : Math.sqrt(1 + s.v * s.v) / 2;
      var n = { s: s, r: r, to: to, d0: d0, d1: d0 + len, parent: parent, order: order++ };
      var i = heap.length; heap.push(n);
      while (i > 0) { var p = (i - 1) >> 1; if (!before(n, heap[p])) break; heap[i] = heap[p]; i = p; }
      heap[i] = n;
    }
    function pop() {
      var n = heap[0], last = heap.pop();
      if (heap.length) {
        var i = 0;
        while (i * 2 + 1 < heap.length) {
          var c = i * 2 + 1;
          if (c + 1 < heap.length && before(heap[c + 1], heap[c])) c++;
          if (!before(heap[c], last)) break;
          heap[i] = heap[c]; i = c;
        }
        heap[i] = last;
      }
      return n;
    }
    function continueFrom(s, distance, parent) {
      var k = stateKey(s);
      if (seen[k]) { emit(out, 'merge', parent, s.x, s.y, s.z); return; }
      seen[k] = true; push(s, distance, parent);
    }
    continueFrom({ x: L.emitter.x, y: L.emitter.y, z: heightAt(L,L.emitter.x,L.emitter.y,L.emitter.side), d: L.emitter.dir, v: 0 }, 0, -1);
    while (heap.length) {
      var n = pop(), s = n.s, step = out.segments.length;
      var seg = { from: pt(s.x, s.y, s.z), to: n.to, d: s.d, v: s.v, d0: n.d0, d1: n.d1, parent: n.parent };
      out.segments.push(seg);
      if (n.r.kind !== 'enter') {
        seg.terminal = n.r.kind;
        emit(out, 'branch-end', step, n.to.x, n.to.y, n.to.z, { end: n.r.kind });
        continue;
      }
      var ns = n.r.state;
      out.visited.push(copyState(ns));
      emit(out, 'enter', step, ns.x, ns.y, ns.z, { d: ns.d, v: ns.v });
      if (L.duplex && (s.z < 0) !== (ns.z < 0)) emit(out,'crossing',step,(s.x+ns.x)/2,(s.y+ns.y)/2,-0.5,{side:ns.z<0?'below':'above'});
      if (applyTarget(L, out, targets, lit, ns, step)) {
        out.allTargetsHit = true;
        return end(out, 'target', ns);
      }
      var straight = applyPiece(L, out, pieces, ns, step);
      continueFrom(ns, n.d1, step);
      if (straight) continueFrom(straight, n.d1, step);
    }
    return end(out, 'split-incomplete', out.segments[out.segments.length - 1].to);
  }

  return { DIRS: DIRS, H_MAX: H_MAX, MAX_STEPS: MAX_STEPS, ORIENTS: ORIENTS, PIECES: PIECES, TURN: Pieces.TURN,
           stepCap: stepCap, parseLevel: parseLevel, canPlace: canPlace, heightAt: heightAt, inHole: inHole, cellKey: key, withSide: withSide, isOpen: isOpen, trace: trace };
}));
