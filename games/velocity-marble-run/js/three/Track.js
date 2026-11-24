/**
 * Track - A procedurally generated half-pipe chute
 *
 * The chute is a centreline sampled every metre with an orthonormal frame per
 * sample (T forward/downhill, R right, U up out of the floor). Its cross
 * section is a circle of radius PIPE_R whose lowest point lies on the
 * centreline; the walls run from the floor up to an angle wallL / wallR on
 * each side (pi/2 = rim level with the pipe axis).
 *
 * Everything on the track (coins, boosts, obstacles) is placed in track
 * coordinates: s = metres along the centreline, phi = angle around the pipe
 * (0 = floor, + = right wall).
 *
 * Generation is seeded by the level id, so a level is the same every time.
 */

const PIPE_R = 3;

class Track {
    constructor(level) {
        this.level = level;
        // The visual world: a designed level (World 7) may borrow another world's scenery
        this.worldId = level.scene || level.worldId || 1;
        const [w, i] = String(level.id).split('-').map(Number);
        // 1..50 from the id; daily challenges pass their own
        this.difficulty = level.trackDifficulty || (((w || 1) - 1) * 10 + (i || 1));
        this.rng = Track.seededRandom(String(level.id));

        this.ds = 1;
        this.radius = PIPE_R;
        this.coins = [];
        this.boosts = [];
        this.obstacles = [];
        this.sections = []; // for visuals: gaps and low walls

        if (level.song) {
            this.buildSongCourse(level.song);
        } else {
            this.buildCenterline();
            this.placeContent();
        }
    }

