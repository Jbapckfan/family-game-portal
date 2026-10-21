import { ArrowLeft, BarChart3, CircleHelp, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { loadSoundOn, saveSoundOn } from './stats'
import { setSoundEnabled, sfx } from './sound'
import { homeURL } from './integration'

interface Props {
  title: string; subtitle: string;
  mode: 'daily' | 'practice'; busy?: boolean; onPractice: () => void; onDaily: () => void;
  onHelp?: () => void; onStats?: () => void
}

const IDENTITIES: Record<string, { category: string; rule: string }> = {
  Cairn: { category: 'Word building', rule: 'One more letter. One stone higher.' },
  Morph: { category: 'Word transformation', rule: 'Change a letter. Find your way there.' },
  Tangle: { category: 'Word finding', rule: 'Follow the letters. See what grows.' },
  Hunch: { category: 'Word deduction', rule: 'Five letters. Trust your next hunch.' },
  Circuit: { category: 'Word chaining', rule: 'Switch arcs. Connect words. Light every letter.' },
  Quartet: { category: 'Hidden connections', rule: 'Sixteen words. Four things in common.' },
}

function GameEmblem() {
  return <span className="collection-emblem" aria-hidden="true"><img src="./icon.svg" alt="" width={46} height={46} /></span>
}
function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}
    className="collection-icon-button flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{children}</button>
}
export function GameHeader({ title, subtitle, mode, busy = false, onPractice, onDaily, onHelp, onStats }: Props) {
  const [soundOn, setSoundOn] = useState(loadSoundOn)
  const [storageWarning, setStorageWarning] = useState(false)
  useEffect(() => {
    setSoundEnabled(loadSoundOn())
    const warn = () => setStorageWarning(true)
    window.addEventListener('alford:storage-unavailable', warn)
    return () => window.removeEventListener('alford:storage-unavailable', warn)
  }, [])
  const toggle = () => {
    const on = !soundOn
    setSoundOn(on); saveSoundOn(on); setSoundEnabled(on)
    if (on) sfx.tap()
  }
  return <>
    <header className="collection-header">
      <div className="collection-header-inner">
        <div className="collection-credit-row"><a href={homeURL()} aria-label="Back to all games"><ArrowLeft size={15} /> All games</a><span className="collection-series">Alford Daily</span><span data-creator-label>Developed by Kimi</span></div>
        <div className="collection-game-row">
          <div className="collection-game-name"><GameEmblem/><div><p className="collection-category">{IDENTITIES[title]?.category}</p><h1>{title}</h1></div></div>
          <div className="collection-controls">
            {onStats && <IconButton label="Statistics" onClick={onStats}><BarChart3 size={19} /></IconButton>}
            <IconButton label={soundOn ? 'Mute sounds' : 'Unmute sounds'} onClick={toggle}>{soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}</IconButton>
            {onHelp && <IconButton label="How to play" onClick={onHelp}><CircleHelp size={19} /></IconButton>}
          </div>
        </div>
        <p className="collection-rule">{IDENTITIES[title]?.rule}</p>
        <div className="collection-edition-row">
          <div className="collection-modes" role="group" aria-label="Game mode">
            <button type="button" disabled={busy} aria-pressed={mode === 'daily'} onClick={() => { if (mode !== 'daily') onDaily() }}>Daily</button>
            <button type="button" disabled={busy} aria-pressed={mode === 'practice'} onClick={() => { if (mode !== 'practice') onPractice() }}>Practice</button>
          </div>
          <p className="collection-subtitle">{subtitle}</p>
        </div>
      </div>
    </header>
    {storageWarning && <p className="collection-storage-note" role="status">You can play, but this device could not save your latest progress.</p>}
  </>
}
