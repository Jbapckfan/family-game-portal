import { readFile, writeFile } from "node:fs/promises";

const bundlePath = new URL("./assets/index-velocity-v2.js", import.meta.url);
let source = await readFile(bundlePath, "utf8");

const replacements = [
  // Give the narrow straights and curves taller rails without changing their look.
  ['size:t=[1,2,30]', 'size:t=[1,4,30]'],
  ['size:[1,2,g]}),O.jsx(Hc', 'size:[1,4,g]}),O.jsx(Hc'],
  ['size:[1,2,g]})]})', 'size:[1,4,g]})]})'],
  ['size:[1,3,2*Math.PI*e*Math.abs(i-t)/g*1.05]}),O.jsx(Hc', 'size:[1,4,2*Math.PI*e*Math.abs(i-t)/g*1.05]}),O.jsx(Hc'],
  ['size:[1,3,2*Math.PI*e*Math.abs(i-t)/g*1.05]})]},d)', 'size:[1,4,2*Math.PI*e*Math.abs(i-t)/g*1.05]})]},d)'],

  // Fix the actual curve chord length. The original multiplied radians by 2π,
  // producing rail colliders more than six times too long and badly overlapping.
  ['b=s+d*c,v=-y', 'b=s+(d+.5)*c,v=-y'],
  ['2*Math.PI*e*Math.abs(i-t)/g*1.05', 'e*Math.abs(i-t)/g*1.18', 3],
  ['size:t=[1,4,30]', 'size:t=[1.5,5,30]'],
  ['size:[1,4,e*Math.abs(i-t)/g*1.18]', 'size:[1.5,5,e*Math.abs(i-t)/g*1.18]', 2],
  ['size:[1,4,g]', 'size:[1.5,5,g+2]', 2],
  ['size:[1,4,70]', 'size:[1.5,5,72]', 2],

  // Remove an overlapping false ramp and join both S-curves endpoint-to-endpoint.
  ['O.jsx(da,{start:[0,12,-7.5],end:[0,5,-30],width:16}),', ''],
  [
    'position:[-20,-65,-130],radius:30,angleStart:0,angleEnd:-Math.PI*.5,heightStart:-65,heightEnd:-75',
    'position:[-20,-65,-145],radius:15,angleStart:Math.PI*.5,angleEnd:-Math.PI*.5,heightStart:-65,heightEnd:-75',
  ],
  [
    'position:[-20+Math.cos(-Math.PI/4)*38,-68,-130+Math.sin(-Math.PI/4)*38],rotation:[0,Math.PI/4+Math.PI/2,Math.PI/3]',
    'position:[-5,-70,-145],rotation:[0,Math.PI/2,Math.PI/3]',
  ],

  // Keep startup self-contained and make the WebGL workload fit older iPads.
  ['O.jsx(CM,{preset:"sunset",background:!1}),', ''],
  [
    ',O.jsx(FE,{position:[0,2,0],fontSize:1,color:"white",anchorX:"center",anchorY:"middle",children:a})',
    '',
  ],
  [
    'gl:{antialias:!0,powerPreference:"high-performance",stencil:!1,depth:!0,toneMapping:4}',
    'gl:{antialias:!window.__velocityLiteMode,powerPreference:window.__velocityLiteMode?"default":"high-performance",stencil:!1,depth:!0,toneMapping:4}',
  ],
  ['gl:{alpha:!0,antialias:!0}', 'gl:{alpha:!0,antialias:!window.__velocityLiteMode}'],
  ['count:600', 'count:window.__velocityLiteMode?220:600'],
  [
    'iterations:8,maxSubSteps:4,stepSize:1/120',
    'iterations:window.__velocityLiteMode?6:8,maxSubSteps:window.__velocityLiteMode?3:4,stepSize:1/120',
  ],
  [
    'args:[.5,32,32]',
    'args:[.5,window.__velocityLiteMode?20:32,window.__velocityLiteMode?20:32]',
    4,
  ],

  // Keep the track visually smooth while cutting hundreds of redundant bodies/draw calls.
  ['segments:s=48', 'segments:s=24'],
  ['bankingAngle:.4,segments:32', 'bankingAngle:.4,segments:16', 2],
  ['bankingAngle:-.5,segments:32', 'bankingAngle:-.5,segments:16'],
  ['width:20,depth:8,segments:32', 'width:20,depth:8,segments:12', 2],
  ['bankingAngle:-.3,segments:16', 'bankingAngle:-.3,segments:10'],
  ['bankingAngle:.3,segments:12', 'bankingAngle:.3,segments:8'],

  // Make steering frame-rate independent, camera-relative, and quick to answer input.
  ['SS=120,RS=200,BD=150,WS=350', 'SS=120,RS=200,BD=150,WS=60'],
  ['gl(()=>{if(!h.current)return;', 'gl((frameState,delta)=>{if(!h.current)return;'],
  [
    'if(te!==0||j!==0){const L=(o==null?void 0:o.type)==="SPEED_BOOST"&&o.endTime>Date.now()?SS*1.5:SS;p.applyForce([j*L,0,-te*L],[0,0,0])}',
    'if(te!==0||j!==0){const L=(o==null?void 0:o.type)==="SPEED_BOOST"&&o.endTime>Date.now()?SS*1.5:SS,forwardX=f-C.current.x,forwardZ=b-C.current.z,forwardLength=Math.hypot(forwardX,forwardZ)||1,impulseScale=L*Math.min(delta,.033),forceX=(forwardX/forwardLength*te-forwardZ/forwardLength*j)*impulseScale,forceZ=(forwardZ/forwardLength*te+forwardX/forwardLength*j)*impulseScale;p.applyImpulse([forceX,0,forceZ],[0,0,0])}',
  ],

  // A missed edge is a quick checkpoint reset, not an abrupt game over.
  [
    'if(e(S),t===Kn.PLAYING&&A<-150&&i(Kn.FINISHED),t===Kn.PLAYING){',
    'if(e(S),t===Kn.PLAYING&&A<(tu[r]?.[1]??13)-45){const respawn=tu[r]||tu[0];p.position.set(respawn[0],respawn[1]+2,respawn[2]),p.velocity.set(0,0,0),p.angularVelocity.set(0,0,0),g.current=[respawn[0],respawn[1]+2,respawn[2]],C.current.set(respawn[0],respawn[1]+g0,respawn[2]+Yh),n.position.copy(C.current);return}if(t===Kn.PLAYING){',
  ],

  // Favor steady frame pacing on phones and tablets over costly sparkle effects.
  ['args:[.5,64,64]', 'args:[.5,32,32]', 2],
  ['dpr:[1,1.5]', 'dpr:[1,1.25]'],
  ['luminanceThreshold:.4,mipmapBlur:!0,intensity:1.2,radius:.4', 'luminanceThreshold:.5,mipmapBlur:!1,intensity:.85,radius:.25'],
  ['O.jsx(lD,{blendFunction:Et.NORMAL,offset:new Ye(8e-4,8e-4),radialModulation:!1,modulationOffset:0}),', ''],
  ['O.jsx(cD,{opacity:.03,blendFunction:Et.SOFT_LIGHT}),', ''],
  ['count:5e3', 'count:1200'],
  [
    'allowSleep:!1,iterations:30,tolerance:1e-4',
    'allowSleep:!0,broadphase:"SAP",axisIndex:2,iterations:8,maxSubSteps:4,stepSize:1/120,tolerance:1e-3',
  ],
];

