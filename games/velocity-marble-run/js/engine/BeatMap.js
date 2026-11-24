/**
 * BeatMap - the musical map a Music Run is built from
 *
 *   { title, duration, bpm, beat, firstBeat, beats: [t], bars: [{ t, energy, kind }],
 *     drops: [t], source: 'file' | 'engine', themeId }
 *
 * Bar kinds: 'intro', 'normal', 'high', 'build', 'break', 'drop' (the bar a
 * drop lands on). Track.buildSongCourse turns the map into a chute: a cliff
 * crest on every drop, zero-g tunnels through breakdowns, boosts and rising
 * coin lines in builds, hurdles timed so a jump on the beat clears them.
 *
 * BeatMap.analyze(audioBuffer) listens to a song file:
 *   1. per 10 ms frame, the energy of the whole signal and of the kick/bass
 *      band (two one-pole low-passes at 150 Hz)
 *   2. an onset curve: rises in log energy, mostly from the bass band
 *   3. tempo from the onset curve's autocorrelation, weighted toward dance
 *      tempos and folded into 80-170 BPM
 *   4. period and phase refined to a hundredth of a frame by summing the
 *      onset curve along candidate beat grids (a three-minute song needs
 *      that precision or the grid drifts by a beat)
 *   5. the bar's downbeat from where the loudness changes, then per-bar
 *      loudness, from which drops, builds and breakdowns are read
 *
 * BeatMap.fromTheme(id) describes one of the game's own tracks exactly: the
 * MusicEngine drop is a 32-bar cycle (a 4-bar rise, the drop, a second drop
 * that builds again, the peak, a short break), so its drops land on bars 4,
 * 12 and 20 of every cycle.
 */
