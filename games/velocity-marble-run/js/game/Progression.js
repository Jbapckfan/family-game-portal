/**
 * Progression - Handles unlockables, achievements, and rewards
 */
class Progression {
    constructor(gameState) {
        this.state = gameState;
    }

    // Marble unlock requirements
    // Every marble is bought with coins at its portal price; Opal is free
    static get MARBLE_UNLOCKS() {
        const out = {};
        for (const [id, m] of Object.entries(Marble.STYLES)) {
            out[id] = m.price > 0 ? { type: 'coins', cost: m.price } : { type: 'free' };
        }
        return out;
    }

    // Achievement definitions
    static ACHIEVEMENTS = {
        first_roll: {
            name: 'First Roll',
            description: 'Complete your first level',
            icon: '🎯',
            reward: { coins: 50 }
        },
        speed_demon: {
            name: 'Speed Demon',
            description: 'Complete a level in under 3 seconds',
            icon: '⚡',
            reward: { coins: 100 }
        },
        perfectionist: {
            name: 'Perfectionist',
            description: 'Get 3 stars on 10 levels',
            icon: '⭐',
            reward: { coins: 200, marble: 'obsidian' }
        },
        coin_collector: {
            name: 'Coin Collector',
            description: 'Collect 500 coins total',
            icon: '🪙',
            reward: { coins: 100 }
        },
        bounce_master: {
            name: 'Bounce Master',
            description: 'Hit 100 bumpers',
            icon: '🔴',
            reward: { coins: 150 }
        },
        portal_jumper: {
            name: 'Portal Jumper',
            description: 'Use 50 portals',
            icon: '🌀',
            reward: { coins: 150 }
        },
        world_1_complete: {
            name: 'Valley Victor',
            description: 'Complete World 1',
            icon: '🌿',
            reward: { coins: 300, gems: 5 }
        },
        world_2_complete: {
            name: 'Desert Conqueror',
            description: 'Complete World 2',
            icon: '🏜️',
            reward: { coins: 400, gems: 10 }
        },
        world_3_complete: {
            name: 'Ice Breaker',
            description: 'Complete World 3',
            icon: '❄️',
            reward: { coins: 500, gems: 15 }
        },
        world_4_complete: {
            name: 'Volcano Survivor',
            description: 'Complete World 4',
            icon: '🌋',
            reward: { coins: 600, gems: 20 }
        },
        world_5_complete: {
            name: 'Cosmic Champion',
            description: 'Complete World 5',
            icon: '🌌',
            reward: { coins: 1000, gems: 30 }
        },
        world_6_complete: {
            name: 'Grid Runner',
            description: 'Complete World 6',
            icon: '🔷',
            reward: { coins: 1500, gems: 40 }
        },
        world_7_complete: {
            name: 'Grand Prix Champion',
            description: 'Complete every Grand Prix circuit',
            icon: '🏁',
            reward: { coins: 2000, gems: 50 }
        },
        world_master: {
            name: 'World Master',
            description: 'Complete all worlds',
            icon: '👑',
            reward: { coins: 2000, gems: 50, marble: 'labradorite' }
        },
        dedicated: {
            name: 'Dedicated',
            description: 'Play for 1 hour total',
            icon: '⏰',
            reward: { coins: 200 }
        },
        streak_7: {
            name: 'Weekly Warrior',
            description: 'Maintain a 7-day login streak',
            icon: '📅',
            reward: { coins: 500, gems: 10 }
        },
        star_collector: {
            name: 'Star Collector',
            description: 'Collect 100 stars',
            icon: '🌟',
            reward: { coins: 500, gems: 20 }
        },
        all_stars: {
            name: 'All Stars',
            description: 'Get 3 stars on every level',
            icon: '💫',
            reward: { coins: 5000, gems: 100 }
        }
    };

    getMarbleUnlockStatus(marbleId) {
        const unlock = Progression.MARBLE_UNLOCKS[marbleId];
        if (!unlock) return { unlocked: false, reason: 'Unknown marble' };

        if (this.state.hasMarble(marbleId)) {
            return { unlocked: true };
        }

        switch (unlock.type) {
            case 'free':
                return { unlocked: true };

            case 'coins':
                return {
                    unlocked: false,
                    type: 'coins',
                    cost: unlock.cost,
                    canAfford: this.state.getCoins() >= unlock.cost
                };

            case 'stars':
                return {
                    unlocked: false,
                    type: 'stars',
                    required: unlock.required,
                    current: this.state.getTotalStars(),
                    progress: this.state.getTotalStars() / unlock.required
                };

            case 'achievement':
                return {
                    unlocked: false,
                    type: 'achievement',
                    achievementId: unlock.id,
                    achieved: this.state.hasAchievement(unlock.id)
                };

            case 'daily':
                return {
                    unlocked: false,
                    type: 'daily',
                    requiredDay: unlock.day
                };

            default:
                return { unlocked: false };
        }
    }

    purchaseMarble(marbleId) {
        const status = this.getMarbleUnlockStatus(marbleId);

        if (status.unlocked) return { success: false, reason: 'Already owned' };

        if (status.type === 'coins' && status.canAfford) {
            if (this.state.spendCoins(status.cost)) {
                this.state.unlockMarble(marbleId);
                return { success: true };
            }
        }

        if (status.type === 'stars' && status.current >= status.required) {
            this.state.unlockMarble(marbleId);
            return { success: true };
        }

        if (status.type === 'achievement' && status.achieved) {
            this.state.unlockMarble(marbleId);
            return { success: true };
        }

        return { success: false, reason: 'Requirements not met' };
    }