for (const [before, after, expectedCount = 1] of replacements) {
  const actualCount = source.split(before).length - 1;
  if (actualCount === expectedCount) {
    source = source.replaceAll(before, after);
  } else if (actualCount !== 0) {
    throw new Error(`Expected ${expectedCount} original or patched fragment(s): ${before}`);
  }
}

const refinements = [
  // Keep every physics body in the same world-space location as its visible curve segment.
  [
    'return O.jsx("group",{position:n,children:Array.from({length:g}).map((C,d)=>',
    'return O.jsx("group",{children:Array.from({length:g}).map((C,d)=>',
  ],
  ['position:[f,b,A],rotation:[0,v,Z]', 'position:[n[0]+f,b,n[2]+A],rotation:[0,v,Z]'],
  [
    'position:[f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+1,A+Math.sin(y)*(o/2)*Math.cos(Z)]',
    'position:[n[0]+f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+1,n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)]',
  ],
  [
    'position:[f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+1,A-Math.sin(y)*(o/2)*Math.cos(Z)]',
    'position:[n[0]+f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+1,n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)]',
  ],

  // Connect the course continuously and put checkpoint triggers on the route.
  [
    'tu=[[0,13,8],[50,-15,-60],[0,-50,-100],[-40,-80,-200],[0,-120,-350]]',
    'tu=[[0,13,8],[40,-15,-70],[40,-50,-100],[-50,-90,-190],[0,-131,-345]]',
  ],
  ['position:[0,12,5],size:[16,1,25]', 'position:[0,12,5],size:[16,1,30]'],
  ['position:[8,14,5],size:[1,4,25]', 'position:[8,14,5],size:[1,4,30]'],
  ['position:[-8,14,5],size:[1,4,25]', 'position:[-8,14,5],size:[1,4,30]'],
  ['position:[0,12,5],size:[16,1,30]', 'position:[0,12,5],size:[16,1,70]'],
  ['position:[8,14,5],size:[1,4,30]', 'position:[8,14,5],size:[1,4,70]'],
  ['position:[-8,14,5],size:[1,4,30]', 'position:[-8,14,5],size:[1,4,70]'],
  ['O.jsx(ni,{position:[0,14,17],size:[16,4,1],color:"#ff0044"}),', ''],
  ['end:[0,2,-55],width:14', 'end:[0,5,-30],width:14'],
  [
    'O.jsx(da,{start:[0,12,-7.5],end:[0,10,-12],width:16}),O.jsx(da,{start:[0,10,-12],end:[0,5,-30],width:14}),',
    'O.jsx(da,{start:[0,12,-10],end:[0,12,-30],width:16}),',
  ],
  ['O.jsx(da,{start:[0,12,-10],end:[0,12,-30],width:16}),', ''],
  [
    'angleEnd:Math.PI*1.5,heightStart:5,heightEnd:-15',
    'angleEnd:Math.PI*1.5,heightStart:12,heightEnd:-15',
  ],
  [
    'O.jsx(JI,{position:[40,0,-30],radius:40,angleStart:Math.PI,angleEnd:Math.PI/2,heightStart:5,heightEnd:-15,bankingAngle:.4,segments:16}),',
    '',
  ],
  [
    'O.jsx(JI,{position:[-20,-120,-300],radius:30,angleStart:Math.PI,angleEnd:Math.PI*.5,heightStart:-120,heightEnd:-125,bankingAngle:.3,segments:8}),',
    '',
  ],
  [
    'O.jsx("group",{position:[-25,-128,-315],rotation:[.1,-.5,0],children:O.jsx(mD,{position:[0,0,0],length:60,width:20,depth:8})}),',
    '',
  ],
  [
    'O.jsxs("group",{position:[0,-122,-360],rotation:[-.4,0,0],children:[O.jsx(ni,{position:[0,0,0],size:[14,1,20],color:"#ff6600"}),O.jsx(Xh,{position:[0,.2,0]})]}),',
    'O.jsx(da,{start:[0,-132,-360],end:[0,-145,-425],width:14}),',
  ],

  // Clamp all velocity axes; the old vertical-speed leak could launch the camera into space.
  ['SS=160,RS=200,BD=150,WS=80', 'SS=120,RS=200,BD=150,WS=60'],
  ['p.velocity.set(v*_,B,Z*_)', 'p.velocity.set(v*_,B*_,Z*_)'],
  [
    'd=Ge.useRef(new Q(0,0,0)),[h,p]=yC',
    'd=Ge.useRef(new Q(0,0,0)),respawnLock=Ge.useRef(0),[h,p]=yC',
  ],
  [
    'n.position.copy(C.current)}},[t,p,n,r]),gl',
    'n.position.copy(C.current)}},[t,p,n]),gl',
  ],
  [
    'g.current=[respawn[0],respawn[1]+2,respawn[2]],C.current.set',
    'g.current=[respawn[0],respawn[1]+2,respawn[2]],l.current=[0,0,0],C.current.set',
  ],
  [
    'S=Math.sqrt(v*v+B*B+Z*Z);if(e(S),',
    'S=Math.sqrt(v*v+B*B+Z*Z);if(t===Kn.PLAYING&&Date.now()<respawnLock.current){const locked=tu[r]||tu[0];p.position.set(locked[0],locked[1]+2,locked[2]),p.velocity.set(0,0,0),p.angularVelocity.set(0,0,0),g.current=[locked[0],locked[1]+2,locked[2]],l.current=[0,0,0];return}if(e(S),',
  ],
  [
    'if(e(S),t===Kn.PLAYING&&A<(tu[r]?.[1]??13)-45){const respawn=',
    'if(e(S),t===Kn.PLAYING&&A<(tu[r]?.[1]??13)-45){respawnLock.current=Date.now()+250;const respawn=',
  ],
  [
    'n.position.copy(C.current);return}if(t===Kn.PLAYING){const k=',
    'n.position.copy(C.current);return}if(t===Kn.PLAYING){const nextCheckpoint=tu[r+1];nextCheckpoint&&Math.hypot(f-nextCheckpoint[0],A-nextCheckpoint[1],b-nextCheckpoint[2])<18&&Qi.getState().setLastCheckpoint(r+1);const k=',
  ],
  [
    'Math.hypot(f-nextCheckpoint[0],A-nextCheckpoint[1],b-nextCheckpoint[2])<18',
    'Math.hypot(f-nextCheckpoint[0],A-nextCheckpoint[1],b-nextCheckpoint[2])<26',
  ],
  [
    'if((Math.abs(Cr.moveX)>.1||Math.abs(Cr.moveY)>.1)&&(j=Cr.moveX,te=-Cr.moveY),Cr.jump){',
    '(Math.abs(Cr.moveX)>.1||Math.abs(Cr.moveY)>.1)&&(j=Cr.moveX,te=-Cr.moveY);const inputLength=Math.hypot(te,j);if(inputLength>1&&(te/=inputLength,j/=inputLength),Cr.jump){',
  ],
  [
    'if((Math.abs(Cr.moveX)>.1||Math.abs(Cr.moveY)>.1)&&(j=Cr.moveX,te=-Cr.moveY);const inputLength=',
    '(Math.abs(Cr.moveX)>.1||Math.abs(Cr.moveY)>.1)&&(j=Cr.moveX,te=-Cr.moveY);const inputLength=',
  ],
  [
    'window.__marbleJump=b,window.addEventListener("keydown",f)',
    'window.__marbleJump=b,window.__velocityDiagnostics={position:g,velocity:l,checkpoint:()=>r},window.addEventListener("keydown",f)',
  ],
  ['checkpoint:()=>r}', 'checkpoint:()=>Qi.getState().lastCheckpoint}'],

  // Give the mobile HUD stable hooks so it stays clear of the touch controls.
  [
    'absolute inset-0 z-40 pointer-events-none p-8 flex flex-col justify-between',
    'absolute inset-0 z-40 pointer-events-none p-8 flex flex-col justify-between velocity-hud',
  ],
  ['absolute top-20 left-8 flex gap-2', 'absolute top-20 left-8 flex gap-2 velocity-checkpoints'],
  ['className:"flex justify-center items-end"', 'className:"flex justify-center items-end velocity-speed"'],
  [
    'absolute bottom-8 right-8 text-right text-white/40 font-[\'Rajdhani\'] text-sm',
    'absolute bottom-8 right-8 text-right text-white/40 font-[\'Rajdhani\'] text-sm velocity-instructions',
  ],

  // Lighter materials and a single render pass keep the neon look without frame-stalling effects.
  ['material:{friction:.01,restitution:.1}', 'material:{friction:.01,restitution:0}'],
  ['material:{friction:.02,restitution:.1}', 'material:{friction:.02,restitution:0}'],
  ['defaultContactMaterial:{friction:.4,restitution:.1}', 'defaultContactMaterial:{friction:.4,restitution:0}'],
  [
    'O.jsx("meshStandardMaterial",{color:i,emissive:s||i,emissiveIntensity:s?.3:.05,metalness:.7,roughness:.2})',
    'O.jsx("meshLambertMaterial",{color:i,emissive:s||i,emissiveIntensity:s?.3:.05})',
  ],
  [
    'material:{friction:0,restitution:.3}',
    'material:{friction:0,restitution:.05}',
  ],
  [
    'O.jsx("meshStandardMaterial",{color:s,emissive:s,emissiveIntensity:.8,transparent:!0,opacity:.5,metalness:.9,roughness:.1})',
    'O.jsx("meshBasicMaterial",{color:s,transparent:!0,opacity:.42})',
  ],
  ['linearDamping:.02,angularDamping:.1', 'linearDamping:.08,angularDamping:.15'],
  ['toneMapping:0},dpr:[1,1.25]', 'toneMapping:4},dpr:[1,1]'],
  [
    'O.jsxs(oD,{children:[O.jsx(ID,{mode:Rs.ACES_FILMIC}),O.jsx(gD,{luminanceThreshold:.5,mipmapBlur:!1,intensity:.85,radius:.25}),O.jsx(uD,{eskil:!1,offset:.1,darkness:1.1})]}),',
    '',
  ],
  ['count:1200', 'count:600'],

  // Pro feel: steer gently toward the next checkpoint and let the camera show what's coming.
  [
    'n.position.copy(C.current);return}if(t===Kn.PLAYING){const nextCheckpoint=tu[r+1];nextCheckpoint&&Math.hypot(f-nextCheckpoint[0],A-nextCheckpoint[1],b-nextCheckpoint[2])<26&&Qi.getState().setLastCheckpoint(r+1);const k=',
    'n.position.copy(C.current);return}if(t===Kn.PLAYING){const nextCheckpoint=tu[r+1],currentCheckpoint=tu[r]||tu[0];if(nextCheckpoint){const lineX=nextCheckpoint[0]-currentCheckpoint[0],lineZ=nextCheckpoint[2]-currentCheckpoint[2],lineLength=lineX*lineX+lineZ*lineZ||1,projection=Math.max(0,Math.min(1,((f-currentCheckpoint[0])*lineX+(b-currentCheckpoint[2])*lineZ)/lineLength)),centerX=currentCheckpoint[0]+lineX*projection,centerZ=currentCheckpoint[2]+lineZ*projection,assistX=centerX-f,assistZ=centerZ-b,assistDistance=Math.hypot(assistX,assistZ);assistDistance>5&&p.applyImpulse([assistX/(assistDistance||1)*Math.min((assistDistance-5)*1.2,22)*Math.min(delta,.033),0,assistZ/(assistDistance||1)*Math.min((assistDistance-5)*1.2,22)*Math.min(delta,.033)],[0,0,0])}nextCheckpoint&&Math.hypot(f-nextCheckpoint[0],A-nextCheckpoint[1],b-nextCheckpoint[2])<26&&Qi.getState().setLastCheckpoint(r+1);const k='
  ],
  ['d.current.lerp(new Q(f,A,b),.1)', 'd.current.lerp(new Q(f+v*.35,A+B*.12,b+Z*.35),.14)'],
  ['Date.now()+250', 'Date.now()+900'],
  [
    'S=Math.sqrt(v*v+B*B+Z*Z);if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
    'S=Math.sqrt(v*v+B*B+Z*Z);window.__velocityProState||(window.__velocityProState={}),Object.assign(window.__velocityProState,{gameState:t,speed:S,position:[f,A,b],velocity:[v,B,Z],checkpoint:Qi.getState().lastCheckpoint,score:Qi.getState().score,isVictory:Qi.getState().isVictory,marbleId:Qi.getState().selectedMarbleId,recovering:Date.now()<respawnLock.current,finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
  ],
  ['!s&&i===Kn.PLAYING&&(r(!0),t(!0),setTimeout(()=>e(Kn.FINISHED),500))', '!s&&i===Kn.PLAYING&&(r(!0),t(!0),window.__velocityFinishPulse=Date.now(),setTimeout(()=>e(Kn.FINISHED),1500))'],
];

