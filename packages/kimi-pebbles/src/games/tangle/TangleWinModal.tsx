import { useState } from 'react'
import { Share2, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { TanglePuzzle } from './engine'
import { buildTangleShareResult, type TangleShareResult } from './share-card'
import { TangleSharePanel } from './TangleSharePanel'
import { nativeMessage } from '../shared/integration'
import { useCountdown } from '../shared/share'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  mode: 'daily' | 'practice'
  puzzle: TanglePuzzle
  puzzleNo: number
  dayNumber: number
  misses: number
  hintsUsed: number
  found: string[]
  score: number
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

export function TangleWinModal(props: Props) {
  const [shareResult,setShareResult] = useState<Readonly<TangleShareResult>|null>(null)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  const five = props.puzzle.g.length === 25
  const result = buildTangleShareResult({mode:props.mode,boardSize:five?5:4,puzzleNo:props.puzzleNo,dayNumber:props.dayNumber,score:props.score,maxScore:props.puzzle.max,wordCount:props.found.length,totalWords:props.puzzle.n,targets:props.puzzle.targets,misses:props.misses,hintsUsed:props.hintsUsed})
  const share = () => {
    if (nativeMessage({type:'share',slug:'kimi-tangle',text:result.caption})) return
    setShareResult(result)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="tangle-results max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl">{shareResult ? 'Share your hunt' : result.headline}</DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        {shareResult ? <TangleSharePanel result={shareResult} onBack={() => setShareResult(null)} /> : <div className="flex flex-col items-center gap-4">
          <p className="tangle-result-tier">{five && '5×5 Preview · '}{result.medal} · {result.assisted ? 'Clue used' : 'No clue used'}</p>
          <div className="tangle-result-metrics">
            <div><strong>{result.score}</strong><span>points · {result.maxScore} available</span></div>
            <div><strong>{result.wordCount} / {result.totalWords}</strong><span>words found</span></div>
            <div><strong>{result.goldTarget}</strong><span>Gold goal</span></div>
            <div><strong>{result.misses}</strong><span>{result.misses === 1 ? 'miss' : 'misses'}</span></div>
          </div>
          <p className="text-center text-sm text-muted-foreground">Your hunt can continue. Close this to find another word.</p>
          <button type="button" onClick={() => props.onOpenChange(false)} className="btn3d btn3d-soft h-12 w-full">Keep hunting</button>
          <button type="button" onClick={share} className="btn3d btn3d-accent h-12 w-full"><Share2 className="h-5 w-5" />Share progress</button>
          {props.mode === 'daily' ? (
            <>
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
                {five ? 'Restart sample' : 'New practice round'}
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