const BeatMap = {
    MAX_SECONDS: 240,

    analyze(buffer, title = 'Your song') {
        const sr = buffer.sampleRate;
        const chans = [];
        for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c));
        const nc = chans.length;
        const fullDuration = buffer.duration;
        const duration = Math.min(fullDuration, this.MAX_SECONDS);
        // About 100 frames a second; the exact rate matters (22.05 kHz files
        // would otherwise drift a quarter beat over a song)
        const hop = Math.round(sr / 100);
        const fps = sr / hop;
        const nF = Math.floor(Math.min(buffer.length, duration * sr) / hop);
        if (nF < fps * 8) throw new Error('This song is too short for a run (it needs at least 8 seconds).');

        // 1. Frame energies: whole signal, bass band (kick and bass) and high
        // band (hats, leads, stabs: in mastered dance music the structure often
        // shows there more than in overall loudness)
        const eLow = new Float32Array(nF), eAll = new Float32Array(nF), eHigh = new Float32Array(nF);
        const a = 1 - Math.exp(-2 * Math.PI * 150 / sr);
        const aH = 1 - Math.exp(-2 * Math.PI * 2500 / sr);
        let lp1 = 0, lp2 = 0, lh = 0, i = 0;
        for (let f = 0; f < nF; f++) {
            let sl = 0, sa = 0, sh = 0;
            for (let k = 0; k < hop; k++, i++) {
                let x = 0;
                for (let c = 0; c < nc; c++) x += chans[c][i];
                x /= nc;
                lp1 += a * (x - lp1);
                lp2 += a * (lp1 - lp2);
                lh += aH * (x - lh);
                const hp = x - lh;
                sl += lp2 * lp2;
                sa += x * x;
                sh += hp * hp;
            }
            eLow[f] = sl / hop;
            eAll[f] = sa / hop;
            eHigh[f] = sh / hop;
        }

        // 2. Onset curve, with the slow trend removed
        const lg = (e) => Math.log(1 + 1e4 * e);
        const raw = new Float32Array(nF);
        for (let f = 1; f < nF; f++) {
            raw[f] = Math.max(0, lg(eLow[f]) - lg(eLow[f - 1])) + 0.5 * Math.max(0, lg(eAll[f]) - lg(eAll[f - 1]));
        }
        const pre = new Float64Array(nF + 1);
        for (let f = 0; f < nF; f++) pre[f + 1] = pre[f] + raw[f];
        const o = new Float32Array(nF);
        const W = 25;
        for (let f = 0; f < nF; f++) {
            const lo = Math.max(0, f - W), hi = Math.min(nF, f + W + 1);
            o[f] = Math.max(0, raw[f] - (pre[hi] - pre[lo]) / (hi - lo));
        }

        // 3. Tempo by autocorrelation, weighted toward 120 BPM
        const minLag = Math.floor(fps * 60 / 200), maxLag = Math.ceil(fps * 60 / 55);
        const ac = new Float32Array(maxLag + 2);
        for (let L = minLag; L <= maxLag + 1; L++) {
            let s = 0;
            for (let f = L; f < nF; f++) s += o[f] * o[f - L];
            ac[L] = s / (nF - L);
        }
        let bestL = minLag, bestScore = -1;
        for (let L = minLag + 1; L <= maxLag; L++) {
            const bpm = 60 * fps / L;
            const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.9, 2));
            const sc = ac[L] * w;
            if (sc > bestScore) { bestScore = sc; bestL = L; }
        }
        const y0 = ac[bestL - 1], y1 = ac[bestL], y2 = ac[bestL + 1];
        const den = y0 - 2 * y1 + y2;
        let period = bestL + (den !== 0 ? 0.5 * (y0 - y2) / den : 0);
        let bpm = 60 * fps / period;
        while (bpm < 80) bpm *= 2;
        while (bpm > 170) bpm /= 2;
        period = 60 * fps / bpm;

        // 4. Refine period and phase on the onset curve itself
        const oAt = (x) => {
            const k = Math.floor(x);
            if (k < 0 || k + 1 >= nF) return 0;
            const t = x - k;
            return o[k] * (1 - t) + o[k + 1] * t;
        };
        const comb = (P, ph) => {
            let s = 0;
            for (let x = ph; x < nF - 1; x += P) s += oAt(x);
            return s;
        };
        let best = { P: period, ph: 0, sc: -1 };
        for (let P = period * 0.985; P <= period * 1.015; P += 0.02) {
            for (let ph = 0; ph < P; ph += 0.5) {
                const sc = comb(P, ph);
                if (sc > best.sc) best = { P, ph, sc };
            }
        }
        const coarse = best;
        for (let P = coarse.P - 0.03; P <= coarse.P + 0.03; P += 0.002) {
            for (let ph = coarse.ph - 0.6; ph <= coarse.ph + 0.6; ph += 0.05) {
                if (ph < 0) continue;
                const sc = comb(P, ph);
                if (sc > best.sc) best = { P, ph, sc };
            }
        }
        // Kick or offbeat bass? Both rise in the bass band, but the kick carries
        // the bigger punch: keep the grid whose beats land on the louder hits
        const punch = (ph) => {
            let s = 0;
            for (let x = ph; x < nF - 3; x += best.P) {
                const k = Math.round(x);
                let m = 0;
                for (let d = 0; d <= 3; d++) m = Math.max(m, eLow[k + d] || 0);
                s += Math.sqrt(m);
            }
            return s;
        };
        const half = best.ph + best.P / 2 < best.P ? best.ph + best.P / 2 : best.ph - best.P / 2;
        if (punch(half) > punch(best.ph) * 1.08) best.ph = half;
        const beat = best.P / fps;
        bpm = 60 / beat;
        const beats = [];
        for (let x = best.ph; x < nF; x += best.P) beats.push(x / fps);

        // 5. Downbeat: sections change on bar lines, so bars cut on the right
        // beat show the most contrast from one bar to the next. Squared: a
        // step cut across two bars splits into two smaller changes, which sum
        // to the same absolute change but a smaller squared one
        const beatEnergy = beats.map((t, k) => {
            const f0 = Math.floor(t * fps), f1 = Math.min(nF, Math.floor((beats[k + 1] || duration) * fps));
            let s = 0;
            for (let f = f0; f < f1; f++) s += eAll[f];
            return Math.log(1e-9 + s / Math.max(1, f1 - f0));
        });
        // Silence before the first note would otherwise dwarf every real change
        const sortedBE = [...beatEnergy].sort((p, q) => p - q);
        const floorBE = sortedBE[Math.floor(sortedBE.length / 2)] - 4.6;
        for (let k = 0; k < beatEnergy.length; k++) beatEnergy[k] = Math.max(floorBE, beatEnergy[k]);
        let down = 0, bestContrast = -1;
        for (let j = 0; j < 4; j++) {
            let prev = null, contrast = 0;
            for (let k = j; k + 4 <= beats.length; k += 4) {
                const e = (beatEnergy[k] + beatEnergy[k + 1] + beatEnergy[k + 2] + beatEnergy[k + 3]) / 4;
                if (prev !== null) contrast += (e - prev) * (e - prev);
                prev = e;
            }
            if (contrast > bestContrast) { bestContrast = contrast; down = j; }
        }

        // Per-bar loudness (whole signal, bass and highs), mapped to 0..1 over the song
        const barStarts = [];
        for (let k = down; k + 4 <= beats.length; k += 4) barStarts.push(beats[k]);
        const barDb = [], barLow = [], barHigh = [];
        for (let b = 0; b < barStarts.length; b++) {
            const f0 = Math.floor(barStarts[b] * fps);
            const f1 = Math.min(nF, Math.floor((barStarts[b + 1] || (barStarts[b] + beat * 4)) * fps));
            let sa = 0, sl = 0, sh = 0;
            for (let f = f0; f < f1; f++) { sa += eAll[f]; sl += eLow[f]; sh += eHigh[f]; }
            const n = Math.max(1, f1 - f0);
            barDb.push(10 * Math.log10(1e-9 + sa / n));
            barLow.push(10 * Math.log10(1e-9 + sl / n));
            barHigh.push(10 * Math.log10(1e-12 + sh / n));
        }
        // Loudness relative to the song's loud parts. The range is at least
        // 8 dB, so an evenly loud song reads as evenly loud instead of having
        // its small wobbles stretched into drops and breakdowns
        const norm = (arr) => {
            const sorted = [...arr].sort((p, q) => p - q);
            const lo = sorted[Math.floor(sorted.length * 0.1)], hi = sorted[Math.floor(sorted.length * 0.95)];
            const span = Math.max(8, hi - lo);
            return arr.map(v => Math.max(0, Math.min(1, 1 - (hi - v) / span)));
        };
        const nAll = norm(barDb), nLow = norm(barLow), nHigh = norm(barHigh);
        const energy = nAll.map((v, b) => 0.3 * v + 0.3 * nLow[b] + 0.4 * nHigh[b]);
        const map = this.label(barStarts, energy, beat, nLow);

        // Each drop to the exact beat: where bass and highs jump the most, from a
        // beat before the bar-level estimate to a bar after it (a build's
        // accelerating snare roll makes earlier beats jump too, so look mostly later)
        const beatBand = (arr) => beats.map((t, k) => {
            const f0 = Math.floor(t * fps), f1 = Math.min(nF, Math.floor((beats[k + 1] || duration) * fps));
            let s = 0;
            for (let f = f0; f < f1; f++) s += arr[f];
            return Math.log(1e-9 + s / Math.max(1, f1 - f0));
        });
        const bLow = beatBand(eLow), bHigh = beatBand(eHigh);
        map.drops = map.drops.map((t) => {
            const k0 = Math.round((t - beats[0]) / beat);
            let bestK = k0, bestJ = -Infinity;
            for (let k = Math.max(1, k0 - 1); k <= Math.min(beats.length - 1, k0 + 4); k++) {
                const j = (bLow[k] - bLow[k - 1]) + 0.5 * (bHigh[k] - bHigh[k - 1]);
                if (j > bestJ) { bestJ = j; bestK = k; }
            }
            return beats[bestK];
        });
        return Object.assign(map, {
            title, duration, fullDuration, bpm: +bpm.toFixed(1), beat, firstBeat: beats[0] || 0, beats, source: 'file'
        });
    },

    /** Section labels from per-bar energy: drops, builds, breakdowns */
    label(barStarts, energy, beat, low = null) {
        const n = barStarts.length;
        const avg = (a, b) => {
            let s = 0, c = 0;
            for (let k = Math.max(0, a); k <= Math.min(n - 1, b); k++) { s += energy[k]; c++; }
            return c ? s / c : 0;
        };
        const sortedE = [...energy].sort((p, q) => p - q);
        const median = sortedE[Math.floor(sortedE.length / 2)] || 0.5;
        // Quiet relative to this song: a heavily mastered track's breakdown may
        // only lose its highs, a dynamic one drops the bass too
        const quiet = Math.max(0.42, median - 0.25);
        const kinds = energy.map(e => (e >= 0.62 ? 'high' : 'normal'));
        // Intro: until the music first gets going
        let firstLoud = energy.findIndex(e => e >= 0.5);
        if (firstLoud < 0) firstLoud = 0;
        for (let b = 0; b < Math.min(firstLoud, 8); b++) kinds[b] = 'intro';
        // Drops: a sharp, sustained rise in loudness. Risers lift the bars
        // before a drop too, so take the strongest lift in each neighbourhood
        // (the four-bar rise plus the single-bar jump onto the drop)
        const lift = (b) => avg(b, b + 3) - avg(b - 4, b - 1) + 0.5 * (energy[b] - energy[b - 1]);
        // A build's snare roll and riser fill the highs before the drop; the
        // drop itself is where the bass comes back in
        const snapToBass = (b) => {
            if (!low) return b;
            let best = b, jump = 0.15;
            for (let k = Math.max(1, b - 1); k <= Math.min(n - 1, b + 3); k++) {
                const j = low[k] - low[k - 1];
                if (j > jump) { jump = j; best = k; }
            }
            return best;
        };
        const drops = [];
        for (let b = 4; b < n - 2; b++) {
            const L = lift(b);
            if (L < 0.24 || avg(b, b + 3) < 0.6) continue;
            let peak = true;
            for (let k = Math.max(4, b - 3); k <= Math.min(n - 3, b + 3); k++) if (k !== b && lift(k) > L) peak = false;
            if (!peak) continue;
            const d = snapToBass(b);
            if (drops.length && d - drops[drops.length - 1] < 12) {
                if (L > lift(drops[drops.length - 1])) drops[drops.length - 1] = d;
                continue;
            }
            drops.push(d);
        }
        // A song with no clear drop still gets its biggest lift as one
        if (!drops.length && n > 16) {
            let bestB = -1, bestRise = 0.1;
            for (let b = 8; b < n - 4; b++) {
                const rise = avg(b, b + 3) - avg(b - 4, b - 1);
                if (rise > bestRise) { bestRise = rise; bestB = b; }
            }
            if (bestB > 0) drops.push(bestB);
        }
        // Breakdowns: four or more quiet bars after the intro
        for (let b = firstLoud; b < n;) {
            if (avg(b - 1, b + 1) < quiet) {
                let e = b;
                while (e < n && avg(e - 1, e + 1) < quiet) e++;
                if (e - b >= 4) for (let k = b; k < e; k++) kinds[k] = 'break';
                b = e + 1;
            } else b++;
        }
        // Builds lead into each drop
        for (const d of drops) {
            for (let k = Math.max(0, d - 4); k < d; k++) if (kinds[k] !== 'intro') kinds[k] = 'build';
            kinds[d] = 'drop';
        }
        return {
            bars: barStarts.map((t, b) => ({ t, energy: +energy[b].toFixed(3), kind: kinds[b] })),
            drops: drops.map(b => barStarts[b])
        };
    },

    /** The game's own tracks, described exactly from the MusicEngine arrangement */
    fromTheme(themeId, cycles = 2) {
        const th = MusicEngine.THEMES[themeId] || MusicEngine.THEMES[1];
        const plan = MusicEngine.planOf(th);
        const beat = 60 / th.bpm;
        const bar = beat * 4;
        const nBars = plan.total * cycles;
        const bars = [];
        for (let b = 0; b < nBars; b++) {
            const P = plan.pos(b);
            const kind = P.dropStart ? 'drop' : P.kind === 'rise' || P.kind === 'build' || P.lastBuild ? 'build' : P.kind === 'break' ? 'break' : 'high';
            const energy = P.kind === 'rise' ? 0.5 + P.u * 0.4 : P.kind === 'build' ? 0.7 + P.u * 0.1 : P.kind === 'break' ? (P.last ? 0.6 : 0.4) : P.kind === 'peak' ? 1 : 0.82 + P.dropNo * 0.04;
            bars.push({ t: b * bar, energy, kind });
        }
        const beats = [];
        for (let k = 0; k < nBars * 4; k++) beats.push(k * beat);
        return {
            title: th.name,
            duration: nBars * bar + 1.5,
            bpm: th.bpm,
            beat,
            firstBeat: 0,
            beats,
            bars,
            drops: bars.filter(b => b.kind === 'drop').map(b => b.t),
            source: 'engine',
            themeId
        };
    },

    /** A world for a song: its tempo picks the scenery */
    worldFor(map) {
        if (map.source === 'engine') {
            const th = MusicEngine.THEMES[map.themeId];
            return (th && th.world) || Number(map.themeId) || 1;
        }
        const b = map.bpm;
        return b < 100 ? 1 : b < 118 ? 2 : b < 128 ? 3 : b < 140 ? 4 : 5;
    },

    /** Short stable id for a song file, so its best score can be kept */
    songId(map) {
        let h = 2166136261;
        const key = `${map.title}|${Math.round(map.fullDuration || map.duration)}|${map.bpm}`;
        for (let k = 0; k < key.length; k++) { h ^= key.charCodeAt(k); h = Math.imul(h, 16777619); }
        return (h >>> 0).toString(36);
    }
};