for (const [before, after] of refinements) {
  const actualCount = source.split(before).length - 1;
  if (after && source.includes(after)) continue;
  if (actualCount === 1) source = source.replace(before, after);
  else if (actualCount > 1) {
    throw new Error(`Expected one original or refined bundle fragment: ${before}`);
  }
}

for (const className of ['velocity-hud', 'velocity-checkpoints', 'velocity-instructions']) {
  source = source.replaceAll(`${className} ${className}`, className);
}

// The nested half-pipe and loop components created collision bodies at local coordinates.
// Safe guarded curves already cover those sections, and the straight through the loop remains intact.
const complexStart = 'ZS=({position:n';
const complexEnd = 'wS=({position:n';
const simpleComplex = 'ZS=n=>O.jsx(JI,{...n,bankingAngle:.45}),bD=()=>null,wS=({position:n';
if (source.includes(complexStart)) {
  const start = source.indexOf(complexStart);
  const end = source.indexOf(complexEnd, start);
  if (end === -1) throw new Error('Could not find the end of the complex track components.');
  source = source.slice(0, start) + simpleComplex + source.slice(end + complexEnd.length);
} else if (!source.includes(simpleComplex)) {
  throw new Error('Expected original or simplified complex track components.');
}

await writeFile(bundlePath, source);
console.log(`Velocity Marble Run bundle is patched and ready.`);
