// Lasers 3D - level validator (DESIGN.md sections 3.7, 5, 6 step 5).
// Node tooling only (.mjs). Loads src/levels.js via createRequire, re-proves every level, and asserts
// the shipped invariants. Prints a per-level table; exits non-zero on any failure.
//
//   node validate-levels.mjs            (LASERS_LEVELS=path/to/other-levels.js overrides the file under test)
//
// PAR IS PROVEN IN TWO HALVES, which is what makes 24x24 boards affordable:
//   upper bound - the shipped `solution` replays to allTargetsHit with exactly `par` legal placements;
//   lower bound - solver.proveMinimal() EXHAUSTS depth par-1 and finds nothing. Searching at depth
//                 par-1 costs a fraction of searching at depth par, and it is the whole 2-star claim.
//   A truncated (budget-stopped) search is a FAILURE, never a pass: an unproven par may not ship.
//   Every proof also asserts capHits === 0, i.e. no trace in the search ended on LaserSim's step cap,
//   so the proof holds whatever MAX_STEPS is set to.
//
// PITCH IS A DELTA (DESIGN.md section 12). The rule change invalidated every stored par, solution and
// 3D-necessity verdict, so this validator re-proves all three from scratch against the CURRENT engine.
// The stored `solution` is checked twice over: it must still light every target when replayed now,
// and every piece it hits must show an outgoing pitch equal to LaserPieces.applyPitch(type, vIn) -
// which is what catches a solution left over from the old set-pitch rule rather than merely a
// solution that happens to miss.
//
// Checks, per level:
//   - LaserSim.parseLevel accepts it
//   - par proven (both halves above); par <= tray.length <= par + 1
//   - level.solution replays to allTargetsHit, has exactly par pieces drawn from the tray, all legal
//   - level.solution replays under the DELTA pitch rule: every target lit, end 'target', and every
//     piece hit obeys v_out = clamp(v_in + dPitch)
//   - no trivial straight shot (nothing placed does not solve it)
//   - index >= 3 (level 4 on): 3D-necessary (solver.needs3D), and the AIRTIGHT 'flat-unsolvable'
//     verdict rather than the scoped one (see solver.mjs needs3D docs)
//   - teaching beats are FORCED: the required concept holds for EVERY minimal solution, not just the
//     shipped one (levels 4, 5, 7, 8, 9)
//   - names unique
//   - SIZE: 12..24 on both axes, non-decreasing across the set, and at least two 24x24 boards.
//     The old "cell >= 34 px at a 320 px stage" rule is gone: at 24x24 no zoom level can satisfy it.
//     The front end auto-zooms and pans instead, so this reports the numbers a human needs - the cell
//     size at contain-fit on a 393 CSS px stage, and how much board is visible once the view clamps to
//     the 34 px touch floor - and flags which levels therefore START ZOOMED.
// Plus the curve of DESIGN.md 3.7: levels 1-3 pure 2D (heights 0/3, MIRROR only, par 1, 1, 2);
// level 4 MIRROR tray with an overflight; level 5 first WEDGE; level 7 first DIP; level 9 first
// secret fixed WEDGE; level 12 first two-target level; intros on the teaching levels.
//
// ARCHES AND WINDOWS (DESIGN.md 13.4). Every requirement of 13.4 is an assertion here, and each one
// is checked against EVERY MINIMAL SOLUTION rather than only the shipped one - the same standard the
// teaching beats are held to. `forcedConcepts(i)` below is the intersection of concepts() over the
// full depth-par enumeration, so a tag in it means "no minimal solution avoids this":
//   - at least THREE levels whose every minimal solution carries `under-arch`      (13.4 bullet 1)
//   - at least THREE whose every minimal solution carries `through-window`         (13.4 bullet 2)
//   - at least ONE combining an opening with `climb-then-level`, so the player must arrive at the
//     opening's exact height rather than stumble into it                           (13.4 bullet 3)
//   - the ARCH is introduced strictly before the WINDOW                            (13.4 teaching order)
//   - each new mechanic has its own teaching level whose intro names the fair tell of 13.3 (the light
//     leak on the floor, and the height in the post-fire readout) and NEVER tells the player to tilt,
//     because tilting forfeits that level's own third star.
import { createRequire } from 'node:module';
import { solve, needs3D, replay, proveMinimal } from './solver.mjs';
import { concepts } from './gen.mjs';

