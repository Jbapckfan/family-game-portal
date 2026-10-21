import { Lightbulb, Shuffle, X } from 'lucide-react'
import { MAX_MISSES } from './engine'
import type { Tile } from './useQuartet'
import { isPremium } from '../shared/premium'
import { cn } from '@/lib/utils'

type Actions = {
  toggleTile: (pos: number) => void
  deselectAll: () => void
  shuffleBoard: () => void
  submit: () => void
  hint: () => void
}

interface Props {
  state: {
    phase: string
    puzzle: { groups: { label: string; tier: number; members: string[] }[] } | null
    tiles: (Tile | null)[]
    selected: number[]
    solvedGroups: number[]
    misses: number
    hintPair: [string, string] | null
    hintsUsed: number
    finished: boolean
    won: boolean
    shaking: boolean
  }
  actions: Actions
}

function GroupBanner({ label, members, tier }: { label: string; members: string[]; tier: number }) {
  const face = ['#887221', '#427357', '#3f7192', '#78578d'][tier] ?? '#78578d'
  return (
    <div
      className="quartet-solved anim-pop flex w-full flex-col items-center rounded-2xl px-3 py-2.5 text-white"
      style={{ background: face }}
    >
      <span className="font-display text-sm font-extrabold uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold uppercase tracking-wider opacity-90">{members.join(' · ')}</span>
    </div>
  )
}

export function QuartetBoard({ state, actions }: Props) {
  const puzzle = state.puzzle
  if (!puzzle) return null

  const unsolved = puzzle.groups
    .map((g, gi) => ({ ...g, gi }))
    .filter((g) => !state.solvedGroups.includes(g.gi))
    .sort((a, b) => a.tier - b.tier)

  return (
    <div className="kimi-board quartet-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      <div className="mt-4 flex w-full items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          Groups <span className="font-display text-lg text-foreground">{state.solvedGroups.length}/4</span>
        </span>
        <span aria-label={`${MAX_MISSES - state.misses} mistakes left`}>
          Mistakes:{' '}
          {Array.from({ length: MAX_MISSES }).map((_, i) => (
            <span
              key={i}
              className={cn('ml-0.5 inline-block h-2.5 w-2.5 rounded-full', i < MAX_MISSES - state.misses ? 'bg-foreground/70' : 'bg-foreground/20')}
            />
          ))}
        </span>
      </div>

      {/* solved banners */}
      <div className="mt-3 flex w-full flex-col gap-1.5">
        {state.solvedGroups.map((gi) => (
          <GroupBanner key={gi} label={puzzle.groups[gi].label} members={puzzle.groups[gi].members} tier={puzzle.groups[gi].tier} />
        ))}
        {state.finished && !state.won &&
          unsolved.map((g) => <GroupBanner key={g.gi} label={g.label} members={g.members} tier={g.tier} />)}
      </div>

      {/* grid */}
      {state.tiles.some((t) => t !== null) && (
        <div className={cn('quartet-cabinet mt-4 grid w-full grid-cols-4 gap-1.5', state.shaking && 'anim-shake')} aria-live="polite">
          {state.tiles.map((t, i) => {
            if (!t) return <span key={i} />
            const sel = state.selected.includes(i)
            const hinted = state.hintPair?.includes(t.word) ?? false
            return (
              <button
                key={i}
                type="button"
                data-tile={i}
                data-long-word={t.word.length >= 10 || undefined}
                aria-pressed={sel}
                aria-label={`Word ${t.word}${sel ? ', selected' : ''}`}
                onClick={() => actions.toggleTile(i)}
                className={cn(
                  'quartet-card tile3d h-16 w-full px-0.5 text-[13px] leading-tight font-extrabold break-words sm:text-[15px]',
                  sel && 'tile-slot scale-[1.04]',
                  hinted && 'animate-pulse',
                )}
              >
                {t.word.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      {/* controls */}
      {!state.finished && (
        <>
          <div className="mt-5 flex w-full max-w-md items-stretch justify-center gap-2">
            <button type="button" onClick={actions.shuffleBoard} className="btn3d btn3d-soft h-12 flex-1 text-sm">
              <Shuffle className="mx-auto h-4 w-4" />
              Shuffle
            </button>
            <button
              type="button"
              onClick={actions.deselectAll}
              disabled={state.selected.length === 0}
              className="btn3d btn3d-soft h-12 flex-1 text-sm disabled:opacity-50"
            >
              <X className="mx-auto h-4 w-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={actions.submit}
              disabled={state.selected.length !== 4}
              className="btn3d btn3d-accent h-12 flex-1 text-sm disabled:opacity-50"
            >
              Submit {state.selected.length}/4
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center">
            <button type="button" onClick={actions.hint} className="btn3d btn3d-soft h-11 px-4 text-sm">
              <Lightbulb className="h-4 w-4" />
              {isPremium() ? 'Pair glow · ∞' : state.hintsUsed === 0 ? 'Pair glow · 1 free' : 'Pair glow · used'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
