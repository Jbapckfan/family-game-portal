// One owned preview window, two tabs maximum. Uses existing local files and browsers; no listener.
import path from 'node:path';import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {GAMES,BONUS_GAMES} from '../games/daily/catalog.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jamesalford/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs');
const root=path.resolve(import.meta.dirname,'..'),allowed=new Set([...GAMES,...BONUS_GAMES].map(g=>g.slug));
let slug=process.argv[2]||'shortlist';if(!allowed.has(slug))throw new Error('Unknown game');
const profile=path.join(root,'output/counterpart-review-20261030/readable-profile');
const context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:false,viewport:{width:1200,height:960},serviceWorkers:'block',reducedMotion:'no-preference',args:['--disable-gpu','--disable-gpu-compositing']});
const pages=context.pages();let page=pages[0]||await context.newPage();for(const p of pages.slice(1))await p.close();
let sampleTab=null,sampleFile=null;
const reviewFiles={candidates:path.join(root,'experiments/MAKER-Codex__ten-candidates-20261101/index.html'),launch:path.join(root,'docs/launch/2026-11-01/revenue-calculator.html')};
if(process.argv[3]==='five'&&process.argv[4]){
 const file=path.resolve(root,process.argv[4]);if(!file.startsWith(path.join(root,'output')+path.sep)||!file.endsWith('.json'))throw new Error('Only an output JSON checkpoint may restore the sample');
 const snapshot=JSON.parse(await readFile(file,'utf8'));
 await context.addInitScript(value=>{try{if(!sessionStorage.getItem('kimi:tangle:5x5-preview:v1'))sessionStorage.setItem('kimi:tangle:5x5-preview:v1',JSON.stringify(value))}catch{}},snapshot);
}
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());if(u.origin!=='https://alford-daily.test')return route.abort();
 const review=u.pathname.match(/^\/review-(candidates|launch)\/$/);if(review)return route.fulfill({path:reviewFiles[review[1]],contentType:'text/html'});
 if(u.pathname==='/review-example/'&&sampleFile)return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><title>Result-card example</title><style>body{background:#f6f3ec;color:#202c35;font:16px system-ui;text-align:center;padding:24px}img{width:min(85vw,480px);height:auto;margin-top:24px}p{max-width:620px;margin:auto;line-height:1.7}</style><h1>Share-card preview</h1><p>Automated test example. Your result uses your actual score. The playable game is in the other tab.</p><img src="/review-example.png?${Date.now()}" alt="Spoiler-free result example">`});
 if(u.pathname==='/review-example.png'&&sampleFile)return route.fulfill({path:sampleFile,contentType:'image/png'});
 let name=u.pathname;if(name==='/')name='/games/daily/';if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);
 if(!file.startsWith(path.join(root,'games')+path.sep))return route.abort();
 const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.ttf':'font/ttf','.woff2':'font/woff2'};
 try{await route.fulfill({path:file,contentType:types[path.extname(file)]});}catch{await route.fulfill({status:404,body:'Not found'});}
});
async function capture(){if(slug.startsWith('kimi-')&&page.url().includes('/games/'+slug+'/'))await page.locator('[data-game-ready]').waitFor();const out=path.join(root,'output',slug+'-review-20261030');await mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,'visible-game.png'),fullPage:!(await page.locator('.pair-drag-ghost').count())});console.log(JSON.stringify({game:slug,title:await page.title(),tabs:context.pages().length,profile}));}
async function showGame(next){if(!allowed.has(next))throw new Error('Unknown game');slug=next;if(page.isClosed()){page=context.pages().find(p=>!p.isClosed())||await context.newPage();if(page===sampleTab)sampleTab=null;}await page.goto(`https://alford-daily.test/games/${slug}/`);await page.bringToFront();await capture();}
await showGame(slug);
if(process.argv[3]==='five'&&slug==='kimi-tangle'){await page.getByRole('button',{name:'5×5 Preview',exact:true}).click();await page.locator('[data-board-size="5"]').waitFor();await capture();}
let pending=Promise.resolve();
const input=createInterface({input:process.stdin});
input.on('line',line=>{pending=pending.then(async()=>{
 const [command,...rest]=line.trim().split(' '),value=rest.join(' ');
 if(command==='status'){console.log(JSON.stringify({game:slug,gameTabClosed:page.isClosed(),tabs:context.pages().length}));}
 else if(command==='five'){await page.getByRole('button',{name:'5×5 Preview',exact:true}).click();await page.locator('[data-board-size="5"]').waitFor();await page.bringToFront();await capture();}
 else if(command==='four'){await page.getByRole('button',{name:'4×4 Daily',exact:true}).click();await page.locator('[data-board-size="4"]').waitFor();await page.bringToFront();await capture();}
 else if(command==='practice'){await page.locator('#practice-tab').click();await page.locator('.practice-choice:not(.done)').first().click();await page.bringToFront();await capture();}
 else if(command==='motion'){await page.emulateMedia({reducedMotion:value==='off'?'reduce':'no-preference'});console.log('Preview motion '+value);}
 else if(command==='drag-demo'){const source=page.locator('.pair:not(:disabled)').first();if(!await source.count())throw new Error('No active pairs to preview');const a=await source.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width/2+12,a.y+a.height/2+12,{steps:3});const gap=page.locator('.gap:not(:disabled)').first();await gap.scrollIntoViewIfNeeded();const b=await gap.boundingBox();for(let i=1;i<=24;i++){await page.mouse.move(a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*i/24,a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*i/24);await page.waitForTimeout(25);}await page.waitForTimeout(450);await capture();await page.mouse.move(4,4,{steps:8});await page.mouse.up();console.log('Free drag preview demonstrated and cancelled; no attempt submitted.');}
 else if(command==='reload'){if(page.isClosed())throw new Error('Game tab closed; use game <slug> to continue');await page.reload();await page.bringToFront();await capture();}
 else if(command==='game')await showGame(value);
 else if(command==='sample'){
  const candidate=path.resolve(root,value);if(!candidate.startsWith(path.join(root,'output')+path.sep)||!candidate.endsWith('.png'))throw new Error('Only generated output PNGs may be previewed');sampleFile=candidate;
  if(!sampleTab||sampleTab.isClosed())sampleTab=await context.newPage();await sampleTab.goto('https://alford-daily.test/review-example/');await sampleTab.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);await sampleTab.bringToFront();console.log('Example updated in second tab.');await page.bringToFront();
 }else if(command==='preview'){
  if(!Object.hasOwn(reviewFiles,value))throw new Error('Unknown review deliverable');
  if(!sampleTab||sampleTab.isClosed())sampleTab=await context.newPage();await sampleTab.goto(`https://alford-daily.test/review-${value}/`);await sampleTab.bringToFront();console.log(JSON.stringify({preview:value,title:await sampleTab.title(),tabs:context.pages().length}));
 }else if(command==='close-sample'){if(sampleTab&&!sampleTab.isClosed())await sampleTab.close();sampleTab=null;await page.bringToFront();}
 else if(command==='close'){await context.close();}
}).catch(error=>console.log('Preview command failed: '+error.message));});
await new Promise(resolve=>context.on('close',()=>{input.close();process.stdin.pause();resolve();}));
