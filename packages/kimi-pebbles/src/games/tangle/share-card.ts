import { dateForDayNumber } from '../shared/integration'

export interface TangleShareInput {
  mode:'daily'|'practice'; puzzleNo:number; dayNumber:number; boardSize?:4|5
  score:number; maxScore:number; wordCount:number; totalWords:number
  targets:[number,number,number]; misses:number; hintsUsed:number
}
export interface TangleShareResult {
  edition:string; date:string; headline:string; medal:string; boardSize:4|5
  score:number; maxScore:number; goldTarget:number; wordCount:number; totalWords:number
  misses:number; hintsUsed:number; assisted:boolean; goldReached:boolean; caption:string; filename:string
}
export function buildTangleShareResult(input:TangleShareInput):Readonly<TangleShareResult> {
  const {mode,score,maxScore,wordCount,totalWords,misses,hintsUsed,targets}=input
  const boardSize=input.boardSize??4
  if (![4,5].includes(boardSize) || (boardSize===5 && mode!=='practice')) throw new TypeError('The five-wide sample is a preview, not a daily edition.')
  if (!['daily','practice'].includes(mode) || [score,maxScore,wordCount,totalWords,misses,hintsUsed].some(n=>!Number.isSafeInteger(n)||n<0||n>1_000_000)
    || maxScore===0 || totalWords===0 || score>maxScore || wordCount>totalWords || score<wordCount || maxScore<totalWords
    || (score===0)!==(wordCount===0) || (score===maxScore)!==(wordCount===totalWords)
    || !Array.isArray(targets) || targets.length!==3 || targets.some((n,i)=>!Number.isSafeInteger(n)||n<1||n>maxScore||(i>0&&n<targets[i-1]))) throw new TypeError('Valid word-hunt progress is required.')
  let date=boardSize===5?'Sample board · Practice':'Your practice round'
  if(mode==='daily'){
    if(!Number.isSafeInteger(input.puzzleNo)||input.puzzleNo<1||!Number.isSafeInteger(input.dayNumber)||input.dayNumber<0)throw new TypeError('Invalid played edition.')
    date=dateForDayNumber(input.dayNumber)
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new TypeError('Invalid played date.')
  }
  const goldTarget=targets[2],goldReached=score>=goldTarget,assisted=hintsUsed>0
  const medal=goldReached?'Gold':score>=targets[1]?'Silver':score>=targets[0]?'Bronze':'No medal yet'
  const headline=wordCount===totalWords?'Every listed word found':goldReached?'Gold reached':'Hunt in progress'
  const edition=boardSize===5?'5×5 PREVIEW':mode==='daily'?`DAILY #${String(input.puzzleNo).padStart(3,'0')}`:'PRACTICE'
  const caption=['Alford Daily · TANGLE',mode==='daily'?`${edition} · ${date}`:edition,
    `${headline} · ${score} points`,`${wordCount}/${totalWords} words · Gold goal ${goldTarget}`,
    `${maxScore} points available · ${medal}`,`${misses} ${misses===1?'miss':'misses'} · ${assisted?'Clue used':'No clue used'}`].join('\n')
  return Object.freeze({edition,date,headline,medal,boardSize,score,maxScore,goldTarget,wordCount,totalWords,misses,hintsUsed,assisted,goldReached,caption,filename:`alford-tangle-${boardSize===5?'5x5-preview':mode==='daily'?date:'practice'}`})
}
export type TangleCardFormat='portrait'|'square'
export function drawTangleShareCard(canvas:HTMLCanvasElement,result:Readonly<TangleShareResult>,format:TangleCardFormat){
  canvas.width=1080;canvas.height=format==='portrait'?1350:1080
  const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing unavailable.')
  const square=format==='square',height=canvas.height;c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,height);c.strokeStyle='#bfd0e6';c.lineWidth=2;c.strokeRect(36,36,1008,height-72);c.textAlign='center'
  const text=(value:string,y:number,font:string,color='#253742')=>{c.fillStyle=color;c.font=font;let size=Number(/(\d+)px/.exec(font)?.[1]||30);while(c.measureText(value).width>920&&size>18){size--;c.font=font.replace(/\d+px/,`${size}px`)}c.fillText(value,540,y)}
  text('ALFORD DAILY',108,'600 26px "DM Sans",sans-serif');text('Tangle',202,'70px "DM Serif Display",serif','#287d8a');text(result.edition,251,'600 22px "DM Sans",sans-serif','#52667a')
  // Identical marks show only board size, never letters or the selected path.
  const size=result.boardSize,step=size===5?29:34,mark=size===5?20:24,start=540-((size-1)*step+mark)/2
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){c.fillStyle=result.goldReached?'#315dc2':'#287d8a';c.beginPath();c.roundRect(start+col*step,(square?300:340)+row*step,mark,mark,5);c.fill()}
  text(String(result.score),square?565:650,'80px "DM Serif Display",serif');text('POINTS',square?608:698,'22px "DM Sans",sans-serif','#52667a')
  text(result.headline,square?700:855,'52px "DM Serif Display",serif');text(`${result.wordCount} / ${result.totalWords} words found`,square?754:918,'30px "DM Sans",sans-serif')
  text(`Gold at ${result.goldTarget} · ${result.maxScore} points available`,square?804:980,'25px "DM Sans",sans-serif','#52667a')
  text(`${result.misses} ${result.misses===1?'miss':'misses'} · ${result.assisted?'Clue used':'No clue used'}`,square?855:1042,'26px "DM Sans",sans-serif','#52667a')
  text(result.date,height-139,'24px "DM Sans",sans-serif','#52667a');text('Follow a word. Find another.',height-91,'22px "DM Sans",sans-serif','#52667a')
}
