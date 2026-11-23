import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../../../', import.meta.url);
const scope = 'https://example.test/family-game-portal/';
const portalSource = await readFile(new URL('sw.js', root), 'utf8');
const particleSource = await readFile(new URL('games/particle-conquest/sw.js', root), 'utf8');

function harness(source = portalSource, base = scope) {
  const listeners = new Map();
  const stores = new Map();
  const calls = [];
  const key = value => new URL(typeof value === 'string' ? value : value.url, base).href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) { store.set(key(request), response.clone()); },
        async addAll(urls) {
          for (const url of urls) {
            const response = await context.fetch(key(url));
            if (!response.ok) throw new Error('Uncacheable response');
            store.set(key(url), response.clone());
          }
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  let skipped = 0;
  let claimed = 0;
  const context = vm.createContext({
    URL, Request, Response, Headers, Promise, caches,
    fetch: async (request, options) => {
      calls.push({ url: key(request), options });
      return new Response('network version');
    },
    self: {
      location: new URL('sw.js', base),
      registration: { scope: base },
      addEventListener: (name, handler) => listeners.set(name, handler),
      skipWaiting: async () => { skipped++; },
      clients: { claim: async () => { claimed++; } },
    },
  });
  vm.runInContext(source, context);
  const name = vm.runInContext('CACHE_NAME', context);
  async function lifecycle(type) {
    const work = [];
    listeners.get(type)({ waitUntil: promise => work.push(promise) });
    await Promise.all(work);
  }
  async function request(path, overrides = {}) {
    const work = [];
    let response;
    listeners.get('fetch')({
      request: {
        url: key(path), method: 'GET', headers: new Headers(),
        mode: 'navigate', destination: 'document', ...overrides,
      },
      waitUntil: promise => work.push(promise),
      respondWith: promise => { response = Promise.resolve(promise); },
    });
    const result = response ? await response : undefined;
    await Promise.all(work);
    return result;
  }
  return {
    context, caches, name, calls, stores, request, lifecycle,
    get skipped() { return skipped; }, get claimed() { return claimed; },
    async seed(path, body = 'saved version', cacheName = name) {
      await (await caches.open(cacheName)).put(key(path), new Response(body));
    },
    async cached(path) { return (await (await caches.open(name)).match(key(path)))?.text(); },
  };
}

test('online pages and code use the fresh network copy and update their own cache', async () => {
  const h = harness();
  for (const [path, destination] of [['index.html', 'document'], ['game.js', 'script'], ['game.css', 'style'], ['levels.json', '']]) {
    await h.seed(path);
    const response = await h.request(path, { destination });
    assert.equal(await response.text(), 'network version');
    assert.equal(await h.cached(path), 'network version');
  }
  assert(h.calls.every(call => call.options?.cache === 'no-cache'));
});

test('network rejection returns the saved page, including directory and query aliases', async () => {
  const h = harness();
  await h.seed('games/example/index.html');
  h.context.fetch = async () => { throw new TypeError('offline'); };
  for (const path of ['games/example/index.html', 'games/example/', 'games/example/?mode=daily', 'games/example']) {
    assert.equal(await (await h.request(path)).text(), 'saved version');
  }
});

test('offline uncached navigation gets a self-contained fallback with a scope-correct portal link', async () => {
  const h = harness();
  h.context.fetch = async () => { throw new TypeError('offline'); };
  const response = await h.request('games/not-saved.html');
  assert.equal(response.status, 503);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  const html = await response.text();
  assert.match(html, /This game has not been saved for offline play yet/);
  assert(html.includes(`href="${scope}"`));
  assert.doesNotMatch(html, /<script|<link|<img/);
  assert.equal((await h.request('missing.js', { mode: 'cors', destination: 'script' })).type, 'error');
});

test('HTTP failures stay HTTP failures and do not replace the last successful copy', async () => {
  const h = harness();
  await h.seed('index.html');
  h.context.fetch = async () => new Response('not found', { status: 404 });
  assert.equal((await h.request('index.html')).status, 404);
  assert.equal(await h.cached('index.html'), 'saved version');
});

test('cache write failure never breaks a successful online response', async () => {
  const h = harness();
  h.caches.open = async () => { throw new Error('quota'); };
  assert.equal(await (await h.request('index.html')).text(), 'network version');
});

