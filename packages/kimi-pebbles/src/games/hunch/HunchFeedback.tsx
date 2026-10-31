import type {Eval} from './engine'
import {orderedHunchFeedback,hunchFeedbackLabel} from './feedback'

export function HunchFeedback({row}:{row:readonly Eval[]}){
 return <span className="hunch-dots" role="img" aria-label={hunchFeedbackLabel(row)}>{orderedHunchFeedback(row).map((status,i)=><span key={i} className="hunch-dot" data-hunch-dot={status} aria-hidden="true"/>)}</span>
}
