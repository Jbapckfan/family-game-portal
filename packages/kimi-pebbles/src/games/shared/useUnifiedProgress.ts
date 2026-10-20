import { useEffect, useRef } from 'react'
import { isKimiGame, makeProgress, nativeMessage, type UnifiedState } from './integration'

export function useUnifiedProgress(game: string, state: UnifiedState): void {
  const previous = useRef('')
  useEffect(() => {
    if (!isKimiGame(game)) return
    const payload = makeProgress(game, state)
    if (!payload) return
    const signature = JSON.stringify(payload)
    if (signature === previous.current) return
    previous.current = signature
    nativeMessage(payload)
    if (payload.status === 'won') nativeMessage({ type: 'haptic', slug: payload.slug, kind: 'win' })
  }, [game, state])
}