const require = createRequire(import.meta.url);
const Sim = require('./src/sim.js');
const Pieces = require('./src/pieces.js');
const Theme = require('./src/theme.js');
const LEVELS = require(process.env.LASERS_LEVELS || './src/levels.js');

const MIN_SIDE = 12, MAX_SIDE = 24;
const STAGE_PX = 393;                                        // iPhone 14/15 CSS width (test/ui.playwright.mjs)
const MIN_CELL_PX = (Theme.camera && Theme.camera.minCellPx) || 34;
const FLAT = Theme.camera.presets.flat;                      // paddingCells 0.65, minPaddingCells 0.15
const BUDGET = { maxNodes: 40000000, maxMs: 120000 };

// Cell size in CSS px for a `side`-cell board contain-fit into a square stage of `px` CSS px (FLAT
// preset), mirroring src/render.js fitZoomFor: half-extent side/2 plus padding, padding shrinking
// (never below minPaddingCells) when the padded fit would put the cell under MIN_CELL_PX.
function flatCellPx(side, px) {
  const hw = side / 2;
  let pad = FLAT.paddingCells;
  let zoom = px / (2 * (hw + pad));
  if (typeof FLAT.minPaddingCells === 'number' && FLAT.minPaddingCells < pad && zoom < MIN_CELL_PX) {
    pad = Math.min(pad, Math.max(FLAT.minPaddingCells, px / (2 * MIN_CELL_PX) - hw));
    zoom = px / (2 * (hw + pad));
  }
  return zoom;
}

const TEACHING = { 0: true, 3: true, 4: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 13: true };
// Levels whose teaching beat must hold for EVERY minimal solution, not just the shipped one.
// Each needs a full depth-par enumeration, which is why only the low-par beats carry one.
const FORCED = {
  3: { concepts: ['overflight'], what: 'the low wall (overflight)' },
  4: { concepts: ['wedge'], what: 'the WEDGE' },
  6: { concepts: ['dip'], what: 'the DIP' },
  7: { concepts: ['stilt'], what: 'the stilt (a piece on raised terrain)' },
  8: { concepts: ['secret'], what: 'the secret fixed piece' },
  // DESIGN.md 13.4 - the arch and window levels. Same machinery, same standard.
  9: { concepts: ['under-arch'], what: 'the ARCH (routing the beam under an overhang at level 0)' },
  10: { concepts: ['through-window'], what: 'the WINDOW (threading an opening above level 0)' },
  12: { concepts: ['under-arch'], what: 'the ARCH' },
  13: { concepts: ['through-window', 'climb-then-level'], what: 'the WINDOW arrived at by climb-then-level' },
  14: { concepts: ['under-arch'], what: 'the ARCH' },
  16: { concepts: ['through-window', 'climb-then-level'], what: 'the WINDOW arrived at by climb-then-level' }
};
// The two levels that TEACH a section 13 mechanic. Their intros must name the fair tell of 13.3 and
// must never send the player to the tilt button, which is the very thing that costs them a star here.
const OPENING_INTRO = { 9: 'arch', 10: 'window' };
const TELL_LIGHT = /light/i;         // the floor leak of 13.3
const TELL_HEIGHT = /height/i;       // the post-fire readout of 13.3
const FORBIDS_TILT = /tilt/i;
// par band per slot (DESIGN.md 3.7 curve, scaled with the board)
function parBand(i) {
  if (i <= 4) return [1, 2];     // levels 1-5    12x12 / 14x14
  if (i <= 11) return [2, 3];    // levels 6-12   14x14 / 16x16 / 18x18
  if (i <= 16) return [3, 4];    // levels 13-17  20x20 / 22x22
  return [4, 5];                 // levels 18-20  22x22 / 24x24
}

