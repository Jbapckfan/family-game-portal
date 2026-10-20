import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./sync-ios-web.mjs', import.meta.url));
const validator = fileURLToPath(new URL('../ios/scripts/validate_project.py', import.meta.url));
const originals = ['counterpart', 'shortlist', 'second-sense', 'sideways', 'ringcount', 'switchpath'];
const classics = ['tradeoff', 'inbetween'];
const kimi = ['kimi-cairn', 'kimi-morph', 'kimi-tangle', 'kimi-hunch', 'kimi-circuit', 'kimi-quartet'];
const slugs = [...originals, ...classics, ...kimi];
const runtime = ['index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs', 'shell.mjs', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'fonts/test.ttf', 'fonts/LICENSE.txt'];
const sharedRuntime = ['assets/index.js', 'assets/index.css', 'assets/chunks/game.mjs', 'assets/puzzles.json', 'assets/images/icon.avif', 'fonts/test.woff2', 'fonts/LICENSE.txt'];

function writeFixture(root, relative, content = relative) {
  const target = join(root, relative);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, content);
}

function validateFixture(root) {
  return spawnSync('python3', ['-c', 'import runpy,sys; module=runpy.run_path(sys.argv[1]); print(module["validate_web_bundle"](sys.argv[2]))', validator, join(root, 'ios/Web/games')], { encoding: 'utf8' });
}

function snapshot(directory) {
  const result = {};
  function walk(current, prefix = '') {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(current, entry.name), path);
      else result[path] = createHash('sha256').update(readFileSync(join(current, entry.name))).digest('hex');
    }
  }
  walk(directory);
  return result;
}

function fixture(run) {
  const temporary = mkdtempSync(join(tmpdir(), 'alford-sync-test-'));
  const root = join(temporary, 'repo');
  mkdirSync(join(root, 'scripts'), { recursive: true });
  const script = join(root, 'scripts', 'sync-ios-web.mjs');
  copyFileSync(source, script);
  for (const slug of [...originals, ...classics]) {
    for (const name of runtime.filter(name => originals.includes(slug) || name !== 'shell.mjs')) writeFixture(root, `games/${slug}/${name}`, `${slug}:${name}`);
    writeFileSync(join(root, 'games', slug, 'README.md'), 'Development files stay out of the bundle.');
    writeFixture(root, `games/${slug}/tests/engine.test.mjs`, 'Development tests stay out too.');
  }
  for (const slug of kimi) writeFixture(root, `games/${slug}/index.html`, '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="stylesheet" href="../kimi-runtime/assets/index.css">');
  for (const name of sharedRuntime) writeFixture(root, `games/kimi-runtime/${name}`);
  writeFixture(root, 'games/kimi-runtime/assets/index.js', 'export { value } from "./chunks/game.mjs"; const text = "Climb from ";');
  const command = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  try { run({ root, temporary, command }); }
  finally { rmSync(temporary, { recursive: true, force: true }); }
}

test('ordinary sync copies the fixed runtime set and check is read-only', () => fixture(({ root, command }) => {
  assert.equal(command().status, 0);
  const directory = join(root, 'ios', 'Web', 'games');
  const before = snapshot(directory);
  assert.equal(Object.keys(before).length, originals.length * runtime.length + classics.length * (runtime.length - 1) + kimi.length + sharedRuntime.length);
  assert.equal(readdirSync(directory).length, 15);
  assert.ok(Object.keys(before).every(path => !path.endsWith('/README.md')));
  assert.ok(Object.keys(before).every(path => !path.includes('/tests/')));
  for (const slug of classics) assert.equal(existsSync(join(directory, slug, 'shell.mjs')), false);
  for (const slug of kimi) assert.deepEqual(readdirSync(join(directory, slug)), ['index.html']);
  assert.equal(existsSync(join(directory, 'kimi-runtime', 'index.html')), false);
  assert.equal(command('--check').status, 0);
  assert.deepEqual(snapshot(directory), before);
}));

test('sync and check reject a symlinked game-root before changing any bundle', () => fixture(({ root, temporary, command }) => {
  assert.equal(command().status, 0);
  const game = join(root, 'ios', 'Web', 'games', 'switchpath');
  const outside = join(temporary, 'outside-game');
  renameSync(game, outside);
  symlinkSync(outside, game, 'dir');
  const earlier = join(root, 'ios', 'Web', 'games', 'counterpart');
  writeFileSync(join(earlier, 'index.html'), 'A stale earlier bundle must not be replaced before all paths pass preflight.');
  const before = snapshot(outside);
  const earlierBefore = snapshot(earlier);
  for (const args of [[], ['--check']]) {
    const checked = command(...args);
    assert.notEqual(checked.status, 0);
    assert.match(checked.stderr, /Symbolic link/);
    assert.deepEqual(snapshot(outside), before);
    assert.deepEqual(snapshot(earlier), earlierBefore);
  }
}));

test('sync and check reject a destination ancestor link before any output mutation', () => fixture(({ root, temporary, command }) => {
  assert.equal(command().status, 0);
  const games = join(root, 'ios', 'Web', 'games');
  const outside = join(temporary, 'outside-games');
  renameSync(games, outside);
  symlinkSync(outside, games, 'dir');
  writeFileSync(join(outside, 'sentinel.txt'), 'Do not remove this external file.');
  const before = snapshot(outside);
  for (const args of [[], ['--check']]) {
    const result = command(...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Symbolic link/);
    assert.deepEqual(snapshot(outside), before);
  }
}));

