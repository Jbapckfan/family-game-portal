#!/usr/bin/env node
/** Stage 32 game documents and two shared runtimes, or verify offline parity. */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REAL_REPO = await realpath(REPO);
const ORIGINAL_GAMES = Object.freeze([
  'counterpart', 'shortlist', 'second-sense', 'sideways', 'ringcount', 'switchpath',
]);
const CLASSIC_GAMES = Object.freeze(['tradeoff', 'inbetween']);
const KIMI_GAMES = Object.freeze(['kimi-cairn', 'kimi-morph', 'kimi-tangle', 'kimi-hunch', 'kimi-circuit', 'kimi-quartet']);
const DEEPSEEK_GAMES = Object.freeze(['deepseek-twin-hive', 'deepseek-spare', 'deepseek-rung', 'deepseek-cipher', 'deepseek-trail', 'deepseek-split']);
const QWEN_GAMES = Object.freeze(['qwen-quadra', 'qwen-logic-lattice', 'qwen-syntax-siege', 'qwen-memory-maze', 'qwen-pattern-prism', 'qwen-territory-tactics']);
const CLAUDE_GAMES = Object.freeze(['claude-dovetail', 'claude-splice', 'claude-sprout', 'claude-tangle', 'claude-keystone', 'claude-tumbler']);
const SHARED_MODULE_GAMES = Object.freeze([...DEEPSEEK_GAMES, ...QWEN_GAMES, ...CLAUDE_GAMES]);
const GAME_SLUGS = Object.freeze([...ORIGINAL_GAMES, ...CLASSIC_GAMES, ...KIMI_GAMES, ...SHARED_MODULE_GAMES]);
const BUNDLE_SLUGS = Object.freeze([...GAME_SLUGS, 'kimi-runtime', 'deepseek-runtime']);
const SHARED_GAME_REQUIRED_FILES = Object.freeze(['index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs']);
const SHARED_GAME_OPTIONAL_FILES = Object.freeze(['styles.css']);
const DEEPSEEK_SHARED_FILES = Object.freeze(['core.mjs', 'common.mjs', 'styles.css']);
const DEEPSEEK_SHARED_TESTS = Object.freeze(['core.test.mjs', 'common.test.mjs']);
const RUNTIME_FILES = Object.freeze([
  'index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs', 'shell.mjs',
  'styles.css', 'icon.svg', 'manifest.webmanifest',
]);
const FONT_EXTENSIONS = /\.(ttf|otf|woff2?|txt)$/i;
// Keep the shared allowlist aligned with BundleResourceResolver.swift.
const ASSET_EXTENSIONS = /\.(js|mjs|css|json|txt|svg|png|jpg|jpeg|webp|gif|ico|avif|woff|woff2|ttf|otf)$/i;
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
    if (entry.name.startsWith('.')) throw new Error(`Hidden paths are not bundle resources: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) files.push(...await collectTree(join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported bundle entry: ${join(directory, entry.name)}`);
  }
  return files.sort();
}

async function validateKimiLayout(slug, directory, files, { source = false } = {}) {
  const entries = await readdir(directory, { withFileTypes: true });
  if (slug === 'kimi-runtime') {
    for (const entry of entries) {
      if (!['assets', 'fonts'].includes(entry.name) || !entry.isDirectory()) throw new Error(`${slug}: unexpected shared runtime path: ${entry.name}`);
    }
    for (const name of files) {
      const [folder, ...parts] = name.split('/');
      const allowed = folder === 'assets' ? ASSET_EXTENSIONS : folder === 'fonts' ? FONT_EXTENSIONS : null;
      if (!parts.length || !allowed?.test(name)) throw new Error(`${slug}: unexpected shared runtime file: ${name}`);
    }
    if (source && !files.some(name => name.startsWith('assets/'))) throw new Error(`${slug}: missing compiled assets`);
  } else if (KIMI_GAMES.includes(slug)) {
    if (entries.some(entry => entry.name !== 'index.html' || !entry.isFile()) || (source && files.length !== 1)) {
      throw new Error(`${slug}: a Kimi wrapper must contain only index.html`);
    }
  }
}

