import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFiles, portalPages, selfManaged, walkFiles } from './resources.mjs';

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url));
const marker = /\/\/ BEGIN GENERATED PRECACHE\n[\s\S]*?\/\/ END GENERATED PRECACHE/;
const LIMIT_BYTES = 25_000_000;

export async function buildPrecache({ root = defaultRoot, check = false } = {}) {
  const pages = (await portalPages(root)).filter(page => !selfManaged(page));
  const graph = await collectFiles(root, pages);
  graph.files.add('manifest.json');
  for (const directory of ['games/fonts', 'games/vendor']) {
    for (const file of await walkFiles(root, directory)) graph.files.add(file);
  }
  const hash = createHash('sha256');
  const files = [];
  for (const path of [...graph.files].sort()) {
    let content;
    try { content = await readFile(join(root, path)); }
    catch (error) {
      if (error.code !== 'ENOENT' || ['index.html', 'manifest.json'].includes(path)) throw error;
      graph.missing.add(path);
      content = Buffer.from('[missing optional resource]');
    }
    const bytes = graph.missing.has(path) ? 0 : content.length;
    files.push({ path, bytes });
    hash.update(path).update('\0').update(String(content.length)).update('\0').update(content).update('\0');
  }
  const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const version = hash.digest('hex').slice(0, 24);
  const block = `// BEGIN GENERATED PRECACHE\nconst PRECACHE_VERSION = '${version}';\nconst PRECACHE_FILES = ${JSON.stringify(files.map(file => file.path), null, 2)};\n// END GENERATED PRECACHE`;
  const source = await readFile(join(root, 'sw.js'), 'utf8');
  if (!marker.test(source)) throw new Error('sw.js is missing the generated precache markers');
  const current = source.match(marker)[0] === block;
  const oversized = bytes > LIMIT_BYTES;
  if (!check && !oversized && !current) await writeFile(join(root, 'sw.js'), source.replace(marker, block));
  return { files, bytes, version, current, oversized, missing: [...graph.missing].sort(), pages };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const check = process.argv.includes('--check');
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node tools/offline/build-precache.mjs [--check]');
    const result = await buildPrecache({ check });
    console.log(`${result.files.length} files · ${result.bytes.toLocaleString('en-US')} bytes · version ${result.version}`);
    if (result.missing.length) console.warn(`Missing optional files (install will tolerate these):\n${result.missing.join('\n')}`);
    if (result.oversized) {
      console.error('STOP: precache exceeds 25,000,000 bytes; sw.js was not written. Largest 20 files:');
      for (const file of [...result.files].sort((a, b) => b.bytes - a.bytes).slice(0, 20)) console.error(`${file.bytes}\t${file.path}`);
      process.exitCode = 1;
    } else if (check && !result.current) {
      console.error('Precache block is out of date. Run node tools/offline/build-precache.mjs.');
      process.exitCode = 1;
    } else console.log(check ? 'Precache block is current.' : 'Precache block generated.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
