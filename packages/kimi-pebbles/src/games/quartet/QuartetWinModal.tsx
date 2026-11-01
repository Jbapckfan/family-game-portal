import { quartetLabel } from './labels'
import { useMemo, useState } from 'react'
import { Check, Copy, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { buildQuartetShare, TIER_STYLE, type QuartetPuzzle } from './engine'
import { useCountdown, copyText } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  puzzle: QuartetPuzzle
  puzzleNo: number
  history: number[][]
  hintsUsed: number
  misses: number
  won: boolean
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function QuartetWinModal(props: Props) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(props.open && props.mode === 'daily')

  const shareText = useMemo(
    () => buildQuartetShare(props.puzzleNo, props.history, props.won, props.hintsUsed),
    [props.puzzleNo, props.history, props.won, props.hintsUsed],
  )

  const copy = async () => {
    await copyText(shareText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const flawless = props.won && props.misses === 0 && props.hintsUsed === 0

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">
            {props.won ? (flawless ? 'All four, no misses!' : 'All four found!') : 'Grid revealed'}
          </DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-sm font-semibold">{props.misses} of 4 misses · {props.hintsUsed} pair hint{props.hintsUsed === 1 ? '' : 's'}</p>
          {/* Numeric tier history keeps results distinguishable without color. */}
          {props.history.length > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-4" aria-hidden="true">
              {props.history.map((row, r) => (
                <div key={r} className="flex gap-1">
                  {row.map((t, i) => (
                    <span key={i} className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white" style={{ background: TIER_STYLE[t].face }}>{t}</span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex w-full flex-col gap-1.5">
            {props.puzzle.groups.map((g, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center text-sm font-bold text-white"
                style={{ background: TIER_STYLE[g.tier].face }}
              >
                <span className="font-display uppercase tracking-wider">{g.tier} · {quartetLabel(g.label)}</span>
                <span className="text-xs opacity-90">{g.members.join(' · ')}</span>
              </div>
            ))}
          </div>

          {props.mode === 'daily' ? (
            <>
              <button type="button" onClick={copy} className="btn3d btn3d-accent h-12 w-full text-base">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next grid in</div>
                <div className="font-display text-2xl font-extrabold tabular-nums">{countdown}</div>
              </div>
              <button type="button" onClick={props.onPractice} className="btn3d btn3d-soft h-11 px-4 text-sm">
                <InfinityIcon className="h-4 w-4" />
                Practice while you wait
              </button>
            </>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <button type="button" onClick={props.onNewPractice} className="btn3d btn3d-accent h-12 w-full text-base">
                <RotateCcw className="h-5 w-5" />
                New practice round
              </button>
              <button type="button" onClick={props.onBackToDaily} className="btn3d btn3d-soft h-11 px-4 text-sm">
                Back to today's puzzle
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
