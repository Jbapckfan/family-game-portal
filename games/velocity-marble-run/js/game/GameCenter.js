/**
 * GameCenter - Integration with Apple Game Center for leaderboards and achievements
 * Falls back to local storage when running in browser
 */

class GameCenter {
    constructor(game) {
        this.game = game;
        this.isAvailable = false;
        this.isAuthenticated = false;
        this.playerId = null;
        this.playerName = 'Player';

        // Leaderboard IDs
        this.leaderboards = {
            totalStars: 'velocity_total_stars',
            totalCoins: 'velocity_total_coins',
            fastestWorld1: 'velocity_world1_time',
            fastestWorld2: 'velocity_world2_time',
            fastestWorld3: 'velocity_world3_time',
            fastestWorld4: 'velocity_world4_time',
            fastestWorld5: 'velocity_world5_time'
        };

        // Achievement IDs
        this.achievements = {
            firstLevel: { id: 'velocity_first_level', title: 'First Roll', description: 'Complete your first level' },
            world1Complete: { id: 'velocity_world1_complete', title: 'Meadow Master', description: 'Complete all Meadow Valley levels' },
            world2Complete: { id: 'velocity_world2_complete', title: 'Desert Explorer', description: 'Complete all Desert Dunes levels' },
            world3Complete: { id: 'velocity_world3_complete', title: 'Ice Climber', description: 'Complete all Frozen Peaks levels' },
            world4Complete: { id: 'velocity_world4_complete', title: 'Volcano Survivor', description: 'Complete all Volcanic Core levels' },
            world5Complete: { id: 'velocity_world5_complete', title: 'Space Pioneer', description: 'Complete all Cosmic Void levels' },
            perfectWorld: { id: 'velocity_perfect_world', title: 'Perfectionist', description: 'Get 3 stars on all levels in any world' },
            allStars: { id: 'velocity_all_stars', title: 'Star Collector', description: 'Earn all 150 stars' },
            speedDemon: { id: 'velocity_speed_demon', title: 'Speed Demon', description: 'Complete any level in under 3 seconds' },
            coinCollector: { id: 'velocity_coin_collector', title: 'Coin Collector', description: 'Collect 1000 coins total' },
            combo10: { id: 'velocity_combo_10', title: 'Combo Starter', description: 'Achieve a 10x combo' },
            combo25: { id: 'velocity_combo_25', title: 'Combo Master', description: 'Achieve a 25x combo' },
            noFails: { id: 'velocity_no_fails', title: 'Untouchable', description: 'Complete a world without dying' },
            customLevel: { id: 'velocity_custom_level', title: 'Level Designer', description: 'Create and save a custom level' },
            shareLevel: { id: 'velocity_share_level', title: 'Community Builder', description: 'Share a custom level' }
        };

        // Local fallback data
        this.localScores = this.loadLocalScores();
        this.localAchievements = this.loadLocalAchievements();

        this.init();
    }

    async init() {
        // Check for Capacitor Game Center plugin
        if (window.Capacitor && window.Capacitor.Plugins.GameCenter) {
            this.isAvailable = true;
            await this.authenticate();
        } else {
            // Browser fallback
            console.log('GameCenter: Using local fallback');
            this.isAvailable = false;
            this.playerName = localStorage.getItem('velocity_player_name') || 'Player';
        }
    }

    async authenticate() {
        if (!this.isAvailable) return false;

        try {
            const result = await window.Capacitor.Plugins.GameCenter.signIn();
            if (result.authenticated) {
                this.isAuthenticated = true;
                this.playerId = result.player.playerId;
                this.playerName = result.player.displayName || result.player.alias;
                console.log('GameCenter: Authenticated as', this.playerName);
                return true;
            }
        } catch (error) {
            console.error('GameCenter auth failed:', error);
        }

        return false;
    }

    // Leaderboards
    async submitScore(leaderboardId, score) {
        // Always save locally
        this.localScores[leaderboardId] = Math.max(this.localScores[leaderboardId] || 0, score);
        this.saveLocalScores();

        // Submit to Game Center if available
        if (this.isAuthenticated && window.Capacitor?.Plugins.GameCenter) {
            try {
                await window.Capacitor.Plugins.GameCenter.submitScore({
                    leaderboardId: leaderboardId,
                    score: score
                });
                return true;
            } catch (error) {
                console.error('Failed to submit score:', error);
            }
        }

        return false;
    }

    async showLeaderboard(leaderboardId = null) {
        if (this.isAuthenticated && window.Capacitor?.Plugins.GameCenter) {
            try {
                await window.Capacitor.Plugins.GameCenter.showLeaderboard({
                    leaderboardId: leaderboardId
                });
                return true;
            } catch (error) {
                console.error('Failed to show leaderboard:', error);
            }
        }

        // Show local leaderboard UI
        this.showLocalLeaderboard(leaderboardId);
        return false;
    }

