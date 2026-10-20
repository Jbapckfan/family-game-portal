import { useMemo, useState } from 'react'
import { Check, Copy, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { buildCircuitShare, medalForChain, type CircuitPuzzle } from './engine'
import { useCountdown, copyText } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  puzzle: CircuitPuzzle
  puzzleNo: number
  played: string[]
  gaveUp: boolean
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function CircuitWinModal(props: Props) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  const medal = medalForChain(props.played.length, props.puzzle.par, props.gaveUp)

  const shareText = useMemo(
    () => buildCircuitShare(props.puzzleNo, props.played.length, props.puzzle.par, props.gaveUp),
    [props.puzzleNo, props.played.length, props.puzzle.par, props.gaveUp],
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
            {props.gaveUp
              ? 'Route revealed'
              : `${medal.icon} ${props.mode === 'practice' ? 'Circuit complete!' : medal.label}`}
          </DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-secondary p-3">
              <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Your chain
              </div>
              {props.played.map((w, i) => (
                <div key={i} className="font-display font-bold uppercase tracking-widest">{w}</div>
              ))}
              {props.played.length === 0 && <div className="text-muted-foreground">—</div>}
              {!props.gaveUp && (
                <div className="mt-1 text-xs font-bold text-muted-foreground">
                  {props.played.length} word{props.played.length === 1 ? '' : 's'}
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Best route · par {props.puzzle.par}
              </div>
              {props.puzzle.sol.map((w, i) => (
                <div key={i} className="font-display font-bold uppercase tracking-widest">{w}</div>
              ))}
            </div>
          </div>

          {props.mode === 'daily' ? (
            <>
              <button type="button" onClick={copy} className="btn3d btn3d-accent h-12 w-full text-base">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next ring in</div>
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
