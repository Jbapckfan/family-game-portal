/**
 * ReplaySystem - Record and playback marble runs
 * Includes ghost marble racing against best times
 */

class ReplaySystem {
    constructor(game) {
        this.game = game;

        // Recording
        this.isRecording = false;
        this.currentRecording = null;
        this.recordingStartTime = 0;
        this.frameInterval = 50; // ms between frames
        this.lastFrameTime = 0;

        // Playback
        this.isPlaying = false;
        this.playbackData = null;
        this.playbackIndex = 0;
        this.playbackStartTime = 0;

        // Ghost
        this.ghostEnabled = true;
        this.ghostData = null;
        this.ghostMarble = null;
        this.ghostOpacity = 0.5;

        // Storage
        this.bestRuns = this.loadBestRuns();
    }

    // Recording methods
    startRecording(levelId) {
        this.isRecording = true;
        this.currentRecording = {
            levelId: levelId,
            timestamp: Date.now(),
            frames: [],
            events: [],
            duration: 0
        };
        this.recordingStartTime = performance.now();
        this.lastFrameTime = 0;
    }

    recordFrame(marbleState) {
        if (!this.isRecording) return;

        const elapsed = performance.now() - this.recordingStartTime;

        // Only record at intervals
        if (elapsed - this.lastFrameTime < this.frameInterval) return;
        this.lastFrameTime = elapsed;

        this.currentRecording.frames.push({
            time: elapsed,
            x: Math.round(marbleState.x * 10) / 10,
            y: Math.round(marbleState.y * 10) / 10,
            vx: Math.round(marbleState.vx * 10) / 10,
            vy: Math.round(marbleState.vy * 10) / 10,
            rotation: Math.round(marbleState.rotation * 100) / 100
        });
    }

    recordEvent(eventType, data = {}) {
        if (!this.isRecording) return;

        const elapsed = performance.now() - this.recordingStartTime;

        this.currentRecording.events.push({
            time: elapsed,
            type: eventType,
            data: data
        });
    }

    stopRecording() {
        if (!this.isRecording) return null;

        this.isRecording = false;
        this.currentRecording.duration = performance.now() - this.recordingStartTime;

        const recording = this.currentRecording;
        this.currentRecording = null;

        return recording;
    }

    // Save/load best runs
    saveAsbestRun(recording, stars) {
        const key = recording.levelId;

        if (!this.bestRuns[key] || recording.duration < this.bestRuns[key].duration) {
            this.bestRuns[key] = {
                ...recording,
                stars: stars
            };
            this.saveBestRuns();
            return true;
        }
        return false;
    }

    getBestRun(levelId) {
        return this.bestRuns[levelId] || null;
    }

