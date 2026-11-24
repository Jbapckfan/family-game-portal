/**
 * CloudSync - iCloud save synchronization
 * Syncs progress across devices using Capacitor CloudKit or fallback
 */

class CloudSync {
    constructor(game) {
        this.game = game;
        this.isAvailable = false;
        this.isSyncing = false;
        this.lastSyncTime = 0;
        this.syncInterval = 60000; // 1 minute

        // Data keys to sync
        this.syncKeys = [
            'velocity_progress',
            'velocity_settings',
            'velocity_unlocks',
            'velocity_stats',
            'velocity_best_runs',
            'velocity_gc_achievements'
        ];

        // Conflict resolution
        this.conflictStrategy = 'latest'; // 'latest', 'merge', 'local', 'cloud'

        this.init();
    }

    async init() {
        // Check for Capacitor iCloud plugin
        if (window.Capacitor && window.Capacitor.Plugins.CloudKit) {
            this.isAvailable = true;
            await this.checkAvailability();
        } else if (window.Capacitor && window.Capacitor.Plugins.Preferences) {
            // Use Capacitor Preferences as cross-device sync fallback
            this.isAvailable = true;
            this.usePreferences = true;
        } else {
            console.log('CloudSync: No cloud storage available');
            this.isAvailable = false;
        }

        if (this.isAvailable) {
            this.startAutoSync();
        }
    }

    async checkAvailability() {
        try {
            const result = await window.Capacitor.Plugins.CloudKit.isAvailable();
            this.isAvailable = result.available;
            return this.isAvailable;
        } catch (error) {
            console.error('CloudSync: Availability check failed', error);
            this.isAvailable = false;
            return false;
        }
    }

    // Sync all data
    async sync() {
        if (!this.isAvailable || this.isSyncing) return false;

        this.isSyncing = true;
        this.showSyncIndicator();

        try {
            // Get cloud data
            const cloudData = await this.fetchCloudData();

            // Get local data
            const localData = this.getLocalData();

            // Resolve conflicts and merge
            const mergedData = this.resolveConflicts(localData, cloudData);

            // Save merged data locally
            this.saveLocalData(mergedData);

            // Upload to cloud
            await this.uploadToCloud(mergedData);

            this.lastSyncTime = Date.now();
            this.hideSyncIndicator(true);

            return true;
        } catch (error) {
            console.error('CloudSync: Sync failed', error);
            this.hideSyncIndicator(false);
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    // Fetch data from cloud
    async fetchCloudData() {
        const data = {};

        if (this.usePreferences) {
            // Use Capacitor Preferences
            for (const key of this.syncKeys) {
                try {
                    const result = await window.Capacitor.Plugins.Preferences.get({ key: `cloud_${key}` });
                    if (result.value) {
                        data[key] = JSON.parse(result.value);
                    }
                } catch (e) {
                    console.warn(`CloudSync: Failed to fetch ${key}`, e);
                }
            }
        } else {
            // Use CloudKit
            for (const key of this.syncKeys) {
                try {
                    const result = await window.Capacitor.Plugins.CloudKit.get({ key: key });
                    if (result.value) {
                        data[key] = JSON.parse(result.value);
                    }
                } catch (e) {
                    console.warn(`CloudSync: Failed to fetch ${key}`, e);
                }
            }
        }

        return data;
    }

    // Get local data
    getLocalData() {
        const data = {};

        for (const key of this.syncKeys) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    data[key] = {
                        value: JSON.parse(value),
                        timestamp: parseInt(localStorage.getItem(`${key}_timestamp`) || '0')
                    };
                }
            } catch (e) {
                console.warn(`CloudSync: Failed to read local ${key}`, e);
            }
        }

