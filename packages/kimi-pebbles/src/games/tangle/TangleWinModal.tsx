import { useMemo, useState } from 'react'
import { Check, Copy, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TIER_META, buildTangleShare, tierFor, type TanglePuzzle } from './engine'
import { copyText, useCountdown } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  puzzle: TanglePuzzle
  puzzleNo: number
  found: string[]
  score: number
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function TangleWinModal(props: Props) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  const tier = tierFor(props.score, props.puzzle.targets)
  const bestFound = props.found.reduce((a, b) => (b.length > a.length ? b : a), '')

  const shareText = useMemo(
    () => buildTangleShare(props.puzzleNo, props.score, props.puzzle.max, props.found.length, props.puzzle.n, tier),
    [props.puzzleNo, props.score, props.puzzle.max, props.found.length, props.puzzle.n, tier],
  )

  const copy = async () => {
    await copyText(shareText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">
            {TIER_META[tier].icon} {tier === 3 ? 'Gold rush!' : `${TIER_META[tier].label}!`}
          </DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="grid w-full grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-secondary p-3">
              <div className="font-display text-2xl font-extrabold">{props.score}</div>
              <div className="text-xs font-bold text-muted-foreground">of {props.puzzle.max} pts</div>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <div className="font-display text-2xl font-extrabold">{props.found.length}</div>
              <div className="text-xs font-bold text-muted-foreground">of {props.puzzle.n} words</div>
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <div className="font-display text-2xl font-extrabold uppercase">{bestFound || '—'}</div>
              <div className="text-xs font-bold text-muted-foreground">best find</div>
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-muted-foreground">
            Today's hidden gem was <span className="font-display font-extrabold uppercase">{props.puzzle.best}</span>.
            You can keep hunting after closing this.
          </p>

          {props.mode === 'daily' ? (
            <>
              <button type="button" onClick={copy} className="btn3d btn3d-accent h-12 w-full text-base">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next web in</div>
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
