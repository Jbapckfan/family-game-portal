/**
 * DailyChallenges - Daily and weekly challenge system
 * Fresh content every day with unique rewards
 */

class DailyChallenges {
    constructor(game) {
        this.game = game;

        // Challenge types
        this.challengeTypes = [
            { id: 'speedrun', name: 'Speed Run', description: 'Complete the level as fast as possible', icon: '⚡' },
            { id: 'coinmaster', name: 'Coin Master', description: 'Collect all coins', icon: '🪙' },
            { id: 'perfectrun', name: 'Perfect Run', description: 'Complete without hitting any obstacles', icon: '💫' },
            { id: 'noboost', name: 'No Boost', description: 'Complete without using any boosters', icon: '🚫' },
            { id: 'backwards', name: 'Backwards', description: 'Complete with inverted controls', icon: '🔄' },
            { id: 'timelimit', name: 'Time Attack', description: 'Beat the clock!', icon: '⏱️' },
            { id: 'onelife', name: 'One Life', description: 'Complete on your first try', icon: '❤️' },
            { id: 'combo', name: 'Combo King', description: 'Reach a 15x combo', icon: '🔥' },
            { id: 'lowgravity', name: 'Moon Mode', description: 'Low gravity challenge', icon: '🌙' },
            { id: 'fastforward', name: 'Fast Forward', description: '1.5x speed', icon: '⏩' }
        ];

        // Current challenges
        this.dailyChallenge = null;
        this.weeklyChallenge = null;
        this.challengeProgress = this.loadProgress();

        // Rewards
        this.rewards = {
            daily: { coins: 100, stars: 1, xp: 50 },
            weekly: { coins: 500, stars: 5, xp: 250, skin: true }
        };

        this.init();
    }

    init() {
        this.generateChallenges();
        this.checkReset();
    }

    // Generate deterministic challenges based on date
    generateChallenges() {
        const today = new Date();
        const dayOfYear = this.getDayOfYear(today);
        const weekOfYear = Math.floor(dayOfYear / 7);

        // Daily challenge - changes every day
        const dailySeed = today.getFullYear() * 1000 + dayOfYear;
        this.dailyChallenge = this.generateChallenge(dailySeed, 'daily');

        // Weekly challenge - changes every week
        const weeklySeed = today.getFullYear() * 100 + weekOfYear;
        this.weeklyChallenge = this.generateChallenge(weeklySeed, 'weekly');
    }

    generateChallenge(seed, type) {
        const rng = this.seededRandom(seed);

        // Pick challenge type
        const challengeType = this.challengeTypes[Math.floor(rng() * this.challengeTypes.length)];

        // Pick level
        const levels = window.LEVELS || [];
        const availableLevels = levels.filter(l => l.worldId <= 3); // First 3 worlds
        const level = availableLevels[Math.floor(rng() * availableLevels.length)];

        // Generate modifiers
        const modifiers = this.generateModifiers(challengeType, rng);

        // Generate target based on challenge type
        const target = this.generateTarget(challengeType, level, rng);

        return {
            id: `${type}-${seed}`,
            type: type,
            challengeType: challengeType,
            levelId: level?.id || '1-1',
            levelName: level?.name || 'First Roll',
            modifiers: modifiers,
            target: target,
            reward: type === 'daily' ? this.rewards.daily : this.rewards.weekly,
            expiresAt: this.getExpirationTime(type)
        };
    }

    generateModifiers(challengeType, rng) {
        const modifiers = {};

        switch (challengeType.id) {
            case 'speedrun':
                modifiers.showTimer = true;
                modifiers.timeMultiplier = 1.2;
                break;

            case 'coinmaster':
                modifiers.requireAllCoins = true;
                break;

            case 'perfectrun':
                modifiers.noDamage = true;
                break;

            case 'noboost':
                modifiers.disableBoosters = true;
                break;

            case 'backwards':
                modifiers.invertControls = true;
                break;

            case 'timelimit':
                modifiers.timeLimit = 30 + Math.floor(rng() * 30);
                break;

            case 'onelife':
                modifiers.oneLife = true;
                break;

            case 'combo':
                modifiers.comboRequired = 15;
                break;

            case 'lowgravity':
                modifiers.gravityMultiplier = 0.5;
                break;

            case 'fastforward':
                modifiers.speedMultiplier = 1.5;
                break;
        }

        return modifiers;
    }

