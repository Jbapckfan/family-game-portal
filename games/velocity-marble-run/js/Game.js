/**
 * Game - 3D half-pipe marble run
 *
 * The marble rolls down a twisting, banked chute (see three/Track.js). While
 * it is in the pipe its state is kept in track coordinates: s (metres along
 * the chute), phi (angle around the pipe, 0 = floor) and the two speeds along
 * them. Gravity is split into a downhill part and a part that swings it back
 * to the floor; on curves the centrifugal term pushes it up the outside wall.
 * Go too high and it flies off the rim; jumps and gaps switch it to free
 * flight in world space until it lands back in the pipe.
 *
 * Flow per level:  intro (camera swoop) -> ready (tap to drop, released on
 *                  the beat) -> playing -> complete | dead (instant retry)
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');

        this.scene3d = new Scene3D(this.canvas);
        this.scene3d.onContextRestored = () => this.onContextRestored();
        this.audio = new AudioManager();
        this.haptics = new HapticManager();
        this.state = new GameState();
        this.progression = new Progression(this.state);
        this.leaderboards = new Leaderboards(this.state);
        this.ability = { type: null, def: null, cooldown: 0, active: 0 };
        this.cameraMode = 'chase';
        this.povHorizon = true;

        // Facades kept for the settings screen
        this.renderer = { setQuality: (q) => this.scene3d.setQuality(q) };
        this.particles = { enabled: true, setQuality: () => {} };

        // Physics constants (metres, seconds)
        this.G = 30;
        this.R = Track.PIPE_R;
        this.r = 0.55;
        this.STEP = 1 / 120;
        this.ROLL = 0.6;
        this.DRAG = 0.0032;
        this.STEER = 34;
        this.AIR_STEER = 10;
        this.JUMP = 10.5; // along the surface normal: straight up off the floor, in toward the centre off a wall
        this.LAT_DAMP = 1.2;
        // Sharp bends: turn pull (speed squared times curvature) beyond TURN_FREE
        // bites harder by TURN_BITE, throwing a marble that is not steered into
        // the bend up the outside wall; riding high on a wall scrubs off speed
        this.TURN_FREE = 18;
        this.TURN_BITE = 0.6;
        this.TURN_CAP = 24;
        this.SLIDE_DAMP = 0.35; // share of lateral damping kept while sliding outward in a bend
        this.SCRUB = 0.5;
        // Music Runs keep the marble on the song's schedule: lag behind the
        // course's timeline (beyond a dead band) pushes it along, running ahead
        // holds it back, never more than PACE_MAX, so every cliff crest
        // arrives on its drop and the hurdles on their beats
        this.PACE_BAND = 0.06;
        this.PACE_GAIN = 7;
        this.PACE_MAX = 4;
        // Hang time: going over a cliff edge the world slows for a moment
        this.HANG_SCALE = 0.35;
        this.HANG_TIME = 0.45;
        this.K57 = 5 / 7; // rolling sphere
        this.BOUNCE = 0.3;
        this.AIR_JUMPS = 1; // double jump (Triple Jump upgrade adds one)
        this.coinReach = 1.15;
        this.shields = 0;
        this.shieldT = 0;

        this.track = null;
        this.currentLevelId = null;
        this.levelData = null;
        this.phase = 'idle';
        this.loopRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.elapsedTime = 0;
        this.accumulator = 0;
        this.alpha = 0;
        this.stepCount = 0;

        this.m = this.newMarbleState();
        this.renderPos = new THREE.Vector3();
        this.prevPos = new THREE.Vector3();
        this.marbleQuat = new THREE.Quaternion();
        // Contact point and surface normal under the marble (filled in by draw)
        this._surf = [0, 0, 0];
        this._surfN = [0, 1, 0];

        this.timeScale = 1;
        this.slowMoTimer = 0;
        this.hitStop = 0;
        this.combo = { count: 0, multiplier: 1, timer: 0, window: 2.2, pop: 0, best: 0 };
        this.score = 0;
        this.coinsCollected = 0;
        this.attempts = 1;
        this.deathTimer = 0;
        this.dropCountdown = null;
        this.ghost = null;
        this.ghostRec = [];
        this.GHOST_RATE = 30;
        // Friend challenges: the rival's run, and this run in track coordinates (10 Hz)
        this.rival = null;
        this.runRec = [];
        // Music Runs: the song, its checkpoints and the beat scoring
        this.run = null;
        this.useAudioClock = true;
        this.holdS = 9;
        this.holdV = 8;

        this.input = { axis: 0, keyAxis: 0, tiltAxis: 0, tiltEnabled: false, pointer: null, jumpBuffer: 0 };

        this.fps = 60;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.frameTimeAvg = 16;

        this.onLevelComplete = null;
        this.onLevelFail = null;
    }

    newMarbleState() {
        return {
            mode: 'pipe', s: 9, phi: 0, vs: 0, vphi: 0,
            P: [0, 0, 0], V: [0, 0, 0],
            airTime: 0, prevDist: 0, nearMiss: new Set(), airJumps: this.AIR_JUMPS, landGrace: 0
        };
    }

    /**
     * Each marble's mass, friction and restitution (from the store data)
     * shape how it handles, centred on a typical 5.5-mass, 0.2-friction stone.
     */
    applyMarbleStats(style) {
        const mass = style.mass || 5.5;
        const friction = style.friction ?? 0.2;
        const rest = style.restitution ?? 0.3;
        const grip = 0.85 + friction * 0.8;
        this.DRAG = 0.0032 * Math.pow(5.5 / mass, 0.3);                // heavy marbles hold more top speed
        this.ROLL = 0.6 * (0.8 + friction);                              // grippy stones roll slower
        this.STEER = 34 * (0.92 + friction * 0.35) * Math.pow(5.5 / mass, 0.12);
        this.LAT_DAMP = 1.2 * grip;                                      // glassy marbles slide across the pipe
        this.BOUNCE = rest;                                             // hop on hard landings
        this.SPIN = style.spin ?? 0.5;                                  // speed kept through hard landings and bumps
        this.setAbility(style.ability);
        // The marble is also an instrument: it plays the hook and the coin notes
        this.music?.setVoice?.(Marble.voiceFor(style));
    }

    // ------------------------------------------------------------------
    // Abilities: one per marble, on a cooldown button next to Jump
    // ------------------------------------------------------------------

    setAbility(type) {
        const def = Marble.ABILITIES[type];
        this.ability = def ? { type, def, cooldown: 0, active: 0 } : { type: null, def: null, cooldown: 0, active: 0 };
        if (this.abilityBtn) {
            const b = this.abilityBtn;
            b.classList.toggle('none', !def);
            if (def) {
                b.querySelector('.ab-icon').textContent = def.icon;
                b.querySelector('.ab-name').textContent = def.name.toUpperCase();
                b.style.setProperty('--ab-color', def.color);
            }
        }
    }

    abilityOn(type) {
        return this.ability.active > 0 && this.ability.type === type;
    }

    // ------------------------------------------------------------------
    // Upgrades from the store (Shop.UPGRADES)
    // ------------------------------------------------------------------

    /** Daily chutes and friend races run on stock marbles so times compare */
    fairRace() {
        return !!(this.levelData?.daily || this.rival);
    }

    /** An upgrade's effect in this run: performance ones are off in fair races, Head Start in Music Runs */
    upgrade(id) {
        const u = Shop.UPGRADES[id];
        if ((u.perf && this.fairRace()) || (u.music === false && this.run)) return u.base;
        return Shop.value(id, this.state.getUpgrade(id));
    }

    /** True when the player owns performance upgrades a fair race is switching off */
    hasPerfUpgrades() {
        return Object.keys(Shop.UPGRADES).some(id => Shop.UPGRADES[id].perf && this.state.getUpgrade(id) > 0);
    }

    applyUpgrades() {
        this.AIR_JUMPS = 1 + this.upgrade('triple');
        this.coinReach = this.upgrade('magnet');
        this.combo.window = this.upgrade('combo');
        this.shields = this.upgrade('shield');
        this.shieldT = 0;
        this.scene3d.marbleFX.setShields(this.shields);
    }

    /** A Bubble Shield takes an obstacle hit: the marble loses speed instead of the run */
    useShield() {
        this.shields--;
        this.shieldT = 0.7;
        const m = this.m;
        if (m.mode === 'pipe') m.vs *= 0.72;
        else for (let c = 0; c < 3; c++) m.V[c] *= 0.72;
        Object.assign(this.combo, { count: 0, multiplier: 1, timer: 0 });
        this.scene3d.marbleFX.setShields(this.shields);
        this.scene3d.marbleFX.popShield(this.renderPos);
        if (this.state.getSetting('screenShake')) this.scene3d.addShake(0.35);
        this.scene3d.flash = 0.18;
        this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.4, 0)), this.shields ? `SHIELD · ${this.shields} LEFT` : 'SHIELD BROKEN', '#5ee7ff');
        this.audio.play('bumper');
        this.haptics.heavy?.();
    }

    useAbility() {
        const ab = this.ability;
        if (!ab.def || ab.cooldown > 0 || this.phase !== 'playing' || this.isPaused) return false;
        const m = this.m;
        ab.active = ab.def.duration * this.upgrade('overcharge');
        ab.cooldown = ab.active + ab.def.cooldown * this.upgrade('recharge');
        ab.total = ab.cooldown;
        if (ab.type === 'burst') {
            if (m.mode === 'pipe') m.vs += 14;
            else {
                const f = this.track.frame(m.s);
                for (let c = 0; c < 3; c++) m.V[c] += f.T[c] * 14;
            }
            this.scene3d.boostFx();
            this.scene3d.addShake(0.15);
            this.audio.play('boost');
        } else {
            this.audio.play('jump');
        }
        this.scene3d.abilityFx(ab.type, ab.def.color, true);
        this.scene3d.emit(this.renderPos, 18, ab.def.color, 7, 0.5);
        this.scene3d.addPopup(this.renderPos, ab.def.name.toUpperCase(), ab.def.color);
        this.haptics.medium();
        return true;
    }

    updateAbility(dt) {
        const ab = this.ability;
        if (ab.active > 0) {
            ab.active -= dt;
            if (ab.active <= 0) {
                ab.active = 0;
                this.scene3d.abilityFx(ab.type, ab.def.color, false);
            }
        }
        if (ab.cooldown > 0) ab.cooldown = Math.max(0, ab.cooldown - dt);
        if (this.shieldT > 0) this.shieldT -= dt;
    }

    updateAbilityButton() {
        const b = this.abilityBtn, ab = this.ability;
        if (!b || !ab.def) return;
        const total = ab.total || ab.def.duration + ab.def.cooldown;
        const cd = ab.active > 0 ? 0 : ab.cooldown / total;
        const v = cd.toFixed(2);
        if (b.dataset.cd !== v) {
            b.dataset.cd = v;
            b.style.setProperty('--cd', v);
        }
        b.classList.toggle('active', ab.active > 0);
        b.classList.toggle('ready', ab.active <= 0 && ab.cooldown <= 0);
    }

    /** Camera settings (chase or marble POV) from the save data */
    applyCameraSettings() {
        this.cameraMode = this.state.getSetting('cameraMode') || 'chase';
        this.povHorizon = this.state.getSetting('povHorizon') !== false;
    }

    async init() {
        await this.audio.init();
        this.audio.setSFXVolume(this.state.getSetting('sfxVolume'));
        this.audio.setMusicVolume(this.state.getSetting('musicVolume'));
        this.haptics.setEnabled(this.state.getSetting('haptics'));
        this.scene3d.setQuality(this.state.getSetting('quality') || 'high');
        this.setupInputHandlers();
    }

    get music() {
        return this.audio.music;
    }

    // ------------------------------------------------------------------
    // Input: drag to steer, tap to jump, keyboard, optional tilt
    // ------------------------------------------------------------------

    setupInputHandlers() {
        const c = this.canvas;
        c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        c.addEventListener('pointermove', (e) => this.onPointerMove(e));
        c.addEventListener('pointerup', (e) => this.onPointerUp(e));
        c.addEventListener('pointercancel', (e) => this.onPointerUp(e));

        // On-screen jump button: fires on touch-down for zero latency
        const jumpBtn = document.createElement('button');
        jumpBtn.id = 'jump-btn';
        jumpBtn.setAttribute('aria-label', 'Jump');
        jumpBtn.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 4l7 8h-4v8H9v-8H5z" fill="currentColor"/></svg>';
        jumpBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.audio.resume();
            jumpBtn.classList.add('pressed');
            this.primaryAction();
        });
        const release = () => jumpBtn.classList.remove('pressed');
        jumpBtn.addEventListener('pointerup', release);
        jumpBtn.addEventListener('pointercancel', release);
        jumpBtn.addEventListener('pointerleave', release);
        document.getElementById('game-screen').appendChild(jumpBtn);
        this.jumpBtn = jumpBtn;

        // Ability button beside it, with a cooldown sweep
        const abilityBtn = document.createElement('button');
        abilityBtn.id = 'ability-btn';
        abilityBtn.setAttribute('aria-label', 'Ability');
        abilityBtn.innerHTML = '<span class="ab-icon"></span><span class="ab-name"></span>';
        abilityBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.audio.resume();
            abilityBtn.classList.add('pressed');
            this.useAbility();
        });
        const releaseAb = () => abilityBtn.classList.remove('pressed');
        abilityBtn.addEventListener('pointerup', releaseAb);
        abilityBtn.addEventListener('pointercancel', releaseAb);
        abilityBtn.addEventListener('pointerleave', releaseAb);
        document.getElementById('game-screen').appendChild(abilityBtn);
        this.abilityBtn = abilityBtn;
        if (this.ability.def) this.setAbility(this.ability.type);

        const keys = new Set();
        const updateKeyAxis = () => {
            const left = keys.has('ArrowLeft') || keys.has('KeyA');
            const right = keys.has('ArrowRight') || keys.has('KeyD');
            this.input.keyAxis = (right ? 1 : 0) - (left ? 1 : 0);
        };
        window.addEventListener('keydown', (e) => {
            if (this.phase === 'idle') return;
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
                e.preventDefault();
                if (!e.repeat) this.primaryAction();
            }
            if ((e.code === 'KeyE' || e.code === 'ShiftLeft') && !e.repeat) this.useAbility();
            keys.add(e.code);
            updateKeyAxis();
        });
        window.addEventListener('keyup', (e) => {
            keys.delete(e.code);
            updateKeyAxis();
        });

        window.addEventListener('deviceorientation', (e) => {
            if (!this.input.tiltEnabled || e.gamma === null) return;
            const angle = screen.orientation?.angle || window.orientation || 0;
            const tilt = angle === 90 ? e.beta : angle === -90 || angle === 270 ? -e.beta : e.gamma;
            this.input.tiltAxis = Math.max(-1, Math.min(1, tilt / 22));
        });
    }

    async enableTilt() {
        try {
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                const result = await DeviceOrientationEvent.requestPermission();
                this.input.tiltEnabled = result === 'granted';
            } else {
                this.input.tiltEnabled = 'DeviceOrientationEvent' in window;
            }
        } catch (e) {
            this.input.tiltEnabled = false;
        }
        return this.input.tiltEnabled;
    }

    disableTilt() {
        this.input.tiltEnabled = false;
        this.input.tiltAxis = 0;
    }

    onPointerDown(e) {
        e.preventDefault();
        this.audio.resume();
        if (this.input.pointer) {
            // A second finger while steering: jump right away
            if (e.pointerId !== this.input.pointer.id) this.primaryAction();
            return;
        }
        this.canvas.setPointerCapture?.(e.pointerId);
        this.input.pointer = { id: e.pointerId, anchorX: e.clientX, startX: e.clientX, startY: e.clientY, startTime: performance.now(), moved: 0 };
    }

    onPointerMove(e) {
        const p = this.input.pointer;
        if (!p || p.id !== e.pointerId) return;
        // Floating stick: the anchor trails the finger so reversing is instant
        const range = 48;
        let dx = e.clientX - p.anchorX;
        if (dx > range) { p.anchorX = e.clientX - range; dx = range; }
        if (dx < -range) { p.anchorX = e.clientX + range; dx = -range; }
        this.input.axis = dx / range;
        p.moved = Math.max(p.moved, Math.hypot(e.clientX - p.startX, e.clientY - p.startY));
    }

    onPointerUp(e) {
        const p = this.input.pointer;
        if (!p || p.id !== e.pointerId) return;
        if (performance.now() - p.startTime < 300 && p.moved < 20) this.primaryAction();
        this.input.pointer = null;
        this.input.axis = 0;
    }

    primaryAction() {
        if (this.isPaused) return;
        if (this.phase === 'intro') {
            this.scene3d.skipIntro();
            this.phase = 'ready';
        } else if (this.phase === 'ready') {
            this.dropMarble();
        } else if (this.phase === 'playing') {
            this.input.jumpBuffer = 0.15;
        } else if (this.phase === 'dead' && this.deathTimer < 0.5) {
            this.respawn();
        }
    }

    steerAxis() {
        const i = this.input;
        if (i.keyAxis !== 0) return i.keyAxis;
        if (i.pointer) return i.axis;
        if (i.tiltEnabled) return i.tiltAxis;
        return 0;
    }

    // ------------------------------------------------------------------
    // Level lifecycle
    // ------------------------------------------------------------------

    loadLevel(levelId, opts = {}) {
        // A level id (campaign, daily or a game-track Music Run), or a level object
        const levelData = typeof levelId === 'object' ? levelId : Game.levelFromId(levelId);
        if (!levelData) {
            console.error(`Level ${levelId} not found`);
            return false;
        }
        // Attract mode (the menu's live backdrop) loads a chute to fly down, nothing more
        this.attract = !!opts.attract;
        if (!this.attract && this.scene3d.resScale < 1) { this.scene3d.resScale = 1; this.scene3d.resize(); }
        this.currentLevelId = levelData.id;
        this.levelData = levelData;
        // A friend's ghost only races on the chute it was recorded on
        if (this.rival && this.rival.level !== levelData.id) this.rival = null;
        this.songPlayer?.stop(0.1);
        this.track = new Track(levelData);
        if (levelData.daily) {
            // No playtest for a fresh daily chute: star times follow its length
            const t = 2.6 + this.track.finishS / 46;
            levelData.starThresholds = { three: +t.toFixed(1), two: +(t * 1.15).toFixed(1), one: 999 };
        }
        this.run = null;
        if (levelData.song) {
            const map = levelData.song;
            this.run = {
                map,
                key: levelData.runKey || levelData.id,
                source: map.source,
                cpIndex: -1,
                restarts: 0,
                jumps: 0,
                onBeat: 0,
                songAt: null,
                cueT: 0
            };
            this.rival = null;
        }
        document.getElementById('game-screen')?.classList.toggle('music-run', !!this.run);
        this.starThresholds = levelData.starThresholds || { three: 30, two: 40, one: 999 };
        this.applyCameraSettings();

        const marbleId = Marble.STYLES[this.state.getSelectedMarble()] ? this.state.getSelectedMarble() : Marble.DEFAULT;
        const style = Marble.STYLES[marbleId];
        this.scene3d.resize();
        this.scene3d.endCine();
        this.scene3d.build(this.track, this.track.worldId);
        // The HUD glows in the world's colour
        document.getElementById('game-screen')?.style.setProperty('--hud', this.scene3d.palette.accent);
        this.scene3d.setMarbleStyle(style, marbleId, this.state.getSkins());
        this.marbleStyle = style;
        this.applyMarbleStats(style);

        // A designed level names its own track (an EDM track or another world's)
        const theme = MusicEngine.THEMES[levelData.music || this.track.worldId];
        this.beatLength = this.run ? this.run.map.beat : 60 / (theme ? theme.bpm : 124);

        this.resetRunState();
        this.attempts = 1;
        this.ghost = this.run ? null : this.loadGhost(levelData.id);
        this.setupRacers(levelData);
        this.hazardClock = 0;

        this.scene3d.playIntro(1.8);
        this.phase = 'intro';
        this.snapCamera = true;
        this.showLevelCard(levelData);

        if (this.attract) {
            // The menu's own music keeps playing under the flight
        } else if (this.run && this.run.source === 'file') {
            // The player's own song: the soundtrack waits, the song starts on the drop
            this.music?.stop(0.4);
            this.songPlayer?.load(levelData.audioBuffer, this.run.map);
            this.songPlayer?.setMuffled(false, 0.05);
        } else {
            const themeKey = this.run ? this.run.map.themeId : (levelData.music || this.track.worldId);
            this.audio.playMusic(themeKey, 'intro');
            this.music?.setSection('intro', true);
            this.music?.setMuffled(false, 0.1);
        }

        this.updateHUD();
        if (this.speedEl) this.speedEl.style.opacity = '0';
        if (this.jumpBtn) this.jumpBtn.classList.add('visible');
        this.scene3d.precompile();
        this.startLoop();
        return true;
    }

    resetRunState() {
        this.applyUpgrades();
        this.m = this.newMarbleState();
        this.placeMarbleInPipe();
        this.prevPos.copy(this.renderPos);
        this.marbleQuat.identity();
        this.score = 0;
        this.coinsCollected = 0;
        this.elapsedTime = 0;
        this.timeScale = 1;
        this.slowMoTimer = 0;
        this.hitStop = 0;
        this.isPaused = false;
        Object.assign(this.combo, { count: 0, multiplier: 1, timer: 0, pop: 0, best: 0 });
        this.input.jumpBuffer = 0;
        this.hudStars = -1;
        this.accumulator = 0;
        this.stepCount = 0;
        this.ghostRec = [];
        this.runRec = [];
        this.turn = null;
        this.holdS = 9;
        this.holdV = 8;
        if (this.run) Object.assign(this.run, { cpIndex: -1, restarts: 0, jumps: 0, onBeat: 0, songAt: null, cueT: 0 });
        this.dropCountdown = null;
        this.deathTimer = 0;
        this.coinIdx = 0;
        this.obIdx = 0;
        this.ability.cooldown = 0;
        if (this.ability.active > 0) this.scene3d.abilityFx(this.ability.type, this.ability.def.color, false);
        this.ability.active = 0;
        this.lastZone = null;
        this.railT = 0;
        if (this.track) {
            for (const c of this.track.coins) c.taken = false;
            for (const b of this.track.boosts) b.used = false;
        }
        const scoreEl = document.getElementById('hud-score');
        if (scoreEl) scoreEl.textContent = '0';
        const coinEl = document.getElementById('hud-coins');
        if (coinEl) coinEl.textContent = '0';
    }

    /** Tap to drop: the marble is released on the next beat, with the music drop */
    dropMarble() {
        this.scene3d.endCine();
        document.getElementById('level-card')?.classList.remove('show');
        if (this.phase !== 'ready' && this.phase !== 'intro') return;
        if (this.dropCountdown !== null) return;
        this.scene3d.skipIntro();
        this.phase = 'ready';
        if (this.run && this.run.source === 'file') {
            // The song starts now and the marble goes with it
            this.songPlayer?.play(0);
            this.run.cueT = 0;
            this.dropCountdown = 0;
        } else {
            this.music?.setSection('drop', 'beat');
            const wait = this.music ? this.music.timeToNextBeat() : 0;
            this.dropCountdown = Math.min(0.6, wait);
            if (this.run) this.markSongStart(wait, 0);
        }
        this.audio.play('drop');
        this.haptics.light();
        if (this.dropCountdown <= 0) this.releaseMarble();
    }

    releaseMarble() {
        this.dropCountdown = null;
        this.phase = 'playing';
        const head = this.upgrade('head_start');
        this.m.vs = this.holdV + head;
        if (head > 0) {
            this.scene3d.boostFx();
            this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 'HEAD START', '#ff8a3d');
        }
        this.state.addStat('gamesPlayed');
        this.haptics.medium();
    }

    startLevel() {
        if (this.phase === 'intro' || this.phase === 'ready') this.dropMarble();
    }

    /** Restart from the top (restart button, or automatically after a crash) */
    resetMarble(auto = false) {
        if (!this.track) return;
        // A Music Run restarted from the top starts its song again on the drop
        if (this.run && this.run.source === 'file') this.songPlayer?.stop(0.2);
        this.resetRunState();
        this.attempts++;
        this.snapCamera = true;
        this.scene3d.skipIntro();
        this.scene3d.showBanner(`ATTEMPT ${this.attempts}`);
        this.phase = 'ready';
        this.music?.setMuffled(false, 0.2);
        this.music?.setSection('intro', true);
        if (!auto) this.audio.play('click');
        this.haptics.light();
        this.updateHUD();
        this.startLoop();
    }

    respawn() {
        if (this.run) this.respawnAtCheckpoint();
        else this.resetMarble(true);
    }

    // ------------------------------------------------------------------
    // Music Runs: the song is the clock
    // ------------------------------------------------------------------

    get songPlayer() {
        return this.audio.songPlayer;
    }

    /**
     * The soundtrack's song time starts at the beat the marble is released on:
     * `wait` seconds from now as heard, at song time `cueT`
     */
    markSongStart(wait, cueT) {
        const ctx = this.audio.context;
        if (!ctx || !this.run) return;
        const lat = ctx.outputLatency || ctx.baseLatency || 0;
        this.run.songAt = ctx.currentTime + wait - lat;
        this.run.cueT = cueT;
    }

    /**
     * Song position in seconds. From the audio clock while the song plays, so
     * lasers, spinners and the beat scoring stay on the music even when frames
     * drop; from game time otherwise (and in automated playtests).
     */
    songTime() {
        const r = this.run;
        if (!r) return this.elapsedTime;
        const ctx = this.audio.context;
        if (!this.useAudioClock || !ctx || ctx.state !== 'running' || this.phase !== 'playing') return this.elapsedTime;
        if (r.source === 'file') return this.songPlayer && this.songPlayer.playing ? this.songPlayer.position() : this.elapsedTime;
        if (r.songAt === null || !this.music?.playing) return this.elapsedTime;
        const lat = ctx.outputLatency || ctx.baseLatency || 0;
        return ctx.currentTime - lat - r.songAt + r.cueT;
    }

    /** A jump tapped on the beat scores, and counts toward the run's grade */
    onJumpTap() {
        const r = this.run;
        if (!r || this.phase !== 'playing') return;
        const m = r.map;
        const t = this.songTime();
        if (t < m.firstBeat - 0.1) return;
        const k = Math.round((t - m.firstBeat) / m.beat);
        const off = Math.abs(t - (m.firstBeat + k * m.beat));
        r.jumps++;
        if (off < 0.075) {
            r.onBeat++;
            this.addCombo();
            this.addScore(50, 'ON BEAT');
        }
    }

    /**
     * Crashing in a Music Run rewinds to the last checkpoint instead of the
     * top: the marble is put back at the checkpoint, the song is wound back to
     * just before it, and the marble is released at the checkpoint's moment
     * in the song with the speed it would have had there.
     */
    respawnAtCheckpoint() {
        const r = this.run, tr = this.track;
        const cp = r.cpIndex >= 0 ? tr.checkpoints[r.cpIndex] : { s: 9, t: 0, v: 8 };
        r.restarts++;
        this.m = this.newMarbleState();
        this.m.s = cp.s;
        this.holdS = cp.s;
        this.holdV = Math.max(8, cp.v * 0.9);
        this.placeMarbleInPipe();
        this.prevPos.copy(this.renderPos);
        this.elapsedTime = cp.t;
        Object.assign(this.combo, { count: 0, multiplier: 1, timer: 0, pop: 0 });
        this.input.jumpBuffer = 0;
        if (this.ability.active > 0) this.scene3d.abilityFx(this.ability.type, this.ability.def.color, false);
        this.ability.active = 0;
        this.ability.cooldown = 0;
        this.coinIdx = 0;
        this.obIdx = 0;
        this.timeScale = 1;
        this.hitStop = 0;
        this.accumulator = 0;
        this.snapCamera = true;
        this.phase = 'ready';
        this.scene3d.skipIntro();
        this.scene3d.showBanner(cp.t > 0 ? 'REWIND' : 'FROM THE TOP', '#8fd3ff');
        this.haptics.light();
        if (r.source === 'file') {
            const lead = 1.0;
            this.songPlayer?.setMuffled(false, 0.1);
            this.songPlayer?.play(cp.t - lead);
            this.dropCountdown = lead;
        } else if (this.music && this.music.playing) {
            // The soundtrack restarts the bar the checkpoint falls in; the marble
            // goes at the checkpoint's exact moment within it
            const bar = r.map.beat * 4;
            const B = Math.floor(cp.t / bar + 1e-6);
            this.music.setMuffled(false, 0.2);
            this.music.cueBar(B);
            const wait = this.music.timeToNextBar();
            this.markSongStart(wait, B * bar);
            this.dropCountdown = wait + (cp.t - B * bar);
        } else {
            this.dropCountdown = 0.5;
        }
        this.updateHUD();
    }

    // ------------------------------------------------------------------
    // Loop
    // ------------------------------------------------------------------

    /**
     * Attract mode: the menu's live backdrop. A chute from a world the player
     * has reached is built and the camera flies down it with no marble; at the
     * end of the run another is picked. The menu's music keeps playing.
     */
    startAttract() {
        if (this.attract && this.phase === 'attract') return;
        const unlocked = (window.WORLDS || []).filter(w => this.state.isWorldUnlocked(w.id)).map(w => w.id);
        const pool = LEVELS.filter(l => unlocked.includes(l.worldId) && l.id !== this._lastAttract);
        const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : LEVELS[0];
        this._lastAttract = pick.id;
        this.loadLevel(pick.id, { attract: true });
        // A notch under full resolution on the menu: it is a backdrop, and it runs for as long as the menu is up
        if (this.scene3d.resScale > 0.85) { this.scene3d.resScale = 0.85; this.scene3d.resize(); }
        this.scene3d.skipIntro();
        this.scene3d.endCine();
        this.phase = 'attract';
        this.flyS = 8;
        this.snapCamera = true;
        this.startLoop();
    }

    stopAttract() {
        if (!this.attract) return;
        this.attract = false;
        if (this.phase === 'attract') this.stop();
    }

    /** The WebGL context came back: rebuild the scene for the current level and carry on */
    onContextRestored() {
        if (!this.track) return;
        try {
            this.scene3d.build(this.track, this.track.worldId);
            const marbleId = Marble.STYLES[this.state.getSelectedMarble()] ? this.state.getSelectedMarble() : Marble.DEFAULT;
            this.scene3d.setMarbleStyle(Marble.STYLES[marbleId], marbleId, this.state.getSkins());
            this.snapCamera = true;
        } catch (e) {
            console.warn('scene rebuild after context loss', e);
        }
    }

    startLoop() {
        if (this.loopRunning) return;
        this.loopRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.frame(t));
    }

    stop() {
        this.loopRunning = false;
        this.songPlayer?.stop(0.3);
        if (this.jumpBtn) this.jumpBtn.classList.remove('visible');
        this.phase = 'idle';
        this.input.pointer = null;
        this.input.axis = 0;
        this.music?.setMuffled(false, 0.1);
        this.audio.playMusic('menu', 'menu');
        this.music?.setSection('menu', true);
    }

    frame(now) {
        if (!this.loopRunning) return;
        const start = performance.now();
        const rawDt = Math.min((now - this.lastTime) / 1000, 1 / 20);
        this.lastTime = now;

        if (!this.isPaused) this.update(rawDt);
        if (!this.scene3d.contextLost) this.draw(rawDt);

        const cost = performance.now() - start;
        this.frameTimeAvg = this.frameTimeAvg * 0.95 + cost * 0.05;
        this.frameCount++;
        this.fpsTimer += rawDt;
        if (this.fpsTimer >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
            if (this.state.getSetting('showFps')) {
                document.getElementById('fps-counter').textContent = `FPS ${this.fps} | ${this.frameTimeAvg.toFixed(1)}ms`;
            }
            // Detect the display's refresh rate (ProMotion runs at 120) and keep up with it
            if (this.fps > 75) this.targetFps = 120;
            else if (!this.targetFps) this.targetFps = 60;
            if (this.phase === 'playing') {
                this.scene3d.adaptResolution(this.fps, this.targetFps);
                if (this.fps < 40 && this.scene3d.resScale <= 0.6 && this.scene3d.quality !== 'low') {
                    this.scene3d.setQuality(this.scene3d.quality === 'high' ? 'medium' : 'low');
                }
            }
        }
        requestAnimationFrame((t) => this.frame(t));
    }

    update(rawDt) {
        if (this.hitStop > 0) {
            this.hitStop -= rawDt;
            return;
        }
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= rawDt;
            if (this.slowMoTimer <= 0) this.timeScale = 1;
        }
        const dt = rawDt * this.timeScale;

        if (this.dropCountdown !== null) {
            this.dropCountdown -= rawDt;
            if (this.dropCountdown <= 0) this.releaseMarble();
        }
        if (this.phase === 'intro' && !this.scene3d.introActive) this.phase = 'ready';
        if (this.phase === 'dead') {
            this.deathTimer -= rawDt;
            if (this.deathTimer <= 0) this.respawn();
        }

        this.accumulator += dt;
        let steps = 0;
        while (this.accumulator >= this.STEP && steps < 8) {
            this.fixedStep(this.STEP);
            this.accumulator -= this.STEP;
            steps++;
        }
        if (steps === 8) this.accumulator = 0;
        this.alpha = this.accumulator / this.STEP;

        if (this.phase === 'playing') this.updateHUD();
    }

    fixedStep(dt) {
        const m = this.m;
        this.prevPos.set(m.P[0], m.P[1], m.P[2]);
        const playing = this.phase === 'playing';
        // In a Music Run the hazards run on the song's clock
        this.hazardClock = playing ? (this.run ? this.songTime() : this.elapsedTime) : (this.hazardClock || 0) + dt;

        if (playing) {
            this.elapsedTime += dt;
            this.stepCount++;
            this.updateAbility(dt);
            const sPrev = m.s;
            if (m.mode === 'pipe') this.stepPipe(dt);
            else this.stepAir(dt);
            for (const sec of this.track.sections) {
                if (sec.type === 'cliff' && sPrev < sec.crest && m.s >= sec.crest) this.onCliffCrest(sec);
                else if ((sec.type === 'loop' || sec.type === 'plunge' || sec.type === 'helix') && sPrev < sec.s1 && m.s >= sec.s1) this.onSpecialDone(sec);
                else if ((sec.type === 'loop' || sec.type === 'plunge' || sec.type === 'helix') && sPrev < sec.s0 && m.s >= sec.s0) this.onSpecialEnter(sec);
                else if (sec.type === 'kicker' && sPrev < sec.tip && m.s >= sec.tip) this.onKicker(sec);
            }
            // The launch shot ends on the landing
            const cine = this.scene3d.cine;
            if (cine && cine.kind === 'kicker' && m.mode === 'pipe' && cine.t > 0.4) this.scene3d.endCine();
            this.checkZones();
            // A tap counts for a short moment, so one made just before landing still jumps
            if (this.input.jumpBuffer > 0) this.input.jumpBuffer = Math.max(0, this.input.jumpBuffer - dt);
            if (this.phase !== 'playing') return;
            this.checkContent();
            if (this.phase !== 'playing') return;

            const c = this.combo;
            if (c.timer > 0) {
                c.timer -= dt;
                if (c.timer <= 0) {
                    c.count = 0;
                    c.multiplier = 1;
                }
            }
            c.pop = Math.max(0, c.pop - dt * 4);

            if (this.stepCount % 4 === 0) {
                this.ghostRec.push(+m.P[0].toFixed(2), +m.P[1].toFixed(2), +m.P[2].toFixed(2));
            }
            // The run in track coordinates, ten times a second: what a challenge link carries
            if (this.stepCount % 12 === 0) {
                const tc = this.marbleTrackCoords();
                this.runRec.push([tc.s, tc.phi, tc.h]);
            }
            if (this.stepCount % 6 === 0) {
                this.music?.setIntensity(this.speed() / 45 + c.multiplier * 0.08);
            }
            const r = this.run;
            if (r) {
                const cps = this.track.checkpoints || [];
                while (r.cpIndex + 1 < cps.length && m.s >= cps[r.cpIndex + 1].s) {
                    r.cpIndex++;
                    this.scene3d.addPopup(this.renderPos, 'CHECKPOINT', '#8fd3ff');
                }
            }
            if (m.s >= this.track.finishS) this.completeLevel();
        } else if (this.phase === 'complete') {
            // Coast through the finish in slow motion
            if (m.mode === 'pipe') this.stepPipe(dt);
            else this.stepAir(dt);
        } else if (this.phase === 'attract') {
            // Fly on down the chute; at the end, another chute
            this.flyS += dt * 30;
            if (this.flyS > this.track.finishS - 40) { this.attract = false; this.startAttract(); return; }
            m.s = this.flyS;
            this.placeMarbleInPipe();
        } else if (this.phase === 'ready' || this.phase === 'intro') {
            const charge = this.dropCountdown !== null ? Math.max(0, Math.min(1, 1 - this.dropCountdown / 0.6)) : 0;
            m.s = this.holdS - charge * 0.6;
            this.placeMarbleInPipe();
        }
        this.rollMarble(dt);
    }

    speed() {
        const m = this.m;
        if (m.mode === 'pipe') return Math.hypot(m.vs, m.vphi);
        return Math.hypot(m.V[0], m.V[1], m.V[2]);
    }

    placeMarbleInPipe() {
        if (!this.track) return;
        const m = this.m;
        this.track.point(m.s, m.phi, this.r, m.P);
        this.renderPos.set(m.P[0], m.P[1], m.P[2]);
    }

    /**
     * The surface under the marble: material multipliers (Game.MATERIALS),
     * gravity scale and the force piece in effect, if any
     */
    surfaceAt(s) {
        const tr = this.track;
        const mat = Game.MATERIALS[tr.materialAt(s)] || Game.MATERIALS[0];
        const force = tr.forceAt(s);
        const env = this._env || (this._env = {});
        env.roll = mat.roll; env.drag = mat.drag; env.steer = mat.steer; env.lat = mat.lat; env.jump = mat.jump; env.bounce = mat.bounce;
        env.g = force && force.type === 'zerog' ? force.g : 1;
        env.force = force;
        return env;
    }

    /** Entering a material stretch or force piece: name it once */
    checkZones() {
        const tr = this.track;
        const s = this.m.s;
        const i = Math.max(0, Math.min(tr.count - 1, Math.floor(s)));
        const zone = tr.forceIdx[i] >= 0 ? tr.sections[tr.forceIdx[i]] : tr.mat[i] ? Track.MATERIALS[tr.mat[i]] : null;
        if (zone === this.lastZone) return;
        this.lastZone = zone;
        if (!zone) return;
        const key = typeof zone === 'string' ? zone : zone.type;
        const label = Game.ZONE_NAMES[key];
        if (label) this.scene3d.addPopup(this.renderPos, label, Game.ZONE_COLORS[key] || '#ffffff');
    }

    /** One step rolling inside the pipe */
    stepPipe(dt) {
        const m = this.m;
        const tr = this.track;
        const f = tr.frame(m.s);
        const T = f.T, Rv = f.R, U = f.U, K = f.K;
        const env = this.surfaceAt(m.s);
        const G = this.G * env.g;
        const reff = this.R - this.r;
        const sticky = this.abilityOn('stick');
        const fx = env.force;
        // Inside a loop the marble is held to the floor like a coaster car on
        // its rails: it rides the outside of the loop whatever its speed
        const inLoop = !!fx && fx.type === 'loop';
        const glued = sticky || inLoop || (!!fx && fx.type === 'plunge');

        // Gravity is (0, -G, 0); its downhill part drives the run
        const gT = -G * T[1];
        let as = gT * this.K57 - this.ROLL * env.roll * Math.sign(m.vs) - this.DRAG * env.drag * m.vs * Math.abs(m.vs);

        const sp = Math.sin(m.phi), cp = Math.cos(m.phi);
        const er = [Rv[0] * sp - U[0] * cp, Rv[1] * sp - U[1] * cp, Rv[2] * sp - U[2] * cp];
        const ep = [Rv[0] * cp + U[0] * sp, Rv[1] * cp + U[1] * sp, Rv[2] * cp + U[2] * sp];
        // Effective acceleration in the cross-section: gravity minus the centrifugal term
        const v2 = m.vs * m.vs;
        const aeff = [
            -gT * T[0] - v2 * K[0],
            -G - gT * T[1] - v2 * K[1],
            -gT * T[2] - v2 * K[2]
        ];
        // A fast, tight bend pulls harder than its banking was built for: the
        // extra pushes toward the outside wall, so coasting through it slides
        // the marble up that wall and only steering into the bend holds the line
        const kLat = K[0] * Rv[0] + K[1] * Rv[1] + K[2] * Rv[2];
        const turnPull = v2 * Math.abs(kLat);
        const bite = Math.min(this.TURN_CAP, this.TURN_BITE * Math.max(0, turnPull - this.TURN_FREE)) * Math.sign(kLat);
        for (let c = 0; c < 3; c++) aeff[c] -= bite * Rv[c];
        // Steering fades out high on the wall: you can climb it, not steer over the rim
        const axis = this.steerAxis();
        let steer = axis * this.STEER * env.steer * (sticky ? 1.4 : 1);
        if (axis * m.phi > 0 && Math.abs(m.phi) > 0.9) steer *= Math.max(0, (1.55 - Math.abs(m.phi)) / 0.65);
        let aPhi = (aeff[0] * ep[0] + aeff[1] * ep[1] + aeff[2] * ep[2]) * this.K57 + steer;

        // Force pieces (a stuck marble ignores the ones that push it around)
        if (fx) {
            switch (fx.type) {
                case 'groove':
                    aPhi -= m.phi * fx.k;
                    break;
                case 'sidewind':
                    if (!sticky) aPhi += fx.dir * fx.strength;
                    break;
                case 'well': {
                    const dsW = fx.sw - m.s;
                    const fall = Math.exp(-dsW * dsW / 220);
                    as += Math.sign(dsW) * fx.strength * 0.45 * fall;
                    if (!sticky) aPhi += (fx.phiW - m.phi) * fx.strength * 0.9 * fall;
                    break;
                }
                case 'rail': {
                    const e = fx.phi - m.phi;
                    if (Math.abs(e) < 0.6) {
                        aPhi += e * 40 - m.vphi * 5;
                        if (Math.abs(e) < 0.12) {
                            as += fx.boost * (1 + this.SPIN * 0.5);
                            this.onRail(fx, dt);
                        }
                    }
                    break;
                }
            }
        }
        m.vphi += aPhi * dt;
        // Sliding outward in a bend the marble keeps its momentum and swings up the wall
        const sliding = turnPull > 25 && m.vphi * kLat < 0 && !sticky;
        m.vphi *= 1 - this.LAT_DAMP * env.lat * (sticky ? 2 : sliding ? this.SLIDE_DAMP : 1) * dt;
        m.phi += (m.vphi / reff) * dt;
        // Riding high on a wall scrapes: speed bleeds away, so the inside line is the fast one
        const tubeHere = f.wallL > 3.1 && f.wallR > 3.1;
        const high = tubeHere ? 0 : Math.abs(m.phi) - 0.6;
        if (high > 0) as -= this.SCRUB * high * high * m.vs;
        this.trackTurn(turnPull, high, dt);
        as += this.paceAssist();
        // Top speed is capped (about 175 km/h): faster than this, jumps over bends overshoot the pipe
        const cap = 48 + (this.abilityOn('burst') ? 14 : 0);
        m.vs = Math.min(cap, Math.max(inLoop ? 6 : 1, m.vs + as * dt));
        const sBefore = m.s;
        m.s += m.vs * dt;

        const f2 = tr.frame(m.s);
        // In a closed tube (spiral funnel) the angle wraps and there is no rim to fall off
        const tube = f2.wallL > 3.1 && f2.wallR > 3.1;
        if (tube) {
            if (m.phi > Math.PI) m.phi -= Math.PI * 2;
            else if (m.phi < -Math.PI) m.phi += Math.PI * 2;
        }

        // Jump: push off the wall toward the pipe axis (not inside a loop)
        if (this.input.jumpBuffer > 0 && !inLoop) {
            if (this.phase === 'playing') {
                this.toAir(-this.JUMP * env.jump, 0);
                this.input.jumpBuffer = 0;
                this.onJumpTap();
                this.audio.play('jump');
                this.haptics.light();
                this.scene3d.emit(this.renderPos, 8, '#ffffff', 5, 0.4);
                this.scene3d.jumpFx(this.renderPos, this._surfN);
                return;
            }
        }

        if (f2.gap) {
            // Rolled off the ledge without jumping: free fall, and the far wall is waiting
            this.toAir(0, 0, true);
            return;
        }
        if (glued) {
            // Glued on: never over the rim
            m.phi = Math.max(-f2.wallL + 0.05, Math.min(f2.wallR - 0.05, m.phi));
        } else if (!tube && (m.phi > f2.wallR || m.phi < -f2.wallL)) {
            this.toAir(0, 0, false);
            return;
        }
        // Ripple bumps: a hop off every ridge
        if (fx && fx.type === 'bumps' && m.s > fx.s0 && m.s < fx.s1 &&
            Math.floor((m.s - fx.s0) / fx.spacing) !== Math.floor((sBefore - fx.s0) / fx.spacing)) {
            m.vs *= 0.97 + 0.03 * this.SPIN;
            this.toAir(-fx.kick, 0);
            this.audio.play('bounce', { intensity: 0.3 });
            this.haptics.light();
            this.scene3d.emit(this.renderPos, 5, '#ffffff', 3, 0.3);
            return;
        }
        // Falls off the wall if it is not pressed against it; flies off the floor
        // over a sharp crest (a cliff) when the chute drops away faster than gravity
        const fn = (m.vphi * m.vphi) / reff + (aeff[0] * er[0] + aeff[1] * er[1] + aeff[2] * er[2]);
        if (!tube && !glued && fn < 0 && Math.abs(m.phi) > 0.9) {
            this.toAir(0, 0, false);
            return;
        }
        if (!tube && !glued && fn < -8 && Math.abs(m.phi) < 0.5) {
            this.toAir(0, 0, true);
            // The chute is straight between samples, so a marble leaving along the
            // tangent still reads as touching it: give it a moment to get clear
            m.landGrace = 0.08;
            return;
        }
        this.placeMarbleInPipe();
    }

    /**
     * Music Runs: the course was laid out on a model marble's timeline, every
     * cliff crest on a drop. Lagging behind that timeline (song time past the
     * model's time at the marble's spot) pushes the marble along; running
     * ahead holds it back. Gentle and capped, and only on the chute.
     */
    paceAssist() {
        const r = this.run, tr = this.track;
        if (!r || !tr.tAt || this.phase !== 'playing') return 0;
        const lag = this.songTime() - tr.timeAtS(this.m.s);
        const e = Math.abs(lag) <= this.PACE_BAND ? 0 : lag - Math.sign(lag) * this.PACE_BAND;
        this.paceLag = lag;
        return Math.max(-this.PACE_MAX, Math.min(this.PACE_MAX, e * this.PACE_GAIN));
    }

    /**
     * Over a cliff edge: hang time. The world slows for a moment as the chute
     * drops away; in a Music Run the crest lands on the drop, and arriving on
     * it scores
     */
    onCliffCrest(sec) {
        if (this.phase !== 'playing' || this.speed() < 16) return;
        this.timeScale = this.HANG_SCALE;
        this.slowMoTimer = this.HANG_TIME;
        this.scene3d.cliffFx(this.renderPos, this._surfN || [0, 1, 0]);
        if (this.state.getSetting('screenShake')) this.scene3d.addShake(0.3);
        if (this.cineOn()) this.scene3d.startCine('cliff', sec, 1.3);
        this.haptics.medium();
        const r = this.run, tr = this.track;
        if (r && tr.crestTimes) {
            const k = tr.sections.filter(x => x.type === 'cliff').indexOf(sec);
            const tc = tr.crestTimes[k];
            if (tc !== undefined && Math.abs(this.songTime() - tc) < 0.25) {
                r.onDrop = (r.onDrop || 0) + 1;
                this.addCombo();
                this.addScore(150, 'ON THE DROP');
            }
        }
    }

    /** The level's title card over the intro flyover: the world, the name with a glitch, what is in it */
    showLevelCard(levelData) {
        const card = document.getElementById('level-card');
        if (!card) return;
        if (this.attract) { card.classList.remove('show'); return; }
        const world = (window.WORLDS || []).find(w => w.id === levelData.worldId);
        const theme = this.run && this.run.map.themeId ? MusicEngine.THEMES[this.run.map.themeId] : null;
        const name = theme ? theme.name : levelData.name;
        document.getElementById('lc-world').textContent = levelData.daily ? 'Daily chute' : this.run ? 'Music Run' : world ? world.name : '';
        const nameEl = document.getElementById('lc-name');
        nameEl.textContent = name;
        nameEl.setAttribute('data-text', name);
        document.getElementById('lc-sub').textContent = theme ? `${theme.genre ? theme.genre + ' · ' : ''}${theme.bpm} BPM` : (levelData.subtitle || '').replace(/ \u00b7 \d+ m$/, '');
        card.classList.remove('show');
        void card.offsetWidth;
        // On the next frame, so the fade runs even when the screen itself was just shown
        requestAnimationFrame(() => requestAnimationFrame(() => { if (this.phase === 'intro' || this.phase === 'ready') card.classList.add('show'); }));
        clearTimeout(this._cardT);
        this._cardT = setTimeout(() => card.classList.remove('show'), 3600);
    }

    /** Cinematic cameras are on unless turned off in the settings */
    cineOn() {
        return this.phase === 'playing' && this.state.getSetting('cineCams') !== false;
    }

    /** Into a loop, a plunge or a helix: the trackside shot */
    onSpecialEnter(sec) {
        if (!this.cineOn()) return;
        if (sec.type === 'loop') this.scene3d.startCine('loop', sec, 0);
        else if (sec.type === 'helix') this.scene3d.startCine('helix', sec, 2.8);
        else if (sec.type === 'plunge') this.scene3d.startCine('plunge', sec, 1.5);
    }

    /** Out of a loop or a plunge: points, more for speed */
    onSpecialDone(sec) {
        if (this.scene3d.cine && this.scene3d.cine.kind === sec.type) this.scene3d.endCine();
        if (this.phase !== 'playing') return;
        const fast = this.speed() > 30;
        this.addCombo();
        const label = sec.type === 'loop' ? (fast ? 'FULL LOOP' : 'LOOP') : sec.type === 'helix' ? (fast ? 'HELIX TOWER' : 'HELIX') : 'PLUNGE';
        this.addScore(sec.type === 'loop' ? (fast ? 400 : 250) : sec.type === 'helix' ? (fast ? 350 : 220) : 200, label);
        this.haptics.medium();
        this.scene3d.spawnRing(this.renderPos, this._surfN || [0, 1, 0], this.scene3d.palette.accent2, 5, 0.45);
    }

    /** Off the kicker's lip: hang time, like a cliff crest */
    onKicker(sec) {
        if (this.phase !== 'playing' || this.speed() < 14) return;
        this.timeScale = this.HANG_SCALE;
        this.slowMoTimer = this.HANG_TIME;
        this.scene3d.cliffFx(this.renderPos, this._surfN || [0, 1, 0]);
        if (this.cineOn() && sec) this.scene3d.startCine('kicker', sec, 2.2);
        this.haptics.medium();
        this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.3, 0)), 'LAUNCH!', '#ffd166');
    }

    /**
     * Sharp bends: sparks and a buzz while the marble scrapes high on a wall,
     * a nudge to lean in, and an APEX bonus for holding the inside line all
     * the way through a fast, tight bend
     */
    trackTurn(pull, high, dt) {
        const ts = this.turn || (this.turn = { on: false, t: 0, max: 0, warned: false, fx: 0 });
        const m = this.m;
        if (pull > 40) {
            if (!ts.on) Object.assign(ts, { on: true, t: 0, max: 0, warned: false });
            ts.t += dt;
            ts.max = Math.max(ts.max, Math.abs(m.phi));
            if (!ts.warned && Math.abs(m.phi) > 1.05 && this.phase === 'playing') {
                ts.warned = true;
                this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.3, 0)), 'LEAN IN!', '#ff9f43');
            }
        } else if (ts.on && pull < 30) {
            ts.on = false;
            if (ts.t > 0.5 && ts.max < 0.45 && this.phase === 'playing') {
                this.addCombo();
                this.addScore(60, 'APEX');
                this.haptics.light();
            }
        }
        ts.fx -= dt;
        if (high > 0.15 && ts.fx <= 0 && this.phase === 'playing') {
            ts.fx = 0.06;
            this.scene3d.emit(this.renderPos, 2 + Math.round(high * 4), '#ffd27a', 4, 0.28, 0.7);
            ts.buzz = (ts.buzz || 0) + 1;
            if (high > 0.35 && ts.buzz % 3 === 0) this.haptics.light();
        }
    }

    /** A drop in the music lands: haptic thump, camera shake, shockwave and a field-of-view punch */
    onMusicDrop() {
        this.haptics.heavy?.();
        if (this.state.getSetting('screenShake')) this.scene3d.addShake(0.32);
        this.scene3d.boostFx();
        this.scene3d.spawnRing(this.renderPos, this._surfN, this.scene3d.palette.accent, 7, 0.55);
        this.scene3d.emit(this.renderPos, 26, this.scene3d.palette.accent2, 9, 0.6);
    }

    /** Grinding a magnetic rail: sparks, and points once per rail */
    onRail(fx, dt) {
        this.railT += dt;
        if (this.railT > 0.08) {
            this.railT = 0;
            this.scene3d.emit(this.renderPos, 3, '#ffe066', 4, 0.3, 0.6);
        }
        if (!this.m.nearMiss.has(fx)) {
            this.m.nearMiss.add(fx);
            this.addCombo();
            this.addScore(50, 'RAIL');
            this.haptics.light();
        }
    }

    /** Leave the pipe: radial < 0 pushes inward (jump), lift is along the floor normal */
    toAir(radial, lift, assist = true) {
        const m = this.m;
        // Jumps and gaps get a little guidance along the chute; flying off a rim does not
        m.assist = assist;
        const f = this.track.frame(m.s);
        const sp = Math.sin(m.phi), cp = Math.cos(m.phi);
        for (let c = 0; c < 3; c++) {
            const er = f.R[c] * sp - f.U[c] * cp;
            const ep = f.R[c] * cp + f.U[c] * sp;
            m.V[c] = f.T[c] * m.vs + ep * m.vphi + er * radial + f.U[c] * lift;
        }
        this.track.point(m.s, m.phi, this.r, m.P);
        m.mode = 'air';
        if (this.turn) this.turn.on = false;
        m.airTime = 0;
        m.prevDist = this.R - this.r - 0.001;
    }

    stepAir(dt) {
        const m = this.m;
        const tr = this.track;
        m.airTime += dt;
        const near = tr.frame(m.s);
        // Double jump: one extra push up off the pipe's floor direction
        if (this.input.jumpBuffer > 0 && m.airJumps > 0 && m.airTime > 0.08 && this.phase === 'playing') {
            m.airJumps--;
            this.input.jumpBuffer = 0;
            const up = near.U;
            const vu = m.V[0] * up[0] + m.V[1] * up[1] + m.V[2] * up[2];
            const add = Math.max(0, this.JUMP * 0.85 - Math.max(vu, 0) * 0.5) + Math.max(0, -vu);
            for (let c = 0; c < 3; c++) m.V[c] += up[c] * add;
            this.onJumpTap();
            this.audio.play('jump');
            this.haptics.light();
            this.scene3d.emit(this.renderPos, 12, this.marbleStyle.glowColor || '#ffffff', 6, 0.45);
        }
        const steer = this.steerAxis() * this.AIR_STEER;
        // Zero-g tunnels and the Float ability lighten gravity in flight
        const env = this.surfaceAt(m.s);
        const G = this.G * env.g * (this.abilityOn('float') ? 0.4 : 1);
        m.V[0] += near.R[0] * steer * dt;
        m.V[1] += -G * dt + near.R[1] * steer * dt;
        m.V[2] += near.R[2] * steer * dt;
        m.P[0] += m.V[0] * dt;
        m.P[1] += m.V[1] * dt;
        m.P[2] += m.V[2] * dt;

        const loc = tr.locate(m.P, m.s);
        m.s = loc.s;
        const f = loc.frame;
        if (f.gap) m.overGap = true;

        // In-flight guidance: the chute bends the flight path with it, so a jump
        // taken into a curve still comes down in the pipe (off a rim you are on your own)
        if (m.assist) {
            const sp = Math.hypot(m.V[0], m.V[1], m.V[2]);
            const along = m.V[0] * f.T[0] + m.V[1] * f.T[1] + m.V[2] * f.T[2];
            if (along > 0) {
                // Turn the flight with the chute's heading, so a bend under the
                // marble does not read as sideways drift
                const yr = tr.yawRate[Math.max(0, Math.min(tr.count - 1, Math.floor(loc.s)))];
                const dA = yr * along * dt;
                if (dA) {
                    const ca = Math.cos(dA), sa = Math.sin(dA);
                    const vx = m.V[0], vz = m.V[2];
                    m.V[0] = vx * ca + vz * sa;
                    m.V[2] = vz * ca - vx * sa;
                }
                // The jump's own sideways push (off a wall it aims back toward the
                // centre) fades over about half a second, with a soft spring toward
                // the centreline; the upward part is left alone so jumps keep their height.
                // "Sideways" is measured horizontally: high above a banked bend the
                // tilted frame would otherwise read height as offset
                const rl = Math.hypot(f.R[0], f.R[2]) || 1;
                const rhx = f.R[0] / rl, rhz = f.R[2] / rl;
                const k = Math.min(1, dt * 2.5);
                const side = m.V[0] * rhx + m.V[2] * rhz;
                const xh = (m.P[0] - f.C[0]) * rhx + (m.P[2] - f.C[2]) * rhz;
                const lat = -side * k - xh * 10 * dt;
                m.V[0] += rhx * lat;
                m.V[2] += rhz * lat;
                // Keep the along-track speed: turning the flight should not slow it
                const sp2 = Math.hypot(m.V[0], m.V[1], m.V[2]) || 1;
                for (let c = 0; c < 3; c++) m.V[c] *= sp / sp2;
            }
            // Over a steep drop the chute falls away faster than gravity brings the
            // marble down; pull it back toward the floor once it rises above the axis.
            // Not over a cliff: there the long free fall is the point
            const cliff = env.force && (env.force.type === 'cliff' || env.force.type === 'kicker');
            const pull = cliff ? 0 : Math.min(1, Math.max(0, (loc.y - 1.5) / 3)) * 24 * env.g;
            if (pull > 0) for (let c = 0; c < 3; c++) m.V[c] -= f.U[c] * pull * dt;
        }
        const dx = loc.x, dy = loc.y - this.R;
        const dist = Math.hypot(dx, dy);
        const phi = Math.atan2(dx, -dy);
        const reff = this.R - this.r;
        // During the grace after a natural lift-off the last distance stays "inside",
        // so a marble that never got clear lands the moment the grace ends
        if (m.landGrace > 0) m.landGrace -= dt;
        const canLand = m.landGrace <= 0;

        if (canLand && !f.gap && m.prevDist < reff && dist >= reff && phi <= f.wallR && phi >= -f.wallL) {
            // Land: keep the along-track and around-pipe velocity, absorb the impact
            const sp = Math.sin(phi), cp = Math.cos(phi);
            let vs = 0, vp = 0, vr = 0;
            for (let c = 0; c < 3; c++) {
                vs += m.V[c] * f.T[c];
                vp += m.V[c] * (f.R[c] * cp + f.U[c] * sp);
                vr += m.V[c] * (f.R[c] * sp - f.U[c] * cp);
            }
            m.mode = 'pipe';
            m.phi = phi;
            // Hard landings scrub speed; marbles with good spin retention keep more of it
            m.vs = Math.max(1, vs) * (vr > 6 ? 0.86 + 0.14 * this.SPIN : 1);
            m.vphi = vp;
            this.placeMarbleInPipe();
            m.airJumps = this.AIR_JUMPS;
            if (m.overGap) {
                m.overGap = false;
                this.addCombo();
                this.addScore(100, 'GAP');
            }
            this.onLand(vr, m.airTime);
            // Bouncy marbles (and rubber) hop off hard landings; capped so a cliff
            // landing cannot relaunch the marble into another long flight
            const hop = Math.min(6, vr * this.BOUNCE * env.bounce * 0.6);
            if (hop > 2.5 && this.phase === 'playing') this.toAir(-hop, 0);
            return;
        }
        if (canLand) m.prevDist = dist;

        // Below the floor past a gap: smashed into the far ledge
        if (canLand && !f.gap && dist > reff + 0.2 && loc.y < this.R * 0.35) {
            this.die('fell');
            return;
        }
        // Lost: well below the chute, far off to the side, or airborne far too long.
        // High above it is fine: that is a cliff fall waiting to land
        if (loc.y < -9 || Math.abs(dx) > this.R + 9 || (dy < 0 && dist > this.R + 9) || m.airTime > 10 || loc.s >= tr.length - 0.5 && dist > this.R) {
            this.die('fell');
        }
    }

    onLand(impact, airTime) {
        this.scene3d.landingFx(this.renderPos, this._surfN, Math.min(1, Math.max(0.25, impact / 16)));
        if (impact > 6) {
            const k = Math.min(1, impact / 20);
            this.audio.play('bounce', { intensity: k });
            this.haptics.bounce(impact * 40);
            this.scene3d.emit(this.renderPos, Math.round(6 + 14 * k), this.scene3d.palette.accent, 6, 0.5);
            if (this.state.getSetting('screenShake')) this.scene3d.addShake(k * 0.35);
        }
        if (airTime > 0.6) {
            this.addCombo();
            this.addScore(Math.round(airTime * 10) * 10, 'AIR');
        }
    }

    /** Spin the marble so it visibly rolls */
    rollMarble(dt) {
        const m = this.m;
        let vx, vy, vz, nx, ny, nz;
        if (m.mode === 'pipe') {
            const f = this.track.frame(m.s);
            const sp = Math.sin(m.phi), cp = Math.cos(m.phi);
            nx = -(f.R[0] * sp - f.U[0] * cp); ny = -(f.R[1] * sp - f.U[1] * cp); nz = -(f.R[2] * sp - f.U[2] * cp);
            vx = f.T[0] * m.vs + (f.R[0] * cp + f.U[0] * sp) * m.vphi;
            vy = f.T[1] * m.vs + (f.R[1] * cp + f.U[1] * sp) * m.vphi;
            vz = f.T[2] * m.vs + (f.R[2] * cp + f.U[2] * sp) * m.vphi;
            this.spin = this.spin || new THREE.Vector3();
            this.spin.set(ny * vz - nz * vy, nz * vx - nx * vz, nx * vy - ny * vx).divideScalar(this.r);
            this._vel = this._vel || [0, 0, 0];
            this._vel[0] = vx; this._vel[1] = vy; this._vel[2] = vz;
        }
        if (!this.spin) return;
        const w = this.spin.length();
        if (w < 1e-4) return;
        this._q = this._q || new THREE.Quaternion();
        this._axis = this._axis || new THREE.Vector3();
        this._q.setFromAxisAngle(this._axis.copy(this.spin).divideScalar(w), w * dt);
        this.marbleQuat.premultiply(this._q);
    }

    // ------------------------------------------------------------------
    // Coins, boosts, obstacles
    // ------------------------------------------------------------------

    marbleTrackCoords() {
        const m = this.m;
        if (m.mode === 'pipe') return { s: m.s, phi: m.phi, h: 0 };
        const loc = this.track.locate(m.P, m.s);
        const dx = loc.x, dy = loc.y - this.R;
        const dist = Math.hypot(dx, dy);
        return { s: loc.s, phi: Math.atan2(dx, -dy), h: this.R - dist - this.r };
    }

    checkContent() {
        const tr = this.track;
        const m = this.m;
        const P = m.P;

        // Coins (the Magnet ability reaches much further)
        const magnet = this.abilityOn('magnet');
        const reach = magnet ? 6.5 : this.coinReach;
        while (this.coinIdx < tr.coins.length && tr.coins[this.coinIdx].s < m.s - reach - 2) this.coinIdx++;
        for (let i = this.coinIdx; i < tr.coins.length && tr.coins[i].s < m.s + reach + 2; i++) {
            const c = tr.coins[i];
            if (c.taken) continue;
            const p = this.scene3d.coinBase[i];
            const d = Math.hypot(p.x - P[0], p.y - P[1], p.z - P[2]);
            if (d < reach) {
                c.taken = true;
                this.coinsCollected++;
                document.getElementById('hud-coins').textContent = this.coinsCollected;
                this.addCombo();
                this.addScore(100);
                if (!this.music?.playCollect(this.combo.count - 1)) this.audio.play('coin');
                this.scene3d.emit(p, 10, '#ffc93c', 5, 0.45);
                this.haptics.light();
            }
        }

        const tc = this.marbleTrackCoords();

        // Boost pads
        if (m.mode === 'pipe') {
            for (const b of tr.boosts) {
                if (b.used || m.s < b.s || m.s > b.s + b.len) continue;
                if (Math.abs(m.phi - b.phi) < b.width / 2 + 0.15) {
                    b.used = true;
                    m.vs += 10;
                    this.addCombo();
                    this.addScore(25, 'BOOST');
                    this.audio.play('boost');
                    this.haptics.boost();
                    this.scene3d.emit(this.renderPos, 16, '#22f0c8', 7, 0.5);
                    this.scene3d.addShake(0.15);
                    this.scene3d.boostFx();
                }
            }
        }

        // Obstacles (none can touch a phased marble, or one whose shield just took a hit)
        if (this.abilityOn('phase') || this.shieldT > 0) return;
        const obs = tr.obstacles;
        while (this.obIdx < obs.length && obs[this.obIdx].s < tc.s - 4) this.obIdx++;
        const angR = this.r / (this.R - this.r);
        for (let i = this.obIdx; i < obs.length && obs[i].s < tc.s + 30; i++) {
            const o = obs[i];
            const oS = tr.obstacleS(o, this.hazardClock);
            const ds = Math.abs(tc.s - oS);
            if (ds > 4) continue;
            if (o.type === 'mine') {
                const p = tr.point(o.s, o.phi, o.h);
                const d = Math.hypot(p[0] - P[0], p[1] - P[1], p[2] - P[2]);
                if (d < o.radius + this.r * 0.75) {
                    this.killer = o;
                    return this.die('mine');
                }
                continue;
            }
            if (o.type === 'spinner') {
                // Either end of the rod sweeps the surface; it only hits a marble on the floor
                const ang = tr.spinnerAngle(o, this.hazardClock, this.beatLength);
                let dAng = ((tc.phi - ang) % Math.PI + Math.PI * 1.5) % Math.PI - Math.PI / 2;
                if (ds < o.depth / 2 + this.r * 0.8 && Math.abs(dAng) < 0.2 + angR && tc.h < o.h) {
                    this.killer = o;
                    return this.die('hurdle');
                }
                if (ds < o.depth / 2 + this.r * 0.8 && !m.nearMiss.has(o) && tc.h >= o.h) {
                    m.nearMiss.add(o);
                    this.addCombo();
                    this.addScore(75, 'JUMP');
                }
                continue;
            }
            const phiC = tr.obstaclePhi(o, this.hazardClock, this.beatLength);
            const dphi = Math.abs(tc.phi - phiC);
            const active = tr.obstacleActive(o, this.hazardClock, this.beatLength);
            if (ds < o.depth / 2 + this.r * 0.8) {
                if (active && dphi < o.half + angR * 0.8 && tc.h < o.h) {
                    this.killer = o;
                    return this.die(o.jump ? 'hurdle' : 'block');
                }
                // Clearing a jump obstacle in the air is worth points
                if (o.jump && !m.nearMiss.has(o) && tc.h >= o.h) {
                    m.nearMiss.add(o);
                    this.addCombo();
                    this.addScore(active ? 75 : 30, active ? 'JUMP' : 'CLEAR');
                    this.haptics.light();
                }
            } else if (!o.jump && tc.s > oS + o.depth / 2 && !m.nearMiss.has(o) && ds < 2.5) {
                m.nearMiss.add(o);
                if (dphi < o.half + angR + 0.25) {
                    this.addCombo();
                    this.addScore(50, 'CLOSE');
                    this.haptics.light();
                }
            }
        }
    }

    addCombo() {
        const c = this.combo;
        c.count++;
        c.timer = c.window;
        c.pop = 1;
        c.multiplier = Math.min(5, 1 + Math.floor(c.count / 2));
        c.best = Math.max(c.best, c.count);
    }

    addScore(points, label = null) {
        const value = points * this.combo.multiplier;
        this.score += value;
        const el = document.getElementById('hud-score');
        if (el) el.textContent = this.score.toLocaleString();
        const text = label ? `${label} +${value}` : `+${value}`;
        const color = this.combo.multiplier >= 3 ? '#ffc93c' : '#ffffff';
        this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.2, 0)), text, color);
    }

    // Kept for UI/back-compat
    collectCoin(value = 1) {
        this.coinsCollected += value;
    }

    // ------------------------------------------------------------------
    // Crashes
    // ------------------------------------------------------------------

    die(reason) {
        this.scene3d.endCine();
        if (this.phase !== 'playing') return;
        if (reason !== 'fell' && this.shields > 0) return this.useShield();
        this.phase = 'dead';
        this.deathTimer = 0.75;
        this.deathReason = reason;
        const p = this.renderPos.clone().set(this.m.P[0], this.m.P[1], this.m.P[2]);
        this.scene3d.emit(p, 40, this.marbleStyle.glowColor || '#ffffff', 12, 0.9);
        this.scene3d.emit(p, 20, '#ff2e63', 9, 0.7);
        if (this.state.getSetting('screenShake')) this.scene3d.addShake(reason === 'fell' ? 0.3 : 0.7);
        this.scene3d.flash = reason === 'fell' ? 0.35 : 0.6;
        this.hitStop = reason === 'fell' ? 0 : 0.06;
        this.audio.play('fail');
        this.haptics.notificationError();
        this.music?.setMuffled(true, 0.08);
    }

    failLevel() {
        this.die('fell');
    }

    // ------------------------------------------------------------------
    // Drawing
    // ------------------------------------------------------------------

    draw(dt) {
        if (!this.track) return;
        const cine = this.scene3d.cine;
        const bars = !!cine && cine.kind !== 'finish';
        if (bars !== this._barsShown) { this._barsShown = bars; document.getElementById('game-screen')?.classList.toggle('cine', bars); }
        const music = this.music;
        let hint = null;
        let subHint = null;
        if (this.phase === 'ready' && this.dropCountdown === null) {
            hint = this.run ? 'TAP TO START THE SONG' : 'TAP TO DROP';
            subHint = this.run ? 'Jump on the beat · Cliffs land on the drops' :
                this.levelData.hint || (this.input.tiltEnabled ? 'Tilt to steer · Tap to jump' : 'Drag to steer · Tap to jump');
            if (this.rival) subHint = `Racing ${this.rival.name || 'a friend'} · ${this.rival.time.toFixed(2)}s`;
            if (this.fairRace() && this.hasPerfUpgrades()) subHint += ' · Fair race: upgrades off';
        }
        // Beat and drop flashes come from whatever is playing the music
        const beatSource = this.run && this.run.source === 'file' ? this.songPlayer : music;
        // The music's drops hit the player too: a thump, a shake, a shockwave
        const dropFlash = beatSource ? beatSource.getDropFlash() : 0;
        // (the flash only decays after a drop, so crossing upward is a new drop at any frame rate)
        if (dropFlash > 0.3 && (this._lastDropFlash || 0) <= 0.3 && this.phase === 'playing') this.onMusicDrop();
        this._lastDropFlash = dropFlash;

        const m = this.m;
        const a = this.phase === 'playing' || this.phase === 'complete' ? this.alpha : 1;
        this.renderPos.set(
            this.prevPos.x + (m.P[0] - this.prevPos.x) * a,
            this.prevPos.y + (m.P[1] - this.prevPos.y) * a,
            this.prevPos.z + (m.P[2] - this.prevPos.z) * a
        );

        // Camera follows the track a little behind the marble
        const f = this.track.frame(Math.max(0, m.s - 1));
        this.camFrame = this.camFrame || Track.newFrame();
        for (const k of ['C', 'T', 'R', 'U', 'K']) {
            this.camFrame[k][0] = f[k][0]; this.camFrame[k][1] = f[k][1]; this.camFrame[k][2] = f[k][2];
        }
        this.camFrame.wallL = f.wallL;
        this.camFrame.wallR = f.wallR;
        this.camFrame.gap = f.gap;

        // Where the marble is over the pipe surface (for its shadow and glow)
        const tc = this.marbleTrackCoords();
        this._surf = this._surf || [0, 0, 0];
        this._surfN = this._surfN || [0, 0, 0];
        this.track.point(tc.s, tc.phi, 0, this._surf);
        let overGap = false;
        {
            const fr = this.track.frame(tc.s);
            overGap = fr.gap;
            const sp = Math.sin(tc.phi), cp = Math.cos(tc.phi);
            for (let c = 0; c < 3; c++) this._surfN[c] = -(fr.R[c] * sp - fr.U[c] * cp);
        }

        this.scene3d.update({
            dt,
            pos: this.renderPos,
            vel: m.mode === 'air' ? m.V : (this._vel || m.V),
            cameraMode: this.cameraMode,
            povHorizon: this.povHorizon,
            // No surface under the marble over a gap: no shadow, glow or mirror there
            surface: overGap ? null : this._surf,
            surfaceNormal: this._surfN,
            height: tc.h,
            quat: this.marbleQuat,
            camFrame: this.camFrame,
            speed: this.phase === 'playing' ? this.speed() : 0,
            inAir: m.mode === 'air',
            snap: this.snapCamera,
            marbleVisible: this.phase !== 'dead' && this.phase !== 'attract',
            attract: this.phase === 'attract',
            racers: this.racerStates(),
            ghost: this.ghostPosition(),
            rival: this.rivalState(),
            pulse: beatSource ? beatSource.getPulse() : 0,
            dropFlash,
            // In the drops the camera breathes with the kick
            pump: beatSource && beatSource.inDropHit && beatSource.inDropHit() ? beatSource.getPulse() : 0,
            // The light show runs through the drops
            drop: beatSource && beatSource.inDropHit && beatSource.inDropHit() ? 1 : 0,
            clock: this.hazardClock || 0,
            beatLength: this.beatLength,
            combo: this.phase === 'playing' ? this.combo : null,
            trackS: m.s,
            hint,
            subHint
        });
        this.snapCamera = false;
    }

    updateHUD() {
        if (!this.track) return;
        document.getElementById('hud-level-name').textContent = this.levelData.daily || this.run ? this.levelData.name : `${this.levelData.id}  ${this.levelData.name}`;
        this.updateAbilityButton();
        this.updateRivalHUD();
        this.updateRaceHUD();
        if (this.run) {
            // Music Runs: the song's position instead of a stopwatch
            const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
            const timeEl = document.getElementById('hud-time');
            if (timeEl && this.stepCount % 6 === 0) timeEl.textContent = `${fmt(Math.max(0, this.elapsedTime))} / ${fmt(this.run.map.duration)}`;
            this.updateSpeedAndProgress();
            return;
        }
        const live = this.getStarsEarned(this.elapsedTime);
        if (live !== this.hudStars) {
            this.hudStars = live;
            document.querySelectorAll('.star-threshold').forEach((el, i) => {
                el.classList.toggle('earned', i < live);
                el.classList.toggle('lost', i >= live);
            });
            if (live < 3 && this.phase === 'playing') this.haptics.light();
        }
        const timeEl = document.getElementById('hud-time');
        if (timeEl) timeEl.textContent = this.elapsedTime.toFixed(2);
        this.updateSpeedAndProgress();
    }

    updateSpeedAndProgress() {
        if (!this.speedEl) {
            this.speedEl = document.createElement('div');
            this.speedEl.id = 'hud-speed';
            this.speedEl.innerHTML = '<b>0</b><span>KM/H</span>';
            document.getElementById('game-screen').appendChild(this.speedEl);
        }
        if (this.jumpBtn) this.jumpBtn.classList.toggle('visible', this.phase === 'playing' || this.phase === 'ready');
        if (this.abilityBtn) this.abilityBtn.classList.toggle('visible', !!this.ability.def && (this.phase === 'playing' || this.phase === 'ready'));
        if (this.stepCount % 12 === 0) {
            const v = this.speed();
            this.speedEl.firstChild.textContent = Math.round(v * 3.6);
            this.speedEl.style.setProperty('--spd', Math.min(1, v / 70).toFixed(3));
            this.speedEl.style.opacity = this.phase === 'playing' ? '1' : '0';
        }
        const progress = Math.max(0, Math.min(1, this.m.s / this.track.finishS));
        document.getElementById('level-progress-fill').style.width = `${progress * 100}%`;
    }

    getStarsEarned(t) {
        const st = this.starThresholds;
        if (t <= st.three) return 3;
        if (t <= st.two) return 2;
        return 1;
    }

    // ------------------------------------------------------------------
    // Ghost: your best run, replayed alongside the current one
    // ------------------------------------------------------------------

    loadGhost(levelId) {
        try {
            const raw = localStorage.getItem(`vmr3d_ghost_${levelId}`);
            if (!raw) return null;
            const g = JSON.parse(raw);
            return g && Array.isArray(g.d) && g.d.length >= 6 ? g : null;
        } catch (e) {
            return null;
        }
    }

    saveGhost() {
        const time = this.elapsedTime;
        if (this.ghost && this.ghost.t <= time) return;
        const m = this.m;
        const data = { t: +time.toFixed(3), d: [...this.ghostRec, +m.P[0].toFixed(2), +m.P[1].toFixed(2), +m.P[2].toFixed(2)] };
        try {
            localStorage.setItem(`vmr3d_ghost_${this.currentLevelId}`, JSON.stringify(data));
        } catch (e) {
            // Storage full: the ghost is a nice-to-have
        }
    }

    ghostPosition() {
        const g = this.ghost;
        if (!g || this.state.getSetting('ghost') === false) return null;
        if (this.phase !== 'playing' && this.phase !== 'complete') return null;
        const frames = g.d.length / 3;
        const f = Math.min(frames - 1, this.elapsedTime * this.GHOST_RATE - 1);
        if (f < 0) return null;
        const i = Math.floor(f);
        const j = Math.min(frames - 1, i + 1);
        const k = f - i;
        this._ghostPos = this._ghostPos || new THREE.Vector3();
        return this._ghostPos.set(
            g.d[i * 3] + (g.d[j * 3] - g.d[i * 3]) * k,
            g.d[i * 3 + 1] + (g.d[j * 3 + 1] - g.d[i * 3 + 1]) * k,
            g.d[i * 3 + 2] + (g.d[j * 3 + 2] - g.d[i * 3 + 2]) * k
        );
    }

    // ------------------------------------------------------------------
    // Friend challenges: race the ghost of a run sent as a link or code
    // ------------------------------------------------------------------

    /** Race this decoded challenge (Challenge.decode) on its level next */
    setRival(run) {
        this.rival = run || null;
    }

    /** Code for the run just finished, to send as a challenge */
    challengeCode() {
        if (!this.lastRun || this.lastRun.samples.length < 2) return null;
        return Challenge.encode({ ...this.lastRun, name: this.state.getPlayerName() });
    }

    /** The rival's position now: their samples, smoothed with Catmull-Rom in track coordinates */
    rivalState() {
        const rv = this.rival;
        if (!rv || !this.track || (this.phase !== 'playing' && this.phase !== 'complete')) return null;
        const n = rv.count;
        const f = Math.max(0, Math.min(n - 1, this.elapsedTime * rv.rate));
        const i = Math.floor(f), u = f - i;
        const cr = (a) => {
            const p0 = a[Math.max(0, i - 1)], p1 = a[i], p2 = a[Math.min(n - 1, i + 1)], p3 = a[Math.min(n - 1, i + 2)];
            return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
        };
        this._rivalP = this._rivalP || [0, 0, 0];
        this.track.point(cr(rv.s), cr(rv.phi), Math.max(0, cr(rv.h)) + this.r, this._rivalP);
        this._rivalV = this._rivalV || new THREE.Vector3();
        return { pos: this._rivalV.set(this._rivalP[0], this._rivalP[1], this._rivalP[2]), name: rv.name || 'Friend' };
    }

    /** Seconds behind (+) or ahead (-) of the rival at this point of the chute */
    rivalDelta() {
        const rv = this.rival;
        if (!rv) return null;
        const s = this.m.s;
        const a = rv.s;
        if (s <= a[0]) return this.elapsedTime;
        if (s >= a[rv.count - 1]) return this.elapsedTime - rv.time;
        let lo = 0, hi = rv.count - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (a[mid] < s) lo = mid; else hi = mid;
        }
        const tR = (lo + (s - a[lo]) / Math.max(1e-6, a[hi] - a[lo])) / rv.rate;
        return this.elapsedTime - tR;
    }

    // ------------------------------------------------------------------
    // The house racers: three rivals on every campaign level
    // ------------------------------------------------------------------

    /**
     * The playtest pilot's run on this chute (js/game/Rivals.js) races as the
     * gold rival, and slowed copies of it as silver and bronze. Finishing
     * ahead of one wins its medal. Not in Music Runs, dailies, friend races
     * or attract mode, and off by the Rival Racers setting.
     */
    setupRacers(levelData) {
        this.racers = [];
        this.racePos = 0;
        this._photo = false;
        const data = (window.RIVAL_RUNS || {})[levelData.id];
        if (!data || this.run || this.attract || this.rival || levelData.daily || this.state.getSetting('rivals') === false) return;
        const defs = [['NOVA', 'gold', 1.0, '#ffd166'], ['VOLT', 'silver', 1.09, '#9fd8ff'], ['RUST', 'bronze', 1.2, '#ff8a65']];
        this.racers = defs.map(([name, medal, k, color]) => ({ name, medal, k, color, time: +(data.t * k).toFixed(2), run: data, pos: new THREE.Vector3(), gap: 0, wasAhead: true }));
    }

    /** Where a racer is now: its samples at its own pace, in track coordinates */
    racerPos(r) {
        const d = r.run, n = d.s.length;
        const f = Math.max(0, Math.min(n - 1, this.elapsedTime / r.k * d.rate));
        const i = Math.floor(f), u = f - i, j = Math.min(n - 1, i + 1);
        const sAt = d.s[i] + (d.s[j] - d.s[i]) * u;
        const phi = d.phi[i] + (d.phi[j] - d.phi[i]) * u;
        const h = d.h[i] + (d.h[j] - d.h[i]) * u;
        this._rp = this._rp || [0, 0, 0];
        this.track.point(Math.min(this.track.length - 1, sAt), phi, Math.max(0, h) + this.r, this._rp);
        r.s = sAt;
        return r.pos.set(this._rp[0], this._rp[1], this._rp[2]);
    }

    racerStates() {
        if (!this.racers || !this.racers.length || (this.phase !== 'playing' && this.phase !== 'complete')) return null;
        return this.racers.map(r => { this.racerPos(r); return { pos: r.pos, name: r.name, color: r.color }; });
    }

    /** Seconds the player is behind (+) or ahead (-) of a racer at this point of the chute */
    racerDelta(r) {
        const d = r.run, a = d.s, n = a.length, s = this.m.s;
        if (s <= a[0]) return this.elapsedTime;
        if (s >= a[n - 1]) return this.elapsedTime - r.time;
        let lo = 0, hi = n - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (a[mid] < s) lo = mid; else hi = mid;
        }
        const tR = (lo + (s - a[lo]) / Math.max(1e-6, a[hi] - a[lo])) / d.rate * r.k;
        return this.elapsedTime - tR;
    }

    /** Race position and the gap to the nearest racer; overtakes score, and a close finish goes to slow motion */
    updateRaceHUD() {
        if (!this.posEl) {
            this.posEl = document.createElement('div');
            this.posEl.id = 'hud-pos';
            document.getElementById('game-hud')?.appendChild(this.posEl);
        }
        const show = !!this.racers && this.racers.length > 0 && this.phase === 'playing';
        this.posEl.classList.toggle('visible', show);
        if (!show) return;
        let ahead = 0, nearest = null, nearGap = Infinity;
        for (const r of this.racers) {
            r.gap = this.racerDelta(r);
            if (r.gap > 0) ahead++;
            if (Math.abs(r.gap) < Math.abs(nearGap)) { nearGap = r.gap; nearest = r; }
        }
        const pos = ahead + 1;
        if (this.racePos && pos !== this.racePos && this.elapsedTime > 1.5) {
            if (pos < this.racePos) {
                const passed = this.racers.find(r => r.wasAhead && r.gap <= 0);
                this.addCombo();
                this.addScore(120, passed ? `PASSED ${passed.name}` : 'OVERTAKE');
                this.haptics.light?.();
            } else {
                const by = this.racers.find(r => !r.wasAhead && r.gap > 0);
                if (by) this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.3, 0)), `${by.name} AHEAD`, '#ff8a65');
            }
        }
        for (const r of this.racers) r.wasAhead = r.gap > 0;
        this.racePos = pos;
        if (this.stepCount % 6 === 0) {
            this.posEl.innerHTML = `<b>P${pos}</b><span>/${this.racers.length + 1}</span><small>${nearest ? `${nearest.name} ${nearGap > 0 ? '+' : '−'}${Math.abs(nearGap).toFixed(2)}` : ''}</small>`;
            this.posEl.classList.toggle('lead', pos === 1);
        }
        // Photo finish: neck and neck into the last stretch
        if (!this._photo && this.m.s > this.track.finishS - 45 && Math.abs(nearGap) < 0.35) {
            this._photo = true;
            this.timeScale = 0.35;
            this.slowMoTimer = 0.8;
            this.scene3d.addPopup(this.renderPos.clone().add(new THREE.Vector3(0, 1.4, 0)), 'PHOTO FINISH', '#ffffff');
            this.haptics.medium();
        }
    }

    updateRivalHUD() {
        if (!this.rivalEl) {
            this.rivalEl = document.createElement('div');
            this.rivalEl.id = 'hud-rival';
            document.getElementById('game-hud')?.appendChild(this.rivalEl);
        }
        const show = !!this.rival && this.phase === 'playing';
        this.rivalEl.classList.toggle('visible', show);
        if (!show || this.stepCount % 6 !== 0) return;
        const d = this.rivalDelta();
        if (d === null) return;
        const name = (this.rival.name || 'Friend').slice(0, 12);
        this.rivalEl.textContent = `${name} ${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}`;
        this.rivalEl.classList.toggle('ahead', d <= 0);
    }

    // ------------------------------------------------------------------
    // Music Run finish: graded on coins, beats and clean riding
    // ------------------------------------------------------------------

    /** Through the finish: the camera orbits the marble under fireworks in the world's colours */
    celebrateFinish() {
        this.scene3d.endCine();
        this.scene3d.startCine('finish', null, 0);
        this.scene3d.celebrate(this.renderPos);
        this.haptics.heavy?.();
    }

    completeMusicRun() {
        const r = this.run, tr = this.track;
        this.phase = 'complete';
        this.celebrateFinish();
        const coinsTotal = tr.coins.length;
        const coinPct = coinsTotal ? this.coinsCollected / coinsTotal : 1;
        const beatPct = r.jumps ? r.onBeat / r.jumps : 0;
        const clean = Math.max(0, 1 - r.restarts / 5);
        const pct = 0.45 * coinPct + 0.25 * beatPct + 0.3 * clean;
        const grade = pct >= 0.9 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.55 ? 'B' : pct >= 0.35 ? 'C' : 'D';
        const total = this.score + this.coinsCollected * 25 + Math.round(pct * 2000);
        const prev = this.state.getMusicBest(r.key);
        const isBest = !prev || total > prev.score;
        if (isBest) this.state.setMusicBest(r.key, { score: total, grade, title: this.levelData.name });
        const lucky = this.upgrade('lucky');
        const coinReward = Math.round((20 + Math.round(this.coinsCollected * 1.5) + ({ S: 60, A: 40, B: 20 }[grade] || 0)) * lucky);
        this.state.addCoins(coinReward);
        // Gems: the first S on each song
        const gemReward = grade === 'S' && this.state.claimOnce(`musicS:${r.key}`) ? 2 : 0;
        if (gemReward) this.state.addGems(gemReward);
        this.state.addStat('totalPlayTime', this.elapsedTime);
        this.lastRunEntry = this.state.addRun({
            t: Date.now(), kind: 'music', level: r.key, name: this.levelData.name, world: this.track.worldId, score: total, grade,
            time: +this.elapsedTime.toFixed(2), marble: this.state.getSelectedMarble(),
            player: this.state.hasPlayerName() ? this.state.getPlayerName() : '', newBest: isBest
        });

        this.timeScale = 0.3;
        this.slowMoTimer = 0.9;
        this.scene3d.emit(this.renderPos, 60, '#ffffff', 14, 1.2);
        this.scene3d.emit(this.renderPos, 40, this.scene3d.palette.accent, 10, 1.2);
        this.scene3d.addShake(0.3);
        this.audio.play('complete');
        this.haptics.notificationSuccess();
        if (r.source !== 'file') {
            this.music?.playGoal();
            this.music?.setSection('outro');
        }
        this.scene3d.showBanner(`GRADE ${grade}`, grade === 'S' ? '#ffd166' : '#ffffff');

        const data = {
            levelId: this.currentLevelId,
            coinReward,
            gemReward,
            lucky,
            canChallenge: false,
            music: {
                title: this.levelData.name,
                grade,
                pct,
                score: total,
                best: isBest ? total : prev.score,
                isBest,
                coins: this.coinsCollected,
                coinsTotal,
                onBeat: r.onBeat,
                jumps: r.jumps,
                restarts: r.restarts,
                bpm: r.map.bpm
            }
        };
        setTimeout(() => {
            if (this.onLevelComplete && this.phase === 'complete') this.onLevelComplete(data);
        }, 2600);
    }

    // ------------------------------------------------------------------
    // Pause
    // ------------------------------------------------------------------

    pause() {
        this.isPaused = true;
        if (this.run && this.run.source === 'file' && this.phase === 'playing') this.songPlayer?.pause();
        this.music?.setMuffled(true);
        this.audio.play('click');
        this.haptics.light();
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        if (this.run && this.run.source === 'file') this.songPlayer?.resume();
        this.music?.setMuffled(false);
        this.audio.play('click');
        this.haptics.light();
    }

    // ------------------------------------------------------------------
    // Finish
    // ------------------------------------------------------------------

    completeLevel() {
        if (this.phase !== 'playing') return;
        if (this.run) return this.completeMusicRun();
        this.phase = 'complete';
        this.celebrateFinish();
        const time = this.elapsedTime;
        const st = this.starThresholds;
        const stars = this.getStarsEarned(time);

        const timeBonus = Math.max(0, Math.floor((st.two - time) * 100));
        const coinBonus = this.coinsCollected * 25;
        const perfectBonus = this.attempts === 1 ? 250 : 0;
        const total = 100 + timeBonus + coinBonus + stars * 100 + perfectBonus + this.score;
        const scoreBreakdown = { total, timeBonus, coinBonus, starsEarned: stars, perfectBonus, trickScore: this.score };

        // Daily runs go on the day's leaderboard instead of the campaign record
        const daily = this.levelData.daily ? this.leaderboards.submit(this.levelData.dateKey, time, this.state.getSelectedMarble()) : null;
        const prevRecord = this.state.getLevelData(this.currentLevelId);
        const prevStars = daily ? 0 : prevRecord.stars;
        const newStars = daily ? 0 : this.state.setLevelData(this.currentLevelId, { time, score: total, stars });
        const lucky = this.upgrade('lucky');
        const coinReward = Math.round((10 + stars * 10 + this.coinsCollected * 2) * lucky);
        this.state.addCoins(coinReward);
        // Gems: a level's first three stars, the day's first daily run, the first win over each friend's run
        let gemReward = 0;
        if (!daily && !this.rival && stars === 3 && prevStars < 3 && this.state.claimOnce(`3star:${this.currentLevelId}`)) gemReward++;
        if (daily && this.state.claimOnce(`daily:${this.levelData.dateKey}`)) gemReward++;
        if (this.rival && time < this.rival.time && this.state.claimOnce(`beat:${this.rival.code}`)) gemReward++;
        if (gemReward) this.state.addGems(gemReward);
        this.state.addStat('totalPlayTime', time);
        const unlocked = this.progression.checkAchievements('level_complete', { levelId: this.currentLevelId, time, stars });
        if (newStars > 0) this.progression.checkAchievements('star_earn');
        this.lastRunEntry = this.state.addRun({
            t: Date.now(), kind: daily ? 'daily' : this.rival ? 'race' : 'level', level: this.currentLevelId, name: this.levelData.name,
            world: this.levelData.worldId || this.track.worldId, scene: this.track.worldId, score: total, time: +time.toFixed(2), stars, marble: this.state.getSelectedMarble(),
            player: this.state.hasPlayerName() ? this.state.getPlayerName() : '', newBest: !daily && total > (prevRecord.bestScore || 0)
        });

        const prevBest = this.ghost ? this.ghost.t : null;
        const delta = prevBest !== null ? time - prevBest : null;
        this.saveGhost();

        // This run, ready to send as a challenge
        const tcEnd = this.marbleTrackCoords();
        this.runRec.push([tcEnd.s, tcEnd.phi, tcEnd.h]);
        this.lastRun = {
            level: this.currentLevelId,
            marble: this.state.getSelectedMarble(),
            name: this.state.getPlayerName(),
            time,
            samples: this.runRec.slice()
        };
        let rival = null;
        if (this.rival) {
            const rv = this.rival;
            rival = { name: rv.name || 'Your friend', theirTime: rv.time, yourTime: time, won: time < rv.time, code: rv.code };
            this.state.recordChallengeResult(rv.code, time);
        }
        // The race: the best racer beaten gives its medal (gold, silver, bronze)
        let medal = null, race = null;
        if (this.racers && this.racers.length) {
            for (const r of this.racers) if (time < r.time) { medal = r.medal; break; }
            const rank = { gold: 3, silver: 2, bronze: 1 };
            const prevMedal = prevRecord.medal || null;
            const improved = medal && rank[medal] > (rank[prevMedal] || 0);
            if (improved && !daily) this.state.setLevelMedal(this.currentLevelId, medal);
            race = { pos: this.racers.filter(r => r.time < time).length + 1, of: this.racers.length + 1, medal, improved, racers: this.racers.map(r => ({ name: r.name, medal: r.medal, time: r.time, beaten: time < r.time })) };
        }

        this.timeScale = 0.3;
        this.slowMoTimer = 0.9;
        this.scene3d.emit(this.renderPos, 60, '#ffffff', 14, 1.2);
        this.scene3d.emit(this.renderPos, 40, this.scene3d.palette.accent, 10, 1.2);
        this.scene3d.addShake(0.3);
        this.audio.play('complete');
        this.haptics.notificationSuccess();
        this.music?.playGoal();
        this.music?.setSection('outro');
        if (rival) {
            const gap = Math.abs(time - rival.theirTime).toFixed(2);
            this.scene3d.showBanner(rival.won ? `YOU BEAT ${rival.name.toUpperCase()}  -${gap}s` : `${rival.name.toUpperCase()} WINS  +${gap}s`, rival.won ? '#22f0c8' : '#ff8a65');
        } else if (race && race.medal && race.improved) {
            this.scene3d.showBanner(`${race.medal.toUpperCase()} MEDAL  P${race.pos}  ${time.toFixed(2)}s`, race.medal === 'gold' ? '#ffd166' : race.medal === 'silver' ? '#dbe9ff' : '#ff9a6a');
        } else if (race) {
            this.scene3d.showBanner(`P${race.pos} OF ${race.of}  ${time.toFixed(2)}s`, race.pos === 1 ? '#ffd166' : '#ffffff');
        } else if (daily) {
            this.scene3d.showBanner(daily.rank === 1 ? `TODAY'S BEST  ${time.toFixed(2)}s` : `RANK #${daily.rank}  ${time.toFixed(2)}s`, daily.rank === 1 ? '#ffd166' : '#ffffff');
        } else if (delta !== null) {
            const better = delta <= -0.005;
            this.scene3d.showBanner(better ? `NEW BEST  -${Math.abs(delta).toFixed(2)}s` : `+${Math.max(0, delta).toFixed(2)}s`, better ? '#22f0c8' : '#ff8a65');
        } else {
            this.scene3d.showBanner(`${time.toFixed(2)}s`, '#ffffff');
        }

        const data = {
            levelId: this.currentLevelId,
            score: scoreBreakdown,
            stars,
            newStars,
            time,
            coins: this.coinsCollected,
            coinReward,
            gemReward,
            lucky,
            bestCombo: this.combo.best,
            attempts: this.attempts,
            bestDelta: delta,
            achievements: unlocked,
            daily,
            rival,
            race,
            canChallenge: true
        };
        setTimeout(() => {
            if (this.onLevelComplete && this.phase === 'complete') this.onLevelComplete(data);
        }, 2600);
    }

    destroy() {
        this.loopRunning = false;
        this.audio.stopMusic();
    }
}

