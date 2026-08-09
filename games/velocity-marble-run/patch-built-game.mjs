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

  // Raise the visible and physical guardrails together. The rail centers move
  // upward by half the added height, leaving their lower edge buried in the
  // track while curves receive extra containment for lateral speed.
  [
    'Hc=({position:n,rotation:e=[0,0,0],size:t=[1.5,5,30]',
    'Hc=({position:n,rotation:e=[0,0,0],size:t=[2,8,30]',
  ],
  [
    'position:[n[0]+f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+1,n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[1.5,5,e*Math.abs(i-t)/g*1.18]',
    'position:[n[0]+f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+3,n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[2,9,e*Math.abs(i-t)/g*1.18]',
  ],
  [
    'position:[n[0]+f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+1,n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[1.5,5,e*Math.abs(i-t)/g*1.18]',
    'position:[n[0]+f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+3,n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[2,9,e*Math.abs(i-t)/g*1.18]',
  ],
  [
    'position:[l+Math.cos(d)*(t/2),c+Math.sin(i)*(t/2)+1,C-Math.sin(d)*(t/2)],rotation:[h,d,i],size:[1.5,5,g+2]',
    'position:[l+Math.cos(d)*(t/2),c+Math.sin(i)*(t/2)+2.5,C-Math.sin(d)*(t/2)],rotation:[h,d,i],size:[2,8,g+2]',
  ],
  [
    'position:[l-Math.cos(d)*(t/2),c-Math.sin(i)*(t/2)+1,C+Math.sin(d)*(t/2)],rotation:[h,d,i],size:[1.5,5,g+2]',
    'position:[l-Math.cos(d)*(t/2),c-Math.sin(i)*(t/2)+2.5,C+Math.sin(d)*(t/2)],rotation:[h,d,i],size:[2,8,g+2]',
  ],
  [
    'O.jsx(Hc,{position:[8,14,5],size:[1.5,5,72]}),O.jsx(Hc,{position:[-8,14,5],size:[1.5,5,72]})',
    'O.jsx(Hc,{position:[8,16,5],size:[2,9,72]}),O.jsx(Hc,{position:[-8,16,5],size:[2,9,72]})',
  ],

  // Turn the stepped curves into genuinely downhill surfaces. Each curved
  // chord now follows its authored elevation change instead of remaining
  // level and presenting the marble with a lip at every segment boundary.
  [
    'b=s+(d+.5)*c,v=-y,B=i>t?1:-1,Z=a*B;return',
    'b=s+(d+.5)*c,v=-y,B=i>t?1:-1,Z=a*B,P=Math.atan2(-c*B,e*Math.abs(i-t)/g*1.18),T=.42;return',
  ],
  [
    'O.jsx(ni,{position:[n[0]+f,b,n[2]+A],rotation:[0,v,Z],size:',
    'O.jsx(ni,{position:[n[0]+f,b,n[2]+A],rotation:[P,v,Z],size:',
  ],
  [
    'n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[2,9,e*Math.abs(i-t)/g*1.18]',
    'n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z-T],size:[2,9,e*Math.abs(i-t)/g*1.18]',
  ],
  [
    'n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[0,v,Z],size:[2,9,e*Math.abs(i-t)/g*1.18]',
    'n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z+T],size:[2,9,e*Math.abs(i-t)/g*1.18]',
  ],

  // Cant both straight and curved walls away from the center line. Their
  // buried lower edges form a forgiving half-pipe shoulder while the tall
  // outer edges retain the upgraded containment.
  [
    'd=Math.atan2(s,o),h=Math.atan2(-r,a);return',
    'd=Math.atan2(s,o),h=Math.atan2(-r,a),T=.42;return',
  ],
  [
    'C-Math.sin(d)*(t/2)],rotation:[h,d,i],size:[2,8,g+2]',
    'C-Math.sin(d)*(t/2)],rotation:[h,d,i-T],size:[2,8,g+2]',
  ],
  [
    'C+Math.sin(d)*(t/2)],rotation:[h,d,i],size:[2,8,g+2]',
    'C+Math.sin(d)*(t/2)],rotation:[h,d,i+T],size:[2,8,g+2]',
  ],

  // Replace the visible slab walls with a continuous cylindrical trough. The
  // existing canted boxes remain as invisible Cannon containment, while the
  // rendered shell has a genuinely round 22-segment half-pipe cross-section.
  [
    'Hc=({position:n,rotation:e=[0,0,0],size:t=[2,8,30],visible:i=!0,color:s="#00ffff"})=>{const[r]=qy(()=>({type:"Static",position:n,rotation:e,args:t,material:{friction:0,restitution:.05}}));return i?O.jsxs("mesh",{ref:r,position:n,rotation:e,children:[O.jsx("boxGeometry",{args:t}),O.jsx("meshBasicMaterial",{color:s,transparent:!0,opacity:.42})]}):null},JI=',
    'Hc=({position:n,rotation:e=[0,0,0],size:t=[2,8,30],visible:i=!0,color:s="#00ffff"})=>{const[r]=qy(()=>({type:"Static",position:n,rotation:e,args:t,material:{friction:0,restitution:.05}}));return O.jsx("group",{ref:r,position:n,rotation:e,children:i?O.jsxs("mesh",{children:[O.jsx("boxGeometry",{args:t}),O.jsx("meshBasicMaterial",{color:s,transparent:!0,opacity:.12})]}):null})},vHP=({position:n,rotation:e=[0,0,0],length:t,width:i=14,color:s="#172640"})=>{const r=i*.56,a=1.12;return O.jsx("group",{position:n,rotation:e,children:O.jsxs("mesh",{position:[0,r+.52,0],rotation:[Math.PI/2,0,0],receiveShadow:!0,children:[O.jsx("cylinderGeometry",{args:[r,r,t*1.04,window.__velocityLiteMode?14:22,1,!0,-a,a*2]}),O.jsx("meshStandardMaterial",{color:s,emissive:"#00d9ff",emissiveIntensity:.1,metalness:.5,roughness:.24,side:2})]})})},JI=',
  ],
  [
    'JI=({position:n,radius:e,angleStart:t,angleEnd:i,heightStart:s,heightEnd:r,width:o=14,bankingAngle:a=.3,segments:g=24})=>{const l=(i-t)/g,c=(r-s)/g;return O.jsx("group",{children:Array.from({length:g}).map((C,d)=>{const h=t+d*l,p=t+(d+1)*l,y=(h+p)/2,f=Math.cos(y)*e,A=Math.sin(y)*e,b=s+(d+.5)*c,v=-y,B=i>t?1:-1,Z=a*B,P=Math.atan2(-c*B,e*Math.abs(i-t)/g*1.18),T=.42;return O.jsxs(ao.Fragment,{children:[O.jsx(ni,{position:[n[0]+f,b,n[2]+A],rotation:[P,v,Z],size:[o,1,e*Math.abs(i-t)/g*1.18],color:d%2===0?"#1a1a2e":"#232342"}),O.jsx(Hc,{position:[n[0]+f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+3,n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z-T],size:[2,9,e*Math.abs(i-t)/g*1.18]}),O.jsx(Hc,{position:[n[0]+f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+3,n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z+T],size:[2,9,e*Math.abs(i-t)/g*1.18]})]},d)})})}',
    'JI=({position:n,radius:e,angleStart:t,angleEnd:i,heightStart:s,heightEnd:r,width:o=14,bankingAngle:a=.3,segments:g=24})=>{const l=(i-t)/g,c=(r-s)/g;return O.jsx("group",{children:Array.from({length:g}).map((C,d)=>{const h=t+d*l,p=t+(d+1)*l,y=(h+p)/2,f=Math.cos(y)*e,A=Math.sin(y)*e,b=s+(d+.5)*c,v=-y,B=i>t?1:-1,Z=a*B,P=Math.atan2(-c*B,e*Math.abs(i-t)/g*1.18),T=.42,L=e*Math.abs(i-t)/g*1.18,k=d%2===0?"#14243d":"#192b48";return O.jsxs(ao.Fragment,{children:[O.jsx(ni,{position:[n[0]+f,b,n[2]+A],rotation:[P,v,Z],size:[o,1,L],color:k}),O.jsx(vHP,{position:[n[0]+f,b,n[2]+A],rotation:[P,v,Z],length:L,width:o,color:k}),O.jsx(Hc,{visible:!1,position:[n[0]+f+Math.cos(y)*(o/2)*Math.cos(Z)-Math.sin(Z)*1,b+Math.sin(Z)*(o/2)+3,n[2]+A+Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z-T],size:[2,9,L]}),O.jsx(Hc,{visible:!1,position:[n[0]+f-Math.cos(y)*(o/2)*Math.cos(Z)+Math.sin(Z)*1,b-Math.sin(Z)*(o/2)+3,n[2]+A-Math.sin(y)*(o/2)*Math.cos(Z)],rotation:[P,v,Z+T],size:[2,9,L]})]},d)})})}',
  ],
  [
    'da=({start:n,end:e,width:t=14,bank:i=0})=>{const s=e[0]-n[0],r=e[1]-n[1],o=e[2]-n[2],a=Math.sqrt(s*s+o*o),g=Math.sqrt(s*s+r*r+o*o),l=(n[0]+e[0])/2,c=(n[1]+e[1])/2,C=(n[2]+e[2])/2,d=Math.atan2(s,o),h=Math.atan2(-r,a),T=.42;return O.jsxs("group",{children:[O.jsx(ni,{position:[l,c,C],rotation:[h,d,i],size:[t,1,g],color:"#1a1a2e"}),O.jsx(Hc,{position:[l+Math.cos(d)*(t/2),c+Math.sin(i)*(t/2)+2.5,C-Math.sin(d)*(t/2)],rotation:[h,d,i-T],size:[2,8,g+2]}),O.jsx(Hc,{position:[l-Math.cos(d)*(t/2),c-Math.sin(i)*(t/2)+2.5,C+Math.sin(d)*(t/2)],rotation:[h,d,i+T],size:[2,8,g+2]})]})}',
    'da=({start:n,end:e,width:t=14,bank:i=0})=>{const s=e[0]-n[0],r=e[1]-n[1],o=e[2]-n[2],a=Math.sqrt(s*s+o*o),g=Math.sqrt(s*s+r*r+o*o),l=(n[0]+e[0])/2,c=(n[1]+e[1])/2,C=(n[2]+e[2])/2,d=Math.atan2(s,o),h=Math.atan2(-r,a),T=.42;return O.jsxs("group",{children:[O.jsx(ni,{position:[l,c,C],rotation:[h,d,i],size:[t,1,g],color:"#14243d"}),O.jsx(vHP,{position:[l,c,C],rotation:[h,d,i],length:g,width:t}),O.jsx(Hc,{visible:!1,position:[l+Math.cos(d)*(t/2),c+Math.sin(i)*(t/2)+2.5,C-Math.sin(d)*(t/2)],rotation:[h,d,i-T],size:[2,8,g+2]}),O.jsx(Hc,{visible:!1,position:[l-Math.cos(d)*(t/2),c-Math.sin(i)*(t/2)+2.5,C+Math.sin(d)*(t/2)],rotation:[h,d,i+T],size:[2,8,g+2]})]})}',
  ],
  [
    'T=.42,L=e*Math.abs(i-t)/g*1.18,k=d%2===0?"#14243d":"#192b48"',
    'T=.62,L=e*Math.abs(i-t)/g*1.18,k="#14243d"',
  ],
  [
    'd=Math.atan2(s,o),h=Math.atan2(-r,a),T=.42;return O.jsxs("group",{children:[O.jsx(ni,{position:[l,c,C],rotation:[h,d,i],size:[t,1,g],color:"#14243d"})',
    'd=Math.atan2(s,o),h=Math.atan2(-r,a),T=.62;return O.jsxs("group",{children:[O.jsx(ni,{position:[l,c,C],rotation:[h,d,i],size:[t,1,g],color:"#14243d"})',
  ],
  // qH is already a Three.js shader identifier in this minified build. Keep
  // the half-pipe component name unique so the shipped module remains valid.
  ['},qH=({position:n,rotation:e=[0,0,0],length:t,width:i=14', '},vHP=({position:n,rotation:e=[0,0,0],length:t,width:i=14'],
  ['O.jsx(qH,{position:[n[0]+f,b,n[2]+A]', 'O.jsx(vHP,{position:[n[0]+f,b,n[2]+A]'],
  ['O.jsx(qH,{position:[l,c,C]', 'O.jsx(vHP,{position:[l,c,C]'],

  // Victory is valid only after reaching the final recovery sector.
  ['lastCheckpoint>=4', 'lastCheckpoint>=7'],

  // The old starting runway was flat. A shallow grade now starts the roll
  // immediately and meets the first curve at exactly the same elevation.
  [
    'O.jsx(ni,{position:[0,12,5],size:[16,1,70]}),O.jsx(Hc,{position:[8,16,5],size:[2,9,72]}),O.jsx(Hc,{position:[-8,16,5],size:[2,9,72]})',
    'O.jsx(da,{start:[0,13,40],end:[0,12,-30],width:16})',
  ],
  [
    'tu=[[0,13,8],[40,-15,-70],[40,-50,-100],[-50,-90,-190],[0,-131,-345]]',
    'tu=[[0,13,8],[40,-15,-70],[40,-50,-100],[-50,-90,-190],[0,-131,-345],[175,-190,-520],[-120,-275,-465],[-180,-320,-700]]',
  ],

  // Apply the player's drag/swipe orbit after the automatic chase-camera
  // placement, preserving the speed-aware distance and look-ahead behavior.
  [
    'V.set(f+H,A+g0+W*8,b+q)}C.current.lerp(V,ZD)',
    'V.set(f+H,A+g0+W*8,b+q)}const orbit=window.__velocityCameraOrbit;if(orbit&&(orbit.yaw||orbit.pitch)){const targetY=A+2,offsetX=V.x-f,offsetY=V.y-targetY,offsetZ=V.z-b,distance=Math.max(1,Math.hypot(offsetX,offsetY,offsetZ)),basePitch=Math.asin(Math.max(-1,Math.min(1,offsetY/distance))),cameraPitch=Math.max(-.12,Math.min(1.25,basePitch+orbit.pitch)),cameraYaw=Math.atan2(offsetX,offsetZ)+orbit.yaw,flatDistance=distance*Math.cos(cameraPitch);V.set(f+Math.sin(cameraYaw)*flatDistance,targetY+Math.sin(cameraPitch)*distance,b+Math.cos(cameraYaw)*flatDistance)}C.current.lerp(V,ZD)',
  ],

  // The finish collider used to capture MENU when the course first mounted,
  // so it ignored every later collision. Read the live store at impact time,
  // lock the sequence against duplicate rewards, and show the result quickly.
  [
    'vD=({position:n})=>{const e=Qi(a=>a.setGameState),t=Qi(a=>a.setVictory),i=Qi(a=>a.gameState),[s,r]=ao.useState(!1),[o]=yC(()=>({type:"Static",args:[8],position:n,isTrigger:!0,onCollide:()=>{!s&&i===Kn.PLAYING&&(r(!0),t(!0),window.__velocityFinishPulse=Date.now(),setTimeout(()=>e(Kn.FINISHED),1500))}}));return O.jsxs("mesh",{ref:o,position:n,rotation:[Math.PI/2,0,0],children:[O.jsx("torusGeometry",{args:[10,1,12,32]}),O.jsx("meshStandardMaterial",{color:s?"#00ff00":"#00ff88",emissive:s?"#00ff00":"#00ff44",emissiveIntensity:s?5:2,metalness:.9,roughness:.1})]})}',
    'vD=({position:n})=>{const[s,r]=ao.useState(!1),finishRun=()=>{const state=Qi.getState();return state.gameState!==Kn.PLAYING||window.__velocityFinishLocked?!1:(window.__velocityFinishLocked=!0,r(!0),state.setLastCheckpoint(4),state.setVictory(!0),window.__velocityFinishPulse=Date.now(),setTimeout(()=>Qi.getState().setGameState(Kn.FINISHED),900),!0)};window.__velocityCompleteRun=finishRun;const[o]=yC(()=>({type:"Static",args:[12],position:n,isTrigger:!0,onCollide:finishRun}));return O.jsxs("mesh",{ref:o,position:n,children:[O.jsx("torusGeometry",{args:[10,1,12,32]}),O.jsx("meshStandardMaterial",{color:s?"#00ff00":"#00ff88",emissive:s?"#00ff00":"#00ff44",emissiveIntensity:s?5:2,metalness:.9,roughness:.1})]})}',
  ],
  [
    'O.jsx(vD,{position:[0,-142,-460]})',
    'O.jsx(vD,{position:[0,-135,-455]})',
  ],
  ['state.setLastCheckpoint(4)', 'state.setLastCheckpoint(7)'],
  ['[1,2,3,4].map', 'Array.from({length:7},(n,e)=>e+1).map'],
  ['s,"/4):"', 's,"/7):"'],

  // Reset the one-shot finish lock for each new run.
  [
    'if(t===Kn.PLAYING){const f=tu[r]||[0,13,8];',
    'if(t===Kn.PLAYING){window.__velocityFinishLocked=!1,window.__velocityFinishPulse=0;const f=tu[r]||[0,13,8];',
  ],

  // A fast marble can cross a physics trigger between simulation steps on an
  // older iPad. Crossing the final platform now completes the run as a backup.
  [
    'finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
    'finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.()){p.velocity.set(0,0,0),l.current=[0,0,0];return}if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
  ],
  [
    'finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&r>=4&&b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.()){p.velocity.set(0,0,0),l.current=[0,0,0];return}if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
    'finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.()){p.velocity.set(0,0,0),l.current=[0,0,0];return}if(t===Kn.PLAYING&&Date.now()<respawnLock.current)',
  ],

  // Circuit handling and checkpoint-practice hooks consumed by pro-polish.js.
  [
    'impulseScale=L*Math.min(delta,.033),forceX=(forwardX/forwardLength*te-forwardZ/forwardLength*j)*impulseScale',
    'impulseScale=L*Math.min(delta,.033)*(window.__velocityHandling||1),forceX=(forwardX/forwardLength*te-forwardZ/forwardLength*j)*impulseScale',
  ],
  [
    'finishPulse:window.__velocityFinishPulse||0});if(t===Kn.PLAYING&&b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.())',
    'finishPulse:window.__velocityFinishPulse||0}),window.__velocityStartPractice=checkpoint=>{const index=Math.max(0,Math.min(tu.length-1,Number(checkpoint)||0)),spot=tu[index];spot&&(p.position.set(spot[0],spot[1]+2,spot[2]),p.velocity.set(0,0,0),p.angularVelocity.set(0,0,0),g.current=[spot[0],spot[1]+2,spot[2]],l.current=[0,0,0],Qi.getState().setLastCheckpoint(index),respawnLock.current=Date.now()+700)};if(t===Kn.PLAYING&&b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.())',
  ],
  [
    'b<-445&&Math.abs(f)<18&&A>-158&&window.__velocityCompleteRun?.()',
    'b<-980&&Math.abs(f-140)<18&&A>-438&&window.__velocityCompleteRun?.()',
  ],
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

