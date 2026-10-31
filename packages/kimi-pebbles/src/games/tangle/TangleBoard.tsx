import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Check, Lightbulb, RotateCcw } from 'lucide-react'
import { TIER_META, isAdjacent, tierFor } from './engine'
import type { TangleState } from './useTangle'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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
  const size = puzzle?.g.length === 25 ? 5 : 4
  const dragging = useRef(false)
  const moved = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef(path)
  pathRef.current = path
  const current = useRef(state)
  current.current = state
  const gesture = useRef<{id:number; key:string; puzzle:typeof puzzle; found:string[]}|null>(null)
  const identity = `${state.mode}:${state.dayNumber}:${state.puzzleNo}`
  const [clueApproval,setClueApproval] = useState<{key:string; puzzle:typeof puzzle; found:string[]}|null>(null)
  const clueConsumed = useRef(false)
  const clueOpen = clueApproval?.key === identity && clueApproval.puzzle === puzzle && clueApproval.found === found && hintsUsed === 0 && state.phase === 'playing'
  useEffect(() => { setClueApproval(null) }, [identity,puzzle,found,hintsUsed,state.phase])
  const requestClue = () => { clueConsumed.current = false; setClueApproval({key:identity,puzzle,found}) }
  const confirmClue = () => {
    if (!clueOpen || clueConsumed.current) return
    clueConsumed.current = true
    setClueApproval(null)
    actions.hint()
  }
  const gestureIsCurrent = useCallback(() => {
    const active = gesture.current, now = current.current
    return Boolean(active && active.key === `${now.mode}:${now.dayNumber}:${now.puzzleNo}` && active.puzzle === now.puzzle && active.found === now.found && now.phase === 'playing')
  }, [])
  const endGesture = useCallback(() => {
    const active = gesture.current
    gesture.current = null
    dragging.current = false
    moved.current = false
    try { if (active && containerRef.current?.hasPointerCapture?.(active.id)) containerRef.current.releasePointerCapture(active.id) } catch { /* capture may already be released */ }
  }, [])
  useEffect(() => { endGesture() }, [identity,puzzle,found,state.phase,endGesture])
  useEffect(() => {
    const cancel = () => endGesture()
    window.addEventListener('blur',cancel)
    return () => { window.removeEventListener('blur',cancel); endGesture() }
  }, [endGesture])

  const cellAt = useCallback((x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]')
    if (!el || !containerRef.current?.contains(el)) return null
    const idx = Number((el as HTMLElement).dataset.cell)
    return Number.isInteger(idx) && idx >= 0 && idx < size*size ? idx : null
  }, [size])

  const selectCell = useCallback(
    (i: number) => {
      if (!puzzle) return
      const p = pathRef.current
      const last = p[p.length - 1]
      if (p.length === 0) {
        flushSync(() => actions.setPath([i]))
      } else if (i === last) {
        if (p.length >= 3) {
          dragging.current = false
          actions.submitPath()
          return
        }
      } else if (p.includes(i)) {
        flushSync(() => actions.setPath(p.slice(0, p.indexOf(i) + 1)))
      } else if (isAdjacent(last, i, size)) {
        flushSync(() => actions.setPath([...p, i]))
      } else {
        flushSync(() => actions.setPath([i]))
      }
    },
    [actions, puzzle, size],
  )

  const handleDown = useCallback((e: React.PointerEvent, i: number) => {
    if (gesture.current || e.button !== 0 || e.isPrimary === false || current.current.phase !== 'playing') return
    e.preventDefault()
    const now = current.current
    gesture.current = {id:e.pointerId,key:`${now.mode}:${now.dayNumber}:${now.puzzleNo}`,puzzle:now.puzzle,found:now.found}
    dragging.current = true
    moved.current = false
    try { containerRef.current?.setPointerCapture?.(e.pointerId) } catch { /* synthetic pointer */ }
    selectCell(i)
    if (!dragging.current) endGesture()
  }, [selectCell,endGesture])

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || e.pointerId !== gesture.current?.id || e.buttons === 0) return
    if (!gestureIsCurrent()) { endGesture(); return }
    const i = cellAt(e.clientX,e.clientY)
    if (i === null) return
    const p = pathRef.current, last = p[p.length-1]
    if (i === last || p.length === 0) return
    if (p.length >= 2 && i === p[p.length-2]) { moved.current = true; flushSync(() => actions.setPath(p.slice(0,-1))); return }
    if (!p.includes(i) && isAdjacent(last,i,size)) { moved.current = true; flushSync(() => actions.setPath([...p,i])) }
  }, [actions,cellAt,gestureIsCurrent,endGesture,size])

  const handleUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || e.pointerId !== gesture.current?.id) return
    const submit = gestureIsCurrent() && moved.current && pathRef.current.length >= 3 && cellAt(e.clientX,e.clientY) !== null
    endGesture()
    if (submit) actions.submitPath()
  }, [actions,cellAt,gestureIsCurrent,endGesture])

  const handleCancel = useCallback((e: React.PointerEvent) => {
    if (gesture.current && e.pointerId !== gesture.current.id) return
    endGesture()
  }, [endGesture])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
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
  const goldGoal = puzzle.targets[2]
  const canClue = hintsUsed === 0 && puzzle.words.some(w => w.length >= 4 && !found.includes(w))
  const clueHasUnfoundWord = state.hintPrefix && puzzle.words.some(w => w.length >= 4 && w.startsWith(state.hintPrefix!) && !found.includes(w))
  const alreadyFound = word.length >= 3 && found.includes(word)

  const points = path
    .map((i) => {
      const r = Math.floor(i / size)
      const c = i % size
      return `${(c + 0.5) * 100/size},${(r + 0.5) * 100/size}`
    })
    .join(' ')

  return (
    <div data-board-size={size} className="kimi-board tangle-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      {/* score row */}
      <div className="tangle-score-row mt-4 flex w-full items-end justify-between">
        <div>
          <span className="font-display text-3xl font-extrabold">{score}</span>
          <span className="text-sm font-bold text-muted-foreground"> points</span>
        </div>
        <div className="tangle-medal text-sm font-bold">
          {TIER_META[tier].label}
        </div>
        <div className="text-sm font-bold text-muted-foreground">
          {found.length}/{puzzle.n} words
        </div>
      </div>

      {/* progress bar with tier ticks */}
      <p className="tangle-score-detail">{score >= goldGoal ? `Gold reached · keep hunting. ${puzzle.max} points available.` : `${Math.max(0,goldGoal-score)} more points to Gold · ${puzzle.max} available`}</p>
      <div className="tangle-growth relative mt-2 h-4 w-full rounded-full bg-secondary" role="progressbar" aria-label="Progress to Gold" aria-valuemin={0} aria-valuemax={goldGoal} aria-valuenow={Math.min(score,goldGoal)} aria-valuetext={`${score} points; Gold goal ${goldGoal}. ${puzzle.max} points available.`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (score / goldGoal) * 100)}%`,
            background: 'var(--identity)',
          }}
        />
        {puzzle.targets.map((t, i) => (
          <div
            key={i}
            className="absolute -top-1 h-6 w-1 rounded-full bg-foreground/30"
            style={{ left: `${(t / goldGoal) * 100}%` }}
            title={`${TIER_META[i + 1].label}: ${t} pts`}
          />
        ))}
      </div>
      <div className="tangle-thresholds mt-1 flex w-full justify-between text-xs font-semibold text-muted-foreground">
        <span>Bronze {puzzle.targets[0]}</span>
        <span>Silver {puzzle.targets[1]}</span>
        <span>Gold {goldGoal}</span>
      </div>

      {/* current word + controls */}
      <div className="tangle-selection mt-3 flex min-h-14 items-center justify-center gap-2">
        {word ? (
          <>
            <span
              className={cn(
                'font-display text-2xl font-extrabold uppercase tracking-[0.2em]',
                alreadyFound ? 'text-muted-foreground line-through' : 'tangle-current-word',
              )}
              aria-live="polite"
            >
              {word}
            </span>
            <button
              type="button"
              onClick={actions.submitPath}
              className="btn3d btn3d-accent h-11 px-3"
              aria-label="Submit word"
            >
              <Check className="h-4 w-4" />Check
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
            Drag a word and release on a letter to check.
            <span className="block">Or tap letters, then Check.</span>
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
        onLostPointerCapture={handleCancel}
        onContextMenu={(event) => event.preventDefault()}
      >
        <svg
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
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
        <div className="tangle-letter-grid relative z-10 grid gap-2" style={{gridTemplateColumns:`repeat(${size}, minmax(0, 1fr))`}}>
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
                onClick={(e) => { if (e.detail === 0) selectCell(i) }}
                className={cn(
                  'tile3d aspect-square h-auto w-full text-2xl sm:text-3xl',
                  isSel && 'tile-slot',
                  isSel && isLast && 'tile-new',
                )}
                aria-label={`Letter ${ch}, row ${Math.floor(i / size) + 1}, column ${i % size + 1}${isSel ? `, selected ${sel + 1}` : ''}`}
              >
                {ch}
                {isSel && <span data-path-order className="absolute bottom-1 right-2 text-[10px] font-bold leading-none" aria-hidden="true">{sel + 1}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {state.hintPrefix && <p data-tangle-clue className="mt-3 max-w-sm text-center text-sm font-bold text-muted-foreground">
        {clueHasUnfoundWord ? `${size === 5 ? 'Clue' : 'Saved clue'}: a word starts with ` : 'Clue found: '}<span className="font-display text-foreground">{state.hintPrefix.toUpperCase()}</span>.
      </p>}

      {/* hint */}
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={requestClue} disabled={!canClue} className="btn3d btn3d-soft h-11 px-4 text-sm">
          <Lightbulb className="h-4 w-4" />
          {hintsUsed > 0 ? 'Clue used' : canClue ? 'Clue · 1 available' : 'No clues left'}
        </button>
        <span className="text-xs text-muted-foreground">{misses} {misses === 1 ? 'miss' : 'misses'}</span>
      </div>

      {/* found words */}
      <div className="tangle-found mt-4 w-full max-w-md">
        <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Found ({found.length})
        </div>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pb-8">
          {found.length === 0 && <span className="text-sm font-semibold text-muted-foreground">Your words will appear here.</span>}
          {found.map((w) => (
            <span
              key={w}
              className="anim-pop rounded-full bg-secondary px-3 py-1 tangle-found-word text-sm font-bold uppercase tracking-wider"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
      <Dialog open={Boolean(clueOpen)} onOpenChange={open => { if (!open) setClueApproval(null) }}>
        <DialogContent className="tangle-confirm max-w-sm rounded-3xl">
          <DialogTitle>Use your clue?</DialogTitle>
          <DialogDescription>Show the first two letters of an unfound word with at least four letters. There is one clue per round, and using it is recorded on your result. Your score is unchanged.</DialogDescription>
          <button type="button" autoFocus className="btn3d btn3d-soft h-12" onClick={() => setClueApproval(null)}>Keep hunting</button>
          <button type="button" className="btn3d btn3d-accent h-12" onClick={confirmClue}>Use my clue</button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
