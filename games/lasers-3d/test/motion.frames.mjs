// Lasers 3D - THE TWO REGRESSIONS A SCREENSHOT CANNOT SEE.
// Run: node test/motion.frames.mjs   (starts tools/serve.mjs on a free port; SHOTS_DIR overrides the screenshot dir)
//
// The game renders on demand (src/main.js loop -> S.dirty || tracing || motion.needsFrame() || render.needsFrame()).
// That one condition has two opposite failure modes and BOTH are invisible in a still image:
//
//   TOO NARROW  an animation that never marks the scene dirty, or whose liveness nothing reports, leaves the board
//               FROZEN part-way. The picture is wrong, but it is a perfectly good-looking wrong picture.
//   TOO WIDE    an animation with no stopping condition - or a term in that test that never goes false, such as
//               "a beam is visible" or "a modal is open" - keeps a phone rendering at 60 fps for ever. The picture
//               is entirely correct. The battery is gone.
//
// So every kind of motion in the build is checked TWICE here: frames must actually be produced while it runs, and
// EXACTLY ZERO frames must be produced in a 600 ms window once everything has settled. `state.frames` is main's own
// counter, incremented once per step(), so it counts application frames and nothing else.
//
// MOTION-DIRECTION.md 10: "After the final weather burst, instrumentation records zero scheduled application frames
// and zero running animations until new input."
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { webkit } = require('/Users/jamesalford/.npm-global/lib/node_modules/playwright');

function webkitLaunchOptions() {
  if (existsSync(webkit.executablePath())) return {};
  const cache = '/Users/jamesalford/Library/Caches/ms-playwright';
  const builds = existsSync(cache) ? readdirSync(cache).filter((d) => /^webkit-\d+$/.test(d) && existsSync(`${cache}/${d}/pw_run.sh`)).sort() : [];
  if (!builds.length) throw new Error('no WebKit build found for Playwright');
  return { executablePath: `${cache}/${builds[builds.length - 1]}/pw_run.sh` };
}
const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.SHOTS_DIR || '/private/tmp/claude-501/-Users-jamesalford/7f475eac-e253-4679-b02d-9b0f7b9b6404/scratchpad/shots';
mkdirSync(SHOTS, { recursive: true });

const IGNORE = /three\.min\.js.*deprecated|build\/three\.js/;
const QUIET_MS = 600;            // the window in which zero frames must be produced
const DARK_LEVEL = 20;           // 0-based: level 21, THE LONG WAY ROUND, the first dark board
const REVEAL_LEVEL = 3;          // 0-based: level 4, one of the two levels with the free teaching reveal

