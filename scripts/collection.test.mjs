import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GAMES,CREATORS,filterGames,gameURL} from '../games/daily/catalog.mjs';
import {readKimiStatus,readDailyStatus} from '../games/daily/app.mjs';
import {puzzleInventory} from './puzzle-inventory.mjs';
const now = new Date('2026-10-20T18:00:00Z');
const store = values => ({getItem:key=>values[key]===undefined?null:JSON.stringify(values[key])});

test('one collection preserves original IDs and all five creators without conflating concept and development credits',()=>{
  assert.equal(GAMES.length,32); assert.equal(new Set(GAMES.map(g=>g.slug)).size,32);
  assert.deepEqual(filterGames('ChatGPT').map(g=>g.slug),['ringcount','switchpath','counterpart','shortlist','second-sense','sideways','tradeoff','inbetween']);
  assert.deepEqual(filterGames('Kimi').map(g=>g.slug),['kimi-cairn','kimi-morph','kimi-tangle','kimi-hunch','kimi-circuit','kimi-quartet']);
  assert.deepEqual(CREATORS,['ChatGPT','Kimi','DeepSeek','Qwen','Claude']);
  for(const creator of ['DeepSeek','Qwen','Claude'])assert.equal(filterGames(creator).length,6);
  for(const game of filterGames('DeepSeek'))assert.equal(game.credit,'Concept by DeepSeek · Built by ChatGPT');
  for(const game of filterGames('Qwen'))assert.equal(game.credit,game.slug==='qwen-quadra'?'Developed by Qwen':'Concept by Qwen · Built by ChatGPT');
  for(const game of filterGames('Claude'))assert.equal(game.credit,'Developed by Claude');
  assert.deepEqual(GAMES.filter(g=>g.name==='Tangle').map(g=>[g.slug,g.creator]),[['kimi-tangle','Kimi'],['claude-tangle','Claude']]);
  assert.equal(filterGames('All').length,32);
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
test('canonical documents expose the credited creator and the correct isolated runtime',async()=>{
  for(const game of GAMES){
    const html=await readFile(new URL(`../games/${game.slug}/index.html`,import.meta.url),'utf8');
    assert.ok(html.includes(`data-game-creator="${game.creator}"`),game.slug);
    if(game.creator==='ChatGPT') assert.ok(html.includes('Developed by ChatGPT'),game.slug);
    else {assert.ok(html.includes(`data-game-id="${game.slug}"`));assert.ok(html.includes(game.creator==='Kimi'?'../kimi-runtime/assets/':'../deepseek-runtime/styles.css'),game.slug);}
  }
  const original=await readFile(new URL('../sources/kimi/original/Kimi_Agent_iOS_4-Game_Monetization.zip',import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'),'fa7f26863aef94f3fc85131e587312c1ddafcf0fd2f9f053095d4b7b2a8a9c17');
});
test('every supplied original is preserved byte for byte',async()=>{
  const originals=[
    ['deepseek/original/Pasted_text.txt','dba7a437663d14bf069464eab4b887d442d4adf644938efb7232e66fa6633a17'],
    ['deepseek/original/deepseek_swift_20261020_5e74c4.swift','15f27c27bc21b5320aa3a0a855279d83e200b53d2a2fe814711e708db4cf077e'],
    ['qwen/original/Pasted_text_1.txt','d1d510b2094701ef702bf71493d324c3283d9f7d296ab97604522e77f4b907a7'],
    ['claude/original/Foreword.zip','312ff2309fd09d9f342b4352b0d2dc59c0f8f48fcd4a619d23843ed66868ad29'],
  ];
  for(const [path,hash]of originals){const bytes=await readFile(new URL(`../sources/${path}`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,path);}
});
test('prepared counts match every modular imported bank',async()=>{
  for(const game of GAMES.filter(g=>['deepseek','qwen','claude'].includes(g.runtime))){const {PUZZLES}=await import(`../games/${game.slug}/puzzles.mjs`);assert.equal(PUZZLES.length,game.boards,game.slug);assert.equal(new Set(PUZZLES.map(p=>p.id)).size,PUZZLES.length,`${game.slug}: unique prepared IDs`);}
});
test('all 32 games have at least 120 available puzzles and the deployment inventory matches the banks',async()=>{
  const inventory=await puzzleInventory();
  assert.equal(inventory.gameCount,32);
  assert.ok(inventory.minimumPerGame>=120);
  const published=JSON.parse(await readFile(new URL('../docs/puzzle-inventory.json',import.meta.url),'utf8'));
  assert.deepEqual(inventory,published);
});
