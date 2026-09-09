import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const units=readdirSync(root+'test').filter(f=>f.endsWith('.test.mjs')).map(f=>'test/'+f);
for(const args of [['--test',...units],['validate-levels.mjs'],['test/ui.playwright.mjs'],['test/render.smoke.mjs'],['test/motion.frames.mjs'],['test/art.playwright.mjs'],['test/release.playwright.mjs']]) {
 const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
