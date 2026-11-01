/** Rebuild the shared dictionary directly from licensed, pinned sources at playable lengths. */
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {loadTangleLexicon} from './tangle-lexicon.mjs';
const root=new URL('../packages/kimi-pebbles/src/games/',import.meta.url),file=new URL('cairn/data/dict.txt',root),old=new Set((await readFile(file,'utf8')).split(/\r?\n/).filter(Boolean)),source=await loadTangleLexicon(),words=[...source.words].filter(w=>/^[a-z]{3,7}$/.test(w)).sort(),next=new Set(words),content=words.join('\n')+'\n';
for(const word of old)assert.ok(next.has(word),`Existing accepted word would be lost: ${word}`);
if(process.argv.includes('--check'))assert.equal(await readFile(file,'utf8'),content,'Shared vocabulary needs regeneration');else await writeFile(file,content);
console.log(JSON.stringify({previousWords:old.size,sourceWords:source.words.size,addedWords:words.length-old.size,acceptedWords:words.length,bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex'),sources:source.sources}));
