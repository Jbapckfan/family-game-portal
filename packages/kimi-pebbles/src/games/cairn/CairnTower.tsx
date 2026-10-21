import type { LevelResult } from './engine'
import { cn } from '@/lib/utils'

const STONE_COLORS = [
  '#567e76',
  '#66846c',
  '#9a8762',
  '#927b73',
  '#7b7d94',
]
const STONE_DARK = [
  '#36544f',
  '#48604b',
  '#706144',
  '#6b554f',
  '#57596e',
]
const WIDTHS = [104, 90, 76, 62, 48]
const RADII = [
  '48% 52% 55% 45% / 62% 58% 42% 38%',
  '52% 48% 45% 55% / 58% 62% 38% 42%',
  '45% 55% 52% 48% / 60% 55% 45% 40%',
  '55% 45% 48% 52% / 55% 60% 40% 45%',
  '50% 50% 55% 45% / 62% 55% 45% 38%',
]
const TILTS = [-2, 1.6, -1.2, 2, -1.6]

interface Props {
  results: LevelResult[]
  totalLevels: number
  finished: boolean
  animateLast?: boolean
  compact?: boolean
}

export function CairnTower({ results, totalLevels, finished, animateLast = false, compact = false }: Props) {
  const scale = compact ? 0.72 : 1
  return (
    <div
      className={cn('flex flex-col-reverse items-center', finished && 'anim-sway')}
      style={{ gap: 3 * scale }}
      aria-hidden="true"
    >
      {results.map((r, i) => {
        const skipped = r.status === 'skipped'
        const isLast = i === results.length - 1
        return (
          <div
            key={i}
            className={cn(animateLast && isLast && 'anim-stone')}
            style={
              {
                width: WIDTHS[i] * scale,
                height: 24 * scale,
                background: skipped ? 'hsl(30 8% 68%)' : STONE_COLORS[i],
                borderRadius: RADII[i],
                boxShadow: `0 ${3 * scale}px 0 ${skipped ? 'hsl(30 8% 52%)' : STONE_DARK[i]}`,
                '--tilt': `${TILTS[i]}deg`,
                transform: `rotate(${TILTS[i]}deg)`,
              } as React.CSSProperties
            }
          />
        )
      })}
      {/* ghost of the next stone */}
      {results.length < totalLevels && (
        <div
          style={{
            width: WIDTHS[results.length] * scale,
            height: 24 * scale,
            borderRadius: RADII[results.length],
            border: '2.5px dashed hsl(340 18% 78%)',
          }}
        />
      )}
      {/* summit flag */}
      {finished && results.length === totalLevels && (
        <div className="anim-flag" style={{ marginBottom: -2 }}>
          <svg width={26 * scale} height={30 * scale} viewBox="0 0 26 30" fill="none">
            <rect x="1.5" y="2" width="3" height="28" rx="1.5" fill="hsl(340 28% 30%)" />
            <path d="M4.5 3 L22 8 L4.5 14 Z" fill="hsl(24 92% 58%)" />
          </svg>
        </div>
      )}
    </div>
  )
}