    checkAchievements(event, data = {}) {
        const unlocked = [];

        switch (event) {
            case 'level_complete':
                // First roll
                if (!this.state.hasAchievement('first_roll')) {
                    this.state.unlockAchievement('first_roll');
                    unlocked.push('first_roll');
                }

                // Speed demon
                if (data.time && data.time < 3 && !this.state.hasAchievement('speed_demon')) {
                    this.state.unlockAchievement('speed_demon');
                    unlocked.push('speed_demon');
                }

                // Perfectionist (10 levels with 3 stars)
                if (!this.state.hasAchievement('perfectionist')) {
                    const threeStarLevels = Object.values(this.state.data.levels)
                        .filter(l => l.stars === 3).length;
                    if (threeStarLevels >= 10) {
                        this.state.unlockAchievement('perfectionist');
                        unlocked.push('perfectionist');
                    }
                }

                // World completion checks
                this.checkWorldCompletion(data.levelId, unlocked);
                break;

            case 'coin_collect':
                if (this.state.getStat('totalCoinsCollected') >= 500 &&
                    !this.state.hasAchievement('coin_collector')) {
                    this.state.unlockAchievement('coin_collector');
                    unlocked.push('coin_collector');
                }
                break;

            case 'bumper_hit':
                this.state.addStat('totalBumperHits');
                if (this.state.getStat('totalBumperHits') >= 100 &&
                    !this.state.hasAchievement('bounce_master')) {
                    this.state.unlockAchievement('bounce_master');
                    unlocked.push('bounce_master');
                }
                break;

            case 'portal_use':
                this.state.addStat('totalPortalUses');
                if (this.state.getStat('totalPortalUses') >= 50 &&
                    !this.state.hasAchievement('portal_jumper')) {
                    this.state.unlockAchievement('portal_jumper');
                    unlocked.push('portal_jumper');
                }
                break;

            case 'playtime_update':
                if (this.state.getStat('totalPlayTime') >= 3600 &&
                    !this.state.hasAchievement('dedicated')) {
                    this.state.unlockAchievement('dedicated');
                    unlocked.push('dedicated');
                }
                break;

            case 'daily_claim':
                if (data.streak >= 7 && !this.state.hasAchievement('streak_7')) {
                    this.state.unlockAchievement('streak_7');
                    unlocked.push('streak_7');
                }
                break;

            case 'star_earn':
                if (this.state.getTotalStars() >= 100 &&
                    !this.state.hasAchievement('star_collector')) {
                    this.state.unlockAchievement('star_collector');
                    unlocked.push('star_collector');
                }

                // Check for all stars (assuming 150 total possible)
                if (this.state.getTotalStars() >= 150 &&
                    !this.state.hasAchievement('all_stars')) {
                    this.state.unlockAchievement('all_stars');
                    unlocked.push('all_stars');
                }
                break;
        }

        // Apply rewards for unlocked achievements
        for (const achievementId of unlocked) {
            const achievement = Progression.ACHIEVEMENTS[achievementId];
            if (achievement && achievement.reward) {
                if (achievement.reward.coins) {
                    this.state.addCoins(achievement.reward.coins);
                }
                if (achievement.reward.gems) {
                    this.state.addGems(achievement.reward.gems);
                }
                if (achievement.reward.marble) {
                    this.state.unlockMarble(achievement.reward.marble);
                }
            }
        }

        return unlocked;
    }

    checkWorldCompletion(levelId, unlocked) {
        if (!levelId) return;

        const [worldId] = levelId.split('-').map(Number);
        const worldAchievements = {
            1: 'world_1_complete',
            2: 'world_2_complete',
            3: 'world_3_complete',
            4: 'world_4_complete',
            5: 'world_5_complete',
            6: 'world_6_complete',
            7: 'world_7_complete'
        };

        const achievementId = worldAchievements[worldId];
        if (!achievementId || this.state.hasAchievement(achievementId)) return;

        // Check if every level in this world is complete
        let allComplete = true;
        for (const lvl of (window.LEVELS || []).filter(l => l.worldId === worldId)) {
            const data = this.state.getLevelData(lvl.id);
            if (!data.completed) {
                allComplete = false;
                break;
            }
        }

        if (allComplete) {
            this.state.unlockAchievement(achievementId);
            unlocked.push(achievementId);

            // Check for world master (all worlds complete)
            if (!this.state.hasAchievement('world_master')) {
                const allWorldsComplete = (window.WORLDS || []).map(w => w.id).every(wId => {
                    const wAchId = worldAchievements[wId];
                    return this.state.hasAchievement(wAchId);
                });

                if (allWorldsComplete) {
                    this.state.unlockAchievement('world_master');
                    unlocked.push('world_master');
                }
            }
        }
    }

    getAchievementInfo(achievementId) {
        const achievement = Progression.ACHIEVEMENTS[achievementId];
        if (!achievement) return null;

        return {
            ...achievement,
            unlocked: this.state.hasAchievement(achievementId)
        };
    }

    getAllAchievements() {
        return Object.entries(Progression.ACHIEVEMENTS).map(([id, data]) => ({
            id,
            ...data,
            unlocked: this.state.hasAchievement(id)
        }));
    }

    getAllMarbles() {
        return Object.keys(Progression.MARBLE_UNLOCKS).map(id => ({
            id,
            ...this.getMarbleUnlockStatus(id),
            style: Marble.STYLES[id]
        }));
    }
}

// Export
window.Progression = Progression;
