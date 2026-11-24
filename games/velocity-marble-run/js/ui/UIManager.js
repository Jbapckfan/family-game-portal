/**
 * UIManager - Handles all UI interactions and screen transitions
 */
class UIManager {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'loading';
        this.previousScreen = null;

        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            levels: document.getElementById('levels-screen'),
            worldLevels: document.getElementById('world-levels-screen'),
            daily: document.getElementById('daily-screen'),
            music: document.getElementById('music-screen'),
            scores: document.getElementById('scores-screen'),
            collection: document.getElementById('collection-screen'),
            settings: document.getElementById('settings-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            complete: document.getElementById('complete-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        this.selectedWorld = 1;
        this.menuBgCanvas = document.getElementById('menu-bg-canvas');
        this.menuBgCtx = this.menuBgCanvas?.getContext('2d');
    }

    init() {
        this.game.music?.setVoice?.(Marble.voiceFor(Marble.STYLES[this.game.state.getSelectedMarble()]));
        this.bindEvents();
        this.updateCurrencyDisplay();
        this.startMenuBackground();
    }

    bindEvents() {
        // Main menu buttons
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.requestTiltIfEnabled();
            this.continueGame();
        });

        document.getElementById('btn-levels')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showScreen('levels');
        });

        document.getElementById('btn-collection')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showScreen('collection');
            this.populateCollection();
        });

        document.getElementById('btn-daily')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showDaily();
        });

        document.getElementById('daily-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });

        document.getElementById('btn-music')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showMusic();
        });

        document.getElementById('music-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });

        document.getElementById('challenge-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.openShareSheet();
        });
        document.getElementById('btn-scores')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showScores();
        });
        document.getElementById('scores-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });
        document.getElementById('share-score-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.shareRun(this.game.lastRunEntry, document.getElementById('score-share-status'));
        });
        document.getElementById('share-send')?.addEventListener('click', () => this.sendChallenge());
        document.getElementById('share-close')?.addEventListener('click', () => {
            this.game.audio.play('click');
            document.getElementById('share-sheet')?.classList.add('hidden');
        });

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.showScreen('settings');
        });

        // Back buttons
        document.getElementById('levels-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });

        document.getElementById('world-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('levels');
        });

        document.getElementById('collection-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });

        document.getElementById('settings-back')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('menu');
        });

        // Game controls
        document.getElementById('reset-btn')?.addEventListener('click', () => {
            this.game.resetMarble();
        });

        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.game.pause();
            this.showScreen('pause');
        });

        // Pause screen
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('game');
            this.game.resume();
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.resetMarble();
            this.showScreen('game');
            this.game.resume();
        });

        document.getElementById('quit-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.stop();
            this.showScreen('menu');
        });

        // Level complete screen
        document.getElementById('next-level-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.loadNextLevel();
        });

        document.getElementById('replay-level-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('game');
            this.game.resetMarble();
        });

        // Game over screen
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.showScreen('game');
            this.game.resetMarble();
        });

        document.getElementById('gameover-quit-btn')?.addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.stop();
            this.showScreen('menu');
        });

        // Settings controls
        this.bindSettingsEvents();

        // Collection tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.game.audio.play('click');
                this.populateCollection(e.currentTarget.dataset.tab);
            });
        });
    }

    bindSettingsEvents() {
        const musicSlider = document.getElementById('music-volume');
        const sfxSlider = document.getElementById('sfx-volume');
        const hapticsToggle = document.getElementById('haptics-toggle');
        const particlesToggle = document.getElementById('particles-toggle');
        const shakeToggle = document.getElementById('shake-toggle');
        const fpsToggle = document.getElementById('fps-toggle');
        const qualitySelect = document.getElementById('quality-select');
        const tiltToggle = document.getElementById('tilt-toggle');
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.value = this.game.state.hasPlayerName() ? this.game.state.getPlayerName() : '';
            nameInput.addEventListener('change', (e) => this.game.state.setPlayerName(e.target.value));
        }
        const cameraSelect = document.getElementById('camera-select');
        const horizonToggle = document.getElementById('horizon-toggle');

        if (cameraSelect) {
            cameraSelect.value = this.game.state.getSetting('cameraMode') || 'chase';
            cameraSelect.addEventListener('change', (e) => {
                this.game.state.setSetting('cameraMode', e.target.value);
                this.game.applyCameraSettings();
            });
        }
        if (horizonToggle) {
            horizonToggle.checked = this.game.state.getSetting('povHorizon') !== false;
            horizonToggle.addEventListener('change', (e) => {
                this.game.state.setSetting('povHorizon', e.target.checked);
                this.game.applyCameraSettings();
            });
        }

        if (tiltToggle) {
            tiltToggle.checked = !!this.game.state.getSetting('tilt');
            tiltToggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    const ok = await this.game.enableTilt();
                    e.target.checked = ok;
                    this.game.state.setSetting('tilt', ok);
                } else {
                    this.game.disableTilt();
                    this.game.state.setSetting('tilt', false);
                }
            });
        }

        // Load current settings
        if (musicSlider) {
            musicSlider.value = this.game.state.getSetting('musicVolume') * 100;
            musicSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.game.state.setSetting('musicVolume', value);
                this.game.audio.setMusicVolume(value);
            });
        }

        if (sfxSlider) {
            sfxSlider.value = this.game.state.getSetting('sfxVolume') * 100;
            sfxSlider.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.game.state.setSetting('sfxVolume', value);
                this.game.audio.setSFXVolume(value);
            });
        }

        if (hapticsToggle) {
            hapticsToggle.checked = this.game.state.getSetting('haptics');
            hapticsToggle.addEventListener('change', (e) => {
                this.game.state.setSetting('haptics', e.target.checked);
                this.game.haptics.setEnabled(e.target.checked);
            });
        }

        if (particlesToggle) {
            particlesToggle.checked = this.game.state.getSetting('particles');
            particlesToggle.addEventListener('change', (e) => {
                this.game.state.setSetting('particles', e.target.checked);
                this.game.particles.enabled = e.target.checked;
            });
        }

        const rivalsToggle = document.getElementById('rivals-toggle');
        if (rivalsToggle) {
            rivalsToggle.checked = this.game.state.getSetting('rivals') !== false;
            rivalsToggle.addEventListener('change', (e) => this.game.state.setSetting('rivals', e.target.checked));
        }
        const cineToggle = document.getElementById('cine-toggle');
        if (cineToggle) {
            cineToggle.checked = this.game.state.getSetting('cineCams') !== false;
            cineToggle.addEventListener('change', (e) => this.game.state.setSetting('cineCams', e.target.checked));
        }

        if (shakeToggle) {
            shakeToggle.checked = this.game.state.getSetting('screenShake');
            shakeToggle.addEventListener('change', (e) => {
                this.game.state.setSetting('screenShake', e.target.checked);
            });
        }

        if (fpsToggle) {
            fpsToggle.checked = this.game.state.getSetting('showFps');
            fpsToggle.addEventListener('change', (e) => {
                this.game.state.setSetting('showFps', e.target.checked);
                document.getElementById('fps-counter').classList.toggle('hidden', !e.target.checked);
            });
        }

        if (qualitySelect) {
            qualitySelect.value = this.game.state.getSetting('quality');
            qualitySelect.addEventListener('change', (e) => {
                this.game.state.setSetting('quality', e.target.value);
                this.game.renderer.setQuality(e.target.value);
                this.game.particles.setQuality(e.target.value);
            });
        }
    }

    showScreen(screenName) {
        this.previousScreen = this.currentScreen;
        this.currentScreen = screenName;

        // Overlays (pause/results/fail) keep the live game visible underneath;
        // the menus keep it there too, flying down a chute (attract mode)
        const overlays = ['pause', 'complete', 'gameover'];
        const keepGame = overlays.includes(screenName);
        const attract = UIManager.ATTRACT_SCREENS.includes(screenName);
        Object.entries(this.screens).forEach(([name, element]) => {
            if (element) {
                element.classList.toggle('active', name === screenName || ((keepGame || attract) && name === 'game'));
            }
        });
        this.screens.game?.classList.toggle('attract', attract);
        document.body.classList.toggle('attract', attract);
        if (attract) {
            try { this.game.startAttract(); } catch (e) { console.warn('attract mode', e); }
        } else if (!keepGame && screenName !== 'game') {
            this.game.stopAttract?.();
        }

        // The store's 3D showroom only runs while the store is open
        if (screenName !== 'collection') this.skinPreview?.stop();

        // Screen-specific logic
        if (screenName === 'levels') {
            this.populateWorlds();
        }

        if (screenName === 'menu') {
            this.updateCurrencyDisplay();
        }
    }

    updateCurrencyDisplay() {
        document.getElementById('total-coins').textContent = this.game.state.getCoins();
        document.getElementById('total-gems').textContent = this.game.state.getGems();
        document.getElementById('player-stars').textContent = this.game.state.getTotalStars();
    }

    populateWorlds() {
        const container = document.getElementById('worlds-container');
        if (!container) return;

        container.innerHTML = '';

        WORLDS.forEach(world => {
            const isUnlocked = this.game.state.isWorldUnlocked(world.id);
            const worldStars = this.getWorldStars(world.id);

            const card = document.createElement('div');
            card.className = `world-card ${isUnlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <div class="world-icon ${world.theme}">${world.icon}</div>
                <div class="world-info">
                    <div class="world-name">${world.name}</div>
                    <div class="world-progress">
                        <span class="star">★</span> ${worldStars}/${this.worldLevels(world.id).length * 3}
                        ${!isUnlocked ? `<span class="unlock-req">(Requires ${world.unlockStars} stars)</span>` : ''}
                    </div>
                </div>
                <div class="world-arrow">›</div>
            `;

            if (isUnlocked) {
                card.addEventListener('click', () => {
                    this.game.audio.play('click');
                    this.game.haptics.selection();
                    this.selectedWorld = world.id;
                    this.showWorldLevels(world);
                });
            }

            container.appendChild(card);
        });
    }

    /** The levels of a world, in order (ten per world; eight Grand Prix circuits) */
    worldLevels(worldId) {
        return LEVELS.filter(l => l.worldId === worldId);
    }

    getWorldStars(worldId) {
        let stars = 0;
        for (const lvl of this.worldLevels(worldId)) {
            const levelData = this.game.state.getLevelData(lvl.id);
            stars += levelData.stars || 0;
        }
        return stars;
    }

    showWorldLevels(world) {
        this.showScreen('worldLevels');

        document.getElementById('world-title').textContent = world.name;
        document.getElementById('world-star-count').textContent = this.getWorldStars(world.id);
        const levels = this.worldLevels(world.id);
        const maxEl = document.getElementById('world-star-max');
        if (maxEl) maxEl.textContent = levels.length * 3;

        const grid = document.getElementById('levels-grid');
        if (!grid) return;

        grid.innerHTML = '';
        grid.classList.toggle('named', !!world.open);

        levels.forEach((lvl, k) => {
            const i = k + 1;
            const levelId = lvl.id;
            const levelData = this.game.state.getLevelData(levelId);
            const isUnlocked = this.game.state.isLevelUnlocked(levelId);

            const btn = document.createElement('button');
            btn.className = `level-btn ${isUnlocked ? (levelData.completed ? 'completed' : '') : 'locked'}`;

            if (isUnlocked) {
                // An open world's circuits are picked by name, like a race roster
                const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
                btn.innerHTML = `
                    ${levelData.medal ? `<span class="medal ${levelData.medal}" title="${levelData.medal} medal"></span>` : ''}
                    <span class="level-num">${i}</span>
                    ${world.open ? `<span class="level-name">${esc(lvl.name)}</span><span class="level-sub">${esc(lvl.subtitle || '')}</span>` : ''}
                    <div class="level-stars">
                        ${[0, 1, 2].map(s => `<span class="star ${s < levelData.stars ? 'earned' : ''}">★</span>`).join('')}
                    </div>
                `;

                btn.addEventListener('click', () => {
                    this.game.audio.play('click');
                    this.game.haptics.selection();
                    this.startLevel(levelId);
                });
            }

            grid.appendChild(btn);
        });
    }

    populateCollection(tab = this.storeTab || 'marbles') {
        const content = document.getElementById('collection-content');
        if (!content) return;
        this.storeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        clearTimeout(this.thumbTimer);
        if (tab !== 'skins') this.skinPreview?.stop();

        content.innerHTML = '';
        content.dataset.tab = tab;
        this.updateStoreWallet();

        if (tab === 'marbles') {
            this.renderStore(content);
        } else if (tab === 'skins') {
            this.renderSkins(content);
        } else if (tab === 'upgrades') {
            this.renderUpgrades(content);
        } else if (tab === 'achievements') {
            const achievements = this.game.progression.getAllAchievements();
            achievements.forEach(achievement => {
                const item = document.createElement('div');
                item.className = `collection-item ${achievement.unlocked ? '' : 'locked'}`;
                item.innerHTML = `
                    <div class="item-preview" style="font-size: 2rem;">${achievement.icon}</div>
                    <div class="item-name">${achievement.name}</div>
                `;
                content.appendChild(item);
            });
        }
    }

    /**
     * Marble store: 3D-rendered marbles, buy with coins, unlock with stars or
     * achievements, tap an owned marble to equip it.
     */
    updateStoreWallet() {
        const st = this.game.state;
        const coinsEl = document.getElementById('store-coins');
        if (coinsEl) coinsEl.textContent = st.getCoins().toLocaleString();
        const gemsEl = document.getElementById('store-gems');
        if (gemsEl) gemsEl.textContent = st.getGems().toLocaleString();
    }

    renderStore(content) {
        const game = this.game;
        const selected = game.state.getSelectedMarble();
        const marbles = game.progression.getAllMarbles();

        // Detail panel for the focused marble (last tapped, else the equipped one)
        const focusId = this.storeFocus && Marble.STYLES[this.storeFocus] ? this.storeFocus : selected;
        const fs = Marble.STYLES[focusId] || Marble.STYLES[Marble.DEFAULT];
        const bar = (label, v) => `<div class="stat-row"><span>${label}</span><div class="stat-bar"><i style="width:${Math.round(Math.max(0.06, Math.min(1, v)) * 100)}%"></i></div></div>`;
        const panel = document.createElement('div');
        panel.className = 'store-detail';
        let thumb = '';
        try { thumb = MarbleLooks.thumbnail(game.scene3d.renderer, focusId, fs); } catch (e) { /* no WebGL */ }
        const ab = Marble.ABILITIES[fs.ability];
        panel.innerHTML = `
            <img class="store-detail-thumb" src="${thumb}" alt="">
            <div class="store-detail-info">
                <div class="store-detail-name">${fs.name}</div>
                <div class="store-detail-desc">${fs.description}</div>
                ${bar('SPEED', (fs.mass - 4) / 4)}
                ${bar('GRIP', fs.friction / 0.9)}
                ${bar('BOUNCE', fs.restitution / 0.7)}
                ${bar('SPIN', fs.spin ?? 0.5)}
                ${ab ? `<div class="store-ability" style="--ab-color:${ab.color}"><b>${ab.icon} ${ab.name.toUpperCase()}</b> ${ab.desc} · ${ab.duration}s, ${ab.cooldown}s cooldown</div>` : ''}
                <button class="store-voice" id="store-voice" type="button"><b>&#9835; ${Marble.voiceFor(fs).name.toUpperCase()}</b> plays the music · tap to hear</button>
            </div>`;
        content.appendChild(panel);
        panel.querySelector('#store-voice')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewVoice(fs);
        });

        for (const marble of marbles) {
            const style = marble.style || Marble.STYLES[Marble.DEFAULT];
            const item = document.createElement('div');
            const owned = marble.unlocked;
            item.className = `collection-item store-item ${owned ? 'owned' : 'locked'} ${selected === marble.id ? 'selected' : ''}`;

            const img = document.createElement('img');
            img.className = 'store-thumb';
            img.alt = '';
            try {
                img.src = MarbleLooks.thumbnail(game.scene3d.renderer, marble.id, style);
            } catch (e) {
                img.style.background = `radial-gradient(circle at 30% 30%, ${style.highlightColor}, ${style.baseColor}, ${style.shadowColor})`;
                img.style.borderRadius = '50%';
            }

            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = style.name || marble.id;

            const tag = document.createElement('div');
            tag.className = 'store-tag';
            let action = null;
            if (owned) {
                tag.textContent = selected === marble.id ? 'EQUIPPED' : 'EQUIP';
                tag.classList.add(selected === marble.id ? 'equipped' : 'equip');
                action = () => {
                    game.state.selectMarble(marble.id);
                    game.music?.setVoice?.(Marble.voiceFor(style));
                    game.audio.play('click');
                    game.haptics.selection();
                    this.populateCollection('marbles');
                };
            } else if (marble.type === 'coins') {
                tag.innerHTML = `<span class="coin-dot"></span>${marble.cost.toLocaleString()}`;
                tag.classList.add(marble.canAfford ? 'buy' : 'cant');
                if (this.storeConfirm === marble.id) {
                    item.classList.add('confirm');
                    tag.textContent = 'TAP TO BUY';
                }
                action = () => this.buyMarble(marble, item, tag);
            } else if (marble.type === 'stars') {
                const ready = marble.current >= marble.required;
                tag.textContent = ready ? 'UNLOCK' : `★ ${marble.current}/${marble.required}`;
                tag.classList.add(ready ? 'buy' : 'cant');
                action = () => this.buyMarble(marble, item, tag);
            } else if (marble.type === 'achievement') {
                const ach = Progression.ACHIEVEMENTS[marble.achievementId];
                tag.textContent = marble.achieved ? 'UNLOCK' : (ach ? ach.name : 'Achievement');
                tag.classList.add(marble.achieved ? 'buy' : 'cant');
                action = () => this.buyMarble(marble, item, tag);
            } else if (marble.type === 'daily') {
                tag.textContent = `Day ${marble.requiredDay} reward`;
                tag.classList.add('cant');
            }

            item.append(img, name, tag);
            item.dataset.id = marble.id;
            item.addEventListener('click', () => {
                const changedFocus = this.storeFocus !== marble.id;
                this.storeFocus = marble.id;
                if (action) action();
                else if (changedFocus) this.populateCollection('marbles');
            });
            content.appendChild(item);
        }
    }

    buyMarble(marble, item, tag) {
        const game = this.game;
        // Coins need a confirming second tap so nothing is bought by accident
        if (marble.type === 'coins' && marble.canAfford && this.storeConfirm !== marble.id) {
            this.storeConfirm = marble.id;
            game.haptics.light();
            this.populateCollection('marbles');
            clearTimeout(this.storeConfirmTimer);
            this.storeConfirmTimer = setTimeout(() => {
                if (this.storeConfirm === marble.id) {
                    this.storeConfirm = null;
                    if (this.currentScreen === 'collection') this.populateCollection('marbles');
                }
            }, 3000);
            return;
        }
        this.storeConfirm = null;
        const result = game.progression.purchaseMarble(marble.id);
        if (result.success) {
            game.state.selectMarble(marble.id);
            game.audio.play('star');
            game.haptics.success();
            this.updateCurrencyDisplay?.();
            this.populateCollection('marbles');
            const fresh = document.querySelector('.store-item.selected');
            if (fresh) fresh.classList.add('just-bought');
        } else {
            item.classList.remove('shake');
            void item.offsetWidth;
            item.classList.add('shake');
            game.audio.play('click');
            game.haptics.warning?.();
            if (marble.type === 'coins') {
                const need = marble.cost - game.state.getCoins();
                tag.textContent = `Need ${need.toLocaleString()} more`;
            }
        }
    }

    // ------------------------------------------------------------------
    // Skins: a finish, trail and aura worn on whichever marble is equipped
    // ------------------------------------------------------------------

    /** Price tag markup: coins or gems */
    priceTag(item) {
        return item.gems ? `<span class="gem-dot"></span>${item.gems}` : `<span class="coin-dot"></span>${item.coins.toLocaleString()}`;
    }

    canAfford(item) {
        const st = this.game.state;
        return item.gems ? st.getGems() >= item.gems : st.getCoins() >= item.coins;
    }

    renderSkins(content) {
        const game = this.game, st = game.state;
        const marbleId = Marble.STYLES[st.getSelectedMarble()] ? st.getSelectedMarble() : Marble.DEFAULT;
        const style = Marble.STYLES[marbleId];
        const worn = st.getSkins();
        const f = this.skinFocus && Shop.item(this.skinFocus.slot, this.skinFocus.id) ? this.skinFocus : { slot: 'finish', id: worn.finish };
        const item = Shop.item(f.slot, f.id);
        const owned = st.hasSkin(f.slot, f.id);
        const wearing = worn[f.slot] === f.id;
        const slotNames = { finish: 'FINISH', trail: 'TRAIL', aura: 'AURA' };

        // Showroom: the equipped marble wearing the focused skin with the others it wears
        const panel = document.createElement('div');
        panel.className = 'skin-detail';
        let action;
        if (wearing) action = '<button class="skin-action worn" disabled>WEARING</button>';
        else if (owned) action = '<button class="skin-action equip" id="skin-act">WEAR IT</button>';
        else if (this.skinConfirm === `${f.slot}:${f.id}`) action = `<button class="skin-action confirm" id="skin-act">TAP TO BUY · ${this.priceTag(item)}</button>`;
        else action = `<button class="skin-action buy ${item.gems ? 'gem' : ''} ${this.canAfford(item) ? '' : 'cant'}" id="skin-act">BUY · ${this.priceTag(item)}</button>`;
        panel.innerHTML = `
            <div class="skin-stage"><span class="skin-stage-label">${style.name}</span></div>
            <div class="skin-info">
                <div class="skin-slot">${slotNames[f.slot]}</div>
                <div class="store-detail-name">${item.name}</div>
                <div class="store-detail-desc">${item.desc}</div>
            </div>
            ${action}`;
        content.appendChild(panel);
        try {
            this.skinPreview = this.skinPreview || new SkinPreview();
            panel.querySelector('.skin-stage').prepend(this.skinPreview.canvas);
            this.skinPreview.show(marbleId, style, { ...worn, [f.slot]: f.id });
            this.skinPreview.start();
        } catch (e) {
            panel.querySelector('.skin-stage').classList.add('no-gl');
        }
        panel.querySelector('#skin-act')?.addEventListener('click', () => this.skinAction(f.slot, f.id));

        // The three racks
        const thumbs = [];
        for (const slot of Shop.SLOTS) {
            const head = document.createElement('div');
            head.className = 'store-section';
            head.innerHTML = `<b>${{ finish: 'FINISHES', trail: 'TRAILS', aura: 'AURAS' }[slot]}</b><span>${slot === 'finish' ? `shown on your ${style.name}` : 'on any marble'}</span>`;
            content.appendChild(head);
            for (const [id, it] of Object.entries(Shop.catalog(slot))) {
                const has = st.hasSkin(slot, id);
                const on = worn[slot] === id;
                const tile = document.createElement('div');
                tile.className = `collection-item store-item skin-item ${on ? 'selected' : ''} ${f.slot === slot && f.id === id ? 'focus' : ''} ${has ? 'owned' : 'locked'}`;
                const img = document.createElement('img');
                img.className = 'store-thumb';
                img.alt = '';
                if (slot === 'finish') thumbs.push(() => {
                    try { img.src = MarbleLooks.thumbnail(game.scene3d.renderer, marbleId, style, 160, id); } catch (e) { /* no WebGL */ }
                });
                else img.src = this.skinIcon(slot, id, style);
                const name = document.createElement('div');
                name.className = 'item-name';
                name.textContent = it.name;
                const tag = document.createElement('div');
                tag.className = 'store-tag';
                if (on) { tag.textContent = 'WEARING'; tag.classList.add('equipped'); }
                else if (has) { tag.textContent = 'OWNED'; tag.classList.add('equip'); }
                else { tag.innerHTML = this.priceTag(it); tag.classList.add(this.canAfford(it) ? (it.gems ? 'gem' : 'buy') : 'cant'); }
                tile.append(img, name, tag);
                tile.addEventListener('click', () => {
                    // Tap to try it on; owned skins are worn straight away
                    this.skinFocus = { slot, id };
                    this.skinConfirm = null;
                    game.audio.play('click');
                    game.haptics.selection();
                    if (has && !on) st.equipSkin(slot, id);
                    this.populateCollection('skins');
                });
                content.appendChild(tile);
            }
        }
        // Finish thumbnails are rendered in 3D: draw them a few at a time so the store opens at once
        const next = () => {
            const job = thumbs.shift();
            if (!job) return;
            job();
            this.thumbTimer = setTimeout(next, 0);
        };
        this.thumbTimer = setTimeout(next, 30);
    }

    skinAction(slot, id) {
        const game = this.game, st = game.state;
        const item = Shop.item(slot, id);
        const key = `${slot}:${id}`;
        if (st.hasSkin(slot, id)) {
            st.equipSkin(slot, id);
            game.audio.play('click');
            game.haptics.selection();
            this.populateCollection('skins');
            return;
        }
        if (!this.canAfford(item)) {
            const btn = document.getElementById('skin-act');
            const need = item.gems ? `${item.gems - st.getGems()} more gems` : `${(item.coins - st.getCoins()).toLocaleString()} more coins`;
            if (btn) { btn.textContent = `NEED ${need.toUpperCase()}`; btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); }
            game.audio.play('click');
            game.haptics.warning?.();
            return;
        }
        // A second tap confirms, so nothing is bought by accident
        if (this.skinConfirm !== key) {
            this.skinConfirm = key;
            game.haptics.light();
            this.populateCollection('skins');
            clearTimeout(this.skinConfirmTimer);
            this.skinConfirmTimer = setTimeout(() => {
                if (this.skinConfirm === key) {
                    this.skinConfirm = null;
                    if (this.currentScreen === 'collection' && this.storeTab === 'skins') this.populateCollection('skins');
                }
            }, 3000);
            return;
        }
        this.skinConfirm = null;
        const paid = item.gems ? st.spendGems(item.gems) : st.spendCoins(item.coins);
        if (!paid) return;
        st.unlockSkin(slot, id);
        st.equipSkin(slot, id);
        game.audio.play('star');
        game.haptics.success();
        this.updateCurrencyDisplay?.();
        this.populateCollection('skins');
        document.querySelector('.skin-detail')?.classList.add('just-bought');
    }

    /** Small drawings of the trails and auras for the store racks (cached) */
    skinIcon(slot, id, style) {
        this.iconCache = this.iconCache || new Map();
        const key = `${slot}|${id}|${style.glowColor}|${style.baseColor}`;
        if (this.iconCache.has(key)) return this.iconCache.get(key);
        const S = 152;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const g = c.getContext('2d');
        const glow = style.glowColor || '#8fd3ff';
        const marble = (x, y, r) => {
            const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
            gr.addColorStop(0, style.highlightColor || '#ffffff');
            gr.addColorStop(0.45, style.baseColor || '#888888');
            gr.addColorStop(1, style.shadowColor || '#111111');
            g.fillStyle = gr;
            g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
            // Rim light in the marble's glow and a glossy highlight, so dark stones still read
            g.strokeStyle = glow;
            g.globalAlpha = 0.7;
            g.lineWidth = 2;
            g.beginPath(); g.arc(x, y, r - 1, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
            g.globalAlpha = 1;
            const hl = g.createRadialGradient(x - r * 0.38, y - r * 0.42, 0, x - r * 0.38, y - r * 0.42, r * 0.45);
            hl.addColorStop(0, 'rgba(255,255,255,0.85)');
            hl.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = hl;
            g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        };
        const rnd = (() => { let r = 7; for (const ch of id) r = (r * 31 + ch.charCodeAt(0)) % 2147483647; return () => ((r = (r * 16807) % 2147483647) / 2147483647); })();
        g.lineCap = 'round';
        g.lineJoin = 'round';
        if (slot === 'trail') {
            // The marble at top right, its trail running down to the bottom left
            const hx = 108, hy = 44, tx = 18, ty = 132;
            const along = (t) => [tx + (hx - tx) * t, ty + (hy - ty) * t];
            g.globalCompositeOperation = 'lighter';
            const band = (w0, w1, colorAt, steps = 24) => {
                for (let i = 0; i < steps; i++) {
                    const t0 = i / steps, t1 = (i + 1) / steps;
                    const [x0, y0] = along(t0), [x1, y1] = along(t1);
                    g.strokeStyle = colorAt(t0);
                    g.lineWidth = w0 + (w1 - w0) * t0;
                    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
                }
            };
            const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
            if (id === 'stock') band(1, 10, (t) => rgba(glow, t * t * 0.7));
            else if (id === 'comet') { band(2, 30, (t) => rgba(glow, Math.pow(t, 1.3) * 0.65)); band(1, 12, (t) => `rgba(255,255,255,${Math.max(0, t - 0.6) * 1.6})`); }
            else if (id === 'rainbow') band(6, 26, (t) => `hsla(${(t * 400) % 360},100%,60%,${Math.min(1, t * 2.2) * 0.75})`, 40);
            else if (id === 'inferno') {
                band(2, 22, (t) => `rgba(255,${Math.round(80 + 140 * t)},${Math.round(30 * t)},${t * 0.7})`);
                for (let i = 0; i < 22; i++) { const t = rnd(); const [x, y] = along(t); const r = 3 + rnd() * 8; const gr = g.createRadialGradient(x, y - r, 0, x, y - r, r); gr.addColorStop(0, 'rgba(255,220,120,0.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r * 2, r * 2, r * 2); }
            } else if (id === 'stardust') {
                band(1, 7, (t) => rgba(glow, t * t * 0.5));
                for (let i = 0; i < 26; i++) { const t = rnd(); const [x, y] = along(t); const ox = (rnd() - 0.5) * 34, oy = (rnd() - 0.5) * 34, r = 1.5 + rnd() * 3; g.fillStyle = rnd() < 0.5 ? '#ffffff' : rgba(glow, 1); g.beginPath(); g.moveTo(x + ox, y + oy - r * 2); g.lineTo(x + ox + r * 0.5, y + oy - r * 0.5); g.lineTo(x + ox + r * 2, y + oy); g.lineTo(x + ox + r * 0.5, y + oy + r * 0.5); g.lineTo(x + ox, y + oy + r * 2); g.lineTo(x + ox - r * 0.5, y + oy + r * 0.5); g.lineTo(x + ox - r * 2, y + oy); g.lineTo(x + ox - r * 0.5, y + oy - r * 0.5); g.fill(); }
            } else if (id === 'lightning') {
                for (const [col, w, amp] of [['rgba(170,140,255,0.9)', 2.5, 16], ['rgba(190,235,255,1)', 3, 12]]) {
                    g.strokeStyle = col; g.lineWidth = w; g.shadowColor = col; g.shadowBlur = 8;
                    g.beginPath();
                    for (let i = 0; i <= 10; i++) { const t = i / 10; const [x, y] = along(t); const o = (rnd() - 0.5) * amp * Math.sin(Math.PI * t) * 2; if (i) g.lineTo(x + o, y + o * 0.6); else g.moveTo(x, y); }
                    g.stroke();
                }
                g.shadowBlur = 0;
            } else if (id === 'light') {
                // A lit wall standing under the path
                for (let i = 0; i < 30; i++) {
                    const t0 = i / 30, t1 = (i + 1) / 30;
                    const [x0, y0] = along(t0), [x1, y1] = along(t1);
                    const gr = g.createLinearGradient(0, y0 - 26, 0, y0 + 12);
                    gr.addColorStop(0, rgba(glow, 0.95 * Math.sqrt(t0)));
                    gr.addColorStop(1, rgba(glow, 0.1 * t0));
                    g.fillStyle = gr;
                    g.beginPath(); g.moveTo(x0, y0 + 12); g.lineTo(x1, y1 + 12); g.lineTo(x1, y1 - 26); g.lineTo(x0, y0 - 26); g.fill();
                }
            }
            g.globalCompositeOperation = 'source-over';
            marble(hx, hy, 22);
        } else {
            const cx = 76, cy = 84, r = 30;
            const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
            const glowCol = glow === '#ffffff' || glow === '#aaaaaa' || glow === '#444444' ? '#cfe8ff' : glow;
            const behind = () => {
                if (id === 'flame') {
                    for (let i = 0; i < 5; i++) {
                        const h = 70 - i * 10, w = 34 - i * 5;
                        const gr = g.createRadialGradient(cx, cy - h * 0.25, 2, cx, cy - h * 0.2, h * 0.7);
                        gr.addColorStop(0, `rgba(255,${200 - i * 30},${80 - i * 15},0.55)`);
                        gr.addColorStop(1, 'rgba(255,60,0,0)');
                        g.fillStyle = gr;
                        g.beginPath(); g.ellipse(cx + (i % 2 ? 4 : -4), cy - h * 0.35, w, h * 0.75, 0, 0, Math.PI * 2); g.fill();
                    }
                }
                if (id === 'halo' || id === 'moons') {
                    g.strokeStyle = rgba(glowCol, 0.45);
                    g.lineWidth = id === 'halo' ? 4 : 1.5;
                    g.beginPath(); g.ellipse(cx, cy, r * 1.75, r * 0.55, -0.35, Math.PI, Math.PI * 2); g.stroke();
                }
            };
            const front = () => {
                g.shadowColor = glowCol;
                g.shadowBlur = 10;
                if (id === 'halo') {
                    g.strokeStyle = rgba(glowCol, 1); g.lineWidth = 4;
                    g.beginPath(); g.ellipse(cx, cy, r * 1.75, r * 0.55, -0.35, 0, Math.PI); g.stroke();
                    g.lineWidth = 2; g.strokeStyle = rgba(glowCol, 0.7);
                    g.beginPath(); g.ellipse(cx, cy, r * 1.45, r * 0.9, 0.6, 0, Math.PI * 2); g.stroke();
                } else if (id === 'moons') {
                    for (const [x, y, rr] of [[cx + 50, cy - 18, 8], [cx - 44, cy + 26, 6]]) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); g.fillStyle = rgba(glowCol, 0.5); g.beginPath(); g.arc(x, y, rr * 1.8, 0, Math.PI * 2); g.fill(); }
                } else if (id === 'shell') {
                    g.strokeStyle = rgba(glowCol, 0.95); g.lineWidth = 2;
                    const R = r * 1.6, pts = [];
                    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
                    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
                    g.beginPath(); for (let i = 0; i < 6; i += 2) { g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[(i + 2) % 6][0], pts[(i + 2) % 6][1]); } g.stroke();
                    g.fillStyle = '#ffffff'; pts.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); });
                } else if (id === 'storm') {
                    g.strokeStyle = 'rgba(200,240,255,1)'; g.lineWidth = 2; g.shadowColor = '#8fd3ff';
                    for (let k = 0; k < 4; k++) {
                        const a0 = rnd() * Math.PI * 2, a1 = a0 + 0.8 + rnd();
                        g.beginPath();
                        for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; const rr = r * (1.05 + Math.sin(Math.PI * i / 6) * 0.45) + (rnd() - 0.5) * 6; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
                        g.stroke();
                    }
                } else if (id === 'crown') {
                    for (let i = 0; i < 5; i++) {
                        const a = Math.PI + (i / 4) * Math.PI;
                        const x = cx + Math.cos(a) * 32, y = cy - 50 + Math.sin(a) * 9;
                        g.fillStyle = i % 2 ? '#ffffff' : rgba(glowCol, 1);
                        g.beginPath(); g.moveTo(x, y - 11); g.lineTo(x + 5, y); g.lineTo(x, y + 11); g.lineTo(x - 5, y); g.closePath(); g.fill();
                    }
                }
                g.shadowBlur = 0;
            };
            behind();
            marble(cx, cy, r);
            front();
        }
        const url = c.toDataURL('image/png');
        this.iconCache.set(key, url);
        return url;
    }

    // ------------------------------------------------------------------
    // Upgrades: permanent, bought in tiers
    // ------------------------------------------------------------------

    renderUpgrades(content) {
        const game = this.game, st = game.state;
        const intro = document.createElement('div');
        intro.className = 'store-section upg-intro';
        intro.innerHTML = '<span>Permanent, and for every marble. In the daily chute and friend races, upgrades marked <b class="race-tag">RACE</b> are switched off so times stay fair.</span>';
        content.appendChild(intro);
        for (const [id, u] of Object.entries(Shop.UPGRADES)) {
            const lvl = st.getUpgrade(id);
            const max = u.values.length;
            const cost = Shop.nextCost(id, lvl);
            const now = Shop.value(id, lvl);
            const row = document.createElement('div');
            row.className = `upg-row ${lvl >= max ? 'maxed' : ''}`;
            row.style.setProperty('--upg', u.color);
            const pips = Array.from({ length: max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
            const confirm = this.upgConfirm === id;
            let btn;
            if (cost === null) btn = '<button class="upg-buy max" disabled>MAX</button>';
            else if (confirm) btn = `<button class="upg-buy confirm">TAP TO BUY</button>`;
            else btn = `<button class="upg-buy ${st.getCoins() >= cost ? '' : 'cant'}"><span class="coin-dot"></span>${cost.toLocaleString()}</button>`;
            const nextLine = cost === null ? '' : ` <span class="upg-next">→ ${u.fmt(Shop.value(id, lvl + 1))}</span>`;
            row.innerHTML = `
                <div class="upg-icon">${Shop.icon(id)}</div>
                <div class="upg-info">
                    <div class="upg-name">${u.name}${u.perf ? ' <b class="race-tag">RACE</b>' : ''}</div>
                    <div class="upg-desc">${u.desc}</div>
                    <div class="upg-effect">${u.fmt(now)}${nextLine}</div>
                    <div class="upg-pips">${pips}</div>
                </div>
                ${btn}`;
            row.querySelector('.upg-buy:not([disabled])')?.addEventListener('click', (e) => this.buyUpgrade(id, row, e.currentTarget));
            content.appendChild(row);
        }
    }

    buyUpgrade(id, row, btn) {
        const game = this.game, st = game.state;
        const lvl = st.getUpgrade(id);
        const cost = Shop.nextCost(id, lvl);
        if (cost === null) return;
        if (st.getCoins() < cost) {
            row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
            btn.textContent = `NEED ${(cost - st.getCoins()).toLocaleString()}`;
            game.audio.play('click');
            game.haptics.warning?.();
            return;
        }
        if (this.upgConfirm !== id) {
            this.upgConfirm = id;
            game.haptics.light();
            this.populateCollection('upgrades');
            clearTimeout(this.upgConfirmTimer);
            this.upgConfirmTimer = setTimeout(() => {
                if (this.upgConfirm === id) {
                    this.upgConfirm = null;
                    if (this.currentScreen === 'collection' && this.storeTab === 'upgrades') this.populateCollection('upgrades');
                }
            }, 3000);
            return;
        }
        this.upgConfirm = null;
        if (!st.spendCoins(cost)) return;
        st.setUpgrade(id, lvl + 1);
        game.audio.play('star');
        game.haptics.success();
        this.updateCurrencyDisplay?.();
        this.populateCollection('upgrades');
        const rows = document.querySelectorAll('.upg-row');
        const idx = Object.keys(Shop.UPGRADES).indexOf(id);
        rows[idx]?.classList.add('just-bought');
    }

    continueGame() {
        // Find the first incomplete level
        for (const world of WORLDS) {
            if (!this.game.state.isWorldUnlocked(world.id)) continue;

            for (const lvl of this.worldLevels(world.id)) {
                const levelId = lvl.id;
                if (!this.game.state.isLevelUnlocked(levelId)) continue;

                const levelData = this.game.state.getLevelData(levelId);
                if (!levelData.completed) {
                    this.startLevel(levelId);
                    return;
                }
            }
        }

        // All levels complete, start from 1-1
        this.startLevel('1-1');
    }

    startLevel(levelId) {
        // Show the screen first so the canvas has its real size
        this.showScreen('game');
        if (!this.game.loadLevel(levelId)) {
            this.showScreen('menu');
        }
    }

    /** Motion permission must be requested inside a tap on iOS */
    requestTiltIfEnabled() {
        if (this.game.state.getSetting('tilt') && !this.game.input.tiltEnabled) {
            this.game.enableTilt();
        }
    }

    /** The daily challenge screen: today's seeded chute, your times, the local board */
    /** Hear a marble's instrument over the menu music, then go back to the equipped one */
    previewVoice(style) {
        const music = this.game.music;
        if (!music) return;
        this.game.audio.resume();
        if (!music.playing) this.game.audio.playMusic('menu', 'menu');
        music.setVoice(Marble.voiceFor(style));
        music.previewVoice();
        clearTimeout(this.voiceTimer);
        this.voiceTimer = setTimeout(() => {
            music.setVoice(Marble.voiceFor(Marble.STYLES[this.game.state.getSelectedMarble()]));
        }, 3000);
    }

    /**
     * Challenges: today's seeded chute, and races against friends. `spotlight`
     * is a challenge that just arrived through a link: it goes on top.
     */
    showDaily(spotlight = null) {
        this.showScreen('daily');
        const game = this.game;
        const level = dailyLevel();
        const world = WORLDS.find(w => w.id === level.worldId);
        const lb = game.leaderboards;
        const top = lb.top(level.dateKey);
        const best = lb.best(level.dateKey);
        const attempts = lb.attempts(level.dateKey);
        document.getElementById('daily-date').textContent = level.dateKey;
        const content = document.getElementById('daily-content');
        if (!content) return;
        const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const levelName = (id) => {
            const l = Game.levelFromId(id);
            return l ? (l.daily ? `Daily ${l.dateKey}` : `${/^\d/.test(l.id) ? l.id + ' ' : ''}${l.name}`) : id;
        };
        const marbleName = (id) => (Marble.STYLES[id] || {}).name || id;
        const rows = top.length
            ? top.map((e, i) => `<div class="daily-row"><span class="rank">${i + 1}</span><span class="marble">${esc(marbleName(e.marble))}</span><span class="time">${e.time.toFixed(2)}s</span></div>`).join('')
            : '<div class="daily-empty">No runs yet today. Set the first time.</div>';
        const inbox = game.state.getChallenges();
        const inboxRows = inbox.length ? inbox.map((c, i) => {
            const result = c.best === null ? '<span class="ch-result">to beat</span>'
                : c.best < c.time ? `<span class="ch-result won">beaten ${c.best.toFixed(2)}s</span>` : `<span class="ch-result lost">best ${c.best.toFixed(2)}s</span>`;
            return `<div class="daily-row ch-row"><span class="ch-who"><b>${esc(c.name || 'A friend')}</b><small>${esc(levelName(c.level))} · ${esc(marbleName(c.marble))}</small></span><span class="time">${c.time.toFixed(2)}s</span>${result}<button class="ch-race" data-i="${i}">RACE</button></div>`;
        }).join('') : '<div class="daily-empty">Challenges your friends send you show up here.</div>';
        const spot = spotlight ? `
            <div class="daily-card spotlight-card">
                <div class="spot-eyebrow">NEW CHALLENGE</div>
                <h3>${esc(spotlight.name || 'A friend')} challenges you</h3>
                <p>${esc(levelName(spotlight.level))} in <b>${spotlight.time.toFixed(2)}s</b> with ${esc(marbleName(spotlight.marble))}. Race their ghost on the same chute.</p>
                <button class="menu-btn primary" id="spot-race">RACE ${esc((spotlight.name || 'THEM').toUpperCase())}</button>
            </div>` : '';
        content.innerHTML = `${spot}
            <div class="daily-card">
                <div class="spot-eyebrow">DAILY CHALLENGE</div>
                <h3>${world ? world.icon + ' ' + world.name : 'World ' + level.worldId}</h3>
                <p>One chute for everyone today, seeded by the date. New course tomorrow.</p>
                <div class="daily-stats">
                    <div class="daily-stat"><b>${best !== null ? best.toFixed(2) + 's' : '--'}</b><span>YOUR BEST</span></div>
                    <div class="daily-stat"><b>${attempts}</b><span>RUNS</span></div>
                    <div class="daily-stat"><b>${top.length ? '#' + (top.findIndex(e => e.time === best) + 1) : '--'}</b><span>RANK</span></div>
                </div>
                <button class="menu-btn primary" id="daily-play">PLAY TODAY'S RUN</button>
            </div>
            <div class="daily-board">
                <h4>TODAY'S BOARD (THIS DEVICE)</h4>
                ${rows}
            </div>
            <div class="daily-card friend-card">
                <div class="spot-eyebrow">RACE A FRIEND</div>
                <p>Finish any level and tap <b>Challenge a friend</b> to send your run as a link. Got one? Open it, or paste it here.</p>
                <div class="paste-row">
                    <input type="text" id="paste-code" placeholder="Paste a challenge link or code" autocomplete="off" spellcheck="false">
                    <button class="menu-btn primary" id="paste-go">RACE</button>
                </div>
                <p class="paste-status" id="paste-status" role="status"></p>
            </div>
            <div class="daily-board">
                <h4>CHALLENGES RECEIVED</h4>
                ${inboxRows}
                <div class="daily-note">Times also go to Game Center when the native app includes the Game Center plugin.</div>
            </div>`;
        content.querySelector('#daily-play').addEventListener('click', () => {
            game.audio.play('click');
            game.haptics.selection();
            this.requestTiltIfEnabled();
            game.setRival(null);
            this.startLevel(level);
        });
        content.querySelector('#spot-race')?.addEventListener('click', () => this.startChallenge(spotlight));
        content.querySelector('#paste-go').addEventListener('click', () => {
            const run = Challenge.decode(content.querySelector('#paste-code').value);
            const status = content.querySelector('#paste-status');
            if (!run) {
                status.textContent = 'That is not a challenge link or code. Paste the whole link your friend sent.';
                return;
            }
            if (!this.startChallenge(run)) status.textContent = 'That challenge is for a level this version of the game does not have.';
        });
        content.querySelectorAll('.ch-race').forEach((btn) => btn.addEventListener('click', () => {
            const run = Challenge.decode(inbox[+btn.dataset.i].code);
            if (run) this.startChallenge(run);
        }));
    }

    /** Race a friend's ghost on their level */
    startChallenge(run) {
        const level = run && Game.levelFromId(run.level);
        if (!level) return false;
        this.game.audio.play('click');
        this.game.haptics.selection();
        this.game.state.addChallenge(run);
        this.game.setRival(run);
        this.requestTiltIfEnabled();
        this.startLevel(level);
        return true;
    }

    /**
     * Music Runs: a song becomes a chute. The player's own song is decoded and
     * analysed on the device (BeatMap.analyze); the game's tracks are described
     * exactly from the soundtrack's arrangement.
     */
    showMusic() {
        this.showScreen('music');
        const game = this.game;
        const content = document.getElementById('music-content');
        if (!content) return;
        const fmt = (t) => { const r = Math.round(t); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
        const gradeTag = (key) => {
            const b = game.state.getMusicBest(key);
            return b ? `<span class="grade-tag g-${b.grade}">${b.grade}</span>` : '<span class="grade-tag none">new</span>';
        };
        const row = (id) => {
            const lvl = Game.musicLevel(id);
            const map = lvl.song;
            return `<div class="daily-row track-row"><span class="track-icon">${lvl.icon}</span><span class="ch-who"><b>${lvl.name}</b><small>${lvl.genre ? lvl.genre + ' · ' : ''}${map.bpm} BPM · ${fmt(map.duration)} · ${map.drops.length} drops</small></span>${gradeTag(lvl.runKey)}<button class="ch-race" data-theme="${id}">PLAY</button></div>`;
        };
        const all = Game.musicTracks();
        const tracks = all.filter(id => WORLDS.some(w => w.id === id)).map(row).join('');
        const edm = all.filter(id => !WORLDS.some(w => w.id === id)).map(row).join('');
        content.innerHTML = `
            <div class="daily-card music-card">
                <div class="spot-eyebrow">YOUR MUSIC</div>
                <h3>Turn a song into a run</h3>
                <p>Pick a song and the game builds a chute to it. Cliffs land on the drops, breakdowns float in zero-g, hurdles sit on the beat, and jumping on the beat scores.</p>
                <label class="menu-btn primary file-btn" for="song-file">CHOOSE A SONG</label>
                <input type="file" id="song-file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac" hidden>
                <p class="paste-status" id="song-status" role="status"></p>
                <div id="song-info"></div>
                <p class="daily-note">Songs stay on this device. Use music files you own (MP3, M4A, WAV), for example from the Files app; streaming and copy-protected tracks can't be opened. A run covers up to the first four minutes.</p>
            </div>
            <div class="daily-board">
                <h4>EDM TRACKS</h4>
                ${edm}
            </div>
            <div class="daily-board">
                <h4>WORLD TRACKS</h4>
                ${tracks}
            </div>`;
        content.querySelectorAll('.ch-race[data-theme]').forEach((btn) => btn.addEventListener('click', () => {
            game.audio.play('click');
            game.haptics.selection();
            this.requestTiltIfEnabled();
            game.setRival(null);
            this.startLevel(Game.musicLevel(+btn.dataset.theme));
        }));
        content.querySelector('#song-file').addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) this.analyzeSong(file);
        });
        if (this.songChoice) this.showSongInfo();
    }

    async analyzeSong(file) {
        const status = document.getElementById('song-status');
        const info = document.getElementById('song-info');
        if (info) info.innerHTML = '';
        if (status) status.textContent = `Listening to ${file.name}…`;
        try {
            this.game.audio.resume();
            const ctx = this.game.audio.context;
            if (!ctx) throw new Error('Sound is not available on this device.');
            const bytes = await file.arrayBuffer();
            const audio = await new Promise((resolve, reject) => {
                const p = ctx.decodeAudioData(bytes, resolve, () => reject(new Error('This file could not be read as music. Try an MP3, M4A or WAV you own.')));
                if (p && p.catch) p.catch(() => {});
            });
            await new Promise((r) => setTimeout(r, 30));
            const title = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').slice(0, 40) || 'Your song';
            const map = BeatMap.analyze(audio, title);
            this.songChoice = { map, audio };
            if (status) status.textContent = '';
            this.showSongInfo();
        } catch (e) {
            if (status) status.textContent = e.message || 'This file could not be read as music.';
        }
    }

    showSongInfo() {
        const info = document.getElementById('song-info');
        const choice = this.songChoice;
        if (!info || !choice) return;
        const m = choice.map;
        const fmt = (t) => { const r = Math.round(t); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
        const breaks = m.bars.reduce((n, b, i) => n + (b.kind === 'break' && (i === 0 || m.bars[i - 1].kind !== 'break') ? 1 : 0), 0);
        const lvl = Game.songLevel(m, choice.audio);
        const best = this.game.state.getMusicBest(lvl.runKey);
        const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        info.innerHTML = `
            <div class="song-info">
                <b>${esc(m.title)}</b>
                <div class="song-facts">
                    <span>${Math.round(m.bpm)} BPM</span><span>${fmt(m.duration)}</span><span>${m.drops.length} drop${m.drops.length === 1 ? '' : 's'}</span><span>${breaks} breakdown${breaks === 1 ? '' : 's'}</span>${best ? `<span>best ${best.grade}</span>` : ''}
                </div>
                <button class="menu-btn primary" id="song-play">PLAY THIS SONG</button>
            </div>`;
        info.querySelector('#song-play').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.haptics.selection();
            this.requestTiltIfEnabled();
            this.game.setRival(null);
            this.startLevel(Game.songLevel(choice.map, choice.audio));
        });
    }

    // ------------------------------------------------------------------
    // Scores: bests per level, Music Run grades, recent runs, sharing
    // ------------------------------------------------------------------

    showScores(tab = this.scoresTab || 'bests') {
        this.scoresTab = tab;
        this.showScreen('scores');
        const game = this.game, state = game.state;
        const content = document.getElementById('scores-content');
        if (!content) return;
        const totals = state.getTotals();
        const totalEl = document.getElementById('scores-total');
        if (totalEl) totalEl.textContent = `${totals.score.toLocaleString()} pts`;
        const stars = (n) => `<span class="st">${'★'.repeat(n)}</span><span class="st dim">${'★'.repeat(Math.max(0, 3 - n))}</span>`;
        const fmtT = (t) => `${Number(t).toFixed(2)}s`;
        const levelCount = LEVELS.length;
        const maxStars = levelCount * 3;
        const hours = totals.playTime >= 3600 ? `${(totals.playTime / 3600).toFixed(1)}h` : `${Math.round(totals.playTime / 60)}m`;
        let rows = '';
        if (tab === 'bests') {
            for (const world of WORLDS) {
                const unlocked = state.isWorldUnlocked(world.id);
                const wStars = this.getWorldStars(world.id);
                rows += `<div class="score-world"><span>${world.icon} ${world.name.toUpperCase()}</span><span>★ ${wStars}/${this.worldLevels(world.id).length * 3}</span></div>`;
                if (!unlocked) { rows += `<div class="score-empty">Locked · ${world.unlockStars} stars to open</div>`; continue; }
                for (const lvl of LEVELS.filter(l => l.worldId === world.id)) {
                    const d = state.getLevelData(lvl.id);
                    if (!d.completed) { rows += `<div class="daily-row score-row"><span class="ch-who"><b>${lvl.id} ${lvl.name}</b><small>Not finished yet</small></span></div>`; continue; }
                    const run = { kind: 'level', level: lvl.id, name: lvl.name, world: world.id, score: d.bestScore, time: d.bestTime, stars: d.stars, marble: state.getSelectedMarble(), player: state.hasPlayerName() ? state.getPlayerName() : '' };
                    rows += `<div class="daily-row score-row"><span class="ch-who"><b>${lvl.id} ${lvl.name}</b><small>${stars(d.stars)} · best ${fmtT(d.bestTime)} · ${d.attempts} run${d.attempts === 1 ? '' : 's'}</small></span><span class="score-val">${(d.bestScore || 0).toLocaleString()}</span><button class="score-share" data-run='${this.runAttr(run)}' aria-label="Share ${lvl.name}">⇪</button></div>`;
                }
            }
        } else if (tab === 'music') {
            const songs = Game.musicTracks().map(id => Game.musicLevel(id));
            for (const lvl of songs) {
                const b = state.getMusicBest(lvl.runKey);
                if (!b) { rows += `<div class="daily-row score-row"><span class="track-icon">${lvl.icon}</span><span class="ch-who"><b>${lvl.name}</b><small>Not played yet</small></span></div>`; continue; }
                const run = { kind: 'music', level: lvl.runKey, name: lvl.name, world: lvl.worldId, score: b.score, grade: b.grade, marble: state.getSelectedMarble(), player: state.hasPlayerName() ? state.getPlayerName() : '' };
                rows += `<div class="daily-row score-row"><span class="track-icon">${lvl.icon}</span><span class="ch-who"><b>${lvl.name}</b><small>Grade ${b.grade}</small></span><span class="grade-tag g-${b.grade}">${b.grade}</span><span class="score-val">${b.score.toLocaleString()}</span><button class="score-share" data-run='${this.runAttr(run)}' aria-label="Share ${lvl.name}">⇪</button></div>`;
            }
            // Songs of the player's own, from the history
            const own = {};
            for (const r of state.getRuns()) if (r.kind === 'music' && String(r.level).startsWith('song-') && !own[r.level]) own[r.level] = r;
            for (const r of Object.values(own)) {
                rows += `<div class="daily-row score-row"><span class="track-icon">♪</span><span class="ch-who"><b>${r.name}</b><small>Your song · grade ${r.grade}</small></span><span class="grade-tag g-${r.grade}">${r.grade}</span><span class="score-val">${(r.score || 0).toLocaleString()}</span><button class="score-share" data-run='${this.runAttr(r)}' aria-label="Share ${r.name}">⇪</button></div>`;
            }
            if (!rows) rows = '<div class="score-empty">No Music Runs yet.</div>';
        } else {
            const runs = state.getRuns().slice(0, 40);
            if (!runs.length) rows = '<div class="score-empty">Finish a run and it shows up here.</div>';
            for (const r of runs) {
                const when = new Date(r.t);
                const ago = this.timeAgo(when);
                const what = r.kind === 'music' ? `Music Run · grade ${r.grade}` : r.kind === 'daily' ? 'Daily chute' : r.kind === 'race' ? 'Race' : `Level ${r.level}`;
                const detail = r.kind === 'music' ? `${what} · ${fmtT(r.time)}` : `${what} · ${stars(r.stars || 0)} · ${fmtT(r.time)}`;
                rows += `<div class="daily-row score-row${r.newBest ? ' new-best' : ''}"><span class="ch-who"><b>${r.name}</b><small>${detail} · ${ago}</small></span><span class="score-val">${(r.score || 0).toLocaleString()}${r.newBest ? '<small>best</small>' : ''}</span><button class="score-share" data-run='${this.runAttr(r)}' aria-label="Share ${r.name}">⇪</button></div>`;
            }
        }
        content.innerHTML = `
            <div class="score-totals">
                <div class="score-total"><b>${totals.score.toLocaleString()}</b><span>TOTAL SCORE</span></div>
                <div class="score-total"><b>${totals.stars}/${maxStars}</b><span>STARS</span></div>
                <div class="score-total"><b>${totals.completed}/${levelCount}</b><span>LEVELS</span></div>
                <div class="score-total"><b>${totals.musicScore.toLocaleString()}</b><span>MUSIC RUNS</span></div>
                <div class="score-total"><b>${state.getRuns().length}</b><span>RUNS LOGGED</span></div>
                <div class="score-total"><b>${hours}</b><span>PLAYED</span></div>
            </div>
            <div class="score-tabs">
                ${[['bests', 'BESTS'], ['music', 'MUSIC RUNS'], ['recent', 'RECENT']].map(([k, l]) => `<button class="score-tab${k === tab ? ' active' : ''}" data-tab="${k}">${l}</button>`).join('')}
            </div>
            <p class="share-status" id="scores-status" role="status"></p>
            <div class="daily-board">${rows}</div>`;
        content.querySelectorAll('.score-tab').forEach(b => b.addEventListener('click', () => { game.audio.play('click'); this.showScores(b.dataset.tab); }));
        content.querySelectorAll('.score-share').forEach(b => b.addEventListener('click', () => {
            game.audio.play('click');
            game.haptics.selection();
            let run = null;
            try { run = JSON.parse(b.dataset.run); } catch (e) { run = null; }
            this.shareRun(run, document.getElementById('scores-status'));
        }));
    }

    runAttr(run) {
        return JSON.stringify(run).replace(/'/g, '&#39;');
    }

    timeAgo(date) {
        const s = (Date.now() - date.getTime()) / 1000;
        if (s < 90) return 'just now';
        if (s < 3600) return `${Math.round(s / 60)} min ago`;
        if (s < 86400) return `${Math.round(s / 3600)} h ago`;
        if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
        return date.toLocaleDateString();
    }

    /** Share a run as a score card: the phone's share sheet, or the clipboard */
    async shareRun(run, statusEl) {
        if (!run) return;
        if (statusEl) statusEl.textContent = 'Preparing your score card…';
        const result = await ScoreCard.share(run);
        if (!statusEl) return;
        statusEl.textContent = {
            shared: 'Score shared.',
            copied: 'Score and link copied. Paste them anywhere.',
            saved: 'Score card saved to your downloads. The text is copied too.',
            cancelled: '',
            failed: 'Sharing is not available here.'
        }[result] || '';
    }

    /** Send the run just finished to a friend */
    openShareSheet() {
        const game = this.game;
        const run = game.lastRun;
        if (!run || !game.challengeCode()) return;
        const level = Game.levelFromId(run.level);
        const marble = (Marble.STYLES[run.marble] || {}).name || run.marble;
        const sheet = document.getElementById('share-sheet');
        document.getElementById('share-title').textContent = game.rival ? 'SEND IT BACK' : 'CHALLENGE A FRIEND';
        document.getElementById('share-text').textContent =
            `${level ? level.name : run.level} in ${run.time.toFixed(2)}s with ${marble}. They race your ghost on the same chute.`;
        const nameEl = document.getElementById('share-name');
        nameEl.value = game.state.hasPlayerName() ? game.state.getPlayerName() : '';
        document.getElementById('share-status').textContent = '';
        const link = document.getElementById('share-link');
        link.classList.add('hidden');
        link.value = '';
        sheet.classList.remove('hidden');
    }

    async sendChallenge() {
        const game = this.game;
        const nameEl = document.getElementById('share-name');
        if (nameEl.value.trim()) game.state.setPlayerName(nameEl.value);
        const code = game.challengeCode();
        const run = game.lastRun;
        if (!code || !run) return;
        const level = Game.levelFromId(run.level);
        const who = game.state.getPlayerName();
        const text = `${who} challenges you to ${level ? level.name : run.level} in Velocity Marble Run: ${run.time.toFixed(2)}s. Beat it:`;
        const status = document.getElementById('share-status');
        const linkEl = document.getElementById('share-link');
        const url = Challenge.link(code);
        const result = await Challenge.share(code, 'Velocity Marble Run challenge', text);
        if (result === 'shared') status.textContent = 'Challenge sent.';
        else if (result === 'cancelled') status.textContent = '';
        else {
            status.textContent = result === 'copied' ? 'Link copied. Paste it into a message to your friend.' : 'Copy this link and send it to your friend:';
            linkEl.value = url;
            linkEl.classList.remove('hidden');
            linkEl.focus();
            linkEl.select();
        }
    }

    loadNextLevel() {
        const id = String(this.game.currentLevelId);
        if (this.game.run) {
            this.showMusic();
            return;
        }
        if (id.startsWith('daily') || this.game.rival) {
            this.showDaily();
            return;
        }
        const [worldId, levelNum] = this.game.currentLevelId.split('-').map(Number);
        let nextLevelId;

        if (levelNum < 10) {
            nextLevelId = `${worldId}-${levelNum + 1}`;
        } else if (worldId < 5) {
            nextLevelId = `${worldId + 1}-1`;
        } else {
            // All levels complete
            this.showScreen('menu');
            return;
        }

        if (this.game.state.isLevelUnlocked(nextLevelId)) {
            this.startLevel(nextLevelId);
        } else {
            this.showScreen('menu');
        }
    }

    showLevelComplete(data) {
        this.showScreen('complete');
        const music = data.music;
        document.getElementById('music-results')?.classList.toggle('hidden', !music);
        document.getElementById('score-breakdown')?.classList.toggle('hidden', !!music);
        document.getElementById('stars-earned')?.classList.toggle('hidden', !!music);
        document.getElementById('challenge-btn')?.classList.toggle('hidden', !data.canChallenge);
        const challengeBtn = document.getElementById('challenge-btn');
        if (challengeBtn) challengeBtn.textContent = data.rival ? `SEND IT BACK TO ${data.rival.name.toUpperCase()}` : 'CHALLENGE A FRIEND';
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.textContent = music ? 'MORE MUSIC' : data.rival || data.daily ? 'CHALLENGES' : 'NEXT LEVEL';
        const reward = document.querySelector('#rewards .coins .reward-value');
        if (reward) reward.textContent = `+${data.coinReward}${data.lucky > 1 ? `  ×${data.lucky}` : ''}`;
        const gemEl = document.getElementById('gem-reward');
        if (gemEl) {
            gemEl.classList.toggle('hidden', !data.gemReward);
            gemEl.querySelector('.reward-value').textContent = `+${data.gemReward || 0}`;
        }

        // The race: the medal won, or the position and the gap to the next medal
        const medalEl = document.getElementById('medal-result');
        if (medalEl) {
            const race = data.race;
            medalEl.classList.toggle('hidden', !race);
            if (race) {
                const beaten = race.racers.filter(r => r.beaten).map(r => r.name).join(', ');
                const next = race.racers.filter(r => !r.beaten).pop();
                medalEl.className = `medal-result ${race.medal || 'none'}`;
                medalEl.innerHTML = race.medal
                    ? `<span class="medal ${race.medal}"></span><b>${race.medal.toUpperCase()} MEDAL · P${race.pos} of ${race.of}</b><span>Beat ${beaten}${next ? ` · ${next.name} ${next.time.toFixed(2)}s for ${next.medal}` : ' · every racer beaten'}</span>`
                    : `<b>P${race.pos} of ${race.of}</b><span>${next ? `${next.name} ran ${next.time.toFixed(2)}s · beat it for ${next.medal}` : ''}</span>`;
            }
        }

        // Against a friend: who won, and by how much
        const rivalEl = document.getElementById('rival-result');
        if (rivalEl) {
            rivalEl.classList.toggle('hidden', !data.rival);
            if (data.rival) {
                const r = data.rival;
                const gap = Math.abs(r.yourTime - r.theirTime).toFixed(2);
                rivalEl.className = `rival-result ${r.won ? 'won' : 'lost'}`;
                rivalEl.innerHTML = `<b>${r.won ? `You beat ${r.name} by ${gap}s` : `${r.name} wins by ${gap}s`}</b><span>${r.name} ${r.theirTime.toFixed(2)}s · you ${r.yourTime.toFixed(2)}s</span>`;
            }
        }

        if (music) {
            const g = document.getElementById('music-grade');
            g.textContent = music.grade;
            g.className = `music-grade g-${music.grade}`;
            document.getElementById('music-title').textContent = `${music.title} · ${Math.round(music.bpm)} BPM`;
            document.getElementById('music-coins').textContent = `${music.coins}/${music.coinsTotal}`;
            document.getElementById('music-beats').textContent = `${music.onBeat}/${music.jumps}`;
            document.getElementById('music-rewinds').textContent = music.restarts;
            this.countUp(document.getElementById('music-score'), music.score);
            document.getElementById('music-best').textContent = music.isBest ? 'New best for this song' : `Best ${music.best.toLocaleString()}`;
            return;
        }

        // Animate stars
        const starsContainer = document.getElementById('stars-earned');
        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, i) => {
            star.classList.remove('earned');
            if (i < data.stars) {
                setTimeout(() => {
                    star.classList.add('earned');
                    this.game.audio.play('star');
                    this.game.haptics.medium();
                }, 300 + i * 300);
            }
        });

        // Update score breakdown
        document.getElementById('time-bonus-value').textContent = `+${data.score.timeBonus} (${data.time.toFixed(2)}s)`;
        document.getElementById('coins-value').textContent = data.coins;
        document.getElementById('trick-score').textContent = `+${(data.score.trickScore || 0).toLocaleString()}`;
        document.getElementById('best-combo').textContent = data.bestCombo || 0;
        const attemptsEl = document.getElementById('attempts-value');
        if (attemptsEl) attemptsEl.textContent = data.attempts || 1;
        if (data.bestDelta !== null && data.bestDelta !== undefined) {
            const d = data.bestDelta;
            document.getElementById('time-bonus-value').textContent =
                `+${data.score.timeBonus} (${data.time.toFixed(2)}s, ${d <= -0.005 ? 'best -' + Math.abs(d).toFixed(2) : '+' + Math.max(0, d).toFixed(2)})`;
        }
        document.getElementById('perfect-bonus').textContent = `+${data.score.perfectBonus}`;
        this.countUp(document.getElementById('total-score-value'), data.score.total);
    }

    countUp(el, target) {
        if (!el) return;
        const start = performance.now();
        const duration = 900;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString();
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    showGameOver(data) {
        this.showScreen('gameover');
        document.getElementById('failure-reason').textContent = data.reason;
    }

    setLoadingProgress(progress, text) {
        const progressBar = document.getElementById('load-progress');
        const loadText = document.getElementById('load-text');

        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        if (loadText && text) {
            loadText.textContent = text;
        }
    }

    startMenuBackground() {
        if (!this.menuBgCanvas || !this.menuBgCtx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0;
        let h = 0;
        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            this.menuBgCanvas.width = w * dpr;
            this.menuBgCanvas.height = h * dpr;
            this.menuBgCanvas.style.width = `${w}px`;
            this.menuBgCanvas.style.height = `${h}px`;
        };
        resize();
        window.addEventListener('resize', resize);

        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random(),
                y: Math.random(),
                r: Math.random() * 2 + 0.6,
                speed: 0.02 + Math.random() * 0.05,
                hue: Math.random() < 0.5 ? '139, 92, 246' : '34, 211, 238'
            });
        }

        let last = performance.now();
        const animate = (now) => {
            requestAnimationFrame(animate);
            if (this.currentScreen !== 'menu' && this.currentScreen !== 'levels' &&
                this.currentScreen !== 'worldLevels' && this.currentScreen !== 'settings' &&
                this.currentScreen !== 'collection') {
                return;
            }
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            const pulse = this.game.music ? this.game.music.getPulse() : 0;

            const ctx = this.menuBgCtx;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, '#05030f');
            gradient.addColorStop(1, '#1a0b3a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Neon horizon grid that pumps with the kick
            ctx.globalCompositeOperation = 'lighter';
            const horizon = h * 0.62;
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.18 + pulse * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const scroll = (now / 1000 * 0.35) % 1;
            for (let i = 0; i < 14; i++) {
                const t = (i + scroll) / 14;
                const y = horizon + Math.pow(t, 2.2) * (h - horizon);
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }
            for (let i = -10; i <= 10; i++) {
                ctx.moveTo(w / 2 + i * 12, horizon);
                ctx.lineTo(w / 2 + i * w * 0.18, h);
            }
            ctx.stroke();

            const glow = ctx.createRadialGradient(w / 2, horizon, 0, w / 2, horizon, w * 0.8);
            glow.addColorStop(0, `rgba(236, 72, 153, ${0.22 + pulse * 0.25})`);
            glow.addColorStop(1, 'rgba(236, 72, 153, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);

            for (const p of particles) {
                p.y -= p.speed * dt;
                if (p.y < -0.02) {
                    p.y = 1.02;
                    p.x = Math.random();
                }
                ctx.fillStyle = `rgba(${p.hue}, ${0.35 + pulse * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.r * (1 + pulse * 0.6), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        };

        requestAnimationFrame(animate);
    }
}

// Export
window.UIManager = UIManager;

/** Screens with the attract-mode flight running behind them */
UIManager.ATTRACT_SCREENS = ['menu', 'levels', 'worldLevels', 'daily', 'music', 'scores', 'settings'];