    static seededRandom(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        let s = h >>> 0;
        return () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    rand(a, b) {
        return a + (b - a) * this.rng();
    }

    pick(list) {
        return list[Math.floor(this.rng() * list.length)];
    }

    // ------------------------------------------------------------------
    // Centreline
    // ------------------------------------------------------------------

    /** Segment plan: straights, turns, S-bends and drops, sharper as levels progress */
    /** The run's pitch: steep, so the chute visibly dives below the horizon */
    slopeSet() {
        const d = this.difficulty;
        const baseSlope = (17 + Math.min(7, d * 0.14)) * Math.PI / 180;
        const dropSlope = () => Math.min(36 * Math.PI / 180, baseSlope * this.rand(1.5, 1.9));
        return { baseSlope, dropSlope };
    }

    /**
     * The set pieces, each with its own approach and run-out. Sizes grow with
     * difficulty; a designed level may give its own.
     *   loop    a vertical loop-the-loop (a one-turn helix, so the exit clears
     *           the entry), its floor on the outside like a roller coaster;
     *           a steep run-in and a boost pad at the foot gather the speed
     *   plunge  a drop shaft: the chute closes into a tube and turns straight
     *           down, then pulls out at the bottom
     *   kicker  a launch ramp over a chasm: the chute kicks up, then there is
     *           nothing to roll on, and the landing is far below
     */
    specialSegs(kind, opt = {}) {
        const d = this.difficulty;
        const { baseSlope, dropSlope } = this.slopeSet();
        const sm = Track.sm01;
        const over = (k) => Math.max(0, d - Track.SPECIAL_AT[k]);
        if (kind === 'loop') {
            const radius = opt.radius || 9 + Math.min(3, over('loop') * 0.1);
            const len = Math.round(radius * 7.4);
            return [
                { len: 40, yaw: 0, slope: dropSlope() * 1.05, kind: 'runin' },
                { len, yaw: 0, slope: baseSlope, kind: 'loop', radius, offset: 9 },
                { len: 40, yaw: 0, slope: baseSlope, kind: 'runout' }
            ];
        }
        if (kind === 'plunge') {
            const len = Math.round(opt.len || 80 + Math.min(30, over('plunge') * 1.2));
            const steep = 86 * Math.PI / 180;
            const slopeAt = (u) => baseSlope + (steep - baseSlope) * (u < 0.3 ? sm(u / 0.3) : u < 0.62 ? 1 : 1 - sm((u - 0.62) / 0.38));
            return [
                { len: 30, yaw: 0, slope: baseSlope, kind: 'straight' },
                { len, yaw: 0, slope: baseSlope, slopeAt, kind: 'plunge' },
                { len: 60, yaw: 0, slope: baseSlope * 0.8, kind: 'runout' }
            ];
        }
        if (kind === 'helix') {
            // A helix tower: two and a quarter turns of a wide descending spiral
            // round a central column, the walls raised so the marble rides the
            // bank at speed without flying out
            const radius = opt.radius || 17 + Math.min(4, over('helix') * 0.15);
            const turns = opt.turns || 2.25;
            const dir = opt.dir || (this.rng() < 0.5 ? -1 : 1);
            const len = Math.round(turns * 2 * Math.PI * radius);
            return [
                { len: 30, yaw: 0, slope: baseSlope, kind: 'straight' },
                { len, yaw: dir / radius, slope: baseSlope * 1.1, kind: 'helix', radius, dir, turns },
                { len: 40, yaw: 0, slope: baseSlope, kind: 'runout' }
            ];
        }
        const chasm = Math.round(opt.chasm || 16 + Math.min(10, over('kicker') * 0.4));
        return [
            { len: 34, yaw: 0, slope: dropSlope(), kind: 'runin' },
            { len: 24, yaw: 0, slope: -26 * Math.PI / 180, kind: 'kicker' },
            { len: chasm, yaw: 0, slope: 42 * Math.PI / 180, kind: 'chasm' },
            { len: 90, yaw: 0, slope: 24 * Math.PI / 180, kind: 'landing' }
        ];
    }

    /**
     * Roller-coaster cliff: a flat straight approach, a crest, a long steep
     * drop and a run-out. Fly off the crest, or jump at the top for a long
     * free fall before the chute comes back up to meet you. The run-out is
     * long enough to catch a jump from the crest (about 80 m past the bottom
     * on the biggest cliffs) before any bend.
     */
    cliffSegs(opt = {}) {
        const d = this.difficulty;
        const drop = opt.drop || 50 + Math.min(40, d * 0.8);
        const angle = (opt.angle || 50 + Math.min(12, d * 0.25)) * Math.PI / 180;
        return [
            { len: 36, yaw: 0, slope: 4 * Math.PI / 180, kind: 'flat' },
            { len: drop, yaw: 0, slope: angle, kind: 'cliff' },
            { len: 100, yaw: 0, slope: 9 * Math.PI / 180, kind: 'runout' }
        ];
    }

    /**
     * A hand-designed course (World 7, the Grand Prix): the level lists its
     * pieces in order instead of rolling them.
     *   ['straight', len]            at the base slope
     *   ['drop', len]                a steep drop
     *   ['flat', len]                nearly level
     *   ['turn', len, dir, radius]   a bend, dir +1 left / -1 right
     *   ['s', len, radius, dir]      an S-bend: two opposite turns of len each
     *   ['cliff', drop?]             the cliff with its approach and run-out
     *   ['loop', radius?]            loop-the-loop with run-in and run-out
     *   ['plunge', len?]             plunge shaft
     *   ['kicker', chasm?]           launch ramp over a chasm
     *   ['helix', radius?, turns?, dir?]  helix tower
     */
    designSegments(design) {
        const { baseSlope, dropSlope } = this.slopeSet();
        const segs = [];
        for (const [kind, a, b, c] of design.segments) {
            switch (kind) {
                case 'straight': segs.push({ len: a, yaw: 0, slope: baseSlope, kind: 'straight' }); break;
                case 'drop': segs.push({ len: a, yaw: 0, slope: dropSlope(), kind: 'drop' }); break;
                case 'flat': segs.push({ len: a, yaw: 0, slope: 5 * Math.PI / 180, kind: 'flat' }); break;
                case 'turn': segs.push({ len: a, yaw: b / c, slope: baseSlope, kind: 'turn' }); break;
                case 's':
                    segs.push({ len: a, yaw: c / b, slope: baseSlope, kind: 'turn' });
                    segs.push({ len: a, yaw: -c / b, slope: baseSlope, kind: 'turn' });
                    break;
                case 'cliff': segs.push(...this.cliffSegs({ drop: a })); break;
                case 'loop': segs.push(...this.specialSegs('loop', { radius: a })); break;
                case 'plunge': segs.push(...this.specialSegs('plunge', { len: a })); break;
                case 'kicker': segs.push(...this.specialSegs('kicker', { chasm: a })); break;
                case 'helix': segs.push(...this.specialSegs('helix', { radius: a, turns: b, dir: c })); break;
            }
        }
        segs.push({ len: 50, yaw: 0, slope: baseSlope * 0.6, kind: 'finish' });
        return segs;
    }

    planSegments() {
        if (this.level.design) return this.designSegments(this.level.design);
        const d = this.difficulty;
        // Long runs: about 1200 m in world 1 up to 2700 m in world 6
        const length = Math.round(1150 + d * 26);
        const minRadius = Math.max(20, 42 - d * 0.55);
        const maxRadius = minRadius + 30;
        const { baseSlope, dropSlope } = this.slopeSet();

        const segs = [{ len: 40, yaw: 0, slope: baseSlope, kind: 'straight' }];
        let total = 40;
        let lastTurn = 1;
        let prevKind = 'straight';
        let cliffs = 0;
        const maxCliffs = d < 3 ? 0 : d < 12 ? 1 : d < 24 ? 2 : d < 40 ? 3 : 4;
        const specials = { loop: 0, plunge: 0, kicker: 0, helix: 0 };
        const maxSpecial = (k) => d < Track.SPECIAL_AT[k] ? 0 : d < Track.SPECIAL_AT[k] + 10 ? 1 : d < Track.SPECIAL_AT[k] + 24 ? 2 : 3;
        const push = (parts) => {
            segs.push(...parts);
            for (const p of parts) total += p.len;
            prevKind = parts[parts.length - 1].kind;
        };
        const addSpecial = {};
        for (const kind of Track.SPECIALS) addSpecial[kind] = () => { push(this.specialSegs(kind)); specials[kind]++; };
        const addCliff = () => { push(this.cliffSegs()); cliffs++; };
        while (total < length - 50) {
            let roll = this.rng();
            // Turns usually open onto a runway: jumps and gaps need straight track ahead
            if (prevKind === 'turn' && this.rng() < 0.45) roll *= 0.4;
            let seg;
            if (cliffs < maxCliffs && total > 140 && total < length - 320 && this.rng() < 0.16) {
                addCliff();
                continue;
            }
            if (total > 200 && total < length - 360 && prevKind !== 'runout' && prevKind !== 'landing') {
                const sp = Track.SPECIALS.filter(k => specials[k] < maxSpecial(k));
                if (sp.length && this.rng() < (d >= 51 ? 0.16 : 0.11)) {
                    addSpecial[this.pick(sp)]();
                    continue;
                }
            }
            if (roll < 0.24) {
                seg = { len: this.rand(34, 52), yaw: 0, slope: baseSlope, kind: 'straight' };
            } else if (roll < 0.4) {
                seg = { len: this.rand(30, 46), yaw: 0, slope: dropSlope(), kind: 'drop' };
            } else if (roll < 0.55 && d > 6) {
                // S-bend: two opposite turns (wider on the fast later levels, where a
                // tight one at top speed throws the heavy marbles out)
                const r = this.rand(minRadius, maxRadius) + (d > 30 ? 12 : 0);
                const len = this.rand(22, 34);
                const dir = this.rng() < 0.5 ? 1 : -1;
                segs.push({ len, yaw: dir / r, slope: baseSlope, kind: 'turn' });
                seg = { len, yaw: -dir / r, slope: baseSlope, kind: 'turn' };
                total += len;
            } else {
                const r = this.rand(minRadius, maxRadius);
                // Alternate directions more often than not so the track snakes
                const dir = this.rng() < 0.7 ? -lastTurn : lastTurn;
                lastTurn = dir;
                const angle = this.rand(0.6, Math.min(2.4, 0.9 + d * 0.03));
                seg = { len: angle * r, yaw: dir / r, slope: baseSlope * this.rand(0.85, 1.15), kind: 'turn' };
            }
            segs.push(seg);
            total += seg.len;
            prevKind = seg.kind;
        }
        // From level 1-6 on every level has at least one cliff
        if (d >= 6 && cliffs === 0) addCliff();
        // The level that introduces a special always has it; from level 4-10 on
        // every level has at least one, and the Grid (world 6) always loops
        for (const [kind, at] of Object.entries(Track.SPECIAL_AT)) {
            if (d === at && specials[kind] === 0) addSpecial[kind]();
        }
        if (d >= 51 && specials.loop === 0) addSpecial.loop();
        if (d >= 40 && specials.loop + specials.plunge + specials.kicker + specials.helix === 0) addSpecial[this.pick(Track.SPECIALS)]();
        segs.push({ len: 50, yaw: 0, slope: baseSlope * 0.6, kind: 'finish' });
        return segs;
    }

    buildCenterline(segs = this.planSegments()) {
        this.segments = segs;
        this.sections = [];
        const ds = this.ds;
        let n = 0;
        for (const s of segs) n += Math.round(s.len / ds);
        n += 2;
        this.count = n;
        this.length = (n - 1) * ds;

        const C = this.C = new Float32Array(n * 3);
        const T = this.T = new Float32Array(n * 3);
        const R = this.R = new Float32Array(n * 3);
        const U = this.U = new Float32Array(n * 3);
        const K = this.K = new Float32Array(n * 3);
        this.wallL = new Float32Array(n).fill(1.85);
        this.wallR = new Float32Array(n).fill(1.85);
        this.gap = new Uint8Array(n);
        this.mat = new Uint8Array(n);       // surface material id (Track.MATERIALS)
        this.force = new Uint8Array(n);     // force piece id (Track.FORCES)
        this.forceIdx = new Int16Array(n).fill(-1); // index into sections
        this.yawRate = new Float32Array(n);
        this.kind = new Array(n);
        this.loopW = new Float32Array(n);   // 1 inside a loop (its frame is carried round, not taken from world up)

        // Per-sample targets, then smoothed so curvature and bank change gradually
        const yawT = new Float32Array(n);
        const slopeT = new Float32Array(n);
        const segOf = new Array(n);
        const segU = new Float32Array(n);
        let i = 0;
        for (const s of segs) {
            const m = Math.round(s.len / ds);
            s.i0 = i;
            s.m = m;
            for (let k = 0; k < m && i < n; k++, i++) {
                yawT[i] = s.yaw;
                slopeT[i] = s.slopeAt ? s.slopeAt(k / m) : s.slope;
                this.kind[i] = s.kind;
                segOf[i] = s;
                segU[i] = k / m;
                if (s.kind === 'chasm') this.gap[i] = 1;
            }
        }
        for (; i < n; i++) {
            yawT[i] = 0;
            slopeT[i] = segs[segs.length - 1].slope;
            this.kind[i] = 'finish';
        }
        const smooth = (arr, passes, win) => {
            let a = arr;
            for (let p = 0; p < passes; p++) {
                const b = new Float32Array(n);
                for (let j = 0; j < n; j++) {
                    let sum = 0, c = 0;
                    for (let q = -win; q <= win; q++) {
                        const k = Math.min(n - 1, Math.max(0, j + q));
                        sum += a[k];
                        c++;
                    }
                    b[j] = sum / c;
                }
                a = b;
            }
            return a;
        };
        const yaw = smooth(yawT, 3, 6);
        const slope = smooth(slopeT, 3, 6);
        this.slope = slope;

        let heading = 0;
        let x = 0, y = 0, z = 0;
        let loop = null;
        const sm = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
        for (let j = 0; j < n; j++) {
            heading += yaw[j] * ds;
            this.yawRate[j] = yaw[j];
            const p = slope[j];
            const hx = -Math.sin(heading), hz = -Math.cos(heading);
            let tx = hx * Math.cos(p), ty = -Math.sin(p), tz = hz * Math.cos(p);
            const sg = segOf[j];
            if (sg && sg.kind === 'loop') {
                // A vertical loop in the plane of the entry direction: the turn rate
                // eases in and out, and a sideways lean through the middle carries
                // the exit clear of the entry
                if (!loop || loop.seg !== sg) {
                    const F = [tx, ty, tz];
                    const N = [-F[0] * F[1], 1 - F[1] * F[1], -F[2] * F[1]];
                    const nl = Math.hypot(N[0], N[1], N[2]) || 1;
                    N[0] /= nl; N[1] /= nl; N[2] /= nl;
                    const S = [F[1] * N[2] - F[2] * N[1], F[2] * N[0] - F[0] * N[2], F[0] * N[1] - F[1] * N[0]];
                    const m = sg.m;
                    const cum = new Float32Array(m + 1);
                    for (let k = 0; k < m; k++) {
                        const u = k / m;
                        cum[k + 1] = cum[k] + sm(u / 0.15) * sm((1 - u) / 0.15);
                    }
                    const theta = (k) => Math.PI * 2 * cum[Math.min(m, k)] / cum[m];
                    loop = { seg: sg, F, N, S, theta, lean: sg.offset / (0.5 * sg.len) };
                }
                const k = j - sg.i0, u = segU[j];
                const th = loop.theta(k);
                const c = loop.lean * Math.pow(Math.sin(Math.PI * u), 2);
                let lx = Math.cos(th) * loop.F[0] + Math.sin(th) * loop.N[0] + c * loop.S[0];
                let ly = Math.cos(th) * loop.F[1] + Math.sin(th) * loop.N[1] + c * loop.S[1];
                let lz = Math.cos(th) * loop.F[2] + Math.sin(th) * loop.N[2] + c * loop.S[2];
                // The last stretch eases back onto the chute's own direction
                const e = sm((u - 0.9) / 0.1);
                lx += (tx - lx) * e; ly += (ty - ly) * e; lz += (tz - lz) * e;
                const ll = Math.hypot(lx, ly, lz) || 1;
                tx = lx / ll; ty = ly / ll; tz = lz / ll;
                this.yawRate[j] = 0;
                this.loopW[j] = u > 0.85 ? sm((1 - u) / 0.15) : 1;
            } else if (loop) {
                loop = null;
            }
            T[j * 3] = tx; T[j * 3 + 1] = ty; T[j * 3 + 2] = tz;
            C[j * 3] = x; C[j * 3 + 1] = y; C[j * 3 + 2] = z;
            x += tx * ds; y += ty * ds; z += tz * ds;
        }
        // The slope as built (loops and plunges turn far past the planned angles)
        for (let j = 0; j < n; j++) slope[j] = Math.asin(Math.max(-1, Math.min(1, -T[j * 3 + 1])));

        // Bank into turns like a bobsled run, so the marble rides up the outside wall
        const vDesign = 22 + this.difficulty * 0.2;
        const g = 30;
        const bankT = new Float32Array(n);
        for (let j = 0; j < n; j++) {
            // yaw > 0 turns left (heading increases counter-clockwise seen from above)
            bankT[j] = Math.max(-0.7, Math.min(0.7, Math.atan(yaw[j] * vDesign * vDesign / g) * 0.75));
        }
        const bank = smooth(bankT, 2, 8);
        this.bank = bank;
        this.buildFrames();
        this.finishS = this.length - 30;

        // Specials become force sections (nothing is placed in them; the game
        // and the camera read them): loops nearly close the chute so the marble
        // rides inside, plunges close it into a tube
        this.raiseWalls = (s0, s1, wall, ramp = 8) => {
            for (let j = Math.max(0, s0 - ramp); j < Math.min(n, s1 + ramp); j++) {
                const open = j < s0 ? sm((j - (s0 - ramp)) / ramp) : j >= s1 ? sm((s1 + ramp - j) / ramp) : 1;
                const w = 1.85 + (wall - 1.85) * open;
                this.wallL[j] = Math.max(this.wallL[j], w);
                this.wallR[j] = Math.max(this.wallR[j], w);
            }
        };
        for (const s of segs) {
            if (s.kind !== 'loop' && s.kind !== 'plunge' && s.kind !== 'kicker' && s.kind !== 'helix') continue;
            const s0 = s.i0, s1 = Math.min(n - 1, s.i0 + s.m);
            let sec;
            if (s.kind === 'loop') {
                this.raiseWalls(s0 + 4, s1 - 4, 2.75, 10);
                sec = { type: 'loop', s0, s1, radius: s.radius };
            } else if (s.kind === 'helix') {
                this.raiseWalls(s0 + 6, s1 - 6, 2.6, 12);
                sec = { type: 'helix', s0, s1, radius: s.radius, dir: s.dir, turns: s.turns };
            } else if (s.kind === 'plunge') {
                this.raiseWalls(s0 + Math.round(s.m * 0.06), s1 - Math.round(s.m * 0.1), Math.PI, 8);
                sec = { type: 'plunge', s0, s1 };
            } else {
                // The ramp, the chasm and the landing: no pull-down in flight over any of it
                const next = segs[segs.indexOf(s) + 1], land = segs[segs.indexOf(s) + 2];
                const end = Math.min(n - 1, (land ? land.i0 + land.m : s1));
                sec = { type: 'kicker', s0, s1: end, tip: s1, chasm: next ? [next.i0, next.i0 + next.m] : null };
                this.sections.push({ type: 'gap', s0: next.i0, s1: next.i0 + next.m });
            }
            const id = Track.FORCES.indexOf(sec.type);
            for (let j = s0; j <= sec.s1; j++) {
                this.force[j] = id;
                this.forceIdx[j] = this.sections.length;
            }
            this.sections.push(sec);
        }
        // Cliffs become sections (no features inside, a warning band at the crest,
        // and no in-flight pull-down over the drop)
        let at = 0;
        for (const s of segs) {
            const m = Math.round(s.len / ds);
            if (s.kind === 'cliff') {
                const crest = at, bottom = at + m;
                // The landing zone runs well past the bottom: you come down fast and bouncing
                const sec = { type: 'cliff', s0: Math.max(0, crest - 30), s1: Math.min(n - 1, bottom + 120), crest, bottom };
                const id = Track.FORCES.indexOf('cliff');
                for (let j = sec.s0; j <= sec.s1; j++) {
                    this.force[j] = id;
                    this.forceIdx[j] = this.sections.length;
                }
                this.sections.push(sec);
            }
            at += m;
        }
    }

    /** R/U from the bank angle and K from T; rerun after a spiral twists the bank */
    buildFrames() {
        const n = this.count, ds = this.ds;
        const T = this.T, R = this.R, U = this.U, K = this.K, bank = this.bank;
        const lw = this.loopW;
        let px = 1, py = 0, pz = 0; // the previous sample's R, carried round loops
        for (let j = 0; j < n; j++) {
            const tx = T[j * 3], ty = T[j * 3 + 1], tz = T[j * 3 + 2];
            // R = T x worldUp, U = R x T
            let rx = -tz, ry = 0, rz = tx;
            const rl = Math.hypot(rx, rz) || 1;
            rx /= rl; rz /= rl;
            const w = lw ? lw[j] : 0;
            if (w > 0) {
                // Inside a loop world up is no guide (the floor goes over the top):
                // carry the previous R round, keeping it square to T, and ease
                // back to the world-up frame as the loop ends
                const d = px * tx + py * ty + pz * tz;
                let qx = px - d * tx, qy = py - d * ty, qz = pz - d * tz;
                const ql = Math.hypot(qx, qy, qz) || 1;
                qx /= ql; qy /= ql; qz /= ql;
                rx = rx * (1 - w) + qx * w; ry = ry * (1 - w) + qy * w; rz = rz * (1 - w) + qz * w;
                const rl2 = Math.hypot(rx, ry, rz) || 1;
                rx /= rl2; ry /= rl2; rz /= rl2;
            }
            px = rx; py = ry; pz = rz;
            const ux = ry * tz - rz * ty, uy = rz * tx - rx * tz, uz = rx * ty - ry * tx;
            const b = bank[j];
            const cb = Math.cos(b), sb = Math.sin(b);
            // Positive bank tilts the floor toward the left (into a left turn)
            R[j * 3] = rx * cb + ux * sb; R[j * 3 + 1] = ry * cb + uy * sb; R[j * 3 + 2] = rz * cb + uz * sb;
            U[j * 3] = ux * cb - rx * sb; U[j * 3 + 1] = uy * cb - ry * sb; U[j * 3 + 2] = uz * cb - rz * sb;
        }
        for (let j = 0; j < n; j++) {
            const a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1);
            const span = (b - a) * ds;
            for (let c = 0; c < 3; c++) K[j * 3 + c] = (T[b * 3 + c] - T[a * 3 + c]) / span;
        }
    }

