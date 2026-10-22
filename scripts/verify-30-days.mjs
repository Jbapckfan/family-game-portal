#!/usr/bin/env node
/** Exercise the actual daily selectors, including bundled TypeScript engines. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {GAMES} from '../games/daily/catalog.mjs';
import {dailyIndex, dayNumber} from '../games/deepseek-runtime/core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const start = args.find(arg=>!arg.startsWith('--')) ?? '2026-10-23';
if (args.some(arg=>arg.startsWith('--') && arg!=='--write') || !/^\d{4}-\d{2}-\d{2}$/.test(start) || new Date(`${start}T12:00:00Z`).toISOString().slice(0,10)!==start) throw new Error('Usage: node scripts/verify-30-days.mjs [YYYY-MM-DD] [--write]');
const dates = Array.from({length:30},(_,offset)=>new Date(Date.parse(`${start}T12:00:00Z`)+offset*86400000).toISOString().slice(0,10));
const kimiRoot = path.join(root,'packages/kimi-pebbles');
const require = createRequire(path.join(kimiRoot,'package.json'));
let build;
try { ({build} = require('esbuild')); }
catch { throw new Error('Install the pinned Kimi development dependencies first: npm --prefix packages/kimi-pebbles ci'); }
const temporary = await mkdtemp(path.join(tmpdir(),'alford-daily-selectors-'));
const kimiFunctions = {cairn:'dailyPuzzle',morph:'dailyMorph',tangle:'dailyTangle',hunch:'dailyHunch',circuit:'dailyCircuit',quartet:'dailyQuartet'};
try {
  const output = path.join(temporary,'selectors.mjs');
  await build({
    stdin:{contents:Object.entries(kimiFunctions).map(([name,fn])=>`export {${fn} as ${name}} from './src/games/${name}/engine.ts';`).join('\n'),resolveDir:kimiRoot,sourcefile:'daily-selectors.ts'},
    outfile:output, bundle:true, platform:'node', format:'esm', logLevel:'silent',
    alias:{'@':path.join(kimiRoot,'src')},
    plugins:[{name:'local-raw-text',setup(api){
      api.onResolve({filter:/\?raw$/},args=>({path:args.path.startsWith('@/')?path.join(kimiRoot,'src',args.path.slice(2,-4)):path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw-text'}));
      api.onLoad({filter:/.*/,namespace:'raw-text'},async args=>({contents:await readFile(args.path,'utf8'),loader:'text'}));
    }}],
  });
  const kimi = await import(pathToFileURL(output).href);
  const games=[];
  for (const game of GAMES) {
    let select;
    if (game.creator==='Kimi') {
      select=date=>{const value=kimi[game.slug.slice(5)](dayNumber(date));return `${game.slug}:${value.puzzleNo}`;};
    } else {
      const {PUZZLES}=await import(pathToFileURL(path.join(root,'games',game.slug,'puzzles.mjs')).href);
      if (game.creator==='ChatGPT') {
        const {getDaily}=await import(pathToFileURL(path.join(root,'games',game.slug,'engine.mjs')).href);
        select=date=>getDaily(PUZZLES,new Date(`${date}T18:00:00Z`)).puzzle.id;
      } else select=date=>PUZZLES[dailyIndex(game.slug,date,PUZZLES.length)].id;
    }
    const selections=dates.map(date=>({date,puzzleId:select(date)}));
    const distinct=new Set(selections.map(value=>value.puzzleId)).size;
    assert.equal(distinct,30,`${game.slug}: a daily puzzle ID repeats inside the 30-day window`);
    games.push({slug:game.slug,name:game.name,distinctDailyPuzzles:distinct,selections});
  }
  assert.equal(games.length,32);
  const report={start:dates[0],end:dates.at(-1),days:30,gameCount:32,totalDailySelections:960,allSelectorsExecuted:true,games};
  if (args.includes('--write')) await writeFile(path.join(root,'docs/daily-runway.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Verified ${games.length} actual daily selectors: 30 distinct puzzle IDs each, ${report.totalDailySelections} daily selections, ${report.start} through ${report.end}.`);
  console.log('This certifies daily scheduling; editorial novelty and human difficulty require the separate content/play reviews.');
} finally { await rm(temporary,{recursive:true,force:true}); }
