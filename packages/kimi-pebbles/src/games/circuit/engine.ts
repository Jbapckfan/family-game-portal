import { choosePracticeIndex } from '../shared/practice'
import { publishedDailyIndex } from '../shared/daily'
import puzzlesData from './data/puzzles.json'
import additionsData from './data/word-additions.json'
import { todayDayNumber } from '../shared/share'

export interface CircuitPuzzle {
  /** 12 letters; arcs are indices 0-2, 3-5, 6-8, 9-11 */
  l: string
  /** number of accepted words */
  n: number
  /** Published word target, preserved when accepted vocabulary grows. */
  par: number
  words: string[]
  /** one published covering chain */
  sol: string[]
}

/** Editorial correction: PLUM is an ordinary word omitted by the original web-frequency list. */
const SUPPLEMENTAL_WORDS = ['plum']
const WORD_ADDITIONS = additionsData as string[]
const letterMask = (word:string):number => {let bits=0;for(const ch of word)bits|=1<<(ch.charCodeAt(0)-97);return bits}
const WORD_MASKS = new Uint32Array(WORD_ADDITIONS.map(letterMask))
export function withReviewedWords(puzzle: CircuitPuzzle): CircuitPuzzle {
  const original = new Set(puzzle.words), additions = new Set<string>(), allowed = letterMask(puzzle.l)
  const arcs = new Int8Array(26).fill(-1)
  for(let i=0;i<puzzle.l.length;i++)arcs[puzzle.l.charCodeAt(i)-97]=arcOf(i)
  const consider=(word:string)=>{
    if(original.has(word))return
    let previous=-1
    for(const ch of word){const arc=arcs[ch.charCodeAt(0)-97];if(arc===undefined||arc<0||arc===previous)return;previous=arc}
    additions.add(word)
  }
  for(const word of SUPPLEMENTAL_WORDS)consider(word)
  for(let i=0;i<WORD_ADDITIONS.length;i++)if((WORD_MASKS[i]&~allowed)===0)consider(WORD_ADDITIONS[i])
  return additions.size ? { ...puzzle, words: [...puzzle.words, ...additions].sort(), n: puzzle.words.length + additions.size } : puzzle
}
const PUZZLES = puzzlesData as CircuitPuzzle[]
const REVIEWED = new Map<number,CircuitPuzzle>()
function puzzleAt(index:number):CircuitPuzzle{
  let puzzle=REVIEWED.get(index)
  if(!puzzle){puzzle=withReviewedWords(PUZZLES[index]);REVIEWED.set(index,puzzle)}
  return puzzle
}

export function dailyCircuit(dayNumber = todayDayNumber()): { puzzle: CircuitPuzzle; puzzleNo: number } {
  const idx = publishedDailyIndex(dayNumber, PUZZLES.length, 286)
  return { puzzle: puzzleAt(idx), puzzleNo: idx + 1 }
}

export function practiceCircuit(excludeNo = -1): { puzzle: CircuitPuzzle; puzzleNo: number } {
  const idx = choosePracticeIndex('kimi-circuit', PUZZLES.length, excludeNo)
  return { puzzle: puzzleAt(idx), puzzleNo: idx + 1 }
}

export const ARC_COLORS = ['hsl(24 92% 58%)', 'hsl(145 55% 52%)', 'hsl(200 82% 60%)', 'hsl(275 58% 60%)']
export const ARC_EDGES = ['hsl(20 85% 43%)', 'hsl(145 60% 37%)', 'hsl(205 75% 44%)', 'hsl(275 60% 42%)']

export function arcOf(i: number): number {
  return Math.floor(i / 3)
}

export function medalForChain(wordsUsed: number, par: number, gaveUp: boolean): { icon: string; label: string } {
  if (gaveUp) return { icon: '⬛', label: 'Route revealed' }
  if (wordsUsed <= par) return { icon: '🥇', label: 'Gold — target met!' }
  if (wordsUsed === par + 1) return { icon: '🥈', label: 'Silver — 1 over target' }
  if (wordsUsed === par + 2) return { icon: '🥉', label: 'Bronze — 2 over target' }
  return { icon: '✅', label: 'Circuit complete' }
}

export function buildCircuitShare(puzzleNo: number, wordsUsed: number, par: number, gaveUp: boolean): string {
  const medal = medalForChain(wordsUsed, par, gaveUp)
  const cells = gaveUp ? '⬛'.repeat(12) : '🟧🟧🟧🟩🟩🟩🟦🟦🟦🟪🟪🟪'
  return `CIRCUIT No.${puzzleNo}\n${medal.icon} ${wordsUsed} word${wordsUsed === 1 ? '' : 's'} · target ${par}\n${cells}`
}
