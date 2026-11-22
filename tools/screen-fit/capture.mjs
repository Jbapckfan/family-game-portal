#!/usr/bin/env node
// Silent, windowless screenshots of portal games at phone, tablet and laptop sizes.
//
// The repo is served straight from disk through Playwright request routing at
// http://portal.test/ -- no local server and no port. Chromium runs headless with
// --mute-audio, and every page also gets media elements and Web Audio muted, so
// nothing is audible even after clicks. One browser at a time, always closed.
//
// Usage:
//   node tools/screen-fit/capture.mjs --out output/screen-fit/<label>
//        [--only id,id] [--batch mini] [--viewports phone,tablet,laptop,tabletPortrait]
//
// Writes <out>/<id>/<viewport>-<shot>.png, <out>/<id>/sheet-<shot>.png (every size
// captured so far, side by side) and <out>/report.json (fill fractions, overflow,
// errors; re-runs replace only the rows they recapture).
//
// games.json entries: { id, url, batch, shots: [{ name, steps: [...] }] }
// Shots run in order on one page per viewport; steps are cumulative. Step forms:
//   { "click": "css selector" }   { "clickText": "visible text" }
//   { "tap": [x, y] }             { "key": "Enter" }
//   { "wait": 500 }               { "eval": "js expression run in the page" }
// Optional per-step "only": ["phone"] limits a step to some viewports.

import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HOME = process.env.HOME;
const PW = process.env.PLAYWRIGHT_MODULE
  || `${HOME}/Documents/Codex/2026-10-28/task-2/MAKER-astra__test-tools/node_modules/playwright/index.mjs`;
