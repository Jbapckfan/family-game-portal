// team-03 concept helper: local UI states only. Nothing is stored or sent.
document.querySelectorAll('[data-toggle]').forEach(b=>{
  b.addEventListener('click',()=>{
    const on=b.getAttribute('aria-pressed')!=='true';
    b.setAttribute('aria-pressed',String(on));
    if(b.dataset.toggle==='fav')b.textContent=on?'★ Favorite':'☆ Favorite';
    if(b.dataset.toggle==='hide')b.textContent=on?'Hidden':'Hide';
  });
});
document.querySelectorAll('[data-fb]').forEach(b=>{
  b.addEventListener('click',()=>{
    const n=document.getElementById(b.dataset.fb);
    if(!n)return;n.hidden=!n.hidden;b.setAttribute('aria-expanded',String(!n.hidden));
  });
});
