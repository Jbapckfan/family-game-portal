/** Build once, publish six canonical documents sharing one offline asset bundle. */
import { mkdir, readFile, readdir, cp, rename, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { assertTangleSourceHash } from '../../../scripts/tangle-lexicon.mjs';
import {modernWordSourceNotice} from '../../../scripts/word-source-notice.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const games = resolve(root, '../../games');
const names = { cairn:'Cairn', morph:'Morph', tangle:'Tangle', hunch:'Hunch', circuit:'Circuit', quartet:'Quartet' };
const build = process.env.KIMI_BUILD_DIR ? resolve(process.env.KIMI_BUILD_DIR) : join(root, 'dist');
const assets = join(build, 'assets');
const html = await readFile(join(build, 'index.html'), 'utf8');
const noticeNames = ['Baloo2-LICENSE.txt', 'Nunito-LICENSE.txt', 'DM-Sans-LICENSE.txt', 'DM-Serif-Display-LICENSE.txt'];
const notices = await Promise.all(noticeNames.map(name => readFile(join(root, 'public/fonts', name), 'utf8')));
if (notices.some(text => !text.includes('SIL OPEN FONT LICENSE'))) throw new Error('Missing complete font license notices');
const wordLicenseNames = ['english-words-LICENSE.md','wordnik-LICENSE.txt','enable2k-README.txt','enable2k-mirror-LICENSE.txt'];
const wordLicenses = await Promise.all(wordLicenseNames.map(name => readFile(join(root,'data',name),'utf8')));
const wordPins=JSON.parse(await readFile(join(root,'data','word-game-sources.json'),'utf8'));
const englishPin=wordPins.find(p=>p.repository==='https://github.com/dwyl/english-words'),wordnikPin=wordPins.find(p=>p.repository==='https://github.com/wordnik/wordlist'),enablePin=wordPins.find(p=>p.repository==='https://github.com/BartMassey/wordlists');
const noticeHashes=[englishPin.files['LICENSE.md'].sha256,wordnikPin.files.LICENSE.sha256,enablePin.files['README-enable2k.txt'].sha256,enablePin.files['LICENSE.txt'].sha256];
wordLicenses.forEach((text,i)=>assertTangleSourceHash(text,noticeHashes[i],wordLicenseNames[i]));
if (!wordLicenses[1].includes('Copyright (c) 2020 Wordnik') || !wordLicenses[2].includes('Public Domain')) throw new Error('Missing complete word-list notices');
const wordNotice = 'Alford Daily · bundled word-list sources\n\nEnglish: https://github.com/dwyl/english-words/tree/20f5cc9b3f0ccc8ce45d814c532b7c2031bba31c\nWordnik: https://github.com/wordnik/wordlist/tree/46e6215d0f90356afe9c8ba4be347e7e98cb425c\nENABLE by Alan Beale and M. Cooper: https://github.com/BartMassey/wordlists/tree/af52415c13af809bd8757a40f17f46e79d09583c\nPublicly disclosed Zynga examples are factual additions; this is not a licensed NASPA or official Words With Friends dictionary.\n\n'+wordLicenses.map((text,i)=>wordLicenseNames[i]+'\n\n'+text).join('\n\n')+await modernWordSourceNotice();
if (!html.includes('__GAME_ID__') || !html.includes('__GAME_NAME__')) throw new Error('Missing canonical game placeholders');
const files = await readdir(assets);
if (!files.some(n => n.endsWith('.js')) || !files.some(n => n.endsWith('.css'))) throw new Error('Missing compiled application assets');
for (const file of files) {
  const info = await lstat(join(assets, file));
  if (!info.isFile() || info.isSymbolicLink() || !/\.(js|css|woff2?|ttf|svg|png|txt)$/.test(file)) throw new Error(`Unexpected asset ${file}`);
}
const runtime = join(games, 'kimi-runtime');
await mkdir(runtime, {recursive:true});
// Keep the prior compiled bytes recoverable; validate before touching the runtime.
const backup = resolve(root, '../../output/kimi-build-backups', new Date().toISOString().replaceAll(':','-'));
await mkdir(backup, {recursive:true});
await cp(assets, join(backup, 'prepared-assets'), {recursive:true,errorOnExist:true,force:false});
await writeFileSafe(join(backup,'prepared-assets','word-lists-LICENSE.txt'),wordNotice);
try { await rename(join(runtime, 'assets'), join(backup, 'assets')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
try { await rename(join(backup, 'prepared-assets'), join(runtime, 'assets')); }
catch (error) { await rename(join(backup, 'assets'), join(runtime, 'assets')); throw error; }
await mkdir(join(runtime, 'fonts'), {recursive:true});
for (let i = 0; i < noticeNames.length; i++) await writeFileSafe(join(runtime, 'fonts', noticeNames[i]), notices[i]);
for (const [id, name] of Object.entries(names)) {
  const directory = join(games, `kimi-${id}`);
  await mkdir(directory, {recursive:true});
  const output = html.replaceAll('__GAME_ID__', `kimi-${id}`).replaceAll('__GAME_NAME__', name).replaceAll('./assets/', '../kimi-runtime/assets/');
  await writeFileSafe(join(directory, 'index.html'), output);
}
async function writeFileSafe(path, content) { const {writeFile} = await import('node:fs/promises'); await writeFile(path, content); }
console.log(`Staged ${Object.keys(names).length} Kimi games with ${files.length+1} shared offline assets, including word-list notices.`);
console.log(`Previous assets preserved at ${backup}`);
