import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
const root=import.meta.dirname;
const read=async p=>{try{return JSON.parse(await readFile(path.join(root,p),'utf8'));}catch{return null;}};
const exists=async p=>{try{await access(path.join(root,p));return true;}catch{return false;}};
const catalog=await read('input/games.json'),system=await read('director/design-system.json'),review=await read('director/all-games-review.json');
const subjects=[{id:'site',name:'Overall site',kind:'site',expected:4,recommended:system?.recommendation?.choose,diagnosis:system?.recommendation?.why,designs:[]}];
for(const d of system?.directions||[])if(await exists('director/site-'+d.id+'.html'))subjects[0].designs.push({...d,title:d.name,summary:d.rationale,path:'director/site-'+d.id+'.html'});
for(const g of catalog){let found=null,job=null;for(const j of ['team-01','team-02','team-03']){const raw=await read(j+'/game-proposals.json'),list=Array.isArray(raw)?raw:raw?.games||raw?.proposals||[];const p=list.find(x=>x.slug===g.slug);if(p){found=p;job=j;break;}}
 const designs=[];for(const d of found?.designs||[]){const p=d.mockup.startsWith(job+'/')?d.mockup:job+'/'+d.mockup;if(await exists(p))designs.push({...d,path:p});}
 subjects.push({id:g.slug,name:g.name+(g.slug==='kimi-tangle'?' · grid':g.slug==='claude-tangle'?' · threads':''),kind:g.disposition==='keep'?'keeper':'other',expected:g.alternativesRequired,diagnosis:found?.diagnosis,clarityRisk:found?.clarityRisk,review:review?.games?.find(r=>r.slug===g.slug),recommended:found?.recommendedDesign,designs});
}
const count=subjects.reduce((n,s)=>n+s.designs.length,0),expected=subjects.reduce((n,s)=>n+s.expected,0);
await writeFile(path.join(root,'data.js'),'window.DESIGN_STUDIO='+JSON.stringify({model:'claude-opus-5-5',subjects,count,expected})+';\n');
console.log(JSON.stringify({concepts:count,required:expected,complete:subjects.every(s=>s.designs.length>=s.expected),missing:subjects.filter(s=>s.designs.length<s.expected).map(s=>({id:s.id,have:s.designs.length,need:s.expected}))}));
if(count!==expected||subjects.some(s=>s.designs.length!==s.expected))process.exitCode=1;
