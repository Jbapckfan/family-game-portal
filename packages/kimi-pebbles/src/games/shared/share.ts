import { useEffect, useState } from 'react'
import { centralDayNumber, millisecondsToCentralMidnight, nativeMessage } from './integration'

export function useCountdown(active: boolean): string {
  const [ms, setMs] = useState(() => msUntilTomorrow())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setMs(msUntilTomorrow()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function msUntilTomorrow(now = new Date()): number {
  return millisecondsToCentralMidnight(now)
}

export async function copyText(text: string): Promise<void> {
  if (nativeMessage({ type: 'share', text, slug: document.documentElement.dataset.gameId })) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

export function todayDayNumber(now = new Date()): number {
  return centralDayNumber(now)
}

export function dateLabel(now = new Date()): string {
  return now.toLocaleDateString(undefined, { timeZone: 'America/Chicago', weekday: 'long', month: 'short', day: 'numeric' })
}
