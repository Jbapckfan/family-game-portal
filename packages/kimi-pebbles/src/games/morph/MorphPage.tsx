import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useMorph } from './useMorph'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { centralDayNumber, dateForDayNumber } from '../shared/integration'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost } from '../shared/effects'
import { MorphBoard } from './MorphBoard'
import { MorphHelpModal } from './MorphHelpModal'
import { MorphWinModal } from './MorphWinModal'

const HELP_KEY = 'kimi:morph:seen-help'

export default function MorphPage() {
  const { state, actions } = useMorph()
  useUnifiedProgress('morph', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished, 800,
  )
  const startPractice = () => { reset(); actions.startPractice() }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase !== 'playing') return
    try {
      if (!localStorage.getItem(HELP_KEY)) { setHelpOpen(true); localStorage.setItem(HELP_KEY, '1') }
    } catch { setHelpOpen(true) }
  }, [state.phase])

  return (
    <div className="kimi-page kimi-morph flex min-h-dvh flex-col">
      <GameHeader
        title="Morph"
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
            <p className="font-display text-lg font-bold text-muted-foreground">Building ladder…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={backToDaily} />}
            <div className="kimi-stage my-auto w-full" data-game-ready="true">
              <MorphBoard state={state} actions={actions} />
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
        A new ladder every midnight · Progress is saved in this browser
      </footer>

      <MorphHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={{...state.stats,currentStreak:state.stats.lastCompletedDay !== null && state.stats.lastCompletedDay >= centralDayNumber()-1 ? state.stats.currentStreak : 0}} title="Your ladders" />
      {state.puzzle && state.finished && (
        <MorphWinModal
          open={winOpen && state.finished}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          dayNumber={state.dayNumber}
          rows={state.rows}
          misses={state.misses}
          gaveUp={state.gaveUp}
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
