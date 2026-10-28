import { useCallback, useEffect, useRef } from 'react'
import { Check, Lightbulb, RotateCcw } from 'lucide-react'
import { TIER_META, isAdjacent, tierFor } from './engine'
import type { TangleState } from './useTangle'
import { isPremium } from '../shared/premium'
import { cn } from '@/lib/utils'
import { isNativeEnter } from '../shared/keyboard'

interface Props {
  state: TangleState
  actions: {
    setPath: (path: number[]) => void
    submitPath: () => void
    clearPath: () => void
    hint: () => void
  }
}

export function TangleBoard({ state, actions }: Props) {
  const { puzzle, path, found, score, misses, hintsUsed, shaking } = state
  const dragging = useRef(false)
  const moved = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef(path)
  pathRef.current = path

  const cellAt = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]')
    if (!el) return null
    const idx = Number((el as HTMLElement).dataset.cell)
    return Number.isInteger(idx) ? idx : null
  }, [])

  const selectCell = useCallback(
    (i: number) => {
      if (!puzzle) return
      const p = pathRef.current
      const last = p[p.length - 1]
      if (p.length === 0) {
        actions.setPath([i])
      } else if (i === last) {
        if (p.length >= 3) {
          dragging.current = false
          actions.submitPath()
          return
        }
      } else if (p.includes(i)) {
        actions.setPath(p.slice(0, p.indexOf(i) + 1))
      } else if (isAdjacent(last, i)) {
        actions.setPath([...p, i])
      } else {
        actions.setPath([i])
      }
    },
    [actions, puzzle],
  )

  const handleDown = useCallback((e: React.PointerEvent, i: number) => {
    e.preventDefault()
    dragging.current = true
    moved.current = false
    try {
      containerRef.current?.setPointerCapture?.(e.pointerId)
    } catch {
      // synthetic or already-released pointers have no capture target
    }
    selectCell(i)
  }, [selectCell])

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || e.buttons === 0) return
      const i = cellAt(e.clientX, e.clientY)
      if (i === null) return
      const p = pathRef.current
      const last = p[p.length - 1]
      if (i === last || p.length === 0) return
      if (p.length >= 2 && i === p[p.length - 2]) {
        moved.current = true
        actions.setPath(p.slice(0, -1))
        return
      }
      if (!p.includes(i) && isAdjacent(last, i)) {
        moved.current = true
        actions.setPath([...p, i])
      }
    },
    [actions, cellAt],
  )

  const handleUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (moved.current && pathRef.current.length >= 3) {
      actions.submitPath()
    }
    moved.current = false
  }, [actions])

  const handleCancel = useCallback(() => {
    dragging.current = false
    moved.current = false
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      if (isNativeEnter(e)) return
      if (e.key === 'Enter') {
        e.preventDefault()
        actions.submitPath()
      }
      if (e.key === 'Escape') actions.clearPath()
      if (e.key === 'Backspace') {
        e.preventDefault()
        actions.setPath(pathRef.current.slice(0, -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions])

  if (!puzzle) return null
  const grid = puzzle.g
  const word = path.map((i) => grid[i]).join('')
  const tier = tierFor(score, puzzle.targets)
  const alreadyFound = word.length >= 3 && found.includes(word)

  const points = path
    .map((i) => {
      const r = Math.floor(i / 4)
      const c = i % 4
      return `${(c + 0.5) * 25},${(r + 0.5) * 25}`
    })
    .join(' ')

  return (
    <div className="kimi-board tangle-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      {/* score row */}
      <div className="mt-4 flex w-full items-end justify-between">
        <div>
          <span className="font-display text-3xl font-extrabold">{score}</span>
          <span className="text-sm font-bold text-muted-foreground"> / {puzzle.max} pts</span>
        </div>
        <div className="text-sm font-bold" style={{ color: TIER_META[tier].color }}>
          {TIER_META[tier].icon} {TIER_META[tier].label}
        </div>
        <div className="text-sm font-bold text-muted-foreground">
          {found.length}/{puzzle.n} words
        </div>
      </div>

      {/* progress bar with tier ticks */}
      <div className="tangle-growth relative mt-2 h-4 w-full rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (score / puzzle.max) * 100)}%`,
            background: 'var(--identity)',
          }}
        />
        {puzzle.targets.map((t, i) => (
          <div
            key={i}
            className="absolute -top-1 h-6 w-1 rounded-full bg-foreground/30"
            style={{ left: `${(t / puzzle.max) * 100}%` }}
            title={`${TIER_META[i + 1].label}: ${t} pts`}
          />
        ))}
      </div>
      <div className="mt-1 flex w-full justify-between text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        <span>🥉 {puzzle.targets[0]}</span>
        <span>🥈 {puzzle.targets[1]}</span>
        <span>🥇 {puzzle.targets[2]}</span>
      </div>

      {/* current word + controls */}
      <div className="mt-3 flex h-10 items-center gap-2">
        {word ? (
          <>
            <span
              className={cn(
                'font-display text-2xl font-extrabold uppercase tracking-[0.2em]',
                alreadyFound ? 'text-muted-foreground line-through' : 'text-[hsl(20_85%_43%)]',
              )}
              aria-live="polite"
            >
              {word}
            </span>
            <button
              type="button"
              onClick={actions.submitPath}
              className="btn3d btn3d-accent h-10 w-11"
              aria-label="Submit word"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={actions.clearPath}
              className="btn3d btn3d-soft h-10 w-11"
              aria-label="Clear selection"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">
            Drag or tap across touching letters · {misses > 0 ? `${misses} misses` : 'find words!'}
          </span>
        )}
      </div>

      {/* grid */}
      <div
        ref={containerRef}
        className={cn('tangle-field relative mt-3 w-full max-w-95 select-none', shaking && 'anim-shake')}
        style={{ touchAction: 'none' }}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleCancel}
      >
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {path.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="var(--identity)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 14 }}
            />
          )}
        </svg>
        <div className="grid grid-cols-4 gap-2">
          {grid.split('').map((ch, i) => {
            const sel = path.indexOf(i)
            const isSel = sel >= 0
            const isLast = sel === path.length - 1
            return (
              <button
                key={i}
                type="button"
                data-cell={i}
                aria-pressed={isSel}
                onPointerDown={(e) => handleDown(e, i)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  e.stopPropagation()
                  selectCell(i)
                }}
                className={cn(
                  'tile3d aspect-square h-auto w-full text-2xl sm:text-3xl',
                  isSel && 'tile-slot',
                  isSel && isLast && 'tile-new',
                )}
                aria-label={`Letter ${ch}, row ${Math.floor(i / 4) + 1}, column ${i % 4 + 1}${isSel ? `, selected ${sel + 1}` : ''}`}
              >
                {ch}
                {isSel && <span data-path-order className="absolute bottom-1 right-2 text-[10px] font-bold leading-none" aria-hidden="true">{sel + 1}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {state.hintPrefix && <p data-tangle-clue className="mt-3 max-w-sm text-center text-sm font-bold text-muted-foreground">
        Saved clue: a word starts with <span className="font-display text-foreground">{state.hintPrefix.toUpperCase()}</span>.
      </p>}

      {/* hint */}
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={actions.hint} className="btn3d btn3d-soft h-11 px-4 text-sm">
          <Lightbulb className="h-4 w-4" />
          {isPremium() ? 'Hint · ∞' : hintsUsed === 0 ? 'Hint · 1 free' : 'Hint · used'}
        </button>
      </div>

      {/* found words */}
      <div className="tangle-found mt-4 w-full max-w-md">
        <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Found ({found.length})
        </div>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pb-8">
          {found.length === 0 && <span className="text-sm font-semibold text-muted-foreground">Nothing yet — go hunt!</span>}
          {found.map((w) => (
            <span
              key={w}
              className="anim-pop rounded-full bg-secondary px-3 py-1 font-display text-sm font-bold uppercase tracking-wider"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
