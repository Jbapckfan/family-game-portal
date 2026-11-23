// Static resource discovery shared by the offline tools. No game code is executed.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, posix } from 'node:path';

export const ORIGIN = 'https://offline.invalid';
export const SELF_MANAGED = ['games/reflex-riot/', 'games/particle-conquest/'];
export const selfManaged = path => SELF_MANAGED.some(folder => path.startsWith(folder));
const unusedAsset = path => /^ios\//.test(path) || path.startsWith('games/lasers-3d/assets/review/') ||
  /(?:^|\/)[^/]*-source\.png$/i.test(path);
const textFile = path => /\.(html?|css|[cm]?js|jsx)$/i.test(path);
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\\\//g, '/');

function withoutComments(source) {
  source = source.replace(/<!--[\s\S]*?-->/g, '');
  let result = '', quote = '';
  for (let i = 0; i < source.length; i++) {
    const char = source[i], next = source[i + 1];
    if (quote) {
      result += char;
      if (char === '\\') { result += next || ''; i++; }
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char; result += char;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 1;
      result += ' ';
    } else if (char === '/' && next === '/' && source[i - 1] !== ':') {
      const end = source.indexOf('\n', i + 2);
      i = end < 0 ? source.length : end;
      result += '\n';
    } else result += char;
  }
  return result;
}