async function validateSharedModuleLayout(slug, directory, files, { source = false } = {}) {
  if (slug === 'deepseek-runtime') {
    const entries = await readdir(directory, { withFileTypes: true });
    const allowed = source ? [...DEEPSEEK_SHARED_FILES, ...DEEPSEEK_SHARED_TESTS] : DEEPSEEK_SHARED_FILES;
    if (entries.some(entry => !entry.isFile() || !allowed.includes(entry.name)) ||
        files.some(name => !allowed.includes(name)) || (source && DEEPSEEK_SHARED_FILES.some(name => !files.includes(name)))) {
      throw new Error(`${slug}: shared runtime must contain only core.mjs, common.mjs and styles.css`);
    }
  } else if (SHARED_MODULE_GAMES.includes(slug)) {
    const allowed = [...SHARED_GAME_REQUIRED_FILES, ...SHARED_GAME_OPTIONAL_FILES];
    const entries = await readdir(directory, { withFileTypes: true });
    if (files.some(name => !allowed.includes(name)) || entries.some(entry => !entry.isFile() || !allowed.includes(entry.name))) {
      throw new Error(`${slug}: unexpected game runtime file`);
    }
  }
}

async function readRuntime(slug) {
  const directory = join(REPO, 'games', slug);
  let files;
  if (KIMI_GAMES.includes(slug) || slug === 'kimi-runtime') {
    files = await collectTree(directory);
    await validateKimiLayout(slug, directory, files, { source: true });
  } else if (slug === 'deepseek-runtime') {
    files = await collectTree(directory);
    await validateSharedModuleLayout(slug, directory, files, { source: true });
    files = [...DEEPSEEK_SHARED_FILES];
  } else if (SHARED_MODULE_GAMES.includes(slug)) {
    await assertDirectoryChain(directory);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not bundle files: ${join(directory, entry.name)}`);
    }
    files = [...SHARED_GAME_REQUIRED_FILES];
    for (const name of SHARED_GAME_OPTIONAL_FILES) {
      try { await lstat(join(directory, name)); files.push(name); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    files.sort();
  } else {
    const fonts = await collectTree(join(directory, 'fonts'));
    if (!fonts.length) throw new Error(`${slug}: missing bundled fonts and licenses`);
    for (const font of fonts) {
      if (!FONT_EXTENSIONS.test(font)) throw new Error(`${slug}: unexpected file in fonts/: ${font}`);
    }
    const runtime = CLASSIC_GAMES.includes(slug) ? RUNTIME_FILES.filter(name => name !== 'shell.mjs') : RUNTIME_FILES;
    files = [...runtime, ...fonts.map(name => `fonts/${name}`)].sort();
  }
  const contents = new Map();
  for (const name of files) {
    const source = join(directory, name);
    const info = await lstat(source);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Expected a regular runtime file: ${source}`);
    contents.set(name, await readFile(source));
  }
  return { slug, contents };
}

async function preflightDestinations() {
  const root = join(REPO, 'ios', 'Web', 'games');
  await assertDirectoryChain(root, { allowMissing: true });
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not bundle directories: ${join(root, entry.name)}`);
    if (!BUNDLE_SLUGS.includes(entry.name) || !entry.isDirectory()) throw new Error(`Unexpected bundle directory or file: ${entry.name}`);
  }
}

async function inspectDestination({ slug }) {
  const directory = join(REPO, 'ios', 'Web', 'games', slug);
  await assertDirectoryChain(directory, { allowMissing: true });
  try {
    const files = await collectTree(directory);
    await validateKimiLayout(slug, directory, files);
    await validateSharedModuleLayout(slug, directory, files);
    return files;
  }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function checkBundle({ slug, contents }, actual) {
  const directory = join(REPO, 'ios', 'Web', 'games', slug);
  if (actual === null) return [`${slug}: bundle directory is missing`];
  const failures = [];
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
  const games = await Promise.all(BUNDLE_SLUGS.map(readRuntime));
  const count = games.reduce((total, game) => total + game.contents.size, 0);
  // Inspect every existing destination, including nested links, before any mutation.
  await preflightDestinations();
  const actual = await Promise.all(games.map(inspectDestination));
  if (args.includes('--check')) {
    const failures = (await Promise.all(games.map((game, index) => checkBundle(game, actual[index])))).flat();
    if (failures.length) throw new Error(`iOS web bundle differs from its portable sources:\n${failures.join('\n')}`);
    console.log(`Verified ${GAME_SLUGS.length} iOS game entries and two shared runtimes: ${count} runtime files, matching SHA-256 hashes and file sets.`);
    return;
  }
  for (const { slug, contents } of games) {
    const destination = join(REPO, 'ios', 'Web', 'games', slug);
    // These fixed 28 directories are generated output. Nothing else in ios/ is touched.
    await assertDirectoryChain(destination, { allowMissing: true });
    await rm(destination, { recursive: true, force: true });
    for (const [name, bytes] of contents) {
      const target = join(destination, name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
  }
  console.log(`Synced ${GAME_SLUGS.length} iOS game entries and two shared runtimes: ${count} runtime files. Tests, scripts, and documentation were excluded.`);
}

await main();
