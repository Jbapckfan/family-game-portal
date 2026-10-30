/** The renderer receives only the played identity and honest score totals. */
export function buildShareResult({game,mode,number,dateKey}){
 if(!['won','revealed'].includes(game?.status)||!['daily','practice'].includes(mode)
   ||!Number.isSafeInteger(game.attempts)||game.attempts<0||(game.status==='won'&&game.attempts<5)
   ||!Array.isArray(game.hintedRows)||new Set(game.hintedRows).size!==game.hintedRows.length
   ||game.hintedRows.some(row=>!Number.isInteger(row)||row<0||row>4))throw new TypeError('A completed result is required.');
 if(mode==='daily'&&(!Number.isSafeInteger(number)||number<1||!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
   ||new Date(dateKey+'T12:00:00Z').toISOString().slice(0,10)!==dateKey))throw new TypeError('Invalid daily identity.');
 const checks=game.attempts,hints=game.hintedRows.length,perfect=game.status==='won'&&checks===5&&hints===0;
 const headline=game.status==='revealed'?'Answers revealed.':perfect?'Perfect counterparts.':'Connections found.';
 const edition=mode==='daily'?`DAILY #${String(number).padStart(3,'0')}`:'PRACTICE';
 const caption=['Alford Daily · COUNTERPART',mode==='daily'?`${edition} · ${dateKey}`:edition,
   game.status==='revealed'?'Answers revealed':perfect?'Perfect · 5 of 5 relationships':'Solved · 5 of 5 relationships',
   `${checks} ${checks===1?'check':'checks'} · ${hints} ${hints===1?'hint':'hints'}`].join('\n');
 return Object.freeze({headline,edition,date:mode==='daily'?dateKey:'Your practice round',checks,hints,status:game.status,caption,filename:`alford-counterpart-${mode==='daily'?dateKey:'practice'}`});
}

/** Five identical abstract pairs, with no cue, word or per-row error history. */
export function drawShareCard(canvas,result,format='portrait'){
 canvas.width=1080;canvas.height=format==='square'?1080:1350;
 const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.');
 const h=canvas.height,square=h===1080,top=square?315:380,size=square?42:52;
 c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);c.strokeStyle='#b7d5d5';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);c.textAlign='center';
 function text(value,y,font,color='#273640'){
  c.fillStyle=color;c.font=font;let pixels=Number(/(\d+)px/.exec(font)?.[1]||30);
  while(c.measureText(value).width>920&&pixels>14){pixels--;c.font=font.replace(/\d+px/,`${pixels}px`);}c.fillText(value,540,y);
 }
 text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');text('counterpart.',202,'italic 70px "DM Serif",serif','#006b73');text(result.edition,251,'600 22px "DM Sans",sans-serif','#526279');
 for(let i=0;i<5;i++){
  const y=top+i*(size+14);c.fillStyle=result.status==='won'?'#006b73':'#718087';
  for(const x of [446-size/2,634-size/2]){c.beginPath();c.roundRect(x,y,size,size,10);c.fill();}
  c.fillStyle='#526279';c.font='30px "DM Sans",sans-serif';c.fillText('→',540,y+size/2+10);
 }
 text(result.status==='won'?'5 / 5':'Revealed',square?660:790,'64px "DM Serif",serif');
 text(result.status==='won'?'RELATIONSHIPS MATCHED':'ANSWERS SHOWN',square?702:830,'22px "DM Sans",sans-serif','#526279');
 text(result.headline,square?785:930,'54px "DM Serif",serif');
 text(`${result.checks} ${result.checks===1?'check':'checks'}  ·  ${result.hints} ${result.hints===1?'hint':'hints'}`,square?837:990,'30px "DM Sans",sans-serif');
 text(result.date,h-139,'24px "DM Sans",sans-serif','#526279');text('Different words. The same connection.',h-91,'22px "DM Sans",sans-serif','#526279');return canvas;
}

const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),'image/png'));

export function openResultShare(api) {
  const result=buildShareResult({game:api.game,mode:api.mode,number:api.daily.number,dateKey:api.daily.dateKey});
  api.openDialog(`<p class="dialog-kicker">SHARE THE CONNECTION</p><h2 class="dialog-title" id="dialog-title">A connection worth sharing.</h2>
    <div class="share-formats" role="group" aria-label="Image format"><button type="button" data-card-format="portrait" aria-pressed="true">Portrait · 4:5</button><button type="button" data-card-format="square" aria-pressed="false">Square · 1:1</button></div>
    <canvas id="result-card" role="img" aria-label="Spoiler-free Counterpart result card"></canvas>
    <p id="card-status" class="fineprint" role="status">Preparing your image…</p>
    <div class="dialog-actions share-actions"><button class="primary-button" id="share-card" type="button" disabled>Share image ↗</button><button class="secondary-button" id="download-card" type="button" disabled>Download PNG ↓</button><button class="secondary-button" id="copy-caption" type="button">Copy caption</button></div>
    <details class="share-caption"><summary>Select caption manually</summary><textarea id="card-caption" class="share-fallback" readonly aria-label="Your spoiler-free caption"></textarea></details>
    <p class="fineprint">Your result only. No words, clues or answer pairs.</p>`);
  const canvas=document.getElementById('result-card'),caption=document.getElementById('card-caption');
  const status=document.getElementById('card-status'),share=document.getElementById('share-card'),download=document.getElementById('download-card');
  caption.value=result.caption;
  canvas.setAttribute('aria-label',`Counterpart ${result.edition}, ${result.date}. ${result.headline} ${result.checks} ${result.checks===1?'check':'checks'}, ${result.hints} ${result.hints===1?'hint':'hints'}.`);
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
      await navigator.share({files:[selected],title:'Counterpart · Alford Daily',text:result.caption});
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
