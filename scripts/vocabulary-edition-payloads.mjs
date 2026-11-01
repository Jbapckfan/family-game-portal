import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),digest=value=>createHash('sha256').update(value).digest('hex');
function data(value){if(value instanceof Set)return {type:'Set',values:[...value].map(data)};if(Array.isArray(value))return value.map(data);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,data(v)]));return value;}
/** Order is retained: it can determine saved hints. Provenance-only metadata is excluded. */
export async function vocabularyEditionPayloads(){
 const entries=[];
 for(const slug of ['dovetail','splice','sprout','tangle','keystone','tumbler']){
  const file=`games/claude-${slug}/vocabulary.mjs`,module=await import(new URL(file,root));
  const payload=Object.fromEntries(Object.keys(module).filter(key=>key!=='WORD_GAME_INFO').sort().map(key=>[key,data(module[key])]));
  entries.push({edition:'claude-v2',file,semanticSHA256:digest(JSON.stringify(payload))});
 }
 for(const [edition,name] of [['kimi-tangle-v2','lexicon-expansions-v2.json'],['kimi-tangle-v2','five-preview-v2.json'],['kimi-tangle-v3','lexicon-expansions.json'],['kimi-tangle-v3','five-preview.json']]){
  const file='packages/kimi-pebbles/src/games/tangle/data/'+name;entries.push({edition,file,sha256:digest(await readFile(new URL(file,root)))});
 }
 return entries;
}
