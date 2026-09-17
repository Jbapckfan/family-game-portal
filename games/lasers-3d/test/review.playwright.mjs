// Reproductions from the September 2026 gameplay reviews, through the live controller.
import {webkit,chromium} from 'playwright';
import assert from 'node:assert/strict';
import {existsSync,readdirSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';

const cache=homedir()+'/Library/Caches/ms-playwright';
const builds=existsSync(cache)?readdirSync(cache).filter(d=>/^webkit-\d+$/.test(d)&&existsSync(`${cache}/${d}/pw_run.sh`)).sort():[];
const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const server=spawn(process.execPath,['tools/serve.mjs',String(port)],{stdio:['ignore','pipe','inherit']});
await new Promise(resolve=>server.stdout.once('data',resolve));
let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;console.log('ok '+label);};
const quiet=p=>p.waitForFunction(()=>{const a=__lasers3d;return !a.state.dirty&&!a.render.needsFrame()&&!a.state.resetting&&a.motion.count().animations===0&&a.motion.count().holds===0;});
// [level number, x, y] of a legal spare MIRROR / that breaks the authored route.
const extras=[[1,3,3],[2,9,1],[3,9,1],[4,2,2],[5,11,1],[6,10,4],[7,15,4],[8,6,4],[9,4,1],[10,2,3],[11,3,4],[12,13,0],[13,12,4],[14,5,6],[15,8,1],[16,5,0],[18,16,6],[19,19,3],[20,16,2],[21,3,10],[22,2,5],[23,10,15]];

