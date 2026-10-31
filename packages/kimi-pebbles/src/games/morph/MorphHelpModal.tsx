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
            Turn the <strong className="morph-help-blue">start</strong> word into the{' '}
            <strong className="morph-help-blue">goal</strong> word, one rung at a time.
          </p>
          <div className="rounded-2xl bg-secondary p-3 font-display font-bold uppercase tracking-widest">
            cold → co<strong className="morph-help-change">r</strong>d → c<strong className="morph-help-change">a</strong>rd → <strong className="morph-help-change">w</strong>ard → war<strong className="morph-help-change">m</strong>

          </div>
          <ul className="flex flex-col gap-1.5">
            <li>• Each new rung changes <strong>exactly one letter</strong></li>
            <li>• Every rung must be in <strong>the word list</strong></li>
            <li>• No repeated words. Match or beat the <strong>suggested move count</strong> for gold.</li>
          </ul>
          <p className="text-muted-foreground">
            Tap a letter in the Next row to swap it, or type a four-letter word with your keyboard. Press Enter or Check word to submit. Undo a rung or restart an unfinished
            ladder whenever you need to recover. Hints and misses are kept.
          </p>
          <p className="text-muted-foreground">The suggested move count is the supplied route’s length; shorter routes may exist. Showing the whole route marks the round Assisted; reopening it is free. Giving up reveals the route, ends the round without a completion and ends a daily streak. Invalid one-letter words count as misses; changing too many letters or repeating a word does not. New ladder every midnight in Central Time.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
