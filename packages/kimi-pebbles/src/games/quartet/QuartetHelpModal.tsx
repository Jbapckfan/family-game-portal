import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function QuartetHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-3xl font-extrabold">How to play QUARTET</DialogTitle>
          <DialogDescription className="sr-only">Game instructions</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-[15px] font-semibold leading-relaxed">
          <p>
            Sixteen words hide <span className="font-display font-extrabold">four groups of four</span>. Find them all.
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>Tap 4 tiles that share a theme, then hit Submit.</li>
            <li>Right group → it locks in with a color. Colors run 🟨 easy → 🟪 tricky.</li>
            <li>
              Wrong group → a miss. <span className="font-display font-extrabold">Four misses</span> ends the round.
            </li>
            <li>"One away…" means exactly three of your four belong together. Beware red herrings!</li>
          </ul>
          <p>Stuck? One free pair-glow hint per round. The pair stays highlighted until you solve its group.</p>
          <p className="text-sm text-muted-foreground">A new grid every midnight. Find all four to keep your streak.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
