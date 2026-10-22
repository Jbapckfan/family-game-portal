import { useMemo } from 'react'
import { Delete, Eraser, Flag, Lightbulb, Undo2, RotateCcw } from 'lucide-react'
import { arcOf, medalForChain } from './engine'

// Presentation colors preserve the four distinct arc identities.
const ARC_COLORS = ['#a65d37', '#2a7379', '#737a42', '#8a587a']
const ARC_EDGES = ['#794022', '#19545a', '#52572d', '#633d58']
import { coverage } from './progress'
import { isPremium } from '../shared/premium'
import { cn } from '@/lib/utils'

type Actions = {
  tapLetter: (i: number) => void
  backspace: () => void
  clearWord: () => void
  undoWord: () => void
  restartChain: () => void
  submit: () => void
  hint: () => void
  giveUp: () => void
}

interface Props {
  state: {
    phase: string
    puzzle: { l: string; n: number; par: number; sol: string[] } | null
    played: string[]
    current: number[]
    revealed: number
    hintsUsed: number
    finished: boolean
    gaveUp: boolean
    shaking: boolean
  }
  actions: Actions
}

export function CircuitBoard({ state, actions }: Props) {
  const puzzle = state.puzzle
  const covered = useMemo(() => (puzzle ? coverage(state.played, puzzle.l) : 0), [puzzle, state.played])
  if (!puzzle) return null

  const letters = puzzle.l.split('')
  const coveredCount = covered.toString(2).split('').filter((b) => b === '1').length
  const currentWord = state.current.map((i) => letters[i]).join('')
  const needStart = !state.finished && state.played.length > 0 && state.current.length === 0
    ? state.played[state.played.length - 1].slice(-1)
    : null
  const lastArc = state.current.length > 0 ? arcOf(state.current[state.current.length - 1]) : null
  const medal = medalForChain(state.played.length, puzzle.par, state.gaveUp)

  return (
    <div className="kimi-board circuit-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      <div className="mt-4 flex w-full items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          Words <span className="font-display text-lg text-foreground">{state.played.length}</span>
          <span className="text-muted-foreground"> · par {puzzle.par}</span>
        </span>
        <span>
          Letters lit <span className="font-display text-lg text-foreground">{coveredCount}/12</span>
        </span>
      </div>

      {/* coverage meter */}
      <div className="circuit-coverage mt-2 flex gap-1" aria-label={`${coveredCount} of 12 letters lit`}>
        {letters.map((_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 rounded-full transition-colors duration-200"
            style={{
              background: (covered >> i) & 1 ? ARC_COLORS[arcOf(i)] : 'hsl(340 18% 82%)',
            }}
          />
        ))}
      </div>

      {/* the ring */}
      <div className={cn('circuit-instrument relative mx-auto mt-6 h-72 w-72 sm:h-80 sm:w-80', state.shaking && 'anim-shake')}>
        {/* current word in the middle */}
        <div className="circuit-readout absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl font-extrabold uppercase tracking-[0.2em]" aria-live="polite">
            {currentWord || (needStart ? `${needStart}…` : ' ')}
          </div>
          {state.revealed > 0 && (
            <div className="mt-1 max-w-44 text-center text-xs font-bold text-muted-foreground">
              Route: {puzzle.sol.slice(0, state.revealed).join(' → ')}
            </div>
          )}
        </div>
        {letters.map((ch, i) => {
          const angle = (i / 12) * 360 - 90
          const lit = ((covered >> i) & 1) === 1
          const picked = state.current.includes(i)
          const disabledArc = lastArc !== null && arcOf(i) === lastArc && !picked
          const mustPick = needStart && letters[i] !== needStart
          return (
            <button
              key={i}
              type="button"
              data-letter={i}
              aria-label={`Letter ${ch}, arc ${arcOf(i) + 1}${lit ? ', lit' : ''}`}
              disabled={state.finished}
              onClick={() => actions.tapLetter(i)}
              className={cn(
                'circuit-node tile3d absolute h-14 w-14 text-2xl transition-all duration-150',
                picked && 'scale-110',
                !lit && !picked && 'opacity-95',
              )}
              style={{
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 40}% - 24px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 40}% - 24px)`,
                background: lit || picked ? ARC_COLORS[arcOf(i)] : 'hsl(var(--tile-face))',
                color: lit || picked ? '#fff' : ARC_EDGES[arcOf(i)],
                border: `3px solid ${lit || picked ? 'transparent' : ARC_COLORS[arcOf(i)]}`,
                boxShadow: `0 5px 0 ${lit || picked ? ARC_EDGES[arcOf(i)] : 'hsl(var(--tile-edge))'}`,
                opacity: disabledArc || mustPick ? 0.58 : undefined,
              }}
            >
              {ch}
            </button>
          )
        })}
      </div>

      {/* chain so far */}
      {state.played.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5" aria-label="Words played">
          {state.played.map((w, i) => (
            <span key={i} className="rounded-full bg-secondary px-3 py-1 font-display text-sm font-bold uppercase tracking-wider">
              {w}
              {i < state.played.length - 1 && <span className="text-muted-foreground"> →</span>}
            </span>
          ))}
        </div>
      )}

      {/* controls */}
      {!state.finished && (
        <div className="mt-5 flex w-full max-w-md items-stretch justify-center gap-2">
          <button
            type="button"
            aria-label="Erase word"
            onClick={actions.clearWord}
            className="btn3d btn3d-soft h-12 w-14"
          >
            <Eraser className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Delete last letter"
            onClick={actions.backspace}
            className="btn3d btn3d-soft h-12 w-14"
          >
            <Delete className="mx-auto h-5 w-5" />
          </button>
          <button type="button" onClick={actions.submit} className="btn3d btn3d-accent h-12 flex-1 text-base">
            Play word
          </button>
        </div>
      )}

      {!state.finished && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={actions.undoWord} disabled={state.played.length === 0} className="btn3d btn3d-soft h-11 px-4 text-sm disabled:opacity-50">
            <Undo2 className="h-4 w-4" />
            Undo word
          </button>
          <button type="button" onClick={actions.restartChain} disabled={state.played.length === 0 && state.current.length === 0} className="btn3d btn3d-soft h-11 px-4 text-sm disabled:opacity-50">
            <RotateCcw className="h-4 w-4" />
            Restart chain
          </button>
        </div>
      )}

      {!state.finished && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={actions.hint} className="btn3d btn3d-soft h-11 px-4 text-sm">
            <Lightbulb className="h-4 w-4" />
            {isPremium() ? 'Route clue · ∞' : state.hintsUsed === 0 ? 'Route clue · 1 free' : 'Route clue · used'}
          </button>
          <button type="button" onClick={actions.giveUp} className="btn3d btn3d-soft h-11 px-4 text-sm">
            <Flag className="h-4 w-4" />
            Reveal route
          </button>
        </div>
      )}

      {state.finished && !state.gaveUp && (
        <div className="mt-4 font-display text-xl font-extrabold">
          {medal.icon} {medal.label}
        </div>
      )}
    </div>
  )
}
