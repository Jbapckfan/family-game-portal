/**
 * Scene3D - three.js rendering of the chute, marble, pickups and effects
 *
 * Neon synthwave look kept cheap for phones: emissive grid texture on the
 * pipe, unlit glowing rims and rings, additive sprites for glow, fog to hide
 * distance, no post-processing passes.
 */

/**
 * Each world is an art direction, not just a colour swap:
 *   cells   the chute's crystal lattice [cells per metre, jitter, seam width, facet tilt]
 *   brick   offset every other row (flagstones, basalt columns)
 *   seam    colour of the light veins between cells
 *   body    the celestial body ahead: 1 moon, 2 sun, 3 ringed ice planet, 4 red giant, 5 gas giant
 *   terrain the sculpted ground far below
 *   dust    what hangs in the air
 */
const WORLD_PALETTES = {
    1: {
        name: 'Meadow Valley', skyTop: '#020617', skyMid: '#06202a', skyBottom: '#0b5a4a', fog: '#06262a', accent: '#2dfc8f', accent2: '#22d3ee', pipe: '#0b2b26', sun: '#7dffb5',
        cells: [0.9, 1.0, 0.035, 0.12], brick: 0, seam: '#2dfc8f',
        body: { type: 1, size: 34, height: 26, colA: '#e8f1ff', colB: '#8da3c9' },
        terrain: { amp: 26, freq: 0.012, low: '#06281a', high: '#1c6a3c', glow: '#2dfc8f' },
        dust: { color: '#b4ff6a', size: 0.3, mode: 'firefly' }
    },
    2: {
        name: 'Desert Dunes', skyTop: '#14030f', skyMid: '#4a0d26', skyBottom: '#c2410c', fog: '#3a0c1c', accent: '#ffb02e', accent2: '#ff4f8b', pipe: '#2e120c', sun: '#ffcf5c',
        cells: [0.6, 0.45, 0.03, 0.08], brick: 1, seam: '#ffb02e',
        body: { type: 2, size: 72, height: 6, colA: '#ffe29a', colB: '#ff6a3d' },
        terrain: { amp: 22, freq: 0.009, low: '#4a2410', high: '#c9803f', glow: '#ffb02e' },
        dust: { color: '#ffd27a', size: 0.25, mode: 'sand' }
    },
    3: {
        name: 'Frozen Peaks', skyTop: '#020617', skyMid: '#0c1e4a', skyBottom: '#1f6f9e', fog: '#0c2348', accent: '#5ee7ff', accent2: '#a78bfa', pipe: '#0d2240', sun: '#c4f1ff',
        cells: [1.3, 1.0, 0.03, 0.3], brick: 0, seam: '#9fe8ff',
        body: { type: 3, size: 48, height: 30, colA: '#e4f7ff', colB: '#5f9fd6', ring: '#e8f6ff' },
        terrain: { amp: 30, freq: 0.011, ridged: true, low: '#132a55', high: '#dceeff', glow: '#5ee7ff' },
        dust: { color: '#ffffff', size: 0.28, mode: 'snow' }
    },
    4: {
        name: 'Volcanic Core', skyTop: '#0a0204', skyMid: '#3a0508', skyBottom: '#a3200a', fog: '#2a0507', accent: '#ff4d3d', accent2: '#ffa53d', pipe: '#2a0a07', sun: '#ff8a3d',
        cells: [0.8, 0.12, 0.04, 0.06], brick: 1, seam: '#ff6a2e',
        body: { type: 4, size: 96, height: 12, colA: '#ff9a4d', colB: '#ff2e1a' },
        terrain: { amp: 24, freq: 0.013, low: '#1a0608', high: '#4a1a12', glow: '#ff5a1a' },
        dust: { color: '#ffa53d', size: 0.26, mode: 'ember' }
    },
    5: {
        name: 'Cosmic Void', skyTop: '#05010f', skyMid: '#1a0638', skyBottom: '#5b1a8a', fog: '#16052e', accent: '#f472ff', accent2: '#7c8cff', pipe: '#1a0a33', sun: '#ff7ae6',
        cells: [0.45, 0.9, 0.025, 0.18], brick: 0, seam: '#c77dff',
        body: { type: 5, size: 66, height: 34, colA: '#a08cff', colB: '#ff7ae6', ring: '#d9c9ff' },
        terrain: { amp: 18, freq: 0.01, low: '#0b0416', high: '#2a1050', glow: '#f472ff' },
        dust: { color: '#ffffff', size: 0.22, mode: 'star' }
    },
    6: {
        name: 'Neon Grid', skyTop: '#01030a', skyMid: '#041a30', skyBottom: '#0a4a7a', fog: '#04142a', accent: '#28e5ff', accent2: '#ff7a1a', pipe: '#061a2c', sun: '#9ff3ff',
        cells: [0.5, 0.15, 0.03, 0.06], brick: 0, seam: '#28e5ff',
        body: { type: 6, size: 80, height: 18, colA: '#9ff3ff', colB: '#ff7a1a' },
        terrain: { amp: 6, freq: 0.01, low: '#03101e', high: '#0a2a44', glow: '#28e5ff' },
        dust: { color: '#9ff3ff', size: 0.2, mode: 'bit' }
    }
};

class Scene3D {
    static LOOP_ID = 9; // Track.FORCES.indexOf('loop')

