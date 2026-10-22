#!/usr/bin/env node
/** Audit the actual installed banks rather than relying on catalog labels. */
import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {GAMES} from '../games/daily/catalog.mjs';

export async function puzzleInventory() {
  const games=[];
  for(const game of GAMES){
    let puzzles;
    if(game.runtime==='kimi'){
      const name=game.slug.slice(5),file=name==='hunch'?'answers':'puzzles';
      puzzles=JSON.parse(await readFile(new URL(`../packages/kimi-pebbles/src/games/${name}/data/${file}.json`,import.meta.url),'utf8'));
    }else ({PUZZLES:puzzles}=await import(new URL(`../games/${game.slug}/puzzles.mjs`,import.meta.url)));
    if(!Array.isArray(puzzles)||puzzles.length<120)throw Error(`${game.slug}: at least 120 playable puzzles are required`);
    if(game.runtime!=='kimi'&&new Set(puzzles.map(p=>p.id)).size!==puzzles.length)throw Error(`${game.slug}: duplicate puzzle IDs`);
    if(game.boards!==puzzles.length)throw Error(`${game.slug}: catalog says ${game.boards}, actual bank has ${puzzles.length}`);
    games.push({slug:game.slug,name:game.name,creator:game.creator,puzzles:puzzles.length});
  }
  return {gameCount:games.length,totalPuzzles:games.reduce((sum,game)=>sum+game.puzzles,0),minimumPerGame:Math.min(...games.map(game=>game.puzzles)),games};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const inventory=await puzzleInventory(),json=JSON.stringify(inventory,null,2)+'\n';
  if(process.argv.slice(2).join(' ')==='--write')await writeFile(new URL('../docs/puzzle-inventory.json',import.meta.url),json);
  else if(process.argv.length>2)throw Error('Usage: node scripts/puzzle-inventory.mjs [--write]');
  console.log(json.trimEnd());
}
