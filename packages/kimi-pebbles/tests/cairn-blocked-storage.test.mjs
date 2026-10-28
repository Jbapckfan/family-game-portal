import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDayProgress, saveDayProgress, loadStats, saveStats } from '../src/games/cairn/storage.ts';

test('Cairn retains the latest active-session progress and count when persistent storage fails', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } });
  try {
    const progress = { level: 0, results: [], rack: [...'arc'], slots: [0, null, null], misses: 0, hints: 0, finished: false, countedPlayed: true };
    saveDayProgress(20000, progress);
    assert.deepEqual(loadDayProgress(20000), progress);
    const stats = { played: 1, completed: 0, perfect: 0, currentStreak: 0, maxStreak: 0, lastCompletedDay: null, totalMisses: 0 };
    saveStats(stats);
    assert.deepEqual(loadStats(), stats);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
