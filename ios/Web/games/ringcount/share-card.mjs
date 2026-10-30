/** Spoiler-free result data is the only input to the image renderer. */
export function buildShareResult({game,mode,number,dateKey}) {
  if (!['won','revealed'].includes(game?.status) || !['daily','practice'].includes(mode)
      || !Number.isInteger(game.checks) || game.checks<0 || game.checks>495
      || !Number.isInteger(game.hints) || game.hints<0 || game.hints>1_000_000
      || (game.status==='won' && game.checks<1)) throw new TypeError('A completed result is required.');
  if(mode==='daily' && (!Number.isInteger(number)||number<1
      || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      || new Date(dateKey+'T12:00:00Z').toISOString().slice(0,10)!==dateKey)) throw new TypeError('Invalid daily identity.');
  const perfect=game.status==='won'&&game.hints===0&&game.checks===1;
  const headline=game.status==='revealed'?'Answer revealed.':perfect?'Perfect circle.':'Circle solved.';
  const edition=mode==='daily'?`DAILY #${String(number).padStart(3,'0')}`:'PRACTICE';
  const checks=game.checks,hints=game.hints;
  const caption=['Alford Daily · RINGCOUNT',mode==='daily'?`${edition} · ${dateKey}`:edition,
    game.status==='won'?'🟩🟩🟩🟩 Solved':'🟨🟨🟨🟨 Revealed',
    `${checks} ${checks===1?'check':'checks'} · ${hints} ${hints===1?'hint':'hints'}`].join('\n');
  return Object.freeze({headline,edition,date:mode==='daily'?dateKey:'Your practice round',
    checks,hints,status:game.status,caption,filename:`alford-ringcount-${mode==='daily'?dateKey:'practice'}`});
}

/** No board data, cut positions or puzzle-dependent geometry is accepted here. */
export function drawShareCard(canvas,result,format='portrait') {
  canvas.width=1080;canvas.height=format==='square'?1080:1350;
  const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.');
  const h=canvas.height,center=h===1080?465:550,r=h===1080?160:188;
  c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);
  c.strokeStyle='#d7cbb3';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);
  c.textAlign='center';c.fillStyle='#273640';c.font='600 26px "DM Sans",sans-serif';
  c.fillText('ALFORD DAILY',540,108);
  c.fillStyle='#9a681d';c.font='italic 70px "DM Serif",serif';c.fillText('ringcount.',540,202);
  c.font='600 22px "DM Sans",sans-serif';c.fillStyle='#5a625f';c.fillText(result.edition,540,251);
  const colors=result.status==='won'?['#7c561c','#28756a','#7860a0','#345e89']:['#a8782b','#a8782b','#a8782b','#a8782b'];
  colors.forEach((color,i)=>{
    c.beginPath();c.arc(540,center,r,(i*90-87)*Math.PI/180,(i*90-3)*Math.PI/180);
    c.strokeStyle=color;c.lineWidth=25;c.lineCap='round';c.stroke();
  });
  c.fillStyle='#273640';c.font=`${result.status==='won'?74:60}px "DM Serif",serif`;c.fillText(result.status==='won'?'4 / 4':'Revealed',540,center+7);
  c.font='22px "DM Sans",sans-serif';c.fillStyle='#5a625f';c.fillText(result.status==='won'?'BALANCED':'ANSWER SHOWN',540,center+54);
  c.fillStyle='#273640';c.font='60px "DM Serif",serif';c.fillText(result.headline,540,center+282);
  c.font='30px "DM Sans",sans-serif';
  c.fillText(`${result.checks} ${result.checks===1?'check':'checks'}  ·  ${result.hints} ${result.hints===1?'hint':'hints'}`,540,center+340);
  c.fillStyle='#5a625f';c.font='24px "DM Sans",sans-serif';c.fillText(result.date,540,h-139);
  c.font='22px "DM Sans",sans-serif';c.fillText('Four cuts. One satisfying circle.',540,h-91);
  return canvas;
}

const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),'image/png'));

export function openResultShare(api) {
  const result=buildShareResult({game:api.game,mode:api.mode,number:api.daily.number,dateKey:api.daily.dateKey});
  api.openDialog(`<p class="dialog-kicker">PASS YOUR CIRCLE ALONG</p><h2 class="dialog-title" id="dialog-title">A little balance to share.</h2>
    <div class="share-formats" role="group" aria-label="Image format"><button type="button" data-card-format="portrait" aria-pressed="true">Portrait · 4:5</button><button type="button" data-card-format="square" aria-pressed="false">Square · 1:1</button></div>
    <canvas id="result-card" role="img" aria-label="Spoiler-free Ringcount result card"></canvas>
    <p id="card-status" class="fineprint" role="status">Preparing your image…</p>
    <div class="dialog-actions share-actions"><button class="primary-button" id="share-card" disabled>Share image ↗</button><button class="secondary-button" id="download-card" disabled>Download PNG ↓</button><button class="secondary-button" id="copy-caption">Copy caption</button></div>
    <details class="share-caption"><summary>Select caption manually</summary><textarea id="card-caption" class="share-fallback" readonly aria-label="Your spoiler-free caption"></textarea></details>
    <p class="fineprint">Your result only. No numbers or solution cuts.</p>`);
  const canvas=document.getElementById('result-card'),caption=document.getElementById('card-caption');
  const status=document.getElementById('card-status'),share=document.getElementById('share-card'),download=document.getElementById('download-card');
  caption.value=result.caption;
  canvas.setAttribute('aria-label',result.caption.replaceAll('\n','. '));
  let file=null,generation=0,sharing=false;
  async function prepare(format) {
    const own=++generation;file=null;share.disabled=true;download.disabled=true;status.textContent='Preparing your image…';
    document.querySelectorAll('[data-card-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cardFormat===format)));
    try {
      await document.fonts.ready;
      if(!canvas.isConnected||own!==generation)return;
      drawShareCard(canvas,result,format);
      const blob=await pngBlob(canvas);
      if(!canvas.isConnected||own!==generation)return;
      file=new File([blob],`${result.filename}-${format}.png`,{type:'image/png'});
      download.disabled=false;
      share.disabled=!(navigator.canShare?.({files:[file]})&&navigator.share);
      status.textContent=share.disabled?'Download the image and copy the caption to your social app.':'Ready to share. Choose an app in your device’s share menu.';
    }catch {status.textContent='Image unavailable here. You can still copy or select your caption.';}
  }
  document.querySelectorAll('[data-card-format]').forEach(button=>button.addEventListener('click',()=>prepare(button.dataset.cardFormat)));
  share.addEventListener('click',async()=>{
    if(!file||sharing)return;
    const selected=file;sharing=true;share.setAttribute('aria-disabled','true');
    try {
      await navigator.share({files:[selected],title:'Ringcount · Alford Daily',text:result.caption});
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
      caption.closest('details').open=true;caption.focus();caption.select();
      status.textContent='Caption selected. Use your device’s Copy command.';
    }
  });
  prepare('portrait');
}
