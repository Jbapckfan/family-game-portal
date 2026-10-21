import { useEffect, useState } from 'react'
import { useTangle } from './useTangle'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateLabel } from '../shared/share'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { TangleBoard } from './TangleBoard'
import { TangleHelpModal } from './TangleHelpModal'
import { TangleWinModal } from './TangleWinModal'

const HELP_KEY = 'kimi:tangle:seen-help'

export default function TanglePage() {
  const { state, actions } = useTangle()
  useUnifiedProgress('tangle', state)
  const [helpOpen, setHelpOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [winOpen, setWinOpen] = useState(false)

  useEffect(() => {
    if (state.phase === 'playing' && !localStorage.getItem(HELP_KEY)) {
      setHelpOpen(true)
      localStorage.setItem(HELP_KEY, '1')
    }
  }, [state.phase])

  // celebrate the moment gold is reached (once per puzzle)
  useEffect(() => {
    if (!state.goldReached || !state.winShownOnce) return
    const t = window.setTimeout(() => setWinOpen(true), 900)
    fireConfetti()
    // mark shown so reopening later doesn't auto-celebrate again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => window.clearTimeout(t)
  }, [state.goldReached, state.winShownOnce])

  return (
    <div className="kimi-page kimi-tangle flex min-h-dvh flex-col">
      <GameHeader
        title="Tangle"
        mode={state.mode}
        busy={state.phase === 'loading'}
        onPractice={actions.startPractice}
        onDaily={actions.exitPractice}
        subtitle={state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateLabel()}` : 'Practice round'}

        onHelp={() => setHelpOpen(true)}
        onStats={() => setStatsOpen(true)}
      />
      <ToastHost toast={state.toast} />

      <main className="kimi-main flex flex-1 flex-col">
        {state.mode === 'practice' && <PracticeBanner onExit={actions.exitPractice} />}
        <div className="kimi-stage my-auto w-full" data-game-ready={state.phase === 'playing' ? 'true' : undefined}>
          <TangleBoard state={state} actions={actions} />
          {state.goldReached && (
            <div className="mb-8 flex justify-center">
              <button type="button" onClick={() => setWinOpen(true)} className="btn3d btn3d-accent h-12 px-6 text-base">
                See results
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-6 text-center text-xs font-semibold text-muted-foreground">
        A new web every midnight · Progress is saved in this browser
      </footer>

      <TangleHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} title="Your webs" />
      {state.puzzle && (
        <TangleWinModal
          open={winOpen && state.goldReached}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          found={state.found}
          score={state.score}
          onPractice={() => {
            setWinOpen(false)
            actions.startPractice()
          }}
          onNewPractice={() => {
            setWinOpen(false)
            actions.startPractice()
          }}
          onBackToDaily={() => {
            setWinOpen(false)
            actions.exitPractice()
          }}
        />
      )}
    </div>
  )
}