    constructor(canvas) {
        this.canvas = canvas;
        this.quality = 'high';
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance', stencil: false });
        this.resScale = 1; // dynamic resolution multiplier (0.6..1)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 260);
        this.camera.position.set(0, 5, 10);

        this.hemi = new THREE.HemisphereLight(0xbfd7ff, 0x201030, 1.1);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
        this.sunLight.position.set(30, 80, 20);
        this.scene.add(this.hemi, this.sunLight, this.sunLight.target);

        this.glowTexture = Scene3D.makeGlowTexture();
        this.trackGroup = null;
        this.palette = WORLD_PALETTES[1];

        this.buildMarble();
        this.buildParticles();
        this.buildDust();
        this.buildOverlay();

        this.cam = {
            pos: new THREE.Vector3(),
            look: new THREE.Vector3(),
            up: new THREE.Vector3(0, 1, 0),
            trauma: 0,
            fov: 64,
            intro: null
        };
        // A cinematic shot in progress (see startCine): the camera leaves the
        // marble's shoulder for a trackside, brink or orbiting view
        this.cine = null;
        this.time = 0;
        this.tmpV = new THREE.Vector3();
        this.tmpV2 = new THREE.Vector3();
        this.tmpM = new THREE.Matrix4();
        this.tmpQ = new THREE.Quaternion();

        this.resize();
        window.addEventListener('resize', () => this.resize());
        // A lost WebGL context (memory pressure, a backgrounded tab) must not
        // leave a dead black canvas: hold the loop, then rebuild when it returns
        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            this.contextLost = true;
            if (this.onContextLost) this.onContextLost();
        });
        canvas.addEventListener('webglcontextrestored', () => {
            this.contextLost = false;
            this.disposePost && this.post && this.disposePost();
            this.post = null;
            this.resize();
            if (this.onContextRestored) this.onContextRestored();
        });
    }

    // ------------------------------------------------------------------
    // Setup
    // ------------------------------------------------------------------

    setQuality(q) {
        this.quality = q;
        if (this.marbleFX) this.marbleFX.lowQuality = q === 'low';
        this.resize();
    }

    resize() {
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        if (!w || !h) return;
        // 1.6x at most: with 4x MSAA on the scene target that is as smooth as 2x
        // with none, for a third fewer pixels through the post chain (the UI
        // stays at the screen's own resolution)
        const cap = this.quality === 'low' ? 1 : this.quality === 'medium' ? 1.4 : 1.6;
        this.renderer.setPixelRatio(Math.max(0.75, Math.min(window.devicePixelRatio || 1, cap) * this.resScale));
        this.renderer.setSize(w, h, false);
        this.setupPost();
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.width = w;
        this.height = h;
        const o = this.overlay;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        o.width = Math.round(w * dpr);
        o.height = Math.round(h * dpr);
        this.octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /**
     * Dynamic resolution: called once a second with the measured frame rate.
     * Drops render resolution in steps when frames are missed, and creeps back
     * up when there is headroom, so motion stays smooth.
     */
    adaptResolution(fps, target) {
        const before = this.resScale;
        if (fps < target * 0.9) this.resScale = Math.max(0.6, this.resScale - 0.1);
        else if (fps >= target * 0.98 && this.resScale < 1) this.resScale = Math.min(1, this.resScale + 0.05);
        if (this.resScale !== before) this.resize();
    }

    /** Compile all shaders up front so the first frames don't hitch */
    precompile() {
        try {
            this.renderer.compile(this.scene, this.camera);
        } catch (e) {
            // Older WebKit: shaders compile on first draw instead
        }
    }

    /**
     * Bloom: the scene renders into a half-float target; bright parts are
     * extracted at quarter resolution, blurred twice and added back, then the
     * result is tone mapped to the screen. High quality only; the adaptive
     * quality drop turns it off before anything else.
     */
    setupPost() {
        const want = this.quality === 'high' && this.postSupported !== false;
        if (!want) {
            if (this.post) this.disposePost();
            return;
        }
        const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
        const w = Math.max(2, Math.round(size.x)), h = Math.max(2, Math.round(size.y));
        if (this.post && this.post.w === w && this.post.h === h) return;
        if (this.post) this.disposePost();
        try {
            const type = THREE.HalfFloatType;
            const dpr = this.renderer.getPixelRatio();
            // Multisampling on the half-float scene target, except on iPhones and
            // iPads, where the multisampled resolve has misdrawn the frame
            const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const rtScene = new THREE.WebGLRenderTarget(w, h, { type, depthBuffer: true, samples: dpr <= 1.6 && !ios ? 4 : 0 });
            const bw = Math.max(2, Math.round(w / 4)), bh = Math.max(2, Math.round(h / 4));
            const opts = { type, depthBuffer: false };
            const rtBright = new THREE.WebGLRenderTarget(bw, bh, opts);
            const rtA = new THREE.WebGLRenderTarget(bw, bh, opts);
            const rtB = new THREE.WebGLRenderTarget(bw, bh, opts);
            // Anamorphic streaks and light shafts work at an eighth of the size: they are soft by nature
            const sw = Math.max(2, Math.round(w / 8)), sh = Math.max(2, Math.round(h / 8));
            const rtS = new THREE.WebGLRenderTarget(sw, sh, opts);
            const rtS2 = new THREE.WebGLRenderTarget(sw, sh, opts);
            const rtRays = new THREE.WebGLRenderTarget(sw, sh, opts);
            const quadVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
            const bright = new THREE.ShaderMaterial({
                uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.8 } },
                vertexShader: quadVS,
                fragmentShader: `uniform sampler2D tDiffuse; uniform float uThreshold; varying vec2 vUv;
                    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
                    float k = smoothstep(uThreshold, uThreshold + 0.6, l); gl_FragColor = vec4(c * k, 1.0); }`,
                depthTest: false, depthWrite: false
            });
            const blur = new THREE.ShaderMaterial({
                uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1 / bw, 0) } },
                vertexShader: quadVS,
                fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;
                    void main(){
                        vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227;
                        c += (texture2D(tDiffuse, vUv + uDir * 1.385).rgb + texture2D(tDiffuse, vUv - uDir * 1.385).rgb) * 0.316;
                        c += (texture2D(tDiffuse, vUv + uDir * 3.231).rgb + texture2D(tDiffuse, vUv - uDir * 3.231).rgb) * 0.070;
                        gl_FragColor = vec4(c, 1.0); }`,
                depthTest: false, depthWrite: false
            });
            // Anamorphic streaks: the bright pass smeared sideways, twice, and tinted
            const streak = new THREE.ShaderMaterial({
                uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1 / sw, 0) }, uTint: { value: new THREE.Color('#9fd8ff') } },
                vertexShader: quadVS,
                fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; uniform vec3 uTint; varying vec2 vUv;
                    void main(){
                        vec3 c = vec3(0.0);
                        for (int i = -8; i <= 8; i++) {
                            float t = float(i) / 8.0;
                            c += texture2D(tDiffuse, vUv + uDir * float(i) * 2.5).rgb * (1.0 - abs(t)) * (1.0 - abs(t));
                        }
                        gl_FragColor = vec4(c * uTint * 0.22, 1.0); }`,
                depthTest: false, depthWrite: false
            });
            // Light shafts: the bright pass blurred toward the sun's place on the screen
            const rays = new THREE.ShaderMaterial({
                uniforms: { tDiffuse: { value: null }, uSun: { value: new THREE.Vector2(0.5, 0.8) }, uGain: { value: 0 } },
                vertexShader: quadVS,
                fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uGain; varying vec2 vUv;
                    void main(){
                        vec2 d = (uSun - vUv) / 14.0;
                        vec3 c = vec3(0.0);
                        float wsum = 0.0;
                        vec2 p = vUv;
                        for (int i = 0; i < 14; i++) {
                            float w = 1.0 - float(i) / 14.0;
                            c += texture2D(tDiffuse, p).rgb * w;
                            wsum += w;
                            p += d;
                        }
                        gl_FragColor = vec4(c / wsum * uGain, 1.0); }`,
                depthTest: false, depthWrite: false
            });
            // Composite: bloom, streaks and shafts; chromatic aberration and radial
            // streaks that grow with speed; the world's own look (a heat shimmer, a
            // frost at the edges, scan lines); a split-tone grade in the world's
            // colours; film grain and dither; a vignette; then tone mapping
            const composite = new THREE.ShaderMaterial({
                uniforms: {
                    tScene: { value: null }, tBloom: { value: null }, tStreak: { value: null }, tRays: { value: null },
                    uStrength: { value: 1.0 }, uSpeed: { value: 0 }, uVignette: { value: 0.4 }, uTime: { value: 0 }, uWorld: { value: 1 },
                    uShadow: { value: new THREE.Color('#06202a') }, uHigh: { value: new THREE.Color('#2dfc8f') }, uGrade: { value: 0.12 }, uFlash: { value: 0 }
                },
                vertexShader: quadVS,
                fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloom; uniform sampler2D tStreak; uniform sampler2D tRays;
                    uniform float uStrength, uSpeed, uVignette, uTime, uWorld, uGrade, uFlash; uniform vec3 uShadow, uHigh; varying vec2 vUv;
                    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                    void main(){
                        vec2 uv = vUv;
                        vec2 d = uv - 0.5;
                        float r2 = dot(d, d);
                        // The volcano shimmers with heat low in the frame
                        if (uWorld > 3.5 && uWorld < 4.5) {
                            float heat = smoothstep(0.75, 0.25, uv.y) * 0.004;
                            uv += vec2(sin(uv.y * 60.0 + uTime * 5.0) * heat, cos(uv.x * 50.0 - uTime * 4.0) * heat * 0.6);
                        }
                        float ca = (0.004 + uSpeed * 0.01) * r2;
                        vec3 c;
                        c.r = texture2D(tScene, uv + d * ca).r;
                        c.g = texture2D(tScene, uv).g;
                        c.b = texture2D(tScene, uv - d * ca).b;
                        float k = uSpeed * uSpeed * 0.05;
                        if (k > 0.0005) {
                            vec3 acc = vec3(0.0);
                            for (int i = 1; i <= 5; i++) {
                                float t = float(i) / 5.0;
                                acc += texture2D(tScene, uv - d * k * t * (0.2 + r2 * 4.0)).rgb;
                            }
                            c = mix(c, acc * 0.2, smoothstep(0.02, 0.3, r2) * 0.85);
                        }
                        c += texture2D(tBloom, uv).rgb * uStrength;
                        c += texture2D(tStreak, uv).rgb * (0.8 + uFlash * 0.8);
                        c += texture2D(tRays, uv).rgb;
                        // Split tone: the shadows lean toward the sky, the highlights toward the neon
                        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
                        float lt = l / (1.0 + l);
                        c = mix(c, c + uShadow * 0.5, uGrade * (1.0 - lt) * (1.0 - lt));
                        c = mix(c, c * (1.0 + uHigh * 0.35), uGrade * lt * lt);
                        // A touch of vibrance
                        float sat = max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
                        c = mix(vec3(l), c, 1.0 + 0.18 * (1.0 - min(1.0, sat)));
                        // The ice world frosts at the edges; the Grid shows faint scan lines
                        if (uWorld > 2.5 && uWorld < 3.5) c += vec3(0.5, 0.8, 1.0) * smoothstep(0.18, 0.5, r2) * (0.06 + 0.04 * hash(floor(uv * 90.0)));
                        if (uWorld > 5.5) c *= 1.0 - 0.07 * smoothstep(0.3, 0.7, fract(uv.y * 160.0 + uTime * 0.5));
                        c *= 1.0 - uVignette * smoothstep(0.12, 0.75, r2);
                        // Grain and dither: no banding in the dark skies
                        float g = hash(uv * 1000.0 + fract(uTime) * 7.0) - 0.5;
                        c += g * (0.018 + 0.03 * (1.0 - lt));
                        gl_FragColor = vec4(c, 1.0);
                        #include <tonemapping_fragment>
                        #include <colorspace_fragment>
                    }`,
                depthTest: false, depthWrite: false, toneMapped: true
            });
            const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bright);
            quad.frustumCulled = false;
            const quadScene = new THREE.Scene();
            quadScene.add(quad);
            const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            this.post = { w, h, bw, bh, sw, sh, rtScene, rtBright, rtA, rtB, rtS, rtS2, rtRays, bright, blur, streak, rays, composite, quad, quadScene, quadCam };
            this.applyGrade();
        } catch (e) {
            console.warn('Bloom unavailable, rendering directly', e);
            this.postSupported = false;
            this.post = null;
        }
    }

    disposePost() {
        const p = this.post;
        if (!p) return;
        for (const k of ['rtScene', 'rtBright', 'rtA', 'rtB', 'rtS', 'rtS2', 'rtRays']) p[k].dispose();
        for (const k of ['bright', 'blur', 'streak', 'rays', 'composite']) p[k].dispose();
        p.quad.geometry.dispose();
        this.post = null;
    }

    renderFrame() {
        const p = this.post;
        const r = this.renderer;
        if (!p) {
            r.render(this.scene, this.camera);
            return;
        }
        r.setRenderTarget(p.rtScene);
        r.render(this.scene, this.camera);
        const pass = (mat, input, target, dir) => {
            p.quad.material = mat;
            if (mat.uniforms.tDiffuse) mat.uniforms.tDiffuse.value = input.texture;
            if (dir) mat.uniforms.uDir.value.set(dir[0], dir[1]);
            r.setRenderTarget(target);
            r.render(p.quadScene, p.quadCam);
        };
        pass(p.bright, p.rtScene, p.rtBright);
        // Streaks and shafts from the bright pass, before it is blurred into bloom
        pass(p.streak, p.rtBright, p.rtS, [1 / p.sw, 0]);
        pass(p.streak, p.rtS, p.rtS2, [1 / p.sw, 0]);
        pass(p.rays, p.rtBright, p.rtRays);
        pass(p.blur, p.rtBright, p.rtA, [1 / p.bw, 0]);
        pass(p.blur, p.rtA, p.rtB, [0, 1 / p.bh]);
        pass(p.blur, p.rtB, p.rtA, [1.5 / p.bw, 0]);
        pass(p.blur, p.rtA, p.rtB, [0, 1.5 / p.bh]);
        p.composite.uniforms.tScene.value = p.rtScene.texture;
        p.composite.uniforms.tBloom.value = p.rtB.texture;
        p.composite.uniforms.tStreak.value = p.rtS2.texture;
        p.composite.uniforms.tRays.value = p.rtRays.texture;
        p.quad.material = p.composite;
        r.setRenderTarget(null);
        r.render(p.quadScene, p.quadCam);
    }

    /**
     * Sky events: meteors cross the night skies (meadow, ice, space, the Grid)
     * every few seconds, and lightning breaks over the volcano, a double flash
     * with the bolt standing for a few frames. The drop makes both more
     * frequent, so the light show spills into the sky.
     */
    updateSkyEvents(dt, su) {
        const w = this.track ? this.track.worldId : 1;
        const ev = this.skyEvents || (this.skyEvents = { meteorIn: 4, meteorT: 1, boltIn: 5, boltT: 1 });
        const hurry = 1 + (this.dropLevel || 0) * 1.5;
        if (w === 1 || w === 3 || w === 5 || w === 6) {
            ev.meteorIn -= dt * hurry;
            if (ev.meteorIn <= 0 && ev.meteorT >= 1) {
                ev.meteorT = 0;
                ev.meteorIn = 5 + Math.random() * 9;
                su.uMeteor.value.set(Math.random() * Math.PI * 2, 0.45 + Math.random() * 0.35, 0, 0.7 + Math.random() * 0.5);
            }
            if (ev.meteorT < 1) {
                ev.meteorT = Math.min(1, ev.meteorT + dt / 0.8);
                su.uMeteor.value.z = ev.meteorT;
                su.uMeteor.value.w *= 1 - Math.max(0, ev.meteorT - 0.7) * 0.08;
                if (ev.meteorT >= 1) su.uMeteor.value.w = 0;
            }
        } else if (su.uMeteor.value.w) su.uMeteor.value.w = 0;
        if (w === 4) {
            ev.boltIn -= dt * hurry;
            if (ev.boltIn <= 0 && ev.boltT >= 1) {
                ev.boltT = 0;
                ev.boltIn = 6 + Math.random() * 10;
                su.uBolt.value.set(Math.random() * Math.PI * 2, 0, Math.random() * 100, 0);
            }
            if (ev.boltT < 1) {
                ev.boltT = Math.min(1, ev.boltT + dt / 0.6);
                // Two strikes: the second a little weaker, then the glow dies away
                const t = ev.boltT * 0.6;
                const k = Math.exp(-t * 14) + (t > 0.13 ? 0.7 * Math.exp(-(t - 0.13) * 14) : 0);
                su.uBolt.value.y = ev.boltT >= 1 ? 0 : Math.min(1, k);
            }
        } else if (su.uBolt.value.y) su.uBolt.value.y = 0;
    }

    /** Place the flare ghosts along the line from the sun through the screen centre, and fade them with the sun's place in the frame */
    updateFlare() {
        if (!this.flare || !this.sun) return;
        this._sunNdc = this._sunNdc || new THREE.Vector3();
        const v = this._sunNdc.copy(this.sun.position).project(this.camera);
        const behind = v.z > 1 || this.quality === 'low';
        const edge = behind ? 0 : Math.max(0, 1 - Math.max(Math.abs(v.x), Math.abs(v.y)) / 1.1);
        const k = Math.min(1, edge * 1.6) * (this.palette.flare === undefined ? 0.7 : this.palette.flare);
        this.flareK = (this.flareK || 0) + (k - (this.flareK || 0)) * 0.12;
        if (this.flareK < 0.01) { this.flare.visible = false; return; }
        this.flare.visible = true;
        const cam = this.camera;
        const fv = this._fv || (this._fv = { f: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3() });
        fv.f.set(0, 0, -1).applyQuaternion(cam.quaternion);
        fv.r.set(1, 0, 0).applyQuaternion(cam.quaternion);
        fv.u.set(0, 1, 0).applyQuaternion(cam.quaternion);
        const D = 12;
        const halfH = Math.tan(cam.fov * Math.PI / 360) * D, halfW = halfH * cam.aspect;
        const pal = this.palette;
        for (const sp of this.flareSprites) {
            const { t, size, op, which } = sp.userData;
            const nx = v.x * (1 - t), ny = v.y * (1 - t);
            sp.position.copy(cam.position).addScaledVector(fv.f, D).addScaledVector(fv.r, nx * halfW).addScaledVector(fv.u, ny * halfH);
            sp.scale.setScalar(size * (which === 'sun' ? 1 + (this.dropLevel || 0) * 0.4 : 1));
            sp.material.opacity = op * this.flareK;
            sp.material.color.set(which === 'sun' ? pal.sun : which === 'a' ? pal.accent : pal.accent2);
        }
    }

    /** The world's colours into the grade: shadows toward the sky, highlights toward the neon, streaks in the accent */
    applyGrade() {
        if (!this.post) return;
        const pal = this.palette;
        const u = this.post.composite.uniforms;
        u.uShadow.value.set(pal.skyMid);
        u.uHigh.value.set(pal.accent);
        u.uWorld.value = this.track ? this.track.worldId : 1;
        this.post.streak.uniforms.uTint.value.set(pal.accent2).lerp(new THREE.Color('#ffffff'), 0.45);
    }

    /** Where the sun is on the screen (for the light shafts), and how much of it shows */
    updateRays() {
        if (!this.post || !this.sun) return;
        const r = this.post.rays.uniforms;
        this._sunNdc = this._sunNdc || new THREE.Vector3();
        const v = this._sunNdc.copy(this.sun.position).project(this.camera);
        const behind = v.z > 1;
        const onScreen = !behind && Math.abs(v.x) < 1.4 && Math.abs(v.y) < 1.4;
        const edge = onScreen ? Math.max(0, 1 - Math.max(Math.abs(v.x), Math.abs(v.y)) / 1.4) : 0;
        r.uSun.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
        const want = onScreen ? 0.55 * Math.min(1, edge * 2) : 0;
        r.uGain.value += (want - r.uGain.value) * 0.1;
    }

    static makeGlowTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
        grad.addColorStop(0.6, 'rgba(255,255,255,0.12)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }

    static makeGridTexture(accent, accent2) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const g = c.getContext('2d');
        g.fillStyle = '#000000';
        g.fillRect(0, 0, 256, 256);
        // Lanes along the chute
        g.strokeStyle = accent2;
        g.globalAlpha = 0.55;
        g.lineWidth = 3;
        for (let k = 0; k <= 8; k++) {
            const x = (k / 8) * 256;
            g.beginPath();
            g.moveTo(x, 0);
            g.lineTo(x, 256);
            g.stroke();
        }
        // Cross rings
        g.strokeStyle = accent;
        g.globalAlpha = 0.85;
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(0, 2);
        g.lineTo(256, 2);
        g.stroke();
        g.globalAlpha = 0.25;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, 128);
        g.lineTo(256, 128);
        g.stroke();
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    }

    static makeChevronTexture(color) {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 128;
        const g = c.getContext('2d');
        g.clearRect(0, 0, 64, 128);
        g.strokeStyle = color;
        g.lineWidth = 9;
        g.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
            const y = 26 + k * 64;
            g.beginPath();
            g.moveTo(10, y + 24);
            g.lineTo(32, y);
            g.lineTo(54, y + 24);
            g.stroke();
        }
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }

    static makeMarbleTexture(style) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 128;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, style.highlightColor || '#c7d2fe');
        grad.addColorStop(0.5, style.baseColor || '#6366f1');
        grad.addColorStop(1, style.shadowColor || '#4338ca');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 128);
        // Swirl bands make rolling visible
        g.globalAlpha = 0.55;
        g.strokeStyle = style.midColor || '#ffffff';
        g.lineWidth = 10;
        for (let k = 0; k < 4; k++) {
            g.beginPath();
            for (let x = 0; x <= 256; x += 8) {
                const y = 20 + k * 30 + Math.sin((x / 256) * Math.PI * 4 + k) * 10;
                if (x === 0) g.moveTo(x, y);
                else g.lineTo(x, y);
            }
            g.stroke();
        }
        g.globalAlpha = 0.9;
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(64, 40, 10, 0, Math.PI * 2);
        g.fill();
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }

    buildMarble() {
        const r = 0.55;
        this.marbleRadius = r;
        this.marbleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, roughness: 0.18, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08,
            emissive: new THREE.Color('#3b3bff'), emissiveIntensity: 0.25
        });
        this.marble = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 24), this.marbleMaterial);
        this.marbleGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.glowTexture, color: 0x8080ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.28
        }));
        this.marbleGlow.scale.setScalar(2.6);
        this.marbleLight = new THREE.PointLight(0x8080ff, 6, 10, 1.6);
        this.scene.add(this.marble, this.marbleGlow, this.marbleLight);

        // Contact shadow and underglow projected onto the pipe surface
        const sc = document.createElement('canvas');
        sc.width = sc.height = 64;
        const sg = sc.getContext('2d');
        const sgr = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
        sgr.addColorStop(0, 'rgba(0,0,0,0.75)');
        sgr.addColorStop(0.5, 'rgba(0,0,0,0.35)');
        sgr.addColorStop(1, 'rgba(0,0,0,0)');
        sg.fillStyle = sgr;
        sg.fillRect(0, 0, 64, 64);
        const decal = new THREE.PlaneGeometry(1, 1);
        this.shadowTexture = new THREE.CanvasTexture(sc);
        this.shadow = new THREE.Mesh(decal, new THREE.MeshBasicMaterial({
            map: this.shadowTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
        }));
        this.underglow = new THREE.Mesh(decal, new THREE.MeshBasicMaterial({
            map: this.glowTexture, color: 0x8080ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
        }));
        this.shadow.renderOrder = 2;
        this.underglow.renderOrder = 3;
        this.scene.add(this.shadow, this.underglow);

        // Lens flare: a glare on the sun and a row of ghosts strung toward the
        // far side of the screen, drawn over everything and faded as the sun
        // leaves the frame (see updateFlare)
        this.flare = new THREE.Group();
        this.flare.renderOrder = 60;
        const ghosts = [
            [0, 3.2, 0.16, 'sun'], [0.28, 0.5, 0.12, 'a'], [0.5, 0.9, 0.07, 'b'], [0.72, 0.35, 0.14, 'a'],
            [1.0, 1.6, 0.05, 'b'], [1.3, 0.7, 0.1, 'a'], [1.65, 1.1, 0.06, 'b'], [-0.3, 0.6, 0.08, 'b']
        ];
        this.flareSprites = ghosts.map(([t, size, op, which]) => {
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.glowTexture, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, opacity: 0
            }));
            sp.userData = { t, size, op, which };
            sp.renderOrder = 60;
            this.flare.add(sp);
            return sp;
        });
        this.scene.add(this.flare);

        // Mirror image of the marble on the glossy pipe surface
        this.mirror = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }));
        this.mirror.renderOrder = 4;
        this.mirror.visible = false;
        this.scene.add(this.mirror);

        // Sparks orbiting the marble at high combo
        this.orbiters = [];
        for (let i = 0; i < 4; i++) {
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
            sp.scale.setScalar(0.4);
            sp.visible = false;
            this.scene.add(sp);
            this.orbiters.push(sp);
        }

        // Shockwave rings for landings, jumps and boosts
        this.rings = [];
        const ringGeo = new THREE.RingGeometry(0.7, 1, 32);
        for (let i = 0; i < 6; i++) {
            const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
            ring.visible = false;
            this.scene.add(ring);
            this.rings.push(ring);
        }
        this.boostT = 0;

        // Ghost of the best run
        this.ghost = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshBasicMaterial({
            color: 0xbff4ff, transparent: true, opacity: 0.28, depthWrite: false
        }));
        this.ghost.visible = false;
        this.scene.add(this.ghost);

        // A friend's run from a challenge link: a warm translucent marble with a halo
        this.rivalMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({
            color: 0xffb347, transparent: true, opacity: 0.55, depthWrite: false
        }));
        const rivalGlow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.glowTexture, color: 0xff8a3d, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6
        }));
        rivalGlow.scale.setScalar(2.4);
        this.rivalMesh.add(rivalGlow);
        this.rivalMesh.visible = false;
        this.scene.add(this.rivalMesh);

        // Trail, aura and shield bubble (store skins; see MarbleFX.js)
        this.marbleFX = new MarbleFX(this.scene, this.glowTexture, r);
        this.marbleFX.maxLen = 7;   // the chase camera rides about 8 m back: trails taper out in front of it
    }

    /**
     * The world as an environment map: its sky, sun and stars and a ground in
     * the terrain's colour, so the marble (and the metal of the ribs, pylons
     * and props) reflect the world they are in instead of a studio
     */
    buildEnvironment(pal) {
        if (this.worldEnv) { this.worldEnv.dispose(); this.worldEnv = null; }
        try {
            const envScene = new THREE.Scene();
            envScene.add(this.sky.clone(), this.stars.clone());
            const sun = this.sun.clone();
            sun.position.set(60, 40 + (pal.body ? pal.body.height : 0), -200);
            sun.scale.set(pal.body ? pal.body.size * 2.2 : 80, pal.body ? pal.body.size * 2.2 : 80, 1);
            sun.lookAt(0, 0, 0);
            envScene.add(sun);
            const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.terrain.low).lerp(new THREE.Color(pal.terrain.glow), 0.15) }));
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -40;
            envScene.add(ground);
            const pmrem = new THREE.PMREMGenerator(this.renderer);
            this.worldEnv = pmrem.fromScene(envScene, 0.04, 1, 600).texture;
            pmrem.dispose();
            this.scene.environment = this.worldEnv;
            this.scene.environmentIntensity = 0.7;
            if (this.marbleMaterial && !this.marbleMaterial.userData.ownEnv) { this.marbleMaterial.envMap = this.worldEnv; this.marbleMaterial.needsUpdate = true; }
            if (this.mirror && this.mirror.material && !this.mirror.material.userData.ownEnv) { this.mirror.material.envMap = this.worldEnv; this.mirror.material.needsUpdate = true; }
        } catch (e) {
            console.warn('World environment unavailable', e);
            this.worldEnv = null;
        }
    }

    /** The marble's look: its stone (or a store finish), its trail and aura */
    setMarbleStyle(style, id = 'default', skins = Shop.DEFAULTS) {
        const old = this.marble.material;
        const mat = MarbleLooks.material(id, style, skins.finish);
        // The marble reflects the world it is in (chrome and gold bring their own environment)
        mat.userData.ownEnv = !!mat.envMap;
        if (!mat.envMap) mat.envMap = this.worldEnv || MarbleLooks.environment(this.renderer);
        this.marble.material = mat;
        this.marbleMaterial = mat;
        if (old) old.dispose();
        const glow = new THREE.Color(style.glowColor || '#6366f1');
        this.glowColor = glow;
        this.marbleGlow.material.color = glow;
        this.marbleLight.color = glow;
        this.underglow.material.color = glow;
        if (this.pipeUniforms) this.pipeUniforms.uGlow.value = glow;
        // The mirror image uses the same surface, faded, drawn over the pipe
        const mm = mat.clone();
        mm.transparent = true;
        mm.opacity = 0.32;
        mm.depthTest = false;
        mm.depthWrite = false;
        mm.envMap = mat.envMap;
        mm.userData.ownEnv = mat.userData.ownEnv;
        if (this.mirror.material) this.mirror.material.dispose();
        this.mirror.material = mm;
        for (const o of this.orbiters) o.material.color = glow;
        this.marbleFX.setLook(skins.trail, skins.aura, style, mat.envMap);
        this.marbleFX.lowQuality = this.quality === 'low';
    }

    spawnRing(pos, normal, color, size, life) {
        const ring = this.rings.find(r => !r.visible) || this.rings[0];
        ring.visible = true;
        ring.position.set(pos.x + normal[0] * 0.05, pos.y + normal[1] * 0.05, pos.z + normal[2] * 0.05);
        this._rt = this._rt || new THREE.Vector3();
        ring.lookAt(this._rt.set(pos.x + normal[0], pos.y + normal[1], pos.z + normal[2]));
        ring.material.color.set(color);
        ring.userData = { t: 0, life, size };
        ring.scale.setScalar(0.2);
        ring.material.opacity = 0.9;
    }

    landingFx(pos, normal, k) {
        this.spawnRing(pos, normal, this.palette.accent, 2.5 + k * 2.5, 0.35);
        this.emit(pos, Math.round(6 + k * 10), this.palette.accent2, 3 + k * 4, 0.45, 1.4);
    }

    jumpFx(pos, normal) {
        this.spawnRing(pos, normal, '#ffffff', 2, 0.25);
    }

    /**
     * A layer of cloud or mist far below the chute, drifting: fog banks in
     * the meadow, blown dust in the desert, low cloud over the peaks, ember
     * haze over the lava, nebula haze in space, a glowing data mist on the
     * Grid. One big plane with a noise shader
     */
    buildClouds(track, group, pal) {
        if (this.quality === 'low') return;
        const look = {
            1: { color: '#9fd9c2', alpha: 0.55, speed: 0.6, scale: 0.012, lift: 24 },
            2: { color: '#ffc27a', alpha: 0.4, speed: 1.6, scale: 0.016, lift: 18 },
            3: { color: '#dff3ff', alpha: 0.75, speed: 0.5, scale: 0.01, lift: 26 },
            4: { color: '#ff7a3d', alpha: 0.5, speed: 0.9, scale: 0.014, lift: 22 },
            5: { color: '#b48cff', alpha: 0.45, speed: 0.3, scale: 0.008, lift: 30 },
            6: { color: '#28e5ff', alpha: 0.35, speed: 0.8, scale: 0.02, lift: 20 }
        }[track.worldId] || { color: pal.fog, alpha: 0.5, speed: 0.6, scale: 0.012, lift: 24 };
        const size = 2400;
        const geo = new THREE.PlaneGeometry(size, size, 1, 1);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, fog: false,
            uniforms: { uColor: { value: new THREE.Color(look.color) }, uFog: { value: new THREE.Color(pal.fog) }, uAlpha: { value: look.alpha }, uTime: { value: 0 }, uSpeed: { value: look.speed }, uScale: { value: look.scale }, uCam: { value: new THREE.Vector3() } },
            vertexShader: 'varying vec3 vP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
            fragmentShader: `uniform vec3 uColor, uFog, uCam; uniform float uAlpha, uTime, uSpeed, uScale; varying vec3 vP;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
                float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.07 + 13.0; a *= 0.5; } return v; }
                void main(){
                    vec2 p = vP.xz * uScale + vec2(uTime * uSpeed * 0.02, uTime * uSpeed * 0.008);
                    float n = fbm(p) * 0.65 + fbm(p * 2.3 - uTime * uSpeed * 0.01) * 0.35;
                    float cloud = smoothstep(0.42, 0.72, n);
                    float dist = length(vP.xz - uCam.xz);
                    float fade = 1.0 - smoothstep(120.0, 420.0, dist);
                    vec3 col = mix(uFog, uColor, cloud * 0.9 + 0.1) * (0.6 + 0.4 * n);
                    gl_FragColor = vec4(col, uAlpha * cloud * fade);
                }`
        });
        const cloud = new THREE.Mesh(geo, mat);
        cloud.position.set(this.terrainCenter ? this.terrainCenter[0] : 0, this.groundY + look.lift, this.terrainCenter ? this.terrainCenter[1] : 0);
        cloud.renderOrder = -5;
        cloud.frustumCulled = false;
        group.add(cloud);
        this.clouds = cloud;
    }

    /**
     * Light gates: thin glowing arches over the chute every 24 m, lit in the
     * world's colours. Each one wakes as the marble comes up to it and flares
     * as it passes through, and they all pulse with the kick. One instanced
     * draw with the gate's place along the chute in an attribute
     */
    buildGates(track, group, pal) {
        if (this.quality === 'low') { this.gates = null; return; }
        const R = track.radius;
        const spots = [];
        for (let s = 30; s < track.length - 40; s += 24) {
            const i = Math.floor(s);
            if (track.gap[i] || track.isTube(i) || track.loopW[i] > 0) continue;
            spots.push(s);
        }
        const geo = new THREE.TorusGeometry(R + 0.7, 0.09, 5, 30, Math.PI * 1.3);
        geo.rotateZ(-Math.PI / 2 - Math.PI * 1.3 / 2 + Math.PI);
        const mat = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
            uniforms: { uA: { value: new THREE.Color(pal.accent) }, uB: { value: new THREE.Color(pal.accent2) }, uMarbleS: { value: 0 }, uPulse: { value: 0 }, uDrop: { value: 0 } },
            vertexShader: `attribute float aS; uniform float uMarbleS; varying float vI; varying float vK;
                void main(){
                    float d = aS - uMarbleS;
                    // Ahead: faint, waking from 90 m out; flaring within 6 m; dark once passed
                    float wake = smoothstep(90.0, 10.0, d) * step(-8.0, d);
                    float flare = (1.0 - smoothstep(0.0, 6.0, abs(d))) * 1.6;
                    vI = 0.12 + wake * 0.45 + flare;
                    vK = fract(aS / 48.0);
                    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `uniform vec3 uA, uB; uniform float uPulse, uDrop; varying float vI; varying float vK;
                void main(){ vec3 c = mix(uA, uB, step(0.5, vK)); float i = vI * (1.0 + uPulse * (0.4 + uDrop * 0.6)); gl_FragColor = vec4(c * i * 1.4, min(1.0, i * 0.9)); }`
        });
        const q = new THREE.Quaternion(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
        const meshes = this.instancedChunks(group, geo, mat, spots.map(s => ({ s })), ({ s }, m4) => {
            const f = track.frame(s);
            this.surfaceQuaternion(track, s, 0, q);
            p.set(f.C[0] + f.U[0] * R, f.C[1] + f.U[1] * R, f.C[2] + f.U[2] * R);
            m4.compose(p, q, one);
        }, { attr: { name: 'aS', get: (item) => item.s }, renderOrder: 4, chunkLen: 240 });
        // The chunks share the material, so the first stands for all when the uniforms are set
        this.gates = meshes[0] || null;
    }

    /**
     * Grandstands beside every set piece: three tiers of seating on each side
     * of the chute with a crowd of coloured dots and camera flashes popping
     * through it, and a finish gantry: a checkered banner over the line and
     * a wall of flashes beyond it. Cheap: boxes, two point clouds and a plane.
     */
    buildStands(track, group, pal) {
        if (this.quality === 'low') return;
        const q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), m = new THREE.Matrix4();
        const tierGeo = new THREE.BoxGeometry(1, 1, 1);
        const tierMat = new THREE.MeshStandardMaterial({ color: '#141a2e', metalness: 0.6, roughness: 0.5, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.08 });
        const tiers = [];
        const crowd = [], crowdCol = [];
        const flashSpots = [];
        const upW = new THREE.Vector3(0, 1, 0), look = new THREE.Vector3();
        const anchors = [];
        for (const sec of track.sections) {
            if (sec.type === 'cliff') anchors.push(sec.crest);
            else if (sec.type === 'loop' || sec.type === 'plunge' || sec.type === 'helix') anchors.push(sec.s0 - 8);
            else if (sec.type === 'kicker') anchors.push(sec.tip - 6);
        }
        const c = new THREE.Color();
        for (const sA of anchors) {
            const f = track.frame(Math.max(2, Math.min(track.length - 2, sA)));
            const C = [...f.C], T = [...f.T], R = [...f.R];
            for (const side of [-1, 1]) {
                for (let tier = 0; tier < 3; tier++) {
                    const off = 11 + tier * 1.7, up = 1.2 + tier * 1.4;
                    const x = C[0] + R[0] * side * off, y = C[1] + up, z = C[2] + R[2] * side * off;
                    look.set(x - R[0] * side, y, z - R[2] * side);
                    m.lookAt(p.set(x, y, z), look, upW);
                    q.setFromRotationMatrix(m);
                    tiers.push({ s: sA, x, y, z, q: q.clone() });
                    // The crowd: a row of dots along the tier
                    for (let k = 0; k < 14; k++) {
                        const t = (k / 13 - 0.5) * 13;
                        crowd.push(x + T[0] * t, y + 0.9, z + T[2] * t);
                        c.setHSL(Math.random(), 0.7, 0.6);
                        crowdCol.push(c.r, c.g, c.b);
                        flashSpots.push([x + T[0] * t, y + 1.1, z + T[2] * t]);
                    }
                }
                if (this.propSpots) this.propSpots.push({ x: C[0] + R[0] * side * 13, z: C[2] + R[2] * side * 13, y: C[1] });
            }
        }
        // The finish: an arch, a checkered banner over the line, flashes beyond it
        const fin = track.frame(track.finishS);
        const fC = [...fin.C], fT = [...fin.T], fR = [...fin.R];
        if (!this.checkerTex) {
            const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32;
            const g2 = cv.getContext('2d');
            for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g2.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g2.fillRect(i * 16, j * 16, 16, 16); }
            this.checkerTex = new THREE.CanvasTexture(cv);
        }
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshBasicMaterial({ map: this.checkerTex, side: THREE.DoubleSide }));
        banner.position.set(fC[0], fC[1] + 11, fC[2]);
        look.set(fC[0] + fT[0], fC[1] + 11, fC[2] + fT[2]);
        banner.lookAt(look);
        group.add(banner);
        const arch = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.28, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: pal.accent2 }));
        arch.position.set(fC[0], fC[1] + 1.5, fC[2]);
        this.surfaceQuaternion(track, track.finishS, 0, arch.quaternion);
        group.add(arch);
        for (let k = 0; k < 40; k++) {
            const t = (Math.random() - 0.5) * 16, d = 12 + Math.random() * 10;
            flashSpots.push([fC[0] + fT[0] * d + fR[0] * t, fC[1] + 2 + Math.random() * 6, fC[2] + fT[2] * d + fR[2] * t]);
        }
        if (tiers.length) {
            this.instancedChunks(group, tierGeo, tierMat, tiers, (t, m4) => { m4.compose(p.set(t.x, t.y, t.z), t.q, sc.set(14, 1.1, 2.2)); }, { chunkLen: 250 });
            const cg = new THREE.BufferGeometry();
            cg.setAttribute('position', new THREE.Float32BufferAttribute(crowd, 3));
            cg.setAttribute('color', new THREE.Float32BufferAttribute(crowdCol, 3));
            const crowdPts = new THREE.Points(cg, new THREE.PointsMaterial({ size: 0.55, vertexColors: true, map: this.glowTexture, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true }));
            group.add(crowdPts);
        }
        if (flashSpots.length) {
            // Camera flashes: a handful of white points that jump to new spots several times a second
            const n = 6;
            const fg = new THREE.BufferGeometry();
            const arr = new Float32Array(n * 3);
            fg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
            const flashes = new THREE.Points(fg, new THREE.PointsMaterial({ size: 1.6, color: '#ffffff', map: this.glowTexture, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
            flashes.frustumCulled = false;
            group.add(flashes);
            let nextAt = 0;
            this.forceAnims.push((dt) => {
                nextAt -= dt;
                if (nextAt > 0) return;
                nextAt = 0.06 + Math.random() * 0.1;
                for (let k = 0; k < n; k++) {
                    const sp = flashSpots[Math.floor(Math.random() * flashSpots.length)];
                    arr[k * 3] = sp[0]; arr[k * 3 + 1] = sp[1]; arr[k * 3 + 2] = sp[2];
                }
                fg.attributes.position.needsUpdate = true;
                flashes.material.opacity = 0.5 + Math.random() * 0.5;
            });
        }
    }

    /**
     * Holographic billboards on masts beside the chute every hundred metres or
     * so: panels of scrolling data bars and flickering glyph blocks in the
     * world's colours, brighter through the drops. One instanced draw per
     * stretch, the panel drawn by its shader.
     */
    buildBillboards(track, group, pal) {
        if (this.quality === 'low') return;
        const items = [];
        const rnd = Track.seededRandom('holo' + track.level.id);
        let side = 1;
        for (let s = 70; s < track.length - 80; s += 95 + rnd() * 40) {
            const i = Math.floor(s);
            if (track.isTube(i) || track.loopW[i] > 0 || track.kind[i] === 'plunge') continue;
            side = -side;
            items.push({ s, side, off: 11 + rnd() * 6, up: 7 + rnd() * 5, phase: rnd() * 10, w: 6 + rnd() * 3 });
        }
        if (!items.length) return;
        const panelGeo = new THREE.PlaneGeometry(1, 1);
        const mat = new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
            uniforms: {
                uA: { value: new THREE.Color(pal.accent) }, uB: { value: new THREE.Color(pal.accent2) }, uTime: { value: 0 }, uDrop: { value: 0 }, uPulse: { value: 0 },
                fogColor: { value: new THREE.Color() }, fogNear: { value: this.scene.fog.near }, fogFar: { value: this.scene.fog.far }
            },
            vertexShader: `attribute float aPhase; varying vec2 vUv; varying float vPh;
                #include <fog_pars_vertex>
                void main(){ vUv = uv; vPh = aPhase; vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
                    #include <fog_vertex>
                }`,
            fragmentShader: `uniform vec3 uA, uB; uniform float uTime, uDrop, uPulse; varying vec2 vUv; varying float vPh;
                #include <fog_pars_fragment>
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                void main(){
                    vec2 uv = vUv;
                    float t = uTime + vPh;
                    // Frame
                    float fr = step(uv.x, 0.03) + step(0.97, uv.x) + step(uv.y, 0.02) + step(0.98, uv.y);
                    // Data bars: rows of blocks that change every so often and scroll up
                    vec2 g = vec2(floor(uv.x * 9.0), floor((uv.y + t * 0.12) * 16.0));
                    float on = step(0.55, hash(g + floor(t * 1.5) * 0.37));
                    float bar = on * (0.35 + 0.65 * hash(g * 1.7));
                    // A big glyph block in the middle that flickers
                    vec2 q = (uv - vec2(0.5, 0.58)) * vec2(3.2, 2.4);
                    float glyph = step(abs(q.x), 1.0) * step(abs(q.y), 1.0) * step(0.5, hash(floor(q * 4.0) + floor(t * 2.0)));
                    float flick = 0.85 + 0.15 * sin(t * 37.0) * sin(t * 11.0);
                    float scan = 0.8 + 0.2 * sin(uv.y * 160.0 - t * 6.0);
                    vec3 col = mix(uA, uB, uv.y) * (bar * 0.55 + glyph * 0.9 + fr * 1.2) * flick * scan;
                    col += uA * 0.06;
                    col *= 1.0 + uDrop * (0.5 + 0.5 * uPulse);
                    float alpha = clamp(0.25 + bar * 0.35 + glyph * 0.6 + fr, 0.0, 0.95);
                    gl_FragColor = vec4(col * 1.3, alpha);
                    #include <fog_fragment>
                }`
        });
        const q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), m = new THREE.Matrix4();
        const look = new THREE.Vector3(), upW = new THREE.Vector3(0, 1, 0);
        const mastMat = new THREE.MeshStandardMaterial({ color: '#10121f', metalness: 0.7, roughness: 0.5 });
        const place = (item) => {
            const f = track.frame(item.s);
            const x = f.C[0] + f.R[0] * item.off * item.side, z = f.C[2] + f.R[2] * item.off * item.side;
            const y = f.C[1] + item.up;
            return [x, y, z, f];
        };
        this.instancedChunks(group, panelGeo, mat, items, (item, m4) => {
            const [x, y, z, f] = place(item);
            // Face the chute
            look.set(x - f.R[0] * item.side, y, z - f.R[2] * item.side);
            m.lookAt(p.set(x, y, z), look, upW);
            q.setFromRotationMatrix(m);
            m4.compose(p, q, sc.set(item.w, item.w * 1.4, 1));
        }, { attr: { name: 'aPhase', get: (item) => item.phase }, renderOrder: 3, chunkLen: 300 });
        const ident = new THREE.Quaternion();
        this.instancedChunks(group, new THREE.BoxGeometry(0.35, 1, 0.35), mastMat, items, (item, m4) => {
            const [x, y, z] = place(item);
            const base = this.groundY + Scene3D.terrainHeight(x, z, pal.terrain);
            const h = Math.max(1, y - item.w * 0.7 - base);
            m4.compose(p.set(x, base + h / 2, z), ident, sc.set(1, h, 1));
        }, { chunkLen: 300 });
        this.billboards = mat;
        this.forceAnims.push(() => { mat.uniforms.uTime.value = this.time; mat.uniforms.uDrop.value = this.dropLevel || 0; mat.uniforms.uPulse.value = this.lastPulse || 0; });
    }

    /**
     * Sky traffic: a handful of craft crossing above and beside the run in
     * lanes that follow it, each with a blinking light; in the Grid they
     * trail a light ribbon like a cycle on the game grid. Three instanced
     * draws, moved by hand each frame.
     */
    buildTraffic(track, group, pal) {
        if (this.quality === 'low') return;
        const n = 6;
        const w = track.worldId;
        const hull = new THREE.OctahedronGeometry(1, 0);
        hull.scale(4.2, 0.8, 1.7);
        // Lit craft, not dark shapes: they read as lights crossing the sky
        const hullMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.accent).multiplyScalar(0.5), metalness: 0.3, roughness: 0.4, emissive: new THREE.Color(pal.accent), emissiveIntensity: 1.1 });
        const ships = new THREE.InstancedMesh(hull, hullMat, n);
        const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: pal.accent2 }), n);
        const ribbons = w === 6 ? new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.08), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), n) : null;
        ships.frustumCulled = lights.frustumCulled = false;
        if (ribbons) ribbons.frustumCulled = false;
        group.add(ships, lights);
        if (ribbons) group.add(ribbons);
        const rnd = Track.seededRandom('traffic' + track.level.id);
        // The craft keep to a window around the marble (behind it a little,
        // well ahead of it), each moving at its own speed relative to the run,
        // so there is always traffic in view and none of it is lost in the fog
        const craft = [];
        const WIN0 = -40, WIN1 = 280;
        for (let k = 0; k < n; k++) {
            craft.push({
                rel: WIN0 + rnd() * (WIN1 - WIN0), v: (6 + rnd() * 14) * (rnd() < 0.35 ? -1 : 1),
                side: (rnd() < 0.5 ? -1 : 1) * (40 + rnd() * 34), up: 26 + rnd() * 28, blink: 3 + rnd() * 4, ph: rnd() * 6.28
            });
        }
        const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), m = new THREE.Matrix4(), m4 = new THREE.Matrix4();
        const fwd = new THREE.Vector3(), upW = new THREE.Vector3(0, 1, 0), tgt = new THREE.Vector3();
        this.forceAnims.push((dt) => {
            const ms = this.marbleS || 0;
            craft.forEach((cf, k) => {
                cf.rel += cf.v * dt;
                if (cf.rel < WIN0) cf.rel += WIN1 - WIN0; else if (cf.rel >= WIN1) cf.rel -= WIN1 - WIN0;
                cf.s = Math.max(0, Math.min(track.length - 1, ms + cf.rel));
                const f = track.frame(cf.s);
                p.set(f.C[0] + f.R[0] * cf.side, f.C[1] + cf.up + Math.sin(this.time * 0.7 + cf.ph) * 1.5, f.C[2] + f.R[2] * cf.side);
                fwd.set(f.T[0], 0, f.T[2]).normalize().multiplyScalar(Math.sign(cf.v));
                tgt.copy(p).add(fwd);
                m.lookAt(tgt, p, upW);
                q.setFromRotationMatrix(m);
                ships.setMatrixAt(k, m4.compose(p, q, sc.set(1, 1, 1)));
                const bl = 0.5 + 0.5 * Math.sin(this.time * cf.blink + cf.ph) > 0.7 ? 1.4 : 0.5;
                lights.setMatrixAt(k, m4.compose(tgt.copy(p).addScaledVector(fwd, 4.8), q, sc.set(bl, bl, bl)));
                if (ribbons) {
                    // The ribbon hangs behind the craft and under it, 40 m long
                    tgt.copy(p).addScaledVector(fwd, -21);
                    tgt.y -= 1.2;
                    ribbons.setMatrixAt(k, m4.compose(tgt, q, sc.set(0.12, 2.4, 40)));
                }
            });
            ships.instanceMatrix.needsUpdate = true;
            lights.instanceMatrix.needsUpdate = true;
            if (ribbons) ribbons.instanceMatrix.needsUpdate = true;
        });
    }

    /**
     * Searchlights for the drops: eight tall beams of light standing either side
     * of the chute ahead of the marble, sweeping the sky in the world's two
     * colours. They wake with each drop and pulse with the kick.
     */
    buildBeams(group, pal) {
        this.beams = [];
        if (this.quality === 'low') return;
        const geo = new THREE.CylinderGeometry(5, 0.35, 170, 14, 1, true);
        geo.translate(0, 85, 0);
        for (let i = 0; i < 8; i++) {
            const mat = new THREE.ShaderMaterial({
                uniforms: { uColor: { value: new THREE.Color(i % 4 < 2 ? pal.accent : pal.accent2) }, uI: { value: 0 } },
                vertexShader: 'varying float vY; varying float vEdge; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal); vEdge = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }',
                fragmentShader: 'uniform vec3 uColor; uniform float uI; varying float vY; varying float vEdge; void main(){ float a = pow(vEdge, 1.6) * pow(1.0 - vY, 1.4) * uI; gl_FragColor = vec4(uColor * a * 1.6, a); }',
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
            });
            const beam = new THREE.Mesh(geo, mat);
            beam.visible = false;
            beam.frustumCulled = false;
            beam.renderOrder = 5;
            group.add(beam);
            this.beams.push(beam);
        }
        this._beamUp = new THREE.Vector3(0, 1, 0);
        this._beamDir = new THREE.Vector3();
    }

    updateBeams(state) {
        if (!this.beams || !this.beams.length || !this.track) return;
        const level = this.dropLevel || 0;
        const flash = state.dropFlash || 0;
        const tr = this.track;
        const ms = state.trackS || 0;
        const SP = 36;
        const first = Math.floor(ms / SP) + 1;
        for (let i = 0; i < this.beams.length; i++) {
            const beam = this.beams[i];
            const k = first + (i >> 1);
            const side = i % 2 ? 1 : -1;
            const s = k * SP;
            const ahead = s - ms;
            const fade = Math.max(0, Math.min(1, (165 - ahead) / 40)) * Math.max(0, Math.min(1, ahead / 12));
            const I = (level * (0.28 + 0.5 * (state.pulse || 0)) + flash * 0.9) * fade;
            beam.visible = I > 0.01 && s < tr.length - 20;
            if (!beam.visible) continue;
            const f = tr.frame(s);
            beam.position.set(f.C[0] + f.R[0] * side * 26, f.C[1] - 22, f.C[2] + f.R[2] * side * 26);
            const t = this.time, ph = k * 1.9 + side;
            // Sweep: outward and back, forward and back, opening straight up on the drop's hit
            const out = side * (0.35 + 0.35 * Math.sin(t * 0.9 + ph)) * (1 - flash * 0.6);
            const fwd = 0.45 * Math.sin(t * 0.63 + ph * 1.3) * (1 - flash * 0.6);
            const d = this._beamDir.set(f.R[0] * out + f.T[0] * fwd, 1, f.R[2] * out + f.T[2] * fwd).normalize();
            beam.quaternion.setFromUnitVectors(this._beamUp, d);
            beam.material.uniforms.uI.value = Math.min(1.2, I);
        }
    }

    /** Over a cliff edge: a white flash, the view opening wide, a ring and a burst in the world's colours */
    cliffFx(pos, normal) {
        this.flash = Math.max(this.flash, 0.55);
        this.boostT = Math.max(this.boostT, 0.7);
        this.spawnRing(pos, normal, '#ffffff', 6, 0.5);
        this.emit(pos, 30, this.palette.accent, 10, 0.7);
        if (this.pipeUniforms) this.pipeUniforms.uFlash.value = 1;
    }

    boostFx() {
        this.boostT = 0.9;
        if (this.pipeUniforms) this.pipeUniforms.uFlash.value = 1;
    }

    /** The finish: fireworks in the world's colours burst over the marble for a few seconds */
    celebrate(pos) {
        this.fireworks = { t: 0, next: 0.05, pos: pos.clone(), n: 0 };
    }

    updateFx(dt) {
        if (this.fireworks) {
            const fw = this.fireworks;
            fw.t += dt;
            if (fw.t >= fw.next && fw.n < 10) {
                fw.n++;
                fw.next = fw.t + 0.2 + Math.random() * 0.22;
                const p = this.tmpV.copy(fw.pos);
                p.x += (Math.random() - 0.5) * 14; p.y += 3 + Math.random() * 8; p.z += (Math.random() - 0.5) * 14;
                const cols = [this.palette.accent, this.palette.accent2, '#ffd166', '#ffffff'];
                this.emit(p, 48, cols[fw.n % 4], 14, 1.4, 1);
                this.spawnRing(p, [0, 1, 0], cols[(fw.n + 1) % 4], 6, 0.55);
                this.flash = Math.max(this.flash, 0.22);
            }
            if (fw.t > 3.2) this.fireworks = null;
        }
        for (const ring of this.rings) {
            if (!ring.visible) continue;
            const u = ring.userData;
            u.t += dt;
            const p = u.t / u.life;
            if (p >= 1) {
                ring.visible = false;
                continue;
            }
            ring.scale.setScalar(0.2 + u.size * Math.sqrt(p));
            ring.material.opacity = 0.9 * (1 - p);
        }
        this.boostT = Math.max(0, this.boostT - dt);
    }

    buildParticles() {
        const n = 500;
        this.pMax = n;
        this.pData = [];
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        geo.setDrawRange(0, 0);
        this.points = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.55, map: this.glowTexture, vertexColors: true, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        }));
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }

    /**
     * Motes drifting in the air around the course. They live in world space
     * and are recycled ahead of the camera, so the air itself streams past
     * and gives the speed a scale.
     */
    /**
     * Motes in the air around the course, recycled ahead of the camera so the
     * air itself streams past. Each world has its own: fireflies that wander,
     * blown sand, falling snow, rising embers, still stardust.
     */
    buildDust() {
        // Snow, embers, sand and the rest: denser on high quality (the points
        // are moved by hand each frame, so this stays a small cost)
        const n = this.quality === 'high' ? 520 : 320;
        this.dustN = n;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        this.dust = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.34, map: this.glowTexture, color: 0x88aaff, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        }));
        this.dust.frustumCulled = false;
        this.dustSeed = new Float32Array(n);
        for (let i = 0; i < n; i++) this.dustSeed[i] = Math.random() * 6.28;
        this.dustInit = false;
        this.dustMode = 'firefly';
        this.scene.add(this.dust);
    }

    setDustColor(pal) {
        if (!this.dust) return;
        const d = pal.dust || { color: pal.accent2, size: 0.34, mode: 'firefly' };
        this.dust.material.color.set(d.color);
        this.dust.material.size = d.size;
        this.dust.material.opacity = d.mode === 'star' ? 0.8 : 0.55;
        this.dustMode = d.mode;
        this.dustInit = false;
    }

    updateDust(dt) {
        const arr = this.dust.geometry.attributes.position.array;
        const cam = this.camera;
        const fwd = this.tmpV.set(0, 0, -1).applyQuaternion(cam.quaternion);
        const right = this.tmpV2.set(1, 0, 0).applyQuaternion(cam.quaternion);
        const cp = cam.position;
        const n = this.dustN;
        const mode = this.dustMode;
        const t = this.time;
        for (let i = 0; i < n; i++) {
            const o = i * 3;
            const dx = arr[o] - cp.x, dy = arr[o + 1] - cp.y, dz = arr[o + 2] - cp.z;
            const along = dx * fwd.x + dy * fwd.y + dz * fwd.z;
            const side = dx * right.x + dy * right.y + dz * right.z;
            if (!this.dustInit || along < -6 || along > 70 || Math.abs(side) > 26 || Math.abs(dy) > 30) {
                const a = this.dustInit ? 30 + Math.random() * 40 : Math.random() * 70;
                const s = (Math.random() * 2 - 1) * 24;
                const u = (Math.random() * 2 - 1) * 12 + 2;
                arr[o] = cp.x + fwd.x * a + right.x * s;
                arr[o + 1] = cp.y + fwd.y * a + right.y * s + u;
                arr[o + 2] = cp.z + fwd.z * a + right.z * s;
            } else {
                const sd = this.dustSeed[i];
                if (mode === 'snow') {
                    arr[o + 1] -= dt * 2.8;
                    arr[o] += Math.sin(t * 0.9 + sd) * dt * 0.8;
                } else if (mode === 'ember') {
                    arr[o + 1] += dt * (2.2 + Math.sin(t * 2.0 + sd));
                    arr[o] += Math.cos(t * 1.3 + sd) * dt * 0.9;
                    arr[o + 2] += Math.sin(t * 1.1 + sd) * dt * 0.9;
                } else if (mode === 'sand') {
                    arr[o] += right.x * dt * 10;
                    arr[o + 2] += right.z * dt * 10;
                    arr[o + 1] += Math.sin(t * 3.0 + sd) * dt * 0.6;
                } else if (mode === 'firefly') {
                    arr[o] += Math.cos(t * 0.8 + sd) * dt * 0.9;
                    arr[o + 1] += Math.sin(t * 1.1 + sd * 1.7) * dt * 0.7;
                    arr[o + 2] += Math.sin(t * 0.7 + sd) * dt * 0.9;
                } else if (mode === 'bit') {
                    arr[o + 1] += dt * (1.4 + Math.sin(sd) * 0.6);
                }
                // stardust stays put
            }
        }
        this.dustInit = true;
        this.dust.geometry.attributes.position.needsUpdate = true;
    }
    emit(pos, count, color, speed = 8, life = 0.7, spread = 1) {
        if (this.quality === 'low') count = Math.ceil(count / 2);
        const c = new THREE.Color(color);
        for (let i = 0; i < count; i++) {
            if (this.pData.length >= this.pMax) this.pData.shift();
            const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
            const sq = Math.sqrt(1 - u * u);
            const v = speed * (0.3 + Math.random() * 0.7);
            this.pData.push({
                x: pos.x, y: pos.y, z: pos.z,
                vx: sq * Math.cos(th) * v * spread, vy: u * v, vz: sq * Math.sin(th) * v * spread,
                life, max: life, r: c.r, g: c.g, b: c.b
            });
        }
    }

    updateParticles(dt) {
        const pos = this.points.geometry.attributes.position.array;
        const col = this.points.geometry.attributes.color.array;
        let n = 0;
        for (let i = this.pData.length - 1; i >= 0; i--) {
            const p = this.pData[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.pData.splice(i, 1);
                continue;
            }
            p.vy -= 12 * dt;
            p.vx *= 0.97; p.vy *= 0.97; p.vz *= 0.97;
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            const a = p.life / p.max;
            pos[n * 3] = p.x; pos[n * 3 + 1] = p.y; pos[n * 3 + 2] = p.z;
            col[n * 3] = p.r * a; col[n * 3 + 1] = p.g * a; col[n * 3 + 2] = p.b * a;
            n++;
        }
        this.points.geometry.setDrawRange(0, n);
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
    }

    buildOverlay() {
        const o = document.createElement('canvas');
        o.id = 'fx-overlay';
        Object.assign(o.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 });
        this.canvas.insertAdjacentElement('afterend', o);
        this.overlay = o;
        this.octx = o.getContext('2d');
        this.banner = null;
        this.popups = [];
        this.flash = 0;
    }

    showBanner(text, color = '#ffffff') {
        this.banner = { text, color, life: 1.4 };
    }

    addPopup(worldPos, text, color = '#ffffff') {
        this.popups.push({ p: worldPos.clone(), text, color, life: 1 });
        if (this.popups.length > 10) this.popups.shift();
    }

    // ------------------------------------------------------------------
    // Track building
    // ------------------------------------------------------------------

    clearTrack() {
        if (!this.trackGroup) return;
        this.scene.remove(this.trackGroup);
        this.trackGroup.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                for (const m of mats) {
                    if (m.map && m.map !== this.glowTexture) m.map.dispose();
                    if (m.emissiveMap) m.emissiveMap.dispose();
                    m.dispose();
                }
            }
        });
        this.trackGroup = null;
    }

    build(track, worldId) {
        // Per-frame animations the builders register (force pieces, billboards, traffic)
        this.forceAnims = [];
        this.runDir = null;
        this.clearTrack();
        const pal = this.palette = WORLD_PALETTES[worldId] || WORLD_PALETTES[1];
        this.track = track;
        const group = this.trackGroup = new THREE.Group();
        this.scene.add(group);

        this.scene.fog = new THREE.Fog(pal.fog, 40, this.quality === 'low' ? 160 : 230);
        this.renderer.setClearColor(pal.fog);
        this.hemi.color = new THREE.Color('#ffffff');
        this.hemi.groundColor = new THREE.Color(pal.skyMid);

        this.buildPipe(track, group, pal);
        this.buildStructure(track, group, pal);
        this.buildForces(track, group, pal);
        this.buildObstacles(track, group, pal);
        this.buildObstacleShadows(track, group);
        this.buildCoins(track, group);
        this.buildBoosts(track, group, pal);
        this.buildFinish(track, group, pal);
        this.buildBackdrop(track, group, pal);
        this.buildBeams(group, pal);
        this.buildClouds(track, group, pal);
        this.buildGates(track, group, pal);
        this.buildStands(track, group, pal);
        this.buildBillboards(track, group, pal);
        this.buildTraffic(track, group, pal);
        this.buildEnvironment(pal);
        this.dropLevel = 0;
        this.setDustColor(pal);
        this.applyGrade();
        this.marbleFX.resetTrail();
        this.pData = [];
    }

    /**
     * Instances strung along the run, split into chunks of a couple of hundred
     * metres so the renderer culls the far ones (one instanced mesh is culled
     * as a whole, so without this every rib and ring on a 3 km run drew every
     * frame). items: [{ s, ... }] in any order; fill(item, matrix) writes the
     * instance matrix; attr (optional) { name, get } adds a per-instance float.
     */
    instancedChunks(group, geo, mat, items, fill, opt = {}) {
        const chunkLen = opt.chunkLen || 180;
        const sorted = items.slice().sort((a, b) => a.s - b.s);
        const meshes = [];
        const m4 = new THREE.Matrix4();
        for (let i = 0; i < sorted.length;) {
            const s0 = sorted[i].s;
            let j = i;
            while (j < sorted.length && sorted[j].s < s0 + chunkLen) j++;
            const part = sorted.slice(i, j);
            const g = opt.attr ? geo.clone() : geo;
            const at = opt.attr ? new Float32Array(part.length) : null;
            if (at) g.setAttribute(opt.attr.name, new THREE.InstancedBufferAttribute(at, 1));
            const mesh = new THREE.InstancedMesh(g, mat, part.length);
            part.forEach((item, k) => {
                fill(item, m4);
                mesh.setMatrixAt(k, m4);
                if (at) at[k] = opt.attr.get(item);
            });
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
            if (opt.renderOrder !== undefined) mesh.renderOrder = opt.renderOrder;
            group.add(mesh);
            meshes.push(mesh);
            i = j;
        }
        return meshes;
    }

    /**
     * The chute is built: metal ribs hug the outside of the pipe every few
     * metres, pylons drop from them to the ground, and a light sits where each
     * pylon meets the rib. Three instanced draws per stretch of the run.
     */
    buildStructure(track, group, pal) {
        let minY = Infinity;
        for (let i = 0; i < track.count; i++) minY = Math.min(minY, track.C[i * 3 + 1]);
        const groundY = minY - 45;
        const ribMat = new THREE.MeshStandardMaterial({ color: '#171a2e', metalness: 0.85, roughness: 0.32, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.12 });
        const arc = Math.PI * 1.12; // ends just under the rims, so ribs show only from outside
        const ribGeo = new THREE.TorusGeometry(track.radius + 0.24, 0.14, 4, 14, arc);
        ribGeo.rotateZ(-Math.PI / 2 - arc / 2); // arc centred under the pipe, open at the top
        const ribs = [], pylons = [];
        for (let i = 6; i < track.count - 2; i += 8) {
            if (track.gap[i]) continue;
            ribs.push({ s: i * track.ds, i });
            // Pylons only where the floor still faces up: inside a corkscrew a vertical post would spear the tube
            if (i % 16 === 6 && track.U[i * 3 + 1] > 0.6 && track.force[i] !== 7) pylons.push({ s: i * track.ds, i });
        }
        const q = new THREE.Quaternion();
        const p = new THREE.Vector3();
        const one = new THREE.Vector3(1, 1, 1);
        const ex = new THREE.Vector3(), ey = new THREE.Vector3();
        this.instancedChunks(group, ribGeo, ribMat, ribs, ({ i }, m4) => {
            ey.set(track.U[i * 3], track.U[i * 3 + 1], track.U[i * 3 + 2]);
            this.surfaceQuaternion(track, i * track.ds, 0, q);
            p.set(track.C[i * 3] + ey.x * track.radius, track.C[i * 3 + 1] + ey.y * track.radius, track.C[i * 3 + 2] + ey.z * track.radius);
            m4.compose(p, q, one);
        });

        const pylonMat = new THREE.MeshStandardMaterial({ color: '#10121f', metalness: 0.7, roughness: 0.5 });
        const ident = new THREE.Quaternion();
        const foot = (i) => {
            // Foot of the rib: below the pipe along its own down vector
            const x = track.C[i * 3] - track.U[i * 3] * 0.35;
            const y = track.C[i * 3 + 1] - track.U[i * 3 + 1] * 0.35;
            const z = track.C[i * 3 + 2] - track.U[i * 3 + 2] * 0.35;
            return [x, y, z, Math.max(1, y - groundY)];
        };
        this.instancedChunks(group, new THREE.BoxGeometry(0.5, 1, 0.5), pylonMat, pylons, ({ i }, m4) => {
            const [x, y, z, h] = foot(i);
            m4.compose(p.set(x, groundY + h / 2, z), ident, ex.set(1, h, 1));
        });
        this.instancedChunks(group, new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: pal.accent }), pylons, ({ i }, m4) => {
            const [x, y, z] = foot(i);
            m4.compose(p.set(x, y - 0.1, z), ident, one);
        });
    }

    /** Chunk ranges along the track so off-screen parts are frustum-culled */
    chunks(track, size = 40) {
        const out = [];
        for (let a = 0; a < track.count - 1; a += size) out.push([a, Math.min(track.count - 1, a + size)]);
        return out;
    }

    /**
     * The chute is one custom shader: lit surface, anti-aliased neon lanes and
     * rings, pulses of light running down the pipe on the beat, a glow around
     * the marble and bright rims (red where the wall is low). Everything that
     * used to be extra meshes (rims, rings, glow strips) is drawn in this one
     * pass, which is both prettier and cheaper than the old textured material.
     */
    static pipeShader() {
        return {
            vertex: `
                attribute float aLow;
                attribute float aKind;
                varying vec2 vUv;
                varying vec3 vN;
                varying vec3 vP;
                varying float vLow;
                varying float vKind;
                #include <fog_pars_vertex>
                void main() {
                    vUv = uv;
                    vLow = aLow;
                    vKind = aKind;
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vP = wp.xyz;
                    vN = normalize(mat3(modelMatrix) * normal);
                    vec4 mvPosition = viewMatrix * wp;
                    gl_Position = projectionMatrix * mvPosition;
                    #include <fog_vertex>
                }`,
            fragment: `
                uniform vec3 uFloor, uWall, uAccent, uAccent2, uGlow, uDanger, uSunDir, uMarblePos;
                uniform vec3 uSkyTop, uSkyMid, uSkyBottom, uSunCol, uSeam;
                uniform float uTime, uPulse, uMarbleS, uFlash, uBrick, uWorld, uDrop, uBeatAge, uBeatLen;
                uniform vec4 uCells;
                varying vec2 vUv;
                varying vec3 vN;
                varying vec3 vP;
                varying float vLow;
                varying float vKind;
                #include <fog_pars_fragment>
                float line(float x, float w) {
                    float d = 0.5 - abs(fract(x) - 0.5);
                    float aa = fwidth(x);
                    return 1.0 - smoothstep(w, w + aa, d);
                }
                vec2 hash2(vec2 p) {
                    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
                    return fract(sin(p) * 43758.5453);
                }
                // Cell lattice: x = distance to the nearest seam, y = distance to the
                // cell centre, zw = the cell's id. jitter 0 gives regular tiles, 1 an
                // organic Voronoi; brick offsets every other row.
                vec4 cells(vec2 x, float jitter, float brick) {
                    x.x += brick * 0.5 * floor(x.y);
                    vec2 n = floor(x), f = fract(x);
                    float f1 = 8.0, f2 = 8.0;
                    vec2 id = n;
                    for (int j = -1; j <= 1; j++) {
                        for (int i = -1; i <= 1; i++) {
                            vec2 g = vec2(float(i), float(j));
                            vec2 o = mix(vec2(0.5), hash2(n + g), jitter);
                            vec2 r = g + o - f;
                            float d = dot(r, r);
                            if (d < f1) { f2 = f1; f1 = d; id = n + g; }
                            else if (d < f2) { f2 = d; }
                        }
                    }
                    return vec4(sqrt(f2) - sqrt(f1), sqrt(f1), id);
                }
                void main() {
                    float across = clamp(vUv.x, 0.0, 1.0);
                    float lip = step(0.5, abs(vUv.x - 0.5)); // 1 on the rolled edge outside the pipe
                    float edge = min(across, 1.0 - across);
                    vec3 n = normalize(vN);
                    vec3 v = normalize(cameraPosition - vP);

                    // The signature surface: a lattice of crystal cells. Each cell is its
                    // own facet with its own tilt and tone, and the seams between them are
                    // light veins that carry pulses down the chute. The world sets the
                    // cell shape: moss cells, flagstones, ice shards, basalt columns,
                    // nebula glass.
                    vec2 cuv = vec2(across * 11.0, vUv.y) * uCells.x;
                    vec4 cl = cells(cuv, uCells.y, uBrick);
                    vec2 cid = hash2(cl.zw);
                    // Far away the cells are smaller than a pixel: ease the per-cell
                    // facets and tones out so the distance reads as a smooth surface
                    float far = smoothstep(30.0, 120.0, length(cameraPosition - vP));
                    float saa = fwidth(cl.x) * 1.5;
                    float seam = (1.0 - smoothstep(uCells.z, uCells.z + saa, cl.x)) * (1.0 - far * 0.5);
                    float seamSoft = 1.0 - smoothstep(0.0, uCells.z * 5.0, cl.x);
                    vec3 tilt = vec3(cid.x - 0.5, cid.y - 0.5, cid.x * cid.y - 0.25);
                    tilt -= n * dot(tilt, n);
                    n = normalize(n + tilt * uCells.w * (1.0 - far));
                    vec3 rdir = reflect(-v, n);
                    float fres = pow(1.0 - abs(dot(n, v)), 4.0);

                    // Base: darker floor, lighter walls, the trough shaded like a real bowl
                    vec3 base = mix(uFloor, uWall, smoothstep(0.0, 0.5, abs(across - 0.5) * 2.0));
                    base *= 1.0 + (0.4 * cid.x - 0.2) * (1.0 - far);
                    // Surface materials (ice, rubber, wood, metal, sand) and force tunnels
                    // recolour and texture the chute so they read at a glance
                    vec3 tint = vec3(1.0); float matMix = 0.0; float gloss = 1.0; float pattern = 0.0;
                    if (vKind > 0.5 && vKind < 1.5) {
                        tint = vec3(0.62, 0.9, 1.0); matMix = 0.85; gloss = 1.5;
                        float spk = sin(vUv.y * 41.0) * sin(across * 57.0 + vUv.y * 3.0);
                        pattern = smoothstep(0.92, 1.0, spk) * 0.9;
                    } else if (vKind >= 1.5 && vKind < 2.5) {
                        tint = vec3(0.16, 0.16, 0.2); matMix = 0.9; gloss = 0.35;
                        vec2 g = fract(vec2(across * 40.0, vUv.y * 2.5)) - 0.5;
                        pattern = (1.0 - smoothstep(0.16, 0.24, length(g))) * 0.1;
                    } else if (vKind >= 2.5 && vKind < 3.5) {
                        tint = vec3(0.63, 0.38, 0.17); matMix = 0.9; gloss = 0.55;
                        pattern = (0.5 + 0.5 * sin(across * 140.0 + sin(vUv.y * 0.7) * 6.0)) * 0.05 - line(vUv.y / 1.5, 0.02) * 0.2;
                    } else if (vKind >= 3.5 && vKind < 4.5) {
                        tint = vec3(0.78, 0.8, 0.86); matMix = 0.9; gloss = 1.7;
                        pattern = (0.5 + 0.5 * sin(across * 420.0)) * 0.07;
                    } else if (vKind >= 4.5 && vKind < 5.5) {
                        tint = vec3(0.85, 0.7, 0.42); matMix = 0.9; gloss = 0.25;
                        pattern = fract(sin(dot(floor(vec2(across * 300.0, vUv.y * 60.0)), vec2(12.9898, 78.233))) * 43758.5453) * 0.1;
                    } else if (vKind >= 5.5 && vKind < 6.5) {
                        tint = vec3(0.55, 0.75, 1.0); matMix = 0.5; gloss = 1.2;
                    } else if (vKind >= 6.5 && vKind < 7.5) {
                        tint = vec3(0.6, 0.3, 0.95); matMix = 0.55; gloss = 1.1;
                    } else if (vKind >= 7.5) {
                        // Loops: bright track, rungs across the floor like a coaster's ties
                        tint = vec3(0.45, 0.85, 1.0); matMix = 0.5; gloss = 1.4;
                        pattern = line(vUv.y / 2.0, 0.05) * 0.35;
                    }
                    base = mix(base, tint * 0.7, matMix);
                    float diff = 0.3 + 0.7 * max(0.0, dot(n, uSunDir) * 0.5 + 0.5);
                    float ao = 0.68 + 0.32 * smoothstep(0.0, 0.7, abs(across - 0.5) * 2.0);
                    // Cells sit a little proud of their seams
                    float bevel = 0.78 + 0.22 * smoothstep(0.0, 0.1, cl.x);
                    vec3 col = base * diff * ao * bevel + uAccent2 * fres * 0.1;

                    // Glossy surface: reflect the sky, the horizon glow and the sun
                    float rh = rdir.y;
                    vec3 skyR = rh > 0.0 ? mix(uSkyMid, uSkyTop, smoothstep(0.0, 0.6, rh)) : mix(uSkyMid, uSkyBottom, smoothstep(0.0, -0.35, rh));
                    skyR += uSunCol * exp(-abs(rh) * 9.0) * 0.45;
                    float sunSpec = pow(max(dot(rdir, uSunDir), 0.0), 70.0);
                    col += (skyR * (0.1 + fres * 0.5) + uSunCol * sunSpec * 0.9) * gloss + tint * pattern;

                    // The marble is a light: diffuse spill and a sharp highlight on the gloss
                    vec3 lm = uMarblePos - vP;
                    float dl = max(0.5, length(lm));
                    lm /= dl;
                    float att = 1.0 / (1.0 + dl * dl * 0.18);
                    col += uGlow * (max(dot(n, lm), 0.0) * 0.5 + pow(max(dot(rdir, lm), 0.0), 48.0) * 1.6) * att;

                    // Veins: the seams glow in the world's colour, brighter on the beat and
                    // where a pulse passes; cells light up in waves rolling down the chute
                    float p = fract((vUv.y - uTime * 26.0) / 48.0);
                    float band = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.14, p));
                    float wave = fract((vUv.y - uTime * 14.0) / 36.0 + cid.x * 0.35);
                    float flow = smoothstep(0.0, 0.06, wave) * (1.0 - smoothstep(0.06, 0.22, wave));
                    col += uSeam * (seam * (0.55 + 0.45 * uPulse + band * 2.0) + seamSoft * 0.18) * (1.0 - matMix * 0.6);
                    col += uSeam * flow * 0.28 * (1.0 - seam) * (1.0 - matMix);
                    // Faint lanes keep the steering reference; rings every four metres give speed
                    float lanes = line(across * 8.0, 0.012) * (0.2 + 0.2 * uPulse);
                    float rings = line(vUv.y / 4.0, 0.008) * (0.3 + 0.3 * uPulse);
                    col += uAccent2 * lanes * 0.35 + uAccent * rings * 0.5;
                    col += uAccent * band * (0.2 + 0.3 * uPulse);
                    // Glow spilling from the marble along the chute
                    float dm = vUv.y - uMarbleS;
                    col += uGlow * exp(-dm * dm / 10.0) * (0.08 + 0.06 * uPulse) * (1.0 - edge * 0.8);
                    // Rims: hard bright line, studs every two metres and a soft halo; red where the wall is low
                    vec3 rimCol = mix(uAccent, uDanger, clamp(vLow, 0.0, 1.0));
                    float rim = 1.0 - smoothstep(0.0, 0.03, edge);
                    float halo = 1.0 - smoothstep(0.0, 0.14, edge);
                    float studs = (1.0 - smoothstep(0.0, 0.05, edge)) * line(vUv.y / 2.0, 0.07);
                    col += rimCol * (rim * (0.9 + uPulse * 0.4) + halo * 0.18 + studs * 1.2);
                    // Rolled edge: solid glowing metal
                    col = mix(col, rimCol * (0.75 + uPulse * 0.35) * (0.5 + 0.5 * diff) + skyR * 0.35 + uSunCol * sunSpec, lip);
                    col += uAccent * uFlash * 0.3;
                    // The drops: on every beat a ring of light leaves the marble and races
                    // down the chute ahead of it, and the seams flare with the kick
                    if (uDrop > 0.01) {
                        float ahead = vUv.y - uMarbleS;
                        float a0 = uBeatAge, a1 = uBeatAge + uBeatLen;
                        float d0 = ahead - (3.0 + a0 * 115.0), d1 = ahead - (3.0 + a1 * 115.0);
                        float chase = exp(-d0 * d0 / 2.5) * exp(-a0 * 1.6) + exp(-d1 * d1 / 2.5) * exp(-a1 * 1.6);
                        vec3 cc = mix(uAccent, uSeam, 0.5 + 0.5 * sin(vUv.y * 0.05));
                        col += cc * chase * uDrop * (1.1 + seam * 2.5 + (1.0 - lip) * 0.4);
                        col += uSeam * seam * uDrop * uPulse * 0.9;
                        col += rimCol * rim * uDrop * uPulse * 0.8;
                    }
                    gl_FragColor = vec4(col, 1.0);
                    #include <fog_fragment>
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }`
        };
    }

    buildPipe(track, group, pal) {
        const N = 24;
        const sh = Scene3D.pipeShader();
        this.pipeUniforms = {
            uFloor: { value: new THREE.Color(pal.pipe).multiplyScalar(0.55) },
            uWall: { value: new THREE.Color(pal.pipe).multiplyScalar(1.5) },
            uAccent: { value: new THREE.Color(pal.accent) },
            uAccent2: { value: new THREE.Color(pal.accent2) },
            uGlow: { value: this.glowColor || new THREE.Color('#8080ff') },
            uDanger: { value: new THREE.Color('#ff2e63') },
            uSunDir: { value: new THREE.Vector3(0.3, 0.85, 0.4).normalize() },
            uSkyTop: { value: new THREE.Color(pal.skyTop) },
            uSkyMid: { value: new THREE.Color(pal.skyMid) },
            uSkyBottom: { value: new THREE.Color(pal.skyBottom) },
            uSunCol: { value: new THREE.Color(pal.sun) },
            uSeam: { value: new THREE.Color(pal.seam || pal.accent) },
            uCells: { value: new THREE.Vector4(...(pal.cells || [0.9, 1, 0.035, 0.12])) },
            uBrick: { value: pal.brick || 0 },
            uWorld: { value: track.worldId },
            uMarblePos: { value: new THREE.Vector3() },
            uTime: { value: 0 },
            uPulse: { value: 0 },
            uMarbleS: { value: 0 },
            uFlash: { value: 0 },
            uDrop: { value: 0 },
            uBeatAge: { value: 9 },
            uBeatLen: { value: 0.47 },
            fogColor: { value: new THREE.Color() },
            fogNear: { value: this.scene.fog.near },
            fogFar: { value: this.scene.fog.far }
        };
        this.pipeMaterial = new THREE.ShaderMaterial({
            uniforms: this.pipeUniforms,
            vertexShader: sh.vertex,
            fragmentShader: sh.fragment,
            side: THREE.DoubleSide,
            fog: true
        });
        const tmp = [0, 0, 0];
        // Columns: a rolled lip outside each rim (two columns, uv.x beyond 0..1), then the pipe surface
        const cols = N + 5;
        for (const [c0, c1] of this.chunks(track)) {
            const rows = c1 - c0 + 1;
            const pos = new Float32Array(rows * cols * 3);
            const uv = new Float32Array(rows * cols * 2);
            const low = new Float32Array(rows * cols);
            const kind = new Float32Array(rows * cols);
            for (let r = 0; r < rows; r++) {
                const i = c0 + r;
                const wl = track.wallL[i], wr = track.wallR[i];
                const lowL = wl < 1.6 ? 1 : 0, lowR = wr < 1.6 ? 1 : 0;
                // A closed tube (spiral funnel) has no rims: the lip columns collapse onto the seam
                const tube = wl > 3.1;
                const fi = track.force[i];
                const kindV = track.mat[i] || (fi === 6 ? 6 : fi === 7 || fi === 10 ? 7 : fi === 9 ? 8 : 0);
                for (let k = 0; k < cols; k++) {
                    let t, phi, h = 0;
                    if (k === 0) { t = -0.1; phi = tube ? -wl : -wl - 0.08; h = tube ? 0 : -0.3; }
                    else if (k === 1) { t = -0.05; phi = tube ? -wl : -wl - 0.035; h = tube ? 0 : -0.1; }
                    else if (k === cols - 2) { t = 1.05; phi = tube ? wr : wr + 0.035; h = tube ? 0 : -0.1; }
                    else if (k === cols - 1) { t = 1.1; phi = tube ? wr : wr + 0.08; h = tube ? 0 : -0.3; }
                    else { t = (k - 2) / N; phi = -wl + (wl + wr) * t; }
                    this.pointAtSample(track, i, phi, h, tmp);
                    const o = (r * cols + k) * 3;
                    pos[o] = tmp[0]; pos[o + 1] = tmp[1]; pos[o + 2] = tmp[2];
                    uv[(r * cols + k) * 2] = t;
                    uv[(r * cols + k) * 2 + 1] = i * track.ds;
                    low[r * cols + k] = t < 0.5 ? lowL : lowR;
                    kind[r * cols + k] = kindV;
                }
            }
            const idx = [];
            for (let r = 0; r < rows - 1; r++) {
                if (track.gap[c0 + r] || track.gap[c0 + r + 1]) continue;
                for (let k = 0; k < cols - 1; k++) {
                    const a = r * cols + k, b = a + 1, c = a + cols, d = c + 1;
                    idx.push(a, c, b, b, c, d);
                }
            }
            if (!idx.length) continue;
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            geo.setAttribute('aLow', new THREE.BufferAttribute(low, 1));
            geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
            geo.setIndex(idx);
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            group.add(new THREE.Mesh(geo, this.pipeMaterial));
        }
    }

    /** A decal following the floor between two angles, with UVs (u across, v along) */
    floorDecalGeometry(track, s0, s1, phiA, phiB, lift = 0.03, cols = 10) {
        const i0 = Math.max(0, Math.floor(s0)), i1 = Math.min(track.count - 1, Math.ceil(s1));
        const rows = i1 - i0 + 1;
        const pos = new Float32Array(rows * (cols + 1) * 3);
        const uv = new Float32Array(rows * (cols + 1) * 2);
        const tmp = [0, 0, 0];
        for (let r = 0; r < rows; r++) {
            for (let k = 0; k <= cols; k++) {
                const t = k / cols;
                this.pointAtSample(track, i0 + r, phiA + (phiB - phiA) * t, lift, tmp);
                const o = r * (cols + 1) + k;
                pos[o * 3] = tmp[0]; pos[o * 3 + 1] = tmp[1]; pos[o * 3 + 2] = tmp[2];
                uv[o * 2] = t;
                uv[o * 2 + 1] = (i0 + r - s0) / Math.max(1, s1 - s0);
            }
        }
        const idx = [];
        for (let r = 0; r < rows - 1; r++) {
            for (let k = 0; k < cols; k++) {
                const a = r * (cols + 1) + k, b = a + 1, c = a + cols + 1, d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    /**
     * Contact shadows under the obstacles: a soft dark patch on the chute
     * beneath every wall, bar, post and mine, so they sit on the surface
     * instead of floating over it. One merged decal, one draw.
     */
    buildObstacleShadows(track, group) {
        const parts = [];
        for (const o of track.obstacles) {
            let phiA, phiB, sA, sB;
            if (o.type === 'hurdle' || o.type === 'spikes' || o.type === 'laser' || o.type === 'spinner') {
                phiA = -1.55; phiB = 1.55; sA = o.s - (o.depth || 0.7) * 0.5 - 0.9; sB = o.s + (o.depth || 0.7) * 0.5 + 0.9;
            } else if (o.type === 'block' || o.type === 'gate' || o.type === 'mine') {
                const half = o.type === 'mine' ? 0.3 : (o.half || 0.4);
                phiA = o.phi - half - 0.22; phiB = o.phi + half + 0.22;
                sA = o.s - (o.depth || 1.2) * 0.5 - 0.8; sB = o.s + (o.depth || 1.2) * 0.5 + 0.8;
            } else continue;
            if (sA < 2 || sB > track.length - 2) continue;
            parts.push(this.floorDecalGeometry(track, sA, sB, Math.max(-1.7, phiA), Math.min(1.7, phiB), 0.025, 6));
        }
        if (!parts.length) return;
        const geo = Scene3D.mergeWithUv(parts);
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
            map: this.shadowTexture, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
        }));
        mesh.renderOrder = 1;
        group.add(mesh);
    }

    /** Concatenate indexed geometries that carry positions and uvs into one */
    static mergeWithUv(geos) {
        let nv = 0, ni = 0;
        for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
        const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
        let vo = 0, io = 0;
        for (const g of geos) {
            pos.set(g.attributes.position.array, vo * 3);
            uv.set(g.attributes.uv.array, vo * 2);
            const gi = g.index.array;
            for (let k = 0; k < gi.length; k++) idx[io + k] = gi[k] + vo;
            vo += g.attributes.position.count;
            io += gi.length;
        }
        const out = new THREE.BufferGeometry();
        out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        out.setIndex(new THREE.BufferAttribute(idx, 1));
        out.computeBoundingSphere();
        return out;
    }

    /** Concatenate indexed position-only geometries into one draw */
    static mergeGeometries(geos) {
        let nv = 0, ni = 0;
        for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
        const pos = new Float32Array(nv * 3);
        const idx = new Uint32Array(ni);
        let ov = 0, oi = 0;
        for (const g of geos) {
            pos.set(g.attributes.position.array, ov * 3);
            const gi = g.index.array;
            for (let k = 0; k < gi.length; k++) idx[oi + k] = gi[k] + ov;
            ov += g.attributes.position.count;
            oi += gi.length;
            g.dispose();
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setIndex(new THREE.BufferAttribute(idx, 1));
        geo.computeVertexNormals();
        return geo;
    }

    /** Chevrons pointing along +u, for sidewind decals */
    static makeArrowTexture(color) {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const g = c.getContext('2d');
        g.clearRect(0, 0, 64, 64);
        g.strokeStyle = color;
        g.lineWidth = 7;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(18, 10);
        g.lineTo(44, 32);
        g.lineTo(18, 54);
        g.stroke();
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }

    /** Spiral arms around a dark eye, for gravity wells */
    static makeVortexTexture(color) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        g.clearRect(0, 0, 128, 128);
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(0,0,0,0.9)');
        grad.addColorStop(0.35, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 128, 128);
        g.strokeStyle = color;
        g.lineWidth = 3;
        for (let arm = 0; arm < 3; arm++) {
            g.beginPath();
            for (let t = 0; t <= 1; t += 0.02) {
                const a = arm * Math.PI * 2 / 3 + t * Math.PI * 2.4;
                const r = 6 + t * 56;
                const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r;
                if (t === 0) g.moveTo(x, y); else g.lineTo(x, y);
            }
            g.globalAlpha = 0.9;
            g.stroke();
        }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.center.set(0.5, 0.5);
        return t;
    }

    /**
     * Force pieces: each stretch gets a visual that says what it does.
     * Grooves are faint guide lines; sidewinds scroll chevrons the way they
     * push; wells spin a dark vortex; bumps are raised ridges; rails glow;
     * zero-g tunnels and spiral funnels are ringed and tinted (see the shader).
     */
    buildForces(track, group, pal) {
        const R = track.radius;
        const arrowTex = Scene3D.makeArrowTexture('#ffffff');
        const q = new THREE.Quaternion();
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        const one = new THREE.Vector3(1, 1, 1);
        for (const sec of track.sections) {
            const len = sec.s1 - sec.s0;
            switch (sec.type) {
                case 'groove': {
                    const mat = new THREE.MeshBasicMaterial({ color: pal.accent2, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
                    for (const phi of [-0.32, 0, 0.32]) {
                        group.add(new THREE.Mesh(this.stripGeometry(track, sec.s0, sec.s1, () => phi, 0.03, 0.02), mat));
                    }
                    break;
                }
                case 'sidewind': {
                    const tex = arrowTex.clone();
                    tex.needsUpdate = true;
                    // Big chevrons: one and a half across the floor, one every three metres
                    tex.repeat.set(1.5 * sec.dir, len / 3);
                    const mat = new THREE.MeshBasicMaterial({ map: tex, color: '#cfeeff', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
                    group.add(new THREE.Mesh(this.floorDecalGeometry(track, sec.s0, sec.s1, -1.35, 1.35, 0.03), mat));
                    this.forceAnims.push((dt) => { tex.offset.x -= dt * 1.6; });
                    break;
                }
                case 'well': {
                    const tex = Scene3D.makeVortexTexture('#c77dff');
                    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
                    const phiA = Math.max(-1.75, sec.phiW - 0.9), phiB = Math.min(1.75, sec.phiW + 0.9);
                    group.add(new THREE.Mesh(this.floorDecalGeometry(track, sec.sw - 7, sec.sw + 7, phiA, phiB, 0.03, 12), mat));
                    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: '#c77dff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
                    const gp = track.point(sec.sw, sec.phiW, 0.5);
                    glow.position.set(gp[0], gp[1], gp[2]);
                    glow.scale.setScalar(4);
                    group.add(glow);
                    this.forceAnims.push((dt) => { tex.rotation += dt * 2.5; glow.scale.setScalar(3.6 + Math.sin(this.time * 4) * 0.5); });
                    break;
                }
                case 'bumps': {
                    const parts = [];
                    for (let s = sec.s0 + sec.spacing; s < sec.s1; s += sec.spacing) {
                        parts.push(this.arcBandGeometry(track, s - 0.25, s + 0.25, -1.6, 1.6, 0, 0.2));
                    }
                    if (parts.length) group.add(new THREE.Mesh(Scene3D.mergeGeometries(parts), new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: new THREE.Color('#ffd166'), emissiveIntensity: 0.5, roughness: 0.4 })));
                    break;
                }
                case 'cliff': {
                    // Hazard bands at the crest, and a glowing lip on the edge itself
                    const warn = new THREE.MeshBasicMaterial({ color: '#ffd166' });
                    const warn2 = new THREE.MeshBasicMaterial({ color: '#ff2e63' });
                    for (let k = 0; k < 3; k++) {
                        const s = sec.crest - 2 - k * 3;
                        group.add(new THREE.Mesh(this.arcBandGeometry(track, s - 0.35, s + 0.35, -1.7, 1.7, 0, 0.06), k % 2 ? warn2 : warn));
                    }
                    group.add(new THREE.Mesh(this.arcBandGeometry(track, sec.crest - 0.3, sec.crest + 0.3, -1.75, 1.75, -0.02, 0.5), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
                    break;
                }
                case 'loop': {
                    // Hoops round the outside of the loop, and an arch over its entry
                    const hoopGeo = new THREE.TorusGeometry(R + 0.55, 0.12, 6, 36);
                    const spots = [];
                    for (let s = sec.s0 + 6; s < sec.s1 - 4; s += 4) spots.push(s);
                    const hoops = new THREE.InstancedMesh(hoopGeo, new THREE.MeshBasicMaterial({ color: pal.accent2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), spots.length);
                    spots.forEach((s, k) => {
                        const f = track.frame(s);
                        this.surfaceQuaternion(track, s, 0, q);
                        p.set(f.C[0] + f.U[0] * R, f.C[1] + f.U[1] * R, f.C[2] + f.U[2] * R);
                        hoops.setMatrixAt(k, m4.compose(p, q, one));
                    });
                    group.add(hoops);
                    const arch = new THREE.Mesh(new THREE.TorusGeometry(R + 1.2, 0.3, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: pal.accent }));
                    const fa = track.frame(sec.s0 - 2);
                    this.surfaceQuaternion(track, sec.s0 - 2, 0, arch.quaternion);
                    arch.position.set(fa.C[0] + fa.U[0] * R, fa.C[1] + fa.U[1] * R, fa.C[2] + fa.U[2] * R);
                    group.add(arch);
                    for (let k = 0; k < 3; k++) {
                        const s = sec.s0 - 6 - k * 3;
                        group.add(new THREE.Mesh(this.arcBandGeometry(track, s - 0.3, s + 0.3, -1.7, 1.7, 0, 0.06), new THREE.MeshBasicMaterial({ color: k % 2 ? pal.accent2 : pal.accent })));
                    }
                    break;
                }
                case 'helix': {
                    // The tower: a column up the middle of the spiral with light rings
                    // every few metres, a beacon on top, and a cone of light below it
                    const tr = track;
                    let cx = 0, cz = 0, ymin = Infinity, ymax = -Infinity, cnt = 0;
                    for (let i = sec.s0 + 10; i < sec.s1 - 10; i += 4) {
                        cx += tr.C[i * 3] - tr.R[i * 3] * sec.dir * sec.radius;
                        cz += tr.C[i * 3 + 2] - tr.R[i * 3 + 2] * sec.dir * sec.radius;
                        ymin = Math.min(ymin, tr.C[i * 3 + 1]); ymax = Math.max(ymax, tr.C[i * 3 + 1]);
                        cnt++;
                    }
                    if (!cnt) break;
                    cx /= cnt; cz /= cnt;
                    let lowest = Infinity;
                    for (let i = 0; i < tr.count; i++) lowest = Math.min(lowest, tr.C[i * 3 + 1]);
                    const base = lowest - 45 + Scene3D.terrainHeight(cx, cz, pal.terrain);
                    const top = ymax + 22;
                    const h = top - base;
                    const col = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, h, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#0b0e1c', metalness: 0.85, roughness: 0.35, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.18 }));
                    col.position.set(cx, base + h / 2, cz);
                    group.add(col);
                    const ringItems = [];
                    for (let y = ymin - 6; y < top - 4; y += 5) ringItems.push({ s: sec.s0, y });
                    const ringMat = new THREE.MeshBasicMaterial({ color: pal.accent2, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
                    const ringGeo = new THREE.TorusGeometry(2.9, 0.12, 4, 28);
                    ringGeo.rotateX(Math.PI / 2);
                    const identQ = new THREE.Quaternion();
                    this.instancedChunks(group, ringGeo, ringMat, ringItems, (it, m4) => { m4.compose(p.set(cx, it.y, cz), identQ, one); }, { chunkLen: 1e9 });
                    const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshBasicMaterial({ color: pal.accent2 }));
                    beacon.position.set(cx, top + 1, cz);
                    group.add(beacon);
                    const cone = new THREE.Mesh(new THREE.ConeGeometry(sec.radius * 0.6, top - ymin + 10, 24, 1, true), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
                    cone.position.set(cx, (top + ymin - 10) / 2, cz);
                    cone.rotation.x = Math.PI;
                    group.add(cone);
                    // Light bands round the chute every half turn
                    const step = Math.round(Math.PI * sec.radius);
                    for (let k = sec.s0 + 20; k < sec.s1 - 20; k += step) group.add(new THREE.Mesh(this.arcBandGeometry(track, k - 0.3, k + 0.3, -2.3, 2.3, 0, 0.06), new THREE.MeshBasicMaterial({ color: pal.accent2 })));
                    this.forceAnims.push(() => { beacon.material.color.set(pal.accent2).multiplyScalar(0.7 + 0.5 * Math.sin(this.time * 4)); });
                    break;
                }
                case 'plunge': {
                    // Rings down the shaft, hazard bands at the brink
                    const ringGeo = new THREE.TorusGeometry(R - 0.14, 0.07, 5, 32);
                    const spots = [];
                    for (let s = sec.s0 + 8; s < sec.s1 - 8; s += 5) spots.push(s);
                    const rings = new THREE.InstancedMesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#ff8a65', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), spots.length);
                    spots.forEach((s, k) => {
                        const f = track.frame(s);
                        this.surfaceQuaternion(track, s, 0, q);
                        p.set(f.C[0] + f.U[0] * R, f.C[1] + f.U[1] * R, f.C[2] + f.U[2] * R);
                        rings.setMatrixAt(k, m4.compose(p, q, one));
                    });
                    group.add(rings);
                    const warn = new THREE.MeshBasicMaterial({ color: '#ffd166' }), warn2 = new THREE.MeshBasicMaterial({ color: '#ff2e63' });
                    for (let k = 0; k < 3; k++) {
                        const s = sec.s0 - 2 - k * 3;
                        group.add(new THREE.Mesh(this.arcBandGeometry(track, s - 0.35, s + 0.35, -1.7, 1.7, 0, 0.06), k % 2 ? warn2 : warn));
                    }
                    break;
                }
                case 'kicker': {
                    // The lip of the ramp glows, and chevrons up it point at the sky
                    group.add(new THREE.Mesh(this.arcBandGeometry(track, sec.tip - 0.5, sec.tip + 0.2, -1.75, 1.75, -0.02, 0.5), new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
                    for (let k = 0; k < 4; k++) {
                        const s = sec.tip - 4 - k * 4;
                        group.add(new THREE.Mesh(this.arcBandGeometry(track, s - 0.3, s + 0.3, -1.2, 1.2, 0, 0.06), new THREE.MeshBasicMaterial({ color: k % 2 ? '#ffd166' : pal.accent })));
                    }
                    break;
                }
                case 'rail': {
                    group.add(new THREE.Mesh(this.arcBandGeometry(track, sec.s0, sec.s1, sec.phi - 0.05, sec.phi + 0.05, 0, 0.09), new THREE.MeshBasicMaterial({ color: '#ffe066' })));
                    group.add(new THREE.Mesh(this.arcBandGeometry(track, sec.s0, sec.s1, sec.phi - 0.2, sec.phi + 0.2, 0, 0.3), new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
                    break;
                }
                case 'zerog':
                case 'spiral': {
                    const tube = sec.type === 'spiral';
                    const arc = tube ? Math.PI * 2 : Math.PI * 1.15;
                    const ringGeo = new THREE.TorusGeometry(R - 0.14, 0.06, 5, tube ? 32 : 24, arc);
                    if (!tube) ringGeo.rotateZ(-Math.PI / 2 - arc / 2);
                    const color = tube ? '#d58cff' : '#8fb8ff';
                    const spots = [];
                    for (let s = sec.s0 + 3; s < sec.s1; s += tube ? 5 : 6) spots.push(s);
                    const rings = new THREE.InstancedMesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }), spots.length);
                    spots.forEach((s, k) => {
                        const f = track.frame(s);
                        this.surfaceQuaternion(track, s, 0, q);
                        p.set(f.C[0] + f.U[0] * R, f.C[1] + f.U[1] * R, f.C[2] + f.U[2] * R);
                        rings.setMatrixAt(k, m4.compose(p, q, one));
                    });
                    group.add(rings);
                    if (!tube) {
                        // Motes hanging in the tunnel
                        const n = 50;
                        const arr = new Float32Array(n * 3);
                        for (let k = 0; k < n; k++) {
                            const pt = track.point(sec.s0 + Math.random() * len, (Math.random() * 2 - 1) * 1.2, 0.6 + Math.random() * 2.2);
                            arr[k * 3] = pt[0]; arr[k * 3 + 1] = pt[1]; arr[k * 3 + 2] = pt[2];
                        }
                        const geo = new THREE.BufferGeometry();
                        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
                        const motes = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.3, map: this.glowTexture, color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
                        group.add(motes);
                        this.forceAnims.push((dt) => { motes.position.y = Math.sin(this.time * 0.8) * 0.3; });
                    }
                    break;
                }
            }
        }
    }

    /** One-shot visual state for marble abilities (see Game.useAbility) */
    abilityFx(type, color, on) {
        const mat = this.marble.material;
        if (type === 'phase') {
            if (on) {
                mat.userData.op = mat.opacity;
                mat.userData.tr = mat.transparent;
                mat.transparent = true;
                mat.opacity = 0.3;
            } else {
                mat.opacity = mat.userData.op ?? 1;
                mat.transparent = mat.userData.tr ?? false;
            }
            mat.needsUpdate = true;
        }
        if (on && type === 'burst') this.boostFx();
        this.abilityGlow = on ? new THREE.Color(color) : null;
    }

    /** World point for a sample index (no interpolation) */
    pointAtSample(track, i, phi, h, out) {
        const C = track.C, U = track.U, Rv = track.R;
        const r = track.radius - h;
        const sp = Math.sin(phi), cp = Math.cos(phi);
        for (let c = 0; c < 3; c++) {
            out[c] = C[i * 3 + c] + U[i * 3 + c] * track.radius + (Rv[i * 3 + c] * sp - U[i * 3 + c] * cp) * r;
        }
        return out;
    }

    /** A thin band following the pipe surface between two angles */
    stripGeometry(track, from, to, phiFn, widthPhi, lift = 0.02) {
        const pos = [];
        const idx = [];
        const tmp = [0, 0, 0];
        let row = 0;
        for (let i = from; i < to; i++) {
            if (track.gap[i]) {
                row = 0;
                continue;
            }
            const phi = phiFn(i);
            this.pointAtSample(track, i, phi - widthPhi / 2, lift, tmp);
            pos.push(...tmp);
            this.pointAtSample(track, i, phi + widthPhi / 2, lift, tmp);
            pos.push(...tmp);
            const base = pos.length / 3 - 2;
            if (row > 0) idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
            row++;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        return geo;
    }

    /** Curved slab hugging the pipe wall: phi centre +- half, height h, length depth */
    slabGeometry(track, o) {
        const segs = Math.max(2, Math.ceil(o.half * 2 / 0.15));
        const pos = [];
        const idx = [];
        const pt = (s, phi, h) => track.point(s, phi, h).slice();
        const s0 = o.s - o.depth / 2, s1 = o.s + o.depth / 2;
        // Rings of 4 points (inner/outer x front/back) for each angular step
        for (let k = 0; k <= segs; k++) {
            const phi = o.phi - o.half + (o.half * 2) * (k / segs);
            pos.push(...pt(s0, phi, -0.05), ...pt(s0, phi, o.h), ...pt(s1, phi, o.h), ...pt(s1, phi, -0.05));
        }
        for (let k = 0; k < segs; k++) {
            const a = k * 4, b = (k + 1) * 4;
            // front, top, back faces
            idx.push(a, b, a + 1, a + 1, b, b + 1);
            idx.push(a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
            idx.push(a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
        }
        // Side caps
        const last = segs * 4;
        idx.push(0, 1, 2, 0, 2, 3);
        idx.push(last, last + 2, last + 1, last, last + 3, last + 2);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    /** Band hugging the pipe between two angles, from height h0 to h1 */
    arcBandGeometry(track, s0, s1, phiA, phiB, h0, h1) {
        const segs = Math.max(2, Math.ceil(Math.abs(phiB - phiA) / 0.15));
        const pos = [];
        const idx = [];
        for (let k = 0; k <= segs; k++) {
            const phi = phiA + (phiB - phiA) * (k / segs);
            pos.push(...track.point(s0, phi, h0), ...track.point(s0, phi, h1), ...track.point(s1, phi, h1), ...track.point(s1, phi, h0));
        }
        for (let k = 0; k < segs; k++) {
            const a = k * 4, b = (k + 1) * 4;
            idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3, a + 3, b + 3, a, a, b + 3, b);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        return geo;
    }

    /** Orientation of a piece sitting on the pipe at (s, phi): x across, y up off the wall, z down the track */
    surfaceQuaternion(track, s, phi, out) {
        const f = track.frame(s);
        const sp = Math.sin(phi), cp = Math.cos(phi);
        this._mx = this._mx || [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
        const [ex, ey, ez] = this._mx;
        ex.set(f.R[0] * cp + f.U[0] * sp, f.R[1] * cp + f.U[1] * sp, f.R[2] * cp + f.U[2] * sp);
        ey.set(-(f.R[0] * sp - f.U[0] * cp), -(f.R[1] * sp - f.U[1] * cp), -(f.R[2] * sp - f.U[2] * cp));
        // The track basis (R, U, T) is left-handed; z = -T makes a proper rotation
        ez.set(-f.T[0], -f.T[1], -f.T[2]);
        this.tmpM.makeBasis(ex, ey, ez);
        return out.setFromRotationMatrix(this.tmpM);
    }

    static makeBarrelTexture(accent) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#1a0a12';
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = accent;
        for (let k = 0; k < 4; k++) g.fillRect(0, k * 32 + 10, 128, 6);
        g.fillStyle = '#ffffff';
        g.globalAlpha = 0.5;
        for (let k = 0; k < 4; k++) g.fillRect(0, k * 32 + 12, 128, 2);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }

    buildObstacles(track, group, pal) {
        const red = '#ff2e63';
        const wallMat = new THREE.MeshStandardMaterial({ color: '#2a0610', emissive: red, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.3 });
        const edgeMat = new THREE.LineBasicMaterial({ color: '#ffb3c6' });
        const hurdleMat = new THREE.MeshStandardMaterial({ color: '#3a1a04', emissive: '#ffb02e', emissiveIntensity: 1.1, roughness: 0.3, metalness: 0.4 });
        const hurdleGlow = new THREE.MeshBasicMaterial({ color: '#ff9a1f', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const spikeMat = new THREE.MeshStandardMaterial({ color: '#3a0a14', emissive: red, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.5, flatShading: true });
        const beamMat = () => new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        const emitterMat = new THREE.MeshStandardMaterial({ color: '#2a0610', emissive: red, emissiveIntensity: 1.4, roughness: 0.3 });
        const barrelTex = Scene3D.makeBarrelTexture(pal.accent);
        const barrelMat = new THREE.MeshStandardMaterial({ map: barrelTex, emissiveMap: barrelTex, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.45, metalness: 0.5 });
        this.movers = [];
        this.mines = [];
        this.lasers = [];
        this.barrels = [];
        this.spinners = [];

        // Gap ledges: bright red lip on both edges plus a halo so the drop reads from far away
        const ledgeMat = new THREE.MeshBasicMaterial({ color: '#ff2e63' });
        const ledgeGlow = new THREE.MeshBasicMaterial({ color: '#ff2e63', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        for (const sec of track.sections) {
            if (sec.type !== 'gap') continue;
            for (const [a, b] of [[sec.s0 - 0.7, sec.s0 - 0.05], [sec.s1 + 0.05, sec.s1 + 0.7]]) {
                group.add(new THREE.Mesh(this.arcBandGeometry(track, a, b, -1.75, 1.75, -0.02, 0.1), ledgeMat));
                group.add(new THREE.Mesh(this.arcBandGeometry(track, a - 1.2, b + 1.2, -1.75, 1.75, -0.02, 0.5), ledgeGlow));
            }
        }
        const rodMat = new THREE.MeshStandardMaterial({ color: '#2a0610', emissive: red, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.5 });
        const rodEndGeo = new THREE.SphereGeometry(0.34, 12, 10);
        const mineGeo = new THREE.IcosahedronGeometry(0.62, 0);
        const spikeGeo = new THREE.ConeGeometry(0.2, 0.62, 6);
        const emitterGeo = new THREE.SphereGeometry(0.22, 10, 8);
        const q = new THREE.Quaternion();
        const m4 = new THREE.Matrix4();
        const p3 = new THREE.Vector3();
        const one = new THREE.Vector3(1, 1, 1);

        for (const o of track.obstacles) {
            if (o.type === 'mover') {
                const width = o.half * 2 * (track.radius - o.h / 2);
                const geo = new THREE.BoxGeometry(width, o.h, o.depth);
                const mesh = new THREE.Mesh(geo, wallMat);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
                mesh.userData.o = o;
                group.add(mesh);
                this.movers.push(mesh);
            } else if (o.type === 'mine') {
                const mesh = new THREE.Mesh(mineGeo, wallMat);
                const p = track.point(o.s, o.phi, o.h);
                mesh.position.set(p[0], p[1], p[2]);
                const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: red, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
                glow.scale.setScalar(2.6);
                mesh.add(glow);
                group.add(mesh);
                this.mines.push(mesh);
            } else if (o.type === 'hurdle') {
                // Glowing bar plus a soft halo so it reads from far away
                group.add(new THREE.Mesh(this.slabGeometry(track, o), hurdleMat));
                group.add(new THREE.Mesh(this.arcBandGeometry(track, o.s - o.depth, o.s + o.depth, -o.half, o.half, -0.02, o.h * 1.7), hurdleGlow));
            } else if (o.type === 'spikes') {
                // Rows of cones across the floor, one instanced draw per strip
                const rows = Math.max(2, Math.round(o.depth / 0.75));
                const cols = Math.round((o.half * 2) / 0.17);
                const inst = new THREE.InstancedMesh(spikeGeo, spikeMat, rows * cols);
                let k = 0;
                for (let r = 0; r < rows; r++) {
                    const sr = o.s - o.depth / 2 + 0.35 + r * ((o.depth - 0.7) / Math.max(1, rows - 1));
                    for (let c = 0; c < cols; c++) {
                        const phi = -o.half + (o.half * 2) * ((c + (r % 2) * 0.5) / cols);
                        const p = track.point(sr, phi, 0.28);
                        this.surfaceQuaternion(track, sr, phi, q);
                        m4.compose(p3.set(p[0], p[1], p[2]), q, one);
                        inst.setMatrixAt(k++, m4);
                    }
                }
                inst.count = k;
                group.add(inst);
                group.add(new THREE.Mesh(this.arcBandGeometry(track, o.s - o.depth / 2, o.s + o.depth / 2, -o.half, o.half, -0.03, 0.05), new THREE.MeshBasicMaterial({ color: '#4a0a18' })));
            } else if (o.type === 'laser') {
                const beam = new THREE.Mesh(this.arcBandGeometry(track, o.s - 0.05, o.s + 0.05, -o.half, o.half, o.h - 0.05, o.h + 0.05), beamMat());
                const halo = new THREE.Mesh(this.arcBandGeometry(track, o.s - 0.25, o.s + 0.25, -o.half, o.half, o.h - 0.3, o.h + 0.3), beamMat());
                halo.material.opacity = 0.3;
                beam.userData.o = o;
                beam.userData.halo = halo;
                group.add(beam, halo);
                for (const side of [-1, 1]) {
                    const e = new THREE.Mesh(emitterGeo, emitterMat);
                    const p = track.point(o.s, side * (o.half + 0.05), o.h);
                    e.position.set(p[0], p[1], p[2]);
                    group.add(e);
                }
                this.lasers.push(beam);
            } else if (o.type === 'spinner') {
                const len = 2 * (track.radius - 0.2);
                const geo = new THREE.CylinderGeometry(0.14, 0.14, len, 10, 1);
                const rod = new THREE.Mesh(geo, rodMat);
                for (const side of [-1, 1]) {
                    const end = new THREE.Mesh(rodEndGeo, rodMat);
                    end.position.y = side * len / 2;
                    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: red, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
                    glow.scale.setScalar(1.8);
                    end.add(glow);
                    rod.add(end);
                }
                const f = track.frame(o.s);
                rod.position.set(f.C[0] + f.U[0] * track.radius, f.C[1] + f.U[1] * track.radius, f.C[2] + f.U[2] * track.radius);
                rod.userData.o = o;
                group.add(rod);
                this.spinners.push(rod);
            } else if (o.type === 'barrel') {
                const len = 2 * (track.radius - o.radius) * Math.sin(1.25);
                const geo = new THREE.CylinderGeometry(o.radius, o.radius, len, 18, 1);
                geo.rotateZ(Math.PI / 2); // axis across the pipe (local x)
                const mesh = new THREE.Mesh(geo, barrelMat);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 40), edgeMat));
                mesh.userData.o = o;
                group.add(mesh);
                this.barrels.push(mesh);
            } else {
                const geo = this.slabGeometry(track, o);
                const mesh = new THREE.Mesh(geo, wallMat);
                mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edgeMat));
                group.add(mesh);
            }
        }
    }

    buildCoins(track, group) {
        const geo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.25 });
        this.coinMesh = new THREE.InstancedMesh(geo, mat, Math.max(1, track.coins.length));
        this.coinMesh.count = track.coins.length;
        this.coinBase = [];
        this.coinQuat = [];
        const basis = new THREE.Matrix4();
        for (const c of track.coins) {
            const p = track.point(c.s, c.phi, c.h);
            this.coinBase.push(new THREE.Vector3(p[0], p[1], p[2]));
            const f = track.frame(c.s);
            const sp = Math.sin(c.phi), cp = Math.cos(c.phi);
            // Local y = inward normal at this spot on the wall, z = down the track
            const up = new THREE.Vector3(-(f.R[0] * sp - f.U[0] * cp), -(f.R[1] * sp - f.U[1] * cp), -(f.R[2] * sp - f.U[2] * cp));
            const fwd = new THREE.Vector3(f.T[0], f.T[1], f.T[2]);
            const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
            basis.makeBasis(side, up, fwd);
            this.coinQuat.push(new THREE.Quaternion().setFromRotationMatrix(basis));
        }
        group.add(this.coinMesh);
        this.updateCoins(0);
    }

    updateCoins(t, nearS = null) {
        const coins = this.track.coins;
        const m = this.tmpM;
        const q = this.tmpQ;
        const scale = new THREE.Vector3();
        const axis = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < coins.length; i++) {
            const c = coins[i];
            // Coins far ahead keep their last pose; passed coins shrink away so they never loom at the camera
            if (nearS !== null && (c.s < nearS - 12 || c.s > nearS + 200) && !c.taken) continue;
            q.setFromAxisAngle(axis, t * 3 + i * 0.4).premultiply(this.coinQuat[i]);
            const behind = nearS !== null ? Math.max(0, nearS - 2.5 - c.s) : 0;
            scale.setScalar(c.taken ? 0 : Math.max(0, 1 - behind * 0.5));
            m.compose(this.coinBase[i], q, scale);
            this.coinMesh.setMatrixAt(i, m);
        }
        this.coinMesh.instanceMatrix.needsUpdate = true;
    }

    buildBoosts(track, group, pal) {
        this.chevron = Scene3D.makeChevronTexture('#22f0c8');
        const mat = new THREE.MeshBasicMaterial({ map: this.chevron, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        this.boostMaterial = mat;
        for (const b of track.boosts) {
            const pos = [];
            const uv = [];
            const idx = [];
            const steps = 6;
            for (let k = 0; k <= steps; k++) {
                const s = b.s + (b.len * k) / steps;
                const p1 = track.point(s, b.phi - b.width / 2, 0.04);
                const p2 = track.point(s, b.phi + b.width / 2, 0.04);
                pos.push(...p1, ...p2);
                uv.push(0, -k / steps * 2, 1, -k / steps * 2);
                if (k > 0) {
                    const a = (k - 1) * 2;
                    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
                }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
            geo.setIndex(idx);
            group.add(new THREE.Mesh(geo, mat));
        }
    }

    buildFinish(track, group, pal) {
        const s = track.finishS;
        const f = track.frame(s);
        const arch = new THREE.Mesh(
            new THREE.TorusGeometry(track.radius + 0.4, 0.18, 8, 40, Math.PI * 1.15),
            new THREE.MeshBasicMaterial({ color: '#ffffff' })
        );
        const basis = new THREE.Matrix4().makeBasis(
            new THREE.Vector3(...f.R), new THREE.Vector3(...f.U), new THREE.Vector3(...f.T).negate()
        );
        arch.quaternion.setFromRotationMatrix(basis);
        arch.rotateZ(-Math.PI * 0.075);
        arch.position.set(f.C[0] + f.U[0] * track.radius, f.C[1] + f.U[1] * track.radius, f.C[2] + f.U[2] * track.radius);
        group.add(arch);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: pal.accent, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
        glow.scale.setScalar(16);
        glow.position.copy(arch.position);
        group.add(glow);

        // Checkered floor
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 16;
        const g = c.getContext('2d');
        for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++) {
            g.fillStyle = (x + y) % 2 ? '#ffffff' : '#111111';
            g.fillRect(x * 8, y * 8, 8, 8);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.magFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        const pos = [];
        const uv = [];
        const idx = [];
        const steps = 12;
        for (let k = 0; k <= steps; k++) {
            const phi = -1.5 + 3 * (k / steps);
            pos.push(...track.point(s - 0.8, phi, 0.03), ...track.point(s + 0.8, phi, 0.03));
            uv.push(k / steps * 4, 0, k / steps * 4, 1);
            if (k > 0) {
                const a = (k - 1) * 2;
                idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })));
    }

    // ------------------------------------------------------------------
    // The world outside the chute: sky, celestial body, mountains, terrain, props
    // ------------------------------------------------------------------

    static hash2d(x, z) {
        const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
        return s - Math.floor(s);
    }

    static vnoise(x, z) {
        const ix = Math.floor(x), iz = Math.floor(z);
        let fx = x - ix, fz = z - iz;
        fx = fx * fx * (3 - 2 * fx);
        fz = fz * fz * (3 - 2 * fz);
        const a = Scene3D.hash2d(ix, iz), b = Scene3D.hash2d(ix + 1, iz), c = Scene3D.hash2d(ix, iz + 1), d = Scene3D.hash2d(ix + 1, iz + 1);
        return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
    }

    static fbm(x, z, octaves = 4) {
        let v = 0, a = 0.5, f = 1;
        for (let k = 0; k < octaves; k++) {
            v += a * Scene3D.vnoise(x * f + 11.3 * k, z * f - 7.1 * k);
            f *= 2.03;
            a *= 0.5;
        }
        return v;
    }

    /** Terrain height above the ground plane, shared by the mesh and the props */
    static terrainHeight(x, z, t) {
        let h = Scene3D.fbm(x * t.freq, z * t.freq);
        if (t.ridged) h = 1 - Math.abs(h * 2 - 1);
        return Math.max(0, h - 0.3) * t.amp;
    }

    buildBackdrop(track, group, pal) {
        const w = track.worldId;
        const body = pal.body;

        // Sky dome: gradient, horizon glow, drifting clouds (a nebula in space) and aurora ribbons
        const sky = new THREE.Mesh(
            new THREE.SphereGeometry(240, 24, 16),
            new THREE.ShaderMaterial({
                side: THREE.BackSide, depthWrite: false, fog: false,
                uniforms: {
                    top: { value: new THREE.Color(pal.skyTop) },
                    mid: { value: new THREE.Color(pal.skyMid) },
                    bottom: { value: new THREE.Color(pal.skyBottom) },
                    sun: { value: new THREE.Color(pal.sun) },
                    accent: { value: new THREE.Color(pal.accent) },
                    accent2: { value: new THREE.Color(pal.accent2) },
                    uTime: { value: 0 },
                    uWorld: { value: w },
                    uFlash: { value: 0 },
                    uDrop: { value: 0 },
                    uPulse: { value: 0 },
                    // Sky events (see updateSkyEvents): a lightning bolt (azimuth, strength, seed) and a meteor (azimuth, height, progress, strength)
                    uBolt: { value: new THREE.Vector4(0, 0, 0, 0) },
                    uMeteor: { value: new THREE.Vector4(0, 0, 0, 0) }
                },
                vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: `uniform vec3 top, mid, bottom, sun, accent, accent2; uniform float uTime, uWorld, uFlash, uDrop, uPulse; uniform vec4 uBolt, uMeteor; varying vec3 vDir;
                    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                    float vnoise(vec2 p) {
                        vec2 i = floor(p), f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
                    }
                    float fbm(vec2 p) {
                        float v = 0.0, a = 0.5;
                        for (int k = 0; k < 4; k++) { v += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
                        return v;
                    }
                    float wrapA(float x) { return x - 6.2831853 * floor((x + 3.14159265) / 6.2831853); }
                    void main(){
                        vec3 d = normalize(vDir);
                        float h = d.y;
                        float a = atan(d.z, d.x);
                        // The desert's horizon shimmers with heat
                        if (uWorld > 1.5 && uWorld < 2.5) h += sin(a * 45.0 + uTime * 2.5) * 0.004 * exp(-abs(h) * 20.0);
                        vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, h)) : mix(mid, bottom, smoothstep(0.0, -0.35, h));
                        c += mix(sun, mid, 0.4) * exp(-abs(h) * 10.0) * 0.22;
                        // Clouds on a dome projection, drifting slowly
                        vec2 p = d.xz / (abs(h) + 0.25) * 1.4 + vec2(uTime * 0.004, uTime * 0.0015);
                        float cl = fbm(p * 1.1);
                        if (uWorld > 5.5) {
                            // The Grid: a hard glowing horizon, scan bands climbing the sky, thin data streaks
                            c += accent * exp(-abs(h) * 16.0) * 0.7 + accent * exp(-abs(h) * 3.0) * 0.08;
                            float band = fract(uTime * 0.02);
                            c += accent2 * smoothstep(0.015, 0.0, abs(h - band * 0.9)) * 0.18 * smoothstep(0.0, 0.1, h);
                            float streak = smoothstep(0.985, 1.0, sin(a * 40.0 + uTime * 0.2)) * smoothstep(0.1, 0.5, h) * (1.0 - smoothstep(0.6, 0.9, h));
                            c += accent * streak * 0.25;
                        } else if (uWorld < 4.5) {
                            float wisp = smoothstep(0.42, 0.78, cl) * smoothstep(0.0, 0.25, h) * (1.0 - smoothstep(0.35, 0.95, h));
                            c = mix(c, mix(mid, sun, 0.55) * 1.15, wisp * (uWorld > 3.5 ? 0.75 : 0.5));
                        } else {
                            // Nebula: two noise fields, coloured by the world's accents
                            float neb = fbm(d.xy * 3.0 + 31.0);
                            float nb = smoothstep(0.3, 0.8, neb) * smoothstep(-0.1, 0.25, h);
                            c += mix(accent, accent2, cl) * nb * 0.7;
                            c += accent2 * smoothstep(0.6, 0.9, cl) * 0.25 * smoothstep(0.0, 0.3, h);
                        }
                        // Aurora ribbons overhead (strong in the meadow and the ice world)
                        float rib = sin(a * 3.0 + h * 9.0 + uTime * 0.05) * sin(a * 7.0 - h * 14.0 - uTime * 0.08);
                        rib = max(0.0, rib) * smoothstep(0.02, 0.35, h) * (1.0 - smoothstep(0.5, 0.95, h));
                        float ribK = (uWorld < 1.5 || (uWorld > 2.5 && uWorld < 3.5)) ? 0.16 : 0.05;
                        c += mix(accent, accent2, 0.5 + 0.5 * sin(a * 2.0 + uTime * 0.03)) * rib * ribK;
                        // Sky events. A meteor: a bright head with a fading trail, crossing the sky in under a second
                        if (uMeteor.w > 0.001) {
                            vec2 dir = normalize(vec2(0.9, -0.5));
                            vec2 head = vec2(0.0, uMeteor.y) + dir * uMeteor.z * 1.1;
                            vec2 q = vec2(wrapA(a - uMeteor.x), h);
                            vec2 rel = q - head;
                            float along = clamp(dot(rel, -dir), 0.0, 0.28);
                            vec2 near = head - dir * along;
                            float dist = length(q - near);
                            float trail = exp(-dist * dist * 9000.0) * (1.0 - along / 0.28);
                            c += vec3(1.0, 0.95, 0.85) * trail * uMeteor.w * 1.4 * smoothstep(0.03, 0.1, h);
                        }
                        // Lightning over the volcano: a jagged bolt from the clouds, and the whole sky flashing
                        if (uBolt.y > 0.001) {
                            float x = wrapA(a - uBolt.x);
                            float off = (vnoise(vec2(h * 9.0, uBolt.z)) - 0.5) * 0.3 + (vnoise(vec2(h * 31.0, uBolt.z + 5.0)) - 0.5) * 0.06;
                            float dd = abs(x - off);
                            float span = smoothstep(0.03, 0.08, h) * (1.0 - smoothstep(0.45, 0.58, h));
                            float bolt = (exp(-dd * dd * 6000.0) + exp(-dd * dd * 300.0) * 0.35) * span;
                            vec3 bc = vec3(0.85, 0.9, 1.0);
                            c += bc * bolt * uBolt.y * 3.0;
                            c += mix(bc, accent2, 0.5) * uBolt.y * 0.22 * exp(-abs(h) * 2.0) * (1.0 - smoothstep(0.0, 1.5, abs(x)));
                        }
                        // Diamond dust over the ice: ice crystals glittering in the air
                        if (uWorld > 2.5 && uWorld < 3.5) {
                            vec2 cellG = floor(vec2(a * 140.0, h * 140.0));
                            float sp = hash(cellG);
                            float tw = 0.5 + 0.5 * sin(uTime * 6.0 + sp * 200.0);
                            c += vec3(0.9, 0.97, 1.0) * smoothstep(0.975, 1.0, sp) * tw * smoothstep(0.0, 0.25, h) * 0.6;
                        }
                        // The drops light the sky: a flash on each drop, the horizon breathing with the kick
                        vec3 dc = mix(accent, accent2, 0.5 + 0.5 * sin(a * 3.0));
                        c += dc * (uFlash * 0.4 * exp(-abs(h) * 2.5) + uDrop * (0.05 + 0.1 * uPulse) * exp(-abs(h) * 6.0));
                        c += dc * rib * uDrop * uPulse * 0.5;
                        gl_FragColor = vec4(c, 1.0);
                        #include <tonemapping_fragment>
                        #include <colorspace_fragment>
                    }`
            })
        );
        sky.renderOrder = -10;
        this.sky = sky;
        this.skyBase = { top: new THREE.Color(pal.skyTop), mid: new THREE.Color(pal.skyMid), bottom: new THREE.Color(pal.skyBottom), accent2: new THREE.Color(pal.accent2) };
        this.skyDrift = 0;
        group.add(sky);

        // Stars: dense and tinted in space, a scatter elsewhere
        const nStars = w >= 5 ? 3200 : 1400;
        const starPos = new Float32Array(nStars * 3);
        for (let i = 0; i < nStars; i++) {
            const u = Math.random() * 0.9 + 0.1, th = Math.random() * Math.PI * 2;
            const sq = Math.sqrt(1 - u * u);
            starPos[i * 3] = sq * Math.cos(th) * 220;
            starPos[i * 3 + 1] = u * 220;
            starPos[i * 3 + 2] = sq * Math.sin(th) * 220;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: w === 5 ? '#e9ddff' : '#ffffff', size: w === 5 ? 2.0 : 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85, depthWrite: false }));
        group.add(this.stars);

        // Celestial body: a cratered moon, a turbulent sun, a ringed ice planet,
        // a red giant or a banded gas giant, billboarded ahead of the run
        this.sun = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
            transparent: true, depthWrite: false, fog: false, blending: THREE.NormalBlending,
            uniforms: {
                uColA: { value: new THREE.Color(body.colA) },
                uColB: { value: new THREE.Color(body.colB) },
                uRing: { value: new THREE.Color(body.ring || '#ffffff') },
                uType: { value: body.type },
                uTime: { value: 0 }
            },
            vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
            fragmentShader: `uniform vec3 uColA, uColB, uRing; uniform float uType, uTime; varying vec2 vUv;
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float vnoise(vec2 p) {
                    vec2 i = floor(p), f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
                }
                float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * vnoise(p); p = p * 2.1 + 9.0; a *= 0.5; } return v; }
                void main(){
                    vec2 d = (vUv - 0.5) * 2.0;
                    bool star = uType < 1.5 || (uType > 3.5 && uType < 4.5);
                    float rb = star ? 0.42 : 0.3;             // body radius in quad units
                    vec2 q = d / rb;
                    float qq = dot(q, q);
                    float disc = 1.0 - smoothstep(1.0, 1.0 + fwidth(qq) * 2.0, qq);
                    vec3 col = vec3(0.0);
                    float alpha = 0.0;
                    if (uType > 1.5 && uType < 2.5 || uType > 3.5 && uType < 4.5) {
                        // Suns: turbulent surface, bright limb, big corona
                        float tur = fbm(q * 2.5 + vec2(uTime * 0.05, 0.0));
                        vec3 surf = mix(uColB, uColA, tur) * (1.1 + 0.6 * pow(max(0.0, qq), 2.0));
                        float corona = exp(-qq * 1.1) * 0.9 * (1.0 - disc) + exp(-qq * 0.35) * 0.25;
                        col = surf * disc + mix(uColB, uColA, 0.5) * corona;
                        alpha = disc + corona;
                    } else {
                        // Planets and moons: a lit sphere
                        float z = sqrt(max(0.0, 1.0 - qq));
                        vec3 nrm = vec3(q, z);
                        vec3 L = normalize(vec3(-0.55, 0.45, 0.7));
                        float lit = max(0.0, dot(nrm, L));
                        float detail;
                        if (uType < 1.5) {
                            // moon: craters
                            float cr = vnoise(q * 5.0 + 3.0);
                            detail = 0.75 + 0.35 * smoothstep(0.35, 0.75, cr) - 0.3 * smoothstep(0.78, 0.9, vnoise(q * 9.0));
                        } else if (uType < 3.5) {
                            // ice planet: pale swirls
                            detail = 0.8 + 0.3 * fbm(q * 3.0 + uTime * 0.01);
                        } else if (uType > 5.5) {
                            // data moon: scan lines and a grid over a lit disc
                            float scan = 0.75 + 0.25 * smoothstep(0.3, 1.0, sin(q.y * 70.0));
                            float grid = max(smoothstep(0.06, 0.0, abs(fract(q.x * 4.0) - 0.5)), smoothstep(0.06, 0.0, abs(fract(q.y * 4.0) - 0.5)));
                            detail = scan * (0.7 + 0.5 * grid);
                        } else {
                            // gas giant: bands
                            float bands = sin(q.y * 11.0 + fbm(q * 3.0) * 3.0);
                            detail = 0.7 + 0.4 * (0.5 + 0.5 * bands);
                        }
                        vec3 surf = mix(uColB, uColA, detail) * (0.18 + 0.95 * lit);
                        surf += uColA * pow(1.0 - z, 3.0) * 0.25 * lit;
                        col = surf * disc;
                        alpha = disc;
                        // Rings for the ice planet and the gas giant: an ellipse, hidden behind the top half
                        if (uType > 2.5) {
                            vec2 e = vec2(d.x / 0.92, d.y / (uType > 4.5 ? 0.22 : 0.16));
                            float er = length(e);
                            float ring = smoothstep(0.55, 0.6, er) * (1.0 - smoothstep(0.96, 1.0, er));
                            ring *= 0.55 + 0.45 * sin(er * 46.0);
                            if (d.y > 0.0 && qq < 1.0) ring = 0.0;
                            col = mix(col, uRing * (0.6 + 0.4 * lit), ring * 0.85);
                            alpha = max(alpha, ring * 0.85);
                        }
                        // Soft atmosphere glow
                        float glow = exp(-max(0.0, qq - 1.0) * 6.0) * (1.0 - disc) * 0.35;
                        col += uColA * glow;
                        alpha = max(alpha, glow);
                    }
                    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }`
        }));
        this.sun.scale.setScalar(body.size);
        this.sun.renderOrder = -9;
        group.add(this.sun);

        // Mountain ridges around the horizon: dark silhouettes with a neon crest (none in space)
        const rnd0 = Track.seededRandom('ridge' + track.worldId);
        const ridgeColors = [new THREE.Color(pal.skyBottom).multiplyScalar(0.07), new THREE.Color(pal.skyBottom).multiplyScalar(0.14)];
        this.ridges = [];
        if (w !== 5) {
            [[210, 1.0], [170, 0.7]].forEach(([radius, hScale], layer) => {
                const n = 110;
                const pos = [];
                const idx = [];
                const crest = [];
                const f1 = 1 + rnd0() * 2, f2 = 5 + rnd0() * 4, f3 = 11 + rnd0() * 6;
                const o1 = rnd0() * 6, o2 = rnd0() * 6, o3 = rnd0() * 6;
                for (let k = 0; k <= n; k++) {
                    const a = (k / n) * Math.PI * 2;
                    const h = hScale * (18 + 14 * Math.sin(a * f1 + o1) + 9 * Math.sin(a * f2 + o2) + 4 * Math.sin(a * f3 + o3));
                    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
                    pos.push(x, -60, z, x, h, z);
                    crest.push(x, h, z);
                    if (k > 0) {
                        const b = (k - 1) * 2;
                        idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
                    }
                }
                const geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
                geo.setIndex(idx);
                const ridge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: ridgeColors[layer], fog: false, side: THREE.DoubleSide, depthWrite: false }));
                const line = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(crest, 3)),
                    new THREE.LineBasicMaterial({ color: layer === 0 ? pal.accent2 : pal.accent, fog: false, transparent: true, opacity: layer === 0 ? 0.45 : 0.7 }));
                ridge.renderOrder = -8 + layer;
                line.renderOrder = -8 + layer;
                group.add(ridge, line);
                this.ridges.push(ridge, line);
            });
        }

        this.buildTerrain(track, group, pal);
        this.buildProps(track, group, pal);
    }

    /**
     * Sculpted ground far below the run: rolling hills with glowing flora,
     * rippled dunes, cracked ice, black rock with lava in the hollows, or dark
     * crystal with violet fractures. One mesh, heights from the shared noise so
     * props can stand on it.
     */
    buildTerrain(track, group, pal) {
        let minY = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < track.count; i++) {
            minY = Math.min(minY, track.C[i * 3 + 1]);
            minX = Math.min(minX, track.C[i * 3]); maxX = Math.max(maxX, track.C[i * 3]);
            minZ = Math.min(minZ, track.C[i * 3 + 2]); maxZ = Math.max(maxZ, track.C[i * 3 + 2]);
        }
        const size = Math.max(maxX - minX, maxZ - minZ) + 900;
        const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
        this.groundY = minY - 45;
        const t = pal.terrain;
        // The ground in tiles (five by five), so the renderer culls the tiles
        // behind the camera and beyond the fog instead of drawing the whole
        // plain every frame
        const tilesN = 5, segs = 30, tileSize = size / tilesN;
        const tiles = [];
        for (let ty = 0; ty < tilesN; ty++) for (let tx = 0; tx < tilesN; tx++) {
            const geo = new THREE.PlaneGeometry(tileSize, tileSize, segs, segs);
            geo.rotateX(-Math.PI / 2);
            geo.translate((tx + 0.5 - tilesN / 2) * tileSize, 0, (ty + 0.5 - tilesN / 2) * tileSize);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
                pos.setY(i, Scene3D.terrainHeight(x, z, t));
            }
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            tiles.push(geo);
        }
        this.terrainMat = new THREE.ShaderMaterial({
            fog: true,
            uniforms: {
                uLow: { value: new THREE.Color(t.low) },
                uHigh: { value: new THREE.Color(t.high) },
                uGlow: { value: new THREE.Color(t.glow) },
                uSunDir: { value: new THREE.Vector3(0.3, 0.85, 0.4).normalize() },
                uWorld: { value: track.worldId },
                uTime: { value: 0 },
                uBaseY: { value: this.groundY },
                uAmp: { value: t.amp },
                fogColor: { value: new THREE.Color() },
                fogNear: { value: this.scene.fog.near },
                fogFar: { value: this.scene.fog.far }
            },
            vertexShader: `varying vec3 vP; varying vec3 vN;
                #include <fog_pars_vertex>
                void main(){
                    vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz;
                    vN = normalize(mat3(modelMatrix) * normal);
                    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
                    #include <fog_vertex>
                }`,
            fragmentShader: `uniform vec3 uLow, uHigh, uGlow, uSunDir; uniform float uWorld, uTime, uBaseY, uAmp; varying vec3 vP; varying vec3 vN;
                #include <fog_pars_fragment>
                vec2 hash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
                vec4 cells(vec2 x) {
                    vec2 n = floor(x), f = fract(x);
                    float f1 = 8.0, f2 = 8.0; vec2 id = n;
                    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
                        vec2 g = vec2(float(i), float(j));
                        vec2 r = g + hash2(n + g) - f;
                        float d = dot(r, r);
                        if (d < f1) { f2 = f1; f1 = d; id = n + g; } else if (d < f2) { f2 = d; }
                    }
                    return vec4(sqrt(f2) - sqrt(f1), sqrt(f1), id);
                }
                void main(){
                    vec3 n = normalize(vN);
                    float h = clamp((vP.y - uBaseY) / max(1.0, uAmp * 0.7), 0.0, 1.0);
                    float slope = 1.0 - n.y;
                    vec3 col = mix(uLow, uHigh, h);
                    float diff = 0.35 + 0.65 * max(0.0, dot(n, uSunDir));
                    col *= diff;
                    vec4 c = cells(vP.xz * 0.11);
                    float seam = 1.0 - smoothstep(0.0, 0.05, c.x);
                    if (uWorld < 1.5) {
                        float dots = 1.0 - smoothstep(0.0, 0.1, c.y);
                        col += uGlow * dots * (0.5 + 0.5 * sin(uTime * 2.0 + hash2(c.zw).x * 6.28)) * (1.0 - h * 0.6);
                        col = mix(col, col * vec3(0.8, 1.0, 0.8), slope);
                    } else if (uWorld < 2.5) {
                        float rip = 0.5 + 0.5 * sin(vP.x * 0.9 + vP.z * 0.4 + sin(vP.z * 0.15) * 3.0);
                        col *= 0.82 + 0.3 * rip * (1.0 - slope * 2.0);
                    } else if (uWorld < 3.5) {
                        col += uGlow * seam * 0.3;
                        col += vec3(0.1) * (1.0 - slope) * h;
                    } else if (uWorld < 4.5) {
                        float lava = 1.0 - smoothstep(0.03, 0.2, h);
                        float lavaN = 0.6 + 0.4 * sin(vP.x * 0.3 + uTime) * sin(vP.z * 0.27 - uTime * 0.7);
                        col = mix(col, uGlow * (0.7 + lavaN * 0.9), lava);
                        col += uGlow * seam * 0.45 * (1.0 - lava) * (1.0 - smoothstep(0.2, 0.5, h));
                    } else if (uWorld > 5.5) {
                        // The Grid: glowing lines every 12 m on a dark floor, pulsing slowly
                        vec2 gp = abs(fract(vP.xz / 12.0) - 0.5);
                        float gl = 1.0 - smoothstep(0.0, 0.04, min(gp.x, gp.y));
                        col = uLow * 0.5 + uGlow * gl * (0.55 + 0.45 * sin(uTime * 1.2 + (vP.x + vP.z) * 0.04));
                        col += uGlow * seam * 0.1;
                    } else {
                        col += uGlow * seam * 0.5 + uGlow * (1.0 - smoothstep(0.0, 0.04, c.y)) * 0.9;
                    }
                    // Fade into the fog colour long before the far edge
                    float dist = length(cameraPosition - vP);
                    gl_FragColor = vec4(col, 1.0);
                    #include <fog_fragment>
                    #include <tonemapping_fragment>
                    #include <colorspace_fragment>
                }`
        });
        for (const geo of tiles) {
            const ground = new THREE.Mesh(geo, this.terrainMat);
            ground.position.set(cx, this.groundY, cz);
            group.add(ground);
        }
        this.terrainCenter = [cx, cz];
    }

    /**
     * Props along the run, standing on the terrain: glowing mushrooms and
     * fern spires, monoliths and rocks, crystal spires and snow boulders,
     * basalt columns with molten tops, or asteroids and rings adrift in space.
     * A handful of instanced draws per world.
     */
    buildProps(track, group, pal) {
        const w = track.worldId;
        const rnd = Track.seededRandom('props' + track.level.id);
        const t = pal.terrain;
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const p = new THREE.Vector3();
        const sc = new THREE.Vector3();
        const eul = new THREE.Euler();
        // Spots beside the run: alternate sides, 14-50 m out
        const spots = [];
        for (let i = 16; i < track.count - 10; i += 11) {
            const side = (spots.length % 2 === 0 ? 1 : -1) * (rnd() < 0.8 ? 1 : -1);
            const off = 14 + rnd() * 36;
            const x = track.C[i * 3] + track.R[i * 3] * off * side;
            const z = track.C[i * 3 + 2] + track.R[i * 3 + 2] * off * side;
            const ty = track.C[i * 3 + 1];
            spots.push({ x, z, y: this.groundY + Scene3D.terrainHeight(x, z, t), ty, s: i * track.ds, r: rnd(), r2: rnd(), r3: rnd() });
        }
        this.propSpots = spots;
        const place = (mesh, k, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => {
            q.setFromEuler(eul.set(rx, ry, rz));
            mesh.setMatrixAt(k, m4.compose(p.set(x, y, z), q, sc.set(sx, sy, sz)));
        };
        const std = (color, emissive, k = 0.3, extra = {}) => new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(emissive), emissiveIntensity: k, roughness: 0.6, metalness: 0.1, ...extra });
        const n = spots.length;
        if (w === 1) {
            // Giant glowing mushrooms and fern spires
            const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), std('#1d6b45', pal.accent, 0.5), n);
            const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.4, 1, 7), std('#dfe9d2', '#88ffb0', 0.15), n);
            const ferns = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), std('#0f4a2a', pal.accent2, 0.25), n);
            spots.forEach((s, k) => {
                const hgt = 5 + s.r * 9, rad = 2 + s.r2 * 2.5;
                place(stems, k, s.x, s.y + hgt / 2, s.z, 1 + s.r2, hgt, 1 + s.r2);
                place(caps, k, s.x, s.y + hgt, s.z, rad, rad * 0.55, rad, 0, s.r3 * 6.28, 0);
                const fx = s.x + (s.r3 - 0.5) * 14, fz = s.z + (s.r - 0.5) * 14;
                const fh = 9 + s.r2 * 14;
                place(ferns, k, fx, this.groundY + Scene3D.terrainHeight(fx, fz, t) + fh / 2, fz, 1.6 + s.r * 1.4, fh, 1.6 + s.r * 1.4);
            });
            group.add(caps, stems, ferns);
        } else if (w === 2) {
            // Weathered monoliths and scattered rocks
            const mono = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std('#3a1d12', pal.accent, 0.12, { roughness: 0.9 }), n);
            const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std('#4a2a18', '#000000', 0, { roughness: 1 }), n);
            spots.forEach((s, k) => {
                const hgt = 10 + s.r * 20;
                place(mono, k, s.x, s.y + hgt / 2 - 1, s.z, 3 + s.r2 * 3, hgt, 3 + s.r3 * 3, (s.r - 0.5) * 0.25, s.r2 * 6.28, (s.r3 - 0.5) * 0.25);
                const rx = s.x + (s.r2 - 0.5) * 20, rz = s.z + (s.r3 - 0.5) * 20;
                const rs = 1.5 + s.r * 3;
                place(rocks, k, rx, this.groundY + Scene3D.terrainHeight(rx, rz, t) + rs * 0.4, rz, rs, rs * 0.7, rs, s.r * 3, s.r2 * 3, 0);
            });
            group.add(mono, rocks);
        } else if (w === 3) {
            // Crystal spires and snow boulders
            const spires = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), std('#9fe8ff', '#5ee7ff', 0.55, { transparent: true, opacity: 0.85, roughness: 0.2 }), n * 2);
            const boulders = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std('#dfeeff', '#8fb8ff', 0.08, { roughness: 0.9 }), n);
            spots.forEach((s, k) => {
                const hgt = 8 + s.r * 16;
                place(spires, k * 2, s.x, s.y + hgt * 0.5, s.z, 2 + s.r2 * 2, hgt, 2 + s.r2 * 2, (s.r - 0.5) * 0.3, s.r3 * 3, (s.r2 - 0.5) * 0.3);
                const h2 = 4 + s.r3 * 8;
                place(spires, k * 2 + 1, s.x + (s.r2 - 0.5) * 8, s.y + h2 * 0.5, s.z + (s.r3 - 0.5) * 8, 1.2 + s.r * 1.2, h2, 1.2 + s.r * 1.2, 0, s.r * 3, (s.r - 0.5) * 0.5);
                const bx = s.x + (s.r3 - 0.5) * 24, bz = s.z + (s.r - 0.5) * 24;
                const bs = 2 + s.r2 * 3;
                place(boulders, k, bx, this.groundY + Scene3D.terrainHeight(bx, bz, t) + bs * 0.4, bz, bs, bs * 0.8, bs, s.r * 3, s.r2 * 3, 0);
            });
            group.add(spires, boulders);
        } else if (w === 4) {
            // Basalt columns with molten tops
            const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), std('#1a0c0a', '#3a0a06', 0.3, { roughness: 0.95 }), n * 2);
            const tops = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 0.4, 6), new THREE.MeshBasicMaterial({ color: pal.accent2 }), n * 2);
            spots.forEach((s, k) => {
                for (let j = 0; j < 2; j++) {
                    const x = s.x + (j ? (s.r2 - 0.5) * 12 : 0), z = s.z + (j ? (s.r3 - 0.5) * 12 : 0);
                    const base = this.groundY + Scene3D.terrainHeight(x, z, t);
                    const hgt = (j ? 6 : 10) + s.r * 16;
                    const rad = 2 + (j ? s.r3 : s.r2) * 1.5;
                    place(cols, k * 2 + j, x, base + hgt / 2, z, rad, hgt, rad, 0, s.r * 1.0, 0);
                    place(tops, k * 2 + j, x, base + hgt + 0.2, z, rad * 0.9, 1, rad * 0.9, 0, s.r * 1.0, 0);
                }
            });
            group.add(cols, tops);
        } else if (w === 6) {
            // A city of light: dark towers with glowing crowns and lit edges, data rings adrift above
            const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std('#050d1c', pal.accent, 0.1, { roughness: 0.35, metalness: 0.7 }), n * 2);
            const crowns = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: pal.accent2 }), n * 2);
            const edges = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.85 }), n * 2);
            const ringItems = [];
            spots.forEach((s, k) => {
                for (let j = 0; j < 2; j++) {
                    const x = s.x + (j ? (s.r2 - 0.5) * 30 : 0), z = s.z + (j ? (s.r3 - 0.5) * 30 : 0);
                    const base = this.groundY + Scene3D.terrainHeight(x, z, t);
                    const hgt = (j ? 10 : 18) + (j ? s.r3 : s.r) * 44;
                    const wd = 4 + (j ? s.r : s.r2) * 7;
                    place(towers, k * 2 + j, x, base + hgt / 2, z, wd, hgt, wd);
                    place(crowns, k * 2 + j, x, base + hgt + 0.3, z, wd * 1.04, 0.5, wd * 1.04);
                    // A lit strip up one edge
                    place(edges, k * 2 + j, x + wd / 2, base + hgt / 2, z + wd / 2, 0.25, hgt, 0.25);
                }
                if (k % 3 === 0) ringItems.push(s);
            });
            const ringMat = new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
            this.instancedChunks(group, new THREE.TorusGeometry(1, 0.05, 4, 32), ringMat, ringItems, (s, m4) => {
                const rr = 6 + s.r2 * 9;
                q.setFromEuler(eul.set(Math.PI / 2 + (s.r - 0.5) * 0.6, 0, (s.r2 - 0.5) * 0.6));
                m4.compose(p.set(s.x + (s.r - 0.5) * 20, s.ty + 10 + (s.r3 - 0.5) * 30, s.z), q, sc.set(rr, rr, rr));
            }, { chunkLen: 300 });
            group.add(towers, crowns, edges);
        } else {
            // Asteroids and drifting rings around the run
            const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std('#1a0f2e', '#7c8cff', 0.25, { roughness: 0.8, flatShading: true }), n);
            const ringItems = [];
            spots.forEach((s, k) => {
                const y = s.ty + (s.r - 0.5) * 50;
                const rs = 3 + s.r2 * 7;
                place(rocks, k, s.x, y, s.z, rs, rs * (0.7 + s.r3 * 0.5), rs, s.r * 6, s.r2 * 6, s.r3 * 6);
                if (k % 4 === 0) ringItems.push(s);
            });
            const ringMat = new THREE.MeshBasicMaterial({ color: pal.accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
            this.instancedChunks(group, new THREE.TorusGeometry(1, 0.08, 4, 28), ringMat, ringItems, (s, m4) => {
                const ry = s.ty + (s.r3 - 0.5) * 40;
                const rr = 8 + s.r2 * 10;
                q.setFromEuler(eul.set(s.r * 3, s.r2 * 3, 0));
                m4.compose(p.set(s.x + (s.r - 0.5) * 30, ry, s.z), q, sc.set(rr, rr, rr));
            }, { chunkLen: 300 });
            group.add(rocks);
        }
    }
    // ------------------------------------------------------------------
    // Per-frame
    // ------------------------------------------------------------------

    playIntro(duration = 1.8) {
        this.cam.intro = { t: 0, duration };
    }

    skipIntro() {
        this.cam.intro = null;
    }

    get introActive() {
        return !!this.cam.intro;
    }

    addShake(amount) {
        this.cam.trauma = Math.min(1, this.cam.trauma + amount);
    }

    /**
     * state: { pos (Vector3 marble), quat (marble rotation), frame (track frame at camera s),
     *          speed, dt, pulse, clock, ghost (Vector3|null), obstacles clock info }
     */
    update(state) {
        const dt = state.dt;
        this.time += dt;
        const track = this.track;
        const pal = this.palette;

        // Marble (hidden from inside in POV: the camera sits at its centre)
        const pov = state.cameraMode === 'pov' && !this.cam.intro;
        this.marble.position.copy(state.pos);
        this.marble.quaternion.copy(state.quat);
        this.marble.visible = state.marbleVisible && !pov;
        this.marbleGlow.visible = state.marbleVisible && !pov;
        this.marbleGlow.position.copy(state.pos);
        const ag = this.abilityGlow;
        this.marbleGlow.scale.setScalar((2.0 + Math.min(1.2, state.speed / 25)) * (ag ? 1.6 : 1));
        if (ag) this.marbleGlow.material.color.copy(ag);
        else if (this.glowColor) this.marbleGlow.material.color.copy(this.glowColor);
        this.marbleLight.position.set(state.pos.x, state.pos.y + 1.6, state.pos.z);
        this.marbleLight.intensity = state.marbleVisible ? 4 + state.pulse * 5 + (ag ? 4 : 0) : 0;
        // Finishes that glow (circuit, molten, galaxy, frost) breathe with the beat
        const fg = this.marbleMaterial.userData.glow;
        if (fg) this.marbleMaterial.emissiveIntensity = fg.base + fg.beat * state.pulse + fg.twinkle * (0.5 + 0.5 * Math.sin(this.time * 7));
        for (const fn of this.forceAnims || []) fn(dt);

        if (state.rival) {
            this.rivalMesh.visible = true;
            this.rivalMesh.position.copy(state.rival.pos);
        } else {
            this.rivalMesh.visible = false;
        }
        if (state.ghost) {
            this.ghost.visible = true;
            this.ghost.position.copy(state.ghost);
        } else {
            this.ghost.visible = false;
        }
        // The house racers: coloured marbles with a halo, one mesh each
        const racers = state.racers || [];
        this.racerMeshes = this.racerMeshes || [];
        while (this.racerMeshes.length < racers.length) {
            const rr = this.marble.geometry.parameters.radius;
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(rr, 20, 14), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.92 }));
            const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 }));
            glow.scale.setScalar(2.2);
            mesh.add(glow);
            mesh.visible = false;
            this.scene.add(mesh);
            this.racerMeshes.push(mesh);
        }
        this.racerMeshes.forEach((mesh, k) => {
            const r = racers[k];
            mesh.visible = !!r;
            if (!r) return;
            mesh.position.copy(r.pos);
            if (mesh.userData.color !== r.color) {
                mesh.userData.color = r.color;
                mesh.material.color.set(r.color).lerp(new THREE.Color('#ffffff'), 0.35);
                mesh.material.emissive.set(r.color);
                mesh.children[0].material.color.set(r.color);
            }
            mesh.rotation.x += dt * 6;
        });

        this.marbleFX.update({
            dt, pos: state.pos, normal: state.surfaceNormal || [0, 1, 0], camPos: this.camera.position,
            visible: state.marbleVisible, showAura: !pov, speed: state.speed, pulse: state.pulse, renderer: this.renderer
        });

        // The light show follows the drops in and out
        this.dropLevel = (this.dropLevel || 0) + ((state.drop || 0) - (this.dropLevel || 0)) * (1 - Math.exp(-dt * 3));
        const beatAge = state.pulse > 0.001 ? -Math.log(state.pulse) / 7 : 9;
        // Beat pulse on the neon
        if (this.pipeUniforms) {
            const u = this.pipeUniforms;
            u.uTime.value = this.time;
            u.uPulse.value = state.pulse;
            u.uDrop.value = this.dropLevel;
            u.uBeatAge.value = beatAge;
            u.uBeatLen.value = state.beatLength || 0.47;
            u.uMarbleS.value = state.trackS || 0;
            u.uFlash.value = Math.max(state.dropFlash || 0, u.uFlash.value * Math.exp(-dt * 6));
            this.chevron.offset.y = (this.chevron.offset.y + dt * 2.5) % 1;
        }

        // Shadow and underglow on the surface below the marble
        if (state.surface) {
            const sp = state.surface, sn = state.surfaceNormal, h = Math.max(0, state.height || 0);
            this._sv = this._sv || new THREE.Vector3();
            const lookTarget = this._sv.set(sp[0] + sn[0], sp[1] + sn[1], sp[2] + sn[2]);
            for (const d of [this.shadow, this.underglow]) {
                d.visible = state.marbleVisible && !(pov && d === this.shadow);
                d.position.set(sp[0] + sn[0] * 0.03, sp[1] + sn[1] * 0.03, sp[2] + sn[2] * 0.03);
                d.lookAt(lookTarget);
            }
            this.shadow.scale.setScalar(1.5 + h * 0.6);
            this.shadow.material.opacity = 0.9 / (1 + h * 0.9);
            this.underglow.scale.setScalar(2.6 + Math.min(1.2, state.speed / 25));
            this.underglow.material.opacity = (0.16 + state.pulse * 0.14) / (1 + h * 0.5);
        } else {
            this.shadow.visible = false;
            this.underglow.visible = false;
        }

        // Mirror image on the glossy surface, fading as the marble rises
        if (state.surface && state.marbleVisible && !pov && (state.height || 0) < 3) {
            const sp = state.surface, sn = state.surfaceNormal;
            const d = (state.height || 0) + this.marbleRadius;
            this.mirror.visible = true;
            this.mirror.position.set(sp[0] - sn[0] * d, sp[1] - sn[1] * d, sp[2] - sn[2] * d);
            this.mirror.quaternion.copy(state.quat);
            this.mirror.material.opacity = 0.32 / (1 + (state.height || 0) * 0.8);
        } else {
            this.mirror.visible = false;
        }

        // High combo: sparks orbit the marble
        const mult = state.combo ? state.combo.multiplier : 1;
        for (let i = 0; i < this.orbiters.length; i++) {
            const o = this.orbiters[i];
            const on = state.marbleVisible && !pov && (ag || (mult >= 3 && (mult >= 4 || i < 2)));
            o.visible = on;
            if (!on) continue;
            o.material.color.copy(ag || this.glowColor || o.material.color);
            const a = this.time * 5 + (i / this.orbiters.length) * Math.PI * 2;
            o.position.set(state.pos.x + Math.cos(a) * 1.1, state.pos.y + Math.sin(a * 1.3) * 0.5, state.pos.z + Math.sin(a) * 1.1);
            o.scale.setScalar(0.3 + 0.15 * Math.sin(this.time * 9 + i));
        }

        this.updateFx(dt);
        for (const rod of this.spinners) {
            const o = rod.userData.o;
            this.surfaceQuaternion(track, o.s, 0, rod.quaternion);
            this._spinQ = this._spinQ || new THREE.Quaternion();
            this._axisZ = this._axisZ || new THREE.Vector3(0, 0, 1);
            // Local x = R, y = U, z = -T: a turn of `-angle` about z puts an end of the rod at phi = angle
            rod.quaternion.multiply(this._spinQ.setFromAxisAngle(this._axisZ, -track.spinnerAngle(o, state.clock, state.beatLength)));
        }

        // Moving pieces
        for (const m of this.movers) {
            const o = m.userData.o;
            const phi = track.obstaclePhi(o, state.clock, state.beatLength);
            const p = track.point(o.s, phi, o.h / 2);
            m.position.set(p[0], p[1], p[2]);
            this.surfaceQuaternion(track, o.s, phi, m.quaternion);
        }
        for (const b of this.lasers) {
            const level = track.laserLevel(b.userData.o, state.clock, state.beatLength);
            b.material.opacity = level;
            b.userData.halo.material.opacity = level * 0.3;
            b.visible = level > 0.01;
            b.userData.halo.visible = level > 0.01;
        }
        this._rollQ = this._rollQ || new THREE.Quaternion();
        this._axisX = this._axisX || new THREE.Vector3(1, 0, 0);
        for (const b of this.barrels) {
            const o = b.userData.o;
            const sNow = track.obstacleS(o, state.clock);
            const p = track.point(sNow, 0, o.radius);
            b.position.set(p[0], p[1], p[2]);
            // Axis across the pipe; roll about it as the barrel travels up the chute
            this.surfaceQuaternion(track, sNow, 0, b.quaternion);
            b.quaternion.multiply(this._rollQ.setFromAxisAngle(this._axisX, (-sNow / o.radius) % (Math.PI * 2)));
        }
        for (const m of this.mines) {
            m.rotation.x += dt * 1.7;
            m.rotation.y += dt * 2.3;
        }
        if (this.coinMesh && this.coinMesh.count) this.updateCoins(this.time, state.trackS);

        this.updateParticles(dt);
        this.updateCamera(state);
        this.updateDust(dt);
        if (this.pipeUniforms) this.pipeUniforms.uMarblePos.value.copy(state.pos);
        if (this.post) {
            const u = this.post.composite.uniforms;
            u.uSpeed.value = Math.min(1, Math.max(0, (state.speed - 22) / 26)) + this.boostT * 0.8;
            u.uTime.value = this.time;
            u.uFlash.value = state.dropFlash || 0;
            // The drops push the bloom
            u.uStrength.value = 1 + (state.dropFlash || 0) * 0.5 + (this.dropLevel || 0) * 0.15;
            this.updateRays();
            this.updateFlare();
        }

        // Sky elements follow the camera
        this.sky.position.copy(this.camera.position);
        if (this.clouds) { this.clouds.material.uniforms.uTime.value = this.time; this.clouds.material.uniforms.uCam.value.copy(this.camera.position); }
        if (this.gates) { const gu = this.gates.material.uniforms; gu.uMarbleS.value = state.trackS || 0; gu.uPulse.value = state.pulse || 0; gu.uDrop.value = this.dropLevel || 0; }
        const su = this.sky.material.uniforms;
        su.uTime.value = this.time;
        su.uFlash.value = state.dropFlash || 0;
        su.uDrop.value = this.dropLevel || 0;
        su.uPulse.value = state.pulse || 0;
        this.lastPulse = state.pulse || 0;
        this.marbleS = state.trackS || 0;
        // The sky drifts over the run: the top deepens, the horizon warms toward
        // the world's second colour, and the body sinks toward the horizon
        if (this.skyBase && track) {
            const prog = Math.max(0, Math.min(1, (state.trackS || 0) / Math.max(1, track.finishS)));
            const b = this.skyBase, k = prog * 0.85;
            su.top.value.copy(b.top).multiplyScalar(1 - 0.45 * k);
            su.mid.value.copy(b.mid).lerp(b.accent2, 0.3 * k);
            su.bottom.value.copy(b.bottom).multiplyScalar(1 - 0.3 * k);
            this.skyDrift = prog;
        }
        this.updateSkyEvents(state.dt || 0, su);
        this.updateBeams(state);
        this.stars.position.copy(this.camera.position);
        for (const r of this.ridges) r.position.set(this.camera.position.x, this.camera.position.y - 30, this.camera.position.z);
        this.sun.quaternion.copy(this.camera.quaternion);
        const f0 = track.frame(0);
        this.sun.position.set(
            this.camera.position.x + (-f0.T[0]) * -0 + 0,
            this.camera.position.y + 40,
            this.camera.position.z
        );
        // Place the sun ahead, along the run's overall direction. track.frame()
        // hands back one shared object, so the start is copied out before the
        // end is read (reading both through it put the body over the camera)
        if (!this.runDir) {
            const x0 = f0.C[0], z0 = f0.C[2];
            const fe = track.frame(track.length - 1);
            const dirX = fe.C[0] - x0, dirZ = fe.C[2] - z0;
            const dl = Math.hypot(dirX, dirZ) || 1;
            this.runDir = [dirX / dl, dirZ / dl];
        }
        this.sun.position.x += this.runDir[0] * 220;
        this.sun.position.z += this.runDir[1] * 220;
        this.sun.position.y = this.camera.position.y + (this.palette.body ? this.palette.body.height : 2) - 9 * (this.skyDrift || 0);
        this.sun.material.uniforms.uTime.value = this.time;
        if (this.terrainMat) this.terrainMat.uniforms.uTime.value = this.time;

        this.renderFrame();
        this.drawOverlay(state);
    }

    /**
     * Cinematic shots. The camera cuts away from the marble's shoulder to a
     * fixed trackside view that tracks it, like a trackside TV camera at a
     * roller coaster, then cuts back:
     *   loop    beside the loop, level with its centre, the marble going over the top
     *   helix   outside the tower, high, the marble spiralling down round the column
     *   plunge  at the brink, looking down the shaft the marble drops away into
     *   kicker  beside the chasm, the marble flying past the camera
     *   cliff   beside the crest, the marble sailing off it and falling away
     *   finish  orbiting the marble as it coasts through the finish
     * kind, the section (or null), and a duration in seconds (0: until endCine)
     */
    startCine(kind, sec, dur = 0) {
        const track = this.track;
        if (!track) return;
        const pos = new THREE.Vector3();
        let fov = 50, look = null;
        const f = track.frame(kind === 'kicker' ? sec.tip : kind === 'cliff' ? sec.crest : sec ? sec.s0 : 0);
        const C = [...f.C], T = [...f.T], R = [...f.R], U = [...f.U];
        if (kind === 'loop') {
            const mid = track.frame((sec.s0 + sec.s1) / 2);
            const cx = (C[0] + mid.C[0]) / 2, cy = (C[1] + mid.C[1]) / 2, cz = (C[2] + mid.C[2]) / 2;
            pos.set(cx + R[0] * 30, cy + 2, cz + R[2] * 30);
            fov = 46;
        } else if (kind === 'helix') {
            // Outside the spiral, high enough to see the tower with the marble on it
            pos.set(C[0] + R[0] * sec.dir * 24 + T[0] * 10, C[1] + 14, C[2] + R[2] * sec.dir * 24 + T[2] * 10);
            fov = 58;
        } else if (kind === 'plunge') {
            pos.set(C[0] + U[0] * 4.5 - T[0] * 2 + R[0] * 2.2, C[1] + U[1] * 4.5 - T[1] * 2, C[2] + U[2] * 4.5 - T[2] * 2 + R[2] * 2.2);
            fov = 62;
        } else if (kind === 'kicker') {
            pos.set(C[0] + R[0] * 15 + T[0] * 14, C[1] + 6, C[2] + R[2] * 15 + T[2] * 14);
            fov = 52;
        } else if (kind === 'cliff') {
            pos.set(C[0] + R[0] * 18 - T[0] * 4, C[1] + 9, C[2] + R[2] * 18 - T[2] * 4);
            fov = 50;
        } else if (kind === 'finish') {
            fov = 56;
        } else return;
        // A trackside camera must stand in clear air: not inside a prop, not under
        // the ground, not inside another part of the chute. Try the far side of
        // the chute if the first is blocked, and skip the shot if both are
        if (kind !== 'finish') {
            const sideOf = (pos) => {
                const dx = pos.x - C[0], dz = pos.z - C[2];
                return Math.sign(dx * R[0] + dz * R[2]) || 1;
            };
            const mirror = (pos) => {
                const side = sideOf(pos);
                const d = (pos.x - C[0]) * R[0] + (pos.z - C[2]) * R[2];
                return pos.clone().addScaledVector(new THREE.Vector3(R[0], 0, R[2]), -2 * d);
            };
            if (!this.clearAir(pos)) {
                const alt = mirror(pos);
                if (this.clearAir(alt)) pos.copy(alt); else return;
            }
        }
        this.cine = { kind, t: 0, dur, pos, fov, look: new THREE.Vector3(), a0: Math.random() * 6.28, started: false };
    }

    /** True when a camera could stand here: above the ground, away from props, the chute and the billboards */
    clearAir(pos) {
        const track = this.track;
        if (!track) return false;
        const pal = this.palette;
        const ground = (this.groundY || -1e9) + (pal && pal.terrain ? Scene3D.terrainHeight(pos.x, pos.z, pal.terrain) : 0);
        if (pos.y < ground + 6) return false;
        for (const sp of this.propSpots || []) {
            const dx = sp.x - pos.x, dz = sp.z - pos.z;
            if (dx * dx + dz * dz < 18 * 18 && pos.y < sp.y + 70) return false;
        }
        for (let i = 0; i < track.count; i += 3) {
            const dx = track.C[i * 3] - pos.x, dy = track.C[i * 3 + 1] - pos.y, dz = track.C[i * 3 + 2] - pos.z;
            if (dx * dx + dy * dy + dz * dz < 7 * 7) return false;
        }
        return true;
    }

    endCine() {
        if (!this.cine) return;
        this.cine = null;
        // The chase camera snaps back to its place instead of flying across the scene
        this._snapNext = true;
    }

    /** Drive the camera for the shot in progress; true while it holds it */
    updateCine(state) {
        const c = this.cine;
        if (!c) return false;
        c.t += state.dt;
        if (c.dur && c.t >= c.dur) { this.endCine(); return false; }
        const look = c.look;
        if (c.kind === 'finish') {
            // Orbit the marble from above the chute like a drone, climbing as the results come
            const a = c.a0 + c.t * 0.8;
            const r = 8.5 + c.t * 0.8, h = 5.2 + c.t * 1.0;
            c.pos.set(state.pos.x + Math.cos(a) * r, state.pos.y + h, state.pos.z + Math.sin(a) * r);
            look.copy(state.pos);
            look.y += 0.4;
        } else {
            // Track the marble, with a little lead so it stays off-centre in the direction it travels
            look.copy(state.pos);
            if (!c.started) { this.camera.position.copy(c.pos); c.started = true; }
        }
        const k = 1 - Math.exp(-state.dt * (c.kind === 'finish' ? 10 : 7));
        this.camera.position.lerp(c.pos, c.kind === 'finish' ? k : 1);
        this.cam.look.lerp(look, c.started && c.t > 0.05 ? k : 1);
        this.cam.up.set(0, 1, 0);
        this.camera.up.copy(this.cam.up);
        this.camera.lookAt(this.cam.look);
        this.cam.pos.copy(this.camera.position);
        this.cam.fov += (c.fov - this.cam.fov) * (1 - Math.exp(-state.dt * 6));
        if (Math.abs(this.camera.fov - this.cam.fov) > 0.05) { this.camera.fov = this.cam.fov; this.camera.updateProjectionMatrix(); }
        return true;
    }

    updateCamera(state) {
        const cam = this.cam;
        const f = state.camFrame;
        const dt = state.dt;
        if (!this._cv) {
            this._cv = { T: new THREE.Vector3(), up: new THREE.Vector3(), worldUp: new THREE.Vector3(0, 1, 0), target: new THREE.Vector3(), look: new THREE.Vector3(), high: new THREE.Vector3(), far: new THREE.Vector3(), anchor: new THREE.Vector3() };
        }
        const cv = this._cv;
        if (this.cine && this.updateCine(state)) return;
        if (state.attract) { this.updateFlyCamera(state); return; }
        if (state.cameraMode === 'pov' && !cam.intro) {
            this.updatePovCamera(state);
            return;
        }
        const T = cv.T.set(f.T[0], f.T[1], f.T[2]);
        // Inside a closed tube (spiral funnel) the camera must stay within the
        // walls and corkscrew with them; elsewhere it keeps a little of the bank
        // so turns feel like turns, but stays mostly level
        const inLoop = f.force === Scene3D.LOOP_ID;
        const tubeK = inLoop ? 0 : Math.min(1, Math.max(0, (Math.min(f.wallL, f.wallR) - 1.85) / (Math.PI - 1.85)));
        // Round a loop the camera goes over with the track: up is the floor's own up
        const up = cv.up.set(f.U[0], f.U[1], f.U[2]).lerp(cv.worldUp, inLoop ? 0 : 0.65).normalize();
        if (tubeK > 0) {
            // In the tube "up" is from the marble toward the tube's axis: the
            // camera then sits inside the walls whichever way the floor has turned
            const R = this.track ? this.track.radius : 3;
            cv.tubeUp = cv.tubeUp || new THREE.Vector3();
            cv.tubeUp.set(f.C[0] + f.U[0] * R - state.pos.x, f.C[1] + f.U[1] * R - state.pos.y, f.C[2] + f.U[2] * R - state.pos.z).normalize();
            up.lerp(cv.tubeUp, tubeK).normalize();
        }

        // Follow the marble, but pulled toward the middle of the chute so the
        // half-pipe stays framed, and so a marble sliding up the outside wall
        // of a bend is seen climbing it
        const anchor = cv.anchor.set(
            f.C[0] + f.U[0] * 0.55 + f.T[0], f.C[1] + f.U[1] * 0.55 + f.T[1], f.C[2] + f.U[2] * 0.55 + f.T[2]
        ).lerp(state.pos, 0.5);

        // Behind and above the marble, looking down the plunge ahead of it so
        // the chute dives away below the horizon
        const speed = state.speed;
        const dist = (6.4 + Math.min(2.2, speed * 0.035)) * (1 - tubeK * 0.15);
        const height = (4.4 + Math.min(1.0, speed * 0.016)) * (1 - tubeK) + 1.8 * tubeK;
        const target = cv.target.copy(anchor).addScaledVector(T, -dist).addScaledVector(up, height);
        const look = cv.look.copy(anchor).addScaledVector(T, 8 + Math.min(6, speed * 0.1)).addScaledVector(up, 0.6 - tubeK * 0.4);

        if (cam.intro) {
            // Swoop from high above the course down to the chase position
            cam.intro.t += dt;
            const k = Math.min(1, cam.intro.t / cam.intro.duration);
            const e = 1 - Math.pow(1 - k, 3);
            const high = cv.high.copy(state.pos).addScaledVector(T, 40);
            high.y += 30;
            target.lerpVectors(high, target, e);
            look.lerpVectors(cv.far.copy(state.pos).addScaledVector(T, 60), look, e);
            if (k >= 1) cam.intro = null;
            cam.pos.copy(target);
            cam.look.copy(look);
            cam.up.copy(up);
        } else if (state.snap || this._snapNext) {
            this._snapNext = false;
            cam.pos.copy(target);
            cam.look.copy(look);
            cam.up.copy(up);
        } else {
            const kp = 1 - Math.exp(-dt * (state.inAir ? 5 : inLoop ? 14 : 9));
            const kl = 1 - Math.exp(-dt * (inLoop ? 16 : 12));
            cam.pos.lerp(target, kp);
            cam.look.lerp(look, kl);
            cam.up.lerp(up, 1 - Math.exp(-dt * (inLoop ? 12 : 4))).normalize();
        }

        // Trauma shake
        cam.trauma = Math.max(0, cam.trauma - dt * 1.6);
        const shake = cam.trauma * cam.trauma;
        this.camera.position.copy(cam.pos);
        if (shake > 0.001) {
            this.camera.position.x += (Math.random() * 2 - 1) * shake * 0.6;
            this.camera.position.y += (Math.random() * 2 - 1) * shake * 0.6;
        }
        this.camera.up.copy(cam.up);
        this.camera.lookAt(cam.look);

        const fov = 66 + Math.min(18, speed * 0.34) + this.boostT * 10;
        cam.fov += (fov - cam.fov) * (1 - Math.exp(-dt * 4));
        // In the drops the view kicks with the beat (after the smoothing, so it stays sharp)
        const shown = cam.fov + (state.pump || 0) * 1.6;
        if (Math.abs(this.camera.fov - shown) > 0.05) {
            this.camera.fov = shown;
            this.camera.updateProjectionMatrix();
        }
    }

    /** Attract mode: a smooth flight down the chute a little above its floor, looking well ahead */
    updateFlyCamera(state) {
        const track = this.track, cam = this.cam, dt = state.dt;
        const fv = this._fly || (this._fly = { pos: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(), t: 0 });
        fv.t += dt;
        const s = state.trackS || 0;
        const f = track.frame(s);
        const sway = Math.sin(fv.t * 0.5) * 0.9;
        fv.pos.set(
            f.C[0] + f.U[0] * 3.4 - f.T[0] * 2 + f.R[0] * sway,
            f.C[1] + f.U[1] * 3.4 - f.T[1] * 2 + f.R[1] * sway,
            f.C[2] + f.U[2] * 3.4 - f.T[2] * 2 + f.R[2] * sway
        );
        fv.up.set(f.U[0], f.U[1], f.U[2]).lerp(this._cv.worldUp, 0.5).normalize();
        const g = track.frame(Math.min(track.length - 1, s + 20));
        fv.look.set(g.C[0] + g.U[0] * 1.2, g.C[1] + g.U[1] * 1.2, g.C[2] + g.U[2] * 1.2);
        if (state.snap) { cam.pos.copy(fv.pos); cam.look.copy(fv.look); cam.up.copy(fv.up); }
        else {
            cam.pos.lerp(fv.pos, 1 - Math.exp(-dt * 5));
            cam.look.lerp(fv.look, 1 - Math.exp(-dt * 4));
            cam.up.lerp(fv.up, 1 - Math.exp(-dt * 3)).normalize();
        }
        this.camera.position.copy(cam.pos);
        this.camera.up.copy(cam.up);
        this.camera.lookAt(cam.look);
        cam.fov += (74 - cam.fov) * (1 - Math.exp(-dt * 3));
        if (Math.abs(this.camera.fov - cam.fov) > 0.05) { this.camera.fov = cam.fov; this.camera.updateProjectionMatrix(); }
    }

    /**
     * Marble POV: the camera sits inside the marble and looks where it is
     * going. The chute surface under it leans the view into walls and banks;
     * the horizon lock takes most of that lean out, and at low speed the view
     * settles level either way so a slow roll never tumbles. With the lock
     * off, the marble's spin leaks through as a slow rock of the picture.
     */
    updatePovCamera(state) {
        const cam = this.cam, dt = state.dt, f = state.camFrame;
        const pv = this._pv || (this._pv = {
            fwd: new THREE.Vector3(), up: new THREE.Vector3(), tmp: new THREE.Vector3(), n: new THREE.Vector3(),
            level: new THREE.Vector3(0, 1, 0), init: false
        });
        const speed = state.speed;
        const v = state.vel;
        const fwd = pv.tmp;
        if (v && speed > 3) fwd.set(v[0], v[1], v[2]).normalize();
        else fwd.set(f.T[0], f.T[1], f.T[2]);
        const sn = state.surfaceNormal;
        const n = sn ? pv.n.set(sn[0], sn[1], sn[2]) : pv.n.set(f.U[0], f.U[1], f.U[2]);
        const stab = Math.min(1, Math.max(0, (speed - 4) / 8));
        const inLoop = f.force === Scene3D.LOOP_ID;
        const lean = inLoop ? 1 : (state.povHorizon ? 0.15 : 0.9) * stab;
        const up = n.lerp(pv.level, 1 - lean).normalize();
        if (!pv.init || state.snap) {
            pv.fwd.copy(fwd);
            pv.up.copy(up);
            pv.init = true;
        }
        pv.fwd.lerp(fwd, 1 - Math.exp(-dt * 9)).normalize();
        pv.up.lerp(up, 1 - Math.exp(-dt * (inLoop ? 14 : state.povHorizon ? 7 : 3.5))).normalize();
        const sway = state.povHorizon ? 0 : Math.sin(this.time * 1.9) * 0.04 * stab;

        cam.pos.copy(state.pos).addScaledVector(pv.up, 0.1);
        cam.look.copy(cam.pos).addScaledVector(pv.fwd, 10).addScaledVector(pv.up, 1.1);
        cam.up.copy(pv.up);
        if (sway) cam.up.applyAxisAngle(pv.fwd, sway);

        cam.trauma = Math.max(0, cam.trauma - dt * 1.6);
        const shake = cam.trauma * cam.trauma * 0.25;
        this.camera.position.copy(cam.pos);
        if (shake > 0.001) {
            this.camera.position.x += (Math.random() * 2 - 1) * shake;
            this.camera.position.y += (Math.random() * 2 - 1) * shake;
        }
        this.camera.up.copy(cam.up);
        this.camera.lookAt(cam.look);

        const fov = 86 + Math.min(14, speed * 0.28) + this.boostT * 8;
        cam.fov += (fov - cam.fov) * (1 - Math.exp(-dt * 4));
        // In the drops the view kicks with the beat (after the smoothing, so it stays sharp)
        const shown = cam.fov + (state.pump || 0) * 1.2;
        if (Math.abs(this.camera.fov - shown) > 0.05) {
            this.camera.fov = shown;
            this.camera.updateProjectionMatrix();
        }
    }

    // ------------------------------------------------------------------
    // 2D overlay: banners, hints, combo, flashes, speed lines, popups
    // ------------------------------------------------------------------

    drawOverlay(state) {
        const ctx = this.octx;
        const w = this.width;
        const h = this.height;
        const dt = state.dt;
        // Skip the full-screen clear on frames where there is nothing to show
        const busy = ((state.speed > 32 || this.boostT > 0) && this.quality !== 'low') || state.dropFlash > 0.02 || this.flash > 0.01 ||
            this.popups.length || (state.combo && state.combo.count >= 2) || this.banner || state.hint || state.rival || (state.racers && state.racers.length);
        if (!busy && !this.overlayDirty) return;
        this.overlayDirty = !!busy;
        ctx.clearRect(0, 0, w, h);
        if (!busy) return;

        // Speed lines from the edges (strong burst while boosting)
        if ((state.speed > 32 || this.boostT > 0) && this.quality !== 'low') {
            const s = Math.min(1, Math.max((state.speed - 32) / 25, this.boostT * 1.3));
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = s * 0.25;
            ctx.beginPath();
            for (let i = 0; i < 22; i++) {
                const a = (i / 22) * Math.PI * 2 + Math.floor(this.time * 24) * 0.37 * (i % 3);
                const r0 = Math.max(w, h) * (0.42 + ((i * 37) % 10) / 60);
                const r1 = r0 + 40 + s * 80;
                ctx.moveTo(w / 2 + Math.cos(a) * r0, h * 0.45 + Math.sin(a) * r0);
                ctx.lineTo(w / 2 + Math.cos(a) * r1, h * 0.45 + Math.sin(a) * r1);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }

        if (state.dropFlash > 0.02) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = state.dropFlash * 0.35;
            ctx.fillStyle = this.palette.accent;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
        if (this.flash > 0.01) {
            ctx.globalAlpha = this.flash * 0.55;
            ctx.fillStyle = '#ff2e63';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
            this.flash *= Math.exp(-dt * 6);
        }

        // World-space popups
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Names floating over the rivals' marbles: a friend's ghost, and the house racers
        const labelled = [];
        if (state.rival) labelled.push({ pos: state.rival.pos, name: state.rival.name, color: '#ffc27a' });
        for (const r of state.racers || []) labelled.push(r);
        for (const rv of labelled) {
            this._rl = this._rl || new THREE.Vector3();
            const v = this._rl.copy(rv.pos);
            v.y += 1.3;
            v.project(this.camera);
            if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
                const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
                const label = rv.name.slice(0, 14);
                ctx.font = '800 13px system-ui, -apple-system, sans-serif';
                const tw = ctx.measureText(label).width + 16;
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = 'rgba(10, 12, 24, 0.75)';
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(x - tw / 2, y - 11, tw, 22, 11) : ctx.rect(x - tw / 2, y - 11, tw, 22);
                ctx.fill();
                ctx.fillStyle = rv.color || '#ffc27a';
                ctx.fillText(label, x, y + 1);
                ctx.globalAlpha = 1;
            }
        }
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.popups.splice(i, 1);
                continue;
            }
            const v = p.p.clone().project(this.camera);
            if (v.z > 1) continue;
            const x = (v.x * 0.5 + 0.5) * w;
            const y = (-v.y * 0.5 + 0.5) * h - (1 - p.life) * 50;
            ctx.globalAlpha = Math.min(1, p.life * 2);
            ctx.font = '900 20px system-ui, -apple-system, sans-serif';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,0,0,0.55)';
            ctx.strokeText(p.text, x, y);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, x, y);
        }
        ctx.globalAlpha = 1;

        // Combo meter
        const c = state.combo;
        if (c && c.count >= 2) {
            const pop = 1 + Math.max(0, c.pop) * 0.4;
            ctx.font = `900 ${Math.round(34 * pop)}px system-ui, -apple-system, sans-serif`;
            ctx.globalAlpha = Math.min(1, c.timer * 2);
            ctx.lineWidth = 6;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            const label = `x${c.multiplier}`;
            const cy = 126;
            ctx.strokeText(label, w / 2, cy);
            ctx.fillStyle = c.multiplier >= 4 ? '#ff3d9a' : c.multiplier >= 3 ? '#ffc93c' : this.palette.accent;
            ctx.fillText(label, w / 2, cy);
            ctx.font = '800 12px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${c.count} COMBO`, w / 2, cy + 26);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(w / 2 - 40, cy + 38, 80, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(w / 2 - 40, cy + 38, 80 * Math.min(1, c.timer / c.window), 3);
            ctx.globalAlpha = 1;
        }

        if (this.banner) {
            const b = this.banner;
            b.life -= dt;
            if (b.life <= 0) {
                this.banner = null;
            } else {
                const t = 1.4 - b.life;
                const scale = t < 0.12 ? 0.6 + (t / 0.12) * 0.4 : 1;
                ctx.globalAlpha = Math.min(1, b.life * 2.5);
                ctx.font = `900 ${Math.round(30 * scale)}px system-ui, -apple-system, sans-serif`;
                ctx.lineWidth = 6;
                ctx.strokeStyle = 'rgba(0,0,0,0.55)';
                ctx.strokeText(b.text, w / 2, h * 0.34);
                ctx.fillStyle = b.color;
                ctx.fillText(b.text, w / 2, h * 0.34);
                ctx.globalAlpha = 1;
            }
        }

        if (state.hint) {
            ctx.globalAlpha = 0.65 + 0.35 * Math.sin(this.time * 4);
            ctx.font = '800 16px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.strokeText(state.hint, w / 2, h * 0.82);
            ctx.fillText(state.hint, w / 2, h * 0.82);
            if (state.subHint) {
                ctx.globalAlpha = 0.8;
                ctx.font = '600 12px system-ui, -apple-system, sans-serif';
                ctx.strokeText(state.subHint, w / 2, h * 0.82 + 24);
                ctx.fillText(state.subHint, w / 2, h * 0.82 + 24);
            }
            ctx.globalAlpha = 1;
        }
    }
}

Scene3D.WORLD_PALETTES = WORLD_PALETTES;
window.Scene3D = Scene3D;
