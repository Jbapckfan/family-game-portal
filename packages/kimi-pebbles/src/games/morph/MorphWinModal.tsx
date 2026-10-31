import { useEffect, useState } from 'react'
import { Share2, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { MorphPuzzle } from './engine'
import { buildMorphShareResult, type MorphShareResult } from './share-card'
import { MorphSharePanel } from './MorphSharePanel'
import { nativeMessage } from '../shared/integration'
import { useCountdown } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  puzzle: MorphPuzzle
  puzzleNo: number
  dayNumber: number
  rows: string[]
  misses: number
  gaveUp: boolean
  hintsUsed: number
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function MorphWinModal(props: Props) {
  const [shareResult,setShareResult] = useState<Readonly<MorphShareResult>|null>(null)
  const moves = props.rows.length - 1
  const countdown = useCountdown(props.open && props.mode === 'daily')
  useEffect(() => { if (props.open) setShareResult(null) }, [props.open,props.mode,props.dayNumber,props.puzzleNo,props.rows])
  const result = buildMorphShareResult({mode:props.mode,puzzleNo:props.puzzleNo,dayNumber:props.dayNumber,moves:props.rows.length-1,suggested:props.puzzle.par,misses:props.misses,hintsUsed:props.hintsUsed,gaveUp:props.gaveUp})
  const share = () => {
    if (nativeMessage({type:'share',slug:'kimi-morph',text:result.caption})) return
    setShareResult(result)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="morph-results max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl">{shareResult ? 'Share your result' : result.headline}</DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        {shareResult ? <MorphSharePanel result={shareResult} onBack={() => setShareResult(null)} /> : <div className="flex flex-col items-center gap-4">
          <p className="morph-result-pace">{result.pace}</p>
          <p className="morph-result-assistance">{result.assisted ? 'Assisted · route shown during play' : 'No route hint used'}</p>
          <div className="morph-result-ladders grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-secondary p-3">
              <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Your ladder
              </div>
              {props.rows.map((w, i) => (
                <div key={i} className="morph-result-word font-bold uppercase tracking-widest">{w}</div>
              ))}
              {!props.gaveUp && (
                <div className="mt-1 text-xs font-bold text-muted-foreground">
                  {moves} move{moves === 1 ? '' : 's'} · {props.misses} miss{props.misses === 1 ? '' : 'es'}
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-secondary p-3">
              <div className="mb-1 font-display text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Suggested route · {props.puzzle.par} moves
              </div>
              {props.puzzle.p.map((w, i) => (
                <div key={i} className="morph-result-word font-bold uppercase tracking-widest">{w}</div>
              ))}
            </div>
          </div>

          <button type="button" onClick={share} className="btn3d btn3d-accent h-12 w-full text-base"><Share2 className="h-5 w-5" />Share result</button>
          {props.mode === 'daily' ? (
            <>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next ladder in</div>
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
        </div>}
      </DialogContent>
    </Dialog>
  )
}
