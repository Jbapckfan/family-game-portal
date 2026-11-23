// Muted, DOM-free checks. No browser, server, audio implementation or network.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),Art=require('../arena.js');
function host(){
  const counters={canvases:0,gradients:0,invalidations:0},contexts=[],gradients=[];
  function context(){
    const calls=[];
    return new Proxy({calls},{get(t,k){
      if(k in t)return t[k];
      if(k==='createLinearGradient'||k==='createRadialGradient')return (...a)=>{counters.gradients++;calls.push([k,...a]);const record={kind:k,stops:[]};gradients.push(record);return {addColorStop:(offset,color)=>record.stops.push([offset,color])}};
      return (...a)=>{if(k==='stroke')calls.push(['strokePaint',t.strokeStyle,t.lineWidth]);calls.push([k,...a])};
    }});
  }
  const image={complete:false,naturalWidth:0,naturalHeight:0};
  function createCanvas(){counters.canvases++;const g=context();contexts.push(g);return {width:0,height:0,getContext:()=>g}}
  return {counters,contexts,gradients,image,context,createCanvas,createImage:()=>image,invalidate:()=>counters.invalidations++};
}
function renderer(){const h=host(),art=Art.create(h),g=h.context();art.resize(393,852,3);return {h,art,g}}
test('arena backing uses DPR two and retains all four viewport rectangles',()=>{
  for(const [w,h] of [[393,852],[1180,820],[820,1180],[1440,900]]){
    const v=renderer();v.art.resize(w,h,3);v.art.drawArena(v.g,false);
    const call=v.g.calls.find(c=>c[0]==='drawImage');
    assert.equal(call[1].width,w*2);assert.equal(call[1].height,h*2);
    assert.deepEqual(call.slice(2),[0,0,w,h]);
  }
});
test('warmed arena and material draws allocate no new canvases or gradients',()=>{
  const {h,art,g}=renderer();
  const paint=()=>{art.drawArena(g,false);art.stick(g,34,120,'#ff884d');art.disc(g,48,'#22d3ee');art.arrow(g,90,'#8b5cf6');art.star(g,38,'#ffe14d');art.drawTrail(g,{x:100,y:200,w:34,h:120,vy:300},'#ff884d',false)};
  paint();const before={...h.counters};for(let i=0;i<120;i++)paint();
  assert.equal(h.counters.canvases,before.canvases);assert.equal(h.counters.gradients,before.gradients);
});
test('texture readiness invalidates once; a failed image retains a drawable floor',()=>{
  const {h,art,g}=renderer();art.drawArena(g,false);h.image.onerror();assert.equal(h.counters.invalidations,1);art.drawArena(g,false);
  h.image.complete=true;h.image.naturalWidth=1024;h.image.naturalHeight=1024;h.image.onload();
  assert.equal(h.counters.invalidations,2);art.drawArena(g,false);assert.equal(g.calls.filter(c=>c[0]==='drawImage').length,3);
});
test('all unlocked skin choices repaint once and settle without timers',()=>{
  const {h,art,g}=renderer();art.drawArena(g,false);
  for(const skin of ['candy','space','gold','neon']){
    const before=h.counters.gradients;art.setSkin(skin);art.drawArena(g,false);assert.ok(h.counters.gradients>before);
    const warmed=h.counters.gradients;art.setSkin(skin);art.drawArena(g,false);assert.equal(h.counters.gradients,warmed);
  }
});
test('trails follow velocity, extend with speed, and disappear for reduced motion',()=>{
  const {art,g}=renderer(),e={x:100,y:200,w:34,h:120,vx:0,vy:100},before=structuredClone(e);
  art.drawTrail(g,e,'#ff884d',true);assert.equal(g.calls.length,0);
  art.drawTrail(g,e,'#ff884d',false);const slow=g.calls.find(c=>c[0]==='drawImage');
  assert.equal(g.calls.find(c=>c[0]==='rotate')[1],0);assert.deepEqual(e,before);
  g.calls.length=0;art.drawTrail(g,{...e,vy:300},'#ff884d',false);const fast=g.calls.find(c=>c[0]==='drawImage');
  assert.ok(fast.at(-1)>slow.at(-1));assert.ok(fast[3]<slow[3]);
});
function game(){
  const h=host(),gameContext=h.context(),nodes=new Map(),frames=new Map(),events=new Map();let clock=1000,seq=0;
  function node(id){if(!nodes.has(id))nodes.set(id,{style:{},dataset:{},textContent:'',innerHTML:'',value:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},getContext:()=>gameContext,getBoundingClientRect:()=>({left:0,top:0,width:393,height:852}),focus(){}});return nodes.get(id)}
  const document={hidden:false,body:node('body'),querySelector:node,querySelectorAll:()=>[],createElement:h.createCanvas,addEventListener:(name,fn)=>events.set(name,fn)};
  const sandbox={document,console,innerWidth:393,innerHeight:852,devicePixelRatio:3,ReflexRiotArt:Art,performance:{now:()=>clock},
    navigator:{},location:{protocol:'file:'},localStorage:{getItem:k=>k==='reflexRiotMuted'?'true':null,setItem(){}},
    matchMedia:()=>({matches:false}),addEventListener(){},setTimeout:()=>1,clearTimeout(){},
    requestAnimationFrame:fn=>{const id=++seq;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),Image:function(){return h.image}};
  sandbox.window=sandbox;
  const code=readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/\}\)\(\);\s*$/,'globalThis.probe={state,settings,drawEntity,drawEffects,onPointerDown,onPointerUp,updateEntities,resize};})();');
  vm.runInNewContext(code,sandbox);
  return {h,gameContext,nodes,frames,events,sandbox,...sandbox.probe,clock:t=>clock=t,
    tap:(x,y)=>sandbox.probe.onPointerDown({clientX:x,clientY:y,pointerId:1,preventDefault(){}})};
}
test('all eleven entity kinds paint without changing their gameplay data',()=>{
  const v=game();
  for(const kind of ['stick','orb','bomb','swipe','freeze','color','number','hold','star','decoy','reaction']){
    const e={kind,x:180,y:300,w:34,h:120,r:48,size:90,color:'#22d3ee',rot:.1,spin:.2,vy:280,vx:40,born:700,ttl:2000,pulse:1,dir:0,value:1,word:'CYAN',match:true,face:1,held:false,holdAt:0};
    const before=structuredClone(e);v.drawEntity(e);assert.deepEqual(e,before,kind);
  }
});
test('real pointer input retains stick scoring and the existing hit threshold',()=>{
  const v=game();Object.assign(v.state,{playing:true,mode:'sticks'});
  v.state.entities=[{kind:'stick',x:180,y:300,w:34,h:120,color:'#ff884d',dead:false}];
  v.tap(180+34*.95+.01,300);assert.equal(v.state.score,0);assert.equal(v.state.entities[0].dead,false);
  v.tap(180,300);assert.equal(v.state.score,110);assert.equal(v.state.combo,1);assert.equal(v.state.shields,3);
});
test('real bomb input retains its shield penalty and zero score',()=>{
  const v=game();Object.assign(v.state,{playing:true,mode:'smash'});v.state.entities=[{kind:'bomb',x:180,y:300,r:48,dead:false}];
  v.tap(180,300);assert.equal(v.state.shields,2);assert.equal(v.state.score,0);assert.equal(v.state.attempts,1);
});
for(const [duration,score,shields] of [[499,0,2],[500,180,3],[950,180,3],[951,0,2]])test(`hold release at ${duration}ms retains its result`,()=>{
  const v=game();Object.assign(v.state,{playing:true,mode:'hold'});v.state.entities=[{kind:'hold',x:180,y:300,r:58,held:false,holdAt:0,dead:false}];
  v.tap(180,300);v.clock(1000+duration);v.onPointerUp({clientX:180,clientY:300});
  assert.equal(v.state.score,score);assert.equal(v.state.shields,shields);
});
test('movement advances by the same elapsed time at 60 and 120 updates',()=>{
  function position(hz){const v=game();v.state.entities=[{kind:'stick',x:180,y:100,w:34,h:120,vy:80,spin:.2,rot:0,dead:false}];for(let i=0;i<hz;i++)v.updateEntities(1/hz);return v.state.entities[0]}
  const a=position(60),b=position(120);assert.ok(Math.abs(a.y-180)<1e-9);assert.ok(Math.abs(a.y-b.y)<1e-9);assert.ok(Math.abs(a.rot-b.rot)<1e-9);
});
test('idle menu settles, texture load requests one repaint, and hiding cancels it',()=>{
  const v=game(),[id,fn]=v.frames.entries().next().value;v.frames.delete(id);fn(1000);assert.equal(v.frames.size,0);
  v.h.image.onload();assert.equal(v.frames.size,1);
  v.sandbox.document.hidden=true;v.events.get('visibilitychange')();assert.equal(v.frames.size,0);
});

