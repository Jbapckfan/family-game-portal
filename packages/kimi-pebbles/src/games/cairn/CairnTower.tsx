import type { LevelResult } from './engine'

interface Props {
  results: LevelResult[]
  totalLevels: number
  finished: boolean
  animateLast?: boolean
  compact?: boolean
}

/** Small, static progress mark. Words and status labels carry the result. */
export function CairnTower({ results, totalLevels, compact = false }: Props) {
  return <div className="cairn-tower" aria-hidden="true">
    {Array.from({length:Math.min(totalLevels,5)}, (_,i) => <span key={i}
      data-kind={results[i]?.status ?? 'empty'}
      style={{width:(76-i*10)*(compact ? 0.72 : 1),height:compact?9:12}} />)}
  </div>
}