function freePort() { return new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }
async function startServer() {
  const port = await freePort();
  const proc = spawn(process.execPath, [resolve(here, '../tools/serve.mjs'), String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => proc.stdout.on('data', () => res()));
  return { port, proc };
}

let failures = 0, checks = 0;
function assert(cond, msg) { checks++; if (!cond) { failures++; console.log('  FAIL ' + msg); } else console.log('  ok   ' + msg); }

/* ---------------------------------------------------------------- page-side probes */
const frames = (page) => page.evaluate(() => window.__lasers3d.state.frames);
const count = (page) => page.evaluate(() => window.__lasers3d.motion.count());
const liveness = (page) => page.evaluate(() => {
  const a = window.__lasers3d;
  return { dirty: a.state.dirty, status: a.state.status, motion: a.motion.needsFrame(),
    render: a.render.needsFrame(), busy: a.motion.busy() };
});

/* Wait until nothing anywhere reports work left, then let the LAST scheduled frame land. Everything measured after
 * this point is, by the loop's own test, a frame that should never have been asked for. */
async function waitQuiet(page, timeout = 25000) {
  await page.waitForFunction(() => {
    const a = window.__lasers3d;
    return !a.state.dirty && a.state.status !== 'tracing' && !a.motion.needsFrame() && !a.render.needsFrame();
  }, null, { timeout });
  await page.waitForTimeout(150);
}

async function zeroFrames(page, label, ms = QUIET_MS) {
  const a = await frames(page);
  await page.waitForTimeout(ms);
  const b = await frames(page);
  assert(b - a === 0, `${label}: EXACTLY zero frames in the ${ms} ms after it settles (${b - a}, total ${b})`);
  const c = await count(page);
  assert(c.webgl === 0, `${label}: no WebGL animation is left registered ${JSON.stringify(c)}`);
  return b - a;
}

/* The whole test, in one function: it MOVED, and then it STOPPED. */
async function movesThenStops(page, label, trigger, o = {}) {
  const t0 = await frames(page);
  await trigger();
  await page.waitForTimeout(o.sampleMs || 180);
  const t1 = await frames(page);
  assert(t1 > t0, `${label}: frames are produced while it runs (+${t1 - t0} in ${o.sampleMs || 180} ms)`);
  await waitQuiet(page, o.timeout);
  await zeroFrames(page, label);
}

const PROGRESS = (over) => JSON.stringify(Object.assign({
  currentLevel: 0, highestUnlocked: 22, stars: {}, muted: true, seenHelp: true,
  intros: Object.fromEntries(Array.from({ length: 23 }, (_, i) => [String(i), true])),
  revealed: { 3: true, 4: true }
}, over || {}));

async function boot(page, url, over) {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate((p) => localStorage.setItem('lasers3d.v1', p), PROGRESS(over));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__lasers3d && window.__lasers3d.render && window.__lasers3d.state.level);
  await waitQuiet(page);
}

/* ================================================================ the passes */