    generateTarget(challengeType, level, rng) {
        switch (challengeType.id) {
            case 'speedrun':
                const baseTime = (level?.starThresholds?.three || 5) * 1000;
                return { type: 'time', value: baseTime * 0.8 };

            case 'coinmaster':
                const coins = level?.tracks?.filter(t => t.type === 'coin').length || 3;
                return { type: 'coins', value: coins };

            case 'combo':
                return { type: 'combo', value: 15 };

            case 'timelimit':
                return { type: 'survive', value: 30 + Math.floor(rng() * 30) };

            default:
                return { type: 'complete', value: 1 };
        }
    }

    getExpirationTime(type) {
        const now = new Date();

        if (type === 'daily') {
            // Expires at midnight
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            return tomorrow.getTime();
        } else {
            // Expires at end of week (Sunday midnight)
            const daysUntilSunday = 7 - now.getDay();
            const sunday = new Date(now);
            sunday.setDate(sunday.getDate() + daysUntilSunday);
            sunday.setHours(24, 0, 0, 0);
            return sunday.getTime();
        }
    }

    // Check if challenges need to be reset
    checkReset() {
        const now = Date.now();

        if (this.dailyChallenge && now >= this.dailyChallenge.expiresAt) {
            this.generateChallenges();
        }

        if (this.weeklyChallenge && now >= this.weeklyChallenge.expiresAt) {
            this.generateChallenges();
        }
    }

    // Start a challenge
    startChallenge(challengeId) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return null;

