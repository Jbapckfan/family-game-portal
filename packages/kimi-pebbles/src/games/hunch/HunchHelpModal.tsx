import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

function Row({ word, marks }: { word: string; marks: ('g' | 'y' | 'b')[] }) {
  return (
    <div className="flex gap-1">
      {word.split('').map((c, i) => (
        <span
          key={i}
          className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg font-extrabold uppercase text-white ${
            marks[i] === 'g' ? 'tile-ok' : marks[i] === 'y' ? 'tile-gold' : 'tile-dim'
          }`}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export function HunchHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">How to play HUNCH</DialogTitle>
          <DialogDescription className="sr-only">Game instructions</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-[15px] font-semibold leading-relaxed">
          <p>Guess the hidden 5-letter word in 6 tries.</p>
          <div className="flex flex-col gap-2.5">
            <Row word="crane" marks={['g', 'b', 'y', 'b', 'b']} />
            <p>
              <span className="font-display font-extrabold" style={{ color: 'hsl(145 55% 45%)' }}>Green</span> = right
              letter, right spot ·{' '}
              <span className="font-display font-extrabold" style={{ color: 'hsl(38 85% 45%)' }}>Gold</span> = right
              letter, wrong spot · <span className="font-display font-extrabold" style={{ color: 'hsl(340 14% 50%)' }}>Gray</span>{' '}
              = not in the word.
            </p>
          </div>
          <p>Stuck? Reveal one letter per round. Your saved hint stays visible above the board.</p>
          <p className="text-sm text-muted-foreground">A new word every midnight. Win to keep your streak alive.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
