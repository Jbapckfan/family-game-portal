import { fileURLToPath } from 'node:url';
import { collectFiles, portalPages } from './resources.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
try {
  const pages = await portalPages(root);
  const { external, missing } = await collectFiles(root, pages, { checkExternal: true });
  const unique = [...new Map(external.map(ref => [`${ref.page}\0${ref.file}\0${ref.url}`, ref])).values()];
  unique.sort((a, b) => a.page.localeCompare(b.page) || a.file.localeCompare(b.file) || a.url.localeCompare(b.url));
  for (const ref of unique) {
    console.log(`${ref.page}\n  ${ref.file} [${ref.kind}] ${ref.url}`);
  }
  console.log(`${pages.length} pages checked; ${unique.length} cross-origin resource references on ${new Set(unique.map(ref => ref.page)).size} pages.`);
  if (missing.size) console.warn(`Missing local resources: ${[...missing].sort().join(', ')}`);
  if (unique.length || missing.size) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