const CHROME = process.env.CHROME_PATH
  || `${HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const ORIGIN = 'http://portal.test';

const VIEWPORTS = {
  phone: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  laptop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  tabletPortrait: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream', '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain',
};

// Runs in every page before its own scripts.
function muteEverything() {
  const quiet = (el) => { try { el.muted = true; el.volume = 0; } catch {} };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { quiet(this); return play.call(this); };
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => {
    if (n instanceof HTMLMediaElement) quiet(n);
  }))).observe(document, { childList: true, subtree: true });
  const Base = window.BaseAudioContext || window.AudioContext || window.webkitAudioContext;
  const d = Base && Object.getOwnPropertyDescriptor(Base.prototype, 'destination');
  if (d && d.get) {
    const gates = new WeakMap();
    Object.defineProperty(Base.prototype, 'destination', {
      configurable: true,
      get() {
        let g = gates.get(this);
        if (!g) {
          const real = d.get.call(this);
          g = this.createGain();
          g.gain.value = 0;
          g.connect(real);
          for (const k of ['maxChannelCount']) Object.defineProperty(g, k, { value: real[k] });
          gates.set(this, g);
        }
        return g;
      },
    });
  }
  if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
  window.__screenFitMuted = true;
}

// Rough visible-content extent: union of canvases, images, controls, text-bearing
// elements and painted boxes that are not full-bleed page wrappers.
function measure() {
  const vw = innerWidth, vh = innerHeight;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0, panelW = 0, panelH = 0;
  for (const el of document.body ? document.body.querySelectorAll('*') : []) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.right <= 0 || r.bottom <= 0 || r.left >= vw || r.top >= vh) continue;
    const tag = el.tagName;
    const media = ['CANVAS', 'IMG', 'SVG', 'VIDEO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(tag);
    const text = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    const fullBleed = r.width >= vw * 0.95 && r.height >= vh * 0.9;
    const painted = !fullBleed && (cs.backgroundImage !== 'none'
      || !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)|transparent/.test(cs.backgroundColor)
      || parseFloat(cs.borderTopWidth) > 0);
    if (!(media || text || painted || (tag === 'CANVAS'))) continue;
    if (cs.position === 'fixed' && r.width * r.height < vw * vh * 0.02) continue; // menu link, toasts
    if ((painted || tag === 'CANVAS' || tag === 'SVG' || tag === 'IMG') && !fullBleed) {
      const w = Math.min(vw, r.right) - Math.max(0, r.left), h = Math.min(vh, r.bottom) - Math.max(0, r.top);
      if (w * h > panelW * panelH) { panelW = w; panelH = h; }
    }
    x0 = Math.min(x0, Math.max(0, r.left)); y0 = Math.min(y0, Math.max(0, r.top));
    x1 = Math.max(x1, Math.min(vw, r.right)); y1 = Math.max(y1, Math.min(vh, r.bottom));
    n++;
  }
  const doc = document.documentElement;
  const media = [...document.querySelectorAll('audio,video')];
  return {
    contentWidthFraction: n ? +((x1 - x0) / vw).toFixed(3) : 0,
    contentHeightFraction: n ? +((y1 - y0) / vh).toFixed(3) : 0,
    // Largest single painted panel / canvas / image that is not a full-screen wrapper.
    panelWidthFraction: +(panelW / vw).toFixed(3),
    panelAreaFraction: +((panelW * panelH) / (vw * vh)).toFixed(3),
    horizontalOverflowPx: Math.max(0, doc.scrollWidth - vw),
    verticalScrollPx: Math.max(0, doc.scrollHeight - vh),
    muted: window.__screenFitMuted === true && media.every((m) => m.muted || m.paused),
  };
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i];
  return a;
}

async function serve(route) {
  const url = new URL(route.request().url());
  if (url.host !== 'portal.test') return route.continue();
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    return route.fulfill({ status: 404, body: 'not found' });
  }
  return route.fulfill({ status: 200, body: readFileSync(file), contentType: TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
}

async function runStep(page, step, vpName) {
  if (step.only && !step.only.includes(vpName)) return;
  if (step.click) await page.click(step.click, { timeout: 8000 });
  else if (step.clickText) await page.getByText(step.clickText, { exact: false }).first().click({ timeout: 8000 });
  else if (step.tap) await page.mouse.click(step.tap[0], step.tap[1]);
  else if (step.key) await page.keyboard.press(step.key);
  else if (step.wait) await page.waitForTimeout(step.wait);
  else if (step.eval) await page.evaluate(step.eval);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const out = resolve(ROOT, args.out || 'output/screen-fit/latest');
  const games = JSON.parse(readFileSync(join(ROOT, 'tools/screen-fit/games.json'), 'utf8'))
    .filter((g) => !args.only || args.only.split(',').includes(g.id))
    .filter((g) => !args.batch || args.batch.split(',').includes(g.batch));
  const vps = (args.viewports ? args.viewports.split(',') : Object.keys(VIEWPORTS));
  const { chromium } = await import(PW);
  const browser = await chromium.launch({
    executablePath: CHROME, headless: true,
    args: ['--mute-audio', '--autoplay-policy=user-gesture-required'],
  });
  const report = [];
  try {
    for (const g of games) {
      mkdirSync(join(out, g.id), { recursive: true });
      for (const vpName of vps) {
        const ctx = await browser.newContext({ ...VIEWPORTS[vpName], reducedMotion: 'no-preference' });
        await ctx.addInitScript(muteEverything);
        await ctx.route('**/*', serve);
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
        try {
          await page.goto(ORIGIN + g.url, { waitUntil: 'load', timeout: 30000 });
          await page.waitForTimeout(1500);
          for (const shot of g.shots || [{ name: 'start', steps: [] }]) {
            let stepError = null;
            try { for (const s of shot.steps || []) await runStep(page, s, vpName); } catch (e) { stepError = String(e.message || e).split('\n')[0]; }
            await page.waitForTimeout(shot.settle ?? 800);
            await page.screenshot({ path: join(out, g.id, `${vpName}-${shot.name}.png`), scale: 'css' });
            report.push({ id: g.id, batch: g.batch, viewport: vpName, shot: shot.name, ...(await page.evaluate(measure)), stepError, errors: [...new Set(errors)].slice(0, 5) });
          }
        } catch (e) {
          report.push({ id: g.id, batch: g.batch, viewport: vpName, shot: 'load', loadError: String(e.message || e).split('\n')[0] });
        }
        await ctx.close();
      }
      // Contact sheet: the three sizes side by side, per shot.
      for (const shot of g.shots || [{ name: 'start' }]) {
        const imgs = Object.keys(VIEWPORTS).map((v) => [v, join(out, g.id, `${v}-${shot.name}.png`)]).filter(([, p]) => existsSync(p));
        if (!imgs.length) continue;
        const page = await browser.newPage({ viewport: { width: 1800, height: 700 } });
        const cells = imgs.map(([v, p]) => {
          const w = VIEWPORTS[v].viewport.width, h = VIEWPORTS[v].viewport.height, s = 620 / h;
          return `<figure><img src="data:image/png;base64,${readFileSync(p).toString('base64')}" width="${Math.round(w * s)}" height="620"><figcaption>${v} ${w}x${h}</figcaption></figure>`;
        }).join('');
        await page.setContent(`<body style="margin:0;background:#888;font:14px system-ui;display:flex;gap:12px;padding:12px;align-items:flex-start">${cells}<style>figure{margin:0}img{display:block;outline:1px solid #000}figcaption{color:#fff;padding-top:4px}</style></body>`);
        await page.screenshot({ path: join(out, g.id, `sheet-${shot.name}.png`), fullPage: true });
        await page.close();
      }
      process.stdout.write(`${g.id} `);
    }
  } finally {
    await browser.close();
  }
  const prevPath = join(out, 'report.json');
  const redone = new Set(report.map((x) => `${x.id}|${x.viewport}`));
  const prev = existsSync(prevPath) ? JSON.parse(readFileSync(prevPath, 'utf8')).filter((x) => !redone.has(`${x.id}|${x.viewport}`)) : [];
  writeFileSync(prevPath, JSON.stringify([...prev, ...report], null, 2) + '\n');
  console.log(`\n${report.length} captures -> ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
