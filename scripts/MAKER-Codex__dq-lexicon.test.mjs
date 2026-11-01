import {independentlyReadModernWords} from './independent-modern-lexicon.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {PUZZLES as HIVES} from '../games/deepseek-twin-hive/puzzles.mjs';
import * as H from '../games/deepseek-twin-hive/engine.mjs';
import {PUZZLES as LADDERS} from '../games/deepseek-rung/puzzles.mjs';
import * as R from '../games/deepseek-rung/engine.mjs';
import {PUZZLES as SIEGES} from '../games/qwen-syntax-siege/puzzles.mjs';
import * as S from '../games/qwen-syntax-siege/engine.mjs';

// Independent source parsing and spelling checks: never import the generator or
// its source loader. Reject changed upstream inputs before comparing acceptance.
const data=new URL('../packages/kimi-pebbles/data/',import.meta.url);
const [english,gamePins]=await Promise.all(['english-words-source.json','word-game-sources.json'].map(f=>readFile(new URL(f,data),'utf8').then(JSON.parse)));
const files=[['english-words-alpha.txt',english.files['words_alpha.txt'].sha256,'text'],['wordnik-game-words.txt',gamePins.find(p=>p.repository.endsWith('/wordnik/wordlist')).files['wordlist-20210729.txt'].sha256,'quoted'],['enable2k.txt.gz',gamePins.find(p=>p.repository.endsWith('/BartMassey/wordlists')).files['enable2k.txt.gz'].sha256,'gzip']];
const source=new Set();
for(const[file,sha,kind]of files){const bytes=await readFile(new URL(file,data));assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,file);const text=kind==='gzip'?gunzipSync(bytes).toString():bytes.toString();for(const raw of text.split(/\r?\n/)){const word=kind==='quoted'&&raw?JSON.parse(raw):raw;if(/^[a-z]+$/.test(word))source.add(word.toUpperCase());}}
for(const word of JSON.parse(await readFile(new URL('zynga-disclosed-words.json',data),'utf8')).words)source.add(word.toUpperCase());
for(const word of independentlyReadModernWords(data))source.add(word.toUpperCase());
const same=(actual,expected,label)=>{const a=new Set(actual),b=new Set(expected);assert.deepEqual({missing:[...b].filter(w=>!a.has(w)).slice(0,12),unexpected:[...a].filter(w=>!b.has(w)).slice(0,12)},{missing:[],unexpected:[]},label);};
const spells=(rack,word)=>{const pool=[...rack];return [...word].every(letter=>{const i=pool.indexOf(letter);if(i<0)return false;pool.splice(i,1);return true;});};

test('Twin Hive accepts the full pinned corpus under its rack and gold rules on every board',()=>{
 for(const p of HIVES){const expected=[...source].filter(w=>w.length>=4&&w.length<=24&&[...w].every(c=>p.letters.includes(c))&&p.gold.every(c=>w.includes(c)));
  same(H.acceptedWords(p),[...p.answers,...expected],p.id);
  const extra=expected.find(w=>!p.answers.includes(w)),s=H.submitWord(p,H.createState(p),extra).state;
  assert.deepEqual(s.found,[extra],p.id);assert.deepEqual(H.restoreState(p,JSON.parse(JSON.stringify(s))),s,p.id);
 }
});
test('Rung accepts all pinned four-letter words and solves every original endpoint pair',()=>{
 const expected=[...source].filter(w=>w.length===4);same(R.LEXICON,expected,'Rung exact pinned four-letter union');
 for(const p of LADDERS){const route=R.findRoute(p.start,p.target);assert.ok(route,p.id);assert.ok(route.length-1<=p.par,p.id+' broader graph cannot lengthen the original route');
  let s=R.createState(p);for(const word of route.slice(1)){s=R.submitWord(p,s,word).state;assert.deepEqual(R.restoreState(p,JSON.parse(JSON.stringify(s))),s,p.id);}assert.equal(R.getStatus(p,s),'won',p.id);
 }
});
test('Syntax Siege accepts every pinned 3–6 letter rack word and preserves real damage and saves',()=>{
 const racks=new Map(SIEGES.flatMap(p=>p.waves.map(w=>[[...w.rack].sort().join(''),w])));
 for(const[key,w]of racks){const expected=[...source].filter(word=>word.length>=3&&word.length<=6&&spells(w.rack,word));
  const p=SIEGES.find(p=>[...p.waves[0].rack].sort().join('')===key);assert.ok(p,key);
  const word=expected.find(word=>!w.words.includes(word));assert.ok(word,key+' has omitted playable words');
  let s=S.start(p,S.createState(p));for(const c of word){const i=p.waves[0].rack.findIndex((v,i)=>v===c&&!s.selected.includes(i));s=S.pick(p,s,i).state;}
  s=S.submit(p,s).state;assert.deepEqual(s.played[0],[word],word);assert.equal(S.health(s),100);assert.deepEqual(S.restoreState(p,JSON.parse(JSON.stringify(s))),s);
  same(S.acceptedWords(w),[...w.words,...expected],key);
 }
});