    showLocalLeaderboard(leaderboardId) {
        const modal = document.createElement('div');
        modal.className = 'gc-modal';
        modal.innerHTML = `
            <div class="gc-content">
                <h2>Leaderboard</h2>
                <div class="gc-scores">
                    ${this.getLocalLeaderboardHTML(leaderboardId)}
                </div>
                <button class="gc-close">Close</button>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);

        modal.querySelector('.gc-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getLocalLeaderboardHTML(leaderboardId) {
        const scores = this.localScores;
        let html = '<div class="gc-score-list">';

        if (leaderboardId && scores[leaderboardId]) {
            html += `
                <div class="gc-score-item">
                    <span class="gc-rank">1</span>
                    <span class="gc-name">${this.playerName}</span>
                    <span class="gc-score">${scores[leaderboardId]}</span>
                </div>
            `;
        } else {
            // Show all scores
            Object.entries(scores).forEach(([id, score], index) => {
                const name = id.replace('velocity_', '').replace(/_/g, ' ');
                html += `
                    <div class="gc-score-item">
                        <span class="gc-name">${name}</span>
                        <span class="gc-score">${score}</span>
                    </div>
                `;
            });
        }

        html += '</div>';

        if (Object.keys(scores).length === 0) {
            html = '<p class="gc-empty">No scores yet. Play some levels!</p>';
        }

        return html;
    }

    // Achievements
    async unlockAchievement(achievementKey) {
        const achievement = this.achievements[achievementKey];
        if (!achievement) return false;

        // Check if already unlocked
        if (this.localAchievements[achievementKey]) return false;

        // Mark as unlocked locally
        this.localAchievements[achievementKey] = {
            unlockedAt: Date.now(),
            ...achievement
        };
        this.saveLocalAchievements();

        // Show notification
        this.showAchievementNotification(achievement);

        // Submit to Game Center
        if (this.isAuthenticated && window.Capacitor?.Plugins.GameCenter) {
            try {
                await window.Capacitor.Plugins.GameCenter.unlockAchievement({
                    achievementId: achievement.id,
                    percentComplete: 100
                });
                return true;
            } catch (error) {
                console.error('Failed to unlock achievement:', error);
            }
        }

        return true;
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'gc-achievement-notification';
        notification.innerHTML = `
            <div class="gc-achievement-icon">🏆</div>
            <div class="gc-achievement-info">
                <div class="gc-achievement-label">Achievement Unlocked!</div>
                <div class="gc-achievement-title">${achievement.title}</div>
                <div class="gc-achievement-desc">${achievement.description}</div>
            </div>
        `;

        this.addAchievementStyles();
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

    async showAchievements() {
        if (this.isAuthenticated && window.Capacitor?.Plugins.GameCenter) {
            try {
                await window.Capacitor.Plugins.GameCenter.showAchievements();
                return true;
            } catch (error) {
                console.error('Failed to show achievements:', error);
            }
        }

        // Show local achievements UI
        this.showLocalAchievements();
        return false;
    }

    showLocalAchievements() {
        const modal = document.createElement('div');
        modal.className = 'gc-modal';
        modal.innerHTML = `
            <div class="gc-content gc-achievements">
                <h2>Achievements</h2>
                <div class="gc-achievement-list">
                    ${this.getLocalAchievementsHTML()}
                </div>
                <button class="gc-close">Close</button>
            </div>
        `;

        this.addModalStyles();
        document.body.appendChild(modal);

        modal.querySelector('.gc-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getLocalAchievementsHTML() {
        let html = '';

        Object.entries(this.achievements).forEach(([key, achievement]) => {
            const unlocked = this.localAchievements[key];
            html += `
                <div class="gc-achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="gc-achievement-icon">${unlocked ? '🏆' : '🔒'}</div>
                    <div class="gc-achievement-details">
                        <div class="gc-achievement-title">${achievement.title}</div>
                        <div class="gc-achievement-desc">${achievement.description}</div>
                        ${unlocked ? `<div class="gc-achievement-date">Unlocked ${new Date(unlocked.unlockedAt).toLocaleDateString()}</div>` : ''}
                    </div>
                </div>
            `;
        });

        return html;
    }

    // Progress tracking
    checkWorldComplete(worldId, gameState) {
        const worldLevels = window.LEVELS?.filter(l => l.worldId === worldId) || [];
        const allComplete = worldLevels.every(level => {
            const progress = gameState.getLevelProgress(level.id);
            return progress && progress.completed;
        });

        if (allComplete) {
            const achievementKey = `world${worldId}Complete`;
            this.unlockAchievement(achievementKey);
        }

        // Check for perfect world
        const allThreeStars = worldLevels.every(level => {
            const progress = gameState.getLevelProgress(level.id);
            return progress && progress.stars === 3;
        });

        if (allThreeStars) {
            this.unlockAchievement('perfectWorld');
        }
    }

    checkAllStars(gameState) {
        const totalLevels = window.LEVELS?.length || 50;
        const totalPossibleStars = totalLevels * 3;
        const earnedStars = gameState.getTotalStars();

        if (earnedStars >= totalPossibleStars) {
            this.unlockAchievement('allStars');
        }

        // Update leaderboard
        this.submitScore(this.leaderboards.totalStars, earnedStars);
    }

    checkSpeedDemon(levelTime) {
        if (levelTime <= 3000) { // 3 seconds
            this.unlockAchievement('speedDemon');
        }
    }

    checkCombo(comboCount) {
        if (comboCount >= 10) {
            this.unlockAchievement('combo10');
        }
        if (comboCount >= 25) {
            this.unlockAchievement('combo25');
        }
    }

    // Local storage
    loadLocalScores() {
        try {
            return JSON.parse(localStorage.getItem('velocity_gc_scores') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveLocalScores() {
        localStorage.setItem('velocity_gc_scores', JSON.stringify(this.localScores));
    }

    loadLocalAchievements() {
        try {
            return JSON.parse(localStorage.getItem('velocity_gc_achievements') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveLocalAchievements() {
        localStorage.setItem('velocity_gc_achievements', JSON.stringify(this.localAchievements));
    }

    // Styles
    addModalStyles() {
        if (document.getElementById('gc-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'gc-modal-styles';
        style.textContent = `
            .gc-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                animation: gcFadeIn 0.3s ease;
            }

