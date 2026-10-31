import { useEffect, useRef, useState } from 'react'
import { isNativeEnter } from '../shared/keyboard'
import { Flag, Lightbulb, X } from 'lucide-react'
import { changedIndex, diffCount } from './engine'
import type { MorphState } from './useMorph'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface Props {
  state: MorphState
  actions: {
    openCell: (i: number) => void
    closePalette: () => void
    pickLetter: (ch: string) => void
    keyboardLetter: (ch: string) => void
    submit: () => void
    hint: () => void
    closePath: () => void
    undo: () => void
    restart: () => void
    giveUp: () => void
  }
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('')

const VARIANT_CLASS = {
  start: 'tile-sky',
  done: 'tile-ok',
  active: 'tile-slot',
  target: 'tile-new',
} as const

function Tile({
  ch,
  variant,
  dot,
  onClick,
  ring,
  disabled,
  position,
}: {
  ch: string
  variant: keyof typeof VARIANT_CLASS
  dot?: boolean
  ring?: boolean
  onClick?: () => void
  disabled?: boolean
  position?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'morph-letter tile3d h-14 w-12 text-2xl sm:w-13',
        VARIANT_CLASS[variant],
        onClick && !disabled && 'cursor-pointer',
        !onClick && 'cursor-default',
        ring && 'ring-4 ring-ring ring-offset-2 ring-offset-background',
      )}
      aria-label={onClick ? `Edit letter ${ch}, position ${(position ?? 0) + 1}` : `Letter ${ch}${dot ? ', changed on this step' : ''}`}
      aria-description={position !== undefined ? `Position ${position + 1} of 4` : undefined}
      aria-describedby={onClick ? 'morph-instructions' : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {ch}
      {dot && <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/90" />}
    </button>
  )
}

export function MorphBoard({ state, actions }: Props) {
  const { puzzle, rows, edit, focusCell, phase, misses, hintsUsed, showPath, shaking } = state
  type Choice = 'hint' | 'skip' | 'restart'
  const [confirmation, setConfirmation] = useState<{kind:Choice; key:string; puzzle:typeof puzzle; rows:string[]}|null>(null)
  const [lastChoice, setLastChoice] = useState<Choice>('hint')
  const confirmed = useRef(false)
  const identity = `${state.mode}:${state.dayNumber}:${state.puzzleNo}`
  const confirmationValid = confirmation?.key === identity && confirmation.puzzle === puzzle && confirmation.rows === rows && phase === 'playing'
  const choice = confirmation?.kind ?? lastChoice
  useEffect(() => { setConfirmation(null) }, [identity,puzzle,rows,phase])
  const request = (kind:Choice) => { confirmed.current = false; setLastChoice(kind); setConfirmation({kind,key:identity,puzzle,rows}) }
  const confirm = () => {
    if (!confirmationValid || confirmed.current) return
    confirmed.current = true
    setConfirmation(null)
    if (choice === 'hint') actions.hint()
    else if (choice === 'restart') actions.restart()
    else actions.giveUp()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isNativeEnter(e)) return
      if (e.key === 'Enter') {
        e.preventDefault()
        actions.submit()
        return
      }
      if (e.key === 'Escape') {
        actions.closePalette()
        return
      }
      const ch = e.key.toLowerCase()
      if (/^[a-z]$/.test(ch)) actions.keyboardLetter(ch)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions])

  if (!puzzle) return null
  const moves = rows.length - 1
  const changed = diffCount(rows[rows.length - 1], edit.join(''))
  const locked = phase !== 'playing'

  return (
    <div className="kimi-board morph-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      {/* meta row */}
      <div className="mt-4 flex w-full items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          Moves <span className="font-display text-lg text-foreground">{moves}</span>
          <span className="text-muted-foreground"> · suggested {puzzle.par}</span>
        </span>
        <span>{misses > 0 ? `${misses} miss${misses === 1 ? '' : 'es'}` : '\u00A0'}</span>
      </div>

      {!state.finished && <p id="morph-instructions" className="mt-3 max-w-sm text-center text-sm font-semibold text-muted-foreground">
        Change exactly one letter to make a new word. Tap a letter below, or type a four-letter word.
      </p>}

      <div className="morph-goal" aria-label={`Goal word ${puzzle.t.toUpperCase()}`}>
        <span>Goal</span><strong>{puzzle.t.toUpperCase()}</strong>
        <span>One letter per step</span>
      </div>

      {/* ladder */}
      <div className={cn('morph-ladder mt-4 flex flex-col items-center gap-1.5', shaking && 'anim-shake')}>
        <div className="flex items-center gap-3">
          <span className="w-14 text-right text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            start
          </span>
          <div className="flex gap-1.5">
            {puzzle.s.split('').map((c, i) => (
              <Tile key={i} ch={c} variant="start" />
            ))}
          </div>
        </div>

        {rows.slice(1).map((w, ri) => {
          const prev = rows[ri]
          const dotIdx = changedIndex(prev, w)
          return (
            <div key={ri} className="flex items-center gap-3">
              <span className="w-14 text-right text-xs text-muted-foreground">{ri + 1}</span>
              <div className="anim-pop flex gap-1.5">
                {w.split('').map((c, i) => (
                  <Tile key={i} ch={c} variant="done" dot={i === dotIdx} />
                ))}
              </div>
            </div>
          )
        })}

        {!state.finished && (
          <div className="flex items-center gap-3">
            <span className="w-14 text-right text-[10px] font-extrabold uppercase tracking-widest text-accent">
              next
            </span>
            <div className="flex gap-1.5">
              {edit.map((c, i) => (
                <Tile
                  key={i}
                  ch={c}
                  variant="active"
                  dot={c !== rows[rows.length - 1][i]}
                  ring={focusCell === i}
                  onClick={() => actions.openCell(i)}
                  position={i}
                  disabled={locked}
                />
              ))}
            </div>
          </div>
        )}

      </div>
      {!state.finished && <p className="morph-edit-status" role="status">{changed === 1 ? '1 letter changed · check your word' : `${changed} letters changed · change exactly one`}</p>}

      {/* supplied route reveal */}
      {showPath && (
        <div className="mt-4 w-full max-w-sm rounded-2xl border-2 border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
              Suggested route · {puzzle.par} moves
            </span>
            <button
              type="button"
              onClick={actions.closePath}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="Hide suggested route"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1 font-display text-lg font-bold uppercase tracking-wider">
            {puzzle.p.map((w, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className={cn(w === puzzle.t && 'morph-route-goal')}>{w}</span>
                {i < puzzle.p.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* actions */}
      {!state.finished && (
        <div className="mt-6 flex w-full max-w-md flex-col gap-3">
          <button
            type="button"
            onClick={actions.submit}
            disabled={locked}
            className="btn3d btn3d-accent h-13 w-full text-lg tracking-widest"
          >
              CHECK WORD
          </button>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => hintsUsed > 0 ? actions.hint() : request('hint')}
              disabled={locked}
              className="btn3d btn3d-soft h-11 px-4 text-sm"
            >
              <Lightbulb className="h-4 w-4" />
              {hintsUsed === 0 ? 'Show a route · 1 hint' : 'View saved route'}
            </button>
            <button
              type="button"
              onClick={() => request('skip')}
              disabled={locked}
              className="btn3d btn3d-soft h-11 px-4 text-sm"
            >
              <Flag className="h-4 w-4" />
              Give up
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={actions.undo} disabled={locked || rows.length <= 1} className="btn3d btn3d-soft h-11 px-4 text-sm">Undo rung</button>
            <button type="button" onClick={() => request('restart')} disabled={locked || rows.length <= 1} className="btn3d btn3d-soft h-11 px-4 text-sm">Restart ladder</button>
          </div>
          <p className="text-center text-xs font-semibold text-muted-foreground">
            Change one letter per rung. Undo or restart any unfinished ladder; your hints and misses are kept.
          </p>
        </div>
      )}

      {/* letter palette */}
      <Dialog open={state.paletteOpen && focusCell !== null} onOpenChange={(open) => { if (!open) actions.closePalette() }}>
        <DialogContent className="morph-letter-palette max-w-md rounded-3xl p-4"
          onKeyDown={event => { if (!event.metaKey && !event.ctrlKey && !event.altKey && /^[a-z]$/i.test(event.key)) { event.preventDefault(); actions.pickLetter(event.key.toLowerCase()) } }}
          onOpenAutoFocus={event => { const button = document.querySelector<HTMLButtonElement>(`.morph-letter-palette [data-morph-letter="${edit[focusCell ?? 0]}"]`); if (button) { event.preventDefault(); button.focus() } }}>
          <DialogTitle className="font-display text-xl">Replace position {(focusCell ?? 0) + 1}</DialogTitle>
          <DialogDescription>Choose a letter, or press a letter key. You will check the word next.</DialogDescription>
          <div className="grid grid-cols-5 gap-2 min-[360px]:grid-cols-6">
            {ALPHABET.map((c) => (
              <button key={c} type="button" data-morph-letter={c} aria-pressed={c === edit[focusCell ?? 0]} onClick={() => actions.pickLetter(c)} className="tile3d h-12 w-full text-xl">
                {c}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(confirmationValid)} onOpenChange={open => { if (!open) setConfirmation(null) }}>
        <DialogContent className="morph-confirm max-w-sm rounded-3xl">
          <DialogTitle>{choice === 'hint' ? 'Show the supplied route?' : choice === 'restart' ? 'Restart this ladder?' : 'Reveal the route and finish?'}</DialogTitle>
          <DialogDescription>{choice === 'hint'
            ? 'This shows the whole supplied route and permanently marks this round Assisted. You can reopen the saved route for free.'
            : choice === 'restart' ? 'Your accepted steps will be cleared. The puzzle stays the same, and your misses and route hint stay recorded.'
              : `This ends the round without a completion.${state.mode === 'daily' ? ' It also ends your current daily streak.' : ''} The supplied route will be shown.`}</DialogDescription>
          <button type="button" autoFocus className="btn3d btn3d-soft h-12" onClick={() => setConfirmation(null)}>Keep playing</button>
          <button type="button" className="btn3d btn3d-accent h-12" onClick={confirm}>{choice === 'hint' ? 'Show route and mark assisted' : choice === 'restart' ? 'Restart this ladder' : 'Reveal and finish'}</button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
