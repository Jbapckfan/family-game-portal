import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('real Tangle hook preserves a same-day older-client save across reload',()=>{
 const run=spawnSync(process.execPath,[fileURLToPath(new URL('./helpers/tangle-legacy-dom.mjs',import.meta.url))],{encoding:'utf8',timeout:15000});
 assert.equal(run.status,0,run.stdout+run.stderr);
});
