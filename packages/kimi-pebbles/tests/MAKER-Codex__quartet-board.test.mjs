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


test('Quartet solved banners use their actual numbered tier and give a ready-to-submit instruction', () => {
  const words = ['oak', 'ash', 'elm', 'pine'];
  const puzzle={groups:[{label:'Trees',tier:1,members:words}]};
  const solved=render('quartet',{phase:'playing',puzzle,tiles:words.map(()=>null),selected:[],solvedGroups:[0],misses:0,hintPair:null,hintsUsed:0,finished:false,won:false});
  assert.equal(solved.querySelector('.quartet-solved').style.background,'rgb(20, 108, 117)');
  assert.equal(solved.querySelector('.quartet-tier').textContent,'1');
  const ready=render('quartet',{phase:'playing',puzzle,tiles:words.map(word=>({word,group:0})),selected:[0,1,2,3],solvedGroups:[],misses:0,hintPair:null,hintsUsed:0,finished:false,won:false});
  assert.match(ready.getElementById('quartet-selection').textContent,/submit to test/i);
});
