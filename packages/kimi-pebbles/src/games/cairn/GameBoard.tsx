import { useEffect, useRef, useState } from 'react'
import { Delete, Flag, Lightbulb, Shuffle } from 'lucide-react'
import { LEVELS, MAX_HINTS_PER_LEVEL, addedLetter, type LevelResult } from './engine'
import type { GameState } from './useGame'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CairnTower } from './CairnTower'
import { isNativeEnter } from '../shared/keyboard'

interface Props {
  state: GameState
  actions: {
    tapRack: (i: number) => void
    tapSlot: (pos: number) => void
    del: () => void
    shuffle: () => void
    submit: () => void
    hint: () => void
    giveUp: () => void
  }
}

function Pebble({ result, current }: { result?: LevelResult; current: boolean }) {
  return (
    <div
      className={cn(
                'h-3.5 w-7 rounded-full transition-colors duration-200',
        current && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      )}
      style={{
        border: result?.status === 'skipped' ? '1px dashed #71889f' : undefined,
        background: result
          ? result.status === 'clean'
            ? '#315dc2'
            : result.status === 'messy'
              ? '#368786'
              : 'transparent'
          : '#dce5ef',
      }}
    />
  )
}

export function GameBoard({ state, actions }: Props) {
  const { phase, puzzle, level, rack, slots, misses, hints, results, shaking, solvedFlash, newLetterIdx, droppingIdx } =
    state
  const [confirmation, setConfirmation] = useState<{kind:'hint'|'skip'; key:string; puzzle:typeof puzzle}|null>(null)
  const [lastKind, setLastKind] = useState<'hint'|'skip'>('hint')
  const confirmationKind = confirmation?.kind ?? lastKind
  const confirmed = useRef(false)
  const identity = `${state.mode}:${state.dayNumber}:${state.puzzleNo}:${level}`
  const confirmationValid = confirmation?.key === identity && confirmation.puzzle === puzzle && phase === 'playing'
  useEffect(() => { setConfirmation(null) }, [identity, puzzle, phase])
  const request = (kind:'hint'|'skip') => { confirmed.current = false; setLastKind(kind); setConfirmation({kind,key:identity,puzzle}) }
  const confirm = () => {
    if (!confirmationValid || confirmed.current) return
    confirmed.current = true
    setConfirmation(null)
    if (confirmation?.kind === 'hint') actions.hint()
    else actions.giveUp()
  }

  /* physical keyboard support */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isNativeEnter(e)) return
      if (e.key === 'Enter') {
        e.preventDefault()
        actions.submit()
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        actions.del()
        return
      }
      const ch = e.key.toLowerCase()
      if (/^[a-z]$/.test(ch)) {
        const st = state
        const idx = st.rack.findIndex((c, i) => c === ch && !st.slots.includes(i))
        if (idx >= 0) actions.tapRack(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rack, state.slots, state.phase, actions])

  if (!puzzle) return null
  const word = puzzle.words[level]
  const maxHints = Math.min(MAX_HINTS_PER_LEVEL, word.length - 2)
  const usedInSlots = slots.filter((x): x is number => x !== null)
  const locked = phase !== 'playing'

  return (
    <div className="kimi-board cairn-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      {/* progress row */}
      <div className="cairn-progress mt-4 flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="img" aria-label={`Level ${level + 1} of ${LEVELS}. ${results.map((r,i) => `Level ${i+1}: ${r.status==='clean'?'clean':r.status==='messy'?'assisted':'shown'}`).join('. ')}`}>
          {Array.from({ length: LEVELS }).map((_, i) => (
            <Pebble key={i} result={results[i]} current={i === level && !state.finished} />
          ))}
        </div>
        <CairnTower results={results} totalLevels={LEVELS} finished={state.finished} animateLast compact />
        <div className="w-16 text-right text-xs font-bold text-muted-foreground">
          {misses > 0 ? `${misses} miss${misses === 1 ? '' : 'es'}` : '\u00A0'}
        </div>
      </div>

      {/* level label */}
      <div className="cairn-level mt-3 font-display text-lg font-bold text-foreground/80">
        Level {level + 1} · {word.length} letters
      </div>
      {level > 0 && results[level - 1] && !state.finished && <div className="cairn-added">
        <span>Previous <strong>{results[level - 1].word.toUpperCase()}</strong></span>
        <span className="cairn-added-letter">+ {addedLetter(puzzle.words[level - 1], word)?.toUpperCase()}</span>
        <span>Rearrange them all</span>
      </div>}
      {!state.finished && <p id="cairn-instructions" className="mt-1 max-w-sm text-center text-sm font-semibold text-muted-foreground">
        Tap the rack to use all {word.length} letters. Tap a placed letter to remove it.
        <span className="block text-xs" role="status">{usedInSlots.length} of {word.length} placed</span>
      </p>}
      {hints > 0 && !state.finished && <p className="mt-1 text-sm font-bold text-muted-foreground">Saved hint: one answer starts with {word.slice(0, hints).toUpperCase()}.</p>}

      {/* slots */}
      <div
        className={cn('cairn-slots mt-2 flex items-center justify-center gap-1 sm:gap-2', shaking && 'anim-shake')}
        aria-live="polite"
      >
        {slots.map((rackIdx, pos) =>
          rackIdx === null ? (
            <div key={pos} className="slot-empty" role="img" aria-label={`Position ${pos + 1}: empty`} />
          ) : (
            <button
              key={pos}
              type="button"
              onClick={() => actions.tapSlot(pos)}
              disabled={locked}
              className={cn('tile3d anim-pop', solvedFlash ? 'tile-ok' : 'tile-slot')}
              aria-label={`Remove letter ${rack[rackIdx]} from position ${pos + 1}`}
            >
              {rack[rackIdx]}
            </button>
          ),
        )}
      </div>

      {/* hint strip */}
      {hints > 0 && (
        <div className="mt-3 flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          <span className="font-display tracking-widest">
            {word
              .split('')
              .map((c, i) => (i < hints ? c.toUpperCase() : '·'))
              .join(' ')}
          </span>
        </div>
      )}

      {/* rack */}
      <div className="cairn-rack mt-6 flex flex-wrap items-center justify-center gap-1 sm:gap-2" aria-label="Letter rack" aria-describedby={!state.finished ? 'cairn-instructions' : undefined}>
        {rack.map((ch, i) => {
          const used = usedInSlots.includes(i)
          const isNew = i === newLetterIdx
          return (
            <button
              key={`${i}-${ch}`}
              type="button"
              onClick={() => actions.tapRack(i)}
              disabled={used || locked}
              className={cn(
                'tile3d',
                isNew && 'tile-new',
                isNew && i === droppingIdx && 'anim-drop',
                isNew && !used && phase === 'playing' && 'anim-pulse-ring',
                used && 'pointer-events-none opacity-25',
              )}
              aria-label={`Letter ${ch}${isNew ? ', new this level' : ''}`}
            >
              {ch}
            </button>
          )
        })}
      </div>

      {/* action bar */}
      <div className="mt-6 flex w-full max-w-md items-stretch gap-2">
        <button
          type="button"
          onClick={actions.shuffle}
          disabled={locked}
          className="btn3d btn3d-soft h-13 w-14 shrink-0"
          aria-label="Shuffle letters"
        >
          <Shuffle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={actions.submit}
          disabled={locked}
          className="btn3d btn3d-accent h-13 flex-1 text-lg tracking-widest"
        >
          ENTER
        </button>
        <button
          type="button"
          onClick={actions.del}
          disabled={locked}
          className="btn3d btn3d-soft h-13 w-14 shrink-0"
          aria-label="Delete last letter"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {/* secondary actions */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => request('hint')}
          disabled={locked || hints >= maxHints}
          className="btn3d btn3d-soft h-11 px-4 text-sm"
        >
          <Lightbulb className="h-4 w-4" />
          Hint · {maxHints - hints} left
        </button>
        <button
          type="button"
          onClick={() => request('skip')}
          disabled={locked}
          className="btn3d btn3d-soft h-11 px-4 text-sm"
        >
          <Flag className="h-4 w-4" />
          Skip level
        </button>
      </div>

      {/* legend */}
      <div className="cairn-legend mt-6 mb-8 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
        <span><i data-kind="clean"/> Clean</span>
        <span><i data-kind="messy"/> Assisted</span>
        <span><i data-kind="skipped"/> Shown</span>
      </div>
      <Dialog open={Boolean(confirmationValid)} onOpenChange={open => { if (!open) setConfirmation(null) }}>
        <DialogContent className="cairn-confirm max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{confirmationKind === 'hint' ? 'Use a nudge?' : 'Show and skip this level?'}</DialogTitle>
            <DialogDescription>{confirmationKind === 'hint'
              ? 'Reveal the next letter of one answer. This level will count as assisted, so this round cannot be Perfect. You can still reach the summit.'
              : `The word will be shown and this level will not count as solved.${state.mode === 'daily' ? ' This daily round will not earn a summit and will end your current streak.' : ' This practice round will not earn a summit.'}`}</DialogDescription>
          </DialogHeader>
          <button type="button" autoFocus className="btn3d btn3d-soft h-12" onClick={() => setConfirmation(null)}>Keep trying</button>
          <button type="button" className="btn3d btn3d-accent h-12" onClick={confirm}>{confirmationKind === 'hint' ? 'Use nudge' : 'Show and skip'}</button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
