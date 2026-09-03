// Lasers 3D - DOM/layout test for src/ui.js + index.html markup, in Playwright WebKit.
// Run: node test/ui.dom.test.mjs   (starts its own static server on a free port)
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { webkit } = require('/Users/jamesalford/.npm-global/lib/node_modules/playwright');
import { existsSync, readdirSync } from 'node:fs';
// The global Playwright may want a WebKit revision that is not downloaded; fall back to any installed webkit-* build.
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

const VIEWPORTS = [
  { name: 'iphone', width: 393, height: 852, mobile: true },
  { name: 'ipad', width: 820, height: 1180, mobile: true },
  { name: 'landscape', width: 844, height: 390, mobile: true },
  { name: 'se320', width: 320, height: 568, mobile: true },
];

function freePort() { return new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }
async function startServer() {
  const port = await freePort();
  const proc = spawn(process.execPath, [resolve(here, '../tools/serve.mjs'), String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => proc.stdout.on('data', () => res()));
  return { port, proc };
}

let failures = 0, checks = 0;
function assert(cond, msg) { checks++; if (!cond) { failures++; console.log('  FAIL ' + msg); } else console.log('  ok   ' + msg); }

// Every button/link that is currently rendered must be >= 44 px in both dimensions.
const measureButtons = () => Array.from(document.querySelectorAll('button, a.menu-link, .level-tile, .tray-card'))
  .filter((b) => b.offsetParent !== null || getComputedStyle(b).position === 'fixed')
  .map((b) => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, w: r.width, h: r.height }; })
  .filter((b) => b.w < 44 || b.h < 44);

const menuHit = () => {
  const a = document.querySelector('a.menu-link'); const r = a.getBoundingClientRect();
  const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { hit: e === a, at: [r.left + r.width / 2, r.top + r.height / 2], got: e ? (e.id || e.className || e.tagName) : null, z: getComputedStyle(a).zIndex };
};

const overflow = () => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth });

const trayVisible = () => {
  const t = document.getElementById('tray'); const r = t.getBoundingClientRect();
  const cards = Array.from(t.querySelectorAll('.tray-card')).map((c) => c.getBoundingClientRect());
  const fire = document.getElementById('btn-fire').getBoundingClientRect();
  const inside = (b) => b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight + 0.5 && b.right <= innerWidth + 0.5 && b.width > 0;
  return { tray: inside(r), cards: cards.every(inside), fire: inside(fire), rect: [r.left, r.top, r.width, r.height], scrollY: window.scrollY };
};

const maxZ = () => Math.max(...Array.from(document.querySelectorAll('body *:not(a.menu-link)')).map((e) => parseInt(getComputedStyle(e).zIndex, 10) || 0));

