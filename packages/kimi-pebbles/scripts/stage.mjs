/** Build once, publish six canonical documents sharing one offline asset bundle. */
import { mkdir, readFile, readdir, cp, rm, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const games = resolve(root, '../../games');
const names = { cairn:'Cairn', morph:'Morph', tangle:'Tangle', hunch:'Hunch', circuit:'Circuit', quartet:'Quartet' };
const assets = join(root, 'dist/assets');
const html = await readFile(join(root, 'dist/index.html'), 'utf8');
const noticeNames = ['Baloo2-LICENSE.txt', 'Nunito-LICENSE.txt'];
const notices = await Promise.all(noticeNames.map(name => readFile(join(root, 'public/fonts', name), 'utf8')));
if (notices.some(text => !text.includes('SIL OPEN FONT LICENSE'))) throw new Error('Missing complete font license notices');
if (!html.includes('__GAME_ID__') || !html.includes('__GAME_NAME__')) throw new Error('Missing canonical game placeholders');
const files = await readdir(assets);
if (!files.some(n => n.endsWith('.js')) || !files.some(n => n.endsWith('.css'))) throw new Error('Missing compiled application assets');
for (const file of files) {
  const info = await lstat(join(assets, file));
  if (!info.isFile() || info.isSymbolicLink() || !/\.(js|css|woff2?|ttf|svg|png|txt)$/.test(file)) throw new Error(`Unexpected asset ${file}`);
}
const runtime = join(games, 'kimi-runtime');
await mkdir(runtime, {recursive:true});
await rm(join(runtime, 'assets'), {recursive:true,force:true});
await cp(assets, join(runtime, 'assets'), {recursive:true});
await mkdir(join(runtime, 'fonts'), {recursive:true});
for (let i = 0; i < noticeNames.length; i++) await writeFileSafe(join(runtime, 'fonts', noticeNames[i]), notices[i]);
for (const [id, name] of Object.entries(names)) {
  const directory = join(games, `kimi-${id}`);
  await mkdir(directory, {recursive:true});
  const output = html.replaceAll('__GAME_ID__', `kimi-${id}`).replaceAll('__GAME_NAME__', name).replaceAll('./assets/', '../kimi-runtime/assets/');
  await writeFileSafe(join(directory, 'index.html'), output);
}
async function writeFileSafe(path, content) { const {writeFile} = await import('node:fs/promises'); await writeFile(path, content); }
console.log(`Staged ${Object.keys(names).length} Kimi games with ${files.length} shared offline assets.`);