test('Range, foreign origin, non-GET, other project and self-managed-folder requests pass through', async () => {
  const h = harness();
  for (const [url, overrides] of [
    ['games/test.html', { headers: new Headers({ Range: 'bytes=0-10' }) }],
    ['https://foreign.test/game.js', {}],
    ['index.html', { method: 'POST' }],
    ['https://example.test/another-project/index.html', {}],
    ['games/reflex-riot/', {}], ['games/reflex-riot/game.js', {}],
    ['games/particle-conquest/index.html', {}], ['games/particle-conquest/sw.js', {}],
  ]) assert.equal(await h.request(url, overrides), undefined, url);
  assert.equal(h.calls.length, 0);
});

test('fixed fonts and vendor copies are cache-first', async () => {
  const h = harness();
  for (const path of ['games/fonts/files/outfit-latin.woff2', 'games/vendor/react-18.3.1/react.production.min.js']) {
    await h.seed(path);
    assert.equal(await (await h.request(path, { mode: 'cors', destination: 'font' })).text(), 'saved version');
  }
  assert.equal(h.calls.length, 0);
});

test('cached image is returned while its fresh copy is saved in the background', async () => {
  const h = harness();
  await h.seed('games/art.webp');
  assert.equal(await (await h.request('games/art.webp', { mode: 'cors', destination: 'image' })).text(), 'saved version');
  assert.equal(await h.cached('games/art.webp'), 'network version');
  h.context.fetch = async () => { throw new TypeError('offline'); };
  assert.equal(await (await h.request('games/art.webp', { mode: 'cors', destination: 'image' })).text(), 'network version');
});

test('uncached image is fetched, saved and available offline', async () => {
  const h = harness();
  assert.equal(await (await h.request('games/art.webp', { mode: 'cors', destination: 'image' })).text(), 'network version');
  assert.equal(await h.cached('games/art.webp'), 'network version');
});

test('install tolerates a missing optional resource, but requires the core shell', async () => {
  const h = harness();
  const files = vm.runInContext('PRECACHE_FILES', h.context);
  const missing = files.find(path => path !== 'index.html' && path !== 'manifest.json');
  assert(missing, 'generated list includes optional files');
  h.context.fetch = async request => new Response('asset', { status: String(request.url || request).endsWith(missing) ? 404 : 200 });
  await h.lifecycle('install');
  assert.equal(await h.cached('index.html'), 'asset');
  assert.equal(await h.cached('manifest.json'), 'asset');
  assert.equal(await h.cached(missing), undefined);
  assert.equal(h.skipped, 1);
  const failed = harness();
  failed.context.fetch = async () => new Response('missing', { status: 404 });
  await assert.rejects(failed.lifecycle('install'));
  assert.equal(failed.skipped, 0);
});

test('activation only deletes older caches belonging to this portal', async () => {
  const h = harness();
  for (const name of [h.name, 'family-game-portal-old', 'reflex-riot-v7', 'particle-conquest-v7', 'other-pages-site']) await h.caches.open(name);
  await h.lifecycle('activate');
  assert.deepEqual(await h.caches.keys(), [h.name, 'reflex-riot-v7', 'particle-conquest-v7', 'other-pages-site']);
  assert.equal(h.claimed, 1);
});

test('Particle activation only removes its own old caches and has a new cache version', async () => {
  const h = harness(particleSource, `${scope}games/particle-conquest/`);
  assert.notEqual(h.name, 'particle-conquest-v6-rendered-worlds-20261122');
  for (const name of [h.name, 'particle-conquest-old', 'family-game-portal-current', 'reflex-riot-v7', 'other-pages-site']) await h.caches.open(name);
  await h.lifecycle('activate');
  assert.deepEqual(await h.caches.keys(), [h.name, 'family-game-portal-current', 'reflex-riot-v7', 'other-pages-site']);
});

test('portal registration skips insecure contexts and silently ignores failure', async () => {
  const index = await readFile(new URL('index.html', root), 'utf8');
  const script = index.match(/<script>\s*\/\/ Offline registration[\s\S]*?<\/script>/)?.[0].replace(/<\/?script>/g, '');
  assert(script, 'portal has an isolated silent registration block');
  let called = 0;
  const navigator = { serviceWorker: { register: async (url, options) => {
    called++;
    assert.equal(url, './sw.js');
    assert.equal(options.scope, './');
    assert.equal(options.updateViaCache, 'none');
    throw new Error('registration unavailable');
  } } };
  vm.runInNewContext(script, { navigator, isSecureContext: false });
  assert.equal(called, 0);
  vm.runInNewContext(script, { navigator: {}, isSecureContext: true });
  vm.runInNewContext(script, { navigator, isSecureContext: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(called, 1);
  vm.runInNewContext(script, {
    navigator: { serviceWorker: { register() { throw new Error('blocked synchronously'); } } },
    isSecureContext: true,
  });
});
