import {webkit,chromium} from 'playwright';
import assert from 'node:assert/strict';
import {existsSync,readdirSync,mkdirSync,readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
const cache=homedir()+'/Library/Caches/ms-playwright',builds=readdirSync(cache).filter(d=>/^webkit-\d+$/.test(d)&&existsSync(`${cache}/${d}/pw_run.sh`)).sort();
const port=await new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const server=spawn(process.execPath,['tools/serve.mjs',String(port)],{stdio:['ignore','pipe','inherit']});await new Promise(r=>server.stdout.once('data',r));
let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;console.log('ok '+label);};
const quiet=p=>p.waitForFunction(()=>{const a=__lasers3d;return !a.state.dirty&&!a.render.needsFrame()&&!a.state.resetting&&a.motion.count().animations===0&&a.motion.count().holds===0;});
try{for(const engine of [webkit,chromium]){
 const name=engine.name(),opts=name==='webkit'?(existsSync(webkit.executablePath())?{}:{executablePath:`${cache}/${builds.at(-1)}/pw_run.sh`}):(existsSync(chromium.executablePath())?{}:{channel:'chrome'});
 const browser=await engine.launch(opts);try{
 const p=await browser.newPage({viewport:{width:1194,height:834},deviceScaleFactor:1,hasTouch:true});const errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message);});
 await p.goto(`http://127.0.0.1:${port}/games/lasers-3d/`);await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);
 await p.locator('#btn-levels').click();await p.locator('#btn-duplex-chapter').click();await quiet(p);
 check(await p.evaluate(()=>__lasers3d.state.levelIndex===27),name+': chapter accessible without campaign unlock');
 check(await p.locator('#layer-controls').isVisible(),name+': Above and Below controls visible');
 await p.locator('#btn-help').click();
 check((await p.locator('#modal-help').innerText()).includes('One shared floor')&&(await p.locator('#modal-help').innerText()).includes('On the underside'),name+': Help explains solid floor and reflected optics');
 await p.evaluate(()=>__lasers3d.ui.hideHowToPlay());await quiet(p);
 check(await p.evaluate(()=>__lasers3d.render.isFlat()&&__lasers3d.render.getCamera().elevationDeg===90),name+': new chapter starts in familiar 2D birdseye view');
 await p.locator('#btn-below').click();
 const flipSamples=[];for(let n=0;n<10;n++){flipSamples.push(await p.evaluate(()=>__lasers3d.render.getCamera()));await p.waitForTimeout(40);}
 check(flipSamples.every(c=>Number.isFinite(c.effectiveZoom)&&c.effectiveZoom<110),name+': 2D face flip has bounded zoom through the edge-on pose');
 await quiet(p);check(await p.evaluate(()=>__lasers3d.render.getLayer()==='below'),name+': Below selects editing deck');
 check(await p.evaluate(()=>__lasers3d.render.isFlat()&&__lasers3d.render.getCamera().elevationDeg===-90),name+': Below flips to the opposite 2D face');
 await p.locator('#btn-tilt').click();await quiet(p);
 const wallPick=await p.evaluate(()=>{const a=__lasers3d,r=document.getElementById('board').getBoundingClientRect(),v=new THREE.Vector3(2.501,-0.5,-5).project(a.render._camera);return a.render.pickCell(r.left+(v.x+1)*r.width/2,r.top+(1-v.y)*r.height/2);});
 check(wallPick?.x===3&&wallPick?.y===5&&wallPick?.side==='below',name+': touching a raised lower wall selects its own column');
 await p.evaluate(()=>__lasers3d.focusCell({x:3,y:5,side:'below'},true));await quiet(p);
 await p.locator('.tray-card[data-type="DIP"]').click();const at=await p.evaluate(()=>__lasers3d.render.projectCell({x:3,y:5,side:'below'},0));await p.touchscreen.tap(at.x,at.y);await quiet(p);
 check(await p.evaluate(()=>__lasers3d.state.placed.length===1&&__lasers3d.state.placed[0].side==='below'&&__lasers3d.sim.trace(__lasers3d.state.level,__lasers3d.state.placed).allTargetsHit),name+': touch catches beam on lower raised surface');
 await p.touchscreen.tap(at.x,at.y);await quiet(p);check(await p.evaluate(()=>!__lasers3d.sim.trace(__lasers3d.state.level,__lasers3d.state.placed).allTargetsHit),name+': lower rotation redirects route');
 await p.evaluate(()=>__lasers3d.undo());await quiet(p);check(await p.evaluate(()=>__lasers3d.state.placed[0].side==='below'&&__lasers3d.sim.trace(__lasers3d.state.level,__lasers3d.state.placed).allTargetsHit),name+': undo retains deck');
 await p.evaluate(()=>__lasers3d.saveAttempt());await p.reload();await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);
 check(await p.evaluate(()=>__lasers3d.render.getLayer()==='below'&&__lasers3d.state.placed[0].side==='below'),name+': reload restores lower placement and editing deck');
 for(const i of [27,28,29,30]){
  await p.evaluate(i=>{const a=__lasers3d;a.loadLevel(i);a.setPlaced(a.levels[i].solution);a.ui.hideToast();},i);await quiet(p);
  const data=await p.evaluate(()=>{const a=__lasers3d;return {calls:a.render._renderer.info.render.calls,minY:a.render._scene.getObjectByName('beamTubes').children.reduce((v,m)=>Math.min(v,m.geometry.boundingBox?.min.y??0),0),duplex:!!a.render._scene.getObjectByName('two-sided-board')};});
  check(data.duplex&&data.calls<125,name+': puzzle '+(i+1)+' renders both faces within draw budget '+JSON.stringify(data));
  await p.locator('#btn-fire').click();await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);
  check(await p.evaluate(()=>__lasers3d.state.lastShot.allTargetsHit&&__lasers3d.state.lastShot.events.some(e=>e.kind==='crossing')),name+': puzzle '+(i+1)+' FIRE crosses and lights all receivers');
  await p.evaluate(()=>__lasers3d.ui.hideVictory());await quiet(p);const frames=await p.evaluate(()=>__lasers3d.state.frames);await p.waitForTimeout(450);check(await p.evaluate(()=>__lasers3d.state.frames)===frames,name+': puzzle '+(i+1)+' zero idle frames');
 }
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(29);a.setPlaced(a.levels[29].solution);a.ui.hideToast();a.setLayer('below');});await quiet(p);
 const optics=await p.evaluate(()=>{const a=__lasers3d,pc=a.render._scene.getObjectByName('pieces');return {picks:a.state.placed.filter(x=>x.side==='below').map(c=>{const s=a.render.projectCell(c,0);return a.render.pickCell(s.x,s.y);}),placed:a.state.placed.filter(x=>x.side==='below')};});
 check(optics.picks.every((c,i)=>c?.side==='below'&&c.x===optics.placed[i].x&&c.y===optics.placed[i].y),name+': projection and picking agree on lower cells');
 const physical=await p.evaluate(()=>{const a=__lasers3d,s=a.render._scene;return a.render.getCamera().elevationDeg<0&&s.getObjectByName('underside-face').scale.y===-1&&s.getObjectByName('upper-face').children.filter(m=>m.material?.type==='MeshStandardMaterial').every(m=>m.material.opacity===1&&m.material.depthWrite);});
 check(physical,name+': camera moves beneath an opaque shared floor and mirrored underside');
 await p.evaluate(()=>{const a=__lasers3d;a.setPlaced([{x:3,y:7,type:'DIP',orient:'/'},{x:3,y:7,type:'DIP',orient:'/',side:'below'}]);a.focusCell({x:3,y:7,side:'below'},true);});await quiet(p);
 let cell=await p.evaluate(()=>__lasers3d.render.projectCell({x:3,y:7,side:'below'},0));await p.touchscreen.tap(cell.x,cell.y);await quiet(p);
 check(await p.evaluate(()=>__lasers3d.state.placed.find(p=>p.side==='below').orient==='\\'&&__lasers3d.state.placed.find(p=>!p.side).orient==='/'),name+': same-square rotation changes only the selected deck');
 // Exercise the actual long-press/drag handler while the matching upper cell is occupied.
 const drag=await p.evaluate(()=>{const a=__lasers3d;return {from:a.render.projectCell({x:3,y:7,side:'below'},0),to:a.render.projectCell({x:4,y:7,side:'below'},0)};});
 await p.dispatchEvent('#board','pointerdown',{pointerId:81,pointerType:'touch',isPrimary:true,clientX:drag.from.x,clientY:drag.from.y,button:0,buttons:1});await p.waitForTimeout(600);
 await p.dispatchEvent('#board','pointermove',{pointerId:81,pointerType:'touch',isPrimary:true,clientX:drag.to.x,clientY:drag.to.y,button:0,buttons:1});
 await p.dispatchEvent('#board','pointerup',{pointerId:81,pointerType:'touch',isPrimary:true,clientX:drag.to.x,clientY:drag.to.y,button:0,buttons:0});await quiet(p);
 check(await p.evaluate(()=>__lasers3d.state.placed.some(p=>p.side==='below'&&p.x===4&&p.y===7)&&__lasers3d.state.placed.some(p=>!p.side&&p.x===3&&p.y===7)),name+': hold and drag keeps the lower deck without moving its upper neighbour');
 for(const [width,height] of [[320,568],[393,852],[844,390],[1376,1032]]){
  await p.setViewportSize({width,height});await quiet(p);
  const layout=await p.evaluate(()=>Array.from(document.querySelectorAll('#btn-above,#btn-below,#btn-fire,#btn-flat,#btn-tilt')).map(b=>{const r=b.getBoundingClientRect();return {id:b.id,w:r.width,h:r.height,in:r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5};}));check(layout.every(b=>b.w>=44&&b.h>=44&&b.in),name+': '+width+'x'+height+' layer controls fit '+JSON.stringify(layout));
 }
 await p.setViewportSize({width:1194,height:834});await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(30);a.setPlaced(a.levels[30].solution);a.ui.hideToast();a.fire();});await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);await p.evaluate(()=>{__lasers3d.ui.hideVictory();__lasers3d.ui.hideToast();});await quiet(p);
 mkdirSync('../../output/playwright',{recursive:true});if(name==='webkit')await p.screenshot({path:'../../output/playwright/laser-underside-above.png'});
 await p.locator('#btn-below').click();await quiet(p);if(name==='webkit')await p.screenshot({path:'../../output/playwright/laser-underside-below-flat.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{__lasers3d.loadLevel(28);__lasers3d.setPlaced(__lasers3d.levels[28].solution);__lasers3d.setLayer('below');});await quiet(p);check(await p.evaluate(()=>!__lasers3d.render.needsFrame()),name+': reduced motion and layer switch settle');
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(29);a.setPlaced([a.levels[29].solution[0]]);a.focusCell(a.levels[29].solution[0],true);a.ui.hideToast();});await quiet(p);
 const upper=await p.evaluate(()=>__lasers3d.render.projectCell({x:3,y:2},0));
 await p.dispatchEvent('#board','pointerdown',{pointerId:91,pointerType:'touch',isPrimary:true,clientX:upper.x,clientY:upper.y,button:0,buttons:1});await p.waitForTimeout(600);
 await p.dispatchEvent('#board','pointerup',{pointerId:91,pointerType:'touch',isPrimary:true,clientX:upper.x,clientY:upper.y,button:0,buttons:0});
 check(await p.evaluate(()=>!!__lasers3d.state.selectedCell&&!__lasers3d.state.selectedCell.side),name+': upper piece selected before a lower-deck hint');
 await p.evaluate(()=>{__lasers3d.hint();__lasers3d.hint();__lasers3d.hint();});
 await p.waitForFunction(()=>__lasers3d.state.hintGhost?.side==='below');
 check(await p.evaluate(()=>{const a=__lasers3d,p=a.render.projectCell(a.state.hintGhost,0),r=document.getElementById('board').getBoundingClientRect();return a.render.getLayer()==='below'&&!a.state.selectedCell&&p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;}),name+': lower hint switches deck, clears upper controls, and stays visible');
 // Cross the floor's edge-on camera pose with real paired pointer input. Pan remains
 // a screen offset, so neither the pivot nor the projection can divide by sin(0).
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(29);a.setPlaced(a.levels[29].solution);a.tilt('tilt');a.ui.hideToast();});await quiet(p);
 await p.evaluate(()=>{__lasers3d.render.pan(35,22);__lasers3d.ui.fitStage();});await quiet(p);
 const pivot=()=>p.evaluate(()=>{const a=__lasers3d,c=new THREE.Vector3(5.5,0,-5.5).project(a.render._camera);return{x:c.x,y:c.y};});
 const pivotBefore=await pivot();
 const send=(type,id,x,y)=>p.dispatchEvent('#board',type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1});
 await send('pointerdown',201,360,340);await send('pointerdown',202,540,340);
 const samples=[];
 for(let n=1;n<=15;n++){await send('pointermove',201,360,340+n*10);await send('pointermove',202,540,340+n*10);await p.waitForTimeout(20);samples.push(await p.evaluate(()=>__lasers3d.render.getCamera()));}
 await send('pointerup',201,360,490);await send('pointerup',202,540,490);await quiet(p);
 const pivotAfter=await pivot();
 check(samples.every(c=>Number.isFinite(c.effectiveZoom)&&Object.values(c.pan).every(Number.isFinite))&&samples.at(-1).elevationDeg<0,name+': paired tilt passes smoothly through edge-on to the underside');
 check(Math.hypot(pivotAfter.x-pivotBefore.x,pivotAfter.y-pivotBefore.y)<0.0001,name+': floor centre stays fixed through an above-to-below orbit after panning');
 check(await p.locator('#btn-below').getAttribute('aria-pressed')==='true',name+': orbit automatically selects the visible underside');
 const panBefore=await pivot();await send('pointerdown',203,440,400);await send('pointermove',203,470,418);await send('pointerup',203,470,418);await quiet(p);
 const panAfter=await pivot(),canvasSize=await p.locator('#board').boundingBox();
 check(Math.abs((panAfter.x-panBefore.x)*canvasSize.width/2-30)<1&&Math.abs((panAfter.y-panBefore.y)*canvasSize.height/2+18)<1,name+': one-finger pan follows the finger beneath the floor');
 await p.locator('#btn-flat').click();await quiet(p);
 check(await p.evaluate(()=>__lasers3d.render.isFlat()&&__lasers3d.render.getCamera().elevationDeg===-90),name+': 2D button flattens the current underside');
 await p.locator('#btn-above').click();await p.waitForTimeout(70);await p.locator('#btn-below').click();await quiet(p);
 check(await p.evaluate(()=>__lasers3d.render.getLayer()==='below'&&__lasers3d.render.getCamera().elevationDeg===-90),name+': rapid face changes finish on the last requested side');
 await p.evaluate(()=>{__lasers3d.loadLevel(0);__lasers3d.ui.hideToast();});await quiet(p);check(!await p.locator('#layer-controls').isVisible(),name+': legacy boards retain ordinary controls');
 check(errors.length===0,name+': no JavaScript errors '+errors.join(';'));
 if(name==='webkit'){
  await p.evaluate(()=>{window.webkit={messageHandlers:{verification:{postMessage:r=>window.nativePreflight=r}}};});
  await p.evaluate(readFileSync('ios/Lasers3D/device-verify.js','utf8'));
  await p.waitForFunction(()=>window.nativePreflight,{},{timeout:90000});const report=await p.evaluate(()=>window.nativePreflight);
  check(report.passed,'WebKit preflight of bundled device verifier: '+report.results.length+' checks '+JSON.stringify(report.errors));
 }
 }finally{await browser.close();}
}
}finally{server.kill();}
console.log(`${checks} two-sided integration checks passed`);
