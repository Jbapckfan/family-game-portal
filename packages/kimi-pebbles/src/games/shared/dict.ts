import text from '@/games/cairn/data/dict.txt?raw'

let words: Set<string> | null = null
export function loadDict(): Promise<Set<string>> {
  words ??= new Set(text.split(/\r?\n/).filter(Boolean))
  return Promise.resolve(words)
}
export function isValidWord(word: string): boolean { return words?.has(word) ?? false }
