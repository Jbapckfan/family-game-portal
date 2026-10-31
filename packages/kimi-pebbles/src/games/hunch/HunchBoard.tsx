import { useEffect, useRef, useState } from 'react'
import {flushSync} from 'react-dom'
import { isNativeEnter } from '../shared/keyboard'
import { Delete, Lightbulb } from 'lucide-react'
import { MAX_GUESSES, WORD_LEN, type Eval } from './engine'
import {HunchFeedback} from './HunchFeedback'
import {hunchFeedbackLabel} from './feedback'
import { cn } from '@/lib/utils'
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog'

type Actions = {
  keyLetter: (ch: string) => void
  backspace: () => void
  submit: () => void
  hint: () => void
}

interface Props {
  state: {
    phase: string
    mode: string
    dayNumber: number
    puzzleNo: number
    answer: string
    guesses: string[]
    evals: Eval[][]
    current: string
    hintLetters: string[]
    hintsUsed: number
    finished: boolean
    won: boolean
    shaking: boolean
  }
  actions: Actions
}

const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export function HunchBoard({ state, actions }: Props) {
  const identity=`${state.mode}:${state.dayNumber}:${state.puzzleNo}`
  const [clueApproval,setClueApproval]=useState<{key:string;answer:string;guesses:string[]}|null>(null)
  const cancelButton=useRef<HTMLButtonElement>(null)
  const consumed=useRef(false)
  const clueOpen=Boolean(clueApproval&&clueApproval.key===identity&&clueApproval.answer===state.answer&&clueApproval.guesses===state.guesses&&state.hintsUsed===0&&!state.finished&&state.phase==='playing')
  useEffect(()=>setClueApproval(null),[identity,state.answer,state.guesses,state.hintsUsed,state.finished])
  const requestClue=()=>{consumed.current=false;setClueApproval({key:identity,answer:state.answer,guesses:state.guesses})}
  const confirmClue=()=>{if(!clueOpen||consumed.current)return;consumed.current=true;setClueApproval(null);actions.hint()}
  /* physical keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if(e.defaultPrevented||e.isComposing||state.phase!=='playing')return
      if (document.querySelector('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target=e.target as HTMLElement|null
      if(target?.closest?.('input,textarea,select,[contenteditable="true"]'))return
      const focusBoard=()=>{if(target?.closest?.('button,a[href],summary,[role="button"],[role="link"]'))document.querySelector<HTMLElement>('[data-game-focus]')?.focus({preventScroll:true})}
      if (isNativeEnter(e)) return
      if (e.key === 'Enter') {
        e.preventDefault()
        flushSync(()=>actions.submit())
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        focusBoard()
        flushSync(()=>actions.backspace())
        return
      }
      const ch = e.key.toLowerCase()
      if (/^[a-z]$/.test(ch)){focusBoard();flushSync(()=>actions.keyLetter(ch))}
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actions,state.phase])

  const rows: (string | null)[] = [...state.guesses]
  if (!state.finished) rows.push(state.current)
  while (rows.length < MAX_GUESSES) rows.push(null)
  const last=state.guesses.length-1
  const announcement=state.current?`Current guess: ${state.current.toUpperCase()}, ${state.current.length} of five letters.`:last>=0?`Guess ${last+1}: ${hunchFeedbackLabel(state.evals[last])}`:'Enter a five-letter word.'

  return (
    <div className="kimi-board hunch-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      <div className="hunch-counter-row">
        <span>Guess <strong>{Math.min(state.guesses.length + (state.finished ? 0 : 1), MAX_GUESSES)}</strong> of {MAX_GUESSES}</span>
        {!state.finished&&<button type="button" onClick={requestClue} disabled={state.hintsUsed>0} className="btn3d btn3d-soft" aria-label={state.hintsUsed>0?'Clue used':'Reveal a letter'}><Lightbulb className="h-4 w-4"/>{state.hintsUsed>0?'Clue used':'Reveal a letter'}</button>}
      </div>
      {state.hintLetters.length>0&&<p className="hunch-saved-clue">Revealed letter: <strong>{state.hintLetters.join(', ').toUpperCase()}</strong> · position unknown</p>}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>

      {/* grid */}
      <div className={cn('hunch-typecase mt-4 flex flex-col gap-1.5', state.shaking && 'anim-shake')}>
        {rows.map((word, r) => (
          <div key={r} data-hunch-row={r} data-active={r===state.guesses.length&&!state.finished?'true':undefined} className="hunch-row" role="group" aria-label={word ? `Guess ${r + 1}: ${word}` : `Row ${r + 1} empty`}>
            <div className="hunch-letters">{Array.from({ length: WORD_LEN }).map((_, i) => {
              const ch = word?.[i] ?? ''
              const ev = r < state.evals.length ? state.evals[r][i] : null
              const isCurrent = r === state.guesses.length && !state.finished && word !== null
              return (
                <div
                  key={i}
                  role="img"
                  data-hunch-cell={i}
                  aria-label={`Position ${i + 1}: ${ch ? ch.toUpperCase() : 'empty'}`}
                  className={cn(
                    'tile3d h-14 w-12 text-2xl sm:w-13',
                    isCurrent && ch ? 'tile-slot' : '',
                    !ev && !(isCurrent && ch) && 'opacity-60',
                    ev && 'anim-pop',
                  )}
                  style={ev ? { animationDelay: `${i * 90}ms` } : undefined}
                >
                  {ch}
                </div>
              )
            })}</div>
            {r < state.evals.length ? <HunchFeedback row={state.evals[r]}/> : <span className="hunch-dots-placeholder" aria-hidden="true"/>}
          </div>
        ))}
      </div>

      <p data-hunch-legend className="mt-3 flex max-w-sm flex-wrap justify-center gap-x-3 gap-y-1 text-center text-xs font-semibold text-muted-foreground">
        <span><i className="hunch-dot" data-hunch-dot="correct"/> Black: exact</span><span><i className="hunch-dot" data-hunch-dot="present"/> White: elsewhere</span><span>Dots are grouped, not aligned to letters.</span>
      </p>

      {/* revealed answer on loss */}
      {state.finished && !state.won && (
        <div className="mt-4 rounded-2xl bg-secondary px-4 py-2 font-display text-lg font-extrabold uppercase tracking-widest">
          The word was <span className="text-primary">{state.answer}</span>
        </div>
      )}

      {/* keyboard */}
      {!state.finished && (
        <div className="hunch-keyboard mt-6 flex w-full max-w-md flex-col items-center gap-1.5">
          {KB_ROWS.map((row, ri) => (
            <div key={ri} className="flex w-full justify-center gap-1">
              {ri === 2 && (
                <button
                  type="button"
                  onClick={event=>{flushSync(()=>actions.submit());if(event.detail>0)event.currentTarget.blur()}}
                  className="btn3d btn3d-accent h-12 flex-1 px-1 text-xs sm:text-sm"
                >
                  Enter
                </button>
              )}
              {row.split('').map((ch) => {
                return (
                  <button
                    key={ch}
                    type="button"
                    aria-label={`Letter ${ch}${state.hintLetters.includes(ch)?', revealed clue; position unknown':''}`}
                    onClick={event => {flushSync(()=>actions.keyLetter(ch));if(event.detail>0)event.currentTarget.blur()}}
                    data-hunch-key={ch}
                    data-hint={state.hintLetters.includes(ch)?'true':undefined}
                    className={cn(
                      'tile3d h-12 min-w-0 flex-1 text-lg sm:text-xl',
                    )}
                  >
                    {ch}
                  </button>
                )
              })}
              {ri === 2 && (
                <button
                  type="button"
                  aria-label="Delete letter"
                  onClick={event=>{flushSync(()=>actions.backspace());if(event.detail>0)event.currentTarget.blur()}}
                  className="btn3d btn3d-soft h-12 flex-1 px-1"
                >
                  <Delete className="mx-auto h-5 w-5" />
                </button>
              )}
            </div>
          ))}

        </div>
      )}
      <Dialog open={clueOpen} onOpenChange={open=>{if(!open)setClueApproval(null)}}><DialogContent onOpenAutoFocus={event=>{event.preventDefault();cancelButton.current?.focus()}} className="hunch-confirm max-w-sm rounded-3xl"><DialogTitle>Reveal one letter?</DialogTitle><DialogDescription>Show a letter contained in the answer. Its position and how many copies it has stay hidden. You have one clue this round; using it marks the result as assisted and does not use a guess.</DialogDescription><button type="button" ref={cancelButton} className="btn3d btn3d-soft h-12" onClick={()=>setClueApproval(null)}>Keep guessing</button><button type="button" className="btn3d btn3d-accent h-12" onClick={confirmClue}>Use my clue</button></DialogContent></Dialog>
    </div>
  )
}
