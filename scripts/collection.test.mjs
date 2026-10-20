import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GAMES,filterGames,gameURL} from '../games/daily/catalog.mjs';
import {readKimiStatus,readDailyStatus} from '../games/daily/app.mjs';
const now = new Date('2026-10-20T18:00:00Z');
const store = values => ({getItem:key=>values[key]===undefined?null:JSON.stringify(values[key])});

test('one collection preserves all eight original IDs and credits the six imported games separately',()=>{
  assert.equal(GAMES.length,14); assert.equal(new Set(GAMES.map(g=>g.slug)).size,14);
  assert.deepEqual(filterGames('ChatGPT').map(g=>g.slug),['ringcount','switchpath','counterpart','shortlist','second-sense','sideways','tradeoff','inbetween']);
  assert.deepEqual(filterGames('Kimi').map(g=>g.slug),['kimi-cairn','kimi-morph','kimi-tangle','kimi-hunch','kimi-circuit','kimi-quartet']);
  assert.equal(filterGames('All').length,14);
  assert.equal(gameURL('kimi-cairn','../','https://example.test/games/daily/'),'https://example.test/games/kimi-cairn/');
});
test('imported home results distinguish wins, reveals, losses, practice, and unavailable storage',()=>{
  const slug='kimi-hunch',date='2026-10-20';
  assert.equal(readKimiStatus({slug,storage:store({}),now}).status,'new');
  assert.equal(readKimiStatus({slug,storage:store({[`${slug}:v1:status:${date}`]:{status:'playing'}}),now}).status,'playing');
  for(const status of ['won','lost','revealed']) assert.equal(readKimiStatus({slug,storage:store({[`${slug}:v1:records`]:{[date]:{status}}}),now}).status,status);
  assert.equal(readKimiStatus({slug,storage:store({[`${slug}:v1:practice:1`]:{status:'won'}}),now}).status,'new');
  assert.equal(readKimiStatus({slug,storage:{getItem(){throw new Error('blocked');}},now}).status,'unavailable');
  assert.equal(readKimiStatus({slug,storage:{getItem(){return '{bad';}},now}).status,'new');
});
test('all existing engines still read their original saved-result keys',async()=>{
  for(const game of filterGames('ChatGPT')){
    const engine=await import(`../games/${game.slug}/engine.mjs`);
    const {PUZZLES}=await import(`../games/${game.slug}/puzzles.mjs`);
    const daily=engine.getDaily(PUZZLES,now);
    const original=engine.createGame(daily.puzzle);
    const storage=store({[`${game.slug}:v1:daily:${daily.dateKey}`]:original});
    assert.equal(readDailyStatus({slug:game.slug,engine,puzzles:PUZZLES,storage,now}).status,'new',game.slug);
    const keys=[];readDailyStatus({slug:game.slug,engine,puzzles:PUZZLES,storage:{getItem(key){keys.push(key);return null;}},now});
    assert.ok(keys.includes(`${game.slug}:v1:records`));
    assert.ok(keys.includes(`${game.slug}:v1:daily:${daily.dateKey}`));
  }
});
test('canonical documents expose each original developer and the Kimi archive remains unchanged',async()=>{
  for(const game of GAMES){
    const html=await readFile(new URL(`../games/${game.slug}/index.html`,import.meta.url),'utf8');
    assert.ok(html.includes(`data-game-creator="${game.creator}"`),game.slug);
    if(game.creator==='ChatGPT') assert.ok(html.includes('Developed by ChatGPT'),game.slug);
    else {assert.ok(html.includes(`data-game-id="${game.slug}"`));assert.ok(html.includes('../kimi-runtime/assets/'));}
  }
  const original=await readFile(new URL('../sources/kimi/original/Kimi_Agent_iOS_4-Game_Monetization.zip',import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'),'fa7f26863aef94f3fc85131e587312c1ddafcf0fd2f9f053095d4b7b2a8a9c17');
});
