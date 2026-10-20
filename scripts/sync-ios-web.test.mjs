import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./sync-ios-web.mjs', import.meta.url));
const slugs = ['counterpart', 'shortlist', 'second-sense', 'sideways', 'ringcount', 'switchpath'];
const runtime = ['index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs', 'shell.mjs', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'fonts/test.ttf', 'fonts/LICENSE.txt'];

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
  for (const slug of slugs) {
    for (const name of runtime) {
      const destination = join(root, 'games', slug, name);
      mkdirSync(join(destination, '..'), { recursive: true });
      writeFileSync(destination, `${slug}:${name}`);
    }
    writeFileSync(join(root, 'games', slug, 'README.md'), 'Development files stay out of the bundle.');
  }
  const command = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  try { run({ root, temporary, command }); }
  finally { rmSync(temporary, { recursive: true, force: true }); }
}

test('ordinary sync copies the fixed runtime set and check is read-only', () => fixture(({ root, command }) => {
  assert.equal(command().status, 0);
  const directory = join(root, 'ios', 'Web', 'games');
  const before = snapshot(directory);
  assert.equal(Object.keys(before).length, slugs.length * runtime.length);
  assert.ok(Object.keys(before).every(path => !path.endsWith('/README.md')));
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

test('source game and font directory links fail before creating any bundle', () => {
  for (const relative of ['games/switchpath', 'games/switchpath/fonts']) fixture(({ root, temporary, command }) => {
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
