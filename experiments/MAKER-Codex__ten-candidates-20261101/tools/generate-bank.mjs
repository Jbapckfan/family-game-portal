import fs from 'node:fs';
import {generate,hash} from '../engine.mjs';
const base=new URL('../',import.meta.url),count=182,start='2026-11-01';
const dates=Array.from({length:count},(_,i)=>new Date(Date.parse(`${start}T12:00:00Z`)+i*86400000).toISOString().slice(0,10));
const bank={version:1,dates,games:{}},report=[];
for(let kind=1;kind<=10;kind++){
 const entries=[],seen=new Set(),t=Date.now();let skipped=0;
 for(let index=0;entries.length<count;index++){
  const seed=hash(`MAKER-Codex-candidates-v1:${kind}:${index}`),p=generate(kind,seed);
  if(seen.has(p.identity)){skipped++;continue;}
  seen.add(p.identity);entries.push(p);
 }
 bank.games[kind]=entries;
 const pars=entries.map(p=>p.par).filter(p=>p!==null);
 report.push({kind,boards:entries.length,distinctSubstantiveKeys:seen.size,duplicateCandidatesSkipped:skipped,parRange:pars.length?[Math.min(...pars),Math.max(...pars)]:null,generationMs:Date.now()-t});
 console.log(JSON.stringify(report.at(-1)));
}
fs.writeFileSync(new URL('bank.json',base),JSON.stringify(bank));
fs.writeFileSync(new URL('evidence/MAKER-Codex__generation.json',base),JSON.stringify({start:dates[0],end:dates.at(-1),days:count,report},null,2)+'\n');
