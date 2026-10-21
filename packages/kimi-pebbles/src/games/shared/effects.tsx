import confetti from 'canvas-confetti'
import { X } from 'lucide-react'

export const CONFETTI_COLORS = ['#7cc4f0', '#5fca7d', '#f98a3e', '#ee5f92', '#a878d8', '#ffd166']

export function fireConfetti() {
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.65 },
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
  })
  window.setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    })
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    })
  }, 250)
}

export function ToastHost({ toast }: { toast: { id: number; msg: string; kind: 'info' | 'error' | 'success' } | null }) {
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        key={toast.id}
        className="anim-toast rounded-full px-4 py-2 font-display text-sm font-bold text-white shadow-lg"
        style={{
          background:
            toast.kind === 'error'
              ? 'hsl(0 70% 52%)'
              : toast.kind === 'success'
                ? 'hsl(145 55% 45%)'
                : 'hsl(340 25% 28%)',
        }}
        role="status"
      >
        {toast.msg}
      </div>
    </div>
  )
}

export function PracticeBanner({ onExit }: { onExit: () => void }) {
  return (
    <div className="collection-practice-banner mx-auto mt-3 flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-bold text-primary">
      Practice puzzle
      <button
        type="button"
        onClick={onExit}
        className="ml-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="Exit practice"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
