/* One opaque floor with terrain extending outward from both faces. The underside reuses
 * the ordinary board geometry, reflected through the floor; apertures cut both faces. */
(function (root) {
  'use strict';
  function create(level, theme, art) {
    var THREE=root.THREE, Core=root.LaserRenderCore, Sim=root.LaserSim;
    var group=new THREE.Group();group.name='two-sided-board';
    var w=level.size.w,d=level.size.d,active='above';
    var upper=root.LaserRenderTerrain.create(theme,null,null,art);
    var lower=root.LaserRenderTerrain.create(theme,null,null,art);
    function face(rows,side) {
      function onFace(p){return (p.side==='below')===(side==='below');}
      return {size:level.size,t:rows,sharedFloor:true,surfaceHoles:function(x,y){return Sim.inHole(level,x,y,0);},
        openings:side==='above'?level.openings:level.duplex.openings,
        emitter:level.emitter,targets:level.targets.filter(onFace),fixed:level.fixed.filter(onFace)};
    }
    upper.build(face(level.t,'above'));lower.build(face(level.duplex.lower,'below'));
    upper.group.name='upper-face';lower.group.name='underside-face';lower.group.scale.y=-1;
    group.add(upper.group,lower.group);
    // The shared floor has a thin edge, not a second platform or any support columns.
    var shell=new THREE.MeshStandardMaterial({color:0x142c38,metalness:0.72,roughness:0.32});
    var trim=new THREE.MeshStandardMaterial({color:0xb9ccd3,metalness:0.78,roughness:0.25});
    var glow=new THREE.MeshBasicMaterial({color:0x8ce5de,toneMapped:false});
    var solids=[],rims=[],marks=[];
    function border(out,x,y,bw,bd,width,height) {
      out.push(Core.boxAt(x,0,-y-bd/2,bw+width,height,width),Core.boxAt(x,0,-y+bd/2,bw+width,height,width),
        Core.boxAt(x-bw/2,0,-y,width,height,bd),Core.boxAt(x+bw/2,0,-y,width,height,bd));
    }
    border(solids,(w-1)/2,(d-1)/2,w+0.12,d+0.12,0.16,0.18);
    border(rims,(w-1)/2,(d-1)/2,w+0.05,d+0.05,0.045,0.20);
    level.duplex.holes.forEach(function(h){
      var x=h.x+(h.w-1)/2,y=h.y+(h.d-1)/2;
      border(solids,x,y,h.w+0.06,h.d+0.06,0.06,0.14);
      border(marks,x,y,h.w+0.035,h.d+0.035,0.025,0.15);
    });
    [[solids,shell,'shared-floor-edge'],[rims,trim,'shared-floor-trim'],[marks,glow,'through-hole-rims']].forEach(function(b){
      var m=new THREE.Mesh(Core.mergeGeometries(b[0]),b[1]);b[0].forEach(function(g){g.dispose();});m.name=b[2];group.add(m);
    });
    // Both halves keep the current game's flat-to-3D material reveal. Nothing becomes transparent.
    function applyReveal(r){upper.applyReveal(r);lower.applyReveal(r);}
    var ray=new THREE.Raycaster(),bounds=new THREE.Box3(),hit=new THREE.Vector3();
    function pick(nx,ny,camera){
      ray.setFromCamera(new THREE.Vector2(nx,ny),camera);
      var sign=active==='below'?-1:1;
      if(ray.ray.direction.y*sign>=-1e-6)return null;
      var best=Infinity,cell=null;
      for(var y=0;y<d;y++)for(var x=0;x<w;x++){
        if(Sim.inHole(level,x,y,0))continue;
        var h=active==='below'?level.duplex.lower[y][x]:level.t[y][x];
        bounds.min.set(x-.5,sign<0?-h-.015:-.001,-y-.5);
        bounds.max.set(x+.5,sign<0?.001:h+.015,-y+.5);
        if(!ray.ray.intersectBox(bounds,hit))continue;
        var distance=ray.ray.origin.distanceToSquared(hit);
        if(distance<best){best=distance;cell={x:x,y:y};if(sign<0)cell.side='below';}
      }
      return cell;
    }
    var points=Array.from(upper.fitPoints()),p=lower.fitPoints();
    for(var i=0;i<p.length;i+=3)points.push(p[i],-p[i+1],p[i+2]);
    return {group:group,pick:pick,fitPoints:points,applyReveal:applyReveal,
      setLayer:function(side){active=side==='below'?'below':'above';},frame:function(){},needsFrame:function(){return false;},
      dispose:function(){upper.dispose();lower.dispose();shell.dispose();trim.dispose();glow.dispose();}};
  }
  root.LaserRenderDuplex={create:create};
}(typeof self!=='undefined'?self:this));
