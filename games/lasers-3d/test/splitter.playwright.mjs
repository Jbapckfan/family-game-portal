import {webkit,chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {existsSync,readdirSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
const cache=homedir()+'/Library/Caches/ms-playwright',builds=readdirSync(cache).filter(d=>/^webkit-\d+$/.test(d)&&existsSync(`${cache}/${d}/pw_run.sh`)).sort();
const port=await new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const server=spawn(process.execPath,['tools/serve.mjs',String(port)],{stdio:['ignore','pipe','inherit']});await new Promise(r=>server.stdout.once('data',r));
let checks=0;const check=(v,label)=>{assert.ok(v,label);checks++;console.log('ok '+label);};
const quiet=p=>p.waitForFunction(()=>{const a=__lasers3d;return !a.state.dirty&&!a.render.needsFrame()&&!a.state.resetting&&a.motion.count().animations===0&&a.motion.count().holds===0;});
try{for(const engine of [webkit,chromium]){
 const name=engine.name(),opts=name==='webkit'?(existsSync(webkit.executablePath())?{}:{executablePath:`${cache}/${builds.at(-1)}/pw_run.sh`}):(existsSync(chromium.executablePath())?{}:{channel:'chrome'});
 const browser=await engine.launch(opts);try{
 const p=await browser.newPage({viewport:{width:1194,height:834},deviceScaleFactor:1,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:${port}/games/lasers-3d/`);await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);
 await p.locator('#btn-levels').click();check(await p.locator('.level-tile').count()===27,name+': 27 puzzles');
 check(await p.locator('.level-tile[data-index="22"]').getAttribute('data-state')==='locked',name+': original campaign remains locked');
 await p.locator('#btn-splitter-chapter').click();await quiet(p);check(await p.evaluate(()=>__lasers3d.state.levelIndex===23),name+': new chapter opens from its shortcut');
 await p.locator('.tray-card[data-type="SPLITTER"]').click();const at=await p.evaluate(()=>__lasers3d.render.projectCell({x:5,y:3},0));await p.touchscreen.tap(at.x,at.y);await quiet(p);
 check(await p.evaluate(()=>__lasers3d.state.placed[0]?.type==='SPLITTER'),name+': touch places splitter');
 // Rotate twice, exercising failed and restored live routes, then undo/redo.
 await p.touchscreen.tap(at.x,at.y);await quiet(p);check(await p.evaluate(()=>!__lasers3d.sim.trace(__lasers3d.state.level,__lasers3d.state.placed).allTargetsHit),name+': rotation redirects one branch');
 await p.evaluate(()=>__lasers3d.undo());await quiet(p);check(await p.evaluate(()=>__lasers3d.sim.trace(__lasers3d.state.level,__lasers3d.state.placed).allTargetsHit),name+': undo restores split');
 await p.evaluate(()=>__lasers3d.redo());await quiet(p);await p.touchscreen.tap(at.x,at.y);await quiet(p);
 await p.locator('#btn-fire').click();await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);
 check(await p.evaluate(()=>__lasers3d.getProgress().stars[23].solved&&__lasers3d.getProgress().highestUnlocked===0),name+': victory saves bonus award without unlocking campaign');
 await p.reload();await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);check(await p.evaluate(()=>__lasers3d.state.levelIndex===23&&__lasers3d.getProgress().stars[23].solved),name+': bonus progress survives reload');
 // Deterministic renderer test: two heads on one shared distance clock, with actual target callbacks.
 const timing=await p.evaluate(()=>{
  const l={size:{w:7,d:7},terrain:Array(7).fill('0000000'),emitter:{x:0,y:3,dir:'E'},targets:[{x:6,y:3},{x:3,y:6}],tray:['SPLITTER']};
  const r=LaserSim.trace(l,[{x:3,y:3,type:'SPLITTER',orient:'/'}]),b=LaserRenderBeam.create(LaserTheme),hits=[];
  b.onLit(i=>hits.push(i));b.set(r,{fired:true,animate:true,chargeMs:0},{cellsPerSecond:1,minDurationMs:6000,maxDurationMs:6000,liveRetraceMs:100});
  b.frame(5.9,{camera:__lasers3d.render._camera,up:new THREE.Vector3(0,1,0),zoom:40,quaternion:__lasers3d.render._camera.quaternion});const before=hits.slice(),total=b.getProgress().total;
  b.frame(0.11,{camera:__lasers3d.render._camera,up:new THREE.Vector3(0,1,0),zoom:40,quaternion:__lasers3d.render._camera.quaternion});const after=hits.slice();b.frame(5,{camera:__lasers3d.render._camera,up:new THREE.Vector3(0,1,0),zoom:40,quaternion:__lasers3d.render._camera.quaternion});
  const stopped=!b.isAnimating(),attrs=[];b.group.getObjectByName('beamTubes').traverse(o=>{if(o.geometry)attrs.push(...o.geometry.getAttribute('aDist').array);});
  b.dispose();return {before,after,total,stopped,max:Math.max(...attrs)};
 });
 check(timing.before.length===0&&timing.after.length===2&&timing.total===6&&timing.max===6&&timing.stopped,name+': simultaneous receivers, shared stem distance, finite animation '+JSON.stringify(timing));
 for(const i of [23,24,25,26]){
  await p.evaluate(i=>{const a=__lasers3d;a.loadLevel(i);a.setPlaced(a.levels[i].solution);a.tilt('tilt');a.ui.hideToast();},i);await quiet(p);
  const data=await p.evaluate(()=>{const a=__lasers3d;return {calls:a.render._renderer.info.render.calls,beams:a.render._scene.getObjectByName('beamTubes').children.length};});
  check(data.calls<100&&data.beams>0,name+': puzzle '+(i+1)+' renders branching route within draw budget '+JSON.stringify(data));
  await p.locator('#btn-fire').click();await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);check(await p.evaluate(()=>__lasers3d.state.lastShot.allTargetsHit),name+': puzzle '+(i+1)+' FIRE connects all receivers');
  await p.evaluate(()=>__lasers3d.ui.hideVictory());await quiet(p);
  const frames=await p.evaluate(()=>__lasers3d.state.frames);await p.waitForTimeout(450);check(await p.evaluate(()=>__lasers3d.state.frames)===frames,name+': puzzle '+(i+1)+' has zero idle frames');
 }
 for(const [width,height] of [[320,568],[393,852],[844,390],[1376,1032]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>{__lasers3d.loadLevel(26);__lasers3d.ui.hideToast();});await quiet(p);
  const layout=await p.evaluate(()=>Array.from(document.querySelectorAll('.tray-card,#btn-fire,#btn-flat,#btn-tilt')).filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {id:b.dataset.type||b.id,w:r.width,h:r.height,in:r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5,label:b.querySelector('.tray-label')?b.querySelector('.tray-label').scrollWidth<=b.querySelector('.tray-label').clientWidth:true};}));
  check(layout.every(b=>b.w>=44&&b.h>=44&&b.in&&b.label)&&layout.some(b=>b.id==='SPLITTER'),name+': '+width+'x'+height+' usable labelled touch controls '+JSON.stringify(layout));
 }
 await p.setViewportSize({width:1194,height:834});await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(24);a.setPlaced(a.levels[24].solution);a.tilt('tilt');a.ui.hideToast();});await quiet(p);
 mkdirSync('../../output/playwright',{recursive:true});if(name==='webkit')await p.screenshot({path:'../../output/playwright/laser-splitters-three-lights.png'});
 // Reset and reduced motion must finish pending target and branch effects.
 await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__lasers3d.fire());await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);check(await p.evaluate(()=>!__lasers3d.render.needsFrame()),name+': reduced motion settles all branches');
 await p.evaluate(()=>{__lasers3d.ui.hideVictory();__lasers3d.reset();});await quiet(p);check(await p.evaluate(()=>__lasers3d.state.placed.length===0),name+': reset clears splitters');
 check(errors.length===0,name+': no JavaScript errors '+errors.join(';'));
 }finally{await browser.close();}
}}finally{server.kill();}
console.log(`${checks} splitter integration checks passed`);
