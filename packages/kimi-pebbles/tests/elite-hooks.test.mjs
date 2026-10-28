import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const game of ['morph', 'hunch', 'circuit', 'tangle']) {
  test(`${game}: actual hook persists and resumes unfinished work without scoring it`, () => {
    const output = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./helpers/elite-hook-dom.mjs', import.meta.url)), game],
      { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8', stdio: 'pipe', timeout: 15000 });
    assert.match(output, /resume completed/);
  });
}
