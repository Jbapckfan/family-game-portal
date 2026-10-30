import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useGame } from './useGame'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateForDayNumber } from '../shared/integration'
import { hasSeenHelp, markHelpSeen } from './storage'
import { GameHeader } from '../shared/GameHeader'
import { PracticeBanner, ToastHost } from '../shared/effects'
import { GameBoard } from './GameBoard'
import { HelpModal } from './HelpModal'
import { StatsModal } from './StatsModal'
import { WinModal } from './WinModal'

export default function CairnPage() {
  const { state, actions } = useGame()
  useUnifiedProgress('cairn', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}`, state.finished, state.mode === 'daily' ? 900 : 500,
  )
  const startPractice = () => { reset(); actions.startPractice() }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase === 'playing' && !hasSeenHelp()) {
      setHelpOpen(true)
      markHelpSeen()
    }
  }, [state.phase])


  return (
    <div className="kimi-page kimi-cairn flex min-h-dvh flex-col">
      <GameHeader
        title="Cairn"
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="cairn-finish-mark" aria-hidden="true">{Array.from({length:5},(_,i)=><span key={i}/>)}</div>
            <p className="font-display text-lg font-bold text-muted-foreground">Stacking letters…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={backToDaily} />}
            <div className="kimi-stage my-auto w-full" data-game-ready="true">
              <GameBoard state={state} actions={actions} />
              {state.finished && (
                <div className="mb-5 flex justify-center">
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
        A new stack every midnight · Progress is saved in this browser
      </footer>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <StatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} />
      <WinModal
        open={winOpen && state.finished}
        onOpenChange={setWinOpen}
        mode={state.mode}
        puzzleNo={state.puzzleNo}
        dayNumber={state.dayNumber}
        results={state.results}
        perfect={state.perfect}
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
    </div>
  )
}