    // ------------------------------------------------------------------
    // Frame sampling
    // ------------------------------------------------------------------

    /** Interpolated frame at s; returns a shared object (copy what you keep) */
    frame(s, out = this._frame || (this._frame = Track.newFrame())) {
        const maxS = this.length - 1e-4;
        s = Math.max(0, Math.min(maxS, s));
        const i = Math.floor(s / this.ds);
        const f = s / this.ds - i;
        const j = Math.min(this.count - 1, i + 1);
        for (const key of ['C', 'T', 'R', 'U', 'K']) {
            const src = this[key];
            const o = out[key];
            o[0] = src[i * 3] + (src[j * 3] - src[i * 3]) * f;
            o[1] = src[i * 3 + 1] + (src[j * 3 + 1] - src[i * 3 + 1]) * f;
            o[2] = src[i * 3 + 2] + (src[j * 3 + 2] - src[i * 3 + 2]) * f;
        }
        out.i = i;
        out.wallL = this.wallL[i];
        out.wallR = this.wallR[i];
        out.gap = this.gap[i] === 1;
        out.force = this.force[i];
        return out;
    }

    static newFrame() {
        return { C: [0, 0, 0], T: [0, 0, -1], R: [1, 0, 0], U: [0, 1, 0], K: [0, 0, 0], i: 0, wallL: 1.75, wallR: 1.75, gap: false, force: 0 };
    }

