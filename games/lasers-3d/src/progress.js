/* Stable identities, save migration and validation. No DOM or renderer dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LaserProgress = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var LEGACY = ['first-bounce','around-the-corner','double-take','over-the-wall','up-the-stairs','bend-then-climb','level-off','on-stilts','secret-ramp','under-the-arch','through-the-window','two-orbs','skipping-stone','the-low-road','thread-the-needle','stone-bridge','the-skimming-stone','secret-steps','the-high-window','high-road-low-road','the-long-way-round','stone-skipping','summit'];
  var BAGS = ['stars', 'intros', 'revealed', 'known', 'attempts', 'mastery'];
  function object(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function id(l, i) { return l.id || LEGACY[i] || ('level-' + i); }
  function fingerprint(l) {
    var data = [3, l.size, l.terrain || l.t, l.openings || [], l.emitter, l.targets, l.fixed || [], l.tray, l.par, !!l.dark];
    var s = JSON.stringify(data), h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
  }
  function legacyFingerprint(l) {
    var rows = l.terrain || l.t, str = l.size.w + 'x' + l.size.d + '|';
    rows.forEach(function(row){str += (Array.isArray(row) ? row.join('') : row) + ';';});
    str += '|' + l.emitter.x + ',' + l.emitter.y + ',' + l.emitter.dir + '|';
    l.targets.forEach(function(t){str += t.x + ',' + t.y + ';';});
    var h=2166136261; for(var i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
    return (h>>>0).toString(36);
  }
  function migrate(p, levels) {
    var records = object(p.records), first = p.identitySchema !== 1, old = {};
    BAGS.forEach(function (b) { old[b] = object(p[b]); p[b] = {}; });
    if (first) {
      LEGACY.forEach(function (key, i) {
        var r = object(records[key]);
        BAGS.forEach(function (b) { if (old[b][i] !== undefined) r[b] = old[b][i]; });
        if (i <= (p.highestUnlocked | 0)) r.unlocked = true;
        records[key] = r;
      });
      p.currentId = LEGACY[p.currentLevel | 0];
    }
    var highest = 0;
    levels.forEach(function (l, i) {
      var key = id(l, i), r = object(records[key]);
      BAGS.forEach(function (b) { if (r[b] !== undefined) p[b][i] = r[b]; });
      if (first && r.known && r.known.f === legacyFingerprint(l)) { r.known.f = fingerprint(l); p.known[i] = r.known; }
      if (!l.bonus && (r.unlocked || (r.stars && r.stars.solved))) highest = i;
      if (p.currentId === key) p.currentLevel = i;
    });
    p.highestUnlocked = first ? Math.min(levels.length - 1, Math.max(highest, p.highestUnlocked | 0)) : highest;
    p.records = records; p.identitySchema = 1;
    return p;
  }
  function sync(p, levels) {
    p.records = object(p.records);
    levels.forEach(function (l, i) {
      var key = id(l, i), r = object(p.records[key]);
      BAGS.forEach(function (b) { if (object(p[b])[i] !== undefined) r[b] = p[b][i]; else delete r[b]; });
      r.unlocked = !!l.bonus || i <= p.highestUnlocked; p.records[key] = r;
    });
    if (levels[p.currentLevel]) p.currentId = id(levels[p.currentLevel], p.currentLevel);
    p.identitySchema = 1;
    return p;
  }
  function attempt(raw, level, sim) {
    if (!raw || raw.f !== fingerprint(level) || !Array.isArray(raw.placed)) return null;
    var counts = {}, placed = [];
    level.tray.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    for (var i = 0; i < raw.placed.length; i++) {
      var p = raw.placed[i];
      if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.y) || !(counts[p.type] > 0) || (p.orient !== '/' && p.orient !== '\\') || !sim.canPlace(level, placed, p.x, p.y)) return null;
      counts[p.type]--; placed.push({x:p.x, y:p.y, type:p.type, orient:p.orient});
    }
    function count(n) { return Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1000000) : 0; }
    return {placed:placed, fires:count(raw.fires), tiltsUsed:count(raw.tiltsUsed), hintUsed:!!raw.hintUsed, camera:raw.camera || null};
  }
  return {id:id, fingerprint:fingerprint, migrate:migrate, sync:sync, attempt:attempt};
}));
