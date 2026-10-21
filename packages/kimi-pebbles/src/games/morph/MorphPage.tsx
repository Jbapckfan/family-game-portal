import { useEffect, useState } from 'react'
import { useMorph } from './useMorph'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { dateLabel } from '../shared/share'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { MorphBoard } from './MorphBoard'
import { MorphHelpModal } from './MorphHelpModal'
import { MorphWinModal } from './MorphWinModal'

const HELP_KEY = 'kimi:morph:seen-help'

export default function MorphPage() {
  const { state, actions } = useMorph()
  useUnifiedProgress('morph', state)
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
    const t = window.setTimeout(() => setWinOpen(true), 800)
    if (!state.gaveUp) fireConfetti()
    return () => window.clearTimeout(t)
  }, [state.finished, state.gaveUp])

  return (
    <div className="kimi-page kimi-morph flex min-h-dvh flex-col">
      <GameHeader
        title="Morph"
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
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-lg font-bold text-muted-foreground">Building ladder…</p>
          </div>
        ) : (
          <>
            {state.mode === 'practice' && <PracticeBanner onExit={actions.exitPractice} />}
            <div className="kimi-stage my-auto w-full" data-game-ready="true">
              <MorphBoard state={state} actions={actions} />
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
        A new ladder every midnight · Progress is saved in this browser
      </footer>

      <MorphHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={state.stats} title="Your ladders" />
      {state.puzzle && (
        <MorphWinModal
          open={winOpen && state.finished}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          rows={state.rows}
          misses={state.misses}
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