    /** World position of a point at track coords; h = distance in from the wall */
    point(s, phi, h, out = [0, 0, 0]) {
        const f = this.frame(s);
        const r = this.radius - h;
        const sp = Math.sin(phi), cp = Math.cos(phi);
        for (let c = 0; c < 3; c++) {
            out[c] = f.C[c] + f.U[c] * this.radius + (f.R[c] * sp - f.U[c] * cp) * r;
        }
        return out;
    }

    /** Project a world point onto the track: arc length plus local (x right, y up from floor) */
    locate(p, sGuess) {
        let s = sGuess;
        let f;
        for (let k = 0; k < 4; k++) {
            f = this.frame(s);
            const dx = p[0] - f.C[0], dy = p[1] - f.C[1], dz = p[2] - f.C[2];
            const ds = dx * f.T[0] + dy * f.T[1] + dz * f.T[2];
            s = Math.max(0, Math.min(this.length, s + ds));
            if (Math.abs(ds) < 0.01) break;
        }
        f = this.frame(s);
        const dx = p[0] - f.C[0], dy = p[1] - f.C[1], dz = p[2] - f.C[2];
        return {
            s,
            x: dx * f.R[0] + dy * f.R[1] + dz * f.R[2],
            y: dx * f.U[0] + dy * f.U[1] + dz * f.U[2],
            frame: f
        };
    }

    // ------------------------------------------------------------------
    // Content
    // ------------------------------------------------------------------

    placeContent() {
        const d = this.difficulty;
        const design = this.level.design;
        // A designed level draws from a world's feature pool (everything by default)
        const w = design ? (design.pool || 5) : this.worldId;
        const rng = () => this.rng();
        const end = this.finishS - 25;
        let s = 34;
        // Space features by time at the expected speed, tightening with difficulty
        const vExpected = 34 + d * 0.25;
        const spacing = vExpected * (1.15 - d * 0.007);

        // Feature pools unlock world by world. Jump obstacles (hurdles, spike
        // strips, lasers, barrels, spinners) and gaps span the whole floor:
        // steering cannot avoid them, so jumping is the core skill from level
        // 1-2 on. They go on the runways; steering features fill the bends.
        const steer = [['coins', 2.2], ['boost', 1]];
        const jumps = [];
        if (d >= 2) jumps.push(['hurdle', 2.4]);
        if (d >= 3) steer.push(['block', 1.8 + d * 0.04]);
        if (d >= 4) jumps.push(['gap', 2.2]);
        if (d >= 6) steer.push(['double', 1 + d * 0.03]);
        if (d >= 8) jumps.push(['hurdles2', 1.2]);
        if (w >= 2) jumps.push(['spikes', 1.6], ['barrel', 1.4]);
        if (w >= 3) { jumps.push(['laser', 1.6], ['spinner', 1.5]); steer.push(['mover', 1.2], ['lowwall', 0.8]); }
        if (w >= 4) steer.push(['gate', 1.2], ['mines', 1]);
        // Surface materials and force pieces: each arrives on its own level,
        // then turns up more often (and stronger) as the levels go on
        const intro = (kind, at, weight = 1.2) => { if (d >= at) steer.push([kind, weight + (d - at) * 0.03]); };
        intro('groove', 7);
        intro('ice', 11);
        intro('sidewind', 12);
        intro('sand', 13);
        intro('well', 14);
        intro('rubber', 15);
        intro('bumps', 17);
        intro('metal', 21);
        intro('rail', 22);
        intro('wood', 23);
        intro('zerog', 25);
        intro('spiral', 28);
        // The level that introduces a piece always has it, near the start
        const debut = design ? null : Track.DEBUTS[d];
        const choose = (pool) => {
            const totalWeight = pool.reduce((a, p) => a + p[1], 0);
            let r = rng() * totalWeight;
            for (const [k, wt] of pool) {
                if ((r -= wt) <= 0) return k;
            }
            return pool[0][0];
        };

        let lastKind = null;
        let placed = 0;
        // The specials: a boost pad at the foot of each loop and kicker run-in,
        // a line of coins through every loop and plunge
        const specials = this.sections.filter(sec => Track.SPECIALS.includes(sec.type));
        for (const sec of specials) {
            if (sec.type === 'loop' || sec.type === 'kicker') this.boosts.push({ s: sec.s0 - 14, phi: 0, len: 5, width: 0.9, used: false });
            if (sec.type === 'loop') for (let c = sec.s0 + 6; c < sec.s1 - 6; c += 4) this.addCoin(c, 0, 0.7);
            if (sec.type === 'plunge') for (let c = sec.s0 + 10; c < sec.s1 - 10; c += 6) this.addCoin(c, 0, 0.7);
            if (sec.type === 'helix') for (let c = sec.s0 + 12; c < sec.s1 - 12; c += 7) this.addCoin(c, -sec.dir * 0.35, 0.7);
            if (sec.type === 'kicker') this.addCoin(sec.tip + 12, 0, 6);
        }
        // A designed level places its own force pieces and surfaces first, each
        // at a distance along the run: [kind, metres, length, ...options]
        if (design) for (const [kind, at, len, extra] of design.features || []) {
            const a = at <= 1 ? at * this.length : at;
            if (Track.MATERIALS.includes(kind)) this.addMaterial(a, kind, len);
            else if (kind === 'boost') { this.addBoost(a); this.addCoinLine(a + 4, 0); }
            else this.addForce(a, kind, len || 30, { turns: extra });
        }
        while (s < end) {
            // Nothing on a cliff, a loop, a plunge or a kicker: the approach, the
            // piece and the landing stay clear
            const fz = this.forceIdx[Math.min(this.count - 1, Math.floor(s))];
            if (fz >= 0 && Track.CLEAR.includes(this.sections[fz].type)) {
                s = this.sections[fz].s1 + 40;
                continue;
            }
            const ahead = this.sections.find(sec => Track.CLEAR.includes(sec.type) && s > sec.s0 - 36 && s < sec.s0);
            if (ahead) {
                s = ahead.s1 + 40;
                continue;
            }
            // ...nor on a designed piece: the roll fills in around them
            const busy = design && this.sections.find(sec => s > sec.s0 - 26 && s < sec.s1 + 8);
            if (busy) {
                s = busy.s1 + 12;
                continue;
            }
            // Jumps fly further at the higher speeds of later worlds, so they need straighter track ahead
            const gentle = this.isGentle(s - 4, s + 20 + w * 5);
            const pool = gentle && jumps.length && rng() < 0.7 ? jumps : steer;
            let kind = choose(pool);
            // Never the same feature twice in a row, so runs stay varied
            if (kind === lastKind && kind !== 'coins') kind = choose(pool);
            if (debut && placed === 2 && s > 110) kind = debut;
            lastKind = kind;
            placed++;
            const isStraight = this.isStraight(s - 6, s + 26);
            let used = 8;
            switch (kind) {
                case 'ice': case 'rubber': case 'wood': case 'metal': case 'sand':
                    used = this.addMaterial(s, kind);
                    break;
                case 'groove': used = this.addForce(s, 'groove', 26 + this.rand(0, 10)); break;
                case 'sidewind': used = this.addForce(s, 'sidewind', 26 + this.rand(0, 14)); break;
                case 'well': used = this.addForce(s, 'well', 30); break;
                case 'bumps': used = gentle ? this.addForce(s, 'bumps', 18 + this.rand(0, 8)) : this.addCoinLine(s); break;
                case 'rail': used = this.addForce(s, 'rail', 30 + this.rand(0, 20)); break;
                case 'zerog': used = gentle ? this.addForce(s, 'zerog', 30 + this.rand(0, 12)) : this.addCoinLine(s); break;
                case 'spiral':
                    // A closed tube does not mind bends, only big pitch changes
                    used = this.isSteady(s - 6, s + 90, 0.2) ? this.addForce(s, 'spiral', 60 + Math.min(25, d * 0.4)) : this.addCoinLine(s);
                    break;
                case 'coins': used = this.addCoinLine(s); break;
                case 'boost': this.addBoost(s); this.addCoinLine(s + 4, 0); used = 14; break;
                case 'block': {
                    // Off-centre so one side is always wide open
                    const side = this.rng() < 0.5 ? -1 : 1;
                    this.addBlock(s, side * this.rand(0.3, 0.7));
                    used = 6;
                    break;
                }
                case 'double': {
                    // Two blocks with a window between them
                    const win = this.rand(-0.6, 0.6);
                    this.addBlock(s, win - 0.85, 0.45);
                    this.addBlock(s, win + 0.85, 0.45);
                    this.addCoin(s, win, 0.7);
                    used = 6;
                    break;
                }
                case 'hurdle':
                    if (gentle) { this.addHurdle(s); this.addCoin(s, 0, 2.0); used = 8; } else { used = this.addCoinLine(s); }
                    break;
                case 'hurdles2':
                    // Two bars one long jump apart: clear both in one leap, or double jump
                    if (gentle) { this.addHurdle(s); this.addHurdle(s + 7); this.addCoin(s + 3.5, 0, 2.3); used = 14; } else { used = this.addCoinLine(s); }
                    break;
                case 'spikes':
                    if (gentle) { this.addSpikes(s); this.addCoin(s, 0, 2.2); used = 10; } else { used = this.addCoinLine(s); }
                    break;
                case 'laser':
                    if (gentle) { this.addLaser(s); used = 8; } else { used = this.addCoinLine(s); }
                    break;
                case 'barrel':
                    if (gentle) { used = this.addBarrel(s); } else { used = this.addCoinLine(s); }
                    break;
                case 'gap':
                    if (this.gapFits(s)) { used = this.addGap(s); } else { used = this.addCoinLine(s); }
                    break;
                case 'spinner':
                    if (gentle) { this.addSpinner(s); used = 6; } else { used = this.addCoinLine(s); }
                    break;
                case 'mover': this.addMover(s); used = 6; break;
                case 'lowwall': used = this.addLowWall(s); break;
                case 'gate': this.addGate(s); used = 6; break;
                case 'mines': used = this.addMines(s); break;
            }
            s += used + spacing * this.rand(0.75, 1.25);
        }
        // A piece's debut level must contain it: find a free stretch if the loop missed
        if (debut && !this.sections.some(sec => sec.type === debut)) {
            const need = debut === 'spiral' ? 90 : 46;
            for (let g = 100; g < end - need; g += 10) {
                const free = this.obstacles.every(o => o.s < g - 6 || o.s > g + need) && this.boosts.every(b => b.s < g - 6 || b.s > g + need)
                    && this.sections.every(sec => sec.s1 < g - 6 || sec.s0 > g + need);
                if (!free) continue;
                if (debut === 'spiral' && !this.isSteady(g - 6, g + need, 0.2)) continue;
                if ((debut === 'bumps' || debut === 'zerog') && !this.isGentle(g - 4, g + need)) continue;
                if (Track.MATERIALS.includes(debut)) this.addMaterial(g, debut);
                else this.addForce(g, debut, debut === 'spiral' ? 70 : debut === 'well' ? 30 : 30);
                break;
            }
        }
        // Every level from 1-4 on has at least one gap to leap
        if (d >= 4 && !this.sections.some(sec => sec.type === 'gap')) {
            // Fallback: a short gap, allowing a little more pitch change
            for (let g = 120; g < end; g += 5) {
                const clear = this.obstacles.every(o => Math.abs(o.s - g) > 18) && this.boosts.every(b => Math.abs(b.s - g) > 18);
                if (clear && this.gapFits(g, 0.1)) { this.addGap(g, true); break; }
            }
        }
        this.obstacles.sort((a, b) => a.s - b.s);
        this.coins.sort((a, b) => a.s - b.s);

        // Playtest fixes: obstacles the verification pilot could not get past,
        // and bends the heavy marbles flew out of, which get high walls
        const fixes = (window.TRACK_FIXES || {})[this.level.id];
        if (fixes) this.obstacles = this.obstacles.filter((o, i) => !fixes.includes(i));
        for (const [a, b] of (window.TRACK_WALLS || {})[this.level.id] || []) this.raiseWalls(a, b, Math.PI, 10);
    }

