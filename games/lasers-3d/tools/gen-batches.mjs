// Builds the SHIPPED level set: one constructive batch per slot of the DESIGN.md 3.7 curve, scored,
// and written out as src/levels.js (plus one candidate JSON per slot under tools/candidates/).
//
//   node tools/gen-batches.mjs                       # rebuild every slot and rewrite src/levels.js
//   node tools/gen-batches.mjs --only 5,8,19         # rebuild some slots, print them, touch nothing
//   node tools/gen-batches.mjs --count 10 --tries 4000
//
// The board-size curve (this is the whole point of the rebuild - a 6x6 board was far too small):
//   levels 1-3   12x12   pure 2D, MIRROR only
//   levels 4-6   14x14   hidden low wall, first WEDGE, wedge again
//   levels 7-9   16x16   first DIP (as the climb-LEVELLER, spec 12), the stilt beat, secret WEDGE
//   levels 10-12 18x18   first ARCH, first WINDOW (DESIGN.md 13), first two-target
//   levels 13-16 20x20   arch again, the arch/window + climb-then-level combo, arch again, secret
//   levels 17-18 22x22   window again, two-target
//   levels 19-20 24x24
// Par grows with the board: 1-2 (levels 1-5), 2-3 (6-12), 3-4 (13-17), 4-5 (18-20). Tray = par + 1 slack.
//
// ARCHES AND WINDOWS (DESIGN.md 13.4). The shipped set must carry, as validator assertions checked
// against EVERY minimal solution and not merely the shipped one:
//   - three `under-arch` levels   (10, 13, 15)   the beam routes UNDER an overhang at level 0
//   - three `through-window` lvls (11, 14, 17)   the beam threads a hole ABOVE level 0
//   - at least one combining an opening with the climb-then-level pattern of section 12, so the
//     player has to ARRIVE at the opening's exact height rather than stumble into it (14 and 17)
// The ARCH is introduced first (10) because "the beam went under it" is easier to grasp than "only
// one height fits" (11). Each gets its own intro naming the fair tell of 13.3 - the light leak on
// the floor and the height in the post-fire readout - and neither ever tells the player to tilt,
// because tilting is what forfeits that level's own third star.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { generate, writeOut } from '../gen.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const require = createRequire(import.meta.url);
const Sim = require(join(root, 'src/sim.js'));

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[++i];
const COUNT = +(args.count || 8);
const TRIES = +(args.tries || 4000);
const only = args.only ? args.only.split(',').map(Number) : null;

const PURE2D = {
  heights: [3], density: 0.15, need3d: false, minCoverage: 0.06, maxCoverage: 0.26,
  forbid: ['overflight', 'stilt', 'plateau-target', 'wedge', 'dip']
};

