/**
 * MusicEngine - Procedural EDM soundtrack driven by gameplay
 *
 * Everything is synthesized with the Web Audio API and scheduled ahead of time
 * on the audio clock (lookahead scheduler), so timing stays tight even when the
 * main thread is busy rendering.
 *
 * Arrangement sections:
 *   menu  - groove at menu tempo: soft kick, bass, pads, the hook on a pluck
 *   intro - level loaded, waiting for the drop: filtered pads, hats, hook teaser
 *   build - riser + snare roll, lands on the drop by itself
 *   drop  - the song, from the marble's release: each world's own form (theme.plan)
 *             rise  0-3    a driving, filtered groove that builds (snare roll,
 *                          riser, the filter opening) and stops for a beat
 *             d1    4-11   the drop: impact, full bass and stabs, hook A;
 *                          bar 11 is a one-bar build into
 *             d2    12-19  the rhythm switches, hook B; builds again over 18-19
 *             peak  20-27  the biggest drop, hook A doubled an octave up
 *             brk   28-31  a short breakdown that climbs back into the rise
 *           Harmony runs four bars ahead, so every drop lands on the first chord
 *   outro - level complete: pads and plucks
 *
 * Each world has its own key, tempo, chord progression, two composed hooks,
 * stab rhythm and bass pattern, so the five worlds sound like five tracks.
 * The compositions live in MusicThemes.js.
 *
 * Backing tracks: each section of each world also exists pre-produced
 * (music/<theme>-<section>.mp3, rendered by tools/music/render.mjs with far
 * richer synthesis and mixing than live Web Audio allows). When a section's
 * track is loaded it plays on the bar grid and the engine adds only the live
 * lead hook (in the marble's voice) and the beat pulse on top; until then,
 * or if the files cannot load, the engine plays everything procedurally.
 *
 * The renderer reads getPulse()/getDropFlash() to sync visuals to the kick.
 */
class MusicEngine {
    constructor(context, destination) {
        this.ctx = context;
        this.destination = destination;

        this.themes = MusicEngine.THEMES;
        this.theme = this.themes.menu;

        this.section = 'menu';
        this.pendingSection = null;
        this.pendingQuantize = 'bar';
        this.playing = false;
        this.intensity = 0.5;

        // Scheduler
        this.lookahead = 0.14;
        this.scheduleInterval = 25;
        this.timer = null;
        this.step = 0;
        this.bar = 0;
        this.nextStepTime = 0;
        this.sectionBar = 0;

        // Visual sync
        this.kickTimes = [];
        this.dropTime = -Infinity;

        // Pre-rendered backing tracks: `${theme}-${section}` -> { buffer, start, loopLen, bars } or a pending promise
        this.stems = new Map();
        this.backing = null;
        this.loopBar = 0;
        this.themeKey = 'menu';
        this.stemBase = 'music/';

        this.buildGraph();
    }

    // ------------------------------------------------------------------
    // Audio graph
    // ------------------------------------------------------------------

    buildGraph() {
        const ctx = this.ctx;
        this.hasPan = typeof ctx.createStereoPanner === 'function';

        // Live synths: master -> air shelf -> glue compressor -> soft limiter -> post
        // Backing tracks (already mastered): stemBus -> post
        // post: muffle filter (pause/fail) -> out (fades) -> destination
        // Mix level leaves the limiter headroom: it only catches peaks, so the
        // track keeps its dynamics instead of being squashed flat
        this.master = ctx.createGain();
        this.master.gain.value = 0.5;
        this.out = ctx.createGain();
        this.out.gain.value = 1;
        this.stemBus = ctx.createGain();
        this.stemBus.gain.value = 0.82;
        // Over a backing track the live lead is mixed lower: it plays on top of a full mix
        this.LIVE_GAIN = 0.5;
        this.LIVE_GAIN_BACKED = 0.24;
        // Peak catcher after live and backing are summed
        this.finalLimiter = ctx.createDynamicsCompressor();
        this.finalLimiter.threshold.value = -2;
        this.finalLimiter.knee.value = 0;
        this.finalLimiter.ratio.value = 20;
        this.finalLimiter.attack.value = 0.002;
        this.finalLimiter.release.value = 0.1;

        this.muffle = ctx.createBiquadFilter();
        this.muffle.type = 'lowpass';
        this.muffle.frequency.value = 20000;
        this.muffle.Q.value = 0.7;

        this.glue = ctx.createDynamicsCompressor();
        this.glue.threshold.value = -12;
        this.glue.knee.value = 10;
        this.glue.ratio.value = 4;
        this.glue.attack.value = 0.004;
        this.glue.release.value = 0.14;

        // Gentle tanh limiter: loud, never harsh
        this.limiter = ctx.createWaveShaper();
        this.limiter.curve = this.createDriveCurve(1.3);
        this.limiter.oversample = '2x';

        // A little air on top keeps the hats and leads crisp over the sub and kick
        this.shelf = ctx.createBiquadFilter();
        this.shelf.type = 'highshelf';
        this.shelf.frequency.value = 4500;
        this.shelf.gain.value = 4;

        this.master.connect(this.shelf);
        this.shelf.connect(this.glue);
        this.glue.connect(this.limiter);
        this.limiter.connect(this.muffle);
        this.stemBus.connect(this.muffle);
        this.muffle.connect(this.finalLimiter);
        this.finalLimiter.connect(this.out);
        this.out.connect(this.destination);

        // Drums go straight to master; the kick gets its own soft clip for weight
        this.drumBus = ctx.createGain();
        this.drumBus.gain.value = 0.9;
        this.drumBus.connect(this.master);

        this.kickBus = ctx.createWaveShaper();
        this.kickBus.curve = this.createDriveCurve(2.2);
        this.kickBus.connect(this.drumBus);

        // Melodic instruments go through the sidechain "pump"
        this.pump = ctx.createGain();
        this.pump.gain.value = 1;
        this.pump.connect(this.master);

        this.synthBus = ctx.createGain();
        this.synthBus.gain.value = 0.72;
        this.synthBus.connect(this.pump);

        // Section filter for intro/build sweeps on synths
        this.sweep = ctx.createBiquadFilter();
        this.sweep.type = 'lowpass';
        this.sweep.frequency.value = 18000;
        this.sweep.Q.value = 1.1;
        this.sweep.connect(this.synthBus);

        // Bass sits in the pump but skips the sweep so the low end stays solid
        this.bassBus = ctx.createGain();
        this.bassBus.gain.value = 0.62;
        this.bassBus.connect(this.pump);

        // Effects sends
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = this.createImpulse(2.6, 2.4);
        this.reverbReturn = ctx.createGain();
        this.reverbReturn.gain.value = 0.3;
        this.reverb.connect(this.reverbReturn);
        this.reverbReturn.connect(this.pump);

        this.delay = ctx.createDelay(2);
        this.delayFeedback = ctx.createGain();
        this.delayFeedback.gain.value = 0.34;
        this.delayTone = ctx.createBiquadFilter();
        this.delayTone.type = 'bandpass';
        this.delayTone.frequency.value = 1800;
        this.delayTone.Q.value = 0.5;
        this.delayReturn = ctx.createGain();
        this.delayReturn.gain.value = 0.3;
        this.delay.connect(this.delayTone);
        this.delayTone.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delayTone.connect(this.delayReturn);
        this.delayReturn.connect(this.pump);

        // Shared noise buffer for hats, claps and risers
        this.noise = this.createNoiseBuffer(2);

        // Soft clipper for the heavier bass themes
        this.drive = this.createDriveCurve(2.5);
    }

