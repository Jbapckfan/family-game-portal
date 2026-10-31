import {useState} from 'react'
import {Share2,RotateCcw} from 'lucide-react'
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog'
import {HunchFeedback} from './HunchFeedback'
import type {Eval} from './engine'
import {buildHunchShareResult,type HunchShareResult} from './share-card'
import {HunchSharePanel} from './HunchSharePanel'
import {nativeMessage} from '../shared/integration'
import {useCountdown} from '../shared/share'
interface Props {open:boolean;onOpenChange:(open:boolean)=>void;mode:'daily'|'practice';answer:string;puzzleNo:number;dayNumber:number;evals:Eval[][];won:boolean;hintsUsed:number;onPractice:()=>void;onNewPractice:()=>void;onBackToDaily:()=>void}
export function HunchWinModal(props:Props){
 const [shareResult,setShareResult]=useState<Readonly<HunchShareResult>|null>(null)
 const result=buildHunchShareResult(props),countdown=useCountdown(props.open&&props.mode==='daily')
 const share=()=>{if(nativeMessage({type:'share',slug:'kimi-hunch',text:result.caption}))return;setShareResult(result)}
 return <Dialog open={props.open} onOpenChange={props.onOpenChange}><DialogContent className="hunch-results max-w-sm rounded-3xl">
  <DialogHeader><DialogTitle className="text-center font-display text-3xl">{shareResult?'Share your hunch':result.headline}</DialogTitle><DialogDescription className="sr-only">Completed puzzle results and spoiler-free sharing</DialogDescription></DialogHeader>
  {shareResult?<HunchSharePanel result={shareResult} onBack={()=>setShareResult(null)}/>:<div className="flex flex-col items-center gap-4">
   <p className="hunch-result-edition">{result.edition}{props.mode==='daily'?` · ${result.date}`:''}</p>
   {!props.won&&<p className="hunch-answer">The word was <strong>{props.answer}</strong></p>}
   <div className="hunch-result-pattern">{result.rows.map((row,r)=><div key={r} role="group" aria-label={`Guess ${r+1}`}><HunchFeedback row={row}/></div>)}</div>
   <p className="hunch-result-score">{result.won?'Solved':'Not solved'} · <strong>{result.score}</strong></p><p className="hunch-result-assistance">{result.assisted?'Clue used':'No clue used'}</p>
   <button type="button" onClick={share} className="btn3d btn3d-accent h-12 w-full"><Share2 className="h-5 w-5"/>Share result</button>
   <button type="button" onClick={()=>props.onOpenChange(false)} className="btn3d btn3d-soft h-11 w-full">Back to board</button>
   {props.mode==='daily'?<><p className="text-center text-xs text-muted-foreground">Next daily word in <strong className="tabular-nums">{countdown}</strong></p><button type="button" onClick={props.onPractice} className="btn3d btn3d-soft h-11 w-full">Try a practice round</button></>:<><button type="button" onClick={props.onNewPractice} className="btn3d btn3d-accent h-12 w-full"><RotateCcw className="h-5 w-5"/>New practice round</button><button type="button" onClick={props.onBackToDaily} className="btn3d btn3d-soft h-11 w-full">Back to today's puzzle</button></>}
  </div>}
 </DialogContent></Dialog>
}
