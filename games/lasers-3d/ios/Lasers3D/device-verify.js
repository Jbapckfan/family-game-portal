void (async function () {
  const results=[],errors=[],backup=localStorage.getItem('lasers3d.v1');
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(fn,ms=12000)=>{const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error('Timed out');await pause(50);}};
  const check=(value,name)=>{results.push({name,passed:!!value});if(!value)throw Error(name);};
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
  } catch(e) {errors.push(String(e.stack||e));}
  finally {
    if(window.__lasers3d)window.__lasers3d.destroy();
    if(backup===null)localStorage.removeItem('lasers3d.v1');else localStorage.setItem('lasers3d.v1',backup);
    window.webkit.messageHandlers.verification.postMessage({passed:errors.length===0,results,errors,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},userAgent:navigator.userAgent,date:new Date().toISOString()});
  }
}());