    createImpulse(seconds, decay) {
        const rate = this.ctx.sampleRate;
        const length = Math.floor(rate * seconds);
        const buffer = this.ctx.createBuffer(2, length, rate);
        for (let c = 0; c < 2; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    }

    createNoiseBuffer(seconds) {
        const rate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    createDriveCurve(amount) {
        const curve = new Float32Array(2048);
        for (let i = 0; i < curve.length; i++) {
            const x = (i / (curve.length - 1)) * 2 - 1;
            curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
        }
        return curve;
    }

    /** Stereo position helper; a plain gain where panning is unsupported */
    panner(pan) {
        if (this.hasPan) {
            const p = this.ctx.createStereoPanner();
            p.pan.value = pan;
            return p;
        }
        return this.ctx.createGain();
    }

    // ------------------------------------------------------------------
    // Transport
    // ------------------------------------------------------------------

    get stepDuration() {
        return 60 / this.theme.bpm / 4;
    }

    get beatLength() {
        return 60 / this.theme.bpm;
    }

    setTheme(key) {
        const theme = this.themes[key] || this.themes[1];
        this.loadStems(this.themes[key] ? key : 1);
        if (theme === this.theme) return;
        this.theme = theme;
        this.plan = MusicEngine.planOf(theme);
        this.themeKey = this.themes[key] ? String(key) : '1';
        this.delay.delayTime.value = this.stepDuration * 3; // dotted eighth
    }

    // ------------------------------------------------------------------
    // Backing tracks
    // ------------------------------------------------------------------

    static sectionsOf(key) {
        return String(key) === 'menu' ? ['menu'] : ['intro', 'drop', 'outro'];
    }

    /**
     * Fetch and decode a theme's backing tracks (the intro first, it is
     * needed soonest). Only the menu and the current world stay in memory:
     * a decoded drop is about 20 MB.
     */
    loadStems(key) {
        key = String(key);
        for (const k of [...this.stems.keys()]) {
            const owner = k.slice(0, k.lastIndexOf('-'));
            if (owner !== key && owner !== 'menu') this.stems.delete(k);
        }
        const chain = MusicEngine.sectionsOf(key).reduce((p, section) => p.then(() => this.loadStem(key, section)), Promise.resolve());
        return chain.catch(() => {});
    }

    loadStem(key, section) {
        const id = `${key}-${section}`;
        if (this.stems.has(id)) return Promise.resolve(this.stems.get(id));
        if (typeof fetch !== 'function') return Promise.resolve(null);
        const pending = fetch(`${this.stemBase}${id}.mp3`)
            .then(r => { if (!r.ok) throw new Error(`${id}: ${r.status}`); return r.arrayBuffer(); })
            .then(ab => new Promise((res, rej) => {
                // Callback form as well as the promise, for older WebKit
                const p = this.ctx.decodeAudioData(ab, res, rej);
                if (p && p.then) p.then(res, rej);
            }))
            .then(buffer => {
                const th = this.themes[key];
                const bars = section === 'drop' ? MusicEngine.planOf(th).total : { menu: 16, intro: 4, outro: 4 }[section];
                const stem = { buffer, start: MusicEngine.findSyncMark(buffer), loopLen: bars * 240 / th.bpm, bars, section };
                // Still wanted? (the player may have moved on to another world)
                if (this.stems.get(id) === pending) this.stems.set(id, stem);
                return stem;
            })
            .catch(err => {
                console.warn('Backing track unavailable, playing the live mix:', err && err.message);
                this.stems.set(id, { failed: true });
                return null;
            });
        this.stems.set(id, pending);
        return pending;
    }

    /**
     * Each file holds a 5 ms tone at 0.25 s and the music from 0.5 s. Find
     * the tone, so the music lines up whatever the decoder added in front.
     */
    static findSyncMark(buffer) {
        const d = buffer.getChannelData(0);
        const sr = buffer.sampleRate;
        const end = Math.min(d.length, Math.round(sr * 0.9));
        for (let i = Math.round(sr * 0.1); i < end; i++) {
            if (Math.abs(d[i]) > 0.2) return i / sr + 0.25;
        }
        return 0.5;
    }

    stemFor(section) {
        const st = this.stems.get(`${this.themeKey}-${section}`);
        return st && st.buffer ? st : null;
    }

    /**
     * Called on every bar line: keep the section's backing track playing,
     * aligned to the bar the arrangement is on. It loops by itself; it is
     * restarted only when the section changes or a Music Run checkpoint cues
     * another bar.
     */
    syncBacking(time) {
        const st = this.stemFor(this.section);
        const key = `${this.themeKey}-${this.section}`;
        if (!st) {
            if (this.backing) this.stopBacking(time);
            return;
        }
        if (this.backing && this.backing.key === key && !this.backingCue) return;
        this.backingCue = false;
        const bar = this.section === 'drop' ? this.sectionBar : this.loopBar;
        this.startBacking(st, key, time, bar);
    }

    startBacking(st, key, time, bar) {
        if (this.backing) this.stopBacking(time);
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = st.buffer;
        src.loop = true;
        src.loopStart = st.start;
        src.loopEnd = st.start + st.loopLen;
        const g = ctx.createGain();
        const t0 = Math.max(time, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(1, t0 + 0.012);
        src.connect(g);
        g.connect(this.stemBus);
        const barLen = st.loopLen / st.bars;
        // If the scheduler fell behind (a busy frame), start late but skip
        // ahead by the same amount, so the track stays on the beat grid
        const late = Math.max(0, ctx.currentTime + 0.005 - time);
        const into = ((bar % st.bars) * barLen + late) % st.loopLen;
        src.start(time + late, st.start + into);
        this.backing = { src, g, key, section: st.section };
        this.master.gain.setTargetAtTime(this.LIVE_GAIN_BACKED, time, 0.02);
    }

    stopBacking(time = this.ctx.currentTime, fade = 0.03) {
        const b = this.backing;
        if (!b) return;
        this.backing = null;
        this.master.gain.setTargetAtTime(this.LIVE_GAIN, time, 0.02);
        b.g.gain.cancelScheduledValues(time);
        b.g.gain.setValueAtTime(b.g.gain.value || 1, time);
        b.g.gain.linearRampToValueAtTime(0.0001, time + fade);
        try { b.src.stop(time + fade + 0.02); } catch (e) { /* already stopped */ }
    }

    start(section = 'menu') {
        if (this.playing) {
            this.setSection(section, true);
            return;
        }
        this.playing = true;
        this.pendingSection = null;
        this.section = section;
        this.sectionBar = 0;
        this.loopBar = 0;
        this.step = 0;
        this.bar = 0;
        this.nextStepTime = this.ctx.currentTime + 0.08;
        this.delay.delayTime.value = this.stepDuration * 3;
        this.applySectionMix(section, this.nextStepTime);

        this.out.gain.cancelScheduledValues(this.ctx.currentTime);
        this.out.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        this.out.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.6);

        this.timer = setInterval(() => this.schedule(), this.scheduleInterval);
    }

    stop(fade = 0.4) {
        if (!this.playing) return;
        const now = this.ctx.currentTime;
        this.out.gain.cancelScheduledValues(now);
        this.out.gain.setValueAtTime(this.out.gain.value, now);
        this.out.gain.linearRampToValueAtTime(0.0001, now + fade);
        this.stopBacking(now + fade, 0.01);
        clearInterval(this.timer);
        this.timer = null;
        this.playing = false;
    }

    /**
     * Change arrangement section.
     *   quantize = 'bar'  (default) lands on the next downbeat of a bar
     *   quantize = 'beat' lands on the next beat (used for the gameplay drop)
     *   quantize = true   switches immediately
     */
    setSection(section, quantize = 'bar') {
        if (section === this.section && !this.pendingSection) return;
        if (quantize === true) {
            this.section = section;
            this.sectionBar = 0;
            this.loopBar = 0;
            this.pendingSection = null;
            // The new section's track starts on the next bar line
            this.stopBacking(this.ctx.currentTime, 0.12);
            this.applySectionMix(section, this.ctx.currentTime);
        } else {
            this.pendingSection = section;
            this.pendingQuantize = quantize;
        }
    }

    /**
     * Seconds until the beat a 'beat'-quantized change would land on, as heard.
     * The game releases the marble on this beat so gameplay time and the
     * music share a downbeat (lasers and spinners move in time with the kick).
     */
    timeToNextBeat() {
        if (!this.playing) return 0;
        let k = 1;
        while ((this.step + k) % 4 !== 0) k++;
        const at = this.nextStepTime + k * this.stepDuration;
        const latency = this.ctx.outputLatency || this.ctx.baseLatency || 0;
        return Math.max(0, at + latency - this.ctx.currentTime);
    }

    setIntensity(value) {
        this.intensity = Math.max(0, Math.min(1, value));
    }

    /** The marble's instrument (Marble.VOICES): lead hook, arps and coin notes */
    setVoice(voice) {
        this.voice = voice || null;
    }

    /** Play a short phrase of the hook in the current voice (the store's preview) */
    previewVoice() {
        if (!this.playing) return false;
        const t = this.ctx.currentTime + 0.02;
        const sd = 60 / this.theme.bpm / 4;
        const phrase = [[0, 4, 2], [2, 6, 2], [4, 7, 4], [8, 9, 2], [10, 7, 2], [12, 11, 5]];
        for (const [st, deg, len] of phrase) {
            this.lead(t + st * sd, this.scaleNote(deg, this.theme.leadOct), sd * len, 0.28, 1, this.master);
        }
        return true;
    }

    /**
     * Music Run checkpoints: at the next bar line the arrangement jumps to the
     * given bar of the drop, so the song picks up where the marble restarts
     */
    cueBar(bar) {
        this.pendingCue = Math.max(0, Math.floor(bar));
        if (this.section !== 'drop') {
            this.section = 'drop';
            this.pendingSection = null;
            this.applySectionMix('drop', this.ctx.currentTime);
        }
    }

    /** Seconds until the next bar line, as heard */
    timeToNextBar() {
        if (!this.playing) return 0;
        let k = 1;
        while ((this.step + k) % 16 !== 0) k++;
        const at = this.nextStepTime + k * this.stepDuration;
        const latency = this.ctx.outputLatency || this.ctx.baseLatency || 0;
        return Math.max(0, at + latency - this.ctx.currentTime);
    }

    /** Muffle the whole mix (pause menu, failure) */
    setMuffled(muffled, time = 0.35) {
        const now = this.ctx.currentTime;
        const f = this.muffle.frequency;
        f.cancelScheduledValues(now);
        f.setValueAtTime(f.value, now);
        f.exponentialRampToValueAtTime(muffled ? 380 : 20000, now + time);
    }

    applySectionMix(section, time) {
        const f = this.sweep.frequency;
        f.cancelScheduledValues(time);
        f.setValueAtTime(Math.max(200, f.value), time);
        if (section === 'intro' || section === 'outro') {
            f.exponentialRampToValueAtTime(1500, time + 0.4);
        } else if (section === 'menu') {
            f.exponentialRampToValueAtTime(4200, time + 0.4);
        } else if (section === 'build') {
            // Open the filter across the whole build
            const barLen = this.stepDuration * 16;
            f.setValueAtTime(900, time);
            f.exponentialRampToValueAtTime(16000, time + barLen * this.theme.buildBars);
        } else {
            f.exponentialRampToValueAtTime(18000, time + 0.05);
        }
    }

    schedule() {
        const horizon = this.ctx.currentTime + this.lookahead;
        while (this.nextStepTime < horizon) {
            this.playStep(this.step, this.nextStepTime);
            this.advance();
        }
        // Forget kicks the visuals no longer need
        const cutoff = this.ctx.currentTime - 2;
        while (this.kickTimes.length && this.kickTimes[0] < cutoff) {
            this.kickTimes.shift();
        }
    }

    advance() {
        this.nextStepTime += this.stepDuration;
        this.step++;
        if (this.step === 16) {
            this.step = 0;
            this.bar++;
            this.sectionBar++;
            this.loopBar++;
            if (this.pendingCue !== null && this.pendingCue !== undefined) {
                this.sectionBar = this.pendingCue;
                this.pendingCue = null;
                this.backingCue = true;
            }

            // Builds resolve into the drop on their own
            if (this.section === 'build' && this.sectionBar >= this.theme.buildBars && !this.pendingSection) {
                this.pendingSection = 'drop';
                this.pendingQuantize = 'bar';
            }
            if (this.section === 'drop' && !this.pendingSection) this.onDropBar(this.nextStepTime);
        }

        const onBar = this.step === 0;
        const onBeat = this.step % 4 === 0;
        if (this.pendingSection && (onBar || (onBeat && this.pendingQuantize === 'beat'))) {
            this.applyPending(this.nextStepTime);
        }
    }

    applyPending(time) {
        const next = this.pendingSection;
        this.pendingSection = null;
        if (next === 'drop' && this.section !== 'drop') {
            // Restart the bar so the drop's rise starts on its downbeat
            // (the release starts the rise; the flash waits for the drop itself)
            this.step = 0;
        }
        this.section = next;
        this.sectionBar = 0;
        this.loopBar = 0;
        this.applySectionMix(next, time);
        if (next === 'drop') this.onDropBar(time);
        if (next === 'build') {
            this.playRiser(time, this.stepDuration * 16 * this.theme.buildBars);
        }
    }

    /** A theme's song form, compiled (see MusicThemes.js: plan) */
    static planOf(theme) {
        if (!theme._plan) theme._plan = window.MUSIC_PLAN.compile(theme.plan || window.MUSIC_PLAN.CLASSIC);
        return theme._plan;
    }

    /** Where a bar of the drop falls in the theme's form: its segment kind, position, hook, and whether it is the breath before a drop */
    pos(bar) {
        return (this.plan || MusicEngine.planOf(this.theme)).pos(bar);
    }

    /**
     * Each bar of the drop: the live synths' filter opens across the rise and
     * dips for the breaks, and each drop flashes the chute
     */
    onDropBar(time) {
        const P = this.pos(this.sectionBar);
        const f = this.sweep.frequency;
        const barLen = this.stepDuration * 16;
        const at = (u) => 700 * Math.pow(16000 / 700, u);
        f.cancelScheduledValues(time);
        if (P.kind === 'rise') {
            f.setValueAtTime(at(P.u), time);
            f.exponentialRampToValueAtTime(at((P.i + 1) / P.len), time + barLen);
        } else {
            f.setValueAtTime(P.kind === 'break' ? 3000 : 18000, time);
        }
        if (P.dropStart) this.dropTime = time;
    }

    // ------------------------------------------------------------------
    // Arrangement
    // ------------------------------------------------------------------

    /** Two bars per chord: the progression is an 8-bar cycle, like the hooks */
    phraseBar() {
        // The drop's harmony runs ahead by the plan's offset, so its first drop lands on the first chord
        return this.section === 'drop' ? this.sectionBar + (this.plan || MusicEngine.planOf(this.theme)).harmOffset : this.loopBar;
    }

    /** Semitones the key is lifted by: the drop's peak climbs (theme.peakShift) */
    keyShift() {
        return this.section === 'drop' && this.pos(this.sectionBar).kind === 'peak'
            ? (this.theme.peakShift || 0) : 0;
    }

    currentChord() {
        const prog = this.theme.progression;
        const ch = prog[Math.floor(this.phraseBar() / 2) % prog.length];
        const up = this.keyShift();
        return up ? { root: ch.root + up, notes: ch.notes.map(n => n + up) } : ch;
    }

    /** Hook events landing on this step of the current phrase (hooks span theme.hookBars bars) */
    hookNotes(hook, step, bar) {
        const pos = (bar % (this.theme.hookBars || 2)) * 16 + step;
        const out = [];
        for (const ev of hook) if (ev[0] === pos) out.push(ev);
        return out;
    }

    playStep(step, time) {
        if (step === 0) this.syncBacking(time);
        if (this.backing && this.backing.section === this.section) {
            this.playLive(step, time);
            return;
        }
        const section = this.section;
        const theme = this.theme;
        const chord = this.currentChord();
        const beat = step % 4 === 0;
        const sd = this.stepDuration;

        switch (section) {
            case 'menu': {
                if (beat) this.kick(time, 0.5);
                if (step === 4 || step === 12) this.clap(time, 0.18);
                if (step % 4 === 2) this.hat(time, 0.14, true);
                if (step % 2 === 1) this.hat(time, 0.05, false);
                if (step === 0) this.pad(time, chord, sd * 16, 0.32);
                if (theme.bass[step] && step % 4 === 2) this.bassNote(time, chord.root, sd * 1.6, 0.4);
                for (const [, deg, len] of this.hookNotes(theme.hooks.A, step, this.loopBar)) {
                    this.pluckNote(time, this.scaleNote(deg, theme.leadOct), 0.2, sd * Math.max(2, len));
                }
                break;
            }

            case 'intro':
            case 'outro': {
                if (step % 4 === 2) this.hat(time, 0.13, true);
                if (step % 2 === 1) this.hat(time, 0.045, false);
                if (step === 0) this.pad(time, chord, sd * 16, 0.4);
                if (step % 4 === 0) this.pluck(time, chord, step, 0.13);
                if (section === 'intro' && beat) this.kick(time, 0.42);
                if (section === 'intro' && step === 0 && this.sectionBar % 4 === 3) this.playRiser(time, sd * 16);
                // The hook, muffled behind the section filter: a taste of the drop
                for (const [, deg, len] of this.hookNotes(theme.hooks.A, step, this.loopBar)) {
                    this.lead(time, this.scaleNote(deg, theme.leadOct), sd * len, 0.16, 0.4);
                }
                break;
            }

            case 'build': {
                const barsLeft = theme.buildBars - this.sectionBar;
                const progress = (this.sectionBar * 16 + step) / (theme.buildBars * 16);
                if (beat) this.kick(time, 0.75);
                // Snare roll speeds up as the drop approaches
                const rollEvery = barsLeft <= 1 ? (step >= 8 ? 1 : 2) : 4;
                if (step % rollEvery === 0) this.clap(time, 0.2 + progress * 0.4, 1 + progress);
                if (step % 2 === 0) this.hat(time, 0.12, false);
                if (step === 0) this.pad(time, chord, sd * 16, 0.38);
                for (const [, deg, len] of this.hookNotes(theme.hooks.A, step, this.loopBar)) {
                    this.lead(time, this.scaleNote(deg, theme.leadOct), sd * len, 0.14 + progress * 0.14, 0.5 + progress * 0.5);
                }
                break;
            }

            case 'drop': {
                // The theme's form, played live (the backing tracks follow the same plan)
                const P = this.pos(this.sectionBar);
                const inten = this.intensity;
                const drop = P.kind === 'drop' || P.kind === 'peak';
                const brk = P.kind === 'break';
                const build = P.kind === 'build' || (P.kind === 'rise' && P.u >= 0.5);
                if (P.lastBuild && step >= 12) break; // the breath before the drop

                // Drums
                if (beat && !brk) {
                    this.kick(time, P.kind === 'rise' ? 0.7 : 0.85);
                    this.duck(time);
                }
                if (drop && !P.lastBuild && (step === 4 || step === 12)) this.clap(time, 0.6, 1, true);
                if (P.kind === 'rise' && !build && (step === 4 || step === 12)) this.clap(time, 0.45);
                if (build) {
                    const u = P.kind === 'build' ? (P.i + step / 16) / P.len : (P.u - 0.5) * 2 + step / 16 / P.len;
                    const every = u < 0.5 ? 4 : u < 0.8 ? 2 : 1;
                    if (step % every === 0) this.clap(time, 0.2 + u * 0.4, 1 + u * 0.5);
                }
                if (!brk) {
                    if (step % 4 === 2) this.hat(time, 0.4, true);
                    else if (step % 2 === 0 || drop) this.hat(time, [0.36, 0.16, 0.26, 0.16][step % 4] * (0.8 + inten * 0.4), false);
                }
                if (inten > 0.6 && drop && step % 2 === 1) this.shaker(time, 0.08);
                if (step === 0 && P.dropStart) this.playImpact(time);
                if (step === 0 && P.first && (P.kind === 'rise' || brk)) this.crash(time, 0.3);
                if (step === 0 && P.first && (P.kind === 'build' || P.kind === 'rise')) this.playRiser(time, sd * 16 * P.len);

                // Bass: none in the break, nor in the last bar of a build (a one-bar build keeps its first half)
                if (!brk && !(P.lastBuild && (P.len !== 1 || step >= 8))) {
                    const pat = P.kind === 'peak' ? MusicEngine.BASS.rolling : theme.bass;
                    if (pat[step]) {
                        const len = pat[(step + 1) % 16] ? sd * 0.9 : sd * 1.6;
                        this.bassNote(time, chord.root, len, (P.kind === 'rise' ? 0.55 : 0.8) * pat[step]);
                    }
                }

                // Chords
                if (drop && !P.lastBuild && theme.stabs.includes(step)) this.supersaw(time, chord, sd * 2.2, P.kind === 'peak' ? 0.62 : 0.55);
                if (P.lastBuild && (step % 2 === 0 || step >= 8)) this.supersaw(time, chord, sd * 0.9, 0.4 + step / 30);
                if (P.kind === 'rise' && theme.stabs.includes(step)) this.supersaw(time, chord, sd * 1.6, 0.35 + P.u * 0.25);
                if (P.kind === 'build' && !P.lastBuild && step % 2 === 0) this.supersaw(time, chord, sd * 1.6, 0.4 + P.u * 0.25);
                if (brk && step === 0 && P.i % 2 === 0) this.pad(time, chord, sd * 32, 0.4);

                // Lead hook: teased through the rise, out for the last bar of the long builds and the breaks
                if (!brk && (!P.lastBuild || P.len === 1)) {
                    const hook = theme.hooks[P.hook] || theme.hooks.A;
                    const bright = 0.55 + inten * 0.45;
                    const vel = P.kind === 'rise' ? 0.22 + P.u * 0.16 : 0.38;
                    for (const [, deg, len] of this.hookNotes(hook, step, this.phraseBar())) {
                        this.lead(time, this.scaleNote(deg, theme.leadOct), sd * len, vel, bright);
                        if (P.kind !== 'rise') this.lead(time, this.scaleNote(deg, theme.leadOct + 1), sd * len, P.kind === 'peak' ? 0.14 : 0.07, bright);
                    }
                }

                // Arpeggio
                if (!build && (P.kind === 'peak' || brk || inten > 0.75)) this.arp(time, chord, step, 0.09 + inten * 0.08);
                break;
            }
        }
    }

    /**
     * Over a backing track only the live layer plays: the lead hook in the
     * marble's voice, the sidechain on it, and the beat pulse for the visuals
     */
    playLive(step, time) {
        const theme = this.theme;
        const sd = this.stepDuration;
        const beat = step % 4 === 0;
        switch (this.section) {
            case 'menu':
                if (beat) this.kickTimes.push(time);
                for (const [, deg, len] of this.hookNotes(theme.hooks.A, step, this.loopBar)) {
                    this.pluckNote(time, this.scaleNote(deg, theme.leadOct), 0.24, sd * Math.max(2, len));
                }
                break;
            case 'intro':
                if (beat) { this.kickTimes.push(time); this.duck(time); }
                for (const [, deg, len] of this.hookNotes(theme.hooks.A, step, this.loopBar)) {
                    this.lead(time, this.scaleNote(deg, theme.leadOct), sd * len, 0.18, 0.4);
                }
                break;
            case 'drop': {
                const P = this.pos(this.sectionBar);
                const brk = P.kind === 'break';
                // No kick pulse in the breaks, nor in the breath before a drop
                if (beat && !brk && !(P.lastBuild && step >= 12)) {
                    this.kickTimes.push(time);
                    this.duck(time);
                }
                // The hook: teased (behind the opening filter) through the rise, full
                // on the drops with an octave on top (louder on the peak), out for the
                // last bar of the long builds, the last beat of a one-bar build, and the
                // breaks (their tune is in the backing track)
                if (brk || (P.lastBuild && (P.len !== 1 || step >= 12))) break;
                const hook = theme.hooks[P.hook] || theme.hooks.A;
                const bright = 0.6 + this.intensity * 0.4;
                const vel = P.kind === 'rise' ? 0.22 + P.u * 0.16 : P.kind === 'build' ? 0.3 : 0.36;
                for (const [, deg, len] of this.hookNotes(hook, step, this.phraseBar())) {
                    this.lead(time, this.scaleNote(deg, theme.leadOct), sd * len, vel, bright);
                    if (P.kind !== 'rise') this.lead(time, this.scaleNote(deg, theme.leadOct + 1), sd * len, P.kind === 'peak' ? 0.13 : 0.07, bright);
                }
                break;
            }
            // outro: the backing track carries it alone
        }
    }

    // ------------------------------------------------------------------
    // Instruments
    // ------------------------------------------------------------------

    noteToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /** Layered kick: pitched sub body, a short knock on top and a click */
    kick(time, vel) {
        const ctx = this.ctx;
        const pitch = this.theme.kickPitch;

        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(pitch * 4, time);
        body.frequency.exponentialRampToValueAtTime(pitch, time + 0.055);
        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(0.0001, time);
        bodyGain.gain.exponentialRampToValueAtTime(vel, time + 0.003);
        bodyGain.gain.setValueAtTime(vel, time + 0.06);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
        body.connect(bodyGain);
        bodyGain.connect(this.kickBus);
        body.start(time);
        body.stop(time + 0.42);

        const knock = ctx.createOscillator();
        knock.type = 'triangle';
        knock.frequency.setValueAtTime(1400, time);
        knock.frequency.exponentialRampToValueAtTime(180, time + 0.014);
        const knockGain = ctx.createGain();
        knockGain.gain.setValueAtTime(vel * 0.5, time);
        knockGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
        knock.connect(knockGain);
        knockGain.connect(this.drumBus);
        knock.start(time);
        knock.stop(time + 0.04);

        const click = ctx.createBufferSource();
        click.buffer = this.noise;
        const clickGain = ctx.createGain();
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 2800;
        clickGain.gain.setValueAtTime(vel * 0.22, time);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.01);
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.drumBus);
        click.start(time, Math.random());
        click.stop(time + 0.02);

        this.kickTimes.push(time);
    }

