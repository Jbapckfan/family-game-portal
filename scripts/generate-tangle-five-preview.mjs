/** Regenerate only the sample using the same complete game lexicon as 4x4. */
import {readFile,writeFile} from 'node:fs/promises';
import {loadTangleLexicon,buildTangleTrie,solveTangleGrid} from './tangle-lexicon.mjs';
import {pointsFor} from '../packages/kimi-pebbles/src/games/tangle/progress.ts';
const outputURL=new URL('../packages/kimi-pebbles/src/games/tangle/data/five-preview.json',import.meta.url);
const previous=JSON.parse(await readFile(outputURL,'utf8')),lexicon=await loadTangleLexicon();
const words=solveTangleGrid(previous.g,buildTangleTrie(lexicon.words)),puzzle={g:previous.g,words,n:words.length,max:words.reduce((sum,w)=>sum+pointsFor(w),0)};
await writeFile(outputURL,JSON.stringify(puzzle,null,2)+'\n');
console.log(JSON.stringify({sources:lexicon.sources,unionWords:lexicon.words.size,words:puzzle.n,max:puzzle.max}));
