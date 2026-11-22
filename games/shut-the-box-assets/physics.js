/* Presentation math only. The game supplies every final dice value. */
(function (root, factory) {
    const api = factory(root.THREE);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.STBPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (T) {
    'use strict';
    const normals = [null, [0,1,0], [0,0,1], [1,0,0], [-1,0,0], [0,0,-1], [0,-1,0]];
    function faceQuaternion(value, yaw) {
        const face = new T.Vector3(...normals[value]);
        const up = new T.Vector3(0,1,0);
        return new T.Quaternion().setFromAxisAngle(up, yaw)
            .multiply(new T.Quaternion().setFromUnitVectors(face, up));
    }
    function topFace(quaternion) {
        let value = 1, best = -Infinity;
        const v = new T.Vector3();
        for (let n = 1; n <= 6; n++) {
            const height = v.fromArray(normals[n]).applyQuaternion(quaternion).y;
            if (height > best) { best = height; value = n; }
        }
        return value;
    }
    function stepDie(b, dt, bounds) {
        // A fixed small substep gives equivalent trajectories at 30, 60 and 120 Hz.
        const n = Math.max(1, Math.ceil(dt * 240 - 1e-8));
        const h = dt / n;
        for (let i = 0; i < n; i++) {
            b.vy -= 24 * h;
            b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
            if (b.x > bounds.x || b.x < -bounds.x) {
                b.x = Math.max(-bounds.x, Math.min(bounds.x, b.x));
                b.vx *= -.58; b.walls++;
            }
            if (b.z < bounds.zMin || b.z > bounds.zMax) {
                b.z = Math.max(bounds.zMin, Math.min(bounds.zMax, b.z));
                b.vz *= -.58; b.walls++;
            }
            if (b.y < bounds.floor) {
                b.y = bounds.floor;
                if (b.vy < -.8) { b.vy *= -.43; b.bounces++; }
                else b.vy = 0;
                const drag = Math.exp(-3.4 * h);
                b.vx *= drag; b.vz *= drag;
            }
        }
    }
    function separateDice(a,b) {
        if(Math.abs(a.y-b.y)>.9)return;
        let dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);
        if(distance>=1.12)return;
        const overlap=1.12-distance;
        if(distance<.0001){dx=1;dz=0;distance=1;}
        const nx=dx/distance,nz=dz/distance,push=overlap/2;
        a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
        const closing=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;
        if(closing<0){a.vx+=closing*.65*nx;a.vz+=closing*.65*nz;b.vx-=closing*.65*nx;b.vz-=closing*.65*nz;}
    }
    return Object.freeze({ faceQuaternion, topFace, stepDie, separateDice });
});
