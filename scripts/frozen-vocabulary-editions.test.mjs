import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {vocabularyEditionPayloads} from './vocabulary-edition-payloads.mjs';
test('replayable published vocabulary payloads are frozen: new acceptance requires a new edition',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/vocabulary-editions.json',import.meta.url),'utf8'));
 assert.deepEqual(await vocabularyEditionPayloads(),manifest.payloads,'Do not regenerate a published replay dictionary in place. Add a new vocabulary edition, retain these payloads, and verify older saves.');
});