// slot = { n, name, intro, seed, spec }
const SLOTS = [
  { n: 1, name: 'FIRST BOUNCE', seed: 11,
    intro: 'Tap a square to put a mirror down. Tap it again to spin it. Then hit FIRE.',
    spec: Object.assign({ w: 12, d: 12, plan: ['MIRROR'] }, PURE2D) },

  { n: 2, name: 'AROUND THE CORNER', seed: 23,
    spec: Object.assign({ w: 12, d: 12, plan: ['MIRROR'] }, PURE2D) },

  { n: 3, name: 'DOUBLE TAKE', seed: 31,
    spec: Object.assign({ w: 12, d: 12, plan: ['MIRROR', 'MIRROR'] }, PURE2D) },

  // 4 - the first hidden low wall. MIRROR-only tray, no fixed pieces: the ONLY new idea is height.
  { n: 4, name: 'OVER THE WALL', seed: 41,
    intro: 'Some walls are lower than they look, and a beam can fly right over a low one. The beam gets wider and brighter the higher it climbs, and the readout after FIRE names every height. You can tilt the board to peek, but a no-tilt solve is what earns the third star.',
    spec: { w: 14, d: 14, plan: ['MIRROR', 'MIRROR'], emitterZ: 1, require: ['overflight'], forceRequire: true, wantUnique: false } },

  // 5 - the WEDGE. It turns AND tilts the beam up, and a plain mirror after it KEEPS the climb
  // (DESIGN.md section 12) - which is exactly what the second piece of this plan shows.
  { n: 5, name: 'UP THE STAIRS', seed: 51,
    intro: 'A WEDGE turns the beam and tilts it UP one step every square. A plain mirror turns it too, but it keeps the beam climbing - watch it grow brighter as it rises.',
    // minRun/minPathLen are relaxed here on purpose: after the WEDGE the beam CLIMBS, and a mirror
    // now KEEPS it climbing, so the last two legs share the 3 levels of sky between them and cannot
    // both be long. This is the first level where the delta rule constrains the geometry.
    spec: { w: 14, d: 14, plan: ['WEDGE', 'MIRROR'], require: ['wedge'], forceRequire: true, wantUnique: false, minRun: 3, minPathLen: 13 } },

  { n: 6, name: 'BEND THEN CLIMB', seed: 61,
    spec: { w: 14, d: 14, plan: ['MIRROR', 'WEDGE'], require: ['wedge'], forceRequire: true, wantUnique: false } },

  // 7 - the DIP, introduced in the job only it can do: LEVELLING a climbing beam (spec 12.1).
  // Plan WEDGE -> DIP -> MIRROR is the climb-then-level pattern the corrected rule is built around.
  { n: 7, name: 'LEVEL OFF', seed: 71,
    intro: 'A DIP turns the beam and tilts it DOWN one step. That makes it the only thing that can flatten a climbing beam: go UP with a wedge, then DIP to level off and fly straight.',
    spec: { w: 16, d: 16, plan: ['WEDGE', 'DIP', 'MIRROR'], require: ['dip', 'climb-then-level'], forceRequire: true, wantUnique: false } },

  // 8 - the stilt beat: a mirror on top of a block, catching a climbing beam out of the air.
  { n: 8, name: 'ON STILTS', seed: 81,
    intro: 'You can stand a piece on top of a block. Only a beam at that same height will hit it, and the readout after FIRE tells you what height your beam is flying at.',
    spec: { w: 16, d: 16, plan: ['WEDGE', 'MIRROR', 'DIP'], require: ['stilt'], forceRequire: true, allSolutionsStilt: true, wantUnique: false } },

  // 9 - the first secret fixed WEDGE: from above it is a plain mirror.
  { n: 9, name: 'SECRET RAMP', seed: 91,
    intro: 'One of these mirrors is not a mirror. Fire and watch the beam: if it turns and starts climbing, you have found the hidden wedge - and only a DIP can bring it back down to level.',
    spec: { w: 16, d: 16, plan: ['WEDGE', 'DIP', 'MIRROR', 'MIRROR'], fixedIdx: 0, secret: true, require: ['secret', 'wedge'], forceRequire: true, wantUnique: false } },

  // 10 - THE ARCH (DESIGN.md 13). A pure level-0 board: no climbing, no wedges, nothing new except
  // that one of the towers is not solid at the bottom. Plan MIRROR x3 keeps the beam at height 0 all
  // the way, so the only thing the player has to work out is that a wall can be gone under.
  { n: 10, name: 'UNDER THE ARCH', seed: 1001,
    intro: 'Look for the faint sliver of light on the floor - that block is not solid all the way down. A beam at ground level slips straight under it, and the readout after FIRE always names the height your beam is flying at.',
    spec: { w: 18, d: 18, plan: ['MIRROR', 'MIRROR', 'MIRROR'], openings: { arch: 1 },
            require: ['under-arch'], forceRequire: true, wantUnique: false } },

  // 11 - THE WINDOW. Same tell, harder lesson: the hole is part-way UP, so the height has to match.
  // The emitter starts on a t=1 ridge and the whole route stays level at 1, which is the gentlest
  // way to make "your beam is at height 1, so the hole at height 1 is the one that fits" land.
  { n: 11, name: 'THROUGH THE WINDOW', seed: 1101,
    intro: 'This block is hollow part-way UP, not at the bottom. The floor leaks the same faint light, but only a beam already flying at the hole\'s height will thread it - the readout after FIRE names the height your beam is at.',
    spec: { w: 18, d: 18, plan: ['MIRROR', 'MIRROR'], emitterZ: 1, openings: { window: 1 },
            require: ['through-window'], forceRequire: true, wantUnique: false } },

  // 12 - two orbs. The beam passes through a lit orb and carries on.
  { n: 12, name: 'TWO ORBS', seed: 121,
    intro: 'Two orbs this time. One beam has to light them both - it passes straight through the first one and carries on to the second.',
    spec: { w: 18, d: 18, plan: ['?', '?', '?'], targets: 2, require: ['twotargets'] } },

  // 13 - arch again, now underneath a FALL: the beam drops off the start tower with a secret-free DIP
  // and a WEDGE levels it at ground height, which is where the arch is waiting.
  { n: 13, name: 'THE LOW ROAD', seed: 1301,
    spec: { w: 20, d: 20, plan: ['DIP', 'WEDGE', 'MIRROR'], emitterZ: 2, openings: { arch: 1 },
            require: ['under-arch', 'fall-then-level'], forceRequire: true, wantUnique: false } },

  // 14 - THE COMBO required by 13.4: a window plus climb-then-level. The window sits on a LEVEL leg
  // above the floor, so the beam has to be climbed up with a WEDGE and then flattened with a DIP at
  // exactly the right height. Arriving one level out is the whole difficulty.
  { n: 14, name: 'THREAD THE NEEDLE', seed: 1401,
    intro: 'The hole in this one is high up. Climb with a wedge, then level off with a dip so the beam is flying at the hole\'s own height when it arrives - the readout after FIRE tells you the height you actually got.',
    // maxPitchedRun 2 keeps the climb short so the DIP levels the beam off at height 1 or 2 - the only
    // heights a window can sit at. Without it the climb always runs to the ceiling and the level leg
    // after it is at height 3, where no column can stand above a hole.
    spec: { w: 20, d: 20, plan: ['WEDGE', 'DIP', 'MIRROR'], openings: { window: 1, windowOnLevelLeg: true },
            maxPitchedRun: 2, require: ['through-window', 'climb-then-level'], forceRequire: true, wantUnique: false } },

  // 15 - the third arch, this time on a board that also climbs: the beam goes under the overhang
  // first and only then gets lifted, so the arch is not the last thing that happens.
  { n: 15, name: 'STONE BRIDGE', seed: 1502,
    spec: { w: 20, d: 20, plan: ['MIRROR', 'WEDGE', 'MIRROR'], openings: { arch: 1 },
            require: ['under-arch', 'wedge'], forceRequire: true, wantUnique: false } },

  { n: 16, name: 'SECRET STEPS', seed: 161,
    spec: { w: 20, d: 20, plan: ['WEDGE', '?', '?', '?', '?'], fixedIdx: 0, secret: true, require: ['secret', 'overflight'] } },

  // 17 - the third window, at par 3 on a 22x22 board, again demanding the exact height.
  { n: 17, name: 'THE HIGH WINDOW', seed: 1703,
    spec: { w: 22, d: 22, plan: ['WEDGE', 'DIP', 'MIRROR'], openings: { window: 1, windowOnLevelLeg: true },
            maxPitchedRun: 2, require: ['through-window', 'climb-then-level'], forceRequire: true, wantUnique: false } },

  { n: 18, name: 'HIGH ROAD LOW ROAD', seed: 181,
    spec: { w: 22, d: 22, plan: ['?', '?', '?', '?'], targets: 2, require: ['twotargets', 'overflight'] } },

  { n: 19, name: 'THE LONG WAY ROUND', seed: 191,
    spec: { w: 24, d: 24, plan: ['MIRROR', 'WEDGE', 'MIRROR', 'DIP', 'MIRROR'], require: ['climb-then-level', 'overflight'] } },

  { n: 20, name: 'SUMMIT', seed: 201,
    spec: { w: 24, d: 24, plan: ['WEDGE', 'MIRROR', 'DIP', '?', '?', '?'], fixedIdx: 0, secret: true, targets: 2, require: ['secret', 'twotargets', 'climb-then-level'] } }
];

