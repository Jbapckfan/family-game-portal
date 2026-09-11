import { homedir as browserHome } from 'node:os';
const joinHomedirCache = () => process.platform === 'darwin' ? browserHome() + '/Library/Caches/ms-playwright' : browserHome() + '/.cache/ms-playwright';
// Lasers 3D - end-to-end Playwright WebKit test for the assembled game (index.html + src/main.js).
// Run: node test/ui.playwright.mjs   (starts tools/serve.mjs on a free port; SHOTS_DIR overrides the screenshot dir)
// Flow viewports: iPhone 393x852 @3x and iPad 820x1180 @2x. Per viewport: clean console, dismiss how-to-play, solve
// level 1 by taps (3 stars), Menu link wins elementFromPoint with the victory modal open, unlock via localStorage,
// go to level 5 through the level select, solve it (wedge), orbit by drag (tilt pill), FLAT button, the free
// reveal on level 4 (does not count as a tilt), keyboard mode, undo/redo. Screenshots: game-*-<viewport>.png.
// Layout pass (iPhone, iPad, iPhone landscape 844x390, iPhone SE 320x568): on EVERY level the board sits inside the
// stage between the HUD and the tray, the HUD never covers or swallows taps on the north row, a real touch tap on a
// north-row cell places a piece, FIRE is fully on screen, buttons stay >= 44 px, and at 320 CSS px every cell is
// >= 34 px (DESIGN.md 3.7). Plus robustness probes: corrupt `intros`/`revealed` storage, resize mid camera
// animation, shared materials surviving setPlaced, travel audio stopped by a level change, FIRE disabled once won.
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { webkit } = require('playwright');

function webkitLaunchOptions() {
  if (existsSync(webkit.executablePath())) return {};
  const cache = joinHomedirCache();
  const builds = existsSync(cache) ? readdirSync(cache).filter((d) => /^webkit-\d+$/.test(d) && existsSync(`${cache}/${d}/pw_run.sh`)).sort() : [];
  if (!builds.length) throw new Error('no WebKit build found for Playwright');
  return { executablePath: `${cache}/${builds[builds.length - 1]}/pw_run.sh` };
}
const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.SHOTS_DIR || new URL('../output/screenshots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: 'iphone', width: 393, height: 852, dpr: 3 },
  { name: 'ipad', width: 820, height: 1180, dpr: 2 },
];
const LAYOUT_VIEWPORTS = [
  { name: 'iphone', width: 393, height: 852, dpr: 3 },
  { name: 'ipad', width: 820, height: 1180, dpr: 2 },
  { name: 'landscape', width: 844, height: 390, dpr: 3 },
  { name: 'se320', width: 320, height: 568, dpr: 2 },
];
const MIN_CELL_PX = 34;   // DESIGN.md 3.7
// The vendored three.min.js prints its own r160 "deprecated" warning at load; nothing else may log.
const IGNORE = /three\.min\.js.*deprecated|build\/three\.js/;

function freePort() { return new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }
async function startServer() {
  const port = await freePort();
  const proc = spawn(process.execPath, [resolve(here, '../tools/serve.mjs'), String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => proc.stdout.on('data', () => res()));
  return { port, proc };
}

let failures = 0, checks = 0;
function assert(cond, msg) { checks++; if (!cond) { failures++; console.log('  FAIL ' + msg); } else console.log('  ok   ' + msg); }

const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const vm = async (page) => { await settle(page); return page.evaluate(() => window.__laser.main.getViewModel()); };
const cellPoint = (page, cell) => page.evaluate((c) => window.__laser.render.projectCell(c, 0), cell);
async function tap(page, x, y) { if (page.touchscreen) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); }
async function tapCell(page, cell) { const p = await cellPoint(page, cell); await tap(page, p.x, p.y); }
// Boards are 12x12 to 24x24 and deliberately overflow the stage on a phone (DESIGN.md 11.2), so a test cannot just
// name a cell: it has to pick one that is both legal to build on and actually on screen right now.
const visibleEmptyCell = (page) => page.evaluate(() => {
  const L = window.__laser.main.getViewModel().level, R = window.__laser.render, placed = window.__laser.main.getViewModel().placed;
  const s = document.getElementById('stage').getBoundingClientRect();
  for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) {
    if (!window.__laser.sim.canPlace(L, placed, x, y)) continue;
    const p = R.projectCell({ x, y }, 0);
    if (p.x < s.left + 24 || p.x > s.right - 24 || p.y < s.top + 24 || p.y > s.bottom - 24) continue;
    if (document.elementFromPoint(p.x, p.y) !== document.getElementById('board')) continue;
    return { x, y };
  }
  return null;
});
async function openMore(page) { if (await page.evaluate(() => getComputedStyle(document.getElementById('btn-more')).display !== 'none' && document.getElementById('more-sheet').hidden)) await page.click('#btn-more'); }
const menuHit = () => {
  const a = document.querySelector('a.menu-link'); const r = a.getBoundingClientRect();
  const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { hit: e === a, got: e ? (e.id || e.className || e.tagName) : null, z: getComputedStyle(a).zIndex };
};
async function solveBySolution(page, expectedLen) {
  const sol = await page.evaluate(() => window.__laser.main.levels[window.__laser.main.getViewModel().levelIndex].solution);
  for (const s of sol) {
    await page.click(`.tray-card[data-type="${s.type}"]`);
    await page.waitForFunction((t) => window.__laser.main.getViewModel().selectedTray === t, s.type);
    await tapCell(page, { x: s.x, y: s.y });
    await page.waitForFunction((n) => window.__laser.main.getViewModel().placed.length === n, (sol.indexOf(s) + 1));
    for (let i = 0; i < 2; i++) {   // solutions are written in '/' or '\'; a placed piece starts at '/', a tap rotates
      const cur = await page.evaluate((c) => (window.__laser.main.getViewModel().placed.find((p) => p.x === c.x && p.y === c.y) || {}).orient, s);
      if (cur === s.orient) break;
      await tapCell(page, { x: s.x, y: s.y });
      await page.waitForTimeout(80);
    }
  }
  await settle(page);
  const placed = await page.evaluate(() => window.__laser.main.getViewModel().placed);
  return { sol, placed, ok: placed.length === expectedLen && sol.every((s) => placed.some((p) => p.x === s.x && p.y === s.y && p.type === s.type && p.orient === s.orient)) };
}

// Geometry of the current level as rendered. Boards run 12x12 to 24x24 and cells are never shrunk below
// theme.camera.minCellPx, so on a phone a big board deliberately OVERFLOWS the stage and the player pans
// (DESIGN.md 11.2). The invariants that still hold everywhere: the stage itself sits below the HUD and clear of
// the tray, at least part of the board is on screen, every VISIBLE cell centre hits the canvas (nothing floats
// over the board), and no cell is smaller than the touch floor.
const levelGeometry = () => {
  const R = window.__laser.render, L = window.__laser.main.getViewModel().level, w = L.size.w, d = L.size.d;
  const rect = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height }; };
  const p00 = R.projectCell({ x: 0, y: 0 }, 0), p10 = R.projectCell({ x: 1, y: 0 }, 0), cell = p10.x - p00.x;
  const north = R.projectCell({ x: 0, y: d - 1 }, 0), east = R.projectCell({ x: w - 1, y: 0 }, 0);
  const board = { left: p00.x - cell / 2, right: east.x + cell / 2, top: north.y - cell / 2, bottom: p00.y + cell / 2 };
  const stage = rect('stage');
  const inside = (p) => p.x >= stage.left + 2 && p.x <= stage.right - 2 && p.y >= stage.top + 2 && p.y <= stage.bottom - 2;
  const hits = {};
  let onScreen = 0, sampled = 0, k = 0;
  const stride = Math.max(1, Math.floor((w * d) / 120));
  for (let y = 0; y < d; y++) for (let x = 0; x < w; x++) {
    const p = R.projectCell({ x, y }, 0);
    if (!inside(p)) continue;
    onScreen++;
    if (k++ % stride) continue;
    sampled++;
    const e = document.elementFromPoint(p.x, p.y);
    const key = e ? (e.id || String(e.className) || e.tagName) : 'none';
    hits[key] = (hits[key] || 0) + 1;
  }
  return { name: L.name, size: w + 'x' + d, cell, board, hud: rect('hud'), stage, tray: rect('tray'),
    onScreen, sampled, hits: Object.keys(hits), isFlat: R.isFlat() };
};