async function corePass(browser, url) {
  console.log('\n== a board at rest, and every kind of motion on it (iPad 820x1180)');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url);

  // ---- 0. the registry is actually wired in ----
  const wired = await page.evaluate(() => {
    const a = window.__lasers3d;
    return { motion: !!(a.motion && a.motion.__version), tick: typeof a.motion.tick === 'function',
      needsFrame: typeof a.motion.needsFrame === 'function', weather: !!a.weather,
      ticked: (function () { const before = a.state.frames; a.motion.tick(); return before === a.state.frames; })() };
  });
  assert(wired.motion && wired.tick && wired.needsFrame, `the one animation registry is wired into main.js ${JSON.stringify(wired)}`);
  assert(wired.weather, 'weather is created and handed the registry');

  // ---- 1. THE BASELINE. A settled board renders nothing at all. ----
  const rest = await liveness(page);
  assert(!rest.dirty && !rest.motion && !rest.render && rest.status !== 'tracing', `a settled board reports no work ${JSON.stringify(rest)}`);
  await zeroFrames(page, 'board at rest', 1000);

  // ---- 2. placement, rotation and removal (section 5) ----
  await movesThenStops(page, 'place a piece', () => page.evaluate(() => window.__lasers3d.setPlaced([{ x: 2, y: 3, type: 'MIRROR', orient: '/' }])));
  await movesThenStops(page, 'rotate a piece', () => page.evaluate(() => window.__lasers3d.setPlaced([{ x: 2, y: 3, type: 'MIRROR', orient: '\\' }])));
  await movesThenStops(page, 'remove a piece', () => page.evaluate(() => window.__lasers3d.setPlaced([])));

  // ---- 3. FIRE: charge, travel, contact, endpoint, readout, quiet (sections 1, 2, 7) ----
  await movesThenStops(page, 'FIRE that misses', () => page.evaluate(() => window.__lasers3d.fire()), { sampleMs: 400 });
  const readout = await page.evaluate(() => !!window.__lasers3d.state.readout);
  assert(readout, 'and the shot left its diagnostic readout behind, still and complete');

  // ---- 4. FIRE that is SKIPPED mid-flight (section 2, the 140 ms skip grace) ----
  await page.evaluate(() => window.__lasers3d.reset());
  await waitQuiet(page);
  {
    const t0 = await frames(page);
    await page.evaluate(() => window.__lasers3d.fire());
    await page.waitForTimeout(300);
    const mid = await frames(page);
    assert(mid > t0, `skipped FIRE: frames are produced before the skip (+${mid - t0})`);
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true })));
    await waitQuiet(page);
    await zeroFrames(page, 'skipped FIRE');
  }

  // ---- 5. TILT: the reveal, and the return to FLAT (section 3) ----
  await page.evaluate(() => window.__lasers3d.reset());
  await waitQuiet(page);
  await movesThenStops(page, 'TILT reveal', () => page.evaluate(() => window.__lasers3d.tilt()), { sampleMs: 250 });
  const tilted = await page.evaluate(() => !window.__lasers3d.render.isFlat());
  assert(tilted, 'and the board is left tilted, still, at its exact final pose');
  await movesThenStops(page, 'return to FLAT', () => page.evaluate(() => window.__lasers3d.tilt()), { sampleMs: 250 });

  // ---- 6. RESET while tilted: the camera swings back and then stops ----
  await page.evaluate(() => window.__lasers3d.tilt());
  await waitQuiet(page);
  await movesThenStops(page, 'RESET from tilt', () => page.evaluate(() => window.__lasers3d.reset()), { sampleMs: 250 });
  const flatAgain = await page.evaluate(() => window.__lasers3d.render.isFlat());
  assert(flatAgain, 'RESET leaves the camera settled flat');

  // ---- 7. a level change ----
  await movesThenStops(page, 'level change', () => page.evaluate(() => window.__lasers3d.loadLevel(6)));

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function winPass(browser, url) {
  console.log('\n== the win: the board sleeps while the modal animates (section 6)');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url);

  await page.evaluate(() => window.__lasers3d.setPlaced(window.__lasers3d.levels[0].solution));
  await waitQuiet(page);
  const t0 = await frames(page);
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForTimeout(400);
  assert((await frames(page)) > t0, 'the winning shot renders while it travels');
  await page.waitForFunction(() => !document.getElementById('modal-victory').hidden, null, { timeout: 12000 });
  const stars = await page.evaluate(() => document.querySelectorAll('#modal-victory .star[data-earned="true"]').length);
  assert(stars > 0, `the victory modal is open with ${stars} earned star(s)`);
  // The modal's stars and light ring are still animating (bounded CSS from theme.motion) - and the BOARD must be
  // asleep for all of it. This is section 6 in one measurement.
  const during = await frames(page);
  await page.waitForTimeout(QUIET_MS);
  const after = await frames(page);
  assert(after - during === 0, `and the board renders ZERO frames while the modal animation runs (${after - during})`);
  await waitQuiet(page);
  await zeroFrames(page, 'after the win');
  const ringGone = await page.evaluate(() => !document.querySelector('.light-ring.is-live'));
  assert(ringGone, 'the modal light ring removed itself rather than settling at zero opacity');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function darkPass(browser, url) {
  console.log('\n== dark levels: the fog burns back along the beam, then stops (section 8)');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url, { currentLevel: DARK_LEVEL });

  const opened = await page.evaluate(() => ({ dark: window.__lasers3d.state.dark, known: window.__lasers3d.knownList().length }));
  assert(opened.dark, `level ${DARK_LEVEL + 1} opens dark, knowing ${opened.known} seeded cell(s)`);
  await zeroFrames(page, 'a dark board at rest');

  const before = opened.known;
  await movesThenStops(page, 'fog burning back along the beam', () => page.evaluate(() => window.__lasers3d.fire()), { sampleMs: 500 });
  const after = await page.evaluate(() => window.__lasers3d.knownList().length);
  assert(after > before, `the shot discovered ${after - before} new cells and every one of them settled (${before} -> ${after})`);
  const burning = await page.evaluate(() => window.__lasers3d.render.needsFrame());
  assert(!burning, 'no cell is left mid-burn');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function revealPass(browser, url) {
  console.log('\n== the free teaching reveal: 3.1 s of choreography, then nothing (section 3)');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url, { currentLevel: REVEAL_LEVEL, revealed: {} });

  const t0 = await frames(page);
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForFunction(() => window.__lasers3d.state.revealPlaying, null, { timeout: 15000 });
  assert((await frames(page)) > t0, 'the reveal renders as it plays');
  // The 280 ms hold, the 1300 ms hold at tilt and the outline pulse are one-shot holds and a bounded animation:
  // holds must NOT keep the loop alive, so during a hold the frame counter is allowed to stand still, but the
  // whole choreography must still finish and must still end quiet.
  await page.waitForFunction(() => !window.__lasers3d.state.revealPlaying, null, { timeout: 20000 });
  await waitQuiet(page);
  await zeroFrames(page, 'after the free reveal');
  const done = await page.evaluate(() => ({ flat: window.__lasers3d.render.isFlat(), tilts: window.__lasers3d.state.tiltsUsed,
    consumed: (JSON.parse(localStorage.getItem('lasers3d.v1')).revealed || {})[String(3)] === true }));
  assert(done.flat && done.tilts === 0, `it ends flat and never costs the blind star ${JSON.stringify(done)}`);
  assert(done.consumed, 'and it records itself as played, exactly once');
  // The reveal's three stationary holds are one-shots; the settle at the end schedules exactly one weather burst,
  // which is itself a hold plus a DOM animation. Once that has run, the registry must be completely empty - no
  // choreography step left waiting for a frame that will never come.
  await page.waitForTimeout(3200);
  const drained = await page.evaluate(() => window.__lasers3d.motion.count());
  assert(drained.animations === 0 && drained.holds === 0,
    `and once its one weather burst has run, NOTHING is left registered ${JSON.stringify(drained)}`);
  await zeroFrames(page, 'a reveal followed by its weather burst');

  // Now interrupt one mid-flight: the holds and the camera move must both be cancellable.
  await boot(page, url, { currentLevel: REVEAL_LEVEL, revealed: {} });
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForFunction(() => window.__lasers3d.state.revealPlaying, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__lasers3d.loadLevel(0));
  const cancelled = await page.evaluate(() => ({ level: window.__lasers3d.state.levelIndex, playing: window.__lasers3d.state.revealPlaying }));
  // A level change during the reveal is REFUSED by design (S6); the reveal owns the board until it finishes.
  assert(cancelled.level === REVEAL_LEVEL && cancelled.playing, 'a level change during the reveal is still refused');
  await page.waitForFunction(() => !window.__lasers3d.state.revealPlaying, null, { timeout: 20000 });
  await waitQuiet(page);
  await zeroFrames(page, 'after a contended reveal');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function weatherPass(browser, url) {
  console.log('\n== weather: the only idle motion, and it costs no frames at all (section 4)');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url);

  // Force a burst rather than waiting on layout luck: section 4 omits a rail with no unobstructed space, and on a
  // phone-sized stage both rails are legitimately omitted. Whichever happens, the frame cost must be zero.
  const burst = await page.evaluate(() => {
    const a = window.__lasers3d;
    const started = a.weather.settled();
    const board = document.getElementById('board').getBoundingClientRect();
    const shown = a.weather.rails().filter((r) => r.style.display !== 'none').map((r) => {
      const b = r.getBoundingClientRect();
      return { top: +b.top.toFixed(1), height: +b.height.toFixed(1), overBoard: b.bottom > board.top && b.top < board.bottom };
    });
    return { started, running: a.weather.isRunning(), shown, count: a.motion.count(), frames: a.state.frames };
  });
  assert(burst.count.webgl === 0, `a weather burst registers no WebGL animation ${JSON.stringify(burst.count)}`);
  // The gutter the page leaves for the rails is theme.motion.weather.railPx (--weather-rail). If that ever goes
  // away the flecks are silently omitted for ever, and the document's one idle-motion allowance is dead code.
  assert(burst.started && burst.shown.length > 0, `the rails have unobstructed space and the burst runs (${burst.shown.length} rail(s))`);
  assert(burst.shown.every((r) => !r.overBoard), `and no fleck ever passes over the board ${JSON.stringify(burst.shown)}`);
  assert(burst.running, 'the burst is running as a pair of bounded compositor animations');
  assert(burst.count.dom >= 1, `and it is tracked by the registry as a 'dom' animation ${JSON.stringify(burst.count)}`);
  {
    const f0 = await frames(page);
    await page.waitForTimeout(1200);
    const f1 = await frames(page);
    assert(f1 - f0 === 0, `the board renders ZERO frames while the weather runs (${f1 - f0})`);
  }
  // It ends no later than delaysMs[1] + ms after the settle, and it never restarts itself.
  await page.waitForTimeout(3000);
  const ended = await page.evaluate(() => ({ running: window.__lasers3d.weather.isRunning(),
    count: window.__lasers3d.motion.count(), policy: window.__lasers3d.theme.motion.policy.weatherSelfRestart,
    hidden: window.__lasers3d.weather.rails().every((r) => r.style.display === 'none'),
    css: window.__lasers3d.weather.rails().every((r) => !r.firstChild.style.willChange) }));
  assert(!ended.running, 'the burst has ended on its own one-shot clock');
  assert(ended.count.animations === 0 && ended.count.holds === 0,
    `and nothing at all is left registered - zero animations, zero holds ${JSON.stringify(ended.count)}`);
  assert(ended.policy === false, 'weather.selfRestart is false and stays false');
  assert(ended.hidden && ended.css, 'the rails are hidden again and `will-change` is dropped, so nothing is left compositing');
  await zeroFrames(page, 'after the final weather burst', 1000);

  // New input cancels the burst in flight and does not enqueue a replacement.
  await page.evaluate(() => window.__lasers3d.weather.settled());
  await page.evaluate(() => window.__lasers3d.tilt());
  const interrupted = await page.evaluate(() => window.__lasers3d.weather.isRunning());
  assert(!interrupted, 'new input cancels the burst in flight immediately');
  await waitQuiet(page);
  await page.waitForTimeout(3200);
  await waitQuiet(page);
  await zeroFrames(page, 'after an interrupted burst');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function hiddenPass(browser, url) {
  console.log('\n== the tab goes away mid-shot: settle, commit, and render once on return');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url, { currentLevel: DARK_LEVEL });

  const known0 = await page.evaluate(() => window.__lasers3d.knownList().length);
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => window.__lasers3d.state.status === 'tracing'), 'a shot is in flight');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await page.evaluate(() => {
    const a = window.__lasers3d;
    return { status: a.state.status, count: a.motion.count(), hiddenFlag: a.motion.isHidden(),
      known: a.knownList().length, saved: (function () {
        const rec = (JSON.parse(localStorage.getItem('lasers3d.v1')).known || {})[String(a.state.levelIndex)];
        return !!(rec && rec.b);
      })(), frames: a.state.frames };
  });
  assert(hidden.hiddenFlag, 'the registry knows the document is hidden');
  assert(hidden.status !== 'tracing', `the shot was completed rather than abandoned (status ${hidden.status})`);
  assert(hidden.known > known0, `its discoveries were committed (${known0} -> ${hidden.known})`);
  assert(hidden.saved, 'and saved to the progress record');
  assert(hidden.count.webgl === 0 && hidden.count.animations === 0,
    `every presentation settled and every decoration was cancelled ${JSON.stringify(hidden.count)}`);
  const h0 = await frames(page);
  await page.waitForTimeout(QUIET_MS);
  const h1 = await frames(page);
  assert(h1 - h0 === 0, `and a hidden tab renders nothing at all (${h1 - h0} frames in ${QUIET_MS} ms)`);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(250);
  const back = await frames(page);
  const resumed = await count(page);
  /* "On return, render the settled state once. Do not replay missed animation." The registry arms exactly one
   * resume render and starts nothing, which is what `animations: 0` proves. The count can be one MORE than that
   * frame, because that first frame is also where the deferred view model reaches the DOM and the post-FIRE
   * readout row claims its height - a real layout change, not a replayed animation - so the bound is small and
   * fixed rather than exactly one. What must be exact is that it goes straight back to zero. */
  assert(back - h1 >= 1 && back - h1 <= 3, `on return the settled state is rendered immediately (${back - h1} frame(s))`);
  assert(resumed.animations === 0 && resumed.holds === 0,
    `and NOTHING is replayed: the resume starts no animation at all ${JSON.stringify(resumed)}`);
  await zeroFrames(page, 'after returning to a settled board');

  // ---- and the same for a WINNING shot: the result the player earned is committed, not replayed on return ----
  await boot(page, url);
  await page.evaluate(() => window.__lasers3d.setPlaced(window.__lasers3d.levels[0].solution));
  await waitQuiet(page);
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const won = await page.evaluate(() => ({ status: window.__lasers3d.state.status,
    modal: !document.getElementById('modal-victory').hidden,
    saved: (JSON.parse(localStorage.getItem('lasers3d.v1')).stars || {})['0'],
    count: window.__lasers3d.motion.count() }));
  assert(won.status === 'won' && !!won.saved && won.saved.solved,
    `a win interrupted by the tab going away is still recorded ${JSON.stringify(won.saved)}`);
  assert(won.modal, 'and its victory modal is settled onto the screen rather than left waiting on a hold');
  assert(won.count.holds === 0, `with no hold left outstanding ${JSON.stringify(won.count)}`);
  const w0 = await frames(page);
  await page.waitForTimeout(QUIET_MS);
  assert((await frames(page)) - w0 === 0, 'and the hidden tab still renders nothing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await waitQuiet(page);
  await zeroFrames(page, 'after returning to a won board');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

/* THE OTHER HALF OF "TOO NARROW", and the one a screenshot of a working session can never show: the page is
 * BORN hidden. A background tab, or the app switched away before boot finished. main.js's requestFrame() refuses
 * to schedule while document.hidden, which is right, but the registry's documentVisible() only fires a resume
 * render when documentHidden() armed one - and there was no hide transition to observe. Without main.js marking
 * dirty unconditionally on the visible branch, the board, the HUD and the tray stay blank until the player's
 * first pointer or key event, because ui.setState() and render.frame() both live inside step(). */
async function bootHiddenPass(browser, url) {
  console.log('\n== the page is BORN hidden: nothing renders while it is away, everything renders when it arrives');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  /* Faithfully a background tab: hidden for the WHOLE of load, so start() never sees a visibilitychange. */
  await page.addInitScript(() => {
    window.__forceHidden = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__forceHidden === true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__forceHidden === true ? 'hidden' : 'visible') });
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate((p) => localStorage.setItem('lasers3d.v1', p), PROGRESS());
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__lasers3d && window.__lasers3d.render && window.__lasers3d.state.level);
  await page.waitForTimeout(900);
  const away = await page.evaluate(() => ({ frames: window.__lasers3d.state.frames, dirty: window.__lasers3d.state.dirty }));
  assert(away.frames === 0, `a tab that boots hidden renders nothing at all while it is hidden (${away.frames} frames)`);
  assert(away.dirty === true, 'but it knows it owes a frame (state.dirty)');

  await page.evaluate(() => { window.__forceHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(500);
  const back = await page.evaluate(() => ({ frames: window.__lasers3d.state.frames,
    name: document.getElementById('hud-level-name').textContent.trim(),
    pieces: document.getElementById('hud-pieces').textContent,
    tray: Array.from(document.querySelectorAll('.tray-count')).map((e) => e.textContent).join('') }));
  assert(back.frames > 0, `and it draws the moment it becomes visible (+${back.frames} frames)`);
  assert(back.name.length > 0 && /[1-9]/.test(back.pieces) && /[1-9]/.test(back.tray),
    `the deferred view model reached the DOM too - ui.setState() lives inside step() ${JSON.stringify(back)}`);
  await waitQuiet(page);
  await zeroFrames(page, 'after a hidden boot arrives');
  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

/* MOTION-DIRECTION.md section 5, the rows the renderer cannot infer for itself: "Pick up", the carried proxy of
 * "Drag", "Cancel drag" and the board half of "Illegal placement". They are entry points on the renderer, so an
 * unwired host leaves them as dead code that no screenshot of a still board can miss. This pass drives a REAL
 * pointer drag and asserts (a) they run, (b) each one ends, and (c) a held, lifted piece in FLAT is pixel-
 * identical at three different hidden column heights - the lift is 6 CSS px of screen displacement, never a
 * world offset that a taller column would foreshorten differently. */
async function dragPass(browser, url) {
  console.log('\n== section 5 is actually wired: a piece is lifted, carried, returned - and the board sleeps after');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url);
  await page.evaluate(() => {
    const m = window.__lasers3d.motion, run = m.run;
    window.__keys = [];
    m.run = function (spec) { window.__keys.push(spec.key || '(anon)'); return run.call(m, spec); };
  });
  const cells = await page.evaluate(() => {
    const a = window.__lasers3d, lv = a.state.level, out = [];
    for (let x = 0; x < lv.size.w && out.length < 3; x++) for (let y = 0; y < lv.size.d && out.length < 3; y++)
      if (a.sim.canPlace(lv, [], x, y)) out.push({ x, y });
    return out;
  });
  const proj = (c) => page.evaluate((cc) => window.__lasers3d.render.projectCell(cc, 0), c);
  const keys = () => page.evaluate(() => window.__keys.slice());
  const clearKeys = () => page.evaluate(() => { window.__keys = []; });
  async function drag(from, to, andBack) {
    await waitQuiet(page); await clearKeys();
    const a = await proj(from), b = await proj(to);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(30);
    for (let i = 1; i <= 8; i++) { await page.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await page.waitForTimeout(16); }
    if (andBack) for (let i = 7; i >= 0; i--) { await page.mouse.move(a.x + (b.x - a.x) * i / 8, a.y + (b.y - a.y) * i / 8); await page.waitForTimeout(16); }
    const held = await keys();
    await page.mouse.up();
    await page.waitForTimeout(700);
    return { held, all: await keys() };
  }
  await page.evaluate((c) => window.__lasers3d.setPlaced([{ x: c.x, y: c.y, type: 'MIRROR', orient: '/' }]), cells[0]);
  await waitQuiet(page);
  const K0 = 'placement.proxy:' + cells[0].x + ',' + cells[0].y;
  const K1 = 'placement.proxy:' + cells[1].x + ',' + cells[1].y;

  let r = await drag(cells[0], cells[1]);
  assert(r.held.indexOf(K0) >= 0, `taking hold of a piece runs the 100 ms pick-up (${JSON.stringify(r.held)})`);
  assert(r.all.indexOf(K1) >= 0, 'and a committed drop lands its own tween on the destination');
  assert(r.all.filter((k) => k === K0).length === 1,
    'a committed drop does NOT also start a cancel tween back at the source - that would be the trailing clone section 5 forbids');
  await zeroFrames(page, 'after a completed drag');

  r = await drag(cells[1], cells[2], true);
  assert(r.all.filter((k) => k === K1).length === 2,
    `released where it started, the lifted piece is returned to its anchor rather than left lifted (${JSON.stringify(r.all)})`);
  await zeroFrames(page, 'after a cancelled drag');

  const bad = await page.evaluate(() => {
    const a = window.__lasers3d, lv = a.state.level;
    for (let x = 0; x < lv.size.w; x++) for (let y = 0; y < lv.size.d; y++) {
      if (a.state.placed.some((p) => p.x === x && p.y === y)) continue;
      if (!a.sim.canPlace(lv, a.state.placed, x, y)) return { x, y };
    }
    return null;
  });
  if (bad) {
    r = await drag(cells[1], bad);
    assert(r.all.indexOf('placement.invalid') >= 0,
      `a refused footprint gets the danger outline on the BOARD, not just the tray card (${JSON.stringify(r.all)})`);
    await zeroFrames(page, 'after a refused drop');
  }

  // ---- the flat-view information boundary, on the NEW overlay: a held piece may not encode its column height ----
  const shots = [];
  for (const h of [0, 1, 3]) {
    await page.evaluate((hh) => {
      const a = window.__lasers3d, lv = window.LASER_LEVELS[0], c = { x: 0, y: 0 };
      const row = lv.terrain[c.y];
      lv.terrain[c.y] = row.slice(0, c.x) + String(hh) + row.slice(c.x + 1);
      a.loadLevel(0);
    }, h);
    await waitQuiet(page);
    await page.evaluate(() => window.__lasers3d.setPlaced([{ x: 0, y: 0, type: 'MIRROR', orient: '/' }]));
    await waitQuiet(page);
    const p = await proj({ x: 0, y: 0 }), q = await proj({ x: 1, y: 0 });
    await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(30);
    for (let i = 1; i <= 6; i++) { await page.mouse.move(p.x + (q.x - p.x) * i / 6, p.y + (q.y - p.y) * i / 6); await page.waitForTimeout(16); }
    await waitQuiet(page);                              /* the pick-up has settled; the piece is HELD, lifted */
    const flat = await page.evaluate(() => ({ flat: window.__lasers3d.render.isFlat(), drag: !!window.__lasers3d.state.drag }));
    const buf = await page.screenshot({ clip: { x: Math.round(p.x - 70), y: Math.round(p.y - 70), width: 140, height: 140 } });
    shots.push({ h, flat: flat.flat && flat.drag, hash: createHash('sha256').update(buf).digest('hex').slice(0, 16) });
    await page.mouse.up(); await page.waitForTimeout(500);
  }
  assert(shots.every((s) => s.flat), 'the crops were taken in FLAT with the drag genuinely live');
  assert(shots[0].hash === shots[1].hash && shots[0].hash === shots[2].hash,
    `a HELD, LIFTED piece is pixel-identical at column heights 0, 1 and 3 ${JSON.stringify(shots)}`);
  await waitQuiet(page);
  await zeroFrames(page, 'after the last held piece is released');
  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function reducedPass(browser, url) {
  console.log('\n== reduced motion: every live effect settles, and the board still sleeps');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await boot(page, url);

  const on = await page.evaluate(() => window.__lasers3d.motion.isReducedMotion());
  assert(on, 'prefers-reduced-motion reaches the registry');
  await movesThenStops(page, 'reduced FIRE', () => page.evaluate(() => window.__lasers3d.fire()), { sampleMs: 150 });
  await movesThenStops(page, 'reduced TILT', () => page.evaluate(() => window.__lasers3d.tilt()), { sampleMs: 80 });

  // And toggling it ON mid-flight settles the decorative half without leaving the loop alive.
  await page.evaluate(() => { window.__lasers3d.motion.setReducedMotion(false); window.__lasers3d.render.setReducedMotion(false); });
  await page.evaluate(() => window.__lasers3d.reset());
  await waitQuiet(page);
  await page.evaluate(() => window.__lasers3d.fire());
  await page.waitForTimeout(250);
  await page.evaluate(() => { window.__lasers3d.motion.setReducedMotion(true); window.__lasers3d.render.setReducedMotion(true); });
  await waitQuiet(page);
  await zeroFrames(page, 'reduced motion switched on mid-shot');

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function run() {
  const { port, proc } = await startServer();
  const browser = await webkit.launch(webkitLaunchOptions());
  const url = `http://127.0.0.1:${port}/games/lasers-3d/`;
  try {
    await corePass(browser, url);
    await winPass(browser, url);
    await darkPass(browser, url);
    await revealPass(browser, url);
    await weatherPass(browser, url);
    await hiddenPass(browser, url);
    await bootHiddenPass(browser, url);
    await dragPass(browser, url);
    await reducedPass(browser, url);
  } catch (e) {
    failures++; console.log('  FAIL exception: ' + (e && e.stack || e));
  } finally {
    await browser.close();
    proc.kill();
  }
  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures) { console.log(`${failures} FAILED`); process.exitCode = 1; } else console.log('ALL PASSED');
}

run();
