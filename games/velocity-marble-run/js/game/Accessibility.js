/**
 * Accessibility - Accessibility features for inclusive gameplay
 * Colorblind modes, reduced motion, screen reader support, etc.
 */

class Accessibility {
    constructor(game) {
        this.game = game;

        // Settings
        this.settings = this.loadSettings();

        // Defaults
        this.defaults = {
            colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia, achromatopsia
            reducedMotion: false,
            largeText: false,
            highContrast: false,
            screenShake: true,
            hapticFeedback: true,
            soundEffects: true,
            subtitles: false,
            slowMode: false,
            autoPlay: false,
            buttonSize: 'normal', // small, normal, large
            touchSensitivity: 1.0
        };

        // Fill missing settings with defaults
        this.settings = { ...this.defaults, ...this.settings };

        this.init();
    }

    init() {
        // Check system preferences
        this.checkSystemPreferences();

        // Apply current settings
        this.applySettings();

        // Create settings UI
        this.createSettingsPanel();
    }

    checkSystemPreferences() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.settings.reducedMotion = true;
        }

        // Check for high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.settings.highContrast = true;
        }

        // Check for color scheme preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Already dark by default
        }
    }

    applySettings() {
        this.applyColorblindMode();
        this.applyReducedMotion();
        this.applyLargeText();
        this.applyHighContrast();
        this.applyButtonSize();
    }

    // Colorblind modes
    applyColorblindMode() {
        const root = document.documentElement;

        // Remove existing filter
        root.style.removeProperty('--cb-filter');

        const filters = {
            protanopia: 'url(#protanopia-filter)',
            deuteranopia: 'url(#deuteranopia-filter)',
            tritanopia: 'url(#tritanopia-filter)',
            achromatopsia: 'grayscale(100%)'
        };

        if (this.settings.colorblindMode !== 'none') {
            // Add SVG filters if needed
            this.ensureColorblindFilters();

            const filter = filters[this.settings.colorblindMode];
            if (filter) {
                root.style.setProperty('--cb-filter', filter);
            }
        }

        // Apply to game canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            if (this.settings.colorblindMode === 'achromatopsia') {
                canvas.style.filter = 'grayscale(100%)';
            } else if (this.settings.colorblindMode !== 'none') {
                canvas.style.filter = filters[this.settings.colorblindMode];
            } else {
                canvas.style.filter = 'none';
            }
        }
    }

    ensureColorblindFilters() {
        if (document.getElementById('colorblind-filters')) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'colorblind-filters';
        svg.style.cssText = 'position: absolute; width: 0; height: 0;';
        svg.innerHTML = `
            <defs>
                <filter id="protanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.567, 0.433, 0, 0, 0
                        0.558, 0.442, 0, 0, 0
                        0, 0.242, 0.758, 0, 0
                        0, 0, 0, 1, 0
                    "/>
                </filter>
                <filter id="deuteranopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.625, 0.375, 0, 0, 0
                        0.7, 0.3, 0, 0, 0
                        0, 0.3, 0.7, 0, 0
                        0, 0, 0, 1, 0
                    "/>
                </filter>
                <filter id="tritanopia-filter">
                    <feColorMatrix type="matrix" values="
                        0.95, 0.05, 0, 0, 0
                        0, 0.433, 0.567, 0, 0
                        0, 0.475, 0.525, 0, 0
                        0, 0, 0, 1, 0
                    "/>
                </filter>
            </defs>
        `;
        document.body.appendChild(svg);
    }

    // Reduced motion
    applyReducedMotion() {
        document.documentElement.classList.toggle('reduced-motion', this.settings.reducedMotion);

        if (!document.getElementById('reduced-motion-styles')) {
            const style = document.createElement('style');
            style.id = 'reduced-motion-styles';
            style.textContent = `
                .reduced-motion * {
                    animation-duration: 0.001ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.001ms !important;
                }

                .reduced-motion .particles,
                .reduced-motion .speed-lines,
                .reduced-motion .screen-shake {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Large text
    applyLargeText() {
        document.documentElement.classList.toggle('large-text', this.settings.largeText);

        if (!document.getElementById('large-text-styles')) {
            const style = document.createElement('style');
            style.id = 'large-text-styles';
            style.textContent = `
                .large-text {
                    font-size: 120% !important;
                }

                .large-text button,
                .large-text .btn,
                .large-text label,
                .large-text p,
                .large-text span {
                    font-size: 1.2em !important;
                }

                .large-text h1 { font-size: 2.5em !important; }
                .large-text h2 { font-size: 2em !important; }
                .large-text h3 { font-size: 1.75em !important; }
            `;
            document.head.appendChild(style);
        }
    }

    // High contrast
    applyHighContrast() {
        document.documentElement.classList.toggle('high-contrast', this.settings.highContrast);

        if (!document.getElementById('high-contrast-styles')) {
            const style = document.createElement('style');
            style.id = 'high-contrast-styles';
            style.textContent = `
                .high-contrast {
                    --bg-primary: #000000 !important;
                    --bg-secondary: #1a1a1a !important;
                    --text-primary: #ffffff !important;
                    --text-secondary: #e0e0e0 !important;
                    --accent: #ffff00 !important;
                }

                .high-contrast button,
                .high-contrast .btn {
                    border: 2px solid #ffffff !important;
                }

                .high-contrast a {
                    color: #ffff00 !important;
                    text-decoration: underline !important;
                }

                .high-contrast *:focus {
                    outline: 3px solid #ffff00 !important;
                    outline-offset: 2px !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Button size
    applyButtonSize() {
        const sizes = {
            small: 0.8,
            normal: 1,
            large: 1.3
        };

        const scale = sizes[this.settings.buttonSize] || 1;
        document.documentElement.style.setProperty('--button-scale', scale);

        if (!document.getElementById('button-size-styles')) {
            const style = document.createElement('style');
            style.id = 'button-size-styles';
            style.textContent = `
                button, .btn, .game-button {
                    transform: scale(var(--button-scale, 1));
                }

                .touch-target {
                    min-width: calc(44px * var(--button-scale, 1));
                    min-height: calc(44px * var(--button-scale, 1));
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Settings panel UI
    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.innerHTML = `
            <div class="a11y-content">
                <h2>Accessibility Settings</h2>

                <div class="a11y-section">
                    <h3>Vision</h3>

                    <div class="a11y-option">
                        <label for="colorblind-mode">Color Vision</label>
                        <select id="colorblind-mode">
                            <option value="none">Normal</option>
                            <option value="protanopia">Protanopia (Red-blind)</option>
                            <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                            <option value="tritanopia">Tritanopia (Blue-blind)</option>
                            <option value="achromatopsia">Grayscale</option>
                        </select>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="high-contrast">
                            High Contrast Mode
                        </label>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="large-text">
                            Large Text
                        </label>
                    </div>
                </div>

                <div class="a11y-section">
                    <h3>Motion & Effects</h3>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="reduced-motion">
                            Reduce Motion
                        </label>
                        <p class="a11y-hint">Disables animations and particle effects</p>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="screen-shake">
                            Screen Shake
                        </label>
                    </div>
                </div>

                <div class="a11y-section">
                    <h3>Controls</h3>

                    <div class="a11y-option">
                        <label for="button-size">Button Size</label>
                        <select id="button-size">
                            <option value="small">Small</option>
                            <option value="normal">Normal</option>
                            <option value="large">Large</option>
                        </select>
                    </div>

                    <div class="a11y-option">
                        <label for="touch-sensitivity">Touch Sensitivity</label>
                        <input type="range" id="touch-sensitivity" min="0.5" max="2" step="0.1" value="1">
                        <span class="a11y-value" id="sensitivity-value">1.0x</span>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="slow-mode">
                            Slow Mode (0.5x speed)
                        </label>
                        <p class="a11y-hint">Makes the game easier with slower movement</p>
                    </div>
                </div>

                <div class="a11y-section">
                    <h3>Audio & Feedback</h3>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="haptic-feedback">
                            Haptic Feedback
                        </label>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="sound-effects">
                            Sound Effects
                        </label>
                    </div>

                    <div class="a11y-option">
                        <label>
                            <input type="checkbox" id="subtitles">
                            Subtitles
                        </label>
                    </div>
                </div>

                <button class="a11y-close" id="a11y-close">Close</button>
            </div>
        `;

        this.addPanelStyles();
        document.body.appendChild(panel);
        this.panel = panel;

        this.bindPanelEvents();
        this.updatePanelValues();
    }

    addPanelStyles() {
        if (document.getElementById('a11y-panel-styles')) return;

        const style = document.createElement('style');
        style.id = 'a11y-panel-styles';
        style.textContent = `
            #accessibility-panel {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 100002;
                overflow-y: auto;
            }

            #accessibility-panel.visible {
                display: block;
            }

            .a11y-content {
                max-width: 500px;
                margin: 40px auto;
                padding: 24px;
                background: #1e1b4b;
                border-radius: 16px;
            }

            .a11y-content h2 {
                color: #fff;
                text-align: center;
                margin: 0 0 24px 0;
            }

            .a11y-section {
                margin-bottom: 24px;
                padding-bottom: 24px;
                border-bottom: 1px solid #374151;
            }

            .a11y-section h3 {
                color: #a5b4fc;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 16px 0;
            }

            .a11y-option {
                margin-bottom: 16px;
            }

            .a11y-option label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
                font-size: 16px;
                cursor: pointer;
            }

            .a11y-option select {
                width: 100%;
                padding: 10px;
                background: #0f172a;
                border: 1px solid #475569;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                margin-top: 8px;
            }

            .a11y-option input[type="range"] {
                width: 100%;
                margin-top: 8px;
            }

            .a11y-option input[type="checkbox"] {
                width: 20px;
                height: 20px;
                accent-color: #6366f1;
            }

            .a11y-hint {
                color: #64748b;
                font-size: 12px;
                margin: 4px 0 0 28px;
            }

            .a11y-value {
                color: #4ade80;
                font-size: 14px;
                margin-left: 8px;
            }

            .a11y-close {
                display: block;
                width: 100%;
                padding: 14px;
                background: #6366f1;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 24px;
            }

            .a11y-close:hover {
                background: #4f46e5;
            }
        `;
        document.head.appendChild(style);
    }

    bindPanelEvents() {
        // Close button
        this.panel.querySelector('#a11y-close').addEventListener('click', () => this.hide());

        // Colorblind mode
        this.panel.querySelector('#colorblind-mode').addEventListener('change', (e) => {
            this.setSetting('colorblindMode', e.target.value);
        });

        // Checkboxes
        const checkboxes = ['high-contrast', 'large-text', 'reduced-motion', 'screen-shake',
                           'haptic-feedback', 'sound-effects', 'subtitles', 'slow-mode'];

        checkboxes.forEach(id => {
            this.panel.querySelector(`#${id}`).addEventListener('change', (e) => {
                const settingName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.setSetting(settingName, e.target.checked);
            });
        });

        // Button size
        this.panel.querySelector('#button-size').addEventListener('change', (e) => {
            this.setSetting('buttonSize', e.target.value);
        });

        // Touch sensitivity
        this.panel.querySelector('#touch-sensitivity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.panel.querySelector('#sensitivity-value').textContent = value.toFixed(1) + 'x';
            this.setSetting('touchSensitivity', value);
        });
    }

    updatePanelValues() {
        this.panel.querySelector('#colorblind-mode').value = this.settings.colorblindMode;
        this.panel.querySelector('#high-contrast').checked = this.settings.highContrast;
        this.panel.querySelector('#large-text').checked = this.settings.largeText;
        this.panel.querySelector('#reduced-motion').checked = this.settings.reducedMotion;
        this.panel.querySelector('#screen-shake').checked = this.settings.screenShake;
        this.panel.querySelector('#haptic-feedback').checked = this.settings.hapticFeedback;
        this.panel.querySelector('#sound-effects').checked = this.settings.soundEffects;
        this.panel.querySelector('#subtitles').checked = this.settings.subtitles;
        this.panel.querySelector('#slow-mode').checked = this.settings.slowMode;
        this.panel.querySelector('#button-size').value = this.settings.buttonSize;
        this.panel.querySelector('#touch-sensitivity').value = this.settings.touchSensitivity;
        this.panel.querySelector('#sensitivity-value').textContent = this.settings.touchSensitivity.toFixed(1) + 'x';
    }

    // Public methods
    show() {
        this.updatePanelValues();
        this.panel.classList.add('visible');
    }

    hide() {
        this.panel.classList.remove('visible');
    }

    toggle() {
        if (this.panel.classList.contains('visible')) {
            this.hide();
        } else {
            this.show();
        }
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();

        // Notify game of changes
        window.dispatchEvent(new CustomEvent('accessibilityChanged', {
            detail: { key, value, settings: this.settings }
        }));
    }

    getSetting(key) {
        return this.settings[key];
    }

    getAllSettings() {
        return { ...this.settings };
    }

    // Game integration helpers
    shouldReduceMotion() {
        return this.settings.reducedMotion;
    }

    shouldShakeScreen() {
        return this.settings.screenShake && !this.settings.reducedMotion;
    }

    shouldPlayHaptics() {
        return this.settings.hapticFeedback;
    }

    shouldPlaySounds() {
        return this.settings.soundEffects;
    }

    getSpeedMultiplier() {
        return this.settings.slowMode ? 0.5 : 1.0;
    }

    getTouchSensitivity() {
        return this.settings.touchSensitivity;
    }

    // Storage
    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('velocity_accessibility') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveSettings() {
        localStorage.setItem('velocity_accessibility', JSON.stringify(this.settings));
    }

    resetToDefaults() {
        this.settings = { ...this.defaults };
        this.saveSettings();
        this.applySettings();
        this.updatePanelValues();
    }
}

// Export
window.Accessibility = Accessibility;
