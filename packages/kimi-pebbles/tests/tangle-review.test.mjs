import test from 'node:test';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
for(const scenario of ['outside','secondary','stale','assistive','clue','burst','resolved','contextmenu'])test(`Tangle UI ${scenario}: safe path and clue interaction`,()=>{
 execFileSync(process.execPath,['--import','tsx',fileURLToPath(new URL('./helpers/tangle-review-dom.mjs',import.meta.url)),scenario],{cwd:fileURLToPath(new URL('..',import.meta.url)),stdio:'pipe'});
});
