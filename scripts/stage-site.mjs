// Publish only the verified Alford Daily runtime, never the surrounding family portal.
import {mkdir, readFile, readdir, lstat, realpath, writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute output directory.');
const output = path.resolve(destination);
function within(base,target) {
  const relative=path.relative(base,target);
  return relative==='' || (!path.isAbsolute(relative) && relative!=='..' && !relative.startsWith(`..${path.sep}`));
}
if (within(output,root)) throw new Error('Output cannot contain source or be a filesystem root.');
if (within(root,output) && path.relative(root,output).split(path.sep)[0]!=='dist') throw new Error('Within the source repository, output is allowed only in a fresh dist directory.');
// Reject destination symlinks before writing any generated files.
let parent = output;
while (parent !== path.dirname(parent)) {
  try { if ((await lstat(parent)).isSymbolicLink()) throw new Error(`Output path uses a symbolic link: ${parent}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  parent = path.dirname(parent);
}

// Reuse the strict runtime allowlists, file sets and symlink checks maintained
// for the native bundle, rather than trusting a manually populated ios/Web tree.
try { await promisify(execFile)(process.execPath,[path.join(root,'scripts/sync-ios-web.mjs'),'--check']); }
catch (error) { throw new Error(`Runtime bundle is stale or invalid. ${error.stderr || error.message}`); }

const inventory = JSON.parse(await readFile(path.join(root,'docs/puzzle-inventory.json'),'utf8'));
if (inventory.games?.length !== 32 || new Set(inventory.games.map(game=>game.slug)).size !== 32 || inventory.games.some(game=>game.puzzles<200)) {
  throw new Error('Expected 32 games with at least 200 prepared puzzles each.');
}
const allowed = new Set([...inventory.games.map(game=>game.slug),'nested-tic-tac-toe','kimi-runtime','deepseek-runtime']);
const bundle = path.join(root,'ios/Web/games');
const entries = await readdir(bundle,{withFileTypes:true});
if (entries.length !== allowed.size || entries.some(entry=>!entry.isDirectory() || !allowed.has(entry.name))) throw new Error('Unexpected offline bundle directories; run sync-ios-web.mjs first.');
const files = new Map();
async function walk(directory, prefix='') {
  const stat=await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Not a regular runtime directory: ${directory}`);
  const result = [];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.')) throw new Error(`Unexpected runtime entry: ${entry.name}`);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await walk(path.join(directory,entry.name),relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unsupported runtime entry: ${relative}`);
  }
  return result.sort();
}
for (const name of await walk(bundle)) {
  const canonical = path.join(root,'games',name);
  const stat = await lstat(canonical);
  if (!stat.isFile() || stat.isSymbolicLink() || !(await realpath(canonical)).startsWith(await realpath(root)+path.sep)) throw new Error(`Not a canonical runtime file: ${name}`);
  const bytes = await readFile(canonical);
  if (!bytes.equals(await readFile(path.join(bundle,name)))) throw new Error(`Offline bundle is stale: ${name}. Run node scripts/sync-ios-web.mjs first.`);
  files.set(`games/${name}`,bytes);
}
const daily = path.join(root,'games/daily');
if ((await lstat(daily)).isSymbolicLink()) throw new Error('The collection directory cannot be a symbolic link.');
const dailyFiles = ['index.html','app.mjs','catalog.mjs','playtest.mjs','styles.css','identities.css','icon.svg','manifest.webmanifest',...(await walk(path.join(daily,'fonts'))).map(name=>`fonts/${name}`)];
for (const name of dailyFiles) {
  const source=path.join(daily,name),stat=await lstat(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular collection runtime file: ${name}`);
  const bytes = await readFile(source);
  files.set(`games/daily/${name}`,bytes);
  files.set(name, name==='index.html' ? Buffer.from(bytes.toString().replace('data-game-base="../"','data-game-base="./games/"')) : name==='playtest.mjs'?Buffer.from(bytes.toString().replace('../deepseek-runtime/feedback-client.mjs','./games/deepseek-runtime/feedback-client.mjs')):bytes);
}
files.set('release.json',Buffer.from(JSON.stringify(inventory,null,2)+'\n'));
files.set('404.html',Buffer.from('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Alford Daily</title><h1>Page not found</h1><p>This address does not contain a game. Open the collection link your host shared.</p></html>\n'));
// Content identity is independent of Git paths, source secrets and the output directory.
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const assets=[...files].map(([url,bytes])=>({url,sha256:hash(bytes)})).sort((a,b)=>a.url.localeCompare(b.url));
const workerSource=await readFile(path.join(daily,'offline-worker.js'),'utf8');
const buildId=hash(JSON.stringify(assets)+workerSource).slice(0,16);
const manifest={buildId,bytes:[...files.values()].reduce((sum,bytes)=>sum+bytes.length,0),assets};
const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
files.set('playtest-build.json',manifestBytes);
files.set('offline-worker.js',Buffer.from(workerSource.replace('/* OFFLINE_MANIFEST */ null',JSON.stringify({...manifest,assets:[...assets,{url:'playtest-build.json',sha256:hash(manifestBytes)}]}))));
// A fresh directory prevents leftover private files and nested output symlinks.
// Callers can stage into a new versioned sibling and promote it after verification.
try {
  if ((await readdir(output)).length) throw new Error('Output must be empty. Stage into a new directory, then promote that verified build.');
} catch (error) { if (error.code!=='ENOENT') throw error; }
await mkdir(output,{recursive:true});
for (const [name,bytes] of files) {
  const target = path.join(output,name);
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,bytes,{flag:'wx'});
}
console.log(`Staged only Alford Daily: 32 daily games + 1 local-AI bonus, ${inventory.totalPuzzles.toLocaleString('en-US')} puzzles, ${files.size} runtime files in ${output}`);
