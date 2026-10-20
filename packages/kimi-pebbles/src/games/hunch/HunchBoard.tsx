import { useEffect, useMemo } from 'react'
import { Delete, Lightbulb } from 'lucide-react'
import { MAX_GUESSES, WORD_LEN, type Eval } from './engine'
import { isPremium } from '../shared/premium'
import { cn } from '@/lib/utils'

type Actions = {
  keyLetter: (ch: string) => void
  backspace: () => void
  submit: () => void
  hint: () => void
}

interface Props {
  state: {
    phase: string
    answer: string
    guesses: string[]
    evals: Eval[][]
    current: string
    hintLetters: string[]
    hintsUsed: number
    finished: boolean
    won: boolean
    shaking: boolean
  }
  actions: Actions
}

const EVAL_CLASS: Record<Eval, string> = {
  correct: 'tile-ok',
  present: 'tile-gold',
  absent: 'tile-dim',
}

const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export function HunchBoard({ state, actions }: Props) {
  /* physical keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        actions.submit()
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        actions.backspace()
        return
      }
      const ch = e.key.toLowerCase()
      if (/^[a-z]$/.test(ch)) actions.keyLetter(ch)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions])

  /* best-known state per key */
  const keyState = useMemo(() => {
    const rank = { absent: 0, present: 1, correct: 2 }
    const map = new Map<string, Eval>()
    state.guesses.forEach((g, r) => {
      g.split('').forEach((ch, i) => {
        const ev = state.evals[r][i]
        const cur = map.get(ch)
        if (!cur || rank[ev] > rank[cur]) map.set(ch, ev)
      })
    })
    return map
  }, [state.guesses, state.evals])

  const rows: (string | null)[] = [...state.guesses]
  if (!state.finished) rows.push(state.current)
  while (rows.length < MAX_GUESSES) rows.push(null)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-3">
      <div className="mt-4 text-sm font-bold text-muted-foreground">
        Guess {Math.min(state.guesses.length + (state.finished ? 0 : 1), MAX_GUESSES)} of {MAX_GUESSES}
        {state.hintLetters.length > 0 && (
          <span className="ml-2">
            · revealed:{' '}
            <span className="font-display text-foreground">{state.hintLetters.join(', ').toUpperCase()}</span>
          </span>
        )}
      </div>

      {/* grid */}
      <div className={cn('mt-4 flex flex-col gap-1.5', state.shaking && 'anim-shake')} aria-live="polite">
        {rows.map((word, r) => (
          <div key={r} className="flex gap-1.5" aria-label={word ? `Guess ${r + 1}: ${word}` : `Row ${r + 1} empty`}>
            {Array.from({ length: WORD_LEN }).map((_, i) => {
              const ch = word?.[i] ?? ''
              const ev = r < state.evals.length ? state.evals[r][i] : null
              const isCurrent = r === state.guesses.length && !state.finished && word !== null
              return (
                <div
                  key={i}
                  className={cn(
                    'tile3d h-14 w-12 text-2xl sm:w-13',
                    ev ? EVAL_CLASS[ev] : isCurrent && ch ? 'tile-slot' : '',
                    !ev && !(isCurrent && ch) && 'opacity-60',
                    ev && 'anim-pop',
                  )}
                  style={ev ? { animationDelay: `${i * 90}ms` } : undefined}
                >
                  {ch}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* revealed answer on loss */}
      {state.finished && !state.won && (
        <div className="mt-4 rounded-2xl bg-secondary px-4 py-2 font-display text-lg font-extrabold uppercase tracking-widest">
          The word was <span className="text-primary">{state.answer}</span>
        </div>
      )}

      {/* keyboard */}
      {!state.finished && (
        <div className="mt-6 flex w-full max-w-md flex-col items-center gap-1.5">
          {KB_ROWS.map((row, ri) => (
            <div key={ri} className="flex w-full justify-center gap-1">
              {ri === 2 && (
                <button
                  type="button"
                  onClick={actions.submit}
                  className="btn3d btn3d-accent h-12 flex-1 px-1 text-xs sm:text-sm"
                >
                  Enter
                </button>
              )}
              {row.split('').map((ch) => {
                const st = keyState.get(ch)
                return (
                  <button
                    key={ch}
                    type="button"
                    aria-label={`Letter ${ch}`}
                    onClick={() => actions.keyLetter(ch)}
                    className={cn(
                      'tile3d h-12 min-w-0 flex-1 text-lg sm:text-xl',
                      st === 'correct' ? 'tile-ok' : st === 'present' ? 'tile-gold' : st === 'absent' ? 'tile-dim' : '',
                    )}
                  >
                    {ch}
                  </button>
                )
              })}
              {ri === 2 && (
                <button
                  type="button"
                  aria-label="Delete letter"
                  onClick={actions.backspace}
                  className="btn3d btn3d-soft h-12 flex-1 px-1"
                >
                  <Delete className="mx-auto h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={actions.hint}
            disabled={!isPremium() && state.hintsUsed >= 1}
            className="btn3d btn3d-soft mt-3 h-11 px-4 text-sm"
            aria-label="Reveal a letter"
          >
            <Lightbulb className="h-4 w-4" />
            {isPremium() ? 'Reveal a letter' : state.hintsUsed === 0 ? 'Reveal a letter · 1 hint' : 'Letter hint used'}
          </button>
        </div>
      )}
    </div>
  )
}
