/**
 * MarbleFX - the trail and aura a marble wears (Shop.TRAILS, Shop.AURAS),
 * and the Bubble Shield upgrade's bubble.
 *
 * The same object draws them in the game (Scene3D) and in the store's live
 * preview (SkinPreview below), so what you try on is what you race with.
 * Trails are ribbons through positions sampled at 60 Hz (camera-facing, or a
 * wall standing on the track), plus particles for some. Auras are small
 * meshes and sprites that travel with the marble without rolling with it.
 */
class FXRibbon {
    constructor(max) {
        this.max = max;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 6), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(max * 6), 3));
        const idx = [];
        for (let i = 0; i < max - 1; i++) {
            const a = i * 2;
            idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        geo.setIndex(idx);
        // u runs across the ribbon (for the soft-edge texture), v along it
        const uv = new Float32Array(max * 4);
        for (let i = 0; i < max; i++) { uv[i * 4] = 0; uv[i * 4 + 1] = i / (max - 1); uv[i * 4 + 2] = 1; uv[i * 4 + 3] = i / (max - 1); }
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setDrawRange(0, 0);
        this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
            map: FXRibbon.softEdge()
        }));
        this.mesh.frustumCulled = false;
        this.n = 0;
    }

    /** Bright down the middle, fading to nothing at both edges */
    static softEdge() {
        if (FXRibbon._soft) return FXRibbon._soft;
        const c = document.createElement('canvas');
        c.width = 64; c.height = 2;
        const g = c.getContext('2d');
        const gr = g.createLinearGradient(0, 0, 64, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.3, 'rgba(255,255,255,0.75)');
        gr.addColorStop(0.5, 'rgba(255,255,255,1)');
        gr.addColorStop(0.7, 'rgba(255,255,255,0.75)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 64, 2);
        FXRibbon._soft = new THREE.CanvasTexture(c);
        return FXRibbon._soft;
    }

    /** Soft edges for glows; hard edges where the shape matters (the light wall) */
    setSoft(on) {
        const want = on ? FXRibbon.softEdge() : null;
        if (this.mesh.material.map !== want) {
            this.mesh.material.map = want;
            this.mesh.material.needsUpdate = true;
        }
    }

    /** Set vertex pair i: two positions and two colours (already scaled by alpha) */
    set(i, ax, ay, az, bx, by, bz, r1, g1, b1, r2 = r1, g2 = g1, b2 = b1) {
        const p = this.mesh.geometry.attributes.position.array;
        const c = this.mesh.geometry.attributes.color.array;
        const o = i * 6;
        p[o] = ax; p[o + 1] = ay; p[o + 2] = az; p[o + 3] = bx; p[o + 4] = by; p[o + 5] = bz;
        c[o] = r1; c[o + 1] = g1; c[o + 2] = b1; c[o + 3] = r2; c[o + 4] = g2; c[o + 5] = b2;
    }

    commit(n) {
        this.n = n;
        const g = this.mesh.geometry;
        g.setDrawRange(0, Math.max(0, n - 1) * 6);
        g.attributes.position.needsUpdate = true;
        g.attributes.color.needsUpdate = true;
    }
}

