import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useQuartet } from './useQuartet'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { readIntegrationValue, writeIntegrationValue } from '../shared/integration'
import { dateLabel } from '../shared/share'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { QuartetBoard } from './QuartetBoard'
import { QuartetHelpModal } from './QuartetHelpModal'
import { QuartetWinModal } from './QuartetWinModal'

const HELP_KEY = 'kimi:quartet:seen-help'

export default function QuartetPage() {
  const { state, actions } = useQuartet()
  useUnifiedProgress('quartet', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished, 900,
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
    if (!state.finished) return
    if (state.won) fireConfetti()
  }, [state.finished, state.won])

  return (
    <div className="kimi-page kimi-quartet flex min-h-dvh flex-col">
      <GameHeader
        title="Quartet"
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
            <p className="font-display text-lg font-bold text-muted-foreground">Shuffling sixteen words…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={backToDaily} />}
            <div className="kimi-stage my-auto w-full" data-game-ready={state.phase === 'playing' || state.phase === 'finished' ? 'true' : undefined}>
              <QuartetBoard state={state} actions={actions} />
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
        A new grid every midnight · Progress is saved in this browser
      </footer>

      <QuartetHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} title="Your quartets" />
      {state.puzzle && (
        <QuartetWinModal
          open={winOpen && state.finished}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          history={state.history}
          misses={state.misses}
          won={state.won}
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
