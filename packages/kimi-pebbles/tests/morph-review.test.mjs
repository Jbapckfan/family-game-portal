import test from 'node:test';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
for(const scenario of ['hint','skip','restart','stale','saved','palette'])test(`Morph UI ${scenario}: confirmed actions and keyboard palette`,()=>{
 execFileSync(process.execPath,['--import','tsx',fileURLToPath(new URL('./helpers/morph-review-dom.mjs',import.meta.url)),scenario],{cwd:fileURLToPath(new URL('..',import.meta.url)),stdio:'pipe'});
});
