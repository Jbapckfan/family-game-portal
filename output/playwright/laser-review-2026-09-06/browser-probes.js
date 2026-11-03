async (page) => {
  const out = { viewports: [], hints: [], gestures: {}, resume: {} };
  await page.evaluate(() => { while (__lasers3d.ui.closeTopModal()) {} });
  for (const [width, height] of [[320,568],[375,812],[393,852],[430,932],[844,390],[820,1180],[1440,900]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => __lasers3d.loadLevel(0));
    await page.waitForTimeout(350);
    out.viewports.push(await page.evaluate(() => {
      const visible = Array.from(document.querySelectorAll('#tray button')).filter(e => {
        const r=e.getBoundingClientRect();return r.width&&r.height&&!e.hidden;
      });
      return {width:innerWidth,height:innerHeight,buttons:visible.map(e=>{
        const r=e.getBoundingClientRect(),cx=r.x+r.width/2,cy=r.y+r.height/2;
        const hit=document.elementFromPoint(cx,cy);
        return {id:e.id||e.getAttribute('aria-label'),x:Math.round(r.x),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height),centerReachable:!!hit&&(hit===e||e.contains(hit))};
      })};
    }));
  }
  await page.setViewportSize({width:393,height:852});
  for(let i=0;i<23;i++) {
    await page.evaluate(i=>__lasers3d.loadLevel(i),i);
    await page.waitForTimeout(100);
    out.hints.push(await page.evaluate(()=>{
      const a=__lasers3d, r=document.getElementById('stage').getBoundingClientRect();
      const pos=a.state.solution.map(c=>{const p=a.render.projectCell(c,0);return {x:c.x,y:c.y,screenX:Math.round(p.x),screenY:Math.round(p.y),inStage:p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom};});
      return {level:a.state.levelIndex+1,name:a.state.level.name,positions:pos};
    }));
  }
  await page.evaluate(()=>{__lasers3d.loadLevel(22);__lasers3d.hint();});
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/phone-level23-hint.png'});
  await page.evaluate(()=>__lasers3d.render.setCameraPreset('tilt',{animate:false}));
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/phone-level23-tilt.png'});
  await page.evaluate(()=>__lasers3d.loadLevel(4));
  await page.waitForTimeout(150);
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/phone-level5-flat.png'});
  await page.evaluate(()=>__lasers3d.render.setCameraPreset('tilt',{animate:false}));
  await page.waitForTimeout(150);
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/phone-level5-tilt.png'});
  await page.evaluate(()=>{__lasers3d.loadLevel(0);__lasers3d.setPlaced(__lasers3d.state.solution);});
  await page.waitForTimeout(150);
  out.resume.before=await page.evaluate(()=>({placed:__lasers3d.state.placed,save:JSON.parse(localStorage.getItem('lasers3d.v1'))}));
  await page.reload();
  await page.waitForFunction(()=>window.__lasers3d&&__lasers3d.state.level);
  out.resume.after=await page.evaluate(()=>({placed:__lasers3d.state.placed,level:__lasers3d.state.levelIndex}));
  await page.evaluate(()=>{__lasers3d.loadLevel(0);document.getElementById('board').focus();});
  await page.keyboard.press('1'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
  out.gestures.beforeSpace=await page.evaluate(()=>({placed:__lasers3d.state.placed,cursor:__lasers3d.state.cursorCell}));
  await page.keyboard.down('Space');
  out.gestures.afterSpace=await page.evaluate(()=>({placed:__lasers3d.state.placed,cursor:__lasers3d.state.cursorCell}));
  await page.keyboard.up('Space');
  return out;
}