async function layoutPass(browser, url) {
  for (const vp of LAYOUT_VIEWPORTS) {
    console.log(`\n== layout ${vp.name} ${vp.width}x${vp.height} @${vp.dpr}x`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true, deviceScaleFactor: vp.dpr });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
    await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 0, highestUnlocked: 19, stars: {}, muted: false, seenHelp: true })));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
    await page.waitForTimeout(250);

    // ---- every level: the stage sits between HUD and tray, the visible board is reachable, cells clear the floor ----
    const levelCount = await page.evaluate(() => window.__laser.main.levels.length);
    const bad = [], cells = [];
    let worst = null;
    for (let i = 0; i < levelCount; i++) {
      await page.evaluate((i) => window.__laser.main.loadLevel(i), i);
      await settle(page); await settle(page);
      const g = await page.evaluate(levelGeometry);
      cells.push(+g.cell.toFixed(1));
      const stageBelowHud = g.stage.top >= g.hud.bottom - 0.5 || g.stage.right <= g.hud.left + 0.5 || g.stage.left >= g.hud.right - 0.5;
      const stageClearOfTray = g.stage.bottom <= g.tray.top + 0.5 || g.stage.right <= g.tray.left + 0.5;
      const boardVisible = g.onScreen > 0;
      const cellsReachable = g.sampled > 0 && g.hits.length === 1 && g.hits[0] === 'board';
      if (!(g.isFlat && stageBelowHud && stageClearOfTray && boardVisible && cellsReachable))
        bad.push({ level: i + 1, name: g.name, stageBelowHud, stageClearOfTray, onScreen: g.onScreen, hits: g.hits, stage: g.stage, hud: g.hud, tray: g.tray });
      if (!worst || g.cell < worst.cell) worst = { level: i + 1, name: g.name, size: g.size, cell: g.cell };
    }
    assert(bad.length === 0, `all ${levelCount} levels: stage below the HUD and clear of the tray, board visible, every visible cell centre hits the canvas ${JSON.stringify(bad.slice(0, 3))}`);
    // DESIGN.md 11.2: a cell is NEVER below the touch floor; a board that would need smaller cells overflows instead.
    assert(worst.cell + 0.05 >= MIN_CELL_PX, `smallest cell ${worst.cell.toFixed(2)} px (level ${worst.level} ${worst.name} ${worst.size}) >= ${MIN_CELL_PX} px; cells ${JSON.stringify(cells)}`);

    // ---- HUD: two rows on this level set (three when a long name wraps on phones), never taller than the budget ----
    const hudH = await page.evaluate(() => document.getElementById('hud').getBoundingClientRect().height);
    assert(hudH >= 52 && hudH <= 90, `HUD height ${hudH.toFixed(1)} px within 52..90`);

    // ---- real touch tap on the topmost VISIBLE empty cell of the biggest board places a piece ----
    // (the north row of a 24x24 board is off screen on a phone by design; what must work is the top of what IS shown)
    await page.evaluate(() => window.__laser.main.loadLevel(19));
    await settle(page); await settle(page);
    const target = await page.evaluate(() => {
      const L = window.__laser.main.getViewModel().level, R = window.__laser.render;
      const s = document.getElementById('stage').getBoundingClientRect();
      let best = null;
      for (let y = L.size.d - 1; y >= 0; y--) for (let x = 0; x < L.size.w; x++) {
        if (!window.__laser.sim.canPlace(L, [], x, y)) continue;
        const p = R.projectCell({ x, y }, 0);
        if (p.x < s.left + 4 || p.x > s.right - 4 || p.y < s.top + 4 || p.y > s.bottom - 4) continue;
        if (!best || p.y < best.p.y) best = { x, y, p };
      }
      return best;
    });
    await page.click('.tray-card[data-type="MIRROR"]');
    await page.waitForFunction(() => window.__laser.main.getViewModel().selectedTray === 'MIRROR');
    await page.touchscreen.tap(target.p.x, target.p.y);
    await page.waitForTimeout(250);
    const placed = await page.evaluate(() => window.__laser.main.getViewModel().placed);
    assert(placed.length === 1 && placed[0].x === target.x && placed[0].y === target.y, `touch tap on the topmost visible cell (${target.x},${target.y}) at (${target.p.x.toFixed(0)},${target.p.y.toFixed(0)}) placed a MIRROR ${JSON.stringify(placed)}`);
    await page.screenshot({ path: `${SHOTS}/layout-${vp.name}-l20.png` });

    // ---- tray: FIRE fully on screen at rest; an overflowing action row scrolls to reveal its last button; >= 44 px ----
    const tray = await page.evaluate(() => {
      const ta = document.querySelector('.tray-actions'), fire = document.getElementById('btn-fire').getBoundingClientRect();
      const inside = (b) => b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5;
      const out = { fire: [fire.left, fire.right, fire.top, fire.bottom].map((v) => +v.toFixed(1)), fireInside: inside(fire), scrollW: ta.scrollWidth, clientW: ta.clientWidth, scrollLeft: ta.scrollLeft, overflow: ta.scrollWidth > ta.clientWidth + 1 };
      if (out.overflow) {
        const last = Array.from(ta.children).filter((c) => getComputedStyle(c).display !== 'none').pop();
        ta.scrollLeft = ta.scrollWidth; const lb = last.getBoundingClientRect(); out.lastAfterScroll = [lb.left, lb.right].map((v) => +v.toFixed(1)); out.lastInside = inside(lb); ta.scrollLeft = 0;
        const fb = document.getElementById('btn-fire').getBoundingClientRect(); out.fireAtRest = inside(fb);
      }
      const small = Array.from(document.querySelectorAll('button, a.menu-link, .tray-card')).filter((b) => b.offsetParent !== null || getComputedStyle(b).position === 'fixed').map((b) => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, w: r.width, h: r.height }; }).filter((b) => b.w < 44 || b.h < 44);
      return Object.assign(out, { small, scrollW2: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, scrollY: window.scrollY });
    });
    assert(tray.fireInside && (!tray.overflow || (tray.lastInside && tray.fireAtRest)), `FIRE fully inside the viewport (and the action row scrolls to its last button when it overflows) ${JSON.stringify(tray)}`);
    assert(tray.small.length === 0 && tray.scrollW2 <= tray.cw && tray.scrollY === 0, `every button >= 44x44 and no page overflow ${JSON.stringify({ small: tray.small, sw: tray.scrollW2, cw: tray.cw })}`);
    if (vp.name === 'se320') assert(!tray.overflow, `320 px: the action grid fits without scrolling (scrollWidth ${tray.scrollW} > clientWidth ${tray.clientW})`);

    // ---- resize during a preset animation ends on the fit for the NEW size ----
    await page.evaluate(() => window.__laser.main.reset());
    await page.waitForFunction(() => window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating);
    await page.evaluate(() => window.__laser.main.tilt());
    await page.waitForTimeout(150);
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await page.waitForFunction(() => !window.__laser.render.getCamera().animating, null, { timeout: 4000 });
    await page.waitForTimeout(150);
    const fit = await page.evaluate(() => { const c = window.__laser.render._camera; const before = c.right - c.left; window.__laser.ui.fitStage(); const after = c.right - c.left; return { before, after }; });
    assert(Math.abs(fit.before - fit.after) < 1e-6, `camera fit survives a resize mid-animation (world width ${fit.before.toFixed(3)} vs refit ${fit.after.toFixed(3)})`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(200);

    assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
    await ctx.close();
  }
}

async function robustnessPass(browser, url) {
  console.log('\n== robustness (iphone 393x852)');
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const booted = () => page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level, null, { timeout: 5000 }).then(() => true, () => false);

  // corrupt `intros` (a string) with the current level on an intro level: must boot and show the level
  await page.goto(url, { waitUntil: 'load' });
  await booted();
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ intros: 'x', currentLevel: 3, highestUnlocked: 19, seenHelp: true })));
  await page.reload({ waitUntil: 'load' });
  let ok = await booted();
  await page.waitForTimeout(200);
  const v1 = ok ? await vm(page) : null;
  assert(ok && v1.levelIndex === 3 && errors.length === 0, `corrupt intros:"x" -> boots on level 4 without errors ${JSON.stringify({ ok, level: v1 && v1.levelIndex, errors })}`);
  const intros = await page.evaluate(() => JSON.parse(localStorage.getItem('lasers3d.v1')).intros);
  assert(intros && typeof intros === 'object' && intros['3'] === true, `intros normalised to an object and the level-4 intro recorded ${JSON.stringify(intros)}`);

  // corrupt `revealed` (a number): the free reveal after a failed FIRE on level 4 must not throw
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ revealed: 5, currentLevel: 3, highestUnlocked: 19, seenHelp: true, intros: {} })));
  await page.reload({ waitUntil: 'load' });
  ok = await booted();
  await page.waitForTimeout(200);
  await page.click('#btn-fire');
  await page.waitForFunction(() => window.__laser.main.getViewModel().revealPlaying, null, { timeout: 6000 });
  await page.waitForFunction(() => !window.__laser.main.getViewModel().revealPlaying && window.__laser.render.isFlat(), null, { timeout: 9000 });
  const revealed = await page.evaluate(() => JSON.parse(localStorage.getItem('lasers3d.v1')).revealed);
  assert(ok && errors.length === 0 && revealed && revealed['3'] === true, `corrupt revealed:5 -> FIRE + free reveal run clean and the flag is re-recorded ${JSON.stringify({ revealed, errors })}`);

  // corrupt currentLevel + intros: loadLevel(3) works
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ intros: 'x', currentLevel: 'abc', highestUnlocked: 19, seenHelp: true })));
  await page.reload({ waitUntil: 'load' });
  ok = await booted();
  await page.evaluate(() => window.__laser.main.loadLevel(3));
  await page.waitForTimeout(150);
  assert(ok && (await vm(page)).levelIndex === 3 && errors.length === 0, `corrupt currentLevel:"abc" + intros:"x" -> boots and loadLevel(3) works ${JSON.stringify(errors)}`);

  // shared materials survive setPlaced: no shader program is recompiled by rotating a piece
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 19, highestUnlocked: 19, seenHelp: true })));
  await page.reload({ waitUntil: 'load' });
  ok = await booted();
  await page.waitForTimeout(200);
  const prog = await page.evaluate(async () => {
    const app = window.__laser.main, r = window.__laser.render._renderer;
    const frame = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    app.setPlaced([{ x: 1, y: 1, type: 'MIRROR', orient: '/' }, { x: 2, y: 2, type: 'WEDGE', orient: '\\' }, { x: 3, y: 3, type: 'DIP', orient: '/' }]); await frame(); await frame();
    const ids0 = r.info.programs.map((p) => p.id).sort(), mem0 = Object.assign({}, r.info.memory);
    app.setPlaced([{ x: 1, y: 1, type: 'MIRROR', orient: '\\' }, { x: 2, y: 2, type: 'WEDGE', orient: '\\' }, { x: 3, y: 3, type: 'DIP', orient: '/' }]); await frame(); await frame();
    app.setPlaced([{ x: 1, y: 1, type: 'MIRROR', orient: '/' }, { x: 2, y: 2, type: 'WEDGE', orient: '/' }]); await frame(); await frame();
    const ids1 = r.info.programs.map((p) => p.id).sort(), mem1 = Object.assign({}, r.info.memory);
    return { ids0, ids1, mem0, mem1 };
  });
  assert(JSON.stringify(prog.ids0) === JSON.stringify(prog.ids1) && prog.mem1.textures === prog.mem0.textures, `setPlaced keeps every shader program (${prog.ids0.length}) and texture (${prog.mem0.textures}) alive ${JSON.stringify(prog)}`);

  // a level change during FIRE travel stops the travel loop
  const audioLog = await page.evaluate(async () => {
    const a = window.__laser.audio, log = [], play = a.play, stop = a.stop;
    a.play = function (n) { log.push('play:' + n); return play.call(a, n); }; a.stop = function (n) { log.push('stop:' + n); return stop.call(a, n); };
    window.__laser.main.loadLevel(2); await new Promise((r) => setTimeout(r, 100));
    window.__laser.main.fire(); await new Promise((r) => setTimeout(r, 150));
    window.__laser.main.loadLevel(1); await new Promise((r) => setTimeout(r, 300));
    a.play = play; a.stop = stop;
    return { log, status: window.__laser.main.getViewModel().status };
  });
  assert(audioLog.log.indexOf('play:travel') >= 0 && audioLog.log.lastIndexOf('stop:travel') > audioLog.log.indexOf('play:travel') && audioLog.status === 'idle', `level change mid-FIRE stops the travel loop (a stop:travel after play:travel) ${JSON.stringify(audioLog)}`);

  // 'won' is terminal for FIRE: after closing the victory modal FIRE is disabled; an edit re-arms it
  const won = await page.evaluate(async () => {
    const app = window.__laser.main; app.loadLevel(0);
    const L = app.levels[0];
    app.setPlaced(L.solution);
    await new Promise((r) => setTimeout(r, 100));
    app.fire();
    await new Promise((res) => { const t = setInterval(() => { if (!document.getElementById('modal-victory').hidden) { clearInterval(t); res(); } }, 50); setTimeout(res, 8000); });
    document.querySelector('#modal-victory .modal-close').click();
    await new Promise((r) => setTimeout(r, 100));
    const fires0 = app.getViewModel().fires, disabled = document.getElementById('btn-fire').disabled;
    app.fire(); document.getElementById('btn-fire').click();
    await new Promise((r) => setTimeout(r, 150));
    const fires1 = app.getViewModel().fires, status1 = app.getViewModel().status;
    app.reset(); await new Promise((r) => setTimeout(r, 100));
    return { fires0, disabled, fires1, status1, status2: app.getViewModel().status, fireEnabled: !document.getElementById('btn-fire').disabled };
  });
  assert(won.fires0 === 1 && won.disabled && won.fires1 === 1 && won.status1 === 'won' && won.status2 === 'idle' && won.fireEnabled, `won: FIRE disabled and inert after the modal closes; RESET re-arms it ${JSON.stringify(won)}`);

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

