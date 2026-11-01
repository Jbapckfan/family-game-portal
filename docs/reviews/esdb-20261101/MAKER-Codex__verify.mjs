import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url),data=new URL('../../packages/kimi-pebbles/data/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('MAKER-Codex__download-manifest.json',here),'utf8'));
for(const receipt of manifest.files){const bytes=await readFile(new URL(receipt.file,here));assert.equal(bytes.length,receipt.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),receipt.sha256);}
const lower=w=>/^[a-z]+$/.test(w),base=new Set();
for(const [name,kind]of [['english-words-alpha.txt','plain'],['wordnik-game-words.txt','quoted'],['enable2k.txt.gz','gzip']]){const raw=await readFile(new URL(name,data)),text=kind==='gzip'?gunzipSync(raw).toString():raw.toString();for(const line of text.split(/\r?\n/)){if(!line)continue;const w=kind==='quoted'?JSON.parse(line):line;if(lower(w))base.add(w);}}
for(const w of JSON.parse(await readFile(new URL('zynga-disclosed-words.json',data),'utf8')).words)base.add(w);
assert.equal(base.size,409097);
const union=new Set(),largeLists=['en_US-large.txt','en_GB-large.txt','en_CA-large.txt','en_AU-large.txt'];
for(const name of largeLists)for(const w of (await readFile(new URL('current/'+name,here),'utf8')).split(/\r?\n/))if(lower(w))union.add(w);
const additions=[...union].filter(w=>!base.has(w));assert.equal(additions.length,5186);assert.ok(union.has('emoji')&&union.has('emojis')&&union.has('twerk')&&union.has('twerking'));
const count=words=>Object.fromEntries([3,4,5,6,7].map(n=>[n,[...words].filter(w=>w.length===n).length]));
const result={allDownloadedHashesVerified:manifest.files.length,baselineWords:base.size,supplementWords:union.size,additions:additions.length,newUnionWords:new Set([...base,...union]).size,baselineCounts3to7:count(base),supplementCounts3to7:count(union),newUnionCounts3to7:count(new Set([...base,...union])),additionCounts3to7:count(additions)};
await writeFile(new URL('MAKER-Codex__independent-verification.json',here),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
