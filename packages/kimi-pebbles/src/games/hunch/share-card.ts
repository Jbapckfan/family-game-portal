import {dateForDayNumber} from '../shared/integration'
import type {Eval} from './engine'
export interface HunchShareInput {mode:'daily'|'practice';puzzleNo:number;dayNumber:number;evals:readonly(readonly Eval[])[];won:boolean;hintsUsed:number}
export interface HunchShareResult {edition:string;date:string;headline:string;score:string;used:number;won:boolean;assisted:boolean;hintsUsed:number;rows:readonly(readonly Eval[])[];caption:string;filename:string}
export function buildHunchShareResult(input:HunchShareInput):Readonly<HunchShareResult>{
 const {mode,won,hintsUsed}=input,grid=input.evals
 if(!['daily','practice'].includes(mode)||typeof won!=='boolean'||!Number.isSafeInteger(hintsUsed)||hintsUsed<0||hintsUsed>5||!Array.isArray(grid)||grid.length<1||grid.length>6||grid.some(row=>!Array.isArray(row)||row.length!==5||row.some(e=>!['correct','present','absent'].includes(e))))throw new TypeError('A valid completed Hunch result is required')
 const solved=grid.map((row:readonly Eval[])=>row.every(e=>e==='correct'))
 if(solved.slice(0,-1).some(Boolean)||won!==solved.at(-1)||(!won&&grid.length!==6))throw new TypeError('Result does not match the completed guesses')
 let date='Your practice round'
 if(mode==='daily'){
  if(!Number.isSafeInteger(input.puzzleNo)||input.puzzleNo<1||!Number.isSafeInteger(input.dayNumber)||input.dayNumber<0)throw new TypeError('Invalid played edition')
  date=dateForDayNumber(input.dayNumber);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new TypeError('Invalid played date')
 }
 const edition=mode==='daily'?`DAILY #${String(input.puzzleNo).padStart(3,'0')}`:'PRACTICE',used=grid.length,score=won?`${used}/6`:'X/6',assisted=hintsUsed>0
 const headline=won?(used===1?'First-guess solve':used===6?'Found on the last guess':'Hunch solved'):'Not solved this round'
 const rows=Object.freeze(grid.map(row=>Object.freeze([...row])))
 const pattern=rows.map(row=>row.map(e=>e==='correct'?'🟩':e==='present'?'🟨':'⬛').join('')).join('\n')
 const caption=['Alford Daily · HUNCH',mode==='daily'?`${edition} · ${date}`:edition,`${headline} · ${score}`,assisted?'Clue used':'No clue used',pattern].join('\n')
 return Object.freeze({edition,date,headline,score,used,won,assisted,hintsUsed,rows,caption,filename:`alford-hunch-${mode==='daily'?date:'practice'}`})
}
export type HunchCardFormat='portrait'|'square'
export function drawHunchShareCard(canvas:HTMLCanvasElement,result:Readonly<HunchShareResult>,format:HunchCardFormat){
 const square=format==='square';canvas.width=1080;canvas.height=square?1080:1350
 const c=canvas.getContext('2d');if(!c)throw new Error('Image drawing unavailable')
 const h=canvas.height;c.fillStyle='#f7f4ec';c.fillRect(0,0,1080,h);c.strokeStyle='#bfd0e6';c.lineWidth=2;c.strokeRect(36,36,1008,h-72);c.textAlign='center'
 const text=(s:string,y:number,font:string,color='#253742')=>{c.fillStyle=color;c.font=font;let size=Number(/(\d+)px/.exec(font)?.[1]||30);while(c.measureText(s).width>920&&size>18){size--;c.font=font.replace(/\d+px/,`${size}px`)}c.fillText(s,540,y)}
 text('ALFORD DAILY',90,'600 26px "DM Sans",sans-serif');text('Hunch',square?168:190,'70px "DM Serif Display",serif','#287d8a');text(result.edition,square?208:238,'600 22px "DM Sans",sans-serif','#52667a')
 const cell=square?44:50,gap=square?9:12,left=540-(cell*5+gap*4)/2,top=(square?250:310)+(6-result.rows.length)*(cell+gap)/2
 result.rows.forEach((row,r)=>row.forEach((e,i)=>{const x=left+i*(cell+gap),y=top+r*(cell+gap);c.fillStyle=e==='correct'?'#216971':e==='present'?'#f1c86d':'#52667a';c.beginPath();if(typeof c.roundRect==='function')c.roundRect(x,y,cell,cell,8);else c.rect(x,y,cell,cell);c.fill();c.fillStyle=e==='present'?'#253742':'#fff';c.font='600 24px "DM Sans",sans-serif';c.fillText(e==='correct'?'✓':e==='present'?'↔':'·',x+cell/2,y+cell*.69)}))
 text(result.score,square?670:825,'80px "DM Serif Display",serif');text('GUESSES',square?711:870,'22px "DM Sans",sans-serif','#52667a');text(result.headline,square?788:984,'48px "DM Serif Display",serif');text(result.assisted?'Clue used':'No clue used',square?839:1044,'26px "DM Sans",sans-serif','#52667a');text(result.date,h-139,'24px "DM Sans",sans-serif','#52667a');text('Five letters. Follow your hunch.',h-91,'22px "DM Sans",sans-serif','#52667a')
}
