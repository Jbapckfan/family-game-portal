import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatchController, STORAGE_KEY } from '../app.mjs';
import { createGame, playMove, saveMatch } from '../engine.mjs';

function harness({saved = null, inaccessible = false, choose, sharedStorage} = {}) {
  let value = saved;
  const tasks = [];
  const storage = sharedStorage || {
    getItem() { if (inaccessible) throw new Error('blocked'); return value; },
    setItem(key, next) { if (inaccessible) throw new Error('quota'); assert.equal(key,'alford:tic-tac-toe:v1:match'); value = next; },
  };
  const controller = createMatchController({getStorage:() => storage, schedule:callback => { tasks.push(callback); return tasks.length; }, cancel:() => {}, choose});
  return {controller,tasks,saved:() => value};
}

test('human input is blocked during AI turn and saves resume that exact turn', () => {
  const {controller,tasks,saved} = harness();
  controller.start();
  assert.equal(controller.move(4,0), true);
  assert.equal(controller.move(0,1), false);
  assert.equal(controller.view.state.history.length, 1);
  const resumed = harness({saved:saved()});
  resumed.controller.start();
  assert.equal(resumed.controller.view.state.turn, 'O');
  resumed.tasks[0]();
  assert.equal(resumed.controller.view.state.turn, 'X');
  assert.equal(resumed.controller.view.state.history.length, 2);
  assert.equal(tasks.length, 1);
});

test('an old AI callback cannot play after restart even if cancellation is unavailable', () => {
  const {controller,tasks} = harness();
  controller.start();
  controller.move(4,0);
  controller.restart();
  tasks[0]();
  assert.equal(controller.view.state.history.length, 0);
  assert.equal(controller.view.state.turn, 'X');
});

test('a restart triggered during AI evaluation also discards its stale result', () => {
  let controller;
  const setup = harness({choose:() => { controller.restart(); return {move:{board:0,cell:0}}; }});
  controller = setup.controller;
  controller.start();
  controller.move(4,0);
  setup.tasks[0]();
  assert.equal(controller.view.state.history.length, 0);
});

test('storage failure keeps a playable match in memory with a visible warning', () => {
  const {controller,tasks} = harness({inaccessible:true});
  controller.start();
  assert.match(controller.view.warning, /sav/i);
  controller.move(4,0);
  tasks[0]();
  assert.equal(controller.view.state.history.length, 2);
  assert.match(controller.view.warning, /sav/i);
});

test('corrupt saves create a fresh match with a recovery warning', () => {
  for (const saved of ['{not json}', JSON.stringify({version:1,skill:'casual',guideDismissed:true,history:[{board:0,cell:0},{board:2,cell:1}]})]) {
    const {controller} = harness({saved});
    assert.equal(controller.view.state.history.length, 0);
    assert.match(controller.view.warning, /saved match/i);
  }
});

test('skill and skipped guide persist without clearing an active match', () => {
  const {controller,saved} = harness();
  controller.start();
  assert.equal(controller.setSkill('casual'), true);
  controller.dismissGuide();
  controller.move(4,0);
  assert.equal(controller.setSkill('tactical'), false);
  const resumed = harness({saved:saved()}).controller;
  assert.equal(resumed.view.skill, 'casual');
  assert.equal(resumed.view.guideDismissed, true);
  assert.equal(resumed.view.state.history.length, 1);
  assert.equal(STORAGE_KEY,'alford:tic-tac-toe:v1:match');
});

test('a bad AI candidate falls back to a legal move without losing the match', () => {
  const {controller,tasks} = harness({choose:() => ({move:{board:9,cell:9}})});
  controller.start();
  controller.move(4,0);
  tasks[0]();
  assert.equal(controller.view.state.history.length, 2);
  assert.equal(controller.view.state.history[1].board, 0);
  assert.equal(controller.view.state.turn, 'X');
});

test('a restored human turn stays ready without adding an AI move', () => {
  let state = playMove(createGame(), {board:4,cell:0});
  state = playMove(state,{board:0,cell:3});
  const {controller,tasks} = harness({saved:JSON.stringify(saveMatch(state))});
  controller.start();
  assert.equal(controller.view.state.forcedBoard, 3);
  assert.equal(controller.view.state.history.length, 2);
  assert.equal(tasks.length, 0);
});

