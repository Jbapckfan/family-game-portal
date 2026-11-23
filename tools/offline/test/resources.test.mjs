import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resourceReferences, portalPages, collectFiles } from '../resources.mjs';
import { buildPrecache } from '../build-precache.mjs';

test('resource scanner distinguishes loads from ordinary links and documentation comments', () => {
  const refs = resourceReferences(`
    <!-- <script src="https://comment.test/a.js"></script> -->
    <a href="https://navigation.test/">Visit</a>
    <script src="https://scripts.test/react.js"></script>
    <link rel="stylesheet" href="//styles.test/a.css">
    <style>/* source https://docs.test/ */
    @import "https://fonts.test/a.css";
    .art { background: url('https://images.test/a.webp'); }</style>
    <script>
    // fetch('https://comment.test/no.json')
    import { a } from './module.mjs';
    import('https://modules.test/module.mjs');
    fetch('https://data.test/a.json');
    importScripts('https://workers.test/one.js', 'https://workers.test/two.js');
    image.src = 'https://images.test/loaded.webp';
    const markup = '<img src="https://images.test/template.webp">';
    const qr = <img src={\`https://qr.test/create?data=\${word}\`} />;
    import{x}from"./minified.mjs";
    </script>`, 'index.html');
  const urls = new Set(refs.map(ref => ref.url));
  for (const expected of ['https://scripts.test/react.js', '//styles.test/a.css', 'https://fonts.test/a.css',
    'https://images.test/a.webp', './module.mjs', 'https://modules.test/module.mjs', 'https://data.test/a.json',
    'https://workers.test/one.js', 'https://workers.test/two.js', 'https://images.test/loaded.webp',
    'https://images.test/template.webp', 'https://qr.test/create?data=${word}', './minified.mjs']) assert(urls.has(expected), expected);
  assert(![...urls].some(url => /comment|navigation|docs/.test(url)));
});

test('an embedded data-image gradient is not a local CSS dependency', () => {
  const refs = resourceReferences(`<link rel="icon" href="data:image/svg+xml,%3Ccircle fill='url(%23g)'/%3E">`, 'index.html');
  assert.equal(refs.length, 0);
});

test('generator discovers pages, recursive CSS/modules, runtime art, fonts and vendor; excludes folder workers', async () => {
  const dir = await mkdtemp(fileURLToPath(new URL('./fixture-', import.meta.url)));
  try {
    const files = {
      'index.html': '<a href="./games/demo/">Play</a><a href="./games/reflex-riot/">Reflex</a><img src="./card.svg">',
      'manifest.json': '{}', 'card.svg': '<svg/>',
      'games/demo/index.html': '<link rel="stylesheet" href="style.css"><script type="module" src="app.mjs"></script>',
      'games/demo/style.css': '@import "nested.css"; body{background:url(felt.webp)}',
      'games/demo/nested.css': 'body{color:white}', 'games/demo/felt.webp': 'art',
      'games/demo/app.mjs': 'import {a} from "./engine.mjs"; const art=new Image();art.src="runtime.webp";',
      'games/demo/engine.mjs': 'export {a} from "./data.mjs";',
      'games/demo/data.mjs': 'export const a=1;', 'games/demo/runtime.webp': 'runtime art',
      'games/reflex-riot/index.html': 'self managed',
      'games/fonts/fonts.css': '@font-face{src:url(font.woff2)}', 'games/fonts/font.woff2': 'font',
      'games/vendor/library.js': 'library',
      'sw.js': '// BEGIN GENERATED PRECACHE\nold\n// END GENERATED PRECACHE\n',
    };
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(dir, path, '..'), { recursive: true });
      await writeFile(join(dir, path), content);
    }
    const pages = await portalPages(dir);
    assert(pages.includes('games/demo/index.html'));
    const graph = await collectFiles(dir, pages.filter(page => !page.startsWith('games/reflex-riot/')));
    assert(graph.files.has('games/demo/data.mjs'));
    assert(graph.files.has('games/demo/felt.webp'));
    assert(graph.files.has('games/demo/runtime.webp'));
    await writeFile(join(dir, 'games/demo/index.html'), files['games/demo/index.html'] + '<script>const img=\'<img src="runtime.webp">\';</script>');
    assert((await collectFiles(dir, pages)).files.has('games/demo/runtime.webp'), 'HTML built in code is also saved');
    const first = await buildPrecache({ root: dir });
    assert.equal(first.current, false);
    assert(!first.files.some(file => file.path.startsWith('games/reflex-riot/')));
    assert(first.files.some(file => file.path === 'games/vendor/library.js'));
    assert.equal((await buildPrecache({ root: dir, check: true })).current, true);
    await writeFile(join(dir, 'games/demo/data.mjs'), 'export const a=2;');
    const changed = await buildPrecache({ root: dir, check: true });
    assert.equal(changed.current, false);
    assert.notEqual(first.version, changed.version);
    assert.equal((await readFile(join(dir, 'sw.js'), 'utf8')).includes(first.version), true, '--check never writes');
    await writeFile(join(dir, 'games/fonts/too-large.woff2'), Buffer.alloc(25_000_001));
    const oversized = await buildPrecache({ root: dir });
    assert.equal(oversized.oversized, true);
    assert.equal((await readFile(join(dir, 'sw.js'), 'utf8')).includes(first.version), true, 'over-limit build never writes');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