/**
 * SongPlayer - plays a decoded song for a Music Run and keeps visuals and
 * hazards on its beat. Position comes from the audio clock, so lasers,
 * spinners and the neon stay on the music even when frames drop.
 */
class SongPlayer {
    constructor(ctx, destination) {
        this.ctx = ctx;
        this.out = ctx.createGain();
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 20000;
        this.out.connect(this.filter);
        this.filter.connect(destination);
        this.buffer = null;
        this.map = null;
        this.src = null;
        this.playing = false;
        this.offset = 0;
        this.startAt = 0;
    }

    load(buffer, map) {
        this.stop(0);
        this.buffer = buffer;
        this.map = map;
        this.offset = 0;
    }

    get latency() {
        return this.ctx.outputLatency || this.ctx.baseLatency || 0;
    }

    play(offset = 0, delay = 0.03) {
        if (!this.buffer) return;
        this.stop(0.03);
        const when = this.ctx.currentTime + delay;
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffer;
        src.connect(this.out);
        const off = Math.max(0, offset);
        // A negative offset (a lead-in before the song starts) delays the start instead
        src.start(when + Math.max(0, -offset), off);
        this.out.gain.cancelScheduledValues(when);
        this.out.gain.setValueAtTime(0.0001, when);
        this.out.gain.exponentialRampToValueAtTime(1, when + 0.05);
        this.src = src;
        this.startAt = when - offset;
        this.playing = true;
    }

