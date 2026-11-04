// Receipts, rather than a local write, are the proof of successful submission.
export const validFeedbackId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
export function newFeedbackId(crypto){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const h=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export async function sendFeedback(note,win=window){
 if(!validFeedbackId(note.id))throw Error('Invalid feedback identifier');
 const url=new URL('/api/feedback',win.location.href);
 if(!['http:','https:'].includes(url.protocol)||typeof win.fetch!=='function')throw Error('Feedback needs an online connection to the hosted site');
 const controller=new win.AbortController(),timer=win.setTimeout(()=>controller.abort(),10000);
 try{
  const response=await win.fetch.call(win,url.href,{method:'POST',credentials:'same-origin',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:note.id,slug:note.gameId,text:note.text}),signal:controller.signal});
  if(!response.ok)throw Error('Feedback was not received');
  const result=await response.json(),receipt=result?.receipt;
  if(result?.received!==true||receipt?.id!==note.id.toLowerCase()||typeof receipt.receivedAt!=='string'||!Number.isFinite(Date.parse(receipt.receivedAt)))throw Error('Feedback receipt could not be verified');
  return receipt;
 }finally{win.clearTimeout(timer);}
}
