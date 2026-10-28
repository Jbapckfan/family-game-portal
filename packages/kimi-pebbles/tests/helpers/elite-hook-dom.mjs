import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const game = process.argv[2];
const title = game[0].toUpperCase() + game.slice(1);
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://games.example.test/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node', 'Event']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act, createElement: h } = React;
const file = fileURLToPath(new URL(`../../src/games/${game}/use${title}.ts`, import.meta.url));
const require = createRequire(file);
const module = { exports: {} };
const dictionary = new Set(readFileSync(new URL('../../src/games/cairn/data/dict.txt', import.meta.url), 'utf8').split('\n'));
const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Script(`(function(require,module,exports){${compiled}\n})`, { filename: file }).runInThisContext()((id) => {
  // Vite's raw loader is the only unavailable boundary. Use the same bundled
  // dictionary bytes; production hooks, progress validation and storage run.
  if (id === '../shared/dict') return { loadDict: () => Promise.resolve(dictionary), isValidWord: word => dictionary.has(word) };
  return require(id);
}, module, module.exports);
const useGame = module.exports[`use${title}`];
let seen, root;
function Probe() { seen = useGame(); return null; }
const mount = async () => {
  root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(h(Probe)); });
  assert.equal(seen.state.phase, 'playing');
};
const run = async fn => act(async () => fn(seen.actions));
try {
  await mount();
  if (game === 'morph') await run(actions => actions.keyboardLetter('x'));
  if (game === 'hunch') for (const ch of 'cra') await run(actions => actions.keyLetter(ch));
  if (game === 'circuit') {
    const first = seen.state.puzzle.sol[0];
    for (const ch of first) await run(actions => actions.tapLetter(seen.state.puzzle.l.indexOf(ch)));
    await run(actions => actions.submit());
    const next = seen.state.puzzle.sol[1];
    for (const ch of next.slice(1, 3)) await run(actions => actions.tapLetter(seen.state.puzzle.l.indexOf(ch)));
  }
  if (game === 'tangle') await run(actions => actions.hint());
  const before = structuredClone(seen.state);
  const field = { morph: 'edit', hunch: 'current', circuit: 'current', tangle: 'hintPrefix' }[game];
  const key = `kimi:${game}:v1:day:${before.dayNumber}`;
  const saved = JSON.parse(localStorage.getItem(key));
  assert.deepEqual(saved[field], before[field], 'the actual persist effect writes unfinished work');
  await act(async () => root.unmount());
  await mount();
  assert.deepEqual(seen.state[field], before[field], 'a newly mounted hook resumes that same work');
  assert.deepEqual(seen.state.stats, before.stats, 'restoring a draft does not award another play or completion');
  if (game === 'tangle') { assert.equal(seen.state.hintsUsed, 1); assert.ok(seen.state.hintPrefix); assert.equal(seen.state.toast, null); }
  process.stdout.write(`${game} resume completed\n`);
} finally {
  if (root) await act(async () => root.unmount());
  dom.window.close();
}
