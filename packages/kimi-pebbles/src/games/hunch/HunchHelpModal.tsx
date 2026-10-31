import {useState} from 'react'
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog'
import {evaluate} from './engine'
import {HunchFeedback} from './HunchFeedback'
const marks=evaluate('alley','apple')
const explanations={black:'One black dot: one letter is correct and in the right position.',white:'Two white dots: two other letters belong in the answer, but in different positions.',copies:'APPLE has one L. The extra L and the Y add no match. Dashes fill unused spaces; dots never identify individual letters.'}
export function HunchHelpModal({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const [selected,setSelected]=useState<keyof typeof explanations>('black')
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="hunch-help max-w-sm rounded-3xl"><DialogHeader><DialogTitle className="font-display text-2xl">How to play Hunch</DialogTitle><DialogDescription>Find the hidden five-letter word in six accepted guesses.</DialogDescription></DialogHeader>
  <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
   <p>Type a word, then Enter, or use the on-screen keys. Feedback is a group of dots beside the whole guess.</p>
   <p><strong>Black</strong> means a correct letter in the right position. <strong>White</strong> means a correct letter elsewhere. Dots are grouped by type, <strong>not aligned with letters</strong>. A dash means no additional match.</p>
   <div className="hunch-example"><strong>Example answer: APPLE</strong><span className="hunch-example-word">ALLEY</span><HunchFeedback row={marks}/><div className="hunch-example-controls">{(['black','white','copies'] as const).map(kind=><button key={kind} type="button" aria-pressed={selected===kind} onClick={()=>setSelected(kind)}>{kind==='black'?'Black dots':kind==='white'?'White dots':'Extra copies'}</button>)}</div><p role="status">{explanations[selected]}</p><small>This is a separate example. Tap an explanation to inspect it.</small></div>
   <p>Repeated letters count only as many times as they occur in the answer. Exact matches count first. Repeated or unrecognized guesses are free to edit and do not use a try.</p>
   <p>One optional clue names a letter in the answer, without its position or number of copies. Confirm to use it; cancelling is free. Your result records assistance.</p>
   <p className="text-sm text-muted-foreground">Daily changes at midnight in Central Time. Practice has separate results and leaves your daily streak intact.</p>
  </div>
 </DialogContent></Dialog>
}
