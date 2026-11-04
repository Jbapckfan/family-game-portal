// Local-only ephemeral D1 smoke. No cloud account, credential, or deployment.
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import {readFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const {outputFiles}=await build({stdin:{contents:"import {handleFeedback} from './lib/feedback.mjs'; export default {fetch(request,env){return handleFeedback(request,env.DB)}}",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',write:false});
const persist=await mkdtemp(path.join(tmpdir(),'alford-feedback-d1-'));
const mf=new Miniflare({modules:true,script:outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],d1Persist:persist});
try {
 const db=await mf.getD1Database('DB');
 await db.prepare(await readFile('drizzle/0000_feedback.sql','utf8')).run();
 const send=()=>mf.dispatchFetch('http://private.example/api/feedback',{method:'POST',headers:{'content-type':'application/json','oai-authenticated-user-id':'local-synthetic-owner',origin:'http://private.example'},body:JSON.stringify({id:'59e3a7c2-2e25-4697-9d0c-58be556027de',slug:'counterpart',text:'Synthetic local receiver verification.'})});
 const first=await send();assert.equal(first.status,201);const receipt=await first.json();assert.equal(receipt.received,true);
 const second=await send();assert.equal(second.status,200);assert.deepEqual(await second.json(),receipt);
 const stored=await db.prepare('SELECT id, game_slug, text, received_at FROM feedback').all();
 assert.equal(stored.results.length,1);assert.equal(stored.results[0].received_at,receipt.receipt.receivedAt);
 console.log(JSON.stringify({localD1:true,firstStatus:201,retryStatus:200,storedRows:stored.results.length,receipt,persist},null,2));
} finally {await mf.dispose();}
