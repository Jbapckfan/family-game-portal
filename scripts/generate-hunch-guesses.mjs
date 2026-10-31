import {readFile,writeFile} from 'node:fs/promises';
import {loadTangleLexicon} from './tangle-lexicon.mjs';
const data=new URL('../packages/kimi-pebbles/src/games/hunch/data/',import.meta.url),answers=JSON.parse(await readFile(new URL('answers.json',data),'utf8')),lexicon=await loadTangleLexicon();
const guesses=[...lexicon.words].filter(word=>/^[a-z]{5}$/.test(word)).sort();
for(const answer of answers)if(!guesses.includes(answer))throw new Error('Published Hunch answer is absent from the pinned dictionary');
await writeFile(new URL('guesses.json',data),JSON.stringify(guesses)+'\n');
console.log(JSON.stringify({guesses:guesses.length,answers:answers.length,sources:lexicon.sources}));
