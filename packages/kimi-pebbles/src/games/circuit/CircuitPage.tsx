import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
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

export default function CircuitPage() {
  const { state, actions } = useCircuit()
  useUnifiedProgress('circuit', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished, 900,
  )
  const startPractice = () => { reset(); actions.startPractice() }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase === 'playing' && !localStorage.getItem(HELP_KEY)) {
      setHelpOpen(true)
      localStorage.setItem(HELP_KEY, '1')
    }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished) return
    if (!state.gaveUp) fireConfetti()
  }, [state.finished, state.gaveUp])

  return (
    <div className="kimi-page kimi-circuit flex min-h-dvh flex-col">
      <GameHeader
        title="Circuit"
        mode={state.mode}
        busy={state.phase === 'loading'}
        onPractice={startPractice}
        onDaily={backToDaily}
        subtitle={state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateLabel()}` : 'Practice round'}

        onHelp={() => setHelpOpen(true)}
        onStats={() => setStatsOpen(true)}
      />
      <ToastHost toast={state.toast} />

      <main data-game-focus tabIndex={-1} className="kimi-main flex flex-1 flex-col">
        {state.phase === 'loading' ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-lg font-bold text-muted-foreground">Spinning up the ring…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={backToDaily} />}
            <div className="kimi-stage my-auto w-full" data-game-ready={state.phase === 'playing' || state.phase === 'finished' ? 'true' : undefined}>
              <CircuitBoard state={state} actions={actions} />
              {state.finished && (
                <div className="mt-4 mb-8 flex justify-center">
                  <button type="button" data-game-results onClick={() => setWinOpen(true)} className="btn3d btn3d-accent h-12 px-6 text-base">
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
            startPractice()
          }}
          onNewPractice={() => {
            setWinOpen(false)
            startPractice()
          }}
          onBackToDaily={() => {
            setWinOpen(false)
            backToDaily()
          }}
        />
      )}
    </div>
  )
}
