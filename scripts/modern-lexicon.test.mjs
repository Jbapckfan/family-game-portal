import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {loadTangleLexicon} from './tangle-lexicon.mjs';
const d=new URL('../packages/kimi-pebbles/data/',import.meta.url),meta=JSON.parse(await readFile(new URL('esdb-word-source.json',d),'utf8'));
const expected=new Set([...((await readFile(new URL('english-words-alpha.txt',d),'utf8')).split(/\s+/)),...((await readFile(new URL('wordnik-game-words.txt',d),'utf8')).split(/\r?\n/).filter(Boolean).map(s=>JSON.parse(s))),...gunzipSync(await readFile(new URL('enable2k.txt.gz',d))).toString().split(/\s+/),...JSON.parse(await readFile(new URL('zynga-disclosed-words.json',d),'utf8')).words].filter(w=>/^[a-z]+$/.test(w)));
test('the modern supplement retains exact official data and its complete matching notice',async()=>{
 assert.equal(meta.generatedCommit,'7f2f4078354752045ee16a041605686561122185');
 for(const [name,pin] of Object.entries(meta.files)){const b=await readFile(new URL('esdb/'+name,d));assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);for(const line of b.toString().split(/\r?\n/))if(/^[a-z]+$/.test(line))expected.add(line);}
 for(const pin of [meta.copyright,meta.reviewedCorrections]){const b=await readFile(new URL(pin.file,d));assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);}
 const notice=await readFile(new URL(meta.copyright.file,d),'utf8');assert.match(notice,/Copyright 2000-2026 by Kevin Atkinson/);assert.match(notice,/Copyright 2016 by Benjamin Titze/);
 for(const word of JSON.parse(await readFile(new URL(meta.reviewedCorrections.file,d),'utf8')).words)expected.add(word);
});
test('the real generation source contains the independently parsed modern union and known commonplace gaps',async()=>{
 // Rebuild independently here too; tests must not rely on execution order.
 for(const name of Object.keys(meta.files))for(const line of (await readFile(new URL('esdb/'+name,d),'utf8')).split(/\r?\n/))if(/^[a-z]+$/.test(line))expected.add(line);
 for(const word of JSON.parse(await readFile(new URL(meta.reviewedCorrections.file,d),'utf8')).words)expected.add(word);
 const actual=await loadTangleLexicon();assert.ok(actual.sources.every(source=>source.pinVerified),'every loaded source needs a required checksum');assert.equal(actual.words.size,expected.size);for(const word of expected)assert.ok(actual.words.has(word),word);
 for(const word of ['wifi','emoji','emojis','twerk','twerks','twerked','twerking','vape','vapes','chatbot','chatbots','kombucha','kombuchas','doomscroll','doomscrolled','doomscrolling','doomscrolls'])assert.ok(actual.words.has(word),word);
 assert.ok([...actual.words].every(w=>/^[a-z]+$/.test(w)),'no source capitalization, punctuation or accent normalization is invented');
});