// ---------------------------------------------------------------------------------------------------------------
// Review-fix pass: the post-FIRE readout (S5/S10), per-criterion stars (S3), RESET's camera settle (S4), the
// exclusive one-time reveal (S6), tap-to-finish beam travel (S8), dirty rendering (S13) and the OVERVIEW/WORKING
// view toggle. Also takes the polish-* screenshots.
// The readout fixtures used to name a level and a cell ("level 18, WEDGE '\' at (19,11)"). Every one of those went
// stale the moment the level set was regenerated under the corrected pitch-delta rule (DESIGN.md 12), because the
// terrain, the emitter and the targets all moved. They now SEARCH the shipped levels for a placement that actually
// produces the situation under test - the same thing a player does - so the next regeneration cannot break them.
//
// findFlyover: a placement whose beam passes THROUGH a target's cell at a different height (LaserMainTrace.flyover),
// which is what makes the readout print both altitudes. Multi-target levels are preferred so the same single FIRE
// also exercises the "n of m lit" progress chip, exactly as the old hand-picked fixture did.
// The search runs at 0, then 1, then 2 pieces, and its CANDIDATE CELLS come from the beam itself: a piece can only
// change a beam by sitting on a cell that beam already visits at that cell's own level. That is the same pruning the
// solver uses, and it keeps an otherwise huge search to a few tens of thousands of pure-arithmetic traces.
// Two pieces are needed in practice. A flyover requires the beam to arrive at a target's cell ABOVE it, the beam
// leaves the emitter level, and only a WEDGE or a DIP changes pitch - so the first piece must be a pitch-changer and
// a second is then usually needed to steer the now-climbing beam back over the orb. Levels whose targets all sit at
// the maximum height are skipped outright: nothing can fly over them, by construction.
const findFlyover = (page) => page.evaluate(() => {
  const sim = window.__laser.sim, LEVELS = window.__laser.main.levels, T = window.LaserMainTrace, ORIENTS = ['/', '\\'];
  let best = null;
  const consider = (li, raw, L, placed) => {
    const r = sim.trace(raw, placed);
    if (r.allTargetsHit) return false;               // a win shows the victory modal, not a miss readout
    const f = T.flyover(L, r);
    if (!f || !f.above) return false;                // "flew over", the case the readout copy is written for
    const cand = { level: li, placed, beamZ: f.beamZ, targetZ: f.targetZ, lit: r.hits.length, total: L.targets.length, end: r.end };
    if (!best || (cand.total > 1 && best.total < 2)) best = cand;
    return true;
  };
  // cells the given beam could be altered at: visited at exactly that cell's terrain level, and legally placeable
  const touchable = (raw, L, placed) => {
    const seen = {}, out = [];
    sim.trace(raw, placed).visited.forEach((v) => {
      const k = v.x + ',' + v.y;
      if (seen[k] || v.z !== L.t[v.y][v.x]) return;
      seen[k] = 1;
      if (sim.canPlace(raw, placed, v.x, v.y)) out.push({ x: v.x, y: v.y });
    });
    return out;
  };
  for (let li = 0; li < LEVELS.length; li++) {
    const raw = LEVELS[li], L = sim.parseLevel(raw), types = Array.from(new Set(L.tray));
    if (L.targets.every((t) => L.t[t.y][t.x] >= sim.H_MAX - 1)) continue;   // nothing can be above it
    consider(li, raw, L, []);
    if (best && best.total > 1) break;
    const first = touchable(raw, L, []);
    const pitchers = types.filter((t) => t === 'WEDGE' || t === 'DIP');
    for (const c of first) for (const type of types) for (const orient of ORIENTS) {
      if (consider(li, raw, L, [{ x: c.x, y: c.y, type, orient }]) && best && best.total > 1) break;
    }
    if (best && best.total > 1) break;
    // depth 2, first piece restricted to a pitch-changer: without one the beam never leaves its starting level
    for (const c of first) for (const type of pitchers) for (const orient of ORIENTS) {
      const a = [{ x: c.x, y: c.y, type, orient }];
      for (const c2 of touchable(raw, L, a)) for (const t2 of types) for (const o2 of ORIENTS) {
        consider(li, raw, L, a.concat([{ x: c2.x, y: c2.y, type: t2, orient: o2 }]));
        if (best && best.total > 1) break;
      }
      if (best && best.total > 1) break;
    }
    if (best) break;
  }
  return best;
});
// A multi-target level with at least one orb still dark, for the "n of m lit" chip when the flyover pick above
// happens to land on a single-target level.
const findProgress = (page) => page.evaluate(() => {
  const sim = window.__laser.sim, LEVELS = window.__laser.main.levels;
  for (let li = 0; li < LEVELS.length; li++) {
    const raw = LEVELS[li], L = sim.parseLevel(raw);
    if (L.targets.length < 2) continue;
    const r = sim.trace(raw, []);
    if (!r.allTargetsHit) return { level: li, placed: [], lit: r.hits.length, total: L.targets.length };
  }
  return null;
});
// One placement per END REASON, in kid language. Same rule: searched, never named. A flyover is excluded because
// its readout says "flew over the target" instead of naming the end reason, and a win opens the victory modal.
const findEnds = (page, wanted) => page.evaluate((want) => {
  const sim = window.__laser.sim, LEVELS = window.__laser.main.levels, T = window.LaserMainTrace, ORIENTS = ['/', '\\'];
  const out = {}, need = () => want.filter((w) => !out[w]);
  const consider = (li, raw, L, placed) => {
    const r = sim.trace(raw, placed);
    if (r.allTargetsHit || out[r.end] || want.indexOf(r.end) < 0) return;
    if (T.flyover(L, r)) return;
    out[r.end] = { level: li, placed: placed };
  };
  for (let li = 0; li < LEVELS.length && need().length; li++) consider(li, LEVELS[li], sim.parseLevel(LEVELS[li]), []);
  for (let li = 0; li < LEVELS.length && need().length; li++) {
    const raw = LEVELS[li], L = sim.parseLevel(raw), types = Array.from(new Set(L.tray));
    for (let y = 0; y < L.size.d && need().length; y++) for (let x = 0; x < L.size.w; x++) {
      if (!sim.canPlace(raw, [], x, y)) continue;
      for (const type of types) for (const orient of ORIENTS) consider(li, raw, L, [{ x, y, type, orient }]);
    }
  }
  return out;
}, wanted);