try { for(const engine of [webkit,chromium]) {
  const name=engine.name();
  const opts=name==='webkit'?(existsSync(webkit.executablePath())?{}:{executablePath:`${cache}/${builds.at(-1)}/pw_run.sh`}):(existsSync(chromium.executablePath())?{}:{channel:'chrome'});
  const browser=await engine.launch(opts);
  try {
    const p=await browser.newPage({viewport:{width:1194,height:834},hasTouch:true});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/games/lasers-3d/`);
    await p.waitForFunction(()=>window.__lasers3d?.state.frames>0);await quiet(p);
    // Keep the opening tutorial from replacing the toast being asserted.
    await p.evaluate(()=>{__lasers3d.getProgress().tutorialDone=true;});
    for(const [number,x,y] of extras) {
      await p.evaluate(number=>__lasers3d.loadLevel(number-1),number);await quiet(p);
      const r=await p.evaluate(({number,x,y})=>{
        const a=__lasers3d,extra={x,y,type:'MIRROR',orient:'/'};
        a.setPlaced([...a.levels[number-1].solution,extra]);
        const failed=!a.sim.trace(a.state.level,a.state.placed).allTargetsHit;
        a.hint();a.hint();
        const free=!a.state.hintUsed&&!/Press FIRE/.test(document.getElementById('toast').textContent);
        a.hint();
        return {failed,free,used:a.state.hintUsed,ghost:a.state.hintGhost,text:document.getElementById('toast').textContent};
      },{number,x,y});
      check(r.failed&&r.free&&r.used&&!r.ghost&&r.text.includes(`Remove the extra MIRROR at column ${x+1}, row ${y+1}.`),`${name}: L${number} identifies interfering extra; only exact advice uses assist ${JSON.stringify(r)}`);
      // Advice is actionable, and a winning arrangement now gets truthful confirmation.
      const fixed=await p.evaluate(()=>{const a=__lasers3d;a.setPlaced(a.levels[a.state.levelIndex].solution);a.hint();return a.sim.trace(a.state.level,a.state.placed).allTargetsHit&&document.getElementById('toast').textContent.includes('Your route works.');});
      check(fixed,`${name}: L${number} removing extra connects all receivers`);
    }

    await p.evaluate(()=>__lasers3d.loadLevel(12));await quiet(p);
    const floor=await p.evaluate(()=>{
      const a=__lasers3d,partial=a.levels[12].solution.slice(0,2).map(p=>({...p}));
      partial.find(p=>p.type==='FLOOR').orient='\\';a.setPlaced(partial);a.hint();a.hint();a.hint();
      return {ghost:a.state.hintGhost,text:document.getElementById('toast').textContent};
    });
    check(floor.ghost?.type==='DIP'&&floor.ghost.x===8&&floor.ghost.y===4&&!floor.text.includes('FLOOR'),`${name}: equivalent FLOOR orientation does not distract from missing DIP`);
    await p.evaluate(()=>__lasers3d.reset());await quiet(p);
    const solvedFloor=await p.evaluate(()=>{
      const a=__lasers3d,placed=a.levels[12].solution.map(p=>({...p}));placed.find(p=>p.type==='FLOOR').orient='\\';a.setPlaced(placed);a.hint();
      return {won:a.sim.trace(a.state.level,placed).allTargetsHit,used:a.state.hintUsed,text:document.getElementById('toast').textContent};
    });
    check(solvedFloor.won&&!solvedFloor.used&&solvedFloor.text.includes('Your route works.'),`${name}: alternate FLOOR orientation solves without assistance`);
    await p.evaluate(()=>__lasers3d.reset());await quiet(p);
    const missingFloor=await p.evaluate(()=>{
      const a=__lasers3d;a.setPlaced(a.levels[12].solution.filter(p=>p.type!=='FLOOR'));a.hint();a.hint();a.hint();
      return {ghost:a.state.hintGhost,text:document.getElementById('toast').textContent};
    });
    check(missingFloor.ghost?.type==='FLOOR'&&!missingFloor.text.includes('facing'),`${name}: FLOOR placement advice omits meaningless orientation`);

    await p.evaluate(()=>__lasers3d.loadLevel(28));await quiet(p);
    await p.evaluate(()=>{const a=__lasers3d;a.setPlaced(a.levels[28].solution);a.fire();});
    await p.waitForFunction(()=>__lasers3d.state.status==='won');await quiet(p);
    await p.evaluate(()=>__lasers3d.ui.hideVictory());await quiet(p);
    const events=await p.evaluate(()=>__lasers3d.state.lastShot.events);
    check(events.some(e=>e.kind==='crossing'&&e.side==='above')&&events.some(e=>e.kind==='crossing'&&e.side==='below'),`${name}: return route actually crosses both ways`);
    await p.locator('#btn-camera-tools').click();
    for(let i=0;i<events.length;i++) {
      await p.locator('[data-event="1"]').click();
      if(events[i].kind!=='crossing')continue;
      await quiet(p);
      const r=await p.evaluate(()=>({side:__lasers3d.render.getLayer(),flat:__lasers3d.render.isFlat(),label:document.querySelector('.event-description').textContent}));
      check(r.side===events[i].side&&r.flat&&r.label.includes('Through the opening to '+(events[i].side==='below'?'Below':'Above')+'.'),`${name}: inspector follows crossing to ${events[i].side} and retains 2D ${JSON.stringify(r)}`);
    }
    for(let i=events.length-2;i>=0;i--) {
      await p.locator('[data-event="-1"]').click();
      if(events[i].kind!=='crossing')continue;
      await quiet(p);
      check(await p.evaluate(()=>__lasers3d.render.getLayer())===events[i].side,`${name}: previous-event navigation follows ${events[i].side} crossing`);
    }
    await p.locator('.close-tools').click();

    await p.evaluate(()=>__lasers3d.loadLevel(0));await quiet(p);
    await p.evaluate(()=>__lasers3d.reset());await quiet(p);
    await p.locator('.tray-card[data-type="MIRROR"]').click();await quiet(p);
    async function touch(duration,{cancel=false}={}) {
      const at=await p.evaluate(()=>__lasers3d.render.projectCell({x:2,y:3},0));
      const pointer={pointerId:77,pointerType:'touch',isPrimary:true,clientX:at.x,clientY:at.y,button:0,buttons:1};
      await p.dispatchEvent('#board','pointerdown',pointer);await p.waitForTimeout(duration);
      await p.dispatchEvent('#board',cancel?'pointercancel':'pointerup',{...pointer,buttons:0});await quiet(p);
    }
    for(const duration of [450,650]) {
      await p.evaluate(()=>__lasers3d.setPlaced([]));await quiet(p);
      await touch(duration);
      check(await p.evaluate(()=>__lasers3d.state.placed.length===1),`${name}: ${duration} ms stationary empty-cell touch places once`);
    }
    const before=await p.evaluate(()=>__lasers3d.state.placed[0].orient);
    await touch(400);
    check(await p.evaluate(()=>__lasers3d.state.placed[0].orient)!==before,`${name}: deliberate piece tap rotates`);
    const placed=await p.evaluate(()=>JSON.stringify(__lasers3d.state.placed));
    await touch(650);
    check(await p.evaluate(()=>JSON.stringify(__lasers3d.state.placed))===placed,`${name}: holding a piece selects for moving without rotation`);
    await p.evaluate(()=>__lasers3d.setPlaced([]));await quiet(p);await touch(650,{cancel:true});
    check(await p.evaluate(()=>__lasers3d.state.placed.length===0),`${name}: cancelled long touch never places`);
    check(errors.length===0,`${name}: no runtime exceptions ${JSON.stringify(errors)}`);
    mkdirSync('../../output/playwright',{recursive:true});
    await p.screenshot({path:`../../output/playwright/laser-review-fixed-${name}.png`});
  } finally {await browser.close();}
} console.log(`${checks}/${checks} review regression checks passed`);
} finally {server.kill();}
