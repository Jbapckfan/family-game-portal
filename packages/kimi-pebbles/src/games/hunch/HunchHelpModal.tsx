import {useState} from 'react'
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog'
import {evaluate} from './engine'
const example='alley',marks=evaluate(example,'apple'),labels={correct:'correct spot',present:'different spot',absent:'absent or no extra copy'}
const explanations=['A matches the first position.','This L belongs somewhere else in APPLE.','APPLE has one L. The earlier L already used that copy, so this extra L is gray.','E belongs in another position.','There is no Y in the example answer.']
export function HunchHelpModal({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const [selected,setSelected]=useState(2)
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="hunch-help max-w-sm rounded-3xl"><DialogHeader><DialogTitle className="font-display text-2xl">How to play Hunch</DialogTitle><DialogDescription>Find the hidden five-letter word in six accepted guesses.</DialogDescription></DialogHeader>
  <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
   <p>Type a five-letter word, then Enter. Or use the on-screen keys. <strong>✓</strong> means the right spot; <strong>↔</strong> means move it; <strong>·</strong> means absent or no extra copy.</p>
   <div className="hunch-example"><strong>Example answer: APPLE</strong><div>{[...example].map((c,i)=><button key={i} type="button" data-eval={marks[i]} aria-pressed={selected===i} aria-label={`Example position ${i+1}, ${c.toUpperCase()}, ${labels[marks[i]]}`} onClick={()=>setSelected(i)}>{c.toUpperCase()}<span aria-hidden="true">{marks[i]==='correct'?'✓':marks[i]==='present'?'↔':'·'}</span></button>)}</div><p role="status">{explanations[selected]}</p><small>This is a separate example. Tap a tile to inspect it.</small></div>
   <p>Repeated letters count only as many times as they occur in the answer. Correct spots count first. Repeated or unrecognized guesses are free to edit and do not use a try.</p>
   <p>One optional clue reveals a new letter’s membership, without its position or number of copies. Confirm to use it; cancelling is free. Your result records assistance.</p>
   <p className="text-sm text-muted-foreground">Daily changes at midnight in Central Time. Practice has separate results and leaves your daily streak intact.</p>
  </div>
 </DialogContent></Dialog>
}
