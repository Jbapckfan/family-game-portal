import { useEffect, useMemo, useRef, useState } from 'react'
import {flushSync} from 'react-dom'
import {isNativeEnter} from '../shared/keyboard'
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog'
import { Delete, Eraser, Flag, Lightbulb, Undo2, RotateCcw } from 'lucide-react'
import { arcOf, medalForChain } from './engine'

// Presentation colors preserve the four distinct arc identities.
const ARC_COLORS = ['#2558c8', '#087455', '#8a6300', '#bd3547']
const ARC_EDGES = ['#102d65', '#064631', '#513800', '#6d1827']
const ARC_BANDS = ['#79a7ff', '#62d6a2', '#ffd05c', '#ff8593']
import { coverage } from './progress'
import { isPremium } from '../shared/premium'
import { cn } from '@/lib/utils'

type Actions = {
  tapLetter: (i: number) => void
  backspace: () => void
  clearWord: () => void
  undoWord: () => void
  restartChain: () => void
  submit: () => void
  hint: () => void
  giveUp: () => void
}

interface Props {
  state: {
    mode: string
    dayNumber: number
    puzzleNo: number
    phase: string
    puzzle: { l: string; n: number; par: number; sol: string[] } | null
    played: string[]
    current: number[]
    revealed: number
    hintsUsed: number
    finished: boolean
    gaveUp: boolean
    shaking: boolean
  }
  actions: Actions
}

