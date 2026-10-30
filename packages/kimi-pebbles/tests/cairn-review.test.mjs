import test from 'node:test';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
for(const scenario of ['hint','skip','stale','added'])test(`Cairn UI ${scenario}: scored decisions and added-letter explanation`,()=>{
 execFileSync(process.execPath,['--import','tsx',fileURLToPath(new URL('./helpers/cairn-review-dom.mjs',import.meta.url)),scenario],{cwd:fileURLToPath(new URL('..',import.meta.url)),stdio:'pipe'});
});
