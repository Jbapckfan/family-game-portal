// Stage the same canonical, self-contained games used by the native bundle.
import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination)) throw new Error('Provide an absolute output directory.');
const output = path.resolve(destination);
if (output === root || root.startsWith(output + path.sep)) throw new Error('Output cannot contain source.');
await mkdir(output,{recursive:true});
const filter = source => !['node_modules','tests','.DS_Store','README.md','package.json','package-lock.json'].includes(path.basename(source)) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(source);
// Only remove generated game trees; unrelated Site configuration is retained.
await rm(path.join(output,'games'),{recursive:true,force:true});
await cp(path.join(root,'games'),path.join(output,'games'),{recursive:true,filter});
for (const item of await readdir(path.join(root,'games/daily'),{withFileTypes:true})) {
  if (!filter(item.name)) continue;
  await cp(path.join(root,'games/daily',item.name),path.join(output,item.name),{recursive:true,force:true});
}
const home = await readFile(path.join(output,'index.html'),'utf8');
await writeFile(path.join(output,'index.html'),home.replace('data-game-base="../"','data-game-base="./games/"'));
console.log(`Staged all 32 games and collection in ${output}`);
