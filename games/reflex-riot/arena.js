/* Physical arena/material renderer. No game state, random numbers, timers or audio.
   Raster floor and material sprites are cached at capped DPR; trails are velocity based. */
(function (root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ReflexRiotArt=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const SKIN_BASE={neon:'#101f3e',candy:'#301b3d',space:'#171b3c',gold:'#29230f'};
  const SKIN_LIGHTS={neon:['#54dcec','#b785ff'],candy:['#ff91cb','#9be9ff'],space:['#b5a2ff','#72e6d0'],gold:['#f5cf70','#f5e9be']};
  function mix(a,b,t){
    const n=parseInt(a.slice(1),16),m=parseInt(b.slice(1),16);
    return '#'+[16,8,0].map(s=>Math.round(((n>>s)&255)*(1-t)+((m>>s)&255)*t).toString(16).padStart(2,'0')).join('');
  }
  function rounded(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
  function create(host){
    let width=1,height=1,ratio=1,skin='neon',dirty=true;
    const floor=host.createCanvas(),sprites=new Map(),trails=new Map();
    const image=host.createImage();
    image.onload=()=>{dirty=true;host.invalidate()};
    image.onerror=()=>{dirty=true;host.invalidate()};
    image.src='./assets/arena-floor.jpg';
    function resize(w,h,dpr){
      w=Math.max(1,w);h=Math.max(1,h);dpr=Math.min(2,Math.max(1,dpr||1));
      if(width===w&&height===h&&ratio===dpr)return;
      width=w;height=h;ratio=dpr;dirty=true;sprites.clear();trails.clear();
    }
    function setSkin(value){const next=SKIN_LIGHTS[value]?value:'neon';if(next!==skin){skin=next;dirty=true}}
    function cover(g,img,sx,sy,sw,sh,x,y,w,h){
      const z=Math.max(w/sw,h/sh),cw=w/z,ch=h/z;
      g.drawImage(img,sx+(sw-cw)/2,sy+(sh-ch)/2,cw,ch,x,y,w,h);
    }
    function buildFloor(){
      dirty=false;floor.width=Math.ceil(width*ratio);floor.height=Math.ceil(height*ratio);
      const g=floor.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);
      const metal=g.createLinearGradient(0,0,width,height);
      metal.addColorStop(0,'#3c4d59');metal.addColorStop(.12,'#18252e');metal.addColorStop(.85,'#0d1720');metal.addColorStop(1,'#4c5561');
      g.fillStyle=metal;g.fillRect(0,0,width,height);
      const b=Math.min(64,Math.min(width,height)*.12);
      if(image.complete&&image.naturalWidth){
        // Preserve the photographed corners. Extrude the straight metal rails;
        // crop the central surface proportionally so its material grain stays fine.
        const iw=image.naturalWidth,ih=image.naturalHeight,sx=iw*.18,sy=ih*.18;
        cover(g,image,sx,sy,iw-2*sx,ih-2*sy,b,b,width-2*b,height-2*b);
        for(const col of [0,1,2])for(const row of [0,1,2]){
          if(col===1&&row===1)continue;
          const x=[0,b,width-b][col],y=[0,b,height-b][row];
          const w=col===1?width-2*b:b,h=row===1?height-2*b:b;
          g.drawImage(image,[0,sx,iw-sx][col],[0,sy,ih-sy][row],col===1?iw-2*sx:sx,row===1?ih-2*sy:sy,x,y,w,h);
        }
      }else{
        const well=g.createRadialGradient(width*.46,height*.4,5,width*.5,height*.5,Math.max(width,height)*.7);
        well.addColorStop(0,'#293944');well.addColorStop(1,'#101820');g.fillStyle=well;
        rounded(g,b*.5,b*.5,width-b,height-b,18);g.fill();
        g.strokeStyle='#ffffff0b';g.lineWidth=1;
        for(let y=40;y<height;y+=64){g.beginPath();g.moveTo(20,y);g.lineTo(width-20,y-18);g.stroke()}
      }
      const lights=SKIN_LIGHTS[skin];
      g.save();rounded(g,b,b,width-2*b,height-2*b,10);g.clip();
      // A translucent enamel tint preserves the photographed grain while taking
      // the neutral grey surface down to the active skin's richer base tone.
      g.fillStyle=SKIN_BASE[skin]+'90';g.fillRect(b,b,width-2*b,height-2*b);
      const left=b+width*.035,right=width-left,top=Math.max(b+12,height*.15),bottom=height-Math.max(b+12,height*.13);
      const cx=width/2,cy=(top+bottom)/2,ring=Math.min(width*.15,height*.13);
      function court(){
        rounded(g,left,top,right-left,bottom-top,18);g.stroke();
        g.beginPath();g.moveTo(left,cy);g.lineTo(right,cy);g.stroke();
        g.beginPath();g.ellipse(cx,cy,ring,ring,0,0,Math.PI*2);g.stroke();
        g.setLineDash([5,13]);
        for(const x of [cx-(right-left)*.27,cx+(right-left)*.27]){g.beginPath();g.moveTo(x,top);g.lineTo(x,bottom);g.stroke()}
        g.setLineDash([]);
      }
      // Fine dark cuts with a restrained upper lip: surface etching, not cues.
      g.strokeStyle='#02091845';g.lineWidth=1.2;court();
      g.translate(0,-.65);g.strokeStyle='#c4e5ff14';g.lineWidth=.75;court();g.translate(0,.65);
      // Broad, static light pools originate beside both pairs of rail segments.
      // They are painted into this cache, never allocated or animated per frame.
      for(let side=0;side<2;side++)for(const y of [.32,.68]){
        g.save();g.translate(side?width-b*.7:b*.7,height*y);g.scale(width*.74,height*.43);
        const pool=g.createRadialGradient(0,0,0,0,0,1),color=lights[side];
        pool.addColorStop(0,color+'60');pool.addColorStop(.32,color+'38');pool.addColorStop(.72,color+'12');pool.addColorStop(1,color+'00');
        g.fillStyle=pool;g.fillRect(-1,-1,2,2);g.restore();
      }
      g.restore();
      const shade=g.createRadialGradient(width*.48,height*.4,10,width*.5,height*.5,Math.max(width,height)*.72);
      shade.addColorStop(0,'#07101800');shade.addColorStop(1,'#03060ca0');g.fillStyle=shade;g.fillRect(0,0,width,height);
      g.lineWidth=2;g.strokeStyle='#03070b';rounded(g,5,5,width-10,height-10,18);g.stroke();
      g.strokeStyle='#d5e5ec40';g.lineWidth=1;rounded(g,7,7,width-14,height-14,17);g.stroke();
      for(let side=0;side<2;side++){
        const x=side?width-10:10;
        g.strokeStyle=lights[side];g.shadowColor=lights[side];g.shadowBlur=7*ratio;g.lineWidth=2;
        g.beginPath();g.moveTo(x,height*.24);g.lineTo(x,height*.38);g.moveTo(x,height*.62);g.lineTo(x,height*.76);g.stroke();g.shadowBlur=0;
      }
    }
    function drawArena(g,fever){
      if(dirty)buildFloor();g.drawImage(floor,0,0,width,height);
      if(fever){g.fillStyle='rgba(137,43,126,.14)';g.fillRect(0,0,width,height)}
    }
    function path(g,kind,w,h,inset=0){
      if(kind==='stick'){rounded(g,-w/2+inset,-h/2+inset,w-2*inset,h-2*inset,(w-2*inset)/2);return}
      if(kind==='disc'){g.beginPath();g.arc(0,0,w/2-inset,0,Math.PI*2);return}
      g.beginPath();
      if(kind==='arrow'){
        g.moveTo(0,-h*.64);g.lineTo(w*.57,0);g.lineTo(w*.2,0);g.lineTo(w*.2,h*.6);g.lineTo(-w*.2,h*.6);g.lineTo(-w*.2,0);g.lineTo(-w*.57,0);
      }else for(let i=0;i<10;i++){
        const r=(i%2?.45:1)*(w/2-inset),a=-Math.PI/2+i*Math.PI/5,x=Math.cos(a)*r,y=Math.sin(a)*r;
        i?g.lineTo(x,y):g.moveTo(x,y);
      }
      g.closePath();
    }
    function material(kind,w,h,color){
      const key=`${kind}:${w.toFixed(2)}:${h.toFixed(2)}:${color}`;
      if(sprites.has(key))return sprites.get(key);
      const pad=kind==='arrow'?40:20,c=host.createCanvas();c.width=Math.ceil((w+2*pad)*ratio);c.height=Math.ceil((h+2*pad)*ratio);
      const g=c.getContext('2d');g.setTransform(ratio,0,0,ratio,(w/2+pad)*ratio,(h/2+pad)*ratio);
      // Soft contact shadow below the same silhouette, then a dark physical rim.
      g.save();g.translate(3,7);g.shadowColor='#000000b8';g.shadowBlur=9*ratio;g.fillStyle='#00000060';path(g,kind,w,h);g.fill();g.restore();
      g.fillStyle='#111b25';path(g,kind,w,h);g.fill();
      const paint=kind==='stick'?g.createLinearGradient(-w/2,0,w/2,0):g.createRadialGradient(-w*.19,-h*.22,0,0,0,w*.6);
      paint.addColorStop(0,mix(color,'#ffffff',.62));paint.addColorStop(.24,mix(color,'#ffffff',.22));paint.addColorStop(.62,color);paint.addColorStop(1,mix(color,'#08111d',.5));
      g.save();path(g,kind,w,h,kind==='arrow'?0:1.5);g.clip();g.fillStyle=paint;g.fillRect(-w,-h,w*2,h*2);
      // Broad softbox reflection and the dark rolled edge make the finish read at speed.
      const reflection=g.createLinearGradient(0,-h/2,0,h/2);reflection.addColorStop(0,'#ffffff59');reflection.addColorStop(.42,'#ffffff00');reflection.addColorStop(1,'#00000026');
      g.fillStyle=reflection;g.fillRect(-w,-h,w*2,h*2);g.restore();
      g.strokeStyle=mix(color,'#f5fbff',.48);g.lineWidth=1;path(g,kind,w,h,1);g.stroke();
      if(kind==='stick'){
        const collar=g.createLinearGradient(-w/2,0,w/2,0);collar.addColorStop(0,'#263644');collar.addColorStop(.35,'#e3edf0');collar.addColorStop(.65,'#a2b4be');collar.addColorStop(1,'#283c4b');
        g.fillStyle=collar;
        for(const y of [-h*.36,h*.36]){rounded(g,-w*.38,y,w*.76,Math.max(2.5,h*.025),1.5);g.fill()}
        g.fillStyle='#ffffff80';rounded(g,-w*.28,-h*.28,Math.max(1.5,w*.065),h*.48,1);g.fill();
      }else if(kind==='disc'){
        g.strokeStyle='#ffffff69';g.lineWidth=Math.max(1.5,w*.025);g.beginPath();g.arc(-w*.035,-h*.045,w*.36,Math.PI*1.04,Math.PI*1.64);g.stroke();
        g.strokeStyle='#060c204d';g.lineWidth=2;g.beginPath();g.arc(0,0,w*.44,.16*Math.PI,.84*Math.PI);g.stroke();
      }else{
        g.strokeStyle='#ffffff73';g.lineWidth=2;path(g,kind,w,h,2);g.stroke();
      }
      const sprite={canvas:c,w:c.width/ratio,h:c.height/ratio,x:-w/2-pad,y:-h/2-pad};
      if(sprites.size>=96)sprites.delete(sprites.keys().next().value);
      sprites.set(key,sprite);return sprite;
    }
    function drawMaterial(g,kind,w,h,color){const s=material(kind,w,h,color);g.drawImage(s.canvas,s.x,s.y,s.w,s.h)}
    function trail(color){
      if(trails.has(color))return trails.get(color);
      const c=host.createCanvas();c.width=48*ratio;c.height=160*ratio;const g=c.getContext('2d');g.scale(ratio,ratio);
      const light=g.createLinearGradient(0,0,0,160);light.addColorStop(0,color+'00');light.addColorStop(.5,color+'12');light.addColorStop(1,color+'75');
      g.lineCap='round';g.strokeStyle=light;
      for(const [x,start,line] of [[24,8,10],[12,48,3],[36,70,2]]){g.lineWidth=line;g.beginPath();g.moveTo(x,start);g.lineTo(x,158);g.stroke()}
      trails.set(color,c);return c;
    }
    function drawTrail(g,e,color,disabled){
      if(disabled)return;
      const vx=e.vx||0,vy=e.vy||0,speed=Math.hypot(vx,vy);if(speed<2)return;
      const half=e.h?e.h/2:e.r*.7,wide=e.w?e.w:e.r*.8,len=Math.min(90,speed*.17);
      g.save();g.translate(e.x,e.y);g.rotate(Math.atan2(vy,vx)-Math.PI/2);
      g.drawImage(trail(color),-wide*.6,-half-len,wide*1.2,len+half*.18);g.restore();
    }
    return {resize,setSkin,drawArena,drawTrail,
      stick:(g,w,h,color)=>drawMaterial(g,'stick',w,h,color),
      disc:(g,r,color)=>drawMaterial(g,'disc',r*2,r*2,color),
      arrow:(g,size,color)=>drawMaterial(g,'arrow',size,size,color),
      star:(g,r,color)=>drawMaterial(g,'star',r*2,r*2,color)};
  }
  return {create};
});