    /**
     * Curves gentle enough that a bar across the floor is seen in time and a
     * jump (guided along the chute while airborne) lands back in it
     */
    isGentle(a, b) {
        for (let s = Math.max(0, a); s < Math.min(this.length - 1, b); s += 2) {
            const i = Math.floor(s);
            if (Math.abs(this.yawRate[i]) > 0.022) return false;
            if (this.loopW[i] > 0 || this.kind[i] === 'plunge' || this.kind[i] === 'kicker' || this.kind[i] === 'chasm') return false;
        }
        return true;
    }

    /**
     * Slope nearly constant over a stretch. A jump over a valley lands early
     * and one over a crest flies long, so gaps only go on steady pitch.
     */
    isSteady(a, b, tol = 0.06) {
        let lo = Infinity, hi = -Infinity;
        for (let s = Math.max(0, a); s < Math.min(this.length - 1, b); s += 2) {
            const v = this.slope[Math.floor(s)];
            if (v < lo) lo = v;
            if (v > hi) hi = v;
        }
        return hi - lo < tol;
    }

    isStraight(a, b) {
        for (let s = Math.max(0, a); s < Math.min(this.length - 1, b); s += 2) {
            if (Math.abs(this.yawRate[Math.floor(s)]) > 0.004) return false;
        }
        return true;
    }

    addCoin(s, phi, h = 0.7) {
        this.coins.push({ s, phi, h, taken: false });
    }

    addCoinLine(s, phi0) {
        const n = 5 + Math.floor(this.rng() * 3);
        const base = phi0 === undefined ? this.rand(-0.9, 0.9) : phi0;
        const sway = this.rng() < 0.5 ? 0 : this.rand(0.3, 0.6);
        for (let k = 0; k < n; k++) {
            this.addCoin(s + k * 2.2, base + Math.sin(k * 0.8) * sway);
        }
        return n * 2.2;
    }

    addBoost(s) {
        this.boosts.push({ s, phi: this.rand(-0.4, 0.4), len: 4, width: 0.5, used: false });
    }

    /** Tall wall slab: steer around it */
    addBlock(s, phi, half = 0.42) {
        this.obstacles.push({ type: 'block', s, phi, half, h: 2.1, depth: 1.2 });
    }

    /** Low bar across the whole floor: jump it */
    addHurdle(s) {
        this.obstacles.push({ type: 'hurdle', s, phi: 0, half: 1.8, h: 0.55, depth: 0.7, jump: true });
    }

    /** Wide strip of spikes: a longer jump, timed from further out */
    addSpikes(s) {
        this.obstacles.push({ type: 'spikes', s, phi: 0, half: 1.8, h: 0.45, depth: 2.4, jump: true });
    }

    /** Beam across the floor that is on for two beats and off for two */
    addLaser(s) {
        this.obstacles.push({ type: 'laser', s, phi: 0, half: 1.8, h: 0.4, depth: 0.5, jump: true, phase: this.rng() < 0.5 ? 0 : 2 });
    }

    /** Barrel rolling up the chute toward the marble: jump it as it arrives */
    addBarrel(s) {
        const range = 26;
        const n = this.worldId >= 4 ? 2 : 1;
        for (let k = 0; k < n; k++) {
            this.obstacles.push({
                type: 'barrel', s: s + k * 16, phi: 0, half: 1.8, h: 0.6, depth: 1.2, jump: true,
                range, speed: 5 + this.difficulty * 0.12, phase: this.rng() * range, radius: 0.5
            });
        }
        return range + (n - 1) * 16;
    }

    /** Block sliding back and forth across the floor, in time with the music */
    addMover(s) {
        this.obstacles.push({
            type: 'mover', s, phi: 0, half: 0.38, h: 2.1, depth: 1.2,
            amp: this.rand(0.7, 0.95), period: 4, phase: this.rng() < 0.5 ? 0 : 2
        });
    }

    /** Ring that blocks everything except one window */
    addGate(s) {
        const win = this.rand(-0.8, 0.8);
        const half = 0.36;
        this.obstacles.push({ type: 'gate', s, phi: (win - half - 1.8) / 2, half: (win - half + 1.8) / 2, h: 2.6, depth: 0.8, gateWindow: win });
        this.obstacles.push({ type: 'gate', s, phi: (win + half + 1.8) / 2, half: (1.8 - win - half) / 2, h: 2.6, depth: 0.8, gateWindow: win });
        this.addCoin(s, win, 0.7);
    }

