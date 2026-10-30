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
const deepseek = ['deepseek-twin-hive', 'deepseek-spare', 'deepseek-rung', 'deepseek-cipher', 'deepseek-trail', 'deepseek-split'];
const qwen = ['qwen-quadra', 'qwen-logic-lattice', 'qwen-syntax-siege', 'qwen-memory-maze', 'qwen-pattern-prism', 'qwen-territory-tactics'];
const claude = ['claude-dovetail', 'claude-splice', 'claude-sprout', 'claude-tangle', 'claude-keystone', 'claude-tumbler'];
const sharedModuleGames = [...deepseek, ...qwen, ...claude];
const bonus=['nested-tic-tac-toe'];
const bonusFiles=['index.html','app.mjs','engine.mjs','ai.mjs','styles.css','icon.svg'];
const slugs = [...originals, ...classics, ...kimi, ...sharedModuleGames, ...bonus];
const runtime = ['index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs', 'shell.mjs', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'fonts/test.ttf', 'fonts/LICENSE.txt'];
const sharedRuntime = ['assets/index.js', 'assets/index.css', 'assets/chunks/game.mjs', 'assets/puzzles.json', 'assets/images/icon.avif', 'fonts/test.woff2', 'fonts/LICENSE.txt'];
const deepseekRuntime = ['index.html', 'app.mjs', 'engine.mjs', 'puzzles.mjs'];
const deepseekShared = ['core.mjs', 'common.mjs', 'daily-rotations.mjs', 'practice-calendar.mjs', 'styles.css'];

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
  for(const slug of bonus){
    for(const name of bonusFiles)writeFixture(root,`games/${slug}/${name}`,name==='index.html'?'<script type="module" src="./app.mjs"></script>':name==='app.mjs'?'import "./engine.mjs"; import "./ai.mjs";':name==='ai.mjs'?'import "./engine.mjs";':'');
    writeFixture(root,`games/${slug}/README.md`,'Not a runtime file');
  }
  writeFixture(root, 'games/ringcount/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/switchpath/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/counterpart/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/shortlist/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/second-sense/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/sideways/share-card.mjs', 'export const card = true;');
  writeFixture(root, 'games/tradeoff/share-card.mjs', 'export const card = true;');
  for (const slug of kimi) writeFixture(root, `games/${slug}/index.html`, '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="stylesheet" href="../kimi-runtime/assets/index.css">');
  for (const name of sharedRuntime) writeFixture(root, `games/kimi-runtime/${name}`);
  writeFixture(root, 'games/kimi-runtime/assets/index.js', 'export { value } from "./chunks/game.mjs"; const text = "Climb from ";');
  for (const slug of sharedModuleGames) {
    writeFixture(root, `games/${slug}/index.html`, '<script type="module" src="./app.mjs"></script><link rel="stylesheet" href="../deepseek-runtime/styles.css">');
    writeFixture(root, `games/${slug}/app.mjs`, 'import "./engine.mjs"; import "./puzzles.mjs"; import "../deepseek-runtime/common.mjs";');
    writeFixture(root, `games/${slug}/engine.mjs`, 'import "../deepseek-runtime/core.mjs";');
    writeFixture(root, `games/${slug}/puzzles.mjs`, 'export const puzzles = [];');
    writeFixture(root, `games/${slug}/engine.test.mjs`, 'throw new Error("Development tests must never be staged.");');
    writeFixture(root, `games/${slug}/README.md`, 'Development documentation stays out.');
  }
  writeFixture(root, 'games/deepseek-runtime/core.mjs', 'export const version = 1;');
  writeFixture(root, 'games/deepseek-runtime/daily-rotations.mjs', 'export const FRESH_ROTATIONS = {};');
  writeFixture(root, 'games/deepseek-runtime/practice-calendar.mjs', 'export const practiceCandidates = () => [];');
  writeFixture(root, 'games/deepseek-runtime/common.mjs', 'import "./core.mjs";');
  writeFixture(root, 'games/deepseek-runtime/styles.css', 'body { font-family: system-ui; }');
  writeFixture(root, 'games/deepseek-runtime/core.test.mjs', 'throw new Error("Do not bundle this test.");');
  writeFixture(root, 'games/deepseek-runtime/common.test.mjs', 'throw new Error("Do not bundle this test either.");');
  const command = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  try { run({ root, temporary, command }); }
  finally { rmSync(temporary, { recursive: true, force: true }); }
}

