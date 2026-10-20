import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function CircuitHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">How to play CIRCUIT</DialogTitle>
          <DialogDescription className="sr-only">Game instructions</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-[15px] font-semibold leading-relaxed">
          <p>Light up all 12 letters around the ring by playing words.</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              Letters sit on <span className="font-display font-extrabold">4 colored arcs</span> — consecutive letters
              in a word must hop to a <em>different</em> arc.
            </li>
            <li>
              After each word, your next word must <span className="font-display font-extrabold">start with the last
              letter</span> of the previous one. The chain is seeded for you.
            </li>
            <li>Cover all 12 letters in as few words as possible — beat par for gold.</li>
          </ul>
          <p>Stuck? One free route clue per round. Undo a word or restart the chain whenever you need another route.</p>
          <p className="text-sm text-muted-foreground">A new ring every midnight. Finish the circuit to keep your streak.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
