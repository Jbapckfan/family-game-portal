import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';

const url = 'http://localhost:8795/games/lasers-3d/';
const outDir = '/Users/jamesalford/family-game-portal/output/layout-review';

const browser = await chromium.launch(
  existsSync(chromium.executablePath()) ? { headless: true } : { channel: 'chrome', headless: true }
);

const targets = [
  { name: 'iphone-portrait', label: 'iPhone 15 Pro Portrait', w: 393, h: 852, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'iphone-landscape', label: 'iPhone 15 Pro Landscape', w: 852, h: 393, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'iphone-se-portrait', label: 'iPhone SE Portrait', w: 375, h: 667, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'ipad-portrait', label: 'iPad Pro 13" Portrait', w: 1024, h: 1366, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'ipad-landscape', label: 'iPad Pro 13" Landscape', w: 1366, h: 1024, dpr: 2, isMobile: true, hasTouch: true },
];

const scenarios = [
  { id: 'l1-flat', level: 0, tilt: false, name: 'Level 1: FIRST BOUNCE (2D Flat)' },
  { id: 'l4-3d', level: 3, tilt: true, name: 'Level 4: OVER THE WALL (3D Isometric)' },
  { id: 'l28-above', level: 27, tilt: true, side: 'above', name: 'Level 28: THROUGH THE BOARD (Both Sides - Above)' },
  { id: 'l28-below', level: 27, tilt: true, side: 'below', name: 'Level 28: THROUGH THE BOARD (Both Sides - Below)' },
];

const results = [];

for (const target of targets) {
  console.log(`Capturing ${target.label}...`);
  const ctx = await browser.newContext({
    viewport: { width: target.w, height: target.h },
    deviceScaleFactor: target.dpr,
    hasTouch: target.hasTouch,
    isMobile: target.isMobile
  });

  for (const s of scenarios) {
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.__lasers3d?.state.frames > 0);
    await page.waitForTimeout(250);

    await page.evaluate((lvl) => {
      __lasers3d.loadLevel(lvl);
    }, s.level);
    await page.waitForTimeout(250);

    if (s.tilt) {
      await page.click('#btn-tilt');
      await page.waitForFunction(() => !__lasers3d.render.getCamera().animating);
      await page.waitForTimeout(200);
    }

    if (s.side === 'below') {
      const belowBtn = page.locator('#btn-below');
      if (await belowBtn.isVisible()) {
        await belowBtn.click();
        await page.waitForFunction(() => !__lasers3d.render.getCamera().animating);
        await page.waitForTimeout(200);
      }
    }

    const filename = `${target.name}-${s.id}.png`;
    const filepath = `${outDir}/${filename}`;
    await page.screenshot({ path: filepath });

    results.push({
      target: target.label,
      targetId: target.name,
      viewport: `${target.w}x${target.h}`,
      scenario: s.name,
      scenarioId: s.id,
      filename
    });

    await page.close();
  }
  await ctx.close();
}

await browser.close();

// Generate HTML gallery
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lasers 3D — iPhone vs iPad Layout Review</title>
<style>
  :root { --bg: #090d16; --card-bg: #121a29; --border: #263852; --accent: #00ffcc; --text: #e6f1ff; --text-muted: #889bb5; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 24px; }
  h1 { font-size: 26px; font-weight: 700; margin: 0 0 6px; color: #fff; }
  p.subtitle { color: var(--text-muted); margin: 0 0 28px; font-size: 15px; }
  .tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab-btn { background: #162438; border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
  .tab-btn.active { background: var(--accent); color: #050817; border-color: var(--accent); font-weight: 700; }
  .section { margin-bottom: 40px; }
  .section-title { font-size: 19px; font-weight: 600; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: baseline; }
  .section-meta { font-size: 13px; color: var(--text-muted); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; align-items: start; }
  .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
  .card-header { padding: 12px 16px; background: rgba(0,0,0,0.25); border-bottom: 1px solid var(--border); font-size: 14px; font-weight: 600; display: flex; justify-content: space-between; }
  .card-header span.badge { font-size: 11px; background: rgba(0,255,204,0.15); color: var(--accent); padding: 2px 8px; border-radius: 10px; font-family: monospace; }
  .img-wrap { padding: 12px; display: flex; justify-content: center; background: #050817; }
  .img-wrap img { max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #1a293d; object-fit: contain; }
  .comparison-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  @media (max-width: 900px) { .comparison-row { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<h1>Lasers 3D — iPhone & iPad Layout Deep Dive</h1>
<p class="subtitle">Direct WebKit/Chromium captures comparing Phone portrait/landscape against iPad Pro 13" layouts across 2D, 3D tilt, and Both Sides underside.</p>

${['l1-flat', 'l4-3d', 'l28-above', 'l28-below'].map(scId => {
  const scName = scenarios.find(s => s.id === scId).name;
  return `
  <div class="section">
    <div class="section-title">
      <span>${scName}</span>
      <span class="section-meta">Side-by-Side iPhone vs iPad Comparison</span>
    </div>
    <div class="grid">
      ${targets.map(t => {
        const item = results.find(r => r.targetId === t.name && r.scenarioId === scId);
        if (!item) return '';
        return `
        <div class="card">
          <div class="card-header">
            <span>${t.label}</span>
            <span class="badge">${t.w} × ${t.h}</span>
          </div>
          <div class="img-wrap">
            <a href="${item.filename}" target="_blank"><img src="${item.filename}" alt="${t.label} - ${scName}"></a>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  </div>
  `;
}).join('')}

</body>
</html>`;

writeFileSync(`${outDir}/layouts.html`, html);
console.log('Finished capturing all layouts and generated layouts.html');