    stop(fade = 0.15) {
        if (this.src) {
            const now = this.ctx.currentTime;
            const src = this.src;
            this.out.gain.cancelScheduledValues(now);
            this.out.gain.setValueAtTime(Math.max(0.0001, this.out.gain.value), now);
            this.out.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.01, fade));
            try { src.stop(now + Math.max(0.01, fade) + 0.02); } catch (e) { /* already stopped */ }
            this.src = null;
        }
        if (this.playing) this.offset = this.position();
        this.playing = false;
    }

    pause() {
        if (!this.playing) return;
        this.offset = this.position();
        this.stop(0.05);
        this.paused = true;
    }

    resume() {
        if (!this.paused) return;
        this.paused = false;
        this.play(this.offset);
    }

    /** Song position in seconds, as heard */
    position() {
        if (!this.playing) return this.offset;
        return this.ctx.currentTime - this.latency - this.startAt;
    }

    setMuffled(muffled, time = 0.3) {
        const f = this.filter.frequency;
        const now = this.ctx.currentTime;
        f.cancelScheduledValues(now);
        f.setValueAtTime(f.value, now);
        f.exponentialRampToValueAtTime(muffled ? 380 : 20000, now + time);
    }

    getPulse() {
        if (!this.playing || !this.map) return 0;
        const t = this.position();
        const m = this.map;
        if (t < m.firstBeat) return 0;
        const k = Math.floor((t - m.firstBeat) / m.beat);
        const since = t - (m.firstBeat + k * m.beat);
        return Math.exp(-since * 7);
    }

    /** True through the song's loud bars (a drop, and the high-energy bars after it) */
    inDropHit() {
        if (!this.playing || !this.map) return false;
        const t = this.position();
        let kind = 'intro';
        for (const b of this.map.bars) {
            if (b.t <= t) kind = b.kind;
            else break;
        }
        return kind === 'drop' || kind === 'high';
    }

    getDropFlash() {
        if (!this.playing || !this.map) return 0;
        const t = this.position();
        for (const d of this.map.drops) {
            const dt = t - d;
            if (dt >= 0 && dt < 1.5) return Math.exp(-dt * 3);
        }
        return 0;
    }
}

window.BeatMap = BeatMap;
window.SongPlayer = SongPlayer;
