import {mountSuggestionBox} from './common.mjs';
/** Collection preferences only. Game saves and daily assignments are never touched. */
export const PREFERENCE_PREFIX = 'alford:game-pref:v1:';
export const PREFERENCE_EVENT = 'alford:game-preferences';
export const GAME_SLUGS = Object.freeze(['counterpart','shortlist','second-sense','sideways','ringcount','switchpath','tradeoff','inbetween','kimi-cairn','kimi-morph','kimi-tangle','kimi-hunch','kimi-circuit','kimi-quartet','deepseek-twin-hive','deepseek-spare','deepseek-rung','deepseek-cipher','deepseek-trail','deepseek-split','qwen-quadra','qwen-logic-lattice','qwen-syntax-siege','qwen-memory-maze','qwen-pattern-prism','qwen-territory-tactics','claude-dovetail','claude-splice','claude-sprout','claude-tangle','claude-keystone','claude-tumbler','nested-tic-tac-toe']);
const defaults = () => ({favorite:false,hidden:false});
const valid = value => value && typeof value==='object' && !Array.isArray(value) && typeof value.favorite==='boolean' && typeof value.hidden==='boolean';
export function readPreferences(slug,win=window) {
  if (!GAME_SLUGS.includes(slug)) return {...defaults(),error:'Unknown game.'};
  try {
    const raw=win.localStorage.getItem(PREFERENCE_PREFIX+slug);
    if(raw===null)return {...defaults(),error:''};
    const value=JSON.parse(raw);
    if(!valid(value))throw new Error('invalid');
    return {favorite:value.favorite,hidden:value.hidden,error:''};
  } catch {return {...defaults(),error:'Game preferences could not be read on this device.'};}
}
export function togglePreference(slug,field,win=window) {
  const current=readPreferences(slug,win);
  if(current.error || !['favorite','hidden'].includes(field))return {...current,error:current.error||'Unknown preference.'};
  const next={favorite:current.favorite,hidden:current.hidden,[field]:!current[field]};
  try {
    const encoded=JSON.stringify(next);
    win.localStorage.setItem(PREFERENCE_PREFIX+slug,encoded);
    if(win.localStorage.getItem(PREFERENCE_PREFIX+slug)!==encoded)throw new Error('unverified');
    win.dispatchEvent(new win.CustomEvent(PREFERENCE_EVENT,{detail:{slug}}));
    try {win.webkit?.messageHandlers?.alford?.postMessage({type:'gamePreference',slug,...next});} catch {}
    return {...next,error:''};
  } catch {return {...current,error:'Could not save this change. Please try again; browser storage may be unavailable or full.'};}
}

export function mountPreferenceButtons(container,slug,name=slug,win=window) {
  if(container.dataset.preferencesReady==='true')return;
  container.dataset.preferencesReady='true';
  const doc=container.ownerDocument;
  container.classList.add('alford-preference-controls');
  const favorite=doc.createElement('button'), hidden=doc.createElement('button'), message=doc.createElement('p');
  for(const [button,field] of [[favorite,'favorite'],[hidden,'hidden']]){
    button.type='button';button.dataset.preference=field;
    button.addEventListener('click',()=>{
      const result=togglePreference(slug,field,win);
      update();
      message.textContent=result.error || (field==='favorite' ? result.favorite?'Added to favorites.':'Removed from favorites.' : result.hidden?'Hidden from the collection. Use Show hidden to restore it.':'Shown in the collection.');
    });
    container.append(button);
  }
  message.className='alford-preference-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');container.append(message);
  function update(){
    const value=readPreferences(slug,win);
    favorite.textContent=value.favorite?'★ Favorited':'☆ Favorite';
    favorite.setAttribute('aria-pressed',String(value.favorite));favorite.setAttribute('aria-label',`${value.favorite?'Remove':'Add'} ${name} ${value.favorite?'from':'to'} favorites`);
    hidden.textContent=value.hidden?'Unhide':'Hide';hidden.setAttribute('aria-pressed',String(value.hidden));hidden.setAttribute('aria-label',`${value.hidden?'Unhide':'Hide'} ${name}`);
    message.textContent=value.error;
  }
  win.addEventListener(PREFERENCE_EVENT,event=>{if(event.detail?.slug===slug)update();});
  win.addEventListener('storage',event=>{if(event.key===null||event.key===PREFERENCE_PREFIX+slug)update();});
  win.addEventListener('pageshow',update);
  update();
}

