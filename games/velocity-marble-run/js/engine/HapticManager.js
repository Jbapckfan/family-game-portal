/**
 * HapticManager - iOS-optimized haptic feedback system
 * Provides tactile feedback for game events
 */
class HapticManager {
    constructor() {
        this.enabled = true;
        this.intensity = 1;
        this.supportsHaptics = this.checkSupport();
    }

    checkSupport() {
        // Check for iOS Haptic Engine (Taptic Engine)
        if ('vibrate' in navigator) {
            return true;
        }
        // Check for Capacitor Haptics plugin
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            return true;
        }
        return false;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
    }

    // Light impact - for small bounces, UI touches
    light() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate(10 * this.intensity);
    }

    // Medium impact - for regular bounces, collecting items
    medium() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate(20 * this.intensity);
    }

    // Heavy impact - for bumpers, large collisions
    heavy() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate(30 * this.intensity);
    }

    // Success pattern - level complete
    success() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate([10, 50, 20, 50, 30]);
    }

    // Warning pattern - near edge, danger
    warning() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate([15, 30, 15]);
    }

    // Error pattern - level failed
    error() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate([50, 100, 50]);
    }

    // Custom pattern for boost
    boost() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate([5, 10, 10, 10, 15]);
    }

    // Custom pattern for portal teleport
    portal() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate([10, 20, 20, 20, 30, 20, 40]);
    }

    // Selection feedback for UI
    selection() {
        if (!this.enabled || !this.supportsHaptics) return;
        this.vibrate(5);
    }

    // Dynamic bounce based on velocity
    bounce(velocity) {
        if (!this.enabled || !this.supportsHaptics) return;
        const normalizedVel = Math.min(1, velocity / 500);
        const duration = Math.floor(5 + normalizedVel * 25);
        this.vibrate(duration * this.intensity);
    }

    // Internal vibration method
    vibrate(pattern) {
        try {
            // Try Capacitor Haptics first (for native iOS)
            if (window.Capacitor?.Plugins?.Haptics) {
                if (Array.isArray(pattern)) {
                    // Pattern vibration
                    window.Capacitor.Plugins.Haptics.vibrate({ duration: pattern.reduce((a, b) => a + b, 0) });
                } else {
                    // Single vibration
                    const impactStyle = pattern < 15 ? 'Light' : pattern < 25 ? 'Medium' : 'Heavy';
                    window.Capacitor.Plugins.Haptics.impact({ style: impactStyle });
                }
                return;
            }

            // Fallback to Web Vibration API
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            // Silently fail if haptics not available
        }
    }

    // iOS-specific notification haptics (for Capacitor)
    notificationSuccess() {
        if (window.Capacitor?.Plugins?.Haptics) {
            window.Capacitor.Plugins.Haptics.notification({ type: 'Success' });
        } else {
            this.success();
        }
    }

    notificationWarning() {
        if (window.Capacitor?.Plugins?.Haptics) {
            window.Capacitor.Plugins.Haptics.notification({ type: 'Warning' });
        } else {
            this.warning();
        }
    }

    notificationError() {
        if (window.Capacitor?.Plugins?.Haptics) {
            window.Capacitor.Plugins.Haptics.notification({ type: 'Error' });
        } else {
            this.error();
        }
    }
}

// Export
window.HapticManager = HapticManager;
