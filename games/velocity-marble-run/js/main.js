/**
 * Main Entry Point - Velocity Marble Run
 * Initializes all game systems and starts the app
 */

// Global game instance
let game = null;
let ui = null;

// Asset loading progress
const loadingSteps = [
    { name: 'Initializing engine...', weight: 0.2 },
    { name: 'Loading audio...', weight: 0.3 },
    { name: 'Preparing levels...', weight: 0.2 },
    { name: 'Setting up UI...', weight: 0.2 },
    { name: 'Ready!', weight: 0.1 }
];

async function init() {
    try {
        // Prevent context menu on long press
        document.addEventListener('contextmenu', e => e.preventDefault());

        // Prevent pull-to-refresh on iOS
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('#game-canvas')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Initialize game
        updateLoading(0, loadingSteps[0].name);
        game = new Game();

        // Initialize audio (requires user interaction on iOS)
        updateLoading(0.2, loadingSteps[1].name);
        await game.init();

        // Levels are already loaded via LevelData.js
        updateLoading(0.5, loadingSteps[2].name);
        await delay(100); // Small delay for visual feedback

        // Initialize UI
        updateLoading(0.7, loadingSteps[3].name);
        ui = new UIManager(game);
        ui.init();

        // Set up game callbacks
        game.onLevelComplete = (data) => ui.showLevelComplete(data);
        game.onLevelFail = (data) => ui.showGameOver(data);

        // Check for daily reward
        checkDailyReward();

        // Finish loading
        updateLoading(0.9, loadingSteps[4].name);
        await delay(500);

        updateLoading(1, 'Starting...');
        await delay(300);

        // A challenge link opens straight onto the challenge; anything else onto the menu
        const openChallengeFromLink = () => {
            const run = Challenge.decode(location.hash);
            if (!run || !Game.levelFromId(run.level)) return false;
            game.state.addChallenge(run);
            ui.showDaily(run);
            try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sandboxed frame */ }
            return true;
        };
        window.addEventListener('hashchange', () => {
            if (game.phase === 'idle' || game.phase === 'complete') openChallengeFromLink();
        });
        if (!openChallengeFromLink()) ui.showScreen('menu');

        // Browsers only allow audio after a user gesture: start the menu track on the first one
        const startAudio = () => {
            game.audio.resume();
            if (game.music && !game.music.playing && game.phase === 'idle') {
                game.audio.playMusic('menu', 'menu');
            }
        };
        document.addEventListener('pointerdown', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });

        console.log('Velocity Marble Run initialized successfully!');

    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to load game. Please refresh the page.');
    }
}

function updateLoading(progress, text) {
    const progressBar = document.getElementById('load-progress');
    const loadText = document.getElementById('load-text');

    if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
    }
    if (loadText) {
        loadText.textContent = text;
    }
}

function showError(message) {
    const loadText = document.getElementById('load-text');
    if (loadText) {
        loadText.textContent = message;
        loadText.style.color = '#ef4444';
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDailyReward() {
    if (game.state.canClaimDaily()) {
        showDailyRewardPopup();
    }
}

function showDailyRewardPopup() {
    const popup = document.getElementById('daily-popup');
    const rewardsContainer = document.getElementById('daily-rewards');
    const claimBtn = document.getElementById('claim-daily');

    if (!popup || !rewardsContainer) return;

    const streak = game.state.getDailyStreak();
    const rewards = [
        { day: 1, icon: '🪙', amount: 50 },
        { day: 2, icon: '🪙', amount: 75 },
        { day: 3, icon: '🪙', amount: 100 },
        { day: 4, icon: '💎', amount: 1 },
        { day: 5, icon: '💎', amount: 2 },
        { day: 6, icon: '💎', amount: 3 },
        { day: 7, icon: '🌈', amount: 1 }
    ];

    rewardsContainer.innerHTML = rewards.map((r, i) => `
        <div class="daily-reward ${i < streak ? 'claimed' : ''} ${i === streak ? 'current' : ''}">
            <div class="day">Day ${r.day}</div>
            <div class="reward-icon">${r.icon}</div>
            <div class="amount">${r.amount}</div>
        </div>
    `).join('');

    popup.classList.remove('hidden');

    claimBtn.onclick = () => {
        const result = game.state.claimDaily();
        if (result) {
            game.audio.play('coin');
            game.haptics.success();

            // Check achievements
            game.progression.checkAchievements('daily_claim', { streak: result.day });

            ui.updateCurrencyDisplay();
        }

        popup.classList.add('hidden');
    };
}

// Handle visibility change (pause when app goes to background)
document.addEventListener('visibilitychange', () => {
    if (!game) return;
    if (document.hidden) {
        if (game.phase === 'playing' && !game.isPaused) {
            game.pause();
            if (ui) ui.showScreen('pause');
        }
        // Don't keep the soundtrack running in the background
        game.audio.context?.suspend();
    } else {
        game.audio.context?.resume();
    }
});

// Handle back button on Android
window.addEventListener('popstate', (e) => {
    if (ui && ui.currentScreen !== 'menu') {
        e.preventDefault();
        if (ui.currentScreen === 'game' && game.phase === 'playing') {
            game.pause();
            ui.showScreen('pause');
        } else if (ui.currentScreen === 'pause') {
            game.stop();
            ui.showScreen('menu');
        } else {
            ui.showScreen('menu');
        }
        try { history.pushState(null, '', ''); } catch (e) { /* sandboxed frame */ }
    }
});

// Push initial state for back button handling (not allowed in some embedded frames)
try { history.pushState(null, '', ''); } catch (e) { /* sandboxed frame */ }

// Handle resize
window.addEventListener('resize', () => {
    if (game && game.renderer) {
        game.renderer.resize();
    }
});

// Prevent iOS bounce scrolling
document.body.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.scrollable')) {
        e.preventDefault();
    }
}, { passive: false });

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Service Worker registration for PWA (the native app ships its files inside it, so it has none)
if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.()) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// Export for debugging
window.velocityGame = {
    get game() { return game; },
    get ui() { return ui; },
    resetProgress: () => {
        if (game && game.state) {
            game.state.reset();
            location.reload();
        }
    }
};
