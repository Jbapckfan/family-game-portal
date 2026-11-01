// Run from any directory. Uses existing local esbuild and Playwright installations;
// creates an isolated, headless browser context and intercepts every request.
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const pkg = path.join(root, 'packages/kimi-pebbles')
const output = await mkdtemp(path.join(tmpdir(), 'MAKER-Codex__quartet-breakpoints-'))
const { build } = createRequire(path.join(pkg, 'package.json'))('esbuild')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? '/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs')
const assets = path.join(root, 'games/kimi-runtime/assets')
const baseCss = (await readdir(assets)).filter(name => name.endsWith('.css'))
assert.equal(baseCss.length, 1, 'one staged Kimi base stylesheet required')
await build({
 stdin: {
  contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
import {QuartetBoard} from './src/games/quartet/QuartetBoard.tsx';
import './src/games/quartet/quartet.css';
const words=['oak','pumpernickel','ash','croissant','elm','pine','maple','beech','birch','cedar','fir','spruce','yew','willow','alder','poplar'];
const puzzle={groups:[{label:'Fixture',tier:1,members:words.slice(0,4)}]};
const state={phase:'playing',puzzle,tiles:words.map(word=>({word,group:0})),selected:[],solvedGroups:[],misses:0,hintPair:null,hintsUsed:0,finished:false,won:false,shaking:false};
const actions={toggleTile:()=>{},deselectAll:()=>{},shuffleBoard:()=>{},submit:()=>{},hint:()=>{}};
createRoot(document.getElementById('root')).render(React.createElement('main',{className:'kimi-quartet'},React.createElement(QuartetBoard,{state,actions})));`,
  resolveDir: pkg, sourcefile: 'quartet-breakpoints.tsx',
 },
 bundle: true, jsx: 'automatic', format: 'esm', platform: 'browser',
 outfile: path.join(output, 'qa.js'), alias: { '@': path.join(pkg, 'src') },
 define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
})
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const reports = []
try {
 const context = await browser.newContext({ viewport: { width: 320, height: 844 }, reducedMotion: 'reduce' })
 await context.route('**/*', async route => {
  const url = new URL(route.request().url())
  if (url.hostname !== 'quartet.test') return route.abort()
  const files = {
   '/base.css': [path.join(assets, baseCss[0]), 'text/css'],
   '/qa.css': [path.join(output, 'qa.css'), 'text/css'],
   '/qa.js': [path.join(output, 'qa.js'), 'text/javascript'],
  }
  if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en" data-game-id="kimi-quartet"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/qa.css"></head><body><div id="root"></div><script type="module" src="/qa.js"></script></body></html>' })
  const file = files[url.pathname]
  return file ? route.fulfill({ contentType: file[1], body: await readFile(file[0]) }) : route.abort()
 })
 const page = await context.newPage()
 const errors = []
 page.on('pageerror', error => errors.push(error.message))
 await page.goto('http://quartet.test/')
 await page.locator('.quartet-card').first().waitFor()
 for (const width of [320, 350, 351, 420, 421, 768]) {
  await page.setViewportSize({ width, height: 844 })
  const actual = await page.evaluate(() => {
   const cabinet = getComputedStyle(document.querySelector('.quartet-cabinet'))
   const card = getComputedStyle(document.querySelector('.quartet-card:not([data-long-word])'))
   const long = getComputedStyle(document.querySelector('.quartet-card[data-long-word]'))
   return { width: innerWidth, documentWidth: document.documentElement.scrollWidth,
    columns: cabinet.gridTemplateColumns.split(' ').length, gap: cabinet.gap,
    cabinetPadding: cabinet.paddingLeft, cardPadding: card.paddingLeft,
    minHeight: card.minHeight, font: card.fontSize, longFont: long.fontSize,
    clipped: [...document.querySelectorAll('button')].filter(element => element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1).map(element => element.textContent),
   }
  })
  reports.push(actual)
  const phone = width <= 420
  assert.equal(actual.columns, phone ? 2 : 4, `columns at ${width}px`)
  assert.equal(actual.gap, width <= 350 ? '4px' : '7px', `gap at ${width}px`)
  assert.equal(actual.cabinetPadding, width <= 350 ? '4px' : '7px', `cabinet padding at ${width}px`)
  assert.equal(actual.cardPadding, width <= 350 ? '3px' : '5px', `card padding at ${width}px`)
  assert.equal(actual.minHeight, phone ? '64px' : '84px', `touch target at ${width}px`)
  if (phone) {
   assert.equal(actual.font, '17px', `readable word font at ${width}px`)
   assert.equal(actual.longFont, '15px', `readable long word font at ${width}px`)
  }
  assert.equal(actual.documentWidth, width, `page fits at ${width}px`)
  assert.deepEqual(actual.clipped, [], `word and control content fits at ${width}px`)
  if (width === 320) await page.screenshot({ path: path.join(output, 'quartet-320.png'), fullPage: true })
 }
 assert.deepEqual(errors, [])
 console.log(JSON.stringify({ reports, errors, output }, null, 2))
} finally {
 await writeFile(path.join(output, 'results.json'), JSON.stringify(reports, null, 2))
 await browser.close()
}
