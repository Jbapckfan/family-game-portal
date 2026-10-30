import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import ts from 'typescript';
import { isNativeEnter } from '../src/games/shared/keyboard.ts';

const boards = ['cairn/GameBoard', 'hunch/HunchBoard', 'morph/MorphBoard', 'tangle/TangleBoard'];
const sourceFor = board => readFileSync(new URL(`../src/games/${board}.tsx`, import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function keyboard(board, dialogOpen = false) {
  const source = sourceFor(board);
  const effect = [...source.matchAll(/  useEffect\(\(\) => \{\n[\s\S]*?\n  \}, \[[^\]]*\]\)/g)]
    .map(match => match[0]).find(effect => effect.includes("addEventListener('keydown'"));
  assert.ok(effect, `${board}: keyboard effect`);
  const calls = []; let listener;
  const actions = Object.fromEntries(['submit', 'del', 'tapRack', 'backspace', 'keyLetter', 'closePalette', 'keyboardLetter', 'submitPath', 'clearPath', 'setPath']
    .map(name => [name, (...args) => calls.push([name, ...args])]));
  const document = { querySelector: () => dialogOpen ? {} : null };
  new Script(compile(effect)).runInNewContext({
    actions, state: { rack: ['a'], slots: [], phase: 'playing' }, pathRef: { current: [0, 1, 2] }, document, isNativeEnter,
    useEffect: fn => fn(), window: { addEventListener: (_event, fn) => { listener = fn; } },
  });
  return { calls, press(key, tag = 'BODY', extra = {}) {
    const target = { tagName: tag, closest(selector) {
      return selector.split(',').some(part => part.trim().toUpperCase() === tag) ? this : null;
    } };
    const event = { key, target, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    listener(event); return event;
  } };
}

for (const board of boards) {
  test(`${board}: Enter preserves focused button activation instead of submitting a game move`, () => {
    const game = keyboard(board);
    const event = game.press('Enter', 'BUTTON');
    assert.deepEqual(game.calls, []);
    assert.equal(event.defaultPrevented, false);
  });

  test(`${board}: body Enter still submits, while an open dialog blocks game shortcuts`, () => {
    const game = keyboard(board);
    assert.equal(game.press('Enter').defaultPrevented, true);
    assert.deepEqual(game.calls, [[board.startsWith('tangle') ? 'submitPath' : 'submit']]);
    const blocked = keyboard(board, true);
    for (const key of ['Enter', 'Backspace', 'Escape', 'a']) blocked.press(key);
    assert.deepEqual(blocked.calls, []);
  });
}

for (const [board, expected] of [
  ['cairn/GameBoard', ['tapRack', 0]],
  ['hunch/HunchBoard', ['keyLetter', 'a']],
  ['morph/MorphBoard', ['keyboardLetter', 'a']],
]) {
  test(`${board}: letter typing still works with body or a board tile focused`, () => {
    for (const target of ['BODY', 'BUTTON']) {
      const game = keyboard(board);
      game.press('a', target);
      assert.deepEqual(game.calls, [expected]);
    }
  });
}

function tanglePointer(binding) {
  const source = sourceFor('tangle/TangleBoard');
  const name = source.match(new RegExp(`${binding}=\\{(\\w+)\\}`))?.[1];
  assert.ok(name, `${binding}: production handler exists`);
  const callback = source.match(new RegExp(`  const ${name} = useCallback\\([\\s\\S]*?\\n  \\}, \\[[^\\]]*\\]\\)`))?.[0];
  assert.ok(callback, `${name}: production callback exists`);
  let submissions = 0;
  const dragging = { current: true }, moved = { current: true };
  new Script(compile(`${callback}\n${name}();`)).runInNewContext({
    useCallback: fn => fn, dragging, moved, pathRef: { current: [0, 1, 2] },
    actions: { submitPath: () => { submissions++; } },
  });
  return { submissions, dragging: dragging.current, moved: moved.current };
}

test('Tangle pointer cancellation ends the gesture without submitting a word', () => {
  assert.deepEqual(tanglePointer('onPointerCancel'), { submissions: 0, dragging: false, moved: false });
});

test('Tangle an ordinary completed drag still submits exactly once', () => {
  assert.deepEqual(tanglePointer('onPointerUp'), { submissions: 1, dragging: false, moved: false });
});
