// Minimal static server for local testing: node tools/serve.mjs [port] [root]
// Serves the portal repo root so /games/lasers-3d/ resolves exactly as on the live site.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] || 8765);
const root = resolve(process.argv[3] || new URL('../../..', import.meta.url).pathname);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

createServer(async (req, res) => {
  try {
    let route = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, route));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) { file = join(file, 'index.html'); info = await stat(file).catch(() => null); }
    if (!info) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}/`));
