/** Verification-only reader. Deliberately does not import the generation source loader. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
export function independentlyReadModernWords(data){
 const meta=JSON.parse(readFileSync(new URL('esdb-word-source.json',data),'utf8')),words=new Set();
 for(const [name,pin] of Object.entries(meta.files)){
  const bytes=readFileSync(new URL('esdb/'+name,data));assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256,name);
  for(const word of bytes.toString('utf8').split(/\r?\n/))if(/^[a-z]+$/.test(word))words.add(word);
 }
 for(const pin of [meta.copyright,meta.reviewedCorrections]){const bytes=readFileSync(new URL(pin.file,data));assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256,pin.file);}
 const corrections=JSON.parse(readFileSync(new URL(meta.reviewedCorrections.file,data),'utf8'));
 for(const word of corrections.words){assert.match(word,/^[a-z]+$/);words.add(word);}
 return [...words];
}