        return data;
    }

    // Save local data
    saveLocalData(data) {
        for (const key of this.syncKeys) {
            if (data[key]) {
                try {
                    localStorage.setItem(key, JSON.stringify(data[key].value));
                    localStorage.setItem(`${key}_timestamp`, data[key].timestamp.toString());
                } catch (e) {
                    console.warn(`CloudSync: Failed to save local ${key}`, e);
                }
            }
        }
    }

    // Upload to cloud
    async uploadToCloud(data) {
        for (const key of this.syncKeys) {
            if (data[key]) {
                const payload = JSON.stringify(data[key]);

                try {
                    if (this.usePreferences) {
                        await window.Capacitor.Plugins.Preferences.set({
                            key: `cloud_${key}`,
                            value: payload
                        });
                    } else {
                        await window.Capacitor.Plugins.CloudKit.set({
                            key: key,
                            value: payload
                        });
                    }
                } catch (e) {
                    console.warn(`CloudSync: Failed to upload ${key}`, e);
                }
            }
        }
    }

    // Resolve conflicts between local and cloud data
    resolveConflicts(localData, cloudData) {
        const merged = {};

        for (const key of this.syncKeys) {
            const local = localData[key];
            const cloud = cloudData[key];

            if (!local && !cloud) continue;
            if (!local) {
                merged[key] = cloud;
                continue;
            }
            if (!cloud) {
                merged[key] = local;
                continue;
            }

            // Both exist - resolve conflict
            switch (this.conflictStrategy) {
                case 'latest':
                    merged[key] = local.timestamp > cloud.timestamp ? local : cloud;
                    break;

                case 'merge':
                    merged[key] = this.mergeData(key, local, cloud);
                    break;

                case 'local':
                    merged[key] = local;
                    break;

                case 'cloud':
                    merged[key] = cloud;
                    break;

                default:
                    merged[key] = local.timestamp > cloud.timestamp ? local : cloud;
            }
        }

        return merged;
    }

    // Smart merge for specific data types
    mergeData(key, local, cloud) {
        const timestamp = Math.max(local.timestamp, cloud.timestamp);

        switch (key) {
            case 'velocity_progress':
                // Merge level progress - keep best stars for each level
                return {
                    value: this.mergeProgress(local.value, cloud.value),
                    timestamp: timestamp
                };

            case 'velocity_unlocks':
                // Merge unlocks - combine all unlocked items
                return {
                    value: this.mergeUnlocks(local.value, cloud.value),
                    timestamp: timestamp
                };

            case 'velocity_stats':
                // Merge stats - keep highest values
                return {
                    value: this.mergeStats(local.value, cloud.value),
                    timestamp: timestamp
                };

            case 'velocity_best_runs':
                // Merge best runs - keep fastest times
                return {
                    value: this.mergeBestRuns(local.value, cloud.value),
                    timestamp: timestamp
                };

            default:
                // Default to latest
                return local.timestamp > cloud.timestamp ? local : cloud;
        }
    }

    mergeProgress(local, cloud) {
        const merged = { ...local };

        if (cloud.levels) {
            merged.levels = merged.levels || {};
            for (const [levelId, progress] of Object.entries(cloud.levels)) {
                if (!merged.levels[levelId]) {
                    merged.levels[levelId] = progress;
                } else {
                    // Keep best stars
                    merged.levels[levelId].stars = Math.max(
                        merged.levels[levelId].stars || 0,
                        progress.stars || 0
                    );
                    // Keep best time
                    if (progress.bestTime && (!merged.levels[levelId].bestTime || progress.bestTime < merged.levels[levelId].bestTime)) {
                        merged.levels[levelId].bestTime = progress.bestTime;
                    }
                    // Mark as completed if either is completed
                    merged.levels[levelId].completed = merged.levels[levelId].completed || progress.completed;
                }
            }
        }

        // Keep total coins as max
        merged.totalCoins = Math.max(local.totalCoins || 0, cloud.totalCoins || 0);

        return merged;
    }

    mergeUnlocks(local, cloud) {
        // Combine all unlocked items
        return {
            skins: [...new Set([...(local.skins || []), ...(cloud.skins || [])])],
            trails: [...new Set([...(local.trails || []), ...(cloud.trails || [])])],
            worlds: [...new Set([...(local.worlds || []), ...(cloud.worlds || [])])]
        };
    }

    mergeStats(local, cloud) {
        return {
            totalPlayTime: Math.max(local.totalPlayTime || 0, cloud.totalPlayTime || 0),
            levelsCompleted: Math.max(local.levelsCompleted || 0, cloud.levelsCompleted || 0),
            totalCoinsCollected: Math.max(local.totalCoinsCollected || 0, cloud.totalCoinsCollected || 0),
            totalDeaths: Math.max(local.totalDeaths || 0, cloud.totalDeaths || 0),
            highestCombo: Math.max(local.highestCombo || 0, cloud.highestCombo || 0),
            perfectLevels: Math.max(local.perfectLevels || 0, cloud.perfectLevels || 0)
        };
    }

    mergeBestRuns(local, cloud) {
        const merged = { ...local };

        for (const [levelId, run] of Object.entries(cloud)) {
            if (!merged[levelId] || run.duration < merged[levelId].duration) {
                merged[levelId] = run;
            }
        }

        return merged;
    }

    // Auto sync
    startAutoSync() {
        // Sync on app focus
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && Date.now() - this.lastSyncTime > this.syncInterval) {
                this.sync();
            }
        });

        // Periodic sync
        setInterval(() => {
            if (!document.hidden) {
                this.sync();
            }
        }, this.syncInterval);

        // Initial sync
        this.sync();
    }

    // Manual trigger
    async forceSyncNow() {
        return await this.sync();
    }

    // Save specific key immediately
    async saveKey(key, value) {
        try {
            const timestamp = Date.now();

            // Save locally
            localStorage.setItem(key, JSON.stringify(value));
            localStorage.setItem(`${key}_timestamp`, timestamp.toString());

            // Upload to cloud
            if (this.isAvailable) {
                const payload = JSON.stringify({ value, timestamp });

                if (this.usePreferences) {
                    await window.Capacitor.Plugins.Preferences.set({
                        key: `cloud_${key}`,
                        value: payload
                    });
                } else {
                    await window.Capacitor.Plugins.CloudKit.set({
                        key: key,
                        value: payload
                    });
                }
            }

            return true;
        } catch (error) {
            console.error(`CloudSync: Failed to save ${key}`, error);
            return false;
        }
    }

    // UI indicators
    showSyncIndicator() {
        let indicator = document.getElementById('sync-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'sync-indicator';
            indicator.innerHTML = '☁️ Syncing...';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: #fff;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 99999;
                animation: syncPulse 1s ease-in-out infinite;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes syncPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hideSyncIndicator(success) {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.innerHTML = success ? '☁️ Synced!' : '☁️ Sync failed';
            indicator.style.animation = 'none';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 1500);
        }
    }

    // Status
    getStatus() {
        return {
            isAvailable: this.isAvailable,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            lastSyncFormatted: this.lastSyncTime ?
                new Date(this.lastSyncTime).toLocaleTimeString() : 'Never'
        };
    }

    // Reset cloud data (dangerous!)
    async resetCloudData() {
        if (!this.isAvailable) return false;

        try {
            for (const key of this.syncKeys) {
                if (this.usePreferences) {
                    await window.Capacitor.Plugins.Preferences.remove({ key: `cloud_${key}` });
                } else {
                    await window.Capacitor.Plugins.CloudKit.remove({ key: key });
                }
            }
            return true;
        } catch (error) {
            console.error('CloudSync: Failed to reset cloud data', error);
            return false;
        }
    }
}

// Export
window.CloudSync = CloudSync;
