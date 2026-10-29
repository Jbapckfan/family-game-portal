import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { PUZZLES } from '../puzzles.mjs';
import * as rules from '../engine.mjs';

const slug = 'counterpart';
const isCounterpart = slug === 'counterpart';
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function openApp(saved = memoryStorage(), session = memoryStorage()) {
  const nodes = new Map();
  const node = name => {
    if (!nodes.has(name)) {
      const events = new Map();
      nodes.set(name, { textContent:'', innerHTML:'', value:'', dataset:{}, open:false, disabled:false,
        classList:{add(){},toggle(){}}, setAttribute(){}, querySelector(){return null;},
        focus(){}, scrollIntoView(){}, getClientRects(){return [{}];},
        getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100};},
        showModal(){this.open=true;},close(){this.open=false;},
        addEventListener(type, fn){events.set(type, fn);},
        emit(type, event){events.get(type)?.({preventDefault(){},...event});},
      });
    }
    return nodes.get(name);
  };
  const now = new Date('2026-10-20T12:00:00Z');
  const engine = {...rules, getDaily: items => rules.getDaily(items, now), getDateKey: () => rules.getDateKey(now)};
  const context = createContext({PUZZLES, engine, localStorage:saved, sessionStorage:session,
    document:{getElementById:node, querySelector:node, addEventListener(){}, documentElement:{dataset:{}}, body:node('body')},
    window:{addEventListener(){}}, navigator:{}, location:{pathname:`/games/${slug}/`},
    CSS:{escape:value=>value}, matchMedia:()=>({matches:true}), requestAnimationFrame:fn=>fn(),
    setTimeout:()=>1, clearTimeout(){}, setInterval:()=>1,
  });
  runInContext(readFileSync(new URL('../shell.mjs',import.meta.url),'utf8').replace(/^export /gm,''), context);
  runInContext(readFileSync(new URL('../app.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,''), context);
  function dispatch(attribute, value) {
    node('dialog-content').emit('click',{target:{closest:selector => selector===`[${attribute}]` ? {dataset:{[attribute.slice(5)]:String(value)}} : null}});
  }
  return {saved,session,node,app:runInContext('app',context),
    practice:index=>dispatch('data-practice',index), action:action=>dispatch('data-action',action)};
}
function seedDraft(session, puzzle, mode='practice') {
  const key = `${slug}:ui:v1:${mode}:${puzzle.id}`;
  const draft = isCounterpart ? {rows:[puzzle.rows[0].answer],row:0,slot:1}
    : {nounId:puzzle.pairs[0].nounId,verbId:puzzle.pairs[0].verbId,draft:'unfinished'};
  session.setItem(key,JSON.stringify(draft));
  return key;
}
function hasDraft(app) {
  return isCounterpart ? app.node('bank').innerHTML.includes('word-tile selected')
    : app.node('answer-input').value === 'unfinished';
}

test('practice restart discards an unsent draft through the real app and stays clear after reloading', () => {
  const session=memoryStorage(), saved=memoryStorage();
  seedDraft(session,PUZZLES[1]);
  const dailyKey=seedDraft(session,PUZZLES[0],'2026-10-20'), dailyBefore=session.getItem(dailyKey);
  const first=openApp(saved,session); first.practice(1);
  assert.equal(hasDraft(first),true,'the saved draft must first be visible');
  first.action('restart');
  assert.equal(hasDraft(first),false,'restart must clear the visible draft');
  assert.equal(first.app.game.attempts,0);
  assert.equal(session.getItem(dailyKey),dailyBefore,'daily draft must remain untouched');
  const reopened=openApp(saved,session); reopened.practice(1);
  assert.equal(hasDraft(reopened),false,'an old session draft must not resurrect on reload');
});

test('switching practice boards keeps their unsent drafts until an explicit restart', () => {
  const session=memoryStorage(); seedDraft(session,PUZZLES[1]);
  const app=openApp(memoryStorage(),session); app.practice(1);
  assert.equal(hasDraft(app),true); app.practice(2); app.practice(1);
  assert.equal(hasDraft(app),true);
});

test('a stale practice restart adopts newer progress without discarding its local draft', () => {
  const saved=memoryStorage(), session=memoryStorage();
  const key=seedDraft(session,PUZZLES[1]);
  const stale=openApp(saved,session); stale.practice(1);
  const before=session.getItem(key);
  const latest=openApp(saved,memoryStorage()); latest.practice(1);
  latest.app.commit(rules.submitPair(PUZZLES[1],latest.app.game,{row:1,tileIds:PUZZLES[1].rows[1].answer}).state);
  stale.action('restart');
  assert.equal(stale.app.game.attempts,1);
  assert.equal(session.getItem(key),before,'the canceled restart must leave the draft saved');
  assert.equal(hasDraft(stale),true);
  stale.action('restart');
  assert.equal(stale.app.game.attempts,0);
  assert.equal(hasDraft(stale),false);
});