const failures = [];
const climbThenLevel = [];   // levels whose solution climbs with a WEDGE and then levels off with a DIP
const fallThenLevel = [];    // levels whose solution falls with a DIP and then levels off with a WEDGE
// DESIGN.md 13.4 tallies. `forced` = the tag holds for EVERY minimal solution (the intersection over
// the full depth-par enumeration); `shipped` = it merely holds for the solution we ship.
const forcedArch = [], forcedWindow = [], forcedOpeningClimb = [];
const shippedArch = [], shippedWindow = [];
function fail(i, msg) { failures.push('level ' + (i + 1) + ': ' + msg); }
function assert(i, cond, msg) { if (!cond) fail(i, msg); return !!cond; }

function multisetSubset(sub, sup) {
  const counts = {};
  for (const t of sup) counts[t] = (counts[t] || 0) + 1;
  for (const t of sub) { if (!counts[t]) return false; counts[t] -= 1; }
  return true;
}

function pad(s, n, right) {
  s = String(s);
  if (s.length >= n) return s;
  const fill = ' '.repeat(n - s.length);
  return right ? fill + s : s + fill;
}

if (!Array.isArray(LEVELS) || LEVELS.length === 0) {
  console.error('validate-levels: src/levels.js did not export a non-empty array');
  process.exit(1);
}

const names = new Set();
const rows = [];
let prevSide = 0;
let bigBoards = 0;
let longestBeam = 0, longestBeamAt = '';
let longestSearched = 0;   // longest trace seen ANYWHERE in the proofs, not just in the shipped solution

