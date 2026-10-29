import {createRequire} from 'node:module';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {GAMES} from '../games/daily/catalog.mjs';
import {dailyIndex, dayNumber} from '../games/deepseek-runtime/core.mjs';
import {kimiContentKey} from './kimi-content-signatures.mjs';

export const root = path.resolve(import.meta.dirname, '..');
export function calendarDates(start, endExclusive) {
  const valid = key => /^\d{4}-\d{2}-\d{2}$/.test(key) && new Date(`${key}T12:00:00Z`).toISOString().slice(0,10) === key;
  if (!valid(start) || !valid(endExclusive) || endExclusive <= start) throw Error('Invalid calendar interval');
  const dates = [];
  for (let time = Date.parse(`${start}T12:00:00Z`); time < Date.parse(`${endExclusive}T12:00:00Z`); time += 86400000) dates.push(new Date(time).toISOString().slice(0,10));
  return dates;
}

/** Load production selectors, including Vite's actual TypeScript/raw-text inputs. */
export async function loadDailyAudit() {
  const {substantiveSignature} = await import('./imported-content-signatures.mjs');
  const {claudePuzzleSignature} = await import('./claude-puzzle-signatures.mjs');
  const kimiRoot = path.join(root,'packages/kimi-pebbles');
  const {build} = createRequire(path.join(kimiRoot,'package.json'))('esbuild');
  const temporary = await mkdtemp(path.join(tmpdir(),'alford-six-month-selectors-'));
  const cleanup = () => rm(temporary,{recursive:true,force:true});
  try {
    const functions = {cairn:'dailyPuzzle',morph:'dailyMorph',tangle:'dailyTangle',hunch:'dailyHunch',circuit:'dailyCircuit',quartet:'dailyQuartet'};
    const output = path.join(temporary,'selectors.mjs');
    await build({
      stdin:{contents:Object.entries(functions).map(([name,fn])=>`export {${fn} as ${name}} from './src/games/${name}/engine.ts';`).join('\n'),resolveDir:kimiRoot,sourcefile:'six-month-selectors.ts'},
      outfile:output,bundle:true,platform:'node',format:'esm',logLevel:'silent',alias:{'@':path.join(kimiRoot,'src')},
      plugins:[{name:'local-raw-text',setup(api){
        api.onResolve({filter:/\?raw$/},args=>({path:args.path.startsWith('@/')?path.join(kimiRoot,'src',args.path.slice(2,-4)):path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw-text'}));
        api.onLoad({filter:/.*/,namespace:'raw-text'},async args=>({contents:await readFile(args.path,'utf8'),loader:'text'}));
      }}],
    });
    const kimi = await import(pathToFileURL(output).href), games = [];
    for (const game of GAMES) {
      let puzzles, key, select;
      if (game.creator === 'Kimi') {
        const name = game.slug.slice(5);
        puzzles = JSON.parse(await readFile(path.join(kimiRoot,`src/games/${name}/data/${name === 'hunch' ? 'answers' : 'puzzles'}.json`),'utf8'));
        key = puzzle => kimiContentKey(name,puzzle);
        select = date => {
          const value = kimi[name](dayNumber(date));
          return {index:value.puzzleNo-1,puzzleId:`${game.slug}:${value.puzzleNo}`,puzzle:value.puzzle ?? value.answer};
        };
      } else {
        ({PUZZLES:puzzles} = await import(pathToFileURL(path.join(root,'games',game.slug,'puzzles.mjs')).href));
        if (game.creator === 'ChatGPT') {
          ({substantiveKey:key} = await import(pathToFileURL(path.join(root,'games',game.slug,'content-identity.mjs')).href));
          const {getDaily} = await import(pathToFileURL(path.join(root,'games',game.slug,'engine.mjs')).href);
          select = date => { const {puzzle} = getDaily(puzzles,new Date(`${date}T18:00:00Z`)); return {index:puzzles.indexOf(puzzle),puzzleId:puzzle.id,puzzle}; };
        } else {
          key = puzzle => game.creator === 'Claude' ? claudePuzzleSignature(game.slug,puzzle) : substantiveSignature(game.slug,puzzle);
          select = date => { const index=dailyIndex(game.slug,date,puzzles.length),puzzle=puzzles[index];return {index,puzzleId:puzzle.id,puzzle}; };
        }
      }
      games.push({...game,puzzles,key,select});
    }
    return {games,cleanup};
  } catch (error) { await cleanup(); throw error; }
}