function sharedSave() {
  let raw = null;
  return {getItem:() => raw, setItem:(key,value) => { assert.equal(key,STORAGE_KEY); raw = value; }};
}

test('an AI queued in another window cannot overwrite a restarted saved match', () => {
  const storage = sharedSave();
  const first = harness({sharedStorage:storage});
  first.controller.start();
  first.controller.move(4,0);
  const second = harness({sharedStorage:storage});
  second.controller.start();
  second.controller.restart();
  const restartedSave = storage.getItem(STORAGE_KEY);
  first.tasks[0]();
  assert.equal(storage.getItem(STORAGE_KEY), restartedSave);
  assert.equal(JSON.parse(restartedSave).history.length, 0);
  assert.equal(first.controller.view.state.history.length, 1);
  assert.equal(first.controller.view.conflicted, true);
  assert.match(first.controller.view.warning, /another window/i);
  assert.match(first.controller.view.warning, /reload/i);
});

test('stale human moves and settings cannot replace another window saved match', () => {
  for (const action of [controller => controller.move(4,1), controller => controller.restart(), controller => controller.setSkill('casual'), controller => controller.dismissGuide()]) {
    const storage = sharedSave();
    const first = harness({sharedStorage:storage});
    const second = harness({sharedStorage:storage});
    first.controller.start();
    second.controller.start();
    second.controller.move(4,0);
    const currentSave = storage.getItem(STORAGE_KEY);
    assert.equal(action(first.controller), false);
    assert.equal(storage.getItem(STORAGE_KEY), currentSave);
    assert.equal(first.controller.view.conflicted, true);
    assert.equal(first.controller.move(4,2), false);
  }
});

test('a save changed during AI evaluation is checked again before writing', () => {
  const storage = sharedSave();
  let second;
  const first = harness({sharedStorage:storage,choose:() => { second.controller.restart(); return {move:{board:0,cell:0}}; }});
  first.controller.start();
  first.controller.move(4,0);
  second = harness({sharedStorage:storage});
  second.controller.start();
  first.tasks[0]();
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).history.length, 0);
  assert.equal(first.controller.view.conflicted, true);
});

test('quota failure continues memory-only play without becoming a save conflict', () => {
  const storage = {getItem:() => null,setItem:() => { throw new Error('quota'); }};
  const {controller,tasks} = harness({sharedStorage:storage});
  controller.start();
  assert.equal(controller.move(4,0), true);
  tasks[0]();
  assert.equal(controller.view.state.history.length, 2);
  assert.equal(controller.view.conflicted, false);
  assert.match(controller.view.warning, /cannot save/i);
});

test('unreadable storage never receives an unverified memory-only write', () => {
  let persisted = 'an inaccessible existing save';
  const storage = {getItem:() => { throw new Error('read blocked'); },setItem:(key,value) => { persisted = value; }};
  const {controller,tasks} = harness({sharedStorage:storage});
  controller.start();
  controller.move(4,0);
  tasks[0]();
  assert.equal(controller.view.state.history.length, 2);
  assert.equal(persisted, 'an inaccessible existing save');
  assert.equal(controller.view.conflicted, false);
});

test('route previews grant free choice when a move closes its own destination', async () => {
  const {moveRoute} = await import('../app.mjs');
  const winning = createGame();
  winning.forcedBoard = 3;
  winning.cells[3] = ['X',null,null,null,null,null,'X',null,null];
  const drawn = createGame();
  drawn.forcedBoard = 8;
  drawn.cells[8] = ['X','O','X','X','O','O','O','X',null];
  for (const [state,board] of [[winning,3],[drawn,8]]) {
    assert.equal(playMove(state,{board,cell:board}).forcedBoard,null);
    assert.equal(moveRoute(state,board,board).destination,null);
    assert.match(moveRoute(state,board,board).text,/closed.*any open board/i);
  }
});

test('a terminal move preview never promises another opponent turn', async () => {
  const {moveRoute} = await import('../app.mjs');
  const state = createGame();
  state.forcedBoard = 2;
  state.boards[0] = state.boards[1] = 'X';
  state.cells[2] = ['X','X',null,null,null,null,null,null,null];
  assert.equal(moveRoute(state,2,2).destination,null);
  assert.match(moveRoute(state,2,2).text,/ends the match/);
  assert.equal(moveRoute(createGame(),4,0).destination,0);
});
