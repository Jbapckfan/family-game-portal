import { useEffect } from 'react'
import { useGameOverlays } from '../shared/useGameOverlays'
import { useTangle } from './useTangle'
import { useUnifiedProgress } from '../shared/useUnifiedProgress'
import { centralDayNumber, dateForDayNumber, readIntegrationValue, writeIntegrationValue } from '../shared/integration'
import { GameHeader } from '../shared/GameHeader'
import { SimpleStatsModal } from '../shared/SimpleStatsModal'
import { PracticeBanner, ToastHost, fireConfetti } from '../shared/effects'
import { TangleBoard } from './TangleBoard'
import { TangleHelpModal } from './TangleHelpModal'
import { TangleWinModal } from './TangleWinModal'

const HELP_KEY = 'kimi:tangle:seen-help'

export default function TanglePage() {
  const { state, actions } = useTangle()
  const five = state.puzzle?.g.length === 25
  useUnifiedProgress('tangle', state)
  const { helpOpen, statsOpen, winOpen, setHelpOpen, setStatsOpen, setWinOpen, reset } = useGameOverlays(
    `${state.mode}:${state.dayNumber}:${state.puzzleNo}:${five}`, state.goldReached && state.winShownOnce, 900,
  )
  const startPractice = () => { reset(); if (five) actions.startFivePreview(true); else actions.startPractice() }
  const startFivePreview = () => { reset(); actions.startFivePreview() }
  const restartFivePreview = () => { reset(); actions.startFivePreview(true) }
  const backToDaily = () => { reset(); actions.exitPractice() }

  useEffect(() => {
    if (state.phase === 'playing' && !readIntegrationValue(HELP_KEY)) {
      setHelpOpen(true)
      writeIntegrationValue(HELP_KEY, 1)
    }
  }, [state.phase])

  // celebrate the moment gold is reached (once per puzzle)
  useEffect(() => {
    if (!state.goldReached || !state.winShownOnce) return
    fireConfetti()
    // The hook sets winShownOnce only on a fresh Gold crossing; restore leaves it false.
  }, [state.goldReached, state.winShownOnce])

  return (
    <div className={`kimi-page kimi-tangle ${five ? 'tangle-five' : ''} flex min-h-dvh flex-col`}>
      <GameHeader
        title="Tangle"
        mode={state.mode}
        busy={state.phase === 'loading'}
        onPractice={startPractice}
        onDaily={backToDaily}
        subtitle={five ? '5×5 playable preview' : state.mode === 'daily' ? `No. ${state.puzzleNo} · ${dateForDayNumber(state.dayNumber)}` : 'Practice round'}

        onHelp={() => setHelpOpen(true)}
        onStats={() => setStatsOpen(true)}
      />
      <ToastHost toast={state.toast} />

      <main data-game-focus tabIndex={-1} className="kimi-main flex flex-1 flex-col">
        {state.mode === 'practice' && !five && <PracticeBanner onExit={backToDaily} />}
        <div className="kimi-stage my-auto w-full" data-game-ready={state.phase === 'playing' ? 'true' : undefined}>
          <div className="tangle-size-picker" role="group" aria-label="Board size">
            <button type="button" disabled={state.phase === 'loading'} aria-pressed={!five} onClick={() => { if (five || state.mode !== 'daily') backToDaily() }}>4×4 Daily</button>
            <button type="button" disabled={state.phase === 'loading'} aria-pressed={five} onClick={() => { if (!five) startFivePreview() }}>5×5 Preview</button>
          </div>
          {five && <div className="tangle-preview-note"><p><strong>A bigger web. Same rules.</strong><span>One sample board · Gold at 30 · No daily streak</span></p></div>}
          <TangleBoard state={state} actions={actions} />
          {five && <div className="tangle-preview-note"><button type="button" onClick={restartFivePreview}>Restart sample</button></div>}
          {state.found.length > 0 && (
            <div className="mb-8 flex justify-center">
              <button type="button" data-game-results onClick={() => setWinOpen(true)} className="btn3d btn3d-accent h-12 px-6 text-base">
                See results
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-6 text-center text-xs font-semibold text-muted-foreground">
        {five ? 'Sample preview · Progress stays in this tab · Restart clears it' : 'A new web every midnight · Daily progress is saved in this browser'}
      </footer>

      <TangleHelpModal open={helpOpen} onOpenChange={setHelpOpen} boardSize={five ? 5 : 4} />
      <SimpleStatsModal open={statsOpen} onOpenChange={setStatsOpen} stats={{...state.stats,currentStreak:state.stats.lastCompletedDay !== null && state.stats.lastCompletedDay >= centralDayNumber()-1 ? state.stats.currentStreak : 0}} title="Your webs" />
      {state.puzzle && winOpen && (
        <TangleWinModal
          key={`${state.mode}:${state.dayNumber}:${state.puzzleNo}:${state.puzzle.max}:${five}`}
          open={true}
          onOpenChange={setWinOpen}
          mode={state.mode}
          puzzle={state.puzzle}
          puzzleNo={state.puzzleNo}
          dayNumber={state.dayNumber}
          misses={state.misses}
          hintsUsed={state.hintsUsed}
          found={state.found}
          score={state.score}
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
