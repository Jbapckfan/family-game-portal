void (async function () {
  const results=[],errors=[],backup=localStorage.getItem('lasers3d.v1');
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(fn,ms=12000)=>{const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error('Timed out');await pause(50);}};
  const check=(value,name,details)=>{results.push({name,passed:!!value,...(details?{details}:{})});if(!value)throw Error(name);};
  try {
    await until(()=>window.__lasers3d?.state.frames>0);
    const a=window.__lasers3d;
    check(!!a.render&&!a.render._renderer.getContext().isContextLost(),'Physical iPad WebGL renderer active');
    check(a.levels.length===23&&a.levels.every(l=>a.sim.trace(l,l.solution).allTargetsHit),'All 23 bundled solutions connect');
    a.loadLevel(0);a.reset();await pause(300);
    const solution=a.levels[0].solution[0];a.focusCell(solution,true);await pause(100);
    document.querySelector('.tray-card[data-type="MIRROR"]').click();
    const canvas=document.getElementById('board');
    function tap(){const p=a.render.projectCell(solution,0);for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,clientX:p.x,clientY:p.y,button:0,buttons:type==='pointerdown'?1:0}));}
    tap();await pause(120);if(a.state.placed[0]?.orient!==solution.orient){tap();await pause(120);}
    check(a.state.placed.length===1&&a.sim.trace(a.state.level,a.state.placed).allTargetsHit,'Board placement and rotation produce a winning route');
    a.saveAttempt();check(!!JSON.parse(localStorage.getItem('lasers3d.v1')).attempts[0],'An unfinished attempt is saved');
    document.getElementById('btn-fire').click();await until(()=>a.state.status==='won');await until(()=>!document.getElementById('modal-victory').hidden);
    check(a.getProgress().stars[0].solved&&a.getProgress().stars[0].par&&a.getProgress().stars[0].blind,'FIRE animation completes and records three stars');
    check(document.querySelectorAll('.mastery-badge').length===1,'From Above award is rendered');
    check(Array.from(document.querySelectorAll('.tray-actions > button')).filter(b=>b.offsetParent!==null).every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),'iPad actions fit and retain 44 point touch targets');
    a.ui.hideVictory();a.loadLevel(3);a.setPlaced([a.levels[3].solution[0]]);await pause(100);a.hint();a.hint();a.hint();await pause(150);
    const p=a.render.projectCell(a.state.hintGhost,0),b=canvas.getBoundingClientRect();check(p.x>b.left&&p.x<b.right&&p.y>b.top&&p.y<b.bottom,'Exact hint is visible on the physical iPad');
    a.loadLevel(0);a.reset();await pause(300);
    await until(()=>!a.state.resetting&&!a.render.needsFrame());
    const bounds=canvas.getBoundingClientRect(),cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
    const pointer=(type,id,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1}));
    const pan0=a.render.getCamera().pan,placed0=JSON.stringify(a.state.placed),tilts0=a.state.tiltsUsed;
    pointer('pointerdown',11,cx,cy);pointer('pointermove',11,cx+40,cy+20);pointer('pointerup',11,cx+40,cy+20);await pause(100);
    check(JSON.stringify(a.render.getCamera().pan)!==JSON.stringify(pan0)&&a.render.isFlat()&&a.state.tiltsUsed===tilts0&&JSON.stringify(a.state.placed)===placed0,'One-finger pan preserves pieces and flat-view eligibility');
    pointer('pointerdown',11,cx-70,cy);pointer('pointerdown',12,cx+70,cy);
    for(let i=1;i<=6;i++){pointer('pointermove',11,cx-70,cy+i*10);pointer('pointermove',12,cx+70,cy+i*10);await pause(20);}
    pointer('pointerup',12,cx+70,cy+60);await until(()=>!a.render.needsFrame());
    check(a.render.getCamera().elevationDeg<75&&a.state.tiltsUsed===tilts0+1,'Two-finger drag tilts smoothly as one gesture',
      {camera:a.render.getCamera(),tilts:a.state.tiltsUsed,initialTilts:tilts0});
    const pan1=JSON.stringify(a.render.getCamera().pan);
    pointer('pointermove',11,cx-45,cy+70);pointer('pointerup',11,cx-45,cy+70);await pause(100);
    check(JSON.stringify(a.render.getCamera().pan)!==pan1&&JSON.stringify(a.state.placed)===placed0,'Lifting one finger continues into pan without editing');
    const zoom0=a.render.getCamera().effectiveZoom,tilt1=a.state.tiltsUsed,el0=a.render.getCamera().elevationDeg;
    pointer('pointerdown',11,cx-70,cy);pointer('pointerdown',12,cx+70,cy);pointer('pointermove',12,cx+120,cy);await pause(50);
    pointer('pointerup',12,cx+120,cy);pointer('pointerup',11,cx-70,cy);await until(()=>!a.render.needsFrame());
    check(a.render.getCamera().effectiveZoom>zoom0&&a.state.tiltsUsed===tilt1&&a.render.getCamera().elevationDeg===el0,'Pinch zoom does not introduce an accidental tilt');
    await until(()=>!a.state.dirty&&a.motion.count().webgl===0&&!a.render.needsFrame());
    const idleFrames=a.state.frames;await pause(600);check(a.state.frames===idleFrames,'Camera controls settle to zero idle application frames');
    check(['btn-flat','btn-tilt'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),'Separate 2D and 3D buttons are visible and tappable');
    const worldCentre=new THREE.Vector3((a.state.level.size.w-1)/2,0,-(a.state.level.size.d-1)/2);
    const projectedCentre=()=>worldCentre.clone().project(a.render._camera);
    a.render.zoom(1.3);a.render.pan(30,15);a.ui.fitStage();await until(()=>!a.render.needsFrame()&&!a.state.dirty);
    const pivot0=projectedCentre();
    pointer('pointerdown',21,cx-70,cy);pointer('pointerdown',22,cx+70,cy);
    pointer('pointermove',21,cx-35,cy+20);pointer('pointermove',22,cx+105,cy+20);await pause(60);
    pointer('pointerup',21,cx-35,cy+20);pointer('pointerup',22,cx+105,cy+20);await until(()=>!a.render.needsFrame());
    const pivot1=projectedCentre(),camera=a.render._camera;
    check(Math.hypot(pivot1.x-pivot0.x,pivot1.y-pivot0.y)<0.0001&&camera.getWorldDirection(new THREE.Vector3()).dot(worldCentre.clone().sub(camera.position).normalize())>0.999999,'Rotation stays around the board centre after panning and zooming');
    document.getElementById('btn-tilt').click();await until(()=>!a.render.needsFrame()&&!a.state.dirty);
    const centred=projectedCentre();check(Math.hypot(centred.x,centred.y)<0.0001&&a.render.getCamera().view==='overview','3D button recentres and fits the board');
    document.getElementById('btn-flat').click();await pause(50);document.getElementById('btn-tilt').click();await pause(50);document.getElementById('btn-flat').click();
    await until(()=>!a.render.needsFrame()&&!a.state.dirty);
    check(a.render.isFlat()&&document.getElementById('btn-flat').getAttribute('aria-pressed')==='true','Rapid view swaps finish in the last selected 2D view');
  } catch(e) {errors.push(String(e.stack||e));}
  finally {
    if(window.__lasers3d)window.__lasers3d.destroy();
    if(backup===null)localStorage.removeItem('lasers3d.v1');else localStorage.setItem('lasers3d.v1',backup);
    window.webkit.messageHandlers.verification.postMessage({passed:errors.length===0,results,errors,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},userAgent:navigator.userAgent,date:new Date().toISOString()});
  }
}());
