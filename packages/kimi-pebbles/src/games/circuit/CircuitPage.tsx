import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useCircuit } from './useCircuit'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { centralDayNumber,dateForDayNumber,readIntegrationValue, writeIntegrationValue } from '../shared/integration'
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
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished && state.freshFinish, 900,
  )
  const startPractice = () => { reset(); actions.startPractice() }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase === 'playing' && !readIntegrationValue(HELP_KEY)) {
      setHelpOpen(true)
      writeIntegrationValue(HELP_KEY, 1)
    }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished || !state.freshFinish) return
    if (!state.gaveUp) fireConfetti()
  }, [state.finished, state.gaveUp, state.freshFinish])

  return (
    <div className="kimi-page kimi-circuit flex min-h-dvh flex-col">
      <GameHeader
        title="Circuit"
        mode={state.mode}
        busy={state.phase === 'loading'}
        onPractice={startPractice}
        onDaily={backToDaily}
        subtitle={state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateForDayNumber(state.dayNumber)}` : 'Practice round'}

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
        A new ring at midnight Central Time · Daily progress is saved in this browser
      </footer>

      <CircuitHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={{...state.stats,currentStreak:state.stats.lastCompletedDay!==null&&state.stats.lastCompletedDay>=centralDayNumber()-1?state.stats.currentStreak:0}} title="Your circuits" />
      {state.puzzle && winOpen && state.finished && (
        <CircuitWinModal
          key={`${state.mode}:${state.dayNumber}:${state.puzzleNo}`}
          open={true}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          dayNumber={state.dayNumber}
          hintsUsed={state.hintsUsed}
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