LEVELS.forEach((raw, i) => {
  let L;
  try { L = Sim.parseLevel(raw); }
  catch (e) { fail(i, 'parseLevel threw: ' + e.message); rows.push({ i, name: raw && raw.name, size: '?', par: '?', tray: '?', concepts: 'PARSE ERROR', reason: '-', nodes: '-', fit: '-', span: '-' }); return; }

  // ---- names ----
  assert(i, typeof raw.name === 'string' && raw.name.trim().length > 0, 'missing name');
  if (names.has(raw.name)) fail(i, 'duplicate name ' + raw.name);
  names.add(raw.name);

  // ---- size curve + the auto-zoom report (replaces the old 320 px touch-fit rule) ----
  const side = Math.max(L.size.w, L.size.d);
  assert(i, L.size.w >= MIN_SIDE && L.size.d >= MIN_SIDE, 'board ' + L.size.w + 'x' + L.size.d + ' smaller than ' + MIN_SIDE + ' on an axis');
  assert(i, L.size.w <= MAX_SIDE && L.size.d <= MAX_SIDE, 'board ' + L.size.w + 'x' + L.size.d + ' larger than ' + MAX_SIDE);
  assert(i, side >= prevSide, 'board shrinks from ' + prevSide + ' to ' + side + ' (the size curve must not go backwards)');
  prevSide = side;
  if (side >= 24) bigBoards++;
  const fitPx = flatCellPx(side, STAGE_PX);
  const cellsAtFloor = STAGE_PX / MIN_CELL_PX;

  // ---- tray / solution / par upper bound ----
  assert(i, Number.isInteger(raw.par) && raw.par >= 1, 'par must be an integer >= 1');
  const band = parBand(i);
  assert(i, L.par >= band[0] && L.par <= band[1], 'par ' + L.par + ' outside the band ' + band[0] + '-' + band[1] + ' for this slot');
  assert(i, L.tray.length >= L.par && L.tray.length <= L.par + 1, 'tray ' + L.tray.length + ' must be par..par+1 (par ' + L.par + ')');
  assert(i, !replay(L, []).allTargetsHit, 'trivial straight shot (solved with nothing placed)');

  const sol = raw.solution;
  let solTrace = null;
  if (assert(i, Array.isArray(sol), 'missing solution')) {
    assert(i, sol.length === L.par, 'solution has ' + sol.length + ' pieces, par is ' + L.par);
    assert(i, multisetSubset(sol.map(p => p.type), L.tray), 'solution uses pieces not in the tray');
    try { solTrace = replay(L, sol); } catch (e) { fail(i, 'solution replay threw: ' + e.message); }
    assert(i, solTrace && solTrace.allTargetsHit, 'solution does not light every target');
    const placedOk = sol.every((p, k) => Sim.canPlace(L, sol.slice(0, k), p.x, p.y));
    assert(i, placedOk, 'solution places a piece on an illegal cell');
    if (solTrace && solTrace.segments.length > longestBeam) { longestBeam = solTrace.segments.length; longestBeamAt = (i + 1) + ' ' + raw.name; }

    // ---- THE PITCH-RULE CHECK (DESIGN.md section 12) ----
    // The stored solution must still work under the DELTA rule, and must be internally consistent
    // with it: a solution authored under the old "a piece SETS the pitch" rule would either miss
    // outright or show a piece whose outgoing pitch is not clamp(v_in + dPitch).
    if (solTrace) {
      const lit = new Set(solTrace.hits);
      assert(i, L.targets.every((tg, k) => lit.has(k)),
        'solution does not light every target under the delta pitch rule (lit ' + solTrace.hits.length + ' of ' + L.targets.length + ')');
      assert(i, solTrace.allTargetsHit && solTrace.end === 'target',
        'solution replay ends with "' + solTrace.end + '", not "target"');
      for (const e of solTrace.events) {
        if (e.kind !== 'piece') continue;
        const want = Pieces.applyPitch(e.type, e.vIn);
        assert(i, e.vOut === want, 'piece ' + e.type + ' at (' + e.x + ',' + e.y + ') left pitch ' + e.vOut +
          ' on an incoming pitch of ' + e.vIn + '; the delta rule says ' + want);
        assert(i, e.dOut === Sim.TURN[e.orient][e.dIn], 'piece ' + e.type + ' at (' + e.x + ',' + e.y + ') turned the beam wrongly');
      }
    }
  }

  // ---- par lower bound: EXHAUSTIVE search at depth par-1 must find nothing ----
  const min = proveMinimal(L, L.par, BUDGET);
  assert(i, !min.truncated, 'par NOT PROVEN: the depth-' + (L.par - 1) + ' search hit the budget after ' + min.nodes + ' nodes');
  assert(i, min.proven, min.counterexample
    ? 'par ' + L.par + ' is wrong: ' + min.counterexample.length + ' pieces solve it (' + JSON.stringify(min.counterexample) + ')'
    : 'par not proven minimal');
  assert(i, min.capHits === 0, min.capHits + ' traces in the minimality proof ended on the MAX_STEPS cap, so the proof depends on it');
  longestSearched = Math.max(longestSearched, min.maxSegments);

  // ---- 3D necessity from level 4 on ----
  const n3 = needs3D(L, BUDGET);
  assert(i, !n3.truncated, '3D-necessity not proven: the flat search hit the budget');
  if (i >= 3) {
    assert(i, n3.needs3D, 'not 3D-necessary (' + n3.reason + ')');
    assert(i, n3.reason === 'flat-unsolvable',
      '3D-necessity rests on the scoped verdict ' + n3.reason + '; the shipped set requires the airtight flat-unsolvable');
  }
  assert(i, n3.capHits === 0, 'the flat search hit the MAX_STEPS cap');
  longestSearched = Math.max(longestSearched, n3.maxSegments);

  // ---- teaching beats must be FORCED, not merely present in the shipped solution ----
  let allSolutions = null;
  let forcedSet = null;          // concepts every minimal solution carries; null when not enumerated
  if (FORCED[i]) {
    const full = solve(L, Object.assign({ maxSolutions: Infinity }, BUDGET));
    assert(i, !full.truncated, 'the depth-par enumeration hit the budget, so the beat cannot be shown forced');
    assert(i, full.solvable && full.par === L.par, 'solver par ' + full.par + ' != level.par ' + L.par);
    if (full.solvable && !full.truncated) {
      allSolutions = full.solutions;
      const beat = FORCED[i];
      // The intersection of concepts over EVERY minimal solution. A tag in here is a promise about
      // the level, not about the one route we happened to store.
      forcedSet = allSolutions.reduce((acc, one) => {
        const cs = new Set(concepts(L, one));
        return acc === null ? cs : new Set([...acc].filter(c => cs.has(c)));
      }, null) || new Set();
      for (const want of beat.concepts) {
        const bad = allSolutions.filter(one => !concepts(L, one).includes(want));
        assert(i, bad.length === 0, 'teaching beat not forced: ' + bad.length + ' of ' + allSolutions.length +
          ' minimal solutions skip ' + beat.what + ' [' + want + '] (e.g. ' + JSON.stringify(bad[0]) + ')');
      }
      // 13.4 bullet 3, sharpened: on a level that pairs an opening with climb-then-level the beam must
      // reach the opening LEVEL (v === 0), i.e. the player set the height deliberately and then flew
      // straight at it. A beam still climbing through the hole would satisfy both tags while teaching
      // the opposite lesson - and would make that level's intro a lie.
      if (beat.concepts.includes('climb-then-level') &&
          (beat.concepts.includes('under-arch') || beat.concepts.includes('through-window'))) {
        for (const one of allSolutions) {
          const tr = replay(L, one);
          const level0 = tr.visited.some(v => ((L.openMask[v.y][v.x] >> v.z) & 1) === 1 && v.v === 0);
          assert(i, level0, 'a minimal solution reaches the opening while still pitched, so the height is stumbled into rather than arrived at: '
            + JSON.stringify(one));
        }
      }
      if (forcedSet.has('under-arch')) forcedArch.push(i + 1);
      if (forcedSet.has('through-window')) forcedWindow.push(i + 1);
      if ((forcedSet.has('under-arch') || forcedSet.has('through-window')) && forcedSet.has('climb-then-level')) {
        forcedOpeningClimb.push(i + 1);
      }
    }
  }
  // level 8 additionally: EVERY minimal solution puts a piece on raised terrain (the stilt)
  if (i === 7 && allSolutions) {
    assert(i, allSolutions.every(one => one.some(p => L.t[p.y][p.x] >= 1)),
      'stilt beat: a minimal solution has no piece on raised terrain');
  }

  // ---- the curve (DESIGN.md 3.7) ----
  const cs = solTrace ? concepts(L, sol) : [];
  const heights = new Set(L.terrain.join('').split(''));
  const trayTypes = new Set(L.tray);
  if (i < 3) {
    assert(i, [...heights].every(h => h === '0' || h === '3'), 'levels 1-3 must be pure 2D (heights 0/3 only)');
    assert(i, [...trayTypes].every(t => t === 'MIRROR') && L.fixed.every(f => f.type === 'MIRROR'), 'levels 1-3 are MIRROR only');
    assert(i, L.par === [1, 1, 2][i], 'levels 1-3 par must be ' + [1, 1, 2][i]);
  }
  if (i === 3) {
    assert(i, [...trayTypes].every(t => t === 'MIRROR') && L.fixed.length === 0, 'level 4 is a MIRROR-only tray');
    assert(i, cs.includes('overflight'), 'level 4 must teach the low wall (overflight)');
  }
  if (i === 4) assert(i, trayTypes.has('WEDGE') && cs.includes('wedge') && L.par <= 2, 'level 5 introduces the WEDGE (par 1 or 2)');
  if (i === 5) assert(i, trayTypes.has('WEDGE') && L.par === 2, 'level 6 is a wedge level with par 2');
  if (i === 6) assert(i, trayTypes.has('DIP') && cs.includes('dip'), 'level 7 introduces the DIP');
  if (i < 6) assert(i, !trayTypes.has('DIP') && !L.fixed.some(f => f.type === 'DIP'), 'no DIP before level 7');
  if (i < 4) assert(i, !trayTypes.has('WEDGE') && !L.fixed.some(f => f.type === 'WEDGE'), 'no WEDGE before level 5');
  if (i === 8) assert(i, L.fixed.some(f => f.type === 'WEDGE' && f.secret) && cs.includes('secret'), 'level 9 introduces a secret fixed WEDGE');
  if (i < 8) assert(i, !L.fixed.some(f => f.secret), 'no secret piece before level 9');
  if (i === 11) assert(i, L.targets.length === 2, 'level 12 introduces two targets');
  if (i < 11) assert(i, L.targets.length === 1, 'one target before level 12');
  // A level from 4 on has to DO something with the third dimension in its own solution. Going under
  // an arch or threading a window (DESIGN.md 13) qualifies exactly as much as a fly-over or a climb -
  // it is height information the flat view cannot give you - so both tags join the list.
  if (i >= 3) assert(i, cs.includes('overflight') || cs.includes('wedge') || cs.includes('dip') ||
    cs.includes('under-arch') || cs.includes('through-window'),
    'every level from 4 on needs a dramatic over-flight, climb, arch or window in its solution');
  // DESIGN.md section 12 is a teaching opportunity: from level 7 on the set must actually drill the
  // WEDGE-then-DIP pattern (climb to clear something, then DIP to level off and arrive).
  if (i === 6) assert(i, cs.includes('climb-then-level'),
    'level 7 introduces the DIP as the climb-LEVELLER, so its solution must carry climb-then-level');
  if (cs.includes('climb-then-level')) climbThenLevel.push(i + 1);
  if (cs.includes('fall-then-level')) fallThenLevel.push(i + 1);
  if (cs.includes('under-arch')) shippedArch.push(i + 1);
  if (cs.includes('through-window')) shippedWindow.push(i + 1);

  // ---- ARCHES AND WINDOWS: per-level checks (DESIGN.md 13.1 / 13.3 / 13.4) ----
  // The data itself: every opening names an on-grid column and integer levels strictly below its
  // height. parseLevel has already enforced that or we would not be here; this restates it against
  // the parsed form so a silent normalisation change cannot slip past.
  for (const o of L.openings) {
    assert(i, o.x >= 0 && o.x < L.size.w && o.y >= 0 && o.y < L.size.d, 'opening off the grid: ' + JSON.stringify(o));
    assert(i, o.levels.length > 0 && o.levels.every(z => Number.isInteger(z) && z >= 0 && z < L.t[o.y][o.x]),
      'opening ' + JSON.stringify(o) + ' is not strictly below the column height t=' + L.t[o.y][o.x]);
    // An opening must be inside a column that stands ABOVE it, or there is nothing to go under or
    // through and the shape is invisible in the tilted view too.
    assert(i, L.t[o.y][o.x] >= 1, 'opening on a floor column, which cannot be an arch or a window');
  }
  // The stepper's half of 13.2, checked against the shipped route: the beam is only ever INSIDE a
  // column at a level that column has actually had punched out, and a piece only ever acts at its
  // column top - which is what "nothing may be placed inside an opening" amounts to in practice.
  if (solTrace) {
    for (const v of solTrace.visited) {
      if (v.z >= L.t[v.y][v.x]) continue;
      assert(i, ((L.openMask[v.y][v.x] >> v.z) & 1) === 1,
        'the beam is inside solid rock at (' + v.x + ',' + v.y + ') level ' + v.z + ', column height ' + L.t[v.y][v.x]);
    }
    for (const e of solTrace.events) {
      if (e.kind === 'piece') assert(i, e.z === L.t[e.y][e.x], 'a piece acted at level ' + e.z + ', not at its column top ' + L.t[e.y][e.x]);
      if (e.kind === 'underpass') assert(i, ((L.openMask[e.y][e.x] >> e.z) & 1) === 1, 'an under-pass at a level that is not open');
    }
  }
  if (L.openings.length) {
    // The opened column must be pixel-identical to a solid one from above (13.1): its TOP is what the
    // flat view draws, and the top is terrain[y][x], untouched by the opening. Assert the terrain
    // string still reports the full height, i.e. the opening lives only in `openings`.
    for (const o of L.openings) {
      assert(i, L.terrain[o.y][o.x] === String(L.t[o.y][o.x]),
        'the opened column at (' + o.x + ',' + o.y + ') does not report its full height in `terrain`');
    }
  }
  if (OPENING_INTRO[i]) {
    const what = OPENING_INTRO[i];
    assert(i, L.openings.length > 0, 'the ' + what + ' teaching level carries no openings');
    assert(i, TELL_LIGHT.test(L.intro), 'the ' + what + ' intro must name the fair tell of 13.3 - the faint light on the floor');
    assert(i, TELL_HEIGHT.test(L.intro), 'the ' + what + ' intro must name the other fair tell - the height in the post-fire readout');
    assert(i, !FORBIDS_TILT.test(L.intro),
      'the ' + what + ' intro tells the player to tilt, which forfeits this level\'s own third star; the tells of 13.3 are the whole point');
  }

  if (TEACHING[i]) assert(i, L.intro.length > 0, 'teaching level needs an intro');
  if (raw.intro) assert(i, !/[^\x20-\x7e]/.test(raw.intro), 'intro must be plain ASCII (no emojis)');

  rows.push({
    i, name: raw.name, size: L.size.w + 'x' + L.size.d, par: L.par, tray: L.tray.map(t => t[0]).join(''),
    // DESIGN.md 13: A0 = an arch (open at level 0), W1/W2 = a window at that level. '-' = a plain height field.
    open: L.openings.length ? L.openings.map(o => o.levels.map(z => (z === 0 ? 'A' : 'W') + z).join('+')).join(' ') : '-',
    fit: fitPx.toFixed(1), zoom: fitPx + 1e-6 >= MIN_CELL_PX ? 'fit' : cellsAtFloor.toFixed(1) + '/' + side,
    beam: solTrace ? solTrace.segments.length : '-',
    concepts: cs.join(',') || '-', reason: i >= 3 ? n3.reason : (n3.needs3D ? n3.reason : '2d'),
    nodes: min.nodes
  });
});

