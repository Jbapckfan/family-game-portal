/** Only played identity, total scans, assistance and outcome enter the renderer. */
export function buildShareResult({game,mode,number,dateKey}){
 if(!['won','lost','revealed'].includes(game?.status)||!['daily','practice'].includes(mode)
  ||!Array.isArray(game.scans)||game.scans.length>3||![0,1].includes(game.hints))throw new TypeError('A completed result is required.');
 if(mode==='daily'&&(!Number.isSafeInteger(number)||number<1||!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  ||new Date(dateKey+'T12:00:00Z').toISOString().slice(0,10)!==dateKey))throw new TypeError('Invalid daily identity.');
 const scans=game.scans.length,hints=game.hints,headline=game.status==='won'?'Secret found.':game.status==='lost'?'Not this time.':'Answer revealed.';
 const edition=mode==='daily'?`DAILY #${String(number).padStart(3,'0')}`:'PRACTICE';
 const outcome={won:'Solved',lost:'Missed',revealed:'Revealed'}[game.status];
 const caption=['Alford Daily · SHORTLIST',mode==='daily'?`${edition} · ${dateKey}`:edition,outcome,`${scans}/3 scans · ${hints} ${hints===1?'hint':'hints'}`].join('\n');
 return Object.freeze({headline,edition,date:mode==='daily'?dateKey:'Your practice round',scans,hints,status:game.status,caption,filename:`alford-shortlist-${mode==='daily'?dateKey:'practice'}`});
}
export function drawShareCard(canvas,result,format='portrait'){
 canvas.width=1080;canvas.height=format==='square'?1080:1350;const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.');
 const h=canvas.height,square=h===1080,y=square?420:500;c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);c.strokeStyle='#bacbe0';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);c.textAlign='center';
 function text(value,y,font,color='#273640'){c.fillStyle=color;c.font=font;let pixels=Number(/(\d+)px/.exec(font)?.[1]||30);while(c.measureText(value).width>920&&pixels>14){pixels--;c.font=font.replace(/\d+px/,`${pixels}px`);}c.fillText(value,540,y);}
 text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');text('shortlist.',202,'italic 70px "DM Serif",serif','#244d91');text(result.edition,251,'600 22px "DM Sans",sans-serif','#526279');
 for(let i=0;i<3;i++){c.beginPath();c.arc(360+i*180,y,57,0,Math.PI*2);c.fillStyle=i<result.scans?'#006b73':'#e4e9ec';c.fill();c.fillStyle=i<result.scans?'#fff':'#526279';c.font='600 36px "DM Sans",sans-serif';c.fillText(String(i+1),360+i*180,y+13);}
 text(`${result.scans} / 3`,square?650:790,'64px "DM Serif",serif');text('SCANS USED',square?692:830,'22px "DM Sans",sans-serif','#526279');
 text(result.headline,square?785:930,'54px "DM Serif",serif');
 text(`${result.status==='won'?'SOLVED':result.status==='lost'?'MISSED':'REVEALED'}  ·  ${result.hints} ${result.hints===1?'hint':'hints'}`,square?837:990,'30px "DM Sans",sans-serif');
 text(result.date,h-139,'24px "DM Sans",sans-serif','#526279');text('Three scans. Two letters. One final pick.',h-91,'22px "DM Sans",sans-serif','#526279');return canvas;
}

const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),'image/png'));

export function openResultShare(api) {
  const result=buildShareResult({game:api.game,mode:api.mode,number:api.daily.number,dateKey:api.daily.dateKey});
  api.openDialog(`<p class="dialog-kicker">SHARE YOUR SHORTLIST</p><h2 class="dialog-title" id="dialog-title">A few questions. One result.</h2>
    <div class="share-formats" role="group" aria-label="Image format"><button type="button" data-card-format="portrait" aria-pressed="true">Portrait · 4:5</button><button type="button" data-card-format="square" aria-pressed="false">Square · 1:1</button></div>
    <canvas id="result-card" role="img" aria-label="Spoiler-free Shortlist result card"></canvas>
    <p id="card-status" class="fineprint" role="status">Preparing your image…</p>
    <div class="dialog-actions share-actions"><button class="primary-button" id="share-card" type="button" disabled>Share image ↗</button><button class="secondary-button" id="download-card" type="button" disabled>Download PNG ↓</button><button class="secondary-button" id="copy-caption" type="button">Copy caption</button></div>
    <details class="share-caption"><summary>Select caption manually</summary><textarea id="card-caption" class="share-fallback" readonly aria-label="Your spoiler-free caption"></textarea></details>
    <p class="fineprint">Your result only. No secret, words, scan letters or results.</p>`);
  const canvas=document.getElementById('result-card'),caption=document.getElementById('card-caption');
  const status=document.getElementById('card-status'),share=document.getElementById('share-card'),download=document.getElementById('download-card');
  caption.value=result.caption;
  canvas.setAttribute('aria-label',`Shortlist ${result.edition}, ${result.date}. ${result.headline} ${result.scans} ${result.scans===1?'scan':'scans'}, ${result.hints} ${result.hints===1?'hint':'hints'}.`);
  let file=null,generation=0,sharing=false;
  async function prepare(format) {
    const own=++generation;file=null;share.disabled=true;download.disabled=true;status.textContent='Preparing your image…';
    document.querySelectorAll('[data-card-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cardFormat===format)));
    try {
      await Promise.all(['400 60px "DM Serif"','italic 70px "DM Serif"','400 30px "DM Sans"','600 26px "DM Sans"'].map(font=>document.fonts.load(font)));
      if(!canvas.isConnected||own!==generation)return;
      drawShareCard(canvas,result,format);
      const blob=await pngBlob(canvas);
      if(!canvas.isConnected||own!==generation)return;
      file=new File([blob],`${result.filename}-${format}.png`,{type:'image/png'});
      download.disabled=false;
      share.disabled=!(navigator.canShare?.({files:[file]})&&navigator.share);
      status.textContent=share.disabled?'Download the image and copy the caption to your social app.':'Ready to share. Choose an app in your device’s share menu.';
    }catch {if(canvas.isConnected&&own===generation)status.textContent='Image unavailable here. You can still copy or select your caption.';}
  }
  document.querySelectorAll('[data-card-format]').forEach(button=>button.addEventListener('click',()=>prepare(button.dataset.cardFormat)));
  share.addEventListener('click',async()=>{
    if(!file||sharing)return;
    const selected=file;sharing=true;share.setAttribute('aria-disabled','true');
    try {
      await navigator.share({files:[selected],title:'Shortlist · Alford Daily',text:result.caption});
      status.textContent='Share menu completed.';
    }catch(error) {
      status.textContent=error.name==='AbortError'?'Sharing cancelled. Your result is still here.':'Sharing is unavailable. Download the PNG or copy the caption.';
    }finally {sharing=false;if(canvas.isConnected)share.removeAttribute('aria-disabled');}
  });
  download.addEventListener('click',()=>{
    if(!file)return;
    const url=URL.createObjectURL(file),a=document.createElement('a');
    a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30_000);
    status.textContent='PNG download requested. Copy the caption to add your result text.';
  });
  document.getElementById('copy-caption').addEventListener('click',async()=>{
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(result.caption);
      status.textContent='Caption copied. No answers included.';
    }catch {
      caption.closest('details').open=true;caption.focus();caption.select();caption.setSelectionRange(0,caption.value.length);
      status.textContent='Caption selected. Use your device’s Copy command.';
    }
  });
  prepare('portrait');
}
