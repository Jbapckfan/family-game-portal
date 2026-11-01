import fs from 'node:fs';import {generate,hash} from '../engine.mjs';
const root=new URL('../',import.meta.url),daily=JSON.parse(fs.readFileSync(new URL('bank.json',root))),practice={version:2,space:'practice-v2',games:{}};
for(let kind=1;kind<=10;kind++){const seen=new Set(daily.games[kind].map(p=>p.identity)),out=[];for(let n=0;out.length<182;n++){const p=generate(kind,hash(`MAKER-Codex:practice-v2:${kind}:${n}`));if(seen.has(p.identity))continue;seen.add(p.identity);out.push(p);}practice.games[kind]=out;console.log(JSON.stringify({kind,practice:out.length,disjointDaily:true}));}
fs.writeFileSync(new URL('practice.json',root),JSON.stringify(practice));
