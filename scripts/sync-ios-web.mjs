#!/usr/bin/env node
/** Stage the six launch games into the offline iOS bundle, or verify parity. */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REAL_REPO = await realpath(REPO);
const GAME_SLUGS = Object.freeze([
  'counterpart', 'shortlist', 'second-sense', 'sideways', 'ringcount', 'switchpath',
]);
const RUNTIME_FILES = Object.freeze([
  'index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs', 'shell.mjs',
  'styles.css', 'icon.svg', 'manifest.webmanifest',
]);
const FONT_EXTENSIONS = /\.(ttf|otf|woff2?|txt)$/i;
const hash = contents => createHash('sha256').update(contents).digest('hex');

function isWithin(root, directory) {
  const path = relative(root, directory);
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`));
}

async function assertDirectoryChain(directory, { allowMissing = false } = {}) {
  const absolute = resolve(directory);
  if (!isWithin(REPO, absolute)) throw new Error(`Directory is outside the repository: ${directory}`);
  const parts = relative(REPO, absolute).split(sep).filter(Boolean);
  let current = REPO;
  for (let index = 0; index <= parts.length; index += 1) {
    if (index) current = join(current, parts[index - 1]);
    let info;
    try { info = await lstat(current); }
    catch (error) {
      if (allowMissing && error.code === 'ENOENT') return;
      throw error;
    }
    if (info.isSymbolicLink()) throw new Error(`Symbolic links are not bundle directories: ${current}`);
    if (!info.isDirectory()) throw new Error(`Expected a directory: ${current}`);
    if (!isWithin(REAL_REPO, await realpath(current))) throw new Error(`Directory resolves outside the repository: ${current}`);
  }
}

async function collectTree(directory, prefix = '') {
  await assertDirectoryChain(directory);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not bundle files: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) files.push(...await collectTree(join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported bundle entry: ${join(directory, entry.name)}`);
  }
  return files.sort();
}

async function readRuntime(slug) {
  const directory = join(REPO, 'games', slug);
  const fonts = await collectTree(join(directory, 'fonts'));
  if (!fonts.length) throw new Error(`${slug}: missing bundled fonts and licenses`);
  for (const font of fonts) {
    if (font.split('/').some(part => part.startsWith('.')) || !FONT_EXTENSIONS.test(font)) {
      throw new Error(`${slug}: unexpected file in fonts/: ${font}`);
    }
  }
  const files = [...RUNTIME_FILES, ...fonts.map(name => `fonts/${name}`)].sort();
  const contents = new Map();
  for (const name of files) {
    const source = join(directory, name);
    const info = await lstat(source);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Expected a regular runtime file: ${source}`);
    contents.set(name, await readFile(source));
  }
  return { slug, contents };
}

async function checkBundle({ slug, contents }) {
  const directory = join(REPO, 'ios', 'Web', 'games', slug);
  const failures = [];
  let actual;
  try { actual = await collectTree(directory); }
  catch (error) {
    if (error.code === 'ENOENT') return [`${slug}: bundle directory is missing`];
    throw error;
  }
  for (const name of actual) {
    if (!contents.has(name)) failures.push(`${slug}/${name}: extra bundle file`);
  }
  const actualFiles = new Set(actual);
  for (const [name, expected] of contents) {
    if (!actualFiles.has(name)) failures.push(`${slug}/${name}: missing bundle file`);
    else if (hash(await readFile(join(directory, name))) !== hash(expected)) failures.push(`${slug}/${name}: content differs`);
  }
  return failures;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: node scripts/sync-ios-web.mjs [--check]');
  }
  // Preflight every source before replacing any generated bundle directory.
  const games = await Promise.all(GAME_SLUGS.map(readRuntime));
  const count = games.reduce((total, game) => total + game.contents.size, 0);
  if (args.includes('--check')) {
    const failures = (await Promise.all(games.map(checkBundle))).flat();
    if (failures.length) throw new Error(`iOS web bundle differs from its portable sources:\n${failures.join('\n')}`);
    console.log(`Verified ${games.length} iOS game bundles: ${count} runtime files, matching SHA-256 hashes and file sets.`);
    return;
  }
  // Validate all roots and ancestors before replacing even the first bundle.
  await Promise.all(games.map(({ slug }) => assertDirectoryChain(join(REPO, 'ios', 'Web', 'games', slug), { allowMissing: true })));
  for (const { slug, contents } of games) {
    const destination = join(REPO, 'ios', 'Web', 'games', slug);
    // These fixed six directories are generated output. Nothing else in ios/ is touched.
    await assertDirectoryChain(destination, { allowMissing: true });
    await rm(destination, { recursive: true, force: true });
    for (const [name, bytes] of contents) {
      const target = join(destination, name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
  }
  console.log(`Synced ${games.length} iOS game bundles: ${count} runtime files. Tests, scripts, and documentation were excluded.`);
}

await main();
