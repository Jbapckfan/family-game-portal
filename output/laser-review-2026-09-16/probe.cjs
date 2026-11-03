const {webkit}=require('../../games/lasers-3d/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const b=await webkit.launch({executablePath:'/Users/jamesalford/Library/Caches/ms-playwright/webkit-2203/pw_run.sh'});
 try{
 const p=await b.newPage({viewport:{width:1194,height:834},reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const quiet=()=>p.waitForFunction(()=>{const a=window.__lasers3d;return a&&!a.state.dirty&&!a.render.needsFrame()&&!a.state.revealPlaying&&a.motion.count().animations===0&&a.motion.count().holds===0;});
 await p.goto('http://localhost:8795/games/lasers-3d/');await quiet();
 const fixture=require('./extra-piece-hint-fixtures.json')[0];
 await p.evaluate(f=>{const a=__lasers3d;a.setPlaced(f.placed);a.fire();},fixture);await quiet();
 const before=await p.evaluate(()=>({end:__lasers3d.state.lastShot.end,winning:__lasers3d.state.lastShot.allTargetsHit}));
 await p.locator('#btn-hint').click();await p.locator('#btn-hint').click();
 const hint=await p.locator('#toast').innerText();
 await p.screenshot({path:path.join(__dirname,'screenshots/hint-extra-piece-bug.png')});
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(28);a.setPlaced(a.levels[28].solution);a.fire();});await quiet();
 await p.evaluate(()=>{__lasers3d.ui.hideVictory();__lasers3d.ui.hideToast();});await quiet();
 const events=await p.evaluate(()=>__lasers3d.state.lastShot.events);
 await p.locator('#btn-camera-tools').click();
 const crossings=[];
 for(const ev of events){
  await p.locator('[data-event="1"]').click();await quiet();
  if(ev.kind==='crossing')crossings.push({expectedDestination:ev.side,event:ev,text:await p.locator('.event-description').innerText(),actualLayer:await p.evaluate(()=>__lasers3d.render.getLayer())});
 }
 const result={extraPieceHint:{level:1,fixture,before,hint},crossingInspector:crossings,errors};
 fs.writeFileSync(path.join(__dirname,'confirmed-probes.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