        return {
            challenge: challenge,
            startTime: Date.now(),
            attempts: 0,
            bestResult: null
        };
    }

    // Complete a challenge attempt
    completeAttempt(challengeId, result) {
        const challenge = this.getChallenge(challengeId);
        if (!challenge) return false;

        const success = this.checkSuccess(challenge, result);

        if (success && !this.isCompleted(challengeId)) {
            // Mark as completed
            this.challengeProgress[challengeId] = {
                completedAt: Date.now(),
                result: result
            };
            this.saveProgress();

            // Grant rewards
            this.grantRewards(challenge);

            return true;
        }

        return false;
    }

    checkSuccess(challenge, result) {
        const target = challenge.target;

        switch (target.type) {
            case 'time':
                return result.time <= target.value;

            case 'coins':
                return result.coins >= target.value;

            case 'combo':
                return result.maxCombo >= target.value;

            case 'complete':
                return result.completed === true;

            case 'survive':
                return result.survived >= target.value;

            default:
                return result.completed === true;
        }
    }

    grantRewards(challenge) {
        const reward = challenge.reward;

        // Add coins
        if (reward.coins && this.game?.gameState) {
            this.game.gameState.addCoins(reward.coins);
        }

        // Add XP
        if (reward.xp && this.game?.progression) {
            this.game.progression.addXP(reward.xp);
        }

        // Unlock skin
        if (reward.skin && this.game?.gameState) {
            const skinId = `challenge-${challenge.id}`;
            this.game.gameState.unlockSkin(skinId);
        }

        // Show reward notification
        this.showRewardNotification(challenge, reward);
    }

    showRewardNotification(challenge, reward) {
        const notification = document.createElement('div');
        notification.className = 'challenge-reward-notification';
        notification.innerHTML = `
            <div class="reward-header">
                <span class="reward-icon">${challenge.challengeType.icon}</span>
                <span class="reward-title">Challenge Complete!</span>
            </div>
            <div class="reward-name">${challenge.challengeType.name}</div>
            <div class="reward-items">
                ${reward.coins ? `<div class="reward-item">🪙 +${reward.coins}</div>` : ''}
                ${reward.xp ? `<div class="reward-item">⭐ +${reward.xp} XP</div>` : ''}
                ${reward.skin ? `<div class="reward-item">🎨 New Skin!</div>` : ''}
            </div>
        `;

        this.addNotificationStyles();
        document.body.appendChild(notification);

        // Haptic feedback
        if (this.game?.haptics) {
            this.game.haptics.success();
        }

        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    addNotificationStyles() {
        if (document.getElementById('challenge-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'challenge-notification-styles';
        style.textContent = `
            .challenge-reward-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border: 3px solid #fbbf24;
                border-radius: 16px;
                padding: 24px 32px;
                text-align: center;
                z-index: 100001;
                animation: rewardPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                box-shadow: 0 20px 60px rgba(251, 191, 36, 0.4);
            }

            .challenge-reward-notification.hiding {
                animation: rewardPopOut 0.5s ease forwards;
            }

            @keyframes rewardPopIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.5);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            @keyframes rewardPopOut {
                to {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
            }

            .reward-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 8px;
            }

            .reward-icon {
                font-size: 36px;
            }

            .reward-title {
                color: #fbbf24;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 2px;
                text-transform: uppercase;
            }

            .reward-name {
                color: #fff;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 16px;
            }

            .reward-items {
                display: flex;
                justify-content: center;
                gap: 16px;
            }

            .reward-item {
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 16px;
                border-radius: 8px;
                color: #4ade80;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    // Getters
    getChallenge(challengeId) {
        if (this.dailyChallenge?.id === challengeId) return this.dailyChallenge;
        if (this.weeklyChallenge?.id === challengeId) return this.weeklyChallenge;
        return null;
    }

    getDailyChallenge() {
        this.checkReset();
        return this.dailyChallenge;
    }

    getWeeklyChallenge() {
        this.checkReset();
        return this.weeklyChallenge;
    }

    isCompleted(challengeId) {
        return !!this.challengeProgress[challengeId];
    }

    getTimeRemaining(challenge) {
        const remaining = challenge.expiresAt - Date.now();
        if (remaining <= 0) return { hours: 0, minutes: 0, seconds: 0 };

        return {
            hours: Math.floor(remaining / (1000 * 60 * 60)),
            minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((remaining % (1000 * 60)) / 1000)
        };
    }

    formatTimeRemaining(challenge) {
        const time = this.getTimeRemaining(challenge);
        if (time.hours > 0) {
            return `${time.hours}h ${time.minutes}m`;
        }
        return `${time.minutes}m ${time.seconds}s`;
    }

    // Utility functions
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    seededRandom(seed) {
        let value = seed;
        return () => {
            value = (value * 16807) % 2147483647;
            return (value - 1) / 2147483646;
        };
    }

    // Storage
    loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('velocity_challenge_progress') || '{}');

            // Clean up expired challenges
            const now = Date.now();
            const cleaned = {};
            Object.entries(data).forEach(([id, progress]) => {
                if (progress.completedAt && now - progress.completedAt < 7 * 24 * 60 * 60 * 1000) {
                    cleaned[id] = progress;
                }
            });

            return cleaned;
        } catch (e) {
            return {};
        }
    }

    saveProgress() {
        localStorage.setItem('velocity_challenge_progress', JSON.stringify(this.challengeProgress));
    }

    // UI
    createChallengeCard(challenge, container) {
        const completed = this.isCompleted(challenge.id);

        const card = document.createElement('div');
        card.className = `challenge-card ${completed ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="challenge-type-badge">${challenge.type === 'daily' ? 'DAILY' : 'WEEKLY'}</div>
            <div class="challenge-icon">${challenge.challengeType.icon}</div>
            <div class="challenge-name">${challenge.challengeType.name}</div>
            <div class="challenge-level">Level: ${challenge.levelName}</div>
            <div class="challenge-description">${challenge.challengeType.description}</div>
            <div class="challenge-timer">${this.formatTimeRemaining(challenge)}</div>
            <div class="challenge-rewards">
                ${challenge.reward.coins ? `<span>🪙 ${challenge.reward.coins}</span>` : ''}
                ${challenge.reward.xp ? `<span>⭐ ${challenge.reward.xp} XP</span>` : ''}
            </div>
            ${completed ? '<div class="challenge-completed">✓ COMPLETED</div>' : '<button class="challenge-play">PLAY</button>'}
        `;

        if (!completed) {
            card.querySelector('.challenge-play').addEventListener('click', () => {
                this.onPlayChallenge(challenge);
            });
        }

        container.appendChild(card);
        return card;
    }

    onPlayChallenge(challenge) {
        // Override in game to start challenge
        window.dispatchEvent(new CustomEvent('startChallenge', { detail: challenge }));
    }
}

// Export
window.DailyChallenges = DailyChallenges;
