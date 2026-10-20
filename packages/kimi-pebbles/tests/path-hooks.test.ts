import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useCircuit } from '../src/games/circuit/useCircuit.ts'
import { useTangle } from '../src/games/tangle/useTangle.ts'
import { useQuartet } from '../src/games/quartet/useQuartet.ts'
import { saveGameStats, type GameStats } from '../src/games/shared/stats.ts'

const hooks: [string, () => { state: { stats: GameStats } }][] = [['circuit', useCircuit], ['tangle', useTangle], ['quartet', useQuartet]]

for (const [game, useGame] of hooks) {
  test(`${game} rereads current statistics when its already-imported hook mounts again`, () => {
    const empty = { played: 0, completed: 0, currentStreak: 0, maxStreak: 0, lastCompletedDay: null }
    let seen: GameStats | undefined
    function Probe() { seen = useGame().state.stats; return null }
    saveGameStats(game, empty)
    renderToStaticMarkup(createElement(Probe))
    assert.equal(seen?.played, 0)
    const updated = { played: 8, completed: 6, currentStreak: 2, maxStreak: 3, lastCompletedDay: 20746 }
    saveGameStats(game, updated)
    renderToStaticMarkup(createElement(Probe))
    assert.deepEqual(seen, updated)
    saveGameStats(game, empty)
  })
}
