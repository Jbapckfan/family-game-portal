import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

test('all six rollover effects advance a visible daily at midnight and remove their timers', () => {
  const hooks = ['cairn/useGame', 'morph/useMorph', 'hunch/useHunch', 'circuit/useCircuit', 'tangle/useTangle', 'quartet/useQuartet'];
  for (const hook of hooks) {
    // Execute the actual effect body, with a deterministic document and timer clock.
    const source = readFileSync(new URL(`../src/games/${hook}.ts`, import.meta.url), 'utf8');
    const start = source.indexOf('  useEffect(() => {\n    const onVis');
    const ending = '\n  }, [startDaily])';
    const end = source.indexOf(ending, start);
    assert.ok(start >= 0 && end > start, `${hook}: rollover effect exists`);
    let currentDay = 100, starts = 0, tick, delay, cleanup, cleared = false;
    const ref = { current: { mode: 'daily', dayNumber: currentDay } };
    const listeners = new Map();
    const document = {
      visibilityState: 'visible',
      addEventListener(name, callback) { listeners.set(name, callback); },
      removeEventListener(name, callback) { assert.equal(listeners.get(name), callback); listeners.delete(name); },
    };
    const window = {
      setInterval(callback, milliseconds) { tick = callback; delay = milliseconds; return 19; },
      clearInterval(id) { assert.equal(id, 19); cleared = true; },
    };
    new Script(source.slice(start, end + ending.length)).runInNewContext({
      useEffect(effect) { cleanup = effect(); }, window, document, ref,
      todayDayNumber: () => currentDay,
      startDaily: () => { starts += 1; ref.current.dayNumber = currentDay; },
    });
    assert.equal(delay, 30_000, `${hook}: polls every 30 seconds`);
    tick(); assert.equal(starts, 0);
    currentDay = 101; tick(); assert.equal(starts, 1, `${hook}: visible midnight rolls over`);
    tick(); assert.equal(starts, 1, `${hook}: same day does not restart`);
    document.visibilityState = 'hidden'; currentDay = 102; tick(); assert.equal(starts, 1);
    document.visibilityState = 'visible'; listeners.get('visibilitychange')(); assert.equal(starts, 2);
    ref.current.mode = 'practice'; currentDay = 103; tick(); assert.equal(starts, 2, `${hook}: practice stays unchanged`);
    ref.current.mode = 'daily'; ref.current.dayNumber = 0; tick(); assert.equal(starts, 2, `${hook}: unloaded state stays unchanged`);
    cleanup(); assert.equal(cleared, true); assert.equal(listeners.size, 0);
  }
});
