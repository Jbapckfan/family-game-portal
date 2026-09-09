// Optical art regressions: actual framebuffer lighting, authoritative target hits, finite effects and lifecycle.
import {webkit} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {existsSync,readdirSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
const cache=homedir()+(process.platform==='darwin'?'/Library/Caches/ms-playwright':'/.cache/ms-playwright');
const builds=existsSync(cache)?readdirSync(cache).filter(d=>/^webkit-\d+$/.test(d)&&existsSync(`${cache}/${d}/pw_run.sh`)).sort():[];
const launch=existsSync(webkit.executablePath())?{}:{executablePath:`${cache}/${builds.at(-1)}/pw_run.sh`};
const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const server=spawn(process.execPath,['tools/serve.mjs',String(port)],{stdio:['ignore','pipe','inherit']});
await new Promise(resolve=>server.stdout.once('data',resolve));
const browser=await webkit.launch(launch);
let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);console.log('ok '+label);checks++;};
const quiet=async p=>{
  await p.waitForFunction(()=>{const a=__lasers3d,c=a.motion.count();return !a.state.dirty&&!a.render.needsFrame()&&c.animations===0&&c.holds===0;});
  const before=await p.evaluate(()=>__lasers3d.state.frames);await p.waitForTimeout(600);
  check(await p.evaluate(()=>__lasers3d.state.frames)===before,'settled scene schedules zero frames');
};
const pose=async(p,index=6)=>{
  await p.evaluate(i=>{const a=__lasers3d;a.loadLevel(i);a.setPlaced(a.levels[i].solution);a.render.setCameraPreset('tilt',{animate:false});a.ui.hideToast();},index);
  await quiet(p);
};
const art=p=>p.evaluate(()=>__lasers3d.render.getArtState());
try {
 const p=await browser.newPage({viewport:{width:1194,height:834},deviceScaleFactor:2});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(`http://127.0.0.1:${port}/games/lasers-3d/`);
 await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);
 const worlds=[];
 for(const [i,id] of [[0,'sapphire'],[6,'obsidian'],[9,'glacier'],[13,'amethyst'],[20,'midnight']]){
  await p.evaluate(index=>__lasers3d.loadLevel(index),i);await quiet(p);
  const s=await p.evaluate(()=>({art:__lasers3d.render.getArtState(),ui:document.body.dataset.world,bg:getComputedStyle(document.body).backgroundImage}));
  check(s.art.world===id&&s.ui===id,`${id}: materials and chapter UI agree`);
  check(s.art.reveal===0&&s.art.lamps.every(v=>v===0),`${id}: flat view disables every decorative lamp`);
  check(s.art.lampCount===7,`${id}: fixed light budget survives level changes`);worlds.push(s.bg);
 }
 check(new Set(worlds).size===5,'all five chapter backgrounds actually render differently');
 await pose(p);
 const diff=await p.evaluate(()=>{
  const r=__lasers3d.render,gl=r._renderer.getContext(),lamps=[];
  r._scene.traverse(o=>{if(o.name.startsWith('shot-light-'))lamps.push(o);});
  function capture(){r._renderer.render(r._scene,r._camera);gl.finish();const b=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,b);return b;}
  const before=capture(),values=lamps.map(l=>l.intensity);lamps.forEach(l=>l.intensity=0);const after=capture();lamps.forEach((l,i)=>l.intensity=values[i]);capture();
  let changed=0,brighter=0,max=0;for(let i=0;i<before.length;i+=4){const d=before[i]+before[i+1]+before[i+2]-after[i]-after[i+1]-after[i+2];if(Math.abs(d)>3)changed++;if(d>3)brighter++;max=Math.max(max,d);}
  return {changed,brighter,max,lamps:lamps.length,calls:r._renderer.info.render.calls};
 });
 check(diff.brighter>100&&diff.max>12,`shot lamps visibly illuminate scene surfaces ${JSON.stringify(diff)}`);
 check(diff.lamps===7&&diff.calls<100,'representative solved scene stays below 100 draw calls');
 mkdirSync('output/screenshots',{recursive:true});await p.screenshot({path:'output/screenshots/art-obsidian-ipad.png'});
 // A failed shot must not light an unreached target. The moving head is the sole travelling lamp.
 await p.evaluate(()=>{const a=__lasers3d;a.loadLevel(0);a.render.setCameraPreset('tilt',{animate:false});});await quiet(p);
 await p.evaluate(()=>__lasers3d.fire());
 await p.waitForFunction(()=>__lasers3d.render.getArtState().lamps[4]>1);
 check((await art(p)).lamps.slice(5).every(v=>v===0),'charging does not light the destination in advance');
 await p.waitForFunction(()=>__lasers3d.render.getArtState().lamps[0]>0);
 check((await art(p)).lamps[0]>0,'beam head casts a travelling light during the shot');
 await quiet(p);
 check((await art(p)).lamps.slice(5).every(v=>v===0),'a missed shot leaves unreached targets unlit');
 // The real win path must run the route pulse / surface wave before presenting its modal.
 await pose(p,0);await p.evaluate(()=>__lasers3d.fire());
 await p.waitForFunction(()=>__lasers3d.render.getArtState().victory>0);
 check(await p.evaluate(()=>document.getElementById('modal-victory').hidden),'victory choreography is visible before the modal');
 check((await art(p)).lamps[5]>0,'an actually reached target illuminates its surroundings');
 await p.waitForFunction(()=>__lasers3d.render.getArtState().victory>0.5);
 await p.screenshot({path:'output/screenshots/art-victory-wave-ipad.png'});
 await quiet(p);check((await art(p)).victory===-1,'the one-shot wave ends exactly at its rest state');
 check(await p.evaluate(()=>__lasers3d.render._scene.getObjectByName('instrument-rim').material.emissiveIntensity===0),'the illuminated rim returns to zero emissive gain');
 for(const cancel of ['level','reset','reduced','hidden','quality']){
  await pose(p);await p.evaluate(()=>__lasers3d.render.playVictory());
  await p.waitForFunction(()=>__lasers3d.render.getArtState().victory>0.1);
  if(cancel==='level')await p.evaluate(()=>__lasers3d.loadLevel(9));
  if(cancel==='reset')await p.evaluate(()=>__lasers3d.reset());
  if(cancel==='reduced'){await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>__lasers3d.motion.isReducedMotion());}
  if(cancel==='quality')await p.evaluate(()=>__lasers3d.render.setQualityCut('decorative-rings-and-fog-rim'));
  if(cancel==='hidden')await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  check((await art(p)).victory===-1,`${cancel} cancels the optical wave without residue`);
  if(cancel==='hidden')await p.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});
  if(cancel==='reduced'){await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!__lasers3d.motion.isReducedMotion());}
  if(cancel==='quality'){await p.reload();await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);}
  await quiet(p);
 }
 await pose(p);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>__lasers3d.motion.isReducedMotion());
 check(!await p.evaluate(()=>__lasers3d.render.playVictory()),'reduced motion omits the sweeping celebration');await quiet(p);
 check(errors.length===0,`no WebKit or shader errors ${JSON.stringify(errors)}`);
 console.log(`${checks}/${checks} optical art checks passed`);
} finally {await browser.close();server.kill();}
