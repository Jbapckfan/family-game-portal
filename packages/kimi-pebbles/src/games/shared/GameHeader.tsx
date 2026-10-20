import { ArrowLeft, BarChart3, CircleHelp, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { loadSoundOn, saveSoundOn } from './stats'
import { setSoundEnabled, sfx } from './sound'
import { homeURL } from './integration'

interface Props { title: string; subtitle: string; logo: ReactNode; onHelp?: () => void; onStats?: () => void }
function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick}
    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{children}</button>
}
export function GameHeader({ title, subtitle, logo, onHelp, onStats }: Props) {
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
    <header className="collection-header sticky top-0 z-40 border-b-2 border-border/60 bg-background/95 backdrop-blur">
      <div className="collection-header-inner">
        <div className="collection-credit-row"><a href={homeURL()} aria-label="Back to all games"><ArrowLeft size={15} /> All games</a><span data-creator-label>Developed by Kimi</span></div>
        <div className="collection-game-row">
          <div className="collection-game-name"><span aria-hidden="true">{logo}</span><div><h1>{title}</h1><div className="collection-subtitle">{subtitle}</div></div></div>
          <div className="collection-controls">
            {onStats && <IconButton label="Statistics" onClick={onStats}><BarChart3 size={19} /></IconButton>}
            <IconButton label={soundOn ? 'Mute sounds' : 'Unmute sounds'} onClick={toggle}>{soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}</IconButton>
            {onHelp && <IconButton label="How to play" onClick={onHelp}><CircleHelp size={19} /></IconButton>}
          </div>
        </div>
      </div>
    </header>
    {storageWarning && <p className="collection-storage-note" role="status">You can play, but this device could not save your latest progress.</p>}
  </>
}
