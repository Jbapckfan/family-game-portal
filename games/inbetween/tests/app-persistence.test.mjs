import {practiceCandidates} from '../../deepseek-runtime/practice-calendar.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../engine.mjs';
import { PUZZLES } from '../puzzles.mjs';

const PREFIX = 'inbetween:v1:';
const appURL = new URL('../app.mjs', import.meta.url);
// Execute the actual browser application. Its imports are supplied below from
// the real engine and content modules; only browser facilities are stand-ins.
// These tests exercise persistence, not rendering or browser layout.
const appSource = readFileSync(appURL, 'utf8').replace(/^import[^\n]+\n/gm, '');

function createStorage(entries = []) {
  const values = new Map(entries);
  return {
    values,
    denyReads: false,
    denyWrites: false,
    getItem(key) {
      if (this.denyReads) throw new Error('Storage access denied');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (this.denyWrites) throw new Error('Storage quota exceeded');
      values.set(key, value);
    },
  };
}

function openApp(storage) {
  const nodes = new Map();
  let document;
  function element() {
    const listeners = new Map();
    return {
      textContent: '', innerHTML: '', hidden: false, open: false,
      disabled: false, isConnected: true, className: '',
      classList: { toggle() {} },
      setAttribute() {},
      querySelector() { return null; },
      getClientRects() { return [{}]; },
      focus() { document.activeElement = this; },
      scrollIntoView() {},
      close() { this.open = false; },
      showModal() { this.open = true; },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      click() {
        for (const listener of listeners.get('click') ?? []) listener({ target: this });
      },
    };
  }
  document = {
    activeElement: null,
    hidden: false,
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    },
    querySelector() { return null; },
    addEventListener() {},
  };
  document.activeElement = element();
  const context = createContext({practiceCandidates,
    ...engine, PUZZLES, document, localStorage: storage,
    window: { addEventListener() {} },
    navigator: {},
    location: { pathname: '/games/inbetween/' },
    CSS: { escape: value => String(value) },
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: callback => callback(),
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1,
  });
  runInContext(appSource, context, { filename: appURL.pathname });
  const evaluate = code => runInContext(code, context);
  const state = () => JSON.parse(evaluate('JSON.stringify(game)'));
  const puzzle = PUZZLES.find(item => item.id === state().puzzleId);
  assert.ok(puzzle, 'The app must load one of the actual published puzzles');
  return {
    state,
    puzzle,
    dateKey: evaluate('daily.dateKey'),
    dailyKey: PREFIX + evaluate('keyForGame()'),
    click(id) { document.getElementById(id).click(); },
    reveal() { evaluate('reveal()'); },
    placeFit() {
      const placement = engine.findHint(puzzle, state());
      assert.ok(placement, 'The real engine must provide a remaining fit');
      evaluate(`chooseTile(${JSON.stringify(placement.tileId)}); chooseGap(${placement.row}, ${placement.gap}); placePair();`);
    },
    stats() {
      return JSON.parse(evaluate('JSON.stringify(getStats(records, daily.dateKey))'));
    },
  };
}

function solvedState(puzzle) {
  let state = engine.createGame(puzzle);
  for (let row = 0; row < puzzle.rows.length; row++) {
    const placement = engine.findHint(puzzle, state);
    assert.ok(placement);
    const result = engine.submitPlacement(puzzle, state, placement);
    assert.equal(result.accepted, true);
    state = result.state;
  }
  assert.equal(state.status, 'won');
  return state;
}

test('denied storage reads and writes retain current progress when Daily is reselected', () => {
  const storage = createStorage();
  storage.denyReads = true;
  storage.denyWrites = true;
  const app = openApp(storage);
  app.placeFit();
  const before = app.state();
  assert.equal(before.attempts, 1);
  assert.equal(before.placements.filter(Boolean).length, 1);

  app.click('daily-tab');

  assert.deepEqual(app.state(), before);
  assert.equal(storage.values.size, 0, 'This progress must survive without a persisted save');
});

test('a quota failure preserves newer progress over a readable stale save and later recovers', () => {
  const storage = createStorage();
  const app = openApp(storage);
  app.placeFit();
  assert.equal(JSON.parse(storage.values.get(app.dailyKey)).attempts, 1);

  storage.denyWrites = true;
  app.placeFit();
  const unsaved = app.state();
  assert.equal(unsaved.attempts, 2);
  assert.equal(JSON.parse(storage.values.get(app.dailyKey)).attempts, 1, 'The persisted value is intentionally stale');

  app.click('daily-tab');
  assert.deepEqual(app.state(), unsaved, 'A readable older save must not roll back the unsaved game');

  storage.denyWrites = false;
  app.placeFit();
  assert.equal(app.state().attempts, 3);
  assert.deepEqual(JSON.parse(storage.values.get(app.dailyKey)), app.state());
  assert.deepEqual(openApp(storage).state(), app.state(), 'A fresh app must restore the successfully recovered save');
});

test('a terminal daily reconciles missing, malformed, or invalid result records on reload', () => {
  const daily = engine.getDaily(PUZZLES);
  const finished = solvedState(daily.puzzle);
  const invalidRecord = JSON.stringify({
    [daily.dateKey]: { status: 'won', attempts: 0, hints: 0 },
  });
  for (const existingRecords of [undefined, '{broken json', invalidRecord]) {
    const entries = [[PREFIX + 'daily:' + daily.dateKey, JSON.stringify(finished)]];
    if (existingRecords !== undefined) entries.push([PREFIX + 'records', existingRecords]);
    const storage = createStorage(entries);
    const app = openApp(storage);

    assert.deepEqual(app.state(), finished);
    assert.equal(app.stats().played, 1);
    assert.equal(app.stats().won, 1);
    assert.equal(app.stats().perfect, 1);
    assert.deepEqual(JSON.parse(storage.values.get(PREFIX + 'records'))[daily.dateKey], {
      status: 'won', attempts: 6, hints: 0,
    });

    app.click('daily-tab');
    app.click('stats-button');
    assert.equal(app.stats().played, 1, 'Reconciliation must not count a completed daily twice');
  }
});

test('a sequential stale-tab action cannot replace the first won or revealed daily result', () => {
  for (const terminal of ['won', 'revealed']) {
    const storage = createStorage();
    const firstTab = openApp(storage);
    const staleTab = openApp(storage);
    if (terminal === 'revealed') firstTab.reveal();
    else for (let row = 0; row < firstTab.puzzle.rows.length; row++) firstTab.placeFit();
    const finished = firstTab.state();
    const firstRecords = storage.values.get(PREFIX + 'records');
    assert.equal(finished.status, terminal);
    assert.equal(staleTab.state().status, 'playing', 'The second tab deliberately has stale state');

    staleTab.placeFit();

    assert.deepEqual(staleTab.state(), finished);
    assert.deepEqual(JSON.parse(storage.values.get(firstTab.dailyKey)), finished);
    assert.equal(storage.values.get(PREFIX + 'records'), firstRecords);
  }
});
