/** Ephemeral pointer interaction. This controller never scores or saves a game. */
export function installPlacementDrag(api) {
  const {bank,board}=api,doc=bank.ownerDocument,win=doc.defaultView;
  let pending=null,active=null,target=null,frame=0,suppressed=null;
  const settling=new Map();
  const sameSession=session=>{const now=api.getSession();return now.playing&&now.key===session.key&&now.revision===session.revision;};
  const available=id=>api.getSession().playing&&api.isAvailable(id);
  function suppress(pointer){suppressed={id:pointer.id,x:pointer.x,y:pointer.y,until:win.performance.now()+650};}
  function clearTarget(){
    if(!target)return;
    target.element.classList.remove('drag-target');delete target.element.dataset.dragPair;
    target.rowElement?.classList.remove('drag-hover-row');
    target.line?.classList.remove('drag-word-open');target.wordElement?.remove();target=null;
  }
  function clearVisuals(){
    clearTarget();bank.classList.remove('is-dragging');doc.body.classList.remove('pair-dragging');
    bank.querySelectorAll('.drag-source').forEach(n=>n.classList.remove('drag-source'));
  }
  function release(pointer){try{if(bank.hasPointerCapture?.(pointer.id))bank.releasePointerCapture(pointer.id);}catch{}}
  function settle(ghost,rect){
    if(!ghost)return;
    if(api.reducedMotion()||!ghost.animate||!rect){ghost.remove();return;}
    const from=ghost.getBoundingClientRect();
    const animation=ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${rect.x+rect.width/2-from.x-from.width/2}px,${rect.y+rect.height/2-from.y-from.height/2}px) scale(.65)`,opacity:0}],{duration:210,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
    settling.set(ghost,animation);
    animation.finished.catch(()=>{}).finally(()=>{ghost.remove();settling.delete(ghost);});
  }
  function cancel(){
    const pointer=active;active=null;pending=null;
    if(frame)win.cancelAnimationFrame(frame);frame=0;
    clearVisuals();
    if(pointer){suppress(pointer);pointer.ghost.remove();release(pointer);if(sameSession(pointer.session)&&typeof pointer.restore==='function')pointer.restore();}
    for(const [node,animation] of settling){animation.cancel();node.remove();}settling.clear();
  }
  function locate(x,y){
    const element=doc.elementFromPoint(x,y)?.closest?.('.gap[data-row][data-gap]');
    if(!element||!board.contains(element)||element.disabled)return null;
    const row=Number(element.dataset.row),gap=Number(element.dataset.gap);
    if(!Number.isInteger(row)||row<0||!Number.isInteger(gap)||gap<0||gap>4)return null;
    const word=api.getWord(row,active.tileId,gap);
    return typeof word==='string'&&/^[A-Z]{6}$/.test(word)?{element,row,gap,word}:null;
  }
  function hover(){
    if(!active)return;
    const next=locate(active.x,active.y);
    if(next?.element===target?.element)return;
    clearTarget();if(!next)return;
    const rowElement=next.element.closest('.word-row'),line=next.element.closest('.word-line');
    const wordElement=doc.createElement('div');wordElement.className='drag-word';wordElement.setAttribute('aria-hidden','true');
    [...next.word].forEach((letter,index)=>{const span=doc.createElement('span');span.className='drag-letter'+(index>=next.gap&&index<next.gap+2?' inserted':'');span.textContent=letter;span.style.setProperty('--arrival',`${index*18}ms`);wordElement.append(span);});
    next.element.dataset.dragPair=active.letters;next.element.classList.add('drag-target');
    rowElement?.classList.add('drag-hover-row');line?.classList.add('drag-word-open');line?.append(wordElement);
    target={...next,rowElement,line,wordElement};
  }
  function position(){if(active){active.ghost.style.left=`${Math.max(8,Math.min(win.innerWidth-84,active.x-38))}px`;active.ghost.style.top=`${Math.max(8,Math.min(win.innerHeight-64,active.pointerType==='touch'?active.y-120:active.y+18))}px`;}}
  function tick(){
    frame=0;if(!active)return;
    if(!sameSession(active.session)||!available(active.tileId)){cancel();return;}
    const edge=76,card=active.stickyBank?.getBoundingClientRect(),start=card&&card.top<=12?card.bottom:0;
    const top=active.y>=start&&active.y<start+edge?-Math.ceil((start+edge-active.y)/edge*14):active.y>win.innerHeight-edge?Math.ceil((active.y-win.innerHeight+edge)/edge*14):0;
    if(top){try{win.scrollBy({top,behavior:'auto'});}catch{}}
    hover();frame=win.requestAnimationFrame(tick);
  }
  function begin(event){
    const pointer=pending;if(!pointer||!sameSession(pointer.session)||!available(pointer.tileId)){cancel();return;}
    const letters=api.getLetters(pointer.tileId);if(!/^[A-Z]{2}$/.test(letters)){cancel();return;}
    // Capture on the stable bank before selecting replaces its child buttons.
    try{bank.setPointerCapture(pointer.id);}catch{}
    active={...pointer,letters,x:event.clientX,y:event.clientY,ghost:doc.createElement('div')};pending=null;
    active.restore=api.selectPair(active.tileId);
    if(!active)return;
    const card=bank.closest('.bank-card');active.stickyBank=card&&win.getComputedStyle(card).position==='sticky'?card:null;
    active.ghost.className='pair-drag-ghost';active.ghost.setAttribute('aria-hidden','true');
    for(const letter of letters){const span=doc.createElement('span');span.textContent=letter;active.ghost.append(span);}
    doc.body.append(active.ghost);bank.classList.add('is-dragging');doc.body.classList.add('pair-dragging');
    bank.querySelector(`[data-tile="${active.tileId}"]`)?.classList.add('drag-source');
    position();hover();frame=win.requestAnimationFrame(tick);
  }
  function down(event){
    if(event.isPrimary===false||event.button!==0||pending||active)return;
    const button=event.target.closest?.('[data-tile]');
    if(!button||!bank.contains(button)||button.disabled||!available(button.dataset.tile))return;
    cancel();pending={id:event.pointerId,pointerType:event.pointerType,tileId:button.dataset.tile,x:event.clientX,y:event.clientY,session:api.getSession()};
  }
  function move(event){
    if(pending&&event.pointerId===pending.id&&Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>=8)begin(event);
    if(!active||event.pointerId!==active.id)return;
    if(event.pointerType==='mouse'&&event.buttons===0){cancel();return;}
    event.preventDefault();active.x=event.clientX;active.y=event.clientY;position();hover();
  }
  function up(event){
    if(pending&&event.pointerId===pending.id){pending=null;return;}
    if(!active||event.pointerId!==active.id)return;
    event.preventDefault();
    if(!sameSession(active.session)||!available(active.tileId)){cancel();return;}
    active.x=event.clientX;active.y=event.clientY;hover();
    const pointer=active,drop=target?{tileId:pointer.tileId,row:target.row,gap:target.gap}:null;
    active=null;pending=null;if(frame)win.cancelAnimationFrame(frame);frame=0;suppress(pointer);clearVisuals();release(pointer);
    if(drop&&api.previewDrop(drop)!==false){
      const destination=board.querySelector(`[data-row="${drop.row}"][data-gap="${drop.gap}"]`);
      settle(pointer.ghost,destination?.getBoundingClientRect());
    }else {if(sameSession(pointer.session)&&typeof pointer.restore==='function')pointer.restore();settle(pointer.ghost,bank.querySelector(`[data-tile="${pointer.tileId}"]`)?.getBoundingClientRect());}
  }
  function pointerCancel(event){if((active||pending)?.id===event.pointerId)cancel();}
  function lost(event){if(event.target===bank&&active?.id===event.pointerId)cancel();}
  function click(event){
    if(!suppressed||event.detail===0||win.performance.now()>suppressed.until)return;
    if(Math.hypot(event.clientX-suppressed.x,event.clientY-suppressed.y)>6)return;
    if(event.pointerId>0&&event.pointerId!==suppressed.id)return;
    event.preventDefault();event.stopImmediatePropagation();suppressed=null;
  }
  function key(event){if(event.key==='Escape'&&(active||pending)){event.preventDefault();event.stopImmediatePropagation();cancel();}}
  function nextPointer(){suppressed=null;}
  function visibility(){if(doc.hidden)cancel();}
  const nativeDrag=event=>event.preventDefault();
  bank.addEventListener('pointerdown',down);bank.addEventListener('lostpointercapture',lost);bank.addEventListener('dragstart',nativeDrag);
  doc.addEventListener('pointerdown',nextPointer,true);doc.addEventListener('pointermove',move,{passive:false});doc.addEventListener('pointerup',up,{passive:false});doc.addEventListener('pointercancel',pointerCancel);doc.addEventListener('click',click,true);doc.addEventListener('keydown',key,true);doc.addEventListener('visibilitychange',visibility);win.addEventListener('blur',cancel);win.addEventListener('pagehide',cancel);win.addEventListener('resize',cancel);
  return {cancel,destroy(){cancel();bank.removeEventListener('pointerdown',down);bank.removeEventListener('lostpointercapture',lost);bank.removeEventListener('dragstart',nativeDrag);doc.removeEventListener('pointerdown',nextPointer,true);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',pointerCancel);doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',key,true);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('blur',cancel);win.removeEventListener('pagehide',cancel);win.removeEventListener('resize',cancel);}};
}