const quotedValues = source => [...source.matchAll(/(['"])([^'"\r\n]+)\1/g)].map(match => match[2]);

// These three loaders combine finite, source-declared choices. Expand their actual
// tables/call sites, never a filesystem glob or arbitrary JavaScript execution.
function builtArtReferences(code, file) {
  const refs = [];
  const add = (values, prefix, suffix, detail) => {
    for (const value of values) refs.push({ url: prefix + value + suffix, kind: 'runtime', documentRelative: true, detail });
  };
  if (file === 'games/cube-jumper.html') {
    const table = code.match(/\bconst\s+RUN_ART_FILES\s*=\s*\{([^}]+)\}/);
    const loader = code.match(/\.src\s*=\s*(['"])([^'"]+)\1\s*\+\s*RUN_ART_FILES\s*\[[^\]]+\]\s*\+\s*(['"])([^'"]+)\3/);
    if (!table || !loader) throw new Error('Cube art loader changed; update its finite path expansion.');
    const values = [...table[1].matchAll(/:\s*(['"])([^'"]+)\1/g)].map(match => match[2]);
    add(values, loader[2], loader[4], 'RUN_ART_FILES values × image.src prefix/suffix');
  }
  if (file === 'games/tower-defense/index.html') {
    const table = code.match(/\bconst\s+NEXUS_TERRAIN_FILES\s*=\s*\[([^\]]+)\]/);
    const loop = code.match(/for\s*\(\s*const\s+name\s+of\s+\[\s*\.\.\.NEXUS_TERRAIN_FILES\s*,([^\]]+)\]/);
    const loader = code.match(/\.src\s*=\s*(['"])([^'"]+)\1\s*\+\s*name\s*\+\s*(['"])([^'"]+)\3/);
    if (!table || !loop || !loader) throw new Error('Nexus art loader changed; update its finite path expansion.');
    add([...quotedValues(table[1]), ...quotedValues(loop[1])], loader[2], loader[4],
      'NEXUS_TERRAIN_FILES + loop extras × image.src prefix/suffix');
  }
  if (file === 'games/shut-the-box-assets/table.js') {
    const base = code.match(/\bconst\s+asset\s*=\s*(['"])([^'"]+)\1/);
    const loader = code.match(/\[([^\]]+)\]\.forEach\(\s*name\s*=>\s*\{\s*const\s+texture\s*=\s*loader\.load\(\s*asset\s*\+\s*name\s*\+\s*(['"])([^'"]+)\2/);
    if (!base || !loader) throw new Error('Shut the Box material loader changed; update its finite path expansion.');
    add(quotedValues(loader[1]), base[2], loader[3], 'material forEach names × asset prefix + texture suffix');
  }
  return refs;
}

export function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
  }
  return result;
}

export function resourceReferences(source, file) {
  const refs = [];
  const seen = new Set();
  const add = (url, kind, options = {}) => {
    url = decode(url.trim());
    if (!url || /^(data:|blob:|#|javascript:)/i.test(url)) return;
    const ref = { url, kind, ...options };
    const key = JSON.stringify(ref);
    if (!seen.has(key)) { seen.add(key); refs.push(ref); }
  };
  const html = /\.html?$/i.test(file);
  source = source.replace(/<!--[\s\S]*?-->/g, '');
  const scripts = html ? [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]) : [];
  const markup = html ? source.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>') : '';
  const code = withoutComments(html ? scripts.join('\n') : source);
  if (/\.html?$/i.test(file)) {
    for (const match of markup.matchAll(/<(script|link|img|image|source|video|audio|iframe|embed|input|object)\b([^>]*?)>/gi)) {
      const tag = match[1].toLowerCase(), attr = attributes(match[2]);
      if (attr.src) add(attr.src, tag === 'script' ? 'script' : 'asset');
      if (tag === 'link' && attr.href && /\b(stylesheet|preload|modulepreload|icon|manifest)\b/i.test(attr.rel || '')) {
        add(attr.href, /\bstylesheet\b/i.test(attr.rel) ? 'style' : 'asset');
      }
      if (tag === 'image' && (attr.href || attr['xlink:href'])) add(attr.href || attr['xlink:href'], 'asset');
      if (tag === 'object' && attr.data) add(attr.data, 'asset');
      if (attr.poster) add(attr.poster, 'asset');
      if (attr.srcset && !attr.srcset.startsWith('data:')) {
        for (const candidate of attr.srcset.split(',')) add(candidate.trim().split(/\s+/)[0], 'asset');
      }
    }
  }
  if (/\.(html?|css)$/i.test(file)) {
    const css = withoutComments(/\.css$/i.test(file) ? source : [
      ...[...markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]),
      ...[...markup.matchAll(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map(match => decode(match[1] ?? match[2])),
    ].join('\n'));
    for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/gi)) add(match[1], 'style');
    for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
      add(match[1] ?? match[2] ?? match[3], /\.css(?:[?#]|$)/i.test(match[1] ?? match[2] ?? match[3]) ? 'style' : 'asset');
    }
  }
  if (/\.(html?|[cm]?js|jsx)$/i.test(file)) {
    for (const pattern of [
      /\bimport\s*(?:[^;()'"`]*?\bfrom\s*)?["']([^"']+)["']/g,
      /\bexport\s*[^;]*?\bfrom\s*["']([^"']+)["']/g,
      /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    ]) for (const match of code.matchAll(pattern)) add(match[1], 'module');
    for (const match of code.matchAll(/\bimportScripts\s*\(([^)]*)\)/g)) {
      for (const arg of match[1].matchAll(/["']([^"']+)["']/g)) add(arg[1], 'script');
    }
    for (const match of code.matchAll(/\bfetch\s*\(\s*(["'`])([^"'`]+)\1/g)) add(match[2], 'fetch', { documentRelative: true });
    for (const match of code.matchAll(/\b(?:import|fetch)\s*\(\s*new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url/g)) {
      add(match[1], 'module');
    }
    // These URLs are document-relative, including SVG hrefs emitted by React.
    for (const match of code.matchAll(/(?:\.src\s*=|\bsrc\s*:|\bsrc\s*=\s*\{?)\s*(["'`])([^"'`]+)\1/g)) {
      add(match[2], 'runtime', { documentRelative: true });
    }
    for (const match of code.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi)) {
      add(match[1] ?? match[2] ?? match[3], 'runtime', { documentRelative: true });
    }
    // Existing local file literals also cover TextureLoader.load(), SVG image href,
    // models, and fetches whose extension is not JSON. Existence is checked below.
    for (const match of code.matchAll(/(["'`])((?:\\[\s\S]|(?!\1)[^\\])*?)\1/g)) {
      const literal = decode(match[2]);
      if (/^(?:\.{1,2}\/|\/)?[a-z0-9][a-z0-9_./@%+ -]*\.[a-z0-9]{1,12}(?:[?#][^\s]*)?$/i.test(literal)) {
        add(literal, 'literal', { documentRelative: true });
      }
    }
    for (const ref of builtArtReferences(code, file)) add(ref.url, ref.kind, {
      documentRelative: true, detail: ref.detail,
    });
  }
  return refs;
}

export async function localPath(root, reference, from) {
  if (/\$\{|[{}<>]/.test(reference)) return null; // Only resolved finite expressions may be cached.
  let url;
  try { url = new URL(reference, `${ORIGIN}/${from}`); } catch { return null; }
  if (url.origin !== ORIGIN) return null;
  let path;
  try { path = decodeURIComponent(url.pathname).replace(/^\//, ''); } catch { return null; }
  if (path.split('/').some(segment => segment.startsWith('_'))) throw new Error(`Jekyll-hidden resource: ${path}`);
  try {
    if ((await stat(join(root, path))).isDirectory()) path = posix.join(path, 'index.html');
  } catch {
    if (url.pathname.endsWith('/')) path += 'index.html';
  }
  return path;
}

export async function portalPages(root) {
  const source = await readFile(join(root, 'index.html'), 'utf8');
  const pages = new Set(['index.html']);
  for (const match of source.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<a\b([^>]*?)>/gi)) {
    const href = attributes(match[1]).href;
    if (!href || href.startsWith('#')) continue;
    const path = await localPath(root, href, 'index.html');
    if (path && /\.html?$/i.test(path)) pages.add(path);
  }
  // The linked daily hub renders its 32 page links from this editorial catalog.
  if (pages.has('games/daily/index.html')) {
    for (const slug of await dailySlugs(root)) pages.add(`games/${slug}/index.html`);
  }
  return [...pages].sort();
}

async function dailySlugs(root) {
  const catalog = await readFile(join(root, 'games/daily/catalog.mjs'), 'utf8');
  return [...catalog.matchAll(/(?:\bslug|"slug")\s*:\s*["']([a-z0-9-]+)["']/g)].map(match => match[1]);
}

export async function walkFiles(root, directory) {
  let entries;
  try { entries = await readdir(join(root, directory), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

export async function collectFiles(root, pages, { checkExternal = false } = {}) {
  const files = new Set();
  const external = [];
  const missing = new Set();
  const runtimeBuilt = [];
  for (const page of pages) {
    const visited = new Set();
    const pending = [page];
    while (pending.length) {
      const file = pending.shift();
      if (visited.has(file) || unusedAsset(file) || (!checkExternal && selfManaged(file))) continue;
      visited.add(file);
      files.add(file);
      if (!textFile(file)) continue;
      let source;
      try { source = await readFile(join(root, file), 'utf8'); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        missing.add(file); continue;
      }
      const refs = resourceReferences(source, file);
      if (file === 'games/daily/app.mjs') {
        const icon = source.match(/new URL\(\s*['"]([^'"]+)['"]\s*,\s*url\s*\)\.href/)?.[1];
        if (!icon) throw new Error('Daily hub icon builder changed; update its catalog path expansion.');
        const document = await readFile(join(root, page), 'utf8');
        const base = attributes(document.match(/<html\b([^>]*)>/i)?.[1] || '')['data-game-base'] || './games/';
        for (const slug of await dailySlugs(root)) refs.push({
          url: `${base}${slug}/${icon}`, kind: 'runtime', documentRelative: true,
          detail: 'daily catalog slug + document data-game-base + new URL icon leaf',
        });
      }
      for (const ref of refs) {
        const from = ref.documentRelative ? page : file;
        let url;
        try { url = new URL(ref.url, `${ORIGIN}/${from}`); } catch { continue; }
        if (url.origin !== ORIGIN) {
          if (checkExternal) external.push({ page, file, kind: ref.kind, url: ref.url });
          continue;
        }
        if (ref.kind === 'module' && !/^(\.|\/)/.test(ref.url)) continue;
        const path = await localPath(root, ref.url, from);
        if (!path || path === 'sw.js' || unusedAsset(path) || (!checkExternal && selfManaged(path))) continue;
        // Runtime prefixes ('art/' + name), file suffixes and documentation strings
        // are not requests. Admit a literal only when it names an existing file.
        if (ref.kind === 'literal' || (ref.kind === 'runtime' && !ref.detail)) {
          try { if (!(await stat(join(root, path))).isFile()) continue; }
          catch (error) { if (error.code === 'ENOENT') continue; throw error; }
        }
        if (ref.detail) runtimeBuilt.push({ page, file, path, detail: ref.detail });
        pending.push(path);
      }
    }
  }
  return { files, external, missing, runtimeBuilt };
}