    loadBestRuns() {
        try {
            return JSON.parse(localStorage.getItem('velocity_best_runs') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveBestRuns() {
        // Compress before saving (remove excessive precision)
        const compressed = {};
        for (const key in this.bestRuns) {
            const run = this.bestRuns[key];
            compressed[key] = {
                levelId: run.levelId,
                duration: run.duration,
                stars: run.stars,
                frames: run.frames.filter((_, i) => i % 2 === 0) // Keep every other frame
            };
        }
        localStorage.setItem('velocity_best_runs', JSON.stringify(compressed));
    }

    // Playback methods
    startPlayback(recording) {
        this.isPlaying = true;
        this.playbackData = recording;
        this.playbackIndex = 0;
        this.playbackStartTime = performance.now();
    }

    getPlaybackFrame() {
        if (!this.isPlaying || !this.playbackData) return null;

        const elapsed = performance.now() - this.playbackStartTime;

        // Find the appropriate frame
        while (
            this.playbackIndex < this.playbackData.frames.length - 1 &&
            this.playbackData.frames[this.playbackIndex + 1].time <= elapsed
        ) {
            this.playbackIndex++;
        }

        if (this.playbackIndex >= this.playbackData.frames.length - 1) {
            this.stopPlayback();
            return null;
        }

        // Interpolate between frames
        const current = this.playbackData.frames[this.playbackIndex];
        const next = this.playbackData.frames[this.playbackIndex + 1];
        const t = (elapsed - current.time) / (next.time - current.time);

        return {
            x: current.x + (next.x - current.x) * t,
            y: current.y + (next.y - current.y) * t,
            vx: current.vx + (next.vx - current.vx) * t,
            vy: current.vy + (next.vy - current.vy) * t,
            rotation: current.rotation + (next.rotation - current.rotation) * t
        };
    }

    stopPlayback() {
        this.isPlaying = false;
        this.playbackData = null;
        this.playbackIndex = 0;
    }

    // Ghost marble methods
    initGhost(levelId) {
        const bestRun = this.getBestRun(levelId);
        if (!bestRun || !this.ghostEnabled) {
            this.ghostData = null;
            return false;
        }

        this.ghostData = bestRun;
        this.ghostMarble = {
            x: bestRun.frames[0]?.x || 0,
            y: bestRun.frames[0]?.y || 0,
            rotation: 0,
            frameIndex: 0,
            startTime: 0,
            active: false
        };

        return true;
    }

    startGhost() {
        if (!this.ghostData || !this.ghostMarble) return;

        this.ghostMarble.active = true;
        this.ghostMarble.startTime = performance.now();
        this.ghostMarble.frameIndex = 0;
    }

    updateGhost() {
        if (!this.ghostData || !this.ghostMarble || !this.ghostMarble.active) return;

        const elapsed = performance.now() - this.ghostMarble.startTime;
        const frames = this.ghostData.frames;

        // Find current frame
        while (
            this.ghostMarble.frameIndex < frames.length - 1 &&
            frames[this.ghostMarble.frameIndex + 1].time <= elapsed
        ) {
            this.ghostMarble.frameIndex++;
        }

        if (this.ghostMarble.frameIndex >= frames.length - 1) {
            this.ghostMarble.active = false;
            return;
        }

        // Interpolate position
        const current = frames[this.ghostMarble.frameIndex];
        const next = frames[this.ghostMarble.frameIndex + 1];
        const t = (elapsed - current.time) / (next.time - current.time);

        this.ghostMarble.x = current.x + (next.x - current.x) * t;
        this.ghostMarble.y = current.y + (next.y - current.y) * t;
        this.ghostMarble.rotation = current.rotation + (next.rotation - current.rotation) * t;
    }

    renderGhost(ctx, cameraX, cameraY) {
        if (!this.ghostMarble || !this.ghostMarble.active) return;

        ctx.save();
        ctx.globalAlpha = this.ghostOpacity;

        const x = this.ghostMarble.x - cameraX;
        const y = this.ghostMarble.y - cameraY;
        const radius = 20;

        // Ghost trail
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.fill();

        // Ghost marble
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.ghostMarble.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, radius);
        gradient.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Ghost icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👻', 0, 0);

        ctx.restore();
        ctx.restore();
    }

    stopGhost() {
        if (this.ghostMarble) {
            this.ghostMarble.active = false;
        }
    }

    // Toggle ghost
    toggleGhost() {
        this.ghostEnabled = !this.ghostEnabled;
        return this.ghostEnabled;
    }

    // Export/import replays
    exportReplay(recording) {
        const data = JSON.stringify(recording);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `velocity-replay-${recording.levelId}-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    async importReplay(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const recording = JSON.parse(e.target.result);
                    if (recording.levelId && recording.frames) {
                        resolve(recording);
                    } else {
                        reject(new Error('Invalid replay file'));
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Statistics
    getStats(levelId) {
        const best = this.bestRuns[levelId];
        if (!best) return null;

        return {
            bestTime: best.duration,
            bestStars: best.stars,
            totalFrames: best.frames.length,
            averageSpeed: this.calculateAverageSpeed(best.frames)
        };
    }

    calculateAverageSpeed(frames) {
        if (frames.length < 2) return 0;

        let totalSpeed = 0;
        for (let i = 1; i < frames.length; i++) {
            const dx = frames[i].x - frames[i - 1].x;
            const dy = frames[i].y - frames[i - 1].y;
            totalSpeed += Math.sqrt(dx * dx + dy * dy);
        }

        return totalSpeed / (frames.length - 1);
    }

    // Clear data
    clearBestRun(levelId) {
        delete this.bestRuns[levelId];
        this.saveBestRuns();
    }

    clearAllRuns() {
        this.bestRuns = {};
        localStorage.removeItem('velocity_best_runs');
    }
}

// Export
window.ReplaySystem = ReplaySystem;