    /** Sidechain pump on synths, the defining EDM groove */
    duck(time) {
        const g = this.pump.gain;
        const beat = this.stepDuration * 4;
        g.cancelScheduledValues(time);
        g.setValueAtTime(1, time);
        g.linearRampToValueAtTime(0.2, time + 0.012);
        g.setTargetAtTime(1, time + 0.035, beat * 0.22);
    }

    clap(time, vel, pitch = 1, snare = false) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1300 * pitch;
        filter.Q.value = 0.8;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 9000;
        const gain = ctx.createGain();
        // Four quick bursts + tail = clap
        gain.gain.setValueAtTime(0.0001, time);
        for (let i = 0; i < 4; i++) {
            const t = time + i * 0.009;
            gain.gain.setValueAtTime(vel * (i === 3 ? 1 : 0.8), t);
            gain.gain.exponentialRampToValueAtTime(vel * 0.25, t + 0.008);
        }
        gain.gain.setValueAtTime(vel * 0.85, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
        src.connect(filter);
        filter.connect(lp);
        lp.connect(gain);
        gain.connect(this.drumBus);
        const send = ctx.createGain();
        send.gain.value = 0.3;
        gain.connect(send);
        send.connect(this.reverb);
        src.start(time, Math.random());
        src.stop(time + 0.26);

        if (snare) {
            // Pitched body under the backbeat
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, time);
            osc.frequency.exponentialRampToValueAtTime(150, time + 0.08);
            const og = ctx.createGain();
            og.gain.setValueAtTime(vel * 0.5, time);
            og.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
            osc.connect(og);
            og.connect(this.drumBus);
            osc.start(time);
            osc.stop(time + 0.13);
        }
    }

    hat(time, vel, open) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = open ? 6500 : 8500;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 13000;
        const gain = ctx.createGain();
        const len = open ? 0.15 : 0.04;
        gain.gain.setValueAtTime(vel * (0.92 + Math.random() * 0.16), time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + len);
        src.connect(filter);
        filter.connect(lp);
        lp.connect(gain);
        gain.connect(this.drumBus);
        src.start(time, Math.random());
        src.stop(time + len + 0.01);
    }

    shaker(time, vel) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 5200;
        filter.Q.value = 1.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vel, time + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumBus);
        src.start(time, Math.random());
        src.stop(time + 0.08);
    }

    crash(time, vel) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4800;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 14000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);
        src.connect(filter);
        filter.connect(lp);
        lp.connect(gain);
        gain.connect(this.drumBus);
        gain.connect(this.reverb);
        src.start(time);
        src.stop(time + 1.9);
    }

    /** Sub sine an octave under a driven saw body */
    bassNote(time, rootMidi, length, vel) {
        const ctx = this.ctx;
        const theme = this.theme;
        const freq = this.noteToFreq(rootMidi - 12);

        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq / 2;

        const body = ctx.createOscillator();
        body.type = 'sawtooth';
        body.frequency.value = freq;
        const body2 = ctx.createOscillator();
        body2.type = 'square';
        body2.frequency.value = freq;
        body2.detune.value = -5;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(theme.bassCutoff * 2.6, time);
        filter.frequency.exponentialRampToValueAtTime(theme.bassCutoff, time + length * 0.7);

        const bodyGain = ctx.createGain();
        bodyGain.gain.value = 0.4;
        const body2Gain = ctx.createGain();
        body2Gain.gain.value = 0.18;
        const subGain = ctx.createGain();
        subGain.gain.value = 0.7;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(vel * 0.6, time + 0.006);
        gain.gain.setValueAtTime(vel * 0.6, time + length * 0.65);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

        body.connect(filter);
        body2.connect(body2Gain);
        body2Gain.connect(filter);
        if (theme.bassDrive) {
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.drive;
            filter.connect(shaper);
            shaper.connect(bodyGain);
        } else {
            filter.connect(bodyGain);
        }
        bodyGain.connect(gain);
        sub.connect(subGain);
        subGain.connect(gain);
        gain.connect(this.bassBus);

        sub.start(time);
        body.start(time);
        body2.start(time);
        sub.stop(time + length + 0.02);
        body.stop(time + length + 0.02);
        body2.stop(time + length + 0.02);
    }

    /** Wide chord stab: five detuned saws per note, spread across the stereo field */
    supersaw(time, chord, length, vel) {
        const ctx = this.ctx;
        const notes = chord.notes.slice(0, 3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(vel / notes.length, time + 0.008);
        gain.gain.exponentialRampToValueAtTime(vel * 0.4 / notes.length, time + length * 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(8500, time);
        filter.frequency.exponentialRampToValueAtTime(2400, time + length);

        filter.connect(gain);
        gain.connect(this.sweep);
        const send = ctx.createGain();
        send.gain.value = 0.3;
        gain.connect(send);
        send.connect(this.reverb);

        const detunes = [-19, -9, 0, 9, 19];
        const pans = [-0.7, -0.35, 0, 0.35, 0.7];
        const panners = pans.map(p => {
            const pn = this.panner(p);
            pn.connect(filter);
            return pn;
        });
        for (const note of notes) {
            const f = this.noteToFreq(note + 12);
            detunes.forEach((d, k) => {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                osc.detune.value = d * this.theme.spread + (Math.random() - 0.5) * 3;
                osc.connect(panners[k]);
                osc.start(time);
                osc.stop(time + length + 0.05);
            });
        }
    }

    /** Slow pad: detuned pairs per note under a breathing filter */
    pad(time, chord, length, vel) {
        const ctx = this.ctx;
        const gain = ctx.createGain();
        const attack = Math.min(0.7, length * 0.3);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vel / chord.notes.length, time + attack);
        gain.gain.setValueAtTime(vel / chord.notes.length, time + length - 0.3);
        gain.gain.linearRampToValueAtTime(0.0001, time + length + 0.25);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1900;
        filter.Q.value = 0.8;
        // Breathing: an LFO sweeps the cutoff
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.18;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 700;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(time);
        lfo.stop(time + length + 0.3);

        filter.connect(gain);
        gain.connect(this.sweep);
        const send = ctx.createGain();
        send.gain.value = 0.6;
        gain.connect(send);
        send.connect(this.reverb);

        chord.notes.forEach((note, i) => {
            [-7, 7].forEach((d, k) => {
                const osc = ctx.createOscillator();
                osc.type = this.theme.padWave;
                osc.frequency.value = this.noteToFreq(note);
                osc.detune.value = d;
                const pn = this.panner((k ? 0.5 : -0.5) * (i % 2 ? -1 : 1));
                osc.connect(pn);
                pn.connect(filter);
                osc.start(time);
                osc.stop(time + length + 0.3);
            });
        });
    }

    /**
     * Lead synth for the hooks: two detuned saws over a square an octave
     * down, filter envelope, vibrato that sets in after the attack, delay.
     * `bright` scales the filter (intensity and section teasers).
     */
    lead(time, midi, length, vel, bright = 1, dest = null) {
        const ctx = this.ctx;
        // The marble's voice (see Marble.VOICES) shapes the hook
        const v = this.voice || {};
        midi += 12 * (v.oct || 0);
        const f0 = this.noteToFreq(midi);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 2.5;
        const top = (2200 + 4800 * bright) * (v.bright || 1);
        filter.frequency.setValueAtTime(top, time);
        filter.frequency.exponentialRampToValueAtTime(Math.max(600, top * 0.35), time + Math.max(0.12, length * 0.8));

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(vel, time + 0.006);
        if (v.bell) {
            // Struck, not held: decays through the note and rings on after it
            gain.gain.exponentialRampToValueAtTime(vel * 0.25, time + Math.max(0.05, length));
            gain.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.3);
        } else {
            gain.gain.setValueAtTime(vel, time + Math.max(0.01, length - 0.04));
            gain.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.06);
        }

        if (v.drive) {
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.drive;
            filter.connect(shaper);
            shaper.connect(gain);
        } else {
            filter.connect(gain);
        }
        gain.connect(dest || this.sweep);
        const send = ctx.createGain();
        send.gain.value = 0.42;
        gain.connect(send);
        send.connect(this.delay);
        const rsend = ctx.createGain();
        rsend.gain.value = 0.22;
        gain.connect(rsend);
        rsend.connect(this.reverb);

        // Vibrato fades in on held notes
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.6;
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0, time);
        lfoGain.gain.linearRampToValueAtTime(9, time + 0.25);
        lfo.connect(lfoGain);
        lfo.start(time);
        lfo.stop(time + length + 0.1);

        const wave = v.lead || this.theme.leadWave;
        const voices = [[wave, 0, -7, 1], [wave, 0, 7, 1], ['square', -12, 0, v.oct < 0 ? 0.5 : 0.3]];
        if (!v.bell) voices.push([wave, 0, -15, 0.5], [wave, 0, 15, 0.5], [wave, 0, -26, 0.32], [wave, 0, 26, 0.32]);
        if (v.chorus) voices.push([wave, 0, -17, 0.55], [wave, 0, 17, 0.55]);
        if (v.shimmer) voices.push(['sine', 24, 0, v.shimmer]);
        // Bells: inharmonic partials that die away fast
        if (v.bell) voices.push(['sine', 17.6, 0, 0.35], ['sine', 29.2, 0, 0.18]);
        const tail = v.bell ? 0.35 : 0.1;
        for (const [type, oct, det, g] of voices) {
            // High bell partials on high notes would land past the audible range
            if (f0 * Math.pow(2, oct / 12) > ctx.sampleRate * 0.45) continue;
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.frequency.value = f0 * Math.pow(2, oct / 12);
            osc.detune.value = det;
            lfoGain.connect(osc.detune);
            const vg = ctx.createGain();
            vg.gain.value = g;
            if (v.bell && oct > 12) {
                vg.gain.setValueAtTime(g, time);
                vg.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
            }
            osc.connect(vg);
            vg.connect(filter);
            osc.start(time);
            osc.stop(time + length + tail);
        }
    }

    pluck(time, chord, step, vel) {
        const notes = chord.notes;
        const note = notes[(step >> 2) % notes.length] + 12;
        this.pluckNote(time, note, vel, this.stepDuration * 1.5);
    }

    arp(time, chord, step, vel) {
        const pattern = this.theme.arpPattern;
        const idx = pattern[step % pattern.length];
        const notes = chord.notes;
        const note = notes[idx % notes.length] + 12 * (1 + Math.floor(idx / notes.length));
        this.pluckNote(time, note, vel, this.stepDuration * 0.9, null, (step % 4) / 3 - 0.5);
    }

    pluckNote(time, midi, vel, length, destination = null, pan = 0) {
        const ctx = this.ctx;
        const v = this.voice || {};
        const osc = ctx.createOscillator();
        osc.type = v.pluck || this.theme.pluckWave;
        osc.frequency.value = this.noteToFreq(midi);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 4;
        filter.frequency.setValueAtTime(5200 * (v.bright || 1), time);
        filter.frequency.exponentialRampToValueAtTime(600, time + length);
        if (v.bell) {
            const p = ctx.createOscillator();
            p.type = 'sine';
            p.frequency.value = this.noteToFreq(midi) * 2.76;
            const pg = ctx.createGain();
            pg.gain.setValueAtTime(0.4, time);
            pg.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
            p.connect(pg);
            pg.connect(filter);
            p.start(time);
            p.stop(time + 0.2);
        }

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(vel, time + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

        osc.connect(filter);
        filter.connect(gain);
        const pn = this.panner(pan);
        gain.connect(pn);
        pn.connect(destination || this.sweep);
        const send = ctx.createGain();
        send.gain.value = 0.5;
        gain.connect(send);
        send.connect(this.delay);

        osc.start(time);
        osc.stop(time + length + 0.02);
    }

    playRiser(time, length) {
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.exponentialRampToValueAtTime(9000, time + length);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.32, time + length * 0.95);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.05);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.drumBus);
        gain.connect(this.reverb);
        src.start(time);
        src.stop(time + length + 0.1);

        // Pitch-rising saw underneath the noise
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(this.noteToFreq(this.theme.root), time);
        osc.frequency.exponentialRampToValueAtTime(this.noteToFreq(this.theme.root + 24), time + length);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, time);
        og.gain.exponentialRampToValueAtTime(0.07, time + length * 0.95);
        og.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.05);
        osc.connect(og);
        og.connect(this.master);
        osc.start(time);
        osc.stop(time + length + 0.1);
    }

    playImpact(time) {
        const ctx = this.ctx;
        // Sub drop
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
        osc.connect(gain);
        gain.connect(this.drumBus);
        osc.start(time);
        osc.stop(time + 1.3);
        // Boom
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1200, time);
        lp.frequency.exponentialRampToValueAtTime(120, time + 0.6);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.5, time);
        ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);
        src.connect(lp);
        lp.connect(ng);
        ng.connect(this.drumBus);
        src.start(time);
        src.stop(time + 0.8);
        this.crash(time, 0.45);
    }

    // ------------------------------------------------------------------
    // Gameplay stingers (played immediately, pitched to the song key)
    // ------------------------------------------------------------------

    /** Scale degree -> midi note in the current key (lifted on the drop's peak) */
    scaleNote(degree, octave = 0) {
        const scale = this.theme.scale;
        const oct = Math.floor(degree / scale.length);
        const idx = ((degree % scale.length) + scale.length) % scale.length;
        return this.theme.root + this.keyShift() + scale[idx] + 12 * (oct + octave);
    }

    /** Coin pickups climb the scale with the combo, always in key */
    playCollect(comboIndex) {
        if (!this.playing) return false;
        const t = this.ctx.currentTime + 0.005;
        const degree = Math.min(comboIndex, 14);
        const midi = this.scaleNote(degree, 2);
        this.pluckNote(t, midi, 0.32, 0.22, this.master);
        this.pluckNote(t, midi + 12, 0.12, 0.18, this.master);
        return true;
    }

    playGoal() {
        if (!this.playing) return;
        const t = this.ctx.currentTime + 0.01;
        const chord = this.theme.progression[0];
        chord.notes.forEach((n, i) => {
            this.pluckNote(t + i * 0.07, n + 24, 0.25, 0.6, this.master);
        });
        this.crash(t, 0.4);
    }

    // ------------------------------------------------------------------
    // Visual sync
    // ------------------------------------------------------------------

    /** 1 on the kick, decaying to 0 before the next beat */
    getPulse() {
        if (!this.playing) return 0;
        const now = this.ctx.currentTime - (this.ctx.outputLatency || this.ctx.baseLatency || 0);
        let last = -Infinity;
        for (let i = this.kickTimes.length - 1; i >= 0; i--) {
            if (this.kickTimes[i] <= now) {
                last = this.kickTimes[i];
                break;
            }
        }
        if (last === -Infinity) return 0;
        return Math.exp(-(now - last) * 7);
    }

    /** Flash for the first moments after a drop lands */
    getDropFlash() {
        const now = this.ctx.currentTime - (this.ctx.outputLatency || this.ctx.baseLatency || 0);
        const dt = now - this.dropTime;
        if (dt < 0 || dt > 1.5) return 0;
        return Math.exp(-dt * 3);
    }

    isDropping() {
        return this.playing && this.section === 'drop';
    }

    /** True while one of the drops is playing (not the rise, a build, or a break) */
    inDropHit() {
        if (!this.isDropping()) return false;
        const P = this.pos(this.sectionBar);
        return (P.kind === 'drop' || P.kind === 'peak') && !P.lastBuild;
    }
}

// Compositions: see MusicThemes.js (shared with the backing-track renderer)
MusicEngine.THEMES = window.MUSIC_THEMES;
MusicEngine.BASS = window.MUSIC_BASS;

window.MusicEngine = MusicEngine;
