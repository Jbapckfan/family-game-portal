import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const scenario of ['escape', 'choice', 'pointer', 'focus']) {
  test(`Morph letter palette: ${scenario} works with real React DOM`, () => {
    const output = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./helpers/morph-palette-dom.mjs', import.meta.url)), scenario],
      { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', stdio: 'pipe', timeout: 15000 });
    assert.match(output, new RegExp(`palette ${scenario} completed`));
  });
}