    addMines(s) {
        const n = 2 + Math.floor(this.rng() * 2);
        for (let k = 0; k < n; k++) {
            this.obstacles.push({ type: 'mine', s: s + k * 11, phi: this.rand(-0.9, 0.9), h: 0.75, radius: 0.6, half: 0.25, depth: 1.3 });
        }
        return n * 11;
    }

    /**
     * A gap needs speed (never in the first stretch), a gentle and steady
     * runway, and no jump obstacle close before it: a hurdle jump on the
     * steep chute flies 30 m and would come down in the gap.
     */
    gapFits(s, tol = 0.06) {
        const w = this.worldId;
        return s > 90 && this.isGentle(s - 4, s + 26 + w * 4) && this.isSteady(s - 10, s + 26 + w * 4, tol)
            && this.obstacles.every(o => !o.jump || s - o.s > 50 || o.s > s)
            && this.sections.every(sec => sec.type === 'gap' || s + 40 < sec.s0 || s - 10 > sec.s1);
    }

    // ------------------------------------------------------------------
    // Surface materials and force pieces
    // ------------------------------------------------------------------

    /** A stretch of ice, rubber, wood, metal or sand with its own feel and colour */
    addMaterial(s, kind, lenOpt) {
        const len = Math.round(lenOpt || 24 + this.rand(0, 16));
        const a = Math.floor(s);
        const id = Track.MATERIALS.indexOf(kind);
        for (let j = a; j < a + len && j < this.count; j++) if (!this.gap[j]) this.mat[j] = id;
        this.sections.push({ type: kind, s0: a, s1: a + len });
        this.addCoin(a + len * 0.5, this.rand(-0.5, 0.5), 0.7);
        return len;
    }

    /**
     * Force pieces are stretches with their own rule (see Game.applyForces):
     *   groove   whisper grooves nudge the marble back to the centre
     *   sidewind a crosswind pushes it up one wall
     *   well     a gravity well drags it toward a point, off its line
     *   bumps    ripple bumps hop it every few metres
     *   rail     a magnetic rail locks it on and speeds it up
     *   zerog    a zero-g tunnel: a quarter of the gravity, long floaty jumps
     *   spiral   a spiral funnel: the chute closes into a tube and corkscrews
     */
    addForce(s, kind, len, opt = {}) {
        len = Math.round(len);
        const d = this.difficulty;
        const a = Math.floor(s);
        const id = Track.FORCES.indexOf(kind);
        const sec = { type: kind, s0: a, s1: a + len, strength: 1 };
        switch (kind) {
            case 'groove': sec.k = 3 + d * 0.04; break;
            case 'sidewind': sec.dir = this.rng() < 0.5 ? -1 : 1; sec.strength = 7 + d * 0.16; break;
            case 'well':
                sec.sw = a + len / 2;
                sec.phiW = (this.rng() < 0.5 ? -1 : 1) * this.rand(0.7, 1.1);
                sec.strength = 11 + d * 0.22;
                // Coins on the far side reward holding your line against the pull
                for (let k = 0; k < 4; k++) this.addCoin(a + 6 + k * 5, -sec.phiW * 0.6, 0.7);
                break;
            case 'bumps': sec.spacing = 3; sec.kick = 2.2 + d * 0.03; break;
            case 'rail':
                sec.phi = (this.rng() < 0.5 ? -1 : 1) * this.rand(0.35, 0.8);
                sec.boost = 5 + d * 0.06;
                for (let k = 0; k < 3; k++) this.addCoin(a + 8 + k * 8, sec.phi, 0.7);
                break;
            case 'zerog': sec.g = 0.25; this.addCoin(a + len * 0.5, 0, 2.6); break;
            case 'spiral': {
                sec.dir = this.rng() < 0.5 ? -1 : 1;
                sec.turns = opt.turns || (d >= 40 ? 2 : 1);
                this.twistSpiral(sec);
                break;
            }
        }
        for (let j = a; j < a + len && j < this.count; j++) {
            if (this.gap[j]) continue;
            this.force[j] = id;
            this.forceIdx[j] = this.sections.length;
        }
        this.sections.push(sec);
        return len + (kind === 'spiral' ? 14 : 0);
    }

    /** Close the chute into a full tube and corkscrew it over the section */
    twistSpiral(sec) {
        const len = sec.s1 - sec.s0;
        // The walls close over a short ramp going in and open over a long one
        // coming out: at speed a marble still high on the tube wall needs the
        // time to come down before the rim is there to fall over
        const ramp = 10, rampOut = 26;
        const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
        for (let j = Math.max(0, sec.s0 - ramp); j < Math.min(this.count, sec.s1 + rampOut); j++) {
            // Walls rise to the top of the tube over the ramps
            const open = j < sec.s0 ? smooth((j - (sec.s0 - ramp)) / ramp) : j > sec.s1 ? smooth((sec.s1 + rampOut - j) / rampOut) : 1;
            const wall = 1.85 + (Math.PI - 1.85) * open;
            this.wallL[j] = Math.max(this.wallL[j], wall);
            this.wallR[j] = Math.max(this.wallR[j], wall);
            // The twist itself, eased in and out so the frames stay smooth
            if (j >= sec.s0 && j <= sec.s1) this.bank[j] += sec.dir * sec.turns * Math.PI * 2 * smooth((j - sec.s0) / len);
        }
        this.buildFrames();
    }

    /** Material at a point along the chute (0 = the neon glass) */
    materialAt(s) {
        return this.mat[Math.max(0, Math.min(this.count - 1, Math.floor(s)))];
    }

    /** Force piece at a point along the chute, or null */
    forceAt(s) {
        const i = Math.max(0, Math.min(this.count - 1, Math.floor(s)));
        const k = this.forceIdx[i];
        return k >= 0 ? this.sections[k] : null;
    }

    /** True where the chute is a closed tube (spiral funnels) */
    isTube(i) {
        return this.wallL[i] > 3.1 && this.wallR[i] > 3.1;
    }

    /**
     * Missing chute: jump from the ledge or fall. A jump at typical speed
     * carries 15-25 m, so gaps run 5-8 m in world 1 up to 13 m in world 5.
     */
    addGap(s, short = false) {
        // Shorter while the marble is still gathering speed
        const len = Math.round(this.rand(5, short || s < 180 ? 6.5 : 7 + this.worldId * 1.2));
        const a = Math.floor(s + 4);
        for (let j = a; j < a + len && j < this.count; j++) this.gap[j] = 1;
        this.sections.push({ type: 'gap', s0: a, s1: a + len });
        this.addCoin(a + len / 2, 0, 2.0);
        return len + 8;
    }

    /** Rod spinning around the pipe axis; its ends sweep the surface, so jump as one passes */
    addSpinner(s) {
        this.obstacles.push({
            type: 'spinner', s, phi: 0, half: 1.8, h: 0.55, depth: 0.5, jump: true,
            period: 2, phase: this.rng(), dir: this.rng() < 0.5 ? 1 : -1
        });
    }

    /** One side of a turn has almost no wall: too fast and you fly off */
    addLowWall(s) {
        const len = 22;
        const a = Math.floor(s);
        // Lower the outside of the current curve (or a random side on straights)
        const yr = this.yawRate[Math.min(this.count - 1, a + 8)];
        const side = yr > 0.002 ? 'R' : yr < -0.002 ? 'L' : (this.rng() < 0.5 ? 'L' : 'R');
        for (let j = a; j < a + len && j < this.count; j++) {
            const t = (j - a) / len;
            const dip = Math.sin(t * Math.PI);
            const v = 1.85 - dip * 1.0;
            if (side === 'L') this.wallL[j] = Math.min(this.wallL[j], v);
            else this.wallR[j] = Math.min(this.wallR[j], v);
        }
        this.sections.push({ type: 'lowwall', s0: a, s1: a + len, side });
        return len;
    }

    // ------------------------------------------------------------------
    // Music Runs: a chute built to a song's timeline (see BeatMap)
    // ------------------------------------------------------------------

