import type {Eval} from './engine'

/** Grouped pegs count matches. Their order never identifies a guessed letter. */
export function orderedHunchFeedback(row:readonly Eval[]):Eval[]{
 return (['correct','present','absent'] as const).flatMap(status=>row.filter(value=>value===status))
}
export function hunchFeedbackLabel(row:readonly Eval[]):string{
 const exact=row.filter(e=>e==='correct').length,elsewhere=row.filter(e=>e==='present').length
 return `${exact} exact ${exact===1?'match':'matches'}, ${elsewhere} elsewhere. Dots do not identify letter positions.`
}
