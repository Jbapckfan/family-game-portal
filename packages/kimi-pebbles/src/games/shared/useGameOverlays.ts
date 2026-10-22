import { useCallback, useEffect, useRef, useState } from 'react'

type Overlay = 'help' | 'stats' | 'result' | null

/** One modal at a time. Explicit player choices consume a pending result popup;
 * a hidden page waits, while a different round discards the old popup entirely. */
export function useGameOverlays(roundKey: string, resultReady: boolean, delay = 900) {
  const [active, setActive] = useState<Overlay>(null)
  const [roundRevision, setRoundRevision] = useState(0)
  const activeRef = useRef<Overlay>(null)
  const cancelPending = useRef<() => void>(() => {})
  const resumePending = useRef<() => void>(() => {})
  const suspended = useRef(false)

  useEffect(() => {
    const show = () => resumePending.current()
    const hide = () => { suspended.current = true }
    const resume = () => { suspended.current = false; show() }
    document.addEventListener('visibilitychange', show)
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', resume)
    return () => {
      document.removeEventListener('visibilitychange', show)
      window.removeEventListener('pagehide', hide)
      window.removeEventListener('pageshow', resume)
    }
  }, [])

  const reset = useCallback(() => {
    cancelPending.current()
    activeRef.current = null
    setActive(null)
    // Random practice can select the same puzzle again: identity alone is not
    // enough to distinguish an explicit new round from the completed one.
    setRoundRevision(value => value + 1)
  }, [])

  const change = useCallback((kind: Exclude<Overlay, null>, open: boolean) => {
    if (open) {
      cancelPending.current()
      activeRef.current = kind
      setActive(kind)
    } else if (activeRef.current === kind) {
      activeRef.current = null
      setActive(null)
    }
  }, [])
  const setHelpOpen = useCallback((open: boolean) => change('help', open), [change])
  const setStatsOpen = useCallback((open: boolean) => change('stats', open), [change])
  const setWinOpen = useCallback((open: boolean) => change('result', open), [change])

  useEffect(() => {
    activeRef.current = null
    setActive(null)
  }, [roundKey, roundRevision])

  useEffect(() => {
    if (!resultReady || activeRef.current !== null) return
    let cancelled = false
    let due = false
    const show = () => {
      if (cancelled || !due || document.hidden || suspended.current || activeRef.current !== null) return
      cancelled = true
      activeRef.current = 'result'
      setActive('result')
    }
    const timer = window.setTimeout(() => { due = true; show() }, delay)
    const cancel = () => { cancelled = true; window.clearTimeout(timer) }
    cancelPending.current = cancel
    resumePending.current = show
    return () => {
      cancel()
      if (cancelPending.current === cancel) cancelPending.current = () => {}
      if (resumePending.current === show) resumePending.current = () => {}
    }
  }, [roundKey, roundRevision, resultReady, delay])

  return { helpOpen: active === 'help', statsOpen: active === 'stats', winOpen: active === 'result', setHelpOpen, setStatsOpen, setWinOpen, reset }
}
