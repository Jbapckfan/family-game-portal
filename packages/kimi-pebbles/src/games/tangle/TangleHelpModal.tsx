import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function TangleHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">How to play TANGLE</DialogTitle>
          <DialogDescription className="sr-only">Rules of the word-web game</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-[15px] font-semibold leading-relaxed text-foreground/85">
          <p>
            Letters are tangled in a 4×4 web. <strong>Drag or tap across touching letters</strong> — including
            diagonals — to spell words.
          </p>
          <ul className="flex flex-col gap-1.5">
            <li>• Words are 3+ letters; each letter cell can be used once per word</li>
            <li>• Longer words score more: 3–4 letters = 1 pt, 5 = 2, 6 = 3, 7 = 5, 8+ = 11</li>
            <li>• Follow the Bronze, Silver and <strong>Gold point goals</strong>. Gold completes the daily goal; keep hunting afterward.</li>
          </ul>
          <p className="text-muted-foreground">
            Drag through touching letters, then release on a letter to check the word. Releasing outside the grid keeps a free preview. Slide back one letter to undo it. You can also tap letters, then Check; tap the last letter again to submit. Keyboard: focus a letter and use Space or Enter to select, or focus Check to submit. Escape clears and Backspace removes the last letter.
          </p>
          <p className="text-muted-foreground">A word not in this grid’s word list counts as one miss. Short or already-found words cost no points or misses. One two-letter clue is available per round and stays saved; using it is recorded on your result without changing points. New grids arrive at midnight in Central Time. Some accepted words may be uncommon.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
