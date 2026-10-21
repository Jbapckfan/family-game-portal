import { useEffect, useState } from 'react'
import { useGame } from './useGame'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateLabel } from '../shared/share'
import { hasSeenHelp, markHelpSeen } from './storage'
import { GameHeader } from '../shared/GameHeader'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { GameBoard } from './GameBoard'
import { HelpModal } from './HelpModal'
import { StatsModal } from './StatsModal'
import { WinModal } from './WinModal'

export default function CairnPage() {
  const { state, actions } = useGame()
  useUnifiedProgress('cairn', state)
  const [helpOpen, setHelpOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [winOpen, setWinOpen] = useState(false)

  useEffect(() => {
    if (state.phase === 'playing' && !hasSeenHelp()) {
      setHelpOpen(true)
      markHelpSeen()
    }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished) return
    const t = window.setTimeout(() => setWinOpen(true), state.mode === 'daily' ? 900 : 500)
    fireConfetti()
    return () => window.clearTimeout(t)
  }, [state.finished, state.mode])

  return (
    <div className="kimi-page kimi-cairn flex min-h-dvh flex-col">
      <GameHeader
        title="Cairn"
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
        {state.phase === 'loading' ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="anim-sway flex flex-col-reverse items-center" style={{ gap: 4 }} aria-hidden="true">
              <div className="rounded-full" style={{ width: 72, height: 16, background: 'hsl(200 82% 66%)', transform: 'rotate(-2deg)' }} />
              <div className="rounded-full" style={{ width: 56, height: 16, background: 'hsl(145 55% 55%)', transform: 'rotate(1.5deg)' }} />
              <div className="rounded-full" style={{ width: 42, height: 16, background: 'hsl(24 92% 58%)', transform: 'rotate(-1.5deg)' }} />
              <div className="rounded-full" style={{ width: 30, height: 16, background: 'hsl(340 75% 58%)', transform: 'rotate(2deg)' }} />
            </div>
            <p className="font-display text-lg font-bold text-muted-foreground">Stacking letters…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={actions.exitPractice} />}
            <div className="kimi-stage my-auto w-full" data-game-ready="true">
              <GameBoard state={state} actions={actions} />
              {state.finished && (
                <div className="mb-5 flex justify-center">
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
        A new stack every midnight · Progress is saved in this browser
      </footer>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <StatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} />
      <WinModal
        open={winOpen && state.finished}
        onOpenChange={setWinOpen}
        mode={state.mode}
        puzzleNo={state.puzzleNo}
        results={state.results}
        perfect={state.perfect}
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
    </div>
  )
}
