/**
 * GameState - Manages game state and save data
 */
class GameState {
    constructor() {
        this.storageKey = 'velocity_marble_run_save';
        this.data = this.getDefaultData();
        this.load();
    }

    getDefaultData() {
        return {
            version: 1,
            profile: {
                coins: 1000,
                gems: 0,
                totalStars: 0,
                selectedMarble: 'opal',
                selectedTrail: 'default'
            },
            levels: {},
            runs: [],                  // every finished run, newest first (see addRun)
            unlocks: {
                marbles: ['opal'],
                trails: ['default'],
                worlds: [1]
            },
            // Skins (owned as 'slot:id') and the ones worn; upgrade levels by id
            skins: {
                owned: ['finish:stone', 'trail:stock', 'aura:none'],
                equipped: { finish: 'stone', trail: 'stock', aura: 'none' }
            },
            upgrades: {},
            achievements: [],
            settings: {
                musicVolume: 0.8,
                sfxVolume: 1.0,
                haptics: true,
                particles: true,
                screenShake: true,
                showFps: false,
                quality: 'high',
                cameraMode: 'chase',   // 'chase' behind the marble, or 'pov' inside it
                povHorizon: true       // POV: keep the horizon level
            },
            stats: {
                totalPlayTime: 0,
                levelsCompleted: 0,
                totalBounces: 0,
                totalCoinsCollected: 0,
                perfectRuns: 0,
                gamesPlayed: 0
            },
            daily: {
                lastClaim: null,
                streak: 0,
                boards: {}             // daily challenge times, keyed by date
            }
        };
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = this.migrate(parsed);
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
        }
        // Worlds that need no stars (the Grand Prix) open on an old save too
        this.checkWorldUnlocks();
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }

    migrate(data) {
        // Future migration logic here
        const defaults = this.getDefaultData();

        // Merge with defaults to add any new fields
        const merged = this.mergeDefaults(data, defaults);
        // v2: the marble roster became the 24 gemstones; drop ids that no longer exist
        const valid = (id) => !window.Marble || Marble.STYLES[id];
        merged.unlocks.marbles = merged.unlocks.marbles.filter(valid);
        if (!merged.unlocks.marbles.includes('opal')) merged.unlocks.marbles.unshift('opal');
        if (!valid(merged.profile.selectedMarble) || !merged.unlocks.marbles.includes(merged.profile.selectedMarble)) {
            merged.profile.selectedMarble = 'opal';
        }
        // Skins: keep only ones that still exist, and only wear owned ones
        const skins = merged.skins;
        if (window.Shop) {
            skins.owned = skins.owned.filter(k => { const [slot, id] = k.split(':'); return Shop.SLOTS.includes(slot) && Shop.item(slot, id); });
            for (const slot of Shop.SLOTS) {
                const id = skins.equipped[slot];
                if (!Shop.item(slot, id) || !skins.owned.includes(`${slot}:${id}`)) skins.equipped[slot] = Shop.DEFAULTS[slot];
            }
        }
        return merged;
    }

    mergeDefaults(data, defaults) {
        return {
            ...defaults,
            ...data,
            profile: { ...defaults.profile, ...data.profile },
            settings: { ...defaults.settings, ...data.settings },
            stats: { ...defaults.stats, ...data.stats },
            daily: { ...defaults.daily, ...data.daily },
            skins: {
                owned: [...new Set([...defaults.skins.owned, ...(data.skins?.owned || [])])],
                equipped: { ...defaults.skins.equipped, ...(data.skins?.equipped || {}) }
            },
            upgrades: { ...(data.upgrades || {}) },
            runs: Array.isArray(data.runs) ? data.runs.slice(0, GameState.MAX_RUNS) : [],
            unlocks: {
                ...defaults.unlocks,
                ...data.unlocks,
                marbles: [...new Set([...defaults.unlocks.marbles, ...(data.unlocks?.marbles || [])])],
                trails: [...new Set([...defaults.unlocks.trails, ...(data.unlocks?.trails || [])])],
                worlds: [...new Set([...defaults.unlocks.worlds, ...(data.unlocks?.worlds || [])])]
            }
        };
    }

    reset() {
        this.data = this.getDefaultData();
        this.save();
    }

    // Profile methods
    getCoins() {
        return this.data.profile.coins;
    }

    addCoins(amount) {
        this.data.profile.coins += amount;
        this.data.stats.totalCoinsCollected += amount;
        this.save();
        return this.data.profile.coins;
    }

    spendCoins(amount) {
        if (this.data.profile.coins >= amount) {
            this.data.profile.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getGems() {
        return this.data.profile.gems;
    }

    addGems(amount) {
        this.data.profile.gems += amount;
        this.save();
        return this.data.profile.gems;
    }

    spendGems(amount) {
        if (this.data.profile.gems >= amount) {
            this.data.profile.gems -= amount;
            this.save();
            return true;
        }
        return false;
    }

    // Skins: one finish, trail and aura worn on whichever marble is equipped
    hasSkin(slot, id) {
        return this.data.skins.owned.includes(`${slot}:${id}`);
    }

    unlockSkin(slot, id) {
        if (!this.hasSkin(slot, id)) {
            this.data.skins.owned.push(`${slot}:${id}`);
            this.save();
        }
    }

    getSkins() {
        return { ...this.data.skins.equipped };
    }

    equipSkin(slot, id) {
        if (!this.hasSkin(slot, id)) return false;
        this.data.skins.equipped[slot] = id;
        this.save();
        return true;
    }

    /** True the first time a reward key is claimed (one-off gem rewards) */
    claimOnce(key) {
        const once = this.data.once || (this.data.once = {});
        if (once[key]) return false;
        once[key] = 1;
        this.save();
        return true;
    }

    // Upgrades: a level per upgrade id (0 = not bought)
    getUpgrade(id) {
        return this.data.upgrades[id] || 0;
    }

    setUpgrade(id, level) {
        this.data.upgrades[id] = level;
        this.save();
    }

    getTotalStars() {
        return this.data.profile.totalStars;
    }

    // Level methods
    getLevelData(levelId) {
        return this.data.levels[levelId] || {
            completed: false,
            stars: 0,
            bestTime: Infinity,
            bestScore: 0,
            attempts: 0
        };
    }

    setLevelData(levelId, data) {
        const existing = this.getLevelData(levelId);
        const newStars = Math.max(existing.stars, data.stars || 0);
        const starsEarned = newStars - existing.stars;

        this.data.levels[levelId] = {
            completed: true,
            stars: newStars,
            bestTime: Math.min(existing.bestTime, data.time || Infinity),
            bestScore: Math.max(existing.bestScore, data.score || 0),
            attempts: existing.attempts + 1,
            medal: existing.medal || null
        };

        // Update total stars
        if (starsEarned > 0) {
            this.data.profile.totalStars += starsEarned;
            this.checkWorldUnlocks();
        }

        this.data.stats.levelsCompleted++;
        this.save();

        return starsEarned;
    }

    /** The best race medal on a level (gold, silver or bronze) */
    setLevelMedal(levelId, medal) {
        this.data.levels[levelId] = { ...this.getLevelData(levelId), medal };
        this.save();
    }

    checkWorldUnlocks() {
        const stars = this.data.profile.totalStars;
        for (const w of (window.WORLDS || [])) {
            if (stars >= w.unlockStars && !this.data.unlocks.worlds.includes(w.id)) {
                this.data.unlocks.worlds.push(w.id);
            }
        }
    }

    isWorldUnlocked(worldId) {
        return this.data.unlocks.worlds.includes(worldId);
    }

    isLevelUnlocked(levelId) {
        const [worldId, levelNum] = levelId.split('-').map(Number);

        // An open world (the Grand Prix) has every level available at once
        const world = (window.WORLDS || []).find(w => w.id === worldId);
        if (world && world.open) return this.isWorldUnlocked(worldId);

        // First level of each world is unlocked if world is unlocked
        if (levelNum === 1) {
            return this.isWorldUnlocked(worldId);
        }

        // Subsequent levels require previous level completion
        const prevLevelId = `${worldId}-${levelNum - 1}`;
        const prevData = this.getLevelData(prevLevelId);
        return prevData.completed;
    }

    // Unlocks
    unlockMarble(marbleId) {
        if (!this.data.unlocks.marbles.includes(marbleId)) {
            this.data.unlocks.marbles.push(marbleId);
            this.save();
            return true;
        }
        return false;
    }

    hasMarble(marbleId) {
        return this.data.unlocks.marbles.includes(marbleId);
    }

    selectMarble(marbleId) {
        if (this.hasMarble(marbleId)) {
            this.data.profile.selectedMarble = marbleId;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedMarble() {
        return this.data.profile.selectedMarble;
    }

    // The name on challenges this player sends
    getPlayerName() {
        return (this.data.profile.name || '').trim() || 'A friend';
    }

    hasPlayerName() {
        return !!(this.data.profile.name || '').trim();
    }

    setPlayerName(name) {
        this.data.profile.name = String(name || '').trim().slice(0, 16);
        this.save();
    }

    // Challenges received: newest first, the run's code plus this player's best reply
    getChallenges() {
        return this.data.challenges || (this.data.challenges = []);
    }

    addChallenge(run) {
        const list = this.getChallenges();
        const existing = list.find(c => c.code === run.code);
        if (existing) return existing;
        const entry = { code: run.code, name: run.name, level: run.level, marble: run.marble, time: run.time, received: Date.now(), best: null };
        list.unshift(entry);
        list.length = Math.min(20, list.length);
        this.save();
        return entry;
    }

    recordChallengeResult(code, time) {
        const c = this.getChallenges().find(x => x.code === code);
        if (!c) return;
        if (c.best === null || time < c.best) c.best = +time.toFixed(2);
        this.save();
    }

    // Run history: level or song, score, time, stars or grade, marble, date
    addRun(run) {
        this.data.runs = this.data.runs || [];
        this.data.runs.unshift(run);
        if (this.data.runs.length > GameState.MAX_RUNS) this.data.runs.length = GameState.MAX_RUNS;
        this.save();
        return run;
    }

    getRuns() {
        return this.data.runs || [];
    }

    /** Totals across the campaign and the Music Runs */
    getTotals() {
        let score = 0, completed = 0;
        for (const l of Object.values(this.data.levels)) {
            if (!l.completed) continue;
            completed++;
            score += l.bestScore || 0;
        }
        let musicScore = 0, songs = 0;
        for (const b of Object.values(this.data.musicBest || {})) { musicScore += b.score || 0; songs++; }
        return { score, completed, stars: this.data.profile.totalStars, musicScore, songs, playTime: this.data.stats.totalPlayTime || 0 };
    }

    // Music Runs: best score and grade per song
    getMusicBest(key) {
        return (this.data.musicBest || {})[key] || null;
    }

    setMusicBest(key, value) {
        this.data.musicBest = this.data.musicBest || {};
        this.data.musicBest[key] = value;
        this.save();
    }

    // Settings
    getSetting(key) {
        return this.data.settings[key];
    }

    setSetting(key, value) {
        this.data.settings[key] = value;
        this.save();
    }

    // Stats
    addStat(key, value = 1) {
        if (this.data.stats[key] !== undefined) {
            this.data.stats[key] += value;
            this.save();
        }
    }

    getStat(key) {
        return this.data.stats[key] || 0;
    }

    // Daily rewards
    canClaimDaily() {
        if (!this.data.daily.lastClaim) return true;

        const lastClaim = new Date(this.data.daily.lastClaim);
        const now = new Date();

        // Check if it's a new day
        return lastClaim.toDateString() !== now.toDateString();
    }

    claimDaily() {
        if (!this.canClaimDaily()) return null;

        const now = new Date();
        const lastClaim = this.data.daily.lastClaim ? new Date(this.data.daily.lastClaim) : null;

        // Check if streak should continue or reset
        if (lastClaim) {
            const dayDiff = Math.floor((now - lastClaim) / (1000 * 60 * 60 * 24));
            if (dayDiff > 1) {
                this.data.daily.streak = 0;
            }
        }

        this.data.daily.streak++;
        this.data.daily.lastClaim = now.toISOString();

        // Calculate reward based on streak
        const day = Math.min(this.data.daily.streak, 7);
        const rewards = {
            1: { coins: 50 },
            2: { coins: 75 },
            3: { coins: 100 },
            4: { coins: 150, gems: 1 },
            5: { coins: 200, gems: 2 },
            6: { coins: 250, gems: 3 },
            7: { coins: 500, gems: 5, marble: 'clear_crystal' }
        };

        const reward = rewards[day];

        // Apply rewards
        if (reward.coins) this.addCoins(reward.coins);
        if (reward.gems) this.addGems(reward.gems);
        if (reward.marble) this.unlockMarble(reward.marble);

        this.save();
        return { day, reward };
    }

    getDailyStreak() {
        return this.data.daily.streak;
    }

    // Achievements
    unlockAchievement(achievementId) {
        if (!this.data.achievements.includes(achievementId)) {
            this.data.achievements.push(achievementId);
            this.save();
            return true;
        }
        return false;
    }

    hasAchievement(achievementId) {
        return this.data.achievements.includes(achievementId);
    }

    getAchievements() {
        return this.data.achievements;
    }
}

// Export
GameState.MAX_RUNS = 80;

window.GameState = GameState;
