import { useMemo, useState } from 'react'
import { Check, Copy, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { buildHunchShare, MAX_GUESSES, type Eval } from './engine'
import { useCountdown, copyText } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  answer: string
  puzzleNo: number
  evals: Eval[][]
  won: boolean
  hintsUsed: number
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function HunchWinModal(props: Props) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  const used = props.evals.length

  const shareText = useMemo(
    () => buildHunchShare(props.puzzleNo, props.evals, props.won, props.hintsUsed),
    [props.puzzleNo, props.evals, props.won, props.hintsUsed],
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
            {props.won
              ? used === 1
                ? '🤯 First try!'
                : used <= 3
                  ? '🌟 Sharp hunch!'
                  : used <= 5
                    ? '🎉 Got it!'
                    : '😮‍💨 Down to the wire!'
              : '🔍 The word was…'}
          </DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {!props.won && (
            <div className="rounded-2xl bg-secondary px-6 py-3 font-display text-3xl font-extrabold uppercase tracking-[0.3em]">
              {props.answer}
            </div>
          )}

          {/* emoji grid preview */}
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary p-4" aria-hidden="true">
            {props.evals.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((e, i) => (
                  <span
                    key={i}
                    className="h-6 w-6 rounded-md"
                    style={{
                      background:
                        e === 'correct' ? 'hsl(145 55% 52%)' : e === 'present' ? 'hsl(43 92% 55%)' : 'hsl(340 14% 60%)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="font-display text-lg font-bold">
            {props.won ? `Solved in ${used}/${MAX_GUESSES}` : `Better luck tomorrow`}
            {props.hintsUsed > 0 && <span className="text-muted-foreground"> · {props.hintsUsed} hint{props.hintsUsed === 1 ? '' : 's'}</span>}
          </div>

          {props.mode === 'daily' ? (
            <>
              <button type="button" onClick={copy} className="btn3d btn3d-accent h-12 w-full text-base">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next word in</div>
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
