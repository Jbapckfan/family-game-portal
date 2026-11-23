import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { portalPages, collectFiles } from '../resources.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));

test('portal discovery saves the reported missing art and every daily icon without review/source/native assets', async () => {
  const { files } = await collectFiles(root, await portalPages(root));
  const required = [
    'games/mini-games/Snake-assets/scale-grain-r1.jpg',
    'games/mini-games/Snake-assets/food-atlas-r1.webp',
    'games/shut-the-box-assets/felt.jpg', 'games/shut-the-box-assets/ivory.jpg',
    'games/tower-defense/art/emerald-terrain.webp', 'games/tower-defense/art/frozen-terrain.webp',
    'games/tower-defense/art/volcanic-terrain.webp', 'games/tower-defense/art/crystal-terrain.webp',
    'games/tower-defense/art/grid-terrain.webp', 'games/tower-defense/art/rift-terrain.webp',
    'games/tower-defense/art/road-material.webp',
    'games/cube-jumper/art/metro-distance.webp', 'games/cube-jumper/art/foundry-distance.webp',
    'games/cube-jumper/art/glacier-distance.webp', 'games/cube-jumper/art/jungle-distance.webp',
    'games/cube-jumper/art/rift-distance.webp', 'games/cube-jumper/art/engine-distance.webp',
    'games/socktopus/assets/battlefield-portrait.jpg',
  ];
  const slugs = ['ringcount', 'switchpath', 'counterpart', 'shortlist', 'second-sense', 'sideways',
    'tradeoff', 'inbetween', 'kimi-cairn', 'kimi-morph', 'kimi-tangle', 'kimi-hunch', 'kimi-circuit', 'kimi-quartet',
    'deepseek-twin-hive', 'deepseek-spare', 'deepseek-rung', 'deepseek-cipher', 'deepseek-trail', 'deepseek-split',
    'qwen-quadra', 'qwen-logic-lattice', 'qwen-syntax-siege', 'qwen-memory-maze', 'qwen-pattern-prism', 'qwen-territory-tactics',
    'claude-dovetail', 'claude-splice', 'claude-sprout', 'claude-tangle', 'claude-keystone', 'claude-tumbler'];
  required.push(...slugs.map(slug => `games/${slug}/icon.svg`));
  assert.deepEqual(required.filter(path => !files.has(path)), [], 'missing art must be precached before any game is opened');
  assert(![...files].some(path => /(^ios\/|games\/lasers-3d\/assets\/review\/|(?:thumb|app-icon)-source\.png$)/.test(path)));
  assert(!files.has('games/zoo-conquest/index.html'), 'an unlinked alternate page is not a dependency');
  assert(![...files].some(path => /^games\/(reflex-riot|particle-conquest)\//.test(path)));
});

test('markup/CSS resources use their own base; script literals use the executing page and omit unused files', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./art-fixture-', import.meta.url)));
  try {
    const contents = {
      'index.html': '<a href="games/demo/">Play</a>',
      'games/demo/index.html': `<link rel="apple-touch-icon" href="touch.png"><link rel="icon" href="icon.svg">
        <img src="small.webp" srcset="small.webp 1x, large.webp 2x">
        <video poster="poster.jpg"></video><div style="background-image:url(&quot;inline.webp&quot;)"></div>
        <style>.board{background:url(style.webp)}</style><link rel="stylesheet" href="../shared/board.css">
        <script src="../shared/game.js"></script>`,
      'games/shared/board.css': '.card { background:url(./felt.webp) }',
      'games/shared/game.js': `const image = new Image(); image.src = 'code.webp';
        const mesh = 'shape.glb'; fetch('data.bin');
        const styles = {backgroundImage: 'url(dynamic-style.webp)'};
        const review = '../lasers-3d/assets/review/unused.webp';
        const source = 'thumb-source.png', otherSource = 'scene-source.png', native = '../../ios/native.png';`,
      'games/demo/touch.png': 'touch', 'games/demo/icon.svg': 'icon',
      'games/demo/small.webp': 'small', 'games/demo/large.webp': 'large', 'games/demo/poster.jpg': 'poster',
      'games/demo/inline.webp': 'inline', 'games/demo/style.webp': 'style',
      'games/shared/felt.webp': 'CSS texture', 'games/demo/code.webp': 'page-relative art',
      'games/demo/shape.glb': 'model', 'games/demo/data.bin': 'data', 'games/demo/dynamic-style.webp': 'JS style',
      'games/shared/code.webp': 'wrong script-relative base',
      'games/lasers-3d/assets/review/unused.webp': 'review only',
      'games/demo/thumb-source.png': 'source only', 'ios/native.png': 'native only',
      'games/demo/scene-source.png': 'another source image',
      'games/demo/unused.webp': 'never referenced',
    };
    for (const [path, content] of Object.entries(contents)) {
      await mkdir(join(dir, path, '..'), { recursive: true });
      await writeFile(join(dir, path), content);
    }
    const { files } = await collectFiles(dir, await portalPages(dir));
    const wanted = ['games/demo/touch.png', 'games/demo/icon.svg', 'games/demo/small.webp', 'games/demo/large.webp',
      'games/demo/poster.jpg', 'games/demo/inline.webp', 'games/demo/style.webp', 'games/shared/felt.webp',
      'games/demo/code.webp', 'games/demo/shape.glb', 'games/demo/data.bin', 'games/demo/dynamic-style.webp'];
    assert.deepEqual(wanted.filter(path => !files.has(path)), []);
    for (const path of ['games/shared/code.webp', 'games/lasers-3d/assets/review/unused.webp',
      'games/demo/thumb-source.png', 'games/demo/scene-source.png', 'ios/native.png', 'games/demo/unused.webp']) assert(!files.has(path), path);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('finite loader expansions include declared choices without sweeping their art directories', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./loader-fixture-', import.meta.url)));
  try {
    const contents = {
      'games/cube-jumper.html': `<script>const RUN_ART_FILES={metro:'metro-distance',rift:'rift-distance'};
        image.src='cube-jumper/art/'+RUN_ART_FILES[worldId]+'.webp';</script>`,
      'games/tower-defense/index.html': `<script>const NEXUS_TERRAIN_FILES=['emerald-terrain'];
        for(const name of [...NEXUS_TERRAIN_FILES,'road-material']) {image.src='art/'+name+'.webp';}</script>`,
      'games/shut-the-box.html': '<script src="shut-the-box-assets/table.js"></script>',
      'games/shut-the-box-assets/table.js': `const asset='shut-the-box-assets/';
        ['wood','felt'].forEach(name=>{ const texture=loader.load(asset+name+'.jpg'); });`,
      'games/cube-jumper/art/metro-distance.webp': 'metro', 'games/cube-jumper/art/rift-distance.webp': 'rift',
      'games/tower-defense/art/emerald-terrain.webp': 'terrain', 'games/tower-defense/art/road-material.webp': 'road',
      'games/shut-the-box-assets/wood.jpg': 'wood', 'games/shut-the-box-assets/felt.jpg': 'felt',
      'games/cube-jumper/art/unused.webp': 'not a world', 'games/tower-defense/art/unused.webp': 'not a map',
      'games/shut-the-box-assets/unused.jpg': 'not a material',
    };
    for (const [path, content] of Object.entries(contents)) {
      await mkdir(join(dir, path, '..'), { recursive: true }); await writeFile(join(dir, path), content);
    }
    const { files } = await collectFiles(dir, ['games/cube-jumper.html', 'games/tower-defense/index.html', 'games/shut-the-box.html']);
    const wanted = ['games/cube-jumper/art/metro-distance.webp', 'games/cube-jumper/art/rift-distance.webp',
      'games/tower-defense/art/emerald-terrain.webp', 'games/tower-defense/art/road-material.webp',
      'games/shut-the-box-assets/wood.jpg', 'games/shut-the-box-assets/felt.jpg'];
    assert.deepEqual(wanted.filter(path => !files.has(path)), []);
    assert(![...files].some(path => path.includes('/unused.')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('daily hub icon URLs expand its catalog even without traversing the individual game pages', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./daily-fixture-', import.meta.url)));
  try {
    const contents = {
      'games/daily/index.html': '<html data-game-base="../"><script type="module" src="./app.mjs"></script></html>',
      'games/daily/app.mjs': `const img=new URL('icon.svg', url).href;`,
      'games/daily/catalog.mjs': `export const GAMES=[{slug:'first'}, {"slug":"second"}];`,
      'games/first/icon.svg': 'first', 'games/second/icon.svg': 'second', 'games/unused/icon.svg': 'not a catalog entry',
    };
    for (const [path, content] of Object.entries(contents)) {
      await mkdir(join(dir, path, '..'), { recursive: true }); await writeFile(join(dir, path), content);
    }
    const { files } = await collectFiles(dir, ['games/daily/index.html']);
    assert(files.has('games/first/icon.svg')); assert(files.has('games/second/icon.svg'));
    assert(!files.has('games/unused/icon.svg'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
