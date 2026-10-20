import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export function MorphHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">How to play MORPH</DialogTitle>
          <DialogDescription className="sr-only">Rules of the word-ladder game</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-[15px] font-semibold leading-relaxed text-foreground/85">
          <p>
            Turn the <strong className="text-[hsl(205_75%_42%)]">start</strong> word into the{' '}
            <strong className="text-[hsl(340_75%_50%)]">target</strong> word, one rung at a time.
          </p>
          <div className="rounded-2xl bg-secondary p-3 font-display font-bold uppercase tracking-widest">
            cold → <span className="text-[hsl(20_85%_43%)]">c</span>ord →{' '}
            <span className="text-[hsl(20_85%_43%)]">card</span> →{' '}
            <span className="text-[hsl(20_85%_43%)]">ward</span> → warm
          </div>
          <ul className="flex flex-col gap-1.5">
            <li>• Each new rung changes <strong>exactly one letter</strong></li>
            <li>• Every rung must be a <strong>real word</strong></li>
            <li>• Fewer moves = better medal. Match or beat the <strong>target</strong> for gold 🥇</li>
          </ul>
          <p className="text-muted-foreground">
            Tap a letter in the editing row to swap it, or type with your keyboard. Undo a rung or restart an unfinished
            ladder whenever you need to recover. Hints and misses are kept.
          </p>
          <p className="text-muted-foreground">The target is the supplied route's length; shorter routes may exist. Reveal that route once, then view the saved hint anytime. New ladder every midnight.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
