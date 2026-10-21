import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MiniTiles({ letters, variant }: { letters: string; variant: 'plain' | 'slot' | 'new' }) {
  return (
    <div className="flex gap-1">
      {letters.split('').map((c, i) => (
        <span
          key={i}
          className={`tile3d ${variant === 'slot' ? 'tile-slot' : ''} ${variant === 'new' && i === letters.length - 1 ? 'tile-new' : ''}`}
          style={{ width: 34, height: 38, fontSize: '1rem', boxShadow: '0 3px 0 hsl(var(--tile-edge))' }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export function HelpModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">How to play CAIRN</DialogTitle>
          <DialogDescription className="sr-only">Rules of the daily word-stacking game</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-[15px] font-semibold leading-relaxed text-foreground/85">
          <div>
            <p className="mb-2">Use <strong>every letter</strong> in the rack to spell a word:</p>
            <MiniTiles letters="tea" variant="plain" />
          </div>
          <div>
            <p className="mb-2">
              Solve it, and a <span style={{ color: '#a85439' }} className="font-bold">new letter</span> drops
              in. Use all of them again:
            </p>
            <div className="flex items-center gap-2">
              <MiniTiles letters="rate" variant="new" />
              <span className="text-muted-foreground">← RATE, TEAR…</span>
            </div>
          </div>
          <p>
            Climb from <strong>3 letters to 7</strong> — five levels to the summit. Any valid word that uses all the
            letters counts.
          </p>
          <ul className="flex flex-col gap-1.5">
            <li>🟩 Flawless — solved with no misses and no hints</li>
            <li>🟨 Solved with misses or a hint</li>
            <li>⬛ Gave up on that level</li>
          </ul>
          <p className="text-muted-foreground">
            Tap tiles or use your keyboard. A new puzzle stacks up every day at midnight — finish it to grow your
            streak. Choose Practice above the board for an extra puzzle; your daily result stays separate.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
