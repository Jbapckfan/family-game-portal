// Optional on-device playtest tools. Game progress remains owned by each engine.
import {GAMES} from './catalog.mjs';
const statuses={new:'Not started',playing:'In progress',won:'Solved',lost:'Not solved',revealed:'Revealed'};
const feelings={again:'Play again',confusing:'Confusing',favorite:'A favorite',problem:'Something broke'};
export function buildPlaytestNote({slug,date,build='local source',feeling,status,note=''}) {
  const game=GAMES.find(game=>game.slug===slug);
  if(!game)throw new RangeError('Choose an available game.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(`${date}T12:00:00Z`))||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date)throw new RangeError('Choose a valid date.');
  return ['Alford Daily · private playtest',`${game.name} · ${game.creator}`,`Daily date: ${date} (Central)`,`Build: ${String(build).replace(/[^a-zA-Z0-9 ._-]/g,'').slice(0,40)}`,`Daily result: ${statuses[status]||'Unavailable'}`,`My reaction: ${feelings[feeling]||'Not selected'}`,'',String(note).trim().slice(0,600),'','Device/browser: [add yours]','Daily or Practice: [choose]'].join('\n');
}
export function startPlaytest(doc,win,snapshot) {
  const $=id=>doc.getElementById(id);
  for(const game of GAMES){const option=doc.createElement('option');option.value=game.slug;option.textContent=`${game.name} · ${game.creator}`;$('playtest-game').append(option);}
  let build='local source';
  $('playtest-form').addEventListener('submit',event=>{
    event.preventDefault();const current=snapshot(),slug=$('playtest-game').value;
    $('playtest-text').value=buildPlaytestNote({slug,date:current.date,build,feeling:$('playtest-feeling').value,status:current.results.find(result=>result.slug===slug)?.status,note:$('playtest-note').value});
    $('playtest-report').hidden=false;$('playtest-status').textContent='Review your note, then copy it to your conversation with James. Nothing has been sent.';$('playtest-text').focus();
  });
  $('copy-playtest').addEventListener('click',async()=>{
    try{if(!win.navigator.clipboard?.writeText)throw new Error('No clipboard');await win.navigator.clipboard.writeText($('playtest-text').value);$('playtest-status').textContent='Note copied. Send it to James when you are ready.';}
    catch{$('playtest-text').focus();$('playtest-text').select();$('playtest-status').textContent='Select and copy the note below. Nothing has been sent.';}
  });
  const root=new URL('../',new URL(doc.documentElement.dataset.gameBase||'./games/',doc.baseURI));
  const button=$('save-offline'),status=$('offline-status');
  if(!win.isSecureContext||!win.navigator.serviceWorker||!win.fetch){status.textContent='Offline download needs the standalone build in a supported browser over HTTPS (or localhost).';return;}
  const workerURL=new URL('offline-worker.js',root).href;
  const isOurs=registration=>registration?.scope===root.href&&[registration.active,registration.waiting,registration.installing].filter(Boolean).every(worker=>worker.scriptURL===workerURL);
  function askWorker(worker,type) {
    return new Promise((resolve,reject)=>{
      const channel=new win.MessageChannel();
      const finish=(error,data)=>{win.clearTimeout(timer);channel.port1.close();channel.port2.close();error?reject(error):resolve(data);};
      const timer=win.setTimeout(()=>finish(new Error('Offline check timed out')),15000);
      channel.port1.onmessage=event=>finish(null,event.data);
      try{worker.postMessage({type},[channel.port2]);}catch(error){finish(error);}
    });
  }
  win.fetch(new URL('playtest-build.json',root),{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('Not standalone');return response.json();}).then(async manifest=>{
    build=manifest.buildId;$('playtest-build').textContent=`Test edition ${build}`;
    status.textContent=`Save all 32 games for offline play (about ${Math.ceil(manifest.bytes/1_000_000)} MB). Progress stays in this browser.`;button.disabled=false;
    const registration=await win.navigator.serviceWorker.getRegistration(root.href);
    if(registration&&!isOurs(registration)){button.disabled=true;status.textContent='Another application controls offline use at this address. Use a dedicated Alford Daily address for downloads.';return;}
    if(registration?.active){
      const health=await askWorker(registration.active,'OFFLINE_CHECK');
      status.textContent=health.ready?'An offline edition is verified in this browser. Your browser may clear downloads to free space.':'Your offline copy is incomplete. Stay online and save the games again to repair it.';
      button.textContent=health.ready?'Check for an offline update':'Save games for offline play';
    }
  }).catch(()=>{status.textContent='Offline download is available in the standalone test build. Online games still work.';});
  button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent='Saving the collection… Keep this page open until it is ready.';let timer;
    try{
      let registration=await win.navigator.serviceWorker.getRegistration(root.href),verifiedCurrent=false;
      if(registration&&!isOurs(registration))throw new Error('Another application owns this scope');
      if(registration?.active)try{verifiedCurrent=(await askWorker(registration.active,'OFFLINE_REPAIR')).ready;}catch{}
      try{registration=await win.navigator.serviceWorker.register(workerURL,{scope:root.href,updateViaCache:'none'});}
      catch(error){if(!verifiedCurrent)throw error;status.textContent='Ready offline: the saved edition is verified. The check for a newer edition could not finish.';return;}
      // register() also checks for an updated script; an extra update() can race installation.
      const worker=registration.installing||registration.waiting;
      if(worker)await new Promise((resolve,reject)=>{
        const check=()=>{if(worker.state==='activated'||(worker.state==='installed'&&registration.active))resolve();else if(worker.state==='redundant')reject(new Error('Download interrupted'));};
        worker.addEventListener('statechange',check);check();timer=win.setTimeout(()=>reject(new Error('Download timed out')),60000);
      });
      if(registration.waiting)status.textContent='An updated edition is downloaded. Close all Alford Daily tabs, then reopen this address to use it. Your saves stay here.';
      else if(registration.active&&isOurs(registration)&&(await askWorker(registration.active,'OFFLINE_CHECK')).ready){status.textContent='Ready offline: all 32 games are saved. Reopen this same address in this browser. Your browser may clear downloads to free space.';button.textContent='Check for an offline update';}
      else throw new Error('No active edition');
    }catch{status.textContent='The download did not finish. Stay online and try again. Your saved progress is unchanged.';}
    finally{win.clearTimeout(timer);button.disabled=false;}
  });
}