test('ordinary sync copies the fixed runtime set including Ringcount and Switchpath image export and check is read-only', () => fixture(({ root, command }) => {
  assert.equal(command().status, 0);
  const directory = join(root, 'ios', 'Web', 'games');
  const before = snapshot(directory);
  assert.ok(existsSync(join(directory, 'ringcount', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'switchpath', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'counterpart', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'shortlist', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'second-sense', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'sideways', 'share-card.mjs')));
  assert.ok(existsSync(join(directory, 'tradeoff', 'share-card.mjs')));
  assert.equal(Object.keys(before).length, originals.length * runtime.length + classics.length * (runtime.length - 1) + kimi.length + sharedRuntime.length + sharedModuleGames.length * deepseekRuntime.length + deepseekShared.length + bonusFiles.length + 7);
  assert.equal(readdirSync(directory).length, slugs.length + 2);
  assert.ok(Object.keys(before).every(path => !path.endsWith('/README.md')));
  assert.ok(Object.keys(before).every(path => !path.includes('/tests/')));
  for (const slug of classics) assert.equal(existsSync(join(directory, slug, 'shell.mjs')), false);
  for (const slug of kimi) assert.deepEqual(readdirSync(join(directory, slug)), ['index.html']);
  assert.equal(existsSync(join(directory, 'kimi-runtime', 'index.html')), false);
  for (const slug of sharedModuleGames) assert.deepEqual(readdirSync(join(directory, slug)).sort(), [...deepseekRuntime].sort());
  assert.deepEqual(readdirSync(join(directory, 'deepseek-runtime')).sort(), [...deepseekShared].sort());
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

test('source game, font, wrapper and shared directory links fail before creating any bundle', () => {
  for (const relative of ['games/switchpath', 'games/switchpath/fonts', 'games/kimi-cairn', 'games/kimi-runtime', 'games/kimi-runtime/assets', 'games/kimi-runtime/fonts', 'games/deepseek-runtime', 'games/deepseek-cipher', 'games/qwen-quadra', 'games/claude-tangle']) fixture(({ root, temporary, command }) => {
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
  for (const resource of ['kimi-runtime/assets/index.js', 'deepseek-runtime/core.mjs', 'deepseek-twin-hive/engine.mjs', 'qwen-quadra/app.mjs', 'claude-keystone/puzzles.mjs']) for (const side of ['games', 'ios/Web/games']) fixture(({ root, temporary, command }) => {
    assert.equal(command().status, 0);
    const outside = join(temporary, 'external.js');
    writeFileSync(outside, 'External content stays untouched.');
    const target = join(root, side, resource);
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

test('Kimi wrappers stage their own optional icon.svg and validate its local reference', () => fixture(({ root, command }) => {
  for (const slug of kimi) {
    writeFixture(root, `games/${slug}/icon.svg`, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="10"/></svg>');
    writeFixture(root, `games/${slug}/index.html`, '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="icon" href="./icon.svg">');
  }
  const synced = command();
  assert.equal(synced.status, 0, synced.stderr);
  for (const slug of kimi) assert.deepEqual(readdirSync(join(root, 'ios/Web/games', slug)).sort(), ['icon.svg', 'index.html']);
  const checked = validateFixture(root);
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(command('--check').status, 0);
}));

test('Kimi icon allowance still rejects other wrapper files and nested resources', () => {
  for (const extra of ['other.svg', 'icon.png', 'nested/icon.svg']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    const destination = join(root, 'ios/Web/games');
    const before = snapshot(destination);
    writeFixture(root, `games/kimi-cairn/${extra}`, '<svg/>');
    for (const args of [[], ['--check']]) {
      const rejected = command(...args);
      assert.notEqual(rejected.status, 0, extra);
      assert.deepEqual(snapshot(destination), before, extra);
    }
    writeFixture(root, `ios/Web/games/kimi-cairn/${extra}`, '<svg/>');
    const checked = validateFixture(root);
    assert.notEqual(checked.status, 0, extra);
    assert.match(checked.stderr, /Kimi entry must contain/);
  });
});

test('Kimi icon references remain local to their own wrapper and must exist', () => {
  const cases = [
    ['kimi-cairn/index.html', '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="icon" href="../kimi-morph/icon.svg">', /outside its shared runtime/],
    ['kimi-cairn/index.html', '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="icon" href="https://example.com/icon.svg">', /must be local/],
    ['kimi-cairn/index.html', '<script type="module" src="../kimi-runtime/assets/index.js"></script><link rel="icon" href="./icon.svg">', /Missing Kimi resource/],
    ['kimi-runtime/assets/index.js', 'import "../../kimi-morph/icon.svg";', /outside its shared runtime/],
  ];
  for (const [path, content, error] of cases) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    writeFixture(root, 'ios/Web/games/kimi-morph/icon.svg', '<svg/>');
    writeFixture(root, 'ios/Web/games/' + path, content);
    const checked = validateFixture(root);
    assert.notEqual(checked.status, 0, path);
    assert.match(checked.stderr, error, path);
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

test('DeepSeek, Qwen and Claude stage optional local styles and icons while excluding development files', () => fixture(({ root, command }) => {
  for (const slug of sharedModuleGames) {
    writeFixture(root, 'games/' + slug + '/styles.css', '@import "../deepseek-runtime/styles.css";');
    writeFixture(root, 'games/' + slug + '/icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
    writeFixture(root, 'games/' + slug + '/index.html', '<script type="module" src="./app.mjs"></script><link rel="stylesheet" href="./styles.css"><link rel="icon" href="./icon.svg">');
  }
  assert.equal(command().status, 0);
  for (const slug of sharedModuleGames) {
    assert.deepEqual(readdirSync(join(root, 'ios/Web/games', slug)).sort(), [...deepseekRuntime, 'styles.css', 'icon.svg'].sort());
  }
  const checked = validateFixture(root);
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(command('--check').status, 0);
}));

test('shared-module icon allowance rejects extra bundled files', () => {
  for (const slug of ['deepseek-cipher', 'qwen-quadra', 'claude-keystone']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    writeFixture(root, `ios/Web/games/${slug}/other.svg`, '<svg/>');
    const before = snapshot(join(root, 'ios/Web/games'));
    for (const args of [[], ['--check']]) {
      const rejected = command(...args);
      assert.notEqual(rejected.status, 0, slug);
      assert.deepEqual(snapshot(join(root, 'ios/Web/games')), before, slug);
    }
    const checked = validateFixture(root);
    assert.notEqual(checked.status, 0, slug);
    assert.match(checked.stderr, /Unexpected game runtime file/);
  });
});

test('flat shared modules reject documents, data, nested paths and empty directories before changing bundles', () => {
  for (const side of ['games', 'ios/Web/games']) for (const path of ['index.html', 'puzzles.json', 'nested/core.mjs', '.hidden.mjs', 'empty/']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    const extra = join(root, side, 'deepseek-runtime', path);
    if (path.endsWith('/')) mkdirSync(extra, { recursive: true });
    else writeFixture(root, side + '/deepseek-runtime/' + path, 'Must not be served.');
    const before = snapshot(join(root, 'ios/Web/games'));
    for (const args of [[], ['--check']]) {
      const result = command(...args);
      assert.notEqual(result.status, 0, side + '/' + path);
      assert.deepEqual(snapshot(join(root, 'ios/Web/games')), before);
    }
  });
});

test('shared module check detects missing and changed files and sync repairs only generated output', () => {
  for (const path of ['deepseek-runtime/core.mjs', 'deepseek-cipher/engine.mjs', 'qwen-quadra/puzzles.mjs', 'claude-tumbler/engine.mjs']) for (const issue of ['missing', 'changed']) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    const directory = join(root, 'ios/Web/games');
    const file = join(directory, path);
    if (issue === 'missing') rmSync(file);
    else writeFileSync(file, 'Changed file.');
    const before = snapshot(directory);
    const checked = command('--check');
    assert.notEqual(checked.status, 0);
    assert.match(checked.stderr, issue === 'missing' ? /missing bundle file/ : /content differs/);
    assert.deepEqual(snapshot(directory), before);
    assert.equal(command().status, 0);
    assert.equal(command('--check').status, 0);
    assert.equal(validateFixture(root).status, 0);
  });
});

test('structural validation treats dictionary words and quoted import examples as data', () => fixture(({ root, command }) => {
  assert.equal(command().status, 0);
  writeFixture(root, 'ios/Web/games/claude-dovetail/puzzles.mjs', [
    'export const words = ["import","important","from","front","export"];',
    'export const clue = \'The words import and from belong in this dictionary.\';',
    'export const example = \'import "https://example.com/not-code.mjs"\';',
    '// import "https://example.com/comment.mjs";',
    '/* export { value } from "https://example.com/comment.mjs"; */',
    'export { version as helper } from "../deepseek-runtime/core.mjs";',
  ].join('\n'));
  const checked = validateFixture(root);
  assert.equal(checked.status, 0, checked.stderr);
}));

test('structural validation checks local game module imports and rejects remote, missing and cross-game references', () => {
  const cases = [
    ['deepseek-cipher/app.mjs', 'import "./missing.mjs";', /outside its runtime|Missing game module resource/],
    ['deepseek-cipher/app.mjs', 'export { value } from "../deepseek-runtime/missing.mjs";', /outside its runtime|Missing game module resource/],
    ['qwen-quadra/app.mjs', 'import "https://example.com/module.mjs";', /must be local/],
    ['qwen-logic-lattice/app.mjs', 'const later = import("//example.com/module.mjs");', /must be local/],
    ['deepseek-cipher/app.mjs', 'import "../deepseek-split/puzzles.mjs";', /outside its runtime/],
    ['deepseek-runtime/common.mjs', 'import "../qwen-quadra/engine.mjs";', /outside its runtime/],
    ['qwen-memory-maze/index.html', '<script type="module" src="../kimi-runtime/assets/index.js"></script>', /outside its runtime/],
    ['claude-dovetail/app.mjs', 'import "https://example.com/module.mjs";', /must be local/],
    ['claude-splice/app.mjs', 'import "../claude-sprout/engine.mjs";', /outside its runtime/],
    ['claude-tangle/index.html', '<script type="module" src="../kimi-tangle/index.html"></script>', /outside its runtime/],
    ['claude-sprout/app.mjs', 'import/* dependency */"https://example.com/module.mjs";', /must be local/],
    ['claude-tumbler/app.mjs', 'const later = import /* dependency */ ("//example.com/module.mjs");', /must be local/],
    ['claude-keystone/engine.mjs', 'export /* dependency */ * as other from "../claude-tangle/engine.mjs";', /outside its runtime/],
    ['deepseek-cipher/index.html', '<script type="module" src="./app.mjs"></script><link rel="icon" href="./icon.svg">', /Missing game module resource/],
    ['qwen-quadra/index.html', '<script type="module" src="./app.mjs"></script><link rel="icon" href="../qwen-logic-lattice/icon.svg">', /outside its runtime/],
    ['claude-splice/index.html', '<script type="module" src="./app.mjs"></script><link rel="icon" href="https://example.com/icon.svg">', /must be local/],
    ['deepseek-runtime/styles.css', '@import "https://example.com/style.css";', /must be local/],
  ];
  for (const [path, contents, error] of cases) fixture(({ root, command }) => {
    assert.equal(command().status, 0);
    writeFixture(root, 'ios/Web/games/' + path, contents);
    const checked = validateFixture(root);
    assert.notEqual(checked.status, 0, path);
    assert.match(checked.stderr, error, path);
  });
});
