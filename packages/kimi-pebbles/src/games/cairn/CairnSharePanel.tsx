import { useEffect, useRef, useState } from 'react'
import { drawCairnShareCard, type CairnCardFormat, type CairnShareResult } from './share-card'

interface Props { result:Readonly<CairnShareResult>; onBack:()=>void }
interface Prepared {blob:Blob;file:File;format:CairnCardFormat}
export function CairnSharePanel({result,onBack}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),caption=useRef<HTMLTextAreaElement>(null),mounted=useRef(false)
  const [format,setFormat]=useState<CairnCardFormat>('portrait'),[prepared,setPrepared]=useState<Prepared|null>(null)
  const [status,setStatus]=useState('Preparing your image…'),[manual,setManual]=useState(false),[sharing,setSharing]=useState(false)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  useEffect(()=>{
    let current=true;setPrepared(null);setStatus('Preparing your image…')
    const prepare=async()=>{
      try{
        await Promise.all(['400 70px "DM Serif Display"','400 30px "DM Sans"','600 26px "DM Sans"'].map(font=>document.fonts.load(font)))
        const element=canvas.current;if(!current||!element)return
        drawCairnShareCard(element,result,format)
        const blob=await new Promise<Blob>((resolve,reject)=>element.toBlob(value=>value?resolve(value):reject(new Error('Image unavailable')),'image/png'))
        if(!current)return
        setPrepared({blob,file:new File([blob],`${result.filename}-${format}.png`,{type:'image/png'}),format});setStatus('Your result is ready. No letters or answers are included.')
      }catch{if(current)setStatus('Image unavailable here. You can still copy or select your caption.')}
    }
    void prepare();return()=>{current=false}
  },[format,result])
  let canShare=false
  try{canShare=Boolean(prepared&&typeof navigator.share==='function'&&navigator.canShare?.({files:[prepared.file]}))}catch{canShare=false}
  const selectFormat=(next:CairnCardFormat)=>{if(next!==format){setPrepared(null);setStatus('Preparing your image…');setFormat(next)}}
  const share=async()=>{
    if(!prepared||sharing||!canShare)return
    setSharing(true)
    try{await navigator.share({title:'Cairn result',text:result.caption,files:[prepared.file]});if(mounted.current)setStatus('Result shared.')}
    catch(error){if(mounted.current)setStatus(error instanceof DOMException&&error.name==='AbortError'?'Sharing cancelled. Your image is still ready.':'Unable to share here. Download the image and copy its caption.')}
    finally{if(mounted.current)setSharing(false)}
  }
  const download=()=>{
    if(!prepared)return
    const url=URL.createObjectURL(prepared.blob),link=document.createElement('a');link.href=url;link.download=`${result.filename}-${prepared.format}.png`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const copy=async()=>{
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(result.caption);if(mounted.current)setStatus('Caption copied.')}
    catch{if(!mounted.current)return;setManual(true);setStatus('Select and copy the caption below.');requestAnimationFrame(()=>{if(caption.current?.isConnected){caption.current.focus();caption.current.select()}})}
  }
  return <div className="cairn-share-panel">
    <div className="cairn-share-formats" role="group" aria-label="Image format">
      <button type="button" aria-pressed={format==='portrait'} onClick={()=>selectFormat('portrait')}>Portrait · 4:5</button>
      <button type="button" aria-pressed={format==='square'} onClick={()=>selectFormat('square')}>Square · 1:1</button>
    </div>
    <canvas ref={canvas} role="img" aria-label={`Cairn ${result.edition}, ${result.date}. ${result.headline}. ${result.solved} of 5 levels solved, ${result.misses} misses, ${result.hints} nudges.`}/>
    <p className="cairn-share-status" role="status">{status}</p>
    <div className="cairn-share-actions">
      <button type="button" className="btn3d btn3d-accent" disabled={!canShare||sharing} onClick={()=>void share()}>Share image</button>
      <button type="button" className="btn3d btn3d-soft" disabled={!prepared} onClick={download}>Download PNG</button>
      <button type="button" className="btn3d btn3d-soft" onClick={()=>void copy()}>Copy caption</button>
    </div>
    <details open={manual} onToggle={event=>setManual(event.currentTarget.open)}><summary>Select caption manually</summary><textarea ref={caption} readOnly aria-label="Your spoiler-free caption" value={result.caption}/></details>
    <button type="button" className="cairn-share-back" onClick={onBack}>Back to results</button>
  </div>
}
