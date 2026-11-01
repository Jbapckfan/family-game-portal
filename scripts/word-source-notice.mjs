import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
/** Supplemental notice shared by the build pipelines; never fetched at play time. */
export async function modernWordSourceNotice(){
 const data=new URL('../packages/kimi-pebbles/data/',import.meta.url),meta=JSON.parse(await readFile(new URL('esdb-word-source.json',data),'utf8')),bytes=await readFile(new URL(meta.copyright.file,data));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.copyright.sha256,'ESDB notice checksum');
 const correctionsBytes=await readFile(new URL(meta.reviewedCorrections.file,data));assert.equal(createHash('sha256').update(correctionsBytes).digest('hex'),meta.reviewedCorrections.sha256,'Reviewed correction checksum');
 const corrections=JSON.parse(correctionsBytes.toString());
 return `\n\nESDB supplemental English word sources\n${meta.repository}/tree/${meta.generatedCommit}\nCorresponding source: ${meta.sourceRepository}/tree/${meta.sourceCommit}\n${meta.selection}\n\n${bytes.toString()}\n\nIndividually verified spelling and inflection corrections (no definitions or commercial dictionary export):\n${corrections.sources.map(s=>s.url).join('\n')}\n`;
}