// The harness must carry index.html's exact stylesheet and shell markup, or its layout checks measure a different page.
function harnessParity() {
  const idx = readFileSync(resolve(here, '../index.html'), 'utf8'), h = readFileSync(resolve(here, '../tools/ui-harness.html'), 'utf8');
  const style = (s) => (s.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  const shell = (s) => (s.match(/<body>[\s\S]*?<script/) || [''])[0];
  return { style: style(idx).length > 1000 && style(idx) === style(h), shell: shell(idx).length > 500 && shell(idx) === shell(h) };
}

async function run() {
  const { port, proc } = await startServer();
  const browser = await webkit.launch(webkitLaunchOptions());
  try {
    const parity = harnessParity();
    console.log('\n== harness parity');
    assert(parity.style, 'tools/ui-harness.html <style> is byte-identical to index.html');
    assert(parity.shell, 'tools/ui-harness.html shell markup (Menu link, #app, modals) is byte-identical to index.html');
    for (const vp of VIEWPORTS) {
      console.log(`\n== ${vp.name} ${vp.width}x${vp.height}`);
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: true, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      await page.goto(`http://127.0.0.1:${port}/games/lasers-3d/tools/ui-harness.html`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__harness && window.__harness.ui);
      await page.waitForTimeout(150);

      assert(await page.evaluate(() => document.body.firstElementChild.matches('a.menu-link[href="../../"]')), 'Menu link is the first element in body');
      const z = await page.evaluate(maxZ); assert(z < 9999, `no non-menu element has z-index >= 9999 (max ${z})`);
      const ov0 = await page.evaluate(overflow); assert(ov0.sw <= ov0.cw && ov0.bw <= ov0.cw, `no horizontal overflow (scrollWidth ${ov0.sw} <= clientWidth ${ov0.cw}, body ${ov0.bw})`);
      const tv = await page.evaluate(trayVisible); assert(tv.tray && tv.cards && tv.fire && tv.scrollY === 0, `tray visible without scrolling ${JSON.stringify(tv)}`);
      const ta = await page.evaluate(() => { const a = document.querySelector('.tray-actions'); const f = document.getElementById('btn-fire').getBoundingClientRect(); return { overflow: a.scrollWidth > a.clientWidth + 1, scrollLeft: a.scrollLeft, fireLeft: f.left, fireRight: f.right }; });
      assert(ta.fireLeft >= 0 && ta.fireRight <= vp.width + 0.5 && ta.scrollLeft === 0, `FIRE is fully on screen at rest (overflowing row ${ta.overflow}) ${JSON.stringify(ta)}`);
      // The readout row collapses while there is no fire result, which is the state the board is framed in for the
      // whole placing phase. Measure the stage there, and separately bound what a visible readout costs.
      const stageBox = await page.evaluate(() => {
        const rect = () => { const s = document.getElementById('stage').getBoundingClientRect(); return { top: s.top, height: s.height, width: s.width }; };
        const withReadout = rect();
        const saved = window.__harness.vm.readout;
        window.__harness.setState({ readout: null });
        const idle = rect();
        window.__harness.setState({ readout: saved });
        const h = document.getElementById('hud').getBoundingClientRect();
        return { top: idle.top, height: idle.height, width: idle.width, withReadout: withReadout.height, hudBottom: h.bottom, hudH: h.height };
      });
      assert(stageBox.top >= stageBox.hudBottom - 0.5, `stage starts below the HUD (stage top ${stageBox.top.toFixed(1)} >= HUD bottom ${stageBox.hudBottom.toFixed(1)})`);
      assert(stageBox.height - stageBox.withReadout <= 48, `a visible readout costs the stage at most 48 px, i.e. two compact lines (${(stageBox.height - stageBox.withReadout).toFixed(1)} px)`);
      if (vp.width <= 320) assert(stageBox.height >= 320 && stageBox.width >= 320, `320 px phone: stage is at least 320x320 for the 34 px cell floor (${stageBox.width}x${stageBox.height.toFixed(1)}, HUD ${stageBox.hudH.toFixed(1)})`);
      const small0 = await page.evaluate(measureButtons); assert(small0.length === 0, 'all rendered buttons >= 44x44 (base) ' + JSON.stringify(small0));
      const hud = await page.evaluate(() => { const h = document.getElementById('hud').getBoundingClientRect(); const m = document.querySelector('a.menu-link').getBoundingClientRect(); const s = document.getElementById('sound').getBoundingClientRect(); return { hudLeft: h.left, menuRight: m.right, hudRight: h.right, soundLeft: s.left, hudH: h.height }; });
      assert(hud.hudLeft >= hud.menuRight - 0.5 && hud.hudRight <= hud.soundLeft + 0.5, `HUD does not overlap Menu/sound ${JSON.stringify(hud)}`);
      const lay = await page.evaluate(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(); const h = r('hud'), t = r('tray'), s = r('sound'), o = r('toast'); const sep = (a, b) => a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5; return { hudTray: sep(h, t), soundTray: sep(s, t), toastHud: sep(o, h), toastTray: sep(o, t), nameClipped: (() => { const n = document.getElementById('hud-level-name'); return n.scrollWidth > n.clientWidth + 1; })(), piecesClipped: (() => { const p = r('hud-pieces'), hs = getComputedStyle(document.getElementById('hud')); return p.right > h.right - parseFloat(hs.paddingRight) + 0.5 || p.bottom > h.bottom - parseFloat(hs.paddingBottom) + 0.5; })() }; });
      assert(lay.hudTray && lay.soundTray && lay.toastHud && lay.toastTray, `HUD/sound/toast/tray do not overlap ${JSON.stringify(lay)}`);
      assert(!lay.nameClipped && !lay.piecesClipped, `level name and PIECES line are not clipped ${JSON.stringify(lay)}`);

      // ---- A6: the HUD panel is CENTRED in its row, not pushed right by the wider Menu link ----
      const centred = await page.evaluate(() => {
        const app = document.getElementById('app').getBoundingClientRect();
        const hud = document.getElementById('hud').getBoundingClientRect();
        const menu = document.querySelector('a.menu-link').getBoundingClientRect();
        const sound = document.getElementById('sound').getBoundingClientRect();
        const tray = document.getElementById('tray').getBoundingClientRect();
        // the HUD's row is the app box minus the side panel (when the tray is docked to the right)
        const rowLeft = app.left, rowRight = tray.left < app.right - 1 && tray.top < hud.bottom ? tray.left : app.right;
        return { off: Math.abs((hud.left + hud.right) / 2 - (rowLeft + rowRight) / 2),
          clearsMenu: hud.left >= menu.right - 0.5, clearsSound: hud.right <= sound.left + 0.5,
          hud: [hud.left, hud.right], row: [rowLeft, rowRight] };
      });
      assert(centred.off <= 1.5, `HUD is centred in its row (off by ${centred.off.toFixed(2)} px) ${JSON.stringify(centred)}`);
      assert(centred.clearsMenu && centred.clearsSound, `centred HUD still clears the Menu link and the sound button ${JSON.stringify(centred)}`);

      // ---- S5/S10: the post-FIRE readout ----
      const ro = await page.evaluate(() => {
        const r = (id) => document.getElementById(id).getBoundingClientRect();
        const box = document.getElementById('readout'), b = box.getBoundingClientRect();
        const stage = r('stage'), hud = r('hud'), tray = r('tray'), menu = document.querySelector('a.menu-link').getBoundingClientRect();
        const overlaps = (a, c) => !(a.right <= c.left + 0.5 || c.right <= a.left + 0.5 || a.bottom <= c.top + 0.5 || c.bottom <= a.top + 0.5);
        const mid = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
        return { shown: !box.hidden && b.height > 0, msg: box.querySelector('.readout-msg').textContent,
          chips: Array.from(box.querySelectorAll('.chip')).map((c) => c.textContent.replace(/\s+/g, ' ').trim()),
          overStage: overlaps(b, stage), overHud: overlaps(b, hud), overTray: overlaps(b, tray), overMenu: overlaps(b, menu),
          insideViewport: b.left >= -0.5 && b.right <= innerWidth + 0.5 && b.top >= -0.5 && b.bottom <= innerHeight + 0.5,
          height: b.height, hit: mid ? (mid.id || mid.className) : null };
      });
      assert(ro.shown && /flew over the target/.test(ro.msg), `readout shows the end reason in kid language: "${ro.msg}"`);
      // DESIGN.md 12: nothing flattens a beam by itself, so a shot that ends still pitched has to say so, in words.
      assert(/still going up/i.test(ro.msg), `readout says the beam was still climbing when it ended: "${ro.msg}"`);
      const roPitch = await page.evaluate(() => {
        const box = document.getElementById('readout'), msg = () => box.querySelector('.readout-msg').textContent;
        const out = {};
        window.__harness.setState({ readout: { kind: 'danger', end: 'blocked', message: 'The beam hit a wall.', pitch: -1, altitude: null, progress: null } });
        out.down = msg();
        window.__harness.setState({ readout: { kind: 'danger', end: 'lost-sky', message: 'The beam went too high.', pitch: 1, altitude: null, progress: null } });
        out.sky = msg();
        // a flyover REPLACES the end reason on screen, so "went too high" is no longer said and the note is due
        window.__harness.setState({ readout: { kind: 'danger', end: 'lost-sky', message: 'The beam flew over the target.', pitch: 1, altitude: { beamZ: 3, targetZ: 0, above: true }, progress: null } });
        out.flyover = msg();
        window.__harness.setState({ readout: { kind: 'success', end: 'target', message: 'Beam connected!', pitch: 1, altitude: null, progress: null } });
        out.win = msg();
        window.__harness.setState({ readout: { kind: 'danger', end: 'blocked', message: 'The beam hit a wall.', pitch: 0, altitude: null, progress: null } });
        out.flat = msg();
        return out;
      });
      assert(/still going down/i.test(roPitch.down), `a descending beam is reported in words too: "${roPitch.down}"`);
      assert(roPitch.sky === 'The beam went too high.' && roPitch.win === 'Beam connected!' && roPitch.flat === 'The beam hit a wall.',
        `the climb sentence is skipped when it is obvious, on a win, and on a flat beam ${JSON.stringify(roPitch)}`);
      assert(/still going up/i.test(roPitch.flyover),
        `a flyover hides the end reason, so the climb is still worth saying: "${roPitch.flyover}"`);
      await page.evaluate(() => window.__harness.setState({ readout: { kind: 'danger', end: 'over', message: 'The beam flew over the target.', pitch: 1, altitude: { beamZ: 2, targetZ: 1, above: true }, progress: { lit: 0, total: 1 } } }));
      assert(ro.chips.join('|').indexOf('^2') >= 0 && ro.chips.join('|').indexOf('^1') >= 0,
        `readout names both altitudes as NUMBERS, not colours ${JSON.stringify(ro.chips)}`);
      assert(!ro.overStage && !ro.overHud && !ro.overTray && !ro.overMenu && ro.insideViewport,
        `readout covers neither the board nor the HUD, tray or Menu link ${JSON.stringify(ro)}`);
      // multi-target progress
      const roProg = await page.evaluate(() => {
        window.__harness.setState({ readout: { kind: 'danger', message: 'The beam hit a wall.', altitude: null, progress: { lit: 1, total: 2 } } });
        const box = document.getElementById('readout');
        return { msg: box.querySelector('.readout-msg').textContent, chips: Array.from(box.querySelectorAll('.chip')).map((c) => c.textContent.trim()) };
      });
      assert(roProg.msg === 'The beam hit a wall.' && roProg.chips.some((c) => /1 of 2 lit/.test(c)),
        `readout shows multi-target progress ${JSON.stringify(roProg)}`);
      assert(await page.evaluate(() => { window.__harness.setState({ readout: null }); return document.getElementById('readout').hidden; }),
        'readout hides again when there is no fire result');
      await page.evaluate(() => window.__harness.setState({ readout: { kind: 'danger', message: 'The beam flew over the target.', altitude: { beamZ: 2, targetZ: 1, above: true }, progress: null } }));
      const stage = await page.evaluate(() => { const s = document.getElementById('stage').getBoundingClientRect(); const b = document.getElementById('board').getBoundingClientRect(); return { sw: s.width, sh: s.height, bw: b.width, bh: b.height }; });
      assert(stage.bw <= stage.sw + 0.5 && stage.bh <= stage.sh + 0.5 && stage.bw > 100 && stage.bh > 100, `canvas fits the stage ${JSON.stringify(stage)}`);
      assert((await page.evaluate(() => document.getElementById('hud-pieces').textContent)) === 'PIECES 1/2', 'HUD pieces line reads PIECES 1/2');
      assert((await page.evaluate(() => document.querySelectorAll('#hud-stars .star[data-earned="true"]').length)) === 2, 'HUD shows 2 earned stars');
      assert(await page.evaluate(() => document.querySelector('#hud-stars .star:nth-child(3)').getAttribute('data-blind') === 'true'), 'third star carries data-blind');
      // ---- S3: each star is drawn from its OWN criterion. The harness state is solved + blind, par forfeited,
      // so stars ONE and THREE must be lit; an ordinal count would have lit one and two. ----
      const perStar = await page.evaluate(() => Array.from(document.querySelectorAll('#hud-stars .star')).map((s) => s.getAttribute('data-earned')));
      assert(JSON.stringify(perStar) === '["true","false","true"]', `stars render per criterion (solve, par, blind) ${JSON.stringify(perStar)}`);
      const starLabel = await page.evaluate(() => document.getElementById('hud-stars').getAttribute('aria-label'));
      assert(/par not earned/.test(starLabel) && /no-tilt earned/.test(starLabel), `star aria-label names each criterion: "${starLabel}"`);
      const flipped = await page.evaluate(() => {
        window.__harness.setState({ stars: { solved: true, par: true, blind: false } });
        const out = Array.from(document.querySelectorAll('#hud-stars .star')).map((s) => s.getAttribute('data-earned'));
        window.__harness.setState({ stars: { solved: true, par: false, blind: true } });
        return out;
      });
      assert(JSON.stringify(flipped) === '["true","true","false"]', `a different criterion set lights different stars ${JSON.stringify(flipped)}`);
      // ---- A7: the sound control is a stroked SVG glyph, never an emoji ----
      const snd = await page.evaluate(() => {
        const b = document.getElementById('sound');
        const on = { svg: !!b.querySelector('svg.icon-sound'), text: b.textContent.trim(), stroke: b.querySelector('svg') && b.querySelector('svg').getAttribute('stroke'), fill: b.querySelector('svg') && b.querySelector('svg').getAttribute('fill'), width: b.querySelector('svg') && b.querySelector('svg').getAttribute('width'), label: b.getAttribute('aria-label'), paths: b.querySelectorAll('svg path').length };
        window.__harness.setState({ muted: true });
        const off = { svg: !!b.querySelector('svg.icon-sound'), label: b.getAttribute('aria-label'), d: Array.from(b.querySelectorAll('svg path')).map((p) => p.getAttribute('d')).join(' ') };
        window.__harness.setState({ muted: false });
        const back = { d: Array.from(b.querySelectorAll('svg path')).map((p) => p.getAttribute('d')).join(' ') };
        return { on, off, back };
      });
      assert(snd.on.svg && snd.on.text === '' && snd.on.stroke === 'currentColor' && snd.on.fill === 'none' && snd.on.width === '20',
        `sound button is a 20x20 stroked SVG with no emoji text ${JSON.stringify(snd.on)}`);
      assert(snd.off.svg && snd.off.label === 'Sound off' && snd.on.label === 'Sound on' && snd.off.d !== snd.back.d,
        `muted state swaps to a different glyph and updates the label ${JSON.stringify({ off: snd.off.label, on: snd.on.label })}`);
      assert(await page.evaluate(() => document.querySelector('.tray-card[data-type="DIP"]').disabled && document.querySelector('.tray-card[data-type="MIRROR"]').getAttribute('aria-pressed') === 'true'), 'tray: DIP disabled at 0, MIRROR selected');
      assert(await page.evaluate(() => document.getElementById('toast').classList.contains('is-visible')), 'intro toast visible');

      // ---- FIT button (DESIGN.md 11.2): present, hidden until the board is zoomed/panned, 44 px, next to TILT ----
      const fit0 = await page.evaluate(() => {
        const b = document.getElementById('btn-fit');
        return { exists: !!b, hidden: b.hidden, shown: b.offsetParent !== null, label: b.getAttribute('aria-label'),
          afterTilt: document.getElementById('btn-tilt').nextElementSibling === b };
      });
      assert(fit0.exists && fit0.label === 'Fit board to screen', `FIT button exists with its aria-label ${JSON.stringify(fit0)}`);
      assert(fit0.hidden && !fit0.shown, 'FIT is not rendered while canFit is false');
      assert(fit0.afterTilt, 'FIT sits next to TILT in the actions row');
      const fit1 = await page.evaluate(() => {
        window.__harness.setState({ canFit: true });
        const b = document.getElementById('btn-fit'), r = b.getBoundingClientRect();
        return { shown: b.offsetParent !== null, w: r.width, h: r.height, disabled: b.disabled };
      });
      assert(fit1.shown && !fit1.disabled, 'FIT appears when canFit is true');
      assert(fit1.w >= 44 && fit1.h >= 44, `FIT is at least 44x44 (${fit1.w.toFixed(1)}x${fit1.h.toFixed(1)})`);
      const smallF = await page.evaluate(measureButtons); assert(smallF.length === 0, 'all buttons still >= 44x44 with FIT shown ' + JSON.stringify(smallF));
      const ovF = await page.evaluate(overflow); assert(ovF.sw <= ovF.cw && ovF.bw <= ovF.cw, `no horizontal overflow with FIT shown (${ovF.sw} <= ${ovF.cw})`);
      const tvF = await page.evaluate(trayVisible); assert(tvF.tray && tvF.cards && tvF.fire, `tray still fits with FIT shown ${JSON.stringify(tvF)}`);
      await page.click('#btn-fit');
      assert(await page.evaluate(() => window.__harness.log.some((l) => l[0] === 'onFit')), 'FIT click emits onFit');
      // ---- the view button is a two-state toggle whose label names the DESTINATION ----
      const toggle = await page.evaluate(() => {
        const b = document.getElementById('btn-fit'), out = {};
        window.__harness.setState({ canFit: true, viewToggle: 'overview' });
        out.overview = { text: b.textContent.trim(), aria: b.getAttribute('aria-label'), shown: b.offsetParent !== null, r: b.getBoundingClientRect() };
        window.__harness.setState({ viewToggle: 'working' });
        out.working = { text: b.textContent.trim(), aria: b.getAttribute('aria-label'), r: b.getBoundingClientRect() };
        window.__harness.setState({ viewToggle: 'fit' });
        out.fit = { text: b.textContent.trim(), aria: b.getAttribute('aria-label') };
        window.__harness.setState({ viewToggle: null, canFit: true });
        out.fallback = { text: b.textContent.trim(), shown: b.offsetParent !== null };
        return out;
      });
      assert(toggle.overview.text === 'ALL' && /whole board/.test(toggle.overview.aria), `view button -> OVERVIEW reads "${toggle.overview.text}" / "${toggle.overview.aria}"`);
      assert(toggle.working.text === 'ZOOM' && /Zoom in/.test(toggle.working.aria), `view button -> WORKING reads "${toggle.working.text}" / "${toggle.working.aria}"`);
      assert(toggle.fit.text === 'FIT' && toggle.fit.aria === 'Fit board to screen', `with no distinct overview it degrades to FIT ("${toggle.fit.text}")`);
      assert(toggle.overview.r.width >= 44 && toggle.overview.r.height >= 44 && toggle.working.r.width >= 44 && toggle.working.r.height >= 44,
        `every toggle label keeps a 44 px hit target (${toggle.overview.r.width.toFixed(0)}x${toggle.overview.r.height.toFixed(0)}, ${toggle.working.r.width.toFixed(0)}x${toggle.working.r.height.toFixed(0)})`);
      const smallT = await page.evaluate(measureButtons); assert(smallT.length === 0, 'all buttons still >= 44x44 with the view toggle labelled ' + JSON.stringify(smallT));
      assert(await page.evaluate(() => { window.__harness.setState({ canFit: false, viewToggle: null }); return document.getElementById('btn-fit').offsetParent === null; }), 'the view button hides when there is nothing to toggle to');

      await page.screenshot({ path: `${SHOTS}/ui-${vp.name}.png` });

      // Overlays: piece controls, MORE sheet (if docked), help, levels, victory. Menu link must win elementFromPoint each time.
      await page.evaluate(() => { const s = document.getElementById('stage').getBoundingClientRect(); window.__harness.ui.showPieceControls({ screenX: s.left + s.width / 2, screenY: s.top + s.height / 2, cell: { x: 2, y: 3 } }); });
      assert(await page.evaluate(() => !document.getElementById('piece-controls').hidden), 'piece controls shown');
      const docked = await page.evaluate(() => getComputedStyle(document.getElementById('btn-more')).display !== 'none');
      if (docked) {
        await page.click('#btn-more');
        assert(await page.evaluate(() => !document.getElementById('more-sheet').hidden && document.getElementById('more-sheet').contains(document.getElementById('btn-help'))), 'MORE sheet opens and holds Help');
        const smallM = await page.evaluate(measureButtons); assert(smallM.length === 0, 'MORE sheet buttons >= 44x44 ' + JSON.stringify(smallM));
        const mh = await page.evaluate(menuHit); assert(mh.hit, `Menu link hit with MORE sheet open ${JSON.stringify(mh)}`);
        await page.screenshot({ path: `${SHOTS}/ui-${vp.name}-more.png` });
      } else {
        assert(await page.evaluate(() => document.getElementById('btn-help').offsetParent !== null && document.getElementById('btn-levels').offsetParent !== null), 'side panel shows Help/Levels inline');
      }
      const mh0 = await page.evaluate(menuHit); assert(mh0.hit, `Menu link hit with piece controls open ${JSON.stringify(mh0)}`);

      // ---- A5: a toast lives behind a modal's backdrop, so opening one must retire it ----
      const toastVsModal = await page.evaluate(() => {
        const ui = window.__harness.ui, t = document.getElementById('toast');
        ui.showToast('a lingering tutorial toast', { ms: 60000 });
        const before = t.classList.contains('is-visible');
        ui.showVictory({ stars: { solved: true, par: true, blind: true }, piecesUsed: 2, par: 2, fires: 1, tiltsUsed: 0, hintUsed: false, hasNext: true });
        const during = t.classList.contains('is-visible');
        ui.hideVictory();
        return { before, during };
      });
      assert(toastVsModal.before && !toastVsModal.during, `opening a modal hides the toast ${JSON.stringify(toastVsModal)}`);
      await page.evaluate(() => window.__harness.ui.showToast('intro', { ms: 60000 }));

      await page.evaluate(() => window.__harness.ui.showHowToPlay());
      assert(await page.evaluate(() => document.getElementById('toast').classList.contains('is-visible') === false), 'the help modal also hides the toast');
      assert(await page.evaluate(() => window.__harness.ui.isModalOpen() && document.activeElement === document.querySelector('#modal-help .modal-close')), 'help modal open; focus on close');
      const mh1 = await page.evaluate(menuHit); assert(mh1.hit, `Menu link hit with help open ${JSON.stringify(mh1)}`);
      const ov1 = await page.evaluate(overflow); assert(ov1.sw <= ov1.cw, `no horizontal overflow with help open (${ov1.sw} <= ${ov1.cw})`);
      const smallH = await page.evaluate(measureButtons); assert(smallH.length === 0, 'help buttons >= 44x44 ' + JSON.stringify(smallH));
      // ---- DESIGN.md 12: pitch is a DELTA. The modal must say so, and must no longer say a mirror levels the beam ----
      const rules = await page.evaluate(() => {
        const body = document.querySelector('#modal-help .modal-body');
        const rows = Array.from(body.querySelectorAll('.help-row')).map((r) => r.textContent.replace(/\s+/g, ' ').trim());
        const svg = body.querySelector('svg.help-diagram');
        const box = svg ? svg.getBoundingClientRect() : null;
        const modal = document.querySelector('#modal-help .modal').getBoundingClientRect();
        return {
          text: body.textContent.replace(/\s+/g, ' ').trim(),
          rows: rows,
          note: (body.querySelector('.help-note') || {}).textContent || '',
          svg: !!svg,
          role: svg && svg.getAttribute('role'),
          alt: svg ? Array.from(svg.querySelectorAll('title, desc')).map((n) => n.textContent).join(' ') : '',
          labelled: svg && svg.getAttribute('aria-labelledby'),
          labelIds: svg ? Array.from(svg.querySelectorAll('title, desc')).map((n) => n.id).join(' ') : '',
          panels: svg ? svg.querySelectorAll('.hd-piece').length : 0,
          pieces: svg ? Array.from(svg.querySelectorAll('.hd-piece')).map((n) => n.getAttribute('data-type')) : [],
          notes: svg ? Array.from(svg.querySelectorAll('.hd-note')).map((n) => n.textContent) : [],
          paints: svg ? Array.from(svg.querySelectorAll('.hd-piece')).map((n) => getComputedStyle(n).fill)
            .concat([getComputedStyle(svg.querySelector('.hd-beam')).stroke, getComputedStyle(svg.querySelector('.hd-ground')).stroke]) : [],
          w: box && box.width, h: box && box.height,
          // legibility: SVG text is in viewBox units, so its on-screen size is fontSize * (renderedWidth / 300)
          notePx: svg ? parseFloat(getComputedStyle(svg.querySelector('.hd-note')).fontSize) * (box.width / 300) : 0,
          namePx: svg ? parseFloat(getComputedStyle(svg.querySelector('.hd-name')).fontSize) * (box.width / 300) : 0,
          insideModal: box && box.left >= modal.left - 0.5 && box.right <= modal.right + 0.5
        };
      });
      // the three pieces, in the corrected wording
      assert(/does not change its climb/.test(rules.rows[0] || '') && /keeps going up/.test(rules.rows[0] || ''),
        `MIRROR row says the climb is preserved: "${rules.rows[0]}"`);
      assert(/tips it up one step/.test(rules.rows[1] || '') && /comes back to flat/.test(rules.rows[1] || ''),
        `WEDGE row states the clamped delta: "${rules.rows[1]}"`);
      assert(/tips it down one step/.test(rules.rows[2] || '') && /comes back to flat/.test(rules.rows[2] || ''),
        `DIP row states the clamped delta: "${rules.rows[2]}"`);
      // the old set-semantics wording is gone from the whole modal
      const stale = ['levels it', 'levels the beam', 'level per cell', 'and levels'].filter((w) => rules.text.toLowerCase().indexOf(w) >= 0);
      assert(stale.length === 0, `no "mirror levels the beam" wording left in the modal ${JSON.stringify(stale)}`);
      assert(/only a DIP flattens/i.test(rules.note) && /only a WEDGE flattens/i.test(rules.note) && /never flatten/i.test(rules.note),
        `the key insight is called out: "${rules.note}"`);
      // the diagram
      assert(rules.svg && rules.role === 'img' && rules.labelled && rules.labelled === rules.labelIds,
        `pitch diagram is an inline SVG labelled by its own title+desc ${JSON.stringify({ role: rules.role, labelled: rules.labelled, ids: rules.labelIds })}`);
      assert(/mirror/i.test(rules.alt) && /dip/i.test(rules.alt) && /wedge/i.test(rules.alt) && rules.alt.length > 80,
        `pitch diagram has a text alternative naming all three pieces: "${rules.alt}"`);
      assert(rules.panels === 3 && JSON.stringify(rules.pieces) === '["MIRROR","DIP","WEDGE"]',
        `diagram shows the three pieces acting on a beam ${JSON.stringify(rules.pieces)}`);
      assert(JSON.stringify(rules.notes) === '["up stays up","up becomes flat","flat becomes up"]',
        `each diagram panel is captioned in words, not colour alone ${JSON.stringify(rules.notes)}`);
      assert(rules.paints.every((c) => c && c !== 'none' && c !== 'rgb(0, 0, 0)') && new Set(rules.paints).size === rules.paints.length,
        `every diagram colour resolves to its own theme token ${JSON.stringify(rules.paints)}`);
      assert(rules.insideModal && rules.w > 200 && rules.h > 60 && rules.h < 200,
        `pitch diagram fits the modal without overflowing it (${rules.w && rules.w.toFixed(0)}x${rules.h && rules.h.toFixed(0)})`);
      assert(rules.notePx >= 8 && rules.namePx >= 9,
        `diagram labels stay legible on this screen (name ${rules.namePx.toFixed(1)} px, note ${rules.notePx.toFixed(1)} px)`);
      // focus trap: Tab from the last focusable wraps to the first
      await page.evaluate(() => { const f = Array.from(document.querySelectorAll('#modal-help .modal button, #modal-help .modal a[href]')); f[f.length - 1].focus(); });
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => document.getElementById('modal-help').contains(document.activeElement)), 'focus trapped in help modal after Tab');
      await page.screenshot({ path: `${SHOTS}/ui-${vp.name}-help.png` });
      await page.screenshot({ path: `${SHOTS}/rule-${vp.name}-help.png`, fullPage: true });
      await page.keyboard.press('Escape');
      assert(await page.evaluate(() => !window.__harness.ui.isModalOpen() && document.getElementById('modal-help').hidden), 'Escape closes help');

      await page.evaluate(() => window.__harness.ui.showLevelSelect());
      const tiles = await page.evaluate(() => ({ n: document.querySelectorAll('.level-tile').length, locked: document.querySelectorAll('.level-tile[data-state="locked"]').length, current: document.querySelectorAll('.level-tile[data-state="current"]').length, completed: document.querySelectorAll('.level-tile[data-state="completed"]').length }));
      assert(tiles.n === 20 && tiles.locked === 14 && tiles.current === 1 && tiles.completed === 3, `level grid 20 tiles, 14 locked, 1 current, 3 completed ${JSON.stringify(tiles)}`);
      const mh2 = await page.evaluate(menuHit); assert(mh2.hit, `Menu link hit with levels open ${JSON.stringify(mh2)}`);
      const smallL = await page.evaluate(measureButtons); assert(smallL.length === 0, 'level tiles >= 44x44 ' + JSON.stringify(smallL));
      await page.screenshot({ path: `${SHOTS}/ui-${vp.name}-levels.png` });
      await page.evaluate(() => document.querySelector('.level-tile[data-state="locked"]').click());
      assert(await page.evaluate(() => window.__harness.ui.isModalOpen() && !window.__harness.log.some((l) => l[0] === 'onSelectLevel')), 'locked tile does not emit');
      await page.click('.level-tile[data-index="1"]');
      assert(await page.evaluate(() => !window.__harness.ui.isModalOpen() && window.__harness.log.some((l) => l[0] === 'onSelectLevel' && l[1] === 1)), 'unlocked tile emits onSelectLevel(1) and closes');

      await page.evaluate(() => window.__harness.ui.showVictory({ stars: { solved: true, par: true, blind: true }, starCount: 3, piecesUsed: 2, par: 2, fires: 2, tiltsUsed: 0, hintUsed: false, hasNext: true }));
      await page.waitForTimeout(700);
      const vStars = await page.evaluate(() => {
        const out = { all: Array.from(document.querySelectorAll('#modal-victory .star')).map((s) => s.getAttribute('data-earned')) };
        window.__harness.ui.showVictory({ stars: { solved: true, par: false, blind: true }, piecesUsed: 3, par: 2, fires: 2, tiltsUsed: 0, hintUsed: true, hasNext: true });
        out.blindOnly = Array.from(document.querySelectorAll('#modal-victory .star')).map((s) => s.getAttribute('data-earned'));
        out.label = document.querySelector('#modal-victory .victory-stars').getAttribute('aria-label');
        window.__harness.ui.showVictory({ stars: { solved: true, par: true, blind: true }, piecesUsed: 2, par: 2, fires: 2, tiltsUsed: 0, hintUsed: false, hasNext: true });
        return out;
      });
      assert(JSON.stringify(vStars.all) === '["true","true","true"]' && JSON.stringify(vStars.blindOnly) === '["true","false","true"]',
        `victory lights the criteria actually earned, not the first N ${JSON.stringify(vStars)}`);
      await page.waitForTimeout(700);
      const mh3 = await page.evaluate(menuHit); assert(mh3.hit, `Menu link hit with victory open ${JSON.stringify(mh3)}`);
      assert(await page.evaluate(() => document.querySelectorAll('#modal-victory .star.is-awarded').length === 3 && document.activeElement && document.activeElement.id === 'btn-next'), 'victory awards 3 stars; focus on Next');
      const smallV = await page.evaluate(measureButtons); assert(smallV.length === 0, 'victory buttons >= 44x44 ' + JSON.stringify(smallV));
      await page.screenshot({ path: `${SHOTS}/ui-${vp.name}-victory.png` });
      await page.click('#btn-next');
      assert(await page.evaluate(() => !window.__harness.ui.isModalOpen() && window.__harness.log.some((l) => l[0] === 'onNextLevel')), 'Next closes victory and emits onNextLevel');

      // Progress storage round trip, schema-1 migration, and corrupt storage never throws
      const prog = await page.evaluate(() => {
        const ui = window.__harness.ui;
        // schema 1: an ordinal count per level. 3 -> all three, 2 -> solve+par, 1 -> solve, 0 -> none.
        ui.saveProgress({ currentLevel: 2, highestUnlocked: 4, stars: { '0': 3, '1': 2, '2': 1, '3': 0, '4': 9, '5': -1 }, muted: true });
        const a = ui.loadProgress();
        ui.saveProgress(a);
        const b = ui.loadProgress();                       // schema 2 round-trips unchanged
        // schema 2 written directly, including a set an ordinal could never express
        ui.saveProgress({ schema: 2, currentLevel: 0, highestUnlocked: 1, stars: { '0': { solved: true, par: false, blind: true } }, muted: false });
        const c = ui.loadProgress();
        localStorage.setItem('lasers3d.v1', '{nope');
        const d = ui.loadProgress();
        return { a, b, c, d };
      });
      assert(prog.a.currentLevel === 2 && prog.a.muted === true && prog.a.schema === 2, 'progress round-trips and is stamped schema 2 ' + JSON.stringify({ s: prog.a.schema, c: prog.a.currentLevel }));
      assert(JSON.stringify(prog.a.stars['0']) === '{"solved":true,"par":true,"blind":true}' &&
             JSON.stringify(prog.a.stars['1']) === '{"solved":true,"par":true,"blind":false}' &&
             JSON.stringify(prog.a.stars['2']) === '{"solved":true,"par":false,"blind":false}' &&
             JSON.stringify(prog.a.stars['3']) === '{"solved":false,"par":false,"blind":false}',
        'schema-1 counts migrate to the first N criterion flags without losing a star ' + JSON.stringify(prog.a.stars));
      assert(JSON.stringify(prog.b.stars) === JSON.stringify(prog.a.stars), 'schema-2 progress survives a second round trip ' + JSON.stringify(prog.b.stars));
      assert(JSON.stringify(prog.c.stars['0']) === '{"solved":true,"par":false,"blind":true}', 'a blind-but-not-par solve is storable and reloads intact ' + JSON.stringify(prog.c.stars));
      assert(prog.d.currentLevel === 0 && prog.d.highestUnlocked === 0 && JSON.stringify(prog.d.stars) === '{}', 'corrupt storage -> defaults');

      // resize re-fits and emits onStageResize
      const n0 = await page.evaluate(() => window.__harness.log.filter((l) => l[0] === 'onStageResize').length);
      await page.setViewportSize({ width: vp.width - 20, height: vp.height - 20 });
      await page.waitForTimeout(200);
      const n1 = await page.evaluate(() => window.__harness.log.filter((l) => l[0] === 'onStageResize').length);
      assert(n1 > n0, `onStageResize fired on resize (${n0} -> ${n1})`);

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