if (bigBoards < 2) failures.push('level set: needs at least two 24x24 boards, found ' + bigBoards);

// ---- DESIGN.md 13.4, every bullet, checked against EVERY minimal solution ----
if (forcedArch.length < 3) {
  failures.push('level set (13.4): needs at least THREE levels where EVERY minimal solution routes the beam under an arch at level 0; found '
    + forcedArch.length + ' (' + (forcedArch.join(', ') || 'none') + '). Levels whose SHIPPED solution goes under an arch: '
    + (shippedArch.join(', ') || 'none') + ' - a shipped solution is not enough, the beat has to be forced.');
}
if (forcedWindow.length < 3) {
  failures.push('level set (13.4): needs at least THREE levels where EVERY minimal solution threads a window above level 0; found '
    + forcedWindow.length + ' (' + (forcedWindow.join(', ') || 'none') + '). Levels whose SHIPPED solution threads one: '
    + (shippedWindow.join(', ') || 'none') + '.');
}
if (forcedOpeningClimb.length < 1) {
  failures.push('level set (13.4): needs at least ONE level combining an opening with climb-then-level, so the player must arrive at the '
    + "opening's exact height; found none");
}
if (forcedArch.length && forcedWindow.length && Math.min(...forcedArch) >= Math.min(...forcedWindow)) {
  failures.push('level set (13.4): the ARCH must be introduced BEFORE the WINDOW ("the beam went under it" is easier to grasp than '
    + '"only one height fits"); first forced arch is level ' + Math.min(...forcedArch) + ', first forced window is level ' + Math.min(...forcedWindow));
}
// The teaching levels of 13.4 must be the FIRST of each kind, or the intro lands after the lesson.
if (forcedArch.length) {
  const introArch = Object.keys(OPENING_INTRO).filter(k => OPENING_INTRO[k] === 'arch').map(k => +k + 1);
  if (!introArch.includes(Math.min(...forcedArch))) {
    failures.push('level set (13.4): the arch is first required by level ' + Math.min(...forcedArch) +
      ' but the arch intro is on level(s) ' + introArch.join(', '));
  }
}
if (forcedWindow.length) {
  const introWin = Object.keys(OPENING_INTRO).filter(k => OPENING_INTRO[k] === 'window').map(k => +k + 1);
  if (!introWin.includes(Math.min(...forcedWindow))) {
    failures.push('level set (13.4): the window is first required by level ' + Math.min(...forcedWindow) +
      ' but the window intro is on level(s) ' + introWin.join(', '));
  }
}
if (climbThenLevel.filter(n => n >= 7).length < 5) {
  failures.push('level set: the WEDGE-then-DIP pattern (climb-then-level) must be taught by several levels from 7 on; found '
    + climbThenLevel.filter(n => n >= 7).length + ' (' + climbThenLevel.join(', ') + ')');
}

