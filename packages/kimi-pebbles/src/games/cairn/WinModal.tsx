import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Infinity as InfinityIcon, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { buildShareText, emojiFor, msUntilTomorrow, type LevelResult } from './engine'
import { CairnTower } from './CairnTower'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'daily' | 'practice'
  puzzleNo: number
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
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(props.open && props.mode === 'daily')
  const totalMisses = props.results.reduce((a, r) => a + r.misses, 0)
  const skipped = props.results.some((r) => r.status === 'skipped')

  const shareText = useMemo(
    () => buildShareText(props.puzzleNo, props.results, props.perfect),
    [props.puzzleNo, props.results, props.perfect],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const title = props.perfect
    ? 'Perfect summit! ✨'
    : skipped
      ? 'Stack finished'
      : props.mode === 'practice'
        ? 'Practice summit!'
        : 'Summit reached!'

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">{title}</DialogTitle>
          <DialogDescription className="sr-only">Puzzle results and sharing</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <CairnTower results={props.results} totalLevels={5} finished animateLast />

          {/* words you stacked */}
          <div className="w-full rounded-2xl bg-secondary px-4 py-3">
            {props.results.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 text-sm font-bold">
                <span className="font-display tracking-[0.2em]">{r.word.toUpperCase()}</span>
                <span>{emojiFor(r.status)}</span>
              </div>
            ))}
          </div>

          <div className="text-center font-display text-2xl font-extrabold tracking-widest">
            {props.results.map((r) => emojiFor(r.status)).join('')}
          </div>

          <p className="text-center text-sm font-semibold text-muted-foreground">
            {totalMisses === 0 && !skipped
              ? 'Not a single miss. Mountain-goat tier.'
              : skipped
                ? 'Some stones were placed for you — tomorrow is a new mountain.'
                : `${totalMisses} miss${totalMisses === 1 ? '' : 'es'} on the way up.`}
          </p>

          {props.mode === 'daily' ? (
            <>
              <button type="button" onClick={copy} className="btn3d btn3d-accent h-12 w-full text-base">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
