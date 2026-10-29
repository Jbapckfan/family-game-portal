import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';

test('appending practice records cannot silently remap any Kimi published daily',async()=>{
  const root=path.resolve(import.meta.dirname,'..'),temporary=await mkdtemp(path.join(tmpdir(),'kimi-daily-preservation-'));
  const names={cairn:'dailyPuzzle',morph:'dailyMorph',tangle:'dailyTangle',hunch:'dailyHunch',circuit:'dailyCircuit',quartet:'dailyQuartet'};
  const baseline=JSON.parse(await readFile(new URL('../../../docs/six-month-previous-calendar.json',import.meta.url),'utf8'));
  try{
    const output=path.join(temporary,'appended.mjs');
    await build({stdin:{contents:Object.entries(names).map(([name,fn])=>`export {${fn} as ${name}} from './src/games/${name}/engine.ts';`).join('\n'),resolveDir:root,sourcefile:'appended.ts'},
      bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'silent',alias:{'@':path.join(root,'src')},
      plugins:[{name:'one-additional-record',setup(api){
        api.onLoad({filter:/[/\\]data[/\\](puzzles|answers)\.json$/},async args=>{
          const bank=JSON.parse(await readFile(args.path,'utf8'));
          return {contents:JSON.stringify([...bank,bank[0]]),loader:'json'};
        });
        api.onResolve({filter:/\?raw$/},args=>({path:args.path.startsWith('@/')?path.join(root,'src',args.path.slice(2,-4)):path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw-text'}));
        api.onLoad({filter:/.*/,namespace:'raw-text'},async args=>({contents:await readFile(args.path,'utf8'),loader:'text'}));
      }}]});
    const engine=await import(pathToFileURL(output).href);
    for(const name of Object.keys(names)){
      const published=baseline.games.find(game=>game.slug===`kimi-${name}`).count;
      for(let day=Date.parse('2026-01-01')/86400000;day<=Date.parse('2027-04-28')/86400000;day++)
        assert.equal(engine[name](day).puzzleNo,((day%published)+published)%published+1,`${name}: ${day}`);
    }
  }finally{await rm(temporary,{recursive:true,force:true});}
});

test('all six real Kimi practice selectors protect every upcoming reserved challenge',async()=>{
  const root=path.resolve(import.meta.dirname,'..'),temporary=await mkdtemp(path.join(tmpdir(),'kimi-practice-preservation-'));
  const names={cairn:'generatePracticePuzzle',morph:'practiceMorph',tangle:'practiceTangle',hunch:'practiceHunch',circuit:'practiceCircuit',quartet:'practiceQuartet'};
  const {DAILY_RESERVATIONS}=await import('../../../games/deepseek-runtime/daily-rotations.mjs');
  const {practiceCandidates}=await import('../../../games/deepseek-runtime/practice-calendar.mjs');
  const {kimiContentKey}=await import('../../../scripts/kimi-content-signatures.mjs');
  const NativeDate=globalThis.Date,random=Math.random;
  try{
    const output=path.join(temporary,'practice.mjs');
    await build({stdin:{contents:Object.entries(names).map(([name,fn])=>`export {${fn} as ${name}} from './src/games/${name}/engine.ts';`).join('\n'),resolveDir:root},bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'silent',alias:{'@':path.join(root,'src')},plugins:[{name:'raw',setup(api){
      api.onResolve({filter:/\?raw$/},args=>({path:args.path.startsWith('@/')?path.join(root,'src',args.path.slice(2,-4)):path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw'}));
      api.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:await readFile(args.path,'utf8'),loader:'text'}));
    }}]});
    const engine=await import(pathToFileURL(output).href);
    for(const date of ['2026-10-29','2026-11-01','2027-03-14','2027-04-28']){
      globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[`${date}T18:00:00Z`]));}static now(){return NativeDate.parse(`${date}T18:00:00Z`);}};
      for(const name of Object.keys(names).filter(name=>name!=='cairn')){
        const slug=`kimi-${name}`,count=DAILY_RESERVATIONS.byGame[slug].bankCount;
        const candidates=practiceCandidates(slug,date,count),exclude=candidates[0];
        const expected=candidates.filter(index=>index!==exclude),seen=new Set();
        for(let i=0;i<expected.length;i++){
          Math.random=()=> (i+0.5)/expected.length;
          const actual=engine[name](exclude).puzzleNo-1;
          assert.equal(actual,expected[i],`${slug} ${date}`);seen.add(actual);
        }
        assert.equal(seen.size,expected.length);
      }
      const bank=JSON.parse(await readFile(path.join(root,'src/games/cairn/data/puzzles.json'),'utf8'));
      const allowed=new Set(practiceCandidates('kimi-cairn',date,bank.length));
      const reserved=new Set(bank.filter((_,i)=>!allowed.has(i)).map(p=>kimiContentKey('cairn',p)));
      let seed=42;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      for(let i=0;i<100;i++)assert.ok(!reserved.has(kimiContentKey('cairn',{w:engine.cairn().words})),`generated Cairn ${date}`);
      Math.random=()=>0;assert.ok(!reserved.has(kimiContentKey('cairn',{w:engine.cairn().words})),`constant-random generated or fallback tower ${date}`);
    }
  }finally{globalThis.Date=NativeDate;Math.random=random;await rm(temporary,{recursive:true,force:true});}
});


test('Cairn bounded-search exhaustion falls back only to a nonreserved bank entry',async()=>{
 const root=path.resolve(import.meta.dirname,'..'),temp=await mkdtemp(path.join(tmpdir(),'cairn-fallback-'));
 const NativeDate=globalThis.Date,random=Math.random;
 try{
  const output=path.join(temp,'engine.mjs');
  await build({entryPoints:[path.join(root,'src/games/cairn/engine.ts')],bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'silent',alias:{'@':path.join(root,'src')},plugins:[{name:'exhaust-search',setup(api){
   api.onResolve({filter:/\?raw$/},args=>({path:args.path.startsWith('@/')?path.join(root,'src',args.path.slice(2,-4)):path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:'raw'}));
   api.onLoad({filter:/.*/,namespace:'raw'},async args=>({contents:args.path.endsWith('/common.txt')?'cat':await readFile(args.path,'utf8'),loader:'text'}));
  }}]});
  globalThis.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:['2026-10-30T18:00:00Z']));}};Math.random=()=>0;
  const bank=JSON.parse(await readFile(path.join(root,'src/games/cairn/data/puzzles.json'),'utf8'));
  const {practiceCandidates}=await import('../../../games/deepseek-runtime/practice-calendar.mjs');
  const expected=practiceCandidates('kimi-cairn','2026-10-30',bank.length)[0];
  const {generatePracticePuzzle}=await import(pathToFileURL(output).href);
  assert.deepEqual(generatePracticePuzzle().words,bank[expected].w);
 }finally{globalThis.Date=NativeDate;Math.random=random;await rm(temp,{recursive:true,force:true});}
});


test('all six published Kimi bank bytes still match the pre-update source baseline',async()=>{
 const baseline=JSON.parse(await readFile(new URL('../../../docs/six-month-previous-calendar.json',import.meta.url),'utf8'));
 for(const [name,expected] of Object.entries(baseline.kimiPublishedBankSHA256)){
  const file=new URL(`../src/games/${name}/data/${name==='hunch'?'answers':'puzzles'}.json`,import.meta.url);
  assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),expected,name);
 }
 assert.equal(Object.keys(baseline.kimiPublishedBankSHA256).length,6);
});