test('source game, font, Kimi wrapper and shared directory links fail before creating any bundle', () => {
  for (const relative of ['games/switchpath', 'games/switchpath/fonts', 'games/kimi-cairn', 'games/kimi-runtime', 'games/kimi-runtime/assets', 'games/kimi-runtime/fonts']) fixture(({ root, temporary, command }) => {
    const directory = join(root, relative);
    const outside = join(temporary, 'outside-source');
    renameSync(directory, outside);
    symlinkSync(outside, directory, 'dir');
    const before = snapshot(outside);
    const result = command();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Symbolic link/);
    assert.deepEqual(snapshot(outside), before);
    assert.equal(existsSync(join(root, 'ios', 'Web', 'games')), false);
  });
});

test('Kimi sources reject documents, hidden paths, unknown extensions and extra wrapper files before mutation', () => {
  for (const bad of ['kimi-runtime/index.html', 'kimi-runtime/assets/page.html', 'kimi-runtime/assets/private.map', 'kimi-runtime/assets/.hidden.js', 'kimi-runtime/assets/.cache/chunk.js', 'kimi-runtime/fonts/code.js', 'kimi-runtime/other/file.js', 'kimi-cairn/README.md', 'kimi-quartet/assets/extra.js']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    const destination = join(root, 'ios', 'Web', 'games');
    const before = snapshot(destination);
    writeFixture(root, `games/${bad}`, 'Must not be copied.');
    for (const args of [[], ['--check']]) {
      const result = command(...args);
      assert.notEqual(result.status, 0, bad);
      assert.deepEqual(snapshot(destination), before, bad);
    }
  });
});

test('shared runtime file symlinks are rejected in both source and destination before any bundle changes', () => {
  for (const side of ['games', 'ios/Web/games']) fixture(({ root, temporary, command }) => {
    assert.equal(command().status, 0);
    const outside = join(temporary, 'external.js');
    writeFileSync(outside, 'External content stays untouched.');
    const target = join(root, side, 'kimi-runtime/assets/index.js');
    rmSync(target);
    symlinkSync(outside, target);
    const earlier = join(root, 'ios/Web/games/counterpart');
    writeFileSync(join(earlier, 'index.html'), 'Do not replace this earlier bundle.');
    const before = snapshot(earlier);
    for (const args of [[], ['--check']]) {
      const result = command(...args);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Symbolic link/);
      assert.deepEqual(snapshot(earlier), before);
      assert.equal(readFileSync(outside, 'utf8'), 'External content stays untouched.');
    }
  });
});

test('shared runtime check reports missing, corrupted and extra files without mutation', () => {
  for (const issue of ['missing', 'corrupted', 'extra']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    const directory = join(root, 'ios/Web/games');
    const file = join(directory, 'kimi-runtime/assets/index.js');
    if (issue === 'missing') rmSync(file);
    else if (issue === 'corrupted') writeFileSync(file, 'Corrupted compiled contents.');
    else writeFixture(root, 'ios/Web/games/kimi-runtime/assets/stale.js', 'A stale generated chunk.');
    const before = snapshot(directory);
    const result = command('--check');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, issue === 'missing' ? /missing bundle file/ : issue === 'corrupted' ? /content differs/ : /extra bundle file/);
    assert.deepEqual(snapshot(directory), before);
    assert.equal(command().status, 0);
    assert.equal(command('--check').status, 0);
  });
});

test('an unknown destination directory is rejected before replacing any known bundle', () => fixture(({ root, command }) => {
  assert.equal(command().status, 0);
  writeFixture(root, 'ios/Web/games/unlisted-game/index.html', 'Unowned content.');
  const before = snapshot(join(root, 'ios/Web/games'));
  assert.notEqual(command().status, 0);
  assert.notEqual(command('--check').status, 0);
  assert.deepEqual(snapshot(join(root, 'ios/Web/games')), before);
}));

test('structural validation accepts assets-only Kimi runtime and optional separate fonts', () => {
  for (const includeFonts of [true, false]) fixture(({ root, command }) => {
    if (!includeFonts) rmSync(join(root, 'games/kimi-runtime/fonts'), { recursive: true });
    assert.equal(command().status, 0);
    const checked = validateFixture(root);
    assert.equal(checked.status, 0, checked.stderr);
  });
});

test('structural validation rejects shared documents and missing local wrapper assets', () => {
  for (const issue of ['document', 'missing reference']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    if (issue === 'document') writeFixture(root, 'ios/Web/games/kimi-runtime/assets/page.html', '<h1>Not a document route</h1>');
    else writeFixture(root, 'ios/Web/games/kimi-cairn/index.html', '<script type="module" src="../kimi-runtime/assets/missing.js"></script>');
    const checked = validateFixture(root);
    assert.notEqual(checked.status, 0);
    assert.match(checked.stderr, issue === 'document' ? /Unexpected shared Kimi runtime file/ : /Missing Kimi resource/);
  });
});