// table
const conceptWidth = Math.max(8, ...rows.map(r => String(r.concepts).length));
const cols = [['#', 3, true], ['name', 20], ['size', 7], ['par', 3, true], ['tray', 6], ['beam', 4, true],
  ['fitpx', 5, true], ['@34px', 9], ['open', 5], ['concepts', conceptWidth], ['needs3D', 20], ['nodes', 8, true]];
console.log(cols.map(c => pad(c[0], c[1], c[2])).join('  '));
console.log(cols.map(c => '-'.repeat(c[1])).join('  '));
for (const r of rows) {
  console.log([pad(r.i + 1, 3, true), pad(r.name, 20), pad(r.size, 7), pad(r.par, 3, true), pad(r.tray, 6),
    pad(r.beam, 4, true), pad(r.fit, 5, true), pad(r.zoom, 9), pad(r.open, 5), pad(r.concepts, conceptWidth), pad(r.reason, 20), pad(r.nodes, 8, true)].join('  '));
}
console.log('');
const zoomed = rows.filter(r => r.zoom !== 'fit');
console.log('fitpx = cell size in CSS px with the whole board contain-fit into a ' + STAGE_PX + ' CSS px stage (FLAT camera).');
console.log('@34px = "fit" when the board fits above the ' + MIN_CELL_PX + ' px touch floor, otherwise how many of the');
console.log('        board\'s cells are visible across once the view clamps to ' + MIN_CELL_PX + ' px per cell and pans. ' +
  (zoomed.length ? zoomed.length + ' level(s) START ZOOMED: ' + zoomed.map(r => r.i + 1).join(', ') : 'no level starts zoomed') + '.');