/** Additive point sprites with their own size, colour, gravity and behaviour */
class FXParticles {
    constructor(texture, max) {
        this.max = max;
        this.list = [];
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(max * 3), 3));
        geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(max), 1));
        geo.setDrawRange(0, 0);
        this.mesh = new THREE.Points(geo, new THREE.ShaderMaterial({
            uniforms: { map: { value: texture }, uScale: { value: 400 } },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float uScale;
                void main() {
                    vColor = color;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * uScale / max(0.1, -mv.z);
                    gl_Position = projectionMatrix * mv;
                }`,
            fragmentShader: `
                uniform sampler2D map;
                varying vec3 vColor;
                void main() {
                    float a = texture2D(map, gl_PointCoord).a;
                    gl_FragColor = vec4(vColor, a);
                }`,
            blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        }));
        this.mesh.frustumCulled = false;
    }

    /** kind: 'sparkle' (twinkles, hangs in the air), 'fire' (rises, yellow to red), 'spark' (fast, falls) */
    add(kind, x, y, z, vx, vy, vz, life, size, r, g, b) {
        if (this.list.length >= this.max) this.list.shift();
        this.list.push({ kind, x, y, z, vx, vy, vz, life, max: life, size, r, g, b, seed: Math.random() * 6.28 });
    }

    update(dt, time) {
        const g = this.mesh.geometry;
        const pos = g.attributes.position.array, col = g.attributes.color.array, sz = g.attributes.size.array;
        let n = 0;
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.life -= dt;
            if (p.life <= 0) { this.list.splice(i, 1); continue; }
            const u = 1 - p.life / p.max; // 0 at birth, 1 at death
            let k = 1, s = p.size;
            if (p.kind === 'fire') {
                p.vy += 5 * dt;
                p.vx *= 0.94; p.vz *= 0.94;
                s = p.size * (0.6 + u * 0.9);
                // White-yellow, then orange, then a dark red as it dies
                const heat = 1 - u;
                pos[n * 3] = p.x += p.vx * dt; pos[n * 3 + 1] = p.y += p.vy * dt; pos[n * 3 + 2] = p.z += p.vz * dt;
                col[n * 3] = 1.6 * Math.min(1, heat * 1.6) * (1 - u * 0.5);
                col[n * 3 + 1] = 1.1 * heat * heat;
                col[n * 3 + 2] = 0.4 * heat * heat * heat;
                sz[n] = s;
                n++;
                continue;
            }
            if (p.kind === 'sparkle') {
                p.vx *= 0.96; p.vy *= 0.96; p.vz *= 0.96;
                k = (0.45 + 0.55 * Math.max(0, Math.sin(time * 18 + p.seed * 7))) * (1 - u * u);
                s = p.size * (0.7 + 0.5 * Math.sin(time * 11 + p.seed));
            } else {
                p.vy -= 14 * dt;
                p.vx *= 0.97; p.vy *= 0.97; p.vz *= 0.97;
                k = 1 - u;
            }
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z;
            col[n * 3] = p.r * k; col[n * 3 + 1] = p.g * k; col[n * 3 + 2] = p.b * k;
            sz[n] = s;
            n++;
        }
        g.setDrawRange(0, n);
        g.attributes.position.needsUpdate = true;
        g.attributes.color.needsUpdate = true;
        g.attributes.size.needsUpdate = true;
    }

    clear() {
        this.list.length = 0;
        this.mesh.geometry.setDrawRange(0, 0);
    }
}

class MarbleFX {
    /**
     * Trail shapes. len: samples kept (60 a second); width/height in metres;
     * alpha: peak brightness. mode: billboard ribbon, 'wall' standing on the
     * track, or 'bolt' (jagged, re-drawn constantly).
     */
    static TRAILS = {
        stock: { len: 12, width: 0.2, alpha: 0.5, shape: 'taper' },
        comet: { len: 30, width: 0.46, alpha: 1.25, shape: 'comet' },
        light: { len: 40, height: 0.95, alpha: 0.8, mode: 'wall' },
        stardust: { len: 14, width: 0.14, alpha: 0.35, shape: 'taper', particles: 'sparkle' },
        lightning: { len: 22, width: 0.075, alpha: 1.5, mode: 'bolt' },
        inferno: { len: 18, width: 0.36, alpha: 0.8, shape: 'fire', particles: 'fire' },
        rainbow: { len: 36, width: 0.44, alpha: 1.1, shape: 'rainbow' }
    };

    constructor(scene, glowTexture, radius) {
        this.scene = scene;
        this.glowTex = glowTexture;
        this.r = radius;
        this.time = 0;
        this.samples = [];          // { p: Vector3, n: Vector3 } at 60 Hz, oldest first
        this.pool = [];
        this.sampleClock = 0;
        this.sampleDt = 1 / 60;     // the store's slow showroom samples less often so trails show their length
        this.maxLen = Infinity;     // metres of trail drawn (the game stops it short of the chase camera)
        this.emitClock = 0;
        this.glow = new THREE.Color('#6366f1');
        this.trailColor = new THREE.Color('#6366f1');
        this.envMap = null;
        this.lowQuality = false;

        this.ribbons = [new FXRibbon(44), new FXRibbon(44)];
        for (const rb of this.ribbons) scene.add(rb.mesh);
        this.particles = new FXParticles(glowTexture, 320);
        scene.add(this.particles.mesh);
        this.aura = new THREE.Group();
        scene.add(this.aura);
        this.auraParts = null;

        // Bubble Shield: a fresnel bubble round the marble while a shield is armed
        this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.42, 32, 20), new THREE.ShaderMaterial({
            uniforms: { uColor: { value: new THREE.Color('#5ee7ff') }, uAmt: { value: 1 }, uTime: { value: 0 } },
            vertexShader: `
                varying vec3 vN; varying vec3 vV; varying vec3 vP;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vN = normalize(mat3(modelMatrix) * normal);
                    vV = normalize(cameraPosition - wp.xyz);
                    vP = position;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }`,
            fragmentShader: `
                uniform vec3 uColor; uniform float uAmt; uniform float uTime;
                varying vec3 vN; varying vec3 vV; varying vec3 vP;
                void main() {
                    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
                    float hex = 0.5 + 0.5 * sin(vP.x * 18.0 + uTime * 2.0) * sin(vP.y * 18.0 - uTime * 1.3) * sin(vP.z * 18.0);
                    gl_FragColor = vec4(uColor * (f * 1.4 + hex * 0.06) * uAmt, 1.0);
                }`,
            blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        }));
        this.shieldMesh.visible = false;
        this.shields = 0;
        this.shieldPop = 0;
        scene.add(this.shieldMesh);

        this.trailId = 'stock';
        this.auraId = 'none';
        this.boltClock = 0;
        this.tmpA = new THREE.Vector3();
        this.tmpB = new THREE.Vector3();
        this.tmpC = new THREE.Vector3();
        this.col = new THREE.Color();
    }

    /** Wear a trail and an aura, coloured from the marble's style */
    setLook(trailId, auraId, style, envMap = null) {
        this.trailId = MarbleFX.TRAILS[trailId] ? trailId : 'stock';
        this.glow = new THREE.Color(style?.glowColor || '#6366f1');
        this.trailColor = new THREE.Color(style?.trailColor || style?.glowColor || '#6366f1');
        // Grey glows read as white light, so effects in "the marble's colour" stay bright
        const hsl = this.glow.getHSL({ h: 0, s: 0, l: 0 });
        this.vivid = this.glow.clone();
        if (hsl.s > 0.15) this.vivid.setHSL(hsl.h, Math.max(0.75, hsl.s), 0.55);
        else this.vivid.setRGB(0.9, 0.95, 1);
        this.envMap = envMap;
        this.ribbons[0].setSoft(MarbleFX.TRAILS[this.trailId].mode !== 'wall');
        if (auraId !== this.auraId || !this.auraParts) this.buildAura(auraId);
        else this.recolorAura();
        this.particles.clear();
        for (const rb of this.ribbons) rb.commit(0);
    }

    resetTrail() {
        while (this.samples.length) this.pool.push(this.samples.shift());
        this.particles.clear();
        for (const rb of this.ribbons) rb.commit(0);
    }

    setShields(n) {
        this.shields = n;
    }

    /** A shield takes the hit: the bubble flashes and bursts */
    popShield(pos) {
        this.shieldPop = 1;
        for (let i = 0; i < 26; i++) {
            const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, sq = Math.sqrt(1 - u * u), v = 4 + Math.random() * 5;
            this.particles.add('spark', pos.x + sq * Math.cos(th) * this.r * 1.4, pos.y + u * this.r * 1.4, pos.z + sq * Math.sin(th) * this.r * 1.4,
                sq * Math.cos(th) * v, u * v + 2, sq * Math.sin(th) * v, 0.5 + Math.random() * 0.3, 0.32, 0.5, 1.1, 1.4);
        }
    }

    // ------------------------------------------------------------------
    // Auras
    // ------------------------------------------------------------------

    clearAura() {
        for (const ch of [...this.aura.children]) {
            this.aura.remove(ch);
            ch.traverse(o => { o.geometry?.dispose(); if (o.material && o.material !== this.sharedSpriteMat) o.material.dispose?.(); });
        }
        if (this.auraRibbons) for (const rb of this.auraRibbons) { this.scene.remove(rb.mesh); rb.mesh.geometry.dispose(); rb.mesh.material.dispose(); }
        this.auraRibbons = [];
        this.auraParts = null;
    }

    glowSprite(color, scale, opacity = 1) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
        s.scale.setScalar(scale);
        return s;
    }

    static flameTexture() {
        if (MarbleFX._flame) return MarbleFX._flame;
        const c = document.createElement('canvas');
        c.width = 64; c.height = 128;
        const g = c.getContext('2d');
        // A teardrop, round at the bottom and licking to a point at the top:
        // nested copies, each smaller and stacked, so the edges are soft and the core bright
        for (let k = 0; k < 10; k++) {
            const sc = 1 - k * 0.085;
            g.save();
            g.translate(32, 100);
            g.scale(sc, sc * (1 - k * 0.02));
            g.translate(-32, -100);
            const grad = g.createLinearGradient(0, 4, 0, 120);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(0.45, 'rgba(255,255,255,0.08)');
            grad.addColorStop(1, 'rgba(255,255,255,0.16)');
            g.fillStyle = grad;
            g.beginPath();
            g.moveTo(32, 4);
            g.bezierCurveTo(44, 40, 60, 70, 57, 96);
            g.bezierCurveTo(54, 122, 10, 122, 7, 96);
            g.bezierCurveTo(4, 70, 20, 40, 32, 4);
            g.fill();
            g.restore();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        MarbleFX._flame = t;
        return t;
    }

    buildAura(id) {
        this.clearAura();
        this.auraId = MarbleFX.AURA_IDS.includes(id) ? id : 'none';
        const r = this.r;
        const parts = { id: this.auraId };
        const add = (o) => { this.aura.add(o); return o; };
        if (this.auraId === 'halo') {
            parts.rings = [];
            for (const [rad, tube, op] of [[r * 1.5, 0.03, 1], [r * 1.78, 0.018, 0.75]]) {
                const ring = add(new THREE.Mesh(new THREE.TorusGeometry(rad, tube, 8, 72), new THREE.MeshBasicMaterial({
                    color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op
                })));
                parts.rings.push(ring);
            }
        } else if (this.auraId === 'moons') {
            parts.moons = [];
            for (let i = 0; i < 2; i++) {
                const m = add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })));
                m.add(this.glowSprite(0xffffff, 0.75, 0.9));
                const rb = new FXRibbon(14);
                this.scene.add(rb.mesh);
                this.auraRibbons.push(rb);
                parts.moons.push({ mesh: m, ribbon: rb, tilt: i ? -0.9 : 0.55, speed: i ? -2.6 : 3.3, phase: i * 2.2, rad: r * (i ? 2.25 : 1.95) });
            }
        } else if (this.auraId === 'shell') {
            const outer = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r * 1.6, 1)), new THREE.LineBasicMaterial({
                color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
            })));
            const inner = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(r * 1.3, 0)), new THREE.LineBasicMaterial({
                color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6
            })));
            // Points of light on the outer shell's corners
            const verts = new THREE.IcosahedronGeometry(r * 1.6, 1).getAttribute('position');
            const seen = new Set(), pts = [];
            for (let i = 0; i < verts.count; i++) {
                const k = `${verts.getX(i).toFixed(3)},${verts.getY(i).toFixed(3)},${verts.getZ(i).toFixed(3)}`;
                if (seen.has(k)) continue;
                seen.add(k);
                pts.push(verts.getX(i), verts.getY(i), verts.getZ(i));
            }
            const pg = new THREE.BufferGeometry();
            pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            const nodes = new THREE.Points(pg, new THREE.PointsMaterial({ map: this.glowTex, size: 0.16, color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
            outer.add(nodes);
            parts.outer = outer;
            parts.inner = inner;
            parts.nodes = nodes;
        } else if (this.auraId === 'flame') {
            parts.flames = [];
            const tex = MarbleFX.flameTexture();
            parts.core = add(this.glowSprite(0xff8a3d, r * 4.2, 0.55));
            for (let i = 0; i < 8; i++) {
                const sp = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })));
                parts.flames.push({ sp, seed: Math.random() * 6.28, k: i / 7 });
            }
        } else if (this.auraId === 'storm') {
            parts.arcs = [];
            for (let i = 0; i < 6; i++) {
                const rb = new FXRibbon(9), glow = new FXRibbon(9);
                this.scene.add(glow.mesh, rb.mesh);
                this.auraRibbons.push(rb, glow);
                parts.arcs.push({ ribbon: rb, glow, clock: Math.random() * 0.1, pts: [], on: true });
            }
            parts.core = add(this.glowSprite(0x8fd3ff, r * 4, 0.3));
        } else if (this.auraId === 'crown') {
            parts.gems = [];
            const geo = new THREE.OctahedronGeometry(0.1, 0);
            geo.scale(1, 1.7, 1);
            for (let i = 0; i < 5; i++) {
                const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.05, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.6, flatShading: true });
                const gm = add(new THREE.Mesh(geo, mat));
                gm.add(this.glowSprite(0xffffff, 0.55, 0.65));
                parts.gems.push(gm);
            }
            parts.band = add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, 0.012, 6, 64), new THREE.MeshBasicMaterial({
                color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7
            })));
            parts.band.rotation.x = Math.PI / 2;
        }
        this.auraParts = parts;
        this.recolorAura();
    }

    recolorAura() {
        const p = this.auraParts;
        if (!p) return;
        const v = this.vivid;
        const set = (mat, mul = 1) => mat && mat.color.copy(v).multiplyScalar(mul);
        if (p.rings) p.rings.forEach(m => set(m.material, 1.6));
        if (p.moons) p.moons.forEach(m => { set(m.mesh.material, 1.8); m.mesh.children[0].material.color.copy(v); });
        if (p.outer) { set(p.outer.material, 1.5); set(p.inner.material, 1.1); p.nodes.material.color.copy(v).multiplyScalar(2); }
        if (p.gems) p.gems.forEach(g => { g.material.color.copy(v).lerp(new THREE.Color(1, 1, 1), 0.5); g.material.emissive.copy(v); g.material.envMap = this.envMap; g.material.needsUpdate = true; g.children[0].material.color.copy(v); });
        if (p.band) set(p.band.material, 1.4);
    }

    // ------------------------------------------------------------------
    // Per frame
    // ------------------------------------------------------------------

    /**
     * s: { dt, pos (Vector3), normal ([x,y,z] surface normal), camPos, visible,
     *      showAura, speed, pulse, renderer }
     */
    update(s) {
        const dt = Math.max(0, Math.min(0.05, s.dt));
        this.time += dt;
        const def = MarbleFX.TRAILS[this.trailId];

        // Sample the path at 60 Hz; the newest point is always the marble itself
        if (s.visible && s.speed > 1) {
            this.sampleClock += dt;
            if (this.sampleClock >= this.sampleDt || !this.samples.length) {
                this.sampleClock = Math.min(this.sampleClock - this.sampleDt, this.sampleDt);
                const sm = this.samples.length >= def.len ? this.samples.shift() : (this.pool.pop() || { p: new THREE.Vector3(), n: new THREE.Vector3() });
                sm.p.copy(s.pos);
                sm.n.set(s.normal[0], s.normal[1], s.normal[2]);
                this.samples.push(sm);
            }
            while (this.samples.length > def.len) this.pool.push(this.samples.shift());
        } else if (this.samples.length) {
            this.pool.push(this.samples.shift());
        }
        const strength = Math.min(1, s.speed / 30) * (s.visible ? 1 : 0.6);
        if (def.mode === 'wall') this.drawWall(def, s, strength);
        else if (def.mode === 'bolt') this.drawBolts(def, s, strength, dt);
        else this.drawRibbon(this.ribbons[0], def, s, strength);
        if (def.mode !== 'bolt' && def.mode !== 'wall') this.ribbons[1].commit(0);

        // Trail particles
        if (s.visible && s.showAura !== false && s.speed > 2 && def.particles) {
            const rate = (def.particles === 'fire' ? 150 : 70) * (this.lowQuality ? 0.5 : 1);
            this.emitClock += dt * rate;
            while (this.emitClock >= 1) {
                this.emitClock -= 1;
                this.emitTrail(def.particles, s);
            }
        }

        this.updateAura(s, dt);
        this.updateShield(s, dt);
        if (s.renderer) {
            s.renderer.getDrawingBufferSize(this.tmpC);
            this.particles.mesh.material.uniforms.uScale.value = this.tmpC.y * 0.5;
        }
        this.particles.update(dt, this.time);
    }

    /** The newest-first list of points: samples plus the marble's current position */
    trailPoints(s) {
        const pts = this.samples;
        const n = pts.length;
        if (!n) return 0;
        // Reuse a scratch head sample for the marble's current position
        this.head = this.head || { p: new THREE.Vector3(), n: new THREE.Vector3() };
        this.head.p.copy(s.pos);
        this.head.n.set(s.normal[0], s.normal[1], s.normal[2]);
        this.pts = this.pts || [];
        this.pts.length = 0;
        for (const sm of pts) this.pts.push(sm);
        if (s.visible) this.pts.push(this.head);
        if (this.maxLen < Infinity) {
            // Keep only the newest maxLen metres, so the taper ends before the camera
            let d = 0, k = this.pts.length - 1;
            while (k > 0) {
                d += this.pts[k].p.distanceTo(this.pts[k - 1].p);
                if (d > this.maxLen) break;
                k--;
            }
            if (k > 0) this.pts.splice(0, k);
        }
        return this.pts.length;
    }

    drawRibbon(rb, def, s, strength) {
        const n = this.trailPoints(s);
        if (n < 2) { rb.commit(0); return; }
        const pts = this.pts;
        const cam = s.camPos;
        const c = this.col;
        for (let i = 0; i < n; i++) {
            const p = pts[i].p;
            const q = pts[Math.min(n - 1, i + 1)].p, o = pts[Math.max(0, i - 1)].p;
            const dir = this.tmpA.subVectors(q, o);
            if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
            dir.normalize();
            const side = dir.cross(this.tmpB.subVectors(cam, p).normalize()).normalize();
            const t = i / (n - 1);
            let w = def.width * t, a = t * t * strength * def.alpha;
            if (def.shape === 'comet') {
                w = def.width * Math.pow(t, 0.55);
                a = Math.pow(t, 1.4) * strength * def.alpha;
                c.copy(this.vivid).lerp(MarbleFX.WHITE, Math.max(0, (t - 0.72) / 0.28));
            } else if (def.shape === 'rainbow') {
                w = def.width * Math.min(1, t * 3.5) * (0.85 + 0.15 * Math.sin(this.time * 6 + t * 8));
                a = Math.min(1, t * 2.5) * strength * def.alpha;
                c.setHSL(((t * 1.15 - this.time * 0.55) % 1 + 1) % 1, 1, 0.55);
            } else if (def.shape === 'fire') {
                w = def.width * Math.pow(t, 0.7) * (0.8 + 0.25 * Math.sin(this.time * 31 + i * 1.7));
                a = t * strength * def.alpha;
                c.setRGB(1.2, 0.35 + 0.6 * t * t, 0.08 + 0.3 * t * t * t);
            } else {
                c.copy(def === MarbleFX.TRAILS.stardust ? this.vivid : this.trailColor);
            }
            const r = c.r * a, g = c.g * a, b = c.b * a;
            rb.set(i, p.x + side.x * w, p.y + side.y * w, p.z + side.z * w, p.x - side.x * w, p.y - side.y * w, p.z - side.z * w, r, g, b);
        }
        rb.commit(n);
    }

    /** A wall of light standing on the track along the path */
    drawWall(def, s, strength) {
        const rb = this.ribbons[0], lane = this.ribbons[1];
        const n = this.trailPoints(s);
        if (n < 2) { rb.commit(0); lane.commit(0); return; }
        const pts = this.pts;
        const c = this.vivid;
        const base = this.r * 0.92;
        for (let i = 0; i < n; i++) {
            const { p, n: nn } = pts[i];
            const t = i / (n - 1);
            const a = Math.pow(t, 0.6) * strength * def.alpha * (0.9 + 0.1 * Math.sin(this.time * 20 + i));
            const bx = p.x - nn.x * base, by = p.y - nn.y * base, bz = p.z - nn.z * base;
            const h = def.height;
            // Dim at the foot, bright along the top edge
            rb.set(i, bx, by, bz, bx + nn.x * h, by + nn.y * h, bz + nn.z * h,
                c.r * a * 0.25, c.g * a * 0.25, c.b * a * 0.25, c.r * a * 1.4, c.g * a * 1.4, c.b * a * 1.4);
            // A lit lane on the track under the wall: seen from the chase camera even when the wall is edge-on
            const q = pts[Math.min(n - 1, i + 1)].p, o = pts[Math.max(0, i - 1)].p;
            const dir = this.tmpA.subVectors(q, o);
            if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
            const side = dir.normalize().cross(nn).normalize();
            const w = 0.34, lift = 0.04;
            const lx = bx + nn.x * lift, ly = by + nn.y * lift, lz = bz + nn.z * lift;
            lane.set(i, lx + side.x * w, ly + side.y * w, lz + side.z * w, lx - side.x * w, ly - side.y * w, lz - side.z * w,
                c.r * a * 0.7, c.g * a * 0.7, c.b * a * 0.7);
        }
        rb.commit(n);
        lane.commit(n);
    }

    /** Two jagged bolts, re-drawn about 30 times a second */
    drawBolts(def, s, strength, dt) {
        const n = this.trailPoints(s);
        if (n < 2) { for (const rb of this.ribbons) rb.commit(0); return; }
        this.boltClock -= dt;
        const rejitter = this.boltClock <= 0;
        if (rejitter) this.boltClock = 1 / 30;
        this.jit = this.jit || [new Float32Array(88), new Float32Array(88)];
        const pts = this.pts;
        const cam = s.camPos;
        for (let k = 0; k < 2; k++) {
            const rb = this.ribbons[k];
            const jit = this.jit[k];
            const col = k ? MarbleFX.BOLT2 : MarbleFX.BOLT1;
            for (let i = 0; i < n; i++) {
                const t = i / (n - 1);
                if (rejitter) {
                    const amp = 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (k ? 1.3 : 1);
                    jit[i * 2] = (Math.random() * 2 - 1) * amp;
                    jit[i * 2 + 1] = (Math.random() * 2 - 1) * amp;
                }
                const p = pts[i].p, nn = pts[i].n;
                const q = pts[Math.min(n - 1, i + 1)].p, o = pts[Math.max(0, i - 1)].p;
                const dir = this.tmpA.subVectors(q, o);
                if (dir.lengthSq() < 1e-8) dir.set(0, 0, 1);
                dir.normalize();
                const side = this.tmpC.copy(dir).cross(this.tmpB.subVectors(cam, p).normalize()).normalize();
                const jx = side.x * jit[i * 2] + nn.x * jit[i * 2 + 1];
                const jy = side.y * jit[i * 2] + nn.y * jit[i * 2 + 1];
                const jz = side.z * jit[i * 2] + nn.z * jit[i * 2 + 1];
                const w = def.width * (k ? 0.7 : 1) * (0.4 + 0.6 * t);
                const a = Math.sqrt(t) * strength * def.alpha * (k ? 0.8 : 1);
                rb.set(i, p.x + jx + side.x * w, p.y + jy + side.y * w, p.z + jz + side.z * w,
                    p.x + jx - side.x * w, p.y + jy - side.y * w, p.z + jz - side.z * w, col.r * a, col.g * a, col.b * a);
            }
            rb.commit(n);
        }
    }

    emitTrail(kind, s) {
        const p = s.pos, r = this.r;
        const rnd = () => Math.random() * 2 - 1;
        if (kind === 'sparkle') {
            const white = Math.random() < 0.45;
            const c = white ? MarbleFX.WHITE : this.vivid;
            this.particles.add('sparkle', p.x + rnd() * r * 0.8, p.y + rnd() * r * 0.8, p.z + rnd() * r * 0.8,
                rnd() * 0.6, rnd() * 0.6 + 0.3, rnd() * 0.6, 0.9 + Math.random() * 0.8, 0.22 + Math.random() * 0.22, c.r * 1.8, c.g * 1.8, c.b * 1.8);
        } else if (kind === 'fire') {
            this.particles.add('fire', p.x + rnd() * r * 0.6, p.y + rnd() * r * 0.4, p.z + rnd() * r * 0.6,
                rnd() * 0.8, 1 + Math.random() * 1.5, rnd() * 0.8, 0.35 + Math.random() * 0.3, 0.42 + Math.random() * 0.3, 1, 1, 1);
        }
    }

    updateAura(s, dt) {
        const p = this.auraParts;
        const on = !!(p && p.id !== 'none' && s.visible && s.showAura !== false);
        this.aura.visible = on;
        if (this.auraRibbons) for (const rb of this.auraRibbons) rb.mesh.visible = on;
        if (!on) return;
        const t = this.time, r = this.r, pulse = s.pulse || 0;
        this.aura.position.copy(s.pos);
        const v = this.vivid;
        if (p.rings) {
            p.rings[0].rotation.set(1.1 + Math.sin(t * 0.7) * 0.25, t * 1.9, 0.3);
            p.rings[1].rotation.set(-0.7 + Math.cos(t * 0.5) * 0.3, -t * 1.3, -0.4);
            p.rings.forEach((m, i) => m.material.color.copy(v).multiplyScalar((i ? 1.1 : 1.6) + pulse * 1.8));
        }
        if (p.moons) {
            for (const m of p.moons) {
                const pos = (ang, out) => {
                    // Orbit in a tilted plane round the marble
                    const x = Math.cos(ang) * m.rad, z = Math.sin(ang) * m.rad;
                    return out.set(x, -Math.sin(m.tilt) * z, Math.cos(m.tilt) * z);
                };
                const a0 = t * m.speed + m.phase;
                pos(a0, m.mesh.position);
                const rb = m.ribbon;
                const N = 12;
                for (let i = 0; i < N; i++) {
                    const k = i / (N - 1);                       // 0 tail .. 1 head
                    const local = pos(a0 - Math.sign(m.speed) * (1 - k) * 1.1, this.tmpA);
                    const wp = this.tmpB.copy(local).add(s.pos);
                    const toCam = this.tmpC.subVectors(s.camPos, wp).normalize();
                    // Tangent of the orbit, crossed with the view, for the ribbon's width
                    this.tmpD = this.tmpD || new THREE.Vector3();
                    const tan = pos(a0 - Math.sign(m.speed) * (1 - k) * 1.1 + 0.05 * Math.sign(m.speed), this.tmpD).sub(local).normalize();
                    const side = tan.cross(toCam).normalize();
                    const w = 0.055 * k, a = k * k * 0.9;
                    rb.set(i, wp.x + side.x * w, wp.y + side.y * w, wp.z + side.z * w, wp.x - side.x * w, wp.y - side.y * w, wp.z - side.z * w, v.r * a, v.g * a, v.b * a);
                }
                rb.commit(N);
            }
        }
        if (p.outer) {
            p.outer.rotation.set(t * 0.45, t * 0.7, 0);
            p.inner.rotation.set(-t * 0.6, -t * 0.35, t * 0.2);
            const k = 1 + pulse * 0.16;
            p.outer.scale.setScalar(k);
            p.inner.scale.setScalar(1 + pulse * 0.08);
            p.outer.material.color.copy(v).multiplyScalar(1.3 + pulse * 1.6);
        }
        if (p.flames) {
            // Flames lick upward and stream back from the direction of travel
            const back = this.tmpA.set(0, 0, 0);
            const n = this.samples.length;
            if (n >= 2) back.subVectors(this.samples[Math.max(0, n - 4)].p, s.pos);
            const bl = back.length();
            if (bl > 1e-4) back.multiplyScalar(Math.min(1, bl / 1.2) / bl);
            p.flames.forEach((f, i) => {
                const fl = 0.85 + 0.3 * Math.sin(t * 17 + f.seed) * Math.sin(t * 9.3 + f.seed * 2);
                if (i === 0) {
                    // The body of the fire: its bright foot at the marble's centre, so flames hug the silhouette
                    const h = r * 3.6 * fl;
                    f.sp.scale.set(r * 3 * (0.95 + 0.1 * fl), h, 1);
                    f.sp.position.set(back.x * 0.25, h * 0.3 + r * 0.1, back.z * 0.25);
                    f.sp.material.color.setRGB(1.5, 0.48, 0.1);
                    f.sp.material.opacity = 0.85;
                    return;
                }
                // Tongues: rising off the top and streaming back
                const k = f.k;
                const sc = r * (2.1 - k * 1.2) * fl;
                const sway = Math.sin(t * 7 + f.seed) * 0.08;
                f.sp.position.set(back.x * k * 1.1 + sway, r * (0.9 + k * 1.3) + back.y * k * 0.4, back.z * k * 1.1 + Math.cos(t * 6 + f.seed) * 0.08);
                f.sp.scale.set(sc * 0.7, sc * 1.5, 1);
                f.sp.material.color.setRGB(1.35, 0.35 + 0.55 * (1 - k), 0.06 + 0.25 * (1 - k) * (1 - k));
                f.sp.material.opacity = 0.7 - k * 0.4;
            });
            p.core.material.opacity = 0.45 + 0.15 * Math.sin(t * 13) + pulse * 0.2;
            if (!this.lowQuality && Math.random() < dt * 40) {
                this.particles.add('fire', s.pos.x + (Math.random() - 0.5) * r, s.pos.y + r * 0.5, s.pos.z + (Math.random() - 0.5) * r,
                    back.x * 2, 1.5 + Math.random() * 1.5, back.z * 2, 0.4 + Math.random() * 0.25, 0.3, 1, 1, 1);
            }
        }
        if (p.arcs) {
            for (const arc of p.arcs) {
                arc.clock -= dt;
                if (arc.clock <= 0) {
                    arc.clock = 0.05 + Math.random() * 0.08;
                    arc.on = Math.random() < 0.85;
                    // A bolt between two points on the surface, bowing outward
                    const a = new THREE.Vector3().randomDirection(), b = a.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(1.5)).normalize();
                    arc.pts.length = 0;
                    for (let i = 0; i < 9; i++) {
                        const k = i / 8;
                        const d = a.clone().lerp(b, k).normalize();
                        const out = r * (1.05 + Math.sin(Math.PI * k) * (0.45 + Math.random() * 0.35));
                        d.multiplyScalar(out).add(new THREE.Vector3().randomDirection().multiplyScalar(0.05 * Math.sin(Math.PI * k)));
                        arc.pts.push(d);
                    }
                    if (arc.on && Math.random() < 0.3) {
                        const e = arc.pts[8];
                        this.particles.add('spark', s.pos.x + e.x, s.pos.y + e.y, s.pos.z + e.z, e.x * 6, e.y * 6 + 1, e.z * 6, 0.3, 0.18, 0.7, 0.9, 1.6);
                    }
                }
                const rb = arc.ribbon, gl = arc.glow;
                if (!arc.on || arc.pts.length < 9) { rb.commit(0); gl.commit(0); continue; }
                for (let i = 0; i < 9; i++) {
                    const wp = this.tmpB.copy(arc.pts[i]).add(s.pos);
                    const nx = arc.pts[Math.min(8, i + 1)], pv = arc.pts[Math.max(0, i - 1)];
                    const dir = this.tmpA.subVectors(nx, pv).normalize();
                    const side = dir.cross(this.tmpC.subVectors(s.camPos, wp).normalize()).normalize();
                    const k = 1.6 + pulse;
                    let w = 0.022;
                    rb.set(i, wp.x + side.x * w, wp.y + side.y * w, wp.z + side.z * w, wp.x - side.x * w, wp.y - side.y * w, wp.z - side.z * w,
                        MarbleFX.BOLT1.r * k, MarbleFX.BOLT1.g * k, MarbleFX.BOLT1.b * k);
                    w = 0.12;
                    gl.set(i, wp.x + side.x * w, wp.y + side.y * w, wp.z + side.z * w, wp.x - side.x * w, wp.y - side.y * w, wp.z - side.z * w,
                        0.2 * k, 0.45 * k, 1 * k);
                }
                rb.commit(9);
                gl.commit(9);
            }
            p.core.material.opacity = 0.2 + Math.random() * 0.25;
        }
        if (p.gems) {
            p.gems.forEach((g, i) => {
                const a = t * 1.3 + (i / p.gems.length) * Math.PI * 2;
                g.position.set(Math.cos(a) * r * 0.95, r * 1.65 + Math.sin(t * 3 + i * 1.3) * 0.06, Math.sin(a) * r * 0.95);
                g.rotation.set(0.2, t * 2.5 + i, 0.15);
                g.material.emissiveIntensity = 0.6 + pulse * 1.2;
            });
            p.band.position.y = r * 1.52;
            p.band.material.opacity = 0.45 + pulse * 0.4;
        }
    }

    updateShield(s, dt) {
        const m = this.shieldMesh;
        this.shieldPop = Math.max(0, this.shieldPop - dt * 2.5);
        const on = s.visible && s.showAura !== false && (this.shields > 0 || this.shieldPop > 0);
        m.visible = on;
        if (!on) return;
        m.position.copy(s.pos);
        const u = m.material.uniforms;
        u.uTime.value = this.time;
        // A popped shield swells and fades; an armed one breathes with the beat
        if (this.shieldPop > 0 && this.shields === 0) {
            m.scale.setScalar(1 + (1 - this.shieldPop) * 0.8);
            u.uAmt.value = this.shieldPop * 1.5;
        } else {
            m.scale.setScalar(1 + (s.pulse || 0) * 0.05 + this.shieldPop * 0.3);
            u.uAmt.value = 0.55 + (s.pulse || 0) * 0.25 + this.shieldPop;
        }
    }
}

MarbleFX.WHITE = { r: 1, g: 1, b: 1, isColor: true };
MarbleFX.BOLT1 = { r: 0.75, g: 0.92, b: 1.25 };
MarbleFX.BOLT2 = { r: 0.75, g: 0.45, b: 1.3 };
MarbleFX.AURA_IDS = ['none', 'halo', 'moons', 'shell', 'flame', 'storm', 'crown'];

/**
 * SkinPreview - the store's showroom: the equipped marble wearing the focused
 * skin, circling a small neon turntable, drawn with its own WebGL context on
 * a canvas that is kept and re-attached as the store redraws.
 */
class SkinPreview {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skin-preview-canvas';
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'low-power' });
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.scene = new THREE.Scene();
        // Opaque backdrop (additive effects on a see-through canvas would darken the page behind)
        const bg = document.createElement('canvas');
        bg.width = 256; bg.height = 128;
        const bgc = bg.getContext('2d');
        const bgg = bgc.createRadialGradient(128, 90, 4, 128, 80, 150);
        bgg.addColorStop(0, '#1a1a3a');
        bgg.addColorStop(1, '#07070f');
        bgc.fillStyle = bgg;
        bgc.fillRect(0, 0, 256, 128);
        this.scene.background = new THREE.CanvasTexture(bg);
        this.scene.background.colorSpace = THREE.SRGBColorSpace;
        this.camera = new THREE.PerspectiveCamera(34, 2, 0.1, 50);
        this.camera.position.set(0, 2.7, 5.7);
        this.camera.lookAt(0, 0.4, 0);
        this.scene.add(new THREE.HemisphereLight(0xbfd7ff, 0x201030, 1.2));
        const key = new THREE.DirectionalLight(0xffffff, 2);
        key.position.set(2, 4, 3);
        this.scene.add(key);
        this.r = 0.55;
        this.pathR = 1.65;

        // Turntable: a dark disc with a neon ring on the marble's path
        this.floorUniforms = { uColor: { value: new THREE.Color('#6366f1') }, uTime: { value: 0 }, uPath: { value: this.pathR } };
        const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.ShaderMaterial({
            uniforms: this.floorUniforms,
            vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
            fragmentShader: `
                uniform vec3 uColor; uniform float uTime; uniform float uPath; varying vec2 vP;
                void main(){
                    float d = length(vP);
                    float ring = exp(-pow((d - uPath) * 9.0, 2.0));
                    vec2 g = abs(fract(vP * 2.0) - 0.5);
                    float grid = smoothstep(0.47, 0.5, max(g.x, g.y)) * 0.25;
                    float fade = smoothstep(3.2, 1.2, d);
                    float sweep = 0.5 + 0.5 * sin(atan(vP.y, vP.x) * 3.0 - uTime * 2.0);
                    vec3 c = vec3(0.02, 0.025, 0.05) + uColor * (ring * (0.9 + 0.5 * sweep) + grid * 0.35);
                    gl_FragColor = vec4(c, fade * 0.95);
                }`,
            transparent: true, depthWrite: false
        }));
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        this.marble = new THREE.Mesh(new THREE.SphereGeometry(this.r, 48, 32), new THREE.MeshStandardMaterial());
        this.scene.add(this.marble);
        this.glowTex = Scene3D.makeGlowTexture();
        this.fx = new MarbleFX(this.scene, this.glowTex, this.r);
        // The marble circles far slower than it races, so the trail samples less often to show its length
        this.fx.sampleDt = 1 / 24;
        this.env = MarbleLooks.environment(this.renderer);
        this.pos = new THREE.Vector3();
        this.quat = new THREE.Quaternion();
        this.q = new THREE.Quaternion();
        this.axis = new THREE.Vector3();
        this.camPos = this.camera.position;
        this.t = 0;
        this.running = false;
        this.key = '';
    }

    show(marbleId, style, skins) {
        const key = `${marbleId}|${skins.finish}`;
        if (key !== this.key) {
            const old = this.marble.material;
            const mat = MarbleLooks.material(marbleId, style, skins.finish);
            if (!mat.envMap) mat.envMap = this.env;
            this.marble.material = mat;
            old.dispose();
            this.key = key;
        }
        if (skins.trail !== this.fx.trailId || this.fx.auraId !== skins.aura || this.styleId !== marbleId) {
            this.fx.setLook(skins.trail, skins.aura, style, this.env);
            this.fx.resetTrail();
        }
        this.styleId = marbleId;
        this.floorUniforms.uColor.value.copy(this.fx.vivid);
    }

    resize() {
        const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
        if (!w || !h) return;
        if (w !== this.w || h !== this.h) {
            this.w = w; this.h = h;
            this.renderer.setSize(w, h, false);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.last = performance.now();
        const loop = () => {
            if (!this.running) return;
            const now = performance.now();
            const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
            this.last = now;
            this.frame(dt);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
    }

    frame(dt) {
        this.resize();
        this.t += dt;
        const w = 2.1;                      // rad/s round the turntable
        const a = this.t * w;
        const R = this.pathR;
        const prev = this.pos.clone();
        // An oval with a little hop every lap, so jumps and trails show
        const hop = Math.max(0, Math.sin(a * 0.5 + Math.PI / 4)) ** 6 * 0.6;
        this.pos.set(Math.cos(a) * R, this.r + hop, Math.sin(a) * R * 0.8);
        const v = this.pos.clone().sub(prev);
        const dist = v.length();
        if (dist > 1e-5) {
            // Roll: rotate about the axis across the direction of travel
            this.axis.set(v.z, 0, -v.x).normalize();
            this.q.setFromAxisAngle(this.axis, dist / this.r);
            this.quat.premultiply(this.q);
            this.marble.quaternion.copy(this.quat);
        }
        this.marble.position.copy(this.pos);
        const pulse = Math.pow(Math.max(0, Math.cos(this.t * Math.PI * 2 * (128 / 60) / 2)), 8);
        const mat = this.marble.material;
        if (mat.userData.glow) {
            const g = mat.userData.glow;
            mat.emissiveIntensity = g.base + g.beat * pulse + g.twinkle * (0.5 + 0.5 * Math.sin(this.t * 7));
        }
        this.floorUniforms.uTime.value = this.t;
        this.fx.update({
            dt, pos: this.pos, normal: [0, 1, 0], camPos: this.camPos, visible: true, showAura: true,
            speed: 34, pulse, renderer: this.renderer
        });
        this.renderer.render(this.scene, this.camera);
    }
}

window.MarbleFX = MarbleFX;
window.SkinPreview = SkinPreview;