async function polishPass(browser, url, vp) {
  console.log(`\n== polish ${vp.name} ${vp.width}x${vp.height} @${vp.dpr}x`);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true, deviceScaleFactor: vp.dpr });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const boot = async () => {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
    await page.waitForTimeout(200);
  };
  await boot();
  // `revealed` pre-set: the one-time reveal on levels 4 and 5 is exercised on its own further down, and it is
  // exclusive by design, so it must not fire in the middle of an unrelated check.
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 0, highestUnlocked: 19, stars: {}, muted: true, seenHelp: true, intros: {}, revealed: { 3: true, 4: true } })));
  await boot();

  // ---------- S13: dirty rendering. Frames must stop when the board is static and resume for every animation. ----------
  const frames = () => page.evaluate(() => window.__laser.main.state.frames);
  async function framesOver(ms) { const a = await frames(); await page.waitForTimeout(ms); return (await frames()) - a; }
  // "Idle" is not "some fixed time after boot". Loading a level runs a live retrace (theme.beam.travel.liveRetraceMs,
  // 140 ms of beam draw-in) and then ONE end-state effect where the beam dies, and how long that lasts is a property
  // of the level DATA: a beam that leaves the board / floor / sky drops a static ring (0 extra frames), while one
  // that stops against a wall throws three sparks that fade over theme.beam.endStates.blocked.sparkFadeMs (260 ms).
  // Level 1's empty board now ends 'blocked', so the board legitimately animates for ~400 ms after load where the
  // old level set took ~140 ms. Waiting a fixed 200 ms therefore measured the tail of a real, terminating animation
  // and called it a leak. So wait for the renderer's OWN answer instead, then measure. This is strictly stronger
  // than the old fixed wait: anything that genuinely pins the loop on - a dirty flag re-set every frame, a tween
  // that never resolves, an observer that keeps firing - never settles, and `settled: false` fails the check.
  async function idleFrames(ms) {
    let settled = true;
    try {
      await page.waitForFunction(() => {
        const a = window.__laser.main;
        return !a.state.dirty && a.state.status !== 'tracing' && !window.__laser.render.needsFrame();
      }, null, { timeout: 5000 });
    } catch (e) { settled = false; }
    return { settled, drawn: await framesOver(ms) };
  }
  const idle = await idleFrames(600);
  assert(idle.settled && idle.drawn <= 2, `a settled board schedules no frames (${idle.drawn} in 600 ms, was ~36 before)${idle.settled ? '' : ' - NEVER SETTLED: something is pinning the loop on'}`);
  const onTap = await page.evaluate(async () => {
    const before = window.__laser.main.state.frames;
    document.querySelector('.tray-card:not([disabled])').click();
    await new Promise((r) => setTimeout(r, 120));
    return window.__laser.main.state.frames - before;
  });
  assert(onTap >= 1, `a UI event wakes the loop (${onTap} frames)`);

  // each animation in turn must keep producing frames
  const anims = {};
  await page.evaluate(() => window.__laser.main.reset());
  await page.waitForTimeout(200);
  anims.tilt = await page.evaluate(async () => { const b = window.__laser.main.state.frames; window.__laser.main.tilt(); await new Promise((r) => setTimeout(r, 400)); return window.__laser.main.state.frames - b; });
  await page.waitForFunction(() => !window.__laser.render.getCamera().animating);
  anims.flat = await page.evaluate(async () => { const b = window.__laser.main.state.frames; window.__laser.main.tilt(); await new Promise((r) => setTimeout(r, 400)); return window.__laser.main.state.frames - b; });
  await page.waitForFunction(() => window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating);
  await page.evaluate(() => window.__laser.main.reset());
  await page.waitForTimeout(200);
  anims.beam = await page.evaluate(async () => { const b = window.__laser.main.state.frames; window.__laser.main.fire(); await new Promise((r) => setTimeout(r, 500)); return window.__laser.main.state.frames - b; });
  await page.waitForFunction(() => window.__laser.main.getViewModel().status !== 'tracing', null, { timeout: 8000 });
  // Direct view switches now finish in 360 ms. Check that they draw intermediate frames,
  // without imposing the old 720 ms transition's frame count on a loaded WebKit runner.
  for (const k of Object.keys(anims)) assert(anims[k] >= (k === 'beam' ? 8 : 3), `frames keep coming during the ${k} animation (${anims[k]} in 400-500 ms)`);
  // Same again after the beam: the FIRE above ends against a wall, so its spark burst is still fading when the
  // status leaves 'tracing'. Settle first, then the 600 ms window measures a board that really is at rest.
  const settled = await idleFrames(600);
  assert(settled.settled && settled.drawn <= 2, `and stop again once everything settles (${settled.drawn} in 600 ms)${settled.settled ? '' : ' - NEVER SETTLED'}`);
  // The hint ghost is not an animation: it is one frame to draw it and one, 2 s later, to take it away. A missed
  // dirty flag on that TIMEOUT would leave the ghost frozen on a board that never redraws.
  await page.evaluate(() => window.__laser.main.reset());
  await page.waitForTimeout(200);
  const ghost = await page.evaluate(async () => {
    const app = window.__laser.main, b0 = app.state.frames;
    app.hint(); app.hint(); app.hint();
    await new Promise((r) => setTimeout(r, 200));
    const shown = { frames: app.state.frames - b0, ghost: !!app.state.hintGhost, active: document.getElementById('btn-hint').classList.contains('is-active') };
    const b1 = app.state.frames;
    await new Promise((r) => setTimeout(r, app.theme.ui.hintGhostMs + 500));
    return { shown, gone: { frames: app.state.frames - b1, ghost: !!app.state.hintGhost, active: document.getElementById('btn-hint').classList.contains('is-active') } };
  });
  assert(ghost.shown.frames >= 1 && ghost.shown.ghost && ghost.shown.active, `the hint ghost draws a frame when it appears ${JSON.stringify(ghost.shown)}`);
  assert(ghost.gone.frames >= 1 && !ghost.gone.ghost && !ghost.gone.active, `and its 8 s timeout draws another to take it away ${JSON.stringify(ghost.gone)}`);

  // ---------- S8: travel is duration-capped and a tap finishes it instantly ----------
  await page.evaluate(() => window.__laser.main.loadLevel(19));
  await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 19);
  await page.waitForTimeout(200);
  const skip = await page.evaluate(async () => {
    const app = window.__laser.main, T = window.__laser.main.theme.beam.travel;
    app.fire();
    await new Promise((r) => setTimeout(r, 40));
    const total = window.__laser.render.getBeamProgress().total;
    await new Promise((r) => setTimeout(r, T.skipGraceMs + 60));
    const midway = window.__laser.render.getBeamProgress().cells;
    const t0 = performance.now();
    document.dispatchEvent(new Event('pointerdown'));
    await new Promise((res) => { const t = setInterval(() => { if (app.getViewModel().status !== 'tracing') { clearInterval(t); res(); } }, 16); setTimeout(res, 4000); });
    return { total, midway, ms: performance.now() - t0, status: app.getViewModel().status, cap: T.maxDurationMs, fullSpeedMs: total / T.cellsPerSecond * 1000 };
  });
  assert(skip.midway > 0 && skip.midway < skip.total && skip.ms < 400 && skip.status !== 'tracing',
    `a tap finishes the beam at once: ${skip.midway.toFixed(1)}/${skip.total.toFixed(1)} cells, done ${skip.ms.toFixed(0)} ms later (uncapped it would be ${skip.fullSpeedMs.toFixed(0)} ms)`);

  // ---------- the view toggle on the 24x24 board ----------
  await page.evaluate(() => window.__laser.main.reset());
  await page.waitForTimeout(250);
  const view = await page.evaluate(async () => {
    const r = window.__laser.render, b = document.getElementById('btn-fit');
    const read = () => ({ shown: b.offsetParent !== null, text: b.textContent.trim(), aria: b.getAttribute('aria-label'), mode: r.getViewMode(), cellPx: r.getCellPx() });
    const working = read();
    b.click();
    await new Promise((res) => { const t = setInterval(() => { if (!r.getCamera().animating) { clearInterval(t); res(); } }, 16); setTimeout(res, 3000); });
    const overview = read();
    b.click();
    await new Promise((res) => { const t = setInterval(() => { if (!r.getCamera().animating) { clearInterval(t); res(); } }, 16); setTimeout(res, 3000); });
    return { working, overview, back: read(), minCellPx: window.__laser.main.theme.camera.minCellPx };
  });
  assert(view.working.shown && view.working.text === 'ALL' && view.working.mode === 'working' && view.working.cellPx + 1e-6 >= view.minCellPx,
    `24x24 opens in WORKING at the ${view.minCellPx} px floor with an "ALL" button ${JSON.stringify(view.working)}`);
  assert(view.overview.mode === 'overview' && view.overview.text === 'ZOOM' && view.overview.cellPx < view.minCellPx,
    `pressing it goes to OVERVIEW (cell ${view.overview.cellPx.toFixed(1)} px) and the label flips to "ZOOM" ${JSON.stringify(view.overview)}`);
  assert(view.back.mode === 'working' && view.back.text === 'ALL' && Math.abs(view.back.cellPx - view.working.cellPx) < 1e-6,
    `and pressing again round-trips to WORKING ${JSON.stringify(view.back)}`);
  await page.evaluate(async () => {
    document.getElementById('btn-fit').click();
    await new Promise((res) => { const t = setInterval(() => { if (!window.__laser.render.getCamera().animating) { clearInterval(t); res(); } }, 16); setTimeout(res, 3000); });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/polish-overview-l20-${vp.name}.png` });
  await page.evaluate(() => document.getElementById('btn-fit').click());
  await page.waitForFunction(() => !window.__laser.render.getCamera().animating, null, { timeout: 4000 });

  // ---------- S5 + S10: the post-FIRE readout on a real target overflight ----------
  // This fixture is a level the TEST BUILDS and appends to the live level list, not one it searches for. Searching
  // the shipped set was tried twice and failed both times: a target flown OVER has to sit below the beam, but the
  // generator puts most targets on plateaus at the maximum height where nothing can be above them, and the few low
  // ones need three or more pieces to arrive over. That is a property of good level design, not a bug, so the test
  // supplies its own board and is immune to the next regeneration.
  // The board: the emitter fires east at ground level; a fixed WEDGE turns it north and starts it climbing; a fixed
  // MIRROR standing on a height-1 block turns it back east and, per DESIGN.md 12, PRESERVES the climb. It then
  // crosses the first target three levels above it and leaves the sky. A second target stays dark so the same shot
  // also exercises the "n of m lit" progress chip.
  const fly = await page.evaluate(() => {
    const level = {
      name: 'READOUT FIXTURE', par: 0, size: { w: 8, d: 8 },
      terrain: ['00000000', '00000000', '00000000', '00000000', '00100000', '00000000', '00000000', '00000000'],
      emitter: { x: 0, y: 3, dir: 'E' },
      targets: [{ x: 4, y: 4 }, { x: 6, y: 6 }],
      fixed: [{ x: 2, y: 3, type: 'WEDGE', orient: '/' }, { x: 2, y: 4, type: 'MIRROR', orient: '/' }],
      tray: ['MIRROR'],
    };
    const levels = window.__laser.main.levels;
    levels.push(level);
    const li = levels.length - 1;
    const L = window.__laser.sim.parseLevel(level);
    const r = window.__laser.sim.trace(level, []);
    const f = window.LaserMainTrace.flyover(L, r);
    if (!f || !f.above) return null;
    return { level: li, placed: [], beamZ: f.beamZ, targetZ: f.targetZ, lit: r.hits.length, total: L.targets.length, end: r.end };
  });
  const fireAt = async (pick) => {
    await page.evaluate((f) => { window.__laser.main.loadLevel(f.level); }, pick);
    await page.waitForFunction((f) => window.__laser.main.getViewModel().levelIndex === f.level, pick);
    await page.waitForTimeout(200);
    await page.evaluate((f) => { window.__laser.main.setPlaced(f.placed); }, pick);
    await page.waitForTimeout(200);
    await page.evaluate(() => window.__laser.main.fire());
    await page.waitForFunction(() => window.__laser.main.getViewModel().status === 'placing', null, { timeout: 8000 });
    await page.waitForTimeout(300);
  };
  if (fly) await fireAt(fly);
  const ro = await page.evaluate(() => {
    const box = document.getElementById('readout'), b = box.getBoundingClientRect();
    const R = window.__laser.render, L = window.__laser.main.getViewModel().level;
    const p00 = R.projectCell({ x: 0, y: 0 }, 0), p10 = R.projectCell({ x: 1, y: 0 }, 0), cell = Math.abs(p10.x - p00.x);
    const north = R.projectCell({ x: 0, y: L.size.d - 1 }, 0), east = R.projectCell({ x: L.size.w - 1, y: 0 }, 0);
    const board = { left: p00.x - cell / 2, right: east.x + cell / 2, top: north.y - cell / 2, bottom: p00.y + cell / 2 };
    // the board can overflow the stage (min-cell clamp), and #stage clips it, so compare against what is DRAWN
    const st = document.getElementById('stage').getBoundingClientRect();
    const drawn = { left: Math.max(board.left, st.left), right: Math.min(board.right, st.right),
      top: Math.max(board.top, st.top), bottom: Math.min(board.bottom, st.bottom) };
    const menu = document.querySelector('a.menu-link').getBoundingClientRect();
    const hits = (a, c) => !(a.right <= c.left + 0.5 || c.right <= a.left + 0.5 || a.bottom <= c.top + 0.5 || c.bottom <= a.top + 0.5);
    return { hidden: box.hidden, msg: box.querySelector('.readout-msg').textContent, drawn,
      chips: Array.from(box.querySelectorAll('.chip')).map((c) => c.textContent.replace(/\s+/g, ' ').trim()),
      kind: box.getAttribute('data-kind'), overBoard: hits(b, drawn), overMenu: hits(b, menu),
      inViewport: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5,
      vm: window.__laser.main.getViewModel().readout, fontPx: getComputedStyle(box).fontSize };
  });
  assert(!!fly && !ro.hidden && /flew over the target/.test(ro.msg),
    `readout names what happened on level ${fly && fly.level + 1} ${JSON.stringify(fly && fly.placed)}: "${ro.msg}"`);
  // The altitudes come from the trace, not from a memorised pair of numbers, but they must still both be printed as
  // a NUMBER (the ^ prefix) and they must differ - that is the whole point of the chip, and colour alone will not do.
  assert(!!fly && fly.beamZ !== fly.targetZ &&
    ro.chips.some((c) => new RegExp('\\^' + fly.beamZ + '\\b').test(c)) && ro.chips.some((c) => new RegExp('\\^' + fly.targetZ + '\\b').test(c)),
    `readout gives both altitudes as numbers (beam ^${fly && fly.beamZ}, target ^${fly && fly.targetZ}) ${JSON.stringify(ro.chips)}`);
  // Multi-target progress. findFlyover prefers a multi-target level so this is normally the same single FIRE the
  // altitude chips came from; if the level set ever offers no multi-target overflight, fire a second one for it.
  let prog = fly && fly.total > 1 ? { pick: fly, chips: ro.chips } : null;
  if (!prog) {
    const pick = await findProgress(page);
    if (pick) { await fireAt(pick); prog = { pick, chips: await page.evaluate(() => Array.from(document.querySelectorAll('#readout .chip')).map((c) => c.textContent.replace(/\s+/g, ' ').trim())) }; }
  }
  assert(!!prog && prog.chips.some((c) => c === `${prog.pick.lit} of ${prog.pick.total} lit`) && prog.pick.total > 1,
    `readout shows multi-target progress ${JSON.stringify(prog && prog.chips)}`);
  assert(!ro.overBoard && !ro.overMenu && ro.inViewport, `readout covers neither the board nor the Menu link ${JSON.stringify(ro)}`);
  await page.screenshot({ path: `${SHOTS}/polish-readout-${vp.name}.png` });
  // Other end reasons speak kid language too. Which level produces which end is level data, so each one is searched
  // for (findEnds) instead of hard-coded - two of the four old fixtures had drifted onto the same 'blocked' ending.
  const WANT = { blocked: /hit a wall/, 'lost-sky': /too high/, 'lost-floor': /fell to the floor/, 'lost-edge': /left the board/ };
  const picks = await findEnds(page, Object.keys(WANT));
  const reasons = await page.evaluate(async (p) => {
    const app = window.__laser.main, out = {};
    for (const end of Object.keys(p)) {
      app.loadLevel(p[end].level);
      await new Promise((r) => setTimeout(r, 120));
      app.setPlaced(p[end].placed);
      await new Promise((r) => setTimeout(r, 120));
      app.fire();
      await new Promise((res) => { const t = setInterval(() => { if (app.getViewModel().status !== 'tracing') { clearInterval(t); res(); } }, 16); setTimeout(res, 6000); });
      await new Promise((r) => setTimeout(r, 60));
      out[end] = { level: p[end].level + 1, placed: p[end].placed, end: app.getViewModel().beamResult.end, msg: document.getElementById('readout').textContent.trim() };
    }
    return out;
  }, picks);
  assert(Object.keys(WANT).every((end) => reasons[end] && reasons[end].end === end && WANT[end].test(reasons[end].msg)),
    `every end reason is reachable and reads in kid language ${JSON.stringify(reasons)}`);

  // ---------- S4: RESET does not hand back a tilted board mid-swing ----------
  await page.evaluate(() => { window.__laser.main.loadLevel(0); });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__laser.main.tilt());
  await page.waitForFunction(() => !window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating, null, { timeout: 4000 });
  const resetting = await page.evaluate(async () => {
    const app = window.__laser.main;
    app.reset();
    await new Promise((r) => setTimeout(r, 80));
    const mid = { flat: window.__laser.render.isFlat(), inputEnabled: window.__laser.input.isEnabled(),
      cameraBusy: app.getViewModel().cameraBusy, resetDisabled: document.getElementById('btn-reset').disabled,
      tiltDisabled: document.getElementById('btn-tilt').disabled };
    await new Promise((res) => { const t = setInterval(() => { if (!app.getViewModel().cameraBusy) { clearInterval(t); res(); } }, 16); setTimeout(res, 4000); });
    const end = { flat: window.__laser.render.isFlat(), inputEnabled: window.__laser.input.isEnabled(), tilts: app.getViewModel().tiltsUsed, status: app.getViewModel().status };
    return { mid, end };
  });
  assert(!resetting.mid.flat && !resetting.mid.inputEnabled && resetting.mid.cameraBusy && resetting.mid.resetDisabled && resetting.mid.tiltDisabled,
    `RESET keeps input and controls locked while the camera is still tilted ${JSON.stringify(resetting.mid)}`);
  assert(resetting.end.flat && resetting.end.inputEnabled && resetting.end.tilts === 0 && resetting.end.status === 'idle',
    `and hands the new attempt over flat, with tiltsUsed 0 ${JSON.stringify(resetting.end)}`);

  // ---------- S3: stars are three criteria, not a rank. Hint + no tilt = solve and blind, par dark. ----------
  await page.evaluate(() => { (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 0, highestUnlocked: 19, stars: {}, muted: true, seenHelp: true, intros: {}, revealed: {} })); });
  await boot();
  const hinted = await page.evaluate(async () => {
    const app = window.__laser.main;
    app.loadLevel(0);
    await new Promise((r) => setTimeout(r, 150));
    app.hint(); app.hint(); app.hint();
    app.setPlaced(app.levels[0].solution);
    await new Promise((r) => setTimeout(r, 150));
    app.fire();
    await new Promise((res) => { const t = setInterval(() => { if (!document.getElementById('modal-victory').hidden) { clearInterval(t); res(); } }, 40); setTimeout(res, 9000); });
    await new Promise((r) => setTimeout(r, 400));
    return { modal: Array.from(document.querySelectorAll('#modal-victory .star')).map((s) => s.getAttribute('data-earned')),
      hud: Array.from(document.querySelectorAll('#hud-stars .star')).map((s) => s.getAttribute('data-earned')),
      saved: JSON.parse(localStorage.getItem('lasers3d.v1')).stars['0'],
      vm: window.__laser.main.getViewModel().stars, tilts: app.getViewModel().tiltsUsed, hintUsed: app.getViewModel().hintUsed };
  });
  assert(JSON.stringify(hinted.modal) === '["true","false","false"]' && JSON.stringify(hinted.hud) === '["true","false","false"]',
    `an exact hint leaves SOLVE earned and both unassisted criteria dark ${JSON.stringify(hinted)}`);
  assert(hinted.saved && hinted.saved.solved === true && hinted.saved.par === false && hinted.saved.blind === false,
    `and stores the criteria, not a count ${JSON.stringify(hinted.saved)}`);
  await page.screenshot({ path: `${SHOTS}/polish-victory-${vp.name}.png` });
  await page.click('#modal-victory .modal-close');
  await page.waitForFunction(() => document.getElementById('modal-victory').hidden);
  // a later par-only solve must OR in, never overwrite, the blind star
  const merged = await page.evaluate(async () => {
    const app = window.__laser.main;
    app.reset();
    await new Promise((r) => setTimeout(r, 200));
    app.setPlaced(app.levels[0].solution);
    await new Promise((r) => setTimeout(r, 120));
    app.tilt();                                       // tilting is free for campaign stars
    await new Promise((r) => setTimeout(r, 900));
    app.fire();
    await new Promise((res) => { const t = setInterval(() => { if (!document.getElementById('modal-victory').hidden) { clearInterval(t); res(); } }, 40); setTimeout(res, 9000); });
    return { attempt: app.getViewModel().attemptStars, saved: JSON.parse(localStorage.getItem('lasers3d.v1')).stars['0'] };
  });
  assert(merged.attempt.blind === true && merged.saved.par === true && merged.saved.blind === true,
    `an unassisted tilted replay earns all three campaign stars ${JSON.stringify(merged)}`);
  await page.evaluate(() => window.__laser.ui.hideVictory());

  // ---------- S6: the one-time reveal is exclusive, and only consumed when it finishes ----------
  await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 3, highestUnlocked: 19, stars: {}, muted: true, seenHelp: true, intros: { 3: true }, revealed: {} })));
  await boot();
  await page.click('#btn-fire');
  await page.waitForFunction(() => window.__laser.main.getViewModel().revealPlaying, null, { timeout: 8000 });
  const during = await page.evaluate(() => ({
    levels: document.getElementById('btn-levels').disabled, help: document.getElementById('btn-help').disabled,
    more: document.getElementById('btn-more').disabled, tilt: document.getElementById('btn-tilt').disabled,
    reset: document.getElementById('btn-reset').disabled, input: window.__laser.input.isEnabled(),
    levelChangeRefused: window.__laser.main.loadLevel(0) === false,
    levelStillFour: window.__laser.main.getViewModel().levelIndex === 3,
    flagNotYetWritten: !((JSON.parse(localStorage.getItem('lasers3d.v1')).revealed || {})['3'])
  }));
  assert(during.levels && during.help && during.more && during.tilt && during.reset && !during.input,
    `reveal is exclusive: Levels/Help/More/TILT/RESET disabled and board input off ${JSON.stringify(during)}`);
  assert(during.levelChangeRefused && during.levelStillFour, `a level change during the reveal is refused ${JSON.stringify(during)}`);
  assert(during.flagNotYetWritten, 'the "seen" flag is NOT written while the reveal is still playing');
  // interrupt it by reloading: the lesson must survive to be replayed
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
  await page.waitForTimeout(200);
  const afterReload = await page.evaluate(() => (JSON.parse(localStorage.getItem('lasers3d.v1')).revealed || {})['3']);
  assert(!afterReload, 'a reload mid-reveal leaves the lesson unconsumed, so it can replay');
  await page.click('#btn-fire');
  await page.waitForFunction(() => window.__laser.main.getViewModel().revealPlaying, null, { timeout: 8000 });
  await page.waitForFunction(() => !window.__laser.main.getViewModel().revealPlaying && window.__laser.render.isFlat(), null, { timeout: 12000 });
  const afterPlay = await page.evaluate(() => ({ flag: (JSON.parse(localStorage.getItem('lasers3d.v1')).revealed || {})['3'],
    tilts: window.__laser.main.getViewModel().tiltsUsed, levelsEnabled: !document.getElementById('btn-levels').disabled }));
  assert(afterPlay.flag === true && afterPlay.tilts === 0 && afterPlay.levelsEnabled,
    `it replays, then records itself once it actually finishes ${JSON.stringify(afterPlay)}`);

  // ---------- screenshots: flat and tilted ----------
  await page.evaluate(() => { window.__laser.main.loadLevel(8); });
  await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 8);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/polish-flat-${vp.name}.png` });
  await page.evaluate(() => window.__laser.main.tilt());
  await page.waitForFunction(() => !window.__laser.render.getCamera().animating, null, { timeout: 4000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/polish-tilted-${vp.name}.png` });

  assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
  await ctx.close();
}

async function run() {
  const { port, proc } = await startServer();
  const browser = await webkit.launch(webkitLaunchOptions());
  const url = `http://127.0.0.1:${port}/games/lasers-3d/`;
  try {
    await layoutPass(browser, url);
    await robustnessPass(browser, url);
    for (const vp of VIEWPORTS) await polishPass(browser, url, vp);
    for (const vp of VIEWPORTS) {
      console.log(`\n== ${vp.name} ${vp.width}x${vp.height} @${vp.dpr}x`);
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: true, hasTouch: true, deviceScaleFactor: vp.dpr });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !IGNORE.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

      // ---- first launch: level 1, how-to-play opens by itself ----
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
      assert(await page.evaluate(() => document.getElementById('modal-help').hidden), 'first launch starts with the playable lesson');
      await page.evaluate(() => window.__laser.ui.showHowToPlay());
      await page.waitForFunction(() => !document.getElementById('modal-help').hidden, null, { timeout: 3000 });
      assert(await page.evaluate(() => window.__laser.ui.isModalOpen() && !window.__laser.input.isEnabled()), 'how-to-play opens on first launch; board input disabled while open');
      await page.click('#modal-help .modal-close');
      await page.waitForFunction(() => document.getElementById('modal-help').hidden);
      await page.waitForTimeout(250);
      let v = await vm(page);
      assert(v.levelIndex === 0 && v.status === 'idle' && v.isFlat && v.trayRemaining.MIRROR === 2, `level 1 loaded idle/flat ${JSON.stringify({ i: v.levelIndex, s: v.status, flat: v.isFlat, tray: v.trayRemaining })}`);
      assert(await page.evaluate(() => window.__laser.input.isEnabled()), 'input re-enabled after closing help');
      assert(await page.evaluate(() => document.getElementById('hud-pieces').textContent === 'PIECES 0/1' && document.getElementById('hud-camera').getAttribute('data-camera') === 'flat'), 'HUD reads PIECES 0/1 and FLAT');
      assert(await page.evaluate(() => document.getElementById('toast').classList.contains('is-visible')), 'intro toast shown after the help closes');
      const dprInfo = await page.evaluate(() => ({ dpr: window.__laser.render._renderer.getPixelRatio(), css: document.getElementById('board').getBoundingClientRect().width, buf: document.getElementById('board').width }));
      assert(dprInfo.dpr <= 2 && Math.abs(dprInfo.buf - dprInfo.css * dprInfo.dpr) <= 2, `renderer DPR capped at 2 ${JSON.stringify(dprInfo)}`);
      await page.screenshot({ path: `${SHOTS}/game-flat-${vp.name}.png` });

      // ---- solve level 1 by taps: tray -> cell from level.solution -> FIRE ----
      const s1 = await solveBySolution(page, 1);   // level 1: par 1, one MIRROR
      assert(s1.ok, `level 1 solution placed by taps ${JSON.stringify(s1.placed)}`);
      v = await vm(page);
      assert(v.status === 'placing' && v.canUndo && !v.canRedo && v.beamResult && v.beamResult.allTargetsHit, `live retrace after placing: status ${v.status}, canUndo ${v.canUndo}, beam hits target ${v.beamResult && v.beamResult.allTargetsHit}`);
      assert(await page.evaluate(() => document.querySelectorAll('#hud-stars .star[data-earned="true"]').length === 0), 'no stars in the HUD before the win');
      await page.click('#btn-fire');
      await page.waitForFunction(() => window.__laser.main.getViewModel().status === 'tracing');
      await settle(page);
      assert(await page.evaluate(() => document.getElementById('btn-fire').disabled && !window.__laser.input.isEnabled()), 'FIRE disables controls and input while tracing');
      await page.waitForFunction(() => !document.getElementById('modal-victory').hidden, null, { timeout: 8000 });
      await page.waitForTimeout(800);
      v = await vm(page);
      assert(v.status === 'won' && v.fires === 1 && v.tiltsUsed === 0 && !v.hintUsed, `won on the first fire ${JSON.stringify({ status: v.status, fires: v.fires, tilts: v.tiltsUsed })}`);
      const vs = await page.evaluate(() => ({ earned: document.querySelectorAll('#modal-victory .star[data-earned="true"]').length, awarded: document.querySelectorAll('#modal-victory .star.is-awarded').length, stats: document.querySelector('#modal-victory .victory-stats').textContent }));
      assert(vs.earned === 3 && vs.awarded === 3, `victory modal shows 3 stars ${JSON.stringify(vs)}`);
      const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('lasers3d.v1')));
      assert(prog.schema === 3 && prog.stars['0'] && prog.stars['0'].solved === true && prog.stars['0'].par === true && prog.stars['0'].blind === true && prog.highestUnlocked >= 1,
        `progress saved as criterion flags at schema 3 ${JSON.stringify({ schema: prog.schema, stars: prog.stars, hu: prog.highestUnlocked })}`);
      assert(await page.evaluate(() => document.querySelectorAll('#hud-stars .star[data-earned="true"]').length === 3), 'HUD shows 3 stars after the win');
      const mh = await page.evaluate(menuHit);
      assert(mh.hit && mh.z === '9999', `Menu link is elementFromPoint at its center with the victory modal open ${JSON.stringify(mh)}`);
      await page.screenshot({ path: `${SHOTS}/game-victory-${vp.name}.png` });
      await page.click('#btn-next');
      await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 1);
      v = await vm(page);
      assert(v.levelIndex === 1 && v.status === 'idle' && v.placed.length === 0 && v.fires === 0, 'NEXT LEVEL loads level 2 fresh');

      // ---- unlock level 5 by writing progress, reload, go there through the level select ----
      // deliberately the OLD numeric schema: it must migrate, not be discarded
      await page.evaluate(() => (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify({ currentLevel: 0, highestUnlocked: 4, stars: { '0': 3 }, muted: false, seenHelp: true })));
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
      await page.waitForTimeout(250);
      assert(await page.evaluate(() => document.getElementById('modal-help').hidden), 'help does not reopen once seen');
      const docked = await page.evaluate(() => getComputedStyle(document.getElementById('btn-more')).display !== 'none');
      await openMore(page);
      await page.click('#btn-levels');
      await page.waitForFunction(() => !document.getElementById('modal-levels').hidden);
      // The COUNT comes from the shipped set, not from a literal: the level set is regenerated by the solver and
      // grew from 20 to 23 the moment section 14's floor mirrors and section 15's dark levels were added. What is
      // actually under test is the grid's ARITHMETIC - one tile per level, everything past highestUnlocked locked,
      // and the level just unlocked reachable - and that holds whatever the set is.
      const tiles = await page.evaluate(() => ({ n: document.querySelectorAll('.level-tile').length, locked: document.querySelectorAll('.level-tile[data-state="locked"]').length, five: document.querySelector('.level-tile[data-index="4"]').getAttribute('data-state'), levels: window.__laser.main.levels.length }));
      assert(tiles.n === tiles.levels && tiles.locked === tiles.levels - 5 && tiles.five !== 'locked', `level select: ${tiles.levels} tiles, ${tiles.levels - 5} locked, level 5 open ${JSON.stringify(tiles)}`);
      const mh2 = await page.evaluate(menuHit);
      assert(mh2.hit, `Menu link wins with the level select open ${JSON.stringify(mh2)}`);
      await page.screenshot({ path: `${SHOTS}/game-levels-${vp.name}.png` });
      await page.click('.level-tile[data-index="4"]');
      await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 4 && document.getElementById('modal-levels').hidden);
      await page.waitForTimeout(200);
      v = await vm(page);
      assert(v.level.name === 'UP THE STAIRS' && v.trayRemaining.WEDGE === 1 && v.trayRemaining.MIRROR === 2,
        `level 5 loaded ${JSON.stringify({ name: v.level.name, tray: v.trayRemaining, par: v.level.par })}`);

      // ---- solve level 5 (wedge, par 2) and fire ----
      const s5 = await solveBySolution(page, 2);
      assert(s5.ok && s5.placed[0].type === 'WEDGE', `level 5 wedge placed ${JSON.stringify(s5.placed)}`);
      await page.click('#btn-fire');
      await page.waitForFunction(() => !document.getElementById('modal-victory').hidden, null, { timeout: 8000 });
      v = await vm(page);
      assert(v.status === 'won' && v.beamResult.end === 'target' && v.beamResult.endPoint.z === 3, `level 5 won; beam climbed to z=3 ${JSON.stringify(v.beamResult.endPoint)}`);
      assert(await page.evaluate(() => document.querySelectorAll('#modal-victory .star[data-earned="true"]').length === 3), 'level 5 victory shows 3 stars');
      await page.click('#modal-victory .modal-close');
      await page.waitForFunction(() => document.getElementById('modal-victory').hidden);

      // ---- orbit by dragging empty board space; tilt pill; FLAT button ----
      const empty = await cellPoint(page, await visibleEmptyCell(page));
      await page.mouse.move(empty.x, empty.y); await page.mouse.down();
      for (let i = 1; i <= 8; i++) { await page.mouse.move(empty.x + i * 12, empty.y + i * 10); await page.waitForTimeout(16); }
      await page.mouse.up();
      await page.waitForFunction(() => !window.__laser.render.isFlat() && document.getElementById('hud-camera').getAttribute('data-camera') === 'tilt', null, { timeout: 3000 });
      v = await vm(page);
      const cam = await page.evaluate(() => window.__laser.render.getCamera());
      assert(!v.isFlat && v.camera === 'tilt' && v.tiltsUsed === 1, `drag orbits: isFlat false, tilt pill, tiltsUsed ${v.tiltsUsed} (elev ${cam.elevationDeg.toFixed(1)})`);
      assert(await page.evaluate(() => document.getElementById('hud-camera').textContent === '3D' && document.getElementById('btn-tilt').textContent === '3D' && document.getElementById('btn-tilt').getAttribute('aria-pressed') === 'true'), '3D view is labelled and selected');
      await page.click('#btn-flat');   // direct 2D view
      await page.waitForFunction(() => window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating, null, { timeout: 3000 });
      v = await vm(page);
      assert(v.isFlat && v.tiltsUsed === 1, `FLAT snaps back (isFlat true) without counting a tilt (tiltsUsed ${v.tiltsUsed})`);
      await page.click('#btn-tilt');   // now a real TILT press
      await page.waitForFunction(() => !window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating, null, { timeout: 3000 });
      v = await vm(page);
      assert(!v.isFlat && v.tiltsUsed === 2 && v.attemptStarCount === 3 && v.attemptStars.blind === true,
        `TILT press counts (tiltsUsed ${v.tiltsUsed}); campaign star eligibility is unchanged ${JSON.stringify(v.attemptStars)}`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SHOTS}/game-tilted-${vp.name}.png` });
      await page.click('#btn-flat');
      await page.waitForFunction(() => window.__laser.render.isFlat() && !window.__laser.render.getCamera().animating, null, { timeout: 3000 });

      // ---- RESET restores eligibility; undo/redo; floating remove ----
      await page.click('#btn-reset');
      await page.waitForTimeout(200);
      v = await vm(page);
      assert(v.status === 'idle' && v.placed.length === 0 && v.tiltsUsed === 0 && v.fires === 0 && !v.canUndo, 'RESET clears pieces, counters and the undo stack');
      const free = await visibleEmptyCell(page);
      const trayMirrors = (await vm(page)).trayRemaining.MIRROR;
      await page.click('.tray-card[data-type="MIRROR"]');
      await tapCell(page, free);
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 1);
      await tapCell(page, free);   // tap a placed piece: rotate + floating controls
      await page.waitForFunction(() => (window.__laser.main.getViewModel().placed[0] || {}).orient === '\\');
      assert(await page.evaluate(() => !document.getElementById('piece-controls').hidden && window.__laser.main.getViewModel().selectedCell !== null), 'tap on a placed piece rotates it and shows the floating controls');
      await page.click('#btn-remove');
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 0);
      v = await vm(page);
      assert(v.placed.length === 0 && v.canUndo && v.trayRemaining.MIRROR === trayMirrors, `floating X returns the piece to the tray (${v.trayRemaining.MIRROR} MIRROR)`);
      await openMore(page);
      await page.click('#btn-undo');
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 1);
      v = await vm(page);
      assert(v.placed.length === 1 && v.placed[0].orient === '\\' && v.canRedo, 'undo restores the rotated piece; redo available');
      await openMore(page);
      await page.click('#btn-redo');
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 0);
      assert((await vm(page)).placed.length === 0, 'redo re-applies the removal');

      // ---- keyboard mode: arrows + Enter place, H hint, Delete removes ----
      await page.evaluate(() => window.__laser.main.reset());
      await page.keyboard.press('2');   // tray slot 2 = WEDGE (cards are always MIRROR, WEDGE, DIP)
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
      await page.keyboard.press('h'); await page.keyboard.press('h'); await page.keyboard.press('h');   // exact hint while the solution is not placed yet: ghost + par star forfeited
      await page.waitForTimeout(150);
      v = await vm(page);
      assert(v.hintUsed && v.attemptStars.par === false && v.attemptStars.blind === false && v.attemptStarCount === 1 && await page.evaluate(() => document.getElementById('btn-hint').classList.contains('is-active')), `H shows the hint ghost and forfeits the PAR star ${JSON.stringify(v.attemptStars)}`);
      const em = await page.evaluate(() => { const L = window.__laser.main.getViewModel().level; return { x: L.emitter.x, y: L.emitter.y, w: L.size.w }; });
      const wantX = Math.min(em.x + 3, em.w - 1);   // the cursor is clamped to the board
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 1);
      v = await vm(page);
      assert(v.selectedTray === null && v.placed[0].type === 'WEDGE' && v.placed[0].x === wantX && v.placed[0].y === em.y && v.cursorCell && v.cursorCell.x === wantX,
        `keyboard: 2 arms the wedge, three arrows walk the cursor east from the emitter (${em.x},${em.y}) to x=${wantX}, Enter places ${JSON.stringify(v.placed[0])}`);
      await page.keyboard.press('Delete');
      await page.waitForFunction(() => window.__laser.main.getViewModel().placed.length === 0);
      assert((await vm(page)).placed.length === 0, 'Delete removes the piece under the cursor');
      // H with the WHOLE solution already down says so instead of showing another ghost
      await page.evaluate(() => window.__laser.main.setPlaced(window.__laser.main.levels[window.__laser.main.getViewModel().levelIndex].solution));
      await page.waitForTimeout(150);
      await page.keyboard.press('h');
      await page.waitForTimeout(120);
      assert(await page.evaluate(() => document.getElementById('toast').classList.contains('is-visible') && /FIRE/.test(document.getElementById('toast').textContent)), 'H with the solution in place says to press FIRE');
      await page.evaluate(() => window.__laser.main.reset());
      await page.waitForTimeout(150);

      // ---- free reveal on level 4: first failed FIRE auto-tilts then returns flat, no tilt counted ----
      await page.evaluate(() => window.__laser.main.loadLevel(3));
      await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 3);
      await page.waitForTimeout(150);
      await page.click('#btn-fire');
      await page.waitForFunction(() => window.__laser.main.getViewModel().revealPlaying, null, { timeout: 6000 });
      assert(await page.evaluate(() => document.getElementById('btn-tilt').disabled && document.getElementById('btn-reset').disabled && !window.__laser.input.isEnabled()), 'reveal: TILT/RESET disabled and input off');
      await page.waitForFunction(() => !window.__laser.render.isFlat(), null, { timeout: 4000 });
      await page.waitForFunction(() => !window.__laser.main.getViewModel().revealPlaying && window.__laser.render.isFlat(), null, { timeout: 8000 });
      v = await vm(page);
      assert(v.tiltsUsed === 0 && v.status === 'placing' && v.fires === 1 && !v.beamResult.allTargetsHit, `reveal finished flat; tiltsUsed ${v.tiltsUsed}, status ${v.status}`);
      assert(await page.evaluate(() => !!(JSON.parse(localStorage.getItem('lasers3d.v1')).revealed || {})['3']), 'reveal recorded once per level in progress');
      await page.click('#btn-fire');
      await page.waitForFunction(() => window.__laser.main.getViewModel().status === 'placing' && window.__laser.main.getViewModel().fires === 2, null, { timeout: 8000 });
      await page.waitForTimeout(500);
      assert(!(await vm(page)).revealPlaying && await page.evaluate(() => window.__laser.render.isFlat()), 'second failed fire does not replay the reveal');

      // ---- DESIGN.md 15: darkness, end to end in the real game ----------------------------------------------
      // The renderer's own proof (unknown draws nothing, known is pixel-identical to a lit board) lives in
      // test/render.smoke.mjs. What is tested HERE is the part that is game state rather than pixels: what the
      // level opens knowing, that a SHOT is what teaches it, and that nothing is ever taken back - not by RESET,
      // not by leaving the level, not by closing the tab.
      const darkIndex = await page.evaluate(() => {
        const L = window.__laser.main.levels;
        for (let i = 0; i < L.length; i++) if (window.__laser.sim.parseLevel(L[i]).dark) return i;
        return -1;
      });
      if (darkIndex < 0) {
        console.log('  --   no level in the shipped set carries `dark: true`; darkness checks skipped (level DATA)');
      } else {
        await page.evaluate((i) => window.__laser.main.loadLevel(i), darkIndex);
        await page.waitForFunction((i) => window.__laser.main.getViewModel().levelIndex === i, darkIndex);
        await page.waitForTimeout(300);
        v = await vm(page);
        const seed = await page.evaluate(() => {
          const app = window.__laser.main, L = app.state.level, known = app.knownList();
          const isSeed = (c) => (c.x === L.emitter.x && c.y === L.emitter.y) || L.targets.some((t) => t.x === c.x && t.y === c.y);
          return { known: known.length, extras: known.filter((c) => !isSeed(c)).length, targets: L.targets.length, cells: L.size.w * L.size.d };
        });
        assert(v.dark === true && seed.known === 1 + seed.targets && seed.extras === 0,
          `level ${darkIndex + 1} opens dark knowing exactly the emitter and its ${seed.targets} target(s) ` +
          `(${seed.known} of ${seed.cells} cells)`);
        assert(await page.evaluate(() => { const d = document.getElementById('hud-dark'); return !d.hidden && /^DARK \d+%$/.test(d.textContent); }),
          `the HUD says the level is dark and how much is uncovered ("${await page.evaluate(() => document.getElementById('hud-dark').textContent)}")`);
        // the live retrace draws a beam but teaches nothing: firing is what surveys (15.2)
        const beforeFire = (await vm(page)).known;
        await page.waitForTimeout(300);
        assert((await vm(page)).known === beforeFire,
          `the pre-FIRE beam preview reveals nothing: still ${beforeFire} cells known`);
        // FIRE: the board opens ALONG the beam, in step with it, not all at once when the trigger is pulled
        await page.click('#btn-fire');
        await page.waitForFunction(() => window.__laser.main.getViewModel().known > 2, null, { timeout: 8000 });
        const midFlight = await page.evaluate(() => ({ known: window.__laser.main.getViewModel().known, status: window.__laser.main.getViewModel().status }));
        await page.waitForFunction(() => window.__laser.main.getViewModel().status !== 'tracing', null, { timeout: 15000 });
        await page.waitForTimeout(400);
        const afterFire = await page.evaluate(() => {
          const app = window.__laser.main, L = app.state.level, r = app.state.result;
          const known = {};
          app.knownList().forEach((c) => { known[c.x + ',' + c.y] = 1; });
          const missed = (r.visited || []).filter((c) => !known[c.x + ',' + c.y]);
          return { known: app.knownList().length, visited: (r.visited || []).length, missed: missed.length,
            hud: document.getElementById('hud-dark').textContent };
        });
        assert(midFlight.status === 'tracing' && midFlight.known > beforeFire && midFlight.known < afterFire.known,
          `the board opens as the beam travels: ${beforeFire} -> ${midFlight.known} mid-flight -> ${afterFire.known} at the end`);
        assert(afterFire.missed === 0 && afterFire.known >= beforeFire + 2,
          `every one of the ${afterFire.visited} cells the beam entered is now known (${afterFire.missed} missed)`);
        assert(/^DARK \d+%$/.test(afterFire.hud) && afterFire.hud !== 'DARK 0%',
          `and the HUD coverage moved with it ("${afterFire.hud}")`);
        // 15.1: RESET keeps what is known. It is not part of an attempt.
        const learned = afterFire.known;
        await page.click('#btn-reset');
        await page.waitForTimeout(600);
        v = await vm(page);
        assert(v.known === learned && v.placed.length === 0 && v.fires === 0,
          `RESET clears the attempt and keeps the ${learned} cells discovered (known ${v.known}, fires ${v.fires})`);
        // 15.1: leaving and re-entering the level keeps it too
        await page.evaluate(() => window.__laser.main.loadLevel(0));
        await page.waitForFunction(() => window.__laser.main.getViewModel().levelIndex === 0);
        await page.waitForTimeout(200);
        assert((await vm(page)).dark === false && await page.evaluate(() => document.getElementById('hud-dark').hidden),
          'a lit level shows no dark indicator');
        await page.evaluate((i) => window.__laser.main.loadLevel(i), darkIndex);
        await page.waitForFunction((i) => window.__laser.main.getViewModel().levelIndex === i, darkIndex);
        await page.waitForTimeout(300);
        assert((await vm(page)).known === learned, `re-entering the level keeps them (${(await vm(page)).known})`);
        // and so does a reload: a page reload is the strongest form of "leaving and re-entering", and 15.1 calls
        // re-learning a board tedium rather than difficulty. The record is guarded by the board's own fingerprint.
        const saved = await page.evaluate(() => (JSON.parse(localStorage.getItem('lasers3d.v1')).known || {}));
        assert(saved[String(darkIndex)] && typeof saved[String(darkIndex)].b === 'string' && saved[String(darkIndex)].f,
          `the discovered set is saved, packed, with the board's size and fingerprint ${JSON.stringify(Object.keys(saved[String(darkIndex)] || {}))}`);
        // main clamps the level it opens on to highestUnlocked, so unlock this far before reloading into it
        await page.evaluate((i) => { const p = JSON.parse(localStorage.getItem('lasers3d.v1')); p.currentLevel = i; p.currentId = window.__lasers3d.levels[i].id; window.__lasers3d.levels.slice(0,i+1).forEach(l => { p.records[l.id].unlocked = true; }); p.highestUnlocked = Math.max(p.highestUnlocked | 0, i); (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify(p)); }, darkIndex);
        await page.reload({ waitUntil: 'load' });
        await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
        await page.waitForTimeout(400);
        v = await vm(page);
        assert(v.levelIndex === darkIndex && v.known === learned,
          `a reload restores them too (${v.known} of ${v.knownTotal} on level ${v.levelIndex + 1})`);
        // a stale record must NOT un-hide a board the player has never seen: the level set is regenerated, so the
        // index alone is not an identity.
        await page.evaluate((i) => {
          const p = JSON.parse(localStorage.getItem('lasers3d.v1'));
          p.known[String(i)].f = 'notthisboard'; p.records[window.__lasers3d.levels[i].id].known.f = 'notthisboard';
          (window.__lasers3d && window.__lasers3d.destroy()) || localStorage.setItem('lasers3d.v1', JSON.stringify(p));
        }, darkIndex);
        await page.reload({ waitUntil: 'load' });
        await page.waitForFunction(() => window.__laser && window.__laser.main && window.__laser.main.getViewModel().level);
        await page.waitForTimeout(400);
        v = await vm(page);
        assert(v.levelIndex === darkIndex && v.known === 1 + seed.targets,
          `a record whose fingerprint does not match this board is discarded, back to the seed (${v.known} on level ${v.levelIndex + 1})`);
        // the beam has to stay readable, because on a dark board it is most of what the player has (15.2)
        await page.click('#btn-fire');
        await page.waitForFunction(() => window.__laser.main.getViewModel().status !== 'tracing', null, { timeout: 15000 });
        await page.waitForTimeout(400);
        const beamRead = await page.evaluate(() => {
          const r = window.__laser.render;
          let tubes = 0, badges = 0, badgesShown = 0;
          r._scene.traverse((o) => {
            if (o.name === 'beamTubes') tubes = o.children.length;
            if (o.name === 'beamBadges') { badges = o.children.length; badgesShown = o.children.filter((b) => b.visible).length; }
          });
          const ro = (JSON.parse(localStorage.getItem('lasers3d.v1')), document.getElementById('readout'));
          return { tubes, badges, badgesShown, readout: !ro.hidden && ro.textContent.trim().length > 0 };
        });
        assert(beamRead.tubes > 0 && beamRead.badges > 0 && beamRead.badgesShown === beamRead.badges,
          `on a dark board the beam still draws (${beamRead.tubes} tube meshes) and every altitude badge is shown ` +
          `(${beamRead.badgesShown} of ${beamRead.badges})`);
        assert(beamRead.readout, 'and the post-fire readout is on screen, which is the rest of what a dark board gives you');
        // 15.1: anything the player has placed is always drawn, known cell or not
        const placedInDark = await page.evaluate(() => {
          const app = window.__laser.main, L = app.state.level, sim = window.__laser.sim;
          const known = {};
          app.knownList().forEach((c) => { known[c.x + ',' + c.y] = 1; });
          for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) {
            if (known[x + ',' + y]) continue;
            if (!sim.canPlace(L, [], x, y)) continue;
            app.setPlaced([{ x, y, type: L.tray[0], orient: '/' }]);
            return { x, y, known: !!known[x + ',' + y] };
          }
          return null;
        });
        await page.waitForTimeout(300);
        const drawn = await page.evaluate(() => {
          let n = 0;
          window.__laser.render._scene.traverse((o) => { if (o.userData && o.userData.type && o.parent && o.parent.type === 'Group') n++; });
          const pieces = window.__laser.render._scene.getObjectByName('pieces');
          const placedGroup = pieces && pieces.children.filter((c) => c.type === 'Group' && c.children.some((k) => k.userData && k.userData.type));
          return { groups: placedGroup ? placedGroup.length : 0, visible: placedGroup ? placedGroup[0].children.every((k) => k.visible) : false };
        });
        assert(placedInDark && drawn.groups > 0 && drawn.visible,
          `a piece the player puts in an UNKNOWN cell (${placedInDark && placedInDark.x},${placedInDark && placedInDark.y}) is still drawn`);
        await page.evaluate(() => window.__laser.main.setPlaced([]));
        await page.waitForTimeout(200);
      }

      assert(errors.length === 0, 'console clean ' + JSON.stringify(errors));
      await ctx.close();
    }
  } finally {
    await browser.close();
    proc.kill();
  }
  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(2); });
