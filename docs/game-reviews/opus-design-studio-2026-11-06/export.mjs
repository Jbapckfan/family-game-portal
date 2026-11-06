import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=import.meta.dirname,repo='/Users/jamesalford/Projects/MAKER-codex__alford-daily-six-months',dest=path.join(repo,'previews/design-studio');
const scope={window:{}};vm.runInNewContext(await readFile(root+'/data.js','utf8'),scope);const data=scope.window.DESIGN_STUDIO;
if(data.count!==91||data.subjects.some(s=>s.designs.length!==s.expected))throw Error('Incomplete design collection');
await mkdir(dest,{recursive:true});
for(const f of ['index.html','studio-shell.css','studio-shell.js'])await copyFile(root+'/'+f,dest+'/'+f);
for(const s of data.subjects)if(s.review){delete s.review.jamesFeedback;delete s.review.disposition;}
await writeFile(dest+'/data.js','window.DESIGN_STUDIO='+JSON.stringify(data)+';\n');
for(const job of ['director','team-01','team-02','team-03']){await mkdir(dest+'/'+job,{recursive:true});for(const f of await readdir(root+'/'+job))if(/\.(html|css|js)$/.test(f))await copyFile(root+'/'+job+'/'+f,dest+'/'+job+'/'+f);}
await mkdir(dest+'/assets/icons',{recursive:true});for(const f of await readdir(root+'/assets/icons'))await copyFile(root+'/assets/icons/'+f,dest+'/assets/icons/'+f);
console.log(JSON.stringify({destination:dest,concepts:data.count,subjects:data.subjects.length}));
