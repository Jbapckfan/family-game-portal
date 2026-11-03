const {webkit}=require('../../games/lasers-3d/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const b=await webkit.launch({executablePath:'/Users/jamesalford/Library/Caches/ms-playwright/webkit-2203/pw_run.sh'});
 try{
 const p=await b.newPage({viewport:{width:1194,height:834},hasTouch:true,reducedMotion:'reduce'});
 const quiet=()=>p.waitForFunction(()=>{const a=window.__lasers3d;return a&&!a.state.dirty&&!a.render.needsFrame()&&!a.state.revealPlaying&&a.motion.count().animations===0&&a.motion.count().holds===0;});
 await p.goto('http://localhost:8795/games/lasers-3d/');await quiet();
 await p.locator('.tray-card[data-type="MIRROR"]').click();await quiet();
 const at=await p.evaluate(()=>__lasers3d.render.projectCell({x:2,y:3},0));
 async function press(ms,id){const ev={pointerId:id,pointerType:'touch',isPrimary:true,clientX:at.x,clientY:at.y,button:0,buttons:1};await p.dispatchEvent('#board','pointerdown',ev);await p.waitForTimeout(ms);await p.dispatchEvent('#board','pointerup',{...ev,buttons:0});await quiet();return p.evaluate(()=>__lasers3d.state.placed.length);}
 const slow=await press(450,77),fast=await press(80,78);
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(12);const partial=a.levels[12].solution.slice(0,2).map(p=>({...p}));partial[1].orient='\\';a.setPlaced(partial);});await quiet();
 await p.locator('#btn-hint').click();await p.locator('#btn-hint').click();await p.locator('#btn-hint').click();
 const floor=await p.evaluate(()=>{const a=__lasers3d,alternate=a.levels[12].solution.map(p=>({...p}));alternate.find(p=>p.type==='FLOOR').orient='\\';return {hint:document.getElementById('toast').textContent.trim(),partial:a.state.placed,alternateFullSolutionWins:a.sim.trace(a.state.level,alternate).allTargetsHit};});
 const result={tap:{held450msPlaced:slow,thenHeld80msPlaced:fast},floor};
 fs.writeFileSync(path.join(__dirname,'followup-probes.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
