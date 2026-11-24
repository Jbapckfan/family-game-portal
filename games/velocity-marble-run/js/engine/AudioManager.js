/**
 * AudioManager - Web Audio API based sound system
 * Features: Procedural audio, spatial sound, dynamic mixing
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        this.sounds = new Map();
        this.music = null;
        this.currentTrack = null;

        this.sfxVolume = 1;
        this.musicVolume = 0.8;
        this.muted = false;

        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);

            // SFX channel
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            // Music channel
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            // iOS: play through the ringer switch like a real game
            if (navigator.audioSession) {
                try { navigator.audioSession.type = 'playback'; } catch (e) { /* unsupported */ }
            }

            // Create procedural sounds
            this.createProceduralSounds();

            // Adaptive soundtrack, and the player for Music Runs on the player's own songs
            this.music = new MusicEngine(this.context, this.musicGain);
            this.songPlayer = new SongPlayer(this.context, this.musicGain);

            this.initialized = true;
        } catch (e) {
            console.warn('AudioManager: Web Audio API not supported', e);
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    createProceduralSounds() {
        // All sounds are generated procedurally - no external files needed!
        this.sounds.set('bounce', this.createBounceSound());
        this.sounds.set('bounceSoft', this.createBounceSound(0.5));
        this.sounds.set('coin', this.createCoinSound());
        this.sounds.set('boost', this.createBoostSound());
        this.sounds.set('portal', this.createPortalSound());
        this.sounds.set('bumper', this.createBumperSound());
        this.sounds.set('complete', this.createCompleteSound());
        this.sounds.set('fail', this.createFailSound());
        this.sounds.set('star', this.createStarSound());
        this.sounds.set('click', this.createClickSound());
        this.sounds.set('drop', this.createDropSound());
        this.sounds.set('roll', this.createRollSound());
        this.sounds.set('jump', this.createJumpSound());
    }

    createJumpSound() {
        return () => {
            const now = this.context.currentTime;
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.2);
        };
    }

    createBounceSound(intensity = 1) {
        return (level = intensity) => {
            const intensity = Math.max(0.2, Math.min(1, level));
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 * intensity + Math.random() * 100, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);

            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            gain.gain.setValueAtTime(0.3 * intensity, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.15);
        };
    }

    createCoinSound() {
        return () => {
            const osc1 = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const gain = this.context.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1200, this.context.currentTime);
            osc1.frequency.setValueAtTime(1600, this.context.currentTime + 0.05);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1800, this.context.currentTime + 0.05);
            osc2.frequency.setValueAtTime(2400, this.context.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.sfxGain);

            osc1.start();
            osc1.stop(this.context.currentTime + 0.1);
            osc2.start(this.context.currentTime + 0.05);
            osc2.stop(this.context.currentTime + 0.3);
        };
    }

    createBoostSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.2);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, this.context.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2000, this.context.currentTime + 0.2);

            gain.gain.setValueAtTime(0.25, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.3);
        };
    }

    createPortalSound() {
        return () => {
            const osc1 = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const gain = this.context.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(200, this.context.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.3);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(400, this.context.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.3);

            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.sfxGain);

            osc1.start();
            osc1.stop(this.context.currentTime + 0.5);
            osc2.start();
            osc2.stop(this.context.currentTime + 0.5);
        };
    }

    createBumperSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(600, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.15);
        };
    }

    createCompleteSound() {
        return () => {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const duration = 0.15;

            notes.forEach((freq, i) => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = this.context.currentTime + i * duration;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 2);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(startTime);
                osc.stop(startTime + duration * 2);
            });
        };
    }

    createFailSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.4);

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.5);
        };
    }

    createStarSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.context.currentTime);
            osc.frequency.setValueAtTime(1200, this.context.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(1600, this.context.currentTime + 0.2);

            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.4);
        };
    }

    createClickSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.value = 1000;

            gain.gain.setValueAtTime(0.1, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.05);
        };
    }

    createDropSound() {
        return () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.2);

            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start();
            osc.stop(this.context.currentTime + 0.25);
        };
    }

    createRollSound() {
        // Returns a continuous noise for rolling
        return (velocity = 1) => {
            if (this.rollNode) {
                this.rollNode.gain.gain.value = Math.min(0.1, velocity * 0.001);
                return;
            }

            const bufferSize = 2 * this.context.sampleRate;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.context.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;

            const gain = this.context.createGain();
            gain.gain.value = 0;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start();

            this.rollNode = { source: noise, gain, filter };
        };
    }

    stopRollSound() {
        if (this.rollNode) {
            this.rollNode.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
            setTimeout(() => {
                if (this.rollNode) {
                    this.rollNode.source.stop();
                    this.rollNode = null;
                }
            }, 150);
        }
    }

    play(soundName, options = {}) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const sound = this.sounds.get(soundName);
        if (sound) {
            try {
                sound(options.intensity || 1);
            } catch (e) {
                console.warn(`Failed to play sound: ${soundName}`, e);
            }
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 1;
        }
    }

    // Procedural EDM soundtrack (see MusicEngine)
    playMusic(theme = 'menu', section = 'menu') {
        if (!this.initialized || !this.music) return;
        this.resume();
        this.music.setTheme(theme);
        this.music.start(section);
    }

    stopMusic() {
        if (this.music) {
            this.music.stop();
        }
    }
}

// Export
window.AudioManager = AudioManager;
