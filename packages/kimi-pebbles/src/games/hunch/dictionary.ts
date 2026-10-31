import guesses from './data/guesses.json'
const words=new Set<string>(guesses)
export function loadDict():Promise<Set<string>> { return Promise.resolve(words) }
export function isValidWord(word:string):boolean { return /^[a-z]{5}$/.test(word)&&words.has(word) }
