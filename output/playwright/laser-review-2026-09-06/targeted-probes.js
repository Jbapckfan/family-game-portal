async (page) => {
  await page.setViewportSize({width:393,height:852});
  await page.evaluate(()=>{while(__lasers3d.ui.closeTopModal()){};__lasers3d.loadLevel(3);__lasers3d.setPlaced(__lasers3d.state.solution.slice(0,1));});
  await page.waitForTimeout(350);
  await page.getByRole('button',{name:'Show a hint',exact:true}).click();
  const hint=await page.evaluate(()=>{
    const a=__lasers3d,p=a.render.projectCell(a.state.hintGhost,0),r=document.getElementById('stage').getBoundingClientRect();
    return {level:4,ghost:a.state.hintGhost,screen:p,visible:p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom,hintUsed:a.state.hintUsed,parEligible:a.getViewModel().attemptStars.par};
  });
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/offscreen-hint-level4.png'});
  const scroll=await page.evaluate(()=>{
    const row=document.querySelector('.tray-actions'),b=document.getElementById('btn-more');
    const before={client:row.clientWidth,scroll:row.scrollWidth,left:row.scrollLeft,moreX:b.getBoundingClientRect().x};
    row.scrollLeft=row.scrollWidth;
    return {before,after:{left:row.scrollLeft,moreX:b.getBoundingClientRect().x,right:b.getBoundingClientRect().right}};
  });
  await page.getByRole('button',{name:'More controls',exact:true}).click();
  await page.getByRole('button',{name:'How to play',exact:true}).click();
  const help=await page.evaluate(()=>{
    const m=document.querySelector('#modal-help .modal'),body=document.querySelector('#modal-help .modal-body');
    return {words:body.innerText.trim().split(/\s+/).length,clientHeight:m.clientHeight,scrollHeight:m.scrollHeight};
  });
  await page.screenshot({path:'output/playwright/laser-review-2026-09-06/help-phone.png'});
  await page.getByRole('button',{name:'Close how to play',exact:true}).click();
  await page.evaluate(()=>{__lasers3d.loadLevel(20);__lasers3d.render.setViewMode('overview',{animate:false});});
  const dark=await page.evaluate(()=>{
    const a=__lasers3d,f=a.state.level.fixed[0],p=a.render.projectCell(f,0);
    return {cell:f,point:p,known:a.knownList().some(c=>c.x===f.x&&c.y===f.y)};
  });
  await page.mouse.click(dark.point.x,dark.point.y);
  dark.response=await page.evaluate(()=>document.getElementById('toast').textContent);
  return {hint,scroll,help,dark};
}
