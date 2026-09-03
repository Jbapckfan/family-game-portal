// Playwright WebKit smoke test for src/render.js + src/render-camera.js via tools/render-harness.html.
// Usage: node test/render.smoke.mjs [port]   (starts tools/serve.mjs itself)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { webkit } = require('/Users/jamesalford/.npm-global/lib/node_modules/playwright');

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 8771);
const shots = process.env.SHOTS_DIR || '/private/tmp/claude-501/-Users-jamesalford/7f475eac-e253-4679-b02d-9b0f7b9b6404/scratchpad/shots';
mkdirSync(shots, { recursive: true });

const server = spawn(process.execPath, [join(here, '..', 'tools', 'serve.mjs'), String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res) => server.stdout.once('data', res));

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const pct = (v) => (v * 100).toFixed(1) + '%';
let browser;
try {
  // Playwright's pinned WebKit may be absent; fall back to any installed ms-playwright/webkit-* build.
  try { browser = await webkit.launch(); } catch (e) {
    const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
    const dir = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith('webkit-')).sort().pop() : null;
    if (!dir) throw e;
    browser = await webkit.launch({ executablePath: join(cache, dir, 'pw_run.sh') });
  }
  const page = await browser.newPage({ viewport: { width: 820, height: 820 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/build\/three\.min\.js.*deprecated/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/games/lasers-3d/tools/render-harness.html`);
  await page.waitForFunction(() => window.__h && window.__h.render);
  await page.waitForTimeout(600);

  console.log('\n== 7x7 baseline (flat / tilt / beam / overlays)');
  // FLAT
  const flat = await page.evaluate(() => {
    const h = window.__h; h.view('flat');
    const c = h.render.getCamera();
    const center = { x: 3, y: 3 };
    const p = h.render.projectCell(center, 0);
    const pick = h.render.pickCell(p.x, p.y);
    const corner = h.render.pickCell(h.render.projectCell({ x: 0, y: 0 }, 0).x, h.render.projectCell({ x: 0, y: 0 }, 0).y);
    const plateau = h.render.pickCell(h.render.projectCell({ x: 3, y: 4 }, 0).x, h.render.projectCell({ x: 3, y: 4 }, 0).y);
    const north = h.render.projectCell({ x: 3, y: 6 }, 0), south = h.render.projectCell({ x: 3, y: 0 }, 0);
    const east = h.render.projectCell({ x: 6, y: 3 }, 0), west = h.render.projectCell({ x: 0, y: 3 }, 0);
    return { cam: c, blend: h.render.getShadingBlend(), isFlat: h.render.isFlat(), pick, corner, plateau,
      northUp: north.y < south.y, eastRight: east.x > west.x, progress: h.render.getBeamProgress() };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, 'flat.png') });
  check(flat.isFlat && flat.blend === 0, `flat preset: elevation ${flat.cam.elevationDeg}, blend ${flat.blend}`);
  check(flat.pick && flat.pick.x === 3 && flat.pick.y === 3, `flat pickCell(center) -> ${JSON.stringify(flat.pick)}`);
  check(flat.corner && flat.corner.x === 0 && flat.corner.y === 0, `flat pickCell(0,0) -> ${JSON.stringify(flat.corner)}`);
  check(flat.plateau && flat.plateau.x === 3 && flat.plateau.y === 4, `flat pickCell(plateau 3,4) -> ${JSON.stringify(flat.plateau)}`);
  check(flat.northUp && flat.eastRight, `flat orientation north-up ${flat.northUp}, east-right ${flat.eastRight}`);

  // Pixel uniformity in FLAT: sample the raised cell (3,4) top vs floor cell (3,0) (both away from beam/pieces).
  const px = await page.evaluate(() => {
    const h = window.__h, r = h.render;
    r.frame(0.016);
    const gl = r._renderer.getContext();
    const rect = r._renderer.domElement.getBoundingClientRect();
    const dpr = r._renderer.getPixelRatio();
    function sample(cell) {
      const p = r.projectCell(cell, 0); const buf = new Uint8Array(4);
      gl.readPixels(Math.round((p.x - rect.left) * dpr) + 6, Math.round(gl.drawingBufferHeight - (p.y - rect.top) * dpr) + 6, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return Array.from(buf).slice(0, 3);
    }
    return { raised: sample({ x: 2, y: 2 }), raised2: sample({ x: 5, y: 4 }), floor: sample({ x: 5, y: 3 }), floor2: sample({ x: 6, y: 6 }) };
  });
  const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 2);
  check(same(px.raised, px.floor) && same(px.raised2, px.floor2) && same(px.raised, px.floor2), `flat pixel uniformity raised ${px.raised}/${px.raised2} vs floor ${px.floor}/${px.floor2}`);

  // TILT
  const tilt = await page.evaluate(async () => {
    const h = window.__h; await h.view('tilt');
    h.render.frame(0.016);
    const c = h.render.getCamera();
    const p = h.render.projectCell({ x: 3, y: 3 }, 0);
    const pick = h.render.pickCell(p.x, p.y);
    const q = h.render.projectCell({ x: 3, y: 4 }, 0);
    const plateau = h.render.pickCell(q.x, q.y);
    const off = h.render.pickCell(5, 5);
    return { cam: c, blend: h.render.getShadingBlend(), isFlat: h.render.isFlat(), pick, plateau, off, calls: h.render._renderer.info.render.calls };
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, 'tilt.png') });
  check(!tilt.isFlat && tilt.blend === 1, `tilt preset: elevation ${tilt.cam.elevationDeg}, blend ${tilt.blend}`);
  check(tilt.pick && tilt.pick.x === 3 && tilt.pick.y === 3, `tilt pickCell(center) -> ${JSON.stringify(tilt.pick)}`);
  check(tilt.plateau && tilt.plateau.x === 3 && tilt.plateau.y === 4, `tilt pickCell(plateau 3,4) -> ${JSON.stringify(tilt.plateau)}`);
  check(tilt.off === null, `tilt pickCell off-board -> ${JSON.stringify(tilt.off)}`);
  check(tilt.calls < 600, `draw calls ${tilt.calls} < 600`);

  // Animated fire + travel progress, orbit, zoom, animated preset, tray icon, dispose.
  const anim = await page.evaluate(async () => {
    const h = window.__h, r = h.render;
    r.setBeam(h.result, { animate: true, fired: true });
    const p0 = r.getBeamProgress();
    r.frame(0.05); const p1 = r.getBeamProgress();
    for (let i = 0; i < 100; i++) r.frame(0.05);
    const p2 = r.getBeamProgress();
    r.orbit(0.3, -0.2); const o = r.getCamera();
    const t0 = performance.now(); const pr = r.setCameraPreset('flat', { animate: true });
    let frames = 0; while (r.getCamera().animating && frames < 200) { r.frame(0.016); frames++; }
    await pr;
    const icon = r.snapshotTrayIcon('WEDGE', 44);
    r.setSelection({ x: 1, y: 5 }); r.setGhost({ x: 2, y: 0, type: 'DIP', orient: '/' }); r.setHover({ x: 4, y: 4 }); r.setCursor({ x: 0, y: 6 }); r.pulseCell({ x: 3, y: 4 });
    r.frame(0.016);
    r.setSelection(null); r.setGhost(null); r.setHover(null); r.setCursor(null);
    r.frame(0.016);
    return { p0, p1, p2, o, frames, cam: r.getCamera(), icon: icon.slice(0, 22), iconLen: icon.length, travel: window.__h.theme.beam.travel };
  });
  check(anim.p0.playing && anim.p0.cells === 0 && anim.p0.total > 7, `beam starts playing total ${anim.p0.total}`);
  {
    // S8: the beam's DURATION is clamped, so its speed is total / clamped-duration, not a fixed cells/second.
    const T = anim.travel;
    const dur = Math.min(T.maxDurationMs, Math.max(T.minDurationMs, anim.p0.total / T.cellsPerSecond * 1000));
    const expected = anim.p0.total / (dur / 1000) * 0.05;
    check(Math.abs(anim.p1.cells - expected) < 1e-9,
      `beam travel dt-based: ${anim.p1.cells.toFixed(4)} cells after 0.05 s (path ${anim.p0.total.toFixed(2)} cells in ${dur.toFixed(0)} ms)`);
  }
  check(!anim.p2.playing && Math.abs(anim.p2.cells - anim.p2.total) < 1e-6, `beam finished ${anim.p2.cells}/${anim.p2.total}`);
  check(anim.o.preset === null && anim.o.elevationDeg < 35, `orbit cancels preset: az ${anim.o.azimuthDeg.toFixed(1)}, el ${anim.o.elevationDeg}`);
  check(anim.cam.preset === 'flat' && anim.cam.elevationDeg === 90 && anim.frames > 10 && anim.frames < 60, `animated preset flat in ${anim.frames} frames`);
  check(anim.icon === 'data:image/png;base64,' && anim.iconLen > 500, `tray icon data URL (${anim.iconLen} chars)`);

  // Reduced motion: 140 ms linear camera, a much shorter beam duration.
  const rm = await page.evaluate(async () => {
    const r = window.__h.render, T = window.__h.theme; r.setReducedMotion(true);
    r.setBeam(window.__h.result, { animate: true, fired: true });
    const total = r.getBeamProgress().total;
    r.frame(0.05); const cells = r.getBeamProgress().cells;
    const pr = r.setCameraPreset('tilt', { animate: true }); let frames = 0; while (r.getCamera().animating && frames < 100) { r.frame(0.02); frames++; } await pr;
    r.setReducedMotion(false); r.setCameraPreset('flat', { animate: false });
    const rmT = T.reducedMotion;
    const dur = Math.min(rmT.beamTravelMaxDurationMs, Math.max(rmT.beamTravelMinDurationMs, total / rmT.beamTravelCellsPerSecond * 1000));
    return { cells, frames, expected: total / (dur / 1000) * 0.05, dur };
  });
  check(Math.abs(rm.cells - rm.expected) < 1e-9 && rm.frames === 7, `reduced motion: ${rm.cells.toFixed(3)} cells after 0.05 s (${rm.dur.toFixed(0)} ms travel), camera in ${rm.frames} x 20 ms frames`);

  // ---- S8: a long beam is duration-capped, and finishBeam() jumps to the end ----
  const capped = await page.evaluate(async () => {
    const h = window.__h, r = h.render, T = h.theme.beam.travel;
    h.load('big24'); h.fit(); await h.view('flat'); h.settle(400);
    r.setBeam(h.result, { animate: true, fired: true });
    const total = r.getBeamProgress().total;
    let t = 0; while (r.getBeamProgress().playing && t < 20) { r.frame(1 / 60); t += 1 / 60; }
    // and a second run that is skipped by a tap
    r.setBeam(h.result, { animate: true, fired: true });
    r.frame(1 / 60);
    const midway = r.getBeamProgress().cells;
    r.finishBeam();
    const afterSkip = r.getBeamProgress();
    r.frame(1 / 60);
    const settled = r.getBeamProgress();
    // a one-cell stub must not flash past: the duration floor keeps it readable
    const stub = { segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 }], hits: [],
      allTargetsHit: false, end: 'lost-edge', endPoint: { x: 1, y: 0, z: 0 }, altitudeMarks: [], pieceHits: [], overflights: [], visited: [] };
    r.setBeam(stub, { animate: true, fired: true });
    const shortTotal = r.getBeamProgress().total;
    let st = 0; while (r.getBeamProgress().playing && st < 5) { r.frame(1 / 60); st += 1 / 60; }
    r.setBeam(null);
    return { total, seconds: t, cap: T.maxDurationMs / 1000, floor: T.minDurationMs / 1000, midway, afterSkip, settled,
      shortTotal, shortSeconds: st };
  });
  check(capped.seconds <= capped.cap + 0.05,
    `24x24 beam of ${capped.total.toFixed(1)} cells travels in ${capped.seconds.toFixed(2)} s (cap ${capped.cap.toFixed(2)} s), not ${(capped.total / 5.5).toFixed(1)} s`);
  check(capped.shortSeconds >= capped.floor - 0.02 && capped.shortSeconds <= capped.floor + 0.05,
    `a ${capped.shortTotal.toFixed(2)}-cell stub still takes the ${capped.floor.toFixed(2)} s floor (${capped.shortSeconds.toFixed(2)} s), so short beams still read`);
  check(capped.midway > 0 && capped.midway < capped.total && Math.abs(capped.afterSkip.cells - capped.total) < 1e-6 && !capped.settled.playing,
    `finishBeam() jumps a beam mid-flight (${capped.midway.toFixed(1)} cells) straight to ${capped.afterSkip.cells.toFixed(1)}/${capped.total.toFixed(1)} and ends it`);

  // ------------------------------------------------------------------ big boards
  // DESIGN.md 11.2: the fit must fill >= 92% of the limiting canvas dimension in FLAT and >= 88% in TILT, UNLESS the
  // minimum-cell clamp is active, in which case cells are exactly theme.camera.minCellPx and the board overflows.
  const VIEWPORTS = [
    { name: 'iphone', width: 393, height: 852 },
    { name: 'ipad', width: 820, height: 1180 },
    { name: 'landscape', width: 844, height: 390 },
    { name: 'desktop', width: 1440, height: 900 },     // big enough that the min-cell clamp never fires
  ];
  const TARGET = { flat: 0.92, tilt: 0.88 };
  const measured = {};
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(120);
    for (const board of ['big20', 'big24']) {
      const info = await page.evaluate(async ([which, views]) => {
        const h = window.__h;
        h.load(which); h.fit();
        const out = { size: h.level.size.w, minCellPx: h.theme.camera.minCellPx, views: {} };
        for (const v of views) {
          await h.view(v);
          h.settle(900);
          const f = h.fitPct();
          const before = h.legacyFitPct(v);
          out.views[v] = { pct: f.pct, fitPct: f.fitPct, box: f.box, canvas: f.canvas, cellPx: h.render.getCellPx(),
            beforePct: before.pct, beforeCellPx: before.cellPx, beforeBox: before.box,
            clamped: h.render.getCamera().effectiveZoom > h.render.getCamera().fitZoom + 1e-6 };
        }
        return out;
      }, [board, ['flat', 'tilt']]);
      measured[vp.name + '/' + board] = info;
      for (const v of ['flat', 'tilt']) {
        const m = info.views[v];
        const clampOk = m.clamped && Math.abs(m.cellPx - info.minCellPx) < 0.5;
        const fillOk = m.pct >= TARGET[v] - 1e-6;
        check(fillOk || clampOk,
          `${vp.name} ${vp.width}x${vp.height} ${board} ${v}: fills ${pct(m.pct)} of the limiting dimension ` +
          `(target ${pct(TARGET[v])}), cell ${m.cellPx.toFixed(1)} px, min-cell clamp ${m.clamped ? 'ACTIVE' : 'off'}`);
        // the bounding-box auto-fit itself, with the min-cell clamp removed, must always hit the target
        check(m.fitPct >= TARGET[v] - 1e-6 && m.fitPct <= 1 + 1e-6,
          `${vp.name} ${board} ${v}: bounding-box fit alone fills ${pct(m.fitPct)} (target ${pct(TARGET[v])})`);
        check(m.cellPx >= info.minCellPx - 1e-6, `${vp.name} ${board} ${v}: getCellPx() ${m.cellPx.toFixed(1)} >= ${info.minCellPx}`);
      }
    }
  }

  // ---- the 6x6 board James measured, at his exact 393x614 canvas: before vs after ----
  await page.setViewportSize({ width: 393, height: 614 });
  await page.waitForTimeout(120);
  const six = await page.evaluate(async () => {
    const h = window.__h; h.load('six'); h.fit();
    const out = {};
    for (const v of ['flat', 'tilt']) {
      await h.view(v); h.settle(900);
      const f = h.fitPct(), b = h.legacyFitPct(v);
      out[v] = { before: b.box, beforePct: b.pct, after: f.box, afterPct: f.pct, cellPx: h.render.getCellPx(), beforeCellPx: b.cellPx };
    }
    return out;
  });
  for (const v of ['flat', 'tilt']) {
    const s6 = six[v];
    check(s6.afterPct > s6.beforePct, `6x6 at 393x614 ${v}: ${s6.before.width.toFixed(0)}x${s6.before.height.toFixed(0)} px ` +
      `(${pct(s6.beforePct)}) -> ${s6.after.width.toFixed(0)}x${s6.after.height.toFixed(0)} px (${pct(s6.afterPct)}), cell ${s6.beforeCellPx.toFixed(1)} -> ${s6.cellPx.toFixed(1)} px`);
  }

  // ---- pan clamping, zoom clamping, picking after pan+zoom, fitToBoard ----
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(120);
  const panZoom = await page.evaluate(async () => {
    const h = window.__h, r = h.render, out = {};
    h.load('big20'); h.fit();
    for (const v of ['flat', 'tilt']) {
      await r.setCameraPreset(v, { animate: false });
      h.settle(900);
      // pan a very long way in every direction; the clamp must keep >= 25% of the projected box on screen
      await r.fitToBoard({ animate: false });
      const worst = { x: 1, y: 1 };
      for (const [dx, dy] of [[9000, 0], [-18000, 0], [9000, 9000], [0, -18000], [0, 9000]]) {
        r.pan(dx, dy);
        const b = r.getBoardScreenBox(), c = h.fitPct().canvas;
        const ox = Math.min(b.centerX + b.width / 2, c.w / 2) - Math.max(b.centerX - b.width / 2, -c.w / 2);
        const oy = Math.min(b.centerY + b.height / 2, c.h / 2) - Math.max(b.centerY - b.height / 2, -c.h / 2);
        worst.x = Math.min(worst.x, ox / Math.min(b.width, c.w));
        worst.y = Math.min(worst.y, oy / Math.min(b.height, c.h));
      }
      out[v + 'Pan'] = worst;
      out[v + 'CanFit'] = r.canFit();
      // Picking survives pan and zoom. Ground truth is h.refPick(): the per-cell invisible-box raycast the renderer
      // used before the analytic version. Every VISIBLE cell centre (one the reference resolves to that same cell,
      // i.e. no taller column stands in front of it) must pick back to itself.
      await r.fitToBoard({ animate: false });
      r.pan(70, -55); r.zoom(1.4);
      const rect = r._renderer.domElement.getBoundingClientRect();
      const bad = []; let onScreen = 0, visible = 0;
      for (let cy = 0; cy < 20; cy++) for (let cx = 0; cx < 20; cx++) {
        const p = r.projectCell({ x: cx, y: cy }, 0);
        if (p.x < rect.left + 4 || p.x > rect.right - 4 || p.y < rect.top + 4 || p.y > rect.bottom - 4) continue;
        onScreen++;
        const ref = h.refPick(p.x, p.y);
        if (!ref || ref.x !== cx || ref.y !== cy) continue;      // occluded by a taller column: not a tappable centre
        visible++;
        const got = r.pickCell(p.x, p.y);
        if (!got || got.x !== cx || got.y !== cy) bad.push({ want: [cx, cy], got });
      }
      // and the analytic picker agrees with the reference across a grid of arbitrary screen points
      let grid = 0, agree = 0, disagree = [];
      for (let sy = 10; sy < rect.height - 10; sy += 17) for (let sx = 10; sx < rect.width - 10; sx += 13) {
        const a = r.pickCell(rect.left + sx, rect.top + sy), b = h.refPick(rect.left + sx, rect.top + sy);
        grid++;
        if ((a === null && b === null) || (a && b && a.x === b.x && a.y === b.y)) agree++;
        else if (disagree.length < 4) disagree.push({ analytic: a, reference: b });
      }
      out[v + 'Pick'] = { onScreen, visible, bad: bad.slice(0, 5), badCount: bad.length, grid, agree, disagree };
      // zoom clamp: all the way out is the fit-to-board zoom, all the way in is 3x the minCellPx zoom
      r.zoom(0.0001);
      const outZ = r.getCamera();
      r.zoom(10000);
      const inZ = r.getCamera();
      out[v + 'Zoom'] = { out: outZ.effectiveZoom, fit: outZ.fitZoom, in: inZ.effectiveZoom, inCell: inZ.cellPx, minCellPx: h.theme.camera.minCellPx };
      // FIT restores the framed view and drops the pan
      r.pan(300, -200); r.zoom(1.3);
      const before = r.canFit();
      await r.fitToBoard({ animate: false });
      out[v + 'Fit'] = { before, after: r.canFit(), pan: r.getCamera().zoom, pct: h.fitPct().pct, cellPx: r.getCellPx() };
      // animated fit resolves and lands in the same place
      r.pan(-250, 120);
      const pr = r.fitToBoard({ animate: true });
      let n = 0; while (r.getCamera().animating && n < 200) { r.frame(0.016); n++; }
      await pr;
      out[v + 'FitAnim'] = { frames: n, canFit: r.canFit(), pct: h.fitPct().pct };
    }
    return out;
  });
  for (const v of ['flat', 'tilt']) {
    const p = panZoom[v + 'Pan'];
    check(p.x >= 0.25 - 1e-6 && p.y >= 0.25 - 1e-6, `${v}: pan clamp keeps >= 25% of the board on screen (worst x ${pct(p.x)}, y ${pct(p.y)})`);
    check(panZoom[v + 'CanFit'] === true, `${v}: canFit() true once panned`);
    const pk = panZoom[v + 'Pick'];
    check(pk.badCount === 0 && pk.visible > 20, `${v}: pickCell round-trips after pan+zoom for all ${pk.visible} visible cell centres (of ${pk.onScreen} on screen) ${JSON.stringify(pk.bad)}`);
    const ratio = pk.agree / pk.grid;
    check(ratio >= (v === 'flat' ? 1 : 0.95), `${v}: analytic pick agrees with the box-raycast reference on ${pk.agree}/${pk.grid} screen points (${pct(ratio)}) ${JSON.stringify(pk.disagree)}`);
    const z = panZoom[v + 'Zoom'];
    check(Math.abs(z.out - z.fit) < 1e-6, `${v}: zoom out clamps to the fit zoom (${z.out.toFixed(2)} vs fit ${z.fit.toFixed(2)})`);
    check(Math.abs(z.inCell - 3 * z.minCellPx) < 0.5 || z.in <= z.fit + 1e-6, `${v}: zoom in clamps at 3x minCellPx (cell ${z.inCell.toFixed(1)} px, cap ${3 * z.minCellPx})`);
    const f = panZoom[v + 'Fit'];
    check(f.before === true && f.after === false && Math.abs(f.pan - 1) < 1e-9, `${v}: fitToBoard() clears pan and zoom`);
    check(f.pct >= TARGET[v] - 1e-6 || Math.abs(f.cellPx - 34) < 0.5, `${v}: after FIT the board fills ${pct(f.pct)} (cell ${f.cellPx.toFixed(1)} px)`);
    const fa = panZoom[v + 'FitAnim'];
    check(fa.canFit === false && fa.frames > 3, `${v}: animated fitToBoard settles in ${fa.frames} frames`);
  }

  // ---- OVERVIEW vs WORKING: the view toggle actually shows the whole 24x24 board on a phone ----
  // The whole-board contain-fit on a 393 px phone gives ~16 px cells at 24x24, so the camera clamps to the 34 px
  // touch floor and only ~12 columns are on screen. That default is correct for tapping and useless for planning,
  // and the old FIT button could not escape it. OVERVIEW must put every cell on screen; WORKING must keep the floor.
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(120);
  const views = await page.evaluate(async () => {
    const h = window.__h, r = h.render;
    h.load('big24'); h.fit();
    await r.setCameraPreset('flat', { animate: false });
    h.settle(900);
    const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
    const rect = r._renderer.domElement.getBoundingClientRect();
    function snap(tag) {
      const n = h.level.size.w, cells = [];
      let inside = 0, outside = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const p = r.projectCell({ x, y }, 0);
        const ok = p.x >= rect.left - 0.5 && p.x <= rect.right + 0.5 && p.y >= rect.top - 0.5 && p.y <= rect.bottom + 0.5;
        if (ok) inside++; else if (outside.length < 3) outside.push({ x, y });
        if (y === 0) cells.push(ok);
      }
      const box = r.getBoardScreenBox();
      return { tag, mode: r.getViewMode(), total: n * n, inside, outside, cellPx: r.getCellPx(),
        boxW: box.width, boxH: box.height, canvas: { w: W, h: H }, zoom: r.getCamera().effectiveZoom,
        columnsVisible: cells.filter(Boolean).length, hasOverview: r.hasOverview() };
    }
    const working0 = snap('working');
    await r.setViewMode('overview', { animate: false });
    h.settle(600);
    const overview = snap('overview');
    await r.setViewMode('working', { animate: false });
    h.settle(600);
    const working1 = snap('working-again');
    // animated round trip settles in the same place
    let frames = 0;
    const pr = r.setViewMode('overview', { animate: true });
    while (r.getCamera().animating && frames < 200) { r.frame(0.016); frames++; }
    await pr;
    const overviewAnim = snap('overview-anim');
    return { working0, overview, working1, overviewAnim, frames, minCellPx: h.theme.camera.minCellPx };
  });
  check(views.working0.hasOverview === true,
    `24x24 at 393x852: the min-cell clamp is active, so the two view states differ (button shown)`);
  check(views.working0.inside < views.working0.total,
    `WORKING hides part of the board on purpose: ${views.working0.inside}/${views.working0.total} cells on screen, ${views.working0.columnsVisible}/24 columns of row 0`);
  check(views.working0.cellPx + 1e-6 >= views.minCellPx,
    `WORKING keeps cells at the ${views.minCellPx} px touch floor (${views.working0.cellPx.toFixed(1)} px)`);
  check(views.overview.inside === views.overview.total,
    `OVERVIEW puts ALL ${views.overview.total} cells on screen (${views.overview.inside}) ${JSON.stringify(views.overview.outside)}`);
  check(views.overview.columnsVisible === 24, `OVERVIEW shows all 24 columns of the south row (${views.overview.columnsVisible})`);
  check(views.overview.boxW <= views.overview.canvas.w + 0.5 && views.overview.boxH <= views.overview.canvas.h + 0.5,
    `OVERVIEW board box ${views.overview.boxW.toFixed(0)}x${views.overview.boxH.toFixed(0)} fits the ${views.overview.canvas.w}x${views.overview.canvas.h} canvas (cell ${views.overview.cellPx.toFixed(1)} px)`);
  check(Math.abs(views.working1.zoom - views.working0.zoom) < 1e-9 && views.working1.inside === views.working0.inside,
    `toggling OVERVIEW -> WORKING round-trips exactly (zoom ${views.working0.zoom.toFixed(4)} -> ${views.working1.zoom.toFixed(4)})`);
  check(Math.abs(views.overviewAnim.zoom - views.overview.zoom) < 1e-6 && views.overviewAnim.inside === views.overview.total && views.frames > 3,
    `the ANIMATED toggle lands on the same OVERVIEW in ${views.frames} frames`);
  await page.evaluate(async () => { const h = window.__h; await h.render.setViewMode('overview', { animate: false }); h.settle(600); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'polish-overview-24x24-iphone.png') });
  await page.evaluate(async () => { const h = window.__h; await h.render.setViewMode('working', { animate: false }); h.settle(600); });

  // ---- the fit does not pump during an orbit drag (both with the min-cell clamp on and off) ----
  const orbitStabilityFn = async () => {
    const h = window.__h, r = h.render;
    h.load('big20'); h.fit();
    await r.setCameraPreset('tilt', { animate: false });
    h.settle(900);
    let prev = r.getCamera().effectiveZoom, maxStep = 0;
    for (let i = 0; i < 60; i++) {          // a 60-frame drag, 4 px of azimuth per frame
      r.orbit(4 * 0.0075, 0);
      r.frame(0.016);
      const z = r.getCamera().effectiveZoom;
      maxStep = Math.max(maxStep, Math.abs(z - prev) / prev);
      prev = z;
    }
    h.settle(900);
    return { maxStep, clamped: r.getCamera().effectiveZoom > r.getCamera().fitZoom + 1e-6 };
  };
  const orbitPhone = await page.evaluate(orbitStabilityFn);
  check(orbitPhone.maxStep < 0.03, `orbit drag at 393x852: largest per-frame zoom step ${pct(orbitPhone.maxStep)} < 3% (min-cell clamp ${orbitPhone.clamped ? 'on' : 'off'})`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(120);
  const orbitDesktop = await page.evaluate(orbitStabilityFn);
  check(orbitDesktop.maxStep < 0.03, `orbit drag at 1440x900: largest per-frame zoom step ${pct(orbitDesktop.maxStep)} < 3% (min-cell clamp ${orbitDesktop.clamped ? 'on' : 'off'})`);

  // ---- performance and scene size at 24x24 ----
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForTimeout(120);
  const perf = await page.evaluate(async () => {
    const h = window.__h, r = h.render, out = {};
    for (const which of ['big20', 'big24']) {
      const info = h.load(which); h.fit();
      for (const v of ['flat', 'tilt']) {
        await h.view(v); h.settle(600);
        r.frame(0.016);
        out[which + '/' + v] = { cells: info.w * info.d, objects: h.sceneObjects(), calls: r._renderer.info.render.calls,
          triangles: r._renderer.info.render.triangles, ms: h.frameTime(60), cellPx: r.getCellPx() };
      }
      // picking cost must not scale with the board
      const t0 = performance.now();
      for (let i = 0; i < 5000; i++) r.pickCell(200 + (i % 300), 300 + (i % 400));
      out[which + '/pickUs'] = (performance.now() - t0) * 1000 / 5000;
    }
    return out;
  });
  for (const k of Object.keys(perf)) {
    if (k.endsWith('/pickUs')) { check(perf[k] < 40, `${k}: ${perf[k].toFixed(1)} us per pickCell`); continue; }
    const p = perf[k];
    check(p.calls < 600, `${k}: ${p.cells} cells, ${p.objects} scene objects, ${p.calls} draw calls, ${p.triangles} tris, ${p.ms.toFixed(2)} ms/frame`);
    check(p.ms < 16.7, `${k}: frame time ${p.ms.toFixed(2)} ms < 16.7 ms (60 fps)`);
  }

  // ---- screenshots of a 20x20 board on a phone ----
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(120);
  await page.evaluate(async () => { const h = window.__h; h.load('big20'); h.fit(); await h.view('flat'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'big-flat.png') });
  await page.evaluate(async () => { const h = window.__h; await h.view('tilt'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'big-tilt.png') });

  console.log('\n== measured fit (board box as a fraction of the limiting canvas dimension)');
  for (const k of Object.keys(measured)) {
    const m = measured[k];
    for (const v of ['flat', 'tilt']) {
      const x = m.views[v];
      console.log(`   ${k.padEnd(18)} ${v.padEnd(4)} BEFORE ${pct(x.beforePct).padStart(7)} (${x.beforeBox.width.toFixed(0)}x${x.beforeBox.height.toFixed(0)}, cell ${x.beforeCellPx.toFixed(1)} px)  ->  AFTER on-screen ${pct(x.pct).padStart(7)}  fit-alone ${pct(x.fitPct).padStart(6)}  box ${x.box.width.toFixed(0)}x${x.box.height.toFixed(0)} in ${x.canvas.w}x${x.canvas.h}  cell ${x.cellPx.toFixed(1)} px  ${x.clamped ? 'min-cell clamp' : ''}`);
    }
  }
  console.log('\n== performance');
  for (const k of Object.keys(perf)) {
    if (k.endsWith('/pickUs')) { console.log(`   ${k.padEnd(18)} ${perf[k].toFixed(1)} us/pick`); continue; }
    const p = perf[k];
    console.log(`   ${k.padEnd(18)} ${String(p.cells).padStart(4)} cells  ${String(p.objects).padStart(4)} objects  ${String(p.calls).padStart(3)} calls  ${String(p.triangles).padStart(6)} tris  ${p.ms.toFixed(2)} ms/frame`);
  }

  await page.waitForTimeout(200);
  check(errors.length === 0, `console clean (${errors.length}): ${errors.slice(0, 5).join(' | ')}`);
} catch (e) {
  failures.push('exception: ' + (e && e.stack || e));
  console.log('FAIL exception', e);
} finally {
  if (browser) await browser.close();
  server.kill();
}
console.log(failures.length ? `\n${failures.length} FAILED` : '\nALL PASSED');
process.exit(failures.length ? 1 : 0);
