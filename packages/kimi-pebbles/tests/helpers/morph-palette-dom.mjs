import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'https://games.example.test/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'NodeFilter', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'MutationObserver']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
globalThis.React = React;
const { act, createElement: h, useState } = React;
const { createRoot } = await import('react-dom/client');
const { MorphBoard } = await import('../../src/games/morph/MorphBoard.tsx');
const calls = { picked: [], submits: 0, keyboard: 0 };
function Fixture() {
  const [state, setState] = useState({ phase: 'playing', puzzle: { s: 'cold', t: 'cord', par: 1, p: ['cold', 'cord'] },
    rows: ['cold'], edit: [...'cold'], focusCell: null, paletteOpen: false, misses: 0, hintsUsed: 0,
    showPath: false, shaking: false, finished: false });
  const actions = {
    openCell: focusCell => setState(s => ({ ...s, focusCell, paletteOpen: true })),
    closePalette: () => setState(s => ({ ...s, paletteOpen: false, focusCell: null })),
    pickLetter: letter => { calls.picked.push(letter); setState(s => ({ ...s, paletteOpen: false, focusCell: null })); },
    keyboardLetter: () => { calls.keyboard++; }, submit: () => { calls.submits++; },
    hint() {}, closePath() {}, undo() {}, restart() {}, giveUp() {},
  };
  return h('main', { tabIndex: -1 }, h('button', { id: 'outside' }, 'Outside'), h(MorphBoard, { state, actions }));
}
const root = createRoot(document.getElementById('root'));
try {
  await act(async () => root.render(h(Fixture)));
  const opener = document.querySelector('button[aria-label="Edit letter c"]');
  await act(async () => { opener.focus(); opener.click(); });
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog, 'tapping an editable letter opens the palette');
  const key = (element, value, options = {}) => element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }));
  if (process.argv[2] === 'escape') {
    await act(async () => key(document.activeElement, 'Escape'));
    await act(async () => new Promise(resolve => setTimeout(resolve, 10)));
    assert.equal(document.querySelector('[role="dialog"]') === null, true, 'Escape dismisses the palette');
    assert.ok(document.activeElement === opener, 'Escape restores focus to the selected letter');
  } else if (process.argv[2] === 'choice') {
    await act(async () => { key(dialog, 'Enter'); key(dialog, 'z'); });
    assert.equal(calls.submits, 0, 'dialog keys cannot submit the underlying rung');
    assert.equal(calls.keyboard, 0, 'dialog keys cannot edit the underlying rung');
    const letter = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'z');
    await act(async () => letter.click());
    assert.deepEqual(calls.picked, ['z']);
    assert.equal(document.querySelector('[role="dialog"]') === null, true);
  } else {
    assert.ok(dialog.contains(document.activeElement), 'opening moves focus inside the palette');
    const buttons = [...dialog.querySelectorAll('button')];
    await act(async () => { buttons.at(-1).focus(); key(buttons.at(-1), 'Tab'); });
    assert.equal(document.activeElement === buttons[0], true, 'Tab wraps inside the palette');
    await act(async () => key(buttons[0], 'Tab', { shiftKey: true }));
    assert.equal(document.activeElement === buttons.at(-1), true, 'Shift+Tab wraps inside the palette');
  }
  process.stdout.write(`palette ${process.argv[2]} completed\n`);
} finally {
  await act(async () => root.unmount());
  dom.window.close();
}
