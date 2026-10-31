import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
globalThis.React = React;

function render(game, state) {
  const title = game[0].toUpperCase() + game.slice(1);
  const file = fileURLToPath(new URL(`../src/games/${game}/${game === 'cairn' ? 'Game' : title}Board.tsx`, import.meta.url));
  const require = createRequire(file);
  const module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Script(`(function(require,module,exports){${compiled}\n})`, { filename: file }).runInThisContext()((id) => {
    // Cairn's engine imports a Vite raw file. Its board needs only these unchanged
    // presentation constants; the tower is loaded unchanged through its module.
    if (game === 'cairn' && id === './engine') return { LEVELS: 5, MAX_HINTS_PER_LEVEL: 2, emojiFor: () => '□' };
    return require(id);
  }, module, module.exports);
  const Board = module.exports[game === 'cairn' ? 'GameBoard' : `${title}Board`];
  const html = renderToStaticMarkup(createElement(Board, { state, actions: new Proxy({}, { get: () => () => {} }) }));
  return new JSDOM(html).window.document;
}

test('Cairn explains rack placement and distinguishes each empty or removable position', () => {
  const document = render('cairn', { phase: 'playing', puzzle: { words: ['arc'] }, level: 0, rack: [...'arc'], slots: [0, null, null], misses: 0, hints: 0, results: [], finished: false });
  assert.match(document.getElementById('cairn-instructions')?.textContent ?? '', /all 3 letters/);
  assert.match(document.body.textContent, /1 of 3 placed/);
  assert.ok(document.querySelector('[aria-label="Position 2: empty"]'));
  assert.ok(document.querySelector('button[aria-label="Remove letter a from position 1"]'));
});

test('Morph identifies the edit position and explains tapping before opening the letter sheet', () => {
  const document = render('morph', { phase: 'playing', puzzle: { s: 'cold', t: 'warm', par: 4 }, rows: ['cold'], edit: [...'cord'], focusCell: null, paletteOpen: false, misses: 0, hintsUsed: 0, finished: false });
  assert.match(document.getElementById('morph-instructions')?.textContent ?? '', /Tap.*letter/);
  assert.equal(document.querySelector('button[aria-label="Edit letter r, position 3"]')?.getAttribute('aria-description'), 'Position 3 of 4');
});

test('Hunch gives visible non-color result marks and a persistent interpretation key', () => {
  const document = render('hunch', { phase: 'playing', answer: 'honey', guesses: ['stare'], evals: [['absent', 'absent', 'absent', 'absent', 'present']], current: 'h', hintLetters: [], hintsUsed: 0, finished: false, won: false });
  assert.equal(document.querySelectorAll('[data-hunch-row="0"] [data-hunch-dot]').length, 5);
  assert.match(document.querySelector('[data-hunch-legend]')?.textContent ?? '', /Black: exact/i);
  assert.match(document.querySelector('[data-hunch-legend]')?.textContent ?? '', /White: elsewhere/i);
  assert.equal(document.querySelectorAll('[data-hunch-row="0"] [data-hunch-dot="present"]').length, 1);
  assert.equal(document.querySelector('[data-active="true"] .hunch-dots'), null, 'typing does not reveal an evaluation');
  assert.equal(document.querySelectorAll('[data-hunch-cell][data-eval],[data-hunch-key][data-eval]').length,0,'aggregate feedback must not identify letters');
});

test('Tangle keeps its consumed clue visible and numbers the selected route without color', () => {
  const document = render('tangle', { phase: 'playing', puzzle: { g: 'finishabcdefghjk', words: ['fini'], targets: [3, 6, 9], max: 30, n: 10 }, path: [0, 1, 2], found: [], score: 0, misses: 0, hintsUsed: 1, hintPrefix: 'fi' });
  assert.match(document.querySelector('[data-tangle-clue]')?.textContent ?? '', /FI/);
  assert.deepEqual([...document.querySelectorAll('[data-path-order]')].map(el => el.textContent), ['1', '2', '3']);
  assert.equal(document.querySelector('[data-cell="2"]').getAttribute('aria-pressed'), 'true');
});

test('Circuit names arcs visibly and describes the next legal action before an error', () => {
  const document = render('circuit', { phase: 'playing', puzzle: { l: 'abcdefghijkl', par: 3, sol: [] }, played: [], current: [0], revealed: 0, hintsUsed: 0, finished: false });
  assert.match(document.getElementById('circuit-instructions')?.textContent ?? '', /different arc.*1/i);
  assert.equal(document.querySelectorAll('.circuit-arc-label').length, 12);
  assert.match(document.querySelector('[data-letter="1"]').getAttribute('aria-description') ?? '', /different arc/i);
});

test('Quartet makes its saved pair clue available as text and names both hinted cards', () => {
  const words = ['oak', 'ash', 'elm', 'pine'];
  const document = render('quartet', { phase: 'playing', puzzle: { groups: [{ label: 'Trees', tier: 1, members: words }] }, tiles: words.map(word => ({ word, group: 0 })), selected: [0], solvedGroups: [], misses: 0, hintPair: ['oak', 'ash'], hintsUsed: 1, finished: false, won: false });
  assert.match(document.getElementById('quartet-hint')?.textContent ?? '', /OAK.*ASH.*belong together/);
  assert.equal(document.querySelectorAll('button[aria-label*="hint pair"]').length, 2);
  assert.match(document.getElementById('quartet-selection')?.textContent ?? '', /1 of 4/);
});
