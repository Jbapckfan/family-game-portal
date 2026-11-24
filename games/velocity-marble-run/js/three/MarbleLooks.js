/**
 * MarbleLooks - the 3D material for every marble in the store
 *
 * Each marble gets its own surface: glossy swirls, cut gems, polished metal,
 * iridescent glass, glowing neon bands, a galaxy. Textures are drawn on
 * canvases at startup (no image assets), and a small generated environment
 * map gives metals and gems something to reflect.
 *
 * Finishes from the store (Shop.FINISHES) are drawn from the marble's own
 * colours and pattern: gold engraved with the stone's pattern, lava cracks
 * and circuit traces in its glow colour, a nebula in its colours. So each
 * marble and finish together make a look of their own.
 */
class MarbleLooks {
    /** Generated studio environment for reflections (cached per renderer) */
    static environment(renderer) {
        MarbleLooks._envs = MarbleLooks._envs || new Map();
        if (MarbleLooks._envs.has(renderer)) return MarbleLooks._envs.get(renderer);
        const scene = new THREE.Scene();
        const sky = new THREE.Mesh(
            new THREE.SphereGeometry(10, 32, 16),
            new THREE.ShaderMaterial({
                side: THREE.BackSide,
                vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: 'varying vec3 vDir; void main(){ float h = vDir.y; vec3 top = vec3(0.9,0.95,1.0); vec3 mid = vec3(0.35,0.3,0.55); vec3 bot = vec3(0.04,0.03,0.08); vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.7)) : mix(mid, bot, pow(-h, 0.5)); gl_FragColor = vec4(c, 1.0); }'
            })
        );
        scene.add(sky);
        // Bright softboxes give sharp highlights on metal and gems
        const box = new THREE.Mesh(new THREE.PlaneGeometry(6, 2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        box.position.set(0, 7, -4);
        box.lookAt(0, 0, 0);
        scene.add(box);
        const box2 = box.clone();
        box2.material = new THREE.MeshBasicMaterial({ color: 0xff7ae6, side: THREE.DoubleSide });
        box2.position.set(-7, 2, 3);
        box2.lookAt(0, 0, 0);
        scene.add(box2);
        const box3 = box.clone();
        box3.material = new THREE.MeshBasicMaterial({ color: 0x5ee7ff, side: THREE.DoubleSide });
        box3.position.set(7, 1, 2);
        box3.lookAt(0, 0, 0);
        scene.add(box3);
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(scene, 0.02).texture;
        pmrem.dispose();
        MarbleLooks._envs.set(renderer, env);
        return env;
    }

    /** Surface texture drawn from the marble's pattern and colours */
    static texture(id, style) {
        MarbleLooks._tex = MarbleLooks._tex || new Map();
        if (MarbleLooks._tex.has(id)) return MarbleLooks._tex.get(id);
        const t = MarbleLooks.canvasTexture(MarbleLooks.stoneCanvas(id, style));
        MarbleLooks._tex.set(id, t);
        return t;
    }

    static canvasTexture(canvas, srgb = true) {
        const t = new THREE.CanvasTexture(canvas);
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
    }

    /** The stone's pattern on a 512x256 canvas (cached; finishes draw from it) */
    static stoneCanvas(id, style) {
        MarbleLooks._stone = MarbleLooks._stone || new Map();
        if (MarbleLooks._stone.has(id)) return MarbleLooks._stone.get(id);
        const c = document.createElement('canvas');
        const W = 512, H = 256;
        c.width = W;
        c.height = H;
        const g = c.getContext('2d');
        const base = style.baseColor;
        const hi = style.highlightColor;
        const mid = style.midColor || base;
        const sh = style.shadowColor || '#000000';
        // Seeded per marble so every copy looks the same
        let rnd = 0;
        for (const ch of id) rnd = (rnd * 31 + ch.charCodeAt(0)) % 2147483647;
        rnd = rnd || 7;
        const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
        const blob = (x, y, rad, col, alpha) => {
            const gr = g.createRadialGradient(x, y, 0, x, y, rad);
            gr.addColorStop(0, col);
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.globalAlpha = alpha;
            g.fillStyle = gr;
            // Draw wrapped so the seam at u=0/1 is invisible
            for (const dx of [-W, 0, W]) g.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
        };
        const wrapStroke = (draw) => { for (const dx of [-W, 0, W]) { g.save(); g.translate(dx, 0); draw(); g.restore(); } };

        g.fillStyle = base;
        g.fillRect(0, 0, W, H);
        switch (style.pattern) {
            case 'CLOUDY':
                for (let k = 0; k < 40; k++) blob(r() * W, r() * H, 30 + r() * 70, r() < 0.6 ? hi : mid, 0.25 + r() * 0.3);
                break;
            case 'SPECKLED':
                for (let k = 0; k < 12; k++) blob(r() * W, r() * H, 40 + r() * 60, mid, 0.18);
                for (let k = 0; k < 1400; k++) {
                    g.globalAlpha = 0.5 + r() * 0.5;
                    g.fillStyle = r() < 0.75 ? hi : sh;
                    const sz = r() < 0.9 ? 1.5 : 3;
                    g.fillRect(r() * W, r() * H, sz, sz);
                }
                break;
            case 'CRYSTAL':
                // Glassy: soft inner depth plus a few bright internal fibres
                for (let k = 0; k < 10; k++) blob(r() * W, r() * H, 50 + r() * 80, hi, 0.35);
                g.strokeStyle = hi;
                for (let k = 0; k < 18; k++) {
                    const x = r() * W, y = r() * H, len = 30 + r() * 90, ang = r() * Math.PI;
                    g.globalAlpha = 0.25 + r() * 0.35;
                    g.lineWidth = 1 + r() * 2;
                    wrapStroke(() => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke(); });
                }
                break;
            case 'VEINED':
                for (let k = 0; k < 8; k++) blob(r() * W, r() * H, 60, mid, 0.2);
                g.strokeStyle = hi;
                for (let k = 0; k < 22; k++) {
                    let x = r() * W, y = r() * H;
                    const pts = [[x, y]];
                    for (let j = 0; j < 9; j++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 40; pts.push([x, y]); }
                    g.globalAlpha = 0.55 + r() * 0.4;
                    g.lineWidth = 0.8 + r() * 2.2;
                    wrapStroke(() => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); });
                }
                break;
            case 'BANDED': {
                const bands = 14;
                for (let k = 0; k < bands; k++) {
                    g.globalAlpha = 0.35 + r() * 0.5;
                    g.strokeStyle = k % 3 === 0 ? hi : k % 3 === 1 ? mid : sh;
                    g.lineWidth = 6 + r() * 14;
                    const y0 = (k / bands) * H, amp = 8 + r() * 14, ph = r() * 6;
                    g.beginPath();
                    for (let x = 0; x <= W; x += 8) {
                        const y = y0 + Math.sin((x / W) * Math.PI * 2 * 2 + ph) * amp;
                        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
                    }
                    g.stroke();
                }
                break;
            }
            case 'NOISE':
                for (let k = 0; k < 90; k++) blob(r() * W, r() * H, 10 + r() * 45, r() < 0.5 ? hi : sh, 0.25 + r() * 0.35);
                break;
            case 'SOLID':
            default:
                for (let k = 0; k < 4; k++) blob(r() * W, r() * H, 90, hi, 0.15);
                break;
        }
        g.globalAlpha = 1;
        MarbleLooks._stone.set(id, c);
        return c;
    }

    /**
     * Physical material from the marble's own values. Real transmission costs
     * an extra scene render per frame, so glassy marbles fake it with
     * transparency, iridescence and an inner glow instead.
     */
    static material(id, style, finish = 'stone') {
        if (finish && finish !== 'stone' && MarbleLooks.FINISHES[finish]) return MarbleLooks.finishMaterial(id, style, finish);
        const trans = style.transmission || 0;
        const params = {
            map: MarbleLooks.texture(id, style),
            color: 0xffffff,
            metalness: style.metalness ?? 0.1,
            roughness: style.roughness ?? 0.2,
            clearcoat: style.clearcoat ?? 0.5,
            clearcoatRoughness: 0.05,
            ior: style.ior || 1.5,
            emissive: new THREE.Color(style.glowColor || '#ffffff'),
            emissiveIntensity: 0.08 + trans * 0.6,
            envMapIntensity: 1 + trans * 0.6
        };
        if (style.iridescence) {
            params.iridescence = style.iridescence;
            params.iridescenceIOR = 1.8;
        }
        if (style.sheen) params.sheen = style.sheen;
        if (trans > 0.5) {
            params.transparent = true;
            params.opacity = 1 - trans * 0.2;
            params.specularIntensity = 1;
        }
        return new THREE.MeshPhysicalMaterial(params);
    }

    /** Render a store thumbnail with the game's renderer; cached as a data URL */
    static thumbnail(renderer, id, style, size = 160, finish = 'stone') {
        MarbleLooks._thumbs = MarbleLooks._thumbs || new Map();
        const cacheKey = `${id}|${finish}|${size}`;
        if (MarbleLooks._thumbs.has(cacheKey)) return MarbleLooks._thumbs.get(cacheKey);
        const scene = new THREE.Scene();
        scene.environment = MarbleLooks.environment(renderer);
        const mat = MarbleLooks.material(id, style, finish);
        const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat);
        ball.rotation.set(0.4, -0.6, 0.2);
        scene.add(ball);
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(2, 3, 4);
        scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));
        const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        cam.position.set(0, 0, 4.4);

        const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4, colorSpace: THREE.SRGBColorSpace });
        const prevTarget = renderer.getRenderTarget();
        const prevClear = renderer.getClearColor(new THREE.Color());
        const prevAlpha = renderer.getClearAlpha();
        renderer.setRenderTarget(rt);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(scene, cam);
        const px = new Uint8Array(size * size * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
        renderer.setRenderTarget(prevTarget);
        renderer.setClearColor(prevClear, prevAlpha);

        const c = document.createElement('canvas');
        c.width = c.height = size;
        const img = c.getContext('2d').createImageData(size, size);
        // Flip vertically (GL origin is bottom-left)
        for (let y = 0; y < size; y++) {
            img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
        }
        c.getContext('2d').putImageData(img, 0, 0);
        const url = c.toDataURL('image/png');
        rt.dispose();
        ball.geometry.dispose();
        mat.dispose();
        MarbleLooks._thumbs.set(cacheKey, url);
        return url;
    }

    // ------------------------------------------------------------------
    // Finishes
    // ------------------------------------------------------------------

    static rgb(hex) {
        const n = parseInt(String(hex || '#ffffff').slice(1), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    static css([r, g, b], a = 1) {
        return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
    }

    /** A colour pushed to full brightness (grey glows become white) */
    static vivid(hex) {
        const c = MarbleLooks.rgb(hex);
        const m = Math.max(1, ...c);
        return c.map(v => (v / m) * 255);
    }

    static saturation(hex) {
        const c = MarbleLooks.rgb(hex);
        const mx = Math.max(...c), mn = Math.min(...c);
        return mx ? (mx - mn) / mx : 0;
    }

    static rng(seedText) {
        let r = 0;
        for (const ch of seedText) r = (r * 31 + ch.charCodeAt(0)) % 2147483647;
        r = r || 7;
        return () => ((r = (r * 16807) % 2147483647) / 2147483647);
    }

    /** The stone's luminance, stretched to 0..1 between its 2nd and 98th percentiles */
    static stoneLuma(id, style) {
        const c = MarbleLooks.stoneCanvas(id, style);
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const n = c.width * c.height;
        const L = new Float32Array(n);
        const hist = new Uint32Array(256);
        for (let i = 0; i < n; i++) {
            const v = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114);
            L[i] = v;
            hist[v | 0]++;
        }
        let lo = 0, hi = 255, acc = 0;
        for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.02) { lo = v; break; } }
        acc = 0;
        for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.02) { hi = v; break; } }
        const span = Math.max(12, hi - lo);
        for (let i = 0; i < n; i++) L[i] = Math.max(0, Math.min(1, (L[i] - lo) / span));
        return L;
    }

    static blankCanvas(fill = null) {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 256;
        const g = c.getContext('2d');
        if (fill) { g.fillStyle = fill; g.fillRect(0, 0, 512, 256); }
        return c;
    }

    /**
     * A high-contrast world for polished metal to reflect: bright sky with
     * softboxes over a sharp horizon and a dark gridded floor, so chrome and
     * gold read as mirrors instead of a flat sheen.
     */
    static mirrorEnv() {
        if (MarbleLooks._mirrorEnv) return MarbleLooks._mirrorEnv;
        const c = MarbleLooks.blankCanvas();
        const g = c.getContext('2d');
        const sky = g.createLinearGradient(0, 0, 0, 128);
        sky.addColorStop(0, '#0d1838');
        sky.addColorStop(0.6, '#4f6fb8');
        sky.addColorStop(1, '#e6f1ff');
        g.fillStyle = sky;
        g.fillRect(0, 0, 512, 128);
        const ground = g.createLinearGradient(0, 128, 0, 256);
        ground.addColorStop(0, '#2a2833');
        ground.addColorStop(0.15, '#0c0b12');
        ground.addColorStop(1, '#030305');
        g.fillStyle = ground;
        g.fillRect(0, 128, 512, 128);
        // Softboxes high in the sky, a warm and a cool one low down
        g.fillStyle = '#ffffff';
        for (const [x, y, w, h] of [[60, 22, 70, 26], [300, 30, 90, 22], [430, 14, 40, 40]]) g.fillRect(x, y, w, h);
        g.fillStyle = '#ff7ae6';
        g.fillRect(180, 92, 50, 18);
        g.fillStyle = '#5ee7ff';
        g.fillRect(380, 96, 60, 14);
        // Horizon line and floor grid
        g.fillStyle = '#ffffff';
        g.fillRect(0, 126, 512, 3);
        g.strokeStyle = 'rgba(120,140,255,0.35)';
        g.lineWidth = 1;
        for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 130); g.lineTo(x, 256); g.stroke(); }
        for (let y = 140; y < 256; y += (y - 120) * 0.35) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.mapping = THREE.EquirectangularReflectionMapping;
        MarbleLooks._mirrorEnv = t;
        return t;
    }

    /** Material for a marble wearing a store finish (textures cached per marble) */
    static finishMaterial(id, style, finish) {
        MarbleLooks._ftex = MarbleLooks._ftex || new Map();
        const key = `${id}|${finish}`;
        let maps = MarbleLooks._ftex.get(key);
        if (!maps) {
            const drawn = MarbleLooks.FINISHES[finish].draw(id, style);
            maps = {};
            if (drawn.map) maps.map = MarbleLooks.canvasTexture(drawn.map);
            if (drawn.emissive) maps.emissiveMap = MarbleLooks.canvasTexture(drawn.emissive);
            if (drawn.rough) maps.roughnessMap = MarbleLooks.canvasTexture(drawn.rough, false);
            MarbleLooks._ftex.set(key, maps);
        }
        const params = { color: 0xffffff, ...MarbleLooks.FINISHES[finish].params(style), ...maps };
        const glow = params.glow;
        delete params.glow;
        if (maps.emissiveMap) params.emissive = new THREE.Color(0xffffff);
        if (finish === 'chrome' || finish === 'gold') params.envMap = MarbleLooks.mirrorEnv();
        const mat = new THREE.MeshPhysicalMaterial(params);
        // Finishes that light up: Scene3D drives the glow with the beat (and twinkle)
        if (glow) mat.userData.glow = glow;
        return mat;
    }
}

