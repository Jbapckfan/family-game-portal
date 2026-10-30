import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { Stats } from './storage'
import { centralDayNumber } from '../shared/integration'

export function displayedStreak(stats: Stats, today = centralDayNumber()): number {
  return stats.lastCompletedDay !== null && stats.lastCompletedDay >= today - 1 ? stats.currentStreak : 0
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: Stats
}

function Big({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-secondary px-2 py-3">
      <span className="font-display text-3xl font-extrabold">{value}</span>
      <span className="mt-0.5 text-center text-xs font-bold text-muted-foreground">{label}</span>
    </div>
  )
}

export function StatsModal({ open, onOpenChange, stats }: Props) {
  const rate = stats.played > 0 ? Math.round((stats.completed / stats.played) * 100) : 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Your cairns</DialogTitle>
          <DialogDescription className="sr-only">Your play statistics</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          <Big value={stats.played} label="Played" />
          <Big value={stats.completed} label="Summits" />
          <Big value={`${rate}%`} label="Summit rate" />
          <Big value={stats.perfect} label="Perfect" />
          <Big value={displayedStreak(stats)} label="Streak" />
          <Big value={stats.maxStreak} label="Best streak" />
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
          Stats live in this browser only. Practice rounds don't count.
        </p>
      </DialogContent>
    </Dialog>
  )
}
