import type { QuartetPuzzle } from './engine'

export interface Tile {
  word: string
  group: number
}

/** Words are unique within a board, so the clue survives tile rearrangement. */
export type HintPair = [string, string]

export interface QuartetProgress {
  tiles: (Tile | null)[]
  solvedGroups: number[]
  misses: number
  history: number[][]
  hintPair: HintPair | null
  hintsUsed: number
  finished: boolean
  won: boolean
  countedPlayed: boolean
}

export function activeQuartetHint(value: unknown, tiles: (Tile | null)[]): HintPair | null {
  if (!Array.isArray(value) || value.length !== 2 || value.some((word) => typeof word !== 'string') || value[0] === value[1]) return null
  const first = tiles.find((tile) => tile?.word === value[0])
  const second = tiles.find((tile) => tile?.word === value[1])
  return first && second && first.group === second.group ? [first.word, second.word] : null
}

export function restoreQuartetProgress(value: unknown, puzzle: QuartetPuzzle): QuartetProgress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const saved = value as Record<string, unknown>
  const count = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max
  if (!Array.isArray(saved.solvedGroups) || saved.solvedGroups.length > 4 ||
    !saved.solvedGroups.every((group): group is number => count(group, 3)) ||
    new Set(saved.solvedGroups).size !== saved.solvedGroups.length ||
    !Array.isArray(saved.tiles) || saved.tiles.length !== 16 ||
    !Array.isArray(saved.history) || saved.history.length > 7 ||
    !saved.history.every((row) => Array.isArray(row) && row.length === 4 && row.every((tier) => count(tier, 4) && tier > 0)) ||
    !count(saved.misses, 4) || !count(saved.hintsUsed, 10000) ||
    typeof saved.finished !== 'boolean' || typeof saved.won !== 'boolean' || typeof saved.countedPlayed !== 'boolean') return null
  const solvedGroups = [...saved.solvedGroups] as number[]
  const history = saved.history.map((row) => [...row]) as number[][]
  const successes = history.filter((row) => row.every((tier) => tier === row[0])).map((row) => row[0])
  const misses = history.length - successes.length
  if (misses > 4 || successes.length !== solvedGroups.length ||
    successes.some((tier, index) => puzzle.groups[solvedGroups[index]].tier !== tier)) return null
  const won = solvedGroups.length === 4
  const finished = won || misses === 4
  if (saved.won !== won || saved.finished !== finished) return null
  const seen = new Set<string>()
  const tiles: (Tile | null)[] = []
  for (const candidate of saved.tiles) {
    if (candidate === null) { tiles.push(null); continue }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
    const tile = candidate as Record<string, unknown>
    if (typeof tile.word !== 'string' || !count(tile.group, 3) ||
      !puzzle.groups[tile.group].members.includes(tile.word) || solvedGroups.includes(tile.group) || seen.has(tile.word)) return null
    seen.add(tile.word)
    tiles.push({ word: tile.word, group: tile.group })
  }
  const expected = finished && !won ? [] : puzzle.groups.flatMap((group, index) => solvedGroups.includes(index) ? [] : group.members)
  if (seen.size !== expected.length || expected.some((word) => !seen.has(word))) return null
  return { tiles, solvedGroups, misses, history, hintPair: saved.hintsUsed > 0 ? activeQuartetHint(saved.hintPair, tiles) : null, hintsUsed: saved.hintsUsed, finished, won, countedPlayed: saved.countedPlayed }
}