/**
 * Each finish draws its textures from the marble's colours and pattern, and
 * sets its material values. glow: { base, beat, twinkle } drives emissive
 * intensity in the game (base + beat * pulse + twinkle * sparkle).
 */
MarbleLooks.FINISHES = {
    chrome: {
        draw(id, style) {
            // The stone's pattern survives as faint variation in the polish
            const L = MarbleLooks.stoneLuma(id, style);
            const c = MarbleLooks.blankCanvas();
            const g = c.getContext('2d');
            const img = g.createImageData(512, 256);
            for (let i = 0; i < L.length; i++) {
                const v = 10 + L[i] * 45;
                img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
                img.data[i * 4 + 3] = 255;
            }
            g.putImageData(img, 0, 0);
            return { rough: c };
        },
        params(style) {
            const b = MarbleLooks.rgb(style.baseColor);
            const tint = new THREE.Color().setRGB(...b.map(v => (0.78 + 0.22 * v / 255)), THREE.SRGBColorSpace);
            return { color: tint, metalness: 1, roughness: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.35 };
        }
    },

    gold: {
        draw(id, style) {
            // Gradient-map the stone's luminance onto gold: its pattern becomes engraving
            const L = MarbleLooks.stoneLuma(id, style);
            const stops = [[0, [74, 46, 8]], [0.35, [168, 116, 34]], [0.72, [238, 194, 96]], [1, [255, 244, 200]]];
            const c = MarbleLooks.blankCanvas();
            const g = c.getContext('2d');
            const img = g.createImageData(512, 256);
            for (let i = 0; i < L.length; i++) {
                const v = 0.25 + L[i] * 0.75;
                let k = 1;
                while (k < stops.length - 1 && v > stops[k][0]) k++;
                const [t0, c0] = stops[k - 1], [t1, c1] = stops[k];
                const u = Math.max(0, Math.min(1, (v - t0) / (t1 - t0)));
                for (let ch = 0; ch < 3; ch++) img.data[i * 4 + ch] = c0[ch] + (c1[ch] - c0[ch]) * u;
                img.data[i * 4 + 3] = 255;
            }
            g.putImageData(img, 0, 0);
            return { map: c };
        },
        params: () => ({ metalness: 1, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.08, envMapIntensity: 1.6 })
    },

    carbon: {
        draw(id, style) {
            // 2x2 twill: tows of fibre that alternate direction, shaded across the tow
            const c = MarbleLooks.blankCanvas('#0b0c0f');
            const g = c.getContext('2d');
            const thread = MarbleLooks.vivid(style.glowColor);
            const cell = 16;
            for (let y = 0; y < 256 / cell; y++) {
                for (let x = 0; x < 512 / cell; x++) {
                    const horiz = ((x + Math.floor(y / 1)) >> 1) % 2 === 0;
                    const x0 = x * cell, y0 = y * cell;
                    const gr = horiz ? g.createLinearGradient(0, y0, 0, y0 + cell) : g.createLinearGradient(x0, 0, x0 + cell, 0);
                    gr.addColorStop(0, '#08090b');
                    gr.addColorStop(0.5, horiz ? '#3a3d44' : '#2a2c31');
                    gr.addColorStop(1, '#08090b');
                    g.fillStyle = gr;
                    g.fillRect(x0, y0, cell, cell);
                    // Fibres along the tow
                    g.strokeStyle = 'rgba(255,255,255,0.05)';
                    g.lineWidth = 1;
                    for (let k = 2; k < cell; k += 3) {
                        g.beginPath();
                        if (horiz) { g.moveTo(x0, y0 + k); g.lineTo(x0 + cell, y0 + k); } else { g.moveTo(x0 + k, y0); g.lineTo(x0 + k, y0 + cell); }
                        g.stroke();
                    }
                }
            }
            // A coloured thread every few tows, in the stone's colour
            g.globalCompositeOperation = 'lighter';
            g.fillStyle = MarbleLooks.css(thread, 0.22);
            for (let y = 0; y < 256; y += cell * 4) g.fillRect(0, y + cell / 2 - 1, 512, 2);
            for (let x = 0; x < 512; x += cell * 4) g.fillRect(x + cell / 2 - 1, 0, 2, 256);
            return { map: c };
        },
        params: () => ({ metalness: 0.25, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 })
    },

    frost: {
        draw(id, style) {
            const r = MarbleLooks.rng(id + 'frost');
            const c = MarbleLooks.blankCanvas();
            const g = c.getContext('2d');
            g.drawImage(MarbleLooks.stoneCanvas(id, style), 0, 0);
            g.fillStyle = 'rgba(214,236,255,0.42)';
            g.fillRect(0, 0, 512, 256);
            // Frost patches, then six-armed crystals with side branches
            for (let k = 0; k < 40; k++) {
                const x = r() * 512, y = r() * 256, rad = 20 + r() * 50;
                const gr = g.createRadialGradient(x, y, 0, x, y, rad);
                gr.addColorStop(0, 'rgba(255,255,255,0.35)');
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = gr;
                for (const dx of [-512, 0, 512]) g.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
            }
            const crystal = (x, y, size, a) => {
                g.strokeStyle = `rgba(255,255,255,${a})`;
                g.lineWidth = 0.6 + size / 14;
                for (let arm = 0; arm < 6; arm++) {
                    const ang = arm * Math.PI / 3 + r() * 0.2;
                    const ex = x + Math.cos(ang) * size, ey = y + Math.sin(ang) * size * 0.6;
                    g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
                    for (const f of [0.45, 0.7]) {
                        const bx = x + (ex - x) * f, by = y + (ey - y) * f, bl = size * 0.28 * (1.2 - f);
                        for (const s of [-1, 1]) {
                            g.beginPath(); g.moveTo(bx, by);
                            g.lineTo(bx + Math.cos(ang + s * 0.8) * bl, by + Math.sin(ang + s * 0.8) * bl * 0.6);
                            g.stroke();
                        }
                    }
                }
            };
            for (let k = 0; k < 110; k++) {
                const x = r() * 512, y = r() * 256, size = 4 + r() * 16, a = 0.45 + r() * 0.5;
                for (const dx of [-512, 0, 512]) if (x + dx > -30 && x + dx < 542) crystal(x + dx, y, size, a);
            }
            // Glints: points that catch the light (emissive, twinkling in the game)
            const e = MarbleLooks.blankCanvas('#000000');
            const ge = e.getContext('2d');
            for (let k = 0; k < 320; k++) {
                const x = r() * 512, y = r() * 256, rad = 1 + r() * 2.2;
                const gr = ge.createRadialGradient(x, y, 0, x, y, rad);
                gr.addColorStop(0, 'rgba(235,250,255,1)');
                gr.addColorStop(1, 'rgba(160,220,255,0)');
                ge.fillStyle = gr;
                ge.fillRect(x - rad, y - rad, rad * 2, rad * 2);
            }
            return { map: c, emissive: e };
        },
        params: () => ({
            metalness: 0, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.2,
            sheen: 1, sheenColor: new THREE.Color('#bfe8ff'), sheenRoughness: 0.35, envMapIntensity: 1.1,
            emissiveIntensity: 0.6, glow: { base: 0.35, beat: 0.3, twinkle: 0.6 }
        })
    },

    circuit: {
        draw(id, style) {
            const r = MarbleLooks.rng(id + 'circuit');
            const glow = MarbleLooks.vivid(style.glowColor);
            const sh = MarbleLooks.rgb(style.shadowColor || '#000000');
            const base = [6 + sh[0] * 0.18, 8 + sh[1] * 0.18, 14 + sh[2] * 0.18];
            const c = MarbleLooks.blankCanvas(MarbleLooks.css(base));
            const e = MarbleLooks.blankCanvas('#000000');
            const g = c.getContext('2d'), ge = e.getContext('2d');
            // Faint board grain
            for (let k = 0; k < 600; k++) {
                g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`;
                g.fillRect(r() * 512, r() * 256, 2, 2);
            }
            const step = 8;
            const paths = [];
            for (let k = 0; k < 75; k++) {
                let x = Math.round(r() * 64) * step, y = Math.round(4 + r() * 24) * step;
                const pts = [[x, y]];
                let dir = r() < 0.5 ? 0 : 1;
                const segs = 2 + Math.floor(r() * 5);
                for (let j = 0; j < segs; j++) {
                    const len = (2 + Math.floor(r() * 6)) * step * (r() < 0.5 ? -1 : 1);
                    if (dir === 0) x += len; else if (dir === 1) y = Math.max(16, Math.min(240, y + len)); else { x += len; y = Math.max(16, Math.min(240, y + len * 0.6)); }
                    pts.push([x, y]);
                    dir = dir === 2 ? 0 : (r() < 0.2 ? 2 : 1 - dir);
                }
                paths.push(pts);
            }
            const drawPaths = (ctx, col, w) => {
                ctx.strokeStyle = col;
                ctx.lineWidth = w;
                ctx.lineJoin = 'round';
                for (const pts of paths) {
                    for (const dx of [-512, 0, 512]) {
                        ctx.beginPath();
                        ctx.moveTo(pts[0][0] + dx, pts[0][1]);
                        for (const p of pts) ctx.lineTo(p[0] + dx, p[1]);
                        ctx.stroke();
                    }
                }
            };
            const pads = (ctx, col, hole) => {
                for (const pts of paths) {
                    for (const p of [pts[0], pts[pts.length - 1]]) {
                        for (const dx of [-512, 0, 512]) {
                            ctx.fillStyle = col;
                            ctx.beginPath(); ctx.arc(p[0] + dx, p[1], 3.6, 0, Math.PI * 2); ctx.fill();
                            if (hole) { ctx.fillStyle = hole; ctx.beginPath(); ctx.arc(p[0] + dx, p[1], 1.4, 0, Math.PI * 2); ctx.fill(); }
                        }
                    }
                }
            };
            // Chips: dark rectangles with pins
            for (let k = 0; k < 9; k++) {
                const w = 24 + r() * 30, h = 14 + r() * 18, x = r() * (512 - w), y = 30 + r() * (196 - h);
                g.fillStyle = 'rgba(0,0,0,0.65)';
                g.fillRect(x, y, w, h);
                ge.fillStyle = MarbleLooks.css(glow, 0.5);
                for (let px = x + 3; px < x + w - 2; px += 5) { ge.fillRect(px, y - 3, 2, 3); ge.fillRect(px, y + h, 2, 3); }
            }
            drawPaths(g, MarbleLooks.css(glow, 0.35), 2.2);
            pads(g, MarbleLooks.css(glow, 0.5), MarbleLooks.css(base));
            drawPaths(ge, MarbleLooks.css(glow, 0.25), 6);
            drawPaths(ge, MarbleLooks.css(glow, 1), 1.8);
            pads(ge, 'rgba(255,255,255,0.95)', '#000000');
            return { map: c, emissive: e };
        },
        params: () => ({
            metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1,
            emissiveIntensity: 1.2, glow: { base: 0.9, beat: 1.6, twinkle: 0 }
        })
    },

    molten: {
        draw(id, style) {
            // Plates of crust split by a network of cracks (Voronoi edges, wrapped
            // around the sphere), the cracks burning in the marble's glow colour
            const r = MarbleLooks.rng(id + 'molten');
            const hot = MarbleLooks.saturation(style.glowColor) > 0.3 ? MarbleLooks.vivid(style.glowColor) : [255, 96, 24];
            const sh = MarbleLooks.rgb(style.shadowColor || '#202020');
            const W = 512, H = 256;
            const seeds = [];
            for (let k = 0; k < 58; k++) seeds.push([r() * W, r() * H]);
            const c = MarbleLooks.blankCanvas(), e = MarbleLooks.blankCanvas();
            const img = c.getContext('2d').createImageData(W, H);
            const em = e.getContext('2d').createImageData(W, H);
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    // Wobble the lookup so cracks wander instead of running straight
                    const wx = x + Math.sin(y * 0.09 + x * 0.031) * 4 + Math.sin(y * 0.23) * 1.5;
                    const wy = y + Math.sin(x * 0.07 + y * 0.02) * 4;
                    let f1 = 1e9, f2 = 1e9;
                    for (const [sx, sy] of seeds) {
                        let dx = Math.abs(wx - sx);
                        if (dx > W / 2) dx = W - dx;
                        const dy = wy - sy;
                        const d = dx * dx + dy * dy;
                        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
                    }
                    const edge = Math.sqrt(f2) - Math.sqrt(f1);
                    const crack = Math.max(0, 1 - edge / 3.2);
                    const scorch = Math.max(0, 1 - edge / 14);
                    const i = (y * W + x) * 4;
                    const grain = 0.75 + 0.25 * Math.sin(x * 1.7 + y * 2.3) * Math.sin(x * 0.4 - y * 0.9);
                    const plate = 0.55 + 0.45 * Math.min(1, Math.sqrt(f1) / 30);
                    for (let ch = 0; ch < 3; ch++) {
                        const crust = (18 + sh[ch] * 0.35) * grain * plate * (1 - scorch * 0.6);
                        img.data[i + ch] = crust + hot[ch] * crack * 0.6;
                        // Emission: white-hot in the middle of a crack, the hot colour at its edges
                        const core = crack * crack;
                        em.data[i + ch] = Math.min(255, hot[ch] * crack * 1.1 + 255 * core * 0.55 + hot[ch] * scorch * 0.12);
                    }
                    img.data[i + 3] = em.data[i + 3] = 255;
                }
            }
            c.getContext('2d').putImageData(img, 0, 0);
            e.getContext('2d').putImageData(em, 0, 0);
            return { map: c, emissive: e };
        },
        params: () => ({
            metalness: 0.05, roughness: 0.85, clearcoat: 0.15, clearcoatRoughness: 0.5, envMapIntensity: 0.5,
            emissiveIntensity: 1.6, glow: { base: 1.3, beat: 2.2, twinkle: 0 }
        })
    },

    holo: {
        draw(id, style) {
            // Hue runs around the marble and through the stone's pattern
            const L = MarbleLooks.stoneLuma(id, style);
            const c = MarbleLooks.blankCanvas();
            const g = c.getContext('2d');
            const img = g.createImageData(512, 256);
            const col = new THREE.Color();
            for (let y = 0; y < 256; y++) {
                for (let x = 0; x < 512; x++) {
                    const i = y * 512 + x;
                    let h = x / 512 * 2 + y / 256 * 0.8 + L[i] * 0.9 + 0.12 * Math.sin(y / 256 * 12 + x / 512 * Math.PI * 6);
                    h -= Math.floor(h);
                    col.setHSL(h, 0.85, 0.6 + L[i] * 0.12, THREE.SRGBColorSpace);
                    const out = col.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
                    img.data[i * 4] = out.r * 255; img.data[i * 4 + 1] = out.g * 255; img.data[i * 4 + 2] = out.b * 255;
                    img.data[i * 4 + 3] = 255;
                }
            }
            g.putImageData(img, 0, 0);
            return { map: c };
        },
        params: () => ({
            metalness: 0.85, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.03,
            iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [200, 900], envMapIntensity: 1.5
        })
    },

    galaxy: {
        draw(id, style) {
            const r = MarbleLooks.rng(id + 'galaxy');
            const c = MarbleLooks.blankCanvas('#03010a');
            const g = c.getContext('2d');
            const a = MarbleLooks.vivid(style.glowColor);
            const b = MarbleLooks.vivid(style.highlightColor);
            // A third colour: the glow turned a third of the way round the wheel
            const third = new THREE.Color().setRGB(...a.map(v => v / 255), THREE.SRGBColorSpace);
            const hsl = third.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
            third.setHSL((hsl.h + 0.33) % 1, Math.max(0.6, hsl.s), 0.5, THREE.SRGBColorSpace);
            const tc = third.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
            const cols = [a, b, [tc.r * 255, tc.g * 255, tc.b * 255]];
            const blob = (x, y, rad, col, alpha) => {
                const gr = g.createRadialGradient(x, y, 0, x, y, rad);
                gr.addColorStop(0, MarbleLooks.css(col, alpha));
                gr.addColorStop(1, MarbleLooks.css(col, 0));
                g.fillStyle = gr;
                for (const dx of [-512, 0, 512]) g.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
            };
            g.globalCompositeOperation = 'lighter';
            // A band of nebula round the middle, thinner clouds elsewhere
            for (let k = 0; k < 70; k++) {
                const y = 128 + (r() - 0.5) * (k < 45 ? 120 : 240);
                blob(r() * 512, y, 25 + r() * 90, cols[k % 3 === 2 && r() < 0.5 ? 2 : k % 2], 0.08 + r() * 0.16);
            }
            g.globalCompositeOperation = 'source-over';
            // Dust lanes
            for (let k = 0; k < 14; k++) blob(r() * 512, 128 + (r() - 0.5) * 140, 18 + r() * 40, [2, 0, 8], 0.5);
            g.globalCompositeOperation = 'lighter';
            for (let k = 0; k < 700; k++) {
                g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.75})`;
                const sz = r() < 0.92 ? 1 : 1.8;
                g.fillRect(r() * 512, r() * 256, sz, sz);
            }
            for (let k = 0; k < 36; k++) {
                const x = r() * 512, y = r() * 256;
                blob(x, y, 3 + r() * 6, [255, 255, 255], 0.9);
                if (k < 10) {
                    g.strokeStyle = 'rgba(255,255,255,0.5)';
                    g.lineWidth = 0.8;
                    g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke();
                }
            }
            return { map: c, emissive: c };
        },
        params: () => ({
            metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.7,
            emissiveIntensity: 0.9, glow: { base: 0.75, beat: 0.6, twinkle: 0 }
        })
    }
};

window.MarbleLooks = MarbleLooks;
