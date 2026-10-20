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
            <li>• Climb the meter: 🥉 bronze → 🥈 silver → 🥇 <strong>gold wins the day</strong></li>
          </ul>
          <p className="text-muted-foreground">
            Slide back one letter to undo it; tap the last letter again (or ✓) to submit. One free hint per round. A new
            web tangles up every midnight — keep hunting after gold to find every word.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
