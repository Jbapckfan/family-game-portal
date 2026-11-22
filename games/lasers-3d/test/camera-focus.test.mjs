// DOM-free focus regression: real vendored Three.js math, no renderer or browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const THREE=require('../vendor/three.min.js');
const theme=require('../src/theme.js');
const root={THREE,LaserRenderCore:{clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v))}};
vm.runInNewContext(readFileSync(new URL('../src/render-camera.js',import.meta.url),'utf8'),{self:root,Promise,Float32Array});
const camera=root.LaserRenderCamera;
function focus(box,point,visible,center=false){
  assert.equal(typeof camera.focusPanDelta,'function','camera must provide a bounded automatic focus');
  return camera.focusPanDelta(box,point,visible,center,24);
}
const visible={left:0,top:80,right:916,bottom:780};
const box={left:130,top:100,right:786,bottom:756};
test('non-zoom tutorial focus leaves an already fitted board exactly still',()=>{
  const d=focus(box,{x:230,y:600},visible);
  assert.equal(d.x,0);assert.equal(d.y,0);
});
test('forced focus uses the visible stage centre and retains every fitted edge',()=>{
  const d=focus(box,{x:230,y:600},visible,true);
  assert.equal(d.x,130);assert.equal(d.y,-20);
  assert.ok(box.left+d.x>=visible.left&&box.right+d.x<=visible.right);
  assert.ok(box.top+d.y>=visible.top&&box.bottom+d.y<=visible.bottom);
});
test('a bottom tray restricts focus to the unobscured rectangle',()=>{
  const d=focus({left:20,top:80,right:800,bottom:680},{x:60,y:130},
    {left:0,top:80,right:820,bottom:700},true);
  assert.equal(d.x,20);assert.equal(d.y,20);
});
test('a zoomed phone pans to a hidden cell without revealing empty space past board edges',()=>{
  const board={left:-220,top:-100,right:620,bottom:740};
  const viewport={left:0,top:100,right:393,bottom:600};
  const d=focus(board,{x:590,y:700},viewport);
  assert.equal(d.x,-227);assert.equal(d.y,-140);
  assert.ok(board.left+d.x<=viewport.left&&board.right+d.x>=viewport.right);
  assert.ok(board.top+d.y<=viewport.top&&board.bottom+d.y>=viewport.bottom);
});
test('non-zoom focus leaves a visible cell on an oversized phone board alone',()=>{
  const d=focus({left:-220,top:-100,right:620,bottom:740},{x:200,y:300},
    {left:0,top:100,right:393,bottom:600});
  assert.equal(d.x,0);assert.equal(d.y,0);
});
test('repeated automatic focus does not accumulate a pan',()=>{
  const first=focus(box,{x:230,y:600},visible,true);
  const shifted={left:box.left+first.x,right:box.right+first.x,top:box.top+first.y,bottom:box.bottom+first.y};
  const again=focus(shifted,{x:230+first.x,y:600+first.y},visible,true);
  assert.equal(again.x,0);assert.equal(again.y,0);
});
function rigAt(w,h,n=12){
  const rig=camera.create({theme,size:{w,h}});
  rig.setBoard(new THREE.Vector3((n-1)/2,0,-(n-1)/2),
    new Float32Array([-.5,0,.5,n-.5,0,.5,-.5,0,-n+.5,n-.5,0,-n+.5]));
  return rig;
}
test('real tablet rig preserves automatic framing when tutorial focuses an off-centre solution',()=>{
  const rig=rigAt(916,700), before=rig.getCamera();
  assert.equal(typeof rig.focusScreenPoint,'function');
  const rect={left:0,top:80,width:916,height:700,right:916,bottom:780};
  rig.focusScreenPoint({x:250,y:600},rect,rect,false);
  assert.deepEqual(rig.getCamera().pan,before.pan);assert.equal(rig.getCamera().manual,false);
});
test('real phone rig preserves the 34px floor while focusing a hidden far corner',()=>{
  const rig=rigAt(393,500,24), before=rig.getCellPx();
  assert.equal(typeof rig.focusScreenPoint,'function');
  const rect={left:0,top:100,width:393,height:500,right:393,bottom:600};
  const p=new THREE.Vector3(23,0,0).project(rig.camera);
  rig.focusScreenPoint({x:(p.x+1)*393/2,y:100+(1-p.y)*500/2},rect,rect,false);
  assert.ok(rig.getCellPx()>=34-1e-9);assert.equal(rig.getCellPx(),before);
  assert.ok(rig.pan.lengthSq()>0);
});
