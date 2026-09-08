// Playwright WebKit smoke test for src/render.js + src/render-camera.js via tools/render-harness.html.
// Usage: node test/render.smoke.mjs [port]   (starts tools/serve.mjs itself)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { webkit } = require('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 8771);
const shots = process.env.SHOTS_DIR || new URL('../output/screenshots/', import.meta.url).pathname;
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
    // MOTION-DIRECTION.md 2: T0..T0+m.fire.chargeMs charges the emitter and the head is NOT released until then,
    // so travel is measured as the DELTA over one 0.05 s frame taken after the head is already moving. (render.frame
    // clamps dt to 0.05 s, so the charge cannot be stepped out in a single call.)
    const chargeMs = h.theme.motion.fire.chargeMs;
    const beforeRelease = r.getBeamProgress().cells;                 // one 0.05 s frame is well inside the charge
    let guard = 0; while (r.getBeamProgress().cells === 0 && guard++ < 40) r.frame(0.05);
    const before = r.getBeamProgress().cells;
    r.frame(0.05); const p1 = r.getBeamProgress(), travelStep = p1.cells - before;
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
    return { p0, p1, p2, o, frames, cam: r.getCamera(), icon: icon.slice(0, 22), iconLen: icon.length,
      travel: window.__h.theme.beam.travel, chargeMs, beforeRelease, travelStep };
  });
  check(anim.p0.playing && anim.p0.cells === 0 && anim.p0.total > 7, `beam starts playing total ${anim.p0.total}`);
  {
    // S8: the beam's DURATION is clamped, so its speed is total / clamped-duration, not a fixed cells/second.
    const T = anim.travel;
    const dur = Math.min(T.maxDurationMs, Math.max(T.minDurationMs, anim.p0.total / T.cellsPerSecond * 1000));
    const expected = anim.p0.total / (dur / 1000) * 0.05;
    check(Math.abs(anim.travelStep - expected) < 1e-9,
      `beam travel dt-based: ${anim.travelStep.toFixed(4)} cells per 0.05 s (path ${anim.p0.total.toFixed(2)} cells in ${dur.toFixed(0)} ms)`);
    check(anim.beforeRelease === 0,
      `and the head does not move at all during the ${anim.chargeMs} ms emitter charge (${anim.beforeRelease} cells at half of it)`);
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
    let g = 0; while (r.getBeamProgress().cells === 0 && g++ < 40) r.frame(0.05);   // step out the reduced charge
    const before = r.getBeamProgress().cells;
    r.frame(0.05); const cells = r.getBeamProgress().cells - before;
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
    const chargeS = h.theme.motion.fire.chargeMs / 1000;
    r.setBeam(h.result, { animate: true, fired: true });
    const total = r.getBeamProgress().total;
    let t = 0; while (r.getBeamProgress().playing && t < 20) { r.frame(1 / 60); t += 1 / 60; }
    // and a second run that is skipped by a tap
    r.setBeam(h.result, { animate: true, fired: true });
    let cg = 0; while (r.getBeamProgress().cells === 0 && cg++ < 40) r.frame(1 / 60);   // out of the charge
    r.frame(1 / 60);
    const midway = r.getBeamProgress().cells;
    r.finishBeam();
    const afterSkip = r.getBeamProgress();
    r.frame(1 / 60);
    const settled = r.getBeamProgress();
    // a one-cell stub must not flash past: the duration floor keeps it readable
    const stub = { segments: [{ from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 0, z: 0 }, d: 'E', v: 0 }], hits: [],
      allTargetsHit: false, end: 'lost-edge', endPoint: { x: 1, y: 0, z: 0 }, altitudeMarks: [], pieceHits: [],
      overflights: [], underpasses: [], events: [], visited: [] };
    r.setBeam(stub, { animate: true, fired: true });
    const shortTotal = r.getBeamProgress().total;
    let st = 0; while (r.getBeamProgress().playing && st < 5) { r.frame(1 / 60); st += 1 / 60; }
    r.setBeam(null);
    return { total, seconds: t, cap: T.maxDurationMs / 1000, floor: T.minDurationMs / 1000, midway, afterSkip, settled,
      shortTotal, shortSeconds: st, chargeS };
  });
  // The whole FIRE lasts the emitter charge PLUS the clamped travel; the clamp is on the travel (S8), so that is
  // what this measures. MOTION-DIRECTION.md 2 puts the 180 ms charge in front of it and never inside it.
  check(capped.seconds <= capped.cap + capped.chargeS + 0.05,
    `24x24 beam of ${capped.total.toFixed(1)} cells travels in ${(capped.seconds - capped.chargeS).toFixed(2)} s after a ${(capped.chargeS * 1000).toFixed(0)} ms charge (cap ${capped.cap.toFixed(2)} s), not ${(capped.total / 5.5).toFixed(1)} s`);
  {
    // A lost ending is DRAWN past its endPoint (theme.beam.endStates.*.departCells), so this one-cell lost-edge stub
    // has a drawn arc of 1 cell of beam plus its departure. The duration follows the clamp on the DRAWN arc and can
    // never fall under the floor, which is what keeps a short beam readable.
    const want = Math.min(capped.cap, Math.max(capped.floor, capped.shortTotal / anim.travel.cellsPerSecond)) + capped.chargeS;
    check(capped.shortSeconds >= want - 0.02 && capped.shortSeconds <= want + 0.05 && want >= capped.floor,
      `a 1-cell stub is drawn as ${capped.shortTotal.toFixed(2)} cells (beam + departure) and travels in ${capped.shortSeconds.toFixed(2)} s ` +
      `(clamped target ${want.toFixed(2)} s, floor ${capped.floor.toFixed(2)} s), so short beams still read`);
  }
  check(capped.midway > 0 && capped.midway < capped.total && Math.abs(capped.afterSkip.cells - capped.total) < 1e-6 && !capped.settled.playing,
    `finishBeam() jumps a beam mid-flight (${capped.midway.toFixed(1)} cells) straight to ${capped.afterSkip.cells.toFixed(1)}/${capped.total.toFixed(1)} and ends it`);

  // ---- departing beams: a lost beam is DRAWN past the simulation's endPoint ----
  // Owner report, 2026-09-03: "after the wedge moves the beam up it eventually stops... the beam should keep going up
  // or at least look like its going farther". trace() is untouched; theme.beam.endStates.<state>.departCells carries
  // the DRAWING past result.endPoint and tapers it to nothing. These checks prove, for every ending that leaves the
  // world, that (a) real geometry exists beyond endPoint in the right direction, (b) it is part of the travel sweep's
  // arc length rather than popped in at the end, (c) a lost-floor departure never sinks below the floor plane,
  // (d) the camera auto-fit and picking are untouched by it, and (e) reduced motion changes only the sweep.
  const DEPART_SCENES = {
    'lost-sky': {   // wedge turns the beam north and it climbs 0 -> 3, then off the top of the world
      raw: { name: 'SKY', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 2, dir: 'E' }, targets: [{ x: 7, y: 7 }], fixed: [], tray: ['WEDGE'] },
      placed: [{ x: 3, y: 2, type: 'WEDGE', orient: '/' }] },
    'lost-floor': {  // dip on a plateau sends the beam down 2 -> 0 and into the floor
      raw: { name: 'FLOOR', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '20020000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 7 }], fixed: [], tray: ['DIP'] },
      placed: [{ x: 3, y: 4, type: 'DIP', orient: '\\' }] },
    'lost-edge': {   // straight run off the east edge at level 0
      raw: { name: 'EDGE', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 7 }], fixed: [], tray: ['MIRROR'] },
      placed: [] },
    'lost-edge-climbing': {   // a CLIMBING exit: the last run changes altitude, so the departure continues a ramp
      raw: { name: 'EDGECLIMB', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['WEDGE'] },
      placed: [{ x: 5, y: 4, type: 'WEDGE', orient: '/' }] },
  };
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(120);
  const departed = await page.evaluate(async (scenes) => {
    const h = window.__h, r = h.render, B = h.theme.beam, out = {};
    const KEY = { 'lost-edge': 'lostEdge', 'lost-floor': 'lostFloor', 'lost-sky': 'lostSky' };
    // Independent reimplementation of the drawing UP TO endPoint (INTERFACES.md 2: a terminal stub keeps from.z in
    // to.z and is sloped by v; a lost-edge stub is cut at the board boundary). Everything past this is the departure.
    function pathToEnd(res) {
      const off = B.heightOffset, edge = res.end === 'lost-edge';
      let len = 0, P = null, Q = null;
      for (let i = 0; i < res.segments.length; i++) {
        const s = res.segments[i], last = i === res.segments.length - 1;
        const stub = (s.to.x % 1 !== 0) || (s.to.y % 1 !== 0);
        const toH = stub ? s.from.z + off + 0.5 * s.v : s.to.z + off;
        P = { x: s.from.x, y: s.from.z + off, z: -s.from.y };
        Q = { x: s.to.x, y: toH, z: -s.to.y };
        if (last && edge) { Q.x += (P.x - Q.x) * 0.5; Q.y += (P.y - Q.y) * 0.5; Q.z += (P.z - Q.z) * 0.5; }
        len += Math.hypot(Q.x - P.x, Q.y - P.y, Q.z - P.z);
      }
      const u = { x: Q.x - P.x, y: Q.y - P.y, z: Q.z - P.z };
      const m = Math.hypot(u.x, u.y, u.z) || 1;
      return { len, end: Q, dir: { x: u.x / m, y: u.y / m, z: u.z / m } };
    }
    function tubeVerts() {
      let tubes = null;
      r._scene.traverse((o) => { if (o.name === 'beamTubes') tubes = o; });
      const v = [];
      if (tubes) tubes.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        const p = o.geometry.getAttribute('position'), f = o.geometry.getAttribute('aFade');
        for (let i = 0; i < p.count; i++) v.push([p.getX(i), p.getY(i), p.getZ(i), f ? f.getX(i) : 1]);
      });
      return v;
    }
    function frame(box) { return { fitZoom: box.fitZoom, effectiveZoom: box.effectiveZoom, cellPx: box.cellPx }; }
    for (const name of Object.keys(scenes)) {
      const sc = scenes[name];
      const level = h.sim.parseLevel(sc.raw);
      r.setLevel(level); r.setPlaced(sc.placed); r.setBeam(null);
      await r.setCameraPreset('tilt', { animate: false });
      h.settle(900);
      const camNoBeam = frame(r.getCamera()), boxNoBeam = r.getBoardScreenBox();
      const rect = r._renderer.domElement.getBoundingClientRect();
      const probes = [[0.5, 0.35], [0.5, 0.5], [0.35, 0.62], [0.7, 0.45]].map(([fx2, fy2]) =>
        r.pickCell(rect.left + rect.width * fx2, rect.top + rect.height * fy2));
      const res = h.sim.trace(level, sc.placed);
      r.setBeam(res, { animate: true, fired: true });
      const total = r.getBeamProgress().total;
      let t = 0; while (r.getBeamProgress().playing && t < 20) { r.frame(1 / 60); t += 1 / 60; }
      h.settle(600);
      const camBeam = frame(r.getCamera()), boxBeam = r.getBoardScreenBox();
      const probes2 = [[0.5, 0.35], [0.5, 0.5], [0.35, 0.62], [0.7, 0.45]].map(([fx2, fy2]) =>
        r.pickCell(rect.left + rect.width * fx2, rect.top + rect.height * fy2));
      const spec = B.endStates[KEY[res.end]];
      const path = pathToEnd(res);
      let u = { x: path.dir.x, y: path.dir.y, z: path.dir.z };
      if (spec.departMode === 'skim') { const m = Math.hypot(u.x, u.z) || 1; u = { x: u.x / m, y: 0, z: u.z / m }; }
      const verts = tubeVerts();
      let beyond = -Infinity, lateral = 0, minY = Infinity, maxY = -Infinity, faded = 0, tipFade = 1;
      for (const [vx, vy, vz, vf] of verts) {
        const dx = vx - path.end.x, dy = vy - path.end.y, dz = vz - path.end.z;
        const along = dx * u.x + dy * u.y + dz * u.z;
        if (along > beyond) { beyond = along; tipFade = vf; }
        if (along <= 0.05) continue;                 /* departure vertices only, past endPoint */
        lateral = Math.max(lateral, Math.hypot(dx - along * u.x, dy - along * u.y, dz - along * u.z));
        if (vf < 0.999) faded++;
        minY = Math.min(minY, vy); maxY = Math.max(maxY, vy);
      }
      // reduced motion must change only the SWEEP: identical geometry, a shorter travel duration
      r.setReducedMotion(true);
      r.setBeam(res, { animate: true, fired: true });
      const rmTotal = r.getBeamProgress().total, rmVerts = tubeVerts().length;
      let rt = 0; while (r.getBeamProgress().playing && rt < 20) { r.frame(1 / 60); rt += 1 / 60; }
      r.setReducedMotion(false);
      out[name] = { end: res.end, endPoint: res.endPoint, spec: spec, pathLen: path.len, total: total,
        beyond: beyond, lateral: lateral, minY: minY, maxY: maxY, endY: path.end.y, faded: faded, tipFade: tipFade,
        verts: verts.length, rmTotal: rmTotal, rmVerts: rmVerts, rmSeconds: rt, seconds: t,
        camNoBeam: camNoBeam, camBeam: camBeam, boxNoBeam: boxNoBeam, boxBeam: boxBeam,
        pickSame: JSON.stringify(probes) === JSON.stringify(probes2), probes: probes };
    }
    return out;
  }, DEPART_SCENES);
  for (const name of Object.keys(departed)) {
    const d = departed[name], want = d.spec.departCells;
    check(want > 0, `${name}: theme carries the beam ${want} cells past endPoint (departMode ${d.spec.departMode})`);
    check(Math.abs((d.total - d.pathLen) - want) < 0.02,
      `${name}: drawn arc ${d.total.toFixed(3)} = path-to-endPoint ${d.pathLen.toFixed(3)} + departure ${want} ` +
      `(so the travel sweep reveals the departure instead of popping it in)`);
    check(d.beyond >= want - 0.02,
      `${name}: tube geometry reaches ${d.beyond.toFixed(3)} cells past endPoint ${JSON.stringify(d.endPoint)} (>= ${want})`);
    check(d.lateral < 0.25,
      `${name}: the departure stays on the beam's own line (max lateral offset ${d.lateral.toFixed(3)} cell), it is not bent`);
    check(d.tipFade < 0.02 && d.faded > 0,
      `${name}: opacity fades to ${d.tipFade.toFixed(4)} at the tip over ${d.faded} faded vertices`);
    check(d.camNoBeam.fitZoom === d.camBeam.fitZoom && d.camNoBeam.effectiveZoom === d.camBeam.effectiveZoom &&
      d.boxNoBeam.width === d.boxBeam.width && d.boxNoBeam.height === d.boxBeam.height,
      `${name}: camera auto-fit is identical with and without the beam ` +
      `(zoom ${d.camNoBeam.effectiveZoom.toFixed(4)} -> ${d.camBeam.effectiveZoom.toFixed(4)}, ` +
      `box ${d.boxNoBeam.width.toFixed(1)}x${d.boxNoBeam.height.toFixed(1)} -> ${d.boxBeam.width.toFixed(1)}x${d.boxBeam.height.toFixed(1)})`);
    check(d.pickSame, `${name}: the departure is not pickable - pickCell is unchanged by the beam ${JSON.stringify(d.probes)}`);
    check(d.rmVerts === d.verts && Math.abs(d.rmTotal - d.total) < 1e-9 && d.rmSeconds < d.seconds + 1e-9,
      `${name}: prefers-reduced-motion changes only the sweep (${d.verts} vertices either way, ` +
      `${d.seconds.toFixed(2)} s -> ${d.rmSeconds.toFixed(2)} s)`);
  }
  {
    const h0 = await page.evaluate(() => window.__h.theme.beam.levels[0]);
    const sky = departed['lost-sky'], climb = sky.spec.departCells / Math.SQRT2;
    check(sky.maxY >= sky.endY + climb - 0.02,
      `lost-sky: the departure KEEPS CLIMBING at 45 degrees - it reaches height ${sky.maxY.toFixed(2)} from ${sky.endY.toFixed(2)} (+${climb.toFixed(2)})`);
    const floor = departed['lost-floor'], halfGlow = h0.glowDiameter / 2;
    // Continuing the descending ray would have driven the tube to y = -departCells/sqrt(2); the departure instead
    // lies ON the floor, so only the tube's own thickness straddles the plane.
    const sunk = -floor.spec.departCells / Math.SQRT2;
    check(floor.minY >= -halfGlow - 1e-3 && floor.minY > sunk / 4,
      `lost-floor: the departure lies on the floor, it does not sink through it (lowest vertex y = ${floor.minY.toFixed(4)}, ` +
      `bounded by the glow radius ${halfGlow.toFixed(4)}; the descending ray would have reached ${sunk.toFixed(2)})`);
    check(floor.maxY <= halfGlow + (floor.spec.floorClearance || 0) + 1e-3 && floor.endY < 0.001,
      `lost-floor: the departure never lifts off the floor it struck (endPoint height ${floor.endY.toFixed(3)}, highest departure vertex ${floor.maxY.toFixed(3)})`);
    const edge = departed['lost-edge'];
    check(edge.endPoint.x === 8 && edge.beyond > 1,
      `lost-edge: the beam is drawn ${edge.beyond.toFixed(2)} cells off the east side of the 8x8 board`);
  }

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
        /* Each view gets the framing it is FOR, so the assertion differs by view.
         * FLAT is where the player taps individual cells, so cells must never fall below the touch floor.
         * TILT is bought with the third star and exists to show the board's SHAPE at once, so it frames the whole
         * board and cells are allowed below the floor. Requiring the touch floor in tilt is what produced a canyon
         * of blocks filling the screen on a 24x24 board instead of the isometric model of the whole thing. */
        if (v === 'flat') {
          check(m.cellPx >= info.minCellPx - 1e-6,
            `${vp.name} ${board} flat: getCellPx() ${m.cellPx.toFixed(1)} >= ${info.minCellPx} (flat is the tapping view)`);
        } else {
          check(m.pct >= TARGET[v] - 1e-6 && m.pct <= 1 + 1e-6,
            `${vp.name} ${board} tilt: the WHOLE board is on screen, filling ${pct(m.pct)} of the limiting dimension ` +
            `(cells ${m.cellPx.toFixed(1)} px, below the touch floor by design)`);
        }
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

  // ================================================================================================
  // ARCHES AND WINDOWS (DESIGN.md 13.3 + 13.5)
  // The feature is a deception with one deliberate leak, so it is tested as one: (a) the FLAT view of an opened
  // column must be pixel-identical to a solid column of the same height EVERYWHERE except inside the light leak,
  // (b) the leak must actually be there and be findable at the 34 px phone cell floor, (c) the camera silhouette
  // must not move, (d) the tilted view must show a real hole, (e) the per-voxel geometry must not cost draw calls.
  // ================================================================================================
  console.log('\n== arches and windows (DESIGN.md 13)');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(150);

  // (0) the openings adapter reads the parsed level
  const bits = await page.evaluate(() => {
    const h = window.__h; h.load('arch'); h.fit();
    return { arch: h.openLevelsAt(3, 4), window: h.openLevelsAt(8, 5), solid: h.openLevelsAt(10, 5),
      lone: h.openLevelsAt(2, 8), loneSolid: h.openLevelsAt(4, 8),
      wallA: h.openLevelsAt(3, 3), wallB: h.openLevelsAt(8, 4), off: h.openLevelsAt(-1, 40),
      t: { arch: h.level.t[4][3], window: h.level.t[5][8], solid: h.level.t[5][10],
           lone: h.level.t[8][2], loneSolid: h.level.t[8][4] } };
  });
  check(bits.arch === 1, `ARCH at (3,4) is open at level 0 only (mask ${bits.arch}) and t = ${bits.t.arch}`);
  check(bits.window === 2, `WINDOW at (8,5) is open at level 1 only (mask ${bits.window}) and t = ${bits.t.window}`);
  check(bits.solid === 0 && bits.wallA === 0 && bits.wallB === 0 && bits.off === 0 && bits.loneSolid === 0,
    `the solid columns and both wall neighbours carry no opening (${bits.solid}/${bits.wallA}/${bits.wallB}/${bits.loneSolid}), off-board is 0`);
  check(bits.lone === 1 && bits.t.lone === 3 && bits.t.loneSolid === 3,
    `the lone ARCH at (2,8) and the lone SOLID column at (4,8) are both height 3 - the pair FLAT is judged on`);
  check(bits.t.arch === 3 && bits.t.window === 3 && bits.t.solid === 3,
    `arch, window and solid column are all height 3, so FLAT cannot tell them apart by height`);

  // (1) THE FLAT VIEW MUST STAY A LIE. Whole-framebuffer diff: the same board, with and without `openings`.
  const openCells = [{ x: 3, y: 4 }, { x: 8, y: 5 }, { x: 2, y: 8 }];
  const diff = await page.evaluate((cells) => window.__h.flatDiff('arch', 'archSolid', cells), openCells);
  const leakQuadPx = await page.evaluate(() => window.__h.theme.terrain.lightLeak.quadCells * window.__h.render.getCellPx());
  check(!diff.error && diff.diff > 0,
    `FLAT diff of the opened board against the solid one: ${diff.diff} of ${diff.pixels} pixels differ ` +
    `(max channel delta ${diff.maxDelta}), i.e. the hole itself is completely invisible from above`);
  check(diff.worstDistPx <= leakQuadPx / 2 + 1,
    `every differing pixel lies inside a light-leak quad: furthest is ${diff.worstDistPx.toFixed(1)} CSS px from an ` +
    `opened cell centre, quad half-width ${(leakQuadPx / 2).toFixed(1)} px (cell ${diff.cellPx.toFixed(1)} px)`);
  check(diff.perCell.every((n) => n > 0),
    `every opened column leaks: ${JSON.stringify(diff.perCell)} differing pixels at (3,4), (8,5) and (2,8)`);

  // ... and the same proof stated the way a player would check it: an opened column's top, sampled clear of the
  // leak, is BYTE-identical to the solid column beside it and to a plain floor cell.
  const tops = await page.evaluate(() => {
    const h = window.__h; h.load('arch'); h.fit();
    h.render.setCameraPreset('flat', { animate: false }); h.settle(900);
    const c = h.render.getCellPx(), off = Math.round(c * 0.36);      // out past the leak, still on the cell top
    return { arch: h.sampleCell({ x: 2, y: 8 }, off, 0), archUp: h.sampleCell({ x: 2, y: 8 }, 0, off),
      wall: h.sampleCell({ x: 4, y: 8 }, off, 0), window: h.sampleCell({ x: 8, y: 6 }, off, 0),
      solid: h.sampleCell({ x: 10, y: 5 }, off, 0), floor: h.sampleCell({ x: 1, y: 1 }, off, 0), off,
      // 13.3's second tell: the beam IS drawn crossing the arch cell, which from above looks solid
      beamOverArch: h.sampleCell({ x: 3, y: 4 }, Math.round(c * 0.40), 0),
      sameSpotNoBeam: h.sampleCell({ x: 3, y: 3 }, Math.round(c * 0.40), 0) };
  });
  {
    const eq = (a, b) => a.length === 3 && a.every((v, i) => v === b[i]);
    check(eq(tops.arch, tops.wall) && eq(tops.window, tops.solid) && eq(tops.arch, tops.solid) &&
      eq(tops.arch, tops.floor) && eq(tops.archUp, tops.wall),
      `FLAT top colour is byte-identical for arch ${tops.arch}, window ${tops.window}, solid ${tops.solid}, ` +
      `plain wall ${tops.wall} and bare floor ${tops.floor} (sampled ${tops.off} px off centre)`);
    // DESIGN.md 13.3, "the beam is its own tell": a level-0 beam must be SEEN crossing the arch's cell in FLAT.
    // Before this change the column top hid it and the run looked like it stopped dead at the wall.
    const bright = Math.max(...tops.beamOverArch), dim = Math.max(...tops.sameSpotNoBeam);
    check(bright > dim + 60 && eq(tops.sameSpotNoBeam, tops.floor),
      `FLAT: the beam is drawn CROSSING the arch's cell ${JSON.stringify(tops.beamOverArch)} while the identical ` +
      `spot on the solid column beside it stays floor ${JSON.stringify(tops.sameSpotNoBeam)} - passing under an ` +
      `overhang reads as "wait, what?", never as "the beam stopped"`);
  }

  // (2) THE LIGHT LEAK (13.3): present, faint, cyan, additive, and gone by the time the board is tilted.
  const leak = await page.evaluate(async () => {
    const h = window.__h, r = h.render;
    h.load('arch'); h.fit();
    await r.setCameraPreset('flat', { animate: false }); h.settle(900);
    const flat = h.leak(), L = h.theme.terrain.lightLeak;
    // the leak's own pixel, dead centre of the opened cell, against the identical spot on the solid column
    const lit = h.sampleCell({ x: 2, y: 8 }, 0, 0), dark = h.sampleCell({ x: 4, y: 8 }, 0, 0);
    const solidNone = (h.load('archSolid'), h.fit(), h.settle(300), h.leak());
    h.load('arch'); h.fit(); await r.setCameraPreset('flat', { animate: false }); h.settle(900);
    await r.setCameraPreset('tilt', { animate: false }); h.settle(900);
    const tilt = h.leak();
    return { flat, tilt, solidNone, lit, dark, L, cellPx: r.getCellPx() };
  });
  check(leak.flat.mesh && leak.flat.quads === 3 && leak.solidNone.mesh === false,
    `one merged light-leak mesh carries exactly ${leak.flat.quads} quads (one per opened column) and a board with ` +
    `no openings builds none`);
  check(leak.flat.color === '#45E7FF' && leak.flat.additive && leak.flat.renderOrder === leak.L.renderOrder,
    `the leak is theme.terrain.lightLeak: colour ${leak.flat.color}, additive ${leak.flat.additive}, ` +
    `renderOrder ${leak.flat.renderOrder}`);
  check(Math.abs(leak.flat.opacity - leak.L.opacity) < 1e-9 && leak.flat.visible,
    `visible in FLAT at opacity ${leak.flat.opacity}`);
  check(leak.tilt.opacity === 0 && !leak.tilt.visible,
    `retired at full tilt (opacity ${leak.tilt.opacity}), so tilting is not rewarded with two tells at once`);
  {
    // Findable at the phone floor: the leak must lift the cell centre clear of the floor colour, without turning it
    // into a beacon. Measured against the identical pixel on the solid column of the same height.
    const d = [0, 1, 2].map((i) => leak.lit[i] - leak.dark[i]);
    const peak = Math.max(...d);
    check(JSON.stringify(leak.dark) !== JSON.stringify(leak.lit) && peak >= 24 && peak <= 150,
      `at the ${leak.cellPx.toFixed(1)} px phone cell the leak lifts the cell centre from ${JSON.stringify(leak.dark)} ` +
      `to ${JSON.stringify(leak.lit)} (+${JSON.stringify(d)}): findable when you look, quiet when you do not`);
    check(d[2] >= d[0] && d[1] >= d[0],
      `the lift is cyan, not white: red +${d[0]} is the smallest channel (green +${d[1]}, blue +${d[2]})`);
  }

  // (3) THE SILHOUETTE IS UNCHANGED: the camera auto-fit reads render-terrain's fitPoints, which must not see the
  // hole - the column's outer extent is the same.
  const sil = await page.evaluate(async () => {
    const h = window.__h, r = h.render, out = {};
    for (const which of ['arch', 'archSolid']) {
      out[which] = {};
      for (const v of ['flat', 'tilt']) {
        h.load(which); h.fit();
        await r.setCameraPreset(v, { animate: false }); await r.fitToBoard({ animate: false }); h.settle(900);
        out[which][v] = h.silhouette();
      }
    }
    return out;
  });
  for (const v of ['flat', 'tilt']) {
    check(JSON.stringify(sil.arch[v]) === JSON.stringify(sil.archSolid[v]),
      `${v}: the camera fit is identical with and without openings ${JSON.stringify(sil.arch[v])}`);
  }

  // (4) THE TILTED VIEW MUST SHOW A REAL HOLE. Read the terrain geometry cell by cell: for the arch, the window
  // and a solid column of the same height, which altitude bands actually carry wall, where the ceilings are, and
  // where the interior floors are. A height field cannot produce any of the answers below.
  const holes = await page.evaluate(async (cells) => {
    const h = window.__h, r = h.render;
    function scanCell(cx, cy) {
      let terrain = null;
      r._scene.traverse((o) => { if (o.name === 'terrain') terrain = o; });
      const bands = [0, 0, 0, 0], ceil = [], floors = [], lids = [];
      terrain.children.forEach((m) => {
        if (!m.isMesh || m.name === 'terrainLightLeak') return;
        const p = m.geometry.getAttribute('position'), n = m.geometry.getAttribute('normal');
        if (!p || !n) return;
        for (let i = 0; i < p.count; i += 3) {
          const mx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
          const mz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
          if (Math.abs(mx - cx) > 0.49 || Math.abs(mz + cy) > 0.49) continue;      // three -> game: z = -y
          const ny = n.getY(i);
          const y0 = Math.min(p.getY(i), p.getY(i + 1), p.getY(i + 2));
          const y1 = Math.max(p.getY(i), p.getY(i + 1), p.getY(i + 2));
          if (Math.abs(ny) < 0.5) { for (let k = 0; k < 4; k++) if (y0 <= k + 0.01 && y1 >= k + 0.99) bands[k]++; }
          else if (ny < -0.5) { if (ceil.indexOf(Math.round(y0)) < 0) ceil.push(Math.round(y0)); }
          else if (y0 > 0.01) { if (lids.indexOf(Math.round(y0)) < 0) lids.push(Math.round(y0)); }
        }
      });
      return { bands: bands, ceilings: ceil.sort(), ups: lids.sort(), floors: floors };
    }
    h.load('arch'); h.fit(); await r.setCameraPreset('tilt', { animate: false }); h.settle(900);
    const out = { open: {} };
    for (const k of Object.keys(cells)) out.open[k] = scanCell(cells[k][0], cells[k][1]);
    h.load('archSolid'); h.fit(); h.settle(300);
    out.solid = {};
    for (const k of Object.keys(cells)) out.solid[k] = scanCell(cells[k][0], cells[k][1]);
    return out;
  }, { arch: [3, 4], window: [8, 5], solid: [10, 5], wall: [3, 3] });
  check(holes.open.arch.bands[0] === 0 && holes.open.arch.bands[1] > 0 && holes.open.arch.bands[2] > 0,
    `TILT ARCH (3,4): NO wall in the level-0 band (${holes.open.arch.bands[0]} triangles) but wall at 1 and 2 ` +
    `(${holes.open.arch.bands[1]}/${holes.open.arch.bands[2]}) - a beam on the floor runs straight under it`);
  check(JSON.stringify(holes.open.arch.ceilings) === '[1]',
    `TILT ARCH: the opening has a real ceiling face at height 1 ${JSON.stringify(holes.open.arch.ceilings)}`);
  check(holes.open.window.bands[0] > 0 && holes.open.window.bands[1] === 0 && holes.open.window.bands[2] > 0,
    `TILT WINDOW (8,5): wall at level 0 and 2 (${holes.open.window.bands[0]}/${holes.open.window.bands[2]}), ` +
    `nothing at 1 (${holes.open.window.bands[1]}) - only a beam at height 1 threads it`);
  check(JSON.stringify(holes.open.window.ceilings) === '[2]' && holes.open.window.ups.indexOf(1) >= 0,
    `TILT WINDOW: the opening has a ceiling at 2 ${JSON.stringify(holes.open.window.ceilings)} and a lit floor at 1 ` +
    `${JSON.stringify(holes.open.window.ups)}, so the hole reads as a recess and not as a gap in the render`);
  check(holes.open.solid.bands.slice(0, 3).every((n) => n > 0) && holes.open.solid.ceilings.length === 0 &&
        JSON.stringify(holes.open.solid.bands) === JSON.stringify(holes.solid.solid.bands),
    `the SOLID column of the same height is walled at every level ${JSON.stringify(holes.open.solid.bands)} with no ` +
    `ceilings, and is built identically whether or not the board carries openings`);
  check(JSON.stringify(holes.solid.arch.bands) === JSON.stringify(holes.open.wall.bands) &&
        holes.solid.arch.ceilings.length === 0 && holes.solid.window.ceilings.length === 0,
    `with the openings stripped, the same cells build exactly like their solid neighbours ` +
    `${JSON.stringify(holes.solid.arch.bands)} and gain no ceilings`);

  // (5) PERFORMANCE: the per-voxel rebuild must not cost draw calls, and a 24x24 board with an opening in every
  // column tall enough to take one must still hold 60 fps.
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.waitForTimeout(120);
  const openPerf = await page.evaluate(async () => {
    const h = window.__h, r = h.render, out = {};
    for (const which of ['big24', 'big24open']) {
      const info = h.load(which); h.fit();
      for (const v of ['flat', 'tilt']) {
        await h.view(v); h.settle(600); r.frame(0.016);
        out[which + '/' + v] = { cells: info.w * info.d, objects: h.sceneObjects(), calls: r._renderer.info.render.calls,
          triangles: r._renderer.info.render.triangles, ms: h.frameTime(60) };
      }
      out[which + '/openColumns'] = (function () {
        let n = 0;
        for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (h.openLevelsAt(x, y)) n++;
        return n;
      }());
      const t0 = performance.now();
      for (let i = 0; i < 5000; i++) r.pickCell(200 + (i % 300), 300 + (i % 400));
      out[which + '/pickUs'] = (performance.now() - t0) * 1000 / 5000;
    }
    return out;
  });
  console.log(`   ${openPerf['big24open/openColumns']} of 576 columns on the 24x24 stress board carry an opening`);
  for (const v of ['flat', 'tilt']) {
    const a = openPerf['big24/' + v], b = openPerf['big24open/' + v];
    console.log(`   big24 ${v.padEnd(4)}  solid ${String(a.calls).padStart(3)} calls ${String(a.triangles).padStart(6)} tris ${a.ms.toFixed(2)} ms   ->   openings ${String(b.calls).padStart(3)} calls ${String(b.triangles).padStart(6)} tris ${b.ms.toFixed(2)} ms`);
    check(b.calls <= a.calls + 1 && b.calls < 600,
      `24x24 with openings ${v}: ${b.calls} draw calls vs ${a.calls} solid (the leak adds at most one merged mesh), still < 600`);
    check(b.ms < 16.7,
      `24x24 with openings ${v}: ${b.ms.toFixed(2)} ms/frame < 16.7 ms (solid board ${a.ms.toFixed(2)} ms)`);
  }
  check(openPerf['big24open/pickUs'] < 40,
    `picking is untouched by openings: ${openPerf['big24open/pickUs'].toFixed(1)} us per pickCell ` +
    `(solid board ${openPerf['big24/pickUs'].toFixed(1)} us)`);

  // (6) the eyeball shots, at the phone size the leak has to survive
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(150);
  await page.evaluate(async () => { const h = window.__h; h.load('arch'); h.fit(); await h.view('flat'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'arch-flat-iphone.png') });
  await page.evaluate(async () => { const h = window.__h; await h.view('tilt'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'arch-tilt-iphone.png') });
  await page.evaluate(async () => { const h = window.__h; h.load('archSolid'); h.fit(); await h.view('flat'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'arch-flat-solid-control-iphone.png') });
  await page.setViewportSize({ width: 900, height: 900 });
  await page.waitForTimeout(150);
  await page.evaluate(async () => { const h = window.__h; h.load('arch'); h.fit(); await h.view('tilt'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'arch-tilt-desktop.png') });
  await page.evaluate(async () => { const h = window.__h; await h.view('flat'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'arch-flat-desktop.png') });

  // ================================================================================================
  // DARKNESS (DESIGN.md 15). A dark level draws nothing of the world until a beam has been in the cell, and the
  // grid outline over the ground plane always. The feature is a GATE ON TIME, so it is tested as two opposite
  // statements about the SAME board (the arch board, dark and lit, drawing the identical beam):
  //   (a) nothing known  -> the terrain is not drawn at all, and the board still shows its grid and its extent;
  //   (b) everything known -> BYTE-IDENTICAL to the lit board, because 15.1 says a known cell renders exactly as
  //       it would on a lit board and darkness only decides when the player sees it.
  // Plus: the seed set (15.1's "the emitter and every target are known from the start"), and the arrival - which
  // must produce frames, keep asking for them, and then stop, because rendering is dirty-driven and a fog that
  // never cleared its flag would pin a phone's GPU on for ever.
  // ================================================================================================
  console.log('\n== darkness (DESIGN.md 15)');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(150);

  // (0) the seed: the emitter's cell and every target's cell, and nothing else
  const seed = await page.evaluate(() => {
    const h = window.__h; h.load('dark'); h.fit(); h.view('flat'); h.settle(300);
    const L = h.level, f = h.fog();
    const others = [];
    for (let y = 0; y < L.size.d; y++) for (let x = 0; x < L.size.w; x++) {
      if (x === L.emitter.x && y === L.emitter.y) continue;
      if (L.targets.some((t) => t.x === x && t.y === y)) continue;
      if (h.fogAt(x, y) !== 0) others.push([x, y]);
    }
    return { dark: f.dark, on: f.on, known: f.known, total: f.total, targets: L.targets.length,
      emitter: h.fogAt(L.emitter.x, L.emitter.y), target: h.fogAt(L.targets[0].x, L.targets[0].y),
      wall: h.fogAt(3, 3), others };
  });
  check(seed.dark && seed.on === 1, `dark level: fog on (uFogOn ${seed.on}), ${seed.total} cells`);
  check(seed.emitter === 1 && seed.target === 1,
    `the emitter's cell and the target's cell are known from the start (${seed.emitter} / ${seed.target})`);
  check(seed.known === 1 + seed.targets && seed.others.length === 0,
    `and NOTHING else is: ${seed.known} known of ${seed.total} = emitter + ${seed.targets} target(s), ` +
    `${seed.others.length} other cells known`);
  check(seed.wall === 0, `a tall wall the beam has not reached is unknown (fog ${seed.wall})`);

  // (1) an unknown cell draws NO terrain: its lid is gone and the pixel is the fog ground, not the block top.
  //     Sampled in TILT, where a 3-high column is unmistakable, at the cell's own projected top.
  const hidden = await page.evaluate(() => {
    const h = window.__h;
    function sampleTop(cell) {   // the pixel at the cell's centre, at the column's own height
      const r = h.render, gl = r._renderer.getContext(), rect = r._renderer.domElement.getBoundingClientRect();
      const dpr = r._renderer.getPixelRatio(), p = r.projectCell(cell, 0), buf = new Uint8Array(4);
      r.frame(0.016); gl.finish();
      gl.readPixels(Math.round((p.x - rect.left) * dpr), Math.round(gl.drawingBufferHeight - (p.y - rect.top) * dpr), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return Array.prototype.slice.call(buf, 0, 3);
    }
    const cell = { x: 4, y: 8 };                       // a lone solid column, height 3, well clear of the beam
    h.load('dark'); h.fit(); h.view('tilt'); h.settle(900);
    const unknown = sampleTop(cell), fogK = h.fogAt(cell.x, cell.y);
    h.reveal([cell]); h.settle(900);
    const known = sampleTop(cell);
    h.load('arch'); h.fit(); h.view('tilt'); h.settle(900);
    const lit = sampleTop(cell);
    return { cell, unknown, known, lit, fogK, dark: h.theme.terrain.darkness.unknownColor };
  });
  const near = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
  check(hidden.fogK === 0 && !near(hidden.unknown, hidden.lit, 12),
    `an unknown 3-high column draws no terrain: (${hidden.cell.x},${hidden.cell.y}) reads rgb(${hidden.unknown}) ` +
    `where the lit board draws rgb(${hidden.lit})`);
  check(hidden.unknown.every((v) => v < 40),
    `and what is there instead is the fog ground ${hidden.dark}, not a block top: rgb(${hidden.unknown})`);
  check(near(hidden.known, hidden.lit, 2),
    `revealing that one cell brings the column back exactly as the lit board draws it: rgb(${hidden.known}) vs rgb(${hidden.lit})`);

  // (2) 15.1's last rule, as a whole-framebuffer diff. Dark + everything known must be pixel-identical to lit.
  for (const view of ['flat', 'tilt']) {
    const same = await page.evaluate((v) => window.__h.diffScenes('arch', 'dark', v, true), view);
    check(!same.error && same.diff === 0,
      `${view.toUpperCase()}: a dark board with every cell known is pixel-identical to the lit board ` +
      `(${same.diff} of ${same.pixels} pixels differ, max channel delta ${same.maxDelta})`);
  }
  // ...and the opposite direction, so the diff above is not passing because the fog does nothing at all.
  for (const view of ['flat', 'tilt']) {
    const gone = await page.evaluate((v) => window.__h.diffScenes('arch', 'dark', v, false), view);
    check(!gone.error && gone.pct > 0.05,
      `${view.toUpperCase()}: with only the seed known the same board differs from the lit one over ` +
      `${pct(gone.pct)} of the frame (max channel delta ${gone.maxDelta})`);
  }

  // (3) the grid outline is ALWAYS drawn (15.1), so the board's extent and every tap target survive the dark.
  const extent = await page.evaluate(() => {
    const h = window.__h;
    h.load('dark'); h.fit(); h.view('flat'); h.settle(600);
    const lines = [];
    h.render._scene.traverse((o) => { if (o.name === 'terrain-grid') lines.push({ visible: o.visible, verts: o.geometry.getAttribute('position').count }); });
    const box = h.render.getBoardScreenBox();
    const corner = h.render.pickCell(h.render.projectCell({ x: 0, y: 0 }, 0).x, h.render.projectCell({ x: 0, y: 0 }, 0).y);
    const far = h.render.pickCell(h.render.projectCell({ x: 11, y: 11 }, 0).x, h.render.projectCell({ x: 11, y: 11 }, 0).y);
    return { lines, box: { w: +box.width.toFixed(1), h: +box.height.toFixed(1) }, corner, far, cells: h.level.size.w * h.level.size.d };
  });
  check(extent.lines.length === 1 && extent.lines[0].visible && extent.lines[0].verts === extent.cells * 8,
    `the grid outline is drawn for every one of the ${extent.cells} cells, dark or not ` +
    `(${extent.lines[0] && extent.lines[0].verts} line vertices)`);
  check(extent.corner && extent.corner.x === 0 && extent.corner.y === 0 && extent.far && extent.far.x === 11 && extent.far.y === 11,
    `an unknown cell is still tappable: pick(0,0) -> ${JSON.stringify(extent.corner)}, pick(11,11) -> ${JSON.stringify(extent.far)}`);

  // (4) the arrival: frames are produced, needsFrame() stays true through it and goes false at the end. A missed
  //     dirty flag would freeze the board mid-reveal; a flag that never cleared would never let it sleep.
  const arrive = await page.evaluate(() => {
    const h = window.__h;
    h.load('dark'); h.fit(); h.view('flat'); h.settle(900);
    return { run: h.revealTrace({ x: 4, y: 8 }), ms: h.theme.terrain.darkness.revealMs };
  });
  const vals = arrive.run.values;
  check(arrive.run.before === 0 && arrive.run.needsAfterCall === true,
    `revealing a cell marks the scene dirty at once (needsFrame ${arrive.run.needsAfterCall} with the cell at ${arrive.run.before})`);
  check(vals.length > 3 && vals.every((v, i) => i === 0 || v > vals[i - 1]) && arrive.run.after === 1,
    `the arrival eases over ${vals.length} frames, strictly increasing, and lands on 1 ` +
    `(${vals.slice(0, 3).join(' -> ')} ... ${vals[vals.length - 1]})`);
  check(Math.abs(vals.length * 16 - arrive.ms) < arrive.ms * 0.5,
    `and it takes about theme.terrain.darkness.revealMs = ${arrive.ms} ms (${vals.length} frames of 16 ms)`);
  check(arrive.run.animatingAfter === false && arrive.run.needsAfter === false,
    `then it STOPS asking for frames (animating ${arrive.run.animatingAfter}, needsFrame ${arrive.run.needsAfter}), ` +
    `so a dark board at rest costs nothing`);

  // (5) prefers-reduced-motion: no arrival at all, the cell is simply known.
  const reduced = await page.evaluate(() => {
    const h = window.__h;
    h.load('dark'); h.fit(); h.view('flat'); h.settle(600);
    h.render.setReducedMotion(true);
    const run = h.revealTrace({ x: 2, y: 8 });
    h.render.setReducedMotion(false);
    return run;
  });
  check(reduced.values.length === 1 && reduced.after === 1 && reduced.animatingAfter === false,
    `prefers-reduced-motion: the cell is known immediately, with no arrival to animate (${reduced.values.length} frame)`);

  // (6) the eyeball shots
  await page.evaluate(() => { const h = window.__h; h.load('dark'); h.fit(); h.view('flat'); h.settle(900); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(shots, 'dark-harness-flat-before.png') });
  await page.evaluate(() => { const h = window.__h; h.view('tilt'); h.settle(900); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(shots, 'dark-harness-tilt-before.png') });
  await page.evaluate(() => { const h = window.__h; h.reveal(h.beamCells()); h.settle(900); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(shots, 'dark-harness-tilt-after.png') });
  await page.evaluate(() => { const h = window.__h; h.view('flat'); h.settle(900); });
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(shots, 'dark-harness-flat-after.png') });

  // ---- screenshots of a 20x20 board on a phone ----
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForTimeout(120);
  await page.evaluate(async () => { const h = window.__h; h.load('big20'); h.fit(); await h.view('flat'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'big-flat.png') });
  await page.evaluate(async () => { const h = window.__h; await h.view('tilt'); h.settle(900); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shots, 'big-tilt.png') });


  // ============================================================================================================
  // == MOTION-DIRECTION.md 1 (the beam as a living thing) and 2 (FIRE as a timed sequence)
  // ============================================================================================================
  // These drive a STANDALONE LaserRenderBeam instance (the harness's globals are all loaded) so the whole
  // choreography can be stepped deterministically without touching render.js's own beam or the checks above.
  console.log('\n== beam motion: pulse, contact, FIRE sequence (MOTION-DIRECTION 1 + 2)');
  const BEAM_SCENES = {
    // WEDGE lifts the beam, a MIRROR turns it while it is STILL CLIMBING, a DIP levels it.
    'climb-mirror-dip': {
      raw: { name: 'CMD', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '02100000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['MIRROR'] },
      placed: [{ x: 2, y: 4, type: 'WEDGE', orient: '/' }, { x: 2, y: 5, type: 'MIRROR', orient: '\\' },
               { x: 1, y: 5, type: 'DIP', orient: '\\' }] },
    // DIP sends the beam DOWN, a FLOOR plate bounces it back UP without turning it.
    'floor-bounce': {
      raw: { name: 'FB', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '22000000', '01000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['MIRROR'] },
      placed: [{ x: 1, y: 4, type: 'DIP', orient: '/' }, { x: 1, y: 5, type: 'FLOOR', orient: '/' }] },
    // straight into a wall: the blocked cap and its three recoil sparks
    'blocked': {
      raw: { name: 'BLK', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00003000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['MIRROR'] },
      placed: [] },
    // one MIRROR turns the beam into the target
    'target': {
      raw: { name: 'TGT', par: 1, size: { w: 8, d: 8 },
        terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
        emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 4, y: 7 }], fixed: [], tray: ['MIRROR'] },
      placed: [{ x: 4, y: 4, type: 'MIRROR', orient: '/' }] },
    // the three tray pieces on the SAME cell: in FLAT their contact decoration must be indistinguishable
    'flat-mirror': { raw: null, placed: [{ x: 2, y: 4, type: 'MIRROR', orient: '/' }] },
    'flat-wedge': { raw: null, placed: [{ x: 2, y: 4, type: 'WEDGE', orient: '/' }] },
    'flat-dip': { raw: null, placed: [{ x: 2, y: 4, type: 'DIP', orient: '/' }] },
  };
  // Same emitter, same pieces, same traced route; the columns the beam never touches differ in height.
  for (const [key, filler] of [['height-a', '0'], ['height-b', '3']]) {
    const rows = [];
    for (let y = 0; y < 8; y++) {
      let row = '';
      for (let x = 0; x < 8; x++) row += (y === 4 || (x === 4 && y >= 4)) ? '0' : filler;
      rows.push(row);
    }
    BEAM_SCENES[key] = { raw: { name: key, par: 1, size: { w: 8, d: 8 }, terrain: rows,
      emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 4, y: 7 }], fixed: [], tray: ['MIRROR'] },
      placed: [{ x: 4, y: 4, type: 'MIRROR', orient: '/' }] };
  }
  BEAM_SCENES['flat-mirror'].raw = BEAM_SCENES['flat-wedge'].raw = BEAM_SCENES['flat-dip'].raw = {
    name: 'FLATPIECE', par: 1, size: { w: 8, d: 8 },
    terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
    emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['MIRROR'] };

  const beamMotion = await page.evaluate((scenes) => {
    const T = window.LaserTheme, M = T.motion, S = window.LaserSim, THREE = window.THREE;
    const NORMAL = { cellsPerSecond: T.beam.travel.cellsPerSecond, liveRetraceMs: T.beam.travel.liveRetraceMs,
      minDurationMs: T.beam.travel.minDurationMs, maxDurationMs: T.beam.travel.maxDurationMs };
    const REDUCED = { cellsPerSecond: T.reducedMotion.beamTravelCellsPerSecond,
      liveRetraceMs: T.beam.travel.liveRetraceMs * T.reducedMotion.durationScale,
      minDurationMs: T.reducedMotion.beamTravelMinDurationMs, maxDurationMs: T.reducedMotion.beamTravelMaxDurationMs };
    function makeView(mode) {
      const cam = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
      if (mode === 'flat') { cam.position.set(0, 20, 0); cam.up.set(0, 0, -1); }
      else { cam.position.set(12, 12, 12); cam.up.set(0, 1, 0); }
      cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true);
      return { zoom: 30, up: new THREE.Vector3(0, 1, 0), quaternion: cam.quaternion, camera: cam };
    }
    const FLAT = makeView('flat'), TILT = makeView('tilt');
    function trace(name) {
      const sc = scenes[name], level = S.parseLevel(sc.raw);
      return { level, result: S.trace(level, sc.placed) };
    }
    function newBeam() { return window.LaserRenderBeam.create(T); }
    // every (arc distance, pitch-envelope peak) pair the merged tubes carry
    function peaks(beam) {
      const out = [];
      beam.group.getObjectByName('beamTubes').traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        const d = o.geometry.getAttribute('aDist'), p = o.geometry.getAttribute('aPeak');
        if (!d || !p) return;
        for (let i = 0; i < d.count; i++) out.push([d.getX(i), p.getX(i)]);
      });
      return out;
    }
    // tube vertices carry only their END distances, so the rhythm AT a distance is the one on the nearest
    // vertex ring at or before it - i.e. the start of the tube that contains it.
    function peakSpan(list, at) {
      let best = -Infinity, lo = Infinity, hi = -Infinity, n = 0;
      for (const [d] of list) if (d <= at + 1e-9 && d > best) best = d;
      for (const [d, p] of list) { if (Math.abs(d - best) > 1e-9) continue; n++; lo = Math.min(lo, p); hi = Math.max(hi, p); }
      return { n, at, from: +best.toFixed(4), lo: +lo.toFixed(4), hi: +hi.toFixed(4) };
    }
    function peakPairs(list) {
      const seen = {}, out = [];
      for (const [d, p] of list) { const k = d.toFixed(4) + '|' + p.toFixed(4); if (seen[k]) continue; seen[k] = 1; out.push([+d.toFixed(4), +p.toFixed(4)]); }
      return out.sort((a, b) => a[0] - b[0]);
    }
    function instances(beam) {
      const out = { disc: [], streak: [] };
      beam.group.getObjectByName('beamSprites').children.forEach((mesh, mi) => {
        const key = mi === 0 ? 'disc' : 'streak';
        const a = mesh.userData.alpha, c = mesh.userData.tint, m = new THREE.Matrix4();
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, m);
          out[key].push({ alpha: +a.getX(i).toFixed(5), color: [c.getX(i), c.getY(i), c.getZ(i)].map((v) => +v.toFixed(5)),
            m: Array.from(m.elements).map((v) => +v.toFixed(5)) });
        }
      });
      return out;
    }
    /* run to a stop, then keep going: the frame count, whether anything still asks for frames, and whether the
     * next 300 frames change ANY observable value. This is the proof that every animation added here terminates. */
    function runToStop(beam, view, mp, maxFrames) {
      let n = 0;
      while (beam.isAnimating() && n < (maxFrames || 4000)) { beam.frame(1 / 60, view, mp); n++; }
      const dbg = beam._debug(), stamp = JSON.stringify([dbg, instances(beam)]);
      for (let i = 0; i < 300; i++) beam.frame(1 / 60, view, mp);
      return { frames: n, animating: beam.isAnimating(), dbg,
        stable: JSON.stringify([beam._debug(), instances(beam)]) === stamp, after: beam._debug() };
    }
    const out = {};

    // ---- 1. the pitch-envelope attribute: peakAt by the TRACED segment's own pitch ----
    {
      const b = newBeam(), t = trace('climb-mirror-dip');
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      const p = peaks(b);
      out.cmd = { level: peakSpan(p, 1.0), climb1: peakSpan(p, 3.0),
        climb2: peakSpan(p, 4.2), levelled: peakSpan(p, 6.0), pairs: peakPairs(p),
        total: b.getProgress().total, ends: t.result.end,
        kinds: t.result.events.map((e) => e.kind).join(',') };
      out.cmd.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 2. a FLOOR plate turns a descent into a climb and leaves its bounce dot ----
    {
      const b = newBeam(), t = trace('floor-bounce');
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      const p = peaks(b);
      out.floor = { level: peakSpan(p, 0.5), descend: peakSpan(p, 2.0), climb: peakSpan(p, 3.0),
        climb2: peakSpan(p, 4.5), pairs: peakPairs(p),
        bounces: t.result.bounces.length, total: b.getProgress().total };
      out.floor.stop = runToStop(b, TILT, NORMAL);
      out.floor.settled = instances(b);
      b.dispose();
    }
    // ---- 3. the FIRE sequence: charge, release, linear travel, settle ----
    {
      const b = newBeam(), t = trace('target');
      b.setChargeMs(M.fire.chargeMs);
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      const d0 = b._debug();
      const samples = [];
      let lit = 0; b.onLit(() => { lit++; });
      const step = () => { b.frame(1 / 60, TILT, NORMAL); return b._debug(); };
      // during the charge the head must not move, the beam must still count as playing, and the emitter charge rises
      let midCharge = null, chargeEnd = null;
      for (let i = 0; i < 200; i++) {
        const d = step();
        if (d.clock >= M.fire.chargeMs * 0.5 && !midCharge) midCharge = { d, charge: b.getCharge(), playing: b.getProgress().playing };
        if (d.clock >= M.fire.chargeMs && !chargeEnd) { chargeEnd = { d, charge: b.getCharge(), head: d.head }; }
        if (d.clock > M.fire.chargeMs + 40) break;
      }
      // travel: linear head, gain pinned at 1
      const t1 = b._debug();
      while (b._debug().clock < d0.routeEndMs - 20) { step(); samples.push(b._debug()); }
      const beforeEnd = b._debug();
      out.fireBeforeEnd = beforeEnd;
      // the settle: gain must ramp to EXACTLY zero over m.beam.settleMs and never come back
      while (b._debug().clock < d0.routeEndMs + 1) step();
      const atRouteEnd = b._debug();
      while (b._debug().clock < d0.routeEndMs + M.beam.settleMs * 0.5) step();
      const midSettle = b._debug();
      out.fire = { d0, midCharge, chargeEnd, atRouteEnd, midSettle, lit,
        release: M.fire.releaseMs, chargeMs: M.fire.chargeMs,
        linear: samples.length > 4 ? (() => {
          // head must be an exactly linear function of the clock while travelling
          let worst = 0;
          for (const s of samples) worst = Math.max(worst, Math.abs(s.head - (s.clock - s.chargeMs) * (s.total / (s.routeEndMs - s.chargeMs))));
          return worst;
        })() : -1 };
      out.fire.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 4. FLAT: MIRROR, WEDGE and DIP get identical contact decoration ----
    {
      const grab = (name) => {
        const b = newBeam(), t = trace(name);
        b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
        const hit = t.result.events.filter((e) => e.kind === 'piece').length;
        // step to just past the contact's attack peak
        for (let i = 0; i < 400; i++) { b.frame(1 / 60, FLAT, NORMAL); if (b._debug().discs > 0) break; }
        for (let i = 0; i < 3; i++) b.frame(1 / 60, FLAT, NORMAL);
        const inst = instances(b);
        const tilt = (() => {
          const c = newBeam();
          c.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
          for (let i = 0; i < 400; i++) { c.frame(1 / 60, TILT, NORMAL); if (c._debug().discs > 0) break; }
          const r = instances(c); c.dispose(); return r;
        })();
        b.dispose();
        return { hit, discColor: inst.disc[0] ? inst.disc[0].color : null,
          discScale: inst.disc[0] ? [inst.disc[0].m[0], inst.disc[0].m[5], inst.disc[0].m[10]] : null,
          discBasis: inst.disc[0] ? inst.disc[0].m.slice(0, 11) : null,
          streaks: inst.streak.length, tiltColor: tilt.disc[0] ? tilt.disc[0].color : null };
      };
      out.flatPieces = { MIRROR: grab('flat-mirror'), WEDGE: grab('flat-wedge'), DIP: grab('flat-dip'),
        commonFlat: new THREE.Color(M.contact.flatColor).toArray().map((v) => +v.toFixed(5)),
        accent: { MIRROR: new THREE.Color(T.pieceAccent.MIRROR).toArray().map((v) => +v.toFixed(5)),
          WEDGE: new THREE.Color(T.pieceAccent.WEDGE).toArray().map((v) => +v.toFixed(5)) } };
    }
    // ---- 5. blocked: the cap, and three sparks at m.failure.blockedAnglesDeg ----
    {
      const b = newBeam(), t = trace('blocked');
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      let peakStreaks = 0, peakDiscs = 0;
      for (let i = 0; i < 1000 && b.isAnimating(); i++) {
        b.frame(1 / 60, TILT, NORMAL);
        peakStreaks = Math.max(peakStreaks, b._debug().streaks);
        peakDiscs = Math.max(peakDiscs, b._debug().discs);
      }
      out.blocked = { end: t.result.end, peakStreaks, peakDiscs, dbg: b._debug(),
        angles: M.failure.blockedAnglesDeg.length };
      out.blocked.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 6. target arrival: two staggered rings of CONSTANT stroke, eight streaks ----
    {
      const b = newBeam(), t = trace('target');
      let lit = 0; b.onLit(() => { lit++; });
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      let peakStreaks = 0, peakEffects = 0, rings = [];
      for (let i = 0; i < 1000 && b.isAnimating(); i++) {
        b.frame(1 / 60, TILT, NORMAL);
        const d = b._debug();
        peakStreaks = Math.max(peakStreaks, d.streaks);
        peakEffects = Math.max(peakEffects, d.effects);
        const fxg = b.group.getObjectByName('beamFx');
        fxg.children.forEach((o) => {
          if (!o.material || !o.material.userData || o.material.userData.uInner === undefined) return;
          const dia = o.scale.x, inner = o.material.userData.uInner.value;
          if (dia > 0) rings.push({ dia: +dia.toFixed(5), stroke: +(dia / 2 * (1 - inner / 0.5)).toFixed(5), op: +o.material.opacity.toFixed(5) });
        });
      }
      const strokes = rings.map((r) => r.stroke);
      out.target = { lit, hits: t.result.hits.length, peakStreaks, peakEffects,
        strokeMin: Math.min.apply(null, strokes), strokeMax: Math.max.apply(null, strokes),
        want: M.target.ringStrokeCells, diaMin: Math.min.apply(null, rings.map((r) => r.dia)),
        diaMax: Math.max.apply(null, rings.map((r) => r.dia)), opMax: Math.max.apply(null, rings.map((r) => r.op)) };
      out.target.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 7. skip: the presentation completes at once and STOPS ----
    {
      const b = newBeam(), t = trace('target');
      let lit = 0; b.onLit(() => { lit++; });
      b.setChargeMs(M.fire.chargeMs);
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      for (let i = 0; i < 12; i++) b.frame(1 / 60, TILT, NORMAL);
      const mid = b._debug();
      b.skip();
      const afterSkip = { dbg: b._debug(), animating: b.isAnimating(), progress: b.getProgress(), lit };
      b.frame(1 / 60, TILT, NORMAL);
      out.skip = { mid, afterSkip, settled: b._debug(), animatingAfterFrame: b.isAnimating() };
      out.skip.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 8. reduced motion: no pulses, no scatter, a held contact disc, and it still stops ----
    {
      const b = newBeam(), t = trace('floor-bounce');
      b.setChargeMs(M.fire.chargeMs);
      b.set(t.result, { animate: true, fired: true, level: t.level }, REDUCED);
      let maxGain = 0, maxStreaks = 0, maxDiscs = 0;
      for (let i = 0; i < 2000 && b.isAnimating(); i++) {
        b.frame(1 / 60, TILT, REDUCED);
        const d = b._debug();
        maxGain = Math.max(maxGain, d.gain); maxStreaks = Math.max(maxStreaks, d.streaks); maxDiscs = Math.max(maxDiscs, d.discs);
      }
      out.reduced = { maxGain, maxStreaks, maxDiscs, dbg: b._debug(),
        chargeMs: b._debug().chargeMs, wantCharge: M.reduced.chargeMs };
      out.reduced.stop = runToStop(b, TILT, REDUCED);
      out.reduced.settled = instances(b);
      b.dispose();
    }
    // ---- 9. a live retrace (not fired) omits charging, pulses, scatter and rings ----
    {
      const b = newBeam(), t = trace('target');
      b.setChargeMs(M.fire.chargeMs);
      b.set(t.result, { animate: false, fired: false, level: t.level }, NORMAL);
      let maxGain = 0, maxSprites = 0;
      for (let i = 0; i < 2000 && b.isAnimating(); i++) {
        b.frame(1 / 60, TILT, NORMAL);
        maxGain = Math.max(maxGain, b._debug().gain); maxSprites = Math.max(maxSprites, b._debug().sprites);
      }
      out.retrace = { maxGain, maxSprites, dbg: b._debug(), badges: b._debug().badges };
      out.retrace.stop = runToStop(b, TILT, NORMAL);
      b.dispose();
    }
    // ---- 10. the flat-view information boundary: the SAME route over DIFFERENT hidden terrain ----
    // Nothing in section 1 or 2 may read terrain height. Two boards whose traced routes are identical but whose
    // hidden columns differ must therefore produce a byte-identical presentation, frame for frame.
    {
      const snap = (name) => {
        const b2 = newBeam(), t = trace(name);
        b2.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
        const film = [];
        for (let i = 0; i < 200 && b2.isAnimating(); i++) {
          b2.frame(1 / 60, FLAT, NORMAL);
          if (i % 3 === 0) film.push([b2._debug(), instances(b2), peakPairs(peaks(b2))]);
        }
        b2.dispose();
        return { end: t.result.end, route: t.result.segments.map((x) => [x.from.x, x.from.y, x.from.z, x.d, x.v]),
          film: JSON.stringify(film) };
      };
      const flatA = snap('height-a'), flatB = snap('height-b');
      out.heightBlind = { sameRoute: JSON.stringify(flatA.route) === JSON.stringify(flatB.route),
        sameFilm: flatA.film === flatB.film, frames: JSON.parse(flatA.film).length, ends: [flatA.end, flatB.end] };
    }
    // ---- 11. the sprite pool never exceeds m.budget.transientSpritesMax ----
    {
      const b = newBeam(), t = trace('climb-mirror-dip');
      b.set(t.result, { animate: true, fired: true, level: t.level }, NORMAL);
      let maxLive = 0;
      for (let i = 0; i < 2000 && b.isAnimating(); i++) { b.frame(1 / 60, TILT, NORMAL); maxLive = Math.max(maxLive, b._debug().sprites); }
      out.pool = { maxLive, cap: M.budget.transientSpritesMax };
      b.dispose();
    }
    return out;
  }, BEAM_SCENES);

  {
    const c = beamMotion.cmd, P = { level: 0.50, climb: 0.78, descend: 0.22 };
    check(c.level.n > 0 && c.level.lo === P.level && c.level.hi === P.level,
      `pulse rhythm: the LEVEL opening run carries peakAt ${c.level.lo} (${c.level.n} vertices)`);
    check(c.climb1.n > 0 && c.climb1.lo === P.climb && c.climb1.hi === P.climb,
      `a WEDGE makes the beam CLIMB and the rhythm becomes ${c.climb1.lo} (gathers late, releases forward)`);
    check(c.climb2.n > 0 && c.climb2.lo === P.climb && c.climb2.hi === P.climb,
      `a MIRROR turns that climbing beam and PRESERVES the climbing rhythm (${c.climb2.lo}, not ${P.level})`);
    check(c.levelled.n > 0 && c.levelled.lo === P.level && c.levelled.hi === P.level,
      `a DIP levels it and only THEN does the rhythm return to ${c.levelled.lo}`);
  }
  {
    const f = beamMotion.floor, P = { level: 0.50, climb: 0.78, descend: 0.22 };
    check(f.descend.n > 0 && f.descend.lo === P.descend && f.descend.hi === P.descend,
      `a DIP sends the beam DOWN and the rhythm becomes ${f.descend.lo} (arrives sharply, drains slowly)`);
    check(f.climb.n > 0 && f.climb.lo === P.climb && f.climb.hi === P.climb,
      `a FLOOR plate switches that descent to ASCENT and the rhythm becomes ${f.climb.lo}`);
    check(f.bounces === 1 && f.settled.disc.length === 1 && Math.abs(f.settled.disc[0].alpha - 0.65) < 1e-4,
      `the FLOOR bounce leaves exactly one stationary dot at opacity ${f.settled.disc[0] && f.settled.disc[0].alpha} for the life of the trace`);
  }
  {
    const f = beamMotion.fire;
    check(f.midCharge && f.midCharge.d.head === 0 && f.midCharge.playing,
      `FIRE + ${f.chargeMs} ms: the head does not move during the charge (head ${f.midCharge && f.midCharge.d.head}) but the beam still counts as playing`);
    check(f.midCharge && f.midCharge.charge.active && f.midCharge.charge.intensity > 0 && f.midCharge.charge.intensity < 1,
      `the emitter charge ramps through it (intensity ${f.midCharge && f.midCharge.charge.intensity.toFixed(3)}, halo ${f.midCharge && f.midCharge.charge.halo.toFixed(3)})`);
    check(f.chargeEnd && f.chargeEnd.head >= 0 && f.chargeEnd.d.clock >= f.chargeMs,
      `the head is released at T0 + ${f.chargeMs} ms (clock ${f.chargeEnd && f.chargeEnd.d.clock.toFixed(1)} ms)`);
    check(f.linear >= 0 && f.linear < 1e-9, `travel is exactly LINEAR in the clock (worst deviation ${f.linear.toExponential(2)} cells)`);
    check(beamMotion.fireBeforeEnd.gain === 1,
      `the pulse gain is exactly 1 for the whole of the travel (${beamMotion.fireBeforeEnd.gain} at ` +
      `${beamMotion.fireBeforeEnd.clock.toFixed(0)} of ${beamMotion.fireBeforeEnd.routeEndMs.toFixed(0)} ms)`);
    check(f.midSettle.gain > 0 && f.midSettle.gain < 1,
      `then it eases to zero over m.beam.settleMs (mid-settle ${f.midSettle.gain.toFixed(4)})`);
    check(f.stop.after.gain === 0 && f.stop.after.head === f.stop.after.total,
      `and lands on EXACTLY zero with the whole route drawn (gain ${f.stop.after.gain}, head ${f.stop.after.head.toFixed(3)}/${f.stop.after.total.toFixed(3)})`);
  }
  {
    const p = beamMotion.flatPieces, same = (a, b2) => JSON.stringify(a) === JSON.stringify(b2);
    check(p.MIRROR.hit === 1 && p.WEDGE.hit === 1 && p.DIP.hit === 1, `flat boundary: each of the three pieces produces exactly one acting-piece hit`);
    check(same(p.MIRROR.discColor, p.WEDGE.discColor) && same(p.WEDGE.discColor, p.DIP.discColor) && same(p.MIRROR.discColor, p.commonFlat),
      `in FLAT all three contact discs are the SAME common colour ${JSON.stringify(p.MIRROR.discColor)} (palette.commonFlatPiece)`);
    check(same(p.MIRROR.discBasis, p.WEDGE.discBasis) && same(p.WEDGE.discBasis, p.DIP.discBasis),
      `in FLAT all three sit in the same common presentation plane at the same scale (identical basis + board position)`);
    check(p.MIRROR.streaks === p.WEDGE.streaks && p.WEDGE.streaks === p.DIP.streaks && p.MIRROR.streaks === 2,
      `and each emits the same ${p.MIRROR.streaks} scatter streaks - nothing about the decoration says which piece it was`);
    check(!same(p.MIRROR.tiltColor, p.WEDGE.tiltColor) && same(p.MIRROR.tiltColor, p.accent.MIRROR) && same(p.WEDGE.tiltColor, p.accent.WEDGE),
      `in TILT the same hit uses pieceAccent[type] instead (MIRROR ${JSON.stringify(p.MIRROR.tiltColor)} vs WEDGE ${JSON.stringify(p.WEDGE.tiltColor)})`);
  }
  {
    const b2 = beamMotion.blocked;
    check(b2.end === 'blocked' && b2.peakStreaks === b2.angles,
      `blocked: exactly ${b2.peakStreaks} recoil sparks at m.failure.blockedAnglesDeg, and the solid cap stays`);
  }
  {
    const t = beamMotion.target;
    check(t.hits === 1 && t.lit === 1, `target arrival is driven by the trace's own target event (lit ${t.lit} of ${t.hits})`);
    check(t.peakStreaks === 8, `it emits the existing ${t.peakStreaks} streaks at equal angular intervals`);
    check(Math.abs(t.strokeMin - t.want) < 2e-4 && Math.abs(t.strokeMax - t.want) < 2e-4,
      `both rings keep a CONSTANT ${t.want}-cell stroke while their diameter grows ${t.diaMin.toFixed(3)} -> ${t.diaMax.toFixed(3)} cell (measured ${t.strokeMin.toFixed(4)}..${t.strokeMax.toFixed(4)})`);
    check(Math.abs(t.opMax - 0.32) < 1e-4, `ring opacity starts at m.target.ringOpacity ${t.opMax}`);
  }
  {
    const s = beamMotion.skip;
    check(s.mid.head < s.mid.total && s.mid.clock < s.mid.routeEndMs,
      `skip: taken mid-flight at ${s.mid.head.toFixed(2)} of ${s.mid.total.toFixed(2)} cells`);
    check(!s.afterSkip.animating && Math.abs(s.afterSkip.progress.cells - s.afterSkip.progress.total) < 1e-9 && !s.afterSkip.progress.playing,
      `it completes the presentation IMMEDIATELY: ${s.afterSkip.progress.cells.toFixed(2)}/${s.afterSkip.progress.total.toFixed(2)} cells, playing false, isAnimating false`);
    check(s.afterSkip.lit === 1, `the target still lights - discovery and target state are never dropped by a skip`);
    check(s.afterSkip.dbg.streaks === 0 && s.afterSkip.dbg.gain === 0,
      `and no queued scatter or rings are replayed (${s.afterSkip.dbg.streaks} streaks, gain ${s.afterSkip.dbg.gain})`);
  }
  {
    const r = beamMotion.reduced;
    check(r.maxGain === 0, `reduced motion: no travelling pulse and no leading brightness at all (max gain ${r.maxGain})`);
    check(r.maxStreaks === 0, `no scatter (${r.maxStreaks} streaks ever created)`);
    check(r.chargeMs === r.wantCharge, `the charge collapses to m.reduced.chargeMs ${r.chargeMs} ms, unscaled`);
    check(r.settled.disc.length === 1 && Math.abs(r.settled.disc[0].alpha - 0.65) < 1e-4,
      `and the FLOOR dot, altitude widths, badges and the complete route are kept (${r.settled.disc.length} dot at ${r.settled.disc[0].alpha})`);
  }
  {
    const r = beamMotion.retrace;
    check(r.maxGain === 0 && r.maxSprites === 0 && r.dbg.chargeMs === 0,
      `live retrace after an edit: no emitter charge, no pulse train, no scatter and no rings (gain ${r.maxGain}, sprites ${r.maxSprites}, charge ${r.dbg.chargeMs} ms)`);
  }
  {
    const hb = beamMotion.heightBlind;
    check(hb.sameRoute && hb.sameFilm,
      `FLAT information boundary: two boards whose hidden columns differ by 3 levels but whose traced route is ` +
      `identical produce a byte-identical beam presentation over ${hb.frames} sampled frames - no timing, ` +
      `amplitude, colour, scale, delay or shape here is derived from terrain height`);
  }
  check(beamMotion.pool.maxLive <= beamMotion.pool.cap,
    `the transient sprite pool never exceeds m.budget.transientSpritesMax (peak ${beamMotion.pool.maxLive} of ${beamMotion.pool.cap})`);

  // ---- THE STOP. Every scene above ran to a halt; none of them moved again over 300 further frames. ----
  for (const key of ['cmd', 'floor', 'fire', 'blocked', 'target', 'skip', 'reduced', 'retrace']) {
    const s = beamMotion[key].stop;
    check(!s.animating && s.stable && s.dbg.clock === s.dbg.animEndMs,
      `STOP/${key}: isAnimating() false after ${s.frames} frames, clock landed EXACTLY on animEndMs ` +
      `(${s.dbg.clock.toFixed(1)} ms), and 300 further frames changed nothing (${s.stable})`);
  }

  // ---- the modulation on the SCREEN: the pulse brightens the beam, and its trough is the settled baseline ----
  // MOTION-DIRECTION 1: "the darkest pulse trough is the current baseline beam, so motion cannot temporarily
  // disguise altitude". Measured as real framebuffer luminance over an 11x11 block on the beam.
  const beamPixels = await page.evaluate(async () => {
    const h = window.__h, r = h.render, S = window.LaserSim;
    const raw = { name: 'STRAIGHT', par: 1, size: { w: 8, d: 8 },
      terrain: ['00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000', '00000000'],
      emitter: { x: 0, y: 4, dir: 'E' }, targets: [{ x: 7, y: 0 }], fixed: [], tray: ['MIRROR'] };
    const level = S.parseLevel(raw), res = S.trace(level, []);
    r.setLevel(level); r.setPlaced([]); r.setBeam(null);
    h.fit(); await r.setCameraPreset('flat', { animate: false }); h.settle(900);
    const gl = r._renderer.getContext(), dpr = r._renderer.getPixelRatio();
    const rect = r._renderer.domElement.getBoundingClientRect(), N = 11, buf = new Uint8Array(N * N * 4);
    const cell = { x: 3, y: 4 };
    function lum() {
      const p = r.projectCell(cell, 0);
      const x = Math.round((p.x - rect.left) * dpr), y = Math.round(gl.drawingBufferHeight - (p.y - rect.top) * dpr);
      gl.finish();
      gl.readPixels(x - 5, y - 5, N, N, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      let sum = 0;
      for (let i = 0; i < N * N; i++) sum += buf[i * 4] + buf[i * 4 + 1] + buf[i * 4 + 2];
      return sum;
    }
    r.setBeam(res, { animate: false, fired: false }); h.settle(1200); r.frame(0.016);
    const baseline = lum();
    r.setBeam(res, { animate: true, fired: true });
    const series = [];
    for (let i = 0; i < 400; i++) {
      r.frame(1 / 60);
      if (r.getBeamProgress().cells > 3.4 && r.getBeamProgress().playing) series.push(lum());
      if (!r.needsFrame()) break;
    }
    r.frame(0.016);
    const settled = lum();
    return { baseline, settled, n: series.length,
      min: series.length ? Math.min.apply(null, series) : -1, max: series.length ? Math.max.apply(null, series) : -1 };
  });
  check(beamPixels.n > 20 && beamPixels.max > beamPixels.baseline,
    `the pulse train really reaches the framebuffer: over ${beamPixels.n} sampled frames the beam's luminance ` +
    `peaks at ${beamPixels.max} against a settled baseline of ${beamPixels.baseline} (+${beamPixels.max - beamPixels.baseline})`);
  check(beamPixels.min >= beamPixels.baseline,
    `and its darkest trough is ${beamPixels.min}, never below that baseline - motion can never temporarily disguise altitude`);
  check(Math.abs(beamPixels.settled - beamPixels.baseline) <= 3,
    `when the modulation has faded the beam is back on its exact baseline (${beamPixels.settled} vs ${beamPixels.baseline})`);

  // ---- draw calls: all the new decoration together, measured on the real renderer by toggling it off ----
  // MOTION-DIRECTION 10 allows at most m.budget.newDrawCallsMax = 4 WebGL draw calls for ALL new contact,
  // scatter, ring and footprint effects combined. The measurement hides exactly the new objects (the two
  // instanced sprite meshes, and the target's band-shader rings) in the SAME frame and diffs renderer.info.
  const beamCalls = await page.evaluate(async (scene) => {
    const h = window.__h, r = h.render, M = window.LaserTheme.motion, S = window.LaserSim;
    // a board whose one shot does everything at once: an acting MIRROR hit, then the target arrival
    const level = S.parseLevel(scene.raw), res = S.trace(level, scene.placed);
    r.setLevel(level); r.setPlaced(scene.placed); r.setBeam(null);
    h.fit(); await r.setCameraPreset('tilt', { animate: false }); h.settle(900);
    let sp = null; r._scene.traverse((o) => { if (o.name === 'beamSprites') sp = o; });
    let fxg = null; r._scene.traverse((o) => { if (o.name === 'beamFx') fxg = o; });
    const isNewRing = (o) => !!(o.material && o.material.userData && o.material.userData.uInner !== undefined);
    r.setBeam(res, { animate: true, fired: true });
    let best = null;
    for (let i = 0; i < 600; i++) {
      r.frame(1 / 60);
      const sprites = sp.children.reduce((a, m) => a + m.count, 0);
      const rings = fxg.children.filter(isNewRing).length;
      if (sprites <= 0 && rings <= 0) continue;
      const withAll = r._renderer.info.render.calls;
      // material.visible, not object.visible: frame() recomputes each effect's object visibility every call
      const hidden = fxg.children.filter(isNewRing);
      sp.visible = false; hidden.forEach((o) => { o.material.visible = false; });
      r.frame(0);
      const without = r._renderer.info.render.calls;
      sp.visible = true; hidden.forEach((o) => { o.material.visible = true; });
      r.frame(0);
      const cost = r._renderer.info.render.calls - without;
      if (!best || cost > best.cost) best = { sprites, rings, withAll, without, cost };
    }
    h.settle(1500); r.frame(0.016);
    return { best, hits: res.hits.length, pieces: res.pieceHits.length,
      after: r._renderer.info.render.calls, budget: M.budget.newDrawCallsMax, needs: r.needsFrame() };
  }, BEAM_SCENES.target);
  check(!!beamCalls.best && beamCalls.best.sprites > 0 && beamCalls.best.cost <= beamCalls.budget,
    `every new contact disc, scatter streak, spark, bounce dot and target ring on screen at once ` +
    `(${beamCalls.best && beamCalls.best.sprites} sprites + ${beamCalls.best && beamCalls.best.rings} rings) costs ` +
    `${beamCalls.best && beamCalls.best.cost} draw calls, within m.budget.newDrawCallsMax ${beamCalls.budget}`);
  check(!beamCalls.needs, `and when it is over the renderer stops asking for frames (needsFrame ${beamCalls.needs})`);

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
