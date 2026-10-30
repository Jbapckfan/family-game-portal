import { useEffect, useState } from 'react'
import { Share2, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { msUntilTomorrow, type LevelResult } from './engine'
import { nativeMessage } from '../shared/integration'
import { buildCairnShareResult, type CairnShareResult } from './share-card'
import { CairnSharePanel } from './CairnSharePanel'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'daily' | 'practice'
  puzzleNo: number
  dayNumber: number
  results: LevelResult[]
  perfect: boolean
  onPractice: () => void
  onNewPractice: () => void
  onBackToDaily: () => void
}

function useCountdown(active: boolean) {
  const [ms, setMs] = useState(() => msUntilTomorrow())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setMs(msUntilTomorrow()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function WinModal(props: Props) {
  const [shareResult, setShareResult] = useState<Readonly<CairnShareResult>|null>(null)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  useEffect(() => { if (props.open) setShareResult(null) }, [props.open,props.mode,props.puzzleNo,props.dayNumber,props.results])
  const result = props.results.length === 5 ? buildCairnShareResult(props) : null
  const title = shareResult ? 'Share your result' : result?.headline ?? 'Your result'
  const share = () => {
    if (!result) return
    if (nativeMessage({type:'share',slug:'kimi-cairn',text:result.caption})) return
    setShareResult(result)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="cairn-results max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        {shareResult ? <CairnSharePanel result={shareResult} onBack={() => setShareResult(null)} /> : <div className="flex flex-col items-center gap-4">
          <div className="cairn-finish-mark" aria-hidden="true">{Array.from({length:5},(_,i)=><span key={i}/>)}</div>
          <p className="cairn-result-summary">{result?.solved} of 5 levels solved</p>
          <p className="cairn-result-detail">{result?.misses} {result?.misses === 1 ? 'miss' : 'misses'} · {result?.hints} {result?.hints === 1 ? 'nudge' : 'nudges'}{result?.skipped ? ` · ${result.skipped} shown` : ''}</p>
          <div className="cairn-result-words">
            {props.results.map((r, i) => (
              <div key={i}><span>{r.word.toUpperCase()}</span><span>{r.status==='clean'?'Clean':r.status==='messy'?'Assisted':'Shown'}</span></div>
            ))}
          </div>
          <button type="button" onClick={share} className="btn3d btn3d-accent h-12 w-full text-base"><Share2 className="h-5 w-5" />Share result</button>
          {props.mode === 'daily' ? (
            <>
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next cairn in</div>
                <div className="font-display text-2xl font-extrabold tabular-nums">{countdown}</div>
              </div>
              <button type="button" onClick={props.onPractice} className="btn3d btn3d-soft h-10 px-4 text-sm">
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
              <button type="button" onClick={props.onBackToDaily} className="btn3d btn3d-soft h-10 px-4 text-sm">
                Back to today's puzzle
              </button>
            </div>
          )}
        </div>}
      </DialogContent>
    </Dialog>
  )
}
