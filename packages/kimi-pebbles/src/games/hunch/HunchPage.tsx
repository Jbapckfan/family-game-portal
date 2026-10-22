import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useHunch } from './useHunch'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateLabel } from '../shared/share'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { HunchBoard } from './HunchBoard'
import { HunchHelpModal } from './HunchHelpModal'
import { HunchWinModal } from './HunchWinModal'

const HELP_KEY = 'kimi:hunch:seen-help'

export default function HunchPage() {
  const { state, actions } = useHunch()
  useUnifiedProgress('hunch', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished, 900,
  )
  const startPractice = () => { reset(); actions.startPractice() }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase !== 'playing') return
    try {
      if (!localStorage.getItem(HELP_KEY)) { setHelpOpen(true); localStorage.setItem(HELP_KEY, '1') }
    } catch { setHelpOpen(true) }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished) return
    if (state.won) fireConfetti()
  }, [state.finished, state.won])

  return (
    <div className="kimi-page kimi-hunch flex min-h-dvh flex-col">
      <GameHeader
        title="Hunch"
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
            <p className="font-display text-lg font-bold text-muted-foreground">Picking a word…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={backToDaily} />}
            <div className="kimi-stage my-auto w-full" data-game-ready="true">
              <HunchBoard state={state} actions={actions} />
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
        A new word every midnight · Progress is saved in this browser
      </footer>

      <HunchHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} title="Your hunches" />
      {state.answer && (
        <HunchWinModal
          open={winOpen && state.finished}
          onOpenChange={setWinOpen}
          mode={state.mode}
          answer={state.answer}
          puzzleNo={state.puzzleNo}
          evals={state.evals}
          won={state.won}
          hintsUsed={state.hintsUsed}
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
