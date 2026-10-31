import { dateForDayNumber } from '../shared/integration'

export interface MorphShareInput {
  mode: 'daily' | 'practice'
  puzzleNo: number
  dayNumber: number
  moves: number
  suggested: number
  misses: number
  hintsUsed: number
  gaveUp: boolean
}
export interface MorphShareResult {
  edition: string
  date: string
  headline: string
  pace: string
  moves: number
  suggested: number
  misses: number
  hintsUsed: number
  gaveUp: boolean
  assisted: boolean
  caption: string
  filename: string
}
export function buildMorphShareResult(input: MorphShareInput): Readonly<MorphShareResult> {
  const { mode, moves, suggested, misses, hintsUsed, gaveUp } = input
  if (!['daily','practice'].includes(mode) || typeof gaveUp !== 'boolean' ||
    [moves,suggested,misses,hintsUsed].some(n => !Number.isSafeInteger(n) || n < 0 || n > 1_000_000) || suggested === 0 || (!gaveUp && moves === 0)) {
    throw new TypeError('A valid completed or revealed ladder is required.')
  }
  let date = 'Your practice round'
  if (mode === 'daily') {
    if (!Number.isSafeInteger(input.puzzleNo) || input.puzzleNo < 1 || !Number.isSafeInteger(input.dayNumber) || input.dayNumber < 0) throw new TypeError('Invalid played edition.')
    date = dateForDayNumber(input.dayNumber)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError('Invalid played date.')
  }
  const headline = gaveUp ? 'Route revealed' : 'Ladder complete'
  const pace = gaveUp ? 'Not completed' : moves <= suggested ? 'Gold · suggested pace met'
    : moves === suggested + 1 ? 'Silver · 1 over suggestion'
      : moves === suggested + 2 ? 'Bronze · 2 over suggestion' : 'Finished'
  const assisted = hintsUsed > 0
  const edition = mode === 'daily' ? `DAILY #${String(input.puzzleNo).padStart(3,'0')}` : 'PRACTICE'
  const moveText = `${moves} ${moves === 1 ? 'move' : 'moves'}${gaveUp ? ' before reveal' : ''}`
  const caption = ['Alford Daily · MORPH', mode === 'daily' ? `${edition} · ${date}` : edition,
    `${headline} · ${moveText}`, `Suggested ${suggested} moves${gaveUp ? '' : ` · ${pace}`}`,
    `${misses} ${misses === 1 ? 'miss' : 'misses'} · ${assisted ? 'Assisted · route shown' : 'No route hint'}`].join('\n')
  return Object.freeze({ edition,date,headline,pace,moves,suggested,misses,hintsUsed,gaveUp,assisted,caption,filename:`alford-morph-${mode === 'daily' ? date : 'practice'}` })
}

export type MorphCardFormat = 'portrait' | 'square'
export function drawMorphShareCard(canvas: HTMLCanvasElement, result: Readonly<MorphShareResult>, format: MorphCardFormat) {
  canvas.width = 1080
  canvas.height = format === 'portrait' ? 1350 : 1080
  const c = canvas.getContext('2d')
  if (!c) throw new Error('Image drawing is unavailable.')
  const square = format === 'square', height = canvas.height
  c.fillStyle = '#f7f4ec'; c.fillRect(0,0,1080,height)
  c.strokeStyle = '#bfd0e6'; c.lineWidth = 2; c.strokeRect(36,36,1008,height-72); c.textAlign = 'center'
  const text = (value: string, y: number, font: string, color = '#253742') => {
    c.fillStyle = color; c.font = font
    let size = Number(/(\d+)px/.exec(font)?.[1] || 30)
    while (c.measureText(value).width > 920 && size > 18) { size--; c.font = font.replace(/\d+px/,`${size}px`) }
    c.fillText(value,540,y)
  }
  text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif')
  text('Morph',202,'70px "DM Serif Display",serif','#315dc2')
  text(result.edition,251,'600 22px "DM Sans",sans-serif','#52667a')
  // Four identical marks represent the four-letter game, never the actual route.
  for (let i=0;i<4;i++) { c.fillStyle = result.gaveUp ? '#71808c' : '#315dc2'; c.beginPath(); c.roundRect(332+i*112,square?320:400,80,80,14); c.fill() }
  text(String(result.moves),square?550:680,'80px "DM Serif Display",serif')
  text(result.gaveUp?'MOVES BEFORE REVEAL':'MOVES',square?600:730,'22px "DM Sans",sans-serif','#52667a')
  text(result.headline,square?695:875,'54px "DM Serif Display",serif')
  text(`Suggested ${result.suggested} moves`,square?750:935,'28px "DM Sans",sans-serif','#52667a')
  text(result.gaveUp ? 'Not completed' : result.pace,square?803:995,'28px "DM Sans",sans-serif')
  text(`${result.misses} ${result.misses===1?'miss':'misses'} · ${result.assisted?'Assisted · route shown':'No route hint'}`,square?855:1055,'26px "DM Sans",sans-serif','#52667a')
  text(result.date,height-139,'24px "DM Sans",sans-serif','#52667a')
  text('One letter changes the way.',height-91,'22px "DM Sans",sans-serif','#52667a')
}
