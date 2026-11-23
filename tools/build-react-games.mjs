#!/usr/bin/env node
// Build the classic React game scripts without bundling or a runtime JSX compiler.
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sources = [
  'games/zoo-conquest.jsx',
  'games/snowman-siege.jsx',
  ...[
    'CodeBreakerV4', 'ConnectFour', '2048', 'MemoryMatch', '2DTicTacToe',
    'Minesweeper', 'Minesweeper-pro', 'SpellingBee', 'LightsOut', 'Snake', 'PegJumper',
  ].map(name => `games/mini-games/${name}.jsx`),
];
// Existing non-React games already require ES2020 optional chaining/nullish syntax.
const target = 'es2020';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check') || args.length > 1) {
  console.error('Usage: node tools/build-react-games.mjs [--check]');
  process.exit(1);
}
const check = args.includes('--check');
const esbuild = process.env.ESBUILD || 'esbuild';
const version = spawnSync(esbuild, ['--version'], { encoding: 'utf8' });
if (version.error || version.status !== 0) {
  console.error(process.env.ESBUILD
    ? 'Cannot run esbuild from ESBUILD. Set ESBUILD to an executable esbuild CLI.'
    : 'esbuild is unavailable. Set ESBUILD to an executable esbuild CLI, or put esbuild on PATH.');
  process.exit(1);
}
console.log(`Using esbuild ${version.stdout.trim()} from ${process.env.ESBUILD ? 'ESBUILD' : 'PATH'}; target ${target}.`);

let temporary;
try {
  if (check) temporary = await mkdtemp(path.join(tmpdir(), 'react-games-check-'));
  let different = false;
  for (const source of sources) {
    const output = source.replace(/\.jsx$/, '.js');
    const input = await readFile(path.join(root, source), 'utf8');
    // Babel's default module transform used strict mode. Preserve it explicitly,
    // while leaving classic-script declarations in the global lexical scope.
    const banner = `// Generated from ${path.basename(source)} by tools/build-react-games.mjs; do not edit.\n"use strict";`;
    const result = spawnSync(esbuild, [
      '--loader=jsx', `--sourcefile=${source}`, `--target=${target}`,
      '--jsx=transform', '--jsx-factory=React.createElement',
      '--jsx-fragment=React.Fragment', '--charset=utf8', '--tree-shaking=false',
      '--legal-comments=inline', '--log-level=warning', `--banner=${banner}`,
      // Deliberately no bundle, format, minify, or module wrapper.
    ], { input, encoding: 'utf8', cwd: root, maxBuffer: 16 * 1024 * 1024 });
    if (result.error || result.status !== 0) {
      throw new Error(`Cannot compile ${source}: ${result.stderr || result.error?.message || 'esbuild failed'}`);
    }
    if (result.stderr) process.stderr.write(result.stderr);
    const destination = path.join(temporary || root, output);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, result.stdout);
    if (check) {
      const existing = await readFile(path.join(root, output), 'utf8').catch(error => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (existing !== await readFile(destination, 'utf8')) {
        console.error(`Out of date or missing: ${output}`);
        different = true;
      }
    } else {
      console.log(`Built ${output}`);
    }
  }
  if (different) {
    console.error('Run node tools/build-react-games.mjs to regenerate the game scripts.');
    process.exitCode = 1;
  } else {
    console.log(`${check ? 'Checked' : 'Built'} ${sources.length} scripts for 12 pages.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
