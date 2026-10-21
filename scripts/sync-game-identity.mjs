import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {GLYPHS} from '../design/glyphs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const identities = JSON.parse(await readFile(path.join(root, 'design/identities.json'), 'utf8'));
const entries = Object.entries(identities);
for (const [slug,id] of entries) {
  if (!GLYPHS[slug]) throw new Error(`Missing emblem: ${slug}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${id.wash}"/><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" color="${id.accent}">${GLYPHS[slug]}</g></svg>\n`;
  await writeFile(path.join(root,'games',slug,'icon.svg'),svg);
}
const css = entries.map(([slug,id])=>`.game-${slug}{--accent:${id.accent};--accent-dark:${id.dark};--wash:${id.wash};--soft:${id.wash};--tile:#fffefa;--edge:${id.edge}}`).join('\n');
await writeFile(path.join(root,'games/daily/identities.css'),`/* Generated from design/identities.json. */\n${css}\n`);
const homeStyle = path.join(root,'games/daily/styles.css');
const fonts = (await readFile(homeStyle,'utf8')).split('\n').filter(line=>line.startsWith('@font-face')).join('\n');
await writeFile(homeStyle,fonts+'\n'+await readFile(path.join(root,'design/home.css'),'utf8'));
console.log(`Updated ${entries.length} game emblems and collection palettes.`);