    /**
     * Expected time to reach each sample, for a marble rolling down the middle
     * with the default marble's handling and no jumps: gravity along the slope
     * (a quarter of it in zero-g) against rolling resistance and drag, capped
     * at the game's top speed. Released at s = 9 with 8 m/s, like a real run.
     */
    timeMap() {
        const n = this.count, ds = this.ds;
        const t = new Float32Array(n), v = new Float32Array(n);
        const G = 30, K57 = 5 / 7, ROLL = 0.54, DRAG = 0.0033, CAP = 48;
        // A good player beats the rolling model by about 4% (boosts, and free
        // acceleration in the air over hurdles and cliffs): measured against the
        // playtest pilot on the game-track Music Runs
        const PACE = 0.957;
        const zg = Track.FORCES.indexOf('zerog');
        let vel = 8, time = 0;
        for (let i = 0; i < n; i++) {
            if (i <= 9) { t[i] = 0; v[i] = 8; continue; }
            const g = this.force[i] === zg ? 0.25 : 1;
            const a = -G * g * this.T[(i - 1) * 3 + 1] * K57 - ROLL - DRAG * vel * vel;
            const v2 = Math.min(CAP, Math.sqrt(Math.max(9, vel * vel + 2 * a * ds)));
            // The player's edge never takes the marble past the real top speed
            time += 2 * ds / (Math.min(CAP, vel / PACE) + Math.min(CAP, v2 / PACE));
            vel = v2;
            t[i] = time;
            v[i] = vel;
        }
        this.tAt = t;
        this.vAt = v;
        return t;
    }

