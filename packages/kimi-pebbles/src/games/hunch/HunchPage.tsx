import { useEffect, useState } from 'react'
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

function KeyLogo() {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true">
      <rect x="0" y="6" width="8" height="10" rx="2.5" fill="hsl(145 55% 55%)" />
      <rect x="11" y="6" width="8" height="10" rx="2.5" fill="hsl(43 92% 58%)" />
      <rect x="22" y="6" width="8" height="10" rx="2.5" fill="hsl(340 14% 62%)" />
    </svg>
  )
}

export default function HunchPage() {
  const { state, actions } = useHunch()
  useUnifiedProgress('hunch', state)
  const [helpOpen, setHelpOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [winOpen, setWinOpen] = useState(false)

  useEffect(() => {
    if (state.phase !== 'playing') return
    try {
      if (!localStorage.getItem(HELP_KEY)) { setHelpOpen(true); localStorage.setItem(HELP_KEY, '1') }
    } catch { setHelpOpen(true) }
  }, [state.phase])

  useEffect(() => {
    if (!state.finished) return
    const t = window.setTimeout(() => setWinOpen(true), 900)
    if (state.won) fireConfetti()
    return () => window.clearTimeout(t)
  }, [state.finished, state.won])

  return (
    <div className="flex min-h-dvh flex-col">
      <GameHeader
        title="HUNCH"
        subtitle={state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateLabel()}` : 'Practice round'}
        logo={<KeyLogo />}
        onHelp={() => setHelpOpen(true)}
        onStats={() => setStatsOpen(true)}
      />
      <ToastHost toast={state.toast} />

      <main className="flex flex-1 flex-col">
        {state.phase === 'loading' ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-lg font-bold text-muted-foreground">Picking a word…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={actions.exitPractice} />}
            <div className="my-auto w-full" data-game-ready="true">
              <HunchBoard state={state} actions={actions} />
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