/* ---------- scoring: a big board should feel used, not empty ---------- */

function score(b) {
  const L = Sim.parseLevel(b.level);
  const side = Math.max(L.size.w, L.size.d);
  const em = L.emitter, tg = L.targets[L.targets.length - 1];
  const span = Math.abs(tg.x - em.x) + Math.abs(tg.y - em.y);
  const cov = b.coverage;
  const covScore = 1 - Math.min(1, Math.abs(cov - 0.35) / 0.18);        // want 25-45%, best near 35%
  const pathScore = Math.min(1, b.pathLen / (side * 1.7));
  const spanScore = Math.min(1, span / (side * 1.3));
  const heights = new Set(L.terrain.join('').split(''));
  const varietyScore = Math.min(1, (heights.size - 1) / 3);
  const conceptScore = Math.min(1, b.concepts.length / 5);
  return 3.2 * pathScore + 2.4 * spanScore + 2.0 * covScore + 1.0 * varietyScore + 0.8 * conceptScore;
}

/* ---------- printing ---------- */

function mapComment(level) {
  const L = Sim.parseLevel(level);
  const marks = {};
  const dirGlyph = { E: '>', N: '^', W: '<', S: 'v' };
  marks[L.emitter.x + ',' + L.emitter.y] = dirGlyph[L.emitter.dir];
  for (const t of L.targets) marks[t.x + ',' + t.y] = '@';
  for (const f of L.fixed) marks[f.x + ',' + f.y] = 'F';
  // DESIGN.md 13: an opened column is a full-height block from above, so the map has to say so
  // explicitly or the level reads as unsolvable on paper. A = open at level 0 (arch), O = open above 0
  // (window). The exact levels are in the `openings` field just below the map.
  for (const o of L.openings) marks[o.x + ',' + o.y] = o.levels[0] === 0 ? 'A' : 'O';
  const out = [];
  for (let y = L.size.d - 1; y >= 0; y--) {
    let row = '';
    for (let x = 0; x < L.size.w; x++) {
      const m = marks[x + ',' + y];
      row += (m || (L.t[y][x] === 0 ? '.' : String(L.t[y][x]))) + ' ';
    }
    out.push('  //   y=' + String(y).padStart(2, ' ') + '  ' + row.trimEnd());
  }
  return out.join('\n');
}

