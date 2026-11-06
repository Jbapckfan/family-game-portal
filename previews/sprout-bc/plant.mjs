const LEAF='./assets/leaf.png';
const leaf=(x,y,w,h,angle=0,extra='')=>`<g transform="translate(${x} ${y}) rotate(${angle})"><svg class="leaf-surface" x="${-w/2}" y="${-h}" width="${w}" height="${h}" viewBox="190 0 875 1280" preserveAspectRatio="none" ${extra}><image href="${LEAF}" width="1280" height="1280"/></svg></g>`;
const defs=`<defs>
<linearGradient id="stem" x1="0" x2="1" y1="0" y2="0"><stop stop-color="#163d0f"/><stop offset=".22" stop-color="#547921"/><stop offset=".43" stop-color="#b3ca5f"/><stop offset=".57" stop-color="#70952d"/><stop offset="1" stop-color="#254d15"/></linearGradient>
<linearGradient id="glyph" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#c1d76b"/><stop offset=".18" stop-color="#71972b"/><stop offset=".39" stop-color="#3c711a"/><stop offset=".55" stop-color="#729e2a"/><stop offset=".68" stop-color="#a2bd45"/><stop offset="1" stop-color="#285418"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e3eda5" stop-opacity=".8"/><stop offset=".4" stop-color="#d4e896" stop-opacity="0"/></linearGradient>
<pattern id="veins" patternUnits="userSpaceOnUse" width="83" height="110"><image href="${LEAF}" width="100" height="120" x="-10"/></pattern>
<filter id="shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="1" dy="4" stdDeviation="2" flood-color="#183f27" flood-opacity=".18"/></filter>
</defs>`;
function stem(d,width=9,other='') {return `<path d="${d}" fill="none" stroke="url(#stem)" stroke-width="${width}" stroke-linecap="round" ${other}/><path d="${d}" fill="none" stroke="#c3dc85" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>`;}
function branch(word,index,y,fresh=false,active=false,target=word.length){
  const length=target,spacing=Math.min(76,438/length),start=112+(438-spacing*(length-1))/2,w=spacing*1.02,h=w*1.38;
  const last=start+(length-1)*spacing;
  const d=`M76 ${y+15} C120 ${y+37},${last-90} ${y+39},${last+16} ${y+9}`;
  return `<g class="word-branch ${fresh?'fresh-growth':''} ${active?'active-tip':''}" data-stage="${length}" aria-label="${active?'Growing':word}">${stem(d,active?3:7,'class="branch-path" pathLength="1"')}
  ${Array.from({length},(_,i)=>{const x=start+i*spacing,base=y+17+Math.sin(i/(length-1)*Math.PI)*12,angle=-10+i*3;
   return `<g transform="translate(${x} ${base})"><g class="leaf-unfurl" style="--leaf-order:${i}">${active?'':stem(`M0 8Q1 -1 0 -13`,2.4)}${leaf(0,0,w,h,angle,active?'opacity=".48"':'')}<text class="leaf-letter ${active?'tip-letter':''}" data-letter="${i}" x="0" y="${-h*.42}" transform="rotate(${angle})" text-anchor="middle" dominant-baseline="middle" font-size="${Math.min(40,w*.42)}">${word[i]?.toUpperCase()||''}</text></g></g>`;
  }).join('')}${active?'':`<text class="stage-number" x="76" y="${y+17}" text-anchor="middle" dominant-baseline="middle">${length}</text>`}</g>`;
}
function vineWord(word,index,y,fresh=false,active=false,target=word.length){
 const length=target,width=Math.min(440,140+length*37),x=300-width/2,fontSize=111;
 const label=word.toUpperCase();
 const t=`x="${x}" y="${y+12}" textLength="${active?Math.max(1,width*word.length/length):width}" lengthAdjust="spacingAndGlyphs" font-size="${fontSize}" font-family="Baskerville, 'Palatino Linotype', Georgia, serif" font-weight="500" font-style="italic"`;
 return `<g class="word-vine ${fresh?'fresh-growth':''} ${active?'active-tip':''}" data-stage="${length}" aria-label="${active?'Growing':word}"><g class="vine-unfurl">${active?`<g class="tip-bud" style="display:${word?'none':'inline'}">${leaf(320,y+8,80,100,38)}</g>`:''}
 <text ${t} fill="#234716" stroke="#264d13" stroke-width="4.5" transform="translate(1 4)" class="vine-depth">${label}</text>
 <text ${t} fill="url(#glyph)" stroke="#88a838" stroke-width="1.1" class="vine-face">${label}</text>
 <text ${t} fill="url(#veins)" opacity=".23" class="vine-texture">${label}</text>
 <text ${t} fill="none" stroke="url(#shine)" stroke-width="1" transform="translate(-.5 -1)" class="vine-highlight">${label}</text>
 ${active?'':`${stem(`M${x+15} ${y+15} C${x+width*.38} ${y+33},${x+width*.72} ${y-3},${x+width-7} ${y+13}`,6)}${leaf(x+width*.25,y-68,49,58,-36)}${leaf(x+width*.72,y-65,47,56,31)}${leaf(x-2,y+6,62,72,-63)}${leaf(x+width-4,y+10,57,69,59)}`}
 </g></g>`;
}
export function plantMarkup({view,stack,typed,status,growing}) {
 const active=status==='playing',rows=stack.length+(active?1:0),height=rows*114+170,soilY=height-99,topY=soilY-(rows-1)*114-50;
 const positions=stack.map((_,i)=>soilY-50-i*114);
 const main=positions.map((y,i)=>({x:i%2?94:76,y}));
 let art='';
 if(view==='b') {
   const tipY=active?topY:positions.at(-1)-49;
   let trunk=`M278 ${soilY+5} C260 ${soilY-29},116 ${soilY+22},76 ${positions[0]+15}`;
   for(let i=1;i<rows;i++){const y=soilY-50-i*114,from=y+114;trunk+=` C${i%2?39:112} ${from-25},${i%2?116:43} ${y+48},80 ${y+15}`;}
   art+=stem(trunk,15);
   art+=leaf(231,soilY+2,118,135,-67)+leaf(274,soilY+4,106,120,64);
   art+=stack.map((word,i)=>branch(word,i,positions[i],growing&&i===stack.length-1)).join('');
   for(let i=0;i<stack.length;i++)art+=leaf(80,positions[i]+13,70,83,-62-i%2*10);
   if(active)art+=branch(typed,rows-1,topY,false,true,stack.at(-1).length+1);
 } else {
   art+=stem(`M300 ${soilY+8} C260 ${soilY-3},287 ${soilY-24},300 ${positions[0]+13}`,14);
   art+=leaf(290,soilY+7,106,114,-67)+leaf(315,soilY+5,93,104,64);
   for(let i=0;i<rows-1;i++){
     const y=positions[i],right=i%2===0,endY=y-114,fromWidth=Math.min(440,140+stack[i].length*37),toWidth=Math.min(440,140+(stack[i].length+1)*37);
     const fromX=300+(right?1:-1)*(fromWidth/2-8),toX=300+(right?1:-1)*(toWidth/2-8),outerX=right?565:35;
     art+=stem(`M${fromX} ${y+13} C${outerX} ${y+5},${outerX} ${endY+44},${toX} ${endY+12}`,9);
     art+=leaf((fromX+outerX)/2,y-33,45,64,right?45:-45);
   }
   art+=stack.map((word,i)=>vineWord(word,i,positions[i],growing&&i===stack.length-1)).join('');
   if(active)art+=vineWord(typed,rows-1,topY,false,true,stack.at(-1).length+1);
 }
 if(status==='won')art+=stem(`M300 ${positions.at(-1)-22} Q282 ${positions.at(-1)-65} 300 ${positions.at(-1)-102}`,6)+`<g transform="translate(300 ${positions.at(-1)-83})"><g class="bloom ${growing?'fresh-bloom':''}" data-bloom="true"><image href="./assets/flower.png" x="-64" y="-86" width="128" height="128"/></g></g>`;
 const tipLabel=active?`<text x="300" y="${topY-92}" class="tip-label" text-anchor="middle">${stack.at(-1).length+1} LETTERS · YOUR NEXT GROWTH</text>`:'';
 return `<svg viewBox="0 ${status==='won'?-65:-20} 600 ${height+(status==='won'?105:60)}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-design="${view}" data-growth="${stack.at(-1).length}">${defs}<ellipse cx="300" cy="${height-21}" rx="180" ry="12" fill="#71889a" opacity=".1"/>${tipLabel}<g class="living-plant">${art}</g><image href="./assets/planter.png" x="105" y="${soilY-4}" width="390" height="130"/></svg>`;
}
export function updateTip(root,view,typed) {
 const tip=root.querySelector('.active-tip'); if(!tip)return;
 if(view==='b')tip.querySelectorAll('[data-letter]').forEach((node,i)=>node.textContent=typed[i]?.toUpperCase()||'');
 else {const target=Number(tip.dataset.stage),width=Math.min(440,140+target*37);tip.querySelectorAll('text').forEach(node=>{node.textContent=typed.toUpperCase();node.setAttribute('textLength',Math.max(1,width*typed.length/target));});const bud=tip.querySelector('.tip-bud');if(bud)bud.style.display=typed?'none':'inline';}
}
export function animateGrowth(root,delay=0) {
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 root.querySelectorAll('.fresh-growth .leaf-unfurl').forEach((leaf,i)=>leaf.animate([{transform:'scale(.16, .03) rotate(-24deg)',opacity:.1},{transform:'scale(1.05, 1.04) rotate(2deg)',opacity:1,offset:.8},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:1100,delay:delay+i*75,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
 root.querySelectorAll('.fresh-growth .branch-path').forEach(path=>path.animate([{strokeDasharray:'1',strokeDashoffset:'1'},{strokeDasharray:'1',strokeDashoffset:'0'}],{duration:850,delay,easing:'ease-out',fill:'backwards'}));
 root.querySelectorAll('.fresh-growth .vine-unfurl').forEach(vine=>vine.animate([{clipPath:'inset(-20% 100% -20% -20%)',transform:'scaleY(.65)'},{clipPath:'inset(-20% -20% -20% -20%)',transform:'scaleY(1)'}],{duration:1400,delay,easing:'cubic-bezier(.2,.75,.2,1)',fill:'backwards'}));
 root.querySelectorAll('.fresh-bloom').forEach(bloom=>bloom.animate([{transform:'scale(.12) rotate(-40deg)',opacity:0},{transform:'scale(1.08) rotate(3deg)',opacity:1,offset:.83},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:1800,delay,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
}