export function receiveNativePreference(detail,win=window) {
  if(!detail || !GAME_SLUGS.includes(detail.slug) || !valid(detail))return false;
  try {
    const value=JSON.stringify({favorite:detail.favorite,hidden:detail.hidden});
    win.localStorage.setItem(PREFERENCE_PREFIX+detail.slug,value);
    if(win.localStorage.getItem(PREFERENCE_PREFIX+detail.slug)!==value)return false;
    win.dispatchEvent(new win.CustomEvent(PREFERENCE_EVENT,{detail:{slug:detail.slug}}));
    return true;
  } catch {return false;}
}
function installToolbar(doc=document,win=window) {
  const pathSlug=win.location.pathname.split('/').filter(Boolean).filter(part=>part!=='index.html').at(-1);
  const slug=doc.documentElement.dataset.gameId||doc.body?.dataset.gameId||pathSlug;
  if(!GAME_SLUGS.includes(slug)||doc.getElementById('alford-player-tools'))return;
  const style=doc.createElement('style');style.textContent=`
    #alford-player-tools{box-sizing:border-box;position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;width:100%;margin:0;padding:8px max(16px,env(safe-area-inset-left));background:#102232;color:#edf6ff;border-bottom:1px solid #355168;font:12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;flex-shrink:0}
    #alford-player-tools .alford-tools-label{font-size:11px;font-weight:650;letter-spacing:.4px;margin:0;color:#b7cee1}
    #alford-player-tools .alford-preference-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0}
    #alford-player-tools button{box-sizing:border-box;position:static;display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:72px;margin:0;padding:8px 13px;border:1px solid #56718a;border-radius:8px;background:#1c354a;color:#edf6ff;font:600 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;touch-action:manipulation;text-transform:none;letter-spacing:normal;box-shadow:none;opacity:1;transform:none}
    #alford-player-tools button[aria-pressed=true]{border-color:#7bbcff;background:#244c6c;color:#fff}
    #alford-player-tools button:focus-visible{outline:3px solid #88c8ff;outline-offset:2px}
    #alford-player-tools .alford-preference-message{flex-basis:100%;margin:0;max-width:540px;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#d1e5f6}
    #alford-player-tools .alford-preference-message:empty{display:none}
    @media(max-width:400px){#alford-player-tools{padding:6px 12px;gap:3px 10px}#alford-player-tools .alford-tools-label{font-size:10px}#alford-player-tools button{padding:8px 10px}}
  `;
  doc.head.append(style);
  const aside=doc.createElement('aside');aside.id='alford-player-tools';aside.setAttribute('aria-label','Game collection preferences');
  const label=doc.createElement('span');label.className='alford-tools-label';label.textContent='Your collection';
  const controls=doc.createElement('div');aside.append(label,controls);doc.body.prepend(aside);
  const name=doc.title.split(/[·—|]/)[0].trim()||slug;
  mountPreferenceButtons(controls,slug,name,win);
  const standalone=['deepseek-trail','deepseek-split','deepseek-spare'].includes(slug)&&win.location.hash!=='#daily';
  if(!/^(deepseek-|qwen-|claude-)/.test(slug)||standalone){
    mountSuggestionBox({doc,win,gameId:slug,gameName:name,anchor:doc.getElementById('root')||doc.getElementById('app')||doc.querySelector('.page')||doc.querySelector('main'),snapshot:()=>({mode:'general',date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())})});
  }
  const attachFeedback=()=>{const input=doc.getElementById('suggestion-text');if(!input||aside.querySelector('[data-feedback-shortcut]'))return;const link=doc.createElement('a');link.href='#suggestion-text';link.dataset.feedbackShortcut='true';link.textContent='Feedback';link.style.cssText='display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid #56718a;border-radius:8px;color:#edf6ff;text-decoration:none;font:600 12px system-ui';link.onclick=()=>input.focus();controls.append(link);};
  win.addEventListener('alford:feedback-ready',attachFeedback);attachFeedback();
}
if(typeof document!=='undefined'&&typeof window!=='undefined'){
  receiveNativePreference(window.__ALFORD_NATIVE__?.gamePreference);
  window.addEventListener('alford:game-preference-change',event=>receiveNativePreference(event.detail));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>installToolbar(),{once:true});
  else installToolbar();
}
