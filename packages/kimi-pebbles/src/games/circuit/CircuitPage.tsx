import { useEffect, useState } from 'react'
import { useCircuit } from './useCircuit'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateLabel } from '../shared/share'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { CircuitBoard } from './CircuitBoard'
import { CircuitHelpModal } from './CircuitHelpModal'
import { CircuitWinModal } from './CircuitWinModal'

const HELP_KEY = 'kimi:circuit:seen-help'

function RingLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="4" r="3" fill="hsl(24 92% 58%)" />
      <circle cx="24" cy="14" r="3" fill="hsl(145 55% 55%)" />
      <circle cx="14" cy="24" r="3" fill="hsl(200 82% 60%)" />
      <circle cx="4" cy="14" r="3" fill="hsl(275 58% 62%)" />
      <circle cx="14" cy="14" r="3.5" fill="none" stroke="hsl(340 25% 40%)" strokeWidth="2" strokeDasharray="2 2.5" />
    </svg>
  )
}

export default function CircuitPage() {
  const { state, actions } = useCircuit()
  useUnifiedProgress('circuit', state)
  const [helpOpen, setHelpOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [winOpen, setWinOpen] = useState(false)

  useEffect(() => {
    if (state.phase === 'playing' && !localStorage.getItem(HELP_KEY)) {
      setHelpOpen(true)
      localStorage.setItem(HELP_KEY, '1')
    }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished) return
    const t = window.setTimeout(() => setWinOpen(true), 900)
    if (!state.gaveUp) fireConfetti()
    return () => window.clearTimeout(t)
  }, [state.finished, state.gaveUp])

  return (
    <div className="flex min-h-dvh flex-col">
      <GameHeader
        title="CIRCUIT"
        subtitle={state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateLabel()}` : 'Practice round'}
        logo={<RingLogo />}
        onHelp={() => setHelpOpen(true)}
        onStats={() => setStatsOpen(true)}
      />
      <ToastHost toast={state.toast} />

      <main className="flex flex-1 flex-col">
        {state.phase === 'loading' ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-lg font-bold text-muted-foreground">Spinning up the ring…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={actions.exitPractice} />}
            <div className="my-auto w-full" data-game-ready={state.phase === 'playing' || state.phase === 'finished' ? 'true' : undefined}>
              <CircuitBoard state={state} actions={actions} />
              {state.finished && (
                <div className="mt-4 mb-8 flex justify-center">
                  <button type="button" onClick={() => setWinOpen(true)} className="btn3d btn3d-accent h-12 px-6 text-base">
                    See results
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="pb-6 text-center text-xs font-semibold text-muted-foreground">
        A new ring every midnight · Progress is saved in this browser
      </footer>

      <CircuitHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} title="Your circuits" />
      {state.puzzle && (
        <CircuitWinModal
          open={winOpen && state.finished}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          played={state.played}
          gaveUp={state.gaveUp}
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