// The original and preset-shortened course could be completed in a handful of
// seconds. Continue from its former finish into a long grand-prix back half:
// broad sweepers, a descending hairpin, two switchbacks, and a final canyon.
// Every added piece joins endpoint-to-endpoint and remains downhill.
const shortCourse = 'yD=()=>O.jsxs("group",{children:[O.jsx(da,{start:[0,13,40],end:[0,12,-30],width:16}),O.jsx(JI,{position:[40,0,-30],radius:40,angleStart:Math.PI,angleEnd:Math.PI*1.5,heightStart:12,heightEnd:-15,bankingAngle:.4,segments:16}),O.jsx(Fh,{position:tu[1],index:1,rotation:[0,Math.PI/2,0]}),O.jsx(da,{start:[40,-15,-70],end:[70,-20,-70],bank:.1}),O.jsx(JI,{position:[70,-30,-100],radius:30,angleStart:Math.PI/2,angleEnd:-Math.PI,heightStart:-20,heightEnd:-50,bankingAngle:-.5,segments:16}),O.jsx(Fh,{position:tu[2],index:2}),O.jsx(da,{start:[40,-50,-100],end:[40,-55,-130]}),O.jsx(ZS,{position:[10,-55,-130],radius:30,angleStart:0,angleEnd:Math.PI,heightStart:-55,heightEnd:-65,width:20,depth:8,segments:12}),O.jsx("group",{position:[10,-58,-95],rotation:[0,0,-Math.PI/3],children:O.jsx(Xh,{position:[0,0,0],rotation:[0,Math.PI,0]})}),O.jsx(ZS,{position:[-20,-65,-145],radius:15,angleStart:Math.PI*.5,angleEnd:-Math.PI*.5,heightStart:-65,heightEnd:-75,width:20,depth:8,segments:12}),O.jsx("group",{position:[-5,-70,-145],rotation:[0,Math.PI/2,Math.PI/3],children:O.jsx(Xh,{position:[0,0,0]})}),O.jsx(Fh,{position:tu[3],index:3}),O.jsx(JI,{position:[-20,-75,-190],radius:30,angleStart:Math.PI/2,angleEnd:Math.PI,heightStart:-75,heightEnd:-90,bankingAngle:-.3,segments:10}),O.jsx(da,{start:[-50,-90,-190],end:[-50,-100,-220],width:14,bank:0}),O.jsx(Xh,{position:[-50,-95,-205]}),O.jsx(wS,{position:[-50,-92,-200],type:"SPEED_BOOST"}),O.jsx(bD,{position:[-50,-100,-220],radius:20,entryRotation:0,width:20,depth:8}),O.jsx(da,{start:[-50,-100,-220],end:[-50,-120,-300],width:14}),O.jsx(a0,{position:[-50,-105,-240],axis:"x",range:6,speed:2}),O.jsx(a0,{position:[-50,-110,-260],axis:"x",range:6,speed:3}),O.jsx(a0,{position:[-50,-115,-280],axis:"x",range:6,speed:4}),O.jsx(wS,{position:[-50,-118,-290],type:"JUMP_BOOST"}),O.jsx(da,{start:[-50,-120,-300],end:[0,-130,-330]}),O.jsx(Fh,{position:tu[4],index:4}),O.jsx(da,{start:[0,-130,-330],end:[0,-132,-360]}),O.jsx(da,{start:[0,-132,-360],end:[0,-145,-425],width:14}),O.jsx(ni,{position:[0,-145,-450],size:[30,1,50],color:"#00ff44"}),O.jsx(vD,{position:[0,-135,-455]}),O.jsx(yg,{position:[20,-5,-45]}),O.jsx(yg,{position:[50,-18,-80]}),O.jsx(yg,{position:[75,-35,-90]}),O.jsx(yg,{position:[40,-48,-105]}),O.jsx(yg,{position:[-5,-60,-125]}),O.jsx(yg,{position:[-30,-75,-135]}),O.jsx(yg,{position:[-50,-100,-230]}),[[0,0,-50],[40,-20,-100],[0,-80,-200],[-50,-100,-250]].map((n,e)=>O.jsx(Xp,{speed:2,rotationIntensity:.5,floatIntensity:2,children:O.jsxs("mesh",{position:n,rotation:[0,0,Math.PI/4],children:[O.jsx("torusGeometry",{args:[40,.5,16,100]}),O.jsx("meshBasicMaterial",{color:"#4466ff",transparent:!0,opacity:.2})]})},e))]})';
const grandPrixCourse = 'yD=()=>O.jsxs("group",{children:[O.jsx(da,{start:[0,13,40],end:[0,12,-30],width:16}),O.jsx(JI,{position:[40,0,-30],radius:40,angleStart:Math.PI,angleEnd:Math.PI*1.5,heightStart:12,heightEnd:-15,bankingAngle:.4,segments:16}),O.jsx(Fh,{position:tu[1],index:1,rotation:[0,Math.PI/2,0]}),O.jsx(da,{start:[40,-15,-70],end:[70,-20,-70],bank:.1}),O.jsx(JI,{position:[70,-30,-100],radius:30,angleStart:Math.PI/2,angleEnd:-Math.PI,heightStart:-20,heightEnd:-50,bankingAngle:-.5,segments:24}),O.jsx(Fh,{position:tu[2],index:2}),O.jsx(da,{start:[40,-50,-100],end:[40,-55,-130]}),O.jsx(ZS,{position:[10,-55,-130],radius:30,angleStart:0,angleEnd:Math.PI,heightStart:-55,heightEnd:-65,width:20,depth:8,segments:18}),O.jsx("group",{position:[10,-58,-95],rotation:[0,0,-Math.PI/3],children:O.jsx(Xh,{position:[0,0,0],rotation:[0,Math.PI,0]})}),O.jsx(ZS,{position:[-20,-65,-145],radius:15,angleStart:Math.PI*.5,angleEnd:-Math.PI*.5,heightStart:-65,heightEnd:-75,width:20,depth:8,segments:18}),O.jsx("group",{position:[-5,-70,-145],rotation:[0,Math.PI/2,Math.PI/3],children:O.jsx(Xh,{position:[0,0,0]})}),O.jsx(Fh,{position:tu[3],index:3}),O.jsx(JI,{position:[-20,-75,-190],radius:30,angleStart:Math.PI/2,angleEnd:Math.PI,heightStart:-75,heightEnd:-90,bankingAngle:-.3,segments:12}),O.jsx(da,{start:[-50,-90,-190],end:[-50,-100,-220],width:14,bank:0}),O.jsx(Xh,{position:[-50,-95,-205]}),O.jsx(wS,{position:[-50,-92,-200],type:"SPEED_BOOST"}),O.jsx(bD,{position:[-50,-100,-220],radius:20,entryRotation:0,width:20,depth:8}),O.jsx(da,{start:[-50,-100,-220],end:[-50,-120,-300],width:14}),O.jsx(a0,{position:[-50,-105,-240],axis:"x",range:6,speed:2}),O.jsx(a0,{position:[-50,-110,-260],axis:"x",range:6,speed:3}),O.jsx(a0,{position:[-50,-115,-280],axis:"x",range:6,speed:4}),O.jsx(wS,{position:[-50,-118,-290],type:"JUMP_BOOST"}),O.jsx(da,{start:[-50,-120,-300],end:[0,-130,-330]}),O.jsx(Fh,{position:tu[4],index:4}),O.jsx(da,{start:[0,-130,-330],end:[0,-132,-360]}),O.jsx(da,{start:[0,-132,-360],end:[0,-145,-425],width:14}),O.jsx(JI,{position:[45,-145,-425],radius:45,angleStart:Math.PI,angleEnd:Math.PI*1.5,heightStart:-145,heightEnd:-155,bankingAngle:.45,segments:16}),O.jsx(da,{start:[45,-155,-470],end:[125,-170,-470],width:18,bank:.12}),O.jsx(JI,{position:[125,-170,-520],radius:50,angleStart:Math.PI/2,angleEnd:0,heightStart:-170,heightEnd:-190,bankingAngle:-.5,segments:16}),O.jsx(Fh,{position:tu[5],index:5}),O.jsx(da,{start:[175,-190,-520],end:[175,-205,-620],width:16}),O.jsx(Xh,{position:[175,-198,-570]}),O.jsx(wS,{position:[175,-195,-560],type:"SPEED_BOOST"}),O.jsx(JI,{position:[115,-205,-620],radius:60,angleStart:0,angleEnd:-Math.PI,heightStart:-205,heightEnd:-225,bankingAngle:-.55,segments:24}),O.jsx(da,{start:[55,-225,-620],end:[55,-240,-520],width:16,bank:.1}),O.jsx(JI,{position:[0,-240,-520],radius:55,angleStart:0,angleEnd:Math.PI/2,heightStart:-240,heightEnd:-255,bankingAngle:.45,segments:16}),O.jsx(da,{start:[0,-255,-465],end:[-120,-275,-465],width:18,bank:-.12}),O.jsx(Fh,{position:tu[6],index:6,rotation:[0,Math.PI/2,0]}),O.jsx(JI,{position:[-120,-275,-525],radius:60,angleStart:Math.PI/2,angleEnd:Math.PI,heightStart:-275,heightEnd:-295,bankingAngle:-.5,segments:16}),O.jsx(da,{start:[-180,-295,-525],end:[-180,-320,-700],width:16}),O.jsx(a0,{position:[-180,-305,-585],axis:"x",range:5,speed:2.4}),O.jsx(wS,{position:[-180,-312,-650],type:"JUMP_BOOST"}),O.jsx(Fh,{position:tu[7],index:7}),O.jsx(JI,{position:[-100,-320,-700],radius:80,angleStart:Math.PI,angleEnd:Math.PI*1.5,heightStart:-320,heightEnd:-345,bankingAngle:.55,segments:18}),O.jsx(da,{start:[-100,-345,-780],end:[80,-370,-780],width:18,bank:.1}),O.jsx(JI,{position:[80,-370,-840],radius:60,angleStart:Math.PI/2,angleEnd:0,heightStart:-370,heightEnd:-390,bankingAngle:-.45,segments:16}),O.jsx(da,{start:[140,-390,-840],end:[140,-420,-960],width:16}),O.jsx(ni,{position:[140,-420,-985],size:[30,1,50],color:"#00ff44"}),O.jsx(vD,{position:[140,-410,-990]}),O.jsx(yg,{position:[20,-5,-45]}),O.jsx(yg,{position:[50,-18,-80]}),O.jsx(yg,{position:[75,-35,-90]}),O.jsx(yg,{position:[40,-48,-105]}),O.jsx(yg,{position:[-5,-60,-125]}),O.jsx(yg,{position:[-30,-75,-135]}),O.jsx(yg,{position:[-50,-100,-230]}),O.jsx(yg,{position:[75,-160,-470]}),O.jsx(yg,{position:[175,-198,-585]}),O.jsx(yg,{position:[20,-248,-480]}),O.jsx(yg,{position:[-180,-310,-610]}),O.jsx(yg,{position:[20,-360,-780]}),O.jsx(yg,{position:[140,-400,-900]}),[[0,0,-50],[40,-20,-100],[0,-80,-200],[-50,-100,-250],[100,-180,-500],[-120,-280,-550],[-100,-350,-760],[140,-395,-880]].map((n,e)=>O.jsx(Xp,{speed:2,rotationIntensity:.5,floatIntensity:2,children:O.jsxs("mesh",{position:n,rotation:[0,0,Math.PI/4],children:[O.jsx("torusGeometry",{args:[40,.5,16,100]}),O.jsx("meshBasicMaterial",{color:"#4466ff",transparent:!0,opacity:.2})]})},e))]})';
if (source.includes(shortCourse)) source = source.replace(shortCourse, grandPrixCourse);
else if (!source.includes('O.jsx(vD,{position:[140,-410,-990]})')) {
  throw new Error('Expected the original or extended Velocity course.');
}

await writeFile(bundlePath, source);
console.log(`Velocity Marble Run bundle is patched and ready.`);
