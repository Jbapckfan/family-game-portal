// Full touch camera flows: native Chromium touch dispatch, plus WebKit Pointer Events through the same host.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {existsSync,readdirSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const server=spawn(process.execPath,['tools/serve.mjs',String(port)],{stdio:['ignore','pipe','inherit']});
await new Promise(resolve=>server.stdout.once('data',resolve));
const cache=homedir()+(process.platform==='darwin'?'/Library/Caches/ms-playwright':'/.cache/ms-playwright');
const builds=existsSync(cache)?readdirSync(cache).filter(d=>/^webkit-\d+$/.test(d)&&existsSync(`${cache}/${d}/pw_run.sh`)).sort():[];
let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;console.log('ok '+label);};
const state=p=>p.evaluate(()=>({camera:__lasers3d.render.getCamera(),tilts:__lasers3d.state.tiltsUsed,placed:JSON.stringify(__lasers3d.state.placed),frames:__lasers3d.state.frames}));
const settle=p=>p.waitForFunction(()=>{const a=__lasers3d;return !a.state.dirty&&!a.render.needsFrame()&&a.motion.count().webgl===0;});
const centre=p=>p.evaluate(()=>{
 const a=__lasers3d,r=a.render,b=document.getElementById('board').getBoundingClientRect();
 const c=new THREE.Vector3((a.state.level.size.w-1)/2,0,-(a.state.level.size.d-1)/2);
 const forward=r._camera.getWorldDirection(new THREE.Vector3()),toward=c.clone().sub(r._camera.position).normalize();
 c.project(r._camera);return {x:c.x*b.width/2,y:-c.y*b.height/2,alignment:forward.dot(toward)};
});
try {
 for(const engine of ['chromium','webkit']) {
  const launch=engine==='chromium'?(existsSync(chromium.executablePath())?{}:{channel:'chrome'}):
    (existsSync(webkit.executablePath())?{}:{executablePath:`${cache}/${builds.at(-1)}/pw_run.sh`});
  const browser=await (engine==='chromium'?chromium:webkit).launch(launch);
  try {
   const ctx=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,deviceScaleFactor:2});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(`http://127.0.0.1:${port}/games/lasers-3d/`);await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await settle(p);
   const cdp=engine==='chromium'?await ctx.newCDPSession(p):null;let previous=[];
   async function touch(type,points) {
    // Chrome accepts a changed-point list for a partial touchEnd; an empty list releases every contact.
    if(cdp)await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:(type==='touchEnd'&&points.length?previous.filter(q=>!points.some(n=>n[0]===q[0])):points).map(([id,x,y])=>({id,x,y,radiusX:4,radiusY:4,force:1}))});
    else await p.evaluate(({type,points,previous})=>{
      const canvas=document.getElementById('board'),send=(name,q)=>canvas.dispatchEvent(new PointerEvent(name,{pointerId:q[0],clientX:q[1],clientY:q[2],pointerType:'touch',button:0,buttons:name==='pointerup'?0:1,bubbles:true}));
      if(type==='touchCancel')previous.forEach(q=>send('pointercancel',q));
      else {
       previous.filter(q=>!points.some(n=>n[0]===q[0])).forEach(q=>send('pointerup',q));
       points.filter(q=>!previous.some(n=>n[0]===q[0])).forEach(q=>send('pointerdown',q));
       if(type==='touchMove')points.forEach(q=>send('pointermove',q));
      }
    },{type,points,previous});
    previous=points;
   }
   // Fixture an actual piece, then start the pan directly on it.
   await p.evaluate(()=>{const a=__lasers3d;a.setPlaced([a.levels[0].solution[0]]);a.focusCell(a.state.placed[0],false);});await settle(p);
   const point=await p.evaluate(()=>__lasers3d.render.projectCell(__lasers3d.state.placed[0],0)),s0=await state(p);
   await touch('touchStart',[[1,point.x,point.y]]);
   await touch('touchMove',[[1,point.x+45,point.y+25]]);await touch('touchEnd',[]);await settle(p);
   let s=await state(p);
   check(s.placed===s0.placed&&s.tilts===s0.tilts&&s.camera.elevationDeg===90,`${engine}: dragging on a piece pans without editing or tilting`);
   const afterPoint=await p.evaluate(()=>__lasers3d.render.projectCell(__lasers3d.state.placed[0],0));
   check(Math.abs(afterPoint.x-point.x-45)<1&&Math.abs(afterPoint.y-point.y-25)<1,`${engine}: board tracks one-finger displacement exactly`);
   // Pinch with one anchored finger includes midpoint drift; it must stay purely a zoom.
   const beforePinch=await state(p);
   await touch('touchStart',[[1,350,360],[2,530,360]]);
   for(let i=1;i<=8;i++){await touch('touchMove',[[1,350,360],[2,530+i*8,360]]);await p.waitForTimeout(17);}
   await touch('touchEnd',[]);await settle(p);s=await state(p);
   check(s.camera.effectiveZoom>beforePinch.camera.effectiveZoom*1.2&&s.tilts===beforePinch.tilts&&s.camera.elevationDeg===90,`${engine}: drifting pinch zooms and preserves FROM ABOVE eligibility`);
   // A rigid downward gesture tilts. Sample every frame to catch intermediate zoom wobble.
   const beforeTilt=await state(p),samples=[];
   await touch('touchStart',[[1,350,330],[2,530,330]]);
   for(let i=1;i<=12;i++){await touch('touchMove',[[1,350,330+i*7],[2,530,330+i*7]]);await p.waitForTimeout(20);samples.push((await state(p)).camera);}
   await touch('touchEnd',[[1,350,414]]);await settle(p);s=await state(p);
   check(s.camera.elevationDeg<beforeTilt.camera.elevationDeg-25&&s.tilts===beforeTilt.tilts+1,`${engine}: two-finger drag tilts with one counted gesture`);
   check(samples.every(c=>Math.abs(c.zoom-beforeTilt.camera.zoom)<1e-8)&&samples.every((c,i)=>i===0||c.elevationDeg<=samples[i-1].elevationDeg),`${engine}: rigid drag has no pinch wobble or reverse camera steps`);
   const survivorBefore=await p.evaluate(()=>__lasers3d.render.getBoardScreenBox());
   await touch('touchMove',[[1,377,428]]);await touch('touchEnd',[]);await settle(p);
   const survivorAfter=await p.evaluate(()=>__lasers3d.render.getBoardScreenBox());
   check(Math.abs(survivorAfter.centerX-survivorBefore.centerX-27)<1&&Math.abs(survivorAfter.centerY-survivorBefore.centerY-14)<1,`${engine}: lifting a finger flows into pan without a jump`);
   check((await state(p)).placed===s0.placed,`${engine}: the complete pan/pinch/tilt sequence preserves the puzzle`);
   // Sideways paired motion changes azimuth; a cancel leaves no input contact or ongoing frame demand.
   const az0=(await state(p)).camera.azimuthDeg;
   await touch('touchStart',[[1,350,400],[2,530,400]]);await touch('touchMove',[[1,380,400],[2,560,400]]);await p.waitForTimeout(40);
   await touch('touchCancel',[]);await settle(p);
   check(Math.abs((await state(p)).camera.azimuthDeg-az0)>5,`${engine}: sideways two-finger drag rotates the board`);
   const f0=(await state(p)).frames;await p.waitForTimeout(600);
   check((await state(p)).frames===f0,`${engine}: cancelled/settled camera schedules zero idle frames`);
   // Touch must take over an in-progress fit instead of having its next frame undo the user's movement.
   for(const operation of ['pan','zoom','orbit']){
    const result=await p.evaluate(op=>{
     const a=__lasers3d,r=a.render;r.setViewMode('overview',{animate:true});
     if(op==='pan')r.pan(30,15);if(op==='zoom')r.zoom(1.2);if(op==='orbit')r.orbit(0.1,0);
     a.ui.fitStage();return {camera:r.getCamera()};
    },operation);
    check(!result.camera.animating,`${engine}: ${operation} takes over a fit animation immediately`);
   }
   await p.click('#btn-flat');await settle(p);
   check((await state(p)).camera.elevationDeg===90,`${engine}: FLAT remains a reliable one-tap reset`);
   const beforeClamp=(await state(p)).tilts;
   await touch('touchStart',[[1,350,420],[2,530,420]]);await touch('touchMove',[[1,350,390],[2,530,390]]);await p.waitForTimeout(40);await touch('touchEnd',[]);await settle(p);
   check((await state(p)).tilts===beforeClamp,`${engine}: pulling above the flat limit does not consume a tilt`);
   await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>__lasers3d.motion.isReducedMotion());
   await touch('touchStart',[[1,350,400],[2,530,400]]);await touch('touchMove',[[1,350,430],[2,530,430]]);await p.waitForTimeout(40);await touch('touchEnd',[]);await settle(p);
   check((await state(p)).camera.elevationDeg<90,`${engine}: direct camera control remains responsive with reduced motion`);
   // The physical pivot is the board centre, even after panning and zooming. Verify actual
   // projection matrices, not just the rig's reported pan, throughout a native paired drag.
   await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!__lasers3d.motion.isReducedMotion());
   await p.click('#btn-flat');await settle(p);
   await p.evaluate(()=>{const a=__lasers3d;a.render.zoom(1.6);a.render.pan(60,35);a.ui.fitStage();});await settle(p);
   const pivot0=await centre(p),pivots=[];
   await touch('touchStart',[[1,350,340],[2,530,340]]);
   for(let i=1;i<=10;i++){
    await touch('touchMove',[[1,350+i*3,340+i*6],[2,530+i*3,340+i*6]]);await p.waitForTimeout(20);pivots.push(await centre(p));
   }
   await touch('touchEnd',[]);await settle(p);pivots.push(await centre(p));
   check(pivots.every(c=>Math.hypot(c.x-pivot0.x,c.y-pivot0.y)<0.1),`${engine}: the panned board centre stays fixed during rotation and fit easing`);
   check(pivots.every(c=>c.alignment>0.999999),`${engine}: camera orbit axis passes through the middle of the board`);
   // A mode button always returns a manually offset camera to a useful centred framing.
   const switchResult=await p.evaluate(async()=>{
    const a=__lasers3d,r=a.render,b=document.getElementById('board').getBoundingClientRect(),samples=[],start=performance.now();
    document.getElementById('btn-tilt').click();
    const selected=document.getElementById('btn-tilt').getAttribute('aria-pressed');
    do {
     await new Promise(requestAnimationFrame);
     const c=new THREE.Vector3((a.state.level.size.w-1)/2,0,-(a.state.level.size.d-1)/2).project(r._camera);
     samples.push(Math.hypot(c.x*b.width/2,c.y*b.height/2));
    } while(r.getCamera().animating);
    return {elapsed:performance.now()-start,samples,selected,camera:r.getCamera(),bounds:r.getBoardScreenBox(),width:b.width,height:b.height};
   });await settle(p);
   check(switchResult.selected==='true'&&switchResult.elapsed<650,`${engine}: 3D selects immediately and completes its short transition (${Math.round(switchResult.elapsed)} ms)`);
   check(switchResult.samples.every((d,i)=>i===0||d<=switchResult.samples[i-1]+0.2)&&(await centre(p)).x**2+(await centre(p)).y**2<0.01,`${engine}: view switch recentres smoothly without swinging past the centre`);
   check(switchResult.camera.view==='overview'&&!switchResult.camera.manual&&switchResult.bounds.width<=switchResult.width+1&&switchResult.bounds.height<=switchResult.height+1,`${engine}: 3D fits the whole board after manual pan and zoom`);
   const countBeforeRepeat=(await state(p)).tilts;await p.click('#btn-tilt');await settle(p);
   check((await state(p)).tilts===countBeforeRepeat,`${engine}: selecting the active view does not charge another tilt`);
   await p.evaluate(async()=>{
    document.getElementById('btn-flat').click();await new Promise(r=>setTimeout(r,50));
    document.getElementById('btn-tilt').click();await new Promise(r=>setTimeout(r,50));
    document.getElementById('btn-flat').click();
   });await settle(p);
   check((await state(p)).camera.elevationDeg===90&&await p.locator('#btn-flat').getAttribute('aria-pressed')==='true',`${engine}: rapid view swaps finish in the last requested mode`);
   for(const [width,height] of [[320,568],[393,852],[1376,1032]]){
    await p.setViewportSize({width,height});await settle(p);
    check(await p.evaluate(()=>['btn-flat','btn-tilt'].every(id=>{const b=document.getElementById(id).getBoundingClientRect();return b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight;})),`${engine}: both view buttons are visible and tappable at ${width}×${height}`);
   }
   await p.setViewportSize({width:1194,height:834});await settle(p);
   await p.click('#btn-camera-tools');check((await p.getByRole('dialog',{name:'Camera and beam tools'}).innerText()).includes('One finger pans'),`${engine}: camera help teaches the new gestures`);
   check(errors.length===0,`${engine}: no runtime exceptions ${JSON.stringify(errors)}`);
   mkdirSync('output/screenshots',{recursive:true});await p.screenshot({path:`output/screenshots/camera-controls-${engine}.png`});
   if(cdp)await cdp.detach();await ctx.close();
  } finally {await browser.close();}
 }
 console.log(`${checks}/${checks} camera gesture checks passed`);
} finally {server.kill();}