    /** Where the model marble is at song time t */
    sAtTime(time) {
        const t = this.tAt;
        let lo = 9, hi = this.count - 1;
        if (time <= 0) return 9;
        if (time >= t[hi]) return hi * this.ds;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (t[mid] < time) lo = mid; else hi = mid;
        }
        return (lo + (time - t[lo]) / Math.max(1e-6, t[hi] - t[lo])) * this.ds;
    }

    /** Song time at which the model marble passes s */
    timeAtS(s) {
        const i = Math.max(0, Math.min(this.count - 2, Math.floor(s / this.ds)));
        const f = s / this.ds - i;
        return this.tAt[i] + (this.tAt[i + 1] - this.tAt[i]) * f;
    }

    speedAtS(s) {
        return this.vAt[Math.max(0, Math.min(this.count - 1, Math.round(s / this.ds)))];
    }

    /**
     * The course is planned in song time and then stretched until the model
     * marble reaches every drop's cliff crest on the drop and the finish line
     * as the song ends:
     *   - legs run between anchors (the start, each crest, the finish)
     *   - each leg's free segments come from the bars it spans: sweeping turns
     *     and runways for verses and choruses, a steep plunge for a build, a
     *     runway with a zero-g tunnel for a breakdown
     *   - fixed pieces (start straight, cliff approach, drop and run-out) keep
     *     their size; the free segments of each leg are scaled to fit, a few
     *     times over until every anchor lands within a few hundredths
     */
    buildSongCourse(map) {
        this.song = map;
        const deg = Math.PI / 180;
        const base = 20 * deg;
        const barLen = map.beat * 4;
        const finishT = Math.max(20, map.duration - 1);
        const bars = map.bars.length ? map.bars : [{ t: 0, energy: 0.8, kind: 'high' }];

        // Crests: drops with room for a fast approach and a run-out
        const crests = [];
        for (const t of map.drops) {
            if (t < 8 || t > finishT - 10) continue;
            if (crests.length && t - crests[crests.length - 1] < 10) continue;
            crests.push(t);
        }
        const kindAt = (t) => {
            let k = bars[0].t > t ? 'intro' : bars[0].kind;
            for (const b of bars) {
                if (b.t <= t) k = b.kind;
                else break;
            }
            return k === 'drop' ? 'high' : k;
        };

        // Rough durations of the fixed pieces, to plan the free windows
        const T_START = 1.6, T_APPROACH = 0.9, T_AFTER_CLIFF = 3.4;
        const anchors = [...crests, finishT];
        let dir = 1;
        const legs = anchors.map((tEnd, li) => {
            const tStart = li === 0 ? 0 : anchors[li - 1];
            const w0 = tStart + (li === 0 ? T_START : T_AFTER_CLIFF);
            const w1 = tEnd - (li < crests.length ? T_APPROACH : 0.6);
            const flex = [];
            let t = w0, k = 0;
            while (t < w1 - 0.05) {
                const span = Math.min(barLen * 2, w1 - t);
                const kind = kindAt(t + span * 0.5);
                let seg;
                if (kind === 'break') seg = { yaw: 0, slope: 22 * deg, kind: 'straight', tag: 'break' };
                else if (kind === 'build') seg = { yaw: 0, slope: 27 * deg, kind: 'drop', tag: 'build' };
                else if (kind === 'intro') seg = { yaw: 0, slope: base, kind: 'straight', tag: 'intro' };
                else {
                    // Sweeping turns, gentle enough to jump in, between runways
                    const straight = kind === 'high' ? k % 2 === 0 : k % 3 === 0;
                    if (straight) seg = { yaw: 0, slope: base, kind: 'straight', tag: kind };
                    else {
                        dir = -dir;
                        seg = { yaw: dir / this.rand(50, 85), slope: base * this.rand(0.92, 1.1), kind: 'turn', tag: kind };
                    }
                }
                seg.dur = Math.max(0.3, span);
                flex.push(seg);
                t += span;
                k++;
            }
            if (!flex.length) flex.push({ yaw: 0, slope: base, kind: 'straight', tag: 'high', dur: 0.5 });
            return { tStart, tEnd, flex, scale: 1, crest: li < crests.length };
        });

        const vGuess = (t) => Math.min(44, 12 + 5 * t);
        const assemble = () => {
            const segs = [{ len: 40, yaw: 0, slope: base, kind: 'straight' }];
            for (const leg of legs) {
                leg.flexFrom = segs.length;
                let tt = leg.tStart;
                for (const f of leg.flex) {
                    f.len = Math.max(12, f.dur * vGuess(tt) * leg.scale);
                    segs.push(f);
                    tt += f.dur;
                }
                leg.flexTo = segs.length;
                if (leg.crest) {
                    segs.push({ len: 36, yaw: 0, slope: 4 * deg, kind: 'flat' });
                    segs.push({ len: 60, yaw: 0, slope: 54 * deg, kind: 'cliff' });
                    segs.push({ len: 100, yaw: 0, slope: 9 * deg, kind: 'runout' });
                }
            }
            segs.push({ len: 50, yaw: 0, slope: base * 0.6, kind: 'finish' });
            return segs;
        };
        const startOf = (segs, idx) => {
            let s = 0;
            for (let k = 0; k < idx; k++) s += Math.round(segs[k].len / this.ds) * this.ds;
            return s;
        };

        for (let iter = 0; iter < 8; iter++) {
            const segs = assemble();
            this.buildCenterline(segs);
            this.markBreaks(segs, barLen);
            this.timeMap();
            let worst = 0;
            legs.forEach((leg, li) => {
                const sFrom = li === 0 ? 9 : startOf(segs, legs[li - 1].flexTo + 1); // previous crest
                const sTo = leg.crest ? startOf(segs, leg.flexTo + 1) : this.length - 30;
                const fA = startOf(segs, leg.flexFrom), fB = startOf(segs, leg.flexTo);
                const model = this.timeAtS(sTo) - this.timeAtS(sFrom);
                const flexModel = Math.max(0.2, this.timeAtS(fB) - this.timeAtS(fA));
                const target = leg.tEnd - leg.tStart;
                worst = Math.max(worst, Math.abs(model - target));
                const want = Math.max(0.4, target - (model - flexModel));
                leg.scale *= Math.max(0.5, Math.min(1.8, want / flexModel));
            });
            if (worst < 0.04) break;
        }
        this.crestTimes = crests;
        this.placeSongContent(map);
    }

    /** Zero-g through the first two bars of each breakdown (no coins: those come later) */
    markBreaks(segs, barLen) {
        const zg = Track.FORCES.indexOf('zerog');
        let at = 0, runStart = -1, runEnd = -1;
        const flush = () => {
            if (runStart < 0) return;
            const s0 = Math.round(runStart), s1 = Math.round(runEnd);
            const sec = { type: 'zerog', s0, s1, g: 0.25, strength: 1 };
            for (let j = s0; j < s1 && j < this.count; j++) {
                this.force[j] = zg;
                this.forceIdx[j] = this.sections.length;
            }
            this.sections.push(sec);
            runStart = -1;
        };
        for (const s of segs) {
            const len = Math.round(s.len / this.ds) * this.ds;
            if (s.tag === 'break') {
                if (runStart < 0) { runStart = at; runEnd = at + len; }
                // Only the opening of a long breakdown floats; the rest rolls
                else if (runEnd - runStart < len * 1.5) runEnd = at + len;
            } else flush();
            at += len;
        }
        flush();
    }

    zeroGAt(s) {
        return this.force[Math.max(0, Math.min(this.count - 1, Math.floor(s)))] === Track.FORCES.indexOf('zerog');
    }

    /**
     * Features on the beat. The model marble's timeline maps each beat to a
     * point on the chute; a hurdle sits 0.3 s past a downbeat, so a jump on
     * the beat clears it at the top of the hop. Lasers are set to be lit, and
     * spinners to sweep the floor, as the marble arrives.
     */
    placeSongContent(map) {
        this.coins = [];
        this.obstacles = [];
        this.boosts = [];
        const beat = map.beat;
        const bars = map.bars;
        const w = this.worldId;
        const inCliff = (s, pad = 0) => this.sections.some(sec => sec.type === 'cliff' && s > sec.s0 - pad && s < sec.s1 + pad);
        let lastJump = -1e9;
        const canJump = (s) => s > 60 && s < this.finishS - 40 && !inCliff(s, 20) && s - lastJump > 40 &&
            this.isGentle(s - 6, s + 26) && !this.zeroGAt(s) && !this.zeroGAt(s + 25);
        const coinAt = (t, phi, h = 0.7) => {
            const s = this.sAtTime(t);
            if (s < 20 || s > this.finishS - 10 || inCliff(s, 4)) return;
            this.addCoin(s, phi, h);
        };
        const jumpAt = (t, type) => {
            const s = this.sAtTime(t + 0.3);
            if (!canJump(s)) return false;
            const ta = this.timeAtS(s);
            if (type === 'laser') {
                // Lit (two beats on, two off) right as the marble arrives
                this.obstacles.push({ type: 'laser', s, phi: 0, half: 1.8, h: 0.4, depth: 0.5, jump: true, phase: ((1 - ta / beat) % 4 + 4) % 4 });
            } else if (type === 'spinner') {
                // An end of the rod sweeps the floor as the marble arrives
                const period = 2;
                const dir = this.rng() < 0.5 ? 1 : -1;
                const ph = -((ta / beat) / period);
                this.obstacles.push({ type: 'spinner', s, phi: 0, half: 1.8, h: 0.55, depth: 0.5, jump: true, period, phase: ph - Math.floor(ph), dir });
            } else if (type === 'spikes') {
                this.addSpikes(s);
            } else {
                this.addHurdle(s);
            }
            lastJump = s;
            return true;
        };

        let breakK = 0;
        bars.forEach((b, bi) => {
            const t0 = b.t;
            if (this.sAtTime(t0) >= this.finishS - 30) return;
            const weave = (k) => Math.sin((bi * 4 + k) * 0.55) * 0.55;
            switch (b.kind) {
                case 'intro':
                    coinAt(t0 + beat, weave(1));
                    coinAt(t0 + beat * 3, weave(3));
                    break;
                case 'build': {
                    // A rising line on every beat, and a boost into the drop
                    for (let k = 0; k < 4; k++) coinAt(t0 + k * beat, 0, 0.7 + (k / 4) * 0.8);
                    const next = bars[bi + 1];
                    if (next && next.kind === 'drop') {
                        const s = this.sAtTime(t0 + beat);
                        if (!inCliff(s, 6)) this.boosts.push({ s, phi: 0, len: 4, width: 0.6, used: false });
                    }
                    break;
                }
                case 'break': {
                    // Coins float in an arc across the breakdown, one per beat
                    for (let k = 0; k < 4; k++, breakK++) {
                        const t = t0 + k * beat;
                        const s = this.sAtTime(t);
                        coinAt(t, Math.sin(breakK * 0.4) * 0.4, this.zeroGAt(s) ? 1.2 + 1.6 * Math.abs(Math.sin(breakK * 0.39)) : 0.7);
                    }
                    break;
                }
                case 'drop':
                    break;
                default: {
                    breakK = 0;
                    // Phrase starts stay clear (they are the checkpoints); jumps
                    // come on the second and fourth bar of each four
                    const p = bi % 4;
                    const high = b.kind === 'high';
                    let placed = false;
                    if (p === 1) placed = jumpAt(t0, 'hurdle');
                    else if (p === 3 && high) placed = jumpAt(t0, w >= 3 ? 'laser' : 'spikes');
                    else if (bi % 8 === 6 && high && w >= 2) placed = jumpAt(t0, 'spinner');
                    if (!placed) {
                        // Off-beat coins between the jumps
                        for (let k = 0; k < 4; k++) coinAt(t0 + (k + 0.5) * beat, weave(k));
                    }
                    if (bi % 8 === 4 && high) {
                        const s = this.sAtTime(t0 + beat * 2);
                        if (!inCliff(s, 8) && s < this.finishS - 40) this.boosts.push({ s, phi: weave(2) * 0.6, len: 4, width: 0.5, used: false });
                    }
                }
            }
        });
        this.obstacles.sort((p, q) => p.s - q.s);
        this.coins.sort((p, q) => p.s - q.s);
        this.boosts.sort((p, q) => p.s - q.s);

        // Checkpoints: the start of every eight-bar phrase and the bottom of
        // every cliff, away from anything that needs a run-up
        const cps = [];
        const clear = (s) => !inCliff(s, 2) && !this.zeroGAt(s) && this.obstacles.every(o => Math.abs(o.s - s) > 25) && s < this.finishS - 60;
        bars.forEach((b, bi) => {
            if (bi === 0 || bi % 8) return;
            const s = this.sAtTime(b.t);
            if (s > 40 && clear(s)) cps.push(s);
        });
        for (const sec of this.sections) if (sec.type === 'cliff' && clear(sec.s1 + 10)) cps.push(sec.s1 + 10);
        cps.sort((p, q) => p - q);
        this.checkpoints = cps.map(s => ({ s, t: this.timeAtS(s), v: this.speedAtS(s) }));
    }

    // ------------------------------------------------------------------
    // Queries used by the simulation
    // ------------------------------------------------------------------

    /** Current angular centre of an obstacle (movers slide with the beat) */
    obstaclePhi(o, clock, beatLength) {
        if (o.type !== 'mover') return o.phi;
        const beats = clock / beatLength + o.phase;
        return o.amp * Math.sin((beats / o.period) * Math.PI * 2);
    }

    /** Current position along the chute (barrels roll back up it) */
    obstacleS(o, clock) {
        if (o.type !== 'barrel') return o.s;
        const t = (clock * o.speed + o.phase) % o.range;
        return o.s + o.range - t;
    }

    /** Spinner rod angle in the cross-section (0 = pointing at the floor) */
    spinnerAngle(o, clock, beatLength) {
        return o.dir * ((clock / beatLength) / o.period + o.phase) * Math.PI * 2;
    }

    /** Lasers are only deadly while lit: two beats on, two off */
    obstacleActive(o, clock, beatLength) {
        if (o.type !== 'laser') return true;
        const beats = clock / beatLength + o.phase;
        return ((beats % 4) + 4) % 4 < 2;
    }

    /** Laser brightness for the renderer: 0 off, up to 1, with a warning flicker before it fires */
    laserLevel(o, clock, beatLength) {
        const c = (((clock / beatLength + o.phase) % 4) + 4) % 4;
        if (c < 2) return Math.min(1, c * 10);
        return c > 3.5 ? (Math.floor(clock * 24) % 2 ? 0.35 : 0) : 0;
    }
}

Track.PIPE_R = PIPE_R;
Track.sm01 = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
Track.MATERIALS = ['', 'ice', 'rubber', 'wood', 'metal', 'sand'];
Track.FORCES = ['', 'groove', 'sidewind', 'well', 'bumps', 'rail', 'zerog', 'spiral', 'cliff', 'loop', 'plunge', 'kicker', 'helix'];
/** The big set pieces, and the level (difficulty 1-60) each first appears on */
Track.SPECIALS = ['loop', 'plunge', 'kicker', 'helix'];
Track.SPECIAL_AT = { loop: 9, plunge: 16, kicker: 20, helix: 30 };
/** Sections nothing else is placed in or just before */
Track.CLEAR = ['cliff', 'loop', 'plunge', 'kicker', 'helix'];
/** Difficulty (1..50) on which each piece first appears */
Track.DEBUTS = { 7: 'groove', 11: 'ice', 12: 'sidewind', 13: 'sand', 14: 'well', 15: 'rubber', 17: 'bumps', 21: 'metal', 22: 'rail', 23: 'wood', 25: 'zerog', 28: 'spiral' };
window.Track = Track;