function j(v) { return JSON.stringify(v).replace(/","/g, "', '").replace(/\["/g, "['").replace(/"\]/g, "']"); }

function levelLiteral(slot, b) {
  const L = b.level;
  const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  const arr = a => '[' + a.map(q).join(', ') + ']';
  const pieces = a => '[' + a.map(p => '{ x: ' + p.x + ', y: ' + p.y + ", type: '" + p.type + "', orient: " + q(p.orient) + (p.secret != null ? ', secret: ' + p.secret : '') + ' }').join(', ') + ']';
  const pts = a => '[' + a.map(p => '{ x: ' + p.x + ', y: ' + p.y + ' }').join(', ') + ']';
  const opens = a => '[' + a.map(o => '{ x: ' + o.x + ', y: ' + o.y + ', levels: [' + o.levels.join(', ') + '] }').join(', ') + ']';
  const openLine = (L.openings && L.openings.length)
    ? ['    openings: ' + opens(L.openings) + ',   // DESIGN.md 13: these columns are NOT solid at these levels']
    : [];
  return [
    '  // ' + slot.n + '. ' + slot.name + '  (' + L.size.w + 'x' + L.size.d + ', par ' + L.par + ', seed ' + b.seed + ')',
    mapComment(L),
    '  {',
    '    name: ' + q(slot.name) + ',',
    '    par: ' + L.par + ',',
    '    size: { w: ' + L.size.w + ', d: ' + L.size.d + ' },',
    '    terrain: ' + arr(L.terrain) + ', // terrain[y][x], y = 0 is the SOUTH row (reverse of the map above)',
  ].concat(openLine).concat([
    "    emitter: { x: " + L.emitter.x + ', y: ' + L.emitter.y + ", dir: " + q(L.emitter.dir) + ' },',
    '    targets: ' + pts(L.targets) + ',',
    '    fixed: ' + pieces(L.fixed) + ',',
    '    tray: ' + arr(L.tray) + ',',
    '    intro: ' + q(slot.intro || '') + ',',
    '    solution: ' + pieces(L.solution),
    '  }'
  ]).join('\n');
}

const HEADER = `/* Lasers 3D - shipped level set (DESIGN.md 3.7). Generated by tools/gen-batches.mjs - edit that, not this.
 * UMD: browser global \`LASER_LEVELS\`, CommonJS \`module.exports\`. Data only. ES2019 (Safari 15).
 *
 * SCHEMA (INTERFACES.md section 3, plus the \`solution\` extension of INTERFACES-FRONTEND.md section 7):
 *   {
 *     name:     'FIRST BOUNCE',              // display name, short, all caps, unique
 *     par:      1,                           // minimum piece count, PROVEN by an exhaustive search at depth par-1
 *     size:     { w: 12, d: 12 },            // w cells east-west (x), d cells north-south (y); 12..24
 *     terrain:  ['000000', ...],             // d strings of w chars '0'..'3' = height; terrain[y][x]; y = 0 is the SOUTH row
 *     openings: [{ x, y, levels: [0] }],     // OPTIONAL (DESIGN.md 13): levels punched OUT of a column, each
 *                                            // an integer 0..3 strictly below that column's terrain height.
 *                                            // levels [0] under a tall column = an ARCH (go under it);
 *                                            // a middle level = a WINDOW (thread it at that height only).
 *                                            // Identical to a solid column from directly above - that is the point.
 *     emitter:  { x: 0, y: 2, dir: 'E' },    // dir in E N W S; fires level (pitch 0) at height terrain[y][x]
 *     targets:  [{ x: 3, y: 5 }],            // 1 or 2 orbs; an orb sits at height terrain[y][x]; all must be lit
 *     fixed:    [{ x, y, type, orient, secret }], // immovable pieces; secret = drawn as a plain mirror in the flat view
 *     tray:     ['MIRROR', ...],             // inventory; par <= tray.length <= par + 1
 *     intro:    '',                          // one-line teaching text, shown once (only teaching levels have one)
 *     solution: [{ x, y, type, orient }]     // one proven minimal solution (length == par); used ONLY by the hint
 *   }
 * Boards run 12x12 (levels 1-3) to 24x24 (levels 19-20); the renderer auto-zooms and pans when a cell would
 * fall under the 34 px touch floor. Levels 1-3 are pure 2D (heights 0/3, MIRROR only). Every level from 4 on
 * is 3D-necessary (validate-levels.mjs).
 * Map comments: north row first; . = floor, 1-3 = height, > ^ < v = emitter, @ = target, F = fixed piece,
 * A = a full-height column with an ARCH under it (open at level 0), O = one with a WINDOW in it (open above 0).
 * Verify: node validate-levels.mjs
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LASER_LEVELS = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return [
`;

/* ---------- run ---------- */

const built = [];
for (const slot of SLOTS) {
  if (only && !only.includes(slot.n)) continue;
  const t0 = Date.now();
  const stats = {};
  const res = generate(slot.spec, { seed: slot.seed, tries: TRIES, count: COUNT, stats });
  if (!res.built.length) {
    process.stderr.write('SLOT ' + slot.n + ' ' + slot.name + ': NOTHING BUILT in ' + res.tried + ' seeds ' + JSON.stringify(stats) + '\n');
    process.exitCode = 1;
    continue;
  }
  const ranked = res.built.map(b => ({ b, s: score(b) })).sort((a, z) => z.s - a.s);
  const best = ranked[0].b;
  built.push({ slot, b: best });
  writeOut(join(here, 'candidates', String(slot.n).padStart(2, '0') + '-' + slot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json'),
    { slot: slot.n, name: slot.name, seed: best.seed, par: best.par, size: best.level.size, concepts: best.concepts, needs3D: best.needs3D, minNodes: best.minNodes, coverage: best.coverage, pathLen: best.pathLen, level: best.level });
  process.stderr.write(
    String(slot.n).padStart(2) + ' ' + slot.name.padEnd(20) +
    best.level.size.w + 'x' + best.level.size.d +
    '  par ' + best.par + '  seed ' + String(best.seed).padEnd(5) +
    ' cov ' + best.coverage.toFixed(2) + ' path ' + String(best.pathLen).padStart(2) +
    '  min ' + String(best.minNodes).padStart(7) + '  ' + best.needs3D.padEnd(26) +
    ' [' + best.concepts.join(',') + ']  (' + res.built.length + '/' + res.tried + ' seeds, ' + (Date.now() - t0) + 'ms)\n');
}

if (!only && built.length === SLOTS.length) {
  const body = built.map(({ slot, b }) => levelLiteral(slot, b)).join(',\n\n');
  writeFileSync(join(root, 'src/levels.js'), HEADER + body + '\n  ];\n}));\n');
  process.stderr.write('\nwrote src/levels.js (' + built.length + ' levels)\n');
} else if (only) {
  process.stderr.write('\n--only: src/levels.js NOT rewritten\n');
}
