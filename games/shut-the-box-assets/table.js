/* Local, demand-rendered Shut the Box presentation. Rules stay in the page. */
(function () {
    'use strict';
    // All material, palette and lighting decisions live here. No remote assets.
    const THEMES = Object.freeze({
        common: Object.freeze({ sky:'#fff3df',ground:'#30231d',keyPosition:[-7,16,6],fillPosition:[9,10,-8],woodBump:.025,feltBump:.055,engravingBump:.02,pipBump:.055,brassMetalness:.65,brassRoughness:.32,accentMetalness:.45,accentRoughness:.3,tableShadowOpacity:.19,seamRoughness:.9,dieMetalness:.02,shadowSize:1024,shadowRadius:3 }),
        walnut: { name:'Walnut', wood:'#927362', edge:'#563e30', felt:'#195a3d', table:'#705b49', ink:'#221810', brass:'#c5a168', ivory:'#fff5df', accent:'#ecd0a0', ui:'#21170ff0', text:'#fff3df',
            roughness:.58, feltRoughness:1, dieRoughness:.26, key:'#fff0db', keyPower:2.8, fill:'#cbd8f1', fillPower:.8, ambient:1.45, exposure:1.03 },
        maple: { name:'Maple', wood:'#fff1d2', edge:'#dfd2bc', felt:'#153f78', table:'#c4a079', ink:'#35200e', brass:'#b5945d', ivory:'#fffaf0', accent:'#d7e6ff', ui:'#172334ed', text:'#f5f9ff',
            roughness:.4, feltRoughness:1, dieRoughness:.23, key:'#fff6e7', keyPower:3.5, fill:'#b9d8ff', fillPower:1.1, ambient:1.7, exposure:1.05 },
        ebony: { name:'Ebony', wood:'#252728', edge:'#191817', felt:'#681b34', table:'#302522', ink:'#f4cb80', brass:'#c99b4d', ivory:'#fff0d5', accent:'#f2cb80', ui:'#201613f2', text:'#fff0d9',
            roughness:.44, feltRoughness:1, dieRoughness:.21, key:'#ffe0b3', keyPower:3.6, fill:'#cad1e9', fillPower:.9, ambient:1.55, exposure:1.13 }
    });
    const asset = 'shut-the-box-assets/';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const T = window.THREE, P = window.STBPhysics;
    let view = null, fallbackReason = '';

    function canvasTexture(canvas) {
        const t = new T.CanvasTexture(canvas);
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    }
    function roundedBox(w,h,d,r=.08,segments=5) {
        const g = new T.BoxGeometry(w,h,d,segments,segments,segments);
        const p = g.attributes.position, normal = g.attributes.normal;
        const v = new T.Vector3(), center = new T.Vector3(), n = new T.Vector3();
        for (let i=0;i<p.count;i++) {
            v.fromBufferAttribute(p,i);
            center.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));
            n.copy(v).sub(center).normalize();
            v.copy(center).addScaledVector(n,r);
            p.setXYZ(i,v.x,v.y,v.z); normal.setXYZ(i,n.x,n.y,n.z);
        }
        return g;
    }
    class TableView {
        constructor(host) {
            this.host=host; this.theme='walnut'; this.ids=[]; this.tiles=new Map();
            this.dice=[]; this.values=[]; this.flips=[]; this.throwing=null;
            this.frame=0; this.draws=0; this.lastTime=0; this.active=false;this.available=true;
            this.scene=new T.Scene();
            this.camera=new T.OrthographicCamera(-8,8,6,-6,.1,120);
            this.camera.position.set(0,24,13); this.camera.lookAt(0,0,0);
            this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
            this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2));
            this.renderer.outputColorSpace=T.SRGBColorSpace;
            this.renderer.toneMapping=T.ACESFilmicToneMapping;
            this.renderer.shadowMap.enabled=true;
            this.renderer.shadowMap.type=T.PCFSoftShadowMap;
            this.renderer.shadowMap.autoUpdate=false;
            this.renderer.domElement.setAttribute('aria-hidden','true');
            this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.fail('WebGL context lost');});
            host.append(this.renderer.domElement);
            this.ambient=new T.HemisphereLight(THEMES.common.sky,THEMES.common.ground,1.4);
            this.scene.add(this.ambient);
            this.key=new T.DirectionalLight(0xffdfb7,3);
            this.key.position.fromArray(THEMES.common.keyPosition); this.key.castShadow=true;
            this.key.shadow.mapSize.setScalar(THEMES.common.shadowSize);
            Object.assign(this.key.shadow.camera,{left:-14,right:14,top:16,bottom:-16,near:.5,far:55});
            this.key.shadow.normalBias=.025; this.key.shadow.bias=-.0002; this.key.shadow.radius=THEMES.common.shadowRadius;
            this.scene.add(this.key);
            this.fill=new T.DirectionalLight(0xd4e1ff,.8); this.fill.position.fromArray(THEMES.common.fillPosition);this.scene.add(this.fill);
            this.root=new T.Group(); this.scene.add(this.root);
            this.board=new T.Group(); this.root.add(this.board);
            this.diceGroup=new T.Group(); this.root.add(this.diceGroup);
            this.textures={}; this.images={};
            this.labelCache=new Map(); this.diceMaterial=null;
            this.shadowTex=this.makeShadow();
            this.pendingTheme=null;
            const loader=new T.TextureLoader();
            ['wood','felt','ivory'].forEach(name=>{
                const texture=loader.load(asset+name+'.jpg',t=>{
                    this.images[name]=t.image;
                    if(name==='wood') this.clearLabels();
                    if(name==='ivory') { this.disposeDiceMaterials(); this.clearDice(); }
                    this.rebuild();
                },undefined,()=>{ /* Materials remain usable while offline/file loads fail. */ });
                texture.wrapS=texture.wrapT=T.RepeatWrapping; texture.colorSpace=T.SRGBColorSpace;
                texture.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());
                this.textures[name]=texture;
            });
            this.observer=new ResizeObserver(()=>this.resize()); this.observer.observe(host);
            document.addEventListener('visibilitychange',()=>{
                if(document.hidden) {
                    cancelAnimationFrame(this.frame);this.frame=0;this.lastTime=0;
                } else this.invalidate();
            });
            reduced.addEventListener('change',()=>{this.finishMotion();this.invalidate();});
            this.resize();
        }
        fail(reason) {
            fallbackReason=reason; this.active=false;this.available=false;
            cancelAnimationFrame(this.frame);this.frame=0; this.finishMotion();
            document.body.classList.remove('table-3d');
            this.host.hidden=true;
            document.querySelectorAll('#box-area .tile-wrapper').forEach(el=>el.removeAttribute('style'));
            window.dispatchEvent(new Event('stb-fallback'));
        }
        setActive(active) {
            if(!this.available)return;
            this.active=active;
            if(active) {this.resize();this.invalidate();}
            else {cancelAnimationFrame(this.frame);this.frame=0;this.lastTime=0;}
        }
        setTheme(name) {
            name=['walnut','maple','ebony'].includes(name)?name:'walnut';
            if(this.theme===name && this.materials) return;
            this.theme=name;this.clearLabels();this.disposeDiceMaterials();this.clearDice();this.rebuild();
        }
        clearLabels() {
            this.labelCache.forEach(m=>{m.map.dispose();m.dispose();});this.labelCache.clear();
        }
        disposeDiceMaterials() {
            if(this.diceMaterial) this.diceMaterial.forEach(m=>{m.map.dispose();m.bumpMap.dispose();m.dispose();});
            this.diceMaterial=null;
        }
        resize() {
            const w=this.host.clientWidth,h=this.host.clientHeight;
            if(!w || !h) return;
            const changed=this.w!==w || this.h!==h;
            if(changed && this.throwing)this.finishMotion();
            this.w=w;this.h=h;
            this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
            this.renderer.setSize(w,h,false);
            const side=w<620 && h>w;
            this.camera.position.set(0,side?30:24,side?4:13);this.camera.lookAt(0,0,0);
            if(this.side!==side) {this.side=side;this.clearLabels();}
            if(changed || !this.materials) this.rebuild();
            else this.invalidate();
        }
        mesh(g,m,x,y,z,parent=this.board) {
            const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
        }
        block(w,h,d,x,y,z,material=this.materials.wood,r=.08) {
            return this.mesh(roundedBox(w,h,d,Math.min(r,h*.4,w*.4,d*.4)),material,x,y,z);
        }
        clearBoard() {
            this.flips.length=0;
            this.board.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.board.clear();this.tiles.clear();
            if(this.materials) Object.values(this.materials).forEach(m=>m.dispose());
        }
        rebuild() {
            if(!this.w || !this.textures.wood) return;
            this.clearBoard();
            const th=THEMES[this.theme];
            this.renderer.toneMappingExposure=th.exposure;
            this.key.color.set(th.key);this.key.intensity=th.keyPower;
            this.fill.color.set(th.fill);this.fill.intensity=th.fillPower;this.ambient.intensity=th.ambient;
            this.materials={
                wood:new T.MeshStandardMaterial({color:th.wood,map:this.textures.wood,roughness:th.roughness,bumpMap:this.textures.wood,bumpScale:THEMES.common.woodBump}),
                edge:new T.MeshStandardMaterial({color:th.edge,map:this.textures.wood,roughness:th.roughness}),
                felt:new T.MeshStandardMaterial({color:th.felt,map:this.textures.felt,roughness:th.feltRoughness,bumpMap:this.textures.felt,bumpScale:THEMES.common.feltBump}),
                brass:new T.MeshStandardMaterial({color:th.brass,metalness:THEMES.common.brassMetalness,roughness:THEMES.common.brassRoughness}),
                table:new T.ShadowMaterial({opacity:THEMES.common.tableShadowOpacity}),
                accent:new T.MeshStandardMaterial({color:th.accent,metalness:THEMES.common.accentMetalness,roughness:THEMES.common.accentRoughness}),
                seam:new T.MeshStandardMaterial({color:th.ink,roughness:THEMES.common.seamRoughness})
            };
            this.W=14;
            const aspect=this.w/this.h;
            this.D=this.side?Math.max(7,Math.min(8.1,14*aspect*.94)):Math.max(6.8,Math.min(22,(14/aspect-2.4)/.88));
            const rows=(this.ids.length===18 || (this.side && this.h<620 && this.ids.length===12))?2:1;
            this.twoBanks=rows===2;
            if(this.twoBanks)this.D=Math.max(this.D,9.2);
            const W=this.W,D=this.D;
            this.root.rotation.y=this.side?Math.PI/2:0;
            // Real thickness, an inset felt bed, rounded top rails and dark joinery.
            this.block(W+.9,.58,D+.9,0,-.34,0,this.materials.edge,.12);
            this.block(W,.3,D,0,-.05,0,this.materials.wood,.1);
            this.block(W-.78,.08,D-.78,0,.13,0,this.materials.felt,.03);
            this.block(.44,.95,D+.6,-W/2,.33,0);
            this.block(.44,.95,D+.6,W/2,.33,0);
            this.block(W+.4,.95,.44,0,.33,-D/2);
            this.block(W+.4,.95,.44,0,.33,D/2);
            // Satin rounded lip catches the key light.
            this.block(.53,.16,D+.65,-W/2,.86,0,this.materials.wood,.07);
            this.block(.53,.16,D+.65,W/2,.86,0,this.materials.wood,.07);
            this.block(W+.5,.16,.53,0,.86,-D/2,this.materials.wood,.07);
            this.block(W+.5,.16,.53,0,.86,D/2,this.materials.wood,.07);
            [-1,1].forEach(s=>[-1,1].forEach(e=>{
                for(let i=0;i<3;i++) this.block(.38,.13,.025,s*(W/2-.26),-.28+i*.26,e*(D/2+.228),this.materials.edge,.005);
                const screw=this.mesh(new T.CylinderGeometry(.055,.055,.018,12),this.materials.brass,s*(W/2-.02),.96,e*(D/2-.13));
                this.block(.07,.007,.012,screw.position.x,.973,screw.position.z,this.materials.seam,.002);
            }));
            this.block(70,.3,70,0,-.91,0,this.materials.table,.03);
            const count=rows===2?this.ids.length/2:(this.ids.length||12);
            const pitch=(W-.6)/count,tileW=pitch-.075;
            for(let row=0;row<rows;row++) {
                const sign=row===0?1:-1;
                const hingeZ=sign*(-D/2+1.95);
                this.block(W-.58,.48,2.35,0,.28,sign*(-D/2+1.37),this.materials.wood,.05);
                const axle=this.mesh(new T.CylinderGeometry(.045,.045,W-.4,12),this.materials.brass,0,.64,hingeZ);
                axle.rotation.z=Math.PI/2;
                for(let j=0;j<count;j++) {
                    const id=this.ids[row*count+j]??j+1;
                    const x=-W/2+.3+pitch*(j+.5);
                    const hinge=new T.Group();hinge.position.set(x,.67,hingeZ);hinge.rotation.y=row?Math.PI:0;this.board.add(hinge);
                    const pivot=new T.Group();hinge.add(pivot);
                    const length=1.67;
                    const top=this.labelMaterial(id,row===1);
                    const faces=[this.materials.wood,this.materials.wood,top,top,this.materials.wood,this.materials.wood];
                    const tile=this.mesh(roundedBox(tileW,.2,length,.075,5),faces,0,0,-length/2,pivot);
                    const ring=this.mesh(new T.TorusGeometry(.095,.025,6,16),this.materials.brass,tileW/2-.08,0,0,pivot);ring.rotation.y=Math.PI/2;
                    const marker=this.mesh(roundedBox(tileW*.75,.025,.12,.01),this.materials.accent,0,.115,-length+.14,pivot);marker.visible=false;
                    this.tiles.set(id,{id,row,pivot,tile,marker,width:tileW,length,shut:false});
                }
            }
            this.restoreTileState();
            this.fitCamera();
            this.restoreDice();
            this.invalidate();
        }
        labelMaterial(id,reverse) {
            const key=this.theme+':'+id+':'+this.side+':'+reverse;
            if(this.labelCache.has(key)) return this.labelCache.get(key);
            const th=THEMES[this.theme],c=document.createElement('canvas');c.width=256;c.height=512;
            const ctx=c.getContext('2d');
            ctx.fillStyle='#c9a16d';ctx.fillRect(0,0,256,512);
            if(this.images.wood) {
                const image=this.images.wood,offset=(id*71)%500;
                ctx.drawImage(image,offset,0,image.width-500,image.height,0,0,256,512);
            }
            ctx.globalCompositeOperation='multiply';ctx.fillStyle=th.wood;ctx.fillRect(0,0,256,512);ctx.globalCompositeOperation='source-over';
            ctx.save();ctx.translate(128,224);
            ctx.scale(1,this.side?1.7:1.3);
            if(this.side) ctx.rotate(Math.PI/2);
            if(reverse)ctx.rotate(Math.PI);
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.font=`${id>=100?118:(id>=10?142:180)}px Georgia,serif`;
            const text=id>=100?String(id-100)+'B':String(id);
            // A fine lit bevel and dark cut make the number read as an engraving.
            ctx.fillStyle=this.theme==='ebony'?'#362214':'#efd0a3';ctx.fillText(text,1,3);
            ctx.fillStyle=th.ink;ctx.fillText(text,0,0);ctx.restore();
            const m=new T.MeshStandardMaterial({map:canvasTexture(c),roughness:th.roughness,bumpMap:this.textures.wood,bumpScale:THEMES.common.engravingBump});
            this.labelCache.set(key,m);return m;
        }
        fitCamera() {
            // Fit the physical box, excluding its tabletop, into the actual free viewport.
            this.root.updateMatrixWorld(true);
            const points=[];
            for(const x of [-this.W/2-.5,this.W/2+.5])for(const z of [-this.D/2-.5,this.D/2+.5])for(const y of [-.7,2.3]) points.push(new T.Vector3(x,y,z).applyMatrix4(this.root.matrix));
            this.camera.updateMatrixWorld(true);
            const inv=this.camera.matrixWorldInverse;
            let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
            for(const p of points) {
                p.applyMatrix4(inv);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
            }
            const ratio=this.w/this.h;
            const height=Math.max(maxY-minY,(maxX-minX)/ratio)*1.045;
            const cx=(maxX+minX)/2,cy=(maxY+minY)/2;
            this.camera.left=cx-height*ratio/2;this.camera.right=cx+height*ratio/2;
            this.camera.top=cy+height/2;this.camera.bottom=cy-height/2;
            this.camera.updateProjectionMatrix();
        }
        sync(ids,states) {
            this.states=states;
            if(ids.join(',')!==this.ids.join(',')) {this.ids=ids.slice();this.rebuild();return;}
            this.restoreTileState(true);this.invalidate();
        }
        restoreTileState(animate=false) {
            for(const [id,item] of this.tiles) {
                const s=this.states?.find(x=>x.id===id);
                const shut=!!s?.shut,angle=shut?Math.PI-.1:(this.side?.68:(item.row?.2:.78));
                if(animate && item.shut!==shut && !reduced.matches) this.flips.push({item,from:item.pivot.rotation.x,to:angle,t:0});
                else item.pivot.rotation.x=angle;
                item.shut=shut;item.marker.visible=!!(s?.selected||s?.coach||s?.matched);
                item.tile.material[2].emissive.set(s?.selected||s?.matched?'#714c21':s?.coach?'#315f42':s?.valid?'#211606':'#000000');
                item.tile.material[2].emissiveIntensity=(s?.selected||s?.matched) ? .45 : .18;
            }
        }
        closing(ids) {
            ids.forEach(id=>{const item=this.tiles.get(id);if(!item)return;
                if(reduced.matches)item.pivot.rotation.x=Math.PI-.1;
                else this.flips.push({item,from:item.pivot.rotation.x,to:Math.PI-.1,t:0});
            });this.invalidate();
        }
        positionButtons() {
            // Project only on redraw/resize. These are real focusable buttons, not raycast-only tiles.
            const wrappers=document.querySelectorAll('#box-area .tile-wrapper');
            const p=new T.Vector3();
            for(const el of wrappers) {
                const item=this.tiles.get(+el.dataset.tileId);if(!item)continue;
                let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
                for(const x of [-item.width/2,item.width/2])for(const z of [-item.length,0]) {
                    p.set(x,.14,z);item.pivot.localToWorld(p);p.project(this.camera);
                    const px=(p.x+1)*this.w/2,py=(1-p.y)*this.h/2;
                    minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
                }
                // Side-bank slots are 44.7px apart at the target phone size. Do not
                // include the tilted face's vertical skew in adjacent hit rectangles.
                const w=Math.max(44,maxX-minX),h=this.side?44:Math.max(44,maxY-minY);
                el.style.cssText=`left:${(minX+maxX-w)/2}px;top:${(minY+maxY-h)/2}px;width:${w}px;height:${h}px;`;
                el.dataset.shut=String(item.shut);
            }
        }
        makeShadow() {
            const c=document.createElement('canvas');c.width=c.height=128;
            const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,10,64,64,64);
            g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(.45,'rgba(0,0,0,.22)');g.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return canvasTexture(c);
        }
        makeDiceMaterials() {
            if(this.diceMaterial)return this.diceMaterial;
            const pipPositions={1:[[0,0]],2:[[-1,1],[1,-1]],3:[[-1,1],[0,0],[1,-1]],4:[[-1,-1],[-1,1],[1,-1],[1,1]],5:[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
            const th=THEMES[this.theme];
            this.diceMaterial=[3,4,1,6,2,5].map(n=>{
                const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d');
                ctx.fillStyle=th.ivory;ctx.fillRect(0,0,384,384);
                if(this.images.ivory){ctx.globalAlpha=.65;ctx.drawImage(this.images.ivory,0,0,384,384);ctx.globalAlpha=1;}
                const bump=document.createElement('canvas');bump.width=bump.height=384;const bc=bump.getContext('2d');bc.fillStyle='#aaa';bc.fillRect(0,0,384,384);
                pipPositions[n].forEach(([x,y])=>{
                    const px=192+x*89,py=192+y*89;
                    const g=ctx.createRadialGradient(px-6,py-7,3,px,py,25);
                    g.addColorStop(0,'#11100e');g.addColorStop(.65,'#191713');g.addColorStop(.84,'#3c3931');g.addColorStop(.94,'#918774');g.addColorStop(1,'#efe7d3');
                    ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,25,0,Math.PI*2);ctx.fill();
                    const bg=bc.createRadialGradient(px,py,15,px,py,25);bg.addColorStop(0,'#111');bg.addColorStop(1,'#aaa');bc.fillStyle=bg;bc.beginPath();bc.arc(px,py,25,0,Math.PI*2);bc.fill();
                });
                return new T.MeshStandardMaterial({map:canvasTexture(c),bumpMap:canvasTexture(bump),bumpScale:THEMES.common.pipBump,roughness:th.dieRoughness,metalness:THEMES.common.dieMetalness});
            });return this.diceMaterial;
        }
        clearDice() {
            this.diceGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.userData.contact)o.material.dispose();});
            this.diceGroup.clear();this.dice.length=0;
        }
        restoreDice() {
            if(!this.materials)return;
            if(this.dice.length!==this.values.length) {
                this.clearDice();
                this.values.forEach(()=>{
                    const mesh=this.mesh(roundedBox(.92,.92,.92,.115,8),this.makeDiceMaterials(),0,.66,0,this.diceGroup);
                    const shadow=new T.Mesh(new T.PlaneGeometry(2.2,2.2),new T.MeshBasicMaterial({map:this.shadowTex,transparent:true,depthWrite:false,opacity:.8}));
                    shadow.rotation.x=-Math.PI/2;shadow.position.y=.184;shadow.userData.contact=true;this.diceGroup.add(shadow);
                    this.dice.push({mesh,shadow});
                });
            }
            this.values.forEach((v,i)=>{
                const d=this.dice[i];
                d.target=P.faceQuaternion(v,(i===0?-.28:.35)+(this.side?-Math.PI/2:0));
                if(!this.throwing) {
                    d.mesh.quaternion.copy(d.target);d.mesh.position.set((i-(this.values.length-1)/2)*1.8,.65,this.D*.12+(i?-.4:.35));
                    this.containDie(d);
                    this.updateShadow(d);
                }
            });
        }
        updateShadow(d) {
            const altitude=d.mesh.position.y-.65;
            d.shadow.position.set(d.mesh.position.x+.08,.185,d.mesh.position.z+.1);
            d.shadow.scale.setScalar(1+Math.max(0,altitude)*.26);
            d.shadow.material.opacity=.9/(1+Math.max(0,altitude)*.65);
        }
        showDice(values) {
            this.values=values.slice();this.restoreDice();this.invalidate();
        }
        containDie(d) {
            const bounds=P.rollingBounds(this.W,this.D,this.twoBanks);
            d.mesh.position.x=Math.max(-bounds.x,Math.min(bounds.x,d.mesh.position.x));
            d.mesh.position.z=Math.max(bounds.zMin,Math.min(bounds.zMax,d.mesh.position.z));
        }
        throwDice(values,quick) {
            this.finishMotion();this.values=values.slice();this.restoreDice();
            if(quick || reduced.matches || !this.active || document.hidden) {this.invalidate();return Promise.resolve();}
            const time=1.65;
            return new Promise(resolve=>{
                this.throwing={t:0,duration:time,resolve,bounds:P.rollingBounds(this.W,this.D,this.twoBanks)};
                this.dice.forEach((d,i)=>{
                    // Forward launch from the player rail, then gravity/contact restitution.
                    d.body={x:(i?1:-1)*1.1,y:1.6+i*.5,z:Math.max(this.throwing.bounds.zMin,this.throwing.bounds.zMax-.12),vx:(i?1:-1)*(11+Math.random()*3),vy:4.5+i,vz:-(10+Math.random()*4),bounces:0,walls:0};
                    d.spin=new T.Euler(.3+i,.5,.8);d.mesh.rotation.copy(d.spin);
                    d.settleFrom=new T.Quaternion();
                });this.lastTime=performance.now();this.invalidate();
            });
        }
        finishMotion() {
            if(this.throwing) {
                const done=this.throwing;this.throwing=null;
                this.dice.forEach(d=>{if(d.target)d.mesh.quaternion.copy(d.target);d.mesh.position.y=.65;this.containDie(d);this.updateShadow(d);});
                done.resolve();
            }
            this.flips.forEach(f=>{f.item.pivot.rotation.x=f.to;});this.flips.length=0;
        }
        invalidate() {
            if(!this.active || document.hidden || this.frame)return;
            this.frame=requestAnimationFrame(t=>this.draw(t));
        }
        draw(now) {
            this.frame=0;
            if(!this.active || document.hidden)return;
            // Use real elapsed time: a slow renderer must not stretch a throw's duration.
            // Visibility changes reset lastTime, so hidden time never advances motion.
            const dt=this.lastTime?Math.max(0,(now-this.lastTime)/1000):1/60;this.lastTime=now;
            let moving=false;
            if(this.throwing) {
                const a=this.throwing;a.t+=dt;
                this.dice.forEach((d,i)=>{
                    P.stepDie(d.body,dt,a.bounds);
                    d.mesh.position.set(d.body.x,d.body.y,d.body.z);
                    if(a.t<1.05) {
                        d.spin.x+=dt*(9-i);d.spin.y+=dt*(6+i);d.spin.z+=dt*(7-i*2);d.mesh.rotation.copy(d.spin);
                        d.settleFrom.copy(d.mesh.quaternion);
                    } else {
                        const u=Math.min(1,(a.t-1.05)/.6),ease=u*u*(3-2*u);
                        d.mesh.quaternion.slerpQuaternions(d.settleFrom,d.target,ease);
                        d.mesh.position.y=.65+Math.max(0,d.body.y-.65)*(1-ease);
                    }
                    this.updateShadow(d);
                });
                if(this.dice.length===2) {
                    const first=this.dice[0],second=this.dice[1];
                    P.separateDice(first.body,second.body);
                    [first,second].forEach(d=>{
                        d.body.x=Math.max(-a.bounds.x,Math.min(a.bounds.x,d.body.x));
                        d.body.z=Math.max(a.bounds.zMin,Math.min(a.bounds.zMax,d.body.z));
                        d.mesh.position.x=d.body.x;d.mesh.position.z=d.body.z;this.updateShadow(d);
                    });
                }
                if(a.t>=a.duration) {this.finishMotion();}else moving=true;
            }
            for(let i=this.flips.length-1;i>=0;i--) {
                const f=this.flips[i];f.t+=dt;
                const u=Math.min(1,f.t/.36),ease=1-Math.pow(1-u,3);
                f.item.pivot.rotation.x=f.from+(f.to-f.from)*ease;
                if(u>=1)this.flips.splice(i,1);else moving=true;
            }
            this.root.updateMatrixWorld(true);
            this.renderer.shadowMap.needsUpdate=true;
            this.renderer.render(this.scene,this.camera);this.draws++;
            this.positionButtons();
            if(moving)this.invalidate();else this.lastTime=0;
        }
        debug() {
            return { renderer:'webgl', logicalDice:window.STBTable.logicalValues(), topFaces:this.dice.map(d=>P.topFace(d.mesh.quaternion)), settled:!this.throwing,
                table:this.theme, sideTiles:this.side, banks:this.twoBanks?2:1, tileCount:this.tiles.size, renderCount:this.draws, scheduled:!!this.frame, dpr:this.renderer.getPixelRatio(),
                feltBounds:P.rollingBounds(this.W,this.D,this.twoBanks),dicePositions:this.dice.map(d=>({x:d.mesh.position.x,y:d.mesh.position.y,z:d.mesh.position.z})),
                contacts:this.dice.map(d=>({felt:d.body?.bounces||0,walls:d.body?.walls||0})) };
        }
    }
    window.STBTable={
        themes:THEMES,
        init() {
            if(!T || !P){fallbackReason='WebGL library unavailable';return;}
            try {
                view=new TableView(document.getElementById('table-view'));
                document.body.classList.add('table-3d');
            } catch(e) {fallbackReason=String(e.message);view?.fail(fallbackReason);view=null;}
        },
        logicalValues:()=>[],
        active(value){view?.setActive(value);},
        theme(name) {
            name=['walnut','maple','ebony'].includes(name)?name:'walnut';const t=THEMES[name];
            document.body.dataset.table=name;
            for(const [key,value] of Object.entries({wood:t.wood,felt:t.felt,accent:t.accent,panel:t.ui,text:t.text,ink:t.ink,background:t.table}))document.documentElement.style.setProperty('--table-'+key,value);
            view?.setTheme(name);
        },
        sync(ids,states){view?.sync(ids,states);},
        closing(ids){view?.closing(ids);},
        dice(values){view?.showDice(values);},
        throw(values,quick){return view?.available?view.throwDice(values,quick):null;},
        debug(){return view?.available?view.debug():{renderer:'2d',logicalDice:this.logicalValues(),topFaces:[...document.querySelectorAll('.die-cube')].map(c=>+c.dataset.face),settled:!window.STBFlatThrowing,reason:fallbackReason};}
    };
    Object.defineProperty(window,'__stbDebug',{value:()=>Object.freeze(window.STBTable.debug()),writable:false,configurable:false});
})();