console.log('open  = DESIGN.md 13 openings on that board: A0 = a column open at level 0 (an ARCH, go under it),');
console.log('        W1 / W2 = a column open at that level only (a WINDOW, thread it at exactly that height).');
console.log('under-arch is REQUIRED (every minimal solution) by level(s) ' + (forcedArch.join(', ') || 'none') +
  '; it appears in the shipped solution of level(s) ' + (shippedArch.join(', ') || 'none') + '.');
console.log('through-window is REQUIRED (every minimal solution) by level(s) ' + (forcedWindow.join(', ') || 'none') +
  '; it appears in the shipped solution of level(s) ' + (shippedWindow.join(', ') || 'none') + '.');
console.log('opening + climb-then-level (13.4: the player must ARRIVE at the opening\'s exact height) is required by level(s) ' +
  (forcedOpeningClimb.join(', ') || 'none') + '.');
console.log('climb-then-level (DESIGN.md 12: WEDGE up, then DIP to level off) is taught by level(s) ' + climbThenLevel.join(', ') + ';');
console.log('        its mirror image fall-then-level (DIP down, then WEDGE to level off) by level(s) ' + (fallThenLevel.join(', ') || 'none') + '.');
console.log('longest beam in a shipped solution: ' + longestBeam + ' steps (level ' + longestBeamAt + ').');
const biggest = LEVELS.reduce((a, b) => (Math.max(b.size.w, b.size.d) > Math.max(a.size.w, a.size.d) ? b : a));
const cap = typeof Sim.stepCap === 'function' ? Sim.stepCap(biggest) : Sim.MAX_STEPS;
console.log('longest beam seen ANYWHERE in the proofs: ' + longestSearched + ' steps, against a loop-guard cap of ' + cap +
  ' on the biggest board');
console.log('        (LaserSim.MAX_STEPS = ' + Sim.MAX_STEPS + ' is only its floor). No trace in any proof ended on the cap - capHits is 0');
console.log('        everywhere - so every par and 3D-necessity result here holds whatever the cap is set to.');
console.log('');

if (failures.length) {
  for (const f of failures) console.error('FAIL ' + f);
  console.error('validate-levels: ' + failures.length + ' failure(s) across ' + LEVELS.length + ' levels');
  process.exit(1);
}
console.log('validate-levels: ' + LEVELS.length + ' levels OK (tray = M mirror, W wedge, D dip; beam = steps in the shipped');
console.log('solution; nodes = traces to EXHAUST depth par-1, which is the proof that par is real and the 2-star is honest)');
