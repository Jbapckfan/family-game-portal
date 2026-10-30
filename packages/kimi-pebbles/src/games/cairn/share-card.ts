import type { LevelResult } from './engine'
import { dateForDayNumber } from '../shared/integration'

export interface CairnShareInput {
  mode: 'daily' | 'practice'; puzzleNo: number; dayNumber: number; results: LevelResult[]
}
export interface CairnShareResult {
  mode: 'daily' | 'practice'; edition: string; date: string; headline: string
  solved: number; clean: number; assisted: number; skipped: number; misses: number; hints: number
  caption: string; filename: string
}
export function buildCairnShareResult(input: CairnShareInput): Readonly<CairnShareResult> {
  const {mode,results}=input
  if(!['daily','practice'].includes(mode)||!Array.isArray(results)||results.length!==5
    ||results.some(r=>!r||!['clean','messy','skipped'].includes(r.status)||!Number.isSafeInteger(r.misses)||r.misses<0||!Number.isSafeInteger(r.hints)||r.hints<0||(r.status==='clean'&&(r.misses!==0||r.hints!==0))))throw new TypeError('A valid finished stack is required.')
  let date='Your practice round'
  if(mode==='daily'){
    if(!Number.isSafeInteger(input.puzzleNo)||input.puzzleNo<1||!Number.isSafeInteger(input.dayNumber)||input.dayNumber<0)throw new TypeError('Invalid played edition.')
    date=dateForDayNumber(input.dayNumber)
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new TypeError('Invalid played date.')
  }
  const count=(status:LevelResult['status'])=>results.filter(r=>r.status===status).length
  const clean=count('clean'),assisted=count('messy'),skipped=count('skipped'),solved=clean+assisted
  const misses=results.reduce((n,r)=>n+r.misses,0),hints=results.reduce((n,r)=>n+r.hints,0)
  if(!Number.isSafeInteger(misses)||!Number.isSafeInteger(hints))throw new TypeError('Invalid totals.')
  const headline=clean===5?'Perfect summit':solved===5?'Summit reached':'Stack finished'
  const edition=mode==='daily'?`DAILY #${String(input.puzzleNo).padStart(3,'0')}`:'PRACTICE'
  const caption=['Alford Daily · CAIRN',mode==='daily'?`${edition} · ${date}`:edition,`${clean===5?'Perfect · ':''}${solved} of 5 levels solved${skipped?` · ${skipped} shown`:''}`,`${misses} ${misses===1?'miss':'misses'} · ${hints} ${hints===1?'nudge':'nudges'}`].join('\n')
  return Object.freeze({mode,edition,date,headline,solved,clean,assisted,skipped,misses,hints,caption,filename:`alford-cairn-${mode==='daily'?date:'practice'}`})
}

export type CairnCardFormat='portrait'|'square'
export function drawCairnShareCard(canvas:HTMLCanvasElement,result:Readonly<CairnShareResult>,format:CairnCardFormat){
  canvas.width=1080;canvas.height=format==='portrait'?1350:1080
  const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing is unavailable.')
  const square=format==='square',height=canvas.height
  c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,height);c.strokeStyle='#bfd0e6';c.lineWidth=2;c.strokeRect(36,36,1008,height-72);c.textAlign='center'
  const text=(value:string,y:number,font:string,color='#253742')=>{
    c.fillStyle=color;c.font=font;let size=Number(/(\d+)px/.exec(font)?.[1]||30)
    while(c.measureText(value).width>920&&size>18){size--;c.font=font.replace(/\d+px/,`${size}px`)}c.fillText(value,540,y)
  }
  text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');text('Cairn',202,'70px "DM Serif Display",serif','#315dc2');text(result.edition,251,'600 22px "DM Sans",sans-serif','#52667a')
  // Five identical marks show the game length, never a per-level status pattern.
  for(let i=0;i<5;i++){c.fillStyle=result.solved===5?'#315dc2':'#71808c';c.beginPath();c.roundRect(276+i*112,square?330:420,80,80,14);c.fill()}
  text(`${result.solved} / 5`,square?580:720,'70px "DM Serif Display",serif');text('LEVELS SOLVED',square?627:767,'22px "DM Sans",sans-serif','#52667a')
  text(result.headline,square?735:910,'54px "DM Serif Display",serif');text(`${result.misses} ${result.misses===1?'miss':'misses'}  ·  ${result.hints} ${result.hints===1?'nudge':'nudges'}${result.skipped?`  ·  ${result.skipped} shown`:''}`,square?800:980,'30px "DM Sans",sans-serif')
  text(result.date,height-139,'24px "DM Sans",sans-serif','#52667a');text('One more letter. One level higher.',height-91,'22px "DM Sans",sans-serif','#52667a')
}
