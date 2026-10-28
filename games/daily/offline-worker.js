/* Generated manifest is injected only by the standalone staging script. */
const edition = /* OFFLINE_MANIFEST */ null;
const prefix = `alford-offline:${self.registration.scope}:`;
const cacheName = prefix + edition.buildId;
const assets = new Map(edition.assets.map(asset => [new URL(asset.url,self.registration.scope).href,asset.sha256]));

async function matches(response,expected) {
  if(!response?.ok||response.redirected)return false;
  const digest=await crypto.subtle.digest('SHA-256',await response.clone().arrayBuffer());
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('')===expected;
}
async function verifiedFetch(url,expected) {
  const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin',redirect:'error'}));
  if(!await matches(response,expected))throw new Error('Offline asset integrity mismatch');
  return response;
}
async function verifyCache(repair=false) {
  const cache=await caches.open(cacheName);
  for(const [url,expected] of assets) {
    if(await matches(await cache.match(url),expected))continue;
    if(!repair)return false;
    // Repair only with bytes from this edition, never whichever version is now live.
    await cache.put(url,await verifiedFetch(url,expected));
  }
  return true;
}

self.addEventListener('install',event => event.waitUntil((async()=>{
  try {
    const cache = await caches.open(cacheName);
    // Bounded sequential download keeps preparation quiet on phones and shared hosts.
    for(const [url,expected] of assets) {
      await cache.put(url,await verifiedFetch(url,expected));
    }
  } catch(error) {await caches.delete(cacheName);throw error;}
  // No skipWaiting: open games keep their current edition until all tabs close.
})()));
self.addEventListener('message',event=>{
  if(!['OFFLINE_CHECK','OFFLINE_REPAIR'].includes(event.data?.type)||!event.ports?.[0])return;
  event.waitUntil((async()=>{
    let ready=false;try{ready=await verifyCache(event.data.type==='OFFLINE_REPAIR');}catch{}
    event.ports[0].postMessage({buildId:edition.buildId,ready});
  })());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(prefix)&&key!==cacheName)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  url.search='';url.hash='';if(url.pathname.endsWith('/'))url.pathname+='index.html';
  if(!assets.has(url.href))return;
  event.respondWith((async()=>{
    const cached=await (await caches.open(cacheName)).match(url.href);
    if(cached)return cached;
    try {
      const response=await verifiedFetch(url.href,assets.get(url.href));
      await (await caches.open(cacheName)).put(url.href,response.clone());return response;
    }catch{return new Response('This offline edition is incomplete. Open the collection online to repair it or download an updated edition.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
