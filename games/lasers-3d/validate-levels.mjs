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
// secret fixed WEDGE; level 12 first two-target level; intros on the teaching levels 1, 4, 5, 7, 8, 9, 12.
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

const TEACHING = { 0: true, 3: true, 4: true, 6: true, 7: true, 8: true, 11: true };
// Levels whose teaching beat must hold for EVERY minimal solution, not just the shipped one.
// Each needs a full depth-par enumeration, which is why only the low-par beats carry one.
const FORCED = {
  3: { concept: 'overflight', what: 'the low wall (overflight)' },
  4: { concept: 'wedge', what: 'the WEDGE' },
  6: { concept: 'dip', what: 'the DIP' },
  7: { concept: 'stilt', what: 'the stilt (a piece on raised terrain)' },
  8: { concept: 'secret', what: 'the secret fixed piece' }
};
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
  if (FORCED[i]) {
    const full = solve(L, Object.assign({ maxSolutions: Infinity }, BUDGET));
    assert(i, !full.truncated, 'the depth-par enumeration hit the budget, so the beat cannot be shown forced');
    assert(i, full.solvable && full.par === L.par, 'solver par ' + full.par + ' != level.par ' + L.par);
    if (full.solvable && !full.truncated) {
      allSolutions = full.solutions;
      const beat = FORCED[i];
      const bad = allSolutions.filter(one => !concepts(L, one).includes(beat.concept));
      assert(i, bad.length === 0, 'teaching beat not forced: ' + bad.length + ' of ' + allSolutions.length +
        ' minimal solutions skip ' + beat.what + ' (e.g. ' + JSON.stringify(bad[0]) + ')');
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
  if (i >= 3) assert(i, cs.includes('overflight') || cs.includes('wedge') || cs.includes('dip'),
    'every level from 4 on needs a dramatic over-flight or climb in its solution');
  // DESIGN.md section 12 is a teaching opportunity: from level 7 on the set must actually drill the
  // WEDGE-then-DIP pattern (climb to clear something, then DIP to level off and arrive).
  if (i === 6) assert(i, cs.includes('climb-then-level'),
    'level 7 introduces the DIP as the climb-LEVELLER, so its solution must carry climb-then-level');
  if (cs.includes('climb-then-level')) climbThenLevel.push(i + 1);
  if (cs.includes('fall-then-level')) fallThenLevel.push(i + 1);
  if (TEACHING[i]) assert(i, L.intro.length > 0, 'teaching level needs an intro');
  if (raw.intro) assert(i, !/[^\x20-\x7e]/.test(raw.intro), 'intro must be plain ASCII (no emojis)');

  rows.push({
    i, name: raw.name, size: L.size.w + 'x' + L.size.d, par: L.par, tray: L.tray.map(t => t[0]).join(''),
    fit: fitPx.toFixed(1), zoom: fitPx + 1e-6 >= MIN_CELL_PX ? 'fit' : cellsAtFloor.toFixed(1) + '/' + side,
    beam: solTrace ? solTrace.segments.length : '-',
    concepts: cs.join(',') || '-', reason: i >= 3 ? n3.reason : (n3.needs3D ? n3.reason : '2d'),
    nodes: min.nodes
  });
});

if (bigBoards < 2) failures.push('level set: needs at least two 24x24 boards, found ' + bigBoards);
if (climbThenLevel.filter(n => n >= 7).length < 5) {
  failures.push('level set: the WEDGE-then-DIP pattern (climb-then-level) must be taught by several levels from 7 on; found '
    + climbThenLevel.filter(n => n >= 7).length + ' (' + climbThenLevel.join(', ') + ')');
}

// table
const conceptWidth = Math.max(8, ...rows.map(r => String(r.concepts).length));
const cols = [['#', 3, true], ['name', 20], ['size', 7], ['par', 3, true], ['tray', 6], ['beam', 4, true],
  ['fitpx', 5, true], ['@34px', 9], ['concepts', conceptWidth], ['needs3D', 20], ['nodes', 8, true]];
console.log(cols.map(c => pad(c[0], c[1], c[2])).join('  '));
console.log(cols.map(c => '-'.repeat(c[1])).join('  '));
for (const r of rows) {
  console.log([pad(r.i + 1, 3, true), pad(r.name, 20), pad(r.size, 7), pad(r.par, 3, true), pad(r.tray, 6),
    pad(r.beam, 4, true), pad(r.fit, 5, true), pad(r.zoom, 9), pad(r.concepts, conceptWidth), pad(r.reason, 20), pad(r.nodes, 8, true)].join('  '));
}
console.log('');
const zoomed = rows.filter(r => r.zoom !== 'fit');
console.log('fitpx = cell size in CSS px with the whole board contain-fit into a ' + STAGE_PX + ' CSS px stage (FLAT camera).');
console.log('@34px = "fit" when the board fits above the ' + MIN_CELL_PX + ' px touch floor, otherwise how many of the');
console.log('        board\'s cells are visible across once the view clamps to ' + MIN_CELL_PX + ' px per cell and pans. ' +
  (zoomed.length ? zoomed.length + ' level(s) START ZOOMED: ' + zoomed.map(r => r.i + 1).join(', ') : 'no level starts zoomed') + '.');
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
