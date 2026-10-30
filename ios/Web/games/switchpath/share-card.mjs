/** Only result identity and honest score fields may reach the image renderer. */
export function buildShareResult({game,mode,number,dateKey}){
  if(!['won','revealed'].includes(game?.status)||!['daily','practice'].includes(mode)
    ||!Number.isSafeInteger(game.moves)||game.moves<0
    ||!Number.isSafeInteger(game.hints)||game.hints<0||game.hints>game.moves
    ||(game.status==='won'&&game.moves<15))throw new TypeError('A completed result is required.');
  if(mode==='daily'&&(!Number.isSafeInteger(number)||number<1
    ||!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
    ||new Date(dateKey+'T12:00:00Z').toISOString().slice(0,10)!==dateKey))throw new TypeError('Invalid daily identity.');
  const perfect=game.status==='won'&&game.moves===15&&game.hints===0;
  const headline=game.status==='revealed'?'Route revealed.':perfect?'Perfect flow.':'Route solved.';
  const edition=mode==='daily'?`DAILY #${String(number).padStart(3,'0')}`:'PRACTICE';
  const moves=game.moves,hints=game.hints;
  const caption=['Alford Daily · SWITCHPATH',mode==='daily'?`${edition} · ${dateKey}`:edition,
    game.status==='won'?'🟩🟩🟩🟩 '+(perfect?'Perfect':'Solved'):'🟨🟨🟨🟨 Revealed',
    `${moves} ${moves===1?'move':'moves'} · ${hints} ${hints===1?'hint':'hints'}`].join('\n');
  return Object.freeze({headline,edition,date:mode==='daily'?dateKey:'Your practice round',moves,hints,
    status:game.status,caption,filename:`alford-switchpath-${mode==='daily'?dateKey:'practice'}`});
}

/** Fixed abstract artwork; no board or route is accepted or drawn. */
export function drawShareCard(canvas,result,format='portrait'){
  canvas.width=1080;canvas.height=format==='square'?1080:1350;
  const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.');
  const h=canvas.height,square=h===1080,top=square?320:390,size=square?48:60,gap=14;
  c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);
  c.strokeStyle='#c2cee0';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);
  c.textAlign='center';
  function text(value,y,font,color='#273640'){
    c.fillStyle=color;c.font=font;
    const match=/(\d+)px/.exec(font);let pixels=Number(match?.[1]||30);
    while(c.measureText(value).width>920&&pixels>14){pixels--;c.font=font.replace(/\d+px/,`${pixels}px`);}
    c.fillText(value,540,y);
  }
  text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');
  text('switchpath.',202,'italic 70px "DM Serif",serif','#355fa7');
  text(result.edition,251,'600 22px "DM Sans",sans-serif','#526279');
  const width=4*size+3*gap,left=(1080-width)/2;
  for(let i=0;i<16;i++){
    c.fillStyle=result.status==='won'?(i%2?'#6588bd':'#355fa7'):'#bc944e';
    c.beginPath();c.roundRect(left+(i%4)*(size+gap),top+Math.floor(i/4)*(size+gap),size,size,10);c.fill();
  }
  text(result.status==='won'?'16 / 16':'Revealed',square?640:790,'64px "DM Serif",serif');
  text(result.status==='won'?'ALL CONNECTED':'ANSWER SHOWN',square?678:830,'22px "DM Sans",sans-serif','#526279');
  text(result.headline,square?775:930,'54px "DM Serif",serif');
  text(`${result.moves} ${result.moves===1?'move':'moves'}  ·  ${result.hints} ${result.hints===1?'hint':'hints'}`,square?830:990,'30px "DM Sans",sans-serif');
  text(result.date,h-139,'24px "DM Sans",sans-serif','#526279');
  text('Higher. Lower. Find your flow.',h-91,'22px "DM Sans",sans-serif','#526279');
  return canvas;
}

const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),'image/png'));

export function openResultShare(api) {
  const result=buildShareResult({game:api.game,mode:api.mode,number:api.daily.number,dateKey:api.daily.dateKey});
  api.openDialog(`<p class="dialog-kicker">SHARE YOUR FLOW</p><h2 class="dialog-title" id="dialog-title">Every turn, in one result.</h2>
    <div class="share-formats" role="group" aria-label="Image format"><button type="button" data-card-format="portrait" aria-pressed="true">Portrait · 4:5</button><button type="button" data-card-format="square" aria-pressed="false">Square · 1:1</button></div>
    <canvas id="result-card" role="img" aria-label="Spoiler-free Switchpath result card"></canvas>
    <p id="card-status" class="fineprint" role="status">Preparing your image…</p>
    <div class="dialog-actions share-actions"><button class="primary-button" id="share-card" type="button" disabled>Share image ↗</button><button class="secondary-button" id="download-card" type="button" disabled>Download PNG ↓</button><button class="secondary-button" id="copy-caption" type="button">Copy caption</button></div>
    <details class="share-caption"><summary>Select caption manually</summary><textarea id="card-caption" class="share-fallback" readonly aria-label="Your spoiler-free caption"></textarea></details>
    <p class="fineprint">Your result only. No numbers or solution path.</p>`);
  const canvas=document.getElementById('result-card'),caption=document.getElementById('card-caption');
  const status=document.getElementById('card-status'),share=document.getElementById('share-card'),download=document.getElementById('download-card');
  caption.value=result.caption;
  canvas.setAttribute('aria-label',`Switchpath ${result.edition}, ${result.date}. ${result.headline} ${result.moves} moves, ${result.hints} hints.`);
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
      await navigator.share({files:[selected],title:'Switchpath · Alford Daily',text:result.caption});
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
