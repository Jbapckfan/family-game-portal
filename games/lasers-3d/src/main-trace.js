/* Lasers 3D - reading a TraceResult (INTERFACES.md section 2) for the player and for main's own timing.
 * Global: window.LaserMainTrace (also CommonJS for node tests). Pure functions of (parsedLevel, traceResult):
 * NO DOM, NO Three.js, NO state. ES2019 (Safari 15).
 *
 * Everything here exists because a FIRE used to tell the player almost nothing (review S5 + S10): the beam simply
 * stopped somewhere and the three-star "solve without tilting" condition degenerated into blind probing. These
 * helpers turn the trace into the two things a player actually needs - what happened, and at WHAT HEIGHT.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LaserMainTrace = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* The first target the beam passed THROUGH the cell of at the wrong height, i.e. flew over or slid under.
   * That is the single most useful fact after a failed probe and nothing on screen used to say it. */
  function flyover(level, result) {
    if (!level || !result || !result.visited) return null;
    var t = level.t, targets = level.targets, i, j, v, tz;
    for (i = 0; i < result.visited.length; i++) {
      v = result.visited[i];
      for (j = 0; j < targets.length; j++) {
        if (targets[j].x !== v.x || targets[j].y !== v.y) continue;
        tz = t[v.y][v.x];
        if (v.z !== tz) return { index: j, beamZ: v.z, targetZ: tz, above: v.z > tz };
      }
    }
    return null;
  }

  /* The post-FIRE readout view model. `texts` is LaserUI.endText: the end-reason strings in kid language, plus
   * 'over' / 'under' for a flyover, which takes precedence because it is the more actionable fact.
   * `pitch` is the climb the beam still had on its LAST segment (-1, 0 or +1). Under the delta rule (DESIGN.md 12)
   * nothing levels a beam unless the player puts the opposite piece in its way, so "it was still going up" is now a
   * real explanation for a miss rather than a restatement. The wording of that sentence lives in ui.js. */
  function readout(level, result, texts) {
    if (!level || !result || !texts) return null;
    var over = flyover(level, result);
    var total = level.targets.length, lit = result.hits ? result.hits.length : 0;
    var key = over ? (over.above ? 'over' : 'under') : result.end;
    var msg = texts[key] || texts[result.end] || '';
    if (!msg) return null;
    var segs = result.segments || [], last = segs.length ? segs[segs.length - 1] : null;
    return {
      kind: result.allTargetsHit ? 'success' : 'danger',
      end: result.end,
      message: msg,
      pitch: last && last.v ? last.v : 0,
      altitude: over ? { beamZ: over.beamZ, targetZ: over.targetZ, above: over.above } : null,
      progress: total > 1 ? { lit: lit, total: total } : null
    };
  }

  /* Audio cues keyed by ARC LENGTH along the beam, so main can fire them as the animated head passes: an altitude
   * change ('level') retunes the travel loop, a 'hit' plays the target chime. The distance maths mirrors the
   * renderer's (a terminal stub ends at the cell boundary; a lost-edge run stops half a cell out). */
  function cues(level, result) {
    if (!level || !result || !result.segments) return [];
    var out = [], cum = 0, segs = result.segments, z = -1, lit = {}, i;
    for (i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (s.from.z !== z) { z = s.from.z; out.push({ dist: cum, kind: 'level', z: z }); }
      var stub = (s.to.x % 1 !== 0) || (s.to.y % 1 !== 0), dz = stub ? 0.5 * s.v : (s.to.z - s.from.z);
      var len = Math.sqrt(Math.pow(s.to.x - s.from.x, 2) + Math.pow(s.to.y - s.from.y, 2) + dz * dz);
      if (i === segs.length - 1 && result.end === 'lost-edge') len *= 0.5;
      cum += len;
      /* eslint-disable no-loop-func */
      level.targets.forEach(function (t, ti) {
        if (!lit[ti] && result.hits.indexOf(ti) >= 0 && t.x === s.to.x && t.y === s.to.y) { lit[ti] = true; out.push({ dist: cum, kind: 'hit' }); }
      });
      /* eslint-enable no-loop-func */
    }
    return out;
  }

  /* The cell the free reveal should pulse (DESIGN.md 3.5): whatever best explains why the beam failed - a piece it
   * flew over, else a secret fixed piece, else the first raised cell it crossed, else any raised cell at all. */
  function revealCell(level, result) {
    if (!level || !result) return null;
    var t = level.t, i, v, x, y;
    if (result.overflights && result.overflights.length) return { x: result.overflights[0].x, y: result.overflights[0].y };
    for (i = 0; i < level.fixed.length; i++) if (level.fixed[i].secret) return { x: level.fixed[i].x, y: level.fixed[i].y };
    for (i = 0; i < result.visited.length; i++) { v = result.visited[i]; if (t[v.y] && t[v.y][v.x] > 0) return { x: v.x, y: v.y }; }
    for (i = 0; i < level.targets.length; i++) if (t[level.targets[i].y][level.targets[i].x] > 0) return { x: level.targets[i].x, y: level.targets[i].y };
    for (y = 0; y < level.size.d; y++) for (x = 0; x < level.size.w; x++) if (t[y][x] > 0) return { x: x, y: y };
    return null;
  }

  return { __version: 1, flyover: flyover, readout: readout, cues: cues, revealCell: revealCell };
}));
