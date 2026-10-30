/** Frozen played identity and aggregate scores only. */
export function buildShareResult({game,mode,number,dateKey}){
 if(!['won','revealed'].includes(game?.status)||!['daily','practice'].includes(mode)
  ||!['attempts','hints'].every(k=>Number.isSafeInteger(game[k])&&game[k]>=0)||(game.status==='won'&&game.attempts<6))throw new TypeError('A completed valid result is required.');
 if(mode==='daily'&&(!Number.isSafeInteger(number)||number<1||!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)||new Date(dateKey+'T12:00:00Z').toISOString().slice(0,10)!==dateKey))throw new TypeError('Invalid daily identity.');
 const {attempts,hints,status}=game,perfect=status==='won'&&attempts===6&&!hints;
 const headline=status==='revealed'?'Board revealed.':perfect?'A perfect fit.':'Right where they belong.';
 const edition=mode==='daily'?`DAILY #${String(number).padStart(3,'0')}`:'PRACTICE';
 const caption=['Alford Daily · INBETWEEN',mode==='daily'?`${edition} · ${dateKey}`:edition,status==='revealed'?'Answers revealed':perfect?'Perfect · 6 words solved':'Solved · 6 words',`${attempts} ${attempts===1?'attempt':'attempts'} · ${hints} ${hints===1?'nudge':'nudges'}`].join('\n');
 return Object.freeze({headline,edition,date:mode==='daily'?dateKey:'Your practice round',attempts,hints,status,caption,filename:`alford-inbetween-${mode==='daily'?dateKey:'practice'}`});
}

/** Abstract columns with no letters, cues, arrangement or feedback history. */
export function drawShareCard(canvas,result,format='portrait'){
 canvas.width=1080;canvas.height=format==='square'?1080:1350;
 const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.');
 const h=canvas.height,square=h===1080,top=square?315:380,size=square?42:52;
 c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);c.strokeStyle='#b7d5d5';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);c.textAlign='center';
 function text(value,y,font,color='#273640'){
  c.fillStyle=color;c.font=font;let pixels=Number(/(\d+)px/.exec(font)?.[1]||30);
  while(c.measureText(value).width>920&&pixels>14){pixels--;c.font=font.replace(/\d+px/,`${pixels}px`);}c.fillText(value,540,y);
 }
 text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');text('inbetween.',202,'italic 70px "DM Serif Display",serif','#006b73');text(result.edition,251,'600 22px "DM Sans",sans-serif','#526279');
 // Six identical markers never encode the board or per-swap events.
 for(let i=0;i<6;i++){c.fillStyle=result.status==='won'?'#006b73':'#718087';c.beginPath();c.roundRect(360+(i%3)*140,top+Math.floor(i/3)*140,80,80,14);c.fill();}
 text(result.status==='won'?'6 / 6':'Revealed',square?660:790,'64px "DM Serif Display",serif');
 text(result.status==='won'?'WORDS SOLVED':'ANSWERS SHOWN',square?702:830,'22px "DM Sans",sans-serif','#526279');
 text(result.headline,square?785:930,'54px "DM Serif Display",serif');
 text(`${result.attempts} ${result.attempts===1?'attempt':'attempts'}  ·  ${result.hints} ${result.hints===1?'nudge':'nudges'}`,square?837:990,'30px "DM Sans",sans-serif');
 text(result.date,h-139,'24px "DM Sans",sans-serif','#526279');text('Six words. Find where they fit.',h-91,'22px "DM Sans",sans-serif','#526279');return canvas;
}

const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed.')),'image/png'));

export function openResultShare(api) {
  const result=buildShareResult({game:api.game,mode:api.mode,number:api.daily.number,dateKey:api.daily.dateKey});
  api.openDialog(`<p class="dialog-kicker">SHARE YOUR FIT</p><h2 class="dialog-title" id="dialog-title">A good fit.</h2>
    <div class="share-formats" role="group" aria-label="Image format"><button type="button" data-card-format="portrait" aria-pressed="true">Portrait · 4:5</button><button type="button" data-card-format="square" aria-pressed="false">Square · 1:1</button></div>
    <canvas id="result-card" role="img" aria-label="Spoiler-free Inbetween result card"></canvas>
    <p id="card-status" class="fineprint" role="status">Preparing your image…</p>
    <div class="dialog-actions share-actions"><button class="primary-button" id="share-card" type="button" disabled>Share image ↗</button><button class="secondary-button" id="download-card" type="button" disabled>Download PNG ↓</button><button class="secondary-button" id="copy-caption" type="button">Copy caption</button></div>
    <details class="share-caption"><summary>Select caption manually</summary><textarea id="card-caption" class="share-fallback" readonly aria-label="Your spoiler-free caption"></textarea></details>
    <p class="fineprint">Your result only. No letters, clues, placement history or answers.</p>`);
  const canvas=document.getElementById('result-card'),caption=document.getElementById('card-caption');
  const status=document.getElementById('card-status'),share=document.getElementById('share-card'),download=document.getElementById('download-card');
  caption.value=result.caption;
  canvas.setAttribute('aria-label',`Inbetween ${result.edition}, ${result.date}. ${result.headline} ${result.attempts} attempts, ${result.hints} nudges.`);
  let file=null,generation=0,sharing=false;
  async function prepare(format) {
    const own=++generation;file=null;share.disabled=true;download.disabled=true;status.textContent='Preparing your image…';
    document.querySelectorAll('[data-card-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cardFormat===format)));
    try {
      await Promise.all(['400 60px "DM Serif Display"','italic 70px "DM Serif Display"','400 30px "DM Sans"','600 26px "DM Sans"'].map(font=>document.fonts.load(font)));
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
      await navigator.share({files:[selected],title:'Inbetween · Alford Daily',text:result.caption});
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
