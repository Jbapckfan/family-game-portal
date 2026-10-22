import { useEffect } from 'react'
import { Delete, Flag, Lightbulb, Shuffle } from 'lucide-react'
import { LEVELS, MAX_HINTS_PER_LEVEL, emojiFor, type LevelResult } from './engine'
import type { GameState } from './useGame'
import { isPremium } from '../shared/premium'
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
        background: result
          ? result.status === 'clean'
            ? 'hsl(145 55% 52%)'
            : result.status === 'messy'
              ? 'hsl(45 90% 55%)'
              : 'hsl(30 8% 62%)'
          : 'hsl(340 15% 84%)',
      }}
    />
  )
}

export function GameBoard({ state, actions }: Props) {
  const { phase, puzzle, level, rack, slots, misses, hints, results, shaking, solvedFlash, newLetterIdx, droppingIdx } =
    state

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
  const maxHints = isPremium() ? word.length - 2 : Math.min(MAX_HINTS_PER_LEVEL, word.length - 2)
  const usedInSlots = slots.filter((x): x is number => x !== null)
  const locked = phase !== 'playing'

  return (
    <div className="kimi-board cairn-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      {/* progress row */}
      <div className="cairn-progress mt-4 flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-label={`Level ${level + 1} of ${LEVELS}`}>
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
      {hints > 0 && !state.finished && <p className="mt-1 text-sm font-bold text-muted-foreground">Saved hint: one answer starts with {word.slice(0, hints).toUpperCase()}.</p>}

      {/* slots */}
      <div
        className={cn('cairn-slots mt-2 flex items-center justify-center gap-1 sm:gap-2', shaking && 'anim-shake')}
        aria-live="polite"
      >
        {slots.map((rackIdx, pos) =>
          rackIdx === null ? (
            <div key={pos} className="slot-empty" />
          ) : (
            <button
              key={pos}
              type="button"
              onClick={() => actions.tapSlot(pos)}
              disabled={locked}
              className={cn('tile3d anim-pop', solvedFlash ? 'tile-ok' : 'tile-slot')}
              aria-label={`Remove letter ${rack[rackIdx]}`}
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
      <div className="cairn-rack mt-6 flex flex-wrap items-center justify-center gap-1 sm:gap-2" aria-label="Letter rack">
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
          onClick={actions.hint}
          disabled={locked || hints >= maxHints}
          className="btn3d btn3d-soft h-11 px-4 text-sm"
        >
          <Lightbulb className="h-4 w-4" />
          Hint · {isPremium() ? '∞' : `${maxHints - hints} left`}
        </button>
        <button
          type="button"
          onClick={actions.giveUp}
          disabled={locked}
          className="btn3d btn3d-soft h-11 px-4 text-sm"
        >
          <Flag className="h-4 w-4" />
          Give up
        </button>
      </div>

      {/* legend */}
      <div className="mt-6 mb-8 flex items-center gap-3 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1">{emojiFor('clean')} flawless</span>
        <span className="flex items-center gap-1">{emojiFor('messy')} solved with help</span>
        <span className="flex items-center gap-1">{emojiFor('skipped')} gave up</span>
      </div>
    </div>
  )
}