/**
 * Any level by id: campaign ("1-6"), a daily challenge ("daily-2026-10-28")
 * or a Music Run on one of the game's own tracks ("music-3"). Challenge links
 * carry only the id, so every one of these must rebuild the same chute.
 */
Game.levelFromId = (id) => {
    if (!id) return null;
    const lvl = LEVELS.find(l => l.id === id);
    if (lvl) return lvl;
    const d = String(id).match(/^daily-(\d{4})-(\d{2})-(\d{2})$/);
    if (d) return dailyLevel(new Date(+d[1], +d[2] - 1, +d[3]));
    const mu = String(id).match(/^music-(\d+)$/);
    if (mu && MusicEngine.THEMES[+mu[1]]) return Game.musicLevel(+mu[1]);
    return null;
};

/** The game's own tracks that can be run: the six world soundtracks, then the EDM tracks */
Game.musicTracks = () => Object.keys(MusicEngine.THEMES).filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => a - b);

/** A Music Run on one of the game's own tracks (an EDM track runs in the world its theme names) */
Game.musicLevel = (themeId) => {
    const map = BeatMap.fromTheme(themeId);
    const theme = MusicEngine.THEMES[themeId];
    const worldId = BeatMap.worldFor(map);
    const world = WORLDS.find(w => w.id === worldId);
    return {
        id: `music-${themeId}`,
        runKey: `music-${themeId}`,
        worldId,
        name: map.title,
        subtitle: `${theme && theme.genre ? theme.genre + ' · ' : ''}${map.bpm} BPM · ${Math.round(map.duration)}s`,
        trackDifficulty: 18 + Math.min(6, themeId) * 4 + (themeId > 6 ? 6 : 0),
        song: map,
        icon: theme && theme.genre ? '🎧' : world ? world.icon : '',
        genre: theme ? theme.genre : null
    };
};