            @keyframes gcFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .gc-content {
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border: 2px solid #6366f1;
                border-radius: 16px;
                padding: 24px;
                min-width: 320px;
                max-width: 90%;
                max-height: 80%;
                overflow-y: auto;
            }

            .gc-content h2 {
                color: #fff;
                margin: 0 0 20px 0;
                text-align: center;
            }

            .gc-score-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .gc-score-item {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(0, 0, 0, 0.3);
                padding: 12px 16px;
                border-radius: 8px;
            }

            .gc-rank {
                width: 30px;
                height: 30px;
                background: #fbbf24;
                color: #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }

            .gc-name {
                flex: 1;
                color: #fff;
                text-transform: capitalize;
            }

            .gc-score {
                color: #4ade80;
                font-weight: bold;
                font-size: 18px;
            }

            .gc-empty {
                color: #94a3b8;
                text-align: center;
                padding: 20px;
            }

            .gc-close {
                display: block;
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                background: #6366f1;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: bold;
                cursor: pointer;
            }

            .gc-achievement-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .gc-achievement-item {
                display: flex;
                gap: 12px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
            }

            .gc-achievement-item.locked {
                opacity: 0.5;
            }

            .gc-achievement-item .gc-achievement-icon {
                font-size: 32px;
            }

            .gc-achievement-details {
                flex: 1;
            }

            .gc-achievement-details .gc-achievement-title {
                color: #fff;
                font-weight: bold;
            }

            .gc-achievement-details .gc-achievement-desc {
                color: #94a3b8;
                font-size: 12px;
                margin-top: 4px;
            }

            .gc-achievement-date {
                color: #4ade80;
                font-size: 11px;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    addAchievementStyles() {
        if (document.getElementById('gc-achievement-styles')) return;

        const style = document.createElement('style');
        style.id = 'gc-achievement-styles';
        style.textContent = `
            .gc-achievement-notification {
                position: fixed;
                top: 60px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border: 2px solid #fbbf24;
                border-radius: 12px;
                padding: 16px 24px;
                display: flex;
                gap: 16px;
                align-items: center;
                z-index: 100001;
                animation: achievementSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                box-shadow: 0 10px 40px rgba(251, 191, 36, 0.3);
            }

            .gc-achievement-notification.hiding {
                animation: achievementSlideOut 0.5s ease forwards;
            }

            @keyframes achievementSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-40px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            @keyframes achievementSlideOut {
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-40px);
                }
            }

            .gc-achievement-notification .gc-achievement-icon {
                font-size: 40px;
            }

            .gc-achievement-notification .gc-achievement-info {
                display: flex;
                flex-direction: column;
            }

            .gc-achievement-notification .gc-achievement-label {
                color: #fbbf24;
                font-size: 11px;
                font-weight: bold;
                letter-spacing: 1px;
                text-transform: uppercase;
            }

            .gc-achievement-notification .gc-achievement-title {
                color: #fff;
                font-size: 18px;
                font-weight: bold;
                margin-top: 2px;
            }

            .gc-achievement-notification .gc-achievement-desc {
                color: #94a3b8;
                font-size: 12px;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    // Player name
    setPlayerName(name) {
        this.playerName = name;
        localStorage.setItem('velocity_player_name', name);
    }
}

// Export
window.GameCenter = GameCenter;
