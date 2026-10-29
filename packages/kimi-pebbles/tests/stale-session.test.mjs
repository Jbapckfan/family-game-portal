import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const helper = fileURLToPath(new URL('./helpers/stale-hook-dom.mjs', import.meta.url));
for (const game of ['cairn', 'morph', 'hunch', 'tangle', 'circuit', 'quartet']) {
  for (const scenario of ['draft', 'terminal', 'event', 'blocked', 'quota', 'persist', 'corrupt-terminal']) {
    test(`${game}: real isolated hook controllers protect ${scenario}`, { timeout: 15000 }, () => {
      const result = spawnSync(process.execPath, [helper, game, scenario], { encoding: 'utf8', timeout: 12000 });
      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  }
}
for (const [game, scenario] of [['cairn', 'delayed'], ['morph', 'assisted'], ['hunch', 'checkpoint']]) {
  test(`${game}: real hook ${scenario} regression`, { timeout: 15000 }, () => {
    const result = spawnSync(process.execPath, [helper, game, scenario], { encoding: 'utf8', timeout: 12000 });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
}