/** A Music Run on a song file the player chose (map from BeatMap.analyze) */
Game.songLevel = (map, audioBuffer) => {
    const key = `song-${BeatMap.songId(map)}`;
    return {
        id: key,
        runKey: key,
        worldId: BeatMap.worldFor(map),
        name: map.title,
        subtitle: `${Math.round(map.bpm)} BPM · ${Math.round(map.duration)}s`,
        trackDifficulty: 26,
        song: map,
        audioBuffer
    };
};

/** Surface materials (indexed like Track.MATERIALS): multipliers on the marble's handling */
Game.MATERIALS = [
    { roll: 1, drag: 1, steer: 1, lat: 1, jump: 1, bounce: 1 },            // neon glass
    { roll: 0.45, drag: 0.9, steer: 0.55, lat: 0.25, jump: 1, bounce: 1 },  // ice: slides, hard to steer
    { roll: 1.5, drag: 1.15, steer: 1.35, lat: 1.7, jump: 1.3, bounce: 1.8 }, // rubber: grippy, bouncy, higher jumps
    { roll: 1.15, drag: 1, steer: 1, lat: 1.1, jump: 1, bounce: 0.9 },    // wood: a little slow
    { roll: 0.65, drag: 0.8, steer: 0.9, lat: 0.8, jump: 1, bounce: 1.1 },  // metal: fast
    { roll: 2.8, drag: 1.4, steer: 0.85, lat: 1.4, jump: 0.85, bounce: 0.5 } // sand: drags you down
];
Game.ZONE_NAMES = {
    ice: 'ICE', rubber: 'RUBBER', wood: 'WOOD', metal: 'METAL', sand: 'SAND',
    groove: 'WHISPER GROOVES', sidewind: 'SIDEWIND', well: 'GRAVITY WELL', bumps: 'RIPPLE BUMPS',
    rail: 'MAGNETIC RAIL', zerog: 'ZERO-G', spiral: 'SPIRAL FUNNEL', cliff: 'CLIFF DROP',
    loop: 'LOOP-THE-LOOP', plunge: 'PLUNGE SHAFT', kicker: 'LAUNCH RAMP'
};
Game.ZONE_COLORS = {
    ice: '#9fe8ff', rubber: '#9aa0b4', wood: '#d9a066', metal: '#dfe3ee', sand: '#e8c57a',
    groove: '#b8f5ff', sidewind: '#8fd3ff', well: '#c77dff', bumps: '#ffd166', rail: '#ffe066', zerog: '#8fb8ff', spiral: '#d58cff', cliff: '#ffd166',
    loop: '#5ee7ff', plunge: '#ff8a65', kicker: '#ffd166'
};

window.Game = Game;