export function CircuitBoard({ state, actions }: Props) {
  const [approval,setApproval]=useState<{kind:'hint'|'giveUp'|'restartChain';key:string;played:string[];current:number[]}|null>(null)
  const cancelButton=useRef<HTMLButtonElement>(null)
  const consumed=useRef(false),identity=`${state.mode}:${state.dayNumber}:${state.puzzleNo}`
  const approvalOpen=Boolean(approval&&approval.key===identity&&approval.played===state.played&&approval.current===state.current&&state.phase==='playing'&&!state.finished)
  useEffect(()=>setApproval(null),[identity,state.played,state.current,state.phase])
  const request=(kind:'hint'|'giveUp'|'restartChain')=>{consumed.current=false;setApproval({kind,key:identity,played:state.played,current:state.current})}
  const approve=()=>{if(!approvalOpen||consumed.current||!approval)return;consumed.current=true;setApproval(null);flushSync(()=>actions[approval.kind]())}
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.defaultPrevented||e.isComposing||state.phase!=='playing'||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('[role="dialog"]'))return;const t=e.target as HTMLElement|null;if(t?.closest?.('input,textarea,select,[contenteditable="true"]')||isNativeEnter(e))return;const focus=()=>{if(t?.closest?.('button,a[href],summary,[role="button"]'))document.querySelector<HTMLElement>('[data-game-focus]')?.focus({preventScroll:true})};if(e.key==='Enter'){e.preventDefault();flushSync(()=>actions.submit())}else if(e.key==='Backspace'){e.preventDefault();focus();flushSync(()=>actions.backspace())}else if(/^[a-z]$/i.test(e.key)){const i=state.puzzle?.l.indexOf(e.key.toLowerCase())??-1;if(i>=0){focus();flushSync(()=>actions.tapLetter(i))}}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[state.phase,state.puzzle,actions])
  const puzzle = state.puzzle
  const covered = useMemo(() => (puzzle ? coverage(state.played, puzzle.l) : 0), [puzzle, state.played])
  if (!puzzle) return null

  const letters = puzzle.l.split('')
  const coveredCount = covered.toString(2).split('').filter((b) => b === '1').length
  const currentWord = state.current.map((i) => letters[i]).join('')
  const needStart = !state.finished && state.played.length > 0 && state.current.length === 0
    ? state.played[state.played.length - 1].slice(-1)
    : null
  const lastArc = state.current.length > 0 ? arcOf(state.current[state.current.length - 1]) : null
  const allowedArcs = ARC_COLORS.map((_, i) => state.finished || (needStart ? arcOf(puzzle.l.indexOf(needStart)) === i : lastArc !== i))
  const medal = medalForChain(state.played.length, puzzle.par, state.gaveUp)

  return (
    <div className="kimi-board circuit-board mx-auto flex w-full max-w-lg flex-col items-center px-3">
      <div className="mt-4 flex w-full items-center justify-between text-sm font-bold text-muted-foreground">
        <span>
          Words <span className="font-display text-lg text-foreground">{state.played.length}</span>
          <span className="text-muted-foreground"> · target {puzzle.par}</span>
        </span>
        <span>
          Letters lit <span className="font-display text-lg text-foreground">{coveredCount}/12</span>
        </span>
      </div>

      {!state.finished && <p id="circuit-instructions" className="mt-3 max-w-sm text-center text-sm font-semibold text-muted-foreground" role="status">
        {needStart ? `Start the next word with ${needStart.toUpperCase()}. ` : lastArc === null ? 'Start with any letter. ' : ''}
        {lastArc === null ? 'Switch arcs after every letter; use all 12 in your chain.' : `Next: choose a different arc from ${lastArc + 1}.`}
      </p>}

      {/* coverage meter */}
      <div className="circuit-coverage mt-2 flex gap-1" role="img" aria-label={`${coveredCount} of 12 letters lit`}>
        {letters.map((_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 rounded-full transition-colors duration-200"
            style={{
              background: (covered >> i) & 1 ? ARC_COLORS[arcOf(i)] : '#d4e1eb',
            }}
          />
        ))}
      </div>

      {/* the ring */}
      <div className={cn('circuit-instrument relative mx-auto mt-6 h-72 w-72 sm:h-80 sm:w-80', state.shaking && 'anim-shake')}>
        <svg className="circuit-arc-bands" viewBox="0 0 100 100" aria-hidden="true">
          {ARC_BANDS.map((color, i) => {
            const start = (i * 90 - 90) * Math.PI / 180, end = (i * 90) * Math.PI / 180
            return <path key={i} data-arc-band={i} data-arc-letters={puzzle.l.slice(i * 3, i * 3 + 3)} data-allowed={String(allowedArcs[i])} d={`M ${50 + Math.cos(start) * 40} ${50 + Math.sin(start) * 40} A 40 40 0 0 1 ${50 + Math.cos(end) * 40} ${50 + Math.sin(end) * 40}`} fill="none" stroke={color} strokeWidth="21" />
          })}
          <circle cx="50" cy="50" r="29.5" fill="#142c3f" />
          {ARC_COLORS.map((_, i) => {
            const angle = (i * 90 - 90) * Math.PI / 180
            return <line key={i} x1={50 + Math.cos(angle) * 29.5} y1={50 + Math.sin(angle) * 29.5} x2={50 + Math.cos(angle) * 50.5} y2={50 + Math.sin(angle) * 50.5} stroke="#142c3f" strokeWidth=".45" />
          })}
        </svg>
        {ARC_COLORS.map((color, i) => {
          const angle = (i * 90 - 45) * Math.PI / 180
          return <span key={i} className="circuit-band-label" data-arc-label={i} data-allowed={String(allowedArcs[i])} style={{left: `${50 + Math.cos(angle) * 60}%`, top: `${50 + Math.sin(angle) * 60}%`, borderColor: color, color}} aria-hidden="true">Arc {i + 1}</span>
        })}
        <svg className="circuit-trace" viewBox="0 0 100 100" aria-hidden="true"><polyline points={state.current.map(i=>`${50+Math.cos((i/12*360-75)*Math.PI/180)*40},${50+Math.sin((i/12*360-75)*Math.PI/180)*40}`).join(' ')} fill="none" stroke="#7bc6dc" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round"/></svg>
        {/* current word in the middle */}
        <div className="circuit-readout absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl font-extrabold uppercase tracking-[0.2em]" aria-live="polite">
            {currentWord || (needStart ? `${needStart}…` : ' ')}
          </div>

        </div>
        {letters.map((ch, i) => {
          const angle = (i / 12) * 360 - 75
          const lit = ((covered >> i) & 1) === 1
          const picked = state.current.includes(i)
          const disabledArc = lastArc !== null && arcOf(i) === lastArc && !picked
          const mustPick = needStart && letters[i] !== needStart
          return (
            <button
              key={i}
              type="button"
              data-letter={i}
              aria-label={`Letter ${ch}, arc ${arcOf(i) + 1}${lit ? ', lit' : ''}${picked ? ', in current word' : ''}`}
              data-covered={lit?"true":undefined}
              data-selected={picked?"true":undefined}
              data-blocked={disabledArc||mustPick?"true":undefined}
              aria-describedby={!state.finished ? 'circuit-instructions' : undefined}
              aria-description={disabledArc ? 'Choose a different arc for the next letter' : mustPick ? `Next word must start with ${needStart?.toUpperCase()}` : undefined}
              disabled={state.finished}
              onClick={event=>{flushSync(()=>actions.tapLetter(i));if(event.detail>0)event.currentTarget.blur()}}
              className={cn(
                'circuit-node tile3d absolute h-14 w-14 text-2xl transition-all duration-150',
                picked && 'scale-110',
                !lit && !picked && 'opacity-95',
              )}
              style={{
                left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 40}% - 24px)`,
                top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 40}% - 24px)`,
                background: lit || picked ? ARC_BANDS[arcOf(i)] : 'hsl(var(--tile-face))',
                color: ARC_EDGES[arcOf(i)],
                border: `3px solid ${lit || picked ? 'transparent' : ARC_COLORS[arcOf(i)]}`,
                boxShadow: `0 5px 0 ${lit || picked ? ARC_EDGES[arcOf(i)] : 'hsl(var(--tile-edge))'}`,
                opacity: disabledArc || mustPick ? 0.58 : undefined,
              }}
            >
              {ch}
              <span className="circuit-arc-label absolute bottom-1 right-1.5 text-[11px] font-bold leading-none" aria-hidden="true">{arcOf(i) + 1}</span>
            </button>
          )
        })}
      </div>

      <div className="circuit-arc-legend" aria-label="The four arcs and their letters">{ARC_COLORS.map((color,i)=><span key={i} data-circuit-arc-legend data-allowed={String(allowedArcs[i])} style={{borderColor:color,color}} data-current-arc={lastArc===i?'true':undefined}><strong>Arc {i+1}</strong><b>{letters.slice(i*3,i*3+3).join(' ').toUpperCase()}</b></span>)}</div>
      {(state.revealed>0||state.gaveUp)&&<aside className="circuit-route"><strong>{state.gaveUp?'Revealed example route':'Saved route clue'}</strong><p>{puzzle.sol.slice(0,state.gaveUp?puzzle.sol.length:state.revealed).join(' → ')}</p><small>This route starts from the beginning; it may differ from your chain.</small></aside>}
      {/* chain so far */}
      {state.played.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5" role="list" aria-label="Words played">
          {state.played.map((w, i) => (
            <span key={i} role="listitem" className="rounded-full bg-secondary px-3 py-1 font-display text-sm font-bold uppercase tracking-wider">
              {w}
              {i < state.played.length - 1 && <span className="text-muted-foreground"> →</span>}
            </span>
          ))}
        </div>
      )}

      {/* controls */}
      {!state.finished && (
        <div className="mt-5 flex w-full max-w-md items-stretch justify-center gap-2">
          <button
            type="button"
            aria-label="Erase word"
            onClick={event=>{flushSync(()=>actions.clearWord());if(event.detail>0)event.currentTarget.blur()}}
            className="btn3d btn3d-soft h-12 w-14"
          >
            <Eraser className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Delete last letter"
            onClick={event=>{flushSync(()=>actions.backspace());if(event.detail>0)event.currentTarget.blur()}}
            className="btn3d btn3d-soft h-12 w-14"
          >
            <Delete className="mx-auto h-5 w-5" />
          </button>
          <button type="button" onClick={event=>{flushSync(()=>actions.submit());if(event.detail>0)event.currentTarget.blur()}} className="btn3d btn3d-accent h-12 flex-1 text-base">
            Play word
          </button>
        </div>
      )}

      {!state.finished && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={event=>{flushSync(()=>actions.undoWord());if(event.detail>0)event.currentTarget.blur()}} disabled={state.played.length === 0} className="btn3d btn3d-soft h-11 px-4 text-sm disabled:opacity-50">
            <Undo2 className="h-4 w-4" />
            Undo word
          </button>
          <button type="button" onClick={()=>request('restartChain')} disabled={state.played.length === 0 && state.current.length === 0} className="btn3d btn3d-soft h-11 px-4 text-sm disabled:opacity-50">
            <RotateCcw className="h-4 w-4" />
            Restart chain
          </button>
        </div>
      )}

      {!state.finished && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button type="button" onClick={()=>request('hint')} disabled={!isPremium()&&state.hintsUsed>0} className="btn3d btn3d-soft h-11 px-4 text-sm">
            <Lightbulb className="h-4 w-4" />
            {isPremium() ? 'Route clue · ∞' : state.hintsUsed === 0 ? 'Route clue · 1 free' : 'Route clue · used'}
          </button>
          <button type="button" onClick={()=>request('giveUp')} className="btn3d btn3d-soft circuit-reveal h-11 px-4 text-sm">
            <Flag className="h-4 w-4" />
            Reveal route
          </button>
        </div>
      )}

      <Dialog open={approvalOpen} onOpenChange={open=>{if(!open)setApproval(null)}}><DialogContent onOpenAutoFocus={event=>{event.preventDefault();cancelButton.current?.focus()}} className="circuit-confirm max-w-sm rounded-3xl"><DialogTitle>{approval?.kind==='hint'?'Use your route clue?':approval?.kind==='giveUp'?'Reveal an example route?':'Restart your chain?'}</DialogTitle><DialogDescription>{approval?.kind==='hint'?'Reveal the beginning of a complete example route. It may not continue your current chain. Using it records assistance.':approval?.kind==='giveUp'?'End this round as revealed, without a solve, and show a complete example route. A Daily reveal resets your current streak; Practice leaves Daily statistics intact.':'Clear your chain and current word. Clues already used stay recorded.'} Cancelling changes nothing.</DialogDescription><button type="button" ref={cancelButton} className="btn3d btn3d-soft h-12" onClick={()=>setApproval(null)}>Keep playing</button><button type="button" className="btn3d btn3d-accent h-12" onClick={approve}>{approval?.kind==='hint'?'Use route clue':approval?.kind==='giveUp'?'Reveal and end round':'Restart chain now'}</button></DialogContent></Dialog>
      {state.finished && !state.gaveUp && (
        <div className="mt-4 font-display text-xl font-extrabold">
          {medal.icon} {medal.label}
        </div>
      )}
    </div>
  )
}
