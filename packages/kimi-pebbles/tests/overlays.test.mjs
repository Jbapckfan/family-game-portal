import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('real React/Radix overlay, interruption and keyboard-focus regressions', t => {
  const env = { ...process.env, TSX_TSCONFIG_PATH: fileURLToPath(new URL('../tsconfig.app.json', import.meta.url)) };
  // Node's outer runner marks child processes as workers. A nested --test must
  // start a fresh runner or it can return success without executing any tests.
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-reporter=tap', 'tests/helpers/overlays-dom.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8', timeout: 60000,
    env,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /# tests 23\b/, 'all nested DOM regressions must execute');
  assert.match(result.stdout, /# pass 23\b/, 'all nested DOM regressions must pass');
  t.diagnostic(result.stdout.trim());
});