test('loaded photographic floor receives broad coloured pools for every active skin',()=>{
  const palettes={neon:['#54dcec','#b785ff'],candy:['#ff91cb','#9be9ff'],space:['#b5a2ff','#72e6d0'],gold:['#f5cf70','#f5e9be']};
  for(const [skin,colors] of Object.entries(palettes)){
    const {h,art,g}=renderer();h.image.complete=true;h.image.naturalWidth=h.image.naturalHeight=1024;art.setSkin(skin);art.drawArena(g,false);
    for(const color of colors)assert.ok(h.gradients.some(v=>v.kind==='createRadialGradient'&&v.stops.some(([,c])=>c.startsWith(color))),`${skin} ${color} must reach the floor through a radial light pool`);
  }
});
test('loaded floor includes faint etched court paths rather than a plain slab',()=>{
  const {h,art,g}=renderer();h.image.complete=true;h.image.naturalWidth=h.image.naturalHeight=1024;art.drawArena(g,false);
  const paints=h.contexts[0].calls.filter(c=>c[0]==='strokePaint'&&/^#[0-9a-f]{8}$/i.test(c[1]));
  assert.ok(paints.some(c=>parseInt(c[1].slice(7),16)<=32&&c[2]<=1.5),'a low-opacity fine court etching must be drawn');
  assert.ok(h.contexts[0].calls.some(c=>c[0]==='ellipse'),'the centre ring must be drawn on the cached floor');
});
test('score popup is painted clear above the hit with dark halo and unchanged value/lifetime',()=>{
  const v=game(),floater={x:180,y:300,text:'+110',color:'#fff',life:1,vy:-52};v.state.floaters=[floater];
  const before=structuredClone(floater);v.gameContext.calls.length=0;v.drawEffects();
  const stroke=v.gameContext.calls.find(c=>c[0]==='strokeText'),fill=v.gameContext.calls.find(c=>c[0]==='fillText');
  assert.ok(stroke,'score popup needs a dark outline');assert.equal(fill[1],'+110');assert.equal(fill[2],180);assert.ok(fill[3]<=252);
  assert.deepEqual(stroke.slice(1),fill.slice(1));assert.equal(v.gameContext.strokeStyle,'#050a12');assert.deepEqual(floater,before);
});
