const {webkit}=require('../../games/lasers-3d/node_modules/playwright');
const fs=require('fs');
const path=require('path');
const root=__dirname;
const quiet=p=>p.waitForFunction(()=>{const a=window.__lasers3d;return a&&!a.state.dirty&&!a.render.needsFrame()&&!a.state.resetting&&!a.state.revealPlaying&&a.motion.count().animations===0&&a.motion.count().holds===0;},{},{timeout:15000});
(async()=>{
 const browser=await webkit.launch({executablePath:'/Users/jamesalford/Library/Caches/ms-playwright/webkit-2203/pw_run.sh'});
 const rows=[],errors=[];
 try{
 const p=await browser.newPage({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:1});
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:8795/games/lasers-3d/');await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);
 fs.mkdirSync(path.join(root,'screenshots'),{recursive:true});
 const levels=await p.evaluate(()=>__lasers3d.levels.map((l,i)=>({index:i,name:l.name,duplex:!!l.duplex})));
 for(const l of levels){
  const stem=String(l.index+1).padStart(2,'0');
  await p.evaluate(i=>{const a=__lasers3d;a.loadLevel(i);a.ui.hideToast();},l.index);await quiet(p);
  const initial=await p.evaluate(()=>{const a=__lasers3d;return {camera:a.render.getCamera(),tray:[...document.querySelectorAll('.tray-card')].filter(e=>!e.hidden).map(e=>({type:e.dataset.type,text:e.textContent.trim()})),intro:a.levels[a.state.levelIndex].intro||null};});
  await p.screenshot({path:path.join(root,'screenshots',stem+'-initial.png')});
  await p.locator('#btn-fire').click();await quiet(p);
  const empty=await p.evaluate(()=>{const a=__lasers3d;return {end:a.state.lastShot?.end,readout:document.getElementById('readout').textContent.trim(),status:a.state.status};});
  await p.evaluate(()=>{const a=__lasers3d;a.setPlaced(a.levels[a.state.levelIndex].solution);a.fire();});await quiet(p);
  const solved=await p.evaluate(()=>{const a=__lasers3d;return {allTargetsHit:a.state.lastShot?.allTargetsHit,end:a.state.lastShot?.end,status:a.state.status,targets:a.state.level.targets.length,hits:a.state.lastShot?.hits.length,readout:document.getElementById('readout').textContent.trim(),stars:a.getProgress().stars[a.state.levelIndex]};});
  await p.evaluate(()=>{const a=__lasers3d;a.ui.hideVictory();a.ui.hideToast();a.tilt('tilt');});await quiet(p);
  await p.screenshot({path:path.join(root,'screenshots',stem+'-solution-3d.png')});
  if(l.duplex){await p.locator('#btn-below').click();await quiet(p);await p.screenshot({path:path.join(root,'screenshots',stem+'-underside.png')});}
  rows.push({...l,number:l.index+1,initial,empty,solved});
  fs.writeFileSync(path.join(root,'runtime.json'),JSON.stringify({method:'Fresh isolated WebKit context; every level loaded, empty board fired, stored solution injected and fired; actual GUI state and framebuffer captured. This is automated coverage, not a blind human solve or physical iPad run.',rows,errors},null,2)+'\n');
  console.log(stem+' '+l.name+': '+solved.status+' '+solved.hits+'/'+solved.targets);
 }
 const html='<!doctype html><meta charset="utf-8"><title>Laser gameplay review: all 31 levels</title><style>body{font:16px system-ui;background:#101821;color:#eaf6ff;margin:28px}section{margin:40px 0}img{width:min(47%,700px);margin:6px;border:1px solid #476579}h1,h2{font-weight:600}a{color:#8be5ff}</style><h1>Lasers 3D — all 31 levels</h1><p>Actual isolated WebKit captures, September 16, 2026. Initial board, solved 3D view, and underside where applicable. Stored solutions injected for review; no claim of human playtesting.</p>'+levels.map(l=>{const s=String(l.index+1).padStart(2,'0');return '<section><h2>'+s+' '+l.name+'</h2>'+['initial','solution-3d',...(l.duplex?['underside']:[])].map(mode=>'<a href="screenshots/'+s+'-'+mode+'.png"><img alt="'+mode+'" src="screenshots/'+s+'-'+mode+'.png"></a>').join('')+'</section>';}).join('');
 fs.writeFileSync(path.join(root,'gallery.html'),html);
 if(errors.length||rows.some(r=>!r.solved.allTargetsHit||r.solved.status!=='won'))process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
